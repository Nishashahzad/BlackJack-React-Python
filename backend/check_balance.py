#check_balance.py
import requests
import json


WALLET_RPC_URL = "http://127.0.0.1:18083/json_rpc"
HEADERS = {"Content-Type": "application/json"}


USE_MOCK_WALLET = True

def check_balance(account_index=0):
    if USE_MOCK_WALLET:
        mock_balance = 100.0
        mock_unlocked = 95.0
        print("[MOCK] Wallet Balance Response:")
        print(json.dumps({
            "balance": f"{mock_balance} RYO",
            "unlocked_balance": f"{mock_unlocked} RYO"
        }, indent=2))
        return

    payload = {
        "jsonrpc": "2.0",
        "id": "0",
        "method": "get_balance",
        "params": {
            "account_index": account_index
        }
    }

    try:
        response = requests.post(WALLET_RPC_URL, headers=HEADERS, data=json.dumps(payload), timeout=5)

        if response.status_code == 200:
            result = response.json()
            print("Wallet Balance Response:")
            print(json.dumps(result, indent=2))

           
            balance = result.get('result', {}).get('balance', 0) / 1e12
            unlocked = result.get('result', {}).get('unlocked_balance', 0) / 1e12

            print(f"\nCurrent Balance: {balance} RYO")
            print(f"Available Balance: {unlocked} RYO")
        else:
            print(f"Error {response.status_code}: {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to connect to wallet RPC at {WALLET_RPC_URL}")
        print("Error:", e)
        print("\nTroubleshooting steps:")
        print("1. Is ryo-wallet-rpc.exe still running?")
        print("2. Check if port 18083 is accessible")
        print("3. Verify your wallet is fully synced")

if __name__ == "__main__":
    check_balance()
