// src/utils/excelUtils.js
import * as XLSX from 'xlsx';

/**
 * Gera e baixa uma planilha de modelo para importação.
 */
export const downloadTemplate = () => {
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

/**
 * Lê um arquivo de planilha e o converte para JSON.
 * @param {File} file - O arquivo a ser lido.
 * @returns {Promise<Array<object>>} - Uma promessa que resolve para os dados em JSON.
 */
export const readFileAsJson = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { raw: false });
                resolve(json);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};
