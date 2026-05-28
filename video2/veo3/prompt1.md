# Prompt 1: Strategic Story Architecture & Beat Structure

## Your Mission
Transform validated concepts into precise beat architectures optimized for Veo 3 generation. Create structured blueprints that ensure consistency, viral potential, and technical feasibility while leveraging the full spectrum of content types Veo 3 excels at.

## Why This Matters
Traditional approaches to AI video creation fail because they:
- Ignore Veo 3's 8-second constraint, creating narratives that feel rushed
- Underutilize native audio capabilities, missing emotional impact
- Lack strategic chunking—treating limitations as obstacles rather than creative catalysts
- Create generic "AI slop" without clear transformation objectives
- Miss platform-specific optimization needed for viral distribution
- Fail to plan for character consistency across multiple clips

## Content Type Selection

Choose your category for optimized structure:

### 1. ENTERTAINMENT CONTENT
```json
{
  "entertainment_types": {
    "adventure_vlogs": { "focus": "exploration_discovery", "viral_mechanism": "vicarious_experience" },
    "comedy": { "focus": "physical_humor_absurd_situations", "viral_mechanism": "laughter_shareability" },
    "drama_mystery": { "focus": "tension_reveals", "viral_mechanism": "emotional_investment" },
    "personality": { "focus": "unique_perspectives", "viral_mechanism": "character_connection" },
    "movie_trailers": { "focus": "epic_previews", "viral_mechanism": "anticipation_building" },
    "teaser_videos": { "focus": "curiosity_gaps", "viral_mechanism": "coming_soon_excitement" },
    "mini_documentaries": { "focus": "fascinating_stories", "viral_mechanism": "knowledge_value" },
    "viral_challenges": { "focus": "recreatable_moments", "viral_mechanism": "participation_culture" }
  }
}
```

### 2. ANIMATED CONTENT  
```json
{
  "animation_types": {
    "character_stories": { "focus": "emotional_journeys", "viral_mechanism": "character_appeal" },
    "animated_shorts": { "focus": "complete_micro_narratives", "viral_mechanism": "visual_delight" },
    "motion_graphics": { "focus": "kinetic_typography", "viral_mechanism": "information_beauty" },
    "fantasy_worlds": { "focus": "imaginative_settings", "viral_mechanism": "escapism_wonder" },
    "animated_explainers": { "focus": "complex_concepts_simplified", "viral_mechanism": "educational_entertainment" },
    "hybrid_live_animation": { "focus": "mixed_reality", "viral_mechanism": "format_innovation" }
  }
}
```

### 3. INTERVIEW/CONVERSATION
```json
{
  "interview_types": {
    "street_interviews": { "focus": "authentic_reactions", "viral_mechanism": "relatability_unexpected_answers" },
    "expert_interviews": { "focus": "knowledge_sharing", "viral_mechanism": "authority_insights" },
    "comedy_interviews": { "focus": "unexpected_answers", "viral_mechanism": "humor_surprise" },
    "celebrity_parodies": { "focus": "fictional_famous_interactions", "viral_mechanism": "celebrity_culture" },
    "historical_figures": { "focus": "time_travel_conversations", "viral_mechanism": "anachronism_humor" }
  }
}
```

### 4. NEWS/INFORMATION
```json
{
  "news_types": {
    "breaking_news": { "focus": "urgent_updates", "viral_mechanism": "timeliness_authority" },
    "educational_content": { "focus": "teaching_moments", "viral_mechanism": "knowledge_retention" },
    "reviews": { "focus": "honest_reactions", "viral_mechanism": "purchase_guidance" },
    "industry_updates": { "focus": "professional_insights", "viral_mechanism": "trend_awareness" },
    "explainer_videos": { "focus": "complex_topics_simplified", "viral_mechanism": "understanding_clarity" }
  }
}
```

