let scene, camera, renderer;
const objModels = [];
const videos = [];
const interactiveObjects = [];
const narrativeData = [];
let player;
let videoFullscreen = false;
let unplayedVideos = [];
let clock;

function preload() {
  for (let i = 0; i < 10; i++) {
    objModels.push(loadModel('ob' + i + '.obj'));
  }
  for (let i = 0; i < 25; i++) {
    const vid = createVideo(['video' + i + '.mp4']);
    vid.hide();
    videos.push(vid);
  }
  for (let i = 0; i < 100; i++) {
    narrativeData.push({ puzzleSolved: false, choiceMade: null });
  }
  unplayedVideos = videos.slice();
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  clock = new THREE.Clock();
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);
  document.body.appendChild(renderer.domElement);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(0, 10, 10);
  scene.add(dirLight);

  player = new Player(camera);
  player.mesh.position.y = 1;
  scene.add(player.mesh);

  createEnvironment();
  createInteractiveObjects();
}

function draw() {
  renderer.render(scene, camera);
  player.update();

  for (let obj of interactiveObjects) {
    obj.update(player);
  }
}

class Player {
  constructor(camera) {
    this.camera = camera;
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
    this.vel = new THREE.Vector3();
    this.speed = 0.1;
    this.setupControls();
  }

  jump() {
    if (this.controls.isLocked) {
      if (this.mesh.position.y <= 1) {
        this.vel.y = 0.5; // Aplica una velocidad hacia arriba para simular el salto
      }
    }
  }

  setupControls() {
    this.controls = new THREE.PointerLockControls(this.camera, renderer.domElement);
    scene.add(this.controls.getObject());

    this.controls.addEventListener('lock', () => {
      document.addEventListener('mousemove', this.onMouseMove.bind(this));
    });

    this.controls.addEventListener('unlock', () => {
      document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    });

    canvas.addEventListener('click', () => this.controls.lock());
  }

  update() {
    if (this.controls.isLocked) {
      const delta = clock.getDelta();
      const speed = this.speed * delta;

      if (keyIsDown(87)) this.controls.moveForward(speed);
      if (keyIsDown(83)) this.controls.moveForward(-speed);
      if (keyIsDown(65)) this.controls.moveRight(-speed);
      if (keyIsDown(68)) this.controls.moveRight(speed);
    }
  }

  onMouseMove(event) {
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    this.controls.moveRight(-movementX * 0.002);
  }
}

class InteractiveObject {
  constructor(mesh, models, videos, narrative) {
    this.mesh = mesh;
    this.models = models;
    this.videos = videos;
    this.narrative = narrative;
    this.interacted = false;
    this.videoIndex = Math.floor(random(this.videos.length));
  }

  update(player) {
    const distance = player.mesh.position.distanceTo(this.mesh.position);

    if (distance < 5) {
      this.showPrompt();
      if (keyIsDown(69)) {
        this.interact();
      }
    } else {
      this.hidePrompt();
    }
  }

  showPrompt() {
    if (!this.promptVisible) {
      fill(255);
      textAlign(CENTER);
      textSize(20);
      text('Press "E" to interact', this.mesh.position.x, this.mesh.position.y + 2, this.mesh.position.z);
      this.promptVisible = true;
    }
  }

  hidePrompt() {
    if (this.promptVisible) {
      this.promptVisible = false;
    }
  }

  interact() {
    if (!this.interacted) {
      this.interacted = true;
      if (this.videos.length > 0) {
        const chosenVideo = this.videos[this.videoIndex];
        chosenVideo.size(width, height);
        chosenVideo.position(0, 0);
        chosenVideo.show();
        this.hideOtherVideos(this.videoIndex);
        if (!videoFullscreen) fullscreenCanvas(chosenVideo);
        else restoreCanvas();
        
        videoFullscreen = !videoFullscreen;
        
        chosenVideo.elt.addEventListener('ended', () => {
          if (videoFullscreen) {
            restoreCanvas();
            videoFullscreen = false;
          }
          chosenVideo.hide();
        });
        
        chosenVideo.play();

        this.videos.splice(this.videoIndex, 1);
      }
    }
  }

  hideOtherVideos(selectedIndex) {
    for (let i = 0; i < this.videos.length; i++) {
      if (i !== selectedIndex) this.videos[i].hide();
    }
  }
}

function mousePressed() {
  if (videoFullscreen) {
    unplayedVideos.forEach(video => video.play());
  }
}

function keyPressed() {
  // Acciones al presionar teclas
  if (keyCode === 32) {
    player.jump(); // Agrega la lógica de salto del jugador
  }
}

function createEnvironment() {
  // Crear entorno 3D (suelo, paredes, etc.)
  const floorGeometry = new THREE.PlaneGeometry(100, 100);
  const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x999999, side: THREE.DoubleSide });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
}

function createInteractiveObjects() {
  // Crear objetos interactivos
  for (let i = 0; i < 100; i++) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    mesh.position.set(random(-50, 50), 1, random(-50, 50));
    const object = new InteractiveObject(mesh, objModels, unplayedVideos, narrativeData[i]);
    interactiveObjects.push(object);
    scene.add(mesh);
  }
}
