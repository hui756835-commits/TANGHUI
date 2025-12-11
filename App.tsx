import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { 
  Plane, MapPin, Briefcase, Backpack, ArrowUp, ArrowDown, ArrowLeft, 
  Calendar, Check, X, Info, Plus, Minus, Flag, Trash2, Box, 
  Shirt, Plug, Pill, Footprints, Camera, Sun, Wallet, FileText, Umbrella, 
  Smartphone, Watch, CreditCard, Sandwich, User, Undo2, ChevronDown, ChevronUp, ShoppingBag,
  List, Layers, Share2, AlertTriangle, CloudRain, Thermometer, ArrowRight, Sparkles, CheckCircle2,
  MessageCircle, Send, Bot, Loader2
} from 'lucide-react';
import { generatePackingList, createAssistantChat } from './services/geminiService';
import { Button } from './components/Button';
import { LoadingOverlay } from './components/LoadingOverlay';
import { 
  Screen, TravelPlan, AIPackingListResponse, PackingItem, 
  PackedItem, LuggageItem
} from './types';
import { Chat } from '@google/genai';

// --- Utility: Icon Mapper ---
const getItemIcon = (name: string, category: string) => {
  const n = name.toLowerCase();
  const c = category.toLowerCase();

  if (c.includes('electr') || n.includes('charg') || n.includes('phone') || n.includes('camera')) return <Plug size={24} className="text-slate-600" />;
  if (n.includes('laptop') || n.includes('ipad') || n.includes('tablet')) return <Camera size={24} className="text-slate-600" />;
  if (c.includes('cloth') || n.includes('shirt') || n.includes('pant') || n.includes('dress') || n.includes('coat')) return <Shirt size={24} className="text-slate-600" />;
  if (c.includes('shoe') || n.includes('boot') || n.includes('sock') || n.includes('sneaker')) return <Footprints size={24} className="text-slate-600" />;
  if (c.includes('toiletr') || c.includes('hygiene') || n.includes('brush') || n.includes('towel')) return <Umbrella size={24} className="text-slate-600" />;
  if (c.includes('med') || n.includes('pill') || n.includes('aid')) return <Pill size={24} className="text-slate-600" />;
  if (n.includes('sun') || n.includes('glasses')) return <Sun size={24} className="text-slate-600" />;
  if (c.includes('doc') || n.includes('passport') || n.includes('id') || n.includes('ticket')) return <FileText size={24} className="text-slate-600" />;
  if (c.includes('money') || n.includes('cash') || n.includes('card') || n.includes('wallet')) return <Wallet size={24} className="text-slate-600" />;
  if (c.includes('food') || n.includes('water') || n.includes('snack')) return <Sandwich size={24} className="text-slate-600" />;

  return <Box size={24} className="text-slate-600" />;
};

// --- Haptics Utility ---
const vibrate = (pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

// --- Subcomponents ---

// 1. Splash Screen
const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-6"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white/10 p-8 rounded-full backdrop-blur-md"
      >
        <Briefcase size={80} strokeWidth={1.5} className="text-white" />
      </motion.div>
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-4xl font-bold mt-8 text-center tracking-tight"
      >
        Packwise
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-3 text-blue-100 text-lg font-light tracking-wide"
      >
        Never Forget a Thing.
      </motion.p>
    </motion.div>
  );
};

