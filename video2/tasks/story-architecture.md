# /story-architecture Task

When this command is used, execute the following task:

# Strategic Story Architecture & Beat Structure

## Purpose
Transform validated concepts into precise beat architectures optimized for Veo 3 generation, ensuring consistency, viral potential, and technical feasibility.

## Prerequisites
- Validated concept from concept-ideation task
- Clear content type selection
- Character descriptions defined
- Viral mechanics identified

## Process

### Step 1: Content Type Architecture Selection

Based on the validated concept, apply the appropriate architecture:

#### 1. TRANSFORMATION ARCHITECTURE
```json
{
  "transformation_types": {
    "logo_to_product": {
      "stage_1": "logo reveal with material properties (0.0-1.5s)",
      "stage_2": "deconstruction into particles/liquid (1.5-3.0s)", 
      "stage_3": "particle reformation into product (3.0-5.5s)",
      "stage_4": "environment builds around product (5.5-8.0s)",
      "camera_pattern": "macro to wide reveal",
      "keywords": ["fluid assembly", "elegant motion", "premium aesthetic"]
    },
    "unboxing_assembly": {
      "stage_1": "container on pedestal (0.0-1.0s)",
      "stage_2": "dramatic opening with energy (1.0-2.0s)",
      "stage_3": "contents assemble rapidly (2.0-6.0s)",
      "stage_4": "completed environment (6.0-8.0s)",
      "camera_pattern": "fixed wide angle",
      "keywords": ["rapid assembly", "magic transformation"]
    },
    "environment_morph": {
      "stage_1": "initial environment with trigger (0.0-1.5s)",
      "stage_2": "trigger activates transformation (1.5-2.5s)",
      "stage_3": "seamless environment transition (2.5-6.0s)", 
      "stage_4": "final environment established (6.0-8.0s)",
      "camera_pattern": "continuous orbit/dolly",
      "keywords": ["environment shift", "world transformation"]
    }
  }
}
```

#### 2. CHARACTER STORY ARCHITECTURE
```json
{
  "story_types": {
    "continuous_narrative": {
      "beat_1": "establish character + situation",
      "beat_2": "develop conflict/challenge",
      "beat_3": "resolution/twist",
      "consistency": "same character all beats"
    },
    "compilation_perspectives": {
      "beat_1": "perspective A (e.g., news anchor)",
      "beat_2": "perspective B (e.g., witness)",
      "beat_3": "perspective C (e.g., expert)",
      "consistency": "different characters, same theme"
    },
    "hybrid_structure": {
      "beat_1": "main character story",
      "beat_2": "cutaway to different scene",
      "beat_3": "return to main for resolution",
      "consistency": "mix of characters"
    }
  }
}
```

### Step 2: Character Bible Creation

**CRITICAL: Character Consistency Requirements**
- NEVER use "same as beat 1" shortcuts
- Include complete description in EVERY beat
- Specify gender (male/female) and exact age
- Copy descriptions word-for-word across beats

**Character Bible Template:**
```json
{
  "CHARACTER_BIBLE": {
    "char_id": "protagonist_001",
    "physical": {
      "age": "[exact number]",
      "gender": "[male/female]",
      "height": "[5'7\" / 170cm]",
      "build": "[specific description]",
      "hair": "[length, color, style]",
      "clothing": "[exact outfit all beats]",
      "distinguishing": "[marks, accessories]"
    },
    "voice": {
      "tone": "[alto/tenor/bass]",
      "pace": "[words per minute]",
      "accent": "[specific if any]",
      "quirks": ["filler words", "patterns"],
      "emotion_range": "[calm→excited]"
    },
    "movement": {
      "energy": "[1-10 scale]",
      "style": "[graceful/awkward/confident]",
      "gestures": "[hand talker/still/specific]"
    },
    "consistency_code": "CHAR001_EXACT"
  }
}
```

### Step 3: Beat-by-Beat Architecture

For each beat, create complete specifications:

