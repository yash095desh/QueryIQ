"use client";

import { useState } from "react";
import { Menu, X, Zap } from "lucide-react";
import { motion } from "motion/react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-white/10 dark:bg-zinc-900/30 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-chart-1 to-chart-2 flex items-center justify-center">
            <Zap size={20} className="text-black" />
          </div>
          <span className="text-2xl font-bold font-display gradient-green-text">
            QueryIQ
          </span>
        </div>

        {/* Centered Floating Navigation Badge */}
        <motion.nav
          className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-8 items-center bg-card/40 backdrop-blur-xl border border-border/50 rounded-full px-8 py-3 shadow-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.a
            href="#features"
            className="text-gray-300 hover:text-primary transition text-sm font-medium relative group"
            whileHover={{ scale: 1.05 }}
          >
            Features
            <motion.span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </motion.a>
          <motion.a
            href="#how-it-works"
            className="text-gray-300 hover:text-primary transition text-sm font-medium relative group"
            whileHover={{ scale: 1.05 }}
          >
            How It Works
            <motion.span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </motion.a>
          <motion.a
            href="#pricing"
            className="text-gray-300 hover:text-primary transition text-sm font-medium relative group"
            whileHover={{ scale: 1.05 }}
          >
            Pricing
            <motion.span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </motion.a>
          <motion.a
            href="#faq"
            className="text-gray-300 hover:text-primary transition text-sm font-medium relative group"
            whileHover={{ scale: 1.05 }}
          >
            FAQ
            <motion.span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </motion.a>
        </motion.nav>

        {/* CTA Button */}
        <motion.button
          className="hidden md:block gradient-green-button px-6 py-2 rounded-lg font-semibold text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          Start Free Trial
        </motion.button>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-primary"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            className="absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10 md:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <nav className="flex flex-col gap-4 p-4">
              <a href="#features" className="text-gray-300 hover:text-primary">
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-gray-300 hover:text-primary"
              >
                How It Works
              </a>
              <a href="#pricing" className="text-gray-300 hover:text-primary">
                Pricing
              </a>
              <a href="#faq" className="text-gray-300 hover:text-primary">
                FAQ
              </a>
              <button className="gradient-green-button px-6 py-2 rounded-lg font-semibold w-full">
                Start Free Trial
              </button>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
}
