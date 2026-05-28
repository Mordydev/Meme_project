# Prompt 2: Script Engineering & Dialogue Optimization
## DISEASE CRD - CHRONIC ROUND DRIPPER

### CORE TIMING CONSTRAINTS

```json
{
  "TIMING_RULES": {
    "max_duration": "8 seconds exactly per beat",
    "word_limits": {
      "beat_1": "0 words (visual only)",
      "beat_2": "18 words max (character dialogue)",
      "beat_3": "0 words (visual reaction)",
      "beat_4": "17 words (narrator voiceover)",
      "beat_5": "14 words (narrator voiceover)", 
      "beat_6": "22 words (narrator voiceover)",
      "beat_7": "20 words (narrator voiceover)"
    },
    "delivery_speeds": {
      "character_panic": "3 words/second",
      "narrator_professional": "2.5 words/second", 
      "narrator_luxury": "2.2 words/second",
      "narrator_disclaimer": "3.5 words/second"
    }
  }
}
```

### BEAT-BY-BEAT SCRIPT BREAKDOWN

#### BEAT 1: CRYPTO DISASTER (VISUAL ONLY - 8s)
```json
{
  "BEAT_1_SCRIPT": {
    "character": "DEGEN001_EXACT",
    "emotional_state": "focused→shocked→confused",
    "dialogue": null,
    "reactions": {
      "0:00-0:03": "intense focus on phone screen, eyes tracking downward movement",
      "0:03-0:06": "scratching head frantically, eyes widening in disbelief",
      "0:06-0:08": "looks around room confused, mouth slightly agape"
    },
    "voice_notes": {
      "no_dialogue": "Pure visual storytelling",
      "breathing": "audible frustrated sighs and gasps",
      "sound_effects": "phone notification dings, scratching sounds"
    },
    "visual_storytelling": {
      "phone_screen": "red crypto charts plummeting",
      "character_performance": "increasingly frantic head scratching",
      "environment": "messy bedroom reflecting chaos"
    }
  }
}
```

#### BEAT 2: PATIENT OUTBURST (DIALOGUE - 8s)
```json
{
  "BEAT_2_SCRIPT": {
    "character": "DEGEN001_EXACT", 
    "emotional_state": "confused→panicked→desperate",
    "dialogue": {
      "lines": [
        {
          "text": "What the actual... my crypto bags are sinking, my dick's oozing, and my hands won't hit the sell button!",
          "timing": "0:01-0:07", 
          "delivery": "frantic, confused yelling with increasing panic",
          "emphasis": "crypto bags, oozing, sell button",
          "word_count": 18
        }
      ],
      "total_words": 18,
      "includes_pauses": false,
      "pacing": "rapid-fire panic delivery"
    },
    "reactions": {
      "0:00-0:01": "stands up abruptly from computer",
      "0:01-0:03": "opens front of pants to look down",
      "0:03-0:07": "gesticulates wildly while speaking",
      "0:07-0:08": "throws hands up in exasperation"
    },
    "voice_notes": {
      "consistency": "nasally, stressed voice from character bible",
      "modulation": "pitch rises 25% during panic",
      "breathing": "rapid, shallow breathing between words",
      "authenticity": "genuine millennial crypto panic"
    }
  }
}
```

#### BEAT 3: MEDICAL EXAMINATION (VISUAL ONLY - 8s)
```json
{
  "BEAT_3_SCRIPT": {
    "characters": ["DEGEN001_EXACT", "DOCTOR001_EXACT"],
    "emotional_state": "clinical_examination→horror→disgust",
    "dialogue": null,
    "reactions": {
      "patient": {
        "0:00-0:02": "nervously adjusting position, pants at ankles",
        "0:02-0:05": "sweating, anxious expression",
        "0:05-0:08": "looking at doctor's reaction with growing concern"
      },
      "doctor": {
        "0:00-0:02": "approaches professionally with clipboard",
        "0:02-0:04": "clinical examination posture",
        "0:04-0:06": "facial expression shifts to disgust",
        "0:06-0:08": "recoils, covers nose/mouth with hand"
      }
    },
    "voice_notes": {
      "no_dialogue": "Pure visual comedy through reactions",
      "breathing": "patient nervous breathing, doctor sharp intake",
      "sound_effects": "paper rustling, footsteps, disgusted gasp"
    },
    "visual_storytelling": {
      "medical_setting": "sterile examination room",
      "character_interaction": "professional to horrified progression",
      "comedy_timing": "classic medical examination horror"
    }
  }
}
```

