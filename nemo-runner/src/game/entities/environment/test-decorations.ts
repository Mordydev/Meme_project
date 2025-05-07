import * as THREE from 'three';
import { DecorationModels } from './DecorationModels';
import { DecorationDefinition } from './DecorationDefinitions';

/**
 * Test function to verify decoration creation is working properly
 * This can be run in a browser environment to test decorations before integrating
 */
export function testDecorationRendering() {
  // Create a test scene
  const scene = new THREE.Scene();
  
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  
  // Create a camera
  const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000
  );
  camera.position.set(0, 5, 15);
  camera.lookAt(0, 0, 0);
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0x404040, 1);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 10, 5);
  scene.add(directionalLight);
  
  // Create a grid helper
  const gridHelper = new THREE.GridHelper(20, 20);
  scene.add(gridHelper);
  
  // Define test decoration types
  const testDecorations: Array<{type: string, def: DecorationDefinition}> = [
    {
      type: 'coral1',
      def: {
        type: 'coral1',
        scale: 1.0,
        yOffset: 0,
        rotationVariance: Math.PI * 2,
        scaleVariance: 0.3,
        canFloatAboveGround: false,
        environmentTypes: ['reef'],
        probability: 1.0
      }
    },
    {
      type: 'coral2', 
      def: {
        type: 'coral2',
        scale: 1.0,
        yOffset: 0,
        rotationVariance: Math.PI * 2,
        scaleVariance: 0.3,
        canFloatAboveGround: false,
        environmentTypes: ['reef'],
        probability: 1.0
      }
    },
    {
      type: 'branchingCoral',
      def: {
        type: 'branchingCoral',
        scale: 1.0,
        yOffset: 0,
        rotationVariance: Math.PI * 2,
        scaleVariance: 0.3,
        canFloatAboveGround: false,
        environmentTypes: ['reef'],
        probability: 1.0
      }
    },
    {
      type: 'tubeCoral',
      def: {
        type: 'tubeCoral',
        scale: 1.0,
        yOffset: 0,
        rotationVariance: Math.PI * 2,
        scaleVariance: 0.3,
        canFloatAboveGround: false,
        environmentTypes: ['reef'],
        probability: 1.0
      }
    },
    {
      type: 'coralCluster',
      def: {
        type: 'coralCluster',
        scale: 1.0,
        yOffset: 0,
        rotationVariance: Math.PI * 2,
        scaleVariance: 0.3,
        canFloatAboveGround: false,
        environmentTypes: ['reef'],
        probability: 1.0
      }
    },
    {
      type: 'seaweed1',
      def: {
        type: 'seaweed1',
        scale: 1.0,
        yOffset: 0,
        rotationVariance: Math.PI * 2,
        scaleVariance: 0.3,
        canFloatAboveGround: false,
        environmentTypes: ['reef'],
        probability: 1.0
      }
    },
    {
      type: 'kelpStalk',
      def: {
        type: 'kelpStalk',
        scale: 1.0,
        yOffset: 0,
        rotationVariance: Math.PI * 2,
        scaleVariance: 0.3,
        canFloatAboveGround: false,
        environmentTypes: ['kelpForest'],
        probability: 1.0
      }
    },
    {
      type: 'seaGrass',
      def: {
        type: 'seaGrass',
        scale: 1.0,
        yOffset: 0,
        rotationVariance: Math.PI * 2,
        scaleVariance: 0.3,
        canFloatAboveGround: false,
        environmentTypes: ['reef'],
        probability: 1.0
      }
    },
    {
      type: 'seaAnemone',
      def: {
        type: 'seaAnemone',
        scale: 1.0,
        yOffset: 0,
        rotationVariance: Math.PI * 2,
        scaleVariance: 0.3,
        canFloatAboveGround: false,
        environmentTypes: ['reef'],
        probability: 1.0
      }
    },
    {
      type: 'rock1',
      def: {
        type: 'rock1',
        scale: 1.0,
        yOffset: 0,
        rotationVariance: Math.PI * 2,
        scaleVariance: 0.3,
        canFloatAboveGround: false,
        environmentTypes: ['reef', 'kelpForest', 'deepSea'],
        probability: 1.0
      }
    },
    {
      type: 'rock2',
      def: {
        type: 'rock2',
        scale: 1.0,
        yOffset: 0,
        rotationVariance: Math.PI * 2,
        scaleVariance: 0.3,
        canFloatAboveGround: false,
        environmentTypes: ['reef', 'kelpForest', 'deepSea'],
        probability: 1.0
      }
    },
    {
      type: 'rockFormation',
      def: {
        type: 'rockFormation',
        scale: 1.0,
        yOffset: 0,
        rotationVariance: Math.PI * 2,
        scaleVariance: 0.3,
        canFloatAboveGround: false,
        environmentTypes: ['reef', 'kelpForest', 'deepSea'],
        probability: 1.0
      }
    }
  ];
  
  // Create decorations in a grid
  const spacing = 5;
  const columns = 4;
  
  for (let i = 0; i < testDecorations.length; i++) {
    try {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      const position = new THREE.Vector3(
        (col - (columns/2)) * spacing,
        0,
        row * spacing - 5
      );
      
      // Create decoration
      const decoration = DecorationModels.createDecoration(testDecorations[i].def);
      decoration.position.copy(position);
      
      // Add to scene
      scene.add(decoration);
      
      // Add label
      addLabel(testDecorations[i].type, position, scene);
      
      console.log(`Created decoration: ${testDecorations[i].type}`);
    } catch (error) {
      console.error(`Error creating decoration ${testDecorations[i].type}:`, error);
    }
  }
  
  // Create orbit controls for interactivity
  const controls = createOrbitControls(camera, renderer.domElement);
  
  // Render loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  
  animate();
  
  // Return cleanup function
  return () => {
    renderer.dispose();
    document.body.removeChild(renderer.domElement);
  };
}

