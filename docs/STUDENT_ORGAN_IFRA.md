# Student Organ: weight calculation and CW IFRA screening

Entry: `/student-tools/` → `/organ/`. The course iframe also uses `/organ/`.

## Dataset

- Exactly 80 original CW KPIA / Perfumery Atlas bases (IDs 1001–1080).
- Category 4, 9 and 10B values copied from MyOrgan `safety-data.js` at commit
  `bef316cd4b4c3cca452893b21d170eb45521e0ad` (original review: September 2026).
- Preserve nulls and document statuses. Null means unknown, never unrestricted.
- Jasmine (1014) and Iris (1071) require limit review; Tuberose (1015), Rose de Mai
  (1017), White Amber (1065) lack MSDS; 1074 lacks Cat.10B numeric data.
- Product names and IDs must match. CW products are mixtures, not the similarly
  named pure substances or essential oils. Students add their own monomers.
- Manually entered limits require a source, category and matching `51st` amendment.
  Their results remain marked for teacher review. Known exceedances and explicit
  prohibitions take precedence over missing-document warnings.

## Calculation contract

Every percentage is in percent points: `1`, `1%`, `1％` = 1%; `0.1` = 0.1%.
Blank, malformed, negative and >100 concentrations are invalid. No inferred fractions.

For row i, trial stock mass is entered g, or mL × measured density (g/mL), or
drops × measured mass/drop (g/drop). Density/mass per drop describes the *diluted
stock being used*. There is no default drop conversion or assumed density.

- Original material mass = trial stock mass × dilution concentration / 100.
- Formula share = original material mass / total original material mass × 100.
- Target original material mass = final product mass × target concentration / 100.
- Row original material to weigh = target original mass × formula share / 100.
- Row stock to weigh = row original material mass / dilution fraction.
- Additional base = final product mass − total row stock to weigh.
- Finished material % w/w = row original mass / final product mass × 100.

"Original material" means the supplier's as-sold product (including any solvent
already present in that commercial base). An undiluted CW base is entered as 100%;
this does not claim chemical purity. The target concentration excludes only the
student's *additional* stock dilution solvent. Trial weights define relative
proportions; the target weights are a scaled recipe, not an assay of an existing bottle.

Missing conversions block calculation. Mixed units work only when every stock can
be converted to mass. A negative additional base makes the recipe infeasible and
blocks affirmative screening. No weight rounding occurs before checks or exports.

All rows with the same CW ID are aggregated before comparing limits. Monomers
with the same CAS are aggregated across custom IDs, using the lowest known limit.
80% of the limit gives a near-limit warning; >100% fails. Zero limit means prohibited.

## Scope of a result

The tool screens each original material against the stored supplier limit for the
selected category. Different commercial bases can contain the same restricted
constituent. Their combined contributions cannot be determined without composition
data, so the interface never claims full IFRA certification of a blend. It explicitly
retains this review requirement even when every row is under its stored limit.

Primary references:

- https://ifrafragrance.org/understanding-standards
- https://ifrafragrance.org/transparency-list/about-the-ifra-transparency-list
- https://github.com/h-s017/myorgan/blob/bef316cd4b4c3cca452893b21d170eb45521e0ad/safety-data.js

## Persistence and verification

Existing local-storage keys and legacy row concentrations are preserved. Empty new
rows use 100%. Export schema v2 retains raw rows, product category, conversion
factors, per-formula recomputed results, and custom material definitions. Imported
custom ID conflicts are remapped; CW identities cannot be overwritten by imports.

The service worker updates the versioned calculation assets together, removes only
its own obsolete caches, and does not serve HTML in place of a missing script.

Run `npm test`; mathematical and provenance regressions live in
`tests/organ-formula.test.cjs`.
