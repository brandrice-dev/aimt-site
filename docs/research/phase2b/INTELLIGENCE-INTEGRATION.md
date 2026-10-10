# AIMT intelligence integration preparation

October 9, 2026. Integration specification only. Phase 2A creates no agent, database, content pipeline, scheduled workflow, model call, analytics event or public content.

## Existing architecture and intended flow

Scientific Intelligence + Professional Demand + Consumer Demand + Innovation Intelligence → Opportunity Engine → Education Products remains the organizing flow. Scientific evidence determines what AIMT can substantiate and teach; professional and consumer demand remain separately labeled observations; innovation suggests investigations and product possibilities. An opportunity is a proposal, not scientific authorization or permission to publish a curriculum.

Reuse the research packet adapter/importer and governed publication pipeline for evidence, the existing publication concept registry and topic selector for concept/route compatibility, and AIMT growth measurement for attributable visits, readiness interactions, checkout and enrollment. The repository does not establish a completed general Opportunity Engine; the Phase 1.5 opportunity contract is a future integration design, not an already deployed agent to duplicate.

Creative Intelligence is a separate content-performance input. Expand the existing Packaging Mechanics role's responsibilities and review output. Do not create a competing creative agent or a second production content workflow. Resolve the actual Packaging Mechanics configuration and its current output destination with the owner before wiring the extension; no separate deployed configuration was established by this isolated repository work.

## Packaging Mechanics output contract

Use the existing role's review packet/artifact, with versioned fields for the following outputs. These are proposed fields, not a new table or activated runtime contract.

| Output | Required evidence and result |
| --- | --- |
| Creator-relative outliers | Creator/platform/content identity and authorized source link, observation date, publication age, format, geography/audience when known, organic versus paid status, sample size and comparable creator baseline. Rank relative to that creator's matched historical median/distribution, record ratio and percentile, and keep small samples/unknown denominators explicit. Absolute views alone do not establish an outlier. |
| First three seconds | Time-coded observations from 0–3 seconds: first frame, spoken/on-screen opening, subject/problem, curiosity/promise, motion/visual clarity and audience relevance. Use actual accessible media/transcript; mark audio/visual data unavailable rather than inventing it. A compelling hook does not establish scientific truth. |
| Top 20 Hook Bank | Up to 20 distinct, evidence-backed hook mechanisms, with source observation references, creator-relative performance context, topic/audience/format, scope/risk notes, refresh date and confidence. Deduplicate mechanism variants; retain fewer than 20 when data are insufficient. Review existing entries rather than maintaining another bank elsewhere. |
| Original AIMT adaptation | New AIMT wording and visual premise, intended audience/learning goal, source mechanism reference, exact approved scientific dependency or explicit non-scientific framing, and review status. No copied creator script, invented result, overstated clinical benefit or unreviewed scientific claim. |
| Performance attribution | AIMT creative ID/version, hook mechanism reference, publication/campaign/channel/date, observed platform metrics and definitions, corresponding aggregate funnel metrics, attribution window/model and limitations. Track failed/inconclusive adaptations as well as successes. |

A proposed first outlier baseline uses the creator's comparable recent posts, matched on platform, format and observation age. Choose a window, minimum sample and alert threshold with the operator before evaluation, then freeze them for that evaluation. Treat ratios/percentiles as observational; paid boosts, different audiences, seasonality and missing analytics limit comparisons. Do not mix creator performance with AIMT conversion or infer causation from one viral post.

## Existing analytics integration points

`assets/js/aimt-growth.js` and `functions/api/growth/collect.js` collect the allowed browser events; `functions/_lib/growth/record.mjs` records server events; `taxonomy.mjs` controls accepted events and sanitization; `report.mjs` derives aggregate funnel and creative attribution. Reuse these boundaries. Browser data cannot assert a paid purchase.

The current creative convention is `format_topic_hook_vN` in `utm_content`, parsed by `parseCreativeId()` and grouped by existing creative attribution. For example, `reel_hair-cycle_cycle-myth_v1` can connect an authorized original adaptation to existing visit, readiness, checkout and paid-enrollment reporting. The hook segment identifies the reviewed mechanism and the version identifies the AIMT adaptation. Resolve it against the existing Packaging Mechanics review artifact, without inserting arbitrary free-text metadata into student or payment records.

The stored-event taxonomy is closed. Do not insert new hook/impression/view events into `growth_events` during this package. Platform retention, three-second view rate and creator baseline metrics remain separate licensed/authorized observations attached to the existing role's output. They can be joined with aggregate AIMT creative reports during a later approved analytics extension. Metric definition, denominator, content ID, date range, platform and missing data must accompany every observation. Keep staff/test/manual access separate from paid demand, using existing classification rules.

## Opportunity and education integration points

Attach Creative Intelligence observations to the future Phase 1.5 opportunity object as `creative_signal_refs`, alongside separate scientific revision/evidence references, professional demand observations, consumer demand observations and innovation observations. Include source/time, audience, confidence, missing data, cost assumptions, proposed product/lesson and review requirements. Do not promote engagement into evidence quality or substitute consumer interest for professional competency need.

Reuse `education-publication-registry.mjs` and `education-topic-selector.mjs` for compatible publication concepts and existing search-opportunity heuristics. A later opportunity integration can add a bounded, auditable prioritization input after owner review; it must retain risk, readiness, route/cannibalization, weekly limits and current scientific/publication gates. High creative performance cannot bypass a failed scientific check or R04/R05 review.

Packaging Mechanics adapts the presentation of an approved educational proposal. The existing writer/reviewer, candidate bundle and release process retain their responsibilities. Education product development can use measured demand and performance to select format, opening and distribution, while substantive curriculum and certification standards stay with the current authorized reviewers. Experimental Cadence research integration remains inactive.

## Review prerequisites

Confirm the existing role/configuration and output ownership; obtain authorized creator/platform observations and AIMT aggregate analytics; approve a reproducible creator-relative baseline and performance attribution window; review original adaptation rights and scientific dependencies; and validate join accuracy using synthetic creative IDs. Then authorize a small integration into the existing analytics/opportunity structure. No outreach, paid data, scraping workflow, content publication or new recurring task is implied by this specification.
