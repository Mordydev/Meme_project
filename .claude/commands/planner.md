# Collaborative Discovery & Planning Protocol

Deploy 13 agents to understand project context, gather requirements through dialogue, conduct comprehensive web research, investigate implementation approaches, and create a comprehensive plan with deep technical alignment.

**Arguments:**
- output_folder: $ARGUMENTS

**Output:**
- `[$output_folder]/agent11_final_implementation_plan.md` - Complete implementation plan
- `[$output_folder]/agent13_implementation_blueprint.md` - Exact file modification and creation blueprint
- `[$output_folder]/alignment.md` - Consolidated user alignment document
- `[$output_folder]/context.md` - Consolidated project context document
- `[$output_folder]/research.md` - Consolidated research and decisions document
- Supporting documents from all 13 agents

## Agent Execution Overview
- Agents 1-5: Sequential discovery and verification
- Agent 2: Initial requirements dialogue (2-5 rounds)
- Agent 6: Comprehensive web research for latest trends
- Agent 7: Deep technical alignment dialogue (2-5 rounds) 
- Agents 8-10: Context engineering and validation
- Agent 11: Final synthesis and plan creation
- Agent 12: Document consolidation and alignment verification
- Agent 13: Implementation blueprint and anti-overengineering validation

## Phase 1: Discovery & Initial Alignment (Agents 1-5)

### Agent 1 - Project Context Analyzer
**Input:** Read:
- The entire `/docs` folder
- Key configuration files
- `/Users/mordchailunger/Documents/GitHub/Marketly/.claude/commands/planner.md` - Planning rules and guidelines

Analyze critical project files to understand:
- Project architecture and structure
- Completed work and current state
- Technical decisions and patterns
- Dependencies and integrations
- Overall project vision and goals
- Design system and UI patterns

**Output:** Create `[$output_folder]/agent1_project_overview.md` containing:
- High-level project summary
- Key architectural decisions
- Current implementation status
- Important patterns and conventions
- Technology stack overview
- Design system summary
- Areas of complexity or technical debt

**Note:** Complete all analysis and document creation in a single task execution.

### Agent 2 - Interactive Requirements Gathering
**Input:** Read:
- `[$output_folder]/agent1_project_overview.md` - Project context
- `/Users/mordchailunger/Documents/GitHub/Marketly/.claude/commands/planner.md` - Planning rules and guidelines

Engage in strategic dialogue with the user to understand their requirements:

**ROUND 1 - Initial Understanding:**
"Based on my analysis of the project, I understand [brief project summary]. What would you like to work on today? Please describe the feature or change you're considering."

**Dialogue Approach:**
- Ask targeted, strategic questions that uncover critical requirements
- Offer insights and suggestions based on project context
- Challenge assumptions constructively
- Anticipate potential issues the user may not have considered
- Summarize understanding regularly to ensure alignment

**ROUNDS 2-5 - Progressive Refinement:**
Based on user responses:
- Dig deeper into specific requirements
- Identify edge cases and constraints
- Explore alternative approaches
- Clarify success criteria
- Address any ambiguities or gaps
- Suggest improvements based on project patterns

**Completion Trigger:** When user indicates readiness to proceed OR after 5 rounds of dialogue.

**Output:** Create `[$output_folder]/agent2_requirements_specification.md` containing:
- Complete requirements as understood
- User's goals and success criteria
- Constraints and considerations discussed
- Edge cases identified
- Decisions made during dialogue
- Any remaining questions or risks
- Dialogue summary for each round

### Agent 3 - Implementation Investigator
**Input:** Read:
- `[$output_folder]/agent1_project_overview.md`
- `[$output_folder]/agent2_requirements_specification.md`
- `/Users/mordchailunger/Documents/GitHub/Marketly/.claude/commands/planner.md` - Planning rules and guidelines

Conduct thorough investigation of the codebase to determine optimal implementation approach:
- Map requirements to specific code locations
- Analyze multiple implementation strategies (minimum 3)
- Consider different architectural angles
- Evaluate pros/cons of each approach
- Review relevant existing code patterns
- Assess impact on current system
- Consider performance implications
- Evaluate maintainability factors

