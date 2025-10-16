## Quick context

This repository contains an architecture plan for a microservices project named "ServiciosYa" (in `README.md`). The repo currently holds design documentation rather than runnable services. Use this file to orient AI coding agents to the project's intent, conventions, and where to look for follow-up information.

## Big picture

- The system is designed as a set of microservices: AuthService, CatalogService, BookingService, NotificationService, AdminService. See `README.md` for rationale and event examples.
- Communication mix: REST (API Gateway) for external-facing endpoints, gRPC for internal high-performance service-to-service calls, a message broker (RabbitMQ or Kafka) for event-driven async flows, and WebSockets for real-time features.

## What to do first (when asked to implement features)

1. Read `README.md` top-to-bottom to understand intended services and events (e.g., `SERVICE_REQUESTED`, `PROFILE_UPDATED`).
2. Ask the user which microservice to implement or modify and which language/runtime they prefer (not present in repo). Reasonable defaults: Node.js (Express + gRPC libs), Python (FastAPI + grpcio) or Java/Spring Boot.
3. If the task involves events, confirm whether RabbitMQ or Kafka should be used; default to RabbitMQ for simpler setups.

## Project-specific conventions and patterns

- Event names are UPPER_SNAKE_CASE (e.g., `SERVICE_REQUESTED`). Use these when publishing/subscribing.
- Treat each microservice as a single-purpose app following 12Factor rules (config via env vars, logs to stdout).
- Prefer gRPC for internal sync endpoints and REST for external APIs.

## Important files and where to look

- `README.md` — the authoritative design/architecture plan currently in repo.
- `.github/` — place to add contribution docs, CI workflows, and agent instructions (this file).

## Examples (how to implement small tasks)

- Example 1: Add a REST endpoint to BookingService
  - Confirm language, scaffold a minimal service project, add a POST /requests route that validates input and emits a `SERVICE_REQUESTED` event to the broker.

- Example 2: Implement NotificationService subscriber
  - Create a worker that subscribes to `SERVICE_REQUESTED` and sends a placeholder notification (log to stdout). Use env var for broker URL.

## Build / test / debug notes (repo currently lacks code)

- No build or test scripts are present. Always ask for the target language/runtime before adding CI or package manifests.
- When creating services, follow these defaults unless instructed otherwise:
  - Node.js: include `package.json`, ESLint, and simple `npm test` with Jest.
  - Python: include `pyproject.toml` or `requirements.txt` and pytest.

## Integration points to confirm with the user

- Preferred programming language and runtime for services.
- Choice of message broker: RabbitMQ (default) or Kafka.
- Whether to use Docker / docker-compose for local dev and whether to target Kubernetes manifests.

## Follow-up questions for maintainers

1. Which microservice should be scaffolded or implemented first? (Auth, Catalog, Booking, Notification, Admin)
2. Preferred language/runtime and CI expectations.
3. Any existing API schemas, protobuf files, or sample data to import?

## When merging or changing this file

- Preserve the architecture summary in `README.md`. Only update this file when new concrete code, build scripts, or CI are added to the repo.

---
If any of the assumptions above are incorrect (for example you already have service code in another branch), tell me which language and which service to focus on and I will scaffold a minimal, runnable example.
