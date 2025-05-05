import * as THREE from 'three';

export class UnderwaterEnvironment {
  scene: THREE.Scene;
  private bubbles: THREE.Points;
  private waterFog: THREE.FogExp2;
  private coral: THREE.Group;
  private seaweed: THREE.Group;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    
    // Add fog for underwater effect
    this.waterFog = new THREE.FogExp2(0x0c6b9c, 0.05);
    this.scene.fog = this.waterFog;
    
    // Create bubbles
    this.bubbles = this.createBubbles();
    this.scene.add(this.bubbles);
    
    // Create coral
    this.coral = this.createCoral();
    this.scene.add(this.coral);
    
    // Create seaweed
    this.seaweed = this.createSeaweed();
    this.scene.add(this.seaweed);
  }
  
  update(deltaTime: number) {
    // Animate bubbles rising
    if (this.bubbles.geometry instanceof THREE.BufferGeometry) {
      const positionAttribute = this.bubbles.geometry.attributes.position;
      
      for (let i = 0; i < positionAttribute.count; i++) {
        // Get current position
        const y = positionAttribute.getY(i);
        
        // Move bubble upwards
        const newY = y + (0.5 + Math.random() * 0.5) * deltaTime;
        
        // Reset if bubble reached the top
        if (newY > 20) {
          positionAttribute.setY(i, -20);
        } else {
          positionAttribute.setY(i, newY);
        }
        
        // Add some random horizontal movement
        const x = positionAttribute.getX(i);
        const newX = x + (Math.random() - 0.5) * 0.1 * deltaTime;
        positionAttribute.setX(i, newX);
      }
      
      positionAttribute.needsUpdate = true;
    }
    
    // Animate seaweed swaying
    this.seaweed.children.forEach((weed, index) => {
      // Oscillate rotation based on time
      weed.rotation.z = Math.sin(Date.now() * 0.001 + index * 0.5) * 0.1;
    });
  }
  
  private createBubbles() {
    // Create bubble particles
    const bubbleCount = 200;
    const bubbleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(bubbleCount * 3);
    const sizes = new Float32Array(bubbleCount);
    
    for (let i = 0; i < bubbleCount; i++) {
      // Random positions in a volume
      positions[i * 3] = (Math.random() - 0.5) * 50; // x
      positions[i * 3 + 1] = Math.random() * 40 - 20; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50; // z
      
      // Random sizes
      sizes[i] = Math.random() * 0.5 + 0.1;
    }
    
    bubbleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    bubbleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Bubble texture
    const bubbleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });
    
    return new THREE.Points(bubbleGeometry, bubbleMaterial);
  }
  
  private createCoral() {
    const coralGroup = new THREE.Group();
    
    // Create 10 coral formations
    for (let i = 0; i < 10; i++) {
      const coralColor = new THREE.Color(
        Math.random() * 0.3 + 0.7, // More red
        Math.random() * 0.3,       // Less green
        Math.random() * 0.3 + 0.4  // Some blue
      );
      
      // Create a coral formation using merged geometries
      const coralFormation = this.createCoralFormation(coralColor);
      
      // Position coral along the floor
      coralFormation.position.set(
        (Math.random() - 0.5) * 40,
        -2 + Math.random() * 1.5,
        (Math.random() - 0.5) * 40
      );
      
      coralFormation.rotation.y = Math.random() * Math.PI * 2;
      coralFormation.scale.setScalar(0.5 + Math.random() * 1.5);
      
      coralGroup.add(coralFormation);
    }
    
    return coralGroup;
  }
  
  private createCoralFormation(color: THREE.Color) {
    const formation = new THREE.Group();
    
    // Create 3-7 coral pieces per formation
    const pieceCount = Math.floor(Math.random() * 5) + 3;
    
    for (let i = 0; i < pieceCount; i++) {
      // Randomize coral geometry
      let geometry;
      const type = Math.floor(Math.random() * 3);
      
      switch (type) {
        case 0:
          // Branching coral
          geometry = new THREE.CylinderGeometry(0.1, 0.3, 2, 8);
          break;
        case 1:
          // Brain coral
          geometry = new THREE.SphereGeometry(0.5, 8, 8);
          break;
        case 2:
          // Fan coral
          geometry = new THREE.BoxGeometry(1, 1, 0.1);
          break;
      }
      
      // Slight color variation
      const coralColor = color.clone();
      coralColor.r += (Math.random() - 0.5) * 0.1;
      coralColor.g += (Math.random() - 0.5) * 0.1;
      coralColor.b += (Math.random() - 0.5) * 0.1;
      
      const material = new THREE.MeshStandardMaterial({
        color: coralColor,
        roughness: 0.8,
        metalness: 0.1
      });
      
      const coralPiece = new THREE.Mesh(geometry, material);
      
      // Position within the formation
      coralPiece.position.set(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
      
      coralPiece.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      coralPiece.scale.setScalar(0.5 + Math.random());
      
      formation.add(coralPiece);
    }
    
    return formation;
  }
  
  private createSeaweed() {
    const seaweedGroup = new THREE.Group();
    
    // Create 15 seaweed plants
    for (let i = 0; i < 15; i++) {
      const seaweedPlant = this.createSeaweedPlant();
      
      // Position seaweed along the floor
      seaweedPlant.position.set(
        (Math.random() - 0.5) * 40,
        -2,
        (Math.random() - 0.5) * 40
      );
      
      seaweedGroup.add(seaweedPlant);
    }
    
    return seaweedGroup;
  }
  
  private createSeaweedPlant() {
    const plant = new THREE.Group();
    
    // Create 2-5 fronds per plant
    const frondCount = Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < frondCount; i++) {
      // Seaweed geometry
      const height = 2 + Math.random() * 3;
      const geometry = new THREE.PlaneGeometry(0.5, height, 1, 5);
      
      // Bend the seaweed shape
      if (geometry.attributes.position instanceof THREE.BufferAttribute) {
        const positions = geometry.attributes.position.array;
        
        for (let j = 0; j < positions.length / 3; j++) {
          const y = positions[j * 3 + 1];
          
          // Apply a curve to the seaweed based on height
          const bendFactor = (y / height) ** 2;
          positions[j * 3] += bendFactor * 0.5;
        }
        
        geometry.attributes.position.needsUpdate = true;
      }
      
      // Random green color
      const seaweedColor = new THREE.Color(
        Math.random() * 0.2,       // Low red
        Math.random() * 0.3 + 0.6, // High green
        Math.random() * 0.2 + 0.1  // Some blue
      );
      
      const material = new THREE.MeshStandardMaterial({
        color: seaweedColor,
        roughness: 0.6,
        metalness: 0.1,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      
      const frond = new THREE.Mesh(geometry, material);
      
      // Adjust frond position
      frond.position.y = height / 2;
      frond.position.x = (Math.random() - 0.5) * 0.5;
      frond.position.z = (Math.random() - 0.5) * 0.5;
      
      // Rotate frond slightly
      frond.rotation.y = Math.random() * Math.PI;
      
      plant.add(frond);
    }
    
    return plant;
  }
  
  // Cleanup resources
  dispose() {
    // Clean up bubbles
    if (this.bubbles.geometry) {
      this.bubbles.geometry.dispose();
    }
    if (this.bubbles.material instanceof THREE.Material) {
      this.bubbles.material.dispose();
    }
    
    // Clean up coral and seaweed
    this.disposeGroup(this.coral);
    this.disposeGroup(this.seaweed);
  }
  
  private disposeGroup(group: THREE.Group) {
    group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        }
      }
    });
  }
}