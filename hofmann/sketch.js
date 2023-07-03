let figuras = [];
let imgs = [];
let fondos = [];
let indiceFondo = 0;
let maxFiguras = 30;
let mic;
let vol;
let estado = 1; // variable para controlar el estado del programa
let intervaloEstado; // variable para controlar el intervalo del estado
let threshold = 0.1; // umbral para detectar sonido
let grav = false; // variable para controlar el efecto de gravedad
let fft; // variable para almacenar el objeto p5.FFT

function preload() {
  for (let i = 1; i <= 15; i++) {
    imgs.push(loadImage(`textura_000${i}.png`));
  }
  for (let i = 1; i <= 9; i++) {
    fondos.push(loadImage(`fondo_000${i}.jpg`));
  }
}
function setup() {
  createCanvas(1000, 650);
  mic = new p5.AudioIn();
  mic.start();
  userStartAudio();
  fft = new p5.FFT(); // crear el objeto p5.FFT
  fft.setInput(mic); // asignar el micrófono como entrada
  intervaloEstado = setInterval(cambiarEstado, 15000); // asignar el intervalo a la variable, pasando la función cambiarEstado y el tiempo en milisegundos
}

function draw() {
  switch (estado) { // usar switch para ejecutar diferentes acciones según el estado
    case 1: // estado de instrucciones
      mostrarInstrucciones();
      mostrarVolumen();
      break;
    case 2: // estado de cambiar fondo
    generarFondo();
    generarFiguras();
    cambiarFondoPorSonido();
      break;
    case 3: // estado de generar figura
      generarFondo();
      generarFiguras();
      crearFiguraPorSonido(); // función para generar figuras con el micrófono
      break;
    case 4: // estado de cambiar textura/color
      generarFondo();
      generarFiguras();
      cambiarTexturaColorPorSonido(); // función para cambiar textura/color con el micrófono
      break;
    case 5: // estado de caer y subir
      generarFondo();
      generarFiguras();
      aplicarGravedad(); //no funciona correctamente
      break;
  }
}

function mostrarInstrucciones() {
  background(0);
  fill(255);
  textSize(20);
  text("Este es un programa te permite crear obras inspiradas en Hans Hofmann.", 100, 100); 
  text("Hay diferentes estados para generar la obra utilizando el microfono.", 100, 130);
  text("Los estados se cambian automaticamente cada 15 segundos.", 100, 160);
    text("Diviértete!", 100, 190);
}

function cambiarEstado() {
estado++; // incrementar el estado en uno
if (estado > 5) { // verificar si el estado supera el máximo
estado = 1; // volver al primer estado
}
clearInterval(intervaloEstado); // limpiar el intervalo cuando se cambia el estado
intervaloEstado = setInterval(cambiarEstado, 15000); // reasignar el intervalo con el mismo tiempo
}

function cambiarFondo() {
if (estado === 2 || estado === 3 || estado === 4 || estado === 5) { // verificar que el estado sea válido
indiceFondo++;
if (indiceFondo >= fondos.length) {
indiceFondo = 0;
}
}
}
function cambiarFondoPorSonido() {
  vol = mic.getLevel(); // obtener el nivel del micrófono
  if (vol > threshold) { // verificar si supera el umbral
    cambiarFondo();
  }
}
function generarFigura() {
if (estado === 2 || estado === 3 || estado === 4 || estado === 5) { // verificar que el estado sea válido
if (figuras.length < maxFiguras) {
let forma = crearFormaAleatoria();
figuras.push(forma);
} else {
figuras.shift();
let forma = crearFormaAleatoria();
figuras.push(forma);
}
}
}

function caerYSubir() { // función para activar el efecto de gravedad
if (estado === 2 || estado === 3 || estado === 4 || estado === 5) { // verificar que el estado sea válido
grav = true; // cambiar el valor de la variable de gravedad a true
}
}
function cambiarColor(forma) {
let r = random(255);
let g = random(255);
let b = random(255);
forma.color = color(r, g, b);
}
function cambiarTextura(forma) {
let index = floor(random(imgs.length));
forma.textura = imgs[index];
}
function dibujarForma(forma) {
push();
translate(forma.x, forma.y);
tint(forma.color);
image(forma.textura, -forma.tam / 2, -forma.tam / 2, forma.tam, forma.tam);
pop();
}
function crearFormaAleatoria() {
let tipo = random(["cuadrado", "rectangulo"]);
let tam = random(120, 250);
let x = random(width);
let y = random(height);
let forma = {
tipo: tipo,
tam: tam,
x: x,
y: y,
color: color(255),
textura: random(imgs),
vel: 0 // agregar una propiedad de velocidad a cada forma
};
return forma;
}
function cambiarTexturaColorPorSonido() {  
vol = mic.getLevel(); // obtener el nivel de sonido del micrófono
if (vol > threshold) { // verificar si supera el umbral
for (let i = 0; i < figuras.length; i++) { // recorrer el arreglo de figuras
let forma = figuras[i];
cambiarColor(forma); // cambiar el color de cada figura
cambiarTextura(forma); // cambiar la textura de cada figura
}
}
}
function generarFondo() {
image(fondos[indiceFondo], 0, 0, width, height);
}

function generarFiguras() {
for (let i = 0; i < figuras.length; i++) {
let forma = figuras[i];
dibujarForma(forma);
}
}
function mostrarVolumen() {
vol = mic.getLevel();
let diametro = map(vol, 0, 1, 10, 200);
let colorVal = map(vol, 0, 1, 0, 255);
push();
translate(width / 2, height / 2);
noFill();
stroke(255, colorVal, colorVal);
strokeWeight(2);
ellipse(0, 0, diametro, diametro);
pop();
}

function crearFiguraPorSonido() {
vol = mic.getLevel(); // obtener el nivel del micrófono
if (vol > threshold) { // verificar si supera el umbral
generarFigura(); // generar una nueva figura aleatoria
}
}
function aplicarGravedad() { // función para aplicar el efecto de gravedad a las figuras
  if (grav) { // verificar si la variable de gravedad es true
  vol = mic.getLevel(); // obtener el nivel de sonido del micrófono
  let t = deltaTime / 1000; // obtener el tiempo transcurrido entre cada cuadro en segundos
  let pitch = fft.getCentroid(); // obtener el pitch del sonido usando el objeto fft
  for (let i = 0; i < figuras.length; i++) { // recorrer el arreglo de figuras
  let forma = figuras[i];
  if (pitch > 300) { // verificar si el pitch es mayor que un cierto valor
  forma.vel = forma.vel - vol * 50 * t; // restar a la velocidad el nivel de sonido multiplicado por un factor y el tiempo
  } else { // si el pitch es menor que el valor
  forma.vel = forma.vel + vol * 50 * t; // sumar a la velocidad el nivel de sonido multiplicado por un factor y el tiempo
  }
  forma.y = forma.y + forma.vel * t; // actualizar la posición vertical de cada figura según la velocidad y el tiempo
  if (forma.y + forma.tam / 2 > height) { // verificar si la figura llega al borde inferior del lienzo
  forma.y = height - forma.tam / 2; // ajustar la posición para que no se salga del lienzo
  forma.vel = -forma.vel * 0.8; // hacer que rebote con una pérdida de energía
  }
  if (forma.y - forma.tam / 2 < 0) { // verificar si la figura llega al borde superior del lienzo
  forma.y = forma.tam / 2; // ajustar la posición para que no se salga del lienzo
  forma.vel = - forma.vel * 0.8; // hacer que rebote con una pérdida de energía
}
}
}
}
