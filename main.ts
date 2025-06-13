import { Plugin } from "obsidian";
import {
    DEFAULT_SETTINGS,
    GeminiTranscriberSettings,
    GeminiTranscriberSettingsTab,
} from "src/settings";

export default class GeminiTranscriberPlugin extends Plugin {
    settings: GeminiTranscriberSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new GeminiTranscriberSettingsTab(this.app, this));
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
