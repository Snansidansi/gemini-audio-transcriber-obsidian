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
    transcriptSaveLocation: string;
    embedAudioFile: boolean;
    showInStatusBar: boolean;
    customStatusbarColors: boolean;
    statusbarColorReady: string;
    statusbarColorRecording: string;
    statusbarColorPause: string;
    statusbarColorProcessing: string;
    enableStatistics: boolean;
}

export const DEFAULT_SETTINGS: Partial<GeminiTranscriberSettings> = {
    modelName: "gemini-2.0-flash",
    language: "english",
    customPrompt: false,
    prompt: "Transcribe the audio to markdown, removing filler words. Language: ",
    saveAudioFile: true,
    audioFileSaveLocation: "",
    transcriptSaveLocation: "",
    embedAudioFile: false,
    saveByNoteLocation: false,
    showInStatusBar: true,
    customStatusbarColors: false,
    statusbarColorReady: "#008000",
    statusbarColorRecording: "#ff0000",
    statusbarColorPause: "#ffff00",
    statusbarColorProcessing: "#ffa500",
    enableStatistics: true,
};

export class GeminiTranscriberSettingsTab extends PluginSettingTab {
    plugin: GeminiTranscriberPlugin;

    constructor(app: App, plugin: GeminiTranscriberPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    private completePrompt(): void {
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
                        this.plugin.transcriber.reloadApiKey();
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
                        this.completePrompt();
                        await this.plugin.saveSettings();
                    })
                    .setDisabled(
                        this.plugin.settings.customPrompt ? true : false,
                    ),
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

        this.renderStatusbarSettings(containerEl);
        this.renderPromptSettings(containerEl);
        this.renderSaveAudioSettings(containerEl);
    }

    private renderStatusbarSettings(containerEl: HTMLElement) {
        new Setting(containerEl)
            .setName("Display status in the status bar")
            .setHeading()
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.showInStatusBar)
                    .onChange(async (value) => {
                        this.plugin.settings.showInStatusBar = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName("Custom status bar colors")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.customStatusbarColors)
                    .onChange(async (value) => {
                        this.plugin.settings.customStatusbarColors = value;
                        await this.plugin.saveSettings();
                        this.display();
                    }),
            );

        if (this.plugin.settings.customStatusbarColors) {
            new Setting(containerEl)
                .setName("Ready color")
                .setClass("indent-setting")
                .addColorPicker((color) => {
                    color
                        .setValue(this.plugin.settings.statusbarColorReady)
                        .onChange(async (value) => {
                            this.plugin.settings.statusbarColorReady = value;
                            await this.plugin.saveSettings();
                            this.plugin.statusBar.reloadStatus();
                        });
                });

            new Setting(containerEl)
                .setName("Recording color")
                .setClass("indent-setting")
                .addColorPicker((color) => {
                    color
                        .setValue(this.plugin.settings.statusbarColorRecording)
                        .onChange(async (value) => {
                            this.plugin.settings.statusbarColorRecording =
                                value;
                            await this.plugin.saveSettings();
                            this.plugin.statusBar.reloadStatus();
                        });
                });

            new Setting(containerEl)
                .setName("Pause color")
                .setClass("indent-setting")
                .addColorPicker((color) => {
                    color
                        .setValue(this.plugin.settings.statusbarColorPause)
                        .onChange(async (value) => {
                            this.plugin.settings.statusbarColorPause = value;
                            await this.plugin.saveSettings();
                            this.plugin.statusBar.reloadStatus();
                        });
                });

            new Setting(containerEl)
                .setName("Processing color")
                .setClass("indent-setting")
                .addColorPicker((color) => {
                    color
                        .setValue(this.plugin.settings.statusbarColorProcessing)
                        .onChange(async (value) => {
                            this.plugin.settings.statusbarColorProcessing =
                                value;
                            await this.plugin.saveSettings();
                            this.plugin.statusBar.reloadStatus();
                        });
                });
        }
    }

    private renderPromptSettings(containerEl: HTMLElement) {
        const customPrompt = new Setting(containerEl)
            .setName("Custom prompt")
            .setHeading()
            .setDesc(
                "Show and edit the prompt that gets passed to gemini with your audio file. Enabling this setting will disable the language setting (you can set it manually in the prompt).",
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.customPrompt)
                    .onChange(async (value) => {
                        this.plugin.settings.customPrompt = value;
                        this.completePrompt();
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
                .setClass("indent-setting")
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
    }

    private renderSaveAudioSettings(containerEl: HTMLElement) {
        new Setting(containerEl)
            .setName("Save audio file")
            .setHeading()
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
                .setClass("indent-setting")
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
                .setClass("indent-setting")
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
                .setName("Save location for transcripts")
                .setDesc(
                    "Enter a location inside your vault where the transcripts should be saved if no editor is opened.",
                )
                .setClass("indent-setting")
                .addText((text) =>
                    text
                        .setValue(this.plugin.settings.transcriptSaveLocation)
                        .setPlaceholder("notes/transcripts")
                        .onChange(async (value) => {
                            this.plugin.settings.transcriptSaveLocation = value;
                            await this.plugin.saveSettings();
                        }),
                );

            new Setting(containerEl)
                .setName("Embed audio file in current note")
                .setDesc(
                    "If enabled the recorded audio file will be embedded before the transcription.",
                )
                .setClass("indent-setting")
                .addToggle((toggle) =>
                    toggle
                        .setValue(this.plugin.settings.embedAudioFile)
                        .onChange(async (value) => {
                            this.plugin.settings.embedAudioFile = value;
                            await this.plugin.saveSettings();
                        }),
                );
        }
    }
}
