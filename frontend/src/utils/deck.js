const suits = ['S', 'H', 'D', 'C'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function generateDeck() {
  let deck = [];
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ code: `${value}${suit}`, value, suit });
    }
  }
  return shuffle(deck);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function calculateScore(hand) {
    let score = 0;
    let aces = 0;
  
    hand.forEach(card => {
      let value = card.value;
      if (['K', 'Q', 'J'].includes(value)) {
        score += 10;
      } else if (value === 'A') {
        aces += 1;
        score += 11;
      } else {
        score += parseInt(value);
      }
    });
  
    
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
  
    return score;
  }
  