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
  createCanvas(windowWidth, windowHeight); // Dynamic canvas size
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
  let cardWidth = width / 10;
  let cardHeight = cardWidth * 1.5;
  
  for (let i = 0; i < player1Hand.length; i++) {
    let x = width * 0.1 + i * cardWidth * 1.2;
    let y = height * 0.75;
    let hover = mouseX > x && mouseX < x + cardWidth && mouseY > y && mouseY < y + cardHeight;
    drawCard(player1Hand[i], x, y, i === selectedCard, hover);
  }
  for (let i = 0; i < player2Hand.length; i++) {
    drawCard({ suit: 'back', value: 0 }, width * 0.1 + i * cardWidth * 1.2, height * 0.05, false, false);
  }
}

function drawPlayedCards() {
  let cardWidth = width / 10;
  let cardHeight = cardWidth * 1.5;

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
  let cardWidth = width / 10;
  let cardHeight = cardWidth * 1.5;
  
  push();
  if (hover) {
    translate(x + cardWidth / 2, y + cardHeight / 2);
    scale(1.1);
    translate(-cardWidth / 2, -cardHeight / 2);
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
    image(cardImages[cardName], 0, 0, cardWidth, cardHeight);
  } else {
    image(backImage, 0, 0, cardWidth, cardHeight);
  }
  pop();
}

function drawButtons() {
  let buttonWidth = width / 5;
  let buttonHeight = buttonWidth / 3;
  let buttonY = height * 0.85;
  let buttonSpacing = buttonWidth * 0.1;
  
  if (gameState === 'selection') {
    if (!envidoCalled && !envidoDeclined && roundsWonPlayer1 === 0 && roundsWonPlayer2 === 0) {
      drawButton('Envido', width * 0.1, buttonY);
      drawButton('Real Envido', width * 0.1 + buttonWidth + buttonSpacing, buttonY);
      drawButton('Falta Envido', width * 0.1 + 2 * (buttonWidth + buttonSpacing), buttonY);
    }
    if (!trucoPlayed) {
      drawButton('Truco', width * 0.1, buttonY + buttonHeight + buttonSpacing);
    } else if (trucoPlayed && currentPlayer === 2 && !reTrucoPlayed) {
      drawButton('Re Truco', width * 0.1 + buttonWidth + buttonSpacing, buttonY + buttonHeight + buttonSpacing);
    } else if (reTrucoPlayed && currentPlayer === 1) {
      drawButton('Vale Cuatro', width * 0.1 + 2 * (buttonWidth + buttonSpacing), buttonY + buttonHeight + buttonSpacing);
    }
    drawButton('Ir al Mazo', width * 0.1 + 3 * (buttonWidth + buttonSpacing), buttonY + buttonHeight + buttonSpacing);
  } else if (gameState === 'envidoResponse') {
    drawButton('Quiero', width * 0.1 + buttonWidth + buttonSpacing, buttonY);
    drawButton('No Quiero', width * 0.1 + 2 * (buttonWidth + buttonSpacing), buttonY);
  } else if (gameState === 'trucoResponse') {
    drawButton('Quiero', width * 0.1, buttonY);
    drawButton('Re Truco', width * 0.1 + buttonWidth + buttonSpacing, buttonY);
    drawButton('No Quiero', width * 0.1 + 2 * (buttonWidth + buttonSpacing), buttonY);
  } else if (gameState === 'reTrucoResponse') {
    drawButton('Quiero', width * 0.1, buttonY);
    drawButton('Vale Cuatro', width * 0.1 + buttonWidth + buttonSpacing, buttonY);
    drawButton('No Quiero', width * 0.1 + 2 * (buttonWidth + buttonSpacing), buttonY);
  } else if (gameState === 'valeCuatroResponse') {
    drawButton('Quiero', width * 0.1 + buttonWidth + buttonSpacing, buttonY);
    drawButton('No Quiero', width * 0.1 + 2 * (buttonWidth + buttonSpacing), buttonY);
  }
}

function drawButton(label, x, y) {
  let buttonWidth = width / 5;
  let buttonHeight = buttonWidth / 3;
  
  if (mouseX > x && mouseX < x + buttonWidth && mouseY > y && mouseY < y + buttonHeight) {
    fill(0, 0, 150);
  } else {
    fill(0, 0, 255);
  }
  rect(x, y, buttonWidth, buttonHeight, 5);
  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
  text(label, x + buttonWidth / 2, y + buttonHeight / 2);
}

function drawPoints() {
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text(`Punten Speler 1: ${pointsPlayer1}`, 10, 10);
  text(`Punten Speler 2: ${pointsPlayer2}`, 10, 30);
}

