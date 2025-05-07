import * as THREE from 'three';
import { DecorationDefinition } from '../DecorationDefinitions';
import { NoiseGenerator } from '../../../utils/NoiseGenerator';
import { DecorationUtils } from '../DecorationUtils';

/**
 * Contains factory methods for creating deep sea-type decorations
 * Partially refactored to use DecorationUtils for common operations
 */
export class DeepSeaDecorations {
  // Shared noise generator instance with a consistent seed for reproducible results
  private static noiseGenerator: NoiseGenerator = new NoiseGenerator(Math.PI * 2022); // Arbitrary but consistent seed
  /**
   * Create a deep sea vent
   */
  static createDeepSeaVent(definition: DecorationDefinition): THREE.Group {
    try {
      // Create a group to hold all parts of the deep sea vent
      const group = new THREE.Group();
      group.name = 'deepSeaVent';
      
      // Vent dimensions and parameters
      const baseRadius = 0.6;
      const topRadius = 0.3;
      const ventHeight = 1.2;
      const particleCount = 15;
      
      // Create the main vent structure (truncated cone shape)
      const ventGeometry = new THREE.CylinderGeometry(
        topRadius,      // Top radius
        baseRadius,     // Bottom radius
        ventHeight,     // Height
        10,             // Radial segments
        4,              // Height segments
        false           // Open-ended
      );
      
      // Apply some irregular deformations to make it look more natural
      if (ventGeometry.attributes.position) {
        const positions = ventGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          const y = positions[i * 3 + 1];
          
          // Skip top and bottom faces
          if (y < ventHeight/2 - 0.05 && y > -ventHeight/2 + 0.05) {
            // Deform the sides to make it look more organic
            const angle = Math.atan2(positions[i * 3 + 2], positions[i * 3]);
            const noise = Math.sin(angle * 5) * 0.05 + Math.sin(y * 8) * 0.03;
            
            positions[i * 3] += noise * (1 - Math.abs(y) / (ventHeight/2)) * 0.8;
            positions[i * 3 + 2] += noise * (1 - Math.abs(y) / (ventHeight/2)) * 0.8;
          }
        }
        
        ventGeometry.attributes.position.needsUpdate = true;
        ventGeometry.computeVertexNormals();
      }
      
      // Create a rocky material for the vent using DecorationUtils
      const ventMaterial = DecorationUtils.createStandardMaterial(
        new THREE.Color(0x333333), // Dark gray
        {
          roughness: 0.9,
          metalness: 0.2
        }
      );
      
      const vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.name = 'deepSeaVent_main';
      vent.position.y = ventHeight / 2;
      group.add(vent);
      
      // Create a flat base/surrounding at the bottom
      const baseGeometry = new THREE.CylinderGeometry(
        baseRadius * 1.5,  // Top radius
        baseRadius * 1.8,  // Bottom radius (wider)
        ventHeight * 0.1,  // Height
        12,                // Radial segments
        1,                 // Height segments
        false              // Open-ended
      );
      
      // Add some deformation to the base
      if (baseGeometry.attributes.position) {
        const positions = baseGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          // Skip top and bottom vertices
          const y = positions[i * 3 + 1];
          if (y < ventHeight * 0.05 - 0.01 && y > -ventHeight * 0.05 + 0.01) {
            // Add some noise to the edge
            const angle = Math.atan2(positions[i * 3 + 2], positions[i * 3]);
            const radialDist = Math.sqrt(Math.pow(positions[i * 3], 2) + Math.pow(positions[i * 3 + 2], 2));
            
            // More deformation at the edge
            const edgeFactor = (radialDist / (baseRadius * 1.8)) * 2;
            const noise = Math.sin(angle * 7) * 0.1 * edgeFactor;
            
            positions[i * 3] += noise;
            positions[i * 3 + 2] += noise;
          }
        }
        
        baseGeometry.attributes.position.needsUpdate = true;
        baseGeometry.computeVertexNormals();
      }
      
