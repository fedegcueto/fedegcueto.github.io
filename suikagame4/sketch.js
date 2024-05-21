// Matter.js module aliases
let Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite,
    Events = Matter.Events;

// Declare variables
let engine, world;
let fruits = [];
let container;
let boundaries = [];
let score = 0;
let highScore = 0;
let currentFruit = null; // Track the current fruit at the top

// Preload fruit images and sounds
let fruitImages = {};
let dropSound, mergeSound, gameOverSound;

function preload() {
    fruitImages['cherry'] = loadImage('images/cherry.png');
    fruitImages['strawberry'] = loadImage('images/strawberry.png');
    fruitImages['grape'] = loadImage('images/grape.png');
    fruitImages['dekopon'] = loadImage('images/dekopon.png');
    fruitImages['persimmon'] = loadImage('images/persimmon.png');
    fruitImages['apple'] = loadImage('images/apple.png');
    fruitImages['pear'] = loadImage('images/pear.png');
    fruitImages['peach'] = loadImage('images/peach.png');
    fruitImages['pineapple'] = loadImage('images/pineapple.png');
    fruitImages['melon'] = loadImage('images/melon.png');
    fruitImages['watermelon'] = loadImage('images/watermelon.png');

    // Load sounds
    dropSound = loadSound('sounds/drop.wav');
    mergeSound = loadSound('sounds/merge.wav');
    gameOverSound = loadSound('sounds/gameover.wav');
}

function setup() {
    createCanvas(800, 600);
    engine = Engine.create();
    world = engine.world;

    // Create container
    container = new Container(400, 550, 400, 100); // Narrower container

    // Create boundaries
    boundaries.push(new Boundary(width / 2, height, width, 50));  // Bottom boundary
    boundaries.push(new Boundary(0, height / 2, 50, height));     // Left boundary
    boundaries.push(new Boundary(width, height / 2, 50, height)); // Right boundary

    // Adjust gravity
    engine.world.gravity.y = 0.5; // Adjusted gravity for slower falling

    // Run the engine
    Engine.run(engine);

    // Add collision event
    Events.on(engine, 'collisionStart', handleCollision);

    // Initialize the first fruit
    currentFruit = new Fruit(mouseX, 50, getRandomFruitType(), true);
}

function draw() {
    background(255);

    // Update and display container
    container.show();

    // Update and display boundaries
    for (let boundary of boundaries) {
        boundary.show();
    }

    // Update and display fruits
    for (let i = 0; i < fruits.length; i++) {
        fruits[i].show();
    }

    // Update and display the current fruit at the top
    if (currentFruit) {
        currentFruit.setPosition(mouseX, 50);
        currentFruit.show();
    }

    // Display score
    textSize(32);
    fill(0);
    text('Score: ' + score, 10, 40);
    text('High Score: ' + highScore, 10, 80);

    // Check for game over
    if (isGameOver()) {
        textSize(64);
        fill(255, 0, 0);
        textAlign(CENTER, CENTER);
        text('Game Over', width / 2, height / 2);
        noLoop();  // Stop the draw loop
    }

    // Show hint for dropping fruit
    textSize(20);
    fill(0);
    textAlign(CENTER, CENTER);
    text('Click to drop the fruit', width / 2, height - 20);
}

function mousePressed() {
    if (isGameOver()) {
        resetGame();
        loop();  // Restart the draw loop
        playSound(gameOverSound);
    } else {
        if (currentFruit) {
            currentFruit.release();
            fruits.push(currentFruit);
            playSound(dropSound);
        }
        // Generate a new random fruit at the top
        currentFruit = new Fruit(mouseX, 50, getRandomFruitType(), true);
    }
}

function getRandomFruitType() {
    const types = ['cherry', 'strawberry', 'grape', 'dekopon', 'persimmon', 'apple', 'pear', 'peach', 'pineapple', 'melon', 'watermelon'];
    return types[Math.floor(Math.random() * types.length)];
}

// Container class
class Container {
    constructor(x, y, w, h) {
        this.body = Bodies.rectangle(x, y, w, h, { isStatic: true });
        this.w = w;
        this.h = h;
        World.add(world, this.body);
    }

