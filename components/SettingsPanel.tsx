
import React from 'react';
import { AppSettings } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onChange }) => {
  return (
    <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800/50 backdrop-blur-3xl space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800/50">
        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-xs font-black text-slate-300 uppercase tracking-widest">Controles Analíticos</h2>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">IA JARVS Velocidade</label>
          <div className="grid grid-cols-2 gap-2">
            {(['Normal', 'Turbo'] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => onChange({ ...settings, jarvsSpeed: speed })}
                className={`py-2 text-[8px] font-black rounded-xl border transition-all ${
                  settings.jarvsSpeed === speed 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                  : 'bg-slate-950/30 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                {speed.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Motor de Inferência</label>
          <select 
            value={settings.aiModel}
            onChange={(e) => onChange({ ...settings, aiModel: e.target.value as any })}
            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-4 py-3 text-[10px] font-bold text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
          >
            <option value="gemini-3-flash-preview">Gemini 3 Flash (Rápido)</option>
            <option value="gemini-3-pro-preview">Gemini 3 Pro (Puro)</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-950/30 rounded-2xl border border-slate-800/50">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-300 uppercase">GPU Acceleration</span>
            <span className="text-[8px] text-slate-600 font-bold uppercase mt-0.5">Hardware Rendering</span>
          </div>
          <button 
            onClick={() => onChange({ ...settings, hardwareAcceleration: !settings.hardwareAcceleration })}
            className={`w-10 h-5 rounded-full relative transition-all ${settings.hardwareAcceleration ? 'bg-indigo-600' : 'bg-slate-800'}`}
          >
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.hardwareAcceleration ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        <div>
          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">Viés Algorítmico</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Conservador', 'Equilibrado', 'Agressivo'] as const).map((level) => (
              <button
                key={level}
                onClick={() => onChange({ ...settings, riskLevel: level })}
                className={`py-2 text-[8px] font-black rounded-xl border transition-all ${
                  settings.riskLevel === level 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                  : 'bg-slate-950/30 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                {level.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-950/30 rounded-2xl border border-slate-800/50">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-300 uppercase">Filtro de Lesões</span>
            <span className="text-[8px] text-slate-600 font-bold uppercase mt-0.5">Scout Ativo</span>
          </div>
          <button 
            onClick={() => onChange({ ...settings, includeInjuries: !settings.includeInjuries })}
            className={`w-10 h-5 rounded-full relative transition-all ${settings.includeInjuries ? 'bg-indigo-600' : 'bg-slate-800'}`}
          >
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.includeInjuries ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
