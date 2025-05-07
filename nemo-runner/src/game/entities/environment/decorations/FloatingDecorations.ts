import * as THREE from 'three';
import { DecorationDefinition } from '../DecorationDefinitions';

/**
 * Contains factory methods for creating floating-type decorations
 */
export class FloatingDecorations {
  /**
   * Create floating plankton decoration
   */
  static createFloatingPlankton(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      
      // Create a cluster of small plankton particles
      const particleCount = 15 + Math.floor(Math.random() * 15);
      
      // Plankton colors - mostly light/translucent
      const planktonColors = [
        0xccffff, // Light cyan
        0xccccff, // Light blue
        0xffccff, // Light pink
        0xeeffee  // Light green
      ];
      
      // Size of the overall cluster
      const clusterRadius = 0.5 + Math.random() * 0.5;
      
      for (let i = 0; i < particleCount; i++) {
        // Randomly select color
        const color = planktonColors[Math.floor(Math.random() * planktonColors.length)];
        
        // Create plankton material
        const planktonMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          transparent: true,
          opacity: 0.4 + Math.random() * 0.3, // Semitransparent
          roughness: 0.3,
          metalness: 0.0
        });
        
        // Create varied sizes for particles
        const particleSize = 0.01 + Math.random() * 0.03;
        
        // Choose between different plankton shapes
        const shapeType = Math.floor(Math.random() * 3);
        let particleGeometry;
        
        switch (shapeType) {
          case 0:
            // Simple sphere
            particleGeometry = new THREE.SphereGeometry(particleSize, 6, 6);
            break;
            
          case 1:
            // Elongated shape
            particleGeometry = new THREE.CapsuleGeometry(
              particleSize * 0.5,
              particleSize * 3,
              4,
              6
            );
            break;
            
          case 2:
            // Flattened disc
            particleGeometry = new THREE.CylinderGeometry(
              particleSize * 1.5,
              particleSize * 1.5,
              particleSize * 0.5,
              8,
              1
            );
            break;
        }
        
        const particle = new THREE.Mesh(particleGeometry, planktonMaterial);
        
        // Distribute within a spherical volume
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const radius = clusterRadius * Math.pow(Math.random(), 0.5); // Cube root for more even distribution
        
