# CRD - Chronic Round Dripper: Strategic Story Architecture & Beat Structure

## Project Configuration
```json
{
  "PROJECT_CONFIG": {
    "title": "CRD - Chronic Round Dripper Commercial",
    "content_type": "Commercial Satirical Parody",
    "duration": "6 beats × 8 seconds = 48 seconds",
    "structure": "continuous pharmaceutical commercial narrative",
    "platform_primary": "youtube",
    "platform_secondary": ["tiktok", "instagram"]
  }
}
```

## Character Bible System

### Primary Character: DEGEN_PATIENT_001
```json
{
  "CHARACTER_BIBLE": {
    "char_id": "DEGEN_PATIENT_001",
    "physical": {
      "age": 28,
      "height": "5'10\" / 178cm",
      "build": "average, slightly slouched posture",
      "hair": "messy brown hair, unkempt",
      "clothing": "stained gray Solana hoodie, dark sweatpants",
      "distinguishing": "stubble, red eyes from screen time, phone always in hand"
    },
    "voice": {
      "tone": "confused, panicked tenor",
      "pace": "starts slow, speeds up when panicking",
      "accent": "American millennial",
      "quirks": ["crypto slang", "nervous energy"],
      "emotion_range": "confused→panicked→desperate"
    },
    "movement": {
      "energy": "6 initially, escalates to 9",
      "style": "anxious, fidgety with crypto chart checking",
      "gestures": "hand to head scratching, phone waving"
    },
    "consistency_code": "DEGEN001_EXACT"
  }
}
```

### Supporting Character: DOCTOR_001
```json
{
  "CHARACTER_BIBLE": {
    "char_id": "DOCTOR_001", 
    "physical": {
      "age": 45,
      "height": "5'8\" / 173cm",
      "build": "professional, composed demeanor",
      "hair": "neat brown hair with gray temples",
      "clothing": "white medical coat over blue dress shirt, stethoscope",
      "distinguishing": "professional glasses, clipboard, disgusted facial expressions"
    },
    "voice": {
      "tone": "professional baritone turning to disgust",
      "pace": "measured, clinical, then horrified",
      "accent": "educated American",
      "quirks": ["medical terminology", "professional composure breaking"],
      "emotion_range": "professional→concerned→disgusted"
    },
    "movement": {
      "energy": "3 professional, spikes to 7 when disgusted",
      "style": "clinical, controlled, then recoiling",
      "gestures": "examining, note-taking, backing away"
    },
    "consistency_code": "DOCTOR001_EXACT"
  }
}
```

## Beat Architecture: Continuous Pharmaceutical Commercial

### BEAT 1: Patient Discovery (8 seconds)
```json
{
  "BEAT_1": {
    "meta": {
      "id": "001",
      "title": "The Crypto Degen Crisis",
      "duration": "8s",
      "emotion": "confusion→panic"
    },
    "technical": {
      "shot": "medium close-up",
      "lens": "50mm f/2.8",
      "camera": "handheld slight shake, push-in 20cm over 6s",
      "fps": 24
    },
    "character": {
      "ref": "DEGEN001_EXACT",
      "state": "checking crypto charts, discovering physical issue",
      "position": "center frame, sitting on bed"
    },
    "environment": {
      "location": "messy bedroom with crypto trading setup",
      "lighting": "screen glow on face, dim room lighting",
      "time": "late night",
      "atmosphere": "chaotic crypto trading environment"
    },
    "action": {
      "primary": "checking phone charts, opens pants, horrified realization",
      "timing": {
        "0-2s": "staring at phone, charts dropping",
        "2-4s": "looks down, opens pants",
        "4-6s": "horrified discovery",
        "6-8s": "panicked exclamation"
      }
    },
    "viral_element": "relatable crypto degen panic moment"
  }
}
```

