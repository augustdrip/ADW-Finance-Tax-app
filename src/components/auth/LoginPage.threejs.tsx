/**
 * Login/Signup Page
 * Premium 3D animated login with Three.js
 * Professional financial visualization aesthetic
 */

import React, { useState, useRef, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Mail, 
  Lock, 
  Phone, 
  User, 
  ArrowRight, 
  Loader2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Flowing wave mesh - like financial data visualization
function WaveMesh() {
  const mesh = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(30, 30, 80, 80);
    return geo;
  }, []);
  
  useFrame((state) => {
    if (!mesh.current) return;
    const positions = mesh.current.geometry.attributes.position;
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      
      // Create smooth flowing waves
      const wave1 = Math.sin(x * 0.3 + time * 0.5) * 0.5;
      const wave2 = Math.sin(y * 0.2 + time * 0.3) * 0.3;
      const wave3 = Math.sin((x + y) * 0.2 + time * 0.4) * 0.2;
      
      positions.setZ(i, wave1 + wave2 + wave3);
    }
    positions.needsUpdate = true;
    
    mesh.current.rotation.x = -Math.PI / 2.5;
    mesh.current.rotation.z = time * 0.02;
  });
  
  return (
    <mesh ref={mesh} geometry={geometry} position={[0, -3, -8]}>
      <meshStandardMaterial
        color="#1e1b4b"
        wireframe
        transparent
        opacity={0.15}
      />
    </mesh>
  );
}

// Subtle floating particles - more controlled
function SubtleParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 800;
  
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Position particles in a more organized pattern
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 5 + Math.random() * 10;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) - 2;
      pos[i * 3 + 2] = r * Math.cos(phi) - 5;
      
      // Slow upward drift
      vel[i * 3] = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 1] = Math.random() * 0.005 + 0.002;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    }
    return [pos, vel];
  }, []);
  
  useFrame(() => {
    if (!ref.current) return;
    const posAttr = ref.current.geometry.attributes.position;
    
    for (let i = 0; i < count; i++) {
      let x = posAttr.getX(i) + velocities[i * 3];
      let y = posAttr.getY(i) + velocities[i * 3 + 1];
      let z = posAttr.getZ(i) + velocities[i * 3 + 2];
      
      // Reset particles that drift too far
      if (y > 10) {
        y = -8;
        x = (Math.random() - 0.5) * 20;
        z = (Math.random() - 0.5) * 10 - 5;
      }
      
      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  });
  
  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#6366f1"
        size={0.03}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.6}
      />
    </Points>
  );
}

