import React from 'react';
import { Rocket, Plane } from 'lucide-react';

interface CruiseToggleProps {
  cruiseMode: boolean;
  onToggle: () => void;
  autoCruise?: boolean;
  onAutoCruiseToggle?: () => void;
}

const CruiseToggle: React.FC<CruiseToggleProps> = ({ cruiseMode, onToggle, autoCruise, onAutoCruiseToggle }) => (
  <div className="flex items-center gap-4">
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 shadow-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${cruiseMode ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-200 hover:bg-blue-600'}`}
      title="Toggle Cruise Mode"
    >
      <Rocket size={20} className={cruiseMode ? 'text-yellow-300' : 'text-gray-400'} />
      Cruise Mode: <span className="ml-1 font-mono">{cruiseMode ? 'On' : 'Off'}</span>
    </button>
    {cruiseMode && onAutoCruiseToggle && (
      <button
        onClick={onAutoCruiseToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 shadow-md border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 ${autoCruise ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-200 hover:bg-green-600'}`}
        title="Toggle Auto-Cruise"
      >
        <Plane size={20} className={autoCruise ? 'text-yellow-300' : 'text-gray-400'} />
        Auto-Cruise: <span className="ml-1 font-mono">{autoCruise ? 'On' : 'Off'}</span>
      </button>
    )}
  </div>
);

export default CruiseToggle; 