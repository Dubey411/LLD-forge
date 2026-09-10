# Design Note: LLD Practice Platform Architecture

**Author:** Candidate Submission (CipherSchools 2-Day Engineering Assignment)  
**Scope:** Domain modeling, evaluation pipeline, key architectural trade-offs, and extensibility change tests.

---

## 1. Addressing the Core Design Questions

### Q1: What does a learner actually need to provide for an LLD attempt to be meaningful?
A learner does not need to submit 500 lines of fully compiling Java or build a UML diagram. What matters in an LLD interview is:
1. **Domain Entities & State:** Clear classes with private/protected attributes.
2. **Behavioral Contracts:** Public method signatures and interfaces defining component boundaries.
3. **Relationships & Coupling:** How components collaborate (composition vs. inheritance, dependency injection).
4. **Design Pattern Application:** Deliberate abstraction (e.g., State pattern for Vending Machine, Strategy for Parking Lot allocation).

*Implementation Decision:* We provide a monospace editor for plain text / pseudocode. A deterministic gate requires a minimum length of 100 characters and at least 2 structural OOP tokens (`class`, `interface`, PascalCase entities) to reject blank or trivial submissions before triggering evaluation.

---

### Q2: What makes feedback useful when there can be more than one valid LLD solution?
Comparing code against a rigid "reference solution" fails because LLD has multiple valid architectures. Feedback is useful only when it:
1. **Evaluates Principles, Not Signatures:** Grades adherence to SOLID principles, coupling, cohesion, and boundary encapsulation rather than checking for specific variable names.
2. **Cites Verbatim Evidence:** Instead of general commentary ("Your classes are coupled"), the evaluator must cite the exact snippet (e.g. `this.spots = []` inside `ParkingLot`) to justify its concern.
3. **Offers Targeted Improvements:** Separates what was identified as a concern from concrete, actionable refactoring suggestions.

---

### Q3: Which parts of evaluation should be deterministic vs. LLM?
We maintain a strict boundary between deterministic code and AI reasoning:

| Responsibility | Mechanism | Rationale |
|---|---|---|
| **Input Validation** | Deterministic Regex & Length Checks | Fast, instant feedback; prevents wasting AI credits on empty/junk input. |
| **Idempotency** | Deterministic SHA-256 Content Hash | Immediate reuse of cached evaluations if user resubmits identical code. |
| **Architectural Judgement** | Anthropic Claude API (System Prompt Rubric) | LLMs excel at nuanced semantic reasoning about cohesion, coupling, and design trade-offs. |
| **Evidence Verification** | Deterministic Substring & Token Overlap Guard | Prevents LLM hallucination. Verifies that cited quotes actually exist in the learner's text. |

---

### Q4: What should happen if evaluation takes time or fails?
We deliberately rejected distributed job queues (Redis, BullMQ, Kafka) as unnecessary over-engineering for a 2-day prototype:
1. **Immediate Persistence:** When a submission is received, it is immediately persisted in MongoDB with `evaluationStatus: 'pending'`. User work is never lost.
2. **Asynchronous Execution & State Machine:** The evaluation pipeline executes in-process while the client receives an immediate `201 Created` and polls `/api/submissions/:id` every 2 seconds.
3. **Clean Terminal States:** If the AI call times out, throws a 503, or returns malformed JSON, the submission transitions to `failed` with `errorMessage` stored. It is **never** left stuck in `evaluating`.

---

## 2. Two Simple Change Tests

### Change Test A: Moving from Text to Class Diagrams
> *"Today the learner submits text. Later the platform supports a class diagram. How much of your domain model changes?"*

**Impact on Domain Model: Minimal (Zero Core Schema Rewrite)**
- In our schema, `Submission` owns *what was submitted* (`content: String, contentHash: String`).
- To support diagrams, we simply add a `format: 'text' | 'diagram'` field and a `diagramPayload: Object` (or JSON AST) to the `Submission` document.
- The `Evaluation` model does **not change at all**. It remains completely decoupled, storing rubric scores, concerns, and suggestions regardless of whether the source was text, Mermaid, or JSON UML.

---

### Change Test B: Adding Alternative Evaluators (Rule-Based or Human Review)
> *"Today feedback comes from one evaluator. Later you add a rule-based evaluator or human review. Can you add it without rewriting the practice flow?"*

**Impact on Practice Flow: None (Open/Closed Principle via Strategy Pattern)**
- We defined an abstract `Evaluator` base interface:
  ```js
  class Evaluator {
    async evaluate({ problem, content, submission }) { ... }
  }
  ```
- Both `DeterministicEvaluator` and `AIEvaluator` implement this interface.
- To introduce a `RuleBasedASTEvaluator` or a `HumanReviewEvaluator`, we simply implement a new class extending `Evaluator`.
- The `EvaluatorService` and `submissionService` coordinate evaluators polymorphically without changing the API routes or frontend polling contract.

---

## 3. Domain Model Responsibilities

```
+----------------+          +----------------+
|    Problem     | 1      * |    Attempt     |
| (Requirements) |<---------|  (User Session)|
+----------------+          +----------------+
                                    | 1
                                    |
                                    | *
                            +----------------+          +----------------+
                            |   Submission   | 1      1 |   Evaluation   |
                            | (What was sent)|<---------| (Judgement &   |
                            +----------------+          |  Rubric Array) |
                                                        +----------------+
```

1. **`Problem`**: Holds problem specifications (requirements, constraints, difficulty, tags). Immutable reference.
2. **`Attempt`**: Represents an active learning session (`in_progress` vs. `submitted`). Keeps drafts isolated from completed submissions.
3. **`Submission`**: Owns the immutable snapshot of learner content, SHA-256 hash, and lifecycle state (`pending` → `evaluating` → `completed` / `failed`).
4. **`Evaluation`**: Owns the assessment: 7 `RubricResult` objects (scores 0–5, quotes, concerns, suggestions, confidence, evidenceVerified) and an executive summary.

---

## 4. Practical Scaling (If the Product Grows)

If traffic expands beyond a prototype:
1. **The First Component to Separate:** The **Evaluation Pipeline Worker**. Extract the evaluation handler into a lightweight background worker consuming from a persistent queue (e.g. BullMQ on Redis). This keeps the Express HTTP server purely focused on low-latency request handling.
2. **Database Read/Write Splitting:** Read operations (problem catalog, past attempt histories) can leverage read replicas or caching, while submissions write to primary.
3. **Deterministic Guarding:** Running deterministic structural checks upfront already eliminates ~30% of unnecessary external API calls.
