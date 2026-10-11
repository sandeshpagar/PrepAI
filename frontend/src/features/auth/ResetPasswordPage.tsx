import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { GraduationCap, ArrowLeft, Send, Sparkles } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset instructions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 bg-background">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-secondary-container/15 blur-[128px]" />
      </div>

      <GlassCard level={1} className="w-full max-w-md p-6 sm:p-8 relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-white/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="font-headline font-bold text-base text-on-surface">PrepAI Security</span>
        </div>

        <h1 className="font-headline text-xl font-bold text-on-surface mb-2">
          Reset your password
        </h1>
        <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
          Enter your registered university email address and we'll send a secure password reset link.
        </p>

        {submitted ? (
          <div className="flex flex-col gap-4">
            <div className="p-3 rounded-lg bg-primary-container/20 border border-primary/30 text-primary text-xs">
              Password reset link sent to <strong>{email}</strong>. Please check your inbox.
            </div>
            <Link to="/login">
              <GlassButton variant="glass" className="w-full text-xs">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Return to sign in
              </GlassButton>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-lg bg-error-container/30 border border-error/30 text-error text-xs">
                {error}
              </div>
            )}

            <GlassInput
              id="resetEmail"
              label="University Email"
              type="email"
              placeholder="elena.vance@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<GraduationCap className="w-4 h-4" />}
              required
            />

            <GlassButton
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full mt-2"
            >
              <span>Send Instructions</span>
              <Send className="w-3.5 h-3.5 ml-1" />
            </GlassButton>

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors mt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to sign in</span>
            </Link>
          </form>
        )}
      </GlassCard>
    </div>
  );
};
