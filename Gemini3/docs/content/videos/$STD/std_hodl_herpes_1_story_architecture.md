# $STD "HODL Herpes" - Strategic Story Architecture

## PROJECT CONFIGURATION
```json
{
  "title": "HODL Herpes - The Degen Disease",
  "content_type": "comedy_commercial",
  "duration": "32 seconds (4 beats × 8 seconds)",
  "structure": "continuous_story",
  "platform_primary": "twitter/x",
  "platform_secondary": ["tiktok", "youtube_shorts"]
}
```

## CHARACTER BIBLE

### PROTAGONIST - Degen Patient
```json
{
  "char_id": "DEGEN_001",
  "physical": {
    "age": 28,
    "height": "5'10\" / 178cm",
    "build": "average, slightly disheveled",
    "hair": "brown, messy, hasn't showered in days",
    "clothing": "stained Solana hoodie, boxer shorts, mismatched socks",
    "distinguishing": "bloodshot eyes, twitchy fingers, phone glued to hand"
  },
  "voice": {
    "tone": "manic tenor, voice cracks when panicking",
    "pace": "rapid-fire, 180 words per minute",
    "accent": "generic American, slight vocal fry",
    "quirks": ["bro", "actual fuck", "what the"],
    "emotion_range": "confused→panicked→desperate→relieved"
  },
  "movement": {
    "energy": "9/10 - hyperactive, jittery",
    "style": "erratic, constantly checking phone",
    "gestures": "aggressive scratching, wild hand movements"
  },
  "consistency_code": "DEGEN_001_HODLER"
}
```

### DOCTOR - Dr. Crypto
```json
{
  "char_id": "DOCTOR_001",
  "physical": {
    "age": 45,
    "height": "6'0\" / 183cm",
    "build": "professional but quirky",
    "hair": "salt and pepper, slightly wild",
    "clothing": "lab coat with $STD pins, germ-themed tie, crypto-branded stethoscope",
    "distinguishing": "$STD logo tattoo on neck, holds glowing bong/vial"
  },
  "voice": {
    "tone": "confident baritone with hint of madness",
    "pace": "measured but building to excitement",
    "accent": "professional American with stoner undertones",
    "quirks": ["my friend", "yup", "bro"],
    "emotion_range": "amused→diagnostic→prescriptive→evangelical"
  },
  "movement": {
    "energy": "6/10 - controlled chaos",
    "style": "theatrical medical gestures",
    "gestures": "dramatic prescription writing, bong handling"
  },
  "consistency_code": "DOCTOR_001_STD"
}
```

## BEAT ARCHITECTURE

### BEAT 1: Chart Catastrophe (0:00-0:08)
```json
{
  "meta": {
    "id": "001",
    "title": "The Discovery",
    "duration": "8s",
    "emotion": "confusion→panic"
  },
  "technical": {
    "shot": "medium shot transitioning to close-up",
    "lens": "35mm f/2.8",
    "camera": "handheld shake, push-in 50cm over 6s",
    "fps": 24
  },
  "character": {
    "ref": "DEGEN_001_HODLER",
    "state": "discovering symptoms",
    "position": "center frame, hunched over phone"
  },
  "environment": {
    "location": "dimly lit basement trading cave",
    "lighting": "key: phone screen glow 5600K, fill: monitor light 6500K, ratio: 6:1",
    "time": "3 AM",
    "atmosphere": "chaotic degen den, empty energy drink cans"
  },
  "action": {
    "primary": "staring at red chart, aggressive head scratching",
    "timing": {
      "0-2s": "shocked stare at plummeting chart",
      "2-5s": "frantic scratching and looking into pants",
      "5-8s": "screaming realization"
    }
  },
  "audio": {
    "dialogue": {
      "text": "What the actual fuck is this?! My bags are sinking, my dick's oozing!",
      "delivery": "building panic, voice cracking",
      "timing": "0:01-0:06"
    },
    "ambient": "computer fan hum @ -18dB",
    "sfx": [
      {"sound": "chart crash sound", "time": "0:01", "level": "-12dB"},
      {"sound": "aggressive scratching", "time": "0:02-0:05", "level": "-15dB"}
    ],
    "music": "ominous crypto crash theme"
  },
  "viral_element": "looking into pants with horror"
}
```

