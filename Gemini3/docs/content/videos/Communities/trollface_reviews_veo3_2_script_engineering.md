# Trollface Reviews Veo 3 - Script Engineering

## CORE TIMING CONSTRAINTS

```json
{
  "max_duration": "8 seconds exactly per beat",
  "word_limits": {
    "trollface_solo": "12-18 words",
    "with_pauses": "10-15 words",
    "with_sfx": "12-14 words total"
  },
  "delivery_speeds": {
    "fake_professional": "2.5 words/second",
    "excited_discovery": "3 words/second",
    "troll_laugh": "varied/exaggerated"
  }
}
```

## BEAT 1 SCRIPT: "Professional" Tech Review Setup

```json
{
  "character": "TROLL001_CLASSIC",
  "emotional_state": "fake professionalism→breaking character",
  "dialogue": {
    "lines": [
      {
        "text": "today we're reviewing veo 3",
        "timing": "0:01-0:02.5",
        "delivery": "overly serious tech voice",
        "emphasis": "veo 3"
      },
      {
        "text": "google's latest ai video tool that...",
        "timing": "0:02.5-0:05",
        "delivery": "professional trailing to suspicious",
        "emphasis": "that..."
      },
      {
        "text": "wait...",
        "timing": "0:05-0:06",
        "delivery": "realization dawning",
        "emphasis": "pause after"
      }
    ],
    "total_words": 14,
    "includes_pauses": true
  },
  "reactions": {
    "0:00-0:01": "adjust glasses professionally",
    "0:06-0:08": "grin starting to break through"
  },
  "voice_notes": {
    "consistency": "deep tech reviewer parody voice",
    "modulation": "breaks character at 'wait'",
    "breathing": "professional inhale at start"
  },
  "audio_layers": {
    "ambient": "tech studio ambience @ -20dB",
    "sfx": [
      {"sound": "glasses adjustment", "timing": "0:00.5", "level": "-12dB"},
      {"sound": "screen interface beep", "timing": "0:03", "level": "-14dB"},
      {"sound": "record scratch hint", "timing": "0:05.5", "level": "-16dB"}
    ],
    "music": "generic tech review bed @ -15dB, glitches at 0:06"
  },
  "screen_content": {
    "0:00-0:04": "Professional Veo 3 interface",
    "0:04-0:08": "Classic 'Problem?' meme fades in behind UI"
  }
}
```

## BEAT 2 SCRIPT: Making Veo 3 Generate Troll Content

```json
{
  "character": "TROLL001_CLASSIC",
  "emotional_state": "mischievous discovery→pure troll joy",
  "dialogue": {
    "lines": [
      {
        "text": "let's test it!",
        "timing": "0:00-0:01",
        "delivery": "excited anticipation",
        "emphasis": "test"
      },
      {
        "text": "make rickroll but it's ai teaching quantum physics",
        "timing": "0:01-0:04",
        "delivery": "rapid typing narration, building excitement",
        "emphasis": "rickroll, quantum physics"
      },
      {
        "text": "yesss!",
        "timing": "0:06-0:07",
        "delivery": "triumphant troll victory",
        "emphasis": "extended s sound"
      }
    ],
    "total_words": 12,
    "includes_pauses": false
  },
  "reactions": {
    "0:00-0:01": "lean forward eagerly",
    "0:04-0:06": "watch screen with growing grin",
    "0:07-0:08": "full trollface achieved"
  },
  "voice_notes": {
    "consistency": "voice becomes more troll-like",
    "modulation": "excitement building throughout",
    "special": "classic troll chuckle under 'yesss'"
  },
  "audio_layers": {
    "ambient": "computer hum @ -20dB",
    "sfx": [
      {"sound": "rapid keyboard typing", "timing": "0:01-0:03", "level": "-8dB"},
      {"sound": "AI generation whoosh", "timing": "0:03.5", "level": "-6dB"},
      {"sound": "multiple meme sounds layered", "timing": "0:04-0:06", "level": "-10dB"},
      {"sound": "achievement ding", "timing": "0:06", "level": "-8dB"}
    ],
    "music": "building electronic tension @ -12dB, drops to troll theme hints"
  },
  "screen_content": {
    "0:00-0:03": "Typing prompt in Veo 3",
    "0:04-0:08": "AI-generated animations appear: Rickroll professor, Forever Alone in lab coat, Y U NO understand physics"
  }
}
```

## BEAT 3 SCRIPT: The Meta Reveal & Rating

