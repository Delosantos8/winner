
import { GoogleGenAI, Type } from "@google/genai";
import { Match, PredictionResult, AppSettings, SearchSource } from "../types";

export class PredictionService {
  constructor() {}

  private extractJson(text: string): string {
    if (!text || typeof text !== 'string') return "";
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return text.substring(start, end + 1);
    }
    return text;
  }

  private cleanJsonString(text: string): string {
    if (!text) return "";
    return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
  }

  private normalizeProbabilities(result: any): any {
    const home = Number(result.homeWinProb) || 0;
    const draw = Number(result.drawProb) || 0;
    const away = Number(result.awayWinProb) || 0;
    const sum = home + draw + away;
    if (sum === 0) return { ...result, homeWinProb: 33, drawProb: 34, awayWinProb: 33 };
    const factor = 100 / sum;
    result.homeWinProb = Math.round(home * factor);
    result.drawProb = Math.round(draw * factor);
    result.awayWinProb = 100 - (result.homeWinProb + result.drawProb);
    return result;
  }

  async predictMatch(match: Match, settings: AppSettings): Promise<PredictionResult> {
    const systemInstruction = `Você é o sistema analítico Jarvs (Just A Really Very Smart system). 
    Sua função é atuar como um motor de inteligência preditiva para futebol europeu. 
    Sua análise deve ser rigorosa, baseada em dados estatísticos recentes (xG, forma, desfalques) e informações em tempo real via Google Search. 
    Considere o viés de risco definido pelo usuário: ${settings.riskLevel}. 
    Mantenha um tom profissional e técnico.`;

    const prompt = `Analise a partida: ${match.homeTeam} vs ${match.awayTeam} (${match.league}). 
    Data do evento: ${match.date}. 
    Utilize o Google Search para verificar notícias de última hora, suspensões de jogadores chave e condições climáticas. 
    Retorne os resultados estruturados em JSON.`;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: settings.aiModel,
        contents: prompt,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              homeWinProb: { type: Type.NUMBER },
              drawProb: { type: Type.NUMBER },
              awayWinProb: { type: Type.NUMBER },
              confidence: { type: Type.NUMBER },
              volatility: { type: Type.NUMBER },
              reasoning: { type: Type.STRING },
              recommendedBet: { type: Type.STRING },
              keyFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
              stats: {
                type: Type.OBJECT,
                properties: {
                  expectedGoals: { 
                    type: Type.OBJECT, 
                    properties: { home: { type: Type.NUMBER }, away: { type: Type.NUMBER } } 
                  },
                  recentPossession: { 
                    type: Type.OBJECT, 
                    properties: { home: { type: Type.NUMBER }, away: { type: Type.NUMBER } } 
                  },
                  defenseStrength: { 
                    type: Type.OBJECT, 
                    properties: { home: { type: Type.NUMBER }, away: { type: Type.NUMBER } } 
                  }
                }
              }
            },
            required: ["homeWinProb", "drawProb", "awayWinProb", "confidence", "volatility", "reasoning", "recommendedBet", "keyFactors", "stats"]
          }
        }
      });

      const rawText = response.text || "";
      const jsonText = this.cleanJsonString(this.extractJson(rawText));
      
      if (!jsonText || jsonText === "[object Object]") {
        throw new Error("Resposta da IA inválida ou malformada");
      }

      let result = JSON.parse(jsonText);
      result = this.normalizeProbabilities(result);

      const sources: SearchSource[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web) sources.push({ title: chunk.web.title || "Fonte de Dados", uri: chunk.web.uri });
        });
      }
      
      return { ...result, sources: sources.slice(0, 5), matchId: match.id, timestamp: Date.now() };
    } catch (error: any) {
      console.error("Jarvs Analysis Failure:", error);
      throw error;
    }
  }
}
