# Decoration Implementation Plan

## 1. Problem: Decoration Creation Failures

Currently, the `DecorationModels.ts` file is not properly implementing the procedural geometries for the various decoration types. Instead, it's using placeholder implementations which lead to:
- Consecutive decoration failures
- Missing or invisible decorations
- Console errors about failed decoration creation

## 2. Files to Modify

1. `/src/game/entities/environment/DecorationModels.ts` - Primary target for implementing procedural geometries
2. `/src/game/entities/environment/DecorationFactory.ts` - Ensure proper factory methods call the static model methods
3. `/src/game/entities/environment/ProceduralEnvironment.ts` - Improve error handling in addDecorationsToSegment

## 3. Detailed Implementation Plan

### 3.1 DecorationModels.ts

We need to replace the placeholder implementations with actual procedural geometry creation. Each method should:
- Take a DecorationDefinition parameter for customization
- Create the geometry with proper procedural parameters
- Include error handling that returns a visible placeholder on failure
- Return a THREE.Group or THREE.Mesh that represents the decoration

#### Implementation Strategy:

1. Fix class naming conflict: `DecorationModels` is the correct class name, not `DecorationFactory` 

```typescript
export class DecorationModels {
  /* ... */
}
```

2. Implement each creation method using example code:

```typescript
// Example implementation for one method
static createCoral1(definition: DecorationDefinition): THREE.Group {
  try {
    const group = new THREE.Group();
    
    // Base shape with several branches
    const branchCount = 3 + Math.floor(Math.random() * 4); // 3-6 branches
    
    for (let i = 0; i < branchCount; i++) {
      const heightScale = 0.5 + Math.random() * 0.5;
      const geometry = new THREE.CylinderGeometry(0.05, 0.2, 1.0 * heightScale, 8);
      
      // Random coral colors
      const color = new THREE.Color(
        0.9 + Math.random() * 0.1, // High red
        0.3 + Math.random() * 0.3, // Medium green
        0.5 + Math.random() * 0.3  // Medium-high blue
      );
      
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.8,
        metalness: 0.2
      });
      
      const branch = new THREE.Mesh(geometry, material);
      
      // Position branch
      const angle = (i / branchCount) * Math.PI * 2;
      const radius = 0.2 + Math.random() * 0.2;
      
      branch.position.set(
        Math.cos(angle) * radius,
        heightScale * 0.5, // Half height
        Math.sin(angle) * radius
      );
      
      // Random rotation
      branch.rotation.set(
        (Math.random() - 0.5) * 0.5,
        0,
        (Math.random() - 0.5) * 0.5
      );
      
      group.add(branch);
    }
    
    // Apply scale with variation
    const scale = typeof definition.scale === 'number' ? definition.scale : definition.scale.x;
    const finalScale = scale * (1 + (Math.random() - 0.5) * definition.scaleVariance);
    group.scale.set(finalScale, finalScale, finalScale);
    
    // Apply random rotation
    group.rotation.y = Math.random() * definition.rotationVariance;
    
    return group;
  } catch (error) {
    console.error(`Error creating coral1: ${error}`);
    // Create a distinct, visible error placeholder
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // bright red
    const errorMesh = new THREE.Mesh(geometry, material);
    errorMesh.name = "error_placeholder_coral1";
    return errorMesh;
  }
}
```

3. Implement all remaining methods with similar error handling:
   - createCoral2
   - createBranchingCoral
   - createTubeCoral
   - createCoralCluster
   - createSeaweed1
   - createKelpStalk
   - createSeaGrass
   - createSeaAnemone
   - createGiantKelp
   - createRock (shared for rock1 and rock2)
   - createRockFormation
   - createCoralRock
   - etc.

### 3.2 DecorationFactory.ts

1. Fix `createUniqueDecoration` method to properly call into DecorationModels:

