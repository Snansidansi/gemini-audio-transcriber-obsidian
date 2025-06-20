import { GenerateContentResponse } from "@google/genai";
import GeminiTranscriberPlugin from "main";
import { normalizePath, Notice } from "obsidian";

export class ResponseHandler {
    private plugin: GeminiTranscriberPlugin;

    constructor(plugin: GeminiTranscriberPlugin) {
        this.plugin = plugin;
    }

    async handleResponse(
        response: GenerateContentResponse,
        audioFilename: string | undefined,
    ) {
        if (!response.text) {
            return;
        }

        this.plugin.statistics?.addWordsRecieved(response.text);
        this.plugin.statistics?.incrementTranscribed();
        await this.plugin.statistics?.save();

        this.insertAtCursor(response.text, audioFilename);
        this.createTranscriptFile(response.text, audioFilename);

        new Notice("Finished transcription");
    }

    private insertAtCursor(text: string, audioFilename: string | undefined) {
        const editor = this.plugin.app.workspace.activeEditor?.editor;
        if (!editor) {
            return;
        }

        editor.replaceSelection(this.getAudioEmbed(audioFilename));
        editor.replaceSelection(text);

        return true;
    }

    /**
     * @returns {string} is empty if no audio should be embedded or save audio
     * file is turned off, or the audioFilename is undefined.
     */
    private getAudioEmbed(audioFilename: string | undefined): string {
        if (
            this.plugin.settings.embedAudioFile &&
            this.plugin.settings.saveAudioFile &&
            audioFilename
        ) {
            return `![[${audioFilename}]]\n`;
        }

        return "";
    }

    private async createTranscriptFile(
        text: string,
        audioFilename: string | undefined,
    ) {
        const editor = this.plugin.app.workspace.activeEditor?.editor;
        if (editor) {
            return;
        }

        const content = this.getAudioEmbed(audioFilename) + text;
        const filename = `transcript-${Date.now()}.md`;

        let filepath = this.plugin.settings.transcriptSaveLocation;
        if (!this.plugin.app.vault.getFolderByPath(filepath)) {
            try {
                await this.plugin.app.vault.createFolder(filepath);
            } catch (error) {
                console.log(error);
                new Notice(error, 0);
            }
        }

        filepath = normalizePath(filepath + "/" + filename);

        this.plugin.app.vault.create(filepath, content).then((file) => {
            const recentLeaf = this.plugin.app.workspace.getMostRecentLeaf();
            if (recentLeaf && recentLeaf.view.getViewType() === "empty") {
                recentLeaf.openFile(file);
                return;
            }

            const leaf = this.plugin.app.workspace.getLeaf("tab");
            leaf.openFile(file);
        });
    }
}
