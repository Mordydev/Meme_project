import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { KelpWallObstacleConfig, ObstacleStandardMaterialVisuals } from '../../config/gameConfig';

export class KelpWallAsset {
  public config: Readonly<KelpWallObstacleConfig>;
  public mesh!: THREE.Group;
  private collisionMesh!: THREE.Mesh;
  private kelpStrands: THREE.Mesh[] = []; // To hold individual strand meshes for animation

  private animationTime: number = 0;

  constructor() {
    this.config = this._fetchConfig();
    this.createMesh();
  }

  private _fetchConfig(): Readonly<KelpWallObstacleConfig> {
    const defaultConfig: KelpWallObstacleConfig = {
        baseScaleY: 3.5, // Overall height of the kelp wall
        segmentWidthCoverage: 1.0, // How many lane widths the kelp wall segment covers
        strandCountMin: 5,
        strandCountMax: 8,
        swayAmplitude: 0.15,
        swaySpeed: 0.8,
        visuals: { // Default visuals for KelpWall
            mainColor: 0x2E8B57, // SeaGreen
            detailColor: 0x20603D, // Darker green for fronds or variation
            roughness: 0.8,
            metalness: 0.05,
            opacity: 0.85,
            transmission: 0.3, // For light passing through
            animationSpeed: 0.8, // Overrides general swaySpeed for vertex anim
            animationAmplitude: 0.15, // Overrides general swayAmplitude for vertex anim
        }
    };
    try {
        const specificConfig = configSystem.getObstaclesConfig().kelpWall;
        return { ...defaultConfig, ...specificConfig, visuals: { ...defaultConfig.visuals, ...specificConfig?.visuals } };
    } catch (error) {
        console.warn("KelpWallAsset: Could not get config, using defaults", error);
        return defaultConfig;
    }
  }

