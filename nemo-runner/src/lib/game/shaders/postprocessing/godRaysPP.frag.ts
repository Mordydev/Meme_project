export const godRaysFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform vec2 lightPosition;
  uniform vec3 godRayColor;
  uniform float density;
  uniform float weight;
  uniform float decay;
  uniform float exposure;
  uniform int samples;

  varying vec2 vUv;

  const int MAX_SAMPLES = 100;

  void main() {
    vec4 color = vec4(0.0);
    vec2 delta = (vUv - lightPosition) * density / float(samples);
    vec2 coord = vUv;
    float illuminationDecay = 1.0;

    for(int i = 0; i < MAX_SAMPLES; i++) {
      if(i == samples) break;
      coord -= delta;
      vec4 sampleColor = texture2D(tDiffuse, coord);
      sampleColor *= illuminationDecay * weight;
      color += sampleColor;
      illuminationDecay *= decay;
    }

    color *= exposure;
    color.rgb *= godRayColor;
    color += texture2D(tDiffuse, vUv);
    gl_FragColor = color;
  }
`; 