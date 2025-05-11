import * as THREE from 'three';
import { PlayerController } from '../managers/PlayerController';
import { ObstacleManager } from '../managers/ObstacleManager';
import { GameEngine, GameState } from '../GameEngine';
import { configSystem } from './ConfigurationSystem';
import { CollectibleManager } from '../managers/CollectibleManager';
import { ScoringSystem } from '../managers/ScoringSystem';

declare global {
  interface Window { __gameEngine?: any }
}

export class CollisionDetectionSystem {
  private playerController: PlayerController;
  private obstacleManager: ObstacleManager;
  private collectibleManager: CollectibleManager;
  private scoringSystem: ScoringSystem;
  private onPlayerKilled: () => void;
  private gameEngine?: GameEngine; // Optional because we may get it from window.__gameEngine

  // Use bounding spheres for simplicity first
  private playerBoundingSphere: THREE.Sphere;
  private obstacleBoundingSphere: THREE.Sphere;
  private tempBoxForObstacle: THREE.Box3; // Reusable Box3 for obstacles
  private collectibleInstanceWorldSphere: THREE.Sphere; // For collectible collision detection

  // Debug helpers
  private playerSphereHelper?: THREE.Mesh;
  private obstacleSphereHelpers: THREE.Mesh[] = [];

  // Debug helpers - commented out after collision detection confirmed working
  // private playerDebugSphereMesh?: THREE.Mesh;
  // private obstacleDebugSphereMesh?: THREE.Mesh;

  constructor(
    playerController: PlayerController,
    obstacleManager: ObstacleManager,
    collectibleManager: CollectibleManager,
    scoringSystem: ScoringSystem,
    onPlayerKilled: () => void,
    gameEngine?: GameEngine
  ) {
    this.playerController = playerController;
    this.obstacleManager = obstacleManager;
    this.collectibleManager = collectibleManager;
    this.scoringSystem = scoringSystem;
    this.onPlayerKilled = onPlayerKilled;
    this.gameEngine = gameEngine;

    this.playerBoundingSphere = new THREE.Sphere();
    this.obstacleBoundingSphere = new THREE.Sphere();
    this.tempBoxForObstacle = new THREE.Box3();
    this.collectibleInstanceWorldSphere = new THREE.Sphere();

    // Debug visualization removed after collision detection confirmed working
    // this.initializeExactDebugSpheres();
  }
  
  // Debug helper initialization method - commented out after collision detection confirmed working
  /*
  private initializeExactDebugSpheres(): void {
    // Create player exact debug sphere
    const playerGeometry = new THREE.SphereGeometry(1, 16, 16);
    const playerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      depthTest: false,
      transparent: true,
      opacity: 0.8
    });
    this.playerDebugSphereMesh = new THREE.Mesh(playerGeometry, playerMaterial);
    this.playerDebugSphereMesh.renderOrder = 999;
    this.playerDebugSphereMesh.visible = false;

    // Create obstacle exact debug sphere
    const obstacleGeometry = new THREE.SphereGeometry(1, 16, 16);
    const obstacleMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
      depthTest: false,
      transparent: true,
      opacity: 0.8
    });
    this.obstacleDebugSphereMesh = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    this.obstacleDebugSphereMesh.renderOrder = 999;
    this.obstacleDebugSphereMesh.visible = false;

    // Add to scene when available
    const getScene = () => {
      if (this.gameEngine) return this.gameEngine.getScene();
      if (window.__gameEngine && window.__gameEngine.getScene) return window.__gameEngine.getScene();
      return null;
    };

    const scene = getScene();
    if (scene) {
      scene.add(this.playerDebugSphereMesh);
      scene.add(this.obstacleDebugSphereMesh);
      console.log("CollisionDetectionSystem: Initialized with debug spheres");
    } else {
      console.warn("CollisionDetectionSystem: Couldn't add debug spheres - no scene available");
    }
  }
  */