#### Beat Architecture Template (EXAMPLES-ALIGNED DETAIL):
```json
{
  "BEAT_[NUMBER]": {
    "meta": {
      "id": "[001/002/003]",
      "title": "[Beat purpose - The Hook/Development/Payoff]",
      "duration": "8s",
      "emotion": "[curious→shocked / focused→surprised]"
    },
    "technical": {
      "camera": {
        "lens": "[50mm f/2.8 - specific focal length and aperture]",
        "position": "[eye level 150cm, 2m distance from subject]",
        "movement": "[slow push-in 30cm over 6s, ease-in-out curve]",
        "frame_rate": "24fps",
        "stability": "[locked tripod/handheld/gimbal smooth]"
      },
      "focus": {
        "subject": "[character face, sharp detail]",
        "depth_of_field": "[shallow, subject sharp, bg soft blur]",
        "focus_distance": "[2m/rack focus timing if applicable]"
      }
    },
    "character": {
      "ref": "[CHAR_ID]",
      "full_description": "[Name], [age]-year-old [male/female], [hair: length, color, style], [clothing: top, bottom, accessories], [distinguishing features: jewelry, makeup, etc.] - COMPLETE, NEVER SHORTENED",
      "voice_characteristics": "[tone, pace, accent, emotional range]",
      "physical_state": "[posture, energy level, condition]",
      "emotional_state": "[starting emotion → ending emotion]",
      "position_in_frame": "[center frame, left third, specific placement]",
      "eye_line": "[camera direct/off-camera right/down at object]"
    },
    "environment": {
      "location": {
        "type": "[modern open-plan office/futuristic void/cozy bedroom]",
        "size": "[4m x 6m x 3m/infinite space/intimate scale]",
        "architecture": "[materials: concrete, glass, wood / style: industrial, minimalist]"
      },
      "lighting": {
        "key_light": "[3200K at 45° camera left, 100% intensity]",
        "fill_light": "[5600K at -30° camera right, 25% intensity]",
        "rim_light": "[6500K behind subject 45°, 150% intensity]",
        "practicals": "[window left: 5600K natural, desk lamp: 2700K warm]",
        "ratio": "[4:1 key to fill]",
        "atmosphere": "[10% haze, dust motes catching light]"
      },
      "time_of_day": "[late afternoon golden hour/morning bright/evening warm]",
      "weather": "[clear sky, soft natural light/overcast diffused]",
      "props": {
        "hero_props": "[MacBook Pro 16-inch open, white coffee mug with steam, leather notebook]",
        "background_dressing": "[office plants, framed photos, paper stack]",
        "continuity_items": "[items that must stay consistent across beats]"
      },
      "atmospheric_details": {
        "particles": "[dust in light shafts, coffee steam]",
        "sounds": "[HVAC hum at -18dB, distant traffic, keyboard clicks]",
        "temperature": "[warm comfortable office environment]"
      }
    },
    "action": {
      "primary_action": "[character typing stops, looks up slowly, eyes widen in surprise]",
      "precise_timing": {
        "0.0-2.0s": "[focused typing, eyes on screen, fingers moving on keyboard]",
        "2.0-4.0s": "[notice something off-screen, pause typing, slow head turn]",
        "4.0-6.0s": "[eyes widen, sharp intake of breath, lean back slightly]",
        "6.0-8.0s": "[jaw drops 1cm, hold expression, hand covers mouth]"
      },
      "secondary_motion": "[hair settles after head turn at 3s, coffee steam rises throughout]",
      "micro_details": {
        "eye_movement": "[dart to screen at 2.5s, widen at 4s]",
        "breathing": "[normal rhythm, sharp intake at 4s]",
        "hand_gestures": "[pause over keyboard, move to mouth at 7s]"
      }
    },
    "transformation": {
      "stage": "[logo_reveal/particle_formation/assembly_peak if applicable]",
      "elements": "[nano-particles with metallic shimmer, glow trails]",
      "physics": "[zero gravity drift, spiral convergence pattern]",
      "camera_sync": "[orbital motion matches particle flow]",
      "lighting_evolution": "[particle glow adds to key light, 4:1 to 2:1 ratio]"
    },
    "audio": {
      "dialogue": {
        "text": "[wait... is that real? - NO ALL CAPS]",
        "timing": "[4.0-6.0s precise timing]",
        "delivery": "[whispered disbelief, voice cracks slightly]",
        "level": "[-6dB peak]"
      },
      "ambient": {
        "room_tone": "[office atmosphere -18dB throughout]",
        "environmental": "[HVAC hum, distant traffic, paper rustle]",
        "spatial": "[stereo field, 20m room reverb]"
      },
      "sfx": [
        {"sound": "keyboard typing", "timing": "0.0-2.0s", "level": "-12dB"},
        {"sound": "sharp inhale", "timing": "4.0s", "level": "-9dB"},
        {"sound": "chair creak", "timing": "6.0s", "level": "-15dB"}
      ],
      "music": {
        "style": "[minimal tension building from 4s]",
        "level": "[-15dB under dialogue]",
        "sync": "[crescendo matches emotion at 4-6s]"
      }
    },
    "viral_element": {
      "moment": "[4.0s - the realization expression]",
      "description": "[universally relatable shock, perfect for screenshots]",
      "shareability": "[that moment when you realize...]"
    },
    "keywords": ["16:9", "character focus", "emotional journey", "authentic reaction", "office setting", "no text"],
    "platform_optimization": {
      "youtube_thumbnail": "[4.0s peak expression moment]",
      "tiktok_hook": "[expression visible in first 1.5s]",
      "instagram_crop": "[character centered for 1:1 crop]"
    }
  }
}
```

