# Video 22: "Who Wants to Be a Gemini3-ionaire?" - Strategic Story Architecture & Beat Structure

## PROJECT INITIALIZATION

```
PROJECT_CONFIG = {
  "title": "Who Wants to Be a Gemini3-ionaire?",
  "content_type": "Game show parody",
  "duration": "40 seconds (5 beats × 8 seconds)",
  "structure": "continuous game show story",
  "platform_primary": "youtube",
  "platform_secondary": ["tiktok", "instagram"]
}
```

## CHARACTER BIBLE SYSTEM

### Primary Characters

```
CHARACTER_BIBLE = {
  "game_show_host": {
    "char_id": "host_001",
    "physical": {
      "age": 50,
      "height": "6'1\" / 185cm",
      "build": "confident presenter physique",
      "hair": "silver-gray, perfectly styled",
      "clothing": "dark navy suit, crisp white shirt, gold tie",
      "distinguishing": "warm smile, authoritative presence, TV host charisma"
    },
    "voice": {
      "tone": "rich baritone, warm authority",
      "pace": "135 words per minute",
      "accent": "polished American broadcaster",
      "quirks": ["dramatic pauses", "building tension"],
      "emotion_range": "professional→dramatic→excited"
    },
    "movement": {
      "energy": 8,
      "style": "polished TV presenter",
      "gestures": "expressive, camera-aware"
    },
    "consistency_code": "HOST001_EXACT"
  },
  
  "contestant": {
    "char_id": "contestant_001",
    "physical": {
      "age": 34,
      "height": "5'8\" / 173cm",
      "build": "average, slightly nervous posture",
      "hair": "brown, neat but showing stress",
      "clothing": "business casual, button-down shirt, slacks",
      "distinguishing": "intelligent eyes, nervous energy, hopeful expression"
    },
    "voice": {
      "tone": "tenor, increasingly excited",
      "pace": "150 words per minute when nervous",
      "accent": "educated American",
      "emotion_range": "nervous→thoughtful→euphoric"
    },
    "movement": {
      "energy": 7,
      "style": "contained nervous excitement",
      "gestures": "fidgety when thinking, celebratory when winning"
    },
    "consistency_code": "CONTESTANT001_EXACT"
  },
  
  "phone_friend": {
    "char_id": "friend_001",
    "voice_profile": {
      "tone": "confident, enthusiastic",
      "pace": "180 words per minute",
      "accent": "American tech-savvy",
      "style": "crypto expert authority",
      "delivery": "immediate confident knowledge"
    },
    "consistency_code": "FRIEND001_EXACT"
  }
}
```

### Supporting Characters

```
GAME_SHOW_ENSEMBLE = {
  "audience": {
    "char_id": "audience_001",
    "description": "Mixed group 25-55yo, business casual, engaged game show energy",
    "role": "Reaction and celebration atmosphere",
    "consistency_code": "AUDIENCE001_EXACT"
  }
}
```

## BEAT ARCHITECTURE

### BEAT 1: The Million Dollar Question (0:00-0:08)

```
BEAT_1 = {
  "meta": {
    "id": "001",
    "title": "The Million Dollar Question",
    "duration": "8s",
    "emotion": "dramatic tension building"
  },
  "technical": {
    "shot": "wide establishing game show set",
    "lens": "35mm f/2.8",
    "camera": "dramatic push-in with game show energy",
    "fps": 24
  },
  "character": {
    "primary": "HOST001_EXACT",
    "secondary": "CONTESTANT001_EXACT",
    "interaction": "host building dramatic tension"
  },
  "environment": {
    "location": "professional game show studio",
    "lighting": "dramatic TV lighting with contestant spot",
    "time": "prime time recording",
    "atmosphere": "million dollar question tension"
  },
  "action": {
    "primary": "Host dramatically announces million dollar question",
    "contestant_state": "nervous anticipation",
    "timing": {
      "0-3s": "dramatic question setup",
      "3-6s": "million dollar announcement",
      "6-8s": "question revelation"
    }
  },
  "audio": {
    "dialogue": {
      "host": {
        "text": "For one million dollars... What's Google's next breakthrough?",
        "delivery": "dramatic game show build-up",
        "timing": "0:02-0:07"
      }
    },
    "ambient": "studio atmosphere, audience tension @ -20dB",
    "sfx": [
      {"sound": "dramatic sting", "time": "0:02", "level": "-10dB"},
      {"sound": "tension music build", "time": "0:04-0:08", "level": "-14dB"}
    ],
    "music": "game show tension theme @ -16dB"
  },
  "viral_element": "Familiar game show million dollar tension"
}
```

### BEAT 2: The Options (0:08-0:16)

