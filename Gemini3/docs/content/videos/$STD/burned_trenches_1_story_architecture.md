# $STD - "Burned in the Trenches" Pharma Commercial
## Story Architecture & Beat Structure

### PROJECT CONFIGURATION
```json
{
  "title": "Have You Been Burned in the Trenches?",
  "content_type": "commercial/promotional",
  "duration": "24 seconds (3 beats × 8 seconds)",
  "structure": "continuous",
  "platform_primary": "twitter/x",
  "platform_secondary": ["tiktok", "youtube_shorts"]
}
```

### CHARACTER BIBLE
```json
{
  "protagonist": {
    "char_id": "TRADER_001",
    "physical": {
      "age": 32,
      "height": "5'10\" / 178cm",
      "build": "average, slightly disheveled",
      "hair": "brown, messy from stress",
      "clothing": "wrinkled hoodie with crypto conference logo, sweatpants",
      "distinguishing": "bags under eyes, nervous phone checking habit"
    },
    "voice": {
      "tone": "tired baritone, slightly hoarse",
      "pace": "slow, defeated - 120 words per minute",
      "accent": "neutral American",
      "quirks": ["sighs before speaking", "voice cracks on 'profits'"],
      "emotion_range": "exhausted→concerned→resigned acceptance"
    },
    "movement": {
      "energy": "3/10 - sluggish, defeated",
      "style": "slouched, protective body language",
      "gestures": "clutches phone, rubs eyes frequently"
    },
    "consistency_code": "TRADER001_BURNED"
  },
  "doctor": {
    "char_id": "DOCTOR_001",
    "physical": {
      "age": 45,
      "height": "5'8\" / 173cm", 
      "build": "professional, well-groomed",
      "hair": "silver, neat side part",
      "clothing": "white lab coat, stethoscope, glasses",
      "distinguishing": "knowing smile, clipboard with charts"
    },
    "voice": {
      "tone": "warm alto, professionally sympathetic",
      "pace": "measured - 140 words per minute",
      "accent": "neutral American medical professional",
      "quirks": ["emphasizes medical terms", "reassuring hmm sounds"],
      "emotion_range": "professional→understanding→gently humorous"
    },
    "consistency_code": "DOCTOR001_PHARMA"
  }
}
```

### BEAT ARCHITECTURE

#### BEAT 1: The Diagnosis Question
```json
{
  "meta": {
    "id": "001",
    "title": "Have You Been Burned?",
    "duration": "8s",
    "emotion": "recognition→vulnerability"
  },
  "technical": {
    "shot": "medium shot transitioning to close-up",
    "lens": "50mm f/2.8",
    "camera": "slow push-in 40cm over 6s, slight handheld shake",
    "fps": 24,
    "keywords": [
      "pharmaceutical commercial style",
      "soft diffused lighting",
      "slightly desaturated colors",
      "medical waiting room",
      "handheld documentary feel",
      "9:16 vertical",
      "no text overlays"
    ]
  },
  "character": {
    "ref": "TRADER001_BURNED",
    "state": "sitting hunched in waiting room chair",
    "position": "center frame, looking down at phone"
  },
  "environment": {
    "location": "generic medical waiting room",
    "lighting": "soft overhead fluorescents, 4000K, slightly harsh",
    "atmosphere": "sterile, uncomfortable, familiar medical setting",
    "props": "fake plants, health posters, empty chairs"
  },
  "action": {
    "primary": "Trader looks up from phone showing red portfolio",
    "timing": {
      "0-2s": "staring at phone with red charts",
      "2-4s": "slowly looks up at camera",
      "4-8s": "maintains eye contact, subtle nod of recognition"
    }
  },
  "audio": {
    "voiceover": {
      "text": "Have you been burned in the trenches? Scared to go in anymore, no matter how clean it looks?",
      "delivery": "gentle female pharma narrator",
      "timing": "0:00-0:07"
    },
    "ambient": "waiting room hum, distant phone notifications",
    "sfx": [
      {"sound": "phone buzz", "time": "0:01", "level": "-15dB"},
      {"sound": "paper rustling", "time": "0:05", "level": "-18dB"}
    ]
  },
  "viral_element": "Relatable crypto trader exhaustion"
}
```

