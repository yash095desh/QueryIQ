import { BarChart3, Zap, Shield, Gauge, Brain, Lock, Sparkles, TrendingUp, ArrowRight } from 'lucide-react'
import { motion, useInView } from 'motion/react'
import { useRef, useState } from 'react'

export default function HeroFeatures() {
  const [hoveredIndex, setHoveredIndex] = useState<null|number>(null)
  const containerRef = useRef(null)
  const headerRef = useRef(null)
  const ctaRef = useRef(null)
  
  const isInView = useInView(containerRef, { once: true, amount: 0.2 })
  const headerInView = useInView(headerRef, { once: true, amount: 0.3 })
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.3 })

  const features = [
    {
      icon: Brain,
      title: 'Natural Language Understanding',
      description: 'Describe what you need in plain English. Our AI instantly understands complex data requirements.',
      stat: '99.8% accuracy',
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Get instant insights and visualizations from your data without waiting for complex queries.',
      stat: 'Live updates',
    },
    {
      icon: Zap,
      title: 'Lightning Fast Results',
      description: 'Optimized query execution ensures you get results in milliseconds, not minutes.',
      stat: '<100ms response',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Military-grade encryption and compliance with HIPAA, GDPR, and SOC 2 Type II standards.',
      stat: 'SOC 2 Certified',
    },
    {
      icon: Gauge,
      title: 'Smart Query Optimization',
      description: 'Automatic query optimization ensures peak database performance and cost efficiency.',
      stat: '40% cost savings',
    },
    {
      icon: Lock,
      title: 'Data Privacy First',
      description: 'Your data never leaves your infrastructure. Full control and governance at all times.',
      stat: '100% compliant',
    },
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
      {/* Animated background orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        initial={{ opacity: 0.3, scale: 1 }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-chart-3/10 rounded-full blur-3xl"
        initial={{ opacity: 0.3, scale: 1 }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
      />

      {/* Section header */}
      <motion.div
        ref={headerRef}
        className="text-center mb-16 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >

        <motion.h2
          className="text-4xl md:text-5xl font-bold mb-4 gradient-green-text font-display"
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Everything you need to succeed
        </motion.h2>
        
        <motion.p
          className="text-gray-400 text-lg max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Transform your data workflow with cutting-edge AI technology
        </motion.p>
      </motion.div>

      {/* Features grid */}
      <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 mb-16">
        {features.map((feature, index) => {
          const Icon = feature.icon
          const isHovered = hoveredIndex === index
          
          return (
            <motion.div
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="group relative"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                ease: "easeOut" 
              }}
              whileHover={{ y: -4 }}
            >
              {/* Glow effect */}
              <motion.div
                className="absolute -inset-0.5 bg-primary/10 rounded-2xl blur opacity-0"
                animate={{
                  opacity: isHovered ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Card */}
              <div className="relative h-full bg-card/30 backdrop-blur-sm rounded-2xl p-6 border border-border hover:border-primary/50 transition-colors duration-300">
                
                {/* Floating badge */}
                <motion.div
                  className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    y: isHovered ? 0 : -10,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {feature.stat}
                </motion.div>

                {/* Icon container */}
                <motion.div
                  className="mb-5 relative"
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : { scale: 0 }}
                  transition={{ 
                    delay: index * 0.1 + 0.2, 
                    type: "spring",
                    stiffness: 200,
                    damping: 15 
                  }}
                >
                  <motion.div
                    className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center"
                    animate={{
                      scale: isHovered ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon size={28} className="text-primary" />
                  </motion.div>
                </motion.div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="font-bold text-white text-lg">
                    {feature.title}
                  </h3>
                  
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="mt-6 h-1 bg-border rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{ transformOrigin: 'left' }}
                  />
                </div>

                {/* Trending icon */}
                <motion.div
                  className="absolute bottom-4 right-4"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: isHovered ? 0.5 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <TrendingUp className="w-5 h-5 text-primary" />
                </motion.div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}