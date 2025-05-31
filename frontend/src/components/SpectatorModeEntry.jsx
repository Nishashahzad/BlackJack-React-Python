import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeScreen.css';

const SpectatorModeEntry = () => {
  const [wallet, setWallet] = useState(null);
  const [pool, setPool] = useState(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const fetchBalances = () => {
    const anonUserId = localStorage.getItem("anonUserId");
    if (!anonUserId) return;

    fetch(`http://localhost:8000/wallet/balance?anonUserId=${anonUserId}`)
      .then((res) => res.json())
      .then((data) => {
        setWallet(data.wallet_balance);
        setPool(data.pool_balance);
      })
      .catch((err) => {
        setWallet('Error');
        setPool('Error');
      });
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5;
    }
    fetchBalances();
  }, []);

  const handleButtonClick = () => {
    new Audio('/sounds/clickbtnsound.mp3').play();
    navigate('/spectator'); 
  };

  return (
    <div className="home-screen">
      <video ref={videoRef} className="video-bg" autoPlay loop muted playsInline>
        <source src="/videos/neonbluebg.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>
      <div className="home-screen-content">
        <h1>🃏 RYO Blackjack Terminal</h1>

        <div className="balance-lines">
          <p className="balance">🪙 Wallet: {wallet !== null ? `${wallet} RYO` : 'Loading...'}</p>
          <p className="balance">🎲 Pool: {pool !== null ? `${pool} RYO` : 'Loading...'}</p>
        </div>

        <button onClick={handleButtonClick} className="start-btn">Watch Game</button>

        <button onClick={() => {
          const anonUserId = localStorage.getItem("anonUserId");
          fetch("http://localhost:8000/wallet/deposit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ anonUserId, amount: 100 }),
          })
            .then(res => res.json())
            .then(data => {
              alert(`Wallet updated! New balance: ${data.wallet_balance} RYO`);
              setWallet(data.wallet_balance);
            });
        }} className="deposit-btn">
          💳 Deposit 100 RYO (Mock)
        </button>
      </div>
    </div>
  );
};

export default SpectatorModeEntry;
