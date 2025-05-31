#send_ryo.py

import requests
import json

WALLET_RPC_URL = "http://127.0.0.1:18083/json_rpc"
HEADERS = {"Content-Type": "application/json"}


USE_MOCK_WALLET = True

def send_ryo(address, amount_ryo, account_index=0):
    if USE_MOCK_WALLET:
        print(f"[MOCK] Would send {amount_ryo} RYO to {address}")
        return {"status": "mock", "amount": amount_ryo, "address": address}

    atomic_amount = int(amount_ryo * 1e12)  

    payload = {
        "jsonrpc": "2.0",
        "id": "0",
        "method": "transfer",
        "params": {
            "account_index": account_index,
            "destinations": [
                {
                    "amount": atomic_amount,
                    "address": address
                }
            ],
            "priority": 0,
            "ring_size": 11,
            "get_tx_key": True
        }
    }

    try:
        res = requests.post(WALLET_RPC_URL, headers=HEADERS, data=json.dumps(payload), timeout=10)
        res.raise_for_status()
        result = res.json()
        print("✅ Transaction sent!")
        print(json.dumps(result, indent=2))
        return result
    except Exception as e:
        print("❌ Failed to send RYO:", e)
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    send_ryo("RYoLsdui4eZ4QXQu6A65r6NB2kgbgXa4u4aPTKkPsHoqQxhDY875qFzFtGxKwAaWQgVGmnFbG6QgrXn2LqFmBC7M34DSvFhD483", 1.5)

    
    def get_address(account_index=0):
        payload = {
            "jsonrpc": "2.0",
            "id": "0",
            "method": "get_address",
            "params": {
                "account_index": account_index
            }
        }
        try:
            res = requests.post(WALLET_RPC_URL, headers=HEADERS, data=json.dumps(payload))
            print(json.dumps(res.json(), indent=2))
        except Exception as e:
            print("❌ Failed to get address:", e)

    get_address()
