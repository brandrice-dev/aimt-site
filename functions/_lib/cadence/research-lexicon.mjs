// Ask Cadence — Research Library retrieval vocabulary (SHADOW STAGE ONLY).
//
// Pure data + regexes, no I/O, no imports. Consumed only by
// research-context.mjs (itself unwired from live Ask Cadence). Everything
// the retrieval layer is allowed to search for is defined HERE, on the
// server: the student's words are matched against this vocabulary but
// are never themselves sent to the database.
//
//   RESEARCH_CONCEPTS  student phrasing -> controlled topics + synonym
//                      groups (the only search terms that reach the DB)
//   QUESTION_INTENTS   what kind of answer the student is asking for
//   CLAIM_FACETS       what kind of statement a claim makes
//   INTENT_FACETS      which claim facets can answer which intent
//
// Concept roles:
//   subject     the thing asked about (default)
//   treatment   a drug / device / active; claims about OTHER treatments
//               are off-question unless the student asked about treatment
//   population  a qualifier. HARD (pregnancy): a useful claim must match
//               it. SOFT (women): a claim must not be explicitly about a
//               conflicting population (men only); matching earns a bonus
//   outcome     context/outcome (hair loss, the follicle, a head-spa
//               setting): required alongside a single subject, never
//               enough on its own and never searched on its own

const concept = (id, patterns, topics, groups, role = 'subject', extra = {}) => Object.freeze({
  id, patterns, topics, groups, role, terms: [...new Set(groups.flat())], ...extra,
});

