# LPS (Limp Pump Syndrome) - Script Engineering

## TIMING CONSTRAINTS
```json
{
  "max_duration": "8 seconds per beat",
  "word_limits": {
    "beat_1": "16 words (intimate scene)",
    "beat_2": "15 words (narrator explanation)",
    "beat_3": "13 words (results testimony)",
    "beat_4": "18 words (rapid disclaimer)"
  },
  "delivery_speeds": {
    "intimate": "2.0 words/second",
    "narrator": "2.5 words/second", 
    "excited": "2.3 words/second",
    "disclaimer": "3.0 words/second"
  }
}
```

## BEAT 1 - "The Problem"
```json
{
  "beat_id": "001",
  "duration": "8s",
  "characters": ["TRENT001_EXACT", "DATE001_EXACT"],
  "dialogue": {
    "formatted_text": "She wants god candles, but all I see are limp pumps.",
    "word_count": 11,
    "timing": "0:02-0:06",
    "delivery": "disappointed whisper to self",
    "emphasis": ["god candles", "limp pumps"]
  },
  "audio_layers": {
    "ambient": "romantic jazz -22dB, apartment tone -24dB",
    "sfx": [
      {"sound": "phone vibration", "time": "0:03", "level": "-16dB"},
      {"sound": "disappointed sigh", "time": "0:07", "level": "-14dB"},
      {"sound": "ice clinking in glass", "time": "0:01", "level": "-18dB"}
    ],
    "music": "soft romantic piano -20dB, fading to concern"
  },
  "performance_notes": {
    "trent": {
      "energy": "starts at 6, drops to 3",
      "focal_point": "phone screen, avoiding her gaze",
      "physical": "shoulders slump progressively"
    },
    "date": {
      "energy": "expectant 7, confused 5",
      "focal_point": "trent's face",
      "physical": "leaning in, then pulling back"
    }
  },
  "authenticity_markers": {
    "breathing": "heavy sigh at 0:07",
    "pauses": "awkward silence 0:06-0:08",
    "natural_fumble": "almost drops phone at 0:03"
  },
  "viral_moment": "0:04 - 'limp pumps' crypto metaphor"
}
```

## BEAT 2 - "You're Not Alone"
```json
{
  "beat_id": "002", 
  "duration": "8s",
  "characters": ["NARRATOR001"],
  "dialogue": {
    "formatted_text": "Millions suffer from LPS - Limp Pump Syndrome. But now there's HarGreldo.",
    "word_count": 12,
    "timing": "0:00-0:06",
    "delivery": "warm pharmaceutical narrator, building hope",
    "emphasis": ["LPS", "HarGreldo"]
  },
  "audio_layers": {
    "ambient": "pharmaceutical commercial bed -20dB",
    "sfx": [
      {"sound": "sparkle reveal", "time": "0:04", "level": "-12dB"},
      {"sound": "hopeful chime", "time": "0:05", "level": "-14dB"},
      {"sound": "subtle whoosh", "time": "0:03", "level": "-16dB"}
    ],
    "music": "uplifting pharma theme -18dB, crescendo at reveal"
  },
  "voice_processing": {
    "eq": "broadcast warmth +2dB @ 200Hz, +3dB @ 5kHz",
    "compression": "4:1 ratio, -8dB threshold",
    "reverb": "small studio space, 10% mix"
  },
  "visual_sync": {
    "0:00-0:03": "montage of sad traders",
    "0:03-0:05": "HarGreldo bottle hero reveal",
    "0:05-0:08": "hopeful faces looking up"
  },
  "viral_moment": "0:02 - 'LPS' acronym reveal"
}
```

## BEAT 3 - "The Solution Works"
```json
{
  "beat_id": "003",
  "duration": "8s", 
  "characters": ["NARRATOR001", "TRENT001_EXACT", "DATE001_EXACT"],
  "dialogue": {
    "formatted_text": "HarGreldo makes it pump so hard, she might propose mid-Xgasm!",
    "word_count": 11,
    "timing": "0:01-0:05",
    "delivery": "enthusiastic pharma voice with wink",
    "emphasis": ["pump so hard", "mid-Xgasm"]
  },
  "audio_layers": {
    "ambient": "success ambience -22dB",
    "sfx": [
      {"sound": "chart rocket up", "time": "0:01", "level": "-14dB"},
      {"sound": "romantic gasp", "time": "0:06", "level": "-16dB"},
      {"sound": "champagne pop", "time": "0:03", "level": "-15dB"},
      {"sound": "ring box open", "time": "0:07", "level": "-17dB"}
    ],
    "music": "triumphant pharma crescendo -16dB"
  },
  "character_reactions": {
    "trent": {
      "vocalization": "confident laugh @ 0:02",
      "breathing": "relaxed, satisfied"
    },
    "date": {
      "vocalization": "delighted surprise @ 0:06",
      "breathing": "excited gasp"
    }
  },
  "viral_moment": "0:04 - 'propose mid-Xgasm' line with visual"
}
```

