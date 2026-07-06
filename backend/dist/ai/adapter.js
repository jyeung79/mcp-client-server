/**
 * Factory to create the appropriate AI adapter.
 */
export function createAdapter(provider, apiKey) {
    switch (provider) {
        case "openai":
            return createOpenAIAdapter(apiKey);
        case "anthropic":
            return createAnthropicAdapter(apiKey);
        default: {
            const _exhaustive = provider;
            throw new Error(`Unsupported provider: ${_exhaustive}`);
        }
    }
}
// Lazy imports to avoid loading unused SDKs
function createOpenAIAdapter(apiKey) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { OpenAIAdapter } = require("./openai.js");
    return new OpenAIAdapter(apiKey);
}
function createAnthropicAdapter(apiKey) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AnthropicAdapter } = require("./anthropic.js");
    return new AnthropicAdapter(apiKey);
}
//# sourceMappingURL=adapter.js.map