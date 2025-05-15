import * as THREE from 'three';
import { PlayerController } from '../managers/PlayerController';
import { ObstacleManager } from '../managers/ObstacleManager';
import { GameEngine, GameState } from '../GameEngine';
import { configSystem } from './ConfigurationSystem';
import { CollectibleManager } from '../managers/CollectibleManager';
import { ScoringSystem } from '../managers/ScoringSystem';
import { PowerUpManager } from '../managers/PowerUpManager';
import { PufferfishAsset } from '../assets/obstacles/PufferfishAsset';
import { JellyfishAsset } from '../assets/obstacles/JellyfishAsset';
import { ClamAsset } from '../assets/obstacles/ClamAsset';
import { SharkAsset } from '../assets/obstacles/SharkAsset';
import { SeaTurtleAsset } from '../assets/obstacles/SeaTurtleAsset';
import { KelpWallAsset } from '../assets/obstacles/KelpWallAsset';
import { SchoolOfFishAsset } from '../assets/obstacles/SchoolOfFishAsset';

declare global {
  interface Window { __gameEngine?: any }
}

export class CollisionDetectionSystem {
  private playerController: PlayerController;
  private obstacleManager: ObstacleManager;
  private collectibleManager: CollectibleManager;
  private powerUpManager?: PowerUpManager;
  private scoringSystem: ScoringSystem;
  private onPlayerKilled: () => void;
  private gameEngine?: GameEngine; // Optional because we may get it from window.__gameEngine

