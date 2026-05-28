# Prompt 5: Variation Engineering & Testing

## Your Mission
Create strategic variations that test different creative hypotheses while maintaining technical consistency. Each variation explores a unique approach to maximize viral potential through structured testing.

## CRITICAL Audio Formatting Warning
**Veo 3 reads SPOKEN text literally:**
- ALL CAPS DIALOGUE = T H I S (letter by letter audio reading)
- Only use ALL CAPS in dialogue when you want letter-by-letter pronunciation
- VISUAL text/logos like "GEMINI" are fine (seen, not spoken)
- This ONLY affects spoken dialogue and character speech

## Character Consistency Requirements
**Every Beat, Every Variation Must Include:**
- Complete character description (never "same as previous")
- Gender specification (male/female) and exact age
- Full appearance details copied word-for-word
- This ensures consistency across all test variations

## Audio vs Visual Text Examples

### CORRECT - Dialogue Formatting:
```json
{
  "dialogue": "This is amazing!",
  "character_speech": "I can't believe this happened!",
  "voiceover": "The story begins here..."
}
```

### CORRECT - Visual Text (Perfectly Fine):
```json
{
  "logo": "GEMINI",
  "title_card": "THE BIG REVEAL", 
  "company_name": "ACME CORP",
  "product_label": "PREMIUM QUALITY"
}
```

### INCORRECT - Dialogue Will Read Letter by Letter:
```json
{
  "dialogue": "THIS IS AMAZING!", ← Spoken as "T H I S  I S  A M A Z I N G"
  "character_speech": "I CAN'T BELIEVE THIS!", ← Spoken as "I  C A N T  B E L I E V E  T H I S"
  "voiceover": "THE STORY BEGINS HERE" ← Spoken as "T H E  S T O R Y  B E G I N S  H E R E"
}
```

### Character Consistency Example Across Variations

#### Hero Version:
```json
{
  "beat_1": {
    "character": "Emma Rodriguez, 32-year-old female, curly brown hair to shoulders, wearing red sweater and black jeans, gold hoop earrings, natural makeup",
    "dialogue": "wait, what's happening?"
  },
  "beat_2": {
    "character": "Emma Rodriguez, 32-year-old female, curly brown hair to shoulders, wearing red sweater and black jeans, gold hoop earrings, natural makeup",
    "dialogue": "this can't be real..."
  }
}
```

#### Comedy Variation:
```json
{
  "beat_1": {
    "character": "Emma Rodriguez, 32-year-old female, curly brown hair to shoulders, wearing red sweater and black jeans, gold hoop earrings, natural makeup",
    "dialogue": "oh, come on! seriously?!"
  },
  "beat_2": {
    "character": "Emma Rodriguez, 32-year-old female, curly brown hair to shoulders, wearing red sweater and black jeans, gold hoop earrings, natural makeup", 
    "dialogue": "this is so typical..."
  }
}
```

Note: Character description stays IDENTICAL, only dialogue/performance changes.

## Transformation Variations (NEW)

### TRANSFORMATION STYLE VARIATIONS
```json
{
  "transformation_variations": {
    "hero_transformation": {
      "style": "elegant_minimalist",
      "keywords": ["16:9", "premium aesthetic", "fluid assembly", "elegant motion", "soft lighting", "no hard cuts", "calm luxury"],
      "timing": "measured, graceful progression",
      "particle_behavior": "precise, controlled formation",
      "audio_approach": "subtle, sophisticated"
    },
    "variation_a_dynamic": {
      "style": "energetic_explosive",  
      "keywords": ["16:9", "dynamic energy", "rapid assembly", "explosive motion", "dramatic lighting", "high intensity", "exciting transformation"],
      "timing": "fast-paced, immediate impact",
      "particle_behavior": "chaotic burst then rapid convergence",
      "audio_approach": "powerful, building crescendo"
    },
    "variation_b_mystical": {
      "style": "ethereal_magical",
      "keywords": ["16:9", "mystical atmosphere", "magical formation", "ethereal motion", "enchanted lighting", "dreamy transformation", "otherworldly"],
      "timing": "floating, dreamlike pace",
      "particle_behavior": "swirling, gravity-defying patterns",
      "audio_approach": "atmospheric, mysterious tones"
    },
    "variation_c_technical": {
      "style": "precise_mechanical",
      "keywords": ["16:9", "technical precision", "mechanical assembly", "precise motion", "clinical lighting", "engineered transformation", "scientific"],
      "timing": "systematic, step-by-step progression",
      "particle_behavior": "geometric, mathematical patterns",
      "audio_approach": "mechanical sounds, precise timing"
    }
  }
}
```

