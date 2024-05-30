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
let envidoType = null;
let gameLog = [];
let logIndex = 0;
let replayMode = false;
let gallery = [];
let currentGalleryIndex = 0;
let galleryMode = false;

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
  createCanvas(555, 1222);
  initializeDeck();
  shuffleDeck();
  dealCards();
  createButtons();
  loadGallery();
}

function draw() {
  if (galleryMode) {
    displayGallery();
  } else {
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

    if (replayMode) {
      drawReplayControls();
    }
  }
}

function initializeDeck() {
  let suits = ['oro', 'basto', 'espada', 'copa'];
  let values = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  deck = [];
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ suit, value });
    }
  }
  logEvent('initializeDeck', { deck: [...deck] }, getCurrentGameState());
}

function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  logEvent('shuffleDeck', { deck: [...deck] }, getCurrentGameState());
}

function dealCards() {
  player1Hand = [];
  player2Hand = [];
  for (let i = 0; i < 3; i++) {
    player1Hand.push(deck.pop());
    player2Hand.push(deck.pop());
  }
  logEvent('dealCards', { player1Hand: [...player1Hand], player2Hand: [...player2Hand] }, getCurrentGameState());
}

function drawHands() {
  for (let i = 0; i < player1Hand.length; i++) {
    let x = width * 0.1 + i * (width * 0.25);
    let y = height * 0.8;
    let hover = mouseX > x && mouseX < x + (width * 0.2) && mouseY > y && mouseY < y + (height * 0.15);
    drawCard(player1Hand[i], x, y, i === selectedCard, hover);
  }
  for (let i = 0; i < player2Hand.length; i++) {
    drawCard({ suit: 'back', value: 0 }, width * 0.1 + i * (width * 0.25), height * 0.1, false, false);
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
    translate(x + (width * 0.1), y + (height * 0.075));
    scale(1.1);
    translate(-(width * 0.1), -(height * 0.075));
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
    image(cardImages[cardName], 0, 0, width * 0.2, height * 0.15);
  } else {
    image(backImage, 0, 0, width * 0.2, height * 0.15);
  }
  pop();
}

function drawButtons() {
  textSize(width * 0.05); 
  if (gameState === 'selection') {
    if (!envidoCalled && !envidoDeclined && roundsWonPlayer1 === 0 && roundsWonPlayer2 === 0) {
      drawButton('Envido', width * 0.05, height * 0.65);
      drawButton('Real Envido', width * 0.3, height * 0.65);
      drawButton('Falta Envido', width * 0.55, height * 0.65);
    }
    if (!trucoPlayed) {
      drawButton('Truco', width * 0.05, height * 0.72);
    } else if (trucoPlayed && currentPlayer === 2 && !reTrucoPlayed) {
      drawButton('Re Truco', width * 0.3, height * 0.72);
    } else if (reTrucoPlayed && currentPlayer === 1) {
      drawButton('Vale Cuatro', width * 0.55, height * 0.72);
    }
    drawButton('Ir al Mazo', width * 0.8, height * 0.72);
  } else if (gameState === 'envidoResponse') {
    drawButton('Quiero', width * 0.3, height * 0.65);
    drawButton('No Quiero', width * 0.55, height * 0.65);
  } else if (gameState === 'trucoResponse') {
    drawButton('Quiero', width * 0.05, height * 0.65);
    drawButton('Re Truco', width * 0.3, height * 0.65);
    drawButton('No Quiero', width * 0.55, height * 0.65);
  } else if (gameState === 'reTrucoResponse') {
    drawButton('Quiero', width * 0.05, height * 0.65);
    drawButton('Vale Cuatro', width * 0.3, height * 0.65);
    drawButton('No Quiero', width * 0.55, height * 0.65);
  } else if (gameState === 'valeCuatroResponse') {
    drawButton('Quiero', width * 0.3, height * 0.65);
    drawButton('No Quiero', width * 0.55, height * 0.65);
  }
}

function drawButton(label, x, y) {
  if (mouseX > x && mouseX < x + (width * 0.2) && mouseY > y && mouseY < y + (height * 0.07)) {
    fill(0, 0, 150);
  } else {
    fill(0, 0, 255);
  }
  rect(x, y, width * 0.2, height * 0.07);
  fill(255);
  textSize(width * 0.04);
  textAlign(CENTER, CENTER);
  text(label, x + (width * 0.1), y + (height * 0.035));
}

