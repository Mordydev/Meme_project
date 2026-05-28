# /veo3-prompt-generation Task

When this command is used, execute the following task:

# Veo 3 Production-Ready Prompt Generation

## Purpose
Transform all design specifications into production-ready Veo 3 prompts with strategic enhancements, ensuring technical precision and maximum generation success.

## Prerequisites
- Complete story architecture
- Visual design specifications
- Script with dialogue and timing
- Beat integration completed
- Variations selected (if applicable)

## Critical Requirements

### Audio Formatting Rules
**CRITICAL - Veo 3 reads SPOKEN text literally:**
- ALL CAPS DIALOGUE = T H I S (letter by letter audio reading)
- Only use ALL CAPS in dialogue when you want letter-by-letter pronunciation
- VISUAL text/logos like "GEMINI" are fine (seen, not spoken)
- This ONLY affects spoken dialogue and character speech

### Character Consistency Rules
**Every Beat, Every Prompt Must Include:**
- Complete character description (never "same as previous")
- Gender specification (male/female) and exact age
- Full appearance details copied word-for-word
- This ensures consistency across all generations

## Process

### Step 1: Format Selection

Choose appropriate format based on content type:

#### A. TRANSFORMATION FORMAT
```json
{
  "description": "[Complete project description in one sentence]",
  "style": "[cinematic/premium/dynamic approach]",
  "keywords": [
    "16:9",
    "[brand_name]", 
    "[transformation_type]",
    "[visual_style]",
    "[motion_quality]",
    "[lighting_mood]",
    "[atmosphere]",
    "no text"
  ],
  "transformation_type": "[logo_to_product/unboxing_assembly/environment_morph]",
  "duration": 8,
  "camera": "[complete camera choreography description]",
  "lighting": "[lighting evolution throughout sequence]",
  "environment": "[environment description and changes]",
  "timing_breakdown": {
    "0.0-1.5s": {
      "visual": "[exact visual description]",
      "camera": "[lens and movement specs]",
      "lighting": "[specific lighting setup]",
      "audio": "[sound elements]"
    },
    "1.5-4.0s": {
      "visual": "[transformation begins]",
      "camera": "[movement transition]", 
      "lighting": "[lighting evolution]",
      "audio": "[transformation sounds]"
    },
    "4.0-6.5s": {
      "visual": "[formation/assembly]",
      "camera": "[final movement]",
      "lighting": "[final lighting state]",
      "audio": "[completion sounds]"
    },
    "6.5-8.0s": {
      "visual": "[hero shot]",
      "camera": "[static final position]",
      "lighting": "[final setup]",
      "audio": "[resolution]"
    }
  },
  "elements": ["[specific visual elements]"],
  "motion": "[detailed motion description]",
  "ending": "[final state description]"
}
```

#### B. CHARACTER-DRIVEN FORMAT
```json
{
  "description": "[character story in one sentence]",
  "style": "[documentary/comedy/dramatic approach]", 
  "keywords": [
    "16:9",
    "[content_category]",
    "[character_focus]",
    "[emotional_tone]",
    "[visual_style]",
    "[authenticity_markers]",
    "no text"
  ],
  "character": "[Full name], [age]-year-old [gender], [complete physical description]",
  "voice": "[complete voice characteristics]",
  "beat_[number]": {
    "timing": "0.0-8.0s",
    "visual": "[scene and action description]",
    "camera": "[shot type and movement]",
    "lighting": "[lighting setup]",
    "dialogue": [
      {
        "text": "[exact dialogue - NO ALL CAPS]",
        "timing": "[precise timing]",
        "delivery": "[style]"
      }
    ],
    "audio": "[environmental sounds, SFX, music]",
    "viral_element": "[specific moment]"
  }
}
```

### Step 2: Keywords Optimization

**Finalize Keywords Strategy:**
```json
{
  "KEYWORDS_FINAL": {
    "core_requirements": ["16:9", "no text", "8 seconds", "continuous shot"],
    "style_keywords": ["[matched to content type]"],
    "motion_keywords": ["[matched to action/transformation]"],
    "mood_keywords": ["[matched to emotional tone]"],
    "technical_keywords": ["[specific technical requirements]"],
    "platform_keywords": ["[if platform-specific]"]
  }
}
```

