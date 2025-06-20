import GeminiTranscriberPlugin from "main";
import { Notice } from "obsidian";
import { StatisticsModal } from "./statistics";

export function addCommands(plugin: GeminiTranscriberPlugin): void {
    plugin.addCommand({
        id: "start-stop-recording",
        name: "Toggle Recording",
        callback: () => {
            if (plugin.audioRecorder.getState() === undefined) {
                plugin.audioRecorder.startRecording();
                return;
            }

            if (plugin.audioRecorder.getState() !== "inactive") {
                plugin.audioRecorder.stopRecording();
                return;
            }
        },
    });

    plugin.addCommand({
        id: "pause-resume-recording",
        name: "Pause/Resume recording",
        checkCallback: (checking: boolean) => {
            if (plugin.audioRecorder.getState() === "recording") {
                if (!checking) {
                    plugin.audioRecorder.pauseRecording();
                    new Notice("Recording paused");
                }

                return true;
            }

            if (plugin.audioRecorder.getState() === "paused") {
                if (!checking) {
                    plugin.audioRecorder.resumeRecording();
                    new Notice("Recording resumed");
                }

                return true;
            }

            return false;
        },
    });

    plugin.addCommand({
        id: "abort-recording",
        name: "Abort recording",
        checkCallback: (checking: boolean) => {
            if (plugin.audioRecorder.getState() === "recording") {
                if (!checking) {
                    plugin.audioRecorder.abortRecording();
                    new Notice("aborted recording");
                }

                return true;
            }

            return false;
        },
    });

    plugin.addCommand({
        id: "show-statistics",
        name: "Show statistics",
        checkCallback: (checking: boolean) => {
            if (plugin.settings.enableStatistics) {
                if (!checking) {
                    new StatisticsModal(plugin).open();
                }
                return true;
            }
            return false;
        },
    });
}
