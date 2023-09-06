// Global vars
let scene, camera, renderer;
const objModels = [];
const videos = [];
const interactiveObjects = [];
const narrativeData = [];
let player; // Declare player globally

function preload() {
  // Load OBJ models
  for (let i = 0; i < 10; i++) {
    const objModel = loadModel('ob' + i + '.obj');
    objModels.push(objModel);
  }

  // Load videos without setting source
  for (let i = 0; i < 25; i++) {
    const vid = createVideo([]);
    videos.push(vid);
    vid.hide(); // Hide videos initially
  }

  // Load narrative data
  for (let i = 0; i < 100; i++) {
    narrativeData.push({ puzzleSolved: false, choiceMade: null });
  }
}

function setup() {
  createCanvas(800, 600);

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 10;

  // Renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);
  document.body.appendChild(renderer.domElement);

  // Light
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(0, 10, 10);
  scene.add(dirLight);

  // Floor
  const floorGeometry = new THREE.PlaneGeometry(100, 100);
  const floorMaterial = new THREE.MeshPhongMaterial({
    color: 0x999999,
    side: THREE.DoubleSide,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Player
  player = new Player(); // Initialize player
  player.mesh.position.y = 1;
  scene.add(player.mesh);

  // Create interactive objects
  for (let i = 0; i < 100; i++) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    mesh.position.set(random(-50, 50), 1, random(-50, 50));

    const object = new InteractiveObject(mesh, objModels, videos, narrativeData[i]);
    interactiveObjects.push(object);
    scene.add(mesh);
  }
}

function draw() {
  // Render scene
  renderer.render(scene, camera);

  // Handle object interaction
  for (let obj of interactiveObjects) {
    if (obj && player.isNear(obj.mesh)) {
      obj.showPrompt();
      if (keyIsDown(69)) {
        obj.interact();
      }
    }
  }

  // Update player
  player.update();

  // Update camera
  camera.position.set(player.mesh.position.x, player.mesh.position.y + 10, player.mesh.position.z + 10);
  camera.lookAt(player.mesh.position);
}

class Player {
  constructor() {
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    this.vel = new THREE.Vector3();
    this.speed = 0.1;
  }

  update() {
    if (keyIsDown(87)) {
      // W key
      this.vel.z -= this.speed;
    }
    if (keyIsDown(83)) {
      // S key
      this.vel.z += this.speed;
    }
    if (keyIsDown(65)) {
      // A key
      this.vel.x -= this.speed;
    }
    if (keyIsDown(68)) {
      // D key
      this.vel.x += this.speed;
    }

    this.mesh.position.add(this.vel);

    this.vel.set(0, 0, 0);
  }

  isNear(object) {
    return this.mesh.position.distanceTo(object.position) < 5;
  }
}

class InteractiveObject {
  constructor(mesh, models, videos, narrative) {
    this.mesh = mesh;
    this.models = models;
    this.videos = videos;
    this.narrative = narrative;
    this.interacted = false;
  }

  showPrompt() {
    // Implement prompt display
    fill(255);
    textAlign(CENTER);
    textSize(20);
    text('Press "E" to interact', this.mesh.position.x, this.mesh.position.y + 3, this.mesh.position.z);
  }

  interact() {
    if (!this.interacted) {
      this.interacted = true;

      if (this.narrative) {
        const scenario = this.narrative;
        if (scenario.puzzleSolved) {
          // Implement puzzle interaction
          console.log('Puzzle solved interaction');
        } else if (scenario.choiceMade === 'A') {
          // Implement choice consequence
          console.log('Choice A consequence');
        } else {
          // Default interaction
          console.log('Default interaction');
        }
      }
    }
  }
}
