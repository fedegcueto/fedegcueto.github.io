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

let sonidoGolpe, sonidoPunto, sonidoPerder, sonidoGanar, sonidoPowerUp, sonidoLaser;
let fuentePrincipal;

let estrellas = [];

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
  soundFormats('mp3');
  sonidoGolpe = loadSound('golpe.wav');
  sonidoPunto = loadSound('punto.wav');
  sonidoPerder = loadSound('perder.wav');
  sonidoGanar = loadSound('ganar.wav');
  sonidoPowerUp = loadSound('powerup.wav');
  sonidoLaser = loadSound('laser.wav');
  
  fuentePrincipal = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceSansPro-Regular.otf');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  textFont(fuentePrincipal);
  
  motor = Matter.Engine.create();
  mundo = motor.world;
  
  mundo.gravity.y = 0;
  
  crearPelota();
  crearPaleta();
  crearBloques();
  crearParedes();
  
  Matter.Events.on(motor, 'collisionStart', manejarColisiones);

  for (let i = 0; i < 200; i++) {
    estrellas.push({
      x: random(-width, width),
      y: random(-height, height),
      z: random(-200, -100)
    });
  }
}

function draw() {
  background(0);
  
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
  textSize(width * 0.05);
  text('BREAKER-X: Misión Energía', width/2, height/3);
  textSize(width * 0.02);
  text('Presiona ENTER para comenzar', width/2, height/2);
  text('Presiona L para ver el Lore', width/2, height/2 + 30);
  pop();
}

function mostrarLore() {
  push();
  translate(-width/2, -height/2, 0);
  textAlign(CENTER);
  fill(255);
  textSize(width * 0.02);
  for (let i = 0; i < lore.length; i++) {
    text(lore[i], width/2, height/4 + i * (height * 0.08));
  }
  textSize(width * 0.015);
  text('Presiona ENTER para comenzar', width/2, height - 50);
  pop();
}

function mostrarJuego() {
  for (let pelota of pelotas) {
    push();
    translate(pelota.cuerpo.position.x - width/2, pelota.cuerpo.position.y - height/2, 0);
    rotateY(frameCount * 0.1);
    fill(255);
    noStroke();
    sphere(width * 0.01);
    pop();
  }
  
  push();
  translate(paleta.cuerpo.position.x - width/2, paleta.cuerpo.position.y - height/2, 0);
  fill(200);
  noStroke();
  box(paleta.ancho, height * 0.02, width * 0.02);
  pop();
  
  for (let bloque of bloques) {
    push();
    translate(bloque.cuerpo.position.x - width/2, bloque.cuerpo.position.y - height/2, 0);
    fill(bloque.color);
    noStroke();
    box(bloque.ancho, bloque.alto, width * 0.02);
    pop();
  }
  
  for (let powerUp of powerUps) {
    powerUp.display();
  }
  
  for (let laser of lasers) {
    laser.display();
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
  textSize(width * 0.02);
  textAlign(LEFT);
  text('Puntuación: ' + puntuacion, 10, 20);
  text('Vidas: ' + vidas, 10, 40);
  text('Nivel: ' + nivel, 10, 60);
  pop();
}

function mostrarPantallaFin() {
  push();
  translate(-width/2, -height/2, 0);
  textAlign(CENTER);
  fill(255, 0, 0);
  textSize(width * 0.05);
  text('Fin del Juego', width/2, height/3);
  fill(255);
  textSize(width * 0.02);
  text('Puntuación Final: ' + puntuacion, width/2, height/2);
  text('Presiona ENTER para volver al menú', width/2, height/2 + 30);
  pop();
}

function mostrarPantallaGanar() {
  push();
  translate(-width/2, -height/2, 0);
  textAlign(CENTER);
  fill(0, 255, 0);
  textSize(width * 0.05);
  text('¡Has Salvado a la Humanidad!', width/2, height/3);
  fill(255);
  textSize(width * 0.02);
  text('Puntuación Final: ' + puntuacion, width/2, height/2);
  text('Presiona ENTER para volver al menú', width/2, height/2 + 30);
  pop();
}

function actualizarJuego() {
  Matter.Engine.update(motor);
  
  let mouseXRelativo = mouseX / width;
  Matter.Body.setPosition(paleta.cuerpo, { 
    x: constrain(mouseXRelativo * width, 50, width - 50), 
    y: height - height * 0.05 
  });
  
  for (let i = pelotas.length - 1; i >= 0; i--) {
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
    } else {
      crearPelota();
    }
  }
  
  for (let i = powerUps.length - 1; i >= 0; i--) {
    if (powerUps[i].update()) {
      powerUps.splice(i, 1);
    }
  }
  
  for (let i = lasers.length - 1; i >= 0; i--) {
    lasers[i].update();
    if (lasers[i].isOffScreen()) {
      lasers.splice(i, 1);
    }
  }
  
  if (bloques.length === 0) {
    if (nivel < nivelesMaximos) {
      nivel++;
      crearBloques();
      crearPelota();
    } else {
      estadoJuego = 'GANAR';
      sonidoGanar.play();
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
}

function crearPelota() {
  let pelotaCuerpo = Matter.Bodies.circle(width / 2, height - height * 0.1, width * 0.01, {
    restitution: 1,
    friction: 0,
    frictionAir: 0,
    density: 0.001,
    label: 'pelota'
  });
  Matter.Body.setVelocity(pelotaCuerpo, { x: random(-5, 5), y: -10 });
  Matter.World.add(mundo, pelotaCuerpo);
  pelotas.push({ cuerpo: pelotaCuerpo });
}

function crearPaleta() {
  let anchoInicial = width * 0.15;
  let paletaCuerpo = Matter.Bodies.rectangle(width / 2, height - height * 0.05, anchoInicial, height * 0.02, {
    isStatic: true,
    label: 'paleta'
  });
  Matter.World.add(mundo, paletaCuerpo);
  paleta = { cuerpo: paletaCuerpo, ancho: anchoInicial };
}

function crearBloques() {
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
        
        let resistencia = Math.min(Math.floor(nivel / 2) + 1, 5);
        let bloque = {
          cuerpo: bloqueCuerpo,
          color: color(255 - resistencia * 40, resistencia * 40, 100),
          tienePowerUp: random() < 0.2 + nivel * 0.01,
          resistencia: resistencia,
          ancho: bloqueAncho - 5,
          alto: bloqueAlto - 5
        };
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
      } else if (cuerpoA.label === 'bloque' || cuerpoB.label === 'bloque') {
        let bloque = bloques.find(b => b.cuerpo === cuerpoA || b.cuerpo === cuerpoB);
        if (bloque) {
          bloque.resistencia--;
          if (bloque.resistencia <= 0) {
            Matter.World.remove(mundo, bloque.cuerpo);
            bloques = bloques.filter(b => b !== bloque);
            puntuacion += 10 * nivel;
            sonidoPunto.play();
            
            crearExplosion(bloque.cuerpo.position.x, bloque.cuerpo.position.y);
            
            if (bloque.tienePowerUp) {
              crearPowerUp(bloque.cuerpo.position.x, bloque.cuerpo.position.y);
            }
          } else {
            bloque.color = color(255 - bloque.resistencia * 40, bloque.resistencia * 40, 100);
          }
        }
      }
    }
  }
}

