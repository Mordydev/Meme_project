import * as THREE from 'three';
import { configSystem } from '../../core/ConfigurationSystem';
import { ShellsVisualConfig } from '../../config/gameConfig';

/** Simple decorative starfish/clam shell asset */
export class ShellAsset {
  public mesh: THREE.Mesh;
  private config: Readonly<ShellsVisualConfig>;

  constructor(sizeOverride?: number) {
    this.config = configSystem.get('visuals').shells;
    const size = sizeOverride ?? this.config.size;
    this.mesh = this.createMesh(size);
    this.mesh.name = 'ShellDecor';
    this.mesh.userData = { type: 'decor', name: 'shell', assetInstance: this };
  }

  private createMesh(size: number): THREE.Mesh {
    const shape = new THREE.Shape();
    const arms = 5; // Starfish-like shape
    const innerRadiusFactor = 0.4;

    for (let i = 0; i < arms; i++) {
      const outerAngle = (i / arms) * Math.PI * 2;
      const innerAngle = outerAngle + Math.PI / arms;
      const rOuter = size;
      const rInner = size * innerRadiusFactor;

      const xOuter = Math.cos(outerAngle) * rOuter;
      const yOuter = Math.sin(outerAngle) * rOuter;
      const xInner = Math.cos(innerAngle) * rInner;
      const yInner = Math.sin(innerAngle) * rInner;

      if (i === 0) {
        shape.moveTo(xOuter, yOuter);
      } else {
        shape.lineTo(xOuter, yOuter);
      }
      shape.lineTo(xInner, yInner);
    }
    shape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: size * 0.2, // Make it somewhat flat
      bevelEnabled: true,
      bevelThickness: size * 0.02,
      bevelSize: size * 0.03,
      bevelSegments: 1,
    };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(Math.PI / 2); // Orient it flat on the ground
    geometry.center(); // Center the geometry for easier positioning/scaling

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xffd7a0), // A sandy, light orange/yellow
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide, // In case bottom is visible
    });

    return new THREE.Mesh(geometry, material);
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose();
    }
  }
} 