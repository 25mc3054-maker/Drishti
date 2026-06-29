"use client"

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Phone, ShieldCheck, Store, UserPlus } from 'lucide-react';

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

  const updateForm = (key: keyof typeof form, value: string) => {
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
    const result = await submit('/api/auth/login', { mobile: form.mobile, password: form.password });
    if (result?.user) onAuthenticated(result.user);
  };

  const register = async () => {
    const result = await submit('/api/auth/register', form);
    if (result?.user) onAuthenticated(result.user);
  };

  const [securityQuestion, setSecurityQuestion] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const getSecurityQuestion = async () => {
    const result = await submit('/api/auth/forgot-password', { email: form.email });
    if (result?.securityQuestion) {
      setSecurityQuestion(result.securityQuestion);
    }
  };

  const resetPassword = async () => {
    const result = await submit('/api/auth/reset-password', {
      email: form.email,
      securityAnswer: form.securityAnswer,
      newPassword,
    });
    if (result?.success) {
      setMode('login');
      setStatus({ type: 'success', message: 'Password reset successfully. Please login.' });
    }
  };


  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 py-8 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,156,42,0.18),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(59,168,255,0.20),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_38%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1180px] gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: 'easeOut' }}
            className="max-w-xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-[12px] font-semibold text-white/68">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Multi-tenant shopkeeper workspace
            </div>
            <h1 className="mt-6 text-[48px] font-semibold leading-[1] tracking-normal text-white md:text-[72px]">
              Sign in to your isolated shop.
            </h1>
            <p className="mt-5 text-[17px] leading-8 text-white/64">
              Every shopkeeper gets a private tenant workspace. Products, customers, invoices, staff, and settings stay invisible to every other shop.
            </p>
          </motion.div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.08, ease: 'easeOut' }}
          className="rounded-[8px] border border-white/12 bg-[#05070A]/88 p-4 shadow-[0_28px_120px_rgba(0,0,0,0.46)] backdrop-blur-2xl md:p-6"
        >
          <div className="grid grid-cols-2 gap-2 rounded-[8px] border border-white/10 bg-black/35 p-1">
            <ModeButton active={mode === 'login'} label="Password" onClick={() => setMode('login')} />
            <ModeButton active={mode === 'register'} label="Register" onClick={() => setMode('register')} />
          </div>

          <div className="mt-5 space-y-3">
          {mode === 'forgot' ? (
              <>
                <AuthInput icon={Mail} placeholder="Email address" type="email" value={form.email} onChange={(value) => updateForm('email', value)} />
                {securityQuestion ? (
                  <>
                    <p>{securityQuestion}</p>
                    <AuthInput
                      icon={Lock}
                      placeholder="Security answer"
                      value={form.securityAnswer}
                      onChange={(value) => updateForm('securityAnswer', value)}
                    />
                    <AuthInput
                      icon={Lock}
                      placeholder="New Password"
                      type="password"
                      value={newPassword}
                      onChange={setNewPassword}
                    />
                  </>
                ) : null}
              </>
            ) : null}

            {mode === 'register' ? (
              <>
                <AuthInput icon={UserPlus} placeholder="Shopkeeper name" value={form.name} onChange={(value) => updateForm('name', value)} />
                <AuthInput icon={Store} placeholder="Shop name" value={form.shopName} onChange={(value) => updateForm('shopName', value)} />
                <AuthInput icon={Mail} placeholder="Email address" type="email" value={form.email} onChange={(value) => updateForm('email', value)} />
                 <div className="flex flex-col gap-3">
                  <select
                    value={form.securityQuestion}
                    onChange={(e) => updateForm('securityQuestion', e.target.value)}
                    className="w-full h-12 rounded-full border border-white/12 bg-black/45 px-4 text-white/50 transition focus-within:border-[#78B7FF]"
                  >
                    <option value="" disabled>Select a security question</option>
                    {securityQuestions.map((q, i) => (
                      <option key={i} value={q}>{q}</option>
                    ))}
                  </select>
                  <AuthInput
                    icon={Lock}
                    placeholder="Security answer"
                    value={form.securityAnswer}
                    onChange={(value) => updateForm('securityAnswer', value)}
                  />
                  {form.securityAnswer.length > 0 && form.securityAnswer.length < 5 && (
                    <p className="text-red-500 text-xs mt-1">Security question must be at least 5 characters.</p>
                  )}
                </div>
              </>
            ) : mode === 'login' ? (
              <>
                <AuthInput icon={Phone} placeholder="Mobile number" value={form.mobile} onChange={(value) => updateForm('mobile', value)} />
                <AuthInput icon={Lock} placeholder="Password" type="password" value={form.password} onChange={(value) => updateForm('password', value)} />
                {mode === 'login' && (
                    <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-white/50 text-sm text-right mt-2 hover:text-white"
                    >
                    Forgot Password?
                    </button>
                )}
              </>
            ) : null}
          </div>

          {status.message ? (
            <div className={`mt-4 rounded-[8px] border px-3 py-2 text-[13px] ${status.type === 'error' ? 'border-red-400/35 bg-red-500/10 text-red-100' : 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100'}`}>
              {status.message}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              if (mode === 'register') void register();
              else if (mode === 'login') void loginWithPassword();
              else if (mode === 'forgot') {
                if (securityQuestion) {
                  void resetPassword();
                } else {
                  void getSecurityQuestion();
                }
              }
            }}
            disabled={isLoading}
            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-5 text-[14px] font-semibold text-black shadow-[0_0_34px_rgba(255,255,255,0.18)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isLoading ? 'Please wait...' : mode === 'register' ? 'Create Shop Workspace' : mode === 'login' ? 'Login with Password' : securityQuestion ? 'Reset Password' : 'Get Security Question'}
          </button>
        </motion.section>
      </div>
    </main>
  );
}

function ModeButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-[8px] text-[12px] font-semibold transition ${active ? 'bg-white text-black' : 'text-white/58 hover:bg-white/8 hover:text-white'}`}
    >
      {label}
    </button>
  );
}

function AuthInput({ icon: Icon, onChange, placeholder, type = 'text', value }: { icon: any; onChange: (value: string) => void; placeholder: string; type?: string; value: string }) {
  return (
    <label className="flex h-12 items-center gap-3 rounded-full border border-white/12 bg-black/45 px-4 text-white/50 transition focus-within:border-[#78B7FF]">
      <Icon className="h-4 w-4" />
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-white/34"
      />
    </label>
  );
}
