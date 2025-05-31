import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameHistory from './GameHistory';

const WelcomePage = () => {
  const [playerName, setPlayerName] = useState('');
  const [anonUserId, setAnonUserId] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    
    const storedUserId = localStorage.getItem('anonUserId');
    if (!storedUserId) {
      const newUserId = generateUUID();
      localStorage.setItem('anonUserId', newUserId);
      localStorage.setItem('ryoWalletAddress', 'RyoYourWalletAddressHere');

      setAnonUserId(newUserId);
      console.log('Anonymous User ID:', newUserId);
    } else {
      setAnonUserId(storedUserId);
    }

    
    const storedName = localStorage.getItem('playerName');
    if (storedName) {
      setPlayerName(storedName);
    }
  }, []);

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleContinue = () => {
     const audio = new Audio('./sounds/clickbtnsound.mp3');
     audio.play();

    if (playerName.trim()) {
      const trimmedName = playerName.trim();

      
      localStorage.setItem('playerName', trimmedName);

      const playerData = {
        anonUserId: anonUserId,
        name: trimmedName,
        progress: { level: 1, score: 0 },
      };

      fetch('http://localhost:5002/save-player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playerData),
      })
        .then(response => response.json())
        .then(data => {
          console.log('Player data saved successfully:', data);

          if (data.username) {
            localStorage.setItem('username', data.username);
          }

          navigate('/mode');
        })
        .catch(error => {
          console.error('Error saving player:', error);
          alert('An error occurred while saving player data.');
        });
    } else {
      alert('Please enter your full name.');
    }
  };

  return (
    <div style={{ 
      position: 'relative', 
      minHeight: '100vh', 
      overflow: 'hidden',
      width: '100%'
    }}>
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -1,
        }}
      >
        <source src="/videos/neonbluebg.webm" type="video/mp4" />
      </video>

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: -1,
        }}
      ></div>

      

      <GameHistory visible={showHistory} onClose={() => setShowHistory(false)} />

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          zIndex: 1,
          padding: '1rem',
          flexDirection: 'column',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <h1
          style={{
            color: '#00ffff',
            fontSize: '2rem',
            textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff',
            marginBottom: '1rem',
            padding: '0 1rem',
            lineHeight: '1.2',
            '@media (min-width: 768px)': {
              fontSize: '3rem',
              marginBottom: '1.5rem'
            }
          }}
        >
          🎉 Welcome to Blackjack!
        </h1>

        <p
          style={{
            fontSize: '1.2rem',
            color: '#ffffff',
            textShadow: '0 0 8px #ffffff, 0 0 15px #ffffff',
            marginBottom: '1.5rem',
            padding: '0 1rem',
            '@media (min-width: 768px)': {
              fontSize: '1.5rem',
              marginBottom: '2rem'
            }
          }}
        >
          Ready to play?
        </p>

        <div style={{ 
          width: '90%',
          maxWidth: '350px',
          padding: '0 0.5rem',
          boxSizing: 'border-box',
          '@media (min-width: 768px)': {
            maxWidth: '400px'
          }
        }}>
          <input
            type="text"
            placeholder="Choose a Nick Name"
            value={playerName}
            onChange={(e) => {
              const name = e.target.value;
              setPlayerName(name);
              if (name.trim()) {
                localStorage.setItem('playerName', name.trim());
              }
            }}
            style={{
              padding: '0.8rem',
              fontSize: '1rem',
              borderRadius: '8px',
              border: '2px solid #00ffff',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              outline: 'none',
              marginBottom: '1rem',
              width: '100%',
              boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
              textAlign: 'center',
              '@media (min-width: 768px)': {
                padding: '1rem',
                fontSize: '1.1rem',
                borderRadius: '10px',
                marginBottom: '1.5rem'
              }
            }}
          />

          <button
            onClick={handleContinue}
            style={{
              padding: '0.8rem 1.5rem',
              fontSize: '1rem',
              borderRadius: '25px',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(45deg, #00ffff, #1e90ff)',
              color: 'white',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 10px rgba(0, 255, 255, 0.5), 0 0 15px rgba(0, 255, 255, 0.3)',
              zIndex: 2,
              width: '100%',
              maxWidth: '300px',
              margin: '0 auto',
              '@media (min-width: 768px)': {
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                borderRadius: '30px'
              }
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'linear-gradient(45deg, #00ffff, #20b2aa)';
              e.target.style.transform = 'scale(1.03)';
              e.target.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.7), 0 0 25px rgba(0, 255, 255, 0.5)';
              e.target.style.textShadow = '0 0 8px rgba(0, 255, 255, 0.7)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'linear-gradient(45deg, #00ffff, #1e90ff)';
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 10px rgba(0, 255, 255, 0.5), 0 0 15px rgba(0, 255, 255, 0.3)';
              e.target.style.textShadow = 'none';
            }}
          >
            Generate Random ID
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;