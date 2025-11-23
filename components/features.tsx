import { MessageSquare, BarChart3, Sparkles, Download, Lock, Gauge } from 'lucide-react'
import { motion, useInView } from 'motion/react'
import { useRef, useState } from 'react'

const features = [
  {
    icon: MessageSquare,
    title: "Natural Language Queries",
    description: "Ask your database anything in plain English. QueryIQ understands complex questions and translates them into precise SQL queries automatically.",
    benefit: "Save hours writing and debugging queries"
  },
  {
    icon: BarChart3,
    title: "Auto-Generated Visualizations",
    description: "Get instant, publication-ready charts and graphs that automatically adapt to your data type and analysis needs.",
    benefit: "Create reports in seconds, not days"
  },
  {
    icon: Sparkles,
    title: "AI-Powered Insights",
    description: "Discover hidden patterns and anomalies in your data. QueryIQ highlights trends, outliers, and key metrics automatically.",
    benefit: "Make smarter, faster decisions"
  },
  {
    icon: Download,
    title: "One-Click Export",
    description: "Export any query result to Excel, CSV, PDF, or connect directly to your BI tools. Seamless integration with your existing workflow.",
    benefit: "Share insights effortlessly"
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description: "Bank-level encryption, SOC 2 compliance, and granular access controls. Your data stays protected with industry-leading security standards.",
    benefit: "Enterprise-ready from day one"
  },
  {
    icon: Gauge,
    title: "Collaborative Dashboards",
    description: "Build shared, interactive dashboards that your entire team can access and customize. Real-time collaboration features included.",
    benefit: "Empower your entire organization"
  }
]

