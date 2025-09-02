// src/views/TransactionsView.jsx
import React from 'react';
import { translateStatus, formatCurrency } from '../utils/formatters';

const TransactionsView = ({
    transactions,
    categories,
    onAddClick,
    onEditClick,
    onDeleteClick,
    onPayClick,
    onScheduleClick,
    onImportClick,
    onDownloadTemplateClick,
    uniqueMonths,
    selectedMonth,
    setSelectedMonth,
    transactionTotals,
    onUndoPayment,
    // NOVO: Props para os novos filtros e ordenação
    sortBy,
    setSortBy,
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory
}) => {
    const getCategoryName = (id) => categories.find(c => c.id === id)?.name || 'N/A';
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    const actionButtons = (t) => (
        <div className="flex justify-end items-center space-x-2 mt-2 md:mt-0">
            {t.status === 'pending' && <button onClick={() => onPayClick(t)} className="text-green-600 hover:text-green-900 text-sm font-medium">Pagar</button>}
            {t.status === 'pending' && <button onClick={() => onScheduleClick(t)} className="text-yellow-600 hover:text-yellow-900 text-sm font-medium">Agendar</button>}
            {t.status === 'paid' && t.type === 'expense' && <button onClick={() => onUndoPayment(t.id)} className="text-gray-500 hover:text-gray-800 text-sm font-medium">Desfazer</button>}
            <button onClick={() => onEditClick(t)} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">Editar</button>
            <button onClick={() => onDeleteClick(t.id)} className="text-red-600 hover:text-red-900 text-sm font-medium">Excluir</button>
        </div>
    );

    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-2 sm:mb-0">Transações</h2>
                <div className="flex space-x-2">
                    <button onClick={onDownloadTemplateClick} className="bg-gray-200 text-gray-800 hover:bg-gray-300 font-bold py-2 px-4 rounded-md shadow-sm transition-colors text-sm">Baixar Modelo</button>
                    <button onClick={onImportClick} className="bg-gray-200 text-gray-800 hover:bg-gray-300 font-bold py-2 px-4 rounded-md shadow-sm transition-colors text-sm">Importar</button>
                    <button onClick={onAddClick} className="bg-blue-500 text-white hover:bg-blue-600 font-bold py-2 px-4 rounded-md shadow-sm transition-colors text-sm">Adicionar</button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-1 sm:space-y-0 sm:space-x-6 mb-4 text-sm text-gray-600">
                <span>Receitas: <strong className="text-green-600">{formatCurrency(transactionTotals.income)}</strong></span>
                <span>Despesas: <strong className="text-red-600">{formatCurrency(transactionTotals.expense)}</strong></span>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                 <button onClick={() => setSelectedMonth('all')} className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedMonth === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>Todos</button>
                {uniqueMonths.map(month => (
                    <button key={month.value} onClick={() => setSelectedMonth(month.value)} className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedMonth === month.value ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{month.label}</button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                    <label htmlFor="filterCategory" className="block text-sm font-medium text-gray-700">Filtrar por Categoria</label>
                    <select id="filterCategory" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="mt-1 block w-full input">
                        <option value="all">Todas as Categorias</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700">Filtrar por Status</label>
                    <select id="filterStatus" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="mt-1 block w-full input">
                        <option value="all">Todos os Status</option>
                        <option value="paid">Pago</option>
                        <option value="pending">Pendente</option>
                        <option value="scheduled">Agendado</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">Ordenar por</label>
                    <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="mt-1 block w-full input">
                        <option value="date-desc">Data (Mais Recente)</option>
                        <option value="date-asc">Data (Mais Antiga)</option>
                        <option value="amount-desc">Valor (Maior para Menor)</option>
                        <option value="amount-asc">Valor (Menor para Maior)</option>
                    </select>
                </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map(t => (
                            <tr key={t.id} className={t.status === 'paid' ? 'bg-green-50' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap">{formatDate(t.date)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {t.description}
                                    {t.status === 'paid' && t.paymentInfo?.paymentDate && <div className="text-xs text-gray-500">Pago em: {formatDate(t.paymentInfo.paymentDate)}</div>}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(t.amount)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{getCategoryName(t.categoryId)}</td>
                                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.status === 'paid' ? 'bg-green-100 text-green-800' : t.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{translateStatus(t.status)}</span></td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">{actionButtons(t)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="md:hidden space-y-3">
                {transactions.map(t => (
                    <div key={t.id} className={`p-4 rounded-lg border ${t.status === 'paid' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                        <div className="flex justify-between items-start">
                            <span className="font-bold text-gray-800">{t.description}</span>
                            <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(t.amount)}</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">{formatDate(t.date)}</div>
                        <div className="flex justify-between items-center mt-3 text-sm">
                            <span>{getCategoryName(t.categoryId)}</span>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.status === 'paid' ? 'bg-green-100 text-green-800' : t.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{translateStatus(t.status)}</span>
                        </div>
                        {t.status === 'paid' && t.paymentInfo?.paymentDate && <div className="text-xs text-gray-500 mt-1">Pago em: {formatDate(t.paymentInfo.paymentDate)}</div>}
                        <div className="border-t mt-3 pt-2">{actionButtons(t)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TransactionsView;
