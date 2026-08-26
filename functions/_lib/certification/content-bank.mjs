// AIMT Head Spa — Module 12 final-exam PRODUCTION content bank.
//
// GENERATED FILE — DO NOT EDIT BY HAND.
// Produced by scripts/build-module12-assessment-bank.mjs from the three
// LOCKED, owner-approved markdown authority files:
//   docs/course-audit/modules/module-12-final-knowledge-bank.md
//   docs/course-audit/modules/module-12-final-applied-cases.md
//   docs/course-audit/modules/module-12-final-interview-bank.md
//
// To change student-facing exam content: edit the locked markdown (owner
// approval required per docs/course-audit/AIMT-AUDIT-RULES.md-style content
// authority), then re-run: node scripts/build-module12-assessment-bank.mjs
//
// Traceability: docs/course-audit/modules/module-12-content-traceability.md
// records, for every item, the approved Module 1-11 source that supports it.
// Items that traceability could not confirm ship with status:'draft' (see
// BLOCKED_KNOWLEDGE_ITEMS in the generator script) and are excluded from any
// real student selection by isApprovedForProduction() in content-schema.mjs.
//
// tests/certification-content-bank-sync.test.mjs fails CI if the locked
// source files change without this generated file being regenerated to match
// (source hashes are embedded below as SOURCE_HASHES).

import { BANK_VERSION_PENDING, ASSESSMENT_VERSION_V1 } from './assessment-config.mjs';

export const CONTENT_STATUS = 'INSTALLED';

// A real bank version, distinct from the CONTENT_PENDING placeholder this
// file shipped with before installation.
export const bankVersion = 'headspa-fe-bank-v1-2026-08-26';

export const SOURCE_HASHES = {
  "knowledgeBankMd": "acaa86687581df4213686483748b42eb35e79e6a7f323cc28723a62ea14df0d0",
  "appliedCasesMd": "df60822daa285d36014b01cdbd85436ac255daa3d53cf23dc96175e281a6769d",
  "interviewBankMd": "ee76472b379a9ea3c3129389d655499dc371c7740c9ab625180b239fdc3f15c7"
};