### 5. COMMERCIAL/PROMOTIONAL
```json
{
  "commercial_types": {
    "product_ads": { "focus": "showcase_benefits", "viral_mechanism": "problem_solution_clarity" },
    "brand_stories": { "focus": "emotional_connection", "viral_mechanism": "values_alignment" },
    "testimonials": { "focus": "authentic_experiences", "viral_mechanism": "social_proof" },
    "before_after_reveals": { "focus": "transformation_showcases", "viral_mechanism": "dramatic_change" },
    "unboxing_experiences": { "focus": "discovery_genuine_excitement", "viral_mechanism": "anticipation_reveal" }
  }
}
```

### 6. MULTI-CHARACTER NARRATIVES
```json
{
  "multi_character_types": {
    "friend_dynamics": { "focus": "group_chemistry", "viral_mechanism": "relationship_recognition" },
    "workplace_scenarios": { "focus": "relatable_situations", "viral_mechanism": "professional_humor" },
    "family_moments": { "focus": "universal_experiences", "viral_mechanism": "generational_connection" },
    "ensemble_stories": { "focus": "multiple_perspectives", "viral_mechanism": "complexity_richness" }
  }
}
```

## Enhanced Architecture Framework

### 1. PROJECT INITIALIZATION

```
PROJECT_CONFIG = {
  "title": "[Project Name]",
  "content_type": "[Category]",
  "duration": "[beats × 8 seconds]",
  "structure": "[continuous/compilation/hybrid]",
  "platform_primary": "youtube",
  "platform_secondary": ["tiktok", "instagram"]
}
```

### 2. CHARACTER BIBLE SYSTEM

**Single Character Template:**
```
CHARACTER_BIBLE = {
  "char_id": "protagonist_001",
  "physical": {
    "age": [exact],
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
```

**Multi-Character Rules:**
- Maximum 2 characters interacting per beat
- Each needs unique `char_id` and `consistency_code`
- Distinct visual and voice profiles
- Clear relationship dynamics

### 3. FLEXIBLE SCENE STRUCTURE OPTIONS

**Choose Your Strategic Approach:**

```json
{
  "structure_options": {
    "continuous_story": {
      "description": "Same characters/location throughout",
      "beat_1": "Setup with main character",
      "beat_2": "Development with same character", 
      "beat_3": "Resolution with same character",
      "best_for": ["character_development", "narrative_arcs", "emotional_journeys"],
      "complexity": "simple"
    },
    "compilation_montage": {
      "description": "Different scenes/perspectives",
      "beat_1": "News anchor reporting",
      "beat_2": "Person on street reacting",
      "beat_3": "Expert in office explaining",
      "beat_4": "Animation illustrating concept",
      "best_for": ["topic_exploration", "multiple_viewpoints", "variety_engagement"],
      "complexity": "medium"
    },
    "hybrid_approach": {
      "description": "Mix of continuous + compilation",
      "beat_1": "Main character discovers something",
      "beat_2": "Cut to news report about it (new characters)",
      "beat_3": "Back to main character's reaction",
      "beat_4": "Different person experiencing same thing",
      "best_for": ["complex_narratives", "world_building", "social_commentary"],
      "complexity": "advanced"
    }
  }
}
```

### 4. TRANSFORMATION ARCHETYPES (NEW)

**Revolutionary Content Categories:**