export const RESEARCH_CONCEPTS = Object.freeze([
  concept('scalp-pain',
    [/trichodyni/i, /dysesth/i, /paresthesi/i, /\bscalp (pain|tingl\w*|sore\w*|hurts?|ache\w*|tender\w*)/i,
      /\b(tingling|painful|sore|tender) scalp/i, /\bhair (hurts?|roots? hurts?|pain|is painful)/i, /\broots? (hurt|ache)/i,
      /painful to (the )?touch/i, /\bscalp\b.{0,20}\b(tender|sore|painful|sensitive|hurts?)\b/i, /\b(tender|sore)\b.{0,40}\b(touch|massag\w*)/i],
    ['scalp-health', 'adjacent-dermatology', 'trichology', 'telogen-effluvium'],
    [['trichodynia', 'dysesthesia', 'dysaesthesia', 'paresthesia', 'scalp pain', 'scalp dysesthesia'],
      ['trichodynia', 'dysesthesia', 'dysaesthesia', 'paresthesia', 'scalp pain', 'tender', 'tenderness', 'sore', 'soreness', 'painful', 'pain']]),
  concept('scalp-reactivity',
    [/contact (dermatitis|allerg\w*|sensitiv\w*)/i, /\ballerg\w*/i, /\birritat\w*/i, /sensiti[sz](er|ers|ation|ing|ed)\b/i,
      /sensitive (skin|scalp)/i, /patch test/i, /\breaction to\b/i, /\breact(s|ed|ing)? to\b/i, /\b(rash|hives|redness)\b/i, /\bsting\w*/i, /\bburn(s|ing)\b/i],
    ['cosmetic-ingredients', 'practitioner-safety', 'contraindications', 'surfactants', 'conditioning-agents', 'essential-oils-botanicals', 'adjacent-dermatology', 'scalp-health'],
    [['allergic', 'allergy', 'allergen', 'allergens', 'contact dermatitis', 'allergic contact dermatitis', 'sensitizer', 'sensitizers', 'sensitiser',
      'sensitization', 'sensitisation', 'HRIPT'],
      ['irritant', 'irritants', 'irritation', 'irritating', 'irritancy', 'irritant contact dermatitis', 'sting', 'stinging', 'burning'],
      ['allergic', 'allergy', 'allergen', 'allergens', 'contact dermatitis', 'allergic contact dermatitis', 'irritant contact dermatitis',
      'sensitizer', 'sensitizers', 'sensitiser', 'sensitization', 'sensitisation', 'HRIPT', 'irritant', 'irritants', 'irritation', 'irritating', 'irritancy',
      'sensitive skin', 'sensitive scalp', 'reaction', 'reactions', 'sting', 'stinging', 'burning']]),
  concept('scalp-itch', [/\bitch\w*/i, /prurit/i],
    ['scalp-health', 'dandruff', 'seborrheic-dermatitis', 'scalp-microbiome', 'psoriasis-scalp', 'adjacent-dermatology'],
    [['itch', 'itching', 'itchy', 'itchiness', 'pruritus', 'pruritic']]),
  concept('shedding',
    [/\bshed\w*/i, /telogen effluvium/i, /\beffluvium\b/i, /hair (is )?(falling|fall(s)?) out/i, /losing (a lot of |so much )?hair/i,
      /hair in the (drain|shower|brush)/i, /hair on (the|my|their|his|her) pillow/i, /more hair (in|on|coming|falling)/i,
      /\bhair\b.{0,60}\bafter (a |an |the )?(high )?(fever|illness|covid|surgery|birth|giving birth|childbirth)/i, /postpartum/i, /\bclumps?\b/i],
    ['telogen-effluvium', 'hair-cycle'],
    [['shedding', 'shed', 'effluvium', 'telogen effluvium', 'TE', 'telogen', 'hair fall']]),
  concept('hair-cycle',
    [/hair (growth )?cycle/i, /\banagen\b/i, /\bcatagen\b/i, /\btelogen\b/i, /\bexogen\b/i, /growth phase/i, /how (fast|long|quickly) (does )?hair grow/i],
    ['hair-cycle', 'hair-biology'],
    [['anagen'], ['catagen'], ['telogen'], ['exogen'],
      ['hair cycle', 'hair growth cycle', 'cycling', 'cycle', 'anagen', 'catagen', 'telogen', 'exogen', 'kenogen', 'growth phase']]),
  concept('follicle-biology', [/\bfollic(le|les|ular)\b/i, /dermal papilla/i, /stem cells?/i, /\bbulge\b/i],
    ['hair-biology', 'hair-cycle'],
    [['follicle', 'follicles', 'follicular'], ['papilla'], ['stem cell'], ['bulge']], 'outcome'),
  concept('dandruff-seb-derm', [/dandruff/i, /\bflak\w*/i, /seborrh/i, /malassezia/i, /\byeast\b/i],
    ['dandruff', 'seborrheic-dermatitis', 'scalp-microbiome'],
    [['dandruff', 'flaking', 'scaling', 'pityriasis capitis'], ['seborrheic', 'seborrhoeic', 'SD'], ['malassezia', 'yeast']]),
  concept('scalp-microbiome', [/microbiom/i, /\bbacteri\w*/i, /\bmicrob\w*/i, /\bflora\b/i, /cutibacterium/i, /dysbiosis/i],
    ['scalp-microbiome'],
    [['microbiome', 'microbiota', 'microbial', 'bacterial', 'bacteria', 'dysbiosis', 'flora'], ['cutibacterium'], ['staphylococcus']]),
  concept('psoriasis', [/psoria/i], ['psoriasis-scalp'], [['psoriasis', 'psoriatic']]),
  concept('folliculitis', [/folliculitis/i, /\bpustul\w*/i, /\bbumps? on (my |the |their )?scalp/i, /\bimpetigo\b/i, /\bboils?\b/i, /\bcrust\w*/i, /\booz\w*/i],
    ['folliculitis', 'infection-control', 'adjacent-dermatology'],
    [['folliculitis', 'pustule', 'pustular', 'pustules', 'boils', 'impetigo', 'crusty', 'crusted']]),
  concept('androgenetic-alopecia',
    [/androgen\w*/i, /pattern (hair loss|baldness)/i, /\bdht\b/i, /receding/i, /thinning (at|on) the (crown|top)/i, /miniaturi/i],
    ['androgenetic-alopecia'],
    [['androgenetic', 'AGA', 'FPHL', 'MPHL', 'pattern hair loss', 'male pattern', 'female pattern', 'miniaturization', 'miniaturisation', 'androgen'],
      ['DHT', 'dihydrotestosterone']]),
  concept('antiandrogens', [/finasteride/i, /dutasteride/i, /spironolactone/i, /antiandrogen/i, /5.?alpha.?reductase/i],
    ['androgenetic-alopecia', 'actives-other'],
    [['finasteride'], ['dutasteride'], ['spironolactone'], ['antiandrogen', 'antiandrogens']], 'treatment'),
  concept('alopecia-areata', [/alopecia areata/i, /\bpatchy (hair )?loss/i, /bald (spot|patch)\w*/i],
    ['alopecia-areata'], [['areata', 'AA']]),
  concept('minoxidil', [/minoxidil/i, /rogaine/i], ['actives-minoxidil'], [['minoxidil']], 'treatment'),
  concept('antifungals', [/ketoconazole/i, /antifungal/i, /pyrithione/i, /selenium sulfide/i, /ciclopirox/i, /medicated shampoo/i],
    ['dandruff', 'seborrheic-dermatitis', 'androgenetic-alopecia', 'actives-other'],
    [['ketoconazole'], ['antifungal', 'antifungals'], ['pyrithione', 'zinc pyrithione'], ['selenium sulfide'], ['ciclopirox']], 'treatment'),
  concept('healthy-comparison', [/\bhealthy\b/i, /normal scalps?\b/i, /\bnon-?dandruff\b/i, /\bunaffected\b/i],
    ['scalp-microbiome', 'scalp-health', 'dandruff'],
    /* HARD qualifier: "found on healthy scalps too?" needs evidence that
       actually speaks about healthy / control scalps. */
    [['healthy', 'control', 'controls', 'normal', 'non-lesional', 'unaffected', 'non-dandruff']], 'population'),
  concept('other-actives',
    [/caffeine/i, /saw palmetto/i, /pumpkin seed/i, /green tea/i, /ginseng/i, /\baloe\b/i, /salicylic/i, /panthenol/i, /adenosine/i, /melatonin/i, /castor oil/i, /coconut oil/i, /\bpeptides?\b/i, /exosomes?/i],
    ['actives-other', 'cosmetic-ingredients', 'essential-oils-botanicals'],
    [['caffeine'], ['saw palmetto'], ['pumpkin seed'], ['green tea'], ['ginseng'], ['aloe'], ['salicylic'], ['panthenol'], ['adenosine'], ['melatonin'], ['castor'], ['coconut'], ['peptide', 'peptides'], ['exosome', 'exosomes']], 'treatment'),
  concept('massage-circulation', [/massag\w*/i, /circulation/i, /blood flow/i, /scalp stimulat\w*/i],
    ['massage-circulation', 'treatment-modalities'],
    [['massage', 'massaging', 'massages'], ['circulation', 'blood flow', 'perfusion', 'microcirculation']]),
  concept('essential-oils', [/essential oils?/i, /rosemary/i, /tea tree/i, /peppermint/i, /menthol/i, /lavender/i, /botanical/i, /aromatherap/i, /scalp tonic/i],
    ['essential-oils-botanicals', 'cosmetic-ingredients', 'actives-other'],
    [['rosemary'], ['tea tree', 'melaleuca'], ['peppermint', 'menthol'], ['lavender'],
      ['essential oil', 'botanical', 'botanicals', 'plant oil', 'aromatherapy', 'rosemary', 'tea tree', 'melaleuca', 'peppermint', 'menthol', 'lavender', 'thyme', 'cedarwood', 'eucalyptus', 'fragrance']]),
  concept('surfactants', [/sulfate/i, /sulphate/i, /\bsl[e]?s\b/i, /surfactant/i, /\bclarifying\b/i, /\bcleanser/i, /glucoside/i],
    ['surfactants', 'cosmetic-ingredients'],
    [['sulfate', 'sulphate', 'SLS', 'SLES', 'lauryl sulfate', 'laureth sulfate', 'sodium lauryl', 'sodium laureth', 'ammonium lauryl'],
      ['surfactant', 'surfactants', 'glucoside', 'glucosides', 'cleanser', 'detergent']]),
  concept('conditioning-agents', [/silicone/i, /dimethicone/i, /conditioning agent/i, /\bconditioners?\b/i],
    ['conditioning-agents'],
    [['dimethicone', 'silicone', 'silicones', 'methicone', 'siloxane', 'trimethicone'], ['conditioning', 'cationic', 'polyquaternium', 'behentrimonium', 'cetrimonium', 'quaternary']]),
  concept('infection-control',
    [/disinfect\w*/i, /sanitiz\w*/i, /sterili[sz]\w*/i, /\bhygiene\b/i, /cross.?contaminat\w*/i, /clean(ing)? (my |the )?(tools|combs|brushes|equipment)/i,
      /\b(combs?|brushes|tools)\b.{0,40}\b(clean|disinfect|between)/i, /shared (tools|combs|brushes|equipment|towels)/i, /\bspread\b/i, /\btransmi\w*/i],
    ['infection-control', 'practitioner-safety'],
    [['disinfect', 'disinfection', 'disinfectant', 'disinfected', 'sterilization', 'sterilize', 'sterilise', 'sanitize', 'sanitizing', 'reprocess', 'reprocessed'],
      ['clean', 'cleaned', 'cleaning'],
      ['tools', 'tool', 'instruments', 'instrument', 'equipment', 'combs', 'comb', 'brushes', 'brush', 'implements', 'razors'],
      ['hygiene'], ['contaminated', 'contamination', 'blood'], ['transmission', 'transmitted', 'spread', 'cross-contamination', 'shared']]),
  concept('contraindications',
    [/contraindicat\w*/i, /blood thinner/i, /anticoagul/i, /chemotherapy|\bchemo\b/i, /open (wound|sore)/i, /recent surgery/i],
    ['contraindications', 'practitioner-safety'],
    [['contraindicated', 'contraindication', 'contraindications'], ['anticoagulant', 'anticoagulation', 'blood thinner', 'warfarin', 'bleeding'], ['chemotherapy', 'chemotherapy-induced']]),
  concept('pregnancy', [/pregnan\w*/i, /breastfeed\w*/i, /postpartum/i, /(giving|gave) birth/i, /childbirth/i, /lactat\w*/i],
    ['contraindications', 'practitioner-safety', 'telogen-effluvium'],
    [['pregnancy', 'pregnant', 'postpartum', 'lactation', 'breastfeeding', 'breastfed', 'childbirth', 'birth']], 'population'),
  concept('women', [/\b(women|woman|female|females)\b/i],
    ['androgenetic-alopecia', 'telogen-effluvium', 'trichology'],
    [['women', 'woman', 'female', 'females', 'FPHL']], 'population',
    /* SOFT qualifier: a claim need not say "women" (most findings are not
       sex-specific), but a claim explicitly about men only is off-question. */
    { soft: true, conflicts: /\b(men|male|males|MPHL)\b/i, confirms: /\b(women|woman|female|females|FPHL)\b/i }),
  concept('procedures-devices', [/\bprp\b/i, /platelet/i, /microneedl\w*/i, /\blasers?\b/i, /\blllt\b/i, /\b(red|led) light/i, /photobiomodulation/i, /low.level (laser|light)/i],
    ['treatment-modalities'],
    [['PRP', 'platelet', 'platelet-rich'], ['microneedling', 'microneedle', 'dermaroller'], ['laser', 'LLLT', 'photobiomodulation', 'low-level', 'red light', 'LED']], 'treatment'),
  concept('nutrition-stress',
    [/\bstress\w*/i, /\biron\b/i, /ferritin/i, /an(a)?emi/i, /vitamin/i, /biotin/i, /nutrition\w*/i, /supplement\w*/i, /\bdiet\b/i, /\bzinc\b(?! pyrithione)/i],
    ['telogen-effluvium', 'hair-biology', 'actives-other'],
    [['stress', 'stressor', 'stressors', 'stressful'], ['iron', 'ferritin', 'iron deficiency', 'anemia', 'anaemia'], ['vitamin d', 'VDD', 'vitamin'],
      ['biotin'], ['zinc'], ['nutritional', 'supplement', 'supplements', 'supplementation', 'diet', 'protein', 'nutrient']]),
  concept('sebum', [/\bsebum\b/i, /sebaceous/i, /oily scalp/i, /greasy/i, /oil production/i],
    ['scalp-health', 'seborrheic-dermatitis'], [['sebum', 'sebaceous']]),
  concept('tinea', [/\btinea\b/i, /ringworm/i, /fungal infection/i],
    ['infection-control', 'adjacent-dermatology'], [['tinea', 'dermatophyte', 'capitis']]),
  concept('traction', [/\btraction\b/i, /tight (braids|ponytails?|hairstyles?|buns?)/i, /\bextensions\b/i, /\bponytails?\b/i, /\bbraids?\b/i, /\bweaves?\b/i],
    ['trichology', 'adjacent-dermatology'],
    [['traction', 'tight hairstyle', 'tight hairstyles', 'ponytail', 'ponytails', 'braids', 'braid', 'extensions', 'hair extensions', 'weaves', 'tension']]),
  concept('scalp-barrier', [/skin barrier|scalp barrier/i, /\btewl\b/i, /transepidermal/i],
    ['scalp-health'], [['barrier'], ['TEWL', 'transepidermal']]),
  concept('hair-outcome',
    [/hair loss/i, /\balopecia\b/i, /hair growth/i, /\bregrow\w*/i, /thinning/i, /thin(ner)? hair/i, /hair count/i, /hair density/i, /\bthick(er|ness)\b/i, /losing hair/i, /\bbalding\b/i, /grow (hair|back)/i],
    ['androgenetic-alopecia', 'telogen-effluvium', 'trichology', 'treatment-modalities'],
    [['hair loss', 'alopecia', 'hair growth', 'growth', 'regrowth', 'regrow', 'regrowing', 'hair count', 'density', 'thickness', 'thinning', 'hair thinning',
      'shedding', 'effluvium', 'telogen effluvium', 'TE', 'AGA', 'FPHL', 'hair fall']], 'outcome',
    /* A claim tagged with one of these governed topics is ABOUT a hair-loss
       outcome even when its sentence doesn't restate it ("seventeen
       interventions were not recommended by the panel ..."). */
    { outcomeTopics: ['androgenetic-alopecia', 'telogen-effluvium', 'alopecia-areata'] }),
  /* Practitioner / service context ("head spa", "salon"). Outcome role:
     when the student asks about ONE condition in a service setting, a
     useful claim must speak to that setting, not only the condition. */
  concept('service-context',
    [/head ?spa/i, /\bsalon\b/i, /\bspa (service|treatment)s?\b/i, /scalp treatment/i, /\bpractitioners?\b/i, /cosmetolog/i, /hairdress/i],
    ['practitioner-safety', 'infection-control', 'contraindications', 'massage-circulation'],
    [['head spa', 'spa', 'salon', 'practitioner', 'practitioners', 'cosmetology', 'hairdresser', 'hairdressing', 'personal service', 'personal services',
      'massage', 'friction', 'trauma', 'koebner', 'scalp treatment']], 'outcome'),
]);

