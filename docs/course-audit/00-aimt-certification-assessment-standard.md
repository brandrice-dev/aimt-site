# AIMT Certification & Assessment Standard

**Status:** AIMT Certification & Assessment Standard — Version 1 —
**architecture locked for Head Spa exam rewrite** (August 26, 2026
correction pass — see Revision note below). Not yet implemented.
**Scope:** Institutional. This document governs certification and assessment
design for every AIMT certification course, not only Head Spa. Head Spa
Module 12 is its first implementation and the only place a course-specific
example appears below; nothing here should be read as Head-Spa-specific
unless explicitly marked as an example.
**Authority order:** This document sits above any individual course's
Module 12 (or equivalent) blueprint. Where a course-specific exam design
document conflicts with this standard, this standard governs unless a
deliberate, recorded exception is approved here first. See
`00-aimt-course-audit-master-instructions.md` and `00-global-decisions.md`
for the surrounding course-audit governance this document extends.
**Authorized by:** Owner direction, recorded in full as this document's
source instruction.
**Date:** August 26, 2026
**Revision (August 26, 2026):** Correction pass following external review.
Locked: the Part III numeric scoring model (Section 2), the corrected pass
standard (Section 4), the critical-domain evidence model replacing
item-level auto-gating (Section 5), per-attempt critical-domain coverage
requirements (Section 13), domain-grouped remediation gating and MVP
operational designs for the Educator Remediation Session (Section 8) and
Human Review/Appeal (Section 9), and the backend-authoritative
certification record as a hard production-release requirement, not a
deferred recommendation (Section 16). This is a dated revision, not a
silent edit — the pre-revision text this replaces is superseded, not
preserved elsewhere.
**Implementation status:** Institutional standard only. Does not authorize
building, implementing, or deploying any exam, grading pipeline, or
certificate-issuance change. **Exception:** Section 16 now states a hard
architectural precondition that governs when Module 12 (or any AIMT
certification course) may be released to production — that precondition
itself must be honored at release time, even though building it is not
authorized by this document.

---

## 1. Core institutional standard

**AIMT certifies demonstrated competency — not course completion.**

Watching videos, opening modules, scrolling, downloading resources, or
simply reaching the end of a course does not earn certification.
Completion makes a student *eligible* to demonstrate competency. It is not
itself the demonstration.

Certification requires demonstrating all three of the following:

- **Knowledge** — the student retained the important information the
  course taught.
- **Application** — the student can use that knowledge in realistic
  professional situations, not only recognize it on a page.
- **Judgment** — the student can explain the reasoning behind a decision,
  recognize the limits of their own certainty, and respond responsibly when
  a situation is not perfectly scripted.

### Passing philosophy

Passing an AIMT exam should mean something. It should be:

- challenging;
- fair;
- competency-based;
- defensible;
- transparent.

The exam must **not** be difficult because of trick wording, obscure
trivia, arbitrary memorization, or intentionally confusing answer choices.
Difficulty of that kind measures test-taking skill, not competency, and has
no place in an AIMT assessment.

The exam **should** be difficult because the student is required to:

- retain information;
- distinguish between plausible options;
- apply multiple concepts at once;
- recognize the best next action, not merely a correct fact;
- exercise professional judgment;
- integrate material across modules rather than recall it in isolation.

### No certification by scrolling

A student must not earn certification merely by visiting every module,
completing page-progress indicators, or reaching the certificate screen.
Final certification requires passing the assessment standard defined in
this document — completion of the instructional modules is a prerequisite
for attempting certification, never a substitute for it.

---

## 2. AIMT assessment model

Every AIMT certification course's final assessment is built from three
parts. The weighting below is the current approved institutional default;
a future course may propose a different split only with an explicit,
recorded exception — it is not a per-course free choice.

| Part | Weight | Minimum component score | Purpose |
|---|---|---|---|
| I — Knowledge & Retention | 50% | 75% | Did the student retain what the course taught? |
| II — Applied Practitioner Cases | 30% | 75% | Can the student apply it, connected across the course? |
| III — Practitioner Exit Interview (Cadence) | 20% | 80% | Can the student reason and explain under a live conversational probe? |

