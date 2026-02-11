import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Info, PanelRightOpen } from 'lucide-react';
import PlayerDeck from './components/PlayerDeck';
import ControlBar from './components/ControlBar';
import PlaylistSidebar from './components/PlaylistSidebar';
import { DEMO_PLAYLIST_IDS } from './data/mockPlaylist';

const CF_DURATION = 8000;
const CF_TRIGGER_SEC = 10;
const PLAY_PAUSE_FADE_MS = 800;

const App = () => {
  const [playlist, setPlaylist] = useState(() => 
    DEMO_PLAYLIST_IDS.map(id => ({
      id,
      title: `YT ID: ${id}`,
      artist: 'Ładowanie danych...',
      duration: '--:--'
    }))
  );
  
  const [originalPlaylist, setOriginalPlaylist] = useState(playlist);
  
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeDeck, setActiveDeck] = useState('A');
  const [isCrossfading, setIsCrossfading] = useState(false);
  const [isPlayPauseFading, setIsPlayPauseFading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [startScreen, setStartScreen] = useState(true);
  
  const [isAddingTrack, setIsAddingTrack] = useState(false);
  
  const [progressA, setProgressA] = useState({ current: 0, duration: 0 });
  const [progressB, setProgressB] = useState({ current: 0, duration: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isShuffled, setIsShuffled] = useState(false);

  const playerA = useRef(null);
  const playerB = useRef(null);
  const fadeInterval = useRef(null);
  const playPauseInterval = useRef(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      const updatedTracks = await Promise.all(playlist.map(async (track) => {
        try {
           const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${track.id}`);
           const data = await response.json();
           
           if (data.title) {
             return { ...track, title: data.title, artist: data.author_name };
           }
        } catch (e) {
           console.error(`Błąd pobierania danych dla ID ${track.id}:`, e);
        }
        return track;
      }));

      setPlaylist(updatedTracks);
      setOriginalPlaylist(updatedTracks);
    };

    fetchMetadata();
  }, []); 


  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
    window.onYouTubeIframeAPIReady = initPlayers;

    return () => {
      if (fadeInterval.current) clearInterval(fadeInterval.current);
      if (playPauseInterval.current) clearInterval(playPauseInterval.current);
    };
  }, []);

  const initPlayers = () => {
    const createPlayer = (id, deck) => new window.YT.Player(id, {
      height: '100%',
      width: '100%',
      playerVars: { controls: 0, showinfo: 0, rel: 0, modestbranding: 1, iv_load_policy: 3, fs: 0, disablekb: 1 },
      events: {
        'onReady': (e) => {
          if(deck === 'B') e.target.setVolume(0);
          if(deck === 'A') e.target.setVolume(100);
        }
      }
    });

    playerA.current = createPlayer('player-a', 'A');
    playerB.current = createPlayer('player-b', 'B');
  };

  const startPlayback = () => {
    setStartScreen(false);
    setIsPlaying(true);
    
    if (playerA.current && playerA.current.loadVideoById) {
      const firstTrack = playlist[0];
      const secondTrack = playlist[1] || playlist[0];

      playerA.current.loadVideoById(firstTrack.id);
      playerA.current.setVolume(100);
      
      playerB.current.cueVideoById(secondTrack.id);
      playerB.current.setVolume(0);

      setActiveDeck('A');
    }
  };

  const updateNextTrackCue = (newPlaylist, newCurrentIndex) => {
    const nextIndex = (newCurrentIndex + 1) % newPlaylist.length;
    const nextTrack = newPlaylist[nextIndex];
    
    const inactivePlayer = activeDeck === 'A' ? playerB.current : playerA.current;

    if (!isCrossfading && inactivePlayer && inactivePlayer.cueVideoById) {
      inactivePlayer.cueVideoById(nextTrack.id);
      inactivePlayer.setVolume(0);
    }
  };

  const handleShuffle = () => {
    if (isShuffled) {
      const currentTrack = playlist[currentTrackIndex];
      const originalIndex = originalPlaylist.findIndex(t => t.id === currentTrack.id);
      
      setPlaylist(originalPlaylist);
      setCurrentTrackIndex(originalIndex !== -1 ? originalIndex : 0);
      setIsShuffled(false);
      
      updateNextTrackCue(originalPlaylist, originalIndex !== -1 ? originalIndex : 0);

    } else {
      const currentTrack = playlist[currentTrackIndex];
      
      let shuffled = [...playlist];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const newIndex = shuffled.findIndex(t => t.id === currentTrack.id);
      
      setPlaylist(shuffled);
      setCurrentTrackIndex(newIndex);
      setIsShuffled(true);

      updateNextTrackCue(shuffled, newIndex);
    };
  };

  const handleReorder = (newPlaylist) => {
    const currentTrack = playlist[currentTrackIndex];
    const newCurrentIndex = newPlaylist.findIndex(t => t.id === currentTrack.id);

    setPlaylist(newPlaylist);
    setCurrentTrackIndex(newCurrentIndex);
    
    if (!isShuffled) {
      setOriginalPlaylist(newPlaylist);
    }

    updateNextTrackCue(newPlaylist, newCurrentIndex);
  };

  const finalizeTransition = useCallback((newDeck, newIndex, nextCueIndex) => {
    setIsCrossfading(false);
    setActiveDeck(newDeck);
    setCurrentTrackIndex(newIndex);
    setIsPlaying(true); 

    const oldPlayer = newDeck === 'A' ? playerB.current : playerA.current;
    const nextTrackToCue = playlist[nextCueIndex] || playlist[0];

    if (oldPlayer && oldPlayer.stopVideo) {
      oldPlayer.stopVideo();
      oldPlayer.cueVideoById(nextTrackToCue.id);
      oldPlayer.setVolume(0);
      
      if (newDeck === 'A') setProgressB({ current: 0, duration: 0 });
      else setProgressA({ current: 0, duration: 0 });
    }
  }, [playlist]);

  const triggerCrossfade = useCallback(() => {
    if (isCrossfading || isPlayPauseFading) return;
    setIsCrossfading(true);

    const fadeOut = activeDeck === 'A' ? playerA.current : playerB.current;
    const fadeIn = activeDeck === 'A' ? playerB.current : playerA.current;
    const nextDeckState = activeDeck === 'A' ? 'B' : 'A';
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    const trackAfterNextIndex = (nextIndex + 1) % playlist.length;

    if (fadeIn && fadeIn.playVideo) fadeIn.playVideo(); 

    let step = 0;
    const steps = 40;
    const stepTime = CF_DURATION / steps;

    if (fadeInterval.current) clearInterval(fadeInterval.current);

    fadeInterval.current = setInterval(() => {
      step++;
      const volumeIn = Math.floor((step / steps) * 100);
      const volumeOut = 100 - volumeIn;
      
      if (fadeOut && fadeOut.setVolume) fadeOut.setVolume(volumeOut);
      if (fadeIn && fadeIn.setVolume) fadeIn.setVolume(volumeIn);

      if (step >= steps) {
        clearInterval(fadeInterval.current);
        finalizeTransition(nextDeckState, nextIndex, trackAfterNextIndex);
      }
    }, stepTime);
  }, [activeDeck, currentTrackIndex, playlist, isCrossfading, isPlayPauseFading, finalizeTransition]);

  const checkProgress = useCallback(() => {
    if (isPlayPauseFading) return;

    if (playerA.current && playerA.current.getCurrentTime && playerA.current.getDuration) {
        try {
            const timeA = playerA.current.getCurrentTime();
            const durA = playerA.current.getDuration();
            setProgressA({ current: timeA, duration: durA });
        } catch(e) {}
    }

    if (playerB.current && playerB.current.getCurrentTime && playerB.current.getDuration) {
        try {
            const timeB = playerB.current.getCurrentTime();
            const durB = playerB.current.getDuration();
            setProgressB({ current: timeB, duration: durB });
        } catch(e) {}
    }

    const activePlayer = activeDeck === 'A' ? playerA.current : playerB.current;
    if (activePlayer && activePlayer.getCurrentTime) {
        try {
            const curr = activePlayer.getCurrentTime();
            const dur = activePlayer.getDuration();
            if (!isCrossfading && isPlaying && dur > 0 && (dur - curr) < CF_TRIGGER_SEC) {
                triggerCrossfade();
            }
        } catch(e) {}
    }

  }, [activeDeck, isCrossfading, isPlaying, isPlayPauseFading, triggerCrossfade]);

  useEffect(() => {
    if (!isPlaying && !isPlayPauseFading) return;
    const loopId = setInterval(checkProgress, 500);
    return () => clearInterval(loopId);
  }, [isPlaying, isPlayPauseFading, checkProgress]);

  const togglePlay = () => {
    if (isCrossfading || isPlayPauseFading) return;

    const currentPlayer = activeDeck === 'A' ? playerA.current : playerB.current;
    if (!currentPlayer || !currentPlayer.getPlayerState) return;

    setIsPlayPauseFading(true);

    const steps = 20;
    const stepTime = PLAY_PAUSE_FADE_MS / steps;

    if (playPauseInterval.current) clearInterval(playPauseInterval.current);

    if (isPlaying) {
      let vol = 100;
      playPauseInterval.current = setInterval(() => {
        vol -= (100 / steps);
        if (vol <= 0) {
          vol = 0;
          currentPlayer.setVolume(0);
          currentPlayer.pauseVideo();
          clearInterval(playPauseInterval.current);
          setIsPlaying(false);
          setIsPlayPauseFading(false);
        } else {
          currentPlayer.setVolume(vol);
        }
      }, stepTime);
    } else {
      currentPlayer.setVolume(0);
      currentPlayer.playVideo();
      setIsPlaying(true);
      let vol = 0;
      playPauseInterval.current = setInterval(() => {
        vol += (100 / steps);
        if (vol >= 100) {
          vol = 100;
          currentPlayer.setVolume(100);
          clearInterval(playPauseInterval.current);
          setIsPlayPauseFading(false);
        } else {
          currentPlayer.setVolume(vol);
        }
      }, stepTime);
    }
  };

  const handleSeek = (newTime, deck) => {
    const targetPlayer = deck === 'A' ? playerA.current : playerB.current;
    if (targetPlayer && targetPlayer.seekTo) {
      targetPlayer.seekTo(newTime, true);
      if (deck === 'A') setProgressA(prev => ({ ...prev, current: newTime }));
      else setProgressB(prev => ({ ...prev, current: newTime }));
    }
  };

  const handleManualTransition = () => {
    if (!isPlaying) setIsPlaying(true);
    triggerCrossfade();
  };

  const handleTrackSelect = (index) => {
    setCurrentTrackIndex(index);
    const track = playlist[index];
    const nextIdx = (index + 1) % playlist.length;
    const nextTrack = playlist[nextIdx] || playlist[0];

    setActiveDeck('A');
    setIsCrossfading(false);
    setIsPlaying(true);
    setIsPlayPauseFading(false);
    
    if (fadeInterval.current) clearInterval(fadeInterval.current);
    if (playPauseInterval.current) clearInterval(playPauseInterval.current);

    if (playerA.current) {
        playerA.current.loadVideoById(track.id);
        playerA.current.setVolume(100);
    }
    if (playerB.current) {
        playerB.current.cueVideoById(nextTrack.id);
        playerB.current.setVolume(0);
        playerB.current.stopVideo();
    }
    setProgressA({ current: 0, duration: 0 });
    setProgressB({ current: 0, duration: 0 });
  };

  const handleAddTrack = async (input) => {
    setIsAddingTrack(true);
    let id = input;
    const urlRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = input.match(urlRegex);
    
    if (match && match[1]) {
      id = match[1];
    } else if (!/^[a-zA-Z0-9_-]{11}$/.test(input)) {
        setIsAddingTrack(false);
        return; 
    }

    let title = `YT ID: ${id}`;
    let artist = 'Dodany Utwór';

    try {
        const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
        const data = await response.json();
        
        if (data.title) {
            title = data.title;
            artist = data.author_name;
        }
    } catch (e) {
        console.error("Nie udało się pobrać tytułu:", e);
    }

    const newTrack = { id: id, title: title, artist: artist, duration: '--:--' };
    const newList = [...playlist, newTrack];
    setPlaylist(newList);
    if (!isShuffled) setOriginalPlaylist(newList);
    setIsAddingTrack(false);
  };

   return (
    <div className="flex h-screen w-full bg-[#030303] text-white font-sans overflow-hidden relative">
      {startScreen && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95">
          <div className="text-center px-6 animate-fade-in">
            <h1 className="text-7xl font-bold mb-6 tracking-tighter bg-gradient-to-r from-green-400 to-emerald-700 bg-clip-text text-transparent">FlowPipeDJ</h1>
            <button onClick={startPlayback} className="px-10 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-all shadow-lg flex items-center gap-3 mx-auto">
              <Play className="w-5 h-5 fill-black" />
              ROZPOCZNIJ SESJĘ
            </button>
            <div className="mt-8 flex gap-2 justify-center text-sm text-gray-500">
               <Info className="w-4 h-4 mt-0.5" />
               <span>Wymagana interakcja, aby odblokować AudioContext.</span>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className={`flex-1 relative flex flex-col h-full transition-all duration-500 ease-in-out ${isSidebarOpen ? 'mr-0 md:mr-[400px]' : 'mr-0'}`}>
        {!isSidebarOpen && !startScreen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-6 right-6 z-40 p-2 bg-black/50 hover:bg-black/80 rounded-full border border-white/10 transition-all text-gray-300 hover:text-white"
          >
            <PanelRightOpen className="w-6 h-6" />
          </button>
        )}

        {/* DECK A */}
        <div className={`
          relative w-full overflow-hidden transition-all duration-500 ease-in-out
          ${isMaximized && activeDeck === 'B' ? 'flex-[0_0_0px]' : 'flex-1'}
        `}>
          <PlayerDeck deckId="player-a" isActive={activeDeck === 'A'} trackInfo={activeDeck === 'A' ? playlist[currentTrackIndex] : null} />
        </div>
        
        {/* CONTROL BAR */}
        <ControlBar 
          activeDeck={activeDeck} 
          isCrossfading={isCrossfading}
          isPlaying={isPlaying}
          isPlayPauseFading={isPlayPauseFading}
          progressA={progressA}
          progressB={progressB}
          onManualTransition={handleManualTransition}
          onTogglePlay={togglePlay}
          onSeek={handleSeek}
          isMaximized={isMaximized}
          onToggleMaximize={() => setIsMaximized(!isMaximized)}
        />

        {/* DECK B */}
        <div className={`
           relative w-full overflow-hidden transition-all duration-500 ease-in-out
           ${isMaximized && activeDeck === 'A' ? 'flex-[0_0_0px]' : 'flex-1'}
        `}>
           <PlayerDeck deckId="player-b" isActive={activeDeck === 'B'} trackInfo={activeDeck === 'B' ? playlist[currentTrackIndex] : null} />
        </div>
      </div>

      <PlaylistSidebar 
        playlist={playlist} 
        currentIndex={currentTrackIndex} 
        onTrackSelect={handleTrackSelect}
        onAddTrack={handleAddTrack}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onReorder={handleReorder}
        onShuffle={handleShuffle}
        isShuffled={isShuffled}
        isAddingTrack={isAddingTrack}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #333; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #555; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in 0.5s ease-out forwards; }
        .cursor-wait { cursor: wait; }

        /* AGRESYWNE STYLE DLA YOUTUBE IFRAME */
        /* To wymusza, by iframe zawsze zajmował pełny kontener rodzica */
        iframe {
           width: 100% !important;
           height: 100% !important;
           position: absolute;
           top: 0;
           left: 0;
           border: 0;
        }
      `}</style>
    </div>
  );
};
export default App;