#### BEAT 2: You're Not Alone
```json
{
  "meta": {
    "id": "002", 
    "title": "The STD Diagnosis",
    "duration": "8s",
    "emotion": "understanding→dark humor"
  },
  "technical": {
    "shot": "over-shoulder to two-shot",
    "lens": "35mm f/2.8",
    "camera": "static tripod, slight zoom at 6s for emphasis",
    "fps": 24,
    "keywords": [
      "doctor's office",
      "pharmaceutical commercial",
      "professional medical setting",
      "warm key lighting",
      "clinical but caring",
      "9:16 vertical"
    ]
  },
  "characters": {
    "trader": "TRADER001_BURNED - nodding slowly",
    "doctor": "DOCTOR001_PHARMA - explaining with clipboard"
  },
  "environment": {
    "location": "doctor's examination room",
    "lighting": "warm key light 3200K, cool fill 5600K",
    "props": "examination table, medical charts, computer showing crypto charts"
  },
  "action": {
    "timing": {
      "0-3s": "doctor reviews clipboard, trader nods",
      "3-5s": "doctor points to chart showing 'STD symptoms'",
      "5-8s": "trader's resigned acceptance, small bitter laugh"
    }
  },
  "audio": {
    "voiceover": {
      "text": "You're not alone. You probably have STD - Solana Trench Disease.",
      "delivery": "same pharma narrator, matter-of-fact",
      "timing": "0:00-0:05"
    },
    "dialogue": {
      "doctor": "Millions suffer from it.",
      "timing": "0:06-0:07",
      "delivery": "sympathetic, professional"
    }
  },
  "viral_element": "STD acronym reveal with perfect timing"
}
```

#### BEAT 3: The Side Effects
```json
{
  "meta": {
    "id": "003",
    "title": "Ridiculous Side Effects",
    "duration": "8s", 
    "emotion": "dark comedy→acceptance"
  },
  "technical": {
    "shot": "medium shot with quick montage inserts",
    "lens": "50mm f/2.8",
    "camera": "handheld with 3 quick insert cuts",
    "fps": 24,
    "keywords": [
      "pharmaceutical montage",
      "side effects sequence",
      "quick cuts",
      "lifestyle footage",
      "comedic timing",
      "desaturated pharmaceutical blue tint",
      "9:16 vertical"
    ]
  },
  "character": {
    "ref": "TRADER001_BURNED",
    "state": "going through daily life with STD",
    "multiple_scenarios": true
  },
  "environment": {
    "locations": "bedroom, restaurant, gym, office",
    "lighting": "varied natural lighting, pharmaceutical commercial style"
  },
  "action": {
    "timing": {
      "0-2s": "checking phone in bed at 3am",
      "2-4s": "at restaurant, explaining DeFi to annoyed date",
      "4-6s": "at gym, drawing support lines on mirror",
      "6-8s": "group therapy circle of traders"
    }
  },
  "audio": {
    "voiceover": {
      "text": "Side effects may include: compulsive chart checking, inability to enjoy meals without checking portfolio, seeing candlestick patterns in everyday objects, and chronic FOMO.",
      "delivery": "rapid pharmaceutical disclaimer speed",
      "timing": "0:00-0:07"
    },
    "sfx": [
      {"sound": "phone notifications", "time": "throughout", "level": "-15dB"}
    ],
    "music": "generic pharmaceutical commercial piano, -18dB"
  },
  "viral_element": "Hilariously relatable side effects delivered at legally required speed"
}
```

### VIRAL OPTIMIZATION
```json
{
  "primary_hook": "STD acronym reveal at 0:13",
  "shareable_moments": [
    "Initial burned trader recognition (0:04)",
    "STD diagnosis delivery (0:13)", 
    "Side effects montage (0:16-0:24)"
  ],
  "meme_potential": "STD acronym + side effects list",
  "loop_compatibility": true,
  "platform_optimization": {
    "twitter": "Perfect length for quote tweets",
    "tiktok": "Side effects section highly clippable",
    "youtube_shorts": "Complete narrative arc"
  }
}
```

### TECHNICAL SPECIFICATIONS
```json
{
  "complexity_rating": "medium",
  "character_count": 2,
  "location_changes": 5,
  "veo3_features": ["character consistency", "pharmaceutical lighting", "documentary handheld style"],
  "estimated_seeds": "4-6 attempts for consistency",
  "special_requirements": "Maintain pharmaceutical commercial aesthetic throughout"
}
```

### SUCCESS METRICS
```json
{
  "target_views": "500K+ (crypto twitter viral potential)",
  "target_shares": "50K+ (high meme potential)",
  "target_engagement": "25%+ (relatable content)",
  "expected_comments": "Personal STD stories, additional side effects suggestions"
}
```

---
**Ready for Script Engineering Phase**