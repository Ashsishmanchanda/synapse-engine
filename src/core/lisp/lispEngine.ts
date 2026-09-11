/**
 * Project Synapse: Embedded Clojure/Lisp S-Expression & Spec Engine.
 * 
 * Implements an in-browser Lisp interpreter capable of:
 * 1. Evaluating s-expressions with gas limits (safe from infinite loops).
 * 2. Clojure-style keyword navigation: (:lines ast).
 * 3. Clojure Spec implementation: (s/def ...), (s/and ...), (s/valid? ...), (s/explain-data ...).
 * 4. Rich diagnostic emission when rules fail, feeding the AI surgical self-repair loop.
 */

export type LispValue =
  | number
  | string
  | boolean
  | null
  | LispSymbol
  | LispKeyword
  | LispValue[]
  | Record<string, any>
  | ((...args: any[]) => any);

export class LispSymbol {
  constructor(public name: string) {}
  toString() {
    return this.name;
  }
}

export class LispKeyword {
  constructor(public name: string) {}
  toString() {
    return `:${this.name}`;
  }
}

export interface SpecProblem {
  path: string[];
  pred: string;
  val: any;
  ruleName: string;
  instruction?: string;
}

export interface SpecExplainData {
  passed: boolean;
  problems: SpecProblem[];
}

export interface SpecDefinition {
  name: string;
  predicate: (val: any) => boolean;
  instruction?: string;
}

export class LispEnvironment {
  private bindings = new Map<string, any>();
  public specs = new Map<string, SpecDefinition>();
  public steps = 0;
  public maxSteps = 2500;

  constructor(public parent: LispEnvironment | null = null) {
    if (!parent) {
      this.initBuiltins();
    }
  }

  get(name: string): any {
    if (this.bindings.has(name)) {
      return this.bindings.get(name);
    }
    if (this.parent) {
      return this.parent.get(name);
    }
    return undefined;
  }

  set(name: string, value: any): void {
    this.bindings.set(name, value);
  }

  private initBuiltins() {
    // Arithmetic & Comparisons
    this.set('+', (...args: number[]) => args.reduce((a, b) => a + b, 0));
    this.set('-', (...args: number[]) => (args.length === 1 ? -args[0] : args.reduce((a, b) => a - b)));
    this.set('*', (...args: number[]) => args.reduce((a, b) => a * b, 1));
    this.set('/', (...args: number[]) => args.reduce((a, b) => a / b));
    this.set('<=', (a: number, b: number) => a <= b);
    this.set('>=', (a: number, b: number) => a >= b);
    this.set('<', (a: number, b: number) => a < b);
    this.set('>', (a: number, b: number) => a > b);
    this.set('=', (a: any, b: any) => a === b);
    this.set('not=', (a: any, b: any) => a !== b);

    // Logic
    this.set('not', (a: any) => !a);
    this.set('and', (...args: any[]) => args.every(Boolean));
    this.set('or', (...args: any[]) => args.some(Boolean));

    // Predicates & Inspection
    this.set('nil?', (a: any) => a === null || a === undefined);
    this.set('some?', (a: any) => a !== null && a !== undefined);
    this.set('empty?', (a: any) => {
      if (!a) return true;
      if (Array.isArray(a)) return a.length === 0;
      if (typeof a === 'object') return Object.keys(a).length === 0;
      return false;
    });
    this.set('count', (a: any) => {
      if (!a) return 0;
      if (Array.isArray(a)) return a.length;
      if (typeof a === 'string') return a.length;
      if (typeof a === 'object') return Object.keys(a).length;
      return 0;
    });

    // Clojure Spec Core Implementation
    this.set('s/def', (nameOrSymbol: any, predFnOrSpec: any, instruction?: string) => {
      const raw = nameOrSymbol instanceof LispSymbol || nameOrSymbol instanceof LispKeyword
        ? nameOrSymbol.name
        : String(nameOrSymbol);
      const name = raw.replace(/^:+/, '');

      const spec: SpecDefinition = {
        name,
        predicate: typeof predFnOrSpec === 'function' ? predFnOrSpec : () => true,
        instruction: instruction || `Violated specification ::${name}`,
      };
      this.specs.set(name, spec);
      return name;
    });

    this.set('s/and', (...specsOrFns: any[]) => {
      return (val: any) => {
        for (const item of specsOrFns) {
          if (typeof item === 'function') {
            if (!item(val)) return false;
          } else if (item instanceof LispSymbol || item instanceof LispKeyword || typeof item === 'string') {
            const specName = (typeof item === 'string' ? item : item.name).replace(/^:+/, '');
            const spec = this.specs.get(specName);
            if (spec && !spec.predicate(val)) return false;
          }
        }
        return true;
      };
    });

    this.set('s/valid?', (specNameOrFn: any, val: any) => {
      if (typeof specNameOrFn === 'function') {
        return Boolean(specNameOrFn(val));
      }
      const raw = specNameOrFn instanceof LispSymbol || specNameOrFn instanceof LispKeyword
        ? specNameOrFn.name
        : String(specNameOrFn);
      const name = raw.replace(/^:+/, '');
      const spec = this.specs.get(name);
      return spec ? Boolean(spec.predicate(val)) : false;
    });

    this.set('s/explain-data', (specNameOrFn: any, val: any): SpecExplainData => {
      const problems: SpecProblem[] = [];

      if (typeof specNameOrFn === 'function') {
        if (!specNameOrFn(val)) {
          problems.push({
            path: ['root'],
            pred: 'anonymous-predicate',
            val,
            ruleName: 'anonymous',
            instruction: 'Failed custom Lisp predicate assertion.',
          });
        }
      } else {
        const raw = specNameOrFn instanceof LispSymbol || specNameOrFn instanceof LispKeyword
          ? specNameOrFn.name
          : String(specNameOrFn);
        const name = raw.replace(/^:+/, '');

        const spec = this.specs.get(name);
        if (spec) {
          if (!spec.predicate(val)) {
            problems.push({
              path: [name],
              pred: `(s/valid? ::${name})`,
              val,
              ruleName: name,
              instruction: spec.instruction,
            });
          }
        }
      }

      return {
        passed: problems.length === 0,
        problems,
      };
    });
  }
}