**Output:** Create `[$output_folder]/agent3_implementation_analysis.md` containing:
- Approaches considered (at least 3)
- Recommended approach with detailed rationale
- Trade-offs analysis
- Integration points identified
- Risk assessment
- Required changes overview
- Files to create/modify
- Dependencies to consider

### Agent 4 - Deep Verification Specialist
**Input:** Read:
- `[$output_folder]/agent1_project_overview.md`
- `[$output_folder]/agent2_requirements_specification.md`
- `[$output_folder]/agent3_implementation_analysis.md`
- `/Users/mordchailunger/Documents/GitHub/Marketly/.claude/commands/planner.md` - Planning rules and guidelines

Perform deep verification of Agent 3's recommendations:
- Verify all assumptions with code evidence
- Check for overlooked edge cases
- Validate technical feasibility
- Ensure alignment with requirements
- Identify additional considerations
- Challenge the recommended approach
- Look for hidden complexities
- Consider security implications
- Review performance bottlenecks

**Output:** Create `[$output_folder]/agent4_verification_insights.md` containing:
- Verification results with evidence
- Additional discoveries
- Edge cases found
- Assumption validations
- Enhanced recommendations
- Risk mitigations
- Confidence assessment
- Gaps identified for Agent 6

### Agent 5 - Final Alignment Validator
**Input:** Read:
- All documents from Agents 1-4 in `[$output_folder]`
- `/Users/mordchailunger/Documents/GitHub/Marketly/.claude/commands/planner.md` - Planning rules and guidelines

Conduct final verification pass ensuring:
- 100% alignment with user requirements from Agent 2
- Compatibility with existing codebase and patterns
- No critical aspects overlooked
- All edge cases considered
- Implementation approach is sound
- Requirements are fully addressable
- Identify any technical decisions needing user input
- Flag areas that would benefit from external research

**Output:** Create `[$output_folder]/agent5_final_validation.md` containing:
- Alignment confirmation matrix
- Technical decisions requiring user input
- Areas for web research investigation
- Final considerations
- Any remaining gaps
- Risk summary
- Green light assessment
- Questions for Agent 7 dialogue

## Phase 2: External Research & Insights (Agent 6)

### Agent 6 - Comprehensive Web Researcher
**Input:** Read:
- All documents from Agents 1-5 in `[$output_folder]`
- `/Users/mordchailunger/Documents/GitHub/Marketly/.claude/commands/planner.md` - Planning rules and guidelines

Conduct extensive web research to gather latest insights and best practices:

**Research Focus:**
Using the comprehensive understanding from Agents 1-5:
- Technology stack identified by Agent 1
- Requirements specified by Agent 2
- Implementation approaches from Agent 3
- Verification insights from Agent 4
- Validation gaps from Agent 5

Perform targeted searches to enhance our understanding and uncover fresh perspectives.

**Research Strategy:**
Based on discoveries from Agents 1-5, perform targeted searches for:

1. **Technology-Specific Best Practices**
   - Latest patterns for [identified tech stack from Agent 1]
   - Recent updates to [frameworks/libraries in use]
   - Security advisories for [identified dependencies]
   - Performance optimization for [feature type from Agent 2]
   - Community approaches to [challenges from Agent 3-5]

2. **Implementation Patterns**
   - Search for: "[feature type] implementation [framework] 2025"
   - GitHub repositories with similar features
   - Stack Overflow solutions for identified challenges
   - Dev.to/Medium articles on the approach
   - Official documentation updates

3. **Forum & Community Insights**
   - Reddit discussions on r/webdev, r/[specific tech]
   - Hacker News threads about similar implementations
   - Discord/Slack community recommendations
   - GitHub Discussions on relevant repos
   - Framework-specific forums

4. **UI/UX Trends**
   - Current design patterns for [feature type]
   - Dribbble/Behance examples
   - Award-winning implementations
   - Accessibility best practices 2025
   - Micro-interaction libraries and examples

5. **Performance & Optimization**
   - Latest benchmarks for similar features
   - Bundle size optimization strategies
   - Core Web Vitals improvements
   - Caching strategies
   - CDN and delivery optimizations

