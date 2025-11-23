import { Star, Quote } from 'lucide-react'
import { motion, useInView } from 'motion/react'
import { useRef, useState } from 'react'

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Senior Data Analyst",
    company: "TechCorp Analytics",
    quote: "QueryIQ cut my report generation time from 3 hours to 15 minutes. I can now focus on insights instead of writing queries. It's genuinely transformed how our entire analytics team works.",
    rating: 5,
    avatar: "SC"
  },
  {
    name: "Marcus Rodriguez",
    role: "Backend Engineer",
    company: "StartupXYZ",
    quote: "Finally, non-technical team members can query our database without bugging us developers. I've saved hours of explaining SQL. It's a lifesaver for cross-functional collaboration.",
    rating: 5,
    avatar: "MR"
  },
  {
    name: "Emily Watson",
    role: "Product Manager",
    company: "DataFlow Inc",
    quote: "The insights QueryIQ generates have directly improved our decision-making process. We can now answer business questions instantly without waiting for our engineering team.",
    rating: 5,
    avatar: "EW"
  },
  {
    name: "David Kim",
    role: "CTO",
    company: "CloudScale",
    quote: "We've democratized data access across our entire organization. QueryIQ pays for itself in the first week by reducing our data team's workload by 60%.",
    rating: 5,
    avatar: "DK"
  },
  {
    name: "Lisa Martinez",
    role: "Business Intelligence Lead",
    company: "RetailPro",
    quote: "The natural language interface is incredible. Our executives can now get answers to complex business questions without any technical knowledge.",
    rating: 5,
    avatar: "LM"
  },
  {
    name: "James Thompson",
    role: "Data Engineer",
    company: "FinTech Solutions",
    quote: "QueryIQ's query optimization has improved our database performance significantly. It's like having an expert DBA on the team 24/7.",
    rating: 5,
    avatar: "JT"
  }
]

export default function Testimonials() {
  const [isPaused, setIsPaused] = useState(false)
  const headerRef = useRef(null)
  const marqueeRef = useRef(null)
  
  const headerInView = useInView(headerRef, { once: true, amount: 0.3 })
  const marqueeInView = useInView(marqueeRef, { once: true, amount: 0.2 })

  // Duplicate testimonials for seamless loop
  const duplicatedTestimonials = [...testimonials, ...testimonials]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto relative overflow-hidden">
      {/* Background orb */}
      <motion.div
        className="absolute top-1/2 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
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
          Loved by Data Teams Worldwide
        </motion.h2>
        <motion.p
          className="text-gray-400 text-base max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          See how leading companies are transforming their data workflows with QueryIQ
        </motion.p>
      </motion.div>

      {/* Marquee Container */}
      <div 
        ref={marqueeRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Scrolling testimonials */}
        <motion.div
          className="flex gap-6"
          animate={{
            x: marqueeInView ? [0, -1 * (400 + 24) * testimonials.length] : 0,
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 40,
              ease: "linear",
            },
          }}
          style={{
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {duplicatedTestimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="flex-shrink-0 w-[400px]"
              initial={{ opacity: 0, y: 20 }}
              animate={marqueeInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: (index % testimonials.length) * 0.1 }}
            >
              <motion.div
                className="h-full backdrop-blur-xl bg-card/30 border border-border rounded-2xl p-8 relative overflow-hidden group cursor-pointer"
                whileHover={{ 
                  y: -4,
                  borderColor: 'rgb(163, 230, 53)',
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Quote icon */}
                <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                  <Quote size={48} className="text-primary" />
                </div>

                {/* Rating stars */}
                <div className="flex gap-1 mb-4 relative z-10">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={marqueeInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: (index % testimonials.length) * 0.1 + i * 0.05,
                        type: "spring",
                        stiffness: 200
                      }}
                    >
                      <Star size={16} className="fill-primary text-primary" />
                    </motion.div>
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-300 mb-6 text-sm leading-relaxed relative z-10 min-h-[120px]">
                  "{testimonial.quote}"
                </p>

                {/* Author info */}
                <div className="border-t border-border pt-4 flex items-center gap-4 relative z-10">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">
                      {testimonial.avatar}
                    </span>
                  </div>
                  
                  {/* Details */}
                  <div>
                    <p className="font-semibold text-white text-sm">{testimonial.name}</p>
                    <p className="text-xs text-gray-400">{testimonial.role}</p>
                    <p className="text-xs text-primary font-medium">{testimonial.company}</p>
                  </div>
                </div>

                {/* Hover accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ transformOrigin: 'left' }}
                  />
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Pause hint */}
      <motion.p
        className="text-center text-gray-500 mt-8 text-xs"
        initial={{ opacity: 0 }}
        animate={marqueeInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        Hover to pause • Trusted by 10,000+ data teams worldwide
      </motion.p>
    </section>
  )
}