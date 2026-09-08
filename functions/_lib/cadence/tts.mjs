/* ═══════════════════════════════════════════════════════════════
   Cadence runtime text-to-speech — ElevenLabs call primitive.
   ---------------------------------------------------------------
   The ONE place AIMT calls ElevenLabs for the Cadence intro's dynamic
   (name-aware / personalized) speech. All other Cadence intro audio is
   a separate, external, human-produced pipeline (see docs/course-audit/
   listen-mode/*) and never touches this file.

   Voice/model are fixed, approved-by-ear values -- confirmed against
   the connected ElevenLabs Jane voice during Audio Production Phase 1
   testing (space-separated "A I M T" pronunciation approved over the
   hyphenated form). Never substitute another voice or model here.

   normalizeForSpeech() is the server-side twin of the identically-named
   function in assets/js/aimt-cadence-intro.js. They cannot share code
   (this runs in the Cloudflare Pages Functions runtime; that runs in
   the browser, and this repo has no build step to bundle between the
   two -- see CLAUDE.md's "no build step" constraint), so this is a
   deliberate, minimal, single-regex duplication -- keep both in sync if
   the pronunciation rule ever changes. It changes how a word is
   SPOKEN, never what a student is shown.
   ═══════════════════════════════════════════════════════════════ */

export const CADENCE_JANE_VOICE_ID = 'Y3ZPRGOSIxbV4Rbb3WiA';
export const CADENCE_JANE_MODEL_ID = 'eleven_v3';

export function normalizeForSpeech(text) {
  return String(text || '').replace(/\bAIMT\b/g, 'A I M T');
}

/**
 * Synthesizes `text` (already the exact canonical string shown to the
 * student -- see functions/api/cadence/tts-intro.js's header for the
 * "canonical displayed dialogue = text sent to TTS" rule) as one Jane
 * clip. Returns the raw MP3 bytes as an ArrayBuffer.
 */
export async function synthesizeCadenceSpeech(env, text) {
  if (!env.ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY not configured');
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${CADENCE_JANE_VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: normalizeForSpeech(text),
      model_id: CADENCE_JANE_MODEL_ID,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Cadence speech request failed (${res.status}): ${errBody.slice(0, 300)}`);
  }
  return res.arrayBuffer();
}
