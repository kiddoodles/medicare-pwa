import { getAIProvider, AIMessage } from './aiClient';

const DISCLAIMER = "\n\n**Disclaimer:** This information is educational only and does not replace medical advice.";

export const diseaseAI = {
    getDiseaseInfo: async (condition: string) => {
        const provider = getAIProvider();

        const messages: AIMessage[] = [
            {
                role: 'system',
                content: `You are a helpful medical educator.
        Explain the medical condition in simple terms for a patient who was just diagnosed.
        
        Include:
        1. **What is it?** (1-2 sentences)
        2. **Key management tips** (Short bullet points)
        
        Avoid scary language. Be supportive.
        Do NOT diagnose or prescribe.`
            },
            {
                role: 'user',
                content: `Explain ${condition}`
            }
        ];

        const response = await provider.chat(messages);

        if (response.text && !response.error) {
            response.text += DISCLAIMER;
        }

        return response;
    }
};
