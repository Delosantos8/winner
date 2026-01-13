
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { League, Match, PredictionResult, AppSettings, TimePeriod } from './types';
import { PredictionService } from './services/geminiService';
import MatchCard from './components/MatchCard';
import SettingsPanel from './components/SettingsPanel';

const TEAMS_BY_LEAGUE: Record<League, string[]> = {
  [League.PREMIER_LEAGUE]: ['Man City', 'Arsenal', 'Liverpool', 'Aston Villa', 'Tottenham', 'Man United', 'Newcastle', 'Chelsea', 'West Ham', 'Brighton'],
  [League.LA_LIGA]: ['Real Madrid', 'Barcelona', 'Girona', 'Atlético Madrid', 'Bilbao', 'Sociedad', 'Betis', 'Villarreal'],
  [League.SERIE_A]: ['Inter', 'Milan', 'Juventus', 'Bologna', 'Roma', 'Atalanta', 'Lazio', 'Napoli'],
  [League.BUNDESLIGA]: ['Leverkusen', 'Bayern', 'Stuttgart', 'Leipzig', 'Dortmund', 'Frankfurt', 'Wolfsburg'],
  [League.LIGUE_1]: ['PSG', 'Monaco', 'Brest', 'Lille', 'Nice', 'Lyon', 'Marseille'],
  [League.CHAMPIONS_LEAGUE]: ['Real Madrid', 'Man City', 'Bayern', 'PSG', 'Dortmund', 'Arsenal', 'Barcelona'],
  [League.EUROPA_LEAGUE]: ['Liverpool', 'Leverkusen', 'Roma', 'Atalanta', 'Benfica', 'Milan'],
  [League.LIGA_PORTUGAL]: ['Sporting', 'Benfica', 'Porto', 'Braga', 'Vitória SC', 'Arouca'],
  [League.EREDIVISIE]: ['PSV', 'Feyenoord', 'Twente', 'AZ Alkmaar', 'Ajax', 'Utrecht'],
  [League.BELGIAN_PRO]: ['Club Brugge', 'Union SG', 'Anderlecht', 'Genk', 'Gent', 'Antwerp'],
  [League.SUPER_LIG]: ['Galatasaray', 'Fenerbahçe', 'Trabzonspor', 'Beşiktaş', 'Kasımpaşa'],
  [League.GREEK_SUPER_LEAGUE]: ['PAOK', 'AEK Athens', 'Olympiacos', 'Panathinaikos', 'Aris'],
  [League.SCOTTISH_PREM]: ['Celtic', 'Rangers', 'Hearts', 'Kilmarnock', 'Aberdeen']
};

const JARVS_STATES = [
  "Sincronizando Satélites...",
  "Scouting de Clima...",
  "Calculando xG Histórico...",
  "Verificando Lesões...",
  "Analisando Pressão de Mercado...",
  "Otimizando Probabilidades...",
  "Cruzando Dados Teóricos..."
];

