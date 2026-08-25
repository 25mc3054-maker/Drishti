"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ReceiptText, Sparkles } from 'lucide-react';

export function CharacterInteractionScene() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 12;
      const y = (e.clientY / innerHeight - 0.5) * 12;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto mt-4 pt-2 pb-6 px-2 select-none">
      {/* Outer Card Container */}
      <div className="relative w-full rounded-3xl border border-slate-200 bg-white p-4 md:p-6 shadow-xl overflow-hidden">
        
        {/* Stage Header */}
        <div className="relative z-10 flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11.5px] font-black uppercase tracking-wider text-slate-700">EasyTrader Retail Interaction Desk</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-800 border border-slate-200">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Instant Billing & Invoicing Loop</span>
          </div>
        </div>

        {/* Floating Transaction Loop Badges Above Desk */}
        <div className="relative z-20 flex items-center justify-center gap-4 my-2">
          <motion.div
            animate={{
              x: [-40, 40, -40],
              y: [-2, -10, -2],
            }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-1.5 border-2 border-black font-black text-black text-[12px] shadow-[3px_3px_0px_#000000]"
          >
            <ReceiptText className="h-4 w-4 stroke-[2.5]" />
            <span>PDF Invoice & SMS Sent 📄</span>
          </motion.div>

          <motion.div
            animate={{
              x: [40, -40, 40],
              y: [8, -2, 8],
            }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
            className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-1.5 border-2 border-black font-black text-black text-[12px] shadow-[3px_3px_0px_#000000]"
          >
            <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
            <span>₹ Paid via Instant UPI ⚡</span>
          </motion.div>
        </div>

        {/* Main Vector Scene Stage */}
        <motion.div
          animate={{
            x: mousePos.x * 0.35,
            y: mousePos.y * 0.35,
          }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative z-10 w-full h-[320px] md:h-[360px] flex items-center justify-center"
        >
          <svg viewBox="0 0 700 420" fill="none" className="w-full h-full">
            
            {/* 1. BASELINE GROUND */}
            <line x1="40" y1="360" x2="660" y2="360" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />

            {/* 2. CENTER BACKGROUND WINDOW WITH GLASS HATCHING */}
            <g id="window-frame">
              <rect x="300" y="80" width="105" height="135" fill="#000000" stroke="#000000" strokeWidth="3" />
              {/* 4 Panes */}
              <line x1="352.5" y1="80" x2="352.5" y2="215" stroke="#FFFFFF" strokeWidth="3.5" />
              <line x1="300" y1="147.5" x2="405" y2="147.5" stroke="#FFFFFF" strokeWidth="3.5" />
              {/* Diagonal Glass Reflection Lines */}
              <line x1="310" y1="95" x2="335" y2="120" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="362" y1="95" x2="387" y2="120" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="310" y1="162" x2="335" y2="187" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="362" y1="162" x2="387" y2="187" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* FLOATING AIR PARTICLES */}
            <circle cx="210" cy="110" r="1.5" fill="#000000" />
            <circle cx="275" cy="90" r="2" fill="#000000" />
            <circle cx="430" cy="115" r="1.5" fill="#000000" />
            <circle cx="490" cy="140" r="2" fill="#000000" />
            <circle cx="220" cy="220" r="1.5" fill="#000000" />
            <circle cx="460" cy="240" r="1.5" fill="#000000" />

            {/* 3. CENTER STORE DESK / CHECKOUT COUNTER */}
            <g id="checkout-desk">
              {/* Main Box Body */}
              <rect x="330" y="200" width="135" height="158" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
              {/* Top Overhang Lid */}
              <path d="M 320 200 L 475 200 L 460 215 L 330 215 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
              {/* Black Right Side Accent Column */}
              <rect x="445" y="215" width="20" height="143" fill="#000000" />
              {/* Inset Taped Rectangle Frame */}
              <rect x="355" y="235" width="75" height="50" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
              {/* Corner Tape Pieces */}
              <line x1="350" y1="230" x2="362" y2="242" stroke="#000000" strokeWidth="3" />
              <line x1="435" y1="230" x2="423" y2="242" stroke="#000000" strokeWidth="3" />
              <line x1="350" y1="290" x2="362" y2="278" stroke="#000000" strokeWidth="3" />
              <line x1="435" y1="290" x2="423" y2="278" stroke="#000000" strokeWidth="3" />
            </g>

            {/* 4. T-SHIRT ON HANGER (DISPLAYED ON DESK) */}
            <motion.g
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              id="tshirt-display"
            >
              {/* Hanger Hook & Triangle */}
              <path d="M 432 150 C 432 143 438 143 438 148 C 438 155 432 155 432 160" stroke="#000000" strokeWidth="2.5" fill="none" />
              <path d="M 412 170 L 432 160 L 452 170 Z" stroke="#000000" strokeWidth="2" fill="none" />
              {/* T-Shirt Silhouette */}
              <path d="M 412 170 L 392 185 L 404 200 L 416 195 L 416 230 L 448 230 L 448 195 L 460 200 L 472 185 L 452 170 Q 432 178 412 170 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
              {/* Shirt Graphic Emblem */}
              <circle cx="432" cy="202" r="10" fill="#000000" />
              <path d="M 426 202 Q 432 195 438 202" stroke="#FFFFFF" strokeWidth="2" fill="none" />
            </motion.g>

            {/* 5. SEATED STORE OWNER (LEFT CHARACTER - EXACT REFERENCE ARTWORK) */}
            <motion.g
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 4.0, repeat: Infinity, ease: 'easeInOut' }}
              id="store-owner"
            >
              {/* Stool / Seat Box */}
              <rect x="170" y="240" width="60" height="118" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
              <line x1="170" y1="265" x2="230" y2="265" stroke="#000000" strokeWidth="2" strokeDasharray="3 3" />
              <path d="M 180 290 L 195 315" stroke="#000000" strokeWidth="1.5" />

              {/* Seated Legs */}
              <path d="M 190 220 C 190 220 225 220 235 225 C 245 230 250 250 260 280 L 305 280 L 320 348" stroke="#000000" strokeWidth="3" fill="none" />
              <path d="M 190 230 C 190 230 235 230 248 240 C 260 250 270 285 285 305 L 340 305 L 360 348" stroke="#000000" strokeWidth="3" fill="none" />
              
              {/* Owner Shoes */}
              <path d="M 305 348 L 345 348 L 340 360 L 295 360 Z" fill="#000000" stroke="#000000" strokeWidth="2" />
              <path d="M 345 348 L 385 348 L 380 360 L 335 360 Z" fill="#000000" stroke="#000000" strokeWidth="2" />

              {/* Torso & V-Neck Shirt */}
              <path d="M 160 150 Q 160 130 195 130 Q 230 130 230 150 L 220 220 L 170 220 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
              <path d="M 185 130 L 195 148 L 205 130" stroke="#000000" strokeWidth="2.5" fill="none" />
              {/* Sleeve Folds */}
              <line x1="160" y1="170" x2="175" y2="170" stroke="#000000" strokeWidth="2" />
              <line x1="215" y1="165" x2="230" y2="165" stroke="#000000" strokeWidth="2" />

              {/* Head & Hair Profile facing right */}
              <path d="M 180 110 C 180 85 210 85 215 110 C 215 125 200 132 195 132 C 185 132 180 125 180 110 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
              {/* Hair styled backward */}
              <path d="M 175 106 C 178 85 212 85 218 102 C 210 92 200 88 193 88 C 185 88 178 94 175 106 Z" fill="#000000" />
              {/* Ear & Nose Profile */}
              <circle cx="180" cy="110" r="4" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
              <path d="M 215 108 Q 220 112 215 115" stroke="#000000" strokeWidth="2" fill="none" />

              {/* Eye Pupil */}
              <circle cx={202 + mousePos.x * 0.08} cy={105 + mousePos.y * 0.08} r="2.5" fill="#000000" />

              {/* Right Arm holding Picture/Folder on Lap */}
              <path d="M 170 150 Q 185 175 215 175" stroke="#000000" strokeWidth="3" fill="none" strokeLinecap="round" />
              <rect x="210" y="160" width="40" height="32" rx="2" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
              {/* Picture Mountain Emblem inside folder */}
              <path d="M 215 185 L 226 172 L 235 185 L 242 178 L 248 185 Z" fill="#000000" />
              <circle cx="240" cy="168" r="3" fill="#000000" />

              {/* Left Arm extended UP holding Clipboard pointing to Window */}
              <path d="M 220 148 L 275 130 L 315 155" stroke="#000000" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Clipboard Document in Hand */}
              <rect x="298" y="142" width="32" height="46" rx="3" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
              <rect x="308" y="138" width="12" height="6" rx="1" fill="#000000" />
              {/* Text Lines on Clipboard */}
              <line x1="304" y1="152" x2="324" y2="152" stroke="#000000" strokeWidth="2" />
              <line x1="304" y1="158" x2="324" y2="158" stroke="#000000" strokeWidth="2" />
              <line x1="304" y1="164" x2="320" y2="164" stroke="#000000" strokeWidth="2" />
              <line x1="304" y1="170" x2="324" y2="170" stroke="#000000" strokeWidth="2" />
              <line x1="304" y1="176" x2="318" y2="176" stroke="#000000" strokeWidth="2" />
            </motion.g>

            {/* 6. STANDING CUSTOMER (RIGHT CHARACTER - EXACT REFERENCE ARTWORK) */}
            <motion.g
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
              id="customer-standing"
            >
              {/* Standing Trousers / Legs */}
              <path d="M 520 180 L 520 348" stroke="#000000" strokeWidth="3" fill="none" />
              <path d="M 570 180 L 570 348" stroke="#000000" strokeWidth="3" fill="none" />
              <line x1="545" y1="180" x2="545" y2="280" stroke="#000000" strokeWidth="2" strokeDasharray="3 3" />
              {/* Trousers Cuffs */}
              <line x1="505" y1="340" x2="535" y2="340" stroke="#000000" strokeWidth="2" />
              <line x1="555" y1="340" x2="585" y2="340" stroke="#000000" strokeWidth="2" />
              {/* Sneakers at Baseline */}
              <path d="M 485 348 L 530 348 L 525 360 L 480 360 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
              <path d="M 555 348 L 600 348 L 595 360 L 550 360 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />

              {/* Torso & Patterned Jacket */}
              <path d="M 505 105 C 505 92 525 88 545 88 C 565 88 585 92 585 105 L 595 180 L 495 180 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
              {/* Jacket Open Front V Line */}
              <path d="M 535 88 L 545 108 L 555 88" stroke="#000000" strokeWidth="2.5" fill="none" />
              <line x1="545" y1="108" x2="545" y2="180" stroke="#000000" strokeWidth="2" />

              {/* Jacket Oval Pattern Details (Matching reference artwork) */}
              <path d="M 508 120 C 502 135 515 145 520 130 C 525 115 512 108 508 120 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
              <path d="M 570 120 C 564 135 577 145 582 130 C 587 115 574 108 570 120 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
              <path d="M 502 165 C 498 175 510 185 516 172 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
              <path d="M 572 165 C 568 175 580 185 586 172 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />

              {/* Head & Dark Hair Profile facing left */}
              <path d="M 530 65 C 530 42 560 42 565 65 C 565 80 550 86 545 86 C 535 86 530 80 530 65 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
              {/* Hair styled backward */}
              <path d="M 526 60 C 528 42 562 42 568 58 C 560 48 550 44 543 44 C 535 44 528 50 526 60 Z" fill="#000000" />
              {/* Nose & Smile Profile facing left */}
              <path d="M 530 63 Q 525 66 530 70" stroke="#000000" strokeWidth="2" fill="none" />
              {/* Eye Pupil */}
              <circle cx={538 + mousePos.x * 0.08} cy={60 + mousePos.y * 0.08} r="2.5" fill="#000000" />

              {/* Extended Left Arm Reaching toward T-Shirt Hanger */}
              <motion.path
                animate={{ d: ["M 510 115 L 452 142", "M 510 115 L 448 140", "M 510 115 L 452 142"] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                stroke="#000000"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              {/* Hand Finger detail */}
              <path d="M 452 142 C 445 140 442 146 448 148" stroke="#000000" strokeWidth="2" fill="none" />

              {/* Right Arm resting by side */}
              <path d="M 580 115 L 595 155" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
            </motion.g>

          </svg>
        </motion.div>
      </div>
    </div>
  );
}
