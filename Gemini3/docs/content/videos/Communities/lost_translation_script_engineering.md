# Lost in Translation - Script Engineering & Dialogue

## PROJECT OVERVIEW
```json
PROJECT_INFO = {
  "title": "Lost in Translation: A Crypto Linguistic Investigation",
  "duration": "40 seconds (5 beats × 8 seconds)",
  "style": "Comedy documentary with academic authenticity",
  "tone": "Intellectual confusion meets crypto chaos"
}
```

## TIMING CONSTRAINTS
```json
TIMING_RULES = {
  "max_duration": "8 seconds exactly per beat",
  "word_limits": {
    "beat_1": "16 words (academic analysis)",
    "beat_2": "18 words (telegram chaos)",
    "beat_3": "14 words (surprised discovery)",
    "beat_4": "10 words (mystical narration)",
    "beat_5": "9 words (tech reveal)"
  },
  "delivery_speeds": {
    "beat_1": "2.5 words/second (measured academic)",
    "beat_2": "3 words/second (overwhelmed)",
    "beat_3": "2 words/second (dawning realization)",
    "beat_4": "2 words/second (reverent)",
    "beat_5": "2 words/second (professional)"
  }
}
```

## BEAT 1: THE ACADEMIC DISCOVERS CRYPTO

### Detailed Script
```json
BEAT_1_SCRIPT = {
  "character": "LINGUIST001_EXACT",
  "emotional_state": "professional curiosity→academic horror",
  "dialogue": {
    "lines": [
      {
        "text": "quantum-enhanced deflationary tokenomics...",
        "timing": "0:01-0:03",
        "delivery": "reading with growing confusion",
        "emphasis": "quantum-enhanced",
        "visual_cue": "adjusting glasses"
      },
      {
        "text": "this is just... buzzwords arranged randomly!",
        "timing": "0:04-0:07",
        "delivery": "academic exasperation",
        "emphasis": "randomly",
        "visual_cue": "dropping paper in disbelief"
      }
    ],
    "total_words": 9,
    "includes_pauses": true
  },
  "reactions": {
    "0:02-0:03": "furrowing brow, marking paper with red pen",
    "0:07-0:08": "removing glasses to clean them, shaking head"
  },
  "voice_notes": {
    "consistency": "maintain professorial tone throughout",
    "modulation": "voice rises 15% in disbelief",
    "breathing": "sharp intake at 0:03"
  }
}
```

### Audio Design Beat 1
```json
BEAT_1_AUDIO = {
  "dialogue_track": {
    "processing": {
      "eq": "slight mid-range boost for clarity",
      "compression": "light to maintain dynamics",
      "room_reverb": "academic office acoustics"
    },
    "level": "-6dB peak"
  },
  "ambient_track": {
    "elements": [
      {
        "sound": "quiet library ambience",
        "level": "-22dB",
        "constant": true
      },
      {
        "sound": "paper rustling",
        "level": "-18dB",
        "timing": "0:00-0:03"
      }
    ]
  },
  "sfx_track": {
    "spot_effects": [
      {
        "sound": "red pen scratching",
        "timing": "0:02-0:03",
        "level": "-12dB"
      },
      {
        "sound": "paper dropping on desk",
        "timing": "0:07",
        "level": "-10dB"
      },
      {
        "sound": "glasses cleaning",
        "timing": "0:07.5",
        "level": "-15dB"
      }
    ]
  }
}
```

## BEAT 2: TELEGRAM VOICE CHAT CHAOS

### Detailed Script
```json
BEAT_2_SCRIPT = {
  "character": "LINGUIST001_EXACT",
  "emotional_state": "academic overwhelm→complete confusion",
  "dialogue": {
    "lines": [
      {
        "text": "wen moon ser...",
        "timing": "0:00-0:01",
        "delivery": "trying to translate",
        "emphasis": "wen",
        "visual_cue": "writing notes frantically"
      },
      {
        "text": "lfg to valhalla...",
        "timing": "0:02-0:03",
        "delivery": "increasingly confused",
        "emphasis": "valhalla"
      },
      {
        "text": "what language is this?!",
        "timing": "0:05-0:07",
        "delivery": "academic breakdown",
        "emphasis": "what",
        "visual_cue": "throwing hands up"
      }
    ],
    "total_words": 10,
    "background_voices": true
  },
  "telegram_chaos": {
    "background_chatter": [
      "gm ser", "wagmi", "hfsp", "aping in", "diamond hands"
    ],
    "timing": "continuous @ -20dB"
  }
}
```

