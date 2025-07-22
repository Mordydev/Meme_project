# Video 34: Script Engineering & Dialogue Optimization
## "Types of People During Google Announcements"

## Core Timing Constraints

```
TIMING_RULES = {
  "total_duration": "24 seconds (3 × 8-second beats)",
  "word_limits": {
    "beat_1_skeptic": "15 words (measured delivery)",
    "beat_2_fanboy": "12 words (rapid fire)",
    "beat_3_holder": "3 words (minimal, impactful)"
  },
  "delivery_speeds": {
    "skeptic": "2 words/second (deliberate)",
    "fanboy": "3 words/second (manic)",
    "holder": "1 word/second (calm)"
  }
}
```

## Beat 1: The Skeptic Script

```
BEAT_1_SCRIPT = {
  "character": "SKEPTIC_42_EXACT",
  "emotional_state": "dismissive→slightly rattled",
  "dialogue": {
    "main_line": {
      "text": "Google always overpromises. I'll believe it when I see it.",
      "timing": "0:02-0:05",
      "delivery": "world-weary dismissal",
      "emphasis": "always, believe",
      "word_count": 11
    },
    "non_verbal": {
      "0:00-0:02": "watching with skeptical expression",
      "0:01": "dismissive scoff",
      "0:05-0:06": "dismissive hand wave",
      "0:06-0:08": "return to work, slight hesitation"
    }
  },
  "subtext": {
    "underlying": "been burned before",
    "facade": "protecting ego",
    "truth": "slight FOMO creeping in"
  },
  "voice_notes": {
    "tone": "corporate cynicism",
    "cadence": "measured, authoritative",
    "volume": "conversational",
    "quality": "slight condescension"
  }
}
```

## Beat 2: The Fanboy Script

```
BEAT_2_SCRIPT = {
  "character": "FANBOY_24_EXACT",
  "emotional_state": "excited→transcendent",
  "dialogue": {
    "main_line": {
      "text": "GOOGLE IS TAKING OVER! THIS CHANGES EVERYTHING!",
      "timing": "0:02-0:05",
      "delivery": "breathless evangelical",
      "emphasis": "EVERYTHING",
      "word_count": 8
    },
    "additional_vocalizations": {
      "0:00-0:02": "gasps, 'oh my god'",
      "0:05-0:08": "continued exclamations"
    }
  },
  "physical_energy": {
    "0:00-0:02": "leaning into screens",
    "0:02-0:05": "jumping up, gesticulating",
    "0:05-0:08": "frantic sharing/typing"
  },
  "voice_notes": {
    "tone": "religious fervor",
    "cadence": "rapid, breathless",
    "volume": "shouting",
    "quality": "voice cracking with emotion"
  }
}
```

## Beat 3: The $GEMINI3 Holder Script

```
BEAT_3_SCRIPT = {
  "character": "HOLDER_31_EXACT",
  "emotional_state": "calm→quietly satisfied",
  "dialogue": {
    "main_line": {
      "text": "Right on schedule",
      "timing": "0:05-0:06",
      "delivery": "understated confidence",
      "emphasis": "schedule",
      "word_count": 3
    },
    "silence_power": {
      "0:00-0:05": "quiet observation",
      "0:06-0:08": "return to coffee"
    }
  },
  "minimal_actions": {
    "0:00": "sipping coffee",
    "0:01-0:02": "phone notification check",
    "0:03-0:04": "small smile grows",
    "0:07": "app closed, day continues"
  },
  "voice_notes": {
    "tone": "zen master energy",
    "cadence": "perfectly timed",
    "volume": "quiet, almost to self",
    "quality": "complete confidence"
  },
  "final_element": {
    "text_overlay": "Which one are you?",
    "timing": "0:07-0:08",
    "purpose": "audience engagement"
  }
}
```

## Audio Layer Architecture

### Beat 1: Skeptic Environment

```
BEAT_1_AUDIO = {
  "dialogue_track": {
    "processing": "slight room reverb",
    "eq": "corporate presence",
    "compression": "broadcast standard"
  },
  "ambient_track": {
    "office_atmosphere": {
      "elements": ["keyboard clicks", "hvac hum", "distant phones"],
      "level": "-20dB",
      "character": "corporate sterility"
    }
  },
  "sfx_track": {
    "personality_sounds": [
      {"sound": "skeptical scoff", "timing": "0:01", "level": "-12dB"},
      {"sound": "dismissive tongue click", "timing": "0:04", "level": "-14dB"},
      {"sound": "keyboard return", "timing": "0:06-0:08", "level": "-15dB"}
    ]
  }
}
```

### Beat 2: Fanboy Chaos

