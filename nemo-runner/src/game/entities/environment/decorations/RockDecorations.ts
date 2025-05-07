import * as THREE from 'three';
import { DecorationDefinition } from '../DecorationDefinitions';
import { DecorationUtils } from '../DecorationUtils';

/**
 * Contains factory methods for creating rock-type decorations
 * Refactored to use DecorationUtils for common operations
 */
export class RockDecorations {
  /**
   * Create a basic rock (type 1)
   */
  static createRock1(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      group.name = 'rock1';
      
      // Create a simple rock from a deformed sphere
      const rockGeometry = new THREE.IcosahedronGeometry(0.5, 2); // Higher detail
      
      // Deform the sphere using DecorationUtils
      DecorationUtils.deformSphereWithNoise(rockGeometry, 2, 0.2);
      
      // Apply higher frequency noise for more detailed surface
      DecorationUtils.deformSphereWithNoise(rockGeometry, 8, 0.1);
      
      // Flatten the bottom slightly by modifying positions
      if (rockGeometry.attributes.position instanceof THREE.BufferAttribute) {
        const positions = rockGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          const y = positions[i * 3 + 1];
          
          // Flatten bottom slightly by compressing y when y is negative
          if (y < 0) {
            positions[i * 3 + 1] -= 0.2;
          }
        }
        
        rockGeometry.attributes.position.needsUpdate = true;
        rockGeometry.computeVertexNormals();
      }
      
      // Create a material for the rock using DecorationUtils
      const rockMaterial = DecorationUtils.createStandardMaterial(
        DecorationUtils.createRockColor(),
        {
          roughness: 0.9,
          metalness: 0.1
        }
      );
      
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.name = 'rock1_main';
      
      // Position rock so it sits on the ground
      rock.position.y = 0.4; // Approximate half-height
      
      // Add to group
      group.add(rock);
      
