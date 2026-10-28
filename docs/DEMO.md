# Five-minute demo

1. Run `npm ci`, `npm test`, `npm run build`, `npm start`. Visit http://localhost:3000.
2. Show the four overview cards. Explain the 51 → 48 + 1 + 2 reconciliation.
3. Click total revenue. Expand SQL and assumptions. Gross 1,443,700 minus discount 4,500 gives 1,439,200.
4. Click highest product and highest region: Monitor and South. Explain that ties are preserved.
5. Click monthly trend and January–June comparison: +1,000, +0.48%.
6. Ask an unsupported question (profit or weather). Show the explicit error.
7. Open Data quality. Show TXN0034 and TXN0051, and explain the returned TXN0033.
8. For an actual AI demonstration, install/start Ollama, pull llama3.2, enable AI_PROVIDER=ollama in .env and restart. Confirm a successful answer in LLM mode. Do not present deterministic demo mode as live AI.

## Explain the code

- `server/db.js`: validation, date and monetary conversion, insert and read-only protection.
- `server/interpret.js`: supported operations, month parsing, schema check and optional model.
- `server/analytics.js`: SQL, deterministic answer formatting and zero-baseline behavior.
- `server/app.js`: API validation, middleware and error status codes.
- `src/main.jsx`: form state, request lifecycle, evidence table and bar chart.

## Interview concepts mentioned in the problem statement

Generative AI creates outputs from learned patterns. An agent uses a model plus tools and control logic to accomplish tasks. RAG retrieves relevant external evidence before generation; vector retrieval uses embeddings, while vectorless retrieval can use SQL, keyword search or document structure. This app is bounded tool-like database analytics, not a general autonomous agent or vector RAG system. LangChain, Google ADK and Dify are frameworks/platforms for building AI workflows; none is needed for these five simple analytics operations.
