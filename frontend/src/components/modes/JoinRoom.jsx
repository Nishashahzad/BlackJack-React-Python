import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const JoinRoom = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const clickSound = new Audio('/sounds/clickbtnsound.mp3');
  const playClickSound = () => clickSound.play();


  const handleJoinRoom = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5001/api/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomCode, username }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        sessionStorage.setItem('playerName', username.trim().toLowerCase()); 
        navigate(`/multi/play/${roomCode}`);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Failed to join room', err);
      alert('Error joining room.');
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
    position: 'fixed',
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

  const inputStyle = {
    padding: '12px',
    margin: '10px 0',
    borderRadius: '10px',
    border: 'none',
    width: '80%',
    fontSize: '1.1rem',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0, 255, 255, 0.5), 0 0 30px rgba(0, 255, 255, 0.3)',
  };

  const buttonStyle = {
    background: 'linear-gradient(45deg, #00ffff, #1e90ff)',
    border: 'none',
    color: 'white',
    padding: '16px 40px',
    fontSize: '1.2rem',
    cursor: 'pointer',
    transition: 'all 0.4s ease',
    borderRadius: '50px',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    margin: '15px',
    boxShadow: '0 4px 20px rgba(0, 255, 255, 0.5), 0 0 30px rgba(0, 255, 255, 0.3)',
  };

  const buttonHoverStyle = {
    background: 'linear-gradient(45deg, #00d4ff, #1e90ff)',
    transform: 'scale(1.1)',
    boxShadow: '0 0 25px rgba(0, 255, 255, 0.7), 0 0 45px rgba(0, 255, 255, 0.5)',
    textShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
  };

  const buttonActiveStyle = {
    transform: 'scale(0.97)',
    boxShadow: '0 0 18px rgba(0, 255, 255, 0.5)',
  };

  return (
    <div style={containerStyle}>
      <div style={videoStyle}>
        <video autoPlay loop muted>
          <source src="/videos/neonbluebg.webm" type="video/mp4" />
        </video>
      </div>
      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={titleStyle}>Join Room: {roomCode}</h2>
        <input
          type="text"
          placeholder="Enter your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
        />
        <button
          onClick={() => { playClickSound(); handleJoinRoom(); }}
          disabled={!username}
          style={buttonStyle}
          onMouseOver={(e) => (e.target.style = buttonHoverStyle)}
          onMouseOut={(e) => (e.target.style = buttonStyle)}
          onMouseDown={(e) => (e.target.style = buttonActiveStyle)}
          onMouseUp={(e) => (e.target.style = buttonHoverStyle)}
        >
          Join Room
        </button>

      </div>
    </div>
  );
};

export default JoinRoom;