### BEAT 2: Medical Madness (0:08-0:16)
```json
{
  "meta": {
    "id": "002",
    "title": "The Diagnosis",
    "duration": "8s",
    "emotion": "desperation→revelation"
  },
  "technical": {
    "shot": "wide establishing to two-shot",
    "lens": "24mm f/4.0",
    "camera": "smooth dolly in 80cm over 5s",
    "fps": 24
  },
  "character": {
    "ref": "DEGEN_001_HODLER + DOCTOR_001_STD",
    "state": "patient meets doctor",
    "position": "patient left, doctor right"
  },
  "environment": {
    "location": "grimy crypto clinic",
    "lighting": "harsh fluorescent 4000K overhead, disco ball sparkles",
    "time": "indeterminate",
    "atmosphere": "$STD graffiti walls, medical chaos"
  },
  "action": {
    "primary": "stumbling entrance, doctor examination",
    "timing": {
      "0-2s": "patient stumbles in",
      "2-4s": "doctor's greeting with bong",
      "4-8s": "pants examination and diagnosis"
    }
  },
  "audio": {
    "dialogue": {
      "text": "Yo bro! Show me - whoa! Severe HODL Herpes, an STD - Solana Transmitted Disease!",
      "delivery": "doctor: amused building to excited diagnosis",
      "timing": "0:01-0:07"
    },
    "ambient": "medical office buzz @ -20dB",
    "sfx": [
      {"sound": "door slam", "time": "0:00", "level": "-10dB"},
      {"sound": "bong bubble", "time": "0:02", "level": "-14dB"},
      {"sound": "zipper/examination", "time": "0:04", "level": "-16dB"}
    ],
    "music": "quirky medical theme"
  },
  "viral_element": "doctor's shocked reaction to examination"
}
```

### BEAT 3: Prescription Paradise (0:16-0:24)
```json
{
  "meta": {
    "id": "003",
    "title": "The Treatment",
    "duration": "8s",
    "emotion": "treatment→transformation"
  },
  "technical": {
    "shot": "medium two-shot with VFX elements",
    "lens": "50mm f/2.0",
    "camera": "slight handheld energy, 360° orbit last 3s",
    "fps": 24
  },
  "character": {
    "ref": "DEGEN_001_HODLER + DOCTOR_001_STD + GERM_MASCOT",
    "state": "prescription and transformation",
    "position": "centered with animated elements"
  },
  "environment": {
    "location": "same crypto clinic with VFX overlay",
    "lighting": "psychedelic color shifts, UV blacklight accents",
    "time": "timeless",
    "atmosphere": "magical medical mayhem"
  },
  "action": {
    "primary": "prescription writing, germ moonwalk, patient transformation",
    "timing": {
      "0-2s": "doctor writes prescription dramatically",
      "2-4s": "glowing $STD vial reveal",
      "4-6s": "cartoon germ moonwalks with middle finger",
      "6-8s": "patient smiles with HODLIVIR 500"
    }
  },
  "audio": {
    "dialogue": {
      "text": "You're gonna need HODLIVIR 500! Embrace the degen plague!",
      "delivery": "doctor prescriptive authority, patient relief",
      "timing": "0:01-0:05"
    },
    "ambient": "magical transformation ambience @ -16dB",
    "sfx": [
      {"sound": "prescription scribble", "time": "0:00-0:02", "level": "-14dB"},
      {"sound": "vial glow whoosh", "time": "0:02", "level": "-10dB"},
      {"sound": "moonwalk shuffle", "time": "0:04-0:06", "level": "-12dB"},
      {"sound": "transformation ding", "time": "0:07", "level": "-8dB"}
    ],
    "music": "building to triumphant crypto anthem"
  },
  "viral_element": "moonwalking germ with middle finger to red chart"
}
```

