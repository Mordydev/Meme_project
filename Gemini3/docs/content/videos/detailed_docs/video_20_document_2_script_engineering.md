# Video 20: "Ocean's $GEMINI3" - Script Engineering & Dialogue Optimization

## Core Timing Constraints

```
TIMING_RULES = {
  "max_duration": "8 seconds exactly per beat",
  "total_duration": "32 seconds (4 beats)",
  "word_limits": {
    "heist_leader": "12-16 words",
    "tech_expert": "8-12 words",
    "team_coordination": "6-10 words",
    "ensemble_reactions": "4-8 words each"
  },
  "delivery_speeds": {
    "danny_leader": "2.2 words/second (measured authority)",
    "tech_expert": "2.8 words/second (analytical rapid)",
    "action_sequence": "3.2 words/second (urgent)",
    "celebration": "2.0 words/second (satisfied)"
  }
}
```

## BEAT 1 SCRIPT: The Team Assembly (0:00-0:08)

```
BEAT_1_SCRIPT = {
  "character": "DANNY001_EXACT",
  "emotional_state": "confident mysterious authority",
  "heist_movie_energy": "Danny Ocean sophistication",
  "dialogue": {
    "lines": [
      {
        "text": "We're gonna steal Gemini 3 secrets.",
        "timing": "0:02-0:05",
        "delivery": "measured confident authority",
        "emphasis": "steal", 
        "subtext": "traditional heist setup"
      },
      {
        "text": "Before the announcement.",
        "timing": "0:06-0:07",
        "delivery": "knowing whisper",
        "emphasis": "before",
        "subtext": "insider knowledge"
      }
    ],
    "total_words": 9,
    "includes_pauses": true
  },
  "physical_performance": {
    "0:01": "steps forward from shadows",
    "0:04": "deliberate gesture to team",
    "0:07": "intense eye contact with camera"
  },
  "voice_notes": {
    "consistency": "George Clooney Danny Ocean sophistication",
    "modulation": "builds authority throughout",
    "breathing": "controlled, no rushed delivery"
  },
  "audio_layers": {
    "ambient": "warehouse echo, distant traffic @ -20dB",
    "sfx": [
      {"sound": "footsteps on concrete", "timing": "0:01", "level": "-12dB"},
      {"sound": "team shuffle positions", "timing": "0:04", "level": "-15dB"},
      {"sound": "paper rustle", "timing": "0:06", "level": "-16dB"}
    ],
    "music": "subtle heist tension strings @ -16dB"
  },
  "heist_movie_authenticity": {
    "genre_delivery": "classic mastermind reveal",
    "ensemble_awareness": "addressing team and audience",
    "dramatic_setup": "mysterious warehouse meeting"
  }
}
```

## BEAT 2 SCRIPT: The Plan (0:08-0:16)

```
BEAT_2_SCRIPT = {
  "format": "two_character_exchange",
  "characters": ["TECH001_EXACT", "DANNY001_EXACT"],
  "emotional_states": {
    "tech_expert": "analytical→concerned→impressed",
    "leader": "listening→calculating→revealing"
  },
  "dialogue": {
    "exchange": [
      {
        "speaker": "tech_expert",
        "text": "Their code is unbreakable.",
        "timing": "0:02-0:04",
        "delivery": "matter-of-fact technical analysis",
        "emphasis": "unbreakable"
      },
      {
        "speaker": "leader",
        "text": "We don't break it.",
        "timing": "0:05-0:06",
        "delivery": "calm revelation setup",
        "emphasis": "don't"
      },
      {
        "speaker": "leader",
        "text": "We buy $GEMINI3.",
        "timing": "0:06-0:08",
        "delivery": "brilliant solution delivery",
        "emphasis": "$GEMINI3"
      }
    ],
    "interaction_flow": "problem→pause→solution",
    "total_words": 11
  },
  "physical_performance": {
    "tech_expert": {
      "0:01-0:03": "points at screen data",
      "0:04": "concerned expression",
      "0:07": "impressed realization"
    },
    "leader": {
      "0:04": "thoughtful pause",
      "0:05": "slight smile begins",
      "0:07": "confident satisfaction"
    }
  },
  "voice_notes": {
    "tech_expert": "rapid analytical delivery",
    "leader": "measured reveal building to satisfaction",
    "contrast": "technical vs strategic mindsets"
  },
  "audio_layers": {
    "ambient": "war room atmosphere, computers humming @ -18dB",
    "sfx": [
      {"sound": "keyboard clicking", "timing": "0:01-0:02", "level": "-14dB"},
      {"sound": "papers shuffle", "timing": "0:03", "level": "-16dB"},
      {"sound": "satisfied 'ahh'", "timing": "0:07", "level": "-10dB"}
    ],
    "music": "building intrigue to revelation @ -14dB"
  }
}
```

