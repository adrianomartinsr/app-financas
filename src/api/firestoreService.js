// src/api/firestoreService.js
import { db } from '../config/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

// ... (addOrUpdateDoc, deleteDocById, processPayment, etc. permanecem os mesmos)
export const addOrUpdateDoc = (collectionName, data, id, userId) => {
    const path = `users/${userId}/${collectionName}`;
    if (id) {
        return updateDoc(doc(db, path, id), data);
    }
    return addDoc(collection(db, path), data);
};

export const deleteDocById = (collectionName, id, userId) => {
    const path = `users/${userId}/${collectionName}`;
    return deleteDoc(doc(db, path, id));
};

export const processPayment = async ({ transaction, sourceAccountId, paymentDate }, userId) => {
    const transactionRef = doc(db, `users/${userId}/transactions`, transaction.id);
    return updateDoc(transactionRef, {
        status: 'paid',
        paymentInfo: { 
            sourceAccountId, 
            paymentDate 
        }
    });
};

/**
 * NOVO: Desfaz um pagamento, revertendo o status da transação para 'pendente'.
 * @param {string} transactionId - O ID da transação a ser revertida.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise}
 */
export const undoPayment = (transactionId, userId) => {
    const transactionRef = doc(db, `users/${userId}/transactions`, transactionId);
    return updateDoc(transactionRef, {
        status: 'pending',
        paymentInfo: null // Remove as informações de pagamento
    });
};

export const schedulePayment = async ({ transaction, scheduledDate }, userId) => {
    const transactionRef = doc(db, `users/${userId}/transactions`, transaction.id);
    return updateDoc(transactionRef, {
        status: 'scheduled',
        scheduledDate: scheduledDate,
    });
};

/**
 * NOVO: Cancela um agendamento, revertendo o status da transação para 'pendente'.
 * @param {string} transactionId - O ID da transação agendada.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise}
 */
export const cancelScheduling = (transactionId, userId) => {
    const transactionRef = doc(db, `users/${userId}/transactions`, transactionId);
    return updateDoc(transactionRef, {
        status: 'pending',
        scheduledDate: null // Remove a data de agendamento
    });
};

// ... (confirmForecastedIncome e importTransactionsBatch permanecem os mesmos)
export const confirmForecastedIncome = async (forecastedIncome, userId) => {
    const batch = writeBatch(db);
    const userPath = `users/${userId}`;
    const incomeRef = doc(db, `${userPath}/forecastedIncomes`, forecastedIncome.id);
    batch.update(incomeRef, { status: 'received' });
    const newTransactionRef = doc(collection(db, `${userPath}/transactions`));
    batch.set(newTransactionRef, {
        amount: forecastedIncome.amount,
        date: forecastedIncome.expectedDate,
        description: `Receita Prevista: ${forecastedIncome.description}`,
        type: 'income',
        accountId: forecastedIncome.accountId,
        categoryId: forecastedIncome.categoryId,
        status: 'paid'
    });
    return batch.commit();
};

export const importTransactionsBatch = async (transactionsToCreate, userId) => {
    const batch = writeBatch(db);
    const transactionsCollection = collection(db, `users/${userId}/transactions`);
    transactionsToCreate.forEach(trans => {
        const docRef = doc(transactionsCollection);
        batch.set(docRef, trans);
    });
    return batch.commit();
};
