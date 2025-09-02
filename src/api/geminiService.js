// src/api/geminiService.js

const callGeminiAPI = async (payload, retries = 3, delay = 1000) => {
    // MELHORIA: Lê a chave da API das variáveis de ambiente.
    // Certifique-se de ter um arquivo .env.local com VITE_GEMINI_API_KEY=sua_chave
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        console.error("Chave da API do Gemini não encontrada. Verifique seu arquivo .env.local");
        throw new Error("API Key não configurada.");
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            if (response.status === 429 && retries > 0) {
                await new Promise(res => setTimeout(res, delay));
                return callGeminiAPI(payload, retries - 1, delay * 2);
            }
            // Fornece mais detalhes do erro no console para depuração
            const errorBody = await response.text();
            console.error("Erro da API Gemini:", response.status, errorBody);
            throw new Error(`API Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        if (retries > 0) {
            await new Promise(res => setTimeout(res, delay));
            return callGeminiAPI(payload, retries - 1, delay * 2);
        }
        console.error("Falha ao chamar a API Gemini após múltiplas tentativas:", error);
        throw error;
    }
};

// A função getFinancialAnalysis permanece a mesma
export const getFinancialAnalysis = async (transactions, categories) => {
    const recentTransactions = transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 30)
        .map(t => {
            const categoryName = categories.find(c => c.id === t.categoryId)?.name || 'N/A';
            return `${t.date} - ${t.description}: R$ ${t.amount} (${categoryName} - ${t.type === 'income' ? 'Receita' : 'Despesa'})`;
        }).join('\n');

    if (!recentTransactions) {
        return "Não há transações suficientes para uma análise. Adicione mais algumas e tente novamente.";
    }

    const prompt = `
        Você é um consultor financeiro amigável e prestativo. Analise a seguinte lista de transações financeiras de um usuário.
        
        Transações:
        ${recentTransactions}

        Com base nessas transações, forneça uma análise curta e objetiva em português. Siga estritamente este formato:
        1.  **Resumo Geral:** Um parágrafo curto sobre os hábitos de gasto gerais.
        2.  **Principais Despesas:** Liste as 3 principais categorias de despesas.
        3.  **Dicas para Economizar:** Ofereça 2 dicas práticas e acionáveis para o usuário economizar dinheiro com base nos seus gastos.
        4.  **Ponto Positivo:** Mencione um ponto positivo, como uma fonte de receita consistente ou gastos controlados em alguma área.
    `;

    try {
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        const result = await callGeminiAPI(payload);

        if (result && result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
            return result.candidates[0].content.parts[0].text;
        } else {
            console.error("Formato de resposta inesperado da API Gemini:", result);
            throw new Error("Resposta da API inválida.");
        }
    } catch (error) {
        console.error("Erro ao gerar análise financeira:", error);
        return "Desculpe, não foi possível gerar a análise no momento. Tente novamente mais tarde.";
    }
};