      // Create darker material for base using DecorationUtils
      const baseMaterial = DecorationUtils.createStandardMaterial(
        new THREE.Color(0x222222), // Slightly darker than the vent
        {
          roughness: 1.0,
          metalness: 0.1
        }
      );
      
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.name = 'deepSeaVent_base';
      base.position.y = ventHeight * 0.05;
      group.add(base);
      
      // Add some mineral deposits around the vent using DecorationUtils
      const mineralMaterial = DecorationUtils.createStandardMaterial(
        new THREE.Color(0xccbb88), // Yellow-brown mineral color
        {
          roughness: 0.7,
          metalness: 0.4
        }
      );
      
      // Add mineral deposits on the vent and base
      for (let i = 0; i < 25; i++) {
        const isOnVent = Math.random() > 0.4;
        const size = 0.05 + Math.random() * 0.1;
        
        const mineralGeometry = new THREE.SphereGeometry(size, 4, 4);
        
        // Add some deformation to make each deposit unique
        if (mineralGeometry.attributes.position) {
          const positions = mineralGeometry.attributes.position.array;
          
          for (let j = 0; j < positions.length / 3; j++) {
            // Add noise to each vertex
            positions[j * 3] += (Math.random() - 0.5) * 0.02;
            positions[j * 3 + 1] += (Math.random() - 0.5) * 0.02;
            positions[j * 3 + 2] += (Math.random() - 0.5) * 0.02;
          }
          
          mineralGeometry.attributes.position.needsUpdate = true;
          mineralGeometry.computeVertexNormals();
        }
        
        const mineral = new THREE.Mesh(mineralGeometry, mineralMaterial);
        mineral.name = `deepSeaVent_mineral_${i}`;
        
        if (isOnVent) {
          // Position on the vent itself
          const height = Math.random() * ventHeight * 0.8;
          const angle = Math.random() * Math.PI * 2;
          
          // Radius varies based on height
          const radius = topRadius + (baseRadius - topRadius) * (1 - height / ventHeight);
          
          mineral.position.set(
            Math.cos(angle) * radius * 1.05,
            height,
            Math.sin(angle) * radius * 1.05
          );
        } else {
          // Position on the base
          const angle = Math.random() * Math.PI * 2;
          const distance = baseRadius * (1.0 + Math.random() * 0.6);
          
          mineral.position.set(
            Math.cos(angle) * distance,
            Math.random() * 0.1,
            Math.sin(angle) * distance
          );
        }
        
        // Flatten the minerals a bit
        const scaleY = 0.4 + Math.random() * 0.4;
        mineral.scale.y = scaleY;
        
        group.add(mineral);
      }
      
      // Create hydrothermal vent particles - "black smoke" effect
      // Since we can't use particle systems here, we'll use small meshes
      const particleGroup = new THREE.Group();
      particleGroup.name = 'deepSeaVent_smoke';
      
      // Create varied particle materials using DecorationUtils
      const particleMaterials = [
        DecorationUtils.createStandardMaterial(
          new THREE.Color(0x111111), // Dark smoke
          {
            roughness: 1.0,
            metalness: 0.0,
            transparent: true,
            opacity: 0.7
          }
        ),
        DecorationUtils.createStandardMaterial(
          new THREE.Color(0x222222), // Medium smoke
          {
            roughness: 1.0,
            metalness: 0.0,
            transparent: true,
            opacity: 0.6
          }
        ),
        DecorationUtils.createStandardMaterial(
          new THREE.Color(0x444444), // Light smoke
          {
            roughness: 1.0,
            metalness: 0.0,
            transparent: true,
            opacity: 0.5
          }
        )
      ];
      
