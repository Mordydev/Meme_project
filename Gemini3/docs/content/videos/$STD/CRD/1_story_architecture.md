# Prompt 1: Strategic Story Architecture & Beat Structure
## DISEASE CRD - CHRONIC ROUND DRIPPER

### PROJECT CONFIGURATION

```json
{
  "PROJECT_CONFIG": {
    "title": "DISEASE CRD - CHRONIC ROUND DRIPPER",
    "content_type": "commercial_parody",
    "duration": "56 seconds (7 × 8-second beats)",
    "structure": "continuous_narrative",
    "platform_primary": "tiktok",
    "platform_secondary": ["instagram", "youtube"]
  }
}
```

### CHARACTER BIBLE SYSTEM

#### PRIMARY CHARACTER: DEGEN PATIENT
```json
{
  "CHAR001_DEGEN_PATIENT": {
    "char_id": "degen_patient_001",
    "physical": {
      "age": 28,
      "height": "5'9\" / 175cm",
      "build": "slightly overweight, slouched posture",
      "hair": "messy brown hair, unwashed, sticking up",
      "clothing": "stained gray Solana hoodie with visible food stains, black sweatpants, no shoes",
      "distinguishing": "dark circles under eyes, patchy facial hair, anxious expression"
    },
    "voice": {
      "tone": "nasally, stressed",
      "pace": "rapid when panicked, 180 words per minute",
      "accent": "American millennial",
      "quirks": ["crypto slang", "nervous stammering"],
      "emotion_range": "confusion → panic → desperation"
    },
    "movement": {
      "energy": 7,
      "style": "erratic, fidgety, constantly checking phone",
      "gestures": "scratches head obsessively, pulls at clothes"
    },
    "consistency_code": "DEGEN001_EXACT"
  }
}
```

#### SECONDARY CHARACTER: DISGUSTED DOCTOR
```json
{
  "CHAR002_DOCTOR": {
    "char_id": "doctor_medical_001", 
    "physical": {
      "age": 45,
      "height": "5'6\" / 168cm",
      "build": "professional, medium build",
      "hair": "short gray hair in professional style",
      "clothing": "white medical coat over blue scrubs, stethoscope around neck",
      "distinguishing": "wire-rimmed glasses, disgusted facial expression, medical gloves"
    },
    "voice": {
      "tone": "professional but horrified",
      "pace": "measured, clinical, 120 words per minute",
      "accent": "educated American",
      "quirks": ["medical terminology", "barely contained disgust"],
      "emotion_range": "professional → disgusted → horrified"
    },
    "movement": {
      "energy": 3,
      "style": "controlled, clinical, recoiling",
      "gestures": "maintains clinical distance, covers nose"
    },
    "consistency_code": "DOCTOR001_EXACT"
  }
}
```

### 7-BEAT ARCHITECTURE STRUCTURE

#### BEAT 1: CRYPTO DISASTER DISCOVERY (8s)
```json
{
  "BEAT_1": {
    "meta": {
      "id": "001",
      "title": "Crypto Chart Disaster",
      "duration": "8s",
      "emotion": "focused→shocked"
    },
    "technical": {
      "shot": "medium close-up on patient at computer",
      "lens": "50mm f/2.8",
      "camera": "static, locked on character",
      "fps": 24
    },
    "character": {
      "ref": "DEGEN001_EXACT",
      "state": "staring at phone screen in disbelief",
      "position": "center frame, seated"
    },
    "environment": {
      "location": "messy bedroom with crypto posters",
      "lighting": "harsh phone screen glow, dim room lighting",
      "time": "night",
      "atmosphere": "depressing, cluttered"
    },
    "action": {
      "primary": "staring at plummeting chart, scratching head like madman",
      "timing": {
        "0-3s": "focused staring at screen",
        "3-6s": "begins scratching head frantically", 
        "6-8s": "looks around confused"
      }
    },
    "audio": {
      "dialogue": null,
      "ambient": "computer fan humming @ -18dB",
      "sfx": [
        {"sound": "phone notification dings", "time": "0:01", "level": "-9dB"},
        {"sound": "scratching sounds", "time": "0:04-0:08", "level": "-12dB"}
      ],
      "music": "ominous electronic drone @ -20dB"
    },
    "viral_element": "relatable crypto HODL disaster moment"
  }
}
```

