# $STD Pharma Commercial - Integration Architecture

## FINAL PROJECT INTEGRATION
```json
{
  "project": {
    "title": "Ask Your Financial Advisor About STD",
    "version": "integrated_final",
    "beats": 3,
    "total_duration": "24s",
    "keywords": [
      "9:16 vertical",
      "pharmaceutical commercial parody",
      "medical office setting",
      "two characters",
      "comedic timing",
      "professional lighting",
      "disclaimer style",
      "no text overlays"
    ],
    "content_type": "commercial_parody"
  }
}
```

## CHARACTER CONSISTENCY VERIFICATION
```json
{
  "patient_all_beats": {
    "beat_1": "Brad the Trader, 32-year-old male, 5'10\", average build, brown messy hair showing stress, bags under eyes, wearing wrinkled blue button-up shirt and khaki pants, phone clutched in right hand, fidgety posture",
    "beat_2": "Brad the Trader, 32-year-old male, 5'10\", average build, brown messy hair showing stress, bags under eyes, wearing wrinkled blue button-up shirt and khaki pants, visible partially in foreground",
    "beat_3": "Brad the Trader, 32-year-old male, 5'10\", average build, brown messy hair showing stress, bags under eyes, wearing wrinkled blue button-up shirt and khaki pants, sitting on exam table looking worried",
    "consistency_check": "identical core description ✓"
  },
  "doctor_all_beats": {
    "beat_1": "Dr. Stevens, 48-year-old male, 6'0\", professional fit build, salt and pepper neat hair, wearing white medical coat over blue dress shirt with tie, stethoscope around neck, holding clipboard, glasses on face",
    "beat_2": "Dr. Stevens, 48-year-old male, 6'0\", professional fit build, salt and pepper neat hair, wearing white medical coat over blue dress shirt with tie, stethoscope around neck, holding clipboard, glasses on face",
    "beat_3": "Dr. Stevens, 48-year-old male, 6'0\", professional fit build, salt and pepper neat hair, wearing white medical coat over blue dress shirt with tie, stethoscope around neck, holding prescription pad",
    "consistency_check": "identical except prop change ✓"
  }
}
```

## FLOW STATE MAPPING
```json
{
  "narrative_energy_curve": [4, 6, 8, 7, 9, 6],
  "beat_breakdown": {
    "beat_1": {
      "energy": "4→6",
      "description": "anxious confession builds",
      "peak_moment": "0:06 - shows phone chart"
    },
    "beat_2": {
      "energy": "6→8",
      "description": "diagnosis revelation",
      "peak_moment": "0:05 - X-ray reveal"
    },
    "beat_3": {
      "energy": "7→9→6",
      "description": "prescription with rapid disclaimer",
      "peak_moment": "0:02-0:07 - side effects list"
    }
  },
  "attention_strategy": "escalating medical parody with visual gag payoff"
}
```

## AUDIO CONTINUITY ARCHITECTURE
```json
{
  "master_audio_bus": {
    "level": "-3dB peak",
    "compression": "2:1 glue",
    "eq": "gentle high shelf +2dB @ 10kHz",
    "limiter": "-0.3dB ceiling"
  },
  "continuous_elements": {
    "room_tone": {
      "description": "medical office ambience",
      "level": "-20dB constant",
      "frequency": "full spectrum with fluorescent hum",
      "consistency": "identical across all beats"
    },
    "music_bed": {
      "beat_1-2": "subtle tension building",
      "beat_3": "pharmaceutical commercial style",
      "level": "-18dB rising to -15dB",
      "style": "medical drama to pharma optimism"
    }
  },
  "dialogue_processing": {
    "patient_voice": {
      "eq": "slight mid boost for anxiety",
      "compression": "3:1 for consistency",
      "level": "-6dB normalized"
    },
    "doctor_voice": {
      "eq": "warm professional tone",
      "compression": "2:1 gentle",
      "level": "-6dB normalized"
    },
    "narrator_voice": {
      "eq": "broadcast clarity boost",
      "compression": "4:1 heavy",
      "level": "-4dB for disclaimer"
    }
  }
}
```

## TRANSITION ENGINEERING
```json
{
  "beat_1_to_2": {
    "type": "motivated_cut",
    "visual": {
      "exit_action": "patient shows phone",
      "enter_action": "doctor responds",
      "continuity": "eyeline match"
    },
    "audio": {
      "bridge": "paper rustle carries over",
      "room_tone": "continuous",
      "timing": "cut on dialogue pause"
    },
    "timing": "7.8s exit prep"
  },
  "beat_2_to_3": {
    "type": "reaction_cut",
    "visual": {
      "exit_focus": "X-ray reveal",
      "enter_wide": "both characters",
      "motivation": "patient shock to prescription"
    },
    "audio": {
      "bridge": "patient gasp to music rise",
      "transition": "dramatic to commercial",
      "timing": "emotion peak at 7.5s"
    }
  }
}
```

