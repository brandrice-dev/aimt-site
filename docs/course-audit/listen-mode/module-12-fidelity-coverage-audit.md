# Module 12 — Listen Mode Fidelity + Assessment-Integrity Audit (v1, verified/corrected)

**Authority:** current live `COPY.stateA` object in
`assets/js/module12-certification.js`, lines 35–107 (read fresh and in
full, 2026-09-20), plus `renderStateA()` (lines 795–860, confirms render
order and confirms the only interactive elements are the "Listen with
Cadence" entry button and the "Start Final Exam" button — both UI
chrome), `onStartExam()` (lines 862–876, confirms the player-teardown
boundary), and `HEAD_SPA_ASSESSMENT_CONFIG_V1` in
`functions/_lib/certification/assessment-config.mjs` (lines 42–123, read
to cross-check the numeric thresholds/weights/counts `COPY.stateA`
states for the student — a config file of weights and counts, not exam
content itself).

This module is fundamentally different from Modules 0–11: Module 12's
real content is a scored, server-authoritative certification exam.
**This audit exists to prove two things, not one:** (1) complete
narration coverage of the safe pre-assessment orientation screen, and
(2) zero exposure of any scored content anywhere in that narration. Both
are required; neither substitutes for the other.

---

## Part 1 — Safe-content coverage (State A / Exam Ready)

### Headline/content inventory

Every substantive visible element of `renderStateA()`, in live render
order.

| # | Live element | Content | Narration | Chunk |
|---|---|---|---|---|
| 1 | `.mh-eyebrow` + `<h1>` | "Module 12 · Final Exam" / "Final Certification Assessment" | Folded into opening line ("Welcome to Module 12 — the Final Certification Assessment") — **added in this pass; v1 never spoke it** | M12-01 |
| 2 | `c.opening` (4 paragraphs) | Course complete / assessment is different / recall-connect-apply / no countdown clock | All 4 narrated verbatim/near-verbatim | M12-01 |
| 3 | "Listen with Cadence" button + meta | Entry-point UI, "~4 min" | **Excluded — UI chrome/navigation control, not content** | — |
| 4 | `c.howItWorksTitle` | "How the assessment works" | Folded ("Here's how the assessment works, in three parts") | M12-01 |
| 5 | `c.parts[0]` (num/title/meta/body, behind "What to expect" disclosure) | Knowledge & Retention: 40 questions, 50%, 4 body bullets | All narrated in full — 40 questions, 50%, all 4 bullets (mixed across Modules 1–11, foundational vs. realistic-choice framing, navigation/review behavior, section-lock behavior) | M12-01 |
| 6 | `c.parts[1]` | Applied Practitioner Cases: 4 cases, 30%, 4 body bullets | All narrated in full — 4 cases, 30%, all 4 bullets (general format, multi-domain framing, structured-vs-explain, section-lock) | M12-01 |
| 7 | `c.parts[2]` | Practitioner Conversation with Cadence: 3 conversations, 20%, 7 body bullets | All narrated in full — 3 conversations, 20%, all 7 bullets (general format only — no actual prompt/case named) | M12-01 |
| 8 | `c.passingTitle` + `c.passingIntro` | "What passing requires" + competency-not-completion framing | Both narrated verbatim | M12-01 |
| 9 | `c.passingMetrics` (5 tiles) + `c.passingBullets` (5 items, behind "How these are evaluated" disclosure) | 80% overall / 75% Knowledge / 75% Applied Cases / 80% Practitioner Conversation / all critical competencies cleared | Narrated once as 5 spoken thresholds — `passingMetrics` and `passingBullets` are the same 5 facts in two redundant visual forms (compact tiles vs. sentence bullets); narrating the fact set once satisfies Section E parity without duplicate readback. Cross-checked numerically against `HEAD_SPA_ASSESSMENT_CONFIG_V1.minimums` (0.75/0.75/0.8/0.8) — exact match | M12-01 |
| 10 | `c.passingClose` (2 paragraphs) | Strong score can't override critical-domain issue / one missed MCQ ≠ automatic critical failure | Both narrated verbatim | M12-01 |
| 11 | `c.checkpointTitle` | "What about the checkpoints you already completed?" | Narrated verbatim as its own headline | M12-01 |
| 12 | `c.checkpointLead` | "Prior checkpoints established readiness. They do not secretly change the final exam score." | Narrated as its own distinct beat — **added in this pass; v1 covered the idea only implicitly via checkpointBody, never this exact sentence** | M12-01 |
| 13 | `c.checkpointBody` (4 paragraphs, behind "Read more" disclosure) | Cadence checked understanding throughout / checkpoints made you eligible / checkpoint answers don't secretly add/subtract points / history may inform remediation | All 4 narrated, first-person self-reference converted ("I've been checking...") | M12-01 |
| 14 | `c.integrityTitle` (key-point eyebrow) | "Before you begin" | Narrated verbatim as its own label | M12-01 |
| 15 | `c.integrityBody` (5 sentences/paragraphs) | Parts I/II reflect own judgment / no external AI, no reopening course to search / Part III intentionally uses Cadence / progress saved / submitted sections lock | All 5 narrated, first-person self-reference converted ("Part three intentionally uses me") | M12-01 |
| 16 | `c.finalEncouragement` (3 paragraphs, ends "Good luck.") | No perfect score/wording needed / read carefully, trust learning, think about the whole situation / Good luck | All 3 narrated verbatim, narration ends on "Good luck." — same point the live screen ends before the Start Final Exam button | M12-01 |
| 17 | `c.button` ("Start Final Exam") | Button label | **Excluded — button mechanics, per explicit task instruction not to narrate them** | — |

