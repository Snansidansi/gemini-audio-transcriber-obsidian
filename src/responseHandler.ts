import { GenerateContentResponse } from "@google/genai";
import { time } from "console";
import GeminiTranscriberPlugin from "main";
import { MarkdownView } from "obsidian";
import * as path from "path";

export class ResponseHandler {
    private plugin: GeminiTranscriberPlugin;

    constructor(plugin: GeminiTranscriberPlugin) {
        this.plugin = plugin;
    }

    handleResponse(
        response: GenerateContentResponse,
        audioFilename: string | undefined,
    ) {
        if (!response.text) {
            return;
        }

        this.insertAtCursor(response.text, audioFilename);
        this.createTranscriptFile(response.text, audioFilename);
    }

    private insertAtCursor(text: string, audioFilename: string | undefined) {
        const markdownView =
            this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
        if (!markdownView?.editor) {
            return false;
        }

        markdownView.editor.replaceSelection(this.getAudioEmbed(audioFilename));
        markdownView.editor.replaceSelection(text);

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

    private createTranscriptFile(
        text: string,
        audioFilename: string | undefined,
    ) {
        const markdownView =
            this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
        if (markdownView?.editor) {
            return;
        }

        const content = this.getAudioEmbed(audioFilename) + text;
        const filename = `transcript-${Date.now()}.md`;
        const filepath = path.join(
            this.plugin.settings.transcriptSaveLocation,
            filename,
        );

        this.plugin.app.vault.create(filepath, content);
    }
}