### Part I — Knowledge & Retention (50%)

**Head Spa target:** approximately 40 scored questions, selected per
attempt from a larger versioned question bank (see "Randomization" below).

Questions should heavily favor applied recognition over trivia. A question
that only tests whether a fact was memorized, with no bearing on a real
practitioner decision, does not belong in this bank.

**Difficulty target (applies to the assembled exam, not to every single
question in isolation):**

- ~20% foundational
- ~60% applied
- ~20% advanced / synthesis

Even foundational questions should be professionally relevant — a
foundational question is one that establishes a building block the rest of
the course depends on, not one that is merely easy or trivial.

Most questions should present **at least two plausible answers**, such
that choosing correctly requires actual curriculum knowledge rather than
elimination of obviously silly options. Avoid joke distractors entirely.

### Part II — Applied Practitioner Cases (30%)

**Head Spa target:** approximately 4 substantial cross-module cases,
selected per attempt from a larger versioned case bank.

Each case must test whether the student can connect the course, not answer
an isolated fact restated as a scenario. A case that could be fully solved
using only one module's content has not met this bar.

Acceptable case formats: single-best-answer, multi-select, sequencing,
structured reasoning, or short Cadence-evaluated reasoning where the
competency being tested genuinely requires evaluating open reasoning (not
merely as a default format).

**Prefer deterministic, objectively scoreable assessment wherever it can
validly test the competency.** Use AI (Cadence) evaluation only where the
reasoning itself — not a fact, not a choice among fixed options — is the
thing being assessed.

### Part III — Practitioner Exit Interview (20%, minimum component score 80%)

**Target:** approximately 3 primary competency conversations per attempt,
selected from a larger versioned prompt bank.

This is not another static checkpoint. It functions as a controlled
professional exit interview: Cadence asks a primary question, interprets
the student's reasoning against a **human-written rubric**, may ask
**one** targeted follow-up when a meaningful competency is unclear or
incomplete, and moves forward once competency is demonstrated.

Cadence in this role must not:

- interrogate endlessly, or ask more than one follow-up per primary
  question;
- invent new competency standards not present in the human-written rubric;
- decide certification based on vague intuition rather than the rubric;
- grade writing sophistication, vocabulary, or polish as if it were
  competency.

**Scoring model (corrected — a 20%-weighted component requires a numeric
result, not a bare pass/fail label).** Each primary conversation is
evaluated against its own human-authored rubric, which must be structured
into named criteria (not a single holistic impression). Cadence scores the
student's response against each named criterion, and those criterion-level
results convert into a numeric percentage for that conversation. The
Part III component score for the attempt is calculated from the set of
interview conversations selected for that attempt (e.g., an average across
the ~3 conversations, or an equivalent aggregation method — the exact
aggregation formula is an implementation detail left to the course's own
rubric design, not fixed by this institutional standard).

This institutional standard does **not** mandate one complicated universal
scoring rubric shared across every future AIMT course. Each interview
prompt — and each course — defines its own criteria. What this standard
requires of every Part III rubric, regardless of course, is:

- human-authored criteria (never invented by Cadence at evaluation time);
- structured, criterion-level scoring (not a single vague impression);
- a numeric component result derived from that structured scoring;
- critical-domain evidence flags where a criterion touches a designated
  critical competency domain (see Section 5);
- a maximum of one targeted follow-up per primary conversation.