export default function Features() {
  const [hoveredIndex, setHoveredIndex] = useState<null|number>(null)
  const containerRef = useRef(null)
  const headerRef = useRef(null)
  
  const isInView = useInView(containerRef, { once: true, amount: 0.1 })
  const headerInView = useInView(headerRef, { once: true, amount: 0.3 })

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
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
        className="text-center mb-16"
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
          Powerful Features for Modern Data Teams
        </motion.h2>
        <motion.p
          className="text-gray-400 text-base max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Everything you need to unlock the full potential of your data without technical barriers or complex workflows
        </motion.p>
      </motion.div>

      {/* Bento Grid Layout */}
      <div
        ref={containerRef}
        className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 relative z-10"
      >
        {/* Feature 1 - Large horizontal (spans 8 cols) */}
        <motion.div
          onMouseEnter={() => setHoveredIndex(0)}
          onMouseLeave={() => setHoveredIndex(null)}
          className="group relative md:col-span-6 lg:col-span-8"
          initial={{ opacity: 0, x: -20 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div 
            className="h-full backdrop-blur-xl bg-card/30 rounded-2xl p-8 relative overflow-hidden"
            style={{
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--border)',
            }}
            animate={{
              borderColor: hoveredIndex === 0 ? 'rgb(163, 230, 53)' : 'var(--border)',
            }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -4 }}
          >
            <div className="relative h-full flex flex-col">
              <motion.div
                className="bg-primary/10 border border-primary/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                animate={{
                  y: hoveredIndex === 0 ? [-2, 2, -2] : 0,
                }}
                transition={{
                  duration: 2,
                  repeat: hoveredIndex === 0 ? Infinity : 0,
                  ease: "easeInOut",
                }}
              >
                <MessageSquare className="text-primary" size={28} />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-white mb-3">{features[0].title}</h3>
              <p className="text-gray-400 text-base leading-relaxed mb-4">{features[0].description}</p>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: hoveredIndex === 0 ? 1 : 0,
                  y: hoveredIndex === 0 ? 0 : 10,
                }}
                transition={{ duration: 0.3 }}
                className="mt-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 self-start"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-primary text-xs font-medium">{features[0].benefit}</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Feature 2 - Medium (spans 4 cols) */}
        <motion.div
          onMouseEnter={() => setHoveredIndex(1)}
          onMouseLeave={() => setHoveredIndex(null)}
          className="group relative md:col-span-3 lg:col-span-4"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <motion.div 
            className="h-full backdrop-blur-xl bg-card/30 rounded-2xl p-6 relative overflow-hidden"
            style={{
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--border)',
            }}
            animate={{
              borderColor: hoveredIndex === 1 ? 'rgb(163, 230, 53)' : 'var(--border)',
            }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -4 }}
          >
            <div className="relative h-full flex flex-col">
              <motion.div
                className="bg-primary/10 border border-primary/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                animate={{
                  y: hoveredIndex === 1 ? [-2, 2, -2] : 0,
                }}
                transition={{
                  duration: 2,
                  repeat: hoveredIndex === 1 ? Infinity : 0,
                  ease: "easeInOut",
                }}
              >
                <BarChart3 className="text-primary" size={24} />
              </motion.div>
              
              <h3 className="text-lg font-bold text-white mb-2">{features[1].title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{features[1].description}</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Feature 3 - Medium (spans 4 cols) */}
        <motion.div
          onMouseEnter={() => setHoveredIndex(2)}
          onMouseLeave={() => setHoveredIndex(null)}
          className="group relative md:col-span-3 lg:col-span-4"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
        >
          <motion.div 
            className="h-full backdrop-blur-xl bg-card/30 rounded-2xl p-6 relative overflow-hidden"
            style={{
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--border)',
            }}
            animate={{
              borderColor: hoveredIndex === 2 ? 'rgb(163, 230, 53)' : 'var(--border)',
            }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -4 }}
          >
            <div className="relative h-full flex flex-col">
              <motion.div
                className="bg-primary/10 border border-primary/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                animate={{
                  y: hoveredIndex === 2 ? [-2, 2, -2] : 0,
                }}
                transition={{
                  duration: 2,
                  repeat: hoveredIndex === 2 ? Infinity : 0,
                  ease: "easeInOut",
                }}
              >
                <Sparkles className="text-primary" size={24} />
              </motion.div>
              
              <h3 className="text-lg font-bold text-white mb-2">{features[2].title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{features[2].description}</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Feature 4 - Medium (spans 4 cols) */}
        <motion.div
          onMouseEnter={() => setHoveredIndex(3)}
          onMouseLeave={() => setHoveredIndex(null)}
          className="group relative md:col-span-3 lg:col-span-4"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        >
          <motion.div 
            className="h-full backdrop-blur-xl bg-card/30 rounded-2xl p-6 relative overflow-hidden"
            style={{
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--border)',
            }}
            animate={{
              borderColor: hoveredIndex === 3 ? 'rgb(163, 230, 53)' : 'var(--border)',
            }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -4 }}
          >
            <div className="relative h-full flex flex-col">
              <motion.div
                className="bg-primary/10 border border-primary/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                animate={{
                  y: hoveredIndex === 3 ? [-2, 2, -2] : 0,
                }}
                transition={{
                  duration: 2,
                  repeat: hoveredIndex === 3 ? Infinity : 0,
                  ease: "easeInOut",
                }}
              >
                <Download className="text-primary" size={24} />
              </motion.div>
              
              <h3 className="text-lg font-bold text-white mb-2">{features[3].title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{features[3].description}</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Feature 5 - Tall (spans 4 cols) */}
        <motion.div
          onMouseEnter={() => setHoveredIndex(4)}
          onMouseLeave={() => setHoveredIndex(null)}
          className="group relative md:col-span-3 lg:col-span-4 md:row-span-2"
          initial={{ opacity: 0, x: 20 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
          transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
        >
          <motion.div 
            className="h-full backdrop-blur-xl bg-card/30 rounded-2xl p-8 relative overflow-hidden"
            style={{
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--border)',
            }}
            animate={{
              borderColor: hoveredIndex === 4 ? 'rgb(163, 230, 53)' : 'var(--border)',
            }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -4 }}
          >
            <div className="relative h-full flex flex-col">
              <motion.div
                className="bg-primary/10 border border-primary/20 w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                animate={{
                  y: hoveredIndex === 4 ? [-2, 2, -2] : 0,
                }}
                transition={{
                  duration: 2,
                  repeat: hoveredIndex === 4 ? Infinity : 0,
                  ease: "easeInOut",
                }}
              >
                <Lock className="text-primary" size={28} />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-white mb-4">{features[4].title}</h3>
              <p className="text-gray-400 text-base leading-relaxed mb-6">{features[4].description}</p>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: hoveredIndex === 4 ? 1 : 0,
                  y: hoveredIndex === 4 ? 0 : 10,
                }}
                transition={{ duration: 0.3 }}
                className="mt-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 self-start"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-primary text-xs font-medium">{features[4].benefit}</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Feature 6 - Large horizontal (spans 8 cols) */}
        <motion.div
          onMouseEnter={() => setHoveredIndex(5)}
          onMouseLeave={() => setHoveredIndex(null)}
          className="group relative md:col-span-6 lg:col-span-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        >
          <motion.div 
            className="h-full backdrop-blur-xl bg-card/30 rounded-2xl p-8 relative overflow-hidden"
            style={{
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--border)',
            }}
            animate={{
              borderColor: hoveredIndex === 5 ? 'rgb(163, 230, 53)' : 'var(--border)',
            }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -4 }}
          >
            <div className="relative h-full flex flex-col">
              <motion.div
                className="bg-primary/10 border border-primary/20 w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                animate={{
                  y: hoveredIndex === 5 ? [-2, 2, -2] : 0,
                }}
                transition={{
                  duration: 2,
                  repeat: hoveredIndex === 5 ? Infinity : 0,
                  ease: "easeInOut",
                }}
              >
                <Gauge className="text-primary" size={28} />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-white mb-3">{features[5].title}</h3>
              <p className="text-gray-400 text-base leading-relaxed mb-4">{features[5].description}</p>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: hoveredIndex === 5 ? 1 : 0,
                  y: hoveredIndex === 5 ? 0 : 10,
                }}
                transition={{ duration: 0.3 }}
                className="mt-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 self-start"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-primary text-xs font-medium">{features[5].benefit}</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}