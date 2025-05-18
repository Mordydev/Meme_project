import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { ShaderManager } from '../../services/ShaderManager';
import { WaterSurfaceVisualConfig } from '../../config/gameConfig';

export class WaterSurfaceAsset {
  private material!: THREE.MeshPhysicalMaterial;
  private mesh!: THREE.Mesh;
  private shader: THREE.Shader | null = null;
  private readonly config: Readonly<WaterSurfaceVisualConfig>;

  constructor(private shaderManager: ShaderManager) {
    this.config = configSystem.get('visuals').waterSurface;
    if (this.config.enabled) {
      this.createMesh();
    }
  }

  private createMesh(): void {
    const size = 200; // Large enough to cover the view
    const geometry = new THREE.PlaneGeometry(size, size, 32, 32);

    this.material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(this.config.baseColor),
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: this.config.opacity,
      transmission: 0.9,
      side: THREE.BackSide,
      ior: 1.33,
    });

    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uRippleSpeed = { value: this.config.rippleSpeed };
      shader.uniforms.uRippleScale = { value: this.config.rippleScale };
      shader.uniforms.uRippleIntensity = { value: this.config.rippleIntensity };
      shader.uniforms.uRippleColor = { value: new THREE.Color(this.config.rippleColor) };

      shader.vertexShader = `
        varying vec3 vWorldPosition_Water;
      ` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vWorldPosition_Water = (modelMatrix * vec4(position,1.0)).xyz;`
      );

      shader.fragmentShader = `
        varying vec3 vWorldPosition_Water;
        uniform float uTime;
        uniform float uRippleSpeed;
        uniform float uRippleScale;
        uniform float uRippleIntensity;
        uniform vec3 uRippleColor;

        float ripple(vec2 p) {
          return sin((p.x + p.y) * uRippleScale + uTime * uRippleSpeed);
        }
      ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_begin>',
        `#include <normal_fragment_begin>
         float r = ripple(vWorldPosition_Water.xz);
         normal = normalize(normal + vec3(dFdx(r), 0.0, dFdy(r)) * uRippleIntensity);
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        /vec4 diffuseColor = vec4\( diffuse, opacity \);/,
        `vec4 diffuseColor = vec4(diffuse, opacity);
         float h = abs(ripple(vWorldPosition_Water.xz * 1.5));
         diffuseColor.rgb += uRippleColor * pow(h, ${(this.config.fresnelPower ?? 2.0).toFixed(1)}) * uRippleIntensity;`
      );

      this.shader = shader;
    };

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.rotation.x = Math.PI / 2;
    this.mesh.name = 'WaterSurface';
    this.mesh.renderOrder = 10;
  }

  public update(delta: number, elapsedTime: number): void {
    if (this.shader) {
      this.shader.uniforms.uTime.value = elapsedTime;
    }
  }

  public getMesh(): THREE.Mesh | null {
    return this.config.enabled ? this.mesh : null;
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.shader = null;
  }
} 