  private createMesh(): void {
    this.mesh = new THREE.Group();
    this.mesh.name = "KelpWallObstacle_StdMat";
    const visualConf = this.config.visuals as Required<ObstacleStandardMaterialVisuals>;

    const strandHeight = this.config.baseScaleY;
    const numStrands = THREE.MathUtils.randInt(this.config.strandCountMin, this.config.strandCountMax);
    const totalWallWidth = (configSystem.get('player').laneWidth * this.config.segmentWidthCoverage);
    const spacing = numStrands > 1 ? totalWallWidth / (numStrands - 1) : 0;

    const kelpMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(visualConf.mainColor),
        roughness: visualConf.roughness,
        metalness: visualConf.metalness,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: visualConf.opacity,
        transmission: visualConf.transmission, // More direct assignment
    });

    for (let i = 0; i < numStrands; i++) {
        const strandGroup = new THREE.Group(); // Each strand is a group of stalk + fronds

        // Stalk Geometry (tapered cylinder or box)
        const stalkRadiusTop = 0.03;
        const stalkRadiusBottom = 0.05;
        const stalkHeight = strandHeight * THREE.MathUtils.randFloat(0.9, 1.1); // Slight height variation
        const stalkSegments = 12; // More segments for smoother bending
        const stalkGeom = new THREE.CylinderGeometry(stalkRadiusTop, stalkRadiusBottom, stalkHeight, 8, stalkSegments);
        stalkGeom.translate(0, stalkHeight / 2, 0); // Pivot at base
        // Store original positions for vertex animation
        stalkGeom.userData.originalPositions = stalkGeom.attributes.position.clone();
        stalkGeom.userData.partHeight = stalkHeight; // Store part height
        
        const stalk = new THREE.Mesh(stalkGeom, kelpMaterial);
        strandGroup.add(stalk);
        this.kelpStrands.push(stalk); // Add stalk for vertex animation

        // Frond Geometry (attached to stalk)
        const numFronds = THREE.MathUtils.randInt(3, 6);
        const frondMaterial = kelpMaterial.clone(); // Can use same or vary color slightly
        if (visualConf.detailColor) {
            frondMaterial.color = new THREE.Color(visualConf.detailColor);
            if (frondMaterial.emissive && visualConf.mainColor === visualConf.emissiveColor) {
                 // If main color was used for emissive, update frond emissive based on detail color
                (frondMaterial.emissive as THREE.Color).set(visualConf.detailColor).multiplyScalar(0.3);
            }
        }

        for (let j = 0; j < numFronds; j++) {
            const frondLength = stalkHeight * THREE.MathUtils.randFloat(0.2, 0.4);
            const frondWidth = frondLength * THREE.MathUtils.randFloat(0.15, 0.25);
            
            const frondShape = new THREE.Shape();
            frondShape.moveTo(0,0);
            frondShape.quadraticCurveTo(frondWidth * 0.3, frondLength * 0.2, frondWidth * 0.5, frondLength * 0.5);
            frondShape.quadraticCurveTo(frondWidth * 0.4, frondLength * 0.8, 0, frondLength); // Pointed tip
            frondShape.quadraticCurveTo(-frondWidth * 0.4, frondLength * 0.8, -frondWidth * 0.5, frondLength * 0.5);
            frondShape.quadraticCurveTo(-frondWidth * 0.3, frondLength * 0.2, 0,0);
            
            // Simpler plane for fronds can also work well and be cheaper
            // const frondGeom = new THREE.PlaneGeometry(frondWidth, frondLength, 1, 5);
            const frondGeom = new THREE.ShapeGeometry(frondShape, 5);
            frondGeom.translate(0, frondLength / 2, 0); // Pivot at its attachment point
            frondGeom.userData.originalPositions = frondGeom.attributes.position.clone();
            frondGeom.userData.partHeight = frondLength; // Store part height

            const frond = new THREE.Mesh(frondGeom, frondMaterial);
            const attachHeight = (j / numFronds) * stalkHeight * 0.8 + stalkHeight * 0.1; // Distribute along stalk
            frond.position.set(0, attachHeight, stalkRadiusBottom);
            frond.rotation.x = Math.PI / 2 + THREE.MathUtils.randFloat(-0.3, 0.3); // Angle outwards
            frond.rotation.y = THREE.MathUtils.randFloat(-Math.PI, Math.PI); // Random orientation around stalk
            stalk.add(frond); // Attach frond to the stalk
            this.kelpStrands.push(frond); // Add frond for vertex animation
        }

        strandGroup.position.x = (i * spacing) - (totalWallWidth / 2) + (spacing / 2);
        if (numStrands === 1) strandGroup.position.x = 0;
        strandGroup.position.z = (Math.random() - 0.5) * 0.3;
        strandGroup.rotation.y = (Math.random() - 0.5) * 0.4;
        this.mesh.add(strandGroup);
    }
    
    const collisionHeight = strandHeight;
    const collisionWidth = totalWallWidth + 0.1; 
    const collisionDepth = 0.3; 
    const collisionGeom = new THREE.BoxGeometry(collisionWidth, collisionHeight, collisionDepth);
    this.collisionMesh = new THREE.Mesh(collisionGeom, new THREE.MeshBasicMaterial({ visible: false, wireframe: true }));
    this.collisionMesh.name = "KelpWallCollisionBox";
    this.collisionMesh.position.y = strandHeight / 2; 
    this.mesh.add(this.collisionMesh);

    this.mesh.userData = { type: 'obstacle', name: 'kelpWall', assetInstance: this, isDangerous: true };
  }
  
  public updateAnimation(deltaTime: number): void {
    this.animationTime += deltaTime;
    const visualConf = this.config.visuals as Required<ObstacleStandardMaterialVisuals>;
    const swaySpeed = visualConf.animationSpeed || this.config.swaySpeed;
    const swayAmplitude = visualConf.animationAmplitude || this.config.swayAmplitude;

    this.kelpStrands.forEach((kelpPart, partIndex) => {
        const geom = kelpPart.geometry;
        const originalPos = geom.userData.originalPositions as THREE.BufferAttribute;
        const currentPos = geom.attributes.position as THREE.BufferAttribute;
        const partHeight = geom.userData.partHeight as number || this.config.baseScaleY; // Fallback, but should be set

        if (!originalPos) return; // Skip if original positions not stored

        const worldPos = new THREE.Vector3();
        kelpPart.getWorldPosition(worldPos); // Get world position of the kelp part's origin

        for (let i = 0; i < originalPos.count; i++) {
            const ox = originalPos.getX(i);
            const oy = originalPos.getY(i);
            const oz = originalPos.getZ(i);

            // Create a local reference point for sway based on original y (height along stalk/frond)
            // And add some variation based on the kelp part's world position to desynchronize strands
            const phaseOffset = (worldPos.x + worldPos.z) * 0.5 + partIndex * 0.2;
            // Sway factor normalized by the specific part's height (stalk or frond)
            // oy is centered around 0, so (oy / (partHeight / 2)) or ( (oy + partHeight/2) / partHeight ) for 0-1 range
            const normalizedY = (oy + partHeight / 2) / partHeight; // Normalizes oy to be 0 at base, 1 at top
            const swayFactor = Math.pow(normalizedY, 1.5); // More sway at the top, less at base
            
            const waveX = Math.sin(this.animationTime * swaySpeed * 0.7 + oy * 0.3 + phaseOffset) * swayAmplitude * swayFactor;
            const waveZ = Math.cos(this.animationTime * swaySpeed * 0.5 + oy * 0.4 + phaseOffset * 1.2) * swayAmplitude * swayFactor * 0.6;

            // Validate waveX and waveZ before applying
            if (isNaN(waveX) || isNaN(waveZ) || !isFinite(waveX) || !isFinite(waveZ)) {
                // console.warn("KelpWallAsset: Invalid waveX or waveZ. Skipping vertex update.", {waveX, waveZ, oy, swayFactor});
                // If problematic, just use original position for this vertex for this frame
                currentPos.setXYZ(i, ox, oy, oz);
                continue; 
  }

            // Apply sway relative to the original X and Z, Y remains mostly for height
            currentPos.setXYZ(i, ox + waveX, oy, oz + waveZ);
        }
        currentPos.needsUpdate = true;
        geom.computeVertexNormals(); // Important if lighting is affected by deformation
    });
  }

  public getMesh(): THREE.Group { return this.mesh; }
  public getCollisionObject(): THREE.Mesh { return this.collisionMesh; }
  public isDangerous(): boolean { return true; }

  public reset(): void {
    this.animationTime = 0;
    this.kelpStrands.forEach(kelpPart => {
        const geom = kelpPart.geometry;
        const originalPos = geom.userData.originalPositions as THREE.BufferAttribute;
        const currentPos = geom.attributes.position as THREE.BufferAttribute;
        if (originalPos && currentPos) {
            currentPos.copy(originalPos);
            currentPos.needsUpdate = true;
            geom.computeVertexNormals();
        }
    });
  }

  public dispose(): void {
    this.mesh.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose(); // originalPositions is on geometry, will be GC'd
        if (child.material instanceof THREE.Material) {
            const mat = child.material as THREE.MeshStandardMaterial; // or Physical
            mat.map?.dispose();
            mat.normalMap?.dispose();
            mat.bumpMap?.dispose();
            // If using transmission, specific transmissionMap might need disposal if it's a texture
            // mat.transmissionMap?.dispose(); 
            mat.dispose();
        }
      }
    });
    this.mesh.clear();
    this.kelpStrands = [];
  }
}