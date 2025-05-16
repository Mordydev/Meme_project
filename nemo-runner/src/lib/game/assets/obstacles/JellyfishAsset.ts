import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { JellyfishConfig, ObstacleStandardMaterialVisuals } from '../../config/gameConfig';

export class JellyfishAsset {
  public config: Readonly<JellyfishConfig>;
  public mesh!: THREE.Group;
  private bell!: THREE.Mesh;
  private innerGlow!: THREE.Mesh;
  private collisionShape!: THREE.Mesh;
  
  private animationTime: number = 0;
  private initialX: number = 0;
  private tentacles: THREE.Mesh[] = [];
  private originalTentacleData: { geometry: THREE.BufferGeometry, originalPositions: THREE.BufferAttribute }[] = [];
  
  constructor() {
    this.config = this._fetchConfig();
    this.createMesh();
  }

  private _fetchConfig(): Readonly<JellyfishConfig> {
    const defaultConfig: JellyfishConfig = {
        bodyRadius: 0.6,
        tentacleCount: 8,
        tentacleLength: 1.2,
        tentacleRadius: 0.03,
        tentacleSway: 0.5,
        driftSpeed: 0.1,
        driftAmplitude: 0.3,
        verticalBobSpeed: 0.5,
        verticalBobAmplitude: 0.1,
        pulseSpeed: 1.0,
        pulseIntensityMin: 0.95,
        pulseIntensityMax: 1.05,
        visuals: {
            mainColor: 0xADD8E6,
            detailColor: 0x87CEEB,
            emissiveColor: 0x4682B4,
            emissiveIntensity: 0.4,
            roughness: 0.2,
            metalness: 0.1,
            opacity: 0.75,
            transmission: 0.8,
            animationSpeed: 1.0,
            animationAmplitude: 0.1
        }
    };
    try {
        const specificConfig = configSystem.getObstaclesConfig().jellyfish;
        const mergedConfig = { 
            ...defaultConfig, 
            ...specificConfig,
            visuals: { 
                ...defaultConfig.visuals, 
                ...(specificConfig?.visuals || {}),
            } 
        };
        return mergedConfig as Readonly<JellyfishConfig>;
    } catch (error) {
        console.warn("JellyfishAsset: Could not get config, using defaults", error);
        return defaultConfig as Readonly<JellyfishConfig>;
    }
  }

  public createMesh(): void {
    this.mesh = new THREE.Group();
    this.mesh.name = "JellyfishObstacle_StdMat";
    this.initialX = 0;
    const visualConf = this.config.visuals as Required<ObstacleStandardMaterialVisuals>;

    this.bell = this.createBell(this.config.bodyRadius, visualConf);
    this.mesh.add(this.bell);
    
    this.createTentacles(this.mesh, this.config.bodyRadius, this.config.tentacleCount, this.config.tentacleLength, this.config.tentacleRadius ?? 0.03, visualConf);
    
    this.innerGlow = this.createInnerGlow(this.config.bodyRadius * 0.6, visualConf);
    this.innerGlow.position.y = -this.config.bodyRadius * 0.1;
    this.bell.add(this.innerGlow);

    const collisionRadius = this.config.bodyRadius + this.config.tentacleLength * 0.7;
    this.collisionShape = new THREE.Mesh(
      new THREE.SphereGeometry(collisionRadius, 12, 8),
      new THREE.MeshBasicMaterial({ visible: false, wireframe: true })
    );
    this.collisionShape.name = "JellyfishCollisionSphere";
    this.collisionShape.position.y = -this.config.tentacleLength * 0.4;
    this.mesh.add(this.collisionShape);

    this.mesh.userData = { type: 'obstacle', name: 'jellyfish', assetInstance: this, isDangerous: true };
  }

  private createBell(radius: number, visualConf: Required<ObstacleStandardMaterialVisuals>): THREE.Mesh {
    const bellGeometry = new THREE.SphereGeometry(radius, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    const bellMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(visualConf.mainColor),
      transparent: true,
      opacity: visualConf.opacity,
      roughness: visualConf.roughness,
      metalness: visualConf.metalness,
      emissive: new THREE.Color(visualConf.emissiveColor),
      emissiveIntensity: visualConf.emissiveIntensity,
      transmission: visualConf.transmission ?? 0.0,
      side: THREE.DoubleSide
    });
    if (visualConf.textureMapUrl) {
      bellMaterial.map = new THREE.TextureLoader().load(visualConf.textureMapUrl);
    }
    const bell = new THREE.Mesh(bellGeometry, bellMaterial);
    bell.scale.y = 0.7;

