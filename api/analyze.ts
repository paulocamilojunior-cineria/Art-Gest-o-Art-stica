import { GoogleGenAI } from "@google/genai";

// Esta função roda no servidor (Node.js) da Vercel
export default async function handler(req: any, res: any) {
  // Configurar CORS para permitir que seu frontend chame esta função
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Acessa a variável de ambiente segura do servidor
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("API Key missing on server");
    return res.status(500).json({ error: 'Server configuration error: API Key missing' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return res.status(200).json({ text: response.text });

  } catch (error: any) {
    console.error("Gemini API Error on Server:", error);
    return res.status(500).json({ error: 'Failed to communicate with AI service', details: error.message });
  }
}