function drawMessage() {
  fill(0, 0, 0, messageAlpha);
  textSize(24);
  textAlign(CENTER, CENTER);
  text(message, width / 2, height * 0.5);
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
  text("Schudden...", width / 2, height / 2);
  for (let i = 0; i < 10; i++) {
    let x = random(width);
    let y = random(height);
    let cardName = `${deck[i % deck.length].suit}${deck[i % deck.length].value}`;
    image(cardImages[cardName], x, y, width / 20, height / 12);
  }
}

function touchStarted() {
  mousePressed();
  return false; // prevent default
}

function mousePressed() {
  let cardWidth = width / 10;
  let cardHeight = cardWidth * 1.5;
  let buttonWidth = width / 5;
  let buttonHeight = buttonWidth / 3;
  let buttonY = height * 0.85;
  let buttonSpacing = buttonWidth * 0.1;
  
  if (gameState === 'selection') {
    for (let i = 0; i < player1Hand.length; i++) {
      let x = width * 0.1 + i * cardWidth * 1.2;
      let y = height * 0.75;
      if (mouseX > x && mouseX < x + cardWidth && mouseY > y && mouseY < y + cardHeight) {
        selectedCard = i;
        playCard(player1Hand[i], 1);
        player1Hand.splice(i, 1);
        currentPlayer = 2;
        handleIaTurn();
        return;
      }
    }
    if (!envidoCalled && !envidoDeclined && roundsWonPlayer1 === 0 && roundsWonPlayer2 === 0) {
      if (mouseX > width * 0.1 && mouseX < width * 0.1 + buttonWidth && mouseY > buttonY && mouseY < buttonY + buttonHeight) {
        message = 'Envido';
        gameState = 'envidoResponse';
        envidoType = 'Envido';
        handleIaResponse('Envido');
      } else if (mouseX > width * 0.1 + buttonWidth + buttonSpacing && mouseX < width * 0.1 + 2 * buttonWidth + buttonSpacing && mouseY > buttonY && mouseY < buttonY + buttonHeight) {
        message = 'Real Envido';
        gameState = 'envidoResponse';
        envidoType = 'Real Envido';
        handleIaResponse('Real Envido');
      } else if (mouseX > width * 0.1 + 2 * buttonWidth + 2 * buttonSpacing && mouseX < width * 0.1 + 3 * buttonWidth + 2 * buttonSpacing && mouseY > buttonY && mouseY < buttonY + buttonHeight) {
        message = 'Falta Envido';
        gameState = 'envidoResponse';
        envidoType = 'Falta Envido';
        handleIaResponse('Falta Envido');
      }
    }
    if (!trucoPlayed && mouseX > width * 0.1 && mouseX < width * 0.1 + buttonWidth && mouseY > buttonY + buttonHeight + buttonSpacing && mouseY < buttonY + 2 * buttonHeight + buttonSpacing) {
      message = 'Truco';
      trucoPlayed = true;
      gameState = 'trucoResponse';
      handleIaResponse('Truco');
    } else if (trucoPlayed && !reTrucoPlayed && mouseX > width * 0.1 + buttonWidth + buttonSpacing && mouseX < width * 0.1 + 2 * buttonWidth + buttonSpacing && mouseY > buttonY + buttonHeight + buttonSpacing && mouseY < buttonY + 2 * buttonHeight + buttonSpacing) {
      message = 'Re Truco';
      reTrucoPlayed = true;
      gameState = 'reTrucoResponse';
      handleIaResponse('Re Truco');
    } else if (reTrucoPlayed && mouseX > width * 0.1 + 2 * buttonWidth + 2 * buttonSpacing && mouseX < width * 0.1 + 3 * buttonWidth + 2 * buttonSpacing && mouseY > buttonY + buttonHeight + buttonSpacing && mouseY < buttonY + 2 * buttonHeight + buttonSpacing) {
      message = 'Vale Cuatro';
      gameState = 'valeCuatroResponse';
      handleIaResponse('Vale Cuatro');
    } else if (mouseX > width * 0.1 + 3 * buttonWidth + 3 * buttonSpacing && mouseX < width * 0.1 + 4 * buttonWidth + 3 * buttonSpacing && mouseY > buttonY + buttonHeight + buttonSpacing && mouseY < buttonY + 2 * buttonHeight + buttonSpacing) {
      message = 'Ir al Mazo';
      handleIrAlMazo();
    }
  } else if (gameState === 'envidoResponse') {
    if (mouseX > width * 0.1 + buttonWidth + buttonSpacing && mouseX < width * 0.1 + 2 * buttonWidth + buttonSpacing && mouseY > buttonY && mouseY < buttonY + buttonHeight) {
      handlePlayerResponse('Quiero');
    } else if (mouseX > width * 0.1 + 2 * buttonWidth + 2 * buttonSpacing && mouseX < width * 0.1 + 3 * buttonWidth + 2 * buttonSpacing && mouseY > buttonY && mouseY < buttonY + buttonHeight) {
      handlePlayerResponse('No Quiero');
    }
  } else if (gameState === 'trucoResponse') {
    if (mouseX > width * 0.1 && mouseX < width * 0.1 + buttonWidth && mouseY > buttonY && mouseY < buttonY + buttonHeight) {
      handlePlayerResponse('Quiero');
    } else if (mouseX > width * 0.1 + buttonWidth + buttonSpacing && mouseX < width * 0.1 + 2 * buttonWidth + buttonSpacing && mouseY > buttonY && mouseY < buttonY + buttonHeight) {
      handlePlayerResponse('Re Truco');
    } else if (mouseX > width * 0.1 + 2 * buttonWidth + 2 * buttonSpacing && mouseX < width * 0.1 + 3 * buttonWidth + 2 * buttonSpacing && mouseY > buttonY && mouseY < buttonY + buttonHeight) {
      handlePlayerResponse('No Quiero');
    }
  } else if (gameState === 'reTrucoResponse') {
    if (mouseX > width * 0.1 && mouseX < width * 0.1 + buttonWidth && mouseY > buttonY && mouseY < buttonY + buttonHeight) {
      handlePlayerResponse('Quiero');
    } else if (mouseX > width * 0.1 + buttonWidth + buttonSpacing && mouseX < width * 0.1 + 2 * buttonWidth + buttonSpacing && mouseY > buttonY && mouseY < buttonY + buttonHeight) {
      handlePlayerResponse('Vale Cuatro');
    } else if (mouseX > width * 0.1 + 2 * buttonWidth + 2 * buttonSpacing && mouseX < width * 0.1 + 3 * buttonWidth + 2 * buttonSpacing && mouseY > buttonY && mouseY < buttonY + buttonHeight) {
      handlePlayerResponse('No Quiero');
    }
  } else if (gameState === 'valeCuatroResponse') {
    if (mouseX > width * 0.1 + buttonWidth + buttonSpacing && mouseX < width * 0.1 + 2 * buttonWidth + buttonSpacing && mouseY > buttonY && mouseY < buttonY + buttonHeight) {
      handlePlayerResponse('Quiero');
    } else if (mouseX > width * 0.1 + 2 * buttonWidth + 2 * buttonSpacing && mouseX < width * 0.1 + 3 * buttonWidth + 2 * buttonSpacing && mouseY > buttonY && mouseY < buttonY + buttonHeight) {
      handlePlayerResponse('No Quiero');
    }
  }
}