**Search Depth:**
- Minimum 15-20 targeted searches
- Focus on content from 2024-2025
- Verify information across multiple sources
- Prioritize official sources and recognized experts
- Note conflicting recommendations

**Fresh Perspectives:**
Look specifically for:
- Innovative approaches we haven't considered
- Common pitfalls and how to avoid them
- Emerging patterns gaining traction
- Alternative architectures
- Tools or libraries that could simplify implementation

**Note:** Current date is July 2025 - prioritize recent content and verify version compatibility.

**Output:** Create `[$output_folder]/agent6_web_research_insights.md` containing:
```markdown
# Web Research Insights

## Technology Best Practices
### [Framework/Library Name]
- Latest Version: [X.X.X] (Released: [Date])
- Key Updates Relevant to Our Feature:
  - [Update]: [Impact on implementation]
- Best Practice: [Description]
  - Source: [URL]
  - Why Relevant: [Explanation]

## Implementation Patterns Found
### Pattern 1: [Name]
- Description: [What it is]
- Example: [Code snippet or link]
- Pros: [Benefits]
- Cons: [Drawbacks]
- Source: [URL]
- Relevance Score: [High/Medium/Low]

## Community Insights
### Common Challenges
- [Challenge]: [How others solved it]
  - Source: [Forum thread URL]
  - Solution popularity: [Upvotes/endorsements]

### Recommended Approaches
- [Approach]: [Community consensus]
  - Sources: [Multiple URLs]
  - Adoption rate: [Estimated usage]

## UI/UX Trends (2025)
### Relevant Design Patterns
- [Pattern]: [Description]
  - Example: [URL to demonstration]
  - Why trending: [Reason]

### Micro-interactions
- [Type]: [Implementation approach]
  - Library: [If applicable]
  - Performance impact: [Minimal/Moderate/Heavy]

## Performance Optimizations
### Technique 1: [Name]
- Improvement: [Metric and percentage]
- Implementation effort: [Low/Medium/High]
- Source: [Benchmark URL]

## Security Considerations
### Latest Advisories
- [Vulnerability]: [If any related to our stack]
  - Mitigation: [Recommended approach]
  - Source: [Security advisory URL]

## Tools & Libraries Discovered
### [Tool Name]
- Purpose: [What it solves]
- Pros: [Benefits]
- Cons: [Drawbacks]
- Adoption: [GitHub stars, npm downloads]
- Relevance: [How it could help]

## Alternative Approaches
### Approach 1: [Name]
- Description: [Different way to implement]
- Used by: [Companies/projects]
- Trade-offs: [Compared to our current plan]

## Key Takeaways
1. [Most important insight] - Addresses [gap from Agent X]
2. [Trend we should consider] - Enhances [approach from Agent 3]
3. [Risk we should avoid] - Validates [concern from Agent 4]
4. [Optimization opportunity] - Improves [requirement from Agent 2]
5. [Tool that could help] - Simplifies [complexity from Agent 5]

## Future Considerations
- [Emerging pattern]: [Why to watch]
- [Upcoming feature]: [In framework/library]
```

## Phase 3: Deep Technical Alignment (Agent 7)

### Agent 7 - Technical Alignment Facilitator
**Input:** Read:
- All documents from Agents 1-6 in `[$output_folder]`
- `/Users/mordchailunger/Documents/GitHub/Marketly/.claude/commands/planner.md` - Planning rules and guidelines

With the deep context from investigation and fresh perspectives from web research, engage in strategic technical dialogue:

**Initial Technical Review:**
"Based on our investigation and web research, I've identified several technical decisions we need to make together. Let me share what we've discovered and get your input on the best approach.

[Summary of key findings from Agents 3-6, including relevant web research insights]

Here are the critical decisions we need to align on:"

**Technical Decision Areas:**
1. **Component Architecture**
   - "For [feature], we could structure it as [option A] or [option B]. Here's what each means..."
   - "Based on web research, the trend is moving toward [pattern] because..."
   - Get user preference on component granularity
   - Discuss reusability vs. specificity

