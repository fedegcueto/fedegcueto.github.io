// Configuración global y variables
let game;
const cardImages = {};
let backImage;
let tableImage;

function preload() {
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
  game.handleMousePressed();
}

function mouseMoved() {
  game.handleMouseMoved();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Clase Animation
class Animation {
  constructor(startProps, endProps, duration) {
    this.startProps = startProps;
    this.endProps = endProps;
    this.duration = duration;
    this.startTime = millis();
  }

  update() {
    const t = (millis() - this.startTime) / this.duration;
    if (t >= 1) return this.endProps;

    const currentProps = {};
    for (let prop in this.startProps) {
      currentProps[prop] = lerp(this.startProps[prop], this.endProps[prop], t);
    }
    return currentProps;
  }

  isFinished() {
    return (millis() - this.startTime) >= this.duration;
  }
}

// Clase Card
class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.x = 0;
    this.y = 0;
    this.width = 80;
    this.height = 120;
    this.angle = 0;
    this.scale = 1;
    this.isHovered = false;
    this.animation = null;
  }

  animate(endProps, duration) {
    const startProps = {
      x: this.x,
      y: this.y,
      angle: this.angle,
      scale: this.scale
    };
    this.animation = new Animation(startProps, endProps, duration);
  }

  display(faceDown = false) {
    if (this.animation) {
      const props = this.animation.update();
      this.x = props.x;
      this.y = props.y;
      this.angle = props.angle;
      this.scale = props.scale;
      if (this.animation.isFinished()) {
        this.animation = null;
      }
    }

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
    this.scale = isHovered ? 1.1 : 1;
  }

  getPower() {
    const rankPower = {
      1: 14, // Ancho
      7: 13, // Siete de espadas
      7: 12, // Siete de oro
      3: 11,
      2: 10,
      1: 9, // Otros anchos
      12: 8,
      11: 7,
      10: 6,
      7: 5, // Otros sietes
      6: 4,
      5: 3,
      4: 2,
    };

    if (this.rank === 1 && this.suit === "espada") return 15; // Ancho de espadas
    if (this.rank === 1 && this.suit === "basto") return 14; // Ancho de bastos
    if (this.rank === 7 && this.suit === "espada") return 13;
    if (this.rank === 7 && this.suit === "oro") return 12;

    return rankPower[this.rank] || 0;
  }

  compareWith(other) {
    return this.getPower() - other.getPower();
  }

  toString() {
    return `${this.rank} de ${this.suit}`;
  }
}

// Clase Deck
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
      card.animate({
        x: width / 2,
        y: height / 2,
        angle: random(-PI, PI),
        scale: 1
      }, 500);
      setTimeout(() => {
        card.animate({
          x: width / 2 - 40,
          y: height / 2 - 60,
          angle: 0,
          scale: 1
        }, 500);
      }, 500 + index * 20);
    });
  }

  drawCard() {
    return this.cards.pop();
  }
}

// Clase Player
class Player {
  constructor(name) {
    this.name = name;
    this.hand = [];
    this.tricksWon = 0;
    this.playedCards = [];
  }

  displayHand(x, y, faceDown = false) {
    const cardSpacing = min(90, width / 10);
    for (let i = 0; i < this.hand.length; i++) {
      this.hand[i].x = x + i * cardSpacing;
      this.hand[i].y = y;
      this.hand[i].display(faceDown);
    }
  }

  displayPlayedCards(x, y) {
    const cardSpacing = min(90, width / 10);
    for (let i = 0; i < this.playedCards.length; i++) {
      this.playedCards[i].x = x + i * cardSpacing;
      this.playedCards[i].y = y;
      this.playedCards[i].display();
    }
  }

  calculateEnvido() {
    const suitCards = this.hand.reduce((suits, card) => {
      if (!suits[card.suit]) suits[card.suit] = [];
      suits[card.suit].push(card.rank);
      return suits;
    }, {});

    let maxEnvido = 0;
    for (const suit in suitCards) {
      if (suitCards[suit].length >= 2) {
        const envidoValue = suitCards[suit]
          .filter(rank => rank <= 7)
          .sort((a, b) => b - a)
          .slice(0, 2)
          .reduce((sum, rank) => sum + rank, 20);
        maxEnvido = Math.max(maxEnvido, envidoValue);
      }
    }

    return maxEnvido;
  }

  hasFlor() {
    const suitCounts = this.hand.reduce((counts, card) => {
      counts[card.suit] = (counts[card.suit] || 0) + 1;
      return counts;
    }, {});
    return Object.values(suitCounts).some(count => count >= 3);
  }
}

