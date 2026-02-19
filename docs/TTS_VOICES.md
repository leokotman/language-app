# TTS (Text-to-Speech) voices – limitations and guidance

This doc describes the issue we face with the **listening** and **speaking** exercises when the device has no voice for a given language (e.g. Serbian), and how we handle it for users and future work.

---

## The issue

- The app uses the **Web Speech API** (`speechSynthesis` / `SpeechSynthesisUtterance`) to speak the word in the **word’s language** (e.g. Serbian for "dobar dan").
- **Voices come from the operating system**, not from our code. The browser only exposes whatever TTS voices the OS provides. We cannot add or create voices from the app.
- If no voice for that language is installed (e.g. no Serbian on macOS), either:
  - The browser uses a **default voice** (often English), so the word is pronounced with the wrong accent (e.g. "dobar dan" sounds like English), or
  - We detect "no matching voice" and **don’t speak**, and show a message asking the user to add a voice.

**Chrome quirk:** `speechSynthesis.getVoices()` can return an **empty array** on first call because voices load asynchronously. So on the very first "Play word" tap we might speak with no voice set (wrong pronunciation) or we might not speak and show the message. Our current logic: we **only speak when we have a matching voice**; if voices haven’t loaded yet or there is no voice for the language, we don’t speak and show the snackbar (so we never play wrong pronunciation).

---

## What does _not_ add TTS voices

- **Chrome → Settings → Languages → Preferred languages**  
  This controls which language websites use and translation. It does **not** add text-to-speech voices. Users often think adding "Serbian" there will fix pronunciation; it won’t.

- **Keyboard / input languages**  
  Input languages (e.g. English + Serbian keyboards) do not change which TTS voice is used.

---

## Where users can add TTS voices (OS)

- **macOS:** System Settings → **Accessibility** → **Spoken Content** (Read & Speak).
  - **System speech language** "Use System Language" = default speech language from **General → Language & Region** (first in the list).
  - **System voice** dropdown: choose a voice; use **Customize…** / **Manage Voices…** to **download** more languages (e.g. Serbian) if available.
  - If Serbian is not in the "Use system language" dropdown, the user may need to download a Serbian voice via System voice → Customize.

- **Windows:** Settings → **Time & language** → **Language & region** → Add a language, and ensure **Text-to-speech** is checked when installing; or **Speech** settings to manage voices.

- **After installing a new voice:** Refresh the page or restart the browser so the browser picks up the new voice list.

---

## Current app behavior

- We **only speak when we have a matching voice** for the word’s language (from `speechSynthesis.getVoices()`). We set `utterance.lang` (e.g. `sr-Latn` for Serbian) and `utterance.voice` to that voice so the OS/browser language doesn’t override.
- If there is no matching voice (either because voices haven’t loaded yet or the OS has no voice for that language), we **do not speak** and return `missingLang`; the UI shows a snackbar: _"No [Language] voice installed. Add a text-to-speech voice in your device or browser settings to hear the word."_
- Debug logging is behind `TTS_DEBUG` in `StudyPage.helpers.ts` (set to `false` when not debugging).

---

## Future: external TTS API fallback

We **cannot** add new voices via the Web Speech API. We **can** add a fallback that uses a **cloud TTS API** when no local voice is available:

- **Google Cloud Text-to-Speech**, **Azure Speech**, **Amazon Polly** (and others) support Serbian and many languages.
- Flow: when we need to speak and `getVoiceForLang()` returns null, call our backend (to keep API keys secret), which calls the provider with text + language; return audio (e.g. MP3); play in the app via `<audio>`.
- Trade-offs: backend required, possible cost/quotas, network required, small latency. See SPEECH_PLAN.md for related API notes (STT, pronunciation).

---

## References in code

- `src/pages/StudyPage/StudyPage.helpers.ts`: `speakWord`, `getVoiceForLang`, `LANG_TO_BCP47`, `hasVoiceForLang`, `LANG_DISPLAY_NAMES`, `TTS_DEBUG`.
- `src/pages/StudyPage/StudyPage.tsx`: `handlePlayWord`, TTS snackbar and (when implemented) "How to add a voice" instructions.