**No individual interview conversation may contain an unresolved
critical-competency-domain failure**, regardless of the conversation's own
numeric score. A conversation that scores acceptably overall but contains
an explicit unsafe/inappropriate statement within a critical domain (see
Section 5's evidence model) still trips that domain's gate — a high
numeric interview score does not override a critical-domain failure found
inside it.

---

## 3. Human-defined standard

**Cadence evaluates. AIMT rules decide. The backend records. Certification
follows.**

Cadence is not the sole certification authority. Human-authored AIMT rules
define every one of the following, and Cadence operates inside them rather
than inventing them at evaluation time:

- competencies;
- rubrics;
- critical gates;
- scoring;
- remediation;
- certification requirements.

This is the same relationship already established for module checkpoints
in `00-global-decisions.md`'s "Cadence direction," extended to the level of
an entire certifying assessment: Cadence's role is to interpret a specific
student response against a specific, human-authored rubric — never to
decide, on its own judgment, what "good enough" means for AIMT
certification.

---

## 4. Pass standard

**Current approved working standard, corrected and locked by the August 26,
2026 revision (see Revision note above):**

- **Overall weighted score:** 80% minimum.
- **Knowledge / Retention (Part I):** 75% minimum.
- **Applied Practitioner Cases (Part II):** 75% minimum.
- **Practitioner Exit Interview (Part III):** 80% minimum (corrected — see
  Section 2; a weighted component cannot be scored as a bare "PASS" label,
  it requires a numeric result against the same 80% bar).
- **Critical Competency Domain Gates:** ALL cleared (corrected — see
  Section 5; gates are evaluated per named critical domain, not per
  individual exam item).

All five conditions are independent requirements and must be met
simultaneously. A student cannot compensate for a critical-domain failure
by scoring highly elsewhere, and cannot compensate for a weak section by
exceeding the minimum in another section — each component minimum,
including Part III's numeric threshold, is an independent gate, not merely
an input to the overall weighted average.

This standard is recorded as **locked for the Head Spa exam rewrite** by
the August 26, 2026 correction pass — architecture-final, not yet
implemented. Any further change to these numbers before Module 12
implementation begins should be recorded as a new dated revision to this
section, not a silent edit.

---

## 5. Critical competencies — domain evidence model (corrected)

Critical competency gates exist for the smallest possible set of
genuinely high-consequence judgments — they are not a second grading
track for ordinary knowledge. This section replaces the original
item-level interpretation of "Critical" tagging with a **named-domain
evidence model**, corrected specifically because tagging individual exam
items "Critical" had drifted toward implying that one wrong Critical-tagged
multiple-choice question could, by itself, fail a certification gate. That
was never the intent and is now explicitly prohibited below.

### 5.1 Critical competency domains, not item tags

Every AIMT certification course defines a **small, named list of critical
competency domains** — not a loose scattering of item-level "Critical"
flags. A domain is a defensible, high-consequence area of judgment (e.g.,
"never diagnosing," "never shortening a required safety process"), and
every exam item, case, or interview criterion is tagged one of two ways:

- **Standard** — an ordinary knowledge/skill item; wrong answers lower the
  relevant component score in the normal way and nothing more;
- **Critical-Domain Evidence: [Domain Name]** — the item provides evidence
  about the student's competency in a specific named domain. A wrong
  answer on a domain-evidence item still lowers the component score
  normally — it does **not**, by itself, fail that domain's gate.

**A domain must be:**

- limited (few in number, course-wide);
- defensible (a reasonable outside reviewer would agree the stakes justify
  domain status);
- high consequence (a failure here could mean real harm to a client, a
  scope-of-practice violation, or a service performed on someone who
  should not have received it);
- named and locked explicitly for the course, not inferred ad hoc during
  grading.

For Head Spa, the locked domain list lives in
`modules/module-12-final-exam-raw-blueprint.md` — four domains, extracted
from actual curriculum evidence and locked by the August 26, 2026
correction pass. This standard does not repeat that course-specific list
here; it defines the *model* every course's domain list must follow.

### 5.2 What actually fails a critical-domain gate

**A single missed multiple-choice question tagged as domain evidence does
not, by itself, fail that domain's gate.** It contributes evidence, and it
lowers the relevant component score (Part I/II/III) in the ordinary way.
Critical-domain failure requires one of:

- **(A) Explicit unsafe or inappropriate reasoning** stated by the
  student — not merely an incorrect final answer reached by an otherwise
  sound process, but a stated intention or conclusion that is itself
  unsafe or out of scope (e.g., explicitly saying they would continue a
  service over a stop-and-refer finding, shorten a required safety process
  time, confirm a diagnosis as fact, touch a client without appropriate
  consent, or treat certification as expanding their professional scope);
- **(B) A meaningful repeated pattern** — multiple independent assessment
  points across the attempt demonstrating the *same* high-consequence
  misunderstanding, not one missed detail in isolation.

Ordinary knowledge errors must never be silently converted into critical
failures. If a course's domain-gate design starts flagging routine
mistakes as critical, that is a defect in the gate design, not evidence the
student is unsafe.

### 5.3 Required per-attempt domain coverage

Every assembled final assessment must assess **every** designated critical
domain, not leave domain representation to chance. For each domain, a
given attempt must include:

- **at least two independent evidence points** across the full assessment
  (Parts I–III combined);
- **at least one of those evidence points from Part II (Applied Cases) or
  Part III (Practitioner Interview)** — not exclusively from Part I
  multiple-choice items, since a domain this consequential should be
  probed through applied judgment or live conversation, not only
  recognition-format questions.

This coverage requirement must be designed into the randomization
algorithm (see Section 13), not left as a probabilistic side effect of a
large enough bank.

---

## 6. Course checkpoint history

**Required module checkpoints establish readiness for the final exam.
They do not secretly add or subtract final-exam points.**

Do not design hidden grading where Cadence silently uses a student's full
history of prior checkpoint conversations to change the final assessment
score. Student-facing grading of Parts I–III must remain based on what the
student demonstrates during the final assessment itself.

Previous checkpoint history **may** be used to:

- support remediation recommendations after an unsuccessful attempt;
- identify competencies a student has already demonstrated well, to help
  target remediation efficiently rather than blanket re-study;
- direct a student toward the specific modules or sections they actually
  need to revisit.

Previous checkpoint history **may not** be used to silently inflate,
deflate, or substitute for the student's actual performance on the final
assessment. What the student demonstrates on Module 12 is what Module 12
scores.

---

## 7. Exam integrity

Parts I and II exist to demonstrate the student's own retained knowledge
and judgment. This standard does not attempt to design around perfect
surveillance — that is neither achievable nor the right posture for this
program.

Instead, AIMT establishes an **exam-integrity expectation**, communicated
to the student rather than enforced through invasive monitoring:

- the student should complete Parts I and II independently;
- external AI tools should not be used to generate the student's answers;
- the instructional course itself (including Cadence outside the exam
  flow) should not walk the student through exam answers during the
  assessment.

Part III intentionally and explicitly uses Cadence — that is by design, not
an integrity gap. Do not add invasive monitoring (proctoring software,
webcam surveillance, lockdown browsers, or similar) to Parts I–II merely
for the appearance of rigor. If monitoring is ever proposed, it must be
justified on its own merits and approved as a deliberate, recorded
decision — never added as a reflexive default.

---

## 8. Attempt / remediation ladder

This is an important AIMT institutional rule, not a per-course choice.

### Attempt 1 — Unsuccessful → Diagnose + Review

The student receives an **AIMT Certification Performance Review** (see
Section 10) showing section performance, competencies that met standard,
competencies requiring additional work, relevant modules/sections to
revisit, and critical-competency remediation guidance if applicable. The
full answer key is never revealed (see Section 11).

After appropriate review, the student may take **Attempt 2**, using a
fresh, balanced exam configuration (see "Randomization," Section 13) — not
the same fixed question set.

### Attempt 2 — Unsuccessful → Required Targeted Remediation

The student does not simply click "try again." Before Attempt 3 is
unlocked, the student must complete a **targeted remediation path** built
from the deficient **competency areas / critical domains** the attempt
revealed — **not one activity per individual missed question.** Group
deficiencies intelligently: a broad pattern across several related
competencies may justify broader module review; a narrow, isolated gap
should receive narrow, specific remediation. This may include: required
module review, selected lesson sections, practice cases, a targeted
Cadence remediation conversation, or competency-specific exercises. The
exact remediation activities/content for a given deficiency are a course
implementation detail, designed during the Module 12 build — the gating
**principle** is locked here: **Attempt 3 does not unlock until the
assigned remediation is completed.** Once completed, **Attempt 3**
unlocks, using a fresh balanced exam configuration.

### Attempt 3 — Unsuccessful → Human AIMT Intervention

Automatic exam attempts stop. Certification remains pending — not denied,
pending. The student is offered/requires an **AIMT Educator Remediation
Session** via live video, whose purpose is to:

- identify why the learner continues to struggle;
- clarify misunderstood curriculum;
- distinguish genuine knowledge gaps from communication, reading, or
  practical-confusion issues that assessment format may be obscuring;
- provide direct human teaching;
- establish an individualized review plan.

This session is **not an automatic pass.** A human educator may authorize
another assessment attempt once appropriate preparation has occurred — the
educator's authorization is what unlocks the next attempt, not the
session's mere completion.

**Launch-scope operational MVP (locked, so this doesn't stay an
undefined blocker):** the session does not require calendar-integration
automation at first launch. A `Request AIMT Educator Remediation Session`
action, available from the student's dashboard/assessment area, creates a
request tied to the student, the course, and the specific attempt record.
AIMT staff schedule and conduct the actual video session manually. The
educator records, against that request, whether the student is authorized
for Attempt 4. Automated scheduling may be added later as a fast-follow —
it is explicitly not required to ship the first version of this gate.

### Attempt 4 — Educator-Unlocked Reassessment

A fresh, comprehensive assessment, authorized specifically by the
educator following the remediation session. If the student still does not
meet the certification standard here, the case moves to **Individual AIMT
Review** rather than an automatic Attempt 5.

### Beyond Attempt 4 — Individual AIMT Review

Do not automatically generate unlimited further attempts. A future path
for a student who reaches this point may include further targeted study,
additional educator support, delayed reassessment, a practical/hands-on
requirement, or selected module re-completion — but a permanent failure
rule, or an automatic-attempt-5-and-beyond policy, is explicitly **not**
defined by this standard and must not be assumed. That decision is
reserved for later, formal approval.

### Critical-domain remediation is not purely attempt-number-driven

If a student trips a critical-domain gate (per Section 5.2's bar —
explicit unsafe/inappropriate reasoning, or a genuine repeated pattern),
**targeted remediation of that specific domain is required before the
student's next certification attempt**, regardless of which numbered
attempt they are on — this applies starting after Attempt 1, not only
after Attempt 2. A missed objective question tagged as domain evidence is
not equivalent to an explicitly stated unsafe professional decision, and
the two must never be remediated identically. This is distinct from
ordinary score-based remediation: do not require the student to retake the
entire course automatically — remediation is scoped to the specific domain
that failed.

---

## 9. Human review / appeal

Students need a path to human review whenever:

- they believe a specific question was flawed;
- they believe Cadence misunderstood a response during Part III;
- a technical issue affected their assessment;
- accessibility or language circumstances materially affected evaluation.

AI evaluation must never become an unappealable certification decision.

**Human review may resolve:** scoring ambiguity, a genuine question
defect, or a technical failure — by correcting the specific scoring
outcome those defects caused.

**Human review may not:** waive a genuine competency requirement simply to
award certification. Review corrects errors in how competency was
measured; it does not substitute a human's discretion for a student's
actual, unmet competency.

**Launch-scope operational MVP (locked):** a `Request Assessment Review`
action, available from the student's assessment/Performance Review area,
initiates the request. The request is tied to the student, the course,
the attempt, the assessment version, and — where applicable — the specific
disputed question, case, interview conversation, or technical issue. AIMT
staff manage and resolve the actual review manually at launch; this MVP
does not require an automated dispute-resolution workflow to ship.

---

## 10. Fairness / accessibility

Certification assesses competency — not writing polish. Unless
communication itself is the specific competency being tested, do not fail
a response for spelling, grammar, concise wording, non-native English
phrasing, or natural spoken phrasing carried over from voice input. This
extends the same rule already established for module checkpoints in
`00-global-decisions.md` to the certifying assessment.

The final assessment architecture must account for:

- keyboard use;
- voice input where appropriate;
- screen-reader access;
- readable text;
- touch operation;
- reasonable accommodations.

Do not add unnecessary time pressure. A countdown clock, an aggressive
per-question timer, or any other artificial urgency mechanic is not
authorized by this standard and should not be added without a separate,
explicit, recorded decision.

---

## 11. AIMT Certification Performance Review

Every final assessment attempt — passing or not — generates an **AIMT
Certification Performance Review.** This is an institutional requirement,
not an optional nicety.

### For a PASSING student, the review includes:

- certification status;
- overall score;
- Knowledge (Part I) result;
- Applied Cases (Part II) result;
- Practitioner Interview (Part III) result;
- confirmation that all critical competency domains were cleared;
- strongest competency areas;
- approximately 1–3 areas for continued professional development;
- completion/certification date.

Development recommendations must never be framed as a failure after
certification has already been earned — they are forward-looking
professional-growth notes, not a disguised list of things the student got
wrong.

### For a NOT-YET-PASSED student, the review includes:

- certification status (not yet earned — stated plainly, respectfully, not
  euphemistically);
- section performance;
- competencies already meeting standard;
- competencies requiring remediation;
- critical-domain gaps, where applicable;
- exact modules/sections to revisit;
- the next permitted assessment step (per the ladder in Section 8);
- current attempt/remediation status.

**The exact answer key is never shown**, in either case — see Section 12.

Eventually, this review should be permanently accessible from the student
dashboard near the certificate. Building that dashboard surface is not
authorized by this document.

---

## 12. No immediate answer key

Do not show a student the exact correct answers immediately after an
unsuccessful certification attempt. Feedback must identify the
**competency**, the **module**, and the **review need** — never the
literal correct choice for a specific missed question.

This protects retake integrity: the Performance Review is diagnostic
guidance, not an answer sheet a student (or a future student who obtains
it) could use to pass without actually holding the competency.

---

## 13. Randomization

Each certification attempt draws from versioned question, case, and
interview-prompt banks rather than presenting a fixed, memorizable exam.
The generation algorithm for a given attempt must maintain:

- module coverage (the assembled exam should not accidentally over- or
  under-represent any one module);
- competency coverage (the range of competencies identified in the
  course's own competency map, not just topic/module coverage);
- **critical-domain coverage (corrected — see Section 5.3):** every
  designated critical domain must receive at least two independent
  evidence points in the attempt, with at least one of those points drawn
  from Part II or Part III, not exclusively from Part I;
- the approved difficulty mix (~20% foundational / ~60% applied / ~20%
  advanced-synthesis for Part I, per Section 2).

**Question selection must not be purely random across the entire bank** —
uncontrolled randomness could easily produce an attempt that is
accidentally too easy, too hard, or missing a critical domain entirely.
Selection is a constrained/balanced draw against the coverage requirements
above, not an unconstrained shuffle.

**Retake overlap (locked).** Do not require mathematically zero overlap
between a student's consecutive attempts — that guarantee is not worth
sacrificing exam validity or coverage/critical-domain requirements to
achieve, and is not achievable at all until a course's bank is large
enough. Instead: on a retake, prefer previously unseen questions, cases,
and interview prompts; avoid repeating an item where an equivalent unseen
item can satisfy the same competency, difficulty, and critical-domain
coverage requirement; permit limited overlap only when necessary to
preserve required coverage. Minimizing repeat exposure is the goal —
zero repeat exposure is not a requirement this standard imposes.

Answer-choice order may be shuffled freely where doing so does not change
a question's meaning (e.g., never shuffle a sequencing question's steps in
a way that breaks its own premise).

---

## 14. Question quality / future analytics

**Future institutional recommendation, not an immediate build item:** as
AIMT accumulates real assessment data, question and case quality should be
evaluated using item-level statistics. Flag for review any item that:

- strong students disproportionately miss;
- weak students disproportionately answer correctly (a strong signal the
  item is gameable or ambiguous, not that it's appropriately hard);
- shows ambiguous distractor behavior (e.g., two distractors never chosen,
  suggesting they aren't actually plausible);
- produces an abnormal dispute/appeal rate.

**A difficult question is not automatically a good question.** If an item
behaves poorly against these signals, review the item itself before
concluding the student was at fault. This becomes especially important as
the question bank grows across multiple AIMT courses — poor items should
be retired or corrected, not defended because they are already in the
bank.

---

## 15. Auditability / versioning

AIMT must be able to establish, for any certification decision, after the
fact:

- which exam version the student took;
- attempt number;
- the specific question/case/prompt IDs selected for that attempt;
- answer order, where relevant;
- component scores (Part I, II, III);
- competency-level results;
- critical-gate results;
- Cadence interview rubric results;
- remediation history;
- human-review actions, where applicable;
- the final certification decision and its date.

**Assessment banks and rubrics must be versioned.** A later change to a
question, a rubric, or a pass threshold must not silently rewrite what an
earlier student was actually held to — historical attempts must remain
interpretable against the version of the standard that was in force when
they occurred.

---

## 16. Authoritative certification record — hard release requirement (corrected)

**Current risk:** the browser must not be the sole authority for final
certification. If certification state, scoring, or pass/fail determination
can be fully derived or set from client-side (browser/`localStorage`)
state, a student could manipulate that state to unlock a certification
that was never actually earned. This is a real risk under the current
architecture pattern used elsewhere in this course (client-side
`APP_STATE`, synced to Supabase via `aimt-progress-sync.js`'s "higher
score wins" merge rule) and must be treated differently for certification
specifically, since certification is the trust claim this entire program
exists to make credible.

**This is now a release blocker, not a deferred/fast-follow
recommendation.** AIMT may prototype and build the Module 12 UI, exam
flow, and student-facing workflows using development infrastructure at any
stage — that work is not gated by this section. But **no AIMT
certification course's Module 12 (or equivalent) may be released to
production until authoritative certification state is server-side.** The
browser/client is a display and interaction layer; it is never the
authority that decides certification.

**Production-release requirements (all required at release, none of them
built by this document):**

- server-authoritative attempt records;
- server-authoritative component scores (Part I/II/III);
- server-authoritative critical-domain results;
- server-authoritative remediation/attempt status;
- server-authoritative final certification decision;
- certificate issuance checks that authoritative certification record
  before issuing a certificate.

Concretely, for Head Spa's existing architecture pattern: final assessment
scoring, critical-domain evaluation, and the pass/fail determination should
be computed and recorded **server-side** (Cloudflare Pages Function,
matching this repo's existing `functions/api/*.js` pattern), not trusted
from client-submitted scores. The authenticated backend (Supabase,
matching this repo's existing entitlement/progress model) should hold the
authoritative certification record — attempt history, component scores,
critical-domain results, and the final certification decision — with the
client treated as a display layer for that record, not its source of
truth. Certificate issuance (`functions/api/issue-certificate.js` in this
repo's existing pattern) should require the server-side certification
record to show a passing determination before issuing a certificate —
mirroring the existing pattern where certificate issuance already requires
server-verified module completion, extended to require a server-verified
passing assessment result instead of only completion. Individual exam-item
content delivered to the client during an attempt should be limited to
what that attempt needs, to reduce the value of scraping the full bank
from client-visible responses over multiple attempts.

**This document still does not build any of this.** No schema, function,
or grading-pipeline change is authorized by this document. Building this
architecture is reserved for the later, explicitly authorized Module 12
implementation phase — see `00-aimt-course-audit-master-instructions.md`'s
"Master project order," item 4 ("Harden grading, certificate, and progress
integrity"), which this section's requirement feeds directly into. What
changed in this correction pass is the *status* of the requirement: it is
locked as a precondition for production release, not left as an open
timing question for the owner to decide later.

---

## 17. Relationship to Module 12 and future courses

This document is course-agnostic by design. Head Spa's Module 12 is its
first implementation, built out in
`docs/course-audit/modules/module-12-final-exam-raw-blueprint.md` — a raw,
pre-rewrite extraction of Head Spa's specific competencies, candidate
questions, candidate cases, and candidate interview prompts, built strictly
beneath the model defined here. Where a future AIMT course needs a final
assessment, that course should produce its own equivalent raw blueprint
against this same standard, rather than this standard being rewritten
per-course.

Any future revision to this standard itself (the weighting model, the pass
thresholds, the remediation ladder, or the critical-gate bar) should be
recorded as a new, dated version of this document — not a silent edit —
since it governs every AIMT course's certification integrity, not only
Head Spa's.
