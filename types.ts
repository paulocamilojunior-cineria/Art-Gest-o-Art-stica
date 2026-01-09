export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'paid' | 'pending';

// Status do Casting (Simplificado para 3 colunas)
// in_progress: Em Andamento (Substitui registered e inclui edited como flag)
// approved: Aprovado
// not_approved: Não Aprovado
export type CastingStatus = 'in_progress' | 'approved' | 'not_approved';

export interface Casting {
  id: string;
  client: string; // Campanha/Produto/Marca
  productionCompany?: string; // Produtora
  agency: string;
  booker: string;
  exclusivity: string; // Ex: "1 ano TV e Internet"
  usagePeriod: string; // Ex: "3 meses"
  
  // Financeiro Previsto
  feeJob: number;
  dateJobPayment?: string; // Previsão pagamento Job
  
  feeTest?: number;
  hasTestFee: boolean;
  dateTestPayment?: string; // Previsão pagamento Teste
  
  // Datas
  dateCasting: string; // Data de apresentação
  dateTest?: string; // Nova data: Data do Teste ou Selftape (Base para cálculo financeiro teste)
  dateCallback?: string;
  datePPM?: string; // Pré Production Meeting
  dateFitting?: string; // Prova de roupa
  dateShooting: string[]; // Dias de gravação (pode ser mais de um)
  
  status: CastingStatus;
  isEdited: boolean; // Flag para indicar se foi "Editado" / "Callback" / "Opção"
  notes?: string;
}

export interface Transaction {
  id: string;
  date: string; // Data de VENCIMENTO ou PAGAMENTO
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  partner: string;
  status: TransactionStatus;
  originCastingId?: string; // Link para o casting que gerou isso
  isRecurrent?: boolean; // Nova flag para despesa recorrente
  notes?: string;
}

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

export interface SummaryStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  pendingIncome: number; // A receber
  overdueIncome: number; // Atrasados
}

export interface PartnerStat {
  name: string;
  totalValue: number;
  count: number;
  approvalRate?: number; // Para agências
}

export interface CastingStats {
  total: number;
  approved: number;
  edited: number;
  conversionRate: number;
}