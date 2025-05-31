import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HomeScreen from '../HomeScreen';
import BlackjackTable from '../BlackjackTable';
import GlobalHeader from '../GlobalHeader'; 

const SinglePlayer = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [balance] = useState(123.45); // mock balance
  const navigate = useNavigate();

  const handleBack = () => {
    setGameStarted(false);
    navigate('/mode');
  };

  const handleGameEnd = async (result) => {
    await saveGameHistory('SinglePlayer', result);
    handleBack();
  };

  return (
    <div className="single-player">
      <GlobalHeader />
      {!gameStarted ? (
        <HomeScreen onStartGame={() => setGameStarted(true)} balance={balance} />
      ) : (
        <BlackjackTable onBack={handleBack} onGameEnd={handleGameEnd} />
      )}
    </div>
  );
};

const saveGameHistory = async (mode, result) => {
  const anonUserId = localStorage.getItem('anonUserId');
  if (!anonUserId) return;

  await fetch('http://localhost:5002/save-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anonUserId, mode, result }),
  });
};

export default SinglePlayer;
