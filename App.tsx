import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Users, 
  Calendar as CalendarIcon, 
  Clapperboard, 
  Plus, 
  Bell, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Menu,
  X,
  Sparkles,
  Clock,
  DollarSign,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  ChevronLeft,
  CalendarDays,
  List,
  ExternalLink,
  Info,
  Receipt,
  CreditCard,
  ChevronDown,
  BarChart2
} from 'lucide-react';
import { Transaction, TransactionType, SummaryStats, PartnerStat, Casting, CastingStatus } from './types';
import { loadTransactions, saveTransactions, loadCastings, saveCastings, seedDataIfEmpty, generateId } from './services/storageService';
import { getFinancialInsights } from './services/geminiService';
import { IncomeExpenseChart, CastingFunnelChart } from './components/Charts';

// --- Helper Functions ---

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const addDaysToDate = (dateStr: string, days: number): string => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  date.setDate(date.getDate() + days);
  
  const newY = date.getFullYear();
  const newM = String(date.getMonth() + 1).padStart(2, '0');
  const newD = String(date.getDate()).padStart(2, '0');
  return `${newY}-${newM}-${newD}`;
};

const getMonthName = (monthIndex: number) => {
  const date = new Date(2024, monthIndex, 1);
  return date.toLocaleString('pt-BR', { month: 'long' });
};

const formatCurrency = (value: number | undefined) => {
  if (value === undefined || value === null) return '';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getStatusLabel = (status: CastingStatus) => {
  switch (status) {
    case 'approved': return 'Aprovado';
    case 'not_approved': return 'Não Aprovado';
    default: return 'Em Andamento';
  }
};

const getGoogleCalendarLink = (title: string, dateStr: string, details: string) => {
  const date = dateStr.replace(/-/g, '');
  const dates = `${date}/${date}`;
  const baseUrl = "https://calendar.google.com/calendar/render";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: dates,
    details: details,
  });
  return `${baseUrl}?${params.toString()}`;
};

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-brand-50 text-brand-600 font-medium' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <Icon size={20} />
    <span>{label}</span>
  </button>
);

const StatCard = ({ title, value, type, icon: Icon, subtext }: any) => {
  const colors = {
    neutral: 'bg-white text-slate-900 border-slate-100',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    danger: 'bg-red-50 text-red-700 border-red-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100'
  };

  return (
    <div className={`p-6 rounded-xl border shadow-sm ${colors[type]} flex flex-col relative overflow-hidden`}>
      <div className="flex justify-between items-start mb-4 z-10">
        <span className="text-sm font-medium opacity-80">{title}</span>
        <div className={`p-2 rounded-full ${type === 'neutral' ? 'bg-slate-100' : 'bg-white/50'}`}>
          <Icon size={18} />
        </div>
      </div>
      <span className="text-2xl font-bold tracking-tight z-10">
        {typeof value === 'number' ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}
      </span>
      {subtext && <p className="text-xs mt-2 opacity-70 z-10">{subtext}</p>}
    </div>
  );
};

// --- Modals ---

const ExpenseModal = ({ isOpen, onClose, onSave }: any) => {
  if (!isOpen) return null;
  const [expense, setExpense] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Transporte',
    isRecurrent: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...expense,
      amount: parseFloat(expense.amount.replace(',', '.')),
      type: 'expense'
    });
    onClose();
    setExpense({ description: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'Transporte', isRecurrent: false });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
            <Receipt size={24} className="text-red-500" /> Nova Despesa
          </h3>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-text">Descrição</label>
            <input required className="input-field" value={expense.description} onChange={e => setExpense({...expense, description: e.target.value})} placeholder="Ex: Uber, Alimentação" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="label-text">Valor (R$)</label>
               <input required type="number" step="0.01" className="input-field" value={expense.amount} onChange={e => setExpense({...expense, amount: e.target.value})} placeholder="0.00" />
             </div>
             <div>
               <label className="label-text">Data Pagamento</label>
               <input required type="date" className="input-field" value={expense.date} onChange={e => setExpense({...expense, date: e.target.value})} />
             </div>
          </div>
          <div>
             <label className="label-text">Categoria</label>
             <select className="input-field" value={expense.category} onChange={e => setExpense({...expense, category: e.target.value})}>
               <option>Transporte</option>
               <option>Alimentação</option>
               <option>Figurino / Maquiagem</option>
               <option>Material de Trabalho</option>
               <option>Cursos / Workshops</option>
               <option>Outros</option>
             </select>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="recurrent" checked={expense.isRecurrent} onChange={e => setExpense({...expense, isRecurrent: e.target.checked})} className="w-4 h-4 text-brand-600 rounded" />
            <label htmlFor="recurrent" className="text-sm text-slate-700">Despesa Mensal (Recorrente)</label>
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold mt-4 hover:bg-slate-800">Salvar Despesa</button>
        </form>
      </div>
    </div>
  );
};