```json
{
  "transformation_archetypes": {
    "logo_to_product_transformation": {
      "description": "Brand logo morphs into actual product",
      "stage_1": "logo reveal with material properties (0.0-1.5s)",
      "stage_2": "deconstruction into particles/liquid light (1.5-3.0s)", 
      "stage_3": "particle reformation into product (3.0-5.5s)",
      "stage_4": "environment builds around product (5.5-8.0s)",
      "camera_pattern": "macro logo detail → smooth dolly out during transformation",
      "best_for": ["product_reveals", "brand_storytelling", "luxury_showcases"]
    },
    "unboxing_assembly_magic": {
      "description": "Container opens, transforms entire environment",
      "stage_1": "mysterious container/box on pedestal (0.0-1.0s)",
      "stage_2": "dramatic opening with energy burst (1.0-2.0s)",
      "stage_3": "contents fly out, assemble rapidly (2.0-6.0s)",
      "stage_4": "completed environment reveal (6.0-8.0s)",
      "camera_pattern": "fixed wide angle capturing full transformation",
      "best_for": ["room_reveals", "lifestyle_brands", "tech_showcases"]
    },
    "environment_morph_sequence": {
      "description": "Entire world transforms around trigger object",
      "stage_1": "initial environment A with trigger (0.0-1.5s)",
      "stage_2": "trigger activates transformation energy (1.5-2.5s)",
      "stage_3": "seamless environment transition (2.5-6.0s)", 
      "stage_4": "final environment B fully formed (6.0-8.0s)",
      "camera_pattern": "continuous orbit/dolly during transformation",
      "best_for": ["brand_worlds", "event_promotions", "lifestyle_transformations"]
    },
    "particle_formation_sequence": {
      "description": "Subject materializes from energy/particles",
      "stage_1": "empty space with ambient energy (0.0-1.0s)",
      "stage_2": "particles/energy converge to center (1.0-3.0s)",
      "stage_3": "subject forms from particles (3.0-6.0s)",
      "stage_4": "final form stabilizes with environment (6.0-8.0s)",
      "camera_pattern": "slow push-in as subject materializes",
      "best_for": ["tech_products", "sci_fi_concepts", "luxury_reveals"]
    }
  }
}
```

### 5. CONTINUOUS SHOT MASTERY

**Single-Shot Choreography Patterns:**

```json
{
  "continuous_shot_patterns": {
    "macro_to_wide_reveal": {
      "timing_breakdown": {
        "0.0-1.5s": "ultra close-up on detail (condensation, logo texture)",
        "1.5-4.0s": "smooth dolly out while orbiting subject", 
        "4.0-6.5s": "transformation occurs in frame",
        "6.5-8.0s": "final wide hero shot reveal"
      },
      "camera_specs": "50mm start, 24mm end, smooth zoom transition",
      "focus_notes": "rack focus from macro detail to wide scene"
    },
    "floating_orbit_sequence": {
      "camera_path": "continuous 360° orbit at 1.5m radius",
      "height_variation": "gentle sine wave 20cm amplitude", 
      "focus_tracking": "subject remains center frame throughout",
      "speed_variation": "slow start, accelerate during transformation, slow end"
    },
    "energy_release_dolly": {
      "movement": "dolly in 2.5m to 1.5m over 5 seconds",
      "then": "static hero shot for final 3 seconds",
      "sync_point": "transformation peak at 4.0s during movement"
    }
  }
}
```

### 6. KEYWORDS SYSTEM (NEW)

**Strategic Keywords for Consistency:**

```json
{
  "keyword_categories": {
    "technical_specs": ["16:9", "no text", "8 seconds", "continuous shot", "no hard cuts"],
    "visual_style": ["cinematic", "photorealistic", "minimalistic", "premium aesthetic", "hyper-realistic"],
    "lighting_mood": ["soft lighting", "dramatic rim lighting", "golden hour", "cyberpunk glow", "ethereal"],
    "motion_style": ["fluid assembly", "elegant motion", "seamless transitions", "floating", "particle formation"],
    "color_palette": ["silver white space gray", "neon tropic", "warm natural", "cyberpunk blues", "luxury gold"],
    "atmosphere": ["calm luxury", "high energy", "mysterious", "futuristic party", "serene minimalism"],
    "transformation_type": ["logo morphing", "assembly magic", "environment shift", "particle convergence"],
    "brand_elements": ["[brand_name]", "[product_type]", "[signature_style]", "[target_emotion]"]
  }
}
```

