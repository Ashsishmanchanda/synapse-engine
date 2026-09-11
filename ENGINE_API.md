# Synapse Engine: Headless API Documentation
**The Constitutional App Factory for Next.js 15 & React 19**

Welcome to the Synapse Engine API. When building applications using Synapse:
> **RULE #1**: The engine files are 100% immutable. Never edit engine source code.
> **RULE #2**: All applications must be built exclusively by sending JSON requests to the Headless API endpoints below.

---

## 1. The 4 Constitutional Laws
Every node submitted to `POST /api/nodes` is verified by the in-browser Lisp / Clojure Spec engine before it is accepted. If your code violates any law, the API will reject it with `HTTP 422 Unprocessable Entity` and provide repair instructions.

1. **Law I: Line Budget ($\le 50$ effective lines)**
   * Micro-nodes must remain atomic. If logic exceeds 50 lines, split it into sequential nodes.
2. **Law II: Zero Mutation (`const` only)**
   * `let`, `var`, array mutations (`.push()`, `.splice()`), and object reassignments are strictly prohibited.
   * Use pure functional pipelines: `.map()`, `.filter()`, and object spread `{ ...state }`.
3. **Law III: Zero `this` / Hidden State**
   * No classes, no `this` references. State must be immutable data passed through pure functions.
4. **Law IV: Strict Zod Contracts**
   * Every node must declare explicit input and output Zod schemas (e.g. `z.string()`, `z.number()`, `z.object({...})`).

---

## 2. API Endpoints Reference

### A. Inspect Current Canvas
* **`GET /api/graph`**
  * Returns the full blueprint topology, nodes, wires, and validation statuses.
  * **Response**:
    ```json
    {
      "success": true,
      "graph": {
        "version": "1.0.0",
        "activeApp": "walnut-chess",
        "nodes": [...],
        "wires": [...]
      }
    }
    ```

* **`DELETE /api/graph`**
  * Clears the current canvas to a blank state.
  * Optional query param: `?reset=seed` resets to the Walnut Chess showcase.

---

### B. Mount or Update a Micro-Node
* **`POST /api/nodes`**
  * Validates code against the Lisp Constitution and automatically positions the node using the CAD Auto-Layout Engine.
  * **Payload**:
    ```json
    {
      "id": "n-pricing-card",
      "domain": "saas",
      "module": "billing",
      "action": "render-card",
      "title": "Pricing Card Component",
      "category": "ui",
      "code": "import { z } from 'zod';\nexport const input = z.object({ tier: z.string(), price: z.number() }), output = z.any();\n\nexport function renderPricingCard(plan: { tier: string; price: number }) {\n  return { title: plan.tier, cost: '$' + plan.price };\n}",
      "inputs": [
        { "id": "in-plan", "name": "in.plan", "typeSchema": "z.object({ tier: z.string(), price: z.number() })", "direction": "in" }
      ],
      "outputs": [
        { "id": "out-vdom", "name": "out.vdom", "typeSchema": "z.any()", "direction": "out" }
      ]
    }
    ```
  * **Valid Categories**:
    * `'state'`: Data sources, stores, initial states (placed in CAD Column 0).
    * `'transform'`: Parsers, data normalizers, validators (placed in CAD Column 1).
    * `'logic'`: Business rules, calculators, reducers (placed in CAD Column 2).
    * `'ui'`: Visual components, views, cards, tables (placed in CAD Column 3).
  * **Success Response (`HTTP 201 Created`)**:
    ```json
    { "success": true, "message": "Node mounted successfully", "node": { ... } }
    ```
  * **Constitutional Violation Response (`HTTP 422 Unprocessable Entity`)**:
    ```json
    {
      "success": false,
      "error": "CONSTITUTIONAL_VIOLATION",
      "message": "Node rejected by Synapse Constitutional Gatekeeper",
      "ruleMetrics": {
        "status": "violated",
        "violations": [
          { "code": "::no-mutation", "message": "Mutable variable declaration (let / var) detected. Only const and pure dataflow allowed." }
        ]
      }
    }
    ```

* **`DELETE /api/nodes?id={nodeId}`**
  * Deletes a node and automatically cascades removal of attached wires.

---

### C. Connect Ports via Typed Wires
* **`POST /api/wires`**
  * Connects an output port of a source node to an input port of a target node.
  * Checks schema compatibility before connecting.
  * **Payload**:
    ```json
    {
      "source": "n-pricing-source",
      "sourceHandle": "out-plan",
      "target": "n-pricing-card",
      "targetHandle": "in-plan",
      "sourceSchema": "z.object({ tier: z.string(), price: z.number() })",
      "targetSchema": "z.object({ tier: z.string(), price: z.number() })"
    }
    ```
  * **Success Response (`HTTP 201 Created`)**:
    ```json
    { "success": true, "message": "Wire connected successfully", "wire": { ... } }
    ```
  * **Type Mismatch Response (`HTTP 422 TypeMismatch`)**:
    ```json
    {
      "success": false,
      "error": "WIRE_CONTRACT_MISMATCH",
      "message": "Type mismatch: Source outputs z.string(), but Target expects z.number()."
    }
    ```

---

### D. Synthesize & Export Standalone Next.js 15 App
* **`POST /api/export`**
  * Compiles the visual blueprint into a clean, standalone Next.js 15 App Router repository.
  * **Payload** (optional):
    ```json
    { "targetDirName": "my-client-saas" }
    ```
  * **Success Response (`HTTP 200 OK`)**:
    ```json
    {
      "success": true,
      "message": "Next.js 15 application synthesized and exported successfully",
      "result": {
        "exportPath": "/path/to/exports/my-client-saas",
        "filesGenerated": [
          "package.json",
          "tsconfig.json",
          "next.config.mjs",
          "tailwind.config.ts",
          "app/globals.css",
          "app/layout.tsx",
          "app/page.tsx",
          "components/nodes/...",
          "lib/contracts/schemas.ts"
        ],
        "nodeCount": 5,
        "wireCount": 4
      }
    }
    ```

---

## 3. How to Build an App from Scratch (The 4 Steps)

1. **Step 1: Clear canvas**:
   `curl -X DELETE http://localhost:3000/api/graph`
2. **Step 2: Mount your nodes**:
   Send each atomic micro-function ($\le 50$ lines) via `POST /api/nodes`. If the engine returns 422, read the fix instruction, correct the code, and resend.
3. **Step 3: Wire your ports**:
   Connect the dataflow via `POST /api/wires`.
4. **Step 4: Export your Next.js 15 app**:
   Call `POST /api/export` to generate the standalone production codebase ready for deployment to Vercel!
