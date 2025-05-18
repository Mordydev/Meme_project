import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { SeaTurtleConfig } from '../../config/gameConfig';

export class SeaTurtleAsset {
  public config: Readonly<SeaTurtleConfig>;
  private mesh!: THREE.Group;
  private collisionMesh!: THREE.Mesh;
  private flippers: THREE.Mesh[] = [];
  private head!: THREE.Mesh;
  private tailMesh!: THREE.Mesh;
  
  private animationTime: number = 0;
  private targetTurnAngle: number = 0;
  private currentTelegraphState: 'left' | 'right' | 'center' = 'center';

  constructor() {
    this.config = this._fetchConfig();
    this.createMesh();
    this.mesh.rotation.y = Math.PI; // Ensure initial orientation is facing player
  }

  private _fetchConfig(): Readonly<SeaTurtleConfig> {
    const defaultConfig: SeaTurtleConfig = {
      baseScale: 1.0,
      forwardSpeedFactor: 0.75,
      laneChangeTelegraphTime: 0.8,
      laneChangeDuration: 0.5,
      minTimeInLane: 3.0,
      maxTimeInLane: 6.0,
      turnAngleDegrees: 25,
      visuals: {
        mainColor: 0x6B8E23,
        detailColor: 0x556B2F,
        roughness: 0.7,
        metalness: 0.1,
        animationAmplitude: 0.6,
        animationSpeed: 1.5,
      }
    };
    try {
      const specificConfig = configSystem.getObstaclesConfig().seaTurtle;
      return { ...defaultConfig, ...specificConfig, visuals: { ...defaultConfig.visuals, ...specificConfig?.visuals } };
    } catch (error) {
      console.warn("SeaTurtleAsset: Could not get sea turtle config, using defaults", error);
      return defaultConfig;
    }
  }

