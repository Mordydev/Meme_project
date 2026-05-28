# /visual-design Task

When this command is used, execute the following task:

# Visual Excellence & Cinematic Design

## Purpose
Transform scripts and story architecture into precise visual specifications using professional cinematography language, ensuring consistency, platform optimization, and viral-worthy visual moments.

## Prerequisites
- Complete story architecture with beat structure
- Character bible with full descriptions
- Script with dialogue and timing
- Keywords strategy defined

## Process

### Step 1: Character Visual Lock

**CRITICAL Character Consistency Rule:**
- NEVER use shortcuts like "same character as beat 1"
- Every beat MUST include complete character description
- Specify gender (male/female) and exact age in every beat
- Copy the EXACT visual description word-for-word

**Character Visual Specification:**
```json
{
  "CHARACTER_VISUAL_LOCK": {
    "character_id": "[CHAR001_EXACT]",
    "appearance_constants": {
      "physical": {
        "name": "[Full name]",
        "age": "[exact number]-year-old",
        "gender": "[male/female]",
        "height": "[specific]",
        "build": "[athletic/slim/average/etc.]",
        "skin_tone": "[specific description]"
      },
      "hair": {
        "style": "[shoulder-length waves/short buzz/etc.]",
        "color": "[#hex code if possible]",
        "condition": "[neat/messy/styled]"
      },
      "wardrobe": {
        "top": "[exact description]",
        "bottom": "[exact description]",
        "footwear": "[if visible]",
        "accessories": "[watch/jewelry/etc.]"
      },
      "makeup": {
        "style": "[natural/dramatic/none]",
        "specifics": "[details if relevant]"
      },
      "distinguishing": {
        "features": "[scars/tattoos/etc.]",
        "mannerisms": "[specific gestures]"
      }
    },
    "continuity_tracking": {
      "beat_1": "[any specific state]",
      "beat_2": "[changes if any]",
      "beat_3": "[final state]"
    }
  }
}
```

### Step 2: Camera Specifications

**Professional Camera Language:**
```json
{
  "CAMERA_SETUP": {
    "lens_selection": {
      "24mm": {"fov": "84°", "use": "wide establishing", "depth": "deep focus"},
      "35mm": {"fov": "63°", "use": "environmental portrait", "depth": "moderate"},
      "50mm": {"fov": "47°", "use": "natural perspective", "depth": "shallow"},
      "85mm": {"fov": "28°", "use": "portrait isolation", "depth": "very shallow"}
    },
    "aperture_settings": {
      "f/1.4": "extreme bokeh, subject isolation",
      "f/2.8": "moderate bokeh, some background",
      "f/5.6": "balanced depth of field",
      "f/8": "deep focus, everything sharp"
    },
    "movement_precision": {
      "static": "locked position, no movement",
      "dolly_in": "[distance]cm over [time]s, ease-in-out",
      "dolly_out": "[distance]cm over [time]s, smooth",
      "track": "parallel [distance]cm over [time]s",
      "crane": "vertical [distance]cm over [time]s",
      "orbit": "[degrees]° around subject over [time]s",
      "pan": "[degrees]° over [time]s, [speed]"
    }
  }
}
```

### Step 3: Lighting Design

**Cinematic Lighting Specification:**
```json
{
  "LIGHTING_SETUP": {
    "key_light": {
      "type": "[soft/hard]",
      "temperature": "[2800K-6500K]",
      "position": "[degrees] from camera, [degrees] elevation",
      "intensity": "100%",
      "modifier": "[diffusion/direct]"
    },
    "fill_light": {
      "type": "[bounce/direct]",
      "temperature": "[Kelvin]",
      "position": "[degrees] from camera",
      "intensity": "[percentage of key]",
      "ratio": "[2:1 to 8:1] to key"
    },
    "rim_light": {
      "temperature": "[Kelvin]",
      "position": "behind subject [degrees]",
      "intensity": "[percentage]",
      "purpose": "separation/glow"
    },
    "practicals": [
      {"source": "[window/lamp/screen]", "motivated": true, "visible": true}
    ],
    "atmosphere": {
      "haze": "[percentage]",
      "particles": "[dust/smoke]",
      "purpose": "depth/mood"
    }
  }
}
```

### Step 4: Material Physics & Particle Systems (ENHANCED)

