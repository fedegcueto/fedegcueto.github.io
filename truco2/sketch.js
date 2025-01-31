let game;
const cardImages = {};
let backImage;
let tableImage;

// Added loadImage declaration to fix the undeclared variable error.
let loadImage;

function preload() {
  loadImage = this.loadImage; // Assign loadImage function from p5.js
  tableImage = loadImage("assets/background.jpg");
  backImage = loadImage("assets/back.png");
  const suits = ["oro", "copa", "espada", "basto"];
  const ranks = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  for (const suit of suits) {
    for (const rank of ranks) {
      cardImages[`${suit}_${rank}`] = loadImage(`assets/${suit}${rank}.png`);
    }
  }
}

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.style("display", "block");
  game = new TrucoGame();
}

function draw() {
  game.display();
}

function mousePressed() {
  if (game) {
    game.handleMousePressed();
  }
}

function mouseMoved() {
  if (game) {
    game.handleMouseMoved();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (game) {
    game.updateResponsiveLayout();
  }
}

class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    // Inicializar con valores por defecto, se actualizarán en updateCardSize
    this.width = 100;
    this.height = 150;
    this.angle = 0;
    this.targetAngle = 0;
    this.scale = 1;
    this.targetScale = 1;
    this.isHovered = false;
  }

  updateCardSize(newWidth, newHeight) {
    this.width = newWidth;
    this.height = newHeight;
  }

  display(x, y, faceDown = false) {
      this.targetX = x;
      this.targetY = y;
      this.x = lerp(this.x, this.targetX, 0.1);
      this.y = lerp(this.y, this.targetY, 0.1);
      this.angle = lerp(this.angle, this.targetAngle, 0.1);
      this.scale = lerp(this.scale, this.targetScale, 0.1);

    push();
    translate(this.x + this.width / 2, this.y + this.height / 2);
    rotate(this.angle);
    scale(this.scale);
    if (faceDown) {
      image(backImage, -this.width / 2, -this.height / 2, this.width, this.height);
    } else {
      image(cardImages[`${this.suit}_${this.rank}`], -this.width / 2, -this.height / 2, this.width, this.height);
    }
    pop();
  }

  isClicked() {
    const scaledWidth = this.width * this.scale;
    const scaledHeight = this.height * this.scale;
    const inputX = touches.length > 0 ? touches[0].x : mouseX;
    const inputY = touches.length > 0 ? touches[0].y : mouseY;
    return inputX > this.x && inputX < this.x + scaledWidth && 
           inputY > this.y && inputY < this.y + scaledHeight;
  }

  setHovered(isHovered) {
    this.isHovered = isHovered;
      this.targetScale = isHovered ? 1.1 : 1;
    }

  getPower() {
    if (this.rank === 1 && this.suit === "espada") return 14;
    if (this.rank === 1 && this.suit === "basto") return 13;
    if (this.rank === 7 && this.suit === "espada") return 12;
    if (this.rank === 7 && this.suit === "oro") return 11;

    const rankPower = {
      3: 10, 2: 9, 1: 8, 12: 7, 11: 6, 10: 5, 7: 4, 6: 3, 5: 2, 4: 1,
    };
    return rankPower[this.rank] || 0;
  }

  compareWith(other) {
    return this.getPower() - other.getPower();
  }

  toString() {
    return `${this.rank} de ${this.suit}`;
  }
}

class Deck {
  constructor() {
    this.cards = [];
    const suits = ["oro", "copa", "espada", "basto"];
    const ranks = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
    for (const suit of suits) {
      for (const rank of ranks) {
        this.cards.push(new Card(suit, rank));
      }
    }
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    // Animación de barajado
    this.cards.forEach((card, index) => {
      card.targetX = width / 2;
      card.targetY = height / 2;
      card.targetAngle = random(-PI, PI);
      setTimeout(() => {
        card.targetX = width / 2 - 40;
        card.targetY = height / 2 - 60;
        card.targetAngle = 0;
      }, 500 + index * 20);
    });
  }

  drawCard() {
    return this.cards.pop();
  }
}

class Player {
  constructor(name) {
    this.name = name;
    this.hand = [];
    this.tricksWon = 0;
    this.playedCards = [];
    this.hasShownFlor = false;
  }

  displayHand(x, y, faceDown = false) {
    const cardSpacing = min(90, width / 10);
    for (let i = 0; i < this.hand.length; i++) {
      this.hand[i].display(x + i * cardSpacing, y, faceDown);
    }
  }

  displayPlayedCards(x, y) {
    const cardSpacing = min(90, width / 10);
    for (let i = 0; i < this.playedCards.length; i++) {
      this.playedCards[i].display(x + i * cardSpacing, y);
    }
  }

  calculateEnvido() {
    const suitCards = { oro: [], copa: [], espada: [], basto: [] };

    const allCards = [...this.hand, ...this.playedCards];

    for (const card of allCards) {
      suitCards[card.suit].push(card.rank);
    }

    let maxEnvido = 0;

    for (const suit in suitCards) {
      if (suitCards[suit].length >= 2) {
        suitCards[suit].sort((a, b) => b - a);
        const envidoValue = suitCards[suit].map(rank => (rank <= 7 ? rank : 0));
        const envido = 20 + envidoValue[0] + envidoValue[1];
        maxEnvido = Math.max(maxEnvido, envido);
      } else if (suitCards[suit].length === 1) {
        maxEnvido = Math.max(maxEnvido, suitCards[suit][0] <= 7 ? suitCards[suit][0] : 0);
      }
    }

    return maxEnvido;
  }

  hasFlor() {
    const suitCounts = { oro: 0, copa: 0, espada: 0, basto: 0 };
    for (const card of this.hand) {
      suitCounts[card.suit]++;
    }
    return Object.values(suitCounts).some(count => count >= 3);
  }

  calculateFlorPoints() {
    if (!this.hasFlor()) return 0;
    
    const suitCards = this.hand.filter(card => card.suit === this.hand[0].suit);
    const values = suitCards
      .map(card => card.rank <= 7 ? card.rank : 0)
      .sort((a, b) => b - a);
    
    return 20 + values[0] + values[1];
  }
}

class Button {
  constructor(label, x, y, width, height) {
    this.label = label;
    this.x = x;
    this.y = y;
    this.width = min(width, windowWidth * 0.25);
    this.height = min(height, windowHeight * 0.1);
    this.isHovered = false;
  }

  display() {
    push();
    if (this.isHovered) {
      fill(72, 172, 239);
    } else {
      fill(52, 152, 219);
    }
    rect(this.x, this.y, this.width, this.height, 8);
    fill(255);
    textSize(min(20, windowWidth * 0.035));
    textAlign(CENTER, CENTER);
    text(this.label, this.x + this.width / 2, this.y + this.height / 2);
    pop();
  }

  isClicked() {
    const inputX = touches.length > 0 ? touches[0].x : mouseX;
    const inputY = touches.length > 0 ? touches[0].y : mouseY;
    return inputX > this.x && inputX < this.x + this.width && 
           inputY > this.y && inputY < this.y + this.height;
  }

  setHovered(isHovered) {
    this.isHovered = isHovered;
  }
}