### Step 3: Dialogue Verification

**Check ALL Dialogue for Audio Issues:**
```
CORRECT Dialogue Format:
- "This is amazing!" ✓
- "I can't believe this happened!" ✓
- "The story begins here..." ✓

INCORRECT (Will Read Letter-by-Letter):
- "THIS IS AMAZING!" ✗ → Reads as "T H I S  I S..."
- "I CAN'T BELIEVE THIS!" ✗ → Reads as "I  C A N T..."

VISUAL Text (OK to Use ALL CAPS):
- Logo: "APPLE" ✓
- Brand: "TESLA" ✓
- Title Card: "THE BIG REVEAL" ✓
```

### Step 4: Character Description Validation

**Ensure Complete Descriptions in Every Beat:**
```json
{
  "beat_1": {
    "character": "Sarah Chen, 28-year-old female, shoulder-length black hair in loose waves, wearing navy blazer over white button-down shirt, dark wash jeans, silver watch on left wrist, natural makeup with subtle brown eyeliner"
  },
  "beat_2": {
    "character": "Sarah Chen, 28-year-old female, shoulder-length black hair in loose waves, wearing navy blazer over white button-down shirt, dark wash jeans, silver watch on left wrist, natural makeup with subtle brown eyeliner"
  },
  "beat_3": {
    "character": "Sarah Chen, 28-year-old female, shoulder-length black hair in loose waves, wearing navy blazer over white button-down shirt, dark wash jeans, silver watch on left wrist, natural makeup with subtle brown eyeliner"
  }
}
```

### Step 5: Technical Specifications Integration

**Include All Technical Details:**
```json
{
  "technical_specs": {
    "duration": "exactly 8.0 seconds",
    "resolution": "1280x720 (720p)",
    "aspect_ratio": "16:9",
    "frame_rate": "24fps",
    "camera_specs": "[complete details]",
    "lighting_specs": "[complete details]",
    "audio_layers": {
      "dialogue": "-6dB peak",
      "ambient": "-18dB",
      "sfx": "-12dB",
      "music": "-15dB"
    }
  }
}
```

### Step 6: Variation Generation (If Applicable)

**Create Strategic Variations:**
```json
{
  "variations": {
    "hero_version": {
      "approach": "balanced universal",
      "keywords": ["[baseline keywords]"],
      "energy": "moderate",
      "expected_result": "baseline metrics"
    },
    "variation_a": {
      "approach": "comedy optimized",
      "keywords": ["[comedy keywords]"],
      "energy": "high",
      "changes": ["timing", "delivery", "sfx"],
      "expected_result": "+30% shares"
    },
    "variation_b": {
      "approach": "dramatic intensity",
      "keywords": ["[dramatic keywords]"],
      "energy": "building",
      "changes": ["pacing", "music", "pauses"],
      "expected_result": "+40% completion"
    }
  }
}
```

### Step 7: Enhancement Philosophy & Final Polish

**Enhancement Principles:**
```
ENHANCEMENT_PRINCIPLES = {
  "preserve": "What works stays exactly as is",
  "enhance": "Add depth without complexity",
  "optimize": "Technical precision for reliability",
  "polish": "Final 10% that makes 90% difference"
}
```

**Transformation Enhancement Analysis (For Transformation Content):**
```json
{
  "transformation_enhancement_assessment": {
    "working_elements": {
      "identify": ["smooth transitions", "particle behavior", "audio sync", "camera choreography"],
      "protect": "successful transformation timing and flow",
      "document": "precise moments that create impact"
    },
    "enhancement_opportunities": {
      "particle_refinement": ["more realistic physics", "improved convergence patterns"],
      "lighting_evolution": ["smoother transitions", "better material interaction"],
      "audio_synchronization": ["tighter sync points", "enhanced spatial audio"],
      "camera_precision": ["smoother movement curves", "better focus transitions"],
      "keyword_optimization": ["platform-specific keyword tuning", "SEO enhancement"]
    },
    "transformation_specific": {
      "material_physics": ["surface tension accuracy", "gravity behavior", "collision detection"],
      "energy_effects": ["volumetric accuracy", "dissipation patterns", "glow falloff"],
      "formation_precision": ["geometric accuracy", "assembly timing", "final stability"]
    }
  }
}
```