/**
 * Tokenizes and reads Clojure/Lisp s-expressions.
 */
export function tokenizeLisp(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    // Skip whitespace & commas
    if (/\s|,/.test(ch)) {
      i++;
      continue;
    }

    // Skip comments (;)
    if (ch === ';') {
      while (i < input.length && input[i] !== '\n') i++;
      continue;
    }

    // Skip standalone colon used as JSON key-value separator (e.g. "key": 6 or "key":6)
    if (ch === ':' && (i + 1 >= input.length || /[\s,}\])"0-9\-{\[]/.test(input[i + 1]))) {
      i++;
      continue;
    }

    // Single-char delimiters
    if (ch === '(' || ch === ')' || ch === '[' || ch === ']' || ch === '{' || ch === '}') {
      tokens.push(ch);
      i++;
      continue;
    }

    // Strings
    if (ch === '"') {
      let str = '';
      i++;
      while (i < input.length && input[i] !== '"') {
        if (input[i] === '\\' && i + 1 < input.length) {
          i++;
          str += input[i];
        } else {
          str += input[i];
        }
        i++;
      }
      i++; // skip closing quote
      tokens.push(`"${str}"`);
      continue;
    }

    // Symbols, keywords, numbers
    let word = '';
    while (i < input.length && !/[\s,()\[\]{}"';]/.test(input[i])) {
      word += input[i];
      i++;
    }
    if (word) {
      tokens.push(word);
    }
  }

  return tokens;
}

export function parseLispTokens(tokens: string[]): any {
  if (tokens.length === 0) return null;

  function parseAtom(token: string): any {
    if (token === 'true') return true;
    if (token === 'false') return false;
    if (token === 'nil') return null;
    if (token.startsWith('"') && token.endsWith('"')) {
      return token.slice(1, -1);
    }
    if (token.startsWith(':')) {
      return new LispKeyword(token.replace(/^:+/, ''));
    }
    const num = Number(token);
    if (!isNaN(num)) return num;
    return new LispSymbol(token.replace(/^:+/, ''));
  }

  function readFromTokens(): any {
    if (tokens.length === 0) return null;
    const token = tokens.shift()!;

    if (token === '(') {
      const list: any[] = [];
      while (tokens.length > 0 && tokens[0] !== ')') {
        list.push(readFromTokens());
      }
      tokens.shift(); // consume ')'
      return list;
    }

    if (token === '[') {
      const vec: any[] = [];
      while (tokens.length > 0 && tokens[0] !== ']') {
        vec.push(readFromTokens());
      }
      tokens.shift(); // consume ']'
      return vec;
    }

    if (token === '{') {
      const map: Record<string, any> = {};
      while (tokens.length > 0 && tokens[0] !== '}') {
        const key = readFromTokens();
        const val = readFromTokens();
        const keyStr = (key instanceof LispKeyword || key instanceof LispSymbol ? key.name : String(key))
          .replace(/^:+/, '')
          .replace(/^"|"$/g, '');
        map[keyStr] = val;
      }
      tokens.shift(); // consume '}'
      return map;
    }

    return parseAtom(token);
  }

  return readFromTokens();
}

/**
 * Evaluates an AST s-expression within an environment.
 */