## INTEGRATED BEAT ASSEMBLY

### BEAT 1 INTEGRATED
```json
{
  "meta": {
    "id": "001",
    "duration": "8.0s",
    "in_point": "0:00:00.00",
    "out_point": "0:00:08.00"
  },
  "complete_description": {
    "shot": "medium two-shot medical office",
    "characters": {
      "patient": "Brad the Trader, 32-year-old male, 5'10\", average build, brown messy hair showing stress, bags under eyes, wearing wrinkled blue button-up shirt and khaki pants, phone clutched in right hand, fidgety posture",
      "doctor": "Dr. Stevens, 48-year-old male, 6'0\", professional fit build, salt and pepper neat hair, wearing white medical coat over blue dress shirt with tie, stethoscope around neck, holding clipboard, glasses on face"
    }
  },
  "audio_layers": {
    "dialogue": {
      "text": "Doctor, I keep buying high and selling low. I see green candles in my sleep!",
      "timing": "0:01-0:06",
      "processing": "anxious delivery"
    },
    "ambient": "medical office -20dB",
    "sfx": ["phone notification 0:01", "paper rustle 0:07"],
    "music": "subtle tension intro -18dB"
  },
  "transition_prep": {
    "visual": "phone shown to doctor",
    "audio": "paper rustle bridge",
    "timing": "7.5s begin transition"
  }
}
```

### BEAT 2 INTEGRATED
```json
{
  "meta": {
    "id": "002",
    "duration": "8.0s",
    "in_point": "0:00:08.00",
    "out_point": "0:00:16.00"
  },
  "complete_description": {
    "shot": "over-shoulder to X-ray reveal",
    "characters": {
      "doctor": "Dr. Stevens, 48-year-old male, 6'0\", professional fit build, salt and pepper neat hair, wearing white medical coat over blue dress shirt with tie, stethoscope around neck, holding clipboard, glasses on face",
      "patient": "Brad the Trader, 32-year-old male, 5'10\", average build, brown messy hair showing stress, bags under eyes, wearing wrinkled blue button-up shirt and khaki pants, visible partially in foreground"
    }
  },
  "audio_layers": {
    "dialogue": {
      "text": "Classic symptoms of STD - Solana Trench Disease. Look at this X-ray.",
      "timing": "0:01-0:05",
      "processing": "professional diagnosis"
    },
    "ambient": "consistent medical office -20dB",
    "sfx": ["clipboard writing 0:01-0:03", "X-ray click 0:04", "patient gasp 0:06"],
    "music": "tension builds -17dB"
  },
  "viral_moment": {
    "timing": "0:05-0:08",
    "element": "X-ray of wallet with holes",
    "audio_punctuation": "dramatic sting"
  },
  "transition_prep": {
    "visual": "hold on patient reaction",
    "audio": "gasp leads to music shift",
    "timing": "7.5s transition prep"
  }
}
```

### BEAT 3 INTEGRATED
```json
{
  "meta": {
    "id": "003",
    "duration": "8.0s",
    "in_point": "0:00:16.00",
    "out_point": "0:00:24.00"
  },
  "complete_description": {
    "shot": "wide shot with push-in during disclaimer",
    "characters": {
      "doctor": "Dr. Stevens, 48-year-old male, 6'0\", professional fit build, salt and pepper neat hair, wearing white medical coat over blue dress shirt with tie, stethoscope around neck, holding prescription pad",
      "patient": "Brad the Trader, 32-year-old male, 5'10\", average build, brown messy hair showing stress, bags under eyes, wearing wrinkled blue button-up shirt and khaki pants, sitting on exam table looking worried"
    }
  },
  "audio_layers": {
    "dialogue": {
      "doctor": "I'm prescribing more $STD.",
      "narrator": "Side effects include: portfolio shrinkage, fear of Telegram groups, emotional attachment to JPEGs, explaining blockchain at dinner parties, and chronic hopium addiction.",
      "timing": "doctor 0:00-0:02, narrator 0:02-0:07",
      "processing": "doctor calm, narrator rapid pharma"
    },
    "ambient": "brighter medical office -22dB",
    "sfx": ["prescription tear 0:01", "paper handoff 0:07"],
    "music": "pharmaceutical commercial bed -15dB"
  },
  "disclaimer_choreography": {
    "camera": "slow push-in during list",
    "patient_reaction": "growing worry each symptom",
    "final_moment": "reluctant acceptance"
  }
}
```

## PLATFORM OPTIMIZATION

