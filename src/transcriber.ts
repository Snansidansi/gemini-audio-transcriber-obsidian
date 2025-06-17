import {
    createPartFromUri,
    createUserContent,
    File,
    GoogleGenAI,
} from "@google/genai";
import GeminiTranscriberPlugin from "main";

export class Transcriber {
    private plugin: GeminiTranscriberPlugin;
    private ai: GoogleGenAI;

    constructor(plugin: GeminiTranscriberPlugin) {
        this.plugin = plugin;
        this.reloadApiKey();
    }

    reloadApiKey() {
        this.ai = new GoogleGenAI({ apiKey: this.plugin.settings.apiKey });
    }

    async transcribe(file: string | Blob, mimeType: string): Promise<string> {
        this.plugin.statusBar.setProcessing();

        const uploadedFile = await this.uploadAudio(file, mimeType);
        const response = await this.getResponse(uploadedFile);
        this.deleteAudio(uploadedFile);

        this.plugin.statusBar.setReady();

        return response.text ?? "";
    }

    private async getResponse(uploadedFile: File) {
        return await this.ai.models.generateContent({
            model: this.plugin.settings.modelName,
            contents: createUserContent([
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
        await this.ai.files.delete({ name: file.name! });
    }
}
