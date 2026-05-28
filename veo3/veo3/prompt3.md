# Prompt 3: Visual Excellence & Cinematic Design

## Your Mission
Transform scripts into precise visual specifications using professional cinematography language. Create shot-by-shot visual blueprints with exact technical parameters for consistent, cinematic results.

## Why Visual Precision Matters
Veo 3 excels at understanding professional cinematography language. The more precise your visual specifications, the more reliable and cinematic your results. This prompt focuses on:
- Leveraging Veo 3's strength in lighting and physics simulation
- Creating platform-optimized visual compositions
- Ensuring character visual consistency across all beats
- Building viral-worthy visual hooks and moments

## Critical Character Consistency Rule
**NEVER use shortcuts like "same character as beat 1"**
- Every beat MUST include complete character description
- Specify gender (male/female) and exact age in every beat
- Copy the EXACT visual description word-for-word
- This ensures Veo 3 maintains character consistency

## Technical Specification Framework

### 1. CAMERA SPECIFICATIONS

```
CAMERA_SETUP = {
  "lens_options": {
    "24mm": {"fov": "84°", "use": "wide establishing", "distortion": "moderate"},
    "35mm": {"fov": "63°", "use": "environmental portrait", "distortion": "minimal"},
    "50mm": {"fov": "47°", "use": "natural perspective", "distortion": "none"},
    "85mm": {"fov": "28°", "use": "portrait/isolation", "distortion": "none"}
  },
  "aperture": {
    "f/1.4": "extreme shallow DOF",
    "f/2.8": "moderate shallow DOF",
    "f/5.6": "balanced DOF",
    "f/8": "deep focus"
  },
  "movement_precision": {
    "static": "locked position",
    "dolly_in": "[X]cm over [Y]s, ease-in-out",
    "track": "parallel [X]cm over [Y]s",
    "crane": "vertical [X]cm over [Y]s",
    "pan": "[X]° over [Y]s, smooth"
  }
}
```

### 2. LIGHTING PRECISION MAP

```
LIGHTING_SETUP = {
  "key_light": {
    "type": "soft/hard",
    "temperature": "3200K",
    "position": "45° camera left, 30° elevation",
    "intensity": "100%",
    "distance": "2m",
    "modifier": "4x4 diffusion"
  },
  "fill_light": {
    "type": "bounce/direct",
    "temperature": "5600K",
    "position": "-30° camera right",
    "intensity": "25%",
    "ratio": "4:1 to key"
  },
  "rim_light": {
    "temperature": "6500K",
    "position": "behind subject 45°",
    "intensity": "150%",
    "purpose": "separation"
  },
  "practicals": [
    {"source": "window", "temp": "5600K", "motivated": true},
    {"source": "desk lamp", "temp": "2700K", "visible": true}
  ]
}
```

### 3. COLOR SCIENCE

```
COLOR_PALETTE = {
  "primary": {
    "hero": "#E85D3A",
    "support": "#3A7CA5",
    "accent": "#F5C542"
  },
  "skin_tones": {
    "base": "#D4A574",
    "shadows": "#8B6947",
    "highlights": "#F5DEB3"
  },
  "environment": {
    "walls": "#F5F5F0",
    "shadows": "#4A4A48",
    "atmosphere": "#E6E6FA10"
  },
  "grade": {
    "look": "cinematic warm",
    "contrast": "1.2",
    "saturation": "0.85",
    "tint": "+5 magenta"
  }
}
```

### 4. SHOT COMPOSITION MATRIX

```
COMPOSITION_RULES = {
  "framing": {
    "rule_of_thirds": {
      "subject_position": "left third vertical",
      "eye_line": "top third horizontal"
    },
    "headroom": "10% frame height",
    "lead_room": "60/40 split"
  },
  "depth_layers": {
    "foreground": "out-of-focus element 20% frame",
    "midground": "sharp subject",
    "background": "soft 2-stop under"
  },
  "aspect_considerations": {
    "16:9": "full frame",
    "9:16_safe": "center 60% critical action",
    "1:1_safe": "center square critical"
  }
}
```

