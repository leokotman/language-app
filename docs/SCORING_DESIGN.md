# Scoring system — design and research (lang-019)

Design doc for the scoring system: research summary, proposed rules, and implementation plan. Branch: `feat/lang-019-scoring-research`.

---

## Implementation plan (steps)

1. **Research (this step)** — Analyze learning/forgetting curve and spaced-repetition research; document scoring and notification patterns. ✅ Done below.
2. **Schema** — Add scoring table (e.g. `vocabulary_score`) linked to (user, vocabulary); direction from vocabulary; fields: score, last_exercise_at, practised_dates_count, learnt, etc. Migration + types.
3. **Constants** — Define research-based constants (intervals, “learnt” threshold, score formula, decay) in code and/or config.
4. **Study integration** — On each card outcome (per direction), update scoring table; keep “due” / “not learnt” filter aligned with FSRS + score.
5. **Progress page** — Stats by languages/words; score by pair in two dimensions (A→B, B→A); “last studied”, “learnt”, “needs review”.
6. **Notifications** — Use scoring table + dates: suggest pair and words (long since last study / low score); in-app first, push later if needed.

---

## 1. Research summary: learning curve, forgetting curve, and spacing

### 1.1 Ebbinghaus and the forgetting curve

- **Retention** depends on: (1) number of reviews, (2) temporal distribution of reviews, (3) time since last review.
- **Spacing** (spreading reviews over time) consistently beats **massing** (cramming). This is one of the most replicated effects in learning.

Sources: Ebbinghaus (1885); replications and meta-analyses (e.g. PMC4492928); “Spacing Effects in Learning: A Temporal Ridgeline of Optimal Retention” (Cepeda et al.).

### 1.2 Optimal review intervals

- There is a **“temporal ridgeline”** of optimal retention: intervals that are too short waste time; too long increase forgetting.
- **SuperMemo-style rule:** Schedule the next repetition when the **probability of recall drops to ~90%**. Typical progression for new material:
  - First repetition: **~2–3 days**
  - Second: **~1 week**
  - Then: several days → ~1 month → several months → years (intervals grow as stability increases).
- **FSRS** (which we already use via `ts-fsrs`): Same idea with stability/retrievability/difficulty. Example “Good” sequence: 1 d → 3 d → 8 d → 20 d. Desired retention often **85–90%**; higher retention ⇒ shorter intervals and more reviews.
- Intervals should be **adaptive** to item difficulty and user performance, not fixed for everyone.

Sources: SuperMemo FAQ (how-often-should-the-material-be-repeated); FSRS vs SM-2 guides; “Enhancing human learning via spaced repetition optimization” (PNAS 2019).

### 1.3 “Learnt” and consolidation

- There is no single universal “learnt” definition. Practical options:
  - **Stability-based:** Item has reached **Review** state and stability ≥ X days (e.g. survived an interval of 2–3 weeks or more).
  - **Retrieval-based:** N successful retrievals at spaced intervals (research: more successful retrievals ⇒ better long-term retention).
  - **Retrievability-based:** At the next due date, predicted retrievability is above a threshold (e.g. 90%).
- For our app we already have **FSRS state** (New, Learning, Review, Relearning). A reasonable **“learnt”** rule: **state = Review** and **stability ≥ 21 days** (or similar), i.e. the item has successfully passed at least one long interval. Alternative: **reps ≥ N** (e.g. 3–5) and state = Review.

Sources: “Fostering retention of word learning: number of training sessions children retrieve words positively relates to post-training retention” (Journal of Child Language); “Maintenance of Foreign Language Vocabulary and the Spacing Effect”; SuperMemo/FSRS docs.

### 1.4 Scoring (points) and psychology

- Research focuses on **when** to review and **retention**, not on a universal point system. So we should **derive** a score from behavior and SRS state rather than arbitrary +5/−50.
- Sensible components:
  - **Stability** (FSRS): higher ⇒ more consolidated.
  - **Retrievability** at now: higher ⇒ “in good shape” for this moment.
  - **Successful reps** (reps, minus lapses): more successful practice ⇒ stronger.
  - **Lapses:** fewer ⇒ better.
