# AIMT Scalp Observation Lab — Instructional / Asset Specification
**Status:** PRE-PRODUCTION SPEC; not a live tool and not a medical image classifier
**Learning question:** "Can I learn to look at a scalp image without guessing or diagnosing?"
**Relationship to paid education:** Short, safe example of AIMT's Observe → Describe → Reason → Communicate model. It does not replicate the paid microscopy, service adaptation, condition-education or competency assessment.

## 1. Why this experience earns attention
The buyer is curious about using a scalp camera and is often exposed to videos of high-magnification images with immediate condition labels. AIMT's differentiator is teaching a disciplined observation process. The free exercise should be genuinely interesting—students notice details and learn how to describe them responsibly—while making the limitation of a single image clear.

Core principle: **An image can reveal visible features; it cannot, by itself, establish a medical diagnosis, cause or treatment plan.** Never label a particular red region, visible scale, sheen, hair width, density or visible surface feature as proof of a condition or hair-growth outcome.

**Audience:** licensed beauty pros, newer graduates and people exploring the field. Don't teach unlicensed learners to diagnose, prescribe or deliver treatment. Use scope-appropriate language throughout.

## 2. Free lab sequence (6–8 minutes; pilot)
| Moment | What student sees/hears | Learner action | Model feedback |
|---|---|---|---|
| 0. Opening | Original instructor clip: regular view versus magnified view of a **consented, correctly labeled** reference, filmed in consistent lighting. | Choose one feature that becomes easier to see. | Explain why magnification changes visibility but not the authority of a conclusion. |
| 1. Observe, don't name | Approved reference photo with visible region, hair shafts, and surface features. | Choose **descriptions** (location, visible color, distribution, surface appearance) without suggesting a diagnosis. | Directly explain which descriptions are supported by what is visible, and which claims require more information. |
| 2. What the image leaves out | Same subject (if permissioned), different magnification/lighting/parting. | Identify one missing context: symptoms, product history, image quality, professional scope or referral indicators. | Highlight how angle and lighting can change what seems prominent; do not interpret change as recovery or disease. |
| 3. Communication choice | Mock client asks, "Is that a condition? Am I losing my hair?" | Select an observation-first explanation; note that medical concern may require appropriate referral. | Contrast respectful uncertainty with unsafe diagnosis and empty reassurance. |
| 4. Takeaway | Example observation sentence and unverified questions. | Revise an original short sentence (ungrouped, non-graded). | Show a safe model response without using pseudo-AI scoring. |
| Exit | Invitation to explore actual accredited/earned AIMT learning inside Head Spa Certification. | Save/copy example answer and training priority. | No "ready to assess clients" certification-type language. |

## 3. How to make it visually valuable
Asset intake is the real bottleneck; don't fill the lab with generic synthetic clinical close-ups represented as authentic cases.

### Required reference set (minimum)
- A consented, accurately labeled **macro scalp view** and a corresponding magnified view, with known camera/model and reasonably repeatable lighting.
- A second magnified example that demonstrates the difference between **visible description** and a diagnostic conclusion, medically/scientifically reviewed.
- At least one matched pair with altered light/angle/parting to teach photographic limitations without suggesting before/after treatment results.
- Representation across varied **skin tones, hair densities and hair textures**; curly/coily hair, protective styles and locs require input from appropriate practitioners and consented imagery. Do not claim broad texture coverage from a single sample.
- Alt text and accessible **text-only equivalent** for every visual. No embedded text as the only teaching channel.

### For every asset record
```
asset_id:
original capture owner:
subject consent / usage scope:
location of permission record:
capture date (if known):
camera / magnification / light setup:
skin tone / hair characteristics (only if appropriately documented and consented):
visible features allowed to describe:
things the image CANNOT support:
expert/content review signoff:
licensing/usage expiration:
de-identification and metadata scrub:
last checked:
```
Don't reuse unverified representative course microscopy pictures as authenticated clinical records. Illustrations can be useful when visibly marked "educational illustration" and not scored as clinical evidence.

## 4. Scriptable exercise examples (text-only until imagery is approved)

