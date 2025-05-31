#multiplayer_server.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import string

app = Flask(__name__)
CORS(app)

rooms = {}


def generate_room_id():
    return "RYO" + ''.join(random.choices(string.digits, k=4))


def generate_deck():
    suits = ['S', 'H', 'D', 'C']
    values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
    deck = [{'code': v + s, 'value': v, 'suit': s} for v in values for s in suits]
    random.shuffle(deck)
    return deck


def calculate_score(cards):
    score = 0
    aces = 0
    for card in cards:
        val = card['value']
        if val in ['J', 'Q', 'K']:
            score += 10
        elif val == 'A':
            aces += 1
            score += 11
        else:
            score += int(val)
    while score > 21 and aces:
        score -= 10
        aces -= 1
    return score


@app.route('/api/create-room', methods=['POST'])
def create_room():
    room_id = generate_room_id()
    while room_id in rooms:
        room_id = generate_room_id()

    rooms[room_id] = {
        "players": [],
        "gameState": None,
    }

    return jsonify({"room_id": room_id})

@app.route('/api/join-room', methods=['POST'])
def join_room():
    data = request.get_json()
    room_id = data.get('room_id')
    username = data.get('username')

    if room_id not in rooms:
        return jsonify({"status": "error", "message": "Room not found"}), 404

    if username in rooms[room_id]["players"]:
        return jsonify({"status": "success", "message": f"{username} already joined {room_id}!"})

    if len(rooms[room_id]["players"]) >= 5:
        return jsonify({"status": "error", "message": "Room is already full (maximum 5 players)."}), 403

    rooms[room_id]["players"].append(username)
    return jsonify({"status": "success", "message": f"{username} joined {room_id}!"})


@app.route('/api/room/<room_id>', methods=['GET'])
def get_room(room_id):
    if room_id not in rooms:
        return jsonify({"status": "error", "message": "Room not found"}), 404

    return jsonify({
        "status": "success",
        "players": rooms[room_id]["players"]
    })


@app.route('/api/play/state', methods=['GET'])
def get_game_state():
    room_id = request.args.get('room_id')
    if room_id not in rooms:
        return jsonify({'error': 'Room not found'}), 404
    return jsonify(rooms[room_id].get('gameState', {}))


@app.route('/api/play/deal', methods=['POST'])
def deal_cards():
    data = request.get_json()
    room_id = data.get('room_id')
    if room_id not in rooms:
        return jsonify({'error': 'Room not found'}), 404

    deck = generate_deck()
    players = rooms[room_id]['players']
    gameState = {
        'deck': deck,
        'turn': players[0],
        'players': {},
        'dealer': { 'cards': [deck.pop(), deck.pop()] }
    }

    for p in players:
        gameState['players'][p] = {
            'cards': [deck.pop(), deck.pop()],
        }

    rooms[room_id]['gameState'] = gameState

    return jsonify({'message': 'Game started', 'gameState': gameState})

@app.route('/api/play/hit', methods=['POST'])
def play_hit():
    data = request.get_json()
    room_id = data.get('room_id')
    player = data.get('player')

    if room_id not in rooms:
        return jsonify({'error': 'Room not found'}), 404

    gameState = rooms[room_id]['gameState']
    deck = gameState['deck']
    player_hand = gameState['players'][player]['cards']
    player_hand.append(deck.pop())
    gameState['deck'] = deck

    
    if calculate_score(player_hand) > 21:
        
        return play_stand()  

    return jsonify({'status': 'hit', 'hand': player_hand})

@app.route('/api/play/stand', methods=['POST'])
def play_stand():
    data = request.get_json()
    room_id = data.get('room_id')
    player = data.get('player')

    if room_id not in rooms:
        return jsonify({'error': 'Room not found'}), 404

    gameState = rooms[room_id]['gameState']
    players = list(gameState['players'].keys())
    current_index = players.index(gameState['turn'])

    if current_index + 1 < len(players):
        gameState['turn'] = players[current_index + 1]
    else:
       
        dealer_hand = gameState['dealer']['cards']
        deck = gameState['deck']
        while calculate_score(dealer_hand) < 17:
            dealer_hand.append(deck.pop())
        gameState['dealer']['cards'] = dealer_hand
        gameState['turn'] = 'done'

    return jsonify({'status': 'stand', 'turn': gameState['turn']})


if __name__ == '__main__':
    app.run(debug=True, port=5001)