```json
{
  "character": "TROLL001_CLASSIC",
  "emotional_state": "peak trolling→meta satisfaction",
  "dialogue": {
    "lines": [
      {
        "text": "plot twist:",
        "timing": "0:00-0:01",
        "delivery": "dramatic pause setup",
        "emphasis": "twist"
      },
      {
        "text": "this entire review?",
        "timing": "0:01-0:02.5",
        "delivery": "building suspense",
        "emphasis": "entire"
      },
      {
        "text": "made with veo 3!",
        "timing": "0:02.5-0:04",
        "delivery": "revelation drop",
        "emphasis": "veo 3"
      },
      {
        "text": "trollolololol!",
        "timing": "0:04.5-0:06.5",
        "delivery": "classic troll song reference",
        "emphasis": "rhythmic troll laugh"
      }
    ],
    "total_words": 10,
    "includes_pauses": true
  },
  "reactions": {
    "0:00-0:01": "stand up dramatically",
    "0:02-0:04": "gesture at dissolving studio",
    "0:04-0:04.5": "hold up infinity/10 score",
    "0:06.5-0:08": "freeze on classic trollface closeup"
  },
  "voice_notes": {
    "consistency": "full troll voice emergence",
    "modulation": "dramatic to triumphant",
    "special": "trollolol sung in classic style"
  },
  "audio_layers": {
    "ambient": "reality glitch static @ -15dB",
    "sfx": [
      {"sound": "reality tear/glitch", "timing": "0:01", "level": "-6dB"},
      {"sound": "studio dissolve whoosh", "timing": "0:02-0:04", "level": "-8dB"},
      {"sound": "scoreboard slam", "timing": "0:04", "level": "-8dB"},
      {"sound": "meme compilation sounds", "timing": "0:05-0:08", "level": "-12dB"}
    ],
    "music": "epic reveal sting → troll song motif @ -10dB"
  },
  "screen_content": {
    "0:00-0:04": "Studio starts glitching and dissolving",
    "0:04": "∞/10 TROLLS rating appears",
    "0:05-0:08": "Classic memes float by: Nyan Cat, Doge saying 'such AI', Bad Luck Brian"
  }
}
```

## AUDIO DESIGN SPECIFICATIONS

```json
{
  "dialogue_track": {
    "processing": {
      "eq": "tech reviewer preset with troll characteristics emerging",
      "compression": "3:1 ratio, -10dB threshold",
      "effects": "slight vocoder on 'trollolol'"
    },
    "level": "-6dB peak",
    "panning": "center with slight movement on reveals"
  },
  "ambient_track": {
    "beat_1": "clean tech studio → glitch hints",
    "beat_2": "computer lab → meme chaos building",
    "beat_3": "reality breakdown → digital void"
  },
  "sfx_design": {
    "meme_integration": "classic meme sounds woven throughout",
    "tech_sounds": "UI bleeps and digital feedback",
    "troll_signature": "subtle troll song hints building"
  },
  "music_track": {
    "progression": "tech review generic → electronic tension → troll anthem",
    "key_moments": "stings on reveals and meme appearances",
    "final_loop": "ends on troll song hook for shareability"
  }
}
```

## AUTHENTICITY MARKERS

```json
{
  "character_consistency": {
    "voice_evolution": "professional → suspicious → full troll",
    "speech_patterns": "tech jargon → meme speak",
    "troll_signatures": ["problem?", "u mad?", "trollolol"]
  },
  "natural_moments": {
    "beat_1": "clearing throat, adjusting glasses",
    "beat_2": "excited typing sounds, triumph",
    "beat_3": "dramatic pause timing"
  },
  "meme_accuracy": {
    "references": "use exact classic meme formats",
    "timing": "respect original meme cadences",
    "visuals": "authentic meme aesthetics"
  }
}
```

## VIRAL OPTIMIZATION

```json
{
  "quotable_lines": [
    "made with veo 3!",
    "trollolololol!",
    "∞/10 trolls"
  ],
  "shareable_moments": {
    "0:14": "AI creating classic memes",
    "0:20": "meta reveal of AI-generated review",
    "0:23": "infinity trolls rating"
  },
  "loop_points": {
    "start": "professional tech reviewer",
    "end": "trollface closeup",
    "connection": "seamless character transformation loop"
  }
}
```

## PERFORMANCE NOTES

```json
{
  "beat_1": {
    "energy": "3→6 (controlled to breaking)",
    "focal_point": "camera then screen",
    "physical": "stiff professional to loosening up"
  },
  "beat_2": {
    "energy": "6→9 (discovery excitement)",
    "focal_point": "screen with glances to camera",
    "physical": "animated typing and reactions"
  },
  "beat_3": {
    "energy": "9→10 (full troll mode)",
    "focal_point": "direct to camera",
    "physical": "grand gestures, classic pose"
  }
}
```

## FINAL SCRIPT VALIDATION

```json
{
  "timing_check": {
    "beat_1": "14 words / 8 seconds ✓",
    "beat_2": "12 words / 8 seconds ✓",
    "beat_3": "10 words / 8 seconds ✓",
    "total": "36 words / 24 seconds ✓"
  },
  "meme_integration": {
    "visual_memes": "8+ classic memes featured ✓",
    "audio_references": "troll song, meme sounds ✓",
    "meta_humor": "AI reviewing AI tool ✓"
  },
  "character_arc": {
    "start": "fake professional ✓",
    "middle": "mischievous discovery ✓",
    "end": "full troll triumph ✓"
  },
  "shareability": {
    "hook": "trollface as tech reviewer ✓",
    "climax": "meta AI reveal ✓",
    "ending": "iconic meme moment ✓"
  }
}