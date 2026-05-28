# Trollface Reviews Veo 3 - Script Architecture

## PROJECT INITIALIZATION

```json
{
  "title": "Trollface Reviews Veo 3: The Ultimate AI Troll",
  "content_type": "entertainment/comedy/review",
  "duration": "24 seconds (3 beats × 8 seconds)",
  "structure": "continuous",
  "platform_primary": "tiktok",
  "platform_secondary": ["twitter", "youtube"]
}
```

## CHARACTER BIBLE SYSTEM

```json
{
  "char_id": "TROLLFACE_001",
  "physical": {
    "age": "eternal",
    "height": "variable/cartoon",
    "build": "2D classic meme proportions",
    "appearance": "classic black line art Trollface on white, occasional 3D rendering",
    "clothing": "tech reviewer outfit - black turtleneck, glasses when being 'serious'",
    "distinguishing": "iconic trollface grin, occasionally morphs expressions"
  },
  "voice": {
    "tone": "deep tech reviewer parody voice",
    "pace": "120-140 words per minute",
    "accent": "overly serious tech YouTuber",
    "quirks": ["problem?", "u mad?", "trollolol"],
    "emotion_range": "fake serious→barely contained laughter→full troll"
  },
  "movement": {
    "energy": "7/10 - controlled chaos",
    "style": "smooth 2D animation with occasional glitch effects",
    "gestures": "exaggerated tech reviewer hand movements"
  },
  "consistency_code": "TROLL001_CLASSIC"
}
```

## BEAT ARCHITECTURE

### BEAT 1: "Professional" Tech Review Setup
```json
{
  "meta": {
    "id": "001",
    "title": "The Serious Review",
    "duration": "8s",
    "emotion": "fake professionalism→growing mischief"
  },
  "technical": {
    "shot": "medium shot",
    "lens": "35mm f/2.8",
    "camera": "static tripod, slight push-in last 2s",
    "fps": 24
  },
  "character": {
    "ref": "TROLL001_CLASSIC",
    "state": "tech reviewer mode with glasses",
    "position": "center frame at desk"
  },
  "environment": {
    "location": "minimalist tech review studio",
    "lighting": "key: 5600K@45°, fill: 5600K@-30°, ratio: 3:1, purple accent rim",
    "atmosphere": "professional YouTube studio"
  },
  "action": {
    "primary": "Trollface seriously analyzing Veo 3 features on screen",
    "timing": {
      "0-2s": "adjust glasses, clear throat professionally",
      "2-5s": "point at Veo 3 features on screen",
      "5-8s": "grin starts breaking through serious facade"
    }
  },
  "audio": {
    "dialogue": {
      "text": "Today we're reviewing Veo 3, Google's latest AI video tool that... wait...",
      "delivery": "overly professional transitioning to suspicious",
      "timing": "0:01-0:07"
    },
    "ambient": "tech channel ambience @ -20dB",
    "sfx": [
      {"sound": "glasses adjustment", "time": "0:01", "level": "-12dB"},
      {"sound": "screen tap", "time": "0:03", "level": "-10dB"}
    ],
    "music": "generic tech review music @ -15dB"
  },
  "viral_element": "Trollface trying to be serious tech reviewer",
  "meme_showcase": "Screen shows classic 'Problem?' meme"
}
```

### BEAT 2: Making Veo 3 Generate Troll Content
```json
{
  "meta": {
    "id": "002",
    "title": "The Troll Test",
    "duration": "8s",
    "emotion": "mischievous discovery→pure joy"
  },
  "technical": {
    "shot": "over-shoulder to screen close-up",
    "lens": "50mm f/1.8",
    "camera": "smooth dolly in 50cm over 6s",
    "fps": 24
  },
  "character": {
    "ref": "TROLL001_CLASSIC",
    "state": "full troll mode activated",
    "position": "left third, looking at screen"
  },
  "environment": {
    "location": "same studio, screen glowing",
    "lighting": "screen glow on face, purple/blue bias",
    "atmosphere": "discovery excitement"
  },
  "action": {
    "primary": "Making Veo 3 generate increasingly absurd troll videos",
    "timing": {
      "0-2s": "typing prompt with exaggerated finger movements",
      "2-6s": "screen shows AI-generated troll memes coming to life",
      "6-8s": "Trollface's grin reaches maximum width"
    }
  },
  "audio": {
    "dialogue": {
      "text": "Let's test it! 'Make rickroll but it's AI teaching quantum physics'... YESSS!",
      "delivery": "excited discovery building to triumph",
      "timing": "0:01-0:07"
    },
    "ambient": "computer hum @ -20dB",
    "sfx": [
      {"sound": "keyboard clacking", "time": "0:00-0:02", "level": "-8dB"},
      {"sound": "AI generation whoosh", "time": "0:03", "level": "-6dB"},
      {"sound": "success ding", "time": "0:06", "level": "-8dB"}
    ],
    "music": "building electronic tension @ -12dB"
  },
  "viral_element": "AI creating legendary troll content",
  "meme_showcase": "Screen displays AI-generated versions of: Rickroll, Forever Alone, Y U NO, all animated"
}
```

