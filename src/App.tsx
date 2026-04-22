/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  RotateCcw, 
  Delete, 
  Divide, 
  Minus, 
  Plus, 
  Equal, 
  X, 
  Settings, 
  ChevronRight,
  ChevronLeft,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import * as math from 'mathjs';
import { cn } from './lib/utils';
import { CalcMode, HistoryItem } from './types';

export default function App() {
  const [mode, setMode] = useState<CalcMode>('basic');
  const [display, setDisplay] = useState('0');
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll display to end
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [display]);

  const handleAction = (val: string) => {
    if (val === 'AC') {
      setDisplay('0');
      setResult(null);
      return;
    }

    if (val === 'DEL') {
      if (display.length === 1) {
        setDisplay('0');
      } else {
        setDisplay(display.slice(0, -1));
      }
      return;
    }

    if (val === '=') {
      try {
        // Prepare expression for mathjs
        let expr = display.replace(/×/g, '*').replace(/÷/g, '/');
        const calcResult = math.evaluate(expr);
        const formattedResult = math.format(calcResult, { precision: 10 });
        
        setResult(formattedResult.toString());
        
        const newItem: HistoryItem = {
          expression: display,
          result: formattedResult.toString(),
          timestamp: Date.now()
        };
        setHistory([newItem, ...history].slice(0, 50));
      } catch (err) {
        setResult('Error ̊⌣ ̊');
      }
      return;
    }

    if (display === '0' && !['.', '+', '-', '×', '÷', '*', '/'].includes(val)) {
      setDisplay(val);
    } else {
      setDisplay(prev => prev + val);
    }
  };

  const handleFunction = (func: string) => {
    if (func === '√') handleAction('sqrt(');
    else if (func === 'π') handleAction('pi');
    else if (func === 'e') handleAction('e');
    else if (func === '^') handleAction('^');
    else if (func === 'sin') handleAction('sin(');
    else if (func === 'cos') handleAction('cos(');
    else if (func === 'tan') handleAction('tan(');
    else if (func === 'log') handleAction('log(');
    else if (func === 'ln') handleAction('ln(');
    else if (func === '!') handleAction('!');
    else if (func === '(') handleAction('(');
    else if (func === ')') handleAction(')');
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#4A4A4A] flex flex-col items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden border-8 border-[#FFD93D] flex flex-col relative"
      >
        {/* Navigation Tabs (Grade Levels) */}
        <div className="bg-[#FFD93D] p-5 flex justify-between items-center">
          <div className="flex space-x-2">
            <button 
              onClick={() => setMode('basic')}
              className={cn(
                "px-6 py-2 font-bold rounded-full text-xs shadow-sm transition-all",
                mode === 'basic' ? "bg-white text-[#FF8E9E]" : "bg-[#FFEB99] text-[#7A6B2C] hover:bg-white/50"
              )}
            >
              LỚP 1 - 5
            </button>
            <button 
              onClick={() => setMode('scientific')}
              className={cn(
                "px-6 py-2 font-bold rounded-full text-xs transition-all",
                mode === 'scientific' ? "bg-white text-[#FF8E9E] shadow-sm" : "bg-[#FFEB99] text-[#7A6B2C] hover:bg-white/50"
              )}
            >
              LỚP 6 - 12
            </button>
          </div>
          <div className="flex items-center gap-2 text-[#7A6B2C] font-black text-xl italic group">
            <span className="hidden sm:inline">MATHIE</span>
            <span className="text-[#FF8E9E] underline underline-offset-4 group-hover:no-underline transition-all cursor-default">KUTE</span>
            <History 
              size={20} 
              className="ml-2 cursor-pointer hover:scale-110 transition-transform" 
              onClick={() => setShowHistory(true)}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1">
          {/* Left Sidebar: Scientific Functions (Visible only in Advanced mode) */}
          {mode === 'scientific' && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="md:w-1/3 bg-[#F8F9FA] p-6 border-b-2 md:border-b-0 md:border-r-2 border-[#FFE9A0] flex flex-col gap-3"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0] mb-2">Hàm nâng cao</div>
              <div className="grid grid-cols-2 gap-3">
                {['sin', 'cos', 'tan', 'log', 'ln', '√', '^', '!', 'π', 'e', '(', ')'].map((btn) => (
                  <CalcButton 
                    key={btn} 
                    label={btn} 
                    onClick={() => handleFunction(btn)}
                    type="scientific"
                    className="h-12 text-xs"
                  />
                ))}
              </div>
              <div className="mt-auto p-4 bg-[#E0F2F1] rounded-3xl border-2 border-[#B2DFDB] text-center hidden md:block">
                <div className="text-[11px] text-[#00796B] font-bold">CÔNG THỨC NHANH</div>
                <div className="text-[10px] mt-1 text-[#4DB6AC]">Đạo hàm xⁿ → n·xⁿ⁻¹</div>
              </div>
            </motion.div>
          )}

          {/* Right: Main Display & Standard Keypad Section */}
          <div className="flex-1 flex flex-col p-6 sm:p-8">
            
            {/* Calculator Display */}
            <div className="bg-[#F1F3F4] rounded-[30px] p-6 sm:p-8 text-right mb-6 shadow-inner min-h-[140px] flex flex-col justify-end border-2 border-white">
              <div 
                ref={scrollRef}
                className="text-lg text-[#9EA7AD] font-medium tracking-tight overflow-x-auto whitespace-nowrap scrollbar-hide"
              >
                {display}
              </div>
              <motion.div 
                key={result}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl sm:text-5xl font-black text-[#2D3748] mt-2 tracking-tighter"
              >
                {result || '?'}
              </motion.div>
            </div>

            {/* Main Keypad */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              <CalcButton label="AC" onClick={() => handleAction('AC')} type="clear" />
              <CalcButton label="(" onClick={() => handleAction('(')} type="special" className="hidden sm:flex" />
              <CalcButton label=")" onClick={() => handleAction(')')} type="special" className="hidden sm:flex" />
              <CalcButton label="DEL" onClick={() => handleAction('DEL')} type="special" className="sm:hidden" icon={<Delete size={20} />} />
              <CalcButton label="%" onClick={() => handleAction('%')} type="special" />
              <CalcButton label="÷" onClick={() => handleAction('÷')} type="operator" icon={<Divide size={24} />} />

              <CalcButton label="7" onClick={() => handleAction('7')} />
              <CalcButton label="8" onClick={() => handleAction('8')} />
              <CalcButton label="9" onClick={() => handleAction('9')} />
              <CalcButton label="×" onClick={() => handleAction('×')} type="operator" icon={<X size={24} />} />

              <CalcButton label="4" onClick={() => handleAction('4')} />
              <CalcButton label="5" onClick={() => handleAction('5')} />
              <CalcButton label="6" onClick={() => handleAction('6')} />
              <CalcButton label="-" onClick={() => handleAction('-')} type="operator" icon={<Minus size={24} />} />

              <CalcButton label="1" onClick={() => handleAction('1')} />
              <CalcButton label="2" onClick={() => handleAction('2')} />
              <CalcButton label="3" onClick={() => handleAction('3')} />
              <CalcButton label="+" onClick={() => handleAction('+')} type="operator" icon={<Plus size={24} />} />

              <CalcButton label="0" onClick={() => handleAction('0')} />
              <CalcButton label="." onClick={() => handleAction('.')} />
              <CalcButton label="=" onClick={() => handleAction('=')} className="col-span-2 shadow-xl" type="equals" icon={<Equal size={32} />} />
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-[#FFF9F2] text-[10px] text-center border-t border-[#FFE9A0] font-bold text-[#D2B48C] flex justify-center gap-4">
          <span className="flex items-center gap-1"><GraduationCap size={12} /> Github Actions: Ready</span>
          <span className="flex items-center gap-1"><Settings size={12} /> SDK Build: APK v1.0</span>
          <span className="flex items-center gap-1 italic">★ Grade: {mode.toUpperCase()}</span>
        </div>

        {/* History Overlay (Preserved Logic) */}
        <AnimatePresence>
          {showHistory && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute inset-0 bg-white z-50 flex flex-col p-6 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-[#7A6B2C]">NHẬT KÝ</h2>
                <button onClick={() => setShowHistory(false)} className="p-3 bg-gray-50 rounded-2xl border-b-4 border-gray-200"><X /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3">
                {history.map((item, i) => (
                  <div key={i} className="p-4 bg-[#F8F9FA] rounded-[24px] border-b-4 border-[#E2E8F0] shadow-sm">
                    <div className="text-xs text-[#9EA7AD] mb-1 font-bold">{item.expression}</div>
                    <div className="text-2xl font-black text-[#2D3748]">{item.result}</div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setHistory([])}
                className="mt-4 p-4 bg-[#FFF5F5] text-[#F56565] font-black rounded-2xl border-b-4 border-[#FEB2B2]"
              >
                XÓA TẤT CẢ
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

type ButtonType = 'number' | 'operator' | 'special' | 'clear' | 'equals' | 'scientific';

function CalcButton({ 
  label, 
  onClick, 
  className, 
  icon,
  type = 'number'
}: { 
  label: string; 
  onClick: () => void; 
  className?: string; 
  icon?: React.ReactNode;
  type?: ButtonType;
}) {
  const styles = {
    number: "bg-[#F7FAFC] text-[#2D3748] border-[#E2E8F0] hover:bg-white",
    operator: "bg-[#EBF8FF] text-[#4299E1] border-[#BEE3F8]",
    special: "bg-[#F7FAFC] text-[#4A5568] border-[#E2E8F0]",
    clear: "bg-[#FFF5F5] text-[#F56565] border-[#FEB2B2]",
    equals: "bg-[#FF8E9E] text-white border-[#E57383] shadow-lg",
    scientific: "bg-white text-[#6B7280] border-[#E2E8F0] py-3 text-sm"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95, translateY: 2 }}
      onClick={onClick}
      className={cn(
        "h-16 rounded-2xl flex items-center justify-center font-black transition-all border-b-4 hover:border-b-2 shadow-sm text-xl",
        styles[type],
        className
      )}
    >
      {icon || label}
    </motion.button>
  );
}
