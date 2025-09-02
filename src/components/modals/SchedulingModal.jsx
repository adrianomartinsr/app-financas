// src/components/modals/SchedulingModal.jsx
import React, { useState } from 'react';

const SchedulingModal = ({ transaction, onClose, onConfirm }) => {
    const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm({ transaction, scheduledDate });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Agendar Pagamento</h2>
                <p className="mb-6">Agendando: <strong>{transaction.description}</strong></p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700">Data do Agendamento</label>
                        <input type="date" name="scheduledDate" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required className="mt-1 block w-full input"/>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">Agendar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SchedulingModal;
