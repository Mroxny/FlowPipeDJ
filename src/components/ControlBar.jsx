import React from 'react';
import { Play, Pause, ArrowDown } from 'lucide-react';
import { Maximize2, Minimize2 } from 'lucide-react';

const ControlBar = ({ 
  activeDeck, 
  isCrossfading, 
  isPlaying,
  isPlayPauseFading,
  progressA, 
  progressB, 
  onManualTransition,
  onTogglePlay,
  onSeek,
  isMaximized,
  onToggleMaximize
}) => {
  
  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const Timeline = ({ current, duration, onChange, positionClass, colorClass }) => (
    <div className={`absolute left-0 right-0 h-1.5 group cursor-pointer z-50 ${positionClass}`}>
      <div className="absolute inset-0 bg-white/10"></div>
      <div 
        className={`absolute top-0 left-0 h-full transition-all duration-200 ${colorClass}`} 
        style={{ width: `${duration > 0 ? (current / duration) * 100 : 0}%` }}
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow shadow-black transition-opacity transform scale-150"></div>
      </div>
      <input 
        type="range" 
        min="0" 
        max={duration || 100} 
        value={current || 0} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={duration === 0}
      />
    </div>
  );

  return (
    <div className={`
      h-20 md:h-28 bg-[#0a0a0a] flex flex-col justify-center relative z-30 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex-shrink-0 transition-all duration-500 ease-in-out
      ${isMaximized && activeDeck === 'B' ? 'border-b border-white/10' : ''}
      ${isMaximized && activeDeck === 'A' ? 'border-t border-white/10' : ''}
      ${!isMaximized ? 'border-y border-white/5' : ''}
    `}>
      
      {/* TIMELINE DECK A */}
      <Timeline 
        current={progressA.current} 
        duration={progressA.duration} 
        onChange={(val) => onSeek(val, 'A')}
        positionClass="top-0"
        colorClass={activeDeck === 'A' ? 'bg-green-500' : 'bg-gray-500'}
      />

      {/* TIMELINE DECK B */}
      <Timeline 
        current={progressB.current} 
        duration={progressB.duration} 
        onChange={(val) => onSeek(val, 'B')}
        positionClass="bottom-0"
        colorClass={activeDeck === 'B' ? 'bg-green-500' : 'bg-gray-500'}
      />

      <div className="flex items-center justify-center md:justify-between px-4 md:px-8 h-full">
        
        <div className="hidden md:flex flex-col text-xs font-mono text-gray-500 w-32">
          <div className={`flex justify-between ${activeDeck === 'A' ? 'text-green-500 font-bold' : ''}`}>
             <span>DECK A</span>
             <span>{formatTime(progressA.current)}</span>
          </div>
          <div className={`flex justify-between ${activeDeck === 'B' ? 'text-green-500 font-bold' : ''} opacity-50`}>
             <span>DECK B</span>
             <span>{formatTime(progressB.current)}</span>
          </div>
        </div>

        {/* Controlls */}
        <div className="flex items-center gap-5 md:gap-8">
          
          {/* Play / Pause */}
          <button 
            onClick={onTogglePlay}
            disabled={isPlayPauseFading}
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 ${isPlayPauseFading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5 fill-white" /> : <Play className="w-4 h-4 md:w-5 md:h-5 fill-white ml-0.5" />}
          </button>

          <button 
            onClick={onManualTransition}
            disabled={isCrossfading}
            className="group relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-white/10 transition-all hover:scale-110 active:scale-95 cursor-pointer outline-none"
            title="Wymuś przejście"
          >
            <div className={`absolute inset-0 rounded-full bg-green-500/20 blur-xl transition-opacity duration-500 ${isCrossfading ? 'opacity-100 animate-pulse' : 'opacity-0 group-hover:opacity-50'}`}></div>
            <div className={`transition-transform duration-700 ease-in-out ${activeDeck === 'B' ? 'rotate-180' : 'rotate-0'}`}>
              <ArrowDown className={`w-6 h-6 md:w-8 md:h-8 ${isCrossfading ? 'text-green-400' : 'text-white'}`} />
            </div>
          </button>

          {/* Maximize / Minimize */}
          <button 
            onClick={onToggleMaximize}
            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-transparent hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-105"
            title={isMaximized ? "Pokaż oba Decki" : "Tryb skupienia"}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
        </div>

        {/* Right side: Status */}
        <div className="hidden md:block w-32 text-[10px] font-mono text-gray-500 tracking-widest uppercase text-right">
          {isCrossfading ? (
            <span className="text-green-400 animate-pulse font-bold">MIKSOWANIE...</span>
          ) : isPlayPauseFading ? (
            <span className="text-yellow-400 animate-pulse font-bold">FADING...</span>
          ) : (
            <span>NASTĘPNY GOTOWY</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlBar;