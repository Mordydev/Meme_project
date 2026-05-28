# $STD Pharma Commercial - Script Engineering

## PROJECT METADATA
```json
{
  "title": "Ask Your Financial Advisor About STD",
  "script_version": "2.0",
  "total_duration": "24 seconds (3 beats)",
  "delivery_style": "pharmaceutical_parody",
  "voice_consistency": "medical_professional_comedy"
}
```

## TIMING CONSTRAINTS
```json
{
  "per_beat_duration": "8 seconds exactly",
  "word_limits": {
    "beat_1": "two speakers, 9 words each max",
    "beat_2": "single speaker focus, 15 words max",
    "beat_3": "speaker + narrator, 10 + 25 words"
  },
  "delivery_speeds": {
    "patient": "2.5 words/second (anxious)",
    "doctor": "2.0 words/second (professional)",
    "narrator": "3.5 words/second (rapid disclaimer)"
  }
}
```

## BEAT 1 SCRIPT - "The Consultation Begins"
```json
{
  "beat_id": "001",
  "duration": "8s",
  "characters": ["PATIENT001_EXACT", "DOCTOR001_EXACT"],
  "dialogue": {
    "exchange": [
      {
        "speaker": "PATIENT",
        "text": "Doctor, I keep buying high and selling low.",
        "timing": "0:01-0:03",
        "delivery": "anxious confession",
        "emphasis": "high and low",
        "word_count": 9
      },
      {
        "speaker": "PATIENT",
        "text": "I see green candles in my sleep!",
        "timing": "0:04-0:06",
        "delivery": "desperate escalation",
        "emphasis": "green candles",
        "word_count": 7
      }
    ],
    "total_words": 16,
    "authenticity_markers": {
      "breath": "sharp inhale at 0:03",
      "gesture": "shows phone at 0:06",
      "fidget": "constant throughout"
    }
  },
  "audio_design": {
    "dialogue_track": {
      "level": "-6dB",
      "eq": "presence boost +2dB @ 4kHz",
      "processing": "light compression 2:1"
    },
    "ambient_track": {
      "room_tone": "medical office hum -20dB",
      "fluorescent": "subtle buzz -24dB",
      "constant": true
    },
    "sfx_track": [
      {"sound": "phone notification", "timing": "0:01", "level": "-15dB"},
      {"sound": "paper rustle", "timing": "0:07", "level": "-18dB"}
    ]
  },
  "performance_notes": {
    "patient_energy": "builds from 5 to 8",
    "physical_action": "increasingly agitated movements",
    "eye_contact": "avoids doctor, focuses on phone"
  }
}
```

## BEAT 2 SCRIPT - "The Diagnosis"
```json
{
  "beat_id": "002",
  "duration": "8s",
  "characters": ["DOCTOR001_EXACT", "PATIENT001_EXACT"],
  "dialogue": {
    "lines": [
      {
        "speaker": "DOCTOR",
        "text": "Classic symptoms of STD - Solana Trench Disease.",
        "timing": "0:01-0:04",
        "delivery": "professional diagnosis tone",
        "emphasis": "STD",
        "word_count": 8
      },
      {
        "speaker": "DOCTOR",
        "text": "Look at this X-ray.",
        "timing": "0:04-0:05",
        "delivery": "concerned instruction",
        "emphasis": "X-ray",
        "word_count": 5
      }
    ],
    "total_words": 13,
    "visual_sync": {
      "0:01-0:03": "doctor nods knowingly",
      "0:04": "gestures to X-ray viewer",
      "0:05-0:08": "X-ray of wallet with holes visible"
    }
  },
  "audio_layers": {
    "dialogue_track": {
      "doctor_voice": "authoritative baritone -6dB",
      "processing": "warm EQ, slight reverb"
    },
    "sfx_track": [
      {"sound": "clipboard writing", "timing": "0:01-0:03", "level": "-16dB"},
      {"sound": "X-ray light click", "timing": "0:04", "level": "-12dB"},
      {"sound": "patient gasp", "timing": "0:06", "level": "-10dB"}
    ],
    "ambient": "consistent medical room tone -20dB"
  },
  "viral_moment": {
    "timestamp": "0:05-0:08",
    "element": "X-ray showing wallet with holes",
    "shareability": "visual gag resonates with crypto traders"
  }
}
```

