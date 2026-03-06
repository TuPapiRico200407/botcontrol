/**
 * LLMProvider abstraction.
 * All LLM providers must implement this interface.
 */
export interface LLMProvider {
    complete(prompt: string, systemPrompt?: string): Promise<string>;
}

/**
 * CerebrasProvider skeleton.
 * Reads API key from environment variable CEREBRAS_API_KEY.
 * Full implementation pending.
 */
export class CerebrasProvider implements LLMProvider {
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model = 'llama3.1-8b') {
        if (!apiKey) {
            throw new Error('CEREBRAS_API_KEY environment variable is required');
        }
        this.apiKey = apiKey;
        this.model = model;
    }

    async complete(prompt: string, systemPrompt = 'You are a helpful assistant.'): Promise<string> {
        const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
            }),
        });

        if (!response.ok) {
            throw new Error(`Cerebras API error: ${response.status} ${await response.text()}`);
        }

        const data = await response.json() as { choices: { message: { content: string } }[] };
        return data.choices[0].message.content;
    }
}