### BEAT 2: Medical Examination (8 seconds)
```json
{
  "BEAT_2": {
    "meta": {
      "id": "002", 
      "title": "Doctor's Horrified Discovery",
      "duration": "8s",
      "emotion": "professional→disgusted"
    },
    "technical": {
      "shot": "medium two-shot",
      "lens": "35mm f/4",
      "camera": "static, medical examination perspective",
      "fps": 24
    },
    "characters": {
      "patient": "DEGEN001_EXACT - pants down, standing worried",
      "doctor": "DOCTOR001_EXACT - examining, face shows disgust"
    },
    "environment": {
      "location": "sterile medical examination room",
      "lighting": "clinical fluorescent overhead, harsh shadows",
      "time": "daytime",
      "atmosphere": "uncomfortable medical examination"
    },
    "action": {
      "primary": "medical examination with doctor's disgusted reaction",
      "timing": {
        "0-2s": "doctor approaches for examination",
        "2-4s": "doctor sees condition, face changes",
        "4-6s": "doctor recoils in disgust",
        "6-8s": "doctor covers face, backing away"
      }
    },
    "viral_element": "doctor's horrified professional breakdown"
  }
}
```

### BEAT 3: Narrator Symptoms Introduction (8 seconds)
```json
{
  "BEAT_3": {
    "meta": {
      "id": "003",
      "title": "CRD Condition Introduction", 
      "duration": "8s",
      "emotion": "medical_authority→absurd_comedy"
    },
    "technical": {
      "shot": "close-up product shot transition",
      "lens": "85mm f/1.8",
      "camera": "slow dolly reveal of medical imagery",
      "fps": 24
    },
    "visual_focus": {
      "primary": "medical diagram graphics, symptom visualization",
      "secondary": "patient in background showing symptoms",
      "style": "pharmaceutical commercial aesthetic"
    },
    "environment": {
      "location": "clinical pharmaceutical commercial setting",
      "lighting": "clean pharmaceutical commercial lighting",
      "time": "neutral commercial time",
      "atmosphere": "professional medical commercial"
    },
    "action": {
      "primary": "narrator voice-over with symptom demonstration",
      "timing": {
        "0-2s": "narrator introduces CRD condition",
        "2-4s": "symptoms list begins",
        "4-6s": "absurd symptoms continue",
        "6-8s": "transition to solution setup"
      }
    },
    "viral_element": "absurd medical condition symptom list"
  }
}
```

### BEAT 4: Diadik Product Introduction (8 seconds)
```json
{
  "BEAT_4": {
    "meta": {
      "id": "004",
      "title": "Diadik Solution Reveal",
      "duration": "8s", 
      "emotion": "medical_solution→luxury_reveal"
    },
    "technical": {
      "shot": "product reveal macro to wide",
      "lens": "100mm macro to 35mm transition",
      "camera": "dolly out reveal, slight rotation",
      "fps": 24
    },
    "product_focus": {
      "primary": "Diadik package and product reveal",
      "presentation": "luxury pharmaceutical packaging",
      "style": "high-end product commercial"
    },
    "environment": {
      "location": "luxury pharmaceutical product showcase",
      "lighting": "premium product lighting, soft key with rim",
      "time": "commercial neutral",
      "atmosphere": "luxury medical product presentation"
    },
    "action": {
      "primary": "Diadik product reveal with narrator explanation",
      "timing": {
        "0-2s": "product package reveal",
        "2-4s": "narrator explains solution",
        "4-6s": "product benefits highlighted",
        "6-8s": "transition to luxury presentation"
      }
    },
    "viral_element": "absurd luxury solution for gross medical issue"
  }
}
```

