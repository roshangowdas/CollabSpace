import React from 'react'
import {
  LandingNavbar,
  HeroSection,
  ProductDashboardPreview,
  FeatureOverview,
  HowItWorks,
  CollaborationBenefits,
  PricingSection,
  FAQSection,
  LandingFooter
} from '@/components/landing'

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-brand/20 selection:text-brand">
      {/* 1. Navbar with logo and navigation */}
      <LandingNavbar />

      <main className="flex-1">
        {/* 2, 3, 4. Hero Section with headline, description, Get Started & Explore Features */}
        <HeroSection />

        {/* 5. Product dashboard preview (Interactive Huly-inspired preview) */}
        <ProductDashboardPreview />

        {/* 6. Feature overview */}
        <FeatureOverview />

        {/* 7. How It Works */}
        <HowItWorks />

        {/* 8. Collaboration benefits */}
        <CollaborationBenefits />

        {/* 9. Pricing section with clearly labelled sample plans */}
        <PricingSection />

        {/* 10. FAQ section */}
        <FAQSection />
      </main>

      {/* 11. Footer */}
      <LandingFooter />
    </div>
  )
}

export default HomePage