  // Use bounding spheres for simplicity first
  private playerBoundingSphere: THREE.Sphere;
  private obstacleBoundingSphere: THREE.Sphere;
  private obstaclePartBoundingSphere: THREE.Sphere; // For parts of obstacles like jellyfish tentacles
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
    gameEngine?: GameEngine,
    powerUpManager?: PowerUpManager
  ) {
    this.playerController = playerController;
    this.obstacleManager = obstacleManager;
    this.collectibleManager = collectibleManager;
    this.scoringSystem = scoringSystem;
    this.onPlayerKilled = onPlayerKilled;
    this.gameEngine = gameEngine;
    this.powerUpManager = powerUpManager;

    this.playerBoundingSphere = new THREE.Sphere();
    this.obstacleBoundingSphere = new THREE.Sphere();
    this.obstaclePartBoundingSphere = new THREE.Sphere(); // Initialize the new sphere
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

    // Get the player collision object
    const playerCollider = this.playerController.getCollisionObject();

    // Update player collision object's matrix
    playerCollider.updateMatrixWorld(true);

    // Compute bounding sphere if needed
    if (!playerCollider.geometry.boundingSphere) {
      playerCollider.geometry.computeBoundingSphere();
    }

    // Get bounding sphere in world space
    this.playerBoundingSphere.copy(playerCollider.geometry.boundingSphere!);
    this.playerBoundingSphere.applyMatrix4(playerCollider.matrixWorld);

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

    // --- Obstacle Collisions --- Only check obstacles if not invincible and not shield protected
    if (!this.playerController.isInvincible && !this.playerController.isPowerUpShieldActive) {
      for (const obstacle of this.obstacleManager.activeObstacles) {
        if (obstacle.isActive) {
          let hitDetected = false;

          // Use asset-specific collision detection based on the obstacle type
          if (obstacle.assetInstance instanceof PufferfishAsset) {
            // Only check collision if the pufferfish is in a dangerous state
            if (obstacle.assetInstance.isDangerous()) {
              const pufferfishCollider = obstacle.assetInstance.getCollisionObject();
              pufferfishCollider.updateMatrixWorld(true);

              // Compute the bounding sphere if needed
              if (!pufferfishCollider.geometry.boundingSphere) {
                pufferfishCollider.geometry.computeBoundingSphere();
              }

              this.obstaclePartBoundingSphere.copy(pufferfishCollider.geometry.boundingSphere!);
              this.obstaclePartBoundingSphere.applyMatrix4(pufferfishCollider.matrixWorld);

              if (this.playerBoundingSphere.intersectsSphere(this.obstaclePartBoundingSphere)) {
                hitDetected = true;
              }
            }
          }
          else if (obstacle.assetInstance instanceof JellyfishAsset) {
            // Check if the jellyfish is dangerous overall
            if (obstacle.assetInstance.isDangerous()) {
              // First check collision with the bell
              const bellCollider = obstacle.assetInstance.getBellCollisionObject();
              bellCollider.updateMatrixWorld(true);

              if (!bellCollider.geometry.boundingSphere) {
                bellCollider.geometry.computeBoundingSphere();
              }

              this.obstaclePartBoundingSphere.copy(bellCollider.geometry.boundingSphere!);
              this.obstaclePartBoundingSphere.applyMatrix4(bellCollider.matrixWorld);

              if (this.playerBoundingSphere.intersectsSphere(this.obstaclePartBoundingSphere)) {
                hitDetected = true;
              }
              else {
                // If no collision with bell, check each tentacle
                const tentacleColliders = obstacle.assetInstance.getTentacleCollisionObjects();
                for (const tentacle of tentacleColliders) {
                  tentacle.updateMatrixWorld(true);

                  if (!tentacle.geometry.boundingSphere) {
                    tentacle.geometry.computeBoundingSphere();
                  }

                  this.obstaclePartBoundingSphere.copy(tentacle.geometry.boundingSphere!);
                  this.obstaclePartBoundingSphere.applyMatrix4(tentacle.matrixWorld);

                  if (this.playerBoundingSphere.intersectsSphere(this.obstaclePartBoundingSphere)) {
                    hitDetected = true;
                    break;
                  }
                }
              }
            }
          }
          else if (obstacle.assetInstance instanceof ClamAsset) {
            // Check if the clam is open (dangerous)
            if (obstacle.assetInstance.isOpen) {
              const clamCollider = obstacle.assetInstance.getCollisionObject();
              clamCollider.updateMatrixWorld(true);

              if (!clamCollider.geometry.boundingSphere) {
                clamCollider.geometry.computeBoundingSphere();
              }

              this.obstaclePartBoundingSphere.copy(clamCollider.geometry.boundingSphere!);
              this.obstaclePartBoundingSphere.applyMatrix4(clamCollider.matrixWorld);

              if (this.playerBoundingSphere.intersectsSphere(this.obstaclePartBoundingSphere)) {
                hitDetected = true;
              }
            }
          }
          else if (obstacle.assetInstance instanceof SharkAsset) {
            // Sharks are always dangerous 
            if (obstacle.assetInstance.isDangerous()) {
              try {
                // Get collision object with enhanced error handling
                const sharkCollider = obstacle.assetInstance.getCollisionObject();
                
                // Verify that shark collider isn't undefined
                if (!sharkCollider) {
                  console.error("ERROR: SharkAsset.getCollisionObject() returned undefined");
                  
                  // Create a temporary collision sphere around the main mesh for this frame
                  const tempBox = new THREE.Box3().setFromObject(obstacle.mesh);
                  const tempSphere = new THREE.Sphere();
                  tempBox.getBoundingSphere(tempSphere);
                  
                  // Use the temp sphere for this collision check
                  this.obstaclePartBoundingSphere.copy(tempSphere);
                } else {
                  // Normal collision detection flow
                  sharkCollider.updateMatrixWorld(true);
                  
                  // Check if geometry exists
                  if (!sharkCollider.geometry) {
                    console.error("ERROR: SharkCollider has no geometry");
                    continue;
                  }

                  // Compute the bounding sphere if needed
                  if (!sharkCollider.geometry.boundingSphere) {
                    sharkCollider.geometry.computeBoundingSphere();
                  }
                  
                  // Check if bounding sphere exists and is valid
                  if (!sharkCollider.geometry.boundingSphere ||
                      isNaN(sharkCollider.geometry.boundingSphere.radius) ||
                      isNaN(sharkCollider.geometry.boundingSphere.center.x)) {
                    console.error("ERROR: Invalid bounding sphere in shark collider");
                    
                    // Create a temporary fallback sphere
                    const tempSphere = new THREE.Sphere(
                      new THREE.Vector3(
                        obstacle.mesh.position.x,
                        obstacle.mesh.position.y,
                        obstacle.mesh.position.z
                      ),
                      0.5 // Default radius
                    );
                    this.obstaclePartBoundingSphere.copy(tempSphere);
                  } else {
                    // Normal flow with valid bounding sphere
                    this.obstaclePartBoundingSphere.copy(sharkCollider.geometry.boundingSphere!);
                    this.obstaclePartBoundingSphere.applyMatrix4(sharkCollider.matrixWorld);
                  }
                }

                // Check for collision with the final bounding sphere
                if (this.playerBoundingSphere.intersectsSphere(this.obstaclePartBoundingSphere)) {
                  hitDetected = true;
                  console.log("Shark collision detected!");
                }
              } catch (error) {
                console.error("Error during shark collision detection:", error);
                // Continue to next obstacle - don't block gameplay on collision errors
              }
            }
          }
          else if (obstacle.assetInstance instanceof SeaTurtleAsset) {
            // Sea Turtles are always dangerous
            if (obstacle.assetInstance.isDangerous()) {
              const turtleCollider = obstacle.assetInstance.getCollisionObject();
              turtleCollider.updateMatrixWorld(true);

              if (!turtleCollider.geometry.boundingSphere) {
                turtleCollider.geometry.computeBoundingSphere();
              }

              this.obstaclePartBoundingSphere.copy(turtleCollider.geometry.boundingSphere!);
              this.obstaclePartBoundingSphere.applyMatrix4(turtleCollider.matrixWorld);

              if (this.playerBoundingSphere.intersectsSphere(this.obstaclePartBoundingSphere)) {
                hitDetected = true;
              }
            }
          }
          else if (obstacle.assetInstance instanceof KelpWallAsset) {
            // Kelp Walls are always dangerous if you hit them
            if (obstacle.assetInstance.isDangerous()) {
              try {
                const kelpCollider = obstacle.assetInstance.getCollisionObject();
                if (!kelpCollider) {
                  console.warn("Collision check failed: KelpWall returned undefined collider");
                  continue; // Skip this obstacle
                }
                
                // Log visibility state
                console.log(`KelpWall collision check - collider visible: ${kelpCollider.visible}, parent visible: ${kelpCollider.parent?.visible || false}`);
                
                // Ensure the collider and its parent are up to date
                if (kelpCollider.parent) {
                  kelpCollider.parent.updateMatrixWorld(true);
                }
                kelpCollider.updateMatrixWorld(true);
                
                // Ensure geometry exists
                if (!kelpCollider.geometry) {
                  console.warn("Collision check failed: KelpWall collider has no geometry");
                  continue; // Skip this obstacle
                }

                // Create or fix bounding sphere if needed
                if (!kelpCollider.geometry.boundingSphere) {
                  kelpCollider.geometry.computeBoundingSphere();
                }
                
                // Fix NaN values in bounding sphere
                if (!kelpCollider.geometry.boundingSphere || 
                    isNaN(kelpCollider.geometry.boundingSphere.radius) || 
                    isNaN(kelpCollider.geometry.boundingSphere.center.x) ||
                    isNaN(kelpCollider.geometry.boundingSphere.center.y) ||
                    isNaN(kelpCollider.geometry.boundingSphere.center.z)) {
                  
                  // Create a default bounding sphere with reasonable size
                  const config = configSystem.getObstaclesConfig()?.kelpWall;
                  const wallHeight = config?.baseScaleY || 3.5;
                  const laneWidth = configSystem.get('player')?.laneWidth || 2.0;
                  const segmentWidth = (config?.segmentWidthCoverage || 0.9) * laneWidth;
                  
                  // Create sphere that encompasses the whole wall
                  const radius = Math.sqrt((wallHeight/2) * (wallHeight/2) + (segmentWidth/2) * (segmentWidth/2));
                  
                  kelpCollider.geometry.boundingSphere = new THREE.Sphere(
                    new THREE.Vector3(0, wallHeight/2, 0), 
                    radius
                  );
                  console.warn("Fixed NaN bounding sphere in KelpWall with proper dimensions");
                }

                this.obstaclePartBoundingSphere.copy(kelpCollider.geometry.boundingSphere!);
                this.obstaclePartBoundingSphere.applyMatrix4(kelpCollider.matrixWorld);
                
                // Log collision sphere info for debugging
                console.log(`KelpWall collision sphere: center=[${this.obstaclePartBoundingSphere.center.x.toFixed(2)}, ${this.obstaclePartBoundingSphere.center.y.toFixed(2)}, ${this.obstaclePartBoundingSphere.center.z.toFixed(2)}], radius=${this.obstaclePartBoundingSphere.radius.toFixed(2)}`);
                console.log(`Player sphere: center=[${this.playerBoundingSphere.center.x.toFixed(2)}, ${this.playerBoundingSphere.center.y.toFixed(2)}, ${this.playerBoundingSphere.center.z.toFixed(2)}], radius=${this.playerBoundingSphere.radius.toFixed(2)}`);

                // Calculate and log the horizontal distance between player and kelp collision center
                const horizontalDistanceToPlayer = Math.abs(this.playerBoundingSphere.center.x - this.obstaclePartBoundingSphere.center.x);
                const laneWidth = configSystem.get('player')?.laneWidth || 2.0;
                
                console.log(`Horizontal distance to KelpWall: ${horizontalDistanceToPlayer.toFixed(2)} units (${(horizontalDistanceToPlayer / laneWidth).toFixed(2)} lane widths)`);

                if (this.playerBoundingSphere.intersectsSphere(this.obstaclePartBoundingSphere)) {
                  hitDetected = true;
                  console.log("KelpWall collision detected! Distance at collision: " + horizontalDistanceToPlayer.toFixed(2) + " units");
                }
              } catch (error) {
                console.warn("Error during KelpWall collision detection:", error);
                // Continue to next obstacle - don't block gameplay on collision errors
              }
              }
            }
          else if (obstacle.assetInstance instanceof SchoolOfFishAsset) {
            // School of Fish are always dangerous if you hit them
            if (obstacle.assetInstance.isDangerous()) {
              try {
                const schoolCollider = obstacle.assetInstance.getCollisionObject();
                if (!schoolCollider) {
                  console.warn("Collision check failed: SchoolOfFish returned undefined collider");
                  continue; // Skip this obstacle
                }
                
                schoolCollider.updateMatrixWorld(true);
                
                // Ensure geometry exists
                if (!schoolCollider.geometry) {
                  console.warn("Collision check failed: SchoolOfFish collider has no geometry");
                  continue; // Skip this obstacle
                }

                // Create or fix bounding sphere if needed
                if (!schoolCollider.geometry.boundingSphere) {
                  schoolCollider.geometry.computeBoundingSphere();
                }
                
                // Fix NaN values in bounding sphere
                if (!schoolCollider.geometry.boundingSphere || 
                    isNaN(schoolCollider.geometry.boundingSphere.radius) || 
                    isNaN(schoolCollider.geometry.boundingSphere.center.x) ||
                    isNaN(schoolCollider.geometry.boundingSphere.center.y) ||
                    isNaN(schoolCollider.geometry.boundingSphere.center.z)) {
                  
                  // Create a default bounding sphere
                  schoolCollider.geometry.boundingSphere = new THREE.Sphere(
                    new THREE.Vector3(0, 0, 0), 
                    1.0
                  );
                  console.warn("Fixed NaN bounding sphere in SchoolOfFish");
                }

                this.obstaclePartBoundingSphere.copy(schoolCollider.geometry.boundingSphere!);
                this.obstaclePartBoundingSphere.applyMatrix4(schoolCollider.matrixWorld);

                if (this.playerBoundingSphere.intersectsSphere(this.obstaclePartBoundingSphere)) {
                  hitDetected = true;
                }
              } catch (error) {
                console.warn("Error during SchoolOfFish collision detection:", error);
                // Continue to next obstacle - don't block gameplay on collision errors
              }
            }
          }
          else {
            // Handle simple obstacles (coral, rock) with standard collision spheres
            let collisionSphere;

            // Look for type-specific collision spheres
            if (obstacle.type === 'coral') {
              collisionSphere = obstacle.mesh.getObjectByName("CoralCollisionSphere");
            } else if (obstacle.type === 'rock') {
              collisionSphere = obstacle.mesh.getObjectByName("RockCollisionSphere");
            }

            if (collisionSphere) {
              // Use the explicit collision sphere if it exists
              collisionSphere.updateMatrixWorld(true);

              // Get the world position and scale of the collision sphere
              const worldPosition = new THREE.Vector3();
              worldPosition.setFromMatrixPosition(collisionSphere.matrixWorld);

              const worldScale = new THREE.Vector3();
              collisionSphere.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), worldScale);
              const worldRadius = collisionSphere.geometry.parameters.radius * Math.max(worldScale.x, worldScale.y, worldScale.z);

              // Set the obstacle bounding sphere
              this.obstacleBoundingSphere.center.copy(worldPosition);
              this.obstacleBoundingSphere.radius = worldRadius * configSystem.getObstacleRadiusFactor();
            } else {
              // Fallback to Box3 method
              this.tempBoxForObstacle.setFromObject(obstacle.mesh);
              this.tempBoxForObstacle.getBoundingSphere(this.obstacleBoundingSphere);
              this.obstacleBoundingSphere.radius *= configSystem.getObstacleRadiusFactor();
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

            // Check for intersection with player
            if (this.playerBoundingSphere.intersectsSphere(this.obstacleBoundingSphere)) {
              hitDetected = true;
            }
          }

          // If we detected a hit with this obstacle
          if (hitDetected) {
            console.log("Collision detected with obstacle:", obstacle.mesh.name || 'Unnamed');

            // Let ObstacleManager handle the hit and tell us if it was dangerous
            const wasDangerousHit = this.obstacleManager.handleObstacleHit(obstacle.mesh);

            if (wasDangerousHit) {
              // Only process player damage if the hit was dangerous
              const shouldGameOver = this.playerController.handleHit();
              if (shouldGameOver) {
                console.log("CollisionSystem: Signaling GAME OVER to GameEngine.");
                this.onPlayerKilled();
              }
            }

            // Break after first obstacle collision in a frame
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

    // --- Power-Up Collisions ---
    if (this.powerUpManager) {
      const powerUpMeshes = this.powerUpManager.getActivePowerUpMeshes();

      for (const powerUpMesh of powerUpMeshes) {
        if (powerUpMesh.visible && powerUpMesh.userData?.collider) {
          // Use a bounding sphere for the power-up
          const powerUpBoundingSphere = new THREE.Sphere();

          // Get the bounding sphere based on mesh position and size
          const tempBox = new THREE.Box3().setFromObject(powerUpMesh);
          tempBox.getBoundingSphere(powerUpBoundingSphere);

          // Check for intersection with player
          if (this.playerBoundingSphere.intersectsSphere(powerUpBoundingSphere)) {
            // Get the power-up asset that was hit directly from PowerUpManager
            const powerUpHit = this.powerUpManager.getVisualPowerUpAssetByMesh(powerUpMesh);

            if (powerUpHit) {
              // Handle power-up collection (note: onPowerUpCollected doesn't return a value)
              this.powerUpManager.onPowerUpCollected(powerUpHit);

              // Log the type from the mesh userData
              const powerUpType = powerUpHit.getMesh().userData.subtype;
              console.log(`CollisionDetectionSystem: Player collected ${powerUpType} power-up.`);
            }
          }
        }
      }
    }
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