## Character Description Examples (CRITICAL FOR CONSISTENCY)

### CORRECT: Complete Character Descriptions in Every Beat
```json
{
  "beat_1": {
    "character": "Sarah Chen, 28-year-old female, shoulder-length black hair in loose waves, wearing navy blazer over white button-down shirt, dark wash jeans, silver watch on left wrist, natural makeup with subtle brown eyeliner",
    "shot": "medium close-up at office desk"
  },
  "beat_2": {
    "character": "Sarah Chen, 28-year-old female, shoulder-length black hair in loose waves, wearing navy blazer over white button-down shirt, dark wash jeans, silver watch on left wrist, natural makeup with subtle brown eyeliner",
    "shot": "wide shot standing by window"
  },
  "beat_3": {
    "character": "Sarah Chen, 28-year-old female, shoulder-length black hair in loose waves, wearing navy blazer over white button-down shirt, dark wash jeans, silver watch on left wrist, natural makeup with subtle brown eyeliner", 
    "shot": "close-up reaction shot"
  }
}
```

### WRONG: Shortcuts That Break Consistency
```json
{
  "beat_1": {
    "character": "Sarah Chen, 28-year-old female, shoulder-length black hair...",
    "shot": "medium close-up"
  },
  "beat_2": {
    "character": "same character as beat 1", ← THIS BREAKS CONSISTENCY
    "shot": "wide shot"
  },
  "beat_3": {
    "character": "Sarah from previous beats", ← THIS ALSO BREAKS CONSISTENCY
    "shot": "close-up"
  }
}
```

## Material Physics & Particle Systems (NEW)

### ADVANCED MATERIAL BEHAVIORS
```json
{
  "particle_systems": {
    "nano_particles": {
      "behavior": "swirl in elegant spirals around subject",
      "physics": "zero gravity drift, magnetic attraction to convergence point",
      "visual_properties": "metallic shimmer, 2-3mm diameter, subtle glow trails",
      "formation_pattern": "random scatter → spiral convergence → precise assembly"
    },
    "liquid_light": {
      "behavior": "flows like mercury with ripple effects",
      "physics": "surface tension, gravity-affected pooling, energy discharge",
      "visual_properties": "mirror-like reflections, volumetric glow, color temperature shifts",
      "transformation_capability": "morphs from liquid to solid forms"
    },
    "energy_bursts": {
      "behavior": "volumetric expansion with particle trails",
      "physics": "explosive force diminishing over distance, particle scatter patterns",
      "visual_properties": "bright core fading to particle edges, lens flare effects",
      "timing": "instant peak followed by 2-3 second particle dissipation"
    },
    "silk_fabrics": {
      "behavior": "fluid dynamics with wind-affected movement",
      "physics": "gravity draping, air resistance, momentum conservation",
      "visual_properties": "subtle transparency, texture detail, natural flowing motion",
      "environmental_response": "reacts to air currents and object proximity"
    }
  }
}
```

### SURFACE PROPERTY SPECIFICATIONS
```json
{
  "surface_materials": {
    "brushed_titanium": {
      "reflection_pattern": "linear directional highlights",
      "surface_roughness": "micro-scratches visible in macro shots",
      "color_properties": "cool grey base with warm highlights",
      "interaction_with_light": "sharp specular highlights, soft diffuse base"
    },
    "liquid_metal": {
      "reflection_behavior": "perfect mirror surface with distortion",
      "surface_dynamics": "ripples from contact, gravity pooling",
      "color_shifting": "environmental reflections dominant",
      "formation_properties": "flows into precise geometric shapes"
    },
    "glass_interactions": {
      "condensation_physics": "droplet formation follows temperature gradient",
      "transparency_behavior": "index of refraction creates realistic distortion",
      "reflection_layering": "surface reflection + internal refraction",
      "impact_response": "stress patterns, crack propagation if damaged"
    },
    "fabric_physics": {
      "draping_behavior": "follows gravity with natural folds",
      "wind_response": "amplitude based on fabric weight and air velocity",
      "texture_detail": "weave pattern visible in close-ups",
      "movement_momentum": "realistic inertia and settling patterns"
    }
  }
}
```

