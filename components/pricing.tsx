import { useState, useRef } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { motion, useInView } from 'motion/react'

const pricingTiers = [
  {
    name: "Starter",
    description: "Perfect for exploring QueryIQ",
    price: "Free",
    yearlyPrice: "Free",
    features: [
      "Up to 100 queries per month",
      "Single database connection",
      "Basic visualizations",
      "Community support",
      "14-day trial included"
    ]
  },
  {
    name: "Professional",
    description: "For growing teams and projects",
    price: 49,
    yearlyPrice: 39,
    period: "/month",
    features: [
      "Unlimited queries",
      "5 database connections",
      "Advanced visualizations & exports",
      "Priority email support",
      "Custom dashboards",
      "Team collaboration",
      "SSO authentication"
    ],
    highlighted: true
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: "Custom",
    yearlyPrice: "Custom",
    features: [
      "Unlimited everything",
      "Unlimited databases",
      "Dedicated account manager",
      "24/7 phone & email support",
      "Custom integrations",
      "Advanced security & compliance",
      "SLA guarantees",
      "On-premise deployment"
    ]
  }
]

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<null|number>(null)
  const headerRef = useRef(null)
  const cardsRef = useRef(null)
  
  const headerInView = useInView(headerRef, { once: true, amount: 0.3 })
  const cardsInView = useInView(cardsRef, { once: true, amount: 0.2 })

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
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
          Simple, Transparent Pricing
        </motion.h2>
        <motion.p
          className="text-gray-400 text-base mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Choose the perfect plan for your team. All plans include a 14-day free trial. No credit card required to get started.
        </motion.p>
        
        {/* Toggle Switch */}
        <motion.div
          className="flex items-center justify-center gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <span className={`text-sm transition-colors duration-300 ${!isYearly ? 'text-white font-semibold' : 'text-gray-400'}`}>
            Monthly
          </span>
          <motion.button
            onClick={() => setIsYearly(!isYearly)}
            className="relative inline-flex h-8 w-14 items-center rounded-full bg-border transition-colors duration-300"
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              className="inline-block h-6 w-6 rounded-full bg-primary shadow-lg"
              animate={{
                x: isYearly ? 28 : 4,
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30
              }}
            />
          </motion.button>
          <span className={`text-sm transition-colors duration-300 ${isYearly ? 'text-white font-semibold' : 'text-gray-400'}`}>
            Yearly 
            <motion.span 
              className="text-primary font-semibold text-xs ml-1"
              animate={{ scale: isYearly ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              Save 20%
            </motion.span>
          </span>
        </motion.div>
      </motion.div>

      {/* Pricing Cards */}
      <div ref={cardsRef} className="grid md:grid-cols-3 gap-8 relative z-10">
        {pricingTiers.map((tier, index) => {
          const isHovered = hoveredCard === index
          const displayPrice = isYearly ? tier.yearlyPrice : tier.price
          
          return (
            <motion.div
              key={index}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              initial={{ opacity: 0, y: 40 }}
              animate={cardsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                ease: "easeOut" 
              }}
              whileHover={{ y: -8 }}
              className="relative"
            >
              {/* Most Popular Badge */}
              {tier.highlighted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={cardsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="absolute -top-4 left-1/2 -translate-x-1/2 z-10"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-black text-xs font-bold shadow-lg">
                    <Sparkles size={12} />
                    Most Popular
                  </div>
                </motion.div>
              )}

              {/* Glow effect for highlighted card */}
              {tier.highlighted && (
                <motion.div
                  className="absolute -inset-1 bg-primary/20 rounded-2xl blur opacity-0"
                  animate={{
                    opacity: isHovered ? 1 : 0.5,
                  }}
                  transition={{ duration: 0.3 }}
                />
              )}

              {/* Card */}
              <motion.div
                className={`relative h-full backdrop-blur-xl rounded-2xl p-8 transition-all duration-300 ${
                  tier.highlighted 
                    ? 'bg-card/40 border-2 border-primary' 
                    : 'bg-card/30 border border-border'
                }`}
                animate={{
                  borderColor: tier.highlighted 
                    ? 'rgb(163, 230, 53)' 
                    : isHovered ? 'rgb(163, 230, 53)' : 'var(--border)',
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-1">{tier.name}</h3>
                  <p className="text-gray-400 text-xs">{tier.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <motion.span
                    key={displayPrice}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-4xl font-bold text-white inline-block"
                  >
                    {typeof displayPrice === 'number' ? `$${displayPrice}` : displayPrice}
                  </motion.span>
                  {tier.period && (
                    <span className="text-gray-400 text-xs ml-2">
                      {tier.period} {isYearly ? 'billed annually' : 'billed monthly'}
                    </span>
                  )}
                </div>

                {/* CTA Button */}
                <motion.button
                  className={`w-full py-3 rounded-lg font-semibold mb-8 text-sm transition-all duration-300 ${
                    tier.highlighted
                      ? 'gradient-green-button glow-green'
                      : 'border border-primary/50 text-primary hover:bg-primary/10'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Get Started Free
                </motion.button>

                {/* Features List */}
                <div className="space-y-3">
                  {tier.features.map((feature, featureIndex) => (
                    <motion.div
                      key={featureIndex}
                      initial={{ opacity: 0, x: -10 }}
                      animate={cardsInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: index * 0.1 + 0.3 + featureIndex * 0.05 
                      }}
                      className="flex items-start gap-3 group/feature"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={cardsInView ? { scale: 1 } : { scale: 0 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: index * 0.1 + 0.3 + featureIndex * 0.05,
                          type: "spring",
                          stiffness: 200
                        }}
                      >
                        <Check className="text-primary shrink-0 mt-0.5" size={16} />
                      </motion.div>
                      <span className="text-gray-300 text-sm group-hover/feature:text-white transition-colors duration-200">
                        {feature}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {/* Footer Note */}
      <motion.p
        className="text-center text-gray-500 mt-12 text-xs"
        initial={{ opacity: 0 }}
        animate={cardsInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        Enterprise customers receive volume discounts and custom SLA agreements
      </motion.p>
    </section>
  )
}