function drawPoints() {
  fill(255);
  textSize(width * 0.04);
  textAlign(LEFT, TOP);
  text(`Puntos Jugador 1: ${pointsPlayer1}`, width * 0.05, height * 0.01);
  text(`Puntos Jugador 2: ${pointsPlayer2}`, width * 0.05, height * 0.04);
}

function drawMessage() {
  fill(0, 0, 0, messageAlpha);
  textSize(width * 0.06);
  textAlign(CENTER, CENTER);
  text(message, width / 2, height / 3);
  if (messageAlpha < 255) {
    messageAlpha += 5;
  }
}

function drawShuffleAnimation() {
  fill(255, 255, 255, 150);
  rect(0, 0, width, height);
  textSize(width * 0.08);
  fill(0);
  textAlign(CENTER, CENTER);
  text("Barajando...", width / 2, height / 2);
  for (let i = 0; i < 10; i++) {
    let x = random(width);
    let y = random(height);
    let cardName = `${deck[i % deck.length].suit}${deck[i % deck.length].value}`;
    image(cardImages[cardName], x, y, width * 0.1, height * 0.15);
  }
}

function drawReplayControls() {
  drawButton('Next', width * 0.7, height * 0.9);
  drawButton('Back', width * 0.5, height * 0.9);
  drawButton('Return', width * 0.9, height * 0.9);
}

function touchStarted() {
  mousePressed();
  return false; 
}

function mousePressed() {
  if (galleryMode) {
    for (let i = 0; i < gallery.length; i++) {
      let x = width * 0.1;
      let y = height * 0.2 + i * (height * 0.1);
      if (mouseX > x && mouseX < x + (width * 0.8) && mouseY > y && mouseY < y + (height * 0.07)) {
        loadGameFromGallery(i);
        return;
      }
    }
  } else if (replayMode) {
    if (mouseX > width * 0.7 && mouseX < width * 0.9 && mouseY > height * 0.9 && mouseY < height * 0.97) {
      nextStep();
    } else if (mouseX > width * 0.5 && mouseX < width * 0.7 && mouseY > height * 0.9 && mouseY < height * 0.97) {
      previousStep();
    } else if (mouseX > width * 0.9 && mouseX < width * 1.0 && mouseY > height * 0.9 && mouseY < height * 0.97) {
      returnToGame();
    }
  } else if (gameState === 'selection') {
    for (let i = 0; i < player1Hand.length; i++) {
      let x = width * 0.1 + i * (width * 0.25);
      let y = height * 0.8;
      if (mouseX > x && mouseX < x + (width * 0.2) && mouseY > y && mouseY < y + (height * 0.15)) {
        selectedCard = i;
        playCard(player1Hand[i], 1);
        player1Hand.splice(i, 1);
        currentPlayer = 2;
        handleIaTurn();
        return;
      }
    }
    if (!envidoCalled && !envidoDeclined && roundsWonPlayer1 === 0 && roundsWonPlayer2 === 0) {
      if (mouseX > width * 0.05 && mouseX < width * 0.25 && mouseY > height * 0.65 && mouseY < height * 0.72) {
        message = 'Envido';
        gameState = 'envidoResponse';
        envidoType = 'Envido'; 
        handleIaResponse('Envido');
      } else if (mouseX > width * 0.3 && mouseX < width * 0.5 && mouseY > height * 0.65 && mouseY < height * 0.72) {
        message = 'Real Envido';
        gameState = 'envidoResponse';
        envidoType = 'Real Envido'; 
        handleIaResponse('Real Envido');
      } else if (mouseX > width * 0.55 && mouseX < width * 0.75 && mouseY > height * 0.65 && mouseY < height * 0.72) {
        message = 'Falta Envido';
        gameState = 'envidoResponse';
        envidoType = 'Falta Envido'; 
        handleIaResponse('Falta Envido');
      }
    }
    if (!trucoPlayed && mouseX > width * 0.05 && mouseX < width * 0.25 && mouseY > height * 0.72 && mouseY < height * 0.79) {
      message = 'Truco';
      trucoPlayed = true;
      gameState = 'trucoResponse';
      handleIaResponse('Truco');
    } else if (trucoPlayed && !reTrucoPlayed && mouseX > width * 0.3 && mouseX < width * 0.5 && mouseY > height * 0.72 && mouseY < height * 0.79) {
      message = 'Re Truco';
      reTrucoPlayed = true;
      gameState = 'reTrucoResponse';
      handleIaResponse('Re Truco');
    } else if (reTrucoPlayed && mouseX > width * 0.55 && mouseX < width * 0.75 && mouseY > height * 0.72 && mouseY < height * 0.79) {
      message = 'Vale Cuatro';
      gameState = 'valeCuatroResponse';
      handleIaResponse('Vale Cuatro');
    } else if (mouseX > width * 0.8 && mouseX < width * 0.95 && mouseY > height * 0.72 && mouseY < height * 0.79) {
      message = 'Ir al Mazo';
      handleIrAlMazo();
    }
  } else if (gameState === 'envidoResponse') {
    if (mouseX > width * 0.3 && mouseX < width * 0.5 && mouseY > height * 0.65 && mouseY < height * 0.72) {
      handlePlayerResponse('Quiero');
    } else if (mouseX > width * 0.55 && mouseX < width * 0.75 && mouseY > height * 0.65 && mouseY < height * 0.72) {
      handlePlayerResponse('No Quiero');
    }
  } else if (gameState === 'trucoResponse') {
    if (mouseX > width * 0.05 && mouseX < width * 0.25 && mouseY > height * 0.65 && mouseY < height * 0.72) {
      handlePlayerResponse('Quiero');
    } else if (mouseX > width * 0.3 && mouseX < width * 0.5 && mouseY > height * 0.65 && mouseY < height * 0.72) {
      handlePlayerResponse('Re Truco');
    } else if (mouseX > width * 0.55 && mouseX < width * 0.75 && mouseY > height * 0.65 && mouseY < height * 0.72) {
      handlePlayerResponse('No Quiero');
    }
  } else if (gameState === 'reTrucoResponse') {
    if (mouseX > width * 0.05 && mouseX < width * 0.25 && mouseY > height * 0.65 && mouseY < height * 0.72) {
      handlePlayerResponse('Quiero');
    } else if (mouseX > width * 0.3 && mouseX < width * 0.5 && mouseY > height * 0.65 && mouseY < height * 0.72) {
      handlePlayerResponse('Vale Cuatro');
    } else if (mouseX > width * 0.55 && mouseX < width * 0.75 && mouseY > height * 0.65 && mouseY < height * 0.72) {
      handlePlayerResponse('No Quiero');
    }
  } else if (gameState === 'valeCuatroResponse') {
    if (mouseX > width * 0.3 && mouseX < width * 0.5 && mouseY > height * 0.65 && mouseY < height * 0.72) {
      handlePlayerResponse('Quiero');
    } else if (mouseX > width * 0.55 && mouseX < width * 0.75 && mouseY > height * 0.65 && mouseY < height * 0.72) {
      handlePlayerResponse('No Quiero');
    }
  }
}

