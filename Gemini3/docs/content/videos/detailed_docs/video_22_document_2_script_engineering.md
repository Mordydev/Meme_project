# Video 22: "Who Wants to Be a Gemini3-ionaire?" - Script Engineering & Dialogue Optimization

## Core Timing Constraints

```
TIMING_RULES = {
  "max_duration": "8 seconds exactly per beat",
  "total_duration": "40 seconds (5 beats)",
  "word_limits": {
    "game_show_host": "12-18 words",
    "contestant_responses": "6-12 words",
    "phone_friend": "8-14 words",
    "celebration_dialogue": "10-16 words"
  },
  "delivery_speeds": {
    "tv_host": "2.4 words/second (professional broadcaster)",
    "nervous_contestant": "2.8 words/second (anxious energy)",
    "confident_friend": "3.0 words/second (rapid expertise)",
    "celebration": "2.2 words/second (euphoric excitement)"
  }
}
```

## BEAT 1 SCRIPT: The Million Dollar Question (0:00-0:08)

```
BEAT_1_SCRIPT = {
  "character": "HOST001_EXACT",
  "emotional_state": "professional dramatic game show energy",
  "tv_presenter_energy": "millionaire host authority",
  "dialogue": {
    "lines": [
      {
        "text": "For one million dollars...",
        "timing": "0:02-0:04",
        "delivery": "dramatic pause-filled buildup",
        "emphasis": "one million dollars",
        "subtext": "maximum stakes establishment"
      },
      {
        "text": "What's Google's next breakthrough?",
        "timing": "0:05-0:07",
        "delivery": "clear authoritative question",
        "emphasis": "Google's next breakthrough",
        "subtext": "tech industry knowledge test"
      }
    ],
    "total_words": 9,
    "includes_pauses": true
  },
  "physical_performance": {
    "0:01": "confident game show host stance",
    "0:04": "dramatic gesture toward contestant",
    "0:07": "expectant pause for response"
  },
  "voice_notes": {
    "consistency": "professional TV broadcaster authority",
    "modulation": "builds dramatic tension throughout",
    "breathing": "controlled professional pauses"
  },
  "audio_layers": {
    "ambient": "game show studio atmosphere @ -20dB",
    "sfx": [
      {"sound": "dramatic sting", "timing": "0:02", "level": "-10dB"},
      {"sound": "tension music build", "timing": "0:04-0:08", "level": "-14dB"},
      {"sound": "studio audience anticipation", "timing": "0:06-0:08", "level": "-16dB"}
    ],
    "music": "game show tension theme @ -16dB"
  },
  "game_show_authenticity": {
    "format_establishment": "classic millionaire question setup",
    "dramatic_timing": "professional TV tension building",
    "stakes_clarity": "million dollar importance clear"
  }
}
```

## BEAT 2 SCRIPT: The Options (0:08-0:16)

```
BEAT_2_SCRIPT = {
  "format": "host_presenting_contestant_reacting",
  "characters": ["HOST001_EXACT", "CONTESTANT001_EXACT"],
  "emotional_states": {
    "host": "professional option presentation",
    "contestant": "analytical→nervous→overwhelmed"
  },
  "dialogue": {
    "host_options": [
      {
        "text": "A) GPT-6, B) Claude 4,",
        "timing": "0:01-0:03",
        "delivery": "clear professional presentation",
        "emphasis": "A) GPT-6, B) Claude 4"
      },
      {
        "text": "C) Gemini 3, D) Grok 2",
        "timing": "0:04-0:06",
        "delivery": "continued professional delivery",
        "emphasis": "C) Gemini 3, D) Grok 2"
      }
    ],
    "contestant_response": {
      "text": "I need help!",
      "timing": "0:06-0:07",
      "delivery": "nervous decision stress",
      "emphasis": "need help"
    },
    "total_words": 14
  },
  "physical_performance": {
    "host": {
      "0:01-0:03": "professional option presentation gestures",
      "0:04-0:06": "continued clear delivery",
      "0:07": "understanding contestant stress"
    },
    "contestant": {
      "0:01-0:05": "visible thinking and analysis",
      "0:06": "stress realization",
      "0:07": "help request desperation"
    }
  },
  "voice_notes": {
    "host": "maintained professional broadcaster tone",
    "contestant": "building nervous energy to help request",
    "option_clarity": "each choice clearly enunciated"
  },
  "audio_layers": {
    "ambient": "studio atmosphere with thinking tension @ -18dB",
    "sfx": [
      {"sound": "option reveal chimes", "timing": "0:01, 0:04", "level": "-12dB"},
      {"sound": "contestant thinking stress", "timing": "0:05-0:06", "level": "-14dB"},
      {"sound": "help request emphasis", "timing": "0:07", "level": "-10dB"}
    ],
    "music": "decision pressure building @ -15dB"
  },
  "crypto_education_integration": {
    "option_variety": "legitimate AI technology choices",
    "gemini3_positioning": "placed as option C among real competitors",
    "decision_pressure": "creates need for expert consultation"
  }
}
```

