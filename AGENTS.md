# Antigravity Agent Guidelines for Synapse Engine

## 1. Project Overview & Philosophy
**Synapse Engine** is a constitutional visual IDE and blueprint engine designed to visually model and construct **Next.js 15 (App Router)** and **React 19** applications.

Instead of writing unmaintainable monolithic React components or generating bloated spaghetti code, Synapse enforces a **Constitutional Micro-Architecture**:
1. Every piece of logic is an atomic micro-node ($\le 30$ lines of code).
2. All dataflow wires between nodes are typed and validated by **Zod schemas**.
3. All code is verified in real-time by an in-browser **Lisp & Clojure Spec** constitutional gatekeeper.
4. Applications run as pure, modern Next.js 15 applications — not legacy single-file HTML bundles or `innerHTML` hacks.

---

## 2. The 4 Constitutional Laws
Whenever you generate or modify node code, you MUST adhere to the following laws:

- **Law I: Line Budget ($\le 30-50$ lines)**
  Micro-functions must remain atomic. If a node grows beyond its constitutional budget, it must be split into smaller composite nodes.
- **Law II: Zero Mutation (`const` only)**
  `let`, `var`, array mutations (`.push()`, `.splice()`), and object reassignments are strictly prohibited. Use pure functional pipelines (`.map()`, `.filter()`, spread operator).
- **Law III: Zero `this` / Object-Oriented State**
  No classes, no `this` references, no hidden instance state. State is immutable data passed through pure functions.
- **Law IV: Strict Zod Contracts**
  Every port must declare explicit Zod contracts (e.g. `z.string()`, `z.number()`, `z.object({...})`). Untyped `any` wires are disallowed in production graphs.

---

## 3. Tech Stack & Directory Structure
- **Framework**: Next.js 15.5+ (App Router), React 19.3.0
- **Visual Canvas**: `@xyflow/react` (ReactFlow v12)
- **Validation**: Zod 3.25+
- **Styling**: Tailwind CSS 3.4+ (curated dark-mode design tokens: amber, orange, slate, emerald)
- **Runtime & Tests**: Bun 1.4+ (`bun test`, `bun run dev`)

```
synapse-engine/
├── app/
│   ├── globals.css           # Tailwind base styles and dark tokens
│   ├── layout.tsx            # Clean root layout with Inter font
│   └── page.tsx              # Dual Studio (Blueprint Canvas & Live Next.js App)
├── src/
│   ├── core/
│   │   ├── lisp/             # In-Browser Lisp S-Expression & Clojure Spec Engine
│   │   ├── ast/              # TypeScript AST Extractor & Metric Analyzer
│   │   └── contracts/        # Zod Wire Contract Validator
│   ├── components/
│   │   ├── Nodes/            # CodeSnippetNode & GroupInterfaceNode (ReactFlow)
│   │   ├── Edges/            # ZodWireEdge (typed dataflow connection)
│   │   └── Editor/           # Zero-dependency React 19 MiniCodeEditor
│   └── types/                # Core engine TypeScript interfaces
└── public/
    └── assets/               # Seamless 1600x1600 Walnut board & official vector chess pieces
```

---

## 4. Key CLI Commands
- `bun run dev`: Start Next.js dev server on port 3000 (`http://localhost:3000`)
- `bun test`: Run all 13 core engine unit tests (Lisp engine, Clojure Spec, Zod contracts)
- `bun run build`: Validate Next.js production build

---

## 5. Architectural Context & History
- **Prior Research**: In earlier prototypes (`research-node-based`), an experiment used standalone HTML bundles with Hiccup `innerHTML` compilation. That research is preserved in the parent repo, but **Synapse Engine** strictly targets **modern Next.js 15 App Router & React 19**.
- **Gold Standard Demo**: The engine features a fully functional Walnut Chess application modeled as 7 micro-nodes, proving that complex real-world apps can be built from atomic constitutional components.
