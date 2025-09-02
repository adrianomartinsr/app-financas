// src/App.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './config/firebase';
import useFirestoreSubscription from './hooks/useFirestoreSubscription';
import * as firestoreService from './api/firestoreService';
import { getFinancialAnalysis } from './api/geminiService';
import { downloadTemplate, readFileAsJson } from './utils/excelUtils';
import { translateAccountType } from './utils/formatters';
// CORREÇÃO AQUI: Caminho mais explícito para o build
import Header from './Header.jsx'; 
import DashboardView from './views/DashboardView.jsx';
import TransactionsView from './views/TransactionsView.jsx';
import CreditCardsView from './views/CreditCardsView.jsx';
import SchedulingView from './views/SchedulingView.jsx';
import GenericListView from './views/GenericListView.jsx';
import Spinner from './components/common/Spinner.jsx';
import TransactionModal from './components/modals/TransactionModal.jsx';
import CategoryModal from './components/modals/CategoryModal.jsx';
import AccountModal from './components/modals/AccountModal.jsx';
import ImportModal from './components/modals/ImportModal.jsx';
import AnalysisModal from './components/modals/AnalysisModal.jsx';
import PaymentModal from './components/modals/PaymentModal.jsx';
import SchedulingModal from './components/modals/SchedulingModal.jsx';
import ForecastedIncomeModal from './components/modals/ForecastedIncomeModal.jsx';

