let escena, camara, renderizador;
const modelosObj = [];
const videos = [];
const objetosInteractivos = [];
const datosNarrativos = [];
let jugador;
let videoPantallaCompleta = false;

function preload() {
  // Cargar modelos 3D y videos antes de iniciar la escena
  for (let i = 0; i < 10; i++) modelosObj.push(loadModel('ob' + i + '.obj'));
  for (let i = 0; i < 25; i++) {
    const vid = createVideo(['video' + i + '.mp4']);
    vid.hide();
    videos.push(vid);
  }
  for (let i = 0; i < 100; i++) datosNarrativos.push({ puzzleResuelto: false, eleccionRealizada: null });
}

function setup() {
  // Configuración inicial de la escena
  let lienzo = createCanvas(windowWidth, windowHeight);
  lienzo.position(0, 0);
  escena = new THREE.Scene();
  camara = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camara.position.z = 10;
  renderizador = new THREE.WebGLRenderer();
  renderizador.setSize(width, height);
  document.body.appendChild(renderizador.domElement);
  const luzDir = new THREE.DirectionalLight(0xffffff, 1);
  luzDir.position.set(0, 10, 10);
  escena.add(luzDir);
  const geometriaSuelo = new THREE.PlaneGeometry(100, 100);
  const materialSuelo = new THREE.MeshPhongMaterial({ color: 0x999999, side: THREE.DoubleSide });
  const suelo = new THREE.Mesh(geometriaSuelo, materialSuelo);
  suelo.rotation.x = -Math.PI / 2;
  escena.add(suelo);
  jugador = new Jugador();
  jugador.mesh.position.y = 1;
  escena.add(jugador.mesh);
  for (let i = 0; i < 100; i++) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    mesh.position.set(random(-50, 50), 1, random(-50, 50));
    const objeto = new ObjetoInteractivo(mesh, modelosObj, videos, datosNarrativos[i]);
    objetosInteractivos.push(objeto);
    escena.add(mesh);
  }
}

function draw() {
  // Renderizar la escena y manejar interacciones
  renderizador.render(escena, camara);
  for (let obj of objetosInteractivos) {
    const cerca = jugador.estasCerca(obj.mesh);

    if (cerca) {
      obj.mostrarIndicacion();
      if (keyIsDown(69)) obj.interactuar(jugador);
    } else {
      obj.ocultarIndicacion();
      obj.detenerVideo(); // Detener el video si el jugador se aleja del cubo.
    }
  }
  jugador.actualizar();
  camara.position.set(jugador.mesh.position.x, jugador.mesh.position.y + 10, jugador.mesh.position.z + 10);
  camara.lookAt(jugador.mesh.position);
}

class Jugador {
  constructor() {
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
    this.vel = new THREE.Vector3();
    this.velocidad = 0.1;
  }
  actualizar() {
    if (keyIsDown(87)) this.vel.z -= this.velocidad;
    if (keyIsDown(83)) this.vel.z += this.velocidad;
    if (keyIsDown(65)) this.vel.x -= this.velocidad;
    if (keyIsDown(68)) this.vel.x += this.velocidad;
    this.mesh.position.add(this.vel);
    this.vel.set(0, 0, 0);
  }
  estasCerca(objeto) {
    return this.mesh.position.distanceTo(objeto.position) < 5;
  }
}

class ObjetoInteractivo {
  constructor(mesh, modelos, videos, narrativa) {
    this.mesh = mesh;
    this.modelos = modelos;
    this.videos = videos;
    this.narrativa = narrativa;
    this.interactuado = false;
    this.indiceVideo = Math.floor(random(this.videos.length));
    this.videoReproduciendo = false;
    this.videoActual = null;
  }
  mostrarIndicacion() {
    fill(255);
    textAlign(CENTER);
    textSize(20);
    text('Presiona "E" para interactuar', this.mesh.position.x, this.mesh.position.y + 2, this.mesh.position.z);
  }
  ocultarIndicacion() {
    // Ocultar el cartel.
  }
  interactuar(jugador) {
    if (!this.interactuado) {
      this.interactuado = true;
      if (this.videos.length > 0) {
        const videoElegido = this.videos[this.indiceVideo];
        videoElegido.size(width, height);
        videoElegido.position(0, 0);

        if (!this.videoReproduciendo) {
          // Iniciar el video si no se está reproduciendo.
          videoElegido.show();
          this.ocultarOtrosVideos(this.indiceVideo);
          if (!videoPantallaCompleta) pantallaCompletaCanvas(videoElegido);
          else restaurarCanvas();

          videoPantallaCompleta = !videoPantallaCompleta;
          videoElegido.play();
          this.videoReproduciendo = true;
          this.videoActual = videoElegido;
        } else {
          // Detener y ocultar el video si ya se está reproduciendo.
          videoElegido.pause();
          videoElegido.hide();
          this.videoReproduciendo = false;
          this.videoActual = null;
        }
      }
    }
  }
  detenerVideo() {
    if (this.videoReproduciendo) {
      if (this.videoActual) {
        this.videoActual.pause();
        this.videoActual.hide();
      }
      this.videoReproduciendo = false;
      this.videoActual = null;
    }
  }
  ocultarOtrosVideos(indiceSeleccionado) {
    for (let i = 0; i < this.videos.length; i++) {
      if (i !== indiceSeleccionado) {
        const video = this.videos[i];
        video.pause();
        video.hide();
      }
    }
  }
}

function pantallaCompletaCanvas(elemento) {
  const elementoCanvas = document.getElementById('defaultCanvas0');
  const elementoVideo = elemento.elt;
  elementoCanvas.style.display = 'none';
  elementoVideo.style.display = 'block';
  elementoVideo.style.position = 'fixed';
  elementoVideo.style.top = '0';
  elementoVideo.style.left = '0';
  elementoVideo.style.width = '100%';
  elementoVideo.style.height = '100%';
}

function restaurarCanvas() {
  const elementoCanvas = document.getElementById('defaultCanvas0');
  const elementosVideo = document.getElementsByTagName('video');
  elementoCanvas.style.display = 'block';

  for (let i = 0; i < elementosVideo.length; i++) elementosVideo[i].style.display = 'none';
}