class TrucoGame {
  constructor() {
    this.deck = new Deck();
    this.players = [new Player("Jugador"), new Player("Computadora")];
    this.currentPlayer = 0;
    this.currentHand = 0;
    this.round = 1;
    this.envidoState = "not_played";
    this.trucoState = "not_played";
    this.florState = "not_played";
    this.score = [0, 0];
    this.handWinner = null;
    this.gameLog = [];
    this.envidoPoints = [0, 0];
    this.florPoints = [0, 0];
    this.currentBet = 1;
    this.trickWinner = [null, null, null];
    this.showPlayerResponseButtons = false;
    this.playerResponseOptions = [];
    this.gameOver = false;
    this.mano = 0;
    this.lastTrucoPlayer = null;
    this.envidoInProgress = false;
    this.florInProgress = false;
    this.buttons = [];
    this.isGameReady = false;
    this.interactionFlags = {
      canInteract: false,
      isDealing: false,
      isAnimating: false,
      isWaitingAIResponse: false,
      isProcessingAction: false
    };
    this.dealNewHand();
    this.updateResponsiveLayout();
  }

  updateResponsiveLayout() {
    const baseSize = min(windowWidth, windowHeight);
    const isLandscape = windowWidth > windowHeight;

    // Calcular tamaño de cartas
    const cardWidth = min(baseSize * 0.18, 140);
    const cardHeight = cardWidth * 1.5;

    // Actualizar tamaño de todas las cartas
    this.updateAllCardSizes(cardWidth, cardHeight);
    
    // Ajustar espaciado de cartas según la orientación
    this.cardSpacing = isLandscape ? 
      min(windowWidth * 0.14, baseSize * 0.17) : 
      min(windowWidth * 0.27, baseSize * 0.27);
    
    // Centrar las cartas horizontalmente
    this.centerX = isLandscape ? 
      windowWidth * 0.45 : // En PC más a la izquierda (antes 0.55)
      windowWidth * 0.45;  // En móvil también más a la izquierda (antes 0.5)
    
    this.centerY = windowHeight * 0.5;
    
    // Ajustar posición vertical de las manos
    this.playerHandY = windowHeight * (isLandscape ? 0.8 : 0.75);
    this.computerHandY = windowHeight * 0.15;
    
    // Ajustar tamaños de botones
    this.buttonWidth = min(baseSize * 0.18, 150);
    this.buttonHeight = min(baseSize * 0.08, 50);
    
    // Ajustar posición de los botones
    this.buttonX = windowWidth * (isLandscape ? 0.82 : 0.75);
    
    // Ajustar tamaño y posición de la consola
    if (isLandscape) {
      this.logWidth = min(windowWidth * 0.25, 350);
      this.logHeight = windowHeight * 0.5;
      this.logY = windowHeight * 0.02;
      this.logX = windowWidth * 0.02;
    } else {
      this.logWidth = min(windowWidth * 0.9, 500);
      this.logHeight = windowHeight * 0.2;
      this.logY = windowHeight * 0.02;
      this.logX = (windowWidth - this.logWidth) / 2;
    }

    // Ajustar espaciado para cartas jugadas en el centro
    this.playedCardSpacingX = baseSize * 0.17;
    this.playedCardSpacingY = baseSize * 0.17;

    // Calcular tamaños de texto para la consola
    this.titleFontSize = min(20, this.logWidth * 0.08);
    this.messageFontSize = min(16, this.logWidth * 0.06);
  }

  updateAllCardSizes(width, height) {
    // Actualizar cartas en las manos
    this.players.forEach(player => {
      player.hand.forEach(card => card.updateCardSize(width, height));
      player.playedCards.forEach(card => card.updateCardSize(width, height));
    });

    // Actualizar cartas en el mazo si existe
    if (this.deck && this.deck.cards) {
      this.deck.cards.forEach(card => card.updateCardSize(width, height));
    }
  }

  dealNewHand() {
    if (this.gameOver) return;

    this.isGameReady = false;
    this.interactionFlags.canInteract = false;
    this.interactionFlags.isDealing = true;
    this.interactionFlags.isAnimating = true;

    this.deck = new Deck();
    this.deck.shuffle();
    this.players.forEach(player => {
      player.hand = [];
      player.tricksWon = 0;
      player.playedCards = [];
      player.hasShownFlor = false;
    });
    this.round = 1;
    this.envidoState = "not_played";
    this.trucoState = "not_played";
    this.florState = "not_played";
    this.handWinner = null;
    this.envidoPoints = [0, 0];
    this.currentBet = 1;
    this.trickWinner = [null, null, null];
    this.lastTrucoPlayer = null;
    this.envidoInProgress = false;
    this.florInProgress = false;
    this.showPlayerResponseButtons = false;
    this.buttons = [];

    let dealingTimeout = null;
    for (let i = 0; i < 3; i++) {
      this.players.forEach((player, playerIndex) => {
        dealingTimeout = setTimeout(() => {
          const card = this.deck.drawCard();
          card.x = width / 2 - 40;
          card.y = height / 2 - 60;
          player.hand.push(card);
          const cardSpacing = min(90, width / 10);
          const targetX = playerIndex === 0 ? width * 0.3 + i * cardSpacing : width * 0.3 + i * cardSpacing;
          const targetY = playerIndex === 0 ? height * 0.7 : height * 0.1;
          card.targetX = targetX;
          card.targetY = targetY;
        }, 1000 + i * 500 + playerIndex * 250);
      });
    }

    if (dealingTimeout) {
      clearTimeout(this.aiPlayTimeout);
      this.aiPlayTimeout = setTimeout(() => {
        this.currentPlayer = this.mano;
        this.logEvent("Nueva mano repartida");
        this.logEvent(`${this.players[this.currentPlayer].name} es mano`);

        this.isGameReady = true;
        this.interactionFlags.canInteract = true;
        this.interactionFlags.isDealing = false;
        this.interactionFlags.isAnimating = false;

        this.players.forEach((player, index) => {
          if (player.hasFlor()) {
            this.logEvent(`${player.name} tiene Flor`);
            if (index === 0) {
              this.waitForPlayerFlorResponse();
            } else {
              this.handleAIFlor();
            }
          }
        });

        if (this.currentPlayer === 1 && !this.florInProgress) {
          this.interactionFlags.isWaitingAIResponse = true;
          this.playAI();
        }
      }, 3000);
    }
  }

  playCard(playerIndex, cardIndex) {
    if (this.gameOver || this.envidoInProgress || this.florInProgress) return;

    const player = this.players[playerIndex];
    if (!player || !player.hand || cardIndex >= player.hand.length) return;

    const card = player.hand.splice(cardIndex, 1)[0];
    if (!card) return;

    player.playedCards.push(card);
    this.logEvent(`${player.name} jugó ${card.toString()}`);

    card.targetX = this.centerX - this.cardSpacing + player.playedCards.length * this.cardSpacing;
    card.targetY = this.centerY + (playerIndex === 0 ? this.cardSpacing * 0.5 : -this.cardSpacing * 0.5);
    
    card.angle = playerIndex === 0 ? PI : -PI;
    card.targetAngle = 0;
    
    card.scale = 1.2;
    card.targetScale = 1;

    if (this.players[0].playedCards.length === this.players[1].playedCards.length) {
      setTimeout(() => this.evaluateTrick(), 1000);
    } else {
      this.currentPlayer = 1 - this.currentPlayer;
      if (this.currentPlayer === 1) {
        setTimeout(() => this.playAI(), 1000);
      }
    }
  }

