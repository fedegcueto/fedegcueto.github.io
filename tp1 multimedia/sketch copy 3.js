let scene, camera, renderer;
const objModels = [];
const videos = [];
const interactiveObjects = [];
const narrativeData = [];
let player;
let videoFullscreen = false;

function preload() {
  for (let i = 0; i < 10; i++) objModels.push(loadModel('ob' + i + '.obj'));
  for (let i = 0; i < 25; i++) {
    const vid = createVideo([]);
    videos.push(vid);
    vid.hide();
  }
  for (let i = 0; i < 100; i++) narrativeData.push({ puzzleSolved: false, choiceMade: null });
}

function setup() {
  createCanvas(800, 600);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 10;
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);
  document.body.appendChild(renderer.domElement);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(0, 10, 10);
  scene.add(dirLight);
  const floorGeometry = new THREE.PlaneGeometry(100, 100);
  const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x999999, side: THREE.DoubleSide });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  player = new Player();
  player.mesh.position.y = 1;
  scene.add(player.mesh);
  for (let i = 0; i < 100; i++) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    mesh.position.set(random(-50, 50), 1, random(-50, 50));
    const object = new InteractiveObject(mesh, objModels, videos, narrativeData[i]);
    interactiveObjects.push(object);
    scene.add(mesh);
  }
}

function draw() {
  renderer.render(scene, camera);
  for (let obj of interactiveObjects) {
    if (obj && player.isNear(obj.mesh)) {
      obj.showPrompt();
      if (keyIsDown(69)) obj.interact();
    }
  }
  player.update();
  camera.position.set(player.mesh.position.x, player.mesh.position.y + 10, player.mesh.position.z + 10);
  camera.lookAt(player.mesh.position);
}

class Player {
  constructor() {
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
    this.vel = new THREE.Vector3();
    this.speed = 0.1;
  }
  update() {
    if (keyIsDown(87)) this.vel.z -= this.speed;
    if (keyIsDown(83)) this.vel.z += this.speed;
    if (keyIsDown(65)) this.vel.x -= this.speed;
    if (keyIsDown(68)) this.vel.x += this.speed;
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
    this.videoIndex = Math.floor(random(this.videos.length));
  }
  showPrompt() {
    fill(255);
    textAlign(CENTER);
    textSize(20);
    text('Press "E" to play', this.mesh.position.x, this.mesh.position.y + 3, this.mesh.position.z);
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
      }
    }
  }
  hideOtherVideos(selectedIndex) {
    for (let i = 0; i < this.videos.length; i++) {
      if (i !== selectedIndex) this.videos[i].hide();
    }
  }
}

function fullscreenCanvas(element) {
  const canvasElement = document.getElementById('defaultCanvas0');
  const videoElement = element.elt;
  canvasElement.style.display = 'none';
  videoElement.style.display = 'block';
  videoElement.style.position = 'fixed';
  videoElement.style.top = '0';
  videoElement.style.left = '0';
  videoElement.style.width = '100%';
  videoElement.style.height = '100%';
}

function restoreCanvas() {
  const canvasElement = document.getElementById('defaultCanvas0');
  const videoElements = document.getElementsByTagName('video');
  canvasElement.style.display = 'block';
  for (let i = 0; i < videoElements.length; i++) videoElements[i].style.display = 'none';
}