function playCard(card, player) {
  let cardWidth = width / 10;
  let cardHeight = cardWidth * 1.5;
  
  let cardMove = {
    card: card,
    player: player,
    x: player === 1 ? width * 0.1 + selectedCard * cardWidth * 1.2 : width * 0.1 + player2Hand.indexOf(card) * cardWidth * 1.2,
    y: player === 1 ? height * 0.75 : height * 0.05,
    targetX: player === 1 ? width / 2 - cardWidth : width / 2 + 20,
    targetY: height / 2 - cardHeight / 2,
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
    message = `Speler ${currentPlayer} won de ronde`;
    if (currentPlayer === 1) roundsWonPlayer1++;
    else roundsWonPlayer2++;
  } else {
    currentPlayer = playedCards[playedCards.length - 1].player;
    message = `Speler ${currentPlayer} won de ronde`;
    if (currentPlayer === 1) roundsWonPlayer1++;
    else roundsWonPlayer2++;
  }

  if (playedCards.length === 6) {
    evaluateGameWinner();
  }
}

// Handle the IA response for Truco and Envido
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
  // Improved envido response logic
  let envidoPlayer1 = calculateEnvido(player1Hand);
  let envidoPlayer2 = calculateEnvido(player2Hand);
  if (envidoPlayer2 >= envidoPlayer1) {
    return 'Quiero';
  }
  return random(['Quiero', 'No Quiero']);
}

// Handle the IA response for Truco
function handleIaTruco() {
  let response = decideTrucoResponse();
  message = response;
  if (response === 'Quiero') {
    gameState = 'selection'; // Continue with the game
  } else if (response === 'No Quiero') {
    pointsPlayer1 += 1;
    resetHands();
    gameState = 'selection';
  } else if (response === 'Re Truco') {
    gameState = 'reTrucoResponse';
  }
}