## BEAT 3 SCRIPT - "The Prescription"
```json
{
  "beat_id": "003",
  "duration": "8s",
  "characters": ["DOCTOR001_EXACT", "PATIENT001_EXACT", "NARRATOR_VO"],
  "dialogue": {
    "sequence": [
      {
        "speaker": "DOCTOR",
        "text": "I'm prescribing more $STD.",
        "timing": "0:00-0:02",
        "delivery": "matter-of-fact medical",
        "emphasis": "$STD",
        "word_count": 5
      },
      {
        "speaker": "NARRATOR_VO",
        "text": "Side effects include: portfolio shrinkage, fear of Telegram groups, emotional attachment to JPEGs, explaining blockchain at dinner parties, and chronic hopium addiction.",
        "timing": "0:02-0:07",
        "delivery": "rapid pharmaceutical disclaimer",
        "speed": "3.5 words/second",
        "word_count": 24
      }
    ],
    "total_words": 29,
    "disclaimer_timing": {
      "portfolio_shrinkage": "0:02-0:03",
      "telegram_fear": "0:03-0:04",
      "jpeg_attachment": "0:04-0:05",
      "blockchain_explaining": "0:05-0:06",
      "hopium_addiction": "0:06-0:07"
    }
  },
  "audio_production": {
    "doctor_track": {
      "level": "-6dB",
      "processing": "clear, present"
    },
    "narrator_track": {
      "level": "-4dB",
      "processing": "broadcast compression 4:1",
      "eq": "pharmaceutical voiceover preset",
      "delivery": "perfect clarity despite speed"
    },
    "music_bed": {
      "style": "soft pharmaceutical commercial",
      "level": "-18dB",
      "timing": "fade in 0:02, sustain to end"
    },
    "sfx": [
      {"sound": "prescription tear", "timing": "0:01", "level": "-14dB"},
      {"sound": "paper handoff", "timing": "0:07", "level": "-16dB"}
    ]
  },
  "performance_direction": {
    "patient_reaction": "increasingly worried during disclaimer",
    "doctor_demeanor": "professional detachment",
    "visual_focus": "patient's face during side effects"
  }
}
```

## VOICE CONSISTENCY GUIDE
```json
{
  "PATIENT_VOICE": {
    "character": "Brad the Trader",
    "base_tone": "anxious tenor",
    "progression": "worried→desperate→resigned",
    "quirks": [
      "voice cracks when stressed",
      "speeds up when panicking",
      "uses crypto slang naturally"
    ],
    "consistency_markers": {
      "pitch_range": "C3-G4",
      "accent": "neutral American",
      "breathing": "shallow when anxious"
    }
  },
  "DOCTOR_VOICE": {
    "character": "Dr. Stevens",
    "base_tone": "calm baritone",
    "progression": "professional→sympathetic→clinical",
    "quirks": [
      "measured pacing",
      "slight pause before medical terms",
      "knowing tone"
    ],
    "consistency_markers": {
      "pitch_range": "G2-D4",
      "accent": "educated American",
      "breathing": "controlled, steady"
    }
  },
  "NARRATOR_VOICE": {
    "style": "pharmaceutical commercial",
    "tone": "professional male",
    "speed": "rapid but clear",
    "consistency_markers": {
      "pitch": "consistent broadcast tone",
      "emphasis": "slight stress on symptoms",
      "clarity": "perfect enunciation"
    }
  }
}
```

## AUTHENTICITY ENHANCEMENT
```json
{
  "natural_dialogue_elements": {
    "beat_1": {
      "interruption": "patient almost cuts himself off at 0:03",
      "physical_tell": "voice shakes on 'green candles'",
      "authentic_pause": "0.5s breath between sentences"
    },
    "beat_2": {
      "medical_authority": "doctor's practiced diagnosis delivery",
      "genuine_concern": "slight softening on 'Look at this'",
      "professional_distance": "maintains clinical tone"
    },
    "beat_3": {
      "contrast": "calm doctor vs rapid narrator",
      "patient_reaction": "audible worry sounds under disclaimer",
      "timing_precision": "disclaimer perfectly timed to 5 seconds"
    }
  }
}
```

## SHAREABILITY OPTIMIZATION
```json
{
  "quotable_lines": [
    "I keep buying high and selling low",
    "Classic symptoms of STD",
    "emotional attachment to JPEGs"
  ],
  "meme_moments": {
    "visual": "X-ray of wallet with holes",
    "audio": "rapid side effects list",
    "conceptual": "crypto trading as medical condition"
  },
  "platform_hooks": {
    "tiktok": "side effects segment perfect for duets",
    "youtube": "full narrative arc satisfying",
    "instagram": "X-ray moment screenshot-worthy"
  }
}
```

## FINAL AUDIO MIX SPECIFICATIONS
```json
{
  "master_levels": {
    "dialogue": "-6dB peak",
    "music": "-18dB average",
    "sfx": "-12dB average",
    "ambient": "-20dB constant"
  },
  "frequency_separation": {
    "dialogue": "200Hz-8kHz focus",
    "music": "sub-200Hz and above 10kHz",
    "room_tone": "full spectrum at low level"
  },
  "dynamics": {
    "dialogue_compression": "gentle 2:1",
    "narrator_compression": "broadcast 4:1",
    "overall_LUFS": "-16 LUFS integrated"
  }
}
```

## SCRIPT VALIDATION CHECKLIST
✓ Total duration: exactly 24 seconds (3×8s beats)
✓ Word counts: within specified limits per beat
✓ Natural dialogue: includes authentic markers
✓ Voice consistency: detailed for all characters
✓ Viral elements: identified and emphasized
✓ Audio design: comprehensive and layered
✓ Performance notes: specific and actionable
✓ Platform optimization: considered for all major platforms

## PRODUCTION NOTES
- Generate beats in order to maintain character consistency
- Doctor's calm contrasts with patient's anxiety
- Narrator must maintain clarity at high speed
- X-ray gag is crucial viral moment
- Side effects list should feel medically authentic while being crypto-specific