import { Transaction, Casting } from '../types';

const STORAGE_KEY_TRANSACTIONS = 'art_fin_transactions_v3';
const STORAGE_KEY_CASTINGS = 'art_fin_castings_v3';

// --- TRANSACTIONS ---

export const loadTransactions = (): Transaction[] => {
  const data = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
  if (!data) return [];
  try { return JSON.parse(data); } catch (e) { return []; }
};

export const saveTransactions = (transactions: Transaction[]) => {
  localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
};

// --- CASTINGS ---

export const loadCastings = (): Casting[] => {
  const data = localStorage.getItem(STORAGE_KEY_CASTINGS);
  if (!data) return [];
  try { return JSON.parse(data); } catch (e) { return []; }
};

export const saveCastings = (castings: Casting[]) => {
  localStorage.setItem(STORAGE_KEY_CASTINGS, JSON.stringify(castings));
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// --- SEEDING ---

export const seedDataIfEmpty = (): { transactions: Transaction[], castings: Casting[] } => {
  const currentTrans = loadTransactions();
  const currentCastings = loadCastings();
  
  if (currentTrans.length > 0 || currentCastings.length > 0) {
    return { transactions: currentTrans, castings: currentCastings };
  }

  // Demo Data for Actor Flow
  const demoCastings: Casting[] = [
    {
      id: 'c1',
      client: 'Comercial Banco X',
      agency: 'Agência Models',
      booker: 'Ana',
      exclusivity: 'Bancos - 6 meses',
      usagePeriod: '6 meses TV Aberta',
      feeJob: 5000,
      feeTest: 150,
      hasTestFee: true,
      dateCasting: '2024-02-10',
      dateTest: '2024-02-10',
      dateShooting: ['2024-02-20', '2024-02-21'],
      status: 'approved',
      isEdited: true
    },
    {
      id: 'c2',
      client: 'Série Streaming',
      agency: 'Elenco Top',
      booker: 'Carlos',
      exclusivity: 'Não',
      usagePeriod: 'Obra completa',
      feeJob: 12000,
      hasTestFee: false,
      dateCasting: '2024-03-01',
      dateTest: '2024-03-02',
      dateCallback: '2024-03-05',
      dateShooting: ['2024-04-10'],
      status: 'in_progress',
      isEdited: true // Shortlist / Opção
    },
    {
      id: 'c3',
      client: 'Campanha Cerveja',
      agency: 'Public Casting',
      booker: 'Mariana',
      exclusivity: 'Bebidas alcoólicas - 1 ano',
      usagePeriod: '1 ano Digital',
      feeJob: 8000,
      hasTestFee: true,
      dateCasting: '2024-03-15',
      dateTest: '2024-03-16',
      dateShooting: ['2024-03-25'],
      status: 'not_approved',
      isEdited: false
    }
  ];

  // Transactions generated from the approved casting above + some expenses
  const demoTransactions: Transaction[] = [
    { 
      id: 't1', 
      date: '2024-03-20', // 30 days after shoot
      description: 'Cachê Job: Banco X', 
      amount: 5000, 
      type: 'income', 
      category: 'Publicidade', 
      partner: 'Agência Models', 
      status: 'pending',
      originCastingId: 'c1'
    },
    { 
      id: 't2', 
      date: '2024-02-25', // 15 days after test
      description: 'Cachê Teste: Banco X', 
      amount: 150, 
      type: 'income', 
      category: 'Cachê Teste', 
      partner: 'Agência Models', 
      status: 'paid',
      originCastingId: 'c1'
    },
    { 
      id: 't3', 
      date: '2024-02-10', 
      description: 'Uber para Teste Banco X', 
      amount: 45.90, 
      type: 'expense', 
      category: 'Transporte', 
      partner: 'Uber', 
      status: 'paid' 
    },
    { 
      id: 't4', 
      date: '2024-01-15', 
      description: 'Atualização de Book', 
      amount: 800, 
      type: 'expense', 
      category: 'Material de Trabalho', 
      partner: 'Fotógrafo João', 
      status: 'paid' 
    }
  ];

  saveCastings(demoCastings);
  saveTransactions(demoTransactions);
  
  return { transactions: demoTransactions, castings: demoCastings };
};

export const importFromCSV = (csvText: string): Transaction[] => {
  // Mantendo a lógica anterior para compatibilidade simples
  const lines = csvText.split('\n');
  const newTransactions: Transaction[] = [];
  const startIdx = lines[0].toLowerCase().includes('date') || lines[0].toLowerCase().includes('data') ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 5) continue;
    const amount = parseFloat(parts[2]);
    if (isNaN(amount)) continue;

    newTransactions.push({
      id: generateId(),
      date: parts[0].trim(),
      description: parts[1].trim(),
      amount: Math.abs(amount),
      type: parts[3].trim().toLowerCase().includes('saída') ? 'expense' : 'income',
      category: parts[4]?.trim() || 'Geral',
      partner: parts[5]?.trim() || 'Desconhecido',
      status: parts[6]?.trim().toLowerCase().includes('pendente') ? 'pending' : 'paid'
    });
  }
  return newTransactions;
};