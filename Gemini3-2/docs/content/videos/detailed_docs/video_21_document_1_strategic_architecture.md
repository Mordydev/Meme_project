# Video 21: "Planet Crypto" - Strategic Story Architecture & Beat Structure

## PROJECT INITIALIZATION

```
PROJECT_CONFIG = {
  "title": "Planet Crypto",
  "content_type": "Nature documentary parody",
  "duration": "32 seconds (4 beats × 8 seconds)",
  "structure": "continuous documentary story",
  "platform_primary": "youtube",
  "platform_secondary": ["tiktok", "instagram"]
}
```

## CHARACTER BIBLE SYSTEM

### Primary Character (The Crypto Trader)

```
CHARACTER_BIBLE = {
  "crypto_trader": {
    "char_id": "trader_001",
    "physical": {
      "age": 32,
      "height": "5'9\" / 175cm",
      "build": "slim, slightly hunched from screen time",
      "hair": "dark brown, slightly messy from late nights",
      "clothing": "casual hoodie, comfortable pants, coffee-stained",
      "distinguishing": "intense focused eyes, stubble, always holding phone"
    },
    "voice": {
      "tone": "excited whispers when winning",
      "pace": "varies with market volatility",
      "accent": "millennial American",
      "quirks": ["talks to screens", "nervous hand gestures"],
      "emotion_range": "anxious→focused→euphoric"
    },
    "movement": {
      "energy": 8,
      "style": "quick, reactive to market movements",
      "gestures": "rapid typing, chart pointing, celebration"
    },
    "consistency_code": "TRADER001_EXACT"
  },
  
  "narrator_voice": {
    "char_id": "narrator_001",
    "voice_profile": {
      "tone": "deep baritone, authoritative",
      "pace": "120 words per minute",
      "accent": "British BBC documentary style",
      "style": "David Attenborough sophistication",
      "delivery": "measured, observational, slightly amused"
    },
    "consistency_code": "NARRATOR001_EXACT"
  }
}
```

### Supporting Characters

```
DOCUMENTARY_ENSEMBLE = {
  "trader_migration": {
    "char_id": "traders_002",
    "description": "Multiple 25-35yo people, casual tech attire, phones out",
    "role": "Species migration demonstration",
    "consistency_code": "MIGRATION001_EXACT"
  },
  "successful_trader": {
    "char_id": "success_001", 
    "description": "Relaxed 30yo person in luxury beach setting",
    "role": "End state of successful migration",
    "consistency_code": "SUCCESS001_EXACT"
  }
}
```

## BEAT ARCHITECTURE

### BEAT 1: The Habitat (0:00-0:08)

```
BEAT_1 = {
  "meta": {
    "id": "001",
    "title": "The Habitat",
    "duration": "8s",
    "emotion": "mysterious documentary introduction"
  },
  "technical": {
    "shot": "wide establishing home office environment",
    "lens": "35mm f/2.8",
    "camera": "slow dolly push-in with documentary style",
    "fps": 24
  },
  "character": {
    "ref": "TRADER001_EXACT",
    "state": "focused at computer setup",
    "position": "hunched over multiple monitors"
  },
  "environment": {
    "location": "modern home office/bedroom hybrid",
    "lighting": "monitor glow with natural light",
    "time": "any time (traders work 24/7)",
    "atmosphere": "digital forest of screens"
  },
  "action": {
    "primary": "Establishing the 'habitat' of crypto trading",
    "visual_metaphor": "computer setup as natural environment",
    "timing": {
      "0-3s": "wide environment establishing",
      "3-6s": "focus on screens as landscape",
      "6-8s": "species hint/introduction"
    }
  },
  "audio": {
    "narrator": {
      "text": "Deep in the blockchain forest... lives a peculiar species.",
      "delivery": "David Attenborough mysterious introduction",
      "timing": "0:02-0:07"
    },
    "ambient": "computer fans, keyboard clicks @ -18dB",
    "sfx": [
      {"sound": "monitor hum", "time": "0:00-0:08", "level": "-20dB"},
      {"sound": "trading notification", "time": "0:06", "level": "-12dB"}
    ],
    "music": "nature documentary theme @ -16dB"
  },
  "viral_element": "Familiar nature documentary format with crypto twist"
}
```

### BEAT 2: Species Introduction (0:08-0:16)

