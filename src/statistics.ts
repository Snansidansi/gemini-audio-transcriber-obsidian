import GeminiTranscriberPlugin from "main";
import { normalizePath } from "obsidian";

export class Statistics {
    private plugin: GeminiTranscriberPlugin;
    private filepath: string;

    private statsData = {
        timesRecorded: 0,
        secondsRecorded: 0,
        filesTranscribed: 0,
        wordsRecived: 0,
    };

    constructor(plugin: GeminiTranscriberPlugin) {
        this.plugin = plugin;
        this.filepath = normalizePath(`${plugin.manifest.dir}/stats.json`);
    }

    incrementRecorded() {
        this.statsData.timesRecorded++;
    }

    incrementTranscribed() {
        this.statsData.filesTranscribed++;
    }

    addWordsRecieved(response: string) {
        this.statsData.wordsRecived += response.split(" ").length;
    }

    addAudioFileDuration(audioBlob: Blob) {
        const reader = new FileReader();
        reader.onload = () => {
            const arraybuffer = reader.result as ArrayBuffer;
            const audioContext = new AudioContext();

            audioContext.decodeAudioData(arraybuffer, (audioBuffer) => {
                this.statsData.secondsRecorded += audioBuffer.duration;
            });
        };
        reader.readAsArrayBuffer(audioBlob);
    }

    async reset() {
        this.statsData.timesRecorded = 0;
        this.statsData.secondsRecorded = 0;
        this.statsData.filesTranscribed = 0;
        this.statsData.wordsRecived = 0;
        await this.save();
    }

    async save() {
        await this.plugin.app.vault.adapter.write(
            this.filepath,
            JSON.stringify(this.statsData, null, 2),
        );
    }

    async load() {
        const jsonData = await this.plugin.app.vault.adapter.read(
            this.filepath,
        );
        this.statsData = JSON.parse(jsonData);
    }
}
