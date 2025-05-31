import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const RoomLobby = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`http://127.0.0.1:5001/api/room/${roomCode}`)
        .then(res => res.json())
        .then(data => setPlayers(data.players || []))
        .catch(err => console.error('Failed to fetch players:', err));
    }, 1000);

    return () => clearInterval(interval);
  }, [roomCode]);

  
  const startGame = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5001/api/play/deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomCode }),
      });

      const data = await res.json();
      if (res.ok) {
        navigate(`/multi/play/${roomCode}`);
      } else {
        alert('Failed to start game: ' + data.error);
      }
    } catch (err) {
      console.error('Start game error:', err);
      alert('Error starting game!');
    }
  };

  const containerStyle = {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    color: 'white',
    textAlign: 'center',
    padding: '20px',
  };

  const videoStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    objectFit: 'cover',
    zIndex: -1,
  };

  const titleStyle = {
    fontSize: '3.5rem',
    color: 'white',
    textShadow: '0 0 10px #ffffff, 0 0 20px #00ffff, 0 0 30px #00ffff',
    marginBottom: '20px',
  };

  const playerListStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px',
  };

  const playerNameStyle = {
    fontSize: '1.5rem',
    color: '#00ffff',
    textShadow: '0 0 10px #ffffff, 0 0 20px #00ffff',
    margin: '8px 0',
    padding: '10px',
    borderRadius: '10px',
    background: 'rgba(0, 0, 0, 0.5)',
    width: '200px',
    textAlign: 'center',
    boxShadow: '0 0 10px rgba(0, 255, 255, 0.7)',
    transition: 'all 0.3s ease-in-out',
  };

  const buttonStyle = {
    background: 'linear-gradient(45deg, #00ffff, #1e90ff)',
    border: 'none',
    color: 'white',
    padding: '16px 40px',
    fontSize: '1.2rem',
    cursor: 'pointer',
    borderRadius: '50px',
    fontWeight: 'bold',
    margin: '15px',
    boxShadow: '0 4px 20px rgba(0, 255, 255, 0.5), 0 0 30px rgba(0, 255, 255, 0.3)',
    transition: '0.4s all',
  };

  return (
    <div style={containerStyle}>
      <div style={videoStyle}>
        <video autoPlay loop muted>
          <source src="./videos/neonbluebg.webm" type="video/mp4" />
        </video>
      </div>

      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={titleStyle}>🃏 Room Lobby: {roomCode}</h2>
        <h3 style={{ color: 'white', textShadow: '0 0 10px #ffffff, 0 0 20px #00ffff' }}>
          Players in Room:
        </h3>
        <div style={playerListStyle}>
          {players.map((player, index) => (
            <div key={index} style={playerNameStyle}>
              {player}
            </div>
          ))}
        </div>
        <button
          onClick={startGame}
          disabled={players.length < 2}
          style={buttonStyle}
        >
          ▶ Start Game
        </button>
      </div>
    </div>
  );
};

export default RoomLobby;
