import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { generateDeck, calculateScore } from '../utils/deck';
import './BlackjackTable.css';

const confetti = import('canvas-confetti').then((mod) => mod.default);

const BlackjackTable = ({ onBack }) => {
  const [deck, setDeck] = useState([]);
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [result, setResult] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [doubleUsed, setDoubleUsed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const navigate = useNavigate();
  const clickSound = new Audio('/sounds/clickbtnsound.mp3'); 
  const winSound = new Audio('/sounds/WINsound.mp3'); 
  const failSound = new Audio('/sounds/Fail_bustSound.mp3'); 

  useEffect(() => {
  if (!result) return;

  const resolveGame = async () => {
    const normalized = result.toLowerCase();

    const finalResult = normalized.includes("win") ? "win" :
      normalized.includes("lose") ? "loss" :
      normalized.includes("bust") ? "bust" :
      normalized.includes("push") ? "push" : "loss";

    try {
      const response = await fetch("http://localhost:8000/singleplayer/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonUserId: localStorage.getItem("anonUserId"),
          result: finalResult,
          bet: 50
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.detail === "Insufficient wallet balance") {
          alert("⚠️ Please deposit money. You don’t have enough RYO to play.");
        } else {
          alert("❌ Error: " + data.detail);
        }
        return;
      }

      console.log("🎯 Payout response:", data);
      

    } catch (err) {
      console.error("❌ Request failed:", err);
      alert("❌ Network error occurred.");
    }
  };

  resolveGame();
}, [result]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateGameState = (state) => {
    fetch('http://127.0.0.1:5000/api/update-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    }).catch((err) => console.error('Spectator sync failed:', err));
  };

  useEffect(() => {
    const newDeck = generateDeck();
    const initialPlayer = [newDeck[0], newDeck[2]];
    const initialDealer = [newDeck[1], newDeck[3]];

    setDeck(newDeck.slice(4));
    setPlayerCards(initialPlayer);
    setDealerCards(initialDealer);

    updateGameState({
      player: initialPlayer,
      dealer: initialDealer,
      playerScore: calculateScore(initialPlayer),
      dealerScore: calculateScore(initialDealer),
      gameOver: false,
      action: 'Game started',
    });
  }, []);

  const fireConfetti = async () => {
    const confettiFn = await confetti;
    confettiFn({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00'],
    });

    setTimeout(() => {
      confettiFn({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00ffff', '#ff00ff'],
      });
      confettiFn({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ffff00', '#00ff00'],
      });
    }, 300);
  };

  const handleHit = () => {
    if (!gameOver && deck.length > 0) {
      const card = deck[0];
      const newHand = [...playerCards, card];
      const newDeck = deck.slice(1);
      const score = calculateScore(newHand);

      setPlayerCards(newHand);
      setDeck(newDeck);

      if (score > 21) {
        setResult('💥 You Bust!');
        failSound.play();
        setGameOver(true);
        updateGameState({
          player: newHand,
          dealer: dealerCards,
          playerScore: score,
          dealerScore: calculateScore(dealerCards),
          gameOver: true,
          action: '💥 You Bust!',
        });

        saveGameHistory('💥 You Bust!');
      } else {
        updateGameState({
          player: newHand,
          dealer: dealerCards,
          playerScore: score,
          dealerScore: calculateScore(dealerCards),
          gameOver: false,
          action: 'Player hits',
        });
      }
    }
  };

  const handleStand = async () => {
    let dealerHand = [...dealerCards];
    let newDeck = [...deck];

    while (calculateScore(dealerHand) < 17) {
      dealerHand.push(newDeck.shift());
    }

    setDealerCards(dealerHand);
    setDeck(newDeck);

    const playerScore = calculateScore(playerCards);
    const dealerScore = calculateScore(dealerHand);
    let finalResult = '';

    if (dealerScore > 21 || playerScore > dealerScore) {
      finalResult = '✅ You Win!';
      setShowConfetti(true);
      await fireConfetti();
      winSound.play();
    } else if (dealerScore === playerScore) {
      finalResult = '🤝 Push!';
      winSound.play();
    } else {
      finalResult = '❌ You Lose!';
      failSound.play();
    }

    setResult(finalResult);
    setGameOver(true);

    updateGameState({
      player: playerCards,
      dealer: dealerHand,
      playerScore,
      dealerScore,
      gameOver: true,
      action: finalResult,
    });

    saveGameHistory(finalResult);

    setTimeout(() => setShowConfetti(false), 5000);
  };

  const handleDouble = () => {
    if (!gameOver && !doubleUsed && playerCards.length === 2) {
      setDoubleUsed(true);
      const card = deck[0];
      const newHand = [...playerCards, card];
      const newDeck = deck.slice(1);
      const score = calculateScore(newHand);

      setPlayerCards(newHand);
      setDeck(newDeck);

      updateGameState({
        player: newHand,
        dealer: dealerCards,
        playerScore: score,
        dealerScore: calculateScore(dealerCards),
        gameOver: false,
        action: 'Player doubles',
      });

      if (score > 21) {
        setResult('💥 You Bust!');
        failSound.play();
        setGameOver(true);
        updateGameState({
          player: newHand,
          dealer: dealerCards,
          playerScore: score,
          dealerScore: calculateScore(dealerCards),
          gameOver: true,
          action: '💥 You Bust!',
        });

        saveGameHistory('💥 You Bust!');
      } else {
        setTimeout(() => handleStand(), 600);
      }
    }
  };

  const canSplit =
    playerCards.length === 2 && playerCards[0].value === playerCards[1].value;

  const saveGameHistory = async (result) => {
    const anonUserId = localStorage.getItem('anonUserId');
    if (!anonUserId) {
      console.warn("Missing anonUserId");
      return;
    }

    try {
      const res = await fetch('http://localhost:5002/record-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anonUserId, mode: 'SinglePlayer', result }),
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

  const handleBack = () => {
    clickSound.play();
    navigate('/mode');
  };

  return (
    <div className="blackjack-table">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.2}
        />
      )}

      <>
        <video
          src="/videos/neonbluebg.webm"
          autoPlay
          loop
          muted
          className="video-bg"
        />

        <h2 className="sticky-title">Blackjack - Single Player Mode</h2>

        <div className="game-board">
          <div className="dealer">
            <h3 className="hand-title">Dealer ({calculateScore(dealerCards)})</h3>
            <div className="cards">
              {dealerCards.map((card, idx) => {
                const isHidden = idx === 1 && !gameOver;
                return (
                  <img
                    key={idx}
                    src={isHidden ? '/images/cards/back-card.png' : `/images/cards/${card.code}.svg`}
                    alt={isHidden ? 'Hidden Card' : card.code}
                    className="card-img"
                  />
                );
              })}
            </div>
          </div>

          <div className="player">
            <h3 className="hand-title">Player ({calculateScore(playerCards)})</h3>
            <div className="cards">
              {playerCards.map((card, idx) => (
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

        {result && (
          <h2
            className={`action ${result.includes('Win') ? 'win' : ''}`}
            data-result={
              result.includes('Win') ? 'Win' :
                result.includes('Lose') ? 'Lose' :
                  result.includes('Push') ? 'Push' : 'Bust'
            }
          >
            {result}
          </h2>
        )}

        <div className="controls">
          <button onClick={handleHit} disabled={gameOver} className="game-btn">HIT</button>
          <button onClick={handleStand} disabled={gameOver} className="game-btn">STAND</button>
          <button onClick={handleDouble} disabled={gameOver || doubleUsed || playerCards.length !== 2} className="game-btn">DOUBLE</button>
          <button disabled={!canSplit || gameOver} className="game-btn">SPLIT</button>
          <button onClick={handleBack} className="game-btn">BACK</button>
        </div>
      </>
    </div>
  );
};

export default BlackjackTable;
