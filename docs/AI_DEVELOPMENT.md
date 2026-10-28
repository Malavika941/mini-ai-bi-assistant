# AI-assisted development report

## Tools and use

ChatGPT/Codex was used to read the problem statement, propose stack choices, transcribe the supplied table, implement React/Express/SQLite, design a bounded interpretation mechanism, create tests, inspect failures, and write documentation. The user selected React + Node.js/Express + SQLite. AI generated substantial portions of the code; this report does not claim the candidate independently authored or has already mastered them.

The application also contains an optional Ollama LLM adapter for runtime intent classification. Default demo mode is rule-based. Live model execution has not been validated in this development environment; the adapter was tested with controlled mock responses.

## Problems and debugging

1. Initial expected values in draft tests had arithmetic mistakes. SQLite totals were cross-checked with an independent Decimal-based calculation, and the test expectations were corrected. Final net revenue is 1,439,200.
2. Data anomalies required explicit policy decisions: one return, one zero quantity and one missing unit price. The import audit accounts for all rows; no values were imputed.
3. Free-form model output could introduce unsupported SQL or silently change a question. The implementation only accepts a small JSON plan, validates it against a rule-based semantic interpretation, and executes fixed queries.
4. Network restrictions prevented npm registry access in the shell. Existing cached packages were installed offline using a writable cache copy. A test-client dependency unavailable in the cache was replaced by native fetch-based integration tests.
5. The sandboxed shell could not bind a local HTTP port. The available Node runtime was used to execute the same API tests with the project's Node binary; all 18 passed.
6. GitHub repository creation was unavailable through the connector. The CLI had an invalid credential for a different account, and browser automation failed. The user subsequently created the repository, allowing publication through the connected GitHub account.

## Validation

18 automated tests passed and the Vite production bundle built successfully. The six monthly totals were independently reconciled. LLM tests cover successful classification, conflicting plans, malformed JSON and provider outage. Browser visual verification and live model inference remain to be completed locally.

## With another day

Run and evaluate a local model against a corpus of paraphrases; expand validated filters without silently dropping semantics; add browser interaction tests and accessibility checks; use a maintained CSV parser for generalized imports; add import preview and downloadable audit records; support configurable accounting/currency policies; add authentication and rate limits before public deployment.

## Candidate preparation

Before submitting, run the demo, read the code, and be prepared to explain why SQL computes the figures, how the model is constrained, why returned rows are excluded, how money is represented, and how missing data differs from zero. Update this report with any additional work you personally perform.