- **Proposal:** Score = composite of (stability, retrievability, reps, lapses), normalized to a 0–100 or similar scale for Progress/UI. No fixed “+5 per correct” — the **scheduling** (FSRS) already encodes correctness; score reflects **current strength** and practice history.

### 1.5 Decay after long inactivity

- **SuperMemo:** A long break does **not** reset progress. On return, the algorithm re-evaluates: if the user recalls well, the next interval stays long; if not, intervals shorten. So we **do not** need to artificially decay a “knowledge” score — FSRS already lowers retrievability over time and surfaces overdue cards.
- **Optional:** If we add a separate “streak” or “engagement” score (e.g. for gamification), that can decay or reset after inactivity; that’s independent of “word strength”.

### 1.6 Notifications

- **When to notify:** Align with **when review is due** (recall probability approaching ~90% threshold), not fixed calendar times.
- **Primary signal:** “You have N items due today” (we already have “due today” from FSRS). Notifications can surface this (e.g. “5 words need review”).
- **Re-engagement:** “You haven’t studied [language pair] for X days” — use **last_exercise_at** (or last_review) from the scoring table; suggest the pair with the longest gap or the most due/low-score items.
- **Avoid:** Sending reminders at the same time every day regardless of due dates; that doesn’t match the forgetting curve.

Sources: SuperMemo FAQ; “Assessing Notification Timing Strategies for Improved Micro-Learning Engagement” (IEEE); “Unbounded Human Learning: Optimal Scheduling for Spaced Repetition” (arXiv).

---

## 2. Proposed scoring and notification pattern

### 2.1 Scoring table (schema, to be implemented in step 2)

- **Grain:** One row per **(user_id, vocabulary_id)**. Direction is implied by `vocabulary` (language_from, language_to); no separate direction column needed unless we want denormalized pair keys for queries.
- **Fields (candidate):**
  - `score` — 0–100 (or similar) derived from stability, retrievability, reps, lapses.
  - `last_exercise_at` — last time this (user, vocabulary) was exercised in this direction.
  - `practised_dates_count` — number of distinct days the user practised this item (optional, for “practised N days” stats).
  - `learnt` — boolean; true when stability ≥ threshold and state = Review (or equivalent rule).
- **Derivation:** Updated at the end of each study session for each (user, vocabulary) exercised; we can compute score and learnt from current FSRS state + optional extra fields.

### 2.2 Score formulas (concrete options)

We have from FSRS (per card): **stability** S, **elapsed_days** t (since last review), **reps**, **lapses**, **state**. We need **retrievability** R and then combine into a 0–100 score.

**Computing retrievability R**

FSRS uses a power-law forgetting curve: recall probability drops as time passes since last review. The formula (FSRS wiki) is:

- \( R(t, S) = \bigl(1 + f \cdot \frac{t}{S}\bigr)^{-w} \)

where \( t \) = elapsed days, \( S \) = stability, and \( f \), \( w \) are algorithm parameters (chosen so that \( R \approx 0.9 \) when \( t = S \)). We can either:

- Use ts-fsrs parameters if the package exposes a helper to compute R, or
- Approximate with \( R = 0.9^{t/S} \) (so when elapsed = stability, R = 0.9; simple and no extra deps).

For **new/learning** cards (no last_review or state not Review), treat R from “how soon they’re due” or set R = 0.5 as a neutral value until they reach Review.

**Normalized components**

- **Stability (0–1):** `stability_norm = min(1, stability / STABILITY_CAP)`. e.g. `STABILITY_CAP = 365` so 1 year = “max” strength.
- **Retrievability (0–1):** R as above.
- **Reps (0–1):** `reps_norm = min(1, reps / REPS_CAP)`. e.g. `REPS_CAP = 15` — diminishing gain after many reviews.
- **Lapses:** use as a penalty; e.g. `lapse_penalty = min(0.3, lapses * 0.08)` so each lapse subtracts up to ~0.08 from the combined score factor.

**Formula A — Weighted average (simple, interpretable)**

\[
\text{score} = 100 \cdot \bigl(0.35 \cdot \text{stability_norm} + 0.40 \cdot R + 0.25 \cdot \text{reps_norm} - \text{lapse_penalty}\bigr),\quad \text{clamped to } [0, 100].
\]