#### BEAT 2: PATIENT CONFUSED OUTBURST (8s)
```json
{
  "BEAT_2": {
    "meta": {
      "id": "002", 
      "title": "Discovery Outburst",
      "duration": "8s",
      "emotion": "confused→panicked"
    },
    "technical": {
      "shot": "medium shot showing full upper body",
      "lens": "35mm f/2.8",
      "camera": "slight zoom in during outburst",
      "fps": 24
    },
    "character": {
      "ref": "DEGEN001_EXACT",
      "state": "agitated discovery, looking down pants",
      "position": "standing, center frame"
    },
    "environment": {
      "location": "same messy bedroom",
      "lighting": "room lights now on, harsh overhead fluorescent", 
      "time": "night",
      "atmosphere": "chaotic panic"
    },
    "action": {
      "primary": "yelling while opening pants front to look",
      "timing": {
        "0-2s": "stands up from computer",
        "2-5s": "opens pants to look down",
        "5-8s": "gestures frantically while speaking"
      }
    },
    "audio": {
      "dialogue": {
        "text": "What the actual... my crypto bags are sinking, my dick's oozing, and my hands won't hit the sell button!",
        "timing": "0:01-0:07",
        "delivery": "frantic, confused yelling",
        "word_count": 18
      },
      "ambient": "room tone @ -18dB",
      "sfx": [
        {"sound": "fabric rustling", "time": "0:02", "level": "-15dB"},
        {"sound": "hand slapping keyboard", "time": "0:07", "level": "-10dB"}
      ],
      "music": "anxiety-inducing build @ -15dB"
    },
    "viral_element": "absurd combination of crypto loss and medical discovery"
  }
}
```

#### BEAT 3: DOCTOR'S OFFICE EXAMINATION (8s)
```json
{
  "BEAT_3": {
    "meta": {
      "id": "003",
      "title": "Medical Examination Horror", 
      "duration": "8s",
      "emotion": "clinical→disgusted"
    },
    "technical": {
      "shot": "wide shot showing doctor and patient",
      "lens": "24mm f/4",
      "camera": "static, clinical observation angle",
      "fps": 24
    },
    "characters": {
      "primary": "DEGEN001_EXACT - pants at ankles, sweating",
      "secondary": "DOCTOR001_EXACT - face full of disgust, recoiling"
    },
    "environment": {
      "location": "sterile medical examination room",
      "lighting": "bright clinical fluorescent lighting",
      "time": "day",
      "atmosphere": "uncomfortable, sterile"
    },
    "action": {
      "primary": "patient standing with pants down, doctor examining with disgust",
      "timing": {
        "0-2s": "patient nervously adjusting position",
        "2-5s": "doctor approaches with clipboard",
        "5-8s": "doctor recoils in horror, covers face"
      }
    },
    "audio": {
      "dialogue": null,
      "ambient": "medical office HVAC hum @ -18dB",
      "sfx": [
        {"sound": "paper rustling", "time": "0:02", "level": "-12dB"},
        {"sound": "disgusted gasp", "time": "0:06", "level": "-8dB"},
        {"sound": "footsteps backing away", "time": "0:07", "level": "-10dB"}
      ],
      "music": "medical drama tension @ -20dB"
    },
    "viral_element": "classic medical examination comedy horror"
  }
}
```

