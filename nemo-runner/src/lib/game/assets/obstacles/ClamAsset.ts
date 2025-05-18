import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { ClamConfig } from '../../config/gameConfig';

export class ClamAsset {
  public config: Readonly<ClamConfig>;
  public mesh!: THREE.Group;
  private topShell!: THREE.Mesh;
  private bottomShell!: THREE.Mesh;
  private collisionShape!: THREE.Mesh;
  private pearlMesh?: THREE.Mesh;
  
  // Animation state
  public isOpen: boolean = false;
  private animationTime: number = 0;
  private openingState: number = 0; // 0 = closed, 1 = fully open. Represents normalized progress.
  private openCloseStartTime: number = 0; // Timestamp when open/close began
  private isAnimating: boolean = false; // True if currently opening or closing

  // Store effective durations after fetching from config
  private effectiveOpenCloseDuration: number;
  private effectiveWaitOpenDuration: number;
  private effectiveWaitClosedDuration: number;

  private bubbles: THREE.Mesh[] = []; // Re-add bubbles array
  private nextBubbleTime: number = 0; // Added for bubble timing

  // Bubble properties
  private bubbleEmitter!: THREE.Group;
  private bubbleMaterial!: THREE.MeshStandardMaterial;
  private readonly BUBBLE_COUNT = 15;
  private readonly BUBBLE_LIFESPAN = 1.5; // seconds
  private readonly BUBBLE_SPEED = 0.3; // units per second
  
  constructor() {
    this.config = configSystem.getObstaclesConfig().clam;
    this.createMesh();

    // Initialize effective durations from config or defaults
    this.effectiveOpenCloseDuration = this.config.openCloseDuration || 2.0;
    this.effectiveWaitOpenDuration = this.config.waitOpenDuration !== undefined ? this.config.waitOpenDuration : 1.5; // Default if not set
    this.effectiveWaitClosedDuration = this.config.waitClosedDuration !== undefined ? this.config.waitClosedDuration : 1.5; // Default if not set
  }

