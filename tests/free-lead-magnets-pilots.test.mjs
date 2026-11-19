// Standalone Node tests for the unlisted AIMT free-tool pilots. No npm deps.
// Run: node --test tests/free-lead-magnets-pilots.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pilots = ['head-spa-accelerator-pilot.html', 'head-spa-scope-finder-pilot.html'];

function harness(html) {
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
  const nodes = {};
  function el(id = '', value = '') {
    return {
      id, value, textContent: '', hidden: false, style: {}, options: [], children: [], checked: false,
      listeners: {},
      addEventListener(type, callback) { this.listeners[type] = callback; },
      focus() {}, setAttribute() {}, scrollIntoView() {}, select() {},
      querySelector() { return { setAttribute() {}, focus() {} }; },
      appendChild(child) {
        this.children.push(child);
        if (this.id === 'state' && child.value) this.options.push(child);
        return child;
      },
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = [...children]; }
    };
  }
  for (const id of ids) nodes[id] = el(id);
  for (const [id, value] of Object.entries({
    handsOn: '60', consultation: '15', preparation: '10', closeReset: '15',
    startingPoint: 'exploring', clientGoal: 'care', formatChoice: 'undecided',
    openQuestion: 'scope', state: '', license: ''
  })) if (nodes[id]) nodes[id].value = value;

  const decisions = ['buy', 'define', 'claim'].map(value => el('decision', value));
  const activities = ['shampooing, conditioning or washing hair', 'scalp massage or manipulation'].map(value => el('activity', value));
  const document = {
    getElementById(id) { return nodes[id]; },
    querySelectorAll(selector) {
      if (selector.includes('decision')) return decisions;
      if (selector.includes('activity')) return selector.includes(':checked') ? activities.filter(x => x.checked) : activities;
      return [];
    },
    createElement(tag) { return el(tag); },
    createTextNode(text) { return { textContent: text }; }
  };
  const window = { matchMedia() { return { matches: true }; }, scrollTo() {}, print() {} };
  const storage = new Map();
  const localStorage = { getItem(key) { return storage.get(key) || null; }, setItem(key, value) { storage.set(key, value); } };
  const navigator = { clipboard: { async writeText(value) { storage.set('clipboard', value); } } };
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x => x[1]).join('\n');
  const context = { document, window, localStorage, navigator, console };
  vm.runInNewContext(script, context, { timeout: 1500 });
  function click(id) {
    const fn = nodes[id]?.listeners.click;
    assert.equal(typeof fn, 'function', 'Missing click handler for ' + id);
    return fn();
  }
  return { nodes, decisions, activities, storage, click };
}

test('unlisted routes remain explicitly allowlisted on the isolated branch', () => {
  const routes = JSON.parse(read('_routes.json'));
  for (const file of pilots) {
    const name = file.slice(0, -5);
    for (const p of ['/' + name, '/' + file, '/' + name + '/']) assert.ok(routes.exclude.includes(p), 'Missing route ' + p);
  }
});

for (const file of pilots) {
  test(file + ' has safe, coherent static markup', () => {
    const html = read(file);
    assert.match(html, /name="robots" content="noindex,nofollow/);
    assert.doesNotMatch(html, /<input[^>]*type=["']file["']/i);
    assert.doesNotMatch(html, /\bfetch\s*\(/);
    assert.doesNotMatch(html, /<script[^>]+src=["']https?:/i);
    const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(x => x[1]);
    assert.equal(ids.length, new Set(ids).size, 'Duplicate DOM IDs');
    const referenced = [...html.matchAll(/\$\(['"]([\w-]+)['"]\)/g)].map(x => x[1]);
    for (const id of referenced) assert.ok(ids.includes(id), 'Missing referenced DOM element ' + id);
  });
}

test('Accelerator pilot calculates full capacity, responds to a decision and saves locally', () => {
  const h = harness(read('head-spa-accelerator-pilot.html'));
  assert.match(h.nodes.capacityTotal.textContent, /100 minutes/);
  h.nodes.handsOn.value = '90';
  h.nodes.handsOn.listeners.input();
  assert.match(h.nodes.capacityTotal.textContent, /130 minutes/);
  h.click('next1');
  assert.equal(h.nodes.stage1.hidden, true);
  assert.equal(h.nodes.stage2.hidden, false);
  h.decisions[1].listeners.change();
  assert.equal(h.nodes.decisionFeedback.hidden, false);
  assert.ok(h.nodes.decisionFeedback.children.length);
  h.click('next2');
  h.nodes.startingPoint.value = 'station';
  h.nodes.formatChoice.value = 'focused';
  h.click('generateResult');
  assert.equal(h.nodes.result.hidden, false);
  assert.match(h.nodes.modelResult.textContent, /wash station/);
  h.click('saveResult');
  assert.ok(h.storage.has('aimt-free-accelerator-lesson02-pilot-v1'));
});

test('Scope Finder returns official sources, no legal clearance, and safe unmapped state', () => {
  const h = harness(read('head-spa-scope-finder-pilot.html'));
  h.nodes.state.value = 'California';
  h.nodes.license.value = 'Esthetician license';
  h.activities[0].checked = true;
  h.click('review');
  assert.equal(h.nodes.output.hidden, false);
  assert.equal(h.nodes.sourceList.children.length, 2);
  assert.match(h.nodes.requestText.textContent, /California/);
  assert.match(h.nodes.statusLabel.textContent, /PERMISSIONS NOT DETERMINED/);
  h.nodes.state.value = 'Pennsylvania';
  h.click('review');
  assert.match(h.nodes.statusLabel.textContent, /INCOMPLETE/);
  assert.equal(h.nodes.sourceList.children.length, 1);
  h.nodes.state.value = 'New York';
  h.nodes.license.value = 'Massage therapy license';
  h.click('review');
  assert.match(h.nodes.resultNote.textContent, /may not govern your credential/);
  h.click('clear');
  assert.equal(h.nodes.output.hidden, true);
});
