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
}

class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.width = 80;
    this.height = 120;
    this.angle = 0;
    this.targetAngle = 0;
    this.scale = 1;
    this.targetScale = 1;
    this.isHovered = false;
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
    return mouseX > this.x && mouseX < this.x + scaledWidth && mouseY > this.y && mouseY < this.y + scaledHeight;
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
    this.width = width;
    this.height = height;
    this.isHovered = false;
  }

  display() {
    push();
    if (this.isHovered) {
      fill(72, 172, 239);
    } else {
      fill(52, 152, 219);
    }
    rect(this.x, this.y, this.width, this.height, 5);
    fill(255);
    textSize(16);
    textAlign(CENTER, CENTER);
    text(this.label, this.x + this.width / 2, this.y + this.height / 2);
    pop();
  }

  isClicked() {
    return mouseX > this.x && mouseX < this.x + this.width && mouseY > this.y && mouseY < this.y + this.height;
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
    // Sistema de banderas para controlar interacciones
    this.interactionFlags = {
      canInteract: false,           // Bandera general de interacción
      isDealing: false,             // Si se están repartiendo cartas
      isAnimating: false,           // Si hay alguna animación en curso
      isWaitingAIResponse: false,   // Si se espera respuesta de la AI
      isProcessingAction: false     // Si se está procesando alguna acción
    };
    this.dealNewHand();
  }

  dealNewHand() {
    if (this.gameOver) return;

    // El juego no está listo mientras se reparten las cartas
    this.isGameReady = false;
    this.interactionFlags.canInteract = false;
    this.interactionFlags.isDealing = true;
    this.interactionFlags.isAnimating = true;

    // Limpiar estados
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

    // Repartir cartas con animación
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

    // Esperar a que terminen las animaciones antes de continuar
    if (dealingTimeout) {
      clearTimeout(this.aiPlayTimeout);
      this.aiPlayTimeout = setTimeout(() => {
        this.currentPlayer = this.mano;
        this.logEvent("Nueva mano repartida");
        this.logEvent(`${this.players[this.currentPlayer].name} es mano`);

        // Ahora el juego está listo para recibir interacciones
        this.isGameReady = true;
        this.interactionFlags.canInteract = true;
        this.interactionFlags.isDealing = false;
        this.interactionFlags.isAnimating = false;

        // Verificar flor después de repartir
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

        // Si la computadora es mano, juega
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

    // Configuración de posiciones
    const centerX = width * 0.4;
    const centerY = height * 0.4;
    const cardSpacing = min(90, width / 10);

    // Posición inicial (desde la mano)
    card.x = width * 0.3 + cardIndex * cardSpacing;
    card.y = playerIndex === 0 ? height * 0.7 : height * 0.1;
    
    // Posición final (en la mesa)
    card.targetX = centerX - cardSpacing + player.playedCards.length * cardSpacing;
    card.targetY = centerY + (playerIndex === 0 ? cardSpacing * 0.5 : -cardSpacing * 0.5);
    
    // Rotación inicial y final (para la animación)
    card.angle = playerIndex === 0 ? PI : -PI;  // Giro completo al inicio
    card.targetAngle = 0; // Sin rotación al final
    
    // Escala durante la animación
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
      // Si la computadora tiene flor en la primera mano, debe cantarla antes que el envido
      if (this.round === 1 && this.players[1].playedCards.length === 0 && this.players[1].hasFlor() && this.florState === "not_played") {
        this.handleAIFlor();
        return;
      }

      // Si no tiene flor, puede cantar envido
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

      // Decisión de cantar truco
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

      // Lógica para jugar cartas
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
    let baseChance = 0.3; // Probabilidad base de cantar truco

    // Aumentar la probabilidad si tiene buenas cartas
    if (strongCards > 1) baseChance += 0.2;
    if (strongCards > 0) baseChance += 0.1;

    // Ajustar según la ronda
    if (round === 1) baseChance += 0.1;
    if (round === 3) baseChance -= 0.1;

    // Ajustar según si va ganando
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
    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonSpacing = 10;
    const startY = height * 0.5;

    let options = ["Quiero", "No Quiero"];
    
    // Si es la primera mano, la computadora es mano y no se cantó envido
    if (this.round === 1 && 
        this.envidoState === "not_played" && 
        this.players[0].playedCards.length === 0 && 
        this.mano === 1) {
      options = ["Quiero", "No Quiero", "Envido", "Real Envido", "Falta Envido", "Retruco"];
    } else if (!this.envidoInProgress) {
      // Agregar opciones de truco si corresponde
      if (this.trucoState === "pending") {
        options.push("Retruco");
      } else if (this.trucoState === "truco" && this.lastTrucoPlayer !== 0) {
        options.push("Retruco");
      } else if (this.trucoState === "retruco" && this.lastTrucoPlayer !== 0) {
        options.push("Vale Cuatro");
      }
    }

    const totalWidth = options.length * buttonWidth + (options.length - 1) * buttonSpacing;
    const startX = (width - totalWidth) / 2;

    for (let i = 0; i < options.length; i++) {
      const buttonX = startX + i * (buttonWidth + buttonSpacing);
      this.buttons.push(new Button(options[i], buttonX, startY, buttonWidth, buttonHeight));
    }
  }

  handlePlayerTrucoResponse(response) {
    this.showPlayerResponseButtons = false;
    this.buttons = [];
    
    // Manejar respuestas de envido si es la primera mano y la computadora es mano
    if (["Envido", "Real Envido", "Falta Envido"].includes(response) && 
        this.round === 1 && 
        this.mano === 1) {
      // Anular completamente el canto de truco
      this.trucoState = "not_played";
      this.lastTrucoPlayer = null;
      
      // Procesar el canto de envido
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
      this.logEvent(`Computadora aceptó el ${this.trucoState}`);
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
      this.logEvent(`Computadora no quiso el ${this.trucoState}. Jugador ganó ${points} punto(s)`);
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
    image(tableImage, 0, 0, width, height);

    this.players[0].displayHand(width * 0.3, height * 0.7);
    this.players[1].displayHand(width * 0.3, height * 0.1, true);

    this.displayPlayedCards();

    textSize(24);
    fill(255);
    text(`${this.players[0].name}: ${this.score[0]}`, width * 0.02, height * 0.95);
    text(`${this.players[1].name}: ${this.score[1]}`, width * 0.02, height * 0.05);

    // Mostrar los botones de respuesta si es necesario
    if (this.showPlayerResponseButtons) {
      for (const button of this.buttons) {
        button.display();
      }
    } else if (this.currentPlayer === 0 && !this.envidoInProgress && !this.florInProgress) {
      this.buttons = [];
      if (this.canCallFlor() && this.florState !== "played" && !this.players[0].hasShownFlor) {
        this.buttons.push(new Button("Flor", width * 0.75, height * 0.4, 100, 40));
      }
      if (this.canCallEnvido()) {
        this.buttons.push(new Button("Envido", width * 0.75, height * 0.5, 100, 40));
      }
      if (this.canCallTruco(0)) {
        if (this.trucoState === "not_played") {
          this.buttons.push(new Button("Truco", width * 0.75, height * 0.6, 100, 40));
        } else if (this.trucoState === "truco" && this.lastTrucoPlayer !== 0) {
          this.buttons.push(new Button("Retruco", width * 0.75, height * 0.6, 100, 40));
        } else if (this.trucoState === "retruco" && this.lastTrucoPlayer !== 0) {
          this.buttons.push(new Button("Vale Cuatro", width * 0.75, height * 0.6, 100, 40));
        }
      }
      if (this.canCallRealEnvido()) {
        this.buttons.push(new Button("Real Envido", width * 0.75, height * 0.7, 100, 40));
      }
      if (this.canCallFaltaEnvido()) {
        this.buttons.push(new Button("Falta Envido", width * 0.75, height * 0.8, 100, 40));
      }
      this.buttons.push(new Button("Ir al mazo", width * 0.75, height * 0.9, 100, 40));

      for (const button of this.buttons) {
        button.display();
      }
    }

    this.displayGameLog();

    // Mostrar el resultado del envido en la primera mano
    if (this.envidoPoints[0] > 0 || this.envidoPoints[1] > 0) {
      const timeSinceEnvido = Date.now() - this.envidoDisplayTime;
      if (timeSinceEnvido < 3000) { // Mostrar por 3 segundos
        push();
        fill(0, 0, 0, 200);
        rect(width / 2 - 200, height / 2 - 100, 400, 100);
        textSize(24);
        fill(255);
        textAlign(CENTER, CENTER);
        text(
          "Resultado del Envido:",
          width / 2,
          height / 2 - 80
        );
        text(
          `${this.players[0].name}: ${this.envidoPoints[0]} - ${this.players[1].name}: ${this.envidoPoints[1]}`,
          width / 2,
          height / 2 - 50
        );
        if (this.envidoPoints[0] === this.envidoPoints[1]) {
          text("(Gana el mano)", width / 2, height / 2 - 20);
        } else {
          const winner = this.envidoPoints[0] > this.envidoPoints[1] ? this.players[0].name : this.players[1].name;
          text(`Ganador: ${winner}`, width / 2, height / 2 - 20);
        }
        pop();
      }
    }

    if (this.gameOver) {
      textSize(48);
      fill(255);
      text(`¡${this.players[this.handWinner].name} gana!`, width / 2, height / 2);
    }
  }

  displayPlayedCards() {
    const centerX = width * 0.4;  // Centro de la mesa
    const centerY = height * 0.4;  // Centro de la mesa
    const cardSpacing = min(90, width / 10);

    // Verificar que los jugadores y sus cartas jugadas existan
    if (this.players && this.players[0] && this.players[0].playedCards) {
      for (let i = 0; i < this.players[0].playedCards.length; i++) {
        const card = this.players[0].playedCards[i];
        if (card) {
          // Cartas del jugador abajo
          const x = centerX - cardSpacing + i * cardSpacing;
          const y = centerY + cardSpacing * 0.5;
          card.targetAngle = 0; // Sin rotación
          card.display(x, y);
        }
      }
    }

    if (this.players && this.players[1] && this.players[1].playedCards) {
      for (let i = 0; i < this.players[1].playedCards.length; i++) {
        const card = this.players[1].playedCards[i];
        if (card) {
          // Cartas de la computadora arriba
          const x = centerX - cardSpacing + i * cardSpacing;
          const y = centerY - cardSpacing * 0.5;
          card.targetAngle = 0; // Sin rotación
          card.display(x, y);
        }
      }
    }
  }

  displayGameLog() {
    fill(0, 0, 0, 150);
    rect(width * 0.01, height * 0.1, width * 0.2, height * 0.3);
    fill(255);
    textSize(14);
    textAlign(LEFT, TOP);
    let y = height * 0.11;
    for (let i = this.gameLog.length - 1; i >= Math.max(0, this.gameLog.length - 10); i--) {
      text(this.gameLog[i], width * 0.02, y);
      y += height * 0.03;
    }
  }

  logEvent(event) {
    this.gameLog.push(event);
  }

  handleAIFlor() {
    this.logEvent("Computadora tiene Flor");
    this.florState = "flor";
    this.currentBet = 3;
    this.florInProgress = true;
    this.logEvent("Computadora cantó Flor");
    
    // Si el jugador también tiene flor, debe responder
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
    const buttonWidth = 140;
    const buttonHeight = 40;
    const buttonSpacing = 10;
    const startY = height * 0.5;

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
    const startX = (width - totalWidth) / 2;

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
      // Sumar 3 puntos fijos al mostrar flor
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

    // Factores que influyen en la decisión
    const hasGoodHand = strongCards >= Math.ceil(remainingCards / 2);
    const isLastRound = round === 3;
    const isFirstRound = round === 1;

    if (currentState === "pending") { // Respuesta al Truco
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
    } else if (currentState === "retruco") { // Respuesta al Retruco
      if (hasGoodHand && !isLastRound) {
        return Math.random() < 0.3 ? "raise" : "accept";
      } else if (isWinning || hasGoodHand) {
        return Math.random() < 0.6 ? "accept" : "reject";
      } else {
        return Math.random() < 0.2 ? "accept" : "reject";
      }
    } else if (currentState === "vale_cuatro") { // Respuesta al Vale Cuatro
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
      this.envidoState = "accepted";
      const playerEnvidoPoints = this.players[0].calculateEnvido();
      this.envidoPoints = [playerEnvidoPoints, aiEnvidoPoints];
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
    this.buttons = []; // Limpiamos los botones
    if (this.envidoState === "pending") {
      this.handlePlayerEnvidoResponse(response);
    } else if (this.trucoState === "pending" || this.trucoState === "truco" || this.trucoState === "retruco") {
      this.handlePlayerTrucoResponse(response);
    }
  }

  handleMousePressed() {
    // Si el juego no está listo o está terminado, ignorar cualquier interacción
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
  }

  handleMouseMoved() {
    // Solo procesar el hover si el juego está listo
    if (!this.isGameReady) return;

    // Hover effect for player's cards
    for (let i = 0; i < this.players[0].hand.length; i++) {
      const card = this.players[0].hand[i];
      card.setHovered(card.isClicked());
    }

    // Hover effect for buttons
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
    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonSpacing = 10;
    const startY = height * 0.5;

    // Siempre mostrar todas las opciones de envido en primera mano
    let options = ["Quiero", "No Quiero", "Envido", "Real Envido", "Falta Envido"];

    const totalWidth = options.length * buttonWidth + (options.length - 1) * buttonSpacing;
    const startX = (width - totalWidth) / 2;

    for (let i = 0; i < options.length; i++) {
      const buttonX = startX + i * (buttonWidth + buttonSpacing);
      this.buttons.push(new Button(options[i], buttonX, startY, buttonWidth, buttonHeight));
    }
  }

  handlePlayerEnvidoResponse(response) {
    this.showPlayerResponseButtons = false;
    this.buttons = [];
    
    if (response === "Flor") {
      // Si el jugador canta flor en respuesta al envido
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
    
    // Restaurar el estado del truco si estaba pendiente
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
    
    // Restaurar el estado del truco si estaba pendiente
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
}
