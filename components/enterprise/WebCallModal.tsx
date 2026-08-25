"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageCircle,
  X,
  User,
  Delete,
  ExternalLink,
  Instagram,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { formatMoney } from './utils';

export type CallRecipient = {
  name: string;
  phone: string;
  role?: 'Customer' | 'Supplier' | 'Walk-in' | 'Contact';
};

interface WebCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: CallRecipient | null;
  theme?: 'dark' | 'light';
}

export function WebCallModal({
  isOpen,
  onClose,
  recipient: initialRecipient,
  theme = 'dark',
}: WebCallModalProps) {
  const isLight = theme === 'light';
  
  // Custom dialer number state
  const [dialNumber, setDialNumber] = useState('');
  const [activeRecipient, setActiveRecipient] = useState<CallRecipient | null>(initialRecipient);
  
  // Call status state
  const [callState, setCallState] = useState<'idle' | 'dialing' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [activeTab, setActiveTab] = useState<'call' | 'keypad'>('call');
  const [callHistory, setCallHistory] = useState<Array<{ name: string; phone: string; time: string; duration: string }>>([]);

  // Sync recipient when props change
  useEffect(() => {
    if (initialRecipient) {
      setActiveRecipient(initialRecipient);
      setDialNumber(initialRecipient.phone ? initialRecipient.phone.replace(/\D/g, '') : '');
      setActiveTab('call');
    }
  }, [initialRecipient]);

  // Call timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callState === 'connected') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callState]);

  if (!isOpen) return null;

  const cleanPhone = (phoneStr: string) => {
    return phoneStr.replace(/\D/g, '').slice(-10);
  };

  const currentPhone = activeRecipient?.phone
    ? cleanPhone(activeRecipient.phone)
    : cleanPhone(dialNumber);

  const currentName = activeRecipient?.name || (dialNumber ? `+91 ${dialNumber}` : 'Unknown Contact');

  const startWebCall = () => {
    if (!currentPhone && !dialNumber) return;
    setCallState('dialing');
    
    // Simulate connection after 2 seconds
    setTimeout(() => {
      setCallState('connected');
    }, 1800);
  };

  const endWebCall = () => {
    setCallState('ended');
    const formattedDuration = `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}`;
    setCallHistory((prev) => [
      {
        name: currentName,
        phone: currentPhone || dialNumber,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: formattedDuration,
      },
      ...prev.slice(0, 9),
    ]);

    setTimeout(() => {
      setCallState('idle');
    }, 1200);
  };

  const triggerNativePhoneCall = () => {
    if (!currentPhone) return;
    window.location.href = `tel:+91${currentPhone}`;
  };

  const triggerWhatsAppCall = () => {
    if (!currentPhone) return;
    // Attempt direct WhatsApp voice call via whatsapp:// protocol
    window.location.href = `whatsapp://call?phone=91${currentPhone}`;
    
    // Fallback to wa.me chat after short timeout if app protocol fails
    setTimeout(() => {
      window.open(`https://wa.me/91${currentPhone}?text=${encodeURIComponent(`Hello ${currentName}, calling you regarding Drishti EasyTrader.`)}`, '_blank', 'noopener,noreferrer');
    }, 1200);
  };

  const triggerInstagramMsg = () => {
    window.open('https://instagram.com', '_blank', 'noopener,noreferrer');
  };

  const handleKeypadPress = (digit: string) => {
    if (dialNumber.length < 13) {
      setDialNumber((prev) => prev + digit);
    }
  };

  const handleKeypadDelete = () => {
    setDialNumber((prev) => prev.slice(0, -1));
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl transition-all ${
            isLight ? 'border-zinc-300 bg-white text-black' : 'border-zinc-800 bg-zinc-950 text-white'
          }`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b px-5 py-3.5 border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <PhoneCall className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold leading-tight">Web Communication Hub</h3>
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Direct Phone, WhatsApp & Web Voice Call
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 transition text-zinc-400 hover:bg-zinc-100 hover:text-black dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Segment Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('call')}
              className={`flex-1 py-1.5 text-center text-xs font-bold transition rounded-md ${
                activeTab === 'call'
                  ? isLight
                    ? 'bg-white text-black shadow-xs'
                    : 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Active Dialer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('keypad')}
              className={`flex-1 py-1.5 text-center text-xs font-bold transition rounded-md ${
                activeTab === 'keypad'
                  ? isLight
                    ? 'bg-white text-black shadow-xs'
                    : 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Keypad & Manual
            </button>
          </div>

          {/* TAB 1: ACTIVE DIALER & LIVE CALL VIEW */}
          {activeTab === 'call' && (
            <div className="p-6 text-center space-y-6">
              {/* Avatar & Calling Info */}
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="relative">
                  <div className={`flex h-20 w-20 items-center justify-center rounded-full border-2 text-2xl font-black shadow-inner ${
                    callState === 'connected'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                      : callState === 'dialing'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-500 animate-pulse'
                      : isLight
                      ? 'border-zinc-300 bg-zinc-100 text-zinc-700'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-300'
                  }`}>
                    {currentName ? currentName[0].toUpperCase() : <User className="h-8 w-8" />}
                  </div>

                  {callState === 'connected' && (
                    <span className="absolute bottom-0 right-0 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-lg font-black tracking-tight">{currentName}</div>
                  <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {activeRecipient?.role ? `${activeRecipient.role} • ` : ''}
                    {currentPhone ? `+91 ${currentPhone}` : 'No phone number selected'}
                  </div>

                  {/* Status Tag */}
                  <div className="mt-2 flex justify-center">
                    {callState === 'idle' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-extrabold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                        Ready to Connect
                      </span>
                    )}
                    {callState === 'dialing' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-[11.5px] font-extrabold text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                        Dialing via Web Voice...
                      </span>
                    )}
                    {callState === 'connected' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-1 text-[12px] font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTimer(callDuration)}
                      </span>
                    )}
                    {callState === 'ended' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-[11.5px] font-extrabold text-red-600 dark:text-red-400 border border-red-500/30">
                        Call Ended
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Audio Equalizer Animation when Connected */}
              {callState === 'connected' && (
                <div className="flex items-center justify-center gap-1 h-6 py-1">
                  {[40, 75, 30, 90, 60, 100, 45, 80, 50, 95, 35].map((height, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: ['20%', `${height}%`, '20%'] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.08 }}
                      className="w-1 rounded-full bg-emerald-500"
                    />
                  ))}
                </div>
              )}

              {/* Action Buttons: Web Call vs Direct Tel vs WhatsApp */}
              {callState === 'idle' && (
                <div className="grid gap-2.5">
                  <button
                    type="button"
                    onClick={startWebCall}
                    disabled={!currentPhone}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs sm:text-sm hover:bg-emerald-500 transition shadow-lg disabled:opacity-50"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>Start Web Voice Call</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={triggerNativePhoneCall}
                      disabled={!currentPhone}
                      className={`flex h-10 items-center justify-center gap-2 rounded-xl border text-xs font-bold transition shadow-xs ${
                        isLight
                          ? 'border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100'
                          : 'border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800'
                      }`}
                    >
                      <Phone className="h-3.5 w-3.5 text-blue-500" />
                      <span>Phone Dialer</span>
                    </button>
                    <button
                      type="button"
                      onClick={triggerWhatsAppCall}
                      disabled={!currentPhone}
                      className="flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition shadow-xs"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                      <span>WhatsApp Call/Chat</span>
                    </button>
                  </div>
                </div>
              )}

              {/* In-Call Audio Controls when Connected or Dialing */}
              {(callState === 'dialing' || callState === 'connected') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                        isMuted
                          ? 'bg-amber-500 text-white'
                          : isLight
                          ? 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300'
                          : 'bg-zinc-800 text-white hover:bg-zinc-700'
                      }`}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>

                    <button
                      type="button"
                      onClick={endWebCall}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-xl hover:bg-red-500 transition scale-105"
                      title="End Call"
                    >
                      <PhoneOff className="h-6 w-6" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSpeaker(!isSpeaker)}
                      className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                        isSpeaker
                          ? 'bg-blue-600 text-white'
                          : isLight
                          ? 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300'
                          : 'bg-zinc-800 text-white hover:bg-zinc-700'
                      }`}
                      title={isSpeaker ? 'Speaker On' : 'Speaker Off'}
                    >
                      {isSpeaker ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KEYPAD & MANUAL NUMBER ENTRY */}
          {activeTab === 'keypad' && (
            <div className="p-5 space-y-4">
              {/* Display Box */}
              <div className={`flex h-12 items-center justify-between rounded-xl border px-4 ${
                isLight ? 'border-zinc-300 bg-zinc-50 text-black' : 'border-zinc-800 bg-zinc-900 text-white'
              }`}>
                <span className="text-xl font-mono font-bold tracking-wider">
                  {dialNumber || <span className="opacity-40 text-sm font-sans">Type number...</span>}
                </span>
                {dialNumber && (
                  <button
                    type="button"
                    onClick={handleKeypadDelete}
                    className="text-zinc-400 hover:text-red-500 p-1"
                  >
                    <Delete className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Grid 3x4 Keypad */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className={`flex h-12 items-center justify-center rounded-xl text-lg font-black transition border shadow-2xs ${
                      isLight
                        ? 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100 hover:border-black active:scale-95'
                        : 'border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800 hover:border-zinc-600 active:scale-95'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* Call Launch Buttons for Typed Number */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (dialNumber) {
                      setActiveRecipient({ name: `+91 ${dialNumber}`, phone: dialNumber, role: 'Contact' });
                      setActiveTab('call');
                      startWebCall();
                    }
                  }}
                  disabled={!dialNumber}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-500 transition shadow-md disabled:opacity-40"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>Call Number</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (dialNumber) {
                      const waUrl = `https://wa.me/91${cleanPhone(dialNumber)}`;
                      window.open(waUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  disabled={!dialNumber}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs hover:bg-emerald-500/20 transition shadow-md disabled:opacity-40"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Call History Log at Bottom */}
          {callHistory.length > 0 && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
                Recent Call Session Log
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                {callHistory.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{log.name}</span>
                    <span>{log.duration} • {log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/**
 * Reusable Quick Contact Group component rendered beside phone numbers
 */
export function ContactActionGroup({
  phone,
  name,
  role = 'Contact',
  onOpenCallModal,
  isLight = false,
}: {
  phone: string;
  name: string;
  role?: 'Customer' | 'Supplier' | 'Walk-in' | 'Contact';
  onOpenCallModal?: (recipient: CallRecipient) => void;
  isLight?: boolean;
}) {
  if (!phone) return null;
  const cleanNum = phone.replace(/\D/g, '').slice(-10);

  return (
    <div className="inline-flex items-center gap-1 shrink-0">
      {/* Web Call Launcher */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenCallModal?.({ name, phone: cleanNum, role });
        }}
        className={`flex h-7 items-center gap-1 rounded-sm border px-2 text-[11px] font-extrabold transition shadow-2xs ${
          isLight
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-600'
            : 'border-emerald-900/60 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/80 hover:border-emerald-500'
        }`}
        title={`Call ${name} via Web Dialer`}
      >
        <PhoneCall className="h-3 w-3" />
        <span>Call</span>
      </button>

      {/* Direct WhatsApp Call Launcher */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          // Directly trigger WhatsApp call scheme
          window.location.href = `whatsapp://call?phone=91${cleanNum}`;
          // Fallback to wa.me chat window if WhatsApp app is not installed
          setTimeout(() => {
            window.open(`https://wa.me/91${cleanNum}`, '_blank', 'noopener,noreferrer');
          }, 1200);
        }}
        className={`flex h-7 items-center justify-center gap-1 rounded-sm border px-2 text-[11px] font-extrabold transition shadow-2xs ${
          isLight
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-500'
            : 'border-emerald-900 bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900 hover:border-emerald-500'
        }`}
        title={`Direct WhatsApp Call to ${name}`}
      >
        <MessageCircle className="h-3 w-3" />
        <span className="hidden sm:inline">WhatsApp Call</span>
      </button>

      {/* Native Direct Tel Dialing */}
      <a
        href={`tel:+91${cleanNum}`}
        onClick={(e) => e.stopPropagation()}
        className={`flex h-7 w-7 items-center justify-center rounded-sm border transition shadow-2xs ${
          isLight
            ? 'border-zinc-200 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-black'
            : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
        }`}
        title={`Dial +91 ${cleanNum} on Phone`}
      >
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
