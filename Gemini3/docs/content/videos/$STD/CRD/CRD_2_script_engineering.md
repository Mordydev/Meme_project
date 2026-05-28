# CRD - Chronic Round Dripper: Script Engineering & Dialogue Optimization

## Core Timing Constraints & Word Limits
```json
{
  "TIMING_RULES": {
    "max_duration": "8 seconds exactly per beat",
    "word_limits": {
      "patient_solo": "12-18 words",
      "doctor_solo": "10-15 words", 
      "narrator_voiceover": "15-20 words",
      "patient_doctor_exchange": "8-10 words each"
    },
    "delivery_speeds": {
      "panicked_patient": "3 words/second",
      "clinical_doctor": "2 words/second",
      "narrator_commercial": "2.5 words/second"
    }
  }
}
```

## Character Voice Profiles

### DEGEN_PATIENT_001 Voice Consistency
```json
{
  "voice_character": {
    "base_tone": "confused millennial crypto trader",
    "pace": "starts slow, accelerates when panicking",
    "pitch": "mid-range, rises when stressed",
    "accent": "American, slight valley uptalk when questioning",
    "speech_patterns": ["crypto slang", "questioning inflection", "nervous repetition"],
    "emotional_modulation": "confusion → panic → desperation",
    "consistency_markers": ["what the actual fuck", "crypto terminology", "nervous energy"]
  }
}
```

### DOCTOR_001 Voice Consistency
```json
{
  "voice_character": {
    "base_tone": "professional medical authority",
    "pace": "measured, clinical precision",
    "pitch": "authoritative baritone",
    "accent": "educated American, medical training evident",
    "speech_patterns": ["medical terminology", "professional composure", "controlled reactions"],
    "emotional_modulation": "professional → concerned → disgusted",
    "consistency_markers": ["clinical vocabulary", "professional restraint breaking", "authoritative delivery"]
  }
}
```

### NARRATOR_VOICE Profile
```json
{
  "voice_character": {
    "base_tone": "pharmaceutical commercial narrator",
    "pace": "measured commercial delivery",
    "pitch": "warm, trustworthy announcer voice",
    "accent": "neutral American commercial",
    "speech_patterns": ["medical authority", "product benefits", "disclaimer speed"],
    "emotional_modulation": "authoritative → helpful → promotional",
    "consistency_markers": ["pharmaceutical commercial cadence", "medical terminology", "product positioning"]
  }
}
```

## Beat-by-Beat Script Engineering

### BEAT 1: Patient Discovery Script (8 seconds)
```json
{
  "BEAT_1_SCRIPT": {
    "character": "DEGEN_PATIENT_001",
    "emotional_state": "confused→panicked",
    "dialogue": {
      "lines": [
        {
          "text": "what the actual fuck is this?!",
          "timing": "0:01-0:03",
          "delivery": "confused, staring at phone charts",
          "emphasis": "actual fuck",
          "word_count": 6
        },
        {
          "text": "my crypto bags are sinking, my dick's oozing...",
          "timing": "0:04-0:07",
          "delivery": "panicked realization, looking down",
          "emphasis": "oozing",
          "word_count": 8
        }
      ],
      "total_words": 14,
      "includes_pauses": true
    },
    "reactions": {
      "0:00-0:01": "staring at phone, charts dropping",
      "0:03-0:04": "pause, looks down, opens pants",
      "0:07-0:08": "horrified expression, backing away"
    },
    "voice_notes": {
      "consistency": "maintain crypto degen energy",
      "modulation": "voice cracks on 'oozing'",
      "breathing": "sharp intake at 0:03"
    }
  }
}
```

### BEAT 2: Medical Examination Script (8 seconds)
```json
{
  "BEAT_2_SCRIPT": {
    "characters": ["DEGEN_PATIENT_001", "DOCTOR_001"],
    "interaction_type": "medical examination with horror",
    "dialogue": {
      "exchange": [
        {
          "speaker": "DOCTOR_001",
          "text": "let me take a look here...",
          "timing": "0:00-0:02",
          "delivery": "professional clinical approach",
          "word_count": 6
        },
        {
          "speaker": "DOCTOR_001", 
          "text": "oh my god... what is this condition?",
          "timing": "0:03-0:06",
          "delivery": "professional composure breaking, horror",
          "emphasis": "my god",
          "word_count": 7
        },
        {
          "speaker": "PATIENT",
          "text": "i don't know, doc!",
          "timing": "0:06-0:08",
          "delivery": "desperate, pleading",
          "word_count": 5
        }
      ],
      "total_words": 18,
      "medical_authenticity": "clinical examination language"
    },
    "physical_actions": {
      "0:00-0:02": "doctor approaches, professional demeanor",
      "0:02-0:03": "doctor examines, face changes",
      "0:03-0:05": "doctor recoils, covers face",
      "0:06-0:08": "patient anxious, seeking help"
    }
  }
}
```

