import { useState } from 'react';
import { medicationAI } from '@/services/ai/medicationAI';
import { diseaseAI } from '@/services/ai/diseaseAI';
import { counsellingAI } from '@/services/ai/counsellingAI';
import { AIResponse } from '@/services/ai/aiClient';

export const useMedicationAI = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<string | null>(null);

    const getInfo = async (name: string) => {
        setLoading(true);
        setError(null);
        try {
            const response: AIResponse = await medicationAI.getMedicationInfo(name);
            if (response.error) throw new Error(response.error);
            setData(response.text);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch medication info');
        } finally {
            setLoading(false);
        }
    };

    return { getInfo, data, loading, error, clear: () => setData(null) };
};

export const useDiseaseAI = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<string | null>(null);

    const getInfo = async (condition: string) => {
        setLoading(true);
        setError(null);
        try {
            const response: AIResponse = await diseaseAI.getDiseaseInfo(condition);
            if (response.error) throw new Error(response.error);
            setData(response.text);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch disease info');
        } finally {
            setLoading(false);
        }
    };

    return { getInfo, data, loading, error, clear: () => setData(null) };
};

export const useCounsellingAI = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<string | null>(null);

    const sendMessage = async (message: string) => {
        setLoading(true);
        setError(null);
        try {
            const res: AIResponse = await counsellingAI.getCounsellingResponse(message);
            if (res.error) throw new Error(res.error);
            setResponse(res.text);
        } catch (err: any) {
            setError(err.message || 'Failed to get support');
        } finally {
            setLoading(false);
        }
    };

    return { sendMessage, response, loading, error, clear: () => setResponse(null) };
};
