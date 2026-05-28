# $STD Pharma Commercial - Story Architecture

## PROJECT CONFIGURATION
```json
{
  "title": "Ask Your Financial Advisor About STD",
  "content_type": "commercial/parody",
  "duration": "3 beats × 8 seconds = 24 seconds",
  "structure": "continuous",
  "platform_primary": "tiktok",
  "platform_secondary": ["youtube", "instagram"],
  "concept": "Pharmaceutical commercial parody where crypto trader visits doctor about STD symptoms"
}
```

## CHARACTER BIBLE

### PATIENT_001 - Brad the Trader
```json
{
  "char_id": "PATIENT_001",
  "physical": {
    "age": 32,
    "height": "5'10\" / 178cm",
    "build": "average, slightly disheveled",
    "hair": "brown, messy from stress",
    "clothing": "wrinkled business casual - blue button-up, khakis",
    "distinguishing": "bags under eyes, phone always in hand"
  },
  "voice": {
    "tone": "tenor, anxious",
    "pace": "110 words per minute when stressed",
    "accent": "neutral American",
    "quirks": ["uses crypto slang inappropriately", "checks phone mid-sentence"],
    "emotion_range": "worried→desperate→resigned"
  },
  "movement": {
    "energy": "6/10 - fidgety",
    "style": "nervous, constantly shifting",
    "gestures": "phone checking, head in hands"
  },
  "consistency_code": "PATIENT001_EXACT"
}
```

### DOCTOR_001 - Dr. Stevens
```json
{
  "char_id": "DOCTOR_001",
  "physical": {
    "age": 48,
    "height": "6'0\" / 183cm",
    "build": "professional, fit",
    "hair": "salt and pepper, neat",
    "clothing": "white coat, blue dress shirt, tie, stethoscope",
    "distinguishing": "glasses, clipboard always present"
  },
  "voice": {
    "tone": "baritone, authoritative yet caring",
    "pace": "90 words per minute",
    "accent": "professional American",
    "quirks": ["medical terminology", "knowing nods"],
    "emotion_range": "professional→concerned→sympathetic"
  },
  "movement": {
    "energy": "4/10 - calm and controlled",
    "style": "deliberate medical professionalism",
    "gestures": "writing on clipboard, adjusting glasses"
  },
  "consistency_code": "DOCTOR001_EXACT"
}
```

## BEAT ARCHITECTURE

### BEAT 1 - "The Consultation Begins"
```json
{
  "meta": {
    "id": "001",
    "title": "Patient Describes Symptoms",
    "duration": "8s",
    "emotion": "anxiety→desperation"
  },
  "technical": {
    "shot": "medium two-shot",
    "lens": "35mm f/2.8",
    "camera": "static, slight push-in last 2s",
    "fps": 24
  },
  "characters": {
    "patient_ref": "PATIENT001_EXACT",
    "doctor_ref": "DOCTOR001_EXACT",
    "positions": "patient on exam table left, doctor standing right"
  },
  "environment": {
    "location": "medical examination room",
    "lighting": "fluorescent overhead 5600K, soft fill from window",
    "props": "exam table, medical posters, eye chart, doctor's stool",
    "atmosphere": "sterile medical office"
  },
  "action": {
    "primary": "patient explains crypto trading symptoms",
    "timing": {
      "0-2s": "patient fidgets, checks phone",
      "2-6s": "explains symptoms animatedly",
      "6-8s": "shows phone chart to doctor"
    }
  },
  "audio": {
    "dialogue": {
      "patient": "Doctor, I keep buying high and selling low. I see green candles in my sleep!",
      "delivery": "anxious, increasing desperation",
      "timing": "0:01-0:06"
    },
    "ambient": "medical office tone -20dB",
    "sfx": [
      {"sound": "phone notification", "time": "0:01", "level": "-15dB"},
      {"sound": "paper rustling", "time": "0:07", "level": "-18dB"}
    ]
  },
  "viral_element": "relatable crypto trader behavior in medical setting"
}
```

