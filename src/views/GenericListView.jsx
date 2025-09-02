// src/views/GenericListView.jsx
import React from 'react';
import { translateType, formatCurrency } from '../utils/formatters'; // <-- CAMINHO CORRIGIDO

const GenericListView = ({ title, items, onAdd, onEdit, onDelete, columns }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                <button onClick={onAdd} className="bg-blue-500 text-white hover:bg-blue-600 font-bold py-2 px-4 rounded-md shadow-sm transition-colors">Adicionar</button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map(col => (
                                <th key={col.key} className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.key === 'total' ? 'text-right' : ''}`}>
                                    {col.label}
                                </th>
                            ))}
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.map(item => (
                            <tr key={item.id}>
                                {columns.map(col => (
                                    <td key={col.key} className={`px-6 py-4 whitespace-nowrap ${col.key === 'total' ? 'text-right font-mono' : ''}`}>
                                        {col.key === 'type' ? translateType(item[col.key]) :
                                         col.key === 'total' ? formatCurrency(item[col.key]) :
                                         item[col.key]}
                                    </td>
                                ))}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => onEdit(item)} className="text-indigo-600 hover:text-indigo-900 mr-2">Editar</button>
                                    <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-900">Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GenericListView;
