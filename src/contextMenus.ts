import GeminiTranscriberPlugin from "main";
import { Notice } from "obsidian";
import { Transcriber } from "./transcriber";

export function addContextMenus(plugin: GeminiTranscriberPlugin) {
    plugin.registerEvent(
        plugin.app.workspace.on("file-menu", (menu, file) => {
            const filetypes = Transcriber.validFileFormats.join("|");
            const regex = new RegExp(`.+\\.(${filetypes})`);
            if (!regex.test(file.name)) {
                return;
            }

            menu.addItem((item) => {
                item.setTitle("Transcribe audio")
                    .setIcon("microphone-filled")
                    .onClick(async () => {
                        const fileExtension = file.name.split(".").pop();
                        const mimeType = "audio/" + fileExtension;

                        const arrayBuffer =
                            await plugin.app.vault.adapter.readBinary(
                                file.path,
                            );
                        const blob = new Blob([arrayBuffer], {
                            type: mimeType,
                        });

                        plugin.transcriber.transcribe(blob, file.name);
                    });
            });
        }),
    );
}