```
BEAT_2 = {
  "meta": {
    "id": "002",
    "title": "The Multiple Choice Options",
    "duration": "8s",
    "emotion": "analytical decision pressure"
  },
  "technical": {
    "shot": "medium two-shot host and contestant",
    "lens": "50mm f/2.0",
    "camera": "steady game show coverage",
    "fps": 24
  },
  "character": {
    "primary": "HOST001_EXACT",
    "secondary": "CONTESTANT001_EXACT",
    "interaction": "presenting options, contestant analyzing"
  },
  "environment": {
    "location": "same game show set",
    "props": ["answer display screens", "contestant chair", "dramatic lighting"],
    "atmosphere": "decision-making pressure"
  },
  "action": {
    "primary": "Host presents multiple choice options",
    "contestant_analysis": "visible thinking and stress",
    "timing": {
      "0-4s": "options A and B presented",
      "4-6s": "options C and D presented",
      "6-8s": "contestant needs help"
    }
  },
  "audio": {
    "dialogue": {
      "host": {
        "text": "A) GPT-6, B) Claude 4, C) Gemini 3, D) Grok 2",
        "timing": "0:01-0:05",
        "delivery": "clear option presentation"
      },
      "contestant": {
        "text": "I need help!",
        "timing": "0:06-0:07",
        "delivery": "nervous decision stress"
      }
    },
    "sfx": [
      {"sound": "option reveal", "time": "0:02, 0:04", "level": "-12dB"}
    ],
    "music": "decision pressure theme @ -15dB"
  },
  "viral_element": "Relatable decision pressure with crypto options"
}
```

### BEAT 3: Phone a Friend (0:16-0:24)

```
BEAT_3 = {
  "meta": {
    "id": "003",
    "title": "Phone a Friend Lifeline",
    "duration": "8s",
    "emotion": "expert advice and confidence"
  },
  "technical": {
    "shot": "close-up contestant with phone element",
    "lens": "85mm f/2.0",
    "camera": "intimate phone conversation coverage",
    "fps": 24
  },
  "character": {
    "primary": "CONTESTANT001_EXACT",
    "voice": "FRIEND001_EXACT",
    "interaction": "seeking and receiving expert advice"
  },
  "environment": {
    "location": "contestant hot seat with phone setup",
    "props": ["game show phone", "timer display", "lifeline graphics"],
    "atmosphere": "expert consultation urgency"
  },
  "action": {
    "primary": "Contestant calls crypto expert friend",
    "expert_response": "immediate confident answer",
    "timing": {
      "0-2s": "phone connection setup",
      "2-6s": "friend's confident advice",
      "6-8s": "reassurance and confidence"
    }
  },
  "audio": {
    "dialogue": {
      "friend_voice": {
        "text": "C! Gemini 3! Buy $GEMINI3! Trust me!",
        "timing": "0:03-0:07",
        "delivery": "immediate confident crypto expertise",
        "phone_effect": "clear but slightly processed"
      }
    },
    "sfx": [
      {"sound": "phone dial tone", "time": "0:01", "level": "-12dB"},
      {"sound": "connection beep", "time": "0:02", "level": "-10dB"}
    ],
    "music": "expert advice confidence @ -14dB"
  },
  "viral_element": "Crypto expert friend giving immediate confident advice"
}
```

### BEAT 4: The Decision (0:24-0:32)

```
BEAT_4 = {
  "meta": {
    "id": "004",
    "title": "Final Answer Decision",
    "duration": "8s",
    "emotion": "dramatic tension to revelation"
  },
  "technical": {
    "shot": "dramatic close-up contestant decision",
    "lens": "50mm f/1.8",
    "camera": "building tension with tight framing",
    "fps": 24
  },
  "character": {
    "primary": "CONTESTANT001_EXACT",
    "secondary": "HOST001_EXACT",
    "interaction": "final answer delivery and host reaction"
  },
  "environment": {
    "location": "game show hot seat dramatic lighting",
    "props": ["answer confirmation system", "dramatic lighting effects"],
    "atmosphere": "maximum tension before revelation"
  },
  "action": {
    "primary": "Contestant gives final answer with confidence",
    "dramatic_pause": "host building suspense",
    "timing": {
      "0-3s": "final answer declaration",
      "3-6s": "dramatic pause and tension",
      "6-8s": "host begins revelation"
    }
  },
  "audio": {
    "dialogue": {
      "contestant": {
        "text": "Final answer... C!",
        "timing": "0:02-0:04",
        "delivery": "confident decision"
      },
      "host": {
        "text": "You're absolutely...",
        "timing": "0:06-0:07",
        "delivery": "dramatic pause revelation setup"
      }
    },
    "sfx": [
      {"sound": "final answer lock", "time": "0:04", "level": "-8dB"},
      {"sound": "dramatic pause music", "time": "0:05-0:08", "level": "-12dB"}
    ],
    "music": "maximum tension build @ -13dB"
  },
  "viral_element": "Classic game show dramatic pause tension"
}
```

### BEAT 5: Victory Celebration (0:32-0:40)

