# /variation-engineering Task

When this command is used, execute the following task:

# Strategic Variation Engineering & Testing

## Purpose
Create strategic variations that test different creative hypotheses while maintaining technical consistency, maximizing viral potential through structured A/B/C testing.

## Critical Requirements

### Audio Formatting Rules
**CRITICAL - Veo 3 Audio Warning:**
- ALL CAPS DIALOGUE = T H I S (letter by letter audio)
- Only use ALL CAPS when you WANT letter-by-letter
- Visual text/logos in ALL CAPS are fine
- Check every dialogue variation

### Character Consistency Rules
**EVERY Variation Must Include:**
- Complete character description in every beat
- Gender (male/female) and exact age
- Full appearance copied word-for-word
- ONLY performance/dialogue changes between variations

## Process

### Step 1: Identify Variable Elements

**What MUST Stay Constant:**
```json
{
  "locked_elements": {
    "character_description": "word-for-word identical",
    "technical_specs": "8 seconds, 16:9, 24fps",
    "core_keywords": ["16:9", "no text", "8 seconds"],
    "scene_location": "same environment",
    "visual_continuity": "same props/setting"
  }
}
```

**What CAN Change:**
```json
{
  "variable_elements": {
    "dialogue_content": "different words/approach",
    "delivery_style": "energy/pace/emotion",
    "keywords_style": "style-specific keywords",
    "music_genre": "different emotional support",
    "sfx_style": "comedic vs dramatic",
    "timing_rhythm": "pacing variations"
  }
}
```

### Step 2: Define Variation Strategies

#### Hero Version (Baseline)
```json
{
  "hero_version": {
    "approach": "balanced_universal",
    "target": "broad appeal",
    "characteristics": {
      "emotion": "relatable journey",
      "pacing": "standard curve",
      "energy": "[5, 6, 7, 8]",
      "keywords": ["balanced", "authentic", "relatable"]
    },
    "expected_metrics": {
      "completion": "baseline",
      "shares": "baseline",
      "engagement": "12-15%"
    }
  }
}
```

#### Variation A: Comedy Optimization
```json
{
  "variation_a_comedy": {
    "approach": "humor_forward",
    "target": "share maximization",
    "modifications": {
      "dialogue": {
        "hero": "oh no, not again...",
        "comedy": "seriously?! AGAIN?! *throws hands*"
      },
      "timing": "+15% pace, snap cuts",
      "reactions": "exaggerated 20%",
      "sfx": "comedic punctuation",
      "keywords": ["comedy", "humor", "funny", "hilarious"]
    },
    "structure": {
      "beat_1": "setup absurdity",
      "beat_2": "escalate ridiculous",
      "beat_3": "unexpected payoff"
    },
    "expected_lift": "+30% shares"
  }
}
```

#### Variation B: Dramatic Intensity
```json
{
  "variation_b_dramatic": {
    "approach": "emotion_maximized",
    "target": "completion rate",
    "modifications": {
      "dialogue": {
        "hero": "i can't believe it",
        "dramatic": "no... this changes everything"
      },
      "pacing": "-10% slower, weighted pauses",
      "lighting": "contrast ratio 6:1",
      "music": "orchestral underscore",
      "keywords": ["dramatic", "emotional", "intense", "cinematic"]
    },
    "structure": {
      "beat_1": "tension establishment",
      "beat_2": "stakes escalation",
      "beat_3": "cathartic resolution"
    },
    "expected_lift": "+40% completion"
  }
}
```

#### Variation C: Platform-Specific
```json
{
  "variation_c_platform": {
    "tiktok_optimized": {
      "modifications": {
        "hook": "0.5s immediate grab",
        "dialogue": "you won't believe this!",
        "pacing": "rapid fire",
        "loop": "seamless design",
        "keywords": ["trending", "viral", "tiktok", "fyp"]
      },
      "expected_lift": "+50% engagement"
    },
    "youtube_optimized": {
      "modifications": {
        "thumbnail_moment": "peak at 0:02",
        "retention": "mini cliffhangers",
        "pacing": "building tension",
        "keywords": ["youtube", "story", "complete"]
      },
      "expected_lift": "+35% retention"
    }
  }
}
```

### Step 3: Transformation Variations (If Applicable)

```json
{
  "transformation_variations": {
    "hero": {
      "style": "elegant_minimalist",
      "keywords": ["fluid assembly", "elegant motion", "soft lighting"],
      "particle_behavior": "controlled formation",
      "audio": "subtle sophisticated"
    },
    "var_a_dynamic": {
      "style": "energetic_explosive",
      "keywords": ["rapid assembly", "explosive motion", "dramatic lighting"],
      "particle_behavior": "chaotic burst",
      "audio": "powerful crescendo"
    },
    "var_b_mystical": {
      "style": "ethereal_magical",
      "keywords": ["magical formation", "ethereal motion", "enchanted lighting"],
      "particle_behavior": "floating patterns",
      "audio": "atmospheric mysterious"
    }
  }
}
```

### Step 4: Create Beat-by-Beat Variations

