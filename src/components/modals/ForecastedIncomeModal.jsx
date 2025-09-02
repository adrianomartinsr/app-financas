// src/components/modals/ForecastedIncomeModal.jsx
import React, { useState, useEffect } from 'react';

const ForecastedIncomeModal = ({ onClose, onSubmit, onCategorySubmit, income, accounts, categories }) => {
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        expectedDate: new Date().toISOString().slice(0, 10),
        accountId: '',
        categoryId: '',
    });

    // MELHORIA: Estados para controlar a criação de nova categoria
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        if (income) {
            setFormData({
                description: income.description || '',
                amount: income.amount || '',
                expectedDate: income.expectedDate || new Date().toISOString().slice(0, 10),
                accountId: income.accountId || '',
                categoryId: income.categoryId || '',
            });
        }
    }, [income]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.categoryId) {
            alert("Por favor, selecione uma categoria.");
            return;
        }
        onSubmit({ ...formData, amount: parseFloat(formData.amount) });
        onClose();
    };

    // MELHORIA: Função para salvar a nova categoria
    const handleSaveNewCategory = async () => {
        if (!newCategoryName.trim()) {
            alert("O nome da categoria não pode ser vazio.");
            return;
        }
        const newCategoryData = {
            name: newCategoryName.trim(),
            type: 'income' // Agendamentos são sempre para receitas
        };
        try {
            const newCategoryRef = await onCategorySubmit(newCategoryData);
            // Seleciona a categoria recém-criada
            setFormData(prev => ({ ...prev, categoryId: newCategoryRef.id }));
            // Limpa e esconde o campo de nova categoria
            setNewCategoryName('');
            setShowNewCategory(false);
        } catch (error) {
            console.error("Erro ao salvar nova categoria:", error);
            alert("Não foi possível salvar a nova categoria.");
        }
    };
    
    const incomeCategories = categories.filter(c => c.type === 'income');
    const bankAccounts = accounts.filter(a => a.type === 'bank');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">{income ? 'Editar' : 'Adicionar'} Receita Prevista</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campos de descrição, valor, data e conta permanecem os mesmos */}
                    <div>
                        <label htmlFor="description">Descrição</label>
                        <input type="text" name="description" value={formData.description} onChange={handleChange} required className="mt-1 block w-full input"/>
                    </div>
                    <div>
                        <label htmlFor="amount">Valor</label>
                        <input type="number" name="amount" value={formData.amount} onChange={handleChange} required className="mt-1 block w-full input"/>
                    </div>
                    <div>
                        <label htmlFor="expectedDate">Data Prevista</label>
                        <input type="date" name="expectedDate" value={formData.expectedDate} onChange={handleChange} required className="mt-1 block w-full input"/>
                    </div>
                    <div>
                        <label htmlFor="accountId">Conta</label>
                        <select name="accountId" value={formData.accountId} onChange={handleChange} required className="mt-1 block w-full input">
                            <option value="">Selecione...</option>
                            {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>

                    {/* MELHORIA: Seção de Categoria com opção de criar nova */}
                    <div>
                        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Categoria</label>
                        <div className="flex items-center space-x-2 mt-1">
                            <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="block w-full input" disabled={showNewCategory}>
                                <option value="">Selecione...</option>
                                {incomeCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                            <button type="button" onClick={() => setShowNewCategory(!showNewCategory)} className="text-sm text-blue-500 hover:underline whitespace-nowrap">
                                {showNewCategory ? 'Cancelar' : 'Nova'}
                            </button>
                        </div>
                    </div>

                    {showNewCategory && (
                        <div className="p-3 bg-gray-50 rounded-md">
                            <label htmlFor="newCategoryName" className="block text-sm font-medium text-gray-700">Nome da Nova Categoria</label>
                            <div className="flex items-center space-x-2 mt-1">
                                <input
                                    type="text"
                                    name="newCategoryName"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Ex: Salário, Freelance"
                                    className="block w-full input"
                                />
                                <button type="button" onClick={handleSaveNewCategory} className="bg-green-500 text-white px-3 py-2 rounded-md text-sm">Salvar</button>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForecastedIncomeModal;