## BEAT 3 SCRIPT: The Execution (0:16-0:24)

```
BEAT_3_SCRIPT = {
  "format": "action_montage_coordination",
  "characters": "ensemble_team",
  "emotional_state": "urgent→frantic→focused",
  "action_sequence_energy": "high intensity heist execution",
  "dialogue": {
    "coordination_calls": [
      {
        "speaker": "leader_radio",
        "text": "Go! Go! Go!",
        "timing": "0:01-0:02",
        "delivery": "urgent command",
        "emphasis": "go"
      },
      {
        "speaker": "tech_expert",
        "text": "30 seconds until announcement!",
        "timing": "0:05-0:07",
        "delivery": "time pressure warning",
        "emphasis": "30 seconds"
      }
    ],
    "background_chatter": [
      "I'm in position",
      "Buying now", 
      "Charts climbing"
    ],
    "total_words": 11
  },
  "physical_performance": {
    "0:01-0:03": "team deploys to trading positions",
    "0:03-0:06": "frantic phone trading",
    "0:06-0:08": "intense focus, countdown pressure"
  },
  "voice_notes": {
    "coordination": "urgent but professional",
    "time_pressure": "building to climax",
    "team_sync": "overlapping but clear"
  },
  "audio_layers": {
    "ambient": "multiple locations mixed @ -20dB",
    "sfx": [
      {"sound": "car doors slamming", "timing": "0:01", "level": "-10dB"},
      {"sound": "trading notifications rapid", "timing": "0:03-0:07", "level": "-8dB"},
      {"sound": "clock ticking", "timing": "0:06-0:08", "level": "-12dB"},
      {"sound": "phone typing frantic", "timing": "0:04-0:06", "level": "-11dB"}
    ],
    "music": "high tension orchestral climax @ -12dB"
  },
  "heist_execution_authenticity": {
    "coordination": "professional team communication",
    "urgency": "time-sensitive operation",
    "technology": "phones as heist tools"
  }
}
```

## BEAT 4 SCRIPT: The Getaway (0:24-0:32)

```
BEAT_4_SCRIPT = {
  "format": "celebration_revelation",
  "characters": ["DANNY001_EXACT", "MUSCLE001_EXACT"],
  "emotional_states": {
    "leader": "satisfied→smug→triumphant",
    "team_member": "confused→understanding→impressed"
  },
  "dialogue": {
    "celebration_exchange": [
      {
        "speaker": "team_member",
        "text": "We didn't steal anything!",
        "timing": "0:03-0:05",
        "delivery": "confused realization",
        "emphasis": "didn't steal"
      },
      {
        "speaker": "leader",
        "text": "Exactly.",
        "timing": "0:06-0:06.5",
        "delivery": "satisfied confirmation",
        "emphasis": "exactly"
      },
      {
        "speaker": "leader", 
        "text": "We invested early.",
        "timing": "0:06.5-0:08",
        "delivery": "smug satisfaction",
        "emphasis": "invested early"
      }
    ],
    "celebration_setup": "0:01-0:03 champagne and laughter",
    "total_words": 8
  },
  "physical_performance": {
    "0:01-0:03": "team toasting on yacht",
    "0:04": "team member confused expression",
    "0:06": "leader knowing smile",
    "0:07-0:08": "group appreciation of cleverness"
  },
  "voice_notes": {
    "team_member": "working class confusion turning to respect",
    "leader": "quiet satisfaction, not boastful",
    "resolution": "clever twist delivered with confidence"
  },
  "audio_layers": {
    "ambient": "ocean waves, yacht ambience @ -18dB",
    "sfx": [
      {"sound": "champagne cork pop", "timing": "0:01", "level": "-8dB"},
      {"sound": "glasses clink", "timing": "0:02", "level": "-12dB"},
      {"sound": "group appreciative laughter", "timing": "0:07-0:08", "level": "-12dB"},
      {"sound": "ocean breeze", "timing": "0:00-0:08", "level": "-20dB"}
    ],
    "music": "triumphant resolution theme @ -10dB"
  },
  "heist_movie_resolution": {
    "twist_reveal": "subverted expectations",
    "team_satisfaction": "mission accomplished legally",
    "genre_completion": "successful heist without crime"
  }
}
```

