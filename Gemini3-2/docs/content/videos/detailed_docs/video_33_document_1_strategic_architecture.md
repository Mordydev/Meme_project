# Video 33: Strategic Story Architecture & Beat Structure
## "When Your Parents Ask About Your 'Computer Money'"

## PROJECT INITIALIZATION

```
PROJECT_CONFIG = {
  "title": "Parents_Computer_Money",
  "content_type": "Entertainment",
  "duration": "16 seconds (2 beats × 8 seconds)",
  "structure": "continuous",
  "platform_primary": "youtube",
  "platform_secondary": ["tiktok", "instagram"]
}
```

## CHARACTER BIBLE SYSTEM

### Primary Characters

```
CHARACTER_BIBLE = {
  "char_id": "mom_curious",
  "physical": {
    "age": 52,
    "height": "5'6\" / 168cm",
    "build": "average, motherly presence",
    "hair": "shoulder-length brown with subtle highlights",
    "clothing": "comfortable cardigan over blouse, reading glasses on chain",
    "distinguishing": "warm smile, expressive eyebrows"
  },
  "voice": {
    "tone": "alto, warm maternal",
    "pace": "110 words per minute",
    "accent": "slight midwestern",
    "quirks": ["mispronounces tech terms", "thoughtful pauses"],
    "emotion_range": "confused→curious→excited"
  },
  "movement": {
    "energy": "5/10",
    "style": "gentle, deliberate",
    "gestures": "minimal, mostly facial expressions"
  },
  "consistency_code": "MOM_52_EXACT"
}
```

```
CHARACTER_BIBLE_2 = {
  "char_id": "son_patient",
  "physical": {
    "age": 23,
    "height": "5'10\" / 178cm",
    "build": "average, relaxed posture",
    "hair": "short dark hair, casual style",
    "clothing": "comfortable t-shirt and jeans",
    "distinguishing": "patient expression, slight smile"
  },
  "voice": {
    "tone": "baritone, patient explaining",
    "pace": "120 words per minute",
    "accent": "neutral American",
    "quirks": ["simplifies language progressively"],
    "emotion_range": "patient→amused→encouraging"
  },
  "movement": {
    "energy": "6/10",
    "style": "relaxed, reassuring",
    "gestures": "explanatory hand movements"
  },
  "consistency_code": "SON_23_EXACT"
}
```

## BEAT ARCHITECTURE

### BEAT 1: The Question

```
BEAT_1 = {
  "meta": {
    "id": "001",
    "title": "Mom's Confusion",
    "duration": "8s",
    "emotion": "confusion→curiosity"
  },
  "technical": {
    "shot": "medium two-shot, kitchen table",
    "lens": "35mm f/2.8",
    "camera": "static on tripod, slight push-in last 3s",
    "fps": 24
  },
  "character": {
    "primary": "MOM_52_EXACT",
    "secondary": "SON_23_EXACT",
    "positions": "across kitchen table"
  },
  "environment": {
    "location": "family kitchen, homey",
    "lighting": "warm afternoon through window",
    "time": "mid-afternoon",
    "atmosphere": "comfortable family moment"
  },
  "action": {
    "primary": "Mom asking about crypto, son explaining",
    "timing": {
      "0-2s": "Mom asks about 'Jiminy-3'",
      "2-4s": "Son corrects to Gemini3",
      "4-6s": "Mom asks if it's computer money",
      "6-8s": "Son sighs, prepares to explain"
    }
  },
  "audio": {
    "dialogue": {
      "mom": [
        {
          "text": "Honey, what's this Jiminy-3 thing?",
          "timing": "0:00-0:02",
          "delivery": "genuinely confused"
        },
        {
          "text": "Is it one of your computer moneys?",
          "timing": "0:04-0:06",
          "delivery": "trying to understand"
        }
      ],
      "son": [
        {
          "text": "It's Gemini3, Mom",
          "timing": "0:02-0:04",
          "delivery": "gentle correction"
        }
      ]
    },
    "ambient": "quiet home atmosphere @ -22dB",
    "sfx": [
      {"sound": "coffee mug set down", "time": "0:03", "level": "-15dB"},
      {"sound": "deep sigh", "time": "0:07", "level": "-12dB"}
    ]
  },
  "viral_element": "Universal parent-child tech gap"
}
```

### BEAT 2: The Translation