### Audio Design Beat 2
```json
BEAT_2_AUDIO = {
  "dialogue_track": {
    "processing": {
      "eq": "phone speaker emulation",
      "compression": "heavy for telegram feel",
      "distortion": "slight digital artifacts"
    },
    "level": "-6dB peak"
  },
  "ambient_track": {
    "elements": [
      {
        "sound": "telegram notification pings",
        "level": "-15dB",
        "timing": "random throughout"
      },
      {
        "sound": "multiple voices overlapping",
        "level": "-20dB",
        "constant": true
      }
    ]
  },
  "sfx_track": {
    "spot_effects": [
      {
        "sound": "frantic note-taking",
        "timing": "0:00-0:04",
        "level": "-12dB"
      },
      {
        "sound": "pen snapping",
        "timing": "0:06",
        "level": "-10dB"
      }
    ]
  },
  "chaos_layer": {
    "voice_samples": ["moon soon", "buy the dip", "ngmi"],
    "processing": "heavy reverb, panned randomly",
    "level": "-22dB"
  }
}
```

## BEAT 3: DISCOVERING BOOK OF SOL

### Detailed Script
```json
BEAT_3_SCRIPT = {
  "character": "LINGUIST001_EXACT",
  "emotional_state": "cautious curiosity→genuine surprise",
  "dialogue": {
    "lines": [
      {
        "text": "wait... the book of sol community...",
        "timing": "0:01-0:04",
        "delivery": "slow realization",
        "emphasis": "book of sol",
        "visual_cue": "leaning forward"
      },
      {
        "text": "they're discussing... actual building?",
        "timing": "0:05-0:07",
        "delivery": "academic approval",
        "emphasis": "actual",
        "visual_cue": "nodding slowly"
      }
    ],
    "total_words": 11,
    "tone_shift": "confusion to clarity"
  },
  "screen_content": {
    "visible_text": "Book of SOL chat: discussing smart contract architecture",
    "linguist_notes": "Real technical terms! Coherent sentences!"
  }
}
```

### Audio Design Beat 3
```json
BEAT_3_AUDIO = {
  "dialogue_track": {
    "processing": {
      "eq": "warm, clear academic tone returns",
      "compression": "minimal, natural dynamics",
      "reverb": "office space, less stressed"
    },
    "level": "-6dB peak"
  },
  "ambient_track": {
    "elements": [
      {
        "sound": "calm typing sounds",
        "level": "-22dB",
        "timing": "0:01-0:08"
      },
      {
        "sound": "subtle page turns",
        "level": "-20dB",
        "timing": "0:04"
      }
    ]
  },
  "sfx_track": {
    "spot_effects": [
      {
        "sound": "interested 'hmm'",
        "timing": "0:03",
        "level": "-12dB"
      },
      {
        "sound": "pen writing (not frantic)",
        "timing": "0:05-0:07",
        "level": "-15dB"
      }
    ]
  },
  "music": "subtle hopeful pad enters @ -20dB"
}
```

## BEAT 4: THE ANCIENT BOOK'S DICTIONARY

### Detailed Script
```json
BEAT_4_SCRIPT = {
  "narrator": "MYSTICAL_VOICE_001",
  "scene_type": "mystical revelation",
  "dialogue": {
    "lines": [
      {
        "text": "the ancient book reveals...",
        "timing": "0:01-0:03",
        "delivery": "mystical narrator",
        "emphasis": "ancient"
      },
      {
        "text": "signal versus noise.",
        "timing": "0:05-0:07",
        "delivery": "wise conclusion",
        "emphasis": "signal"
      }
    ],
    "total_words": 7,
    "visual_sync": "dictionary pages turning"
  }
}
```

