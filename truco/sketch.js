let deck = [];
let player1Hand = [];
let player2Hand = [];
let playedCards = [];
let selectedCard = null;
let currentPlayer = 1;
let gameState = 'selection';
let pointsPlayer1 = 0;
let pointsPlayer2 = 0;
let cardImages = {};
let backImage;
let message = "";
let roundsWonPlayer1 = 0;
let roundsWonPlayer2 = 0;
let envidoPlayed = false;
let envidoDeclined = false;
let trucoPlayed = false;
let reTrucoPlayed = false;
let delayStarted = false;
let delayEndTime = 0;

const cardHierarchy = {
  'espada1': 14, 'basto1': 13, 'espada7': 12, 'oro7': 11,
  'espada3': 10, 'basto3': 10, 'oro3': 10, 'copa3': 10,
  'espada2': 9, 'basto2': 9, 'oro2': 9, 'copa2': 9,
  'copa1': 8, 'oro1': 8,
  'espada12': 7, 'basto12': 7, 'oro12': 7, 'copa12': 7,
  'espada11': 6, 'basto11': 6, 'oro11': 6, 'copa11': 6,
  'espada10': 5, 'basto10': 5, 'oro10': 5, 'copa10': 5,
  'copa7': 4, 'basto7': 4,
  'espada6': 3, 'basto6': 3, 'oro6': 3, 'copa6': 3,
  'espada5': 2, 'basto5': 2, 'oro5': 2, 'copa5': 2,
  'espada4': 1, 'basto4': 1, 'oro4': 1, 'copa4': 1
};

function preload() {
  let suits = ['oro', 'basto', 'espada', 'copa'];
  let values = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  
  for (let suit of suits) {
    for (let value of values) {
      let cardName = `${suit}${value}`;
      cardImages[cardName] = loadImage(`assets/${cardName}.png`);
    }
  }
  backImage = loadImage('assets/back.png');
  backgr = loadImage('assets/background.jpg');
}

function setup() {
  createCanvas(430, 900);
  initializeDeck();
  shuffleDeck();
  dealCards();
}

function draw() {
  background(backgr);
  drawHands();
  drawButtons();
  drawPlayedCards();
  drawPoints();
  drawMessage();
  
  if (delayStarted && millis() >= delayEndTime) {
    delayStarted = false;
    resetHands();
  }
}

function initializeDeck() {
  let suits = ['oro', 'basto', 'espada', 'copa'];
  let values = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ suit, value });
    }
  }
}

function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function dealCards() {
  player1Hand = [];
  player2Hand = [];
  for (let i = 0; i < 3; i++) {
    player1Hand.push(deck.pop());
    player2Hand.push(deck.pop());
  }
}

function drawHands() {
  for (let i = 0; i < player1Hand.length; i++) {
    drawCard(player1Hand[i], 50 + i * 100, 700, i === selectedCard);
  }
  for (let i = 0; i < player2Hand.length; i++) {
    drawCard({ suit: 'back', value: 0 }, 50 + i * 100, 50, false);
  }
}

function drawPlayedCards() {
  for (let i = 0; i < playedCards.length; i++) {
    let x = playedCards[i].player === 1 ? width / 2 - 100 : width / 2 + 20;
    let y = height / 2 - 60; // Alinea las cartas en el mismo eje Y
    drawCard(playedCards[i].card, x, y, false);
  }
}

function drawCard(card, x, y, highlighted) {
  if (highlighted) {
    stroke(255, 0, 0);
    strokeWeight(3);
  } else {
    noStroke();
  }
  if (card.suit !== 'back') {
    let cardName = `${card.suit}${card.value}`;
    image(cardImages[cardName], x, y, 80, 120);
  } else {
    image(backImage, x, y, 80, 120);
  }
}

