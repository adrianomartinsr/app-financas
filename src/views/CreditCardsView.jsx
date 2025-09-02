// src/views/CreditCardsView.jsx
import React from 'react';

const CreditCardsView = ({
    accounts,
    transactions,
    categories,
    onAddExpenseClick,
    onEditTransaction,
    onDeleteTransaction,
    onPayTransaction,
    onScheduleTransaction
}) => {
    const creditCards = accounts.filter(acc => acc.type === 'credit_card');

    const getCardTransactions = (cardId) => {
        return transactions
            .filter(t => t.accountId === cardId && t.status === 'pending')
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const getCardTotal = (cardId) => {
        return getCardTransactions(cardId).reduce((sum, t) => sum + t.amount, 0);
    };
    
    const getCategoryName = (id) => categories.find(c => c.id === id)?.name || 'N/A';

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Meus Cartões de Crédito</h2>
            {creditCards.length > 0 ? creditCards.map(card => (
                <div key={card.id} className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{card.name}</h3>
                            <p className="text-red-600 font-semibold">
                                Fatura Aberta: {getCardTotal(card.id).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                        <button onClick={() => onAddExpenseClick(card)} className="btn-primary">Adicionar Despesa</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {getCardTransactions(card.id).map(t => (
                                    <tr key={t.id}>
                                        <td className="px-4 py-2 whitespace-nowrap">{new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{t.description}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{getCategoryName(t.categoryId)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-red-600">{t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm">
                                            <button onClick={() => onEditTransaction(t)} className="text-indigo-600 hover:text-indigo-900 mr-2">Editar</button>
                                            <button onClick={() => onDeleteTransaction(t.id)} className="text-red-600 hover:text-red-900">Excluir</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )) : (
                <div className="bg-white p-6 rounded-lg shadow text-center">
                    <p className="text-gray-500">Nenhum cartão de crédito cadastrado.</p>
                </div>
            )}
        </div>
    );
};

export default CreditCardsView;
