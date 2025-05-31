import React, { useEffect, useState } from 'react';
import { FaFillDrip } from 'react-icons/fa';
import './GlobalHeader.css';

const GlobalHeader = ({ mode = "singleplayer" }) => {
  const [wallet, setWallet] = useState(null);
  const [pool, setPool] = useState(null);
  const [showRefillIcon, setShowRefillIcon] = useState(false);
  const [isRefilling, setIsRefilling] = useState(false);
  const [error, setError] = useState(null);

  const checkPoolStatus = (currentPool) => {
    setShowRefillIcon(currentPool <= 99990);
  };

  const refillPool = async () => {
    const anonUserId = localStorage.getItem("anonUserId");
    if (!anonUserId) {
      setError("User not identified");
      return;
    }

    setIsRefilling(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/pool/refill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ anonUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to refill pool');
      }

      const data = await response.json();
      setPool(data.new_pool_balance);
      setShowRefillIcon(false);
    } catch (error) {
      console.error("Refill error:", error);
      setError(error.message);
    } finally {
      setIsRefilling(false);
    }
  };

  const fetchBalances = async () => {
    const anonUserId = localStorage.getItem("anonUserId");
    if (!anonUserId) return;

    try {
      const endpoint = window.location.pathname.includes("multi")
        ? `http://localhost:8000/multiplayer/balance?anonUserId=${anonUserId}`
        : `http://localhost:8000/wallet/balance?anonUserId=${anonUserId}`;

      const response = await fetch(endpoint);
      const data = await response.json();

      setWallet(data.wallet_balance);
      setPool(data.pool_balance);
      checkPoolStatus(data.pool_balance);
    } catch (err) {
      console.error("Failed to fetch balances:", err);
      setError("Failed to load balances");
    }
  };

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 5000);
    return () => clearInterval(interval);
  }, [mode]);

  return (
    <div className="global-header">
      <div className="balance-item">
        <span className="balance-icon">🪙</span>
        <span>Wallet: {wallet !== null ? `${wallet} RYO` : '...'}</span>
      </div>
      <div className="balance-item">
        <span className="balance-icon">🎲</span>
        <span>
          Pool: {pool !== null ? `${pool} RYO` : '...'}
        </span>
        {showRefillIcon && (
          <span
            className={`refill-icon ${isRefilling ? 'refill-spin' : ''}`}
            onClick={!isRefilling ? refillPool : undefined}
            title="Click to refill pool"
            style={{ marginLeft: '6px' }} // 
          >
            <FaFillDrip />
            {isRefilling && <span className="refill-text">Refilling...</span>}
          </span>
        )}
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>

  );
};

export default GlobalHeader;