import React from 'react';

const PlayerDeck = ({ deckId, isActive, trackInfo }) => {
  return (
    <div className={`relative flex-1 transition-all duration-1000 ease-in-out ${isActive ? 'opacity-100' : 'opacity-40 grayscale-[60%]'}`}>
      <div className="absolute inset-0 z-10 bg-transparent"></div>
      <div id={deckId} className="w-full h-full pointer-events-none bg-black"></div>
      {isActive && trackInfo && (
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent z-20 animate-fade-in-up">
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