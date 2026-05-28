# LPS (Limp Pump Syndrome) - Visual Design

## CAMERA SPECIFICATIONS
```json
{
  "lens_selection": {
    "beat_1": "50mm f/2.0 - intimate vulnerability",
    "beat_2": "35mm f/2.8 - pharmaceutical montage",
    "beat_3": "24mm f/4.0 - triumphant reveal",
    "beat_4": "35mm f/2.8 - standard pharma disclaimer"
  },
  "movement_patterns": {
    "beat_1": "slow push-in 40cm over 6s",
    "beat_2": "smooth transitions between vignettes",
    "beat_3": "dynamic orbital movement during success",
    "beat_4": "static with slight zoom for emphasis"
  }
}
```

## LIGHTING DESIGN
```json
{
  "beat_1_romantic": {
    "key_light": {
      "type": "practical candles + hidden soft box",
      "temperature": "3200K warm romantic",
      "position": "45° camera right, table level",
      "intensity": "100%",
      "modifier": "heavy diffusion for flattering light"
    },
    "fill_light": {
      "type": "bounce from wall",
      "temperature": "3200K matching key",
      "position": "camera left bounce",
      "ratio": "8:1 dramatic intimacy"
    },
    "practicals": {
      "candles": "visible flame sources, 2700K",
      "phone_screen": "cool 6500K glow on face",
      "wine_glasses": "subtle reflections"
    }
  },
  "beat_2_pharmaceutical": {
    "broadcast_lighting": {
      "key": "soft 5600K at 30° elevation",
      "fill": "5600K opposite, 2:1 ratio",
      "rim": "6500K separation light",
      "background": "even wash, no shadows"
    }
  },
  "beat_3_success": {
    "golden_hour": {
      "key": "3500K warm side light",
      "fill": "sky bounce 5600K",
      "ratio": "3:1 flattering",
      "practicals": "chart glow effects"
    }
  },
  "beat_4_disclaimer": {
    "even_pharma": {
      "setup": "high-key lighting",
      "ratio": "1.5:1 minimal shadows",
      "temperature": "5600K neutral"
    }
  }
}
```

## COLOR SCIENCE
```json
{
  "palette": {
    "primary": {
      "hargreldo_blue": "#0066CC",
      "success_green": "#00C851", 
      "warning_amber": "#FFAA00"
    },
    "skin_tones": {
      "base": "#D4A574",
      "romantic_warmth": "#E6C9A8",
      "success_glow": "#F5DEB3"
    },
    "environments": {
      "apartment": {
        "walls": "#2C2416",
        "candlelight": "#FF6B35",
        "shadows": "#1A1410"
      },
      "pharma_world": {
        "background": "#F5F5F5",
        "accents": "#0066CC",
        "text_safe": "#FFFFFF"
      }
    }
  },
  "grade": {
    "beat_1": "warm romantic, lifted shadows",
    "beat_2": "bright pharmaceutical, clean whites",
    "beat_3": "golden success, enhanced warmth",
    "beat_4": "standard pharma, neutral balance"
  }
}
```

## BEAT 1 - "The Problem" Visual Specifications
```json
{
  "shot_id": "001A",
  "shot_description": "medium two-shot transitioning to close-up on Trent",
  "keywords": ["9:16 vertical", "romantic mood", "intimate lighting", "upscale apartment", "disappointment", "crypto charts"],
  "character_descriptions": {
    "trent": "Trent, 35-year-old male, 5'11\", fit but stressed build, dark brown styled but slightly disheveled hair, wearing navy button-up shirt with top button undone, dark jeans, expensive silver watch on left wrist, tired eyes with slight bags underneath, forced smile fading to disappointment",
    "date": "Beautiful woman, 32-year-old female, 5'6\", attractive fit build, long blonde wavy hair, wearing elegant black cocktail dress with thin straps, silver heels, delicate gold necklace, natural makeup with red lipstick, sympathetic expression transitioning to concern"
  },
  "technical": {
    "camera": {
      "lens": "50mm",
      "aperture": "f/2.0",
      "position": "eye level 160cm",
      "movement": "slow push-in 40cm over 6s focusing on Trent",
      "framing_progression": "two-shot → medium Trent → close-up Trent"
    },
    "focus": {
      "subject": "starts on both, racks to Trent at 0:03",
      "depth": "shallow, 0.3m range",
      "bokeh": "smooth circular, candles in background"
    }
  },
  "composition": {
    "framing": "rule of thirds, Trent right, date left",
    "depth_layers": {
      "foreground": "wine glasses soft focus",
      "midground": "couple on couch",
      "background": "apartment, candles, city lights"
    }
  },
  "environment": {
    "location": "upscale apartment living room",
    "props": ["leather couch", "wine glasses", "candles", "modern art", "city view"],
    "atmosphere": "romantic evening ambiance",
    "time_of_day": "night, 9pm feel"
  },
  "motion": {
    "trent": "glances at phone, shoulders slump, looks away",
    "date": "leans in, touches his arm, pulls back confused",
    "timing": {
      "0-3s": "date moves closer",
      "3-6s": "Trent checks phone, reacts",
      "6-8s": "awkward separation"
    }
  }
}
```

