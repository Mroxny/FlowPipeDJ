import React from 'react';

const PlayerDeck = ({ deckId, isActive, trackInfo }) => {
  return (
    <div className={`relative w-full h-full transition-all duration-1000 ease-in-out overflow-hidden ${isActive ? 'opacity-100' : 'opacity-40 grayscale-[60%]'}`}>
      
      {/* Kontener wideo z wymuszonymi stylami dla iframe */}
      <div className="absolute inset-0 w-full h-full bg-black overflow-hidden pointer-events-none">
        {/* Wrapper do skalowania (zoom) */}
        <div className="w-full h-full transform scale-125 origin-center">
            {/* Klasa deck-frame posłuży do celowania w iframe przez CSS */}
            <div id={deckId} className="deck-frame w-full h-full"></div>
        </div>
      </div>
      
      {/* Overlay gradientowy i tekst */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
      
      {isActive && trackInfo && (
        <div className="absolute bottom-0 left-0 right-0 p-8 z-20 animate-fade-in-up pointer-events-none">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-2 text-white drop-shadow-lg line-clamp-1">
            {trackInfo.title}
          </h2>
          <p className="text-xl text-gray-300 font-medium drop-shadow-md">
            {trackInfo.artist}
          </p>
        </div>
      )}
    </div>
  );
};

export default PlayerDeck;