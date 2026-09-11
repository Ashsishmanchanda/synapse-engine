import fs from 'fs';
import path from 'path';
import { SynapseGraph, SynapseGraphNode, WireDefinition } from '../../types';

export interface ExportResult {
  success: boolean;
  exportPath: string;
  filesGenerated: string[];
  nodeCount: number;
  wireCount: number;
}

/**
 * Sanitizes a node ID into a clean PascalCase component name
 */
export function toComponentName(nodeId: string): string {
  return nodeId
    .replace(/^n-/, '')
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + 'Component';
}

/**
 * Synthesizes an independent, standalone Next.js 15 App Router codebase from a SynapseGraph.
 */
export function exportNextjsApp(graph: SynapseGraph, targetDirName?: string): ExportResult {
  const appSlug = (targetDirName || graph.activeApp || 'synapse-exported-app')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-');

  const baseDir = path.join(process.cwd(), 'exports', appSlug);
  const filesGenerated: string[] = [];

  // Ensure directories exist
  const appDir = path.join(baseDir, 'app');
  const componentsDir = path.join(baseDir, 'components', 'nodes');
  const libDir = path.join(baseDir, 'lib', 'contracts');

  fs.mkdirSync(appDir, { recursive: true });
  fs.mkdirSync(componentsDir, { recursive: true });
  fs.mkdirSync(libDir, { recursive: true });

  // 1. package.json
  const packageJson = {
    name: appSlug,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start'
    },
    dependencies: {
      next: '^15.0.0',
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      zod: '^3.24.0',
      'lucide-react': '^1.16.0'
    },
    devDependencies: {
      '@types/node': '^20',
      '@types/react': '^19',
      '@types/react-dom': '^19',
      postcss: '^8',
      tailwindcss: '^3.4.1',
      typescript: '^5'
    }
  };
  fs.writeFileSync(path.join(baseDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');
  filesGenerated.push('package.json');

  // 2. tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'es5',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: { '@/*': ['./*'] }
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules']
  };
  fs.writeFileSync(path.join(baseDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2), 'utf-8');
  filesGenerated.push('tsconfig.json');

  // 3. next.config.mjs
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
};
export default nextConfig;
`;
  fs.writeFileSync(path.join(baseDir, 'next.config.mjs'), nextConfig, 'utf-8');
  filesGenerated.push('next.config.mjs');

  // 4. tailwind.config.ts & postcss.config.mjs
  const tailwindConfig = `import type { Config } from "tailwindcss";
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        synapse: {
          dark: '#080b11',
          card: '#0d121d',
          orange: '#ff6600',
          amber: '#f59e0b'
        }
      }
    }
  },
  plugins: []
} satisfies Config;
`;
  fs.writeFileSync(path.join(baseDir, 'tailwind.config.ts'), tailwindConfig, 'utf-8');
  filesGenerated.push('tailwind.config.ts');

  const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
`;
  fs.writeFileSync(path.join(baseDir, 'postcss.config.mjs'), postcssConfig, 'utf-8');
  filesGenerated.push('postcss.config.mjs');

  // 5. app/globals.css
  const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #080b11;
  color: #f8fafc;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
}
`;
  fs.writeFileSync(path.join(appDir, 'globals.css'), globalsCss, 'utf-8');
  filesGenerated.push('app/globals.css');

  // 6. app/layout.tsx
  const layoutTsx = `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '${graph.activeApp || 'Synapse Exported App'}',
  description: 'Synthesized Next.js 15 application built with Synapse Engine'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#080b11] text-slate-100">
        {children}
      </body>
    </html>
  );
}
`;
  fs.writeFileSync(path.join(appDir, 'layout.tsx'), layoutTsx, 'utf-8');
  filesGenerated.push('app/layout.tsx');

  // 7. Generate Component Files for Each Node
  const componentImports: string[] = [];
  const componentUsages: string[] = [];

  graph.nodes.forEach(node => {
    const compName = toComponentName(node.id);
    const nodeFilePath = path.join(componentsDir, `${compName}.tsx`);

    const cleanedCode = node.data.code || '';
    const componentFileContent = `// Node ID: ${node.id}
// Domain: ${node.data.domain} | Category: ${node.data.category}
'use client';

${cleanedCode}
`;
    fs.writeFileSync(nodeFilePath, componentFileContent, 'utf-8');
    filesGenerated.push(`components/nodes/${compName}.tsx`);

    const fnMatch = cleanedCode.match(/export\s+function\s+([a-zA-Z0-9_]+)/);
    const primaryFn = fnMatch ? fnMatch[1] : null;

    componentImports.push(`import * as ${compName} from '@/components/nodes/${compName}';`);
    componentUsages.push(`        {/* ${node.data.title} (${node.id}) */}
        <section key="${node.id}" className="p-4 rounded-xl border border-slate-800 bg-[#0d121d] flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
              ${node.data.title}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
              ${node.data.category}
            </span>
          </div>

          <div className="text-xs font-mono text-slate-200">
            {(() => {
              try {
                ${primaryFn ? `
                if (typeof ${compName}.${primaryFn} === 'function') {
                  const out = ${compName}.${primaryFn}();
                  if (React.isValidElement(out)) return out;
                  if (typeof out === 'object' && out !== null) {
                    return (
                      <pre className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 text-[11px] overflow-auto text-emerald-400">
                        {JSON.stringify(out, null, 2)}
                      </pre>
                    );
                  }
                  return <div className="text-slate-300 font-mono">{String(out ?? 'Node executed')}</div>;
                }
                ` : `
                if (typeof ${compName}.default === 'function') {
                  const Comp = (${compName} as any).default;
                  return <Comp />;
                }
                `}
                return <div className="text-slate-500 italic">Mounted (${node.data.category})</div>;
              } catch (err: any) {
                return <div className="text-rose-400 font-mono text-xs">Runtime Error: {err.message}</div>;
              }
            })()}
          </div>
        </section>`);
  });

  // 8. Generate Central Contracts File (lib/contracts/schemas.ts)
  const contractsFile = `import { z } from 'zod';

// Synapse Wire Contracts Registry
export const WireContracts = {
${graph.wires.map(w => `  '${w.id}': {
    source: '${w.source}',
    target: '${w.target}',
    contract: '${w.data?.contract || 'z.any()'}'
  }`).join(',\n')}
};
`;
  fs.writeFileSync(path.join(libDir, 'schemas.ts'), contractsFile, 'utf-8');
  filesGenerated.push('lib/contracts/schemas.ts');

  // 9. app/page.tsx (Assembled Next.js 15 App)
  const pageTsx = `'use client';

import React from 'react';
${componentImports.join('\n')}

export default function SynapseAppPage() {
  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <header className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            ${graph.activeApp || 'Synapse Exported App'}
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Synthesized from ${graph.nodes.length} Constitutional Micro-Nodes & ${graph.wires.length} Typed Wires
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
${componentUsages.join('\n')}
      </div>
    </main>
  );
}
`;
  fs.writeFileSync(path.join(appDir, 'page.tsx'), pageTsx, 'utf-8');
  filesGenerated.push('app/page.tsx');

  return {
    success: true,
    exportPath: baseDir,
    filesGenerated,
    nodeCount: graph.nodes.length,
    wireCount: graph.wires.length
  };
}
