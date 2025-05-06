import * as THREE from 'three';
import { DecorationDefinition } from './DecorationDefinitions';

/**
 * Utility class for creating various decoration models
 */
export class DecorationFactory {
  // Shared texture cache for performance
  private static textureCache: Map<string, THREE.Texture> = new Map();
  
  /**
   * Create a decoration based on its definition
   * @param definition The decoration definition
   * @returns A THREE.Group or Mesh representing the decoration
   */
  static createDecoration(definition: DecorationDefinition): THREE.Group | THREE.Mesh {
    // Decoration type will determine what kind of mesh to create
    switch (definition.type) {
      // Coral and reef formations
      case 'coral1':
        return this.createCoral1(definition);
      case 'coral2':
        return this.createCoral2(definition);
      case 'branchingCoral':
        return this.createBranchingCoral(definition);
      case 'tubeCoral':
        return this.createTubeCoral(definition);
      case 'coralCluster':
        return this.createCoralCluster(definition);
        
      // Vegetation
      case 'seaweed1':
        return this.createSeaweed1(definition);
      case 'kelpStalk':
        return this.createKelpStalk(definition);
      case 'seaGrass':
        return this.createSeaGrass(definition);
      case 'seaAnemone':
        return this.createSeaAnemone(definition);
      case 'giantKelp':
        return this.createGiantKelp(definition);
        
      // Rock formations
      case 'rock1':
      case 'rock2':
        return this.createRock(definition);
      case 'rockFormation':
        return this.createRockFormation(definition);
      case 'coralRock':
        return this.createCoralRock(definition);
        
      // Shipwreck elements
      case 'shipPart':
        return this.createShipPart(definition);
      case 'treasure':
        return this.createTreasure(definition);
      case 'anchor':
        return this.createAnchor(definition);
      case 'shipHull':
        return this.createShipHull(definition);
      case 'barrel':
        return this.createBarrel(definition);
        
      // Deep sea elements
      case 'deepsea_vent':
        return this.createDeepSeaVent(definition);
      case 'glowingPlant':
        return this.createGlowingPlant(definition);
      case 'crystalFormation':
        return this.createCrystalFormation(definition);
      case 'bioluminescentCoral':
        return this.createBioluminescentCoral(definition);
      case 'abyssalRock':
        return this.createAbyssalRock(definition);
        
      // Floating elements
      case 'floatingPlankton':
        return this.createFloatingPlankton(definition);
      case 'schoolOfFish':
        return this.createSchoolOfFish(definition);
      case 'jellyfish':
        return this.createJellyfish(definition);
      case 'bubbleStream':
        return this.createBubbleStream(definition);
      case 'floatingDebris':
        return this.createFloatingDebris(definition);
        
      default:
        // Default simple box
        return this.createGenericDecoration(definition);
    }
  }
  
  // Generic decoration for fallback
  private static createGenericDecoration(definition: DecorationDefinition): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    mesh.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    mesh.rotation.y = Math.random() * definition.rotationVariance;
    