const MainApp = ({ userId }) => {
    const transactions = useFirestoreSubscription('transactions', userId);
    const categories = useFirestoreSubscription('categories', userId);
    const accounts = useFirestoreSubscription('accounts', userId);
    const forecastedIncomes = useFirestoreSubscription('forecastedIncomes', userId);

    const [currentView, setCurrentView] = useState('dashboard');
    const [modal, setModal] = useState({ name: null, props: {} });
    const [importStatus, setImportStatus] = useState({ status: 'idle', message: '' });
    const [analysisResult, setAnalysisResult] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef(null);
    
    // Estados dos filtros
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [sortBy, setSortBy] = useState('date-desc');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');

    const handleAddOrUpdate = (collectionName, data, id) => firestoreService.addOrUpdateDoc(collectionName, data, id, userId);
    const handleDelete = (collectionName, id) => firestoreService.deleteDocById(collectionName, id, userId);
    const handlePayTransaction = async (paymentData) => {
        await firestoreService.processPayment(paymentData, userId);
        closeModal();
    };
    const handleSchedulePayment = async (schedulingData) => {
        await firestoreService.schedulePayment(schedulingData, userId);
        closeModal();
    };
    const handleConfirmForecastedIncome = (income) => firestoreService.confirmForecastedIncome(income, userId);
    const handleGetAnalysis = async () => {
        setIsAnalyzing(true);
        openModal('analysis');
        setAnalysisResult('');
        const result = await getFinancialAnalysis(transactions, categories);
        setAnalysisResult(result);
        setIsAnalyzing(false);
    };
    const handleUndoPayment = (transactionId) => firestoreService.undoPayment(transactionId, userId);
    const handleCancelScheduling = (transactionId) => firestoreService.cancelScheduling(transactionId, userId);
    const handleFileImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        openModal('import');
        setImportStatus({ status: 'loading', message: 'Lendo o arquivo...' });

        try {
            const jsonData = await readFileAsJson(file);
            setImportStatus({ status: 'loading', message: 'Validando os dados...' });

            const transactionsToCreate = [];
            const errors = [];
            
            let currentCategories = [...categories];
            let currentAccounts = [...accounts];

            for (const [index, row] of jsonData.entries()) {
                const { Data, Descricao, Valor, Tipo, Categoria, Conta } = row;

                if (!Data || !Descricao || Valor === undefined || !Tipo || !Categoria || !Conta) {
                    errors.push(`Linha ${index + 2}: Faltam colunas obrigatórias.`);
                    continue;
                }

                const type = String(Tipo).toLowerCase() === 'receita' ? 'income' : (String(Tipo).toLowerCase() === 'despesa' ? 'expense' : null);
                if (!type) {
                    errors.push(`Linha ${index + 2}: Tipo '${Tipo}' inválido. Use 'Receita' ou 'Despesa'.`);
                    continue;
                }
                
                let category = currentCategories.find(c => c.name.toLowerCase() === String(Categoria).toLowerCase());
                if (!category) {
                    setImportStatus({ status: 'loading', message: `Criando nova categoria: ${Categoria}...` });
                    const newCategoryData = { name: String(Categoria), type };
                    const newCategoryRef = await handleAddOrUpdate('categories', newCategoryData);
                    category = { id: newCategoryRef.id, ...newCategoryData };
                    currentCategories.push(category);
                }

                let account = currentAccounts.find(a => a.name.toLowerCase() === String(Conta).toLowerCase());
                if (!account) {
                    setImportStatus({ status: 'loading', message: `Criando nova conta: ${Conta}...` });
                    const newAccountData = { name: String(Conta), type: 'bank', initialBalance: 0 };
                    const newAccountRef = await handleAddOrUpdate('accounts', newAccountData);
                    account = { id: newAccountRef.id, ...newAccountData };
                    currentAccounts.push(account);
                }
                
                let formattedDateForDB;
                const dateParts = String(Data).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                if (dateParts) {
                    const [_, day, month, year] = dateParts;
                    formattedDateForDB = `${year}-${month}-${day}`;
                } else {
                    errors.push(`Linha ${index + 2}: Formato de data inválido para '${Data}'. Use DD/MM/AAAA.`);
                    continue;
                }

                transactionsToCreate.push({
                    date: formattedDateForDB,
                    description: Descricao,
                    amount: parseFloat(String(Valor).replace(',', '.')),
                    type,
                    categoryId: category.id,
                    accountId: account.id,
                    status: type === 'expense' ? 'pending' : 'paid',
                });
            }

            if (errors.length > 0) {
                setImportStatus({ status: 'error', message: `Importação cancelada:\n- ${errors.join('\n- ')}` });
                return;
            }

            if (transactionsToCreate.length === 0) {
                setImportStatus({ status: 'error', message: 'Nenhuma transação válida para importar.' });
                return;
            }

            setImportStatus({ status: 'loading', message: `Salvando ${transactionsToCreate.length} transações...` });
            await firestoreService.importTransactionsBatch(transactionsToCreate, userId);
            setImportStatus({ status: 'success', message: `${transactionsToCreate.length} transações importadas!` });

        } catch (error) {
            console.error("Erro na importação:", error);
            setImportStatus({ status: 'error', message: `Ocorreu um erro ao processar o arquivo: ${error.message}` });
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const uniqueMonths = useMemo(() => {
        const monthSet = new Set();
        transactions.forEach(t => {
            const date = new Date(t.date);
            const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
            monthSet.add(monthKey);
        });
        return Array.from(monthSet).map(monthKey => {
            const [year, month] = monthKey.split('-');
            const date = new Date(year, parseInt(month) - 1);
            return {
                value: monthKey,
                label: date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
            };
        }).sort((a, b) => b.value.localeCompare(a.value));
    }, [transactions]);
    
    const filteredTransactions = useMemo(() => {
        let processedTransactions = [...transactions];

        if (selectedMonth !== 'all') {
            processedTransactions = processedTransactions.filter(t => {
                const date = new Date(t.date);
                const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
                return monthKey === selectedMonth;
            });
        }
        if (filterStatus !== 'all') {
            processedTransactions = processedTransactions.filter(t => t.status === filterStatus);
        }
        if (filterCategory !== 'all') {
            processedTransactions = processedTransactions.filter(t => t.categoryId === filterCategory);
        }

        processedTransactions.sort((a, b) => {
            switch (sortBy) {
                case 'date-asc': return new Date(a.date) - new Date(b.date);
                case 'amount-desc': return b.amount - a.amount;
                case 'amount-asc': return a.amount - b.amount;
                case 'date-desc': default: return new Date(b.date) - new Date(a.date);
            }
        });

        return processedTransactions;
    }, [transactions, selectedMonth, filterStatus, filterCategory, sortBy]);

    const transactionTotals = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => {
            if (t.type === 'income') acc.income += t.amount;
            else if (t.type === 'expense') acc.expense += t.amount;
            return acc;
        }, { income: 0, expense: 0 });
    }, [filteredTransactions]);

    const categoriesWithTotals = useMemo(() => {
        return categories.map(category => ({
            ...category,
            total: filteredTransactions
                .filter(t => t.categoryId === category.id && t.type === category.type)
                .reduce((sum, t) => sum + t.amount, 0)
        }));
    }, [categories, filteredTransactions]);

    const accountsTranslated = useMemo(() => {
        return accounts.map(acc => ({ ...acc, type: translateAccountType(acc.type) }));
    }, [accounts]);

    const dashboardData = useMemo(() => {
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        const balance = income - expense;
        const expenseByCategory = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
            const categoryName = categories.find(c => c.id === t.categoryId)?.name || 'Sem Categoria';
            acc[categoryName] = (acc[categoryName] || 0) + parseFloat(t.amount || 0);
            return acc;
        }, {});
        const pieData = Object.keys(expenseByCategory).map(key => ({ name: key, value: expenseByCategory[key] })).filter(item => item.value > 0);
        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
        return { income, expense, balance, pieData, COLORS };
    }, [transactions, categories]);

    const openModal = (name, props = {}) => setModal({ name, props });
    const closeModal = () => setModal({ name: null, props: {} });
    
    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView dashboardData={dashboardData} onAnalyzeClick={handleGetAnalysis} />;
            case 'transactions':
                return <TransactionsView
                    transactions={filteredTransactions}
                    categories={categories}
                    onAddClick={() => openModal('transaction')}
                    onEditClick={(t) => openModal('transaction', { transaction: t })}
                    onDeleteClick={(id) => handleDelete('transactions', id)}
                    onPayClick={(t) => openModal('payment', { transaction: t })}
                    onScheduleClick={(t) => openModal('scheduling', { transaction: t })}
                    onImportClick={() => fileInputRef.current.click()}
                    onDownloadTemplateClick={downloadTemplate}
                    uniqueMonths={uniqueMonths}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    transactionTotals={transactionTotals}
                    onUndoPayment={handleUndoPayment}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    filterCategory={filterCategory}
                    setFilterCategory={setFilterCategory}
                />;
            case 'categories':
                return <GenericListView
                    title="Categorias"
                    items={categoriesWithTotals}
                    onAdd={() => openModal('category')}
                    onEdit={(cat) => openModal('category', { category: cat })}
                    onDelete={(id) => handleDelete('categories', id)}
                    columns={[{key: 'name', label: 'Nome'}, {key: 'type', label: 'Tipo'}, {key: 'total', label: 'Total no Mês'}]}
                />;
            case 'accounts':
                return <GenericListView
                    title="Contas"
                    items={accountsTranslated}
                    onAdd={() => openModal('account')}
                    onEdit={(acc) => openModal('account', { account: acc })}
                    onDelete={(id) => handleDelete('accounts', id)}
                    columns={[{key: 'name', label: 'Nome'}, {key: 'type', label: 'Tipo'}, {key: 'initialBalance', label: 'Saldo Inicial'}]}
                />;
            case 'cards':
                 return <CreditCardsView
                    accounts={accounts}
                    transactions={transactions}
                    categories={categories}
                    onAddExpenseClick={(card) => openModal('transaction', { transaction: { accountId: card.id, type: 'expense', status: 'pending' } })}
                    onEditTransaction={(t) => openModal('transaction', { transaction: t })}
                    onDeleteTransaction={(id) => handleDelete('transactions', id)}
                />;
            case 'scheduling':
                return <SchedulingView
                    transactions={transactions}
                    forecastedIncomes={forecastedIncomes}
                    onAddForecastedIncome={() => openModal('forecastedIncome')}
                    onEditForecastedIncome={(income) => openModal('forecastedIncome', { income })}
                    onDeleteForecastedIncome={(id) => handleDelete('forecastedIncomes', id)}
                    onConfirmForecastedIncome={handleConfirmForecastedIncome}
                    onPayScheduled={(t) => openModal('payment', { transaction: t })}
                    onCancelScheduling={handleCancelScheduling}
                />;
            default:
                return <DashboardView dashboardData={dashboardData} onAnalyzeClick={handleGetAnalysis} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <Header currentView={currentView} setCurrentView={setCurrentView} />
            <main className="container mx-auto px-4 py-4">{renderView()}</main>
            <input type="file" ref={fileInputRef} onChange={handleFileImport} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" />
            
            {modal.name === 'transaction' && <TransactionModal onClose={closeModal} onSubmit={(data) => handleAddOrUpdate('transactions', data, modal.props.transaction?.id)} {...modal.props} categories={categories} accounts={accounts} />}
            {modal.name === 'category' && <CategoryModal onClose={closeModal} onSubmit={(data) => handleAddOrUpdate('categories', data, modal.props.category?.id)} {...modal.props} />}
            {modal.name === 'account' && <AccountModal onClose={closeModal} onSubmit={(data) => handleAddOrUpdate('accounts', data, modal.props.account?.id)} {...modal.props} />}
            {modal.name === 'payment' && <PaymentModal onClose={closeModal} onConfirm={handlePayTransaction} accounts={accounts} {...modal.props} />}
            {modal.name === 'scheduling' && <SchedulingModal onClose={closeModal} onConfirm={handleSchedulePayment} {...modal.props} />}
            {modal.name === 'analysis' && <AnalysisModal onClose={closeModal} isAnalyzing={isAnalyzing} result={analysisResult} />}
            {modal.name === 'import' && <ImportModal onClose={() => { setImportStatus({ status: 'idle', message: '' }); closeModal(); }} status={importStatus} onDownloadTemplate={downloadTemplate} />}
            
            {modal.name === 'forecastedIncome' && <ForecastedIncomeModal 
                onClose={closeModal} 
                onSubmit={(data) => handleAddOrUpdate('forecastedIncomes', data, modal.props.income?.id)} 
                onCategorySubmit={(data) => handleAddOrUpdate('categories', data)}
                {...modal.props} 
                accounts={accounts} 
                categories={categories} 
            />}
        </div>
    );
};

const App = () => {
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                signInAnonymously(auth).catch((error) => console.error("Falha no login anônimo:", error));
            }
            if (!isAuthReady) {
                setIsAuthReady(true);
            }
        });
        return () => unsubscribe();
    }, [isAuthReady]);

    if (!isAuthReady) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <Spinner size="h-32 w-32" />
            </div>
        );
    }

    return user ? <MainApp userId={user.uid} /> : (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <p>Conectando...</p>
        </div>
    );
};

export default App;
