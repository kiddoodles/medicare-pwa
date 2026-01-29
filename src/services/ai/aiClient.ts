export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AIResponse {
    text: string;
    error?: string;
}

export interface AIProvider {
    chat(messages: AIMessage[]): Promise<AIResponse>;
}

// OpenAI Provider Implementation
class OpenAIProvider implements AIProvider {
    private apiKey: string;
    private baseUrl: string;
    private model: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.openai.com/v1/chat/completions';
        this.model = 'gpt-4o-mini';
    }

    async chat(messages: AIMessage[]): Promise<AIResponse> {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `OpenAI Request Failed: ${response.statusText}`);
            }

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content || '';

            return { text };
        } catch (error: any) {
            console.error('AI Service Error:', error);
            return {
                text: "I'm sorry, I'm having trouble connecting to the AI service right now. Please check your internet connection or try again later.",
                error: error.message || 'Failed to get AI response'
            };
        }
    }
}

// Mock Provider (Only used if no API Key is provided)
class MockProvider implements AIProvider {
    async chat(_messages: AIMessage[]): Promise<AIResponse> {
        return {
            text: "The AI assistant is currently offline because the API key is missing. Please configure VITE_OPENAI_API_KEY in your .env file to enable this feature.",
        };
    }
}

// Factory to get the configured provider
// Gemini Provider Implementation
class GeminiProvider implements AIProvider {
    private apiKey: string;
    private baseUrl: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        // Using Gemini 2.0 Flash as it is available for this user's key
        this.baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
    }

    async chat(messages: AIMessage[]): Promise<AIResponse> {
        try {
            // Convert messages to Gemini format
            // System messages are not directly supported in 'contents' for all endpoints, 
            // so we'll prepend them to the first user message or use logic to handle them.
            // Simplified approach: Concatenate system prompt with first user message.

            let systemInstruction = "";
            const geminiContentParts: { text: string }[] = [];

            messages.forEach(msg => {
                if (msg.role === 'system') {
                    systemInstruction += `${msg.content}\n\n`;
                } else if (msg.role === 'user') {
                    geminiContentParts.push({ text: (systemInstruction + msg.content).trim() });
                    systemInstruction = ""; // Clear after prepending
                } else {
                    geminiContentParts.push({ text: msg.content });
                }
            });

            // If system instruction is still there (e.g. only system prompt), push it.
            if (systemInstruction) {
                geminiContentParts.push({ text: systemInstruction.trim() });
            }

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: geminiContentParts
                    }]
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Gemini Request Failed: ${response.statusText}`);
            }

            const data = await response.json();

            // Gemini response structure
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            return { text };

        } catch (error: any) {
            console.error('Gemini Service Error:', error);
            return {
                text: "I'm having trouble connecting to the AI service. Please check your internet connection.",
                error: error.message || 'Failed to fetch from Gemini'
            };
        }
    }
}

// Factory to get the configured provider
export const getAIProvider = (): AIProvider => {
    // 1. Check for OpenAI API Key (Primary)
    const openAIKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (openAIKey && typeof openAIKey === 'string' && openAIKey.length > 5) { // Simple length check
        // Check if it's actually a Gemini key incorrectly assigned to OpenAI var (starts with AIza)
        if (openAIKey.startsWith('AIza')) {
            console.warn('VITE_OPENAI_API_KEY appears to be a Google Gemini key. switching to GeminiProvider.');
            return new GeminiProvider(openAIKey);
        }
        console.log('Using OpenAI Provider');
        return new OpenAIProvider(openAIKey);
    }

    // 2. Check for Gemini API Key (Secondary)
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (geminiKey && typeof geminiKey === 'string' && geminiKey.length > 0) {
        console.log('Using Gemini Provider');
        return new GeminiProvider(geminiKey);
    }

    console.warn('No valid AI API Key found. Using Mock Provider.');
    // Fallback to MockProvider only if no key
    return new MockProvider();
};