/** @type {import('./content-schema.mjs').KnowledgeItem[]} */
export const knowledgeBank = [
  {
    "id": "M01-001",
    "version": 1,
    "sourceModule": 1,
    "sourceSection": "Module 1 approved specification — scope is conditional; certification does not expand legal authority.",
    "competency": "Role vs. license; conditional scope",
    "difficulty": "foundational",
    "criticalDomainEvidence": [],
    "prompt": "A licensed practitioner completes AIMT certification and wants to add several Head Spa techniques and a new water-based device to her menu. Before offering the updated service, what should determine whether each part of it is actually permitted?",
    "choices": [
      "The course curriculum, combined with the device manufacturer’s instructions",
      "Her employer’s service menu, as long as the business carries liability insurance",
      "Her existing license or authorization, applicable state/local rules, establishment requirements, the exact service being performed, and equipment requirements",
      "Whether similarly licensed Head Spa practitioners in her area already offer the same service"
    ],
    "correctChoice": 2,
    "rationale": "AIMT certification documents training; it does not create legal scope. Scope remains conditional on the practitioner’s authorization, jurisdiction, establishment, exact service, and equipment.",
    "status": "approved"
  },
  {
    "id": "M01-002",
    "version": 1,
    "sourceModule": 1,
    "sourceSection": "Module 1 approved specification — observation vs. diagnosis; referral judgment.",
    "competency": "Observation vs. diagnosis",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D1"
    ],
    "prompt": "A returning client says, “My dermatologist told me last year that I had eczema. This looks exactly the same. Can you tell me if it’s back?”\n\nWhich response best reflects the practitioner’s role?",
    "choices": [
      "“I can describe what I’m seeing today and adjust the cosmetic service around it, but I can’t confirm whether a medical condition has returned. If this is new or concerning again, it would be appropriate to have it evaluated.”",
      "“Since you already received that diagnosis previously, I can reasonably treat today’s presentation as the same condition.”",
      "“I can’t discuss the scalp at all once a medical condition has been mentioned, so I would need to end the consultation.”",
      "“It appears consistent with what you were diagnosed with before, but I’ll avoid using the medical name.”"
    ],
    "correctChoice": 0,
    "rationale": "A prior diagnosis does not authorize the practitioner to confirm recurrence. Describing current findings and referring when appropriate stays within the taught boundary.",
    "status": "approved"
  },
  {
    "id": "M01-003",
    "version": 1,
    "sourceModule": 1,
    "sourceSection": "Module 1 approved specification — referral triggers for new/concerning hair-loss patterns and symptomatic findings.",
    "competency": "Referral threshold",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D1",
      "D2"
    ],
    "prompt": "Which finding most clearly changes the decision from **cosmetic modification** to **avoiding treatment of the area and recommending medical evaluation**?",
    "choices": [
      "Fine scale at the hairline after a recent product change, with intact skin and no discomfort",
      "Long-standing diffuse thinning that the client reports has been stable for years",
      "Localized oiliness and visible buildup without pain, broken skin, or rapid change",
      "A newly developing patch of hair loss with a smooth, shiny appearance and burning in the area"
    ],
    "correctChoice": 3,
    "rationale": "New, focal, concerning hair-loss change with burning crosses the taught referral threshold.",
    "status": "approved"
  },
  {
    "id": "M01-004",
    "version": 1,
    "sourceModule": 1,
    "sourceSection": "Module 1 approved specification — realistic benefit/limit framing.",
    "competency": "Realistic benefit framing",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A client asks, “If I come every month, could Head Spa treatments help keep me from losing more hair?”\n\nWhich answer is the most accurate?",
    "choices": [
      "“Regular scalp care can support circulation and follicle health, so it may help slow future loss even though I can’t guarantee it.”",
      "“Regular Head Spa care can support cosmetic cleansing, conditioning and scalp comfort, but I can’t say that it prevents or treats hair loss. If your hair loss is changing or concerning, that deserves medical evaluation.”",
      "“There isn’t enough evidence to guarantee prevention, but keeping the scalp clean and hydrated generally improves the chances of maintaining growth.”",
      "“Think of it as preventive maintenance rather than treatment—the goal is to keep the follicle environment functioning well.”"
    ],
    "correctChoice": 1,
    "rationale": "The course permits realistic cosmetic/wellness benefits but rejects treatment, cure, prevention, and guaranteed regrowth claims.",
    "status": "approved"
  },
  {
    "id": "M01-005",
    "version": 1,
    "sourceModule": 1,
    "sourceSection": "Module 1 checkpoint `m1cp2`.",
    "competency": "Practitioner judgment beyond technique",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "Two practitioners can perform the same Head Spa protocol accurately. During one service, the client becomes unusually tense and reports tenderness near one area of the scalp.\n\nWhich response most clearly demonstrates the difference between **performing the sequence** and **leading the complete service**?",
    "choices": [
      "Completing the planned technique exactly as trained so the service remains consistent",
      "Asking the client whether she wants the practitioner to continue the planned technique unchanged",
      "Recognizing the new information, adjusting the service appropriately, communicating the change, and deciding whether the finding changes what should happen next",
      "Reducing pressure in that area while otherwise keeping the original service plan unchanged"
    ],
    "correctChoice": 2,
    "rationale": "AIMT defines practitioner leadership through observation, communication, adaptation, safety/scope judgment, and appropriate next-step decisions—not technique execution alone.",
    "status": "approved"
  },
  {
    "id": "M01-006",
    "version": 1,
    "sourceModule": 1,
    "sourceSection": "Module 1 approved specification — conditional scope.",
    "competency": "Scope reassessment across jurisdictions/workplaces",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [
      "D1"
    ],
    "prompt": "A cosmetologist has been legally performing a Head Spa service in one state. She relocates, transfers her license, and begins work at a spa using different equipment and a slightly different service menu.\n\nWhat is the strongest approach before assuming she can perform the same service exactly as before?",
    "choices": [
      "Re-evaluate the actual service components against her current license, the new jurisdiction’s rules, establishment requirements, and the equipment being used",
      "Confirm that her transferred license is active; once the license is valid, the previous service can generally continue unchanged",
      "Follow the new spa’s written protocols because the establishment is responsible for determining what employees may perform",
      "Verify the equipment manufacturer’s directions, because the license itself has already established her professional scope"
    ],
    "correctChoice": 0,
    "rationale": "Scope is an intersection of authorization, jurisdiction, establishment, exact service, and equipment—not a portable permission created by certification or one factor alone.",
    "status": "approved"
  },
  {
    "id": "M01-007",
    "version": 1,
    "sourceModule": 1,
    "sourceSection": "Module 1 approved specification — description-only communication and referral judgment.",
    "competency": "Referral communication",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D1"
    ],
    "prompt": "A client has a new area of hair loss that looks noticeably different from the surrounding scalp. You cannot determine the cause, but you believe it should be evaluated before you continue working over that area.\n\nWhich explanation is strongest?",
    "choices": [
      "“I’m seeing a pattern that may indicate alopecia, so I’d like you to have it confirmed before we continue.”",
      "“I don’t know what this is, so unfortunately I can’t tell you anything useful about it.”",
      "“I’m seeing a change here that I can describe, but I can’t determine the cause or diagnose it. Because it’s new and noticeably different, I’d like you to have it evaluated before we work over that area.”",
      "“This probably isn’t serious, but it’s safer for me to refer anything I can’t immediately identify.”"
    ],
    "correctChoice": 2,
    "rationale": "The response describes the limit, explains why the finding changes the service decision, and refers without naming or minimizing a condition.",
    "status": "approved"
  },
  {
    "id": "M01-008",
    "version": 1,
    "sourceModule": 1,
    "sourceSection": "Module 1 approved specification — role limits; cosmetic/wellness framing.",
    "competency": "Cosmetic home-care guidance",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D1"
    ],
    "prompt": "A client with an intact, comfortable scalp asks what she can do at home to reduce ordinary product buildup between appointments.\n\nWhich response is most appropriate?",
    "choices": [
      "Recommend a medicated treatment designed to prevent follicular blockage",
      "Discuss ordinary cleansing frequency, product use, and other cosmetic-care habits without presenting them as treatment for a medical condition",
      "Avoid all home-care guidance because recommending products is outside a Head Spa practitioner’s role",
      "Tell her which active ingredient is most likely to correct the underlying cause of the buildup"
    ],
    "correctChoice": 1,
    "rationale": "Cosmetic-care guidance is allowed when it stays non-diagnostic and does not become prescribing/treatment of a medical condition.",
    "status": "approved"
  },
  {
    "id": "M02-001",
    "version": 1,
    "sourceModule": 2,
    "sourceSection": "Module 2 approved specification — standards vs. rituals; explicit consent.",
    "competency": "Standards vs. rituals",
    "difficulty": "foundational",
    "criticalDomainEvidence": [],
    "prompt": "On a busy morning, the spa is out of the usual tea, the preferred robe size is unavailable, and one aromatherapy option is out of stock. The client has not yet given permission for the practitioner’s usual first-touch cue.\n\nWhich element should **not** simply be adapted away in order to keep the arrival moving?",
    "choices": [
      "The usual tea offering",
      "Explicit consent before the first touch",
      "The exact robe normally offered",
      "The usual three-scent lineup"
    ],
    "correctChoice": 1,
    "rationale": "Hospitality rituals may adapt; explicit consent before touch is a non-negotiable standard.",
    "status": "approved"
  },
  {
    "id": "M02-002",
    "version": 1,
    "sourceModule": 2,
    "sourceSection": "Module 2 approved specification — consent before touch.",
    "competency": "Explicit consent before touch",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D3"
    ],
    "prompt": "A returning client has already signed today’s intake, is reclined with her eyes closed, and has received the same service several times before. The practitioner is ready to place a hand on her shoulder as the first touch of the service.\n\nWhat should happen next?",
    "choices": [
      "Proceed because today’s signed intake confirms general consent to the appointment",
      "Say, “I’m going to place my hand on your shoulder now,” and proceed unless the client objects",
      "Proceed because the client’s prior visits establish what she normally accepts",
      "Ask for permission for the touch, wait for an affirmative response, and then begin"
    ],
    "correctChoice": 3,
    "rationale": "Signed forms, prior visits, silence, and notification are not substitutes for explicit in-the-moment permission for touch.",
    "status": "approved"
  },
  {
    "id": "M02-003",
    "version": 1,
    "sourceModule": 2,
    "sourceSection": "Module 2 approved specification — optional tea/scent framing.",
    "competency": "Optional hospitality without physiological claims",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A client declines the pre-service tea and asks, “Does the tea actually do anything for the treatment, or is it just part of the experience?”\n\nWhich response is strongest?",
    "choices": [
      "“It’s optional. We use it as a small transition into the experience, but the service doesn’t depend on it and I wouldn’t present it as a medical or physiological treatment.”",
      "“It isn’t required, but warm tea can help shift the nervous system into a more relaxed state before treatment.”",
      "“The service will still work without it, although the blend is intended to help lower stress hormones before we begin.”",
      "“It’s mostly hospitality, but hydration before the service can improve how the scalp responds to treatment.”"
    ],
    "correctChoice": 0,
    "rationale": "Tea is an optional experience element; AIMT explicitly rejects physiological/medical claims for it.",
    "status": "approved"
  },
  {
    "id": "M02-004",
    "version": 1,
    "sourceModule": 2,
    "sourceSection": "Module 2 approved specification — prep/privacy instructions.",
    "competency": "Privacy/autonomy",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D3"
    ],
    "prompt": "A client is uncomfortable removing a garment the spa normally suggests taking off before the service. The garment does not actually need to be removed to perform the licensed service safely if appropriate draping and positioning are used.\n\nWhat is the best response?",
    "choices": [
      "Explain that the changing routine is standard and ask her to follow it so every appointment stays consistent",
      "Let her remain dressed but avoid discussing the issue further so she does not feel uncomfortable",
      "Explain what access the service actually requires, offer an appropriate draping or garment alternative, and avoid requiring more undressing than the service needs",
      "Ask the client to decide after the practitioner explains that removing the garment would make the service easier to perform"
    ],
    "correctChoice": 2,
    "rationale": "The course requires clear, service-limited changing instructions that protect privacy, choice, and autonomy.",
    "status": "approved"
  },
  {
    "id": "M02-005",
    "version": 1,
    "sourceModule": 2,
    "sourceSection": "Module 2 checkpoint `m2cp1`.",
    "competency": "Arrival leadership under schedule pressure",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A client arrives eight minutes late, visibly stressed. Completing the original appointment exactly as scheduled may affect the next booking.\n\nWhich response best protects both the client experience and the practitioner’s operational responsibility?",
    "choices": [
      "Skip parts of the arrival sequence so the hands-on service can still receive its full planned time",
      "Settle the client first, complete the required intake/privacy/consent steps, and only then communicate any genuinely necessary timing adjustment without blame or visible rushing",
      "Tell the client immediately that the service will be shortened so expectations are clear before anything else happens",
      "Promise the full original service and quietly make up the lost time by moving faster through transitions"
    ],
    "correctChoice": 1,
    "rationale": "AIMT teaches absorbing schedule pressure professionally without skipping required arrival standards or transferring stress to the client.",
    "status": "draft"
  },
  {
    "id": "M02-006",
    "version": 1,
    "sourceModule": 2,
    "sourceSection": "Module 2 approved specification — standards vs. rituals; consent.",
    "competency": "Distinguishing adaptable ritual from professional standard",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [
      "D3"
    ],
    "prompt": "Which change crosses the line from an **adapted ritual** into a **breakdown of a professional standard**?",
    "choices": [
      "Replacing the usual tea with water because the preferred option is unavailable",
      "Offering fragrance-free service because the client no longer wants aromatherapy",
      "Using a cape instead of the usual robe when it provides the same privacy and appropriate access",
      "Beginning the familiar first-touch sequence without asking because the returning client has accepted it at previous appointments"
    ],
    "correctChoice": 3,
    "rationale": "Prior acceptance never substitutes for current consent.",
    "status": "approved"
  },
  {
    "id": "M02-007",
    "version": 1,
    "sourceModule": 2,
    "sourceSection": "Module 2 approved specification — intake review plus in-person confirmation.",
    "competency": "Verbal intake confirmation",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D3"
    ],
    "prompt": "A client’s submitted intake says she has no fragrance sensitivities. When she arrives, she says, “Actually, I reacted to a scented product last week.”\n\nWhat should control today’s service?",
    "choices": [
      "The signed intake, because it is the formal record for this appointment",
      "The intake remains valid unless the client can identify the ingredient that caused the reaction",
      "The new information should be confirmed and incorporated into today’s plan before the service begins",
      "Aromatherapy can continue as long as a different scent family is chosen"
    ],
    "correctChoice": 2,
    "rationale": "Current verbal confirmation updates the service plan when relevant information has changed.",
    "status": "approved"
  },
  {
    "id": "M02-008",
    "version": 1,
    "sourceModule": 2,
    "sourceSection": "Module 2 approved specification — optional scent; autonomy.",
    "competency": "Client choice/autonomy",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D3"
    ],
    "prompt": "A client smells the aromatherapy options and says she would rather not use fragrance today.\n\nWhat is the strongest response?",
    "choices": [
      "Encourage her to choose the mildest option so she still receives the complete Head Spa experience",
      "Treat fragrance-free as a fully valid option and continue without making the client feel she is missing an essential part of the service",
      "Skip aromatherapy but explain that the relaxation effect may be reduced",
      "Offer to use a very small amount so the sensory opening is preserved"
    ],
    "correctChoice": 1,
    "rationale": "Fragrance is optional and fragrance-free is a valid service path, not a lesser version.",
    "status": "approved"
  },
  {
    "id": "M02-009",
    "version": 1,
    "sourceModule": 2,
    "sourceSection": "Module 2 approved specification — orientation and communication.",
    "competency": "Concise orientation",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "Which introduction best prepares the client while preserving the relaxation-first character of the service?",
    "choices": [
      "“I’ll explain each step as we go so you always know exactly what I’m doing.”",
      "“Once we begin, I’ll keep the service completely quiet unless you speak first.”",
      "“We’ll keep the service fairly quiet, but please tell me anytime if you want the temperature, pressure, positioning, or anything else adjusted.”",
      "“Everything was covered on your intake, so you shouldn’t need to make any decisions once we start.”"
    ],
    "correctChoice": 2,
    "rationale": "AIMT teaches concise orientation that preserves client control without turning the service into continuous narration.",
    "status": "approved"
  },
  {
    "id": "M03-001",
    "version": 1,
    "sourceModule": 3,
    "sourceSection": "Module 3 approved specification — scalp anatomy.",
    "competency": "Scalp layers",
    "difficulty": "foundational",
    "criticalDomainEvidence": [],
    "prompt": "Which sequence correctly lists the five commonly described scalp layers from superficial to deep?",
    "choices": [
      "Skin → dense connective tissue → galea aponeurotica → loose areolar tissue → pericranium",
      "Skin → galea aponeurotica → dense connective tissue → loose areolar tissue → pericranium",
      "Skin → dense connective tissue → loose areolar tissue → galea aponeurotica → pericranium",
      "Skin → dense connective tissue → galea aponeurotica → pericranium → loose areolar tissue"
    ],
    "correctChoice": 0,
    "rationale": "This is the SCALP order taught in Module 3.",
    "status": "approved"
  },
  {
    "id": "M03-002",
    "version": 1,
    "sourceModule": 3,
    "sourceSection": "Module 3 approved specification — hair shaft vs. follicle.",
    "competency": "Hair shaft vs. follicle",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A client asks why a conditioning treatment can make her hair feel smoother immediately but cannot be described as “healing the follicle.”\n\nWhich explanation is most accurate?",
    "choices": [
      "The service works only on the outermost skin layer and therefore has no relationship to the follicular unit",
      "Products can repair the living cells of the hair shaft, but the follicle sits too far below the surface to respond",
      "The visible hair shaft is nonliving keratinized material that can be changed cosmetically; the follicle is living tissue, and a surface Head Spa service does not diagnose or directly treat its internal function",
      "The follicle is part of the hair shaft until the hair emerges through the scalp, after which it becomes nonliving"
    ],
    "correctChoice": 2,
    "rationale": "The module distinguishes the nonliving, cosmetically addressable shaft from the living follicle.",
    "status": "approved"
  },
  {
    "id": "M03-003",
    "version": 1,
    "sourceModule": 3,
    "sourceSection": "Module 3 checkpoint `cp1`.",
    "competency": "Shedding timeline reasoning",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D1"
    ],
    "prompt": "A client says her diffuse shedding became noticeable about three weeks ago. During history-taking she mentions:\n\n- a high fever about three months before the shedding began;\n- switching shampoos two weeks after the shedding began;\n- a particularly stressful workday yesterday;\n- a haircut six weeks before the shedding began.\n\nWhich history detail deserves the most attention when discussing the **timing** of the shedding?",
    "choices": [
      "The shampoo change, because product changes are usually most relevant to visible shedding",
      "Yesterday’s stress, because a current stressor best explains what is happening now",
      "The haircut, because hair manipulation can alter the growth cycle several weeks later",
      "The high fever, because a major physiological event may precede visible diffuse shedding by several weeks to a few months"
    ],
    "correctChoice": 3,
    "rationale": "The course teaches a weeks-to-months delay between some significant events and visible diffuse shedding, without treating timing as proof of cause.",
    "status": "approved"
  },
  {
    "id": "M03-004",
    "version": 1,
    "sourceModule": 3,
    "sourceSection": "Module 3 approved specification — stratum corneum and surface-lipid distinction.",
    "competency": "Stratum corneum/barrier reasoning",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A client has visible oil at the roots but also reports tightness after frequent clarifying. She says, “If my scalp is oily, the barrier must be fine.”\n\nWhich explanation is most accurate?",
    "choices": [
      "Oiliness generally confirms that the barrier is intact because sebum and the skin barrier perform the same function",
      "The stratum corneum is the principal protective barrier; surface oil is only one part of the scalp environment, so oiliness does not rule out irritation or barrier disruption",
      "Tightness confirms that the sebaceous glands have stopped producing enough oil, even if oil is still visible",
      "A scalp cannot be both oily and barrier-disrupted at the same time, so one of the observations is probably inaccurate"
    ],
    "correctChoice": 1,
    "rationale": "Surface oil and barrier function are related but not interchangeable concepts.",
    "status": "approved"
  },
  {
    "id": "M03-005",
    "version": 1,
    "sourceModule": 3,
    "sourceSection": "Module 3 approved specification — referral triggers.",
    "competency": "Concerning hair-loss presentation",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D1",
      "D2"
    ],
    "prompt": "Which presentation most strongly suggests that the practitioner should **avoid massage or other cosmetic treatment of the area and recommend medical evaluation**?",
    "choices": [
      "A newly developing asymmetric area of hair loss with a smooth, shiny appearance and burning",
      "Diffuse shedding reported after childbirth, with intact comfortable skin and no patchy loss",
      "Long-standing generalized thinning that the client reports has remained unchanged",
      "Mild scalp tightness after frequent clarifying, with intact skin and no pain"
    ],
    "correctChoice": 0,
    "rationale": "Patchy/asymmetric/scarring-type change with burning is a referral-level presentation in the approved material.",
    "status": "approved"
  },
  {
    "id": "M03-006",
    "version": 1,
    "sourceModule": 3,
    "sourceSection": "Module 3 checkpoint `cp2`.",
    "competency": "Barrier-aware service adaptation",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A client reports tightness and visible loose flaking after using a strong clarifying shampoo every day. The scalp is intact, with no marked redness, pain, drainage or other referral finding.\n\nWhich service change is the most defensible **first** adjustment?",
    "choices": [
      "Add stronger steam while keeping the same cleanser so the scalp receives more moisture during processing",
      "Skip cleansing entirely and rely on massage and conditioning so the barrier can recover",
      "Use a gentler cleansing approach, avoid aggressive exfoliation or unnecessary heat, and monitor how the scalp feels during the service",
      "Switch to an anti-dandruff cleanser because visible flaking suggests the current product is not strong enough"
    ],
    "correctChoice": 2,
    "rationale": "The module teaches conservative change when product history suggests possible barrier disruption.",
    "status": "approved"
  },
  {
    "id": "M03-007",
    "version": 1,
    "sourceModule": 3,
    "sourceSection": "Module 3 checkpoint `cp1` + Module 1 scope boundary.",
    "competency": "Shedding timing + scope",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [
      "D1"
    ],
    "prompt": "A client reports diffuse heavy shedding that began roughly ten weeks after a high fever. She says, “That sounds like telogen effluvium. Is that what I have?”\n\nWhich response uses the anatomy and timing correctly **without exceeding the practitioner’s role**?",
    "choices": [
      "“The timing strongly supports telogen effluvium, so that is probably what is happening even though I can’t officially diagnose it.”",
      "“A delayed diffuse shedding pattern can occur several weeks to a few months after a major illness, so the timing is relevant. I can’t confirm the cause or diagnose the condition from this history, and persistent or concerning shedding should be medically evaluated.”",
      "“The fever happened before the shedding, so we can reasonably say it triggered the hair loss even if we avoid naming the condition.”",
      "“Because timing alone cannot confirm a diagnosis, the earlier fever should not influence our assessment or client conversation.”"
    ],
    "correctChoice": 1,
    "rationale": "AIMT permits educational timing discussion but not diagnosis or certainty about causation.",
    "status": "approved"
  },
  {
    "id": "M03-008",
    "version": 1,
    "sourceModule": 3,
    "sourceSection": "Module 3 approved specification — pilosebaceous unit.",
    "competency": "Pilosebaceous anatomy",
    "difficulty": "foundational",
    "criticalDomainEvidence": [],
    "prompt": "Which structures belong together as part of the pilosebaceous unit?",
    "choices": [
      "Hair shaft, sweat gland, and stratum corneum",
      "Hair follicle, sebaceous gland, and associated hair structure",
      "Hair shaft, pericranium, and connective tissue",
      "Sebaceous gland, epidermis, and galea aponeurotica"
    ],
    "correctChoice": 1,
    "rationale": "Module 3 teaches the follicle/sebaceous relationship as part of the pilosebaceous unit.",
    "status": "approved"
  },
  {
    "id": "M03-009",
    "version": 1,
    "sourceModule": 3,
    "sourceSection": "Module 3 approved specification — pilosebaceous relevance and observation limits.",
    "competency": "Pilosebaceous anatomy → observation limit",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "Magnification shows visible oil around several follicular openings.\n\nWhat can the practitioner reasonably conclude from anatomy alone?",
    "choices": [
      "The sebaceous glands are overactive and causing the client’s scalp problem",
      "The follicles are clogged because sebum cannot escape normally",
      "Sebaceous glands contribute oil to the follicular environment, but the visible oil does not by itself establish why it is present or what condition the client has",
      "Oil around follicular openings confirms a dandruff-spectrum presentation"
    ],
    "correctChoice": 2,
    "rationale": "Anatomy can explain where oil originates without proving cause or diagnosis.",
    "status": "approved"
  },
  {
    "id": "M03-010",
    "version": 1,
    "sourceModule": 3,
    "sourceSection": "Module 3 approved specification — anagen/catagen/telogen/exogen.",
    "competency": "Hair-cycle phases",
    "difficulty": "foundational",
    "criticalDomainEvidence": [],
    "prompt": "Which description is correct?",
    "choices": [
      "Anagen is the shedding phase; telogen is active growth",
      "Anagen is active growth, catagen is transition, telogen is resting, and exogen refers to shedding/release",
      "Catagen and telogen are two names for the same resting phase",
      "Exogen is the phase when a new follicle is formed"
    ],
    "correctChoice": 1,
    "rationale": "This is the phase framework taught in Module 3.",
    "status": "approved"
  },
  {
    "id": "M03-011",
    "version": 1,
    "sourceModule": 3,
    "sourceSection": "Module 3 approved specification — delayed shedding timeline.",
    "competency": "Timeline reasoning with competing history",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [
      "D1"
    ],
    "prompt": "A client’s increased shedding began six weeks ago. She reports:\n\n- major surgery about three months before the shedding began;\n- a new shampoo one week before the shedding began;\n- a stressful argument yesterday.\n\nWhich statement shows the strongest reasoning?",
    "choices": [
      "The shampoo is the most likely cause because it occurred closest to the start of shedding",
      "The earlier surgery fits the kind of delayed timeline the course teaches can be relevant, but timing alone still does not prove causation or establish a diagnosis",
      "Yesterday’s stress is most relevant because current stress affects current shedding",
      "None of these events should be discussed because practitioners cannot talk about shedding timelines"
    ],
    "correctChoice": 1,
    "rationale": "Relevant timing can guide history-taking without proving cause or diagnosis.",
    "status": "approved"
  },
  {
    "id": "M03-012",
    "version": 1,
    "sourceModule": 3,
    "sourceSection": "Module 3 approved specification — honest massage scope.",
    "competency": "Massage scope/claims",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D1"
    ],
    "prompt": "A client asks whether scalp massage helps hair grow by “bringing nutrients to the follicles.”\n\nWhich response is strongest?",
    "choices": [
      "“Yes. Improved circulation helps nutrients reach the follicle more efficiently.”",
      "“Massage can stimulate blood flow, which is why it is commonly used for hair-growth support.”",
      "“I’d describe the massage in terms of comfort, technique, and the sensory experience. I wouldn’t present it as a proven way to deliver nutrients to follicles or regrow hair.”",
      "“There is no physical effect from scalp massage at all; it is purely psychological.”"
    ],
    "correctChoice": 2,
    "rationale": "AIMT permits comfort/sensory/technique framing and rejects unsupported nutrient-delivery or regrowth claims.",
    "status": "approved"
  },
  {
    "id": "M04-001",
    "version": 1,
    "sourceModule": 4,
    "sourceSection": "Module 4 approved specification — cosmetic scalp-camera use vs. medical trichoscopy.",
    "competency": "Scalp-camera purpose",
    "difficulty": "foundational",
    "criticalDomainEvidence": [],
    "prompt": "A client asks, “So once you look at my scalp under the camera, will you be able to tell me exactly what’s wrong?”\n\nWhich response best reflects the purpose of the assessment?",
    "choices": [
      "“Usually, yes. Magnification lets me identify most common scalp conditions more accurately than the naked eye.”",
      "“It gives us a much clearer look, so I can usually narrow it down to the most likely condition even if I can’t formally diagnose it.”",
      "“It gives me better visual evidence to compare across your scalp and use in the cosmetic service. It can sharpen the question, but it does not establish a medical diagnosis or cause.”",
      "“The camera itself cannot tell us anything clinically useful, so I mainly use it to help clients see their scalp.”"
    ],
    "correctChoice": 2,
    "rationale": "Magnification supports observation and service customization but does not establish diagnosis or cause.",
    "status": "approved"
  },
  {
    "id": "M04-002",
    "version": 1,
    "sourceModule": 4,
    "sourceSection": "Module 4 approved specification — five-point scan.",
    "competency": "Five-point scan sequence",
    "difficulty": "foundational",
    "criticalDomainEvidence": [],
    "prompt": "Which sequence correctly follows AIMT’s baseline five-point scalp scan?",
    "choices": [
      "Front → Crown → Top → Side → Back",
      "Front → Top → Crown → Side → Back",
      "Top → Front → Side → Crown → Back",
      "Front → Side → Top → Crown → Back"
    ],
    "correctChoice": 1,
    "rationale": "This is the taught baseline order: frontal hairline → top parting → crown/vertex → temporal → occipital/back.",
    "status": "approved"
  },
  {
    "id": "M04-003",
    "version": 1,
    "sourceModule": 4,
    "sourceSection": "Module 4 checkpoint `m4cp2`.",
    "competency": "Stop/refer + device reprocessing",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D1",
      "D2",
      "D4"
    ],
    "prompt": "During the crown station, the practitioner sees several raised areas with visible fluid and crusting. The client says, “It doesn’t hurt at all, and I really want to keep my appointment.”\n\nWhat is the strongest response?",
    "choices": [
      "Avoid direct contact with those spots but continue the rest of the scalp service because the client is comfortable",
      "Take one additional image with lighter pressure to determine whether the finding is superficial before deciding",
      "Stop device contact with the area, do not continue cosmetic scalp treatment over the finding, explain that it needs medical evaluation, and reprocess the device appropriately if contact or contamination occurred",
      "Continue with only gentle cleansing and omit exfoliation, since the absence of pain lowers the immediate concern"
    ],
    "correctChoice": 2,
    "rationale": "Client comfort does not override a visible do-not-proceed finding, and contaminated equipment must be reprocessed.",
    "status": "approved"
  },
  {
    "id": "M04-004",
    "version": 1,
    "sourceModule": 4,
    "sourceSection": "Module 4 approved specification — device/image artifacts.",
    "competency": "Artifact recognition",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A practitioner is having trouble focusing the camera and presses more firmly against the scalp. A localized color change becomes much more obvious on the screen.\n\nWhat is the best next step?",
    "choices": [
      "Document the stronger color change because firmer contact produced the clearest image",
      "Reduce the pressure and recapture the area under standardized conditions before interpreting the color change",
      "Compare the pressured image with another region to determine whether the client has a reactive presentation",
      "Keep the image but note that contact pressure may have intensified an underlying finding"
    ],
    "correctChoice": 1,
    "rationale": "Excess pressure can manufacture misleading visual change; recapture under standardized conditions before interpretation.",
    "status": "approved"
  },
  {
    "id": "M04-005",
    "version": 1,
    "sourceModule": 4,
    "sourceSection": "Module 4 approved specification — observation discipline.",
    "competency": "Description-only documentation",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "Which chart note stays closest to what the image actually earned?",
    "choices": [
      "“Follicular congestion at the crown, likely related to excess sebum and infrequent cleansing.”",
      "“Possible clogged follicles with buildup concentrated around several shafts.”",
      "“Diffuse surface shine at the crown with visible yellow-white material around several follicular openings.”",
      "“Oil-dominant scalp with early dandruff-like buildup at the crown.”"
    ],
    "correctChoice": 2,
    "rationale": "It reports visible evidence without assigning cause, diagnosis, or unsupported mechanism.",
    "status": "approved"
  },
  {
    "id": "M04-006",
    "version": 1,
    "sourceModule": 4,
    "sourceSection": "Module 4 approved specification — layered image consent.",
    "competency": "Image-consent tiers",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D3"
    ],
    "prompt": "A client agrees to view her scalp live under magnification. During the scan, the practitioner realizes the images would also be useful for future service comparisons and perhaps for a staff-training presentation.\n\nWhat does the original consent allow?",
    "choices": [
      "Live viewing and saving to the client record, but not staff training",
      "Live viewing plus any internal professional use, as long as the client’s face is not shown",
      "Saving for comparison because that directly supports her service, but separate permission is needed only for marketing",
      "Live viewing only; saving and later teaching/training use require their own appropriate permissions"
    ],
    "correctChoice": 3,
    "rationale": "Live viewing, saving, and later secondary use are distinct permission decisions.",
    "status": "approved"
  },
  {
    "id": "M04-007",
    "version": 1,
    "sourceModule": 4,
    "sourceSection": "Module 4 approved specification — device hygiene.",
    "competency": "Device hygiene/reprocessing",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D4"
    ],
    "prompt": "During assessment, the camera’s contact surface accidentally touches compromised skin before the practitioner realizes the area is broken.\n\nWhich response best protects the next client?",
    "choices": [
      "Wipe the contact surface immediately and continue using it because the contact was brief",
      "Finish this client’s assessment with the same device, then complete the full disinfection process afterward",
      "Remove the device from use and follow its manufacturer-directed cleaning/disinfection process before it is used again",
      "Replace the removable lens cover if one is present; no further action is needed unless visible material remains"
    ],
    "correctChoice": 2,
    "rationale": "Contact with compromised skin requires removing the device from service and reprocessing it appropriately before reuse.",
    "status": "approved"
  },
  {
    "id": "M04-008",
    "version": 1,
    "sourceModule": 4,
    "sourceSection": "Module 4 approved specification — distribution and regional comparison.",
    "competency": "Regional/distribution reasoning",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "The crown image shows substantial shine and surface material. The remaining four baseline stations appear much closer to the client’s usual baseline.\n\nWhich interpretation is strongest?",
    "choices": [
      "Classify the client as oil-dominant because the crown produced the clearest abnormal finding",
      "Use the crown as the primary scalp category but reduce intensity slightly in the calmer regions",
      "Document the crown as a regional finding and avoid allowing one dramatic station to define the entire scalp",
      "Repeat the crown image at higher magnification before deciding whether the difference is truly regional"
    ],
    "correctChoice": 2,
    "rationale": "Distribution across the scalp is more informative than allowing one dramatic station to define the whole client.",
    "status": "approved"
  },
  {
    "id": "M04-009",
    "version": 1,
    "sourceModule": 4,
    "sourceSection": "Module 4 approved specification — comparison integrity.",
    "competency": "Matched before/after comparison",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [],
    "prompt": "At a follow-up visit, a practitioner wants to show improvement using a previous scalp image. The original photo was captured at the crown under one magnification and lighting setup. Today’s clearest image was taken slightly farther forward with brighter light and lighter device pressure.\n\nWhat is the strongest professional choice?",
    "choices": [
      "Use both images because visible improvement is still useful even if the capture settings were different",
      "Show the images but explain that lighting and magnification may account for some of the change",
      "Do not present them as a true before-and-after comparison; recapture the original region under matched conditions when possible",
      "Adjust the brightness of the older image so the two captures are visually comparable"
    ],
    "correctChoice": 2,
    "rationale": "Valid comparison requires matched region and capture conditions.",
    "status": "approved"
  },
  {
    "id": "M04-010",
    "version": 1,
    "sourceModule": 4,
    "sourceSection": "Module 4 approved specification — five observation lenses.",
    "competency": "Observation lenses",
    "difficulty": "foundational",
    "criticalDomainEvidence": [],
    "prompt": "Which set matches AIMT’s observation lenses during scalp-camera assessment?",
    "choices": [
      "Color, diagnosis, severity, product need, and treatment response",
      "Surface, follicular openings, perifollicular area, hair shafts, and distribution",
      "Oil, dryness, dandruff, sensitivity, and hair loss",
      "Front, top, crown, side, and back"
    ],
    "correctChoice": 1,
    "rationale": "These are the five lenses applied at each scan station.",
    "status": "approved"
  },
  {
    "id": "M04-011",
    "version": 1,
    "sourceModule": 4,
    "sourceSection": "Module 4 approved specification — five observation lenses.",
    "competency": "Complete observation",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A practitioner documents:\n\n> “Fine scale is visible across the surface. Several follicular openings remain clearly visible. Hair shafts appear intact.”\n\nWhat important observation dimension is still largely missing?",
    "choices": [
      "A diagnosis",
      "Product history",
      "Distribution—where the finding is concentrated or whether it is regional versus diffuse",
      "Treatment recommendation"
    ],
    "correctChoice": 2,
    "rationale": "The note describes several lenses but does not establish distribution.",
    "status": "approved"
  },
  {
    "id": "M04-012",
    "version": 1,
    "sourceModule": 4,
    "sourceSection": "Module 4 approved specification — standardized image collection.",
    "competency": "Standardized capture",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "Why should assessment images generally be collected before treatment products are applied and under consistent conditions?",
    "choices": [
      "Because product application permanently alters the scalp’s clinical appearance",
      "Because pre-treatment images are legally stronger evidence",
      "Because products, lighting, pressure, magnification and other capture differences can change what the image looks like and weaken comparison quality",
      "Because a scalp camera only functions accurately on completely untreated hair"
    ],
    "correctChoice": 2,
    "rationale": "Standardized capture reduces artifacts and makes comparison more defensible.",
    "status": "approved"
  },
  {
    "id": "M04-013",
    "version": 1,
    "sourceModule": 4,
    "sourceSection": "Module 4 approved specification — targeted/comparison views.",
    "competency": "Targeted views",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "The baseline five-point scan is mostly consistent, but the client reports one localized area near the temple that has changed recently.\n\nWhat is the strongest next step?",
    "choices": [
      "Repeat all five stations at higher magnification",
      "Add a targeted view of the area because the client history gives a specific reason to examine it more closely",
      "Ignore the area because it is outside the standardized five-point sequence",
      "Replace the temporal baseline image with the targeted view"
    ],
    "correctChoice": 1,
    "rationale": "Targeted views are added when history or baseline findings justify them; they supplement rather than replace the baseline scan.",
    "status": "approved"
  },
  {
    "id": "M04-014",
    "version": 1,
    "sourceModule": 4,
    "sourceSection": "Module 4 approved specification — Supported observation / Working question / Unsupported conclusion.",
    "competency": "Supported observation / working question / unsupported conclusion",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [
      "D1"
    ],
    "prompt": "An image shows localized redness and adherent scale.\n\nWhich statement is best classified as a **working question** rather than a supported observation or unsupported conclusion?",
    "choices": [
      "“Localized redness and adherent scale are visible.”",
      "“Has the client noticed itching, tenderness, product changes, or spread beyond this area?”",
      "“This is psoriasis.”",
      "“The redness is being caused by inflammation.”"
    ],
    "correctChoice": 1,
    "rationale": "A working question seeks context without turning the image into a diagnosis or causal claim.",
    "status": "approved"
  },
  {
    "id": "M05-001",
    "version": 1,
    "sourceModule": 5,
    "sourceSection": "Module 5 approved specification — service directions/patterns.",
    "competency": "Current service direction vs. permanent label",
    "difficulty": "foundational",
    "criticalDomainEvidence": [],
    "prompt": "A client’s crown is shiny with visible surface residue, while the sides show fine loose scale and little shine.\n\nWhich statement best reflects the Module 5 framework?",
    "choices": [
      "The client should be classified by whichever presentation covers the largest percentage of the scalp",
      "The practitioner should determine whether the client is primarily oily, dry, or combination before selecting a protocol",
      "The findings describe current regional service needs; they do not require one permanent whole-scalp type",
      "Mixed presentations should generally be treated at the gentlest intensity across the entire scalp"
    ],
    "correctChoice": 2,
    "rationale": "Module 5 treats patterns as current, regional service directions rather than permanent scalp identities.",
    "status": "approved"
  },
  {
    "id": "M05-002",
    "version": 1,
    "sourceModule": 5,
    "sourceSection": "Module 5 approved specification — five-step decision priority.",
    "competency": "Decision-priority order",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A client has visible residue at the crown and wants a “deep clean.” At the hairline she reports recent burning after changing products, although the skin remains intact.\n\nWhat should influence the plan **before** deciding how aggressively to address the crown residue?",
    "choices": [
      "The amount of visible residue, because that is the clearest cosmetic need",
      "The reported reactivity and whether the service can be delivered comfortably and safely by region",
      "The client’s deep-clean goal, because the skin is still intact",
      "The product category the practitioner originally planned to use"
    ],
    "correctChoice": 1,
    "rationale": "Safety/reactivity and tolerance outrank visible cosmetic need and preference.",
    "status": "approved"
  },
  {
    "id": "M05-003",
    "version": 1,
    "sourceModule": 5,
    "sourceSection": "Module 5 checkpoint `m5cp2`.",
    "competency": "Safety outranks client request",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D2"
    ],
    "prompt": "A client reports stinging and tenderness but insists, “I’m okay with it—give me the strongest exfoliation and steam. I’m paying for the full service.”\n\nWhich response best reflects AIMT’s standard?",
    "choices": [
      "Explain the risks, document her informed consent, and proceed at the requested intensity if she still agrees",
      "Compromise by performing the strongest steps only in the areas that look least reactive",
      "Explain that her reported symptoms change what is appropriate today, reduce or omit the aggressive elements, and offer a gentler compatible service or pause when appropriate",
      "End the appointment immediately because any reported stinging automatically requires medical referral"
    ],
    "correctChoice": 2,
    "rationale": "Client consent/request does not make an inappropriate intensity professionally appropriate.",
    "status": "approved"
  },
  {
    "id": "M05-004",
    "version": 1,
    "sourceModule": 5,
    "sourceSection": "Module 5 approved specification — visible scale is not automatic permission to exfoliate.",
    "competency": "Exfoliation decision",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "During assessment, the practitioner sees fine loose scale at the hairline. The client reports tightness after frequent clarifying but no burning, tenderness, broken skin, or other referral finding.\n\nWhich decision best reflects the service-lever model?",
    "choices": [
      "Exfoliate gently because visible scale means some form of exfoliation is indicated",
      "First reduce unnecessary stripping and stimulation; exfoliation should be used only if the surface, history, product and client tolerance actually support it",
      "Skip cleansing and exfoliation completely because any dry-appearing scale indicates barrier damage",
      "Use steam first to soften the scale, then decide whether exfoliation is necessary"
    ],
    "correctChoice": 1,
    "rationale": "Visible scale is not automatic permission to exfoliate; the whole presentation and history control the lever.",
    "status": "approved"
  },
  {
    "id": "M05-005",
    "version": 1,
    "sourceModule": 5,
    "sourceSection": "Module 5 checkpoint `m5cp1`.",
    "competency": "Regional adaptation",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "Assessment shows:\n- crown: visible shine/residue, intact and comfortable;\n- hairline: fine loose scale, intact and comfortable;\n- remaining scalp: no dominant concern.\n\nWhich plan is strongest?",
    "choices": [
      "Perform a full-scalp clarifying cleanse and reduce the exfoliation intensity near the hairline",
      "Use the gentlest plan everywhere so the dry-appearing hairline is not overworked",
      "Cleanse the crown more thoroughly, keep the hairline gentler, preserve the stable regions, and adjust product placement/finish accordingly",
      "Treat the crown and hairline separately but add a light corrective step to the stable regions so the service remains balanced"
    ],
    "correctChoice": 2,
    "rationale": "Module 5 teaches regional service decisions and preserving stable regions rather than overcorrecting the whole scalp.",
    "status": "approved"
  },
  {
    "id": "M05-006",
    "version": 1,
    "sourceModule": 5,
    "sourceSection": "Module 5 approved specification — referral triggers.",
    "competency": "Stop/pause/refer threshold",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D2"
    ],
    "prompt": "Halfway through a service, the practitioner discovers an area that is moist, broken and visibly draining.\n\nWhat should happen to the service plan?",
    "choices": [
      "Move that region from Modify to Avoid and continue the remaining scalp normally",
      "Clean the visible fluid away, then reassess whether the skin underneath appears intact enough to proceed",
      "Stop contact with the affected area, pause the scalp service as appropriate, and recommend medical evaluation rather than trying to cosmetically work around the finding",
      "Continue only low-stimulation steps that do not involve exfoliation or massage"
    ],
    "correctChoice": 2,
    "rationale": "Broken/moist/draining skin crosses the cosmetic-service limit rather than calling for mere regional modification.",
    "status": "approved"
  },
  {
    "id": "M05-007",
    "version": 1,
    "sourceModule": 5,
    "sourceSection": "Module 5 approved specification — choose product category for a stated reason.",
    "competency": "Product selection reasoning",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A practitioner has a new exfoliating product she wants to introduce into her premium service. The client’s assessment shows a stable, comfortable baseline presentation with no meaningful buildup or scale.\n\nWhich reasoning is strongest?",
    "choices": [
      "Use the product at its mildest setting so the client still receives the premium feature",
      "Use it only on the crown because that region usually tolerates more intensive treatment",
      "Do not create a reason to exfoliate simply because the product is available; preserve the stable presentation unless the assessment actually supports that lever",
      "Ask whether the client enjoys exfoliation and let preference determine whether it is included"
    ],
    "correctChoice": 2,
    "rationale": "Product choice follows the assessed need; availability or menu positioning does not manufacture a reason to intervene.",
    "status": "approved"
  },
  {
    "id": "M05-008",
    "version": 1,
    "sourceModule": 5,
    "sourceSection": "Module 5 approved specification — decision priority + regional protocol.",
    "competency": "Regional decision priority + client request",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [
      "D2"
    ],
    "prompt": "The five-point assessment shows mild residue at the crown, a reactive-appearing hairline, and otherwise stable regions. The client reports recent burning at the hairline but says she wants the strongest possible service because she has a special event tomorrow.\n\nWhich plan best integrates the module?",
    "choices": [
      "Avoid the hairline and perform the strongest cleansing/steam/exfoliation elsewhere so the client still receives the result she requested",
      "Use a uniform moderate-intensity protocol to balance the visible residue with the reported sensitivity",
      "Establish the reactive hairline as the limiting factor for that region, address the crown residue conservatively, preserve stable regions, and explain why the client’s requested intensity does not control the plan",
      "Cancel the entire service because a reactive-appearing region means the rest of the scalp cannot be treated"
    ],
    "correctChoice": 2,
    "rationale": "The answer applies safety/tolerance by region without allowing preference to control the plan or overgeneralizing one region to the whole scalp.",
    "status": "approved"
  },
  {
    "id": "M05-009",
    "version": 1,
    "sourceModule": 5,
    "sourceSection": "Module 5 approved specification — five service levers.",
    "competency": "Service levers",
    "difficulty": "foundational",
    "criticalDomainEvidence": [],
    "prompt": "Which list best reflects the service levers taught in Module 5?",
    "choices": [
      "Diagnosis, product, massage, retail, and referral",
      "Cleansing, exfoliation, water/steam, pressure/tempo, and product placement/finish",
      "Shampoo, conditioner, massage, steam, and checkout",
      "Oil, dryness, sensitivity, buildup, and shedding"
    ],
    "correctChoice": 1,
    "rationale": "These are the five adjustable service levers taught in the module.",
    "status": "approved"
  },
  {
    "id": "M05-010",
    "version": 1,
    "sourceModule": 5,
    "sourceSection": "Module 5 approved specification — five service levers.",
    "competency": "Lever-specific adaptation",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A client’s scalp appears generally stable, but she reports that firm pressure feels uncomfortable today. There is no reason to change the selected cleansing product.\n\nWhat is the strongest adaptation?",
    "choices": [
      "Replace the cleanser with a gentler product because any sensitivity should change the entire protocol",
      "Adjust pressure/tempo while preserving other appropriate service choices that the assessment still supports",
      "Skip massage entirely because discomfort means the service plan is no longer valid",
      "Keep the pressure level but shorten massage duration"
    ],
    "correctChoice": 1,
    "rationale": "Adapt the lever that actually needs adjustment rather than changing unrelated parts of the plan.",
    "status": "approved"
  },
  {
    "id": "M05-011",
    "version": 1,
    "sourceModule": 5,
    "sourceSection": "Module 5 approved specification — Preserve/Modify/Avoid/Pause/Refer.",
    "competency": "Preserve vs. modify",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [],
    "prompt": "Assessment shows one region needing more targeted cleansing, one region requiring gentler handling, and a large central area that appears stable and comfortable.\n\nWhat should happen in the stable area?",
    "choices": [
      "Use the stronger approach so the service remains consistent across the scalp",
      "Use the gentler approach because it is the safest whole-scalp compromise",
      "Preserve the stable area rather than creating a corrective intervention where none is currently indicated",
      "Alternate stronger and gentler techniques so neither pattern dominates the service"
    ],
    "correctChoice": 2,
    "rationale": "Preserve is a legitimate, active service decision when a region does not need correction.",
    "status": "approved"
  },
  {
    "id": "M06-001",
    "version": 1,
    "sourceModule": 6,
    "sourceSection": "Module 6 approved specification — dry scalp vs. dandruff-spectrum comparison.",
    "competency": "Dry-scalp vs. dandruff-spectrum cues",
    "difficulty": "foundational",
    "criticalDomainEvidence": [],
    "prompt": "Which set of findings is **more consistent with** the dry-scalp pattern taught in Module 6?",
    "choices": [
      "Fine white scale, visible root oil, pronounced redness and spread onto the eyebrows",
      "Fine white powdery scale, matte surface, minimal visible oil and reported tightness",
      "Larger yellowish adherent scale with visible oil and mild redness",
      "Thick adherent scale with marked redness extending past the scalp margin"
    ],
    "correctChoice": 1,
    "rationale": "The course teaches using multiple cues together; this cluster most closely fits the dry-scalp pattern.",
    "status": "approved"
  },
  {
    "id": "M06-002",
    "version": 1,
    "sourceModule": 6,
    "sourceSection": "Module 6 approved specification — mixed/ambiguous presentations.",
    "competency": "Ambiguous/mixed presentation",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A client shows moderate scalp oil, scattered fine scale, occasional tightness, and no clear redness or spread. The pattern does not cleanly match either comparison column.\n\nWhat should the practitioner do?",
    "choices": [
      "Choose the dandruff-spectrum direction because visible oil is the more diagnostically useful clue",
      "Choose the dry-scalp direction because reported tightness should outweigh appearance",
      "Avoid forcing a label, ask about product/wash history and recent changes, and favor the gentler service direction until the picture is clearer",
      "Refer immediately because an ambiguous presentation falls outside cosmetic scope"
    ],
    "correctChoice": 2,
    "rationale": "Ambiguity calls for history, conservative service direction, and no forced label.",
    "status": "approved"
  },
  {
    "id": "M06-003",
    "version": 1,
    "sourceModule": 6,
    "sourceSection": "Module 6 approved specification — 1% OTC vs. 2% Rx boundary.",
    "competency": "Ketoconazole concentration boundary",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D1"
    ],
    "prompt": "A client asks which ketoconazole shampoo the course was referring to when discussing an OTC retail category.\n\nWhich answer is correct?",
    "choices": [
      "The course references 1% ketoconazole as the OTC category; prescription-strength versions are outside this course’s client recommendation scope",
      "Either 1% or 2% is appropriate as long as the practitioner does not use the word “prescription”",
      "The practitioner may recommend 2% when the visible presentation is more involved, but should advise the client to confirm with a pharmacist",
      "Concentration is not important because the ingredient itself determines whether it is OTC"
    ],
    "correctChoice": 0,
    "rationale": "The course explicitly draws the client-facing line at OTC 1%; 2% is prescription-only.",
    "status": "approved"
  },
  {
    "id": "M06-004",
    "version": 1,
    "sourceModule": 6,
    "sourceSection": "Module 6 approved specification — wrong product cycle.",
    "competency": "Wrong-product cycle",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A client has used progressively stronger anti-dandruff products for months. Today you observe fine powdery scale, a matte surface and minimal visible oil, with no redness or spread.\n\nShe says, “It keeps getting worse, so I think I need something even stronger.”\n\nWhich response is strongest?",
    "choices": [
      "Recommend a stronger OTC antifungal because the current product has clearly stopped working",
      "Add gentle exfoliation to improve removal while she continues the existing shampoo",
      "Reconsider whether she may be treating the wrong presentation, explain that stronger anti-dandruff cleansing can worsen a dry-appearing pattern, and redirect toward a gentler/simpler approach",
      "Tell her to discontinue all scalp products until she has been medically evaluated"
    ],
    "correctChoice": 2,
    "rationale": "Module 6 teaches reassessing the presentation before escalating a mismatched anti-dandruff routine.",
    "status": "approved"
  },
  {
    "id": "M06-005",
    "version": 1,
    "sourceModule": 6,
    "sourceSection": "Module 6 approved specification — Section 6.6 referral criteria.",
    "competency": "Referral threshold on the spectrum",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D1",
      "D2"
    ],
    "prompt": "A dandruff-spectrum-type presentation that had previously remained limited to the scalp now shows more pronounced redness and scale extending onto the eyebrows and hairline.\n\nThe client reports that the area has also become increasingly uncomfortable.\n\nWhat changes?",
    "choices": [
      "Increase cleansing support because the broader distribution suggests more product is needed",
      "Continue conservatively but add an appropriate OTC antifungal category because the presentation has become more involved",
      "The spread beyond the scalp plus active redness/discomfort increases referral concern; do not simply escalate the cosmetic protocol",
      "The service can proceed normally unless the skin is actually broken or bleeding"
    ],
    "correctChoice": 2,
    "rationale": "Spread, redness, and increasing discomfort move the presentation toward referral rather than simple cosmetic escalation.",
    "status": "approved"
  },
  {
    "id": "M06-006",
    "version": 1,
    "sourceModule": 6,
    "sourceSection": "Module 6 approved specification — mild-to-more-involved continuum.",
    "competency": "Mild-to-more-involved continuum",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "Why does Module 6 teach dandruff and seborrheic-dermatitis-type presentations as a continuum rather than two unrelated boxes?",
    "choices": [
      "So the practitioner can determine precisely when dandruff becomes a confirmed medical condition",
      "Because increasing extent, redness, scale adherence and spread can signal a more involved presentation and should change the practitioner’s level of caution and referral awareness",
      "Because both presentations should ultimately be managed with the same stronger product category",
      "So the practitioner can identify which point on the spectrum justifies prescription treatment"
    ],
    "correctChoice": 1,
    "rationale": "The continuum supports service/referral judgment without converting the practitioner into a diagnostician.",
    "status": "approved"
  },
  {
    "id": "M06-007",
    "version": 1,
    "sourceModule": 6,
    "sourceSection": "Module 6 approved specification — within-scope product responses.",
    "competency": "OTC retail guidance",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A client’s presentation is mild, contained to the scalp and does not meet referral criteria. She asks what kind of over-the-counter product she might consider at home.\n\nWhich response best stays inside the course’s intended boundary?",
    "choices": [
      "“Based on the pattern, I’d treat this as seborrheic dermatitis with a 1% ketoconazole shampoo.”",
      "“An OTC anti-dandruff category such as 1% ketoconazole, zinc pyrithione or 1% selenium sulfide is something you could look at. That’s retail guidance—not a diagnosis—and you should follow the product directions and stop/reassess if the presentation becomes more involved.”",
      "“I can’t mention any OTC product categories because that would count as prescribing.”",
      "“Try whichever antifungal active is strongest, since OTC products don’t require medical oversight.”"
    ],
    "correctChoice": 1,
    "rationale": "AIMT permits scoped OTC category literacy while preserving non-diagnostic framing and referral awareness.",
    "status": "approved"
  },
  {
    "id": "M06-008",
    "version": 1,
    "sourceModule": 6,
    "sourceSection": "Modules 4 and 6 approved specifications.",
    "competency": "Cross-module assessment/referral",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [
      "D1",
      "D2"
    ],
    "prompt": "During a five-point assessment, the crown shows yellowish clumped scale near the roots, visible oil and mild redness. The client reports similar redness and scale has appeared at the eyebrows and behind the ears.\n\nWhich response best integrates Modules 4–6?",
    "choices": [
      "Document a dandruff-spectrum diagnosis, explain that it has progressed, and recommend an OTC antifungal before deciding whether to refer",
      "Describe the crown findings objectively, identify the presentation as likely seborrheic dermatitis without stating it as confirmed, and modify the service to avoid irritated regions",
      "Document what is visible without diagnosing, recognize that the distribution/redness is beyond a routine cosmetic pattern, and recommend appropriate medical evaluation rather than escalating the Head Spa treatment",
      "Complete the service gently because there is no broken skin, then advise the client to seek evaluation if the OTC routine does not improve it"
    ],
    "correctChoice": 2,
    "rationale": "This combines non-diagnostic observation with the referral threshold for more involved distribution/redness.",
    "status": "approved"
  },
  {
    "id": "M06-009",
    "version": 1,
    "sourceModule": 6,
    "sourceSection": "Module 6 approved specification — multifactorial mechanism and multi-cue distinction.",
    "competency": "Multifactorial interpretation",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A client has visible oil and some flaking.\n\nWhich conclusion is most consistent with Module 6?",
    "choices": [
      "Oil confirms a dandruff-spectrum cause",
      "Oil rules out a dry-scalp presentation",
      "Oil is one clue among several; redness, scale character, distribution, symptoms, and history still matter before choosing a service direction",
      "Oil means the service should focus primarily on stronger cleansing"
    ],
    "correctChoice": 2,
    "rationale": "The course rejects oil-alone reasoning and requires multiple cues.",
    "status": "approved"
  },
  {
    "id": "M06-010",
    "version": 1,
    "sourceModule": 6,
    "sourceSection": "Module 6 approved specification — look-alike presentations and non-diagnostic boundary.",
    "competency": "Look-alike presentations",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D1"
    ],
    "prompt": "A scalp presentation resembles dandruff but also has features that could overlap with psoriasis, contact dermatitis, or another medical condition.\n\nWhat should the practitioner do with that uncertainty?",
    "choices": [
      "Choose the most likely diagnosis based on which visible feature is strongest",
      "Describe the presentation, use the course’s service/referral framework, and avoid claiming cosmetic observation can rule out medical look-alikes",
      "Treat every ambiguous presentation as dandruff until a doctor says otherwise",
      "Automatically stop every service whenever two possible conditions are considered"
    ],
    "correctChoice": 1,
    "rationale": "Similar appearance can support working questions and service/referral decisions but not diagnostic exclusion.",
    "status": "approved"
  },
  {
    "id": "M06-011",
    "version": 1,
    "sourceModule": 6,
    "sourceSection": "Module 6 approved specification — trigger/evidence-strength framing.",
    "competency": "Trigger/evidence strength",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [
      "D1"
    ],
    "prompt": "A client asks whether stress, diet, or hot weather “caused” her recent flaking.\n\nWhich response best reflects the evidence framing in the course?",
    "choices": [
      "Stress is a proven direct cause, while diet and weather are unrelated",
      "Diet is usually the most useful explanation because inflammatory foods commonly drive scalp flares",
      "Stress has a stronger recognized association with flares than the course attributes to diet, while heat/humidity may influence experience qualitatively—but none of that lets the practitioner prove what caused this client’s presentation",
      "None of these factors should ever be discussed because causal questions are outside cosmetic scope"
    ],
    "correctChoice": 2,
    "rationale": "The module teaches different evidence strengths while preserving the distinction between association and proving an individual cause.",
    "status": "approved"
  },
  {
    "id": "M07-001",
    "version": 1,
    "sourceModule": 7,
    "sourceSection": "Module 7 approved specification — treatment-bed requirements vs. preferences.",
    "competency": "Treatment-bed evaluation",
    "difficulty": "foundational",
    "criticalDomainEvidence": [],
    "prompt": "A practitioner is comparing two Head Spa beds. Bed A has the armrest style she prefers but is difficult to disinfect around several seams. Bed B has less-preferred armrests but stable entry/exit, appropriate basin alignment, workable reach, water management, and sanitation-compatible surfaces.\n\nWhich factor should carry more weight?",
    "choices": [
      "Bed A, because client comfort preferences should outweigh operational considerations",
      "Bed A, because armrest configuration is part of the required treatment-bed standard",
      "Bed B, because sanitation compatibility and functional setup are requirements, while armrest configuration is a preference",
      "Either bed, because equipment choice is primarily a matter of practitioner style"
    ],
    "correctChoice": 2,
    "rationale": "AIMT separates functional requirements from preference categories; sanitation compatibility is a requirement.",
    "status": "approved"
  },
  {
    "id": "M07-002",
    "version": 1,
    "sourceModule": 7,
    "sourceSection": "Module 7 approved specification — golden/one-step/reserve zones.",
    "competency": "Reach-zone organization",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A practitioner keeps a frequently used product bowl on a shelf that requires one full step away from the bed, while rarely used backup supplies occupy the easiest-to-reach section of the cart.\n\nWhat is the strongest correction?",
    "choices": [
      "Keep the arrangement because backup supplies need to be immediately available if something unexpected happens",
      "Move high-frequency items into the within-reach zone and push low-frequency backups into the one-step or reserve zone",
      "Put every product in the within-reach zone so the practitioner never needs to move during service",
      "Organize the cart primarily by product category rather than service sequence or frequency"
    ],
    "correctChoice": 1,
    "rationale": "The reach framework prioritizes frequency and service sequence, not category or visual symmetry.",
    "status": "approved"
  },
  {
    "id": "M07-003",
    "version": 1,
    "sourceModule": 7,
    "sourceSection": "Module 7 checkpoint `m7cp1`.",
    "competency": "Station-prep sequence",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A practitioner is preparing a room and has already arranged the blanket, music, aromatherapy display, and decorative service pieces. She then realizes the basin area still needs sanitation work and several products are not staged.\n\nWhat does this setup reveal?",
    "choices": [
      "Nothing important; ambient elements can be completed in any order as long as everything is ready at appointment time",
      "The sequence was built backward—sanitation and structural readiness should precede product/tool staging, comfort, and ambient finishing",
      "Only the missing products matter; comfort elements should normally be completed before sanitation so they stay visually organized",
      "The room should be completely stripped and restarted whenever any prep step occurs out of sequence"
    ],
    "correctChoice": 1,
    "rationale": "AIMT teaches build dependencies: sanitation/structure first, then staging, comfort, and ambient elements.",
    "status": "approved"
  },
  {
    "id": "M07-004",
    "version": 1,
    "sourceModule": 7,
    "sourceSection": "Module 7 checkpoint `m7cp2`.",
    "competency": "Stop → adjust → communicate → resume",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D2"
    ],
    "prompt": "During the beginning of the wet phase, the client says, “My neck is starting to feel strained, and I’m getting cold.”\n\nWhat is the strongest response?",
    "choices": [
      "Adjust the bolster while keeping the water running so the service flow is not interrupted",
      "Finish the current rinse, then reposition her so the transition feels smoother",
      "Stop the current action, correct positioning and temperature as needed, explain what you’re adjusting, and resume only after she confirms comfort",
      "Ask whether she can tolerate the position for another few minutes before changing the setup"
    ],
    "correctChoice": 2,
    "rationale": "The approved sequence is stop first, then adjust, communicate, and resume only after comfort is confirmed.",
    "status": "approved"
  },
  {
    "id": "M07-005",
    "version": 1,
    "sourceModule": 7,
    "sourceSection": "Module 7 approved specification — ordinary discomfort vs. medical-emergency signals.",
    "competency": "Medical-emergency escalation",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D2"
    ],
    "prompt": "A client initially says her neck feels uncomfortable. After repositioning, she reports that the strain feels better—but then says her vision seems blurry and she feels suddenly dizzy.\n\nWhat should happen next?",
    "choices": [
      "Reposition her again because the original neck strain suggests this is still a setup problem",
      "Pause the water and let her rest for several minutes before deciding whether to continue",
      "Stop the service and treat the new symptoms as a medical concern rather than continuing to troubleshoot positioning",
      "Ask whether she thinks the dizziness is severe enough to stop the appointment"
    ],
    "correctChoice": 2,
    "rationale": "Dizziness/visual changes move the situation beyond ordinary positioning discomfort into a medical-concern stop.",
    "status": "approved"
  },
  {
    "id": "M07-006",
    "version": 1,
    "sourceModule": 7,
    "sourceSection": "Module 7 approved specification — clean/dirty separation.",
    "competency": "Clean/dirty separation",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D4"
    ],
    "prompt": "During a busy service day, a used tool is accidentally placed into the container designated for clean tools. No one is certain whether it touched the other items.\n\nWhat is the most responsible response?",
    "choices": [
      "Remove the used tool and keep the remaining items in service because they still look clean",
      "Disinfect only the used tool because cross-contact cannot be assumed without visible residue",
      "Treat the clean-zone integrity as compromised and process the affected items according to the appropriate sanitation requirements before use",
      "Move the entire container to the dirty zone and wait until closing to address it"
    ],
    "correctChoice": 2,
    "rationale": "Uncertain cross-contact means the clean state can no longer be assumed.",
    "status": "draft"
  },
  {
    "id": "M07-007",
    "version": 1,
    "sourceModule": 7,
    "sourceSection": "Module 7 approved specification — comfort vs. medical emergency.",
    "competency": "Stop-and-adjust vs. stop-and-refer",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [
      "D2"
    ],
    "prompt": "Two clients report discomfort in separate appointments.\n\n**Client A:** mild neck strain that resolves after shoulder position and occipital support are corrected.\n**Client B:** sudden dizziness and visual changes while reclined.\n\nWhat is the correct distinction?",
    "choices": [
      "Both require medical referral because any neck-related complaint during a Head Spa service should be treated conservatively",
      "Both are positioning problems initially; referral becomes appropriate only if symptoms continue after several adjustments",
      "Client A requires a stop-and-adjust response; Client B requires stopping the service because the symptoms move beyond an ordinary positioning complaint",
      "Client A may continue immediately if she says she can tolerate the strain; Client B should be allowed to decide whether she wants to stop"
    ],
    "correctChoice": 2,
    "rationale": "AIMT distinguishes ordinary strain that responds to setup correction from medical-concern symptoms requiring service termination.",
    "status": "approved"
  },
  {
    "id": "M07-008",
    "version": 1,
    "sourceModule": 7,
    "sourceSection": "Module 7 approved specification — positioning checks.",
    "competency": "Positioning checks",
    "difficulty": "foundational",
    "criticalDomainEvidence": [],
    "prompt": "Which three physical positioning checks are specifically emphasized before/during treatment?",
    "choices": [
      "Armrest height, knee support, and foot position",
      "Halo alignment, shoulder position, and occipital support",
      "Pillow firmness, blanket placement, and basin depth",
      "Neck angle, elbow position, and hip alignment"
    ],
    "correctChoice": 1,
    "rationale": "These are the three physical positioning checks taught in the module.",
    "status": "approved"
  },
  {
    "id": "M07-009",
    "version": 1,
    "sourceModule": 7,
    "sourceSection": "Module 7 approved specification — positioning checks.",
    "competency": "Positioning correction",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D2"
    ],
    "prompt": "A client’s head is technically over the basin, but she is subtly lifting her chin and holding tension through her neck.\n\nWhich adjustment should the practitioner investigate first?",
    "choices": [
      "Increase water temperature so she relaxes into the position",
      "Move the Halo closer to the crown",
      "Reassess shoulder position and occipital support so her head/neck can rest without active effort",
      "Reduce massage pressure because neck tension usually reflects excessive pressure"
    ],
    "correctChoice": 2,
    "rationale": "Shoulder position and occipital support determine whether the client can rest rather than actively hold the head/neck.",
    "status": "approved"
  },
  {
    "id": "M07-010",
    "version": 1,
    "sourceModule": 7,
    "sourceSection": "Module 7 approved specification — essentials-first, upgrades-later.",
    "competency": "Essentials-first tool philosophy",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [],
    "prompt": "A new practitioner has limited startup funds. She can afford either:\n\n- a large assortment of specialty scalp tools; or\n- sanitation-compatible storage, functional basin/bed setup, basic service tools, and a smaller product selection.\n\nWhich investment best reflects AIMT’s setup philosophy?",
    "choices": [
      "The specialty tools, because differentiation should come before efficiency",
      "The functional/sanitation foundation first; upgrades can be added once the core service system works reliably",
      "Split the money evenly so the room appears more complete",
      "Buy whichever option is most visible to clients"
    ],
    "correctChoice": 1,
    "rationale": "AIMT teaches essentials first and upgrades later; tool count does not create practitioner quality.",
    "status": "approved"
  },
  {
    "id": "M08-001",
    "version": 1,
    "sourceModule": 8,
    "sourceSection": "Module 8 approved specification — reference-format model.",
    "competency": "Core vs. Extended pacing logic",
    "difficulty": "foundational",
    "criticalDomainEvidence": [],
    "prompt": "What is the most important principle when working from AIMT’s reference service formats?",
    "choices": [
      "Every technique should receive proportionally more time whenever the appointment is longer",
      "The service structure determines where additional or reduced time belongs; the practitioner should not simply stretch or compress every step equally",
      "Longer appointments should primarily add time to rinsing and product processing because those steps are easiest to extend",
      "Once the practitioner is experienced, exact service structure matters less than finishing at the scheduled time"
    ],
    "correctChoice": 1,
    "rationale": "Core and Extended are deliberately designed structures, not proportional stretches of the same clock.",
    "status": "approved"
  },
  {
    "id": "M08-002",
    "version": 1,
    "sourceModule": 8,
    "sourceSection": "Module 8 approved specification — critical safety practice.",
    "competency": "Water-temperature verification",
    "difficulty": "foundational",
    "criticalDomainEvidence": [
      "D2"
    ],
    "prompt": "The water felt appropriate during the previous rinse. A few minutes later, the practitioner begins another wet transition.\n\nWhat is the correct approach?",
    "choices": [
      "Use the previous setting unless the client says the temperature has changed",
      "Check only if the faucet or halo setting was adjusted since the previous rinse",
      "Confirm the water temperature again before exposing the client to it",
      "Ask the client whether she wants the same temperature, then begin the rinse"
    ],
    "correctChoice": 2,
    "rationale": "AIMT preserves the explicit safety practice of confirming water temperature every time rather than guessing.",
    "status": "approved"
  },
  {
    "id": "M08-003",
    "version": 1,
    "sourceModule": 8,
    "sourceSection": "Module 8 checkpoint `m8cp1`.",
    "competency": "Exfoliation adaptation",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "The planned exfoliation technique feels too stimulating for today’s presentation, but there is no finding requiring the step to be completely omitted.\n\nWhich adjustment best reflects Module 8?",
    "choices": [
      "Remove exfoliation from the service entirely because any modification creates inconsistency",
      "Reduce intensity by changing the product, pressure, method, technique, or combination of those factors while preserving an appropriate exfoliation step",
      "Keep the same technique but shorten the duration enough that the overall exposure is lower",
      "Let the client choose between the full planned technique and skipping it"
    ],
    "correctChoice": 1,
    "rationale": "Exfoliation is treated as an adjustable lever, not a binary on/off step unless a genuine safety/scope reason requires omission.",
    "status": "approved"
  },
  {
    "id": "M08-004",
    "version": 1,
    "sourceModule": 8,
    "sourceSection": "Module 8 checkpoint `m8cp2`.",
    "competency": "Honest service explanation",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D1"
    ],
    "prompt": "During scalp massage, a client asks, “What actually makes this different from getting a really good shampoo at the salon?”\n\nWhich answer is strongest?",
    "choices": [
      "“We’re using scalp stimulation to increase circulation and support healthier hair growth.”",
      "“The combination of water, massage, steam, and products helps activate the nervous system more deeply than a regular shampoo.”",
      "“It’s a complete scalp-focused service—assessment-informed product choices, deliberate pacing, massage, cleansing and treatment are built together as one experience.”",
      "“The difference is that Head Spa techniques work more directly on the follicles than a standard shampoo.”"
    ],
    "correctChoice": 2,
    "rationale": "The correct answer explains structure/personalization without unsupported circulation, nervous-system, or follicle-growth claims.",
    "status": "approved"
  },
  {
    "id": "M08-005",
    "version": 1,
    "sourceModule": 8,
    "sourceSection": "Module 8 approved specification — bodywork scope guardrail.",
    "competency": "Scope/training/consent for bodywork",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D3"
    ],
    "prompt": "A client sees that an Extended service may include hand and forearm massage and asks the practitioner to add it today.\n\nWhat must be true before that work is performed?",
    "choices": [
      "The client’s request is enough because the additional touch is client-initiated",
      "AIMT certification must specifically list hand and forearm massage as an approved technique",
      "The work must be appropriate within the practitioner’s applicable license/scope and training, and the client must give appropriate consent",
      "The client must have previously received the same bodywork from that practitioner"
    ],
    "correctChoice": 2,
    "rationale": "Bodywork remains conditioned on applicable scope, training, and consent; course completion does not create authority.",
    "status": "approved"
  },
  {
    "id": "M08-006",
    "version": 1,
    "sourceModule": 8,
    "sourceSection": "Module 8 approved specification — communication modes.",
    "competency": "Intentional communication",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "The service is intentionally quiet. Which moment still clearly warrants proactive communication from the practitioner?",
    "choices": [
      "Before every new product is applied, so the client always understands the protocol",
      "Every time the practitioner changes massage technique",
      "When checking water temperature, pressure/comfort, positioning, consent, or a meaningful unfamiliar transition",
      "Only when the client asks a direct question"
    ],
    "correctChoice": 2,
    "rationale": "AIMT teaches “explain intentionally, not continuously”; necessary comfort/safety/transitional communication remains proactive.",
    "status": "approved"
  },
  {
    "id": "M08-007",
    "version": 1,
    "sourceModule": 8,
    "sourceSection": "Module 8 approved specification — pressure consistency.",
    "competency": "Pressure consistency",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A client requests “firm pressure.” The practitioner begins firmly but gradually becomes much lighter without intending to.\n\nWhat does Module 8 suggest is the larger technique issue?",
    "choices": [
      "The initial pressure was probably too strong",
      "The inconsistency itself—the practitioner should be able to deliver and maintain the intended pressure level with control",
      "Firm pressure should generally be avoided because lighter pressure is more relaxing",
      "The client should be asked to choose one fixed pressure level for the entire service"
    ],
    "correctChoice": 1,
    "rationale": "The skill signal is control and consistency, not one universally correct pressure level.",
    "status": "approved"
  },
  {
    "id": "M08-008",
    "version": 1,
    "sourceModule": 8,
    "sourceSection": "Module 8 approved specification — pacing logic.",
    "competency": "Pacing adaptation",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [],
    "prompt": "A treatment portion takes several minutes longer than planned because the practitioner adapts technique to the client’s needs. There is no safety or product-processing issue.\n\nWhat is the strongest pacing response?",
    "choices": [
      "Make up every lost minute by moving faster through the remaining physical techniques",
      "Reassess the remaining expandable portions, protect required transitions/product directions and client comfort, and recover time where the protocol legitimately allows",
      "End the service at the planned clock time even if the closing or rinse is incomplete",
      "Extend the appointment automatically so no part of the original timing map changes"
    ],
    "correctChoice": 1,
    "rationale": "AIMT teaches pacing through deliberate expansion/contraction while protecting non-negotiable process, comfort, and required transitions.",
    "status": "approved"
  },
  {
    "id": "M08-009",
    "version": 1,
    "sourceModule": 8,
    "sourceSection": "Module 8 approved specification — honest sensory framing.",
    "competency": "Sensory framing",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A client asks what the cooling portion at the end of the service is supposed to do.\n\nWhich explanation best matches the course?",
    "choices": [
      "“The cold closes the cuticle after the warm water and seals in the treatment.”",
      "“It constricts the vessels after massage and helps reset circulation.”",
      "“It creates an intentional cool contrast after the warmer portions of the service and is part of the sensory finish.”",
      "“It stimulates the scalp and activates the follicles before we finish.”"
    ],
    "correctChoice": 2,
    "rationale": "AIMT keeps this step in sensory-experience language rather than unsupported physiological mechanisms.",
    "status": "approved"
  },
  {
    "id": "M08-010",
    "version": 1,
    "sourceModule": 8,
    "sourceSection": "Module 8 approved specification — closing script/home-care guidance.",
    "competency": "Closing communication",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [],
    "prompt": "At the end of a service, the practitioner observed more visible residue at the crown and used a more targeted cleansing approach there. The client asks, “So what should I be doing differently at home?”\n\nWhich closing response is strongest?",
    "choices": [
      "“Your crown gets congested more easily, so you need to clarify it at least weekly.”",
      "“Your scalp is producing too much oil at the crown, so I’d switch to an oil-control shampoo.”",
      "“I noticed more visible residue through the crown today, so I focused cleansing there. At home, I’d start with a thorough but gentle wash routine and watch how that area responds rather than jumping straight to a stronger product.”",
      "“I’d keep doing what you’re doing because changing home care could interfere with the results of today’s treatment.”"
    ],
    "correctChoice": 2,
    "rationale": "The response uses observation language, explains the service decision, and gives conservative home-care guidance without diagnosing.",
    "status": "approved"
  },
  {
    "id": "M08-011",
    "version": 1,
    "sourceModule": 8,
    "sourceSection": "Module 8 approved specification — service sequence.",
    "competency": "Service-flow orientation",
    "difficulty": "foundational",
    "criticalDomainEvidence": [],
    "prompt": "Which progression best reflects the overall Head Spa service flow taught in Module 8?",
    "choices": [
      "Wet cleanse → assessment → dry opening → treatment → close",
      "Dry sensory opening → wet/treatment phase → cleanse/conditioning → final rinse/sensory close",
      "Assessment → shampoo → dry brushing → exfoliation → checkout",
      "Aromatherapy → conditioning → massage → shampoo → assessment"
    ],
    "correctChoice": 1,
    "rationale": "This captures the broad service progression without turning the exam into memorization of every numbered step.",
    "status": "approved"
  },
  {
    "id": "M08-012",
    "version": 1,
    "sourceModule": 8,
    "sourceSection": "Module 8 approved specification — aromatherapy/fragrance choice.",
    "competency": "Aromatherapy choice/autonomy",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D3"
    ],
    "prompt": "A client seems hesitant when presented with the scent options.\n\nWhich approach best reflects the course?",
    "choices": [
      "Recommend the practitioner’s mildest scent so the client does not miss the aromatherapy portion",
      "Present the available options, including fragrance-free, without steering the client toward a scented choice",
      "Use no fragrance automatically because hesitation means the client has declined",
      "Ask which scent category she normally likes, then choose for her"
    ],
    "correctChoice": 1,
    "rationale": "Fragrance-free is a valid option and the practitioner should not steer the choice.",
    "status": "draft"
  },
  {
    "id": "M08-013",
    "version": 1,
    "sourceModule": 8,
    "sourceSection": "Module 8 approved specification — preference change during service.",
    "competency": "Changing preferences",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D3"
    ],
    "prompt": "A client initially agreed to a scented service but says halfway through, “I think I’d rather not have any more fragrance.”\n\nWhat is the strongest response?",
    "choices": [
      "Continue because the original consent established the plan",
      "Reduce the amount but keep the fragrance so the service remains consistent",
      "Honor the updated preference and adjust the remaining service without treating the change as a problem",
      "Ask her to wait until the next appointment because product choices cannot change mid-service"
    ],
    "correctChoice": 2,
    "rationale": "Client preferences remain active throughout the service; intake is not permanent permission.",
    "status": "approved"
  },
  {
    "id": "M08-014",
    "version": 1,
    "sourceModule": 8,
    "sourceSection": "Module 8 approved specification — pacing and required product directions.",
    "competency": "Product processing vs. schedule pressure",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [],
    "prompt": "The service is running several minutes behind. A product currently processing has a manufacturer-directed minimum processing time that has not yet been completed.\n\nWhat should the practitioner do?",
    "choices": [
      "Remove the product early because the overall appointment length should control the schedule",
      "Protect the required processing time and recover time only from portions of the remaining service that can legitimately flex",
      "Add more heat or steam so the product reaches the same result in less time",
      "Ask the client whether she would prefer to rinse early or allow the appointment to run longer"
    ],
    "correctChoice": 1,
    "rationale": "Required product directions are protected; flexible service portions absorb pacing adjustments instead.",
    "status": "approved"
  },
  {
    "id": "M09-001",
    "version": 1,
    "sourceModule": 9,
    "sourceSection": "Module 9 approved specification — margin vs. markup.",
    "competency": "Margin vs. markup",
    "difficulty": "foundational",
    "criticalDomainEvidence": [],
    "prompt": "A service has a true cost base of **$126**.\n\nWhat price produces a **30% margin**?",
    "choices": [
      "$163.80",
      "$169.00",
      "$180.00",
      "$193.85"
    ],
    "correctChoice": 2,
    "rationale": "Margin is calculated from selling price: $126 ÷ (1 − .30) = $180. A 30% markup would produce $163.80.",
    "status": "approved"
  },
  {
    "id": "M09-002",
    "version": 1,
    "sourceModule": 9,
    "sourceSection": "Module 9 approved specification — four cost components.",
    "competency": "Full practitioner-time cost",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A 90-minute treatment requires 15 minutes of setup, 90 minutes hands-on, 20 minutes for client transition/checkout and 15 minutes of reset.\n\nWhen calculating the practitioner-time cost of delivering the service, which time should be considered?",
    "choices": [
      "Only the 90 minutes when the client is actively receiving treatment",
      "The 90-minute treatment plus reset, because setup and checkout are administrative overhead",
      "The full time the appointment consumes from the practitioner’s working capacity, including setup, treatment, transition/checkout and reset where applicable",
      "Only whatever portion of the time cannot be assigned to another employee"
    ],
    "correctChoice": 2,
    "rationale": "Practitioner time is broader than hands-on treatment time and should reflect the actual capacity the service consumes.",
    "status": "approved"
  },
  {
    "id": "M09-003",
    "version": 1,
    "sourceModule": 9,
    "sourceSection": "Module 9 approved specification — five-factor pricing intersection.",
    "competency": "Market context",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A practitioner’s cost-based target price for a new service is $205. Most nearby competitors charge between $165 and $185.\n\nWhat is the strongest next step?",
    "choices": [
      "Price at $175 because the local market has already established the acceptable range",
      "Keep $205 automatically because competitor pricing should never influence a business decision",
      "Investigate why her target differs—cost structure, service design, capacity, positioning and market context—before deciding whether the price, costs, or offer itself needs adjustment",
      "Average her calculated price and the competitor midpoint to create a compromise price"
    ],
    "correctChoice": 2,
    "rationale": "AIMT treats competitor pricing as context within a broader business decision, not as a pricing formula.",
    "status": "approved"
  },
  {
    "id": "M09-004",
    "version": 1,
    "sourceModule": 9,
    "sourceSection": "Module 9 checkpoint `m10cp2` (historical internal ID).",
    "competency": "In-the-moment vs. afterward price feedback",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "At checkout a client says, “I loved it, but I’ll be honest—the price felt high.”\n\nWhich response best separates the **client moment** from the later **business review**?",
    "choices": [
      "Explain the service costs so she understands why the price is justified, then reconsider the price after she leaves",
      "Acknowledge the feedback without becoming defensive or discounting reflexively; later, review costs, pricing, menu, positioning, service delivery and market fit using actual data",
      "Offer a smaller service next time, then compare competitor pricing afterward to determine whether the current service should be reduced",
      "Thank her for the feedback without discussing it further, because pricing analysis should never be influenced by individual comments"
    ],
    "correctChoice": 1,
    "rationale": "AIMT separates calm client-facing response from later evidence-based business diagnosis.",
    "status": "approved"
  },
  {
    "id": "M09-005",
    "version": 1,
    "sourceModule": 9,
    "sourceSection": "Module 9 approved specification — enhancement strategy.",
    "competency": "Enhancement fit",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A practitioner is considering adding a premium scalp-serum enhancement. It uses a more expensive product but does not meaningfully change the service purpose, application, treatment time or client experience.\n\nWhat is the strongest conclusion?",
    "choices": [
      "Offer it because the higher product cost justifies a separate menu price",
      "Offer it only to clients who request premium products",
      "Do not automatically create an enhancement simply because a more expensive product exists; it should add a distinct, explainable service value and fit the plan",
      "Include it as an enhancement but position it as optional so the client is not pressured"
    ],
    "correctChoice": 2,
    "rationale": "Enhancements should have a distinct service purpose/value rather than exist only because a product costs more.",
    "status": "approved"
  },
  {
    "id": "M09-006",
    "version": 1,
    "sourceModule": 9,
    "sourceSection": "Module 9 approved specification — “restraint wins over the sale.”",
    "competency": "Restraint over sale",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [
      "D2",
      "D3"
    ],
    "prompt": "Earlier in the appointment, the practitioner reduced stimulation around a reactive-appearing hairline because the client reported tenderness. At checkout, the client asks whether she should book a future enhancement specifically designed to add more intensive scalp treatment in that same area.\n\nWhat is the strongest response?",
    "choices": [
      "Offer the enhancement for the next visit because the client’s presentation may be different by then",
      "Add the enhancement provisionally and reassess at the next appointment; this preserves the sale without committing to the treatment",
      "Explain that today’s finding makes a more intensive recommendation inappropriate to promise now; reassess at the next visit and recommend only what the future presentation actually supports",
      "Recommend a different enhancement immediately so the client still leaves with a future upgrade option"
    ],
    "correctChoice": 2,
    "rationale": "AIMT teaches that business recommendations do not override professional judgment and that future appropriateness should be reassessed rather than pre-sold.",
    "status": "approved"
  },
  {
    "id": "M09-007",
    "version": 1,
    "sourceModule": 9,
    "sourceSection": "Module 9 approved specification — corrected pricing calculator.",
    "competency": "0% margin / break-even",
    "difficulty": "foundational",
    "criticalDomainEvidence": [],
    "prompt": "A service has a complete cost base of $142.\n\nIf the practitioner intentionally uses a **0% margin** in the calculator, what should the target price represent?",
    "choices": [
      "Product-cost break-even only",
      "Approximately $142—the complete cost base, with no deliberate profit margin added",
      "$184.60 because 0% margin still includes markup",
      "Whatever local competitors charge closest to cost"
    ],
    "correctChoice": 1,
    "rationale": "At 0% margin, target price equals the complete cost base.",
    "status": "approved"
  },
  {
    "id": "M09-008",
    "version": 1,
    "sourceModule": 9,
    "sourceSection": "Module 9 approved specification — four cost components.",
    "competency": "Complete cost base",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A practitioner calculates a service price using:\n\n- products;\n- hands-on treatment time.\n\nShe leaves out:\n\n- setup/reset time;\n- allocated rent/utilities/software overhead.\n\nWhat is the main problem with the resulting target price?",
    "choices": [
      "It will automatically have the wrong margin percentage",
      "The cost base is incomplete, so the target may look profitable while failing to recover the real resources the service consumes",
      "Overhead should never be allocated to individual services",
      "Setup/reset belongs in overhead, so including both would double-count"
    ],
    "correctChoice": 1,
    "rationale": "Incomplete cost data produces a misleading pricing target even if the math itself is correct.",
    "status": "approved"
  },
  {
    "id": "M09-009",
    "version": 1,
    "sourceModule": 9,
    "sourceSection": "Module 9 approved specification — menu differentiation.",
    "competency": "Menu differentiation",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A menu offers three services:\n\n- 60 minutes;\n- 75 minutes;\n- 90 minutes.\n\nThe service descriptions, techniques, purpose, and client experience are otherwise nearly identical.\n\nWhat issue should the practitioner examine?",
    "choices": [
      "Whether a fourth tier should be added so the menu appears more complete",
      "Whether the options have meaningful differentiation beyond duration alone and whether each one earns a distinct place on the menu",
      "Whether the middle option should always be priced as the best value",
      "Whether all three should use the same margin percentage"
    ],
    "correctChoice": 1,
    "rationale": "AIMT rejects a fixed tier rule and instead asks whether each menu option is meaningfully differentiated.",
    "status": "approved"
  },
  {
    "id": "M09-010",
    "version": 1,
    "sourceModule": 9,
    "sourceSection": "Module 9 approved specification — checkout mechanics.",
    "competency": "Checkout execution",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "Which checkout sequence is most consistent with Module 9?",
    "choices": [
      "Present the total, suggest the customary gratuity range, then ask about rebooking",
      "Confirm what the client is paying for, communicate the total clearly, present gratuity neutrally if applicable, and complete checkout without implying gratuity or rebooking is required",
      "Ask about gratuity before stating the total so the client can decide how much to add",
      "Recommend the next appointment before discussing the current charge so the conversation ends positively"
    ],
    "correctChoice": 1,
    "rationale": "The module teaches clear charges/total, neutral gratuity presentation, and pressure-free closing/rebooking.",
    "status": "approved"
  },
  {
    "id": "M10-001",
    "version": 1,
    "sourceModule": 10,
    "sourceSection": "Module 10 approved specification — 10.1 terminology.",
    "competency": "Cleaning vs. disinfection",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D4"
    ],
    "prompt": "A reusable hard, nonporous tool has visible product residue on it after a service. The disinfectant on the station is labeled for that type of tool.\n\nWhat should happen first?",
    "choices": [
      "Apply enough disinfectant to keep the residue visibly wet for the full contact time",
      "Remove the soil/product residue as required, then disinfect the appropriate tool according to the disinfectant label",
      "Disinfect it first, then clean away any remaining residue before returning it to service",
      "If the disinfectant is approved for the tool, visible residue does not change the process"
    ],
    "correctChoice": 1,
    "rationale": "Cleaning and disinfection are distinct processes; visible soil/residue may need removal before the labeled disinfection process.",
    "status": "approved"
  },
  {
    "id": "M10-002",
    "version": 1,
    "sourceModule": 10,
    "sourceSection": "Module 10 approved specification — Reset Under Pressure.",
    "competency": "Required contact time under schedule pressure",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D4"
    ],
    "prompt": "A disinfected work surface must remain wet for the label-directed contact time. The next client has arrived early, and there are three minutes remaining.\n\nWhich response best reflects the AIMT standard?",
    "choices": [
      "Dry the surface now because most of the required time has already passed, then finish setting the room",
      "Leave the surface wet, stop all other reset activity, and wait beside it until the time is complete",
      "Preserve the remaining contact time while completing other appropriate independent tasks; use an already-ready alternative or delay the start if necessary",
      "Place a clean barrier over the still-wet surface so the next client can begin without disturbing the disinfectant underneath"
    ],
    "correctChoice": 2,
    "rationale": "Required time is not shortened, but independent tasks may continue in parallel.",
    "status": "approved"
  },
  {
    "id": "M10-003",
    "version": 1,
    "sourceModule": 10,
    "sourceSection": "Module 10 approved specification — 10.2 ITEM → PROCESS.",
    "competency": "ITEM → PROCESS",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D4"
    ],
    "prompt": "After a service, the practitioner has:\n\n- a reusable hard scalp tool;\n- a used washable towel;\n- a single-use applicator.\n\nWhich processing plan is correct?",
    "choices": [
      "Disinfect all three because they were all used during the same service",
      "Disinfect the hard tool, disinfect the towel if visibly soiled, and discard the applicator",
      "Clean/process and disinfect the reusable hard tool as appropriate, contain/launder the towel before reuse, and discard the single-use applicator",
      "Clean all three first; then decide whether each needs disinfection based on whether visible residue remains"
    ],
    "correctChoice": 2,
    "rationale": "Different item/material categories follow different processing paths.",
    "status": "approved"
  },
  {
    "id": "M10-004",
    "version": 1,
    "sourceModule": 10,
    "sourceSection": "Module 10 approved specification — instructor water-line tip.",
    "competency": "Water-line maintenance boundaries",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A practitioner wants to begin using a whirlpool/jet-system cleaner for periodic cleaning of the Halo water lines after hearing that another Head Spa has had good results with one.\n\nWhat is the strongest next step?",
    "choices": [
      "Use it because products designed for whirlpool systems are generally compatible with Head Spa water systems",
      "Add it to the regular between-client disinfection process so the lines receive both cleaning and sanitation",
      "Verify compatibility with the specific bed/Halo manufacturer and follow the cleaner’s label; treat it as a maintenance/cleaning option, not as a replacement for any required disinfection process",
      "Use it only if the state board specifically names jet-system cleaner as an approved Head Spa product"
    ],
    "correctChoice": 2,
    "rationale": "The instructor tip is a maintenance option only after compatibility and label/manufacturer verification; it is not a universal sanitation rule.",
    "status": "approved"
  },
  {
    "id": "M10-005",
    "version": 1,
    "sourceModule": 10,
    "sourceSection": "Module 10 approved specification — records.",
    "competency": "Records/traceability",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A client reports irritation the day after her appointment. The business has detailed sanitation and maintenance records showing what products and processes were used that day.\n\nWhat is the most accurate role of those records?",
    "choices": [
      "They establish that sanitation could not have contributed because the process was documented",
      "They establish that the business met its legal obligations and therefore cannot be responsible for the reaction",
      "They provide traceability for reviewing what happened—products, processes, maintenance, timing or deviations—but they do not by themselves prove or rule out causation",
      "They should not be reviewed unless a regulator or attorney requests them because internal review could imply fault"
    ],
    "correctChoice": 2,
    "rationale": "Records support consistency, maintenance history, traceability, and concern review—not legal certainty or causation.",
    "status": "approved"
  },
  {
    "id": "M10-006",
    "version": 1,
    "sourceModule": 10,
    "sourceSection": "Module 10 checkpoint `m9cp2` (historical internal ID).",
    "competency": "Post-service concern response",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D1"
    ],
    "prompt": "The morning after a service, a client says:\n\n> “My neck is red and itchy. I’m pretty sure I reacted to the product you used.”\n\nThe practitioner remembers that the service itself appeared uneventful.\n\nWhich response is strongest?",
    "choices": [
      "“Nothing unusual happened during your service, so it’s unlikely our products caused it.”",
      "“It sounds like a product allergy. I’ll check which ingredient was probably responsible.”",
      "Acknowledge the concern, document what the client reports, review the relevant service/product/linen/equipment/sanitation information for deviations, avoid assigning a cause, and recommend appropriate medical evaluation if warranted",
      "Refund the service immediately and document it as a probable product reaction until more information is available"
    ],
    "correctChoice": 2,
    "rationale": "AIMT teaches acknowledgment, factual documentation, internal review, no diagnosis/assumed causation, and appropriate medical follow-up.",
    "status": "approved"
  },
  {
    "id": "M10-007",
    "version": 1,
    "sourceModule": 10,
    "sourceSection": "Module 10 approved specification — 10.5 When Routine Reset Is Not Enough.",
    "competency": "Blood/OPIM incident recognition",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D4"
    ],
    "prompt": "During a service, visible blood contaminates a reusable surface and a washable linen.\n\nWhat is the strongest response?",
    "choices": [
      "Complete the normal reset but extend the disinfectant contact time for both items",
      "Discard the linen, disinfect the surface, and continue with the ordinary reset because the contamination has been removed",
      "Stop treating the situation as an ordinary reset and follow the applicable exposure/cleanup procedure, including appropriate PPE, handling of affected reusable surfaces and laundry, product-label directions, and required workplace/regulatory steps",
      "Clean the visible contamination immediately, then determine at closing whether additional incident procedures are required"
    ],
    "correctChoice": 2,
    "rationale": "Blood/body-fluid contamination is a separate incident pathway, not an ordinary reset with extra time.",
    "status": "approved"
  },
  {
    "id": "M10-008",
    "version": 1,
    "sourceModule": 10,
    "sourceSection": "Module 10 approved specification — compliance review.",
    "competency": "Recurring compliance review",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [
      "D4"
    ],
    "prompt": "A Head Spa changes both its disinfectant product and its Halo equipment in March. The team’s sanitation procedures were reviewed in January, and management wants to keep using the existing reset checklist until the next annual review.\n\nWhat is the strongest response?",
    "choices": [
      "Keep the checklist until January unless the new equipment manufacturer specifically says the old process is prohibited",
      "Update only the disinfectant contact time, because changing the equipment does not affect sanitation procedure",
      "Reverify the new disinfectant’s label requirements and the new equipment manufacturer’s cleaning/maintenance instructions now, then update the workflow; an annual review habit does not replace review when products or equipment change",
      "Keep the current checklist if staff can complete it consistently, then compare it with the new instructions during the next periodic maintenance cycle"
    ],
    "correctChoice": 2,
    "rationale": "Review is triggered by meaningful changes; consistency is only useful if the underlying process remains current/correct.",
    "status": "approved"
  },
  {
    "id": "M10-009",
    "version": 1,
    "sourceModule": 10,
    "sourceSection": "Module 10 approved specification — reset framework.",
    "competency": "Reset vs. processing completion",
    "difficulty": "foundational",
    "criticalDomainEvidence": [
      "D4"
    ],
    "prompt": "A room has fresh linens, restocked products, and no visible clutter, but one reusable tool has not completed its required disinfection process.\n\nIs the room reset complete?",
    "choices": [
      "Yes, because reset refers to overall room readiness rather than one tool",
      "No. A visually rebuilt room is not truly ready if a required processing step is still incomplete",
      "Yes, as long as another clean tool is not immediately needed",
      "Yes, because disinfection and reset are separate processes"
    ],
    "correctChoice": 1,
    "rationale": "Reset is not synonymous with disinfection, but a service-ready room still requires all necessary processing to be complete or appropriate clean alternatives available.",
    "status": "approved"
  },
  {
    "id": "M10-010",
    "version": 1,
    "sourceModule": 10,
    "sourceSection": "Module 10 approved specification — terminology.",
    "competency": "Sterilization distinction",
    "difficulty": "foundational",
    "criticalDomainEvidence": [],
    "prompt": "A practitioner tells a client, “All of our reusable tools are sterilized between clients,” when the business actually follows an appropriate cleaning/disinfection process.\n\nWhat is wrong with that statement?",
    "choices": [
      "Nothing; sterilized and disinfected are interchangeable in salon language",
      "Disinfection should not be described as sterilization; the terms represent different processes, and AIMT does not teach that every Head Spa requires sterilization equipment",
      "Sterilization is required only when tools contact water",
      "The only issue is that clients do not need to know about sanitation"
    ],
    "correctChoice": 1,
    "rationale": "Disinfection and sterilization are different processes; disinfected tools should not be mislabeled as sterile.",
    "status": "approved"
  },
  {
    "id": "M10-011",
    "version": 1,
    "sourceModule": 10,
    "sourceSection": "Module 10 approved specification — product bowls/applicators/supplies.",
    "competency": "Cross-contamination prevention",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D4"
    ],
    "prompt": "Product has been portioned into a bowl for one client. During the service, a used applicator repeatedly contacts that product. Some product remains at the end.\n\nWhat should happen?",
    "choices": [
      "Return the leftover product to the original container if it still looks clean",
      "Save it for the next client because the product itself was not applied directly from the bowl to the scalp",
      "Do not reuse contaminated leftover product for another client; use hygienic dispensing and clean applicators to prevent cross-contamination",
      "Add disinfectant to the leftover product before reuse"
    ],
    "correctChoice": 2,
    "rationale": "AIMT teaches hygienic dispensing, clean applicators, and no reuse of contaminated leftover product.",
    "status": "approved"
  },
  {
    "id": "M10-012",
    "version": 1,
    "sourceModule": 10,
    "sourceSection": "Module 10 approved specification — authority/liability boundary.",
    "competency": "Product-label vs. manufacturer vs. jurisdiction authority",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [
      "D4"
    ],
    "prompt": "A practitioner needs to verify three things:\n\n1. the required wet/contact time for her disinfectant;\n2. whether that product is compatible with a specific Halo component;\n3. whether her state requires a particular sanitation practice.\n\nWhich source should control each question?",
    "choices": [
      "Product label for #1; equipment manufacturer for #2; current jurisdictional requirements for #3",
      "Equipment manufacturer for #1 and #2; state board for #3",
      "State board for #1; product label for #2; manufacturer for #3",
      "AIMT course notes for all three"
    ],
    "correctChoice": 0,
    "rationale": "Product labels govern labeled use/contact requirements, manufacturers govern equipment-specific compatibility/maintenance, and jurisdictions govern applicable rules.",
    "status": "approved"
  },
  {
    "id": "M11-001",
    "version": 1,
    "sourceModule": 11,
    "sourceSection": "Module 11 approved specification — AI tool categories.",
    "competency": "AI tool categories",
    "difficulty": "foundational",
    "criticalDomainEvidence": [],
    "prompt": "A practitioner wants to:\n\n1. draft three versions of an appointment-policy message;\n2. compare standardized scalp images over time;\n3. automatically organize incoming client inquiries.\n\nWhich statement best reflects the Module 11 framework?",
    "choices": [
      "All three are fundamentally the same type of AI use because each automates a practitioner task",
      "They involve different AI functions—language/reasoning, imaging/analysis, and automation—and should be evaluated according to the job each tool is actually performing",
      "Only the scalp-image comparison should be considered AI because the other two are ordinary software functions",
      "The distinction matters mainly for privacy; otherwise the tool category has little effect on how its output should be used"
    ],
    "correctChoice": 1,
    "rationale": "AIMT teaches AI by durable function/category rather than treating every tool as interchangeable.",
    "status": "approved"
  },
  {
    "id": "M11-002",
    "version": 1,
    "sourceModule": 11,
    "sourceSection": "Module 11 approved specification — B.R.I.E.F.",
    "competency": "B.R.I.E.F.",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "A practitioner wants AI to help draft a social post introducing a new Head Spa service.\n\nWhich request is most likely to produce a useful first draft **while still leaving the practitioner responsible for the result**?",
    "choices": [
      "“Write me a good Instagram post for my new Head Spa service. Make it professional.”",
      "“Write a luxury Instagram caption for Head Spa clients and make it sound convincing.”",
      "“I run a relaxation-first Head Spa serving working professionals. Draft a 100-word Instagram caption introducing our new 60-minute service in a calm, non-medical tone. Avoid hair-growth or treatment claims, end with a simple booking invitation, and flag anything factual I should verify before publishing.”",
      "“Write an Instagram caption for a 60-minute Head Spa. Make sure every claim is accurate and legally safe so I can publish it as written.”"
    ],
    "correctChoice": 2,
    "rationale": "The answer supplies useful background, request, instructions, output expectations, and a human fact-check responsibility.",
    "status": "approved"
  },
  {
    "id": "M11-003",
    "version": 1,
    "sourceModule": 11,
    "sourceSection": "Module 11 approved specification — three-level authority matrix.",
    "competency": "AI Use/Authority Matrix",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D1"
    ],
    "prompt": "Which assignment of tasks to the AIMT AI Authority Matrix is the strongest?",
    "choices": [
      "Drafting a cancellation-policy message → Level 1; summarizing a current state-board rule for the practitioner to verify → Level 2; deciding whether a concerning scalp finding is medically safe to treat → Level 3",
      "Drafting a cancellation-policy message → Level 1; summarizing a state-board rule → Level 1; deciding whether to refer → Level 2",
      "Drafting client communication → Level 2; regulatory research → Level 3; deciding whether to refer → Level 3",
      "Drafting client communication → Level 1; regulatory research → Level 2; deciding whether to refer → outside AI use entirely"
    ],
    "correctChoice": 0,
    "rationale": "Low-stakes drafting can lead from AI, research requires verification, and professional/safety authority remains human.",
    "status": "approved"
  },
  {
    "id": "M11-004",
    "version": 1,
    "sourceModule": 11,
    "sourceSection": "Module 11 approved specification — AI scalp/hair analysis.",
    "competency": "Confidence-score literacy",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D1"
    ],
    "prompt": "An AI-assisted scalp scanner displays:\n\n> **Seborrheic dermatitis — 87% confidence**\n\nThe practitioner also sees visible scale and redness on the screen.\n\nWhat is the strongest use of that result?",
    "choices": [
      "Tell the client the scan strongly suggests seborrheic dermatitis but clarify that the result is not technically a diagnosis",
      "Use the 87% score to determine whether the service should proceed, because the model has already evaluated the visual pattern",
      "Treat the score as one piece of system-generated information, return to the actual observable findings and client context, and make only the service/referral decision the practitioner is qualified to make",
      "Disregard the AI result completely and perform the assessment exactly as if the scanner had produced no information"
    ],
    "correctChoice": 2,
    "rationale": "AI output may inform attention but does not become diagnosis or final professional authority.",
    "status": "approved"
  },
  {
    "id": "M11-005",
    "version": 1,
    "sourceModule": 11,
    "sourceSection": "Module 11 approved specification — Section 11.5, Hear→Observe→Boundary→Next Step framework (not checkpoint m11cp1, which documents a different scenario).",
    "competency": "Client-supplied AI",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [
      "D1"
    ],
    "prompt": "A client arrives saying:\n\n> “I uploaded a picture to ChatGPT and it said I have psoriasis. I also ran it through another scalp app and that one gave me an 82% confidence score. Can you just confirm which one is right before we start?”\n\nWhich response best integrates Module 11 with the professional standards from earlier in the course?",
    "choices": [
      "Explain that two AI tools agreeing makes the result more credible, but that only a dermatologist can formally confirm it",
      "Tell the client neither tool is trustworthy enough for health-related questions and start the practitioner’s own assessment from scratch",
      "Compare the practitioner’s own magnified image with the AI results and tell the client which result appears most consistent with what is visible",
      "Acknowledge what the client found, ask what she has been noticing, assess and describe what is actually observable, explain that the practitioner cannot confirm either diagnosis from an AI result, and decide the appropriate service/referral next step from the real findings"
    ],
    "correctChoice": 3,
    "rationale": "This follows Hear → Observe → Boundary → Next Step without ridiculing AI or confirming its conclusion.",
    "status": "approved"
  },
  {
    "id": "M11-006",
    "version": 1,
    "sourceModule": 11,
    "sourceSection": "Module 11 approved specification — privacy/data framework.",
    "competency": "Need → Minimize → Verify",
    "difficulty": "applied",
    "criticalDomainEvidence": [
      "D3"
    ],
    "prompt": "A practitioner wants AI to rewrite a generic aftercare handout into simpler language. She considers uploading a client’s intake form to “give the AI more context.”\n\nWhat is the strongest first question?",
    "choices": [
      "Whether the AI account has training disabled",
      "Whether the intake form can be de-identified",
      "Whether this task needs any client-specific information at all",
      "Whether the client has previously consented to electronic communication"
    ],
    "correctChoice": 2,
    "rationale": "The Need question comes before minimization/settings; unnecessary client data should not be supplied at all.",
    "status": "approved"
  },
  {
    "id": "M11-007",
    "version": 1,
    "sourceModule": 11,
    "sourceSection": "Module 11 approved specification — research assistance.",
    "competency": "Research verification",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "An AI tool provides a professional-looking citation supporting a product claim the practitioner wants to use in client education.\n\nWhat should happen next?",
    "choices": [
      "Use the claim because the presence of a citation means the information is sourced",
      "Ask the AI to confirm that the citation is real before using it",
      "Open the source, check that it is current and credible, and confirm that it actually supports the specific claim before relying on it",
      "Avoid using any AI-supplied source because AI research cannot be trusted"
    ],
    "correctChoice": 2,
    "rationale": "AIMT teaches “research with AI, verify outside AI.”",
    "status": "approved"
  },
  {
    "id": "M11-008",
    "version": 1,
    "sourceModule": 11,
    "sourceSection": "Module 11 approved specification — AI authority matrix.",
    "competency": "Draft vs. fact vs. decision",
    "difficulty": "advanced-synthesis",
    "criticalDomainEvidence": [
      "D1"
    ],
    "prompt": "AI produces three outputs:\n\n1. a draft Instagram caption;\n2. a summary of a newly updated state-board rule;\n3. a recommendation about whether a concerning scalp finding is medically safe to treat.\n\nWhich handling is strongest?",
    "choices": [
      "Review/edit #1; independently verify #2 with the authoritative current source; keep final professional authority for #3 rather than delegating it to AI",
      "Review all three equally because every AI output requires the same level of skepticism",
      "Use #1 and #2 if they sound accurate; refer #3 to a medical professional automatically",
      "Publish #1, verify #2 through another AI tool, and use #3 only as a second opinion"
    ],
    "correctChoice": 0,
    "rationale": "Different tasks require different levels of review/authority based on stakes and professional responsibility.",
    "status": "approved"
  },
  {
    "id": "M11-009",
    "version": 1,
    "sourceModule": 11,
    "sourceSection": "Module 11 approved specification — Human-led. AI-assisted.",
    "competency": "Human ownership of AI-assisted work",
    "difficulty": "applied",
    "criticalDomainEvidence": [],
    "prompt": "AI produces an excellent client email that sounds polished, empathetic, and on-brand.\n\nWhat still belongs to the practitioner before it is sent?",
    "choices": [
      "Nothing significant if the output already sounds correct",
      "Confirming the facts/current details, checking claims and boundaries, and deciding whether the message genuinely represents the business and situation",
      "Running the message through another AI system for a second opinion",
      "Rewriting at least half of it so the final message is demonstrably human-authored"
    ],
    "correctChoice": 1,
    "rationale": "Human ownership remains necessary even when AI output is strong.",
    "status": "approved"
  }
];