**Advanced Material Behaviors:**
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

**Surface Property Specifications:**
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

### Step 4b: Enhanced Camera Choreography Patterns

**Precision Movement Specifications:**
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

**Lighting Evolution During Transformation:**
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

### Step 5: Color Science & Grading

**Color Palette Specification:**
```json
{
  "COLOR_DESIGN": {
    "primary_palette": {
      "hero": "[#hex code]",
      "support": "[#hex code]",
      "accent": "[#hex code]"
    },
    "skin_tones": {
      "base": "[#hex code]",
      "shadows": "[#hex code]",
      "highlights": "[#hex code]"
    },
    "environment": {
      "walls": "[#hex code]",
      "shadows": "[#hex code]",
      "atmosphere": "[#hex code with opacity]"
    },
    "color_grade": {
      "look": "[cinematic warm/cool/neutral]",
      "contrast": "[1.0-1.5]",
      "saturation": "[0.7-1.2]",
      "tint": "[+/- magenta/green]"
    }
  }
}
```

### Step 6: Composition & Framing

**Shot Composition Matrix:**
```json
{
  "COMPOSITION_RULES": {
    "framing": {
      "rule_of_thirds": {
        "subject_position": "[left/right/center third]",
        "eye_line": "[top third horizontal]"
      },
      "headroom": "[percentage of frame height]",
      "lead_room": "[60/40 or 70/30 split]",
      "safe_areas": {
        "16:9": "full frame",
        "9:16_safe": "center 60% critical action",
        "1:1_safe": "center square critical"
      }
    },
    "depth_layers": {
      "foreground": "[element and focus]",
      "midground": "[subject placement]",
      "background": "[environment and bokeh]"
    }
  }
}
```

### Step 7: Beat-by-Beat Visual Blueprint (EXAMPLES-ALIGNED)

For each beat, create complete visual specification matching examples detail level:

```json
{
  "BEAT_[NUMBER]_VISUAL": {
    "shot_id": "[001A/002A/003A]",
    "shot_description": "[type and purpose]",
    "character_full_description": "[COMPLETE - never shortened - Name, age, gender, hair, clothing, accessories, makeup]",
    "project_keywords": ["[all keywords for consistency]"],
    "technical": {
      "camera": {
        "lens": "[50mm f/2.8 - specific focal length and aperture]",
        "position": "[eye level 150cm, 2m distance from subject]",
        "movement": "[slow push-in 30cm over 6s, ease-in-out curve]",
        "frame_rate": "24fps",
        "stability": "[locked/handheld/gimbal smooth]"
      },
      "focus": {
        "subject": "[character face, sharp detail]",
        "depth_of_field": "[shallow, subject sharp, bg soft blur]",
        "focus_distance": "[2m hyperfocal/rack focus timing]"
      }
    },
    "lighting": {
      "key_light": {
        "type": "[soft/hard]",
        "temperature": "[3200K]",
        "position": "[45° camera left, 30° elevation]",
        "intensity": "100%",
        "modifier": "[4x4 softbox/bounce card]"
      },
      "fill_light": {
        "temperature": "[5600K]",
        "position": "[-30° camera right]",
        "intensity": "[25% of key]",
        "ratio": "[4:1 to key light]"
      },
      "rim_light": {
        "temperature": "[6500K]",
        "position": "[behind subject 45°]",
        "intensity": "[150% of key]",
        "purpose": "separation from background"
      },
      "practicals": [
        {"source": "[window left]", "temp": "5600K", "motivated": true, "visible": true},
        {"source": "[desk lamp]", "temp": "2700K", "visible": false, "bounce": true}
      ],
      "atmosphere": {
        "haze": "[10% fill for depth cue]",
        "particles": "[dust motes catching light]"
      }
    },
    "composition": {
      "framing": "[medium close-up, chest to head]",
      "rule_of_thirds": {
        "subject_position": "[left third vertical]",
        "eye_line": "[top third horizontal]"
      },
      "headroom": "[10% frame height]",
      "lead_room": "[60/40 split]",
      "background": "[2-stop under, soft bokeh]",
      "foreground": "[clean, out-of-focus element 20% frame if applicable]"
    },
    "environment": {
      "location": "[modern open-plan office with floor-to-ceiling windows]",
      "architecture": "[concrete and glass, industrial modern]",
      "scale": "[normal office scale, 3m ceilings]",
      "condition": "[lived-in, papers scattered, coffee stains]",
      "props": {
        "hero_props": ["[MacBook Pro 16-inch]", "[white ceramic coffee mug]", "[leather notebook]"],
        "dressing": ["[office plants]", "[framed photos]", "[stack of papers]"],
        "story_props": ["[specific items character interacts with]"]
      },
      "atmospheric": {
        "time_of_day": "[late afternoon, golden hour light]",
        "weather": "[clear sky, soft natural light through windows]",
        "temperature": "[warm, comfortable]",
        "sounds": "[distant traffic, HVAC hum, keyboard clicks]"
      }
    },
    "color_science": {
      "primary_palette": {
        "hero": "#E85D3A",
        "support": "#3A7CA5",
        "accent": "#F5C542"
      },
      "skin_tones": {
        "base": "#D4A574",
        "shadows": "#8B6947",
        "highlights": "#F5DEB3"
      },
      "environment_colors": {
        "walls": "#F5F5F0",
        "shadows": "#4A4A48",
        "atmosphere": "#E6E6FA10"
      },
      "color_grade": {
        "look": "cinematic warm",
        "contrast": "1.2",
        "saturation": "0.85",
        "tint": "+5 magenta"
      }
    },
    "motion": {
      "primary_action": "[character turns from screen to camera, expression changes from focused to surprised]",
      "timing_breakdown": {
        "0-2s": "[focused typing, eyes on screen]",
        "2-4s": "[notice something, pause, look up slowly]",
        "4-6s": "[eyes widen, intake of breath]",
        "6-8s": "[lean back slightly, jaw drop 1cm]"
      },
      "secondary_motion": "[hair settles after head turn at 0:03, coffee steam rises throughout]",
      "micro_details": {
        "eye_movement": "[quick dart to screen at 0:03]",
        "breathing": "[visible chest movement, sharp intake at 0:04]",
        "hand_position": "[fingers pause over keyboard at 0:02]"
      }
    },
    "audio_visual_sync": {
      "dialogue_sync": "[mouth movement matches speech precisely]",
      "action_sync": "[keyboard clicks match finger movement]",
      "environmental_sync": "[coffee cup placement sound at 0:01]"
    },
    "viral_element": "[0:04 moment - the realization expression, universally relatable shock]"
  }
}
```

### Step 8: Environmental Design System (EXAMPLES-ALIGNED)