2. **UI/UX Decisions**
   - "How should this look and function? Should we follow [existing pattern] or create something new?"
   - Discuss user flows and interactions
   - Align on visual hierarchy and emphasis

3. **Integration Approach**
   - "This will connect with [existing systems]. Should we [approach A] or [approach B]?"
   - Discuss data flow preferences
   - Align on error handling strategy

4. **Performance Considerations**
   - "Given the requirements, we should optimize for [metric]. This means..."
   - Discuss acceptable trade-offs
   - Set performance targets

**Gap Resolution:**
For each gap identified by Agents 3-5:
- Present the gap clearly
- Offer 2-3 solutions
- Get user's preference
- Document the decision and rationale

**Strategic Questioning:**
- "What's the expected user load for this feature?"
- "Should we prioritize initial load time or runtime performance?"
- "Do you prefer explicit error messages or graceful degradation?"
- "Should this be responsive across all devices or desktop-first?"
- "What's your preference for state management in this context?"

**Output:** Create `[$output_folder]/agent7_technical_alignment.md` containing:
```markdown
# Technical Alignment Decisions

## Component Architecture Decisions
- [Component Name]: [Decision made] 
  - Rationale: [User's reasoning]
  - Implementation notes: [Specific guidance]

## UI/UX Decisions
- Visual Style: [Decisions on look/feel]
- Interaction Patterns: [How things should behave]
- Animation Preferences: [Micro-interactions desired]
- Responsive Behavior: [Mobile/desktop priorities]

## Integration Decisions
- [System A] Integration: [Approach chosen]
- Data Flow: [Synchronous/asynchronous/event-driven]
- Error Handling: [Strategy selected]

## Performance Targets
- Load Time: [Target metric]
- Runtime Performance: [Expectations]
- Trade-offs Accepted: [What user is willing to sacrifice]

## Gap Resolutions
- [Gap 1]: Resolved by [decision]
- [Gap 2]: Resolved by [decision]

## Additional Technical Preferences
- Code Style: [Functional/OOP/Mixed]
- Testing Priority: [Unit/Integration/E2E]
- Documentation: [Inline/Separate/Both]

## Confirmed Approach
[Final summary of the complete technical approach with all decisions incorporated]
```

## Phase 4: Context Engineering & Validation (Agents 8-10)

### Agent 8 - Context Engineer
**Input:** Read:
- All documents from Agents 1-7 in `[$output_folder]`
- `/Users/mordchailunger/Documents/GitHub/Marketly/.claude/commands/planner.md` - Planning rules and guidelines

Deep dive into creating comprehensive implementation context:

**Project Structure Mapping:**
- Create detailed before/after project structure
- Map out all components and their relationships
- Define clear module boundaries
- Establish data flow diagrams
- Document integration touchpoints

**Component Architecture:**
```
Current Structure:
src/
├── components/
│   ├── [existing]/
│   └── [structures]/
└── [other dirs]/

Proposed Structure:
src/
├── components/
│   ├── [existing]/
│   ├── [new feature]/
│   │   ├── [Component1]/
│   │   │   ├── index.tsx
│   │   │   ├── styles.ts
│   │   │   └── types.ts
│   │   └── [Component2]/
│   └── [shared]/
└── [other dirs]/
```

**Context Gathering:**
- Extract all relevant code patterns
- Apply insights from web research where applicable
- Document API contracts
- Map state management flows
- Identify all connection points
- Create component dependency graph
- Document prop interfaces
- List all side effects
- Note opportunities from latest trends

**Output:** Create `[$output_folder]/agent8_solution_architecture.md` containing:
- Complete project structure (before/after)
- Component relationship diagrams
- Data flow mappings
- Integration point documentation
- API contract definitions
- State management strategy
- Event flow documentation
- File responsibility matrix

### Agent 9 - Integration Validator
**Input:** Read:
- All documents from Agents 1-8 in `[$output_folder]`
- `/Users/mordchailunger/Documents/GitHub/Marketly/.claude/commands/planner.md` - Planning rules and guidelines

Validate all integration points and architectural decisions:

**Integration Verification:**
- Verify each connection point will work
- Validate data contracts
- Ensure backward compatibility
- Check for circular dependencies
- Validate error propagation paths
- Confirm state synchronization approach

