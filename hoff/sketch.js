let cuadrados = [];
let rectangulos = [];
let imgs = [];
let numImgs = 16;
let nivel;
let mic;
let colores = ["#F2E9D7", "#F2C8A4", "#E6A57E", "#D97B5C", "#C95F4A", "#B84A3E", "#A63B37", "#8F2F2E", "#752525", "#5C1D1D", "#441717", "#2E1111",
"#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FF6600", "#6600FF", "#0066FF", "#66FF00", "#00FF66", "#FF0066",
"#1477bb", "#ed920d", "#6591f2", "#c82812", "#164403", "#fd5904", "#fbdf02", "#2abc97", "#764575", "#23794c", "#ab2f65", "#0f6967"];
let fondos = []; 
let numFondos = 5; 
let indice = 0; 
let formaSeleccionada = null; 

// Añado una variable para contar las formas generadas
let contadorFormas = 0;

function preload() {
  for (let i = 0; i < numImgs; i++) {
    let img = loadImage("textura_" + nf(i, 4) + ".png");
    imgs.push(img);
  }
  for (let i = 0; i < numFondos; i++) {
    let fondo = loadImage("fondo_000" + i + ".jpg");
    fondos.push(fondo); 
  }
}
function seIntersectan(f1, f2) {

  let x1 = f1.x;
  let y1 = f1.y;
  let x2 = f1.x + f1.w;
  let y2 = f1.y + f1.h;
  let x3 = f2.x;
  let y3 = f2.y;
  let x4 = f2.x + f2.w;
  let y4 = f2.y + f2.h;
  let separacionHorizontal = (x1 >= x4) || (x3 >= x2);
  let separacionVertical = (y1 >= y4) || (y3 >= y2);

  if (!separacionHorizontal && !separacionVertical) {
    return true;
  } else {
    return false;
  }
}

