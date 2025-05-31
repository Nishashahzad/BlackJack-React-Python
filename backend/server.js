const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.get('/', (req, res) => {
  res.send('Blackjack Socket.IO Server');
});

const rooms = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', ({ roomCode, playerName }) => {
    socket.join(roomCode);
    if (!rooms[roomCode]) {
      rooms[roomCode] = {
        players: [],
        deck: shuffleDeck(),
        dealer: {
          hand: [],
          score: 0,
          stand: false
        },
        currentPlayerIndex: 0,
        messages: []
      };
    }

    const room = rooms[roomCode];
    const newPlayer = {
      id: socket.id,
      name: playerName,
      hand: [],
      stand: false,
      busted: false,
      score: 0
    };
    room.players.push(newPlayer);

    // Deal initial cards
    newPlayer.hand.push(drawCard(room.deck));
    newPlayer.hand.push(drawCard(room.deck));
    newPlayer.score = calculatePoints(newPlayer.hand);

    // Deal dealer cards if first player
    if (room.players.length === 1) {
      room.dealer.hand.push(drawCard(room.deck));
      room.dealer.hand.push(drawCard(room.deck));
      room.dealer.score = calculatePoints(room.dealer.hand);
    }

    room.messages.push(`${playerName} has joined the game`);
    io.to(roomCode).emit('game-update', getGameState(room));
  });

  socket.on('hit', (roomCode) => {
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.stand || player.busted) return;

    player.hand.push(drawCard(room.deck));
    player.score = calculatePoints(player.hand);

    if (player.score > 21) {
      player.busted = true;
      room.messages.push(`${player.name} busted and is out of the game!`);
      
      io.to(roomCode).emit('player-busted', player.name);
      socket.emit('you-busted');
      
      room.players = room.players.filter(p => p.id !== socket.id);
      
      if (room.players.length === 0) {
        room.messages.push('All players have busted! Game over.');
        io.to(roomCode).emit('game-update', getGameState(room));
        delete rooms[roomCode];
        return;
      }
      
      if (room.currentPlayerIndex >= room.players.length) {
        room.currentPlayerIndex = 0;
      }
      
      if (room.players.every(p => p.stand || p.busted)) {
        handleDealerTurn(room, roomCode);
      } else {
        io.to(roomCode).emit('game-update', getGameState(room));
      }
      return;
    }

    io.to(roomCode).emit('game-update', getGameState(room));
  });

  socket.on('stand', (roomCode) => {
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.busted) return;

    player.stand = true;
    room.messages.push(`${player.name} stands`);
    
    const nextIndex = getNextActivePlayerIndex(room);
    
    if (nextIndex === -1) {
      handleDealerTurn(room, roomCode);
    } else {
      room.currentPlayerIndex = nextIndex;
      io.to(roomCode).emit('game-update', getGameState(room));
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        const playerName = room.players[playerIndex].name;
        room.players.splice(playerIndex, 1);
        room.messages.push(`${playerName} has left the game`);
        
        if (room.players.length === 0) {
          delete rooms[roomCode];
        } else {
          if (room.currentPlayerIndex >= room.players.length) {
            room.currentPlayerIndex = 0;
          }
          
          if (room.players.every(p => p.stand || p.busted)) {
            handleDealerTurn(room, roomCode);
          } else {
            io.to(roomCode).emit('game-update', getGameState(room));
          }
        }
      }
    }
  });

  function handleDealerTurn(room, roomCode) {
    room.currentPlayerIndex = -1;
    room.messages.push('Dealer is playing...');
    io.to(roomCode).emit('game-update', getGameState(room));
    
    const drawInterval = setInterval(() => {
      if (calculatePoints(room.dealer.hand) >= 17) {
        clearInterval(drawInterval);
        room.dealer.stand = true;
        room.messages.push('Dealer stands');
        determineWinners(room, roomCode);
        return;
      }
      
      room.dealer.hand.push(drawCard(room.deck));
      room.dealer.score = calculatePoints(room.dealer.hand);
      io.to(roomCode).emit('game-update', getGameState(room));
    }, 1000);
  }

  function determineWinners(room, roomCode) {
    const dealerScore = room.dealer.score;
    const dealerBusted = dealerScore > 21;
    
    let gameResult = {
      dealerWins: false,
      playerWins: [],
      ties: []
    };

    room.players.forEach(player => {
      if (player.busted) return;
      
      const playerScore = player.score;
      if (playerScore > 21) {
        room.messages.push(`${player.name} busted!`);
      } else if (dealerBusted || playerScore > dealerScore) {
        room.messages.push(`${player.name} wins!`);
        gameResult.playerWins.push(player.id);
      } else if (playerScore === dealerScore) {
        room.messages.push(`${player.name} pushes (tie)`);
        gameResult.ties.push(player.id);
      } else {
        room.messages.push(`${player.name} loses`);
      }
    });

    if (gameResult.playerWins.length === 0 && gameResult.ties.length === 0) {
      gameResult.dealerWins = true;
    }
    
    io.to(roomCode).emit('game-update', getGameState(room));
    io.to(roomCode).emit('game-over', gameResult);
  }

  function getNextActivePlayerIndex(room) {
    if (room.players.every(p => p.stand || p.busted)) return -1;

    let nextIndex = (room.currentPlayerIndex + 1) % room.players.length;
    let attempts = 0;
    
    while ((room.players[nextIndex].stand || room.players[nextIndex].busted) && 
           attempts < room.players.length) {
      nextIndex = (nextIndex + 1) % room.players.length;
      attempts++;
    }

    return attempts >= room.players.length ? -1 : nextIndex;
  }

  function getGameState(room) {
    return {
      dealer: {
        hand: room.dealer.hand,
        score: room.dealer.score,
        stand: room.dealer.stand
      },
      players: room.players.map(player => ({
        id: player.id,
        name: player.name,
        hand: player.hand,
        score: player.score,
        stand: player.stand,
        busted: player.busted
      })),
      currentPlayer: room.currentPlayerIndex >= 0 ? room.players[room.currentPlayerIndex]?.id : null,
      messages: room.messages.slice(-5)
    };
  }
});

function shuffleDeck() {
  const suits = ['H', 'D', 'C', 'S'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  
  for (const suit of suits) {
    for (const value of values) {
      deck.push(value + suit);
    }
  }
  
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

function drawCard(deck) {
  return deck.pop();
}

function calculatePoints(hand) {
  if (!hand || hand.length === 0) return 0;
  let total = 0;
  let aces = 0;
  
  for (const card of hand) {
    const value = card.slice(0, -1);
    if (['J', 'Q', 'K'].includes(value)) {
      total += 10;
    } else if (value === 'A') {
      total += 11;
      aces++;
    } else {
      total += parseInt(value);
    }
  }
  
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  
  return total;
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));