const formatDateISO = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const HardwareMonitor: React.FC = () => {
  const [stats, setStats] = useState({ cpu: 12, gpu: 8, net: 94 });
  useEffect(() => {
    const interval = setInterval(() => {
      setStats({
        cpu: Math.floor(Math.random() * 15) + 5,
        gpu: Math.floor(Math.random() * 10) + 2,
        net: Math.floor(Math.random() * 10) + 85
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-950/60 p-5 rounded-[2rem] border border-slate-800/40 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Hardware Engine</span>
        </div>
        <span className="text-[7px] font-bold text-emerald-500 animate-pulse uppercase tracking-wider">Stream Active</span>
      </div>
      <div className="space-y-3">
        {[{ label: 'Neural CPU', value: stats.cpu, color: 'bg-indigo-500' }, { label: 'Analytic GPU', value: stats.gpu, color: 'bg-emerald-500' }, { label: 'Data Stream', value: stats.net, color: 'bg-amber-500' }].map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-[7px] font-bold text-slate-500 uppercase">
              <span>{item.label}</span>
              <span>{item.value}%</span>
            </div>
            <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
              <div className={`h-full ${item.color} transition-all duration-1000`} style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [predictions, setPredictions] = useState<Record<string, PredictionResult>>(() => {
    try {
      const saved = localStorage.getItem('jarvs_preds_final');
      if (saved && saved !== "[object Object]") {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Erro ao carregar previsões:", e);
    }
    return {};
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const defaultSettings: AppSettings = {
      riskLevel: 'Equilibrado',
      includeInjuries: true,
      historicalWeight: 40,
      aiModel: 'gemini-3-flash-preview',
      autoMode: false,
      hardwareAcceleration: true,
      jarvsActive: false,
      jarvsSpeed: 'Normal'
    };
    try {
      const saved = localStorage.getItem('jarvs_settings_final');
      if (saved && saved !== "[object Object]") {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Erro ao carregar configurações:", e);
    }
    return defaultSettings;
  });

  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [selectedLeague, setSelectedLeague] = useState<League | 'Todas'>('Todas');
  const [visibleCount, setVisibleCount] = useState(12);
  const [logs, setLogs] = useState<string[]>(["[SISTEMA] Jarvs Analytic Core Online", "[SISTEMA] Aguardando diretivas de análise..."]);
  const [jarvsStatus, setJarvsStatus] = useState<string>("Standby");

  const predictionService = useMemo(() => new PredictionService(), []);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-10), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const allMatches = useMemo(() => {
    const matches: Match[] = [];
    const leagues = Object.values(League);
    const today = new Date();
    for (let offset = -7; offset <= 14; offset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      const dateISO = formatDateISO(d);
      const dayOfYear = Math.floor(d.getTime() / 86400000);
      
      leagues.forEach((league, lIdx) => {
        const teams = TEAMS_BY_LEAGUE[league];
        const numGames = (d.getDay() === 0 || d.getDay() === 6 ? 4 : 2) + ((lIdx + dayOfYear) % 2);
        
        for(let i = 0; i < numGames; i++) {
          const hIdx = (lIdx * 13 + i * 7 + dayOfYear) % teams.length;
          let aIdx = (hIdx + 1 + (dayOfYear % (teams.length - 1))) % teams.length;
          if (hIdx === aIdx) aIdx = (aIdx + 1) % teams.length;
          
          const hourValue = 10 + ((i * 3 + lIdx) % 13);
          const timeStr = `${hourValue.toString().padStart(2, '0')}:00`;
          
          matches.push({ 
            id: `jarvs-${league}-${dateISO}-${i}`, 
            homeTeam: teams[hIdx], 
            awayTeam: teams[aIdx], 
            league: league, 
            date: dateISO, 
            time: timeStr 
          });
        }
      });
    }
    return matches;
  }, []);

  const filteredMatches = useMemo(() => {
    const targetDateISO = formatDateISO(currentDate);
    const query = debouncedSearch.toLowerCase().trim();
    return allMatches.filter(m => {
      const leagueMatch = selectedLeague === 'Todas' || m.league === selectedLeague;
      const dateMatch = m.date === targetDateISO;
      const textMatch = !query || m.homeTeam.toLowerCase().includes(query) || m.awayTeam.toLowerCase().includes(query);
      
      let periodMatch = true;
      const hour = parseInt(m.time.split(':')[0]);
      if (selectedPeriod === 'Manhã') periodMatch = hour < 12;
      else if (selectedPeriod === 'Tarde') periodMatch = hour >= 12 && hour < 18;
      else if (selectedPeriod === 'Noite') periodMatch = hour >= 18;

      return leagueMatch && dateMatch && textMatch && periodMatch;
    });
  }, [allMatches, selectedLeague, currentDate, debouncedSearch, selectedPeriod]);

  const handleAnalyze = useCallback(async (match: Match) => {
    if (loadingIds.has(match.id)) return;
    addLog(`Deep Scan Iniciado: ${match.homeTeam}`);
    setLoadingIds(prev => new Set(prev).add(match.id));
    try {
      const result = await predictionService.predictMatch(match, settings);
      setPredictions(prev => ({ ...prev, [match.id]: result }));
      addLog(`Resultados sincronizados para ${match.homeTeam}.`);
    } catch (error) { 
      addLog(`Falha na inferência de ${match.homeTeam}.`);
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(match.id);
        return next;
      });
    }
  }, [predictionService, settings, addLog, loadingIds]);

  useEffect(() => {
    if (!settings.jarvsActive) { setJarvsStatus("Standby"); return; }
    
    const intervalTime = settings.jarvsSpeed === 'Turbo' ? 4000 : 12000;
    const jarvsCore = setInterval(() => {
      setJarvsStatus(JARVS_STATES[Math.floor(Math.random() * JARVS_STATES.length)]);
      
      const pending = filteredMatches.find(m => !predictions[m.id] && !loadingIds.has(m.id));
      if (pending) {
        handleAnalyze(pending);
      } else {
        const leagues = ['Todas', ...Object.values(League)];
        const nextIdx = (leagues.indexOf(selectedLeague as any) + 1) % leagues.length;
        setSelectedLeague(leagues[nextIdx] as any);
      }
    }, intervalTime);
    
    return () => clearInterval(jarvsCore);
  }, [settings.jarvsActive, settings.jarvsSpeed, filteredMatches, predictions, loadingIds, selectedLeague, handleAnalyze]);

  useEffect(() => {
    localStorage.setItem('jarvs_preds_final', JSON.stringify(predictions));
  }, [predictions]);

  useEffect(() => {
    localStorage.setItem('jarvs_settings_final', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  return (
    <div className={`min-h-screen bg-[#020617] text-slate-300 p-4 lg:p-12 selection:bg-indigo-500/30 ${!settings.hardwareAcceleration ? 'no-blur' : ''}`}>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.03)_0%,transparent_100%)] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-8 relative z-10">
        <aside className="w-full lg:w-[360px] flex flex-col gap-6 shrink-0 lg:sticky lg:top-12 lg:h-[calc(100vh-6rem)]">
          
          <div className={`bg-slate-900/40 p-6 rounded-[2.5rem] border ${settings.jarvsActive ? 'border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.1)]' : 'border-slate-800/40'} flex flex-col transition-all duration-500 backdrop-blur-xl`}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${settings.jarvsActive ? 'bg-indigo-600/20 border-indigo-400 animate-pulse' : 'bg-slate-800 border-slate-700'}`}>
                <div className={`w-6 h-6 rounded-full border-2 ${settings.jarvsActive ? 'border-indigo-400 border-t-transparent animate-spin' : 'border-slate-500'}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-white tracking-widest italic uppercase leading-none">JARVS ANALYTIC</h3>
                <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-[0.2em] mt-2 block truncate">{jarvsStatus}</span>
              </div>
              <button 
                onClick={() => setSettings(s => ({ ...s, jarvsActive: !s.jarvsActive }))} 
                className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${settings.jarvsActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400'}`}
              >
                {settings.jarvsActive ? 'ONLINE' : 'OFFLINE'}
              </button>
            </div>
          </div>

          <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800/40 backdrop-blur-xl flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2 pb-4">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">Filtro Temporal</label>
                <div className="flex gap-1.5 p-1.5 bg-slate-950/40 rounded-xl border border-slate-800/50">
                  <button onClick={() => { const n = new Date(currentDate); n.setDate(n.getDate()-1); setCurrentDate(n); }} className="flex-1 py-2.5 rounded-lg bg-slate-900 text-[9px] font-black uppercase hover:bg-slate-800 transition-colors">Ontem</button>
                  <button onClick={() => setCurrentDate(new Date())} className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-[9px] font-black uppercase shadow-lg shadow-indigo-900/40">Hoje</button>
                  <button onClick={() => { const n = new Date(currentDate); n.setDate(n.getDate()+1); setCurrentDate(n); }} className="flex-1 py-2.5 rounded-lg bg-slate-900 text-[9px] font-black uppercase hover:bg-slate-800 transition-colors">Amanhã</button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">Janela do Dia</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['Todos', 'Manhã', 'Tarde', 'Noite'] as TimePeriod[]).map(period => (
                    <button 
                      key={period} 
                      onClick={() => setSelectedPeriod(period)} 
                      className={`py-2.5 rounded-xl text-[9px] font-black uppercase border transition-all ${selectedPeriod === period ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:bg-slate-800'}`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">Deep Scout Ligas</label>
                <div className="grid gap-1.5">
                  {['Todas', ...Object.values(League)].map(league => (
                    <button 
                      key={league} 
                      onClick={() => setSelectedLeague(league as any)} 
                      className={`text-left px-4 py-3 rounded-xl text-[9px] font-black border truncate transition-all ${selectedLeague === league ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg translate-x-1' : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:bg-slate-800'}`}
                    >
                      {league.split(' (')[0].toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <HardwareMonitor />
          <SettingsPanel settings={settings} onChange={setSettings} />
          
          <div className="bg-black/80 rounded-3xl p-5 border border-slate-800/40 font-mono h-24 flex flex-col shrink-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 text-[8px]">
              {logs.map((log, i) => (
                <div key={i} className="text-slate-500 opacity-60 flex gap-2">
                  <span className="text-indigo-500 font-bold shrink-0">>></span>
                  <span className="leading-tight uppercase">{log}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col gap-8">
          <header className={`bg-slate-900/20 p-8 rounded-[2.5rem] border border-slate-800/40 backdrop-blur-md flex flex-col gap-6`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-12 bg-indigo-500 rounded-full" />
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Terminal de Scout</h2>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">
                    {filteredMatches.length} NODOS DETECTADOS EM {selectedPeriod.toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="LOCALIZAR CLUBE..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-64 bg-slate-950/60 border border-slate-800 rounded-xl py-3.5 px-4 text-[9px] font-black text-white outline-none focus:border-indigo-500 transition-all uppercase placeholder-slate-700 shadow-inner" 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1 h-1 bg-indigo-500 rounded-full animate-pulse" />
                </div>
                <button 
                  onClick={() => { setPredictions({}); addLog("Neural cache flushed."); }} 
                  className="p-3.5 bg-slate-950/40 hover:bg-slate-900 text-slate-500 rounded-xl border border-slate-800 transition-all active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" strokeWidth={2} /></svg>
                </button>
              </div>
            </div>
          </header>

          {filteredMatches.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-40 bg-slate-900/10 rounded-[3rem] border border-dashed border-slate-800/40">
              <div className="w-12 h-12 border-2 border-slate-800 rounded-full flex items-center justify-center mb-6 opacity-20">
                <span className="text-white text-xl">!</span>
              </div>
              <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest">Nenhum evento na janela {selectedPeriod}</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredMatches.slice(0, visibleCount).map(match => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  prediction={predictions[match.id]} 
                  loading={loadingIds.has(match.id)} 
                  onAnalyze={handleAnalyze} 
                />
              ))}
            </div>
          )}
          
          <div className={`flex justify-center py-12 ${visibleCount >= filteredMatches.length ? 'hidden' : ''}`}>
            <button 
              onClick={() => setVisibleCount(v => v + 12)} 
              className="px-8 py-3 bg-slate-900 border border-slate-800 rounded-xl text-[9px] font-black uppercase text-slate-500 hover:text-white hover:border-indigo-500 transition-all shadow-xl active:scale-95"
            >
              Expandir Base de Dados
            </button>
          </div>
        </main>
      </div>

      {showScrollTop && (
        <button 
          onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} 
          className="fixed bottom-8 right-8 w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 z-50 hover:scale-110 transition-all active:scale-90"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 15l7-7 7 7" strokeWidth={3} /></svg>
        </button>
      )}
    </div>
  );
};

export default App;