**Enhanced Assessment Framework:**
```json
{
  "enhanced_assessment": {
    "working_elements": {
      "identify": ["strong hooks", "emotional beats", "viral moments", "transformation sequences", "audio sync"],
      "protect": "no changes to successful elements",
      "document": "why these work and timing precision"
    },
    "enhancement_opportunities": {
      "visual": ["lighting nuance", "compositional refinement", "particle detail", "material accuracy"],
      "audio": ["layer richness", "mix clarity", "transformation sync", "spatial positioning"],
      "performance": ["micro-expressions", "timing precision", "transformation flow"],
      "technical": ["spec accuracy", "platform optimization", "keyword implementation"]
    }
  }
}
```

**Enhanced Quality Layers:**
```
ENHANCEMENT_LAYERS = {
  "visual_polish": {
    "micro_details": {
      "eye_darts": "quick glance at 0:03",
      "breathing": "visible subtle chest movement",
      "hair_physics": "slight movement from AC"
    },
    "lighting_nuance": {
      "practical_motivation": "screen glow on face intensifies",
      "time_progression": "subtle warm shift",
      "atmosphere": "dust particles in light shaft"
    }
  },
  "audio_richness": {
    "room_character": {
      "size": "large open space",
      "surfaces": "glass and concrete",
      "distance": "20m to far wall"
    },
    "detail_layers": [
      "mouse clicks distant",
      "coffee machine hum",
      "paper rustle at 0:07"
    ]
  },
  "performance_finesse": {
    "micro_expressions": {
      "0:03": "slight squint",
      "0:05": "eyebrow raise 2mm",
      "0:07": "jaw slack 1cm"
    },
    "voice_texture": {
      "breathiness": "increases with shock",
      "pitch": "rises 5% on 'real'",
      "tremor": "slight on final word"
    }
  }
}
```

### Step 8: Keywords Final Validation

**Strategic Keywords Final Check:**
```json
{
  "keyword_final_check": {
    "core_requirements": {
      "technical_specs": ["16:9", "no text", "8 seconds", "continuous shot"],
      "verified": "present in all variations ✓"
    },
    "style_consistency": {
      "hero_keywords": ["premium aesthetic", "fluid assembly", "elegant motion", "soft lighting", "calm luxury"],
      "variation_a": ["dynamic energy", "rapid assembly", "explosive motion", "dramatic lighting", "high intensity"],
      "variation_b": ["mystical atmosphere", "magical formation", "ethereal motion", "enchanted lighting", "otherworldly"],
      "variation_c": ["technical precision", "mechanical assembly", "precise motion", "clinical lighting", "scientific"],
      "consistency_check": "each variation has complete thematic keyword set ✓"
    },
    "platform_optimization": {
      "youtube_keywords": "description and tags optimized",
      "tiktok_hashtags": "trending and niche tags identified", 
      "instagram_tags": "aesthetic and branded hashtags selected"
    }
  }
}
```

### Step 9: Quality Assurance Checklist

**Final Validation Before Generation:**
- [ ] Keywords array complete and consistent
- [ ] Core keywords present: "16:9", "no text", "8 seconds"
- [ ] NO ALL CAPS in dialogue (unless intentional)
- [ ] Visual text/logos with ALL CAPS are fine
- [ ] Every beat has complete character description
- [ ] Gender and age specified in each beat
- [ ] Technical specs precise and complete
- [ ] Viral elements clearly identified
- [ ] Platform optimization confirmed
- [ ] Transformation timing follows structure
- [ ] Audio sync points specified
- [ ] Enhancement philosophy applied
- [ ] Quality layers implemented
- [ ] Assessment framework complete

### Step 10: Output Formats

