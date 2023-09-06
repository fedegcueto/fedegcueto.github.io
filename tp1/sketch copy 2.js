// Global vars
let scene, camera, renderer; 
const objModels = [];
const videos = [];
const interactiveObjects = [];

function preload() {

  // Load OBJ models
  for(let i = 0; i < 10; i++) {
    const objModel = loadModel('ob'+i+'.obj');
    objModels.push(objModel); 
  }

  // Load videos
  for(let i = 0; i < 25; i++) {
    const vid = loadVideo('video'+i+'.mp4');
    videos.push(vid);
  }

}

function setup() {

  createCanvas(500, 500);

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
  const floorMaterial = new THREE.MeshPhongMaterial({color: 0x999999, side: THREE.DoubleSide});
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Player
  const player = new Player();
  player.mesh.position.y = 1; 
  scene.add(player.mesh);

  // Create interactive objects
  for(let i = 0; i < 100; i++) {
    
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(2,2,2),
      new THREE.MeshBasicMaterial({color: 0xff0000})
    );
    mesh.position.set(
      random(-50, 50),
      1,
      random(-50, 50)
    );

    const object = new InteractiveObject(mesh, objModels, videos);
    interactiveObjects.push(object);
    scene.add(mesh);
  }

}

function draw() {

  // Render scene
  renderer.render(scene, camera);
  
  // Handle object interaction
  for(let obj of interactiveObjects) {
  
    if(player.isNear(obj.mesh)) {
    
      obj.showPrompt();
      
      if(keyIsDown(69)) { // e key  
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


// Player class
class Player {

  constructor() {
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 16),
      new THREE.MeshBasicMaterial({color: 0xffff00}) 
    );
    this.vel = new THREE.Vector3();
    this.speed = 0.1;
  }

  update() {
    
    if(keyIsDown(87)) { // W key
      this.vel.z -= this.speed; 
    }
    if(keyIsDown(83)) { // S key
      this.vel.z += this.speed;
    }
    if(keyIsDown(65)) { // A key  
      this.vel.x -= this.speed;
    }
    if(keyIsDown(68)) { // D key
      this.vel.x += this.speed;
    }

    this.mesh.position.add(this.vel);
    
    this.vel.set(0, 0, 0);

  }

  isNear(object) {
    return this.mesh.position.distanceTo(object.position) < 5;
  }

}


// InteractiveObject class
class InteractiveObject {

  constructor(mesh, models, videos) {
    this.mesh = mesh;
    this.models = models;
    this.videos = videos;
  }

  showPrompt() {
    // Show prompt to interact
  }

  interact() {
    // Play random video
    // Show random model
  }

}