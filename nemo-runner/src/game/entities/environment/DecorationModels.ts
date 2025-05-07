import * as THREE from 'three';
import { DecorationDefinition } from './DecorationDefinitions';
import { detectDeviceCapabilities, optimizeGeometry } from '../../utils/DeviceUtils';
import { CoralDecorations } from './decorations/CoralDecorations';
import { VegetationDecorations } from './decorations/VegetationDecorations';
import { RockDecorations } from './decorations/RockDecorations';
import { ShipwreckDecorations } from './decorations/ShipwreckDecorations';
import { DeepSeaDecorations } from './decorations/DeepSeaDecorations';
import { FloatingDecorations } from './decorations/FloatingDecorations';

/**
 * Utility class for creating various decoration models
 */
export class DecorationModels {
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
        return CoralDecorations.createCoral1(definition);
      case 'coral2':
        return CoralDecorations.createCoral2(definition);
      case 'branchingCoral':
        return CoralDecorations.createBranchingCoral(definition);
      case 'tubeCoral':
        return CoralDecorations.createTubeCoral(definition);
      case 'coralCluster':
        return CoralDecorations.createCoralCluster(definition);
      case 'coralRock':
        return CoralDecorations.createCoralRock(definition);
        
      // Vegetation
      case 'seaweed1':
        return VegetationDecorations.createSeaweed1(definition);
      case 'kelpStalk':
        return VegetationDecorations.createKelpStalk(definition);
      case 'seaGrass':
        return VegetationDecorations.createSeaGrass(definition);
      case 'seaAnemone':
        return VegetationDecorations.createSeaAnemone(definition);
      case 'giantKelp':
        return VegetationDecorations.createGiantKelp(definition);
        
      // Rock formations
      case 'rock1':
        return RockDecorations.createRock1(definition);
      case 'rock2':
        return RockDecorations.createRock2(definition);
      case 'rockFormation':
        return RockDecorations.createRockFormation(definition);
        
      // Shipwreck elements
      case 'shipPart':
        return ShipwreckDecorations.createShipPart(definition);
      case 'treasure':
        return ShipwreckDecorations.createTreasure(definition);
      case 'anchor':
        return ShipwreckDecorations.createAnchor(definition);
      case 'shipHull':
        return ShipwreckDecorations.createShipHull(definition);
      case 'barrel':
        return ShipwreckDecorations.createBarrel(definition);
        
      // Deep sea elements
      case 'deepsea_vent':
        return DeepSeaDecorations.createDeepSeaVent(definition);
      case 'glowingPlant':
        return DeepSeaDecorations.createGlowingPlant(definition);
      case 'crystalFormation':
        return DeepSeaDecorations.createCrystalFormation(definition);
      case 'bioluminescentCoral':
        return DeepSeaDecorations.createBioluminescentCoral(definition);
      case 'abyssalRock':
        return DeepSeaDecorations.createAbyssalRock(definition);
        
      // Floating elements
      case 'floatingPlankton':
        return FloatingDecorations.createFloatingPlankton(definition);
      case 'schoolOfFish':
        return FloatingDecorations.createSchoolOfFish(definition);
      case 'jellyfish':
        return FloatingDecorations.createJellyfish(definition);
      case 'bubbleStream':
        return FloatingDecorations.createBubbleStream(definition);
      case 'floatingDebris':
        return FloatingDecorations.createFloatingDebris(definition);
        
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
        // Use the optimizeGeometry utility for geometry simplification
        if (object.geometry instanceof THREE.BufferGeometry) {
          // Apply geometry optimization with detail level as simplification factor
          optimizeGeometry(object.geometry, detailLevel);
        }
        // Fallback to primitive-based simplification if needed
        else if (object.geometry instanceof THREE.BoxGeometry) {
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
        
        // Simplify material based on detail level
        if (object.material instanceof THREE.Material) {
          object.material = object.material.clone();
          
          // Use flat shading for lower detail levels
          if (detailLevel < 0.7) {
            object.material.flatShading = true;
          }
          
          // For very low detail levels, use basic materials
          if (detailLevel < 0.4 && object.material instanceof THREE.MeshStandardMaterial) {
            const color = object.material.color.clone();
            const basicMaterial = new THREE.MeshLambertMaterial({
              color: color,
              map: object.material.map,
              transparent: object.material.transparent,
              opacity: object.material.opacity
            });
            
            object.material.dispose();
            object.material = basicMaterial;
          }
        }
      }
    });
    
    return lowPoly;
  }
}