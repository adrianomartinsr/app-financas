// src/components/modals/AnalysisModal.jsx
import React from 'react';

const AnalysisModal = ({ isAnalyzing, result, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">Análise Financeira (IA)</h2>
                {isAnalyzing ? (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Analisando suas finanças...</p>
                    </div>
                ) : (
                    <div className="prose max-w-none whitespace-pre-wrap">
                        {result}
                    </div>
                )}
                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="btn-primary">Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default AnalysisModal;
