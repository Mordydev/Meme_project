import * as THREE from 'three';
import { AssetManager } from '../../core/AssetManager';
import { optimizeModelAsset } from '../../utils/DeviceUtils';
import type { DeviceCapabilities } from '../../utils/DeviceUtils';

/**
 * Handles the 3D model for the character
 */
export class CharacterModel {
  // Core model
  private model: THREE.Group | null = null;
  
  // References to important model parts
  private bodyGroup: THREE.Object3D | null = null;
  private tailGroup: THREE.Object3D | null = null;
  private leftFinGroup: THREE.Object3D | null = null;
  private rightFinGroup: THREE.Object3D | null = null;
  private eyesGroup: THREE.Object3D | null = null;
  
  // Model loading
  private assetManager: AssetManager;
  private deviceCapabilities: DeviceCapabilities;
  
  constructor(
    assetManager: AssetManager,
    deviceCapabilities: DeviceCapabilities
  ) {
    this.assetManager = assetManager;
    this.deviceCapabilities = deviceCapabilities;
  }
  
  /**
   * Creates and initializes the character model
   * @returns The character model
   */
  public createModel(): THREE.Group {
    try {
      // First check if we have a pre-loaded model
      const modelAsset = this.assetManager.getAsset('character_nemo');
      
      if (modelAsset) {
        console.log('Using loaded character model');
        // Use the pre-loaded model
        this.model = this.setupLoadedModel(modelAsset);
      } else {
        console.log('Creating procedural character model');
        // Directly call procedural generation
        this.model = this.createPlaceholderModel();
      }
      
      // Store references to important parts for easy access
      this.cacheModelParts();
      
      return this.model;
    } catch (error) {
      // If any error occurs during model creation, create a fallback placeholder
      console.error('Error creating character model:', error);
      
      // Import PlaceholderGenerator if available
      try {
        // Try to use the PlaceholderGenerator if available
        const { PlaceholderGenerator } = require('../../utils/PlaceholderGenerator');
        return PlaceholderGenerator.createEntityPlaceholder('character');
      } catch (placeholderError) {
        // Last resort fallback if PlaceholderGenerator isn't available
        console.error('Error creating character placeholder:', placeholderError);
        
        // Create a very simple fallback
        const group = new THREE.Group();
        group.name = 'emergency_character_fallback';
        
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        const mesh = new THREE.Mesh(geometry, material);
        
        group.add(mesh);
        return group;
      }
    }
  }
  
