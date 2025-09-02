// src/components/modals/ImportModal.jsx
import React from 'react';

const ImportModal = ({ status, onClose, onDownloadTemplate }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
                <h2 className="text-2xl font-bold mb-4">Importar Transações</h2>
                
                {status.status === 'loading' && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">{status.message}</p>
                    </>
                )}

                {status.status === 'success' && (
                    <>
                        <p className="text-green-600 mb-4">{status.message}</p>
                        <button onClick={onClose} className="btn-primary">Fechar</button>
                    </>
                )}

                {status.status === 'error' && (
                    <>
                        <p className="text-red-600 mb-4 whitespace-pre-wrap">{status.message}</p>
                        <button onClick={onClose} className="btn-primary">Fechar</button>
                    </>
                )}
                 <div className="mt-6 text-sm">
                    <p className="text-gray-500">Não tem o modelo? Baixe aqui.</p>
                    <button onClick={onDownloadTemplate} className="text-blue-500 hover:underline">
                        Baixar modelo de importação
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
