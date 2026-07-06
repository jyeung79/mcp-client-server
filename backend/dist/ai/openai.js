import OpenAI from "openai";
export class OpenAIAdapter {
    client;
    constructor(apiKey) {
        this.client = new OpenAI({ apiKey });
    }
    async streamChat(messages, tools, onChunk) {
        const openaiTools = tools.map((t) => ({
            type: "function",
            function: {
                name: t.name,
                description: t.description,
                parameters: t.inputSchema,
            },
        }));
        const stream = await this.client.chat.completions.create({
            model: "gpt-4o",
            messages: messages.map((m) => {
                if (m.role === "tool") {
                    return {
                        role: "tool",
                        tool_call_id: m.toolCallId,
                        content: m.content,
                    };
                }
                if (m.role === "assistant" && m.assistantToolCalls?.length) {
                    return {
                        role: "assistant",
                        content: m.content || null,
                        tool_calls: m.assistantToolCalls.map((tc) => ({
                            id: tc.id,
                            type: "function",
                            function: {
                                name: tc.name,
                                arguments: JSON.stringify(tc.arguments),
                            },
                        })),
                    };
                }
                return {
                    role: m.role,
                    content: m.content,
                };
            }),
            tools: openaiTools.length > 0 ? openaiTools : undefined,
            stream: true,
        });
        let fullContent = "";
        const toolCallsMap = new Map();
        const toolCalls = [];
        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;
            // Handle text content
            if (delta?.content) {
                fullContent += delta.content;
                onChunk(delta.content);
            }
            // Accumulate tool call deltas
            if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                    const index = tc.index;
                    if (!toolCallsMap.has(index)) {
                        toolCallsMap.set(index, { id: "", name: "", arguments: "" });
                    }
                    const acc = toolCallsMap.get(index);
                    if (tc.id)
                        acc.id = tc.id;
                    if (tc.function?.name)
                        acc.name += tc.function.name;
                    if (tc.function?.arguments)
                        acc.arguments += tc.function.arguments;
                }
            }
        }
        // Parse accumulated tool calls
        for (const [, tc] of toolCallsMap) {
            let parsedArgs = {};
            try {
                parsedArgs = JSON.parse(tc.arguments);
            }
            catch {
                parsedArgs = {};
            }
            toolCalls.push({
                id: tc.id,
                name: tc.name,
                arguments: parsedArgs,
            });
        }
        return { content: fullContent, toolCalls };
    }
}
//# sourceMappingURL=openai.js.map