  public createMesh(): void {
    this.mesh = new THREE.Group();
    this.mesh.name = "ClamObstacle";
    
    // Get visual configuration from config
    // const visualConf = this.config.visuals;
    const baseScale = this.config.baseScale;
    
    // Create enhanced shell geometries
    const shellSize = 0.6 * baseScale;
    
    // Create top shell with more detailed geometry
    const topShellGeom = this.createShellGeometry(shellSize, true);
    const bottomShellGeom = this.createShellGeometry(shellSize, false);
    
    // Create materials with enhanced properties
    const shellMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor),
      roughness: visualConf.roughness || 0.7,
      metalness: visualConf.metalness || 0.1,
      emissive: new THREE.Color(visualConf.emissiveColor || 0x000000),
      emissiveIntensity: visualConf.emissiveIntensity || 0.0,
      side: THREE.DoubleSide // Added to prevent see-through issues
    });
    
    // Create slightly different material for bottom shell
    const bottomShellMaterial = new THREE.MeshStandardMaterial().copy(shellMaterial);
    bottomShellMaterial.color.offsetHSL(0, -0.1, -0.05); // Slightly desaturated and darker
    bottomShellMaterial.side = THREE.DoubleSide; // Ensure bottom shell is also double-sided
    
    // Create ultra-enhanced interior material with dramatic lighting effects
    const interiorVisuals = visualConf.interior || {
        mainColor: 0xf8e8d8, roughness: 0.2, metalness: 0.3,
        emissiveColor: 0xf8c8a8, emissiveIntensity: 0.4,
        clearcoat: 0.5, clearcoatRoughness: 0.2
    };

    const interiorMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(interiorVisuals.mainColor),
      roughness: interiorVisuals.roughness, 
      metalness: interiorVisuals.metalness, 
      emissive: new THREE.Color(interiorVisuals.emissiveColor),
      emissiveIntensity: interiorVisuals.emissiveIntensity, 
      clearcoat: interiorVisuals.clearcoat, 
      clearcoatRoughness: interiorVisuals.clearcoatRoughness,
      sheen: 0.5, 
      sheenRoughness: 0.3,
      sheenColor: new THREE.Color(interiorVisuals.emissiveColor), // Use emissive for sheen too
      transparent: false, 
      opacity: 1.0,
      side: THREE.DoubleSide // Ensure interior is visible if shell halves aren't perfectly sealed
    });
    
    // Create shells
    this.topShell = new THREE.Mesh(topShellGeom, shellMaterial);
    this.bottomShell = new THREE.Mesh(bottomShellGeom, bottomShellMaterial);
    
    // Position shells to form a clam shape
    this.bottomShell.position.y = -shellSize * 0.15;
    this.topShell.position.y = shellSize * 0.15;
    
    // Add pivot point for top shell
    const topShellPivot = new THREE.Group();
    topShellPivot.position.copy(this.bottomShell.position);
    topShellPivot.position.z = -shellSize * 0.5; // Pivot at the back of the clam
    topShellPivot.add(this.topShell);
    this.topShell.position.z = shellSize * 0.5; // Offset to align with pivot
    
    // Name the shells for easier reference during animation
    this.topShell.name = "TopShell";
    this.bottomShell.name = "BottomShell";
    topShellPivot.name = "TopShellPivot";
    
    // Add ultra-enhanced pearl inside with realistic iridescence
    const pearlSize = shellSize * 0.35; // Even larger pearl for better visibility
    const pearlGeom = new THREE.SphereGeometry(pearlSize, 32, 32); // Higher detail for smoother look
    
    // Create a more realistic pearl material with iridescent effect
    const pearlMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.05, // Very smooth
      metalness: 0.8,
      clearcoat: 1.0, // Add clearcoat for iridescent effect
      clearcoatRoughness: 0.1,
      reflectivity: 1.0,
      iridescence: 0.7, // Add iridescence
      iridescenceIOR: 1.5,
      emissive: 0x404040,
      emissiveIntensity: 0.3,
      sheen: 1.0, // Add sheen for pearly look
      sheenRoughness: 0.2,
      sheenColor: 0xffffff
    });
    
    this.pearlMesh = new THREE.Mesh(pearlGeom, pearlMaterial);
    this.pearlMesh.position.set(0, -shellSize * 0.05, 0); // Slightly above bottom shell
    this.pearlMesh.name = "Pearl";
    
    // Add enhanced interior mesh for bottom shell with more details
    const interiorGeom = new THREE.SphereGeometry(shellSize * 0.85, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    interiorGeom.scale(1.2, 0.4, 1.2);
    const interiorMesh = new THREE.Mesh(interiorGeom, interiorMaterial);
    interiorMesh.rotation.x = Math.PI; // Flip to face upward
    interiorMesh.position.y = shellSize * 0.05; // Slightly above bottom shell
    interiorMesh.name = "ClamInterior";
    
    // Add highly detailed interior with organic textures and ridges
    const interiorDetailMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(interiorVisuals.mainColor).offsetHSL(0, 0.1, -0.15), // Derived from base interior
      roughness: interiorVisuals.roughness !== undefined ? interiorVisuals.roughness * 1.5 : 0.3, // More rough than main interior
      metalness: interiorVisuals.metalness !== undefined ? interiorVisuals.metalness * 0.7 : 0.2,
      emissive: new THREE.Color(interiorVisuals.emissiveColor),
      emissiveIntensity: interiorVisuals.emissiveIntensity !== undefined ? interiorVisuals.emissiveIntensity * 1.2 : 0.5,
      clearcoat: interiorVisuals.clearcoat !== undefined ? interiorVisuals.clearcoat * 0.6 : 0.3,
      clearcoatRoughness: interiorVisuals.clearcoatRoughness !== undefined ? interiorVisuals.clearcoatRoughness * 1.2 : 0.4,
      side: THREE.DoubleSide
    });
    
    // Create more organic-looking interior details
    // Main ridges - more organic shape
    const ridgeGroup = new THREE.Group();
    const ridgeCount = 12;
    for (let i = 0; i < ridgeCount; i++) {
      const angle = (i / ridgeCount) * Math.PI * 2;
      const ridgeLength = shellSize * (0.4 + Math.random() * 0.2);
      const ridgeWidth = shellSize * (0.02 + Math.random() * 0.01);
      const ridgeHeight = shellSize * (0.01 + Math.random() * 0.02);
      
      // Create a custom ridge shape
      const ridgeShape = new THREE.Shape();
      ridgeShape.moveTo(0, 0);
      ridgeShape.quadraticCurveTo(ridgeLength * 0.5, ridgeHeight * 2, ridgeLength, 0);
      ridgeShape.lineTo(ridgeLength, ridgeWidth);
      ridgeShape.quadraticCurveTo(ridgeLength * 0.5, ridgeWidth + ridgeHeight * 2, 0, ridgeWidth);
      ridgeShape.lineTo(0, 0);
      
      const ridgeGeom = new THREE.ShapeGeometry(ridgeShape);
      const ridge = new THREE.Mesh(ridgeGeom, interiorDetailMaterial);
      
      // Position the ridge
      ridge.position.set(0, shellSize * 0.05, 0);
      ridge.rotation.z = angle;
      ridge.rotation.x = Math.PI / 2; // Lay flat
      
      ridgeGroup.add(ridge);
    }
    interiorMesh.add(ridgeGroup);
    
    // Add small bumps and texture details
    const bumpGroup = new THREE.Group();
    const bumpCount = 24;
    for (let i = 0; i < bumpCount; i++) {
      const radius = Math.random() * shellSize * 0.3;
      const angle = Math.random() * Math.PI * 2;
      const bumpSize = shellSize * (0.02 + Math.random() * 0.02);
      
      const bumpGeom = new THREE.SphereGeometry(bumpSize, 8, 6);
      const bump = new THREE.Mesh(bumpGeom, interiorDetailMaterial);
      
      // Position randomly within the interior
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      bump.position.set(x, shellSize * 0.05 + bumpSize * 0.5, z);
      
      bumpGroup.add(bump);
    }
    interiorMesh.add(bumpGroup);
    
    // Add a subtle glow effect in the center
    const glowGeom = new THREE.CircleGeometry(shellSize * 0.25, 32);
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(interiorVisuals.emissiveColor), // Use interior emissive
      emissive: new THREE.Color(interiorVisuals.emissiveColor), // Use interior emissive
      emissiveIntensity: interiorVisuals.emissiveIntensity !== undefined ? interiorVisuals.emissiveIntensity * 1.5 : 1.0,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending // For a softer glow
    });
    
    const glowMesh = new THREE.Mesh(glowGeom, glowMaterial);
    glowMesh.rotation.x = -Math.PI / 2; // Face upward
    glowMesh.position.y = shellSize * 0.051; // Just above the interior
    interiorMesh.add(glowMesh);
    
    // Add all parts to the group
    this.mesh.add(this.bottomShell);
    this.mesh.add(topShellPivot);
    this.mesh.add(this.pearlMesh);
    this.mesh.add(interiorMesh);
    
    // Initial state: closed
    this.isOpen = false;
    this.openingState = 0;
    this.isAnimating = false; // Initialize isAnimating
    
    // Add a collision shape for collision detection
    const collisionRadius = shellSize * 1.2;
    const collisionGeom = new THREE.SphereGeometry(collisionRadius, 8, 8);
    this.collisionShape = new THREE.Mesh(
      collisionGeom,
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.collisionShape.name = "ClamCollider";
    this.mesh.add(this.collisionShape);
    
    // Set userData for type identification
    this.mesh.userData = {
      type: 'obstacle',
      name: 'clam',
      assetInstance: this,
      isDangerous: false, // Initially not dangerous (closed)
      canBeOpened: true // Custom flag for interaction
    };

    // Initialize bubble system
    this.initBubbles(shellSize);
  }
  
  /**
   * Creates a detailed shell geometry
   */
  private createShellGeometry(size: number, isTop: boolean): THREE.BufferGeometry {
    // Start with a hemisphere
    const segments = 24;
    const rings = 16;
    const phiStart = 0;
    const phiLength = Math.PI * 2;
    const thetaStart = 0;
    const thetaLength = Math.PI / 2;
    
    const geometry = new THREE.SphereGeometry(
      size, segments, rings, phiStart, phiLength, thetaStart, thetaLength
    );
    
    // Scale to make it more shell-like
    geometry.scale(1.2, isTop ? 0.6 : 0.4, 1.2);
    
    // Add ridges and texture to the shell
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      
      // Skip vertices at the bottom edge (where shells meet)
      if (isTop && vertex.y < -size * 0.4) continue;
      if (!isTop && vertex.y > size * 0.2) continue;
      
      // Calculate distance from center in xz plane
      const distFromCenter = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);
      const normalizedDist = distFromCenter / (size * 1.2);
      
      // Add radial ridges
      const angle = Math.atan2(vertex.z, vertex.x);
      const ridgeCount = 12;
      const ridgeHeight = size * 0.08;
      const ridgeFactor = Math.sin(angle * ridgeCount) * ridgeHeight * normalizedDist;
      
      // Add concentric rings
      const ringCount = 5;
      const ringHeight = size * 0.05;
      const ringFactor = Math.sin(normalizedDist * Math.PI * ringCount) * ringHeight * normalizedDist;
      
      // Apply displacement
      vertex.y += (ridgeFactor + ringFactor) * (isTop ? 1 : -1);
      
      // Apply slight randomness for organic look
      vertex.x += (Math.random() - 0.5) * size * 0.02;
      vertex.y += (Math.random() - 0.5) * size * 0.02;
      vertex.z += (Math.random() - 0.5) * size * 0.02;
      
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // Apply displacement mapping based on texture
    if (this.config.visuals.normalMapUrl) {
      const textureLoader = new THREE.TextureLoader();
      const normalMap = textureLoader.load(this.config.visuals.normalMapUrl);
      normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
      (this.topShell.material as THREE.MeshStandardMaterial).normalMap = normalMap;
      (this.bottomShell.material as THREE.MeshStandardMaterial).normalMap = normalMap.clone(); // Clone for bottom shell
       // Ensure materials update
      (this.topShell.material as THREE.MeshStandardMaterial).needsUpdate = true;
      (this.bottomShell.material as THREE.MeshStandardMaterial).needsUpdate = true;
    } else if (this.config.visuals.textureMapUrl) { // Fallback to textureMapUrl as a bump/displacement if normal not present
        const textureLoader = new THREE.TextureLoader();
        const bumpMap = textureLoader.load(this.config.visuals.textureMapUrl);
        bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        (this.topShell.material as THREE.MeshStandardMaterial).bumpMap = bumpMap;
        (this.topShell.material as THREE.MeshStandardMaterial).bumpScale = 0.015 * size; // Scale bump with clam size
        (this.bottomShell.material as THREE.MeshStandardMaterial).bumpMap = bumpMap.clone();
        (this.bottomShell.material as THREE.MeshStandardMaterial).bumpScale = 0.015 * size;
        (this.topShell.material as THREE.MeshStandardMaterial).needsUpdate = true;
        (this.bottomShell.material as THREE.MeshStandardMaterial).needsUpdate = true;
    }
    
    return geometry;
  }

  private initBubbles(shellSize: number): void {
    this.bubbleEmitter = new THREE.Group();
    this.bubbleEmitter.position.y = shellSize * 0.2; // Bubbles emerge from near the opening
    this.mesh.add(this.bubbleEmitter);

    this.bubbleMaterial = new THREE.MeshStandardMaterial({
        color: 0xADD8E6, // Light blue
        transparent: true,
        opacity: 0.6,
        emissive: 0x87CEEB,
        emissiveIntensity: 0.4,
        side: THREE.DoubleSide
    });

    for (let i = 0; i < this.BUBBLE_COUNT; i++) {
        const bubbleSize = Math.random() * (shellSize * 0.03) + (shellSize * 0.01);
        const bubbleGeometry = new THREE.SphereGeometry(bubbleSize, 8, 6);
        const bubble = new THREE.Mesh(bubbleGeometry, this.bubbleMaterial);
        bubble.userData = {
            createdAt: -Math.random() * this.BUBBLE_LIFESPAN, // Stagger initial spawn
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                Math.random() * this.BUBBLE_SPEED + this.BUBBLE_SPEED * 0.5,
                (Math.random() - 0.5) * 0.1
            )
        };
        this.bubbleEmitter.add(bubble);
        this.bubbles.push(bubble);
    }
  }

  /**
   * Update the clam animation
   * @param deltaTime Time in seconds since last update
   */
  public updateAnimation(deltaTime: number, /* gameTime: number */): void {
    this.animationTime += deltaTime;
    const localGameTime = this.animationTime; // Use internal animationTime for cycles

    // const visualConf = this.config.visuals;
    const topShellPivot = this.mesh.getObjectByName("TopShellPivot") as THREE.Group;
    
    // Calculate total cycle duration based on effective durations
    const cycleDuration = this.effectiveOpenCloseDuration + 
                          this.effectiveWaitOpenDuration + 
                          this.effectiveOpenCloseDuration + 
                          this.effectiveWaitClosedDuration;

    // const timeInCycle = localGameTime % cycleDuration;
      
    // Simplified logic for starting animations based on state and cycle position
    if (!this.isAnimating) {
        const timeSinceOpenStart = this.isOpen ? localGameTime - this.openCloseStartTime : Infinity;
        // const timeSinceCloseStart = !this.isOpen ? localGameTime - this.openCloseStartTime : Infinity;
        
        // Time to start opening?
        // Clam is closed, and we have passed the full open + wait_open + close + wait_closed cycle OR specifically the wait_closed period of the current cycle.
        if (!this.isOpen && ( (localGameTime % cycleDuration) < this.effectiveOpenCloseDuration || (localGameTime % cycleDuration) >= (this.effectiveOpenCloseDuration + this.effectiveWaitOpenDuration + this.effectiveOpenCloseDuration) ) ) {
            // Check if we are at the very beginning of the wait_closed period to trigger open for next cycle, or if it's the initial opening.
            const timeIntoClosedWait = (localGameTime % cycleDuration) - (this.effectiveOpenCloseDuration + this.effectiveWaitOpenDuration + this.effectiveOpenCloseDuration);
            if (timeIntoClosedWait >= 0 || (localGameTime % cycleDuration) < this.effectiveOpenCloseDuration) { // Start opening if in waitClosed or at very start
                this.isOpen = true;
                this.isAnimating = true;
                this.openCloseStartTime = localGameTime;
        }
        }
        // Time to start closing?
        // Clam is open, and we have passed the openDuration + waitOpenDuration.
        else if (this.isOpen && timeSinceOpenStart >= (this.effectiveOpenCloseDuration + this.effectiveWaitOpenDuration)) {
            this.isOpen = false;
            this.isAnimating = true;
            this.openCloseStartTime = localGameTime;
        }
    }

    if (this.isAnimating) {
      const timeSinceAnimStart = localGameTime - this.openCloseStartTime;
      let progress = timeSinceAnimStart / this.effectiveOpenCloseDuration; // Animation always uses openCloseDuration
      progress = Math.min(progress, 1.0); // Clamp to 1

      // Apply easing function (ease-in-out)
      const easedProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      if (this.isOpen) { // Opening animation
        this.openingState = easedProgress;
      } else { // Closing animation
        this.openingState = 1.0 - easedProgress;
        }
        
      if (progress >= 1.0) {
        this.isAnimating = false;
        // Ensure final state is set correctly
        this.openingState = this.isOpen ? 1.0 : 0.0;
        this.openCloseStartTime = localGameTime; // Reset start time for the next phase (wait open or wait closed)
      }
    }
    
    // Apply rotation based on openingState
    const openAngle = this.config.openAngle; // e.g., Math.PI / 3
    if (topShellPivot) {
      topShellPivot.rotation.x = this.openingState * -openAngle;
    }

    // Update userData based on state
    // Dangerous if more than half open, for example
    this.mesh.userData.isDangerous = this.openingState > 0.5; 
    this.mesh.userData.isOpen = this.openingState > 0.05; // Considered "open" if even slightly ajar

    // Pearl animation: subtle bobbing or shimmering
        if (this.pearlMesh) {
      this.pearlMesh.position.y = -this.config.baseScale * 0.05 + Math.sin(this.animationTime * 1.2) * 0.02 * this.config.baseScale;
      // Optional: rotate pearl slightly for more shimmer
      this.pearlMesh.rotation.y += deltaTime * 0.3;
      // Make pearl visible only when clam is mostly open
      this.pearlMesh.visible = this.openingState > 0.6;
    }
    
    // Update bubbles
    this.updateBubbles(deltaTime, localGameTime);
  }

  private updateBubbles(deltaTime: number, gameTime: number): void {
    // const shellSize = this.config.baseScale * 0.6;
        
    // Emit bubbles if clam is open or opening
    if ((this.isOpen || this.isAnimating && this.openingState > 0.2) && gameTime > this.nextBubbleTime) {
      const bubble = this.bubbles.find(b => !b.visible);
      if (bubble) {
        // Move bubble
        bubble.position.addScaledVector(bubble.userData.velocity, deltaTime);
        bubble.position.y += this.BUBBLE_SPEED * deltaTime * (1 + Math.sin(gameTime * 2 + bubble.id) * 0.5); // Varied upward speed

        // Wobble
        bubble.position.x += Math.sin(gameTime * 3 + bubble.id) * 0.002 * this.config.baseScale;

        // Reset bubble if lifespan exceeded or too far
        const currentLifespan = gameTime - bubble.userData.createdAt;
        if (currentLifespan > this.BUBBLE_LIFESPAN || bubble.position.y > this.config.baseScale * 1.5) {
            bubble.position.set(
                (Math.random() - 0.5) * 0.1 * this.config.baseScale,
                (Math.random() - 0.5) * 0.05 * this.config.baseScale, // Start near emitter origin
                (Math.random() - 0.5) * 0.1 * this.config.baseScale
            );
            bubble.userData.createdAt = gameTime; // Reset creation time
            bubble.userData.velocity.set(
                (Math.random() - 0.5) * 0.05 * this.config.baseScale,
                (Math.random() * this.BUBBLE_SPEED + this.BUBBLE_SPEED * 0.5) * (0.5 + this.openingState * 0.5), // Speed related to how open
                (Math.random() - 0.5) * 0.05 * this.config.baseScale
            );
        }
        // Fade out bubble towards end of life
        const lifeRatio = Math.max(0, 1 - currentLifespan / this.BUBBLE_LIFESPAN);
        (bubble.material as THREE.MeshStandardMaterial).opacity = (this.bubbleMaterial.opacity || 0.6) * lifeRatio * lifeRatio;

        bubble.visible = true;
        this.nextBubbleTime = gameTime + Math.random() * this.BUBBLE_LIFESPAN; // Randomize next bubble time
      }
    }
  }

  /**
   * Returns the collision object for this asset
   */
  public getCollisionObject(): THREE.Mesh {
    // Return the dedicated collision shape if available
    if (this.collisionShape) {
      return this.collisionShape;
    }
    
    // Fallback to the top shell if collision shape is not available
    if (this.topShell) {
      return this.topShell;
    }
    
    // Create a fallback collision mesh if nothing else is available
    console.warn("ClamAsset: No collision shape available, creating fallback");
    const fallbackGeometry = new THREE.SphereGeometry(0.6 * this.config.baseScale, 8, 8);
    const fallbackMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
    fallbackMesh.name = "ClamFallbackCollider";
    
    // Add to mesh if available
    if (this.mesh) {
      this.mesh.add(fallbackMesh);
      this.collisionShape = fallbackMesh;
    }
    
    return fallbackMesh;
  }

  /**
   * Reset the clam to its initial state
   */
  public reset(): void {
    this.isOpen = false;
    this.animationTime = 0;
    this.openingState = 0;
    this.isAnimating = false;

    // Reset the top shell pivot rotation
    if (this.mesh) {
      const topShellPivot = this.mesh.getObjectByName("TopShellPivot") as THREE.Group;
      if (topShellPivot) {
        topShellPivot.rotation.x = 0; // Reset to closed position
      }
      
      // Hide pearl when reset
      if (this.pearlMesh) {
        this.pearlMesh.visible = false;
        this.pearlMesh.position.y = -this.config.baseScale * 0.05;
        this.pearlMesh.rotation.y = 0;
      }
      
      // Update danger state
      this.mesh.userData.isDangerous = false;
    }
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    // Dispose of shell geometries and materials
    this.topShell?.geometry?.dispose();
    if (this.topShell?.material instanceof THREE.Material) {
      const mat = this.topShell.material as THREE.MeshStandardMaterial;
      mat.map?.dispose();
      mat.normalMap?.dispose();
      mat.bumpMap?.dispose();
      mat.dispose();
    }
    this.bottomShell?.geometry?.dispose();
    if (this.bottomShell?.material instanceof THREE.Material) {
      const mat = this.bottomShell.material as THREE.MeshStandardMaterial;
      mat.map?.dispose();
      mat.normalMap?.dispose();
      mat.bumpMap?.dispose();
      mat.dispose();
    }

    // Dispose of pearl
    this.pearlMesh?.geometry?.dispose();
    if (this.pearlMesh?.material instanceof THREE.Material) {
      (this.pearlMesh.material as THREE.MeshPhysicalMaterial).dispose(); // Assuming PhysicalMaterial
    }
    
    // Dispose of interior meshes and materials
    this.mesh.traverse(child => {
      if (child instanceof THREE.Mesh && (child.name === "ClamInterior" || child.name === "GlowMesh" || child.parent?.name === "RidgeGroup" || child.parent?.name === "BumpGroup")) {
        child.geometry?.dispose();
        if (child.material instanceof THREE.Material) {
          // Check for specific material types if necessary, e.g. MeshPhysicalMaterial
          if ((child.material as THREE.MeshPhysicalMaterial).iridescenceMap) {
            (child.material as THREE.MeshPhysicalMaterial).iridescenceMap?.dispose();
          }
           if ((child.material as THREE.MeshStandardMaterial).map) {
            (child.material as THREE.MeshStandardMaterial).map?.dispose();
          }
          child.material.dispose();
        }
      }
    });
    
    // Dispose of bubble system
    this.bubbles.forEach((bubble: THREE.Mesh) => { // Explicitly type bubble
        bubble.geometry?.dispose();
    });
    if (this.bubbleMaterial) {
        this.bubbleMaterial.dispose();
    }
    this.bubbleEmitter?.clear();
    this.bubbles = [];

    // Dispose of collision shape
    if (this.collisionShape) {
      if (this.collisionShape.geometry) this.collisionShape.geometry.dispose();
      if (this.collisionShape.material instanceof THREE.Material) this.collisionShape.material.dispose();
    }
  }
  
  /**
   * Returns whether this obstacle is dangerous
   */
  public isDangerous(): boolean {
    return this.isOpen; // Clam is only dangerous when open
  }
  
  /**
   * Returns the main mesh
   */
  public getMesh(): THREE.Group {
    return this.mesh;
  }
}