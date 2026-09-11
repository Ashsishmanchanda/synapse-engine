import React, { useState, useEffect, useRef } from 'react';

interface MiniCodeEditorProps {
  initialCode: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
}

export const MiniCodeEditor: React.FC<MiniCodeEditorProps> = ({
  initialCode,
  onChange,
  readOnly = false,
}) => {
  const [code, setCode] = useState(initialCode);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCode(val);
    onChange(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Prevent ReactFlow from intercepting Backspace / Delete
    e.stopPropagation();

    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      onChange(newCode);
      // Restore cursor
      setTimeout(() => {
        if (target) {
          target.selectionStart = target.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const lines = code.split('\n');

  return (
    <div
      className="nodrag nopan nowheel w-full flex font-mono text-xs bg-[#090d14] border border-slate-800 rounded-md overflow-hidden focus-within:border-amber-500/60 transition-colors"
      onKeyDown={(e) => e.stopPropagation()}
    >
      {/* Line Numbers */}
      <div className="select-none py-2 px-2 bg-[#06090e] border-r border-slate-800/80 text-slate-600 text-right min-w-[28px] text-[11px] leading-5">
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>

      {/* Code Text Area */}
      <textarea
        ref={textareaRef}
        value={code}
        readOnly={readOnly}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        rows={Math.max(3, Math.min(lines.length, 12))}
        className="flex-1 w-full bg-transparent text-amber-100/90 py-2 px-3 resize-none outline-none text-[11px] leading-5 font-mono selection:bg-amber-500/30 whitespace-pre overflow-x-auto"
      />
    </div>
  );
};