Generate multiple output formats:

#### A. Quick Generation Format (EXAMPLES-ALIGNED DETAIL)
```
[BEAT 1]
Medium close-up of Sarah Chen (28-year-old female, shoulder-length black hair in loose waves, navy blazer over white button-down shirt, dark wash jeans, silver watch on left wrist, natural makeup with subtle brown eyeliner) at modern office desk with MacBook Pro and white ceramic coffee mug. Modern open-plan office with floor-to-ceiling windows, polished concrete floors, exposed steel beams. Late afternoon golden hour light from west-facing windows creates warm 3200K glow. She types focused on screen, stops at 0:02 noticing something, looks up slowly with growing concern, eyes widen at 0:04 with sharp intake of breath.

DIALOGUE (0:04-0:06, whispered disbelief, voice cracks slightly): "no way... this can't be real"

CAMERA: 50mm f/2.8, eye level 150cm, 2m distance, slow 30cm push-in over 6s with ease-in-out curve, locked tripod stability

LIGHTING: Key light 3200K at 45° camera left 100%, fill light 5600K at -30° camera right 25%, rim light 6500K behind subject 150%, window practical 5600K motivated, 4:1 lighting ratio, 10% atmospheric haze

ENVIRONMENT: Modern office 4m x 6m x 3m, concrete and glass architecture, coffee steam rising, HVAC hum at -18dB, distant keyboard clicks, other employees visible but soft focus in background

SFX: keyboard typing 0:00-0:02 at -12dB, sharp inhale 0:04 at -9dB, chair creak 0:06 at -15dB, ambient office atmosphere -18dB throughout

COLOR: Cinematic warm grade, contrast 1.2, saturation 0.85, +5 magenta tint, skin tones #D4A574 base

Keywords: 16:9, character focus, emotional journey, authentic reaction, office setting, warm lighting, natural performance, no text

(no subtitles, 8 seconds exactly, 24fps)
```