    show() {
        fill(128);
        stroke(0);
        rectMode(CENTER);
        rect(this.body.position.x, this.body.position.y, this.w, this.h);
    }
}

// Boundary class
class Boundary {
    constructor(x, y, w, h) {
        this.body = Bodies.rectangle(x, y, w, h, { isStatic: true });
        this.w = w;
        this.h = h;
        World.add(world, this.body);
    }

    show() {
        fill(128);
        stroke(0);
        rectMode(CENTER);
        rect(this.body.position.x, this.body.position.y, this.w, this.h);
    }
}

// Fruit class
class Fruit {
    constructor(x, y, type, isStatic) {
        this.type = type;
        this.image = fruitImages[type];
        this.size = this.getSizeByType(type);
        this.isStatic = isStatic || false;
        this.body = Bodies.circle(x, y, this.size / 2, {
            isStatic: this.isStatic,
            restitution: 0.5, // Bounciness
            friction: 0.5
        });
        World.add(world, this.body);
    }

    getSizeByType(type) {
        const sizes = {
            'cherry': 20,
            'strawberry': 30,
            'grape': 40,
            'dekopon': 50,
            'persimmon': 60,
            'apple': 70,
            'pear': 80,
            'peach': 90,
            'pineapple': 100,
            'melon': 110,
            'watermelon': 120
        };
        return sizes[type] || 20; // Default size
    }

    setPosition(x, y) {
        Body.setPosition(this.body, { x: x, y: y });
    }

    release() {
        Body.setStatic(this.body, false);
        this.isStatic = false;
    }

    show() {
        let pos = this.body.position;
        let angle = this.body.angle;
        push();
        translate(pos.x, pos.y);
        rotate(angle);
        imageMode(CENTER);
        image(this.image, 0, 0, this.size, this.size);
        pop();
    }
}

function handleCollision(event) {
    let pairs = event.pairs;
    for (let i = 0; i < pairs.length; i++) {
        let bodyA = pairs[i].bodyA;
        let bodyB = pairs[i].bodyB;

        // Check if both bodies are fruits
        let fruitA = getFruitByBody(bodyA);
        let fruitB = getFruitByBody(bodyB);

        if (fruitA && fruitB && fruitA.type === fruitB.type) {
            // Merge fruits
            let nextType = getNextFruitType(fruitA.type);
            if (nextType) {
                let newFruit = new Fruit((fruitA.body.position.x + fruitB.body.position.x) / 2,
                                         (fruitA.body.position.y + fruitB.body.position.y) / 2,
                                         nextType);
                fruits.push(newFruit);
                World.add(world, newFruit.body);
                World.remove(world, fruitA.body);
                World.remove(world, fruitB.body);
                removeFruit(fruitA);
                removeFruit(fruitB);

                // Update score
                score += 10;  // Arbitrary score increment for merging
                if (score > highScore) {
                    highScore = score;
                }

                // Play merge sound
                playSound(mergeSound);
            }
        }
    }
}

function getFruitByBody(body) {
    return fruits.find(fruit => fruit.body === body);
}

function getNextFruitType(type) {
    const hierarchy = ['cherry', 'strawberry', 'grape', 'dekopon', 'persimmon', 'apple', 'pear', 'peach', 'pineapple', 'melon', 'watermelon'];
    let index = hierarchy.indexOf(type);
    if (index !== -1 && index < hierarchy.length - 1) {
        return hierarchy[index + 1];
    }
    return null;
}

function removeFruit(fruit) {
    fruits = fruits.filter(f => f !== fruit);
}

function isGameOver() {
    for (let i = 0; i < fruits.length; i++) {
        if (fruits[i].body.position.y < 0) {
            return true;
        }
    }
    return false;
}

function resetGame() {
    // Remove all fruits from the world and reset score
    for (let i = 0; i < fruits.length; i++) {
        World.remove(world, fruits[i].body);
    }
    fruits = [];
    score = 0;
}

function playSound(sound) {
    if (sound && sound.isLoaded()) {
        sound.play();
    }
}
