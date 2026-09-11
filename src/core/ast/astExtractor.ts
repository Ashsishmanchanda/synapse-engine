import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

// Handle ES module default export shape for babel traverse
const traverse = (traverseModule as any).default || traverseModule;

export interface ExtractedASTMetrics {
  'effective-lines': number;
  'statement-count': number;
  'max-chars-per-line': number;
  'has-let': boolean;
  'has-var': boolean;
  'has-this': boolean;
  'has-throw': boolean;
  'has-input-zod': boolean;
  'has-output-zod': boolean;
  'cyclomatic-complexity': number;
  'raw-lines': string[];
  'has-dom-manipulation': boolean;
  'component-count': number;
  'has-forbidden-ui-tags': boolean;
  'has-raw-hex-colors': boolean;
  'max-ui-depth': number;
}

const ALLOWED_UI_TAGS = new Set([
  ':grid', ':tile', ':card', ':button', ':text', ':table', ':sprite',
  ':row', ':column', ':input', ':badge', ':sparkline', ':chart', ':stat',
  ':nav', ':header', ':footer', ':section', ':tab', ':tabs', ':metric', ':icon',
  'grid', 'tile', 'card', 'button', 'text', 'table', 'sprite',
  'row', 'column', 'input', 'badge', 'sparkline', 'chart', 'stat',
  'nav', 'header', 'footer', 'section', 'tab', 'tabs', 'metric', 'icon'
]);

const DOM_GLOBALS = new Set([
  'document', 'window', 'localStorage', 'sessionStorage', 'location',
  'innerHTML', 'outerHTML', 'querySelector', 'querySelectorAll', 'getElementById'
]);

/**
 * Calculates maximum array nesting depth of AST nodes (representing Hiccup structures).
 */
function calculateArrayDepth(node: any): number {
  if (!node || node.type !== 'ArrayExpression') return 0;
  let maxChildDepth = 0;
  for (const el of node.elements) {
    if (el && el.type === 'ArrayExpression') {
      const d = calculateArrayDepth(el);
      if (d > maxChildDepth) maxChildDepth = d;
    }
  }
  return 1 + maxChildDepth;
}

/**
 * Parses TypeScript node snippet using Babel parser and extracts deep structural metrics
 * into a Clojure-compatible map.
 */
