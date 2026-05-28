# $STD Pharma Commercial - Visual Design

## PROJECT VISUAL IDENTITY
```json
{
  "title": "Ask Your Financial Advisor About STD",
  "visual_style": "pharmaceutical_commercial_parody",
  "aspect_ratio": "9:16 vertical",
  "color_grade": "medical_professional_warm",
  "production_value": "broadcast_quality"
}
```

## COLOR SCIENCE & PALETTE
```json
{
  "primary_palette": {
    "medical_white": "#FDFEFE",
    "clinical_blue": "#4A90E2",
    "pharma_teal": "#17A2B8",
    "warning_orange": "#FF6B35"
  },
  "skin_tones": {
    "patient_base": "#D4A574",
    "patient_shadows": "#A67C52",
    "doctor_base": "#E5C4A1",
    "doctor_shadows": "#C9A882"
  },
  "environment": {
    "exam_room_walls": "#F5F5F0",
    "medical_equipment": "#E0E0E0",
    "fluorescent_cast": "#F0F8FF",
    "shadow_tone": "#6B6B68"
  },
  "grade": {
    "look": "slightly desaturated medical",
    "contrast": "1.15",
    "saturation": "0.80",
    "highlights": "+5 blue",
    "shadows": "+3 cyan"
  }
}
```

## BEAT 1 VISUAL - "The Consultation Begins"
```json
{
  "shot_id": "001A",
  "shot_type": "medium two-shot",
  "duration": "8 seconds",
  "keywords": [
    "9:16 vertical",
    "medical office",
    "pharmaceutical lighting",
    "two characters",
    "professional atmosphere",
    "sterile environment",
    "comedic undertones",
    "no text overlays"
  ],
  "characters": {
    "patient": "Brad the Trader, 32-year-old male, 5'10\", average build, brown messy hair showing stress, bags under eyes, wearing wrinkled blue button-up shirt and khaki pants, phone clutched in right hand, fidgety posture",
    "doctor": "Dr. Stevens, 48-year-old male, 6'0\", professional fit build, salt and pepper neat hair, wearing white medical coat over blue dress shirt with tie, stethoscope around neck, holding clipboard, glasses on face"
  },
  "camera": {
    "lens": "35mm",
    "aperture": "f/2.8",
    "position": "eye level 160cm, 2m from subjects",
    "framing": "both characters in frame, patient left, doctor right",
    "movement": "static first 6s, subtle 15cm push-in final 2s",
    "depth_of_field": "both subjects sharp, background soft"
  },
  "lighting": {
    "key_light": {
      "type": "fluorescent panel simulation",
      "temperature": "5600K",
      "position": "overhead 30° down",
      "intensity": "100%",
      "quality": "soft medical lighting"
    },
    "fill_light": {
      "type": "bounce from white walls",
      "ratio": "2:1 to key",
      "side": "camera left and right"
    },
    "practicals": {
      "exam_light": "visible overhead, 5000K",
      "window": "soft daylight right side, 6500K"
    },
    "overall_mood": "bright, clinical, slightly flat"
  },
  "composition": {
    "rule_of_thirds": "patient left third, doctor right third",
    "eye_lines": "both at top third horizontal",
    "negative_space": "minimal, medical posters visible",
    "depth_layers": {
      "foreground": "exam table edge bottom frame",
      "midground": "both characters",
      "background": "medical office details soft focus"
    }
  },
  "environment": {
    "location": "standard medical examination room",
    "props": [
      "examination table with paper",
      "blood pressure monitor on wall",
      "anatomical posters",
      "sink and soap dispenser",
      "medical waste bin"
    ],
    "atmosphere": "sterile, professional, slightly uncomfortable"
  },
  "motion_choreography": {
    "0-2s": "patient fidgets, checks phone nervously",
    "2-4s": "animated hand gestures while explaining",
    "4-6s": "shows phone screen to doctor",
    "6-8s": "camera subtle push as tension builds"
  }
}
```