// 2. Onboarding Tutorial
const OnboardingOverlay: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            icon: <Sparkles size={48} className="text-yellow-400" />,
            title: "Smart Analysis",
            desc: "Tell us your plan. AI analyzes weather, terrain, and needs."
        },
        {
            icon: <Layers size={48} className="text-blue-400" />,
            title: "Swipe to Pack",
            desc: "A fun game to pack items. Swipe UP to pack, DOWN to discard."
        },
        {
            icon: <CheckCircle2 size={48} className="text-green-400" />,
            title: "Ready to Go",
            desc: "Get a perfectly organized checklist. Ask the AI assistant for help."
        }
    ];

    const handleNext = () => {
        vibrate(10);
        if (step < steps.length - 1) {
            setStep(s => s + 1);
        } else {
            onFinish();
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6"
        >
            <motion.div 
                key={step}
                initial={{ scale: 0.9, opacity: 0, x: 20 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                className="bg-white w-full max-w-sm rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl"
            >
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    {steps[step].icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">{steps[step].title}</h3>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    {steps[step].desc}
                </p>

                <div className="flex gap-2 mb-8">
                    {steps.map((_, i) => (
                        <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'}`} />
                    ))}
                </div>

                <Button fullWidth onClick={handleNext}>
                    {step === steps.length - 1 ? "Let's Start" : "Next"}
                </Button>
            </motion.div>
        </motion.div>
    );
};

// 3. Plan Input Screen
const PlanInputScreen: React.FC<{ 
  onSubmit: (plan: string) => void 
}> = ({ onSubmit }) => {
  const [text, setText] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
      const hasSeen = localStorage.getItem('packwise_onboarding_seen');
      if (!hasSeen) {
          setShowOnboarding(true);
      }
  }, []);

  const handleOnboardingFinish = () => {
      localStorage.setItem('packwise_onboarding_seen', 'true');
      setShowOnboarding(false);
  };

  const chips = [
    "Domestic", "Family Visit", "Hiking", "International", "Business", "Beach"
  ];

  const toggleChip = (chip: string) => {
    vibrate(5);
    setSelectedChips(prev => 
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
    );
  };

  const handleSubmit = () => {
    vibrate(20);
    const combinedPlan = `
      User Plan: ${text}
      Tags: ${selectedChips.join(', ')}
    `.trim();

    if (!combinedPlan.replace('User Plan:', '').trim()) return;
    
    setIsLeaving(true);
    setTimeout(() => onSubmit(combinedPlan), 800);
  };

  const copyTemplate = () => {
    setText(`Family of 3 (Couple + 5yo child), flying to Vancouver, Canada.
Sept 15th to Sept 22nd (7 days).
Activities: City sightseeing, Hiking in Stanley Park, Visiting Capilano Bridge.
Staying in hotels.
Child needs milk powder and toys.`);
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-slate-50">
      <AnimatePresence>
          {showOnboarding && <OnboardingOverlay onFinish={handleOnboardingFinish} />}
      </AnimatePresence>

      <AnimatePresence>
        {isLeaving && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: '-100%' }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-blue-600/90 backdrop-blur-xl text-white"
          >
            <div className="text-center">
                <h1 className="text-5xl font-black italic tracking-tighter mb-2">GO!</h1>
                <p className="text-blue-100">Planning your trip...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Tell us your plan</h2>
          <p className="text-slate-500 mb-6 text-sm">Where are you going? What will you do? AI will customize your list.</p>
          
          <div className="bg-white rounded-3xl p-1 shadow-sm border border-slate-200 mb-4 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:shadow-md">
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g., Solo business trip to New York for 3 days, need laptop..."
                className="w-full h-32 p-4 rounded-2xl bg-transparent outline-none resize-none text-lg text-slate-700 placeholder:text-slate-300"
            />
          </div>

          <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Tags</span>
              <button 
                onClick={() => setShowTemplate(!showTemplate)}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600"
            >
                {showTemplate ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                Template
            </button>
          </div>
          
          <AnimatePresence>
            {showTemplate && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-blue-50 rounded-xl overflow-hidden mb-4"
                >
                    <div className="p-4 text-xs text-slate-600 space-y-2">
                            <p className="font-bold">Format Example:</p>
                            <ul className="list-disc list-inside space-y-1 ml-1 opacity-80">
                            <li>People: Number & Ages</li>
                            <li>Route: From -> To</li>
                            <li>Time: Dates & Duration</li>
                            <li>Transport: Flight/Train</li>
                            <li>Activities: Sightseeing/Business</li>
                            </ul>
                            <button onClick={copyTemplate} className="mt-2 text-blue-600 font-bold underline">
                            Use Example Content
                            </button>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-2 mb-8">
            {chips.map((chip) => (
              <button
                key={chip}
                onClick={() => toggleChip(chip)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedChips.includes(chip)
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105'
                    : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-300'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="p-6 bg-white border-t border-slate-100 z-10 safe-bottom">
        <Button 
          fullWidth 
          onClick={handleSubmit} 
          disabled={!text.trim() && selectedChips.length === 0}
          className="h-14 text-lg"
        >
          Start Planning
        </Button>
      </div>
    </div>
  );
};

// 4. Luggage Screen
const LuggageScreen: React.FC<{
  data: AIPackingListResponse;
  onConfirm: (items: LuggageItem[]) => void;
}> = ({ data, onConfirm }) => {
  const [items, setItems] = useState<LuggageItem[]>(() => {
    return data.luggageRecommendation.items.map((item, idx) => ({
      id: `init-${idx}`,
      type: item.type as any,
      size: item.size || 24,
      label: item.type === 'suitcase' ? 'Suitcase' : item.type === 'backpack' ? 'Backpack' : 'Handbag'
    }));
  });

  const addLuggage = (type: 'suitcase' | 'backpack' | 'handbag') => {
     vibrate(10);
     setItems(prev => [
         ...prev, 
         { 
             id: `new-${Date.now()}`, 
             type, 
             size: type === 'suitcase' ? 24 : 20,
             label: type === 'suitcase' ? 'Suitcase' : type === 'backpack' ? 'Backpack' : 'Handbag'
         }
     ]);
  };

  const removeLuggage = (id: string) => {
    vibrate(10);
    if (items.length <= 1) return; 
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateSize = (id: string, delta: number) => {
    vibrate(5);
    setItems(prev => prev.map(item => {
        if (item.id !== id) return item;
        const newSize = Math.max(10, Math.min(34, item.size + delta));
        return { ...item, size: newSize };
    }));
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="shrink-0 z-10">
        <div className="h-[20vh] min-h-[160px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-b-3xl shadow-lg relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-4 opacity-20">
                <Sun size={80} />
            </div>
            <div className="flex items-start justify-between gap-4 h-full relative z-10">
                 <div className="flex flex-col justify-center h-full flex-1">
                     <div className="flex items-center gap-2 mb-1">
                        <MapPin size={14} className="opacity-80"/>
                        <span className="text-xs font-bold opacity-80 uppercase tracking-wide">Forecast</span>
                     </div>
                     <h2 className="text-3xl font-bold mb-1">{data.weather.tempRange}</h2>
                     <div className="text-sm font-medium opacity-90 leading-tight">{data.weather.summary}</div>
                     <div className="text-[10px] opacity-70 mt-1">{data.weather.rainProb}</div>
                 </div>
                 
                 <div className="flex-1 h-full bg-white/10 backdrop-blur-md rounded-xl p-3 text-xs text-blue-50 border border-white/10 overflow-hidden flex flex-col">
                    <div className="flex items-center gap-1 font-bold mb-1 text-yellow-300 shrink-0">
                         <AlertTriangle size={12} />
                         <span>Smart Tips</span>
                    </div>
                    <div className="overflow-y-auto pr-1 custom-scrollbar">
                        <ul className="list-disc list-inside space-y-2 opacity-90 text-[10px] leading-tight">
                            {data.destinationTips.map((tip, i) => (
                                <li key={i}>{tip}</li>
                            ))}
                        </ul>
                    </div>
                 </div>
            </div>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
              <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-800">Recommendation: {data.luggageRecommendation.packageName}</h3>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">AI Smart Match</span>
              </div>
              
              <AnimatePresence>
                {items.map((item) => (
                    <motion.div 
                        key={item.id}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-4 mb-3"
                    >
                        <div className="flex flex-col items-center gap-1">
                            <button onClick={() => updateSize(item.id, 2)} className="p-1 text-slate-300 hover:text-blue-500 active:scale-90 transition-transform">
                                <ChevronUp size={20} />
                            </button>
                            <div className="w-14 h-14 flex items-center justify-center relative bg-slate-50 rounded-xl">
                                {item.type === 'suitcase' && <Briefcase size={28} className="text-slate-700" />}
                                {item.type === 'backpack' && <Backpack size={28} className="text-slate-700" />}
                                {item.type === 'handbag' && <ShoppingBag size={28} className="text-slate-700" />}
                            </div>
                            <button onClick={() => updateSize(item.id, -2)} className="p-1 text-slate-300 hover:text-blue-500 active:scale-90 transition-transform">
                                <ChevronDown size={20} />
                            </button>
                        </div>

                        <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-slate-700 text-lg">{item.label}</span>
                                <span className="text-sm text-blue-600 font-mono">{item.size}{item.type === 'suitcase' ? '"' : 'L'}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-1 line-clamp-1">
                                {item.type === 'suitcase' ? 'Main luggage' : 'Carry-on essentials'}
                            </div>
                        </div>

                        <button 
                            onClick={() => removeLuggage(item.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </motion.div>
                ))}
              </AnimatePresence>
          </div>

          <div className="grid grid-cols-3 gap-3">
              <button onClick={() => addLuggage('suitcase')} className="group flex flex-col items-center gap-2 p-4 border border-dashed border-slate-300 rounded-2xl text-slate-400 hover:bg-white hover:border-blue-400 hover:text-blue-600 transition-all">
                   <Briefcase size={20} className="group-hover:scale-110 transition-transform" />
                   <span className="text-xs font-bold">Add Suitcase</span>
              </button>
              <button onClick={() => addLuggage('backpack')} className="group flex flex-col items-center gap-2 p-4 border border-dashed border-slate-300 rounded-2xl text-slate-400 hover:bg-white hover:border-blue-400 hover:text-blue-600 transition-all">
                   <Backpack size={20} className="group-hover:scale-110 transition-transform" />
                   <span className="text-xs font-bold">Add Backpack</span>
              </button>
              <button onClick={() => addLuggage('handbag')} className="group flex flex-col items-center gap-2 p-4 border border-dashed border-slate-300 rounded-2xl text-slate-400 hover:bg-white hover:border-blue-400 hover:text-blue-600 transition-all">
                   <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
                   <span className="text-xs font-bold">Add Handbag</span>
              </button>
          </div>
      </div>

      <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <Button 
            fullWidth 
            onClick={() => onConfirm(items)}
            className="h-14 shadow-xl shadow-blue-200"
        >
            Confirm Equipment ({items.length})
        </Button>
      </div>
    </div>
  );
};

// 5. Packing Game Screen
interface PackingGameProps {
  categories: AIPackingListResponse['categories'];
  onFinish: (packedItems: PackedItem[]) => void;
}

const PackingGameScreen: React.FC<PackingGameProps> = ({ categories, onFinish }) => {
  const [queue, setQueue] = useState<PackingItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [packedItems, setPackedItems] = useState<PackedItem[]>([]);
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [feedback, setFeedback] = useState<'pack' | 'discard' | 'later' | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  
  const opacityPack = useTransform(y, [-150, -50], [0, 1]);
  const opacityDiscard = useTransform(y, [50, 150], [0, 1]);
  const opacityLater = useTransform(x, [-150, -50], [0, 1]);

  useEffect(() => {
    const flattened: PackingItem[] = [];
    categories.forEach(cat => {
      cat.items.forEach((item, idx) => {
        flattened.push({
          id: `${cat.name}-${idx}`,
          name: item.name,
          category: cat.name,
          reason: item.reason,
          quantity: item.defaultQuantity || 1
        });
      });
    });
    setQueue(flattened);
  }, [categories]);

  const currentItem = queue[currentIndex];
  // Slice to get upcoming cards for the stack effect
  const visibleItems = queue.slice(currentIndex, currentIndex + 3);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.y < -threshold) {
      completeAction('pack');
    } else if (info.offset.y > threshold) {
      completeAction('discard');
    } else if (info.offset.x < -threshold) {
      completeAction('later');
    }
  };

  const completeAction = (action: 'pack' | 'discard' | 'later') => {
    vibrate(30);
    setFeedback(action);
    if (action === 'pack' || action === 'later') {
      const status = action === 'pack' ? 'packed' : 'later';
      setPackedItems(prev => [...prev, { ...currentItem, quantity: currentQuantity, status }]);
    }
    
    setTimeout(() => {
      setFeedback(null);
      setCurrentQuantity(1);
      x.set(0);
      y.set(0);
      
      if (currentIndex < queue.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        onFinish(packedItems);
      }
    }, 400);
  };

  const handleUndo = () => {
      vibrate(10);
      if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
          const previousItem = queue[currentIndex - 1];
          setPackedItems(prev => prev.filter(i => i.id !== previousItem.id));
      }
  };

  if (!currentItem) return null;

  const progress = ((currentIndex) / queue.length) * 100;

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-slate-100">
      <div className="h-1.5 bg-slate-200 w-full relative">
        <motion.div 
          className="h-full bg-blue-600 rounded-r-full" 
          animate={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4 flex justify-between items-center w-full px-6 z-10">
        <button 
            onClick={handleUndo} 
            disabled={currentIndex === 0}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-500 disabled:opacity-30 transition-all hover:bg-slate-50 active:scale-95"
        >
            <Undo2 size={20} />
        </button>
        <div className="flex flex-col items-center">
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
            {currentItem.category}
            </span>
            <span className="text-[10px] text-slate-300 font-mono">
                {currentIndex + 1} / {queue.length}
            </span>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex items-center justify-center relative perspective-1000">
        {/* Helper Indicators */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-0 right-0 flex flex-col items-center opacity-30">
                <ArrowUp size={32} className="text-blue-500 animate-bounce" />
                <span className="text-xs font-bold text-blue-500 mt-1 uppercase tracking-widest">Pack It</span>
            </div>
            <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center opacity-30">
                <span className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Discard</span>
                <ArrowDown size={32} className="text-slate-400 animate-bounce" />
            </div>
            <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col items-center opacity-30">
                <ArrowLeft size={32} className="text-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-red-500 mt-1 uppercase w-12 text-center leading-tight">Pack Later</span>
            </div>
        </div>

        {/* Stacked Cards */}
        <div className="relative w-full max-w-sm flex justify-center items-center h-[420px]">
            <AnimatePresence>
                {visibleItems.map((item, index) => {
                    const isTop = index === 0;
                    // Stack logic: Cards behind get smaller, lower, and more transparent
                    const stackedScale = 1 - (index * 0.05);
                    const stackedY = index * 20; 
                    const stackedOpacity = 1 - (index * 0.2);
                    const zIndex = 30 - index;

                    if (!isTop) {
                        return (
                            <motion.div
                                key={item.id}
                                initial={false}
                                animate={{ scale: stackedScale, y: stackedY, opacity: stackedOpacity }}
                                transition={{ duration: 0.3 }}
                                className="absolute w-72 h-[420px] bg-white rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center justify-center p-6 select-none"
                                style={{ zIndex }}
                            >
                                <div className="w-36 h-36 rounded-full bg-slate-50 flex items-center justify-center mb-8 border-4 border-white">
                                    {getItemIcon(item.name, item.category)}
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 text-center mb-3 leading-tight opacity-50">{item.name}</h2>
                            </motion.div>
                        );
                    }

                    // Interactive Top Card
                    return (
                        !feedback && (
                            <motion.div
                                key={item.id}
                                style={{ x, y, rotate, cursor: 'grab', zIndex }}
                                drag
                                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                dragElastic={0.6}
                                onDragEnd={handleDragEnd}
                                whileTap={{ cursor: 'grabbing', scale: 1.05 }}
                                className="absolute w-72 h-[420px] bg-white rounded-[32px] shadow-2xl shadow-blue-900/10 border border-slate-100 flex flex-col items-center justify-center p-6 z-20 select-none"
                            >
                                <motion.div style={{ opacity: opacityPack }} className="absolute top-6 bg-green-500 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-green-200 tracking-wider">PACK</motion.div>
                                <motion.div style={{ opacity: opacityDiscard }} className="absolute bottom-6 bg-slate-400 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-slate-200 tracking-wider">DISCARD</motion.div>
                                <motion.div style={{ opacity: opacityLater }} className="absolute left-6 top-1/2 -rotate-90 origin-left bg-red-500 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-red-200 tracking-wider whitespace-nowrap">LATER</motion.div>

                                <div className="flex-1 flex flex-col items-center justify-center w-full">
                                    <div className="w-36 h-36 rounded-full bg-blue-50 flex items-center justify-center mb-8 relative border-4 border-white shadow-inner">
                                        {getItemIcon(item.name, item.category)}
                                    </div>
                                    
                                    <h2 className="text-2xl font-bold text-slate-800 text-center mb-3 leading-tight">{item.name}</h2>
                                    <p className="text-sm text-slate-500 text-center px-4 leading-relaxed line-clamp-3">{item.reason}</p>
                                    
                                    <div className="mt-8 flex items-center gap-5 bg-slate-50 rounded-full px-2 py-1.5 border border-slate-100 shadow-sm" onPointerDown={(e) => e.stopPropagation()}>
                                        <button 
                                            onClick={() => { vibrate(5); setCurrentQuantity(q => Math.max(1, q - 1)); }}
                                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-600 shadow-sm active:scale-90 transition-all hover:bg-slate-100"
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <span className="font-bold text-xl w-8 text-center text-slate-700">{currentQuantity}</span>
                                        <button 
                                            onClick={() => { vibrate(5); setCurrentQuantity(q => q + 1); }}
                                            className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-200 active:scale-90 transition-all hover:bg-blue-700"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    );
                }).reverse()}
            </AnimatePresence>
        </div>
        
        {/* Feedback Animations */}
        <AnimatePresence>
            {feedback === 'pack' && <motion.div initial={{ scale: 0.5, opacity: 0, y: 0 }} animate={{ scale: 1.5, y: -100, opacity: 1 }} exit={{ opacity: 0 }} className="absolute z-30 pointer-events-none"><Check size={100} className="text-green-500 drop-shadow-xl" /></motion.div>}
            {feedback === 'discard' && <motion.div initial={{ scale: 0.5, opacity: 0, y: 0 }} animate={{ scale: 1.5, y: 100, opacity: 1 }} exit={{ opacity: 0 }} className="absolute z-30 pointer-events-none"><X size={100} className="text-slate-400 drop-shadow-xl" /></motion.div>}
            {feedback === 'later' && <motion.div initial={{ scale: 0.5, opacity: 0, x: 0 }} animate={{ scale: 1.5, x: -100, opacity: 1 }} exit={{ opacity: 0 }} className="absolute z-30 pointer-events-none"><Flag size={100} className="text-red-500 drop-shadow-xl" /></motion.div>}
        </AnimatePresence>
      </div>

      <div className="p-8 grid grid-cols-3 gap-6 safe-bottom">
        <button onClick={() => completeAction('later')} className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 shadow-sm active:scale-90 transition-transform border border-red-100"><Flag size={24} /><span className="text-[10px] mt-1 font-bold">LATER</span></button>
        <button onClick={() => completeAction('discard')} className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-white text-slate-400 shadow active:scale-90 transition-transform mx-auto border border-slate-100"><X size={24} /><span className="text-[10px] mt-1 font-bold">DISCARD</span></button>
        <button onClick={() => completeAction('pack')} className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-200 active:scale-90 transition-transform ml-auto"><ArrowUp size={28} /><span className="text-[10px] mt-1 font-bold">PACK</span></button>
      </div>
    </div>
  );
};

// 6. Chat Overlay Component
const ChatOverlay: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  plan: string;
  data: AIPackingListResponse;
}> = ({ isOpen, onClose, plan, data }) => {
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
      { role: 'model', text: `Hi! I'm your Packwise Assistant. I know you're heading to a place where it's ${data.weather.summary}. Ask me anything!` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatRef.current) {
        chatRef.current = createAssistantChat(plan, data);
    }
  }, [isOpen, plan, data]);

  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !chatRef.current) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
        const result = await chatRef.current.sendMessage({ message: userMsg });
        const responseText = result.text;
        setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (e) {
        setMessages(prev => [...prev, { role: 'model', text: "Sorry, I had trouble connecting. Please try again." }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
      <AnimatePresence>
          {isOpen && (
              <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    onClick={onClose}
                />
                <motion.div 
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                    className="fixed bottom-0 left-0 right-0 h-[80vh] bg-slate-50 rounded-t-3xl z-[70] flex flex-col shadow-2xl overflow-hidden"
                >
                    <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Packwise Assistant</h3>
                                <p className="text-xs text-slate-400">Powered by Gemini</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                            <ChevronDown size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin text-blue-500" />
                                    <span className="text-xs text-slate-400">Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-white border-t border-slate-100 shrink-0 safe-bottom">
                        <div className="flex items-center gap-2">
                            <input 
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Ask about weather, items..."
                                className="flex-1 bg-slate-100 border-none rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                            />
                            <button 
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200"
                            >
                                <Send size={20} className={isLoading ? 'opacity-0' : 'ml-0.5'} />
                            </button>
                        </div>
                    </div>
                </motion.div>
              </>
          )}
      </AnimatePresence>
  );
};


// 7. Summary Screen (Travel Card & Sharing)
const SummaryScreen: React.FC<{
  packedItems: PackedItem[];
  packingData: AIPackingListResponse | null;
  planDescription: string;
  onUpdateItems: (newItems: PackedItem[]) => void;
}> = ({ packedItems, packingData, planDescription, onUpdateItems }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  
  const laterItems = packedItems.filter(i => i.status === 'later');
  const totalItems = packedItems.reduce((acc, item) => acc + item.quantity, 0);

  // Group items by category
  const categories = React.useMemo(() => {
    return Array.from(new Set(packedItems.map(i => i.category)));
  }, [packedItems]);

  const handleDelete = (id: string) => {
      vibrate(20);
      onUpdateItems(packedItems.filter(i => i.id !== id));
  };

  const handleAddItem = (category: string, name: string) => {
      if (!name.trim()) return;
      const newItem: PackedItem = {
          id: `custom-${Date.now()}`,
          name: name,
          category: category,
          quantity: 1,
          status: 'packed'
      };
      onUpdateItems([...packedItems, newItem]);
      setAddingToCategory(null);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      <div className="bg-white p-6 pb-4 shadow-sm z-10 shrink-0">
         <div className="flex justify-between items-start mb-4">
             <div>
                <h2 className="text-2xl font-bold text-slate-800">Packing Complete!</h2>
                <p className="text-sm text-slate-500 mt-1">You are all set for a great trip.</p>
             </div>
             <button onClick={() => setShowShareModal(true)} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100">
                 <Share2 size={20} />
             </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
             <div className="space-y-4 pb-24">
                 {/* Total Count Row - TOP */}
                 <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex justify-between items-center mb-6">
                    <span className="font-bold text-blue-800">Total Items</span>
                    <span className="font-bold text-2xl text-blue-600">{totalItems}</span>
                 </div>

                 {categories.map((category) => {
                     const itemsInCategory = packedItems.filter(i => i.category === category);
                     return (
                         <div key={category} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                             <div className="bg-slate-50/50 px-4 py-3 flex justify-between items-center border-b border-slate-50">
                                 <span className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                     {category}
                                 </span>
                                 <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{itemsInCategory.reduce((a, b) => a + b.quantity, 0)}</span>
                             </div>
                             
                             <div className="divide-y divide-slate-50">
                                 {itemsInCategory.map((item) => (
                                     <div key={item.id} className="relative overflow-hidden bg-white">
                                         <div className="absolute inset-y-0 left-0 w-20 bg-red-500 flex items-center justify-start px-4">
                                            <Trash2 size={18} className="text-white" />
                                         </div>

                                         <motion.div
                                             drag="x"
                                             dragConstraints={{ left: 0, right: 0 }}
                                             dragElastic={{ left: 0, right: 0.1 }}
                                             onDragEnd={(_, info) => {
                                                 if (info.offset.x > 100) handleDelete(item.id);
                                             }}
                                             className="flex justify-between items-center p-3 relative bg-white z-10"
                                         >
                                             <div className="flex items-center gap-3">
                                                 <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${item.status === 'later' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                                    {getItemIcon(item.name, item.category)}
                                                 </div>
                                                 <div className="flex flex-col">
                                                    <span className="text-slate-700 text-sm font-medium">{item.name}</span>
                                                    <span className="text-[10px] text-slate-400">{item.status === 'later' ? 'Last minute item' : 'Packed'}</span>
                                                 </div>
                                             </div>
                                             <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-slate-400 font-mono">x{item.quantity}</span>
                                             </div>
                                         </motion.div>
                                     </div>
                                 ))}
                             </div>
                             
                             <div className="p-2 bg-slate-50/30">
                                 {addingToCategory === category ? (
                                     <div className="flex gap-2 p-1">
                                         <input 
                                            autoFocus
                                            placeholder="Item name..." 
                                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddItem(category, e.currentTarget.value);
                                            }}
                                         />
                                         <button onClick={() => setAddingToCategory(null)} className="p-2 text-slate-400 hover:text-slate-600"><X size={18} /></button>
                                     </div>
                                 ) : (
                                     <button 
                                        onClick={() => setAddingToCategory(category)}
                                        className="w-full py-2 flex items-center justify-center gap-1 text-xs font-bold text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-dashed border-blue-200"
                                     >
                                         <Plus size={14} /> Add Item
                                     </button>
                                 )}
                             </div>
                         </div>
                     );
                 })}
             </div>
      </div>

      {laterItems.length > 0 && (
          <div className="absolute bottom-24 left-4 right-4 max-w-md mx-auto z-40 pointer-events-none">
             <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="bg-white shadow-2xl shadow-red-900/10 rounded-2xl overflow-hidden border border-red-50 pointer-events-auto">
                <div className="bg-red-50/80 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-red-600">
                            <div className="p-1 bg-white rounded-md shadow-sm"><Flag size={14} /></div>
                            <span className="font-bold text-sm">Pack Before Leaving ({laterItems.length})</span>
                        </div>
                        <span className="text-[10px] text-red-400">Set alarm recommended</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {laterItems.slice(0, 5).map((i, idx) => (
                            <span key={idx} className="text-[10px] text-red-600 bg-white px-2 py-1 rounded-md border border-red-100 font-medium shadow-sm">{i.name}</span>
                        ))}
                        {laterItems.length > 5 && <span className="text-[10px] text-red-400 px-1">+{laterItems.length - 5}</span>}
                    </div>
                    <Button variant="primary" fullWidth className="text-sm h-10 bg-red-500 hover:bg-red-600 shadow-red-200 border-none text-white">
                        <Calendar size={16} className="inline mr-2" />
                        Add to Calendar
                    </Button>
                </div>
             </motion.div>
          </div>
      )}

      {/* FAB for Chat */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowChat(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center z-50"
      >
        <MessageCircle size={24} fill="currentColor" className="text-white" />
      </motion.button>

      {/* Share Modal Mockup */}
      <AnimatePresence>
          {showShareModal && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
                    onClick={e => e.stopPropagation()}
                  >
                      <div className="bg-blue-600 p-6 text-white text-center relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-full opacity-20"><Plane size={200} className="absolute -right-10 -top-10 rotate-12" /></div>
                          <h3 className="text-xl font-bold relative z-10 mb-1">My Packing List</h3>
                          <p className="text-blue-200 text-xs relative z-10">{packingData?.weather.summary} • {totalItems} Items</p>
                      </div>
                      <div className="p-6">
                          <div className="flex justify-around mb-6 text-center">
                              <div><div className="font-bold text-xl text-slate-800">{packedItems.length}</div><div className="text-xs text-slate-400">Packed</div></div>
                              <div><div className="font-bold text-xl text-red-500">{laterItems.length}</div><div className="text-xs text-slate-400">Later</div></div>
                              <div><div className="font-bold text-xl text-blue-500">100%</div><div className="text-xs text-slate-400">Ready</div></div>
                          </div>
                          <Button fullWidth onClick={() => setShowShareModal(false)}>Save Image</Button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {packingData && (
          <ChatOverlay 
            isOpen={showChat} 
            onClose={() => setShowChat(false)} 
            plan={planDescription} 
            data={packingData} 
          />
      )}
    </div>
  );
};


// --- MAIN APP COMPONENT ---

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [currentPlan, setCurrentPlan] = useState('');
  const [packingData, setPackingData] = useState<AIPackingListResponse | null>(null);
  const [luggageList, setLuggageList] = useState<LuggageItem[]>([]);
  const [packedItems, setPackedItems] = useState<PackedItem[]>([]);
  
  const handlePlanSubmit = async (plan: string) => {
    setCurrentPlan(plan);
    setScreen('processing_plan');
    try {
      const data = await generatePackingList(plan);
      setPackingData(data);
      setScreen('luggage_selection');
    } catch (error) {
      console.error("AI Error:", error);
      alert("AI Connection Failed. Please check your network.");
      setScreen('input');
    }
  };

  const handleLuggageConfirm = (items: LuggageItem[]) => {
    setLuggageList(items);
    setScreen('packing_game');
  };

  const handlePackingFinished = async (items: PackedItem[]) => {
    setPackedItems(items);
    setScreen('summary');
  };

  return (
    <div className="h-full w-full relative">
      <AnimatePresence mode="wait">
        {screen === 'splash' && (
          <SplashScreen key="splash" onComplete={() => setScreen('input')} />
        )}
        
        {screen === 'input' && (
          <PlanInputScreen key="input" onSubmit={handlePlanSubmit} />
        )}

        {screen === 'processing_plan' && (
           <LoadingOverlay key="loading1" message="Smartly customizing your packing plan..." />
        )}

        {screen === 'luggage_selection' && packingData && (
          <LuggageScreen 
            key="luggage" 
            data={packingData}
            onConfirm={handleLuggageConfirm}
          />
        )}

        {screen === 'packing_game' && packingData && (
          <PackingGameScreen 
            key="game"
            categories={packingData.categories}
            onFinish={handlePackingFinished}
          />
        )}

        {screen === 'summary' && (
          <SummaryScreen 
            key="summary" 
            packedItems={packedItems}
            packingData={packingData}
            planDescription={currentPlan}
            onUpdateItems={setPackedItems}
          />
        )}
      </AnimatePresence>
    </div>
  );
}