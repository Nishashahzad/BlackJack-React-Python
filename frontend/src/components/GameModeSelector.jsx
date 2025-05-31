import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GameModeSelector.css';
import GameHistory from './GameHistory';
import GlobalHeader from './GlobalHeader'; 

import SpectatorModeEntry from './SpectatorModeEntry';
const GameModeSelector = () => {
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);

  const playClickSound = () => {
    const audio = new Audio('/sounds/clickbtnsound.mp3');
    audio.play();
  };

  return (
    <div className="mode-selector">
  
      <GlobalHeader />

      <video autoPlay loop muted className="video-bg">
        <source src="/videos/neonbluebg.webm" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div
        onClick={() => {
          playClickSound();
          setShowHistory(true);
        }}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          fontSize: '2rem',
          cursor: 'pointer',
          color: '#00ffff',
          zIndex: 5,
        }}
      >
        📜
      </div>

      <GameHistory visible={showHistory} onClose={() => setShowHistory(false)} />

      <div className="content">
        <h1>Select Game Mode</h1>
        <div className="buttons">
          <button
            onClick={() => {
              playClickSound();
              navigate('/single');
            }}
          >
            🎲 Single Player
          </button>
          <button
            onClick={() => {
              playClickSound();
              navigate('/multi/entry');
            }}
          >
            👥 Multiplayer
          </button>
          <button
            onClick={() => {
              playClickSound();
              navigate('/spectator-entry');  
            }}
          >
            👁️ Spectator
          </button>

        </div>
      </div>
    </div>
  );
};

export default GameModeSelector;
