import { useState, useRef } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence, useInView } from 'motion/react'

const faqs = [
  {
    question: "How does QueryIQ keep my data secure?",
    answer: "We use bank-level encryption for all data in transit and at rest. All queries are processed securely with zero data persistence after analysis."
  },
  {
    question: "What databases are supported?",
    answer: "QueryIQ supports PostgreSQL, MySQL, MongoDB, Snowflake, BigQuery, and more. We're constantly adding new database support."
  },
  {
    question: "Do I need to know SQL?",
    answer: "No! QueryIQ is designed for non-technical users. Just ask questions in plain English and AI handles the rest."
  },
  {
    question: "Can I export my results?",
    answer: "Yes, you can export to Excel, CSV, PDF, or directly to your favorite tools like Google Sheets and Slack."
  },
  {
    question: "How does the free trial work?",
    answer: "Start with 14 days of free access to all Pro features. No credit card required. Upgrade anytime."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Cancel your subscription anytime with no questions asked. No lock-in contracts."
  }
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const headerRef = useRef(null)
  const faqsRef = useRef(null)
  
  const headerInView = useInView(headerRef, { once: true, amount: 0.3 })
  const faqsInView = useInView(faqsRef, { once: true, amount: 0.2 })

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative overflow-hidden">
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
        <motion.div
          className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          whileHover={{ scale: 1.05 }}
        >
          <HelpCircle size={16} className="text-primary" />
          <span className="text-sm text-primary font-medium">Got Questions?</span>
        </motion.div>

        <motion.h2
          className="text-4xl sm:text-5xl font-bold mb-4 gradient-green-text font-display"
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Frequently Asked Questions
        </motion.h2>
        
        <motion.p
          className="text-gray-400 text-base"
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Everything you need to know about QueryIQ
        </motion.p>
      </motion.div>

      {/* FAQ Items */}
      <div ref={faqsRef} className="space-y-4 relative z-10">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          const isHovered = hoveredIndex === index
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={faqsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative"
            >
              {/* Subtle glow on hover */}
              <motion.div
                className="absolute -inset-0.5 bg-primary/10 rounded-2xl blur opacity-0"
                animate={{
                  opacity: isHovered || isOpen ? 0.5 : 0,
                }}
                transition={{ duration: 0.3 }}
              />

              {/* Card */}
              <motion.div
                className="relative backdrop-blur-xl bg-card/30 rounded-2xl overflow-hidden"
                style={{
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
                animate={{
                  borderColor: isOpen 
                    ? 'rgb(163, 230, 53)' 
                    : isHovered 
                    ? 'rgb(163, 230, 53)' 
                    : 'var(--border)',
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Question button */}
                <motion.button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full p-6 flex justify-between items-center gap-4 text-left"
                  whileTap={{ scale: 0.99 }}
                >
                  <span className="text-lg font-semibold text-white pr-4">
                    {faq.question}
                  </span>
                  
                  <motion.div
                    animate={{
                      rotate: isOpen ? 180 : 0,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="shrink-0"
                  >
                    <ChevronDown size={20} className="text-primary" />
                  </motion.div>
                </motion.button>

                {/* Answer with AnimatePresence for smooth height transition */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ 
                        height: "auto", 
                        opacity: 1,
                      }}
                      exit={{ 
                        height: 0, 
                        opacity: 0,
                      }}
                      transition={{ 
                        duration: 0.3,
                        ease: "easeInOut",
                      }}
                      className="overflow-hidden"
                    >
                      <motion.div
                        initial={{ y: -10 }}
                        animate={{ y: 0 }}
                        exit={{ y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="px-6 pb-6 border-t border-border"
                      >
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, delay: 0.1 }}
                          className="text-gray-400 leading-relaxed pt-4"
                        >
                          {faq.answer}
                        </motion.p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isOpen ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ transformOrigin: 'left' }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}