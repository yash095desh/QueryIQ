import { Code2, BarChart3, Users, CheckCircle2, TrendingUp, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useRef } from 'react'
import { useInView } from 'motion/react'

const useCases = [
  {
    id: 'developers',
    title: "Product Developers",
    icon: Code2,
    description: "Debug performance issues instantly. Query user behavior data, analyze feature adoption rates, and identify bottlenecks without needing SQL expertise. Accelerate your development cycles with data-driven decisions.",
    metric: "90% faster debugging",
    benefits: [
      "Debug issues in real-time",
      "Track feature adoption instantly",
      "Identify performance bottlenecks",
      "No SQL knowledge required"
    ],
    stats: [
      { label: "Time Saved", value: "15hrs/week" },
      { label: "Faster Queries", value: "90%" },
      { label: "Bug Resolution", value: "3x faster" }
    ]
  },
  {
    id: 'analysts',
    title: "Data Analysts",
    icon: BarChart3,
    description: "Generate comprehensive reports in seconds instead of hours. Create beautiful visualizations automatically, drill into anomalies with natural language, and share insights with stakeholders instantly.",
    metric: "8 hours saved per week",
    benefits: [
      "Automated report generation",
      "Beautiful visualizations instantly",
      "Natural language queries",
      "One-click sharing"
    ],
    stats: [
      { label: "Report Speed", value: "10x faster" },
      { label: "Weekly Savings", value: "8 hours" },
      { label: "Accuracy", value: "99.9%" }
    ]
  },
  {
    id: 'business',
    title: "Business Teams",
    icon: Users,
    description: "Make confident, data-driven decisions without technical barriers. Ask questions about revenue, customer behavior, sales pipelines, and market trends. Get the answers you need in seconds, not weeks.",
    metric: "100% faster insights",
    benefits: [
      "No technical skills needed",
      "Real-time business metrics",
      "Instant decision support",
      "Cross-team collaboration"
    ],
    stats: [
      { label: "Decision Speed", value: "100% faster" },
      { label: "Data Access", value: "24/7" },
      { label: "Team Adoption", value: "95%" }
    ]
  }
]

export default function UseCases() {
  const [activeTab, setActiveTab] = useState('developers')
  const headerRef = useRef(null)
  const contentRef = useRef(null)
  
  const headerInView = useInView(headerRef, { once: true, amount: 0.3 })
  const contentInView = useInView(contentRef, { once: true, amount: 0.2 })
  
  const activeCase = useCases.find(uc => uc.id === activeTab)

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
      {/* Background orb */}
      <motion.div
        className="absolute top-1/2 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
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
        className="text-center mb-12"
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
          Built for Every Team
        </motion.h2>
        <motion.p
          className="text-gray-400 text-base max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Whether you're a developer, analyst, or business leader, QueryIQ adapts to your needs
        </motion.p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        className="flex flex-col sm:flex-row justify-center gap-3 mb-12 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {useCases.map((useCase, index) => {
          const Icon = useCase.icon
          const isActive = activeTab === useCase.id
          
          return (
            <motion.button
              key={useCase.id}
              onClick={() => setActiveTab(useCase.id)}
              className={`relative flex items-center gap-3 px-6 py-4 rounded-xl backdrop-blur-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-primary/10 border-2 border-primary' 
                  : 'bg-card/30 border-2 border-border hover:border-primary/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              <motion.div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isActive ? 'bg-primary/20' : 'bg-primary/10'
                }`}
                animate={{
                  scale: isActive ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: isActive ? Infinity : 0,
                  ease: "easeInOut",
                }}
              >
                <Icon className="text-primary" size={20} />
              </motion.div>
              <span className={`font-semibold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                {useCase.title}
              </span>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Content Area */}
      <div ref={contentRef} className="relative">
        <AnimatePresence mode="wait">
          {activeCase && (
            <motion.div
              key={activeCase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="backdrop-blur-xl bg-card/30 border border-border rounded-2xl overflow-hidden"
            >
              {/* Main Content Grid */}
              <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">
                {/* Left Column - Description */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <activeCase.icon className="text-primary" size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{activeCase.title}</h3>
                  </div>
                  
                  <p className="text-gray-400 text-base leading-relaxed mb-6">
                    {activeCase.description}
                  </p>

                  {/* Metric Highlight */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
                    <Zap className="text-primary" size={16} />
                    <span className="text-primary font-bold text-sm">{activeCase.metric}</span>
                  </div>

                  {/* Benefits List */}
                  <div className="space-y-3">
                    {activeCase.benefits.map((benefit, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <CheckCircle2 className="text-primary shrink-0" size={18} />
                        <span className="text-gray-300 text-sm">{benefit}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Right Column - Stats */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-col justify-center"
                >
                  <div className="space-y-6">
                    {activeCase.stats.map((stat, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                        className="backdrop-blur-xl bg-background/30 border border-border rounded-xl p-6 hover:border-primary/50 transition-colors duration-300"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-gray-400 text-sm font-medium">{stat.label}</span>
                          <TrendingUp className="text-primary" size={18} />
                        </div>
                        <div className="text-4xl font-bold gradient-green-text">
                          {stat.value}
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mt-4 h-1.5 bg-border rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.8, delay: 0.5 + index * 0.1, ease: "easeOut" }}
                            style={{ transformOrigin: 'left' }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}