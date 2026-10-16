export interface TranscriptionProvider {
    readonly displayName: string;

    reloadApiKey(): void;

    isConfigured(): boolean;

    /**
     * Transcribes the given audio blob and returns the transcript as plain text.
     * Implementations must handle their own resource cleanup (e.g. deleting
     * uploaded files) before resolving or rejecting.
     */
    transcribe(blob: Blob): Promise<string>;
}