function drawButtons() {
  if (gameState === 'selection') {
    if (!envidoPlayed && !envidoDeclined && roundsWonPlayer1 === 0 && roundsWonPlayer2 === 0) {
      drawButton('Envido', 50, 600);
      drawButton('Real Envido', 150, 600);
      drawButton('Falta Envido', 250, 600);
    }
    if (!trucoPlayed) {
      drawButton('Truco', 50, 650);
    } else if (!reTrucoPlayed) {
      drawButton('Re Truco', 150, 650);
    } else {
      drawButton('Vale Cuatro', 250, 650);
    }
    drawButton('Ir al Mazo', 350, 650);
  } else if (gameState === 'envidoResponse') {
    drawButton('Quiero', 250, 600);
    drawButton('No Quiero', 350, 600);
  } else if (gameState === 'trucoResponse') {
    drawButton('Quiero', 50, 600);
    drawButton('Re Truco', 150, 600);
    drawButton('No Quiero', 250, 600);
  } else if (gameState === 'reTrucoResponse') {
    drawButton('Quiero', 50, 600);
    drawButton('Vale Cuatro', 150, 600);
    drawButton('No Quiero', 250, 600);
  } else if (gameState === 'valeCuatroResponse') {
    drawButton('Quiero', 150, 600);
    drawButton('No Quiero', 250, 600);
  }
}

function drawButton(label, x, y) {
  fill(0, 0, 255);
  rect(x, y, 80, 40);
  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
  text(label, x + 40, y + 20);
}

function drawPoints() {
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text(`Puntos Jugador 1: ${pointsPlayer1}`, 10, 10);
  text(`Puntos Jugador 2: ${pointsPlayer2}`, 10, 30);
}

function drawMessage() {
  fill(0);
  textSize(24);
  textAlign(CENTER, CENTER);
  text(message, width / 2, height / 4 + 50);
}

function mousePressed() {
  if (gameState === 'selection') {
    for (let i = 0; i < player1Hand.length; i++) {
      if (mouseX > 50 + i * 100 && mouseX < 130 + i * 100 && mouseY > 700 && mouseY < 820) {
        selectedCard = i;
        playCard(player1Hand[i], 1);
        player1Hand.splice(i, 1);
        currentPlayer = 2;
        handleIaTurn();
        return;
      }
    }
    if (!envidoPlayed && !envidoDeclined && roundsWonPlayer1 === 0 && roundsWonPlayer2 === 0) {
      if (mouseX > 50 && mouseX < 130 && mouseY > 600 && mouseY < 640) {
        message = 'Envido';
        gameState = 'envidoResponse';
        handleIaResponse('Envido');
      } else if (mouseX > 150 && mouseX < 230 && mouseY > 600 && mouseY < 640) {
        message = 'Real Envido';
        gameState = 'envidoResponse';
        handleIaResponse('Real Envido');
      } else if (mouseX > 250 && mouseX < 330 && mouseY > 600 && mouseY < 640) {
        message = 'Falta Envido';
        gameState = 'envidoResponse';
        handleIaResponse('Falta Envido');
      }
    }
    if (!trucoPlayed && mouseX > 50 && mouseX < 130 && mouseY > 650 && mouseY < 690) {
      message = 'Truco';
      trucoPlayed = true;
      gameState = 'trucoResponse';
      handleIaResponse('Truco');
    } else if (trucoPlayed && !reTrucoPlayed && mouseX > 150 && mouseX < 230 && mouseY > 650 && mouseY < 690) {
      message = 'Re Truco';
      reTrucoPlayed = true;
      gameState = 'reTrucoResponse';
      handleIaResponse('Re Truco');
    } else if (reTrucoPlayed && mouseX > 250 && mouseX < 330 && mouseY > 650 && mouseY < 690) {
      message = 'Vale Cuatro';
      gameState = 'valeCuatroResponse';
      handleIaResponse('Vale Cuatro');
    } else if (mouseX > 350 && mouseX < 430 && mouseY > 650 && mouseY < 690) {
      message = 'Ir al Mazo';
      handleIrAlMazo();
    }
  } else if (gameState === 'envidoResponse') {
    if (mouseX > 250 && mouseX < 330 && mouseY > 600 && mouseY < 640) {
      handlePlayerResponse('Quiero');
    } else if (mouseX > 350 && mouseX < 430 && mouseY > 600 && mouseY < 640) {
      handlePlayerResponse('No Quiero');
    }
  } else if (gameState === 'trucoResponse') {
    if (mouseX > 50 && mouseX < 130 && mouseY > 600 && mouseY < 640) {
      handlePlayerResponse('Quiero');
    } else if (mouseX > 150 && mouseX < 230 && mouseY > 600 && mouseY < 640) {
      handlePlayerResponse('Re Truco');
    } else if (mouseX > 250 && mouseX < 330 && mouseY > 600 && mouseY < 640) {
      handlePlayerResponse('No Quiero');
    }
  } else if (gameState === 'reTrucoResponse') {
    if (mouseX > 50 && mouseX < 130 && mouseY > 600 && mouseY < 640) {
      handlePlayerResponse('Quiero');
    } else if (mouseX > 150 && mouseX < 230 && mouseY > 600 && mouseY < 640) {
      handlePlayerResponse('Vale Cuatro');
    } else if (mouseX > 250 && mouseX < 330 && mouseY > 600 && mouseY < 640) {
      handlePlayerResponse('No Quiero');
    }
  } else if (gameState === 'valeCuatroResponse') {
    if (mouseX > 150 && mouseX < 230 && mouseY > 600 && mouseY < 640) {
      handlePlayerResponse('Quiero');
    } else if (mouseX > 250 && mouseX < 330 && mouseY > 600 && mouseY < 640) {
      handlePlayerResponse('No Quiero');
    }
  }
}

