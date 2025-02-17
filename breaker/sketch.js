let motor, mundo;
let pelotas = [];
let paleta;
let bloques = [];
let powerUps = [];
let lasers = [];
let particulas = [];
let estadoJuego = 'MENU';
let puntuacion = 0;
let vidas = 3;
let nivel = 1;
let nivelesMaximos = 5;
let tiempoUltimoDisparo = 0;
let laserActivo = false;
let explosionEnCadenaActiva = false;

let sonidoGolpe, sonidoPunto, sonidoPerder, sonidoGanar, sonidoPowerUp, sonidoLaser;
let fuentePrincipal;

let estrellas = [];

let texturaPelota, texturaPaleta, texturaBotonInicio;
let texturaBloques = {};
let texturasPowerUps = {};

let botonInicio;

let lore = [
  "En el año 3045, la humanidad se enfrenta a una crisis energética sin precedentes.",
  "Los científicos descubren cristales de energía en asteroides cercanos a la Tierra.",
  "Tu misión: Pilotear la nave BREAKER-X para recolectar estos cristales.",
  "Cada bloque representa un cristal. Destrúyelos para salvar a la humanidad.",
  "Pero ten cuidado, los asteroides son peligrosos y tu escudo es limitado."
];

let niveles = [
  {
    disposicion: [
      [1,1,1,1,1],
      [0,1,1,1,0],
      [0,0,1,0,0]
    ],
    velocidadBase: 5
  },
  {
    disposicion: [
      [1,1,1,1,1],
      [1,0,1,0,1],
      [1,1,1,1,1]
    ],
    velocidadBase: 6
  },
  {
    disposicion: [
      [1,1,1,1,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
      [1,1,1,1,1]
    ],
    velocidadBase: 7
  },
  {
    disposicion: [
      [1,1,1,0,1,1,1],
      [1,0,1,0,1,0,1],
      [1,1,1,1,1,1,1],
      [0,0,1,1,1,0,0]
    ],
    velocidadBase: 8
  },
  {
    disposicion: [
      [1,1,1,1,1,1,1],
      [1,0,0,1,0,0,1],
      [1,0,1,1,1,0,1],
      [1,0,0,1,0,0,1],
      [1,1,1,1,1,1,1]
    ],
    velocidadBase: 9
  }
];

function preload() {
  soundFormats('mp3', 'wav');
  sonidoGolpe = loadSound('golpe.wav');
  sonidoPunto = loadSound('punto.wav');
  sonidoPerder = loadSound('perder.wav');
  sonidoGanar = loadSound('ganar.wav');
  sonidoPowerUp = loadSound('powerup.wav');
  sonidoLaser = loadSound('laser.wav');
  
  fuentePrincipal = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceSansPro-Regular.otf');

  texturaPelota = loadImage('pelota_clara.png');
  texturaPaleta = loadImage('paleta.png');
  texturaBotonInicio = loadImage('boton_inicio.png');

  texturaBloques[1] = loadImage('bloque1.png');
  texturaBloques[2] = loadImage('bloque2.png');
  texturaBloques[3] = loadImage('bloque3.png');

  texturasPowerUps['agrandarPaleta'] = loadImage('powerup_agrandar.png');
  texturasPowerUps['pelotaRapida'] = loadImage('powerup_rapida.png');
  texturasPowerUps['vidaExtra'] = loadImage('powerup_vida.png');
  texturasPowerUps['multiPelota'] = loadImage('powerup_multi.png');
  texturasPowerUps['laser'] = loadImage('powerup_laser.png');
  texturasPowerUps['tiempoLento'] = loadImage('powerup_lento.png');
  texturasPowerUps['magnetico'] = loadImage('powerup_magnetico.png');
  texturasPowerUps['pelotaFantasma'] = loadImage('powerup_fantasma.png');
  texturasPowerUps['paletaPegajosa'] = loadImage('powerup_pegajosa.png');
  texturasPowerUps['explosionEnCadena'] = loadImage('powerup_explosion.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);
  textFont(fuentePrincipal);
  
  let escala = windowWidth / 800;
  
  motor = Matter.Engine.create();
  mundo = motor.world;
  
  mundo.gravity.y = 0;
  
  crearPelota(escala);
  crearPaleta(escala);
  crearBloques(escala);
  crearParedes();
  
  Matter.Events.on(motor, 'collisionStart', manejarColisiones);

  let numEstrellas = Math.floor((windowWidth * windowHeight) / 4000);
  for (let i = 0; i < numEstrellas; i++) {
    estrellas.push({
      x: random(-width, width),
      y: random(-height, height),
      z: random(-200, -100)
    });
  }

  if (windowWidth < windowHeight) {
    alert("Por favor, gira tu dispositivo para una mejor experiencia de juego.");
  }

  botonInicio = {
    x: 0,
    y: 0,
    ancho: width * 0.3,
    alto: height * 0.15,
    visible: true
  };
}

function draw() {
  background(0);
  
  let maxParticulas = width < 600 ? 50 : 200;
  while (particulas.length > maxParticulas) {
    particulas.shift();
  }
  
  push();
  stroke(255);
  strokeWeight(2);
  for (let estrella of estrellas) {
    point(estrella.x, estrella.y, estrella.z);
    estrella.y += 0.1;
    if (estrella.y > height) {
      estrella.y = -height;
    }
  }
  pop();
  
  if (estadoJuego === 'MENU') {
    mostrarMenu();
  } else if (estadoJuego === 'LORE') {
    mostrarLore();
  } else if (estadoJuego === 'JUGAR') {
    actualizarJuego();
    mostrarJuego();
  } else if (estadoJuego === 'FIN') {
    mostrarPantallaFin();
  } else if (estadoJuego === 'GANAR') {
    mostrarPantallaGanar();
  }
}

function mostrarMenu() {
  push();
  translate(-width/2, -height/2, 0);
  textAlign(CENTER);
  fill(255);
  textSize(width * 0.08);
  text('BREAKER-X: Misión Energía', width/2, height/3);
  
  if (botonInicio.visible) {
    image(texturaBotonInicio, width/2 - botonInicio.ancho/2, height/2 - botonInicio.alto/2, botonInicio.ancho, botonInicio.alto);
  }
  
  pop();
}

function mostrarLore() {
  push();
  translate(-width/2, -height/2, 0);
  textAlign(CENTER);
  fill(255);
  textSize(width * 0.03);
  for (let i = 0; i < lore.length; i++) {
    text(lore[i], width/2, height/4 + i * (height * 0.1));
  }
  textSize(width * 0.04);
  text('Toca para comenzar', width/2, height - 50);
  pop();
}

function mostrarJuego() {
  for (let pelota of pelotas) {
    pelota.mostrar();
  }
  
  paleta.mostrar();
  
  for (let bloque of bloques) {
    bloque.mostrar();
  }
  
  for (let powerUp of powerUps) {
    powerUp.mostrar();
  }
  
  for (let laser of lasers) {
    laser.mostrar();
  }
  
  for (let i = particulas.length - 1; i >= 0; i--) {
    particulas[i].actualizar();
    particulas[i].mostrar();
    if (particulas[i].vida <= 0) {
      particulas.splice(i, 1);
    }
  }
  
  push();
  translate(-width/2, -height/2, 0);
  fill(255);
  textSize(width * 0.04);
  textAlign(LEFT);
  text('Puntuación: ' + puntuacion, 10, 30);
  text('Vidas: ' + vidas, 10, 70);
  text('Nivel: ' + nivel, 10, 110);
  pop();
}

function mostrarPantallaFin() {
  push();
  translate(-width/2, -height/2, 0);
  textAlign(CENTER);
  fill(255, 0, 0);
  textSize(width * 0.08);
  text('Fin del Juego', width/2, height/3);
  fill(255);
  textSize(width * 0.04);
  text('Puntuación Final: ' + puntuacion, width/2, height/2);
  text('Toca para volver al menú', width/2, height/2 + 60);
  
  if (botonInicio.visible) {
    image(texturaBotonInicio, width/2 - botonInicio.ancho/2, height/2 + 100, botonInicio.ancho, botonInicio.alto);
  }
  
  pop();
}

function mostrarPantallaGanar() {
  push();
  translate(-width/2, -height/2, 0);
  textAlign(CENTER);
  fill(0, 255, 0);
  textSize(width * 0.08);
  text('¡Has Salvado a la Humanidad!', width/2, height/3);
  fill(255);
  textSize(width * 0.04);
  text('Puntuación Final: ' + puntuacion, width/2, height/2);
  text('Toca para volver al menú', width/2, height/2 + 60);
  
  if (botonInicio.visible) {
    image(texturaBotonInicio, width/2 - botonInicio.ancho/2, height/2 + 100, botonInicio.ancho, botonInicio.alto);
  }
  
  pop();
}

function actualizarJuego() {
  Matter.Engine.update(motor);
  
  let touchX = touches.length > 0 ? touches[0].x : mouseX;
  let paletaX = map(touchX, 0, width, 50, width - 50);
  Matter.Body.setPosition(paleta.cuerpo, { 
    x: paletaX, 
    y: height - height * 0.05 
  });
  
  for (let i = pelotas.length - 1; i >= 0; i--) {
    pelotas[i].actualizar();
    if (pelotas[i].cuerpo.position.y > height) {
      Matter.World.remove(mundo, pelotas[i].cuerpo);
      pelotas.splice(i, 1);
    }
  }
  
  if (pelotas.length === 0) {
    vidas--;
    if (vidas <= 0) {
      estadoJuego = 'FIN';
      sonidoPerder.play();
      botonInicio.visible = true;
    } else {
      crearPelota(windowWidth / 800);
    }
  }
  
  for (let i = powerUps.length - 1; i >= 0; i--) {
    if (powerUps[i].actualizar()) {
      powerUps.splice(i, 1);
    }
  }
  
  for (let i = lasers.length - 1; i >= 0; i--) {
    lasers[i].actualizar();
    if (lasers[i].estaFueraDePantalla()) {
      lasers.splice(i, 1);
    }
  }
  
  if (bloques.length === 0) {
    if (nivel < nivelesMaximos) {
      nivel++;
      crearBloques(windowWidth / 800);
      crearPelota(windowWidth / 800);
    } else {
      estadoJuego = 'GANAR';
      sonidoGanar.play();
      botonInicio.visible = true;
    }
  }
  
  for (let pelota of pelotas) {
    let velocidad = Matter.Vector.magnitude(pelota.cuerpo.velocity);
    let velocidadDeseada = niveles[nivel - 1].velocidadBase * (width / 800);
    if (velocidad !== 0) {
      let factor = velocidadDeseada / velocidad;
      Matter.Body.setVelocity(pelota.cuerpo, {
        x: pelota.cuerpo.velocity.x * factor,
        y: pelota.cuerpo.velocity.y * factor
      });
    }
  }
  
  if (laserActivo && millis() - tiempoUltimoDisparo > 500) {
    dispararLaser();
    tiempoUltimoDisparo = millis();
  }

  paleta.actualizar();
}

class Pelota {
  constructor(cuerpo) {
    this.cuerpo = cuerpo;
    this.rotacion = 0;
    this.estela = [];
    this.esFantasma = false;
  }

  actualizar() {
    this.rotacion += 0.1;
    this.estela.unshift({x: this.cuerpo.position.x, y: this.cuerpo.position.y});
    if (this.estela.length > 10) this.estela.pop();
  }

  mostrar() {
    for (let i = 0; i < this.estela.length; i++) {
      push();
      translate(this.estela[i].x - width/2, this.estela[i].y - height/2, 0);
      fill(255, 255, 255, 255 * (1 - i / this.estela.length));
      sphere(width * 0.01 * (1 - i / this.estela.length));
      pop();
    }

    push();
    translate(this.cuerpo.position.x - width/2, this.cuerpo.position.y - height/2, 0);
    rotateY(this.rotacion);
    if (this.esFantasma) {
      tint(255, 200);
    } else {
      tint(255, 255);
    }
    texture(texturaPelota);
    sphere(width * 0.015);
    pop();
  }
}

class Paleta {
  constructor(cuerpo, ancho) {
    this.cuerpo = cuerpo;
    this.ancho = ancho;
    this.escalaY = 1;
    this.esPegajosa = false;
  }

  actualizar() {
    if (this.escalaY > 1) {
      this.escalaY = lerp(this.escalaY, 1, 0.1);
    }
  }

  mostrar() {
    push();
    translate(this.cuerpo.position.x - width/2, this.cuerpo.position.y - height/2, 0);
    scale(1, this.escalaY, 1);
    texture(texturaPaleta);
    if (this.esPegajosa) {
      tint(255, 255, 0);
    }
    box(this.ancho, height * 0.02, width * 0.02);
    pop();
  }

  golpear() {
    this.escalaY = 1.5;
  }
}

class Bloque {
  constructor(cuerpo, resistencia, ancho, alto) {
    this.cuerpo = cuerpo;
    this.resistencia = resistencia;
    this.ancho = ancho;
    this.alto = alto;
    this.tienePowerUp = random() < 0.2 + nivel * 0.01;
  }

  mostrar() {
    push();
    translate(this.cuerpo.position.x - width/2, this.cuerpo.position.y - height/2, 0);
    texture(texturaBloques[this.resistencia]);
    box(this.ancho, this.alto, width * 0.02);
    pop();
  }
}

class PowerUp {
  constructor(x, y, tipo) {
    this.x = x;
    this.y = y;
    this.tipo = tipo;
    this.radio = 15;
    this.velocidad = 2;
    this.duracion = 10 * 60; // 10 segundos a 60 FPS
  }
  
  actualizar() {
    this.y += this.velocidad;
    
    if (this.colisionConPaleta()) {
      this.aplicarEfecto();
      return true;
    }
    
    return this.y > height;
  }
  
  mostrar() {
    push();
    translate(this.x - width/2, this.y - height/2, 0);
    rotateY(frameCount * 0.1);
    texture(texturasPowerUps[this.tipo]);
    box(this.radio * 2);
    pop();
  }
  
  colisionConPaleta() {
    return (
      this.x > paleta.cuerpo.position.x - paleta.ancho/2 &&
      this.x < paleta.cuerpo.position.x + paleta.ancho/2 &&
      this.y + this.radio > paleta.cuerpo.position.y - 10 &&
      this.y - this.radio < paleta.cuerpo.position.y + 10
    );
  }
  
  aplicarEfecto() {
    switch (this.tipo) {
      case 'agrandarPaleta':
        let nuevoAncho = paleta.ancho * 1.5;
        Matter.Body.scale(paleta.cuerpo, 1.5, 1);
        paleta.ancho = nuevoAncho;
        setTimeout(() => {
          Matter.Body.scale(paleta.cuerpo, 1/1.5, 1);
          paleta.ancho = paleta.ancho / 1.5;
        }, this.duracion);
        break;
      case 'pelotaRapida':
        for (let pelota of pelotas) {
          Matter.Body.setVelocity(pelota.cuerpo, {
            x: pelota.cuerpo.velocity.x * 1.5,
            y: pelota.cuerpo.velocity.y * 1.5
          });
        }
        setTimeout(() => {
          for (let pelota of pelotas) {
            Matter.Body.setVelocity(pelota.cuerpo, {
              x: pelota.cuerpo.velocity.x / 1.5,
              y: pelota.cuerpo.velocity.y / 1.5
            });
          }
        }, this.duracion);
        break;
      case 'vidaExtra':
        vidas++;
        break;
      case 'multiPelota':
        for (let i = 0; i < 2; i++) {
          crearPelota(windowWidth / 800);
        }
        break;
      case 'laser':
        laserActivo = true;
        setTimeout(() => {
          laserActivo = false;
        }, this.duracion);
        break;
      case 'tiempoLento':
        let factorTiempo = 0.5;
        for (let pelota of pelotas) {
          pelota.velocidadOriginal = pelota.cuerpo.velocity;
          Matter.Body.setVelocity(pelota.cuerpo, {
            x: pelota.cuerpo.velocity.x * factorTiempo,
            y: pelota.cuerpo.velocity.y * factorTiempo
          });
        }
        setTimeout(() => {
          for (let pelota of pelotas) {
            Matter.Body.setVelocity(pelota.cuerpo, pelota.velocidadOriginal);
          }
        }, this.duracion);
        break;
      case 'magnetico':
        paleta.magnetico = true;
        setTimeout(() => {
          paleta.magnetico = false;
        }, this.duracion);
        break;
      case 'pelotaFantasma':
        for (let pelota of pelotas) {
          pelota.esFantasma = true;
        }
        setTimeout(() => {
          for (let pelota of pelotas) {
            pelota.esFantasma = false;
          }
        }, this.duracion);
        break;
      case 'paletaPegajosa':
        paleta.esPegajosa = true;
        setTimeout(() => {
          paleta.esPegajosa = false;
        }, this.duracion);
        break;
      case 'explosionEnCadena':
        explosionEnCadenaActiva = true;
        setTimeout(() => {
          explosionEnCadenaActiva = false;
        }, this.duracion);
        break;
    }
  }
}

class Laser {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.velocidad = -10;
    this.ancho = 5;
    this.alto = 20;
  }
  
  actualizar() {
    this.y += this.velocidad;
    this.checkColision();
  }
  
  mostrar() {
    push();
    translate(this.x - width/2, this.y - height/2, 0);
    fill(255, 0, 0);
    noStroke();
    cylinder(this.ancho / 2, this.alto);
    pop();
  }
  
  estaFueraDePantalla() {
    return this.y < 0;
  }
  
  checkColision() {
    for (let i = bloques.length - 1; i >= 0; i--) {
      let bloque = bloques[i];
      if (this.x > bloque.cuerpo.position.x - bloque.ancho/2 &&
          this.x < bloque.cuerpo.position.x + bloque.ancho/2 &&
          this.y > bloque.cuerpo.position.y - bloque.alto/2 &&
          this.y < bloque.cuerpo.position.y + bloque.alto/2) {
        destruirBloque(bloque);
        return true;
      }
    }
    return false;
  }
}

class Particula {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random3D().mult(random(1, 3));
    this.color = color(random(200, 255), random(100, 200), 0);
    this.vida = 255;
  }

  actualizar() {
    this.pos.add(this.vel);
    this.vida -= 5;
  }

  mostrar() {
    push();
    translate(this.pos.x - width/2, this.pos.y - height/2, this.pos.z);
    noStroke();
    fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.vida);
    sphere(3);
    pop();
  }
}