## Enhanced Camera Choreography (NEW)

### PRECISION MOVEMENT SPECIFICATIONS
```json
{
  "advanced_camera_patterns": {
    "macro_to_wide_choreography": {
      "stage_1": {
        "timing": "0.0-1.5s",
        "lens": "100mm macro f/2.8",
        "distance": "15cm from subject detail",
        "focus": "shallow DOF, 2cm focus plane",
        "movement": "static, locked position"
      },
      "stage_2": {
        "timing": "1.5-4.0s", 
        "lens": "smooth zoom to 50mm f/4",
        "distance": "dolly out from 15cm to 80cm",
        "focus": "rack focus from macro to medium shot",
        "movement": "30° orbital motion while dollying"
      },
      "stage_3": {
        "timing": "4.0-6.5s",
        "lens": "continue to 35mm f/5.6",
        "distance": "final position 2m from subject",
        "focus": "deep focus capturing transformation",
        "movement": "complete 60° orbit for reveal"
      },
      "stage_4": {
        "timing": "6.5-8.0s",
        "lens": "24mm f/8 for hero shot",
        "distance": "2.5m final position",
        "focus": "hyperfocal distance, everything sharp",
        "movement": "settle to static frame"
      }
    },
    "transformation_orbit": {
      "radius_precision": "1.5m constant radius around subject center",
      "height_variation": "sine wave pattern, 20cm amplitude over 4 seconds",
      "speed_modulation": "start 5°/sec, peak 15°/sec during transformation, end 3°/sec",
      "focus_tracking": "subject locked to center frame throughout movement",
      "stabilization": "gimbal smoothing, no shake artifacts"
    },
    "energy_release_dolly": {
      "approach_timing": "5 seconds for dolly movement",
      "distance_precision": "2.5m to 1.5m approach distance",
      "acceleration_curve": "ease-in first 2s, linear middle 1s, ease-out final 2s",
      "transformation_sync": "peak transformation at 4.0s during approach",
      "final_hold": "static hero shot final 3 seconds"
    }
  }
}
```

### LIGHTING EVOLUTION DURING TRANSFORMATION
```json
{
  "dynamic_lighting_sequences": {
    "logo_reveal_lighting": {
      "stage_1": "single key light 45° camera left, dramatic 8:1 ratio",
      "stage_2": "add particle glow sources, key reduces to 4:1 ratio",
      "stage_3": "environmental lights fade in, balanced 2:1 ratio",
      "stage_4": "final product lighting, soft wrap-around 1.5:1 ratio"
    },
    "energy_burst_lighting": {
      "pre_burst": "low ambient, single motivated source",
      "burst_peak": "volumetric explosion, overexposed center core",
      "particle_phase": "multiple particle sources, dynamic shadows",
      "stabilization": "return to motivated environmental lighting"
    },
    "environment_morph_lighting": {
      "initial_state": "realistic location lighting",
      "transition_energy": "supernatural glow overlays",
      "transformation_peak": "stylized fantasy lighting",
      "final_environment": "new location appropriate lighting"
    }
  }
}
```

## Beat-by-Beat Visual Design

### TRANSFORMATION BEAT BLUEPRINT (NEW)

