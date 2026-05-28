# YOLO Mode Decision Matrix

## Automated Decision Rules for Complete Production Pipeline

### Content Type Selection

```yaml
content_type_rules:
  product_brand_detected:
    indicators: ["product", "brand", "logo", "company", "service"]
    selection: "transformation"
    subtype: "logo_to_product"
    keywords: ["premium aesthetic", "fluid assembly", "elegant motion", "soft lighting"]
    
  story_narrative_detected:
    indicators: ["story", "character", "person", "happening", "discover"]
    selection: "character"
    subtype: "continuous_story"
    keywords: ["authentic", "emotional journey", "character focus", "relatable"]
    
  multiple_perspectives_detected:
    indicators: ["everyone", "people", "various", "different", "compilation"]
    selection: "compilation"
    subtype: "multi_scene"
    keywords: ["dynamic", "variety", "multiple perspectives", "diverse"]
    
  visual_concept_detected:
    indicators: ["transform", "morph", "change", "become", "particle"]
    selection: "transformation"
    subtype: "environment_morph"
    keywords: ["visual spectacle", "transformation", "magical", "physics"]
    
  default:
    selection: "character"
    subtype: "continuous_story"
    keywords: ["universal appeal", "emotional", "shareable"]
```

### Platform Optimization

```yaml
platform_decisions:
  youtube:
    hook_timing: 2.0
    thumbnail_beat: 2
    thumbnail_time: "0:02"
    variation: "hero_balanced"
    energy_curve: [5, 6, 7]
    keywords_add: ["cinematic", "complete story"]
    
  tiktok:
    hook_timing: 1.5
    loop_design: true
    variation: "high_energy"
    energy_curve: [7, 8, 9]
    keywords_add: ["viral", "trending", "dynamic"]
    
  instagram:
    hook_timing: 1.0
    aesthetic_priority: true
    variation: "visual_focus"
    energy_curve: [6, 7, 6]
    keywords_add: ["aesthetic", "beautiful", "shareable"]
    
  linkedin:
    hook_timing: 2.5
    professional: true
    variation: "value_driven"
    energy_curve: [4, 5, 6]
    keywords_add: ["professional", "insightful", "valuable"]
    
  default:
    platform: "youtube"
```

### Character Generation

```yaml
character_templates:
  young_professional:
    age: 28
    gender_options: ["male", "female"]
    appearance: "professional casual, neat appearance, friendly demeanor"
    voice: "confident, articulate, warm"
    
  everyday_person:
    age: 35
    gender_options: ["male", "female"]
    appearance: "casual comfortable clothing, relatable look, genuine smile"
    voice: "natural, conversational, authentic"
    
  energetic_youth:
    age: 22
    gender_options: ["male", "female"]
    appearance: "trendy casual wear, expressive face, dynamic presence"
    voice: "enthusiastic, quick-paced, excited"
    
  wise_expert:
    age: 45
    gender_options: ["male", "female"]
    appearance: "smart casual, glasses optional, thoughtful expression"
    voice: "measured, authoritative, warm"
```

### Camera Decisions

```yaml
camera_patterns:
  transformation:
    primary: "macro_to_wide_reveal"
    specs:
      start: "100mm macro f/2.8 at 15cm"
      middle: "zoom to 50mm while dollying out"
      end: "24mm hero shot at 2.5m"
    movement: "smooth continuous zoom with orbital motion"
    
  character_intimate:
    primary: "intimate_storytelling"
    specs:
      lens: "50mm f/2.8"
      movement: "slow push-in 30cm over 6s"
      height: "eye level 160cm"
    focus: "shallow DOF on subject"
    
  compilation_varied:
    primary: "mixed_approaches"
    beat_1: "35mm static wide"
    beat_2: "50mm medium movement"
    beat_3: "24mm dynamic energy"
    
  high_energy:
    primary: "dynamic_movement"
    specs:
      lens: "24mm f/4"
      movement: "handheld stabilized"
      cuts: "snappy transitions"
```

### Lighting Automation

```yaml
lighting_presets:
  dramatic:
    key_temp: 3200
    key_position: "45 degrees left"
    ratio: "6:1"
    rim: true
    atmosphere: "light haze"
    
  natural:
    key_temp: 5600
    key_position: "window motivated"
    ratio: "2:1"
    fill: "bounce card"
    atmosphere: "clean"
    
  transformation:
    stage_1: "single dramatic source"
    stage_2: "particle glow addition"
    stage_3: "environmental fade-in"
    stage_4: "balanced final lighting"
    
  commercial:
    key_temp: 5000
    ratio: "3:1"
    product_light: true
    background: "2 stops under"
```

### Dialogue Generation Rules

```yaml
dialogue_patterns:
  discovery:
    opener: ["wait", "what", "is that", "no way"]
    middle: ["this can't be", "how is this", "I don't believe"]
    closer: ["amazing", "incredible", "this changes everything"]
    
  comedy:
    opener: ["seriously?", "again?", "oh come on"]
    middle: ["this is ridiculous", "why does this happen", "every time"]
    closer: ["I give up", "typical", "of course"]
    
  emotional:
    opener: ["I never thought", "after all this time", "finally"]
    middle: ["it's really happening", "this means", "we did it"]
    closer: ["thank you", "I knew it", "worth it all"]
    
  commercial:
    opener: ["tired of", "there's a better way", "discover"]
    middle: ["with just", "simply", "watch this"]
    closer: ["never again", "game changer", "try it now"]
```

### Viral Optimization

```yaml
viral_mechanics:
  hooks:
    instant: 0.5
    quick: 1.0
    standard: 1.5
    slow: 2.0
    
  shareable_moments:
    relatable: "universal experience everyone has"
    surprising: "unexpected twist or reveal"
    emotional: "touching or inspiring moment"
    funny: "genuine laugh moment"
    
  quotable_formulas:
    - "[Subject] [unexpected verb] [surprising object]"
    - "When [common situation], but [twist]"
    - "That moment when [relatable experience]"
    - "[Number] [time unit] later: [result]"
```

### Enhancement Rules

```yaml
auto_enhancement:
  visual_polish:
    micro_details: true
    breathing_visible: true
    physics_accuracy: true
    
  audio_richness:
    room_tone: true
    layer_depth: 3
    spatial_audio: true
    
  performance:
    micro_expressions: true
    energy_progression: "smooth"
    timing_precision: "exact"
    
  never_change:
    - "character_description"
    - "core_keywords"
    - "duration"
    - "successful_hooks"
```

### Quality Thresholds

```yaml
validation_requirements:
  minimum_score: 95
  critical_checks:
    character_consistency: 100
    no_caps_dialogue: 100
    keyword_presence: 100
    timing_accuracy: 100
    
  auto_fix_priority:
    1: "character_consistency"
    2: "dialogue_formatting"
    3: "keyword_completion"
    4: "timing_issues"
    5: "technical_specs"
    
  max_fix_attempts: 3
  fallback: "flag_for_review"
```

### Success Projections

```yaml
platform_success_metrics:
  youtube:
    views: "10K+"
    engagement: "15%+"
    completion: "70%+"
    shares: "5%+"
    
  tiktok:
    views: "50K+"
    engagement: "20%+"
    completion: "80%+"
    shares: "8%+"
    
  instagram:
    views: "25K+"
    engagement: "18%+"
    saves: "6%+"
    shares: "7%+"
    
  default:
    engagement: "15%+"
    completion: "75%+"
    shares: "6%+"
```