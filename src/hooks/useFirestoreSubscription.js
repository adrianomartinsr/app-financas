// src/hooks/useFirestoreSubscription.js
import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

/**
 * Hook personalizado para se inscrever a uma coleção do Firestore em tempo real.
 * @param {string} collectionName - O nome da coleção para ouvir.
 * @param {string} userId - O ID do usuário atual.
 * @returns {Array} - Um array com os dados da coleção.
 */
const useFirestoreSubscription = (collectionName, userId) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        // Não executa se não houver userId ou nome da coleção
        if (!userId || !collectionName) {
            setData([]);
            return;
        }

        const collectionPath = `users/${userId}/${collectionName}`;
        const q = query(collection(db, collectionPath));

        // onSnapshot cria um listener em tempo real
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setData(documents);
        }, (error) => {
            console.error(`Erro ao buscar dados de ${collectionName}:`, error);
        });

        // Função de limpeza: remove o listener quando o componente é desmontado
        return () => unsubscribe();

    }, [collectionName, userId]); // Re-executa o efeito se o nome da coleção ou o userId mudar

    return data;
};

export default useFirestoreSubscription;