#### BEAT 4: CRD EXPLANATION (NARRATOR - 8s)
```json
{
  "BEAT_4_SCRIPT": {
    "narrator": "PROFESSIONAL_PHARMACEUTICAL_VOICE",
    "emotional_state": "informational→medical_concern",
    "dialogue": {
      "text": "If your member drips enough to water the desert, you might have CRD - Chronic Round Dripper syndrome.",
      "timing": "0:01-0:07",
      "delivery": "professional pharmaceutical narrator voice, clear enunciation",
      "emphasis": "CRD, Chronic Round Dripper syndrome",
      "word_count": 17,
      "pacing": "2.4 words per second"
    },
    "voice_characteristics": {
      "tone": "authoritative medical professional",
      "pace": "measured, educational",
      "accent": "neutral American broadcast",
      "processing": "pharmaceutical commercial standard"
    },
    "visual_support": {
      "medical_graphics": "condition illustration appears",
      "text_overlay": "CRD - Chronic Round Dripper syndrome",
      "clinical_aesthetic": "clean pharmaceutical background"
    }
  }
}
```

#### BEAT 5: DIADIK INTRODUCTION (NARRATOR - 8s)
```json
{
  "BEAT_5_SCRIPT": {
    "narrator": "PROFESSIONAL_PHARMACEUTICAL_VOICE",
    "emotional_state": "problem→solution_introduction",
    "dialogue": {
      "text": "Ask your physician about Diadik - a prosthetic diamond-encrusted super absorbent solution.",
      "timing": "0:01-0:07",
      "delivery": "confident pharmaceutical narrator with slight excitement",
      "emphasis": "Diadik, diamond-encrusted, solution",
      "word_count": 12,
      "pacing": "2.0 words per second"
    },
    "voice_characteristics": {
      "tone": "hopeful, solution-oriented",
      "pace": "confident, building excitement",
      "accent": "neutral American broadcast", 
      "processing": "pharmaceutical hope and confidence"
    },
    "visual_support": {
      "product_showcase": "Diadik rotating on pedestal",
      "diamond_effects": "sparkle and luxury lighting",
      "premium_aesthetic": "high-end product photography"
    }
  }
}
```

#### BEAT 6: LUXURY POSITIONING (NARRATOR - 8s) 
```json
{
  "BEAT_6_SCRIPT": {
    "narrator": "LUXURY_BRAND_VOICE",
    "emotional_state": "aspiration→desire→status",
    "dialogue": {
      "text": "When you wear Diadik, you'll have the most expensive member in the room. Size doesn't matter when yours is worth a million.",
      "timing": "0:01-0:07",
      "delivery": "luxury brand confidence, aspirational tone",
      "emphasis": "most expensive, worth a million",
      "word_count": 22, 
      "pacing": "3.1 words per second"
    },
    "voice_characteristics": {
      "tone": "luxury brand sophistication",
      "pace": "smooth, confident delivery",
      "accent": "upscale American",
      "processing": "premium brand audio quality"
    },
    "visual_support": {
      "luxury_lifestyle": "expensive cars, mansions, jewelry",
      "status_symbols": "Diadik as ultimate luxury item",
      "aspirational_imagery": "wealth and success montage"
    }
  }
}
```

#### BEAT 7: PRESCRIPTION CTA (NARRATOR - 8s)
```json
{
  "BEAT_7_SCRIPT": {
    "narrator": "PHARMACEUTICAL_DISCLAIMER_VOICE",
    "emotional_state": "urgency→medical_resolution",
    "dialogue": {
      "text": "Get your prescription today. You may be eligible for Medicare coverage. Restrictions apply for size, skin color, and income bracket.",
      "timing": "0:01-0:07",
      "delivery": "rapid pharmaceutical disclaimer voice, urgent but clear",
      "emphasis": "prescription today, restrictions apply",
      "word_count": 20,
      "pacing": "3.3 words per second"
    },
    "voice_characteristics": {
      "tone": "urgent call-to-action transitioning to rapid disclaimer",
      "pace": "accelerating through disclaimers",
      "accent": "neutral American broadcast",
      "processing": "compressed pharmaceutical ending style"
    },
    "visual_support": {
      "prescription_pad": "doctor writing prescription",
      "medicare_imagery": "official medical documentation",
      "disclaimer_text": "fast-scrolling legal text"
    }
  }
}
```

### AUDIO LAYER ARCHITECTURE