/**
 * Add a text label for a decoration
 * Note: This requires Three.js's TextGeometry which depends on FontLoader
 */
function addLabel(text: string, position: THREE.Vector3, scene: THREE.Scene) {
  // For simplicity, we're using a sprite with canvas-based text
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (context) {
    canvas.width = 256;
    canvas.height = 64;
    
    // Draw text on canvas
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = '24px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Create sprite with canvas texture
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    
    // Position label above decoration
    sprite.position.copy(position);
    sprite.position.y += 2;
    sprite.scale.set(2, 0.5, 1);
    
    scene.add(sprite);
  }
}

/**
 * Create orbit controls (assuming OrbitControls is available)
 * Note: This requires Three.js's OrbitControls which is not included in core
 */
function createOrbitControls(camera: THREE.Camera, domElement: HTMLElement): any {
  // This is a minimal implementation - in a real app, import OrbitControls
  const controls = {
    update: () => {}
  };
  
  // Basic keyboard controls for testing
  let cameraDistance = 15;
  let cameraAngle = 0;
  let cameraHeight = 5;
  
  document.addEventListener('keydown', (event) => {
    const stepSize = 0.5;
    
    switch (event.key) {
      case 'ArrowLeft':
        cameraAngle -= 0.05;
        break;
      case 'ArrowRight':
        cameraAngle += 0.05;
        break;
      case 'ArrowUp':
        cameraHeight += stepSize;
        break;
      case 'ArrowDown':
        cameraHeight -= stepSize;
        break;
      case '+':
      case '=':
        cameraDistance -= stepSize;
        break;
      case '-':
      case '_':
        cameraDistance += stepSize;
        break;
    }
    
    // Update camera position
    camera.position.x = Math.sin(cameraAngle) * cameraDistance;
    camera.position.z = Math.cos(cameraAngle) * cameraDistance;
    camera.position.y = cameraHeight;
    camera.lookAt(0, 0, 0);
  });
  
  return controls;
}

// Export for auto-initialization
if (typeof window !== 'undefined') {
  (window as any).testDecorations = function() {
    testDecorationRendering();
  };
}