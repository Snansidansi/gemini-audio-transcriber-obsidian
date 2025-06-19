import GeminiTranscriberPlugin from "main";
import { Notice } from "obsidian";
import * as path from "path";

export class AudioRecorder {
    private plugin: GeminiTranscriberPlugin;
    private chunks: Blob[] = [];
    private mediaRecorder: MediaRecorder;
    private abort = false;

    private static mimeType = "audio/webm; codecs=opus";

    constructor(plugin: GeminiTranscriberPlugin) {
        this.plugin = plugin;
        this.setup();
    }

    async setup() {
        await navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then(
                (stream) =>
                    (this.mediaRecorder = new MediaRecorder(stream, {
                        mimeType: AudioRecorder.mimeType,
                    })),
            )
            .catch((err) => {
                const errMsg = `A getUserMedia error occured: ${err}`;
                console.log(errMsg);
                new Notice(errMsg, 0);
            });

        this.mediaRecorder.ondataavailable = (e) => {
            this.chunks.push(e.data);
        };

        this.mediaRecorder.onstop = async () => {
            this.stop();
        };
    }

    getState() {
        return this.mediaRecorder.state;
    }

    startRecording() {
        if (this.abort) {
            return;
        }

        if (!this.mediaRecorder) {
            new Notice("Error: Recorder not initialized", 0);
            return;
        }

        this.chunks = [];
        this.mediaRecorder.start();
        this.plugin.statusBar.setStatus("recording");
    }

    pauseRecording() {
        this.mediaRecorder.pause();
        this.plugin.statusBar.setStatus("pause");
    }

    resumeRecording() {
        this.mediaRecorder.resume();
        this.plugin.statusBar.setStatus("recording");
    }

    stopRecording() {
        this.plugin.statusBar.setStatus("processing");
        this.mediaRecorder.stop();
    }

    abortRecording() {
        this.abort = true;
        this.mediaRecorder.stop();
    }

    private async stop() {
        if (this.abort) {
            this.plugin.statusBar.setStatus("ready");
            this.abort = false;
            return;
        }

        const blob = new Blob(this.chunks, {
            type: this.mediaRecorder.mimeType,
        });

        const filepath = await this.getAndCreateSavePath();
        if (this.plugin.settings.saveAudioFile) {
            this.plugin.app.vault.createBinary(
                filepath,
                await blob.arrayBuffer(),
            );
        }

        this.plugin.transcriber.transcribe(blob, path.basename(filepath));
    }

    private async getAndCreateSavePath() {
        const fileName = `recording-${Date.now()}.webm`;

        if (this.plugin.settings.saveByNoteLocation) {
            const activeFile = this.plugin.app.workspace.getActiveFile();
            if (activeFile) {
                const parent = activeFile.parent;
                const filePath = parent ? parent.path : "";
                return path.join(filePath, fileName);
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

        return path.join(filePath, fileName);
    }
}
