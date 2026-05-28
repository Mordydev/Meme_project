# /execute-checklist Task

When this command is used, execute the following task:

# Video Creation Checklist Validation Task

This task provides instructions for validating video creation documentation against checklists. The agent MUST follow these instructions to ensure thorough and systematic validation of all video production elements.

## Available Checklists

When the user requests checklist validation, present the available options:

1. **video-strategist-checklist** - Validates concept, story, script, and strategy elements
2. **video-producer-checklist** - Validates visual design, production specs, and generation readiness

If no specific checklist is specified, ask which phase they want to validate:
- Strategy Phase → video-strategist-checklist
- Production Phase → video-producer-checklist

## Instructions

### 1. Initial Assessment

- If user provides a checklist name:
  - Try fuzzy matching (e.g. "strategy checklist" → "video-strategist-checklist")
  - If multiple matches found, ask user to clarify
  - Load the appropriate checklist from video2/checklists/
- If no checklist specified:
  - Ask which phase they're validating (Strategy or Production)
  - Present the appropriate checklist
- Confirm execution mode:
  - Section by section (interactive mode - detailed review)
  - All at once (YOLO mode - comprehensive report at end)

### 2. Document and Artifact Gathering

For **Video Strategist Checklist**, gather:
- Concept documentation or brief
- Story architecture (beat structure)
- Scripts with dialogue and timing
- Transformation designs (if applicable)
- Keywords strategy
- Platform requirements

For **Video Producer Checklist**, gather:
- Story architecture from strategy phase
- Visual specifications
- Character bible
- Beat integration plans
- Variation strategies (if applicable)
- Platform export requirements

### 3. Checklist Processing

#### Interactive Mode:
- Work through each section one at a time
- For each section:
  - Review all items following embedded instructions
  - Check against relevant documentation
  - Present findings highlighting:
    - ✅ PASS items
    - ❌ FAIL items
    - ⚠️ PARTIAL items
    - N/A items with rationale
  - Get confirmation before proceeding

#### YOLO Mode:
- Process all sections at once
- Create comprehensive report
- Present complete analysis with:
  - Overall readiness percentage
  - Critical issues by priority
  - Specific recommendations

### 4. Validation Approach

For each checklist item:
- Read and understand the requirement
- Look for evidence in documentation
- Consider both explicit and implicit coverage
- Follow all embedded LLM instructions
- Mark items as:
  - ✅ PASS: Requirement clearly met
  - ❌ FAIL: Requirement not met
  - ⚠️ PARTIAL: Some aspects covered
  - N/A: Not applicable

### 5. Section Analysis

For each section:
- Calculate pass rate percentage
- Identify common themes in failures
- Provide specific recommendations
- Document user decisions
- Note dependencies between sections

### 6. Final Report

Prepare a summary including:

#### Executive Summary
- Overall readiness (percentage)
- Phase assessment (Strategy/Production)
- Critical blockers identified
- Generation success probability

#### Category Analysis
- Pass rates by section
- Most concerning failures
- Character consistency status
- Audio safety verification
- Platform optimization level

#### Risk Assessment
- Technical feasibility risks
- Viral potential concerns
- Complexity issues
- Timeline impacts

#### Recommendations
- Must-fix before proceeding
- Should-fix for quality
- Nice-to-have improvements
- Next steps in workflow

## Checklist-Specific Guidance

### Video Strategist Checklist Focus:
- Concept feasibility within 8-second constraints
- Character consistency setup
- Viral mechanics integration
- Platform strategy alignment
- Story architecture completeness

### Video Producer Checklist Focus:
- Visual specification precision
- Character description verification
- Audio formatting safety (NO ALL CAPS)
- Beat integration quality
- Generation readiness

## Special Validation Rules

### Character Consistency (CRITICAL):
- NEVER accept "same as beat 1" shortcuts
- Verify complete descriptions in every beat
- Check gender and age specified each time
- Ensure word-for-word copying

### Audio Safety (CRITICAL):
- Flag ANY ALL CAPS in dialogue
- Note that visual text/logos can use ALL CAPS
- Verify natural capitalization
- Check for letter-by-letter reading risks

### Keywords Validation:
- Core keywords MUST include: "16:9", "no text", "8 seconds"
- Style keywords must match content type
- Platform keywords for optimization
- Consistency across all beats

### Timing Precision:
- Exactly 8.0 seconds per beat
- Dialogue timing specified
- SFX sync points marked
- Transformation stages timed

## Workflow Integration

After checklist completion, guide next steps:

### From Strategy Checklist:
- If PASSED → Ready for Video Producer phase
- If FAILED → Address blockers with Video Strategist
- Document handoff requirements

### From Producer Checklist:
- If PASSED → Ready for Veo 3 generation
- If FAILED → Address technical issues
- Prepare generation strategy

## Quality Gates

Before marking checklist complete:
- All BLOCKER issues resolved
- HIGH priority items addressed
- Character consistency verified
- Audio safety confirmed
- Platform requirements met

## Interactive Prompts

When issues are found, offer:
1. "Would you like help fixing this issue?"
2. "Should we review the problematic section together?"
3. "Do you need clarification on any requirement?"
4. "Would you like to see examples of correct implementation?"

## Success Criteria

Checklist validation is successful when:
- Overall readiness ≥ 85%
- No BLOCKER issues remain
- Character consistency absolute
- Audio formatting safe
- Ready for next phase

Remember: These checklists ensure consistent quality and prevent common Veo 3 generation issues. Thorough validation here saves time and improves success rates.