### KEYWORDS VARIATION STRATEGY
```json
{
  "keyword_variation_approach": {
    "core_constants": ["16:9", "no text", "8 seconds", "continuous shot"],
    "style_variables": {
      "elegant": ["premium aesthetic", "soft lighting", "calm luxury"],
      "dynamic": ["high energy", "explosive motion", "dramatic lighting"],
      "mystical": ["magical atmosphere", "ethereal motion", "otherworldly"],
      "technical": ["precision", "mechanical", "engineered"]
    },
    "motion_variables": {
      "fluid": ["fluid assembly", "elegant motion", "smooth transitions"],
      "explosive": ["rapid assembly", "explosive motion", "dynamic energy"],
      "floating": ["magical formation", "ethereal motion", "gravity-defying"],
      "mechanical": ["mechanical assembly", "precise motion", "systematic"]
    },
    "mood_variables": {
      "luxury": ["calm luxury", "premium feel", "sophisticated"],
      "excitement": ["high intensity", "exciting transformation", "energetic"],
      "mystery": ["mystical atmosphere", "dreamy transformation", "enchanted"],
      "precision": ["clinical accuracy", "scientific approach", "engineered"]
    }
  }
}
```

## Enhanced Variation Strategy Framework

### CORE VARIATION PRINCIPLES

```json
{
  "variation_strategy": {
    "absolute_constants": {
      "character_description": "NEVER changes - word for word identical",
      "core_keywords": ["16:9", "no text", "8 seconds", "continuous shot"],
      "duration": "8 seconds exact",
      "technical_feasibility": "within Veo 3 capabilities"
    },
    "strategic_variables": {
      "transformation_style": ["elegant", "dynamic", "mystical", "technical"],
      "energy_approach": ["building", "explosive", "floating", "systematic"],
      "visual_treatment": ["premium", "energetic", "ethereal", "clinical"],
      "audio_personality": ["sophisticated", "powerful", "atmospheric", "mechanical"]
    },
    "keyword_evolution": {
      "base_set": "core constants maintained",
      "style_adaptation": "keywords change to match variation theme",
      "consistency_rule": "each variation has complete keyword set"
    }
  }
}
```

### VARIATION TEMPLATES

#### 🎯 HERO VERSION (Baseline)
```
HERO_TEMPLATE = {
  "approach": "balanced_universal",
  "characteristics": {
    "emotion": "relatable journey",
    "pacing": "standard curve",
    "style": "natural authentic",
    "energy": [5, 6, 7, 8]
  },
  "target_audience": "broad appeal",
  "viral_mechanism": "emotional recognition"
}
```

#### 🎭 VARIATION A: Comedy Optimization
```
VAR_A_COMEDY = {
  "approach": "humor_forward",
  "modifications": {
    "timing": "+15% pace, snap cuts",
    "dialogue": "punchier, setup-payoff",
    "reactions": "exaggerated 20%",
    "sfx": "comedic punctuation"
  },
  "structure": {
    "beat_1": "setup absurdity",
    "beat_2": "escalate ridiculous",
    "beat_3": "unexpected payoff"
  },
  "example_shift": {
    "hero": "oh no, not again...",
    "comedy": "seriously?! AGAIN?! *throws hands up*"
  }
}
```