**Total substantive elements: 15 (rows 1–2, 4–16 excluding the 2 chrome
rows 3 and 17).** **Narrated: 15 of 15. Excluded: 2 (both UI
controls).** Zero unexplained omissions. Two corrections vs. the original
v1 take (rows 1 and 12) are documented above and in the script doc.

### AIMT pronunciation

4 occurrences of "AIMT" in `COPY.stateA`, all identified by direct grep
against the live source text (not memory): `parts[0].body[1]` ("what
AIMT taught"), `parts[2].body[4]` ("AIMT-defined competency criteria"),
`passingClose` ("AIMT looks for the actual reasoning"), `checkpointBody`
("may help AIMT identify"). **Current form (2026-09-20, second
correction): single-spaced "A I M T," no punctuation.** History: the
module's original audio used this same single-spaced form and was found
to render as "Am-tee" (matching Module 10's finding on this exact
voice/model), so it was first corrected to comma-separated "A, I, M, T";
the owner then reported the comma form caused Jane/`eleven_v3` to pause
too heavily between letters and sound choppy, so it was corrected a
second time back to single-spaced — this time confirmed as the
intentional final form (no punctuation, natural connected speech,
reciting four distinct letters without collapsing into the word "aim").
This is now the permanent course-wide rule. Verified byte-level that the
second correction changed nothing else in the payload (12 commas
removed, zero other characters touched).

### Cadence narrator perspective (Section J)

6 "Cadence" occurrences found by direct grep:

| Occurrence | Category | Disposition |
|---|---|---|
| `parts[2].title`: "Practitioner Conversation with Cadence" | A — named assessment component title | Kept as-is (third person is correct — this is a proper title, not self-reference) |
| `parts[2].body[1]`: "conversation with Cadence" | B — narrator self-reference | Converted: "conversation with me" |
| `parts[2].body[4]`: "Cadence evaluates...she needs" | B — narrator self-reference | Converted: "I evaluate...I need" |
| `passingMetrics` label: "Cadence Conversation" | A — named metric label | Kept as-is (a UI label naming the score component, not Cadence speaking about herself) |
| `checkpointBody`: "Cadence has been checking" | B — narrator self-reference | Converted: "I've been checking" |
| `integrityBody`: "Part III intentionally uses Cadence" | B (judgment call) — narrator describing her own role in the design | Converted: "Part III intentionally uses me." Flagged as a judgment call in the script doc (borderline vs. a named-mechanism reference), consistent with how the original v1 take already resolved this exact sentence the same way before Section J was ever written down. |

All 4 category-B conversions were **already correct in the original v1
take** (written 2026-08-31, before Section J existed as a written rule) —
re-confirmed, not re-derived, this pass. No new narrator-perspective
defect was found or introduced.

---

## Part 2 — Scored-content leakage audit (must be zero)

**Method:** every excluded category below was identified by file
existence, structural/numeric cross-reference, or content-blind
structural counts (e.g. `grep -c` against a heading pattern) — never by
reading actual question stems, case scenarios, conversation prompts,
answer choices, or rubric text. No scored item's substantive content was
read, quoted, or paraphrased anywhere in this audit, the script, or the
narration.

| Excluded category | Location | What was and wasn't inspected |
|---|---|---|
| Knowledge & Retention item bank (120 items) | `docs/course-audit/modules/module-12-final-knowledge-bank.md` | Count (120) independently confirmed via a content-blind structural header count (`grep -c "^### "`); no question stem, answer choice, or rationale read |
| Applied Practitioner Case bank (12 items, per task) | `docs/course-audit/modules/module-12-final-applied-cases.md` | File existence and line count only confirmed directly; item count taken from the task's own stated figure, not independently re-derived, to avoid unnecessary additional inspection of scored content |
| Practitioner Conversation bank (9 items, per task) | `docs/course-audit/modules/module-12-final-interview-bank.md` | File existence and line count only confirmed directly; item count taken from the task's own stated figure, same reasoning as above |
| All answer choices | (within the above banks) | Not opened beyond the structural checks above |
| All Practitioner Conversation follow-ups | (within the interview bank) | Not opened |
| All rubrics / scoring criteria / critical-domain criteria tied to a specific item | `assessment-config.mjs` `criticalDomains`/`criticalDomainCoverage` (structure only) + the item banks | Only the module-level `weights`/`minimums`/`targetCount` numbers were read (see Part 1's threshold cross-check) — these are general assessment architecture, not item-level scoring, and are the same numbers `COPY.stateA` already discloses to every student on this exact screen. No item-specific rubric or critical-domain-mapping content was read. |
| Live scored-state renderers | `renderPartI`, `renderPartII`, `renderPartIII`, `renderProcessing`, `renderStateC` (passed/notYetPassed), `renderStateD` (attempt ladder/remediation) in `module12-certification.js` | Not read this pass — Listen Mode narration is scoped exclusively to `renderStateA()`, so these renderers' copy (visible only after a scored attempt begins or resolves) is out of scope by design, not merely unnarrated |

**Leakage result: 0%.** Nothing in the M12-01 narration payload names,
previews, paraphrases, or hints at any specific Knowledge question,
Applied Case scenario, Practitioner Conversation prompt/follow-up,
answer choice, correct answer, rationale, or item-level rubric/scoring
criterion. Confirmed by direct read of the final frozen payload
(`docs/course-audit/listen-mode/tts-final/module-12/M12-BATCH-A1.txt`)
against this exclusion list.

## Post-result narration (deliberately not built)

Per the task's explicit instruction, no result-state narration
(`passed`, `notYetPassed`, `attempts[1..4]`, `remediationPlan`,
`recommendedReview`, etc.) was built this pass, even though several of
those `COPY` blocks (e.g. `passed.courseCloseBody`) are themselves fixed,
general, non-personalized copy with no live student data embedded. This
is flagged here as a **possible later enhancement, not a launch
requirement**: a future pass could narrate e.g. `COPY.passed`'s fixed
congratulations copy the same way State A is narrated now, *provided*
the trigger is scoped so it can only ever fire on an already-resolved,
already-authoritative `state === 'C'`/pass decision the server already
returned (never a live/in-progress score), and provided per-student
`performanceReview` percentages, domain results, and remediation details
continue to never be narrated. Not attempted tonight — explicitly out of
scope per "Do not create unnecessary result-state complexity."

## Player / assessment boundary (verified, unmodified)

`onStartExam(container)` in `module12-certification.js` (line ~862) is
the function that runs when a student taps "Start Final Exam." Its first
action, before the `/start-attempt` API call and before any scored
render: `if (window.AIMTListenMode) window.AIMTListenMode.unmount();` —
confirmed by direct reading of the current live file, not modified. The
function's own comment states the reasoning explicitly: "Listen Mode is
scoped to the pre-exam orientation screen only... tear it down before an
attempt exists so no player state or audio can survive into scored
content." Separately, `renderStateA()`'s mount call
(`window.AIMTListenMode.mount({... moduleId: 12 ...})`, line ~857) only
attaches real playback once every chunk in this module's manifest is
`qaStatus: 'APPROVED'` (confirmed in `aimt-listen-mode-player.js`'s
`isProductionReady()`/gating logic at lines ~783-784, ~1057) unless
Student Preview/QA mode is active — so the live "Listen with Cadence"
button on the real site cannot play real audio until this production is
explicitly marked approved, independent of this task's own scope
boundary. **No assessment logic was read beyond confirming these two
call sites exist and do what their comments say; nothing was altered.**

## END-OF-MODULE FIDELITY CHECK (Section G)

Module 12's State A screen is short enough (16 substantive elements, one
narration chunk) that the "final third" and "whole module" coverage
passes are the same pass — there is no separate back-half density
gradient to re-check independently. Explicitly re-verified: the
checkpoint-history section (element 11-13) and the integrity/
encouragement close (14-16) — the module's own final third — for
headline/list thinning (none found), paraphrase creep (none — checked
byte-for-byte against `checkpointLead`, `integrityBody`, and
`finalEncouragement`), and exact ending point (narration ends on "Good
luck.", matching `finalEncouragement`'s own last sentence, before any
button copy). **PASS.**

## TTS preflight

`node scripts/aimt-listen-tts-preflight.mjs` (full course-wide run): the
single Module 12 batch (`M12-BATCH-A1.txt`, 4,095 chars) passes with zero
findings — 0 bare "AIMT", 0 hyphenated "A-I-M-T", 0 dotted "A.I.M.T", 0
"answer above" variants (State A has no checkpoint, so this class of
defect cannot occur here), 0 Cadence third-person-self-reference NOTEs
(the non-blocking Section J check), comfortably under the 4,500-char
safety margin. The run's 8 pre-existing failures and 1 note are unrelated
to Module 12 (documented in Modules 0/2/3/5/6's own history).

**Result: PASS on all pre-generation gates.**
