import GeminiTranscriberPlugin from "main";

// eslint-disable-next-line no-unused-vars
type timeCallback = (formattedTime: string) => void;

export class Stopwatch {
    private timeInSec = 0;
    private callback: timeCallback;
    private intervallID: number | null;
    private plugin: GeminiTranscriberPlugin;

    constructor(callback: timeCallback, plugin: GeminiTranscriberPlugin) {
        this.callback = callback;
        this.plugin = plugin;
    }

    start() {
        this.callback(this.formatTime());
        this.intervallID = this.plugin.registerInterval(
            window.setInterval(() => {
                this.timeInSec++;
                this.callback(this.formatTime());
            }, 1000),
        );
    }

    stop() {
        if (!this.intervallID) {
            return;
        }

        window.clearInterval(this.intervallID);
        this.intervallID = null;
    }

    /**
     * Stops the stopwatch if it is running
     */
    reset() {
        this.stop();
        this.timeInSec = 0;
        this.callback(this.formatTime());
    }

    resetTimerOnly() {
        this.stop();
        this.timeInSec = 0;
    }

    formatTime(): string {
        const seconds = this.timeInSec % 60;
        const minutes = Math.floor((this.timeInSec % 3600) / 60);
        const hours = Math.floor(this.timeInSec / 3600);

        const secondsFormatted = seconds.toString().padStart(2, "0");
        const minuesFormatted = minutes.toString().padStart(2, "0");
        const hoursFormatted = hours.toString().padStart(2, "0");

        return `${hoursFormatted}:${minuesFormatted}:${secondsFormatted}`;
    }
}
