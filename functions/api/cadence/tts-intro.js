/* ═══════════════════════════════════════════════════════════════
   Cadence Runtime TTS — server-authoritative Jane voice synthesis.
   ---------------------------------------------------------------
   POST /api/cadence/tts-intro
   Headers: Authorization: Bearer <supabase access token>
   Body: { segmentId, text }

   Production runtime path for AIMT's THREE dynamic (name-aware /
   personalized) Cadence intro segments -- see the CADENCE_DIALOGUE
   manifest in assets/js/aimt-cadence-intro.js for the full segment
   list:
     - cadence_intro_01           ("Hi, {firstName}." / "Hi.")
     - cadence_synthesis_response (the personalized closing reply)
     - cadence_closing_meet       ("It's nice to meet you, {firstName}...")
   Every other Cadence intro segment is static, human-produced,
   externally cleaned/de-essed audio (see docs/course-audit/listen-
   mode/*) and never reaches this endpoint -- ALLOWED_SEGMENT_IDS below
   rejects anything else outright.

   `text` is the EXACT string already resolved and shown to the student
   client-side -- this endpoint never generates or re-resolves dialogue,
   it only synthesizes speech for text that is already canonical. That
   is what keeps "what the student reads" and "what Jane says" the same
   string: the only transformation applied here is normalizeForSpeech()
   (functions/_lib/cadence/tts.mjs), which rewrites the visible word
   "AIMT" into its approved spoken form ("A I M T", confirmed by ear --
   never hyphenated) and touches nothing else. Same "client supplies
   content, server supplies authority" trust boundary functions/api/
   cadence/submit-intro.js and ask.js already document and rely on --
   there is no decision to protect here (no pass/fail, no progress
   write, no persistence of the audio itself), so a client-supplied
   text string carries no authority risk beyond ordinary rate limiting.

   Voice/model are fixed and NOT client-configurable -- Jane
   (Y3ZPRGOSIxbV4Rbb3WiA), eleven_v3. Never substitute another voice or
   model here.

   Deliberately NOT wired to any playback yet -- attaching this to an
   <audio> element, audio-authoritative timing, `ended`-driven
   sequencing, and amplitude-reactive orbital illumination are all
   later work, once the cleaned static masters are back from the owner
   and this endpoint is proven against AIMT's real Cloudflare
   environment. This endpoint only proves the server CAN generate a
   clip.
   ═══════════════════════════════════════════════════════════════ */

import { json, hasSupabaseEnv, resolveUser, isEntitled, COURSE_SLUG } from '../../_lib/certification/auth.mjs';
import { synthesizeCadenceSpeech } from '../../_lib/cadence/tts.mjs';
import { checkRateLimit } from '../../_lib/cadence/rate-limit.mjs';

// Only these three segments are ever dynamically synthesized -- see
// this file's header. Anything else is rejected before any provider
// call is made.
const ALLOWED_SEGMENT_IDS = new Set([
  'cadence_intro_01',
  'cadence_synthesis_response',
  'cadence_closing_meet',
]);

// A generous ceiling for the longest legitimate segment (the 2-3
// sentence personalized response), not a bound tuned to abuse
// specifically -- checkRateLimit below is the actual abuse control.
const MAX_TEXT_LENGTH = 700;

// A student normally passes through the intro (and this endpoint) once
// per enrollment -- up to 3 calls in a single pass (greet, response,
// closing). Generous enough for a retry or a reopened preview without
// approaching real abuse volume.
const RATE_LIMIT = { perMinute: 10, perDay: 30 };

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!hasSupabaseEnv(env)) return json({ error: 'Misconfigured' }, 500);

  const { user, errorResponse } = await resolveUser(env, request);
  if (errorResponse) return errorResponse;

  const limited = checkRateLimit(`tts_intro:${user.id}`, RATE_LIMIT);
  if (limited) {
    return json({
      error: limited === 'minute'
        ? 'Cadence needs a short breather — try again in a minute.'
        : 'Daily limit reached for this tool — this resets tomorrow.',
    }, 429);
  }

  const entitled = await isEntitled(env, user, COURSE_SLUG);
  if (!entitled) return json({ error: 'No active enrollment found for this account.' }, 403);

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ error: 'Invalid request body.' }, 400);
  }
  const { segmentId, text } = body || {};
  if (typeof segmentId !== 'string' || !ALLOWED_SEGMENT_IDS.has(segmentId)) {
    return json({ error: 'Unsupported segment.' }, 400);
  }
  if (typeof text !== 'string' || !text.trim()) {
    return json({ error: 'Invalid request.' }, 400);
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return json({ error: 'Text too long for this segment.' }, 400);
  }

  try {
    const audioBuffer = await synthesizeCadenceSpeech(env, text);
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        // Personalized/name-aware audio -- never shared or cached
        // across students or requests.
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (e) {
    // Never echo provider error detail back to the client (could carry
    // account/billing/provider info) -- same shape as submit-intro.js's
    // catch below.
    return json({ error: 'Cadence voice is temporarily unavailable. Please try again.' }, 502);
  }
}