#### BEAT 4: NARRATOR CRD EXPLANATION (8s)
```json
{
  "BEAT_4": {
    "meta": {
      "id": "004",
      "title": "CRD Condition Explanation",
      "duration": "8s", 
      "emotion": "informational→concern"
    },
    "technical": {
      "shot": "animated graphics over medical background",
      "lens": "graphics overlay",
      "camera": "animated medical illustration style",
      "fps": 24
    },
    "visual_elements": {
      "graphics": "medical condition illustration, symptom list animation",
      "background": "clean medical/pharmaceutical aesthetic",
      "text_overlay": "CRD - Chronic Round Dripper syndrome"
    },
    "environment": {
      "location": "animated medical illustration space",
      "lighting": "clean, pharmaceutical commercial lighting",
      "time": "timeless",
      "atmosphere": "clinical, educational"
    },
    "action": {
      "primary": "animated symptom list appearing on screen",
      "timing": {
        "0-2s": "condition name appears",
        "2-6s": "symptom list animates in",
        "6-8s": "medical diagram highlight"
      }
    },
    "audio": {
      "dialogue": {
        "text": "If your member drips enough to water the desert, you might have CRD - Chronic Round Dripper syndrome.",
        "timing": "0:01-0:07",
        "delivery": "professional pharmaceutical narrator voice",
        "word_count": 17
      },
      "ambient": "clean pharmaceutical bg @ -20dB", 
      "sfx": [
        {"sound": "medical beep", "time": "0:02", "level": "-10dB"},
        {"sound": "graphic animation whoosh", "time": "0:04", "level": "-12dB"}
      ],
      "music": "calm pharmaceutical background @ -18dB"
    },
    "viral_element": "absurd medical condition definition"
  }
}
```

#### BEAT 5: DIADIK PRODUCT INTRODUCTION (8s)
```json
{
  "BEAT_5": {
    "meta": {
      "id": "005",
      "title": "Diadik Solution Introduction",
      "duration": "8s",
      "emotion": "problem→solution"
    },
    "technical": {
      "shot": "product showcase with rotating display",
      "lens": "macro 85mm f/1.8 for product detail",
      "camera": "smooth 360° product rotation",
      "fps": 24
    },
    "visual_elements": {
      "product": "diamond-encrusted medical device/sock",
      "environment": "luxury product showcase space",
      "lighting": "premium product photography lighting"
    },
    "environment": {
      "location": "high-end product showcase studio",
      "lighting": "dramatic key lighting with diamond sparkle effects",
      "time": "timeless product space",
      "atmosphere": "luxury, premium"
    },
    "action": {
      "primary": "Diadik product rotating on display pedestal",
      "timing": {
        "0-2s": "product reveal from darkness",
        "2-6s": "360° rotation showing diamond details",
        "6-8s": "zoom in on diamond texture"
      }
    },
    "audio": {
      "dialogue": {
        "text": "Ask your physician about Diadik - a prosthetic diamond-encrusted super absorbent solution.",
        "timing": "0:01-0:07",
        "delivery": "confident pharmaceutical narrator",
        "word_count": 14
      },
      "ambient": "luxury showroom ambience @ -20dB",
      "sfx": [
        {"sound": "diamond sparkle chime", "time": "0:03", "level": "-8dB"},
        {"sound": "product rotation motor", "time": "0:02-0:06", "level": "-15dB"}
      ],
      "music": "uplifting pharmaceutical hope @ -15dB"
    },
    "viral_element": "absurd luxury medical device concept"
  }
}
```