function crearPelota(escala) {
  let pelotaCuerpo = Matter.Bodies.circle(width / 2, height - height * 0.1, width * 0.015, {
    restitution: 1,
    friction: 0,
    frictionAir: 0,
    density: 0.001,
    label: 'pelota'
  });
  Matter.Body.setVelocity(pelotaCuerpo, { x: random(-5, 5) * escala, y: -10 * escala });
  Matter.World.add(mundo, pelotaCuerpo);
  pelotas.push(new Pelota(pelotaCuerpo));
}

function crearPaleta(escala) {
  let anchoInicial = width * 0.15;
  let paletaCuerpo = Matter.Bodies.rectangle(width / 2, height - height * 0.05, anchoInicial, height * 0.02, {
    isStatic: true,
    label: 'paleta'
  });
  Matter.World.add(mundo, paletaCuerpo);
  paleta = new Paleta(paletaCuerpo, anchoInicial);
}

function crearBloques(escala) {
  bloques = [];
  let nivelActual = niveles[nivel - 1];
  let bloqueAncho = width / nivelActual.disposicion[0].length;
  let bloqueAlto = height * 0.04;

  for (let i = 0; i < nivelActual.disposicion.length; i++) {
    for (let j = 0; j < nivelActual.disposicion[i].length; j++) {
      if (nivelActual.disposicion[i][j] === 1) {
        let x = j * bloqueAncho + bloqueAncho / 2;
        let y = i * bloqueAlto + bloqueAlto / 2 + height * 0.1;
        
        let bloqueCuerpo = Matter.Bodies.rectangle(x, y, bloqueAncho - 5, bloqueAlto - 5, {
          isStatic: true,
          label: 'bloque'
        });
        
        let resistencia = Math.min(Math.floor(nivel / 2) + 1, 3);
        let bloque = new Bloque(bloqueCuerpo, resistencia, bloqueAncho - 5, bloqueAlto - 5);
        bloques.push(bloque);
        Matter.World.add(mundo, bloqueCuerpo);
      }
    }
  }
}