function playCard(card, player) {
  playedCards.push({ card, player });
  if (playedCards.length % 2 === 0) {
    evaluateRound();
  }
}

function evaluateRound() {
  let card1 = playedCards[playedCards.length - 2].card;
  let card2 = playedCards[playedCards.length - 1].card;
  let card1Name = `${card1.suit}${card1.value}`;
  let card2Name = `${card2.suit}${card2.value}`;
  
  if (cardHierarchy[card1Name] > cardHierarchy[card2Name]) {
    currentPlayer = playedCards[playedCards.length - 2].player;
    message = `Jugador ${currentPlayer} ganó la ronda`;
    if (currentPlayer === 1) roundsWonPlayer1++;
    else roundsWonPlayer2++;
  } else {
    currentPlayer = playedCards[playedCards.length - 1].player;
    message = `Jugador ${currentPlayer} ganó la ronda`;
    if (currentPlayer === 1) roundsWonPlayer1++;
    else roundsWonPlayer2++;
  }

  if (playedCards.length === 6) {
    evaluateGameWinner();
  }
}

function handleIaResponse(call) {
  if (call === 'Envido' || call === 'Real Envido' || call === 'Falta Envido') {
    let response = random(['Quiero', 'No Quiero']);
    message = response;
    if (response === 'Quiero') {
      evaluateEnvido();
    } else if (response === 'No Quiero') {
      envidoDeclined = true;
      pointsPlayer1 += (call === 'Real Envido' ? 2 : 1);
      gameState = 'selection';
    }
  } else if (call === 'Truco') {
    handleIaTruco();
  } else if (call === 'Re Truco') {
    handleIaReTruco();
  } else if (call === 'Vale Cuatro') {
    handleIaValeCuatro();
  }
}

function handleIaTruco() {
  let response = random(['Quiero', 'No Quiero', 'Re Truco']);
  message = response;
  if (response === 'Quiero') {
    gameState = 'selection'; // Allow card playing to continue
  } else if (response === 'No Quiero') {
    pointsPlayer1 += 1;
    resetHands();
    gameState = 'selection';
  } else if (response === 'Re Truco') {
    gameState = 'reTrucoResponse';
  }
}

function handleIaReTruco() {
  let response = random(['Quiero', 'No Quiero', 'Vale Cuatro']);
  message = response;
  if (response === 'Quiero') {
    gameState = 'selection'; // Allow card playing to continue
  } else if (response === 'No Quiero') {
    pointsPlayer1 += 2;
    resetHands();
    gameState = 'selection';
  } else if (response === 'Vale Cuatro') {
    gameState = 'valeCuatroResponse';
  }
}

function handleIaValeCuatro() {
  let response = random(['Quiero', 'No Quiero']);
  message = response;
  if (response === 'Quiero') {
    gameState = 'selection'; // Allow card playing to continue
  } else {
    pointsPlayer1 += 3;
    resetHands();
    gameState = 'selection';
  }
}

function handlePlayerResponse(response) {
  if (response === 'Quiero') {
    if (gameState === 'envidoResponse') {
      evaluateEnvido();
    } else if (gameState === 'trucoResponse') {
      gameState = 'selection'; // Allow card playing to continue
    } else if (gameState === 'reTrucoResponse') {
      gameState = 'selection'; // Allow card playing to continue
    } else if (gameState === 'valeCuatroResponse') {
      gameState = 'selection'; // Allow card playing to continue
    }
  } else if (response === 'No Quiero') {
    if (gameState === 'envidoResponse') {
      envidoDeclined = true;
      pointsPlayer2 += (message === 'Real Envido' ? 2 : 1);
    } else if (gameState === 'trucoResponse') {
      pointsPlayer2 += 1;
    } else if (gameState === 'reTrucoResponse') {
      pointsPlayer2 += 2;
    } else if (gameState === 'valeCuatroResponse') {
      pointsPlayer2 += 3;
    }
    resetHands();
    gameState = 'selection';
  } else if (response === 'Re Truco') {
    gameState = 'reTrucoResponse';
  } else if (response === 'Vale Cuatro') {
    gameState = 'selection'; // Allow card playing to continue
  }
}