```
BEAT_2 = {
  "meta": {
    "id": "002",
    "title": "The Crypto Trader Species",
    "duration": "8s",
    "emotion": "scientific observation fascination"
  },
  "technical": {
    "shot": "medium close-up observing behavior",
    "lens": "85mm f/2.0",
    "camera": "steady documentary observation",
    "fps": 24
  },
  "character": {
    "ref": "TRADER001_EXACT",
    "state": "obsessive chart checking",
    "behavior": "rapid eye movement tracking charts"
  },
  "environment": {
    "location": "same home office focused closer",
    "props": ["multiple monitors", "coffee cups", "notepad", "phones"],
    "atmosphere": "intense focus and concentration"
  },
  "action": {
    "primary": "Documenting the species behavior patterns",
    "visual_metaphor": "trader as fascinating wildlife specimen",
    "timing": {
      "0-3s": "species identification",
      "3-6s": "observable characteristics",
      "6-8s": "diamond hands behavior"
    }
  },
  "audio": {
    "narrator": {
      "text": "The Gemini3 holder, a rare breed. Notice the diamond hands.",
      "delivery": "scientific observation with wonder",
      "timing": "0:02-0:07"
    },
    "sfx": [
      {"sound": "rapid mouse clicking", "time": "0:01-0:04", "level": "-12dB"},
      {"sound": "chart refresh sound", "time": "0:05", "level": "-10dB"}
    ],
    "music": "documentary species theme @ -15dB"
  },
  "viral_element": "Diamond hands reference with scientific observation"
}
```

### BEAT 3: Feeding Behavior (0:16-0:24)

```
BEAT_3 = {
  "meta": {
    "id": "003",
    "title": "Feeding Behavior",
    "duration": "8s",
    "emotion": "excitement and fascination"
  },
  "technical": {
    "shot": "close-up reaction to news",
    "lens": "50mm f/1.8",
    "camera": "handheld slight movement for excitement",
    "fps": 24
  },
  "character": {
    "ref": "TRADER001_EXACT",
    "state": "excited reaction to news",
    "transformation": "calm to euphoric"
  },
  "environment": {
    "location": "same office with news displays",
    "props": ["news alerts", "Google announcement", "price charts"],
    "atmosphere": "feeding frenzy excitement"
  },
  "action": {
    "primary": "Observing feeding behavior on information",
    "visual_metaphor": "news consumption as natural feeding",
    "timing": {
      "0-3s": "news alert appears",
      "3-6s": "feeding behavior reaction",
      "6-8s": "satisfying consumption"
    }
  },
  "audio": {
    "narrator": {
      "text": "They sustain themselves on Google announcements. Fascinating behavior.",
      "delivery": "amused scientific fascination",
      "timing": "0:02-0:07"
    },
    "sfx": [
      {"sound": "news alert chime", "time": "0:01", "level": "-8dB"},
      {"sound": "excited intake of breath", "time": "0:03", "level": "-10dB"},
      {"sound": "satisfied 'yes!'", "time": "0:06", "level": "-9dB"}
    ],
    "music": "feeding behavior documentary @ -14dB"
  },
  "viral_element": "Relatable news reaction behavior"
}
```

### BEAT 4: The Great Migration (0:24-0:32)

```
BEAT_4 = {
  "meta": {
    "id": "004",
    "title": "The Great Migration",
    "duration": "8s",
    "emotion": "triumphant evolutionary success"
  },
  "technical": {
    "shot": "wide beach/yacht luxury environment",
    "lens": "24mm f/2.8",
    "camera": "sweeping documentary pan",
    "fps": 24
  },
  "character": {
    "primary": "SUCCESS001_EXACT",
    "ensemble": "MIGRATION001_EXACT",
    "state": "relaxed luxury lifestyle"
  },
  "environment": {
    "location": "tropical beach with yacht",
    "props": ["beach chairs", "yacht", "tropical drinks", "phones still present"],
    "atmosphere": "evolutionary success paradise"
  },
  "action": {
    "primary": "Migration to success habitat",
    "visual_metaphor": "successful traders in natural paradise",
    "timing": {
      "0-3s": "migration movement",
      "3-6s": "arrival at paradise",
      "6-8s": "nature's success story"
    }
  },
  "audio": {
    "narrator": {
      "text": "Once successful, they migrate to warmer climates. Nature's success story.",
      "delivery": "satisfied documentary conclusion",
      "timing": "0:02-0:07"
    },
    "sfx": [
      {"sound": "ocean waves", "time": "0:00-0:08", "level": "-18dB"},
      {"sound": "tropical birds", "time": "0:03-0:08", "level": "-20dB"},
      {"sound": "satisfied contentment", "time": "0:06", "level": "-12dB"}
    ],
    "music": "triumphant nature success @ -12dB"
  },
  "viral_element": "Aspirational success migration"
}
```

