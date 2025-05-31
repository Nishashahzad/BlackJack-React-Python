// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import GameModeSelector from './components/GameModeSelector';
import SinglePlayer from './components/modes/SinglePlayer';
import MultiplayerMenu from './components/modes/MultiplayerMenu';
import CreateRoom from './components/modes/CreateRoom';
import JoinRoom from './components/modes/JoinRoom';
import RoomLobby from './components/modes/RoomLobby';
import SpectatorView from './components/modes/SpectatorTable';
import MultiplayerGame from './components/modes/MultiplayerGame';
import WelcomePage from './components/WelcomePage';
import SpectatorModeEntry from './components/SpectatorModeEntry';
import MultiplayerModeEntry from './components/MultiplayerModeEntry';

import './App.css';

function AppRoutes() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <Routes>
  <Route path="/" element={<WelcomePage />} />
  <Route path="/mode" element={<GameModeSelector />} />
  <Route path="/single" element={<SinglePlayer onBack={handleBack} />} />

  {/* Multiplayer Flow */}
  <Route path="/multi" element={<MultiplayerMenu onBack={handleBack} />} />
  <Route path="/multi/create" element={<CreateRoom onBack={handleBack} />} />
  <Route path="/multi/:roomCode" element={<JoinRoom onBack={handleBack} />} />
  <Route path="/multi/lobby/:roomCode" element={<RoomLobby onBack={handleBack} />} />
  <Route path="/multi/play/:roomCode" element={<MultiplayerGame />} />
  <Route path="/multi/entry" element={<MultiplayerModeEntry />} />


  {/* Spectator Flow */}
  <Route path="/spectator-entry" element={<SpectatorModeEntry />} />  {/* NEW */}
  <Route path="/spectator" element={<SpectatorView onBack={handleBack} />} />
</Routes>

  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