  private createMesh(): void {
    this.mesh = new THREE.Group();
    this.mesh.name = "SeaTurtleObstacle_StdMat";
    this.mesh.rotation.y = Math.PI; // Rotate 180 degrees to face the player

    const scale = this.config.baseScale;
    const visualConf = this.config.visuals as Required<{ 
      mainColor: string | number; 
      detailColor?: string | number;
      roughness?: number;
      metalness?: number;
      animationAmplitude?: number;
      animationSpeed?: number;
      textureMapUrl?: string;
      opacity?: number;
      clearcoat?: number;
      clearcoatRoughness?: number;
      // Turtle specific visuals from the inline part of the original assertion
      skinColor?: number | string;
      shellPatternColor?: number | string;
      shellBumpScale?: number;
      bankFactor?: number;
    }>;

    const { map: shellMap, bumpMap: shellBumpMap } = this.createShellPatternTexture(visualConf.mainColor, visualConf.shellPatternColor, visualConf.textureMapUrl);

    const shellMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(visualConf.mainColor),
      roughness: visualConf.roughness,
      metalness: visualConf.metalness,
      map: shellMap,
      bumpMap: shellBumpMap,
      bumpScale: visualConf.shellBumpScale !== undefined ? visualConf.shellBumpScale : 0.03,
      opacity: visualConf.opacity !== undefined ? visualConf.opacity : 1.0,
      transparent: (visualConf.opacity !== undefined && visualConf.opacity < 1.0) ? true : false,
      clearcoat: visualConf.clearcoat, 
      clearcoatRoughness: visualConf.clearcoatRoughness,
    });

    const skinMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(visualConf.skinColor || visualConf.detailColor),
      roughness: (visualConf.roughness || 0.7) * 1.1, 
      metalness: visualConf.metalness || 0.1,
      opacity: visualConf.opacity !== undefined ? visualConf.opacity : 1.0,
      transparent: (visualConf.opacity !== undefined && visualConf.opacity < 1.0) ? true : false,
      clearcoat: visualConf.clearcoat, 
      clearcoatRoughness: visualConf.clearcoatRoughness,
    });

    // Simplified Shell Geometry
    const baseShellRadius = 0.4 * scale; // REDUCED from 0.5 * scale
    const shellGeom = new THREE.SphereGeometry(baseShellRadius, 32, 24);
    const shellMesh = new THREE.Mesh(shellGeom, shellMaterial);
    
    // Name the shell mesh so dispose() can locate and clean up its textures
    shellMesh.name = 'SeaTurtleShell';
    
    const shellScaleFactors = { x: 0.9, y: 0.6, z: 1.0 }; // Wider, flatter, longer
    shellMesh.scale.set(shellScaleFactors.x, shellScaleFactors.y, shellScaleFactors.z);
    
    const shellYPos = 0.05 * scale; // Center Y position for the shell
    shellMesh.position.y = shellYPos;
    this.mesh.add(shellMesh);

    // Effective radii after scaling for positioning calculations
    const effShellRadiusX = baseShellRadius * shellScaleFactors.x;
    const effShellRadiusY = baseShellRadius * shellScaleFactors.y;
    const effShellRadiusZ = baseShellRadius * shellScaleFactors.z; // This is half-length along Z

    // Head
    const headLength = 0.28 * scale; // REDUCED from 0.35 * scale
    const headRadiusGeom = 0.144 * scale; // REDUCED from 0.18 * scale
    const headGeom = new THREE.CapsuleGeometry(headRadiusGeom, headLength - 2 * headRadiusGeom, 12, 8);
    this.head = new THREE.Mesh(headGeom, skinMaterial);
    // Position head at front of shell, slightly above its midline, overlapping a bit
    this.head.position.set(
        0, 
        shellYPos + effShellRadiusY * 0.1, // Slightly above shell's vertical center
        effShellRadiusZ - (headLength / 2) * 0.7 // Positioned at front, with 30% of head inside shell
    );
    this.head.rotation.x = Math.PI / 12; // Slight upward tilt
    this.mesh.add(this.head);

    // Enhanced Eyes (relative to head)
    const eyeRadius = 0.032 * scale; // REDUCED from 0.04 * scale
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.05 });
    const irisColor = new THREE.Color(visualConf.skinColor || visualConf.detailColor).offsetHSL(0, -0.1, -0.2);
    const irisMat = new THREE.MeshStandardMaterial({ color: irisColor, roughness: 0.4, metalness: 0.05 });
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

    [-1, 1].forEach(side => {
      const eyeGroup = new THREE.Group();
      // Position eyes on the head capsule
      eyeGroup.position.set(
        headRadiusGeom * 0.75 * side, // Side of the head
        headRadiusGeom * 0.3,         // Upper part of head radius
        (headLength / 2) * 0.6        // Towards the front of the head capsule
      );
      
      const irisGeom = new THREE.SphereGeometry(eyeRadius, 10, 8);
      const irisMesh = new THREE.Mesh(irisGeom, irisMat);
      eyeGroup.add(irisMesh);

      const pupilGeom = new THREE.SphereGeometry(eyeRadius * 0.6, 8, 6);
      const pupilMesh = new THREE.Mesh(pupilGeom, pupilMat);
      pupilMesh.position.z = eyeRadius * 0.3;
      eyeGroup.add(pupilMesh);

      const glintGeom = new THREE.SphereGeometry(eyeRadius * 0.25, 6, 4);
      const glintMesh = new THREE.Mesh(glintGeom, glintMat);
      glintMesh.position.set(eyeRadius * 0.25 * (side > 0 ? 1 : -1), eyeRadius * 0.25, eyeRadius * 0.7);
      eyeGroup.add(glintMesh);
      
      this.head.add(eyeGroup);
    });
    
    // Flippers
    this.flippers = this.createFlippers(scale, skinMaterial, visualConf, {shellYPos, effShellRadiusX, effShellRadiusY, effShellRadiusZ});
    this.flippers.forEach(flipper => this.mesh.add(flipper));
    
    // Tail
    this.tailMesh = this.createTail(scale, skinMaterial, {shellYPos, effShellRadiusZ});
    this.mesh.add(this.tailMesh);
    
    const collisionBox = new THREE.Box3();
    const headBox = new THREE.Box3().setFromObject(this.head);
    const shellBox = new THREE.Box3().setFromObject(shellMesh);
    collisionBox.union(headBox).union(shellBox);
    const collisionSize = new THREE.Vector3();
    collisionBox.getSize(collisionSize);
    const collisionCenter = new THREE.Vector3();
    collisionBox.getCenter(collisionCenter);

    const collisionGeom = new THREE.BoxGeometry(collisionSize.x * 1.1, collisionSize.y * 1.2, collisionSize.z * 1.1);
    this.collisionMesh = new THREE.Mesh(collisionGeom, new THREE.MeshBasicMaterial({ visible: false, wireframe: true }));
    this.collisionMesh.position.copy(collisionCenter);
    this.collisionMesh.name = "SeaTurtleCollisionShape";
    this.mesh.add(this.collisionMesh);

    this.mesh.userData = { 
      type: 'obstacle', 
      name: 'seaTurtle', 
      assetInstance: this,
      isDangerous: true
    };
  }

  private createShellPatternTexture(
    shellColorParam: string | number, 
    patternColorParam?: string | number,
    textureUrl?: string
  ): { map: THREE.Texture, bumpMap: THREE.Texture } {
    if (textureUrl) {
        // If a texture URL is provided, try to load it for both map and bumpMap (or handle separately if different URLs were intended)
        // This basic example will use the same loaded texture for map and a generated bump from it or a default.
        try {
            const loadedTexture = new THREE.TextureLoader().load(textureUrl);
            loadedTexture.wrapS = loadedTexture.wrapT = THREE.RepeatWrapping;
            // Create a simple bump map from the loaded texture or a default one if complex processing isn't done here
            // For now, let's return the loaded texture as map and a new basic procedural one for bump as placeholder
            const placeholderBump = this._createProceduralShellTextures(shellColorParam, patternColorParam).bumpMap; 
            return { map: loadedTexture, bumpMap: placeholderBump };
        } catch (e) {
            console.warn(`SeaTurtleAsset: Failed to load texture from ${textureUrl}, falling back to procedural.`, e);
        }
    }
    return this._createProceduralShellTextures(shellColorParam, patternColorParam);
  }

  private _createProceduralShellTextures(
    shellColorParam: string | number, 
    patternColorParam?: string | number
  ): { map: THREE.CanvasTexture, bumpMap: THREE.CanvasTexture } {
    const canvas = document.createElement('canvas');
    const size = 256; // Increased size for better detail
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const baseShellColor = new THREE.Color(shellColorParam);
    const actualPatternColorHex = patternColorParam ? new THREE.Color(patternColorParam).getHexString() : baseShellColor.clone().offsetHSL(0, 0.05, -0.2).getHexString();

    // --- Create Albedo Map ---
    ctx.fillStyle = baseShellColor.getStyle();
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = `#${actualPatternColorHex}`;
    ctx.lineWidth = size / 32; // Thicker lines for better visibility in bump
    this.drawScutes(ctx, size, scuteSize => scuteSize / 4);
    const mapTexture = new THREE.CanvasTexture(canvas);
    mapTexture.wrapS = mapTexture.wrapT = THREE.RepeatWrapping;
    mapTexture.repeat.set(1,1); // Try with 1,1 repeat on larger texture first

    // --- Create Bump Map ---
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bumpCtx = bumpCanvas.getContext('2d')!;
    
    bumpCtx.fillStyle = '#808080'; // Mid-grey for no bump
    bumpCtx.fillRect(0, 0, size, size);
    // Draw scute lines darker for indentations, or lighter for raised ridges. Let's do darker.
    bumpCtx.strokeStyle = '#404040'; // Dark grey for indentations
    bumpCtx.lineWidth = size / 32; // Match albedo line width
    this.drawScutes(bumpCtx, size, scuteSize => scuteSize / 4);
    
    const bumpMapTexture = new THREE.CanvasTexture(bumpCanvas);
    bumpMapTexture.wrapS = bumpMapTexture.wrapT = THREE.RepeatWrapping;
    bumpMapTexture.repeat.set(1,1);

    return { map: mapTexture, bumpMap: bumpMapTexture };
  }

  // Helper for drawing scutes
  private drawScutes(ctx: CanvasRenderingContext2D, canvasSize: number, scuteSizeCalc: (size:number) => number ): void {
    const scuteSize = scuteSizeCalc(canvasSize);
    for (let y = -scuteSize / 2; y < canvasSize + scuteSize; y += scuteSize * 0.866) { // 0.866 is approx sin(60deg)
        for (let x = -scuteSize / 2, row = 0; x < canvasSize + scuteSize; x += scuteSize * 1.5, row++) {
            const offsetX = (row % 2) * scuteSize * 0.75;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i + Math.PI / 6; // Start angle for pointy top hex
                const sx = x + offsetX + Math.cos(angle) * scuteSize * 0.5;
                const sy = y + Math.sin(angle) * scuteSize * 0.5;
                if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
            }
            ctx.closePath();
            ctx.stroke();
        }
    }
  }

  private createFlippers(
    scale: number, 
    material: THREE.Material, 
    visualConf: Required<{ 
      mainColor: string | number; 
      detailColor?: string | number;
      roughness?: number;
      metalness?: number;
      animationAmplitude?: number;
      animationSpeed?: number;
      textureMapUrl?: string;
      opacity?: number;
      clearcoat?: number;
      clearcoatRoughness?: number;
      // Turtle specific visuals from the inline part of the original assertion
      skinColor?: number | string;
      shellPatternColor?: number | string;
      shellBumpScale?: number;
      bankFactor?: number;
    }>,
    shellDimensions: {shellYPos: number, effShellRadiusX: number, effShellRadiusY: number, effShellRadiusZ: number}
  ): THREE.Mesh[] {
    const flippers: THREE.Mesh[] = [];
    const extrudeSettings = { 
        depth: 0.024 * scale,       // REDUCED from 0.03
        bevelEnabled: true, 
        bevelThickness: 0.008 * scale, // REDUCED from 0.01
        bevelSize: 0.008 * scale,      // REDUCED from 0.01
        bevelSegments: 1 
    };
    const { shellYPos, effShellRadiusX, effShellRadiusY, effShellRadiusZ } = shellDimensions;

    const frontFlipperShape = new THREE.Shape();
    const ffL = 0.48 * scale; // REDUCED from 0.6
    const ffW = 0.20 * scale; // REDUCED from 0.25
    frontFlipperShape.moveTo(0, -ffW / 2);
    frontFlipperShape.quadraticCurveTo(ffL * 0.4, -ffW * 0.7, ffL * 0.8, -ffW * 0.4);
    frontFlipperShape.quadraticCurveTo(ffL, 0, ffL * 0.8, ffW * 0.4);
    frontFlipperShape.quadraticCurveTo(ffL * 0.4, ffW * 0.7, 0, ffW / 2);
    frontFlipperShape.closePath();

    const frontFlipperGeom = new THREE.ExtrudeGeometry(frontFlipperShape, extrudeSettings);

    const frontLeftFlipper = new THREE.Mesh(frontFlipperGeom, material);
    frontLeftFlipper.name = "FrontLeftFlipper";
    frontLeftFlipper.position.set(
        effShellRadiusX * 0.8, // Out to the side of shell
        shellYPos - effShellRadiusY * 0.4, // Below shell midline
        effShellRadiusZ * 0.35 // Front-mid section of shell
    );
    frontLeftFlipper.rotation.y = Math.PI / 5;
    frontLeftFlipper.userData.initialRotationX = 0;
    frontLeftFlipper.userData.initialRotationY = frontLeftFlipper.rotation.y;
    frontLeftFlipper.userData.initialRotationZ = 0;
    flippers.push(frontLeftFlipper);

    const frontRightFlipper = new THREE.Mesh(frontFlipperGeom.clone(), material);
    frontRightFlipper.name = "FrontRightFlipper";
    frontRightFlipper.position.set(
        -effShellRadiusX * 0.8,
        shellYPos - effShellRadiusY * 0.4,
        effShellRadiusZ * 0.35
    );
    frontRightFlipper.rotation.y = -Math.PI / 5;
    frontRightFlipper.userData.initialRotationX = 0;
    frontRightFlipper.userData.initialRotationY = frontRightFlipper.rotation.y;
    frontRightFlipper.userData.initialRotationZ = 0;
    flippers.push(frontRightFlipper);

    const rearFlipperShape = new THREE.Shape();
    const rfL = 0.32 * scale; // REDUCED from 0.40
    const rfW = 0.16 * scale; // REDUCED from 0.20
    rearFlipperShape.moveTo(0, -rfW / 2);
    rearFlipperShape.lineTo(rfL * 0.9, -rfW * 0.3);
    rearFlipperShape.quadraticCurveTo(rfL, 0, rfL * 0.9, rfW * 0.3);
    rearFlipperShape.lineTo(0, rfW / 2);
    rearFlipperShape.closePath();

    const rearFlipperGeom = new THREE.ExtrudeGeometry(rearFlipperShape, { ...extrudeSettings, depth: 0.016 * scale }); // REDUCED depth from 0.02

    const rearLeftFlipper = new THREE.Mesh(rearFlipperGeom, material);
    rearLeftFlipper.name = "RearLeftFlipper";
    rearLeftFlipper.position.set(
        effShellRadiusX * 0.7, // Slightly more inwards than front
        shellYPos - effShellRadiusY * 0.5, // Lower than front flippers
        -effShellRadiusZ * 0.45 // Rear-mid section of shell
    );
    rearLeftFlipper.rotation.y = Math.PI / 8;
    rearLeftFlipper.userData.initialRotationX = 0;
    rearLeftFlipper.userData.initialRotationY = rearLeftFlipper.rotation.y;
    rearLeftFlipper.userData.initialRotationZ = 0;
    flippers.push(rearLeftFlipper);

    const rearRightFlipper = new THREE.Mesh(rearFlipperGeom.clone(), material);
    rearRightFlipper.name = "RearRightFlipper";
    rearRightFlipper.position.set(
        -effShellRadiusX * 0.7,
        shellYPos - effShellRadiusY * 0.5,
        -effShellRadiusZ * 0.45
    );
    rearRightFlipper.rotation.y = -Math.PI / 8;
    rearRightFlipper.userData.initialRotationX = 0;
    rearRightFlipper.userData.initialRotationY = rearRightFlipper.rotation.y;
    rearRightFlipper.userData.initialRotationZ = 0;
    flippers.push(rearRightFlipper);
    
    return flippers;
  }

  private createTail(
    scale: number, 
    material: THREE.Material,
    shellDimensions: {shellYPos: number, effShellRadiusZ: number}
  ): THREE.Mesh {
    const {shellYPos, effShellRadiusZ} = shellDimensions;
    const tailLength = 0.20 * scale; // REDUCED from 0.25
    const tailRadius = 0.048 * scale; // REDUCED from 0.06
    const tailGeom = new THREE.ConeGeometry(tailRadius, tailLength, 8);
    tailGeom.rotateX(Math.PI / 2); // Orient cone to point along Z
    // tailGeom.translate(0, 0, tailLength / 2); // Tip at origin, extends along +Z

    const tail = new THREE.Mesh(tailGeom, material);
    tail.name = "SeaTurtleTail";
    // Position tail at the back of the shell, slightly below midline, extending outwards
    tail.position.set(
        0, 
        shellYPos - 0.05 * scale, // Position slightly below the shell's perceived vertical center
        -effShellRadiusZ - (tailLength / 2) * 0.7 // Position base at shell's rear, with 30% overlap (extends further back)
    );
    // The cone points along its local +Z. If mesh is rotated PI on Y, local +Z is game's -Z (away from player).
    // Tail should point away from body, so initial cone local +Z should be along mesh's -Z.
    // No specific rotation needed here if cone geometry points along its +Z and is placed at rear.
    return tail;
  }

  public setTelegraphTurn(direction: 'left' | 'right' | 'center'): void {
    console.log(`SeaTurtleAsset: setTelegraphTurn called with direction: ${direction}`);
    this.currentTelegraphState = direction;

    // Reset head rotation to neutral before applying new turn
    if (this.head) {
      this.head.rotation.set(Math.PI / 10, 0, 0); // Reset head to initial tilt
    }

    const turnAngleRad = THREE.MathUtils.degToRad(this.config.turnAngleDegrees);
    // Target angle is absolute world Y rotation. Base facing player is Math.PI.
    if (direction === 'left') {
      this.targetTurnAngle = Math.PI - turnAngleRad; 
    } else if (direction === 'right') {
      this.targetTurnAngle = Math.PI + turnAngleRad;
    } else {
      this.targetTurnAngle = Math.PI; // Face directly towards player
    }
  }
  
  public updateAnimation(deltaTime: number): void {
    console.log(`SeaTurtleAsset: updateAnimation - state: ${this.currentTelegraphState}, targetYRot: ${this.targetTurnAngle.toFixed(2)}, currentYRot: ${this.mesh.rotation.y.toFixed(2)}, currentZRot: ${this.mesh.rotation.z.toFixed(2)}`);
    const time = this.animationTime += deltaTime;
    const visualConf = this.config.visuals as Required<{ 
      mainColor: string | number; 
      detailColor?: string | number;
      roughness?: number;
      metalness?: number;
      animationAmplitude?: number;
      animationSpeed?: number;
      textureMapUrl?: string;
      opacity?: number;
      clearcoat?: number;
      clearcoatRoughness?: number;
      // Turtle specific visuals from the inline part of the original assertion
      skinColor?: number | string;
      shellPatternColor?: number | string;
      shellBumpScale?: number;
      bankFactor?: number;
    }>;
    const animSpeed = visualConf.animationSpeed || 1.5;
    const animAmp = visualConf.animationAmplitude || 0.6;
    const bankFactor = visualConf.bankFactor !== undefined ? visualConf.bankFactor : 0.2;

    // Turn telegraphing and execution
    const turnLerpFactor = 0.1;
    const turnDifference = this.targetTurnAngle - this.mesh.rotation.y;
    this.mesh.rotation.y += turnDifference * turnLerpFactor;

    // Banking into the turn (roll on Z-axis)
    // Bank more if the difference to target angle is larger, up to a max bank
    const desiredBankAngle = -turnDifference * bankFactor; // Negative for intuitive roll
    const maxBank = Math.PI / 12; // Max bank angle (e.g., 15 degrees)
    this.mesh.rotation.z = THREE.MathUtils.damp(this.mesh.rotation.z, THREE.MathUtils.clamp(desiredBankAngle, -maxBank, maxBank), bankFactor * 5, deltaTime);

    // Flipper Animation - Differentiated
    this.flippers.forEach((flipper) => {
      const initialRotX = flipper.userData.initialRotationX || 0;
      const initialRotY = flipper.userData.initialRotationY || 0;
      const initialRotZ = flipper.userData.initialRotationZ || 0;

      const isFront = flipper.name.includes('Front');
      const isLeft = flipper.name.includes('Left');
      
      let currentFlapSpeed = animSpeed;
      let currentFlapAmp = animAmp;
      let currentTwistAmp = animAmp * 0.6;
      // Phase offset for left/right and front/rear
      let phase = isLeft ? 0 : Math.PI * 0.1;

      if (isFront) {
        phase += isLeft ? 0 : Math.PI * 0.05; // Slightly different phase for front right vs front left
        const flapAngle = Math.sin(time * currentFlapSpeed + phase) * currentFlapAmp;
        const twistAngle = Math.cos(time * currentFlapSpeed * 0.8 + phase + Math.PI / 3) * currentTwistAmp;
        flipper.rotation.set(initialRotX + twistAngle, initialRotY, initialRotZ + flapAngle);
      } else { // Rear flippers
        currentFlapSpeed *= 0.7;
        currentFlapAmp *= 0.5;
        currentTwistAmp *= 0.4;
        phase += Math.PI * 0.25; // Phase rear differently

        const flapAngle = Math.sin(time * currentFlapSpeed + phase) * currentFlapAmp;
        const twistAngle = Math.cos(time * currentFlapSpeed * 0.8 + phase + Math.PI / 3) * currentTwistAmp;
        // Rear flippers might also have a subtle Y-axis oscillation for steering aid
        const steerFactor = Math.sin(time * animSpeed * 0.25 + phase) * 0.15; 
        flipper.rotation.set(initialRotX + twistAngle, initialRotY + steerFactor, initialRotZ + flapAngle);
      }
    });

    // Head Animation (Bobbing and Turning)
    if (this.head) {
      // Bobbing on X-axis (nodding), additive to initial X rotation
      this.head.rotation.x = (Math.PI / 10) + (Math.sin(time * animSpeed * 0.6 + Math.PI / 2) * 0.05);
      // Head looks towards the turn direction, relative to body's current Y rotation
      // The head's local Y rotation should be towards the `turnDifference`
      const headLookTargetY = turnDifference * 0.5; // Look halfway into the remaining turn
      const maxHeadTurn = Math.PI / 6; // Max local head turn
      this.head.rotation.y = THREE.MathUtils.damp(this.head.rotation.y, THREE.MathUtils.clamp(headLookTargetY, -maxHeadTurn, maxHeadTurn), 2.0, deltaTime);
      this.head.rotation.z = 0; 
    }
    
    const bodyPitch = Math.sin(time * animSpeed + Math.PI/2) * 0.03;
    this.mesh.rotation.x = bodyPitch;

    if (this.tailMesh) {
      this.tailMesh.rotation.y = Math.sin(time * animSpeed * 1.2) * 0.25;
    }
  }

  public getMesh(): THREE.Group { return this.mesh; }
  public getCollisionObject(): THREE.Mesh { return this.collisionMesh; }
  public isDangerous(): boolean { return true; }

  public reset(): void {
    this.animationTime = 0;
    this.targetTurnAngle = Math.PI; // Reset to face player
    if (this.mesh) {
        this.mesh.rotation.set(0, Math.PI, 0); // Reset body pitch, face player, zero roll
    }
    this.flippers.forEach(f => {
      // Reset flipper rotations to their initial banked/rest state
      if (f.name.includes('Front')) {
        f.rotation.set(f.userData.initialRotationX || 0, f.userData.initialRotationY || (f.name.includes('Left') ? Math.PI / 5 : -Math.PI / 5), f.userData.initialRotationZ || 0); 
      } else {
        f.rotation.set(f.userData.initialRotationX || 0, f.userData.initialRotationY || (f.name.includes('Left') ? Math.PI / 8 : -Math.PI / 8), f.userData.initialRotationZ || 0);
      }
    });
    if (this.head) {
      this.head.rotation.set(Math.PI / 10, 0, 0); // Reset head to initial tilt
    }
    if (this.tailMesh) {
      this.tailMesh.rotation.set(0,0,0); // Reset tail rotation, assuming Y is wag, X,Z are 0
    }
    // Reset body pitch and roll explicitly if they were directly set on mesh
    if (this.mesh) {
        this.mesh.rotation.x = 0;
        this.mesh.rotation.z = 0;
    }
  }

  public dispose(): void {
    if (this.mesh) {
        const shellMesh = this.mesh.children.find(child => child.name === "SeaTurtleShell");
        if (shellMesh instanceof THREE.Mesh && shellMesh.material instanceof THREE.MeshStandardMaterial) {
            shellMesh.material.map?.dispose(); 
            shellMesh.material.bumpMap?.dispose(); // Dispose bump map
        }

        this.mesh.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.geometry?.dispose();
                // Material disposal: if material is an array, dispose each one
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else if (child.material) {
                    // If not an array, dispose the single material
                    child.material.dispose();
                }
            }
        });
        this.mesh.clear(); // Removes all children from the group
    }
    
    this.flippers = []; // Clear the array of flippers

    // Nullify references to complex objects
    // @ts-ignore
    this.mesh = null;
    // @ts-ignore
    this.head = null;
    // @ts-ignore
    this.tailMesh = null;
    // @ts-ignore
    this.collisionMesh = null;
  }
}