// Orbital rings - clean geometric element
function OrbitalRings() {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring1.current) {
      ring1.current.rotation.x = Math.PI / 3;
      ring1.current.rotation.y = t * 0.1;
    }
    if (ring2.current) {
      ring2.current.rotation.x = Math.PI / 2.5;
      ring2.current.rotation.z = t * 0.08;
    }
    if (ring3.current) {
      ring3.current.rotation.x = Math.PI / 4;
      ring3.current.rotation.y = -t * 0.06;
    }
  });
  
  return (
    <group position={[-4, 0, -6]}>
      <mesh ref={ring1}>
        <torusGeometry args={[3, 0.008, 16, 100]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.4} />
      </mesh>
      <mesh ref={ring2}>
        <torusGeometry args={[3.5, 0.005, 16, 100]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.25} />
      </mesh>
      <mesh ref={ring3}>
        <torusGeometry args={[4, 0.003, 16, 100]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

// Central glowing orb
function CentralOrb() {
  const mesh = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (mesh.current) {
      mesh.current.rotation.y = t * 0.2;
      mesh.current.rotation.x = Math.sin(t * 0.3) * 0.1;
    }
    if (glow.current) {
      const scale = 1 + Math.sin(t * 2) * 0.05;
      glow.current.scale.setScalar(scale);
    }
  });
  
  return (
    <group position={[-4, 0, -6]}>
      {/* Core */}
      <mesh ref={mesh}>
        <icosahedronGeometry args={[0.8, 2]} />
        <meshStandardMaterial
          color="#4f46e5"
          emissive="#4f46e5"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      {/* Glow effect */}
      <mesh ref={glow}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial
          color="#6366f1"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// Floating data points - like network nodes
function DataNodes() {
  const group = useRef<THREE.Group>(null);
  
  const nodes = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 20; i++) {
      arr.push({
        position: [
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 8,
          -3 - Math.random() * 8
        ] as [number, number, number],
        scale: 0.02 + Math.random() * 0.03,
        speed: 0.5 + Math.random() * 0.5
      });
    }
    return arr;
  }, []);
  
  useFrame((state) => {
    if (group.current) {
      group.current.children.forEach((child, i) => {
        const node = nodes[i];
        child.position.y = node.position[1] + Math.sin(state.clock.elapsedTime * node.speed + i) * 0.3;
      });
    }
  });
  
  return (
    <group ref={group}>
      {nodes.map((node, i) => (
        <mesh key={i} position={node.position}>
          <sphereGeometry args={[node.scale, 8, 8]} />
          <meshBasicMaterial color="#6366f1" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// Connecting lines between nodes
function ConnectionLines() {
  const lines = useRef<THREE.LineSegments>(null);
  
  const geometry = useMemo(() => {
    const points = [];
    // Create some elegant curved paths
    for (let i = 0; i < 15; i++) {
      const startX = (Math.random() - 0.5) * 20;
      const startY = (Math.random() - 0.5) * 10;
      const startZ = -5 - Math.random() * 10;
      
      const endX = startX + (Math.random() - 0.5) * 8;
      const endY = startY + (Math.random() - 0.5) * 4;
      const endZ = startZ + (Math.random() - 0.5) * 4;
      
      points.push(new THREE.Vector3(startX, startY, startZ));
      points.push(new THREE.Vector3(endX, endY, endZ));
    }
    
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, []);
  
  useFrame((state) => {
    if (lines.current && lines.current.material instanceof THREE.LineBasicMaterial) {
      lines.current.material.opacity = 0.1 + Math.sin(state.clock.elapsedTime) * 0.05;
    }
  });
  
  return (
    <lineSegments ref={lines} geometry={geometry}>
      <lineBasicMaterial color="#6366f1" transparent opacity={0.15} />
    </lineSegments>
  );
}

// 3D Scene - Professional financial visualization
function Scene() {
  return (
    <>
      {/* Subtle ambient lighting */}
      <ambientLight intensity={0.15} />
      
      {/* Key light - main illumination */}
      <directionalLight position={[5, 5, 5]} intensity={0.3} color="#e0e7ff" />
      
      {/* Accent lights */}
      <pointLight position={[-8, 3, -5]} intensity={0.5} color="#6366f1" distance={20} />
      <pointLight position={[8, -3, -8]} intensity={0.3} color="#8b5cf6" distance={15} />
      
      {/* Background elements */}
      <WaveMesh />
      <SubtleParticles />
      
      {/* Focal point */}
      <OrbitalRings />
      <CentralOrb />
      
      {/* Ambient details */}
      <DataNodes />
      <ConnectionLines />
      
      {/* Fog for depth */}
      <fog attach="fog" args={['#030014', 8, 30]} />
    </>
  );
}

type AuthMode = 'login' | 'signup' | 'phone' | 'otp';

export function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInWithPhone, verifyOtp, loading, error } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

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
      {/* 3D Background Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 60 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#030014] via-transparent to-transparent z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#030014]/80 via-transparent to-[#030014]/80 z-[1]" />
      
      {/* Content */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row">
        {/* Left side - Branding */}
        <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.div 
                className="w-14 h-14 rounded-2xl shadow-lg shadow-purple-500/30 overflow-hidden"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <img 
                  src="/assets/branding/ADW LOGO.png" 
                  alt="ADW Logo" 
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <div>
                <h1 className="text-2xl font-black text-white">ADW Finance</h1>
                <p className="text-xs text-indigo-400 font-medium">Tax Intelligence Platform</p>
              </div>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-400">
                Smart expense tracking.
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                AI-powered tax strategy.
              </span>
            </h2>
            
            <div className="hidden lg:flex flex-wrap gap-3 mt-8">
              {['Bank Sync', 'AI Analysis', 'Tax Optimization', 'Real-time'].map((tag, i) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-xs font-medium text-slate-300"
                >
                  <Sparkles size={12} className="inline mr-2 text-indigo-400" />
                  {tag}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right side - Auth Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <div className="bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-indigo-500/5">
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
                    onClick={signInWithGoogle}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-bold py-4 px-6 rounded-xl transition-all mb-6 shadow-lg"
                  >
                    {loading ? (
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
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:bg-white/10 outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Email</label>
                    <div className="relative group">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:bg-white/10 outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Password</label>
                    <div className="relative group">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:bg-white/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
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
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:bg-white/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
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
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-center text-2xl tracking-[0.5em] text-white placeholder:text-slate-600 focus:border-indigo-500 focus:bg-white/10 outline-none transition-all font-mono"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
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
                      <span className="text-indigo-400 font-bold">
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
            
            {/* Footer */}
            <p className="text-center text-xs text-slate-600 mt-6">
              © 2024 Agency Dev Works. All rights reserved.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
