let cuadrados = [];
let rectangulos = [];
let imgs = [];
let numImgs = 8;
let nivel;
let mic;
let colores = ["#1477bb", "#ed920d", "#6591f2", "#c82812", "#164403", "#fd5904", "#fbdf02", "#2abc97", "#764575", "#23794c", "#ab2f65", "#0f6967"]; // crea un array con los colores
let fondos = []; 
let numFondos = 3; 
let indice = 0; 

function preload() {
  for (let i = 0; i < numImgs; i++) {
    let img = loadImage("textura_" + nf(i, 4) + ".png");
    imgs.push(img);
  }
  for (let i = 0; i < numFondos; i++) {
    let fondo = loadImage("fondo_000" + i + ".png");
    fondos.push(fondo); // agrega la imagen al array de fondos
  }
}

function crearForma(x, y, w, h, c, t) {
  let colorImagen = random(colores); // elige un color al azar del array
  return {  x: x,
  y: y,
  w: w,
  h: h,
  c: c,
  t: t,
  colorImagen: colorImagen
  };
}
function dibujarForma(f) {
  fill(f.c);
  noStroke();
  //rect(f.x, f.y, f.w, f.h); // dibuja la forma
  tint(f.colorImagen); // aplica el color a la imagen
  image(f.t, f.x, f.y, f.w, f.h); // dibuja la imagen sobre la forma
}
function cambiarColor(f) {
  let c = color(floor(random(255)), floor(random(255)), floor(random(255))); 
  f.c = c;
}

function cambiarTamano(f) {
  f.w += random(-10, 10);
  f.h += random(-10, 10);
}

function cambiarTextura(f) {
  let t = imgs[floor(random(numImgs))]; // elige una textura al azar del array de imágenes
  f.t = t;
}

function crearFormas() {
  cuadrados = [];
  rectangulos = [];

  // Establecer tamaño máximo de las formas
  const maxSize = min(width * height / 35, 400);

  for (let i = 0; i < 20; i++) {
    let x = random(width);
    let y = random(height);
    let s = random(maxSize);
    let c = color(floor(random(255)), floor(random(255)), floor(random(255)));
    let t = imgs[floor(random(numImgs))];
    let cuadrado = crearForma(x, y, s, s, c, t);
    cuadrados.push(cuadrado);
  }

  for (let i = 0; i < 25; i++) {
    let x = random(width);
    let y = random(height);
    let w = random(maxSize);
    let h = random(maxSize);
    let c = color(floor(random(255)), floor(random(255)), floor(random(255))); 
    let t = imgs[floor(random(numImgs))];
    let rectangulo = crearForma(x, y, w, h, c, t);
    rectangulos.push(rectangulo);
  }
}

function dibujarFormas() {
  for (let r of rectangulos) {
    dibujarForma(r);
  }
  for (let c of cuadrados) {
    dibujarForma(c);
  }
}

function cambiarColorYTexturaPorSonido() {// cambia la textura de la forma elegida
  nivel = mic.getLevel();
  if (nivel > 0.1) {
    let i = floor(random(cuadrados.length + rectangulos.length));
    if (i < cuadrados.length) {
      cambiarColor(cuadrados[i]);
      cambiarTextura(cuadrados[i]);
      cambiarColorImagen(cuadrados[i]); // cambia el color de la imagen del cuadrado
    } else {
      cambiarColor(rectangulos[i - cuadrados.length]);
      cambiarTextura(rectangulos[i - cuadrados.length]); 
      cambiarColorImagen(rectangulos[i - cuadrados.length]); // cambia el color de la imagen del rectángulo
    }
    opacidad = map(nivel, 0.1, 1, 0, 255);
  }
}

function mouseWheel(event) {
  for (let i = 0; i < cuadrados.length; i++) {
    if (mouseX > cuadrados[i].x && mouseX < cuadrados[i].x + cuadrados[i].w &&
        mouseY > cuadrados[i].y && mouseY < cuadrados[i].y + cuadrados[i].h) {
      cuadrados[i].w += event.delta * 0.1;
      cuadrados[i].h += event.delta * 0.1;
    }
  }
  for (let i = 0; i < rectangulos.length; i++) {
    if (mouseX > rectangulos[i].x && mouseX < rectangulos[i].x + rectangulos[i].w &&
        mouseY > rectangulos[i].y && mouseY < rectangulos[i].y + rectangulos[i].h) {
      rectangulos[i].w += event.delta * 0.1;
      rectangulos[i].h += event.delta * 0.1;
    }
  }
}


function cambiarTamanoPorMouse() {
  if (mouseIsPressed) {
    // Recorre las formas y verificar si el mouse está sobre alguna de ellas
    for (let i = 0; i < cuadrados.length; i++) {
    if (mouseX > cuadrados[i].x && mouseX < cuadrados[i].x + cuadrados[i].w &&
    mouseY > cuadrados[i].y && mouseY < cuadrados[i].y + cuadrados[i].h) {
    // Cambiar el tamaño del cuadrado seleccionado
    cambiarTamano(cuadrados[i]);
    }
    }
    for (let i = 0; i < rectangulos.length; i++) {
    if (mouseX > rectangulos[i].x && mouseX < rectangulos[i].x + rectangulos[i].w &&
    mouseY > rectangulos[i].y && mouseY < rectangulos[i].y + rectangulos[i].h) {
    // Cambiar el tamaño del rectángulo seleccionado
    cambiarTamano(rectangulos[i]);
    }
    }
    }
    }
    
    function setup() {
    createCanvas(1100, 670);
    mic = new p5.AudioIn();
    mic.start();
    crearFormas();
    }
    
    function draw() {
       noTint(); 
    background(fondos[indice]);
    cambiarColorYTexturaPorSonido();
    cambiarTamanoPorMouse();
    dibujarFormas();
    }
    
    

function keyPressed() {
  if (key == " ") {
  crearFormas();
  }
  if (key == "f") { 
    let fs = fullscreen(); // obtiene el estado actual de pantalla completa
    fullscreen(!fs); // cambia al opuesto
  }
  if (keyCode == ENTER) { 
    saveCanvas("captura.png"); 
  }
  if (keyCode == CONTROL) {
    indice++;
    if (indice == numFondos) { 
      indice = 0;
    }
   }
  }

  function cambiarColorImagen(f) {
    let colorImagen = random(colores); // elige un color al azar del array
    f.colorImagen = colorImagen;
  }
