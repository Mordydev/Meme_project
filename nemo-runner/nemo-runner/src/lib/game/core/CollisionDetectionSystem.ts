import * as THREE from 'three';
import { PlayerController } from '../managers/PlayerController';
import { ObstacleManager } from '../managers/ObstacleManager';
// import { CollectibleManager } from '../managers/CollectibleManager'; // For later

declare global {
  interface Window { __gameEngine?: any }
}

export class CollisionDetectionSystem {
  private playerController: PlayerController;
  private obstacleManager: ObstacleManager;
  private onPlayerKilled: () => void;
  // private collectibleManager: CollectibleManager;

  // Use bounding spheres for simplicity first
  private playerBoundingSphere: THREE.Sphere;
  private obstacleBoundingSphere: THREE.Sphere;
  private tempBoxForObstacle: THREE.Box3; // Reusable Box3 for obstacles

  // Debug helpers
  private playerSphereHelper?: THREE.Mesh;
  private obstacleSphereHelpers: THREE.Mesh[] = [];

  constructor(
    playerController: PlayerController,
    obstacleManager: ObstacleManager,
    onPlayerKilled: () => void
  ) {
    this.playerController = playerController;
    this.obstacleManager = obstacleManager;
    this.onPlayerKilled = onPlayerKilled;
    // this.collectibleManager = collectibleManager;

    this.playerBoundingSphere = new THREE.Sphere();
    this.obstacleBoundingSphere = new THREE.Sphere();
    this.tempBoxForObstacle = new THREE.Box3();
  }

  public checkCollisions(): void {
    // TEMP: Log each check
    console.log("CollisionDetectionSystem: Checking collisions. Player invincible:", this.playerController.isInvincible);
    if (!this.playerController.mesh || this.playerController.isInvincible) {
      return;
    }
    if (!this.playerController.mesh.geometry) return;
    this.playerController.mesh.geometry.computeBoundingSphere();
    if (!this.playerController.mesh.geometry.boundingSphere) return;
    this.playerBoundingSphere.copy(this.playerController.mesh.geometry.boundingSphere);
    this.playerBoundingSphere.applyMatrix4(this.playerController.mesh.matrixWorld);

    // TEMP: Visualize player bounding sphere
    if (!this.playerSphereHelper) {
      const geometry = new THREE.SphereGeometry(this.playerBoundingSphere.radius, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
      this.playerSphereHelper = new THREE.Mesh(geometry, material);
      if (window.__gameEngine && window.__gameEngine.getScene) {
        window.__gameEngine.getScene().add(this.playerSphereHelper);
      }
    }
    this.playerSphereHelper.position.copy(this.playerBoundingSphere.center);

    for (const [i, obstacle] of this.obstacleManager.activeObstacles.entries()) {
      if (obstacle.isActive) {
        console.log("Checking obstacle:", obstacle.mesh.name, "at", obstacle.mesh.position, "Visible:", obstacle.mesh.visible);

        // Calculate obstacle bounding sphere using Box3 (world coordinates)
        this.tempBoxForObstacle.setFromObject(obstacle.mesh);
        this.tempBoxForObstacle.getBoundingSphere(this.obstacleBoundingSphere);

        // TEMP: Visualize first obstacle's bounding sphere (for debugging, can be extended to all obstacles if needed)
        if (i === 0) {
          if (!this.obstacleSphereHelpers[0]) {
            const geometry = new THREE.SphereGeometry(this.obstacleBoundingSphere.radius, 16, 16);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
            const helper = new THREE.Mesh(geometry, material);
            this.obstacleSphereHelpers[0] = helper;
            if (window.__gameEngine && window.__gameEngine.getScene) {
              window.__gameEngine.getScene().add(helper);
            }
          }
          this.obstacleSphereHelpers[0].position.copy(this.obstacleBoundingSphere.center);
        }

        // --- DETAILED LOGGING FOR THIS PAIR ---
        const playerSphereData = {
          center: {
            x: this.playerBoundingSphere.center.x.toFixed(2),
            y: this.playerBoundingSphere.center.y.toFixed(2),
            z: this.playerBoundingSphere.center.z.toFixed(2)
          },
          radius: this.playerBoundingSphere.radius.toFixed(2)
        };
        const obstacleSphereData = {
          center: {
            x: this.obstacleBoundingSphere.center.x.toFixed(2),
            y: this.obstacleBoundingSphere.center.y.toFixed(2),
            z: this.obstacleBoundingSphere.center.z.toFixed(2)
          },
          radius: this.obstacleBoundingSphere.radius.toFixed(2)
        };
        console.log(`Collision Check: Player ${JSON.stringify(playerSphereData)} vs Obstacle ${obstacle.mesh.name} ${JSON.stringify(obstacleSphereData)}`);
        // --- END DETAILED LOGGING ---

        if (this.playerBoundingSphere.intersectsSphere(this.obstacleBoundingSphere)) {
          console.log("%cCollision INTERSECTION SUCCEEDED!", "color: green; font-weight: bold;", "Obstacle:", obstacle.mesh.name);
          this.obstacleManager.handleObstacleHit(obstacle.mesh);
          const shouldGameOver = this.playerController.handleHit();
          if (shouldGameOver) {
            console.log("CollisionSystem: Signaling GAME OVER to GameEngine.");
            this.onPlayerKilled();
          }
          break;
        }
      }
    }
    // Later: Check collectibles
  }
  
  public dispose(): void {
    console.log("CollisionDetectionSystem: Disposed.");
  }
} 