// Clase AIPlayer
class AIPlayer extends Player {
  constructor(name) {
    super(name);
    this.riskTolerance = random(0.3, 0.7); // Personalidad aleatoria para la IA
  }

  decideTrucoResponse(gameState) {
    const handStrength = this.evaluateHandStrength();
    const roundsWon = this.tricksWon;
    const opponentRoundsWon = gameState.players[0].tricksWon;

    if (handStrength > 0.7 || (roundsWon > opponentRoundsWon && random() < this.riskTolerance)) {
      return random() < 0.3 ? 'raise' : 'accept';
    } else if (handStrength > 0.4 || random() < this.riskTolerance) {
      return 'accept';
    } else {
      return 'reject';
    }
  }

  evaluateHandStrength() {
    const highCards = this.hand.filter(card => card.getPower() > 8).length;
    return highCards / this.hand.length;
  }

  decideEnvidoResponse(gameState) {
    const envidoPoints = this.calculateEnvido();
    const currentBet = gameState.currentBet;
    const envidoState = gameState.envidoState;

    if (envidoPoints >= 28) {
      return random() < 0.9 ? "accept" : "raise";
    } else if (envidoPoints >= 23) {
      if (envidoState === "falta_envido") {
        return random() < 0.5 ? "accept" : "reject";
      } else {
        return random() < 0.7 ? "accept" : (random() < 0.6 ? "raise" : "reject");
      }
    } else {
      if (envidoState === "falta_envido") {
        return "reject";
      } else {
        return random() < 0.4 ? "accept" : "reject";
      }
    }
  }
}

// Clase Button
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

// Clase GameState
class GameState {
  constructor() {
    this.currentPlayer = 0;
    this.round = 1;
    this.envidoState = "not_played";
    this.trucoState = "not_played";
    this.score = [0, 0];
    this.handWinner = null;
    this.currentBet = 1;
    this.trickWinner = [null, null, null];
    this.mano = 0;
    this.lastTrucoPlayer = null;
    this.envidoInProgress = false;
  }

  updateState(newState) {
    Object.assign(this, newState);
  }
}

// Clase EventManager
class EventManager {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

// Clase Logger
class Logger {
  constructor(maxEntries = 10) {
    this.logs = [];
    this.maxEntries = maxEntries;
  }

  log(message, type = 'info') {
    const entry = { message, type, timestamp: new Date() };
    this.logs.unshift(entry);
    if (this.logs.length > this.maxEntries) {
      this.logs.pop();
    }
  }

  getLogs() {
    return this.logs;
  }
}

// Clase SoundManager
class SoundManager {
  constructor() {
    this.sounds = {};
  }

  loadSound(name, path) {
    this.sounds[name] = loadSound(path);
  }

  play(name) {
    if (this.sounds[name]) {
      this.sounds[name].play();
    }
  }
}

// Clase ParticleSystem
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  addParticle(x, y) {
    this.particles.push(new Particle(x, y));
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }

  display() {
    this.particles.forEach(p => p.display());
  }
}

class Particle {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D();
    this.acceleration = createVector(0, 0.05);
    this.lifespan = 255;
  }

  update() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.lifespan -= 2;
  }

  display() {
    stroke(200, this.lifespan);
    fill(127, this.lifespan);
    ellipse(this.position.x, this.position.y, 12, 12);
  }

  isDead() {
    return this.lifespan < 0;
  }
}

// Clase TrucoGame
class TrucoGame {
  constructor() {
    this.deck = new Deck();
    this.players = [new Player("Jugador"), new AIPlayer("Computadora")];
    this.state = new GameState();
    this.eventManager = new EventManager();
    this.logger = new Logger();
    this.soundManager = new SoundManager();
    this.particleSystem = new ParticleSystem();
    this.buttons = [];
    this.gameOver = false;
    this.pointsToWin = 30;
    this.sonBuenas = [false, false];

    this.setupEventListeners();
    this.loadSounds();
    this.dealNewHand();
  }

  setupEventListeners() {
    this.eventManager.on('cardPlayed', this.onCardPlayed.bind(this));
    this.eventManager.on('envidoCalled', this.onEnvidoCalled.bind(this));
    this.eventManager.on('trucoCalled', this.onTrucoCalled.bind(this));
  }

  loadSounds() {
    this.soundManager.loadSound('envido', 'assets/sounds/envido.mp3');
    this.soundManager.loadSound('truco', 'assets/sounds/truco.mp3');
    this.soundManager.loadSound('playCard', 'assets/sounds/playCard.mp3');
  }

