let figuras = [];
let imgs = [];
let fondos = [];
let indiceFondo = 0;
let maxFiguras = 10; // cambiar el valor a 10
let mic;
let vol;
let estado = 1; 
let intervaloEstado; 
let threshold = 0.1; 
let grav = false; 
let fft;
let paleta = ["#F2E9D7", "#F2C8A4", "#E6A57E", "#D97B5C", "#C95F4A", "#B84A3E", "#A63B37", "#8F2F2E", "#752525", "#5C1D1D", "#441717", "#2E1111", "#ed920d", "#6591f2", "#c82812", "#164403", "#fd5904", "#fbdf02"];
function preload() {
  for (let i = 1; i <= 15; i++) {
    imgs.push(loadImage("textura_" + nf(i, 4) + ".png"));
  }
  for (let i = 1; i <= 9; i++) {
    fondos.push(loadImage("fondo_" + nf(i, 4) + ".jpg"));
  }
}
function setup() {
  createCanvas(1000, 650);
  mic = new p5.AudioIn();
  mic.start();
  userStartAudio();
  fft = new p5.FFT();
  fft.setInput(mic); 
  intervaloEstado = setInterval(cambiarEstado, 15000); 
}
function draw() {
  switch (estado) { 
    case 1: 
      mostrarInstrucciones();
      mostrarVolumen();
      break;
    case 2: 
    generarFondo();
    generarFiguras();
    cambiarFondoPorSonido();
      break;
    case 3: 
      generarFondo();
      generarFiguras();
      crearFiguraPorSonido();
      break;
    case 4: 
      generarFondo();
      generarFiguras();
      cambiarTexturaColorPorSonido(); 
      break;
    case 5: 
      generarFondo();
      generarFiguras();
      saveCanvas("captura.png");
      break;
  }
}
function mostrarInstrucciones() {
  background(0);
  fill(255);
  textSize(20);
  text("Este es un programa te permite crear y modificar obras de Hans Hofmanne.", 100, 100);
  text("Hay cuatro botones diferentes que puedes explorar con el mouse.", 100, 130);
  text("Al pasar al siguiente estado utiliza el microfono para modificar la obra.", 100, 160);
    text("Diviértete!", 100, 190);
}

function cambiarEstado() {
estado++; 
if (estado > 5) { 
estado = 1; 
}
clearInterval(intervaloEstado); 
intervaloEstado = setInterval(cambiarEstado, 15000);
}
function cambiarFondo() {
if (estado === 2 || estado === 3 || estado === 4 || estado === 5) { 
indiceFondo++;
if (indiceFondo >= fondos.length) {
indiceFondo = 0;
}
}
}
function cambiarFondoPorSonido() {
vol = mic.getLevel(); 
if (vol > threshold) { 
cambiarFondo();
}
}
let contador = 0;

function generarFigura() {
if (estado === 2 || estado === 3 || estado === 4 || estado === 5) { 
if (figuras.length < maxFiguras) {
let forma = crearFormaAleatoria();
let sePuedeAgregar = true;
for (let i = 0; i < figuras.length; i++) { 
let otraForma = figuras[i];
if (seIntersectan(forma, otraForma)) { 
sePuedeAgregar = false; 
break; 
}
if (sePuedeAgregar) { 
figuras.push(forma); 
contador++;
}
} else {
figuras.shift(); 
let forma = crearFormaAleatoria(); 
let sePuedeAgregar = true; 
for (let i = 0; i < figuras.length; i++) { 
let otraForma = figuras[i];
if (seIntersectan(forma, otraForma)) {
sePuedeAgregar = false;
break;
}
}
if (contador < 3) { 
if (sePuedeAgregar) { 
figuras.push(forma);
contador++; 
}
} else {
figuras.push(forma);
contador = 0; 
}
}
}
}

function caerYSubir() { 
if (estado === 2 || estado === 3 || estado === 4 || estado === 5) { 
grav = true; 
}
}
function cambiarColor(forma) {
let index = floor(random(paleta.length));
forma.color = color(paleta[index]);
}
function cambiarTextura(forma) {
let index = floor(random(imgs.length));
forma.textura = imgs[index];
}function dibujarForma(forma) {
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
vel: 0 
};
return forma;
}
function cambiarTexturaColorPorSonido() {  
vol = mic.getLevel();
if (vol > threshold) { 
for (let i = 0; i < figuras.length; i++) { 
let forma = figuras[i];
cambiarColor(forma); 
cambiarTextura(forma);
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
}function crearFiguraPorSonido() {
vol = mic.getLevel(); 
if (vol > threshold) { 
generarFigura(); 
}
}
function seIntersectan(r1, r2) {
return !(r2.x > r1.x + r1.tam || 
r2.x + r2.tam < r1.x || 
r2.y > r1.y + r1.tam ||
r2.y + r2.tam < r1.y);
}