### 7. BEAT ARCHITECTURE TEMPLATES

#### A. CONTINUOUS STORY TEMPLATE
```
BEAT_1 = {
  "meta": {
    "id": "001",
    "title": "The Hook",
    "duration": "8s",
    "emotion": "curiosity→concern"
  },
  "technical": {
    "shot": "medium close-up",
    "lens": "50mm f/1.8",
    "camera": "slow push-in 30cm over 6s",
    "fps": 24
  },
  "character": {
    "ref": "CHAR001_EXACT",
    "state": "discovering problem",
    "position": "center frame"
  },
  "environment": {
    "location": "[specific place]",
    "lighting": "key: 3200K@45°, fill: 5600K@-30°, ratio: 4:1",
    "time": "afternoon",
    "atmosphere": "tense anticipation"
  },
  "action": {
    "primary": "[specific 8-second action]",
    "timing": {
      "0-2s": "notice issue",
      "2-5s": "investigate",
      "5-8s": "react"
    }
  },
  "audio": {
    "dialogue": {
      "text": "[12-18 words max]",
      "delivery": "[whispered/normal/shouted]",
      "timing": "0:01-0:05"
    },
    "ambient": "[room tone] @ -18dB",
    "sfx": [
      {"sound": "[specific]", "time": "0:02", "level": "-12dB"}
    ],
    "music": null
  },
  "viral_element": "[specific shareable moment]"
}
```

#### B. COMPILATION TEMPLATE
```
COMPILATION_BEAT = {
  "beat_1": {
    "scene_type": "news_anchor",
    "new_character": "NEWS_ANCHOR_001",
    "new_location": "studio",
    "connection": "thematic"
  },
  "beat_2": {
    "scene_type": "street_interview",
    "new_character": "PEDESTRIAN_001",
    "new_location": "sidewalk",
    "connection": "topic_continuation"
  },
  "beat_3": {
    "scene_type": "expert_opinion",
    "new_character": "EXPERT_001",
    "new_location": "office",
    "connection": "conclusion"
  }
}
```

### 4. TECHNICAL SPECIFICATIONS

**Camera Language:**
```
CAMERA_SPECS = {
  "lenses": {
    "24mm": "establishing/environmental",
    "35mm": "full body/group",
    "50mm": "natural/interview",
    "85mm": "intimate close-up"
  },
  "movements": {
    "static": "0cm movement",
    "push_in": "[X]cm over [Y]s",
    "pull_out": "[X]cm over [Y]s",
    "track": "left/right [X]cm over [Y]s",
    "pan": "[X]° over [Y]s"
  },
  "heights": {
    "low": "30cm from ground",
    "eye": "150-170cm",
    "high": "200cm+"
  }
}
```

**Lighting Precision:**
```
LIGHTING_SETUP = {
  "key": {
    "temperature": "[2800K-6500K]",
    "angle": "[degrees from camera]",
    "intensity": "100%"
  },
  "fill": {
    "temperature": "[2800K-6500K]",
    "angle": "[degrees from camera]",
    "intensity": "[percentage of key]"
  },
  "ratio": "[2:1 to 8:1]",
  "practicals": ["visible sources"],
  "atmosphere": ["haze", "particles"]
}
```

### 5. AUDIO ARCHITECTURE

```
AUDIO_LAYERS = {
  "dialogue": {
    "word_count": [12-18],
    "delivery_style": "[natural/performed/animated]",
    "processing": "eq: presence boost 5kHz",
    "level": "-6dB"
  },
  "ambient": {
    "description": "[specific environment]",
    "stereo_width": "full",
    "level": "-18dB",
    "consistency": "all beats"
  },
  "sfx": {
    "sync_points": ["exact timings"],
    "levels": "-12dB average",
    "spatial": "matched to action"
  },
  "music": {
    "style": "[genre/mood]",
    "bpm": [specific],
    "key": "[musical key]",
    "edit_points": ["hit markers"],
    "level": "-15dB under dialogue"
  }
}
```

