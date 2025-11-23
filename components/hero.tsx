"use client";

import {
  Play,
  CheckCircle2,
  Sparkles,
  Database,
  Zap,
  ArrowRight,
  Code2,
  TrendingUp,
} from "lucide-react";
import { motion, useScroll, useTransform, useInView } from "motion/react";
import { useRef } from "react";

export default function Hero() {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const statsRef = useRef(null);
  const socialRef = useRef(null);

  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const videoInView = useInView(videoRef, { once: true, amount: 0.3 });
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 });
  const socialInView = useInView(socialRef, { once: true, amount: 0.3 });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-visible"
    >
      {/* Animated background orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        initial={{ opacity: 0.3, scale: 1 }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-chart-3/10 rounded-full blur-3xl"
        initial={{ opacity: 0.3, scale: 1 }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      <div className="text-center mb-16">
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 bg-chart-3/10 border border-chart-5 rounded-full px-4 py-2 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles size={16} className="text-primary" />
          </motion.div>
          <span className="text-sm text-ring font-medium">
            Powered by Advanced AI
          </span>
        </motion.div>

        {/* Main Heading with parallax effect */}
        <motion.h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 gradient-green-text text-balance leading-tighter font-display"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ y, opacity }}
        >
          Ask Your Database Questions
          <br />
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            in Plain English
          </motion.span>
        </motion.h1>

        {/* Trust Badges */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center mb-16 text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {[
            "Enterprise-grade encryption",
            "14-day free trial, no card required",
            "24/7 customer support",
          ].map((text, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <CheckCircle2 size={16} className="text-primary shrink-0" />
              {text}
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.button
            className="gradient-green-button px-8 py-4 rounded-lg font-bold text-base glow-green relative overflow-hidden group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10">Start Free Trial</span>
          </motion.button>

          <motion.button
            className="flex items-center justify-center gap-2 border border-chart-5 px-8 py-4 rounded-lg font-semibold text-primary hover:bg-lime-400/10 transition-all hover:border-primary group relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Play
              size={18}
              className="group-hover:translate-x-0.5 transition-transform"
            />
            Watch Demo
          </motion.button>
        </motion.div>

        {/* Video Demo Container - Fades in on scroll */}
        <motion.div
          ref={videoRef}
          className="relative mb-12 "
          initial={{ opacity: 0, y: 40 }}
          animate={videoInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-primary to-chart-3 rounded-2xl opacity-20 blur-xl"
            animate={{
              scale: [1, 1.02, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="relative bg-gradient-to-br from-chart-5/20 to-transparent border border-chart-5/50 rounded-2xl p-2 backdrop-blur-sm">
            {/* Video Player */}
            <div className="aspect-21/9 bg-gradient-to-br from-background to-card rounded-xl overflow-hidden relative">
              <video
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
              >
                <source src="/demo-video.mp4" type="video/mp4" />
                <source src="/demo-video.webm" type="video/webm" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </motion.div>

        {/* Stats with counter animation - Fades in on scroll */}
        <motion.div
          ref={statsRef}
          className="grid grid-cols-3 gap-4 mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {[
            { value: "50K+", label: "Active Users", icon: TrendingUp },
            { value: "2M+", label: "Queries Processed", icon: Database },
            { value: "99.9%", label: "Accuracy Rate", icon: Zap },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="stat-card text-center p-6 rounded-xl bg-card/30 border border-border hover:border-primary/50 transition-all group"
              initial={{ opacity: 0, y: 20 }}
              animate={
                statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
              }
              transition={{ delay: i * 0.1, duration: 0.6 }}
              whileHover={{ y: -5 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={statsInView ? { scale: 1 } : { scale: 0 }}
                transition={{ delay: i * 0.1 + 0.3, type: "spring" }}
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
              </motion.div>
              <div className="text-3xl font-bold gradient-green-text mb-2">
                {stat.value}
              </div>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Social Proof - Fades in on scroll */}
        <motion.div
          ref={socialRef}
          className="mt-24 pt-16 border-t border-white/5"
          initial={{ opacity: 0 }}
          animate={socialInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.p 
            className="text-xs text-gray-500 mb-12 font-medium tracking-widest uppercase"
            initial={{ opacity: 0, y: 10 }}
            animate={socialInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Trusted by industry leaders
          </motion.p>
          
          {/* Logo Grid with stagger animation */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-16 gap-y-10 items-center max-w-6xl mx-auto"
            initial={{ opacity: 0 }}
            animate={socialInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {["Netflix", "Airbnb", "Uber", "Stripe", "Figma", "Notion"].map(
              (company, i) => (
                <motion.div
                  key={company}
                  className="group relative flex items-center justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    socialInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                  }
                  transition={{ 
                    delay: 0.4 + i * 0.08, 
                    duration: 0.5,
                    ease: "easeOut" 
                  }}
                >
                  {/* Subtle glow on hover */}
                  <motion.div
                    className="absolute inset-0 bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    initial={false}
                  />
                  
                  {/* Company logo text */}
                  <motion.span
                    className="relative text-gray-500 font-bold text-xl tracking-tight group-hover:text-gray-300 transition-colors duration-300 cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    {company}
                  </motion.span>
                </motion.div>
              )
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
