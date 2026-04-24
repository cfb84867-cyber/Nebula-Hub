'use client';
import { useState } from 'react';
import { Delete } from 'lucide-react';

type Mode = 'standard' | 'scientific';

const STD_KEYS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
];

export default function CalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [mode, setMode] = useState<Mode>('standard');
  const [justEvaled, setJustEvaled] = useState(false);

  const press = (key: string) => {
    if (key === 'C') { setDisplay('0'); setExpression(''); setJustEvaled(false); return; }
    if (key === '⌫') { setDisplay((d) => d.length > 1 ? d.slice(0, -1) : '0'); return; }
    if (key === '±') { setDisplay((d) => d.startsWith('-') ? d.slice(1) : '-' + d); return; }
    if (key === '%') { setDisplay((d) => String(parseFloat(d) / 100)); return; }

    if (key === '=') {
      try {
        const expr = expression + display;
        const safe = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${safe})`)();
        const rounded = parseFloat(result.toPrecision(12));
        setDisplay(String(rounded));
        setExpression('');
        setJustEvaled(true);
      } catch { setDisplay('Error'); }
      return;
    }

    const isOp = ['+', '−', '×', '÷'].includes(key);
    if (isOp) { setExpression(display + key); setDisplay('0'); setJustEvaled(false); return; }

    if (justEvaled) { setDisplay(key === '.' ? '0.' : key); setJustEvaled(false); return; }
    if (key === '.' && display.includes('.')) return;
    setDisplay((d) => d === '0' && key !== '.' ? key : d + key);
  };

  const getKeyStyle = (key: string) => {
    if (key === '=') return 'col-span-1 bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-glow-sm hover:shadow-glow-md';
    if (['÷', '×', '−', '+'].includes(key)) return 'bg-violet-900/40 text-violet-300 border-violet-500/30';
    if (['C', '±', '%'].includes(key)) return 'bg-[rgba(139,92,246,0.12)] text-[var(--text-secondary)]';
    return 'bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)]';
  };

  return (
    <div className="h-full flex items-center justify-center bg-[rgba(10,6,20,0.3)] p-4">
      <div className="glass rounded-2xl p-4 w-72 shadow-card">
        <div className="flex justify-between mb-3">
          <span className="font-semibold text-sm gradient-text">Calculator</span>
          <div className="flex gap-1">
            {(['standard', 'scientific'] as Mode[]).map((m) => (
              <button key={m} className={`btn btn-sm capitalize ${mode === m ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode(m)}>{m}</button>
            ))}
          </div>
        </div>

        {/* Display */}
        <div className="bg-[rgba(10,6,20,0.5)] rounded-xl p-4 mb-3 text-right border border-[var(--border-color)]">
          <p className="text-xs text-[var(--text-muted)] h-4 mb-1">{expression}</p>
          <p className="text-3xl font-light text-[var(--text-primary)] truncate">{display}</p>
        </div>

        {/* Keys */}
        <div className="grid grid-cols-4 gap-2">
          {STD_KEYS.flat().map((key, i) => (
            <button
              key={i}
              className={`rounded-xl py-3.5 text-sm font-medium transition-all active:scale-95 border border-transparent ${getKeyStyle(key)} ${key === '0' ? 'col-span-2' : ''}`}
              onClick={() => press(key)}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