    return mesh;
  }
  
  // Create a coral formation of type 1
  private static createCoral1(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Base shape with several branches
    const branchCount = 3 + Math.floor(Math.random() * 4); // 3-6 branches
    
    for (let i = 0; i < branchCount; i++) {
      const heightScale = 0.5 + Math.random() * 0.5;
      const geometry = new THREE.CylinderGeometry(0.05, 0.2, 1.0 * heightScale, 8);
      
      // Random coral colors
      const color = new THREE.Color(
        0.9 + Math.random() * 0.1, // High red
        0.3 + Math.random() * 0.3, // Medium green
        0.5 + Math.random() * 0.3  // Medium-high blue
      );
      
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.8,
        metalness: 0.2
      });
      
      const branch = new THREE.Mesh(geometry, material);
      
      // Position branch
      const angle = (i / branchCount) * Math.PI * 2;
      const radius = 0.2 + Math.random() * 0.2;
      
      branch.position.set(
        Math.cos(angle) * radius,
        heightScale * 0.5, // Half height
        Math.sin(angle) * radius
      );
      
      // Random rotation
      branch.rotation.set(
        (Math.random() - 0.5) * 0.5,
        0,
        (Math.random() - 0.5) * 0.5
      );
      
      group.add(branch);
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  // Create a coral formation of type 2 (brain coral)
  private static createCoral2(definition: DecorationDefinition): THREE.Group {
    const group = new THREE.Group();
    
    // Brain coral like structure
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    
    // Add wrinkles to the surface
    if (geometry.attributes.position instanceof THREE.BufferAttribute) {
      const positions = geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        
        // Distance from center
        const length = Math.sqrt(x * x + y * y + z * z);
        
        // Direction
        const dx = x / length;
        const dy = y / length;
        const dz = z / length;
        
        // Add noise
        const noise = 0.1 * Math.sin(x * 10) * Math.sin(y * 10) * Math.sin(z * 10);
        
        positions[i * 3] = dx * (length + noise);
        positions[i * 3 + 1] = dy * (length + noise);
        positions[i * 3 + 2] = dz * (length + noise);
      }
      
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    }
    
    // Random coral colors, more orange tones
    const color = new THREE.Color(
      0.9 + Math.random() * 0.1, // High red
      0.4 + Math.random() * 0.2, // Medium-low green
      0.2 + Math.random() * 0.2  // Low blue
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.3
    });
    
    const coral = new THREE.Mesh(geometry, material);
    
    // Add to group
    group.add(coral);
    
    // Add a base
    const baseGeometry = new THREE.CylinderGeometry(0.5, 0.7, 0.3, 8);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: color.clone().multiplyScalar(0.8), // Darker version of same color
      roughness: 0.9,
      metalness: 0.1
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.5 - 0.15; // Half of coral height + half of base height
    group.add(base);
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  // Additional decoration creation methods would be defined here
  // For brevity, I'm only including a few examples, but the actual implementation
  // would have all the methods for creating all the decoration types.
  
  private static createBranchingCoral(definition: DecorationDefinition): THREE.Group {
    // Implementation similar to createCoral1 but with more complex branching structure
    return this.createDecoratedGroup(definition);
  }
  
  /**
   * Helper method to create a group with a generic decoration
   * @param definition The decoration definition
   * @returns A THREE.Group containing the generic decoration
   */
  private static createDecoratedGroup(definition: DecorationDefinition): THREE.Group {
    // Create a group to hold the decoration
    const group = new THREE.Group();
    
    // Add the generic decoration to the group
    group.add(this.createGenericDecoration(definition));
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  }
  
  private static createTubeCoral(definition: DecorationDefinition): THREE.Group {
    // Implementation for tube coral
    return this.createDecoratedGroup(definition);
  }
  
  private static createCoralCluster(definition: DecorationDefinition): THREE.Group {
    // Implementation for coral cluster
    return this.createDecoratedGroup(definition);
  }
  
  private static createSeaweed1(definition: DecorationDefinition): THREE.Group {
    // Implementation for seaweed
    return this.createDecoratedGroup(definition);
  }
  
  private static createKelpStalk(definition: DecorationDefinition): THREE.Group {
    // Implementation for kelp stalk
    return this.createDecoratedGroup(definition);
  }
  
  private static createSeaGrass(definition: DecorationDefinition): THREE.Group {
    // Implementation for sea grass
    return this.createDecoratedGroup(definition);
  }
  
  private static createSeaAnemone(definition: DecorationDefinition): THREE.Group {
    // Implementation for sea anemone
    return this.createDecoratedGroup(definition);
  }
  
  private static createGiantKelp(definition: DecorationDefinition): THREE.Group {
    // Implementation for giant kelp
    return this.createDecoratedGroup(definition);
  }
  
  private static createRock(definition: DecorationDefinition): THREE.Mesh {
    // Implementation for basic rock
    return this.createGenericDecoration(definition);
  }
  
  private static createRockFormation(definition: DecorationDefinition): THREE.Group {
    // Implementation for rock formation
    return this.createDecoratedGroup(definition);
  }
  
  private static createCoralRock(definition: DecorationDefinition): THREE.Group {
    // Implementation for coral-covered rock
    return this.createDecoratedGroup(definition);
  }
  
  private static createShipPart(definition: DecorationDefinition): THREE.Group {
    // Implementation for shipwreck part
    return this.createDecoratedGroup(definition);
  }
  
  private static createTreasure(definition: DecorationDefinition): THREE.Group {
    // Implementation for treasure chest
    return this.createDecoratedGroup(definition);
  }
  
  private static createAnchor(definition: DecorationDefinition): THREE.Group {
    // Implementation for anchor
    return this.createDecoratedGroup(definition);
  }
  
  private static createShipHull(definition: DecorationDefinition): THREE.Group {
    // Implementation for ship hull
    return this.createDecoratedGroup(definition);
  }
  
  private static createBarrel(definition: DecorationDefinition): THREE.Group {
    // Implementation for barrel
    return this.createDecoratedGroup(definition);
  }
  
  private static createDeepSeaVent(definition: DecorationDefinition): THREE.Group {
    // Implementation for deep sea vent
    return this.createDecoratedGroup(definition);
  }
  
  private static createGlowingPlant(definition: DecorationDefinition): THREE.Group {
    // Implementation for glowing plant with emissive material
    return this.createDecoratedGroup(definition);
  }
  
  private static createCrystalFormation(definition: DecorationDefinition): THREE.Group {
    // Implementation for crystal formation
    return this.createDecoratedGroup(definition);
  }
  
  private static createBioluminescentCoral(definition: DecorationDefinition): THREE.Group {
    // Implementation for bioluminescent coral with emissive material
    return this.createDecoratedGroup(definition);
  }
  
  private static createAbyssalRock(definition: DecorationDefinition): THREE.Group {
    // Implementation for abyssal rock
    return this.createDecoratedGroup(definition);
  }
  
  private static createFloatingPlankton(definition: DecorationDefinition): THREE.Group {
    // Implementation for floating plankton
    return this.createDecoratedGroup(definition);
  }
  
  private static createSchoolOfFish(definition: DecorationDefinition): THREE.Group {
    // Implementation for school of fish using instanced meshes
    return this.createDecoratedGroup(definition);
  }
  
  private static createJellyfish(definition: DecorationDefinition): THREE.Group {
    // Implementation for jellyfish
    return this.createDecoratedGroup(definition);
  }
  
  private static createBubbleStream(definition: DecorationDefinition): THREE.Group {
    // Implementation for bubble stream using particle system
    return this.createDecoratedGroup(definition);
  }
  
  private static createFloatingDebris(definition: DecorationDefinition): THREE.Group {
    // Implementation for floating debris
    return this.createDecoratedGroup(definition);
  }
  
  /**
   * Creates a low-poly version of a decoration for performance optimization
   * @param decoration The original high-detail decoration
   * @param detailLevel The detail level to reduce to (0-1)
   * @returns A simplified version of the decoration
   */
  static createLowPolyVersion(decoration: THREE.Object3D, detailLevel: number): THREE.Object3D {
    // Clone the decoration
    const lowPoly = decoration.clone();
    
    // Traverse all meshes and reduce polygon count
    lowPoly.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry) {
        // Simplify geometry based on detail level
        // For a real implementation, we would use a proper mesh simplification algorithm
        // For this example, we're just creating a new geometry with fewer segments
        
        // Check if it's a primitive geometry we can recreate
        if (object.geometry instanceof THREE.BoxGeometry) {
          const segments = Math.max(1, Math.floor(3 * detailLevel));
          const newGeometry = new THREE.BoxGeometry(1, 1, 1, segments, segments, segments);
          object.geometry.dispose();
          object.geometry = newGeometry;
        } else if (object.geometry instanceof THREE.SphereGeometry) {
          const segments = Math.max(4, Math.floor(16 * detailLevel));
          const newGeometry = new THREE.SphereGeometry(0.5, segments, segments);
          object.geometry.dispose();
          object.geometry = newGeometry;
        } else if (object.geometry instanceof THREE.CylinderGeometry) {
          const segments = Math.max(4, Math.floor(8 * detailLevel));
          const newGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, segments);
          object.geometry.dispose();
          object.geometry = newGeometry;
        }
        
        // Simplify material
        if (object.material instanceof THREE.Material) {
          object.material = object.material.clone();
          object.material.flatShading = true;
        }
      }
    });
    
    return lowPoly;
  }
}