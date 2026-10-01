"use client";

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Globe2,
  HelpCircle,
  KeyRound,
  LineChart,
  Loader2,
  Lock,
  Mail,
  Receipt,
  User,
  X,
  Zap,
} from 'lucide-react';
import { signIn as nextAuthSignIn } from 'next-auth/react';
import Link from 'next/link';

type AuthUser = {
  id: string;
  tenantId: string;
  name?: string;
  shopName?: string;
  mobile?: string;
  email?: string;
  role: string;
};

type Mode = 'login' | 'register' | 'forgot';

type AuthScreenProps = {
  onAuthenticated?: (user: AuthUser) => void;
  isOpen?: boolean;
  onClose?: () => void;
  initialMode?: Mode;
  isModal?: boolean;
};

const FEATURES = [
  {
    icon: Receipt,
    title: "Simplify your billing",
    desc: "End-to-end invoicing, automated GST billing, and QR payments",
  },
  {
    icon: Zap,
    title: "Streamline your payment process",
    desc: "Faster payments with automated WhatsApp reminders and UPI collection",
  },
  {
    icon: LineChart,
    title: "Grow your business",
    desc: "Real-time analytics, automated inventory forecasting, and customer ledgers",
  },
];

const TRUSTED_COMPANIES = [
  "IIFL",
  "Hindustan Times",
  "Interakt powered by Jio Haptik",
  "The Hindu Tamil",
  "OTT Play",
];

