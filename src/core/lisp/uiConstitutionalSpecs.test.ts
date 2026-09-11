import { describe, it, expect } from 'bun:test';
import { evaluateNodeWithLisp } from './constitutionalRulebook';

describe('Constitutional Lisp UI Specifications', () => {
  it('approves a valid atomic Hiccup UI node <= 10 lines with design tokens', () => {
    const code = `
export function renderSquare(props) {
  return [
    ':tile',
    { pos: props.coord, active: props.active, 'on-click': ['SELECT', props.coord] },
    props.piece ? [':sprite', { piece: props.piece }] : null
  ];
}
`;
    const metrics = evaluateNodeWithLisp(code, 'ui');
    expect(metrics.status).toBe('verified');
    expect(metrics.violations).toHaveLength(0);
    expect(metrics.lines).toBeLessThanOrEqual(10);
  });

  it('rejects a UI node that performs direct DOM manipulation', () => {
    const code = `
export function renderSquare(props) {
  const el = document.getElementById('board');
  return [':tile', { pos: props.coord }];
}
`;
    const metrics = evaluateNodeWithLisp(code, 'ui');
    expect(metrics.status).toBe('violated');
    const domViolation = metrics.violations.find((v) => v.code === 'ZERO_DOM_MANIPULATION');
    expect(domViolation).toBeDefined();
    expect(domViolation?.fixSuggestion).toContain('Remove direct DOM references');
  });

  it('rejects a UI node using hardcoded hex colors instead of tokens', () => {
    const code = `
export function renderSquare(props) {
  return [':tile', { style: { background: '#ffffff' } }];
}
`;
    const metrics = evaluateNodeWithLisp(code, 'ui');
    expect(metrics.status).toBe('violated');
    const tokenViolation = metrics.violations.find((v) => v.code === 'TOKEN_COMPLIANCE');
    expect(tokenViolation).toBeDefined();
    expect(tokenViolation?.fixSuggestion).toContain('Replace raw hex color with design token');
  });

  it('approves a rich modern Hiccup UI node within the 50-line constitutional budget', () => {
    const code = `
export function renderDashboardWidget(props) {
  const brand = [':text', { variant: 'gradient-cyan', weight: 'bold' }, 'DELTA METRICS'];
  const badge = [':badge', { variant: 'success', dot: true }, 'ONLINE'];
  const topNav = [':header', {}, brand, badge];
  const stat1 = [':stat', { label: '24h Vol', value: '$1.4M', delta: '+8.2%' }];
  const stat2 = [':stat', { label: 'Slippage', value: '0.02%', delta: 'Optimal' }];
  const chart = [':sparkline', { points: [10, 20, 15, 30, 25, 40] }];
  const btn = [':button', { variant: 'primary' }, 'Execute Trade'];
  return [
    ':card',
    { variant: 'glass' },
    topNav,
    [':row', { gap: '16px' }, stat1, stat2],
    chart,
    btn
  ];
}
`;
    const metrics = evaluateNodeWithLisp(code, 'ui');
    expect(metrics.status).toBe('verified');
    expect(metrics.violations).toHaveLength(0);
    expect(metrics.lines).toBeLessThanOrEqual(50);
  });

  it('rejects a UI node exceeding the 50-line constitutional budget', () => {
    const lines = Array.from({ length: 52 }, (_, i) => `  const line${i} = ${i};`).join('\n');
    const code = `
export function renderOversizedWidget(props) {
${lines}
  return [':card', { val: line0 }];
}
`;
    const metrics = evaluateNodeWithLisp(code, 'ui');
    expect(metrics.status).toBe('violated');
    const lineViolation = metrics.violations.find((v) => v.code === 'MAX_LINES');
    expect(lineViolation).toBeDefined();
  });
});