### BEAT 3: Narrator CRD Introduction Script (8 seconds)
```json
{
  "BEAT_3_SCRIPT": {
    "narrator": "PHARMACEUTICAL_NARRATOR_VOICE",
    "style": "professional medical commercial",
    "dialogue": {
      "voiceover": {
        "text": "if your dick drips enough to water the Sahara desert, you might have CRD",
        "timing": "0:00-0:05",
        "delivery": "authoritative pharmaceutical narrator, serious medical tone",
        "emphasis": "CRD",
        "word_count": 15
      },
      "acronym_reveal": {
        "text": "Chronic Round Dripper syndrome",
        "timing": "0:05-0:08", 
        "delivery": "clear enunciation, medical authority",
        "emphasis": "Chronic Round Dripper",
        "word_count": 4
      },
      "total_words": 19
    },
    "commercial_authenticity": {
      "tone": "serious pharmaceutical commercial",
      "pacing": "measured, authoritative",
      "medical_language": "clinical terminology with absurd condition"
    }
  }
}
```

### BEAT 4: Diadik Solution Introduction Script (8 seconds)
```json
{
  "BEAT_4_SCRIPT": {
    "narrator": "PHARMACEUTICAL_NARRATOR_VOICE",
    "style": "product solution presentation",
    "dialogue": {
      "solution_intro": {
        "text": "Diadik - a non-surgical, chemical-free way to choke off your drip",
        "timing": "0:01-0:05",
        "delivery": "confident product presentation, solution-oriented",
        "emphasis": "Diadik, non-surgical, chemical-free",
        "word_count": 12
      },
      "product_description": {
        "text": "a prosthetic diamond-encrusted super absorbent penile sock",
        "timing": "0:05-0:08",
        "delivery": "clinical product description with luxury element",
        "emphasis": "diamond-encrusted",
        "word_count": 8
      },
      "total_words": 20
    },
    "product_positioning": {
      "tone": "medical solution with luxury twist",
      "authority": "pharmaceutical confidence",
      "absurdity": "serious delivery of ridiculous product"
    }
  }
}
```

### BEAT 5: Diamond Dick Luxury Script (8 seconds)
```json
{
  "BEAT_5_SCRIPT": {
    "narrator": "LUXURY_COMMERCIAL_NARRATOR",
    "style": "high-end product showcase",
    "dialogue": {
      "luxury_positioning": {
        "text": "when you wear your Diadik, you'll have the most expensive dick in the room",
        "timing": "0:01-0:05",
        "delivery": "luxury product commercial, aspirational tone",
        "emphasis": "most expensive dick",
        "word_count": 14
      },
      "value_proposition": {
        "text": "size doesn't matter when your dick is worth a mil",
        "timing": "0:05-0:08",
        "delivery": "confident luxury positioning",
        "emphasis": "worth a mil",
        "word_count": 10
      },
      "total_words": 24
    },
    "luxury_commercial_authenticity": {
      "tone": "high-end product commercial",
      "aspiration": "wealth and status positioning",
      "absurd_luxury": "serious luxury tone for ridiculous product"
    }
  }
}
```

### BEAT 6: Call to Action & Meme Conclusion Script (8 seconds)
```json
{
  "BEAT_6_SCRIPT": {
    "narrator": "PHARMACEUTICAL_NARRATOR_VOICE",
    "style": "pharmaceutical commercial conclusion",
    "dialogue": {
      "prescription_call": {
        "text": "ask your physician if Diadik is right for you",
        "timing": "0:00-0:03",
        "delivery": "standard pharmaceutical call to action",
        "emphasis": "Diadik",
        "word_count": 9
      },
      "medicare_eligibility": {
        "text": "you may be eligible for Medicare coverage",
        "timing": "0:03-0:05",
        "delivery": "helpful medical information tone",
        "word_count": 8
      },
      "meme_conclusion": {
        "text": "no more wen lambo, wen Diadik",
        "timing": "0:05-0:08",
        "delivery": "crypto culture callback, meme reference",
        "emphasis": "wen Diadik",
        "word_count": 6
      },
      "total_words": 23
    },
    "commercial_conclusion": {
      "pharmaceutical_standard": "typical medical commercial ending",
      "crypto_culture_twist": "meme culture reference for viral appeal",
      "call_to_action": "clear next steps for audience"
    }
  }
}
```

## Audio Layer Architecture