function crearParedes() {
  let grosor = width * 0.05;
  Matter.World.add(mundo, [
    Matter.Bodies.rectangle(width/2, -grosor/2, width, grosor, { isStatic: true }),
    Matter.Bodies.rectangle(-grosor/2, height/2, grosor, height, { isStatic: true }),
    Matter.Bodies.rectangle(width + grosor/2, height/2, grosor, height, { isStatic: true })
  ]);
}

function manejarColisiones(event) {
  let pares = event.pairs;
  
  for (let par of pares) {
    let cuerpoA = par.bodyA;
    let cuerpoB = par.bodyB;
    
    if (cuerpoA.label === 'pelota' || cuerpoB.label === 'pelota') {
      sonidoGolpe.play();
      
      if (cuerpoA.label === 'paleta' || cuerpoB.label === 'paleta') {
        let pelotaCuerpo = cuerpoA.label === 'pelota' ? cuerpoA : cuerpoB;
        let paletaCuerpo = cuerpoA.label === 'paleta' ? cuerpoA : cuerpoB;
        
        let puntoColision = par.collision.supports[0];
        let paletaCentro = paletaCuerpo.position.x;
        let distanciaDelCentro = puntoColision.x - paletaCentro;
        
        let porcentaje = distanciaDelCentro / (paleta.ancho / 2);
        let angulo = map(porcentaje, -1, 1, -PI/3, PI/3);
        
        let velocidad = Matter.Vector.magnitude(pelotaCuerpo.velocity);
        let nuevaVelocidad = Matter.Vector.rotate({ x: 0, y: -velocidad }, angulo);
        Matter.Body.setVelocity(pelotaCuerpo, nuevaVelocidad);

        paleta.golpear();

        if (paleta.esPegajosa) {
          Matter.Body.setVelocity(pelotaCuerpo, { x: 0, y: 0 });
          Matter.Body.setPosition(pelotaCuerpo, {
            x: paletaCuerpo.position.x,
            y: paletaCuerpo.position.y - paleta.alto / 2 - width * 0.015
          });
        }
      } else if (cuerpoA.label === 'bloque' || cuerpoB.label === 'bloque') {
        let bloque = bloques.find(b => b.cuerpo === cuerpoA || b.cuerpo === cuerpoB);
        if (bloque) {
          let pelota = pelotas.find(p => p.cuerpo === (cuerpoA.label === 'pelota' ? cuerpoA : cuerpoB));
          if (!pelota.esFantasma) {
            bloque.resistencia--;
            if (bloque.resistencia <= 0) {
              destruirBloque(bloque);
            }
          }
        }
      }
    }
  }
}