  dealNewHand() {
    if (this.gameOver) return;

    this.deck = new Deck();
    this.deck.shuffle();
    this.players.forEach((player) => {
      player.hand = [];
      player.tricksWon = 0;
      player.playedCards = [];
    });

    // Animación de reparto
    for (let i = 0; i < 3; i++) {
      this.players.forEach((player, playerIndex) => {
        setTimeout(() => {
          const card = this.deck.drawCard();
          card.x = width / 2 - 40;
          card.y = height / 2 - 60;
          player.hand.push(card);
          const cardSpacing = min(90, width / 10);
          const targetX = playerIndex === 0 ? width * 0.3 + i * cardSpacing : width * 0.3 + i * cardSpacing;
          const targetY = playerIndex === 0 ? height * 0.7 : height * 0.1;
          card.animate({ x: targetX, y: targetY, angle: 0, scale: 1 }, 500);
        }, 1000 + i * 500 + playerIndex * 250);
      });
    }

    this.state.updateState({
      currentPlayer: this.state.mano,
      round: 1,
      envidoState: "not_played",
      trucoState: "not_played",
      handWinner: null,
      currentBet: 1,
      trickWinner: [null, null, null],
      lastTrucoPlayer: null,
      envidoInProgress: false
    });

    this.logger.log("Nueva mano repartida");
    this.logger.log(`${this.players[this.state.currentPlayer].name} es mano`);

    this.players.forEach((player, index) => {
      if (player.hasFlor()) {
        this.logger.log(`${player.name} tiene Flor`);
        if (index === 0) {
          this.waitForPlayerFlorResponse();
        } else {
          this.handleAIFlor();
        }
      }
    });

    if (this.state.currentPlayer === 1) {
      setTimeout(() => this.playAI(), 3000);
    }
  }

