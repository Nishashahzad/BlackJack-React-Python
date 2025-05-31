#history.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Dict, List
import json
import os

router = APIRouter()


HISTORY_STORE_FILE = "history_store.json"


def load_history_store():
    if os.path.exists(HISTORY_STORE_FILE):
        with open(HISTORY_STORE_FILE, 'r') as f:
            return json.load(f)
    return {}


def save_history_store(store):
    with open(HISTORY_STORE_FILE, 'w') as f:
        json.dump(store, f)


player_histories: Dict[str, List[Dict]] = load_history_store()

class HistoryItem(BaseModel):
    anonUserId: str
    mode: str
    result: str
    playerId: str = ""  

@router.post("/record-history")
async def save_player_history(data: HistoryItem):
    if not data.anonUserId:
        raise HTTPException(status_code=400, detail="Missing user ID")
    
    print(f"Received history data: {data}")  # Debug logging
    
    entry = {
        "time": datetime.now().isoformat(),
        "mode": data.mode,
        "result": data.result,
        "playerId": data.playerId if data.mode == "multiplayer" else ""
    }

    if data.anonUserId not in player_histories:
        player_histories[data.anonUserId] = []
    
    player_histories[data.anonUserId].insert(0, entry)
    player_histories[data.anonUserId] = player_histories[data.anonUserId][:5]  # Keep last 5 entries
    
    
    save_history_store(player_histories)
    
    print(f"Current history for {data.anonUserId}: {player_histories[data.anonUserId]}")  
    
    return {"status": "success", "entries": len(player_histories[data.anonUserId])}

@router.get("/player-history/{anonUserId}")
async def get_player_history(anonUserId: str):
    if not anonUserId:
        raise HTTPException(status_code=400, detail="User ID required")
    
    if anonUserId not in player_histories:
        return {"history": []}
    
    return {"history": player_histories[anonUserId]}
