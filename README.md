# Gemini Transcriber Plugin for Obsidian

The Gemini Transcriber plugin for Obsidian lets you convert audio files or live recordings into text using the [free](#Limits) Gemini API. It works by sending a customizable prompt to Gemini to generate a transcription. This prompt can be fully customized by the user. This means the plugin can be used for any task Gemini can perform with an audio file.

## Features

- Record audio and transcribe it directly (optionally save the recordings)
- Insert the transcription at the cursor in Edit mode, or create a new file if in Reading mode
- Create a custom prompt for Gemini
- Transcribe audio files from your vault
- Embed recordings above the transcription
- Choose your Gemini API Model
- View plugin usage statistics (can be completely disabled in the settings)

## Installation

1. Download the `manifest.json`, `main.js` and `styles.css` from the latest release.
2. Navigate to the `.obsidian/plugins/` directory. Create a new folder for the plugin if it doesn’t already exist, and move the downloaded files into it.
3. Open Obsidian and navigate to the community plugins and activate the plugin under _Community Plugins_.

## Setup

1. Open the plugin settings and enter your Gemini API key. ([Generate your key here](https://aistudio.google.com/apikey))
2. Enter the language of your audio.
3. Optionally, add hotkeys for available plugin commands such as starting/stopping or pausing/resuming a recording.
4. Press your hotkey for start/stop or use the command from the command palette to use the plugin.

## General information about Gemini

### Model

You can change the API model depending on whether you want faster or more accurate responses (e.g. if you have a complex prompt). To change the model, check the list of available models on the official [Google website](https://ai.google.dev/gemini-api/docs/models). For example, valid model names for the plugin are:

- `gemini-2.5-flash`
- `gemini-2.5-flash-lite`

### Limits

You can check the rate limits for your selected Gemini API model on the [Google website](https://ai.google.dev/gemini-api/docs/rate-limits?hl=de). Gemini is free unless you explicitly sign up for a paid plan. For normal transcription usage, the free plan should be more than enough. If you need more daily requests but don’t want to upgrade to a paid plan, consider using a lighter API model like `gemini-2.5-flash-lite` instead of `gemini-2.5-flash`.
