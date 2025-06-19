import GeminiTranscriberPlugin from "main";
import { Stopwatch } from "./stopwatch";

const Colors = {
    Ready: "green",
    Recording: "red",
    Paused: "yellow",
    Processing: "orange",
} as const;

export class StatusBar {
    private statusBarItem: HTMLElement;
    private spanElem: HTMLSpanElement;
    private stopwatch: Stopwatch;

    constructor(plugin: GeminiTranscriberPlugin) {
        this.stopwatch = new Stopwatch((time) => {
            this.setRecordingTime(time);
        });

        this.statusBarItem = plugin.addStatusBarItem();
        this.spanElem = this.statusBarItem.createEl("span", {});
        this.spanElem.setCssStyles({ fontSize: "1.2em" });
        this.setReady();
    }

    setReady() {
        this.spanElem.textContent = "transcriber ready";
        this.spanElem.setCssStyles({ color: Colors.Ready });
        this.stopwatch.resetTimerOnly();
        this.stopwatch.stop();
    }

    setRecording() {
        this.spanElem.setCssStyles({ color: Colors.Recording });
        this.stopwatch.start();
    }

    private setRecordingTime(time: string): void {
        this.spanElem.textContent = "rec: " + time;
    }

    setPaused() {
        this.spanElem.textContent = "paused";
        this.spanElem.setCssStyles({ color: Colors.Paused });
        this.stopwatch.stop();
    }

    setProcessing() {
        this.spanElem.textContent = "processing";
        this.spanElem.setCssStyles({ color: Colors.Processing });
        this.stopwatch.stop();
    }
}
