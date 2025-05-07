import * as THREE from 'three';
import { DecorationDefinition } from '../DecorationDefinitions';

/**
 * Contains factory methods for creating underwater vegetation decorations
 */
export class VegetationDecorations {
  /**
   * Create a seaweed plant (type 1)
   */
  static createSeaweed1(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      
      // Number of segments in the seaweed stalk
      const segments = 5 + Math.floor(Math.random() * 4); // 5-8 segments
      const totalHeight = 1.2 + Math.random() * 0.8; // 1.2-2.0 units tall
      const segmentHeight = totalHeight / segments;
      
      // Slight curve factor to make seaweed bend
      const curveFactor = 0.1 + Math.random() * 0.2;
      
      // Average width of the seaweed
      const width = 0.15 + Math.random() * 0.1;
      
      // Create a green material with some translucency
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(
          0.2 + Math.random() * 0.3, // Low red
          0.7 + Math.random() * 0.3, // High green
          0.2 + Math.random() * 0.3  // Low blue
        ),
        roughness: 0.5,
        metalness: 0.2,
        transparent: true,
        opacity: 0.9
      });
      
      // Create segments from bottom to top
      for (let i = 0; i < segments; i++) {
        const segmentWidth = width * (1 - i / segments * 0.5); // Taper toward top
        const segmentGeometry = new THREE.PlaneGeometry(segmentWidth, segmentHeight);
        
        // Create two planes for each segment (perpendicular to each other)
        for (let j = 0; j < 2; j++) {
          const segment = new THREE.Mesh(segmentGeometry, material);
          
          // Position this segment above the previous one
          const yPos = i * segmentHeight + segmentHeight / 2;
          
          // Add a curve by offsetting each higher segment
          const curveMagnitude = i / segments * curveFactor * totalHeight;
          const curveDirection = Math.random() * Math.PI * 2; // Random direction
          
          const xPos = Math.cos(curveDirection) * curveMagnitude;
          const zPos = Math.sin(curveDirection) * curveMagnitude;
          
          segment.position.set(xPos, yPos, zPos);
          
          // Rotate second plane to be perpendicular to first
          segment.rotation.y = j * Math.PI / 2;
          
          // Add slight random rotation to give more organic feel
          segment.rotation.x = (Math.random() - 0.5) * 0.1;
          segment.rotation.z = (Math.random() - 0.5) * 0.1;
          
          group.add(segment);
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
      console.error(`Error creating seaweed1: ${error}`);
      // Create a distinct, visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_seaweed1";
      return errorMesh;
    }
  }
  
  /**
   * Create a kelp stalk with multiple leaves
   */
  static createKelpStalk(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      
      // Kelp properties
      const stalkHeight = 2.0 + Math.random() * 1.0; // 2.0-3.0 units tall
      const leafCount = 5 + Math.floor(Math.random() * 5); // 5-9 leaves
      
      // Curve amplitude for the main stalk
      const curveAmplitude = 0.2 + Math.random() * 0.3;
      
      // Random curve direction for the stalk
      const curveDirection = Math.random() * Math.PI * 2;
      
      // Create a material for the stalk
      const stalkMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(
          0.1 + Math.random() * 0.1, // Very low red
          0.5 + Math.random() * 0.3, // Medium-high green
          0.1 + Math.random() * 0.2  // Low blue
        ),
        roughness: 0.6,
        metalness: 0.2
      });
      
      // Create stalk segments (cylinder segments)
      const stalkSegments = 8 + Math.floor(Math.random() * 5); // 8-12 segments
      const segmentHeight = stalkHeight / stalkSegments;
      
      // Create stalk from bottom to top
      let previousPosition = new THREE.Vector3(0, 0, 0);
      
      for (let i = 0; i < stalkSegments; i++) {
        const stalkRadius = 0.04 - (i / stalkSegments) * 0.02; // Taper toward top
        const segmentGeometry = new THREE.CylinderGeometry(
          stalkRadius, // Top radius 
          stalkRadius * 1.1, // Bottom radius slightly larger
          segmentHeight,
          6 // Less segments for performance
        );
        
        const stalkSegment = new THREE.Mesh(segmentGeometry, stalkMaterial);
        
        // Calculate position with increasing curve
        const heightPercent = i / stalkSegments;
        const curveStrength = Math.sin(heightPercent * Math.PI) * curveAmplitude;
        
        const xPos = Math.cos(curveDirection) * curveStrength * heightPercent * stalkHeight;
        const zPos = Math.sin(curveDirection) * curveStrength * heightPercent * stalkHeight;
        const yPos = i * segmentHeight;
        
        // Position at half height
        stalkSegment.position.set(xPos, yPos + segmentHeight / 2, zPos);
        
        // Orientation - make segment point to next position
        if (i > 0) {
          const direction = new THREE.Vector3()
            .subVectors(stalkSegment.position, previousPosition)
            .normalize();
            
          const quaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0), // Default cylinder orientation
            direction
          );
          
          stalkSegment.quaternion.copy(quaternion);
        }
        
        previousPosition.copy(stalkSegment.position);
        group.add(stalkSegment);
        
        // Add leaves at intervals
        if (i > 1 && i < stalkSegments - 1 && Math.random() > 0.4) {
          // Create leaf
          const leafLength = 0.3 + Math.random() * 0.4;
          const leafWidth = 0.15 + Math.random() * 0.1;
          
          const leafGeometry = new THREE.PlaneGeometry(leafWidth, leafLength);
          
          // Slightly different color for leaves
          const leafMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(
              0.1 + Math.random() * 0.1, // Very low red
              0.6 + Math.random() * 0.4, // High green
              0.2 + Math.random() * 0.2  // Low-medium blue
            ),
            roughness: 0.4,
            metalness: 0.3,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
          });
          
          const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
          
          // Attach to current stalk segment
          leaf.position.set(0, 0, 0); // Will be relative to parent
          
          // Random rotation around stalk
          const leafAngle = Math.random() * Math.PI * 2;
          leaf.rotation.set(
            Math.PI / 4 + Math.random() * Math.PI / 4, // Angle upward
            leafAngle,
            0
          );
          
          // Slight bend in the leaf
          if (leafGeometry.attributes.position instanceof THREE.BufferAttribute) {
            const positions = leafGeometry.attributes.position.array;
            
            for (let j = 0; j < positions.length / 3; j++) {
              const x = positions[j * 3];
              const y = positions[j * 3 + 1];
              
              // Apply gentle curve to the leaf
              positions[j * 3 + 1] = y + Math.pow(y / leafLength, 2) * 0.1 * leafLength;
            }
            
            leafGeometry.attributes.position.needsUpdate = true;
            leafGeometry.computeVertexNormals();
          }
          
          stalkSegment.add(leaf);
        }
      }
      
      // Create a leaf cluster at the top
      const topLeafCount = 3 + Math.floor(Math.random() * 3); // 3-5 top leaves
      
      for (let i = 0; i < topLeafCount; i++) {
        const leafLength = 0.4 + Math.random() * 0.3;
        const leafWidth = 0.2 + Math.random() * 0.1;
        
        const leafGeometry = new THREE.PlaneGeometry(leafWidth, leafLength);
        
        // Top leaves are more vibrant
        const leafMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(
            0.1 + Math.random() * 0.1, // Very low red
            0.7 + Math.random() * 0.3, // High green
            0.2 + Math.random() * 0.2  // Low blue
          ),
          roughness: 0.4,
          metalness: 0.3,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9
        });
        
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        
        // Position at top of stalk
        leaf.position.set(
          previousPosition.x,
          previousPosition.y + segmentHeight / 2,
          previousPosition.z
        );
        
        // Fan leaves out in different directions
        const leafAngle = (i / topLeafCount) * Math.PI * 2;
        leaf.rotation.set(
          Math.PI / 6 + Math.random() * Math.PI / 6, // Angle upward
          leafAngle,
          0
        );
        
        // Apply gentle curve to the leaf
        if (leafGeometry.attributes.position instanceof THREE.BufferAttribute) {
          const positions = leafGeometry.attributes.position.array;
          
          for (let j = 0; j < positions.length / 3; j++) {
            const x = positions[j * 3];
            const y = positions[j * 3 + 1];
            
            // Apply gentle curve to the leaf
            positions[j * 3 + 1] = y + Math.pow(y / leafLength, 2) * 0.15 * leafLength;
          }
          
          leafGeometry.attributes.position.needsUpdate = true;
          leafGeometry.computeVertexNormals();
        }
        
        group.add(leaf);
      }
      
      // Apply scale with variation
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      // Apply random rotation
      group.rotation.y = Math.random() * definition.rotationVariance;
      
      return group;
    } catch (error) {
      console.error(`Error creating kelp stalk: ${error}`);
      // Create a distinct, visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_kelpStalk";
      return errorMesh;
    }
  }
  
  /**
   * Create short sea grass
   */
  static createSeaGrass(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      
      // Create a cluster of grass blades
      const bladeCount = 10 + Math.floor(Math.random() * 15); // 10-24 blades
      
      // Create material for grass with some translucency
      const grassMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(
          0.1 + Math.random() * 0.2, // Low red
          0.6 + Math.random() * 0.4, // High green
          0.2 + Math.random() * 0.2  // Low blue
        ),
        roughness: 0.5,
        metalness: 0.1,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });
      
      // Create individual grass blades
      for (let i = 0; i < bladeCount; i++) {
        // Each blade is a simple tapered plane
        const bladeHeight = 0.3 + Math.random() * 0.4; // 0.3-0.7 units tall
        const bladeWidth = 0.03 + Math.random() * 0.03; // 0.03-0.06 units wide
        
        // Create a custom blade shape that tapers at the top
        const bladeGeometry = new THREE.PlaneGeometry(1, 1, 1, 4); // More height segments
        
        // Taper width toward the top and add slight curve
        if (bladeGeometry.attributes.position instanceof THREE.BufferAttribute) {
          const positions = bladeGeometry.attributes.position.array;
          
          for (let j = 0; j < positions.length / 3; j++) {
            const x = positions[j * 3];
            const y = positions[j * 3 + 1];
            
            // Taper width toward top
            const widthTaper = 1.0 - (y + 0.5) * 0.7; // 1.0 at bottom, 0.3 at top
            positions[j * 3] = x * widthTaper * bladeWidth;
            
            // Convert height to blade height with slight curve
            const heightPercent = (y + 0.5); // 0-1 from bottom to top
            const curveFactor = Math.pow(heightPercent, 2) * 0.2; // Stronger curve at top
            const sway = Math.sin(heightPercent * Math.PI * 2) * 0.05; // Add gentle S-curve
            
            // Calculate curve direction
            const curveDirection = (i / bladeCount) * Math.PI * 2;
            const xCurve = Math.cos(curveDirection) * curveFactor + sway;
            const zCurve = Math.sin(curveDirection) * curveFactor;
            
            // Apply height and curved position
            positions[j * 3] += xCurve * bladeHeight;
            positions[j * 3 + 1] = heightPercent * bladeHeight;
            positions[j * 3 + 2] = zCurve * bladeHeight;
          }
          
          bladeGeometry.attributes.position.needsUpdate = true;
          bladeGeometry.computeVertexNormals();
        }
        
        const blade = new THREE.Mesh(bladeGeometry, grassMaterial.clone());
        
        // Position blade in a circular cluster
        const angle = (i / bladeCount) * Math.PI * 2 + Math.random() * 0.5;
        const radius = 0.2 * Math.random(); // Cluster radius
        
        blade.position.set(
          Math.cos(angle) * radius,
          0, // At ground level
          Math.sin(angle) * radius
        );
        
        // Random rotation to face different directions
        blade.rotation.y = Math.random() * Math.PI * 2;
        
        // Slight random tilt
        blade.rotation.x = (Math.random() - 0.5) * 0.2;
        blade.rotation.z = (Math.random() - 0.5) * 0.2;
        
        // Slight color variation per blade
        const material = blade.material as THREE.MeshStandardMaterial;
        material.color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
        
        group.add(blade);
      }
      
      // Apply scale with variation
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      // Apply random rotation
      group.rotation.y = Math.random() * definition.rotationVariance;
      
      return group;
    } catch (error) {
      console.error(`Error creating sea grass: ${error}`);
      // Create a distinct, visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_seaGrass";
      return errorMesh;
    }
  }
  
  /**
   * Create a sea anemone with tentacles
   */
  static createSeaAnemone(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      
      // Create base of anemone
      const baseRadius = 0.2 + Math.random() * 0.1;
      const baseHeight = 0.15 + Math.random() * 0.1;
      
      const baseGeometry = new THREE.CylinderGeometry(
        baseRadius * 1.2, // Top wider than bottom
        baseRadius,
        baseHeight,
        12
      );
      
      // Choose color - typically bright colors for anemones
      const colorHue = Math.random(); // Random hue
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(
          colorHue,
          0.7 + Math.random() * 0.3, // High saturation
          0.5 + Math.random() * 0.3  // Medium to high lightness
        ),
        roughness: 0.6,
        metalness: 0.3
      });
      
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = baseHeight / 2; // Half height
      group.add(base);
      
      // Create tentacles
      const tentacleCount = 15 + Math.floor(Math.random() * 10); // 15-24 tentacles
      
      // Tentacle material slightly translucent
      const tentacleMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(
          (colorHue + 0.05) % 1.0, // Slightly shifted hue from base
          0.8 + Math.random() * 0.2, // High saturation
          0.6 + Math.random() * 0.3  // Medium-high lightness
        ),
        roughness: 0.4,
        metalness: 0.2,
        transparent: true,
        opacity: 0.9
      });
      
      for (let i = 0; i < tentacleCount; i++) {
        // Each tentacle is a thin tapered cylinder
        const tentacleHeight = 0.2 + Math.random() * 0.4;
        const tentacleRadius = 0.01 + Math.random() * 0.01;
        
        const tentacleGeometry = new THREE.CylinderGeometry(
          tentacleRadius * 0.5, // Taper at top
          tentacleRadius,
          tentacleHeight,
          6,
          1,
          false // Don't need bottom/top caps
        );
        
        const tentacle = new THREE.Mesh(tentacleGeometry, tentacleMaterial);
        
        // Position around the edge of the base
        const angle = (i / tentacleCount) * Math.PI * 2 + Math.random() * 0.1;
        const radius = baseRadius * (0.8 + Math.random() * 0.2); // Slight variation in distance from center
        
        tentacle.position.set(
          Math.cos(angle) * radius,
          baseHeight, // At top of base
          Math.sin(angle) * radius
        );
        
        // Angle tentacles outward and upward
        tentacle.rotation.x = -Math.PI / 6 - Math.random() * Math.PI / 6; // Angle depends on position
        tentacle.rotation.y = angle; // Face outward
        
        // Move position to account for rotation
        const offset = new THREE.Vector3(0, tentacleHeight / 2, 0);
        offset.applyEuler(tentacle.rotation);
        tentacle.position.add(offset);
        
        // Add some tentacles with undulation/curve
        if (Math.random() > 0.5 && tentacleGeometry.attributes.position instanceof THREE.BufferAttribute) {
          const positions = tentacleGeometry.attributes.position.array;
          
          for (let j = 0; j < positions.length / 3; j++) {
            const x = positions[j * 3];
            const y = positions[j * 3 + 1];
            const z = positions[j * 3 + 2];
            
            // Calculate distance from center axis
            const distFromAxis = Math.sqrt(x * x + z * z);
            
            // Add gentle curve
            const heightPercent = (y + tentacleHeight / 2) / tentacleHeight;
            const curveAmount = Math.sin(heightPercent * Math.PI) * 0.1;
            
            // Curve direction
            const curveAngle = Math.random() * Math.PI * 2;
            
            positions[j * 3] += Math.cos(curveAngle) * curveAmount * distFromAxis;
            positions[j * 3 + 2] += Math.sin(curveAngle) * curveAmount * distFromAxis;
          }
          
          tentacleGeometry.attributes.position.needsUpdate = true;
          tentacleGeometry.computeVertexNormals();
        }
        
        group.add(tentacle);
      }
      
      // Add detail to base
      if (baseGeometry.attributes.position instanceof THREE.BufferAttribute) {
        const positions = baseGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          const x = positions[i * 3];
          const y = positions[i * 3 + 1];
          const z = positions[i * 3 + 2];
          
          // Only modify side surfaces (not top or bottom)
          if (y > -baseHeight / 2 + 0.01 && y < baseHeight / 2 - 0.01) {
            // Distance from center axis
            const distFromAxis = Math.sqrt(x * x + z * z);
            
            // Add radial ridges
            const angle = Math.atan2(z, x);
            const radialNoise = Math.sin(angle * 8) * 0.03 * distFromAxis;
            
            const dx = x / distFromAxis;
            const dz = z / distFromAxis;
            
            positions[i * 3] += dx * radialNoise;
            positions[i * 3 + 2] += dz * radialNoise;
          }
        }
        
        baseGeometry.attributes.position.needsUpdate = true;
        baseGeometry.computeVertexNormals();
      }
      
      // Apply scale with variation
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      // Apply random rotation
      group.rotation.y = Math.random() * definition.rotationVariance;
      
      return group;
    } catch (error) {
      console.error(`Error creating sea anemone: ${error}`);
      // Create a distinct, visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_seaAnemone";
      return errorMesh;
    }
  }

  /**
   * Create a giant kelp plant with stalk and leaves
   */
  static createGiantKelp(definition: DecorationDefinition): THREE.Group {
    try {
      // Create a group to hold all parts of the kelp
      const group = new THREE.Group();
      
      // Main stalk height and thickness
      const stalkHeight = 3.0 + Math.random() * 2.0; // 3-5 units tall
      const stalkWidth = 0.1 + Math.random() * 0.05;
      
      // Number of leaf pairs along the stalk
      const leafPairCount = Math.floor(stalkHeight * 1.5);
      
      // Create the main stalk
      const stalkGeometry = new THREE.CylinderGeometry(
        stalkWidth * 0.7, // Top radius (slightly tapered)
        stalkWidth,       // Bottom radius
        stalkHeight,      // Height
        8,                // Radial segments
        Math.max(5, Math.floor(stalkHeight * 3)), // Height segments based on height
        false             // Open-ended
      );
      
      // Apply a slight curve to the stalk
      if (stalkGeometry.attributes.position instanceof THREE.BufferAttribute) {
        const positions = stalkGeometry.attributes.position.array;
        const maxDeflection = stalkWidth * 5; // Max curve deflection
        
        for (let i = 0; i < positions.length / 3; i++) {
          const x = positions[i * 3];
          const y = positions[i * 3 + 1];
          const z = positions[i * 3 + 2];
          
          // Calculate normalized height position (0 at bottom, 1 at top)
          const heightPos = (y + stalkHeight / 2) / stalkHeight;
          
          // Apply increasing curve as we go up
          const curveAmount = Math.pow(heightPos, 2) * maxDeflection;
          
          // Apply the curve in a consistent direction
          positions[i * 3] = x + curveAmount;
          
          // Add some noise to make it more natural
          const noise = (Math.sin(y * 10) * 0.02) * heightPos;
          positions[i * 3] += noise;
          positions[i * 3 + 2] += noise * 0.7;
        }
        
        stalkGeometry.attributes.position.needsUpdate = true;
        stalkGeometry.computeVertexNormals();
      }
      
      // Create a green material for the stalk
      const stalkMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x2d804e),
        roughness: 0.7,
        metalness: 0.0
      });
      
      const stalk = new THREE.Mesh(stalkGeometry, stalkMaterial);
      stalk.position.y = stalkHeight / 2;
      group.add(stalk);
      
      // Create leaves along the stalk
      const leafMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x3a9e64),
        roughness: 0.6,
        metalness: 0.1,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });
      
      for (let i = 0; i < leafPairCount; i++) {
        const leafHeight = 0.3 + Math.random() * 0.4; // Leaf height
        const leafWidth = 0.15 + Math.random() * 0.2;  // Leaf width
        
        // Create leaf geometry with some variation
        const leafGeometry = new THREE.PlaneGeometry(leafWidth, leafHeight, 3, 3);
        
        // Position along the stalk (bottom to top)
        const heightPos = i / leafPairCount;
        const yPos = heightPos * stalkHeight;
        
        // Curve the leaf by adjusting vertex positions
        if (leafGeometry.attributes.position instanceof THREE.BufferAttribute) {
          const positions = leafGeometry.attributes.position.array;
          
          for (let j = 0; j < positions.length / 3; j++) {
            const x = positions[j * 3];
            const y = positions[j * 3 + 1];
            
            // Apply a curve based on x position (distance from center of leaf)
            const xRatio = x / (leafWidth / 2);
            const curve = Math.pow(xRatio, 2) * 0.1;
            
            // Curve it backwards 
            positions[j * 3 + 2] = curve * leafHeight;
          }
          
          leafGeometry.attributes.position.needsUpdate = true;
          leafGeometry.computeVertexNormals();
        }
        
        // Create leaf pair at this height
        for (let j = 0; j < 2; j++) {
          const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
          
          // Position and rotate leaves to point outward from stalk
          leaf.position.set(
            stalkWidth * 0.5 + leafWidth / 4,
            yPos,
            0
          );
          
          // Rotate to opposite sides
          const rotationY = (j === 0) ? 0 : Math.PI;
          
          // Add some random variation to rotation
          const randomRot = Math.random() * 0.3 - 0.15; // ±0.15 radians
          
          leaf.rotation.set(
            -Math.PI / 6 + randomRot, // Tilt up slightly with variation
            rotationY,
            0
          );
          
          group.add(leaf);
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
      console.error(`Error creating giant kelp: ${error}`);
      // Create a distinct, visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_giantKelp";
      return errorMesh;
    }
  }
}