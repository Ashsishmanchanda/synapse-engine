import { 
  LispEnvironment, 
  runLispScript, 
  evalLisp, 
  LispSymbol 
} from './lispEngine';
import { extractASTMetrics } from '../ast/astExtractor';
import { NodeRuleMetrics, RuleViolation } from '../../types';

export const DEFAULT_LISP_RULEBOOK = `;; =========================================================
;; SYNAPSE CONSTITUTIONAL LISP RULEBOOK
;; Rules created by the creator to govern AI and developers
;; =========================================================

;; Logic & General Laws
(s/def ::max-lines
  (fn [ast] (<= (:effective-lines ast) 50))
  "Function exceeds the 50-line budget. Split logic into sequential nodes.")

(s/def ::max-statements
  (fn [ast] (<= (:statement-count ast) 40))
  "Function exceeds 40 AST statements. Extract intermediate calculations into an upstream helper node.")

(s/def ::no-mutation
  (fn [ast] (and (not (:has-let ast)) (not (:has-var ast))))
  "Mutable variable declaration (let / var) detected. Only const and pure dataflow allowed.")

(s/def ::no-hidden-state
  (fn [ast] (not (:has-this ast)))
  "Hidden state detected via 'this'. Nodes must be pure functions with explicit wire inputs.")

(s/def ::no-unhandled-throw
  (fn [ast] (not (:has-throw ast)))
  "Throwing exceptions is prohibited. Model failure as a typed result wired to an error port.")

(s/def ::typed-zod-contracts
  (fn [ast] (and (:has-input-zod ast) (:has-output-zod ast)))
  "Missing Zod contract. Node must export 'input' and 'output' Zod schemas.")

;; Visual UI Laws (category: 'ui')
(s/def ::zero-dom-manipulation
  (fn [ast] (not (:has-dom-manipulation ast)))
  "Direct DOM manipulation (document/window/innerHTML) prohibited. Views must return pure Hiccup data.")

(s/def ::single-component-per-node
  (fn [ast] (<= (:component-count ast) 1))
  "Multiple UI components declared in a single node. Factor each visual atom into its own node.")

(s/def ::allowed-ui-tags
  (fn [ast] (not (:has-forbidden-ui-tags ast)))
  "Disallowed UI tag detected. Only headless primitive tokens (:grid, :tile, :card, :button, :text, :table, :sprite, :badge, :sparkline, :chart, :stat, :nav, :header, :footer, :row, :column, :input, :tabs, :tab, :metric) allowed.")

(s/def ::token-compliance
  (fn [ast] (not (:has-raw-hex-colors ast)))
  "Hardcoded hex or rgb color detected. Use design tokens (token:*) instead.")

(s/def ::max-ui-depth
  (fn [ast] (<= (:max-ui-depth ast) 10))
  "UI hierarchy nesting depth exceeds 10 levels. Decompose nested containers into upstream UI nodes.")
`;

// Shared cached environment preloaded with the default rulebook
let globalRulebookScript = DEFAULT_LISP_RULEBOOK;
let cachedEnv: LispEnvironment | null = null;

export function setGlobalLispRulebook(newScript: string): void {
  globalRulebookScript = newScript;
  cachedEnv = null; // force recompile on next check
}

export function getGlobalLispRulebook(): string {
  return globalRulebookScript;
}

function getInitializedEnv(): LispEnvironment {
  if (!cachedEnv) {
    cachedEnv = new LispEnvironment();
    try {
      runLispScript(globalRulebookScript, cachedEnv);
    } catch (err) {
      console.error('[Lisp Rulebook Compile Error]', err);
    }
  }
  return cachedEnv;
}

/**
 * Evaluates a TypeScript code snippet against the active in-browser Lisp rulebook.
 * Returns rich NodeRuleMetrics with exact Clojure Spec diagnostic problems.
 */
export function evaluateNodeWithLisp(code: string, category: string = 'transform'): NodeRuleMetrics {
  const ast = extractASTMetrics(code);
  const env = getInitializedEnv();
  const violations: RuleViolation[] = [];

  const isUiNode = category === 'ui' || code.includes(':tile') || code.includes(':grid') || code.includes(':card');

  const specNames = isUiNode
    ? [
        'max-lines',
        'no-mutation',
        'no-hidden-state',
        'zero-dom-manipulation',
        'single-component-per-node',
        'allowed-ui-tags',
        'token-compliance',
        'max-ui-depth',
      ]
    : [
        'max-lines',
        'max-statements',
        'no-mutation',
        'no-hidden-state',
        'no-unhandled-throw',
        'typed-zod-contracts',
      ];

  const explainDataFn = env.get('s/explain-data');

  if (explainDataFn) {
    for (const specName of specNames) {
      const spec = env.specs.get(specName);
      if (!spec) continue;

      try {
        const result = explainDataFn(new LispSymbol(specName), ast);
        if (result && !result.passed && Array.isArray(result.problems)) {
          for (const problem of result.problems) {
            let fix = '';
            if (specName === 'max-lines') {
              fix = `Split after line ${Math.ceil(ast['effective-lines'] / 2)} into two sequential nodes.`;
            } else if (specName === 'max-statements') {
              fix = 'Decompose complex expressions into upstream helper nodes.';
            } else if (specName === 'no-mutation') {
              fix = 'Replace "let" or "var" with "const" and immutable transforms.';
            } else if (specName === 'no-hidden-state') {
              fix = 'Pass all state explicitly through input ports.';
            } else if (specName === 'no-unhandled-throw') {
              fix = 'Return { error: "..." } to wire to the red err port.';
            } else if (specName === 'typed-zod-contracts') {
              fix = 'Add "export const input = z.string();" and "export const output = ...".';
            } else if (specName === 'zero-dom-manipulation') {
              fix = 'Remove direct DOM references (document/window). Return pure Hiccup data vectors.';
            } else if (specName === 'single-component-per-node') {
              fix = 'Factor out extra UI components into separate upstream atomic nodes.';
            } else if (specName === 'allowed-ui-tags') {
              fix = 'Use only approved headless primitives (:grid, :tile, :card, :button, :text, :table, :sprite).';
            } else if (specName === 'token-compliance') {
              fix = 'Replace raw hex color with design token (e.g. token:surface, token:primary).';
            } else if (specName === 'max-ui-depth') {
              fix = 'Decompose nested UI container hierarchy into separate child component nodes.';
            }

            violations.push({
              code: specName.toUpperCase().replace(/-/g, '_'),
              severity: 'error',
              message: problem.instruction || `Violated Lisp specification ::${specName}`,
              fixSuggestion: fix,
            });
          }
        }
      } catch (err) {
        console.warn(`[Spec Check Error on ${specName}]`, err);
      }
    }
  }

  const hasErrors = violations.some((v) => v.severity === 'error');
  const hasWarnings = violations.some((v) => v.severity === 'warning');

  let status: NodeRuleMetrics['status'] = 'verified';
  if (hasErrors) {
    status = 'violated';
  } else if (hasWarnings || ast['effective-lines'] >= 42) {
    status = 'warning';
  }

  return {
    lines: ast['effective-lines'],
    maxLines: 50,
    statements: ast['statement-count'],
    maxStatements: 40,
    maxCharsPerLine: ast['max-chars-per-line'],
    hasMutation: ast['has-let'] || ast['has-var'],
    hasThis: ast['has-this'],
    hasThrow: ast['has-throw'],
    status,
    violations,
  };
}