  evaluateTrick() {
    const card1 = this.players[0].playedCards[this.players[0].playedCards.length - 1];
    const card2 = this.players[1].playedCards[this.players[1].playedCards.length - 1];
    const comparison = card1.compareWith(card2);
    let winner;
    if (comparison > 0) {
      winner = 0;
    } else if (comparison < 0) {
      winner = 1;
    } else {
      winner = this.mano;
    }
    this.trickWinner[this.round - 1] = winner;
    this.players[winner].tricksWon++;
    this.currentPlayer = winner;
    this.round++;

    this.logEvent(`${this.players[winner].name} ganó la baza`);

    if (this.round > 3 || this.players[winner].tricksWon === 2) {
      setTimeout(() => this.evaluateHand(), 1000);
    } else if (this.currentPlayer === 1) {
      setTimeout(() => this.playAI(), 1000);
    }
  }

  evaluateHand() {
    let winner = this.players[0].tricksWon > this.players[1].tricksWon ? 0 : 1;
    if (this.players[0].tricksWon === this.players[1].tricksWon) {
      winner = this.mano;
    }

    this.handWinner = winner;
    const points = this.getTrucoValue();
    this.score[winner] += points;
    this.logEvent(`${this.players[winner].name} ganó la mano y ${points} puntos`);

    if (this.score[winner] >= 30) {
      this.gameOver = true;
      this.logEvent(`${this.players[winner].name} ganó el juego`);
    } else {
      this.mano = 1 - this.mano;
      setTimeout(() => this.dealNewHand(), 2000);
    }
  }

  getTrucoValue() {
    switch (this.trucoState) {
      case "truco":
        return 2;
      case "retruco":
        return 3;
      case "vale_cuatro":
        return 4;
      default:
        return 1;
    }
  }

  playAI() {
    if (this.gameOver || this.currentPlayer !== 1 || this.envidoInProgress || this.florInProgress) return;

    const aiHand = this.players[1].hand;
    if (!aiHand || aiHand.length === 0) return;

    clearTimeout(this.aiPlayTimeout);
    this.aiPlayTimeout = setTimeout(() => {
      if (this.round === 1 && this.players[1].playedCards.length === 0 && this.players[1].hasFlor() && this.florState === "not_played") {
        this.handleAIFlor();
        return;
      }

      if (this.round === 1 && this.envidoState === "not_played" && !this.players[1].hasFlor() && 
          this.players[1].playedCards.length === 0 && this.florState === "not_played") {
        const envidoPoints = this.players[1].calculateEnvido();
        if (envidoPoints >= 28 || (envidoPoints >= 23 && Math.random() < 0.7)) {
          this.callEnvidoAI();
          return;
        }
      }

      const playerPlayedCards = this.players[0].playedCards;
      const roundScore = this.calculateRoundScore();
      const strongCards = aiHand.filter(card => card.getPower() > 10).length;
      const isWinning = roundScore > 0;

      if (this.canCallTruco(1)) {
        const shouldCallTruco = Math.random() < this.calculateTrucoChance(strongCards, this.round, isWinning);
        if (shouldCallTruco) {
          if (this.trucoState === "not_played") {
            this.callTrucoAI();
            return;
          } else if (this.trucoState === "truco" && this.lastTrucoPlayer !== 1) {
            if (Math.random() < 0.3 && strongCards > 0) {
              this.callReTrucoAI();
              return;
            }
          } else if (this.trucoState === "retruco" && this.lastTrucoPlayer !== 1) {
            if (Math.random() < 0.2 && strongCards > 1) {
              this.callValeCuatroAI();
              return;
            }
          }
        }
      }

      let cardIndex;
      if (!playerPlayedCards || playerPlayedCards.length === 0) {
        if (roundScore <= -1 || (this.round === 1 && this.trucoState === "not_played")) {
          cardIndex = this.getLowestCardIndex(aiHand);
        } else {
          cardIndex = this.getHighestCardIndex(aiHand);
        }
      } else {
        const playerCard = playerPlayedCards[playerPlayedCards.length - 1];
        if (playerCard) {
          cardIndex = this.getLowestWinningCardIndex(aiHand, playerCard);
          if (cardIndex === -1) {
            cardIndex = this.getLowestCardIndex(aiHand);
          }
        } else {
          cardIndex = this.getLowestCardIndex(aiHand);
        }
      }

      if (cardIndex !== undefined && cardIndex >= 0) {
        this.playCard(1, cardIndex);
      }
    }, 1000);
  }

  calculateTrucoChance(strongCards, round, isWinning) {
    let baseChance = 0.3;

    if (strongCards > 1) baseChance += 0.2;
    if (strongCards > 0) baseChance += 0.1;

    if (round === 1) baseChance += 0.1;
    if (round === 3) baseChance -= 0.1;

    if (isWinning) baseChance += 0.1;
    else baseChance -= 0.1;

    return Math.min(0.8, Math.max(0.1, baseChance));
  }

  callTrucoAI() {
    this.trucoState = "pending";
    this.lastTrucoPlayer = 1;
    this.logEvent("Computadora cantó Truco");
    this.waitForPlayerTrucoResponse();
  }

  callReTrucoAI() {
    this.trucoState = "retruco";
    this.lastTrucoPlayer = 1;
    this.logEvent("Computadora cantó Retruco");
    this.waitForPlayerTrucoResponse();
  }

  callValeCuatroAI() {
    this.trucoState = "vale_cuatro";
    this.lastTrucoPlayer = 1;
    this.logEvent("Computadora cantó Vale Cuatro");
    this.waitForPlayerTrucoResponse();
  }

  callEnvidoAI() {
    this.envidoState = "pending";
    this.currentBet = 2;
    this.envidoInProgress = true;
    this.logEvent("Computadora cantó Envido");
    this.waitForPlayerEnvidoResponse();
  }

  waitForPlayerTrucoResponse() {
    this.showPlayerResponseButtons = true;
    this.buttons = [];
    const buttonWidth = min(150, windowWidth * 0.25);
    const buttonHeight = min(50, windowHeight * 0.1);
    const buttonSpacing = min(15, windowWidth * 0.03);
    const startY = windowHeight * 0.5;

    let options = ["Quiero", "No Quiero"];
    
    if (this.round === 1 && 
        this.envidoState === "not_played" && 
        this.players[0].playedCards.length === 0 && 
        this.mano === 1) {
      options = ["Quiero", "No Quiero", "Envido", "Real Envido", "Falta Envido", "Retruco"];
    } else if (!this.envidoInProgress) {
      if (this.trucoState === "pending") {
        options.push("Retruco");
      } else if (this.trucoState === "truco" && this.lastTrucoPlayer !== 0) {
        options.push("Retruco");
      } else if (this.trucoState === "retruco" && this.lastTrucoPlayer !== 0) {
        options.push("Vale Cuatro");
      }
    }

    const totalWidth = options.length * buttonWidth + (options.length - 1) * buttonSpacing;
    const startX = (windowWidth - totalWidth) / 2;

    for (let i = 0; i < options.length; i++) {
      const buttonX = startX + i * (buttonWidth + buttonSpacing);
      this.buttons.push(new Button(options[i], buttonX, startY, buttonWidth, buttonHeight));
    }
  }

