import GeminiTranscriberPlugin from "main";
import { normalizePath, Notice } from "obsidian";

export class AudioRecorder {
    private plugin: GeminiTranscriberPlugin;
    private chunks: Blob[] = [];
    private mediaRecorder: MediaRecorder | null = null;
    private abort = false;

    private static mimeType = "audio/webm; codecs=opus";

    constructor(plugin: GeminiTranscriberPlugin) {
        this.plugin = plugin;
    }

    getState(): RecordingState | undefined {
        if (this.mediaRecorder) {
            return this.mediaRecorder.state;
        }
    }

    async startRecording() {
        if (this.abort) {
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: AudioRecorder.mimeType,
            });
        } catch (error) {
            const errMsg = `A getUserMedia error occured: ${error}`;
            console.log(errMsg);
            new Notice(errMsg, 0);
            return;
        }

        this.mediaRecorder.ondataavailable = (e) => {
            this.chunks.push(e.data);
        };

        this.mediaRecorder.onstop = async () => {
            this.stop();
        };

        this.chunks = [];
        this.mediaRecorder.start();
        this.plugin.statusBar?.setStatus("recording");
    }

    pauseRecording() {
        if (!this.mediaRecorder) {
            return;
        }

        this.mediaRecorder.pause();
        this.plugin.statusBar?.setStatus("pause");
    }

    resumeRecording() {
        if (!this.mediaRecorder) {
            return;
        }

        this.mediaRecorder.resume();
        this.plugin.statusBar?.setStatus("recording");
    }

    stopRecording() {
        if (!this.mediaRecorder) {
            return;
        }

        this.plugin.statusBar?.setStatus("processing");
        this.mediaRecorder.stop();
    }

    abortRecording() {
        if (!this.mediaRecorder) {
            return;
        }

        this.abort = true;
        this.mediaRecorder.stop();
    }

    private async stop() {
        if (!this.mediaRecorder) {
            return;
        }

        this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        this.mediaRecorder = null;

        if (this.abort) {
            this.plugin.statusBar?.setStatus("ready");
            this.abort = false;
            return;
        }

        const blob = new Blob(this.chunks, {
            type: AudioRecorder.mimeType,
        });

        const [filePath, fileName] = await this.getAndCreateSavePath();
        if (this.plugin.settings.saveAudioFile) {
            this.plugin.app.vault.createBinary(
                filePath,
                await blob.arrayBuffer(),
            );
        }

        await this.plugin.statistics?.addAudioFileDuration(blob);
        this.plugin.statistics?.incrementRecorded();
        await this.plugin.statistics?.save();

        this.plugin.transcriber.transcribe(
            blob,
            fileName,
            this.plugin.settings.saveToClipBoard,
        );
    }

    private async getAndCreateSavePath(): Promise<
        readonly [filePath: string, fileName: string]
    > {
        if (!this.plugin.settings.saveAudioFile) {
            return ["", ""];
        }

        const fileName = `recording-${Date.now()}.webm`;

        if (this.plugin.settings.saveByNoteLocation) {
            const activeFile = this.plugin.app.workspace.getActiveFile();
            if (activeFile) {
                const parent = activeFile.parent;
                const filePath = parent ? parent.path : "";
                return [normalizePath(filePath + "/" + fileName), fileName];
            }
        }

        const filePath = this.plugin.settings.audioFileSaveLocation;

        if (!this.plugin.app.vault.getFolderByPath(filePath)) {
            try {
                await this.plugin.app.vault.createFolder(filePath);
            } catch (error) {
                console.log(error);
                new Notice(error, 0);
            }
        }

        return [normalizePath(filePath + "/" + fileName), fileName];
    }
}
