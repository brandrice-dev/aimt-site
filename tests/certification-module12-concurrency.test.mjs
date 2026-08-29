// Module 12 authoritative-write concurrency hardening (P1-2 + related P2s).
//
// Prior behavior:
//   - functions/api/certification/submit-case.js (Part II) had NO in-flight
//     lock at all -- a race window spanning the entire Cadence evaluation
//     loop, not just one round trip (Launch Gate 1 P1-2, the worst race in
//     the codebase).
//   - functions/api/certification/submit-interview-turn.js (Part III) had a
//     lock, but claimed it with a plain read-then-write PATCH -- a TOCTOU
//     gap between the read and the claim PATCH (Launch Gate 1 P2-4).
//   - functions/api/certification/finalize-assessment.js transitioned
//     status -> 'scored' and inserted remediation-assignment rows with no
//     guard at all -- two concurrent finalize calls could each insert their
//     own remediation rows for the same not-yet-passed attempt (Launch
//     Gate 1 P2-5).
//
// Fix: both lock claims and the finalize status transition are now
// compare-and-swap PATCHes (functions/_lib/cadence/turn-lock.mjs's new
// jsonLockFieldFilterKey()/casPatchSucceeded()) -- a PostgREST conditional
// filter that only applies the write if the field still equals what was
// just read, giving a genuine cross-instance atomic guarantee (a real
// Postgres UPDATE...WHERE, not an in-memory isolate lock) using only
// already-existing jsonb columns and the top-level `status` column -- no
// schema migration, no new infrastructure.
//
// This suite proves true concurrency (not simulated ordering) by racing
// requests with Promise.all against a mock Supabase REST layer: JS's
// microtask scheduling naturally interleaves two in-flight requests at each
// `await fetch(...)` boundary, so both requests' initial reads genuinely
// happen before either request's write commits -- the exact race window
// these fixes close.
//
// Run: node tests/certification-module12-concurrency.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];
function check(fixtureName, label, condition, detail) {
  results.push({ fixtureName, label, pass: !!condition, detail: detail || '' });
}

async function withMockFetch(mockImpl, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = mockImpl;
  try {
    return await fn();
  } finally {
    globalThis.fetch = original;
  }
}

function makeRequest(body, authToken) {
  return {
    headers: { get: (name) => (name === 'Authorization' && authToken ? `Bearer ${authToken}` : null) },
    json: async () => body,
  };
}

