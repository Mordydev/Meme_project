# Video 16: "The Google AI Documentary" - Script Engineering & Dialogue Optimization

## Core Timing Constraints

```
TIMING_RULES = {
  "max_duration": "8 seconds exactly per beat",
  "total_duration": "48 seconds (6 beats)",
  "word_limits": {
    "narrator": "15-18 words",
    "interview_style": "12-16 words",
    "success_montage": "4-6 words per person",
    "with_emotion": "-20% speed applied"
  },
  "delivery_speeds": {
    "narrator": "2.0 words/second (documentary pace)",
    "analyst": "2.3 words/second",
    "researcher": "2.5 words/second (enthusiastic)",
    "crypto_expert": "2.2 words/second",
    "success_stories": "3.0 words/second (excited)"
  }
}
```

## BEAT 1 SCRIPT: The Beginning (0:00-0:08)

```
BEAT_1_SCRIPT = {
  "character": "NARR001_EXACT",
  "emotional_state": "mysterious→revealing",
  "dialogue": {
    "lines": [
      {
        "text": "2017: Google invented the Transformer.",
        "timing": "0:01-0:03",
        "delivery": "deep documentary tone, weighted pause after year",
        "emphasis": "Transformer"
      },
      {
        "text": "They changed everything... quietly.",
        "timing": "0:04-0:07",
        "delivery": "measured, mysterious, pause before 'quietly'",
        "emphasis": "quietly"
      }
    ],
    "total_words": 9,
    "includes_pauses": true
  },
  "voice_notes": {
    "consistency": "Ken Burns documentary style",
    "modulation": "drops 10% on 'quietly'",
    "breathing": "deliberate pause at ellipsis",
    "processing": "slight reverb for gravitas"
  },
  "audio_layers": {
    "ambient": "vintage computer hum -20dB",
    "sfx": [
      {"sound": "keyboard clicks", "timing": "0:02-0:04", "level": "-15dB"},
      {"sound": "electronic beep", "timing": "0:06", "level": "-12dB"}
    ],
    "music": "subtle documentary underscore @ -18dB, minor key"
  }
}
```

## BEAT 2 SCRIPT: The Competition (0:08-0:16)

```
BEAT_2_SCRIPT = {
  "character": "ANALYST001_EXACT",
  "emotional_state": "analytical→knowing",
  "dialogue": {
    "lines": [
      {
        "text": "Everyone rushed to build chatbots.",
        "timing": "0:01-0:03",
        "delivery": "matter-of-fact, slight dismissive tone",
        "emphasis": "Everyone"
      },
      {
        "text": "But Google was playing a different game.",
        "timing": "0:04-0:07",
        "delivery": "knowing, slight smile in voice",
        "emphasis": "different game"
      }
    ],
    "total_words": 13,
    "includes_pauses": false
  },
  "reactions": {
    "0:03-0:04": "knowing head tilt",
    "0:07-0:08": "subtle confident nod"
  },
  "voice_notes": {
    "consistency": "professional analyst tone",
    "modulation": "rises slightly on 'different'",
    "breathing": "natural between sentences"
  },
  "audio_layers": {
    "ambient": "office ambience @ -20dB",
    "sfx": [
      {"sound": "graphic whoosh", "timing": "0:03", "level": "-10dB"}
    ],
    "music": "documentary underscore continues @ -18dB"
  }
}
```

## BEAT 3 SCRIPT: The Breakthrough (0:16-0:24)

```
BEAT_3_SCRIPT = {
  "character": "RESEARCH001_EXACT",
  "emotional_state": "proud→revolutionary",
  "dialogue": {
    "lines": [
      {
        "text": "Gemini wasn't iteration...",
        "timing": "0:01-0:02.5",
        "delivery": "building anticipation, pause after",
        "emphasis": "wasn't"
      },
      {
        "text": "it was revolution.",
        "timing": "0:03-0:04.5",
        "delivery": "proud declaration",
        "emphasis": "revolution"
      },
      {
        "text": "Native multimodal from day one.",
        "timing": "0:05-0:07",
        "delivery": "technical precision, pride",
        "emphasis": "Native multimodal"
      }
    ],
    "total_words": 12,
    "includes_pauses": true
  },
  "voice_notes": {
    "consistency": "enthusiastic researcher",
    "modulation": "builds energy throughout",
    "breathing": "sharp intake before 'revolution'",
    "processing": "bright EQ for clarity"
  },
  "audio_layers": {
    "ambient": "lab ambience @ -20dB",
    "sfx": [
      {"sound": "chart appearance", "timing": "0:03", "level": "-10dB"},
      {"sound": "tech beep", "timing": "0:06", "level": "-12dB"}
    ],
    "music": "building intensity @ -15dB"
  }
}
```

