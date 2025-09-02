// src/views/SchedulingView.jsx
import React, { useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';

const SchedulingView = ({
    transactions,
    forecastedIncomes,
    onAddForecastedIncome,
    onEditForecastedIncome,
    onDeleteForecastedIncome,
    onConfirmForecastedIncome,
    onPayScheduled,
    // NOVO: Recebe a função para cancelar agendamento
    onCancelScheduling
}) => {
    const scheduledExpenses = transactions
        .filter(t => t.status === 'scheduled')
        .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

    const pendingForecastedIncomes = forecastedIncomes
        .filter(i => i.status !== 'received')
        .sort((a, b) => new Date(a.expectedDate) - new Date(b.expectedDate));

    // NOVO: Calcula os totais para o resumo
    const totals = useMemo(() => {
        const totalExpenses = scheduledExpenses.reduce((sum, t) => sum + t.amount, 0);
        const totalIncomes = pendingForecastedIncomes.reduce((sum, i) => sum + i.amount, 0);
        return { totalExpenses, totalIncomes };
    }, [scheduledExpenses, pendingForecastedIncomes]);

    return (
        <div className="space-y-6">
            {/* NOVO: Card de Resumo */}
            <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Resumo dos Agendamentos</h2>
                <div className="flex justify-around text-center">
                    <div>
                        <p className="text-sm text-gray-500">Receitas Previstas</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(totals.totalIncomes)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Despesas Agendadas</p>
                        <p className="text-xl font-bold text-red-600">{formatCurrency(totals.totalExpenses)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Despesas Agendadas</h2>
                    <ul className="divide-y divide-gray-200">
                        {scheduledExpenses.map(t => (
                            <li key={t.id} className="py-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{t.description}</p>
                                        <p className="text-sm text-gray-500">Vence em: {new Date(t.scheduledDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                                    </div>
                                    <p className="font-semibold text-red-600">{formatCurrency(t.amount)}</p>
                                </div>
                                <div className="flex justify-end space-x-3 mt-1">
                                    {/* NOVO: Botão de cancelar agendamento */}
                                    <button onClick={() => onCancelScheduling(t.id)} className="text-sm text-gray-500 hover:underline">Cancelar</button>
                                    <button onClick={() => onPayScheduled(t)} className="text-sm text-blue-500 hover:underline">Pagar agora</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Receitas Previstas</h2>
                        <button onClick={onAddForecastedIncome} className="bg-blue-500 text-white hover:bg-blue-600 font-bold py-2 px-4 rounded-md shadow-sm transition-colors">Adicionar</button>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {pendingForecastedIncomes.map(income => (
                            <li key={income.id} className="py-3 flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{income.description}</p>
                                    <p className="text-sm text-gray-500">Previsto para: {new Date(income.expectedDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-green-600">{formatCurrency(income.amount)}</p>
                                    <div className="flex justify-end space-x-2 mt-1">
                                        <button onClick={() => onConfirmForecastedIncome(income)} className="text-sm text-green-500 hover:underline">Confirmar</button>
                                        <button onClick={() => onEditForecastedIncome(income)} className="text-sm text-indigo-500 hover:underline">Editar</button>
                                        <button onClick={() => onDeleteForecastedIncome(income.id)} className="text-sm text-red-500 hover:underline">Excluir</button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SchedulingView;
