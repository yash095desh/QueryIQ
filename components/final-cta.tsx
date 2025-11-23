import { ArrowRight, CheckCircle2, Users, Zap, Shield } from 'lucide-react'
import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

export default function FinalCTA() {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.3 })

  const floatingBadges = [
    { icon: Users, text: "10K+ Teams", position: { top: '10%', left: '5%' } },
    { icon: Zap, text: "99.9% Uptime", position: { top: '15%', right: '8%' } },
    { icon: Shield, text: "SOC 2 Certified", position: { bottom: '15%', left: '8%' } },
    { icon: CheckCircle2, text: "14-Day Trial", position: { bottom: '20%', right: '5%' } },
  ]

  return (
    <section 
      ref={containerRef}
      className="py-32 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative overflow-hidden"
    >
      {/* Background orbs */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0.3, scale: 1 }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating badges */}
      {floatingBadges.map((badge, index) => {
        const Icon = badge.icon
        return (
          <motion.div
            key={index}
            className="absolute hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-card/40 backdrop-blur-xl border border-border"
            style={badge.position}
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { 
              opacity: 1, 
              scale: 1,
              y: [0, -10, 0],
            } : { opacity: 0, scale: 0 }}
            transition={{
              opacity: { duration: 0.5, delay: 0.5 + index * 0.1 },
              scale: { duration: 0.5, delay: 0.5 + index * 0.1 },
              y: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.5,
              }
            }}
            whileHover={{ scale: 1.1 }}
          >
            <Icon className="text-primary" size={16} />
            <span className="text-sm font-medium text-white">{badge.text}</span>
          </motion.div>
        )
      })}

      {/* Main CTA Content */}
      <motion.div
        className="relative max-w-4xl mx-auto text-center"
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h2
          className="text-3xl sm:text-4xl font-bold mb-3 gradient-green-text font-display leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Ready to Transform Your Data Workflow?
        </motion.h2>

        <motion.p
          className="text-base text-gray-400 mb-6 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Join thousands of teams already using QueryIQ to unlock insights from their data in seconds
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <motion.button
            className="gradient-green-button px-8 py-3 rounded-lg font-bold text-base glow-green inline-flex items-center justify-center gap-2 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <motion.button
            className="px-8 py-3 rounded-lg font-semibold text-base border border-primary/50 text-primary hover:bg-primary/10 transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Book a Demo
          </motion.button>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-gray-500"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-primary" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-primary" />
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-primary" />
            <span>Cancel anytime</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}