```typescript
private createUniqueDecoration(
  definition: DecorationDefinition,
  position: THREE.Vector3,
  theme: EnvironmentTheme
): THREE.Object3D {
  let decorationObj: THREE.Object3D;
  
  try {
    // First check if we have this in the cache
    const cached = this.decorationCache.get(definition.type);
    
    if (cached && cached.geometry && cached.material) {
      // Use cached geometry and material
      // ...existing code...
    } else {
      // Try to create the decoration using DecorationModels
      console.log(`Creating decoration: ${definition.type}`);
      decorationObj = DecorationModels.createDecoration(definition);
      
      // Cache for future use regardless of source
      if (decorationObj instanceof THREE.Mesh) {
        this.decorationCache.set(definition.type, {
          geometry: decorationObj.geometry?.clone(),
          material: decorationObj.material
        });
      }
    }
    
    // Apply decorative variations
    this.applyVariations(decorationObj, definition, theme);
    
    // Position decoration
    const finalPosition = position.clone();
    finalPosition.y += definition.yOffset;
    decorationObj.position.copy(finalPosition);
    
    return decorationObj;
  } catch (error) {
    console.warn(`Error creating decoration ${definition.type}: ${error}`);
    
    // Create placeholder with proper error feedback
    const errorPlaceholder = this.createPlaceholderDecoration(definition.type);
    errorPlaceholder.position.copy(position.clone().add(new THREE.Vector3(0, definition.yOffset, 0)));
    return errorPlaceholder;
  }
}
```

### 3.3 ProceduralEnvironment.ts - Improve addDecorationsToSegment

Enhance the error handling and consecutive failures logic:

```typescript
private addDecorationsToSegment(segment: EnvironmentSegment): void {
  try {
    // ... existing code to get availableDecorations ...
    
    // Track successful decorations to limit retries
    let successfulDecorations = 0;
    const MAX_CONSECUTIVE_FAILURES = 5;
    let consecutiveFailures = 0;
    
    // Create decorations with improved error handling
    for (let i = 0; i < maxDecorations; i++) {
      // Break out if we've had too many consecutive failures
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.warn(`Reached maximum consecutive decoration failures (${MAX_CONSECUTIVE_FAILURES}), stopping decoration creation for this segment`);
        break;
      }
      
      try {
        // ... existing code to select decoration type ...
        
        // Create decoration at position
        const position = new THREE.Vector3(x, 0, z);
        
        console.log(`Creating decoration: ${selectedDecoration.type} at position (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);
        
        // Use decoration factory to create the decoration
        const decoration = this.decorationFactory.createDecoration(
          selectedDecoration,
          position,
          this.currentTheme
        );
        
        // Add to segment if created and valid
        if (decoration) {
          const isValidPosition = !isNaN(decoration.position.x) && 
                                !isNaN(decoration.position.y) && 
                                !isNaN(decoration.position.z);
                                
          if (isValidPosition) {
            segment.decorations.add(decoration);
            successfulDecorations++;
            consecutiveFailures = 0; // Reset failure counter on success
          } else {
            console.warn(`Invalid decoration position: ${decoration.position.x}, ${decoration.position.y}, ${decoration.position.z}`);
            consecutiveFailures++;
          }
        } else {
          console.warn(`Failed to create decoration of type ${selectedDecoration.type}`);
          consecutiveFailures++;
        }
      } catch (decorationError) {
        // Log but continue - we want to be robust against single decoration failures
        console.warn(`Error creating decoration ${selectedDecoration?.type}: ${decorationError}`);
        consecutiveFailures++;
        continue;
      }
    }
    
    console.log(`Segment decoration complete: ${successfulDecorations} decorations added.`);
  } catch (error) {
    console.error(`Critical error adding decorations to segment: ${error}`);
  }
}
```

## 4. Testing Strategy

1. **Incremental Testing**:
   - Implement one decoration type at a time 
   - Test each implementation before moving to the next
   - Use console.log to track decoration creation and failures

2. **Error Validation**:
   - Verify that error placeholders are visible and identifiable
   - Ensure errors are properly logged to console
   - Check that consecutiveFailures counting works correctly

3. **Performance Checking**:
   - Verify decoration creation doesn't cause significant frame drops
   - Monitor memory usage with large numbers of decorations
   - Ensure decorations are properly recycled/disposed

## 5. Expected Outcome

1. All decoration types should generate visually appropriate models
2. Any failures should result in clearly visible error placeholders
3. The "Reached maximum consecutive decoration failures" warning should be eliminated
4. Performance should remain stable with many decorations present