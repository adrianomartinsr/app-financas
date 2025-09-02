// src/utils/formatters.js

export const translateStatus = (status) => {
    const translations = {
        paid: 'Pago',
        pending: 'Pendente',
        scheduled: 'Agendado',
    };
    return translations[status] || status;
};

export const translateType = (type) => {
    const translations = {
        income: 'Receita',
        expense: 'Despesa',
    };
    return translations[type] || type;
};

/**
 * MELHORIA: Traduz os tipos de conta.
 */
export const translateAccountType = (type) => {
    const translations = {
        bank: 'Conta Corrente/Poupança',
        credit_card: 'Cartão de Crédito',
    };
    return translations[type] || type;
};

export const formatCurrency = (value) => {
    if (typeof value !== 'number') {
        return 'R$ 0,00';
    }
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