        particle.position.set(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta)
        );
        
        // Random rotation
        particle.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        );
        
        group.add(particle);
      }
      
      // Apply scale from definition
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      // Unlike ground-based decorations, we don't apply rotation since these float freely
      
      return group;
    } catch (error) {
      console.error(`Error creating floating plankton: ${error}`);
      // Create a visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_floatingPlankton";
      return errorMesh;
    }
  }

  /**
   * Create a school of small fish
   */
  static createSchoolOfFish(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      
      // Fish parameters
      const fishCount = 10 + Math.floor(Math.random() * 15);
      
      // Base size and overall cluster size
      const fishSize = 0.08 + Math.random() * 0.06;
      const clusterRadius = 0.7 + Math.random() * 0.6;
      
      // Choose a color scheme for the school
      const fishColors = [
        0x5588ff, // Blue
        0xff8855, // Orange
        0x55ff88, // Green
        0xffff55  // Yellow
      ];
      
      // Pick one primary color for this school
      const primaryColor = fishColors[Math.floor(Math.random() * fishColors.length)];
      
      // Create a single template fish geometry that we'll reuse
      const fishGeometry = new THREE.Group();
      
      // Create fish body (teardrop shape)
      const bodyGeometry = new THREE.CapsuleGeometry(
        fishSize * 0.5,   // Radius
        fishSize * 1.0,   // Length
        8,                // Radial segments
        6                 // Length segments
      );
      
      // Squeeze the body slightly to make it more fish-like
      if (bodyGeometry.attributes.position) {
        const positions = bodyGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3 + 2] *= 0.7; // Flatten slightly in z direction
        }
        
        bodyGeometry.attributes.position.needsUpdate = true;
        bodyGeometry.computeVertexNormals();
      }
      
      // Create fish material
      const fishMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(primaryColor),
        roughness: 0.7,
        metalness: 0.3
      });
      
      const body = new THREE.Mesh(bodyGeometry, fishMaterial);
      body.rotation.z = Math.PI / 2; // Orient fish to face forward
      fishGeometry.add(body);
      
      // Add tail fin
      const tailGeometry = new THREE.BufferGeometry();
      
      // Define tail as a simple triangle
      const tailVertices = new Float32Array([
        0, -fishSize * 0.8, 0,    // Base of tail
        0, -fishSize * 1.5, fishSize * 0.6, // Top edge
        0, -fishSize * 1.5, -fishSize * 0.6 // Bottom edge
      ]);
      
      tailGeometry.setAttribute('position', new THREE.BufferAttribute(tailVertices, 3));
      tailGeometry.setIndex([0, 1, 2]); // Define the triangle
      tailGeometry.computeVertexNormals();
      
      const tail = new THREE.Mesh(tailGeometry, fishMaterial);
      fishGeometry.add(tail);
      
      // Add small fins on the sides
      const finGeometry = new THREE.BufferGeometry();
      
      // Define side fin as a small triangle
      const finVertices = new Float32Array([
        0, 0, fishSize * 0.5,     // Base of fin (attached to body)
        fishSize * 0.2, 0, fishSize * 1.0,  // Outer point
        -fishSize * 0.2, 0, fishSize * 1.0  // Outer point
      ]);
      
      finGeometry.setAttribute('position', new THREE.BufferAttribute(finVertices, 3));
      finGeometry.setIndex([0, 1, 2]); // Define the triangle
      finGeometry.computeVertexNormals();
      
      const finLeft = new THREE.Mesh(finGeometry, fishMaterial);
      finLeft.position.set(0, 0, fishSize * 0.3);
      finLeft.rotation.x = Math.PI / 6; // Angle slightly downward
      fishGeometry.add(finLeft);
      
      // Right fin (mirror of left)
      const finRight = finLeft.clone();
      finRight.position.set(0, 0, -fishSize * 0.3);
      finRight.rotation.x = -Math.PI / 6; // Angle in opposite direction
      fishGeometry.add(finRight);
      
      // Create multiple instances of the fish
      for (let i = 0; i < fishCount; i++) {
        const fishInstance = fishGeometry.clone();
        
        // Distribute fish within the school
        const distributionRadius = clusterRadius * Math.pow(Math.random(), 0.7); // Bias toward center
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() * 0.7 + 0.2) * Math.PI; // Limit vertical spread
        
        fishInstance.position.set(
          distributionRadius * Math.sin(phi) * Math.cos(theta),
          distributionRadius * Math.cos(phi),
          distributionRadius * Math.sin(phi) * Math.sin(theta)
        );
        
        // Have all fish face roughly the same direction with small variations
        const facingAngle = Math.random() * Math.PI * 0.5 - Math.PI * 0.25; // ±45 degrees
        fishInstance.rotation.y = facingAngle;
        
        // Small random pitch and roll
        fishInstance.rotation.x = (Math.random() - 0.5) * 0.3;
        fishInstance.rotation.z = (Math.random() - 0.5) * 0.3;
        
        // Random size variations
        const sizeFactor = 0.7 + Math.random() * 0.6;
        fishInstance.scale.set(sizeFactor, sizeFactor, sizeFactor);
        
        // Occasionally vary color slightly for individuals
        if (Math.random() > 0.7) {
          fishInstance.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
              const material = child.material.clone();
              material.color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
              child.material = material;
            }
          });
        }
        
        group.add(fishInstance);
      }
      
      // Apply scale from definition
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      return group;
    } catch (error) {
      console.error(`Error creating school of fish: ${error}`);
      // Create a visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_schoolOfFish";
      return errorMesh;
    }
  }

  /**
   * Create a jellyfish decoration
   */
  static createJellyfish(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      
      // Jellyfish dimensions
      const bellRadius = 0.3 + Math.random() * 0.2;
      const bellHeight = bellRadius * (0.8 + Math.random() * 0.4);
      const tentacleCount = 8 + Math.floor(Math.random() * 8);
      
      // Choose a jellyfish color scheme
      const jellyfishColors = [
        { 
          body: 0xee88ff, // Light purple
          tentacles: 0xff88ee,
          transparent: true
        },
        { 
          body: 0x88eeee, // Light blue
          tentacles: 0xaaccee,
          transparent: true
        },
        { 
          body: 0xffaaaa, // Light pink
          tentacles: 0xffcccc,
          transparent: true
        },
        { 
          body: 0xeeddff, // Very light purple
          tentacles: 0xddccff,
          transparent: true
        }
      ];
      
      const colorScheme = jellyfishColors[Math.floor(Math.random() * jellyfishColors.length)];
      
      // Create bell/dome
      const bellGeometry = new THREE.SphereGeometry(
        bellRadius,
        16,
        12,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      );
      
      // Adjust the bell shape to be more dome-like
      if (bellGeometry.attributes.position) {
        const positions = bellGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          // Get position components
          const x = positions[i * 3];
          const y = positions[i * 3 + 1];
          const z = positions[i * 3 + 2];
          
          // Adjust y component to make it more dome-like
          // Only adjust points not at the rim
          if (y < 0) {
            // Scale y to make it more elongated
            positions[i * 3 + 1] = y * bellHeight / bellRadius;
            
            // Add some subtle pulsing deformation
            const distance = Math.sqrt(x * x + z * z) / bellRadius;
            if (distance < 0.9) {
              positions[i * 3 + 1] -= Math.sin(distance * Math.PI) * 0.05 * bellRadius;
            }
          }
        }
        
        bellGeometry.attributes.position.needsUpdate = true;
        bellGeometry.computeVertexNormals();
      }
      
      // Create translucent material for bell
      const bellMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorScheme.body),
        transparent: colorScheme.transparent,
        opacity: 0.7,
        roughness: 0.3,
        metalness: 0.2,
        side: THREE.DoubleSide
      });
      
      const bell = new THREE.Mesh(bellGeometry, bellMaterial);
      
      // Rotate bell to have dome facing down (jellyfish orientation)
      bell.rotation.x = Math.PI;
      group.add(bell);
      
      // Create inner membrane/body
      const innerRadius = bellRadius * 0.7;
      const innerGeometry = new THREE.SphereGeometry(
        innerRadius,
        12,
        8,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      );
      
      // Adjust shape like the bell
      if (innerGeometry.attributes.position) {
        const positions = innerGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          // Get position components
          const x = positions[i * 3];
          const y = positions[i * 3 + 1];
          const z = positions[i * 3 + 2];
          
          // Adjust y component to match the bell shape
          if (y < 0) {
            positions[i * 3 + 1] = y * bellHeight / bellRadius;
          }
        }
        
        innerGeometry.attributes.position.needsUpdate = true;
        innerGeometry.computeVertexNormals();
      }
      
      // Create inner body material
      const innerMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorScheme.body).multiplyScalar(1.3), // Brighter version
        transparent: true,
        opacity: 0.6,
        roughness: 0.5,
        metalness: 0.2,
        side: THREE.DoubleSide
      });
      
      const inner = new THREE.Mesh(innerGeometry, innerMaterial);
      inner.rotation.x = Math.PI;
      inner.position.y = bellRadius * 0.05; // Slightly offset
      group.add(inner);
      
      // Create tentacles
      const tentacleMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorScheme.tentacles),
        transparent: true,
        opacity: 0.6,
        roughness: 0.6,
        metalness: 0.1
      });
      
      // Create varied tentacles around the rim
      for (let i = 0; i < tentacleCount; i++) {
        // Angle around the rim
        const angle = (i / tentacleCount) * Math.PI * 2;
        
        // Create a tentacle as a curved line of segments
        const tentacleLength = bellRadius * (1.5 + Math.random() * 1.5);
        const segmentCount = Math.floor(tentacleLength * 10); // More segments for smoother curve
        
        // Primary tentacles - thicker
        if (i % 3 === 0) {
          const tentacleWidth = 0.04 + Math.random() * 0.03;
          const tentacleGeometry = new THREE.CylinderGeometry(
            tentacleWidth * 0.3, // Top radius (tapered)
            tentacleWidth,       // Bottom radius
            tentacleLength,
            6,                  // Radial segments
            segmentCount,       // Height segments
            false               // Open-ended
          );
          
          // Curve the tentacle
          if (tentacleGeometry.attributes.position) {
            const positions = tentacleGeometry.attributes.position.array;
            
            for (let j = 0; j < positions.length / 3; j++) {
              const y = positions[j * 3 + 1];
              
              // Normalized y position along tentacle (0 at top, 1 at bottom)
              const normalizedY = (y + tentacleLength / 2) / tentacleLength;
              
              // Apply sine curve with increasing amplitude and low frequency
              const wavePhase = i * 0.7; // Varied phase for each tentacle
              const amplitude = normalizedY * 0.2 * tentacleLength;
              const waveCurve = Math.sin(normalizedY * 3 + wavePhase) * amplitude;
              
              // Curve in x direction
              positions[j * 3] += waveCurve;
              
              // Add some z variation too
              positions[j * 3 + 2] += Math.cos(normalizedY * 2 + wavePhase) * amplitude * 0.7;
            }
            
            tentacleGeometry.attributes.position.needsUpdate = true;
            tentacleGeometry.computeVertexNormals();
          }
          
          const tentacle = new THREE.Mesh(tentacleGeometry, tentacleMaterial);
          
          // Position at the bell rim
          tentacle.position.set(
            Math.cos(angle) * bellRadius,
            -bellHeight - tentacleLength / 2,
            Math.sin(angle) * bellRadius
          );
          
          group.add(tentacle);
        } 
        // Secondary tentacles - thinner
        else {
          const tentacleWidth = 0.02 + Math.random() * 0.01;
          const tentacleLength = bellRadius * (1.0 + Math.random());
          
          const tentacleGeometry = new THREE.CylinderGeometry(
            tentacleWidth * 0.2, // More tapered
            tentacleWidth,
            tentacleLength,
            4,                  // Fewer radial segments
            Math.floor(segmentCount * 0.7),
            false
          );
          
          // Curve more dramatically
          if (tentacleGeometry.attributes.position) {
            const positions = tentacleGeometry.attributes.position.array;
            
            for (let j = 0; j < positions.length / 3; j++) {
              const y = positions[j * 3 + 1];
              
              // Normalized y position
              const normalizedY = (y + tentacleLength / 2) / tentacleLength;
              
              // Apply more dramatic curves
              const wavePhase = i * 1.1;
              const amplitude = Math.pow(normalizedY, 2) * 0.25 * tentacleLength;
              const waveCurve = Math.sin(normalizedY * 4 + wavePhase) * amplitude;
              
              positions[j * 3] += waveCurve;
              positions[j * 3 + 2] += Math.cos(normalizedY * 3 + wavePhase + 1) * amplitude * 0.8;
            }
            
            tentacleGeometry.attributes.position.needsUpdate = true;
            tentacleGeometry.computeVertexNormals();
          }
          
          const tentacle = new THREE.Mesh(tentacleGeometry, tentacleMaterial);
          
          // Position with slight offset from rim for variety
          const rimOffset = (Math.random() - 0.5) * 0.1;
          tentacle.position.set(
            Math.cos(angle) * (bellRadius + rimOffset),
            -bellHeight - tentacleLength / 2,
            Math.sin(angle) * (bellRadius + rimOffset)
          );
          
          group.add(tentacle);
        }
      }
      
      // Apply scale from definition
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      return group;
    } catch (error) {
      console.error(`Error creating jellyfish: ${error}`);
      // Create a visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_jellyfish";
      return errorMesh;
    }
  }

  /**
   * Create a bubble stream
   */
  static createBubbleStream(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      
      // Bubble parameters
      const bubbleCount = 15 + Math.floor(Math.random() * 20);
      const streamHeight = 2.0 + Math.random() * 2.0;
      const streamRadius = 0.2 + Math.random() * 0.3;
      
      // Create a shared bubble material
      const bubbleMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xffffff),
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        metalness: 0.3,
        envMapIntensity: 1.5
      });
      
      // Create bubbles
      for (let i = 0; i < bubbleCount; i++) {
        // Bubbles get slightly larger as they rise (expanding due to pressure)
        const normalizedHeight = i / bubbleCount;
        const bubbleSize = 0.03 + normalizedHeight * 0.04 + Math.random() * 0.05;
        
        const bubbleGeometry = new THREE.SphereGeometry(bubbleSize, 8, 8);
        const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        
        // Position in a column with some randomness
        const angle = Math.random() * Math.PI * 2;
        
        // Spread increases with height
        const spreadFactor = normalizedHeight * streamRadius;
        
        bubble.position.set(
          Math.cos(angle) * spreadFactor * Math.random(),
          normalizedHeight * streamHeight,
          Math.sin(angle) * spreadFactor * Math.random()
        );
        
        group.add(bubble);
      }
      
      // Add a small vent/source at the bottom
      const ventRadius = 0.1 + Math.random() * 0.1;
      const ventGeometry = new THREE.CircleGeometry(ventRadius, 8);
      
      const ventMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x333333),
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      
      const vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.rotation.x = -Math.PI / 2; // Make it face upward
      vent.position.y = -0.01; // Slightly below ground level
      group.add(vent);
      
      // Add small rock formation around the vent
      const rockCount = 4 + Math.floor(Math.random() * 4);
      
      for (let i = 0; i < rockCount; i++) {
        const rockSize = 0.05 + Math.random() * 0.08;
        const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
        
        const rockMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(0x666666),
          roughness: 0.9,
          metalness: 0.1
        });
        
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        
        // Position around the vent
        const angle = (i / rockCount) * Math.PI * 2 + Math.random() * 0.5;
        const distance = ventRadius * (0.8 + Math.random() * 0.5);
        
        rock.position.set(
          Math.cos(angle) * distance,
          rockSize * 0.5 * Math.random(),
          Math.sin(angle) * distance
        );
        
        // Random rotation
        rock.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
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
      console.error(`Error creating bubble stream: ${error}`);
      // Create a visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_bubbleStream";
      return errorMesh;
    }
  }

  /**
   * Create floating debris decoration
   */
  static createFloatingDebris(definition: DecorationDefinition): THREE.Group {
    try {
      const group = new THREE.Group();
      
      // Create a cluster of floating debris items
      const debrisCount = 5 + Math.floor(Math.random() * 5);
      
      // Size of the cluster
      const clusterRadius = 0.5 + Math.random() * 0.5;
      
      // Create wood material
      const woodMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x8B4513),  // Brown
        roughness: 0.9,
        metalness: 0.1
      });
      
      // Create fabric/sail material
      const fabricMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xDDDDCC),  // Off-white
        roughness: 1.0,
        metalness: 0.0,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });
      
      // Create different types of debris
      for (let i = 0; i < debrisCount; i++) {
        // Choose a debris type
        const debrisType = Math.floor(Math.random() * 4);
        let debris;
        
        switch (debrisType) {
          case 0:
            // Wooden plank
            const plankLength = 0.3 + Math.random() * 0.4;
            const plankWidth = 0.05 + Math.random() * 0.05;
            const plankHeight = 0.02 + Math.random() * 0.02;
            
            const plankGeometry = new THREE.BoxGeometry(plankLength, plankHeight, plankWidth);
            
            // Add some distress/weathering
            if (plankGeometry.attributes.position) {
              const positions = plankGeometry.attributes.position.array;
              
              for (let j = 0; j < positions.length / 3; j++) {
                positions[j * 3] += (Math.random() - 0.5) * 0.01;
                positions[j * 3 + 1] += (Math.random() - 0.5) * 0.005;
                positions[j * 3 + 2] += (Math.random() - 0.5) * 0.01;
              }
              
              plankGeometry.attributes.position.needsUpdate = true;
              plankGeometry.computeVertexNormals();
            }
            
            debris = new THREE.Mesh(plankGeometry, woodMaterial);
            break;
            
          case 1:
            // Broken barrel piece (curved wood)
            const barrelPieceGeometry = new THREE.CylinderGeometry(
              0.2,            // Radius
              0.2,            // Radius
              0.3,            // Height
              8,              // Radial segments
              1,              // Height segments
              true,           // Open-ended
              0,              // Start angle
              Math.PI * 0.7   // End angle (partial cylinder)
            );
            
            debris = new THREE.Mesh(barrelPieceGeometry, woodMaterial);
            break;
            
          case 2:
            // Piece of sail/fabric
            const clothGeometry = new THREE.PlaneGeometry(0.3, 0.3, 5, 5);
            
            // Add some wave/ripple to the fabric
            if (clothGeometry.attributes.position) {
              const positions = clothGeometry.attributes.position.array;
              
              for (let j = 0; j < positions.length / 3; j++) {
                const x = positions[j * 3];
                const y = positions[j * 3 + 1];
                
                // Add wave pattern
                positions[j * 3 + 2] = Math.sin(x * 10) * 0.02 + Math.sin(y * 10) * 0.02;
              }
              
              clothGeometry.attributes.position.needsUpdate = true;
              clothGeometry.computeVertexNormals();
            }
            
            debris = new THREE.Mesh(clothGeometry, fabricMaterial);
            break;
            
          case 3:
            // Broken wooden crate panel
            const cratePanelGeometry = new THREE.BoxGeometry(0.25, 0.25, 0.02);
            
            // Add some damage
            if (cratePanelGeometry.attributes.position) {
              const positions = cratePanelGeometry.attributes.position.array;
              
              for (let j = 0; j < positions.length / 3; j++) {
                // Make one corner broken/missing by adjusting vertices
                const x = positions[j * 3];
                const y = positions[j * 3 + 1];
                
                if (x > 0.1 && y > 0.1) {
                  positions[j * 3] -= 0.1;
                  positions[j * 3 + 1] -= 0.1;
                }
                
                // Add general weathering/distress
                positions[j * 3] += (Math.random() - 0.5) * 0.01;
                positions[j * 3 + 1] += (Math.random() - 0.5) * 0.01;
              }
              
              cratePanelGeometry.attributes.position.needsUpdate = true;
              cratePanelGeometry.computeVertexNormals();
            }
            
            debris = new THREE.Mesh(cratePanelGeometry, woodMaterial);
            break;
        }
        
        // Distribute debris within the cluster
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() * 0.5 + 0.7) * Math.PI; // Mostly upward
        const radius = clusterRadius * Math.random();
        
        debris.position.set(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta)
        );
        
        // Random rotation
        debris.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        );
        
        group.add(debris);
        
        // Occasionally add some smaller fragments/details
        if (Math.random() > 0.7) {
          const fragmentCount = 1 + Math.floor(Math.random() * 3);
          
          for (let j = 0; j < fragmentCount; j++) {
            const fragmentSize = 0.05 + Math.random() * 0.05;
            
            // Choose between wood chips and rope bits
            if (Math.random() > 0.5) {
              // Wood chip
              const chipGeometry = new THREE.BoxGeometry(
                fragmentSize, 
                fragmentSize * 0.2, 
                fragmentSize * 0.5
              );
              
              const chip = new THREE.Mesh(chipGeometry, woodMaterial);
              
              // Position near the main debris
              chip.position.set(
                debris.position.x + (Math.random() - 0.5) * 0.1,
                debris.position.y + (Math.random() - 0.5) * 0.1,
                debris.position.z + (Math.random() - 0.5) * 0.1
              );
              
              // Random rotation
              chip.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
              );
              
              group.add(chip);
            } else {
              // Rope bit
              const ropeGeometry = new THREE.CylinderGeometry(
                fragmentSize * 0.1,
                fragmentSize * 0.1,
                fragmentSize * 3,
                6,
                1
              );
              
              // Curve the rope
              if (ropeGeometry.attributes.position) {
                const positions = ropeGeometry.attributes.position.array;
                
                for (let k = 0; k < positions.length / 3; k++) {
                  const y = positions[k * 3 + 1];
                  
                  // Normalize height
                  const normalizedY = (y + fragmentSize * 1.5) / (fragmentSize * 3);
                  
                  // Apply curve
                  positions[k * 3] += Math.sin(normalizedY * Math.PI * 2) * fragmentSize * 0.5;
                }
                
                ropeGeometry.attributes.position.needsUpdate = true;
                ropeGeometry.computeVertexNormals();
              }
              
              const ropeMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0x8B7355),  // Rope color
                roughness: 1.0,
                metalness: 0.0
              });
              
              const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
              
              // Position near main debris
              rope.position.set(
                debris.position.x + (Math.random() - 0.5) * 0.15,
                debris.position.y + (Math.random() - 0.5) * 0.15,
                debris.position.z + (Math.random() - 0.5) * 0.15
              );
              
              // Random rotation
              rope.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
              );
              
              group.add(rope);
            }
          }
        }
      }
      
      // Apply scale from definition
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      return group;
    } catch (error) {
      console.error(`Error creating floating debris: ${error}`);
      // Create a visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_floatingDebris";
      return errorMesh;
    }
  }
}