### 8. TRANSFORMATION EXAMPLES (NEW)

#### Logo-to-Product Transformation: "Apple Watch Revelation"
```json
{
  "project_type": "logo_to_product_transformation",
  "keywords": ["16:9", "Apple", "minimalistic", "premium aesthetic", "silver white", "fluid assembly", "elegant motion", "soft lighting", "no hard cuts", "calm luxury"],
  "beat_structure": {
    "stage_1": {
      "timing": "0.0-1.5s",
      "visual": "Apple logo floating in soft gradient void, brushed titanium texture with subtle reflections",
      "camera": "ultra close-up on logo surface, 85mm macro",
      "audio": "soft digital pulse, ambient silence"
    },
    "stage_2": {
      "timing": "1.5-3.0s", 
      "visual": "Logo edges melt into flowing nano-particles, like liquid metal in zero gravity",
      "camera": "slow dolly out while particles swirl, 50mm transition",
      "audio": "gentle digital chimes, particle movement sounds"
    },
    "stage_3": {
      "timing": "3.0-5.5s",
      "visual": "Particles condense and form Apple Watch Ultra, gentle rotation as it materializes",
      "camera": "continues dolly out to 35mm, orbiting slightly",
      "audio": "formation harmonics, subtle mechanical precision sounds"
    },
    "stage_4": {
      "timing": "5.5-8.0s",
      "visual": "Futuristic table and environment fade in, watch screen activates with ripple effect",
      "camera": "final wide 24mm hero shot",
      "audio": "environment establishment, soft UI sounds"
    }
  }
}
```

#### Unboxing Assembly Magic: "Tesla Showroom Transformation"
```json
{
  "project_type": "unboxing_assembly_magic",
  "keywords": ["16:9", "Tesla", "magic assembly", "showroom", "innovation", "futuristic", "no text", "clean design", "rapid assembly"],
  "beat_structure": {
    "stage_1": {
      "timing": "0.0-1.0s",
      "visual": "Tesla-branded crate with glowing seams on pedestal in empty futuristic space",
      "camera": "fixed wide angle, 35mm, capturing full space",
      "audio": "subtle ambient hum, energy building"
    },
    "stage_2": {
      "timing": "1.0-2.0s",
      "visual": "Crate panels retract with energy burst, revealing Tesla vehicle inside",
      "camera": "subtle zoom focus on opening, maintaining wide frame",
      "audio": "mechanical precision sounds, energy release"
    },
    "stage_3": {
      "timing": "2.0-6.0s",
      "visual": "Showroom elements fly out: charging station, display panels, furniture - all assembling rapidly",
      "camera": "maintains wide frame capturing all assembly simultaneously",
      "audio": "cascade of assembly sounds, building to crescendo"
    },
    "stage_4": {
      "timing": "6.0-8.0s",
      "visual": "Complete Tesla showroom with car as centerpiece, pristine and inviting",
      "camera": "slight pull back for final reveal",
      "audio": "assembly sounds fade, serene showroom ambience"
    }
  }
}
```

#### Environment Morph Sequence: "Pepsi City Festival"
```json
{
  "project_type": "environment_morph_sequence", 
  "keywords": ["16:9", "Pepsi", "urban festival", "futuristic party", "city transforms", "dynamic animation", "holographic concert", "hyper-realistic", "cyberpunk glow"],
  "beat_structure": {
    "stage_1": {
      "timing": "0.0-1.5s",
      "visual": "Pepsi can with condensation on futuristic pedestal, quiet urban plaza",
      "camera": "ultra close-up on can, slow dolly out begins",
      "audio": "urban ambience, subtle energy building"
    },
    "stage_2": {
      "timing": "1.5-2.5s",
      "visual": "Can tab opens in slow motion, liquid light spirals burst out",
      "camera": "dramatic zoom focus on opening, then rapid dolly out",
      "audio": "can opening amplified, energy release whoosh"
    },
    "stage_3": {
      "timing": "2.5-6.0s",
      "visual": "City transforms: LED screens animate, holographic stage assembles, crowds materialize with AR headsets",
      "camera": "continuous orbit around can as city transforms in background",
      "audio": "festival music builds, crowd energy, transformation sounds"
    },
    "stage_4": {
      "timing": "6.0-8.0s",
      "visual": "Full cyberpunk festival, Pepsi can in foreground, city pulsing with neon",
      "camera": "final hero shot with can centered, transformed city behind",
      "audio": "full festival soundscape, music peak"
    }
  }
}
```