function playCard(card, player) {
  let cardMove = {
    card: card,
    player: player,
    x: player === 1 ? width * 0.1 + selectedCard * (width * 0.25) : width * 0.1 + player2Hand.indexOf(card) * (width * 0.25),
    y: player === 1 ? height * 0.8 : height * 0.1,
    targetX: player === 1 ? width / 2 - (width * 0.15) : width / 2 + (width * 0.05),
    targetY: height / 2 - (height * 0.075),
    moving: true
  };
  playedCards.push(cardMove);
  logEvent('playCard', { player, card }, getCurrentGameState());
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

  logEvent('evaluateRound', { roundWinner: currentPlayer, card1, card2 }, getCurrentGameState());

  if (playedCards.length === 6) {
    evaluateGameWinner();
  }
}

function handleIaResponse(call) {
  if (call === 'Envido' || call === 'Real Envido' || call === 'Falta Envido') {
    let response = decideEnvidoResponse();
    message = response;
    logEvent('handleIaResponse', { call, response }, getCurrentGameState());
    if (response === 'Quiero') {
      evaluateEnvido();
    } else if (response === 'No Quiero') {
      envidoDeclined = true;
      pointsPlayer1 += (call === 'Real Envido' ? 3 : (call === 'Falta Envido' ? (30 - pointsPlayer1) : 1));
      gameState = 'selection';
      envidoCalled = true; 
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
  let envidoPlayer1 = calculateEnvido(player1Hand);
  let envidoPlayer2 = calculateEnvido(player2Hand);
  if (envidoPlayer2 >= envidoPlayer1) {
    return 'Quiero';
  }
  return random(['Quiero', 'No Quiero']);
}

function handleIaTruco() {
  let response = decideTrucoResponse();
  message = response;
  logEvent('handleIaTruco', { response }, getCurrentGameState());
  if (response === 'Quiero') {
    gameState = 'selection'; 
  } else if (response === 'No Quiero') {
    pointsPlayer1 += 1;
    resetHands();
    gameState = 'selection';
  } else if (response === 'Re Truco') {
    gameState = 'reTrucoResponse';
  }
}

function decideTrucoResponse() {
  let strongCards = player2Hand.filter(card => cardHierarchy[`${card.suit}${card.value}`] >= 10).length;
  if (strongCards > 1) {
    return 'Quiero';
  } else if (strongCards === 1) {
    return random(['Quiero', 'Re Truco']);
  }
  return 'No Quiero';
}

function handleIaReTruco() {
  let response = decideReTrucoResponse();
  message = response;
  logEvent('handleIaReTruco', { response }, getCurrentGameState());
  if (response === 'Quiero') {
    gameState = 'selection'; 
  } else if (response === 'No Quiero') {
    pointsPlayer1 += 2;
    resetHands();
    gameState = 'selection';
  } else if (response === 'Vale Cuatro') {
    gameState = 'valeCuatroResponse';
  }
}

function decideReTrucoResponse() {
  let strongCards = player2Hand.filter(card => cardHierarchy[`${card.suit}${card.value}`] >= 10).length;
  if (strongCards === 3) {
    return 'Quiero';
  } else if (strongCards === 2) {
    return random(['Quiero', 'Vale Cuatro']);
  }
  return 'No Quiero';
}

function handleIaValeCuatro() {
  let response = random(['Quiero', 'No Quiero']);
  message = response;
  logEvent('handleIaValeCuatro', { response }, getCurrentGameState());
  if (response === 'Quiero') {
    gameState = 'selection'; 
  } else {
    pointsPlayer1 += 4;
    resetHands();
    gameState = 'selection';
  }
}

function handlePlayerResponse(response) {
  logEvent('handlePlayerResponse', { response }, getCurrentGameState());
  if (response === 'Quiero') {
    if (gameState === 'envidoResponse') {
      evaluateEnvido();
    } else if (gameState === 'trucoResponse') {
      gameState = 'selection'; 
    } else if (gameState === 'reTrucoResponse') {
      gameState = 'selection'; 
    } else if (gameState === 'valeCuatroResponse') {
      gameState = 'selection'; 
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
      pointsPlayer2 += 4;
    }
    resetHands();
    gameState = 'selection';
    envidoCalled = true; 
  } else if (response === 'Re Truco') {
    gameState = 'reTrucoResponse';
  } else if (response === 'Vale Cuatro') {
    gameState = 'valeCuatroResponse'; 
  }
}

function handleIrAlMazo() {
  if (currentPlayer === 1) {
    pointsPlayer2 += 1;
  } else {
    pointsPlayer1 += 1;
  }
  logEvent('handleIrAlMazo', { currentPlayer }, getCurrentGameState());
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
  envidoCalled = false; 
  envidoDeclined = false;
  trucoPlayed = false;
  reTrucoPlayed = false;
  roundsWonPlayer1 = 0;
  roundsWonPlayer2 = 0;
  logEvent('resetHands', {}, getCurrentGameState());
}

function evaluateEnvido() {
  envidoCalled = true; 
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
  logEvent('evaluateEnvido', { envidoPlayer1, envidoPlayer2, envidoType }, getCurrentGameState());
  gameState = 'selection';
  envidoType = null; 
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
    logEvent('handleIaTurn', { cardToPlay }, getCurrentGameState());
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
    } else if (trucoPlayed && !reTrucoPlayed) {
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
    } else if (trucoPlayed && !reTrucoPlayed) {
      pointsPlayer2 += 3;
    } else if (reTrucoPlayed && !gameState.includes('valeCuatroResponse')) {
      pointsPlayer2 += 3; 
    } else if (gameState.includes('valeCuatroResponse')) {
      pointsPlayer2 += 4; 
    }
    message = "Jugador 2 ganó el truco";
  } else {
    message = "Empate en las rondas";
  }
  logEvent('evaluateGameWinner', { roundsWonPlayer1, roundsWonPlayer2 }, getCurrentGameState());
  if (playedCards.length === 6) {
    delayStarted = true;
    delayEndTime = millis() + 1900; 
  } else {
    resetHands();
  }
}