### BEAT 4: Degen Disclaimer (0:24-0:32)
```json
{
  "meta": {
    "id": "004",
    "title": "The Madness",
    "duration": "8s",
    "emotion": "chaos→acceptance"
  },
  "technical": {
    "shot": "rapid montage to wide pullback",
    "lens": "24mm f/5.6",
    "camera": "crash zooms and whip pans, final pullback",
    "fps": 24
  },
  "character": {
    "ref": "DEGEN_001_HODLER + DOCTOR_001_STD",
    "state": "full degen embrace",
    "position": "various, ending with both centered"
  },
  "environment": {
    "location": "multiple flash locations ending at clinic",
    "lighting": "strobe effects, neon highlights, ending on branded lighting",
    "time": "time collapse",
    "atmosphere": "maximum chaos to branded serenity"
  },
  "action": {
    "primary": "patient diamond-handing, doctor screaming benefits, lambo explosion",
    "timing": {
      "0-2s": "patient manically holding red charts",
      "2-4s": "rapid disclaimer montage",
      "4-6s": "lambo explodes into emojis",
      "6-8s": "final $STD branding with both characters"
    }
  },
  "audio": {
    "dialogue": {
      "text": "Snag $STD on Solana! Side effects: FOMO, bag annihilation, X rants!",
      "delivery": "rapid-fire disclaimer into final sell",
      "timing": "0:01-0:07"
    },
    "ambient": "chaos blend @ -14dB",
    "sfx": [
      {"sound": "chart notifications", "time": "0:00-0:02", "level": "-16dB"},
      {"sound": "rapid listing sounds", "time": "0:02-0:04", "level": "-18dB"},
      {"sound": "lambo explosion", "time": "0:05", "level": "-6dB"},
      {"sound": "emoji pop sounds", "time": "0:05-0:06", "level": "-12dB"}
    ],
    "music": "chaotic degen anthem to branded outro"
  },
  "viral_element": "lambo exploding into emoji cascade 🚀💥😂💦"
}
```

## TECHNICAL SPECIFICATIONS

### Keywords System
```json
{
  "keywords": [
    "16:9 vertical",
    "medical commercial parody",
    "crypto degen comedy",
    "pharmaceutical aesthetic",
    "Solana meme",
    "HODL culture",
    "diamond hands disease",
    "transformation sequence",
    "cartoon germ character",
    "rapid disclaimer",
    "no text overlays"
  ]
}
```

### Visual Consistency
- Maintain stained Solana hoodie throughout
- Doctor's $STD lab coat remains consistent
- Grimy clinic aesthetic with disco ball
- Red chart imagery recurring motif
- $STD branding colors: neon green/purple on dark

### Audio Continuity
- Base track: medical commercial parody theme
- Building energy across beats
- Consistent voice processing for characters
- Strategic silence before key moments
- Disclaimer speed: 200+ words per minute

## VIRAL OPTIMIZATION

### Platform Strategy
```json
{
  "twitter_x": {
    "hook": "Looking into pants moment at 0:04",
    "quote_potential": "What the actual fuck is this?!",
    "screenshot_moment": "Doctor's shock at 0:12"
  },
  "tiktok": {
    "trend_potential": "HODL Herpes diagnosis challenge",
    "sound_bite": "Severe HODL Herpes soundbite",
    "duet_opportunity": "Reaction to symptoms"
  },
  "youtube_shorts": {
    "thumbnail": "Patient and doctor with glowing vial",
    "retention_hook": "Immediate chart crash",
    "comment_bait": "What crypto gave you HODL Herpes?"
  }
}
```

### Success Metrics
- Target views: 500K+ first week
- Target engagement: 25%+ (degen community)
- Share rate: 15%+ (shock value + relatability)
- Sound usage: 10K+ TikToks within month

## PRODUCTION NOTES
- Emphasize physical comedy over dialogue
- VFX budget for beat 3 transformation
- Ensure $STD branding visible but not overwhelming
- Test disclaimer speed for legal compliance
- Prepare censored version for restrictive platforms

---
Ready for Script Engineering (Document 2)