import * as THREE from 'three';
import { ShaderManager } from '../../services/ShaderManager';
import { configSystem } from '../../core/ConfigurationSystem';
import { JellyfishConfig } from '../../config/gameConfig';
import { IObstacleAsset } from '../IObstacleAsset';
import { AssetHelpers } from '../AssetHelpers';

export class JellyfishAsset implements IObstacleAsset {
  public mesh!: THREE.Group;
  private collisionMesh!: THREE.Mesh;
  private bellMesh!: THREE.Mesh;
  private innerGlowMesh!: THREE.Mesh;
  private bellEdgeMesh!: THREE.Mesh;
  private tentacles: THREE.Mesh[] = [];
  
  // Animation state
  private animationTime: number = 0;
  private driftPhase: number = Math.random() * Math.PI * 2;
  private verticalBobPhase: number = Math.random() * Math.PI * 2;
  
  // Base height position (more consistent vertical position)
  private baseHeight: number = -0.2 + (Math.random() * 0.3);
  
  constructor(shaderManager?: ShaderManager) {
    // We accept shaderManager parameter for backward compatibility
    // but we don't use it in our implementation
  }

  /**
   * Creates the complete jellyfish with enhanced geometry and StandardMaterial
   * @returns The jellyfish mesh (THREE.Group)
   */
  public createMesh(): THREE.Group {
    try {
      // Initialize the top-level group that contains all parts
      this.mesh = new THREE.Group();
      this.mesh.name = "JellyfishObstacle_StdMat";
      
      // Get jellyfish config
      const config = this.config;
      const visualConf = config.visuals || {};
      const tentacleVisualConf = config.tentacleVisuals || visualConf;
      
      // Create the bell (main body)
      this.createBell(config.bodyRadius, visualConf);
      
      // Create the bell edge rim
      this.createBellEdges(config.bodyRadius, visualConf);
      
      // Create inner glow effect
      this.createInnerGlow(config.bodyRadius * 0.7, visualConf);
      
      // Create tentacles
      this.createTentacles(
        config.bodyRadius, 
        config.tentacleCount, 
        config.tentacleLength, 
        tentacleVisualConf
      );
      
      // Create collision mesh
      this.createCollisionMesh(config.bodyRadius, config.tentacleLength);
      
      // Set userData for identification
      this.mesh.userData = { 
        type: 'obstacle', 
        name: 'jellyfish',
        assetInstance: this,
        isDangerous: true
      };
      
      return this.mesh;
    } catch (error) {
      console.error("JellyfishAsset: Error creating mesh:", error);
      this.createMinimalFallback();
      return this.mesh;
    }
  }