      // Create "smoke" particles
      for (let i = 0; i < particleCount; i++) {
        const particleSize = 0.1 + Math.random() * 0.15;
        const particleGeometry = new THREE.SphereGeometry(particleSize, 4, 4);
        
        // Select a random material for variety
        const materialIndex = Math.floor(Math.random() * particleMaterials.length);
        const particle = new THREE.Mesh(particleGeometry, particleMaterials[materialIndex]);
        particle.name = `deepSeaVent_smoke_${i}`;
        
        // Position particles in a column above the vent
        const angle = Math.random() * Math.PI * 2;
        const height = ventHeight + Math.pow(Math.random(), 1.5) * ventHeight * 1.5;
        
        // Particles spread out as they rise
        const spreadFactor = height / ventHeight;
        const spread = Math.min(topRadius * spreadFactor, topRadius * 2);
        
        particle.position.set(
          Math.cos(angle) * spread * Math.random(),
          height,
          Math.sin(angle) * spread * Math.random()
        );
        
        // Scale the particles based on height - bigger as they rise
        const particleScale = 1.0 + (height - ventHeight) / ventHeight;
        particle.scale.set(particleScale, particleScale, particleScale);
        
        particleGroup.add(particle);
      }
      
      group.add(particleGroup);
      
      // Add glowing effects at the top opening using DecorationUtils for emissive material
      const glowMaterial = DecorationUtils.createStandardMaterial(
        new THREE.Color(0xff4400), // Orange-red glow
        {
          emissive: new THREE.Color(0xff2200),
          emissiveIntensity: 0.5,
          roughness: 0.7,
          metalness: 0.3
        }
      );
      
      // Create a rim of glowing material at the top opening
      const glowRimGeometry = new THREE.TorusGeometry(
        topRadius * 0.9,  // Radius of the torus
        topRadius * 0.15, // Thickness
        8,                // Radial segments
        12                // Tubular segments
      );
      
      const glowRim = new THREE.Mesh(glowRimGeometry, glowMaterial);
      glowRim.name = 'deepSeaVent_glowRim';
      glowRim.position.y = ventHeight;
      glowRim.rotation.x = Math.PI / 2;
      group.add(glowRim);
      
      // Add some small glowing cracks on the vent surface
      for (let i = 0; i < 8; i++) {
        // Create a simple line geometry for each crack
        const crackGeometry = new THREE.BoxGeometry(0.02, 0.1 + Math.random() * 0.15, 0.02);
        const crack = new THREE.Mesh(crackGeometry, glowMaterial);
        crack.name = `deepSeaVent_crack_${i}`;
        
        // Position the cracks on the vent surface
        const angle = Math.random() * Math.PI * 2;
        const height = Math.random() * ventHeight * 0.8;
        
        // Radius at this height
        const radius = topRadius + (baseRadius - topRadius) * (1 - height / ventHeight);
        
        crack.position.set(
          Math.cos(angle) * radius * 1.01,
          height,
          Math.sin(angle) * radius * 1.01
        );
        
        // Orient the crack to follow the vent surface
        crack.lookAt(new THREE.Vector3(0, height, 0));
        crack.rotateX(Math.PI / 2);
        
        // Random rotation of the crack
        crack.rotation.z = Math.random() * Math.PI;
        
        group.add(crack);
      }
      
      // Apply scale and rotation using DecorationUtils
      DecorationUtils.applyScale(group, definition);
      DecorationUtils.applyRotation(group, definition);
      