      // Occasionally add small details (moss, barnacles, etc.)
      if (Math.random() > 0.5) {
        // Add some "moss" patches to the rock
        const mossCount = 1 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < mossCount; i++) {
          const mossSize = 0.15 + Math.random() * 0.15;
          const mossGeometry = new THREE.CircleGeometry(mossSize, 8);
          
          // Create moss material using DecorationUtils
          const mossMaterial = DecorationUtils.createStandardMaterial(
            DecorationUtils.createPlantColor('kelp'),
            {
              roughness: 0.8,
              metalness: 0.1
            }
          );
          
          const moss = new THREE.Mesh(mossGeometry, mossMaterial);
          moss.name = `rock1_moss_${i}`;
          
          // Position on a random spot on upper half of rock
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI / 2; // Upper hemisphere only
          const radius = 0.5;
          
          const x = radius * Math.sin(phi) * Math.cos(theta);
          const y = radius * Math.cos(phi) + 0.4; // Adjust for rock position
          const z = radius * Math.sin(phi) * Math.sin(theta);
          
          moss.position.set(x, y, z);
          
          // Orient to face outward from center
          moss.lookAt(x * 2, y * 2, z * 2);
          
          group.add(moss);
        }
      }
      
      // Apply scale and rotation using DecorationUtils
      DecorationUtils.applyScale(group, definition);
      DecorationUtils.applyRotation(group, definition);
      
      return group;
    } catch (error) {
      console.error(`Error creating rock1:`, error);
      return DecorationUtils.createErrorPlaceholder('rock1');
    }
  }
  
  /**
   * Create a second rock variant (type 2)
   */
  static createRock2(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      group.name = 'rock2';
      
      // Create a more angular rock using a dodecahedron base
      const rockGeometry = new THREE.DodecahedronGeometry(0.5, 1);
      
      // Apply less deformation than rock1 to keep angular character
      // Instead of using sine-based deformation, still use noise but with lower intensity
      DecorationUtils.deformSphereWithNoise(rockGeometry, 3, 0.1);
      DecorationUtils.deformSphereWithNoise(rockGeometry, 12, 0.05);
      
      // Flatten bottom manually
      if (rockGeometry.attributes.position instanceof THREE.BufferAttribute) {
        const positions = rockGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          const y = positions[i * 3 + 1];
          
          // Flatten bottom
          if (y < 0) {
            positions[i * 3 + 1] -= 0.25;
          }
        }
        
        rockGeometry.attributes.position.needsUpdate = true;
        rockGeometry.computeVertexNormals();
      }
      
      // Create material with DecorationUtils - slightly darker than rock1
      const rockMaterial = DecorationUtils.createStandardMaterial(
        DecorationUtils.createRockColor(true),
        {
          roughness: 0.85,
          metalness: 0.15
        }
      );
      
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.name = 'rock2_main';
      
      // Position rock so it sits on the ground
      rock.position.y = 0.35; // Approximate half-height
      
      // Apply slight random rotation for X and Z to add variety
      rock.rotation.x = (Math.random() - 0.5) * 0.3;
      rock.rotation.z = (Math.random() - 0.5) * 0.3;
      
      // Add to group
      group.add(rock);
      
      // Sometimes add sediment or debris on top
      if (Math.random() > 0.6) {
        // Create small debris pile on top
        const debrisGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.1, 8);
        
        // Sand/debris color - sandy tone
        const debrisColor = new THREE.Color(
          0.7 + Math.random() * 0.2, // High red (sandy)
          0.6 + Math.random() * 0.2, // Med-high green
          0.4 + Math.random() * 0.2  // Medium blue
        );
        
        const debrisMaterial = DecorationUtils.createStandardMaterial(debrisColor, {
          roughness: 1.0,
          metalness: 0.0
        });
        
        const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
        debris.name = 'rock2_debris';
        
        // Position on top of rock
        debris.position.set(0, 0.7, 0); // Adjust Y value based on rock size
        
        // Apply random rotation
        debris.rotation.y = Math.random() * Math.PI * 2;
        
        group.add(debris);
      }
      
      // Apply scale and rotation using DecorationUtils
      DecorationUtils.applyScale(group, definition);
      DecorationUtils.applyRotation(group, definition);
      
      return group;
    } catch (error) {
      console.error(`Error creating rock2:`, error);
      return DecorationUtils.createErrorPlaceholder('rock2');
    }
  }
  
  /**
   * Create a larger rock formation with multiple rocks
   */
  static createRockFormation(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      group.name = 'rockFormation';
      
      // Create a formation with multiple rocks clustered together
      const rockCount = 3 + Math.floor(Math.random() * 3); // 3-5 rocks
      
      // Create base for formation
      const baseRadius = 0.8;
      const baseHeight = 0.3;
      const baseGeometry = new THREE.CylinderGeometry(baseRadius, baseRadius * 1.1, baseHeight, 12);
      
      // Deform base to make it less regular
      if (baseGeometry.attributes.position instanceof THREE.BufferAttribute) {
        const positions = baseGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          const x = positions[i * 3];
          const y = positions[i * 3 + 1];
          const z = positions[i * 3 + 2];
          
          // Only deform the sides, not top or bottom faces
          if (y > -baseHeight/2 + 0.01 && y < baseHeight/2 - 0.01) {
            // Calculate angle and radius from center
            const angle = Math.atan2(z, x);
            const radius = Math.sqrt(x * x + z * z);
            
            // Add perlin-like noise from NoiseGenerator
            const noise = 0.15 * DecorationUtils.getNoiseGenerator().noise2D(angle * 5, y * 10);
            
            // Direction from center
            const dx = x / radius;
            const dz = z / radius;
            
            // Apply noise
            positions[i * 3] += dx * noise;
            positions[i * 3 + 2] += dz * noise; 
          }
        }
        
        baseGeometry.attributes.position.needsUpdate = true;
        baseGeometry.computeVertexNormals();
      }
      
      // Create material for base with DecorationUtils - sandy color with rocky texture
      const baseMaterial = DecorationUtils.createStandardMaterial(
        new THREE.Color(0.6, 0.55, 0.5), // Sandy rock color
        {
          roughness: 0.9,
          metalness: 0.1
        }
      );
      
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.name = 'rockFormation_base';
      base.position.y = baseHeight / 2; // Half height
      group.add(base);
      
      // Add individual rocks on the base - use radial distribution from DecorationUtils
      const rockPositions = DecorationUtils.distributeRadially(
        rockCount,
        baseRadius * 0.6, // Average radius
        baseHeight,       // Y position on base
        0.7,              // High radius variation
        0.5               // Angle variation
      );
      
      for (let i = 0; i < rockCount; i++) {
        // Determine rock type (angular or smooth)
        const isAngular = Math.random() > 0.5;
        const rockGeometry = isAngular 
          ? new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.3, 1)
          : new THREE.IcosahedronGeometry(0.3 + Math.random() * 0.3, 2);
        
        // Deform the rock using DecorationUtils
        if (isAngular) {
          // Less deformation for angular rocks
          DecorationUtils.deformSphereWithNoise(rockGeometry, 4, 0.1);
        } else {
          // More deformation for smooth rocks
          DecorationUtils.deformSphereWithNoise(rockGeometry, 3, 0.15);
          // Add higher frequency detail
          DecorationUtils.deformSphereWithNoise(rockGeometry, 10, 0.05);
        }
        
        // Flatten bottom slightly
        if (rockGeometry.attributes.position instanceof THREE.BufferAttribute) {
          const positions = rockGeometry.attributes.position.array;
          
          for (let j = 0; j < positions.length / 3; j++) {
            const y = positions[j * 3 + 1];
            
            // Flatten bottom slightly to sit better on base
            if (y < 0) {
              positions[j * 3 + 1] -= 0.1;
            }
          }
          
          rockGeometry.attributes.position.needsUpdate = true;
          rockGeometry.computeVertexNormals();
        }
        
        // Create rock material using DecorationUtils
        const rockMaterial = DecorationUtils.createStandardMaterial(
          DecorationUtils.createRockColor(Math.random() > 0.5), // Randomly choose darker or lighter
          {
            roughness: 0.85 + Math.random() * 0.15,
            metalness: 0.1 + Math.random() * 0.1
          }
        );
        
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.name = `rockFormation_rock_${i}`;
        
        // Position rock using the pre-calculated positions
        rock.position.copy(rockPositions[i]);
        rock.position.y += rock.geometry.boundingSphere!.radius * 0.8; // Adjust for rock height
        
        // Random rotation
        rock.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        );
        
        group.add(rock);
        
        // For larger rocks, sometimes add a smaller rock on top
        if (rock.geometry.boundingSphere!.radius > 0.4 && Math.random() > 0.6) {
          // Use DecorationUtils.createRockCluster for small rock instead of creating manually
          const smallRocks = DecorationUtils.createRockCluster(
            1 + Math.floor(Math.random() * 2), // 1-2 small rocks
            0.15 + Math.random() * 0.1,        // Base size
            0.05                               // Small spread
          );
          smallRocks.name = `rockFormation_smallRocks_${i}`;
          
          // Position on top of parent rock
          smallRocks.position.set(
            (Math.random() - 0.5) * 0.1,
            rock.geometry.boundingSphere!.radius * 0.7,
            (Math.random() - 0.5) * 0.1
          );
          
          rock.add(smallRocks);
        }
      }
      
      // Apply scale and rotation using DecorationUtils
      DecorationUtils.applyScale(group, definition);
      DecorationUtils.applyRotation(group, definition);
      
      return group;
    } catch (error) {
      console.error(`Error creating rock formation:`, error);
      return DecorationUtils.createErrorPlaceholder('rockFormation');
    }
  }
}