  /**
   * Creates the main bell (dome) of the jellyfish with Pixar-style organic quality
   */
  private createBell(radius: number, visualConf: any): void {
    // Create a higher segment hemisphere for smoother Pixar-style curves
    const bellGeometry = new THREE.SphereGeometry(
      radius,      // Radius
      42,          // Width segments (increased for smoother Pixar curves)
      32,          // Height segments (increased for smoother Pixar curves)
      0,           // Phi start
      Math.PI * 2, // Phi length (full circle)
      0,           // Theta start (top)
      Math.PI * 0.75 // Theta length (3/4 of a sphere for bell shape)
    );
    
    // Apply Pixar-style organic deformations to the bell shape
    this.applyPixarStyleBellDeformation(bellGeometry, radius);
    
    // Update geometry after modifications
    bellGeometry.attributes.position.needsUpdate = true;
    bellGeometry.computeVertexNormals();
    
    // Use AssetHelpers to ensure proper bounding sphere computation
    AssetHelpers.computeCorrectBoundingSphere(bellGeometry);
    
    // Create enhanced Pixar-style bell material with improved properties
    const bellMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0xADD8E6),     // Light blue
      emissive: new THREE.Color(visualConf.emissiveColor || visualConf.mainColor || 0xADD8E6),
      emissiveIntensity: visualConf.emissiveIntensity || 0.5,       // Increased glow
      roughness: visualConf.roughness || 0.07,                      // Very smooth for wet look
      metalness: visualConf.metalness || 0.1,                       // Slight metalness for specular
      transparent: true,
      opacity: visualConf.opacity || 0.6,                           // Transparency
      transmission: visualConf.transmission || 0.8,                 // Increased translucency
      clearcoat: visualConf.clearcoat || 0.9,                       // High clearcoat for wet shine
      clearcoatRoughness: visualConf.clearcoatRoughness || 0.05,    // Very smooth clearcoat
      side: THREE.DoubleSide                                        // Render both sides
    });
    
    // Create mesh with Pixar-style positioning and rotation
    this.bellMesh = new THREE.Mesh(bellGeometry, bellMaterial);
    this.bellMesh.name = "JellyfishBell";
    
    // Pixar often uses subtle asymmetry and tilt to add character and weight
    // Apply a very slight tilt for more dynamic feel
    this.bellMesh.rotation.x = THREE.MathUtils.degToRad(2); // Slight tilt forward
    this.bellMesh.rotation.z = THREE.MathUtils.degToRad(Math.random() > 0.5 ? 1 : -1); // Random subtle tilt
    
    this.mesh.add(this.bellMesh);
  }
  
  /**
   * Applies Pixar-style organic deformations to the bell geometry
   * Creates a more appealing, less perfect shape with character
   */
  private applyPixarStyleBellDeformation(geometry: THREE.BufferGeometry, radius: number): void {
    const positions = geometry.attributes.position.array as Float32Array;
    
    // For Pixar-style look, we need:
    // 1. Organic, slightly asymmetric shape
    // 2. Appealing silhouette with proper volume distribution
    // 3. Subtle imperfections that add character
    // 4. Characteristic "squash and stretch" proportions
    
    // Generate a unique seed for this jellyfish to ensure consistent deformation
    const seed = Math.floor(Math.random() * 1000);
    
    for (let i = 0; i < positions.length; i += 3) {
      // Get vertex position
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // Skip any potential NaN values
      if (isNaN(x) || isNaN(y) || isNaN(z)) continue;
      
      // Calculate normalized height (0 at top, 1 at bottom)
      const normalizedHeight = 1 - (y + radius) / (2 * radius);
      
      // Calculate normalized position for radial effects
      const nx = x / radius;
      const nz = z / radius;
      const radialPosition = Math.sqrt(nx * nx + nz * nz);
      
      // 1. Apply Pixar-style volume - wider at bottom with characteristic bulge
      if (normalizedHeight > 0.5) {
        // More pronounced flare at bottom for Pixar's bottom-heavy look
        const flareAmount = Math.pow(normalizedHeight - 0.5, 1.5) * 0.35;
        positions[i] *= (1 + flareAmount);     // X - widen
        positions[i + 2] *= (1 + flareAmount); // Z - widen
      }
      
      // 2. Apply Pixar-style top dome - slightly more bulbous
      if (normalizedHeight < 0.3) {
        // Create subtle bulge at top for more appealing rounded shape
        const bulge = 0.03 * (1.0 - normalizedHeight / 0.3);
        const yOffset = bulge * radius;
        positions[i + 1] += yOffset;
      }
      
      // 3. Flatten the bell vertically for Pixar's characteristic squash
      positions[i + 1] *= 0.75;
      
      // 4. Add subtle asymmetry for Pixar-style character
      // Varies based on radial position and angle
      const angle = Math.atan2(nz, nx);
      const asymmetryFactor = (Math.sin(angle * 3 + seed) * 0.025 + 
                             Math.cos(angle * 2 + seed * 0.7) * 0.015);
      
      // More asymmetry toward the edge, less in the center
      const edgeAsymmetry = asymmetryFactor * Math.min(1.0, radialPosition * 1.5);
      
      positions[i] *= (1 + edgeAsymmetry);
      positions[i + 2] *= (1 + edgeAsymmetry);
      
      // 5. Add subtle organic ripples on surface
      if (normalizedHeight > 0.6 && normalizedHeight < 0.95) {
        // Add subtle ripples around the bottom edge
        const rippleIntensity = 0.025 * Math.pow(normalizedHeight - 0.6, 0.7);
        const rippleCount = 8; // Number of ripples around circumference
        const ripplePhase = angle * rippleCount + normalizedHeight * 4;
        const ripple = Math.sin(ripplePhase) * rippleIntensity * radius;
        
        // Apply ripple along normal direction (approximately)
        positions[i] += nx * ripple;
        positions[i + 2] += nz * ripple;
      }
      
      // 6. Add subtle variation in bell thickness
      if (radialPosition > 0.6 && normalizedHeight > 0.5) {
        // Create slight thickness variation toward bottom edge
        const thicknessVar = Math.sin(angle * 4 + normalizedHeight * 6 + seed) * 0.02 * radius;
        positions[i] += nx * thicknessVar;
        positions[i + 2] += nz * thicknessVar;
      }
    }
  }

  /**
   * Creates the edge rim of the bell with Pixar-style organic detail
   */
  private createBellEdges(radius: number, visualConf: any): void {
    // Create a more detailed torus for the bell edges with Pixar-style smoothness
    const edgeGeometry = new THREE.TorusGeometry(
      radius * 0.95, // Radius of the torus ring
      radius * 0.06, // Thickness of the torus
      24,           // Radial segments (increased for smoother Pixar curves)
      64            // Tubular segments (increased for smoother Pixar curves)
    );
    
    // Apply Pixar-style organic deformations to edge
    this.applyPixarStyleEdgeDeformation(edgeGeometry, radius);
    
    // Update geometry after modifications
    edgeGeometry.attributes.position.needsUpdate = true;
    edgeGeometry.computeVertexNormals();
    
    // Use AssetHelpers to ensure proper bounding sphere computation
    AssetHelpers.computeCorrectBoundingSphere(edgeGeometry);
    
    // Create enhanced Pixar-style edge material with improved properties
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0xADD8E6).multiplyScalar(0.85), // Slightly darker for definition
      emissive: new THREE.Color(visualConf.emissiveColor || visualConf.mainColor || 0xADD8E6).multiplyScalar(0.95),
      emissiveIntensity: (visualConf.emissiveIntensity || 0.5) * 0.9,             // Slightly less intense than bell
      roughness: Math.max(0.1, (visualConf.roughness || 0.07) * 1.3),             // Rougher texture for edge
      metalness: Math.max(0.05, (visualConf.metalness || 0.1) * 0.9),             // Less metallic than bell
      transparent: true,
      opacity: Math.min(0.85, (visualConf.opacity || 0.6) * 1.2),                 // More opaque for better edge definition
      transmission: Math.max(0.5, (visualConf.transmission || 0.8) * 0.8),        // Less transmission than bell
      clearcoat: Math.max(0.7, (visualConf.clearcoat || 0.9) * 0.85),             // Less clearcoat than bell
      clearcoatRoughness: Math.min(0.15, (visualConf.clearcoatRoughness || 0.05) * 2), // Rougher clearcoat
      side: THREE.DoubleSide
    });
    
    // Create mesh with Pixar-style positioning
    this.bellEdgeMesh = new THREE.Mesh(edgeGeometry, edgeMaterial);
    this.bellEdgeMesh.name = "JellyfishBellEdge";
    this.bellEdgeMesh.rotation.x = Math.PI / 2; // Orient horizontally
    
    // Pixar-style position is slightly lower to create subtle overlap with bell
    this.bellEdgeMesh.position.y = -radius * 0.47; // Slightly lower position for better visual integration
    
    // Apply very subtle tilt matching the bell tilt for consistency
    this.bellEdgeMesh.rotation.y = THREE.MathUtils.degToRad(Math.random() * 2 - 1); // Subtle random rotation
    
    this.mesh.add(this.bellEdgeMesh);
  }
  
  /**
   * Applies Pixar-style organic deformations to the bell edge geometry
   * Creates a more appealing, less perfect shape with subtle undulations
   */
  private applyPixarStyleEdgeDeformation(geometry: THREE.BufferGeometry, radius: number): void {
    const positions = geometry.attributes.position.array as Float32Array;
    
    // Generate a unique seed for this jellyfish to ensure consistent deformation
    const seed = Math.floor(Math.random() * 1000);
    
    // Parameters for Pixar-style edge waves
    const waveCount = Math.floor(8 + Math.random() * 4); // 8-12 waves around circumference
    const waveAmplitude = 0.03 * radius; // Size of waves
    const secondaryWaveCount = waveCount * 2; // Higher frequency secondary waves
    const secondaryWaveAmplitude = waveAmplitude * 0.3; // Smaller secondary waves
    
    // Calculate the average radius of the torus
    const torusRadius = radius * 0.95;
    const tubeRadius = radius * 0.06;
    
    for (let i = 0; i < positions.length; i += 3) {
      // Get vertex position
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // Skip any potential NaN values
      if (isNaN(x) || isNaN(y) || isNaN(z)) continue;
      
      // Calculate angle around torus (for circular waves)
      // This is an approximation assuming the torus is centered at origin and on XZ plane
      const angle = Math.atan2(z, x);
      
      // Calculate position on tube cross-section
      // For a torus with major radius R and tube radius r:
      // A point on torus surface is approximately at:  
      // distance from torus center line = r
      // distance from torus center = R
      const distFromCenter = Math.sqrt(x*x + z*z);
      
      // Determine approximate position on tube cross-section (0-1 around tube circumference)
      // This is an approximation - for exact calculation we would need the parametric coordinates
      const normalizedY = y / tubeRadius;
      
      // 1. Add Pixar-style wavy edge with varied amplitude
      // Primary waves - larger, more defined
      const wavePhase = angle * waveCount + seed;
      const waveEffect = Math.sin(wavePhase) * waveAmplitude;
      
      // Secondary waves - smaller, adds detail
      const secondaryWavePhase = angle * secondaryWaveCount + seed * 1.3;
      const secondaryWaveEffect = Math.sin(secondaryWavePhase) * secondaryWaveAmplitude;
      
      // Combined wave effect
      const combinedWave = waveEffect + secondaryWaveEffect;
      
      // 2. Apply wave primarily to outer edge of torus
      // Compute normalized radial position (0 at inner edge, 1 at outer edge)
      const radialPosition = Math.max(0, Math.min(1, (distFromCenter - (torusRadius - tubeRadius)) / (2 * tubeRadius)));
      
      // Apply more deformation to outer edge than inner edge (characteristic Pixar detail distribution)
      const radialFactor = Math.pow(radialPosition, 0.7); // More effect on outer edge
      
      // Scale wave effect based on position
      const scaledWave = combinedWave * radialFactor;
      
      // Apply wave effect in all directions slightly to create organic feel
      const direction = new THREE.Vector3(x, y, z).normalize();
      positions[i] += direction.x * scaledWave;
      positions[i + 1] += direction.y * scaledWave;
      positions[i + 2] += direction.z * scaledWave;
      
      // 3. Add subtle variation in thickness for Pixar-style organic quality
      // Varies tube thickness slightly around circumference
      const thicknessVariation = (Math.sin(angle * 5 + seed * 0.7) * 0.02 + 
                                Math.cos(angle * 7 + seed * 0.5) * 0.015) * tubeRadius;
      
      // Apply thickness variation along normal
      positions[i] += direction.x * thicknessVariation;
      positions[i + 1] += direction.y * thicknessVariation;
      positions[i + 2] += direction.z * thicknessVariation;
    }
  }

  /**
   * Creates a glowing inner part of the jellyfish with Pixar-style detail
   */
  private createInnerGlow(radius: number, visualConf: any): void {
    // Create an irregular sphere for the Pixar-style inner glow
    // Use more segments for smoother, higher quality appearance
    const glowGeometry = new THREE.SphereGeometry(
      radius,   // Base radius 
      32,       // Width segments (increased for smoother Pixar look)
      28        // Height segments (increased for smoother Pixar look)
    );
    
    // Apply Pixar-style organic deformations to inner glow
    this.applyPixarStyleInnerGlowDeformation(glowGeometry, radius);
    
    // Update geometry after modifications
    glowGeometry.attributes.position.needsUpdate = true;
    glowGeometry.computeVertexNormals();
    
    // Use AssetHelpers to ensure proper bounding sphere computation
    AssetHelpers.computeCorrectBoundingSphere(glowGeometry);
    
    // Create enhanced Pixar-style inner glow material with improved properties
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0xADD8E6).multiplyScalar(1.3),  // Much brighter
      emissive: new THREE.Color(visualConf.emissiveColor || visualConf.mainColor || 0xADD8E6).multiplyScalar(1.4),
      emissiveIntensity: (visualConf.emissiveIntensity || 0.5) * 1.8,                // Very intense glow
      roughness: Math.max(0.01, (visualConf.roughness || 0.07) * 0.5),               // Extremely smooth
      metalness: Math.max(0.01, (visualConf.metalness || 0.1) * 0.3),                // Very low metalness for diffuse glow
      transparent: true,
      opacity: (visualConf.opacity || 0.6) * 0.7,                                    // More transparent
      transmission: Math.min(0.95, (visualConf.transmission || 0.8) * 1.1),          // Higher transmission for glow
      clearcoat: Math.min(1.0, (visualConf.clearcoat || 0.9) * 1.05),                // Maximum clearcoat
      clearcoatRoughness: Math.max(0.01, (visualConf.clearcoatRoughness || 0.05) * 0.5), // Super smooth clearcoat
      side: THREE.FrontSide
    });
    
    // Create mesh with Pixar-style positioning
    this.innerGlowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.innerGlowMesh.name = "JellyfishInnerGlow";
    
    // Pixar-style positioning - slightly off-center for more organic feel and visual interest
    this.innerGlowMesh.position.y = -radius * 0.25; // Slightly lower in bell
    this.innerGlowMesh.position.x = radius * 0.02; // Subtle offset for asymmetry
    this.innerGlowMesh.position.z = -radius * 0.03; // Subtle depth offset
    
    // Scale slightly unevenly for more organic Pixar look
    this.innerGlowMesh.scale.set(0.95, 0.88, 0.92); // Slightly squashed, asymmetric scale
    
    this.mesh.add(this.innerGlowMesh);
  }
  
  /**
   * Applies Pixar-style organic deformations to the inner glow geometry
   * Creates a more appealing, bioorganic shape with subtle irregularities
   */
  private applyPixarStyleInnerGlowDeformation(geometry: THREE.BufferGeometry, radius: number): void {
    const positions = geometry.attributes.position.array as Float32Array;
    
    // Generate a unique seed for this jellyfish's inner glow
    const seed = Math.floor(Math.random() * 1000);
    
    // Parameters for Pixar-style organic shapes
    const blobCount = 3 + Math.floor(Math.random() * 3); // 3-5 organic "blobs"
    const blobAmplitude = 0.12 * radius; // Size of organic bulges
    
    // Generate random blob centers (characteristic Pixar asymmetry)
    const blobCenters = [];
    for (let i = 0; i < blobCount; i++) {
      // Distribute blobs on lower hemisphere (where they're most visible)
      const theta = Math.PI * (0.4 + Math.random() * 0.4); // 72° to 144° from top
      const phi = Math.random() * Math.PI * 2; // Any angle around
      
      // Convert spherical to cartesian coordinates
      const x = Math.sin(theta) * Math.cos(phi);
      const y = Math.cos(theta); // y is up
      const z = Math.sin(theta) * Math.sin(phi);
      
      // Normalize to unit sphere
      const normal = new THREE.Vector3(x, y, z).normalize();
      
      // Add blob center
      blobCenters.push({
        normal: normal,
        strength: 0.5 + Math.random() * 0.5 // Random strength for each blob
      });
    }
    
    for (let i = 0; i < positions.length; i += 3) {
      // Get vertex position
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // Skip any potential NaN values
      if (isNaN(x) || isNaN(y) || isNaN(z)) continue;
      
      // Convert to normalized direction from center
      const length = Math.sqrt(x*x + y*y + z*z);
      const nx = x / length;
      const ny = y / length;
      const nz = z / length;
      
      // 1. Add organic blob-like deformations based on proximity to blob centers
      let totalDeformation = 0;
      
      for (const blob of blobCenters) {
        // Calculate dot product to find proximity to this blob center
        const dotProduct = nx * blob.normal.x + ny * blob.normal.y + nz * blob.normal.z;
        
        // Convert dot product to distance (0 = far side of sphere, 1 = exact blob center)
        const proximity = (dotProduct + 1) / 2;
        
        // Apply deformation based on proximity with falloff
        // This creates a smooth bulge centered on the blob center
        const falloff = Math.pow(proximity, 2); // Quadratic falloff
        totalDeformation += falloff * blob.strength;
      }
      
      // 2. Scale deformation based on vertical position - more effect toward bottom
      // This creates more interesting shapes in the bottom part that's visible
      const verticalFactor = Math.max(0, (ny + 0.5) * 0.8); // More effect in lower half
      const scaledDeformation = totalDeformation * verticalFactor;
      
      // Apply deformation along normal direction
      const deformation = blobAmplitude * scaledDeformation;
      positions[i] += nx * deformation;
      positions[i + 1] += ny * deformation;
      positions[i + 2] += nz * deformation;
      
      // 3. Add subtle wavy patterns for Pixar-style organic detail
      const waveEffect = Math.sin(nx * 6 + ny * 8 + nz * 4 + seed) * 0.02 * radius;
      positions[i] += nx * waveEffect;
      positions[i + 1] += ny * waveEffect;
      positions[i + 2] += nz * waveEffect;
    }
  }

  /**
   * Creates tentacles with Pixar-style enhanced geometry and CPU-based animation
   */
  private createTentacles(
    bodyRadius: number, 
    count: number, 
    length: number, 
    visualConf: any
  ): void {
    // Clear previous tentacles if any
    this.tentacles = [];
    
    // Create enhanced Pixar-style tentacle material with improved properties
    const tentacleMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor || 0x88CCFF),          // Light blue tentacles
      emissive: new THREE.Color(visualConf.emissiveColor || visualConf.mainColor || 0x88CCFF).multiplyScalar(0.9),
      emissiveIntensity: visualConf.emissiveIntensity || 0.4,            // Moderate glow
      roughness: visualConf.roughness || 0.2,                            // Fairly smooth
      metalness: visualConf.metalness || 0.1,                            // Slight metalness for shine
      transparent: true,
      opacity: visualConf.opacity || 0.6,                                // Slightly more opaque than default
      transmission: visualConf.transmission || 0.6,                      // Moderate transmission
      clearcoat: visualConf.clearcoat || 0.7,                            // Good clearcoat for wet look
      clearcoatRoughness: visualConf.clearcoatRoughness || 0.1,          // Smooth clearcoat
      side: THREE.DoubleSide
    });
    
    // For Pixar-style tentacles, we want slightly uneven distribution and varied length/thickness
    // This adds character and makes the jellyfish feel more organic
    
    // Generate golden-ratio based angles for more natural distribution
    // This creates a more pleasing, less mechanical arrangement
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleOffset = Math.random() * Math.PI * 2; // Random starting angle
    
    // Add slight length variation to tentacles (Pixar's characteristic variation)
    const mainTentacleIndices = []; // Track which tentacles are primary/larger
    const tentacleCount = Math.max(count, 8); // Ensure at least 8 tentacles for good coverage
    
    // Create tentacles with Pixar-style distribution and variation
    for (let i = 0; i < tentacleCount; i++) {
      // Use golden ratio for more natural distribution
      // Each new angle is placed at the most inaccessible point relative to existing points
      const angle = angleOffset + i * (2 * Math.PI / goldenRatio);
      
      // Add very subtle variation to radius
      const radiusVar = bodyRadius * (0.78 + Math.random() * 0.04);
      const x = Math.cos(angle) * radiusVar;
      const z = Math.sin(angle) * radiusVar;
      
      // Vary tentacle length (Pixar often uses 3-5 primary elements with supporting elements)
      // This creates visual hierarchy and better composition
      const isMainTentacle = i % 3 === 0; // Every third tentacle is a primary one
      if (isMainTentacle) {
        mainTentacleIndices.push(i);
      }
      
      // Vary length based on whether it's a main tentacle
      const lengthVar = isMainTentacle ? 
        length * (1.0 + Math.random() * 0.15) : // Primary tentacles are longer
        length * (0.7 + Math.random() * 0.2);   // Secondary tentacles have more variation
      
      // Create a tentacle with Pixar-style sophistication
      this.createTentacle(
        i,
        new THREE.Vector3(x, -bodyRadius * 0.5, z),
        lengthVar,
        tentacleMaterial.clone(), // Clone material to allow individual animation effects
        isMainTentacle             // Flag for primary vs. secondary tentacle
      );
    }
    
    // Create a few additional thin, shorter tentacles for added detail and complexity
    // This is a classic Pixar technique - use varied scale elements to create richness
    const smallTentacleCount = Math.floor(count / 3); // Additional smaller tentacles
    
    for (let i = 0; i < smallTentacleCount; i++) {
      // Position these between the main tentacles for better distribution
      const angle = angleOffset + (i + 0.5) * (2 * Math.PI / smallTentacleCount);
      
      // Slightly more varied position
      const radiusVar = bodyRadius * (0.75 + Math.random() * 0.1);
      const x = Math.cos(angle) * radiusVar;
      const z = Math.sin(angle) * radiusVar;
      
      // Much shorter and thinner
      const smallLength = length * (0.4 + Math.random() * 0.2);
      
      // Create thin decorative tentacle
      this.createTentacle(
        tentacleCount + i,
        new THREE.Vector3(x, -bodyRadius * 0.52, z),
        smallLength,
        tentacleMaterial.clone(), // Clone material to allow individual animation effects
        false,                    // Not a main tentacle
        true                      // Is a thin tentacle
      );
    }
  }

  /**
   * Creates a single tentacle with Pixar-style sophisticated curves and volume
   */
  private createTentacle(
    index: number,
    startPosition: THREE.Vector3,
    length: number,
    material: THREE.Material,
    isMainTentacle: boolean = false,
    isThinTentacle: boolean = false
  ): void {
    // Pixar-style curves have several characteristics:
    // 1. They have a clear silhouette and appealing curves (lead the eye)
    // 2. They have "S" curves and natural-looking bends rather than straight lines
    // 3. They have varied thickness with purpose (thicker at important points)
    // 4. They have secondary curves and micro-detail
    
    // Create sophisticated path with Pixar-style curves
    const curvePoints = [];
    
    // Increase segment count for smoother curves in main tentacles
    const segments = isMainTentacle ? 24 : (isThinTentacle ? 12 : 16);
    
    // Create control points with clear structure and intention
    // We'll set up parameters that encourage pleasing "S" curves
    
    // Primary curve parameters - affects overall curve shape
    const curveAmplitude = length * (0.15 + Math.random() * 0.1); // 15-25% of length
    const curvePhase = Math.random() * Math.PI * 2; // Random starting phase
    
    // Thickness parameters
    const baseThickness = isThinTentacle ? 
                         0.02 * startPosition.length() : // Thin decorative tentacles
                         (isMainTentacle ? 
                          0.06 * startPosition.length() : // Main tentacles thicker
                          0.045 * startPosition.length() // Regular tentacles
                         );
    
    // Slightly thicker at attachment point and tip (Pixar often emphasizes ends)
    const topBulge = 1.1; // Slight bulge at top
    const tipThinning = 0.05; // Thin at tip (to 5% of base thickness)
    
    // Add some Pixar-style randomization while retaining clear structure
    // Use multiple harmonics for complexity while maintaining control
    const harmonics = [];
    
    // 2-4 harmonics for complex but controlled shape
    const harmonicCount = isMainTentacle ? 4 : (isThinTentacle ? 2 : 3);
    
    for (let h = 0; h < harmonicCount; h++) {
      harmonics.push({
        xAmp: (Math.random() * 0.15) * curveAmplitude * (h === 0 ? 1 : 0.5 / h),
        zAmp: (Math.random() * 0.15) * curveAmplitude * (h === 0 ? 1 : 0.5 / h),
        xFreq: 1 + h * 2 + Math.random(), // Increasing frequencies for harmonics
        zFreq: 1 + h * 2 + Math.random(), // Slightly different for x and z
        xPhase: Math.random() * Math.PI * 2,
        zPhase: Math.random() * Math.PI * 2
      });
    }
    
    // Pixar-style "lead-in" - tentacles curve out a bit before hanging down
    // This creates a more appealing connection to the bell
    const leadInCurve = isMainTentacle ? 0.12 : 0.08;  // Length of lead-in as fraction of total
    
    // Calculate normalized direction from center (for curve shaping)
    // Pre-compute this outside the loop as it's the same for all points
    const direction = new THREE.Vector3(startPosition.x, 0, startPosition.z).normalize();
    
    // Generate curve points with Pixar-style aesthetic principles
    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      
      // Pixar's signature "S" curve with natural hanging motion
      // Parametric curve calculation
      let segmentX = startPosition.x;
      let segmentY = startPosition.y;
      let segmentZ = startPosition.z;
      
      // Special lead-in section (first ~10% of tentacle)
      if (t < leadInCurve) {
        // Normalize t for lead-in section (0-1)
        const localT = t / leadInCurve;
        
        // Start with slight outward curve (subtle arc away from center)
        // This creates more appealing attachment to bell
        const curveOut = Math.sin(localT * Math.PI * 0.5) * length * 0.05;
        
        segmentX += direction.x * curveOut;
        segmentZ += direction.z * curveOut;
        
        // Y position has slight initial delay in descent (creates appealing curve)
        segmentY -= length * localT * localT * 0.8 * leadInCurve;
      } 
      // Main tentacle section
      else {
        // Normalize t for main section (0-1) after lead-in
        const localT = (t - leadInCurve) / (1 - leadInCurve);
        
        // Y position with slight acceleration (hanging under gravity)
        segmentY = startPosition.y - (length * leadInCurve * 0.8) - (length * (1 - leadInCurve) * localT);
        
        // Apply primary curve with clear Pixar "S" shape and purpose
        const mainCurve = Math.sin(localT * Math.PI * 1.3 + curvePhase);
        segmentX += mainCurve * curveAmplitude * direction.x;
        segmentZ += mainCurve * curveAmplitude * direction.z;
        
        // Apply secondary curves for complexity and detail (multiple harmonics)
        for (const harmonic of harmonics) {
          segmentX += Math.sin(localT * Math.PI * harmonic.xFreq + harmonic.xPhase) * harmonic.xAmp;
          segmentZ += Math.sin(localT * Math.PI * harmonic.zFreq + harmonic.zPhase) * harmonic.zAmp;
        }
        
        // Add subtle outward bias toward end (creates better silhouette)
        if (localT > 0.7) {
          const tipOutwardBias = Math.pow(localT - 0.7, 2) * length * 0.03;
          segmentX += direction.x * tipOutwardBias;
          segmentZ += direction.z * tipOutwardBias;
        }
      }
      
      curvePoints.push(new THREE.Vector3(segmentX, segmentY, segmentZ));
    }
    
    // Create a smooth curve with Pixar-style appeal
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    curve.tension = 0.7; // Higher tension for smoother curves
    
    // Create custom geometry function for Pixar-style tapering
    // Pixar shapes often have purpose-driven thickness variation
    function getPixarStyleRadius(t: number) {
      // Base thickness with pleasing taper
      let radius = baseThickness;
      
      // Top attachment point is slightly bulged
      if (t < 0.1) {
        // Subtle bulge at top (traditional Pixar edge emphasis)
        radius *= (topBulge - (topBulge - 1) * (t / 0.1));
      }
      
      // Main length has appealing taper
      // Not linear - Pixar often uses ease-in/ease-out curves
      radius *= (1 - Math.pow(t, 1.5) * (1 - tipThinning));
      
      // Add subtle thickness variation along length
      // This creates more organic quality, less "perfect" feel
      const variationAmplitude = 0.05; // 5% variation
      const variationFreq = 6; // 6 subtle bumps along length
      radius *= (1 + Math.sin(t * Math.PI * variationFreq) * variationAmplitude);
      
      return radius;
    }
    
    // Increased cross-sectional detail for smoother Pixar-style tentacles
    // More important for the larger, main tentacles
    const radiusSegments = isMainTentacle ? 12 : (isThinTentacle ? 6 : 8);
    
    // Create higher-quality tube geometry along the curve
    const tentacleGeometry = new THREE.TubeGeometry(
      curve,
      segments * 2, // Higher segment count for smoother animation
      getPixarStyleRadius(0), // Starting radius
      radiusSegments,
      false // not closed
    );
    
    // Apply Pixar-style organic deformations and details
    this.applyPixarStyleTentacleDeformation(
      tentacleGeometry, 
      length, 
      curve, 
      getPixarStyleRadius,
      isMainTentacle,
      isThinTentacle
    );
    
    // Update geometry after modifications
    tentacleGeometry.attributes.position.needsUpdate = true;
    tentacleGeometry.computeVertexNormals();
    
    // Create the tentacle mesh with Pixar-style material variations
    const tentacleMesh = new THREE.Mesh(tentacleGeometry, material);
    tentacleMesh.name = `JellyfishTentacle_${index}`;
    
    // Store additional properties needed for animation
    tentacleMesh.userData.isMainTentacle = isMainTentacle;
    tentacleMesh.userData.isThinTentacle = isThinTentacle;
    tentacleMesh.userData.localPhase = Math.random() * Math.PI * 2;
    
    // Store for animation
    this.tentacles.push(tentacleMesh);
    this.mesh.add(tentacleMesh);
  }
  
  /**
   * Applies Pixar-style organic deformations to tentacle geometry
   * Creates micro-detail, texture, and cross-sectional interest
   */
  private applyPixarStyleTentacleDeformation(
    geometry: THREE.BufferGeometry, 
    length: number, 
    curve: THREE.CatmullRomCurve3,
    radiusFunction: (t: number) => number,
    isMainTentacle: boolean,
    isThinTentacle: boolean
  ): void {
    // Get position attribute for modification
    const positions = geometry.attributes.position.array as Float32Array;
    const vertexCount = positions.length / 3;
    
    // We need to determine the t-value (0-1 along curve) for each vertex ring
    // This is approximate since TubeGeometry doesn't directly expose this
    if (!geometry.userData.tValues) {
      geometry.userData.tValues = new Float32Array(vertexCount);
    }
    
    // Save original positions for animation
    if (!geometry.userData.originalPositions) {
      geometry.userData.originalPositions = new Float32Array(positions.length);
    }
    
    // Pixar-style parameters for organic micro-detail
    const detailScale = isMainTentacle ? 0.04 : (isThinTentacle ? 0.015 : 0.025);
    const detailFrequency = isMainTentacle ? 16 : (isThinTentacle ? 8 : 12);
    const twistAmount = isMainTentacle ? 0.8 : (isThinTentacle ? 0.4 : 0.6);
    const seed = Math.floor(Math.random() * 1000); // Consistent randomization
    
    // Process each vertex to find its position along the curve
    for (let i = 0; i < vertexCount; i++) {
      const idx = i * 3;
      
      // Get vertex position
      const x = positions[idx];
      const y = positions[idx + 1];
      const z = positions[idx + 2];
      const point = new THREE.Vector3(x, y, z);
      
      // Better t-value calculation with adaptive precision
      // Find closest point on curve to determine t value (normalized position along tentacle)
      let closestT = 0;
      let minDist = Infinity;
      
      // Start with coarse sampling of the curve
      for (let t = 0; t <= 1; t += 0.1) {
        const curvePoint = curve.getPointAt(t);
        const dist = point.distanceTo(curvePoint);
        if (dist < minDist) {
          minDist = dist;
          closestT = t;
        }
      }
      
      // Refine with finer sampling around the closest point
      const tMin = Math.max(0, closestT - 0.1);
      const tMax = Math.min(1, closestT + 0.1);
      for (let t = tMin; t <= tMax; t += 0.01) {
        const curvePoint = curve.getPointAt(t);
        const dist = point.distanceTo(curvePoint);
        if (dist < minDist) {
          minDist = dist;
          closestT = t;
        }
      }
      
      // Store t-value in the geometry's userData for animation
      geometry.userData.tValues[i] = closestT;
      
      // Store original position for animation
      geometry.userData.originalPositions[idx] = positions[idx];
      geometry.userData.originalPositions[idx + 1] = positions[idx + 1];
      geometry.userData.originalPositions[idx + 2] = positions[idx + 2];
      
      // Calculate the closest point on the curve and the normal vector from it
      const curvePoint = curve.getPointAt(closestT);
      const curveNormal = new THREE.Vector3(x - curvePoint.x, y - curvePoint.y, z - curvePoint.z).normalize();
      
      // For cross-section distortion, we need the angle around the tube
      const angleAroundTube = Math.atan2(curveNormal.z, curveNormal.x);
      
      // Apply Pixar-style micro-detail
      // This adds organic surface imperfections that catch light in interesting ways
      
      // 1. Calculate base radius at this t-value
      const baseRadius = radiusFunction(closestT);
      
      // 2. Apply subtle surface perturbations with higher frequency details
      // Pixar style often has primary, secondary, and tertiary detail scales
      
      // Primary detail - larger scale bumps
      const primaryDetail = Math.sin(angleAroundTube * 2 + closestT * 8 + seed) * 
                           detailScale * baseRadius * 0.7;
      
      // Secondary detail - medium scale texture
      const secondaryDetail = Math.sin(angleAroundTube * 4 + closestT * detailFrequency + seed * 1.5) * 
                             detailScale * baseRadius * 0.4;
      
      // Tertiary detail - fine noise-like texture
      const tertiaryDetail = Math.sin(angleAroundTube * 8 + closestT * detailFrequency * 2 + seed * 2.7) * 
                            detailScale * baseRadius * 0.2;
      
      // Combine details with distance-based falloff (more detail near attachment point)
      const detailFalloff = Math.max(0, 1 - closestT * 0.7); // Less detail toward tip
      const combinedDetail = (primaryDetail + secondaryDetail + tertiaryDetail) * detailFalloff;
      
      // 3. Apply Pixar-style cross-sectional deformation
      // Instead of perfect circles, create slightly oval or irregular shapes
      // Only apply on thicker main tentacles where it's noticeable
      let crossSectionDeform = 0;
      if (isMainTentacle) {
        // Create slight oval effect that varies along the length
        const ovalEffect = Math.cos(angleAroundTube * 2) * 0.15 * Math.sin(closestT * Math.PI * 1.5);
        crossSectionDeform = ovalEffect * baseRadius;
      }
      
      // 4. Apply subtle twisting along the tentacle length
      const twistPhase = closestT * Math.PI * twistAmount * 2;
      const twistEffect = 0.05 * baseRadius * Math.sin(angleAroundTube + twistPhase);
      
      // Apply all deformations along the normal vector
      const totalDeformation = combinedDetail + crossSectionDeform + twistEffect;
      positions[idx] += curveNormal.x * totalDeformation;
      positions[idx + 1] += curveNormal.y * totalDeformation;
      positions[idx + 2] += curveNormal.z * totalDeformation;
    }
  }

  /**
   * Creates a more accurate collision mesh system for the jellyfish
   * Uses multiple collision objects for better gameplay feel
   */
  private createCollisionMesh(bodyRadius: number, tentacleLength: number): void {
    // For Pixar-style gameplay feel, we want the collision detection to match
    // the visual appearance closely while balancing gameplay fun
    
    // 1. Create primary collision mesh for the bell (body)
    // Using an ellipsoid shape for the bell better matches the flattened bell shape
    const bellCollisionGeometry = new THREE.SphereGeometry(bodyRadius * 1.1, 12, 8);
    
    // Scale to create ellipsoid that better matches the bell shape
    // This creates better collision feel that matches the visuals
    for (let i = 0; i < bellCollisionGeometry.attributes.position.count; i++) {
      const y = bellCollisionGeometry.attributes.position.getY(i);
      // Flatten the collision sphere to match the bell's shape
      bellCollisionGeometry.attributes.position.setY(i, y * 0.75);
    }
    
    bellCollisionGeometry.attributes.position.needsUpdate = true;
    bellCollisionGeometry.computeVertexNormals();
    
    // Use AssetHelpers to ensure proper bounding sphere computation
    AssetHelpers.computeCorrectBoundingSphere(bellCollisionGeometry);
    
    const collisionMaterial = new THREE.MeshBasicMaterial({ 
      visible: false, // Invisible collision mesh
      transparent: true,
      opacity: 0
    });
    
    this.collisionMesh = new THREE.Mesh(bellCollisionGeometry, collisionMaterial);
    this.collisionMesh.name = "JellyfishBellCollider";
    this.mesh.add(this.collisionMesh);
    
    // 2. Create an additional cylinder-like collision mesh for the tentacle area
    // This provides a better gameplay feel for the dangerous tentacle zone
    const tentacleCollisionRadius = bodyRadius * 0.9; // Slightly smaller than bell
    const tentacleCollisionHeight = tentacleLength * 0.7; // Cover part of tentacle length
    
    // Use a cylinder shape for tentacle area collision
    const tentacleCollisionGeometry = new THREE.CylinderGeometry(
      tentacleCollisionRadius, // Top radius
      tentacleCollisionRadius * 0.7, // Bottom radius (tapered)
      tentacleCollisionHeight, // Height
      12, // radialSegments
      2,  // heightSegments
      false // open-ended
    );
    
    const tentacleCollisionMaterial = collisionMaterial.clone();
    const tentacleCollisionMesh = new THREE.Mesh(
      tentacleCollisionGeometry, 
      tentacleCollisionMaterial
    );
    tentacleCollisionMesh.name = "JellyfishTentacleCollider";
    
    // Position below the bell to cover tentacle area
    tentacleCollisionMesh.position.y = -(bodyRadius * 0.5 + tentacleCollisionHeight * 0.5);
    
    // Add to main mesh and store reference in userData for optional use in collision system
    this.mesh.add(tentacleCollisionMesh);
    this.mesh.userData.tentacleCollider = tentacleCollisionMesh;
    
    // Store separate collision components for fine-grained collision detection in gameplay
    // The CollisionDetectionSystem can use these for more sophisticated collision behavior
    this.mesh.userData.bellCollider = this.collisionMesh;
    this.mesh.userData.fullCollisionRadius = bodyRadius + tentacleLength * 0.6; // For broad-phase detection
  }

  /**
   * Creates a minimal fallback jellyfish model in case of errors
   * Maintains compatibility with the enhanced collision system
   */
  private createMinimalFallback(): void {
    console.warn("JellyfishAsset: Creating minimal fallback model");
    
    // Create a simple group
    this.mesh = new THREE.Group();
    this.mesh.name = "JellyfishFallback";
    
    // Create simple body (hemisphere)
    const bodyGeometry = new THREE.SphereGeometry(0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x88CCFF,               // Light blue
      emissive: 0x88CCFF,            // Self-illuminating
      emissiveIntensity: 0.5,        // Increased glow
      roughness: 0.07,               // Very smooth for wet look
      metalness: 0.1,                // Slight metalness
      transparent: true,
      opacity: 0.6,                  // Translucent
      transmission: 0.8,             // Light transmission
      clearcoat: 0.9,                // High clearcoat for wet shine
      clearcoatRoughness: 0.05       // Very smooth coating
    });
    
    this.bellMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.bellMesh.scale.y = 0.8; // Flatten slightly
    this.mesh.add(this.bellMesh);
    
    // Create simple tentacles (just cylinders)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x = Math.cos(angle) * 0.3;
      const z = Math.sin(angle) * 0.3;
      
      const tentacleGeometry = new THREE.CylinderGeometry(0.03, 0.01, 0.8, 4);
      const tentacleMaterial = new THREE.MeshStandardMaterial({
        color: 0x77AADD,               // Slightly darker blue
        emissive: 0x77AADD,            // Self-illuminating
        emissiveIntensity: 0.4,        // Good glow
        roughness: 0.2,                // Fairly smooth
        metalness: 0.1,                // Slight metalness
        transparent: true,
        opacity: 0.6,                  // Translucent
        transmission: 0.6,             // Moderate transmission
        clearcoat: 0.7,                // Good clearcoat
        clearcoatRoughness: 0.1        // Smooth coating
      });
      
      const tentacle = new THREE.Mesh(tentacleGeometry, tentacleMaterial);
      tentacle.position.set(x, -0.5, z);
      tentacle.rotation.x = Math.PI / 2; // Orient downward
      
      // Store additional properties needed for animation compatibility
      tentacle.userData.isMainTentacle = i % 2 === 0; // Every other tentacle is a main one
      tentacle.userData.isThinTentacle = false;
      tentacle.userData.localPhase = Math.random() * Math.PI * 2;
      
      this.tentacles.push(tentacle);
      this.mesh.add(tentacle);
    }
    
    // Create simple bell collision mesh
    const bellCollisionGeometry = new THREE.SphereGeometry(0.45, 8, 6);
    const collisionMaterial = new THREE.MeshBasicMaterial({ visible: false });
    
    this.collisionMesh = new THREE.Mesh(bellCollisionGeometry, collisionMaterial);
    this.collisionMesh.name = "JellyfishBellCollider";
    this.mesh.add(this.collisionMesh);
    
    // Create simple tentacle collision mesh (cylinder)
    const tentacleCollisionGeometry = new THREE.CylinderGeometry(0.4, 0.3, 0.6, 8, 1);
    const tentacleCollisionMesh = new THREE.Mesh(tentacleCollisionGeometry, collisionMaterial.clone());
    tentacleCollisionMesh.name = "JellyfishTentacleCollider";
    tentacleCollisionMesh.position.y = -0.6;
    this.mesh.add(tentacleCollisionMesh);
    
    // Set userData for identification and collision system compatibility
    this.mesh.userData = { 
      type: 'obstacle', 
      name: 'jellyfish',
      assetInstance: this,
      isDangerous: true,
      bellCollider: this.collisionMesh,
      tentacleCollider: tentacleCollisionMesh,
      fullCollisionRadius: 0.8
    };
  }

  /**
   * Updates the jellyfish animation
   */
  public updateAnimation(deltaTime: number): void {
    this.animationTime += deltaTime;
    const config = this.config;
    
    // Skip if no mesh
    if (!this.mesh) return;
    
    // Get animation parameters from config
    const visualConf = config.visuals || {};
    const animSpeed = visualConf.animationSpeed !== undefined ? visualConf.animationSpeed : 0.6; // Slightly faster animation for more liveliness
    
    // Update drift phases
    this.driftPhase += deltaTime * config.driftSpeed;
    this.verticalBobPhase += deltaTime * config.verticalBobSpeed;
    
    // Apply horizontal drifting motion
    const horizontalOffset = Math.sin(this.driftPhase) * config.driftAmplitude;
    this.mesh.position.x += horizontalOffset * deltaTime;
    
    // Apply vertical bobbing motion with limited range
    // Use a smaller amplitude for more consistent heights
    const limitedAmplitude = config.verticalBobAmplitude * 0.5;
    const verticalOffset = Math.sin(this.verticalBobPhase) * limitedAmplitude;
    
    // Ensure height stays centered around baseHeight
    // Apply small incremental changes rather than setting position directly
    const targetY = this.baseHeight + verticalOffset * 0.2;
    const currentY = this.mesh.position.y;
    this.mesh.position.y = THREE.MathUtils.lerp(currentY, targetY, deltaTime * 2);
    
    // Bell pulsing animation (subtle scale and emissive changes)
    if (this.bellMesh && this.bellMesh.material instanceof THREE.MeshStandardMaterial) {
      // Bell pulsing through scale
      const pulseFactor = 0.95 + Math.sin(this.animationTime * animSpeed * 1.2) * 0.05;
      this.bellMesh.scale.set(pulseFactor, pulseFactor * 0.8, pulseFactor);
      
      // Bell pulsing through emissive intensity
      this.bellMesh.material.emissiveIntensity = 
        (visualConf.emissiveIntensity || 0.4) * 
        (0.85 + Math.sin(this.animationTime * animSpeed * 1.5) * 0.15);
    }
    
    // Enhanced inner glow animation with more dramatic pulsing
    if (this.innerGlowMesh && this.innerGlowMesh.material instanceof THREE.MeshStandardMaterial) {
      // Offset phase from bell for more organic look
      const innerGlowPhase = this.animationTime * animSpeed * 1.7 + Math.PI / 3;
      
      // More pronounced pulsing scale
      const glowFactor = 0.85 + Math.sin(innerGlowPhase) * 0.15;
      this.innerGlowMesh.scale.set(glowFactor, glowFactor, glowFactor);
      
      // More dramatic emissive pulsing
      this.innerGlowMesh.material.emissiveIntensity = 
        (visualConf.emissiveIntensity || 0.5) * 1.8 * 
        (0.75 + Math.sin(innerGlowPhase) * 0.25);
      
      // Add color shift for more dramatic visuals (slight color temperature shift)
      const baseEmissive = new THREE.Color(visualConf.emissiveColor || visualConf.mainColor || 0xADD8E6);
      const warmShift = new THREE.Color(0x0055FF); // More blue when contracted
      const coolShift = new THREE.Color(0x00FFFF); // More cyan when expanded
      
      // Interpolate between warm and cool based on pulse
      const colorShift = Math.sin(innerGlowPhase) * 0.5 + 0.5; // 0-1 value
      const emissiveColor = new THREE.Color().copy(baseEmissive);
      
      // Apply subtle color temperature shift
      emissiveColor.lerp(colorShift > 0.5 ? coolShift : warmShift, 0.2);
      this.innerGlowMesh.material.emissive = emissiveColor;
    }
    
    // Bell edge (rim) animation
    if (this.bellEdgeMesh) {
      // Subtle vertical bobbing relative to the bell
      this.bellEdgeMesh.position.y = 
        -config.bodyRadius * 0.45 + 
        Math.sin(this.animationTime * animSpeed * 0.8) * 0.02;
    }
    
    // Animate each tentacle
    this.animateTentacles(deltaTime, config.tentacleSway, animSpeed);
  }

  /**
   * Animates the tentacles with enhanced Pixar-style CPU-based animation
   */
  private animateTentacles(deltaTime: number, swayFactor: number, animSpeed: number): void {
    // Pixar animation principles to apply:
    // 1. Arcs - movement follows arcs rather than straight lines
    // 2. Secondary action - main movement triggers secondary effects
    // 3. Follow-through - tips continue moving after the base stops
    // 4. Overlapping action - different parts move at different rates
    // 5. Squash and stretch - volume preservation during deformation
    
    for (let i = 0; i < this.tentacles.length; i++) {
      const tentacle = this.tentacles[i];
      const geometry = tentacle.geometry as THREE.BufferGeometry;
      
      // Get tentacle classification for animation tuning
      const isMainTentacle = tentacle.userData.isMainTentacle || false;
      const isThinTentacle = tentacle.userData.isThinTentacle || false;
      
      // Phase offset for each tentacle to create Pixar-style varied movement
      // Use stored local phase for consistent variation between frames
      const phaseOffset = tentacle.userData.localPhase || (i * (Math.PI / this.tentacles.length));
      
      // Adjust animation parameters based on tentacle type for characterful movement
      // Main tentacles move more slowly but with larger arcs (confident, purposeful)
      // Thin tentacles move more quickly with smaller arcs (energetic, nervous)
      const tentacleAnimSpeed = isMainTentacle ? 
                             animSpeed * 0.85 : // Slower, more dramatic for main tentacles
                             (isThinTentacle ? 
                              animSpeed * 1.4 : // Faster for thin tentacles
                              animSpeed); // Normal speed for regular tentacles
      
      // Adjust sway factor for different tentacle types
      const tentacleSwayFactor = isMainTentacle ? 
                              swayFactor * 1.2 : // More sway for main tentacles
                              (isThinTentacle ? 
                               swayFactor * 0.8 : // Less sway for thin tentacles
                               swayFactor); // Normal sway for regular tentacles
      
      if (geometry.userData.originalPositions && geometry.userData.tValues) {
        // Advanced vertex-based animation for tube geometry tentacles
        const positions = geometry.attributes.position.array as Float32Array;
        const origPositions = geometry.userData.originalPositions as Float32Array;
        const tValues = geometry.userData.tValues as Float32Array;
        
        // Apply Pixar-style motion with organic wave propagation
        // Wave motion should feel like it's propagating through the tentacle
        for (let v = 0; v < positions.length / 3; v++) {
          const idx = v * 3;
          
          // Get original position
          const originalX = origPositions[idx];
          const originalY = origPositions[idx + 1];
          const originalZ = origPositions[idx + 2];
          
          // Get t value (position along tentacle 0-1)
          const t = tValues[v];
          
          // Calculate the effect strength using Pixar-style principles:
          // 1. Follow-through: More movement at tips than at base
          // 2. Ease-in/out: Smooth transition of effect using exponential curve
          // 3. Overlapping action: Different phases based on position
          
          // Base effect increases toward tip (characteristic follow-through)
          let effectStrength = Math.pow(t, 1.8) * tentacleSwayFactor;
          
          // Apply constraint at the very base for stable connection point
          if (t < 0.1) {
            // Ease-in effect at base (constrained at attachment point)
            effectStrength *= Math.pow(t / 0.1, 2.5); // More dramatic constraint
          }
          
          // Pixar-style animation emphasizes arcs and has layered motion
          // Primary wave with time delay based on position (wave propagation)
          const timeDelay = t * 0.8; // Wave travels down the tentacle
          const wavePhaseX = (this.animationTime - timeDelay) * tentacleAnimSpeed * 3 + phaseOffset;
          const wavePhaseZ = (this.animationTime - timeDelay) * tentacleAnimSpeed * 2.5 + phaseOffset + Math.PI / 4;
          
          // Primary wave motion - large sweeping arcs
          const waveX = Math.sin(wavePhaseX + t * 8) * effectStrength * 0.25;
          const waveZ = Math.cos(wavePhaseZ + t * 6) * effectStrength * 0.25;
          
          // Secondary wave motion (faster, smaller) - adds complexity and life
          const secondaryWaveX = Math.sin(wavePhaseX * 2.3 + t * 12) * effectStrength * 0.08;
          const secondaryWaveZ = Math.cos(wavePhaseZ * 2.1 + t * 10) * effectStrength * 0.08;
          
          // Tertiary micro-movement (subtle, rapid) - creates organic quality
          const microWaveX = Math.sin(wavePhaseX * 4.7 + t * 20) * effectStrength * 0.03;
          const microWaveZ = Math.cos(wavePhaseZ * 5.1 + t * 18) * effectStrength * 0.03;
          
          // Combine all wave components with Pixar-style emphasis on primary motion
          const totalWaveX = waveX + secondaryWaveX + microWaveX;
          const totalWaveZ = waveZ + secondaryWaveZ + microWaveZ;
          
          // Apply subtle Y-axis variation for 3D movement rather than flat plane
          // Pixar animation principle: movements are rarely on a single flat plane
          const yVariation = Math.sin(wavePhaseX * 0.7 + wavePhaseZ * 0.5) * effectStrength * 0.05;
          
          // Apply waves to position
          positions[idx] = originalX + totalWaveX;
          positions[idx + 1] = originalY + yVariation; // Subtle Y variation
          positions[idx + 2] = originalZ + totalWaveZ;
          
          // Apply Pixar squash and stretch principle - volume preservation during movement
          // This is subtle but important for organic feeling animation
          if (t > 0.5) { // Only apply to the more flexible portion
            // Calculate stretch factor based on distance from original position
            const stretch = Math.sqrt(
              totalWaveX * totalWaveX + 
              totalWaveZ * totalWaveZ
            ) * 0.5;
            
            // Find the direction to the curve center for squash/stretch orientation
            const pointOnCurve = new THREE.Vector3(
              originalX - totalWaveX,
              originalY,
              originalZ - totalWaveZ
            ).normalize();
            
            // Apply subtle compression perpendicular to the stretching direction
            // This preserves volume in an appealing way
            positions[idx] -= pointOnCurve.x * stretch * 0.02;
            positions[idx + 2] -= pointOnCurve.z * stretch * 0.02;
          }
        }
        
        // Update the geometry
        geometry.attributes.position.needsUpdate = true;
      } else {
        // Fallback animation for simple tentacles (uses rotation)
        // Use Pixar principles even in the simplified animation
        const uniquePhase = this.animationTime * tentacleAnimSpeed * 2 + phaseOffset;
        
        // More complex swaying motion with multiple frequencies
        const primarySway = Math.sin(uniquePhase) * 0.25 * tentacleSwayFactor;
        const secondarySway = Math.sin(uniquePhase * 2.3) * 0.08 * tentacleSwayFactor;
        
        // Apply multi-layered animation for more Pixar-like organic motion
        tentacle.rotation.x = primarySway + secondarySway;
        tentacle.rotation.z = Math.cos(uniquePhase * 0.7) * 0.2 * tentacleSwayFactor + 
                            Math.cos(uniquePhase * 1.6) * 0.07 * tentacleSwayFactor;
      }
      
      // Apply Pixar-style material effects for enhanced visual interest
      if (tentacle.material instanceof THREE.MeshStandardMaterial) {
        const baseIntensity = tentacle.material.userData.baseEmissiveIntensity;
        
        // Store original emissive intensity if not already saved
        if (baseIntensity === undefined) {
          tentacle.material.userData.baseEmissiveIntensity = tentacle.material.emissiveIntensity;
        }
        
        // Use multiple sine waves for Pixar-style complex pulsing
        // This creates more interesting visual rhythm than simple pulsing
        const savedBaseIntensity = tentacle.material.userData.baseEmissiveIntensity || 0.3;
        const pulsePhase = this.animationTime * tentacleAnimSpeed * 1.3 + phaseOffset;
        
        // Primary pulse
        const primaryPulse = Math.sin(pulsePhase) * 0.15;
        // Secondary subtle pulse at different frequency
        const secondaryPulse = Math.sin(pulsePhase * 2.7) * 0.05;
        
        // Combine pulses for more organic effect
        tentacle.material.emissiveIntensity = 
          savedBaseIntensity * (0.85 + primaryPulse + secondaryPulse);
      }
    }
  }

  /**
   * Constrains jellyfish position within boundaries
   */
  public constrainPosition(laneWidth: number, xBoundary: number): void {
    // Skip if no mesh
    if (!this.mesh) return;
    
    const config = this.config;
    
    // Check if jellyfish is drifting too far and reverse direction if needed
    if (Math.abs(this.mesh.position.x) > xBoundary - config.bodyRadius) {
      // Adjust position to be within bounds
      const sign = Math.sign(this.mesh.position.x);
      this.mesh.position.x = (xBoundary - config.bodyRadius) * sign;
      
      // Reset drift phase to move in opposite direction
      this.driftPhase = Math.sign(this.mesh.position.x) * Math.PI/2;
    }
  }

  /**
   * Returns the jellyfish mesh group
   * Creates the mesh if it doesn't exist yet
   */
  public getMesh(): THREE.Group {
    if (!this.mesh) {
      this.createMesh();
    }
    return this.mesh;
  }
  
  /**
   * Returns the main collision object for the jellyfish
   */
  public getCollisionObject(): THREE.Mesh {
    return this.collisionMesh;
  }
  
  /**
   * Returns the main bell collision object for the jellyfish
   * Required by CollisionDetectionSystem for jellyfish-specific collision
   * Enhanced for Pixar-style gameplay feel with more accurate collision
   */
  public getBellCollisionObject(): THREE.Mesh {
    // Return the dedicated collision mesh for the bell if available
    // Otherwise fallback to the visual bell mesh
    if (this.mesh && this.mesh.userData.bellCollider) {
      return this.mesh.userData.bellCollider;
    }
    return this.bellMesh || this.collisionMesh;
  }
  
  /**
   * Returns the tentacle collision objects for this asset
   * Required by CollisionDetectionSystem for jellyfish-specific collision
   * Enhanced for Pixar-style gameplay feel with accurate tentacle collision
   */
  public getTentacleCollisionObjects(): THREE.Mesh[] {
    // If we have a dedicated tentacle collision mesh, provide it for better gameplay
    // This enables more precise tentacle collision without having to check every tentacle
    if (this.mesh && this.mesh.userData.tentacleCollider) {
      return [this.mesh.userData.tentacleCollider, ...this.tentacles.slice(0, 4)];
    }
    
    // Return the individual tentacle meshes for collision
    // Note: For performance, we could consider returning only the main tentacles
    // if there are a large number of them
    return this.tentacles;
  }
  
  /**
   * Determines if the jellyfish is dangerous to the player
   */
  public isDangerous(): boolean {
    return true;
  }
  
  /**
   * Resets the jellyfish animation state
   */
  public reset(): void {
    this.animationTime = 0;
    this.driftPhase = Math.random() * Math.PI * 2;
    this.verticalBobPhase = Math.random() * Math.PI * 2;
    
    // Reset position to base height for consistency
    if (this.mesh) {
      // Keep x and z positions, but reset y to the base height
      this.mesh.position.y = this.baseHeight;
    }
  }
  
  /**
   * Disposes of all resources used by this asset
   */
  public dispose(): void {
    // Clean up geometries and materials
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
    });
    
    // Clear references
    this.tentacles = [];
  }
  
  /**
   * Get jellyfish configuration with defaults as a fallback
   */
  public get config(): JellyfishConfig {
    // Provide default values in case config is not available
    const defaultConfig: JellyfishConfig = {
      bodyRadius: 0.4,
      tentacleCount: 8,
      tentacleLength: 1.2,
      tentacleSway: 0.7,
      driftSpeed: 0.8,
      driftAmplitude: 0.5,
      verticalBobAmplitude: 0.2,
      verticalBobSpeed: 0.6,
      visuals: {
        mainColor: 0xADD8E6,            // Light blue
        emissiveColor: 0xADD8E6,        // Self-illuminating
        emissiveIntensity: 0.5,         // Increased glow
        roughness: 0.07,                // Very smooth for wet look
        metalness: 0.1,                 // Slight metallic sheen
        opacity: 0.6,                   // Translucent
        transmission: 0.8,              // High light transmission
        clearcoat: 0.9,                 // High clearcoat for wet shine
        clearcoatRoughness: 0.05,       // Very smooth coating
        animationSpeed: 0.6             // Slightly faster animation
      },
      tentacleVisuals: {
        mainColor: 0x88CCFF,            // Slightly different blue for tentacles
        emissiveColor: 0x88CCFF,        // Self-illuminating
        emissiveIntensity: 0.4,         // Good glow
        roughness: 0.2,                 // Fairly smooth
        metalness: 0.1,                 // Slight metallic sheen
        opacity: 0.6,                   // Translucent
        transmission: 0.6,              // Moderate transmission
        clearcoat: 0.7,                 // Good clearcoat
        clearcoatRoughness: 0.1,        // Smooth coating 
        animationSpeed: 0.8             // Fast tentacle animation
      }
    };

    try {
      return configSystem.getObstaclesConfig().jellyfish || defaultConfig;
    } catch (error) {
      console.warn("JellyfishAsset: Could not get jellyfish config, using defaults", error);
      return defaultConfig;
    }
  }
}