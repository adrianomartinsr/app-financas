// src/components/modals/TransactionModal.jsx
import React, { useState, useEffect } from 'react';

const TransactionModal = ({ onClose, onSubmit, transaction, categories, accounts }) => {
    const [formData, setFormData] = useState({
        type: 'expense',
        description: '',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        categoryId: '',
        accountId: '',
        status: 'pending',
    });

    useEffect(() => {
        if (transaction) {
            setFormData({
                type: transaction.type || 'expense',
                description: transaction.description || '',
                amount: transaction.amount || '',
                date: transaction.date || new Date().toISOString().slice(0, 10),
                categoryId: transaction.categoryId || '',
                accountId: transaction.accountId || '',
                status: transaction.status || 'pending',
            });
        }
    }, [transaction]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ ...formData, amount: parseFloat(formData.amount) });
        onClose();
    };

    const filteredCategories = categories.filter(c => c.type === formData.type);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">{transaction ? 'Editar' : 'Adicionar'} Transação</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campos do formulário: description, amount, date, etc. */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
                        <input type="text" name="description" value={formData.description} onChange={handleChange} required className="mt-1 block w-full input"/>
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Valor</label>
                        <input type="number" name="amount" value={formData.amount} onChange={handleChange} required className="mt-1 block w-full input"/>
                    </div>
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Data</label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full input"/>
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full input">
                            <option value="expense">Despesa</option>
                            <option value="income">Receita</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Categoria</label>
                        <select name="categoryId" value={formData.categoryId} onChange={handleChange} required className="mt-1 block w-full input">
                            <option value="">Selecione...</option>
                            {filteredCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="accountId" className="block text-sm font-medium text-gray-700">Conta</label>
                        <select name="accountId" value={formData.accountId} onChange={handleChange} required className="mt-1 block w-full input">
                            <option value="">Selecione...</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransactionModal;
