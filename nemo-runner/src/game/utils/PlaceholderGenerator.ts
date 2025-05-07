import * as THREE from 'three';

/**
 * Utility class for creating visible error placeholder meshes
 * Used when procedural generation methods fail
 */
export class PlaceholderGenerator {
  /**
   * Create a bright red error placeholder with the given name
   * @param name Name of the failed component for debugging
   * @param size Size of the placeholder cube (default 0.5)
   * @returns A mesh or group representing the error
   */
  public static createErrorPlaceholder(name: string, size: number = 0.5): THREE.Object3D {
    try {
      // Create a distinct, visible error placeholder
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, // bright red
        wireframe: true
      });
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = `error_placeholder_${name}`;

      // Add an additional wireframe sphere to make it more distinct
      const sphereGeometry = new THREE.SphereGeometry(size * 0.7, 8, 8);
      const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0xff00ff, // magenta
        wireframe: true
      });
      const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
      
      // Create group to hold both meshes
      const errorGroup = new THREE.Group();
      errorGroup.name = `error_placeholder_group_${name}`;
      errorGroup.add(errorMesh);
      errorGroup.add(sphereMesh);

      return errorGroup;
    } catch (error) {
      // Last resort fallback if even the placeholder creation fails
      console.error(`Failed to create placeholder for ${name}:`, error);
      
      // Create the absolute simplest possible object
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      cube.name = `emergency_error_placeholder_${name}`;
      return cube;
    }
  }

  /**
   * Create a simple placeholder for a specific entity type
   * @param entityType The type of entity (e.g., 'character', 'shark', 'coral')
   * @param size Scale factor for the placeholder (default 1.0)
   * @returns A mesh or group approximating the entity shape
   */
  public static createEntityPlaceholder(entityType: string, size: number = 1.0): THREE.Object3D {
    try {
      // Create a themed placeholder based on entity type
      const group = new THREE.Group();
      group.name = `placeholder_${entityType}`;
      
      let meshes: THREE.Object3D[] = [];
      let color: number;
      
      // Generate different shaped placeholders based on entity type
      switch (entityType.toLowerCase()) {
        case 'character':
        case 'fish':
        case 'nemo':
          // Fish-like shape
          color = 0xff7f00; // orange for fish/character
          meshes = this.createFishPlaceholder(size, color);
          break;
          
        case 'shark':
          // Shark-like shape
          color = 0x505a64; // grey for shark
          meshes = this.createSharkPlaceholder(size, color);
          break;
          
        case 'jellyfish':
          color = 0xdd88ff; // purple for jellyfish
          meshes = this.createJellyfishPlaceholder(size, color);
          break;
          
        case 'coral':
          color = 0xff6347; // coral color
          meshes = this.createCoralPlaceholder(size, color);
          break;
          
        case 'pufferfish':
          color = 0xffcc00; // yellow for pufferfish
          meshes = this.createPufferfishPlaceholder(size, color);
          break;
          
        case 'clam':
          color = 0xcccccc; // grey for clam
          meshes = this.createClamPlaceholder(size, color);
          break;
          
        case 'decoration':
        case 'rock':
          color = 0x808080; // grey for rock/decoration
          meshes = this.createRockPlaceholder(size, color);
          break;
          
        default:
          // Default placeholder
          color = 0x00aaff; // blue for unknown
          const geometry = new THREE.SphereGeometry(size * 0.5, 8, 8);
          const material = new THREE.MeshBasicMaterial({ color });
          const mesh = new THREE.Mesh(geometry, material);
          meshes = [mesh];
      }
      
      // Add all meshes to the group
      meshes.forEach(mesh => group.add(mesh));
      
      return group;
    } catch (error) {
      // Return an error placeholder if entity placeholder fails
      console.error(`Failed to create entity placeholder for ${entityType}:`, error);
      return this.createErrorPlaceholder(entityType, size);
    }
  }
  
  /**
   * Create a fish-shaped placeholder
   */
  private static createFishPlaceholder(size: number, color: number): THREE.Object3D[] {
    const meshes: THREE.Object3D[] = [];
    
    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(
      size * 0.3, // radius
      size * 0.8, // length
      8, // radial segments
      8  // height segments
    );
    const bodyMaterial = new THREE.MeshBasicMaterial({ color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2; // Align horizontally
    meshes.push(body);
    
    // Tail
    const tailGeometry = new THREE.ConeGeometry(
      size * 0.3, // radius
      size * 0.4, // height
      4 // segments
    );
    const tailMaterial = new THREE.MeshBasicMaterial({ color });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.rotation.z = -Math.PI / 2; // Point to the back
    tail.position.set(0, 0, size * 0.5);
    meshes.push(tail);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(size * 0.05, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(size * 0.15, size * 0.15, -size * 0.3);
    meshes.push(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-size * 0.15, size * 0.15, -size * 0.3);
    meshes.push(rightEye);
    
    return meshes;
  }
  
  /**
   * Create a shark-shaped placeholder
   */
  private static createSharkPlaceholder(size: number, color: number): THREE.Object3D[] {
    const meshes: THREE.Object3D[] = [];
    
    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(
      size * 0.4, // radius
      size * 2.0, // length
      8, // radial segments
      8  // height segments
    );
    const bodyMaterial = new THREE.MeshBasicMaterial({ color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2; // Align horizontally
    meshes.push(body);
    
    // Dorsal fin
    const dorsalFinGeometry = new THREE.ConeGeometry(
      size * 0.2, // radius
      size * 0.6, // height
      4 // segments
    );
    const finMaterial = new THREE.MeshBasicMaterial({ color });
    const dorsalFin = new THREE.Mesh(dorsalFinGeometry, finMaterial);
    dorsalFin.rotation.z = Math.PI; // Point upward
    dorsalFin.position.set(0, size * 0.6, 0);
    meshes.push(dorsalFin);
    
    // Tail
    const tailGeometry = new THREE.ConeGeometry(
      size * 0.4, // radius
      size * 0.6, // height
      4 // segments
    );
    const tail = new THREE.Mesh(tailGeometry, finMaterial);
    tail.rotation.z = -Math.PI / 2; // Point to the back
    tail.position.set(0, 0, size * 1.2);
    meshes.push(tail);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(size * 0.08, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(size * 0.2, size * 0.2, -size * 0.8);
    meshes.push(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-size * 0.2, size * 0.2, -size * 0.8);
    meshes.push(rightEye);
    
    return meshes;
  }
  
  /**
   * Create a jellyfish-shaped placeholder
   */
  private static createJellyfishPlaceholder(size: number, color: number): THREE.Object3D[] {
    const meshes: THREE.Object3D[] = [];
    
    // Bell
    const bellGeometry = new THREE.SphereGeometry(
      size * 0.5, // radius
      8, // width segments
      8, // height segments
      0, // phi start
      Math.PI * 2, // phi length
      0, // theta start
      Math.PI / 2 // theta length (half sphere)
    );
    const bellMaterial = new THREE.MeshBasicMaterial({ color });
    const bell = new THREE.Mesh(bellGeometry, bellMaterial);
    bell.rotation.x = Math.PI; // Flip to face down
    meshes.push(bell);
    
    // Tentacles
    const tentacleCount = 8;
    const tentacleMaterial = new THREE.MeshBasicMaterial({ color });
    
    for (let i = 0; i < tentacleCount; i++) {
      const angle = (i / tentacleCount) * Math.PI * 2;
      const radius = size * 0.3;
      
      const tentacleGeometry = new THREE.CylinderGeometry(
        size * 0.03, // top radius
        size * 0.01, // bottom radius
        size * 0.7,  // height
        4           // radial segments
      );
      
      const tentacle = new THREE.Mesh(tentacleGeometry, tentacleMaterial);
      tentacle.position.set(
        Math.cos(angle) * radius,
        -size * 0.35, // Position at bottom of bell
        Math.sin(angle) * radius
      );
      
      // Point downward
      tentacle.rotation.x = Math.PI / 2;
      
      meshes.push(tentacle);
    }
    
    return meshes;
  }
  
  /**
   * Create a coral-shaped placeholder
   */
  private static createCoralPlaceholder(size: number, color: number): THREE.Object3D[] {
    const meshes: THREE.Object3D[] = [];
    
    // Base
    const baseGeometry = new THREE.CylinderGeometry(
      size * 0.2, // top radius
      size * 0.3, // bottom radius
      size * 0.3, // height
      8          // radial segments
    );
    const baseMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(0.8).getHex() });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = size * 0.15; // Half height
    meshes.push(base);
    
    // Branches
    const branchCount = 5;
    const branchMaterial = new THREE.MeshBasicMaterial({ color });
    
    for (let i = 0; i < branchCount; i++) {
      const angle = (i / branchCount) * Math.PI * 2;
      const radius = size * 0.15;
      
      const height = size * (0.5 + Math.random() * 0.3);
      const branchGeometry = new THREE.CylinderGeometry(
        size * 0.05, // top radius
        size * 0.08, // bottom radius
        height,     // height
        6          // radial segments
      );
      
      const branch = new THREE.Mesh(branchGeometry, branchMaterial);
      branch.position.set(
        Math.cos(angle) * radius,
        size * 0.3 + height / 2, // Top of base + half branch height
        Math.sin(angle) * radius
      );
      
      // Random tilt
      branch.rotation.x = (Math.random() - 0.5) * 0.2;
      branch.rotation.z = (Math.random() - 0.5) * 0.2;
      
      meshes.push(branch);
    }
    
    return meshes;
  }
  
  /**
   * Create a pufferfish-shaped placeholder
   */
  private static createPufferfishPlaceholder(size: number, color: number): THREE.Object3D[] {
    const meshes: THREE.Object3D[] = [];
    
    // Body
    const bodyGeometry = new THREE.SphereGeometry(size * 0.5, 12, 12);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    meshes.push(body);
    
    // Spikes
    const spikeCount = 12;
    const spikeMaterial = new THREE.MeshBasicMaterial({ 
      color: new THREE.Color(color).multiplyScalar(0.8).getHex()
    });
    
    for (let i = 0; i < spikeCount; i++) {
      // Use golden ratio for even distribution on sphere
      const phi = Math.acos(1 - 2 * (i + 0.5) / spikeCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      
      // Calculate position on unit sphere
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);
      
      // Create spike
      const spikeGeometry = new THREE.ConeGeometry(size * 0.04, size * 0.15, 4);
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      
      // Position on sphere
      spike.position.set(x * size * 0.5, y * size * 0.5, z * size * 0.5);
      
      // Orient spike to point outward from center
      spike.lookAt(x * size, y * size, z * size);
      
      meshes.push(spike);
    }
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(size * 0.08, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(size * 0.3, size * 0.2, size * 0.35);
    meshes.push(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-size * 0.3, size * 0.2, size * 0.35);
    meshes.push(rightEye);
    
    return meshes;
  }
  
  /**
   * Create a clam-shaped placeholder
   */
  private static createClamPlaceholder(size: number, color: number): THREE.Object3D[] {
    const meshes: THREE.Object3D[] = [];
    
    // Lower shell
    const lowerShellGeometry = new THREE.SphereGeometry(
      size * 0.5, // radius
      8, // width segments
      8, // height segments
      0, // phi start
      Math.PI * 2, // phi length
      0, // theta start
      Math.PI / 2 // theta length (half sphere)
    );
    const shellMaterial = new THREE.MeshBasicMaterial({ color });
    const lowerShell = new THREE.Mesh(lowerShellGeometry, shellMaterial);
    lowerShell.rotation.x = Math.PI; // Flip to face up
    lowerShell.position.y = -size * 0.1;
    meshes.push(lowerShell);
    
    // Upper shell
    const upperShellGeometry = new THREE.SphereGeometry(
      size * 0.5, // radius
      8, // width segments
      8, // height segments
      0, // phi start
      Math.PI * 2, // phi length
      0, // theta start
      Math.PI / 2 // theta length (half sphere)
    );
    const upperShell = new THREE.Mesh(upperShellGeometry, shellMaterial);
    upperShell.position.y = size * 0.1;
    upperShell.rotation.x = Math.PI / 6; // Slightly open
    meshes.push(upperShell);
    
    // Inner pearl
    const pearlGeometry = new THREE.SphereGeometry(size * 0.1, 8, 8);
    const pearlMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pearl = new THREE.Mesh(pearlGeometry, pearlMaterial);
    pearl.position.y = -size * 0.05;
    meshes.push(pearl);
    
    return meshes;
  }
  
  /**
   * Create a rock-shaped placeholder
   */
  private static createRockPlaceholder(size: number, color: number): THREE.Object3D[] {
    const meshes: THREE.Object3D[] = [];
    
    // Rock
    const rockGeometry = new THREE.IcosahedronGeometry(size * 0.5, 0);
    const rockMaterial = new THREE.MeshBasicMaterial({ color });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    meshes.push(rock);
    
    return meshes;
  }
}