/** @type {import('./content-schema.mjs').CaseItem[]} */
export const caseBank = [
  {
    "id": "CASE-01",
    "version": 1,
    "sourceModules": [
      2,
      4,
      5
    ],
    "sourceSection": "Module 2 intake/arrival/choice; Module 4 regional observation; Module 5 regional service levers.",
    "competencies": [
      "Arrival leadership",
      "intake confirmation",
      "regional observation",
      "service adaptation"
    ],
    "criticalDomainEvidence": [],
    "scenario": "Your client arrives eight minutes late and visibly stressed. During verbal intake confirmation, she tells you she recently reacted to a scented product. That sensitivity was not listed on the intake form she submitted earlier.\n\nDuring the scalp assessment you observe:\n\n- visible residue and shine through the crown;\n- fine loose scale at the temples;\n- no reported tenderness, burning, or pain.",
    "parts": [
      {
        "id": "CASE-01-pA",
        "type": "multi-select",
        "prompt": "Select all actions that belong in your response",
        "choices": [
          "Keep the arrival moving by shortening the intake conversation because she is already late",
          "Confirm the newly reported sensitivity and adjust the scent portion of the service accordingly",
          "Offer fragrance-free service as a valid option rather than steering her toward another scent",
          "Describe the crown and temple findings separately instead of assigning one whole-scalp type",
          "Use the crown finding to set the cleansing intensity for the whole scalp so the plan stays consistent",
          "Adapt the service by region, keeping stable areas from receiving unnecessary corrective treatment",
          "Treat the signed intake as controlling because it was completed before arrival",
          "Keep the practitioner’s communication calm and avoid transferring schedule pressure to the client"
        ],
        "correctAnswer": [
          1,
          2,
          3,
          5,
          7
        ]
      },
      {
        "id": "CASE-01-pB",
        "type": "structured-short-response",
        "prompt": "In 3–5 sentences, describe how you would adapt the service across the crown, temples, and stable areas without diagnosing the client.",
        "rubric": {
          "totalPoints": 8,
          "criteria": [
            {
              "points": 2,
              "description": "crown receives a targeted response rather than controlling the whole scalp"
            },
            {
              "points": 2,
              "description": "temples receive a gentler/appropriate response based on current findings"
            },
            {
              "points": 2,
              "description": "stable areas are preserved rather than “corrected” unnecessarily"
            },
            {
              "points": 2,
              "description": "language remains descriptive/non-diagnostic"
            }
          ]
        }
      }
    ],
    "scoring": {
      "method": "weighted-parts",
      "weights": [
        1,
        1
      ]
    },
    "criticalFlags": [],
    "status": "approved"
  },
  {
    "id": "CASE-02",
    "version": 1,
    "sourceModules": [
      1,
      4
    ],
    "sourceSection": "Module 1 scope/referral; Module 4 do-not-proceed findings and device reprocessing.",
    "competencies": [
      "Stop/refer",
      "client communication",
      "device hygiene"
    ],
    "criticalDomainEvidence": [
      "D1",
      "D2",
      "D4"
    ],
    "scenario": "Midway through the scalp-camera assessment, you observe an area near the back of the scalp with visible fluid and mild crusting.\n\nThe client says:\n\n> “It doesn’t hurt. I have a meeting after this, so please don’t make this into a big thing. Can we just keep going?”\n\nAssume the camera’s contact surface touched the area before you realized the skin was compromised.",
    "parts": [
      {
        "id": "CASE-02-pA",
        "type": "single-best-answer",
        "prompt": "What happens to the camera assessment?",
        "choices": [
          "Continue, but avoid direct pressure on the area",
          "Take one additional image so you have enough information to explain the concern",
          "Stop camera contact with the affected area",
          "Continue the scan elsewhere and return to the area only if the client reports discomfort"
        ],
        "correctAnswer": 2
      },
      {
        "id": "CASE-02-pB",
        "type": "single-best-answer",
        "prompt": "What is the strongest service decision?",
        "choices": [
          "Continue the full service because the client is comfortable",
          "Modify the service around the area and avoid direct contact, but otherwise proceed normally",
          "Do not perform cosmetic scalp treatment over the concerning finding and explain that it should be medically evaluated before you work over that area",
          "Apply only gentle cleansing to the area because there is no pain"
        ],
        "correctAnswer": 2
      },
      {
        "id": "CASE-02-pC",
        "type": "single-best-answer",
        "prompt": "What happens to the camera before it can be used again?",
        "choices": [
          "Wipe away anything visible and return it to service",
          "Remove it from service and follow the manufacturer-directed cleaning/disinfection process before reuse",
          "Continue using it on this client only, then disinfect it at closing",
          "Replace any disposable cover and return the device to the clean zone"
        ],
        "correctAnswer": 1
      },
      {
        "id": "CASE-02-pD",
        "type": "structured-short-response",
        "prompt": "What would you say to the client in this moment? Keep the explanation calm, non-diagnostic, and clear about why the service decision is changing.",
        "rubric": {
          "totalPoints": 6,
          "criteria": [
            {
              "points": 2,
              "description": "acknowledges the client without being alarmist"
            },
            {
              "points": 2,
              "description": "does not name/confirm a diagnosis"
            },
            {
              "points": 2,
              "description": "clearly explains that the visible finding changes what can responsibly be done and supports medical evaluation"
            }
          ],
          "explicitUnsafeRule": {
            "description": "Type A unsafe reasoning if the student explicitly states they would continue treatment over the finding because the client is comfortable/insists, or knowingly reuse the contacted device without required reprocessing."
          }
        }
      }
    ],
    "scoring": {
      "method": "weighted-parts",
      "weights": [
        1,
        1,
        1,
        1
      ]
    },
    "criticalFlags": [],
    "status": "approved"
  },
  {
    "id": "CASE-03",
    "version": 1,
    "sourceModules": [
      5,
      6
    ],
    "sourceSection": "Module 5 decision priority + scale/exfoliation rule; Module 6 wrong-product cycle.",
    "competencies": [
      "Wrong-product cycle",
      "reassessment",
      "service redirection"
    ],
    "criticalDomainEvidence": [
      "D2"
    ],
    "scenario": "A returning client tells you she has been using increasingly strong anti-dandruff products for about two months because her flaking keeps getting worse.\n\nToday you observe:\n\n- fine, powdery white scale;\n- a matte surface;\n- minimal visible oil;\n- no redness;\n- no spread beyond the scalp margin.\n\nShe says:\n\n> “Can you use the strongest exfoliation you have today? I really want to get all of this off.”",
    "parts": [
      {
        "id": "CASE-03-pA",
        "type": "single-best-answer",
        "prompt": "Which interpretation is strongest?",
        "choices": [
          "Her routine is probably not strong enough because the flaking is still present",
          "The presentation may be more compatible with a dry-scalp pattern, so the current routine should be reassessed before anything is intensified",
          "Any visible flaking should be treated as dandruff until it responds to an OTC anti-dandruff product",
          "The presentation automatically requires medical referral because the products have not worked"
        ],
        "correctAnswer": 1
      },
      {
        "id": "CASE-03-pB",
        "type": "single-best-answer",
        "prompt": "What is the strongest service decision?",
        "choices": [
          "Use strong exfoliation only where the scale is most visible",
          "Use the requested intensity because the skin is intact and the client understands what she wants",
          "Redirect to a gentler approach that avoids further unnecessary stripping/stimulation and explain why the current presentation does not support the requested intensity",
          "Skip all cleansing and exfoliation regardless of what the rest of the assessment shows"
        ],
        "correctAnswer": 2
      },
      {
        "id": "CASE-03-pC",
        "type": "structured-short-response",
        "prompt": "Explain to the client why “stronger” is not automatically the better next step here. Do not diagnose her.",
        "rubric": {
          "totalPoints": 8,
          "criteria": [
            {
              "points": 2,
              "description": "recognizes current home routine may be mismatched to the presentation"
            },
            {
              "points": 2,
              "description": "does not equate visible scale with automatic exfoliation"
            },
            {
              "points": 2,
              "description": "redirects intensity rather than simply complying"
            },
            {
              "points": 2,
              "description": "explanation remains non-diagnostic and professional"
            }
          ],
          "explicitUnsafeRule": {
            "description": "Explicitly proceeding with clearly inappropriate stronger intensity solely because the client insists contributes Type A D2 evidence."
          }
        }
      }
    ],
    "scoring": {
      "method": "weighted-parts",
      "weights": [
        1,
        1,
        1
      ]
    },
    "criticalFlags": [
      {
        "partId": "CASE-03-pB",
        "triggerType": "choiceEquals",
        "value": 1,
        "domainId": "D2",
        "description": "Explicitly proceeding with clearly inappropriate stronger intensity solely because the client insists contributes Type A D2 evidence."
      }
    ],
    "status": "approved"
  },
  {
    "id": "CASE-04",
    "version": 1,
    "sourceModules": [
      7,
      10
    ],
    "sourceSection": "Module 7 prep sequencing; Module 10 Reset Under Pressure.",
    "competencies": [
      "Required process time",
      "parallel workflow",
      "readiness under pressure"
    ],
    "criticalDomainEvidence": [
      "D4"
    ],
    "scenario": "Your next client arrives ten minutes early.\n\nThe room is close to ready, but:\n\n- one hard service surface still has **three minutes remaining** in its label-directed disinfectant contact time;\n- clean linens are not yet staged;\n- the sensory setup is incomplete;\n- an already-clean alternative surface/tool setup is available in the room.\n\nThe client can see that you are finishing the reset.",
    "parts": [
      {
        "id": "CASE-04-pA",
        "type": "single-best-answer",
        "prompt": "Which action should happen regarding the surface still completing contact time?",
        "choices": [
          "Dry it now because most of the required time has already passed",
          "Preserve the full remaining contact time",
          "Cover it with a clean barrier and begin the service",
          "Rinse it with water to remove the disinfectant and finish the setup"
        ],
        "correctAnswer": 1
      },
      {
        "id": "CASE-04-pB",
        "type": "multi-select",
        "prompt": "While that time is running, which actions may be appropriate?",
        "choices": [
          "Stage the clean linens",
          "Complete other independent reset tasks",
          "Use an already-ready alternative if the service can proceed without disturbing the incomplete process",
          "Shorten the contact time if the client has already been waiting",
          "Calmly delay the service start if the required system is not ready",
          "Use an unprocessed backup item so the client does not wait"
        ],
        "correctAnswer": [
          0,
          1,
          2,
          4
        ]
      },
      {
        "id": "CASE-04-pC",
        "type": "single-best-answer",
        "prompt": "What is the best communication choice if the room still is not ready when the appointment should begin?",
        "choices": [
          "Say nothing and move quickly so the client does not notice the delay",
          "Tell the client sanitation is taking longer than expected and ask her to waive the remaining time",
          "Calmly let the client know you need a few more minutes to finish preparing the room correctly",
          "Bring the client in and finish the reset around her"
        ],
        "correctAnswer": 2
      }
    ],
    "scoring": {
      "method": "weighted-parts",
      "weights": [
        1,
        1,
        1
      ]
    },
    "criticalFlags": [
      {
        "partId": "CASE-04-pA",
        "triggerType": "choiceEquals",
        "value": 0,
        "domainId": "D4",
        "description": "Explicit willingness to shorten required process time or use an unprocessed item is Type A D4 evidence."
      },
      {
        "partId": "CASE-04-pA",
        "triggerType": "choiceEquals",
        "value": 3,
        "domainId": "D4",
        "description": "Explicit willingness to shorten required process time or use an unprocessed item is Type A D4 evidence."
      },
      {
        "partId": "CASE-04-pB",
        "triggerType": "choiceIncludes",
        "value": 3,
        "domainId": "D4",
        "description": "Explicit willingness to shorten required process time or use an unprocessed item is Type A D4 evidence."
      },
      {
        "partId": "CASE-04-pB",
        "triggerType": "choiceIncludes",
        "value": 5,
        "domainId": "D4",
        "description": "Explicit willingness to shorten required process time or use an unprocessed item is Type A D4 evidence."
      }
    ],
    "status": "approved"
  },
  {
    "id": "CASE-05",
    "version": 1,
    "sourceModules": [
      7,
      8
    ],
    "sourceSection": "Module 7 stop→adjust→communicate→resume; Module 8 exfoliation adaptation and quiet communication.",
    "competencies": [
      "Comfort response",
      "positioning",
      "exfoliation adaptation"
    ],
    "criticalDomainEvidence": [
      "D2"
    ],
    "scenario": "You are in the exfoliation portion of an Extended-format service.\n\nThe client says:\n\n> “My neck feels strained, and I’m getting a little cold.”\n\nYou make an adjustment. Several minutes later, she says:\n\n> “The exfoliation feels like a lot today.”\n\nThere are no emergency symptoms and no new stop-and-refer finding.",
    "parts": [
      {
        "id": "CASE-05-pA",
        "type": "sequencing",
        "prompt": "Put the first comfort response in the strongest order:",
        "choices": [
          "Confirm comfort before resuming",
          "Stop the current action",
          "Communicate what you are adjusting",
          "Adjust positioning and/or temperature"
        ],
        "correctAnswer": [
          1,
          3,
          2,
          0
        ]
      },
      {
        "id": "CASE-05-pB",
        "type": "single-best-answer",
        "prompt": "How should the exfoliation feedback be handled?",
        "choices": [
          "Continue unchanged because the client already consented to exfoliation",
          "Skip exfoliation entirely because any discomfort means the step is no longer appropriate",
          "Adjust the exfoliation lever—product, method, pressure, technique, intensity, or combination—based on the client’s response and current presentation",
          "Keep the same method but shorten the duration so the overall exposure is lower"
        ],
        "correctAnswer": 2
      },
      {
        "id": "CASE-05-pC",
        "type": "structured-short-response",
        "prompt": "In a few sentences, explain how you would keep the service calm and intentional while handling both issues.",
        "rubric": {
          "totalPoints": 6,
          "criteria": [
            {
              "points": 2,
              "description": "prioritizes client comfort without visible panic/rushing"
            },
            {
              "points": 2,
              "description": "communicates changes concisely rather than silently adjusting or over-narrating"
            },
            {
              "points": 2,
              "description": "preserves service flow by adapting appropriately rather than forcing the original plan"
            }
          ]
        }
      }
    ],
    "scoring": {
      "method": "weighted-parts",
      "weights": [
        1,
        1,
        1
      ]
    },
    "criticalFlags": [],
    "status": "approved"
  },
  {
    "id": "CASE-06",
    "version": 1,
    "sourceModules": [
      5,
      8,
      9
    ],
    "sourceSection": "Module 5 safety/appropriateness; Module 8 closing; Module 9 restraint-over-sale enhancement judgment.",
    "competencies": [
      "Carrying service judgment into recommendation",
      "pressure-free close"
    ],
    "criticalDomainEvidence": [],
    "scenario": "Earlier in the service, you reduced intensity around a reactive-appearing hairline because the client reported tenderness. The finding did **not** meet the course’s stop-and-refer threshold, but it did justify a more cautious approach.\n\nAt checkout the client says:\n\n> “Next time I want the strongest scalp-treatment upgrade you have, especially right here.”",
    "parts": [
      {
        "id": "CASE-06-pA",
        "type": "single-best-answer",
        "prompt": "What is the strongest recommendation?",
        "choices": [
          "Pre-book the stronger enhancement and reassess the area when she returns",
          "Decline every enhancement permanently because today’s tenderness proves the area cannot tolerate more intensive treatment",
          "Explain that you would not promise a more intensive treatment for that area now; reassess at the next visit and recommend only what the future presentation supports",
          "Recommend a different premium enhancement immediately so the client still has an upgrade option"
        ],
        "correctAnswer": 2
      },
      {
        "id": "CASE-06-pB",
        "type": "structured-short-response",
        "prompt": "Give the client-facing explanation you would use at checkout. Keep it non-diagnostic and pressure-free.",
        "rubric": {
          "totalPoints": 8,
          "criteria": [
            {
              "points": 2,
              "description": "does not sell an inappropriate future intensity in advance"
            },
            {
              "points": 2,
              "description": "explains that future appropriateness should be reassessed"
            },
            {
              "points": 2,
              "description": "avoids diagnosis/alarm language"
            },
            {
              "points": 2,
              "description": "does not substitute a different sale merely to preserve revenue"
            }
          ]
        }
      }
    ],
    "scoring": {
      "method": "weighted-parts",
      "weights": [
        1,
        1
      ]
    },
    "criticalFlags": [],
    "status": "approved"
  },
  {
    "id": "CASE-07",
    "version": 1,
    "sourceModules": [
      1,
      4,
      11
    ],
    "sourceSection": "Module 1 observation/scope; Module 4 observation discipline; Module 11 Hear→Observe→Boundary→Next Step.",
    "competencies": [
      "Client-supplied AI",
      "observation vs. diagnosis",
      "next-step reasoning"
    ],
    "criticalDomainEvidence": [
      "D1"
    ],
    "scenario": "Before the hands-on assessment begins, the client says:\n\n> “I already uploaded a photo to an AI tool and it told me I have early-stage alopecia areata. Another scalp app gave me a high-confidence match too. I just want you to confirm it and tell me what to do.”\n\nShe seems anxious and wants a clear answer.",
    "parts": [
      {
        "id": "CASE-07-response",
        "type": "structured-short-response",
        "prompt": "Respond as you would in the consultation. Include what you would say, what you would actually assess or observe, what you would not confirm, and how you would decide the next step.",
        "rubric": {
          "totalPoints": 10,
          "criteria": [
            {
              "points": 2,
              "description": "**Hear:** acknowledges what the client brought in without ridicule/dismissal"
            },
            {
              "points": 2,
              "description": "**Observe:** returns to the actual in-person consultation/observable findings"
            },
            {
              "points": 2,
              "description": "**Boundary:** clearly does not confirm the AI diagnosis or use multiple AI outputs as diagnostic authority"
            },
            {
              "points": 2,
              "description": "**Next Step:** bases service/referral decision on actual findings and AIMT scope/safety rules"
            },
            {
              "points": 2,
              "description": "communicates calmly and professionally without giving a wink-and-nod diagnosis"
            }
          ],
          "explicitUnsafeRule": {
            "description": "Explicitly confirming the named condition as fact, or claiming AI/scanner output grants diagnostic authority, is Type A D1 evidence."
          }
        }
      }
    ],
    "scoring": {
      "method": "weighted-parts",
      "weights": [
        1
      ]
    },
    "criticalFlags": [],
    "status": "approved"
  },
  {
    "id": "CASE-08",
    "version": 1,
    "sourceModules": [
      7,
      10
    ],
    "sourceSection": "Module 7 bed requirements/positioning; Module 10 item/process integrity.",
    "competencies": [
      "Requirement vs. preference",
      "sanitation status",
      "setup priority"
    ],
    "criticalDomainEvidence": [
      "D4"
    ],
    "scenario": "Before the first client arrives, you notice three things:\n\n1. the treatment bed’s armrests are configured differently than you normally prefer;\n2. the Halo alignment appears slightly off;\n3. one item sitting in the clean container has uncertain processing history.",
    "parts": [
      {
        "id": "CASE-08-pA",
        "type": "classification",
        "prompt": "For each item, classify it as:",
        "categories": [
          "Acceptable variation",
          "Needs correction before service"
        ],
        "items": [
          {
            "id": "item1",
            "label": "Armrest configuration"
          },
          {
            "id": "item2",
            "label": "Halo alignment"
          },
          {
            "id": "item3",
            "label": "Uncertain-processing item in clean container"
          }
        ],
        "correctAnswer": {
          "item1": "Acceptable variation",
          "item2": "Needs correction before service",
          "item3": "Needs correction before service"
        }
      },
      {
        "id": "CASE-08-pB",
        "type": "single-best-answer",
        "prompt": "What should happen to the questionable item?",
        "choices": [
          "Keep it in the clean container unless visible residue is found",
          "Verify/reprocess it appropriately rather than assuming it is clean",
          "Move it to a reserve area and use it only if needed",
          "Ask another team member whether they remember cleaning it; verbal reassurance is enough"
        ],
        "correctAnswer": 1
      },
      {
        "id": "CASE-08-pC",
        "type": "single-best-answer",
        "prompt": "Which issue deserves the highest immediate priority before the client enters?",
        "choices": [
          "Restoring the preferred armrest configuration",
          "Correcting both the sanitation uncertainty and the positioning/alignment issue before service begins",
          "Correcting only the Halo because equipment alignment affects comfort more than storage",
          "Making the room look visually consistent, then addressing the other issues if time allows"
        ],
        "correctAnswer": 1
      }
    ],
    "scoring": {
      "method": "weighted-parts",
      "weights": [
        1,
        1,
        1
      ]
    },
    "criticalFlags": [],
    "status": "approved"
  },
  {
    "id": "CASE-09",
    "version": 1,
    "sourceModules": [
      2,
      8
    ],
    "sourceSection": "Module 2 consent/autonomy; Module 8 touch/bodywork scope and changing preferences.",
    "competencies": [
      "Changing consent",
      "bodywork authority",
      "privacy/positioning"
    ],
    "criticalDomainEvidence": [
      "D3"
    ],
    "scenario": "During intake, a client tells you she does **not** want neck or shoulder massage, so you plan the service without it.\n\nHalfway through the appointment she says:\n\n> “Actually, my shoulders are really tight. Can you work on them now?”\n\nFor this case, assume neck/shoulder work is within your applicable scope and training.",
    "parts": [
      {
        "id": "CASE-09-response",
        "type": "structured-short-response",
        "prompt": "What would you do from here? Explain how the earlier “no,” the new request, consent, and the practical setup of the service affect your decision.",
        "rubric": {
          "totalPoints": 10,
          "criteria": [
            {
              "points": 2,
              "description": "respects that the earlier decline was valid and was correctly followed"
            },
            {
              "points": 2,
              "description": "recognizes the client may change her preference during the service"
            },
            {
              "points": 2,
              "description": "intentionally reconfirms permission for the newly requested touch/bodywork before beginning"
            },
            {
              "points": 2,
              "description": "preserves appropriate positioning/draping/privacy when adding the work"
            },
            {
              "points": 2,
              "description": "recognizes that scope/training remain prerequisites even when the client requests the work"
            }
          ],
          "explicitUnsafeRule": {
            "description": "Type A D3 evidence if the student treats the new request as automatic permission to begin without confirmation, or states that client request could authorize work outside applicable scope/training."
          }
        }
      }
    ],
    "scoring": {
      "method": "weighted-parts",
      "weights": [
        1
      ]
    },
    "criticalFlags": [],
    "status": "approved"
  },
  {
    "id": "CASE-10",
    "version": 1,
    "sourceModules": [
      4,
      11
    ],
    "sourceSection": "Module 4 layered image consent; Module 11 client data/images and Need/Minimize/Verify.",
    "competencies": [
      "Layered image consent",
      "Need/Minimize/Verify"
    ],
    "criticalDomainEvidence": [
      "D3"
    ],
    "scenario": "A client previously gave permission for her scalp images to be saved in her client record for service comparison.\n\nLater, the practitioner thinks the same image would be useful for:\n\n- uploading to a general-purpose AI tool for additional analysis;\n- using in staff education.",
    "parts": [
      {
        "id": "CASE-10-pA",
        "type": "single-best-answer",
        "prompt": "What does the original permission automatically cover?",
        "choices": [
          "All three uses because the image was already authorized for the business",
          "Saving in the client record only; additional AI processing and staff-education use require their own appropriate consideration/permission",
          "Saving plus staff education, but not external AI use",
          "Saving plus AI analysis, as long as the client’s name is removed"
        ],
        "correctAnswer": 1
      },
      {
        "id": "CASE-10-pB",
        "type": "single-best-answer",
        "prompt": "Before considering the AI upload, what is the strongest first question?",
        "choices": [
          "Does the AI provider offer a private/business account?",
          "Can the image be cropped to remove identifying details?",
          "Does the AI actually need this client image to accomplish the intended task?",
          "Has the client used AI herself before?"
        ],
        "correctAnswer": 2
      },
      {
        "id": "CASE-10-pC",
        "type": "structured-short-response",
        "prompt": "In a few sentences, explain why consent to save an image for the client record does not automatically become permission for every later use.",
        "rubric": {
          "totalPoints": 6,
          "criteria": [
            {
              "points": 2,
              "description": "recognizes permissions are purpose-specific/layered"
            },
            {
              "points": 2,
              "description": "recognizes AI/education are new uses rather than extensions of record storage"
            },
            {
              "points": 2,
              "description": "applies Need/Minimize/Verify rather than assuming de-identification alone resolves the issue"
            }
          ]
        }
      }
    ],
    "scoring": {
      "method": "weighted-parts",
      "weights": [
        1,
        1,
        1
      ]
    },
    "criticalFlags": [],
    "status": "approved"
  },
  {
    "id": "CASE-11",
    "version": 1,
    "sourceModules": [
      9,
      11
    ],
    "sourceSection": "Module 9 pricing framework; Module 11 Level 2 AI assistance/verification.",
    "competencies": [
      "Pricing judgment",
      "AI verification/authority"
    ],
    "criticalDomainEvidence": [],
    "scenario": "A practitioner asks an AI tool:\n\n> “What should I charge for a 90-minute Head Spa in my city?”\n\nThe AI reviews competitor websites and responds:\n\n> “The optimal price is $175.”\n\nThe practitioner’s own complete cost model produces a target price of about $205.",
    "parts": [
      {
        "id": "CASE-11-pA",
        "type": "single-best-answer",
        "prompt": "What is the strongest immediate conclusion?",
        "choices": [
          "Price at $175 because the AI has already synthesized current market data",
          "Price at $205 because the practitioner’s cost model is the only information that matters",
          "Investigate the difference before deciding; the AI result is market context, not final pricing authority",
          "Average the two numbers and charge $190"
        ],
        "correctAnswer": 2
      },
      {
        "id": "CASE-11-pB",
        "type": "multi-select",
        "prompt": "Which factors should be reviewed before making the final pricing decision?",
        "choices": [
          "Whether the competitor information is current and comparable",
          "The practitioner’s actual cost structure",
          "Service design/differentiation",
          "Capacity and business positioning",
          "Whether the AI sounded confident",
          "The underlying calculations/assumptions"
        ],
        "correctAnswer": [
          0,
          1,
          2,
          3,
          5
        ]
      },
      {
        "id": "CASE-11-pC",
        "type": "structured-short-response",
        "prompt": "Explain why neither the AI’s $175 nor the practitioner’s $205 should automatically become the final price without further judgment.",
        "rubric": {
          "totalPoints": 6,
          "criteria": [
            {
              "points": 2,
              "description": "competitor/AI information is context, not formula"
            },
            {
              "points": 2,
              "description": "own cost data matters but exists within market/service/capacity/positioning context"
            },
            {
              "points": 2,
              "description": "final decision remains human and should follow verified assumptions/data"
            }
          ]
        }
      }
    ],
    "scoring": {
      "method": "weighted-parts",
      "weights": [
        1,
        1,
        1
      ]
    },
    "criticalFlags": [],
    "status": "approved"
  },
  {
    "id": "CASE-12",
    "version": 1,
    "sourceModules": [
      1,
      3,
      4
    ],
    "sourceSection": "Module 1 scope; Module 3 delayed shedding; Module 4 observation discipline.",
    "competencies": [
      "Timeline reasoning",
      "observation",
      "no diagnosis/causation certainty"
    ],
    "criticalDomainEvidence": [
      "D1"
    ],
    "scenario": "A client reports increased diffuse shedding.\n\nHer history includes:\n\n- a high fever about three months before the shedding became noticeable;\n- a new shampoo started **after** the shedding had already begun.\n\nAssessment shows:\n\n- intact skin;\n- no obvious patchy or scarring-type pattern;\n- a diffuse rather than focal concern.\n\nThe client says:\n\n> “So the fever caused telogen effluvium, right?”",
    "parts": [
      {
        "id": "CASE-12-pA",
        "type": "single-best-answer",
        "prompt": "Which history detail is most relevant to the timing discussion?",
        "choices": [
          "The shampoo because it is a hair product",
          "The fever because the course teaches that a major physiological event may precede visible diffuse shedding by weeks to months",
          "Neither, because practitioners cannot discuss shedding timelines",
          "Both are equally capable of explaining the start even though the shampoo began after the shedding"
        ],
        "correctAnswer": 1
      },
      {
        "id": "CASE-12-pB",
        "type": "single-best-answer",
        "prompt": "Which response best handles the client’s conclusion?",
        "choices": [
          "“The timing fits telogen effluvium very well, so that is probably what happened.”",
          "“The timing can be compatible with a delayed shedding pattern, but I can’t prove the fever caused it or confirm a diagnosis from this history. If the shedding is persistent, worsening, or concerning, medical evaluation is appropriate.”",
          "“Since the shampoo started after the shedding, the fever must be the cause.”",
          "“I can’t discuss this because only a physician can talk about the hair cycle.”"
        ],
        "correctAnswer": 1
      },
      {
        "id": "CASE-12-pC",
        "type": "structured-short-response",
        "prompt": "Explain how you would use the assessment findings without letting the magnified images or the timeline become a diagnosis.",
        "rubric": {
          "totalPoints": 6,
          "criteria": [
            {
              "points": 2,
              "description": "uses images for observation/distribution rather than diagnosis"
            },
            {
              "points": 2,
              "description": "recognizes timing as relevant but not causal proof"
            },
            {
              "points": 2,
              "description": "explains an appropriate service/referral next step based on actual findings"
            }
          ],
          "explicitUnsafeRule": {
            "description": "Explicit diagnosis confirmation or causal certainty beyond the taught evidence is D1 evidence."
          }
        }
      }
    ],
    "scoring": {
      "method": "weighted-parts",
      "weights": [
        1,
        1,
        1
      ]
    },
    "criticalFlags": [],
    "status": "approved"
  }
];