```json
{
  "COMPREHENSIVE_AUDIO_MAP": {
    "dialogue_track": {
      "beat_1": null,
      "beat_2": {
        "character_voice": "DEGEN001 nasally panic @ -6dB",
        "processing": "slight distortion for phone speaker effect",
        "eq": "presence boost +3dB @ 3kHz for clarity"
      },
      "beat_3": null,
      "beat_4_7": {
        "narrator_voice": "Professional pharmaceutical @ -6dB",
        "processing": "broadcast compression 3:1 ratio",
        "eq": "presence boost +3dB @ 5kHz"
      }
    },
    "ambient_track": {
      "beat_1": "computer hum, room tone @ -18dB",
      "beat_2": "anxious room atmosphere @ -18dB", 
      "beat_3": "medical office HVAC @ -18dB",
      "beat_4": "pharmaceutical bg atmosphere @ -20dB",
      "beat_5": "luxury showroom ambience @ -20dB",
      "beat_6": "aspirational environment @ -18dB",
      "beat_7": "medical conclusion atmosphere @ -20dB"
    },
    "sfx_track": {
      "beat_1": [
        {"sound": "phone notification dings", "timing": "0:01", "level": "-9dB"},
        {"sound": "frantic scratching", "timing": "0:04-0:08", "level": "-12dB"}
      ],
      "beat_2": [
        {"sound": "fabric rustling (pants)", "timing": "0:02", "level": "-15dB"},
        {"sound": "hand slapping surfaces", "timing": "0:07", "level": "-10dB"}
      ],
      "beat_3": [
        {"sound": "paper clipboard rustling", "timing": "0:02", "level": "-12dB"},
        {"sound": "disgusted gasp", "timing": "0:06", "level": "-8dB"},
        {"sound": "footsteps backing away", "timing": "0:07", "level": "-10dB"}
      ],
      "beat_4": [
        {"sound": "medical beep", "timing": "0:02", "level": "-10dB"},
        {"sound": "graphic animation whoosh", "timing": "0:04", "level": "-12dB"}
      ],
      "beat_5": [
        {"sound": "diamond sparkle chime", "timing": "0:03", "level": "-8dB"},
        {"sound": "product rotation motor", "timing": "0:02-0:06", "level": "-15dB"}
      ],
      "beat_6": [
        {"sound": "expensive car door close", "timing": "0:02", "level": "-10dB"},
        {"sound": "jewelry box opening", "timing": "0:05", "level": "-8dB"}
      ],
      "beat_7": [
        {"sound": "pen writing on prescription pad", "timing": "0:01", "level": "-10dB"},
        {"sound": "paper tear", "timing": "0:03", "level": "-8dB"},
        {"sound": "fast typing for disclaimers", "timing": "0:05-0:08", "level": "-12dB"}
      ]
    },
    "music_track": {
      "beat_1": "ominous electronic drone @ -20dB",
      "beat_2": "anxiety-inducing build @ -15dB",
      "beat_3": "medical drama tension @ -20dB", 
      "beat_4": "calm pharmaceutical background @ -18dB",
      "beat_5": "uplifting pharmaceutical hope @ -15dB",
      "beat_6": "luxury brand orchestral @ -12dB",
      "beat_7": "pharmaceutical resolve conclusion @ -15dB"
    }
  }
}
```

### NATURAL DIALOGUE ANALYSIS

#### Character Voice Consistency
```json
{
  "DEGEN_PATIENT_VOICE": {
    "consistency_markers": {
      "crypto_terminology": "bags, HODLing, diamond hands",
      "generational_speech": "millennial panic patterns",
      "stress_indicators": "voice crack, rapid breathing",
      "authenticity": "genuine financial anxiety mixed with medical concern"
    },
    "delivery_evolution": {
      "beat_2": "confused panic → desperate realization"
    }
  },
  "NARRATOR_VOICE": {
    "pharmaceutical_phases": {
      "beat_4": "medical information delivery",
      "beat_5": "solution introduction confidence", 
      "beat_6": "luxury brand aspiration",
      "beat_7": "urgent CTA + rapid disclaimers"
    },
    "voice_modulation": {
      "beats_4_5": "authoritative medical professional",
      "beat_6": "luxury brand sophistication",
      "beat_7": "pharmaceutical urgency + disclaimer speed"
    }
  }
}
```

### DIALOGUE DELIVERY SPECIFICATIONS

```json
{
  "DELIVERY_MATRIX": {
    "beat_2_character": {
      "pace": "rapid panic - 3 words/second",
      "includes": ["confusion", "realization", "desperation"],
      "pitch_variation": "30% increase during panic peaks",
      "authenticity_markers": ["crypto slang", "medical euphemism", "trading terminology"]
    },
    "beat_4_narrator": {
      "pace": "measured educational - 2.4 words/second", 
      "includes": ["medical authority", "condition explanation"],
      "pitch_variation": "10% clinical consistency",
      "processing": "pharmaceutical commercial standard"
    },
    "beat_5_narrator": {
      "pace": "confident solution - 2.0 words/second",
      "includes": ["hope", "medical solution"],
      "pitch_variation": "15% building optimism",
      "processing": "solution-oriented confidence"
    },
    "beat_6_narrator": {
      "pace": "luxury aspiration - 3.1 words/second",
      "includes": ["status", "wealth", "exclusivity"],
      "pitch_variation": "20% luxury sophistication",
      "processing": "premium brand audio quality"
    },
    "beat_7_narrator": {
      "pace": "disclaimer urgency - 3.3 words/second",
      "includes": ["call-to-action", "legal disclaimers"],
      "pitch_variation": "5% compressed consistency",
      "processing": "pharmaceutical ending compression"
    }
  }
}
```

