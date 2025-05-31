import React, { useEffect, useState, useRef } from 'react';
import './HomeScreen.css';

const HomeScreen = ({ onStartGame }) => {
  const [wallet, setWallet] = useState(null);
  const [pool, setPool] = useState(null);
  const videoRef = useRef(null);

  const fetchBalances = () => {
    const anonUserId = localStorage.getItem("anonUserId");
    if (!anonUserId) {
      console.error("anonUserId missing");
      return;
    }

    fetch(`http://localhost:8000/wallet/balance?anonUserId=${anonUserId}`)
      .then((res) => res.json())
      .then((data) => {
        setWallet(data.wallet_balance);
        setPool(data.pool_balance);
      })
      .catch((err) => {
        console.error('❌ Failed to fetch balances:', err);
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

  const handleButtonClick = async () => {
    const anonUserId = localStorage.getItem("anonUserId");
    try {
      const res = await fetch(`http://localhost:8000/wallet/balance?anonUserId=${anonUserId}`);
      const data = await res.json();
      if (data.wallet_balance < 50) {
        alert("⚠️ Please deposit money. You don’t have enough RYO to play.");
        return;
      }

      new Audio('/sounds/clickbtnsound.mp3').play();
      onStartGame(); 
    } catch (err) {
      console.error("❌ Failed to check wallet balance:", err);
      alert("❌ Could not verify balance. Please try again.");
    }
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

        <button onClick={handleButtonClick} className="start-btn">▶ Play Now</button>

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

export default HomeScreen;