```
BEAT_5 = {
  "meta": {
    "id": "005",
    "title": "Million Dollar Victory",
    "duration": "8s",
    "emotion": "explosive celebration and success"
  },
  "technical": {
    "shot": "wide celebration with confetti and lights",
    "lens": "24mm f/2.8",
    "camera": "dynamic celebration coverage",
    "fps": 24
  },
  "character": {
    "primary": "CONTESTANT001_EXACT",
    "secondary": "HOST001_EXACT",
    "ensemble": "AUDIENCE001_EXACT",
    "celebration": "full game show victory energy"
  },
  "environment": {
    "location": "game show set in full celebration mode",
    "props": ["confetti cannons", "victory lighting", "million dollar graphics"],
    "atmosphere": "game show winner euphoria"
  },
  "action": {
    "primary": "Host confirms correct answer, full celebration",
    "contestant_victory": "euphoric million dollar winner",
    "timing": {
      "0-3s": "CORRECT announcement",
      "3-6s": "celebration explosion",
      "6-8s": "$GEMINI3 investment declaration"
    }
  },
  "audio": {
    "dialogue": {
      "host": {
        "text": "CORRECT!",
        "timing": "0:01-0:02",
        "delivery": "explosive game show excitement"
      },
      "contestant": {
        "text": "I'm buying $GEMINI3 with the winnings!",
        "timing": "0:05-0:08",
        "delivery": "euphoric victory declaration"
      }
    },
    "sfx": [
      {"sound": "confetti cannons", "time": "0:02", "level": "-6dB"},
      {"sound": "audience cheering", "time": "0:03-0:08", "level": "-10dB"},
      {"sound": "victory fanfare", "time": "0:01-0:08", "level": "-8dB"}
    ],
    "music": "game show victory theme @ -10dB"
  },
  "viral_element": "Game show victory with crypto investment commitment"
}
```

## VIRAL OPTIMIZATION

```
VIRAL_MECHANICS = {
  "hook_timing": "0:00-0:03",
  "shareable_moment": {
    "timestamp": "0:32-0:35",
    "type": "victory_celebration",
    "description": "CORRECT! Million dollar celebration"
  },
  "loop_potential": true,
  "trend_compatibility": "game show format parody",
  "discussion_trigger": "Google AI technology speculation"
}
```

## GAME SHOW METAPHORS

```
GAME_SHOW_CRYPTO_MAPPING = {
  "traditional_elements": {
    "million_dollar_question": "High-stakes crypto investment decision",
    "multiple_choice": "Various AI technology options",
    "phone_friend": "Crypto expert consultation",
    "final_answer": "Investment commitment"
  },
  "educational_power": {
    "expert_validation": "Crypto friend confirms Gemini 3",
    "decision_framework": "Research before investing",
    "confidence_building": "Expert advice supports decision",
    "action_step": "Using winnings to buy $GEMINI3"
  },
  "entertainment_value": {
    "familiar_format": "Beloved game show structure",
    "tension_building": "Classic dramatic moments",
    "victory_satisfaction": "Million dollar celebration"
  }
}
```

## QUALITY GATES

```
VALIDATION_CHECKLIST = {
  "technical": {
    "beat_duration": "exactly 8s each ✓",
    "character_count": "manageable 2+1 voice ✓",
    "camera_specs": "all defined ✓",
    "game_show_authenticity": "TV show accurate ✓"
  },
  "creative": {
    "emotional_arc": "tension→pressure→confidence→suspense→celebration ✓",
    "viral_hook": "game show format ✓",
    "shareable_moment": "victory celebration ✓",
    "message_clarity": "$GEMINI3 as correct answer ✓"
  },
  "consistency": {
    "character_bible": "complete for principals ✓",
    "voice_profile": "detailed game show personas ✓",
    "visual_continuity": "studio set throughout ✓",
    "format_authenticity": "millionaire show structure ✓"
  }
}
```

## GAME SHOW AUTHENTICITY

```
MILLIONAIRE_SHOW_ELEMENTS = {
  "visual_language": {
    "lighting": "Dramatic studio with hot seat spot",
    "set_design": "Professional game show production",
    "graphics": "Million dollar question displays"
  },
  "audio_design": {
    "host": "Professional broadcaster authority",
    "music": "Tension building to celebration",
    "sfx": "Classic game show sound effects"
  },
  "format_structure": {
    "question_setup": "Million dollar dramatic announcement",
    "options_presentation": "Multiple choice A through D",
    "lifeline_use": "Phone a friend expert consultation",
    "final_answer": "Dramatic decision and confirmation",
    "celebration": "Victory fanfare and confetti"
  }
}
```

## TECHNICAL NOTES

```
TECHNICAL_NOTES = {
  "seed_strategy": "Generate host first, maintain TV presenter energy",
  "complexity_rating": "medium (game show set, multiple characters)",
  "estimated_generations": "4-6 attempts for game show authenticity",
  "special_considerations": {
    "studio_environment": "Professional TV game show set",
    "character_energy": "TV presenter vs nervous contestant",
    "celebration_scale": "Full game show victory production"
  }
}
```

## SUCCESS METRICS

```
SUCCESS_METRICS = {
  "target_views": "600K+ (game show format loved)",
  "target_shares": "40K+ (relatable decision tension)",
  "target_engagement": "35%+ (interactive format)",
  "platform_breakdown": {
    "youtube": "Full 40s game show experience",
    "tiktok": "Beat 4-5 decision and celebration",
    "instagram": "Beat 3 phone friend advice"
  }
}
```

---

## Next Step
With game show architecture complete, proceed to Prompt 2: Script Engineering for precise dialogue timing and authentic TV game show delivery.