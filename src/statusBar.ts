import GeminiTranscriberPlugin from "main";

const Colors = {
    Ready: "green",
    Recording: "yellow",
    Paused: "orange",
    Processing: "red",
} as const;

export class StatusBar {
    private statusBarItem: HTMLElement;
    private spanElem: HTMLSpanElement;

    constructor(plugin: GeminiTranscriberPlugin) {
        this.statusBarItem = plugin.addStatusBarItem();
        this.spanElem = this.statusBarItem.createEl("span", {});
        this.spanElem.setCssStyles({ fontSize: "1.2em" });
        this.setReady();
    }

    setReady() {
        this.spanElem.textContent = "transcriber ready";
        this.spanElem.setCssStyles({ color: Colors.Ready });
    }

    setRecording() {
        this.spanElem.textContent = "recording";
        this.spanElem.setCssStyles({ color: Colors.Recording });
    }

    setPaused() {
        this.spanElem.textContent = "paused";
        this.spanElem.setCssStyles({ color: Colors.Paused });
    }

    setProcessing() {
        this.spanElem.textContent = "processing";
        this.spanElem.setCssStyles({ color: Colors.Processing });
    }
}
