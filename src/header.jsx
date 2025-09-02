// src/Header.jsx
import React, { useState } from 'react';

// Ícones SVG para o menu
const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const NavItem = ({ viewName, currentView, setCurrentView, children, isMobile = false }) => {
    const baseClasses = "font-medium transition-colors duration-200";
    const mobileClasses = `block px-4 py-3 text-lg ${currentView === viewName ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-100'}`;
    const desktopClasses = `px-3 py-2 rounded-md text-sm ${currentView === viewName ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'}`;

    return (
        <button
            onClick={() => setCurrentView(viewName)}
            className={`${baseClasses} ${isMobile ? mobileClasses : desktopClasses}`}
        >
            {children}
        </button>
    );
};

const Header = ({ currentView, setCurrentView }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems = [
        { view: 'dashboard', label: 'Dashboard' },
        { view: 'transactions', label: 'Transações' },
        { view: 'categories', label: 'Categorias' },
        { view: 'accounts', label: 'Contas' },
        { view: 'cards', label: 'Cartões' },
        { view: 'scheduling', label: 'Agendamentos' },
    ];
    
    const handleNavClick = (view) => {
        setCurrentView(view);
        setIsMenuOpen(false); // Fecha o menu ao navegar
    };

    return (
        <header className="bg-white shadow-sm sticky top-0 z-40">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <h1 className="text-xl font-bold text-blue-600">FinControl</h1>
                    </div>
                    {/* Navegação Desktop */}
                    <nav className="hidden md:flex md:items-center md:space-x-4">
                        {navItems.map(item => (
                            <NavItem
                                key={item.view}
                                viewName={item.view}
                                currentView={currentView}
                                setCurrentView={handleNavClick}
                            >
                                {item.label}
                            </NavItem>
                        ))}
                    </nav>
                    {/* Botão do Menu Mobile */}
                    <div className="md:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700 hover:text-blue-600">
                            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Painel do Menu Mobile */}
            <div className={`md:hidden absolute top-16 left-0 w-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${isMenuOpen ? 'transform translate-y-0' : 'transform -translate-y-[150%]'}`}>
                <nav className="flex flex-col">
                    {navItems.map(item => (
                        <NavItem
                            key={item.view}
                            viewName={item.view}
                            currentView={currentView}
                            setCurrentView={handleNavClick}
                            isMobile={true}
                        >
                            {item.label}
                        </NavItem>
                    ))}
                </nav>
            </div>
        </header>
    );
};

export default Header;