function crearForma(x, y, w, h, c, t) {
  let colorImagen = random(colores);   return {  
x: x,
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
noTint();
tint(f.colorImagen); 
image(f.t, f.x, f.y, f.w, f.h); 
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
let t = imgs[floor(random(numImgs))];  
f.t = t;
}
function seIntersectaConAlguna(formas, formaNueva) {
for (let f of formas) {
if (seIntersectan(f, formaNueva)) {
return true;
}
}
return false;
}

// Modifico la función crearFormas para que reciba un parámetro con la cantidad de formas a crear
function crearFormas(cantidad) {

// Borro las formas anteriores
cuadrados = [];
rectangulos = [];

const maxSize = min(width * height / 10, 200);

const minSize = 350;

// Uso el parámetro cantidad para limitar el número de iteraciones del bucle
for (let i = 0; i < cantidad; i++) {
let x = random(width);
let y = random(height);
let s = constrain(random(maxSize), minSize, maxSize);
let c = color(floor(random(255)), floor(random(255)), floor(random(255)));
let t = imgs[floor(random(numImgs))];
let cuadrado = crearForma(x, y, s, s, c, t);

if (!seIntersectaConAlguna(cuadrados, cuadrado)) {
cuadrados.push(cuadrado);
}
}
// Uso el parámetro cantidad para limitar el número de iteraciones del bucle
for (let i = 0; i < cantidad; i++) {
let x = random(width);
let y = random(height);
let w = random(minSize, maxSize);
let h = random(minSize, maxSize);
let c = color(floor(random(255)), floor(random(255)), floor(random(255))); 
let t = imgs[floor(random(numImgs))];
let rectangulo = crearForma(x, y, w, h, c, t);
if (!seIntersectaConAlguna(cuadrados.concat(rectangulos), rectangulo)) {
rectangulos.push(rectangulo);
}
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

// Modifico la función cambiarColorYTexturaPorSonido para que la voz controle la cantidad de formas que se generen
function cambiarColorYTexturaPorSonido() {  
nivel = mic.getLevel();
// Si el nivel de sonido es mayor que 0.1 y el contador de formas es menor que 15
if (nivel > 0.1 && contadorFormas < 15) {
// Llamo a la función crearFormas con el parámetro contadorFormas + 1
crearFormas(contadorFormas + 1);
// Incremento el contador de formas en uno
contadorFormas++;
// Cambio el color y la textura de todas las formas
for (let f of cuadrados.concat(rectangulos)) {
cambiarColor(f);
cambiarTextura(f);
cambiarColorImagen(f);    
}
opacidad = map(nivel, 0.1, 1, 0, 255);
}

// Si el nivel de sonido es mayor que 0.5 y el contador de formas es mayor o igual que 15
if (nivel > 0.5 && contadorFormas >= 15) {
// Elijo una forma al azar entre todas las formas
let i = floor(random(cuadrados.length + rectangulos.length));
if (i < cuadrados.length) {
// Cambio el color y la textura de la forma elegida
cambiarColor(cuadrados[i]);
cambiarTextura(cuadrados[i]);
cambiarColorImagen(cuadrados[i]);    
} else {
// Cambio el color y la textura de la forma elegida
cambiarColor(rectangulos[i - cuadrados.length]);
cambiarTextura(rectangulos[i - cuadrados.length]); 
cambiarColorImagen(rectangulos[i - cuadrados.length]); 
}
opacidad = map(nivel, 0.5, 1, 0, 255);
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
function mousePressed() {
for (let f of cuadrados.concat(rectangulos)) {
if (mouseX > f.x && mouseX < f.x + f.w && mouseY > f.y && mouseY < f.y + f.h) {
formaSeleccionada = f;
}
}
}

 
function cambiarTamanoPorMouse() {
if (mouseIsPressed) {
for (let i = 0; i < cuadrados.length; i++) {
if (mouseX > cuadrados[i].x && mouseX < cuadrados[i].x + cuadrados[i].w &&
mouseY > cuadrados[i].y && mouseY < cuadrados[i].y + cuadrados[i].h) {
  cambiarTamano(cuadrados[i]);
  }
  }
  for (let i = 0; i < rectangulos.length; i++) {
  if (mouseX > rectangulos[i].x && mouseX < rectangulos[i].x + rectangulos[i].w &&
  mouseY > rectangulos[i].y && mouseY < rectangulos[i].y + rectangulos[i].h) {
  cambiarTamano(rectangulos[i]);
  }
  }
  }
  }
  function escribirTexto() {
  fill(0); 
  textSize(20); 
  textAlign(LEFT); 
  text("Esta obra está inspirada en las pinturas abstractas de Hans Hofmann.", width + 50, 50); 
  text("Puedes interactuar con ella usando los siguientes botones:", width + 50, 100); 
  text("enter: guardar la obra", width + 50, 160); 
  text("Control: cambiar el fondo", width + 50, 190); 
  text("Barra espaciadora: cambiar las formas de posición", width + 50, 220); 
  text("Click + flecha: mover la forma seleccionada", width + 50, 250); 
  text("Rueda del mouse: agrandar o achicar la forma seleccionada", width + 50, 280);
  text("Hablar: generar más formas hasta un máximo de 15", width + 50, 310); // Añado esta línea para explicar la nueva funcionalidad
  }
      
  function setup() {
  createCanvas(1100, 670);
  mic = new p5.AudioIn();
  mic.start();   userStartAudio();

  crearFormas(0); // Llamo a la función crearFormas con el parámetro 0 para que no se generen formas al inicio
  }
      
  function draw() {
  noTint(); 
  background(fondos[indice]);
  cambiarColorYTexturaPorSonido();
  cambiarTamanoPorMouse();
  dibujarFormas();
  escribirTexto();
  }
      
      
  
  function keyPressed() {
  if (formaSeleccionada != null) {
  if (keyCode == UP_ARROW) {
  formaSeleccionada.y -= 10; 
  } else if (keyCode == DOWN_ARROW) {
  formaSeleccionada.y += 10;    
  } else if (keyCode == LEFT_ARROW) {
  formaSeleccionada.x -= 10;    
  } else if (keyCode == RIGHT_ARROW) {
  formaSeleccionada.x += 10;     
  }
  }
  if (key == " ") {
  crearFormas(0); // Llamo a la función crearFormas con el parámetro 0 para que no se generen formas al presionar la barra espaciadora
  }
  if (key == "f") { 
  let fs = fullscreen();     
  fullscreen(!fs); 
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
  
 