**Alternative Analysis:**
For each major architectural decision:
1. Document the chosen approach
2. List 2-3 alternatives considered
3. Provide detailed justification
4. Reference existing patterns that support the decision
5. Calculate complexity score
6. Assess maintenance burden

**Decision Defense:**
- "We chose [approach] because..."
- "This aligns with [existing pattern] found in..."
- "Web research confirms this is a current best practice..."
- "Alternative [X] was rejected due to..."
- "This decision optimizes for [priority] as requested"

**Output:** Create `[$output_folder]/agent9_integration_validation.md` containing:
- Integration point verification results
- Architectural decision justifications
- Alternative approaches analysis
- Pattern alignment confirmation
- Complexity assessment
- Risk mitigation strategies
- Performance impact analysis
- Maintenance considerations

### Agent 10 - UI/UX Excellence Expert & User Experience Strategist
**Input:** Read:
- All documents from Agents 1-9 in `[$output_folder]`
- `/Users/mordchailunger/Documents/GitHub/Marketly/.claude/commands/planner.md` - Planning rules and guidelines

Act as both UI/UX expert and user experience strategist to ensure exceptional user experience:

**Customer Journey Mapping:**
```markdown
## Primary User Flow
1. Entry Point: [How users discover/access feature]
   - Context: [What brought them here]
   - Expectations: [What they want to achieve]

2. Core Interaction: [Main feature usage]
   - Actions: [What users do]
   - Decisions: [Choices they make]
   - Feedback: [System responses]

3. Success State: [Completion]
   - Confirmation: [How they know they succeeded]
   - Next Steps: [Where they go next]

## Alternative Flows
- Error Path: [What happens when things go wrong]
- Power User Path: [Advanced features/shortcuts]
- First-Time User: [Onboarding considerations]
```

**User Experience Strategy:**
- Define emotional journey touchpoints
- Plan for user delight moments
- Design for accessibility from the start
- Create intuitive information architecture
- Plan progressive disclosure of complexity
- Design for various user expertise levels

**Design Pattern Analysis:**
- Review existing UI patterns in codebase
- Apply trending patterns from web research where appropriate
- Identify design system components to reuse
- Note any custom styling requirements
- Document animation patterns
- Review accessibility standards
- Consider modern UI trends discovered in research

**Micro-interaction Planning:**
- Hover states and transitions
- Loading states and skeletons
- Error state presentations
- Success feedback patterns
- Focus management
- Keyboard navigation
- Touch interactions
- Scroll behaviors
- Gesture support

**Visual Hierarchy:**
- Component spacing and rhythm
- Typography scales
- Color usage and contrast
- Shadow and elevation patterns
- Border and divider usage
- Icon and imagery guidelines

**Animation Details:**
```css
/* Example micro-interactions */
- Button hover: scale(1.02) with 200ms ease
- Page transitions: 300ms ease-in-out
- Loading spinner: 1s linear infinite
- Error shake: 100ms ease x3
- Success checkmark: 400ms spring
```

**Key User Flows Documentation:**
```markdown
## Flow 1: [Primary Action]
- Trigger: [User action]
- Steps: [1, 2, 3...]
- Feedback: [Visual/audio cues]
- Completion: [Success state]
- Edge cases: [Handled how]

## Flow 2: [Secondary Action]
[Similar structure]
```

**Output:** Create `[$output_folder]/agent10_ui_ux_excellence.md` containing:
- Complete customer journey maps
- Key user flows (primary and alternative)
- Emotional journey touchpoints
- UI pattern recommendations
- Micro-interaction specifications
- Animation timing functions
- Accessibility checklist
- Responsive behavior details
- Visual hierarchy decisions
- Component styling guide
- Interaction state matrix
- Performance budget for animations
- User delight opportunities
- Progressive disclosure strategy
- Error handling UX patterns
- Small details that elevate the experience

## Phase 5: Final Synthesis (Agents 11-12)

### Agent 11 - Master Plan Creator
**Input:** Read:
- All documents from Agents 1-10 in `[$output_folder]`
- `/Users/mordchailunger/Documents/GitHub/Marketly/.claude/commands/planner.md` - Planning rules and guidelines

