import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import GlobalHeader from '../GlobalHeader';

const clickSound = new Audio('/sounds/clickbtnsound.mp3');
const winSound = new Audio('/sounds/WINsound.mp3');
const bustSound = new Audio('/sounds/Fail_bustSound.mp3');

const MessageNotification = ({ message, onExpire }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onExpire();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onExpire]);

  return (
    <div style={{
      backgroundColor: 'rgba(200, 0, 0, 0.7)',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '5px',
      marginBottom: '0.5rem',
      animation: 'fadeIn 0.5s'
    }}>
      {message}
    </div>
  );
};

const MultiplayerGame = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [gameState, setGameState] = useState({
    dealer: { hand: [], score: 0, stand: false },
    players: [],
    currentPlayer: null,
    messages: []
  });
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [socket, setSocket] = useState(null);
  const [showBustedModal, setShowBustedModal] = useState(false);
  const [gameResult, setGameResult] = useState(null);

  useEffect(() => {
    const name = localStorage.getItem('playerName') || `Player${Math.floor(Math.random() * 1000)}`;
    setPlayerName(name);

    const newSocket = io('http://localhost:4000', {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnectionStatus('Connected');
      newSocket.emit('join-room', {
        roomCode,
        playerName: name
      });
    });

    newSocket.on('disconnect', (reason) => {
      setConnectionStatus(`Disconnected: ${reason}`);
    });

    newSocket.on('game-over', (result) => {
      setTimeout(() => {
        setGameResult(result);

        const anonUserId = localStorage.getItem('anonUserId');

        if (anonUserId) {
          if (Array.isArray(result?.playerWins) && result.playerWins.includes(newSocket.id)) {
            winSound.play();
            saveGameHistory("Multiplayer", "win", anonUserId);
            resolveMultiplayerGame("win");
          }
          else if (Array.isArray(result?.ties) && result.ties.includes(newSocket.id)) {
            saveGameHistory("Multiplayer", "tie", anonUserId);
            resolveMultiplayerGame("tie");
          }
          else if (Array.isArray(result?.bustedPlayers) && result.bustedPlayers.includes(newSocket.id)) {
            saveGameHistory("Multiplayer", "bust", anonUserId);
            resolveMultiplayerGame("loss");
          }
          else {
            saveGameHistory("Multiplayer", "loss", anonUserId);
            resolveMultiplayerGame("loss");
          }
        }
      }, 2500);
    });

    newSocket.on('connect_error', (err) => {
      setConnectionStatus('Connection failed');
      setTimeout(() => newSocket.connect(), 1000);
    });

    newSocket.on('game-update', (state) => {
      console.log('Game state update:', state);
      setGameState(state);
    });

    newSocket.on('player-busted', (playerName) => {
      setGameState(prev => ({
        ...prev,
        messages: [...prev.messages, `${playerName} busted and is out of the game!`]
      }));
    });

    newSocket.on('you-busted', () => {
      bustSound.play();
      setShowBustedModal(true);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomCode]);

  const handleHit = () => {
    clickSound.play();
    socket?.emit('hit', roomCode);
  };

  const handleStand = () => {
    clickSound.play();
    socket?.emit('stand', roomCode);
  };

  const calculateScore = (hand) => {
    if (!hand || hand.length === 0) return 0;
    let score = 0;
    let aces = 0;

    hand.forEach(card => {
      const value = card.slice(0, -1);
      if (value === 'A') {
        score += 11;
        aces++;
      } else if (['K', 'Q', 'J'].includes(value)) {
        score += 10;
      } else {
        score += parseInt(value) || 0;
      }
    });

    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }

    return score;
  };

  const isCurrentPlayer = gameState.currentPlayer === socket?.id;
  const ourPlayer = gameState.players.find(p => p.id === socket?.id);

  if (showBustedModal) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'rgba(200, 0, 0, 0.8)',
          padding: '2rem',
          borderRadius: '10px',
          maxWidth: '500px',
          textAlign: 'center',
          width: '90%',
          margin: '0 auto'
        }}>
          <h1 style={{ color: 'white', fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', marginBottom: '1rem' }}>
            YOU BUSTED!
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 3vw, 1.2rem)', marginBottom: '2rem' }}>
            You're out of the game because your score exceeded 21!
          </p>
          <button
            onClick={() => navigate('/mode')}
            style={{
              padding: 'clamp(0.6rem, 2vw, 0.8rem) clamp(1rem, 3vw, 1.5rem)',
              fontSize: 'clamp(0.9rem, 3vw, 1rem)',
              backgroundColor: 'rgba(0, 255, 255, 0.3)',
              color: 'white',
              border: '1px solid cyan',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Back to Mode Selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <GlobalHeader />
      <div className="blackjack-table" style={{
        color: 'white',
        textAlign: 'center',
        padding: 'clamp(1rem, 3vw, 2rem)',
        maxWidth: '100%',
        margin: '0 auto',
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'auto'
      }}>
        
        <video
          src="/videos/neonbluebg.webm"
          autoPlay
          loop
          muted
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: -1
          }}
        />

        
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          width: '90%',
          maxWidth: '600px'
        }}>
          {gameState.messages.map((msg, index) => (
            <MessageNotification
              key={index}
              message={msg}
              onExpire={() => {
                setGameState(prev => ({
                  ...prev,
                  messages: prev.messages.filter((m, i) => i !== index)
                }));
              }}
            />
          ))}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 className="sticky-title" style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}>Blackjack - Room: {roomCode}</h2>
          <div style={{
            padding: '0.5rem 1rem',
            backgroundColor: connectionStatus === 'Connected' ? 'green' : 'red',
            borderRadius: '5px',
            fontWeight: 'bold',
            fontSize: 'clamp(0.8rem, 2.5vw, 1rem)'
          }}>
            {connectionStatus}
          </div>
        </div>

       
        <div className="game-board" style={{
          margin: 'clamp(0.5rem, 2vw, 1.5rem) 0',
          padding: 'clamp(0.5rem, 2vw, 1rem)',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '10px',
          boxShadow: '0 0 15px rgba(255, 85, 85, 0.2)',
          display: 'inline-block',
          minWidth: 'clamp(200px, 40vw, 280px)'
        }}>
          <h3 className="hand-title" style={{ fontSize: 'clamp(0.9rem, 3vw, 1.2rem)' }}>Dealer ({calculateScore(gameState.dealer.hand)}) {gameState.dealer.stand && '(Standing)'}</h3>
          <div className="cards" style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(0.3rem, 1vw, 0.5rem)',
            marginTop: '1rem',
            flexWrap: 'wrap'
          }}>
            {gameState.dealer.hand.length > 0 ? (
              gameState.dealer.hand.map((card, idx) => {
                const shouldHide = idx === 1 && !gameState.dealer.stand && !gameResult;
                const cardSrc = shouldHide
                  ? '/images/cards/back-card.png'
                  : `/images/cards/${card}.svg`;

                return (
                  <img
                    key={idx}
                    src={cardSrc}
                    alt={shouldHide ? 'Hidden card' : card}
                    style={{
                      width: 'clamp(50px, 12vw, 70px)',
                      height: 'clamp(75px, 18vw, 100px)',
                      borderRadius: '8px',
                      boxShadow: '0 0 10px rgba(255, 85, 85, 0.3)',
                      transition: 'transform 0.5s ease'
                    }}
                  />
                );
              })
            ) : (
              <div style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Waiting for cards...</div>
            )}
          </div>
        </div>

      
        <div className="game-board" style={{
          margin: 'clamp(0.5rem, 2vw, 1.5rem) 0',
          padding: 'clamp(0.5rem, 2vw, 1rem)',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '10px',
          boxShadow: '0 0 15px rgba(0, 200, 255, 0.2)',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          <h3 style={{ fontSize: 'clamp(0.9rem, 3vw, 1.2rem)' }}>Players</h3>
          {gameState.players.length === 0 ? (
            <div style={{
              padding: '2rem',
              backgroundColor: 'rgba(0, 0, 0, 0)',
              borderRadius: '5px',
              display: 'inline-block',
              fontSize: 'clamp(0.9rem, 3vw, 1rem)'
            }}>
              Waiting for players to join...
            </div>
          ) : (
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              paddingRight: '0.5rem',
              scrollbarWidth: 'thin',
              scrollbarColor: '#888 transparent'
            }}>
              {gameState.players.map((player) => {
                const score = calculateScore(player.hand);
                const isBusted = score > 21;
                return (
                  <div key={player.id} style={{
                    padding: 'clamp(0.8rem, 2vw, 1.2rem)',
                    border: player.id === socket?.id ? '3px solid cyan' : '1px solid rgba(0, 255, 255, 0.5)',
                    borderRadius: '10px',
                    backgroundColor: isBusted ? 'rgba(100, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                    opacity: player.stand ? 0.8 : 1,
                    boxShadow: player.id === gameState.currentPlayer ? '0 0 15px cyan' : 'none',
                    display: 'inline-block',
                    minWidth: 'clamp(200px, 40vw, 280px)'
                  }}>
                    <h4 style={{
                      margin: '0 0 0.5rem 0',
                      color: isBusted ? 'tomato' : 'inherit',
                      whiteSpace: 'normal',
                      fontSize: 'clamp(0.8rem, 2.5vw, 1rem)'
                    }}>
                      {player.name}
                      {player.id === socket?.id && ' (You)'}
                      {player.id === gameState.currentPlayer && ' ▶'}
                      {isBusted ? ' (BUSTED!)' : player.stand ? ' (Standing)' : ''}
                    </h4>
                    <div style={{
                      fontSize: 'clamp(0.8rem, 2.5vw, 1.1rem)',
                      marginBottom: '0.5rem',
                      color: isBusted ? 'tomato' : 'inherit'
                    }}>
                      Score: {score} {isBusted && '(BUST!)'}
                    </div>
                    <div className="cards" style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 'clamp(0.3rem, 1vw, 0.5rem)',
                      marginTop: '1rem',
                      flexWrap: 'wrap'
                    }}>
                      {player.hand.length > 0 ? (
                        player.hand.map((card, idx) => (
                          <img
                            key={idx}
                            src={`/images/cards/${card}.svg`}
                            alt={card}
                            style={{
                              width: 'clamp(45px, 10vw, 60px)',
                              height: 'clamp(67px, 15vw, 90px)',
                              borderRadius: '8px',
                              boxShadow: '0 0 8px rgba(0, 255, 255, 0.3)'
                            }}
                          />
                        ))
                      ) : (
                        <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 'clamp(0.8rem, 2vw, 1rem)' }}>No cards yet</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        
        {socket && ourPlayer && !ourPlayer.stand && isCurrentPlayer && (
          <div className="controls" style={{
            marginTop: 'clamp(1rem, 3vw, 2rem)',
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(1rem, 3vw, 2rem)',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleHit}
              className="game-btn"
              style={{
                padding: 'clamp(0.8rem, 2vw, 1rem) clamp(1.5rem, 3vw, 2rem)',
                fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                backgroundColor: 'rgba(0, 255, 255, 0.3)',
                color: 'cyan',
                border: '2px solid cyan',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Hit
            </button>
            <button
              onClick={handleStand}
              className="game-btn"
              style={{
                padding: 'clamp(0.8rem, 2vw, 1rem) clamp(1.5rem, 3vw, 2rem)',
                fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                backgroundColor: 'rgba(255, 99, 71, 0.3)',
                color: 'tomato',
                border: '2px solid tomato',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Stand
            </button>
          </div>
        )}

        {gameResult && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 'clamp(1rem, 5vw, 2rem)',
              borderRadius: '10px',
              border: '2px solid cyan',
              maxWidth: '90%',
              width: 'clamp(300px, 80vw, 500px)',
              textAlign: 'center'
            }}>
              <h1 style={{
                color: 'white',
                fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
                marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
                lineHeight: '1.3'
              }}>
                {gameResult.dealerWins && 'Dealer wins! Game over!'}
                {gameResult.playerWins.includes(socket?.id) && 'You win! Game over!'}
                {gameResult.ties.includes(socket?.id) && "It's a tie! Game over!"}
              </h1>
              <button
                onClick={() => {
                  clickSound.play();
                  setGameResult(null);
                  navigate('/mode');
                }}
                style={{
                  padding: 'clamp(0.6rem, 2vw, 0.8rem) clamp(1rem, 4vw, 1.5rem)',
                  fontSize: 'clamp(0.9rem, 3.5vw, 1.1rem)',
                  backgroundColor: 'rgba(0, 255, 255, 0.3)',
                  color: 'white',
                  border: '1px solid cyan',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginTop: 'clamp(0.5rem, 2vw, 1rem)'
                }}
              >
                Back to Mode Selection
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const resolveMultiplayerGame = async (result, betAmount = 50) => {
  const response = await fetch("http://localhost:8000/multiplayer/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      anonUserId: localStorage.getItem("anonUserId"),
      result,
      bet: betAmount,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    if (data.detail === "Insufficient wallet balance") {
      alert("❌ Not enough RYO in your wallet. Please deposit!");
    } else {
      alert("❌ Error: " + data.detail);
    }
    return;
  }

  console.log("✅ Multiplayer payout result:", data);
};

const saveGameHistory = async (mode, result, playerId) => {
  try {
    console.log("Attempting to save history:", { mode, result, playerId });

    const res = await fetch('http://localhost:5002/record-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anonUserId: playerId,
        mode: mode.toLowerCase(),
        result: result.toLowerCase(),
        playerId: playerId
      }),
    });

    const response = await res.json();
    console.log("Save history response:", response);

    if (!res.ok) {
      throw new Error(response.message || "Failed to save history");
    }
    return response;
  } catch (err) {
    console.error("Error saving history:", err);
    throw err;
  }
};

export default MultiplayerGame;