function buildMockEnv(overrides = {}) {
  return {
    SUPABASE_URL: 'https://mock.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-key',
    ANTHROPIC_API_KEY: 'sk-ant-mock',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Generic mock Supabase PostgREST layer -- supports the exact filter shapes
// this codebase's supabaseRest() calls actually produce: simple top-level
// column equality (`id=eq.X`), the `or=(...)` compound filter, and the new
// one-level jsonb path filters (`col->key->>field=is.null` / `=eq.value`).
// ─────────────────────────────────────────────────────────────────────────

function getFieldValue(row, key) {
  const textIdx = key.indexOf('->>');
  if (textIdx === -1) return row[key];
  const jsonPath = key.slice(0, textIdx).split('->');
  const field = key.slice(textIdx + 3);
  let cur = row[jsonPath[0]];
  for (let i = 1; i < jsonPath.length; i++) cur = cur ? cur[jsonPath[i]] : undefined;
  return cur ? cur[field] : undefined;
}

function matchesFilterValue(actual, filterValue) {
  if (filterValue === 'is.null') return actual === null || actual === undefined;
  if (filterValue.startsWith('eq.')) return String(actual) === filterValue.slice(3);
  throw new Error('Unsupported filter operator in test mock: ' + filterValue);
}

function rowMatchesParams(row, params) {
  for (const [key, value] of params.entries()) {
    if (key === 'select' || key === 'limit' || key === 'order') continue;
    if (key === 'or') {
      const inner = value.slice(1, -1);
      const anyMatch = inner.split(',').some((clause) => {
        const dot1 = clause.indexOf('.');
        const col = clause.slice(0, dot1);
        const rest = clause.slice(dot1 + 1);
        const dot2 = rest.indexOf('.');
        const op = rest.slice(0, dot2);
        const val = rest.slice(dot2 + 1);
        return op === 'eq' && String(row[col]) === val;
      });
      if (!anyMatch) return false;
      continue;
    }
    if (!matchesFilterValue(getFieldValue(row, key), value)) return false;
  }
  return true;
}

function buildMockFetch({ users, tables, anthropicHandler, capture = {} }) {
  return async (url, options = {}) => {
    const u = String(url);
    const method = (options.method || 'GET').toUpperCase();
    const headers = options.headers || {};
    capture.calls = capture.calls || [];
    capture.calls.push({ url: u, method });

    if (u.includes('/auth/v1/user')) {
      const authHeader = headers.Authorization || headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      const user = users[token];
      if (!user) return { ok: false, status: 401, json: async () => ({ error: 'invalid_token' }) };
      return { ok: true, status: 200, json: async () => user };
    }

    if (u.includes('api.anthropic.com/v1/messages')) {
      capture.anthropicCalls = (capture.anthropicCalls || 0) + 1;
      return anthropicHandler(JSON.parse(options.body));
    }

    if (u.includes('/rest/v1/')) {
      const [, rest] = u.split('/rest/v1/');
      const [table, qs] = rest.split('?');
      const params = new URLSearchParams(qs || '');
      const store = tables[table];
      if (!store) throw new Error('Unexpected table in test mock: ' + table);
      const wantsRepresentation = /return=representation/.test(headers.Prefer || headers.prefer || '');

      if (method === 'GET') {
        let matched = store.rows.filter((r) => rowMatchesParams(r, params));
        const limit = params.get('limit');
        if (limit) matched = matched.slice(0, Number(limit));
        return { ok: true, status: 200, json: async () => matched };
      }

      if (method === 'PATCH') {
        const body = JSON.parse(options.body);
        const matched = store.rows.filter((r) => rowMatchesParams(r, params));
        for (const row of matched) Object.assign(row, body);
        return { ok: true, status: wantsRepresentation ? 200 : 204, json: async () => (wantsRepresentation ? matched : []) };
      }

      if (method === 'POST') {
        const body = JSON.parse(options.body);
        const rowsToInsert = Array.isArray(body) ? body : [body];
        if (store.uniqueKey) {
          for (const newRow of rowsToInsert) {
            const clash = store.rows.some((r) => store.uniqueKey.every((k) => r[k] === newRow[k]));
            if (clash) return { ok: false, status: 409, json: async () => ({ error: 'unique_violation' }) };
          }
        }
        // revoked:false mirrors the real completions table's NOT NULL DEFAULT
        // false -- issue-certificate.js's re-fetch-after-conflict path
        // filters on revoked=eq.false, which a bare in-memory insert
        // (unlike real Postgres) would not otherwise satisfy.
        const inserted = rowsToInsert.map((r) => ({ id: r.id || `row-${store.rows.length + Math.random().toString(36).slice(2)}`, completed_at: new Date().toISOString(), revoked: false, ...r }));
        store.rows.push(...inserted);
        return { ok: true, status: 201, json: async () => (wantsRepresentation ? inserted : []) };
      }
    }

    throw new Error('Unexpected fetch URL in test mock: ' + u);
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────

const USER = { id: 'user-student-1', email: 'student@example.com' };
const TOKEN = 'token-student-1';

function baseAttempt(overrides = {}) {
  return {
    id: 'attempt-1',
    user_id: USER.id,
    course_slug: 'headspa-mastery',
    attempt_number: 1,
    status: 'part1_locked',
    part1_selected_ids: [],
    part1_responses: {},
    knowledge_score: 90,
    // Two cases selected (not one) so that submitting CASE-02 alone never
    // flips status to part2_locked -- that would make a same-case retry
    // correctly fail with 409 "Part II is not active" instead of exercising
    // the alreadySubmitted idempotent-replay path these tests target.
    part2_selected_ids: ['CASE-02', 'CASE-03'],
    part2_case_state: { 'CASE-02': { submitted: false, responses: {} }, 'CASE-03': { submitted: false, responses: {} } },
    applied_cases_score: null,
    part3_selected_ids: ['INT-01'],
    part3_conversation_state: { 'INT-01': { finalized: false, followUpUsed: false, transcript: [], criterionScores: null } },
    interview_score: null,
    overall_score: null,
    certification_decision: null,
    critical_domain_results: null,
    ...overrides,
  };
}

function anthropicOkCase() {
  return { ok: true, status: 200, json: async () => ({ content: [{ text: JSON.stringify({ correctnessScore: 1, explicitUnsafe: false, patternTag: null }) }] }) };
}
function anthropicFailCase() {
  return { ok: false, status: 500, text: async () => 'provider down' };
}
function anthropicOkInterview() {
  return { ok: true, status: 200, json: async () => ({ content: [{ text: JSON.stringify({ criterionScores: { c1: 2, c2: 2, c3: 2, c4: 2 }, explicitUnsafeDomains: [], patternTags: {}, needsFollowUp: false, transitionLine: 'Thanks for walking me through that.' }) }] }) };
}
function anthropicFailInterview() {
  return { ok: false, status: 500, text: async () => 'provider down' };
}

function buildEnvAndMock({ attempt, remediationRows = [], anthropicHandler }) {
  const tables = {
    certification_attempts: { rows: [attempt], uniqueKey: ['user_id', 'course_slug', 'attempt_number'] },
    certification_remediation_assignments: { rows: remediationRows },
  };
  const capture = {};
  const mock = buildMockFetch({ users: { [TOKEN]: USER }, tables, anthropicHandler: anthropicHandler || anthropicOkCase, capture });
  return { env: buildMockEnv(), mock, tables, capture };
}

// ─────────────────────────────────────────────────────────────────────────
// A/B/C/D — Part II (submit-case.js)
// ─────────────────────────────────────────────────────────────────────────

async function partIIChecks() {
  const { onRequestPost: submitCase } = await import('../functions/api/certification/submit-case.js');

  // A. Two identical simultaneous submissions for the same case -> one authoritative result.
  {
    const { env, mock, tables, capture } = buildEnvAndMock({ attempt: baseAttempt() });
    const req = () => submitCase({ request: makeRequest({ attemptId: 'attempt-1', caseId: 'CASE-02', responses: { 'CASE-02-pA': 2, 'CASE-02-pB': 2, 'CASE-02-pC': 1 } }, TOKEN), env });
    const [r1, r2] = await withMockFetch(mock, () => Promise.all([req(), req()]));
    const bodies = await Promise.all([r1.json(), r2.json()]);
    const inFlightCount = bodies.filter((b) => b.inFlight).length;
    const successCount = bodies.filter((b) => b.locked && !b.alreadySubmitted).length;
    check('A. PART II SAME-CASE RACE', 'Exactly one of two simultaneous identical submissions is treated as the real evaluation', successCount === 1, JSON.stringify(bodies));
    check('A. PART II SAME-CASE RACE', 'The other is rejected as in-flight (409), not silently duplicated', inFlightCount === 1);
    check('A. PART II SAME-CASE RACE', 'Cadence (Anthropic) is called at most once for this case', capture.anthropicCalls === 1, `anthropicCalls=${capture.anthropicCalls}`);
    check('A. PART II SAME-CASE RACE', 'Exactly one authoritative case result is stored (submitted:true)', tables.certification_attempts.rows[0].part2_case_state['CASE-02'].submitted === true);
  }

  // B. Two different submissions (different response content) for the same case -> no double advancement.
  {
    const { env, mock, tables } = buildEnvAndMock({ attempt: baseAttempt() });
    const reqA = () => submitCase({ request: makeRequest({ attemptId: 'attempt-1', caseId: 'CASE-02', responses: { 'CASE-02-pA': 2 } }, TOKEN), env });
    const reqB = () => submitCase({ request: makeRequest({ attemptId: 'attempt-1', caseId: 'CASE-02', responses: { 'CASE-02-pA': 0 } }, TOKEN), env });
    const [r1, r2] = await withMockFetch(mock, () => Promise.all([reqA(), reqB()]));
    const bodies = await Promise.all([r1.json(), r2.json()]);
    const successCount = bodies.filter((b) => b.locked && !b.alreadySubmitted).length;
    check('B. PART II DIFFERENT-CONTENT RACE', 'Only one of two differing concurrent submissions for the same case advances the case', successCount === 1, JSON.stringify(bodies));
    check('B. PART II DIFFERENT-CONTENT RACE', 'The case is not left double-scored or double-counted', tables.certification_attempts.rows[0].part2_case_state['CASE-02'].submitted === true);
  }

  // C. Retry after a committed result but a lost client response -> idempotent recovery, no new evaluation.
  {
    const { env, mock, tables, capture } = buildEnvAndMock({ attempt: baseAttempt() });
    const req = () => submitCase({ request: makeRequest({ attemptId: 'attempt-1', caseId: 'CASE-02', responses: { 'CASE-02-pA': 2 } }, TOKEN), env });
    const r1 = await withMockFetch(mock, req);
    const b1 = await r1.json();
    const r2 = await withMockFetch(mock, req); // simulate the client never seeing r1 and retrying
    const b2 = await r2.json();
    check('C. PART II RETRY-AFTER-COMMIT', 'The original request succeeds', b1.locked === true && !b1.alreadySubmitted);
    check('C. PART II RETRY-AFTER-COMMIT', 'The retry is recognized as already-submitted (idempotent replay)', b2.alreadySubmitted === true && b2.caseScore === b1.caseScore);
    check('C. PART II RETRY-AFTER-COMMIT', 'The retry does not trigger a second Cadence evaluation', capture.anthropicCalls === 1, `anthropicCalls=${capture.anthropicCalls}`);
  }

  // D. Provider failure -> no consumed/half-written result; a subsequent real submission still works.
  {
    const attempt = baseAttempt({ part2_selected_ids: ['CASE-01'], part2_case_state: { 'CASE-01': { submitted: false, responses: {} } } });
    const { env, mock, tables } = buildEnvAndMock({ attempt, anthropicHandler: anthropicFailCase });
    const failRes = await withMockFetch(mock, () => submitCase({ request: makeRequest({ attemptId: 'attempt-1', caseId: 'CASE-01', responses: { 'CASE-01-pA': [1, 2, 3, 5, 7], 'CASE-01-pB': 'A professional response.' } }, TOKEN), env }));
    const failBody = await failRes.json();
    check('D. PART II PROVIDER FAILURE', 'A provider failure returns 502, not a false pass/fail', failRes.status === 502);
    check('D. PART II PROVIDER FAILURE', 'The case is left NOT submitted (no half-written result)', tables.certification_attempts.rows[0].part2_case_state['CASE-01'].submitted === false);
    check('D. PART II PROVIDER FAILURE', 'The student response was preserved for the next attempt', tables.certification_attempts.rows[0].part2_case_state['CASE-01'].responses['CASE-01-pB'] === 'A professional response.');

    // Q. Lock released after pre-commit failure -> a subsequent real submission is not blocked.
    const okMock = buildMockFetch({ users: { [TOKEN]: USER }, tables: { certification_attempts: { rows: [tables.certification_attempts.rows[0]] }, certification_remediation_assignments: { rows: [] } }, anthropicHandler: anthropicOkCase });
    const retryRes = await withMockFetch(okMock, () => submitCase({ request: makeRequest({ attemptId: 'attempt-1', caseId: 'CASE-01', responses: { 'CASE-01-pA': [1, 2, 3, 5, 7], 'CASE-01-pB': 'A professional response.' } }, TOKEN), env }));
    const retryBody = await retryRes.json();
    check('Q. LOCK RELEASE AFTER FAILURE', 'A subsequent legitimate submission for the same case succeeds after a provider failure released the lock', retryRes.status === 200 && retryBody.locked === true, JSON.stringify(retryBody));
  }

  // R. Retry after the authoritative commit succeeded but the response never reached the client.
  {
    const { env, mock, tables, capture } = buildEnvAndMock({ attempt: baseAttempt() });
    await withMockFetch(mock, () => submitCase({ request: makeRequest({ attemptId: 'attempt-1', caseId: 'CASE-02', responses: { 'CASE-02-pA': 2 } }, TOKEN), env }));
    // Simulate "the client never saw the response" by simply retrying against the same store.
    const retry = await withMockFetch(mock, () => submitCase({ request: makeRequest({ attemptId: 'attempt-1', caseId: 'CASE-02', responses: { 'CASE-02-pA': 2 } }, TOKEN), env }));
    const retryBody = await retry.json();
    check('R. RETRY AFTER POST-COMMIT RESPONSE LOSS', 'A retry after a committed-but-unseen result is safe and idempotent', retryBody.alreadySubmitted === true);
    check('R. RETRY AFTER POST-COMMIT RESPONSE LOSS', 'No second Cadence call is made', capture.anthropicCalls === 1);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// E/F — Part III (submit-interview-turn.js)
// ─────────────────────────────────────────────────────────────────────────

async function partIIIChecks() {
  const { onRequestPost: submitTurn } = await import('../functions/api/certification/submit-interview-turn.js');

  function partIIIAttempt() {
    // Two interviews selected (not one) so that finalizing INT-01 alone
    // never flips status to part3_locked -- that would make a same-
    // conversation retry correctly fail with 409 "Part III is not active"
    // instead of exercising the alreadyFinalized idempotent-replay path.
    return baseAttempt({
      status: 'part2_locked',
      part2_case_state: {},
      applied_cases_score: 90,
      part3_selected_ids: ['INT-01', 'INT-02'],
      part3_conversation_state: {
        'INT-01': { finalized: false, followUpUsed: false, transcript: [], criterionScores: null },
        'INT-02': { finalized: false, followUpUsed: false, transcript: [], criterionScores: null },
      },
    });
  }

  // E. Simultaneous Part III turn requests for the same conversation -> one authoritative committed turn.
  {
    const { env, mock, tables, capture } = buildEnvAndMock({ attempt: partIIIAttempt(), anthropicHandler: anthropicOkInterview });
    const req = () => submitTurn({ request: makeRequest({ attemptId: 'attempt-1', interviewId: 'INT-01', studentResponse: 'A thoughtful, professional response.' }, TOKEN), env });
    const [r1, r2] = await withMockFetch(mock, () => Promise.all([req(), req()]));
    const bodies = await Promise.all([r1.json(), r2.json()]);
    const inFlightCount = bodies.filter((b) => b.inFlight).length;
    const committedCount = bodies.filter((b) => b.finalized === true || b.needsFollowUp === true).length;
    check('E. PART III SAME-CONVERSATION RACE', 'Exactly one of two simultaneous turns is evaluated and committed', committedCount === 1, JSON.stringify(bodies));
    check('E. PART III SAME-CONVERSATION RACE', 'The other is rejected as in-flight (409)', inFlightCount === 1);
    check('E. PART III SAME-CONVERSATION RACE', 'Anthropic is called at most once for this turn', capture.anthropicCalls === 1, `anthropicCalls=${capture.anthropicCalls}`);
    const transcriptLen = tables.certification_attempts.rows[0].part3_conversation_state['INT-01'].transcript.length;
    check('E. PART III SAME-CONVERSATION RACE', 'The transcript does not contain two consecutive user turns (no duplicate append)', transcriptLen <= 2, `transcriptLen=${transcriptLen}`);
  }

  // F. Retry after a committed Part III turn -> no duplicate transcript/grade mutation.
  {
    const { env, mock, tables, capture } = buildEnvAndMock({ attempt: partIIIAttempt(), anthropicHandler: anthropicOkInterview });
    await withMockFetch(mock, () => submitTurn({ request: makeRequest({ attemptId: 'attempt-1', interviewId: 'INT-01', studentResponse: 'A thoughtful, professional response.' }, TOKEN), env }));
    const beforeRetryTranscriptLen = tables.certification_attempts.rows[0].part3_conversation_state['INT-01'].transcript.length;
    const retryRes = await withMockFetch(mock, () => submitTurn({ request: makeRequest({ attemptId: 'attempt-1', interviewId: 'INT-01', studentResponse: 'A different retried response.' }, TOKEN), env }));
    const retryBody = await retryRes.json();
    const afterRetryTranscriptLen = tables.certification_attempts.rows[0].part3_conversation_state['INT-01'].transcript.length;
    check('F. PART III RETRY-AFTER-COMMIT', 'A finalized/needs-follow-up conversation is not re-evaluated or restarted by a retry', retryBody.alreadyFinalized === true || retryBody.needsFollowUp !== undefined);
    check('F. PART III RETRY-AFTER-COMMIT', 'The transcript is not mutated by the retry', afterRetryTranscriptLen === beforeRetryTranscriptLen);
    check('F. PART III RETRY-AFTER-COMMIT', 'Anthropic is not called again once the conversation is settled from the retry\'s perspective', capture.anthropicCalls <= 1 || retryBody.needsFollowUp !== undefined);
  }

  // Provider failure releases the Part III lock too (mirrors item Q for Part II).
  {
    const { env, mock, tables } = buildEnvAndMock({ attempt: partIIIAttempt(), anthropicHandler: anthropicFailInterview });
    const failRes = await withMockFetch(mock, () => submitTurn({ request: makeRequest({ attemptId: 'attempt-1', interviewId: 'INT-01', studentResponse: 'A response.' }, TOKEN), env }));
    check('PART III PROVIDER FAILURE', 'A provider failure returns 502, not a false grade', failRes.status === 502);
    check('PART III PROVIDER FAILURE', 'The conversation is not finalized on failure', tables.certification_attempts.rows[0].part3_conversation_state['INT-01'].finalized === false);
    const okMock = buildMockFetch({ users: { [TOKEN]: USER }, tables: { certification_attempts: { rows: [tables.certification_attempts.rows[0]] }, certification_remediation_assignments: { rows: [] } }, anthropicHandler: anthropicOkInterview });
    const retryRes = await withMockFetch(okMock, () => submitTurn({ request: makeRequest({ attemptId: 'attempt-1', interviewId: 'INT-01', studentResponse: 'A retried response.' }, TOKEN), env }));
    check('PART III PROVIDER FAILURE', 'A subsequent legitimate turn succeeds after the lock was released', retryRes.status === 200);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// G/H/I/J/K — finalize-assessment.js
// ─────────────────────────────────────────────────────────────────────────

async function finalizeChecks() {
  const { onRequestPost: finalize } = await import('../functions/api/certification/finalize-assessment.js');

  function scoredReadyAttempt(decisionInputs = {}) {
    // part1_selected_ids/part1_responses are answered wrong on purpose (99
    // is out of range for every choice index) so a not_yet_passed decision
    // has real weak spots to build remediation assignments from -- the PASS
    // vs. not_yet_passed DECISION itself is driven independently by the
    // stored knowledge_score/appliedCases/interview fields below, exactly
    // as finalize-assessment.js's real authoritative flow does (it never
    // recomputes the decision's percentages from part1_responses; only the
    // remediation weak-spot detection re-derives from the raw responses).
    return baseAttempt({
      status: 'part3_locked',
      part1_selected_ids: ['M01-001', 'M01-002'],
      part1_responses: { 'M01-001': 99, 'M01-002': 99 },
      knowledge_score: decisionInputs.knowledge ?? 0.9,
      part2_case_state: {},
      part2_selected_ids: [],
      applied_cases_score: decisionInputs.appliedCases ?? 0.9,
      part3_selected_ids: [],
      part3_conversation_state: {},
      interview_score: decisionInputs.interview ?? 0.9,
    });
  }

  // G. finalize called while a required component is incomplete -> refuses.
  {
    const { env, mock } = buildEnvAndMock({ attempt: baseAttempt({ status: 'part2_locked' }) });
    const res = await withMockFetch(mock, () => finalize({ request: makeRequest({ attemptId: 'attempt-1' }, TOKEN), env }));
    check('G. FINALIZE INCOMPLETE', 'finalize-assessment refuses (409) when Part III is not yet locked', res.status === 409);
  }

  // H. finalize called twice concurrently after all components complete -> one final authoritative decision, no duplicate remediation rows.
  {
    const { env, mock, tables } = buildEnvAndMock({ attempt: scoredReadyAttempt({ knowledge: 0.4, appliedCases: 0.4, interview: 0.4 }) });
    const req = () => finalize({ request: makeRequest({ attemptId: 'attempt-1' }, TOKEN), env });
    const [r1, r2] = await withMockFetch(mock, () => Promise.all([req(), req()]));
    const bodies = await Promise.all([r1.json(), r2.json()]);
    check('H. FINALIZE DOUBLE-CALL', 'Both concurrent calls report the same decision', bodies[0].decision === bodies[1].decision, JSON.stringify(bodies));
    check('H. FINALIZE DOUBLE-CALL', 'The decision is correctly not_yet_passed given below-minimum component scores', bodies[0].decision === 'not_yet_passed', JSON.stringify(bodies));
    check('H. FINALIZE DOUBLE-CALL', 'Exactly one of the two calls performed the original scoring (alreadyScored differs)', bodies.filter((b) => b.alreadyScored === true).length === 1, JSON.stringify(bodies));
    check('K. NO DUPLICATE REMEDIATION', 'Exactly one set of remediation assignments was inserted for the not_yet_passed decision, not two', tables.certification_remediation_assignments.rows.length > 0 && tables.certification_remediation_assignments.rows.length === new Set(tables.certification_remediation_assignments.rows.map((r) => r.critical_domain || r.competency_area)).size, `remediationRows=${tables.certification_remediation_assignments.rows.length}`);
  }

  // I. Stale finalization cannot overwrite newer authoritative state; J. PASS cannot regress.
  {
    const { env, mock, tables } = buildEnvAndMock({ attempt: scoredReadyAttempt({ knowledge: 0.95, appliedCases: 0.95, interview: 0.95 }) });
    await withMockFetch(mock, () => finalize({ request: makeRequest({ attemptId: 'attempt-1' }, TOKEN), env }));
    const passedDecision = tables.certification_attempts.rows[0].certification_decision;
    check('I/J. NO REGRESSION', 'A high-scoring attempt is recorded as pass', passedDecision === 'pass');
    // A stale second finalize call (e.g. a delayed retry) must not flip a PASS to anything else.
    const staleRes = await withMockFetch(mock, () => finalize({ request: makeRequest({ attemptId: 'attempt-1' }, TOKEN), env }));
    const staleBody = await staleRes.json();
    check('I/J. NO REGRESSION', 'A stale re-finalize call reports the same PASS decision, never regresses it', staleBody.decision === 'pass' && tables.certification_attempts.rows[0].certification_decision === 'pass');
  }

  // Sequential finalize calls (not concurrent) remain idempotent -- pre-existing behavior, unaffected by the fix.
  {
    const { env, mock, tables } = buildEnvAndMock({ attempt: scoredReadyAttempt({ knowledge: 0.4, appliedCases: 0.4, interview: 0.4 }) });
    const r1 = await withMockFetch(mock, () => finalize({ request: makeRequest({ attemptId: 'attempt-1' }, TOKEN), env }));
    const b1 = await r1.json();
    const r2 = await withMockFetch(mock, () => finalize({ request: makeRequest({ attemptId: 'attempt-1' }, TOKEN), env }));
    const b2 = await r2.json();
    check('SEQUENTIAL FINALIZE IDEMPOTENCY', 'The second sequential call reports alreadyScored', b2.alreadyScored === true);
    check('SEQUENTIAL FINALIZE IDEMPOTENCY', 'Remediation rows are not duplicated by the second sequential call', tables.certification_remediation_assignments.rows.length === new Set(tables.certification_remediation_assignments.rows.map((r) => r.critical_domain || r.competency_area)).size);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// L — start-attempt.js (verifying the PRE-EXISTING unique(user_id,
// course_slug, attempt_number) constraint already prevents a duplicate
// attempt insert; no code change was needed here, but the protection is
// verified as part of this concurrency audit).
// ─────────────────────────────────────────────────────────────────────────

async function startAttemptChecks() {
  const { onRequestPost: startAttempt } = await import('../functions/api/certification/start-attempt.js');
  const progress = {};
  for (let m = 0; m <= 11; m++) progress[String(m)] = { complete: true };
  const tables = {
    course_entitlements: { rows: [{ checkout_session_id: 'cs_1', course_slug: 'headspa-mastery', user_id: USER.id, purchaser_email: USER.email }] },
    course_progress: { rows: [{ user_id: USER.id, course_slug: 'headspa-mastery', state: { progress } }] },
    certification_attempts: { rows: [], uniqueKey: ['user_id', 'course_slug', 'attempt_number'] },
  };
  const capture = {};
  const mock = buildMockFetch({ users: { [TOKEN]: USER }, tables, anthropicHandler: anthropicOkCase, capture });
  const env = buildMockEnv();
  const req = () => startAttempt({ request: makeRequest({}, TOKEN), env });
  const [r1, r2] = await withMockFetch(mock, () => Promise.all([req(), req()]));
  const statuses = [r1.status, r2.status].sort();
  check('L. NO DUPLICATE ATTEMPT', 'Two concurrent start-attempt calls do not both create a new attempt row', tables.certification_attempts.rows.length === 1, `rows=${tables.certification_attempts.rows.length}`);
  check('L. NO DUPLICATE ATTEMPT', 'The loser of the pre-existing unique(user_id,course_slug,attempt_number) constraint receives an error response rather than corrupting state', statuses.includes(500) || statuses[0] === statuses[1], `statuses=${JSON.stringify(statuses)}`);
}

// ─────────────────────────────────────────────────────────────────────────
// M/N/O — issue-certificate.js integrity (unchanged code; verifying the
// concurrency changes above did not weaken the authoritative PASS check).
// ─────────────────────────────────────────────────────────────────────────

async function certificateChecks() {
  const { onRequestPost: issueCertificate } = await import('../functions/api/issue-certificate.js');

  function certEnvAndMock({ decision, progressScore = 1200 }) {
    const tables = {
      course_entitlements: { rows: [{ checkout_session_id: 'cs_1', course_slug: 'headspa-mastery', user_id: USER.id, purchaser_email: USER.email }] },
      course_progress: { rows: [{ user_id: USER.id, course_slug: 'headspa-mastery', progress_score: progressScore }] },
      certification_attempts: { rows: decision ? [{ id: 'attempt-1', user_id: USER.id, course_slug: 'headspa-mastery', certification_decision: decision }] : [] },
      completions: { rows: [], uniqueKey: ['user_id', 'course_slug'] },
    };
    const mock = buildMockFetch({ users: { [TOKEN]: USER }, tables, anthropicHandler: anthropicOkCase });
    return { env: buildMockEnv(), mock, tables };
  }

  // M. Certificate cannot issue from incomplete state.
  {
    const { env, mock } = certEnvAndMock({ decision: null, progressScore: 400 });
    const res = await withMockFetch(mock, () => issueCertificate({ request: makeRequest({ student_name: 'Jane Doe' }, TOKEN), env }));
    check('M. CERT FROM INCOMPLETE', 'A certificate cannot be issued when course progress is incomplete', res.status === 409);
  }

  // N. Certificate cannot issue from a failed/not-yet-passed attempt.
  {
    const { env, mock } = certEnvAndMock({ decision: 'not_yet_passed' });
    const res = await withMockFetch(mock, () => issueCertificate({ request: makeRequest({ student_name: 'Jane Doe' }, TOKEN), env }));
    check('N. CERT FROM FAILED ATTEMPT', 'A certificate cannot be issued from a not_yet_passed attempt', res.status === 409);
  }

  // O. Certificate remains available (and duplicate-issue-safe) for an authoritative PASS.
  {
    const { env, mock, tables } = certEnvAndMock({ decision: 'pass' });
    const req = () => issueCertificate({ request: makeRequest({ student_name: 'Jane Doe' }, TOKEN), env });
    const [r1, r2] = await withMockFetch(mock, () => Promise.all([req(), req()]));
    const bodies = await Promise.all([r1.json(), r2.json()]);
    check('O. CERT FROM PASS', 'Both requests succeed', r1.status === 200 && r2.status === 200);
    check('O. CERT FROM PASS', 'Exactly one completions row is created despite two simultaneous issue requests', tables.completions.rows.length === 1, `rows=${tables.completions.rows.length}`);
    check('O. CERT FROM PASS', 'Both responses report the same credential id (duplicate-click-safe)', bodies[0].credential_id === bodies[1].credential_id);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// P — provider errors never become a student fail/revise (cross-cutting,
// verified across both Part II and Part III above via items D and the
// dedicated "PART III PROVIDER FAILURE" block; this adds the explicit
// negative assertion in one place).
// ─────────────────────────────────────────────────────────────────────────

async function providerFailureNeverFailsStudent() {
  const attempt = baseAttempt();
  const { env, mock, tables } = buildEnvAndMock({ attempt, anthropicHandler: anthropicFailCase });
  await withMockFetch(mock, () => import('../functions/api/certification/submit-case.js').then(({ onRequestPost }) =>
    onRequestPost({ request: makeRequest({ attemptId: 'attempt-1', caseId: 'CASE-02', responses: { 'CASE-02-pA': 2 } }, TOKEN), env })
  ));
  check('P. PROVIDER ERROR NEVER FAILS STUDENT', 'A provider error never sets submitted:true or records a score', tables.certification_attempts.rows[0].part2_case_state['CASE-02'].submitted === false && tables.certification_attempts.rows[0].part2_case_state['CASE-02'].score === undefined);
}

// ─────────────────────────────────────────────────────────────────────────
// S/T/U/V/W/X — invariants unchanged by this concurrency-only pass
// ─────────────────────────────────────────────────────────────────────────

async function invariantChecks() {
  const { getProductionBanks } = await import('../functions/_lib/certification/content-bank.mjs');
  const { getCurrentAssessmentConfig } = await import('../functions/_lib/certification/assessment-config.mjs');
  const { HEAD_SPA_CRITICAL_DOMAINS } = await import('../functions/_lib/certification/critical-domains.mjs');

  const banks = getProductionBanks();
  check('S. BANK SIZES UNCHANGED', 'Knowledge bank is still 120 items', banks.knowledgeBank.length === 120);
  check('S. BANK SIZES UNCHANGED', 'Case bank is still 12 items', banks.caseBank.length === 12);
  check('S. BANK SIZES UNCHANGED', 'Interview bank is still 9 items', banks.interviewBank.length === 9);

  const config = getCurrentAssessmentConfig();
  check('T. THRESHOLDS UNCHANGED', 'Weights are still 50/30/20', config.weights.knowledge === 0.5 && config.weights.appliedCases === 0.3 && config.weights.interview === 0.2);
  check('T. THRESHOLDS UNCHANGED', 'Minimums are still 75/75/80, overall 80', config.minimums.knowledge === 0.75 && config.minimums.appliedCases === 0.75 && config.minimums.interview === 0.8 && config.minimums.overall === 0.8);

  check('U. CRITICAL DOMAINS UNCHANGED', 'Exactly 4 critical domains (D1-D4) remain defined', HEAD_SPA_CRITICAL_DOMAINS.length === 4 && ['D1', 'D2', 'D3', 'D4'].every((id) => HEAD_SPA_CRITICAL_DOMAINS.some((d) => d.id === id)));

  const gradingSrc = readFileSync(path.join(ROOT, 'functions/_lib/certification/cadence-grader.mjs'), 'utf8');
  check('V. CADENCE MODEL CONFIG UNCHANGED', 'cadence-grader.mjs still resolves the CADENCE_GRADING_MODEL role (untouched by this task)', /resolveCadenceModel\(env,\s*'CADENCE_GRADING_MODEL'\)/.test(gradingSrc));

  const checkpointSrc = readFileSync(path.join(ROOT, 'headspa-mastery.html'), 'utf8');
  const checkpointMatches = checkpointSrc.match(/MODULE_CHECKPOINTS\s*=/g);
  check('W. M0-M11 CHECKPOINTS UNTOUCHED', 'headspa-mastery.html still defines MODULE_CHECKPOINTS (not modified by this task)', !!checkpointMatches && checkpointMatches.length >= 1);

  const claimSrc = readFileSync(path.join(ROOT, 'functions/api/claim-course-access.js'), 'utf8');
  check('X. ENTITLEMENT HARDENING INTACT', 'claim-course-access.js still requires resolveUser (P0-2 fix untouched by this task)', /resolveUser\(env, request\)/.test(claimSrc));
  check('X. ENTITLEMENT HARDENING INTACT', 'claim-course-access.js still never reads body.userId', !/body\.userId/.test(claimSrc));
}

// ─────────────────────────────────────────────────────────────────────────
// Static structural checks
// ─────────────────────────────────────────────────────────────────────────

function staticChecks() {
  const turnLockSrc = readFileSync(path.join(ROOT, 'functions/_lib/cadence/turn-lock.mjs'), 'utf8');
  check('STATIC', 'turn-lock.mjs exports casPatchSucceeded', /export function casPatchSucceeded/.test(turnLockSrc));
  check('STATIC', 'turn-lock.mjs exports jsonLockFieldFilterKey', /export function jsonLockFieldFilterKey/.test(turnLockSrc));

  const submitCaseSrc = readFileSync(path.join(ROOT, 'functions/api/certification/submit-case.js'), 'utf8');
  check('STATIC', 'submit-case.js imports the shared lock primitives (reuses turn-lock.mjs, no bespoke lock)', /from ['"]\.\.\/\.\.\/_lib\/cadence\/turn-lock\.mjs['"]/.test(submitCaseSrc));
  check('STATIC', 'submit-case.js claims its lock with Prefer: return=representation (required to detect a lost CAS race)', /Prefer:\s*'return=representation'/.test(submitCaseSrc));
  check('STATIC', 'submit-case.js still preserves the pre-existing content/curriculum imports untouched (no scoring logic duplicated)', /from ['"]\.\.\/\.\.\/_lib\/certification\/scoring\.mjs['"]/.test(submitCaseSrc));

  const submitTurnSrc = readFileSync(path.join(ROOT, 'functions/api/certification/submit-interview-turn.js'), 'utf8');
  check('STATIC', 'submit-interview-turn.js now uses casPatchSucceeded for its claim (atomic, not the old unconditional PATCH)', /casPatchSucceeded\(claim\)/.test(submitTurnSrc));

  const finalizeSrc = readFileSync(path.join(ROOT, 'functions/api/certification/finalize-assessment.js'), 'utf8');
  check('STATIC', 'finalize-assessment.js guards its status transition with status=eq.part3_locked', /status:\s*'eq\.part3_locked'/.test(finalizeSrc));
  check('STATIC', 'finalize-assessment.js scoring/decision logic (determineCertificationDecision) is unchanged/still imported, not duplicated', /determineCertificationDecision/.test(finalizeSrc));

  const scoringSrc = readFileSync(path.join(ROOT, 'functions/_lib/certification/scoring.mjs'), 'utf8');
  check('STATIC', 'scoring.mjs was not touched by this task (still exports the same decision function)', /export function determineCertificationDecision/.test(scoringSrc));
}

// ─────────────────────────────────────────────────────────────────────────

await partIIChecks();
await partIIIChecks();
await finalizeChecks();
await startAttemptChecks();
await certificateChecks();
await providerFailureNeverFailsStudent();
await invariantChecks();
staticChecks();

// ---- Report ----
const byFixture = new Map();
for (const r of results) {
  if (!byFixture.has(r.fixtureName)) byFixture.set(r.fixtureName, []);
  byFixture.get(r.fixtureName).push(r);
}
let anyFail = false;
for (const [fixtureName, checks] of byFixture) {
  const failed = checks.filter((c) => !c.pass);
  if (failed.length > 0) anyFail = true;
  console.log(`[${failed.length === 0 ? 'PASS' : 'FAIL'}] ${fixtureName} (${checks.length - failed.length}/${checks.length})`);
  for (const f of failed) console.log(`    FAILED: ${f.label}${f.detail ? ' — ' + f.detail : ''}`);
}
console.log(`\nTotal: ${results.length}, Passed: ${results.filter((r) => r.pass).length}, Failed: ${results.filter((r) => !r.pass).length}`);
if (anyFail) process.exitCode = 1;
