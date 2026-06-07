# Code Standards & Guardrails: Unimeds

## 1. Frontend Development Patterns (Next.js & TypeScript)
* **Type Safety:** Enforce absolute strict-mode TypeScript across components and hooks. Place explicit interface definitions inside a central `types/` directory mirroring database entity models.
* **State Boundaries:** * Keep client UI state isolated inside lightweight Zustand slices.
  * Delegate asynchronous server mutations completely to React Query.
* **Optimistic UI Engine:** Critical interactions (such as scheduling appointments) must utilize React Query `onMutate` lifecycles to update the UI instantly. Roll back state cleanly if backend validations return conflicts.

## 2. Backend Engineering Guidelines (Node.js & Python)
* **Data Operations:** All TypeScript database interactions must use Drizzle ORM query operators or structured builders. Raw SQL is restricted to complex migration scripts.
* **Authentication Validation:** Guard all protected route handlers with rigorous session check middleware. Validate tenant parameters explicitly to block cross-account data leaks.
* **FastAPI Async Routes:** Implement high-compute endpoints utilizing non-blocking asynchronous architectures (`async def`). 

## 3. Error Handling & Graceful Degradation
* **API Interceptors:** The frontend Axios client must evaluate response codes globally. Catch authorization failures to handle silent re-authentication flows gracefully.
* **Asynchronous Offloading:** When processing intensive OCR files, the backend must immediately return an HTTP `202 Accepted` status with a processing state object, allowing the frontend to poll status values without locking the active threads.