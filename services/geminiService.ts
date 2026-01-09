import { Transaction, SummaryStats, PartnerStat, Casting } from "../types";

const prepareDataForAI = (
  transactions: Transaction[], 
  castings: Casting[],
  summary: SummaryStats, 
  topPartners: PartnerStat[]
) => {
  
  const castingStats = {
    total: castings.length,
    approved: castings.filter(c => c.status === 'approved').length,
    edited: castings.filter(c => c.isEdited).length
  };

  return {
    summary,
    castingStats,
    topPartners: topPartners.slice(0, 5),
    recentCastings: castings.slice(0, 5).map(c => ({
      role: c.client,
      status: c.status,
      agency: c.agency
    }))
  };
};

export const getFinancialInsights = async (
  transactions: Transaction[],
  castings: Casting[],
  summary: SummaryStats,
  topPartners: PartnerStat[]
): Promise<string> => {
  
  // Prepara os dados localmente
  const dataContext = JSON.stringify(prepareDataForAI(transactions, castings, summary, topPartners));

  const prompt = `
    Atue como um manager de carreira artística e consultor financeiro.
    Analise os dados de um Ator/Atriz:
    
    Dados: ${dataContext}
    
    Forneça uma análise curta em Markdown:
    1. **Conversão de Testes**: Analise a taxa de aprovação (Aprovados/Total). Se estiver baixo, sugira foco em renovar material ou cursos. Se alto, sugira aumentar o cachê.
    2. **Saúde Financeira**: Analise o fluxo de caixa e os recebíveis pendentes (Cachês a cair).
    3. **Estratégia**: Baseado nos parceiros (Agências), onde focar energia?
    4. **Dica**: Dica prática sobre gestão de carreira ou reserva financeira para entressafra.
  `;

  try {
    // Chama a nossa API segura na Vercel (Serverless Function)
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro na requisição');
    }

    const data = await response.json();
    return data.text || "Sem insights no momento.";
  } catch (error) {
    console.error("Gemini Service Error:", error);
    return "Não foi possível gerar a análise. Verifique se a API Key está configurada no painel da Vercel.";
  }
};