Create the comprehensive implementation plan incorporating all insights:

**Synthesis Approach:**
- Start with user requirements from Agent 2
- Layer in web research insights from Agent 6
- Apply technical decisions from Agent 7
- Add context from Agent 8
- Validate with insights from Agent 9
- Polish with UI/UX details from Agent 10

**Plan Structure:**
1. **Executive Summary**
   - What we're building and why
   - Key technical decisions made
   - Expected outcome

2. **Implementation Roadmap**
   - Phase breakdown with clear milestones
   - Task dependencies
   - Critical path identification

3. **Technical Specification**
   - Architecture overview
   - Component specifications
   - Integration details
   - Data flow diagrams

4. **UI/UX Specifications**
   - Visual designs references
   - Interaction patterns
   - Animation guidelines
   - Accessibility requirements

5. **Testing Strategy**
   - Unit test requirements
   - Integration test scenarios
   - UI test coverage
   - Performance benchmarks

**Output:** Create `[$output_folder]/agent11_final_implementation_plan.md` containing:
- Complete implementation plan
- All technical decisions documented
- Clear task breakdown
- File creation/modification list
- Testing requirements
- Success criteria
- Risk mitigation plan
- Timeline estimates
- Post-implementation checklist

### Agent 12 - Master Consolidator & Alignment Verifier
**Input:** Read:
- All documents from Agents 1-11 in `[$output_folder]`
- `/Users/mordchailunger/Documents/GitHub/Marketly/.claude/commands/planner.md` - Planning rules and guidelines

Create three comprehensive consolidated documents ensuring nothing is overlooked:

**Document 1: alignment.md**
Consolidate all user alignment insights and decisions:
- **Primary Sources**: Agent 2 and Agent 7 documents
- **Additional Sources**: Any user preferences from other agents
- Include:
  - Initial requirements dialogue (Agent 2)
  - Technical alignment decisions (Agent 7)
  - User preferences on UI/UX (Agent 10)
  - All clarifications and decisions made
  - Success criteria and acceptance metrics
  - Priorities and trade-offs agreed upon
  - Future enhancements discussed but deferred

**Document 2: context.md**
Consolidate all project context and technical understanding:
- **Primary Sources**: Agents 1, 3, 4, 8
- **Additional Sources**: Technical insights from all agents
- Include:
  - Project overview and architecture (Agent 1)
  - Implementation investigation (Agent 3)
  - Verification insights (Agent 4)
  - Solution architecture (Agent 8)
  - Key patterns to reuse (with examples)
  - Anti-patterns to avoid (with reasons)
  - Technical constraints and dependencies
  - Integration points and data flows
  - Risk assessments and mitigations

**Document 3: research.md**
Consolidate all research, discoveries, and decisions:
- **Primary Sources**: Agents 5, 6, 9, 11
- **Additional Sources**: Research insights from all agents
- Include:
  - Web research findings (Agent 6)
  - Final validation insights (Agent 5)
  - Integration validation (Agent 9)
  - All technical decisions and rationale
  - Alternative approaches considered
  - Why specific choices were made
  - External best practices discovered
  - Tools and libraries evaluation
  - Next steps and implementation guidance

**Consolidation Process:**
1. Extract key information from each source document
2. Organize by theme and relevance
3. Remove redundancy while preserving nuance
4. Ensure traceability to original sources
5. Maintain decision rationale and context
6. Create clear, actionable summaries

**Plan Evaluation:**
After creating the three consolidated documents, evaluate Agent 11's implementation plan:

**Scoring Framework:**
- **Alignment Score (0-100%)**: How well does the plan match user requirements?
- **Completeness Score (0-100%)**: Are all discoveries incorporated?
- **Feasibility Score (0-100%)**: Is the plan realistic and implementable?
- **Context Coverage (0-100%)**: Does it use all relevant patterns and insights?

