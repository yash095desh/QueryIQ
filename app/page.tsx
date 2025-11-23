'use client'

import { useState } from 'react'
import Header from '@/components/header'
import Hero from '@/components/hero'
import HeroFeatures from '@/components/hero-features'
import Features from '@/components/features'
import HowItWorks from '@/components/how-it-works'
import UseCases from '@/components/use-cases'
import Pricing from '@/components/pricing'
import Testimonials from '@/components/testimonials'
import FAQ from '@/components/faq'
import FinalCTA from '@/components/final-cta'
import Footer from '@/components/footer'

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <HeroFeatures />
      <Features />
      <HowItWorks />
      <UseCases />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}