```
BEAT_2 = {
  "meta": {
    "id": "002",
    "title": "Simple Translation",
    "duration": "8s",
    "emotion": "understanding→enthusiasm"
  },
  "technical": {
    "shot": "alternating close-ups",
    "lens": "50mm f/2.8",
    "camera": "handheld, subtle movement",
    "fps": 24
  },
  "character": {
    "primary": "SON_23_EXACT",
    "secondary": "MOM_52_EXACT",
    "dynamic": "teaching moment"
  },
  "environment": {
    "location": "same kitchen",
    "continuity": "same lighting and time",
    "atmosphere": "warming connection"
  },
  "action": {
    "primary": "Son translating, mom understanding",
    "timing": {
      "0-2s": "Son explains simply",
      "2-3s": "Continues explanation",
      "3-5s": "Mom's face lights up understanding",
      "5-8s": "Mom wants to invest"
    }
  },
  "audio": {
    "dialogue": {
      "son": [
        {
          "text": "Google makes the best robot brain",
          "timing": "0:00-0:02",
          "delivery": "simple, clear"
        },
        {
          "text": "I bought stock in the robot brain company",
          "timing": "0:02-0:04",
          "delivery": "building understanding"
        }
      ],
      "mom": [
        {
          "text": "Oh! Like buying Google?",
          "timing": "0:04-0:06",
          "delivery": "dawning realization"
        },
        {
          "text": "I want spicy Google!",
          "timing": "0:07-0:08",
          "delivery": "excited decision"
        }
      ],
      "son": [
        {
          "text": "Exactly. But spicier",
          "timing": "0:06-0:07",
          "delivery": "amused confirmation"
        }
      ]
    },
    "ambient": "continued home atmosphere @ -22dB",
    "sfx": [
      {"sound": "excited clap", "time": "0:05", "level": "-10dB"}
    ],
    "music": {
      "style": "light wholesome",
      "timing": "0:04-0:08",
      "level": "-20dB"
    }
  },
  "viral_element": "Mom's 'spicy Google' is instantly quotable"
}
```

## TECHNICAL SPECIFICATIONS

```
CAMERA_SPECS = {
  "style": "warm family documentary",
  "movement": {
    "beat_1": "mostly static, gentle push",
    "beat_2": "subtle handheld warmth"
  },
  "framing": {
    "emphasis": "faces and expressions",
    "composition": "intimate family moment"
  }
}
```

```
LIGHTING_SETUP = {
  "primary": "natural window light",
  "quality": "soft, warm afternoon",
  "mood": "comfortable home feeling",
  "consistency": "maintained throughout"
}
```

## AUDIO ARCHITECTURE

```
AUDIO_LAYERS = {
  "dialogue": {
    "clarity": "crystal clear priority",
    "warmth": "family conversation tone"
  },
  "ambient": {
    "home_sounds": "subtle presence",
    "quiet": "intimate setting"
  },
  "emotional": {
    "beat_1": "confusion to curiosity",
    "beat_2": "understanding to excitement"
  }
}
```

## VIRAL OPTIMIZATION

```
VIRAL_MECHANICS = {
  "hook_timing": "0:00-0:02 - 'Jiminy-3' mispronunciation",
  "shareable_moments": [
    "0:05 - 'computer moneys'",
    "0:14 - 'spicy Google'"
  ],
  "universal_appeal": "every crypto holder has had this conversation",
  "wholesome_factor": "high - family bonding over tech"
}
```

## VALIDATION CHECKLIST

```
VALIDATION_CHECKLIST = {
  "technical": {
    "beat_duration": "2 × 8s = 16s ✓",
    "character_count": "2 characters ✓",
    "location": "single simple location ✓",
    "complexity": "simple ✓"
  },
  "creative": {
    "emotional_arc": "confusion→excitement ✓",
    "generation_gap": "authentically portrayed ✓",
    "humor": "wholesome not mocking ✓",
    "payoff": "'spicy Google' memorable ✓"
  },
  "consistency": {
    "characters": "well-defined ✓",
    "location": "family kitchen throughout ✓",
    "tone": "warm family dynamic ✓"
  }
}
```

## FINAL ARCHITECTURE

```
FINAL_ARCHITECTURE = {
  "project_meta": {
    "title": "Parents Computer Money",
    "duration": "16 seconds",
    "beats": 2,
    "complexity": "simple"
  },
  "technical_notes": {
    "seed_strategy": "single seed for both beats",
    "complexity_rating": "simple - two characters, one location",
    "estimated_generations": "3-4 attempts"
  },
  "success_metrics": {
    "target_views": "400K+",
    "target_shares": "30K+",
    "target_engagement": "25%+",
    "comments_expected": "Everyone sharing parent stories"
  }
}
```

---

## Next Step
Architecture complete. Proceed to Document 2: Script Engineering for precise dialogue timing.