## BEAT 2 - "You're Not Alone" Visual Specifications
```json
{
  "shot_id": "002A",
  "shot_description": "pharmaceutical commercial montage with product hero shot",
  "keywords": ["9:16 vertical", "bright pharmaceutical", "multiple vignettes", "hope building", "product reveal"],
  "character_descriptions": {
    "trader_1": "Male trader, 28-year-old, 5'9\", average build, short black hair, wearing white dress shirt rolled sleeves, gray slacks, glasses, dejected expression at computer screen",
    "trader_2": "Female trader, 34-year-old, 5'7\", professional build, shoulder-length brown hair in ponytail, wearing blue blazer over white blouse, black pencil skirt, frustrated expression at laptop",
    "trader_3": "Male trader, 42-year-old, 5'10\", slightly overweight, balding with gray sides, wearing wrinkled blue shirt, khaki pants, hopeless expression at multiple monitors"
  },
  "technical": {
    "camera": {
      "lens": "35mm",
      "aperture": "f/2.8",
      "movement": "smooth transitions between static setups",
      "framing": "medium shots of each trader, wide for product"
    }
  },
  "visual_progression": {
    "0-3s": {
      "content": "quick montage of sad traders",
      "transition": "smooth wipe transitions",
      "lighting": "gradually brightening"
    },
    "3-5s": {
      "content": "HarGreldo bottle dramatic reveal",
      "effect": "particle burst, lens flare",
      "camera": "slight zoom in on product"
    },
    "5-8s": {
      "content": "traders looking up with hope",
      "lighting": "bright pharmaceutical aesthetic",
      "color": "blue accent from product"
    }
  },
  "product_hero": {
    "bottle_design": "pharmaceutical blue and white",
    "label": "HarGreldo prominent, clinical design",
    "effects": "subtle glow, particle shimmer",
    "background": "gradient white to light blue"
  }
}
```

## BEAT 3 - "The Solution Works" Visual Specifications
```json
{
  "shot_id": "003A",
  "shot_description": "triumphant couple with chart visualizations",
  "keywords": ["9:16 vertical", "success story", "golden hour", "celebration", "romantic triumph"],
  "character_descriptions": {
    "trent": "Trent, 35-year-old male, 5'11\", fit but stressed build transformed to confident, dark brown now perfectly styled hair, wearing same navy button-up shirt but now crisp and confident, dark jeans, expensive silver watch on left wrist, bright eyes full of life, genuine confident smile",
    "date": "Beautiful woman, 32-year-old female, 5'6\", attractive fit build, long blonde wavy hair flowing, wearing same elegant black cocktail dress with thin straps, silver heels, delicate gold necklace, natural makeup with red lipstick, amazed and delighted expression"
  },
  "technical": {
    "camera": {
      "lens": "24mm",
      "aperture": "f/4.0",
      "movement": "dynamic orbital movement 45° over 5s",
      "height": "slight crane up 20cm"
    }
  },
  "visual_elements": {
    "chart_overlays": {
      "style": "holographic green candles rising",
      "position": "floating beside couple",
      "animation": "smooth upward movement",
      "opacity": "semi-transparent 70%"
    },
    "couple_blocking": {
      "0-3s": "Trent showing phone confidently",
      "3-6s": "embrace with her looking amazed",
      "6-8s": "she reaches for his hand (proposal tease)"
    }
  },
  "lighting_shift": {
    "quality": "romantic to triumphant",
    "color_temp": "3200K to 3500K warming",
    "intensity": "builds with success"
  },
  "environment": {
    "location": "same apartment transformed",
    "atmosphere": "success and satisfaction",
    "props": ["HarGreldo bottle visible on table", "champagne flutes", "green chart reflections"]
  }
}
```

