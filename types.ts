
export enum League {
  CHAMPIONS_LEAGUE = 'Champions League (Europa)',
  EUROPA_LEAGUE = 'Europa League (Europa)',
  PREMIER_LEAGUE = 'Premier League (Inglaterra)',
  LA_LIGA = 'La Liga (Espanha)',
  SERIE_A = 'Série A (Itália)',
  BUNDESLIGA = 'Bundesliga (Alemanha)',
  LIGUE_1 = 'Ligue 1 (França)',
  LIGA_PORTUGAL = 'Liga Portugal (Portugal)',
  EREDIVISIE = 'Eredivisie (Holanda)',
  BELGIAN_PRO = 'Pro League (Bélgica)',
  SUPER_LIG = 'Süper Lig (Turquia)',
  GREEK_SUPER_LEAGUE = 'Super League (Grécia)',
  SCOTTISH_PREM = 'Premiership (Escócia)'
}

export type TimePeriod = 'Todos' | 'Manhã' | 'Tarde' | 'Noite';

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: League;
  date: string;
  time: string; // Formato HH:mm
}

export interface SearchSource {
  title: string;
  uri: string;
}

export interface MatchStats {
  expectedGoals: { home: number; away: number };
  recentPossession: { home: number; away: number };
  defenseStrength: { home: number; away: number };
}

export interface PredictionResult {
  matchId: string;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  confidence: number;
  volatility: number; 
  reasoning: string;
  recommendedBet: string;
  keyFactors: string[];
  stats: MatchStats;
  sources: SearchSource[];
  timestamp: number;
}

export interface AppSettings {
  riskLevel: 'Conservador' | 'Equilibrado' | 'Agressivo';
  includeInjuries: boolean;
  historicalWeight: number;
  aiModel: 'gemini-3-flash-preview' | 'gemini-3-pro-preview';
  autoMode: boolean;
  hardwareAcceleration: boolean;
  jarvsActive: boolean;
  jarvsSpeed: 'Normal' | 'Turbo';
}
