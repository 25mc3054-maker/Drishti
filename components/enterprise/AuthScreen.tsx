"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, Store, UserPlus } from 'lucide-react';
import { signIn as nextAuthSignIn } from 'next-auth/react';

type AuthUser = {
  id: string;
  tenantId: string;
  name?: string;
  shopName?: string;
  mobile?: string;
  email?: string;
  role: string;
};

type AuthScreenProps = {
  onAuthenticated: (user: AuthUser) => void;
};

type Mode = 'login' | 'register' | 'forgot';

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    shopName: '',
    email: '',
    mobile: '',
    password: '',
    securityQuestion: '',
    securityAnswer: '',
  });

  const securityQuestions = [
    "What was the name of the bank where you opened your very first business checking account?",
    "What was the street name of your business's first physical office or storefront?",
    "What was the last name of your first boss or supervisor?",
    "What was the first trade show or professional conference you ever attended?",
  ];
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setStatus({ type: 'idle', message: '' });
  };

  const updateForm = (key: keyof typeof form, value: string) => {
    if (key === 'mobile') {
      // Restrict to digits only and max 10 digits
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setForm((current) => ({ ...current, mobile: digitsOnly }));
      return;
    }
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (endpoint: string, payload: Record<string, any>) => {
    setIsLoading(true);
    setStatus({ type: 'idle', message: '' });
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Authentication failed.');
      return result;
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Authentication failed.' });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPassword = async () => {
    const cleanedMobile = form.mobile.replace(/\D/g, '');
    if (cleanedMobile.length !== 10) {
      setStatus({ type: 'error', message: 'Please enter a valid 10-digit mobile number.' });
      return;
    }

    if (!form.password || form.password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    const result = await submit('/api/auth/login', { mobile: cleanedMobile, password: form.password });
    if (result?.user) onAuthenticated(result.user);
  };

  const register = async () => {
    if (!form.name.trim()) {
      setStatus({ type: 'error', message: 'Please enter your full name.' });
      return;
    }

    if (!form.shopName.trim()) {
      setStatus({ type: 'error', message: 'Please enter your shop name.' });
      return;
    }

    const cleanedMobile = form.mobile.replace(/\D/g, '');
    if (cleanedMobile.length !== 10) {
      setStatus({ type: 'error', message: 'Please enter a valid 10-digit mobile number.' });
      return;
    }

    if (!form.email.trim() || !form.email.includes('@')) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    if (!form.password || form.password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    if (!form.securityQuestion) {
      setStatus({ type: 'error', message: 'Please select a security question.' });
      return;
    }

    if (!form.securityAnswer.trim() || form.securityAnswer.trim().length < 3) {
      setStatus({ type: 'error', message: 'Security answer must be at least 3 characters.' });
      return;
    }

    const result = await submit('/api/auth/register', {
      ...form,
      mobile: cleanedMobile,
      name: form.name.trim(),
      shopName: form.shopName.trim(),
      email: form.email.trim(),
      securityAnswer: form.securityAnswer.trim(),
    });
    if (result?.user) onAuthenticated(result.user);
  };

  const [securityQuestion, setSecurityQuestion] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const getSecurityQuestion = async () => {
    if (!form.email.trim() || !form.email.includes('@')) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    const result = await submit('/api/auth/forgot-password', { email: form.email.trim() });
    if (result?.securityQuestion) {
      setSecurityQuestion(result.securityQuestion);
    }
  };

  const resetPassword = async () => {
    if (!form.securityAnswer.trim()) {
      setStatus({ type: 'error', message: 'Please provide your security answer.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setStatus({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }
    const result = await submit('/api/auth/reset-password', {
      email: form.email.trim(),
      securityAnswer: form.securityAnswer.trim(),
      newPassword,
    });
    if (result?.success) {
      switchMode('login');
      setStatus({ type: 'success', message: 'Password reset successfully! Please login with your new password.' });
    }
  };

  // Real OAuth 2.0 Provider Sign In Triggers
  const handleRealOAuthSignIn = (provider: 'google' | 'apple' | 'microsoft') => {
    setIsLoading(true);
    setStatus({ type: 'idle', message: '' });

    if (provider === 'google') {
      void nextAuthSignIn('google', { callbackUrl: '/' });
    } else if (provider === 'apple') {
      void nextAuthSignIn('apple', { callbackUrl: '/' });
    } else if (provider === 'microsoft') {
      void nextAuthSignIn('azure-ad', { callbackUrl: '/' });
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;
    if (mode === 'register') void register();
    else if (mode === 'login') void loginWithPassword();
    else if (mode === 'forgot') {
      if (securityQuestion) {
        void resetPassword();
      } else {
        void getSecurityQuestion();
      }
    }
  };

  return (
    <main suppressHydrationWarning className="relative min-h-screen overflow-hidden bg-black px-4 py-8 text-white font-sans">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,156,42,0.18),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(59,168,255,0.20),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_38%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1180px] gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="space-y-4"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-md">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> EasyTrader Multi-Tenant SaaS Workspace
            </span>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl leading-tight text-white">
              Isolated Shop Workspaces with AI Intelligence.
            </h1>
            <p className="text-sm text-zinc-400 sm:text-base leading-relaxed">
              Manage inventory, bills, customer ledgers, and AI marketing in your dedicated workspace.
            </p>
          </motion.div>
        </section>

        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="rounded-3xl border border-zinc-800 bg-black/80 p-6 backdrop-blur-2xl sm:p-8 shadow-2xl shadow-black"
        >
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  {mode === 'register' ? 'Create Account' : mode === 'login' ? 'Shopkeeper Login' : 'Password Recovery'}
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  {mode === 'register' ? 'Setup your shop account to continue' : mode === 'login' ? 'Login with registered 10-digit mobile & password' : 'Reset your account password'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-900 p-1 border border-zinc-800">
                <ModeButton active={mode === 'login'} label="Login" onClick={() => switchMode('login')} />
                <ModeButton active={mode === 'register'} label="Register" onClick={() => switchMode('register')} />
              </div>
            </div>

            <form suppressHydrationWarning onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'forgot' ? (
                <>
                  <AuthInput icon={Mail} placeholder="Registered Email address" type="email" value={form.email} onChange={(value) => updateForm('email', value)} />
                  {securityQuestion ? (
                    <>
                      <p className="text-[13px] text-zinc-300 font-medium">{securityQuestion}</p>
                      <AuthInput
                        icon={Lock}
                        placeholder="Security answer"
                        value={form.securityAnswer}
                        onChange={(value) => updateForm('securityAnswer', value)}
                      />
                      <AuthInput
                        icon={Lock}
                        placeholder="New Password (min 6 characters)"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={setNewPassword}
                        rightElement={
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="text-zinc-500 hover:text-zinc-300 transition"
                            tabIndex={-1}
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        }
                      />
                    </>
                  ) : null}
                </>
              ) : null}

              {mode === 'register' ? (
                <>
                  <AuthInput icon={UserPlus} placeholder="Full name" value={form.name} onChange={(value) => updateForm('name', value)} />
                  <AuthInput icon={Store} placeholder="Shop name" value={form.shopName} onChange={(value) => updateForm('shopName', value)} />
                  <AuthInput
                    icon={Phone}
                    placeholder="10-digit Mobile number"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.mobile}
                    onChange={(value) => updateForm('mobile', value)}
                    rightElement={
                      <span className={`text-[11px] font-semibold ${form.mobile.length === 10 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {form.mobile.length}/10
                      </span>
                    }
                  />
                  <AuthInput icon={Mail} placeholder="Email address" type="email" value={form.email} onChange={(value) => updateForm('email', value)} />
                  <AuthInput
                    icon={Lock}
                    placeholder="Password (min 6 characters)"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(value) => updateForm('password', value)}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-zinc-500 hover:text-zinc-300 transition"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                  <div className="flex flex-col gap-3">
                    <select
                      suppressHydrationWarning
                      value={form.securityQuestion}
                      onChange={(e) => updateForm('securityQuestion', e.target.value)}
                      className="w-full h-11 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-base md:text-sm text-white/70 transition focus-within:border-zinc-500 outline-none"
                    >
                      <option value="" disabled>Select a security question</option>
                      {securityQuestions.map((q, i) => (
                        <option key={i} value={q}>{q}</option>
                      ))}
                    </select>
                    <AuthInput
                      icon={Lock}
                      placeholder="Security answer (min 3 characters)"
                      value={form.securityAnswer}
                      onChange={(value) => updateForm('securityAnswer', value)}
                    />
                  </div>
                </>
              ) : mode === 'login' ? (
                <>
                  <AuthInput
                    icon={Phone}
                    placeholder="10-digit Mobile number"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.mobile}
                    onChange={(value) => updateForm('mobile', value)}
                    rightElement={
                      <span className={`text-[11px] font-semibold ${form.mobile.length === 10 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {form.mobile.length}/10
                      </span>
                    }
                  />
                  <AuthInput
                    icon={Lock}
                    placeholder="Password (min 6 characters)"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(value) => updateForm('password', value)}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-zinc-500 hover:text-zinc-300 transition"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                  {mode === 'login' && (
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-zinc-500">Only registered accounts can log in</span>
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        suppressHydrationWarning
                        className="text-zinc-400 hover:text-white transition touch-manipulation font-semibold"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </>
              ) : null}

              {status.message ? (
                <div className={`mt-4 rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${status.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>
                  {status.message}
                </div>
              ) : null}

              <button
                suppressHydrationWarning
                type="submit"
                disabled={isLoading}
                className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-white px-5 text-sm font-extrabold text-black shadow-lg transition hover:scale-[1.01] active:scale-[0.99] touch-manipulation disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isLoading ? 'Please wait...' : mode === 'register' ? 'Create Shop Workspace' : mode === 'login' ? 'Login with Password' : securityQuestion ? 'Reset Password' : 'Get Security Question'}
              </button>

              {/* Divider */}
              <div className="relative my-5 flex items-center justify-center">
                <div className="w-full border-t border-zinc-800" />
                <span className="absolute bg-black px-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Or Continue With
                </span>
              </div>

              {/* Real Official Provider OAuth Buttons */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => handleRealOAuthSignIn('google')}
                  disabled={isLoading}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-[12.5px] font-bold text-white transition hover:bg-zinc-900 hover:border-zinc-700 hover:scale-[1.02] active:scale-[0.98] touch-manipulation disabled:opacity-50"
                  title="Sign in with Google (accounts.google.com)"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"/>
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => handleRealOAuthSignIn('apple')}
                  disabled={isLoading}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-[12.5px] font-bold text-white transition hover:bg-zinc-900 hover:border-zinc-700 hover:scale-[1.02] active:scale-[0.98] touch-manipulation disabled:opacity-50"
                  title="Sign in with Apple (appleid.apple.com)"
                >
                  <svg className="h-4 w-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.67-.82 1.13-1.96.99-3.1-.97.04-2.18.66-2.87 1.46-.62.72-1.16 1.88-1.01 3 .01 0 .04.01.07.01 1.08 0 2.15-.55 2.82-1.37z"/>
                  </svg>
                  <span>Apple</span>
                </button>

                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => handleRealOAuthSignIn('microsoft')}
                  disabled={isLoading}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-[12.5px] font-bold text-white transition hover:bg-zinc-900 hover:border-zinc-700 hover:scale-[1.02] active:scale-[0.98] touch-manipulation disabled:opacity-50"
                  title="Sign in with Microsoft (login.microsoftonline.com)"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M12 1h10v10H1z"/>
                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                    <path fill="#ffba08" d="M12 12h10v10H1z"/>
                  </svg>
                  <span>Microsoft</span>
                </button>
              </div>
            </form>
          </div>
        </motion.section>
      </div>
    </main>
  );
}

function ModeButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      suppressHydrationWarning
      type="button"
      onClick={onClick}
      className={`h-9 rounded-lg px-4 text-[12.5px] font-bold transition touch-manipulation ${
        active ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function AuthInput({
  icon: Icon,
  onChange,
  placeholder,
  type = 'text',
  value,
  maxLength,
  inputMode,
  rightElement,
}: {
  icon: any;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  value: string;
  maxLength?: number;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'url' | 'search' | 'none' | 'decimal';
  rightElement?: React.ReactNode;
}) {
  return (
    <label suppressHydrationWarning className="flex h-11 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-zinc-400 transition focus-within:border-zinc-500 focus-within:text-white">
      <Icon className="h-4 w-4 shrink-0 text-current" />
      <input
        suppressHydrationWarning
        type={type}
        value={value}
        maxLength={maxLength}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-base md:text-sm text-white outline-none placeholder:text-zinc-500 font-sans font-medium"
      />
      {rightElement && <div className="shrink-0 flex items-center">{rightElement}</div>}
    </label>
  );
}