  public checkCollisions(): void {
    // Skip collision detection if player mesh is missing or the game is not in PLAYING state
    if (!this.playerController.mesh ||
        (this.gameEngine && this.gameEngine.getCurrentState() !== GameState.PLAYING)) {
      return;
    }

    // The player might be a Group or a Mesh
    if (this.playerController.mesh.type === 'Group') {
      // Use Box3 for groups (consistent with obstacle approach)
      const box = new THREE.Box3().setFromObject(this.playerController.mesh);
      box.getBoundingSphere(this.playerBoundingSphere);
    } else {
      // Standard approach for a Mesh with geometry
      if (!this.playerController.mesh.geometry) {
        console.error("Player mesh has no geometry");
        return;
      }

      this.playerController.mesh.geometry.computeBoundingSphere();
      if (!this.playerController.mesh.geometry.boundingSphere) {
        console.error("Player mesh has no bounding sphere after computation");
        return;
      }

      this.playerBoundingSphere.copy(this.playerController.mesh.geometry.boundingSphere);
      this.playerBoundingSphere.applyMatrix4(this.playerController.mesh.matrixWorld);
    }

    // Check for invalid player sphere data
    if (isNaN(this.playerBoundingSphere.radius) ||
        isNaN(this.playerBoundingSphere.center.x) ||
        isNaN(this.playerBoundingSphere.center.y) ||
        isNaN(this.playerBoundingSphere.center.z) ||
        this.playerBoundingSphere.radius <= 0) {
      console.error("INVALID PLAYER SPHERE DATA:", this.playerBoundingSphere);
      return; // Cannot proceed with invalid sphere data
    }

    // Debug visualization removed after collision detection confirmed working
    /*
    // Update exact debug sphere for player
    if (this.playerDebugSphereMesh) {
      this.playerDebugSphereMesh.position.copy(this.playerBoundingSphere.center);
      this.playerDebugSphereMesh.scale.set(
        this.playerBoundingSphere.radius,
        this.playerBoundingSphere.radius,
        this.playerBoundingSphere.radius
      );
      this.playerDebugSphereMesh.visible = true;
    }

    // TEMP: Visualize player bounding sphere with traditional helper
    if (!this.playerSphereHelper) {
      const geometry = new THREE.SphereGeometry(this.playerBoundingSphere.radius, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
      this.playerSphereHelper = new THREE.Mesh(geometry, material);
      const scene = this.gameEngine?.getScene() || (window.__gameEngine?.getScene?.());
      if (scene) {
        scene.add(this.playerSphereHelper);
      }
    }
    this.playerSphereHelper.position.copy(this.playerBoundingSphere.center);

    // Hide all obstacle sphere helpers initially - we'll show only the active ones
    this.obstacleSphereHelpers.forEach(helper => {
      if (helper) helper.visible = false;
    });

    // Hide exact obstacle debug sphere initially
    if (this.obstacleDebugSphereMesh) {
      this.obstacleDebugSphereMesh.visible = false;
    }
    */

    // --- Obstacle Collisions --- Only check obstacles if not invincible
    if (!this.playerController.isInvincible) {
      for (const obstacle of this.obstacleManager.activeObstacles) {
        if (obstacle.isActive) {
          // Try to find the collision sphere within the obstacle
          let collisionSphere;

          // Look for type-specific collision spheres
          if (obstacle.type === 'coral') {
            collisionSphere = obstacle.mesh.getObjectByName("CoralCollisionSphere");
          } else if (obstacle.type === 'rock') {
            collisionSphere = obstacle.mesh.getObjectByName("RockCollisionSphere");
          } else if (obstacle.type === 'clam') {
            collisionSphere = obstacle.mesh.getObjectByName("ClamCollisionSphere");
          }

          if (collisionSphere) {
            // Use the explicit collision sphere if it exists
            collisionSphere.updateMatrixWorld(true); // Ensure world matrix is up to date

            // Get the world position of the collision sphere
            const worldPosition = new THREE.Vector3();
            worldPosition.setFromMatrixPosition(collisionSphere.matrixWorld);

            // Get the radius (scaled by world matrix if needed)
            const worldScale = new THREE.Vector3();
            collisionSphere.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), worldScale);
            const worldRadius = collisionSphere.geometry.parameters.radius * Math.max(worldScale.x, worldScale.y, worldScale.z);

            // Set the obstacle bounding sphere using the collision sphere data
            this.obstacleBoundingSphere.center.copy(worldPosition);

            // Store original radius
            const originalObstacleRadius = worldRadius;

            // Scale down the radius for more precise collision detection
            const collisionRadiusFactor = configSystem.getObstacleRadiusFactor(); // Get from config
            this.obstacleBoundingSphere.radius = originalObstacleRadius * collisionRadiusFactor;
          } else {
            // Fallback to Box3 method if no explicit collision sphere exists
            this.tempBoxForObstacle.setFromObject(obstacle.mesh);
            this.tempBoxForObstacle.getBoundingSphere(this.obstacleBoundingSphere);

            // Store original radius
            const originalObstacleRadius = this.obstacleBoundingSphere.radius;

            // Scale down the radius for more precise collision detection
            const collisionRadiusFactor = configSystem.getObstacleRadiusFactor(); // Get from config
            this.obstacleBoundingSphere.radius = originalObstacleRadius * collisionRadiusFactor;
          }

          // Check for invalid obstacle sphere data
          if (isNaN(this.obstacleBoundingSphere.radius) ||
              isNaN(this.obstacleBoundingSphere.center.x) ||
              isNaN(this.obstacleBoundingSphere.center.y) ||
              isNaN(this.obstacleBoundingSphere.center.z) ||
              this.obstacleBoundingSphere.radius <= 0) {
            console.error("INVALID OBSTACLE SPHERE DATA:", this.obstacleBoundingSphere);
            continue; // Skip this obstacle if invalid
          }

          // All debug visualization code removed after collision detection confirmed working

          // Check for intersection with player
          if (this.playerBoundingSphere.intersectsSphere(this.obstacleBoundingSphere)) {
            console.log("Collision detected with obstacle:", obstacle.mesh.name || 'Unnamed');
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
    }

    // --- Collectible Collisions ---
    // Check bubble collectibles
    const checkCollectibleType = (dataArray: any[], instancesMesh: THREE.InstancedMesh) => {
      for (let i = 0; i < dataArray.length; i++) {
        const instance = dataArray[i];
        if (instance.isActive) {
          // Transform instance's local bounding sphere to world space
          this.collectibleInstanceWorldSphere.copy(instance.localBoundingSphere);
          this.collectibleInstanceWorldSphere.applyMatrix4(instance.matrix);

          if (this.playerBoundingSphere.intersectsSphere(this.collectibleInstanceWorldSphere)) {
            const scoreValue = this.collectibleManager.handleCollectibleHit(instance.id);
            if (scoreValue !== null) {
              this.scoringSystem.addScore(scoreValue);
              // Optional: Trigger visual/audio effect for collection
              // this.visualEffectsService.playCollectionEffect(instance.type, worldPosition);
            }
            // No break here, player can collect multiple items in one frame
          }
        }
      }
    };

    // Check both bubble and coin collectibles
    checkCollectibleType(this.collectibleManager.getBubbleData(), this.collectibleManager.getBubbleInstances());
    checkCollectibleType(this.collectibleManager.getCoinData(), this.collectibleManager.getCoinInstances());
  }
  
  public dispose(): void {
    // Debug visualization cleanup code is commented out since it's no longer needed
    /*
    const getScene = () => {
      if (this.gameEngine) return this.gameEngine.getScene();
      if (window.__gameEngine && window.__gameEngine.getScene) return window.__gameEngine.getScene();
      return null;
    };

    const scene = getScene();

    // Remove player sphere helper
    if (this.playerSphereHelper && scene) {
      scene.remove(this.playerSphereHelper);
      this.playerSphereHelper.geometry.dispose();
      this.playerSphereHelper.material.dispose();
      this.playerSphereHelper = undefined;
    }

    // Remove all obstacle sphere helpers
    this.obstacleSphereHelpers.forEach(helper => {
      if (helper && scene) {
        scene.remove(helper);
        helper.geometry.dispose();
        helper.material.dispose();
      }
    });
    this.obstacleSphereHelpers = [];

    // Remove exact debug spheres
    if (this.playerDebugSphereMesh && scene) {
      scene.remove(this.playerDebugSphereMesh);
      this.playerDebugSphereMesh.geometry.dispose();
      this.playerDebugSphereMesh.material.dispose();
      this.playerDebugSphereMesh = undefined;
    }

    if (this.obstacleDebugSphereMesh && scene) {
      scene.remove(this.obstacleDebugSphereMesh);
      this.obstacleDebugSphereMesh.geometry.dispose();
      this.obstacleDebugSphereMesh.material.dispose();
      this.obstacleDebugSphereMesh = undefined;
    }
    */

    // Nothing to dispose currently since debug visualization is removed
    console.log("CollisionDetectionSystem: Disposed.");
  }
}