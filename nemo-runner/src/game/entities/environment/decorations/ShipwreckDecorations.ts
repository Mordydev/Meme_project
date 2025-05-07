import * as THREE from 'three';
import { DecorationDefinition } from '../DecorationDefinitions';

/**
 * Contains factory methods for creating shipwreck-related decorations
 */
export class ShipwreckDecorations {
  /**
   * Create a ship hull decoration
   */
  static createShipHull(definition: DecorationDefinition): THREE.Object3D {
    try {
      // Create a group for the shipwreck
      const group = new THREE.Group();
      
      // Hull dimensions
      const hullLength = 3.0;
      const hullWidth = 1.0;
      const hullHeight = 0.8;
      
      // Create the main hull shape
      const hullShape = new THREE.Shape();
      
      // Draw the bottom outline with a curve for the bow
      hullShape.moveTo(-hullLength/2, 0);
      hullShape.lineTo(hullLength/2 - 0.3, 0); // Bottom right corner
      
      // Curve for the front/bow
      hullShape.bezierCurveTo(
        hullLength/2, 0,
        hullLength/2, hullHeight/2,
        hullLength/2, hullHeight
      );
      
      // Top line
      hullShape.lineTo(-hullLength/2, hullHeight); // Top left
      hullShape.lineTo(-hullLength/2, 0); // Back to start
      
      // Extrude to create the 3D hull
      const extrudeSettings = {
        steps: 1,
        depth: hullWidth,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 3
      };
      
      const hullGeometry = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
      
      // Create the hull material - weathered wood
      const hullMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x553311),  // Brownish
        roughness: 0.9,
        metalness: 0.1
      });
      
      const hull = new THREE.Mesh(hullGeometry, hullMaterial);
      
      // Center the hull
      hull.position.set(0, 0, -hullWidth/2);
      group.add(hull);
      
      // Damage the hull (add breaks, holes, and missing parts)
      
      // Add a large break in the hull (cut out a section)
      if (Math.random() > 0.3) {
        const breakWidth = 0.3 + Math.random() * 0.4;
        const breakHeight = 0.2 + Math.random() * 0.3;
        const breakDepth = hullWidth + 0.1; // Slightly larger than hull width
        
        const breakGeometry = new THREE.BoxGeometry(breakWidth, breakHeight, breakDepth);
        
        // Create a break material for CSG operation
        const breakMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const breakMesh = new THREE.Mesh(breakGeometry, breakMaterial);
        
        // Position the break somewhere along the hull side
        const breakX = (Math.random() - 0.5) * (hullLength - breakWidth);
        const breakY = Math.random() * (hullHeight - breakHeight);
        breakMesh.position.set(breakX, breakY, 0);
        
        // This would normally use CSG for boolean operations
        // Since we can't use CSG here, we'll simulate the break with additional meshes
        
        // Add weathered boards around the break
        const boardMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(0x3d2412),  // Darker brown
          roughness: 1.0,
          metalness: 0.0
        });
        
        // Add broken planks
        for (let i = 0; i < 6; i++) {
          const plankWidth = 0.05 + Math.random() * 0.05;
          const plankHeight = 0.1 + Math.random() * 0.3;
          const plankDepth = 0.03;
          
          const plankGeometry = new THREE.BoxGeometry(plankWidth, plankHeight, plankDepth);
          
          // Add some weathering variation to the plank
          if (plankGeometry.attributes.position) {
            const positions = plankGeometry.attributes.position.array;
            
            for (let j = 0; j < positions.length / 3; j++) {
              // Add some random deformation
              positions[j * 3] += (Math.random() - 0.5) * 0.01;
              positions[j * 3 + 1] += (Math.random() - 0.5) * 0.01;
              positions[j * 3 + 2] += (Math.random() - 0.5) * 0.01;
            }
            
            plankGeometry.attributes.position.needsUpdate = true;
            plankGeometry.computeVertexNormals();
          }
          
          const plank = new THREE.Mesh(plankGeometry, boardMaterial);
          
          // Position around the break
          const angle = Math.random() * Math.PI * 2;
          const radius = breakWidth/2 * 1.2 + Math.random() * 0.1;
          
          plank.position.set(
            breakX + Math.cos(angle) * radius,
            breakY + Math.sin(angle) * radius,
            (Math.random() - 0.5) * hullWidth
          );
          
          // Random rotation to appear broken
          plank.rotation.set(
            Math.random() * Math.PI * 0.5,
            Math.random() * Math.PI * 0.5,
            Math.random() * Math.PI - Math.PI/2
          );
          
          group.add(plank);
        }
      }
      
      // Add some planking details to the hull
      const plankingMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x4d2600),  // Slightly different wood tone
        roughness: 0.85,
        metalness: 0.1
      });
      
      // Add horizontal planking lines
      const plankSpacing = 0.1;
      const numPlanks = Math.floor(hullHeight / plankSpacing);
      
      for (let i = 0; i < numPlanks; i++) {
        const plankGeometry = new THREE.BoxGeometry(hullLength * 1.01, 0.01, hullWidth * 1.01);
        const plank = new THREE.Mesh(plankGeometry, plankingMaterial);
        
        plank.position.set(0, i * plankSpacing + plankSpacing/2, 0);
        hull.add(plank);
      }
      
      // Add a gunwale/edge along the top
      const gunwaleGeometry = new THREE.BoxGeometry(hullLength, 0.05, hullWidth * 1.1);
      const gunwale = new THREE.Mesh(gunwaleGeometry, plankingMaterial);
      gunwale.position.set(0, hullHeight + 0.025, 0);
      hull.add(gunwale);
      
      // Add some vertical ribs inside the hull
      const ribMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x332211),  // Darker wood
        roughness: 0.9,
        metalness: 0.1
      });
      
      const ribCount = 5;
      const ribSpacing = hullLength / (ribCount + 1);
      
      for (let i = 0; i < ribCount; i++) {
        const ribGeometry = new THREE.BoxGeometry(0.04, hullHeight * 0.9, hullWidth * 0.9);
        const rib = new THREE.Mesh(ribGeometry, ribMaterial);
        
        // Position along the hull length
        rib.position.set(-hullLength/2 + (i + 1) * ribSpacing, hullHeight * 0.45, 0);
        hull.add(rib);
      }
      
      // Add some marine growth and weathering
      const growthMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x225522),  // Dark green
        roughness: 0.9,
        metalness: 0.0
      });
      
      // Add growth patches at the waterline and below
      for (let i = 0; i < 20; i++) {
        const growthGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const growth = new THREE.Mesh(growthGeometry, growthMaterial);
        
        // More growth near the bottom
        const heightBias = Math.pow(Math.random(), 2) * hullHeight * 0.7;
        
        // Position on the hull surface
        const side = Math.random() > 0.5 ? 1 : -1;
        
        growth.position.set(
          (Math.random() - 0.5) * hullLength,
          heightBias,
          (hullWidth/2 + 0.01) * side
        );
        
        // Random scaling
        const scale = 0.3 + Math.random() * 0.7;
        growth.scale.set(scale, scale * 0.3, scale);
        
        group.add(growth);
      }
      
      // Add some decorative elements - maybe a damaged mast
      if (Math.random() > 0.5) {
        const mastRadius = 0.06;
        const mastHeight = 1.5 + Math.random() * 1.0;
        
        // Create a broken mast
        const mastGeometry = new THREE.CylinderGeometry(
          mastRadius,       // Top radius (tapered)
          mastRadius * 1.2, // Bottom radius
          mastHeight,
          8,                // Radial segments
          1                 // Height segments
        );
        
        const mastMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(0x554422),  // Wood color
          roughness: 0.9,
          metalness: 0.1
        });
        
        const mast = new THREE.Mesh(mastGeometry, mastMaterial);
        
        // Position mast at a random position along the deck
        const mastX = (Math.random() - 0.5) * (hullLength * 0.6);
        mast.position.set(mastX, hullHeight + mastHeight/2, 0);
        
        // Add a broken/angled top to the mast
        mast.rotation.z = (Math.random() - 0.5) * Math.PI * 0.3;
        
        group.add(mast);
        
        // Maybe add some broken sail/rope elements
        if (Math.random() > 0.5) {
          // A simple sail remnant
          const sailShape = new THREE.Shape();
          sailShape.moveTo(0, 0);
          sailShape.lineTo(0.5, 0.1);
          sailShape.lineTo(0.4, 0.5);
          sailShape.lineTo(0.1, 0.7);
          sailShape.lineTo(0, 0);
          
          const sailGeometry = new THREE.ShapeGeometry(sailShape);
          
          const sailMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0xBBBB99),  // Sail cloth color
            roughness: 1.0,
            metalness: 0.0,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
          });
          
          const sail = new THREE.Mesh(sailGeometry, sailMaterial);
          
          // Position near the mast
          sail.position.set(mastX, hullHeight + 0.5, 0.2);
          
          // Random rotation
          sail.rotation.set(
            Math.random() * Math.PI * 0.3,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 0.3
          );
          
          group.add(sail);
        }
      }
      
      // Apply scale from definition
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      // Apply random rotation around Y axis
      group.rotation.y = Math.random() * definition.rotationVariance;
      
      // Tilt the hull to look more like a shipwreck
      const tiltAmount = Math.PI * 0.1 + Math.random() * Math.PI * 0.2;
      group.rotation.z = tiltAmount;
      
      // Bury the hull partially in the ground
      group.position.y = -hullHeight * 0.3;
      
      return group;
    } catch (error) {
      console.error(`Error creating ship hull: ${error}`);
      // Create a visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_shipHull";
      return errorMesh;
    }
  }

  /**
   * Create a barrel decoration
   */
  static createBarrel(definition: DecorationDefinition): THREE.Object3D {
    try {
      // Create a group to hold all parts of the barrel
      const group = new THREE.Group();
      
      // Barrel dimensions
      const barrelRadius = 0.4;
      const barrelHeight = 0.8;
      
      // Create the main barrel body
      const barrelGeometry = new THREE.CylinderGeometry(
        barrelRadius,     // Top radius
        barrelRadius,     // Bottom radius
        barrelHeight,     // Height
        12,               // Radial segments for circular shape
        1,                // Height segments
        false             // Open-ended
      );
      
      // Material for the barrel wood
      const woodMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x5d4037),  // Brown wood color
        roughness: 0.9,
        metalness: 0.1
      });
      
      const barrel = new THREE.Mesh(barrelGeometry, woodMaterial);
      group.add(barrel);
      
      // Add metal rings around the barrel
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x6A6A6A),  // Metal gray color
        roughness: 0.6,
        metalness: 0.7
      });
      
      // Create three rings: top, middle, and bottom
      const ringPositions = [-0.35, 0, 0.35];  // Positions along the barrel height
      
      ringPositions.forEach(yPos => {
        // Create a torus (ring) geometry
        const ringGeometry = new THREE.TorusGeometry(
          barrelRadius * 1.02,    // Radius of the ring (slightly larger than barrel)
          barrelRadius * 0.05,    // Thickness of the ring
          8,                      // Radial segments
          16                      // Tubular segments
        );
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.y = yPos * barrelHeight;
        ring.rotation.x = Math.PI / 2;  // Rotate to align with barrel
        group.add(ring);
      });
      
      // Add some wear and tear - random dents in the barrel
      if (barrelGeometry.attributes.position) {
        const positions = barrelGeometry.attributes.position.array;
        
        // Apply random small deformations to vertices
        for (let i = 0; i < positions.length / 3; i++) {
          // Skip the top and bottom vertices
          const y = positions[i * 3 + 1];
          if (y < barrelHeight / 2 - 0.05 && y > -barrelHeight / 2 + 0.05) {
            // Apply minor random deformation for weathered look
            const deform = (Math.random() - 0.5) * 0.03;
            positions[i * 3] += deform;
            positions[i * 3 + 2] += deform;
          }
        }
        
        barrelGeometry.attributes.position.needsUpdate = true;
        barrelGeometry.computeVertexNormals();
      }
      
      // Add some algae or growth texture to show it's been underwater
      const growthGeometry = new THREE.SphereGeometry(barrelRadius * 0.1, 8, 8);
      const growthMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x2e7d32),  // Green color
        roughness: 0.9,
        metalness: 0.0
      });
      
      // Add a few random patches of growth
      for (let i = 0; i < 5; i++) {
        const growth = new THREE.Mesh(growthGeometry, growthMaterial);
        
        // Position randomly on the barrel surface
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * barrelHeight * 0.8;
        
        growth.position.set(
          Math.cos(angle) * barrelRadius,
          height,
          Math.sin(angle) * barrelRadius
        );
        
        // Random scaling for variety
        const scale = 0.5 + Math.random() * 1.0;
        growth.scale.set(scale, scale * 0.5, scale);
        
        group.add(growth);
      }
      
      // Apply scale from definition
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      // Apply random rotation around Y axis
      group.rotation.y = Math.random() * definition.rotationVariance;
      
      // Randomly tilt the barrel a bit like it fell over
      if (Math.random() > 0.6) {
        const tiltAmount = Math.random() * Math.PI * 0.15;
        const tiltDirection = Math.random() * Math.PI * 2;
        
        group.rotation.x = Math.cos(tiltDirection) * tiltAmount;
        group.rotation.z = Math.sin(tiltDirection) * tiltAmount;
      }
      
      return group;
    } catch (error) {
      console.error(`Error creating barrel: ${error}`);
      // Create a visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_barrel";
      return errorMesh;
    }
  }

  /**
   * Create a treasure chest decoration
   */
  static createTreasure(definition: DecorationDefinition): THREE.Object3D {
    try {
      // Create a group to hold the treasure chest and its contents
      const group = new THREE.Group();
      
      // Chest dimensions
      const chestWidth = 0.6;
      const chestHeight = 0.4;
      const chestDepth = 0.4;
      
      // Create the main chest body as a slightly modified box
      const chestGeometry = new THREE.BoxGeometry(
        chestWidth, 
        chestHeight, 
        chestDepth, 
        3, 3, 3
      );
      
      // Round the top edges a bit to make it look more like a chest
      if (chestGeometry.attributes.position) {
        const positions = chestGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
          const y = positions[i * 3 + 1];
          
          // For the top face vertices only
          if (y > chestHeight / 2 - 0.05) {
            // Round the corners a bit
            const x = positions[i * 3];
            const z = positions[i * 3 + 2];
            
            // Check if it's a corner
            if (Math.abs(x) > chestWidth / 2 - 0.1 && Math.abs(z) > chestDepth / 2 - 0.1) {
              // Push in the corners slightly
              if (x > 0) positions[i * 3] = positions[i * 3] - 0.05;
              if (x < 0) positions[i * 3] = positions[i * 3] + 0.05;
              if (z > 0) positions[i * 3 + 2] = positions[i * 3 + 2] - 0.05;
              if (z < 0) positions[i * 3 + 2] = positions[i * 3 + 2] + 0.05;
            }
          }
        }
        
        chestGeometry.attributes.position.needsUpdate = true;
        chestGeometry.computeVertexNormals();
      }
      
      // Material for the wooden chest
      const chestMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x4d2600),  // Dark brown for weathered wood
        roughness: 0.85,
        metalness: 0.1
      });
      
      const chest = new THREE.Mesh(chestGeometry, chestMaterial);
      group.add(chest);
      
      // Add metal trims and decorations to the chest
      const metalMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xbca136),  // Worn gold/brass color
        roughness: 0.4,
        metalness: 0.8
      });
      
      // Create a rim around the top of the chest
      const rimWidth = 0.03;
      const rimGeometry = new THREE.BoxGeometry(
        chestWidth + rimWidth,
        rimWidth,
        chestDepth + rimWidth
      );
      
      const rim = new THREE.Mesh(rimGeometry, metalMaterial);
      rim.position.y = chestHeight / 2;
      group.add(rim);
      
      // Create a lock for the chest
      const lockGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.07);
      const lock = new THREE.Mesh(lockGeometry, metalMaterial);
      lock.position.set(0, 0, chestDepth / 2 + 0.02);
      group.add(lock);
      
      // Create some treasure spilling out if the chest is opened
      if (Math.random() > 0.5) {
        // Chest is opened - create lid
        const lidGeometry = new THREE.BoxGeometry(chestWidth, chestHeight / 2, chestDepth);
        
        // Round the top edges of the lid
        if (lidGeometry.attributes.position) {
          const positions = lidGeometry.attributes.position.array;
          
          for (let i = 0; i < positions.length / 3; i++) {
            const y = positions[i * 3 + 1];
            
            // For the top face vertices only
            if (y > chestHeight / 4 - 0.05) {
              // Round the corners a bit
              const x = positions[i * 3];
              const z = positions[i * 3 + 2];
              
              // Check if it's a corner
              if (Math.abs(x) > chestWidth / 2 - 0.1 && Math.abs(z) > chestDepth / 2 - 0.1) {
                // Push in the corners slightly
                if (x > 0) positions[i * 3] = positions[i * 3] - 0.05;
                if (x < 0) positions[i * 3] = positions[i * 3] + 0.05;
                if (z > 0) positions[i * 3 + 2] = positions[i * 3 + 2] - 0.05;
                if (z < 0) positions[i * 3 + 2] = positions[i * 3 + 2] + 0.05;
              }
            }
          }
          
          lidGeometry.attributes.position.needsUpdate = true;
          lidGeometry.computeVertexNormals();
        }
        
        const lid = new THREE.Mesh(lidGeometry, chestMaterial);
        
        // Position the lid as if it's opened
        lid.position.set(0, chestHeight / 2, -chestDepth / 2);
        lid.rotation.x = -Math.PI / 3; // Open at about 60 degrees
        
        // Add metal rim to the lid
        const lidRimGeometry = new THREE.BoxGeometry(
          chestWidth + rimWidth,
          rimWidth,
          chestDepth
        );
        
        const lidRim = new THREE.Mesh(lidRimGeometry, metalMaterial);
        lidRim.position.y = chestHeight / 4;
        lid.add(lidRim);
        
        group.add(lid);
        
        // Add some gold coins spilling out
        const coinMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(0xffd700),  // Gold color
          roughness: 0.3,
          metalness: 0.9
        });
        
        // Create several coins
        for (let i = 0; i < 12; i++) {
          const coinGeometry = new THREE.CylinderGeometry(
            0.05 + Math.random() * 0.02, // Radius
            0.05 + Math.random() * 0.02, // Radius
            0.015,                      // Height/thickness
            12,                         // Radial segments
            1,                          // Height segments
            false                       // Open-ended
          );
          
          const coin = new THREE.Mesh(coinGeometry, coinMaterial);
          
          // Position coins in and around the chest
          const spreadX = (Math.random() - 0.5) * chestWidth * 1.2;
          const spreadY = Math.random() * chestHeight * 0.4;
          const spreadZ = (Math.random() - 0.5) * chestDepth * 1.2;
          
          coin.position.set(spreadX, spreadY, spreadZ);
          
          // Random rotation for the coins
          coin.rotation.x = Math.random() * Math.PI;
          coin.rotation.y = Math.random() * Math.PI * 2;
          
          group.add(coin);
        }
        
        // Maybe a gem or two
        const gemColors = [0xff0000, 0x0000ff, 0x00ff00, 0xffff00];
        
        for (let i = 0; i < 3; i++) {
          const gemGeometry = new THREE.OctahedronGeometry(0.08, 0);
          
          const gemMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(gemColors[Math.floor(Math.random() * gemColors.length)]),
            roughness: 0.2,
            metalness: 0.8,
            transparent: true,
            opacity: 0.9
          });
          
          const gem = new THREE.Mesh(gemGeometry, gemMaterial);
          
          // Position the gems among the coins
          const spreadX = (Math.random() - 0.5) * chestWidth;
          const spreadY = Math.random() * chestHeight * 0.3 + 0.1;
          const spreadZ = (Math.random() - 0.5) * chestDepth;
          
          gem.position.set(spreadX, spreadY, spreadZ);
          
          // Random rotation for the gems
          gem.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
          );
          
          group.add(gem);
        }
      } else {
        // Chest is closed - add metal bands
        const bandMaterial = metalMaterial;
        
        // Horizontal bands
        const horizontalBandGeometry = new THREE.BoxGeometry(
          chestWidth + 0.01,
          0.03,
          chestDepth + 0.01
        );
        
        // Add a few horizontal bands
        const bandPositions = [-chestHeight/4, 0, chestHeight/4];
        
        bandPositions.forEach(yPos => {
          const band = new THREE.Mesh(horizontalBandGeometry, bandMaterial);
          band.position.y = yPos;
          group.add(band);
        });
        
        // Vertical band
        const verticalBandGeometry = new THREE.BoxGeometry(
          0.03,
          chestHeight + 0.01,
          chestDepth + 0.01
        );
        
        const verticalBand = new THREE.Mesh(verticalBandGeometry, bandMaterial);
        group.add(verticalBand);
      }
      
      // Add some sea growth and weathering
      const growthMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x225522),  // Dark green
        roughness: 0.9,
        metalness: 0.0
      });
      
      // Add a few patches of growth
      for (let i = 0; i < 5; i++) {
        const growthGeometry = new THREE.SphereGeometry(0.04, 8, 8);
        const growth = new THREE.Mesh(growthGeometry, growthMaterial);
        
        // Position randomly on the chest
        const side = Math.floor(Math.random() * 6);
        let x = 0, y = 0, z = 0;
        
        switch(side) {
          case 0: // Top
            x = (Math.random() - 0.5) * chestWidth;
            y = chestHeight / 2;
            z = (Math.random() - 0.5) * chestDepth;
            break;
          case 1: // Bottom
            x = (Math.random() - 0.5) * chestWidth;
            y = -chestHeight / 2;
            z = (Math.random() - 0.5) * chestDepth;
            break;
          case 2: // Left
            x = -chestWidth / 2;
            y = (Math.random() - 0.5) * chestHeight;
            z = (Math.random() - 0.5) * chestDepth;
            break;
          case 3: // Right
            x = chestWidth / 2;
            y = (Math.random() - 0.5) * chestHeight;
            z = (Math.random() - 0.5) * chestDepth;
            break;
          case 4: // Front
            x = (Math.random() - 0.5) * chestWidth;
            y = (Math.random() - 0.5) * chestHeight;
            z = chestDepth / 2;
            break;
          case 5: // Back
            x = (Math.random() - 0.5) * chestWidth;
            y = (Math.random() - 0.5) * chestHeight;
            z = -chestDepth / 2;
            break;
        }
        
        growth.position.set(x, y, z);
        
        // Random scaling for variety
        const scale = 0.5 + Math.random() * 1.0;
        growth.scale.set(scale, scale * 0.5, scale);
        
        group.add(growth);
      }
      
      // Apply scale from definition
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      // Apply random rotation around Y axis
      group.rotation.y = Math.random() * definition.rotationVariance;
      
      // Randomly bury the chest partway in the sand
      group.position.y = -chestHeight * 0.2;
      
      return group;
    } catch (error) {
      console.error(`Error creating treasure: ${error}`);
      // Create a visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_treasure";
      return errorMesh;
    }
  }

  /**
   * Create an anchor decoration
   */
  static createAnchor(definition: DecorationDefinition): THREE.Object3D {
    try {
      // Create a group to hold all parts of the anchor
      const group = new THREE.Group();
      
      // Anchor dimensions
      const shaftHeight = 1.2;
      const shaftRadius = 0.06;
      const armLength = 0.4;
      const armWidth = 0.06;
      const stockLength = 0.6;
      const stockWidth = 0.04;
      
      // Create the main shaft (vertical part)
      const shaftGeometry = new THREE.CylinderGeometry(
        shaftRadius,        // Top radius
        shaftRadius,        // Bottom radius
        shaftHeight,        // Height
        8,                  // Radial segments
        1,                  // Height segments
        false               // Open-ended
      );
      
      // Material for the anchor - rusty iron
      const anchorMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x5a3a1a),  // Rusty brown color
        roughness: 0.8,
        metalness: 0.5
      });
      
      const shaft = new THREE.Mesh(shaftGeometry, anchorMaterial);
      shaft.position.y = shaftHeight / 2;
      group.add(shaft);
      
      // Create the ring at the top
      const ringGeometry = new THREE.TorusGeometry(
        shaftRadius * 3,    // Radius of the ring
        shaftRadius * 0.8,  // Thickness of the ring
        8,                  // Radial segments
        16                  // Tubular segments
      );
      
      const ring = new THREE.Mesh(ringGeometry, anchorMaterial);
      ring.position.y = shaftHeight;
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
      
      // Create the stock (horizontal crossbar near the top)
      const stockGeometry = new THREE.CylinderGeometry(
        stockWidth,         // Radius
        stockWidth,         // Radius
        stockLength,        // Length
        8,                  // Radial segments
        1                   // Height segments
      );
      
      const stock = new THREE.Mesh(stockGeometry, anchorMaterial);
      stock.position.y = shaftHeight * 0.85;
      stock.rotation.z = Math.PI / 2;  // Rotate to make it horizontal
      group.add(stock);
      
      // Create the arms and flukes (the curved parts at the bottom)
      
      // First create the basic arm shape
      const armShape = new THREE.Shape();
      armShape.moveTo(0, 0);
      armShape.lineTo(armLength, 0);
      
      // Add the curve for the fluke 
      armShape.bezierCurveTo(
        armLength * 1.1, armLength * 0.2,  // Control point 1
        armLength * 0.9, armLength * 0.5,  // Control point 2
        armLength * 0.7, armLength * 0.5   // End point
      );
      
      // Complete the shape back to the origin
      armShape.lineTo(0, armWidth);
      armShape.lineTo(0, 0);
      
      // Extrude the shape to create the arm
      const armExtrudeSettings = {
        steps: 1,
        depth: armWidth,
        bevelEnabled: true,
        bevelThickness: armWidth * 0.2,
        bevelSize: armWidth * 0.1,
        bevelSegments: 2
      };
      
      const armGeometry = new THREE.ExtrudeGeometry(armShape, armExtrudeSettings);
      
      // Create both arms
      for (let i = 0; i < 2; i++) {
        const arm = new THREE.Mesh(armGeometry, anchorMaterial);
        
        // Position at the bottom of the shaft
        arm.position.set(-armWidth / 2, 0, 0);
        
        // Rotate and mirror the second arm
        if (i === 0) {
          arm.rotation.set(0, 0, 0);
        } else {
          arm.rotation.set(0, Math.PI, 0);
        }
        
        group.add(arm);
      }
      
      // Add weathered effects and details
      
      // Add some patches of rust/corrosion
      const rustMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x8B4513),  // Darker brown for rust
        roughness: 1.0,
        metalness: 0.2
      });
      
      // Add rust patches on the shaft
      for (let i = 0; i < 8; i++) {
        const rustGeometry = new THREE.SphereGeometry(shaftRadius * 0.8, 4, 4);
        const rust = new THREE.Mesh(rustGeometry, rustMaterial);
        
        // Randomly position around the shaft
        const angle = Math.random() * Math.PI * 2;
        const height = Math.random() * shaftHeight;
        
        rust.position.set(
          Math.cos(angle) * shaftRadius * 1.01,
          height,
          Math.sin(angle) * shaftRadius * 1.01
        );
        
        // Scale to create patches
        const scaleX = 0.3 + Math.random() * 0.5;
        const scaleY = 0.3 + Math.random() * 0.5;
        const scaleZ = 0.1 + Math.random() * 0.1;
        
        rust.scale.set(scaleX, scaleY, scaleZ);
        
        // Random rotation
        rust.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        );
        
        group.add(rust);
      }
      
      // Add some marine growth 
      const growthMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x2D4F00),  // Dark green
        roughness: 0.9,
        metalness: 0.0
      });
      
      // Add growth mostly near the bottom
      for (let i = 0; i < 12; i++) {
        const growthGeometry = new THREE.SphereGeometry(0.05, 4, 4);
        const growth = new THREE.Mesh(growthGeometry, growthMaterial);
        
        // More growth at the bottom parts
        const yBias = Math.pow(Math.random(), 2) * shaftHeight * 0.7;
        
        // Randomly position around the anchor
        if (Math.random() > 0.5) {
          // On the shaft
          const angle = Math.random() * Math.PI * 2;
          growth.position.set(
            Math.cos(angle) * shaftRadius * 1.1,
            yBias,
            Math.sin(angle) * shaftRadius * 1.1
          );
        } else {
          // On the arms/flukes
          const side = Math.random() > 0.5 ? 1 : -1;
          const armPos = Math.random() * armLength;
          
          growth.position.set(
            side * armPos,
            Math.random() * armWidth * 2,
            (Math.random() - 0.5) * armWidth * 2
          );
        }
        
        // Scale for variety
        const scale = 0.5 + Math.random() * 1.0;
        growth.scale.set(scale, scale * 0.6, scale);
        
        group.add(growth);
      }
      
      // Add a chain link or rope remnant at the top
      const ropeRemnant = new THREE.Group();
      
      for (let i = 0; i < 3; i++) {
        const linkGeometry = new THREE.TorusGeometry(
          shaftRadius * 2,      // Size of link
          shaftRadius * 0.4,    // Thickness
          6,                    // Radial segments
          12                    // Tubular segments
        );
        
        const link = new THREE.Mesh(linkGeometry, anchorMaterial);
        
        // Position links in a short chain
        link.position.y = shaftHeight + (i + 1) * shaftRadius * 4;
        
        // Alternate the rotation of links
        if (i % 2 === 0) {
          link.rotation.x = Math.PI / 2;
        } else {
          link.rotation.y = Math.PI / 2;
        }
        
        ropeRemnant.add(link);
      }
      
      // Add some randomness to the chain position
      ropeRemnant.rotation.y = Math.random() * Math.PI * 0.2;
      ropeRemnant.rotation.x = Math.random() * Math.PI * 0.1;
      
      group.add(ropeRemnant);
      
      // Apply scale from definition
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      // Apply random rotation around Y axis
      group.rotation.y = Math.random() * definition.rotationVariance;
      
      // Sometimes tilt the anchor to look like it's fallen over
      if (Math.random() > 0.7) {
        // Create a random tilt angle
        const tiltAmount = Math.PI * 0.3 + Math.random() * Math.PI * 0.2;
        const tiltDirection = Math.random() * Math.PI * 2;
        
        group.rotation.x = Math.sin(tiltDirection) * tiltAmount;
        group.rotation.z = Math.cos(tiltDirection) * tiltAmount;
        
        // Adjust position so it still touches the ground
        group.position.y = Math.sin(tiltAmount) * shaftHeight * 0.5;
      }
      
      return group;
    } catch (error) {
      console.error(`Error creating anchor: ${error}`);
      // Create a visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_anchor";
      return errorMesh;
    }
  }
  
  /**
   * Create a ship part (placeholder - can be filled in with specific ship parts)
   */
  static createShipPart(definition: DecorationDefinition): THREE.Object3D {
    try {
      // For now, use a simple wooden plank/debris as placeholder
      const group = new THREE.Group();
      
      // Create wooden debris
      const plankCount = 3 + Math.floor(Math.random() * 4); // 3-6 planks
      
      // Material for the planks - weathered wood
      const woodMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x5d4037),  // Brown wood color
        roughness: 0.9,
        metalness: 0.1
      });
      
      // Define dimensions outside the loop for access by other parts
      const plankHeight = 0.04 + Math.random() * 0.02;
      
      // Create a group of planks
      for (let i = 0; i < plankCount; i++) {
        // Random plank dimensions
        const plankLength = 0.8 + Math.random() * 0.6;
        const plankWidth = 0.1 + Math.random() * 0.05;
        // Use the common plankHeight defined above
        
        const plankGeometry = new THREE.BoxGeometry(plankLength, plankHeight, plankWidth);
        
        // Add wear and tear to plank
        if (plankGeometry.attributes.position) {
          const positions = plankGeometry.attributes.position.array;
          
          for (let j = 0; j < positions.length / 3; j++) {
            // Add random deformation
            positions[j * 3] += (Math.random() - 0.5) * 0.02;
            positions[j * 3 + 1] += (Math.random() - 0.5) * 0.01;
            positions[j * 3 + 2] += (Math.random() - 0.5) * 0.02;
          }
          
          plankGeometry.attributes.position.needsUpdate = true;
          plankGeometry.computeVertexNormals();
        }
        
        const plank = new THREE.Mesh(plankGeometry, woodMaterial);
        
        // Position planks in a jumbled pile
        plank.position.set(
          (Math.random() - 0.5) * plankLength * 0.3,
          i * plankHeight * 1.2,
          (Math.random() - 0.5) * plankWidth * 2
        );
        
        // Random rotation
        plank.rotation.set(
          Math.random() * Math.PI * 0.2,
          Math.random() * Math.PI,
          Math.random() * Math.PI * 0.2
        );
        
        group.add(plank);
      }
      
      // Add some nails/metal parts
      const metalMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x6A6A6A),  // Metal gray
        roughness: 0.6,
        metalness: 0.7
      });
      
      // Add a few nails
      for (let i = 0; i < 6; i++) {
        const nailGeometry = new THREE.CylinderGeometry(0.01, 0.015, 0.06, 5);
        const nail = new THREE.Mesh(nailGeometry, metalMaterial);
        
        // Position randomly on the planks
        nail.position.set(
          (Math.random() - 0.5) * 0.5,
          Math.random() * plankHeight * plankCount * 1.2,
          (Math.random() - 0.5) * 0.3
        );
        
        // Random slight tilt
        nail.rotation.set(
          (Math.random() - 0.5) * 0.5,
          0,
          (Math.random() - 0.5) * 0.5
        );
        
        group.add(nail);
      }
      
      // Add some marine growth
      const growthMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x225522),  // Dark green
        roughness: 0.9,
        metalness: 0.0
      });
      
      for (let i = 0; i < 5; i++) {
        const growthGeometry = new THREE.SphereGeometry(0.05, 6, 6);
        const growth = new THREE.Mesh(growthGeometry, growthMaterial);
        
        // Position growth on the planks
        growth.position.set(
          (Math.random() - 0.5) * 0.6,
          Math.random() * plankHeight * plankCount,
          (Math.random() - 0.5) * 0.3
        );
        
        // Scale for variety
        const scaleY = 0.5 + Math.random() * 0.5;
        growth.scale.set(1.0, scaleY, 1.0);
        
        group.add(growth);
      }
      
      // Apply scale from definition
      const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
      const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
      group.scale.set(finalScale, finalScale, finalScale);
      
      // Apply random rotation
      group.rotation.y = Math.random() * definition.rotationVariance;
      
      return group;
    } catch (error) {
      console.error(`Error creating ship part: ${error}`);
      // Create a visible error placeholder
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
      const errorMesh = new THREE.Mesh(geometry, material);
      errorMesh.name = "error_placeholder_shipPart";
      return errorMesh;
    }
  }
}