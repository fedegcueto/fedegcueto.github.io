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
let envidoCalled = false;
let envidoDeclined = false;
let trucoPlayed = false;
let reTrucoPlayed = false;
let delayStarted = false;
let delayEndTime = 0;
let cardMoveSpeed = 10;
let messageAlpha = 0;
let shuffleAnimation = false;
let shuffleStartTime = 0;
let envidoType = null; // Added to track the type of Envido call

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
    shuffleAnimation = true;
    shuffleStartTime = millis();
  }
  
  if (shuffleAnimation) {
    drawShuffleAnimation();
    if (millis() - shuffleStartTime > 2000) {
      shuffleAnimation = false;
      resetHands();
    }
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
    let x = 50 + i * 100;
    let y = 700;
    let hover = mouseX > x && mouseX < x + 80 && mouseY > y && mouseY < y + 120;
    drawCard(player1Hand[i], x, y, i === selectedCard, hover);
  }
  for (let i = 0; i < player2Hand.length; i++) {
    drawCard({ suit: 'back', value: 0 }, 50 + i * 100, 50, false, false);
  }
}

function drawPlayedCards() {
  for (let i = 0; i < playedCards.length; i++) {
    let card = playedCards[i];
    if (card.moving) {
      card.x += (card.targetX - card.x) / cardMoveSpeed;
      card.y += (card.targetY - card.y) / cardMoveSpeed;
      if (dist(card.x, card.y, card.targetX, card.targetY) < 1) {
        card.moving = false;
      }
    }
    drawCard(card.card, card.x, card.y, false, false);
  }
}

function drawCard(card, x, y, highlighted, hover) {
  push();
  if (hover) {
    translate(x + 40, y + 60);
    scale(1.1);
    translate(-40, -60);
  } else {
    translate(x, y);
  }
  if (highlighted) {
    stroke(255, 0, 0);
    strokeWeight(3);
  } else {
    noStroke();
  }
  if (card.suit !== 'back') {
    let cardName = `${card.suit}${card.value}`;
    image(cardImages[cardName], 0, 0, 80, 120);
  } else {
    image(backImage, 0, 0, 80, 120);
  }
  pop();
}

