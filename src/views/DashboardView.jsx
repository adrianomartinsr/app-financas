// src/views/DashboardView.jsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, colorClass }) => (
    <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className={`mt-1 text-3xl font-semibold ${colorClass}`}>
            {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
    </div>
);

const DashboardView = ({ dashboardData, onAnalyzeClick }) => {
    const { income, expense, balance, pieData, COLORS } = dashboardData;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Receita Total" value={income} colorClass="text-green-600" />
                <StatCard title="Despesa Total" value={expense} colorClass="text-red-600" />
                <StatCard title="Saldo Atual" value={balance} colorClass={balance >= 0 ? 'text-blue-600' : 'text-red-600'} />
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Análise de Despesas</h2>
                    <button
                        onClick={onAnalyzeClick}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Gerar Análise Financeira (IA)
                    </button>
                </div>
                {pieData && pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-center text-gray-500 py-10">Não há dados de despesas para exibir.</p>
                )}
            </div>
        </div>
    );
};

export default DashboardView;