function decideTrucoResponse() {
  // Improved truco response logic
  let strongCards = player2Hand.filter(card => cardHierarchy[`${card.suit}${card.value}`] >= 10).length;
  if (strongCards > 1) {
    return 'Quiero';
  } else if (strongCards === 1) {
    return random(['Quiero', 'Re Truco']);
  }
  return 'No Quiero';
}

// Handle the IA response for Re Truco
function handleIaReTruco() {
  let response = decideReTrucoResponse();
  message = response;
  if (response === 'Quiero') {
    gameState = 'selection'; // Continue with the game
  } else if (response === 'No Quiero') {
    pointsPlayer1 += 2; // If not wanted, 2 points are awarded to the player who sang Re Truco
    resetHands();
    gameState = 'selection';
  } else if (response === 'Vale Cuatro') {
    gameState = 'valeCuatroResponse';
  }
}

function decideReTrucoResponse() {
  // Improved re truco response logic
  let strongCards = player2Hand.filter(card => cardHierarchy[`${card.suit}${card.value}`] >= 10).length;
  if (strongCards === 3) {
    return 'Quiero';
  } else if (strongCards === 2) {
    return random(['Quiero', 'Vale Cuatro']);
  }
  return 'No Quiero';
}

// Handle the IA response for Vale Cuatro
function handleIaValeCuatro() {
  let response = random(['Quiero', 'No Quiero']);
  message = response;
  if (response === 'Quiero') {
    gameState = 'selection'; // Continue with the game
  } else {
    pointsPlayer1 += 3; // If not wanted, 3 points are awarded to the player who sang Vale Cuatro
    resetHands();
    gameState = 'selection';
  }
}

// Handle the player's response
function handlePlayerResponse(response) {
  if (response === 'Quiero') {
    if (gameState === 'envidoResponse') {
      evaluateEnvido();
    } else if (gameState === 'trucoResponse') {
      gameState = 'selection'; // Continue with the game
    } else if (gameState === 'reTrucoResponse') {
      gameState = 'selection'; // Continue with the game
    } else if (gameState === 'valeCuatroResponse') {
      gameState = 'selection'; // Continue with the game
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
      pointsPlayer2 += 3; // If not wanted, 3 points are awarded to the player who sang Vale Cuatro
    }
    resetHands();
    gameState = 'selection';
    envidoCalled = true; // Mark envido as called
  } else if (response === 'Re Truco') {
    gameState = 'reTrucoResponse';
  } else if (response === 'Vale Cuatro') {
    gameState = 'selection'; // Continue with the game
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
  message = `Speler ${currentPlayer} ging naar de stapel`;
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
    message = `Speler 1 won de envido met ${envidoPlayer1} punten`;
  } else {
    if (envidoType === 'Real Envido') {
      pointsPlayer2 += 3;
    } else if (envidoType === 'Falta Envido') {
      pointsPlayer2 += (30 - pointsPlayer2);
    } else {
      pointsPlayer2 += 2;
    }
    message = `Speler 2 won de envido met ${envidoPlayer2} punten`;
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

// Evaluate the game winner and assign points correctly
function evaluateGameWinner() {
  if (roundsWonPlayer1 > roundsWonPlayer2) {
    if (!trucoPlayed) {
      pointsPlayer1 += 1;
    } else if (trucoPlayed && !reTrucoPlayed) {
      pointsPlayer1 += 2;
    } else if (reTrucoPlayed && !gameState.includes('valeCuatroResponse')) {
      pointsPlayer1 += 3; // Assign 3 points if won with Re Truco
    } else if (gameState.includes('valeCuatroResponse')) {
      pointsPlayer1 += 4; // Assign 4 points if won with Vale Cuatro
    }
    message = "Speler 1 won de truco";
  } else if (roundsWonPlayer2 > roundsWonPlayer1) {
    if (!trucoPlayed) {
      pointsPlayer2 += 1;
    } else if (trucoPlayed && !reTrucoPlayed) {
      pointsPlayer2 += 3;
    } else if (reTrucoPlayed && !gameState.includes('valeCuatroResponse')) {
      pointsPlayer2 += 3; // Assign 3 points if won with Re Truco
    } else if (gameState.includes('valeCuatroResponse')) {
      pointsPlayer2 += 4; // Assign 4 points if won with Vale Cuatro
    }
    message = "Speler 2 won de truco";
  } else {
    message = "Gelijkspel in de rondes";
  }

  if (playedCards.length === 6) {
    delayStarted = true;
    delayEndTime = millis() + 1900; // 2 seconds delay
  } else {
    resetHands();
  }
}
