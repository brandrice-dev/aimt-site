import test from 'node:test';
import assert from 'node:assert/strict';
import { adminHeaders } from '../scripts/_lib/supabase-admin-headers.mjs';

test('new Supabase secret key uses only the apikey header', () => {
  const key = 'sb_secret_example_private_key_for_test';
  assert.deepEqual(adminHeaders(key), { apikey: key });
});
test('legacy service-role JWT retains its existing bearer header', () => {
  const key = 'aHeader.aPayload.aSignature';
  assert.deepEqual(adminHeaders(key), { apikey: key, Authorization: 'Bearer ' + key });
});
test('publishable, missing and malformed keys fail closed', () => {
  for (const key of ['sb_publishable_public_key', '', 'abc', 'sb_secret_']) {
    assert.throws(() => adminHeaders(key), /elevated Supabase/);
  }
});