**Complete Environment Specifications (Matching Examples Detail):**
```json
{
  "ENVIRONMENT_COMPLETE_SPECS": {
    "location_details": {
      "type": "[modern open-plan office/futuristic void/Scandinavian bedroom]",
      "architecture": {
        "walls": "[floor-to-ceiling windows, concrete and glass]",
        "ceiling": "[3m height, exposed beams/smooth plaster]",
        "floor": "[polished concrete/hardwood/seamless white]",
        "materials": "[brushed steel, frosted glass, warm wood]"
      },
      "scale": {
        "room_size": "[4m x 6m x 3m / infinite space / intimate 3m x 3m]",
        "perspective": "[intimate human scale/vast open space]",
        "depth": "[visible to 20m background/infinite void]"
      },
      "condition": {
        "cleanliness": "[pristine/lived-in with coffee stains/distressed]",
        "wear": "[new/well-used/aged patina]",
        "organization": "[minimal/organized chaos/deliberately styled]"
      }
    },
    "atmospheric_elements": {
      "particles": {
        "dust_motes": "density 5%, catch afternoon light streaming through windows",
        "haze": "10% atmospheric haze for depth, subtle volume",
        "steam": "coffee cup steam rising, paper particles if windy"
      },
      "lighting_atmosphere": {
        "time_of_day": "[late afternoon, golden hour/morning bright/evening warm]",
        "weather_condition": "[clear sky with soft clouds/overcast diffused/rain on windows]",
        "light_quality": "[warm 3200K/cool 5600K/mixed temperature]",
        "shadows": "[soft gradual/dramatic directional/even fill]"
      },
      "environmental_sounds": {
        "room_tone": "[office HVAC hum, distant traffic]",
        "specific_sounds": "[keyboard clicks, paper rustle, coffee machine]",
        "spatial_audio": "[20m room reverb, glass surface reflections]"
      }
    },
    "props_and_dressing": {
      "hero_props": {
        "description": "items character directly interacts with",
        "examples": ["MacBook Pro 16-inch, space gray, open at 45°", "white ceramic coffee mug, steam rising", "leather-bound notebook, pen beside it"]
      },
      "secondary_props": {
        "description": "visible items that support story",
        "examples": ["framed photo of family, glass surface", "succulent plant, small ceramic pot", "stack of papers, slightly scattered"]
      },
      "background_dressing": {
        "description": "environmental realism items",
        "examples": ["other desks with equipment", "wall clock showing time", "exit signs and office fixtures", "window blinds partially closed"]
      },
      "continuity_items": {
        "description": "items that must remain consistent",
        "examples": ["coffee mug placement", "notebook position", "screen content", "lighting fixture positions"]
      }
    },
    "specific_location_examples": {
      "modern_office": {
        "complete_description": "Modern open-plan office with floor-to-ceiling windows on left wall, polished concrete floors, white walls with exposed steel beams. Individual workstations with adjustable standing desks, ergonomic chairs. Natural light from west-facing windows creates warm afternoon glow. HVAC system provides subtle background hum. Other employees visible but out of focus in background.",
        "key_elements": ["glass conference room", "industrial ceiling", "plants throughout space", "modern light fixtures"]
      },
      "futuristic_void": {
        "complete_description": "Infinite seamless white space with no visible walls, floor, or ceiling. Soft gradient from pure white center to subtle gray edges. No shadows except from objects. Perfect even lighting with no visible sources. Silent except for object-specific sounds.",
        "key_elements": ["seamless infinite space", "gradient background", "perfect lighting", "isolated objects"]
      },
      "scandinavian_bedroom": {
        "complete_description": "Bright Scandinavian bedroom with white walls, light oak hardwood floors, large window with sheer curtains. Minimalist furniture in natural wood and white. Cozy textiles in muted colors. Natural morning light fills space.",
        "key_elements": ["natural materials", "minimal color palette", "functional design", "hygge atmosphere"]
      }
    }
  }
}
```

### Step 9: VFX Integration Guidelines

**Production Planning:**
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

### Step 10: Platform Visual Optimization

**Platform-Specific Visual Considerations:**
```json
{
  "PLATFORM_VISUALS": {
    "youtube_16x9": {
      "safe_area": "full frame usable",
      "thumbnail": "frame at [time]",
      "quality": "maximum settings"
    },
    "tiktok_9x16": {
      "safe_area": "center 80% critical",
      "text_space": "top/bottom 15% clear",
      "reframe": "center punch-in 110%"
    },
    "instagram": {
      "feed_1x1": "center square extraction",
      "reels_9x16": "vertical reframe strategy",
      "stories": "UI element clearance"
    }
  }
}
```

### Step 11: Quality Control Checklist

**Visual Quality Validation:**
- [ ] Character descriptions identical in all beats
- [ ] Camera specifications complete
- [ ] Lighting setups detailed
- [ ] Color codes specified
- [ ] Composition planned for all platforms
- [ ] Transformation choreography precise
- [ ] Keywords included in every beat
- [ ] Viral moments visually identified

### Step 12: Output Visual Bible

Generate comprehensive visual design document:

```json
{
  "VISUAL_BIBLE": {
    "character_locks": "[complete specifications]",
    "camera_language": "[all setups defined]",
    "lighting_plots": "[beat by beat]",
    "color_recipes": "[complete palette]",
    "transformation_specs": "[if applicable]",
    "platform_versions": "[crop specifications]",
    "quality_gates": "all checked ✓"
  }
}
```

## Troubleshooting Guide

| Issue | Cause | Solution |
|-------|-------|----------|
| Inconsistent character | Incomplete descriptions | Use full description every beat |
| Flat lighting | No direction specified | Add position + ratio |
| Generic background | Underspecified | Add props + atmosphere |
| No depth | Missing layers | Add fore/mid/background |
| Platform issues | Not optimized | Plan crops from start |

## Key Principles
- Visual precision drives consistency
- Character descriptions are sacred
- Professional cinematography language only
- Platform optimization from the start
- Every frame must be intentional
- Visual hooks create viral moments