## BEAT 4 - "Disclaimer & Call to Action"
```json
{
  "beat_id": "004",
  "duration": "8s",
  "characters": ["NARRATOR001"],
  "dialogue": {
    "primary": {
      "text": "Side effects may include meeting parents and feeling young again.",
      "timing": "0:00-0:04",
      "delivery": "rapid pharma disclaimer",
      "word_count": 10
    },
    "cta": {
      "text": "Go all in with HarGreldo!",
      "timing": "0:05-0:07",
      "delivery": "inspiring rallying cry",
      "word_count": 5
    },
    "total_words": 15
  },
  "audio_layers": {
    "ambient": "pharmaceutical bed -24dB",
    "sfx": [
      {"sound": "disclaimer swoosh", "time": "0:00", "level": "-16dB"},
      {"sound": "triumphant sting", "time": "0:06", "level": "-12dB"}
    ],
    "music": "uplifting pharma ending -16dB, final chord @ 0:07"
  },
  "disclaimer_delivery": {
    "speed": "3.0 words/second",
    "style": "classic pharma rapid-fire",
    "processing": "slight compression for clarity"
  },
  "viral_moment": "0:02 - crypto-themed side effects"
}
```

## COMPLETE AUDIO ARCHITECTURE
```json
{
  "master_mix": {
    "dialogue": "-6dB peak, center",
    "music": "-18dB average, stereo",
    "sfx": "-12dB average, positioned",
    "ambient": "-20dB bed, wide stereo"
  },
  "consistency_elements": {
    "room_tone": "continuous across all beats",
    "music_key": "C major, 120 BPM",
    "voice_processing": "consistent EQ curve"
  },
  "dynamic_range": {
    "quiet_moments": "-24dB",
    "peak_moments": "-6dB",
    "average_level": "-12dB"
  }
}
```

## CHARACTER VOICE PROFILES
```json
{
  "TRENT001": {
    "vocal_characteristics": {
      "pitch": "tenor, drops when disappointed",
      "pace": "normal to slow when embarrassed",
      "tone": "starts confident, becomes vulnerable"
    },
    "speech_patterns": {
      "crypto_slang": "naturally integrated",
      "filler_words": "um, uh when nervous",
      "breathing": "audible sighs of frustration"
    }
  },
  "NARRATOR001": {
    "vocal_characteristics": {
      "pitch": "warm baritone, professional",
      "pace": "measured to rapid for disclaimers",
      "tone": "caring pharmaceutical authority"
    },
    "delivery_style": {
      "articulation": "broadcast clear",
      "emphasis": "strategic product mentions",
      "emotion": "empathetic to enthusiastic"
    }
  }
}
```

## VIRAL OPTIMIZATION ELEMENTS
```json
{
  "quotable_lines": [
    "all I see are limp pumps",
    "Limp Pump Syndrome",
    "propose mid-Xgasm",
    "go all in with HarGreldo"
  ],
  "audio_hooks": [
    "chart notification sounds",
    "pharmaceutical sparkle",
    "romantic gasp timing"
  ],
  "comedic_timing": {
    "setup": "0:00-0:08 (beat 1)",
    "expansion": "0:00-0:06 (beat 2)",
    "payoff": "0:01-0:05 (beat 3)",
    "button": "0:05-0:07 (beat 4)"
  }
}
```

## QUALITY VALIDATION
```json
{
  "timing_check": {
    "beat_1": "11 words / 8s ✓",
    "beat_2": "12 words / 8s ✓",
    "beat_3": "11 words / 8s ✓", 
    "beat_4": "15 words / 8s ✓"
  },
  "naturalism": {
    "contractions": "used throughout ✓",
    "pauses": "strategic placement ✓",
    "breathing": "incorporated ✓"
  },
  "voice_consistency": {
    "character_maintained": "across beats ✓",
    "energy_progression": "tracked ✓",
    "pharma_style": "authentic ✓"
  }
}
```

## PERFORMANCE NOTES
```json
{
  "director_guidance": {
    "beat_1": "intimate vulnerability, real embarrassment",
    "beat_2": "professional warmth building to hope",
    "beat_3": "celebration without overselling",
    "beat_4": "rapid legal into inspiring finish"
  },
  "authenticity_focus": {
    "avoid": "porn parody territory",
    "maintain": "pharmaceutical commercial aesthetic",
    "balance": "innuendo with taste"
  }
}
```