function crearPowerUp(x, y) {
  let tipo = random(['agrandarPaleta', 'pelotaRapida', 'vidaExtra', 'multiPelota', 'laser', 'tiempoLento', 'magnetico']);
  powerUps.push(new PowerUp(x, y, tipo));
  sonidoPowerUp.play();
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
  
  update() {
    this.y += this.velocidad;
    
    if (this.colisionConPaleta()) {
      this.aplicarEfecto();
      return true;
    }
    
    return this.y > height;
  }
  
  display() {
    push();
    translate(this.x - width/2, this.y - height/2, 0);
    rotateY(frameCount * 0.1);
    fill(255, 255, 0);
    noStroke();
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
          crearPelota();
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
    }
  }
}

function dispararLaser() {
  lasers.push(new Laser(paleta.cuerpo.position.x, paleta.cuerpo.position.y - 20));
  sonidoLaser.play();
}

class Laser {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.velocidad = -10;
    this.ancho = 5;
    this.alto = 20;
  }
  
  update() {
    this.y += this.velocidad;
    this.checkColision();
  }
  
  display() {
    push();
    translate(this.x - width/2, this.y - height/2, 0);
    fill(255, 0, 0);
    noStroke();
    cylinder(this.ancho / 2, this.alto);
    pop();
  }
  
  isOffScreen() {
    return this.y < 0;
  }
  
  checkColision() {
    for (let i = bloques.length - 1; i >= 0; i--) {
      let bloque = bloques[i];
      if (this.x > bloque.cuerpo.position.x - bloque.ancho/2 &&
          this.x < bloque.cuerpo.position.x + bloque.ancho/2 &&
          this.y > bloque.cuerpo.position.y - bloque.alto/2 &&
          this.y < bloque.cuerpo.position.y + bloque.alto/2) {
        bloque.resistencia--;
        if (bloque.resistencia <= 0) {
          Matter.World.remove(mundo, bloque.cuerpo);
          bloques.splice(i, 1);
          puntuacion += 10 * nivel;
          sonidoPunto.play();
          
          crearExplosion(bloque.cuerpo.position.x, bloque.cuerpo.position.y);
          
          if (bloque.tienePowerUp) {
            crearPowerUp(bloque.cuerpo.position.x, bloque.cuerpo.position.y);
          }
        } else {
          bloque.color = color(255 - bloque.resistencia * 40, bloque.resistencia * 40, 100);
        }
        return true;
      }
    }
    return false;
  }
}

function crearExplosion(x, y) {
  for (let i = 0; i < 20; i++) {
    particulas.push(new Particula(x, y));
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

function keyPressed() {
  if (keyCode === ENTER) {
    if (estadoJuego === 'MENU' || estadoJuego === 'LORE') {
      estadoJuego = 'JUGAR';
      reiniciarJuego();
    } else if (estadoJuego === 'FIN' || estadoJuego === 'GANAR') {
      estadoJuego = 'MENU';
    }
  } else if (key === 'L' && estadoJuego === 'MENU') {
    estadoJuego = 'LORE';
  }
}

function reiniciarJuego() {
  puntuacion = 0;
  vidas = 3;
  nivel = 1;
  Matter.World.clear(mundo);
  pelotas = [];
  crearPelota();
  crearPaleta();
  crearBloques();
  crearParedes();
  powerUps = [];
  lasers = [];
  laserActivo = false;
}