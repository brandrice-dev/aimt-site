# AIMT Cloud Media Backup

**Status: BLOCKED — R2 not yet enabled on the Cloudflare account.** Nothing
described below has run for real yet. This document describes the
architecture, the workflow, and exactly what's ready to go the moment R2
is enabled — see "Current status" at the bottom for the precise blocker.

## Architecture

- **Cloud provider:** Cloudflare R2
- **Bucket:** `aimt-media-archive` (preferred name; not yet created — R2
  isn't enabled on the account, so bucket creation itself failed. See
  "Current status" below)
- **Privacy:** private. No `r2.dev` public access, no public custom
  domain, no anonymous read access — this bucket is the archive/backup
  layer, not the public student-delivery layer.
- **Storage model:** content-addressed, immutable blobs at
  `blobs/sha256/<first-two-hash-chars>/<full-sha256>/<filename>`. The same
  bytes always produce the same key, so re-running a backup naturally
  deduplicates — nothing is ever overwritten by original filename, and no
  accidental destructive replacement of a source asset is possible.
- **Snapshots:** each backup run writes a manifest to
  `snapshots/<course>/listen-mode/module-<NN>/<UTC-timestamp>.json` in R2,
  and a matching copy locally under this directory, recording every file's
  original path, role, SHA-256, size, MIME type, immutable object key, and
  upload/reuse status.

## Division of responsibility

- **Git** stays the version-controlled home for code, docs, scripts,
  tests, and small JSON manifests (see `.gitignore` — large generated
  CapCut audio under `capcut-test/`/`capcut-production/` is intentionally
  untracked there; see the "Lock CapCut Listen Mode finishing workflow"
  and repo-hygiene work for why).
- **R2** is the large/source/master audio backup layer, so the owner's
  computer is never the only copy of anything expensive or irreplaceable.

## What must always be backed up

- **Raw ElevenLabs generations** (`assets/audio/listen/**/raw/*.mp3`) —
  always. These are what make a remaster possible without spending
  ElevenLabs credits again; losing them is the single most expensive
  thing that could happen to this pipeline.
- **CapCut lossless exports** (module masters, both pre- and
  post-processing, and processed exports returned by the owner) — always.
  These are the deterministic starting point for the current finishing
  workflow (`CADENCE_CAPCUT_FINISH_PRESET_V1`).
- **Canonical student production audio** — always, once produced.

## Workflow

```
node scripts/aimt-media-backup.mjs --course headspa-mastery --module 01
```

Inventories the configured source paths for that course/module, hashes
each file, checks R2 for an existing blob at that content-addressed key
(reuses it if found — no duplicate upload), uploads anything missing,
verifies the upload, and writes a snapshot manifest both to R2 and
locally. Requires `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` /
`R2_SECRET_ACCESS_KEY` in the environment (an R2 API token scoped to
object read/write on this bucket) — **fails closed** with a clear message
naming exactly what's missing if any of these are absent, before making
any network call.

```
node scripts/aimt-media-restore.mjs --manifest=<snapshot.json> --out=<dir> [--overwrite]
```

Downloads every file listed in a snapshot manifest by its immutable
object key, and requires the restored bytes' SHA-256 to match the
manifest's recorded hash before considering that file recovered. Refuses
to overwrite an existing file unless `--overwrite` is passed explicitly.

Both scripts are written to generalize to Modules 2–12 — add a new
`getSourceManifest()` branch in `aimt-media-backup.mjs` per module.

## Current status

**R2 is not enabled on this Cloudflare account.** Both `r2_buckets_list`
and `r2_bucket_create` (via the Cloudflare MCP connection available in
this session) returned:

```
403 {"success":false,"errors":[{"code":10042,"message":"Please enable R2 through the Cloudflare Dashboard."}]}
```

This is a one-time interactive action in the Cloudflare dashboard (R2 is
gated behind explicit account-level opt-in, which typically includes
confirming billing since R2 is usage-based even within its free tier) —
no API token or automated tool can do this on the owner's behalf.

**What IS ready, right now, for the moment this is unblocked:**
- The bucket name, architecture, and privacy posture are decided and
  documented above.
- `scripts/aimt-media-backup.mjs` and `scripts/aimt-media-restore.mjs`
  are built, and every piece of their logic that doesn't require a live
  connection is unit-tested (43 checks in
  `tests/aimt-media-backup.test.mjs`): content-addressed key generation,
  SHA-256 hashing, the reuse-vs-upload decision, the snapshot manifest
  schema, restore's overwrite-refusal and checksum validation, and the
  fail-closed credential check (exercised for real, since that's the
  actual current state).
- The Module 1 source manifest is fully configured and verified against
  the real filesystem: all 34 required files exist right now (224.2 MB
  total) — 14 raw ElevenLabs chunks, 5 canonical production files, the
  full pre-CapCut module master, the 4-chunk CapCut proof evidence (10
  files), and 4 small recovery-metadata files. 15 optional entries
  (the full-module processed CapCut export + its 14 resplit outputs)
  correctly resolve as "not yet present" without blocking anything, per
  instruction.

**To unblock:** enable R2 in the Cloudflare dashboard for this account,
then generate an R2 API token (object read/write scope, scoped to the
`aimt-media-archive` bucket once created) and provide
`R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` to this
environment (e.g. a temporary file this session reads once and deletes,
matching how the Auphonic key was handled earlier in this project) — then
ask for the backup to run.

## Future production policy

A module is not considered **media-safe** until:

1. All raw ElevenLabs chunks exist locally.
2. Raw chunks are backed up to R2.
3. The pre-CapCut master is backed up to R2.
4. The post-CapCut lossless master is backed up to R2.
5. Canonical split production audio is backed up to R2.
6. A latest snapshot manifest exists (both in R2 and locally).
7. A cloud restore verification has passed for that snapshot.

Goal, once all seven are true for a module:

```
MODULE 01 — CLOUD BACKUP VERIFIED ✓
```

Then repeat per module, 2 through 12.