export function AuthScreen({
  initialMode = 'register',
  isModal = false,
  isOpen = true,
  onAuthenticated,
  onClose,
}: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [country, setCountry] = useState('India');
  const [isChangingCountry, setIsChangingCountry] = useState(false);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode, isOpen]);

  const [form, setForm] = useState({
    name: '',
    shopName: '',
    email: '',
    mobile: '',
    password: '',
    securityQuestion: '',
    securityAnswer: '',
  });

  const [mobileCheck, setMobileCheck] = useState<{
    status: 'idle' | 'checking' | 'exists' | 'not_found';
    shopName?: string;
    name?: string;
  }>({ status: 'idle' });

  const securityQuestions = [
    "What was the name of the bank where you opened your first business account?",
    "What was the street name of your first storefront or office?",
    "What was the last name of your first business mentor?",
    "What was the first trade city where you expanded operations?",
  ];

  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setStatus({ type: 'idle', message: '' });
  };

  const updateForm = (key: keyof typeof form, value: string) => {
    if (key === 'mobile') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setForm((current) => ({ ...current, mobile: digitsOnly }));
      return;
    }
    setForm((current) => ({ ...current, [key]: value }));
  };

  // Real-time mobile account check
  useEffect(() => {
    const digits = form.mobile.replace(/\D/g, '');
    if (digits.length === 10) {
      let isCurrent = true;
      setMobileCheck((prev) => ({ ...prev, status: 'checking' }));

      fetch('/api/auth/check-mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: digits }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (!isCurrent) return;
          if (data.success && data.exists) {
            setMobileCheck({
              status: 'exists',
              shopName: data.shopName,
              name: data.name,
            });
          } else if (data.success && !data.exists) {
            setMobileCheck({
              status: 'not_found',
            });
          } else {
            setMobileCheck({ status: 'idle' });
          }
        })
        .catch(() => {
          if (isCurrent) setMobileCheck({ status: 'idle' });
        });

      return () => {
        isCurrent = false;
      };
    } else {
      setMobileCheck({ status: 'idle' });
    }
  }, [form.mobile]);

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
    if (result?.user) {
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('drishti_session_active', 'true');
          sessionStorage.setItem('drishti_session_user', JSON.stringify(result.user));
          localStorage.setItem('drishti_cached_user', JSON.stringify(result.user));
          localStorage.setItem('easytrader_user', JSON.stringify(result.user));
          localStorage.setItem('drishti_has_seen_overview', 'true');
          const accId = result.user.id || result.user.email || result.user.tenantId;
          if (accId) {
            localStorage.setItem('drishti_active_account_id', accId);
          }
          if (result.user.themePreference) {
            localStorage.setItem('drishti_global_theme', result.user.themePreference);
            if (result.user.id) localStorage.setItem(`drishti_theme_${result.user.id}`, result.user.themePreference);
            if (result.user.email) localStorage.setItem(`drishti_theme_${result.user.email}`, result.user.themePreference);
          }
        } catch {}
      }
      onAuthenticated?.(result.user);
      if (typeof window !== 'undefined') window.location.href = '/';
    }
  };

  const register = async () => {
    if (!agreedToTerms) {
      setStatus({ type: 'error', message: 'Please agree to the Terms of Service & Privacy Policy to proceed.' });
      return;
    }

    if (!form.shopName.trim()) {
      setStatus({ type: 'error', message: 'Company Name is required.' });
      return;
    }

    const cleanedMobile = form.mobile.replace(/\D/g, '');
    if (cleanedMobile.length !== 10) {
      setStatus({ type: 'error', message: 'Please enter a valid 10-digit mobile number.' });
      return;
    }

    if (!form.password || form.password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    const result = await submit('/api/auth/register', {
      name: form.name.trim() || form.shopName.trim(),
      shopName: form.shopName.trim(),
      mobile: cleanedMobile,
      password: form.password,
      securityQuestion: form.securityQuestion || "What was the name of the bank where you opened your first business account?",
      securityAnswer: form.securityAnswer.trim() || "Default",
      email: form.email.trim() || undefined,
    });

    if (result?.user) {
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('drishti_session_active', 'true');
          sessionStorage.setItem('drishti_session_user', JSON.stringify(result.user));
          localStorage.setItem('drishti_cached_user', JSON.stringify(result.user));
          localStorage.setItem('easytrader_user', JSON.stringify(result.user));
          localStorage.setItem('drishti_has_seen_overview', 'true');
          const accId = result.user.id || result.user.email || result.user.tenantId;
          if (accId) {
            localStorage.setItem('drishti_active_account_id', accId);
          }
          if (result.user.themePreference) {
            localStorage.setItem('drishti_global_theme', result.user.themePreference);
            if (result.user.id) localStorage.setItem(`drishti_theme_${result.user.id}`, result.user.themePreference);
            if (result.user.email) localStorage.setItem(`drishti_theme_${result.user.email}`, result.user.themePreference);
          }
        } catch {}
      }
      onAuthenticated?.(result.user);
      if (typeof window !== 'undefined') window.location.href = '/';
    }
  };

  const [securityQuestion, setSecurityQuestion] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const getSecurityQuestion = async () => {
    if (!form.email.trim()) {
      setStatus({ type: 'error', message: 'Enter your registered email address.' });
      return;
    }
    const result = await submit('/api/auth/forgot-password', { email: form.email.trim() });
    if (result?.securityQuestion) {
      setSecurityQuestion(result.securityQuestion);
      setStatus({ type: 'idle', message: '' });
    }
  };

  const resetPassword = async () => {
    if (!form.securityAnswer.trim()) {
      setStatus({ type: 'error', message: 'Security answer is required.' });
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
      setStatus({ type: 'success', message: 'Password reset successful! You can now log in.' });
      setSecurityQuestion(null);
      setNewPassword('');
      setTimeout(() => switchMode('login'), 1500);
    }
  };

  const handleOAuthLogin = (provider: 'google' | 'microsoft' | 'apple' | 'linkedin') => {
    if (provider === 'google') {
      void nextAuthSignIn('google', { callbackUrl: '/' });
    } else if (provider === 'microsoft') {
      void nextAuthSignIn('azure-ad', { callbackUrl: '/' });
    } else if (provider === 'apple') {
      void nextAuthSignIn('apple', { callbackUrl: '/' });
    } else if (provider === 'linkedin') {
      void nextAuthSignIn('google', { callbackUrl: '/' });
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;

    if (mode === 'login' && mobileCheck.status === 'not_found' && !form.password) {
      switchMode('register');
      return;
    }

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

  // ============================== LEFT HERO PANEL (ZOHO STYLE) ==============================
  const leftPanel = (
    <div className="flex h-full min-h-screen flex-col justify-between p-8 sm:p-14 lg:p-20 bg-[#f2faf6] dark:bg-[#07140e] border-r border-[#d5efe2] dark:border-zinc-800">
      {/* Brand logo top left */}
      <Link href="/" className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00c975] text-white font-black text-lg shadow-sm">
          E
        </div>
        <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Easy<span className="font-light text-emerald-600 dark:text-emerald-400">Trader</span>
        </span>
        <span className="text-xs font-semibold text-zinc-400">| Billing</span>
      </Link>

      {/* Main Headline & Features */}
      <div className="my-auto py-10 max-w-lg space-y-10">
        <div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.15]">
            End-to-end billing solution for{' '}
            <span className="text-[#00c975]">growing businesses.</span>
          </h2>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-6 pt-2">
          {FEATURES.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div key={index} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-[#00c975] dark:bg-emerald-500/20">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    {feat.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel indicator bars */}
        <div className="flex items-center gap-2 pt-2">
          <span className="h-1.5 w-10 rounded-full bg-[#00c975]" />
          <span className="h-1.5 w-6 rounded-full bg-[#c2ebd5] dark:bg-zinc-700" />
        </div>
      </div>

      {/* Trusted By section */}
      <div className="border-t border-[#d5efe2] dark:border-zinc-800/80 pt-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          TRUSTED BY
        </p>
        <p className="mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {TRUSTED_COMPANIES.join(', ')}.
        </p>
      </div>
    </div>
  );

  // ============================== RIGHT FORM PANEL (ZOHO STYLE) ==============================
  const rightPanel = (
    <div className="flex min-h-screen w-full flex-col justify-center px-6 py-12 sm:px-14 lg:px-24 bg-white dark:bg-black">
      <div className="mx-auto w-full max-w-[460px]">
        {/* Brand logo top (mobile/laptop) */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00c975] text-white font-black text-sm">
            E
          </div>
          <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
            EasyTrader <span className="font-normal text-zinc-500">Billing</span>
          </span>
        </div>

        {/* Header Title */}
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {mode === 'register'
            ? "Let's get started"
            : mode === 'login'
            ? "Welcome back"
            : "Reset Password"}
        </h1>

        <form suppressHydrationWarning onSubmit={handleSubmit} className="mt-7 space-y-4">
          {mode === 'forgot' ? (
            <>
              {/* Email Address */}
              <div className="relative rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus-within:border-black dark:focus-within:border-white transition">
                <div className="flex items-center px-3.5 py-3">
                  <Mail className="h-4 w-4 text-zinc-400 mr-2.5" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    placeholder="Email address"
                    className="w-full bg-transparent text-sm font-normal text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
                  />
                </div>
              </div>

              {securityQuestion ? (
                <>
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="text-xs font-semibold text-zinc-500">Security Question:</p>
                    <p className="mt-0.5 text-xs font-bold text-zinc-900 dark:text-white">{securityQuestion}</p>
                  </div>
                  <div className="relative rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus-within:border-black dark:focus-within:border-white transition">
                    <div className="flex items-center px-3.5 py-3">
                      <KeyRound className="h-4 w-4 text-zinc-400 mr-2.5" />
                      <input
                        type="text"
                        value={form.securityAnswer}
                        onChange={(e) => updateForm('securityAnswer', e.target.value)}
                        placeholder="Security answer"
                        className="w-full bg-transparent text-sm font-normal text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
                      />
                    </div>
                  </div>
                  <div className="relative rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus-within:border-black dark:focus-within:border-white transition">
                    <div className="flex items-center px-3.5 py-3">
                      <Lock className="h-4 w-4 text-zinc-400 mr-2.5" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New Password (min 6 characters)"
                        className="w-full bg-transparent text-sm font-normal text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </>
          ) : null}

          {mode === 'register' ? (
            <>
              {/* Floating label for Company Name */}
              <div className="relative rounded-lg border border-zinc-800 dark:border-zinc-400 bg-white dark:bg-zinc-950 focus-within:border-[#00c975] transition">
                <span className="absolute -top-2.5 left-3 bg-white dark:bg-black px-1.5 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Company Name
                </span>
                <input
                  type="text"
                  value={form.shopName}
                  onChange={(e) => updateForm('shopName', e.target.value)}
                  placeholder="Enter your business name"
                  className="w-full bg-transparent px-3.5 py-3.5 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
                />
              </div>

              {/* Email Address */}
              <div className="relative rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus-within:border-black dark:focus-within:border-white transition">
                <div className="flex items-center px-3.5 py-3.5">
                  <Mail className="h-4 w-4 text-zinc-400 mr-2.5" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    placeholder="Email address"
                    className="w-full bg-transparent text-sm font-normal text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
                  />
                </div>
              </div>

              {/* Phone Number with +91 */}
              <div>
                <div className="relative flex items-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus-within:border-black dark:focus-within:border-white transition">
                  <div className="flex items-center gap-1.5 border-r border-zinc-200 dark:border-zinc-800 px-3.5 py-3.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    <span className="text-sm">🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.mobile}
                    onChange={(e) => updateForm('mobile', e.target.value)}
                    placeholder="Phone number"
                    className="w-full bg-transparent px-3.5 py-3.5 text-sm font-normal text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
                  />
                  <div className="pr-3.5">
                    {mobileCheck.status === 'checking' && (
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                    )}
                    {mobileCheck.status === 'exists' && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                        Registered
                      </span>
                    )}
                    {mobileCheck.status === 'not_found' && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        Available
                      </span>
                    )}
                  </div>
                </div>

                {mobileCheck.status === 'exists' && (
                  <div className="mt-2 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-900 dark:text-amber-200">
                    <span>Account exists for <strong>{mobileCheck.shopName || mobileCheck.name}</strong></span>
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="rounded bg-black dark:bg-white px-2 py-0.5 text-xs font-bold text-white dark:text-black"
                    >
                      Login
                    </button>
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="relative rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus-within:border-black dark:focus-within:border-white transition">
                <div className="flex items-center px-3.5 py-3.5">
                  <Lock className="h-4 w-4 text-zinc-400 mr-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => updateForm('password', e.target.value)}
                    placeholder="Password"
                    className="w-full bg-transparent text-sm font-normal text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Location / Country */}
              <div className="relative rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3.5 py-3 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <Globe2 className="h-4 w-4 text-zinc-400" />
                  <span>State / Country: <strong>{country}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChangingCountry(!isChangingCountry)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Change Country
                </button>
              </div>

              {isChangingCountry && (
                <select
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setIsChangingCountry(false);
                  }}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-white outline-none"
                >
                  <option value="India">India (GST Compliant)</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="Singapore">Singapore</option>
                </select>
              )}

              {/* Checkboxes */}
              <div className="space-y-2.5 pt-2 text-[12px] text-zinc-600 dark:text-zinc-400 leading-normal">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-[#00c975]"
                  />
                  <span>
                    I agree to the{' '}
                    <a href="#" className="text-[#00c975] hover:underline font-medium">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-[#00c975] hover:underline font-medium">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-[#00c975]"
                  />
                  <span>
                    I would like to receive marketing communication from EasyTrader and regional partners for future product updates, services and events.
                  </span>
                </label>
              </div>
            </>
          ) : mode === 'login' ? (
            <>
              {/* Phone number with auto-verification */}
              <div>
                <div className="relative flex items-center rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus-within:border-black dark:focus-within:border-white transition">
                  <div className="flex items-center gap-1.5 border-r border-zinc-200 dark:border-zinc-800 px-3.5 py-3.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    <span className="text-sm">🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.mobile}
                    onChange={(e) => updateForm('mobile', e.target.value)}
                    placeholder="10-digit phone number"
                    className="w-full bg-transparent px-3.5 py-3.5 text-sm font-normal text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
                  />
                  <div className="pr-3.5">
                    {mobileCheck.status === 'checking' && (
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                    )}
                    {mobileCheck.status === 'exists' && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Registered
                      </span>
                    )}
                    {mobileCheck.status === 'not_found' && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                        Not Registered
                      </span>
                    )}
                  </div>
                </div>

                {mobileCheck.status === 'exists' && (
                  <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-900 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      Account verified: <strong>{mobileCheck.shopName || mobileCheck.name}</strong>
                    </span>
                  </div>
                )}

                {mobileCheck.status === 'not_found' && (
                  <div className="mt-2.5 rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-amber-500/5 p-3.5 text-xs space-y-2 text-amber-950 dark:text-amber-200">
                    <p className="font-bold text-amber-900 dark:text-amber-300">No account found with this number</p>
                    <p className="text-[11.5px] text-zinc-600 dark:text-zinc-300">
                      This phone number is not registered. Create a new account to get started.
                    </p>
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black py-2 px-3 font-bold text-xs transition"
                    >
                      Go to Register <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Password */}
              {mobileCheck.status !== 'not_found' && (
                <div className="relative rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus-within:border-black dark:focus-within:border-white transition">
                  <div className="flex items-center px-3.5 py-3.5">
                    <Lock className="h-4 w-4 text-zinc-400 mr-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => updateForm('password', e.target.value)}
                      placeholder="Password"
                      className="w-full bg-transparent text-sm font-normal text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">
                  {mobileCheck.status === 'exists' ? 'Ready to sign in' : 'Enter 10-digit number'}
                </span>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </>
          ) : null}

          {status.message && (
            <div
              className={`rounded-lg border px-3.5 py-2.5 text-xs font-semibold ${
                status.type === 'error'
                  ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
              }`}
            >
              {status.message}
            </div>
          )}

          {/* Primary CTA Button (Zoho green #00c975) */}
          {mode === 'login' && mobileCheck.status === 'not_found' ? (
            <button
              type="button"
              onClick={() => switchMode('register')}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 transition active:scale-[0.99]"
            >
              Create your account
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-lg bg-[#00c975] hover:bg-[#00b568] text-white font-bold text-sm shadow-sm transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Please wait...
                </span>
              ) : mode === 'register' ? (
                'Create your account'
              ) : mode === 'login' ? (
                mobileCheck.status === 'exists' && mobileCheck.shopName
                  ? `Sign in to ${mobileCheck.shopName}`
                  : 'Sign in to your account'
              ) : securityQuestion ? (
                'Reset Password'
              ) : (
                'Find Security Question'
              )}
            </button>
          )}
        </form>

        {/* Social Logins */}
        <div className="mt-8">
          <p className="text-xs text-zinc-500 text-left">or sign in using</p>

          <div className="mt-3 grid grid-cols-5 gap-2.5">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              title="Google"
              className="flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </button>

            {/* Microsoft */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('microsoft')}
              title="Microsoft"
              className="flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 23 23" style={{ width: '20px', height: '20px' }}>
                <rect fill="#F35325" x="1" y="1" width="10" height="10" />
                <rect fill="#81BC06" x="12" y="1" width="10" height="10" />
                <rect fill="#05A6F0" x="1" y="12" width="10" height="10" />
                <rect fill="#FFBA08" x="12" y="12" width="10" height="10" />
              </svg>
            </button>

            {/* LinkedIn */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('linkedin')}
              title="LinkedIn"
              className="flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#0A66C2" style={{ width: '20px', height: '20px' }}>
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.88 0 1.6-.72 1.6-1.6 0-.88-.72-1.6-1.6-1.6-.88 0-1.6.72-1.6 1.6 0 .88.72 1.6 1.6 1.6m1.4 9.74v-8.37H5.06v8.37h2.8z" />
              </svg>
            </button>

            {/* Apple */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('apple')}
              title="Apple"
              className="flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition"
            >
              <svg className="w-5 h-5 shrink-0 fill-current text-zinc-900 dark:text-white" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.85-.92.04-2.03.62-2.69 1.39-.58.67-1.09 1.74-1.02 2.78 1.03.08 2.08-.57 2.7-1.32z" />
              </svg>
            </button>

            {/* X */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              title="X"
              className="flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition"
            >
              <svg className="w-4.5 h-4.5 shrink-0 fill-current text-zinc-900 dark:text-white" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-8 text-center text-xs text-zinc-500">
          {mode === 'register' ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Sign in
              </button>
            </p>
          ) : (
            <p>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Sign up
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // Full Page Screen Layout
  return (
    <main
      suppressHydrationWarning
      className="min-h-screen w-full font-sans antialiased grid lg:grid-cols-2"
    >
      <div className="hidden lg:block">
        {leftPanel}
      </div>
      <div>
        {rightPanel}
      </div>
    </main>
  );
}
