// Definición de variables globales para la escena, cámara, renderizador, modelos 3D, videos, objetos interactivos, datos narrativos, jugador y estado de pantalla completa.
let escena, camara, renderizador;
const modelosObj = [];
const videos = [];
const objetosInteractivos = [];
const datosNarrativos = [];
let jugador;
let videoEnPantallaCompleta = false;

// Función para precargar modelos 3D, videos y datos narrativos.
function precargar() {
  // Cargar modelos 3D y videos en arrays.
  for (let i = 0; i < 10; i++) modelosObj.push(loadModel('ob' + i + '.obj'));
  for (let i = 0; i < 25; i++) {
    const vid = createVideo(['video' + i + '.mp4']);
    vid.hide();
    videos.push(vid);
  }
  // Inicializar datos narrativos para cada objeto interactivo.
  for (let i = 0; i < 100; i++) datosNarrativos.push({ rompecabezasResuelto: false, decisionTomada: null });
}

// Función de configuración al inicio del programa.
function configurar() {
  // Crear lienzo 3D y configurar la escena, cámara y renderizador.
  let lienzo = createCanvas(windowWidth, windowHeight);
  lienzo.position(0, 0);
  escena = new THREE.Scene();
  camara = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camara.position.z = 10;
  renderizador = new THREE.WebGLRenderer();
  renderizador.setSize(width, height);
  document.body.appendChild(renderizador.domElement);
  
  // Agregar iluminación a la escena y un suelo.
  const luzDireccional = new THREE.DirectionalLight(0xffffff, 1);
  luzDireccional.position.set(0, 10, 10);
  escena.add(luzDireccional);
  const geometriaSuelo = new THREE.PlaneGeometry(100, 100);
  const materialSuelo = new THREE.MeshPhongMaterial({ color: 0x999999, side: THREE.DoubleSide });
  const suelo = new THREE.Mesh(geometriaSuelo, materialSuelo);
  suelo.rotation.x = -Math.PI / 2;
  escena.add(suelo);
  
  // Inicializar el jugador y objetos interactivos en la escena.
  jugador = new Jugador();
  jugador.malla.position.y = 1;
  escena.add(jugador.malla);
  for (let i = 0; i < 100; i++) {
    const malla = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    malla.position.set(random(-50, 50), 1, random(-50, 50));
    const objeto = new ObjetoInteractivo(malla, modelosObj, videos, datosNarrativos[i]);
    objetosInteractivos.push(objeto);
    escena.add(malla);
  }
}

// Función de dibujo que se ejecuta en cada frame.
function dibujar() {
  // Renderizar la escena.
  renderizador.render(escena, camara);
  
  // Iterar sobre objetos interactivos para mostrar indicaciones, detectar interacciones y actualizar el jugador.
  for (let obj of objetosInteractivos) {
    const estaCerca = jugador.estaCerca(obj.malla);

    if (estaCerca) {
      obj.mostrarIndicacion();
      if (keyIsDown(69)) obj.interactuar(jugador);
    } else {
      obj.ocultarIndicacion();
      obj.detenerVideo(); // Detener el video si el jugador se aleja del cubo.
    }
  }
  // Actualizar la posición de la cámara según el jugador.
  jugador.actualizar();
  camara.position.set(jugador.malla.position.x, jugador.malla.position.y + 10, jugador.malla.position.z + 10);
  camara.lookAt(jugador.malla.position);
}

// Clase que representa al jugador en la escena.
class Jugador {
  constructor() {
    // Crear una esfera amarilla para representar al jugador.
    this.malla = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
    this.velocidad = new THREE.Vector3();
    this.velocidadInicial = 0.1;
  }
  // Actualizar la posición del jugador según las teclas presionadas.
  actualizar() {
    if (keyIsDown(87)) this.velocidad.z -= this.velocidadInicial;
    if (keyIsDown(83)) this.velocidad.z += this.velocidadInicial;
    if (keyIsDown(65)) this.velocidad.x -= this.velocidadInicial;
    if (keyIsDown(68)) this.velocidad.x += this.velocidadInicial;
    this.malla.position.add(this.velocidad);
    this.velocidad.set(0, 0, 0);
  }
  // Verificar si el jugador está cerca de un objeto en la escena.
  estaCerca(objeto) {
    return this.malla.position.distanceTo(objeto.position) < 5;
  }
}

// Clase que representa un objeto interactivo en la escena.
class ObjetoInteractivo {
  constructor(malla, modelos, videos, narrativa) {
    this.malla = malla;
    this.modelos = modelos;
    this.videos = videos;
    this.narrativa = narrativa;
    this.interactuado = false;
    this.indiceVideo = Math.floor(random(this.videos.length));
    this.videoReproduciendo = false;
    this.videoActual = null;
  }
  // Mostrar indicación para interactuar con el objeto.
  mostrarIndicacion() {
    fill(255);
    textAlign(CENTER);
    textSize(20);
    text('Presiona "E" para interactuar', this.malla.position.x, this.malla.position.y + 2, this.malla.position.z);
  }
  // Ocultar la indicación del objeto.
  ocultarIndicacion() {
    // Ocultar el cartel.
  }
  // Interactuar con el objeto, reproduciendo o deteniendo un video.
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
          if (!videoEnPantallaCompleta) pantallaCompleta(videoElegido);
          else restaurarLienzo();

          videoEnPantallaCompleta = !videoEnPantallaCompleta;
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
  // Detener la reproducción del video.
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
  // Ocultar videos que no están siendo reproducidos.
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

// Función para poner el lienzo en pantalla completa con el elemento pasado como parámetro.
function pantallaCompleta(elemento) {
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

// Restaurar el lienzo a su tamaño original.
function restaurarLienzo() {
  const elementoCanvas = document.getElementById('defaultCanvas0');
  const elementosVideo = document.getElementsByTagName('video');
  elementoCanvas.style.display = 'block';

  for (let i = 0; i < elementosVideo.length; i++) elementosVideo[i].style.display = 'none';
}