function getCurrentGameState() {
  return {
    currentPlayer,
    pointsPlayer1,
    pointsPlayer2,
    roundsWonPlayer1,
    roundsWonPlayer2,
    player1Hand: [...player1Hand],
    player2Hand: [...player2Hand],
    playedCards: [...playedCards],
    envidoCalled,
    envidoDeclined,
    trucoPlayed,
    reTrucoPlayed
  };
}

function logEvent(action, details, gameState) {
  gameLog.push({
    action,
    details,
    gameState: { ...gameState },
    timestamp: new Date().toISOString()
  });
}

function endGame() {
  let title = prompt("Enter a title for this game:");
  saveLog(title);
  loadGallery();
}

function saveLog(title) {
  let logData = JSON.stringify({ title, log: gameLog });
  let storedGames = JSON.parse(localStorage.getItem('trumpGames')) || [];
  storedGames.push(logData);
  localStorage.setItem('trumpGames', JSON.stringify(storedGames));
}

function loadLog(logData) {
  let data = JSON.parse(logData);
  gameLog = data.log;
  replayMode = true;
  logIndex = 0;
  restoreGameState(gameLog[0].gameState); // Initialize the state for the first log entry
}

function nextStep() {
  if (logIndex < gameLog.length - 1) {
    logIndex++;
    replayGame();
  }
}