- **Pros:** Clear meaning: ~40% “do you remember it right now?” (R), ~35% “how consolidated?” (stability), ~25% “how much practice?” (reps), lapses pull down.
- **Cons:** A card with very high stability but currently overdue (low R) can still get a medium score; that’s acceptable (we want to show “was strong, now needs review”).

**Formula B — Multiplicative “weak link” (stability × retrievability)**

\[
\text{strength} = \text{stability_norm} \times R;\qquad
\text{score} = 100 \cdot \text{strength} \cdot (1 - 0.05 \cdot \min(\text{lapses}, 6)) \cdot (1 + 0.02 \cdot \min(\text{reps}, 25)),\quad \text{clamped to } [0, 100].
\]

- **Pros:** If either stability or R is low, score is low; reflects “current strength” as a product. Lapses and reps modulate.
- **Cons:** New cards (low stability) stay low until they’ve been reviewed; might feel harsh.

**Formula C — Tiered (separate “learning” vs “learnt”)**

- If **state ≠ Review** or **stability &lt; STABILITY_LEARNT_DAYS**:  
  \( \text{score} = 50 \cdot R \cdot (1 + 0.2 \cdot \min(\text{reps}, 5)) - 5 \cdot \min(\text{lapses}, 4),\quad \text{clamped } [0, 50]. \)
- Else (graduated, “learnt” band):  
  \( \text{score} = 50 + 50 \cdot \min(1, \text{stability}/365) \cdot R - 5 \cdot \min(\text{lapses}, 4),\quad \text{clamped } [50, 100]. \)

- **Pros:** 0–50 = “still learning”, 50–100 = “learnt”; aligns with a clear “learnt” threshold and Progress UX (“X words learnt”).
- **Cons:** Slightly more logic (state + threshold check).

**Recommendation**

- **Default:** **Formula A** (weighted average). Easy to implement, tune (change weights/caps), and explain. Optionally cap score at 0 for “not yet studied” (no last_review).
- **Alternative:** **Formula C** if we want the UI to clearly separate “learning” (0–50) from “learnt” (50–100). Constants (STABILITY_CAP, REPS_CAP, lapse factor, weights) should live in one place (e.g. `src/lib/scoring.ts` or constants file) so we can adjust after launch.

**Chosen for this app:** **Formula C** (implemented in `src/lib/scoring.ts`). All formula options (A, B, C) remain in this doc for future alternatives.

### 2.3 Constants (step 3 — implemented)

- **Learnt threshold:** e.g. `STABILITY_LEARNT_DAYS = 21` (or 14); and state must be Review.
- **Score formula:** Implement Formula A (or C) with tunable constants: `STABILITY_CAP`, `REPS_CAP`, lapse penalty, weights; retrievability via \( R = 0.9^{t/S} \) or FSRS helper if available.
- **Decay:** No decay of “word score” after inactivity; FSRS handles scheduling. Optional streak/engagement decay later.
- **Notification:** Use “due today” count; “last studied” per pair; suggest pairs with longest gap or most due items.

### 2.4 Notifications (step 6)

- **In-app:** “You have N words due today”; “You haven’t studied [Pair] for X days — Y words could use review.”
- **Data:** Due count from existing FSRS “due today”; last study and score from new scoring table (and vocabulary for pair/language).

---

## 3. Implementation status

- **Steps 1–4 done:** Research, schema (009_vocabulary_score.sql), constants and Formula C (`src/lib/scoring.ts`), study integration (StudyPage updates score after each rating via `upsertVocabularyScore`).
- **Next:** Step 5 — Progress page (stats, score by pair); Step 6 — Notifications.

---

## References (short)

- Ebbinghaus, replications (e.g. PMC4492928).
- Cepeda et al., “Spacing Effects in Learning: A Temporal Ridgeline of Optimal Retention.”
- PNAS 2019, “Enhancing human learning via spaced repetition optimization.”
- SuperMemo FAQ: “How often should the material be repeated?”
- FSRS (open-spaced-repetition/fsrs4anki) wiki: The Algorithm, ABC of FSRS.
- Journal of Child Language: “Fostering retention of word learning…”
- IEEE: “Assessing Notification Timing Strategies for Improved Micro-Learning Engagement.”
- arXiv:1602.07032, “Unbounded Human Learning: Optimal Scheduling for Spaced Repetition.”