## BEAT 2 VISUAL - "The Diagnosis"
```json
{
  "shot_id": "002A",
  "shot_type": "over-shoulder to X-ray reveal",
  "duration": "8 seconds",
  "keywords": [
    "9:16 vertical",
    "medical diagnosis",
    "X-ray reveal",
    "dramatic lighting",
    "visual gag setup",
    "professional setting",
    "comedic timing",
    "no text overlays"
  ],
  "characters": {
    "doctor": "Dr. Stevens, 48-year-old male, 6'0\", professional fit build, salt and pepper neat hair, wearing white medical coat over blue dress shirt with tie, stethoscope around neck, holding clipboard, glasses on face",
    "patient": "Brad the Trader, 32-year-old male, 5'10\", average build, brown messy hair showing stress, bags under eyes, wearing wrinkled blue button-up shirt and khaki pants, visible partially in foreground"
  },
  "camera": {
    "lens": "50mm",
    "aperture": "f/2.0",
    "position": "over patient's shoulder, 1.5m from doctor",
    "movement": {
      "0-3s": "static on doctor",
      "3-6s": "pan right to X-ray viewer",
      "6-8s": "hold on X-ray image"
    },
    "focus": {
      "0-3s": "doctor sharp, patient shoulder soft",
      "3-8s": "rack to X-ray when revealed"
    }
  },
  "lighting": {
    "scene_lighting": {
      "key": "exam room fluorescent continuing",
      "fill": "wall bounce 3:1 ratio",
      "rim": "subtle separation from background"
    },
    "x_ray_lighting": {
      "backlight": "bright 6500K through X-ray",
      "glow": "soft halo around viewer box",
      "contrast": "high contrast on X-ray image"
    },
    "dramatic_shift": "lighting dims slightly when X-ray activates"
  },
  "special_element": {
    "x_ray_image": {
      "visual": "chest X-ray with wallet-shaped void where heart should be",
      "details": "wallet clearly has holes/tears visible as dark spots",
      "style": "medically accurate but obviously edited",
      "timing": "full reveal at 0:05"
    }
  },
  "composition": {
    "framing_progression": {
      "0-3s": "OTS with doctor center frame",
      "3-5s": "pan follows doctor's gesture",
      "5-8s": "X-ray fills 80% of frame"
    },
    "visual_joke_setup": "serious medical framing for absurd reveal"
  },
  "environment": {
    "continuity": "same exam room as beat 1",
    "x_ray_viewer": "wall-mounted light box, professional",
    "additional_props": ["medical certificates on wall", "hand sanitizer"]
  },
  "performance_blocking": {
    "doctor": "professional gestures, points to X-ray",
    "patient": "visible shock reaction in soft focus",
    "timing": "perfectly synchronized with dialogue"
  }
}
```

## BEAT 3 VISUAL - "The Prescription"
```json
{
  "shot_id": "003A",
  "shot_type": "wide shot with push-in",
  "duration": "8 seconds",
  "keywords": [
    "9:16 vertical",
    "pharmaceutical commercial",
    "disclaimer scene",
    "prescription handoff",
    "rapid disclaimer",
    "medical comedy",
    "broadcast aesthetic",
    "no text overlays"
  ],
  "characters": {
    "doctor": "Dr. Stevens, 48-year-old male, 6'0\", professional fit build, salt and pepper neat hair, wearing white medical coat over blue dress shirt with tie, stethoscope around neck, holding prescription pad",
    "patient": "Brad the Trader, 32-year-old male, 5'10\", average build, brown messy hair showing stress, bags under eyes, wearing wrinkled blue button-up shirt and khaki pants, sitting on exam table looking worried"
  },
  "camera": {
    "lens": "24mm",
    "aperture": "f/4.0",
    "starting_position": "wide shot 3m from subjects",
    "movement": {
      "0-2s": "static wide establishing",
      "2-7s": "slow 50cm push-in during disclaimer",
      "7-8s": "hold on patient's worried reaction"
    },
    "framing": "both characters visible, vertical composition optimized"
  },
  "lighting": {
    "base_setup": {
      "overall": "bright pharmaceutical commercial lighting",
      "temperature": "5600K neutral medical",
      "intensity": "20% brighter than previous beats",
      "quality": "soft, even, optimistic"
    },
    "three_point": {
      "key": "45° camera left, soft box",
      "fill": "opposite side, 1.5:1 ratio",
      "back": "rim light for separation"
    },
    "commercial_touch": {
      "glow": "subtle warm highlights on faces",
      "background": "evenly lit, no harsh shadows",
      "mood": "artificially optimistic despite content"
    }
  },
  "visual_style": {
    "pharmaceutical_aesthetic": {
      "cleanliness": "pristine, over-lit environment",
      "color_pop": "slightly enhanced saturation",
      "depth": "everything in reasonable focus",
      "movement": "smooth, professional camera work"
    },
    "disclaimer_visualization": {
      "focus": "patient's increasingly worried expression",
      "background": "doctor writing prescription calmly",
      "contrast": "calm professionalism vs patient panic"
    }
  },
  "composition": {
    "wide_frame": {
      "left_third": "doctor at desk writing",
      "center": "negative space showing room",
      "right_third": "patient on exam table"
    },
    "push_in_reframe": {
      "end_position": "medium two-shot",
      "emphasis": "patient's reaction during disclaimer"
    }
  },
  "environment": {
    "pharmaceutical_touches": [
      "STD branded pamphlets visible",
      "$STD prescription pad",
      "fake pharma posters on wall",
      "overly clean surfaces"
    ],
    "continuity": "same room but brighter, more commercial"
  },
  "performance_notes": {
    "doctor": "calm, professional prescription writing",
    "patient": "growing concern during disclaimer",
    "physical_comedy": "patient's eyes widen with each side effect"
  },
  "audio_visual_sync": {
    "disclaimer_pacing": "patient reactions match side effects",
    "prescription_tear": "visible and audible at 0:01",
    "final_moment": "reluctant prescription acceptance"
  }
}
```