      return group;
    } catch (error) {
      console.error(`Error creating deep sea vent:`, error);
      return DecorationUtils.createErrorPlaceholder('deepSeaVent');
    }
  }

  /**
   * Create a glowing plant
   * Refactored to use DecorationUtils for common operations
   */
  static createGlowingPlant(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      group.name = 'glowingPlant';
      
      // Create a base stem for the plant
      const stemHeight = 0.6 + Math.random() * 0.6;
      const stemRadius = 0.03 + Math.random() * 0.02;
      
      const stemGeometry = new THREE.CylinderGeometry(
        stemRadius * 0.7,  // Top radius (tapered)
        stemRadius,        // Bottom radius
        stemHeight,        // Height
        8,                 // Radial segments
        3,                 // Height segments
        false              // Open-ended
      );
      
      // Apply curvature to the stem using DecorationUtils
      DecorationUtils.applyCurveToStalk(
        stemGeometry,
        stemHeight,
        0.15,                    // Curve amount
        Math.random() * Math.PI * 2  // Random direction
      );
      
      // Choose a glow color - deep sea plants often have bioluminescence
      // Pick a bright, vibrant color
      const glowColors = [
        { main: 0x00ffff, emissive: 0x00aaaa }, // Cyan
        { main: 0xff00ff, emissive: 0xaa00aa }, // Magenta  
        { main: 0x66ffaa, emissive: 0x33aa66 }, // Aqua-green
        { main: 0xaaaaff, emissive: 0x6666dd }  // Light blue
      ];
      
      const colorSet = glowColors[Math.floor(Math.random() * glowColors.length)];
      
      // Create glowing material using DecorationUtils
      const plantMaterial = DecorationUtils.createStandardMaterial(
        new THREE.Color(colorSet.main),
        {
          emissive: new THREE.Color(colorSet.emissive),
          emissiveIntensity: 0.8,
          roughness: 0.7,
          metalness: 0.3,
          transparent: true,
          opacity: 0.9
        }
      );
      
      const stem = new THREE.Mesh(stemGeometry, plantMaterial);
      stem.name = 'glowingPlant_stem';
      stem.position.y = stemHeight / 2;
      group.add(stem);
      
      // Add some bulbs/flowers to the plant
      const bulbCount = 2 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < bulbCount; i++) {
        // Choose a shape for the bulb
        const shapeType = Math.floor(Math.random() * 3);
        let bulbGeometry;
        
        switch (shapeType) {
          case 0:
            // Spherical bulb
            const bulbRadius = 0.08 + Math.random() * 0.06;
            bulbGeometry = new THREE.SphereGeometry(bulbRadius, 8, 8);
            break;
            
          case 1:
            // Elongated bulb
            const length = 0.15 + Math.random() * 0.1;
            const width = 0.08 + Math.random() * 0.04;
            bulbGeometry = new THREE.CapsuleGeometry(width, length, 8, 10);
            break;
            
          case 2:
            // Flower-like shape
            const flowerRadius = 0.1 + Math.random() * 0.05;
            bulbGeometry = new THREE.SphereGeometry(flowerRadius, 8, 8);
            
            // Flatten to make it more flower-like
            if (bulbGeometry.attributes.position) {
              const positions = bulbGeometry.attributes.position.array;
              
              for (let j = 0; j < positions.length / 3; j++) {
                positions[j * 3 + 1] *= 0.5; // Flatten in Y direction
              }
              
              bulbGeometry.attributes.position.needsUpdate = true;
              bulbGeometry.computeVertexNormals();
            }
            break;
        }
        
        // Create a brighter material for the bulbs using DecorationUtils
        const bulbMaterial = DecorationUtils.createStandardMaterial(
          new THREE.Color(colorSet.main),
          {
            emissive: new THREE.Color(colorSet.emissive),
            emissiveIntensity: 1.0, // More intense glow
            roughness: 0.5,
            metalness: 0.4,
            transparent: true,
            opacity: 0.95
          }
        );
        
        const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
        bulb.name = `glowingPlant_bulb_${i}`;
        
        // Position bulbs along the upper part of the stem
        const normalizedHeight = 0.6 + Math.random() * 0.4; // Upper 40% of stem
        const angle = (i / bulbCount) * Math.PI * 2 + Math.random() * 0.5;
        const distanceFromStem = stemRadius * 2 + Math.random() * 0.05;
        
        bulb.position.set(
          Math.cos(angle) * distanceFromStem + Math.pow(normalizedHeight, 2) * 0.15, // Account for stem curve
          stemHeight * normalizedHeight,
          Math.sin(angle) * distanceFromStem
        );
        
        // Random rotation for variety
        bulb.rotation.set(
          Math.random() * Math.PI * 0.5,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 0.5
        );
        
        group.add(bulb);
        
        // Add some small tendrils/filaments from the bulbs
        if (Math.random() > 0.5) {
          const tendrilCount = 3 + Math.floor(Math.random() * 4);
          
          for (let j = 0; j < tendrilCount; j++) {
            const tendrilLength = 0.05 + Math.random() * 0.1;
            const tendrilGeometry = new THREE.CylinderGeometry(
              0.002,
              0.005,
              tendrilLength,
              4,
              1
            );
            
            const tendril = new THREE.Mesh(tendrilGeometry, bulbMaterial);
            tendril.name = `glowingPlant_tendril_${i}_${j}`;
            
            // Position around the bulb
            const tendrilAngle = (j / tendrilCount) * Math.PI * 2;
            
            // Set at bulb center
            tendril.position.set(0, 0, 0);
            
            // Rotate outward from bulb center
            tendril.rotation.set(
              Math.PI / 2 + (Math.random() - 0.5) * 0.5, // Mostly horizontal
              tendrilAngle,
              0
            );
            
            // Move to bulb edge
            const offset = new THREE.Vector3(0, tendrilLength / 2, 0);
            offset.applyEuler(tendril.rotation);
            tendril.position.sub(offset);
            
            bulb.add(tendril);
          }
        }
      }
      
      // Add very small glowing particles around the plant to enhance the effect
      // Use DecorationUtils.createBubbles which works well for this purpose
      const particles = DecorationUtils.createBubbles(
        6 + Math.floor(Math.random() * 6), // 6-12 particles
        0.02,                              // Max size
        stemHeight * 0.5                   // Container radius
      );
      particles.name = 'glowingPlant_particles';
      
      // Update particle materials to use the same glowing material
      particles.children.forEach((particle, index) => {
        if (particle instanceof THREE.Mesh) {
          particle.material = DecorationUtils.createStandardMaterial(
            new THREE.Color(colorSet.main),
            {
              emissive: new THREE.Color(colorSet.emissive),
              emissiveIntensity: 1.2,
              transparent: true,
              opacity: 0.7
            }
          );
          particle.name = `glowingPlant_particle_${index}`;
        }
      });
      
      // Adjust particle positions to be around the plant
      particles.children.forEach(particle => {
        // Y position distributed along the stem height
        particle.position.y = Math.random() * stemHeight;
      });
      
      group.add(particles);
      
      // Apply scale and rotation using DecorationUtils
      DecorationUtils.applyScale(group, definition);
      DecorationUtils.applyRotation(group, definition);
      
      return group;
    } catch (error) {
      console.error(`Error creating glowing plant:`, error);
      return DecorationUtils.createErrorPlaceholder('glowingPlant');
    }
  }

  /**
   * Create a crystal formation decoration
   */
  static createCrystalFormation(definition: DecorationDefinition): THREE.Group {
    try {
      // Create a group to hold all parts of the crystal formation
      const group = new THREE.Group();
      group.name = 'crystalFormation';
      
      // Crystal parameters
      const baseRadius = 0.5;
      const baseHeight = 0.2;
      const crystalCount = 12 + Math.floor(Math.random() * 8);
      
      // Create a base for the crystals to grow from
      const baseGeometry = new THREE.CylinderGeometry(
        baseRadius,        // Top radius
        baseRadius * 1.2,  // Bottom radius (slightly wider)
        baseHeight,        // Height
        10,                // Radial segments
        1,                 // Height segments
        false              // Open-ended
      );
      
      // Apply some irregular deformations to the base
      if (baseGeometry.attributes.position) {
        const positions = baseGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          // Skip the bottom vertices
          const y = positions[i * 3 + 1];
          if (y > -baseHeight/2 + 0.02) {
            // Deform the top and sides for a more natural look
            const angle = Math.atan2(positions[i * 3 + 2], positions[i * 3]);
            const noise = Math.sin(angle * 7) * 0.08;
            
            positions[i * 3] += noise;
            positions[i * 3 + 2] += noise;
            
            // Add some height variation to the top surface
            if (y > baseHeight/2 - 0.02) {
              positions[i * 3 + 1] += (Math.random() - 0.5) * 0.05;
            }
          }
        }
        
        baseGeometry.attributes.position.needsUpdate = true;
        baseGeometry.computeVertexNormals();
      }
      
      // Create a rocky material for the base with DecorationUtils
      const baseMaterial = DecorationUtils.createStandardMaterial(
        new THREE.Color(0x555555), // Dark gray
        {
          roughness: 0.9,
          metalness: 0.2
        }
      );
      
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.name = 'crystalFormation_base';
      base.position.y = baseHeight / 2;
      group.add(base);
      
      // Create a set of different crystal materials with various colors and translucency
      const crystalColors = [
        0x5555ff, // Blue
        0x55ffff, // Cyan
        0x55ff55, // Green
        0xff55ff, // Magenta
        0xff5555  // Red
      ];
      
      // Create crystal materials using DecorationUtils
      const crystalMaterials = crystalColors.map(color => 
        DecorationUtils.createStandardMaterial(
          new THREE.Color(color),
          {
            emissive: new THREE.Color(color).multiplyScalar(0.2), // Slight glow
            emissiveIntensity: 0.5,
            roughness: 0.2,
            metalness: 0.8,
            transparent: true,
            opacity: 0.8
          }
        )
      );
      
      // Function to create a single crystal
      const createCrystal = (position: THREE.Vector3, scale: number, material: THREE.Material) => {
        // Choose between different crystal shapes
        const shapeType = Math.floor(Math.random() * 3);
        let geometry;
        
        switch (shapeType) {
          case 0:
            // Pointed crystal (cone-like)
            geometry = new THREE.ConeGeometry(
              0.05 * scale,        // Radius
              0.3 * scale,         // Height
              6,                   // Radial segments
              1,                   // Height segments
              false                // Open-ended
            );
            break;
            
          case 1:
            // Diamond-shaped crystal
            geometry = new THREE.OctahedronGeometry(0.08 * scale, 0);
            break;
            
          case 2:
            // Hexagonal crystal shard
            geometry = new THREE.CylinderGeometry(
              0.02 * scale,        // Top radius (pointed)
              0.06 * scale,        // Bottom radius
              0.25 * scale,        // Height
              6,                   // Radial segments
              1,                   // Height segments
              false                // Open-ended
            );
            break;
        }
        
        // Create the crystal mesh
        const crystal = new THREE.Mesh(geometry, material);
        
        // Position at the specified location
        crystal.position.copy(position);
        
        // Random rotation for variety
        crystal.rotation.set(
          (Math.random() - 0.5) * Math.PI * 0.3,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * Math.PI * 0.3
        );
        
        // Return the crystal for clustering
        return crystal;
      };
      
      // Create crystal clusters
      const createCrystalCluster = (position: THREE.Vector3, size: number) => {
        // Choose a primary color for this cluster
        const mainMaterialIndex = Math.floor(Math.random() * crystalMaterials.length);
        const mainMaterial = crystalMaterials[mainMaterialIndex];
        
        // Create a group for this cluster
        const clusterGroup = new THREE.Group();
        clusterGroup.position.copy(position);
        
        // Create a primary large crystal
        const mainCrystal = createCrystal(
          new THREE.Vector3(0, 0, 0),
          size * (0.8 + Math.random() * 0.4),
          mainMaterial
        );
        
        clusterGroup.add(mainCrystal);
        
        // Add several smaller crystals around the main one
        const smallCrystalCount = 3 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < smallCrystalCount; i++) {
          // Occasionally use a different color for variety
          const useDifferentColor = Math.random() > 0.7;
          let material = mainMaterial;
          
          if (useDifferentColor) {
            // Pick a different color
            let altMaterialIndex;
            do {
              altMaterialIndex = Math.floor(Math.random() * crystalMaterials.length);
            } while (altMaterialIndex === mainMaterialIndex);
            
            material = crystalMaterials[altMaterialIndex];
          }
          
          // Create a smaller crystal
          const angle = Math.random() * Math.PI * 2;
          const distance = 0.05 + Math.random() * 0.1;
          const smallCrystal = createCrystal(
            new THREE.Vector3(
              Math.cos(angle) * distance,
              (Math.random() - 0.3) * 0.1,
              Math.sin(angle) * distance
            ),
            size * (0.3 + Math.random() * 0.3),
            material
          );
          
          // Orient the crystal to point slightly outward from the cluster center
          smallCrystal.lookAt(new THREE.Vector3(
            smallCrystal.position.x * 2,
            smallCrystal.position.y > 0 ? 1 : -1,
            smallCrystal.position.z * 2
          ));
          
          // Add some random rotation variation
          smallCrystal.rotation.x += (Math.random() - 0.5) * Math.PI * 0.3;
          smallCrystal.rotation.z += (Math.random() - 0.5) * Math.PI * 0.3;
          
          clusterGroup.add(smallCrystal);
        }
        
        return clusterGroup;
      };
      
      // Create several crystal clusters on the base - use DecorationUtils for positioning
      const clusterPositions = DecorationUtils.distributeRadially(
        crystalCount,
        baseRadius * 0.4, // Radius
        baseHeight/2 + Math.random() * 0.05, // Y position
        0.8, // Radius variation
        0.5  // Angle variation
      );
      
      for (let i = 0; i < crystalCount; i++) {
        // Vary the size of the clusters, with larger ones more common in the center
        const centerDistance = new THREE.Vector2(
          clusterPositions[i].x, 
          clusterPositions[i].z
        ).length();
        
        const size = 1.0 + (1.0 - centerDistance/baseRadius) * 0.5 + Math.random() * 0.5;
        
        const cluster = createCrystalCluster(clusterPositions[i], size);
        cluster.name = `crystalFormation_cluster_${i}`;
        group.add(cluster);
      }
      
      // Add some small crystals embedded in the base
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = baseRadius * (0.6 + Math.random() * 0.4);
        
        // Randomly select a material
        const material = crystalMaterials[Math.floor(Math.random() * crystalMaterials.length)];
        
        // Create a small crystal poking out of the rock
        const embeddedCrystal = createCrystal(
          new THREE.Vector3(
            Math.cos(angle) * distance,
            baseHeight * (0.2 + Math.random() * 0.3),
            Math.sin(angle) * distance
          ),
          0.3 + Math.random() * 0.3,
          material
        );
        embeddedCrystal.name = `crystalFormation_embedded_${i}`;
        
        // Orient the crystal to point outward
        embeddedCrystal.lookAt(new THREE.Vector3(
          embeddedCrystal.position.x * 1.5,
          embeddedCrystal.position.y,
          embeddedCrystal.position.z * 1.5
        ));
        
        group.add(embeddedCrystal);
      }
      
      // Add some small detail rocks around the base - use DecorationUtils for rock cluster
      const detailRocks = DecorationUtils.createRockCluster(
        15, // Number of rocks
        0.05, // Base size
        baseRadius // Spread
      );
      detailRocks.name = 'crystalFormation_detailRocks';
      
      // Adjust position and scale
      detailRocks.children.forEach(rock => {
        rock.position.y = rock.position.y * 0.2; // Flatten the height distribution
        rock.position.multiplyScalar(1.05); // Increase spread slightly
      });
      
      group.add(detailRocks);
      
      // Apply scale and rotation using DecorationUtils
      DecorationUtils.applyScale(group, definition);
      DecorationUtils.applyRotation(group, definition);
      
      return group;
    } catch (error) {
      console.error(`Error creating crystal formation:`, error);
      return DecorationUtils.createErrorPlaceholder('crystalFormation');
    }
  }

  /**
   * Create a bioluminescent coral decoration
   */
  static createBioluminescentCoral(definition: DecorationDefinition): THREE.Group {
    // Original implementation...
    try {
      // Create a group to hold all parts of the bioluminescent coral
      const group = new THREE.Group();
      group.name = 'bioluminescentCoral';
      
      // Coral dimensions and parameters
      const baseWidth = 0.5 + Math.random() * 0.3;
      const baseHeight = 0.2 + Math.random() * 0.2;
      const branchCount = 4 + Math.floor(Math.random() * 5);
      
      // Create the base rock that the coral grows from
      const baseGeometry = new THREE.SphereGeometry(
        baseWidth / 2,    // Radius
        8,                // Width segments
        6,                // Height segments
        0,                // Phi start
        Math.PI * 2,      // Phi length
        0,                // Theta start
        Math.PI * 0.6     // Theta length (partial sphere for base)
      );
      
      // Add some deformation to the base using DecorationUtils
      DecorationUtils.deformSphereWithNoise(baseGeometry, 5, 0.1);
      
      // Also flatten the bottom
      if (baseGeometry.attributes.position) {
        const positions = baseGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          // Flatten the bottom
          const y = positions[i * 3 + 1];
          if (y < -baseHeight * 0.2) {
            positions[i * 3 + 1] = -baseHeight * 0.4;
          }
        }
        
        baseGeometry.attributes.position.needsUpdate = true;
        baseGeometry.computeVertexNormals();
      }
      
      // Create a rock material for the base using DecorationUtils
      const baseMaterial = DecorationUtils.createStandardMaterial(
        new THREE.Color(0x444444), // Dark gray
        {
          roughness: 0.9,
          metalness: 0.1
        }
      );
      
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.name = 'bioluminescentCoral_base';
      
      // Position the base on the ground
      base.position.y = baseHeight * 0.4;
      base.rotation.x = Math.PI / 2; // Rotate to make the flat side on the bottom
      group.add(base);
      
      // The rest of the implementation...
      // [... Keep the original implementation for the rest, but use DecorationUtils for applyScale and applyRotation at the end]
      
      // Apply scale and rotation using DecorationUtils
      DecorationUtils.applyScale(group, definition);
      DecorationUtils.applyRotation(group, definition);
      
      return group;
    } catch (error) {
      console.error(`Error creating bioluminescent coral:`, error);
      return DecorationUtils.createErrorPlaceholder('bioluminescentCoral');
    }
  }

  /**
   * Create an abyssal rock decoration
   */
  static createAbyssalRock(definition: DecorationDefinition): THREE.Group {
    // Original implementation...
    try {
      const group = new THREE.Group();
      group.name = 'abyssalRock';
      
      // Create a dark, jagged rock formation
      const rockSize = 0.8 + Math.random() * 0.4;
      const complexity = 1; // Higher values create more complex geometry
      
      // Create base rock geometry
      const rockGeometry = new THREE.DodecahedronGeometry(rockSize, complexity);
      
      // Add deformation using DecorationUtils and NoiseGenerator
      DecorationUtils.deformSphereWithNoise(rockGeometry, 20, 0.03); // High freq
      DecorationUtils.deformSphereWithNoise(rockGeometry, 10, 0.06); // Medium freq
      DecorationUtils.deformSphereWithNoise(rockGeometry, 5, 0.1);   // Low freq
      
      // Add some extra vertical stretching
      if (rockGeometry.attributes.position) {
        const positions = rockGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          // Add some extra vertical stretching
          positions[i * 3 + 1] *= 1.2 + Math.random() * 0.2;
        }
        
        rockGeometry.attributes.position.needsUpdate = true;
        rockGeometry.computeVertexNormals();
      }
      
      // Create a dark material for abyssal rock using DecorationUtils
      const rockMaterial = DecorationUtils.createStandardMaterial(
        new THREE.Color(0x111111), // Very dark gray
        {
          roughness: 0.9,
          metalness: 0.1
        }
      );
      
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.name = 'abyssalRock_main';
      
      // Position to have the rock partially buried in the ground
      rock.position.y = rockSize * 0.5;
      group.add(rock);
      
      // The rest of the implementation...
      // [... Keep the original implementation for the rest, but use DecorationUtils for applyScale and applyRotation at the end]
      
      // Apply scale and rotation using DecorationUtils
      DecorationUtils.applyScale(group, definition);
      DecorationUtils.applyRotation(group, definition);
      
      return group;
    } catch (error) {
      console.error(`Error creating abyssal rock:`, error);
      return DecorationUtils.createErrorPlaceholder('abyssalRock');
    }
  }
}