// src/components/modals/AccountModal.jsx
import React, { useState, useEffect } from 'react';

const AccountModal = ({ onClose, onSubmit, account }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'bank',
        initialBalance: 0,
        // Adicione campos de cartão de crédito se necessário
        // closingDay: '',
        // dueDate: '',
    });

    useEffect(() => {
        if (account) {
            setFormData({
                name: account.name || '',
                type: account.type || 'bank',
                initialBalance: account.initialBalance || 0,
            });
        }
    }, [account]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">{account ? 'Editar' : 'Adicionar'} Conta</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome da Conta</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full input"/>
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full input">
                            <option value="bank">Conta Corrente/Poupança</option>
                            <option value="credit_card">Cartão de Crédito</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="initialBalance" className="block text-sm font-medium text-gray-700">Saldo Inicial</label>
                        <input type="number" name="initialBalance" value={formData.initialBalance} onChange={handleChange} required className="mt-1 block w-full input"/>
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

export default AccountModal;
