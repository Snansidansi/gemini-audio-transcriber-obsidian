import { addCommands } from "src/commands";
import { Plugin } from "obsidian";
import { AudioRecorder } from "src/audioRecorder";
import {
    GeminiTranscriberSettings,
    GeminiTranscriberSettingsTab,
    DEFAULT_SETTINGS,
} from "src/settings";

export default class GeminiTranscriberPlugin extends Plugin {
    settings: GeminiTranscriberSettings;
    audioRecorder = new AudioRecorder(this);

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new GeminiTranscriberSettingsTab(this.app, this));
        addCommands(this);
    }

    onunload() {}

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData(),
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
