# AI Usage Report

This document records key decisions made while working with AI coding tools during the 2-day build of the LLD Practice Platform. It highlights instances where default AI proposals were audited, overridden, simplified, or steered to adhere strictly to the project constraints and grading criteria.

---

## 1. AI Suggested a BullMQ/Redis Job Queue — Rejected

- **What happened:** When I asked the AI to design the evaluation flow, it suggested using BullMQ with Redis as a background job queue to process evaluations asynchronously. The reasoning was sound for a high-scale production system — AI evaluation takes 10–30 seconds and blocking the request thread isn't ideal at scale.
- **What I did:** I rejected the queue architecture. The assignment brief explicitly states that "a simple monolith is completely acceptable" and warns against "turning this into a distributed-systems project." For a prototype with a single demo user, an in-process synchronous state machine (`pending` → `evaluating` → `completed`/`failed`) paired with frontend polling is the simplest thing that works. Submissions are saved before evaluation starts, ensuring user data is never lost even if an external call times out.
- **Lesson:** The AI optimized for production scale by default. My role was to enforce the assignment's actual scope — knowing when *not* to build something is critical engineering judgement.

---

## 2. AI Suggested a Generic 1–100 AI Score — Overridden

- **What happened:** The first version of the AI evaluator prompt asked Claude to "rate this design out of 100 and provide feedback." It returned a single arbitrary number alongside a paragraph of loose commentary.
- **What I did:** I overrode this with a fixed, multi-dimensional rubric covering specific design dimensions (requirement understanding, class responsibilities, coupling/cohesion, encapsulation, abstraction/patterns, extensibility, edge cases, and explanation quality), each scored 0–5. Crucially, each criterion requires a verbatim evidence quote cited from the learner's text, an identified concern, and an actionable suggestion. The helping guide explicitly warns against "an LLM prompt that simply asks for a 100-point score" and flags it as something evaluators would be less impressed by.
- **Lesson:** The AI's default approach was the exact anti-pattern the assignment warned against. Reviewing the grading criteria beforehand allowed me to redirect the evaluator toward structured, explainable, evidence-backed feedback.

---

## 3. AI Dropped the Idempotency Check — Had to Prompt Explicitly

- **What happened:** In the initial implementation of the submission endpoint, the AI generated a clean POST handler that saved the submission and fired the evaluation, but completely omitted duplicate detection. Submitting the identical design twice (via double-click or page retry) created two separate submissions and consumed two redundant AI calls.
- **What I did:** I explicitly prompted for a content hash using Node.js's built-in `crypto` module (SHA-256 of trimmed submission text) stored directly on the `Submission` document. Before invoking the evaluator, the service queries whether a completed evaluation already exists for that `(problemId, contentHash)` pair. If found, it immediately reuses the existing evaluation. This directly satisfied the helping guide's requirement to "avoid duplicate processing where a user retries the same request."
- **Lesson:** The AI generated the standard happy path but overlooked a core operational requirement called out in the brief. I had to know the requirement existed and direct the model to implement it.

---

## 4. AI Suggested Matching Against a Reference Solution — Rejected

- **What happened:** When architecting the evaluation approach, the AI recommended storing a canonical "reference solution" for each problem and computing a structural diff or semantic similarity score between the learner's code and the reference.
- **What I did:** I rejected this approach. Low-Level Design problems inherently have multiple valid solutions; a Parking Lot or Vending Machine can be modeled cleanly using different design patterns (e.g. State Pattern vs Strategy Pattern) and different class decompositions. Scoring against a single reference solution penalizes valid alternative architectures. Instead, the prompt evaluates fundamental design qualities (coupling, cohesion, single responsibility, extensibility) independently of any single canonical implementation, respecting the guide's warning to "avoid treating a reference solution as the only correct answer."
- **Lesson:** The AI defaulted to a LeetCode-style test-case/solution matching paradigm. Recognizing that design evaluation requires assessing principles rather than string/AST diffs was an essential engineering distinction.

---

## 5. AI Suggested a Separate Rubric Model — Simplified

- **What happened:** The AI initially proposed creating a dedicated `Rubric` collection in MongoDB complete with full CRUD endpoints and database schemas, operating under the assumption that rubrics should be dynamically manageable per problem.
- **What I did:** I simplified the design by treating the rubric as static configuration in code (`rubric.js`) and within the evaluator's system prompt. For a 2-day MVP, rubric dimensions remain constant across problems, with weights defined directly in config. A dedicated MongoDB collection would have added unnecessary database calls, migrations, and schema boilerplate without user-facing value. The helping guide explicitly advises against "design patterns added only to show pattern knowledge."
- **Lesson:** The AI over-engineered the domain model. Knowing the difference between what needs a database lifecycle and what is simply configuration prevented unnecessary architectural bloat.

---

## Summary

The pattern across all these: AI is good at generating structure and happy paths. It's weak at catching edge cases the brief specifically mentions, applying assignment constraints, and knowing when NOT to build something. My job was to read the brief carefully, know the requirements, and override the AI when it optimised for the wrong thing.
