import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './SpectatorTable.css';

const playClickSound = () => {
  const audio = new Audio('/sounds/clickbtnsound.mp3');
  audio.play();
};

const SpectatorView = () => {
  const [gameState, setGameState] = useState(null);
  const [bet, setBet] = useState('');
  const [betResult, setBetResult] = useState('');
  const [betPlaced, setBetPlaced] = useState(false);
  const [gameResults, setGameResults] = useState([]);
  const [showMatchOverModal, setShowMatchOverModal] = useState(false);

  const navigate = useNavigate();

  const checkBetResult = useCallback(async (data) => {
  const results = [];
  const playerScore = data.playerScore;
  const dealerScore = data.dealerScore;

  if (playerScore > 21 && dealerScore > 21) {
    results.push("Both Bust");
  } else if (playerScore > 21) {
    results.push("Player Bust");
  } else if (dealerScore > 21) {
    results.push("Dealer Bust");
  }

  if (playerScore > dealerScore && playerScore <= 21) {
    results.push("Player Win");
  } else if (dealerScore > playerScore && dealerScore <= 21) {
    results.push("Dealer Win");
  } else if (playerScore === dealerScore) {
    results.push("Tie");
  }

  let betOutcome = 'Lost the bet!';
  if (bet === 'Player Win' && results.includes('Player Win')) {
    betOutcome = 'You WON the bet!';
  } else if (bet === 'Player Bust' && results.includes('Player Bust')) {
    betOutcome = 'You WON the bet!';
  } else if (bet === 'Player Loss' && results.includes('Dealer Win')) {
    betOutcome = 'You WON the bet!';
  } else if (bet === 'Dealer Win' && results.includes('Dealer Win')) {
    betOutcome = 'You WON the bet!';
  } else if (bet === 'Dealer Loss' && results.includes('Dealer Bust')) {
    betOutcome = 'You WON the bet!';
  }

  setGameResults(results);
  setBetResult(`${betOutcome} (${results.join(', ')})`);

  try {
    const response = await fetch("http://localhost:8000/spectator/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anonUserId: localStorage.getItem("anonUserId"),
        result: betOutcome.includes("WON") ? "won" : "lost",
        bet: 50,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("🎯 Spectator payout response:", data);
      await saveGameHistory("Spectator", data.payout > 0 ? "won" : "lost");
    } else {
      alert(data.detail || "Something went wrong while resolving spectator game.");
    }
  } catch (err) {
    console.error("❌ Error resolving spectator game:", err);
  }
}, [bet]);




  const [wallet, setWallet] = useState(0);
  const [pool, setPool] = useState(0);

  useEffect(() => {
    const anonUserId = localStorage.getItem('anonUserId');
    if (!anonUserId) return;

    fetch(`http://localhost:8000/wallet/balance?anonUserId=${anonUserId}`)
      .then(res => res.json())
      .then(data => {
        setWallet(data.wallet_balance || 0);
        setPool(data.pool_balance || 0);
      })
      .catch(err => console.error("Wallet fetch error:", err));
  }, []);


  useEffect(() => {
    if (!betPlaced) return;

    const interval = setInterval(() => {
      fetch('http://127.0.0.1:5000/api/current-game')
        .then((res) => res.json())
        .then((data) => {
          if (data.action === 'Game started') {
            setBetResult('');
          }

          if ((!data.player || data.player.length === 0) &&
            (!data.dealer || data.dealer.length === 0)) {
            setBetResult('');
          }

          setGameState(data);

          if (data.gameOver && bet && !betResult) {
            checkBetResult(data);
          }

        })
        .catch((err) => console.error('Error fetching game state:', err));
    }, 1000);

    return () => clearInterval(interval);
  }, [betPlaced, bet, betResult, checkBetResult]);

  const handleBetSelection = async (selectedBet) => {
    playClickSound();

    const anonUserId = localStorage.getItem('anonUserId');
    const res = await fetch(`http://localhost:8000/wallet/balance?anonUserId=${anonUserId}`);
    const data = await res.json();

    if (data.wallet_balance < 50) {
      alert("⚠️ Not enough RYO to bet. Please deposit.");
      return;
    }

    setBet(selectedBet);
    setBetPlaced(true);
    setBetResult('');
    setGameState(null);
    setGameResults([]);
    setShowMatchOverModal(false);
  };


  const handleBetAgain = () => {
    playClickSound();
    setBet('');
    setBetPlaced(false);
    setBetResult('');
    setGameState(null);
    setGameResults([]);
    setShowMatchOverModal(false);
  };

  const handleBack = () => {
    navigate('/mode');
  };

  return (
    <div className="spectator-view">
      <video className="video-bg" autoPlay loop muted>
        <source src="/videos/neonbluebg.webm" type="video/mp4" />
      </video>

      <div className="content">
        {!betPlaced ? (
          <div className="bet-selection">
            <h2>🎲 Place Your Bet!</h2>
            <div className="bet-options">
              {['Player Win', 'Player Bust', 'Player Loss', 'Dealer Win', 'Dealer Loss'].map((option) => (
                <button
                  key={option}
                  onClick={() => handleBetSelection(option)}
                  className="bet-button"
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="back-button">
              <button onClick={handleBack}>← Back to Mode Select</button>
            </div>
          </div>
        ) : !gameState ? (
          <div className="loading">Loading Live Game...</div>
        ) : !gameState.player || gameState.player.length === 0 ? (
          <div className="waiting">⏳ Waiting for players!</div>
        ) : (
          <div className="spectator-view">
            <h2>🎥 Spectator View: Watching Game</h2>

            <div className="hands-container">
              <div className="hand-section">
                <h3 className="hand-title">Dealer's Hand ({gameState.dealerScore})</h3>
                <div className="cards">
                  {gameState.dealer.map((card, idx) => (
                    <img
                      key={idx}
                      src={
                        idx === 0 && !gameState.gameOver
                          ? '/images/cards/back-card.png'
                          : `/images/cards/${card.code}.svg`
                      }
                      alt={idx === 0 && !gameState.gameOver ? 'Hidden Card' : card.code}
                      className="card-img"
                    />
                  ))}
                </div>
              </div>

              <div className="hand-section">
                <h3 className="hand-title">Player's Hand ({gameState.playerScore})</h3>
                <div className="cards">
                  {gameState.player.map((card, idx) => (
                    <img
                      key={idx}
                      src={`/images/cards/${card.code}.svg`}
                      alt={card.code}
                      className="card-img"
                    />
                  ))}
                </div>
              </div>
            </div>

            {gameState.action && !gameState.action.includes('You') && (
              <h2 className="game-update">{gameState.action}</h2>
            )}

            {gameState.gameOver && (
              <h3 className="final-result-line" style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                padding: '1rem 2rem',
                borderRadius: '50px',
                background: 'rgba(0, 0, 0, 0.6)',
                boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
                textShadow: '0 0 10px currentColor',
                animation: 'pulse 1.5s infinite alternate',
                margin: '1.5rem 0',
                ...(() => {
                  const p = gameState.playerScore;
                  const d = gameState.dealerScore;
                  if (p > 21 && d > 21) return { color: '#FFD700', border: '2px solid #FFD700' };
                  if (p > 21) return { color: '#FF5555', border: '2px solid #FF5555' };
                  if (d > 21) return { color: '#55FF55', border: '2px solid #55FF55' };
                  if (p > d) return { color: '#55FF55', border: '2px solid #55FF55' };
                  if (d > p) return { color: '#FF5555', border: '2px solid #FF5555' };
                  return { color: '#FFD700', border: '2px solid #FFD700' };
                })()
              }}>
                {(() => {
                  const p = gameState.playerScore;
                  const d = gameState.dealerScore;
                  if (p > 21 && d > 21) return "💥 Both Bust! It's a Tie! 💥";
                  if (p > 21) return "💣 Player Busts! Dealer Wins! 🎩";
                  if (d > 21) return "💣 Dealer Busts! Player Wins! 🎮";
                  if (p > d) return "🎉 Player Wins! 🍾";
                  if (d > p) return "🏆 Dealer Wins! 🎯";
                  return "🤝 It's a Tie! 🎭";
                })()}
              </h3>
            )}

            <div className="your-bet">Your Bet: {bet}</div>

            {betResult && (
              <div className={`bet-result ${betResult.includes('WON') ? 'win' : 'loss'}`}>
                {betResult}
              </div>
            )}

            {gameState.gameOver && (
              <div className="bet-actions">
                <button
                  onClick={() => {
                    new Audio('/sounds/clickbtnsound.mp3').play();
                    handleBetAgain();
                  }}
                  className="bet-button"
                >
                  🔁 Bet Again
                </button>
                <button
                  onClick={() => {
                    new Audio('/sounds/clickbtnsound.mp3').play();
                    handleBack();
                  }}
                  className="bet-button"
                >
                  ← Back to Mode Select
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

const saveGameHistory = async (mode, result) => {
  const anonUserId = localStorage.getItem('anonUserId');
  if (!anonUserId) {
    console.warn("Missing anonUserId");
    return;
  }

  try {
    const res = await fetch('http://localhost:5002/record-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anonUserId, mode, result }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Failed to save history:", err);
    } else {
      console.log("History saved successfully!");
    }
  } catch (err) {
    console.error("Network error while saving history:", err);
  }
};

export default SpectatorView;
