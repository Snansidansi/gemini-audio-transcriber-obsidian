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
                    const duration = audioBuffer.duration;
                    resolve(Math.round(duration * 100) / 100);
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
    private reset = false;

    constructor(plugin: GeminiTranscriberPlugin) {
        super(plugin.app);

        if (!plugin.statistics) {
            return;
        }
        this.statistics = plugin.statistics;

        this.setTitle("Gemini Transcriber Statistics");
        this.modalEl.setCssStyles({
            width: "fit-content",
            backgroundColor: "#121212",
            borderRadius: "1rem",
            border: "1px solid #222222",
            overflow: "hidden",
            maxWidth: "42rem",
        });

        const header = this.contentEl.createDiv();
        header.setCssStyles({
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "2rem 2rem 1rem 0rem",
        });

        const grid = this.contentEl.createDiv();
        grid.setCssStyles({
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1rem",
            padding: "0 2rem 2rem 2rem",
        });

        const statsData = this.statistics.getStatsData();

        const createCard = (
            iconSvg: string,
            value: string | number,
            label: string,
        ) => {
            const card = grid.createDiv();
            card.setCssStyles({
                backgroundColor: "#1a1a1a",
                border: "1px solid #2e2e2e",
                borderRadius: "0.75rem",
                padding: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
            });

            const iconContainer = card.createDiv();
            iconContainer.setCssStyles({
                color: "#a1a1a1",
                flexShrink: "0",
            });
            iconContainer.innerHTML = iconSvg;

            const textContainer = card.createDiv();
            const valueEl = textContainer.createDiv();
            valueEl.setText(value.toString());
            valueEl.setCssStyles({
                fontSize: "2.25rem",
                fontWeight: "600",
                color: "#ffffff",
                lineHeight: "1.2",
            });
            const labelEl = textContainer.createDiv();
            labelEl.setText(label);
            labelEl.setCssStyles({
                fontSize: "0.875rem",
                color: "#a1a1a1",
                marginTop: "0.25rem",
            });
        };

        const micIcon = `<svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>`;
        const clockIcon = `<svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>`;
        const fileIcon = `<svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>`;
        const waveIcon = `<svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 17V7m-4 4v2m8-8v14m4-9v4m4-2v0M5 12v0" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>`;
        const lettersIcon = `<div style="color:#a1a1a1; font-weight:700; font-size:1.25rem;">A-Z</div>`;

        createCard(micIcon, statsData.timesRecorded, "Total recordings");
        createCard(
            clockIcon,
            this.formatTime(Math.round(statsData.secondsRecorded)),
            "Total recording time",
        );
        createCard(
            fileIcon,
            statsData.filesTranscribed,
            "Total files & recordings transcribed",
        );
        createCard(
            waveIcon,
            this.formatTime(Math.round(statsData.secondsTranscribed)),
            "Total transcribed audio duration",
        );
        createCard(
            lettersIcon,
            statsData.wordsRecived,
            "Total words transcribed",
        );

        // Footer with reset button
        const footer = this.contentEl.createDiv();
        footer.setCssStyles({
            borderTop: "1px solid #222222",
            padding: "2rem",
            display: "flex",
            justifyContent: "center",
        });

        const resetBtn = footer.createEl("button", {
            text: "Reset statistics",
        });
        resetBtn.setCssStyles({
            backgroundColor: "rgba(185, 28, 28, 0.15)",
            color: "#ef4444",
            border: "none",
            borderRadius: "0.5rem",
            padding: "0.5rem 1.5rem",
            fontWeight: "500",
            cursor: "pointer",
            transition: "background-color 0.2s",
        });
        resetBtn.onClickEvent(this.handleReset.bind(this));
        resetBtn.onmouseenter = () => {
            resetBtn.style.backgroundColor = "rgba(185, 28, 28, 0.25)";
        };
        resetBtn.onmouseleave = () => {
            resetBtn.style.backgroundColor = "rgba(185, 28, 28, 0.15)";
        };
    }

    onOpen(): void {
        if (!this.statistics) {
            this.close();
        }
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