function drawButtons() {
  if (gameState === 'selection') {
    if (!envidoCalled && !envidoDeclined && roundsWonPlayer1 === 0 && roundsWonPlayer2 === 0) {
      drawButton('Envido', 50, 600);
      drawButton('Real Envido', 150, 600);
      drawButton('Falta Envido', 250, 600);
    }
    if (!trucoPlayed) {
      drawButton('Truco', 50, 650);
    } else if (trucoPlayed && currentPlayer === 2 && !reTrucoPlayed) {
      drawButton('Re Truco', 150, 650);
    } else if (reTrucoPlayed && currentPlayer === 1) {
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
  if (mouseX > x && mouseX < x + 80 && mouseY > y && mouseY < y + 40) {
    fill(0, 0, 150);
  } else {
    fill(0, 0, 255);
  }
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
  fill(0, 0, 0, messageAlpha);
  textSize(24);
  textAlign(CENTER, CENTER);
  text(message, width / 2, height / 4 + 50);
  if (messageAlpha < 255) {
    messageAlpha += 5;
  }
}

function drawShuffleAnimation() {
  fill(255, 255, 255, 150);
  rect(0, 0, width, height);
  textSize(32);
  fill(0);
  textAlign(CENTER, CENTER);
  text("Barajando...", width / 2, height / 2);
  for (let i = 0; i < 10; i++) {
    let x = random(width);
    let y = random(height);
    let cardName = `${deck[i % deck.length].suit}${deck[i % deck.length].value}`;
    image(cardImages[cardName], x, y, 40, 60);
  }
}

// Fix: Add touchStarted function for mobile devices
function touchStarted() {
  mousePressed();
  return false; // prevent default
}

function mousePressed() {
  if (gameState === 'selection') {
    for (let i = 0; i < player1Hand.length; i++) {
      let x = 50 + i * 100;
      let y = 700;
      if (mouseX > x && mouseX < x + 80 && mouseY > y && mouseY < y + 120) {
        selectedCard = i;
        playCard(player1Hand[i], 1);
        player1Hand.splice(i, 1);
        currentPlayer = 2;
        handleIaTurn();
        return;
      }
    }
    if (!envidoCalled && !envidoDeclined && roundsWonPlayer1 === 0 && roundsWonPlayer2 === 0) {
      if (mouseX > 50 && mouseX < 130 && mouseY > 600 && mouseY < 640) {
        message = 'Envido';
        gameState = 'envidoResponse';
        envidoType = 'Envido'; // Track the Envido type
        handleIaResponse('Envido');
      } else if (mouseX > 150 && mouseX < 230 && mouseY > 600 && mouseY < 640) {
        message = 'Real Envido';
        gameState = 'envidoResponse';
        envidoType = 'Real Envido'; // Track the Envido type
        handleIaResponse('Real Envido');
      } else if (mouseX > 250 && mouseX < 330 && mouseY > 600 && mouseY < 640) {
        message = 'Falta Envido';
        gameState = 'envidoResponse';
        envidoType = 'Falta Envido'; // Track the Envido type
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
  let cardMove = {
    card: card,
    player: player,
    x: player === 1 ? 50 + selectedCard * 100 : 50 + player2Hand.indexOf(card) * 100,
    y: player === 1 ? 700 : 50,
    targetX: player === 1 ? width / 2 - 100 : width / 2 + 20,
    targetY: height / 2 - 60,
    moving: true
  };
  playedCards.push(cardMove);
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

// Maneja la respuesta de la IA para el Truco y Envido
function handleIaResponse(call) {
  if (call === 'Envido' || call === 'Real Envido' || call === 'Falta Envido') {
    let response = decideEnvidoResponse();
    message = response;
    if (response === 'Quiero') {
      evaluateEnvido();
    } else if (response === 'No Quiero') {
      envidoDeclined = true;
      pointsPlayer1 += (call === 'Real Envido' ? 3 : (call === 'Falta Envido' ? (30 - pointsPlayer1) : 1));
      gameState = 'selection';
      envidoCalled = true; // Mark envido as called
    }
  } else if (call === 'Truco') {
    handleIaTruco();
  } else if (call === 'Re Truco') {
    handleIaReTruco();
  } else if (call === 'Vale Cuatro') {
    handleIaValeCuatro();
  }
}

function decideEnvidoResponse() {
  // Mejora de la lógica de respuesta de envido
  let envidoPlayer1 = calculateEnvido(player1Hand);
  let envidoPlayer2 = calculateEnvido(player2Hand);
  if (envidoPlayer2 >= envidoPlayer1) {
    return 'Quiero';
  }
  return random(['Quiero', 'No Quiero']);
}

// Función para manejar la respuesta de la IA al Truco
function handleIaTruco() {
  let response = decideTrucoResponse();
  message = response;
  if (response === 'Quiero') {
    gameState = 'selection'; // Continuar con el juego
  } else if (response === 'No Quiero') {
    pointsPlayer1 += 1;
    resetHands();
    gameState = 'selection';
  } else if (response === 'Re Truco') {
    gameState = 'reTrucoResponse';
  }
}

function decideTrucoResponse() {
  // Mejora de la lógica de respuesta de truco
  let strongCards = player2Hand.filter(card => cardHierarchy[`${card.suit}${card.value}`] >= 10).length;
  if (strongCards > 1) {
    return 'Quiero';
  } else if (strongCards === 1) {
    return random(['Quiero', 'Re Truco']);
  }
  return 'No Quiero';
}

// Función para manejar la respuesta de la IA al Re Truco
function handleIaReTruco() {
  let response = decideReTrucoResponse();
  message = response;
  if (response === 'Quiero') {
    gameState = 'selection'; // Continuar con el juego
  } else if (response === 'No Quiero') {
    pointsPlayer1 += 2; // Si no quiere, se otorgan 2 puntos al jugador que cantó Re Truco
    resetHands();
    gameState = 'selection';
  } else if (response === 'Vale Cuatro') {
    gameState = 'valeCuatroResponse';
  }
}

function decideReTrucoResponse() {
  // Mejora de la lógica de respuesta de re truco
  let strongCards = player2Hand.filter(card => cardHierarchy[`${card.suit}${card.value}`] >= 10).length;
  if (strongCards === 3) {
    return 'Quiero';
  } else if (strongCards === 2) {
    return random(['Quiero', 'Vale Cuatro']);
  }
  return 'No Quiero';
}

// Función para manejar la respuesta de la IA al Vale Cuatro
function handleIaValeCuatro() {
  let response = random(['Quiero', 'No Quiero']);
  message = response;
  if (response === 'Quiero') {
    gameState = 'selection'; // Continuar con el juego
  } else {
    pointsPlayer1 += 3; // Si no quiere, se otorgan 3 puntos al jugador que cantó Vale Cuatro
    resetHands();
    gameState = 'selection';
  }
}

// Maneja la respuesta del jugador
function handlePlayerResponse(response) {
  if (response === 'Quiero') {
    if (gameState === 'envidoResponse') {
      evaluateEnvido();
    } else if (gameState === 'trucoResponse') {
      gameState = 'selection'; // Continuar con el juego
    } else if (gameState === 'reTrucoResponse') {
      gameState = 'selection'; // Continuar con el juego
    } else if (gameState === 'valeCuatroResponse') {
      gameState = 'selection'; // Continuar con el juego
    }
  } else if (response === 'No Quiero') {
    if (gameState === 'envidoResponse') {
      envidoDeclined = true;
      pointsPlayer2 += (envidoType === 'Real Envido' ? 3 : (envidoType === 'Falta Envido' ? (30 - pointsPlayer2) : 1));
    } else if (gameState === 'trucoResponse') {
      pointsPlayer2 += 1;
    } else if (gameState === 'reTrucoResponse') {
      pointsPlayer2 += 2;
    } else if (gameState === 'valeCuatroResponse') {
      pointsPlayer2 += 3; // Si no se quiere, se otorgan 3 puntos al jugador que cantó Vale Cuatro
    }
    resetHands();
    gameState = 'selection';
    envidoCalled = true; // Mark envido as called
  } else if (response === 'Re Truco') {
    gameState = 'reTrucoResponse';
  } else if (response === 'Vale Cuatro') {
    gameState = 'selection'; // Continuar con el juego
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
  envidoCalled = false; // Reset envido called status
  envidoDeclined = false;
  trucoPlayed = false;
  reTrucoPlayed = false;
  roundsWonPlayer1 = 0;
  roundsWonPlayer2 = 0;
}

function evaluateEnvido() {
  envidoCalled = true; // Mark envido as called
  let envidoPlayer1 = calculateEnvido(player1Hand);
  let envidoPlayer2 = calculateEnvido(player2Hand);
  if (envidoPlayer1 > envidoPlayer2) {
    if (envidoType === 'Real Envido') {
      pointsPlayer1 += 3;
    } else if (envidoType === 'Falta Envido') {
      pointsPlayer1 += (30 - pointsPlayer1);
    } else {
      pointsPlayer1 += 2;
    }
    message = `Jugador 1 ganó el envido con ${envidoPlayer1} puntos`;
  } else {
    if (envidoType === 'Real Envido') {
      pointsPlayer2 += 3;
    } else if (envidoType === 'Falta Envido') {
      pointsPlayer2 += (30 - pointsPlayer2);
    } else {
      pointsPlayer2 += 2;
    }
    message = `Jugador 2 ganó el envido con ${envidoPlayer2} puntos`;
  }
  gameState = 'selection';
  envidoType = null; // Reset envido type
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

// Evalúa el ganador del juego y asigna los puntos correctamente
function evaluateGameWinner() {
  if (roundsWonPlayer1 > roundsWonPlayer2) {
    if (!trucoPlayed) {
      pointsPlayer1 += 1;
    } else if (trucoPlayed && !reTrucoPlayed) {
      pointsPlayer1 += 2;
    } else if (reTrucoPlayed && !gameState.includes('valeCuatroResponse')) {
      pointsPlayer1 += 3; // Asignar 3 puntos si se gana con Re Truco
    } else if (gameState.includes('valeCuatroResponse')) {
      pointsPlayer1 += 4; // Asignar 4 puntos si se gana con Vale Cuatro
    }
    message = "Jugador 1 ganó el truco";
  } else if (roundsWonPlayer2 > roundsWonPlayer1) {
    if (!trucoPlayed) {
      pointsPlayer2 += 1;
    } else if (trucoPlayed && !reTrucoPlayed) {
      pointsPlayer2 += 3;
    } else if (reTrucoPlayed && !gameState.includes('valeCuatroResponse')) {
      pointsPlayer2 += 3; // Asignar 3 puntos si se gana con Re Truco
    } else if (gameState.includes('valeCuatroResponse')) {
      pointsPlayer2 += 4; // Asignar 4 puntos si se gana con Vale Cuatro
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
