// src/lib/game/shaders/common/utils.glsl.ts

export const PI = `const float PI = 3.14159265359;`;

export const saturate = `
float saturate(float val) {
    return clamp(val, 0.0, 1.0);
}
vec3 saturate(vec3 val) {
    return clamp(val, 0.0, 1.0);
}
`;

const UtilsGLSL = {
  PI,
  saturate,
};
export default UtilsGLSL;