function destruirBloque(bloque) {
  Matter.World.remove(mundo, bloque.cuerpo);
  bloques = bloques.filter(b => b !== bloque);
  puntuacion += 10 * nivel;
  sonidoPunto.play();
  
  crearExplosion(bloque.cuerpo.position.x, bloque.cuerpo.position.y);
  
  if (bloque.tienePowerUp) {
    crearPowerUp(bloque.cuerpo.position.x, bloque.cuerpo.position.y);
  }

  if (explosionEnCadenaActiva) {
    destruirBloquesAdyacentes(bloque);
  }
}

function crearPowerUp(x, y) {
  let tipos = ['agrandarPaleta', 'pelotaRapida', 'vidaExtra', 'multiPelota', 'laser', 'tiempoLento', 'magnetico', 'pelotaFantasma', 'paletaPegajosa', 'explosionEnCadena'];
  let tipo = random(tipos);
  powerUps.push(new PowerUp(x, y, tipo));
  sonidoPowerUp.play();
}

function dispararLaser() {
  lasers.push(new Laser(paleta.cuerpo.position.x, paleta.cuerpo.position.y - 20));
  sonidoLaser.play();
}

function crearExplosion(x, y) {
  let numParticulas = width < 600 ? 10 : 20;
  for (let i = 0; i < numParticulas; i++) {
    particulas.push(new Particula(x, y));
  }
}