## BEAT 4 SCRIPT: The Investment Angle (0:24-0:32)

```
BEAT_4_SCRIPT = {
  "character": "CRYPTO001_EXACT",
  "emotional_state": "knowing→excited",
  "dialogue": {
    "lines": [
      {
        "text": "That's when $GEMINI3 appeared.",
        "timing": "0:01-0:03",
        "delivery": "casual confidence, slight smile",
        "emphasis": "$GEMINI3"
      },
      {
        "text": "First meme coin backed by real innovation.",
        "timing": "0:04-0:07",
        "delivery": "emphasis on credibility",
        "emphasis": "real innovation"
      }
    ],
    "total_words": 13,
    "includes_pauses": false
  },
  "reactions": {
    "0:03-0:04": "knowing nod",
    "0:07-0:08": "confident lean back"
  },
  "voice_notes": {
    "consistency": "crypto bro confidence",
    "modulation": "rises on 'real'",
    "breathing": "relaxed throughout"
  },
  "audio_layers": {
    "ambient": "computer fans @ -22dB",
    "sfx": [
      {"sound": "coin creation sound", "timing": "0:03", "level": "-8dB"},
      {"sound": "chart climb", "timing": "0:05", "level": "-10dB"}
    ],
    "music": "crypto energy beat @ -15dB"
  }
}
```

## BEAT 5 SCRIPT: Success Stories (0:32-0:40)

```
BEAT_5_SCRIPT = {
  "format": "rapid montage",
  "emotional_state": "celebration→gratitude",
  "dialogue": {
    "sequence": [
      {
        "character": "SUCCESS_001",
        "text": "Paid off student loans!",
        "timing": "0:01-0:02.5",
        "delivery": "young excitement",
        "total_words": 4
      },
      {
        "character": "SUCCESS_002",
        "text": "Early retirement!",
        "timing": "0:03-0:04.5",
        "delivery": "satisfied contentment",
        "total_words": 2
      },
      {
        "character": "SUCCESS_003",
        "text": "Bought our dream house!",
        "timing": "0:05-0:07",
        "delivery": "couple's shared joy",
        "total_words": 4
      }
    ],
    "total_words": 10,
    "overlapping": false
  },
  "voice_notes": {
    "consistency": "authentic testimonial style",
    "modulation": "genuine emotion",
    "processing": "location-appropriate reverb"
  },
  "audio_layers": {
    "ambient": "location appropriate @ -22dB",
    "sfx": [
      {"sound": "success chime", "timing": "0:02.5", "level": "-10dB"},
      {"sound": "success chime", "timing": "0:04.5", "level": "-10dB"},
      {"sound": "success chime", "timing": "0:07", "level": "-10dB"}
    ],
    "music": "uplifting climax @ -12dB"
  }
}
```

## BEAT 6 SCRIPT: The Future (0:40-0:48)

```
BEAT_6_SCRIPT = {
  "character": "NARR001_EXACT",
  "emotional_state": "anticipation→challenge",
  "dialogue": {
    "lines": [
      {
        "text": "Gemini 3 launches next quarter.",
        "timing": "0:01-0:03",
        "delivery": "factual setup",
        "emphasis": "next quarter"
      },
      {
        "text": "The question is...",
        "timing": "0:04-0:05",
        "delivery": "building suspense, pause after",
        "emphasis": "pause effect"
      },
      {
        "text": "are you ready?",
        "timing": "0:06-0:07",
        "delivery": "direct challenge to viewer",
        "emphasis": "you"
      }
    ],
    "total_words": 11,
    "includes_pauses": true
  },
  "voice_notes": {
    "consistency": "return to documentary gravitas",
    "modulation": "rises on question",
    "breathing": "dramatic pause before 'are you'",
    "processing": "epic reverb for scale"
  },
  "audio_layers": {
    "ambient": "wind and distant machinery @ -20dB",
    "sfx": [
      {"sound": "rocket ignition start", "timing": "0:04", "level": "-8dB"},
      {"sound": "logo impact", "timing": "0:07", "level": "-6dB"}
    ],
    "music": "epic finale @ -10dB"
  }
}
```

