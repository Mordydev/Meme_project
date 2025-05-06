import * as THREE from 'three';
import { AssetManager } from '../../core/AssetManager';
import eventBus from '../../core/EventSystem';
import { detectDeviceCapabilities, DeviceCapabilities, optimizeModelAsset, optimizeGeometry } from '../../utils/DeviceUtils';
import { WaterEffects } from './WaterEffects';
import { EnvironmentSegment } from './EnvironmentSegment';
import { 
  EnvironmentTheme, 
  EnvironmentType, 
  ENVIRONMENT_THEMES, 
  applyEnvironmentTheme,
  lerpThemes
} from './EnvironmentTypes';
import { 
  DecorationDefinition, 
  getDecorationsForEnvironment 
} from './DecorationDefinitions';
import { DecorationFactory } from './DecorationModels';
// The SimplexNoise import has changed in Three.js
// Using a direct simplex noise implementation
class NoiseGenerator {
  private readonly F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
  private readonly G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
  private p: number[] = [];

  constructor(seed = Math.random()) {
    this.p = new Array(512);
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }

    // Fisher-Yates shuffle
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }

    // Duplicate for optimization
    for (let i = 0; i < 256; i++) {
      this.p[i + 256] = this.p[i];
    }
  }

  private grad2(hash: number, x: number, y: number): number {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
  }

  noise2D(x: number, y: number): number {
    const n0 = this.hash(x, y);
    const n1 = this.hash(x + 1, y);
    const n2 = this.hash(x, y + 1);
    const n3 = this.hash(x + 1, y + 1);

    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);

    return this.lerp(
      this.lerp(n0, n1, u),
      this.lerp(n2, n3, u),
      v
    );
  }

  noise3D(x: number, y: number, z: number): number {
    // Simplified 3D noise by combining 2D noises at different offsets
    return (
      this.noise2D(x, y) * 0.5 +
      this.noise2D(y + 31.416, z) * 0.25 +
      this.noise2D(x, z + 42.624) * 0.25
    );
  }

  private hash(x: number, y: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    
    const index = (xi + this.p[yi & 255]) & 255;
    const hash = this.p[index];
    
    return this.grad2(hash, xf, yf);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }
}

/**
 * ProceduralEnvironment is responsible for generating and managing the underwater environment
 * It creates segments of terrain with decorations and handles the transitions between environment types
 */
export class ProceduralEnvironment {
  private scene: THREE.Scene;
  private segments: EnvironmentSegment[] = [];
  private segmentLength: number = 100;
  private segmentWidth: number = 40;
  private visibleSegments: number = 3;
  private maxSegments: number = 10; // Maximum number of segments to keep in memory
  private currentTheme: EnvironmentTheme;
  private previousTheme: EnvironmentTheme | null = null;
  private nextThemeChange: number = 0;
  private totalDistance: number = 0;
  private waterEffects: WaterEffects;
  private themeTransitionProgress: number = 1.0; // 1.0 means fully transitioned
  private skyboxMesh?: THREE.Mesh;
  private renderer: THREE.WebGLRenderer;
  private deviceCapabilities: DeviceCapabilities;
  private assetManager?: AssetManager;
  
  // Pebbles and shells system for ground details
  private pebblesGroup: THREE.Group = new THREE.Group();
  private pebbleInstancedMeshes: Map<string, THREE.InstancedMesh> = new Map();
  private shellInstancedMeshes: Map<string, THREE.InstancedMesh> = new Map();
  private simplex: NoiseGenerator = new NoiseGenerator(Math.random());
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private DOWN_VECTOR: THREE.Vector3 = new THREE.Vector3(0, -1, 0);
  private UP_VECTOR: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  
  // Performance optimization
  private frustum: THREE.Frustum = new THREE.Frustum();
  private cameraViewMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private tempMatrix: THREE.Matrix4 = new THREE.Matrix4();
  
  // Settings based on device capabilities
  private qualitySettings: {
    useInstancing: boolean;
    maxInstancesPerType: number;
    useLOD: boolean;
    maxPolygonsPerDecoration: number;
    cullingDistance: number;
    maxPebbles: number;
    maxShells: number;
    pebbleDensity: number;
    shellDensity: number;
  } = {
    useInstancing: true,
    maxInstancesPerType: 300,
    useLOD: true,
    maxPolygonsPerDecoration: 1000,
    cullingDistance: 200,
    maxPebbles: 800,
    maxShells: 200,
    pebbleDensity: 0.8,
    shellDensity: 0.2
  };
  
  // Cached geometries and materials for decoration types
  private decorationCache: Map<string, {
    geometry?: THREE.BufferGeometry,
    material?: THREE.Material | THREE.Material[],
    instance?: THREE.InstancedMesh
  }> = new Map();
  
  // Track instanced meshes by type
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map();
  private instanceMatrices: Map<string, Float32Array> = new Map();
  private instanceCount: Map<string, number> = new Map();
  
