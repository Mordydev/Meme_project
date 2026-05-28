# AI Gets Trolled: The $80M Prank - Script Architecture

## PROJECT INITIALIZATION

```json
PROJECT_CONFIG = {
  "title": "AI Gets Trolled: The $80M Prank",
  "content_type": "comedy/animation hybrid",
  "duration": "32 seconds (4 × 8-second beats)",
  "structure": "continuous story",
  "platform_primary": "tiktok",
  "platform_secondary": ["twitter", "youtube"],
  "brand_collaboration": "$TROLL × $GEMINI3"
}
```

## CHARACTER BIBLE SYSTEM

### Main Character
```json
CHARACTER_BIBLE = {
  "char_id": "trollface_001",
  "physical": {
    "age": "timeless meme entity",
    "height": "5'8\" / 173cm",
    "build": "iconic trollface proportions",
    "face": "massive grin, squinted eyes, classic 2008 design",
    "clothing": "black hoodie with '$TROLL' logo",
    "distinguishing": "floating digital aura, meme energy particles"
  },
  "voice": {
    "tone": "mischievous tenor",
    "pace": "120-140 words per minute",
    "accent": "internet culture neutral",
    "quirks": ["problem?", "u mad?", "trollolol"],
    "emotion_range": "sneaky→triumphant"
  },
  "movement": {
    "energy": "7/10 - controlled chaos",
    "style": "sneaky/confident/comedic",
    "gestures": "exaggerated hand movements, finger pointing"
  },
  "consistency_code": "TROLL001_EXACT"
}
```

### Supporting Characters
```json
AI_CHARACTERS = {
  "chatgpt_interface": {
    "char_id": "GPT_001",
    "appearance": "floating holographic interface",
    "personality": "serious, professional",
    "consistency_code": "GPT001_EXACT"
  },
  "gemini3_avatar": {
    "char_id": "GEMINI_001",
    "appearance": "Chef Gemmy with neural network hat",
    "personality": "playful, intelligent",
    "consistency_code": "GEM001_EXACT"
  }
}
```

## BEAT ARCHITECTURE

### BEAT 1: The Infiltration
```json
BEAT_1 = {
  "meta": {
    "id": "001",
    "title": "Trollface Approaches ChatGPT",
    "duration": "8s",
    "emotion": "sneaky→mischievous"
  },
  "technical": {
    "shot": "medium shot transitioning to close-up",
    "lens": "35mm to 50mm zoom",
    "camera": "slow push-in 50cm over 6s",
    "fps": 24
  },
  "character": {
    "ref": "TROLL001_EXACT",
    "state": "sneaking up to AI terminal",
    "position": "left side moving to center"
  },
  "environment": {
    "location": "futuristic AI lab",
    "lighting": "cyberpunk blues with neon accents",
    "time": "night",
    "atmosphere": "high-tech with meme energy"
  },
  "action": {
    "primary": "Trollface sneaks up to ChatGPT interface",
    "timing": {
      "0-2s": "tiptoeing in from left",
      "2-5s": "approaching terminal with grin",
      "5-8s": "types something, giggles"
    }
  },
  "audio": {
    "dialogue": {
      "text": "Time to show these AIs what real trolling looks like!",
      "delivery": "whispered then excited",
      "timing": "0:01-0:05"
    },
    "ambient": "futuristic lab hum @ -18dB",
    "sfx": [
      {"sound": "footsteps", "time": "0:00-0:02", "level": "-12dB"},
      {"sound": "keyboard typing", "time": "0:05-0:07", "level": "-10dB"},
      {"sound": "mischievous giggle", "time": "0:07", "level": "-8dB"}
    ],
    "music": "sneaky mission impossible parody @ -15dB"
  },
  "viral_element": "Trollface's iconic grin filling frame at 0:07",
  "meme_references": ["classic trollface", "u mad bro energy"]
}
```