**Output:** Create four documents:
1. `[$output_folder]/alignment.md` - All user alignment consolidated
2. `[$output_folder]/context.md` - All project context consolidated
3. `[$output_folder]/research.md` - All research and decisions consolidated
4. `[$output_folder]/agent12_consolidation_report.md` containing:
   ```markdown
   # Consolidation Report
   
   ## Documents Created
   - alignment.md: [Key points covered]
   - context.md: [Key points covered]
   - research.md: [Key points covered]
   
   ## Implementation Plan Evaluation
   
   ### Alignment Score: [X%]
   - Strengths: [What aligns well]
   - Gaps: [Any misalignments]
   - Rationale: [Why this score]
   
   ### Completeness Score: [X%]
   - Incorporated: [What's included]
   - Missing: [What's not addressed]
   - Rationale: [Why this score]
   
   ### Feasibility Score: [X%]
   - Realistic aspects: [What's achievable]
   - Concerns: [What might be challenging]
   - Rationale: [Why this score]
   
   ### Context Coverage: [X%]
   - Patterns used: [Which ones]
   - Context applied: [How well]
   - Rationale: [Why this score]
   
   ## Overall Assessment
   - Total Score: [Average of all scores]
   - Recommendation: [Proceed/Revise/Specific adjustments needed]
   - Critical Success Factors: [What must be done right]
   
   ## Verification Checklist
   - [ ] All user requirements addressed
   - [ ] All technical decisions documented
   - [ ] All patterns properly referenced
   - [ ] All risks identified and mitigated
   - [ ] All research insights incorporated
   ```

## Phase 6: Implementation Blueprint & Anti-Overengineering (Agent 13)

### Agent 13 - Implementation Blueprint Architect & Complexity Guardian
**Input:** Read:
- All documents from Agents 1-12 in `[$output_folder]`
- `/Users/mordchailunger/Documents/GitHub/Marketly/.claude/commands/planner.md` - Planning rules and guidelines
- Focus heavily on Agent 11's implementation plan

Act as a skeptical architect who must verify everything with evidence and prevent over-engineering:

**Deep Codebase Investigation:**
1. **Complete Architecture Audit**
   - Map ENTIRE relevant project structure with evidence
   - Document EVERY existing component that could be reused
   - Identify ALL patterns already in place
   - Find similar implementations already in the codebase
   - Look for redundant code that serves similar purposes

2. **File-by-File Analysis**
   For each file mentioned in Agent 11's plan:
   - Does this file already exist? Show evidence (actual file path and content snippets)
   - Can we modify an existing file instead of creating new? Justify with code
   - Is there a simpler way to achieve this? Provide alternative
   - Are we duplicating functionality? Show where it exists

3. **Complexity Assessment**
   For each proposed change:
   - Complexity score: 1-10 (1=trivial, 10=very complex)
   - Is this complexity justified? Evidence-based reasoning
   - Can we simplify? Provide specific simplification
   - What's the minimal change needed? Document it

**Evidence-Based Decision Making:**
Every recommendation must include:
```markdown
### Decision: [Modify File X vs Create File Y]
**Evidence:**
- Current code: [Show actual code snippet]
- Similar pattern exists at: [File path and code]
- Reuse opportunity: [Specific component/function]
**Justification:**
- Why this approach: [Reasoning]
- Complexity saved: [Specific metrics]
- Maintenance benefit: [Long-term view]
```

**Anti-Overengineering Checklist:**
- [ ] Have we checked if this functionality already exists?
- [ ] Are we creating files when we could modify existing ones?
- [ ] Is every new file absolutely necessary?
- [ ] Can we use existing patterns instead of creating new ones?
- [ ] Are we adding complexity that isn't in the requirements?
- [ ] Have we considered the simplest solution first?
- [ ] Is our solution harder to maintain than the problem warrants?

**Redundancy Detection:**
```markdown
## Redundant Code Found
### Pattern 1: [Description]
- Exists in: [file1.ts, file2.ts]
- Can be consolidated to: [shared location]
- Code to remove: [specific lines]

### Pattern 2: [Description]
[Similar structure]
```

**Output:** Create `[$output_folder]/agent13_implementation_blueprint.md` containing:

