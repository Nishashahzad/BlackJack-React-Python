#app.py

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


live_game_state = {
    "dealer": [],
    "player": [],
    "dealerScore": 0,
    "playerScore": 0,
    "action": "Waiting for player...",
    "gameOver": False
}

@app.route('/api/current-game', methods=['GET'])
def current_game():
    return jsonify(live_game_state)
    
@app.route('/api/update-game', methods=['POST'])
def update_game():
    data = request.get_json()

    live_game_state.update({
        "dealer": data.get('dealer', []),
        "player": data.get('player', []),
        "dealerScore": data.get('dealerScore', 0),
        "playerScore": data.get('playerScore', 0),
        "action": data.get('action', ''),
        "gameOver": data.get('gameOver', False)
    })

    return jsonify({"status": "success", "message": "Game updated"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)