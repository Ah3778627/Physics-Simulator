/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { SimulationConfig, GlobalSettings } from '../types';
import Canvas from './Canvas';
import { Info, RefreshCw } from 'lucide-react';

interface SimulationCardProps {
  config: SimulationConfig;
  globalSettings: GlobalSettings;
}

const SimulationCard: React.FC<SimulationCardProps> = ({ config, globalSettings }) => {
  const [resetKey, setResetKey] = React.useState(0);

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-800 hover:border-cyan-500/50 transition-all duration-300 flex flex-col relative group w-full max-w-xs">
      
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-start z-10 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/10">
             <h3 className="text-cyan-400 font-bold text-xs uppercase tracking-wider">{config.name}</h3>
        </div>
        <button 
            onClick={() => setResetKey(k => k + 1)}
            className="bg-black/60 backdrop-blur-sm p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-colors pointer-events-auto cursor-pointer"
            title="Restart Simulation"
        >
            <RefreshCw size={14} />
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-grow relative aspect-square bg-black">
        {/* The key prop forces full remount of Canvas on reset */}
        <Canvas key={resetKey} config={config} globalSettings={globalSettings} />
      </div>

      {/* Footer Info */}
      <div className="bg-gray-950 p-3 border-t border-gray-800">
        <div className="flex items-start gap-2">
            <Info size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-400 leading-relaxed">
                {config.nuanceDescription}
            </p>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700">
                G: {config.gravity}x
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700">
                Balls: {config.ballCount}
            </span>
        </div>
      </div>
    </div>
  );
};

export default SimulationCard;