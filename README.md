# LLD Practice Platform

A Low-Level Design (LLD) practice platform providing structured, evidence-based rubric feedback and progressive attempt tracking.

---

## Brief

Built as a 2-day engineering assignment for **CipherSchools**, this platform provides a focused practice environment for Low-Level Design interviews. Learners select a canonical design problem (Parking Lot, Elevator System, Vending Machine), write a plain-text/pseudocode solution detailing domain classes, interfaces, responsibilities, relationships, and design trade-offs, and receive structured feedback scored across fixed rubric dimensions. 

Every attempt is persisted and scored with verbatim evidence citations from the submission. Learners can retry problems and inspect a **delta view** showing per-dimension score progressions across attempts.

---

## Features

- **Problem Selection**: Choose from 3 seeded canonical LLD challenges (**Parking Lot**, **Elevator System**, and **Vending Machine**) complete with functional requirements, constraints, and tags.
- **Text & Pseudocode Submission**: Distraction-free monospace editor focused on software design thinking (class contracts, encapsulation, abstractions) without the friction of visual diagram tools.
- **Deterministic Validation Checks**: Validates input length (minimum 100 characters) and requires at least 2 structural OOP tokens (`class`, `interface`, or PascalCase entity names). Short-circuits trivial, empty, or junk input immediately without wasting AI API credits.
- **Content Hashing & Idempotency**: Computes a SHA-256 hash of the trimmed submission. If an identical design has already been evaluated for that problem, the existing evaluation is reused instantly.
- **Structured AI Evaluation**: Uses the Anthropic Claude API with strict system-prompt JSON schema enforcement to evaluate submissions across 7 core design dimensions.
- **Evidence Verification Guard**: A deterministic post-check that verifies AI-quoted evidence strings actually appear in the learner's submission text. Mismatches flag `evidenceVerified: false` and force `confidence: 'low'` (surfaced as "Needs Review" in the UI) without crashing or discarding the evaluation.
- **Attempt History & Delta View**: Chronological attempt log displaying past submissions and calculating per-criterion deltas against the immediately preceding attempt (e.g. `Coupling/Cohesion: 2 → 4 (+2 ↑)`, `Extensibility: 2 ↔ unchanged`).

---

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Frontend**: React + Vite + Tailwind CSS
- **AI Integration**: Anthropic Claude API (`@anthropic-ai/sdk`) with structured JSON output enforced via system prompt
- **Testing**: Jest + Supertest, `mongodb-memory-server` / local MongoDB for integration tests
- **Infrastructure**: Docker + Docker Compose (one application service, one MongoDB service)
- **Other**: `crypto` (built-in Node.js module) for SHA-256 content hashing (idempotency), `dotenv` for environment variable configuration

---

## Architecture / How It Works

The platform uses a synchronous evaluation flow backed by an explicit state machine and deterministic guard rails:

```
[ Learner Text Submission ]
            │
            ▼
[ Save Submission: Status = 'pending' ]  <── Submission preserved immediately
            │
            ▼
[ Deterministic Checks ] ──(Fails min length / OOP markers)──► [ Short-Circuit: Status = 'completed' (Score 0) ]
            │ (Passes)
            ▼
[ SHA-256 Hash Idempotency Check ] ──(Duplicate found)──► [ Reuse Existing Completed Evaluation ]
            │ (Unique)
            ▼
[ Status = 'evaluating' ]
            │
            ▼
[ AI Rubric Scoring (Claude API) ]
  - Evaluates 7 dimensions (Score 0-5)
  - Requires exact verbatim quote in 'evidence'
            │
            ▼
[ Deterministic Evidence Verification Guard ]
  - Verifies cited quote exists in submission text
  - If missing: sets evidenceVerified=false & confidence='low'
            │
            ▼
[ Save Evaluation & Status = 'completed' ]
            │
            ▼
[ Frontend Polling (~2s) renders Results & Delta View ]
```

### Domain Model

- **`Problem`**: Represents a design challenge (`slug`, `title`, `description`, `requirements[]`, `constraints[]`, `difficulty`, `tags[]`).
- **`Attempt`**: Links a learner session to a problem (`id, problemId, userId, status ('in_progress' | 'submitted'), startedAt`). Separate from Submission so a draft or abandoned attempt does not trigger evaluation.
- **`Submission`**: Owns *what was submitted* (`id, attemptId, problemId, userId, content, contentHash, submittedAt, evaluationStatus ('pending' | 'evaluating' | 'completed' | 'failed')`). Immutable once created.
- **`Evaluation`**: Owns *judgement about the submission* (`id, submissionId, evaluatorType ('deterministic' | 'ai'), rubricResults[], overallSummary, createdAt`). Each `RubricResult` contains: `criterion`, `score` (0–5), `evidence` (verbatim quote), `concern`, `suggestion`, `confidence` ('high' | 'low'), and `evidenceVerified` (boolean).

---

## Project Structure