/* What kind of answer the question asks for. */
export const QUESTION_INTENTS = Object.freeze([
  ['comparison', /\b(compared?|comparison|versus|vs\.?|better than|as effective as|more effective|than plain|than (other|gentler))\b/i],
  ['distinction', /\b(differ(s|ence|ent)?( from| between)?|distinguish\w*|tell (them|the two) apart|same (thing|as))\b/i],
  ['seriousness', /\b(is (it|this|that) serious|how serious|serious\b|should (they|i|she|he) (see|be referred|refer)|see a (doctor|dermatologist)|dangerous|emergency)\b/i],
  ['parameter', /\bhow many (\w+ )?(sessions|treatments|times|drops|minutes|applications|visits)\b|\bhow often (should|do|must|can) (i|you|we)\b|\bhow often (i|you|we) (should|need|must)\b|\bwhat (dose|dosage|concentration|strength|percentage|amount)\b|\bhow much .{0,20}(should|to use|to apply)\b|\bat (what|which) concentration/i],
  ['efficacy', /\b(work(s|ed)?|effective(ness)?|efficacy|helps?(?! me| you)|improv\w*|regrow\w*|grow(s|th)?|benefit\w*|reduc\w*|cure|fix|evidence (for|that)|studies (show|showing))\b/i],
  ['safety', /\b(safe(ly|ty)?|risks?|risky|harm\w*|bad for|side effects?|adverse|irritat\w*|allerg\w*|react\w*|sensitiz\w*|toxic\w*|contraindicat\w*|avoid|dangerous|okay to|ok to|sting\w*|burn\w*)\b/i],
  ['cause', /\b(why|caus\w*|lead(s)? to|connected|linked|link|associated|association|contribut\w*|trigger\w*|mechanism\w*|what happens|is it (because|due)|going on)\b|\bhow (does|do|are|is) .{0,50}\b(affect|work|change|connected|related)\b/i],
  ['reversibility', /\b(revers\w*|permanent\w*|go away|recover\w*|grow back)\b/i],
  ['skeptical', /\b(no benefit|doesn'?t work|don'?t work|not work|weak|myth|some studies say|overhyped|really (work|help|grow))\b/i],
  ['recurrence', /\b(come(s)? back|coming back|recur\w*|relaps\w*|return(s)? after)\b/i],
  ['practice', /\b(should (i|we|clients|they|she|he)|can (i|we)|how (should|often)|protocol|disinfect\w*|clean\w*|between clients|sessions?|what disinfectant|checked|tested)\b/i],
  ['prevalence', /\b(normal|how much|how common|how long|typical(ly)?|last|per day|daily|prevalen\w*|how many)\b/i],
  ['treatment', /\b(what should (she|he|they|i) (take|use)|treat(ment|ed|s)?|medication|medicine|prescri\w*|antibiotics?)\b/i],
]);