export function extractASTMetrics(code: string): ExtractedASTMetrics {
  const rawLines = code.split('\n');
  const effectiveLines = rawLines.filter((l) => {
    const t = l.trim();
    return t.length > 0 && !t.startsWith('//') && !t.startsWith('/*');
  });

  let maxChars = 0;
  rawLines.forEach((l) => {
    if (l.length > maxChars) maxChars = l.length;
  });

  let statementCount = 0;
  let hasLet = false;
  let hasVar = false;
  let hasThis = false;
  let hasThrow = false;
  let hasInputZod = false;
  let hasOutputZod = false;
  let complexity = 1;
  let hasDomManipulation = false;
  let componentCount = 0;
  let hasForbiddenUiTags = false;
  let hasRawHexColors = false;
  let maxUiDepth = 0;

  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });

    traverse(ast, {
      VariableDeclaration(path: any) {
        statementCount++;
        if (path.node.kind === 'let') hasLet = true;
        if (path.node.kind === 'var') hasVar = true;
      },
      ExpressionStatement() {
        statementCount++;
      },
      ReturnStatement(path: any) {
        statementCount++;
        if (path.node.argument && path.node.argument.type === 'ArrayExpression') {
          const depth = calculateArrayDepth(path.node.argument);
          if (depth > maxUiDepth) maxUiDepth = depth;
        }
      },
      FunctionDeclaration(path: any) {
        const name = path.node.id?.name || '';
        if (name.startsWith('render') || name.startsWith('UI') || name.startsWith('Component')) {
          componentCount++;
        }
      },
      FunctionExpression(path: any) {
        const name = path.parent?.id?.name || '';
        if (name.startsWith('render') || name.startsWith('UI') || name.startsWith('Component')) {
          componentCount++;
        }
      },
      ArrowFunctionExpression(path: any) {
        const name = path.parent?.id?.name || '';
        if (name.startsWith('render') || name.startsWith('UI') || name.startsWith('Component')) {
          componentCount++;
        }
      },
      ThisExpression() {
        hasThis = true;
      },
      ThrowStatement() {
        statementCount++;
        hasThrow = true;
      },
      IfStatement() {
        statementCount++;
        complexity++;
      },
      ConditionalExpression() {
        complexity++;
      },
      LogicalExpression() {
        complexity++;
      },
      Identifier(path: any) {
        if (DOM_GLOBALS.has(path.node.name)) {
          hasDomManipulation = true;
        }
      },
      MemberExpression(path: any) {
        const prop = path.node.property?.name;
        if (prop && DOM_GLOBALS.has(prop)) {
          hasDomManipulation = true;
        }
      },
      StringLiteral(path: any) {
        const val = path.node.value;
        // Check for raw hex colors outside design tokens
        if (/^#([0-9a-fA-F]{3,8})$/.test(val) || /^rgba?\(/i.test(val)) {
          hasRawHexColors = true;
        }
        // Check for disallowed HTML tags in Hiccup position
        if (val.startsWith(':') || ['div', 'span', 'p', 'table', 'section', 'h1', 'h2', 'script', 'iframe', 'style'].includes(val)) {
          if (!ALLOWED_UI_TAGS.has(val) && ['div', 'span', 'p', 'section', 'h1', 'h2', 'script', 'iframe', 'style'].includes(val)) {
            hasForbiddenUiTags = true;
          }
        }
      },
      ExportNamedDeclaration(path: any) {
        const declaration = path.node.declaration;
        if (declaration && declaration.type === 'VariableDeclaration') {
          for (const decl of declaration.declarations) {
            if (decl.id && decl.id.type === 'Identifier') {
              if (decl.id.name === 'input') hasInputZod = true;
              if (decl.id.name === 'output') hasOutputZod = true;
            }
          }
        }
      },
    });
  } catch (err) {
    // Fallback heuristic if snippet is incomplete while actively typing
    statementCount = (code.match(/;|\bconst\b|\breturn\b/g) || []).length;
    hasLet = /\blet\s+/.test(code);
    hasVar = /\bvar\s+/.test(code);
    hasThis = /\bthis\b/.test(code);
    hasThrow = /\bthrow\b/.test(code);
    hasInputZod = /\binput\s*=\s*z\./.test(code);
    hasOutputZod = /\boutput\s*=\s*z\./.test(code);
    hasDomManipulation = /\b(document|window|localStorage|sessionStorage|innerHTML|querySelector|getElementById)\b/.test(code);
    hasRawHexColors = /#([0-9a-fA-F]{3,8})\b/.test(code);
    hasForbiddenUiTags = /['":](div|span|p|section|script|iframe|style)['"]/.test(code);
    componentCount = (code.match(/\b(?:function|const)\s+(?:render|UI)/g) || []).length;
    maxUiDepth = (code.match(/\[\s*\[/g) || []).length > 0 ? 2 : 1;
  }

  return {
    'effective-lines': effectiveLines.length,
    'statement-count': statementCount,
    'max-chars-per-line': maxChars,
    'has-let': hasLet,
    'has-var': hasVar,
    'has-this': hasThis,
    'has-throw': hasThrow,
    'has-input-zod': hasInputZod,
    'has-output-zod': hasOutputZod,
    'cyclomatic-complexity': complexity,
    'raw-lines': rawLines,
    'has-dom-manipulation': hasDomManipulation,
    'component-count': componentCount,
    'has-forbidden-ui-tags': hasForbiddenUiTags,
    'has-raw-hex-colors': hasRawHexColors,
    'max-ui-depth': maxUiDepth,
  };
}
