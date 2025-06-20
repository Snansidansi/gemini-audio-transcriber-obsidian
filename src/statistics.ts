import GeminiTranscriberPlugin from "main";
import { Modal, normalizePath, Notice } from "obsidian";

export class Statistics {
    private plugin: GeminiTranscriberPlugin;
    private filepath: string;

    private statsData = {
        timesRecorded: 0,
        secondsRecorded: 0,
        filesTranscribed: 0,
        secondsTranscribed: 0,
        wordsRecived: 0,
    };

    constructor(plugin: GeminiTranscriberPlugin) {
        this.plugin = plugin;
        this.filepath = normalizePath(`${plugin.manifest.dir}/stats.json`);
    }

    getStatsData() {
        return this.statsData;
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

    async addAudioFileDuration(audioBlob: Blob) {
        const duration = await this.getDurationFromAudio(audioBlob);
        this.statsData.secondsRecorded += duration;
    }

    async addTranscribedDuration(audioBlob: Blob) {
        const duration = await this.getDurationFromAudio(audioBlob);
        this.statsData.secondsTranscribed += duration;
    }

    private getDurationFromAudio(audioBlob: Blob): Promise<number> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                const arraybuffer = reader.result as ArrayBuffer;
                const audioContext = new AudioContext();

                audioContext.decodeAudioData(arraybuffer, (audioBuffer) => {
                    resolve(audioBuffer.duration);
                });
            };

            reader.onerror = () => {
                resolve(0);
            };

            reader.readAsArrayBuffer(audioBlob);
        });
    }

    /**
     * Also resets the statistics save file
     */
    async reset() {
        this.statsData.timesRecorded = 0;
        this.statsData.secondsRecorded = 0;
        this.statsData.filesTranscribed = 0;
        this.statsData.secondsTranscribed = 0;
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

export class StatisticsModal extends Modal {
    private statistics: Statistics;
    private statsNamesDiv: HTMLDivElement;
    private statsValueDiv: HTMLDivElement;
    private reset = false;

    constructor(plugin: GeminiTranscriberPlugin) {
        super(plugin.app);

        if (!plugin.statistics) {
            return;
        }
        this.statistics = plugin.statistics;

        this.setTitle("Gemini Transcriber Plugin - Statistics");
        this.modalEl.setCssStyles({
            width: "fit-content",
        });

        const statsDiv = this.contentEl.createDiv();
        statsDiv.setCssStyles({
            display: "flex",
        });

        const contentStyling = {
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            justifyContent: "space-between",
            width: "fit-content",
        };

        this.statsNamesDiv = statsDiv.createDiv();
        this.statsNamesDiv.setCssStyles({
            ...contentStyling,
            marginRight: "2rem",
        });

        this.statsValueDiv = statsDiv.createDiv();
        this.statsValueDiv.setCssStyles(contentStyling);

        this.createStats();
        this.createResetArea();
    }

    onOpen(): void {
        if (!this.statistics) {
            this.close();
        }
    }

    private createStats() {
        const statsData = this.statistics.getStatsData();
        this.createEntry("Total recordings", statsData.timesRecorded);

        this.createEntry(
            "Total recording time",
            this.formatTime(Math.round(statsData.secondsRecorded)),
        );

        this.createEntry(
            "Total files and recordings transcribed",
            statsData.filesTranscribed,
        );

        this.createEntry(
            "Total transcribed audio duration",
            this.formatTime(Math.round(statsData.secondsTranscribed)),
        );

        this.createEntry("Total words transcribed", statsData.wordsRecived);
    }

    private createEntry(name: string, value: number | string) {
        this.statsNamesDiv.createEl("div", { text: name + ":" });
        this.statsValueDiv.createEl("div", { text: value.toString() });
    }

    private formatTime(timeInSeconds: number): string {
        const seconds = timeInSeconds % 60;
        const minutes = Math.floor((timeInSeconds % 3600) / 60);
        const hours = Math.floor(timeInSeconds / 3600);

        const secondsFormatted = seconds.toString().padStart(2, "0");
        const minuesFormatted = minutes.toString().padStart(2, "0");
        const hoursFormatted = hours.toString().padStart(2, "0");

        return `${hoursFormatted}:${minuesFormatted}:${secondsFormatted}`;
    }

    private createResetArea() {
        this.contentEl.createEl("hr").setCssStyles({ margin: "0.5rem 0" });

        const resetBtn = this.contentEl.createEl("button", {
            text: "Reset statistics",
        });
        resetBtn.setCssStyles({
            border: "1px solid var(--text-accent)",
            color: "var(--text-accent)",
        });
        resetBtn.onClickEvent(this.handleReset.bind(this));
    }

    private async handleReset() {
        if (this.reset) {
            await this.statistics.reset();
            this.reset = false;
            this.close();
            new Notice("Reset statistics successfully.");
            return;
        }

        new Notice("Click the button again to reset the statistics.", 5000);
        this.reset = true;
    }
}
