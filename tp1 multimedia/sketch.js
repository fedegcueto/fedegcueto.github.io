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
    const vid = createVideo(['video' + i + '.mp4']);
    vid.hide();
    videos.push(vid);
  }
  for (let i = 0; i < 100; i++) narrativeData.push({ puzzleSolved: false, choiceMade: null });
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
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
    const isNear = player.isNear(obj.mesh);

    if (isNear) {
      obj.showPrompt();
      if (keyIsDown(69)) obj.interact(player);
    } else {
      obj.hidePrompt();
      obj.stopVideo(); // Detener el video si el jugador se aleja del cubo.
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
    this.videoPlaying = false;
    this.currentVideo = null;
  }
  showPrompt() {
    fill(255);
    textAlign(CENTER);
    textSize(20);
    text('Press "E" to interact', this.mesh.position.x, this.mesh.position.y + 2, this.mesh.position.z);
  }
  hidePrompt() {
    // Ocultar el cartel.
  }
  interact(player) {
    if (!this.interacted) {
      this.interacted = true;
      if (this.videos.length > 0) {
        const chosenVideo = this.videos[this.videoIndex];
        chosenVideo.size(width, height);
        chosenVideo.position(0, 0);

        if (!this.videoPlaying) {
          // Iniciar el video si no se está reproduciendo.
          chosenVideo.show();
          this.hideOtherVideos(this.videoIndex);
          if (!videoFullscreen) fullscreenCanvas(chosenVideo);
          else restoreCanvas();

          videoFullscreen = !videoFullscreen;
          chosenVideo.play();
          this.videoPlaying = true;
          this.currentVideo = chosenVideo;
        } else {
          // Detener y ocultar el video si ya se está reproduciendo.
          chosenVideo.pause();
          chosenVideo.hide();
          this.videoPlaying = false;
          this.currentVideo = null;
        }
      }
    }
  }
  stopVideo() {
    if (this.videoPlaying) {
      if (this.currentVideo) {
        this.currentVideo.pause();
        this.currentVideo.hide();
      }
      this.videoPlaying = false;
      this.currentVideo = null;
    }
  }
  hideOtherVideos(selectedIndex) {
    for (let i = 0; i < this.videos.length; i++) {
      if (i !== selectedIndex) {
        const video = this.videos[i];
        video.pause();
        video.hide();
      }
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
