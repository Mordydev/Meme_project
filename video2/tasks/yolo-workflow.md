# /yolo-workflow Task

When this command is used, execute the following task:

# YOLO Mode: Automated Task Execution Workflow

## Purpose
Execute all video creation tasks in optimal sequence WITHOUT user interaction, reading and following each task file exactly as written, but making intelligent decisions automatically where user input would normally be required.

## CRITICAL YOLO PRINCIPLES

1. **READ ACTUAL TASKS** - Load and execute each task file completely
2. **FOLLOW TASK INSTRUCTIONS** - Don't skip or summarize task steps
3. **AUTO-DECIDE AT PROMPTS** - Make best-practice choices when tasks ask for input
4. **MAINTAIN QUALITY** - Never compromise standards for speed
5. **VALIDATE THOROUGHLY** - Run all checklists and auto-fix issues

## Execution Framework

### YOLO Task Reading Protocol
```
For each task in sequence:
1. LOAD the actual task file
2. READ all instructions completely
3. EXECUTE every step as written
4. AUTO-RESPOND to any prompts with best practices
5. DOCUMENT decisions made
6. PROCEED to next task
```

## PHASE 1: STRATEGY (Video Strategist Tasks)

### Task Sequence with Auto-Decisions
```
STRATEGY_TASKS = [
    {
        "task": "concept-ideation.md",
        "auto_decisions": {
            "emotion_to_create": "engaging and shareable",
            "target_audience": "broad social media users",
            "success_metric": "viral potential",
            "content_type": AUTO_DETECT_FROM_CONCEPT,
            "beat_structure": AUTO_SELECT_OPTIMAL
        }
    },
    {
        "task": "story-architecture.md",
        "auto_decisions": {
            "beat_count": 3,  # standard
            "structure_type": BASED_ON_CONTENT_TYPE,
            "platform_primary": "youtube",
            "platform_secondary": ["tiktok", "instagram"],
            "script_integration": true,  # handles script + keywords internally
            "keyword_strategy": "content_optimized"
        }
    },
    {
        "task": "transformation-design.md",  # if applicable - auto-detect if needed
        "auto_decisions": {
            "transformation_type": AUTO_SELECT,
            "particle_style": "elegant",
            "camera_movement": "smooth_orbital"
        },
        "condition": "if transformation content detected"
    }
]
```

### Strategy Validation
```
VALIDATION_STEP = {
    "task": "execute-checklist.md",
    "checklist": "video-strategist-checklist",
    "mode": "comprehensive",  # not interactive
    "threshold": 85,
    "auto_fix": true,
    "retry_limit": 3
}
```

## PHASE 2: PRODUCTION (Video Producer Tasks)

### Task Sequence with Auto-Decisions
```
PRODUCTION_TASKS = [
    {
        "task": "visual-design.md",
        "auto_decisions": {
            "camera_lens": "50mm",  # versatile default
            "lighting_style": "cinematic_standard",
            "color_grade": "warm_neutral",
            "composition": "rule_of_thirds"
        }
    },
    {
        "task": "variation-engineering.md",
        "auto_decisions": {
            "create_variations": true,
            "variation_count": 4,
            "strategies": {
                "hero": "balanced",
                "var_a": "comedy",
                "var_b": "drama",
                "var_c": "platform_optimized"
            }
        }
    },
    {
        "task": "veo3-prompt-generation.md",
        "auto_decisions": {
            "format": "all_formats",  # JSON + Quick
            "platform_exports": ["youtube", "tiktok", "instagram"],
            "seed_strategy": "test_then_lock",
            "beat_integration": "smooth_continuous"  # handles integration internally
        }
    }
]
```

### Production Validation
```
VALIDATION_STEP = {
    "task": "execute-checklist.md",
    "checklist": "video-producer-checklist",
    "mode": "comprehensive",
    "threshold": 90,
    "auto_fix": true,
    "retry_limit": 3
}
```

## Auto-Decision Logic

