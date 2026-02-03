/**
 * Login/Signup Page
 * Remotion-powered cinematic intro animation
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '@remotion/player';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
  spring,
  Easing,
} from 'remotion';
import { 
  Mail, 
  Lock, 
  Phone, 
  User, 
  ArrowRight, 
  Loader2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ============================================
// REMOTION COMPOSITIONS
// ============================================

// Animated gradient background
const GradientBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Slowed down - 30 seconds for full cycle
  const hue1 = interpolate(frame, [0, 30 * fps], [250, 280], {
    extrapolateRight: 'extend',
  }) % 360;
  
  const hue2 = interpolate(frame, [0, 30 * fps], [270, 320], {
    extrapolateRight: 'extend',
  }) % 360;
  
  return (
    <AbsoluteFill
      style={{
        background: `
          radial-gradient(ellipse at 20% 20%, hsla(${hue1}, 70%, 15%, 1) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, hsla(${hue2}, 60%, 10%, 1) 0%, transparent 50%),
          linear-gradient(180deg, #030014 0%, #0a0520 50%, #030014 100%)
        `,
      }}
    />
  );
};

// Floating orb component
const FloatingOrb: React.FC<{
  x: number;
  y: number;
  size: number;
  delay: number;
  color: string;
  speed?: number;
}> = ({ x, y, size, delay, color, speed = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const delayedFrame = Math.max(0, frame - delay * fps);
  
  const scale = spring({
    frame: delayedFrame,
    fps,
    config: { damping: 20, stiffness: 80, mass: 1 },
  });
  
  // Slowed down floating motion
  const floatY = Math.sin((frame / fps) * speed * 0.3) * 15;
  const floatX = Math.cos((frame / fps) * speed * 0.2) * 8;
  
  // Slower glow pulse
  const glowPulse = interpolate(
    Math.sin((frame / fps) * 0.5),
    [-1, 1],
    [0.3, 0.6]
  );
  
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        transform: `translate(-50%, -50%) translate(${floatX}px, ${floatY}px) scale(${scale})`,
        opacity: glowPulse,
        filter: `blur(${size * 0.1}px)`,
      }}
    />
  );
};

// Animated ring
const AnimatedRing: React.FC<{
  size: number;
  delay: number;
  rotationSpeed?: number;
}> = ({ size, delay, rotationSpeed = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const delayedFrame = Math.max(0, frame - delay * fps);
  
  const scale = spring({
    frame: delayedFrame,
    fps,
    config: { damping: 30, stiffness: 50 },
  });
  
  // Slowed down rotation
  const rotation = (frame / fps) * 6 * rotationSpeed;
  
  const opacity = interpolate(delayedFrame, [0, fps], [0, 0.25], {
    extrapolateRight: 'clamp',
  });
  
  return (
    <div
      style={{
        position: 'absolute',
        left: '25%',
        top: '40%',
        width: size,
        height: size,
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: '50%',
        transform: `translate(-50%, -50%) rotateX(75deg) rotateZ(${rotation}deg) scale(${scale})`,
        opacity,
      }}
    />
  );
};

// Particle system
const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  const particles = React.useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      startX: Math.random() * 100,
      startY: 100 + Math.random() * 20,
      speed: 0.1 + Math.random() * 0.2, // Slowed down
      size: 2 + Math.random() * 3,
      delay: Math.random() * 8, // More spread out timing
    }));
  }, []);
  
  return (
    <AbsoluteFill>
      {particles.map((p) => {
        // Slower particle rise
        const progress = ((frame / fps - p.delay) * p.speed) % 1.5;
        const y = interpolate(progress, [0, 1.2], [p.startY, -20]);
        const opacity = interpolate(progress, [0, 0.2, 1, 1.2], [0, 0.5, 0.5, 0]);
        const x = p.startX + Math.sin(progress * Math.PI) * 1.5;
        
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: '#8b5cf6',
              opacity: Math.max(0, opacity),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Grid lines
const GridLines: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const opacity = interpolate(frame, [0, 2 * fps], [0, 0.1], {
    extrapolateRight: 'clamp',
  });
  
  const scrollY = (frame / fps) * 10;
  
  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundImage: `
          linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        backgroundPosition: `0 ${scrollY}px`,
        transform: 'perspective(500px) rotateX(60deg)',
        transformOrigin: 'center top',
      }}
    />
  );
};

// Central logo reveal
const LogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const scale = spring({
    frame: frame - 0.3 * fps,
    fps,
    config: { damping: 12, stiffness: 80 },
  });
  
  const opacity = interpolate(frame, [0.3 * fps, 0.8 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  
  const rotation = interpolate(frame, [0, 3 * fps], [0, 360], {
    extrapolateRight: 'extend',
  });
  
  const glowIntensity = interpolate(
    Math.sin((frame / fps) * 1.5),
    [-1, 1],
    [15, 35]
  );
  
  return (
    <div
      style={{
        position: 'absolute',
        left: '25%',
        top: '40%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: `0 0 ${glowIntensity}px rgba(139, 92, 246, 0.6)`,
          border: '2px solid rgba(139, 92, 246, 0.3)',
        }}
      >
        <img
          src="/assets/branding/ADW LOGO.png"
          alt="ADW"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    </div>
  );
};

// Text reveal animation
const TextReveal: React.FC<{ text: string; delay: number; style?: React.CSSProperties }> = ({
  text,
  delay,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const delayedFrame = Math.max(0, frame - delay * fps);
  
  return (
    <div style={{ overflow: 'hidden', ...style }}>
      {text.split('').map((char, i) => {
        const charDelay = i * 0.03;
        const charFrame = Math.max(0, delayedFrame - charDelay * fps);
        
        const y = spring({
          frame: charFrame,
          fps,
          config: { damping: 20, stiffness: 150 },
        });
        
        const translateY = interpolate(y, [0, 1], [40, 0]);
        const opacity = interpolate(y, [0, 1], [0, 1]);
        
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              transform: `translateY(${translateY}px)`,
              opacity,
              whiteSpace: char === ' ' ? 'pre' : 'normal',
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
};

// Glitch text effect with dramatic entrance
const GlitchText: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const delayedFrame = Math.max(0, frame - delay * fps);
  
  // Dramatic scale entrance
  const scale = spring({
    frame: delayedFrame,
    fps,
    config: { damping: 12, stiffness: 80, mass: 1.2 },
  });
  
  const opacity = interpolate(delayedFrame, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
  });
  
  // Glitch phases
  const glitchPhase1 = delayedFrame < 25;
  const glitchPhase2 = delayedFrame >= 25 && delayedFrame < 40;
  
  // Dynamic glitch offset
  const glitchX = glitchPhase1 
    ? Math.sin(delayedFrame * 3) * 4 
    : glitchPhase2 
      ? Math.sin(delayedFrame * 5) * 1.5 
      : 0;
  
  // Pulsing glow after entrance
  const glowPulse = interpolate(
    Math.sin((frame / fps) * 2),
    [-1, 1],
    [40, 70]
  );
  
  // Color shift during glitch
  const hueShift = glitchPhase1 ? Math.sin(delayedFrame * 2) * 20 : 0;
  
  return (
    <div
      style={{
        fontSize: 52,
        fontWeight: 900,
        color: 'white',
        letterSpacing: 6,
        opacity,
        transform: `scale(${scale}) translateX(${glitchX}px)`,
        textShadow: glitchPhase1 
          ? `${glitchX * 2}px 0 #8b5cf6, ${-glitchX * 2}px 0 #06b6d4, 0 0 20px rgba(139, 92, 246, 0.8)`
          : glitchPhase2
            ? `${glitchX}px 0 #a855f7, ${-glitchX}px 0 #3b82f6, 0 0 30px rgba(139, 92, 246, 0.6)`
            : `0 0 ${glowPulse}px rgba(139, 92, 246, 0.6), 0 0 ${glowPulse * 1.5}px rgba(99, 102, 241, 0.3)`,
        background: 'linear-gradient(180deg, #ffffff 0%, #c4b5fd 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: glitchPhase1 ? `hue-rotate(${hueShift}deg)` : 'none',
      }}
    >
      {text}
    </div>
  );
};


// Typing text effect
const TypingText: React.FC<{ 
  texts: string[]; 
  delay: number;
  cycleDuration: number;
}> = ({ texts, delay, cycleDuration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const delayedFrame = Math.max(0, frame - delay * fps);
  const cycleFrames = cycleDuration * fps;
  const currentCycle = Math.floor(delayedFrame / cycleFrames);
  const frameInCycle = delayedFrame % cycleFrames;
  
  const currentText = texts[currentCycle % texts.length];
  const typeSpeed = 2; // frames per character
  const charsToShow = Math.min(
    Math.floor(frameInCycle / typeSpeed),
    currentText.length
  );
  
  // Cursor blink
  const cursorVisible = Math.floor(frame / 15) % 2 === 0;
  
  const fadeOut = interpolate(
    frameInCycle,
    [cycleFrames - 20, cycleFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  
  return (
    <div
      style={{
        fontSize: 20,
        fontFamily: 'monospace',
        color: '#8b5cf6',
        opacity: fadeOut,
      }}
    >
      <span style={{ color: 'rgba(148, 163, 184, 0.6)' }}>{'> '}</span>
      {currentText.slice(0, charsToShow)}
      <span
        style={{
          opacity: cursorVisible ? 1 : 0,
          color: '#8b5cf6',
        }}
      >
        |
      </span>
    </div>
  );
};


// Scanning line effect
const ScanLine: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  
  const y = interpolate(
    (frame / fps) % 4,
    [0, 4],
    [-100, height + 100]
  );
  
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: y,
        height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), transparent)',
        boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
      }}
    />
  );
};

// Main background composition
const BackgroundComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#030014' }}>
      <GradientBackground />
      <GridLines />
      <Particles />
      
      {/* Floating orbs - subtle background */}
      <FloatingOrb x={10} y={20} size={400} delay={0} color="rgba(99, 102, 241, 0.15)" speed={0.3} />
      <FloatingOrb x={40} y={80} size={300} delay={0.5} color="rgba(139, 92, 246, 0.1)" speed={0.4} />
      
      {/* Orbital rings around logo */}
      <AnimatedRing size={300} delay={0.3} rotationSpeed={0.8} />
      <AnimatedRing size={380} delay={0.5} rotationSpeed={-0.5} />
      <AnimatedRing size={460} delay={0.7} rotationSpeed={0.3} />
      
      {/* Logo - centered in left half */}
      <LogoReveal />
      
      {/* Main title - below logo */}
      <Sequence from={40} layout="none">
        <div
          style={{
            position: 'absolute',
            left: '25%',
            top: '56%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}
        >
          <GlitchText text="ADW FINANCE" delay={0} />
        </div>
      </Sequence>
      
      {/* Tagline - below title */}
      <Sequence from={70} layout="none">
        <div
          style={{
            position: 'absolute',
            left: '25%',
            top: '66%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}
        >
          <TextReveal
            text="NEXT-GEN TAX INTELLIGENCE"
            delay={0}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'rgba(139, 92, 246, 0.9)',
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          />
        </div>
      </Sequence>
      
      {/* Typing terminal effect - below tagline */}
      <Sequence from={100} layout="none">
        <div
          style={{
            position: 'absolute',
            left: '25%',
            top: '73%',
            transform: 'translateX(-50%)',
          }}
        >
          <TypingText
            texts={[
              'Auto-analyzing deductions...',
              'Maximizing tax savings...',
              'AI-powered strategy...',
              'Real-time expense tracking...',
            ]}
            delay={0}
            cycleDuration={2.5}
          />
        </div>
      </Sequence>
      
      {/* Feature cards - bottom of left side, horizontal row */}
      <Sequence from={130} layout="none">
        <div
          style={{
            position: 'absolute',
            left: '25%',
            bottom: '8%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 12,
          }}
        >
          <FeatureChip icon="🏦" label="Bank Sync" delay={0} />
          <FeatureChip icon="🤖" label="AI Tax" delay={0.15} />
          <FeatureChip icon="📊" label="Auto Deductions" delay={0.3} />
          <FeatureChip icon="🧾" label="Receipts" delay={0.45} />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

// Compact feature chip for bottom row
const FeatureChip: React.FC<{
  icon: string;
  label: string;
  delay: number;
}> = ({ icon, label, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const delayedFrame = Math.max(0, frame - delay * fps);
  
  const scale = spring({
    frame: delayedFrame,
    fps,
    config: { damping: 20, stiffness: 150 },
  });
  
  const opacity = interpolate(delayedFrame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });
  
  return (
    <div
      style={{
        transform: `scale(${scale})`,
        opacity,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        background: 'rgba(139, 92, 246, 0.1)',
        borderRadius: 20,
        border: '1px solid rgba(139, 92, 246, 0.3)',
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{label}</span>
    </div>
  );
};

// ============================================
// LOGIN PAGE COMPONENT
// ============================================

type AuthMode = 'login' | 'signup' | 'phone' | 'otp';

export function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInWithPhone, verifyOtp, devLogin, loading: authLoading, error } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Don't use global auth loading for button disabled state - it blocks the button
  const loading = isGoogleLoading;
  
  const handleGoogleLogin = async () => {
    console.log('[LoginPage] Google login clicked');
    setIsGoogleLoading(true);
    setLocalError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error('[LoginPage] Google login error:', e);
      setLocalError('Failed to start Google login');
      setIsGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    if (!email || !password) {
      setLocalError('Please enter email and password');
      return;
    }
    
    if (mode === 'signup') {
      await signUpWithEmail(email, password, fullName);
    } else {
      await signInWithEmail(email, password);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    if (!phone) {
      setLocalError('Please enter your phone number');
      return;
    }
    
    await signInWithPhone(phone);
    setMode('otp');
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    if (!otp || otp.length !== 6) {
      setLocalError('Please enter the 6-digit code');
      return;
    }
    
    await verifyOtp(phone, otp);
  };

  const displayError = localError || error?.message;

  return (
    <div className="min-h-screen bg-[#030014] flex relative overflow-hidden">
      {/* Remotion Player Background */}
      <div className="absolute inset-0 z-0">
        <Player
          component={BackgroundComposition}
          durationInFrames={600}
          fps={30}
          compositionWidth={1920}
          compositionHeight={1080}
          style={{
            width: '100%',
            height: '100%',
          }}
          loop
          autoPlay
          controls={false}
        />
      </div>
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#030014]/50 to-[#030014]/80 z-[1]" />
      
      {/* Content */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row">
        {/* Left side - Branding (visible on mobile, hidden on desktop since Remotion shows it) */}
        <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center lg:hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl shadow-lg shadow-purple-500/30 overflow-hidden">
              <img 
                src="/assets/branding/ADW LOGO.png" 
                alt="ADW Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">ADW Finance</h1>
              <p className="text-xs text-purple-400 font-medium">Tax Intelligence Platform</p>
            </div>
          </div>
        </div>

        {/* Spacer for desktop */}
        <div className="hidden lg:block lg:w-1/2" />

        {/* Right side - Auth Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <div className="bg-[#0a0a0f]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-purple-500/10">
              <div className="text-center mb-8">
                <motion.h2 
                  key={mode}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-black text-white mb-2"
                >
                  {mode === 'login' && 'Welcome back'}
                  {mode === 'signup' && 'Create account'}
                  {mode === 'phone' && 'Phone login'}
                  {mode === 'otp' && 'Enter code'}
                </motion.h2>
                <p className="text-slate-500 text-sm">
                  {mode === 'login' && 'Sign in to continue to your dashboard'}
                  {mode === 'signup' && 'Start tracking your finances today'}
                  {mode === 'phone' && "We'll send you a verification code"}
                  {mode === 'otp' && `Code sent to ${phone}`}
                </p>
              </div>

              {/* Error display */}
              <AnimatePresence>
                {displayError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm"
                  >
                    {displayError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Google Sign In */}
              {(mode === 'login' || mode === 'signup') && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-bold py-4 px-6 rounded-xl transition-all mb-6 shadow-lg disabled:opacity-50"
                  >
                    {isGoogleLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </motion.button>

                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-4 bg-[#0a0a0f] text-slate-500">or continue with email</span>
                    </div>
                  </div>
                </>
              )}

              {/* Email/Password Form */}
              {(mode === 'login' || mode === 'signup') && (
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Full Name</label>
                      <div className="relative group">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-purple-500 focus:bg-white/10 outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Email</label>
                    <div className="relative group">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-purple-500 focus:bg-white/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Password</label>
                    <div className="relative group">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-purple-500 focus:bg-white/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </motion.button>
                </form>
              )}

              {/* Phone Form */}
              {mode === 'phone' && (
                <form onSubmit={handlePhoneAuth} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Phone Number</label>
                    <div className="relative group">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-purple-500 focus:bg-white/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        Send Code
                        <ArrowRight size={18} />
                      </>
                    )}
                  </motion.button>
                </form>
              )}

              {/* OTP Form */}
              {mode === 'otp' && (
                <form onSubmit={handleOtpVerify} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Verification Code</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-center text-2xl tracking-[0.5em] text-white placeholder:text-slate-600 focus:border-purple-500 focus:bg-white/10 outline-none transition-all font-mono"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        Verify
                        <ArrowRight size={18} />
                      </>
                    )}
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => setMode('phone')}
                    className="w-full text-slate-500 hover:text-white text-sm transition-colors"
                  >
                    Didn't receive code? Try again
                  </button>
                </form>
              )}

              {/* Mode switchers */}
              <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                {(mode === 'login' || mode === 'signup') && (
                  <>
                    <button
                      onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                      className="w-full text-center text-slate-500 hover:text-white text-sm transition-colors"
                    >
                      {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                      <span className="text-purple-400 font-bold">
                        {mode === 'login' ? 'Sign up' : 'Sign in'}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => setMode('phone')}
                      className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-white text-sm transition-colors"
                    >
                      <Phone size={14} />
                      Sign in with phone
                    </button>
                  </>
                )}
                
                {(mode === 'phone' || mode === 'otp') && (
                  <button
                    onClick={() => setMode('login')}
                    className="w-full text-center text-slate-500 hover:text-white text-sm transition-colors"
                  >
                    ← Back to email login
                  </button>
                )}
              </div>
            </div>
            
            {/* Dev Mode - Development Only */}
            {import.meta.env.DEV && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-yellow-500/20"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-4 bg-[#0a0a0f] text-yellow-600/60">dev mode</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={devLogin}
                  disabled={loading}
                  className="w-full mt-3 flex items-center justify-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 font-medium py-3 px-4 rounded-xl transition-all"
                >
                  <Sparkles size={16} />
                  Skip Login (Dev Only)
                </motion.button>
              </motion.div>
            )}

            {/* Footer */}
            <p className="text-center text-xs text-slate-600 mt-6">
              © 2026 Agency Dev Works. All rights reserved.
            </p>
            <p className="text-center text-xs text-slate-500 mt-2">
              powered by{' '}
              <a 
                href="https://agencydevworks.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                agencydevworks.ai
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
