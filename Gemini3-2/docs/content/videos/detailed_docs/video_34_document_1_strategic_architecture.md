# Video 34: Strategic Story Architecture & Beat Structure
## "Types of People During Google Announcements"

## PROJECT INITIALIZATION

```
PROJECT_CONFIG = {
  "title": "Types_Google_Announcements",
  "content_type": "Entertainment",
  "duration": "24 seconds (3 beats × 8 seconds)",
  "structure": "compilation",
  "platform_primary": "youtube",
  "platform_secondary": ["tiktok", "instagram"]
}
```

## CHARACTER BIBLE SYSTEM

### Character Type 1: The Skeptic

```
CHARACTER_BIBLE = {
  "char_id": "skeptic_business",
  "physical": {
    "age": 42,
    "height": "5'11\" / 180cm",
    "build": "professional, good posture",
    "hair": "short grey-touched brown, neat",
    "clothing": "business casual - blue dress shirt, no tie",
    "distinguishing": "skeptical eyebrow raise, crossed arms"
  },
  "voice": {
    "tone": "baritone, dismissive",
    "pace": "measured, deliberate",
    "accent": "neutral corporate",
    "quirks": ["dismissive scoffs", "condescending tone"],
    "emotion_range": "doubt→dismissal→slight worry"
  },
  "movement": {
    "energy": "4/10",
    "style": "minimal, controlled",
    "gestures": "dismissive waves, head shakes"
  },
  "consistency_code": "SKEPTIC_42_EXACT"
}
```

### Character Type 2: The Fanboy

```
CHARACTER_BIBLE_2 = {
  "char_id": "fanboy_enthusiast",
  "physical": {
    "age": 24,
    "height": "5'8\" / 173cm",
    "build": "average, energetic posture",
    "hair": "messy dark hair, trendy cut",
    "clothing": "Google I/O t-shirt, jeans",
    "distinguishing": "wide eyes, animated expressions"
  },
  "voice": {
    "tone": "tenor, excitable",
    "pace": "rapid fire 150+ wpm",
    "accent": "slight valley inflection",
    "quirks": ["voice cracks when excited", "breathless delivery"],
    "emotion_range": "excited→manic→evangelical"
  },
  "movement": {
    "energy": "9/10",
    "style": "frenetic, constant motion",
    "gestures": "wild hand movements, jumping"
  },
  "consistency_code": "FANBOY_24_EXACT"
}
```

### Character Type 3: The $GEMINI3 Holder

```
CHARACTER_BIBLE_3 = {
  "char_id": "gemini3_holder",
  "physical": {
    "age": 31,
    "height": "5'9\" / 175cm",
    "build": "relaxed, confident posture",
    "hair": "medium length black hair, casual style",
    "clothing": "comfortable hoodie, casual aesthetic",
    "distinguishing": "knowing smile, calm demeanor"
  },
  "voice": {
    "tone": "alto, confident quiet",
    "pace": "calm, measured",
    "accent": "neutral",
    "quirks": ["satisfied hums", "quiet confidence"],
    "emotion_range": "calm→pleased→quietly triumphant"
  },
  "movement": {
    "energy": "5/10",
    "style": "smooth, deliberate",
    "gestures": "minimal, purposeful"
  },
  "consistency_code": "HOLDER_31_EXACT"
}
```

## BEAT ARCHITECTURE

### BEAT 1: The Skeptic

```
BEAT_1 = {
  "meta": {
    "id": "001",
    "title": "The Corporate Skeptic",
    "duration": "8s",
    "emotion": "dismissive→slightly concerned"
  },
  "technical": {
    "shot": "medium shot office setting",
    "lens": "50mm f/2.8",
    "camera": "static on tripod",
    "fps": 24
  },
  "character": {
    "primary": "SKEPTIC_42_EXACT",
    "state": "at desk, watching announcement",
    "position": "center frame"
  },
  "environment": {
    "location": "corporate office",
    "lighting": "fluorescent office standard",
    "time": "business hours",
    "atmosphere": "sterile professional"
  },
  "action": {
    "primary": "Dismissing Google announcement",
    "timing": {
      "0-2s": "Watching screen, skeptical face",
      "2-4s": "Dismissive comment",
      "4-6s": "Wave hand, turn away",
      "6-8s": "Continue working, slight pause"
    }
  },
  "audio": {
    "dialogue": {
      "text": "Google always overpromises. I'll believe it when I see it.",
      "timing": "0:02-0:05",
      "delivery": "dismissive, confident"
    },
    "ambient": "office atmosphere @ -20dB",
    "sfx": [
      {"sound": "keyboard typing", "time": "0:06-0:08", "level": "-15dB"},
      {"sound": "dismissive scoff", "time": "0:01", "level": "-12dB"}
    ]
  },
  "viral_element": "Everyone knows this contrarian"
}
```

### BEAT 2: The Fanboy

