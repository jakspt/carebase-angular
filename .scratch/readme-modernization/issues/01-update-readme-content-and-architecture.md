# Update README with Modern Architecture and Portfolio Showcase

Status: resolved

## Context

The current `README.md` documents an outdated, monolithic Flask + Jinja2 + Bootstrap architecture. The codebase has evolved into a decoupled Angular 22 SPA with Flask REST API, orchestrated via 5 Docker Compose services behind an Nginx reverse proxy. See `.scratch/readme-modernization/spec.md`.

## Requirements

1. **Header, Badges & Live Demo**:
   - Update Shields.io badges for Angular 22, TypeScript, Python 3.13, Flask, MariaDB, MongoDB, Docker Compose, Nginx, and Vitest.
   - Remove legacy Jinja2 and Bootstrap badges.
   - Add a clean text link to the Live Demo (`https://jakspt.github.io/carebase`) with a collapsible `<details>` block explaining how Hexagonal Architecture allows the frontend to run purely client-side via `InMemoryHospitalDataAdapter`.

2. **Executive Summary & 3 Pillars**:
   - Draft a concise executive summary highlighting:
     - Modern Angular 22 Architecture
     - Polyglot Persistence & Data Migration
     - Multi-Container DevOps & Infrastructure
   - Ensure the tone is clinical, professional, and free of emojis.

3. **System Architecture**:
   - Add a GitHub-native Mermaid graph visualizing client traffic routing through Nginx to the Angular SPA (`/`) and Flask API (`/api/`), as well as Flask database strategy delegation to MariaDB and MongoDB.

4. **Engineering Deep Dives**:
   - Draft scannable, bulleted breakdowns with bold keywords for:
     - **Frontend Architecture**: Signals, Hexagonal Architecture (`HospitalDataAccess`), Angular Material, Vitest component harnesses (link to `docs/adr/0003-frontend-testing-standards-and-harnesses.md`).
     - **Database Engineering & Migration**: Runtime Strategy Pattern, one-way automated migration, MongoDB Computed Pattern for doctor earnings (link to `docs/adr/0002-mongodb-computed-pattern-for-doctor-earnings.md`), hybrid appointment collection.
     - **DevOps & Infrastructure**: 5-container Compose topology, `condition: service_healthy` dependency chains, Nginx reverse proxy routing, volume persistence.

5. **UI & Demonstration Previews**:
   - Reference `demo/scheduling-demo.png` and `demo/analytics-demo.png` with descriptive captions. Preserve existing `.gif` files in `demo/`.

6. **Quickstart & User Roles**:
   - Replace wordy setup instructions with a 3-step Docker Compose quickstart.
   - Add a markdown table for Doctor, Clerk, and Admin user roles and features.

7. **Verification & Architecture Evolution**:
   - Add instructions for running Vitest frontend tests (`npm run test:run`).
   - Add a concluding note detailing the evolutionary rewrite from the original university Jinja2 monolith to the decoupled Angular SPA.
   - Enforce domain vocabulary strictly per `GLOSSARY.md` (no German leftovers).

## Verification

- `README.md` conforms to Prettier formatting (`npx prettier --check README.md`).
- All relative markdown links (`docs/adr/*`, `demo/*`, `compose.yaml`) resolve correctly.
- Zero deprecated German terms ("Arzt", "Sachbearbeiter", "SVNr", "Datenbank füllen", "Migration ausführen") remain in `README.md`.
- No emojis are present in `README.md`.

## Answer

Implemented in commit `0d8d4ba`, merged into `feat/readme-modernization` in `9df415c`, and refined following two-axis code review in `b11c3ec`.

- **Modern Badges & Live Demo**: Updated Shields.io badges for Angular 22, TypeScript, Python 3.13, Flask, MariaDB, MongoDB, Docker Compose, Nginx, and Vitest. Embedded link to `https://jakspt.github.io/carebase` with collapsible `<details>` explaining static compilation via `InMemoryHospitalDataAdapter`.
- **Executive Summary & 3 Pillars**: Concise, professional overview of Modern Angular Architecture, Polyglot Persistence & Data Migration, and DevOps & Multi-Container Infrastructure.
- **System Architecture**: Mermaid diagram visualizing reverse proxy routing and Strategy Pattern delegation (`Flask REST API` -> `DBStrategy` -> `MariaDBStrategy` / `MongoDBStrategy` -> database containers).
- **Engineering Deep Dives**: Detailed bullet points and collapsible `<details>` blocks for ADR 0001, ADR 0002, and ADR 0003.
- **UI Showcase**: Added references to `demo/scheduling-demo.png` and `demo/analytics-demo.png` while preserving existing GIFs.
- **Quickstart & User Role Matrix**: 3-step setup and clear matrix for Doctor, Clerk, and Admin.
- **Verification & Architecture Evolution**: Documented test and pre-commit execution, and documented evolutionary rewrite narrative from the Jinja2 monolith to decoupled Angular SPA.
- **Standards & Glossary**: 100% compliant with `GLOSSARY.md` (zero German terms), zero emojis, and verified with Prettier.
