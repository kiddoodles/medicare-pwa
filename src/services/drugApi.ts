export interface DrugLabel {
    brand_name: string;
    generic_name: string;
    adverse_reactions?: string[];
    drug_interactions?: string[];
    contraindications?: string[];
    indications_and_usage?: string[];
    boxed_warning?: string[];
}

const BASE_URL = 'https://api.fda.gov/drug/label.json';

export const drugApi = {
    searchDrugLabel: async (query: string): Promise<DrugLabel | null> => {
        try {
            // Search by brand_name first. We use quotes for exact phrase match if possible, 
            // but simple search is safer for general queries.
            // Limit 1 to get the most relevant result.
            const url = `${BASE_URL}?search=openfda.brand_name:"${encodeURIComponent(query)}"&limit=1`;

            const response = await fetch(url);

            if (response.status === 404) {
                return null; // Not found
            }

            if (!response.ok) {
                throw new Error('Failed to fetch drug data');
            }

            const data = await response.json();
            const result = data.results?.[0];

            if (!result) return null;

            return {
                brand_name: result.openfda?.brand_name?.[0] || query,
                generic_name: result.openfda?.generic_name?.[0] || '',
                adverse_reactions: result.adverse_reactions,
                drug_interactions: result.drug_interactions,
                contraindications: result.contraindications,
                indications_and_usage: result.indications_and_usage,
                boxed_warning: result.boxed_warning,
            };

        } catch (error) {
            console.error('OpenFDA API Error:', error);
            throw error;
        }
    }
};