  handlePlayerTrucoResponse(response) {
    this.showPlayerResponseButtons = false;
    this.buttons = [];
    
    if (["Envido", "Real Envido", "Falta Envido"].includes(response) && 
        this.round === 1 && 
        this.mano === 1) {
      this.trucoState = "not_played";
      this.lastTrucoPlayer = null;
      
      if (response === "Envido") {
        this.callEnvido();
      } else if (response === "Real Envido") {
        this.callRealEnvido();
      } else if (response === "Falta Envido") {
        this.callFaltaEnvido();
      }
      return;
    }

    if (response === "Quiero") {
      if (this.trucoState === "pending") {
        this.trucoState = "truco";
        this.currentBet = 2;
      } else if (this.trucoState === "retruco") {
        this.currentBet = 3;
      } else if (this.trucoState === "vale_cuatro") {
        this.currentBet = 4;
      }
      this.logEvent(`Jugador aceptó el ${this.trucoState}`);
      if (this.currentPlayer === 1) {
        setTimeout(() => this.playAI(), 1000);
      }
    } else if (response === "No Quiero") {
      let points = 1;
      if (this.trucoState === "retruco") {
        points = 2;
      } else if (this.trucoState === "vale_cuatro") {
        points = 3;
      }
      this.score[1] += points;
      this.logEvent(`Jugador no quiso el ${this.trucoState}. Computadora ganó ${points} punto(s)`);
      this.endHand();
    } else if (response === "Retruco") {
      this.trucoState = "retruco";
      this.lastTrucoPlayer = 0;
      this.currentBet = 3;
      this.logEvent("Jugador cantó Retruco");
      setTimeout(() => this.respondToTruco(), 1000);
    } else if (response === "Vale Cuatro") {
      this.trucoState = "vale_cuatro";
      this.lastTrucoPlayer = 0;
      this.currentBet = 4;
      this.logEvent("Jugador cantó Vale Cuatro");
      setTimeout(() => this.respondToTruco(), 1000);
    }
  }

  respondToTruco() {
    const aiResponse = this.decideTrucoResponse(this.trucoState, this.round);
    if (aiResponse === "accept") {
      if (this.trucoState === "pending") {
        this.trucoState = "truco";
        this.currentBet = 2;
      }
      this.logEvent(`Computadora aceptó el ${this.trucoState === "pending" ? "truco" : this.trucoState}`);
      if (this.currentPlayer === 1) {
        setTimeout(() => this.playAI(), 1000);
      }
    } else if (aiResponse === "reject") {
      let points = 1;
      if (this.trucoState === "retruco") {
        points = 2;
      } else if (this.trucoState === "vale_cuatro") {
        points = 3;
      }
      this.score[0] += points;
      this.logEvent(`Computadora no quiso el ${this.trucoState === "pending" ? "truco" : this.trucoState}. Jugador ganó ${points} punto(s)`);
      this.endHand();
    } else if (aiResponse === "raise") {
      if (this.trucoState === "pending" || this.trucoState === "truco") {
        this.trucoState = "retruco";
        this.lastTrucoPlayer = 1;
        this.currentBet = 3;
        this.logEvent("Computadora cantó Retruco");
        this.waitForPlayerTrucoResponse();
      } else if (this.trucoState === "retruco") {
        this.trucoState = "vale_cuatro";
        this.lastTrucoPlayer = 1;
        this.currentBet = 4;
        this.logEvent("Computadora cantó Vale Cuatro");
        this.waitForPlayerTrucoResponse();
      }
    }
  }

  endHand() {
    if (this.score[0] >= 30 || this.score[1] >= 30) {
      this.gameOver = true;
      this.logEvent(`${this.score[0] >= 30 ? this.players[0].name : this.players[1].name} ganó el juego`);
    } else {
      this.mano = 1 - this.mano;
      setTimeout(() => this.dealNewHand(), 1000);
    }
  }

  display() {
    image(tableImage, 0, 0, windowWidth, windowHeight);

    const playerHandStartX = this.centerX - (this.cardSpacing * (this.players[0].hand.length - 1) / 2);
    this.players[0].hand.forEach((card, index) => {
      card.display(playerHandStartX + index * this.cardSpacing, this.playerHandY);
    });

    const computerHandStartX = this.centerX - (this.cardSpacing * (this.players[1].hand.length - 1) / 2);
    this.players[1].hand.forEach((card, index) => {
      card.display(computerHandStartX + index * this.cardSpacing, this.computerHandY, true);
    });

    this.displayPlayedCards();
    this.displayGameLog();
    this.displayEnvidoResult();

    if (this.showPlayerResponseButtons) {
      for (const button of this.buttons) {
        button.display();
      }
    } else if (this.currentPlayer === 0 && !this.envidoInProgress && !this.florInProgress) {
      const buttonStartY = windowHeight * 0.3;
      const buttonSpacing = windowHeight * 0.08;
      
      this.buttons = [];
      let currentY = buttonStartY;

      if (this.canCallFlor() && this.florState !== "played" && !this.players[0].hasShownFlor) {
        this.buttons.push(new Button("Flor", this.buttonX, currentY, this.buttonWidth, this.buttonHeight));
        currentY += buttonSpacing;
      }
      if (this.canCallEnvido()) {
        this.buttons.push(new Button("Envido", this.buttonX, currentY, this.buttonWidth, this.buttonHeight));
        currentY += buttonSpacing;
      }
      if (this.canCallTruco(0)) {
        if (this.trucoState === "not_played") {
          this.buttons.push(new Button("Truco", this.buttonX, currentY, this.buttonWidth, this.buttonHeight));
        } else if (this.trucoState === "truco" && this.lastTrucoPlayer !== 0) {
          this.buttons.push(new Button("Retruco", this.buttonX, currentY, this.buttonWidth, this.buttonHeight));
        } else if (this.trucoState === "retruco" && this.lastTrucoPlayer !== 0) {
          this.buttons.push(new Button("Vale Cuatro", this.buttonX, currentY, this.buttonWidth, this.buttonHeight));
        }
        currentY += buttonSpacing;
      }
      if (this.canCallRealEnvido()) {
        this.buttons.push(new Button("Real Envido", this.buttonX, currentY, this.buttonWidth, this.buttonHeight));
        currentY += buttonSpacing;
      }
      if (this.canCallFaltaEnvido()) {
        this.buttons.push(new Button("Falta Envido", this.buttonX, currentY, this.buttonWidth, this.buttonHeight));
        currentY += buttonSpacing;
      }
      this.buttons.push(new Button("Ir al mazo", this.buttonX, currentY, this.buttonWidth, this.buttonHeight));

      for (const button of this.buttons) {
        button.display();
      }
    }
  }