  // For object pooling
  private decorationPool: Map<string, THREE.Object3D[]> = new Map();
  
  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, assetManager?: AssetManager) {
    this.scene = scene;
    this.renderer = renderer;
    this.assetManager = assetManager;
    this.currentTheme = ENVIRONMENT_THEMES.reef; // Start with reef environment
    
    // Initialize quality settings based on device capabilities
    this.deviceCapabilities = detectDeviceCapabilities();
    this.configureQualitySettings(this.deviceCapabilities);
    
    // Initialize instanced meshes for common decoration types
    this.initInstancedMeshes();
    
    // Add instanced meshes to scene
    this.instancedMeshes.forEach(mesh => {
      this.scene.add(mesh);
    });
    
    // Initialize pebbles and shells system
    this.initPebblesSystem();
    
    // Add pebbles group to scene
    this.scene.add(this.pebblesGroup);
    
    // Create skybox
    this.createSkybox();
    
    // Initialize with a few segments
    for (let i = 0; i < this.visibleSegments; i++) {
      this.createSegment(new THREE.Vector3(0, 0, i * this.segmentLength));
    }
    
    // Create water effects
    // Use the already detected capabilities from constructor
    const quality = this.deviceCapabilities.highEnd ? 'high' : 
                 this.deviceCapabilities.midRange ? 'medium' : 'low';
    this.waterEffects = new WaterEffects(scene, quality);
  }
  
  /**
   * Creates skybox for environment
   */
  private createSkybox() {
    // Create simple gradient skybox
    const vertexShader = `
      varying vec3 vWorldPosition;
      
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      
      varying vec3 vWorldPosition;
      
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        float t = max(0.0, min(1.0, pow(max(0.0, h), exponent)));
        gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
      }
    `;
    
    const uniforms = {
      topColor: { value: new THREE.Color(0x6cc7fa) },   // Lighter blue at top
      bottomColor: { value: new THREE.Color(0x0c4a6e) }, // Darker blue at bottom
      offset: { value: 10 },
      exponent: { value: 0.6 }
    };
    
    const skyMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      side: THREE.BackSide,
      fog: false
    });
    
    const skyGeometry = new THREE.SphereGeometry(450, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    this.skyboxMesh = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(this.skyboxMesh);
  }
  
  /**
   * Configure quality settings based on device capabilities
   */
  private configureQualitySettings(capabilities: DeviceCapabilities): void {
    if (capabilities.highEnd) {
      this.qualitySettings = {
        useInstancing: true,
        maxInstancesPerType: 500,
        useLOD: true,
        maxPolygonsPerDecoration: 2000,
        cullingDistance: 300,
        maxPebbles: 1200,
        maxShells: 300,
        pebbleDensity: 1.0,
        shellDensity: 0.3
      };
    } else if (capabilities.midRange) {
      this.qualitySettings = {
        useInstancing: true,
        maxInstancesPerType: 300,
        useLOD: true,
        maxPolygonsPerDecoration: 1000,
        cullingDistance: 200,
        maxPebbles: 800,
        maxShells: 200,
        pebbleDensity: 0.8,
        shellDensity: 0.2
      };
    } else {
      // Low-end device
      this.qualitySettings = {
        useInstancing: true,
        maxInstancesPerType: 150,
        useLOD: true,
        maxPolygonsPerDecoration: 500,
        cullingDistance: 150,
        maxPebbles: 400,
        maxShells: 100,
        pebbleDensity: 0.5,
        shellDensity: 0.1
      };
      
      // Reduce visible segments for low-end devices
      this.visibleSegments = 2;
      this.maxSegments = 5;
    }
    
    // Mobile specific adjustments
    if (capabilities.mobile) {
      this.qualitySettings.maxInstancesPerType = Math.floor(this.qualitySettings.maxInstancesPerType * 0.7);
      this.qualitySettings.cullingDistance *= 0.8;
      this.qualitySettings.maxPolygonsPerDecoration = Math.floor(this.qualitySettings.maxPolygonsPerDecoration * 0.6);
      this.qualitySettings.maxPebbles = Math.floor(this.qualitySettings.maxPebbles * 0.6);
      this.qualitySettings.maxShells = Math.floor(this.qualitySettings.maxShells * 0.6);
      this.qualitySettings.pebbleDensity *= 0.7;
      this.qualitySettings.shellDensity *= 0.7;
    }
  }
  
  /**
   * Initialize instanced meshes for common decoration types
   */
  private initInstancedMeshes(): void {
    // Create instanced meshes for common decoration types
    const instanceTypes = [
      'coral1', 'coral2', 'seaweed1', 'seaGrass', 'rock1', 'rock2',
      'floatingPlankton', 'schoolOfFish'
    ];
    
    instanceTypes.forEach(type => {
      // Find the definition for this type
      const definitions = getDecorationsForEnvironment('reef');
      const definition = definitions.find(def => def.type === type);
      
      if (!definition) return;
      
      // Create a template decoration
      // Create a template decoration
      const templateMesh = DecorationFactory.createDecoration(definition);
      
      // Apply device-specific optimizations to template mesh
      const optimizedMesh = templateMesh instanceof THREE.Group || templateMesh instanceof THREE.Mesh 
        ? optimizeModelAsset(templateMesh, this.deviceCapabilities)
        : templateMesh;
      
      // Extract geometry and material
      let geometry, material;
      
      if (optimizedMesh instanceof THREE.Mesh) {
        geometry = optimizedMesh.geometry;
        material = optimizedMesh.material;
      } else if (optimizedMesh instanceof THREE.Group && optimizedMesh.children.length > 0) {
        const firstChild = optimizedMesh.children[0];
        if (firstChild instanceof THREE.Mesh) {
          geometry = firstChild.geometry;
          material = firstChild.material;
        }
      }
      
      // Cache the geometry and material
      if (geometry && material) {
        this.decorationCache.set(type, { geometry, material });
        
        // Create instanced mesh with maximum instances
        const maxInstances = this.qualitySettings.maxInstancesPerType;
        const instancedMesh = new THREE.InstancedMesh(
          geometry, 
          material instanceof THREE.Material ? material : material[0], 
          maxInstances
        );
        instancedMesh.count = 0; // Start with zero instances
        instancedMesh.frustumCulled = true;
        
        // Store the instanced mesh
        this.instancedMeshes.set(type, instancedMesh);
        this.instanceCount.set(type, 0);
        
        // Create matrix array for instance transforms
        this.instanceMatrices.set(type, new Float32Array(maxInstances * 16));
      }
    });
  }
  
  /**
   * Initialize pebbles and shells system
   */
  private initPebblesSystem(): void {
    // Create the shader material for pebbles/shells
    const pebbleMaterial = this.createPebbleShaderMaterial();
    
    // Create different pebble geometries
    const pebbleGeometries = this.createPebbleGeometries();
    
    // Create shells geometries
    const shellGeometries = this.createShellGeometries();
    
    // Create instanced meshes for different pebble types
    pebbleGeometries.forEach((geometry, index) => {
      const maxPebbles = Math.floor(this.qualitySettings.maxPebbles / pebbleGeometries.length);
      const instancedMesh = new THREE.InstancedMesh(
        geometry,
        pebbleMaterial.clone(),
        maxPebbles
      );
      instancedMesh.count = 0;
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;
      instancedMesh.frustumCulled = true;
      
      // Store in map and add to group
      this.pebbleInstancedMeshes.set(`pebble_${index}`, instancedMesh);
      this.pebblesGroup.add(instancedMesh);
    });
    
    // Create instanced meshes for different shell types
    shellGeometries.forEach((geometry, index) => {
      const maxShells = Math.floor(this.qualitySettings.maxShells / shellGeometries.length);
      const instancedMesh = new THREE.InstancedMesh(
        geometry,
        pebbleMaterial.clone(),
        maxShells
      );
      instancedMesh.count = 0;
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;
      instancedMesh.frustumCulled = true;
      
      // Store in map and add to group
      this.shellInstancedMeshes.set(`shell_${index}`, instancedMesh);
      this.pebblesGroup.add(instancedMesh);
    });
    
    // Populate initial pebbles distribution
    this.populatePebblesAndShells();
  }
  
  /**
   * Creates shader material for pebbles and shells
   */
  private createPebbleShaderMaterial(): THREE.ShaderMaterial {
    // Define the vertex shader
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vSlope;
      
      void main() {
        vec3 worldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        vSlope = max(0.0, dot(worldNormal, vec3(0.0, 1.0, 0.0)));
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;
    
    // Define the fragment shader
    const fragmentShader = `
      uniform vec3 uSandColor;
      uniform vec3 uRockColor;
      uniform vec3 uWetSandColor;
      uniform float uTime;
      uniform sampler2D uCausticMap;
      
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying float vSlope;
      
      // Hash function for noise generation
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      // Simple noise function
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = hash(i + vec2(0, 0));
        float b = hash(i + vec2(1, 0));
        float c = hash(i + vec2(0, 1));
        float d = hash(i + vec2(1, 1));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      
      // Fractal Brownian Motion
      float fbm(vec2 p, int octaves, float persistence) {
        float value = 0.0;
        float amplitude = 1.0;
        float frequency = 1.0;
        float maxValue = 0.0;
        
        for (int i = 0; i < 4; ++i) {
          if (i >= octaves) break;
          value += noise(p * frequency) * amplitude;
          maxValue += amplitude;
          amplitude *= persistence;
          frequency *= 2.0;
        }
        
        return value / maxValue;
      }
      
      void main() {
        vec3 n = normalize(vNormal);
        
        // Slope-based color mixing
        float slopeMix = smoothstep(0.6, 0.9, vSlope);
        vec3 slopeColor = mix(uRockColor, uSandColor, slopeMix);
        
        // Height-based color mixing for underwater effect
        float heightMix = smoothstep(-3.0, -1.0, vWorldPosition.y);
        vec3 baseColor = mix(slopeColor, uWetSandColor * (0.7 + uRockColor * 0.3), 1.0 - heightMix);
        
        // Add detail noise
        float detailNoise = fbm(vWorldPosition.xz * 0.8, 3, 0.45);
        baseColor += detailNoise * 0.08;
        
        // Lighting calculations
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 lightDir = normalize(vec3(0.5, 0.8, 0.4));
        float diff = max(dot(n, lightDir), 0.0);
        
        vec3 halfwayDir = normalize(lightDir + viewDir);
        float specAngle = max(dot(n, halfwayDir), 0.0);
        float spec = pow(specAngle, 16.0) * (0.3 + slopeMix * 0.3);
        
        vec3 litColor = baseColor * (diff * 0.8 + 0.25) + vec3(spec * 0.4);
        
        // Add underwater caustics effect
        vec2 causticUv = vWorldPosition.xz * 0.08 + vec2(uTime * 0.03, uTime * 0.02);
        vec3 caustics = texture2D(uCausticMap, causticUv).rgb * 0.18;
        
        gl_FragColor = vec4(litColor + caustics, 1.0);
        
        // Apply gamma correction
        gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(1.0 / 2.2));
      }
    `;
    
    // Create dynamic caustic texture
    const causticTexture = this.createCausticTexture();
    
    // Create the material with uniforms
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uSandColor: { value: new THREE.Color(this.currentTheme.floorColor) },
        uRockColor: { value: new THREE.Color(0x7d7468) }, // Default rock color
        uWetSandColor: { value: new THREE.Color(this.currentTheme.floorColor).multiplyScalar(0.8) },
        uCausticMap: { value: causticTexture }
      }
    });
    
    return material;
  }
  
  /**
   * Create a caustic texture for underwater light effect
   */
  private createCausticTexture(size: number = 256): THREE.CanvasTexture {
    // Create canvas and context
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not create 2D context for caustic texture');
      // Return a placeholder texture if context creation fails
      return new THREE.CanvasTexture(canvas);
    }
    
    // Initial fill
    ctx.fillStyle = 'rgb(15,15,25)';
    ctx.fillRect(0, 0, size, size);
    
    // Draw some wavy lines to simulate caustics
    const lines = 4;
    
    for (let i = 0; i < lines; i++) {
      ctx.strokeStyle = `rgba(${180 + Math.random() * 50}, ${210 + Math.random() * 45}, 255, ${0.05 + Math.random() * 0.05})`;
      ctx.lineWidth = Math.random() * 1.5 + 1.0;
      ctx.beginPath();
      
      const frequency = (i + 1) * 0.04 + 0.03;
      const amplitude = size * 0.18;
      const speed = (i + 1) * 0.25 + 0.15;
      const offsetX = Math.sin(i * 2) * size * 0.25;
      const offsetY = Math.cos(i * 3) * size * 0.25;
      
      for (let x = 0; x < size; x++) {
        const y = Math.sin((x + offsetX) * frequency) * amplitude + size / 2 + offsetY + Math.cos(x * 0.04 + i * 1.5) * 15;
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearFilter;
    
    return texture;
  }
  
  /**
   * Create pebble geometries with various types and natural variations
   */
  private createPebbleGeometries(): THREE.BufferGeometry[] {
    const geometries: THREE.BufferGeometry[] = [];
    
    // Create 5 different types of pebbles for more variety and natural appearance
    
    // Type 1: Smooth rounded pebble (simple sphere with noise)
    const pebbleGeo1 = this.createPebbleGeometry(0.08, 0, 'smooth');
    geometries.push(pebbleGeo1);
    
    // Type 2: Medium oval pebble with more detail
    const pebbleGeo2 = this.createPebbleGeometry(0.12, 1, 'oval');
    geometries.push(pebbleGeo2);
    
    // Type 3: Flat skipping stone
    const pebbleGeo3 = this.createPebbleGeometry(0.1, 0, 'flat');
    geometries.push(pebbleGeo3);
    
    // Type 4: Angular rough pebble
    const pebbleGeo4 = this.createPebbleGeometry(0.09, 1, 'rough');
    geometries.push(pebbleGeo4);
    
    // Type 5: Small granule pebble (clusters)
    const pebbleGeo5 = this.createPebbleGeometry(0.05, 0, 'granule');
    geometries.push(pebbleGeo5);
    
    return geometries;
  }
  
  /**
   * Creates a pebble geometry with natural shape variations
   */
  private createPebbleGeometry(radius: number = 0.1, detail: number = 0, type: 'smooth' | 'oval' | 'flat' | 'rough' | 'granule' = 'smooth'): THREE.BufferGeometry {
    // Start with a base geometry
    let geometry: THREE.BufferGeometry;
    
    // Choose different base geometries based on type
    switch (type) {
      case 'oval':
        // Use ellipsoid shape as base
        geometry = new THREE.SphereGeometry(radius, 16, 12);
        // Stretch it slightly to create oval shape
        const positionsOval = geometry.attributes.position;
        const vertexOval = new THREE.Vector3();
        
        for (let i = 0; i < positionsOval.count; i++) {
          vertexOval.fromBufferAttribute(positionsOval, i);
          vertexOval.z *= 1.4; // Elongate in Z direction
          positionsOval.setXYZ(i, vertexOval.x, vertexOval.y, vertexOval.z);
        }
        break;
        
      case 'flat':
        // Start with a sphere for rounded edges
        geometry = new THREE.SphereGeometry(radius, 16, 12);
        // Flatten it significantly
        const positionsFlat = geometry.attributes.position;
        const vertexFlat = new THREE.Vector3();
        
        for (let i = 0; i < positionsFlat.count; i++) {
          vertexFlat.fromBufferAttribute(positionsFlat, i);
          vertexFlat.y *= 0.3; // Flatten Y dimension significantly
          // Add slight elongation for river stone look
          vertexFlat.x *= 1.1;
          vertexFlat.z *= 1.2;
          positionsFlat.setXYZ(i, vertexFlat.x, vertexFlat.y, vertexFlat.z);
        }
        break;
        
      case 'rough':
        // Use icosahedron with more corners for angular look
        geometry = new THREE.IcosahedronGeometry(radius, detail);
        // Apply stronger noise to create rougher surface
        break;
        
      case 'granule':
        // Create small cluster of spheres for granule look
        geometry = new THREE.BufferGeometry();
        
        // Create several small spheres in a cluster
        const baseGeom = new THREE.SphereGeometry(radius * 0.6, 8, 6);
        const positions: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        
        // Main center pebble
        let tMatrix = new THREE.Matrix4().makeTranslation(0, 0, 0);
        this.addSphereGeometryTo(baseGeom, tMatrix, positions, normals, uvs);
        
        // Add 2-3 smaller pebbles around it
        const numSpheres = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numSpheres; i++) {
          const angle = (i / numSpheres) * Math.PI * 2;
          const r = radius * 0.5; // Distance from center
          const x = Math.cos(angle) * r;
          const z = Math.sin(angle) * r;
          const scale = 0.4 + Math.random() * 0.3; // Random smaller scale
          
          tMatrix = new THREE.Matrix4()
            .makeTranslation(x, -radius * 0.3, z) // Slightly lower position
            .multiply(new THREE.Matrix4().makeScale(scale, scale, scale));
          
          this.addSphereGeometryTo(baseGeom, tMatrix, positions, normals, uvs);
        }
        
        // Create buffer attributes
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        
        return geometry; // Early return as we don't need noise for granules
        
      case 'smooth':
      default:
        // Smooth rounded pebble (higher detail sphere)
        geometry = new THREE.SphereGeometry(radius, 16, 12);
        break;
    }
    
    // Apply procedural noise to create natural imperfections
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    // Adjust noise parameters based on type
    let noiseFreq = 5.0 / radius;
    let noiseAmp = 0.15 * radius;
    
    // Different noise characteristics per type
    switch (type) {
      case 'smooth':
        noiseFreq = 4.0 / radius;
        noiseAmp = 0.08 * radius; // Subtle noise
        break;
      case 'oval':
        noiseFreq = 6.0 / radius;
        noiseAmp = 0.12 * radius; // Medium noise
        break;
      case 'flat':
        noiseFreq = 8.0 / radius;
        noiseAmp = 0.06 * radius; // Subtle but higher frequency
        break;
      case 'rough':
        noiseFreq = 10.0 / radius;
        noiseAmp = 0.25 * radius; // Stronger noise for roughness
        break;
    }
    
    // Apply noise distortion
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      
      // Use different noise frequencies for more natural variation
      const baseNoise = this.simplex.noise3D(
        vertex.x * noiseFreq, 
        vertex.y * noiseFreq, 
        vertex.z * noiseFreq
      );
      
      // Add secondary noise layer for more detail (only for certain types)
      let secondaryNoise = 0;
      if (type === 'rough' || type === 'oval') {
        secondaryNoise = this.simplex.noise3D(
          vertex.x * noiseFreq * 2, 
          vertex.y * noiseFreq * 2, 
          vertex.z * noiseFreq * 2
        ) * 0.5; // Half amplitude for secondary frequency
      }
      
      // Combine noise layers
      let noiseVal = (baseNoise + secondaryNoise) * noiseAmp;
      
      // Apply noise along normal direction
      vertex.addScaledVector(vertex.clone().normalize(), noiseVal);
      
      // Store modified vertex
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    // Update normals for proper lighting
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
    
    return geometry;
  }
  
  /**
   * Helper method to add a transformed sphere to buffer arrays
   */
  private addSphereGeometryTo(
    sphereGeom: THREE.SphereGeometry, 
    transformMatrix: THREE.Matrix4,
    positions: number[],
    normals: number[],
    uvs: number[]
  ): void {
    // Apply the transformation to vertices and normals
    const tempPos = new THREE.Vector3();
    const tempNormal = new THREE.Vector3();
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(transformMatrix);
    
    const posAttr = sphereGeom.attributes.position;
    const normAttr = sphereGeom.attributes.normal;
    const uvAttr = sphereGeom.attributes.uv;
    
    // Add all vertices with transformation applied
    for (let i = 0; i < posAttr.count; i++) {
      // Transform position
      tempPos.fromBufferAttribute(posAttr, i);
      tempPos.applyMatrix4(transformMatrix);
      positions.push(tempPos.x, tempPos.y, tempPos.z);
      
      // Transform normal
      tempNormal.fromBufferAttribute(normAttr, i);
      tempNormal.applyMatrix3(normalMatrix).normalize();
      normals.push(tempNormal.x, tempNormal.y, tempNormal.z);
      
      // Copy UV
      if (uvAttr) {
        uvs.push(uvAttr.getX(i), uvAttr.getY(i));
      } else {
        uvs.push(0, 0);
      }
    }
  }
  
  /**
   * Create various shell geometries with improved variety and realism
   */
  private createShellGeometries(): THREE.BufferGeometry[] {
    const geometries: THREE.BufferGeometry[] = [];
    
    // Type 1: Conical shell (sea snail or limpet type)
    const conicalShell = this.createConicalShellGeometry(0.08, 0.25, 12);
    geometries.push(conicalShell);
    
    // Type 2: Classic spiral shell (nautilus inspired)
    const spiralShell = this.createSpiralShellGeometry(0.15, 3, 24);
    geometries.push(spiralShell);
    
    // Type 3: Scallop/clam style flat shell
    const scallop = this.createScallopShellGeometry(0.12);
    geometries.push(scallop);
    
    // Type 4: Conch shell with elongated spiral
    const conchShell = this.createConchShellGeometry(0.14);
    geometries.push(conchShell);
    
    return geometries;
  }
  
  /**
   * Creates an enhanced conical shell geometry with realistic details
   */
  private createConicalShellGeometry(radius: number = 0.08, height: number = 0.25, detail: number = 12): THREE.BufferGeometry {
    // Use more segments for smoother cone
    const geometry = new THREE.ConeGeometry(radius, height, detail, 3);
    geometry.translate(0, height * 0.5, 0); // Base at origin
    
    // Add twisted ridges and surface details
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    const twistFreq = 3.0 / height; // Increased frequency for more detail
    const twistAmp = 0.12 * radius; // Slightly stronger twist
    
    // Add radial ridges
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      
      // Skip vertices at the very tip and base for smooth ends
      if (vertex.y > height * 0.05 && vertex.y < height * 0.95) {
        const angle = Math.atan2(vertex.z, vertex.x); // Angle around Y
        
        // Main twist deformation
        const twistOffset = Math.sin(vertex.y * twistFreq * Math.PI) * twistAmp;
        vertex.x += Math.cos(angle + Math.PI/2) * twistOffset;
        vertex.z += Math.sin(angle + Math.PI/2) * twistOffset;
        
        // Add radial ridges (stronger toward the base)
        const ridgeCount = 10; // Number of ridges
        const ridgeAmp = 0.025 * radius * (1.0 - vertex.y / height); // Amplitude diminishes toward tip
        const ridge = Math.sin(angle * ridgeCount) * ridgeAmp;
        
        // Apply ridge displacement along normal
        const normal = new THREE.Vector3(vertex.x, 0, vertex.z).normalize();
        vertex.x += normal.x * ridge;
        vertex.z += normal.z * ridge;
        
        // Add subtle random noise for organic feel
        const noiseVal = this.simplex.noise3D(
          vertex.x * 30, 
          vertex.y * 30, 
          vertex.z * 30
        ) * 0.01 * radius;
        
        vertex.x += noiseVal;
        vertex.y += noiseVal * 0.5;
        vertex.z += noiseVal;
      }
      
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    // Slightly taper the base for realism
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      if (Math.abs(vertex.y) < 0.001) { // Base vertices
        // Scale inward slightly
        vertex.x *= 0.92;
        vertex.z *= 0.92;
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
    }
    
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
    
    // Slightly tilt the shell to look natural when placed
    const tiltMatrix = new THREE.Matrix4().makeRotationX(-Math.PI * 0.15);
    geometry.applyMatrix4(tiltMatrix);
    
    return geometry;
  }
  
  /**
   * Creates an enhanced spiral shell geometry with realistic curves and texture
   */
  private createSpiralShellGeometry(radius: number = 0.15, spirals: number = 3, detail: number = 24): THREE.BufferGeometry {
    // Create a more natural looking spiral with varying thickness
    const shape = new THREE.Shape();
    const points = [];
    
    // Create more detailed spiral with natural growth rate
    // This implements a logarithmic spiral for more realistic shell shape
    const growthRate = 0.15; // Controls how quickly the spiral expands
    const a = radius * 0.15; // Starting radius
    
    for (let i = 0; i <= detail * spirals; i++) {
      const t = (i / (detail * spirals)) * Math.PI * 2 * spirals;
      // Logarithmic spiral formula: r = a * e^(b*θ)
      const r = a * Math.exp(growthRate * t);
      
      // Add small wobble for organic feel
      const wobble = 1.0 + (Math.sin(t * 5) * 0.04);
      
      points.push(new THREE.Vector2(
        Math.cos(t) * r * wobble, 
        Math.sin(t) * r * wobble
      ));
    }
    
    shape.splineThru(points); // Create smooth curve
    
    // Create more interesting extrusion with variable thickness
    const extrudeSettings = { 
      depth: 0.06, // Thicker shell
      bevelEnabled: true, 
      bevelThickness: 0.02, // More pronounced bevel
      bevelSize: 0.015, 
      bevelSegments: 3, // Smoother bevel
      curveSegments: 8,
      steps: 2 // More steps for better quality
    };
    
    // Create the base geometry
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Add ridges along the spiral for texture
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    const center = new THREE.Vector3();
    
    // Calculate center for more accurate distortion
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      center.add(vertex);
    }
    center.divideScalar(positions.count);
    
    // Apply ridges and texture
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      
      // Calculate polar coordinates relative to center
      const dx = vertex.x - center.x;
      const dz = vertex.z - center.z;
      const angle = Math.atan2(dz, dx);
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      // Skip vertices that are part of the bevel/side
      if (vertex.y > 0.001) {
        // Add ridges radiating from center
        const ridgeFreq = 12; // Number of ridges
        const ridgePhase = angle * ridgeFreq;
        const ridgeAmp = 0.008 * Math.min(dist / radius, 1.0); // Amplitude grows with distance
        
        // Apply ridge displacement
        vertex.y += Math.sin(ridgePhase) * ridgeAmp;
        
        // Add small noise for organic texture
        const noiseVal = this.simplex.noise3D(
          vertex.x * 50, 
          vertex.y * 50, 
          vertex.z * 50
        ) * 0.002;
        
        vertex.x += noiseVal;
        vertex.y += noiseVal;
        vertex.z += noiseVal;
      }
      
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    geometry.center(); // Center the geometry
    geometry.rotateX(Math.PI / 2); // Lay flat
    geometry.rotateZ(Math.random() * Math.PI * 2); // Random rotation for variety
    
    // Apply slight random tilt for natural look
    const tiltAmount = Math.random() * 0.2;
    const tiltAxis = new THREE.Vector3(
      Math.random() - 0.5,
      0,
      Math.random() - 0.5
    ).normalize();
    
    const tiltMatrix = new THREE.Matrix4().makeRotationAxis(tiltAxis, tiltAmount);
    geometry.applyMatrix4(tiltMatrix);
    
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
    
    return geometry;
  }
  
  /**
   * Creates a scallop/clam style shell geometry
   */
  private createScallopShellGeometry(radius: number = 0.12): THREE.BufferGeometry {
    // Create a fan-shaped shell
    const shape = new THREE.Shape();
    
    // Create a semi-circle base
    const segments = 12;
    const angleStep = Math.PI / segments;
    
    // Starting point
    shape.moveTo(0, 0); // Center point
    
    // Draw the fan shape
    for (let i = 0; i <= segments; i++) {
      const angle = i * angleStep;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      // Add slight curve to the edge for more natural look
      const edgeCurve = 1.0 + Math.sin(angle) * 0.15;
      
      shape.lineTo(x * edgeCurve, y * edgeCurve);
    }
    
    // Close the shape
    shape.lineTo(0, 0);
    
    // Extrude settings with curved top
    const extrudeSettings = {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2
    };
    
    // Create the geometry
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Add ridges radiating from center
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      
      // Skip vertices on the bottom or sides
      if (vertex.y > 0.005) {
        // Distance from center in XZ plane
        const dx = vertex.x;
        const dz = vertex.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);
        
        // Create radial ridges
        const ridgeCount = 18; // More ridges for scallop look
        const ridgeAmp = 0.02 * Math.sin(Math.PI * Math.min(dist / radius, 1.0)); // Amplitude peaks in the middle
        const ridge = Math.sin(angle * ridgeCount) * ridgeAmp;
        
        // Apply ridge height
        vertex.y += ridge;
        
        // Add curved dome shape
        const domeHeight = 0.04 * (1.0 - Math.pow(dist / radius, 2));
        vertex.y += Math.max(0, domeHeight);
        
        // Add tiny random bumps for texture
        vertex.y += this.simplex.noise3D(
          vertex.x * 40, 
          vertex.y * 40, 
          vertex.z * 40
        ) * 0.003;
      }
      
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    geometry.center(); // Center the geometry
    geometry.rotateX(Math.PI / 2); // Lay flat
    
    // Random rotation for variety
    geometry.rotateZ(Math.random() * Math.PI * 2);
    
    // Add slight random tilt
    const tiltMatrix = new THREE.Matrix4().makeRotationX(-Math.PI * (0.05 + Math.random() * 0.1));
    geometry.applyMatrix4(tiltMatrix);
    
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
    
    return geometry;
  }
  
  /**
   * Creates a conch shell geometry with elongated spiral
   */
  private createConchShellGeometry(radius: number = 0.14): THREE.BufferGeometry {
    // Create a conch shape with elongated end
    const points = [];
    const spiralSegments = 32;
    const revolutions = 1.5; // Fewer revolutions for elongated look
    
    // Create a growth function for more naturalistic spiral
    const growthRate = 0.13;
    const a = radius * 0.15;
    
    // Main spiral section
    for (let i = 0; i <= spiralSegments * revolutions; i++) {
      const t = (i / spiralSegments) * Math.PI * 2;
      const r = a * Math.exp(growthRate * t);
      
      // Spiral narrows as it grows for more realistic shape
      const thickness = Math.max(0.25, 1.0 - (i / (spiralSegments * revolutions)) * 0.6);
      
      // Add small variation to the spiral path
      const wobble = 1.0 + (Math.sin(t * 5) * 0.03);
      
      // Points at the top of the spiral
      points.push(new THREE.Vector3(
        Math.cos(t) * r * wobble,
        0.05 * t, // Gradual rise
        Math.sin(t) * r * wobble
      ));
    }
    
    // Add elongated spire section
    const spireLength = radius * 1.6;
    const spireSegments = 16;
    
    // Last point of spiral as reference
    const lastPoint = points[points.length - 1].clone();
    const spireDirection = new THREE.Vector3(lastPoint.x, 0, lastPoint.z).normalize();
    
    // Create spire points
    for (let i = 1; i <= spireSegments; i++) {
      const t = i / spireSegments;
      // Exponential narrowing of the spire
      const taperFactor = Math.pow(1 - t, 1.5);
      
      // Add some variation to spire curve
      const curve = Math.sin(t * Math.PI * 2) * 0.1;
      
      const point = new THREE.Vector3(
        lastPoint.x + spireDirection.x * spireLength * t + spireDirection.z * curve,
        lastPoint.y + 0.05 * (1 - t * 0.8), // Slight drop at the end
        lastPoint.z + spireDirection.z * spireLength * t - spireDirection.x * curve
      );
      
      // Apply tapering
      point.x *= (0.9 - t * 0.5);
      point.z *= (0.9 - t * 0.5);
      
      points.push(point);
    }
    
    // Create geometry from the path points
    const curve = new THREE.CatmullRomCurve3(points);
    
    // Create tube with a fixed radius (can't use varying radius in TubeGeometry)
    const tubeGeometry = new THREE.TubeGeometry(
      curve,
      (spiralSegments + spireSegments) * 2, // More segments for smoother tube
      radius * 0.15, // Use a fixed radius that's roughly in the middle of our desired range
      16, // Radial segments
      false // Closed
    );
    
    // Add texture to the surface - ridges and bumps
    const positions = tubeGeometry.attributes.position;
    const vertex = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const binormal = new THREE.Vector3();
    
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      
      // Calculate tube surface parameters (u around tube, v along tube)
      const tubeSegments = (spiralSegments + spireSegments) * 2;
      const radialSegments = 16;
      
      const v = Math.floor(i / radialSegments) / tubeSegments; // Position along tube
      const u = (i % radialSegments) / radialSegments; // Position around tube
      
      // Get local tube geometry at this point
      const segmentIndex = Math.floor(i / radialSegments);
      const t = segmentIndex / tubeSegments;
      
      // Add spiral ridges (more pronounced at beginning, fade toward spire)
      const spiralRidges = 20; // Number of spiral ridges
      const spiralPhase = u * Math.PI * 2 + v * spiralRidges; // Spiral around and along tube
      
      // Ridge amplitude varies along the shell
      let ridgeAmp = 0.008;
      if (t < 0.7) {
        // Main spiral section - full ridges
        ridgeAmp = 0.008;
      } else if (t < 0.9) {
        // Transition zone - fading ridges
        ridgeAmp = 0.008 * (1.0 - (t - 0.7) / 0.2);
      } else {
        // Tip of spire - minimal ridges
        ridgeAmp = 0.001;
      }
      
      // Get point normal
      normal.set(0, 0, 0);
      binormal.set(0, 0, 0);
      
      // Approximate normal by looking at nearby vertices
      if (i % radialSegments > 0) {
        const p1 = new THREE.Vector3().fromBufferAttribute(positions, i);
        const p2 = new THREE.Vector3().fromBufferAttribute(positions, i - 1);
        tangent.subVectors(p1, p2).normalize();
        
        // Create a binormal perpendicular to tangent
        if (Math.abs(tangent.y) < 0.99) {
          binormal.set(0, 1, 0).cross(tangent).normalize();
        } else {
          binormal.set(1, 0, 0).cross(tangent).normalize();
        }
        
        // Normal is perpendicular to tangent and binormal
        normal.crossVectors(tangent, binormal);
      }
      
      // Apply ridge displacement along normal and binormal
      const ridgeVal = Math.sin(spiralPhase) * ridgeAmp;
      
      // Apply displacement if we have a valid normal
      if (normal.lengthSq() > 0.1) {
        vertex.addScaledVector(normal, ridgeVal);
      }
      
      // Add small noise for organic texture
      const noiseVal = this.simplex.noise3D(
        vertex.x * 60, 
        vertex.y * 60, 
        vertex.z * 60
      ) * 0.002;
      
      vertex.addScaledVector(normal, noiseVal);
      
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    tubeGeometry.center(); // Center the geometry
    
    // Apply slight random rotation for variety
    tubeGeometry.rotateY(Math.random() * Math.PI * 2);
    
    // Add slight tilt for natural placement
    const tiltMatrix = new THREE.Matrix4().makeRotationX(-Math.PI * 0.1 * (Math.random() * 0.5 + 0.75));
    tubeGeometry.applyMatrix4(tiltMatrix);
    
    tubeGeometry.computeVertexNormals();
    tubeGeometry.attributes.position.needsUpdate = true;
    
    return tubeGeometry;
  }
  
  /**
   * Populates pebbles and shells across the environment with natural distribution patterns
   */
  private populatePebblesAndShells(): void {
    // Get all visible segments for floor raycasting
    const eligibleSegments = this.segments.filter(segment => segment.mesh);
    
    if (eligibleSegments.length === 0) {
      console.warn('No eligible segments found for pebbles placement');
      return;
    }
    
    // Store placed positions to avoid overcrowding
    const placedPositions: THREE.Vector3[] = [];
    const minDistanceSquared = 0.2;
    const dummy = new THREE.Object3D();
    
    // Create distribution noise functions for natural placement patterns
    const distributionNoise = {
      // Large-scale variation (creates "beds" of pebbles)
      largeMaskNoise: (x: number, z: number): number => {
        return (this.simplex.noise2D(x * 0.1, z * 0.1) + 1) * 0.5;
      },
      // Medium variation (creates clusters within beds)
      mediumMaskNoise: (x: number, z: number): number => {
        return (this.simplex.noise2D(x * 0.3, z * 0.3) + 1) * 0.5;
      },
      // Small-scale variation (individual pebble placement)
      smallMaskNoise: (x: number, z: number): number => {
        return (this.simplex.noise2D(x * 0.8, z * 0.8) + 1) * 0.5;
      },
      // Shell-specific distribution (creates small shell patches)
      shellNoise: (x: number, z: number): number => {
        // Shells are more isolated/rare 
        return (this.simplex.noise2D(x * 0.05, z * 0.05) + 1) * 0.5;
      }
    };
    
    // Variations for specific pebble types
    const typeVariationNoise = {
      // Smooth pebbles prefer more central/deeper water areas
      smoothPebbleNoise: (x: number, z: number): number => {
        return (this.simplex.noise2D(x * 0.15, z * 0.15) + 1) * 0.5;
      },
      // Rough pebbles prefer shallower areas
      roughPebbleNoise: (x: number, z: number): number => {
        return (this.simplex.noise2D(x * 0.2 + 50, z * 0.2 + 50) + 1) * 0.5;
      },
      // Flat pebbles cluster in certain areas
      flatPebbleNoise: (x: number, z: number): number => {
        return (this.simplex.noise2D(x * 0.25 + 100, z * 0.25 + 100) + 1) * 0.5;
      }
    };
    
    // Create density map for pebble distribution (to create natural variation)
    const createDensityMap = (segmentWidth: number, segmentLength: number, resolution: number = 20): number[][] => {
      const widthCells = Math.floor(segmentWidth * resolution);
      const lengthCells = Math.floor(segmentLength * resolution);
      const map: number[][] = [];
      
      for (let x = 0; x < widthCells; x++) {
        map[x] = [];
        for (let z = 0; z < lengthCells; z++) {
          // Convert to world coordinates
          const worldX = (x / resolution) - (segmentWidth / 2);
          const worldZ = (z / resolution) - (segmentLength / 2);
          
          // Combine large, medium and small variation for natural feel
          const largeMask = distributionNoise.largeMaskNoise(worldX, worldZ);
          const mediumMask = distributionNoise.mediumMaskNoise(worldX, worldZ);
          const smallMask = distributionNoise.smallMaskNoise(worldX, worldZ);
          
          // Create compound mask with appropriate weighting
          const compoundMask = largeMask * 0.7 + mediumMask * 0.2 + smallMask * 0.1;
          
          // Enhance contrast for more distinct pebble beds
          const enhancedMask = Math.pow(compoundMask, 1.8);
          
          // Store in map
          map[x][z] = enhancedMask;
        }
      }
      
      return map;
    };
    
    // Create density maps for each segment
    const segmentDensityMaps = new Map<EnvironmentSegment, number[][]>();
    for (const segment of eligibleSegments) {
      segmentDensityMaps.set(segment, createDensityMap(this.segmentWidth, this.segmentLength));
    }
    
    // Place pebbles using the density maps for natural distribution
    this.pebbleInstancedMeshes.forEach((instancedMesh, typeName) => {
      let instancesPlaced = 0;
      const maxInstances = instancedMesh.count;
      const attempts = maxInstances * 5; // More attempts for better distribution
      
      // Get type index for variation logic
      const typeIndex = parseInt(typeName.split('_')[1], 10) || 0;
      
      // Calculate base chance for this pebble type (some are rarer than others)
      let baseTypeChance = 1.0;
      if (typeName.includes('pebble_0')) { // Smooth rounded pebbles
        baseTypeChance = 0.8; // Common
      } else if (typeName.includes('pebble_1')) { // Oval pebbles
        baseTypeChance = 0.7; // Somewhat common
      } else if (typeName.includes('pebble_2')) { // Flat pebbles
        baseTypeChance = 0.5; // Medium rarity
      } else if (typeName.includes('pebble_3')) { // Angular pebbles
        baseTypeChance = 0.4; // Somewhat rare
      } else if (typeName.includes('pebble_4')) { // Granule clusters
        baseTypeChance = 0.3; // Rarer
      }
      
      for (let i = 0; i < attempts && instancesPlaced < maxInstances; i++) {
        // Choose segment with slight bias toward earlier segments
        const segmentIndex = Math.min(
          eligibleSegments.length - 1, 
          Math.floor(Math.random() * Math.random() * eligibleSegments.length)
        );
        const segment = eligibleSegments[segmentIndex];
        const densityMap = segmentDensityMaps.get(segment);
        
        if (!densityMap) continue;
        
        // Get cell coordinates
        const resolution = 20; // Must match createDensityMap
        const cellX = Math.floor(Math.random() * densityMap.length);
        const cellZ = Math.floor(Math.random() * densityMap[0].length);
        
        // Get density at this point
        const density = densityMap[cellX][cellZ];
        
        // Calculate chance to place based on pebble type and density
        let typeChance = baseTypeChance;
        
        // Apply different distributions for different pebble types
        const worldX = (cellX / resolution) - (this.segmentWidth / 2);
        const worldZ = (cellZ / resolution) - (this.segmentLength / 2) + segment.mesh.position.z;
        
        // Type-specific distribution adjustments
        if (typeName.includes('pebble_0')) { // Smooth pebbles
          typeChance *= typeVariationNoise.smoothPebbleNoise(worldX, worldZ);
        } else if (typeName.includes('pebble_3')) { // Rough pebbles
          typeChance *= typeVariationNoise.roughPebbleNoise(worldX, worldZ);
        } else if (typeName.includes('pebble_2')) { // Flat pebbles
          typeChance *= typeVariationNoise.flatPebbleNoise(worldX, worldZ);
        }
        
        // Determine if we place a pebble here
        if (Math.random() > density * typeChance) continue;
        
        // Calculate precise world position from cell coordinates
        const jitterX = (Math.random() - 0.5) / resolution;
        const jitterZ = (Math.random() - 0.5) / resolution;
        
        const x = worldX + jitterX;
        const z = worldZ + jitterZ;
        
        // Raycast to find exact terrain height
        this.raycaster.set(new THREE.Vector3(x, 30, z), this.DOWN_VECTOR);
        const intersects = this.raycaster.intersectObject(segment.mesh);
        
        if (intersects.length > 0) {
          const point = intersects[0].point;
          const normal = intersects[0].face?.normal?.clone().normalize() || this.UP_VECTOR;
          
          // Slope-based rejection - pebbles prefer flatter areas
          const slopeAmount = 1.0 - Math.max(0, normal.dot(this.UP_VECTOR));
          if (slopeAmount > 0.3 && Math.random() < slopeAmount * 2) {
            continue; // Skip steep slopes with higher probability
          }
          
          // Check if too close to other placed items
          let tooClose = false;
          for (const p of placedPositions) {
            // Variable minimum distance based on type
            let typeMinDistSquared = minDistanceSquared;
            
            // Granule clusters can be closer together
            if (typeName.includes('pebble_4')) {
              typeMinDistSquared *= 0.7;
            }
            
            if (p.distanceToSquared(point) < typeMinDistSquared) {
              tooClose = true;
              break;
            }
          }
          
          if (tooClose) continue;
          
          // Set position with slight randomization
          dummy.position.copy(point);
          // Sink slightly into ground for realistic embedding
          dummy.position.addScaledVector(normal, 0.005 + Math.random() * 0.01);
          
          // Set rotation to align with normal and add random yaw
          dummy.quaternion.setFromUnitVectors(this.UP_VECTOR, normal);
          dummy.rotateY(Math.random() * Math.PI * 2);
          
          // Add slight random tilt for natural look
          const tiltAmount = Math.random() * 0.15; // Small random tilt
          const tiltAxis = new THREE.Vector3(
            Math.random() - 0.5,
            0,
            Math.random() - 0.5
          ).normalize();
          
          const tiltMatrix = new THREE.Matrix4().makeRotationAxis(tiltAxis, tiltAmount);
          const currentRotation = new THREE.Matrix4().makeRotationFromQuaternion(dummy.quaternion);
          dummy.quaternion.setFromRotationMatrix(currentRotation.multiply(tiltMatrix));
          
          // Set scale with type-specific variation
          let scaleBase = 0.9;
          let scaleVariation = 0.4;
          
          // Adjust scale for different types
          if (typeName.includes('pebble_0')) { // Smooth rounded pebbles
            scaleBase = 0.9;
            scaleVariation = 0.4;
          } else if (typeName.includes('pebble_1')) { // Oval pebbles
            scaleBase = 1.0;
            scaleVariation = 0.3;
          } else if (typeName.includes('pebble_2')) { // Flat pebbles
            scaleBase = 0.8;
            scaleVariation = 0.35;
          } else if (typeName.includes('pebble_3')) { // Angular pebbles
            scaleBase = 0.85;
            scaleVariation = 0.45; // More size variation
          } else if (typeName.includes('pebble_4')) { // Granule clusters
            scaleBase = 0.7;
            scaleVariation = 0.25; // More consistent sizing
          }
          
          const scale = scaleBase + Math.random() * scaleVariation;
          
          // Some pebble types have non-uniform scaling for variety
          if (typeName.includes('pebble_2')) { // Flat pebbles are sometimes extra flat
            if (Math.random() < 0.3) {
              dummy.scale.set(scale, scale * 0.7, scale);
            } else {
              dummy.scale.set(scale, scale, scale);
            }
          } else if (typeName.includes('pebble_1')) { // Oval pebbles have slight elongation
            if (Math.random() < 0.4) {
              const elongation = 1.0 + Math.random() * 0.3;
              dummy.scale.set(scale, scale, scale * elongation);
            } else {
              dummy.scale.set(scale, scale, scale);
            }
          } else {
            dummy.scale.set(scale, scale, scale);
          }
          
          // Update matrix and set instance
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(instancesPlaced, dummy.matrix);
          
          placedPositions.push(point.clone());
          instancesPlaced++;
        }
      }
      
      // Update instance count and matrix data
      instancedMesh.count = instancesPlaced;
      instancedMesh.instanceMatrix.needsUpdate = true;
      console.log(`Placed ${instancesPlaced} instances of ${typeName}`);
    });
    
    // Place shells using a different distribution algorithm (rarer, more isolated)
    this.shellInstancedMeshes.forEach((instancedMesh, typeName) => {
      let instancesPlaced = 0;
      const maxInstances = instancedMesh.count;
      const attempts = maxInstances * 6;
      
      // Get type index for variation logic
      const typeIndex = parseInt(typeName.split('_')[1], 10) || 0;
      
      // Calculate base chance for this shell type
      let baseTypeChance = 1.0;
      if (typeName.includes('shell_0')) { // Conical shells
        baseTypeChance = 0.6;
      } else if (typeName.includes('shell_1')) { // Spiral shells
        baseTypeChance = 0.45;
      } else if (typeName.includes('shell_2')) { // Scallop shells
        baseTypeChance = 0.55;
      } else if (typeName.includes('shell_3')) { // Conch shells
        baseTypeChance = 0.4; // Rarer
      }
      
      for (let i = 0; i < attempts && instancesPlaced < maxInstances; i++) {
        // Choose segment with bias toward later segments
        const segmentIndex = Math.min(
          eligibleSegments.length - 1, 
          Math.floor((Math.random() + Math.random()) * eligibleSegments.length / 2)
        );
        const segment = eligibleSegments[segmentIndex];
        
        // Find random position on segment
        const x = (Math.random() - 0.5) * this.segmentWidth;
        const z = segment.mesh.position.z + (Math.random() - 0.5) * this.segmentLength;
        
        // Get shell-specific noise value at this position
        const shellNoiseValue = distributionNoise.shellNoise(x, z);
        
        // Use shell noise to determine if we place a shell here
        if (Math.random() > shellNoiseValue * shellNoiseValue * baseTypeChance) {
          continue;
        }
        
        this.raycaster.set(new THREE.Vector3(x, 30, z), this.DOWN_VECTOR);
        const intersects = this.raycaster.intersectObject(segment.mesh);
        
        if (intersects.length > 0) {
          const point = intersects[0].point;
          const normal = intersects[0].face?.normal?.clone().normalize() || this.UP_VECTOR;
          
          // Shells strongly prefer flatter areas
          const slopeAmount = 1.0 - Math.max(0, normal.dot(this.UP_VECTOR));
          if (slopeAmount > 0.2 && Math.random() < slopeAmount * 3) {
            continue; // Skip slopes with higher probability for shells
          }
          
          // Check if too close to other placed items
          let tooClose = false;
          const shellMinDistSquared = minDistanceSquared * 3; // Shells need more space
          
          for (const p of placedPositions) {
            if (p.distanceToSquared(point) < shellMinDistSquared) {
              tooClose = true;
              break;
            }
          }
          
          if (tooClose) continue;
          
          // Set position - shells sit more prominently on surface
          dummy.position.copy(point);
          dummy.position.addScaledVector(normal, 0.02); // Lift slightly more off surface
          
          // Set rotation to align with normal and add random yaw
          dummy.quaternion.setFromUnitVectors(this.UP_VECTOR, normal);
          dummy.rotateY(Math.random() * Math.PI * 2);
          
          // Randomize rotation further for more natural look
          const additionalTiltAmount = Math.random() * 0.1; // Subtle tilt
          const tiltAxis = new THREE.Vector3(
            Math.random() - 0.5,
            0,
            Math.random() - 0.5
          ).normalize();
          
          const tiltMatrix = new THREE.Matrix4().makeRotationAxis(tiltAxis, additionalTiltAmount);
          const currentRotation = new THREE.Matrix4().makeRotationFromQuaternion(dummy.quaternion);
          dummy.quaternion.setFromRotationMatrix(currentRotation.multiply(tiltMatrix));
          
          // Set random scale with shell-specific adjustments
          let scaleBase = 0.9;
          let scaleVariation = 0.3;
          
          if (typeName.includes('shell_0')) { // Conical shells
            scaleBase = 0.85;
            scaleVariation = 0.3;
          } else if (typeName.includes('shell_1')) { // Spiral shells
            scaleBase = 0.9;
            scaleVariation = 0.35;
          } else if (typeName.includes('shell_2')) { // Scallop shells
            scaleBase = 0.95;
            scaleVariation = 0.25;
          } else if (typeName.includes('shell_3')) { // Conch shells
            scaleBase = 1.0;
            scaleVariation = 0.4; // Higher variation
          }
          
          const scale = scaleBase + Math.random() * scaleVariation;
          dummy.scale.set(scale, scale, scale);
          
          // Update matrix and set instance
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(instancesPlaced, dummy.matrix);
          
          placedPositions.push(point.clone());
          instancesPlaced++;
        }
      }
      
      // Update instance count and matrix data
      instancedMesh.count = instancesPlaced;
      instancedMesh.instanceMatrix.needsUpdate = true;
      console.log(`Placed ${instancesPlaced} instances of ${typeName}`);
    });
    
    // Create small shell collections (groups of shells) for visual interest
    const createShellCollections = (count: number = 5) => {
      // Only create collections if we have segments
      if (eligibleSegments.length === 0) return;
      
      for (let i = 0; i < count; i++) {
        // Choose a segment, preferring later segments
        const segmentIndex = Math.min(
          eligibleSegments.length - 1, 
          Math.floor(Math.random() * eligibleSegments.length)
        );
        const segment = eligibleSegments[segmentIndex];
        
        // Pick a location for the collection
        const centerX = (Math.random() - 0.5) * (this.segmentWidth * 0.7);
        const centerZ = segment.mesh.position.z + (Math.random() - 0.5) * (this.segmentLength * 0.7);
        
        // Check if the location is valid (on terrain)
        this.raycaster.set(new THREE.Vector3(centerX, 30, centerZ), this.DOWN_VECTOR);
        const intersects = this.raycaster.intersectObject(segment.mesh);
        
        if (intersects.length === 0) continue;
        
        const centerPoint = intersects[0].point;
        const normal = intersects[0].face?.normal?.clone().normalize() || this.UP_VECTOR;
        
        // Skip steep areas
        const slopeAmount = 1.0 - Math.max(0, normal.dot(this.UP_VECTOR));
        if (slopeAmount > 0.25) continue;
        
        // Check if area is already crowded
        let areaCrowded = false;
        for (const p of placedPositions) {
          if (p.distanceToSquared(centerPoint) < minDistanceSquared * 12) {
            areaCrowded = true;
            break;
          }
        }
        
        if (areaCrowded) continue;
        
        // Place 3-7 shells in a collection
        const collectionSize = 3 + Math.floor(Math.random() * 5);
        const collectionRadius = 0.5 + Math.random() * 0.5;
        
        for (let j = 0; j < collectionSize; j++) {
          // Choose random shell type for each position
          const shellMeshes = Array.from(this.shellInstancedMeshes.values());
          if (shellMeshes.length === 0) continue;
          
          const shellMesh = shellMeshes[Math.floor(Math.random() * shellMeshes.length)];
          
          // Skip if we've filled this mesh's capacity
          if (shellMesh.count >= shellMesh.instanceMatrix.count) continue;
          
          // Place within collection radius
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * collectionRadius;
          const offsetX = Math.cos(angle) * distance;
          const offsetZ = Math.sin(angle) * distance;
          
          const shellX = centerX + offsetX;
          const shellZ = centerZ + offsetZ;
          
          // Verify position on terrain
          this.raycaster.set(new THREE.Vector3(shellX, 30, shellZ), this.DOWN_VECTOR);
          const shellIntersects = this.raycaster.intersectObject(segment.mesh);
          
          if (shellIntersects.length === 0) continue;
          
          const shellPoint = shellIntersects[0].point;
          const shellNormal = shellIntersects[0].face?.normal?.clone().normalize() || this.UP_VECTOR;
          
          // Set position and rotation
          dummy.position.copy(shellPoint);
          dummy.position.addScaledVector(shellNormal, 0.02);
          
          // Align with terrain and add variation
          dummy.quaternion.setFromUnitVectors(this.UP_VECTOR, shellNormal);
          dummy.rotateY(Math.random() * Math.PI * 2);
          
          // Set scale (slightly smaller for collections)
          const scale = 0.7 + Math.random() * 0.3;
          dummy.scale.set(scale, scale, scale);
          
          // Update matrix and add to collection
          dummy.updateMatrix();
          shellMesh.setMatrixAt(shellMesh.count, dummy.matrix);
          
          placedPositions.push(shellPoint.clone());
          shellMesh.count++;
        }
        
        // Update all shell meshes
        this.shellInstancedMeshes.forEach(mesh => {
          mesh.instanceMatrix.needsUpdate = true;
        });
      }
    };
    
    // Create a few shell collections for visual interest
    createShellCollections(4 + Math.floor(Math.random() * 4));
  }
  
  /**
   * Create a decoration with performance optimizations
   */
  private createDecoration(definition: DecorationDefinition): THREE.Object3D {
    // Check if we can use instancing for this decoration type
    if (this.qualitySettings.useInstancing && this.instancedMeshes.has(definition.type)) {
      // Check if we've reached the instance limit
      const instancedMesh = this.instancedMeshes.get(definition.type)!;
      const currentCount = this.instanceCount.get(definition.type)!;
      
      if (currentCount < this.qualitySettings.maxInstancesPerType) {
        // Create a matrix for the instance transform
        const matrix = new THREE.Matrix4();
        
        // Scale with variation
        const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
        const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
        matrix.makeScale(finalScale, finalScale, finalScale);
        
        // Apply random rotation
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(Math.random() * definition.rotationVariance);
        matrix.multiply(rotationMatrix);
        
        // Set instance matrix
        instancedMesh.setMatrixAt(currentCount, matrix);
        
        // Increase count
        this.instanceCount.set(definition.type, currentCount + 1);
        instancedMesh.count = currentCount + 1;
        instancedMesh.instanceMatrix.needsUpdate = true;
        
        // Create a dummy object for positioning, the actual rendering will use the instanced mesh
        const dummyObj = new THREE.Group();
        dummyObj.userData.isInstancedDecorationReference = true;
        dummyObj.userData.instanceType = definition.type;
        dummyObj.userData.instanceIndex = currentCount;
        
        return dummyObj;
      }
    }
    
    // If instancing is not possible or we've reached the limit, check if we have a pooled object
    if (this.decorationPool.has(definition.type)) {
      const pool = this.decorationPool.get(definition.type)!;
      if (pool.length > 0) {
        // Reuse an object from the pool
        const decoration = pool.pop()!;
        
        // Reset the object (scale, rotation, etc.)
        const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
        const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
        decoration.scale.set(finalScale, finalScale, finalScale);
        decoration.rotation.y = Math.random() * definition.rotationVariance;
        
        return decoration;
      }
    }
    
    // If no pooled object is available, create a new one
    // Create the decoration using DecorationFactory
    const decoration = DecorationFactory.createDecoration(definition);
    
    // Optimize the decoration based on device capabilities
    const optimizedDecoration = decoration instanceof THREE.Group || decoration instanceof THREE.Mesh 
      ? optimizeModelAsset(decoration, this.deviceCapabilities)
      : decoration;
    
    // If we're using LOD, create a low-poly version for distance rendering
    if (this.qualitySettings.useLOD) {
      const lodGroup = new THREE.LOD();
      
      // Add the full detail mesh at close range
      lodGroup.addLevel(optimizedDecoration, 0);
      
      // Create and add a lower detail version for medium range
      const mediumDetail = DecorationFactory.createLowPolyVersion(optimizedDecoration, 0.5);
      lodGroup.addLevel(mediumDetail, 50);
      
      // Create and add a low detail version for far range
      const lowDetail = DecorationFactory.createLowPolyVersion(optimizedDecoration, 0.2);
      lodGroup.addLevel(lowDetail, 150);
      
      return lodGroup;
    }
    
    return optimizedDecoration;
  }
  
  /**
   * Create an environment segment at the specified position
   */
  private createSegment(position: THREE.Vector3): EnvironmentSegment {
    // Determine environment type based on distance
    const environmentType = this.determineEnvironmentType(position.z);
    const theme = ENVIRONMENT_THEMES[environmentType];
    
    // Create the segment
    const segment = new EnvironmentSegment(
      this.scene,
      theme,
      position,
      this.segmentLength,
      this.segmentWidth,
      false // We'll add decorations manually for better control
    );
    
    // Add decorations to the segment
    this.addDecorationsToSegment(segment, theme);
    
    // Store the segment
    this.segments.push(segment);
    
    return segment;
  }
  
  /**
   * Add decorations to a segment
   */
  private addDecorationsToSegment(segment: EnvironmentSegment, theme: EnvironmentTheme): void {
    // Filter decorations for current environment type
    const availableDecorations = getDecorationsForEnvironment(theme.type);
    
    if (availableDecorations.length === 0) return;
    
    // Calculate total probability weight
    const totalWeight = availableDecorations.reduce((sum, def) => sum + def.probability, 0);
    
    // Calculate number of decorations based on density and segment size
    const decorationCount = Math.floor(theme.decorationDensity * this.segmentLength / 10);
    
    // Create decorations
    for (let i = 0; i < decorationCount; i++) {
      // Choose a random decoration based on probability
      const random = Math.random() * totalWeight;
      let weightSum = 0;
      let chosenDecoration: DecorationDefinition | null = null;
      
      for (const def of availableDecorations) {
        weightSum += def.probability;
        if (random <= weightSum) {
          chosenDecoration = def;
          break;
        }
      }
      
      if (!chosenDecoration) {
        chosenDecoration = availableDecorations[0];
      }
      
      // Add decoration
      const decoration = this.createDecoration(chosenDecoration);
      
      // Position randomly within segment
      const x = (Math.random() - 0.5) * 30; // Segment width is 40, use slightly smaller area
      const z = (Math.random() - 0.5) * (segment.segmentLength - 5) + segment.mesh.position.z;
      
      decoration.position.set(x, chosenDecoration.yOffset, z - segment.mesh.position.z);
      
      // For decorations that can float above ground, adjust Y position
      if (chosenDecoration.canFloatAboveGround) {
        decoration.position.y += Math.random() * 3;
      }
      
      // Add to segment's decorations group
      segment.decorations.add(decoration);
    }
  }
  
  /**
   * Determine which environment type to use based on distance
   */
  private determineEnvironmentType(distance: number): EnvironmentType {
    // Check if we need to transition to a new environment
    if (distance >= this.nextThemeChange) {
      // Choose a new environment type
      const currentType = this.currentTheme.type;
      let availableTypes: EnvironmentType[] = Object.keys(ENVIRONMENT_THEMES) as EnvironmentType[];
      
      // Filter out current type
      availableTypes = availableTypes.filter(type => type !== currentType);
      
      // Choose randomly from available types
      const nextType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      
      // Store previous theme for transition
      this.previousTheme = this.currentTheme;
      
      // Set new current theme
      this.currentTheme = ENVIRONMENT_THEMES[nextType];
      
      // Calculate next theme change distance
      this.nextThemeChange = distance + this.currentTheme.minDistance + Math.random() * 500;
      
      // Start transition
      this.themeTransitionProgress = 0;
      
      // Notify of environment change
      eventBus.emit('environment-change', {
        from: this.previousTheme.type,
        to: this.currentTheme.type,
        distance
      });
    }
    
    return this.currentTheme.type;
  }
  
  /**
   * Get access to water effects instance for external control
   */
  public getWaterEffects(): WaterEffects {
    return this.waterEffects;
  }

  /**
   * Update environment based on player position and camera
   */
  public update(playerPosition: THREE.Vector3, camera: THREE.Camera, deltaTime: number): void {
    this.totalDistance = playerPosition.z;
    
    // Calculate which segment the player is in
    const currentSegmentIndex = Math.floor(playerPosition.z / this.segmentLength);
    
    // Update camera frustum for culling
    this.cameraViewMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.cameraViewMatrix);
    
    // Generate new segments ahead
    while (this.segments.length - this.maxSegments < currentSegmentIndex + this.visibleSegments) {
      const position = new THREE.Vector3(
        0,
        0,
        (this.segments.length - this.maxSegments + this.segments.length) * this.segmentLength
      );
      
      // Create new segment
      this.createSegment(position);
    }
    
    // Recycle segments behind player
    while (this.segments.length > this.maxSegments && 
           this.segments[0].mesh.position.z < playerPosition.z - this.segmentLength * 2) {
      const segment = this.segments.shift();
      if (segment) {
        // Recycle segment resources
        this.recycleSegment(segment);
      }
    }
    
    // Update pebbles group position
    this.pebblesGroup.position.z = playerPosition.z;
    
    // Update theme transition
    if (this.themeTransitionProgress < 1.0 && this.previousTheme) {
      this.themeTransitionProgress += deltaTime / this.currentTheme.transitionDuration;
      this.themeTransitionProgress = Math.min(this.themeTransitionProgress, 1.0);
      
      // Create interpolated theme
      const lerpedTheme = lerpThemes(this.previousTheme, this.currentTheme, this.themeTransitionProgress);
      
      // Apply to scene
      applyEnvironmentTheme(this.scene, this.renderer, lerpedTheme);
      
      // Update skybox colors if it exists
      if (this.skyboxMesh && this.skyboxMesh.material instanceof THREE.ShaderMaterial) {
        const material = this.skyboxMesh.material;
        const topColor = new THREE.Color(lerpedTheme.backgroundColor).lerp(new THREE.Color(0xffffff), 0.3);
        const bottomColor = new THREE.Color(lerpedTheme.backgroundColor).multiplyScalar(0.7);
        
        material.uniforms.topColor.value = topColor;
        material.uniforms.bottomColor.value = bottomColor;
      }
      
      // Update pebbles and shells materials if we're transitioning environments
      this.pebbleInstancedMeshes.forEach(mesh => {
        if (mesh.material instanceof THREE.ShaderMaterial) {
          mesh.material.uniforms.uSandColor.value = new THREE.Color(lerpedTheme.floorColor);
          mesh.material.uniforms.uRockColor.value = new THREE.Color(0x7d7468); // Default rock color
        }
      });
      
      this.shellInstancedMeshes.forEach(mesh => {
        if (mesh.material instanceof THREE.ShaderMaterial) {
          mesh.material.uniforms.uSandColor.value = new THREE.Color(lerpedTheme.floorColor);
          mesh.material.uniforms.uRockColor.value = new THREE.Color(0x7d7468); // Default rock color
        }
      });
    }
    
    // Update water effects
    if (this.waterEffects) {
      this.waterEffects.update(deltaTime, playerPosition);
    }
    
    // Update skybox position to follow player
    if (this.skyboxMesh) {
      this.skyboxMesh.position.z = playerPosition.z;
    }
    
    // Update all visible segments
    for (const segment of this.segments) {
      // Skip updating if segment is far away
      if (this.isSegmentVisible(segment, camera, playerPosition)) {
        segment.update(deltaTime);
      }
    }
    
    // Update time uniforms for pebbles and shells materials
    this.pebbleInstancedMeshes.forEach(mesh => {
      if (mesh.material instanceof THREE.ShaderMaterial && mesh.material.uniforms.uTime) {
        mesh.material.uniforms.uTime.value = deltaTime;
      }
    });
    
    this.shellInstancedMeshes.forEach(mesh => {
      if (mesh.material instanceof THREE.ShaderMaterial && mesh.material.uniforms.uTime) {
        mesh.material.uniforms.uTime.value = deltaTime;
      }
    });
  }
  
  /**
   * Check if a segment is visible to the camera
   */
  private isSegmentVisible(segment: EnvironmentSegment, camera: THREE.Camera, playerPosition: THREE.Vector3): boolean {
    // Distance check
    const distance = playerPosition.distanceTo(segment.mesh.position);
    if (distance > this.qualitySettings.cullingDistance) {
      return false;
    }
    
    // Frustum check
    return segment.isVisibleToCamera(camera);
  }
  
  /**
   * Recycle segment resources
   */
  private recycleSegment(segment: EnvironmentSegment): void {
    // Store decorations in object pools
    segment.decorations.children.forEach(decoration => {
      // Check if it's an instanced decoration reference
      if (decoration.userData.isInstancedDecorationReference) {
        const instanceType = decoration.userData.instanceType;
        const instanceIndex = decoration.userData.instanceIndex;
        
        // Release the instance
        if (this.instancedMeshes.has(instanceType)) {
          const instancedMesh = this.instancedMeshes.get(instanceType)!;
          // Mark instance as unused (we could do this by setting the matrix to scale 0)
          const matrix = new THREE.Matrix4();
          matrix.makeScale(0, 0, 0);
          instancedMesh.setMatrixAt(instanceIndex, matrix);
          instancedMesh.instanceMatrix.needsUpdate = true;
        }
      } else {
        // Regular mesh - add to pool
        const decorationType = decoration.userData.decorationType;
        if (decorationType) {
          if (!this.decorationPool.has(decorationType)) {
            this.decorationPool.set(decorationType, []);
          }
          
          // Store in pool
          this.decorationPool.get(decorationType)!.push(decoration);
        }
      }
    });
    
    // Clear segment decorations without disposing
    while (segment.decorations.children.length > 0) {
      segment.decorations.remove(segment.decorations.children[0]);
    }
    
    // Remove from scene
    this.scene.remove(segment.mesh);
    
    // Dispose segment resources
    segment.dispose();
  }
  
  /**
   * Set environment quality level
   */
  public setQualityLevel(level: 'high' | 'medium' | 'low'): void {
    let settings;
    
    switch (level) {
      case 'high':
        settings = {
          useInstancing: true,
          maxInstancesPerType: 500,
          useLOD: true,
          maxPolygonsPerDecoration: 2000,
          cullingDistance: 300,
          maxPebbles: 1000,
          maxShells: 300,
          pebbleDensity: 1.0,
          shellDensity: 0.3
        };
        break;
      case 'medium':
        settings = {
          useInstancing: true,
          maxInstancesPerType: 300,
          useLOD: true,
          maxPolygonsPerDecoration: 1000,
          cullingDistance: 200,
          maxPebbles: 800,
          maxShells: 200,
          pebbleDensity: 0.8,
          shellDensity: 0.2
        };
        break;
      case 'low':
        settings = {
          useInstancing: true,
          maxInstancesPerType: 150,
          useLOD: true,
          maxPolygonsPerDecoration: 500,
          cullingDistance: 150,
          maxPebbles: 400,
          maxShells: 100,
          pebbleDensity: 0.5,
          shellDensity: 0.1
        };
        break;
    }
    
    this.qualitySettings = settings;
    
    // Reset instance meshes
    this.instancedMeshes.forEach(mesh => {
      this.scene.remove(mesh);
    });
    
    this.instancedMeshes.clear();
    this.instanceMatrices.clear();
    this.instanceCount.clear();
    
    // Reinitialize instance meshes
    this.initInstancedMeshes();
    
    // Add instanced meshes to scene
    this.instancedMeshes.forEach(mesh => {
      this.scene.add(mesh);
    });
  }
  
  /**
   * Force environment change for testing or specific game events
   */
  public forceEnvironmentChange(type: EnvironmentType, instantTransition: boolean = false): void {
    if (type === this.currentTheme.type) return;
    
    if (instantTransition) {
      // Apply immediately
      this.previousTheme = null;
      this.currentTheme = ENVIRONMENT_THEMES[type];
      this.themeTransitionProgress = 1.0;
      applyEnvironmentTheme(this.scene, this.renderer, this.currentTheme);
      
      // Update pebbles and shells materials
      this.pebbleInstancedMeshes.forEach(mesh => {
        if (mesh.material instanceof THREE.ShaderMaterial) {
          mesh.material.uniforms.uSandColor.value = new THREE.Color(this.currentTheme.floorColor);
          mesh.material.uniforms.uRockColor.value = new THREE.Color(0x7d7468); // Default rock color
        }
      });
      
      this.shellInstancedMeshes.forEach(mesh => {
        if (mesh.material instanceof THREE.ShaderMaterial) {
          mesh.material.uniforms.uSandColor.value = new THREE.Color(this.currentTheme.floorColor);
          mesh.material.uniforms.uRockColor.value = new THREE.Color(0x7d7468); // Default rock color
        }
      });
      
      // Update visible segments to the new theme
      this.segments.forEach(segment => {
        segment.dispose();
      });
      this.segments = [];
      
      // Initialize with a few segments
      for (let i = 0; i < this.visibleSegments; i++) {
        this.createSegment(new THREE.Vector3(0, 0, i * this.segmentLength));
      }
    } else {
      // Store previous theme for transition
      this.previousTheme = this.currentTheme;
      
      // Set new current theme
      this.currentTheme = ENVIRONMENT_THEMES[type];
      
      // Start transition
      this.themeTransitionProgress = 0;
      
      // Notify of environment change
      eventBus.emit('environment-change', {
        from: this.previousTheme.type,
        to: this.currentTheme.type,
        distance: this.totalDistance
      });
    }
  }
  
  /**
   * Get current environment details
   */
  public getEnvironmentInfo() {
    return {
      type: this.currentTheme.type,
      theme: this.currentTheme,
      isTransitioning: this.previousTheme !== null,
      transitionProgress: this.themeTransitionProgress,
      pendingType: this.previousTheme ? null : this.currentTheme.type
    };
  }
  
  /**
   * Set segment view distance
   */
  public setViewDistance(segmentsAhead: number, segmentsBehind: number): void {
    this.visibleSegments = Math.max(2, Math.min(8, segmentsAhead));
    this.maxSegments = Math.max(this.visibleSegments, segmentsBehind);
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    // Dispose all segments
    for (const segment of this.segments) {
      segment.dispose();
      this.scene.remove(segment.mesh);
    }
    this.segments = [];
    
    // Dispose water effects
    if (this.waterEffects) {
      this.waterEffects.dispose();
    }
    
    // Dispose instanced meshes
    this.instancedMeshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) mesh.material.dispose();
      this.scene.remove(mesh);
    });
    this.instancedMeshes.clear();
    
    // Dispose pebbles and shells
    this.pebbleInstancedMeshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) mesh.material.dispose();
    });
    this.pebbleInstancedMeshes.clear();
    
    this.shellInstancedMeshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) mesh.material.dispose();
    });
    this.shellInstancedMeshes.clear();
    
    this.scene.remove(this.pebblesGroup);
    while (this.pebblesGroup.children.length > 0) {
      this.pebblesGroup.remove(this.pebblesGroup.children[0]);
    }
    
    // Dispose decoration pool
    this.decorationPool.forEach(pool => {
      pool.forEach(decoration => {
        if (decoration instanceof THREE.Mesh) {
          if (decoration.geometry) decoration.geometry.dispose();
          if (decoration.material instanceof THREE.Material) decoration.material.dispose();
        }
      });
    });
    this.decorationPool.clear();
    
    // Dispose skybox
    if (this.skyboxMesh) {
      if (this.skyboxMesh.geometry) this.skyboxMesh.geometry.dispose();
      if (this.skyboxMesh.material instanceof THREE.Material) this.skyboxMesh.material.dispose();
      this.scene.remove(this.skyboxMesh);
    }
  }
}