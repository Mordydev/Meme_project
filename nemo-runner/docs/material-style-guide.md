# Material Style Guide for Nemo Game Assets

## Overview

This document provides guidelines for creating consistent, visually appealing materials across all game assets. Following these guidelines will ensure a cohesive Pixar-inspired underwater visual style.

## Material Standards

### Primary Material Type
- **Standard**: All visible meshes must use `THREE.MeshStandardMaterial`
- **Exception**: Collision meshes should use `THREE.MeshBasicMaterial` with `visible: false`

### Base Properties

Each material type should follow these general guidelines:

#### Fish and Creatures

| Property | Value Range | Notes |
|----------|-------------|-------|
| roughness | 0.2 - 0.4 | Lower values for scales, higher for skin |
| metalness | 0.4 - 0.8 | Higher values for shimmering scales |
| emissiveIntensity | 0.1 - 0.3 | Subtle glow for underwater feel |
| clearcoat | 0.3 - 0.5 | For wet appearance |
| clearcoatRoughness | 0.2 - 0.4 | Slightly rough clearcoat |

#### Rocks, Coral, Seafloor

| Property | Value Range | Notes |
|----------|-------------|-------|
| roughness | 0.7 - 0.9 | Higher for rough surfaces |
| metalness | 0.0 - 0.2 | Low metalness for stone |
| emissiveIntensity | 0.05 - 0.15 | Very subtle glow |
| clearcoat | 0.1 - 0.3 | Slight wetness |
| clearcoatRoughness | 0.6 - 0.8 | Rough clearcoat |

#### Shells, Pearls, Hard Surfaces

| Property | Value Range | Notes |
|----------|-------------|-------|
| roughness | 0.1 - 0.6 | Lower for smooth shells, higher for textured |
| metalness | 0.3 - 0.7 | Medium to high for pearlescent look |
| emissiveIntensity | 0.1 - 0.2 | Subtle glow |
| clearcoat | 0.5 - 0.9 | Strong clearcoat for shine |
| clearcoatRoughness | 0.1 - 0.3 | Smooth clearcoat |

#### Plants (Kelp, Seaweed)

| Property | Value Range | Notes |
|----------|-------------|-------|
| roughness | 0.5 - 0.7 | Medium roughness |
| metalness | 0.0 - 0.3 | Low metalness |
| emissiveIntensity | 0.1 - 0.2 | Slight glow effect |
| clearcoat | 0.2 - 0.4 | Moderate clearcoat |
| clearcoatRoughness | 0.3 - 0.6 | Medium clearcoat roughness |

### Color Palette

#### Primary Palette

| Element | Base Colors | Accent Colors | Notes |
|---------|-------------|---------------|-------|
| Fish | 0xC0C0C0, 0xADD8E6, 0xFFD700 | 0xE6E6FA, 0x87CEEB | Silver, light blue, gold with purple/sky accents |
| Coral | 0xFF7F50, 0xFFDAB9, 0xFA8072 | 0xFFE4C4, 0xF08080 | Coral, peach, salmon with bisque/light red accents |
| Plants | 0x008000, 0x556B2F, 0x8FBC8F | 0x6B8E23, 0x2E8B57 | Green shades with olive and sea green accents |
| Rocks | 0x808080, 0x696969, 0x778899 | 0xA9A9A9, 0x708090 | Gray shades with light slate accents |
| Shells | 0xE0D1B0, 0xFFE4C4, 0xF5DEB3 | 0xDEB887, 0xD2B48C | Beige, bisque, wheat with burlywood/tan accents |

#### Emissive Colors

| Element | Emissive Color | Notes |
|---------|----------------|-------|
| Fish | Base color * 0.7 | Slightly dimmer than base color |
| Jellyfish | 0xE6E6FA, 0xADD8E6 | Glowing purple/blue for translucent parts |
| Coral | 0xFF6347 * 0.3 | Soft red glow |
| Pufferfish Spikes | 0xFF4500 | Bright red-orange when dangerous |
| Pearls | 0xFFFFFF | Pure white glow |

### Pixar-Style Characteristics

For the Pixar look, materials should have:

1. **Exaggerated Specular** - Slightly higher shininess than reality
2. **Subtly Saturated Colors** - Colors more vibrant than reality but not cartoonish
3. **Soft Highlights** - Large, soft specular highlights
4. **Edge Highlighting** - Subtle rim lighting effect
5. **Balanced Texturing** - Detailed but not noisy

## Implementation Examples

### Fish Material (Clownfish)

```typescript
// Example material for clownfish character
const clownfishMaterial = new THREE.MeshStandardMaterial({
  color: 0xFF7F00,          // Bright orange
  roughness: 0.3,           // Fairly smooth
  metalness: 0.5,           // Medium shine for scales
  emissive: 0xFF7F00,       // Same as base color
  emissiveIntensity: 0.2,   // Subtle glow
  clearcoat: 0.4,           // Moderate wet look
  clearcoatRoughness: 0.25  // Fairly smooth coating
});
```

### Coral Material

```typescript
// Example material for coral
const coralMaterial = new THREE.MeshStandardMaterial({
  color: 0xFF6347,          // Tomato red
  roughness: 0.7,           // Rough surface
  metalness: 0.1,           // Low metalness
  emissive: 0xFF6347,       // Same as base color
  emissiveIntensity: 0.15,  // Very subtle glow
  clearcoat: 0.2,           // Slight wet look
  clearcoatRoughness: 0.6   // Rough coating
});
```

## Best Practices

1. **Material Consistency**
   - Use consistent property ranges for similar objects
   - Match material properties to the nature of the object

2. **Performance Considerations**
   - Only use special features like clearcoat on prominent objects
   - Consider using simplified materials for distant or small objects

3. **Creating Variations**
   - Use color variations rather than entirely different materials
   - Slight property adjustments (±0.1) for variety without breaking consistency

4. **Testing**
   - Always test materials under the game's lighting conditions
   - Verify materials look good from typical camera distances

5. **Fallbacks**
   - Fallback materials should follow the same style guide
   - Simplify properties but maintain the same visual character

## Reference Materials

Use these assets as reference implementations:
- `ClamAsset.ts` - Good example of shell and pearl materials
- `SchoolOfFishAsset.ts` - Good example of fish materials
- `SeaTurtleAsset.ts` - Good example of creature skin and shell materials