```
BEAT_2_AUDIO = {
  "dialogue_track": {
    "processing": "close mic energy",
    "eq": "presence boost excitement",
    "dynamics": "allowing peaks"
  },
  "ambient_track": {
    "tech_cave": {
      "elements": ["computer fans", "notification sounds", "stream audio"],
      "level": "-18dB",
      "character": "information overload"
    }
  },
  "sfx_track": {
    "manic_energy": [
      {"sound": "chair spinning", "timing": "0:03", "level": "-14dB"},
      {"sound": "keyboard smashing", "timing": "0:05-0:08", "level": "-12dB"},
      {"sound": "notification spam", "timing": "throughout", "level": "-16dB"}
    ]
  }
}
```

### Beat 3: Holder Tranquility

```
BEAT_3_AUDIO = {
  "dialogue_track": {
    "processing": "intimate, close",
    "eq": "warm, confident",
    "compression": "gentle"
  },
  "ambient_track": {
    "cafe_peace": {
      "elements": ["quiet chatter", "coffee machines distant", "soft jazz"],
      "level": "-20dB",
      "character": "comfortable space"
    }
  },
  "sfx_track": {
    "minimal_purposeful": [
      {"sound": "coffee sip", "timing": "0:00", "level": "-10dB"},
      {"sound": "phone vibration", "timing": "0:01", "level": "-12dB"},
      {"sound": "satisfied exhale", "timing": "0:06", "level": "-14dB"}
    ]
  },
  "music_track": {
    "success_undertone": {
      "style": "subtle confidence",
      "entrance": "0:04",
      "level": "-22dB"
    }
  }
}
```

## Character Voice Differentiation

```
VOICE_MATRIX = {
  "skeptic": {
    "pitch": "lower register",
    "rhythm": "measured pauses",
    "texture": "slight gravel",
    "emotion": "protective cynicism"
  },
  "fanboy": {
    "pitch": "higher, variable",
    "rhythm": "no pauses, breathless",
    "texture": "cracking with emotion",
    "emotion": "religious ecstasy"
  },
  "holder": {
    "pitch": "neutral, centered",
    "rhythm": "perfect timing",
    "texture": "smooth confidence",
    "emotion": "zen satisfaction"
  }
}
```

## Compilation Rhythm

```
COMPILATION_PACING = {
  "energy_arc": "medium→high→low",
  "contrast_strategy": "maximum personality difference",
  "transition_beats": {
    "1_to_2": "hard cut for energy spike",
    "2_to_3": "cut to calm for contrast"
  },
  "overall_satisfaction": "complete journey"
}
```

## Script Quality Validation

```
QUALITY_CHECKLIST = {
  "timing": {
    "beat_1": "8 seconds ✓",
    "beat_2": "8 seconds ✓", 
    "beat_3": "8 seconds ✓",
    "total": "24 seconds ✓"
  },
  "dialogue": {
    "personality_match": "distinct voices ✓",
    "word_economy": "each word matters ✓",
    "memorability": "quotable lines ✓",
    "authenticity": "real types ✓"
  },
  "contrast": {
    "energy_levels": "clearly different ✓",
    "delivery_styles": "unique each ✓",
    "environments": "support character ✓"
  },
  "engagement": {
    "self_identification": "viewers find themselves ✓",
    "discussion_prompt": "which are you? ✓",
    "shareability": "tag friends format ✓"
  }
}
```

## Performance Direction

```
PERFORMANCE_NOTES = {
  "skeptic": {
    "physicality": "closed body language",
    "facial": "raised eyebrow, pursed lips",
    "energy": "controlled, minimal",
    "authenticity": "real corporate cynicism"
  },
  "fanboy": {
    "physicality": "explosive movement",
    "facial": "wide eyes, open mouth",
    "energy": "barely contained",
    "authenticity": "true believer passion"
  },
  "holder": {
    "physicality": "relaxed, minimal movement",
    "facial": "subtle knowing smile",
    "energy": "centered calm",
    "authenticity": "genuine confidence"
  }
}
```

## Final Script Summary

```
FINAL_SCRIPT_PACKAGE = {
  "beat_1_skeptic": {
    "words": 11,
    "delivery": "dismissive corporate",
    "key_line": "I'll believe it when I see it"
  },
  "beat_2_fanboy": {
    "words": 8,
    "delivery": "manic excitement",
    "key_line": "THIS CHANGES EVERYTHING!"
  },
  "beat_3_holder": {
    "words": 3,
    "delivery": "quiet confidence",
    "key_line": "Right on schedule"
  },
  "total_words": 22,
  "contrast": "maximum personality range",
  "viral_hook": "Which one are you?"
}
```

---

## Next Step
Scripts optimized for distinct personalities. Proceed to Document 3: Visual Design for environment differentiation.