#### BEAT 6: DIAMOND LUXURY POSITIONING (8s)
```json
{
  "BEAT_6": {
    "meta": {
      "id": "006",
      "title": "Diamond Luxury Value Proposition", 
      "duration": "8s",
      "emotion": "aspiration→desire"
    },
    "technical": {
      "shot": "luxury lifestyle montage",
      "lens": "35mm f/1.4 for shallow depth",
      "camera": "smooth dolly through luxury scenes",
      "fps": 24
    },
    "visual_elements": {
      "scenes": "expensive cars, jewelry, mansions with Diadik integration",
      "people": "wealthy lifestyle imagery",
      "product": "Diadik as luxury status symbol"
    },
    "environment": {
      "location": "luxury lifestyle montage",
      "lighting": "golden hour luxury aesthetic",
      "time": "aspirational timeline",
      "atmosphere": "wealth, success, status"
    },
    "action": {
      "primary": "luxury lifestyle imagery with Diadik as centerpiece",
      "timing": {
        "0-2s": "mansion exterior with Diadik display case",
        "2-5s": "expensive car with Diadik in console",
        "5-8s": "jewelry box reveal with Diadik centerpiece"
      }
    },
    "audio": {
      "dialogue": {
        "text": "When you wear Diadik, you'll have the most expensive member in the room. Size doesn't matter when yours is worth a million.",
        "timing": "0:01-0:07",
        "delivery": "luxury brand confidence",
        "word_count": 22
      },
      "ambient": "luxury ambience @ -18dB",
      "sfx": [
        {"sound": "expensive car door close", "time": "0:02", "level": "-10dB"},
        {"sound": "jewelry box open", "time": "0:05", "level": "-8dB"}
      ],
      "music": "luxury brand orchestral @ -12dB"
    },
    "viral_element": "absurd luxury positioning for medical device"
  }
}
```

#### BEAT 7: PRESCRIPTION CALL-TO-ACTION (8s)
```json
{
  "BEAT_7": {
    "meta": {
      "id": "007",
      "title": "Medical Prescription CTA",
      "duration": "8s",
      "emotion": "urgency→resolution"
    },
    "technical": {
      "shot": "pharmaceutical commercial ending style",
      "lens": "50mm f/2.8 standard",
      "camera": "static, direct-to-camera",
      "fps": 24
    },
    "visual_elements": {
      "background": "clinical pharmaceutical white background",
      "text": "Fast disclaimer text scrolling",
      "product": "Diadik package with prescription pad"
    },
    "environment": {
      "location": "pharmaceutical commercial conclusion space",
      "lighting": "clean clinical white lighting",
      "time": "timeless commercial space",
      "atmosphere": "urgent medical, call-to-action"
    },
    "action": {
      "primary": "prescription pad writing, disclaimer text appearing",
      "timing": {
        "0-2s": "doctor writing prescription",
        "2-5s": "patient receiving prescription happily",
        "5-8s": "disclaimer text rapid scroll"
      }
    },
    "audio": {
      "dialogue": {
        "text": "Get your prescription today. You may be eligible for Medicare coverage. Restrictions apply for size, skin color, and income bracket.",
        "timing": "0:01-0:07",
        "delivery": "rapid pharmaceutical disclaimer voice",
        "word_count": 20
      },
      "ambient": "pharmaceutical commercial bg @ -20dB",
      "sfx": [
        {"sound": "pen writing on paper", "time": "0:01", "level": "-10dB"},
        {"sound": "paper tear", "time": "0:03", "level": "-8dB"},
        {"sound": "fast typing for disclaimers", "time": "0:05-0:08", "level": "-12dB"}
      ],
      "music": "pharmaceutical resolve @ -15dB"
    },
    "viral_element": "absurd pharmaceutical disclaimers and restrictions"
  }
}
```

### AUDIO ARCHITECTURE SYSTEM

```json
{
  "MASTER_AUDIO_DESIGN": {
    "dialogue_track": {
      "processing": {
        "eq": "presence boost +3dB @ 5kHz for narrator clarity",
        "compression": "3:1 ratio, -10dB threshold",
        "de_essing": "moderate for professional delivery"
      },
      "level": "-6dB peak",
      "panning": "center for narrator, positioned for characters"
    },
    "ambient_track": {
      "beat_1": "computer hum, room tone",
      "beat_2": "anxious room atmosphere", 
      "beat_3": "medical office clinical ambience",
      "beat_4_7": "pharmaceutical commercial background",
      "beat_5_6": "luxury showroom atmosphere"
    },
    "sfx_track": {
      "sync_accuracy": "frame-perfect for visual actions",
      "levels": "-8dB to -15dB depending on prominence",
      "spatial": "positioned to match visual elements"
    },
    "music_track": {
      "progression": "ominous → anxiety → medical → pharmaceutical → luxury → resolve",
      "level": "-12dB to -20dB under dialogue",
      "style": "electronic → dramatic → clinical → commercial"
    }
  }
}
```

