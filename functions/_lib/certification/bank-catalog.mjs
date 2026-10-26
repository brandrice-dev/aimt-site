// Every installed final-assessment content bank, keyed by its bankVersion.
// The course registry decides which course may use which bank; this file
// only answers "is that exact bank installed?". Append-only: a bank version
// stored on a historical attempt must stay resolvable for as long as that
// attempt exists (standard Section 15).

import { getProductionBanks as getHeadSpaBanksV1 } from './content-bank.mjs';

const CATALOG = Object.freeze({
  'headspa-fe-bank-v1-2026-08-26': getHeadSpaBanksV1,
});

/** The installed bank for exactly this version, or null. */
export function lookupBank(bankVersion) {
  if (typeof bankVersion !== 'string' || !Object.hasOwn(CATALOG, bankVersion)) return null;
  const banks = CATALOG[bankVersion]();
  return banks && banks.bankVersion === bankVersion ? banks : null;
}