### BEAT 3: The Meta Reveal & Rating
```json
{
  "meta": {
    "id": "003",
    "title": "The Ultimate Troll",
    "duration": "8s",
    "emotion": "peak trolling→meta satisfaction"
  },
  "technical": {
    "shot": "wide shot pulling back",
    "lens": "24mm f/2.8",
    "camera": "crane shot rising 100cm while pulling back 150cm",
    "fps": 24
  },
  "character": {
    "ref": "TROLL001_CLASSIC",
    "state": "maximum troll satisfaction",
    "position": "center, standing from desk"
  },
  "environment": {
    "location": "studio revealed to be AI-generated",
    "lighting": "reality glitching between real and digital",
    "atmosphere": "meta-reality breakdown"
  },
  "action": {
    "primary": "Revealing entire review is AI-generated, giving rating",
    "timing": {
      "0-3s": "stand up, gesture at dissolving studio",
      "3-6s": "hold up scoreboard showing '∞/10 TROLLS'",
      "6-8s": "classic trollface closeup with 'PROBLEM?' text"
    }
  },
  "audio": {
    "dialogue": {
      "text": "Plot twist: This ENTIRE review? Made with Veo 3! TROLLOLOLOLOL!",
      "delivery": "building to ultimate troll laugh",
      "timing": "0:01-0:06"
    },
    "ambient": "digital glitch ambience @ -15dB",
    "sfx": [
      {"sound": "reality glitch", "time": "0:01", "level": "-6dB"},
      {"sound": "scoreboard slam", "time": "0:04", "level": "-8dB"},
      {"sound": "troll song sting", "time": "0:06-0:08", "level": "-10dB"}
    ],
    "music": "epic troll theme climax @ -10dB"
  },
  "viral_element": "Meta reveal that trolls the audience",
  "meme_showcase": "Background fills with floating classic memes: Nyan Cat, Doge, Bad Luck Brian, all AI-animated"
}
```

## TECHNICAL SPECIFICATIONS

```json
{
  "keywords": [
    "16:9",
    "no text overlays",
    "meme aesthetic",
    "tech review parody",
    "cartoon animation hybrid",
    "trollface",
    "classic internet memes",
    "purple accent lighting",
    "meta humor",
    "AI-generated reveal"
  ],
  "visual_style": "Clean tech review meets chaotic meme culture",
  "color_palette": ["#FFFFFF", "#000000", "#9D4EDD", "#4285F4"],
  "animation_style": "2D Trollface in 3D environment, smooth transitions"
}
```

## VIRAL OPTIMIZATION

```json
{
  "hook_timing": "0:00-0:02 - Trollface as serious tech reviewer",
  "shareable_moment": {
    "timestamp": "0:20-0:22",
    "type": "meta reveal",
    "description": "Revelation that entire review is AI-generated"
  },
  "loop_potential": true,
  "trend_compatibility": "AI tool reviews + classic meme revival",
  "discussion_trigger": "Is AI the ultimate troll tool?",
  "meme_integration": {
    "beat_1": ["Problem? meme on screen"],
    "beat_2": ["Rickroll, Forever Alone, Y U NO generated by AI"],
    "beat_3": ["Nyan Cat, Doge, Bad Luck Brian floating in background"]
  }
}
```

## SUCCESS METRICS

```json
{
  "target_views": "1M+ (viral potential high)",
  "target_shares": "50K+",
  "target_engagement": "35%+ (troll + AI communities)",
  "target_demographics": [
    "Meme culture enthusiasts",
    "AI/Tech curious",
    "$TROLL holders",
    "$GEMINI3 community"
  ]
}
```

## TECHNICAL NOTES

```json
{
  "seed_strategy": "Generate beat 1 first to establish Trollface consistency",
  "complexity_rating": "medium",
  "estimated_generations": "4-6 attempts per beat",
  "special_requirements": [
    "Maintain classic Trollface proportions",
    "Ensure meme references are recognizable",
    "Balance tech review aesthetic with meme chaos"
  ]
}
```

## CROSS-PROMOTION STRATEGY

```json
{
  "troll_community": {
    "teaser": "Trollface discovers the ultimate trolling tool",
    "hashtags": ["#TROLLxVEO3", "#80MillionDollarTroll", "#AITrolling"]
  },
  "gemini3_community": {
    "angle": "Even Trollface approves of Google's AI",
    "hashtags": ["#GEMINI3", "#ChefGemmyMeetsTroll", "#GoogleAI"]
  }
}