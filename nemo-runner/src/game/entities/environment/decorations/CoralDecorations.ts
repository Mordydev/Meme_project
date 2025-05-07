import * as THREE from 'three';
import { DecorationDefinition } from '../DecorationDefinitions';
import { DecorationUtils } from '../DecorationUtils';

/**
 * Contains factory methods for creating coral-type decorations
 * Refactored to use DecorationUtils for common operations
 */
export class CoralDecorations {
  /**
   * Create a coral formation of type 1
   */
  static createCoral1(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      group.name = 'coral1';
      
      // Base shape with several branches
      const branchCount = 3 + Math.floor(Math.random() * 4); // 3-6 branches
      
      for (let i = 0; i < branchCount; i++) {
        try {
          const heightScale = 0.5 + Math.random() * 0.5;
          const geometry = new THREE.CylinderGeometry(0.05, 0.2, 1.0 * heightScale, 8);
          
          // Use DecorationUtils for coral colors
          const color = DecorationUtils.createPlantColor('coral');
          const material = DecorationUtils.createStandardMaterial(color, {
            roughness: 0.8,
            metalness: 0.2
          });
          
          const branch = new THREE.Mesh(geometry, material);
          branch.name = `coral1_branch_${i}`;
          
          // Position branch - use DecorationUtils for radial distribution
          const positions = DecorationUtils.distributeRadially(
            1,                 // Just need one position
            0.2 + Math.random() * 0.2, // Radius
            heightScale * 0.5, // Y position - half height
            0,                 // No radius variation (already handled)
            0                  // No angle variation (using fixed pattern)
          );
          
          branch.position.copy(positions[0]);
          branch.position.x = Math.cos((i / branchCount) * Math.PI * 2) * positions[0].x;
          branch.position.z = Math.sin((i / branchCount) * Math.PI * 2) * positions[0].x;
          
          // Random rotation
          branch.rotation.set(
            (Math.random() - 0.5) * 0.5,
            0,
            (Math.random() - 0.5) * 0.5
          );
          
          group.add(branch);
        } catch (branchError) {
          console.warn(`Error creating branch ${i} for coral1:`, branchError);
          // Continue with other branches - a missing branch is not fatal
        }
      }
      
      // If no branches were successfully created, throw an error to trigger fallback
      if (group.children.length === 0) {
        throw new Error("Failed to create any branches for coral1");
      }
      
      try {
        // Apply scale and rotation using DecorationUtils
        DecorationUtils.applyScale(group, definition);
        DecorationUtils.applyRotation(group, definition);
      } catch (transformError) {
        console.warn(`Error applying transform to coral1:`, transformError);
        // Continue without scaling if there's an error - the coral will still be visible
      }
      
      return group;
    } catch (error) {
      console.error(`Error creating coral1:`, error);
      return DecorationUtils.createErrorPlaceholder('coral1');
    }
  }
  
  /**
   * Create a coral formation of type 2 (brain coral)
   */
  static createCoral2(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      group.name = 'coral2';
      
      // Brain coral like structure
      const geometry = new THREE.SphereGeometry(0.5, 16, 16);
      
      // Add wrinkles to the surface using DecorationUtils
      DecorationUtils.deformSphereWithNoise(geometry, 10, 0.1);
      
      // Create coral material with DecorationUtils
      const color = DecorationUtils.createPlantColor('coral');
      const material = DecorationUtils.createStandardMaterial(color, {
        roughness: 0.7,
        metalness: 0.3
      });
      
      const coral = new THREE.Mesh(geometry, material);
      coral.name = 'coral2_brain';
      
      // Add to group
      group.add(coral);
      
      // Add a base
      const baseGeometry = new THREE.CylinderGeometry(0.5, 0.7, 0.3, 8);
      const baseMaterial = DecorationUtils.createStandardMaterial(
        color.clone().multiplyScalar(0.8), // Darker version of same color
        {
          roughness: 0.9,
          metalness: 0.1
        }
      );
      
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.name = 'coral2_base';
      base.position.y = -0.5 - 0.15; // Half of coral height + half of base height
      group.add(base);
      
      // Apply scale and rotation using DecorationUtils
      DecorationUtils.applyScale(group, definition);
      DecorationUtils.applyRotation(group, definition);
      
      return group;
    } catch (error) {
      console.error(`Error creating coral2:`, error);
      return DecorationUtils.createErrorPlaceholder('coral2');
    }
  }
  
  /**
   * Creates a branching coral structure
   */
  static createBranchingCoral(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      group.name = 'branchingCoral';
      
      // Create a tree-like branching structure
      const trunkHeight = 1.0 + Math.random() * 0.5;
      const trunkGeometry = new THREE.CylinderGeometry(0.08, 0.15, trunkHeight, 6);
      
      // Create material for coral using DecorationUtils
      const material = DecorationUtils.createStandardMaterial(
        DecorationUtils.createPlantColor('coral'),
        {
          roughness: 0.7,
          metalness: 0.3
        }
      );
      
      // Create the trunk
      const trunk = new THREE.Mesh(trunkGeometry, material);
      trunk.name = 'branchingCoral_trunk';
      trunk.position.y = trunkHeight / 2;
      group.add(trunk);
      
      // Create branches
      const branchCount = 4 + Math.floor(Math.random() * 4); // 4-7 branches
      
      for (let i = 0; i < branchCount; i++) {
        // Determine where on the trunk to place the branch (from middle to top)
        const heightPercent = 0.5 + Math.random() * 0.5;
        const branchHeight = 0.3 + Math.random() * 0.5;
        
        // Thinner branches
        const branchGeometry = new THREE.CylinderGeometry(
          0.03,
          0.06,
          branchHeight,
          5
        );
        
        const branch = new THREE.Mesh(branchGeometry, material);
        branch.name = `branchingCoral_branch_${i}`;
        
        // Position branch on trunk
        const angle = (i / branchCount) * Math.PI * 2 + Math.random() * 0.5;
        const radius = 0.1 + Math.random() * 0.05;
        
        // Base position at attachment point
        const baseX = Math.cos(angle) * radius;
        const baseZ = Math.sin(angle) * radius;
        const baseY = trunkHeight * heightPercent;
        
        // Rotation for branches pointing outward and upward
        branch.rotation.x = Math.PI / 2 - Math.random() * Math.PI / 4;
        branch.rotation.y = angle;
        
        // Account for rotation in position
        branch.position.set(
          baseX,
          baseY,
          baseZ
        );
        
        // Adjust position to account for branch length
        const branchVector = new THREE.Vector3(0, branchHeight / 2, 0);
        branchVector.applyEuler(branch.rotation);
        branch.position.add(branchVector);
        
        group.add(branch);
        
        // For some branches, add further sub-branches
        if (Math.random() > 0.5) {
          const subBranchCount = 1 + Math.floor(Math.random() * 3);
          
          for (let j = 0; j < subBranchCount; j++) {
            const subBranchHeight = 0.15 + Math.random() * 0.2;
            const subGeometry = new THREE.CylinderGeometry(0.01, 0.03, subBranchHeight, 4);
            const subBranch = new THREE.Mesh(subGeometry, material);
            subBranch.name = `branchingCoral_subbranch_${i}_${j}`;
            
            // Position at the end of the branch
            const subAngle = Math.random() * Math.PI * 2;
            
            // Set position at end of branch
            subBranch.position.set(0, branchHeight / 2, 0);
            
            // Set rotation relative to branch
            subBranch.rotation.z = Math.PI / 4 + Math.random() * Math.PI / 4;
            subBranch.rotation.y = subAngle;
            
            // Move position outward to account for the sub-branch length
            const offset = new THREE.Vector3(0, subBranchHeight / 2, 0);
            offset.applyEuler(subBranch.rotation);
            subBranch.position.add(offset);
            
            branch.add(subBranch);
          }
        }
      }
      
      // Apply scale and rotation using DecorationUtils
      DecorationUtils.applyScale(group, definition);
      DecorationUtils.applyRotation(group, definition);
      
      return group;
    } catch (error) {
      console.error(`Error creating branching coral:`, error);
      return DecorationUtils.createErrorPlaceholder('branchingCoral');
    }
  }
  
  /**
   * Create a tube coral formation
   */
  static createTubeCoral(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      group.name = 'tubeCoral';
      
      // Create a cluster of tube-like coral structures
      const tubeCount = 5 + Math.floor(Math.random() * 5); // 5-9 tubes
      
      // Base height range
      const baseHeight = 0.7 + Math.random() * 0.6;
      
      // Create common material for tubes using DecorationUtils
      const tubeColor = DecorationUtils.createPlantColor('coral');
      const tubeMaterial = DecorationUtils.createStandardMaterial(tubeColor, {
        roughness: 0.7,
        metalness: 0.2
      });
      
      // Create base to which tubes attach
      const baseGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.2, 8);
      const baseMaterial = DecorationUtils.createStandardMaterial(
        tubeColor.clone().multiplyScalar(0.8), // Darker version
        {
          roughness: 0.8,
          metalness: 0.1
        }
      );
      
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.name = 'tubeCoral_base';
      base.position.y = 0.1; // Half height
      group.add(base);
      
      // Create tubes - use DecorationUtils for positioning
      const tubePositions = DecorationUtils.distributeRadially(
        tubeCount,
        0.15 + Math.random() * 0.1, // Radius
        0,                          // Y will be adjusted later
        0.2,                        // Radius variation
        0.5                         // Angle variation
      );
      
      for (let i = 0; i < tubeCount; i++) {
        // Each tube has slight height variation
        const height = baseHeight * (0.8 + Math.random() * 0.4);
        
        // Create tube
        const tubeGeometry = new THREE.CylinderGeometry(
          0.06 + Math.random() * 0.04, // Top radius with variation
          0.08 + Math.random() * 0.04, // Bottom radius with variation
          height,
          8
        );
        
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        tube.name = `tubeCoral_tube_${i}`;
        
        // Position tube on the base
        tube.position.copy(tubePositions[i]);
        tube.position.y = height / 2 + 0.2; // Half height + base height
        
        // Give tubes slight random tilt
        tube.rotation.x = (Math.random() - 0.5) * 0.3;
        tube.rotation.z = (Math.random() - 0.5) * 0.3;
        
        group.add(tube);
        
        // For some tubes, add a small opening detail at the top
        if (Math.random() > 0.3) {
          const rimGeometry = new THREE.TorusGeometry(
            0.06 + Math.random() * 0.04, // Should match tube top radius
            0.02, // Thickness of rim
            8,    // Radial segments
            12    // Tubular segments
          );
          
          const rim = new THREE.Mesh(rimGeometry, tubeMaterial);
          rim.name = `tubeCoral_rim_${i}`;
          rim.position.y = height / 2; // Position at top of tube
          rim.rotation.x = Math.PI / 2; // Orient horizontally
          
          tube.add(rim);
        }
      }
      
      // Apply scale and rotation using DecorationUtils
      DecorationUtils.applyScale(group, definition);
      DecorationUtils.applyRotation(group, definition);
      
      return group;
    } catch (error) {
      console.error(`Error creating tube coral:`, error);
      return DecorationUtils.createErrorPlaceholder('tubeCoral');
    }
  }
  
  /**
   * Create a coral cluster with mixed coral types
   */
  static createCoralCluster(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      group.name = 'coralCluster';
      
      // Create a cluster of different coral types
      const clusterBase = new THREE.Group();
      clusterBase.name = 'coralCluster_base';
      
      // Base rock for the coral to grow on
      const rockGeometry = new THREE.IcosahedronGeometry(0.4, 1);
      const rockMaterial = DecorationUtils.createStandardMaterial(
        DecorationUtils.createRockColor(),
        {
          roughness: 0.9,
          metalness: 0.1
        }
      );
      
      // Deform rock using DecorationUtils
      DecorationUtils.deformSphereWithNoise(rockGeometry, 10, 0.1);
      
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.name = 'coralCluster_baseRock';
      rock.position.y = 0.3; // Half height
      clusterBase.add(rock);
      
      // Add some variety of coral types
      
      // 1. Add a few tube corals
      const tubeCount = 2 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < tubeCount; i++) {
        const height = 0.3 + Math.random() * 0.3;
        const tubeGeometry = new THREE.CylinderGeometry(
          0.03 + Math.random() * 0.02,
          0.05 + Math.random() * 0.02,
          height,
          6
        );
        
        // Create random coral color using DecorationUtils
        const tubeColor = DecorationUtils.createPlantColor('coral');
        const tubeMaterial = DecorationUtils.createStandardMaterial(tubeColor, {
          roughness: 0.7,
          metalness: 0.2
        });
        
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        tube.name = `coralCluster_tube_${i}`;
        
        // Position randomly on the rock
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.1 + Math.random() * 0.15;
        
        // Position at an angle from the rock center
        const posX = Math.cos(angle) * radius;
        const posZ = Math.sin(angle) * radius;
        const posY = 0.3 + height / 2; // Half height + rock height
        
        tube.position.set(posX, posY, posZ);
        
        // Angle away from center
        tube.lookAt(new THREE.Vector3(posX * 2, posY + Math.random() * 0.2, posZ * 2));
        
        clusterBase.add(tube);
      }
      
      // 2. Add some small brain corals
      const brainCount = 1 + Math.floor(Math.random() * 2);
      
      for (let i = 0; i < brainCount; i++) {
        const size = 0.1 + Math.random() * 0.1;
        const brainGeometry = new THREE.SphereGeometry(size, 12, 12);
        
        // Add wrinkles to the brain coral surface using DecorationUtils
        DecorationUtils.deformSphereWithNoise(brainGeometry, 30, 0.04);
        
        // Orange-ish color for brain coral
        const brainMaterial = DecorationUtils.createStandardMaterial(
          DecorationUtils.createPlantColor('coral'),
          {
            roughness: 0.7,
            metalness: 0.2
          }
        );
        
        const brain = new THREE.Mesh(brainGeometry, brainMaterial);
        brain.name = `coralCluster_brain_${i}`;
        
        // Position on the rock surface
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.15 + Math.random() * 0.1;
        
        brain.position.set(
          Math.cos(angle) * radius,
          0.3 + size, // Rock height + brain radius
          Math.sin(angle) * radius
        );
        
        clusterBase.add(brain);
      }
      
      // 3. Add some small branch coral pieces
      const branchCount = 2 + Math.floor(Math.random() * 2);
      
      for (let i = 0; i < branchCount; i++) {
        const branchGroup = new THREE.Group();
        branchGroup.name = `coralCluster_branchGroup_${i}`;
        
        // Random coral color - more purple/pinkish using DecorationUtils
        const branchColor = new THREE.Color(
          0.8 + Math.random() * 0.2, // High red
          0.1 + Math.random() * 0.2, // Low green
          0.7 + Math.random() * 0.3  // High blue
        );
        
        const branchMaterial = DecorationUtils.createStandardMaterial(branchColor, {
          roughness: 0.7,
          metalness: 0.2
        });
        
        // Create 3-5 small branches coming from a single point
        const stemCount = 3 + Math.floor(Math.random() * 3);
        
        for (let j = 0; j < stemCount; j++) {
          const length = 0.15 + Math.random() * 0.15;
          const stemGeometry = new THREE.CylinderGeometry(0.01, 0.02, length, 5);
          const stem = new THREE.Mesh(stemGeometry, branchMaterial);
          stem.name = `coralCluster_branch_${i}_stem_${j}`;
          
          // Rotate stems outward from center
          const stemAngle = (j / stemCount) * Math.PI * 2;
          const spreadFactor = 0.3 + Math.random() * 0.3; // How far stems spread out
          
          stem.rotation.set(
            spreadFactor,
            stemAngle,
            0
          );
          
          // Position at half length to account for rotation
          const offset = new THREE.Vector3(0, length / 2, 0);
          offset.applyEuler(stem.rotation);
          stem.position.copy(offset);
          
          branchGroup.add(stem);
        }
        
        // Position branch group on rock
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.1 + Math.random() * 0.15;
        
        branchGroup.position.set(
          Math.cos(angle) * radius,
          0.3, // Rock height
          Math.sin(angle) * radius
        );
        
        clusterBase.add(branchGroup);
      }
      
      // Add the coral cluster to the main group
      group.add(clusterBase);
      
      // Apply scale and rotation using DecorationUtils
      DecorationUtils.applyScale(group, definition);
      DecorationUtils.applyRotation(group, definition);
      
      return group;
    } catch (error) {
      console.error(`Error creating coral cluster:`, error);
      return DecorationUtils.createErrorPlaceholder('coralCluster');
    }
  }
  
  /**
   * Create a coral-covered rock
   */
  static createCoralRock(definition: DecorationDefinition): THREE.Group {
    try {
      // This is similar to coral cluster but with more emphasis on the rock
      const group = new THREE.Group();
      group.name = 'coralRock';
      
      // Create a large rock base
      const rockGeometry = new THREE.IcosahedronGeometry(0.6, 2);
      
      // Deform rock using DecorationUtils - more pronounced for rock
      DecorationUtils.deformSphereWithNoise(rockGeometry, 8, 0.15);
      
      // Use more realistic rock material with DecorationUtils
      const rockMaterial = DecorationUtils.createStandardMaterial(
        DecorationUtils.createRockColor(),
        {
          roughness: 0.9,
          metalness: 0.1
        }
      );
      
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.name = 'coralRock_base';
      rock.position.y = 0.4; // Half height
      group.add(rock);
      
      // Add various small coral attachments to the rock surface
      const attachmentCount = 8 + Math.floor(Math.random() * 8); // 8-15 attachments
      
      for (let i = 0; i < attachmentCount; i++) {
        // Choose a random type of attachment
        const attachmentType = Math.random();
        
        if (attachmentType < 0.3) {
          // Small tube coral
          const height = 0.2 + Math.random() * 0.2;
          const tubeGeometry = new THREE.CylinderGeometry(
            0.02 + Math.random() * 0.01,
            0.03 + Math.random() * 0.02,
            height,
            6
          );
          
          // Choose a vibrant coral color using DecorationUtils
          const tubeColor = DecorationUtils.createPlantColor('coral');
          const tubeMaterial = DecorationUtils.createStandardMaterial(tubeColor, {
            roughness: 0.7,
            metalness: 0.2
          });
          
          const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
          tube.name = `coralRock_tube_${i}`;
          
          // Position randomly on rock surface using spherical coordinates
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI; // Full sphere coverage
          const radius = 0.6; // Rock radius
          
          // Convert spherical to cartesian coordinates
          const x = radius * Math.sin(phi) * Math.cos(theta);
          const y = radius * Math.cos(phi);
          const z = radius * Math.sin(phi) * Math.sin(theta);
          
          // Position base at rock surface
          tube.position.set(x, y, z);
          
          // Orient tube to point outward from center
          tube.lookAt(new THREE.Vector3(
            x * 2,
            y * 2,
            z * 2
          ));
          
          // Move position outward to avoid intersecting with rock
          tube.position.x += x * 0.1;
          tube.position.y += y * 0.1;
          tube.position.z += z * 0.1;
          
          group.add(tube);
        } else if (attachmentType < 0.6) {
          // Small brain coral bump
          const size = 0.08 + Math.random() * 0.08;
          const brainGeometry = new THREE.SphereGeometry(size, 10, 10);
          
          // Add wrinkles to the brain coral surface using DecorationUtils
          DecorationUtils.deformSphereWithNoise(brainGeometry, 25, 0.04);
          
          // Choose a coral color
          const brainMaterial = DecorationUtils.createStandardMaterial(
            DecorationUtils.createPlantColor('coral'),
            {
              roughness: 0.7,
              metalness: 0.2
            }
          );
          
          const brain = new THREE.Mesh(brainGeometry, brainMaterial);
          brain.name = `coralRock_brain_${i}`;
          
          // Position on rock surface
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI; // Full sphere
          const radius = 0.6; // Rock radius
          
          // Convert to cartesian
          const x = radius * Math.sin(phi) * Math.cos(theta);
          const y = radius * Math.cos(phi);
          const z = radius * Math.sin(phi) * Math.sin(theta);
          
          brain.position.set(x, y, z);
          
          // Move outward slightly
          brain.position.x += x * 0.15;
          brain.position.y += y * 0.15;
          brain.position.z += z * 0.15;
          
          group.add(brain);
        } else {
          // Small clump of polyps/barnacles
          const polypsGroup = new THREE.Group();
          polypsGroup.name = `coralRock_polypsGroup_${i}`;
          
          // Number of individual polyps in clump
          const polypsCount = 3 + Math.floor(Math.random() * 4);
          
          // Same color for all polyps in group using DecorationUtils
          const polypsColor = DecorationUtils.createPlantColor('coral');
          
          for (let j = 0; j < polypsCount; j++) {
            // Each polyp is a small cylinder
            const polypsHeight = 0.03 + Math.random() * 0.03;
            const polypsRadius = 0.01 + Math.random() * 0.01;
            
            const polypsGeometry = new THREE.CylinderGeometry(
              polypsRadius,
              polypsRadius * 1.2,
              polypsHeight,
              5
            );
            
            // Slight color variation
            const polypsMaterial = DecorationUtils.createStandardMaterial(
              polypsColor.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.1),
              {
                roughness: 0.8,
                metalness: 0.1
              }
            );
            
            const polyp = new THREE.Mesh(polypsGeometry, polypsMaterial);
            polyp.name = `coralRock_polyp_${i}_${j}`;
            
            // Position within small clump area
            const offset = 0.03;
            polyp.position.set(
              (Math.random() - 0.5) * offset,
              0,
              (Math.random() - 0.5) * offset
            );
            
            polypsGroup.add(polyp);
          }
          
          // Position clump on rock surface
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI; // Full sphere
          const radius = 0.6; // Rock radius
          
          // Convert to cartesian
          const x = radius * Math.sin(phi) * Math.cos(theta);
          const y = radius * Math.cos(phi);
          const z = radius * Math.sin(phi) * Math.sin(theta);
          
          polypsGroup.position.set(x, y, z);
          
          // Orient to face outward from rock center
          polypsGroup.lookAt(new THREE.Vector3(
            x * 2,
            y * 2,
            z * 2
          ));
          
          // Move outward slightly
          polypsGroup.position.x += x * 0.1;
          polypsGroup.position.y += y * 0.1;
          polypsGroup.position.z += z * 0.1;
          
          group.add(polypsGroup);
        }
      }
      
      // Apply scale and rotation using DecorationUtils
      DecorationUtils.applyScale(group, definition);
      DecorationUtils.applyRotation(group, definition);
      
      return group;
    } catch (error) {
      console.error(`Error creating coral rock:`, error);
      return DecorationUtils.createErrorPlaceholder('coralRock');
    }
  }
}