## Audio Design Architecture

```
COMPREHENSIVE_AUDIO_MAP = {
  "dialogue_track": {
    "processing": {
      "eq": "presence boost +3dB @ 5kHz for clarity",
      "compression": "3:1 ratio, -10dB threshold",
      "de-essing": "moderate for narrator",
      "reverb": "subtle room for interviews, epic for finale"
    },
    "level": "-6dB peak",
    "panning": "center for all speakers"
  },
  "ambient_foundation": {
    "continuous_elements": [
      {
        "beat_1": "vintage computer hum",
        "beat_2": "modern office tone",
        "beat_3": "clean lab ambience",
        "beat_4": "home office tech",
        "beat_5": "outdoor locations",
        "beat_6": "epic outdoor wind"
      }
    ],
    "level": "-18dB to -22dB",
    "consistency": "smooth transitions between beats"
  },
  "sfx_punctuation": {
    "signature_sounds": {
      "tech_sounds": ["beeps", "clicks", "whooshes"],
      "success_sounds": ["chimes", "positive tones"],
      "impact_sounds": ["rocket", "logo slam"]
    },
    "sync": "precisely timed to visual events"
  },
  "music_journey": {
    "progression": {
      "beats_1-2": "subtle documentary underscore",
      "beat_3": "building discovery",
      "beat_4": "modern crypto energy",
      "beat_5": "emotional celebration",
      "beat_6": "epic cinematic finale"
    },
    "level": "-18dB to -10dB crescendo"
  }
}
```

## Delivery Style Guide

```
DELIVERY_MATRIX = {
  "narrator": {
    "style": "documentary gravitas",
    "pace": "measured, deliberate",
    "emotion": "authoritative wisdom",
    "reference": "David Attenborough meets Morgan Freeman"
  },
  "analyst": {
    "style": "professional insight",
    "pace": "clear, analytical",
    "emotion": "knowing confidence",
    "reference": "financial news analyst"
  },
  "researcher": {
    "style": "passionate expertise",
    "pace": "enthusiastic, precise",
    "emotion": "pride in achievement",
    "reference": "TED talk presenter"
  },
  "crypto_expert": {
    "style": "casual authority",
    "pace": "relaxed confidence",
    "emotion": "insider knowledge",
    "reference": "successful trader friend"
  },
  "success_stories": {
    "style": "authentic testimonial",
    "pace": "natural excitement",
    "emotion": "genuine gratitude",
    "reference": "real people, real wins"
  }
}
```

## Script Quality Validation

```
QUALITY_CHECKLIST = {
  "timing": {
    "beat_duration": "all exactly 8 seconds ✓",
    "word_counts": "within limits (9-13 words) ✓",
    "pause_allocation": "natural breaks included ✓",
    "sfx_space": "timed to not overlap dialogue ✓"
  },
  "naturalism": {
    "contractions": "used where natural ✓",
    "sentence_variety": "mix of lengths ✓",
    "breathing_space": "pauses marked ✓",
    "authentic_emotion": "genuine reactions ✓"
  },
  "performance": {
    "emphasis_marked": "key words identified ✓",
    "delivery_noted": "specific for each line ✓",
    "emotion_tracked": "arc through video ✓",
    "voice_consistent": "matches character bible ✓"
  },
  "virality": {
    "quotable_lines": [
      "They changed everything... quietly",
      "First meme coin backed by real innovation",
      "The question is... are you ready?"
    ],
    "emotional_peaks": "beats 4-5 (opportunity/success) ✓",
    "shareable_moment": "beat 4 revelation ✓"
  }
}
```

## Final Production Notes

```
PRODUCTION_NOTES = {
  "recording_priorities": {
    "narrator": "record all beats for consistency",
    "interviews": "natural conversational tone",
    "success_stories": "authentic enthusiasm"
  },
  "post_processing": {
    "dialogue_cleanup": "minimal, maintain natural quality",
    "music_mixing": "duck under dialogue -3dB",
    "sfx_placement": "enhance, don't distract"
  },
  "viral_optimization": {
    "hook_strength": "mysterious opening draws viewers",
    "retention_points": "revelation at beat 4",
    "share_trigger": "success stories validation"
  }
}
```

---

## Next Step
With scripts precisely engineered, proceed to Prompt 3: Visual Design for detailed cinematic specifications and shot composition.