function handleIrAlMazo() {
  if (currentPlayer === 1) {
    pointsPlayer2 += 1;
  } else {
    pointsPlayer1 += 1;
  }
  resetHands();
  gameState = 'selection';
  message = `Jugador ${currentPlayer} fue al mazo`;
}

function resetHands() {
  deck = [];
  player1Hand = [];
  player2Hand = [];
  playedCards = [];
  initializeDeck();
  shuffleDeck();
  dealCards();
  selectedCard = null;
  envidoPlayed = false;
  envidoDeclined = false;
  trucoPlayed = false;
  reTrucoPlayed = false;
  roundsWonPlayer1 = 0;
  roundsWonPlayer2 = 0;
}

function evaluateEnvido() {
  envidoPlayed = true;
  let envidoPlayer1 = calculateEnvido(player1Hand);
  let envidoPlayer2 = calculateEnvido(player2Hand);
  if (envidoPlayer1 > envidoPlayer2) {
    if (message === 'Real Envido') {
      pointsPlayer1 += 3;
    } else if (message === 'Falta Envido') {
      pointsPlayer1 += (30 - pointsPlayer1);
    } else {
      pointsPlayer1 += 2;
    }
    message = `Jugador 1 ganó el envido con ${envidoPlayer1} puntos`;
  } else {
    if (message === 'Real Envido') {
      pointsPlayer2 += 3;
    } else if (message === 'Falta Envido') {
      pointsPlayer2 += (30 - pointsPlayer2);
    } else {
      pointsPlayer2 += 2;
    }
    message = `Jugador 2 ganó el envido con ${envidoPlayer2} puntos`;
  }
  gameState = 'selection';
}

function calculateEnvido(hand) {
  let envidoPoints = 0;
  let suits = { 'oro': [], 'basto': [], 'espada': [], 'copa': [] };
  for (let card of hand) {
    if (card.value < 10) {
      suits[card.suit].push(card.value);
    }
  }
  for (let suit in suits) {
    if (suits[suit].length > 1) {
      suits[suit].sort((a, b) => b - a);
      let points = suits[suit][0] + suits[suit][1] + 20;
      envidoPoints = max(envidoPoints, points);
    }
  }
  return envidoPoints;
}

function handleIaTurn() {
  if (gameState === 'selection') {
    let cardToPlay = chooseCardForIa();
    playCard(cardToPlay, 2);
    player2Hand = player2Hand.filter(card => card !== cardToPlay);
    currentPlayer = 1;
  }
}

function chooseCardForIa() {
  return player2Hand[0];
}

function evaluateGameWinner() {
  if (roundsWonPlayer1 > roundsWonPlayer2) {
    if (!trucoPlayed) {
      pointsPlayer1 += 1;
    } else if (trucoPlayed && !reTrucoPlayed && !gameState.includes('Response')) {
      pointsPlayer1 += 2;
    } else if (reTrucoPlayed && !gameState.includes('valeCuatroResponse')) {
      pointsPlayer1 += 3;
    } else if (gameState.includes('valeCuatroResponse')) {
      pointsPlayer1 += 4;
    }
    message = "Jugador 1 ganó el truco";
  } else if (roundsWonPlayer2 > roundsWonPlayer1) {
    if (!trucoPlayed) {
      pointsPlayer2 += 1;
    } else if (trucoPlayed && !reTrucoPlayed && !gameState.includes('Response')) {
      pointsPlayer2 += 2;
    } else if (reTrucoPlayed && !gameState.includes('valeCuatroResponse')) {
      pointsPlayer2 += 3;
    } else if (gameState.includes('valeCuatroResponse')) {
      pointsPlayer2 += 4;
    }
    message = "Jugador 2 ganó el truco";
  } else {
    message = "Empate en las rondas";
  }

  if (playedCards.length === 6) {
    delayStarted = true;
    delayEndTime = millis() + 1900; // 2 segundos de retraso
  } else {
    resetHands();
  }
}
