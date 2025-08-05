import { Notice } from "obsidian";

export async function openFilePicker(
    validFileExtensions: string[],
): Promise<File | null> {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = validFileExtensions.join(", ");
        input.addEventListener("change", () => {
            const files = input.files;
            input.remove();

            if (!files || files.length === 0) {
                resolve(null);
                return;
            }

            const file = files[0];
            const extension = file.name
                .slice(file.name.lastIndexOf("."))
                .toLowerCase();
            if (!validFileExtensions.includes(extension)) {
                new Notice("Invalid file type: " + extension);
                resolve(null);
                return;
            }

            resolve(file);
        });

        input.click();
    });
}
