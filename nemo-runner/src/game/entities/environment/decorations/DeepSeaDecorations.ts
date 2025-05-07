import * as THREE from 'three';
import { DecorationDefinition } from '../DecorationDefinitions';

/**
 * Contains factory methods for creating deep sea-type decorations
 */
export class DeepSeaDecorations {
  /**
   * Create a deep sea vent
   */
  static createDeepSeaVent(definition: DecorationDefinition): THREE.Group {
    try {
      // Create a group to hold all parts of the deep sea vent
      const group = new THREE.Group();
      
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
      
      // Create a rocky material for the vent
      const ventMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x333333),  // Dark gray
        roughness: 0.9,
        metalness: 0.2
      });
      
      const vent = new THREE.Mesh(ventGeometry, ventMaterial);
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
      
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x222222),  // Slightly darker than the vent
        roughness: 1.0,
        metalness: 0.1
      });
      
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = ventHeight * 0.05;
      group.add(base);
      
      // Add some mineral deposits around the vent
      const mineralMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xccbb88),  // Yellow-brown mineral color
        roughness: 0.7,
        metalness: 0.4
      });
      
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
      
      // Create varied particle materials
      const particleMaterials = [
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(0x111111), // Dark smoke
          transparent: true,
          opacity: 0.7,
          roughness: 1.0,
          metalness: 0.0
        }),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(0x222222), // Medium smoke
          transparent: true,
          opacity: 0.6,
          roughness: 1.0,
          metalness: 0.0
        }),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(0x444444), // Light smoke
          transparent: true,
          opacity: 0.5,
          roughness: 1.0,
          metalness: 0.0
        })
      ];
      
      // Create "smoke" particles
      for (let i = 0; i < particleCount; i++) {
        const particleSize = 0.1 + Math.random() * 0.15;
        const particleGeometry = new THREE.SphereGeometry(particleSize, 4, 4);
        
        // Select a random material for variety
        const materialIndex = Math.floor(Math.random() * particleMaterials.length);
        const particle = new THREE.Mesh(particleGeometry, particleMaterials[materialIndex]);
        
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
      
      // Add glowing effects at the top opening
      const glowMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xff4400),  // Orange-red glow
        emissive: new THREE.Color(0xff2200),
        emissiveIntensity: 0.5,
        roughness: 0.7,
        metalness: 0.3
      });
      
      // Create a rim of glowing material at the top opening
      const glowRimGeometry = new THREE.TorusGeometry(
        topRadius * 0.9,  // Radius of the torus
        topRadius * 0.15, // Thickness
        8,                // Radial segments
        12                // Tubular segments
      );
      
      const glowRim = new THREE.Mesh(glowRimGeometry, glowMaterial);
      glowRim.position.y = ventHeight;
      glowRim.rotation.x = Math.PI / 2;
      group.add(glowRim);
      
      // Add some small glowing cracks on the vent surface
      for (let i = 0; i < 8; i++) {
        // Create a simple line geometry for each crack
        const crackGeometry = new THREE.BoxGeometry(0.02, 0.1 + Math.random() * 0.15, 0.02);
        const crack = new THREE.Mesh(crackGeometry, glowMaterial);
        
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
      
      // Apply scale from definition
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      // Apply random rotation around Y axis
      group.rotation.y = Math.random() * definition.rotationVariance;
      
      return group;
    } catch (error) {
      console.error(`Error creating deep sea vent: ${error}`);
      // Create a visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_deepsea_vent";
      return errorMesh;
    }
  }

  /**
   * Create a glowing plant
   */
  static createGlowingPlant(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      
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
      
      // Apply some curvature to the stem
      if (stemGeometry.attributes.position) {
        const positions = stemGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          const y = positions[i * 3 + 1];
          
          // Skip top and bottom vertices
          if (y < stemHeight/2 - 0.02 && y > -stemHeight/2 + 0.02) {
            // Normalize height position (0 at bottom, 1 at top)
            const normalizedY = (y + stemHeight/2) / stemHeight;
            
            // Apply increasing curve as we go up
            const curveFactor = Math.pow(normalizedY, 2) * 0.15;
            
            // Apply curve in X direction with some random noise
            positions[i * 3] += curveFactor + Math.sin(normalizedY * 10) * 0.01;
            
            // Add some Z curve for a more natural look
            positions[i * 3 + 2] += Math.sin(normalizedY * 8) * 0.02;
          }
        }
        
        stemGeometry.attributes.position.needsUpdate = true;
        stemGeometry.computeVertexNormals();
      }
      
      // Choose a glow color - deep sea plants often have bioluminescence
      // Pick a bright, vibrant color
      const glowColors = [
        { main: 0x00ffff, emissive: 0x00aaaa }, // Cyan
        { main: 0xff00ff, emissive: 0xaa00aa }, // Magenta  
        { main: 0x66ffaa, emissive: 0x33aa66 }, // Aqua-green
        { main: 0xaaaaff, emissive: 0x6666dd }  // Light blue
      ];
      
      const colorSet = glowColors[Math.floor(Math.random() * glowColors.length)];
      
      // Create glowing material
      const plantMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorSet.main),
        emissive: new THREE.Color(colorSet.emissive),
        emissiveIntensity: 0.8,
        roughness: 0.7,
        metalness: 0.3,
        transparent: true,
        opacity: 0.9
      });
      
      const stem = new THREE.Mesh(stemGeometry, plantMaterial);
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
        
        // Create a brighter material for the bulbs
        const bulbMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(colorSet.main),
          emissive: new THREE.Color(colorSet.emissive),
          emissiveIntensity: 1.0, // More intense glow
          roughness: 0.5,
          metalness: 0.4,
          transparent: true,
          opacity: 0.95
        });
        
        const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
        
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
      const particleCount = 6 + Math.floor(Math.random() * 6);
      
      for (let i = 0; i < particleCount; i++) {
        const particleSize = 0.01 + Math.random() * 0.02;
        const particleGeometry = new THREE.SphereGeometry(particleSize, 4, 4);
        
        // Brighter, more transparent material for particles
        const particleMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(colorSet.main),
          emissive: new THREE.Color(colorSet.emissive),
          emissiveIntensity: 1.2,
          transparent: true,
          opacity: 0.7
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Position particles around the plant
        const distance = 0.1 + Math.random() * 0.2;
        const height = Math.random() * stemHeight;
        const angle = Math.random() * Math.PI * 2;
        
        particle.position.set(
          Math.cos(angle) * distance,
          height,
          Math.sin(angle) * distance
        );
        
        group.add(particle);
      }
      
      // Apply scale from definition
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      // Apply random rotation around Y axis
      group.rotation.y = Math.random() * definition.rotationVariance;
      
      return group;
    } catch (error) {
      console.error(`Error creating glowing plant: ${error}`);
      // Create a visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_glowingPlant";
      return errorMesh;
    }
  }

  /**
   * Create a crystal formation decoration
   */
  static createCrystalFormation(definition: DecorationDefinition): THREE.Group {
    try {
      // Create a group to hold all parts of the crystal formation
      const group = new THREE.Group();
      
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
      
      // Create a rocky material for the base
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x555555),  // Dark gray
        roughness: 0.9,
        metalness: 0.2
      });
      
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
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
      
      const crystalMaterials = crystalColors.map(color => 
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          emissive: new THREE.Color(color).multiplyScalar(0.2), // Slight glow
          emissiveIntensity: 0.5,
          roughness: 0.2,
          metalness: 0.8,
          transparent: true,
          opacity: 0.8
        })
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
      
      // Create several crystal clusters on the base
      for (let i = 0; i < crystalCount; i++) {
        // Distribute clusters across the base with more concentration toward the center
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.pow(Math.random(), 0.7) * baseRadius * 0.8;
        
        const clusterPosition = new THREE.Vector3(
          Math.cos(angle) * distance,
          baseHeight/2 + Math.random() * 0.05,
          Math.sin(angle) * distance
        );
        
        // Vary the size of the clusters, with larger ones more common in the center
        const size = 1.0 + (1.0 - distance/baseRadius) * 0.5 + Math.random() * 0.5;
        
        const cluster = createCrystalCluster(clusterPosition, size);
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
        
        // Orient the crystal to point outward
        embeddedCrystal.lookAt(new THREE.Vector3(
          embeddedCrystal.position.x * 1.5,
          embeddedCrystal.position.y,
          embeddedCrystal.position.z * 1.5
        ));
        
        group.add(embeddedCrystal);
      }
      
      // Add some small detail rocks around the base
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x666666),  // Slightly lighter than the base
        roughness: 0.8,
        metalness: 0.1
      });
      
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = baseRadius * (0.9 + Math.random() * 0.3);
        
        const rockSize = 0.03 + Math.random() * 0.06;
        const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
        
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        
        rock.position.set(
          Math.cos(angle) * distance,
          rockSize * 0.5 * Math.random(),
          Math.sin(angle) * distance
        );
        
        // Random rotation
        rock.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        );
        
        group.add(rock);
      }
      
      // Apply scale from definition
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      // Apply random rotation around Y axis
      group.rotation.y = Math.random() * definition.rotationVariance;
      
      return group;
    } catch (error) {
      console.error(`Error creating crystal formation: ${error}`);
      // Create a visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_crystalFormation";
      return errorMesh;
    }
  }

  /**
   * Create a bioluminescent coral decoration
   */
  static createBioluminescentCoral(definition: DecorationDefinition): THREE.Group {
    try {
      // Create a group to hold all parts of the bioluminescent coral
      const group = new THREE.Group();
      
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
      
      // Add some deformation to the base
      if (baseGeometry.attributes.position) {
        const positions = baseGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          // Skip the bottom vertices
          const y = positions[i * 3 + 1];
          if (y > -baseHeight * 0.4) {
            // Deform for a more natural rocky look
            const noise = (Math.random() - 0.5) * 0.1;
            positions[i * 3] += noise;
            positions[i * 3 + 2] += noise;
            
            // Flatten the bottom slightly
            if (y < -baseHeight * 0.2) {
              positions[i * 3 + 1] = -baseHeight * 0.4;
            }
          }
        }
        
        baseGeometry.attributes.position.needsUpdate = true;
        baseGeometry.computeVertexNormals();
      }
      
      // Create a rock material for the base
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x444444),  // Dark gray
        roughness: 0.9,
        metalness: 0.1
      });
      
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      
      // Position the base on the ground
      base.position.y = baseHeight * 0.4;
      base.rotation.x = Math.PI / 2; // Rotate to make the flat side on the bottom
      group.add(base);
      
      // Create luminescent coral branches
      
      // Define different coral colors with matching emissive properties
      const coralTypes = [
        {
          color: 0x00ffff,       // Cyan
          emissive: 0x00aaaa,    // Matching emissive
          name: 'cyan'
        },
        {
          color: 0xff00ff,       // Magenta
          emissive: 0xaa00aa,    // Matching emissive
          name: 'magenta'
        },
        {
          color: 0x00ff99,       // Teal
          emissive: 0x00aa66,    // Matching emissive
          name: 'teal'
        },
        {
          color: 0x9966ff,       // Purple
          emissive: 0x6644aa,    // Matching emissive
          name: 'purple'
        }
      ];
      
      // Choose a main color for this coral instance
      const mainCoralType = coralTypes[Math.floor(Math.random() * coralTypes.length)];
      
      // Function to create a coral branch
      const createCoralBranch = (position: THREE.Vector3, direction: THREE.Vector3, height: number, thickness: number, coralType: any) => {
        // Create a group for this branch
        const branchGroup = new THREE.Group();
        branchGroup.position.copy(position);
        
        // The main branch geometry (curved cylinder)
        const branchGeometry = new THREE.CylinderGeometry(
          thickness * 0.7,    // Top radius (tapered)
          thickness,          // Bottom radius
          height,             // Height
          8,                  // Radial segments
          5,                  // Height segments
          false               // Open-ended
        );
        
        // Curve the branch by adjusting vertices
        if (branchGeometry.attributes.position) {
          const positions = branchGeometry.attributes.position.array;
          
          // Calculate a curve direction perpendicular to the main direction
          const curveAxis = new THREE.Vector3(1, 0, 0);
          if (Math.abs(direction.dot(curveAxis)) > 0.9) {
            curveAxis.set(0, 0, 1); // Use a different axis if too parallel
          }
          
          // Get perpendicular vector
          const perpendicular = new THREE.Vector3().crossVectors(direction, curveAxis).normalize();
          
          // Add curve and some noise to the branch
          for (let i = 0; i < positions.length / 3; i++) {
            const y = positions[i * 3 + 1];
            const normalizedY = (y + height/2) / height; // 0 at bottom, 1 at top
            
            // Apply progressive curve along the branch
            const curveFactor = Math.pow(normalizedY, 2) * height * 0.3;
            const bendDirection = perpendicular.clone().multiplyScalar(curveFactor);
            
            positions[i * 3] += bendDirection.x;
            positions[i * 3 + 2] += bendDirection.z;
            
            // Add some noise for organic look
            const noise = (Math.sin(normalizedY * 15) * 0.02);
            positions[i * 3] += noise;
            positions[i * 3 + 2] += noise;
          }
          
          branchGeometry.attributes.position.needsUpdate = true;
          branchGeometry.computeVertexNormals();
        }
        
        // Create a glowing material for the coral
        const branchMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(coralType.color),
          emissive: new THREE.Color(coralType.emissive),
          emissiveIntensity: 0.6,
          roughness: 0.7,
          metalness: 0.2
        });
        
        const branch = new THREE.Mesh(branchGeometry, branchMaterial);
        
        // Orient the branch in the direction vector
        branch.position.y = height/2;
        branch.lookAt(direction.clone().multiplyScalar(height).add(branch.position));
        
        branchGroup.add(branch);
        
        // Add some smaller offshoots to the branch
        const offshootCount = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < offshootCount; i++) {
          // Position along the main branch
          const offshootPos = new THREE.Vector3(0, height * (0.3 + Math.random() * 0.5), 0);
          
          // Direction - angled outward from main branch
          const angle = Math.random() * Math.PI * 2;
          const outwardDir = new THREE.Vector3(
            Math.cos(angle) * 0.8,
            0.6 + Math.random() * 0.4,
            Math.sin(angle) * 0.8
          ).normalize();
          
          // Create a smaller offshoot
          const offshootHeight = height * (0.3 + Math.random() * 0.3);
          const offshootThickness = thickness * (0.4 + Math.random() * 0.3);
          
          // Occasionally use a different color variant for offshoots
          const useVariantColor = Math.random() > 0.7;
          let offshootCoralType = coralType;
          
          if (useVariantColor) {
            // Pick a different color than the main branch
            let variantIndex;
            do {
              variantIndex = Math.floor(Math.random() * coralTypes.length);
            } while (coralTypes[variantIndex].name === coralType.name);
            
            offshootCoralType = coralTypes[variantIndex];
          }
          
          // Create the offshoot with its own material
          const offshootGeometry = new THREE.CylinderGeometry(
            offshootThickness * 0.5, // Top radius (more tapered)
            offshootThickness,       // Bottom radius
            offshootHeight,          // Height
            7,                       // Radial segments
            3,                       // Height segments
            false                    // Open-ended
          );
          
          // Curve the offshoot
          if (offshootGeometry.attributes.position) {
            const positions = offshootGeometry.attributes.position.array;
            
            for (let j = 0; j < positions.length / 3; j++) {
              const y = positions[j * 3 + 1];
              const normalizedY = (y + offshootHeight/2) / offshootHeight;
              
              // Curve and taper more at the top
              const curveFactor = Math.pow(normalizedY, 1.5) * 0.1;
              positions[j * 3] += curveFactor;
              
              // Add some noise
              const noise = (Math.sin(normalizedY * 10) * 0.015);
              positions[j * 3] += noise;
              positions[j * 3 + 2] += noise;
            }
            
            offshootGeometry.attributes.position.needsUpdate = true;
            offshootGeometry.computeVertexNormals();
          }
          
          // Create the offshoot material with slight variations
          const offshootMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(offshootCoralType.color),
            emissive: new THREE.Color(offshootCoralType.emissive),
            emissiveIntensity: 0.7, // Slightly more intense glow for smaller parts
            roughness: 0.7,
            metalness: 0.2
          });
          
          const offshoot = new THREE.Mesh(offshootGeometry, offshootMaterial);
          
          // Position at offset from branch
          offshoot.position.copy(offshootPos);
          
          // Orient in the outward direction
          offshoot.position.y -= offshootHeight/2;
          offshoot.lookAt(outwardDir.clone().multiplyScalar(offshootHeight).add(offshoot.position));
          offshoot.position.y += offshootHeight/2;
          
          branchGroup.add(offshoot);
          
          // Add some small polyps at the tips
          const polypsGeometry = new THREE.SphereGeometry(
            offshootThickness * 0.8,
            6,
            6
          );
          
          // Material for the polyps - brighter and more glowing
          const polypsMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(offshootCoralType.color),
            emissive: new THREE.Color(offshootCoralType.emissive),
            emissiveIntensity: 1.0, // Maximum glow at the tips
            roughness: 0.6,
            metalness: 0.3
          });
          
          const polyps = new THREE.Mesh(polypsGeometry, polypsMaterial);
          
          // Position at the top of the offshoot
          polyps.position.set(
            0,
            offshootHeight + offshootThickness * 0.3,
            0
          );
          
          offshoot.add(polyps);
        }
        
        return branchGroup;
      };
      
      // Create main coral branches
      for (let i = 0; i < branchCount; i++) {
        // Position on the base rock
        const angle = (i / branchCount) * Math.PI * 2 + Math.random() * 0.5;
        const radius = baseWidth * (0.2 + Math.random() * 0.3);
        
        const branchPos = new THREE.Vector3(
          Math.cos(angle) * radius,
          baseHeight * 0.5 * Math.random(),
          Math.sin(angle) * radius
        );
        
        // Direction - outward and upward
        const direction = new THREE.Vector3(
          Math.cos(angle),
          0.8 + Math.random() * 1.2, // Mostly upward
          Math.sin(angle)
        ).normalize();
        
        // Vary sizes for natural look
        const branchHeight = 0.5 + Math.random() * 0.7;
        const branchThickness = 0.05 + Math.random() * 0.05;
        
        // Occasionally use a variant color branch
        const useVariantColor = Math.random() > 0.6;
        let branchCoralType = mainCoralType;
        
        if (useVariantColor) {
          // Pick a different color than the main type
          let variantIndex;
          do {
            variantIndex = Math.floor(Math.random() * coralTypes.length);
          } while (coralTypes[variantIndex].name === mainCoralType.name);
          
          branchCoralType = coralTypes[variantIndex];
        }
        
        const branch = createCoralBranch(branchPos, direction, branchHeight, branchThickness, branchCoralType);
        group.add(branch);
      }
      
      // Add some pulsing polyps directly on the base rock
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = baseWidth * (0.2 + Math.random() * 0.4);
        
        // Use the main coral color
        const polypMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(mainCoralType.color),
          emissive: new THREE.Color(mainCoralType.emissive),
          emissiveIntensity: 0.9,
          roughness: 0.6,
          metalness: 0.3
        });
        
        const polypSize = 0.05 + Math.random() * 0.04;
        const polypGeometry = new THREE.SphereGeometry(polypSize, 6, 6);
        
        const polyp = new THREE.Mesh(polypGeometry, polypMaterial);
        
        // Position on the rock surface
        const yRise = Math.random() * baseHeight * 0.3;
        polyp.position.set(
          Math.cos(angle) * radius,
          baseHeight * 0.5 + yRise,
          Math.sin(angle) * radius
        );
        
        // Random slight squashing 
        polyp.scale.y = 0.7 + Math.random() * 0.3;
        
        group.add(polyp);
      }
      
      // Apply scale from definition
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      // Apply random rotation around Y axis
      group.rotation.y = Math.random() * definition.rotationVariance;
      
      return group;
    } catch (error) {
      console.error(`Error creating bioluminescent coral: ${error}`);
      // Create a visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_bioluminescentCoral";
      return errorMesh;
    }
  }

  /**
   * Create an abyssal rock decoration
   */
  static createAbyssalRock(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      
      // Create a dark, jagged rock formation
      const rockSize = 0.8 + Math.random() * 0.4;
      const complexity = 1; // Higher values create more complex geometry
      
      // Create base rock geometry
      const rockGeometry = new THREE.DodecahedronGeometry(rockSize, complexity);
      
      // Add deformation to make it more jagged and irregular
      if (rockGeometry.attributes.position) {
        const positions = rockGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          const x = positions[i * 3];
          const y = positions[i * 3 + 1];
          const z = positions[i * 3 + 2];
          
          // Calculate distance from center
          const distance = Math.sqrt(x * x + y * y + z * z);
          
          // Calculate normalized direction
          const nx = x / distance;
          const ny = y / distance;
          const nz = z / distance;
          
          // Add noise with multiple frequencies for a more jagged appearance
          const highFreqNoise = Math.sin(x * 20) * Math.sin(y * 20) * Math.sin(z * 20) * 0.03;
          const medFreqNoise = Math.sin(x * 10) * Math.sin(y * 10) * Math.sin(z * 10) * 0.06;
          const lowFreqNoise = Math.sin(x * 5) * Math.sin(y * 5) * Math.sin(z * 5) * 0.1;
          
          const totalNoise = highFreqNoise + medFreqNoise + lowFreqNoise;
          
          // Apply noise to vertex
          positions[i * 3] = nx * (distance + totalNoise);
          positions[i * 3 + 1] = ny * (distance + totalNoise);
          positions[i * 3 + 2] = nz * (distance + totalNoise);
          
          // Add some extra vertical stretching
          positions[i * 3 + 1] *= 1.2 + Math.random() * 0.2;
        }
        
        rockGeometry.attributes.position.needsUpdate = true;
        rockGeometry.computeVertexNormals();
      }
      
      // Create a dark material for abyssal rock
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x111111),  // Very dark gray
        roughness: 0.9,
        metalness: 0.1
      });
      
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      
      // Position to have the rock partially buried in the ground
      rock.position.y = rockSize * 0.5;
      group.add(rock);
      
      // Add some mineral striations or veins to the rock
      const veinColors = [
        0x333333, // Dark gray
        0x444444, // Medium gray
        0x222222  // Slightly lighter
      ];
      
      // Add veins throughout the rock
      const veinCount = 4 + Math.floor(Math.random() * 4);
      
      for (let i = 0; i < veinCount; i++) {
        // Choose a random color for this vein
        const veinColor = veinColors[Math.floor(Math.random() * veinColors.length)];
        
        const veinMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(veinColor),
          roughness: 0.7,
          metalness: 0.2
        });
        
        // Create a thin, curving vein
        const veinWidth = 0.05 + Math.random() * 0.1;
        const veinLength = rockSize * (0.5 + Math.random() * 0.5);
        
        // Create a simple box for the vein
        const veinGeometry = new THREE.BoxGeometry(veinWidth, veinLength, veinWidth);
        
        // Deform the vein to make it curve
        if (veinGeometry.attributes.position) {
          const positions = veinGeometry.attributes.position.array;
          
          for (let j = 0; j < positions.length / 3; j++) {
            const y = positions[j * 3 + 1];
            
            // Normalize y position
            const normalizedY = (y + veinLength / 2) / veinLength;
            
            // Apply a sine curve
            const curve = Math.sin(normalizedY * Math.PI * 2) * 0.1;
            
            positions[j * 3] += curve;
            positions[j * 3 + 2] += curve * 0.5;
          }
          
          veinGeometry.attributes.position.needsUpdate = true;
          veinGeometry.computeVertexNormals();
        }
        
        const vein = new THREE.Mesh(veinGeometry, veinMaterial);
        
        // Position the vein randomly in the rock
        const angle = Math.random() * Math.PI * 2;
        const distance = rockSize * Math.random() * 0.6;
        
        vein.position.set(
          Math.cos(angle) * distance,
          rockSize * (Math.random() - 0.3), // Slight bias toward lower part
          Math.sin(angle) * distance
        );
        
        // Random rotation
        vein.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI
        );
        
        rock.add(vein);
      }
      
      // Add some small "air bubbles" or geological features
      for (let i = 0; i < 12; i++) {
        const bubbleSize = 0.05 + Math.random() * 0.07;
        const bubbleGeometry = new THREE.SphereGeometry(bubbleSize, 6, 6);
        
        const bubbleMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(0x000000),  // Black
          roughness: 0.9,
          metalness: 0.1
        });
        
        const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        
        // Position randomly throughout the rock
        const angle = Math.random() * Math.PI * 2;
        const heightAngle = Math.random() * Math.PI;
        const distance = rockSize * 0.8 * Math.random();
        
        bubble.position.set(
          Math.cos(angle) * Math.sin(heightAngle) * distance,
          Math.cos(heightAngle) * distance,
          Math.sin(angle) * Math.sin(heightAngle) * distance
        );
        
        rock.add(bubble);
      }
      
      // Sometimes add a small amount of glowing cracks (lava/heat effect)
      if (Math.random() > 0.6) {
        const crackMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(0xff3300),  // Orange-red
          emissive: new THREE.Color(0xff1100),
          emissiveIntensity: 0.8,
          roughness: 0.9,
          metalness: 0.1
        });
        
        const crackCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < crackCount; i++) {
          // Create thin, irregular crack
          const crackWidth = 0.02 + Math.random() * 0.02;
          const crackLength = 0.1 + Math.random() * 0.2;
          const crackDepth = 0.02;
          
          const crackGeometry = new THREE.BoxGeometry(crackWidth, crackLength, crackDepth);
          
          // Make the crack irregular
          if (crackGeometry.attributes.position) {
            const positions = crackGeometry.attributes.position.array;
            
            for (let j = 0; j < positions.length / 3; j++) {
              // Add irregular edges
              positions[j * 3] += (Math.random() - 0.5) * 0.01;
              positions[j * 3 + 1] += (Math.random() - 0.5) * 0.02;
              positions[j * 3 + 2] += (Math.random() - 0.5) * 0.01;
            }
            
            crackGeometry.attributes.position.needsUpdate = true;
            crackGeometry.computeVertexNormals();
          }
          
          const crack = new THREE.Mesh(crackGeometry, crackMaterial);
          
          // Position on the rock surface
          const angle = Math.random() * Math.PI * 2;
          const heightAngle = Math.random() * Math.PI * 0.8; // Biased toward lower half
          const distance = rockSize * 0.9; // Near surface
          
          crack.position.set(
            Math.cos(angle) * Math.sin(heightAngle) * distance,
            Math.cos(heightAngle) * distance,
            Math.sin(angle) * Math.sin(heightAngle) * distance
          );
          
          // Orient crack to face outward
          crack.lookAt(new THREE.Vector3(0, 0, 0));
          
          // Random rotation around normal
          crack.rotateOnWorldAxis(
            crack.position.clone().normalize(),
            Math.random() * Math.PI * 2
          );
          
          rock.add(crack);
        }
      }
      
      // Apply scale from definition
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      // Apply random rotation around Y axis
      group.rotation.y = Math.random() * definition.rotationVariance;
      
      return group;
    } catch (error) {
      console.error(`Error creating abyssal rock: ${error}`);
      // Create a visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_abyssalRock";
      return errorMesh;
    }
  }
}