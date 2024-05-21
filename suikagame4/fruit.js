class Fruit {
  constructor(type, img, x = random(width), y = 0, speed = 2) {
    this.type = type;
    this.img = img;
    this.x = x;
    this.y = y;
    this.size = 50;
    this.speed = speed;
  }

  move() {
    this.y += this.speed;
    if (this.y > height) {
      this.y = height;
      gameState = "end";
    }
  }

  display() {
    image(this.img, this.x, this.y, this.size, this.size);
  }

  specialEffect() {
    if (this.type === "manzana") {
      fruits = [];
      score *= 2;
    }
  }
}