```
BEAT_2 = {
  "meta": {
    "id": "002",
    "title": "The True Believer",
    "duration": "8s",
    "emotion": "excited→evangelical"
  },
  "technical": {
    "shot": "medium shot bedroom/gaming setup",
    "lens": "35mm f/2.8",
    "camera": "handheld energy",
    "fps": 24
  },
  "character": {
    "primary": "FANBOY_24_EXACT",
    "state": "multiple screens, livestream",
    "position": "surrounded by tech"
  },
  "environment": {
    "location": "tech bedroom/office",
    "lighting": "RGB gaming lights + screens",
    "time": "announcement time",
    "atmosphere": "high energy tech cave"
  },
  "action": {
    "primary": "Losing mind over announcement",
    "timing": {
      "0-2s": "Watching multiple streams",
      "2-4s": "Screaming about Google",
      "4-6s": "Frantically sharing",
      "6-8s": "Typing everywhere"
    }
  },
  "audio": {
    "dialogue": {
      "text": "GOOGLE IS TAKING OVER! THIS CHANGES EVERYTHING!",
      "timing": "0:02-0:05",
      "delivery": "manic excitement"
    },
    "ambient": "tech room hum @ -22dB",
    "sfx": [
      {"sound": "frantic typing", "time": "0:05-0:08", "level": "-12dB"},
      {"sound": "notification spam", "time": "throughout", "level": "-15dB"},
      {"sound": "chair spinning", "time": "0:03", "level": "-14dB"}
    ]
  },
  "viral_element": "The friend who overhypes everything"
}
```

### BEAT 3: The $GEMINI3 Holder

```
BEAT_3 = {
  "meta": {
    "id": "003",
    "title": "The Quiet Winner",
    "duration": "8s",
    "emotion": "calm→satisfied"
  },
  "technical": {
    "shot": "medium shot coffee shop",
    "lens": "50mm f/2.8",
    "camera": "subtle push-in",
    "fps": 24
  },
  "character": {
    "primary": "HOLDER_31_EXACT",
    "state": "casually checking phone",
    "position": "relaxed at table"
  },
  "environment": {
    "location": "quiet coffee shop corner",
    "lighting": "natural window light",
    "time": "mid-morning",
    "atmosphere": "peaceful contrast"
  },
  "action": {
    "primary": "Calmly checking portfolio",
    "timing": {
      "0-2s": "Sipping coffee, phone buzz",
      "2-4s": "Glance at notification",
      "4-5s": "Small knowing smile",
      "5-7s": "Quiet comment",
      "7-8s": "Close app, continue day"
    }
  },
  "audio": {
    "dialogue": {
      "text": "Right on schedule",
      "timing": "0:05-0:06",
      "delivery": "quiet satisfaction"
    },
    "ambient": "quiet cafe @ -20dB",
    "sfx": [
      {"sound": "phone vibration", "time": "0:01", "level": "-12dB"},
      {"sound": "coffee sip", "time": "0:00", "level": "-10dB"},
      {"sound": "satisfied exhale", "time": "0:06", "level": "-14dB"}
    ],
    "music": {
      "style": "subtle success theme",
      "timing": "0:04-0:08",
      "level": "-22dB"
    }
  },
  "viral_element": "The satisfaction of being right",
  "final_text": {
    "overlay": "Which one are you?",
    "timing": "0:07-0:08",
    "style": "clean, simple"
  }
}
```

## TECHNICAL SPECIFICATIONS

```
CAMERA_SPECS = {
  "variety": {
    "beat_1": "static corporate feel",
    "beat_2": "energetic handheld",
    "beat_3": "smooth controlled"
  },
  "progression": "increasing calmness",
  "contrast": "energy levels differ greatly"
}
```

```
LIGHTING_SETUP = {
  "beat_1": "harsh office fluorescent",
  "beat_2": "colorful tech cave RGB",
  "beat_3": "soft natural cafe light",
  "emotional_support": "lighting matches personality"
}
```

## AUDIO ARCHITECTURE

```
AUDIO_LAYERS = {
  "consistency": {
    "format": "each beat self-contained",
    "mixing": "smooth transitions between"
  },
  "personality_audio": {
    "skeptic": "quiet, controlled",
    "fanboy": "chaotic, loud",
    "holder": "peaceful, confident"
  },
  "contrast": "audio energy matches character"
}
```

## VIRAL OPTIMIZATION

```
VIRAL_MECHANICS = {
  "hook_timing": "0:00-0:03 - immediate personality",
  "identification": "viewers find themselves",
  "shareability": "tag your friends format",
  "discussion_starter": "which type are you?",
  "compilation_appeal": "satisfying contrasts"
}
```

## VALIDATION CHECKLIST

```
VALIDATION_CHECKLIST = {
  "technical": {
    "beat_duration": "3 × 8s = 24s ✓",
    "character_count": "1 per beat ✓",
    "location_variety": "3 different ✓",
    "complexity": "simple each beat ✓"
  },
  "creative": {
    "personality_types": "clearly distinct ✓",
    "progression": "energy arc planned ✓",
    "relatability": "universal types ✓",
    "humor": "recognition based ✓"
  },
  "consistency": {
    "format": "same structure each ✓",
    "timing": "8 seconds exact ✓",
    "theme": "Google announcement ✓"
  }
}
```

## FINAL ARCHITECTURE

```
FINAL_ARCHITECTURE = {
  "project_meta": {
    "title": "Types During Google Announcements",
    "duration": "24 seconds",
    "beats": 3,
    "complexity": "simple"
  },
  "technical_notes": {
    "seed_strategy": "different seed each character",
    "locations": "3 distinct environments",
    "estimated_generations": "3-4 attempts each"
  },
  "success_metrics": {
    "target_views": "750K+",
    "target_shares": "50K+",
    "target_engagement": "30%+",
    "comments_expected": "I'm definitely type..."
  }
}
```

---

## Next Step
Architecture complete. Proceed to Document 2: Script Engineering for personality-specific dialogue.