```json
{
  "logo_transformation_beat": {
    "shot_id": "001T",
    "project_keywords": ["16:9", "premium aesthetic", "fluid assembly", "elegant motion", "soft lighting", "no hard cuts", "calm luxury"],
    "transformation_type": "logo_to_product",
    "timing_breakdown": {
      "0.0-1.5s": {
        "visual": "Apple logo floating in soft gradient void, brushed titanium surface with micro-scratch details",
        "camera": "100mm macro, f/2.8, 15cm distance, static lock",
        "lighting": "single key 3200K at 45°, dramatic rim light",
        "material_focus": "surface texture detail, edge precision"
      },
      "1.5-3.0s": {
        "visual": "Logo edges dissolve into nano-particles, metallic shimmer with glow trails",
        "camera": "zoom to 50mm while dollying out, 30° orbital begins",
        "lighting": "particle sources add to key, ratio softens to 4:1",
        "physics": "particles follow spiral convergence pattern"
      },
      "3.0-5.5s": {
        "visual": "Particles reform into Apple Watch Ultra, rotation reveals all surfaces",
        "camera": "continue zoom to 35mm, complete orbital motion",
        "lighting": "environmental lights fade in, balanced illumination",
        "material_transition": "liquid metal → solid titanium formation"
      },
      "5.5-8.0s": {
        "visual": "Watch screen activates with ripple effect, environment fully formed",
        "camera": "final 24mm hero shot, 2.5m distance, static hold",
        "lighting": "soft wrap-around lighting, screen glow accent",
        "final_composition": "product center frame, perfect environmental context"
      }
    }
  }
}
```

### CHARACTER-BASED BEAT BLUEPRINT (ENHANCED)

```json
{
  "beat_1_visual": {
    "shot_id": "001A",
    "shot_description": "medium close-up discovery",
    "character_full_description": "Marcus Rivera, 35-year-old male, short dark beard, wearing blue NASA t-shirt and dark jeans, athletic build, warm smile with slight gap between front teeth",
    "project_keywords": ["16:9", "authentic documentary", "natural lighting", "character focus", "emotional journey"],
    "technical": {
      "camera": {
        "lens": "50mm",
        "aperture": "f/2.8", 
        "position": "eye level 150cm",
        "movement": "slow push-in 30cm over 6s"
      },
      "focus": {
        "subject": "character face",
      "depth": "0.5m range",
      "rack": "none"
    }
  },
  "lighting": {
    "setup": "3-point motivated",
    "key": "window left 3200K, 4:1 ratio",
    "fill": "bounce card right",
    "rim": "5600K separation",
    "atmosphere": "light haze 10%"
  },
  "composition": {
    "framing": "MCU chest up",
    "rule": "left third placement",
    "background": "2-stop under, bokeh",
    "foreground": "clean"
  },
  "color": {
    "dominant": "#3A7CA5",
    "accent": "#E85D3A",
    "skin": "#D4A574",
    "grade": "slight cool push shadows"
  },
  "environment": {
    "location": "modern office",
    "props": ["laptop", "coffee cup", "papers"],
    "atmosphere": "afternoon light"
  },
  "motion": {
    "subject": "turns from screen to camera",
    "timing": "turn at 0:02",
    "secondary": "hair settles 0:03"
  }
}
```

### MULTI-SCENE VISUAL VARIATION

```
COMPILATION_VISUALS = {
  "beat_1_news": {
    "shot": "medium studio",
    "lens": "35mm f/5.6",
    "lighting": "broadcast 3-point",
    "color": "neutral broadcast"
  },
  "beat_2_street": {
    "shot": "handheld medium",
    "lens": "24mm f/2.8",
    "lighting": "natural daylight",
    "color": "documentary real"
  },
  "beat_3_office": {
    "shot": "static medium",
    "lens": "50mm f/4",
    "lighting": "fluorescent top",
    "color": "corporate cool"
  }
}
```

### ANIMATION VISUAL STYLE

```
ANIMATION_VISUAL = {
  "style_reference": "pixar_contemporary",
  "design": {
    "shapes": "rounded appealing",
    "proportions": "slightly exaggerated",
    "textures": "tactile materials"
  },
  "lighting": {
    "approach": "motivated stylized",
    "key": "warm wrap-around",
    "rim": "strong separation",
    "subsurface": "skin scatter"
  },
  "camera": {
    "lens_simulation": "35mm equivalent",
    "dof": "shallow artistic",
    "movement": "smooth spline"
  },
  "color": {
    "saturation": "120% vibrant",
    "palette": "complementary",
    "mood": "warm inviting"
  }
}
```

