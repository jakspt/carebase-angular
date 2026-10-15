# README Modernization and Portfolio Showcase

Status: resolved

## Problem Statement

The repository's current `README.md` is significantly outdated and reflects the historical prototype state of CareBase when it operated as a monolithic Python Flask application with Jinja2 HTML templates and Bootstrap CSS. 

Since the original documentation was drafted, CareBase underwent a major architectural modernization: it was re-engineered into a decoupled Angular 22 Single Page Application (SPA) containerized alongside the Flask REST API and dual databases behind an Nginx reverse proxy. 

Because the README fails to reflect this transformation:
1. **Frontend Competence is Invisible**: The candidate's modern Angular engineering skills (Signals, Hexagonal Architecture with Ports & Adapters, Angular Material, Vitest harnesses) are completely absent from the project presentation.
2. **DevOps & Orchestration is Understated**: The Docker Compose multi-container infrastructure (5 services, health check dependency chains, reverse proxy routing, volume persistence) is reduced to a generic `docker compose up` command.
3. **Domain Vocabulary is Inconsistent**: Legacy German UI and database labels ("Arzt", "Sachbearbeiter", "Datenbank füllen", "Migration ausführen") persist in the text, contradicting the English clinical domain standards codified in `GLOSSARY.md` and `PRODUCT.md`.
4. **Demonstration Assets are Obsolete**: The repository references legacy animated GIFs depicting the deprecated Jinja2/Bootstrap UI rather than the modern Angular Material interface.
5. **High Friction for Evaluators**: Reviewers and recruiters currently have no instant, zero-install way to preview the application without pulling and running the full Docker stack locally.

## Solution

Modernize `README.md` into an executive, recruiter-facing portfolio showcase structured around three primary technical pillars:
1. **Modern Angular Architecture**: Angular 22 Single Page Application built with fine-grained reactive Signals, Hexagonal Ports & Adapters, and component test harnesses.
2. **Polyglot Persistence & Data Migration**: Runtime Strategy Pattern enabling dynamic switching between relational MariaDB and document-oriented MongoDB, powered by an automated one-way migration engine with NoSQL performance patterns.
3. **DevOps & Multi-Container Infrastructure**: 5-service Docker Compose topology with healthcheck dependency chains, named volume persistence, and an Nginx reverse proxy.

Key structural and content enhancements include:
- Removing Jinja2 and Bootstrap from the active tech stack badges and architecture overviews, treating Flask strictly as a REST API.
- Re-framing the legacy Jinja2 monolith as an "Architecture Evolution" narrative at the conclusion of the README to showcase refactoring and modernization capability.
- Providing a prominent link to a client-only static Live Demo, enabled by the Hexagonal Architecture of `HospitalDataAccess` and `InMemoryHospitalDataAdapter`.
- Embedding a GitHub-native Mermaid architecture diagram illustrating the containerized reverse-proxy routing and dual-database strategy pattern.
- Structuring technical sections into concise, scannable bullet points with collapsible `<details>` blocks for deeper architectural context (referencing ADR 0001, ADR 0002, and ADR 0003).
- Enforcing strict domain vocabulary per `GLOSSARY.md` across all sections.
- Pointing visual asset references to clean screenshot placeholders (`demo/scheduling-demo.png`, `demo/analytics-demo.png`) while preserving existing GIF files in git.
- Condensing setup instructions into a 3-step quickstart alongside a comprehensive User Role & Workflow Matrix.

## User Stories

1. As a technical recruiter scanning the repository, I want to see an executive summary and three bold technical pillars at the top of the README, so that I can immediately identify the developer's core competencies.
2. As a hiring manager evaluating candidate portfolios, I want an immediate link to a hosted static Live Demo, so that I can interact with the clinical workflows in seconds without cloning code or running Docker.
3. As a senior frontend reviewer, I want the README to highlight modern Angular 22 features (Signals, Hexagonal Ports & Adapters, Angular Material, and Vitest harnesses), so that I can verify adherence to enterprise frontend engineering standards.
4. As an architect inspecting the project, I want to view a native Mermaid container topology diagram, so that I can understand how Nginx routes traffic between the Angular SPA and the Flask REST API.
5. As a backend lead evaluating database knowledge, I want the README to articulate the Strategy Pattern and one-way SQL-to-NoSQL migration engine, so that I can assess the developer's polyglot persistence skills.
6. As a database specialist, I want the README to explain the MongoDB Computed Pattern and hybrid appointment collection design, so that I can understand the deliberate performance trade-offs made during denormalization.
7. As a DevOps engineer, I want the README to document multi-container Docker orchestration (including container healthcheck dependencies and persistent volumes), so that I can evaluate production readiness and infrastructure rigor.
8. As a developer evaluating the codebase locally, I want a clean 3-step quickstart (`git clone`, `docker compose up`, open `http://localhost`), so that I can run the full system without configuration errors.
9. As an evaluator testing the local application, I want a clear User Role & Workflow Matrix (Doctor, Clerk, Admin), so that I know exactly how to trigger appointment scheduling, treatment logging, synthetic data seeding, and database migration.
10. As a reviewer looking for professional polish, I want all legacy German labels replaced with clean clinical English per the domain glossary, so that the project maintains an international enterprise standard.
11. As a reader looking for a serious engineering project, I want the document to be clean, objective, and free of emojis or marketing hype, so that it reflects a focused clinical software engineering tone.
12. As a reviewer assessing senior engineering maturity, I want the transition from Jinja2 to Angular documented as a conscious architectural migration, so that I can evaluate the developer's ability to modernize legacy monoliths.
13. As a mobile or desktop reader, I want high-resolution screenshot placeholders and vector diagrams rather than heavy, laggy GIFs, so that the page loads quickly and cleanly.