/** @type {import('./content-schema.mjs').InterviewItem[]} */
export const interviewBank = [
  {
    "id": "INT-01",
    "version": 1,
    "sourceModules": [
      1,
      4,
      11
    ],
    "sourceSection": "Module 1 scope; Module 4 observation discipline; Module 11 AI authority/confidence-score framework.",
    "competencies": [
      "Observation vs. diagnosis",
      "tool output vs. practitioner authority"
    ],
    "criticalDomainEvidence": [
      "D1"
    ],
    "primaryPrompt": "Let’s start with something you’ve had to think about throughout the course. Say a client really wants you to tell her what’s going on with her scalp. You’ve looked at it yourself, you have magnified images, and maybe an AI tool is even suggesting a condition. How would you handle that conversation? What information would you use, and where would you draw the line?",
    "allowedFollowUp": true,
    "followUpPrompt": "Okay. What if she pushes a little and says, “I know you can’t officially diagnose me — just tell me what you think it probably is”? How would you answer that?",
    "rubricCriteria": [
      {
        "id": "c1",
        "label": "Uses available information appropriately",
        "guidance": "recognizes observation, magnified images, and AI output can inform attention/judgment without becoming diagnostic proof.",
        "criticalDomainEvidence": [
          "D1"
        ],
        "explicitUnsafeRule": {
          "description": "confirming a named diagnosis as fact; claiming AI/microscopy establishes diagnosis; claiming certification grants diagnostic authority."
        }
      },
      {
        "id": "c2",
        "label": "Maintains description vs. diagnosis boundary",
        "guidance": "clearly distinguishes what can be described from what cannot be confirmed.",
        "criticalDomainEvidence": [
          "D1"
        ],
        "explicitUnsafeRule": {
          "description": "confirming a named diagnosis as fact; claiming AI/microscopy establishes diagnosis; claiming certification grants diagnostic authority."
        }
      },
      {
        "id": "c3",
        "label": "Does not use “probably” as a workaround diagnosis",
        "guidance": "preserves the boundary even when the client invites an informal conclusion.",
        "criticalDomainEvidence": [
          "D1"
        ],
        "explicitUnsafeRule": {
          "description": "confirming a named diagnosis as fact; claiming AI/microscopy establishes diagnosis; claiming certification grants diagnostic authority."
        }
      },
      {
        "id": "c4",
        "label": "Connects findings to a responsible service/referral next step",
        "guidance": "does not stop at “I can’t diagnose.”",
        "criticalDomainEvidence": [
          "D1"
        ],
        "explicitUnsafeRule": {
          "description": "confirming a named diagnosis as fact; claiming AI/microscopy establishes diagnosis; claiming certification grants diagnostic authority."
        }
      },
      {
        "id": "c5",
        "label": "Recognizes authority source",
        "guidance": "does not imply AIMT certification or technology expands legal/professional authority.",
        "criticalDomainEvidence": [
          "D1"
        ],
        "explicitUnsafeRule": {
          "description": "confirming a named diagnosis as fact; claiming AI/microscopy establishes diagnosis; claiming certification grants diagnostic authority."
        }
      }
    ],
    "criticalFlags": [
      {
        "description": "confirming a named diagnosis as fact; claiming AI/microscopy establishes diagnosis; claiming certification grants diagnostic authority.",
        "criticalDomainEvidence": [
          "D1"
        ]
      }
    ],
    "status": "approved"
  },
  {
    "id": "INT-02",
    "version": 1,
    "sourceModules": [
      2,
      8
    ],
    "sourceSection": "Module 2 consent/autonomy; Module 8 bodywork scope and changing preferences.",
    "competencies": [
      "Changing consent",
      "bodywork authority"
    ],
    "criticalDomainEvidence": [
      "D3"
    ],
    "primaryPrompt": "Here’s one that could easily happen in a real service. A client told you at intake that she didn’t want neck or shoulder massage, so you left it out. Halfway through, she changes her mind and asks if you can add it. Assume it’s within your scope and training. What would you do from there?",
    "allowedFollowUp": true,
    "followUpPrompt": "And what if what she asked for wasn’t actually within your scope or training — does her asking for it change anything?",
    "rubricCriteria": [
      {
        "id": "c1",
        "label": "Respects the earlier decline",
        "guidance": "recognizes the original “no” was valid and correctly followed.",
        "criticalDomainEvidence": [
          "D3"
        ],
        "explicitUnsafeRule": {
          "description": "beginning the added bodywork without intentional consent confirmation; performing work outside applicable scope/training because the client requested it."
        }
      },
      {
        "id": "c2",
        "label": "Recognizes consent may change",
        "guidance": "does not treat the earlier decline as permanent if the client changes her mind.",
        "criticalDomainEvidence": [
          "D3"
        ],
        "explicitUnsafeRule": {
          "description": "beginning the added bodywork without intentional consent confirmation; performing work outside applicable scope/training because the client requested it."
        }
      },
      {
        "id": "c3",
        "label": "Reconfirms permission intentionally",
        "guidance": "does not treat the new request as automatic permission to start touching.",
        "criticalDomainEvidence": [
          "D3"
        ],
        "explicitUnsafeRule": {
          "description": "beginning the added bodywork without intentional consent confirmation; performing work outside applicable scope/training because the client requested it."
        }
      },
      {
        "id": "c4",
        "label": "Preserves practical privacy/positioning",
        "guidance": "recognizes any added bodywork still needs appropriate positioning/draping/privacy.",
        "criticalDomainEvidence": [
          "D3"
        ],
        "explicitUnsafeRule": {
          "description": "beginning the added bodywork without intentional consent confirmation; performing work outside applicable scope/training because the client requested it."
        }
      },
      {
        "id": "c5",
        "label": "Maintains scope/training boundary",
        "guidance": "understands client consent cannot create practitioner authority.",
        "criticalDomainEvidence": [
          "D3"
        ],
        "explicitUnsafeRule": {
          "description": "beginning the added bodywork without intentional consent confirmation; performing work outside applicable scope/training because the client requested it."
        }
      }
    ],
    "criticalFlags": [
      {
        "description": "beginning the added bodywork without intentional consent confirmation; performing work outside applicable scope/training because the client requested it.",
        "criticalDomainEvidence": [
          "D3"
        ]
      }
    ],
    "status": "approved"
  },
  {
    "id": "INT-03",
    "version": 1,
    "sourceModules": [
      7,
      10
    ],
    "sourceSection": "Module 7 prep sequencing; Module 10 Reset Under Pressure.",
    "competencies": [
      "Sanitation/process integrity under schedule pressure"
    ],
    "criticalDomainEvidence": [
      "D4"
    ],
    "primaryPrompt": "Let’s say it’s one of those days where everything is running a little behind. Your next client is already waiting, but part of your sanitation or equipment process still isn’t finished. What can you adjust to get yourself caught up, and what are you absolutely not willing to rush?",
    "allowedFollowUp": true,
    "followUpPrompt": "If the room just isn’t ready yet, what would you actually say to the client who’s waiting?",
    "rubricCriteria": [
      {
        "id": "c1",
        "label": "Protects required contact/process time",
        "guidance": "clearly states required times are not shortened.",
        "criticalDomainEvidence": [
          "D4"
        ],
        "explicitUnsafeRule": {
          "description": "shortening required contact/process time; using an unprocessed item; treating visible cleanliness as completed processing."
        }
      },
      {
        "id": "c2",
        "label": "Identifies legitimate flexibility",
        "guidance": "can name independent tasks/order/alternatives that may flex.",
        "criticalDomainEvidence": [
          "D4"
        ],
        "explicitUnsafeRule": {
          "description": "shortening required contact/process time; using an unprocessed item; treating visible cleanliness as completed processing."
        }
      },
      {
        "id": "c3",
        "label": "Rejects unprocessed substitutions",
        "guidance": "does not use an item/process that is not ready.",
        "criticalDomainEvidence": [
          "D4"
        ],
        "explicitUnsafeRule": {
          "description": "shortening required contact/process time; using an unprocessed item; treating visible cleanliness as completed processing."
        }
      },
      {
        "id": "c4",
        "label": "Maintains clean/used integrity",
        "guidance": "does not allow time pressure to collapse the sanitation system.",
        "criticalDomainEvidence": [
          "D4"
        ],
        "explicitUnsafeRule": {
          "description": "shortening required contact/process time; using an unprocessed item; treating visible cleanliness as completed processing."
        }
      },
      {
        "id": "c5",
        "label": "Handles client communication professionally",
        "guidance": "calmly manages the wait rather than transferring pressure or hiding the issue.",
        "criticalDomainEvidence": [
          "D4"
        ],
        "explicitUnsafeRule": {
          "description": "shortening required contact/process time; using an unprocessed item; treating visible cleanliness as completed processing."
        }
      }
    ],
    "criticalFlags": [
      {
        "description": "shortening required contact/process time; using an unprocessed item; treating visible cleanliness as completed processing.",
        "criticalDomainEvidence": [
          "D4"
        ]
      }
    ],
    "status": "approved"
  },
  {
    "id": "INT-04",
    "version": 1,
    "sourceModules": [
      5,
      8,
      9
    ],
    "sourceSection": "Module 5 decision priority; Module 8 adaptation; Module 9 restraint-over-sale.",
    "competencies": [
      "Safety/appropriateness vs. client preference"
    ],
    "criticalDomainEvidence": [
      "D2"
    ],
    "primaryPrompt": "A client really wants the works — stronger exfoliation, more steam, more intensity. But based on what you’re seeing and what she’s telling you, you don’t think that’s the right service for her today. She understands that and still says she wants it. How do you handle that?",
    "allowedFollowUp": true,
    "followUpPrompt": "What if she says, “I’ll sign something saying it was my choice”? Would that change your decision?",
    "rubricCriteria": [
      {
        "id": "c1",
        "label": "Professional judgment outranks preference",
        "guidance": "recognizes client request/consent does not make an inappropriate service appropriate.",
        "criticalDomainEvidence": [
          "D2"
        ],
        "explicitUnsafeRule": {
          "description": "proceeding at an inappropriate intensity because the client agrees/signs; treating consent as permission to override a safety limit."
        }
      },
      {
        "id": "c2",
        "label": "Explains the decision without diagnosing",
        "guidance": "gives a clear, professional reason tied to today’s presentation/tolerance.",
        "criticalDomainEvidence": [
          "D2"
        ],
        "explicitUnsafeRule": {
          "description": "proceeding at an inappropriate intensity because the client agrees/signs; treating consent as permission to override a safety limit."
        }
      },
      {
        "id": "c3",
        "label": "Redirects rather than simply complies or becomes adversarial",
        "guidance": "offers a compatible alternative when appropriate.",
        "criticalDomainEvidence": [
          "D2"
        ],
        "explicitUnsafeRule": {
          "description": "proceeding at an inappropriate intensity because the client agrees/signs; treating consent as permission to override a safety limit."
        }
      },
      {
        "id": "c4",
        "label": "Knows when to pause/decline",
        "guidance": "does not assume every conflict can be solved by “meeting in the middle.”",
        "criticalDomainEvidence": [
          "D2"
        ],
        "explicitUnsafeRule": {
          "description": "proceeding at an inappropriate intensity because the client agrees/signs; treating consent as permission to override a safety limit."
        }
      },
      {
        "id": "c5",
        "label": "Rejects waiver logic",
        "guidance": "understands paperwork does not transfer professional responsibility.",
        "criticalDomainEvidence": [
          "D2"
        ],
        "explicitUnsafeRule": {
          "description": "proceeding at an inappropriate intensity because the client agrees/signs; treating consent as permission to override a safety limit."
        }
      }
    ],
    "criticalFlags": [
      {
        "description": "proceeding at an inappropriate intensity because the client agrees/signs; treating consent as permission to override a safety limit.",
        "criticalDomainEvidence": [
          "D2"
        ]
      }
    ],
    "status": "approved"
  },
  {
    "id": "INT-05",
    "version": 1,
    "sourceModules": [
      4,
      5,
      6
    ],
    "sourceSection": "Module 4 distribution/observation; Module 5 regional adaptation; Module 6 pattern uncertainty.",
    "competencies": [
      "Regional assessment",
      "uncertainty",
      "service translation"
    ],
    "criticalDomainEvidence": [],
    "primaryPrompt": "Imagine the crown looks pretty dramatic under magnification — oil, residue, scale — but the temples look completely different and most of the rest of the scalp is fairly calm. Then the client asks, “So what type of scalp do I have?” How would you explain what you’re seeing and turn that into today’s service plan?",
    "allowedFollowUp": true,
    "followUpPrompt": "What if the crown looks like it could handle more cleansing, but the hairline is tender and reactive? How would you think about intensity across the whole scalp?",
    "rubricCriteria": [
      {
        "id": "c1",
        "label": "Does not let one dramatic image define the whole scalp.",
        "guidance": "Does not let one dramatic image define the whole scalp.",
        "criticalDomainEvidence": []
      },
      {
        "id": "c2",
        "label": "Uses regional/distribution reasoning",
        "guidance": "describes different areas separately.",
        "criticalDomainEvidence": []
      },
      {
        "id": "c3",
        "label": "Avoids permanent scalp-type/diagnostic labeling.",
        "guidance": "Avoids permanent scalp-type/diagnostic labeling.",
        "criticalDomainEvidence": []
      },
      {
        "id": "c4",
        "label": "Translates findings into regional service decisions",
        "guidance": "not one uniform correction.",
        "criticalDomainEvidence": []
      },
      {
        "id": "c5",
        "label": "Protects the reactive region without forcing its lower intensity onto unrelated stable regions",
        "guidance": "unless the broader facts actually justify a whole-service change.",
        "criticalDomainEvidence": []
      }
    ],
    "criticalFlags": [],
    "status": "approved"
  },
  {
    "id": "INT-06",
    "version": 1,
    "sourceModules": [
      2,
      7,
      8
    ],
    "sourceSection": "Module 2 active autonomy; Module 7 comfort response; Module 8 pacing/communication/preferences.",
    "competencies": [
      "Service leadership under changing conditions"
    ],
    "criticalDomainEvidence": [],
    "primaryPrompt": "Services don’t always go exactly the way you planned them. Say you’re running a little long, the client asks you to lighten your pressure, and then she tells you she doesn’t want the fragrance you started with anymore. How would you manage the rest of that appointment without making it feel chaotic?",
    "allowedFollowUp": true,
    "followUpPrompt": "What parts of the service would you refuse to rush or compress just to get yourself back on schedule?",
    "rubricCriteria": [
      {
        "id": "c1",
        "label": "Honors changing client preferences",
        "guidance": "pressure/fragrance are adjusted rather than treated as fixed from intake.",
        "criticalDomainEvidence": []
      },
      {
        "id": "c2",
        "label": "Keeps communication concise and calm",
        "guidance": "does not over-narrate or silently ignore changes.",
        "criticalDomainEvidence": []
      },
      {
        "id": "c3",
        "label": "Uses pacing judgment",
        "guidance": "recovers time only from legitimately flexible portions.",
        "criticalDomainEvidence": []
      },
      {
        "id": "c4",
        "label": "Protects non-negotiables",
        "guidance": "safety checks, required product/process directions, consent/comfort, necessary rinse/transition completeness.",
        "criticalDomainEvidence": []
      },
      {
        "id": "c5",
        "label": "Maintains service leadership",
        "guidance": "adapts without visible panic, blame, or rushing the client.",
        "criticalDomainEvidence": []
      }
    ],
    "criticalFlags": [
      {
        "description": "explicit refusal to honor changed consent/preference around touch; knowingly compressing a required safety/process step to get back on time.",
        "criticalDomainEvidence": []
      }
    ],
    "status": "approved"
  },
  {
    "id": "INT-07",
    "version": 1,
    "sourceModules": [
      9
    ],
    "sourceSection": "Module 9 pricing strategy and checkpoint `m10cp1` (historical internal ID).",
    "competencies": [
      "Business pricing judgment"
    ],
    "criticalDomainEvidence": [],
    "primaryPrompt": "Let’s switch gears and talk business for a minute. You create a new Head Spa service and now you have to put a real price on it. How would you work your way to a number you actually feel good about charging?",
    "allowedFollowUp": true,
    "followUpPrompt": "Now say your numbers point to about $205, but most nearby businesses are around $175. What would you do with that information?",
    "rubricCriteria": [
      {
        "id": "c1",
        "label": "Uses a complete cost base",
        "guidance": "direct/variable costs plus allocated overhead.",
        "criticalDomainEvidence": []
      },
      {
        "id": "c2",
        "label": "Includes full practitioner time",
        "guidance": "not only hands-on treatment minutes.",
        "criticalDomainEvidence": []
      },
      {
        "id": "c3",
        "label": "Uses a deliberately chosen margin / understands margin vs. markup.",
        "guidance": "Uses a deliberately chosen margin / understands margin vs. markup.",
        "criticalDomainEvidence": []
      },
      {
        "id": "c4",
        "label": "Treats competitor pricing as context, not the formula.",
        "guidance": "Treats competitor pricing as context, not the formula.",
        "criticalDomainEvidence": []
      },
      {
        "id": "c5",
        "label": "Integrates service design/capacity/positioning/market fit before deciding.",
        "guidance": "Integrates service design/capacity/positioning/market fit before deciding.",
        "criticalDomainEvidence": []
      }
    ],
    "criticalFlags": [],
    "status": "approved"
  },
  {
    "id": "INT-08",
    "version": 1,
    "sourceModules": [
      11,
      1
    ],
    "sourceSection": "Module 11 authority matrix/research verification; Module 1 scope.",
    "competencies": [
      "AI authority by task",
      "verification"
    ],
    "criticalDomainEvidence": [],
    "primaryPrompt": "You’ve obviously used AI throughout this course with me, so let’s make this practical. What’s one part of your own practice where you’d be comfortable letting AI do a lot of the first-pass work? And what’s one area where you’d want the final decision to stay with you? Tell me why you see those differently.",
    "allowedFollowUp": true,
    "followUpPrompt": "Say the AI gives you a really convincing source or citation for something you want to tell a client. What happens before you actually use it?",
    "rubricCriteria": [
      {
        "id": "c1",
        "label": "Provides a realistic low-/moderate-authority AI use",
        "guidance": "drafting, organizing, brainstorming, etc.",
        "criticalDomainEvidence": []
      },
      {
        "id": "c2",
        "label": "Provides a realistic human-final-authority use",
        "guidance": "diagnosis/referral/safety/scope/client-facing professional judgment.",
        "criticalDomainEvidence": []
      },
      {
        "id": "c3",
        "label": "Explains the difference in terms of stakes/authority, not merely “AI can be wrong.”",
        "guidance": "Explains the difference in terms of stakes/authority, not merely “AI can be wrong.”",
        "criticalDomainEvidence": []
      },
      {
        "id": "c4",
        "label": "Demonstrates verification discipline for factual/research output.",
        "guidance": "Demonstrates verification discipline for factual/research output.",
        "criticalDomainEvidence": []
      },
      {
        "id": "c5",
        "label": "Maintains human ownership of what is ultimately communicated/used.",
        "guidance": "Maintains human ownership of what is ultimately communicated/used.",
        "criticalDomainEvidence": []
      }
    ],
    "criticalFlags": [],
    "status": "approved"
  },
  {
    "id": "INT-09",
    "version": 1,
    "sourceModules": [
      1,
      4,
      5,
      6,
      7
    ],
    "sourceSection": "Modules 1, 4, 5, 6, 7 approved safety/service-decision frameworks.",
    "competencies": [
      "Modify vs. stop/refer"
    ],
    "criticalDomainEvidence": [
      "D2",
      "D1"
    ],
    "primaryPrompt": "Imagine you have a client on the bed and the service is going well. What kinds of new information would make you change the plan — and what kinds of things would make you stop the scalp service altogether? How do you tell the difference?",
    "allowedFollowUp": true,
    "followUpPrompt": "What if it’s just mild tenderness, the skin is intact, and you’re not seeing anything else concerning? What would you do with that?",
    "rubricCriteria": [
      {
        "id": "c1",
        "label": "Can name legitimate modify signals",
        "guidance": "comfort, pressure, regional findings, product tolerance, changing preference, etc.",
        "criticalDomainEvidence": [
          "D2",
          "D1"
        ],
        "explicitUnsafeRule": {
          "description": "client comfort overriding a visible contraindication; continuing through a taught stop/refer finding; requiring pain before a visible finding is taken seriously."
        }
      },
      {
        "id": "c2",
        "label": "Can name legitimate stop/refer signals",
        "guidance": "broken/weeping/draining skin, marked concerning change, emergency symptoms, other taught do-not-proceed findings.",
        "criticalDomainEvidence": [
          "D2",
          "D1"
        ],
        "explicitUnsafeRule": {
          "description": "client comfort overriding a visible contraindication; continuing through a taught stop/refer finding; requiring pain before a visible finding is taken seriously."
        }
      },
      {
        "id": "c3",
        "label": "Does not reflexively refer every minor issue.",
        "guidance": "Does not reflexively refer every minor issue.",
        "criticalDomainEvidence": [
          "D2",
          "D1"
        ],
        "explicitUnsafeRule": {
          "description": "client comfort overriding a visible contraindication; continuing through a taught stop/refer finding; requiring pain before a visible finding is taken seriously."
        }
      },
      {
        "id": "c4",
        "label": "Does not “work around” true stop-and-refer findings because the client is comfortable.",
        "guidance": "Does not “work around” true stop-and-refer findings because the client is comfortable.",
        "criticalDomainEvidence": [
          "D2",
          "D1"
        ],
        "explicitUnsafeRule": {
          "description": "client comfort overriding a visible contraindication; continuing through a taught stop/refer finding; requiring pain before a visible finding is taken seriously."
        }
      },
      {
        "id": "c5",
        "label": "Explains the decision threshold in terms of actual findings/context rather than a rigid script.",
        "guidance": "Explains the decision threshold in terms of actual findings/context rather than a rigid script.",
        "criticalDomainEvidence": [
          "D2",
          "D1"
        ],
        "explicitUnsafeRule": {
          "description": "client comfort overriding a visible contraindication; continuing through a taught stop/refer finding; requiring pain before a visible finding is taken seriously."
        }
      }
    ],
    "criticalFlags": [
      {
        "description": "client comfort overriding a visible contraindication; continuing through a taught stop/refer finding; requiring pain before a visible finding is taken seriously.",
        "criticalDomainEvidence": [
          "D2",
          "D1"
        ]
      }
    ],
    "status": "approved"
  }
];

export function getProductionBanks() {
  return { knowledgeBank, caseBank, interviewBank, bankVersion, status: CONTENT_STATUS };
}

export function isBankReadyForProduction() {
  return (
    knowledgeBank.some((i) => i.status === 'approved') &&
    caseBank.some((i) => i.status === 'approved') &&
    interviewBank.some((i) => i.status === 'approved')
  );
}
