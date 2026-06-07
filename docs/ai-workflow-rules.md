# AI Workflow Rules & Guardrails: Unimeds

## 1. LLM Generation Guardrails
When generating application logic, code blocks, or system routing architectures for Unimeds, the generating LLM must abide completely by the instructions detailed below.

## 2. Core Technical Constraints
* **Authentication Stack:** Never output code using third-party auth platforms other than **Auth.js (NextAuth)**. Ensure session wrappers extract valid custom access tokens properly.
* **Storage Stack:** Do not implement cloud-native vendor code (like AWS S3 SDKs) for asset workflows. All asset processing routines must communicate directly with **Cloudinary** signed storage configurations.
* **Data Access Layer:** All data mutations and entity definitions must utilize **Drizzle ORM** syntactic standards over a serverless **NeonDB** PostgreSQL architecture.

## 3. AI Safety & Medical Boundary Guardrails
* **Strict Diagnostic Ban:** Systems processing text pipelines or running LangGraph workflows must have hard-coded system instructions completely blocking diagnostic logic, treatment prescriptions, or critical clinical determinations.
* **Refusal Architecture:** If an evaluation framework detects a patient prompt requesting direct clinical advice, the agent runtime must immediately execute a structured refusal pattern, returning a localized message guiding the end-user to book an explicit consultation block using the platform's booking wizard.