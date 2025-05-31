# main.py

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uuid
import random
import json
import os

from pydantic import BaseModel
from pydantic import BaseModel
from typing import Dict
from history import router as history_router
from wallet_utils import get_wallet_balance, send_ryo
from pool_manager import PoolManager


app = FastAPI()

class RefillRequest(BaseModel):
    anonUserId: str

class DepositData(BaseModel):
    anonUserId: str
    amount: float

class GameResultData(BaseModel):
    anonUserId: str
    result: str  
    bet: float

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(history_router)

USER_STORE_FILE = "user_store.json"

def load_user_store():
    if os.path.exists(USER_STORE_FILE):
        with open(USER_STORE_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_user_store(store):
    with open(USER_STORE_FILE, 'w') as f:
        json.dump(store, f)

user_store: Dict[str, Dict] = load_user_store()

class Progress(BaseModel):
    level: int
    score: int

class PlayerData(BaseModel):
    anonUserId: str
    name: str
    progress: Progress

def generate_username(name: str) -> str:
    cleaned = name.replace(" ", "").lower()
    random_number = random.randint(1, 1000)
    return f"{cleaned}{random_number}"

@app.post("/save-player")
async def save_player(data: PlayerData):
    if data.anonUserId in user_store:
        user_store[data.anonUserId]["progress"] = data.progress.dict()
        username = user_store[data.anonUserId]["username"]
    else:
        username = generate_username(data.name)
        user_store[data.anonUserId] = {
            "name": data.name,
            "username": username,
            "progress": data.progress.dict()
        }
        save_user_store(user_store)

    return {
        "message": "Player data saved",
        "userId": data.anonUserId,
        "username": username
    }

@app.get("/players")
async def get_all_players():
    return user_store

@app.get("/")
def root():
    return {"message": "Backend is running"}

async def save_multiplayer_history(anon_user_id: str, result: str):
    max_retries = 3
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://localhost:5002/record-history",
                    json={
                        "anonUserId": anon_user_id,
                        "mode": "multiplayer",
                        "result": result
                    },
                    timeout=5.0
                )
                response.raise_for_status()
                return True
        except Exception as e:
            print(f"Attempt {attempt + 1} failed for {anon_user_id}: {e}")
            if attempt == max_retries - 1:
                return False

@app.post("/end-multiplayer-game")
async def end_multiplayer_game(winner_id: str, loser_id: str, result: str = "loss"):
    if result == "bust":
        winner_saved = await save_multiplayer_history(winner_id, "bust")
        loser_saved = await save_multiplayer_history(loser_id, "loss")
    else:
        winner_saved = await save_multiplayer_history(winner_id, "win")
        loser_saved = await save_multiplayer_history(loser_id, "loss")

    if not winner_saved or not loser_saved:
        print(f"⚠️ History save failed: winner={winner_saved}, loser={loser_saved}")

    return {
        "message": "Game ended",
        "outcome_saved": {
            "winner": winner_saved,
            "loser": loser_saved
        }
    }


@app.get("/wallet/balance")
def wallet_balance(anonUserId: str):
    user = user_store.get(anonUserId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    balance = user.get("wallet", 0.0)
    pool_balance = user.get("pool", 100000.0)  

    return {
        "wallet_balance": balance,
        "unlocked_balance": balance,
        "pool_balance": pool_balance
    }


@app.post("/wallet/send")
def send_to_winner(address: str, amount: float):
    return send_ryo(address, amount)
@app.post("/singleplayer/resolve")
async def resolve_single_player_game(data: GameResultData):
    print(f"🟡 Incoming result: {data.dict()}")

    user = user_store.get(data.anonUserId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    
    user.setdefault("wallet", 0.0)
    user.setdefault("pool", 100000.0)

    if user["wallet"] < data.bet:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")

    
    user["wallet"] -= data.bet
    user["pool"] += data.bet  

   
    if data.bet < 5 or data.bet > 500:
        raise HTTPException(status_code=400, detail="Invalid bet amount")

    
    if data.result == "blackjack":
        payout = min(data.bet * 2.5, user["pool"])
    elif data.result == "win":
        payout = min(data.bet * 2.0, user["pool"])
    elif data.result == "push":
        payout = data.bet
    else:
        payout = 0.0

   
    if data.result == "bust":
        bonus = min(data.bet * 0.1, user["pool"])
        payout += bonus
        print(f"🔵 Bust bonus applied: {bonus}")

   
    if payout > 0:
        user["pool"] -= payout
        user["wallet"] += payout
        print(f"💰 Wallet after payout: {user['wallet']}")

    print(f"🧾 Pool balance now: {user['pool']}")

    save_user_store(user_store)

    return {
        "status": "success",
        "result": data.result,
        "bet": data.bet,
        "payout": payout,
        "wallet_balance": user["wallet"],
        "pool_balance": user["pool"]
    }


@app.post("/wallet/deposit")
def deposit_to_wallet(data: DepositData):
    anonUserId = data.anonUserId
    amount = data.amount

    user = user_store.get(anonUserId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user["wallet"] = user.get("wallet", 0) + amount
    save_user_store(user_store)

    return {"wallet_balance": user["wallet"]}
@app.post("/spectator/resolve")
async def resolve_spectator_game(data: GameResultData):
    user = user_store.get(data.anonUserId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "wallet" not in user:
        user["wallet"] = 0.0
    if "pool" not in user:
        user["pool"] = 100000

    if user["wallet"] < data.bet:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")

    user["wallet"] -= data.bet
    user["pool"] += data.bet

    payout = 0.0
    if data.result == "won":
        payout = min(data.bet * 2, user["pool"])
        user["wallet"] += payout
        user["pool"] -= payout

    save_user_store(user_store)

    return {
        "wallet_balance": user["wallet"],
        "pool_balance": user["pool"],
        "payout": payout
    }


@app.post("/multiplayer/resolve")
async def resolve_multiplayer_game(data: GameResultData):
    user = user_store.get(data.anonUserId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    
    if "wallet" not in user:
        user["wallet"] = 0.0
    if "pool" not in user:
        user["pool"] = 100000

    
    if user["wallet"] < data.bet:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")

    
    user["wallet"] -= data.bet
    user["pool"] += data.bet

    payout = 0.0
    if data.result == "win":
        payout = min(data.bet * 2, user["pool"])
        user["wallet"] += payout
        user["pool"] -= payout

    
    save_user_store(user_store)

    return {
        "status": "success",
        "wallet_balance": user["wallet"],
        "pool_balance": user["pool"],
        "payout": payout,
        "result": data.result,
        "bet": data.bet
    }

@app.get("/multiplayer/balance")
def get_multiplayer_balance(anonUserId: str):
    user = user_store.get(anonUserId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "wallet_balance": user.get("wallet", 0.0),
        "pool_balance": user.get("pool", 100000)
    }



@app.get("/pool/status")
def check_pool_status(anonUserId: str):
    user = user_store.get(anonUserId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
   
    if "pool" not in user:
        user["pool"] = 100000
    
    #
    if user["pool"] <= 50000:
        return {
            "needs_refill": True,
            "current_pool": user["pool"],
            "initial_pool": 100000
        }
    return {"needs_refill": False}


@app.post("/pool/refill")
async def refill_pool(request: RefillRequest):
    try:
        user = user_store.get(request.anonUserId)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        
        user["pool"] = 100000
        save_user_store(user_store)
        
        return {
            "status": "success",
            "message": "Pool refilled successfully",
            "new_pool_balance": user["pool"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))