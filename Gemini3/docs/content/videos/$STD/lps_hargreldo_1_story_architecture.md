# LPS (Limp Pump Syndrome) - Story Architecture

## PROJECT CONFIGURATION
```json
{
  "title": "Ask Your Doctor About HarGreldo",
  "content_type": "commercial/parody",
  "duration": "4 beats × 8 seconds = 32 seconds",
  "structure": "continuous",
  "platform_primary": "tiktok",
  "platform_secondary": ["youtube", "instagram"],
  "concept": "Pharmaceutical commercial parody for crypto traders suffering from 'Limp Pump Syndrome'"
}
```

## CHARACTER BIBLE

### TRENT_001 - The Sufferer
```json
{
  "char_id": "TRENT_001",
  "physical": {
    "age": 35,
    "height": "5'11\" / 180cm",
    "build": "fit but stressed",
    "hair": "dark brown, styled but slightly disheveled",
    "clothing": "navy button-up shirt, dark jeans, expensive watch",
    "distinguishing": "tired eyes, forced smile, phone visible in pocket"
  },
  "voice": {
    "tone": "tenor, embarrassed yet hopeful",
    "pace": "95 words per minute",
    "accent": "neutral American",
    "quirks": ["crypto terminology slips", "nervous laughter"],
    "emotion_range": "disappointed→embarrassed→hopeful→confident"
  },
  "movement": {
    "energy": "5/10 - subdued due to condition",
    "style": "awkward, avoiding eye contact",
    "gestures": "checking phone charts, head down"
  },
  "consistency_code": "TRENT001_EXACT"
}
```

### DATE_001 - The Understanding Partner
```json
{
  "char_id": "DATE_001",
  "physical": {
    "age": 32,
    "height": "5'6\" / 168cm",
    "build": "attractive, fit",
    "hair": "long blonde, wavy",
    "clothing": "elegant black dress, heels",
    "distinguishing": "sympathetic expression, touching his arm"
  },
  "voice": {
    "tone": "alto, supportive",
    "pace": "85 words per minute",
    "accent": "neutral American",
    "quirks": ["gentle reassurance"],
    "emotion_range": "expectant→understanding→excited"
  },
  "movement": {
    "energy": "7/10 - patient but interested",
    "style": "graceful, supportive gestures",
    "gestures": "comforting touches, encouraging smiles"
  },
  "consistency_code": "DATE001_EXACT"
}
```

### NARRATOR_001 - Pharmaceutical Voice
```json
{
  "char_id": "NARRATOR_001",
  "voice": {
    "tone": "professional baritone",
    "pace": "120 words per minute (rapid for disclaimers)",
    "accent": "neutral broadcast American",
    "style": "warm pharma commercial with rapid disclaimer",
    "emotion_range": "caring→authoritative→rapid legal"
  }
}
```

## BEAT ARCHITECTURE

### BEAT 1 - "The Problem"
```json
{
  "meta": {
    "id": "001",
    "title": "Romantic Disappointment",
    "duration": "8s",
    "emotion": "anticipation→disappointment"
  },
  "technical": {
    "shot": "medium two-shot to close-up",
    "lens": "50mm f/2.0",
    "camera": "slow push-in on Trent's worried face",
    "fps": 24
  },
  "characters": {
    "trent_ref": "TRENT001_EXACT",
    "date_ref": "DATE001_EXACT",
    "positions": "couch, date leaning in, Trent looking at phone"
  },
  "environment": {
    "location": "upscale apartment living room",
    "lighting": "warm romantic 3200K, candles, dim",
    "props": "wine glasses, phone showing red charts, modern decor",
    "atmosphere": "romantic evening gone wrong"
  },
  "action": {
    "primary": "Trent checks phone while date tries to get closer",
    "timing": {
      "0-3s": "date moves closer, Trent glances at phone",
      "3-6s": "sees red charts, visible disappointment",
      "6-8s": "looks down ashamed as date notices"
    }
  },
  "audio": {
    "dialogue": {
      "trent": "She wants god candles, but all I see are limp pumps.",
      "delivery": "disappointed whisper",
      "timing": "0:02-0:06"
    },
    "ambient": "soft jazz -22dB, apartment ambience",
    "sfx": [
      {"sound": "phone notification", "time": "0:03", "level": "-16dB"},
      {"sound": "disappointed sigh", "time": "0:07", "level": "-14dB"}
    ]
  },
  "viral_element": "crypto trader checking charts during intimate moment"
}
```

