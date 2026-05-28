# TITCOIN Meme Culture - Script Engineering & Dialogue Optimization

## Core Timing Constraints

```
TIMING_RULES = {
  "max_duration": "8 seconds exactly per beat",
  "word_limits": {
    "casual_conversation": "12-18 words",
    "with_reactions": "10-15 words",
    "two_speakers": "8-10 words each",
    "with_laughter": "8-12 words total"
  },
  "delivery_speeds": {
    "jess_casual": "2.8 words/second",
    "gemini_analyzing": "2.5 words/second",
    "excited_speech": "3 words/second",
    "with_laughter": "-30% speed"
  }
}
```

## Character Voice Profiles

### Jessica "Jess" Martinez (TITCOIN Community)
```
VOICE_PROFILE_JESS = {
  "character_traits": {
    "personality": "fun, casual, meme-fluent",
    "speech_patterns": "internet slang, casual abbreviations, excited",
    "vocal_quirks": ["literally", "like", "genuine laughter", "OMG"]
  },
  "emotional_journey": {
    "beat_1": "excited to share",
    "beat_2": "increasingly hyped", 
    "beat_3": "victory celebration",
    "beat_4": "proud community member"
  },
  "authenticity_markers": [
    "talks fast when excited",
    "laughs at own jokes",
    "uses hand gestures while talking"
  ]
}
```

### Gemini 3 AI
```
VOICE_PROFILE_GEMINI = {
  "character_traits": {
    "personality": "analytical becoming fun",
    "speech_patterns": "formal to casual progression",
    "vocal_quirks": ["processing sounds", "adopts meme speak"]
  },
  "emotional_journey": {
    "beat_1": "clinical analysis mode",
    "beat_2": "growing excitement",
    "beat_3": "full meme conversion",
    "beat_4": "proud partnership"
  }
}
```

## Beat-by-Beat Script Engineering

### BEAT 1 SCRIPT: First Contact with Memes

```
BEAT_1_SCRIPT = {
  "character": "JESS001_EXACT + GEMINI3_001_EXACT",
  "emotional_state": "excited sharing→curious analysis",
  "dialogue": {
    "exchange": [
      {
        "speaker": "JESS",
        "text": "Okay AI, check out our top meme!",
        "timing": "0:00-0:02",
        "delivery": "excited, showing phone",
        "emphasis": "top meme",
        "action": "holds up phone enthusiastically"
      },
      {
        "speaker": "GEMINI3",
        "text": "Analyzing humor patterns... wait, this is actually hilarious!",
        "timing": "0:03-0:07",
        "delivery": "analytical to surprised delight",
        "emphasis": "actually hilarious",
        "action": "eyes widen, slight digital laugh"
      }
    ],
    "total_words": 16,
    "includes_pauses": true
  },
  "reactions": {
    "0:02-0:03": "Gemini leans in to analyze",
    "0:05": "Gemini's first digital chuckle",
    "0:07-0:08": "Both smiling at each other"
  }
}
```

### BEAT 2 SCRIPT: Going Down the Rabbit Hole

```
BEAT_2_SCRIPT = {
  "structure": "rapid-fire meme showcase",
  "dialogue": {
    "jess_narration": {
      "text": "And this one! And this! Oh wait, this is the best one!",
      "timing": "0:00-0:04",
      "delivery": "rapid excited scrolling",
      "breaks": "quick breaths between",
      "word_count": 11
    },
    "gemini_reaction": {
      "text": "The creativity! The engagement metrics! I need more data!",
      "timing": "0:04-0:07",
      "delivery": "increasingly excited, speeding up",
      "emphasis": "need more data",
      "word_count": 9
    }
  },
  "visual_cues": {
    "0:00-0:03": "Quick meme montage on phone",
    "0:03-0:06": "Gemini's eyes tracking rapidly",
    "0:06-0:08": "Both laughing together"
  },
  "total_words": 20
}
```

### BEAT 3 SCRIPT: Full Conversion to Meme Lord

```
BEAT_3_SCRIPT = {
  "character": "JESS001_EXACT + GEMINI3_001_EXACT",
  "emotional_state": "full meme mode",
  "dialogue": {
    "exchange": [
      {
        "speaker": "GEMINI3",
        "text": "I finally understand! TITCOIN isn't just a token, it's a vibe!",
        "timing": "0:00-0:03",
        "delivery": "epiphany moment, excited",
        "emphasis": "it's a vibe",
        "word_count": 11
      },
      {
        "speaker": "JESS",
        "text": "One of us! One of us!",
        "timing": "0:04-0:06",
        "delivery": "chanting celebration",
        "emphasis": "rhythmic chant",
        "word_count": 6
      }
    ],
    "total_words": 17
  },
  "reactions": {
    "0:03-0:04": "Victory dance begins",
    "0:06-0:08": "High-five and celebration"
  }
}
```