#### 🌟 VARIATION B: Dramatic Intensity
```
VAR_B_DRAMATIC = {
  "approach": "emotion_maximized",
  "modifications": {
    "pacing": "-10% slower, weighted pauses",
    "lighting": "contrast ratio 6:1",
    "music": "orchestral underScore",
    "delivery": "measured intensity"
  },
  "structure": {
    "beat_1": "tension establishment",
    "beat_2": "stakes escalation", 
    "beat_3": "cathartic resolution"
  },
  "example_shift": {
    "hero": "i can't believe it",
    "dramatic": "no... this changes everything"
  }
}
```

#### 🚀 VARIATION C: Platform-Specific
```
VAR_C_PLATFORM = {
  "tiktok_optimized": {
    "hook": "0.5s visual grab",
    "pacing": "rapid fire",
    "loop": "seamless design",
    "trend": "dance/challenge ready"
  },
  "instagram_optimized": {
    "aesthetic": "color coordinated",
    "saves": "value proposition",
    "stories": "swipe-up ready"
  },
  "youtube_optimized": {
    "retention": "mini cliffhangers",
    "thumbnail": "peak moment",
    "description": "seo keywords"
  }
}
```

## Beat-by-Beat Variation Structure

### BEAT 1 VARIATIONS

```
BEAT_1_VARIATIONS = {
  "hero": {
    "emotion": "curious discovery",
    "dialogue": "wait, is that... moving?",
    "delivery": "natural wonder",
    "timing": "steady reveal",
    "energy": 5
  },
  "var_a_comedy": {
    "emotion": "comic disbelief",
    "dialogue": "nope. nope nope nope!",
    "delivery": "rapid panic",
    "timing": "quick cuts",
    "energy": 8
  },
  "var_b_dramatic": {
    "emotion": "dread realization",
    "dialogue": "it's happening... again",
    "delivery": "haunted whisper",
    "timing": "slow burn",
    "energy": 3
  },
  "var_c_tiktok": {
    "emotion": "instant hook",
    "dialogue": "you won't believe this!",
    "delivery": "direct address",
    "timing": "immediate",
    "energy": 9
  }
}
```

### STRUCTURED VARIATION OUTPUT

```
VARIATION_OUTPUT = {
  "beat_1": {
    "all_versions": {
      "character": "CHAR001_EXACT [full description copied]",
      "scene": "[same location all versions]",
      "technical": "[same camera/lighting]"
    },
    "hero": {
      "script": "[baseline dialogue]",
      "performance": "[baseline energy]",
      "audio": "[baseline mix]"
    },
    "variations": {
      "a": {
        "script": "[comedy dialogue]",
        "changes": ["timing", "delivery", "sfx"],
        "expected_result": "+30% shares"
      },
      "b": {
        "script": "[dramatic dialogue]",
        "changes": ["pacing", "music", "pauses"],
        "expected_result": "+40% completion"
      },
      "c": {
        "script": "[platform dialogue]",
        "changes": ["hook", "energy", "direct"],
        "expected_result": "+50% engagement"
      }
    }
  }
}
```

## Variation Testing Matrix

### A/B/C TEST SCENARIOS

```
TEST_MATRIX = {
  "scenario_1_opening": {
    "test": "hook strength",
    "hero": "2 second hook",
    "var_a": "0.5 second hook",
    "var_b": "mystery hook",
    "var_c": "action hook",
    "metric": "scroll-stop rate"
  },
  "scenario_2_emotion": {
    "test": "emotional resonance",
    "hero": "balanced",
    "var_a": "humor forward",
    "var_b": "drama forward",
    "var_c": "surprise forward",
    "metric": "completion rate"
  },
  "scenario_3_share": {
    "test": "virality trigger",
    "hero": "relatable moment",
    "var_a": "memeable quote",
    "var_b": "emotional peak",
    "var_c": "challenge prompt",
    "metric": "share rate"
  }
}
```

### DIALOGUE VARIATION EXAMPLES

