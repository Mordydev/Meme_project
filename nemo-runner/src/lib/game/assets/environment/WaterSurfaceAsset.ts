import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { ShaderManager } from '../../services/ShaderManager';
import { WaterSurfaceVisualConfig } from '../../config/gameConfig';

export class WaterSurfaceAsset {
  public mesh!: THREE.Mesh;
  private config: Readonly<WaterSurfaceVisualConfig>;
  private material!: THREE.MeshPhysicalMaterial; // Using MeshPhysicalMaterial

  // To store the shader object from onBeforeCompile for later uTime updates
  private compiledShader: any | null = null; // Changed THREE.Shader to any

  constructor(shaderManager: ShaderManager) { // shaderManager might be used for global uniforms if needed
    this.config = configSystem.get('visuals').waterSurface;
    if (!this.config.enabled) {
        // If not enabled, don't create the mesh. 
        // EnvironmentManager should also check this.
        return;
    }
    this._createMesh(shaderManager);
  }

  private _createMesh(shaderManager: ShaderManager): void {
    const surfaceSize = 200; // Large enough to cover view from below
    const geometry = new THREE.PlaneGeometry(surfaceSize, surfaceSize, 32, 32); // Segments for potential vertex displacement

    this.material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(this.config.baseColor || 0x87CEFA),
        metalness: 0.1, 
        roughness: 0.05, 
        transmission: 0.9, 
        transparent: true,
        opacity: this.config.opacity !== undefined ? this.config.opacity : 0.7,
        side: THREE.BackSide, // Rendered from below
        ior: 1.33, // Index of refraction for water
        // Consider adding envMap from scene for better reflections if available
        // envMap: scene.environment, 
        // envMapIntensity: 0.8,
    });

    if (this.config.rippleIntensity > 0) {
        this.material.onBeforeCompile = (shader) => {
            this.compiledShader = shader; // Store the shader object

            shader.uniforms.uTime = { value: 0 };
            shader.uniforms.uRippleSpeed = { value: this.config.rippleSpeed };
            shader.uniforms.uRippleScale = { value: this.config.rippleScale };
            shader.uniforms.uRippleIntensity = { value: this.config.rippleIntensity };
            shader.uniforms.uRippleColor = { value: new THREE.Color(this.config.rippleColor) };

            shader.vertexShader = `
                varying vec3 vWorldPosition_WaterSurface;
                // Uniforms already declared in fragment, but might be needed if vertex displacement is used
                // uniform float uTime; 
                // uniform float uRippleSpeed;
                // uniform float uRippleScale;
                // uniform float uRippleIntensity;
            ` + shader.vertexShader;

            shader.vertexShader = shader.vertexShader.replace(
                `#include <begin_vertex>`,
                `#include <begin_vertex>
                 vWorldPosition_WaterSurface = (modelMatrix * vec4(position, 1.0)).xyz;
                 // Optional: Animate vertices for physical ripples (more complex)
                 // float heightOffset = sin(position.x * uRippleScale + uTime * uRippleSpeed) * uRippleIntensity * 0.1;
                 // transformed.y += heightOffset; // Assuming surface is XZ plane, Y is up
                `
            );

            shader.fragmentShader = `
                varying vec3 vWorldPosition_WaterSurface;
                uniform float uTime;
                uniform float uRippleSpeed;
                uniform float uRippleScale;
                uniform float uRippleIntensity;
                uniform vec3 uRippleColor;

                // Basic noise function (can be replaced with something more sophisticated from ShaderManager if available)
                float random2D_Water(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }

                float noise2D_Water(vec2 st) {
                    vec2 i = floor(st);
                    vec2 f = fract(st);
                    float a = random2D_Water(i);
                    float b = random2D_Water(i + vec2(1.0, 0.0));
                    float c = random2D_Water(i + vec2(0.0, 1.0));
                    float d = random2D_Water(i + vec2(1.0, 1.0));
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
                }

                vec3 gerstnerWaveNormal(vec2 coord, float time, float steepness, float waveLength, vec2 direction) {
                    float k = 2.0 * PI / waveLength;
                    float c = sqrt(9.8 / k); // Wave speed
                    vec2 d = normalize(direction);
                    float f = k * (dot(d, coord) - c * time);
                    float a = steepness / k;

                    float dx = -d.x * a * k * cos(f);
                    float dy = -d.y * a * k * cos(f);
                    //float y = a * sin(f); // If displacing position

                    return normalize(vec3(-dx, 1.0, -dy)); // Normal points mostly up
                }
            ` + shader.fragmentShader;

            // Modify normal calculation
            // This will replace the standard normal calculation with our procedural ripples
            shader.fragmentShader = shader.fragmentShader.replace(
                `#include <normal_fragment_begin>`,
                // Note: Ensure this replacement target is exactly what's in MeshPhysicalMaterial's shader
                // It might be #include <normal_fragment_maps> or similar if a normalMap is used.
                // For procedural normals without a map, <normal_fragment_begin> is a common hook.
                `
                #include <normal_fragment_begin>

                vec2 uvForRipple = vWorldPosition_WaterSurface.xz * (1.0 / uRippleScale); // Scale UVs for ripple effect
                
                // Simplified ripple normal modification using noise
                // float n = noise2D_Water(uvForRipple + uTime * uRippleSpeed * 0.1); // Time added to UV for movement
                // vec3 rippleNormalOffset = vec3(
                //     (noise2D_Water(uvForRipple + vec2(0.01,0.0) + uTime * uRippleSpeed * 0.1) - n) * uRippleIntensity * 50.0, // dN/dx
                //     (noise2D_Water(uvForRipple + vec2(0.0,0.01) + uTime * uRippleSpeed * 0.1) - n) * uRippleIntensity * 50.0, // dN/dz
                //     0.0
                // );
                // normal = normalize(normal - rippleNormalOffset.xzy); // Perturb existing normal, .xzy to map to world up

                // Gerstner-like wave normals for more defined look
                vec3 n1 = gerstnerWaveNormal(uvForRipple, uTime, 0.3 * uRippleIntensity, 1.0, vec2(1.0, 0.5));
                vec3 n2 = gerstnerWaveNormal(uvForRipple * 1.5 + 0.5, uTime * 0.8, 0.2 * uRippleIntensity, 0.7, vec2(0.5, 1.0));
                vec3 n3 = gerstnerWaveNormal(uvForRipple * 0.8 - 0.3, uTime * 1.2, 0.15 * uRippleIntensity, 1.3, vec2(1.0, -0.7));
                normal = normalize(n1 + n2 + n3 - 2.0 * vec3(0.0,1.0,0.0)); // Blend waves, ensure it's mostly Y-up bias
                // Make sure normal is in view space as expected by MeshPhysicalMaterial shader context
                normal = normalize( normalMatrix * normal );


                // The following might be needed if the above normal manipulation doesn't fit perfectly
                // into the standard shader flow. For MeshPhysicalMaterial, 'normal' is in view space here.
                // So, calculate worldNormal, perturb it, then transform back to view space.
                // vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
                // worldNormal = normalize(worldNormal + rippleNormalOffset.xzy);
                // normal = normalize( transformDirection( worldNormal, viewMatrix ) );
                `
            );
            
            // Add ripple highlights to emissive or diffuse based on view angle and normal
            shader.fragmentShader = shader.fragmentShader.replace(
                /vec4 diffuseColor = vec4\( diffuse, opacity \);/,
                `vec4 diffuseColor = vec4(diffuse, opacity);
                 vec3 viewDir = normalize(vViewPosition); // vViewPosition should be available
                 float fresnel = pow(1.0 - clamp(dot(normal, -viewDir), 0.0, 1.0), ${(this.config.fresnelPower || 2.0).toFixed(1)});
                 
                 // Add highlights based on perturbed normal and light direction
                 // This is a simplified highlight, real reflections would use envMap
                 vec3 reflectedLight =主要光源方向; // Placeholder, needs actual light dir
                 // float highlightFactor = pow(max(0.0, dot(normal, normalize(reflectedLight - viewDir))), ${(this.config.shininess || 80.0).toFixed(1)});
                 // diffuseColor.rgb += uRippleColor * highlightFactor * uRippleIntensity * 0.5;

                 diffuseColor.rgb += uRippleColor * fresnel * uRippleIntensity * 5.0; // Add fresnel-based shimmer
                `
            );
            // console.log("WaterSurface Shaders: ", shader.vertexShader, shader.fragmentShader);
        };
    }

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.name = "WaterSurface";
    // Position it high above. EnvironmentManager will place it.
    this.mesh.rotation.x = Math.PI / 2; // Plane is XY by default, rotate to be XZ (facing down)
    // Render order can be important for transparency
    this.mesh.renderOrder = 10; 
  }

  public update(deltaTime: number, elapsedTime: number): void {
    if (this.compiledShader && this.compiledShader.uniforms.uTime) {
        this.compiledShader.uniforms.uTime.value = elapsedTime;
    }
    // Could also animate normal map offsets here if using a texture-based normal map
    // if (this.material.normalMap) {
    //   this.material.normalMap.offset.x += this.config.rippleSpeed * deltaTime * 0.1;
    //   this.material.normalMap.offset.y += this.config.rippleSpeed * deltaTime * 0.05;
    // }
  }

  public getMesh(): THREE.Mesh | null {
    return this.config.enabled ? this.mesh : null;
  }

  public dispose(): void {
    this.mesh?.geometry?.dispose();
    if (this.material) {
        // Dispose any textures if they were loaded (e.g. normalMap from config)
        // this.material.map?.dispose();
        this.material.dispose();
    }
    this.compiledShader = null;
  }
} 