## VIRAL OPTIMIZATION

```
VIRAL_MECHANICS = {
  "hook_timing": "0:00-0:03",
  "shareable_moment": {
    "timestamp": "0:02-0:04",
    "type": "format_recognition",
    "description": "David Attenborough voice revealing crypto trader"
  },
  "loop_potential": true,
  "trend_compatibility": "nature documentary parody format",
  "discussion_trigger": "relatable trader behavior observation"
}
```

## NATURE DOCUMENTARY METAPHORS

```
NATURE_CRYPTO_MAPPING = {
  "biological_elements": {
    "habitat": "Home office as natural environment",
    "species": "Crypto traders as wildlife",
    "feeding": "News consumption as sustenance",
    "migration": "Success leading to lifestyle change"
  },
  "behavioral_patterns": {
    "diamond_hands": "Gripping behavior trait",
    "chart_watching": "Territorial monitoring",
    "news_reaction": "Feeding response",
    "success_migration": "Evolutionary advancement"
  },
  "educational_power": {
    "observation": "Scientific study of trading behavior",
    "evolution": "From basement to beach progression",
    "natural_conclusion": "$GEMINI3 as successful adaptation"
  }
}
```

## QUALITY GATES

```
VALIDATION_CHECKLIST = {
  "technical": {
    "beat_duration": "exactly 8s each ✓",
    "character_count": "1 primary + narrator ✓",
    "camera_specs": "all defined ✓",
    "documentary_authenticity": "BBC nature style ✓"
  },
  "creative": {
    "emotional_arc": "curiosity→observation→fascination→satisfaction ✓",
    "viral_hook": "nature documentary format ✓",
    "shareable_moment": "relatable behavior ✓",
    "message_clarity": "$GEMINI3 evolution success ✓"
  },
  "consistency": {
    "character_bible": "complete for trader ✓",
    "voice_profile": "Attenborough narrator ✓",
    "visual_continuity": "office to paradise ✓",
    "format_authenticity": "BBC documentary ✓"
  }
}
```

## NATURE DOCUMENTARY AUTHENTICITY

```
BBC_DOCUMENTARY_ELEMENTS = {
  "visual_language": {
    "camera_work": "Steady observational style",
    "composition": "Wide establishing to intimate close-up",
    "lighting": "Natural, non-intrusive"
  },
  "audio_design": {
    "narrator": "David Attenborough sophisticated authority",
    "music": "Orchestral nature documentary themes",
    "sound_design": "Natural environmental audio"
  },
  "narrative_structure": {
    "introduction": "Mysterious habitat establishment",
    "observation": "Species behavior documentation",
    "conclusion": "Evolutionary success story"
  }
}
```

## TECHNICAL NOTES

```
TECHNICAL_NOTES = {
  "seed_strategy": "Generate trader first, maintain throughout evolution",
  "complexity_rating": "medium (character transformation, environment change)",
  "estimated_generations": "4-6 attempts for documentary authenticity",
  "special_considerations": {
    "environment_transition": "office→same office→office→beach",
    "character_evolution": "same person in different success states",
    "narrator_voice": "David Attenborough BBC authenticity"
  }
}
```

## SUCCESS METRICS

```
SUCCESS_METRICS = {
  "target_views": "500K+ (nature documentary format loved)",
  "target_shares": "35K+ (relatable trader behavior)",
  "target_engagement": "30%+ (comedy + education)",
  "platform_breakdown": {
    "youtube": "Full 32s documentary experience",
    "tiktok": "Beat 2-3 behavior observation",
    "instagram": "Beat 4 success migration"
  }
}
```

---

## Next Step
With nature documentary architecture complete, proceed to Prompt 2: Script Engineering for precise narrator timing and authentic BBC documentary delivery.