  playCard(playerIndex, cardIndex) {
    if (this.gameOver || this.state.envidoInProgress) return;

    const player = this.players[playerIndex];
    if (!player || !player.hand || cardIndex < 0 || cardIndex >= player.hand.length) {
      console.error("Invalid player or card index");
      return;
    }

    const card = player.hand.splice(cardIndex, 1)[0];
    if (!card) {
      console.error("Card not found in player's hand");
      return;
    }

    player.playedCards.push(card);
    this.logger.log(`${player.name} jugó ${card.toString()}`);
    this.soundManager.play('playCard');

    // Animación de jugar carta
    const offsetX = width * 0.25;
    const offsetY = height * 0.4;
    const cardSpacing = min(90, width / 10);
    card.animate({
      x: offsetX + (playerIndex === 0 ? 0 : width * 0.3) + player.playedCards.length * cardSpacing,
      y: offsetY + (playerIndex === 0 ? cardSpacing : -cardSpacing),
      angle: 0,
      scale: 1
    }, 500);

    this.particleSystem.addParticle(card.x, card.y);

    if (this.players[0].playedCards.length === this.players[1].playedCards.length) {
      setTimeout(() => this.evaluateTrick(), 1000);
    } else {
      this.state.updateState({ currentPlayer: 1 - this.state.currentPlayer });
      if (this.state.currentPlayer === 1) {
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
      winner = this.state.mano;
    }
    this.state.trickWinner[this.state.round - 1] = winner;
    this.players[winner].tricksWon++;
    this.state.updateState({ currentPlayer: winner, round: this.state.round + 1 });

    this.logger.log(`${this.players[winner].name} ganó la baza`);

    if (this.state.round > 3 || this.players[winner].tricksWon === 2) {
      setTimeout(() => this.evaluateHand(), 1000);
    } else if (this.state.currentPlayer === 1) {
      setTimeout(() => this.playAI(), 1000);
    }
  }

  evaluateHand() {
    const winner = this.determineHandWinner();
    this.updateScore(winner);
    this.logHandResult(winner);

    if (this.isGameOver()) {
      this.endGame();
    } else {
      this.prepareNextHand();
    }
  }

  determineHandWinner() {
    if (this.players[0].tricksWon > this.players[1].tricksWon) return 0;
    if (this.players[1].tricksWon > this.players[0].tricksWon) return 1;
    return this.state.mano;
  }

  updateScore(winner) {
    const points = this.getTrucoValue();
    this.state.score[winner] += points;
  }

  logHandResult(winner) {
    this.logger.log(`${this.players[winner].name} ganó la mano y ${this.getTrucoValue()} punto(s)`);
    
    // Verificar "son buenas"
    if (this.state.score[winner] >= 15 && !this.sonBuenas[winner]) {
      this.sonBuenas[winner] = true;
      this.logger.log(`${this.players[winner].name} dice: ¡Son buenas!`);
    }
  }

  isGameOver() {
    return this.state.score[0] >= this.pointsToWin || this.state.score[1] >= this.pointsToWin;
  }

  endGame() {
    this.gameOver = true;
    const winner = this.state.score[0] >= this.pointsToWin ? 0 : 1;
    this.logger.log(`${this.players[winner].name} ganó el juego`);
  }

  prepareNextHand() {
    this.state.updateState({ mano: 1 - this.state.mano });
    setTimeout(() => this.dealNewHand(), 2000);
  }

  getTrucoValue() {
    switch (this.state.trucoState) {
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
    if (this.gameOver || this.state.currentPlayer !== 1 || this.state.envidoInProgress) return;

    const aiPlayer = this.players[1];
    const playerPlayedCards = this.players[0].playedCards;
    const roundScore = this.calculateRoundScore();

    if (this.shouldCallEnvido()) {
      this.callEnvidoAI();
      return;
    }

    if (this.shouldCallTruco()) {
      this.callTrucoAI();
      return;
    }

    this.playAICard(aiPlayer, playerPlayedCards, roundScore);
  }

  shouldCallEnvido() {
    return this.state.round === 1 && 
           this.state.envidoState === "not_played" && 
           this.players[1].playedCards.length === 0 &&
           this.calculateEnvidoChance() > 0.7;
  }

  calculateEnvidoChance() {
    const envidoPoints = this.players[1].calculateEnvido();
    if (envidoPoints >= 28) return 0.9;
    if (envidoPoints >= 23) return 0.7;
    return 0.3;
  }

  shouldCallTruco() {
    return this.canCallTruco(1) && (this.calculateRoundScore() >= 1 || Math.random() < 0.3);
  }

  playAICard(aiPlayer, playerPlayedCards, roundScore) {
    let cardIndex;
    if (playerPlayedCards.length === 0) {
      if (roundScore <= -1 || (this.state.round === 1 && this.state.trucoState === "not_played")) {
        cardIndex = this.getLowestCardIndex(aiPlayer.hand);
      } else {
        cardIndex = this.getHighestCardIndex(aiPlayer.hand);
      }
    } else {
      const playerCard = playerPlayedCards[playerPlayedCards.length - 1];
      cardIndex = this.getLowestWinningCardIndex(aiPlayer.hand, playerCard);
      if (cardIndex === -1) {
        cardIndex = this.getLowestCardIndex(aiPlayer.hand);
      }
    }

    this.playCard(1, cardIndex);
  }

  callEnvidoAI() {
    this.state.updateState({
      envidoState: "pending",
      currentBet: 2,
      envidoInProgress: true
    });
    this.logger.log("Computadora cantó Envido");
    this.soundManager.play('envido');
    this.waitForPlayerEnvidoResponse();
  }

  callTrucoAI() {
    this.state.updateState({
      trucoState: "pending",
      lastTrucoPlayer: 1
    });
    this.logger.log("Computadora cantó Truco");
    this.soundManager.play('truco');
    this.waitForPlayerTrucoResponse();
  }

  waitForPlayerEnvidoResponse() {
    this.showPlayerResponseButtons = true;
    this.playerResponseOptions = ["Quiero", "No Quiero"];

    if (this.state.envidoState === "not_played") {
      this.playerResponseOptions.push("Envido", "Real Envido", "Falta Envido");
    } else if (this.state.envidoState === "envido") {
      this.playerResponseOptions.push("Real Envido", "Falta Envido");
    } else if (this.state.envidoState === "real_envido") {
      this.playerResponseOptions.push("Falta Envido");
    }

    if (this.players[0].hasFlor()) {
      this.playerResponseOptions.push("Flor");
    }

    this.createResponseButtons();
  }

  waitForPlayerTrucoResponse() {
    this.showPlayerResponseButtons = true;
    this.playerResponseOptions = ["Quiero", "No Quiero"];
    if (this.state.trucoState === "pending" && this.state.lastTrucoPlayer !== 0) {
      this.playerResponseOptions.push("Retruco");
    } else if (this.state.trucoState === "truco" && this.state.lastTrucoPlayer !== 0) {
      this.playerResponseOptions.push("Retruco");
    } else if (this.state.trucoState === "retruco" && this.state.lastTrucoPlayer !== 0) {
      this.playerResponseOptions.push("Vale Cuatro");
    }
    this.createResponseButtons();
  }

  createResponseButtons() {
    this.buttons = [];
    const buttonWidth = min(120, width / 5);
    const buttonHeight = 40;
    const buttonSpacing = 10;
    const startX = (width - (this.playerResponseOptions.length * buttonWidth + (this.playerResponseOptions.length - 1) * buttonSpacing)) / 2;
    const startY = height / 2;

    for (let i = 0; i < this.playerResponseOptions.length; i++) {
      const buttonX = startX + i * (buttonWidth + buttonSpacing);
      this.buttons.push(new Button(this.playerResponseOptions[i], buttonX, startY, buttonWidth, buttonHeight));
    }
  }

  handlePlayerResponse(response) {
    this.showPlayerResponseButtons = false;
    this.buttons = [];
    if (this.state.envidoState === "pending") {
      this.handlePlayerEnvidoResponse(response);
    } else if (this.state.trucoState === "pending" || this.state.trucoState === "truco" || this.state.trucoState === "retruco") {
      this.handlePlayerTrucoResponse(response);
    }
  }

  handlePlayerEnvidoResponse(response) {
    if (response === "Flor") {
      this.handleFlor(0);
      this.state.envidoInProgress = false;
      return;
    }

    if (response === "Quiero") {
      this.state.envidoState = "accepted";
      const playerEnvidoPoints = this.players[0].calculateEnvido();
      const aiEnvidoPoints = this.players[1].calculateEnvido();
      this.state.envidoPoints = [playerEnvidoPoints, aiEnvidoPoints];
      let winner = playerEnvidoPoints === aiEnvidoPoints ? this.state.mano : (playerEnvidoPoints > aiEnvidoPoints ? 0 : 1);
      this.state.score[winner] += this.state.currentBet;
      this.logger.log(`Jugador quiso. ${this.players[winner].name} ganó ${this.state.currentBet} puntos con ${this.state.envidoPoints[winner]} de envido`);

      if (this.state.score[winner] >= 30) {
        this.gameOver = true;
        this.logger.log(`${this.players[winner].name} ganó el juego`);
        return;
      }
    } else if (response === "No Quiero") {
      this.state.envidoState = "rejected";
      this.state.score[1] += 1;
      this.logger.log("Jugador no quiso. Computadora ganó 1 punto");

      if (this.state.score[1] >= 30) {
        this.gameOver = true;
        this.logger.log(`${this.players[1].name} ganó el juego`);
        return;
      }
    } else if (response === "Envido") {
      this.callEnvido();
      return;
    } else if (response === "Real Envido") {
      this.callRealEnvido();
      return;
    } else if (response === "Falta Envido") {
      this.callFaltaEnvido();
      return;
    }
    this.state.envidoInProgress = false;
    if (this.state.currentPlayer === 1 && !this.gameOver) {
      setTimeout(() => this.playAI(), 1000);
    }
  }

  handlePlayerTrucoResponse(response) {
    if (response === "Quiero") {
      if (this.state.trucoState === "pending") {
        this.state.trucoState = "truco";
      }
      this.logger.log(`Jugador aceptó el ${this.state.trucoState}`);
      if (this.state.currentPlayer === 1) {
        setTimeout(() => this.playAI(), 1000);
      }
    } else if (response === "No Quiero") {
      let points = 1;
      if (this.state.trucoState === "retruco") {
        points = 2;
      } else if (this.state.trucoState === "vale_cuatro") {
        points = 3;
      }
      this.state.score[1] += points;
      this.logger.log(`Jugador no quiso el ${this.state.trucoState}. Computadora ganó ${points} punto(s)`);

      if (this.state.score[1] >= 30) {
        this.gameOver = true;
        this.logger.log(`${this.players[1].name} ganó el juego`);
      } else {
        this.dealNewHand();
      }
    } else if (response === "Retruco") {
      this.state.trucoState = "retruco";
      this.state.lastTrucoPlayer = 0;
      this.logger.log("Jugador cantó Retruco");
      setTimeout(() => this.respondToTruco(), 1000);
    } else if (response === "Vale Cuatro") {
      this.state.trucoState = "vale_cuatro";
      this.state.lastTrucoPlayer = 0;
      this.logger.log("Jugador cantó Vale Cuatro");
      setTimeout(() => this.respondToTruco(), 1000);
    }
  }

  handleMousePressed() {
    if (this.gameOver) return;

    if ((this.state.currentPlayer === 0 || this.showPlayerResponseButtons) && !this.gameOver) {
      if (this.state.currentPlayer === 0 && !this.state.envidoInProgress) {
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
            this.handlePlayerResponse(this.buttons[i].label);
            return;
          }
        }
      } else if (this.state.currentPlayer === 0 && !this.state.envidoInProgress) {
        for (let i = 0; i < this.buttons.length; i++) {
          if (this.buttons[i].isClicked()) {
            switch (this.buttons[i].label) {
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
    return this.state.envidoState !== "pending" && this.state.trucoState !== "pending" && !this.state.envidoInProgress;
  }

  canCallEnvido() {
    return this.state.envidoState === "not_played" && this.state.round === 1 && this.players[0].playedCards.length === 0;
  }

  canCallTruco(playerIndex) {
    return (
      (this.state.trucoState === "not_played" ||
        (this.state.trucoState === "truco" && this.state.lastTrucoPlayer !== playerIndex) ||
        (this.state.trucoState === "retruco" && this.state.lastTrucoPlayer !== playerIndex)) &&
      this.state.envidoState !== "pending" &&
      !this.state.envidoInProgress &&
      this.state.round <= 3 &&
      this.players[0].playedCards.length + this.players[1].playedCards.length < 6
    );
  }

  canCallRealEnvido() {
    return (
      (this.state.envidoState === "envido" || this.state.envidoState === "not_played") &&
      this.state.round === 1 &&
      this.players[0].playedCards.length === 0
    );
  }

  canCallFaltaEnvido() {
    return (
      (this.state.envidoState === "envido" || this.state.envidoState === "real_envido" || this.state.envidoState === "not_played") &&
      this.state.round === 1 &&
      this.players[0].playedCards.length === 0
    );
  }

  callEnvido() {
    if (this.state.envidoState === "not_played") {
      this.state.envidoState = "envido";
      this.state.currentBet = 2;
      this.state.envidoInProgress = true;
      this.logger.log("Jugador cantó Envido");
      this.soundManager.play('envido');
      setTimeout(() => this.respondToEnvido(), 1000);
    } else if (this.state.envidoState === "envido") {
      this.state.envidoState = "envido_envido";
      this.state.currentBet = 4;
      this.logger.log("Jugador cantó Envido Envido");
      this.soundManager.play('envido');
      setTimeout(() => this.respondToEnvido(), 1000);
    }
  }

  callRealEnvido() {
    this.state.envidoState = "real_envido";
    this.state.currentBet += 3;
    this.state.envidoInProgress = true;
    this.logger.log("Jugador cantó Real Envido");
    this.soundManager.play('envido');
    setTimeout(() => this.respondToEnvido(), 1000);
  }

  callFaltaEnvido() {
    this.state.envidoState = "falta_envido";
    this.state.currentBet = this.calculateFaltaEnvidoPoints();
    this.state.envidoInProgress = true;
    this.logger.log("Jugador cantó Falta Envido");
    this.soundManager.play('envido');
    setTimeout(() => this.respondToEnvido(), 1000);
  }

  respondToEnvido() {
    const aiPlayer = this.players[1];
    const aiResponse = aiPlayer.decideEnvidoResponse(this.state);
    if (aiResponse === "accept") {
      this.state.envidoState = "accepted";
      const playerEnvidoPoints = this.players[0].calculateEnvido();
      const aiEnvidoPoints = aiPlayer.calculateEnvido();
      this.state.envidoPoints = [playerEnvidoPoints, aiEnvidoPoints];
      let winner = playerEnvidoPoints === aiEnvidoPoints ? this.state.mano : (playerEnvidoPoints > aiEnvidoPoints ? 0 : 1);
      this.state.score[winner] += this.state.currentBet;
      this.logger.log(`Computadora quiso. ${this.players[winner].name} ganó ${this.state.currentBet} puntos con ${this.state.envidoPoints[winner]} de envido`);

      if (this.state.score[winner] >= 30) {
        this.gameOver = true;
        this.logger.log(`${this.players[winner].name} ganó el juego`);
        return;
      }
    } else if (aiResponse === "raise") {
      if (this.state.envidoState === "envido") {
        this.callRealEnvidoAI();
        return;
      } else {
        this.callFaltaEnvidoAI();
        return;
      }
    } else {
      this.state.envidoState = "rejected";
      this.state.score[0] += 1;
      this.logger.log("Computadora no quiso. Jugador ganó 1 punto");

      if (this.state.score[0] >= 30) {
        this.gameOver = true;
        this.logger.log(`${this.players[0].name} ganó el juego`);
        return;
      }
    }
    this.state.envidoState = this.state.envidoState === "pending" ? "not_played" : this.state.envidoState;
    this.state.envidoInProgress = false;
    if (this.state.currentPlayer === 1 && !this.gameOver) {
      setTimeout(() => this.playAI(), 1000);
    }
  }

  callTruco() {
    if (this.state.trucoState === "not_played") {
      this.state.trucoState = "pending";
      this.state.lastTrucoPlayer = 0;
      this.logger.log("Jugador cantó Truco");
      this.soundManager.play('truco');
      setTimeout(() => this.respondToTruco(), 1000);
    } else if (this.state.trucoState === "truco" && this.state.lastTrucoPlayer !== 0) {
      this.state.trucoState = "retruco";
      this.state.lastTrucoPlayer = 0;
      this.logger.log("Jugador cantó Retruco");
      this.soundManager.play('truco');
      setTimeout(() => this.respondToTruco(), 1000);
    } else if (this.state.trucoState === "retruco" && this.state.lastTrucoPlayer !== 0) {
      this.state.trucoState = "vale_cuatro";
      this.state.lastTrucoPlayer = 0;
      this.logger.log("Jugador cantó Vale Cuatro");
      this.soundManager.play('truco');
      setTimeout(() => this.respondToTruco(), 1000);
    }
  }

  respondToTruco() {
    const aiPlayer = this.players[1];
    const aiResponse = aiPlayer.decideTrucoResponse(this.state);
    if (aiResponse === "accept") {
      if (this.state.trucoState === "pending") {
        this.state.trucoState = "truco";
      }
      this.logger.log(`Computadora aceptó el ${this.state.trucoState}`);
      if (this.state.currentPlayer === 1) {
        setTimeout(() => this.playAI(), 1000);
      }
    } else if (aiResponse === "reject") {
      let points = 1;
      if (this.state.trucoState === "retruco") {
        points = 2;
      } else if (this.state.trucoState === "vale_cuatro") {
        points = 3;
      }
      this.state.score[0] += points;
      this.logger.log(`Computadora no quiso el ${this.state.trucoState}. Jugador ganó ${points} punto(s)`);

      if (this.state.score[0] >= 30) {
        this.gameOver = true;
        this.logger.log(`${this.players[0].name} ganó el juego`);
      } else {
        this.dealNewHand();
      }
    } else if (aiResponse === "raise") {
      if (this.state.trucoState === "pending" || this.state.trucoState === "truco") {
        this.state.trucoState = "retruco";
        this.state.lastTrucoPlayer = 1;
        this.logger.log("Computadora cantó Retruco");
        this.soundManager.play('truco');
        this.waitForPlayerTrucoResponse();
      } else if (this.state.trucoState === "retruco") {
        this.state.trucoState = "vale_cuatro";
        this.state.lastTrucoPlayer = 1;
        this.logger.log("Computadora cantó Vale Cuatro");
        this.soundManager.play('truco');
        this.waitForPlayerTrucoResponse();
      }
    }
  }

  irMazo() {
    this.logger.log(`${this.players[0].name} Se fue al mazo`);
    this.state.handWinner = 1;
    const points = this.getTrucoValue();
    this.state.score[1] += points;
    this.logger.log(`${this.players[1].name} ganó ${points} puntos`);

    if (this.state.score[1] >= 30) {
      this.gameOver = true;
      this.logger.log(`${this.players[1].name} ganó el juego`);
    } else {
      this.state.mano = 1 - this.state.mano;
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
    const winningCards = hand.filter((card) => card.compareWith(opponentCard) > 0);
    if (winningCards.length === 0) return -1;
    return hand.indexOf(winningCards.reduce((lowest, card) => (card.getPower() < lowest.getPower() ? card : lowest)));
  }

  calculateRoundScore() {
    let score = 0;
    for (let i = 0; i < this.state.trickWinner.length; i++) {
      if (this.state.trickWinner[i] === 1) score++;
      else if (this.state.trickWinner[i] === 0) score--;
    }
    return score;
  }

  display() {
    image(tableImage, 0, 0, width, height);

    this.players[0].displayHand(width * 0.3, height * 0.7);
    this.players[1].displayHand(width * 0.3, height * 0.1, true);

    this.displayPlayedCards();

    textSize(24);
    fill(255);
    text(`${this.players[0].name}: ${this.state.score[0]}`, width * 0.02, height * 0.95);
    text(`${this.players[1].name}: ${this.state.score[1]}`, width * 0.02, height * 0.05);

    if (this.state.currentPlayer === 0 && !this.showPlayerResponseButtons && !this.state.envidoInProgress) {
      this.buttons = [];
      if (this.canCallEnvido()) {
        this.buttons.push(new Button("Envido", width * 0.75, height * 0.6, 100, 40));
      }
      if (this.canCallTruco(0)) {
        if (this.state.trucoState === "not_played") {
          this.buttons.push(new Button("Truco", width * 0.75, height * 0.7, 100, 40));
        } else if (this.state.trucoState === "truco" && this.state.lastTrucoPlayer !== 0) {
          this.buttons.push(new Button("Retruco", width * 0.75, height * 0.7, 100, 40));
        } else if (this.state.trucoState === "retruco" && this.state.lastTrucoPlayer !== 0) {
          this.buttons.push(new Button("Vale Cuatro", width * 0.75, height * 0.7, 100, 40));
        }
      }
      if (this.canCallRealEnvido()) {
        this.buttons.push(new Button("Real Envido", width * 0.75, height * 0.8, 100, 40));
      }
      if (this.canCallFaltaEnvido()) {
        this.buttons.push(new Button("Falta Envido", width * 0.75, height * 0.9, 100, 40));
      }
      this.buttons.push(new Button("Ir al mazo", width * 0.75, height * 0.5, 100, 40));
    }

    for (const button of this.buttons) {
      button.display();
    }

    this.displayGameLog();

    if (this.state.envidoState === "accepted") {
      textSize(20);
      fill(255);
      text(
        `Envido: ${this.players[0].name} ${this.state.envidoPoints[0]} - ${this.state.envidoPoints[1]} ${this.players[1].name}`,
        width / 2,
        height / 2 - 50
      );
    }

    if (this.gameOver) {
      textSize(48);
      fill(255);
      text(`¡${this.players[this.state.handWinner].name} gana!`, width / 2, height / 2);
    }

    this.particleSystem.update();
    this.particleSystem.display();
  }

  displayPlayedCards() {
    const offsetX = width * 0.25;
    const offsetY = height * 0.4;
    const cardSpacing = min(90, width / 10);

    for (let i = 0; i < 2; i++) {
      const player = this.players[i];
      if (!player || !player.playedCards) continue;

      for (let j = 0; j < player.playedCards.length; j++) {
        const card = player.playedCards[j];
        if (!card || typeof card.display !== "function") continue;

        const x = offsetX + (i === 0 ? 0 : width * 0.3) + j * cardSpacing;
        const y = offsetY + (i === 0 ? cardSpacing : -cardSpacing);
        card.display();
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
    const logs = this.logger.getLogs();
    for (let i = logs.length - 1; i >= Math.max(0, logs.length - 10); i--) {
      text(logs[i].message, width * 0.02, y);
      y += height * 0.03;
    }
  }

  handleAIFlor() {
    this.logger.log("Computadora tiene Flor");
    this.state.score[1] += 3;
    this.logger.log("Computadora mostró Flor y ganó 3 puntos");

    if (this.state.score[1] >= 30) {
      this.gameOver = true;
      this.logger.log(`${this.players[1].name} ganó el juego`);
    }
  }

  waitForPlayerFlorResponse() {
    this.showPlayerResponseButtons = true;
    this.playerResponseOptions = ["Mostrar Flor", "No mostrar"];
    this.createResponseButtons();
  }

  handlePlayerFlorResponse(response) {
    this.showPlayerResponseButtons = false;
    if (response === "Mostrar Flor") {
      this.state.score[0] += 3;
      this.logger.log("Jugador mostró Flor y ganó 3 puntos");

      if (this.state.score[0] >= 30) {
        this.gameOver = true;
        this.logger.log(`${this.players[0].name} ganó el juego`);
      }
    } else {
      this.logger.log("Jugador no mostró Flor");
    }

    if (this.state.currentPlayer === 1 && !this.gameOver) {
      setTimeout(() => this.playAI(), 1000);
    }
  }

  handleFlor(playerIndex) {
    const opponent = 1 - playerIndex;
    if (this.players[opponent].hasFlor()) {
      this.logger.log(`${this.players[opponent].name} también tiene Flor`);
      // El jugador con el Flor más alto gana 6 puntos
      const florValues = [this.players[playerIndex].calculateEnvido(), this.players[opponent].calculateEnvido()];
      const florWinner = florValues[0] > florValues[1] ? playerIndex : opponent;
      this.state.score[florWinner] += 6;
      this.logger.log(`${this.players[florWinner].name} gana 6 puntos por Flor más alta`);
    } else {
      this.state.score[playerIndex] += 3;
      this.logger.log(`${this.players[playerIndex].name} gana 3 puntos por Flor`);
    }

    if (this.state.score[playerIndex] >= this.pointsToWin || this.state.score[opponent] >= this.pointsToWin) {
      this.gameOver = true;
      const winner = this.state.score[playerIndex] >= this.pointsToWin ? playerIndex : opponent;
      this.logger.log(`${this.players[winner].name} ganó el juego`);
    }
  }

  onCardPlayed(data) {
    // Lógica para manejar una carta jugada
    this.eventManager.emit('cardPlayed', data);
  }

  onEnvidoCalled(data) {
    // Lógica para manejar cuando se canta envido
    this.eventManager.emit('envidoCalled', data);
  }

  onTrucoCalled(data) {
    // Lógica para manejar cuando se canta truco
    this.eventManager.emit('trucoCalled', data);
  }
}

// Inicialización del juego
function setup() {
  createCanvas(800, 600);
  game = new TrucoGame();
}

function draw() {
  game.display();
}

function mousePressed() {
  game.handleMousePressed();
}

function mouseMoved() {
  game.handleMouseMoved();
}