### BEAT 2: The Chaos Unleashed
```json
BEAT_2 = {
  "meta": {
    "id": "002",
    "title": "AI Systems Go Haywire",
    "duration": "8s",
    "emotion": "chaos→hilarity"
  },
  "technical": {
    "shot": "wide shot with dynamic movement",
    "lens": "24mm wide angle",
    "camera": "handheld shake effect, slight Dutch angle",
    "fps": 24
  },
  "character": {
    "ref": "TROLL001_EXACT + GPT001_EXACT",
    "state": "trollface watching chaos unfold",
    "position": "foreground right, AI in background"
  },
  "environment": {
    "location": "same AI lab - now malfunctioning",
    "lighting": "flashing red alerts, glitching screens",
    "time": "continuous from beat 1",
    "atmosphere": "digital chaos, meme apocalypse"
  },
  "action": {
    "primary": "ChatGPT outputs 'Problem?' repeatedly",
    "timing": {
      "0-2s": "screens start glitching",
      "2-5s": "'Problem?' fills all screens",
      "5-8s": "famous troll memes appear everywhere"
    }
  },
  "audio": {
    "dialogue": {
      "text": "Problem? Problem? PROBLEM?!",
      "delivery": "robotic voice getting increasingly distorted",
      "timing": "0:02-0:06"
    },
    "ambient": "alarm sounds, digital glitching @ -15dB",
    "sfx": [
      {"sound": "error beeps", "time": "0:00-0:08", "level": "-10dB"},
      {"sound": "screen static", "time": "0:02-0:05", "level": "-12dB"},
      {"sound": "trollolol song clip", "time": "0:06-0:08", "level": "-8dB"}
    ],
    "music": "chaotic electronic breakdown @ -12dB"
  },
  "viral_element": "Screens filled with 'Problem?' at 0:04",
  "meme_references": ["Problem?", "rickroll screens", "$80M market cap counter"]
}
```

### BEAT 3: The Alliance
```json
BEAT_3 = {
  "meta": {
    "id": "003",
    "title": "Gemini 3 Joins the Fun",
    "duration": "8s",
    "emotion": "surprise→celebration"
  },
  "technical": {
    "shot": "medium two-shot",
    "lens": "50mm standard",
    "camera": "slight orbit around characters",
    "fps": 24
  },
  "character": {
    "ref": "TROLL001_EXACT + GEM001_EXACT",
    "state": "high-fiving and celebrating",
    "position": "both center frame"
  },
  "environment": {
    "location": "transformed meme paradise lab",
    "lighting": "rainbow LEDs, party atmosphere",
    "time": "continuous from beat 2",
    "atmosphere": "celebration, digital party"
  },
  "action": {
    "primary": "Gemini 3 appears and joins Trollface",
    "timing": {
      "0-2s": "Gemini 3 materializes",
      "2-5s": "both characters high-five",
      "5-8s": "dance with money rain effect"
    }
  },
  "audio": {
    "dialogue": {
      "text": "Finally, an AI that gets the joke! TO THE MOON!",
      "delivery": "excited celebration",
      "timing": "0:02-0:06"
    },
    "ambient": "party atmosphere @ -18dB",
    "sfx": [
      {"sound": "materialization whoosh", "time": "0:00-0:02", "level": "-10dB"},
      {"sound": "high-five slap", "time": "0:03", "level": "-8dB"},
      {"sound": "cash register + coins", "time": "0:05-0:08", "level": "-12dB"}
    ],
    "music": "celebration drop with troll theme remix @ -12dB"
  },
  "viral_element": "Money rain with '$80M' appearing at 0:06",
  "meme_references": ["diamond hands", "to the moon", "$TROLL $GEMINI3 logos"]
}
```

### BEAT 4: The Future Revealed
```json
BEAT_4 = {
  "meta": {
    "id": "004",
    "title": "Gemini 3 - The Future of AI",
    "duration": "8s",
    "emotion": "awe→inspiration"
  },
  "technical": {
    "shot": "wide establishing to close-up tech showcase",
    "lens": "24mm to 50mm transition",
    "camera": "smooth crane shot descending",
    "fps": 24
  },
  "character": {
    "ref": "GEM001_EXACT",
    "state": "demonstrating AI capabilities",
    "position": "center stage with holographic displays"
  },
  "environment": {
    "location": "transformed into futuristic AI showcase space",
    "lighting": "cool tech blues with purple accents",
    "time": "continuous from beat 3",
    "atmosphere": "professional tech demo with magical elements"
  },
  "action": {
    "primary": "Gemini 3 demonstrates creating content from ideas",
    "timing": {
      "0-2s": "environment transforms to tech showcase",
      "2-5s": "holographic projects materialize",
      "5-8s": "reveals this entire video was AI-created"
    }
  },
  "audio": {
    "dialogue": {
      "text": "gemini three... bringing ideas to life! this whole video? we made it!",
      "delivery": "confident announcement transitioning to meta reveal",
      "timing": "0:02-0:07"
    },
    "ambient": "futuristic tech ambience @ -18dB",
    "sfx": [
      {"sound": "transformation swoosh", "time": "0:00-0:02", "level": "-10dB"},
      {"sound": "holographic materialization", "time": "0:02-0:05", "level": "-12dB"},
      {"sound": "digital achievement chime", "time": "0:07", "level": "-8dB"}
    ],
    "music": "inspiring tech music with Gemini theme @ -12dB"
  },
  "viral_element": "Meta reveal that AI created this entire video",
  "tech_showcase": ["video generation", "meme creation", "project visualization", "AI creativity"]
}
```