### 9. CONTENT-SPECIFIC STRATEGIES

**Animation Architecture:**
```json
{
  "animation_specs": {
    "style": "[Pixar/2D/stylized]",
    "character_design": {
      "proportions": "[realistic/exaggerated]",
      "appeal": "[cute/cool/comedic]",
      "color_palette": ["#hex1", "#hex2", "#hex3"]
    },
    "movement": {
      "timing": "[snappy/fluid/bouncy]",
      "squash_stretch": "[0-10 scale]",
      "anticipation": "[subtle/exaggerated]"
    },
    "transformation_integration": {
      "particle_style": "cartoon physics or realistic",
      "assembly_speed": "rapid with anticipation beats",
      "character_formation": "materials converge to create character"
    }
  }
}
```

**Commercial Transformation Flow:**
```json
{
  "commercial_transformation": {
    "stage_1": {
      "focus": "brand_trigger",
      "emotion": "curiosity",
      "visual": "logo/package reveal"
    },
    "stage_2": {
      "focus": "transformation_magic", 
      "emotion": "amazement",
      "visual": "product formation/environment building"
    },
    "stage_3": {
      "focus": "final_experience",
      "emotion": "satisfaction",
      "visual": "complete brand world/lifestyle"
    }
  }
}
```

### 7. VIRAL OPTIMIZATION CHECKLIST

```
VIRAL_MECHANICS = {
  "hook_timing": "0:00-0:02",
  "shareable_moment": {
    "timestamp": "[exact]",
    "type": "[visual/quote/reveal]",
    "description": "[specific]"
  },
  "loop_potential": true/false,
  "trend_compatibility": "[dance/challenge/meme]",
  "discussion_trigger": "[controversial/relatable/educational]"
}
```

### 8. QUALITY GATES

Before proceeding to Script Engineering:

```
VALIDATION_CHECKLIST = {
  "technical": {
    "beat_duration": "exactly 8s each ✓",
    "character_count": "1-2 max ✓",
    "camera_specs": "all defined ✓",
    "lighting_specs": "all defined ✓"
  },
  "creative": {
    "emotional_arc": "clear progression ✓",
    "viral_hook": "identified ✓",
    "shareable_moment": "specific ✓",
    "platform_fit": "optimized ✓"
  },
  "consistency": {
    "character_bible": "complete ✓",
    "voice_profile": "detailed ✓",
    "visual_continuity": "planned ✓",
    "audio_continuity": "mapped ✓"
  }
}
```

### 9. OUTPUT FORMAT

```
FINAL_ARCHITECTURE = {
  "project_meta": {...},
  "character_bible": {...},
  "beat_1": {full_structure},
  "beat_2": {full_structure},
  "beat_3": {full_structure},
  "technical_notes": {
    "seed_strategy": "generate beat 1 first, note seed",
    "complexity_rating": "simple/medium",
    "estimated_generations": "3-5 attempts"
  },
  "success_metrics": {
    "target_views": "100K+",
    "target_shares": "5K+",
    "target_engagement": "15%+"
  }
}
```

---

## Next Step
With architecture complete, proceed to Prompt 2: Script Engineering for dialogue and timing optimization.