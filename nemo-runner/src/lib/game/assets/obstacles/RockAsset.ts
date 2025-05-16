import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { RockConfig } from '../../config/gameConfig';

export class RockAsset {
  public config: Readonly<RockConfig>;
  public mesh!: THREE.Mesh; // Rocks are typically single meshes
  private collisionShape!: THREE.Mesh; // Separate, simpler collider

  constructor() {
    this.config = configSystem.getObstaclesConfig().rock;
    this.createMesh();
  }

  private createMesh(): void {
    const visualConf = this.config.visuals;

    // --- Geometry: More organic rock ---
    // Start with an Icosahedron for a more irregular base than a Box
    // Scale down the base radius to prevent hitting characters in adjacent lanes
    const baseRadius = THREE.MathUtils.randFloat(0.4, 0.7) * this.config.baseScale; // Reduced size range
    const detail = 2; // More detail for displacement (e.g., 2-3)
    let rockGeom = new THREE.IcosahedronGeometry(baseRadius, detail);

    // Displace vertices for a craggy look
    const positions = rockGeom.attributes.position;
    const vertex = new THREE.Vector3();
    const noiseAmplitude = 0.15 * baseRadius; // Reduced displacement for more compact shape

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      // Simple directional displacement
      const displacement = new THREE.Vector3(
        (Math.random() - 0.5) * noiseAmplitude,
        (Math.random() - 0.5) * noiseAmplitude * 0.5, // Less Y displacement
        (Math.random() - 0.5) * noiseAmplitude
      );
      vertex.add(displacement.multiplyScalar(Math.random())); // Randomize strength
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    rockGeom.attributes.position.needsUpdate = true;
    rockGeom.computeVertexNormals(); // Crucial after displacement

    // --- Material ---
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor),
      roughness: visualConf.roughness || 0.85,
      metalness: visualConf.metalness || 0.1,
      emissive: new THREE.Color(visualConf.emissiveColor || 0x000000),
      emissiveIntensity: visualConf.emissiveIntensity || 0.0
    });

    // Create rock texture if needed
    if (visualConf.textureMapUrl) {
      const textureLoader = new THREE.TextureLoader();
      rockMaterial.map = textureLoader.load(visualConf.textureMapUrl);
    } else {
      // Create a simple procedural texture for the rock
      const rockNoiseCanvas = document.createElement('canvas');
      rockNoiseCanvas.width = 128;
      rockNoiseCanvas.height = 128;
      const ctxRock = rockNoiseCanvas.getContext('2d')!;
      for (let x = 0; x < 128; x++) {
        for (let y = 0; y < 128; y++) {
          const r = Math.random() * 50 + 100; // Greyish tones
          ctxRock.fillStyle = `rgb(${r},${r},${r})`;
          ctxRock.fillRect(x, y, 1, 1);
        }
      }
      const rockNoiseTexture = new THREE.CanvasTexture(rockNoiseCanvas);
      rockNoiseTexture.wrapS = rockNoiseTexture.wrapT = THREE.RepeatWrapping;
      rockMaterial.bumpMap = rockNoiseTexture;
      rockMaterial.bumpScale = 0.02;
    }

    this.mesh = new THREE.Mesh(rockGeom, rockMaterial);
    this.mesh.name = "RockObstacle_StdMat";

    // Ensure rock base is roughly at y=0 for placement on seafloor
    const box = new THREE.Box3().setFromObject(this.mesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    this.mesh.position.y = size.y / 2 - 0.8; // Slightly higher placement on seafloor

    // Randomize rotation for variety
    this.mesh.rotation.y = Math.random() * Math.PI * 2;

    // --- Collision Shape (can be simpler than visual mesh) ---
    // Reduce collision radius to 80% of visual size for more forgiving gameplay
    const collisionRadius = Math.max(size.x, size.y, size.z) * 0.5 * 0.8; // 80% of half max dimension
    const collisionGeom = new THREE.SphereGeometry(collisionRadius, 8, 6);
    this.collisionShape = new THREE.Mesh(collisionGeom, new THREE.MeshBasicMaterial({ visible: false }));
    this.collisionShape.name = "RockCollider";
    // Position collider relative to the mesh's new pivot if mesh was shifted
    this.collisionShape.position.y = -size.y / 2 + 0.8 + collisionRadius; // Adjust collider position to match visual mesh after shift

    this.mesh.add(this.collisionShape); // Add as child so it inherits transforms

    this.mesh.userData = { type: 'obstacle', name: 'rock', assetInstance: this, isDangerous: true };
  }

  public getMesh(): THREE.Mesh { return this.mesh; }

  // Return the dedicated collision shape
  public getCollisionObject(): THREE.Mesh { 
    return this.collisionShape; 
  }

  public isDangerous(): boolean { return true; }
  public reset(): void { /* No state */ }
  public updateAnimation(deltaTime: number): void { /* Static */ }

  public dispose(): void {
    if (this.mesh.geometry) this.mesh.geometry.dispose();
    if (this.mesh.material instanceof THREE.Material) {
      const stdMaterial = this.mesh.material as THREE.MeshStandardMaterial;
      if (stdMaterial.map && stdMaterial.map !== null) {
        stdMaterial.map.dispose();
      }
      if (stdMaterial.bumpMap && stdMaterial.bumpMap !== null) {
        stdMaterial.bumpMap.dispose();
      }
      this.mesh.material.dispose();
    }
    if (this.collisionShape.geometry) this.collisionShape.geometry.dispose();
    if (this.collisionShape.material instanceof THREE.Material) {
      this.collisionShape.material.dispose();
    }
  }
}