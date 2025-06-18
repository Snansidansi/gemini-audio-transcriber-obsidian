import {
    createPartFromUri,
    createUserContent,
    File,
    GoogleGenAI,
} from "@google/genai";
import GeminiTranscriberPlugin from "main";
import { Notice } from "obsidian";
import { ResponseHandler } from "./responseHandler";

export class Transcriber {
    private plugin: GeminiTranscriberPlugin;
    private ai: GoogleGenAI;
    private responseHandler: ResponseHandler;

    constructor(plugin: GeminiTranscriberPlugin) {
        this.plugin = plugin;
        this.reloadApiKey();
        this.responseHandler = new ResponseHandler(plugin);
    }

    reloadApiKey() {
        this.ai = new GoogleGenAI({ apiKey: this.plugin.settings.apiKey });
    }

    async transcribe(
        file: string | Blob,
        mimeType: string,
        filename: string | undefined,
    ) {
        this.plugin.statusBar.setProcessing();

        let uploadedFile: File | undefined = undefined;
        try {
            uploadedFile = await this.uploadAudio(file, mimeType);
            const response = await this.getResponse(uploadedFile);
            this.responseHandler.handleResponse(response, filename);
        } catch (error: unknown) {
            if (error instanceof Error) {
                if (error.message.contains("API key not valid")) {
                    new Notice("Error: Your API key for Gemini is invalid.", 0);
                    return;
                } else {
                    console.log(error);
                    new Notice(error.message, 0);
                }
            }
        } finally {
            this.plugin.statusBar.setReady();
        }

        if (uploadedFile) {
            try {
                this.deleteAudio(uploadedFile);
            } catch (error) {
                console.log(error);
                new Notice(error, 0);
            }
        }
    }

    private async getResponse(uploadedFile: File) {
        return await this.ai.models.generateContent({
            model: this.plugin.settings.modelName,
            contents: createUserContent([
                // file was uploaded before so it has a uri and mimeType
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                createPartFromUri(uploadedFile.uri!, uploadedFile.mimeType!),
                this.plugin.settings.prompt,
            ]),
        });
    }

    private async uploadAudio(file: string | Blob, mimeType: string) {
        const myfile = await this.ai.files.upload({
            file: file,
            config: { mimeType: mimeType },
        });

        return myfile;
    }

    private async deleteAudio(file: File) {
        // Uploaded files always have a name generated for them
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await this.ai.files.delete({ name: file.name! });
    }
}