### Audio Design Beat 4
```json
BEAT_4_AUDIO = {
  "dialogue_track": {
    "processing": {
      "eq": "deep, resonant narrator preset",
      "compression": "broadcast standard",
      "reverb": "cathedral space"
    },
    "level": "-6dB peak"
  },
  "mystical_atmosphere": {
    "elements": [
      {
        "sound": "ancient library ambience",
        "level": "-20dB",
        "constant": true
      },
      {
        "sound": "magical page turns",
        "level": "-12dB",
        "timing": "0:01, 0:04, 0:06"
      }
    ]
  },
  "sfx_track": {
    "spot_effects": [
      {
        "sound": "quill writing",
        "timing": "0:03-0:05",
        "level": "-10dB"
      },
      {
        "sound": "golden chimes",
        "timing": "0:07",
        "level": "-12dB"
      }
    ]
  },
  "music": "mystical orchestral swell @ -15dB"
}
```

## BEAT 5: GEMINI3 REVEAL

### Detailed Script
```json
BEAT_5_SCRIPT = {
  "narrator": "PROFESSIONAL_ANNOUNCER",
  "scene_type": "tech showcase",
  "dialogue": {
    "lines": [
      {
        "text": "gemini3 presents...",
        "timing": "0:02-0:03",
        "delivery": "confident announcer",
        "emphasis": "gemini3"
      },
      {
        "text": "translating vision into reality.",
        "timing": "0:04-0:07",
        "delivery": "tagline delivery",
        "emphasis": "reality"
      }
    ],
    "total_words": 6
  }
}
```

## AUTHENTICITY MARKERS

```json
NATURAL_SPEECH_PATTERNS = {
  "beat_1": {
    "academic_markers": ["hmm", "indeed", "fascinating"],
    "confusion_sounds": "confused muttering while reading",
    "authentic_moments": "genuine shock at nonsense"
  },
  "beat_2": {
    "overwhelm_indicators": ["rapid breathing", "stuttering"],
    "background_authenticity": "real telegram chat energy",
    "breakdown_moment": "voice crack on 'what language'"
  },
  "beat_3": {
    "discovery_sounds": ["interested hum", "thoughtful pause"],
    "approval_markers": "slight smile audible in voice",
    "contrast": "calm after chaos"
  }
}
```

## LINGUISTIC GLOSSARY VISUAL

```json
DICTIONARY_CONTENT = {
  "noise_column": {
    "terms": ["wen moon", "lfg", "wagmi", "ser", "gm", "hfsp"],
    "translation": ["confused symbols and question marks"]
  },
  "signal_column": {
    "terms": ["smart contract", "audit", "documentation", "building"],
    "translation": ["actual definitions with technical meaning"]
  }
}
```

## VIRAL MOMENTS & QUOTABLES

```json
SHAREABLE_ELEMENTS = {
  "quotable_lines": [
    "This is just buzzwords arranged randomly!",
    "What language is this?!",
    "They're discussing... actual building?"
  ],
  "meme_moments": [
    "0:07 - Academic horror at whitepaper",
    "0:14 - Complete breakdown in telegram",
    "0:31 - Dictionary reveal contrast"
  ],
  "reaction_fuel": [
    "Every academic trying to understand crypto",
    "The universal telegram chat experience",
    "Book of SOL as the oasis of sense"
  ]
}
```

## PERFORMANCE NOTES

```json
PERFORMANCE_GUIDE = {
  "beat_1": {
    "energy_arc": "3→5→8→6",
    "physical": "professorial to exasperated",
    "focal_point": "whitepaper then camera",
    "key_moment": "the realization it's nonsense"
  },
  "beat_2": {
    "energy_arc": "6→8→10→9",
    "physical": "trying to keep up, failing",
    "focal_point": "screen with telegram chat",
    "key_moment": "complete linguistic breakdown"
  },
  "beat_3": {
    "energy_arc": "4→3→5→6",
    "physical": "cautious lean in, then relief",
    "focal_point": "Book of SOL community chat",
    "key_moment": "discovering coherent discussion"
  }
}
```

## QUALITY VALIDATION CHECKLIST

```json
QUALITY_CHECK = {
  "timing": {
    "all_beats_8_seconds": "✓",
    "dialogue_within_limits": "✓",
    "pauses_included": "✓"
  },
  "humor": {
    "academic_contrast": "strong ✓",
    "crypto_chaos_captured": "authentic ✓",
    "book_of_sol_elevation": "clear ✓"
  },
  "audio_richness": {
    "environmental_storytelling": "✓",
    "character_consistency": "✓",
    "viral_sound_moments": "✓"
  }
}
```

---

**Next Step**: Proceed to Document 3 for Visual Composition Guide including character design and environmental aesthetics.