### Scenario A — Surface observation
Instruction: "On an approved reference image, you notice visible light-colored material near several shafts. What do you know from the picture alone?"
- **Supported:** "There is visible light-colored surface material in this field of view."
- **Unsupported:** "This proves dandruff", "the follicles are clogged", or "I can prescribe the best treatment from this image."
- **Reasoning feedback:** An appearance is observable. Its cause and management require more information, professional limits and potentially medical evaluation.

### Scenario B — Lighting
Instruction: "Two views from the same subject use different illumination. One area appears redder. Can you claim inflammation increased?"
- **Supported:** "The apparent color differs between these images; lighting and capture conditions must be considered."
- **Unsupported:** A diagnosis or longitudinal change based on this uncontrolled pair.
- **Feedback:** A useful camera supports documentation only when comparisons are appropriately standardized and interpreted within scope.

### Scenario C — Texture and access
Instruction: "A client has locs or a protective style and the photographed field is small. What should change?"
- **Supported:** Get appropriate permission, ask about goals and comfort, acknowledge limits of what can be seen, and avoid pulling/dismantling styles merely to obtain a picture. Verify trained techniques and professional scope before any service plan.
- **Unsupported:** Claiming the scalp is healthy/unhealthy everywhere from a small field of view, or assuming one service method fits all hair types.

### Scenario D — Client conversation
Mock client: "Does this mean I have a scalp disease?"
- **Appropriate model:** "I can describe what is visible in this area, but a camera image alone isn't a medical diagnosis. If you're concerned about symptoms or changes, an appropriate licensed medical professional can evaluate them."
- **Inappropriate:** "You definitely have [condition]," "you don't need a dermatologist," or a guaranteed hair growth claim.

These are **content briefs**, not gradable cases, until a subject-matched and medically reviewed image set exists.

## 5. Personal scalp photo concept — separate future consent gate
The buyer's appealing idea is: "Photograph your own scalp, compare it with magnified imagery, and practice the difference between seeing and interpreting." Do **not** launch an upload endpoint or retain uploaded photos in AIMT's lead database as part of the free marketing tool. Scalp photos can contain sensitive health and identity information.

Possible low-risk **future** version after written review:
- On-device-only upload preview (no network transfer, server logging, third-party vision services or persistent image storage) or no upload at all; clear disclosure.
- Teach photo quality and observation, not automated diagnosis or hair loss classification.
- Strong opt-in and plain explanation of what is or is not saved; meaningful alternate sample-image path.
- Data minimization, EXIF/metadata controls, browser and mobile tests, clear delete path.
- Review by qualified privacy/legal and medical/scientific personnel before any personal-photo collection or image interpretation.
- If AI image analysis is ever considered, it requires a **separate approved consequential design and clinical safety review**; don't slip it into v1.

## 6. Teaching, grading, and conversion integrity
- No percentage diagnosis confidence, no "healthy scalp score," no medical label classifier.
- Every answer receives specific instructional feedback grounded in the displayed content; don't score illustrative visuals as if they were clinical cases.
- No rewarded clicks or earned certification.
- Preserve full professional curriculum and applied assessment for the paid course.
- Post-activity CTA: "Inside Head Spa Certification, learn observation methods, service planning, adaptation and client communication with deeper practice and assessment."
- The Scalp Lab stands on its own as a free discovery tool and can be a small cross-link inside Accelerator Lesson 4; do not duplicate an entire experience in both.

## 7. Release criteria
- [ ] Qualified source-image and consent intake with traceability.
- [ ] Accurate representation across hair textures and skin tones; no unsupported inclusivity claim.
- [ ] Author/editor review and external medical/scope review of claim wording.
- [ ] Functional visual comparison, mobile/keyboard/alt-text equivalent and actual feedback tested.
- [ ] Privacy analysis if any user image can enter a tool.
- [ ] No diagnostic outputs, automated treatment suggestions, unsupported assumptions about follicle or scalp conditions.
- [ ] Owner approves final lesson, usage rights and production release.

**Independent review is a gate, not something the prototype author can self-approve.**
