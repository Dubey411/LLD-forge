# Research Note: LLD Practice & Evaluation Platform

**Author:** Candidate Submission (CipherSchools 2-Day Engineering Assignment)  
**Scope:** Problem exploration, competitive landscape, identified gaps, and MVP product direction.

---

## 1. The Learner Problem in Low-Level Design

Preparing for Low-Level Design (LLD) / Object-Oriented Design (OOD) interviews is notoriously frustrating for software engineers. While Data Structures and Algorithms (DSA) benefit from binary pass/fail test cases (e.g., LeetCode), and High-Level Design (HLD) relies on broad architectural patterns, LLD falls into an ambiguous middle ground:

1. **Easy to start, impossible to self-evaluate:** A learner can draft a Parking Lot or Elevator system, but cannot easily assess whether their class boundaries adhere to the Single Responsibility Principle (SRP), if their abstractions are premature, or if they missed critical concurrency edge cases.
2. **No single "correct" answer:** Unlike algorithmic problems, there are multiple valid designs for the same problem. For example, a Vending Machine can be cleanly implemented using a State pattern or a Strategy pattern. Conventional LeetCode-style test runners fail because they expect a singular, rigid method signature.
3. **Lack of iterative feedback:** In real interviews, the interviewer critiques specific trade-offs ("Why is `Vehicle` coupled to `ParkingSpot`?"). In self-study, learners rarely receive critique that points to concrete evidence in their code, making it difficult to improve on subsequent attempts.

---

## 2. Research & Existing Approaches

To define our product direction, we evaluated four common ways engineers currently practice LLD:

| Approach / Tool | Workflow | Strengths | Critical Gaps |
|---|---|---|---|
| **Static GitHub Repositories** *(e.g., awesome-low-level-design)* | Learner reads someone else’s reference implementation. | Provides sample clean code and UML diagrams. | **Passive reading, not active practice.** Learner does not write code or understand *why* alternatives were rejected. |
| **Unconstrained ChatGPT / Claude** | Learner pastes their code and asks: *"Is this design good?"* | Instant, conversational response. | **Hallucinates ungrounded feedback.** Generates a random "8/10 score" without citing specific lines. Inconsistent across retries; impossible to track whether Attempt 2 is better than Attempt 1. |
| **Visual Diagramming Tools** *(e.g., draw.io, Mermaid, Eraser)* | Learner manually draws UML class boxes and arrows. | Visualizes relationships clearly. | **High friction, weak practice signal.** Learners spend 80% of their time aligning boxes and 20% on design reasoning. Fails to capture method contracts and behavior. |
| **Mock Interviews** *(e.g., Pramp, Interviewing.io)* | Live 60-minute session with a human peer. | Realistic pressure and nuanced feedback. | **High scheduling friction and inconsistent reviewer quality.** Not scalable for daily iterative practice. |

### Key Gaps Identified
1. **The "Random Score" Anti-Pattern:** Generic LLMs output arbitrary ratings (e.g. "Looks great, 85/100") without holding the model accountable to cited evidence from the code.
2. **No Baseline or Progress Comparison:** Existing tools do not diff attempts. A learner who retries a problem cannot see whether *Coupling & Cohesion* improved while *Edge Case Handling* regressed.
3. **Over-Engineering Bias:** Many tools push learners to draw diagrams rather than think through interfaces, method signatures, and state encapsulation.

---

## 3. Product Direction & MVP Scope

To address these gaps within a focused 2-day engineering scope, we defined the following core product principles:

### A. Text & Pseudocode First
We deliberately rejected visual diagram editors. Plain text and pseudocode in a monospace editor represent the smallest input format that provides dense, unambiguous evidence of:
- Entity responsibilities (attributes and methods)
- Interface contracts and polymorphism
- Design pattern application (State, Strategy, Factory)
- Concurrency and boundary reasoning

### B. Fixed Rubric with Verbatim Evidence Citing
To make feedback explainable and objective:
- The AI is bound to a **fixed 7-dimension rubric** (0–5 score scale) rather than an unconstrained prompt.
- The model is **strictly required to quote exact verbatim snippets** from the learner's text for every score.
- A **deterministic verification guard** inspects the AI output: if an AI cites a fabricated quote not found in the submission, the result is flagged with `evidenceVerified: false` and downgraded to `confidence: 'low'`.

### C. The Iterative Learning Loop (Per-Criterion Deltas)
Practice is only effective if retries measure improvement. Our platform preserves every attempt and automatically diffs the latest scores against the immediately preceding attempt on that problem (e.g., `Class Responsibilities: 2 → 4 (+2 ↑)`, `Extensibility: 3 ↔ unchanged`).

---

## 4. Summary of MVP Focus
Rather than building an LMS or complex diagramming suite, this MVP optimizes the single most valuable interaction:  
`Choose Problem → Draft Pseudocode → Submit → Receive Evidence-Verified Rubric Feedback → Retry with Progression Deltas`.
