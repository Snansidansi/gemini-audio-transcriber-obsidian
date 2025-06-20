import GeminiTranscriberPlugin from "main";
import { Stopwatch } from "./stopwatch";

type status = "ready" | "recording" | "pause" | "processing";

export class StatusBar {
    private statusBarItem: HTMLElement;
    private spanElem: HTMLSpanElement;
    private stopwatch: Stopwatch;
    private status: status;
    private plugin: GeminiTranscriberPlugin;

    constructor(plugin: GeminiTranscriberPlugin) {
        this.stopwatch = new Stopwatch((time) => {
            this.setRecordingTime(time);
        }, plugin);

        this.plugin = plugin;
        this.statusBarItem = plugin.addStatusBarItem();
        this.spanElem = this.statusBarItem.createEl("span", {});
        this.spanElem.setCssStyles({ fontSize: "1.2em" });

        this.setStatus("ready");
    }

    reloadStatus() {
        this.setStatus(this.status);
    }

    setStatus(status: status) {
        this.status = status;
        switch (this.status) {
            case "ready":
                this.setReady();
                break;
            case "recording":
                this.setRecording();
                break;
            case "pause":
                this.setPause();
                break;
            case "processing":
                this.setProcessing();
                break;
        }
    }

    private setReady() {
        this.stopwatch.stop();
        this.spanElem.textContent = "transcriber ready";
        this.spanElem.setCssStyles({
            color: this.plugin.settings.statusbarColorReady,
        });
        this.stopwatch.resetTimerOnly();
    }

    private setRecording() {
        this.stopwatch.start();
        this.spanElem.setCssStyles({
            color: this.plugin.settings.statusbarColorRecording,
        });
    }

    private setPause() {
        this.stopwatch.stop();
        this.spanElem.textContent = "paused";
        this.spanElem.setCssStyles({
            color: this.plugin.settings.statusbarColorPause,
        });
    }

    private setProcessing() {
        this.stopwatch.stop();
        this.spanElem.textContent = "processing";
        this.spanElem.setCssStyles({
            color: this.plugin.settings.statusbarColorProcessing,
        });
    }

    private setRecordingTime(time: string): void {
        this.spanElem.textContent = "rec: " + time;
    }
}
