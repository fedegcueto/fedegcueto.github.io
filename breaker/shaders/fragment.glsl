precision mediump float;

uniform vec2 uResolution;
uniform float uTime;

varying vec2 vTexCoord;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  
  float color = 0.0;
  color += sin(uv.x * 10.0 + uTime) * 0.5;
  color += cos(uv.y * 10.0 + uTime) * 0.5;
  
  gl_FragColor = vec4(color, color * 0.5, color * 0.25, 1.0);
}