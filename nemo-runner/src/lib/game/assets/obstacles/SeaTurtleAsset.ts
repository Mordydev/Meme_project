import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { SeaTurtleConfig, ObstacleStandardMaterialVisuals } from '../../config/gameConfig';

export class SeaTurtleAsset {
  public config: Readonly<SeaTurtleConfig>;
  private mesh!: THREE.Group;
  private collisionMesh!: THREE.Mesh;
  private flippers: THREE.Mesh[] = [];
  private head!: THREE.Mesh;
  
  private animationTime: number = 0;
  private targetTurnAngle: number = 0;
  private turnTransitionSpeed: number = Math.PI / 2;

  constructor() {
    this.config = this._fetchConfig();
    this.createMesh();
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
    const scale = this.config.baseScale;
    const visualConf = this.config.visuals as Required<ObstacleStandardMaterialVisuals>;

    const shellMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.mainColor),
      roughness: visualConf.roughness,
      metalness: visualConf.metalness,
      map: this.createShellPatternTexture(visualConf.mainColor, visualConf.textureMapUrl)
    });

    const skinMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(visualConf.detailColor),
      roughness: (visualConf.roughness || 0.7) * 1.1,
      metalness: visualConf.metalness || 0.1,
    });

    const shellRadius = 0.7 * scale;
    const shellGeom = new THREE.SphereGeometry(shellRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    shellGeom.scale(1, 0.5, 0.8); 
    const shellMesh = new THREE.Mesh(shellGeom, shellMaterial);
    shellMesh.rotation.x = -Math.PI / 2; 
    shellMesh.position.y = 0.1 * scale; 
    this.mesh.add(shellMesh);

    const headLength = 0.35 * scale;
    const headRadius = 0.18 * scale;
    const headGeom = new THREE.CapsuleGeometry(headRadius, headLength - 2 * headRadius, 12, 8);
    this.head = new THREE.Mesh(headGeom, skinMaterial);
    this.head.position.set(0, 0.25 * scale, -shellRadius * 0.65);
    this.head.rotation.x = Math.PI / 10;
    this.mesh.add(this.head);
    const eyeGeom = new THREE.SphereGeometry(0.04 * scale, 8, 6);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(headRadius * 0.7, headRadius * 0.3, headLength * 0.4);
    this.head.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(-headRadius * 0.7, headRadius * 0.3, headLength * 0.4);
    this.head.add(rightEye);

    this.flippers = this.createFlippers(scale, skinMaterial, visualConf);
    this.flippers.forEach(flipper => this.mesh.add(flipper));
    
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

  private createShellPatternTexture(shellColorParam: string | number, textureUrl?: string): THREE.Texture {
    if (textureUrl) {
        try {
            const texture = new THREE.TextureLoader().load(textureUrl);
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            return texture;
        } catch (e) {
            console.warn(`SeaTurtleAsset: Failed to load texture from ${textureUrl}, falling back to procedural.`, e);
        }
    }

    const canvas = document.createElement('canvas');
    const size = 128;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const baseShellColor = new THREE.Color(shellColorParam);
    ctx.fillStyle = baseShellColor.getStyle();
    ctx.fillRect(0, 0, size, size);

    // Derive pattern color by darkening the base shell color
    const patternColor = baseShellColor.clone().offsetHSL(0, 0.05, -0.2);
    ctx.strokeStyle = patternColor.getStyle();
    ctx.lineWidth = size / 32;

    const scuteSize = size / 4;
    for (let y = -scuteSize / 2; y < size + scuteSize; y += scuteSize * 0.866) {
        for (let x = -scuteSize / 2, row = 0; x < size + scuteSize; x += scuteSize * 1.5, row++) {
            const offsetX = (row % 2) * scuteSize * 0.75;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i + Math.PI / 6;
                const sx = x + offsetX + Math.cos(angle) * scuteSize * 0.5;
                const sy = y + Math.sin(angle) * scuteSize * 0.5;
                if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
            }
            ctx.closePath();
            ctx.stroke();
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  private createFlippers(scale: number, material: THREE.Material, visualConf: Required<ObstacleStandardMaterialVisuals>): THREE.Mesh[] {
    const flippers: THREE.Mesh[] = [];
    const extrudeSettings = { depth: 0.03 * scale, bevelEnabled: true, bevelThickness: 0.01 * scale, bevelSize: 0.01 * scale, bevelSegments: 1 };

    const frontFlipperShape = new THREE.Shape();
    const ffL = 0.7 * scale;
    const ffW = 0.3 * scale;
    frontFlipperShape.moveTo(0, -ffW / 2);
    frontFlipperShape.quadraticCurveTo(ffL * 0.4, -ffW * 0.7, ffL * 0.8, -ffW * 0.4);
    frontFlipperShape.quadraticCurveTo(ffL, 0, ffL * 0.8, ffW * 0.4);
    frontFlipperShape.quadraticCurveTo(ffL * 0.4, ffW * 0.7, 0, ffW / 2);
    frontFlipperShape.closePath();

    const frontFlipperGeom = new THREE.ExtrudeGeometry(frontFlipperShape, extrudeSettings);

    const frontLeftFlipper = new THREE.Mesh(frontFlipperGeom, material);
    frontLeftFlipper.name = "FrontLeftFlipper";
    frontLeftFlipper.position.set(0.35 * scale, 0.05 * scale, -0.2 * scale);
    frontLeftFlipper.rotation.y = Math.PI / 5;
    flippers.push(frontLeftFlipper);

    const frontRightFlipper = new THREE.Mesh(frontFlipperGeom.clone(), material);
    frontRightFlipper.name = "FrontRightFlipper";
    frontRightFlipper.position.set(-0.35 * scale, 0.05 * scale, -0.2 * scale);
    frontRightFlipper.rotation.y = -Math.PI / 5;
    flippers.push(frontRightFlipper);

    const rearFlipperShape = new THREE.Shape();
    const rfL = 0.45 * scale;
    const rfW = 0.25 * scale;
    rearFlipperShape.moveTo(0, -rfW / 2);
    rearFlipperShape.lineTo(rfL * 0.9, -rfW * 0.3);
    rearFlipperShape.quadraticCurveTo(rfL, 0, rfL * 0.9, rfW * 0.3);
    rearFlipperShape.lineTo(0, rfW / 2);
    rearFlipperShape.closePath();

    const rearFlipperGeom = new THREE.ExtrudeGeometry(rearFlipperShape, { ...extrudeSettings, depth: 0.02 * scale });

    const rearLeftFlipper = new THREE.Mesh(rearFlipperGeom, material);
    rearLeftFlipper.name = "RearLeftFlipper";
    rearLeftFlipper.position.set(0.25 * scale, 0, 0.4 * scale);
    rearLeftFlipper.rotation.y = -Math.PI / 7;
    flippers.push(rearLeftFlipper);

    const rearRightFlipper = new THREE.Mesh(rearFlipperGeom.clone(), material);
    rearRightFlipper.name = "RearRightFlipper";
    rearRightFlipper.position.set(-0.25 * scale, 0, 0.4 * scale);
    rearRightFlipper.rotation.y = Math.PI / 7;
    flippers.push(rearRightFlipper);
    
    return flippers;
  }

  public setTelegraphTurn(direction: 'left' | 'right' | 'center'): void {
    const turnAngleRad = THREE.MathUtils.degToRad(this.config.turnAngleDegrees);
    if (direction === 'left') {
      this.targetTurnAngle = turnAngleRad;
    } else if (direction === 'right') {
      this.targetTurnAngle = -turnAngleRad;
    } else {
      this.targetTurnAngle = 0;
    }
  }
  
  public updateAnimation(deltaTime: number): void {
    this.animationTime += deltaTime;
    const visualConf = this.config.visuals as Required<ObstacleStandardMaterialVisuals>;

    if (Math.abs(this.mesh.rotation.y - this.targetTurnAngle) > 0.01) {
      const turnStep = this.turnTransitionSpeed * deltaTime;
      if (this.mesh.rotation.y < this.targetTurnAngle) {
        this.mesh.rotation.y = Math.min(this.mesh.rotation.y + turnStep, this.targetTurnAngle);
      } else {
        this.mesh.rotation.y = Math.max(this.mesh.rotation.y - turnStep, this.targetTurnAngle);
      }
    }

    const frontFlipAmp = visualConf.animationAmplitude || 0.7;
    const rearFlipAmp = frontFlipAmp * 0.6;
    const animSpeed = visualConf.animationSpeed || 1.5;

    this.flippers.forEach((flipper) => {
        const isFront = flipper.name.includes("Front");
        const isLeft = flipper.name.includes("Left");
        const amp = isFront ? frontFlipAmp : rearFlipAmp;
        const freq = animSpeed * (isFront ? 1.0 : 1.15);
        let phase = isLeft ? 0 : Math.PI * 0.8;
        if (!isFront) phase += Math.PI * 0.4;

        flipper.rotation.z = Math.sin(this.animationTime * freq + phase) * amp;
        const twistAngle = Math.cos(this.animationTime * freq * 0.7 + phase + Math.PI/2) * amp * 0.4;
        flipper.rotation.x = (isLeft ? 1 : -1) * (isFront? Math.PI/12 : Math.PI/16) + twistAngle;
    });

    if (this.head) {
        this.head.rotation.z = Math.sin(this.animationTime * 0.5 + this.mesh.uuid.length) * 0.05;
        this.head.rotation.x = Math.PI / 10 + Math.cos(this.animationTime * 0.35 + this.mesh.uuid.length) * 0.08;
    }
    
    const bodyPitch = Math.sin(this.animationTime * animSpeed + Math.PI/2) * 0.03;
    this.mesh.rotation.x = bodyPitch;
  }

  public getMesh(): THREE.Group { return this.mesh; }
  public getCollisionObject(): THREE.Mesh { return this.collisionMesh; }
  public isDangerous(): boolean { return true; }

  public reset(): void {
    this.animationTime = 0;
    this.targetTurnAngle = 0;
    this.mesh.rotation.set(0,0,0);
    if (this.head) this.head.rotation.set(Math.PI/10, 0,0);
    
    this.flippers.forEach(flipper => {
      flipper.rotation.set(0,0,0);
      const isLeft = flipper.name.includes("Left");
      if (flipper.name.includes("Front")) {
          flipper.rotation.y = (isLeft ? 1 : -1) * Math.PI / 5;
          flipper.rotation.x = (isLeft ? 1 : -1) * Math.PI / 12;
      } else {
          flipper.rotation.y = (isLeft ? -1 : 1) * Math.PI / 7;
          flipper.rotation.x = (isLeft ? 1 : -1) * Math.PI / 16;
      }
    });
  }

  public dispose(): void {
    this.mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (child.material instanceof THREE.Material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.map?.dispose();
          mat.normalMap?.dispose();
          mat.bumpMap?.dispose();
          mat.dispose();
        }
      }
    });
    this.mesh.clear();
    this.flippers = [];
  }
}