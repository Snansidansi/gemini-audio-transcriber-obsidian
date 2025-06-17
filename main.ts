import { addCommands } from "src/commands";
import { Plugin } from "obsidian";
import { AudioRecorder } from "src/audioRecorder";
import {
    GeminiTranscriberSettings,
    GeminiTranscriberSettingsTab,
    DEFAULT_SETTINGS,
} from "src/settings";
import { StatusBar } from "src/statusBar";
import { Transcriber } from "src/transcriber";

export default class GeminiTranscriberPlugin extends Plugin {
    statusBar: StatusBar;
    audioRecorder: AudioRecorder;
    settings: GeminiTranscriberSettings;
    transcriber: Transcriber;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new GeminiTranscriberSettingsTab(this.app, this));
        addCommands(this);

        this.audioRecorder = new AudioRecorder(this);
        this.statusBar = new StatusBar(this);
        this.transcriber = new Transcriber(this);
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