### MASTER EXPORT
```json
{
  "video_specs": {
    "codec": "H.264 High Profile",
    "resolution": "1080x1920 (9:16)",
    "bitrate": "10Mbps VBR",
    "framerate": "24fps",
    "color_space": "Rec.709"
  },
  "audio_specs": {
    "codec": "AAC-LC",
    "bitrate": "320kbps",
    "sample_rate": "48kHz",
    "channels": "Stereo",
    "loudness": "-14 LUFS integrated"
  }
}
```

### PLATFORM VERSIONS
```json
{
  "tiktok": {
    "aspect": "9:16 native",
    "duration": "24s optimal",
    "thumbnail": "X-ray reveal frame",
    "hashtags": "#crypto #STD #solana #pharmacommercial",
    "features": {
      "duet_point": "side effects list",
      "stitch_point": "diagnosis moment"
    }
  },
  "youtube_shorts": {
    "aspect": "9:16 native",
    "duration": "24s",
    "thumbnail": "custom X-ray image",
    "title_optimization": "When Crypto Trading Becomes a Medical Condition",
    "end_screen": "last 5s for elements"
  },
  "instagram_reels": {
    "aspect": "9:16 native",
    "duration": "24s",
    "cover_frame": "doctor with X-ray",
    "caption_space": "top 15% reserved",
    "music_attribution": "original audio"
  },
  "twitter": {
    "aspect": "16:9 extracted",
    "duration": "24s",
    "key_moment": "0:13 X-ray reveal",
    "caption": "POV: Your crypto losses are now a medical condition"
  }
}
```

## VIRAL OPTIMIZATION INTEGRATION
```json
{
  "hook_cascade": {
    "0:00-0:02": "buying high selling low - instant relatability",
    "0:09-0:11": "STD diagnosis - name recognition",
    "0:13-0:15": "X-ray wallet - visual gag peak",
    "0:18-0:23": "side effects list - shareable content"
  },
  "engagement_triggers": {
    "comment_prompts": [
      "What's your worst crypto symptom?",
      "Tag someone with STD",
      "Which side effect hit hardest?"
    ],
    "share_motivation": "relatable crypto trader pain",
    "save_reason": "reference for crypto jokes"
  },
  "loop_design": {
    "end_state": "patient holding prescription",
    "start_connection": "could lead back to symptoms",
    "audio": "music resolves to beginning tone"
  }
}
```

## QUALITY ASSURANCE CHECKLIST
```json
{
  "pre_generation": {
    "character_consistency": "✓ Identical descriptions all beats",
    "timing_accuracy": "✓ All beats exactly 8 seconds",
    "word_counts": "✓ Within specified limits",
    "audio_continuity": "✓ Room tone carries through",
    "visual_flow": "✓ Motivated transitions"
  },
  "post_generation": {
    "sync_verification": "Check audio matches action",
    "color_matching": "Ensure consistent medical lighting",
    "platform_crops": "Verify 9:16 safe areas",
    "export_quality": "Confirm specs match requirements"
  },
  "delivery_ready": {
    "master_file": "std_pharma_24s_9x16_master.mp4",
    "platform_files": {
      "tiktok": "std_pharma_tiktok.mp4",
      "youtube": "std_pharma_shorts.mp4",
      "instagram": "std_pharma_reels.mp4"
    },
    "thumbnail_assets": "X-ray frame exported",
    "metadata": "All tags and descriptions ready"
  }
}
```

## SEED MANAGEMENT
```json
{
  "generation_strategy": {
    "beat_1": {
      "approach": "new generation for character establishment",
      "priority": "nail patient anxiety and doctor professionalism",
      "seed": "[record successful seed]"
    },
    "beat_2": {
      "approach": "maintain character consistency",
      "priority": "clear X-ray gag visibility",
      "seed_reference": "use beat_1 seed if consistent"
    },
    "beat_3": {
      "approach": "consistent characters, pharma lighting",
      "priority": "disclaimer clarity and timing",
      "seed_reference": "continue consistency"
    }
  }
}
```

## PERFORMANCE TARGETS
```json
{
  "technical_success": {
    "generation_efficiency": "3-5 attempts per beat",
    "consistency_rate": "90%+ character match",
    "timing_precision": "±0.1s accuracy"
  },
  "engagement_projections": {
    "view_target": "250K+ first week",
    "share_rate": "8-10%",
    "comment_rate": "3-5%",
    "completion_rate": "75%+"
  },
  "platform_specific": {
    "tiktok": {
      "fyp_potential": "high - crypto + medical parody",
      "duet_potential": "very high - side effects",
      "trend_potential": "diagnosis format replicable"
    }
  }
}
```

## FINAL INTEGRATION NOTES
- Medical office continuity critical throughout
- X-ray gag is the viral centerpiece - must be clear
- Disclaimer speed essential for comedy timing
- Patient reactions drive emotional engagement
- Pharmaceutical aesthetic in beat 3 sells the parody
- No text overlays keeps content clean and flexible