import { describe, it, expect } from 'bun:test';
import { LispEnvironment, runLispScript, LispSymbol } from './lispEngine';
import { evaluateNodeWithLisp, setGlobalLispRulebook, DEFAULT_LISP_RULEBOOK } from './constitutionalRulebook';

describe('In-Browser Lisp S-Expression & Clojure Spec Engine', () => {
  it('evaluates s-expressions and arithmetic', () => {
    const env = new LispEnvironment();
    expect(runLispScript('(+ 10 20 30)', env)).toBe(60);
    expect(runLispScript('(- 100 40)', env)).toBe(60);
    expect(runLispScript('(<= 5 10)', env)).toBe(true);
    expect(runLispScript('(> 15 20)', env)).toBe(false);
  });

  it('evaluates Clojure Spec s/def and s/explain-data', () => {
    const env = new LispEnvironment();
    runLispScript(`
      (s/def ::max-lines
        (fn [node] (<= (:lines node) 10))
        "Lines cannot exceed 10")
    `, env);

    const validNode = { lines: 6 };
    const invalidNode = { lines: 14 };

    const validResult = runLispScript(`(s/explain-data ::max-lines ${JSON.stringify(validNode)})`, env);
    expect(validResult.passed).toBe(true);
    expect(validResult.problems.length).toBe(0);

    const invalidResult = runLispScript(`(s/explain-data ::max-lines ${JSON.stringify(invalidNode)})`, env);
    expect(invalidResult.passed).toBe(false);
    expect(invalidResult.problems[0].ruleName).toBe('max-lines');
    expect(invalidResult.problems[0].instruction).toBe('Lines cannot exceed 10');
  });

  it('enforces constitutional rules against real TypeScript snippets', () => {
    // 1. Compliant snippet
    const compliantCode = `
import { z } from "zod";
export const input = z.string();
export const output = z.string();
export function clean(s: string): string {
  return s.trim();
}
`;
    const compliantMetrics = evaluateNodeWithLisp(compliantCode);
    expect(compliantMetrics.status).toBe('verified');
    expect(compliantMetrics.violations.length).toBe(0);

    // 2. Snippet violating line budget (> 50 lines)
    const filler = Array.from({ length: 50 }, (_, i) => `  const line${i} = ${i};`).join('\n');
    const longCode = `
import { z } from "zod";
export const input = z.string();
export const output = z.string();
export function tooLong(x: string) {
${filler}
  return x;
}
`;
    const longMetrics = evaluateNodeWithLisp(longCode);
    expect(longMetrics.status).toBe('violated');
    expect(longMetrics.violations.some((v) => v.code === 'MAX_LINES')).toBe(true);

    // 3. Snippet using forbidden "let" mutation
    const mutationCode = `
import { z } from "zod";
export const input = z.number();
export const output = z.number();
export function calculate(val: number) {
  let counter = 0;
  counter += val;
  return counter;
}
`;
    const mutationMetrics = evaluateNodeWithLisp(mutationCode);
    expect(mutationMetrics.status).toBe('violated');
    expect(mutationMetrics.violations.some((v) => v.code === 'NO_MUTATION')).toBe(true);

    // 4. Snippet using "throw"
    const throwCode = `
import { z } from "zod";
export const input = z.string();
export const output = z.string();
export function risky(name: string) {
  if (!name) throw new Error("Missing name");
  return name;
}
`;
    const throwMetrics = evaluateNodeWithLisp(throwCode);
    expect(throwMetrics.status).toBe('violated');
    expect(throwMetrics.violations.some((v) => v.code === 'NO_UNHANDLED_THROW')).toBe(true);
  });
});