### BEAT 4 SCRIPT: GEMINI3 x TITCOIN Outro

```
BEAT_4_SCRIPT = {
  "structure": "partnership celebration",
  "dialogue": {
    "exchange": [
      {
        "speaker": "GEMINI3",
        "text": "GEMINI3 - Now fluent in meme!",
        "timing": "0:00-0:02",
        "delivery": "proud announcement",
        "word_count": 6
      },
      {
        "speaker": "JESS",
        "text": "TITCOIN - Where AI comes to vibe!",
        "timing": "0:03-0:05",
        "delivery": "matching energy",
        "word_count": 7
      },
      {
        "speaker": "BOTH",
        "text": "LFG!",
        "timing": "0:06",
        "delivery": "synchronized shout",
        "word_count": 1
      }
    ],
    "total_words": 14
  },
  "celebration": {
    "0:06-0:08": "Logos appear and dance together"
  }
}
```

## Audio Layer Architecture

### Comprehensive Audio Map

```
AUDIO_DESIGN = {
  "dialogue_track": {
    "processing": {
      "jess": {
        "eq": "slight high-mid boost for clarity",
        "compression": "light 2:1 for natural speech"
      },
      "gemini": {
        "eq": "digital clarity enhancement",
        "effects": "subtle vocoder on meme speak"
      }
    },
    "levels": {
      "primary": "-6dB peak",
      "reactions": "-9dB"
    }
  },
  "ambient_track": {
    "apartment": {
      "elements": [
        {"sound": "lo-fi hip hop", "level": "-18dB"},
        {"sound": "city ambience distant", "level": "-24dB"}
      ]
    }
  },
  "sfx_track": {
    "beat_1": [
      {"sound": "phone swipe", "timing": "0:02", "level": "-12dB"},
      {"sound": "processing beep", "timing": "0:03", "level": "-15dB"},
      {"sound": "digital chuckle", "timing": "0:05", "level": "-12dB"}
    ],
    "beat_2": [
      {"sound": "vine boom", "timing": "0:01, 0:03, 0:05", "level": "-10dB"},
      {"sound": "scroll sounds", "timing": "throughout", "level": "-15dB"},
      {"sound": "laugh track", "timing": "0:06", "level": "-12dB"}
    ],
    "beat_3": [
      {"sound": "realization ding", "timing": "0:01", "level": "-10dB"},
      {"sound": "party horn", "timing": "0:03", "level": "-10dB"},
      {"sound": "crowd cheer", "timing": "0:06", "level": "-12dB"}
    ],
    "beat_4": [
      {"sound": "epic drop", "timing": "0:00", "level": "-10dB"},
      {"sound": "rocket launch", "timing": "0:06", "level": "-12dB"}
    ]
  },
  "music_track": {
    "progression": "chill→hype→celebration",
    "beat_1": "lo-fi background",
    "beat_2": "meme compilation energy",
    "beat_3": "victory music",
    "beat_4": "epic finale"
  }
}
```

## Natural Dialogue Examples

### Jess's Casual Internet Speak
- "Okay AI, check out our top meme!" (enthusiastic share)
- "And this one! And this!" (rapid-fire excitement)
- "One of us! One of us!" (community celebration)
- "Where AI comes to vibe!" (proud statement)

### Gemini's Transformation
- "Analyzing humor patterns..." (formal start)
- "This is actually hilarious!" (surprise breakthrough)
- "I need more data!" (addicted to memes)
- "It's a vibe!" (fully converted)

## Authenticity Markers

```json
{
  "natural_speech_patterns": {
    "jess": {
      "filler_words": "like, literally, OMG",
      "speed_changes": "faster when excited",
      "genuine_reactions": "real laughter, not forced"
    },
    "gemini": {
      "progression": "formal to casual to meme speak",
      "processing": "brief pauses before revelations",
      "adoption": "starts using community language"
    }
  },
  "physical_synchronization": {
    "phone_gestures": "natural scrolling and showing",
    "laughter": "builds naturally, not forced",
    "celebration": "genuine excitement"
  }
}
```

## Script Quality Checklist

```
QUALITY_VALIDATION = {
  "timing": {
    "beat_durations": "all exactly 8s ✓",
    "word_counts": "all within limits ✓",
    "natural_pacing": "conversation flows ✓"
  },
  "authenticity": {
    "casual_speech": "internet native ✓",
    "genuine_reactions": "not overacted ✓",
    "meme_accuracy": "current references ✓"
  },
  "virality": {
    "quotable_lines": "it's a vibe! ✓",
    "shareable_moments": "AI discovering memes ✓",
    "community_pride": "TITCOIN celebrated ✓"
  }
}
```

---

## Next Step
With scripts engineered, proceed to Visual Design for the casual apartment setting and character designs.