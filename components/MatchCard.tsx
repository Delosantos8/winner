
import React, { memo, useState, useEffect, useRef } from 'react';
import { Match, PredictionResult } from '../types';

interface MatchCardProps {
  match: Match;
  prediction?: PredictionResult;
  loading: boolean;
  onAnalyze: (match: Match) => void;
}

const MatchCard: React.FC<MatchCardProps> = memo(({ match, prediction, loading, onAnalyze }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { 
      threshold: 0.05, 
      rootMargin: '300px' 
    });
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const getProbColor = (p: number) => p > 50 ? 'text-emerald-400' : p > 35 ? 'text-amber-400' : 'text-slate-400';
  const getBarColor = (p: number) => p > 50 ? 'bg-emerald-500 shadow-[0_0_10px_#10b98144]' : p > 35 ? 'bg-amber-500' : 'bg-slate-600';
  const displayDate = match.date.split('-').reverse().slice(0, 2).join('/');

  return (
    <div ref={cardRef} style={{ contentVisibility: 'auto', containIntrinsicSize: '0 250px' } as any} className={`group relative flex flex-col bg-slate-900/30 border border-slate-800/40 rounded-[2rem] p-5 transition-all duration-500 hover:border-indigo-500/40 ${prediction ? 'shadow-lg shadow-indigo-950/10' : ''}`}>
      <div className="flex justify-between items-start mb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest truncate max-w-[120px]">{match.league.split(' (')[0]}</span>
            {prediction && <span className="text-[7px] font-black bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded animate-pulse uppercase">Live Grounding</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-white mono bg-slate-800 px-1.5 py-0.5 rounded">{match.time}</span>
            <span className="text-[8px] font-bold text-slate-500 uppercase">{displayDate}</span>
          </div>
        </div>
        {prediction && (
          <div className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <span className="text-[10px] font-black text-indigo-400 mono">{prediction.confidence}% <span className="text-[7px] text-slate-600">CONF</span></span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
          <div className="w-12 h-12 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-xl font-black text-white shrink-0 group-hover:border-indigo-500/30 transition-colors">{match.homeTeam.charAt(0)}</div>
          <h3 className="text-[10px] font-black text-slate-200 uppercase truncate w-full text-center">{match.homeTeam}</h3>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[8px] font-black text-slate-700 italic">VS</span>
          <div className="w-0.5 h-4 bg-slate-800" />
        </div>
        <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
          <div className="w-12 h-12 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-xl font-black text-white shrink-0 group-hover:border-indigo-500/30 transition-colors">{match.awayTeam.charAt(0)}</div>
          <h3 className="text-[10px] font-black text-slate-200 uppercase truncate w-full text-center">{match.awayTeam}</h3>
        </div>
      </div>

      {!prediction && !loading && (
        <button onClick={() => onAnalyze(match)} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/20 active:scale-95">Sincronizar Jarvs</button>
      )}

      {loading && (
        <div className="space-y-4 py-2">
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 w-1/3 animate-loading" /></div>
          <p className="text-[8px] text-center text-slate-500 font-black uppercase tracking-widest animate-pulse">Cruzando dados de satélite...</p>
        </div>
      )}

      {prediction && !loading && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 mb-4">
            <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-slate-900 mb-2">
              <div style={{ width: `${prediction.homeWinProb}%` }} className={getBarColor(prediction.homeWinProb)} />
              <div style={{ width: `${prediction.drawProb}%` }} className="bg-slate-700" />
              <div style={{ width: `${prediction.awayWinProb}%` }} className={getBarColor(prediction.awayWinProb)} />
            </div>
            <div className="flex justify-between text-[9px] font-black mono">
              <span className={getProbColor(prediction.homeWinProb)}>{prediction.homeWinProb}%</span>
              <span className="text-slate-600">DRAW</span>
              <span className={getProbColor(prediction.awayWinProb)}>{prediction.awayWinProb}%</span>
            </div>
          </div>

          <div onClick={() => setIsExpanded(!isExpanded)} className="bg-indigo-500/5 p-3 rounded-xl border-l-2 border-indigo-500/40 cursor-pointer hover:bg-indigo-500/10 transition-colors">
            <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5">Pick Recomendada</span>
            <p className="text-[10px] font-bold text-white uppercase truncate">{prediction.recommendedBet}</p>
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-slate-800/40 space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/30">
                <span className="text-[7px] font-black text-indigo-500 uppercase block mb-2">Resumo de Inteligência</span>
                <p className="text-[9px] text-slate-300 leading-relaxed italic">"{prediction.reasoning}"</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
                  <span className="text-[7px] font-black text-slate-600 uppercase">xG Projetado</span>
                  <div className="text-[10px] font-bold text-slate-300 mono">{prediction.stats.expectedGoals.home} - {prediction.stats.expectedGoals.away}</div>
                </div>
                <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
                  <span className="text-[7px] font-black text-slate-600 uppercase">Volatilidade</span>
                  <div className="text-[10px] font-bold text-slate-300 mono">{prediction.volatility}%</div>
                </div>
                <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
                  <span className="text-[7px] font-black text-slate-600 uppercase">Posse (H/A)</span>
                  <div className="text-[10px] font-bold text-slate-300 mono">{prediction.stats.recentPossession.home}% / {prediction.stats.recentPossession.away}%</div>
                </div>
                <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
                  <span className="text-[7px] font-black text-slate-600 uppercase">Defesa (H/A)</span>
                  <div className="text-[10px] font-bold text-slate-300 mono">{prediction.stats.defenseStrength.home} / {prediction.stats.defenseStrength.away}</div>
                </div>
              </div>

              {prediction.sources && prediction.sources.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.2em] block">Fontes Consultadas</span>
                  <div className="flex flex-wrap gap-2">
                    {prediction.sources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[7px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 hover:bg-indigo-500/20 transition-all truncate max-w-[120px]"
                      >
                        {source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <button onClick={() => setIsExpanded(!isExpanded)} className="w-full mt-3 py-1 flex justify-center text-slate-700 hover:text-indigo-500 transition-colors">
            <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth={3} /></svg>
          </button>
        </div>
      )}
    </div>
  );
});

export default MatchCard;