#### B. Structured JSON Format (EXAMPLES-ALIGNED COMPLETE)
```json
{
  "beat_1_final": {
    "description": "Character discovery sequence in modern office environment with emotional progression from focus to shock",
    "style": "cinematic documentary, authentic performance, warm natural lighting",
    "keywords": [
      "16:9",
      "character focus",
      "emotional journey",
      "authentic reaction",
      "office setting",
      "warm lighting",
      "natural performance",
      "no text"
    ],
    "character": "Sarah Chen, 28-year-old female, shoulder-length black hair in loose waves, navy blazer over white button-down shirt, dark wash jeans, silver watch on left wrist, natural makeup with subtle brown eyeliner",
    "voice": "conversational tone with emotional range, whispered disbelief with slight voice crack during realization",
    "technical": {
      "camera": {
        "lens": "50mm f/2.8",
        "position": "eye level 150cm, 2m distance from subject",
        "movement": "slow 30cm push-in over 6s with ease-in-out curve",
        "stability": "locked tripod",
        "frame_rate": "24fps"
      },
      "focus": {
        "subject": "character face, sharp detail",
        "depth_of_field": "shallow, subject sharp, background soft bokeh",
        "focus_distance": "2m maintained throughout"
      }
    },
    "lighting": {
      "key_light": {
        "temperature": "3200K",
        "position": "45° camera left, 30° elevation",
        "intensity": "100%",
        "modifier": "window diffusion natural"
      },
      "fill_light": {
        "temperature": "5600K",
        "position": "-30° camera right",
        "intensity": "25%",
        "ratio": "4:1 to key"
      },
      "rim_light": {
        "temperature": "6500K",
        "position": "behind subject 45°",
        "intensity": "150%",
        "purpose": "separation from background"
      },
      "practicals": [
        {"source": "west-facing windows", "temp": "5600K", "motivated": true, "visible": true}
      ],
      "atmosphere": {
        "haze": "10% for depth",
        "particles": "dust motes in light shafts"
      }
    },
    "environment": {
      "location": "modern open-plan office with floor-to-ceiling windows, polished concrete floors, exposed steel beams",
      "size": "4m x 6m x 3m scale",
      "time_of_day": "late afternoon golden hour",
      "weather": "clear sky, soft natural light",
      "props": {
        "hero_props": ["MacBook Pro 16-inch open", "white ceramic coffee mug with steam", "leather notebook"],
        "background_dressing": ["other office workstations", "plants", "distant employees soft focus"]
      }
    },
    "action": {
      "timing_breakdown": {
        "0.0-2.0s": "focused typing, eyes on screen, fingers moving on keyboard",
        "2.0-4.0s": "notice something, pause typing, slow head turn up",
        "4.0-6.0s": "eyes widen, sharp intake of breath, lean back slightly",
        "6.0-8.0s": "jaw drops 1cm, hold shocked expression"
      },
      "micro_details": {
        "eye_movement": "dart to screen at 2.5s, widen at 4s",
        "breathing": "normal rhythm, sharp intake at 4s",
        "hand_position": "pause over keyboard at 2s"
      }
    },
    "dialogue": {
      "text": "no way... this can't be real",
      "timing": "4.0-6.0s",
      "delivery": "whispered disbelief, voice cracks slightly on 'real'",
      "level": "-6dB peak"
    },
    "audio": {
      "ambient": {
        "room_tone": "office HVAC hum at -18dB",
        "environmental": "distant keyboard clicks, paper rustle",
        "spatial": "20m room reverb, glass surface reflections"
      },
      "sfx": [
        {"sound": "keyboard typing", "timing": "0.0-2.0s", "level": "-12dB"},
        {"sound": "sharp inhale", "timing": "4.0s", "level": "-9dB"},
        {"sound": "chair creak", "timing": "6.0s", "level": "-15dB"}
      ],
      "music": {
        "style": "minimal tension building from 4s",
        "level": "-15dB under dialogue"
      }
    },
    "color_grade": {
      "look": "cinematic warm",
      "contrast": "1.2",
      "saturation": "0.85",
      "tint": "+5 magenta",
      "skin_tones": "#D4A574 base"
    },
    "viral_element": {
      "moment": "4.0s - the realization expression",
      "description": "universally relatable shock face",
      "shareability": "perfect for 'that moment when...' memes"
    }
  }
}
```

#### C. Platform-Specific Outputs
```json
{
  "youtube_version": {
    "format": "16:9 native",
    "metadata": "[SEO optimized]"
  },
  "tiktok_version": {
    "format": "9:16 center crop",
    "adjustments": "[platform specific]"
  }
}
```

### Step 11: Generation Instructions

**Provide Clear Generation Sequence:**
```
GENERATION_SEQUENCE:
1. Generate Beat 1 with multiple seeds
2. Select best result, note seed
3. Generate remaining beats with seed reference
4. Verify consistency across all beats
5. Assembly and platform export

SEED_MANAGEMENT:
- Beat 1: Generate 3x, select best
- Beat 2+: Use Beat 1 seed for consistency
- Document successful seeds for future use
```

## Delivery Package

**Complete Production Package:**
```json
{
  "FINAL_DELIVERY": {
    "prompts": {
      "master_prompts": "[all beats production-ready]",
      "quick_format": "[consolidated version]",
      "variations": "[if created]"
    },
    "documentation": {
      "seed_log": "successful seeds noted",
      "keywords_used": "complete list",
      "technical_specs": "all parameters"
    },
    "quality_assurance": {
      "all_checks": "passed ✓",
      "ready_for_generation": true
    }
  }
}
```

## Success Metrics Projection

```json
{
  "PROJECTED_PERFORMANCE": {
    "technical_success": {
      "first_gen_success": "85% probability",
      "consistency": "95% maintained",
      "sync_accuracy": "frame-perfect"
    },
    "engagement_projection": {
      "view_completion": "75%+",
      "engagement_rate": "18%+",
      "share_rate": "6%+"
    }
  }
}
```

## Key Principles
- Technical precision ensures success
- Character consistency is absolute
- Keywords drive visual consistency
- Audio formatting prevents issues
- Platform optimization built in
- Final polish elevates quality