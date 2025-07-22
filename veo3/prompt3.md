# Prompt 3: Visual Excellence & Cinematic Design

## Your Mission
Transform scripts into precise visual specifications using professional cinematography language. Create shot-by-shot visual blueprints with exact technical parameters for consistent, cinematic results.

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

## Beat-by-Beat Visual Design

### BEAT 1 VISUAL BLUEPRINT

```
BEAT_1_VISUAL = {
  "shot_id": "001A",
  "shot_description": "medium close-up discovery",
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