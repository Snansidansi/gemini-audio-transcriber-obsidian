import { requestUrl } from "obsidian";

export const OPENROUTER_API_BASE = "https://openrouter.ai/api/v1";

export interface OpenRouterModelInfo {
    id: string;
    name: string;
    isStt: boolean;
    reasoningEfforts?: string[];
    defaultReasoningEffort?: string;
    hasReasoningMetadata?: boolean;
}

export interface OpenRouterModelCache {
    fetchedAt: number;
    models: OpenRouterModelInfo[];
    includesReasoningMetadata?: boolean;
}

interface RawModel {
    id: string;
    name: string;
    architecture?: {
        input_modalities?: string[];
        output_modalities?: string[];
    };
    reasoning?: {
        supported_efforts?: string[] | null;
        default_effort?: string;
        mandatory?: boolean;
    };
}

interface RawEndpointsResponse {
    data?: {
        endpoints?: {
            provider_name?: string;
        }[];
    };
}

function isSttModel(raw: RawModel): boolean {
    return (raw.architecture?.output_modalities ?? []).includes(
        "transcription",
    );
}

function reasoningInfo(raw: RawModel): Pick<
    OpenRouterModelInfo,
    "reasoningEfforts" | "defaultReasoningEffort" | "hasReasoningMetadata"
> {
    const reasoning = raw.reasoning;
    if (!reasoning) {
        return {};
    }

    const supportedEfforts = reasoning.supported_efforts;
    let reasoningEfforts: string[] | undefined;

    if (Array.isArray(supportedEfforts)) {
        reasoningEfforts = reasoning.mandatory
            ? supportedEfforts.filter((effort) => effort !== "none")
            : supportedEfforts;
    } else if (supportedEfforts === null) {
        reasoningEfforts = [
            "max",
            "xhigh",
            "high",
            "medium",
            "low",
            "minimal",
            ...(reasoning.mandatory ? [] : ["none"]),
        ];
    }

    return {
        reasoningEfforts,
        defaultReasoningEffort: reasoning.default_effort,
        hasReasoningMetadata: true,
    };
}

async function fetchModels(query: string): Promise<RawModel[]> {
    const response = await requestUrl({
        url: `${OPENROUTER_API_BASE}/models?${query}`,
    });

    const data = response.json as { data?: RawModel[] };
    return data.data ?? [];
}

/**
 * Fetches all audio-capable models: chat models that accept audio input plus
 * dedicated STT models (output modality "transcription").
 */
export async function fetchAudioModels(): Promise<OpenRouterModelInfo[]> {
    const [chatRaw, sttRaw] = await Promise.all([
        fetchModels("input_modalities=audio&limit=1000"),
        fetchModels("output_modalities=transcription&limit=1000"),
    ]);

    const models = new Map<string, OpenRouterModelInfo>();

    for (const raw of chatRaw) {
        if (isSttModel(raw)) {
            continue;
        }
        models.set(raw.id, {
            id: raw.id,
            name: raw.name,
            isStt: false,
            ...reasoningInfo(raw),
        });
    }

    for (const raw of sttRaw) {
        models.set(raw.id, { id: raw.id, name: raw.name, isStt: true });
    }

    return Array.from(models.values()).sort((a, b) =>
        a.id.localeCompare(b.id),
    );
}

/**
 * Fetches OpenRouter models that accept and return text, excluding STT models.
 */
export async function fetchTextModels(): Promise<OpenRouterModelInfo[]> {
    const rawModels = await fetchModels("output_modalities=text&limit=1000");

    return rawModels
        .filter(
            (raw) =>
                !isSttModel(raw) &&
                (raw.architecture?.input_modalities ?? []).includes("text") &&
                (raw.architecture?.output_modalities ?? []).includes("text"),
        )
        .map((raw) => ({
            id: raw.id,
            name: raw.name,
            isStt: false,
            ...reasoningInfo(raw),
        }))
        .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Returns the provider names that serve the given model, in the default
 * routing order reported by OpenRouter. Used as options for provider ranking.
 */
export async function fetchModelProviders(
    modelId: string,
): Promise<string[]> {
    const response = await requestUrl({
        url: `${OPENROUTER_API_BASE}/models/${modelId}/endpoints`,
    });

    const data = response.json as RawEndpointsResponse;
    const endpoints = data.data?.endpoints ?? [];

    const names: string[] = [];
    for (const endpoint of endpoints) {
        const name = endpoint.provider_name;
        if (name && !names.includes(name)) {
            names.push(name);
        }
    }

    return names;
}