  /**
   * Set up a loaded character model with proper materials and optimizations
   */
  private setupLoadedModel(modelAsset: any): THREE.Group {
    const model = modelAsset.scene.clone();
    
    // Apply optimization based on device capabilities
    optimizeModelAsset(model, this.deviceCapabilities);
    
    // Add specific character material enhancements
    model.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        // For high-end devices, add fish-specific material properties
        if (this.deviceCapabilities.highEnd && object.material instanceof THREE.MeshPhysicalMaterial) {
          // Add character-specific textures from asset manager
          object.material.normalMap = this.assetManager.getAsset('nemo_normal') || object.material.normalMap;
          object.material.roughnessMap = this.assetManager.getAsset('nemo_roughness') || object.material.roughnessMap;
          object.material.metalnessMap = this.assetManager.getAsset('nemo_metalness') || object.material.metalnessMap;
          
          // Add subsurface scattering for fish skin
          object.material.transmission = 0.1;
          object.material.thickness = 0.5;
          object.material.clearcoat = 0.3;
          object.material.clearcoatRoughness = 0.4;
        } 
        // For mid-range devices, ensure we have normal maps at least
        else if (this.deviceCapabilities.midRange && object.material instanceof THREE.MeshStandardMaterial) {
          object.material.normalMap = this.assetManager.getAsset('nemo_normal_medium') || object.material.normalMap;
        }
      }
    });
    
    return model;
  }
  
  /**
   * Create a placeholder model for development and fallback
   */
  private createPlaceholderModel(): THREE.Group {
    // Create main group for the character
    const group = new THREE.Group();
    group.name = 'nemo_character';
    
    // Create a sub-group for animation purposes
    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'body';
    group.add(bodyGroup);
    
    // Create fish body using a more organic shape
    const bodyGeometry = this.createBodyGeometry();
    
    // Create high-quality fish material with subsurface scattering effect
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff7e00, // Clownfish orange
      roughness: 0.6,
      metalness: 0.2,
      flatShading: false,
      clearcoat: 0.3,
      clearcoatRoughness: 0.4,
      transmission: 0.1, // Subtle translucency for fish skin
      thickness: 0.5,
      emissive: 0x331900,
      emissiveIntensity: 0.05
    });
    
    // For lower-end devices, fallback to standard material
    if (!this.deviceCapabilities.highEnd) {
      bodyMaterial.transmission = 0;
      bodyMaterial.clearcoat = 0;
    }
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.name = 'body_mesh';
    bodyGroup.add(body);
    
    // Create white stripes using custom shader material for better visual effect
    const stripeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.1,
      clearcoat: 0.2,
      clearcoatRoughness: 0.3,
      flatShading: false
    });
    
    // Create three stripes for more accurate clownfish appearance
    // First stripe (head)
    const stripeGeometry1 = this.createStripeGeometry(0.53, 0.2);
    const stripe1 = new THREE.Mesh(stripeGeometry1, stripeMaterial);
    stripe1.name = 'head_stripe';
    stripe1.position.z = -0.25;
    bodyGroup.add(stripe1);
    
    // Middle stripe
    const stripeGeometry2 = this.createStripeGeometry(0.53, 0.25);
    const stripe2 = new THREE.Mesh(stripeGeometry2, stripeMaterial);
    stripe2.name = 'middle_stripe';
    stripe2.position.z = 0.15;
    bodyGroup.add(stripe2);
    
    // Tail stripe
    const stripeGeometry3 = this.createStripeGeometry(0.48, 0.2);
    const stripe3 = new THREE.Mesh(stripeGeometry3, stripeMaterial);
    stripe3.name = 'tail_stripe';
    stripe3.position.z = 0.5;
    bodyGroup.add(stripe3);
    
    // Create fish tail with more realistic shape
    const tailGroup = new THREE.Group();
    tailGroup.name = 'tail';
    bodyGroup.add(tailGroup);
    
    const tailGeometry = this.createTailGeometry();
    const tailMaterial = new THREE.MeshStandardMaterial({
      color: 0xff7e00, // Match body
      roughness: 0.7,
      metalness: 0.1,
      flatShading: false
    });
    
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.z = 0.95;
    tailGroup.add(tail);
    
    // Create fins with more organic shapes
    // Create fin groups for animation
    const leftFinGroup = new THREE.Group();
    leftFinGroup.name = 'left_fin';
    const rightFinGroup = new THREE.Group();
    rightFinGroup.name = 'right_fin';
    bodyGroup.add(leftFinGroup);
    bodyGroup.add(rightFinGroup);
    
    // Side fins with more realistic shape
    const leftFinGeometry = this.createFinGeometry('side');
    const leftFin = new THREE.Mesh(leftFinGeometry, tailMaterial);
    leftFin.position.set(0.5, 0, 0);
    leftFinGroup.add(leftFin);
    
    const rightFinGeometry = this.createFinGeometry('side');
    const rightFin = new THREE.Mesh(rightFinGeometry, tailMaterial);
    rightFin.rotation.z = Math.PI;
    rightFin.position.set(-0.5, 0, 0);
    rightFinGroup.add(rightFin);
    
    // Create life-like eyes
    const eyesGroup = new THREE.Group();
    eyesGroup.name = 'eyes';
    bodyGroup.add(eyesGroup);
    
    // Eye whites
    const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 12);
    const eyeWhiteMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xefefef,
      roughness: 0.1,
      metalness: 0.0
    });
    
    // Eye iris
    const irisMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x000033,
      roughness: 0.1,
      metalness: 0.0
    });
    
    // Pupil with highlight for more life-like appearance
    const pupilGeometry = new THREE.SphereGeometry(0.06, 12, 12);
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const pupilHighlightGeometry = new THREE.SphereGeometry(0.025, 8, 8);
    const pupilHighlightMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.7
    });
    
    // Left eye assembly
    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.name = 'left_eye';
    eyesGroup.add(leftEyeGroup);
    
    const leftEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    leftEyeGroup.add(leftEyeWhite);
    
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.z = 0.04;
    leftEyeGroup.add(leftPupil);
    
    const leftPupilHighlight = new THREE.Mesh(pupilHighlightGeometry, pupilHighlightMaterial);
    leftPupilHighlight.position.set(0.03, 0.03, 0.07);
    leftEyeGroup.add(leftPupilHighlight);
    
    leftEyeGroup.position.set(0.25, 0.2, -0.5);
    
    // Right eye assembly
    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.name = 'right_eye';
    eyesGroup.add(rightEyeGroup);
    
    const rightEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    rightEyeGroup.add(rightEyeWhite);
    
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.z = 0.04;
    rightEyeGroup.add(rightPupil);
    
    const rightPupilHighlight = new THREE.Mesh(pupilHighlightGeometry, pupilHighlightMaterial);
    rightPupilHighlight.position.set(-0.03, 0.03, 0.07);
    rightEyeGroup.add(rightPupilHighlight);
    
    rightEyeGroup.position.set(-0.25, 0.2, -0.5);
    
    // Additional fins with proper naming for animation
    
    // Dorsal fin 
    const dorsalFinGroup = new THREE.Group();
    dorsalFinGroup.name = 'dorsal_fin';
    bodyGroup.add(dorsalFinGroup);
    
    const dorsalFinGeometry = this.createFinGeometry('dorsal');
    const dorsalFin = new THREE.Mesh(dorsalFinGeometry, tailMaterial);
    dorsalFin.position.set(0, 0.4, -0.1);
    dorsalFinGroup.add(dorsalFin);
    
    // Pelvic fin
    const pelvicFinGroup = new THREE.Group();
    pelvicFinGroup.name = 'pelvic_fin';
    bodyGroup.add(pelvicFinGroup);
    
    const pelvicFinGeometry = this.createFinGeometry('pelvic');
    const pelvicFin = new THREE.Mesh(pelvicFinGeometry, tailMaterial);
    pelvicFin.position.set(0, -0.25, 0.2);
    pelvicFinGroup.add(pelvicFin);
    
    return group;
  }
  
  /**
   * Creates an organic fish body geometry
   */
  private createBodyGeometry(): THREE.BufferGeometry {
    // Start with a sphere for smooth base
    const geometry = new THREE.SphereGeometry(0.5, 32, 24);
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    // Apply deformations for clownfish body shape
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      
      // Normalize to -1 to 1 range for consistent transformations
      const normZ = vertex.z / 0.5; // Normalize based on sphere radius
      
      // Taper tail: gradually reduce x/y radius towards back
      const tailTaper = this.smoothStep(-0.2, 1.0, normZ);
      const tailFactor = 1.0 - tailTaper * 0.5; // Reduce radius by up to 50% at tail
      
      // Bulge mid-section for more organic fish shape
      const midBulge = 1.0 - Math.abs(normZ * 0.5);
      const bulgeFactor = 1.0 + Math.pow(midBulge, 2.0) * 0.15; // Add slight bulge
      
      // Flatten sides slightly
      const flattenAmount = 1.0 - Math.pow(Math.abs(vertex.x / 0.5), 2.0) * 0.15;
      
      // Apply factors
      vertex.x *= bulgeFactor * tailFactor * flattenAmount;
      vertex.y *= bulgeFactor * tailFactor * 0.7; // Overall height compression
      vertex.z *= 1.3; // Elongate in z direction
      
      // Add subtle noise for organic shape
      const noiseVal = 0.02 * (Math.sin(vertex.x * 20) * Math.sin(vertex.y * 20) * Math.sin(vertex.z * 20));
      vertex.addScaledVector(vertex.clone().normalize(), noiseVal);
      
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
    return geometry;
  }
  
  /**
   * Creates a geometry for clownfish stripes
   */
  private createStripeGeometry(radius: number, width: number): THREE.BufferGeometry {
    // Use cylinder for basic shape
    const geometry = new THREE.CylinderGeometry(radius, radius, width, 24, 1, true);
    geometry.rotateX(Math.PI / 2); // Orient properly
    
    // Add some noise to stripe edges for more natural look
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      
      // Only apply noise to the edges (top and bottom of cylinder)
      if (Math.abs(vertex.y) > width/2 - 0.05) {
        const noiseScale = 10;
        const noiseVal = 0.01 * (Math.sin(vertex.x * noiseScale) * Math.cos(vertex.z * noiseScale));
        vertex.y += noiseVal;
      }
      
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
    return geometry;
  }
  
  /**
   * Creates a geometry for the fish tail
   */
  private createTailGeometry(): THREE.BufferGeometry {
    // Create tail shape using custom shape
    const tailShape = new THREE.Shape();
    
    // Define the tail outline
    tailShape.moveTo(0, 0); // Center point
    tailShape.quadraticCurveTo(0.1, 0.15, 0.3, 0.4); // Top curve out
    tailShape.quadraticCurveTo(0.5, 0.7, 0.4, 0.8); // Top curve tip
    tailShape.quadraticCurveTo(0.3, 0.9, 0.1, 0.7); // Top curve back
    tailShape.lineTo(0, 0.5); // Center of split
    tailShape.lineTo(-0.1, 0.7); // Bottom curve start
    tailShape.quadraticCurveTo(-0.3, 0.9, -0.4, 0.8); // Bottom curve back
    tailShape.quadraticCurveTo(-0.5, 0.7, -0.3, 0.4); // Bottom curve tip
    tailShape.quadraticCurveTo(-0.1, 0.15, 0, 0); // Bottom curve to center
    
    // Extrude the shape for 3D form
    const extrudeSettings = {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 3
    };
    
    const geometry = new THREE.ExtrudeGeometry(tailShape, extrudeSettings);
    geometry.rotateX(Math.PI / 2); // Orient properly
    
    return geometry;
  }
  
  /**
   * Creates geometry for different fin types
   */
  private createFinGeometry(type: 'side' | 'dorsal' | 'pelvic'): THREE.BufferGeometry {
    // Different shapes for different fin types
    const finShape = new THREE.Shape();
    
    if (type === 'side') {
      // Side fins (pectoral)
      finShape.moveTo(0, 0);
      finShape.quadraticCurveTo(0.05, 0.05, 0.1, 0.15);
      finShape.quadraticCurveTo(0.15, 0.25, 0.2, 0.3);
      finShape.quadraticCurveTo(0.15, 0.2, 0.05, 0.1);
      finShape.quadraticCurveTo(0, 0.05, 0, 0);
    } else if (type === 'dorsal') {
      // Dorsal fin (top)
      finShape.moveTo(-0.1, 0);
      finShape.quadraticCurveTo(0, 0.1, 0.05, 0.2);
      finShape.quadraticCurveTo(0.1, 0.3, 0.2, 0.25);
      finShape.quadraticCurveTo(0.1, 0.15, 0.1, 0);
      finShape.lineTo(-0.1, 0);
    } else {
      // Pelvic fin (bottom)
      finShape.moveTo(-0.05, 0);
      finShape.quadraticCurveTo(0, 0.05, 0.05, 0.1);
      finShape.quadraticCurveTo(0.1, 0.15, 0.15, 0.1);
      finShape.quadraticCurveTo(0.1, 0.05, 0.05, 0);
      finShape.lineTo(-0.05, 0);
    }
    
    // Extrude settings based on fin type
    const thickness = type === 'side' ? 0.02 : 0.03;
    const extrudeSettings = {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2
    };
    
    const geometry = new THREE.ExtrudeGeometry(finShape, extrudeSettings);
    
    // Rotate based on fin type
    if (type === 'side') {
      geometry.rotateZ(Math.PI / 2);
      geometry.scale(1, 0.6, 1); // Flatter side fins
    } else if (type === 'dorsal') {
      geometry.rotateZ(-Math.PI / 2);
      geometry.scale(0.8, 1, 1);
    } else {
      geometry.rotateX(-Math.PI / 4);
      geometry.scale(1, 0.5, 1);
    }
    
    return geometry;
  }
  
  /**
   * Helper function for smoother transitions
   */
  private smoothStep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }
  
  /**
   * Store references to important model parts for animation and effects
   */
  private cacheModelParts(): void {
    if (!this.model) return;
    
    // Find important parts by name
    this.model.traverse((object: THREE.Object3D) => {
      const name = object.name.toLowerCase();
      
      if (name.includes('body')) {
        this.bodyGroup = object;
      } else if (name.includes('tail')) {
        this.tailGroup = object;
      } else if (name.includes('fin_l') || name.includes('left_fin')) {
        this.leftFinGroup = object;
      } else if (name.includes('fin_r') || name.includes('right_fin')) {
        this.rightFinGroup = object;
      } else if (name.includes('eyes')) {
        this.eyesGroup = object;
      }
    });
  }
  
  /**
   * Get model part by name
   */
  public getModelPart(partName: string): THREE.Object3D | null {
    switch (partName) {
      case 'body':
        return this.bodyGroup;
      case 'tail':
        return this.tailGroup;
      case 'leftFin':
        return this.leftFinGroup;
      case 'rightFin':
        return this.rightFinGroup;
      case 'eyes':
        return this.eyesGroup;
      default:
        // Try to find by name
        let found: THREE.Object3D | null = null;
        this.model?.traverse((object) => {
          if (object.name.toLowerCase().includes(partName.toLowerCase())) {
            found = object;
          }
        });
        return found;
    }
  }
  
  /**
   * Clean up model resources
   */
  public dispose(): void {
    if (!this.model) return;
    
    this.model.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        
        if (object.material instanceof THREE.Material) {
          // Handle specific material types with their property maps
          if (object.material instanceof THREE.MeshStandardMaterial ||
              object.material instanceof THREE.MeshPhysicalMaterial) {
            // Dispose of any textures used by the material
            if (object.material.map) object.material.map.dispose();
            if (object.material.normalMap) object.material.normalMap.dispose();
            if (object.material.roughnessMap) object.material.roughnessMap.dispose();
            if (object.material.metalnessMap) object.material.metalnessMap.dispose();
            if (object.material.alphaMap) object.material.alphaMap.dispose();
            if (object.material.aoMap) object.material.aoMap.dispose();
            if (object.material.emissiveMap) object.material.emissiveMap.dispose();
          }
          
          // Dispose of the material itself
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          // Handle array of materials
          object.material.forEach(material => {
            // Handle specific material types with their property maps
            if (material instanceof THREE.MeshStandardMaterial ||
                material instanceof THREE.MeshPhysicalMaterial) {
              // Dispose of any textures used by the material
              if (material.map) material.map.dispose();
              if (material.normalMap) material.normalMap.dispose();
              if (material.roughnessMap) material.roughnessMap.dispose();
              if (material.metalnessMap) material.metalnessMap.dispose();
              if (material.alphaMap) material.alphaMap.dispose();
              if (material.aoMap) material.aoMap.dispose();
              if (material.emissiveMap) material.emissiveMap.dispose();
            }
            
            // Dispose of the material itself
            material.dispose();
          });
        }
      }
    });
    
    this.model = null;
    this.bodyGroup = null;
    this.tailGroup = null;
    this.leftFinGroup = null;
    this.rightFinGroup = null;
    this.eyesGroup = null;
  }
}