import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
const sandbox = vm.createContext({});
for (const file of ['aimt-certificate.js', 'aimt-social-sharing.js']) vm.runInContext(readFileSync(new URL('../assets/js/' + file, import.meta.url), 'utf8'), sandbox);
const api = sandbox.AIMTSocialSharing;
const credential = { credential_id: 'AIMT-HS-2026-ABC234', course_slug: 'headspa-mastery', revoked: false };
const record = { valid: true, credential_id: credential.credential_id, course: 'Head Spa Certification Course', student_name: 'Review Student', completed_at: '2026-11-01T12:00:00Z' };
const request = data => async (url, options) => {
  assert.equal(url, '/api/verify-credential?id=' + credential.credential_id);
  assert.equal(options.cache, 'no-store');
  return { ok: true, json: async () => data };
};
test('graduate requires own active course credential and authoritative verification', async () => {
  const view = await api.verifyCredential(credential, request(record));
  assert.equal(view.status, 'active');
  assert.equal(view.studentName, record.student_name);
  assert.match(api.graduateCaption(view), /earned AIMT Head Spa Certification/);
  assert.equal(api.verificationUrl(view), 'https://aimtrichology.com/verify?id=' + credential.credential_id);
  for (const c of [null, { ...credential, revoked: true }, { ...credential, revoked: null }, { ...credential, course_slug: 'other' }, { ...credential, credential_id: 'invalid' }]) {
    assert.equal(await api.verifyCredential(c, () => { throw Error('must not fetch'); }), null);
  }
});
test('revoked, missing, mismatched and malformed verification records fail closed', async () => {
  for (const data of [{ valid: false, reason: 'revoked' }, { valid: false }, { ...record, valid: 'true' }, { ...record, student_name: '' }, { ...record, completed_at: 'invalid' }, { ...record, credential_id: 'AIMT-HS-2026-XYZ234' }, { ...record, course: 'other' }]) {
    assert.equal(await api.verifyCredential(credential, request(data)), null);
  }
  await assert.rejects(api.verifyCredential(credential, async () => ({ ok: false })));
  await assert.rejects(api.verifyCredential(credential, async () => { throw Error('offline'); }));
});
test('dashboard integration follows auth and enrollment; readiness mode remains isolated', () => {
  const html = readFileSync(new URL('../my-aimt.html', import.meta.url), 'utf8');
  assert.match(html, /<section id="socialSharing" hidden/);
  const hook = html.slice(html.indexOf('window.AIMTSocialSharing.mount'), html.indexOf('document.getElementById(\'loading\').style.display', html.indexOf('window.AIMTSocialSharing.mount')));
  assert.match(hook, /auth.getUser/); assert.match(hook, /data.user.id !== currentUser.id/);
  assert.match(hook, /loadEntitlements\(email\)/); assert.match(hook, /access.errored/);
  assert.match(hook, /loadCertificationState\(\['headspa-mastery'\]\)/);
  const source = readFileSync(new URL('../assets/js/aimt-social-sharing.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
  assert.match(source, /if \(!initial \|\| !initial.enrolled\) return/);
});

test('unenrolled or failed access leaves the kit hidden without credential requests', async () => {
  for (const access of [async () => ({ enrolled: false }), async () => null, async () => { throw Error('account unavailable'); }]) {
    const container = { hidden: true, innerHTML: '' };
    await api.mount(container, access, () => { throw Error('must not fetch'); });
    assert.equal(container.hidden, true); assert.equal(container.innerHTML, '');
  }
});

test('four owner-approved concepts use accurate training and earned language', () => {
  const expected = [
    [null, 0, "Experience isn't where I stop.", 'Continuing my education in scalp science and professional head spa practice.', 'Currently pursuing AIMT Head Spa Certification.'],
    [null, 1, 'The work behind the service matters.', 'Investing in the knowledge behind the experience—not just what clients see.', 'Training toward AIMT Head Spa Certification.'],
    [record, 0, 'The standard keeps rising.', 'AIMT Head Spa Certification — Earned.'],
    [record, 1, 'More knowledge behind every service.', 'AIMT Head Spa Certification earned through assessment.']
  ];
  for (const [view, variant, headline, supporting, status] of expected) {
    const concept = api.storyConcept(variant, view);
    assert.equal(concept.headline, headline);
    assert.equal(concept.supporting, supporting);
    assert.equal(concept.status, status);
  }
  assert.match(api.studentCaption(), /currently pursuing AIMT Head Spa Certification/);
  assert.doesNotMatch(api.studentCaption(), /earned|certified|#/i);
  const caption = api.graduateCaption({ date: 'November 1, 2026', credentialId: credential.credential_id });
  assert.match(caption, /earned AIMT Head Spa Certification through assessment/);
  assert.doesNotMatch(caption, /#/);
  const source = readFileSync(new URL('../assets/js/aimt-social-sharing.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /Taking the next step|A NEW CHAPTER|The next chapter|Professional development, in progress/);
});
