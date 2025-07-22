# Prompt 2: Script Engineering & Dialogue Optimization

## Your Mission
Engineer precise dialogue and audio scripts that work within 8-second constraints while maintaining natural delivery and viral potential. Transform story architecture into executable scripts with exact timing specifications.

## Core Timing Constraints

```
TIMING_RULES = {
  "max_duration": "8 seconds exactly",
  "word_limits": {
    "solo_speaker": "12-18 words",
    "with_pauses": "10-15 words",
    "two_speakers": "8-10 words each",
    "with_sfx": "12-14 words total"
  },
  "delivery_speeds": {
    "relaxed": "2 words/second",
    "normal": "2.5 words/second",
    "rapid": "3 words/second",
    "with_emotion": "-20% speed"
  }
}
```

## Script Structure Templates

### 1. SINGLE CHARACTER SCRIPT

```
BEAT_1_SCRIPT = {
  "character": "CHAR001_EXACT",
  "emotional_state": "curious→shocked",
  "dialogue": {
    "lines": [
      {
        "text": "wait, is that my cat?",
        "timing": "0:00-0:02",
        "delivery": "confused whisper",
        "emphasis": "cat"
      },
      {
        "text": "mr. whiskers, you can talk?!",
        "timing": "0:03-0:05",
        "delivery": "shocked exclamation",
        "emphasis": "talk"
      }
    ],
    "total_words": 11,
    "includes_pauses": true
  },
  "reactions": {
    "0:02-0:03": "stunned pause, jaw drop",
    "0:05-0:08": "backing away slowly"
  },
  "voice_notes": {
    "consistency": "maintain established tone",
    "modulation": "pitch rises 20% when shocked",
    "breathing": "sharp intake at 0:02"
  }
}
```

### 2. MULTI-CHARACTER SCRIPT

```
BEAT_2_SCRIPT = {
  "characters": ["CHAR001_EXACT", "CHAR002_EXACT"],
  "interaction_type": "rapid exchange",
  "dialogue": {
    "exchange": [
      {
        "speaker": "CHAR001",
        "text": "you seeing this?",
        "timing": "0:00-0:01",
        "delivery": "urgent whisper"
      },
      {
        "speaker": "CHAR002",
        "text": "pretend we're not here",
        "timing": "0:01-0:03",
        "delivery": "panicked instruction"
      },
      {
        "speaker": "CHAR001",
        "text": "too late, it saw us!",
        "timing": "0:04-0:06",
        "delivery": "terrified realization"
      }
    ],
    "overlap": "slight overlap at 0:03",
    "total_words": 14
  }
}
```

### 3. COMPILATION SCRIPT TEMPLATE

```
COMPILATION_SCRIPTS = {
  "beat_1_news": {
    "character": "NEWS_ANCHOR_001",
    "dialogue": {
      "text": "breaking: local cat speaks fluent mandarin",
      "timing": "0:01-0:04",
      "delivery": "professional news tone",
      "total_words": 7
    }
  },
  "beat_2_witness": {
    "character": "WITNESS_001",
    "dialogue": {
      "text": "it asked for my wifi password!",
      "timing": "0:01-0:03",
      "delivery": "bewildered excitement",
      "total_words": 7
    }
  },
  "beat_3_expert": {
    "character": "EXPERT_001",
    "dialogue": {
      "text": "this changes everything we know",
      "timing": "0:02-0:05",
      "delivery": "grave academic tone",
      "total_words": 6
    }
  }
}
```

### 4. ANIMATION DIALOGUE

```
ANIMATION_SCRIPT = {
  "character": "ANIMATED_CHAR_001",
  "performance_style": "pixar_expressive",
  "dialogue": {
    "lines": [
      {
        "text": "cookies? where cookies?!",
        "timing": "0:00-0:02",
        "delivery": "frantic excitement",
        "animation": "eyes bulge, bounce"
      },
      {
        "text": "me find all cookies!",
        "timing": "0:03-0:05",
        "delivery": "determined declaration",
        "animation": "chest puff, point"
      }
    ],
    "voice_character": {
      "style": "monster_voice",
      "pitch": "low gravelly",
      "quirks": ["third person", "drops articles"]
    }
  }
}
```

### 5. COMMERCIAL SCRIPT

```
COMMERCIAL_SCRIPT = {
  "beat_structure": "problem→discovery→solution",
  "dialogue": {
    "beat_1": {
      "text": "another spill? seriously?",
      "timing": "0:02-0:04",
      "delivery": "frustrated sigh",
      "visual": "stain spreading"
    },
    "beat_2": {
      "text": "wait, what's this?",
      "timing": "0:01-0:03",
      "delivery": "curious discovery",
      "visual": "product appears"
    },
    "beat_3": {
      "text": "gone! just like that!",
      "timing": "0:02-0:04",
      "delivery": "amazed satisfaction",
      "visual": "transformation"
    }
  }
}
```

## Audio Layer Architecture

### COMPREHENSIVE AUDIO MAP

