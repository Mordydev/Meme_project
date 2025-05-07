import * as THREE from 'three';
import { DecorationDefinition } from '../DecorationDefinitions';

/**
 * Contains factory methods for creating rock-type decorations
 */
export class RockDecorations {
  /**
   * Create a basic rock (type 1)
   */
  static createRock1(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      
      // Create a simple rock from a deformed sphere
      const rockGeometry = new THREE.IcosahedronGeometry(0.5, 2); // Higher detail
      
      // Deform the sphere to create an irregular rock shape
      if (rockGeometry.attributes.position instanceof THREE.BufferAttribute) {
        const positions = rockGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          const x = positions[i * 3];
          const y = positions[i * 3 + 1];
          const z = positions[i * 3 + 2];
          
          // Distance from center
          const length = Math.sqrt(x * x + y * y + z * z);
          
          // Direction from center
          const dx = x / length;
          const dy = y / length;
          const dz = z / length;
          
          // Create various noise components at different frequencies
          // Lower frequencies create the basic shape
          const noise1 = 0.2 * Math.sin(x * 2) * Math.sin(y * 2) * Math.sin(z * 2);
          
          // Higher frequencies add surface details
          const noise2 = 0.1 * Math.sin(x * 8) * Math.sin(y * 8) * Math.sin(z * 8);
          
          // Flatten bottom slightly by compressing y when y is negative
          const flattenBottom = y < 0 ? 0.2 : 0;
          
          positions[i * 3] = dx * (length + noise1 + noise2);
          positions[i * 3 + 1] = dy * (length + noise1 + noise2) - flattenBottom;
          positions[i * 3 + 2] = dz * (length + noise1 + noise2);
        }
        
        rockGeometry.attributes.position.needsUpdate = true;
        rockGeometry.computeVertexNormals();
      }
      
