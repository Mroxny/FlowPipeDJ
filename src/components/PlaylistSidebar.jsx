import React, { useState, useRef } from 'react';
import { ListMusic, Volume2, Play, ChevronRight, GripVertical, Shuffle } from 'lucide-react';

const PlaylistSidebar = ({ 
  playlist, 
  currentIndex, 
  onTrackSelect, 
  onAddTrack, 
  onClose,
  isOpen,
  onReorder,
  onShuffle,
  isShuffled 
}) => {
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
      onAddTrack(e.target.value.trim());
      e.target.value = '';
    }
  };

  // --- DRAG & DROP ---
  const handleDragStart = (e, index) => {
    setDraggedItemIndex(index);
    // Ghost effect
    e.dataTransfer.effectAllowed = "move";
    // Firefox hack
    e.dataTransfer.setData("text/html", e.target.parentNode); 
    e.dataTransfer.setDragImage(e.target.parentNode, 20, 20);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    // Opcjonalnie: Tutaj można dodać wizualny wskaźnik gdzie upuścimy
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;

    const newPlaylist = [...playlist];
    const draggedItem = newPlaylist[draggedItemIndex];
    
    newPlaylist.splice(draggedItemIndex, 1);
    newPlaylist.splice(dropIndex, 0, draggedItem);

    setDraggedItemIndex(null);
    onReorder(newPlaylist);
  };

  return (
    <div className={`
      fixed inset-y-0 right-0 z-40 w-full md:w-[400px] bg-[#030303] border-l border-white/5 shadow-2xl 
      transform transition-transform duration-300 ease-in-out flex flex-col
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    `}>
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#030303]/95 backdrop-blur z-10">
        <div className="flex gap-4 text-sm font-medium text-gray-400 items-center">
          <button onClick={onClose} className="md:hidden mr-2">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
          <span className="text-white border-b-2 border-green-500 pb-1 cursor-default">KOLEJKA</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Shuffle button */}
          <button 
            onClick={onShuffle}
            className={`p-2 rounded-full transition-all ${isShuffled ? 'text-green-500 bg-green-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            title="Pomieszaj utwory"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <div className="px-3 py-1 bg-white/10 text-xs font-bold rounded text-gray-300 flex items-center gap-2">
            <ListMusic className="w-3 h-3" />
            {playlist.length}
          </div>
          
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-white/10 rounded-full transition-colors hidden md:block"
            title="Schowaj panel"
          >
            <ChevronRight className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <div className="space-y-1">
          {playlist.map((track, index) => {
            const isCurrent = index === currentIndex;
            const isNext = index === (currentIndex + 1) % playlist.length;
            const isDragged = index === draggedItemIndex;
            
            return (
              <div 
                key={`${track.id}-${index}`}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`
                  group flex items-center gap-3 p-2 rounded-lg transition-all duration-200 border border-transparent
                  ${isCurrent ? 'bg-[#1a1a1a] border-white/5' : 'hover:bg-white/5'}
                  ${isDragged ? 'opacity-50 border-dashed border-gray-500' : ''}
                `}
              >
                {/* Handle for movement */}
                <div 
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-300 p-1"
                >
                  <GripVertical className="w-4 h-4" />
                </div>

                <div 
                  className="flex flex-1 items-center gap-3 cursor-pointer overflow-hidden"
                  onClick={() => onTrackSelect(index)}
                >
                  {/* Image */}
                  <div className="relative w-10 h-10 rounded bg-gray-800 flex-shrink-0 overflow-hidden">
                    <img 
                      src={`https://img.youtube.com/vi/${track.id}/default.jpg`} 
                      alt="cover" 
                      className={`w-full h-full object-cover transition-opacity ${isCurrent ? 'opacity-40' : 'opacity-80'}`}
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Volume2 className="w-4 h-4 text-green-500 animate-pulse" />
                      </div>
                    )}
                    {!isCurrent && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-3 h-3 text-white fill-white" />
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium truncate ${isCurrent ? 'text-green-500' : 'text-gray-300 group-hover:text-white'}`}>
                      {track.title}
                    </h4>
                    <p className="text-xs text-gray-500 truncate group-hover:text-gray-400 flex items-center gap-2">
                      {track.artist}
                      {isNext && <span className="px-1.5 py-0.5 bg-white/10 rounded-[2px] text-[10px] text-gray-300">NEXT</span>}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 mx-4 mb-8 p-6 border border-dashed border-white/10 rounded-xl text-center hover:border-white/20 transition-colors bg-white/[0.02]">
          <p className="text-xs text-gray-400 mb-3 font-medium">DODAJ UTWÓR DO KOLEJKI</p>
          <input 
            type="text" 
            placeholder="Wklej ID (np. dQw4w9WgXcQ)" 
            className="w-full bg-[#111] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 transition-colors text-center font-mono"
            onKeyDown={handleInputKeyDown}
          />
        </div>
      </div>
    </div>
  );
};

export default PlaylistSidebar;