### Step 4: Keywords Strategy Development

**Core Keywords Structure:**
```json
{
  "keyword_strategy": {
    "technical_constants": ["16:9", "no text", "8 seconds", "continuous shot"],
    "style_keywords": ["[based on content type]"],
    "motion_keywords": ["[based on transformation or action]"],
    "mood_keywords": ["[based on emotional tone]"],
    "brand_keywords": ["[if commercial content]"]
  }
}
```

### Step 5: Platform Optimization Planning

Define platform-specific considerations:
```
PLATFORM_OPTIMIZATION = {
  "youtube": {
    "thumbnail_moment": "beat_[X] @ 0:[XX]",
    "retention_hooks": "[specific moments]"
  },
  "tiktok": {
    "loop_point": "[where it loops back]",
    "trend_alignment": "[relevant trends]"
  },
  "instagram": {
    "aesthetic_moments": "[visual highlights]",
    "save_triggers": "[value points]"
  }
}
```

### Step 6: Technical Validation

Run feasibility checks:
- [ ] Each beat exactly 8 seconds
- [ ] Character descriptions complete and identical
- [ ] Keywords consistent across beats
- [ ] Camera movements achievable
- [ ] Transformation timing precise
- [ ] Audio layers balanced
- [ ] Complexity within Veo 3 capabilities

### Step 7: Output Complete Architecture

Generate comprehensive architecture document:

```json
{
  "PROJECT_ARCHITECTURE": {
    "project_meta": {
      "title": "[Project name]",
      "content_type": "[Category]",
      "structure": "[continuous/compilation/hybrid/transformation]",
      "total_duration": "[beats × 8 seconds]",
      "platform_primary": "[main platform]"
    },
    "character_bible": {
      "[Complete character definitions]"
    },
    "beat_sequence": [
      {"beat_1": "[Complete architecture]"},
      {"beat_2": "[Complete architecture]"},
      {"beat_3": "[Complete architecture]"}
    ],
    "keyword_strategy": {
      "[Complete keyword sets]"
    },
    "technical_notes": {
      "seed_strategy": "generate beat 1 first, note seed",
      "complexity_rating": "[simple/medium]",
      "estimated_generations": "[3-5 attempts]"
    },
    "success_metrics": {
      "target_views": "[number]",
      "target_shares": "[number]",
      "target_engagement": "[percentage]"
    }
  }
}
```

## Quality Gates

Before proceeding to Script Engineering:
- Technical specs complete ✓
- Character consistency verified ✓
- Keywords strategically selected ✓
- Viral elements identified ✓
- Platform optimization planned ✓
- Transformation choreography precise ✓

## Key Principles
- Precision in every specification
- Character consistency is non-negotiable
- Keywords drive visual consistency
- Platform native from the start
- Technical feasibility always checked
- Viral mechanics built into structure