```
DIALOGUE_VARIATIONS = {
  "situation": "discovering AI can cook",
  
  "hero": {
    "text": "it's actually... good?",
    "tone": "surprised",
    "pace": "normal"
  },
  
  "comedy": {
    "text": "gordon ramsay is SHAKING!",
    "tone": "mock dramatic",
    "pace": "punchy"
  },
  
  "dramatic": {
    "text": "this changes everything",
    "tone": "profound realization",
    "pace": "slow, weighted"
  },
  
  "gen_z": {
    "text": "no cap, this slaps",
    "tone": "casual impressed",
    "pace": "quick, natural"
  }
}
```

## Variation Selection Interface

### USER SELECTION FRAMEWORK

```
SELECTION_TEMPLATE = """
## Choose Your Winning Combination!

### BEAT 1 SELECTION:
□ 🎯 HERO - Balanced universal appeal
□ 🎭 VAR A - Comedy maximized  
□ 🌟 VAR B - Drama intensified
□ 🚀 VAR C - Platform optimized

Your choice: _____

### BEAT 2 SELECTION:
□ 🎯 HERO - Continues baseline
□ 🎭 VAR A - Escalates comedy
□ 🌟 VAR B - Deepens emotion
□ 🚀 VAR C - Platform native
□ 🎬 NEW SCENE - Different perspective

Your choice: _____

### MIX & MATCH OPTIONS:
□ Consistent approach (all Hero/A/B/C)
□ Building approach (Hero→A→B)
□ Contrast approach (A→B→A)
□ Custom mix: B1[_] B2[_] B3[_]
"""
```

## Technical Variation Constraints

### WHAT STAYS CONSTANT

```
LOCKED_ELEMENTS = {
  "character": {
    "description": "word-for-word identical",
    "voice_character": "same profile",
    "continuity": "appearance locked"
  },
  "technical": {
    "resolution": "1280x720",
    "fps": "24",
    "duration": "8.0s exactly",
    "aspect": "16:9"
  },
  "quality": {
    "no_subtitles": "enforced",
    "sync": "frame accurate",
    "consistency": "paramount"
  }
}
```

### WHAT CAN CHANGE

```
VARIABLE_ELEMENTS = {
  "performance": {
    "energy_level": [1-10],
    "delivery_style": ["natural", "theatrical", "deadpan"],
    "pacing": ["rushed", "measured", "varied"]
  },
  "audio": {
    "music_genre": ["minimal", "orchestral", "electronic"],
    "sfx_style": ["realistic", "comedic", "dramatic"],
    "mix_approach": ["dialogue_forward", "atmospheric", "punchy"]
  },
  "editing": {
    "cut_timing": ["smooth", "snappy", "languid"],
    "rhythm": ["consistent", "building", "staccato"]
  }
}
```

## Variation Documentation

### GENERATION TRACKING

```
VARIATION_LOG = {
  "test_round_1": {
    "hero": {
      "seed": "random",
      "result": "baseline established",
      "metrics": {"engagement": "12%"}
    },
    "var_a": {
      "seed": "random", 
      "result": "comedy landed",
      "metrics": {"engagement": "18%"}
    }
  },
  "insights": {
    "winner": "var_a",
    "learning": "comedy +50% engagement",
    "next_test": "comedy variations"
  }
}
```

## Quality Control

### VARIATION CHECKLIST

```
VARIATION_QC = {
  "consistency": {
    "character_exact": "✓ all versions",
    "scene_matching": "✓ all versions",
    "technical_specs": "✓ all versions"
  },
  "differentiation": {
    "unique_approach": "✓ each version",
    "clear_hypothesis": "✓ each version",
    "measurable_diff": "✓ each version"
  },
  "feasibility": {
    "within_8s": "✓ all versions",
    "veo3_capable": "✓ all versions",
    "complexity_ok": "✓ all versions"
  }
}
```

---

## Next Step
After selecting preferred variations, proceed to Prompt 6: Final Enhancement for optimization and polish.