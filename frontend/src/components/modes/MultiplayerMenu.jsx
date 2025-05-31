import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MultiplayerMenu.css';

const CreateRoom = ({ onRoomCreated }) => {
  const [roomCode, setRoomCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [joinName, setJoinName] = useState('');

  const navigate = useNavigate();
  const clickSound = new Audio('/sounds/clickbtnsound.mp3');
  const playClickSound = () => clickSound.play();

  const handleCreateRoom = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5001/api/create-room', {
        method: 'POST',
      });
      const data = await response.json();
      setRoomCode(data.room_id);
      if (onRoomCreated) onRoomCreated(data.room_id);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room. Please try again later.');
    }
  };

  const handleJoinRoom = async () => {
    if (!joinRoomCode || !joinName) {
      alert('Please enter both your name and room code');
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:5001/api/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: joinRoomCode,
          username: joinName.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      if (data.status === 'success') {
        localStorage.setItem('playerName', joinName.trim().toLowerCase());
        window.location.href = `/multi/play/${joinRoomCode}`;
      } else {
        alert(data.message || 'Could not join room');
      }
    } catch (err) {
      console.error('Error joining room:', err);
      alert('Server error. Is your backend running?');
    }
  };

  const handleCopyLink = () => {
    const roomLink = `http://localhost:3000/multi/${roomCode}`;
    navigator.clipboard.writeText(roomLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleBack = () => {
    navigate('/mode');
  };

  return (
    <div className="multiplayer-wrapper">
      <video autoPlay loop muted playsInline className="video-background">
        <source src="./videos/neonbluebg.webm" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="create-room">
        <h2>Create a Multiplayer Room</h2>
        {!roomCode ? (
          <>
            <button onClick={() => { playClickSound(); handleCreateRoom(); }}>Create Room</button>
            <button onClick={() => { playClickSound(); handleBack(); }}>← Back</button>
          </>
        ) : (
          <>
            <h3>Room Created!</h3>
            <p>Room Code: <strong>{roomCode}</strong></p>
            <p>Share this link with friends:</p>
            <input
              type="text"
              value={`http://localhost:3000/multi/${roomCode}`}
              readOnly
              style={{ width: "80%" }}
            />
            <br />
            <button onClick={() => { playClickSound(); handleCopyLink(); }}>
              {copied ? 'Link Copied!' : '📋 Copy Invite Link'}
            </button>
            <br />
            <h3>Or Join an Existing Room</h3>
            <input
              type="text"
              value={joinRoomCode}
              onChange={(e) => setJoinRoomCode(e.target.value)}
              placeholder="Enter Room Code"
              style={{ marginBottom: '10px' }}
            />

            <input
              type="text"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              placeholder="Enter Your Name"
              style={{ marginBottom: '10px' }}
            />

            <button onClick={() => { playClickSound(); handleJoinRoom(); }}>Join Room</button>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateRoom;
