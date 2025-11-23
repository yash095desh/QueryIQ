import { ArrowRight, Database, MessageSquare, Sparkles } from 'lucide-react'
import { motion, useScroll, useTransform, useInView } from 'motion/react'
import { useRef } from 'react'

const steps = [
  {
    number: "1",
    title: "Connect Your Database",
    description: "Link any SQL database in minutes. QueryIQ supports PostgreSQL, MySQL, BigQuery, Snowflake, and more. Your data never leaves your servers with our secure connection protocol.",
    details: "Secure • No data migration • Multiple database support",
    icon: Database
  },
  {
    number: "2",
    title: "Ask Your Questions",
    description: "Chat naturally with your data using our intuitive interface. Ask follow-up questions, drill down into details, or get a high-level overview. AI understands context and your data schema automatically.",
    details: "Natural language • Context-aware • Real-time processing",
    icon: MessageSquare
  },
  {
    number: "3",
    title: "Get Instant Insights",
    description: "Receive comprehensive answers with visualizations, summaries, and actionable recommendations. Export results in your preferred format and share with your team instantly.",
    details: "Visualizations • Exports • Team collaboration",
    icon: Sparkles
  }
]

export default function HowItWorks() {
  const containerRef = useRef(null)
  const headerRef = useRef(null)
  const timelineRef = useRef(null)
  
  const headerInView = useInView(headerRef, { once: true, amount: 0.3 })
  
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start center", "end center"]
  })
  
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])

  return (
    <section id="how-it-works" ref={containerRef} className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
      {/* Background orb */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
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

      {/* Header */}
      <motion.div
        ref={headerRef}
        className="text-center mb-20"
        initial={{ opacity: 0, y: 20 }}
        animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h2
          className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 gradient-green-text font-display"
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Three Steps to Data Mastery
        </motion.h2>
        <motion.p
          className="text-gray-400 text-base max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          From setup to insights, QueryIQ simplifies every step of your data analysis journey
        </motion.p>
      </motion.div>

      {/* Timeline */}
      <div ref={timelineRef} className="relative max-w-5xl mx-auto">
        {/* Vertical line - background */}
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2" />
        
        {/* Animated progress line */}
        <motion.div 
          className="absolute left-8 md:left-1/2 top-0 w-0.5 bg-primary -translate-x-1/2 origin-top"
          style={{ height: lineHeight }}
        />

        {/* Steps */}
        <div className="space-y-16 md:space-y-24 relative">
          {steps.map((step, index) => {
            const stepRef = useRef(null)
            const isInView = useInView(stepRef, { once: true, amount: 0.5 })
            const Icon = step.icon
            const isEven = index % 2 === 0

            return (
              <motion.div
                key={index}
                ref={stepRef}
                className="relative"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Timeline node */}
                <motion.div 
                  className="absolute left-8 md:left-1/2 -translate-x-1/2 z-10"
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : { scale: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <div className="w-16 h-16 rounded-full bg-card border-4 border-background flex items-center justify-center">
                    <motion.div 
                      className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center"
                      animate={isInView ? { 
                        boxShadow: [
                          "0 0 0 0 rgba(163, 230, 53, 0.4)",
                          "0 0 0 8px rgba(163, 230, 53, 0)",
                        ]
                      } : {}}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Icon className="text-primary" size={20} />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Content card - alternating sides on desktop */}
                <div className={`md:grid md:grid-cols-2 md:gap-16 pl-24 md:pl-0`}>
                  {/* Left side content for even indices */}
                  {isEven && (
                    <>
                      <motion.div
                        className="hidden md:block"
                        initial={{ opacity: 0, x: -50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                      >
                        <div className="backdrop-blur-xl bg-card/30 border border-border rounded-2xl p-8 hover:border-primary/50 transition-colors duration-300">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-5xl font-bold gradient-green-text font-display">
                              {step.number}
                            </span>
                            <h3 className="text-xl font-bold text-white">{step.title}</h3>
                          </div>
                          <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            {step.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {step.details.split(' • ').map((detail, i) => (
                              <span key={i} className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                {detail}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                      <div className="hidden md:block" />
                    </>
                  )}

                  {/* Right side content for odd indices */}
                  {!isEven && (
                    <>
                      <div className="hidden md:block" />
                      <motion.div
                        className="hidden md:block"
                        initial={{ opacity: 0, x: 50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                      >
                        <div className="backdrop-blur-xl bg-card/30 border border-border rounded-2xl p-8 hover:border-primary/50 transition-colors duration-300">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-5xl font-bold gradient-green-text font-display">
                              {step.number}
                            </span>
                            <h3 className="text-xl font-bold text-white">{step.title}</h3>
                          </div>
                          <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            {step.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {step.details.split(' • ').map((detail, i) => (
                              <span key={i} className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                {detail}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}

                  {/* Mobile view - always on right */}
                  <motion.div
                    className="md:hidden"
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <div className="backdrop-blur-xl bg-card/30 border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-4xl font-bold gradient-green-text font-display">
                          {step.number}
                        </span>
                        <h3 className="text-lg font-bold text-white">{step.title}</h3>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed mb-4">
                        {step.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {step.details.split(' • ').map((detail, i) => (
                          <span key={i} className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
                            {detail}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Workflow visualization */}
      <motion.div
        className="mt-20 max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
      >
        <div className="backdrop-blur-xl bg-card/30 border border-border rounded-2xl p-8 md:p-12 hover:border-primary/50 transition-colors duration-300">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Database className="text-primary" size={24} />
              </div>
              <span className="text-white font-semibold">Database</span>
            </div>
            
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowRight className="text-primary" size={24} />
            </motion.div>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="text-primary" size={24} />
              </div>
              <span className="text-white font-semibold">AI Processing</span>
            </div>
            
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <ArrowRight className="text-primary" size={24} />
            </motion.div>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <MessageSquare className="text-primary" size={24} />
              </div>
              <span className="text-white font-semibold">Insights</span>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">Complete Data Workflow</p>
          </div>
        </div>
      </motion.div>
    </section>
  )
}