## PLATFORM-SPECIFIC FRAMING
```json
{
  "9:16_vertical_primary": {
    "safe_area": "center 85% for all action",
    "text_space": "avoided for clean image",
    "critical_elements": "characters always fully visible"
  },
  "16:9_horizontal_extraction": {
    "reframe_strategy": "center cut maintains story",
    "wide_shots": "composed to work both ways",
    "character_placement": "vertical stack when possible"
  },
  "1:1_square_safety": {
    "instagram_ready": "key moments center square",
    "thumbnail_moments": "X-ray reveal at 0:13"
  }
}
```

## VISUAL EFFECTS & GRAPHICS
```json
{
  "minimal_vfx": {
    "x_ray_composite": "simple 2D overlay",
    "lighting_effects": "practical where possible",
    "color_correction": "basic pharmaceutical look"
  },
  "no_text_overlays": {
    "reason": "cleaner for platform flexibility",
    "information": "conveyed through visuals only"
  },
  "practical_effects": {
    "x_ray_illumination": "real light box",
    "paper_handling": "real props",
    "environmental": "authentic medical setting"
  }
}
```

## CHARACTER VISUAL CONTINUITY
```json
{
  "patient_constants": {
    "every_beat_description": "Brad the Trader, 32-year-old male, 5'10\", average build, brown messy hair showing stress, bags under eyes, wearing wrinkled blue button-up shirt and khaki pants",
    "degradation": "increasingly disheveled each beat",
    "phone": "always visible in hand or pocket"
  },
  "doctor_constants": {
    "every_beat_description": "Dr. Stevens, 48-year-old male, 6'0\", professional fit build, salt and pepper neat hair, wearing white medical coat over blue dress shirt with tie, stethoscope around neck",
    "professionalism": "maintains composure throughout",
    "props": "clipboard in beat 1-2, prescription pad in beat 3"
  }
}
```

## LIGHTING CONTINUITY PLAN
```json
{
  "base_motivation": "medical office fluorescent",
  "consistency": {
    "color_temperature": "5600K throughout",
    "intensity": "bright, slightly flat",
    "quality": "soft, diffused overhead"
  },
  "progression": {
    "beat_1": "standard medical lighting",
    "beat_2": "slight dramatic shift for X-ray",
    "beat_3": "brighter pharmaceutical commercial"
  }
}
```

## VISUAL TROUBLESHOOTING
```json
{
  "common_issues": {
    "character_mismatch": "solution: copy exact descriptions",
    "lighting_inconsistency": "solution: maintain base setup",
    "framing_problems": "solution: 9:16 safe zones"
  },
  "seed_strategy": {
    "beat_1_first": "establish character looks",
    "note_successful_seeds": "reuse for consistency",
    "adjust_minimally": "only technical changes"
  }
}
```

## VISUAL QUALITY CHECKLIST
✓ Camera specifications complete for all beats
✓ Lighting setups detailed with ratios
✓ Character descriptions identical each beat
✓ Color palette with hex codes defined
✓ Platform optimization considered
✓ Composition rules specified
✓ Environmental continuity maintained
✓ Movement choreography timed
✓ Visual gag (X-ray) properly set up
✓ Pharmaceutical aesthetic achieved in beat 3

## PRODUCTION NOTES
- Maintain bright, medical lighting throughout
- Ensure X-ray gag reads clearly in 2 seconds
- Keep pharmaceutical aesthetic authentic but parodic
- Character positions consistent for continuity
- 9:16 vertical framing critical for TikTok
- No text overlays for maximum platform flexibility