import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { ShaderManager } from '../../services/ShaderManager';
import { LightingManager } from '../../services/LightingManager';
import { WaterSurfaceVisualConfig } from '../../config/gameConfig';

export class WaterSurfaceAsset {
  public mesh!: THREE.Mesh;
  private config: Readonly<WaterSurfaceVisualConfig>;
  private material!: THREE.MeshPhysicalMaterial;
  private lightingManager: LightingManager | null = null;
  private directionalLight: THREE.DirectionalLight | null = null;
  private _tmpLightDir: THREE.Vector3 = new THREE.Vector3();

  constructor(_shaderManager: ShaderManager) {
    this.config = configSystem.get('visuals').waterSurface;
    this.createMesh();
  }

  /**
   * Links the LightingManager to allow lighting-reactive highlights
   */
  public linkLightingManager(lightingManager: LightingManager): void {
    this.lightingManager = lightingManager;
    this.directionalLight = lightingManager.getDirectionalLight();
  }

  private createMesh(): void {
    const surfaceSize = 200;
    const geometry = new THREE.PlaneGeometry(surfaceSize, surfaceSize, 1, 1);

    this.material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(this.config.baseColor),
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.9,
      transparent: true,
      opacity: this.config.opacity,
      side: THREE.BackSide,
      envMapIntensity: 0.7,
      ior: 1.33,
    });

    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uRippleSpeed = { value: this.config.rippleSpeed };
      shader.uniforms.uRippleScale = { value: this.config.rippleScale };
      shader.uniforms.uRippleIntensity = { value: this.config.rippleIntensity };
      shader.uniforms.uFresnelPower = {
        value: this.config.fresnelPower ?? 2.0
      };
      shader.uniforms.uSpecularColor = {
        value: new THREE.Color(this.config.specularColor)
      };
      shader.uniforms.uLightDirection = { value: new THREE.Vector3(0, -1, 0) };
      shader.uniforms.uLightIntensity = { value: 1.0 };

      // Make sure vUv is available - add it to the vertex shader
      shader.vertexShader = 
        `varying vec2 vUv;\n` +
        shader.vertexShader.replace(
          '#include <uv_vertex>',
          '#include <uv_vertex>\nvUv = uv;'
        );

      shader.fragmentShader =
        `uniform float uTime;\n` +
        `uniform float uRippleSpeed;\n` +
        `uniform float uRippleScale;\n` +
        `uniform float uRippleIntensity;\n` +
        `uniform float uFresnelPower;\n` +
        `uniform vec3 uSpecularColor;\n` +
        `uniform vec3 uLightDirection;\n` +
        `uniform float uLightIntensity;\n` +
        `varying vec2 vUv;\n` +
        shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>\n  float ripple = sin((vUv.x + uTime * uRippleSpeed) * uRippleScale) *\n                      sin((vUv.y + uTime * uRippleSpeed) * uRippleScale);\n  vec3 lightDir = normalize(uLightDirection);\n  float lightFactor = max(dot(normalize(vNormal), lightDir), 0.0) * uLightIntensity;\n  float fresnel = pow(1.0 - dot(normalize(vNormal), normalize(vViewPosition)), uFresnelPower);\n  vec3 fresnelSpec = uSpecularColor * fresnel * lightFactor;\n  diffuseColor.rgb += ripple * uRippleIntensity * lightFactor + fresnelSpec;`
      );

      (this.material as any).userData.shader = shader;
    };

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.name = 'WaterSurface';
  }

  public update(_delta: number, elapsed: number): void {
    const shader = (this.material as any).userData?.shader;
    if (!shader) return;

    if (shader.uniforms.uTime) {
      shader.uniforms.uTime.value = elapsed;
    }

    if (this.directionalLight) {
      this.directionalLight.getWorldDirection(this._tmpLightDir);
      shader.uniforms.uLightDirection.value.copy(this._tmpLightDir);
      shader.uniforms.uLightIntensity.value = this.directionalLight.intensity;
    }
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    this.material.map?.dispose();
    this.material.normalMap?.dispose();
    this.material.dispose();
  }
}