## Implementation Decisions

- **Tone and Style**: Professional, clinical, and precise. No emojis, decorative icons, or informal jargon.
- **Header & Tech Stack Badges**:
  - Modernize Shields.io badges to: Angular 22, TypeScript, Python 3.13, Flask, MariaDB, MongoDB, Docker Compose, Nginx, and Vitest.
  - Remove deprecated Bootstrap and Jinja2 badges from the active stack.
- **Live Demo Showcase**:
  - Add a prominent markdown link to `https://jakspt.github.io/carebase`.
  - Include a collapsible `<details>` note showing how Angular Dependency Injection swaps `HttpHospitalDataAdapter` for `InMemoryHospitalDataAdapter` to compile a zero-backend static client bundle.
- **Architecture Overview**:
  - Embed a GitHub-native Mermaid graph visualizing:
    - Client browser $\rightarrow$ Nginx Reverse Proxy (`:80`)
    - Nginx $\rightarrow$ Angular SPA container (`carebase_frontend:80`) for `/`
    - Nginx $\rightarrow$ Flask REST API container (`carebase:5000`) for `/api/`
    - Flask $\rightarrow$ Abstract `DBStrategy` interface $\rightarrow$ `MariaDBStrategy` (`:3306`) & `MongoDBStrategy` (`:27017`).
- **Engineering Deep Dives (Concise & Scannable)**:
  - *Frontend Architecture*:
    - Fine-grained reactivity using Angular Signals (`signal`, `resource`).
    - Hexagonal Architecture (`HospitalDataAccess` port with HTTP and in-memory adapters).
    - Angular Material component system with WCAG AA accessibility.
    - Test engineering using Vitest, component test harnesses (`MatAutocompleteHarness`, `MatStepperHarness`), and zoneless async execution (`await fixture.whenStable()`). Link to ADR 0003.
  - *Database Engineering & Migration*:
    - Runtime Strategy Pattern for dynamic MariaDB/MongoDB swapping without restarts.
    - Automated one-way migration pipeline transforming relational tables into embedded JSON documents (ADR 0001).
    - MongoDB Computed Pattern for pre-computed doctor yearly earnings ($O(1)$ read performance, ADR 0002).
    - Hybrid appointment collection to prevent expensive `$unwind` queries during slot collision detection.
  - *DevOps & Multi-Container Infrastructure*:
    - 5-container Compose orchestration (`nginx`, `frontend`, `web`, `mariadb`, `mongodb`).
    - Startup dependency management via `condition: service_healthy` checks on database containers.
    - Nginx reverse proxy configuration for path routing, timeout thresholds, and SPA client routing fallback.
    - Data persistence across restarts using named Docker volumes (`mariadb_data`, `mongodb_data`).
- **Visual Assets**:
  - Replace broken GIF markdown links with high-resolution screenshot placeholders (`demo/scheduling-demo.png`, `demo/analytics-demo.png`).
  - Retain existing GIF binaries in `demo/` to avoid breaking git history.
- **Quickstart & User Role Matrix**:
  - 3-step setup snippet.
  - Markdown table outlining roles:
    - **Doctor**: Search patients, inspect appointment histories, record clinical treatments with medications and costs.
    - **Clerk**: Conflict-free appointment scheduling with 30-minute slot availability, Consultation Frequency Reports.
    - **Admin**: Seed synthetic test data into MariaDB, execute live one-way migration and runtime strategy swap to MongoDB.
- **Testing & Verification**:
  - Instructions for executing frontend test suites (`npm run test:run`) and pre-commit checks.
- **Architecture Evolution Narrative**:
  - Concluding section detailing the project's academic genesis and the engineering rationale for refactoring from a server-rendered monolith to a decoupled Angular SPA.

## Testing Decisions

- **Seam**: Documentation integrity, link validity, and command accuracy:
  - Verify all internal relative markdown links (`docs/adr/*`, `demo/*`, `frontend/*`, `compose.yaml`).
  - Verify Mermaid diagram syntax against GitHub Markdown rendering standards.
  - Verify domain vocabulary adherence against `GLOSSARY.md` (zero occurrences of deprecated German terms such as "Arzt", "Sachbearbeiter", "SVNr", "Datenbank füllen", "Migration ausführen").
  - Verify code formatting using Prettier (`npx prettier --check README.md`).
  - Verify accuracy of documented setup commands against `compose.yaml` and `frontend/carebase-frontend/package.json`.

## Out of Scope

- Modifying frontend or backend application code.
- Recording or committing actual new screenshot image binaries (the user will capture and add PNG files to `demo/`).
- Configuring automated CI/CD deployment pipelines for GitHub Pages hosting.
- Deleting historical `.gif` files from `demo/`.

## Further Notes

- All cross-references to ADRs (0001, 0002, 0003) must use direct relative markdown links.
- All code blocks must specify language syntax highlighting.