      // Create a material for the rock
      const colorValue = 0.4 + Math.random() * 0.2; // Gray with some variation
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorValue, colorValue, colorValue),
        roughness: 0.9,
        metalness: 0.1
      });
      
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      
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
          
          const mossColor = new THREE.Color(
            0.2 + Math.random() * 0.1, // Low red
            0.5 + Math.random() * 0.3, // Medium-high green
            0.2 + Math.random() * 0.1  // Low blue
          );
          
          const mossMaterial = new THREE.MeshStandardMaterial({
            color: mossColor,
            roughness: 0.8,
            metalness: 0.1
          });
          
          const moss = new THREE.Mesh(mossGeometry, mossMaterial);
          
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
      
      // Apply scale with variation
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      // Apply random rotation around Y axis
      group.rotation.y = Math.random() * definition.rotationVariance;
      
      return group;
    } catch (error) {
      console.error(`Error creating rock1: ${error}`);
      // Create a distinct, visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_rock1";
      return errorMesh;
    }
  }
  
  /**
   * Create a second rock variant (type 2)
   */
  static createRock2(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      
      // Create a more angular rock using a dodecahedron base
      const rockGeometry = new THREE.DodecahedronGeometry(0.5, 1);
      
      // Deform the shape for more natural look
      if (rockGeometry.attributes.position instanceof THREE.BufferAttribute) {
        const positions = rockGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          const x = positions[i * 3];
          const y = positions[i * 3 + 1];
          const z = positions[i * 3 + 2];
          
          // Distance from center
          const length = Math.sqrt(x * x + y * y + z * z);
          
          // Direction from center
          const dx = x / length;
          const dy = y / length;
          const dz = z / length;
          
          // Less deformation than rock1 to keep angular character
          const noise1 = 0.1 * Math.sin(x * 3) * Math.sin(y * 3) * Math.sin(z * 3);
          
          // Sharper detail noise
          const noise2 = 0.05 * Math.sin(x * 12) * Math.sin(y * 12) * Math.sin(z * 12);
          
          // Flatten bottom
          const flattenBottom = y < 0 ? 0.25 : 0;
          
          // Apply deformation
          positions[i * 3] = dx * (length + noise1 + noise2);
          positions[i * 3 + 1] = dy * (length + noise1 + noise2) - flattenBottom;
          positions[i * 3 + 2] = dz * (length + noise1 + noise2);
        }
        
        rockGeometry.attributes.position.needsUpdate = true;
        rockGeometry.computeVertexNormals();
      }
      
      // Create material - slightly more varied color than rock1
      const colorBase = 0.35 + Math.random() * 0.15; // Base gray
      const colorVariation = 0.05; // Add slight color tint
      
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(
          colorBase + (Math.random() - 0.5) * colorVariation,
          colorBase + (Math.random() - 0.5) * colorVariation,
          colorBase + (Math.random() - 0.5) * colorVariation
        ),
        roughness: 0.85,
        metalness: 0.15
      });
      
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      
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
        
        // Sand/debris color
        const debrisColor = new THREE.Color(
          0.7 + Math.random() * 0.2, // High red (sandy)
          0.6 + Math.random() * 0.2, // Med-high green
          0.4 + Math.random() * 0.2  // Medium blue
        );
        
        const debrisMaterial = new THREE.MeshStandardMaterial({
          color: debrisColor,
          roughness: 1.0,
          metalness: 0.0
        });
        
        const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
        
        // Position on top of rock
        debris.position.set(0, 0.7, 0); // Adjust Y value based on rock size
        
        // Apply random rotation
        debris.rotation.y = Math.random() * Math.PI * 2;
        
        group.add(debris);
      }
      
      // Apply scale with variation
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      // Apply random rotation around Y axis
      group.rotation.y = Math.random() * definition.rotationVariance;
      
      return group;
    } catch (error) {
      console.error(`Error creating rock2: ${error}`);
      // Create a distinct, visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_rock2";
      return errorMesh;
    }
  }
  
  /**
   * Create a larger rock formation with multiple rocks
   */
  static createRockFormation(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      
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
            
            // Add perlin-like noise
            const noise = 0.15 * Math.sin(angle * 5) * Math.sin(y * 10);
            
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
      
      // Create material for base - sandy color with rocky texture
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0.6, 0.55, 0.5), // Sandy rock color
        roughness: 0.9,
        metalness: 0.1
      });
      
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = baseHeight / 2; // Half height
      group.add(base);
      
      // Add individual rocks on the base
      for (let i = 0; i < rockCount; i++) {
        // Determine rock type (angular or smooth)
        const isAngular = Math.random() > 0.5;
        const rockGeometry = isAngular 
          ? new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.3, 1)
          : new THREE.IcosahedronGeometry(0.3 + Math.random() * 0.3, 2);
        
        // Deform the rock
        if (rockGeometry.attributes.position instanceof THREE.BufferAttribute) {
          const positions = rockGeometry.attributes.position.array;
          
          for (let j = 0; j < positions.length / 3; j++) {
            const x = positions[j * 3];
            const y = positions[j * 3 + 1];
            const z = positions[j * 3 + 2];
            
            // Distance from center
            const length = Math.sqrt(x * x + y * y + z * z);
            
            // Direction from center
            const dx = x / length;
            const dy = y / length;
            const dz = z / length;
            
            // Apply different noise based on rock type
            let noise;
            if (isAngular) {
              // Less deformation for angular rocks
              noise = 0.1 * Math.sin(x * 4) * Math.sin(y * 4) * Math.sin(z * 4);
            } else {
              // More deformation for smooth rocks
              noise = 0.15 * Math.sin(x * 3) * Math.sin(y * 3) * Math.sin(z * 3);
              // Add higher frequency detail
              noise += 0.05 * Math.sin(x * 10) * Math.sin(y * 10) * Math.sin(z * 10);
            }
            
            // Flatten bottom slightly to sit better on base
            const flattenBottom = y < 0 ? 0.1 : 0;
            
            positions[j * 3] = dx * (length + noise);
            positions[j * 3 + 1] = dy * (length + noise) - flattenBottom;
            positions[j * 3 + 2] = dz * (length + noise);
          }
          
          rockGeometry.attributes.position.needsUpdate = true;
          rockGeometry.computeVertexNormals();
        }
        
        // Create rock material - gray with slight variation
        const colorValue = 0.3 + Math.random() * 0.3; // Darker to lighter gray
        const rockMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(colorValue, colorValue, colorValue * 0.95), // Slight blue tint
          roughness: 0.85 + Math.random() * 0.15,
          metalness: 0.1 + Math.random() * 0.1
        });
        
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        
        // Position rock on the base
        const angle = (i / rockCount) * Math.PI * 2 + Math.random() * 0.5;
        const radius = (0.1 + Math.random() * 0.5) * baseRadius; // Vary distance from center
        
        rock.position.set(
          Math.cos(angle) * radius,
          baseHeight + rock.geometry.boundingSphere!.radius * 0.8, // Account for flattened bottom
          Math.sin(angle) * radius
        );
        
        // Random rotation
        rock.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        );
        
        group.add(rock);
        
        // For larger rocks, sometimes add a smaller rock on top
        if (rock.geometry.boundingSphere!.radius > 0.4 && Math.random() > 0.6) {
          const smallRockGeometry = new THREE.IcosahedronGeometry(0.15 + Math.random() * 0.1, 1);
          
          // Deform small rock
          if (smallRockGeometry.attributes.position instanceof THREE.BufferAttribute) {
            const positions = smallRockGeometry.attributes.position.array;
            
            for (let k = 0; k < positions.length / 3; k++) {
              const x = positions[k * 3];
              const y = positions[k * 3 + 1];
              const z = positions[k * 3 + 2];
              
              // Distance from center
              const length = Math.sqrt(x * x + y * y + z * z);
              
              // Direction
              const dx = x / length;
              const dy = y / length;
              const dz = z / length;
              
              // Apply noise
              const noise = 0.1 * Math.sin(x * 5) * Math.sin(y * 5) * Math.sin(z * 5);
              
              positions[k * 3] = dx * (length + noise);
              positions[k * 3 + 1] = dy * (length + noise);
              positions[k * 3 + 2] = dz * (length + noise);
            }
            
            smallRockGeometry.attributes.position.needsUpdate = true;
            smallRockGeometry.computeVertexNormals();
          }
          
          // Slightly different color from parent rock
          const smallColorValue = colorValue * (0.9 + Math.random() * 0.2);
          const smallRockMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(smallColorValue, smallColorValue, smallColorValue),
            roughness: 0.9,
            metalness: 0.1
          });
          
          const smallRock = new THREE.Mesh(smallRockGeometry, smallRockMaterial);
          
          // Position on top of parent rock
          smallRock.position.set(
            (Math.random() - 0.5) * 0.1,
            rock.geometry.boundingSphere!.radius * 0.7,
            (Math.random() - 0.5) * 0.1
          );
          
          // Random rotation
          smallRock.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
          );
          
          rock.add(smallRock);
        }
      }
      
      // Apply scale with variation
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      // Apply random rotation
      group.rotation.y = Math.random() * definition.rotationVariance;
      
      return group;
    } catch (error) {
      console.error(`Error creating rock formation: ${error}`);
      // Create a distinct, visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_rockFormation";
      return errorMesh;
    }
  }
}