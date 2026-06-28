"use client"
import React from 'react'

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-sm border-b border-neutral-800 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="text-lg font-semibold">EasyTrader Platform</div>
        <nav className="space-x-4 text-sm text-neutral-300">
          <a href="#" className="hover:underline">Home</a>
          <a href="#" className="hover:underline">Docs</a>
          <a href="#" className="hover:underline">Contact</a>
        </nav>
      </div>
    </header>
  )
}
