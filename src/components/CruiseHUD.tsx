import React from 'react';
import { Pause, Play, FastForward, Plane, GaugeCircle, Navigation, Zap, AlertTriangle, Target, Satellite } from 'lucide-react';

interface CruiseHUDProps {
  speed: number;
  distanceToNearest: number;
  viewMode: string;
  warpSpeed: number;
  onWarpChange: (value: number) => void;
  onExit: () => void;
  autoCruise: boolean;
  onAutoCruiseToggle: () => void;
  currentPOI: { name: string; type: string } | null;
  eta?: number; // seconds to next POI
  scale?: string; // e.g. "Spaceship View: Zoomed In"
  paused?: boolean;
  onPauseToggle?: () => void;
  onNextPOI?: () => void;
  showCockpit?: boolean;
}

const CruiseHUD: React.FC<CruiseHUDProps> = ({
  speed,
  distanceToNearest,
  viewMode,
  warpSpeed,
  onWarpChange,
  onExit,
  autoCruise,
  onAutoCruiseToggle,
  currentPOI,
  eta,
  scale,
  paused,
  onPauseToggle,
  onNextPOI,
  showCockpit,
}) => (
  <>
    {/* Immersive Cockpit Overlay */}
    {autoCruise && showCockpit && (
      <div className="fixed inset-0 pointer-events-none z-40">
        {/* Main Cockpit Frame */}
        <div className="absolute inset-0 border-8 border-blue-400 rounded-none bg-black bg-opacity-20">
          {/* Top Control Panel */}
          <div className="absolute top-4 left-4 right-4 h-16 bg-black bg-opacity-80 border-2 border-blue-400 rounded-lg flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Zap size={24} className="text-yellow-400 animate-pulse" />
                <span className="text-yellow-400 font-mono text-sm">ENGINE STATUS: ONLINE</span>
              </div>
              <div className="flex items-center gap-2">
                <Satellite size={20} className="text-green-400" />
                <span className="text-green-400 font-mono text-sm">NAV COMP: ACTIVE</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-red-400 font-mono text-sm">WARP: {warpSpeed}x</div>
              <div className="text-blue-400 font-mono text-sm">SPEED: {speed.toFixed(1)} u/s</div>
            </div>
          </div>

          {/* Left Control Panel */}
          <div className="absolute left-4 top-24 bottom-24 w-64 bg-black bg-opacity-80 border-2 border-blue-400 rounded-lg p-4">
            <div className="text-center mb-4">
              <h3 className="text-blue-400 font-bold text-lg mb-2">NAVIGATION COMPUTER</h3>
              <div className="bg-gray-900 rounded-lg p-3 mb-3">
                <div className="text-green-400 font-mono text-sm mb-1">CURRENT TARGET</div>
                <div className="text-yellow-300 font-bold text-lg">{currentPOI?.name || 'NONE'}</div>
                <div className="text-blue-400 text-xs">{currentPOI?.type?.toUpperCase() || 'UNKNOWN'}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 mb-3">
                <div className="text-green-400 font-mono text-sm mb-1">ETA</div>
                <div className="text-yellow-300 font-bold text-lg">{eta ? `${Math.ceil(eta)}s` : '--'}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="text-green-400 font-mono text-sm mb-1">DISTANCE</div>
                <div className="text-yellow-300 font-bold text-lg">{distanceToNearest.toFixed(1)}u</div>
              </div>
            </div>
          </div>

          {/* Right Control Panel */}
          <div className="absolute right-4 top-24 bottom-24 w-64 bg-black bg-opacity-80 border-2 border-blue-400 rounded-lg p-4">
            <div className="text-center mb-4">
              <h3 className="text-blue-400 font-bold text-lg mb-2">SYSTEM STATUS</h3>
              <div className="space-y-3">
                <div className="bg-gray-900 rounded-lg p-3">
                  <div className="text-green-400 font-mono text-sm mb-1">AUTO-CRUISE</div>
                  <div className={`font-bold text-lg ${autoCruise ? 'text-green-400' : 'text-red-400'}`}>
                    {autoCruise ? 'ACTIVE' : 'STANDBY'}
                  </div>
                </div>
                <div className="bg-gray-900 rounded-lg p-3">
                  <div className="text-green-400 font-mono text-sm mb-1">ENGINE MODE</div>
                  <div className="text-yellow-300 font-bold text-lg">{paused ? 'PAUSED' : 'RUNNING'}</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-3">
                  <div className="text-green-400 font-mono text-sm mb-1">VIEW MODE</div>
                  <div className="text-yellow-300 font-bold text-lg">{scale || 'STANDARD'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Control Panel */}
          <div className="absolute bottom-4 left-4 right-4 h-20 bg-black bg-opacity-80 border-2 border-blue-400 rounded-lg flex items-center justify-between px-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Target size={20} className="text-blue-400" />
                <span className="text-blue-400 font-mono text-sm">TARGET LOCKED</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-yellow-400 animate-pulse" />
                <span className="text-yellow-400 font-mono text-sm">COLLISION AVOIDANCE: ACTIVE</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-green-400 font-mono text-sm">PRESS SPACE TO PAUSE</div>
              <div className="text-green-400 font-mono text-sm">PRESS N FOR NEXT</div>
              <div className="text-red-400 font-mono text-sm">PRESS ESC TO EXIT</div>
            </div>
          </div>

          {/* Radar Display (Top Right) */}
          <div className="absolute top-24 right-80 w-48 h-48 bg-black bg-opacity-80 border-2 border-green-400 rounded-full flex items-center justify-center">
            <div className="relative w-40 h-40">
              {/* Radar Sweep */}
              <div className="absolute inset-0 border border-green-400 rounded-full"></div>
              <div className="absolute inset-2 border border-green-400 rounded-full opacity-50"></div>
              <div className="absolute inset-4 border border-green-400 rounded-full opacity-25"></div>
              {/* Sweeping Line */}
              <div 
                className="absolute top-1/2 left-1/2 w-1 h-20 bg-green-400 origin-bottom transform -translate-x-1/2 -translate-y-full animate-spin"
                style={{ animationDuration: '2s' }}
              ></div>
              {/* Center Dot */}
              <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              {/* Target Blip */}
              {currentPOI && (
                <div 
                  className="absolute w-3 h-3 bg-yellow-400 rounded-full animate-pulse"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    marginTop: '-20px',
                    marginLeft: '10px'
                  }}
                ></div>
              )}
            </div>
          </div>

          {/* Warning Lights */}
          <div className="absolute top-32 left-80 flex gap-2">
            <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          {/* Engine Status Bars */}
          <div className="absolute bottom-32 left-80 right-80 h-8 bg-black bg-opacity-80 border-2 border-blue-400 rounded-lg p-2">
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-mono text-xs">ENGINE</span>
                <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-mono text-xs">SHIELDS</span>
                <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-mono text-xs">LIFE SUPPORT</span>
                <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Main HUD (Bottom) */}
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 rounded-xl px-8 py-4 flex gap-8 items-center shadow-2xl border border-blue-500 font-mono text-blue-200 text-lg z-50" style={{ fontFamily: 'Orbitron, monospace' }}>
      <div>
        <span className="text-blue-400">Speed:</span> {speed.toFixed(1)} u/s
      </div>
      <div>
        <span className="text-blue-400">Nearest Body:</span> {distanceToNearest.toFixed(1)} u
      </div>
      <div>
        <span className="text-blue-400">View:</span> {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
      </div>
      {viewMode === 'scientific' && (
        <div className="flex items-center gap-2">
          <span className="text-blue-400">Warp:</span>
          <input
            type="range"
            min={1}
            max={100}
            value={warpSpeed}
            onChange={e => onWarpChange(Number(e.target.value))}
            className="w-32 accent-blue-400"
          />
          <span className="ml-2 font-bold text-yellow-300">x{warpSpeed}</span>
        </div>
      )}
      <button
        onClick={onExit}
        className="ml-8 px-4 py-2 rounded bg-red-700 hover:bg-red-800 text-white font-bold shadow border border-red-400 transition"
        title="Exit Cruise Mode (ESC)"
      >
        Exit (ESC)
      </button>
      <button
        onClick={onAutoCruiseToggle}
        className={`ml-8 px-4 py-2 rounded flex items-center gap-2 ${autoCruise ? 'bg-green-700 hover:bg-green-800' : 'bg-gray-700 hover:bg-gray-800'} text-white font-bold shadow border border-green-400 transition`}
        title="Toggle Auto-Cruise"
      >
        <Plane size={20} className={autoCruise ? 'text-yellow-300' : 'text-gray-400'} />
        Auto-Cruise: <span className="ml-1 font-mono">{autoCruise ? 'On' : 'Off'}</span>
      </button>
      {autoCruise && (
        <>
          <button
            onClick={onPauseToggle}
            className={`ml-4 px-4 py-2 rounded flex items-center gap-2 ${paused ? 'bg-yellow-700 hover:bg-yellow-800' : 'bg-blue-700 hover:bg-blue-800'} text-white font-bold shadow border border-yellow-400 transition`}
            title={paused ? 'Resume Auto-Cruise (Spacebar)' : 'Pause Auto-Cruise (Spacebar)'}
          >
            {paused ? <Play size={18} /> : <Pause size={18} />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={onNextPOI}
            className="ml-2 px-4 py-2 rounded flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white font-bold shadow border border-blue-400 transition"
            title="Next POI (N)"
          >
            <FastForward size={18} />
            Next
          </button>
        </>
      )}
      {autoCruise && currentPOI && (
        <div className="ml-8 px-4 py-2 rounded bg-blue-900 bg-opacity-60 text-blue-200 font-bold border border-blue-400 flex flex-col items-start">
          <div>
            Touring: <span className="text-yellow-300">{currentPOI.name}</span> <span className="text-blue-400">({currentPOI.type})</span>
          </div>
          {eta !== undefined && (
            <div className="text-blue-300 text-xs mt-1">ETA: {Math.ceil(eta)}s</div>
          )}
          {scale && (
            <div className="text-yellow-200 text-xs mt-1">{scale}</div>
          )}
        </div>
      )}
    </div>
  </>
);

export default CruiseHUD; 