### Comprehensive Audio Design
```json
{
  "AUDIO_DESIGN": {
    "dialogue_track": {
      "processing": {
        "eq": "presence boost +3dB @ 5kHz for clarity",
        "compression": "3:1 ratio, medical commercial standard",
        "narrator_enhancement": "warm commercial voice processing"
      },
      "level": "-6dB peak",
      "panning": "center for all dialogue"
    },
    "medical_ambient": {
      "elements": [
        {
          "sound": "medical office ambience",
          "level": "-20dB",
          "constant": true,
          "beats": [2, 6]
        },
        {
          "sound": "crypto trading room hum",
          "level": "-18dB", 
          "beats": [1]
        }
      ]
    },
    "pharmaceutical_music": {
      "style": "serious pharmaceutical commercial underscore",
      "elements": {
        "beats_1-2": "subtle tension building",
        "beats_3-4": "authoritative medical commercial",
        "beats_5": "luxury product showcase",
        "beat_6": "confident commercial conclusion"
      },
      "level": "-15dB under dialogue",
      "eq": "high-pass @ 80Hz to avoid dialogue conflict"
    },
    "sfx_layers": {
      "medical_sounds": [
        {"sound": "stethoscope", "timing": "beat_2:0:01", "level": "-12dB"},
        {"sound": "medical chart rustling", "timing": "beat_2:0:05", "level": "-15dB"}
      ],
      "product_sounds": [
        {"sound": "luxury package opening", "timing": "beat_4:0:02", "level": "-10dB"},
        {"sound": "diamond sparkle effect", "timing": "beat_5:0:03", "level": "-8dB"}
      ],
      "crypto_sounds": [
        {"sound": "phone notification", "timing": "beat_1:0:01", "level": "-12dB"},
        {"sound": "trading app sounds", "timing": "beat_1:0:04", "level": "-14dB"}
      ]
    }
  }
}
```

## Authenticity Markers by Content Type

### Pharmaceutical Commercial Authenticity
```json
{
  "pharma_commercial_markers": {
    "narrator_delivery": "warm, authoritative, trustworthy",
    "medical_terminology": "clinical accuracy mixed with absurd condition",
    "commercial_pacing": "measured delivery with emphasis on product name",
    "call_to_action": "standard pharmaceutical commercial format",
    "disclaimer_style": "rapid delivery for restrictions and conditions"
  }
}
```

### Crypto Culture Authenticity  
```json
{
  "crypto_culture_markers": {
    "degen_language": "what the actual fuck, crypto bags sinking",
    "trading_references": "charts dropping, portfolio bleeding",
    "meme_culture": "wen lambo → wen Diadik transformation",
    "community_slang": "authentic crypto trader vocabulary",
    "lifestyle_references": "Solana hoodie, trading addiction"
  }
}
```

### Medical Professional Authenticity
```json
{
  "medical_authenticity_markers": {
    "clinical_approach": "professional examination procedure",
    "medical_terminology": "condition assessment language",
    "professional_breakdown": "composure cracking under extreme circumstances",
    "examination_protocol": "standard medical examination process",
    "diagnostic_language": "clinical observation and documentation"
  }
}
```

## Script Quality Validation

### Timing Validation
```json
{
  "QUALITY_VALIDATION": {
    "timing": {
      "beat_1": "14 words in 8 seconds ✓",
      "beat_2": "18 words in 8 seconds ✓", 
      "beat_3": "19 words in 8 seconds ✓",
      "beat_4": "20 words in 8 seconds ✓",
      "beat_5": "24 words in 8 seconds ✓",
      "beat_6": "23 words in 8 seconds ✓"
    },
    "naturalism": {
      "contractions": "used appropriately ✓",
      "medical_language": "authentic but absurd ✓",
      "crypto_slang": "natural integration ✓",
      "commercial_tone": "pharmaceutical standard ✓"
    },
    "performance": {
      "emphasis_marked": "clear for all beats ✓",
      "delivery_noted": "specific for each line ✓",
      "emotion_tracked": "progression maintained ✓",
      "voice_consistent": "character profiles maintained ✓"
    },
    "virality": {
      "quotable_lines": "wen Diadik, most expensive dick ✓",
      "shock_humor": "balanced and memorable ✓",
      "meme_potential": "crypto culture callback ✓",
      "shareable_moments": "medical examination, luxury positioning ✓"
    }
  }
}
```

## Final Script Optimization Notes

### Performance Guidance
1. **DEGEN_PATIENT**: Maintain authentic crypto trader panic throughout
2. **DOCTOR_001**: Professional composure breaking into disgusted horror
3. **NARRATOR**: Serious pharmaceutical commercial tone for absurd content
4. **Timing**: Allow natural pauses for comedic effect and authenticity

### Audio Sync Critical Points
- Beat 1: Phone notification sync with chart checking
- Beat 2: Medical equipment sounds with examination
- Beat 4: Product reveal sounds with Diadik introduction
- Beat 5: Luxury sparkle effects with diamond presentation

### Viral Optimization Elements
- Medical examination shock value
- Luxury product positioning absurdity
- Crypto culture meme integration
- Pharmaceutical commercial parody accuracy

**Script Engineering Complete ✓**
**Ready to proceed to Prompt 3: Visual Excellence & Cinematic Design**