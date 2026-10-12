import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import {
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('elena.vance@university.edu');
  const [password, setPassword] = useState('CurieQuantum#2026');
  const [fullName, setFullName] = useState('Elena Vance');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (data?.session) {
          navigate('/');
        } else {
          setSuccessMessage('Account created! Please check your email to confirm registration or sign in.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-8 overflow-hidden bg-background">
      {/* Ambient background glows matching Stitch canvas */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-secondary-container/20 blur-[128px]" />
        <div className="absolute -bottom-40 -right-20 w-[30rem] h-[30rem] rounded-full bg-primary-container/15 blur-[140px]" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 rounded-full bg-tertiary-container/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Auth Form (7 cols) */}
        <GlassCard level={1} className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Header / Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-white/10 flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-headline text-lg font-bold text-on-surface leading-tight">PrepAI</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-primary">Academic AI</span>
              </div>
            </div>

            <div className="mb-6">
              <h1 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface tracking-tight mb-2">
                Welcome back to your learning space.
              </h1>
              <p className="text-sm text-on-surface-variant max-w-xl">
                Your personalized study schedules, course syllabi, and context-grounded lecture notes in one intelligent workspace.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="inline-flex p-1 rounded-lg bg-surface-container-highest/60 mb-6 border border-white/5">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`text-xs font-medium px-4 py-1.5 rounded-md transition-all ${
                  mode === 'signin'
                    ? 'bg-surface-bright text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`text-xs font-medium px-4 py-1.5 rounded-md transition-all ${
                  mode === 'register'
                    ? 'bg-surface-bright text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Create Student Account
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-error-container/30 border border-error/30 text-error text-xs">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-lg bg-primary-container/20 border border-primary/30 text-primary text-xs">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === 'register' && (
                <GlassInput
                  id="fullName"
                  label="Full Name"
                  placeholder="Elena Vance"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              )}

              <GlassInput
                id="universityEmail"
                label="University Email"
                type="email"
                placeholder="elena.vance@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<GraduationCap className="w-4 h-4" />}
                required
              />

              <GlassInput
                id="password"
                label="Master Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your security phrase"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-on-surface-variant hover:text-on-surface transition-colors p-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded bg-surface-container-highest text-primary-container focus:ring-0 cursor-pointer accent-primary-container"
                  />
                  <span className="text-xs text-on-surface-variant">Remember this device for 30 days</span>
                </label>
                <Link
                  to="/reset-password"
                  className="text-xs text-secondary hover:text-primary transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <GlassButton
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2"
              >
                <span>{mode === 'signin' ? 'Sign in to Study Space' : 'Create Student Account'}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </GlassButton>
            </form>

            <div className="relative flex items-center justify-center my-6">
              <div className="w-full h-px bg-white/10" />
              <span className="absolute px-3 bg-surface-container-low text-on-surface-variant font-mono text-[10px] uppercase tracking-wider">
                or authenticate with institution
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-surface-container-high/60 hover:bg-surface-bright text-on-surface text-xs font-medium transition-colors border border-white/5 cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-secondary" />
                <span>Canvas LMS Gateway</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-surface-container-high/60 hover:bg-surface-bright text-on-surface text-xs font-medium transition-colors border border-white/5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-tertiary" />
                <span>Institutional Google SSO</span>
              </button>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-white/5 flex items-center gap-2 text-xs text-on-surface-variant">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span>
              New to PrepAI?{' '}
              <button
                onClick={() => setMode('register')}
                className="text-primary hover:underline font-semibold"
              >
                Create a student account
              </button>{' '}
              with 10GB free RAG indexing.
            </span>
          </div>
        </GlassCard>

        {/* Right Column: Synthetic Knowledge Anchor (5 cols) */}
        <GlassCard level={2} className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                Cognitive Engine
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-mono font-medium">Active RAG Node</span>
              </div>
            </div>

            <h2 className="font-headline text-xl font-bold text-on-surface mb-1 tracking-tight">
              Synthetic Knowledge Anchor
            </h2>
            <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
              Real-time synthesis across your syllabi, textbooks, and lab repositories. Zero hallucinations.
            </p>

            <div className="flex flex-col gap-4">
              {/* Context Grounded Citation Card */}
              <div className="p-4 rounded-lg bg-surface-container-high/70 border border-white/10 shadow-md">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-mono text-tertiary flex items-center gap-1.5 truncate">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span>CS301_Distributed_Systems.pdf · Page 42</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">
                    98% Match
                  </span>
                </div>
                <p className="text-xs text-on-surface leading-relaxed italic">
                  “Raft consensus enforces strict leader election through randomized election timeouts, reducing split-vote frequency.”
                </p>
                <div className="flex items-center gap-1.5 mt-2.5 text-on-surface-variant text-[10px] font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <span>Context Grounded Citation</span>
                </div>
              </div>

              {/* Next Scheduled Block Card */}
              <div className="p-4 rounded-lg bg-surface-container-high/70 border border-white/10 shadow-md">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono text-secondary flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Next Scheduled Block</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary-container/40 text-secondary-fixed">
                    High Priority
                  </span>
                </div>
                <div className="text-sm font-semibold text-on-surface">
                  14:00 - Database Normalization (BCNF)
                </div>
                <div className="text-xs text-on-surface-variant mt-1">
                  Advanced Database Systems · 45m focus session
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-on-surface-variant">
            <span>Local Ollama Inference (qwen2.5)</span>
            <span className="font-mono text-primary font-medium">100% Private</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