### VISUAL CONSISTENCY FRAMEWORK

```json
{
  "VISUAL_FLOW": {
    "color_progression": [
      "dark/blue (crypto loss)",
      "harsh white (panic)", 
      "clinical white (medical)",
      "clean blue (pharmaceutical)",
      "gold/luxury (premium)",
      "diamond sparkle (status)",
      "medical white (resolution)"
    ],
    "lighting_evolution": [
      "screen glow → harsh fluorescent → clinical → commercial → luxury → premium → medical"
    ],
    "camera_language": [
      "intimate → medium → wide clinical → graphics → macro luxury → lifestyle → direct"
    ]
  }
}
```

### PLATFORM OPTIMIZATION

```json
{
  "PLATFORM_VERSIONS": {
    "tiktok": {
      "hook_timing": "0-2s crypto chart disaster",
      "viral_moment": "beat 2 outburst",
      "loop_potential": "medical conclusion to crypto start"
    },
    "instagram": {
      "aesthetic_focus": "beats 5-6 luxury positioning",
      "story_format": "7-beat sequential stories",
      "reels_edit": "fast-cut highlight version"
    },
    "youtube": {
      "full_narrative": "complete 56-second pharmaceutical parody",
      "thumbnail": "beat 3 doctor reaction",
      "description": "satirical pharmaceutical commercial"
    }
  }
}
```

### TECHNICAL SPECIFICATIONS

**Camera Precision:**
- Beat 1: Static medium close-up (50mm f/2.8)
- Beat 2: Slight zoom medium shot (35mm f/2.8)  
- Beat 3: Clinical wide shot (24mm f/4)
- Beat 4: Animated graphics overlay
- Beat 5: Macro product rotation (85mm f/1.8)
- Beat 6: Luxury dolly sequence (35mm f/1.4)
- Beat 7: Direct pharmaceutical standard (50mm f/2.8)

**Lighting Strategy:**
- Progression from dark/harsh to clinical to luxury to medical
- Each beat has distinct lighting personality
- Motivated lighting sources throughout

### VIRAL MECHANICS INTEGRATION

```json
{
  "ENGAGEMENT_TRIGGERS": {
    "hook_cascade": {
      "0-2s": "crypto disaster visual hook",
      "8-10s": "patient outburst audio hook", 
      "16-18s": "doctor disgust reaction hook"
    },
    "shareable_moments": {
      "beat_2": "crypto/medical condition combination",
      "beat_4": "CRD syndrome definition",
      "beat_6": "diamond luxury positioning",
      "beat_7": "absurd pharmaceutical disclaimers"
    },
    "quotable_lines": [
      "crypto bags are sinking, my dick's oozing",
      "Chronic Round Dripper syndrome", 
      "most expensive member in the room",
      "restrictions apply for size, skin color, income bracket"
    ]
  }
}
```

### QUALITY GATES VALIDATION

```json
{
  "VALIDATION_CHECKLIST": {
    "technical": {
      "beat_duration": "exactly 8s each ✓",
      "character_count": "2 maximum ✓", 
      "camera_specs": "all defined ✓",
      "lighting_specs": "all defined ✓"
    },
    "creative": {
      "emotional_arc": "embarrassment → medical → luxury → resolution ✓",
      "viral_hooks": "identified per beat ✓",
      "shareable_moments": "multiple per beat ✓",
      "platform_fit": "optimized for TikTok primary ✓"
    },
    "consistency": {
      "character_bible": "complete descriptions ✓",
      "voice_profiles": "detailed for each ✓",
      "visual_continuity": "planned progression ✓",
      "audio_continuity": "mapped across beats ✓"
    }
  }
}
```

---

## Next Step
With 7-beat architecture complete, proceed to Prompt 2: Script Engineering for precise dialogue optimization and timing refinement.