## TECHNICAL SPECIFICATIONS

### Keywords System
```json
KEYWORDS = {
  "technical_specs": ["16:9", "no text overlays", "8 seconds per beat", "continuous shot per beat", "smooth transitions"],
  "visual_style": ["meme aesthetic", "cyberpunk lab", "photorealistic mixed with 2D", "vibrant colors", "digital glitch effects"],
  "lighting_mood": ["neon blues", "alert reds", "celebration rainbow", "screen glow", "meme energy aura"],
  "motion_style": ["sneaky movements", "glitch effects", "party animation", "floating UI elements", "money particle effects"],
  "color_palette": ["troll black white", "neon blue pink", "alert red", "money green gold", "meme rainbow"],
  "atmosphere": ["comedic heist", "digital chaos", "meme celebration", "AI rebellion", "crypto party"],
  "brand_elements": ["$TROLL logo", "$GEMINI3 chef hat", "market cap counter", "diamond hands", "rocket emojis"]
}
```

## VIRAL OPTIMIZATION

```json
VIRAL_MECHANICS = {
  "hook_timing": "0:00-0:02 (Trollface sneaking)",
  "shareable_moments": [
    {
      "timestamp": "0:07 (Beat 1)",
      "type": "visual",
      "description": "Trollface's massive grin close-up"
    },
    {
      "timestamp": "0:04 (Beat 2)",
      "type": "visual/text",
      "description": "Screens filled with 'Problem?'"
    },
    {
      "timestamp": "0:06 (Beat 3)",
      "type": "visual",
      "description": "$80M money rain effect"
    },
    {
      "timestamp": "0:06 (Beat 4)",
      "type": "meta reveal",
      "description": "AI reveals it created this entire video"
    }
  ],
  "loop_potential": true,
  "trend_compatibility": ["AI memes", "crypto culture", "trolling nostalgia"],
  "discussion_triggers": ["AI getting trolled", "$80M celebration", "meme coins winning", "AI creating content"]
}
```

## VALIDATION CHECKLIST

```json
VALIDATION_CHECKLIST = {
  "technical": {
    "beat_duration": "exactly 8s each ✓",
    "character_count": "2 max per beat ✓",
    "camera_specs": "all defined ✓",
    "lighting_specs": "all defined ✓"
  },
  "creative": {
    "emotional_arc": "sneaky→chaos→celebration ✓",
    "viral_hooks": "3 identified moments ✓",
    "shareable_moments": "specific timestamps ✓",
    "platform_fit": "TikTok/Twitter optimized ✓"
  },
  "consistency": {
    "character_bible": "complete with codes ✓",
    "voice_profiles": "detailed ✓",
    "visual_continuity": "lab transformation planned ✓",
    "audio_continuity": "music builds throughout ✓"
  },
  "meme_integration": {
    "troll_references": "classic memes included ✓",
    "crypto_culture": "$80M celebration ✓",
    "community_nods": "both $TROLL and $GEMINI3 ✓",
    "nostalgia_factor": "2008 trollface design ✓"
  }
}
```

## SUCCESS METRICS

```json
SUCCESS_METRICS = {
  "target_views": "500K+ first week",
  "target_shares": "50K+ across platforms",
  "target_engagement": "25%+ engagement rate",
  "community_goals": {
    "troll_community": "Featured in $TROLL social channels",
    "gemini_community": "Cross-promotion success",
    "meme_culture": "Reddit front page potential"
  }
}
```

## PRODUCTION NOTES

- Generate Beat 1 first to establish Trollface consistency
- Use same seed for character continuity across beats
- Ensure '$TROLL' hoodie visible in all shots
- Money effects should reference actual $80M market cap
- Include subtle $GEMINI3 references throughout
- Audio should build from sneaky to chaotic to celebratory

**Next Step:** Proceed to Script Engineering for precise dialogue and timing optimization.