### BEAT 2 - "The Diagnosis"
```json
{
  "meta": {
    "id": "002",
    "title": "Doctor Delivers Diagnosis",
    "duration": "8s",
    "emotion": "concern→understanding"
  },
  "technical": {
    "shot": "over-shoulder on doctor, then cut to X-ray insert",
    "lens": "50mm f/2.0",
    "camera": "static with 3s insert shot",
    "fps": 24
  },
  "characters": {
    "doctor_ref": "DOCTOR001_EXACT",
    "patient_ref": "PATIENT001_EXACT",
    "positions": "doctor center frame, patient partially visible"
  },
  "environment": {
    "location": "same exam room",
    "lighting": "consistent medical lighting",
    "props": "X-ray light box activated at 0:04",
    "atmosphere": "serious medical consultation"
  },
  "action": {
    "primary": "doctor reviews symptoms and shows X-ray",
    "timing": {
      "0-3s": "doctor nods knowingly, writes on clipboard",
      "3-6s": "shows X-ray of wallet with holes",
      "6-8s": "patient reacts with recognition"
    }
  },
  "audio": {
    "dialogue": {
      "doctor": "Classic symptoms of STD - Solana Trench Disease. Look at this X-ray.",
      "delivery": "professional, sympathetic",
      "timing": "0:01-0:05"
    },
    "ambient": "medical office tone -20dB",
    "sfx": [
      {"sound": "clipboard writing", "time": "0:01-0:03", "level": "-16dB"},
      {"sound": "X-ray light click", "time": "0:04", "level": "-12dB"}
    ]
  },
  "viral_element": "X-ray showing wallet with holes - visual gag"
}
```

### BEAT 3 - "The Prescription"
```json
{
  "meta": {
    "id": "003",
    "title": "Treatment Options & Disclaimer",
    "duration": "8s",
    "emotion": "professional→rapid disclaimer"
  },
  "technical": {
    "shot": "wide shot showing both, then push to patient reaction",
    "lens": "24mm f/4.0",
    "camera": "slow push-in during disclaimer",
    "fps": 24
  },
  "characters": {
    "doctor_ref": "DOCTOR001_EXACT",
    "patient_ref": "PATIENT001_EXACT",
    "positions": "both in frame, patient still on table"
  },
  "environment": {
    "location": "same exam room",
    "lighting": "medical lighting, slightly warmer",
    "props": "prescription pad, STD pamphlet visible",
    "atmosphere": "pharmaceutical commercial aesthetic"
  },
  "action": {
    "primary": "doctor prescribes while rapid disclaimer plays",
    "timing": {
      "0-2s": "doctor writes prescription",
      "2-7s": "rapid disclaimer while patient looks worried",
      "7-8s": "patient accepts prescription reluctantly"
    }
  },
  "audio": {
    "dialogue": {
      "doctor": "I'm prescribing more $STD.",
      "narrator_vo": "Side effects include: portfolio shrinkage, fear of Telegram groups, emotional attachment to JPEGs, and explaining blockchain at inappropriate times.",
      "delivery": "doctor calm, narrator rapid pharmaceutical style",
      "timing": "doctor: 0:00-0:02, narrator: 0:02-0:07"
    },
    "ambient": "medical office -22dB under narrator",
    "sfx": [
      {"sound": "prescription tearing", "time": "0:01", "level": "-14dB"}
    ],
    "music": "soft pharmaceutical commercial bed -18dB"
  },
  "viral_element": "rapid-fire crypto side effects in medical disclaimer style"
}
```

## VIRAL OPTIMIZATION
```json
{
  "hook_timing": "0:00-0:02 - buying high selling low",
  "shareable_moment": {
    "timestamp": "0:11-0:14",
    "type": "visual gag",
    "description": "X-ray of wallet with holes"
  },
  "loop_potential": true,
  "trend_compatibility": "pharma parody format",
  "discussion_trigger": "relatable crypto trading behaviors"
}
```

## TECHNICAL NOTES
```json
{
  "seed_strategy": "generate beat 1 first for character consistency",
  "complexity_rating": "medium - two characters interacting",
  "estimated_generations": "4-6 attempts per beat",
  "continuity_notes": "maintain exact character positions and clothing throughout"
}
```

## SUCCESS METRICS
```json
{
  "target_views": "250K+",
  "target_shares": "15K+",
  "target_engagement": "20%+",
  "target_comments": "relatability responses"
}
```

## KEYWORDS FOR GENERATION
```
[
  "9:16 vertical",
  "medical office",
  "doctor consultation",
  "pharmaceutical commercial parody",
  "two characters",
  "professional lighting",
  "comedic timing",
  "no text overlays",
  "continuous story",
  "sterile medical environment"
]
```