```
LLD/
├── client/                      # React + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── api/client.js        # API wrapper for backend calls
│   │   ├── components/          # MonospaceEditor, RubricCard, DeltaBadge, etc.
│   │   ├── pages/               # ProblemListPage, PracticePage, AttemptHistoryPage
│   │   ├── App.jsx              # Main routing & state
│   │   └── index.css            # Tailwind directives & design tokens
│   └── package.json
├── server/                      # Node.js + Express backend
│   ├── src/
│   │   ├── config/              # db.js, rubric.js (7 static rubric dimensions)
│   │   ├── controllers/         # problemController, attemptController, submissionController
│   │   ├── evaluators/          # Evaluator, DeterministicEvaluator, AIEvaluator, EvidenceVerifier, EvaluatorService
│   │   ├── models/              # Problem, Attempt, Submission, Evaluation
│   │   ├── routes/              # Express route definitions
│   │   ├── scripts/             # seed.js (seeds the 3 canonical problems)
│   │   ├── services/            # problemService, attemptService, submissionService, deltaService
│   │   ├── app.js               # Express application configuration
│   │   └── server.js            # Server listener entrypoint
│   ├── tests/                   # Jest + Supertest test suites
│   ├── Dockerfile               # Backend production container specification
│   └── package.json
├── docker-compose.yml           # App container + MongoDB service definition
├── AI_USAGE.md                  # Detailed log of AI interactions & engineering decisions
├── package.json                 # Monorepo root scripts
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18 or higher (v20+ recommended)
- **MongoDB**: A running MongoDB instance locally (`mongodb://127.0.0.1:27017`) or Docker

### 1. Environment Configuration
Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/lld_practice
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-sonnet-4-6
NODE_ENV=development
```

*(Note: If `ANTHROPIC_API_KEY` is not provided, the platform automatically activates a local mock evaluator fallback that extracts real verbatim quotes from user code so you can test the full pipeline offline).*

### 2. Running with Docker (Recommended)
To run both the application and MongoDB in containers:

```bash
docker-compose up --build
```

### 3. Running Without Docker

**Install dependencies:**
```bash
# Root and workspace dependencies
npm run install:all

# Or individually:
cd server && npm install
cd ../client && npm install
```

**Seed problems into MongoDB:**
```bash
npm run seed
# or: cd server && node src/scripts/seed.js
```

**Start the development servers:**
```bash
# Start both server and client concurrently
npm run dev

# Or run in separate terminals:
npm run dev:server    # Backend API on http://localhost:5000
npm run dev:client    # Frontend on http://localhost:5180 (or http://localhost:3000)
```

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/problems` | List all available problems with requirement counts and tags |
| `GET` | `/api/problems/:slug` | Retrieve single problem detail (requirements, constraints, rubric criteria) |
| `POST` | `/api/problems/:slug/attempts` | Start a new attempt session for a problem (`userId` optional, defaults to `"demo-user"`) |
| `POST` | `/api/attempts/:id/submissions` | Submit design text; immediately saves as `pending` and kicks off evaluation pipeline |
| `GET` | `/api/submissions/:id` | Poll submission status (`pending` → `evaluating` → `completed` / `failed`) and view populated evaluation |
| `GET` | `/api/problems/:slug/attempts?userId=` | Retrieve attempt history for a problem with per-criterion score deltas |

---

## Testing

Run the automated backend test suite:

```bash
npm run test:server
# or: cd server && npm test
```

### What Is Tested
- **Submission State Machine & Resilience**: Asserts that a submission is saved and marked `failed` with an error message even if the AI evaluator throws (data is never lost).
- **Idempotency**: Asserts that submitting identical content for the same problem reuses the cached evaluation without invoking the AI.
- **Deterministic Short-Circuit**: Asserts that empty, too-short (<100 chars), or prose-only submissions lacking OOP markers are short-circuited with deterministic feedback and never trigger an AI API call.
- **State Machine Guard**: Asserts that a completed submission cannot transition back to `evaluating`.
- **Evidence Verification Guard**: Asserts that exact and normalized quotes pass verification, while fabricated or hallucinated quotes fail verification and have their confidence downgraded to `'low'`.
- **Full E2E Happy Path (Supertest)**: Tests the full flow: fetch problems → create attempt 1 → submit → poll result → create attempt 2 → submit revised code → verify per-criterion deltas.

---

## Known Limitations

- **No Authentication**: Uses a hardcoded demo user (`demo-user` or `x-user-id` header). Auth is out of scope for this MVP.
- **No Diagram Support**: Plain text / pseudocode only. Designed deliberately to evaluate domain thinking rather than diagram drawing.
- **Synchronous Evaluation**: Live AI evaluation takes ~10–30 seconds. The frontend polls `/api/submissions/:id` every 2 seconds with an animated status indicator.
- **No Attempt History Pagination**: Returns all past attempts for a problem in a single query; sufficient for a prototype practice session, but would need cursor pagination at scale.
- **Mock Evaluator Fallback**: A local fallback exists for development without API keys, but the live demonstration should be run with a valid `ANTHROPIC_API_KEY`.

---

## Design Decisions Summary

- **Text Over Diagrams**: Text and pseudocode are the most concise medium that provides dense signal on OOP contracts, encapsulation, and class responsibilities without spending engineering budget on a diagram canvas.
- **Submission Stored Before Evaluation**: Submissions are saved to the database as `pending` before the evaluator is invoked. If the external AI service times out or crashes, user work is never lost.
- **Deterministic / AI Boundary**: Code enforces what can be checked deterministically (character counts, keyword tokens, quote presence); the AI is reserved for subjective architectural judgement.
- **MongoDB Over PostgreSQL**: The `Evaluation` record with its embedded, variable `RubricResult` array is naturally document-shaped. MongoDB avoids relational join overhead on every submission fetch.
- **Synchronous State Machine Over Queue**: Following the assignment brief's warning against distributed-systems overreach, a synchronous in-process promise pipeline with polling provides resilience without Redis/BullMQ infrastructure complexity.
- **Fixed Rubric Over Adaptive Scoring**: Consistent rubric dimensions across all attempts are required to compute meaningful per-criterion deltas (e.g. tracking whether *Coupling & Cohesion* improved from attempt 1 to attempt 2).

*(For in-depth architectural trade-offs, refer to the Design Note document).*
