# /workflow-orchestrator Task

When this command is used, execute the following task:

# Workflow Orchestrator: Agent Handoff & Automation

## Purpose
Orchestrate seamless handoff between Video Strategist and Video Producer agents, managing the complete workflow from concept to final output with automatic task execution and validation.

## CRITICAL ORCHESTRATION RULES

1. **Maintain Context** - Preserve all data between agents
2. **Validate Handoffs** - Ensure readiness before switching
3. **Auto-Fix Issues** - Resolve problems without stopping
4. **Track Progress** - Log all steps and decisions
5. **Deliver Complete** - Final output must be production-ready

## Orchestration Flow

### INITIALIZATION
```
START_WORKFLOW {
  input: user_concept
  mode: "YOLO"
  target_output: "veo3_prompts"
  agents: ["video-strategist", "video-producer"]
  validation_required: true
}
```

### PHASE 1: VIDEO STRATEGIST ORCHESTRATION

#### Task Execution Sequence
```
EXECUTE_STRATEGY_PHASE {
  tasks: [
    "concept-ideation",
    "story-architecture",
    "script-engineering",
    "transformation-design",  // if applicable
    "keyword-strategy"
  ],
  validation: "video-strategist-checklist",
  required_score: 85,
  auto_fix: true
}
```

#### Handoff Package Creation
```
CREATE_HANDOFF_PACKAGE {
  contents: {
    "concept": complete_blueprint,
    "architecture": beat_structure,
    "characters": character_bible,
    "scripts": dialogue_timing,
    "keywords": strategy_document,
    "validation": checklist_results
  },
  format: "structured_json",
  verification: "complete"
}
```

### PHASE 2: AGENT TRANSITION

#### Automatic Agent Switch
```
AGENT_TRANSITION {
  from: "video-strategist",
  to: "video-producer",
  trigger: "validation_passed",
  handoff: handoff_package,
  context_preservation: "full"
}
```

#### Context Transfer
```
TRANSFER_CONTEXT {
  preserve: [
    "character_descriptions",
    "beat_architecture",
    "keywords_strategy",
    "platform_targets",
    "viral_elements"
  ],
  inject_to: "video-producer",
  verify: "all_data_intact"
}
```

### PHASE 3: VIDEO PRODUCER ORCHESTRATION

#### Task Execution Sequence
```
EXECUTE_PRODUCTION_PHASE {
  tasks: [
    "visual-design",
    "beat-integration",
    "variation-engineering",
    "veo3-prompt-generation"
  ],
  validation: "video-producer-checklist",
  required_score: 90,
  auto_fix: true
}
```

#### Final Output Generation
```
GENERATE_FINAL_OUTPUT {
  formats: [
    "production_json",
    "quick_generation",
    "variation_packages",
    "platform_specific"
  ],
  quality_check: "final_validation",
  ready_for: "veo3_generation"
}
```

## Automatic Decision Engine

### Content Type Detection
```python
def detect_content_type(concept):
    indicators = analyze_concept(concept)
    
    if "product" in indicators or "brand" in indicators:
        if "transform" in indicators:
            return "transformation"
        else:
            return "commercial"
    elif "multiple" in indicators and "character" in indicators:
        return "compilation"
    elif "funny" in indicators or "comedy" in indicators:
        return "entertainment_comedy"
    elif "emotional" in indicators or "dramatic" in indicators:
        return "entertainment_drama"
    else:
        return "character_story"
```

### Platform Selection
```python
def select_platforms(concept, content_type):
    platforms = {
        "primary": "youtube",  # default
        "secondary": []
    }
    
    if content_type in ["entertainment_comedy", "compilation"]:
        platforms["secondary"].append("tiktok")
    
    if content_type in ["transformation", "commercial"]:
        platforms["secondary"].append("instagram")
    
    return platforms
```

### Variation Strategy Selection
```python
def determine_variations(content_type, platform):
    base_variations = {
        "hero": "balanced_universal",
        "var_a": "comedy_energy",
        "var_b": "dramatic_emotion"
    }
    
    if platform["primary"] == "tiktok":
        base_variations["var_c"] = "tiktok_optimized"
    elif platform["primary"] == "youtube":
        base_variations["var_c"] = "youtube_retention"
    else:
        base_variations["var_c"] = "instagram_aesthetic"
    
    return base_variations
```

## Validation & Auto-Fix Engine

