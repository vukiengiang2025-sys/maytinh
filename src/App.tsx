/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Cropper, { Point, Area } from 'react-easy-crop';
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
  Sparkles,
  GraduationCap,
  LineChart,
  Scale,
  BookOpen,
  Camera,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Cat,
  User,
  Users,
  Baby,
  Check
} from 'lucide-react';
import * as math from 'mathjs';
import confetti from 'canvas-confetti';
import { 
  LineChart as ReLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from './lib/utils';
import { CalcMode, HistoryItem, AppConfig, ThemeType, UserProfile } from './types';
import { FORMULAS, CONVERSIONS } from './constants';

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg');
}

const DEFAULT_PROFILES: UserProfile[] = [
  { name: 'Cháu 1', theme: 'sweet-pink' },
  { name: 'Cháu 2', theme: 'professional' },
  { name: 'Cháu 3', theme: 'galaxy' },
  { name: 'Cháu 4', theme: 'forest' },
];

export default function App() {
  const [mode, setMode] = useState<CalcMode>('basic');
  const [display, setDisplay] = useState('0');
  const [result, setResult] = useState<string | null>(null);
  const [stepByStep, setStepByStep] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showProfilePicker, setShowProfilePicker] = useState(true);
  
  // Cropping state
  const [cropState, setCropState] = useState<{
    show: boolean;
    image: string | null;
    type: 'bg' | 'button' | 'avatar';
    btnLabel?: string;
  }>({ show: false, image: null, type: 'avatar' });
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  
  const [config, setConfig] = useState<AppConfig>({
    profiles: DEFAULT_PROFILES,
    currentProfileIndex: 0,
    soundEnabled: true,
    mascotEnabled: true,
    kidsMode: true,
  });

  const activeProfile = config.profiles[config.currentProfileIndex] || DEFAULT_PROFILES[0];
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load config from local storage
  useEffect(() => {
    const saved = localStorage.getItem('smartycalc_config_pro');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration for old configs
      if (!parsed.profiles) {
        parsed.profiles = DEFAULT_PROFILES;
        parsed.currentProfileIndex = 0;
        parsed.kidsMode = true;
      }
      setConfig(parsed);
      setShowProfilePicker(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('smartycalc_config_pro', JSON.stringify(config));
  }, [config]);

  // Auto-scroll display to end
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [display]);

  const speak = (text: string) => {
    if (!config.soundEnabled) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleAction = (val: string) => {
    if (val === 'AC') {
      speak("Xóa hết nè");
      setDisplay('0');
      setResult(null);
      setStepByStep(null);
      return;
    }

    if (val === 'DEL') {
      if (display.length === 1) setDisplay('0');
      else setDisplay(display.slice(0, -1));
      return;
    }

    if (val === '=') {
      try {
        let expr = display.replace(/×/g, '*').replace(/÷/g, '/');
        const calcResult = math.evaluate(expr);
        const formattedResult = math.format(calcResult, { precision: 10 }).toString();
        
        setResult(formattedResult);
        speak(`Bằng ${formattedResult}`);
        
        if (config.kidsMode) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF8E9E', '#FFD93D', '#4299E1']
          });
        }

        generateStepByStep(display, formattedResult);
        
        const newItem: HistoryItem = {
          expression: display,
          result: formattedResult,
          timestamp: Date.now()
        };
        setHistory([newItem, ...history].slice(0, 50));
      } catch (err) {
        setResult('Hì hì (Lỗi)');
        speak("Tính hổng được rồi");
      }
      return;
    }

    // Speech for numbers
    if (!isNaN(Number(val))) speak(val);
    else if (val === '+') speak("cộng");
    else if (val === '-') speak("trừ");

    if (display === '0' && !['.', '+', '-', '×', '÷', '*', '/'].includes(val)) {
      setDisplay(val);
    } else {
      setDisplay(prev => prev + val);
    }
  };

  const mapFuncs: Record<string, string> = {
    '√': 'sqrt(', 'π': 'pi', 'e': 'e', '^': '^', 
    'sin': 'sin(', 'cos': 'cos(', 'tan': 'tan(', 
    'log': 'log(', 'ln': 'ln(', '!': '!', '(': '(', ')': ')'
  };

  const handleFunction = (func: string) => {
    speak(func);
    handleAction(mapFuncs[func] || func);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'bg' | 'button' | 'avatar', btnLabel?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropState({ show: true, image: reader.result as string, type, btnLabel });
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const saveCroppedImage = async () => {
    if (cropState.image && croppedAreaPixels) {
      const croppedImage = await getCroppedImg(cropState.image, croppedAreaPixels);
      const updatedProfiles = [...config.profiles];
      const profile = updatedProfiles[config.currentProfileIndex];
      
      if (cropState.type === 'bg') profile.bgImage = croppedImage;
      else if (cropState.type === 'avatar') profile.avatar = croppedImage;
      else if (cropState.type === 'button') {
        profile.buttonImages = { ...(profile.buttonImages || {}), [cropState.btnLabel || '']: croppedImage };
      }
      
      setConfig({ ...config, profiles: updatedProfiles });
      setCropState({ show: false, image: null, type: 'avatar' });
    }
  };

  const updateProfileName = (name: string) => {
    const updatedProfiles = [...config.profiles];
    updatedProfiles[config.currentProfileIndex].name = name;
    setConfig({ ...config, profiles: updatedProfiles });
  };

  const updateTheme = (theme: ThemeType) => {
    const updatedProfiles = [...config.profiles];
    updatedProfiles[config.currentProfileIndex].theme = theme;
    setConfig({ ...config, profiles: updatedProfiles });
  };

  const removeImage = (type: 'bg' | 'button', btnLabel?: string) => {
    const updatedProfiles = [...config.profiles];
    const profile = updatedProfiles[config.currentProfileIndex];
    if (type === 'bg') delete profile.bgImage;
    else if (profile.buttonImages) delete profile.buttonImages[btnLabel || ''];
    setConfig({ ...config, profiles: updatedProfiles });
  };

  const generateStepByStep = (expr: string, res: string) => {
    if (expr.includes('sin')) setStepByStep(`Tính sin của góc (rad): ${expr} = ${res}`);
    else if (expr.includes('+')) setStepByStep(`Bé đang cộng các số lại đấy: ${expr} = ${res}`);
    else if (expr.includes('×')) setStepByStep(`Bé đang lấy ${expr} nhân lên nè: = ${res}`);
    else setStepByStep(`Kết quả là ${res} nè bé ơi! `);
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 font-sans transition-all duration-700 overflow-hidden",
      activeProfile.theme === 'professional' ? "bg-[#FFF9F2]" : 
      activeProfile.theme === 'sweet-pink' ? "bg-pink-50" :
      activeProfile.theme === 'galaxy' ? "bg-slate-950" : "bg-emerald-50"
    )}>
      
      {/* Background Photo */}
      {activeProfile.bgImage && (
        <div className="fixed inset-0 pointer-events-none opacity-20 bg-cover bg-center z-0" style={{ backgroundImage: `url(${activeProfile.bgImage})` }} />
      )}

      {/* Profile Picker Overlay */}
      <AnimatePresence>
        {showProfilePicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-white/95 flex flex-col items-center justify-center p-8 backdrop-blur-md">
            <h1 className="text-4xl font-black text-gray-800 mb-2">Xin chào! 👋</h1>
            <p className="text-gray-400 font-bold mb-12">Hôm nay ai sẽ dùng máy tính nhỉ?</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {config.profiles.map((p, i) => (
                <motion.button 
                  key={i} 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setConfig({ ...config, currentProfileIndex: i }); setShowProfilePicker(false); speak(`Chào mừng ${p.name}`); }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className={cn(
                    "w-20 h-20 sm:w-24 sm:h-24 rounded-full border-8 overflow-hidden shadow-xl flex items-center justify-center",
                    p.theme === 'sweet-pink' ? "border-pink-300" : p.theme === 'galaxy' ? "border-indigo-400" : "border-emerald-300"
                  )}>
                    {p.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : <Baby size={40} className="text-gray-300" />}
                  </div>
                  <span className="font-black text-lg text-gray-700">{p.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "w-full h-full max-h-[95vh] max-w-6xl bg-white/95 backdrop-blur-md rounded-[20px] sm:rounded-[40px] shadow-2xl overflow-hidden border-4 sm:border-8 flex flex-col relative z-10",
          activeProfile.theme === 'professional' ? "border-[#FFD93D]" :
          activeProfile.theme === 'sweet-pink' ? "border-pink-300" :
          activeProfile.theme === 'galaxy' ? "border-indigo-500 text-indigo-100" : "border-emerald-500"
        )}
      >
        {/* Navigation Tabs */}
        <div className={cn(
          "p-2 sm:p-4 flex flex-wrap gap-2 justify-between items-center",
          activeProfile.theme === 'professional' ? "bg-[#FFD93D]" :
          activeProfile.theme === 'sweet-pink' ? "bg-pink-300" :
          activeProfile.theme === 'galaxy' ? "bg-slate-900 border-b border-indigo-900" : "bg-emerald-400"
        )}>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'basic', label: 'CƠ BẢN', icon: <GraduationCap size={14}/> },
              { id: 'scientific', label: 'KHOA HỌC', icon: <Sparkles size={14}/> },
              { id: 'graph', label: 'ĐỒ THỊ', icon: <LineChart size={14}/> },
              { id: 'unit', label: 'ĐƠN vỊ', icon: <Scale size={14}/> },
              { id: 'formula', label: 'CÔNG THỨC', icon: <BookOpen size={14}/> },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setMode(tab.id as CalcMode)} className={cn(
                "px-2 sm:px-3 py-1 sm:py-1.5 font-bold rounded-full text-[9px] sm:text-xs flex items-center gap-1 sm:gap-1.5 transition-all",
                mode === tab.id ? "bg-white text-pink-500 scale-105 shadow-md" : "bg-white/20 text-gray-700 hover:bg-white/50"
              )}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowProfilePicker(true)} className="p-2 hover:bg-white/20 rounded-full"><Users size={18} /></button>
            <button onClick={() => setShowConfig(!showConfig)} className="p-2 hover:rotate-45 transition-transform"><Settings size={18} /></button>
          </div>
        </div>

        <div className="flex flex-col landscape:flex-row flex-1 relative overflow-hidden">
          <Mascot visible={config.mascotEnabled} typing={display !== '0'} theme={activeProfile.theme} profile={activeProfile} />

          <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
            <AnimatePresence mode="wait">
              {mode === 'graph' ? <GraphMode key="graph" /> : 
               mode === 'unit' ? <UnitMode key="unit" /> : 
               mode === 'formula' ? <FormulaMode key="formula" /> : (
                <div key="calc" className="flex-1 flex flex-col landscape:flex-row gap-4 sm:gap-6 h-full">
                  
                  {/* Left Screen (Results and Info) */}
                  <div className="flex-1 flex flex-col min-h-[160px] landscape:min-h-0 landscape:w-1/2">
                    <div className="bg-gray-100/40 rounded-[20px] sm:rounded-[30px] p-4 sm:p-6 text-right mb-4 shadow-inner flex-1 flex flex-col justify-end border-2 border-white relative overflow-hidden group">
                      {config.kidsMode && !isNaN(Number(display)) && Number(display) <= 20 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {Array.from({ length: Number(display) }).map((_, i) => (
                            <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xl sm:text-2xl">🍎</motion.span>
                          ))}
                        </div>
                      )}
                      <div ref={scrollRef} className="text-sm sm:text-lg text-gray-400 font-medium tracking-tight overflow-x-auto whitespace-nowrap scrollbar-hide">
                        {display}
                      </div>
                      <motion.div key={result} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={cn(
                        "text-3xl sm:text-5xl font-black mt-2",
                        activeProfile.theme === 'galaxy' ? 'text-indigo-400' : 'text-gray-800'
                      )}>
                        {result || '?'}
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {stepByStep && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 bg-emerald-50 p-3 rounded-2xl border-l-4 border-emerald-400 text-[10px] sm:text-[11px] font-medium text-emerald-700">
                          💡 {stepByStep}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Right Keypad */}
                  <div className="flex-1 flex flex-col landscape:w-1/2 overflow-y-auto landscape:pr-2">
                    <div className={cn(
                      "grid gap-2",
                      "grid-cols-4 landscape:grid-cols-5"
                    )}>
                      {/* Shared Operators in landscape */}
                      <CalcButton label="AC" onClick={() => handleAction('AC')} type="clear" config={activeProfile} className="landscape:order-1" />
                      <CalcButton label="(" onClick={() => handleAction('(')} type="special" config={activeProfile} className="landscape:order-2" />
                      <CalcButton label=")" onClick={() => handleAction(')')} type="special" config={activeProfile} className="landscape:order-3" />
                      {/* Advanced buttons visible by default in scientific OR any mode when landscape */}
                      <div className="contents landscape:contents hidden landscape:contents">
                         {['sin', 'cos', 'tan', '√', '^'].map((btn) => (
                           <CalcButton key={btn} label={btn} onClick={() => handleFunction(btn)} type="scientific" config={activeProfile} className="landscape:order-4 landscape:h-12" />
                         ))}
                      </div>
                      
                      <CalcButton label="÷" onClick={() => handleAction('÷')} type="operator" config={activeProfile} icon={<Divide size={18} />} className="landscape:order-5" />

                      {[7,8,9].map(n => <CalcButton key={n} label={n.toString()} onClick={() => handleAction(n.toString())} config={activeProfile} />)}
                      <CalcButton label="×" onClick={() => handleAction('×')} type="operator" config={activeProfile} icon={<X size={18} />} />

                      {[4,5,6].map(n => <CalcButton key={n} label={n.toString()} onClick={() => handleAction(n.toString())} config={activeProfile} />)}
                      <CalcButton label="-" onClick={() => handleAction('-')} type="operator" config={activeProfile} icon={<Minus size={18} />} />

                      {[1,2,3].map(n => <CalcButton key={n} label={n.toString()} onClick={() => handleAction(n.toString())} config={activeProfile} />)}
                      <CalcButton label="+" onClick={() => handleAction('+')} type="operator" config={activeProfile} icon={<Plus size={18} />} />

                      <CalcButton label="0" onClick={() => handleAction('0')} config={activeProfile} />
                      <CalcButton label="." onClick={() => handleAction('.')} config={activeProfile} />
                      <CalcButton label="=" onClick={() => handleAction('=')} className="col-span-2" type="equals" config={activeProfile} icon={<Equal size={24} />} />
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Settings Modal */}
        <AnimatePresence>
          {showConfig && (
            <motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }} className="absolute inset-0 bg-white/98 z-[60] p-6 flex flex-col flex-1 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-800">Cài đặt cho {activeProfile.name}</h2>
                <button onClick={() => setShowConfig(false)} className="p-2"><X /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Tên hiển thị</label>
                  <input value={activeProfile.name} onChange={(e) => updateProfileName(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold" />
                </div>

                <div className="flex items-center justify-between p-4 bg-pink-50 rounded-2xl">
                  <div>
                    <p className="font-bold">Chế độ Trẻ Em</p>
                    <p className="text-[10px] text-gray-500">Giọng nói + Học đếm 🍎</p>
                  </div>
                  <button onClick={() => setConfig({ ...config, kidsMode: !config.kidsMode })} className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    config.kidsMode ? "bg-pink-400" : "bg-gray-300"
                  )}>
                    <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", config.kidsMode ? "right-1" : "left-1")} />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Chọn Theme</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['professional', 'sweet-pink', 'galaxy', 'forest'].map((t) => (
                      <button key={t} onClick={() => updateTheme(t as ThemeType)} className={cn(
                        "py-3 rounded-xl font-bold text-xs capitalize border-2",
                        activeProfile.theme === t ? "border-pink-400 bg-pink-50" : "border-gray-100"
                      )}>{t}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Ảnh cá nhân</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="p-4 bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2 cursor-pointer">
                      <Baby size={20} /> Đại diện
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
                    </label>
                    <label className="p-4 bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2 cursor-pointer">
                      <Camera size={20} /> Ảnh nền
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'bg')} />
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-3xl">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Dán ảnh vào nút bấm</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['7','8','9','4','5','6','1','2','3','0','=','+'].map((label) => (
                      <label key={label} className="w-full h-10 rounded-xl bg-white border flex items-center justify-center cursor-pointer relative overflow-hidden text-[8px] font-black">
                        {activeProfile.buttonImages?.[label] ? <img src={activeProfile.buttonImages[label]} className="w-full h-full object-cover" /> : label}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'button', label)} />
                        {activeProfile.buttonImages?.[label] && <button onClick={(e) => { e.preventDefault(); removeImage('button', label); }} className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 text-white rounded-full flex items-center justify-center">×</button>}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Modal */}
        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute inset-0 bg-white z-[70] p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-gray-800">Nhật ký</h2>
                <button onClick={() => setShowHistory(false)} className="p-3"><X /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3">
                {history.map((item, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-2xl border-b-4 border-gray-100 shadow-sm">
                    <div className="text-xs text-gray-400 mb-1 font-bold">{item.expression}</div>
                    <div className="text-2xl font-black text-gray-800">{item.result}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setHistory([])} className="mt-4 p-4 bg-red-50 text-red-500 font-bold rounded-2xl border-b-4 border-red-200">XÓA HẾT</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Crop Modal */}
        <AnimatePresence>
          {cropState.show && cropState.image && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black z-[100] flex flex-col items-center justify-center p-4">
              <div className="relative w-full h-[60vh] bg-gray-900 rounded-3xl overflow-hidden mb-6">
                <Cropper
                  image={cropState.image}
                  crop={crop}
                  zoom={zoom}
                  aspect={cropState.type === 'bg' ? 16 / 9 : 1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="flex gap-4 w-full max-w-sm">
                <button onClick={() => setCropState({ show: false, image: null, type: 'avatar' })} className="flex-1 p-4 bg-gray-800 text-white font-bold rounded-2xl border-b-4 border-gray-900 active:border-b-0 active:translate-y-1 transition-all">HỦY</button>
                <button onClick={saveCroppedImage} className="flex-1 p-4 bg-pink-500 text-white font-bold rounded-2xl border-b-4 border-pink-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2">
                  <Check size={20} /> XÁC NHẬN
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <div className="p-4 flex gap-4 text-gray-400 font-bold text-[10px] items-center">
        <span>Active: {activeProfile.name}</span>
        <button onClick={() => setShowProfilePicker(true)} className="flex items-center gap-1 hover:text-pink-400"><RotateCcw size={12}/> Đổi người</button>
      </div>
    </div>
  );
}

function CalcButton({ label, onClick, className, icon, type = 'number', config }: { 
  label: string; onClick: () => void; className?: string; icon?: React.ReactNode; type?: string; config: UserProfile;
  key?: any; // Add key to suppress TS errors when passed explicitly in JSX
}) {
  const styles: Record<string, string> = {
    number: "bg-gray-50/80 text-gray-800 border-gray-200 hover:bg-white",
    operator: "bg-indigo-50/80 text-indigo-500 border-indigo-200",
    special: "bg-amber-50/80 text-amber-600 border-amber-200",
    clear: "bg-red-50/80 text-red-500 border-red-200",
    equals: "bg-pink-400 text-white border-pink-600 shadow-lg",
    scientific: "bg-indigo-50/50 text-indigo-400 border-indigo-200 text-[10px] h-10"
  };

  const buttonImg = config.buttonImages?.[label];

  return (
    <motion.button
      whileTap={{ scale: 0.95, translateY: 2 }}
      onClick={onClick}
      style={buttonImg ? { backgroundImage: `url(${buttonImg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      className={cn(
        "h-14 sm:h-16 rounded-[20px] flex items-center justify-center font-black transition-all border-b-4 hover:border-b-2 shadow-sm text-lg relative",
        buttonImg && "text-white drop-shadow-md overflow-hidden border-pink-300",
        !buttonImg && styles[label === 'AC' ? 'clear' : (label === '=' ? 'equals' : type)],
        className
      )}
    >
      {buttonImg && <div className="absolute inset-0 bg-black/30" />}
      <span className="relative z-10">{icon || label}</span>
    </motion.button>
  );
}

function Mascot({ visible, typing, theme, profile }: { visible: boolean; typing: boolean; theme: string; profile: UserProfile }) {
  if (!visible) return null;
  return (
    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2.5 }} className="absolute -top-16 right-10 z-[100] scale-150">
      <div className="relative group">
        <motion.div animate={{ scale: typing ? 1.1 : 1 }} className={cn(
          "p-3 rounded-2xl shadow-lg border-2",
          theme === 'galaxy' ? "bg-slate-700 border-slate-600" : "bg-white border-pink-100"
        )}>
          {profile.avatar ? <img src={profile.avatar} className="w-8 h-8 rounded-full" /> : <Cat size={32} className={theme === 'galaxy' ? "text-indigo-400" : "text-pink-400"} />}
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: typing ? 1 : 0, scale: typing ? 1 : 0 }} className="absolute -top-12 -right-20 bg-white px-3 py-1.5 rounded-2xl shadow-md border text-[10px] font-black text-pink-500 whitespace-nowrap">
          {typing ? "Đang tính đó nha!" : `Chào ${profile.name}!`}
        </motion.div>
      </div>
    </motion.div>
  );
}

function GraphMode() {
  const [expr, setExpr] = useState('x^2');
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    try {
      const points = [];
      for (let x = -10; x <= 10; x += 1) {
        const result = math.evaluate(expr, { x });
        if (typeof result === 'number') points.push({ x, y: result });
      }
      setData(points);
    } catch (e) {}
  }, [expr]);

  return (
    <div className="flex-1 flex flex-col bg-white rounded-3xl p-4 shadow-inner">
      <input value={expr} onChange={(e) => setExpr(e.target.value)} className="w-full p-3 bg-gray-50 border-2 rounded-xl mb-4 font-bold outline-none" placeholder="y = x^2" />
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="x" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="y" stroke="#FF8E9E" strokeWidth={3} dot={false} />
          </ReLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function UnitMode() {
  const [val, setVal] = useState('1');
  const [cat, setCat] = useState<keyof typeof CONVERSIONS>('length');
  return (
    <div className="flex-1 flex flex-col bg-white rounded-3xl p-6 shadow-inner space-y-4">
      <div className="flex gap-2">
        {Object.keys(CONVERSIONS).map(k => (
          <button key={k} onClick={() => setCat(k as any)} className={cn("px-4 py-2 rounded-xl text-[10px] font-bold capitalize", cat === k ? "bg-pink-400 text-white" : "bg-gray-100")}>{k}</button>
        ))}
      </div>
      <input type="number" value={val} onChange={(e) => setVal(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-black text-2xl text-center" />
      <div className="space-y-2">
        {CONVERSIONS[cat].map(c => (
          <div key={c.label} className="p-4 bg-gray-50 rounded-2xl flex justify-between font-bold text-sm">
            <span>{c.label}</span>
            <span className="text-pink-500">{(Number(val) * c.factor).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormulaMode() {
  const [filter, setFilter] = useState('all');
  return (
    <div className="flex-1 flex flex-col bg-white rounded-3xl p-4 shadow-inner overflow-hidden">
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'grade1-5', 'grade6-9', 'grade10-12'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap", filter === f ? "bg-amber-400 text-white" : "bg-gray-50")}>{f}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto space-y-3">
        {FORMULAS.filter(f => filter === 'all' || f.category === filter).map(f => (
          <div key={f.id} className="p-4 bg-amber-50 rounded-2xl border-l-4 border-amber-300">
            <p className="text-[10px] font-bold text-amber-600 mb-1">{f.title}</p>
            <p className="font-black text-lg text-gray-700">{f.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
