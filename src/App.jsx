import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged,
    signInAnonymously,
    signOut
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    writeBatch,
    updateDoc, 
    deleteDoc, 
    onSnapshot,
    query
} from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import 'tailwindcss/tailwind.css';


// --- Configuração do Firebase a partir das Variáveis de Ambiente ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};


// --- Ícones SVG ---
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
  </svg>
);
const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);
const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);
const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);
const SparklesIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1.158a3.001 3.001 0 002.343 2.842l.295.148a3.001 3.001 0 003.724 0l.295-.148A3.001 3.001 0 0015 4.158V3a1 1 0 112 0v1.158c0 .895-.372 1.758-.986 2.342l-.295.278a3.001 3.001 0 000 4.444l.295.278c.614.584.986 1.447.986 2.342V17a1 1 0 11-2 0v-1.158a3.001 3.001 0 00-2.343-2.842l-.295-.148a3.001 3.001 0 00-3.724 0l-.295.148A3.001 3.001 0 005 15.842V17a1 1 0 11-2 0v-1.158c0-.895.372-1.758.986-2.342l.295-.278a3.001 3.001 0 000-4.444l-.295-.278A2.999 2.999 0 013 4.158V3a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);


// --- Componente Principal do App (após login) ---
const MainApp = ({ auth, userId, db }) => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [currentView, setCurrentView] = useState('dashboard');
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [importStatus, setImportStatus] = useState({ status: 'idle', message: '' });
    const [analysisResult, setAnalysisResult] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingAccount, setEditingAccount] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!db || !userId) return;
        const baseCollectionPath = `users/${userId}`;

        const collectionsToWatch = {
            transactions: setTransactions,
            categories: setCategories,
            accounts: setAccounts,
        };

        const unsubscribers = Object.entries(collectionsToWatch).map(([name, setter]) => {
            const q = query(collection(db, `${baseCollectionPath}/${name}`));
            return onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setter(data);
            }, (error) => console.error(`Error fetching ${name}:`, error));
        });

        return () => unsubscribers.forEach(unsub => unsub());
    }, [db, userId]);
    
    // --- Funções do Gemini API ---
    const callGeminiAPI = async (payload, retries = 3, delay = 1000) => {
        const apiKey = ""; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status === 429 && retries > 0) {
                    await new Promise(res => setTimeout(res, delay));
                    return callGeminiAPI(payload, retries - 1, delay * 2);
                }
                throw new Error(`API Error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            if (retries > 0) {
                await new Promise(res => setTimeout(res, delay));
                return callGeminiAPI(payload, retries - 1, delay * 2);
            }
            console.error("Failed to fetch from Gemini API after multiple retries:", error);
            throw error;
        }
    };

    const handleGetFinancialAnalysis = async () => {
        setIsAnalyzing(true);
        setShowAnalysisModal(true);
        setAnalysisResult('');

        const recentTransactions = transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 30)
            .map(t => {
                const categoryName = categories.find(c => c.id === t.categoryId)?.name || 'N/A';
                return `${t.date} - ${t.description}: R$ ${t.amount} (${categoryName} - ${t.type === 'income' ? 'Receita' : 'Despesa'})`;
            }).join('\n');

        if (!recentTransactions) {
            setAnalysisResult("Não há transações suficientes para uma análise. Adicione mais algumas e tente novamente.");
            setIsAnalyzing(false);
            return;
        }

        const prompt = `
            Você é um consultor financeiro amigável e prestativo. Analise a seguinte lista de transações financeiras de um usuário.
            
            Transações:
            ${recentTransactions}

            Com base nessas transações, forneça uma análise curta e objetiva em português. Siga estritamente este formato:
            1.  **Resumo Geral:** Um parágrafo curto sobre os hábitos de gasto gerais.
            2.  **Principais Despesas:** Liste as 3 principais categorias de despesas.
            3.  **Dicas para Economizar:** Ofereça 2 dicas práticas e acionáveis para o usuário economizar dinheiro com base nos seus gastos.
            4.  **Ponto Positivo:** Mencione um ponto positivo, como uma fonte de receita consistente ou gastos controlados em alguma área.
        `;

        try {
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const result = await callGeminiAPI(payload);
            const text = result.candidates[0].content.parts[0].text;
            setAnalysisResult(text);
        } catch (error) {
            setAnalysisResult("Desculpe, não foi possível gerar a análise no momento. Tente novamente mais tarde.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // --- Funções CRUD ---
    const addOrUpdate = async (collectionName, data, id) => {
        const path = `users/${userId}/${collectionName}`;
        try {
            if (id) {
                await updateDoc(doc(db, path, id), data);
            } else {
                return await addDoc(collection(db, path), data);
            }
        } catch (error) {
            console.error(`Error saving ${collectionName}:`, error);
        }
    };

    const deleteItem = async (collectionName, id) => {
        const path = `users/${userId}/${collectionName}`;
        try {
            await deleteDoc(doc(db, path, id));
        } catch (error) {
            console.error(`Error deleting ${collectionName}:`, error);
        }
    };
    
    const handleAddOrUpdateTransaction = (data) => addOrUpdate('transactions', data, editingTransaction?.id);
    const deleteTransaction = (id) => deleteItem('transactions', id);
    const handleAddOrUpdateCategory = (data) => addOrUpdate('categories', data, editingCategory?.id);
    const deleteCategory = (id) => deleteItem('categories', id);
    const handleAddOrUpdateAccount = (data) => addOrUpdate('accounts', data, editingAccount?.id);
    const deleteAccount = (id) => deleteItem('accounts', id);

    const handleDownloadTemplate = () => {
        if (typeof XLSX === 'undefined') {
            alert("A biblioteca de planilhas ainda não foi carregada. Tente novamente em alguns segundos.");
            return;
        }
        const headers = ['Data', 'Descricao', 'Valor', 'Tipo', 'Categoria', 'Conta'];
        const exampleData = [
            ['05/08/2024', 'Salário de Agosto', 5500.00, 'Receita', 'Salário', 'Conta Corrente'],
            ['10/08/2024', 'Compras no mercado', 450.25, 'Despesa', 'Alimentação', 'Cartão de Crédito'],
        ];
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo');
        worksheet['!cols'] = [ { wch: 12 }, { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 20 } ];
        XLSX.writeFile(workbook, 'modelo_importacao.xlsx');
    };

    const handleFileImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setShowImportModal(true);
        setImportStatus({ status: 'loading', message: 'Lendo o arquivo...' });

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                if (typeof XLSX === 'undefined') throw new Error("A biblioteca de planilhas não está disponível.");
                
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { raw: false });

                setImportStatus({ status: 'loading', message: 'Validando os dados...' });

                const transactionsToCreate = [];
                const errors = [];
                
                const currentCategories = [...categories];
                const currentAccounts = [...accounts];

                for (const [index, row] of json.entries()) {
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
                        const newCategoryRef = await addOrUpdate('categories', newCategoryData);
                        category = { id: newCategoryRef.id, ...newCategoryData };
                        currentCategories.push(category);
                    }

                    let account = currentAccounts.find(a => a.name.toLowerCase() === String(Conta).toLowerCase());
                    if (!account) {
                        setImportStatus({ status: 'loading', message: `Criando nova conta: ${Conta}...` });
                        const newAccountData = { name: String(Conta), type: 'bank', initialBalance: 0 };
                        const newAccountRef = await addOrUpdate('accounts', newAccountData);
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
                        accountId: account.id
                    });
                }

                if (errors.length > 0) {
                    setImportStatus({ status: 'error', message: `Importação cancelada devido a erros:\n- ${errors.join('\n- ')}` });
                    return;
                }

                if (transactionsToCreate.length === 0) {
                    setImportStatus({ status: 'error', message: 'Nenhuma transação válida encontrada para importar.' });
                    return;
                }

                setImportStatus({ status: 'loading', message: `Salvando ${transactionsToCreate.length} transações...` });
                
                const batch = writeBatch(db);
                const transactionsCollection = collection(db, `users/${userId}/transactions`);
                
                transactionsToCreate.forEach(trans => {
                    const docRef = doc(transactionsCollection);
                    batch.set(docRef, trans);
                });

                await batch.commit();
                setImportStatus({ status: 'success', message: `${transactionsToCreate.length} transações importadas com sucesso!` });

            } catch (error) {
                console.error("Import error:", error);
                setImportStatus({ status: 'error', message: `Ocorreu um erro ao processar o arquivo. Verifique o formato e tente novamente.` });
            } finally {
                if(fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const dashboardData = useMemo(() => {
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        const balance = income - expense;

        const expenseByCategory = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                const categoryName = categories.find(c => c.id === t.categoryId)?.name || 'Sem Categoria';
                acc[categoryName] = (acc[categoryName] || 0) + parseFloat(t.amount || 0);
                return acc;
            }, {});

        const pieData = Object.keys(expenseByCategory).map(key => ({
            name: key,
            value: expenseByCategory[key]
        })).filter(item => item.value > 0);
        
        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943', '#19D4FF'];

        return { income, expense, balance, pieData, COLORS };
    }, [transactions, categories]);
    
    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <Header currentView={currentView} setCurrentView={setCurrentView} />
            <main className="container mx-auto px-4 py-4">
                {currentView === 'dashboard' && <DashboardView dashboardData={dashboardData} onAnalyzeClick={handleGetFinancialAnalysis} />}
                {currentView === 'transactions' && <TransactionsView 
                    transactions={transactions} 
                    categories={categories}
                    onAddClick={() => { setEditingTransaction(null); setShowTransactionModal(true); }}
                    onEditClick={(t) => { setEditingTransaction(t); setShowTransactionModal(true); }}
                    onDeleteClick={deleteTransaction}
                    onImportClick={() => fileInputRef.current.click()}
                    onDownloadTemplateClick={handleDownloadTemplate}
                />}
                {currentView === 'categories' && 
                    <GenericListView 
                        title="Categorias"
                        items={categories}
                        onAdd={() => { setEditingCategory(null); setShowCategoryModal(true); }}
                        onEdit={(cat) => { setEditingCategory(cat); setShowCategoryModal(true); }}
                        onDelete={deleteCategory}
                        columns={[{key: 'name', label: 'Nome'}, {key: 'type', label: 'Tipo'}]}
                    />
                }
                {currentView === 'accounts' && 
                    <GenericListView 
                        title="Contas"
                        items={accounts}
                        onAdd={() => { setEditingAccount(null); setShowAccountModal(true); }}
                        onEdit={(acc) => { setEditingAccount(acc); setShowAccountModal(true); }}
                        onDelete={deleteAccount}
                        columns={[{key: 'name', label: 'Nome'}, {key: 'type', label: 'Tipo'}, {key: 'initialBalance', label: 'Saldo Inicial'}]}
                    />
                }
            </main>
            
            <input type="file" ref={fileInputRef} onChange={handleFileImport} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" />

            {showTransactionModal && <TransactionModal 
                onClose={() => { setShowTransactionModal(false); setEditingTransaction(null); }}
                onSubmit={handleAddOrUpdateTransaction}
                onCategorySubmit={handleAddOrUpdateCategory}
                transaction={editingTransaction}
                categories={categories}
                accounts={accounts}
                callGeminiAPI={callGeminiAPI}
            />}
            {showCategoryModal && <CategoryModal 
                onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
                onSubmit={handleAddOrUpdateCategory}
                category={editingCategory}
            />}
            {showAccountModal && <AccountModal 
                 onClose={() => { setShowAccountModal(false); setEditingAccount(null); }}
                 onSubmit={handleAddOrUpdateAccount}
                 account={editingAccount}
            />}
            {showImportModal && <ImportModal 
                status={importStatus}
                onClose={() => setShowImportModal(false)}
                onDownloadTemplate={handleDownloadTemplate}
            />}
            {showAnalysisModal && <AnalysisModal 
                isAnalyzing={isAnalyzing}
                result={analysisResult}
                onClose={() => setShowAnalysisModal(false)}
            />}
        </div>
    );
};


// --- Componente Raiz ---
const App = () => {
    const [auth, setAuth] = useState(null);
    const [db, setDb] = useState(null);
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        // O script do XLSX não é mais necessário aqui, pois já está no index.html
        if (!firebaseConfig.apiKey) {
            console.error("Firebase config is not available. Please check your .env.local file.");
            setIsAuthReady(true);
            return;
        }

        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);

        setAuth(authInstance);
        setDb(dbInstance);

        const unsubscribe = onAuthStateChanged(authInstance, (user) => {
            if (user) {
                setUser(user);
                setIsAuthReady(true);
            } else {
                signInAnonymously(authInstance).catch((error) => {
                    console.error("Anonymous sign-in failed:", error);
                    setIsAuthReady(true);
                });
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    if (!isAuthReady) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }
    
    return user ? <MainApp auth={auth} userId={user.uid} db={db} /> : (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <p>Conectando...</p>
        </div>
    );
};


// --- Componentes de UI (Separados para clareza) ---
const Header = ({ currentView, setCurrentView }) => (
    <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2 sm:mb-0">Finanças Pessoais</h1>
            <nav className="flex items-center space-x-1">
                <button onClick={() => setCurrentView('dashboard')} className={`px-3 py-2 rounded-md text-sm font-medium ${currentView === 'dashboard' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Dashboard</button>
                <button onClick={() => setCurrentView('transactions')} className={`px-3 py-2 rounded-md text-sm font-medium ${currentView === 'transactions' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Transações</button>
                <button onClick={() => setCurrentView('categories')} className={`px-3 py-2 rounded-md text-sm font-medium ${currentView === 'categories' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Categorias</button>
                <button onClick={() => setCurrentView('accounts')} className={`px-3 py-2 rounded-md text-sm font-medium ${currentView === 'accounts' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Contas</button>
            </nav>
        </div>
    </header>
);

const DashboardView = ({ dashboardData, onAnalyzeClick }) => (
    <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="text-lg font-semibold text-gray-500">Receitas</h3>
                <p className="text-3xl font-bold text-green-500">R$ {dashboardData.income.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="text-lg font-semibold text-gray-500">Despesas</h3>
                <p className="text-3xl font-bold text-red-500">R$ {dashboardData.expense.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="text-lg font-semibold text-gray-500">Saldo Atual</h3>
                <p className={`text-3xl font-bold ${dashboardData.balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>R$ {dashboardData.balance.toFixed(2)}</p>
            </div>
        </div>
         <div className="bg-white p-6 rounded-lg shadow-md text-center">
             <h3 className="text-xl font-semibold text-gray-700 mb-4">Assistente Financeiro IA</h3>
             <p className="text-gray-600 mb-4">Receba uma análise inteligente dos seus gastos e dicas para economizar.</p>
             <button onClick={onAnalyzeClick} className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-purple-700 transition duration-300 ease-in-out flex items-center justify-center mx-auto">
                <SparklesIcon className="w-5 h-5 mr-2" />
                Análise Inteligente
             </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Distribuição de Despesas</h3>
            <div style={{ width: '100%', height: 300 }}>
               {dashboardData.pieData.length > 0 ? (
                <ResponsiveContainer>
                    <PieChart>
                        <Pie data={dashboardData.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                            {dashboardData.pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={dashboardData.COLORS[index % dashboardData.COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
               ) : (
                <div className="flex items-center justify-center h-full text-gray-500">Nenhuma despesa para exibir.</div>
               )}
            </div>
        </div>
    </div>
);

const TransactionsView = ({ transactions, categories, onAddClick, onEditClick, onDeleteClick, onImportClick, onDownloadTemplateClick }) => {
    const [selectedMonth, setSelectedMonth] = useState('all');

    const availableMonths = useMemo(() => {
        const months = new Set();
        transactions.forEach(t => {
            months.add(t.date.substring(0, 7)); // YYYY-MM
        });
        return Array.from(months).sort().reverse();
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        if (selectedMonth === 'all') {
            return transactions;
        }
        return transactions.filter(t => t.date.startsWith(selectedMonth));
    }, [transactions, selectedMonth]);

    return (
        <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Transações</h2>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                    <button onClick={onDownloadTemplateClick} className="bg-gray-500 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-600 flex items-center text-sm">
                        <DownloadIcon />
                        <span>Modelo</span>
                    </button>
                    <button onClick={onImportClick} className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 flex items-center text-sm">
                        <UploadIcon />
                        <span>Importar</span>
                    </button>
                    <button onClick={onAddClick} className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 flex items-center text-sm">
                        <PlusIcon />
                        <span>Adicionar</span>
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                    <button onClick={() => setSelectedMonth('all')} className={`px-4 py-2 text-sm font-medium rounded-full shadow-sm whitespace-nowrap ${selectedMonth === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
                        Todos os Meses
                    </button>
                    {availableMonths.map(month => {
                        const [year, monthNum] = month.split('-');
                        const date = new Date(year, monthNum - 1);
                        const monthName = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                        return (
                             <button key={month} onClick={() => setSelectedMonth(month)} className={`px-4 py-2 text-sm font-medium rounded-full shadow-sm whitespace-nowrap ${selectedMonth === month ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
                                {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => {
                            const [year, month, day] = t.date.split('-');
                            const formattedDate = `${day}/${month}/${year}`;
                            return (
                                <tr key={t.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formattedDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{categories.find(c => c.id === t.categoryId)?.name || 'N/A'}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.type === 'income' ? '+' : '-'} R$ {parseFloat(t.amount).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <button onClick={() => onEditClick(t)} className="text-indigo-600 hover:text-indigo-900 mr-3"><EditIcon /></button>
                                        <button onClick={() => onDeleteClick(t.id)} className="text-red-600 hover:text-red-900"><DeleteIcon /></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const GenericListView = ({ title, items, onAdd, onEdit, onDelete, columns }) => (
    <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <button onClick={onAdd} className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 flex items-center space-x-2">
                <PlusIcon />
                <span>Adicionar</span>
            </button>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map(col => <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{col.label}</th>)}
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {items.map(item => (
                        <tr key={item.id}>
                            {columns.map(col => <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item[col.key]}</td>)}
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <button onClick={() => onEdit(item)} className="text-indigo-600 hover:text-indigo-900 mr-3"><EditIcon /></button>
                                <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-900"><DeleteIcon /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const TransactionModal = ({ onClose, onSubmit, onCategorySubmit, transaction, categories, accounts, callGeminiAPI }) => {
    const [type, setType] = useState(transaction?.type || 'expense');
    const [description, setDescription] = useState(transaction?.description || '');
    const [amount, setAmount] = useState(transaction?.amount || '');
    const [date, setDate] = useState(transaction?.date || new Date().toISOString().slice(0, 10));
    const [categoryId, setCategoryId] = useState(transaction?.categoryId || '');
    const [accountId, setAccountId] = useState(transaction?.accountId || '');
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const handleCategoryChange = (e) => {
        const { value } = e.target;
        if (value === 'add_new') {
            setShowNewCategoryInput(true);
            setCategoryId('add_new');
        } else {
            setShowNewCategoryInput(false);
            setCategoryId(value);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            alert("Por favor, insira um nome para a nova categoria.");
            return;
        }
        const newCategoryData = { name: newCategoryName.trim(), type };
        const newCategoryRef = await onCategorySubmit(newCategoryData);
        if (newCategoryRef && newCategoryRef.id) {
            setCategoryId(newCategoryRef.id);
            setShowNewCategoryInput(false);
            setNewCategoryName('');
        }
    };

    const handleSuggestCategory = async () => {
        if (!description) {
            alert("Por favor, insira uma descrição primeiro.");
            return;
        }
        setIsSuggesting(true);
        const availableCategories = categories
            .filter(c => c.type === type)
            .map(c => c.name);

        const prompt = `Dada a lista de categorias disponíveis: [${availableCategories.join(", ")}], qual é a categoria mais provável para a seguinte descrição de transação: "${description}"? Responda apenas com o nome da categoria.`;

        try {
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const result = await callGeminiAPI(payload);
            const suggestedCategoryName = result.candidates[0].content.parts[0].text.trim();
            
            const suggestedCategory = categories.find(c => c.name.toLowerCase() === suggestedCategoryName.toLowerCase() && c.type === type);
            
            if (suggestedCategory) {
                setCategoryId(suggestedCategory.id);
            } else {
                alert(`A IA sugeriu "${suggestedCategoryName}", mas não é uma categoria válida. Tente refinar a descrição.`);
            }
        } catch (error) {
            alert("Não foi possível sugerir uma categoria no momento.");
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (categoryId === 'add_new') {
            alert("Por favor, salve a nova categoria antes de continuar.");
            return;
        }
        if (!description || !amount || !date || !categoryId || !accountId) {
            alert("Por favor, preencha todos os campos.");
            return;
        }
        onSubmit({ type, description, amount: parseFloat(amount), date, categoryId, accountId });
        onClose();
    };

    const filteredCategories = useMemo(() => {
        return categories.filter(c => c.type === type);
    }, [type, categories]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">{transaction ? 'Editar' : 'Adicionar'} Transação</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo</label>
                        <select value={type} onChange={(e) => { setType(e.target.value); setCategoryId(''); }} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                            <option value="expense">Despesa</option>
                            <option value="income">Receita</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descrição</label>
                        <div className="relative">
                            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm pr-10" />
                            <button type="button" onClick={handleSuggestCategory} disabled={isSuggesting} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-purple-600 disabled:opacity-50">
                                {isSuggesting ? <div className="w-5 h-5 border-2 border-t-transparent border-purple-600 rounded-full animate-spin"></div> : <SparklesIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Valor</label>
                        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Data</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Categoria</label>
                        <select value={categoryId} onChange={handleCategoryChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                            <option value="">Selecione...</option>
                            <option value="add_new" className="text-blue-600 font-bold">+ Criar nova categoria...</option>
                            {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {showNewCategoryInput && (
                            <div className="flex items-center mt-2">
                                <input 
                                    type="text" 
                                    value={newCategoryName} 
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Nome da nova categoria"
                                    className="flex-grow p-2 border border-gray-300 rounded-l-md"
                                />
                                <button type="button" onClick={handleCreateCategory} className="px-4 py-2 bg-green-500 text-white rounded-r-md hover:bg-green-600">Salvar</button>
                            </div>
                        )}
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Conta</label>
                        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                            <option value="">Selecione...</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CategoryModal = ({ onClose, onSubmit, category }) => {
    const [name, setName] = useState(category?.name || '');
    const [type, setType] = useState(category?.type || 'expense');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name) {
            alert("Por favor, insira o nome da categoria.");
            return;
        }
        onSubmit({ name, type });
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">{category ? 'Editar' : 'Adicionar'} Categoria</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome da Categoria</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo</label>
                        <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                            <option value="expense">Despesa</option>
                            <option value="income">Receita</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AccountModal = ({ onClose, onSubmit, account }) => {
    const [name, setName] = useState(account?.name || '');
    const [type, setType] = useState(account?.type || 'bank');
    const [initialBalance, setInitialBalance] = useState(account?.initialBalance || 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name) {
            alert("Por favor, insira o nome da conta.");
            return;
        }
        onSubmit({ name, type, initialBalance: parseFloat(initialBalance) });
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6">{account ? 'Editar' : 'Adicionar'} Conta</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome da Conta</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
                        <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                            <option value="bank">Conta Corrente</option>
                            <option value="savings">Poupança</option>
                            <option value="cash">Carteira</option>
                            <option value="credit_card">Cartão de Crédito</option>
                            <option value="investment">Investimento</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Saldo Inicial</label>
                        <input type="number" step="0.01" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ImportModal = ({ status, onClose, onDownloadTemplate }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-6">Importar Planilha</h2>
            {status.status === 'loading' && (
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-700">{status.message}</p>
                </div>
            )}
            {status.status === 'success' && (
                <div className="text-green-600">
                    <p className="font-semibold text-lg mb-4">{status.message}</p>
                    <button onClick={onClose} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Fechar</button>
                </div>
            )}
            {status.status === 'error' && (
                 <div className="text-red-600">
                    <p className="font-semibold text-lg mb-4">Falha na Importação</p>
                    <pre className="bg-red-50 text-left p-4 rounded-md whitespace-pre-wrap text-sm">{status.message}</pre>
                    <p className="mt-4 text-sm text-gray-600">
                        Verifique o formato do arquivo. Você pode{' '}
                        <button onClick={onDownloadTemplate} className="text-blue-500 underline hover:text-blue-700">
                            baixar o modelo aqui
                        </button>
                        {' '}para garantir que está correto.
                    </p>
                    <button onClick={onClose} className="mt-6 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Fechar</button>
                </div>
            )}
        </div>
    </div>
);

const AnalysisModal = ({ isAnalyzing, result, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                <SparklesIcon className="w-6 h-6 mr-3 text-purple-600" />
                Análise Financeira Inteligente
            </h2>
            {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
                    <p className="text-gray-600 mt-4">Analisando seus dados...</p>
                </div>
            ) : (
                <div className="text-gray-700 space-y-4 whitespace-pre-wrap font-sans" dangerouslySetInnerHTML={{ __html: result.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>').replace(/\n/g, '<br />') }}>
                </div>
            )}
            <div className="flex justify-end mt-6">
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Fechar</button>
            </div>
        </div>
    </div>
);

export default App;