**Example Beat 1 Variations:**
```json
{
  "beat_1_all_variations": {
    "constant_elements": {
      "character": "Emma Rodriguez, 28-year-old female, curly brown hair to shoulders, wearing red sweater and black jeans, gold hoop earrings, natural makeup",
      "scene": "bedroom morning",
      "camera": "50mm medium close-up"
    },
    "hero": {
      "dialogue": "wait, is that... moving?",
      "delivery": "natural wonder",
      "energy": 5,
      "keywords_add": ["authentic", "relatable"]
    },
    "variation_a": {
      "dialogue": "nope. nope nope nope!",
      "delivery": "rapid panic comedy",
      "energy": 8,
      "keywords_add": ["comedy", "funny"]
    },
    "variation_b": {
      "dialogue": "it's happening... again",
      "delivery": "haunted whisper",
      "energy": 3,
      "keywords_add": ["dramatic", "mysterious"]
    },
    "variation_c": {
      "dialogue": "you won't believe this!",
      "delivery": "direct to camera",
      "energy": 9,
      "keywords_add": ["viral", "trending"]
    }
  }
}
```

### Step 5: Testing Matrix Creation

```json
{
  "A_B_C_TEST_MATRIX": {
    "test_1_hook": {
      "hypothesis": "faster hook increases scroll-stop",
      "hero": "2 second hook",
      "var_a": "0.5 second hook",
      "var_b": "mystery hook",
      "var_c": "action hook",
      "metric": "scroll-stop rate"
    },
    "test_2_emotion": {
      "hypothesis": "emotion type affects completion",
      "hero": "balanced",
      "var_a": "humor forward",
      "var_b": "drama forward",
      "var_c": "surprise forward",
      "metric": "completion rate"
    },
    "test_3_share": {
      "hypothesis": "trigger type affects virality",
      "hero": "relatable moment",
      "var_a": "memeable quote",
      "var_b": "emotional peak",
      "var_c": "challenge prompt",
      "metric": "share rate"
    }
  }
}
```

### Step 6: Dialogue Variation Examples

```json
{
  "dialogue_variations": {
    "situation": "discovering something unexpected",
    "hero": {
      "text": "wait... is that real?",
      "tone": "surprised curiosity",
      "keywords": ["authentic"]
    },
    "comedy": {
      "text": "okay universe, very funny!",
      "tone": "sarcastic humor",
      "keywords": ["comedy", "sarcastic"]
    },
    "dramatic": {
      "text": "this changes everything",
      "tone": "profound realization",
      "keywords": ["dramatic", "intense"]
    },
    "gen_z": {
      "text": "no way this is real",
      "tone": "casual disbelief",
      "keywords": ["relatable", "young"]
    }
  }
}
```

### Step 7: Quality Control Per Variation

**Variation Checklist:**
```
For EACH Variation:
- [ ] Character description identical
- [ ] No ALL CAPS in dialogue (unless intentional)
- [ ] Keywords appropriate to style
- [ ] Core keywords present
- [ ] Technical specs maintained
- [ ] Clear hypothesis defined
- [ ] Metrics identified
- [ ] Expected lift documented
```

### Step 8: Mix & Match Options

```
COMBINATION_STRATEGIES:
1. Consistent Approach
   - All Hero: Safe baseline
   - All A: Maximum comedy
   - All B: Maximum drama
   - All C: Platform optimized

2. Building Approach
   - Hero → A → B: Escalating energy
   - B → A → Hero: Tension release
   - C → Hero → C: Platform sandwich

3. Custom Mix
   - Beat 1: Hook optimization (C)
   - Beat 2: Emotional depth (B)
   - Beat 3: Shareable payoff (A)
```

### Step 9: Documentation & Tracking

```json
{
  "variation_documentation": {
    "test_name": "Comedy vs Drama vs Platform",
    "test_date": "[date]",
    "variations_created": {
      "hero": "baseline_v1",
      "var_a": "comedy_v1",
      "var_b": "drama_v1",
      "var_c": "tiktok_v1"
    },
    "hypothesis": {
      "var_a": "comedy increases shares",
      "var_b": "drama increases completion",
      "var_c": "platform native increases engagement"
    },
    "seeds": {
      "successful": "[document seeds]",
      "notes": "seed X = best expressions"
    }
  }
}
```

### Step 10: Output Variation Package

```json
{
  "VARIATION_PACKAGE": {
    "hero_version": {
      "prompts": "[complete beat prompts]",
      "keywords": "[full keyword list]",
      "expected_performance": "baseline"
    },
    "variation_a": {
      "prompts": "[complete beat prompts]",
      "keywords": "[full keyword list]",
      "changes": "[list of modifications]",
      "expected_lift": "+X%"
    },
    "variation_b": {
      "prompts": "[complete beat prompts]",
      "keywords": "[full keyword list]",
      "changes": "[list of modifications]",
      "expected_lift": "+Y%"
    },
    "variation_c": {
      "prompts": "[complete beat prompts]",
      "keywords": "[full keyword list]",
      "changes": "[list of modifications]",
      "expected_lift": "+Z%"
    },
    "testing_plan": {
      "metrics": "[what to measure]",
      "duration": "[test period]",
      "success_criteria": "[definitions]"
    }
  }
}
```

## Selection Interface

Present to user:
```
## Choose Your Variation Strategy:

BEAT 1 OPTIONS:
□ 🎯 HERO - Balanced universal appeal
□ 🎭 VAR A - Comedy maximized  
□ 🌟 VAR B - Drama intensified
□ 🚀 VAR C - Platform optimized

Your choice for Beat 1: _____

[Repeat for each beat]

MIX STRATEGY:
□ Consistent (all same variation)
□ Building (progressive energy)
□ Custom mix (specify per beat)
```

## Key Principles
- Character consistency is absolute
- Only dialogue/performance varies
- Clear hypothesis for each variation
- Keywords match variation style
- Test one variable at a time
- Document everything for learning