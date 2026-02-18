# Speech & pronunciation plan

**Current state (post lang-014):** We have **listening (TTS) only**: the app plays the word via the browser Web Speech API and the user picks the correct translation. There is **no recording** and **no comparison** of user audio to a reference.

---

## 1) Should we implement listening + recording?

**Yes.** That’s the natural next step and matches TECH_EVALUATION Phase 4 (pronunciation practice).

- **Recording:** Use browser APIs only: `getUserMedia()` + `MediaRecorder` to capture the user’s microphone. No backend required for capture; we get a blob (e.g. `audio/webm` or `audio/mp4`).
- **Flow options:**
  - **Option A — “Say the word” (speaking exercise):** Show/play the word → user records themselves saying it → we compare (see below) → show correct/wrong + rating.
  - **Option B — Keep current “Listening” as-is:** Hear word → pick translation (no recording). Add a **separate** exercise type “Pronunciation” or “Speaking”: hear/see word → record → compare.

Recommendation: add **recording** and use it for a **speaking/pronunciation** path (Option B keeps listening simple; pronunciation becomes its own exercise with record + compare).

---

## 2) How to compare user audio vs reference?

Two main approaches:

### A) Speech-to-text (STT) comparison

- **Idea:** Send the user’s recording to an STT API (e.g. Whisper, Google Cloud Speech-to-Text). Get a transcript. Compare transcript (normalized) to the expected word (e.g. `"walk"`).
- **Pros:** Answers “Did they say the right word?”; well-understood; many APIs (OpenAI Whisper, Google, Azure).
- **Cons:** Does **not** measure pronunciation quality (e.g. heavy accent might still transcribe as “walk”). No “how close” or fluency score.

**Good for:** Binary correct/wrong (“did you say the right word?”).

### B) Pronunciation assessment APIs

- **Idea:** Use an API that returns **pronunciation scores** (accuracy, fluency, completeness) and optionally word-level feedback.
- **Examples:**
  - **Azure Speech Services** — [Pronunciation Assessment](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment): reference text + user audio → score + per-word feedback. Supports en, ru, and others.
  - **Google Cloud** — Speech-to-Text can return confidence; for full pronunciation assessment you’d need to check current product (e.g. Duplex-style or education APIs if available).
- **Pros:** Real pronunciation/fluency feedback; better for learning.
- **Cons:** Typically paid; need API key and (for Azure) a small backend or proxy to keep the key secret.

**Good for:** “Say the word” with quality feedback (pronunciation practice).

### Free tier / cost (pronunciation assessment)

| Option | Free tier? | Notes |
|--------|-----------|--------|
| **Azure Speech (pronunciation assessment)** | **Yes — F0 tier:** 5 free audio hours/month for Speech-to-Text; pronunciation assessment uses the same STT billing, so it’s included in that 5 hours. After that, paid. |
| **Google Cloud Speech-to-Text** | 60 free minutes/month for STT; no dedicated pronunciation assessment in the API. |
| **OpenAI Whisper API** | No free tier; pay per minute. |
| **thefluent.me, SpeechSuper, Language Confidence** | Free **trials** only (e.g. 7 days, or “test for free”); no ongoing free tier. |
| **Browser SpeechRecognition** | Free, client-side; STT only (no pronunciation score). Good for “correct word?” comparison. |

**Conclusion:** Pronunciation assessment *can* be done on a free tier only with **Azure F0** (5 hours/month). To keep the app free-tier-only and avoid adding Azure (or hitting the 5‑hour limit), we **omit the pronunciation-assessment step** and stick to: (1) recording + self-rate, (2) optional STT comparison (e.g. browser SpeechRecognition or a free STT tier) for “did you say the right word?”.

### C) Recommended path (no pronunciation API)

1. **Phase 1 — Recording only (no backend):**
   - Add recording UI (record, stop, play back) in a **speaking/pronunciation** exercise.
   - No comparison yet: user records, hears playback, then self-rates (Again/Hard/Good/Easy) like a flashcard. Validates the UX and pipeline.

2. **Phase 2 — STT comparison (optional):**
   - Use **browser SpeechRecognition** (free, no backend) and/or a free-tier STT (e.g. Azure F0, Google 60 min/month) to get a transcript from the user’s recording.
   - Compare transcript to expected word (normalized). Show “Correct word!” / “Heard: X, expected: Y” and then rating.

**Omitted: Pronunciation assessment (Phase 3).** The only free-tier option is Azure F0 (5 hr/month). To avoid external paid limits and keep the app simple, we do not implement a dedicated pronunciation-scoring step. User feedback stays: self-rate + optional “correct word?” via STT.

---

## Summary

| Question | Answer |
|----------|--------|
| 1) Implement listening + recording? | **Yes.** Add recording (getUserMedia + MediaRecorder) and a speaking/pronunciation flow (hear or see word → record → optional compare → rate). |
| 2) Compare user audio vs reference? | **Yes, in stages:** (1) Recording + self-rate only; (2) STT → compare text to expected word (correct word?). Pronunciation assessment **omitted** (no free-tier-friendly option; Azure F0 = 5 hr/month only). |
| STT vs pronunciation API? | **STT** = correct word check (free via browser SpeechRecognition or free-tier APIs). **Pronunciation API** = quality/fluency; only Azure F0 is free-tier (5 hr/mo); we omit it to keep the app simple. |

---

## Suggested implementation order

1. **Recording only (feat branch):** Recording UI + playback in Study (new “Speaking” or extend “Listening” with a “Record your pronunciation” step). No API; user self-rates after playback.
2. **STT comparison (next):** Use browser **SpeechRecognition** (or optional free-tier STT API) to get transcript from recording; app compares to expected word and shows “Correct word?” / “Heard: X, expected: Y”.

**Omitted:** Pronunciation assessment (no free-tier-friendly solution; Azure F0 is the only option at 5 hr/month).

HANDOFF and TECH_EVALUATION can treat “Phase 4 – Speech” as: (1) recording + self-rate, (2) STT comparison (browser or free-tier API). No pronunciation-scoring step.
