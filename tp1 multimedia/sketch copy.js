let player;
let interactiveButtons = [];
let videos = [];

function preload() {
  // Preload videos
  for (let i = 1; i <= 25; i++) {
    videos.push(`video${i}.mp4`);
  }
}

function setup() {
  createCanvas(800, 600);
  
  player = new Player(width / 2, height / 2);
  
  // Create interactive buttons with random positions
  for (let i = 0; i < 100; i++) {
    interactiveButtons.push(new InteractiveButton(random(width), random(height)));
  }
}

function draw() {
  background(220);
  
  // Calculate camera translation
  let camX = width / 2 - player.x;
  let camY = height / 2 - player.y;
  translate(camX, camY);

  player.update();
  player.display();
  
  // Detect interaction with buttons
  for (let btn of interactiveButtons) {
    btn.display();
    let btnX = btn.x + camX;
    let btnY = btn.y + camY;

    if (player.isNear(btnX, btnY)) {
      btn.displayInteractionPrompt();
      if (keyIsPressed && key === 'e') {
        btn.interact(videos);
      }
    }
  }
}

class InteractiveButton {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.isInteracting = false;
  }
  
  display() {
    fill(255, 0, 0);
    ellipse(this.x, this.y, 10, 10); // Small red dots
  }
  
  displayInteractionPrompt() {
    fill(0);
    text("Press 'E' to interact", this.x, this.y - 15);
  }
  
  interact(videos) {
    if (!this.isInteracting) {
      this.isInteracting = true;
      let randomVideoPath = random(videos);
      let randomVideo = createVideo(randomVideoPath);
      randomVideo.show();
      randomVideo.position(width / 2 - 160, height / 2 - 120);
      randomVideo.play();
      randomVideo.onended(() => {
        randomVideo.hide();
        randomVideo.remove();
        this.isInteracting = false;
      });
    }
  }
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 2;
  }
  
  update() {
    if (keyIsDown(LEFT_ARROW)) {
      this.x -= this.speed;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      this.x += this.speed;
    }
    if (keyIsDown(UP_ARROW)) {
      this.y -= this.speed;
    }
    if (keyIsDown(DOWN_ARROW)) {
      this.y += this.speed;
    }
  }
  
  display() {
    fill(0, 0, 255);
    ellipse(this.x, this.y, 20, 20);
  }
  
  isNear(objX, objY) {
    let distance = dist(this.x, this.y, objX, objY);
    return distance < 20;
  }
}