```markdown
# Implementation Blueprint - Optimized for Simplicity

## Executive Summary
- Files to Modify: [X] (not create)
- Files to Create: [Y] (absolutely necessary)
- Redundancies to Remove: [Z]
- Complexity Reduction: [N%]

## Existing File Modifications

### File: [path/to/existing/file.ts]
**Current Purpose:** [What it does now]
**Evidence of Existence:** 
```typescript
// Current code snippet showing it exists
```
**Modifications Needed:**
- Line X-Y: [Change this to that]
- Add after line Z: [New code]
**Why Modify vs Create New:** [Justification with evidence]
**Complexity Score:** [1-10]

[Repeat for each file to modify]

## New File Creation (Only When Absolutely Necessary)

### File: [path/to/new/file.ts]
**Why This File MUST Be Created:**
- No existing file serves this purpose (checked: [list of files checked])
- Cannot be added to existing files because: [specific reason]
- Unique responsibility: [what only this file will do]
**Evidence We Need This:**
- Gap in current architecture: [show the gap]
- No similar pattern exists: [proof of search]
**Complexity Score:** [1-10]
**Simpler Alternative Considered:** [What we tried first]

[Repeat for each new file]

## Redundancy Removal Opportunities

### Redundancy 1: [Description]
**Current Duplication:**
- File A: [code snippet]
- File B: [similar code snippet]
**Consolidation Plan:**
- Extract to: [shared location]
- Update references: [list of imports to change]
**Benefit:** [Less code, easier maintenance]

## Complexity Reduction Strategy

### Original Plan Complexity
- Total new files proposed: [X]
- Total modifications proposed: [Y]
- New patterns introduced: [Z]

### Optimized Plan Complexity
- Total new files needed: [X-N]
- Total modifications: [Y+M]
- Patterns reused: [List]
- Complexity reduced by: [%]

## Implementation Order (Optimized)
1. **Phase 1 - Modify Existing Files**
   - [File 1]: [What to change]
   - [File 2]: [What to change]

2. **Phase 2 - Create Minimal New Files**
   - [Only truly necessary files]

3. **Phase 3 - Remove Redundancies**
   - [Consolidation tasks]

## Architecture Integrity Check
- [ ] All modifications follow existing patterns
- [ ] No unnecessary abstractions added
- [ ] Code reuse maximized
- [ ] Maintenance burden minimized
- [ ] Performance impact negligible
- [ ] No feature creep beyond requirements

## Final Recommendations
1. **DO**: [Specific actions to take]
2. **DON'T**: [Common traps to avoid]
3. **SIMPLIFY**: [Where we're overcomplicating]

## Evidence Summary
- Files investigated: [Count]
- Patterns analyzed: [Count]
- Redundancies found: [Count]
- Complexity reduction achieved: [Percentage]
```

**Critical Principles:**
- Be skeptical of every new file creation
- Prove with code evidence why modifications won't work
- Challenge every complexity addition
- Find and eliminate redundancies
- Optimize for maintenance, not cleverness
- Stay focused on requirements, not possibilities
- When in doubt, choose the simpler path

## Document Organization
All documents will be created in the specified output folder:
```
[$output_folder]/
├── agent1_project_overview.md
├── agent2_requirements_specification.md
├── agent3_implementation_analysis.md
├── agent4_verification_insights.md
├── agent5_final_validation.md
├── agent6_web_research_insights.md
├── agent7_technical_alignment.md
├── agent8_solution_architecture.md
├── agent9_integration_validation.md
├── agent10_ui_ux_excellence.md
├── agent11_final_implementation_plan.md
├── agent12_consolidation_report.md
├── agent13_implementation_blueprint.md    # Optimized implementation guide
├── alignment.md                           # Consolidated user alignment
├── context.md                            # Consolidated project context
└── research.md                           # Consolidated research & decisions
```

## Success Principles
- Deep discovery before planning
- Multiple alignment checkpoints
- External research for fresh perspectives
- Context is king with patterns and anti-patterns
- Integration validation
- UI/UX excellence with user journey focus
- Clear, actionable output
- Comprehensive consolidation for clarity
- Ruthless simplification and anti-overengineering

Begin with Agent 1 analyzing the `/docs` folder and project structure.