import GeminiTranscriberPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";

export interface GeminiTranscriberSettings {
    apiKey: string;
    modelName: string;
    language: string;
    customPrompt: boolean;
    prompt: string;
    saveAudioFile: boolean;
    saveByNoteLocation: boolean;
    audioFileSaveLocation: string;
    embedAudioFile: boolean;
    showInStatusBar: boolean;
    removeEmbeddedAfterTranscription: boolean;
    enableStatistics: boolean;
}

export const DEFAULT_SETTINGS: Partial<GeminiTranscriberSettings> = {
    modelName: "gemini-2.0-flash",
    language: "english",
    customPrompt: false,
    prompt: "Transcribe the audio to markdown, removing filler words. Language: ",
    saveAudioFile: true,
    audioFileSaveLocation: "",
    embedAudioFile: false,
    saveByNoteLocation: false,
    showInStatusBar: true,
    removeEmbeddedAfterTranscription: false,
    enableStatistics: true,
};

export class GeminiTranscriberSettingsTab extends PluginSettingTab {
    plugin: GeminiTranscriberPlugin;

    constructor(app: App, plugin: GeminiTranscriberPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    private setPrompt(): void {
        if (this.plugin.settings.customPrompt) {
            return;
        }

        this.plugin.settings.prompt =
            // Prompt is always set in DEFAULT_SETTINGS
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            DEFAULT_SETTINGS.prompt! + this.plugin.settings.language;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("API key")
            .setDesc("Your Gemini api key.")
            .addText((text) =>
                text
                    .setValue(this.plugin.settings.apiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.apiKey = value;
                        await this.plugin.saveSettings();
                    })
                    .inputEl.setCssStyles({ width: "200%" }),
            );

        const modelSetting = new Setting(containerEl)
            .setName("Model name")
            .setDesc(
                "Specify the gemini model that gets used for the transcriptions. The name contains '-' and no spaces.",
            )
            .addText((text) =>
                text
                    .setValue(this.plugin.settings.modelName)
                    .onChange(async (value) => {
                        this.plugin.settings.modelName = value;
                        await this.plugin.saveSettings();
                    }),
            );

        modelSetting.descEl.createEl("br");
        modelSetting.descEl.createEl("a", {
            href: "https://ai.google.dev/gemini-api/docs/models",
            text: "Available models and rate limits",
        });

        new Setting(containerEl)
            .setName(
                `Language ${
                    this.plugin.settings.customPrompt ? "(disabled)" : ""
                }`,
            )
            .setDesc("Specify the language of the input audio.")
            .addText((text) =>
                text
                    .setValue(this.plugin.settings.language)
                    .setPlaceholder("english")
                    .onChange(async (value) => {
                        this.plugin.settings.language = value;
                        this.setPrompt();
                        await this.plugin.saveSettings();
                    })
                    .setDisabled(
                        this.plugin.settings.customPrompt ? true : false,
                    ),
            );

        const customPrompt = new Setting(containerEl)
            .setName("Custom prompt")
            .setDesc(
                "Show and edit the prompt that gets passed to gemini with your audio file. Enabeling this setting will disable the language setting (you can set it manually in the prompt).",
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.customPrompt)
                    .onChange(async (value) => {
                        this.plugin.settings.customPrompt = value;
                        this.setPrompt();
                        await this.plugin.saveSettings();
                        this.display();
                    }),
            );

        if (this.plugin.settings.customPrompt) {
            customPrompt.descEl.createEl("br");
            customPrompt.descEl.createEl("br");
            customPrompt.descEl
                .createEl("span", {
                    text: "\nDisabeling this option after changing the prompt manually will reset the promt to the default prompt.",
                })
                .setCssStyles({ color: "red" });
        }

        if (this.plugin.settings.customPrompt) {
            const promptSetting = new Setting(containerEl)
                .setName("Prompt")
                .setDesc(
                    "This is the prompt that gets passed to gemini with your audiofile. You can edit it manually however you like it.",
                )
                .addTextArea((textArea) =>
                    textArea
                        .setValue(this.plugin.settings.prompt)
                        .onChange(async (value) => {
                            this.plugin.settings.prompt = value;
                            await this.plugin.saveSettings();
                        })
                        .inputEl.setCssStyles({
                            width: "-webkit-fill-available",
                            height: "5em",
                        }),
                );

            promptSetting.settingEl.setCssStyles({
                alignItems: "initial",
            });
            promptSetting.infoEl.setCssStyles({ maxWidth: "30%" });
        }

        new Setting(containerEl)
            .setName("Save audio file")
            .setDesc("Save the recorded audiofiles in the vault.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.saveAudioFile)
                    .onChange(async (value) => {
                        this.plugin.settings.saveAudioFile = value;
                        await this.plugin.saveSettings();
                        this.display();
                    }),
            );

        if (this.plugin.settings.saveAudioFile) {
            new Setting(containerEl)
                .setName("Save audio file at note location")
                .setDesc(
                    "If a note is open, the audio file for the transcription will be saved with that note, instead of the default audio file save location.",
                )
                .addToggle((toggle) =>
                    toggle
                        .setValue(this.plugin.settings.saveByNoteLocation)
                        .onChange(async (value) => {
                            this.plugin.settings.saveByNoteLocation = value;
                            await this.plugin.saveSettings();
                        }),
                );

            new Setting(containerEl)
                .setName("Save location for audio files")
                .setDesc(
                    "Enter a location inside your vault where the audio files should be saved.",
                )
                .addText((text) =>
                    text
                        .setValue(this.plugin.settings.audioFileSaveLocation)
                        .setPlaceholder("attachment/audio")
                        .onChange(async (value) => {
                            this.plugin.settings.audioFileSaveLocation = value;
                            await this.plugin.saveSettings();
                        }),
                );

            new Setting(containerEl)
                .setName("Embed audio file in current note")
                .setDesc(
                    "If enabled the recorded audio file will be embedded before the transcription.",
                )
                .addToggle((toggle) =>
                    toggle
                        .setValue(this.plugin.settings.embedAudioFile)
                        .onChange(async (value) => {
                            this.plugin.settings.embedAudioFile = value;
                            await this.plugin.saveSettings();
                        }),
                );
        }

        new Setting(containerEl)
            .setName("Display status in the statusbar")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.showInStatusBar)
                    .onChange(async (value) => {
                        this.plugin.settings.showInStatusBar = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName("Remove embedded audio after transcription")
            .addToggle((toggle) =>
                toggle
                    .setValue(
                        this.plugin.settings.removeEmbeddedAfterTranscription,
                    )
                    .onChange(async (value) => {
                        this.plugin.settings.removeEmbeddedAfterTranscription =
                            value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName("Enable statistics")
            .setDesc(
                "Collect plugin usage statistics and view them with a command.",
            ) //TODO Insert command name
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.enableStatistics)
                    .onChange(async (value) => {
                        this.plugin.settings.enableStatistics = value;
                        await this.plugin.saveSettings();
                    }),
            );
    }
}
