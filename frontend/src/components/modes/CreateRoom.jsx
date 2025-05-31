import React, { useState } from 'react';

const CreateRoom = () => {
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [joinName, setJoinName] = useState('');


  const handleJoinRoom = async () => {
    if (!roomCode || !username) {
      alert('Please enter both your name and room code');
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:5001/api/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomCode,
          username: username.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      if (data.status === 'success') {
        
        localStorage.setItem('playerName', username.trim().toLowerCase());

        
        window.location.href = `/multi/lobby/${roomCode}`;
      } else {
        alert(data.message || 'Could not join room');
      }
    } catch (err) {
      console.error('Error joining room:', err);
      alert('Server error. Is your backend running?');
    }
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>
      <h2>Join a Multiplayer Blackjack Room</h2>

      <input
        placeholder="Your Name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ padding: '10px', margin: '10px', width: '250px' }}
      />

      <input
        placeholder="Room Code (e.g., RYO1234)"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
        style={{ padding: '10px', margin: '10px', width: '250px' }}
      />

      <br />
      <button onClick={handleJoinRoom} style={{ padding: '10px 20px', marginTop: '15px' }}>
        🎮 Join Room
      </button>
    </div>
  );
};

export default CreateRoom;
