/* ═══════════════════════════════════════════════════════════════
   Part III conversation-selection helper — pure, server-authoritative.
   ---------------------------------------------------------------
   Given an attempt's fixed, ordered list of selected interview IDs and
   its per-interview conversation state, determines which interview the
   student should see next and whether it is the very first conversation
   of Part III (as opposed to the 2nd/3rd, which pick up mid-sequence
   without repeating the Part III welcome).

   Conversations are always completed strictly in the order they were
   selected — the client never lets a student jump ahead or pick a
   conversation out of order — so "the first not-yet-finalized ID in the
   selected list is at index 0" is a reliable, cheap proxy for "no
   conversation has been finalized yet," without needing a separate
   counter in stored state.

   Shared by the production endpoint (functions/api/certification/get-
   part.js) and the local QA harness (scripts/review-module12-bank.mjs)
   so both implement the identical selection rule.
   ═══════════════════════════════════════════════════════════════ */

/**
 * @param {string[]} selectedIds
 * @param {Object<string, {finalized?: boolean}>} conversationState
 * @returns {{ nextInterviewId: string|null, conversationIndex: number, isFirstConversation: boolean, allFinalized: boolean }}
 */
export function findNextInterview(selectedIds, conversationState) {
  const ids = selectedIds || [];
  const state = conversationState || {};
  const conversationIndex = ids.findIndex((id) => !(state[id] && state[id].finalized));
  if (conversationIndex === -1) {
    return { nextInterviewId: null, conversationIndex: -1, isFirstConversation: false, allFinalized: true };
  }
  return {
    nextInterviewId: ids[conversationIndex],
    conversationIndex,
    isFirstConversation: conversationIndex === 0,
    allFinalized: false,
  };
}