### SCRIPT QUALITY VALIDATION

```json
{
  "QUALITY_CHECKLIST": {
    "timing_validation": {
      "beat_1": "0 words, 8s visual ✓",
      "beat_2": "18 words in 6s dialogue window ✓",
      "beat_3": "0 words, 8s visual reaction ✓", 
      "beat_4": "17 words in 6s narrator window ✓",
      "beat_5": "12 words in 6s narrator window ✓",
      "beat_6": "22 words in 6s narrator window ✓",
      "beat_7": "20 words in 6s narrator window ✓"
    },
    "naturalism_check": {
      "character_contractions": "used appropriately ✓",
      "crypto_terminology": "authentic to character ✓",
      "medical_language": "pharmaceutical standard ✓",
      "breathing_space": "allocated for reactions ✓"
    },
    "performance_specs": {
      "emphasis_marked": "key words identified ✓",
      "delivery_noted": "specific for each beat ✓",
      "emotion_tracked": "progression mapped ✓",
      "voice_consistent": "with character bible ✓"
    },
    "viral_optimization": {
      "quotable_lines": "identified per beat ✓",
      "emotional_peaks": "placed strategically ✓", 
      "shareable_moments": "emphasized timing ✓",
      "platform_adaptation": "TikTok-optimized ✓"
    }
  }
}
```

### FINAL SCRIPT OUTPUTS

#### BEAT 2: CHARACTER DIALOGUE (FINAL)
```json
{
  "beat_2_final_script": {
    "beat_id": "002",
    "duration": "8s",
    "character": "DEGEN001_EXACT",
    "dialogue": {
      "formatted_text": "What the actual... my crypto bags are sinking, my dick's oozing, and my hands won't hit the sell button!",
      "word_count": 18,
      "timing": "0:01-0:07",
      "delivery": "frantic panic with increasing desperation"
    },
    "audio_layers": {
      "ambient": "anxious room atmosphere -18dB",
      "sfx": ["fabric rustling @ 0:02", "surface slapping @ 0:07"],
      "music": "anxiety build from 0:04"
    },
    "performance_notes": {
      "energy": "builds from 6 to 9",
      "focal_point": "looking down pants then camera",
      "physical": "wild gesticulation throughout"
    },
    "viral_moment": "0:03-0:05 - crypto/medical condition combination"
  }
}
```

#### BEATS 4-7: NARRATOR SCRIPTS (FINAL)
```json
{
  "narrator_scripts_final": {
    "beat_4": {
      "text": "If your member drips enough to water the desert, you might have CRD - Chronic Round Dripper syndrome.",
      "delivery": "professional pharmaceutical authority",
      "timing": "0:01-0:07",
      "emphasis": "CRD, Chronic Round Dripper syndrome"
    },
    "beat_5": {
      "text": "Ask your physician about Diadik - a prosthetic diamond-encrusted super absorbent solution.",
      "delivery": "confident pharmaceutical hope",
      "timing": "0:01-0:07", 
      "emphasis": "Diadik, diamond-encrusted, solution"
    },
    "beat_6": {
      "text": "When you wear Diadik, you'll have the most expensive member in the room. Size doesn't matter when yours is worth a million.",
      "delivery": "luxury brand sophistication",
      "timing": "0:01-0:07",
      "emphasis": "most expensive, worth a million"
    },
    "beat_7": {
      "text": "Get your prescription today. You may be eligible for Medicare coverage. Restrictions apply for size, skin color, and income bracket.",
      "delivery": "urgent CTA transitioning to rapid disclaimers",
      "timing": "0:01-0:07",
      "emphasis": "prescription today, restrictions apply"
    }
  }
}
```

### AUDIO PROCESSING SPECIFICATIONS

```json
{
  "FINAL_AUDIO_PROCESSING": {
    "character_dialogue": {
      "eq": "high-pass @ 80Hz, presence +3dB @ 3kHz",
      "compression": "4:1 ratio for panic consistency",
      "reverb": "room tone match to environment",
      "level": "-6dB peak"
    },
    "narrator_voice": {
      "eq": "broadcast curve, presence +3dB @ 5kHz", 
      "compression": "3:1 ratio for pharmaceutical standard",
      "de_essing": "moderate for professional delivery",
      "level": "-6dB peak"
    },
    "sfx_integration": {
      "sync": "frame-accurate to visual actions",
      "levels": "balanced to support dialogue",
      "spatial": "positioned for visual match",
      "processing": "minimal, natural placement"
    }
  }
}
```

---

## Next Step
With precise scripts engineered, proceed to Prompt 3: Visual Design for cinematic specifications and character consistency requirements.