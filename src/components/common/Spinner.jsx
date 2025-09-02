// src/components/common/Spinner.jsx
import React from 'react';

/**
 * Componente de spinner para indicar carregamento.
 * @param {object} props
 * @param {string} [props.size='h-16 w-16'] - O tamanho do spinner (classes de altura e largura do Tailwind).
 * @param {string} [props.color='border-blue-500'] - A cor da borda do spinner (classe de cor do Tailwind).
 * @returns {JSX.Element}
 */
const Spinner = ({ size = 'h-16 w-16', color = 'border-blue-500' }) => {
    return (
        <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 border-transparent ${color}`}></div>
    );
};

export default Spinner;
