import GeminiTranscriberPlugin from "main";
import { normalizePath, Notice } from "obsidian";

export class ResponseHandler {
    private plugin: GeminiTranscriberPlugin;

    constructor(plugin: GeminiTranscriberPlugin) {
        this.plugin = plugin;
    }

    async handleResponse(
        transcript: string,
        audioFilename: string | undefined,
        toClipboard: boolean,
    ) {
        if (!transcript) {
            return;
        }

        this.plugin.statistics?.addWordsRecieved(transcript);
        await this.plugin.statistics?.save();

        if (toClipboard) {
            this.saveTranscriptInClipboard(transcript);
            new Notice("Stored transcription in clipboard");
            return;
        }

        this.insertAtCursor(transcript, audioFilename);
        this.createTranscriptFile(transcript, audioFilename);

        new Notice("Finished transcription");
    }

    private saveTranscriptInClipboard(text: string) {
        navigator.clipboard.writeText(text);
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
        if (
            !this.plugin.app.vault.getFolderByPath(filepath) &&
            this.plugin.settings.transcriptSaveLocation !== ""
        ) {
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