## Environmental Design System

```
ENVIRONMENT_SPECS = {
  "location_details": {
    "architecture": "[modern/classic/industrial]",
    "scale": "[intimate/normal/vast]",
    "condition": "[pristine/lived-in/distressed]"
  },
  "atmospheric": {
    "particles": {
      "dust": "density 5%, catch light",
      "haze": "10% fill, depth cue"
    },
    "weather": {
      "condition": "[clear/overcast/rain]",
      "effect": "on windows/surfaces"
    }
  },
  "props": {
    "hero_props": ["specific items character interacts with"],
    "dressing": ["background items for realism"],
    "story_props": ["items that support narrative"]
  }
}
```

## Character Visual Consistency

```
CHARACTER_VISUAL_LOCK = {
  "character_id": "CHAR001_EXACT",
  "appearance_constants": {
    "hair": {
      "style": "shoulder-length waves",
      "color": "#4A3829",
      "condition": "slightly messy"
    },
    "wardrobe": {
      "top": "navy blazer over white shirt",
      "bottom": "dark jeans",
      "accessories": "silver watch left wrist"
    },
    "makeup": {
      "style": "natural professional",
      "specifics": "subtle brown liner"
    }
  },
  "continuity_notes": {
    "beat_1": "hair behind ear right side",
    "beat_2": "hair falls forward",
    "beat_3": "tucked back again"
  }
}
```

## Visual Effects Integration

```
VFX_PLANNING = {
  "in_camera": {
    "practical": ["real props", "lighting effects"],
    "physics": ["natural movement", "gravity"],
    "atmosphere": ["haze", "particles"]
  },
  "post_enhance": {
    "color_grade": "specific LUT",
    "cleanup": "minimal needed",
    "compositing": "if required"
  },
  "avoid": {
    "complex_cg": "beyond veo3 scope",
    "rotoscoping": "heavy manual work",
    "tracking": "3D integration"
  }
}
```

## Platform Visual Optimization

```
PLATFORM_VISUAL_SPECS = {
  "youtube_16x9": {
    "safe_area": "full frame",
    "thumbnail": "frame at 0:02",
    "quality": "maximum"
  },
  "tiktok_9x16": {
    "safe_area": "center 80%",
    "text_space": "top/bottom 15%",
    "thumb": "vertical optimize"
  },
  "instagram": {
    "feed_1x1": "center square extract",
    "reels_9x16": "vertical reframe",
    "stories": "space for UI elements"
  }
}
```

## Visual Troubleshooting Guide

| Issue | Cause | Solution |
|-------|-------|----------|
| Inconsistent character | Vague description | Add specific details |
| Flat lighting | No direction specified | Add position + ratio |
| Generic background | Underspecified | Add props + atmosphere |
| No depth | Missing layers | Add fore/mid/back |
| Color mismatch | No hex values | Use specific codes |

## Visual Quality Checklist

```
VISUAL_QC = {
  "technical": {
    "camera_specs": "complete ✓",
    "lighting_math": "adds up ✓",
    "color_codes": "specific ✓",
    "movement_time": "precise ✓"
  },
  "creative": {
    "composition": "intentional ✓",
    "mood": "supports story ✓",
    "focus": "guides eye ✓",
    "style": "consistent ✓"
  },
  "practical": {
    "complexity": "achievable ✓",
    "consistency": "maintainable ✓",
    "platform": "optimized ✓"
  }
}
```

## Final Visual Output

```
COMPLETE_VISUAL_SPEC = {
  "beat_id": "001",
  "master_shot": "[full technical description]",
  "camera_data": {[complete specs]},
  "lighting_plot": {[full setup]},
  "color_recipe": {[hex codes]},
  "continuity": {[locked elements]},
  "platform_versions": {[crop specs]},
  "reference_seed": "[if successful]"
}
```

---

## Next Step
With visuals designed, proceed to Prompt 4: Integration Architecture for seamless assembly.