## BEAT 3 SCRIPT: Phone a Friend (0:16-0:24)

```
BEAT_3_SCRIPT = {
  "format": "lifeline_expert_consultation",
  "characters": ["CONTESTANT001_EXACT", "FRIEND001_EXACT"],
  "emotional_states": {
    "contestant": "nervous→hopeful→confident",
    "friend": "immediate confidence and expertise"
  },
  "dialogue": {
    "phone_setup": {
      "contestant": "I'm calling my crypto expert friend",
      "timing": "0:01-0:02",
      "delivery": "hopeful lifeline activation"
    },
    "expert_advice": {
      "friend": {
        "text": "C! Gemini 3! Buy $GEMINI3! Trust me!",
        "timing": "0:03-0:07",
        "delivery": "immediate confident crypto expertise",
        "emphasis": "C! Gemini 3! Trust me!",
        "phone_processing": "clear but slightly phone-filtered"
      }
    },
    "total_words": 12
  },
  "physical_performance": {
    "contestant": {
      "0:01-0:02": "lifeline activation with hope",
      "0:03-0:06": "listening intently to expert advice",
      "0:07-0:08": "growing confidence from expert validation"
    }
  },
  "voice_notes": {
    "contestant": "nervous hope transitioning to confidence",
    "friend": "immediate authority and crypto expertise",
    "phone_effect": "clear communication with slight phone processing"
  },
  "audio_layers": {
    "ambient": "studio with phone connection atmosphere @ -18dB",
    "sfx": [
      {"sound": "phone dial and connection", "timing": "0:01-0:02", "level": "-12dB"},
      {"sound": "friend voice phone processing", "timing": "0:03-0:07", "level": "-6dB"},
      {"sound": "contestant confidence building", "timing": "0:07-0:08", "level": "-13dB"}
    ],
    "music": "expert advice confidence theme @ -14dB"
  },
  "crypto_expertise_moment": {
    "immediate_confidence": "friend knows answer instantly",
    "investment_advice": "buy $GEMINI3 integrated naturally",
    "trust_building": "expert validation provides confidence"
  }
}
```

## BEAT 4 SCRIPT: The Decision (0:24-0:32)

```
BEAT_4_SCRIPT = {
  "format": "final_answer_dramatic_tension",
  "characters": ["CONTESTANT001_EXACT", "HOST001_EXACT"],
  "emotional_states": {
    "contestant": "confident decision→anticipation",
    "host": "professional tension building→dramatic pause"
  },
  "dialogue": {
    "final_answer": {
      "contestant": {
        "text": "Final answer... C!",
        "timing": "0:02-0:04",
        "delivery": "confident decision with slight anticipation",
        "emphasis": "Final answer... C!"
      }
    },
    "dramatic_buildup": {
      "host": {
        "text": "You're absolutely...",
        "timing": "0:06-0:07",
        "delivery": "maximum dramatic pause tension",
        "emphasis": "absolutely",
        "subtext": "revelation building to explosive climax"
      }
    },
    "total_words": 6
  },
  "physical_performance": {
    "contestant": {
      "0:01-0:04": "confident final answer delivery",
      "0:05-0:08": "anticipation and nervous excitement"
    },
    "host": {
      "0:04-0:05": "dramatic pause setup",
      "0:06-0:07": "maximum tension building",
      "0:08": "preparation for revelation explosion"
    }
  },
  "voice_notes": {
    "contestant": "confident but anticipatory final answer",
    "host": "professional dramatic pause mastery",
    "tension_maximization": "classic game show suspense"
  },
  "audio_layers": {
    "ambient": "studio tension at maximum @ -20dB",
    "sfx": [
      {"sound": "final answer lock-in", "timing": "0:04", "level": "-8dB"},
      {"sound": "dramatic pause heartbeat", "timing": "0:05-0:07", "level": "-11dB"},
      {"sound": "revelation building sting", "timing": "0:07-0:08", "level": "-9dB"}
    ],
    "music": "maximum tension crescendo @ -13dB"
  },
  "game_show_climax": {
    "final_answer_confidence": "contestant commits with expert backing",
    "dramatic_pause_mastery": "classic TV tension building",
    "revelation_setup": "perfect setup for explosive celebration"
  }
}
```