## BEAT 4 - "Disclaimer & Call to Action" Visual Specifications
```json
{
  "shot_id": "004A", 
  "shot_description": "standard pharmaceutical disclaimer format",
  "keywords": ["9:16 vertical", "pharmaceutical commercial", "white background", "rapid disclaimer", "product beauty shot"],
  "visual_structure": {
    "background": "clean gradient white to light blue",
    "layout": "standard pharma commercial template",
    "text_space": "lower third for legal text"
  },
  "montage_elements": {
    "0-5s": {
      "content": "happy couples living best life",
      "scenes": ["beach walk", "dinner date", "morning coffee"],
      "pacing": "rapid 1-second cuts"
    },
    "5-8s": {
      "content": "product hero shot with CTA",
      "framing": "centered product, logo below",
      "effects": "subtle rotation, glow"
    }
  },
  "technical": {
    "camera": {
      "lens": "35mm",
      "aperture": "f/2.8",
      "movement": "static with 10% zoom on CTA",
      "position": "straight on, product level"
    }
  },
  "brand_elements": {
    "logo": "HarGreldo pharmaceutical style",
    "tagline": "Go All In",
    "color_scheme": "blue and white medical",
    "disclaimer_style": "standard pharma format"
  }
}
```

## MATERIAL PHYSICS (Product Shots)
```json
{
  "hargreldo_bottle": {
    "surface": {
      "material": "medical-grade plastic with matte finish",
      "label": "glossy with subtle embossing",
      "cap": "chrome with ridged texture"
    },
    "lighting_interaction": {
      "subsurface": "slight translucency showing pills",
      "reflections": "controlled specular on label",
      "rim_light": "defines bottle shape"
    }
  },
  "particle_effects": {
    "reveal_burst": {
      "type": "medical sparkle particles",
      "behavior": "radial burst from center",
      "color": "blue-white gradient",
      "duration": "1.5 seconds"
    }
  }
}
```

## PLATFORM OPTIMIZATION
```json
{
  "tiktok_9x16": {
    "safe_area": "center 80% for UI elements",
    "critical_action": "couple interactions center frame",
    "text_space": "bottom 20% clear for captions"
  },
  "youtube_16x9": {
    "reframe": "wider shots showing full environment",
    "thumbnail": "beat 3 @ 0:04 - celebration moment"
  },
  "instagram_reels": {
    "format": "9:16 matching TikTok",
    "story_safe": "top 15% clear for username"
  }
}
```

## VISUAL CONSISTENCY CHECKLIST
```json
{
  "character_continuity": {
    "trent_constants": "navy shirt, silver watch, hair style",
    "date_constants": "black dress, blonde hair, gold necklace",
    "wardrobe": "no changes between beats ✓"
  },
  "lighting_motivation": {
    "beat_1": "candlelight romantic ✓",
    "beat_2": "bright commercial ✓",
    "beat_3": "warm success ✓",
    "beat_4": "even pharmaceutical ✓"
  },
  "color_consistency": {
    "brand_blue": "#0066CC throughout ✓",
    "skin_tones": "matched across beats ✓",
    "environments": "distinct but cohesive ✓"
  }
}
```

## COMPLEXITY NOTES
```json
{
  "challenging_elements": {
    "intimate_scenes": "maintain taste and pharma aesthetic",
    "chart_overlays": "integrate naturally without overwhelming",
    "couple_chemistry": "authentic connection throughout"
  },
  "simplification_strategies": {
    "limit_locations": "apartment + pharma world only",
    "consistent_wardrobe": "no costume changes",
    "practical_effects": "in-camera where possible"
  }
}
```