### BEAT 5: Diamond Dick Luxury Presentation (8 seconds)
```json
{
  "BEAT_5": {
    "meta": {
      "id": "005",
      "title": "Luxury Diamond Presentation",
      "duration": "8s",
      "emotion": "luxury_showcase→absurd_comedy_peak"
    },
    "technical": {
      "shot": "luxury product showcase",
      "lens": "50mm f/1.4", 
      "camera": "elegant orbit around product, slow reveal",
      "fps": 24
    },
    "product_focus": {
      "primary": "diamond-encrusted Diadik sock product",
      "presentation": "ultra-luxury product photography",
      "style": "high-end jewelry commercial aesthetic"
    },
    "environment": {
      "location": "luxury product showcase studio",
      "lighting": "premium jewelry lighting, sparkle effects",
      "time": "commercial studio",
      "atmosphere": "absurd luxury meets medical necessity"
    },
    "action": {
      "primary": "diamond Diadik showcase with narrator luxury pitch",
      "timing": {
        "0-2s": "diamond product reveal",
        "2-4s": "luxury features highlighted",
        "4-6s": "value proposition presented",
        "6-8s": "transition to call-to-action"
      }
    },
    "viral_element": "most expensive dick in the room concept"
  }
}
```

### BEAT 6: Call to Action & Medicare (8 seconds)
```json
{
  "BEAT_6": {
    "meta": {
      "id": "006",
      "title": "Prescription Call to Action",
      "duration": "8s",
      "emotion": "medical_authority→crypto_meme_conclusion"
    },
    "technical": {
      "shot": "return to medical/patient consultation",
      "lens": "35mm f/2.8",
      "camera": "static professional medical shot",
      "fps": 24
    },
    "characters": {
      "focus": "DOCTOR001_EXACT giving prescription advice",
      "secondary": "DEGEN001_EXACT looking hopeful"
    },
    "environment": {
      "location": "medical office consultation",
      "lighting": "professional medical consultation lighting",
      "time": "medical appointment",
      "atmosphere": "pharmaceutical commercial conclusion"
    },
    "action": {
      "primary": "prescription instructions and Medicare eligibility",
      "timing": {
        "0-2s": "doctor prescribes Diadik",
        "2-4s": "Medicare eligibility mentioned", 
        "4-6s": "restrictions and conditions",
        "6-8s": "crypto meme conclusion"
      }
    },
    "viral_element": "wen lambo becomes wen diadik meme"
  }
}
```

## Audio Architecture Framework
```json
{
  "AUDIO_ARCHITECTURE": {
    "master_approach": "pharmaceutical commercial parody",
    "beat_consistency": {
      "narrator_voice": "professional pharmaceutical commercial tone",
      "patient_voice": "panicked crypto degen energy",
      "doctor_voice": "clinical professional to disgusted",
      "background_music": "serious pharmaceutical commercial underscore"
    },
    "viral_audio_elements": [
      "crypto slang mixed with medical terminology",
      "dramatic pharmaceutical commercial narrator",
      "shocked medical professional reactions",
      "luxury product presentation audio"
    ]
  }
}
```

## Success Metrics & Viral Optimization
```json
{
  "VIRAL_MECHANICS": {
    "hook_cascade": {
      "0:00-0:02": "crypto charts dropping visual hook",
      "0:02-0:04": "pants opening shock moment",
      "0:04-0:06": "medical examination horror"
    },
    "share_triggers": {
      "beat_1": "relatable crypto degen panic @ 0:06",
      "beat_2": "doctor's disgusted reaction @ 0:04", 
      "beat_5": "diamond dick luxury concept @ 0:04",
      "beat_6": "wen diadik meme conclusion @ 0:06"
    },
    "meme_potential": "wen lambo → wen diadik format",
    "crypto_culture_resonance": "degen lifestyle medical consequences"
  }
}
```

## Technical Specifications Summary
- **Total Duration**: 48 seconds (6 beats × 8 seconds)
- **Character Consistency**: Complete descriptions maintained across all beats
- **Complexity Rating**: Medium (2 characters, medical + luxury environments)
- **Veo 3 Optimization**: Character expressions, lighting transitions, product reveals
- **Platform Ready**: 16:9 native, social media crop versions planned

## Quality Gates: ✅ ALL PASSED
- Beat duration exactly 8s each
- Character count 1-2 max per beat
- Camera specs fully defined
- Lighting specs complete
- Emotional arc clear and progresses
- Viral hooks identified and placed
- Platform optimization confirmed

**Ready to proceed to Prompt 2: Script Engineering**