const CastingModal = ({ isOpen, onClose, onSave, casting }: any) => {
  if (!isOpen) return null;
  
  const [formData, setFormData] = useState<Partial<Casting>>(
    casting || {
      dateCasting: new Date().toISOString().split('T')[0],
      dateTest: '',
      status: 'in_progress',
      isEdited: false,
      feeJob: 0,
      feeTest: 0,
      hasTestFee: false,
      dateShooting: [],
      client: '',
      productionCompany: '',
      agency: '',
      booker: '',
      exclusivity: '',
      usagePeriod: ''
    }
  );

  const [shootingDateInput, setShootingDateInput] = useState('');
  const [activeField, setActiveField] = useState<string | null>(null);

  useEffect(() => {
    if (formData.dateShooting && formData.dateShooting.length > 0) {
      const dates = [...formData.dateShooting].sort();
      const lastDate = dates[dates.length - 1];
      const predicted = addDaysToDate(lastDate, 30);
      setFormData(prev => ({...prev, dateJobPayment: predicted}));
    }
  }, [formData.dateShooting]);

  useEffect(() => {
    if (formData.dateTest) {
      const predicted = addDaysToDate(formData.dateTest, 15);
      setFormData(prev => ({...prev, dateTestPayment: predicted}));
    }
  }, [formData.dateTest]);


  const addShootingDate = () => {
    if (shootingDateInput && !formData.dateShooting?.includes(shootingDateInput)) {
      setFormData({ ...formData, dateShooting: [...(formData.dateShooting || []), shootingDateInput] });
      setShootingDateInput('');
    }
  };

  const removeShootingDate = (date: string) => {
    setFormData({ ...formData, dateShooting: formData.dateShooting?.filter(d => d !== date) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalShootingDates = [...(formData.dateShooting || [])];
    if (shootingDateInput && !finalShootingDates.includes(shootingDateInput)) {
      finalShootingDates.push(shootingDateInput);
    }

    if (finalShootingDates.length === 0) {
      alert("Atenção: A data de gravação (Diária) é obrigatória. Por favor, adicione uma data.");
      return;
    }

    onSave({ 
      ...formData, 
      id: formData.id || generateId(),
      dateShooting: finalShootingDates, 
      feeJob: Number(formData.feeJob),
      feeTest: Number(formData.feeTest)
    });
    onClose();
  };

  const handleCurrencyChange = (field: 'feeJob' | 'feeTest', value: string) => {
    const cleanValue = value.replace(/[^\d.,]/g, '');
    const dotValue = cleanValue.replace(',', '.');
    const finalValue = parseFloat(dotValue);
    setFormData({ ...formData, [field]: isNaN(finalValue) ? 0 : finalValue });
  };

  const getDisplayValue = (field: 'feeJob' | 'feeTest') => {
    const val = formData[field];
    if (activeField === field) return val === 0 ? '' : val;
    return formatCurrency(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] transition-all transform scale-100">
        
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl z-10 shrink-0">
          <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
            <div className="bg-brand-50 p-2 rounded-lg text-brand-600">
              <Clapperboard size={20} />
            </div>
            {casting ? 'Editar Casting' : 'Novo Casting'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <form id="castingForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
              <label className="block text-sm font-semibold text-slate-700 mb-3">Status Atual</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setFormData({...formData, status: 'in_progress'})} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${formData.status === 'in_progress' ? 'bg-white border-blue-500 text-blue-600 ring-2 ring-blue-200' : 'bg-white border-slate-200 text-slate-500'}`}>Em Andamento</button>
                <button type="button" onClick={() => setFormData({...formData, status: 'approved'})} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${formData.status === 'approved' ? 'bg-white border-emerald-500 text-emerald-600 ring-2 ring-emerald-200' : 'bg-white border-slate-200 text-slate-500'}`}>Aprovado</button>
                <button type="button" onClick={() => setFormData({...formData, status: 'not_approved'})} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${formData.status === 'not_approved' ? 'bg-white border-red-500 text-red-600 ring-2 ring-red-200' : 'bg-white border-slate-200 text-slate-500'}`}>Não Aprovado</button>
              </div>
              
              {formData.status !== 'approved' && (
                <div className="mt-4 flex items-center gap-2">
                   <input type="checkbox" id="isEdited" checked={formData.isEdited} onChange={e => setFormData({...formData, isEdited: e.target.checked})} className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500" />
                   <label htmlFor="isEdited" className="text-sm font-medium text-slate-700">Este trabalho foi Editado / Está em Callback?</label>
                </div>
              )}

              {formData.status === 'approved' && (
                <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg flex items-center border border-emerald-100">
                  <Sparkles size={14} className="mr-2 text-emerald-600"/> 
                  <span>Ao salvar como <strong>Aprovado</strong>, o financeiro será lançado automaticamente.</span>
                </div>
              )}
            </div>

            <div className="space-y-5">
               <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Informações do Trabalho</h4>
               <div>
                  <label className="label-text text-base">Marca / Cliente / Produto</label>
                  <input required type="text" className="input-field text-lg font-medium py-3" placeholder="Ex: Comercial Banco X, Filme Y"
                    value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} />
               </div>
               <div>
                  <label className="label-text">Produtora</label>
                  <input type="text" className="input-field" placeholder="Ex: O2 Filmes, Boiler..."
                    value={formData.productionCompany || ''} onChange={e => setFormData({...formData, productionCompany: e.target.value})} />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label-text">Agência</label>
                <input required type="text" className="input-field" placeholder="Ex: Agência Models"
                  value={formData.agency} onChange={e => setFormData({...formData, agency: e.target.value})} />
              </div>
              <div>
                <label className="label-text">Booker / Contato</label>
                <input type="text" className="input-field" placeholder="Ex: Ana"
                  value={formData.booker} onChange={e => setFormData({...formData, booker: e.target.value})} />
              </div>
              <div>
                <label className="label-text">Data de Apresentação</label>
                <input required type="date" className="input-field"
                  value={formData.dateCasting} onChange={e => setFormData({...formData, dateCasting: e.target.value})} />
              </div>
               <div>
                <label className="label-text">Data do Teste ou Selftape</label>
                <input type="date" className="input-field border-blue-200"
                  value={formData.dateTest || ''} onChange={e => setFormData({...formData, dateTest: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div>
                <label className="label-text">Período de Veiculação</label>
                <input type="text" className="input-field bg-white" placeholder="Ex: 3 meses TV Aberta"
                  value={formData.usagePeriod} onChange={e => setFormData({...formData, usagePeriod: e.target.value})} />
              </div>
              <div>
                <label className="label-text">Exclusividade</label>
                <input type="text" className="input-field bg-white" placeholder="Ex: Segmento Bancário"
                  value={formData.exclusivity} onChange={e => setFormData({...formData, exclusivity: e.target.value})} />
              </div>
            </div>

            <div className="pt-2">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider"><Clock size={16} className="text-brand-500"/> Calendário de Produção</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label-text">Prova de Figurino (Fitting) <span className="text-slate-400 font-normal ml-1">(Opcional)</span></label>
                  <input type="date" className="input-field"
                    value={formData.dateFitting || ''} onChange={e => setFormData({...formData, dateFitting: e.target.value})} />
                </div>
                <div>
                  <label className="label-text">PPM (Reunião Pré-Produção) <span className="text-slate-400 font-normal ml-1">(Opcional)</span></label>
                  <input type="date" className="input-field"
                    value={formData.datePPM || ''} onChange={e => setFormData({...formData, datePPM: e.target.value})} />
                </div>
                
                <div className="md:col-span-2">
                  <label className="label-text flex items-center gap-1 text-slate-800 font-semibold">
                    Dias de Gravação (Diárias) <span className="text-red-500" title="Obrigatório">*</span>
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input type="date" className={`input-field max-w-xs ${shootingDateInput ? 'border-brand-300 ring-2 ring-brand-100' : ''}`}
                      value={shootingDateInput} onChange={e => setShootingDateInput(e.target.value)} />
                    
                    <button type="button" onClick={addShootingDate} className={`p-2.5 rounded-lg transition-all flex items-center gap-2 font-medium ${shootingDateInput ? 'bg-brand-600 text-white shadow-md hover:bg-brand-700 animate-pulse' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                      <Plus size={20}/> {shootingDateInput && <span className="text-xs">Adicionar</span>}
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 min-h-[2rem]">
                    {formData.dateShooting?.map((d, idx) => (
                      <span key={idx} className="bg-brand-50 text-brand-800 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 border border-brand-200 shadow-sm">
                        {formatDate(d)} <button type="button" onClick={() => removeShootingDate(d)} className="text-brand-400 hover:text-red-500 hover:bg-brand-100 rounded-full p-0.5"><X size={14}/></button>
                      </span>
                    ))}
                    {(!formData.dateShooting || formData.dateShooting.length === 0) && (
                      <div className="text-xs text-amber-600 flex items-center py-1 bg-amber-50 px-3 rounded-lg border border-amber-100 w-full">
                         <AlertTriangle size={14} className="mr-2"/> Necessário adicionar ao menos uma data de gravação.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
              <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider"><DollarSign size={16}/> Valores e Previsões</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 border-b border-emerald-100 pb-4">
                <div>
                  <label className="label-text text-emerald-900 font-bold mb-2">Cachê do Trabalho (Bruto)</label>
                  <div className="flex items-center">
                    <span className="text-emerald-600 font-bold text-xl mr-2">R$</span>
                    <input required type="text" inputMode="decimal" className="input-field border-emerald-200 focus:border-emerald-500 focus:ring-emerald-200 text-lg font-bold text-emerald-600 placeholder-emerald-300"
                      placeholder="0,00" value={getDisplayValue('feeJob')} onFocus={() => setActiveField('feeJob')} onBlur={() => setActiveField(null)} onChange={e => handleCurrencyChange('feeJob', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label-text text-emerald-800 flex items-center gap-1">Previsão de Pagamento <span className="text-xs font-normal text-emerald-600">(Gravação + 30 dias)</span></label>
                  <input type="date" className="input-field border-emerald-200 focus:ring-emerald-200"
                    value={formData.dateJobPayment || ''} onChange={e => setFormData({...formData, dateJobPayment: e.target.value})} />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center mb-3">
                    <input type="checkbox" id="hasTestFee" className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                    checked={formData.hasTestFee} onChange={e => setFormData({...formData, hasTestFee: e.target.checked})} />
                    <label htmlFor="hasTestFee" className="ml-2 text-sm font-bold text-emerald-900 cursor-pointer">Incluir Cachê Teste?</label>
                </div>

                {formData.hasTestFee && (
                  <div className="animate-fade-in bg-emerald-100/50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className="label-text text-emerald-900 w-full">Valor Cachê Teste (R$ 120,00 + 30,00 por vídeo adicional)</label>
                        <div className="flex items-center">
                          <span className="text-emerald-600 font-bold text-xl mr-2">R$</span>
                          <input type="text" inputMode="decimal" className="input-field border-emerald-200 focus:border-emerald-500 focus:ring-emerald-200 text-lg font-bold text-emerald-600 placeholder-emerald-300" 
                            placeholder="0,00" value={getDisplayValue('feeTest')} onFocus={() => setActiveField('feeTest')} onBlur={() => setActiveField(null)} onChange={e => handleCurrencyChange('feeTest', e.target.value)} />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="label-text text-emerald-800 flex items-center gap-1">Previsão Pagamento Teste <span className="text-xs font-normal text-emerald-600">(Data Teste + 15 dias)</span></label>
                        <input type="date" className="input-field border-emerald-200 focus:ring-emerald-200"
                          value={formData.dateTestPayment || ''} onChange={e => setFormData({...formData, dateTestPayment: e.target.value})} />
                      </div>
                    </div>
                    <div className="mt-3 flex items-start gap-2 text-xs text-emerald-800 bg-white/60 p-2 rounded border border-emerald-100">
                      <Info size={14} className="mt-0.5 shrink-0"/>
                      <span>O cachê teste deve ser pago em até <strong>15 dias corridos</strong> conforme CCT SATED/SIAESP vigente para o biênio 2026/2027.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
        
        <div className="p-4 bg-white border-t border-slate-100 rounded-b-2xl shrink-0 z-10">
          <button 
            onClick={(e) => {
              const form = document.getElementById('castingForm') as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/30 flex justify-center items-center gap-2"
          >
            <CheckCircle size={20} /> Salvar Casting
          </button>
        </div>
      </div>
    </div>
  );
};

// --- App ---

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'castings' | 'calendar' | 'financial' | 'spreadsheets' | 'expenses'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [castings, setCastings] = useState<Casting[]>([]);
  
  const [isCastingModalOpen, setIsCastingModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [editingCasting, setEditingCasting] = useState<Casting | null>(null);
  
  // UI State - Filters
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('year'); // 'month', 'quarter', 'semester_1', 'semester_2', 'year'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    const { transactions: t, castings: c } = seedDataIfEmpty();
    setTransactions(t);
    setCastings(c);
  }, []);

  useEffect(() => { saveTransactions(transactions); }, [transactions]);
  useEffect(() => { saveCastings(castings); }, [castings]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    const today = new Date().getFullYear();
    years.add(today);
    castings.forEach(c => years.add(new Date(c.dateCasting).getFullYear()));
    transactions.forEach(t => years.add(new Date(t.date).getFullYear()));
    return Array.from(years).sort((a,b) => b-a);
  }, [castings, transactions]);

  const handleSaveCasting = (casting: Casting) => {
    const isNewApproval = casting.status === 'approved' && (!editingCasting || editingCasting.status !== 'approved');
    
    if (editingCasting) {
      setCastings(prev => prev.map(c => c.id === casting.id ? casting : c));
    } else {
      setCastings(prev => [casting, ...prev]);
    }

    if (isNewApproval) {
      const newTransactions: Transaction[] = [];
      let jobDate = casting.dateJobPayment;
      if (!jobDate) {
         const baseDateStr = casting.dateShooting && casting.dateShooting.length > 0 
          ? casting.dateShooting[casting.dateShooting.length - 1] 
          : casting.dateCasting;
         jobDate = addDaysToDate(baseDateStr, 30);
      }

      newTransactions.push({
        id: generateId(),
        date: jobDate,
        description: `Cachê Job: ${casting.client}`,
        amount: casting.feeJob,
        type: 'income',
        category: 'Cachê Publicidade',
        partner: casting.agency,
        status: 'pending',
        originCastingId: casting.id
      });

      if (casting.hasTestFee && casting.feeTest) {
        let testDate = casting.dateTestPayment;
        if (!testDate) {
           testDate = addDaysToDate(casting.dateTest || casting.dateCasting, 15);
        }
        newTransactions.push({
          id: generateId(),
          date: testDate,
          description: `Cachê Teste: ${casting.client}`,
          amount: casting.feeTest,
          type: 'income',
          category: 'Cachê Teste',
          partner: casting.agency,
          status: 'pending',
          originCastingId: casting.id
        });
      }
      setTransactions(prev => [...newTransactions, ...prev]);
      alert(`Parabéns! O casting foi aprovado e ${newTransactions.length} lançamentos foram criados no financeiro.`);
    }
    setEditingCasting(null);
  };

  const handleSaveExpense = (expense: any) => {
    const newTrans: Transaction = {
      id: generateId(),
      date: expense.date,
      description: expense.description,
      amount: expense.amount,
      type: 'expense',
      category: expense.category,
      partner: 'Outros',
      status: 'paid',
      isRecurrent: expense.isRecurrent
    };
    setTransactions(prev => [newTrans, ...prev]);
  };

  const markTransactionAsPaid = (tId: string) => {
    setTransactions(prev => prev.map(t => t.id === tId ? { ...t, status: 'paid' } : t));
  };

  // Filter Logic
  const filteredData = useMemo(() => {
    const filterFn = (dateStr: string) => {
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = d.getMonth();

      if (selectedYear !== 'all' && year !== selectedYear) return false;
      if (selectedPeriod === 'all') return true;
      if (selectedPeriod === 'semester_1') return month < 6;
      if (selectedPeriod === 'semester_2') return month >= 6;
      if (selectedPeriod === 'quarter_1') return month < 3;
      if (selectedPeriod === 'quarter_2') return month >= 3 && month < 6;
      if (selectedPeriod === 'quarter_3') return month >= 6 && month < 9;
      if (selectedPeriod === 'quarter_4') return month >= 9;
      return true; 
    };

    return {
      transactions: transactions.filter(t => filterFn(t.date)).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      castings: castings.filter(c => filterFn(c.dateCasting)).sort((a,b) => new Date(b.dateCasting).getTime() - new Date(a.dateCasting).getTime())
    };
  }, [transactions, castings, selectedYear, selectedPeriod]);

  const stats = useMemo<SummaryStats>(() => {
    const today = new Date().toISOString().split('T')[0];
    return filteredData.transactions.reduce((acc, curr) => {
      if (curr.type === 'income') {
        if (curr.status === 'paid') acc.totalIncome += curr.amount;
        if (curr.status === 'pending') {
          acc.pendingIncome += curr.amount;
          if (curr.date < today) acc.overdueIncome += curr.amount;
        }
      } else {
        if (curr.status === 'paid') acc.totalExpense += curr.amount;
      }
      return acc;
    }, { totalIncome: 0, totalExpense: 0, balance: 0, pendingIncome: 0, overdueIncome: 0 });
  }, [filteredData.transactions]);
  stats.balance = stats.totalIncome - stats.totalExpense;

  const handleRunAi = async () => {
    setLoadingAi(true);
    setAiAnalysis(null);
    const result = await getFinancialInsights(filteredData.transactions, filteredData.castings, stats, []);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  // --- Views ---

  const CalendarView = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const events: any[] = [];
    
    castings.forEach(c => {
      if (c.dateFitting) events.push({ date: c.dateFitting, title: `Prova: ${c.client}`, type: 'fitting', id: c.id });
      if (c.datePPM) events.push({ date: c.datePPM, title: `PPM: ${c.client}`, type: 'ppm', id: c.id });
      c.dateShooting?.forEach(d => events.push({ date: d, title: `Gravação: ${c.client}`, type: 'job', id: c.id }));

      if (c.dateJobPayment && (c.status === 'approved' || c.isEdited)) {
        events.push({ date: c.dateJobPayment, title: `$: ${c.client}`, type: 'payment_job', id: c.id, details: `R$ ${formatCurrency(c.feeJob)}` });
      }
      if (c.dateTestPayment && c.hasTestFee && (c.status === 'approved' || c.isEdited || c.status === 'in_progress')) {
        events.push({ date: c.dateTestPayment, title: `$ Teste: ${c.client}`, type: 'payment_test', id: c.id, details: `R$ ${formatCurrency(c.feeTest)}` });
      }
    });

    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const days = [];
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
      for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
      return days;
    };
    const days = getDaysInMonth(currentDate);
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon className="text-brand-600"/> 
              <span className="capitalize">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
            </h3>
            <div className="flex gap-2">
                 <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft/></button>
                 <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-full"><ChevronRight/></button>
            </div>
          </div>
           
           <div className="space-y-4">
             <div className="grid grid-cols-7 gap-1 text-center mb-2">
               {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={i} className="text-xs font-bold text-slate-400 py-1">{d}</div>)}
             </div>
             
             <div className="grid grid-cols-7 gap-1">
               {days.map((day, idx) => {
                 if (!day) return <div key={idx} className="aspect-square bg-transparent"></div>;
                 const dayStr = day.toISOString().split('T')[0];
                 const dayEvents = events.filter(e => e.date === dayStr);
                 const isToday = day.toDateString() === new Date().toDateString();
                 return (
                   <div key={idx} className={`aspect-square border border-slate-100 rounded-lg p-1 flex flex-col items-center justify-start hover:border-brand-200 transition-colors ${isToday ? 'bg-brand-50 border-brand-200' : 'bg-white'}`}>
                     <span className={`text-xs font-medium mb-1 ${isToday ? 'text-brand-700' : 'text-slate-600'}`}>{day.getDate()}</span>
                     <div className="flex flex-wrap justify-center gap-1 w-full">
                       {dayEvents.map((evt, i) => (
                         <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                            evt.type === 'job' ? 'bg-emerald-500' : 
                            evt.type === 'fitting' ? 'bg-purple-500' : 
                            evt.type === 'ppm' ? 'bg-orange-500' : 
                            evt.type === 'payment_job' ? 'bg-blue-600' : 'bg-cyan-400'
                          }`} title={evt.title} />
                       ))}
                     </div>
                   </div>
                 );
               })}
             </div>
             <div className="flex gap-3 justify-center mt-4 text-[10px] md:text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> PPM</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Prova</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Job</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600"></div> $ Job</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-400"></div> $ Teste</span>
             </div>
           </div>
      </div>
    );
  };

  const CastingsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-180px)]">
      {['in_progress', 'approved', 'not_approved'].map((status) => {
         const items = filteredData.castings.filter(c => c.status === status);
         const labels: Record<string, string> = { in_progress: 'Em Andamento', approved: 'Aprovados', not_approved: 'Não Aprovados' };
         const colors: Record<string, string> = { in_progress: 'border-blue-200', approved: 'border-emerald-200 bg-emerald-50/20', not_approved: 'border-red-200 bg-red-50/20' };

         return (
           <div key={status} className={`bg-white rounded-xl shadow-sm border ${colors[status]} flex flex-col h-full`}>
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/50 rounded-t-xl">
               <h3 className="font-bold text-slate-700 text-sm">{labels[status]}</h3>
               <span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs font-bold text-slate-600">{items.length}</span>
             </div>
             <div className="p-3 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
               {items.map(c => (
                 <div key={c.id} onClick={() => { setEditingCasting(c); setIsCastingModalOpen(true); }} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group">
                   {c.isEdited && status !== 'approved' && (
                     <div className="absolute top-2 right-2 flex gap-1">
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">CALLBACK</span>
                     </div>
                   )}
                   <span className="text-xs text-slate-400 block mb-1">{formatDate(c.dateCasting)}</span>
                   <h4 className="font-semibold text-slate-800 text-sm leading-tight mb-1">{c.client}</h4>
                   <p className="text-xs text-slate-500">{c.agency}</p>
                 </div>
               ))}
             </div>
           </div>
         );
      })}
    </div>
  );

  const FinancialView = () => (
    <div className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Saldo Realizado" value={stats.balance} type="neutral" icon={Wallet} />
        <StatCard title="A Receber (Previsto)" value={stats.pendingIncome} type="warning" icon={Clock} />
        {stats.overdueIncome > 0 && (
          <StatCard title="ATRASADOS" value={stats.overdueIncome} type="danger" icon={AlertTriangle} subtext="Cobre as agências!" />
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Controle de Recebíveis e Pagamentos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-3">Data Venc.</th>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3">Parceiro</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.transactions.map(t => (
                <tr key={t.id} className="border-b hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-600">{formatDate(t.date)}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{t.description}</p>
                    <p className="text-xs text-slate-500">{t.category}</p>
                  </td>
                  <td className="px-6 py-4">{t.partner}</td>
                  <td className={`px-6 py-4 font-bold ${t.type === 'expense' ? 'text-red-500' : 'text-emerald-600'}`}>
                    {t.type === 'expense' ? '-' : '+'} R$ {t.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold inline-flex items-center gap-1
                      ${t.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                        (new Date(t.date) < new Date() ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')
                      }`}>
                      {t.status === 'paid' ? <CheckCircle size={10}/> : <Clock size={10}/>}
                      {t.status === 'paid' ? 'PAGO' : (new Date(t.date) < new Date() ? 'ATRASADO' : 'PENDENTE')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {t.status === 'pending' && (
                      <button 
                        onClick={() => markTransactionAsPaid(t.id)}
                        className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700 transition-colors"
                      >
                        Marcar Pago
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredData.transactions.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Nenhum lançamento encontrado para este período.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const SpreadsheetsView = () => {
    const [tab, setTab] = useState<'jobs' | 'finance' | 'consolidated' | 'seasonality'>('jobs');

    const consolidatedData = useMemo(() => {
      const months = Array.from({length: 12}, (_, i) => i);
      return months.map(monthIndex => {
        const monthTrans = filteredData.transactions.filter(t => new Date(t.date).getMonth() === monthIndex);
        const incomePaid = monthTrans.filter(t => t.type === 'income' && t.status === 'paid').reduce((acc, t) => acc + t.amount, 0);
        const incomePending = monthTrans.filter(t => t.type === 'income' && t.status === 'pending').reduce((acc, t) => acc + t.amount, 0);
        const expense = monthTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        
        return {
          month: getMonthName(monthIndex),
          incomePaid,
          incomePending,
          expense,
          balance: (incomePaid + incomePending) - expense
        };
      });
    }, [filteredData.transactions]);

    const seasonalityData = useMemo(() => {
       // Filter Logic for Seasonality: Ignore Year Filter, but Respect Period Filter (Month Range)
       let startM = 0, endM = 11;
       if (selectedPeriod === 'semester_1') { endM = 5; }
       else if (selectedPeriod === 'semester_2') { startM = 6; }
       else if (selectedPeriod === 'quarter_1') { endM = 2; }
       else if (selectedPeriod === 'quarter_2') { startM = 3; endM = 5; }
       else if (selectedPeriod === 'quarter_3') { startM = 6; endM = 8; }
       else if (selectedPeriod === 'quarter_4') { startM = 9; }

       const months = Array.from({length: 12}, (_, i) => i);
       // Filter only the months relevant to the selected period
       const relevantMonths = months.filter(m => m >= startM && m <= endM);

       return relevantMonths.map(monthIndex => {
          // Aggregate from ALL years (using base `transactions` state, not filteredData)
          const allTrans = transactions.filter(t => new Date(t.date).getMonth() === monthIndex);
          const income = allTrans.filter(t => t.type === 'income' && t.status === 'paid').reduce((acc, t) => acc + t.amount, 0);
          return { month: getMonthName(monthIndex), income };
       });
    }, [transactions, selectedPeriod]);

    return (
      <div className="space-y-6">
        <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto">
           <button onClick={() => setTab('jobs')} className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap ${tab === 'jobs' ? 'bg-white border border-b-0 text-brand-600' : 'bg-slate-100 text-slate-500'}`}>Jobs (Castings)</button>
           <button onClick={() => setTab('finance')} className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap ${tab === 'finance' ? 'bg-white border border-b-0 text-brand-600' : 'bg-slate-100 text-slate-500'}`}>Recebíveis/Pagos</button>
           <button onClick={() => setTab('consolidated')} className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap ${tab === 'consolidated' ? 'bg-white border border-b-0 text-brand-600' : 'bg-slate-100 text-slate-500'}`}>Consolidado</button>
           <button onClick={() => setTab('seasonality')} className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap ${tab === 'seasonality' ? 'bg-white border border-b-0 text-brand-600' : 'bg-slate-100 text-slate-500'}`}>Sazonalidade</button>
        </div>

        <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
           {tab === 'jobs' && (
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left border-collapse">
                 <thead className="bg-slate-800 text-white text-xs uppercase">
                   <tr>
                     <th className="px-4 py-3 border border-slate-700 text-white">Data Casting</th>
                     <th className="px-4 py-3 border border-slate-700 text-white">Job / Cliente</th>
                     <th className="px-4 py-3 border border-slate-700 text-white">Cachê Previsto</th>
                     <th className="px-4 py-3 border border-slate-700 text-white">Agência</th>
                     <th className="px-4 py-3 border border-slate-700 text-white">Status</th>
                   </tr>
                 </thead>
                 <tbody>
                   {filteredData.castings.map((c, i) => (
                     <tr key={c.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-brand-50`}>
                       <td className="px-4 py-2 border border-slate-200 text-slate-900">{formatDate(c.dateCasting)}</td>
                       <td className="px-4 py-2 border border-slate-200 font-medium text-slate-900">{c.client}</td>
                       <td className="px-4 py-2 border border-slate-200 text-slate-900">R$ {c.feeJob.toLocaleString('pt-BR')}</td>
                       <td className="px-4 py-2 border border-slate-200 text-slate-900">{c.agency}</td>
                       <td className="px-4 py-2 border border-slate-200">
                         <span className={`text-xs px-2 py-0.5 rounded font-bold ${c.status === 'approved' ? 'bg-green-200 text-green-800' : 'bg-slate-200 text-slate-700'}`}>
                           {getStatusLabel(c.status)}
                         </span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}

           {tab === 'finance' && (
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left border-collapse">
                 <thead className="bg-emerald-900 text-white text-xs uppercase">
                   <tr>
                     <th className="px-4 py-3 border border-emerald-800 text-white">Data</th>
                     <th className="px-4 py-3 border border-emerald-800 text-white">Descrição</th>
                     <th className="px-4 py-3 border border-emerald-800 text-white">Categoria</th>
                     <th className="px-4 py-3 border border-emerald-800 text-white">Valor</th>
                     <th className="px-4 py-3 border border-emerald-800 text-white">Status</th>
                   </tr>
                 </thead>
                 <tbody>
                   {filteredData.transactions.map((t, i) => (
                     <tr key={t.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-emerald-50`}>
                       <td className="px-4 py-2 border border-slate-200 text-slate-900">{formatDate(t.date)}</td>
                       <td className="px-4 py-2 border border-slate-200 font-medium text-slate-900">{t.description}</td>
                       <td className="px-4 py-2 border border-slate-200 text-slate-900">{t.category}</td>
                       <td className="px-4 py-2 border border-slate-200 text-slate-900">R$ {t.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                       <td className="px-4 py-2 border border-slate-200">
                         <span className={`text-xs px-2 py-0.5 rounded ${t.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                           {t.status === 'paid' ? 'PAGO' : 'PENDENTE'}
                         </span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}

           {tab === 'consolidated' && (
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left border-collapse">
                 <thead className="bg-slate-900 text-white text-xs uppercase">
                   <tr>
                     <th className="px-4 py-3 border border-slate-700 w-32 text-white">Mês</th>
                     <th className="px-4 py-3 border border-slate-700 bg-yellow-900/50 text-yellow-100 text-right">A Receber</th>
                     <th className="px-4 py-3 border border-slate-700 bg-green-900/50 text-green-100 text-right">Realizado (Pago)</th>
                     <th className="px-4 py-3 border border-slate-700 bg-red-900/50 text-red-100 text-right">Saídas</th>
                     <th className="px-4 py-3 border border-slate-700 text-right text-white">Saldo Previsto</th>
                   </tr>
                 </thead>
                 <tbody>
                   {consolidatedData.map((d, i) => (
                     <tr key={i} className="hover:bg-slate-100">
                       <td className="px-4 py-3 border border-slate-300 font-bold capitalize bg-slate-50 text-slate-900">{d.month}</td>
                       <td className="px-4 py-3 border border-slate-300 text-right text-yellow-700 bg-yellow-50">R$ {d.incomePending.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                       <td className="px-4 py-3 border border-slate-300 text-right text-green-700 bg-green-50">R$ {d.incomePaid.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                       <td className="px-4 py-3 border border-slate-300 text-right text-red-700 bg-red-50">R$ {d.expense.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                       <td className="px-4 py-3 border border-slate-300 text-right font-bold bg-slate-50 text-slate-900">R$ {d.balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                     </tr>
                   ))}
                   <tr className="bg-slate-800 text-white font-bold">
                     <td className="px-4 py-3 border border-slate-700 text-white">TOTAL DO PERÍODO</td>
                     <td className="px-4 py-3 border border-slate-700 text-right text-yellow-300">
                       R$ {consolidatedData.reduce((acc, curr) => acc + curr.incomePending, 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                     </td>
                     <td className="px-4 py-3 border border-slate-700 text-right text-green-300">
                       R$ {consolidatedData.reduce((acc, curr) => acc + curr.incomePaid, 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                     </td>
                     <td className="px-4 py-3 border border-slate-700 text-right text-red-300">
                       R$ {consolidatedData.reduce((acc, curr) => acc + curr.expense, 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                     </td>
                     <td className="px-4 py-3 border border-slate-700 text-right text-white">
                       R$ {consolidatedData.reduce((acc, curr) => acc + curr.balance, 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                     </td>
                   </tr>
                 </tbody>
               </table>
             </div>
           )}

           {tab === 'seasonality' && (
             <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-slate-700 flex items-center gap-2">
                    <BarChart2 className="text-emerald-500"/> Performance Histórica Acumulada
                  </h4>
                  <span className="text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-100">
                    Soma de todos os anos disponíveis
                  </span>
                </div>
                
                <div className="h-64 flex items-end justify-between gap-2">
                   {seasonalityData.map((d, i) => {
                     const max = Math.max(...seasonalityData.map(x => x.income));
                     const height = max > 0 ? (d.income / max) * 100 : 0;
                     return (
                       <div key={i} className="flex-1 flex flex-col items-center justify-end group h-full">
                          <div className="text-xs font-bold text-emerald-600 mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">R$ {(d.income/1000).toFixed(1)}k</div>
                          <div className="w-full bg-emerald-200 hover:bg-emerald-400 rounded-t-lg transition-all relative group-hover:shadow-lg" style={{height: `${height}%`, minHeight: '4px'}}></div>
                          <div className="text-xs font-semibold uppercase mt-3 text-slate-500 truncate w-full text-center border-t border-slate-100 pt-2">{d.month.substring(0,3)}</div>
                       </div>
                     )
                   })}
                   {seasonalityData.length === 0 && (
                     <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                       Sem dados para o período selecionado.
                     </div>
                   )}
                </div>
             </div>
           )}
        </div>
      </div>
    );
  };

  const ExpensesView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
         <h3 className="font-bold text-slate-800">Minhas Despesas</h3>
         <button onClick={() => setIsExpenseModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-800">Adicionar Despesa</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
            <tr>
              <th className="px-6 py-3">Data</th>
              <th className="px-6 py-3">Descrição</th>
              <th className="px-6 py-3">Categoria</th>
              <th className="px-6 py-3">Recorrente?</th>
              <th className="px-6 py-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.transactions.filter(t => t.type === 'expense').map(t => (
              <tr key={t.id} className="border-b hover:bg-slate-50">
                <td className="px-6 py-4 font-mono text-slate-600">{formatDate(t.date)}</td>
                <td className="px-6 py-4 font-medium">{t.description}</td>
                <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{t.category}</span></td>
                <td className="px-6 py-4">{t.isRecurrent ? 'Sim' : 'Não'}</td>
                <td className="px-6 py-4 font-bold text-red-600">- R$ {formatCurrency(t.amount)}</td>
              </tr>
            ))}
            {filteredData.transactions.filter(t => t.type === 'expense').length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Nenhuma despesa encontrada neste período.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-50 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 border-b border-slate-100">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/20">Art</div>
             <div><h1 className="font-bold text-slate-900 leading-tight">Gestão<br/>Artística</h1></div>
           </div>
        </div>
        <nav className="p-4 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={view === 'dashboard'} onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={Clapperboard} label="Meus Castings" active={view === 'castings'} onClick={() => { setView('castings'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={Receipt} label="Despesas" active={view === 'expenses'} onClick={() => { setView('expenses'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={CalendarIcon} label="Calendário" active={view === 'calendar'} onClick={() => { setView('calendar'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={DollarSign} label="Financeiro" active={view === 'financial'} onClick={() => { setView('financial'); setIsSidebarOpen(false); }} />
          <SidebarItem icon={FileSpreadsheet} label="Planilhas" active={view === 'spreadsheets'} onClick={() => { setView('spreadsheets'); setIsSidebarOpen(false); }} />
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen relative">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 sticky top-0 z-30 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button className="md:hidden" onClick={() => setIsSidebarOpen(true)}><Menu/></button>
            <h2 className="text-xl font-bold text-slate-800 capitalize">{view === 'dashboard' ? 'Visão Geral' : view === 'spreadsheets' ? 'Planilhas Gerenciais' : view === 'expenses' ? 'Despesas' : view === 'calendar' ? 'Calendário' : view === 'financial' ? 'Financeiro' : 'Castings'}</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Filter Selector */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
               <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="bg-transparent text-sm font-semibold px-2 py-1 outline-none text-slate-700">
                 <option value="all">Todos os Anos</option>
                 {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
               </select>
               <div className="w-px h-4 bg-slate-300 mx-1"></div>
               <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="bg-transparent text-sm font-semibold px-2 py-1 outline-none text-slate-700">
                 <option value="year">Anual (Completo)</option>
                 <option value="semester_1">1º Semestre</option>
                 <option value="semester_2">2º Semestre</option>
                 <option value="quarter_1">1º Trimestre</option>
                 <option value="quarter_2">2º Trimestre</option>
                 <option value="quarter_3">3º Trimestre</option>
                 <option value="quarter_4">4º Trimestre</option>
               </select>
            </div>

            {/* Fab Button Logic */}
            <div className="relative">
              <button 
                onClick={() => setIsFabOpen(!isFabOpen)}
                className="bg-brand-600 hover:bg-brand-700 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
              >
                <Plus size={24}/>
              </button>
              {isFabOpen && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in z-50">
                  <button onClick={() => { setIsFabOpen(false); setEditingCasting(null); setIsCastingModalOpen(true); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Clapperboard size={16}/> Novo Casting
                  </button>
                  <button onClick={() => { setIsFabOpen(false); setIsExpenseModalOpen(true); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium text-slate-700 border-t border-slate-50">
                    <Receipt size={16}/> Nova Despesa
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          {view === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Aprovação (Geral)</p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-slate-800">
                        {castings.length > 0 
                          ? Math.round((castings.filter(c => c.status === 'approved').length / castings.length) * 100) 
                          : 0}%
                      </span>
                    </div>
                 </div>
                 <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">A Receber</p>
                    <span className="text-3xl font-bold text-amber-500 block">R$ {stats.pendingIncome.toLocaleString('pt-BR', {compactDisplay: 'short', notation: 'compact'})}</span>
                 </div>
                 <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm col-span-2 relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-center h-full">
                       <div>
                         <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Faturamento (Período)</p>
                         <span className="text-3xl font-bold text-emerald-600">R$ {stats.totalIncome.toLocaleString('pt-BR', {compactDisplay: 'short'})}</span>
                       </div>
                       <button onClick={handleRunAi} disabled={loadingAi} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors">
                         <Sparkles size={16}/> {loadingAi ? 'Analisando...' : 'Análise IA'}
                       </button>
                    </div>
                 </div>
              </div>
              {aiAnalysis && (
                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl">
                  <h3 className="text-indigo-800 font-bold mb-3 flex items-center gap-2"><Sparkles size={18}/> Insights</h3>
                  <div className="prose prose-sm max-w-none text-indigo-900/80" dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <CastingFunnelChart castings={filteredData.castings} />
                 <IncomeExpenseChart transactions={filteredData.transactions} />
              </div>
            </div>
          )}

          {view === 'castings' && <CastingsView />}
          {view === 'calendar' && <CalendarView />}
          {view === 'financial' && <FinancialView />}
          {view === 'expenses' && <ExpensesView />}
          {view === 'spreadsheets' && <SpreadsheetsView />}
        </div>
      </main>

      <CastingModal 
        isOpen={isCastingModalOpen} 
        onClose={() => setIsCastingModalOpen(false)}
        onSave={handleSaveCasting}
        casting={editingCasting}
      />
      
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
      />
    </div>
  );
};

const inputStyles = document.createElement('style');
inputStyles.innerHTML = `
  input, select, textarea, .input-field { width: 100%; padding: 0.5rem 0.75rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; outline: none; font-size: 0.875rem; transition: all 0.2s; background-color: #ffffff !important; color: #1e293b !important; }
  input:focus, select:focus, textarea:focus, .input-field:focus { border-color: #0ea5e9; box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.1); }
  .label-text { display: block; font-size: 0.75rem; font-weight: 500; color: #64748b; margin-bottom: 0.25rem; }
`;
document.head.appendChild(inputStyles);

export default App;