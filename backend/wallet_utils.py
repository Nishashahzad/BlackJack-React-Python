# wallet_utils.py
import requests
import json

WALLET_RPC_URL = "http://127.0.0.1:18083/json_rpc"
HEADERS = {"Content-Type": "application/json"}
USE_MOCK_WALLET = True  

def get_wallet_balance(account_index=0):
    if USE_MOCK_WALLET:
        
        mock_balance = 100.0
        mock_unlocked = 95.0
        return {
            "balance": mock_balance,
            "unlocked": mock_unlocked
        }

    payload = {
        "jsonrpc": "2.0",
        "id": "0",
        "method": "get_balance",
        "params": {"account_index": account_index}
    }

    try:
        response = requests.post(WALLET_RPC_URL, headers=HEADERS, data=json.dumps(payload), timeout=5)
        response.raise_for_status()
        result = response.json().get("result", {})
        return {
            "balance": result.get("balance", 0) / 1e12,
            "unlocked": result.get("unlocked_balance", 0) / 1e12
        }
    except Exception as e:
        print("Wallet RPC error:", e)
        return {"balance": 0.0, "unlocked": 0.0}


def send_ryo(address, amount_ryo, account_index=0):
    if USE_MOCK_WALLET:
        print(f"[MOCK] Sending {amount_ryo} RYO to {address}")
        return {"status": "mock", "amount": amount_ryo, "to": address}

    atomic_amount = int(amount_ryo * 1e12)

    payload = {
        "jsonrpc": "2.0",
        "id": "0",
        "method": "transfer",
        "params": {
            "account_index": account_index,
            "destinations": [{"amount": atomic_amount, "address": address}],
            "priority": 0,
            "ring_size": 11,
            "get_tx_key": True
        }
    }

    try:
        response = requests.post(WALLET_RPC_URL, headers=HEADERS, data=json.dumps(payload), timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print("❌ Failed to send RYO:", e)
        return {"error": str(e)}


def get_address(account_index=0):
    payload = {
        "jsonrpc": "2.0",
        "id": "0",
        "method": "get_address",
        "params": {"account_index": account_index}
    }

    try:
        response = requests.post(WALLET_RPC_URL, headers=HEADERS, data=json.dumps(payload))
        return response.json().get("result", {}).get("address", "N/A")
    except Exception as e:
        print("Error getting address:", e)
        return "N/A"