## BEAT 5 SCRIPT: Victory Celebration (0:32-0:40)

```
BEAT_5_SCRIPT = {
  "format": "explosive_game_show_victory",
  "characters": ["HOST001_EXACT", "CONTESTANT001_EXACT", "AUDIENCE001_EXACT"],
  "emotional_states": {
    "host": "explosive professional excitement",
    "contestant": "euphoric million dollar winner",
    "audience": "celebration explosion"
  },
  "dialogue": {
    "victory_announcement": {
      "host": {
        "text": "CORRECT!",
        "timing": "0:01-0:02",
        "delivery": "explosive game show excitement",
        "emphasis": "CORRECT!",
        "volume": "maximum celebration energy"
      }
    },
    "investment_declaration": {
      "contestant": {
        "text": "I'm buying $GEMINI3 with the winnings!",
        "timing": "0:05-0:08",
        "delivery": "euphoric victory declaration",
        "emphasis": "buying $GEMINI3",
        "subtext": "immediate investment action"
      }
    },
    "audience_celebration": {
      "crowd": "Cheering, applause, celebration sounds",
      "timing": "0:03-0:08",
      "energy": "game show victory explosion"
    },
    "total_words": 8
  },
  "physical_performance": {
    "host": {
      "0:01-0:02": "explosive victory announcement",
      "0:03-0:08": "professional celebration facilitation"
    },
    "contestant": {
      "0:01-0:04": "shock and euphoric realization",
      "0:05-0:08": "confident investment declaration"
    },
    "audience": {
      "0:02-0:08": "full celebration explosion"
    }
  },
  "voice_notes": {
    "host": "explosive professional game show excitement",
    "contestant": "genuine euphoric million dollar winner",
    "celebration_authenticity": "real game show victory energy"
  },
  "audio_layers": {
    "ambient": "full studio celebration explosion @ -15dB",
    "sfx": [
      {"sound": "confetti cannons", "timing": "0:02", "level": "-6dB"},
      {"sound": "audience cheering explosion", "timing": "0:03-0:08", "level": "-10dB"},
      {"sound": "victory fanfare", "timing": "0:01-0:08", "level": "-8dB"},
      {"sound": "celebration bells", "timing": "0:04-0:08", "level": "-12dB"}
    ],
    "music": "game show victory theme maximum @ -10dB"
  },
  "crypto_investment_integration": {
    "immediate_action": "winnings directly to $GEMINI3 investment",
    "celebration_context": "investment as natural victory response",
    "audience_validation": "crowd celebrates investment decision"
  }
}
```

## Game Show Audio Design

```
GAME_SHOW_AUDIO_MAP = {
  "show_progression": {
    "beat_1": "dramatic million dollar question buildup",
    "beat_2": "decision pressure and option presentation",
    "beat_3": "expert consultation confidence",
    "beat_4": "maximum dramatic pause tension",
    "beat_5": "explosive celebration victory"
  },
  "character_audio_zones": {
    "host": {
      "authority": "professional broadcaster presence",
      "reverb": "studio acoustic space",
      "eq": "TV presenter clarity and warmth"
    },
    "contestant": {
      "progression": "nervous to confident to euphoric",
      "intimacy": "personal stakes and emotions",
      "clarity": "decision process audible"
    },
    "phone_friend": {
      "expertise": "immediate confident knowledge",
      "processing": "phone connection authenticity",
      "authority": "crypto expert credibility"
    }
  },
  "game_show_music": {
    "tension_building": "classic dramatic crescendo",
    "decision_pressure": "analytical thinking support",
    "expert_confidence": "validation and support",
    "dramatic_pause": "maximum suspense hold",
    "victory_explosion": "celebration fanfare climax"
  }
}
```

