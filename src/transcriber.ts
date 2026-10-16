import GeminiTranscriberPlugin from "main";
import { Notice } from "obsidian";
import { GeminiProvider } from "./providers/geminiProvider";
import { TranscriptionProvider } from "./providers/transcriptionProvider";
import { ResponseHandler } from "./responseHandler";

export class Transcriber {
    static validFileFormats = [
        "wav",
        "mp3",
        "aiff",
        "aac",
        "ogg",
        "flac",
        "webm",
        "m4a",
    ] as const;

    private plugin: GeminiTranscriberPlugin;
    private provider: TranscriptionProvider;
    private responseHandler: ResponseHandler;

    constructor(plugin: GeminiTranscriberPlugin) {
        this.plugin = plugin;
        this.provider = this.createProvider();
        this.responseHandler = new ResponseHandler(plugin);
    }

    reloadApiKey() {
        this.provider.reloadApiKey();
    }

    async transcribe(
        blob: Blob,
        filename: string | undefined,
        toClipboard: boolean,
    ) {
        if (!this.provider.isConfigured()) {
            new Notice(
                `Error: No API key configured for ${this.provider.displayName}.`,
                0,
            );
            return;
        }

        this.plugin.statusBar?.setStatus("processing");

        try {
            const transcript = await this.provider.transcribe(blob);
            await this.responseHandler.handleResponse(
                transcript,
                filename,
                toClipboard,
            );

            await this.plugin.statistics?.addTranscribedDuration(blob);
            this.plugin.statistics?.incrementTranscribed();
            this.plugin.statistics?.save();
        } catch (error: unknown) {
            if (error instanceof Error) {
                if (error.message.contains("API key not valid")) {
                    new Notice(
                        `Error: Your API key for ${this.provider.displayName} is invalid.`,
                        0,
                    );
                    return;
                } else {
                    console.log(error);
                    new Notice(error.message, 0);
                }
            }
        } finally {
            this.plugin.statusBar?.setStatus("ready");
        }
    }

    private createProvider(): TranscriptionProvider {
        return new GeminiProvider(this.plugin);
    }
}