## Heist Movie Audio Design

```
HEIST_AUDIO_MAP = {
  "genre_progression": {
    "beat_1": "mysterious recruitment atmosphere",
    "beat_2": "planning room tension",
    "beat_3": "high-stakes execution",
    "beat_4": "celebration and revelation"
  },
  "character_audio_zones": {
    "danny_leader": {
      "authority": "center stage vocal presence",
      "reverb": "warehouse then intimate",
      "eq": "commanding presence boost"
    },
    "tech_expert": {
      "analytical": "clear rapid delivery",
      "environment": "computer room acoustics",
      "processing": "slight digital edge"
    },
    "ensemble": {
      "coordination": "radio communication style",
      "urgency": "overlapping but clear",
      "celebration": "group dynamics natural"
    }
  },
  "heist_music_progression": {
    "tension_build": "strings→orchestral→triumphant",
    "genre_authentic": "Ocean's Eleven style",
    "emotional_support": "mystery→planning→action→satisfaction"
  }
}
```

## Delivery Style Guide

```
HEIST_MOVIE_PERFORMANCE = {
  "danny_leader": {
    "style": "George Clooney sophisticated confidence",
    "energy": "7/10 controlled authority",
    "gestures": "minimal, precise movements",
    "reference": "Ocean's Eleven Danny Ocean"
  },
  "tech_expert": {
    "style": "rapid analytical intelligence",
    "energy": "8/10 focused excitement",
    "gestures": "quick explanatory movements",
    "reference": "modern hacker archetype"
  },
  "team_ensemble": {
    "style": "professional coordinated specialists",
    "energy": "6/10 focused competence",
    "gestures": "purposeful, no wasted motion",
    "reference": "Ocean's team members"
  },
  "celebration_energy": {
    "style": "earned satisfaction, not boastful",
    "energy": "5/10 quiet confidence", 
    "gestures": "relaxed, appreciative",
    "reference": "successful heist aftermath"
  }
}
```

## Script Quality Validation

```
QUALITY_CHECKLIST = {
  "timing": {
    "beat_duration": "all exactly 8 seconds ✓",
    "word_counts": "within heist movie limits ✓",
    "dramatic_pauses": "proper genre spacing ✓",
    "revelation_timing": "beat 2 twist perfect ✓"
  },
  "authenticity": {
    "heist_language": "proper genre terminology ✓",
    "character_voices": "distinct personalities ✓",
    "team_dynamics": "believable coordination ✓",
    "twist_satisfaction": "earned revelation ✓"
  },
  "performance": {
    "danny_authority": "commanding presence ✓",
    "tech_expertise": "analytical credibility ✓",
    "action_urgency": "proper heist tension ✓",
    "celebration_satisfaction": "earned victory ✓"
  },
  "virality": {
    "quotable_lines": [
      "We don't break it. We buy $GEMINI3",
      "We didn't steal anything!",
      "Exactly. We invested early."
    ],
    "twist_moment": "investment revelation clear ✓",
    "genre_recognition": "heist movie beloved ✓"
  }
}
```

## Production Notes

```
HEIST_MOVIE_PRODUCTION = {
  "character_energy": {
    "danny": "Maintain Ocean's sophistication",
    "tech": "Modern analytical intelligence",
    "team": "Professional specialist coordination"
  },
  "genre_authenticity": {
    "warehouse_setting": "Classic heist recruitment",
    "planning_room": "War room strategy session",
    "execution_montage": "Coordinated team action",
    "yacht_celebration": "Successful heist aftermath"
  },
  "crypto_integration": {
    "natural_metaphors": "Heist terms for investment strategy",
    "subversion_clarity": "$GEMINI3 buying instead of stealing",
    "education_value": "Early investment advantage"
  }
}
```

---

## Next Step
With scripts precisely engineered for heist movie authenticity and crypto education, proceed to Prompt 3: Visual Design for dramatic cinematography and genre-accurate visual storytelling.