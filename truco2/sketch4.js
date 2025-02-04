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
    this.width = 0;  // Inicializar en 0, se actualizará con updateCardSize
    this.height = 0;
    this.angle = 0;
    this.targetAngle = 0;
    this.scale = 1;
    this.targetScale = 1;
    this.isHovered = false;
  }

  updateCardSize(width, height) {
    this.width = width;
    this.height = height;
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
    
    const suitCards = {};
    for (const card of this.hand) {
      if (!suitCards[card.suit]) {
        suitCards[card.suit] = [];
      }
      suitCards[card.suit].push(card.rank);
    }
    
    for (const suit in suitCards) {
      if (suitCards[suit].length === 3) {
        const values = suitCards[suit]
          .map(rank => rank <= 7 ? rank : 0)
          .reduce((sum, val) => sum + val, 20); // 20 puntos base + suma de cartas
        return values;
      }
    }
    return 0;
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
    this.isDisabled = false;
  }

  display() {
    push();
    if (this.isDisabled) {
      fill(150); // Gris para botón deshabilitado
    } else if (this.isHovered) {
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
    if (this.isDisabled) return false;
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

    // Guardar tamaños base de cartas como propiedades de la clase
    const baseSize = min(windowWidth, windowHeight);
    const isLandscape = windowWidth > windowHeight;
    this.cardWidth = isLandscape ? min(baseSize * 0.15, 130) : min(baseSize * 0.2, 160);
    this.cardHeight = this.cardWidth * 1.5;
    
    this.dealNewHand();
    this.updateResponsiveLayout();
  }

  updateResponsiveLayout() {
    const baseSize = min(windowWidth, windowHeight);
    const isLandscape = windowWidth > windowHeight;

    // Optimización específica para escritorio o móvil
    if (isLandscape) {
        // Escritorio
        this.cardWidth = min(baseSize * 0.15, 130);
        this.cardHeight = this.cardWidth * 1.5;
        
        this.cardSpacing = min(windowWidth * 0.09, baseSize * 0.11);
        this.centerX = windowWidth * 0.35;
        this.centerY = windowHeight * 0.35;
        
        this.logWidth = min(windowWidth * 0.2, 280);
        this.logHeight = windowHeight * 0.35;
        this.logY = windowHeight * 0.02;
        this.logX = windowWidth * 0.02;
        
        this.computerHandY = this.logY;
        this.playerHandY = windowHeight * 0.75;
        
        this.buttonWidth = min(baseSize * 0.13, 120);
        this.buttonHeight = min(baseSize * 0.06, 40);
        this.buttonX = windowWidth * 0.88;
        
        this.playedCardSpacingX = baseSize * 0.11;
        this.playedCardSpacingY = baseSize * 0.11;
        
        this.titleFontSize = min(18, this.logWidth * 0.06);
        this.messageFontSize = min(14, this.logWidth * 0.05);
    } else {
        // Móvil
        this.cardWidth = min(baseSize * 0.2, 125);
        this.cardHeight = this.cardWidth * 1.5;
        
        this.cardSpacing = min(windowWidth * 0.29, baseSize * 0.29);
        this.centerX = windowWidth * 0.42;
        this.centerY = windowHeight * 0.5;
        
        this.playerHandY = windowHeight * 0.85;
        this.computerHandY = windowHeight * 0.12;
        
        this.buttonWidth = min(baseSize * 0.2, 180);
        this.buttonHeight = min(baseSize * 0.09, 60);
        this.buttonX = windowWidth * 0.73;
        
        this.logWidth = min(windowWidth * 0.9, 500);
        this.logHeight = windowHeight * 0.2;
        this.logY = windowHeight * 0.02;
        this.logX = (windowWidth - this.logWidth) / 2;
        
        this.playedCardSpacingX = baseSize * 0.19;
        this.playedCardSpacingY = baseSize * 0.41;
        
        this.titleFontSize = min(22, this.logWidth * 0.08);
        this.messageFontSize = min(18, this.logWidth * 0.06);
    }

    // Actualizar tamaños de todas las cartas existentes
    this.updateAllCardSizes();
  }

  updateAllCardSizes() {
    // Actualizar cartas en las manos y jugadas
    this.players.forEach(player => {
      player.hand.forEach(card => card.updateCardSize(this.cardWidth, this.cardHeight));
      player.playedCards.forEach(card => card.updateCardSize(this.cardWidth, this.cardHeight));
    });

    // Actualizar cartas en el mazo
    if (this.deck && this.deck.cards) {
      this.deck.cards.forEach(card => card.updateCardSize(this.cardWidth, this.cardHeight));
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
          card.updateCardSize(this.cardWidth, this.cardHeight);
          
          // Posiciones iniciales del mazo
          card.x = width / 2 - this.cardWidth / 2;
          card.y = height / 2 - this.cardHeight / 2;
          
          player.hand.push(card);
          
          // Posiciones finales según el layout responsivo
          const targetX = playerIndex === 0 ? 
              width * 0.3 + i * this.cardSpacing : 
              width * 0.3 + i * this.cardSpacing;
              
          const targetY = playerIndex === 0 ? 
              this.playerHandY : 
              this.computerHandY;
          
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

      const playerHasFlor = this.players[0].hasFlor();
      const computerHasFlor = this.players[1].hasFlor();

      if (this.round === 1 && this.envidoState === "not_played" && 
          !playerHasFlor && !computerHasFlor && 
          this.players[1].playedCards.length === 0 && 
          this.florState === "not_played") {
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
    const isLandscape = windowWidth > windowHeight;
    
    const buttonWidth = isLandscape ?
        min(120, windowWidth * 0.12) : 
        min(160, windowWidth * 0.35);
    
    const buttonHeight = isLandscape ?
        min(40, windowHeight * 0.06) : 
        min(50, windowHeight * 0.06);
    
    const buttonSpacing = isLandscape ?
        min(12, windowWidth * 0.015) :
        min(20, windowWidth * 0.04);
    
    const startY = windowHeight * (isLandscape ? 0.3 : 0.5);

    let options = ["Quiero", "No Quiero"];
    
    // Si la computadora cantó truco
    if (this.lastTrucoPlayer === 1) {
        if (this.trucoState === "pending" || this.trucoState === "truco") {
            // Si es primera ronda y no se jugó envido, mostrar opciones de envido
            if (this.round === 1 && this.envidoState === "not_played") {
                const playerHasFlor = this.players[0].hasFlor();
                const computerHasFlor = this.players[1].hasFlor();
                if (!playerHasFlor && !computerHasFlor) {
                    options = ["Quiero", "No Quiero", "Envido", "Real Envido", "Falta Envido", "Retruco"];
                } else {
                    options = ["Quiero", "No Quiero", "Retruco"];
                }
            } else {
                options = ["Quiero", "No Quiero", "Retruco"];
            }
        } else if (this.trucoState === "retruco") {
            options = ["Quiero", "No Quiero", "Vale Cuatro"];
        }
    }

    // Calcular disposición en dos columnas si hay más de 3 opciones
    const useColumns = !isLandscape && options.length > 3;
    const columns = useColumns ? 2 : 1;
    const rows = Math.ceil(options.length / columns);
    
    const totalWidth = columns * buttonWidth + (columns - 1) * buttonSpacing;
    const totalHeight = rows * buttonHeight + (rows - 1) * buttonSpacing;
    const startX = (windowWidth - totalWidth) / 2;

    options.forEach((label, i) => {
        if (useColumns) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = startX + col * (buttonWidth + buttonSpacing);
            const y = startY + row * (buttonHeight + buttonSpacing);
            this.buttons.push(new Button(label, x, y, buttonWidth, buttonHeight));
        } else {
            const y = startY + i * (buttonHeight + buttonSpacing);
            this.buttons.push(new Button(label, startX, y, buttonWidth, buttonHeight));
        }
    });
  }

  handlePlayerTrucoResponse(response) {
    this.showPlayerResponseButtons = false;
    this.buttons = [];
    
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
    } else if (["Envido", "Real Envido", "Falta Envido"].includes(response)) {
        // Anular el truco y procesar el envido
        const previousTrucoState = this.trucoState;
        this.trucoState = "not_played";
        this.lastTrucoPlayer = null;
        
        if (response === "Envido") {
            this.callEnvido();
        } else if (response === "Real Envido") {
            this.callRealEnvido();
        } else if (response === "Falta Envido") {
            this.callFaltaEnvido();
        }
        
        this.logEvent(`Se anuló el ${previousTrucoState}`);
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
    this.displayFlorResult();

    if (this.showPlayerResponseButtons) {
      for (const button of this.buttons) {
        button.display();
      }
    } else if (this.currentPlayer === 0 && !this.envidoInProgress && !this.florInProgress) {
      const buttonStartY = windowHeight * 0.3;
      const buttonSpacing = windowHeight * 0.08;
      
      this.buttons = [];
      let currentY = buttonStartY;

      // Mostrar Flor si corresponde
      if (this.canCallFlor() && this.florState !== "played" && !this.players[0].hasShownFlor) {
        this.buttons.push(new Button("Flor", this.buttonX, currentY, this.buttonWidth, this.buttonHeight));
        currentY += buttonSpacing;
      }

      // Mostrar opciones de envido solo si no hay flor
      const playerHasFlor = this.players[0].hasFlor();
      const computerHasFlor = this.players[1].hasFlor();
      if (!playerHasFlor && !computerHasFlor) {
        if (this.canCallEnvido()) {
          this.buttons.push(new Button("Envido", this.buttonX, currentY, this.buttonWidth, this.buttonHeight));
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
      }

      // Mostrar opciones de truco
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

      // Siempre mostrar "Ir al mazo"
      this.buttons.push(new Button("Ir al mazo", this.buttonX, currentY, this.buttonWidth, this.buttonHeight));

      for (const button of this.buttons) {
        button.display();
      }
    }
  }

  displayPlayedCards() {
    const isLandscape = windowWidth > windowHeight;
    const verticalSpacing = isLandscape ? 0.14 : 0.55;  // Reducido en escritorio de 0.16 a 0.14
    
    // Cartas del jugador
    if (this.players && this.players[0] && this.players[0].playedCards) {
      this.players[0].playedCards.forEach((card, i) => {
        if (card) {
          const x = this.centerX + (i - 1) * this.playedCardSpacingX;
          const y = this.centerY + this.playedCardSpacingY * verticalSpacing;
          card.targetAngle = 0;
          card.display(x, y);
        }
      });
    }

    // Cartas de la computadora
    if (this.players && this.players[1] && this.players[1].playedCards) {
      this.players[1].playedCards.forEach((card, i) => {
        if (card) {
          const x = this.centerX + (i - 1) * this.playedCardSpacingX;
          const y = this.centerY - this.playedCardSpacingY * verticalSpacing;
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

  displayFlorResult() {
    if (this.florPoints && this.florDisplayTime) {
      const timeSinceFlor = Date.now() - this.florDisplayTime;
      if (timeSinceFlor < 3000) {
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

        textSize(titleSize);
        textStyle(BOLD);
        fill(255, 200, 0); // Color dorado para el título
        textAlign(CENTER, CENTER);
        text("Flor", windowWidth/2, y + messageHeight * 0.25);

        // Mostrar puntos
        textSize(textSize1);
        textStyle(NORMAL);
        fill(255);
        if (this.florPoints[0] > 0) {
          text(`Jugador mostró Flor con ${this.florPoints[0]} puntos`, windowWidth/2, y + messageHeight * 0.5);
        } else if (this.florPoints[1] > 0) {
          text(`Computadora mostró Flor con ${this.florPoints[1]} puntos`, windowWidth/2, y + messageHeight * 0.5);
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
    if (this.players[1].hasFlor() && !this.players[1].hasShownFlor && this.round === 1) {
      const aiFlorPoints = this.players[1].calculateFlorPoints();
      this.score[1] += 3;
      this.logEvent(`Computadora mostró Flor (${aiFlorPoints} puntos) y ganó 3 puntos`);
      
      // Mostrar los puntos de la Flor
      this.florPoints = [0, aiFlorPoints];
      this.florDisplayTime = Date.now();
      
      this.florState = "played";
      this.players[1].hasShownFlor = true;

      if (this.score[1] >= 30) {
        this.gameOver = true;
        this.logEvent(`${this.players[1].name} ganó el juego`);
      }
    }
    
    if (this.currentPlayer === 1 && !this.gameOver) {
      setTimeout(() => this.playAI(), 1000);
    }
  }

  waitForPlayerFlorResponse() {
    this.showPlayerResponseButtons = true;
    this.buttons = [];
    const isLandscape = windowWidth > windowHeight;
    
    const buttonWidth = isLandscape ?
      min(160, windowWidth * 0.25) :
      min(180, windowWidth * 0.25);
    
    const buttonHeight = isLandscape ?
      min(50, windowHeight * 0.1) :
      min(60, windowHeight * 0.1);
    
    const startY = windowHeight * (isLandscape ? 0.3 : 0.5);

    // Solo mostrar el botón "Mostrar"
    const startX = windowWidth/2 - buttonWidth/2;
    this.buttons.push(new Button("Mostrar", startX, startY, buttonWidth, buttonHeight));
  }

  handlePlayerFlorResponse(response) {
    if (response === "Mostrar") {
      // Sumar 3 puntos inmediatamente
      this.score[0] += 3;
      const playerFlorPoints = this.players[0].calculateFlorPoints();
      this.logEvent(`Jugador mostró Flor y ganó 3 puntos`);
      
      // Mostrar los puntos de la Flor
      this.florPoints = [playerFlorPoints, 0];
      this.florDisplayTime = Date.now();
      
      // Limpiar estados
      this.showPlayerResponseButtons = false;
      this.buttons = [];
      this.florInProgress = false;
      this.florState = "played";
      this.players[0].hasShownFlor = true;

      // Verificar si el juego terminó
      if (this.score[0] >= 30) {
        this.gameOver = true;
        this.logEvent(`${this.players[0].name} ganó el juego`);
      } else if (this.currentPlayer === 1) {
        setTimeout(() => this.playAI(), 1000);
      }
    }
  }

  waitForPlayerEnvidoResponse() {
    this.showPlayerResponseButtons = true;
    this.buttons = [];
    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonSpacing = 10;
    const startY = height * 0.4;

    if (!this.envidoResponseState) {
        // Primera respuesta: Quiero, No Quiero, etc.
        let options = ["Quiero", "No Quiero"];
        
        // Mostrar todas las opciones si es la primera mano y el jugador es mano
        // o si la computadora cantó envido después de que el jugador jugó siendo mano
        if ((this.round === 1 && this.players[0].playedCards.length === 0) || 
            (this.round === 1 && this.mano === 0 && this.players[0].playedCards.length === 1)) {
            
            const playerHasFlor = this.players[0].hasFlor();
            const computerHasFlor = this.players[1].hasFlor();
            
            if (playerHasFlor && !this.players[0].hasShownFlor) {
                options = ["Quiero", "No Quiero", "Flor"];
            } else if (!playerHasFlor && !computerHasFlor) {
                options = ["Quiero", "No Quiero", "Envido", "Real Envido", "Falta Envido"];
            } else {
                options = ["Quiero", "No Quiero"];
            }
        }

        // Calcular disposición en dos columnas
        const columns = 2;
        const rows = Math.ceil(options.length / columns);
        const totalWidth = columns * buttonWidth + buttonSpacing;
        const totalHeight = rows * (buttonHeight + buttonSpacing);
        const startX = (width - totalWidth) / 2;

        options.forEach((label, i) => {
            const col = i % columns;
            const row = Math.floor(i / columns);
            const buttonX = startX + col * (buttonWidth + buttonSpacing);
            const buttonY = startY + row * (buttonHeight + buttonSpacing);
            this.buttons.push(new Button(label, buttonX, buttonY, buttonWidth, buttonHeight));
        });
    } else {
        // Segunda respuesta después de "Quiero": Son buenas o Mostrar puntos
        const playerPoints = this.players[0].calculateEnvido();
        
        const options = ["Son buenas", `${playerPoints} son mejores`];
        
        // Para estos dos botones, mantenerlos en una fila
        const totalWidth = options.length * (buttonWidth + buttonSpacing) - buttonSpacing;
        const startX = (width - totalWidth) / 2;
        
        options.forEach((label, i) => {
            const buttonX = startX + i * (buttonWidth + buttonSpacing);
            const button = new Button(label, buttonX, startY, buttonWidth, buttonHeight);
            
            // Deshabilitar el botón si los puntos del jugador son menores o iguales
            if (label.includes("son mejores") && playerPoints <= this.aiEnvidoPoints) {
                button.isDisabled = true;
                button.label = `${playerPoints} (insuficientes)`;
            }
            this.buttons.push(button);
        });
    }
  }

  handlePlayerEnvidoResponse(response) {
    if (!this.envidoInProgress) return;
    
    if (!this.envidoResponseState) {
      // Primera respuesta (Quiero, No Quiero, etc.)
      if (response === "Quiero") {
        this.envidoResponseState = "showing_points";
        this.aiEnvidoPoints = this.players[1].calculateEnvido();
        this.logEvent(`Computadora tiene ${this.aiEnvidoPoints}`);
        this.waitForPlayerEnvidoResponse();
        return;
      } else if (response === "No Quiero") {
        const pointsLost = Math.floor(this.currentBet / 2);
        this.score[1] += pointsLost;
        this.logEvent(`Jugador no quiso. Computadora ganó ${pointsLost} punto(s)`);
        this.endEnvido();
      } else if (response === "Envido") {
        this.currentBet += 2;
        this.logEvent("Jugador cantó Envido");
        setTimeout(() => this.handleAIEnvidoResponse(), 1000);
      } else if (response === "Real Envido") {
        this.currentBet += 3;
        this.logEvent("Jugador cantó Real Envido");
        setTimeout(() => this.handleAIEnvidoResponse(), 1000);
      } else if (response === "Falta Envido") {
        this.currentBet = Math.abs(30 - Math.max(this.score[0], this.score[1]));
        this.logEvent("Jugador cantó Falta Envido");
        setTimeout(() => this.handleAIEnvidoResponse(), 1000);
      } else if (response === "Flor") {
        this.callFlor();
      }
    } else {
      // Segunda respuesta (Son buenas o Mostrar puntos)
      const playerPoints = this.players[0].calculateEnvido();
      
      if (response === "Son buenas") {
        this.score[1] += this.currentBet;
        this.logEvent(`Jugador: "Son buenas" (${playerPoints})`);
        this.logEvent(`Computadora ganó ${this.currentBet} punto(s)`);
      } else if (response.includes("son mejores") && playerPoints > this.aiEnvidoPoints) {
        this.score[0] += this.currentBet;
        this.logEvent(`Jugador ganó ${this.currentBet} punto(s)`);
      }
      this.endEnvido();
    }
  }

  handleAIEnvidoResponse() {
    if (!this.envidoInProgress) return;
    
    const aiPoints = this.players[1].calculateEnvido();
    const playerPoints = this.players[0].calculateEnvido();
    
    // Decidir si quiere o no basado en los puntos
    if (aiPoints >= 28 || (aiPoints >= 25 && Math.random() < 0.7)) {
      // La computadora quiere
      this.logEvent("Computadora quiere");
      
      if (aiPoints > playerPoints) {
        this.logEvent(`${aiPoints} son mejores`);
        this.score[1] += this.currentBet;
        this.logEvent(`Computadora ganó ${this.currentBet} punto(s)`);
      } else if (aiPoints === playerPoints) {
        const winner = this.mano;
        this.score[winner] += this.currentBet;
        if (winner === 1) {
          this.logEvent(`${aiPoints} son mejores (ganó por ser mano)`);
          this.logEvent(`Computadora ganó ${this.currentBet} punto(s)`);
        } else {
          this.logEvent(`"Son buenas"`);
          this.logEvent(`Jugador ganó ${this.currentBet} punto(s)`);
        }
      } else {
        this.logEvent(`"Son buenas"`);
        this.score[0] += this.currentBet;
        this.logEvent(`Jugador ganó ${this.currentBet} punto(s)`);
      }
    } else {
      // La computadora no quiere
      this.logEvent("Computadora no quiso");
      const pointsWon = Math.floor(this.currentBet / 2);
      this.score[0] += pointsWon;
      this.logEvent(`Jugador ganó ${pointsWon} punto(s)`);
    }
    
    this.endEnvido();
  }

  endEnvido() {
    this.showPlayerResponseButtons = false;
    this.buttons = [];
    this.envidoState = "played";
    this.envidoInProgress = false;
    this.envidoResponseState = null;
    this.aiEnvidoPoints = null;
    
    if (this.currentPlayer === 1) {
      setTimeout(() => this.playAI(), 1000);
    }
  }

  callEnvido() {
    if (this.envidoState === "not_played") {
      this.envidoState = "pending";
      this.currentBet = 2;
      this.envidoInProgress = true;
      this.logEvent("Jugador cantó Envido");
      setTimeout(() => this.handleAIEnvidoResponse(), 1000);
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

  canCallEnvido() {
    const playerHasFlor = this.players[0].hasFlor();
    const computerHasFlor = this.players[1].hasFlor();
    
    return (
        this.envidoState === "not_played" &&
        this.round === 1 &&
        this.players[0].playedCards.length === 0 &&
        !this.envidoInProgress &&
        !this.florInProgress &&
        !playerHasFlor &&
        !computerHasFlor
    );
  }

  canCallRealEnvido() {
    const playerHasFlor = this.players[0].hasFlor();
    const computerHasFlor = this.players[1].hasFlor();
    
    return (
        this.envidoState === "not_played" &&
        this.round === 1 &&
        this.players[0].playedCards.length === 0 &&
        !this.envidoInProgress &&
        !this.florInProgress &&
        !playerHasFlor &&
        !computerHasFlor
    );
  }

  canCallFaltaEnvido() {
    const playerHasFlor = this.players[0].hasFlor();
    const computerHasFlor = this.players[1].hasFlor();
    
    return (
        this.envidoState === "not_played" &&
        this.round === 1 &&
        this.players[0].playedCards.length === 0 &&
        !this.envidoInProgress &&
        !this.florInProgress &&
        !playerHasFlor &&
        !computerHasFlor
    );
  }

  handleMousePressed() {
    if (!this.isGameReady || this.gameOver) return;

    if (this.showPlayerResponseButtons) {
        for (const button of this.buttons) {
            if (button.isClicked()) {
                if (this.envidoInProgress) {
                    this.handlePlayerEnvidoResponse(button.label);
                } else if (this.florInProgress) {
                    this.handlePlayerFlorResponse(button.label);
                } else {
                    this.handlePlayerTrucoResponse(button.label);
                }
                return;
            }
        }
    } else if (this.currentPlayer === 0 && !this.envidoInProgress && !this.florInProgress) {
        // Verificar botones de acción
        for (const button of this.buttons) {
            if (button.isClicked()) {
                switch (button.label) {
                    case "Flor":
                        if (this.canCallFlor()) {
                            this.florInProgress = true;
                            this.waitForPlayerFlorResponse();
                        }
                        break;
                    case "Envido":
                        if (this.canCallEnvido()) {
                            this.callEnvido();
                        }
                        break;
                    case "Real Envido":
                        if (this.canCallRealEnvido()) {
                            this.callRealEnvido();
                        }
                        break;
                    case "Falta Envido":
                        if (this.canCallFaltaEnvido()) {
                            this.callFaltaEnvido();
                        }
                        break;
                    case "Truco":
                        if (this.canCallTruco(0)) {
                            this.trucoState = "pending";
                            this.lastTrucoPlayer = 0;
                            this.logEvent("Jugador cantó Truco");
                            setTimeout(() => this.respondToTruco(), 1000);
                        }
                        break;
                    case "Retruco":
                        if (this.canCallTruco(0)) {
                            this.trucoState = "retruco";
                            this.lastTrucoPlayer = 0;
                            this.logEvent("Jugador cantó Retruco");
                            setTimeout(() => this.respondToTruco(), 1000);
                        }
                        break;
                    case "Vale Cuatro":
                        if (this.canCallTruco(0)) {
                            this.trucoState = "vale_cuatro";
                            this.lastTrucoPlayer = 0;
                            this.logEvent("Jugador cantó Vale Cuatro");
                            setTimeout(() => this.respondToTruco(), 1000);
                        }
                        break;
                    case "Ir al mazo":
                        this.handleIrAlMazo(0);
                        break;
                }
                return;
            }
        }

        // Verificar cartas del jugador
        for (let i = 0; i < this.players[0].hand.length; i++) {
            if (this.players[0].hand[i].isClicked()) {
                this.playCard(0, i);
                return;
            }
        }
    }
  }

  handleIrAlMazo(playerIndex) {
    let points = 0;
    const opponent = 1 - playerIndex;
    
    // Si no se jugó el envido y estamos en la primera ronda, son 2 puntos
    // Si ya se jugó el envido, es 1 punto
    if (this.round === 1) {
        if (this.envidoState === "not_played") {
            points = 2;
        } else {
            points = 1;
        }
    }
    
    // Sumar puntos según el estado del truco
    switch (this.trucoState) {
        case "not_played":
        points = Math.max(points, 1);
            break; // 1 puntos si no se cantó truco
        case "truco":
        case "pending":
            points = Math.max(points, 2);
            break;
        case "retruco":
            points = Math.max(points, 3);
            break;
        case "vale_cuatro":
            points = Math.max(points, 4);
            break;
    }
    
    this.score[opponent] += points;
    
    const playerName = playerIndex === 0 ? "Jugador" : "Computadora";
    const opponentName = playerIndex === 0 ? "Computadora" : "Jugador";
    this.logEvent(`${playerName} se fue al mazo. ${opponentName} ganó ${points} punto(s)`);
    this.endHand();
  }

  shouldGoToMazo() {
    // Lógica para que la computadora decida si ir al mazo
    const aiHand = this.players[1].hand;
    const strongCards = aiHand.filter(card => card.getPower() > 8).length;
    const roundScore = this.calculateRoundScore();
    
    // Si tiene muy malas cartas y va perdiendo
    if (strongCards === 0 && roundScore < 0) {
        return Math.random() < 0.3; // 30% de probabilidad de ir al mazo
    }
    
    return false;
  }

  handleMouseMoved() {
    if (!this.isGameReady) return;

    // Actualizar estado hover de los botones
    for (const button of this.buttons) {
      const mouseX = touches.length > 0 ? touches[0].x : window.mouseX;
      const mouseY = touches.length > 0 ? touches[0].y : window.mouseY;
      button.setHovered(
        mouseX > button.x && mouseX < button.x + button.width &&
        mouseY > button.y && mouseY < button.y + button.height
      );
    }

    // Actualizar estado hover de las cartas del jugador
    if (this.currentPlayer === 0 && !this.envidoInProgress && !this.florInProgress) {
      for (const card of this.players[0].hand) {
        const mouseX = touches.length > 0 ? touches[0].x : window.mouseX;
        const mouseY = touches.length > 0 ? touches[0].y : window.mouseY;
        card.setHovered(
          mouseX > card.x && mouseX < card.x + card.width &&
          mouseY > card.y && mouseY < card.y + card.height
        );
      }
    }
  }

  callRealEnvido() {
    if (this.envidoState === "not_played") {
      this.envidoState = "pending";
      this.currentBet = 3;
      this.envidoInProgress = true;
      this.logEvent("Jugador cantó Real Envido");
      setTimeout(() => this.handleAIEnvidoResponse(), 1000);
    }
  }

  callFaltaEnvido() {
    if (this.envidoState === "not_played") {
      this.envidoState = "pending";
      this.currentBet = Math.abs(30 - Math.max(this.score[0], this.score[1]));
      this.envidoInProgress = true;
      this.logEvent("Jugador cantó Falta Envido");
      setTimeout(() => this.handleAIEnvidoResponse(), 1000);
    }
  }

  canCallTruco(playerIndex) {
    return (
      (this.trucoState === "not_played" ||
       (this.trucoState === "truco" && this.lastTrucoPlayer !== playerIndex) ||
       (this.trucoState === "retruco" && this.lastTrucoPlayer !== playerIndex)) &&
      !this.envidoInProgress &&
      !this.florInProgress &&
      this.players[playerIndex].hand.length > 0
    );
  }

  decideTrucoResponse(state, round) {
    const aiHand = this.players[1].hand;
    const strongCards = aiHand.filter(card => card.getPower() > 10).length;
    const roundScore = this.calculateRoundScore();
    
    // Si tiene cartas fuertes o va ganando, es más probable que acepte o suba
    if (strongCards > 0 || roundScore > 0) {
      if (state === "vale_cuatro") {
        return Math.random() < 0.7 ? "accept" : "reject";
      }
      return Math.random() < 0.6 ? "raise" : "accept";
    }
    
    // Con cartas débiles, más probable que rechace
    if (state === "vale_cuatro" || strongCards === 0) {
      return Math.random() < 0.7 ? "reject" : "accept";
    }
    
    return Math.random() < 0.5 ? "accept" : "reject";
  }

  calculateRoundScore() {
    let score = 0;
    for (let i = 0; i < this.round - 1; i++) {
      if (this.trickWinner[i] === 1) score++;
      else if (this.trickWinner[i] === 0) score--;
    }
    return score;
  }

  getHighestCardIndex(hand) {
    let maxIndex = 0;
    for (let i = 1; i < hand.length; i++) {
      if (hand[i].compareWith(hand[maxIndex]) > 0) {
        maxIndex = i;
      }
    }
    return maxIndex;
  }

  getLowestCardIndex(hand) {
    let minIndex = 0;
    for (let i = 1; i < hand.length; i++) {
      if (hand[i].compareWith(hand[minIndex]) < 0) {
        minIndex = i;
      }
    }
    return minIndex;
  }

  getLowestWinningCardIndex(hand, targetCard) {
    let winningIndex = -1;
    let lowestPower = Infinity;
    
    for (let i = 0; i < hand.length; i++) {
      if (hand[i].compareWith(targetCard) > 0 && hand[i].getPower() < lowestPower) {
        winningIndex = i;
        lowestPower = hand[i].getPower();
      }
    }
    
    return winningIndex;
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