  displayPlayedCards() {
    if (this.players && this.players[0] && this.players[0].playedCards) {
      this.players[0].playedCards.forEach((card, i) => {
        if (card) {
          const x = this.centerX + (i - 1) * this.playedCardSpacingX;
          const y = this.centerY + this.playedCardSpacingY * 0.4; // Reducido de 0.5 a 0.4
          card.targetAngle = 0;
          card.display(x, y);
        }
      });
    }

    if (this.players && this.players[1] && this.players[1].playedCards) {
      this.players[1].playedCards.forEach((card, i) => {
        if (card) {
          const x = this.centerX + (i - 1) * this.playedCardSpacingX;
          const y = this.centerY - this.playedCardSpacingY * 0.4; // Reducido de 0.5 a 0.4
          card.targetAngle = 0;
          card.display(x, y);
        }
      });
    }
  }

  displayGameLog() {
    // Fondo de la consola con gradiente
    push();
    const gradient = drawingContext.createLinearGradient(
      this.logX, this.logY, 
      this.logX, this.logY + this.logHeight
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    drawingContext.fillStyle = gradient;
    rect(this.logX, this.logY, this.logWidth, this.logHeight, 10);
    pop();
    
    // Título con puntuación
    fill(255);
    textSize(this.titleFontSize);
    textStyle(BOLD);
    textAlign(CENTER, TOP);
    text(`Jugador ${this.score[0]} | Computadora ${this.score[1]}`, 
         this.logX + this.logWidth/2, this.logY + this.titleFontSize/2);
    
    // Línea separadora con gradiente
    push();
    const lineGradient = drawingContext.createLinearGradient(
      this.logX, 0, this.logX + this.logWidth, 0
    );
    lineGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    lineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    lineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    drawingContext.strokeStyle = lineGradient;
    drawingContext.lineWidth = 1;
    line(this.logX + this.logWidth * 0.1, 
         this.logY + this.titleFontSize * 2,
         this.logX + this.logWidth * 0.9, 
         this.logY + this.titleFontSize * 2);
    pop();
    
    // Mensajes del juego
    textStyle(NORMAL);
    textAlign(LEFT, TOP);
    textSize(this.messageFontSize);
    let y = this.logY + this.titleFontSize * 2.5;
    
    // Ajustar número de mensajes según espacio disponible
    const maxMessages = floor((this.logHeight - this.titleFontSize * 3) / (this.messageFontSize * 1.5));
    
    for (let i = this.gameLog.length - 1; i >= Math.max(0, this.gameLog.length - maxMessages); i--) {
      const alpha = map(this.gameLog.length - 1 - i, 0, maxMessages - 1, 255, 150);
      fill(255, 255, 255, alpha);
      
      const maxWidth = this.logWidth * 0.8;
      let message = this.gameLog[i];
      let words = message.split(" ");
      let line = "";
      
      for (let j = 0; j < words.length; j++) {
        const testLine = line + words[j] + " ";
        const testWidth = textWidth(testLine);
        
        if (testWidth > maxWidth && j > 0) {
          // Verificar si hay espacio para la siguiente línea
          if (y + this.messageFontSize * 2 > this.logY + this.logHeight) {
            break;
          }
          text(line, this.logX + this.logWidth * 0.1, y);
          line = words[j] + " ";
          y += this.messageFontSize * 1.2;
        } else {
          line = testLine;
        }
      }
      // Verificar si hay espacio para la última línea
      if (y + this.messageFontSize <= this.logY + this.logHeight) {
        text(line, this.logX + this.logWidth * 0.1, y);
        y += this.messageFontSize * 1.5;
      }
    }
  }

  displayEnvidoResult() {
    if (this.envidoPoints[0] > 0 || this.envidoPoints[1] > 0) {
      const timeSinceEnvido = Date.now() - this.envidoDisplayTime;
      if (timeSinceEnvido < 3000) {
        push();
        // Fondo con gradiente
        const messageWidth = min(windowWidth * 0.8, 500);
        const messageHeight = min(windowHeight * 0.25, 200);
        const x = windowWidth/2 - messageWidth/2;
        const y = windowHeight/2 - messageHeight/2;

        // Crear gradiente para el fondo
        const gradient = drawingContext.createLinearGradient(x, y, x, y + messageHeight);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
        drawingContext.fillStyle = gradient;

        // Dibujar fondo con borde brillante
        stroke(255, 255, 255, 50);
        strokeWeight(2);
        rect(x, y, messageWidth, messageHeight, 15);
        noStroke();

        // Título con estilo
        const titleSize = min(28, messageWidth * 0.06);
        const textSize1 = min(24, messageWidth * 0.05);
        const textSize2 = min(20, messageWidth * 0.04);

        textSize(titleSize);
        textStyle(BOLD);
        fill(255, 200, 0); // Color dorado para el título
        textAlign(CENTER, CENTER);
        text("Resultado del Envido", windowWidth/2, y + messageHeight * 0.25);

        // Puntos con estilo
        textSize(textSize1);
        textStyle(NORMAL);
        fill(255);
        text(
          `${this.players[0].name}: ${this.envidoPoints[0]} - ${this.players[1].name}: ${this.envidoPoints[1]}`,
          windowWidth/2,
          y + messageHeight * 0.5
        );

        // Resultado con estilo
        textSize(textSize2);
        if (this.envidoPoints[0] === this.envidoPoints[1]) {
          fill(150, 200, 255); // Azul claro para empate
          text(`(Ganó ${this.currentBet} puntos por ser mano)`, 
               windowWidth/2, y + messageHeight * 0.75);
        } else {
          const winner = this.envidoPoints[0] > this.envidoPoints[1] ? this.players[0].name : this.players[1].name;
          fill(100, 255, 100); // Verde claro para el ganador
          text(`¡${winner} gana!`, windowWidth/2, y + messageHeight * 0.75);
        }
        pop();
      }
    }
  }

  logEvent(event) {
    if (event.includes("pending")) {
      event = event.replace("pending", "truco");
    }

    if (event.includes("quiso el") && event.includes("ganó")) {
      const parts = event.split(".");
      this.gameLog.push(parts[0].trim());
      if (parts[1]) {
        this.gameLog.push(parts[1].trim());
      }
    } else if (event.includes("quiso") && event.includes("ganó")) {
      const parts = event.split(".");
      if (parts.length > 1) {
        this.gameLog.push(parts[0].trim());
        this.gameLog.push(parts[1].trim());
      } else {
        const quiereIndex = event.indexOf("quiso");
        const ganoIndex = event.indexOf("ganó");
        if (quiereIndex !== -1 && ganoIndex !== -1) {
          this.gameLog.push(event.substring(0, ganoIndex).trim());
          this.gameLog.push(event.substring(ganoIndex).trim());
        } else {
          this.gameLog.push(event);
        }
      }
    } else {
      this.gameLog.push(event);
    }
  }

  handleAIFlor() {
    this.logEvent("Computadora tiene Flor");
    this.florState = "flor";
    this.currentBet = 3;
    this.florInProgress = true;
    this.logEvent("Computadora cantó Flor");
    
    if (this.players[0].hasFlor()) {
      this.waitForPlayerFlorResponse();
    } else {
      this.score[1] += 3;
      this.logEvent("Computadora mostró Flor y ganó 3 puntos");
      this.florState = "played";
      this.florInProgress = false;

      if (this.score[1] >= 30) {
        this.gameOver = true;
        this.logEvent(`${this.players[1].name} ganó el juego`);
      }
    }
  }

  waitForPlayerFlorResponse() {
    this.showPlayerResponseButtons = true;
    this.buttons = [];
    const buttonWidth = min(160, windowWidth * 0.25);
    const buttonHeight = min(50, windowHeight * 0.1);
    const buttonSpacing = min(15, windowWidth * 0.03);
    const startY = windowHeight * 0.5;

    let options = [];
    if (this.florState === "flor" && this.players[0].hasFlor()) {
      options = ["Mostrar", "No Mostrar", "Contra Flor", "Contra Flor al Resto"];
    } else if (this.florState === "contra_flor" && this.players[0].hasFlor()) {
      options = ["Quiero", "No Quiero", "Contra Flor al Resto"];
    } else if (this.florState === "contra_flor_al_resto") {
      options = ["Quiero", "No Quiero"];
    } else {
      options = ["Mostrar", "No Mostrar"];
    }

    const totalWidth = options.length * buttonWidth + (options.length - 1) * buttonSpacing;
    const startX = (windowWidth - totalWidth) / 2;

    for (let i = 0; i < options.length; i++) {
      const buttonX = startX + i * (buttonWidth + buttonSpacing);
      this.buttons.push(new Button(options[i], buttonX, startY, buttonWidth, buttonHeight));
    }
  }

  handlePlayerFlorResponse(response) {
    this.showPlayerResponseButtons = false;
    this.buttons = [];
    this.florInProgress = false;

    if (response === "Mostrar") {
      this.score[0] += 3;
      this.logEvent(`${this.players[0].name} mostró Flor y ganó 3 puntos`);
      this.florState = "played";
      this.players[0].hasShownFlor = true;
    } else if (response === "No Mostrar") {
      this.score[1] += 3;
      this.logEvent(`${this.players[1].name} ganó la Flor por no mostrar`);
      this.florState = "played";
      this.players[0].hasShownFlor = true;
    } else if (response === "Contra Flor") {
      this.florState = "contra_flor";
      this.currentBet = 6;
      this.logEvent("Jugador cantó Contra Flor");
      setTimeout(() => this.respondToContraFlor(), 1000);
      return;
    } else if (response === "Contra Flor al Resto") {
      this.florState = "contra_flor_al_resto";
      this.currentBet = this.calculateFaltaEnvidoPoints();
      this.logEvent("Jugador cantó Contra Flor al Resto");
      setTimeout(() => this.respondToContraFlorAlResto(), 1000);
      return;
    }
    
    if (this.currentPlayer === 1 && !this.gameOver) {
      setTimeout(() => this.playAI(), 1000);
    }
  }

  respondToContraFlor() {
    const aiPoints = this.players[1].calculateFlorPoints();
    const decision = Math.random();
    
    if (aiPoints >= 25 && decision < 0.7) {
      this.logEvent("Computadora quiere la Contra Flor");
      const playerPoints = this.players[0].calculateFlorPoints();
      this.florPoints = [playerPoints, aiPoints];
      
      let winner;
      if (playerPoints === aiPoints) {
        winner = this.mano;
      } else {
        winner = playerPoints > aiPoints ? 0 : 1;
      }
      
      this.score[winner] += this.currentBet;
      this.logEvent(`${this.players[winner].name} ganó la Contra Flor con ${this.florPoints[winner]} puntos`);
      if (winner === this.mano) {
        this.logEvent("(Ganó por ser mano)");
      }
      this.florState = "played";
    } else if (aiPoints >= 28 && decision < 0.3) {
      this.florState = "contra_flor_al_resto";
      this.currentBet = this.calculateFaltaEnvidoPoints();
      this.logEvent("Computadora cantó Contra Flor al Resto");
      this.waitForPlayerFlorResponse();
      return;
    } else {
      this.score[0] += 3;
      this.logEvent("Computadora no quiso la Contra Flor. Jugador ganó 3 puntos");
      this.florState = "played";
    }

    this.florInProgress = false;
    if (this.currentPlayer === 1 && !this.gameOver) {
      setTimeout(() => this.playAI(), 1000);
    }
  }

  respondToContraFlorAlResto() {
    const aiPoints = this.players[1].calculateFlorPoints();
    const decision = Math.random();
    
    if (aiPoints >= 28 || decision < 0.3) {
      this.logEvent("Computadora quiere la Contra Flor al Resto");
      const playerPoints = this.players[0].calculateFlorPoints();
      this.florPoints = [playerPoints, aiPoints];
      
      let winner;
      if (playerPoints === aiPoints) {
        winner = this.mano;
      } else {
        winner = playerPoints > aiPoints ? 0 : 1;
      }
      
      this.score[winner] += this.currentBet;
      this.logEvent(`${this.players[winner].name} ganó la Contra Flor al Resto con ${this.florPoints[winner]} puntos`);
      if (winner === this.mano) {
        this.logEvent("(Ganó por ser mano)");
      }
    } else {
      this.score[0] += 3;
      this.logEvent("Computadora no quiso la Contra Flor al Resto. Jugador ganó 3 puntos");
    }
    
    this.florState = "played";
    this.florInProgress = false;
    if (this.currentPlayer === 1 && !this.gameOver) {
      setTimeout(() => this.playAI(), 1000);
    }
  }

  decideEnvidoResponse(envidoPoints, currentBet, envidoState) {
    if (envidoPoints >= 28) {
      return Math.random() < 0.9 ? "accept" : "raise";
    } else if (envidoPoints >= 23) {
      if (envidoState === "falta_envido") {
        return Math.random() < 0.5 ? "accept" : "reject";
      } else {
        return Math.random() < 0.7 ? "accept" : Math.random() < 0.6 ? "raise" : "reject";
      }
    } else {
      if (envidoState === "falta_envido") {
        return "reject";
      } else {
        return Math.random() < 0.4 ? "accept" : "reject";
      }
    }
  }

  decideTrucoResponse(currentState, round) {
    const strongCards = this.players[1].hand.filter(card => card.getPower() > 10).length;
    const remainingCards = this.players[1].hand.length;
    const roundScore = this.calculateRoundScore();
    const isWinning = roundScore > 0;

    const hasGoodHand = strongCards >= Math.ceil(remainingCards / 2);
    const isLastRound = round === 3;
    const isFirstRound = round === 1;

    if (currentState === "pending") {
      if (hasGoodHand) {
        if (isFirstRound) {
          return Math.random() < 0.4 ? "raise" : "accept";
        } else {
          return Math.random() < 0.7 ? "accept" : "reject";
        }
      } else if (isWinning) {
        return Math.random() < 0.6 ? "accept" : "reject";
      } else {
        return Math.random() < 0.3 ? "accept" : "reject";
      }
    } else if (currentState === "retruco") {
      if (hasGoodHand && !isLastRound) {
        return Math.random() < 0.3 ? "raise" : "accept";
      } else if (isWinning || hasGoodHand) {
        return Math.random() < 0.6 ? "accept" : "reject";
      } else {
        return Math.random() < 0.2 ? "accept" : "reject";
      }
    } else if (currentState === "vale_cuatro") {
      if (hasGoodHand && isWinning) {
        return Math.random() < 0.7 ? "accept" : "reject";
      } else if (hasGoodHand || isWinning) {
        return Math.random() < 0.4 ? "accept" : "reject";
      } else {
        return Math.random() < 0.2 ? "accept" : "reject";
      }
    }
    return "reject";
  }

  irMazo() {
    this.logEvent(`${this.players[0].name} Se fue al mazo`);
    this.handWinner = 1;
    const points = this.getTrucoValue();
    this.score[1] += points;
    this.logEvent(`${this.players[1].name} ganó ${points} puntos`);

    if (this.score[1] >= 30) {
      this.gameOver = true;
      this.logEvent(`${this.players[1].name} ganó el juego`);
    } else {
      this.mano = 1 - this.mano;
      this.dealNewHand();
    }
  }

  getLowestCardIndex(hand) {
    return hand.reduce((lowest, card, index, arr) => (card.getPower() < arr[lowest].getPower() ? index : lowest), 0);
  }

  getHighestCardIndex(hand) {
    return hand.reduce((highest, card, index, arr) => (card.getPower() > arr[highest].getPower() ? index : highest), 0);
  }

  getLowestWinningCardIndex(hand, opponentCard) {
    const winningCards = hand.filter(card => card.compareWith(opponentCard) > 0);
    if (winningCards.length === 0) return -1;
    return hand.indexOf(winningCards.reduce((lowest, card) => (card.getPower() < lowest.getPower() ? card : lowest)));
  }

  calculateRoundScore() {
    let score = 0;
    for (let i = 0; i < this.trickWinner.length; i++) {
      if (this.trickWinner[i] === 1) score++;
      else if (this.trickWinner[i] === 0) score--;
    }
    return score;
  }

  canCallEnvido() {
    return (
      this.envidoState === "not_played" &&
      this.round === 1 &&
      this.players[0].playedCards.length === 0 &&
      (this.florState === "not_played" || !this.players[0].hasFlor())
    );
  }

  canCallTruco(playerIndex) {
    return (
      (this.trucoState === "not_played" ||
        (this.trucoState === "truco" && this.lastTrucoPlayer !== playerIndex) ||
        (this.trucoState === "retruco" && this.lastTrucoPlayer !== playerIndex)) &&
      this.envidoState !== "pending" &&
      !this.envidoInProgress &&
      !this.florInProgress &&
      this.players[0].playedCards.length < 3 &&
      this.players[1].playedCards.length < 3
    );
  }

  canCallRealEnvido() {
    return (
      (this.envidoState === "envido" || this.envidoState === "not_played") &&
      this.round === 1 &&
      this.players[0].playedCards.length === 0
    );
  }

  canCallFaltaEnvido() {
    return (
      (this.envidoState === "envido" || this.envidoState === "real_envido" || this.envidoState === "not_played") &&
      this.round === 1 &&
      this.players[0].playedCards.length === 0
    );
  }

  callEnvido() {
    if (this.envidoState === "not_played") {
      this.envidoState = "envido";
      this.currentBet = 2;
      this.envidoInProgress = true;
      this.logEvent("Jugador cantó Envido");
      setTimeout(() => this.respondToEnvido(), 1000);
    } else if (this.envidoState === "envido") {
      this.envidoState = "envido_envido";
      this.currentBet = 4;
      this.logEvent("Jugador cantó Envido Envido");
      setTimeout(() => this.respondToEnvido(), 1000);
    }
  }

  callRealEnvido() {
    this.envidoState = "real_envido";
    this.currentBet += 3;
    this.envidoInProgress = true;
    this.logEvent("Jugador cantó Real Envido");
    setTimeout(() => this.respondToEnvido(), 1000);
  }

  callFaltaEnvido() {
    this.envidoState = "falta_envido";
    this.currentBet = this.calculateFaltaEnvidoPoints();
    this.envidoInProgress = true;
    this.logEvent("Jugador cantó Falta Envido");
    setTimeout(() => this.respondToEnvido(), 1000);
  }

  respondToEnvido() {
    const aiEnvidoPoints = this.players[1].calculateEnvido();
    const aiResponse = this.decideEnvidoResponse(aiEnvidoPoints, this.currentBet, this.envidoState);
    if (aiResponse === "accept") {
      this.envidoState = "played";
      const playerEnvidoPoints = this.players[0].calculateEnvido();
      this.envidoPoints = [playerEnvidoPoints, aiEnvidoPoints];
      this.envidoDisplayTime = Date.now();
      let winner;
      if (playerEnvidoPoints === aiEnvidoPoints) {
        winner = this.mano;
      } else {
        winner = playerEnvidoPoints > aiEnvidoPoints ? 0 : 1;
      }
      this.score[winner] += this.currentBet;
      this.logEvent(
        `Computadora quiso. ${this.players[winner].name} ganó ${this.currentBet} puntos con ${this.envidoPoints[winner]} de envido`
      );

      if (this.score[winner] >= 30) {
        this.gameOver = true;
        this.logEvent(`${this.players[winner].name} ganó el juego`);
        return;
      }
    } else if (aiResponse === "raise") {
      if (this.envidoState === "envido") {
        this.callRealEnvidoAI();
        return;
      } else {
        this.callFaltaEnvidoAI();
        return;
      }
    } else {
      this.envidoState = "rejected";
      this.score[0] += 1;
      this.logEvent("Computadora no quiso. Jugador ganó 1 punto");

      if (this.score[0] >= 30) {
        this.gameOver = true;
        this.logEvent(`${this.players[0].name} ganó el juego`);
        return;
      }
    }
    this.envidoState = this.envidoState === "pending" ? "played" : this.envidoState;
    this.envidoInProgress = false;
    if (this.currentPlayer === 1) {
      setTimeout(() => this.playAI(), 1000);
    }
  }

  handlePlayerResponse(response) {
    this.showPlayerResponseButtons = false;
    this.buttons = [];
    if (this.envidoState === "pending") {
      this.handlePlayerEnvidoResponse(response);
    } else if (this.trucoState === "pending" || this.trucoState === "truco" || this.trucoState === "retruco") {
      this.handlePlayerTrucoResponse(response);
    }
  }

  handleMousePressed() {
    if (!this.isGameReady || this.gameOver) return;

    if ((this.currentPlayer === 0 || this.showPlayerResponseButtons) && !this.gameOver) {
      if (this.currentPlayer === 0 && !this.envidoInProgress && !this.florInProgress) {
        for (let i = 0; i < this.players[0].hand.length; i++) {
          if (this.players[0].hand[i].isClicked()) {
            if (this.canPlayCard()) {
              this.playCard(0, i);
            }
            return;
          }
        }
      }
    }

    if (this.showPlayerResponseButtons) {
      for (let i = 0; i < this.buttons.length; i++) {
        if (this.buttons[i].isClicked()) {
          if (this.florInProgress) {
            this.handlePlayerFlorResponse(this.buttons[i].label);
          } else if (this.envidoInProgress) {
            this.handlePlayerEnvidoResponse(this.buttons[i].label);
          } else {
            this.handlePlayerTrucoResponse(this.buttons[i].label);
          }
          return;
        }
      }
    } else if (this.currentPlayer === 0 && !this.envidoInProgress && !this.florInProgress) {
      for (let i = 0; i < this.buttons.length; i++) {
        if (this.buttons[i].isClicked()) {
          switch (this.buttons[i].label) {
            case "Flor":
              this.callFlor();
              break;
            case "Envido":
              this.callEnvido();
              break;
            case "Truco":
            case "Retruco":
            case "Vale Cuatro":
              this.callTruco();
              break;
            case "Real Envido":
              this.callRealEnvido();
              break;
            case "Falta Envido":
              this.callFaltaEnvido();
              break;
            case "Ir al mazo":
              this.irMazo();
              break;
          }
          return;
        }
      }
    }
  }

  handleMouseMoved() {
    if (!this.isGameReady) return;

    for (let i = 0; i < this.players[0].hand.length; i++) {
      const card = this.players[0].hand[i];
      card.setHovered(card.isClicked());
    }

    for (let i = 0; i < this.buttons.length; i++) {
      this.buttons[i].setHovered(this.buttons[i].isClicked());
    }
  }

  canPlayCard() {
    return this.envidoState !== "pending" && this.trucoState !== "pending" && !this.envidoInProgress;
  }

  calculateFaltaEnvidoPoints() {
    const pointsToWin = 30;
    const lowestScore = Math.min(this.score[0], this.score[1]);
    return pointsToWin - lowestScore;
  }

  callTruco() {
    if (this.trucoState === "not_played") {
      this.trucoState = "pending";
      this.lastTrucoPlayer = 0;
      this.logEvent("Jugador cantó Truco");
      setTimeout(() => this.respondToTruco(), 1000);
    } else if (this.trucoState === "truco" && this.lastTrucoPlayer !== 0) {
      this.trucoState = "retruco";
      this.lastTrucoPlayer = 0;
      this.logEvent("Jugador cantó Retruco");
      setTimeout(() => this.respondToTruco(), 1000);
    } else if (this.trucoState === "retruco" && this.lastTrucoPlayer !== 0) {
      this.trucoState = "vale_cuatro";
      this.lastTrucoPlayer = 0;
      this.logEvent("Jugador cantó Vale Cuatro");
      setTimeout(() => this.respondToTruco(), 1000);
    }
  }

  waitForPlayerEnvidoResponse() {
    this.showPlayerResponseButtons = true;
    this.buttons = [];
    const buttonWidth = min(150, windowWidth * 0.25);
    const buttonHeight = min(50, windowHeight * 0.1);
    const buttonSpacing = min(15, windowWidth * 0.03);
    const startY = windowHeight * 0.5;

    let options = ["Quiero", "No Quiero", "Envido", "Real Envido", "Falta Envido"];

    const totalWidth = options.length * buttonWidth + (options.length - 1) * buttonSpacing;
    const startX = (windowWidth - totalWidth) / 2;

    for (let i = 0; i < options.length; i++) {
      const buttonX = startX + i * (buttonWidth + buttonSpacing);
      this.buttons.push(new Button(options[i], buttonX, startY, buttonWidth, buttonHeight));
    }
  }

  handlePlayerEnvidoResponse(response) {
    this.showPlayerResponseButtons = false;
    this.buttons = [];
    
    if (response === "Flor") {
      this.callFlor();
      return;
    }
    
    if (response === "Quiero") {
      const playerPoints = this.players[0].calculateEnvido();
      const aiPoints = this.players[1].calculateEnvido();
      this.envidoPoints = [playerPoints, aiPoints];
      this.envidoDisplayTime = Date.now();
      
      let winner;
      if (playerPoints === aiPoints) {
        winner = this.mano;
      } else {
        winner = playerPoints > aiPoints ? 0 : 1;
      }
      
      this.score[winner] += this.currentBet;
      this.logEvent(`${this.players[winner].name} ganó el Envido con ${this.envidoPoints[winner]} puntos`);
      if (winner === this.mano) {
        this.logEvent("(Ganó por ser mano)");
      }
      this.envidoState = "played";
    } else if (response === "No Quiero") {
      const pointsLost = Math.floor(this.currentBet / 2);
      this.score[1] += pointsLost;
      this.logEvent(`${this.players[0].name} no quiso el Envido. ${this.players[1].name} ganó ${pointsLost} punto(s)`);
      this.envidoState = "played";
    } else if (response === "Envido") {
      this.currentBet += 2;
      this.logEvent(`${this.players[0].name} cantó Envido Envido`);
      setTimeout(() => this.handleAIEnvidoResponse(), 1000);
      return;
    } else if (response === "Real Envido") {
      this.currentBet += 3;
      this.logEvent(`${this.players[0].name} cantó Real Envido`);
      setTimeout(() => this.handleAIEnvidoResponse(), 1000);
      return;
    } else if (response === "Falta Envido") {
      this.currentBet = this.calculateFaltaEnvidoPoints();
      this.logEvent(`${this.players[0].name} cantó Falta Envido`);
      setTimeout(() => this.handleAIEnvidoResponse(), 1000);
      return;
    }

    this.envidoInProgress = false;
    
    if (this.pendingTrucoState) {
      this.trucoState = this.pendingTrucoState;
      this.pendingTrucoState = null;
      this.waitForPlayerTrucoResponse();
    } else if (this.currentPlayer === 1) {
      setTimeout(() => this.playAI(), 1000);
    }
  }

  handleAIEnvidoResponse() {
    const aiPoints = this.players[1].calculateEnvido();
    
    if (aiPoints >= 28 || (aiPoints >= 25 && Math.random() < 0.7)) {
      this.logEvent(`${this.players[1].name} quiere el Envido`);
      const playerPoints = this.players[0].calculateEnvido();
      this.envidoPoints = [playerPoints, aiPoints];
      this.envidoDisplayTime = Date.now();
      
      let winner;
      if (playerPoints === aiPoints) {
        winner = this.mano;
      } else {
        winner = playerPoints > aiPoints ? 0 : 1;
      }
      
      this.score[winner] += this.currentBet;
      this.logEvent(`${this.players[winner].name} ganó el Envido con ${this.envidoPoints[winner]} puntos`);
      if (winner === this.mano) {
        this.logEvent("(Ganó por ser mano)");
      }
    } else {
      const pointsWon = Math.floor(this.currentBet / 2);
      this.score[0] += pointsWon;
      this.logEvent(`${this.players[1].name} no quiso el Envido. ${this.players[0].name} ganó ${pointsWon} puntos`);
    }
    
    this.envidoState = "played";
    this.envidoInProgress = false;
    
    if (this.pendingTrucoState) {
      this.trucoState = this.pendingTrucoState;
      this.pendingTrucoState = null;
      this.waitForPlayerTrucoResponse();
    } else if (this.currentPlayer === 1) {
      setTimeout(() => this.playAI(), 1000);
    }
  }

  canCallFlor() {
    return (
      this.florState === "not_played" &&
      this.round === 1 &&
      this.players[0].playedCards.length === 0 &&
      this.players[0].hasFlor() &&
      !this.players[0].hasShownFlor
    );
  }

  touchStarted() {
    if (!this.isGameReady || this.gameOver) return;
    this.handleMousePressed();
    return false;
  }

  touchMoved() {
    if (!this.isGameReady) return;
    this.handleMouseMoved();
    return false;
  }
}

function touchStarted() {
  if (game) {
    game.touchStarted();
  }
  return false;
}

function touchMoved() {
  if (game) {
    game.touchMoved();
  }
  return false;
}