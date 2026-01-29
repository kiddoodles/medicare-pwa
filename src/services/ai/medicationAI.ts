import { getAIProvider, AIMessage } from './aiClient';

const DISCLAIMER = "\n\n**Disclaimer:** This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with your doctor.";

export const medicationAI = {
    getMedicationInfo: async (medicationName: string) => {
        const provider = getAIProvider();

        const messages: AIMessage[] = [
            {
                role: 'system',
                content: `You are a helpful medical assistant. 
        Your goal is to explain medications in simple, easy-to-understand language.
        
        For the requested medication, provide:
        1. **What it is**: Simple explanation.
        2. **How to take it**: General common practices (e.g. with food, empty stomach).
        3. **Common Side Effects**: List 3-4 common ones.
        
        Do NOT give dosage advice.
        Do NOT diagnose.
        Keep it brief (under 150 words).`
            },
            {
                role: 'user',
                content: `Tell me about ${medicationName}`
            }
        ];

        const response = await provider.chat(messages);

        // Ensure disclaimer is present if valid response
        if (response.text && !response.error) {
            response.text += DISCLAIMER;
        }

        return response;
    }
};
