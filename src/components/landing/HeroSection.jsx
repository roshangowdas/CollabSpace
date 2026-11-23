import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Layers,
  CheckCircle2,
  Users
} from 'lucide-react'
import { Button, Badge } from '@/components/ui'

export function HeroSection() {
  const handleScrollToFeatures = (e) => {
    e.preventDefault()
    const element = document.querySelector('#features')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
      {/* Background ambient lighting effects inspired by high-end dark SaaS aesthetics */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none opacity-40 dark:opacity-20 blur-3xl -z-10 bg-gradient-to-b from-brand/30 via-brand/10 to-transparent" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-brand/20 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          {/* Release Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3.5 py-1 text-xs font-medium text-foreground backdrop-blur shadow-subtle max-w-full justify-center">
              <span className="flex h-2 w-2 rounded-full bg-brand animate-pulse shrink-0" />
              <span className="font-semibold text-brand shrink-0">CollabSpace 2.0</span>
              <span className="text-muted-foreground hidden xs:inline">•</span>
              <span className="text-muted-foreground truncate hidden xs:inline">The Real-Time Team Operating System</span>
            </div>
          </motion.div>

          {/* Headline (exact text requested) */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08]"
          >
            Everything Your Team Needs.{' '}
            <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
              One Shared Space.
            </span>
          </motion.h1>

          {/* Short product description */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed"
          >
            Consolidate your fragmented stack. CollabSpace combines sprint Kanban boards,
            real-time team channels, live collaborative docs, and enterprise role permissions into one high-velocity workspace.
          </motion.p>

          {/* Buttons: Get Started and Explore Features */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="flex flex-wrap items-center justify-center gap-3.5 pt-2"
          >
            <Link to="/register">
              <Button size="lg" variant="brand" rightIcon={ArrowRight} className="shadow-subtle">
                Get Started Free
              </Button>
            </Link>

            <a href="#features" onClick={handleScrollToFeatures}>
              <Button size="lg" variant="outline" className="shadow-subtle">
                Explore Features
              </Button>
            </a>
          </motion.div>

          {/* Value tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-muted-foreground"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Free 14-day team trial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Postgres RLS Security</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