### BEAT 2 - "You're Not Alone"
```json
{
  "meta": {
    "id": "002",
    "title": "LPS Explanation",
    "duration": "8s",
    "emotion": "understanding→hope"
  },
  "technical": {
    "shot": "montage of sufferers, product reveal",
    "lens": "35mm f/2.8",
    "camera": "smooth transitions between vignettes",
    "fps": 24
  },
  "environment": {
    "location": "bright pharma commercial world",
    "lighting": "bright 5600K, high-key pharmaceutical",
    "props": "HarGreldo bottle, various traders at computers",
    "atmosphere": "hopeful pharmaceutical aesthetic"
  },
  "action": {
    "primary": "montage of LPS sufferers, product hero shot",
    "timing": {
      "0-3s": "quick cuts of traders looking sad at screens",
      "3-5s": "HarGreldo bottle dramatic reveal",
      "5-8s": "hopeful faces looking up"
    }
  },
  "audio": {
    "dialogue": {
      "narrator": "Millions suffer from LPS - Limp Pump Syndrome. But now there's HarGreldo.",
      "delivery": "warm, understanding pharma voice",
      "timing": "0:00-0:06"
    },
    "ambient": "bright pharma commercial bed -20dB",
    "sfx": [
      {"sound": "sparkle sound on reveal", "time": "0:04", "level": "-12dB"}
    ],
    "music": "uplifting pharmaceutical theme -18dB"
  },
  "viral_element": "LPS acronym reveal with dramatic product shot"
}
```

### BEAT 3 - "The Solution Works"
```json
{
  "meta": {
    "id": "003",
    "title": "Amazing Results",
    "duration": "8s",
    "emotion": "excitement→confidence"
  },
  "technical": {
    "shot": "triumphant couple shots, chart animations",
    "lens": "24mm f/4.0",
    "camera": "dynamic movement, slight slow-mo",
    "fps": 24
  },
  "characters": {
    "trent_ref": "TRENT001_EXACT",
    "date_ref": "DATE001_EXACT",
    "positions": "various celebratory poses"
  },
  "environment": {
    "location": "same apartment, transformed mood",
    "lighting": "warm golden hour 3500K",
    "props": "green chart overlays, HarGreldo bottle visible",
    "atmosphere": "success and satisfaction"
  },
  "action": {
    "primary": "couple celebrating, charts going up",
    "timing": {
      "0-3s": "Trent confident, showing green charts",
      "3-6s": "couple embracing, she looks amazed",
      "6-8s": "proposal gesture tease"
    }
  },
  "audio": {
    "dialogue": {
      "narrator": "HarGreldo makes it pump so hard, she might propose mid-Xgasm!",
      "delivery": "enthusiastic pharma voice",
      "timing": "0:01-0:05"
    },
    "ambient": "success ambience -22dB",
    "sfx": [
      {"sound": "chart going up sound", "time": "0:01", "level": "-14dB"},
      {"sound": "romantic gasp", "time": "0:06", "level": "-16dB"}
    ],
    "music": "triumphant pharma theme -18dB"
  },
  "viral_element": "proposal mid-Xgasm line with visual suggestion"
}
```

### BEAT 4 - "Disclaimer & Call to Action"
```json
{
  "meta": {
    "id": "004",
    "title": "Side Effects & CTA",
    "duration": "8s",
    "emotion": "rapid legal→inspiring"
  },
  "technical": {
    "shot": "standard pharma disclaimer format",
    "lens": "35mm f/2.8",
    "camera": "static with text space",
    "fps": 24
  },
  "environment": {
    "location": "white pharma disclaimer background",
    "lighting": "even pharmaceutical lighting",
    "props": "small product shot lower third",
    "atmosphere": "standard pharma commercial ending"
  },
  "action": {
    "primary": "happy couples, product beauty shots",
    "timing": {
      "0-5s": "rapid disclaimer with happy visuals",
      "5-8s": "final CTA with product hero shot"
    }
  },
  "audio": {
    "dialogue": {
      "narrator": "Side effects may include meeting parents, torn condoms, feeling young again. Go all in with HarGreldo!",
      "delivery": "rapid disclaimer then inspiring CTA",
      "timing": "0:00-0:07"
    },
    "ambient": "pharmaceutical bed -24dB",
    "music": "uplifting ending -16dB"
  },
  "viral_element": "crypto-themed side effects delivered rapid-fire"
}
```

## VIRAL OPTIMIZATION
```json
{
  "hook_timing": "0:00-0:03 - intimate moment ruined by charts",
  "shareable_moment": {
    "timestamp": "0:19-0:21",
    "type": "dialogue",
    "description": "propose mid-Xgasm line"
  },
  "loop_potential": true,
  "trend_compatibility": "pharma parody with crypto twist",
  "discussion_trigger": "relatable crypto ED metaphor"
}
```

## TECHNICAL NOTES
```json
{
  "seed_strategy": "generate beat 1 for character consistency",
  "complexity_rating": "medium - intimate scenes require taste",
  "estimated_generations": "5-7 attempts per beat",
  "continuity_notes": "maintain couple chemistry throughout"
}
```

## SUCCESS METRICS
```json
{
  "target_views": "500K+",
  "target_shares": "25K+",
  "target_engagement": "25%+",
  "target_comments": "relatable trading struggle comments"
}
```

## KEYWORDS FOR GENERATION
```
[
  "9:16 vertical",
  "pharmaceutical commercial parody",
  "romantic comedy",
  "crypto trading",
  "upscale apartment",
  "intimate lighting",
  "pharma aesthetic",
  "comedic timing",
  "no text overlays",
  "continuous story"
]
```