    const edgeRadius = radius * 0.04;
    const edgeTubeGeom = new THREE.TorusGeometry(radius * 0.98, edgeRadius, 16, 48);
    const edgeMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(visualConf.detailColor || visualConf.mainColor),
        transparent: true, opacity: visualConf.opacity ? visualConf.opacity * 0.8 : 0.5,
        roughness: (visualConf.roughness || 0.2) + 0.1,
        metalness: visualConf.metalness || 0.1,
        emissive: new THREE.Color(visualConf.emissiveColor).multiplyScalar(1.2),
        emissiveIntensity: (visualConf.emissiveIntensity || 0.3) * 1.2,
        transmission: visualConf.transmission ? visualConf.transmission * 0.7 : 0.5,
        side: THREE.DoubleSide
    });
    const bellRim = new THREE.Mesh(edgeTubeGeom, edgeMaterial);
    bellRim.rotation.x = Math.PI / 2;
    bellRim.position.y = -edgeRadius*0.5;
    bell.add(bellRim);

    return bell;
  }

  private createInnerGlow(radius: number, visualConf: Required<ObstacleStandardMaterialVisuals>): THREE.Mesh {
    const glowGeometry = new THREE.SphereGeometry(radius, 16, 12);
    const glowMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(visualConf.detailColor),
      transparent: true,
      opacity: (visualConf.opacity || 0.7) * 0.5,
      emissive: new THREE.Color(visualConf.emissiveColor).multiplyScalar(1.5),
      emissiveIntensity: (visualConf.emissiveIntensity || 0.3) * 2.0,
      roughness: 0.5,
      metalness: 0.0,
      transmission: visualConf.transmission ? visualConf.transmission * 0.5 : 0.3,
      blending: THREE.AdditiveBlending
    });
    return new THREE.Mesh(glowGeometry, glowMaterial);
  }

  private createTentacles(group: THREE.Group, bodyRadius: number, count: number, length: number, tentacleRadiusBase: number, visualConf: Required<ObstacleStandardMaterialVisuals>): void {
    this.tentacles = [];
    this.originalTentacleData = [];
    const tentacleMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(visualConf.detailColor),
      transparent: true,
      opacity: 0.85,
      roughness: visualConf.roughness ?? 0.4,
      metalness: visualConf.metalness ?? 0.05,
      emissive: new THREE.Color(visualConf.emissiveColor).multiplyScalar(0.7),
      emissiveIntensity: (visualConf.emissiveIntensity ?? 0.3) * 0.7,
      transmission: (visualConf.transmission ?? 0.8) * 0.25,
      side: THREE.DoubleSide
    });

    const heightSegments = 10;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() -0.5) * 0.2;
      const x = Math.cos(angle) * bodyRadius * 0.75;
      const z = Math.sin(angle) * bodyRadius * 0.75;
      const currentLength = length * THREE.MathUtils.randFloat(0.7, 1.1);

      const tentacleGeom = new THREE.CylinderGeometry(
        tentacleRadiusBase * 0.5,
        tentacleRadiusBase,
        currentLength,
        8,
        heightSegments,
        true
      );
      tentacleGeom.translate(0, -currentLength / 2, 0);
      const originalPositions = tentacleGeom.attributes.position.clone();
      tentacleGeom.userData.originalPositions = originalPositions;
      
      const tentacle = new THREE.Mesh(tentacleGeom, tentacleMaterial);
      tentacle.position.set(x, -this.config.bodyRadius * 0.6, z);
      
      this.tentacles.push(tentacle);
      this.originalTentacleData.push({ geometry: tentacleGeom, originalPositions });
      group.add(tentacle);
    }
  }

  public updateAnimation(deltaTime: number): void {
    this.animationTime += deltaTime;
    const visualConf = this.config.visuals as Required<ObstacleStandardMaterialVisuals>;
    const animSpeed = visualConf.animationSpeed || 1.0;
    const animAmplitude = visualConf.animationAmplitude || 0.1;

    const pulseIntensityMin = this.config.pulseIntensityMin ?? 0.95;
    const pulseIntensityMax = this.config.pulseIntensityMax ?? 1.05;
    const pulseSpeedConf = this.config.pulseSpeed ?? 1.0;
    const pulseFactor = (pulseIntensityMax - pulseIntensityMin) / 2;
    const pulse = pulseIntensityMin + pulseFactor + Math.sin(this.animationTime * pulseSpeedConf * animSpeed) * pulseFactor;
    this.bell.scale.y = (0.7 * pulse);
    this.bell.scale.x = (1/pulse *0.5 +0.5);
    this.bell.scale.z = (1/pulse *0.5 +0.5);
    if (this.innerGlow) {
        this.innerGlow.scale.set(pulse * 0.9, pulse * 1.1, pulse * 0.9);
        if (this.innerGlow.material instanceof THREE.MeshPhysicalMaterial) {
             (this.innerGlow.material).opacity = (visualConf.opacity || 0.7) * 0.5 * (1 + Math.sin(this.animationTime * pulseSpeedConf * animSpeed * 1.2) * 0.3);
        }
    }

    const verticalBobSpeedConf = this.config.verticalBobSpeed ?? 0.5;
    const verticalBobAmplitudeConf = this.config.verticalBobAmplitude ?? 0.1;
    this.mesh.position.y = Math.sin(this.animationTime * verticalBobSpeedConf * animSpeed) * verticalBobAmplitudeConf;

    const driftSpeedConf = this.config.driftSpeed ?? 0.1;
    const driftAmplitudeConf = this.config.driftAmplitude ?? 0.3;
    this.mesh.position.x = this.initialX + Math.sin(this.animationTime * driftSpeedConf * animSpeed) * driftAmplitudeConf;

    this.tentacles.forEach((tentacle, tentacleIndex) => {
        const geom = tentacle.geometry;
        const originalPosAttr = geom.userData.originalPositions as THREE.BufferAttribute;
        const currentPosAttr = geom.attributes.position as THREE.BufferAttribute;

        if (!originalPosAttr || !currentPosAttr) { 
            return;
        }

        const tentacleCylinderParams = (geom as THREE.CylinderGeometry).parameters;
        if (!tentacleCylinderParams) {
            return; 
        }
        
        const tentacleLength = tentacleCylinderParams.height;

        if (tentacleLength === 0) { 
            return; 
        }

        for (let i = 0; i < originalPosAttr.count; i++) {
            const ox = originalPosAttr.getX(i);
            const oy = originalPosAttr.getY(i);
            const oz = originalPosAttr.getZ(i);

            const normalizedY = Math.abs(oy / tentacleLength);
            let swayFactor = Math.pow(normalizedY, 1.5);

            if (isNaN(swayFactor) || !isFinite(swayFactor)) {
                swayFactor = 0; 
            }

            const phaseOffset = tentacleIndex * 0.5 + (this.mesh.uuid.length % 5) * 0.1;
            
            const waveSpeed = animSpeed * 1.5;
            const waveAmplitude = animAmplitude * (1 + normalizedY * 0.5);

            const waveX = Math.sin(this.animationTime * waveSpeed + oy * 0.8 + phaseOffset) * waveAmplitude * swayFactor;
            const waveZ = Math.cos(this.animationTime * waveSpeed * 0.6 + oy * 0.7 + phaseOffset * 1.3) * waveAmplitude * swayFactor * 0.7;
            
            if (isNaN(waveX) || isNaN(waveZ) || !isFinite(waveX) || !isFinite(waveZ)) {
                continue; 
            }
            currentPosAttr.setXYZ(i, ox + waveX, oy, oz + waveZ);
        }
        currentPosAttr.needsUpdate = true;
    });
  }

  public reset(): void {
    this.animationTime = 0;
    this.bell.scale.set(1, 0.7, 1);
    if(this.innerGlow) this.innerGlow.scale.set(1,1,1);
    this.mesh.position.set(this.initialX, 0, this.mesh.position.z);

    this.originalTentacleData.forEach(data => {
        const currentPos = data.geometry.attributes.position as THREE.BufferAttribute;
        currentPos.copy(data.originalPositions);
        currentPos.needsUpdate = true;
    });
  }

  public dispose(): void {
    this.mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (child.material instanceof THREE.Material) {
            const mat = child.material as THREE.MeshPhysicalMaterial; 
            mat.map?.dispose();
            mat.normalMap?.dispose();
            mat.bumpMap?.dispose();
            mat.transmissionMap?.dispose();
            mat.dispose();
        }
      }
    });
    this.mesh.clear();
    this.tentacles = [];
    this.originalTentacleData = [];
  }
  
  public getMesh(): THREE.Group { return this.mesh; }
  public getCollisionObject(): THREE.Mesh { return this.collisionShape; }
  public isDangerous(): boolean { return true; }

  public setInitialX(x: number): void {
    this.initialX = x;
    this.mesh.position.x = x; // Also update current position if needed immediately
  }

  public constrainPosition(xBoundary: number): void {
    // This method assumes xBoundary is the positive limit (e.g., half of total playable width).
    // The playable area is assumed to be from -xBoundary to +xBoundary.
    const halfWidth = this.config.bodyRadius; // Approximation of jellyfish half-width

    if (this.mesh.position.x - halfWidth < -xBoundary) {
        this.mesh.position.x = -xBoundary + halfWidth;
        // Update initialX so the drift is now centered around this new clamped edge if we want it to stick to edge
        // However, typical sinusoidal drift will naturally pull it away from the edge on the next cycle.
        // If the drift is purely additive or velocity-based, one might need to reverse velocity here.
        // For sinusoidal, simple clamping is often enough.
        // this.initialX = this.mesh.position.x - Math.sin(this.animationTime * (this.config.driftSpeed ?? 0.1) * (this.config.visuals.animationSpeed || 1.0)) * (this.config.driftAmplitude ?? 0.3);

    }
    if (this.mesh.position.x + halfWidth > xBoundary) {
        this.mesh.position.x = xBoundary - halfWidth;
        // this.initialX = this.mesh.position.x - Math.sin(this.animationTime * (this.config.driftSpeed ?? 0.1) * (this.config.visuals.animationSpeed || 1.0)) * (this.config.driftAmplitude ?? 0.3);
    }
  }

  public getBellCollisionObject(): THREE.Mesh {
    return this.bell;
  }

  public getTentacleCollisionObjects(): THREE.Mesh[] {
    return this.tentacles;
  }
}