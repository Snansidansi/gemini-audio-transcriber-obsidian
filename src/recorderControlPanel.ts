import GeminiTranscriberPlugin from "main";
import { Modal, Notice } from "obsidian";
import { Stopwatch } from "./stopwatch";

export class RecorderControlPanel extends Modal {
    private plugin: GeminiTranscriberPlugin;
    private stopwatchEl: HTMLDivElement;
    private startStopBtn: HTMLButtonElement;
    private abortBtn: HTMLButtonElement;
    private pauseResumeBtn: HTMLButtonElement;
    private stopwatch: Stopwatch;

    constructor(plugin: GeminiTranscriberPlugin) {
        super(plugin.app);
        this.plugin = plugin;
        this.stopwatch = new Stopwatch(this.updateStopwatchDisplay.bind(this));

        if (this.plugin.audioRecorder.getState() !== "inactive") {
            new Notice("Please stop your current recording first.");
            return;
        }

        // Set entire modal size
        this.modalEl.setCssStyles({
            width: "fit-content",
        });

        this.contentEl.setCssStyles({
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        });

        this.stopwatchEl = this.contentEl.createDiv();
        this.updateStopwatchDisplay(this.stopwatch.formatTime());

        this.createButtonDiv();
    }

    private createButtonDiv() {
        const buttonDiv = this.contentEl.createDiv();
        buttonDiv.setCssStyles({
            display: "flex",
            justifyContent: "space-between",
            width: "fit-content",
            marginTop: "1rem",
            gap: "0.5rem",
        });

        this.startStopBtn = buttonDiv.createEl("button", { text: "Start" });
        this.startStopBtn.onClickEvent(() => {
            this.handleStartStop();
        });

        this.pauseResumeBtn = buttonDiv.createEl("button", { text: "Pause" });
        this.pauseResumeBtn.onClickEvent(() => {
            this.handlePauseResume();
        });
        this.pauseResumeBtn.disabled = true;

        this.abortBtn = buttonDiv.createEl("button", { text: "Abort" });
        this.abortBtn.onClickEvent(() => {
            this.handleAbort();
        });
        this.abortBtn.disabled = true;
    }

    private handleStartStop(): void {
        if (this.plugin.audioRecorder.getState() === "inactive") {
            this.plugin.audioRecorder.startRecording();
            this.startStopBtn.setText("Stop");
            this.pauseResumeBtn.disabled = false;
            this.abortBtn.disabled = false;
            this.stopwatch.start();
            return;
        }

        this.plugin.audioRecorder.stopRecording();
        this.startStopBtn.setText("Start");
        this.pauseResumeBtn.disabled = true;
        this.stopwatch.reset();
    }

    onClose(): void {
        if (this.plugin.audioRecorder.getState() === "inactive") {
            return;
        }

        this.plugin.audioRecorder.stopRecording();
        this.stopwatch.stop();
    }

    private handlePauseResume(): void {
        if (this.plugin.audioRecorder.getState() === "recording") {
            this.plugin.audioRecorder.pauseRecording();
            this.pauseResumeBtn.setText("Resume");
            this.stopwatch.stop();
            return;
        }

        this.plugin.audioRecorder.resumeRecording();
        this.pauseResumeBtn.setText("Pause");
        this.stopwatch.start();
    }

    private handleAbort(): void {
        if (this.plugin.audioRecorder.getState() === "inactive") {
            return;
        }

        this.plugin.audioRecorder.abortRecording();
        this.abortBtn.disabled = true;
        this.startStopBtn.setText("Start");
        this.pauseResumeBtn.setText("Pause");
        this.pauseResumeBtn.disabled = true;
        this.stopwatch.reset();
    }

    private updateStopwatchDisplay(time: string): void {
        this.stopwatchEl.setText(time);
    }
}
