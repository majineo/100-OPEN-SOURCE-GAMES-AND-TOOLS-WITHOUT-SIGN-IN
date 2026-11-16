# The Text to Speech: 128 free tools, games and study apps, no signup

🌐 **Website: [thetexttospeech.com](https://thetexttospeech.com)**

Free text to speech with 16 natural voices and MP3 download, plus a hand-picked directory of **128 open-source web tools, games and study apps**. None of them ask you to sign up.

## What's on the site

- **Text to speech:** paste text, pick one of 16 English voices, adjust the speed and download the result as MP3 or WAV. The voice engine runs in your browser, so your text never leaves your device.
- **Tool directory:** 128 open-source tools from GitHub, sorted into Education, Games, Design, Developer, Writing, Files, Media, Data, Privacy and Utilities, with search, filters and GitHub star counts.
- **Games you can play on the site:** 2048, T-Rex Runner, Clumsy Bird, A Dark Room, Elevator Saga, Flexbox Froggy, Grid Garden and CSS Diner.
- **Jarvis:** a small help assistant (bottom-right button) that answers common questions, by text or by voice.

No account, no email, no free trial, no install.

## How it works

It is a static website, with no server and no database:

- `docs/` is the website itself (this is the folder that gets published).
- `tools-src.json` is the list of tools in the directory.
- `update-data.mjs` refreshes the directory (GitHub stars, licences, icons, link checks): `node update-data.mjs`
- `make-play-pages.mjs` rebuilds the game pages: `node make-play-pages.mjs`
- `self-host-fonts.mjs` downloads the fonts so the site does not depend on Google Fonts.

Fonts, icons and libraries are stored on the site itself, so it loads quickly and keeps working on filtered networks (schools, offices).

## Credits

The directory links to open-source projects made by their own authors; each card links to its GitHub repository.

**Games hosted on this site** (copied from GitHub under their licences; the original analytics and ads were removed, and some libraries were updated):

| Game | Author | Licence | Source |
|---|---|---|---|
| 2048 | Gabriele Cirulli | MIT | [gabrielecirulli/2048](https://github.com/gabrielecirulli/2048) |
| T-Rex Runner | wayou, based on the Chromium project | BSD-3-Clause | [wayou/t-rex-runner](https://github.com/wayou/t-rex-runner) |
| Elevator Saga | Magnus Wolffelt | MIT | [magwo/elevatorsaga](https://github.com/magwo/elevatorsaga) |
| A Dark Room | Doublespeak Games | MPL-2.0 | [doublespeakgames/adarkroom](https://github.com/doublespeakgames/adarkroom) |
| Clumsy Bird | Ellison Leão | GPL-3.0 | [ellisonleao/clumsy-bird](https://github.com/ellisonleao/clumsy-bird) |
| Flexbox Froggy | Thomas Park | MIT | [thomaspark/flexboxfroggy](https://github.com/thomaspark/flexboxfroggy) |
| Grid Garden | Thomas Park | MIT | [thomaspark/gridgarden](https://github.com/thomaspark/gridgarden) |
| CSS Diner | Luke Pacholski | MPL-2.0 | [flukeout/css-diner](https://github.com/flukeout/css-diner) |

Each game's full licence is in its folder under `docs/games/`.

**Text to speech:** voices by the [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) model (Apache 2.0) through [kokoro-js](https://github.com/hexgrad/kokoro), MP3 encoding by [lamejs](https://github.com/zhuker/lamejs) (LGPL-3.0).

## Want a tool added?

Open an issue with the tool's name, its website and its GitHub repository. It has to be open source and usable without an account.