/* What kind of statement a claim makes (text + claim_type + direction). */
export const CLAIM_FACETS = Object.freeze([
  ['efficacy', /\b(improv\w*|increas\w*|decreas\w*|effective\w*|efficac\w*|significant\w*|regrowth|regrow\w*|hair counts?|density|thickness|respon\w*|remission|clearance|superior|comparable|outperform\w*|reduc\w*|benefit\w*|stabiliz\w*|promot\w*|growth|ranked)\b/i,
    { directions: ['supports_effect', 'no_effect'] }],
  ['null', /\b(not (statistically )?significant\w*|no significant|no difference|did not|not differ\w*|no effect|insufficient|inconsistent|low[- ]quality|limited evidence|var(y|ied|ies)|heterogene\w*|uncertain\w*|unclear|not recommended)\b/i,
    { directions: ['no_effect', 'unclear', 'limitation'], claimTypes: ['limitation'] }],
  ['safety', /\b(safe\w*|irritant\w*|irritat\w*|sensiti[sz]\w*|allerg\w*|adverse|side effects?|toxic\w*|contraindicat\w*|tolera\w*|hypertrichosis|edema|risks?|harm\w*|avoid\w*|caution\w*|hazard\w*)\b|contact dermatitis/i,
    { directions: ['precaution', 'safety'], claimTypes: ['safety_conclusion'] }],
  ['mechanism', /\b(caus\w*|mechanism\w*|pathogen\w*|etiolog\w*|aetiolog\w*|associat\w*|linked|contribut\w*|trigger\w*|dysbiosis|due to|result\w* (in|from)|lead\w* to|shift\w*|induc\w*|correlat\w*|role (of|in)|driv(e|es|en|ing)|factors? (promot\w*|associat\w*|contribut\w*)|mediat\w*|because|immune privilege|collaps\w*|lower serum|deficien\w*|multifactorial|triad|susceptib\w*|imbalance|overgrowth|transition|apoptosis|regression|quiescen\w*|miniaturi\w*|shorten\w*|after (stressors?|a trigger))\b/i,
    { directions: ['association'] }],
  ['recurrence', /\b(recur\w*|relaps\w*|maintenance|remission|return\w*|come back)\b/i],
  ['recommendation', /\b(recommend\w*|consensus|first.line|endors\w*|promising|support(s|ed)? (the )?use|considered (for|as)|adjunctive|alternative therapy)\b/i,
    { claimTypes: ['recommendation'] }],
  ['practice', /\b(must|should|recommend\w*|clean\w*|disinfect\w*|steriliz\w*|protocols?|sessions?|intervals?|every|each client|guidelines?|advised|requir\w*|practices?|determined|checked|measured|screen\w*)\b/i,
    { claimTypes: ['recommendation'] }],
  ['prevalence', /\b(prevalen\w*|incidence|normal(ly)?|typical\w*|per day|daily|duration|at a given time|last(s|ing)?|diagnosed|common(ly)?)\b|~\s?\d+\s?(days?|weeks?|months?|years?)|\(\s?~?\d+\s?(days?|weeks?|months?|years?)|\d+(\.\d+)?\s?%\s+(of|had|were|with|in)\b/i],
  ['characterization', /\b(defin\w*|characteri[sz]\w*|classif\w*|spectrum|continuum|distinguish\w*|differentiat\w*|marked by|presents? (with|as)|presentations?|features?|mimic\w*|misdiagnos\w*|scarring|non-?scarring)\b/i],
  ['parameter', /\b\d+\s?(sessions?|treatments?|injections?|mg|ml|ppm)\b|\bsessions?\b|\bintervals?\b|\bevery \d|\b(once|twice) (daily|weekly|monthly|a)\b|\bconcentrations?\b|\bdos(e|es|age|ing)\b|\bup to (a maximum of )?\d|\bmaximum concentration\b|\b(each|every) (client|use|service)\b|\bbetween (clients|uses)\b|\bafter (each|every)\b/i],
]);

export const INTENT_FACETS = Object.freeze({
  efficacy: ['efficacy', 'null', 'recommendation'],
  comparison: ['efficacy', 'null'],
  distinction: ['characterization', 'mechanism', 'prevalence'],
  seriousness: ['characterization', 'safety', 'mechanism', 'practice'],
  parameter: ['parameter'],
  safety: ['safety'],
  // "How does X affect Y" / "does X cause Y" is answered by mechanism AND
  // by effect/association findings (including null ones).
  cause: ['mechanism', 'efficacy', 'null'],
  recurrence: ['recurrence'],
  reversibility: ['efficacy', 'null', 'recurrence'],
  practice: ['practice', 'safety', 'mechanism'],
  prevalence: ['prevalence'],
  treatment: ['efficacy', 'null', 'practice', 'recommendation'],
  skeptical: ['efficacy', 'null'],
});

/* Intents that name the crux of the question: when present, a claim MUST
   make that kind of statement (not merely any allowed one). */
export const CRUX_INTENTS = Object.freeze(['recurrence', 'parameter']);

/* Claims that only describe study design / scope, with no finding. */
export const RE_METHODS_DESIGN = /\b(randomi[sz]ed to|were randomi[sz]ed|were included|included \d|\d[\d,]* (studies|rcts|trials|patients|participants|cases)\b.{0,40}\b(included|met|comprising)|met inclusion|comprising|search results|ingredients covered|covered include|approaches surveyed|surveyed include|is proposed|working group issues|report reopened|panel assessed|the network included|produced \d+ statements|compared .{0,80}\bversus\b|assessing (topical|oral|interventions|treatments))/i;
export const RE_METHODS_OUTCOME = /\b(improv|increas|decreas|reduc|significant|effective|efficac|safe|conclud|found|show|associated|higher|lower|superior|comparable|no difference|not |recommend|caus|linked)\w*/i;

/* Scope/administrative statements about a document or panel, not
   findings -- never answer a student's question on their own. */
export const RE_SCOPE_ONLY = /\b(working group issues|is proposed covering|provides a (structured )?framework|the opinion is not applicable|this (amended )?report (reopens|revises)|guidance applies to|industry-sponsored)\b/i;

/* Specific medical/drug treatment content: off-question for practitioner,
   cause or safety questions that did not ask about that treatment. */
export const RE_DRUG_TREATMENT = /\b(corticosteroid\w*|steroids?|calcipot\w*|betamethasone|clobetasol|hydrocortisone|biologic\w*|apremilast|deucravacitinib|roflumilast|jak inhibitors?|janus kinase|baricitinib|tofacitinib|ritlecitinib|dupilumab|il-17|isotretinoin|dutasteride|finasteride|spironolactone|antibiotic\w*|oral minoxidil|intralesional|medications|small.molecule|systemic (agents?|therap\w*)|5-?aris?)\b/i;

/* Controlled-trial arm language: the claim is about SOME intervention's
   effects or adverse events versus control. */
export const RE_TRIAL_ARM = /\b(versus (control|placebo|vehicle|sham)|vs\.? (placebo|vehicle|control)|placebo|adverse (effects|events) were)\b/i;

/* Claims that merely enumerate many interventions/topics. */
export const RE_ENUMERATION = /\b(include|including|such as|surveyed|across|spanning|covering)\b/i;

/* "besides X" / "other than X": X is context the student wants to look
   past, not a required focus. Tested against the text just before X. */
export const RE_EXCLUSION_CUE = /\b(besides|other than|apart from|except( for)?|aside from|excluding|not counting)\s*$/i;

/* Words joining alternatives ("ketoconazole or antifungal shampoo"). */
export const ALTERNATIVE_JOINERS = Object.freeze(['or', 'and/or']);
