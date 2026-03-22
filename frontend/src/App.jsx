import { useState, useEffect, useRef } from 'react';

function App() {
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); 

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState(''); 
  const [level, setLevel] = useState(1);
  const [goal, setGoal] = useState('Hypertrophy');
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(175);
  const [age, setAge] = useState(20);
  const [isMale, setIsMale] = useState(true);
  
  const [activity, setActivity] = useState('Sedentary');
  const [currentBody, setCurrentBody] = useState('SkinnyFat'); 
  const [goalBody, setGoalBody] = useState('Muscular');   

  const [workoutData, setWorkoutData] = useState(null);
  const [dietData, setDietData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const [quoteIdx, setQuoteIdx] = useState(0);
  const quotes = [
    "Execute the protocol. Trust the data.",
    "Your future morphology is watching. Make it proud.",
    "Hydrate. Breathe. Optimize Recovery Mapping.",
    "Consistency > Intensity. Show up.",
    "The neural data doesn't lie. Precision is power.",
    "Sweat is your body's way of showing progress.",
    "Pain is temporary, but pride is forever.",
    "The only bad workout is the one you didn't do.",
    "Lift heavy, live light."
  ];

  const workoutRef = useRef(null);
  const dietRef = useRef(null);
  const [activeDashboardSection, setActiveDashboardSection] = useState("base");

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: "Hello, I am your Neural.FIT AI Coach. Ask me any questions about health, recovery, or your protocol." }
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const today = new Date().getDay();
    setSelectedDay(today === 0 ? 6 : today - 1);
    const quoteInterval = setInterval(() => setQuoteIdx((prev) => (prev + 1) % quotes.length), 7000);
    return () => clearInterval(quoteInterval);
  }, []);

  useEffect(() => {
    if (email && !displayName) setDisplayName(email.split('@')[0]);
  }, [email, displayName]);

  useEffect(() => {
    if (step !== 4) return; 
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
          if (entry.target.id === 'workout-section') setActiveDashboardSection('workout');
          if (entry.target.id === 'diet-section') setActiveDashboardSection('diet');
        }
      });
    }, { threshold: [0.2, 0.5, 0.8] }); 

    if (workoutRef.current) observer.observe(workoutRef.current);
    if (dietRef.current) observer.observe(dietRef.current);

    return () => {
      if (workoutRef.current) observer.unobserve(workoutRef.current);
      if (dietRef.current) observer.unobserve(dietRef.current);
    };
  }, [step]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  const safeWeight = parseFloat(weight) || 75;
  const safeHeight = parseFloat(height) || 175;
  const safeAge = parseInt(age) || 20;
  const bmi = (safeWeight / ((safeHeight / 100) * (safeHeight / 100))).toFixed(1);

  const generatePlans = async () => {
    setLoading(true); setWorkoutData(null); setDietData(null); setMenuOpen(false);

    try {
      const workoutRes = await fetch('https://neural-fit-your-ai-health-companion.onrender.com/generate-workout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: parseInt(level) || 1, goal: goal || 'Hypertrophy' })
      });
      
      if (!workoutRes.ok) {
          const errText = await workoutRes.text();
          throw new Error(`Backend Workout Engine Failed (${workoutRes.status}): ${errText}`);
      }
      
      const workoutResult = await workoutRes.json();
      const startFocus = workoutResult['Day_1']?.Focus || 'Rest';

      const dietRes = await fetch('https://neural-fit-your-ai-health-companion.onrender.com/generate-diet', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight_kg: safeWeight, height_cm: safeHeight, age: safeAge, 
          is_male: Boolean(isMale), workout_focus: startFocus, goal: goal || 'Hypertrophy'
        })
      });
      
      if (!dietRes.ok) {
          const errText = await dietRes.text();
          throw new Error(`Backend Diet Engine Failed (${dietRes.status}): ${errText}`);
      }
      
      const dietResult = await dietRes.json();
      
      setWorkoutData(workoutResult); setDietData(dietResult); setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveDashboardSection('base');

    } catch (error) {
      console.error("Full Error Output:", error);
      alert(`SYSTEM ALERT:\n\n${error.message}\n\nIf this says "Failed to fetch", your Python Uvicorn server is completely turned off or crashed! Check your VS Code terminal!`);
    }
    setLoading(false);
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', text: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsChatTyping(true);

    try {
      const response = await fetch('https://neural-fit-your-ai-health-companion.onrender.com/ask-coach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.text })
      });
      if (!response.ok) throw new Error("API Blocked");
      const data = await response.json();
      setChatMessages((prev) => [...prev, { role: 'ai', text: data.response }]);
    } catch (error) {
      setChatMessages((prev) => [...prev, { role: 'ai', text: "Connection error. Ensure your Python backend server is running!" }]);
    }
    setIsChatTyping(false);
  };

  const logout = () => { setEmail(''); setDisplayName(''); setStep(0); setWorkoutData(null); setDietData(null); };
  const editProfile = () => { setMenuOpen(false); setStep(1); };

  const onboardingBackgrounds = [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920", 
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1920", 
    "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=1920", 
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1920", 
  ];

  const dashboardBackgrounds = {
    "base": "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1920", 
    "diet": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1920", 
    "workout_Chest/Push": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1920", 
    "workout_Back/Pull": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1920", 
    "workout_Legs": "https://images.unsplash.com/photo-1434596922112-19c563067271?q=80&w=1920", 
    "workout_Arms": "https://images.unsplash.com/photo-1581009137042-c552e485697a?q=80&w=1920",
    "workout_Shoulders": "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1920", 
    "workout_Rest": "https://plus.unsplash.com/premium_photo-1682096640844-1ae5381c5580?w=600&auto=format&fit=crop&q=60", 
    "workout_Default": "https://images.unsplash.com/photo-1517836357463-d25dfe09ce14?q=80&w=1920"
  };

  let activeBgKey = 'base';
  if (step === 4) {
    if (activeDashboardSection === 'diet') activeBgKey = 'diet';
    if (activeDashboardSection === 'workout') {
      const focus = workoutData ? workoutData[`Day_${selectedDay + 1}`]?.Focus : 'Default';
      activeBgKey = dashboardBackgrounds[`workout_${focus}`] ? `workout_${focus}` : 'workout_Default';
    }
  }

  const handleLoginSubmit = (e) => { e.preventDefault(); if (email) nextStep(); };
  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const renderOnboardingUI = () => {
    const renderLogin = () => (
      <div className="flex flex-col items-center justify-center min-h-screen animate-fade-in-up">
        <form onSubmit={handleLoginSubmit} className="bg-zinc-950/80 backdrop-blur-xl p-10 rounded-3xl border border-zinc-800 shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-cyan-500 mb-2 tracking-tighter">NEURAL.FIT</h1>
            <p className="text-zinc-400 text-sm">Authenticate identity to access optimized protocols.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase">Email Address</label>
              <input type="email" required placeholder="athlete@neural.fit" className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase">Password</label>
              <input type="password" required placeholder="••••••••" className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
            </div>
            <button type="submit" className="w-full mt-4 bg-white text-black font-bold text-lg py-4 rounded-xl hover:bg-zinc-200 transition-all transform hover:scale-105 active:scale-95">Authenticate Identity</button>
          </div>
        </form>
      </div>
    );
  
    const renderBasics = () => (
      <div className="flex flex-col items-center justify-center min-h-screen animate-fade-in-up p-4">
        <div className="bg-zinc-950/90 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800 shadow-2xl w-full max-w-2xl transform transition-transform duration-500 hover:scale-[1.01]">
          <h2 className="text-3xl font-black text-white mb-2">Neural Calibration Phase I</h2>
          <p className="text-zinc-400 mb-8">Establish baseline biometrics.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Full Name / Alias</label>
              <input type="text" className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="User123" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Age (Years)</label>
              <input type="number" required className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Weight (kg)</label>
              <input type="number" required className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Height (cm)</label>
              <input type="number" required className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none" value={height} onChange={(e) => setHeight(e.target.value)} />
            </div>
            <div className="col-span-1 sm:col-span-2 space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase block">Biological Sex</label>
              <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setIsMale(true)} className={`p-4 rounded-xl font-bold border-2 transition-all ${isMale ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400'}`}>Male</button>
                  <button onClick={() => setIsMale(false)} className={`p-4 rounded-xl font-bold border-2 transition-all ${!isMale ? 'bg-rose-600 border-rose-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400'}`}>Female</button>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <button onClick={prevStep} className="px-6 py-4 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white transition-all font-bold">Back</button>
            <button onClick={nextStep} className="flex-grow bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl transition-all transform hover:scale-105 active:scale-95">Next: Daily Load</button>
          </div>
        </div>
      </div>
    );
  
    const renderLifestyle = () => {
      const options = [
        { id: 'Sedentary', title: "Desk Bound", desc: "Mostly sitting, minimal motion.", img: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=500&q=80" },
        { id: 'Light', title: "Light Activity", desc: "Desk job, short walks.", img: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=500&q=80" },
        { id: 'Active', title: "Active Worker", desc: "On feet often, moving daily.", img: "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=500&q=80" },
        { id: 'Highly Active', title: "Power Output", desc: "Heavy Labor, extreme metabolism.", img: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=500&q=80" },
        { id: 'Athlete', title: "Elite Sport", desc: "Train 2x daily.", img: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=500&q=80" } 
      ];
      return (
        <div className="flex flex-col items-center justify-center min-h-screen animate-fade-in-up p-4 overflow-x-hidden">
          <div className="bg-zinc-950/90 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800 shadow-2xl w-full max-w-7xl">
            <h2 className="text-3xl font-black text-white mb-2">Daily Kinetic Load</h2>
            <p className="text-zinc-400 mb-8 max-w-xl">Define everyday motion parameters.</p>
            <div className="flex gap-6 mb-10 pb-4 overflow-x-auto custom-scrollbar h-[380px] sm:h-[450px]">
              {options.map((opt) => (
                <div key={opt.id} onClick={() => setActivity(opt.id)} className={`relative min-w-[280px] rounded-2xl cursor-pointer overflow-hidden border-4 transition-all duration-300 transform hover:scale-105 ${activity === opt.id ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'border-transparent opacity-80'}`}>
                  <img src={opt.img} alt={opt.title} className="absolute inset-0 w-full h-full object-cover" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${activity === opt.id ? 'from-emerald-950/90 to-transparent' : 'from-zinc-900/90 to-transparent'}`}></div>
                  <div className="absolute bottom-0 left-0 p-5">
                    <h3 className="text-2xl font-black text-white tracking-tighter">{opt.title}</h3>
                    <p className="text-sm text-zinc-300 font-medium">{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between gap-4">
              <button onClick={prevStep} className="px-6 py-4 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white transition-all font-bold">Back</button>
              <button onClick={nextStep} className="flex-grow bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl transition-all transform hover:scale-105 active:scale-95">Next: Morphology Morph</button>
            </div>
          </div>
        </div>
      );
    };
  
    const renderBodyType = () => {
      const bodies = [
        { id: 'Skinny', title: "Skinny", img: "https://plus.unsplash.com/premium_photo-1661892196013-b1bc6cdcc87c?w=600&auto=format&fit=crop&q=60" }, 
        { id: 'SkinnyFat', title: "Skinny Fat", img: "https://images.unsplash.com/photo-1625851623647-0dcf2911b563?w=600&auto=format&fit=crop&q=60" },
        { id: 'Lean', title: "Lean", img: "https://images.unsplash.com/photo-1747861912941-da0bbfd3ebb9?w=600&auto=format&fit=crop&q=60" }, 
        { id: 'Athletic', title: "Athletic", img: "https://plus.unsplash.com/premium_photo-1664298352263-9cf691753fce?w=600&auto=format&fit=crop&q=60" },
        { id: 'Muscular', title: "Muscular", img: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=500&q=80" }, 
        { id: 'Powerlifter', title: "Powerlifter", img: "https://images.unsplash.com/photo-1750552485970-4621af274df4?w=600&auto=format&fit=crop&q=60" },
        { id: 'Fat', title: "Fat", img: "https://media.istockphoto.com/id/1300813997/photo/man-with-extra-weight-on-his-belly-grabs-his-skin-isolated-on-black-background.webp?a=1&b=1&s=612x612&w=0&k=20&c=GMfwCJ_5qcOm50pXA876Y_ddq6uNUA_VYEZs96GNxwI=" }, 
        { id: 'Overweight', title: "Overweight", img: "https://plus.unsplash.com/premium_photo-1716666260484-a8051d233167?w=600&auto=format&fit=crop&q=60" },
        { id: 'Obese', title: "Obese", img: "https://plus.unsplash.com/premium_photo-1716666260327-e1a0755ddd59?w=600&auto=format&fit=crop&q=60" }
      ];
      return (
        <div className="flex flex-col items-center justify-center min-h-screen animate-fade-in-up p-4 overflow-x-hidden">
          <div className="bg-zinc-950/90 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800 shadow-2xl w-full max-w-7xl transition-transform transform hover:scale-[1.01]">
            <h2 className="text-3xl font-black text-white mb-2">Morphology Morph</h2>
            <p className="text-zinc-400 mb-10">Define starting architecture and target destination.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10 pb-4 overflow-y-auto custom-scrollbar h-[550px] sm:h-[650px]">
              <div className="space-y-4">
                <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2 sticky top-0 bg-zinc-950 p-2 z-10 rounded-lg"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> START ARCHITECTURE</h3>
                <div className="grid grid-cols-3 gap-3">
                  {bodies.map((b) => (
                    <div key={`cur-${b.id}`} onClick={() => setCurrentBody(b.id)} className={`relative h-28 sm:h-36 w-full rounded-2xl cursor-pointer overflow-hidden border-4 transition-all hover:scale-105 ${currentBody === b.id ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'border-zinc-800 opacity-60'}`}>
                      <img src={b.img} className="absolute inset-0 w-full h-full object-cover object-top" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-2"><span className="font-black text-white text-xs sm:text-sm leading-tight">{b.title}</span></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-cyan-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2 sticky top-0 bg-zinc-950 p-2 z-10 rounded-lg"><span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span> TARGET DESTINATION</h3>
                <div className="grid grid-cols-3 gap-3">
                  {bodies.map((b) => (
                    <div key={`goal-${b.id}`} onClick={() => setGoalBody(b.id)} className={`relative h-28 sm:h-36 w-full rounded-2xl cursor-pointer overflow-hidden border-4 transition-all hover:scale-105 ${goalBody === b.id ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'border-zinc-800 opacity-60'}`}>
                      <img src={b.img} className="absolute inset-0 w-full h-full object-cover object-top" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-2"><span className="font-black text-white text-xs sm:text-sm leading-tight">{b.title}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
  
            <div className="flex flex-col sm:flex-row justify-between gap-4 sticky bottom-0 bg-zinc-950 pt-4 z-10">
              <button onClick={prevStep} className="px-6 py-4 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white transition-all font-bold">Back</button>
              <button onClick={generatePlans} disabled={loading || !currentBody || !goalBody} className="flex-grow bg-gradient-to-r from-emerald-500 to-cyan-500 text-zinc-950 font-black text-xl py-4 rounded-xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50">
                {loading ? 'CALCULATING OPTIMIZATION ITINERARY...' : 'GENERATE MASTER PROTOCOLS'}
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <>
        {step === 0 && renderLogin()}
        {step === 1 && renderBasics()}
        {step === 2 && renderLifestyle()}
        {step === 3 && renderBodyType()}
      </>
    );
  };

  const renderDashboardUI = () => (
    <div className="min-h-screen relative overflow-x-hidden bg-[#09090b] scroll-smooth">

      <header className="fixed top-0 left-0 w-full z-50 p-4 border-b bg-zinc-950/60 backdrop-blur-xl border-zinc-800 transition-all duration-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center relative">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-emerald-400 tracking-tighter">N.FIT</h1>
            <div className="hidden md:block">
                <p className="text-zinc-200 font-black">Hi, {displayName || 'Athlete'}</p>
                <p className="text-xs text-zinc-400 font-medium tracking-wide">Bracket: <span className="text-emerald-400">{bmi}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-2">
                <a href="#workout-section" className="text-sm font-semibold text-zinc-400 hover:text-white">Workout</a>
                <span className='text-zinc-700'>/</span>
                <a href="#diet-section" className="text-sm font-semibold text-zinc-400 hover:text-white">Nutrition</a>
             </div>
             <div className="relative">
                <button onClick={() => setMenuOpen(!menuOpen)} className="w-12 h-12 rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center hover:border-emerald-500 transition-all">
                    <span className="font-bold text-lg text-emerald-400 uppercase">{displayName ? displayName.slice(0, 1) : 'A'}</span>
                </button>
                {menuOpen && (
                    <div className="absolute top-14 right-0 w-56 p-2 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl animate-fade-in-down z-50">
                        <div className="p-3 border-b border-zinc-800">
                            <p className="text-sm font-bold text-white">{displayName || 'Athlete'}</p>
                            <p className="text-xs text-zinc-500 truncate">{email}</p>
                        </div>
                        <button onClick={editProfile} className="w-full text-left p-3 rounded-lg text-sm font-medium hover:bg-zinc-800 text-zinc-200">Update Profile</button>
                        <button onClick={logout} className="w-full text-left p-3 rounded-lg text-sm font-medium hover:bg-zinc-800 text-rose-400">Logout</button>
                    </div>
                )}
             </div>
          </div>
        </div>
      </header>
      
      <div className="fixed inset-0 z-0 bg-[#09090b]">
          {Object.entries(dashboardBackgrounds).map(([key, url]) => (
              <img 
                key={key} 
                src={url} 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${activeBgKey === key ? 'opacity-50' : 'opacity-0'}`} 
                alt=""
              />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-[#09090b]/40 via-[#09090b]/20 to-[#09090b]"></div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        
        <section className="animate-fade-in-up min-h-screen flex flex-col justify-center pt-32 mb-10 relative">
            <h2 className="text-5xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500 tracking-tight leading-none mb-4">
                Peak Human <br/>Performance Protocol
            </h2>
            <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-3xl mb-12">Neural-mapped itinerary for morphology optimization and accelerated repair. Follow the data. Execute.</p>
            <a href="#workout-section" className="inline-block px-10 py-4 bg-white text-black font-black text-xl rounded-full hover:bg-zinc-300 transform hover:scale-105 transition-all w-fit">Begin Protocol Itinerary</a>
        </section>

        <div className="flex overflow-x-auto gap-3 mb-24 pb-4 custom-scrollbar justify-start border-b border-zinc-800 sticky top-20 z-40 bg-[#09090b]/80 backdrop-blur-md pt-4">
            {daysOfWeek.map((day, index) => (
            <button key={day} onClick={() => setSelectedDay(index)} className={`px-6 py-3.5 rounded-xl font-black whitespace-nowrap transition-all duration-300 transform hover:scale-105 active:scale-95 text-lg ${selectedDay === index ? 'bg-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                {day} {index === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1) && '(Today)'}
            </button>
            ))}
        </div>

        <section ref={workoutRef} id="workout-section" className="scroll-mt-48 min-h-screen mb-32 relative">
          {workoutData && workoutData[`Day_${selectedDay + 1}`] ? (
            <div className="transition-transform transform duration-500 ease-in-out">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 pb-6 border-b-2 border-zinc-800 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-10 bg-violet-500 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
                        <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">Kinetic Output</h3>
                    </div>
                    <span className="px-5 py-2 rounded-full font-black text-emerald-400 bg-emerald-950/80 border-2 border-emerald-800 whitespace-nowrap text-lg">{currentBody} Morph ➔ {goalBody} Destination</span>
                </div>

                <div className="flex flex-col sm:flex-row justify-between mb-8 pb-6 border-b border-zinc-800 gap-3">
                    <span className="text-zinc-400 font-medium">Daily Focus Area:</span>
                    <span className="px-5 py-2 rounded-full text-base font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 whitespace-nowrap">{workoutData[`Day_${selectedDay + 1}`].Focus.toUpperCase()}</span>
                </div>

              {workoutData[`Day_${selectedDay + 1}`].Focus !== 'Rest' ? (
                <>
                  <p className="text-sm text-emerald-400 font-black mb-12 bg-emerald-900/20 inline-block px-4 py-1.5 rounded-lg tracking-wider">{workoutData[`Day_${selectedDay + 1}`].Reps}</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                    {workoutData[`Day_${selectedDay + 1}`].Exercises.map((ex, i) => (
                      <li key={i} className="bg-zinc-950/80 p-8 rounded-2xl flex items-center gap-5 transition-colors duration-300 group hover:border-2 hover:border-violet-700 backdrop-blur-sm relative z-10">
                        <span className="w-4 h-4 bg-violet-600 rounded-full group-hover:animate-pulse"></span>
                        <span className="font-semibold text-2xl text-zinc-100 group-hover:text-white tracking-tighter">{ex}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center border-4 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/80 backdrop-blur-sm text-center p-8 mt-12 animate-fade-in relative z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-zinc-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-3xl font-black text-zinc-300 tracking-tighter">Active Recovery Protocol</p>
                    <p className="text-zinc-400 mt-2 max-w-sm text-lg">No kinetic data mapped for today. Proceed to mobility itinerary for accelerated neural repair.</p>
                </div>
              )}
            </div>
          ) : <p>Loading Kinetic Data...</p>}
        </section>

        <section ref={dietRef} id="diet-section" className="scroll-mt-32 min-h-screen pb-40 relative">
          {dietData && (
            <div className="transition-transform transform duration-500 ease-in-out">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 pb-6 border-b-2 border-zinc-800 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-10 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                        <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">Nutritional Itinerary</h3>
                    </div>
                </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 relative z-10">
                {[ 
                  {title: 'Kcal', val: dietData.targets.Calories, color: 'text-white'}, 
                  {title: 'Pro', val: dietData.targets.Protein, color: 'text-cyan-400'}, 
                  {title: 'Carb', val: dietData.targets.Carbs, color: 'text-amber-400'}, 
                  {title: 'Fat', val: dietData.targets.Fat, color: 'text-rose-400'} 
                ].map(macro => (
                  <div key={macro.title} className="bg-zinc-950/80 border-4 border-zinc-800 rounded-2xl p-8 text-center transition-all transform hover:scale-105 active:scale-95 hover:border-emerald-700 backdrop-blur-sm">
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Target {macro.title}</p>
                    <p className={`text-4xl sm:text-5xl font-black ${macro.color}`}>{macro.val}<span className='text-xl text-zinc-500'>{macro.title === 'Kcal' ? '' : 'g'}</span></p>
                  </div>
                ))}
              </div>

              <h4 className="text-xl font-bold text-zinc-300 uppercase tracking-widest mb-6 border-b border-zinc-800 pb-2 flex items-center gap-2 relative z-10">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> DAILY FUEL MAP (V2 w/ QUANTITIES + MACROS)
              </h4>
              <div className="space-y-6 relative z-10">
                {dietData.menu.map((food, i) => (
                  <div key={i} className="bg-zinc-950/80 p-6 rounded-2xl border-2 border-zinc-800 flex flex-col md:flex-row md:justify-between md:items-center transition-all hover:bg-zinc-800 group hover:border-emerald-600 backdrop-blur-sm gap-4 md:gap-6">
                    <div>
                      <p className="font-bold text-2xl text-zinc-100 group-hover:text-emerald-400 tracking-tighter leading-tight">{food.Food}</p>
                      <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider bg-emerald-950/80 inline-block px-3 py-1 rounded-md mt-1.5">{food.Meal_Type}</p>
                    </div>
                    <div className="text-left md:text-right whitespace-nowrap space-y-2">
                      <p className="font-black text-white text-3xl group-hover:text-emerald-300 leading-none">{food.Calories} kcal</p>
                      <p className="text-emerald-400 font-bold text-base bg-emerald-950/50 px-3 py-1 rounded-lg inline-block w-fit md:block md:w-auto">Quantity: {food.Quantity}</p>
                      <div className="flex gap-3 text-sm text-zinc-400 font-mono">
                          <span>P: {food.Protein}g</span>
                          <span>C: {food.Carbs}g</span>
                          <span>F: {food.Fat}g</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <aside className={`fixed bottom-6 right-6 z-50 transition-all duration-300 hidden md:flex flex-col items-end ${isChatOpen ? 'w-96' : 'max-w-sm transform hover:scale-105'}`}>
        
        {isChatOpen && (
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-[0_0_40px_rgba(0,0,0,0.7)] rounded-2xl w-full mb-4 overflow-hidden flex flex-col animate-fade-in-up h-[400px]">
            <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex justify-between items-center cursor-pointer hover:bg-zinc-900/80 transition-colors" onClick={() => setIsChatOpen(false)}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500 shrink-0">
                  <img src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=200&q=80" alt="Coach" className="w-full h-full object-cover scale-150 object-center"/>
                </div>
                <div>
                  <span className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> ELITE COACH
                  </span>
                  <p className="text-[10px] text-zinc-500 tracking-widest uppercase">Online</p>
                </div>
              </div>
              <button className="text-zinc-500 hover:text-white font-bold px-2">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-zinc-900/30">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-6 h-6 rounded-full bg-emerald-900 border border-emerald-500 shrink-0 mr-2 flex items-center justify-center">
                      <span className="text-[10px]">🤖</span>
                    </div>
                  )}
                  <div className={`p-3 rounded-2xl max-w-[80%] text-sm leading-relaxed ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none shadow-md' : 'bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-bl-none shadow-md'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatTyping && (
                 <div className="flex justify-start">
                   <div className="w-6 h-6 rounded-full bg-emerald-900 border border-emerald-500 shrink-0 mr-2 flex items-center justify-center"><span className="text-[10px]">🤖</span></div>
                   <div className="p-3 rounded-2xl bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-bl-none text-xs italic flex items-center gap-1">
                     Processing<span className="animate-pulse">...</span>
                   </div>
                 </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} className="p-3 bg-zinc-950 border-t border-zinc-800 flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about recovery, nutrition..." 
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button type="submit" disabled={isChatTyping || !chatInput.trim()} className="bg-emerald-500 text-black px-4 py-2.5 rounded-xl font-black hover:bg-emerald-400 transition-transform active:scale-95 disabled:opacity-50">
                ➔
              </button>
            </form>
          </div>
        )}

        {!isChatOpen && (
          <div onClick={() => setIsChatOpen(true)} className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] p-5 rounded-3xl flex items-center gap-4 cursor-pointer hover:border-emerald-500/50 transition-colors group">
            <div className="w-16 h-16 bg-emerald-950 rounded-full border-4 border-emerald-500 flex items-center justify-center relative shadow-[0_0_15px_rgba(16,185,129,0.3)] overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                <img src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=200&q=80" alt="Coach" className="w-full h-full object-cover scale-150 object-center"/>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-ping z-10"></span>
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-500 mb-1 uppercase tracking-wider flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> ASK AI COACH</p>
              <p className="text-sm text-zinc-200 font-medium animate-coach-breathe leading-relaxed" key={quoteIdx}>"{quotes[quoteIdx]}"</p>
            </div>
          </div>
        )}
      </aside>
    </div>
  );

  return (
    <div className="min-h-screen font-sans selection:bg-emerald-500 selection:text-black relative bg-[#09090b]">
      {step < 4 && (
        <div className="fixed inset-0 z-0 transition-opacity duration-1000 bg-[#09090b]">
            <img src={onboardingBackgrounds[step]} alt="Onboarding Context" className="absolute inset-0 w-full h-full object-cover opacity-50 object-center transition-all duration-1000 ease-in-out" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#09090b]/90 via-transparent to-[#09090b]"></div>
        </div>
      )}

      <div className="relative z-10 w-full h-full">
        {step < 4 && renderOnboardingUI()}
        {step === 4 && renderDashboardUI()}
      </div>
    </div>
  );
}

export default App;