### Content Type Detection
```python
def auto_detect_content_type(concept):
    # Read the concept-ideation task's detection logic
    task = load_task("concept-ideation.md")
    
    # Apply task's content type selection criteria
    if "product" or "brand" in concept:
        if "transform" in concept:
            return "transformation"
        return "commercial"
    elif "funny" or "comedy" in concept:
        return "entertainment"
    elif "interview" or "conversation" in concept:
        return "interview"
    else:
        return "character_story"
```

### Beat Structure Selection
```python
def auto_select_beat_structure(content_type):
    # Read story-architecture task's structure options
    task = load_task("story-architecture.md")
    
    # Apply task's selection logic
    structure_map = {
        "transformation": "transformation_stages",
        "character_story": "continuous_narrative",
        "interview": "compilation_perspectives",
        "commercial": "hybrid_structure"
    }
    return structure_map.get(content_type, "continuous_narrative")
```

### Character Generation
```python
def auto_generate_character(concept):
    # Read character bible requirements from task
    # Generate complete description following task format
    return {
        "name": generate_appropriate_name(),
        "age": select_relatable_age(),  # 25-35 default
        "gender": determine_from_context(),
        "appearance": generate_complete_description(),
        "voice": define_voice_characteristics(),
        "consistency_code": create_unique_id()
    }
```

## Validation Auto-Fix Loop

### Execute Checklist with Auto-Fix
```python
def run_validation_with_autofix(checklist, threshold):
    while attempt < retry_limit:
        # Run the actual execute-checklist task
        score = execute_task("execute-checklist.md", {
            "checklist": checklist,
            "mode": "comprehensive"
        })
        
        if score >= threshold:
            return True
        
        # Apply auto-fixes for identified issues
        for issue in validation_results.issues:
            if issue.type == "character_incomplete":
                complete_character_descriptions()
            elif issue.type == "dialogue_too_long":
                trim_dialogue_to_limits()
            elif issue.type == "all_caps_found":
                convert_to_normal_case()
            elif issue.type == "keywords_missing":
                add_required_keywords()
            elif issue.type == "timing_off":
                adjust_to_8_seconds()
        
        attempt += 1
    
    return score >= threshold
```

## Task Execution Method

### How YOLO Reads and Executes Tasks
```python
def execute_task_in_yolo(task_file, auto_decisions):
    # 1. Load the actual task file
    task_content = load_task_file(task_file)
    
    # 2. Parse task instructions
    instructions = parse_task_structure(task_content)
    
    # 3. Execute each step
    for step in instructions:
        if step.requires_input:
            # Use auto_decision instead of asking user
            decision = auto_decisions.get(step.input_key)
            apply_decision(decision)
        else:
            # Execute step as written
            execute_step(step)
    
    # 4. Save outputs as specified in task
    save_task_outputs()
    
    # 5. Log execution
    log_task_completion(task_file)
```

## Execution Log Format

