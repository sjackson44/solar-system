import React from 'react';
import { Globe, Atom } from 'lucide-react';
import { ViewMode } from '../config/scales';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ 
  viewMode, 
  onViewModeChange
}) => {
  const handleToggle = () => {
    const newMode: ViewMode = viewMode === 'circular' ? 'scientific' : 'circular';
    onViewModeChange(newMode);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">View Mode:</span>
      <button
        onClick={handleToggle}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 
          ${viewMode === 'circular' 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-green-600 hover:bg-green-700 text-white'
          }
        `}
        title={`Switch to ${viewMode === 'circular' ? 'Scientific' : 'Circular'} mode`}
      >
        {viewMode === 'circular' ? (
          <>
            <Globe size={16} />
            <span className="text-sm">Circular</span>
          </>
        ) : (
          <>
            <Atom size={16} />
            <span className="text-sm">Scientific</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ViewModeToggle; 