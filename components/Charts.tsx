import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Transaction, Casting } from '../types';

interface ChartsProps {
  transactions?: Transaction[];
  castings?: Casting[];
}

const COLORS = ['#0ea5e9', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
const STATUS_COLORS = {
  registered: '#94a3b8', // slate
  edited: '#f59e0b', // amber
  approved: '#10b981', // emerald
  not_approved: '#ef4444' // red
};

export const IncomeExpenseChart: React.FC<ChartsProps> = ({ transactions = [] }) => {
  const dataMap = new Map<string, { name: string; income: number; expense: number }>();

  transactions.forEach(t => {
    const date = new Date(t.date);
    const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
    
    if (!dataMap.has(key)) {
      dataMap.set(key, { name: key, income: 0, expense: 0 });
    }
    
    const entry = dataMap.get(key)!;
    if (t.type === 'income') {
      entry.income += t.amount;
    } else {
      entry.expense += t.amount;
    }
  });

  const data = Array.from(dataMap.values()).sort((a, b) => {
    const [ma, ya] = a.name.split('/');
    const [mb, yb] = b.name.split('/');
    return new Date(parseInt(ya), parseInt(ma)).getTime() - new Date(parseInt(yb), parseInt(mb)).getTime();
  });

  return (
    <div className="h-72 w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">Fluxo de Caixa</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `k`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
          />
          <Legend />
          <Bar dataKey="income" name="Entradas" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CastingFunnelChart: React.FC<ChartsProps> = ({ castings = [] }) => {
  const counts = {
    registered: 0,
    edited: 0,
    approved: 0,
    not_approved: 0
  };

  castings.forEach(c => {
    if (counts[c.status] !== undefined) {
      counts[c.status]++;
    }
  });

  const data = [
    { name: 'Total Castings', value: castings.length, fill: '#64748b' },
    { name: 'Editados (Shortlist)', value: counts.edited, fill: '#f59e0b' },
    { name: 'Aprovados', value: counts.approved, fill: '#10b981' },
  ];

  return (
    <div className="h-72 w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">Performance de Castings</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
          <Tooltip cursor={{fill: 'transparent'}} />
          <Bar dataKey="value" barSize={30} radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