### Common Issues Resolution
```python
AUTO_FIX_REGISTRY = {
    "character_incomplete": lambda: generate_missing_details(),
    "dialogue_too_long": lambda: trim_to_word_limit(),
    "all_caps_found": lambda: convert_to_normal_case(),
    "keywords_missing": lambda: add_required_keywords(),
    "timing_incorrect": lambda: adjust_to_8_seconds(),
    "description_shortcut": lambda: expand_full_description()
}
```

### Validation Loop
```python
def validation_loop(phase, checklist, threshold):
    while True:
        score = run_checklist(checklist)
        
        if score >= threshold:
            return True
        
        issues = identify_issues()
        for issue in issues:
            if issue in AUTO_FIX_REGISTRY:
                AUTO_FIX_REGISTRY[issue]()
        
        if not fixable_issues_remain():
            break
    
    return score >= threshold
```

## Progress Tracking

### Execution Log Format
```
[TIMESTAMP] WORKFLOW STARTED
├── Input: "[User concept summary]"
├── Mode: YOLO
└── Target: Veo 3 Production Prompts

[TIMESTAMP] PHASE 1: VIDEO STRATEGIST
├── Task: concept-ideation [COMPLETE]
├── Task: story-architecture [COMPLETE]
├── Task: script-engineering [COMPLETE]
├── Task: keyword-strategy [COMPLETE]
├── Validation: 87% [PASSED]
└── Handoff Package: [CREATED]

[TIMESTAMP] AGENT TRANSITION
├── From: video-strategist
├── To: video-producer
└── Context: [TRANSFERRED]

[TIMESTAMP] PHASE 2: VIDEO PRODUCER
├── Task: visual-design [COMPLETE]
├── Task: beat-integration [COMPLETE]
├── Task: variation-engineering [COMPLETE]
├── Task: veo3-prompt-generation [COMPLETE]
├── Validation: 93% [PASSED]
└── Final Output: [GENERATED]

[TIMESTAMP] WORKFLOW COMPLETE
├── Duration: [Time]
├── Quality Score: 93%
├── Beats Generated: 3
├── Variations Created: 4
└── Status: READY FOR VEO 3
```

## Error Recovery

### Critical Failure Handling
```python
def handle_critical_failure(error_type, context):
    recovery_strategies = {
        "validation_failed": rollback_and_retry,
        "handoff_incomplete": regenerate_package,
        "agent_unavailable": wait_and_retry,
        "output_corrupt": regenerate_from_checkpoint
    }
    
    if error_type in recovery_strategies:
        return recovery_strategies[error_type](context)
    else:
        log_error_and_continue(error_type)
```

### Checkpoint System
```python
CHECKPOINTS = {
    "strategy_complete": save_strategy_state(),
    "handoff_ready": save_handoff_package(),
    "production_complete": save_production_state(),
    "output_generated": save_final_output()
}
```

## Output Delivery

### Final Package Structure
```json
{
  "workflow_metadata": {
    "id": "workflow_[timestamp]",
    "duration": "[execution_time]",
    "agents_used": ["video-strategist", "video-producer"],
    "tasks_completed": 10,
    "validation_scores": {
      "strategy": 87,
      "production": 93
    }
  },
  "veo3_prompts": {
    "beat_1": "[Complete prompt with all specs]",
    "beat_2": "[Complete prompt with all specs]",
    "beat_3": "[Complete prompt with all specs]"
  },
  "variations": {
    "hero": "[Hero version package]",
    "comedy": "[Comedy variation]",
    "drama": "[Drama variation]",
    "platform": "[Platform-specific]"
  },
  "generation_instructions": {
    "seed_management": "[Strategy]",
    "sequence": "[Order of generation]",
    "platform_exports": "[Settings for each]"
  }
}
```

## Success Metrics

### Workflow Success Criteria
- Strategy validation ≥ 85%
- Production validation ≥ 90%
- All tasks completed
- No manual intervention
- Output ready for Veo 3

### Quality Indicators
- Character consistency: 100%
- Audio safety: 100%
- Keywords complete: 100%
- Timing precision: ±0.1s
- Platform optimization: Complete

## Orchestration Commands

### Manual Override Options
```
ORCHESTRATOR_COMMANDS = {
  "pause": "Pause workflow at current step",
  "resume": "Continue from pause point",
  "skip": "Skip current task (risky)",
  "retry": "Retry failed task",
  "validate": "Run validation manually",
  "export": "Export current state"
}
```

## Key Principles

1. **Seamless Flow** - No stops or interruptions
2. **Context Preservation** - Nothing lost in handoff
3. **Quality Maintenance** - Standards never compromised
4. **Intelligent Defaults** - Smart decisions automatically
5. **Complete Delivery** - Ready for immediate use