## Delivery Style Guide

```
GAME_SHOW_PERFORMANCE = {
  "tv_host": {
    "style": "professional broadcaster with dramatic flair",
    "energy": "8/10 controlled excitement",
    "gestures": "confident TV presenter movements",
    "reference": "Regis Philbin millionaire host energy"
  },
  "nervous_contestant": {
    "style": "intelligent but pressure-affected",
    "energy": "7/10 nervous excitement building",
    "gestures": "thoughtful but increasingly stressed",
    "reference": "typical game show contestant under pressure"
  },
  "crypto_expert_friend": {
    "style": "immediate confident expertise",
    "energy": "9/10 rapid confident knowledge",
    "delivery": "no hesitation, complete certainty",
    "reference": "subject matter expert consultation"
  },
  "celebration_energy": {
    "style": "genuine euphoric million dollar winner",
    "energy": "10/10 explosive joy",
    "gestures": "uncontained celebration",
    "reference": "actual game show winner reactions"
  }
}
```

## Script Quality Validation

```
QUALITY_CHECKLIST = {
  "timing": {
    "beat_duration": "all exactly 8 seconds ✓",
    "word_counts": "within game show limits ✓",
    "dramatic_pauses": "proper TV tension spacing ✓",
    "celebration_timing": "explosive victory moment ✓"
  },
  "authenticity": {
    "game_show_language": "proper TV format terminology ✓",
    "host_professionalism": "broadcaster authority ✓",
    "contestant_realism": "believable pressure responses ✓",
    "victory_satisfaction": "earned celebration ✓"
  },
  "performance": {
    "host_authority": "TV presenter confidence ✓",
    "contestant_journey": "nervous to confident to euphoric ✓",
    "expert_credibility": "crypto knowledge authority ✓",
    "celebration_explosion": "genuine victory energy ✓"
  },
  "virality": {
    "quotable_lines": [
      "For one million dollars...",
      "C! Gemini 3! Buy $GEMINI3! Trust me!",
      "Final answer... C!",
      "CORRECT!",
      "I'm buying $GEMINI3 with the winnings!"
    ],
    "format_recognition": "millionaire show beloved ✓",
    "decision_relatability": "investment pressure universal ✓"
  }
}
```

## Educational Integration Notes

```
CRYPTO_EDUCATION_SEAMLESS = {
  "natural_terminology": {
    "expert_consultation": "phone friend as crypto authority",
    "investment_decision": "multiple choice as strategy options",
    "immediate_action": "winnings to $GEMINI3 purchase",
    "crowd_validation": "audience celebrates smart investment"
  },
  "decision_framework": {
    "research_phase": "considering multiple AI options",
    "expert_consultation": "seeking knowledgeable advice",
    "confident_decision": "expert validation provides certainty",
    "immediate_action": "turning knowledge into investment"
  },
  "audience_takeaway": {
    "expert_consensus": "crypto expert immediately chooses Gemini 3",
    "investment_action": "winnings immediately go to $GEMINI3",
    "celebration_validation": "smart investment choice celebrated"
  }
}
```

## Production Notes

```
GAME_SHOW_PRODUCTION = {
  "character_energy": {
    "host": "Maintain professional broadcaster authority throughout",
    "contestant": "Nervous intelligence building to euphoria",
    "friend": "Immediate crypto expertise confidence"
  },
  "format_authenticity": {
    "studio_setting": "Professional game show production",
    "dramatic_timing": "Classic TV tension and release",
    "celebration_scale": "Full game show victory treatment"
  },
  "crypto_integration": {
    "natural_context": "AI technology as legitimate game show topic",
    "expert_validation": "Crypto friend provides credible advice",
    "investment_education": "Immediate action on expert recommendation"
  }
}
```

---

## Next Step
With scripts precisely engineered for game show authenticity and crypto education, proceed to Prompt 3: Visual Design for professional TV studio cinematography and dramatic game show visualization.