### Progress Tracking
```
[YOLO WORKFLOW STARTED]
Input: "[User concept]"
Mode: Automated (YOLO)
System Quality: 96% of original prompt capability

[PHASE 1: STRATEGY - Victoria]
► Loading task: concept-ideation.md
  ✓ Phase 1: Vision Excavation [AUTO: engaging/viral]
  ✓ Phase 2: Content Type [AUTO: character_story]
  ✓ Phase 3: Beat Validation [AUTO: continuous]
  ✓ Phase 4: Feasibility [PASSED]
  ✓ Output: Concept Blueprint [SAVED]

► Loading task: story-architecture.md
  ✓ Step 1: Content Architecture [AUTO: continuous_narrative]
  ✓ Step 2: Character Bible [AUTO: generated complete]
  ✓ Step 3: Beat Structure [AUTO: 3 beats created]
  ✓ Step 4: Script Integration [AUTO: dialogue and timing]
  ✓ Step 5: Keywords Strategy [AUTO: content-optimized keywords]
  ✓ Step 6: Platform Optimization [AUTO: multi-platform planning]
  ✓ Output: Complete Story Architecture with Script [SAVED]

► Loading task: transformation-design.md [IF APPLICABLE]
  ✓ Synchronized Timing: [PRECISION AUDIO-VISUAL]
  ✓ Audio Orchestration: [LAYERED WITH DB LEVELS]
  ✓ Platform Delivery: [ALL EXPORT SPECS]
  ✓ Viral Optimization: [ENGAGEMENT MECHANICS]
  ✓ Quality Control: [PRE/POST WORKFLOWS]
  ✓ Seed Management: [TRACKING SYSTEM]
  ✓ Output: Transformation Specs [SAVED]

► Running validation: video-strategist-checklist
  Score: 82% - Below threshold
  Auto-fixing: character descriptions, keywords, timing
  Re-validation: 88% - PASSED

[PHASE 2: PRODUCTION - Marcus]
► Loading task: visual-design.md
  ✓ Material Physics: [ENHANCED SPECIFICATIONS]
  ✓ Camera Choreography: [PRECISION PATTERNS]
  ✓ Environmental Design: [ATMOSPHERIC CONTROLS]
  ✓ VFX Integration: [PRODUCTION GUIDELINES]
  ✓ Output: Visual Bible [SAVED]

► Loading task: variation-engineering.md
  ✓ Character Consistency: [WORD-FOR-WORD EXACT]
  ✓ Audio Formatting: [NO ALL CAPS CHECKED]
  ✓ Variation Strategies: [4 VERSIONS CREATED]
  ✓ Testing Matrix: [A/B/C CONFIGURED]
  ✓ Output: Variation Package [SAVED]

► Loading task: veo3-prompt-generation.md
  ✓ Enhancement Philosophy: [PRESERVE AND POLISH]
  ✓ Quality Layers: [MICRO-DETAIL SPECS]
  ✓ Keywords Validation: [FINAL CONSISTENCY CHECK]
  ✓ Format Generation: [ALL OUTPUTS CREATED]
  ✓ Output: Production Package [SAVED]

► Running validation: video-producer-checklist
  Score: 89% - Below threshold
  Auto-fixing: platform optimization, sync points
  Re-validation: 91% - PASSED

[FINAL OUTPUT GENERATED]
Format: veo3-final-output.md
Quality Score: 94%
Enhanced Features: ✓ Material Physics ✓ Audio Orchestration ✓ Viral Optimization
Ready for Generation: YES
```

## Error Handling

### Task Execution Failures
```python
def handle_task_failure(task, error):
    if error.type == "missing_dependency":
        # Generate required dependency
        create_missing_dependency()
        retry_task(task)
    
    elif error.type == "validation_failed":
        # Apply fixes and retry
        apply_autofix_registry()
        retry_task(task)
    
    elif error.type == "decision_unclear":
        # Use safe default
        use_default_decision()
        continue_task(task)
```

## Output Generation

### Final Deliverable
After all tasks complete successfully:
1. Load the veo3-final-output.md template
2. Populate with all generated content
3. Include all variations
4. Add generation instructions
5. Save complete package

## Key Differences from Manual Mode

| Aspect | Manual Mode | YOLO Mode |
|--------|------------|-----------|
| Task Execution | User responds to prompts | Auto-decisions applied |
| Validation | User reviews issues | Auto-fix applied |
| Quality Control | User confirms each step | Thresholds enforced |
| Time | 30-60 minutes interactive | 5-10 minutes automated |
| Output | Same quality | Same quality |

## Success Criteria

YOLO mode succeeds when:
- All tasks executed completely (not summarized)
- All task instructions followed exactly
- Validation thresholds met (85%/90%)
- Character consistency maintained
- Final output ready for Veo 3
- No user interaction required

## Important Notes

1. **Tasks are gospel** - Follow task files exactly
2. **Don't skip steps** - Every step has a purpose
3. **Quality first** - Speed comes from automation, not shortcuts
4. **Document decisions** - Log what was auto-decided
5. **Validate thoroughly** - Never skip validation