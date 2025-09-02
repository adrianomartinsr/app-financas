// src/components/modals/PaymentModal.jsx
import React, { useState } from 'react';

const PaymentModal = ({ transaction, accounts, onClose, onConfirm }) => {
    const [sourceAccountId, setSourceAccountId] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!sourceAccountId) {
            alert('Por favor, selecione uma conta de origem.');
            return;
        }
        onConfirm({ transaction, sourceAccountId, paymentDate });
        onClose();
    };

    const bankAccounts = accounts.filter(acc => acc.type === 'bank');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Confirmar Pagamento</h2>
                <p className="mb-2"><strong>Descrição:</strong> {transaction.description}</p>
                <p className="mb-6"><strong>Valor:</strong> {transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700">Data do Pagamento</label>
                        <input type="date" name="paymentDate" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required className="mt-1 block w-full input"/>
                    </div>
                    <div>
                        <label htmlFor="sourceAccountId" className="block text-sm font-medium text-gray-700">Pagar com a conta</label>
                        <select name="sourceAccountId" value={sourceAccountId} onChange={(e) => setSourceAccountId(e.target.value)} required className="mt-1 block w-full input">
                            <option value="">Selecione a conta...</option>
                            {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">Confirmar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