function previousStep() {
  if (logIndex > 0) {
    logIndex--;
    replayGame();
  }
}

function returnToGame() {
  replayMode = false;
  logIndex = 0;
  restoreGameState(gameLog[0].gameState);
}

function replayGame() {
  if (logIndex < gameLog.length) {
    let logEntry = gameLog[logIndex];
    let { action, details, gameState } = logEntry;
    restoreGameState(gameState);
    switch (action) {
      case 'initializeDeck':
        initializeDeck();
        break;
      case 'shuffleDeck':
        shuffleDeck();
        break;
      case 'dealCards':
        dealCards();
        break;
      case 'playCard':
        playCard(details.card, details.player);
        break;
      case 'evaluateRound':
        evaluateRound();
        break;
      case 'handleIaResponse':
        handleIaResponse(details.call);
        break;
      case 'handlePlayerResponse':
        handlePlayerResponse(details.response);
        break;
      case 'handleIaTurn':
        handleIaTurn();
        break;
      case 'handleIrAlMazo':
        handleIrAlMazo();
        break;
      case 'resetHands':
        resetHands();
        break;
      case 'evaluateGameWinner':
        evaluateGameWinner();
        break;
      case 'evaluateEnvido':
        evaluateEnvido();
        break;
    }
  }
}

function restoreGameState(state) {
  currentPlayer = state.currentPlayer;
  pointsPlayer1 = state.pointsPlayer1;
  pointsPlayer2 = state.pointsPlayer2;
  roundsWonPlayer1 = state.roundsWonPlayer1;
  roundsWonPlayer2 = state.roundsWonPlayer2;
  player1Hand = state.player1Hand;
  player2Hand = state.player2Hand;
  playedCards = state.playedCards;
  envidoCalled = state.envidoCalled;
  envidoDeclined = state.envidoDeclined;
  trucoPlayed = state.trucoPlayed;
  reTrucoPlayed = state.reTrucoPlayed;
}

function createButtons() {
  let saveButton = createButton('Save Log');
  saveButton.position(10, 10);
  saveButton.mousePressed(endGame);

  let galleryButton = createButton('View Gallery');
  galleryButton.position(90, 10);
  galleryButton.mousePressed(() => {
    galleryMode = true;
  });
}

function loadGallery() {
  let storedGames = JSON.parse(localStorage.getItem('trumpGames')) || [];
  gallery = storedGames.map(data => JSON.parse(data));
}

function displayGallery() {
  background(200);
  textSize(32);
  fill(0);
  textAlign(CENTER, CENTER);
  text('Gallery', width / 2, height * 0.1);

  textSize(24);
  textAlign(LEFT, CENTER);
  for (let i = 0; i < gallery.length; i++) {
    let x = width * 0.1;
    let y = height * 0.2 + i * (height * 0.1);
    text(gallery[i].title, x, y);
    noFill();
    rect(x, y - (height * 0.035), width * 0.8, height * 0.07);
  }
}

function loadGameFromGallery(index) {
  let selectedGame = gallery[index];
  loadLog(JSON.stringify(selectedGame));
  galleryMode = false;
}