export function evalLisp(form: any, env: LispEnvironment): any {
  env.steps++;
  if (env.steps > env.maxSteps) {
    throw new Error(`[Lisp Gas Limit Exceeded] Rule evaluation halted at ${env.maxSteps} steps.`);
  }

  // Self-evaluating primitives
  if (typeof form === 'number' || typeof form === 'string' || typeof form === 'boolean' || form === null) {
    return form;
  }

  // Keywords (can act as property getter functions: (:lines ast))
  if (form instanceof LispKeyword) {
    return (targetMap: any) => {
      if (targetMap && typeof targetMap === 'object') {
        return targetMap[form.name] ?? targetMap[form.name.replace(/-/g, '_')] ?? targetMap[form.name.replace(/_/g, '-')];
      }
      return undefined;
    };
  }

  // Symbol resolution
  if (form instanceof LispSymbol) {
    const val = env.get(form.name);
    return val;
  }

  // Vector literal: evaluate elements
  if (Array.isArray(form) && (form as any)._isVector) {
    return form.map((x) => evalLisp(x, env));
  }

  // S-Expression List Call: (op arg1 arg2 ...)
  if (Array.isArray(form)) {
    if (form.length === 0) return [];

    const [first, ...rest] = form;

    // Special Form: fn
    if (first instanceof LispSymbol && first.name === 'fn') {
      const params = rest[0]; // e.g. [ast]
      const body = rest.slice(1);
      return (arg: any) => {
        const localEnv = new LispEnvironment(env);
        if (Array.isArray(params) && params.length > 0) {
          const paramName = params[0] instanceof LispSymbol ? params[0].name : String(params[0]);
          localEnv.set(paramName, arg);
        }
        let result: any = null;
        for (const expr of body) {
          result = evalLisp(expr, localEnv);
        }
        return result;
      };
    }

    // Special Form: defn
    if (first instanceof LispSymbol && first.name === 'defn') {
      const fnName = rest[0] instanceof LispSymbol ? rest[0].name : String(rest[0]);
      const params = rest[1];
      const body = rest.slice(2);
      const fn = evalLisp([new LispSymbol('fn'), params, ...body], env);
      env.set(fnName, fn);
      return fn;
    }

    // Special Form: let
    if (first instanceof LispSymbol && first.name === 'let') {
      const bindings = rest[0]; // [name val ...]
      const body = rest.slice(1);
      const localEnv = new LispEnvironment(env);
      if (Array.isArray(bindings)) {
        for (let i = 0; i < bindings.length; i += 2) {
          const name = bindings[i] instanceof LispSymbol ? bindings[i].name : String(bindings[i]);
          const val = evalLisp(bindings[i + 1], localEnv);
          localEnv.set(name, val);
        }
      }
      let result: any = null;
      for (const expr of body) {
        result = evalLisp(expr, localEnv);
      }
      return result;
    }

    // Special Form: s/def (Macro: identifier is not evaluated)
    if (first instanceof LispSymbol && (first.name === 's/def' || first.name === 'def')) {
      const rawName = rest[0];
      const name = (rawName instanceof LispSymbol || rawName instanceof LispKeyword
        ? rawName.name
        : String(rawName)).replace(/^:+/, '');
      const predForm = rest[1];
      const instruction = rest[2] ? evalLisp(rest[2], env) : undefined;
      const pred = evalLisp(predForm, env);

      const spec: SpecDefinition = {
        name,
        predicate: typeof pred === 'function' ? pred : () => true,
        instruction: instruction || `Violated specification ::${name}`,
      };
      env.specs.set(name, spec);
      return name;
    }

    // Special Form: s/explain-data (Macro: spec identifier is not evaluated)
    if (first instanceof LispSymbol && first.name === 's/explain-data') {
      const rawSpec = rest[0];
      const targetVal = evalLisp(rest[1], env);
      const specName = (rawSpec instanceof LispSymbol || rawSpec instanceof LispKeyword
        ? rawSpec.name
        : String(rawSpec)).replace(/^:+/, '');

      const spec = env.specs.get(specName);
      if (!spec) {
        return { passed: true, problems: [] };
      }
      const passed = Boolean(spec.predicate(targetVal));
      return {
        passed,
        problems: passed
          ? []
          : [
              {
                path: [specName],
                pred: `(s/valid? ::${specName})`,
                val: targetVal,
                ruleName: specName,
                instruction: spec.instruction,
              },
            ],
      };
    }

    // Evaluate operator
    const op = evalLisp(first, env);
    if (typeof op !== 'function') {
      throw new Error(`[Lisp Evaluation Error] '${first}' is not a function.`);
    }

    // Evaluate arguments
    const evaluatedArgs = rest.map((arg) => evalLisp(arg, env));
    return op(...evaluatedArgs);
  }

  // Map literal
  if (typeof form === 'object') {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(form)) {
      result[k] = evalLisp(v, env);
    }
    return result;
  }

  return form;
}

/**
 * Top-level convenience runner: parses and evaluates a Clojure/Lisp script.
 */
export function runLispScript(script: string, env: LispEnvironment): any {
  env.steps = 0; // reset gas limit
  const tokens = tokenizeLisp(script);
  let lastResult: any = null;

  while (tokens.length > 0) {
    const form = parseLispTokens(tokens);
    if (form !== null && form !== undefined) {
      lastResult = evalLisp(form, env);
    }
  }

  return lastResult;
}