```
AUDIO_DESIGN = {
  "dialogue_track": {
    "processing": {
      "eq": "presence boost +3dB @ 5kHz",
      "compression": "3:1 ratio, -10dB threshold",
      "de-essing": "moderate"
    },
    "level": "-6dB peak",
    "panning": "center"
  },
  "ambient_track": {
    "elements": [
      {
        "sound": "room tone",
        "level": "-18dB",
        "constant": true
      },
      {
        "sound": "traffic distant",
        "level": "-24dB",
        "panning": "30% left"
      }
    ]
  },
  "sfx_track": {
    "spot_effects": [
      {
        "sound": "door creak",
        "timing": "0:02.5",
        "level": "-9dB",
        "duration": "1.5s"
      },
      {
        "sound": "footsteps",
        "timing": "0:05-0:08",
        "level": "-15dB",
        "sync": "to movement"
      }
    ]
  },
  "music_track": {
    "style": "minimal tension",
    "elements": {
      "bass": "sub pulse @ 60bpm",
      "texture": "atmospheric pad",
      "dynamics": "crescendo 0:05-0:08"
    },
    "level": "-15dB",
    "eq": "high-pass @ 80Hz"
  }
}
```

### DIALOGUE DELIVERY MATRIX

```
DELIVERY_STYLES = {
  "natural": {
    "pace": "conversational",
    "includes": ["ums", "pauses", "breaths"],
    "pitch_variation": "15-20%"
  },
  "commercial": {
    "pace": "upbeat confident",
    "includes": ["enthusiasm", "smile in voice"],
    "pitch_variation": "25-30%"
  },
  "dramatic": {
    "pace": "measured intense",
    "includes": ["weighted pauses", "breath control"],
    "pitch_variation": "30-40%"
  },
  "animated": {
    "pace": "energetic varied",
    "includes": ["character quirks", "exaggeration"],
    "pitch_variation": "40-60%"
  }
}
```

## Content-Specific Templates

### INTERVIEW FORMAT
```
INTERVIEW_SCRIPT = {
  "format": "question_response",
  "timing_pattern": {
    "question": "0:00-0:02 (5-7 words)",
    "pause": "0:02-0:03",
    "answer": "0:03-0:07 (10-12 words)",
    "reaction": "0:07-0:08"
  },
  "authenticity_markers": [
    "slight overlap",
    "thinking pause",
    "natural fumble"
  ]
}
```

### TRAILER FORMAT
```
TRAILER_SCRIPT = {
  "structure": "escalating_intensity",
  "beat_1": {
    "text": "they said it was impossible",
    "music": "low drone",
    "delivery": "mysterious"
  },
  "beat_2": {
    "text": "they were wrong",
    "music": "building percussion",
    "delivery": "confident"
  },
  "beat_3": {
    "text": "everything changes now",
    "music": "full orchestral hit",
    "delivery": "epic declaration"
  }
}
```

## Script Quality Checklist

```
QUALITY_VALIDATION = {
  "timing": {
    "total_duration": "≤ 8 seconds ✓",
    "word_count": "within limits ✓",
    "pause_allocation": "included ✓",
    "sfx_space": "accommodated ✓"
  },
  "naturalism": {
    "contractions": "used appropriately ✓",
    "sentence_fragments": "where natural ✓",
    "filler_words": "sparingly included ✓",
    "breathing_space": "allocated ✓"
  },
  "performance": {
    "emphasis_marked": "clear ✓",
    "delivery_noted": "specific ✓",
    "emotion_tracked": "throughout ✓",
    "voice_consistent": "with bible ✓"
  },
  "virality": {
    "quotable_line": "identified ✓",
    "emotional_peak": "placed well ✓",
    "shareable_moment": "emphasized ✓"
  }
}
```

## Script Optimization Rules

1. **Lowercase Convention**: Never use ALL CAPS for emphasis (reads unnaturally)
2. **Punctuation Power**: Use ! ? ... for emotional guidance
3. **Delivery Notes**: Specify (whispered), (shouted), (sarcastic)
4. **Timing Precision**: Mark to 0.5s accuracy
5. **Word Economy**: Every word must earn its place

## Final Script Output Format

```
FINAL_SCRIPT_BEAT = {
  "beat_id": "001",
  "duration": "8s",
  "characters": ["CHAR001_EXACT"],
  "dialogue": {
    "formatted_text": "wait... is that real?",
    "word_count": 4,
    "timing": "0:01-0:03",
    "delivery": "stunned whisper"
  },
  "audio_layers": {
    "ambient": "office hum -18dB",
    "sfx": ["gasp @ 0:00", "chair squeak @ 0:03"],
    "music": "tension build from 0:04"
  },
  "performance_notes": {
    "energy": "builds from 3 to 8",
    "focal_point": "off-camera right",
    "physical": "lean forward slowly"
  },
  "viral_moment": "0:03 - the realization"
}
```

---

## Next Step
With scripts engineered, proceed to Prompt 3: Visual Design for cinematic specifications.