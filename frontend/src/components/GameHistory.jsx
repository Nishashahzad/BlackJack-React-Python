import React, { useEffect, useState } from 'react';

const GameHistory = ({ visible, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isMobile, setIsMobile] = useState(false);

  const playClickSound = () => {
    const audio = new Audio('/sounds/clickbtnsound.mp3');
    audio.play();
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (visible) {
      fetchHistory();
    } else {
      setError(null);
    }
  }, [visible]);

  const fetchHistory = async () => {
    const anonUserId = localStorage.getItem('anonUserId');
    if (!anonUserId) {
      setError('No user ID found - please play a game first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`http://localhost:5002/player-history/${anonUserId}`);
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.history)) throw new Error('Invalid history data format');
      setHistory(data.history);
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setError(err.message);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };
  if (!visible) return null;

  return (
    <div style={{ ...styles.panel, ...(isMobile ? styles.panelMobile : {}) }}>
      <h3 style={{ color: '#00ffff' }}>📜 Game History</h3>

      {loading && <p>Loading history...</p>}

      {error && (
        <p style={{ color: '#ff5555' }}>
          Error: {error}
          <button onClick={fetchHistory} style={styles.retryButton}>
            Retry
          </button>
        </p>
      )}

      <div style={styles.scrollContainer}>
        <div style={styles.scrollContent}>
          {!loading && !error && history.length === 0 ? (
            <p>No history yet. Play some games!</p>
          ) : (
            history.map((entry, i) => (
              <div key={i} style={styles.entry}>
                <div><strong>Time:</strong> {new Date(entry.time).toLocaleString()}</div>
                <div><strong>Mode:</strong> {entry.mode}</div>
                <div><strong>Result:</strong>
                  <span style={{
                    color: entry.result === 'win' ? '#00ff00' : entry.result === 'bust' ? '#ff8800' : '#ff0000',
                    fontWeight: 'bold'
                  }}>
                    {entry.result}
                  </span>
                </div>
                {entry.playerId && (
                  <div><strong>Opponent:</strong> {entry.playerId.substring(0, 8)}...</div>
                )}
              </div>
            ))

          )}
        </div>
      </div>

      <button
        onClick={() => {
          playClickSound();
          onClose();
        }}
        style={styles.button}>
        Close
      </button>

    </div>
  );
};

const styles = {
  panel: {
    position: 'absolute',
    top: '80px',
    left: '20px',
    padding: '20px',
    backgroundColor: '#111',
    borderRadius: '10px',
    color: '#fff',
    zIndex: 10,
    width: '400px',
    maxWidth: '90vw',
    border: '1px solid #00ffff',
    boxShadow: '0 0 15px rgba(0, 255, 255, 0.7)',
    maxHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
  },
  panelMobile: {
    top: '20px',
    left: '5%',
    width: '70vw',
    padding: '16px',
  },
  scrollContainer: {
    overflowY: 'auto',
    maxHeight: '50vh',
    margin: '10px 0',
    scrollbarWidth: 'thin',
    scrollbarColor: '#00ffff #222',

    '&::-webkit-scrollbar': {
      width: '10px',
    },
    '&::-webkit-scrollbar-track': {
      background: '#222',
      borderRadius: '10px',
      border: '1px solid #00ffff55',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'linear-gradient(45deg, #00ffff, #00aaff)',
      borderRadius: '10px',
      border: '1px solid #00ffff',
      boxShadow: 'inset 0 0 5px rgba(0, 255, 255, 0.8)',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: 'linear-gradient(45deg, #00aaff, #00ffff)',
      boxShadow: 'inset 0 0 8px rgba(0, 255, 255, 1)',
    },
    '&::-webkit-scrollbar-corner': {
      background: 'transparent',
    },
  },
  scrollContent: {
    paddingRight: '8px', 
  },
  entry: {
    marginBottom: '12px',
    borderBottom: '1px solid #00ffff33',
    paddingBottom: '6px',
    fontSize: '0.9rem',
  },
  button: {
    marginTop: '10px',
    padding: '6px 12px',
    backgroundColor: '#00ffff',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '4px',
    fontWeight: 'bold',
    color: '#111',
    alignSelf: 'flex-end',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: '0 0 8px #00ffff',
    }
  },
  retryButton: {
    marginLeft: '10px',
    padding: '2px 8px',
    backgroundColor: '#ff5555',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#ff3333',
    }
  },
};

export default GameHistory;