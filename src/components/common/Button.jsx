// src/components/common/Button.jsx
import React from 'react';

/**
 * Componente de botão reutilizável com estilos pré-definidos.
 * @param {object} props
 * @param {React.ReactNode} props.children - O conteúdo do botão (texto, ícone, etc.).
 * @param {function} props.onClick - A função a ser executada no clique.
 * @param {'primary' | 'secondary' | 'danger'} [props.variant='primary'] - A variante de estilo do botão.
 * @param {'button' | 'submit' | 'reset'} [props.type='button'] - O tipo do botão HTML.
 * @param {string} [props.className=''] - Classes CSS adicionais para customização.
 * @returns {JSX.Element}
 */
const Button = ({ children, onClick, variant = 'primary', type = 'button', className = '' }) => {
    // Estilos base, comuns a todos os botões
    const baseStyle = 'font-bold py-2 px-4 rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50';

    // Estilos específicos para cada variante
    const variants = {
        primary: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
        danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    };

    const variantStyle = variants[variant] || variants.primary;

    return (
        <button
            type={type}
            onClick={onClick}
            className={`${baseStyle} ${variantStyle} ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;