function touchStarted() {
  if (estadoJuego === 'JUGAR') {
    if (laserActivo) {
      dispararLaser();
    }
  } else if (estadoJuego === 'MENU' || estadoJuego === 'LORE') {
    if (botonInicio.visible && 
        mouseX > width/2 - botonInicio.ancho/2 && 
        mouseX < width/2 + botonInicio.ancho/2 && 
        mouseY > height/2 - botonInicio.alto/2 && 
        mouseY < height/2 + botonInicio.alto/2) {
      estadoJuego = 'JUGAR';
      reiniciarJuego();
      botonInicio.visible = false;
    }
  } else if (estadoJuego === 'FIN' || estadoJuego === 'GANAR') {
    if (botonInicio.visible && 
        mouseX > width/2 - botonInicio.ancho/2 && 
        mouseX < width/2 + botonInicio.ancho/2 && 
        mouseY > height/2 + 100 && 
        mouseY < height/2 + 100 + botonInicio.alto) {
      estadoJuego = 'MENU';
      botonInicio.visible = true;
    }
  }
  return false;
}

function touchMoved() {
  if (estadoJuego === 'JUGAR') {
    let touchX = touches[0].x;
    let paletaX = map(touchX, 0, width, 50, width - 50);
    Matter.Body.setPosition(paleta.cuerpo, { 
      x: paletaX, 
      y: height - height * 0.05 
    });
  }
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  let escala = windowWidth / 800;
  if (paleta) {
    Matter.Body.setPosition(paleta.cuerpo, { 
      x: width / 2, 
      y: height - height * 0.05 
    });
  }
  botonInicio.ancho = width * 0.3;
  botonInicio.alto = height * 0.15;
}

function reiniciarJuego() {
  puntuacion = 0;
  vidas = 3;
  nivel = 1;
  Matter.World.clear(mundo);
  pelotas = [];
  crearPelota(windowWidth / 800);
  crearPaleta(windowWidth / 800);
  crearBloques(windowWidth / 800);
  crearParedes();
  powerUps = [];
  lasers = [];
  laserActivo = false;
  explosionEnCadenaActiva = false;
}

function destruirBloquesAdyacentes(bloqueInicial) {
  let bloquesADestruir = [];
  for (let bloque of bloques) {
    if (estaCerca(bloqueInicial, bloque)) {
      bloquesADestruir.push(bloque);
    }
  }
  for (let bloque of bloquesADestruir) {
    destruirBloque(bloque);
  }
}

function estaCerca(bloque1, bloque2) {
  let distancia = dist(bloque1.cuerpo.position.x, bloque1.cuerpo.position.y,
                       bloque2.cuerpo.position.x, bloque2.cuerpo.position.y);
  return distancia < bloque1.ancho * 1.5;
}
