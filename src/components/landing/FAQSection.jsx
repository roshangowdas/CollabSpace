import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'

const FAQS = [
  {
    question: 'What is CollabSpace?',
    answer:
      'CollabSpace is a unified team collaboration SaaS platform that integrates sprint Kanban tracking, real-time channels and direct messaging, live collaborative documentation, and enterprise role permissions into one high-velocity shared workspace.',
  },
  {
    question: 'How does real-time synchronization work?',
    answer:
      'CollabSpace utilizes Supabase Realtime WebSocket channels to broadcast state changes across all connected clients in under 50 milliseconds. When a teammate moves a card, sends a message, or edits a document, your UI updates instantaneously.',
  },
  {
    question: 'How is data isolated between different workspaces?',
    answer:
      'Security is enforced at the database layer using PostgreSQL Row Level Security (RLS) policies. Every application table validates workspace membership before returning any row, guaranteeing complete multi-tenant privacy.',
  },
  {
    question: 'Can I invite external guests or contractors?',
    answer:
      'Yes. Workspace administrators can assign the "Viewer" or "Guest" role to collaborators, giving them access strictly to assigned channels and project boards without granting administrative rights.',
  },
  {
    question: 'Can I export our team’s project data?',
    answer:
      'Absolutely. CollabSpace supports full data ownership. You can export issues, boards, channel archives, and documentation in standard JSON and Markdown formats at any time.',
  },
  {
    question: 'Is there a free tier for developers and small teams?',
    answer:
      'Yes! The Starter Plan is free forever for teams up to 5 members, including unlimited public channels, 3 active sprint boards, and full real-time WebSocket sync capabilities.',
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="faq" className="py-20 md:py-28 border-t bg-muted/20 scroll-mt-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-semibold text-brand">
            <HelpCircle className="h-3.5 w-3.5" />
            Frequently Asked Questions
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Got Questions? We Have Answers.
          </h2>

          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Everything you need to know about CollabSpace architecture, security, and team management.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <Card
                key={faq.question}
                className={`border transition-colors ${
                  isOpen ? 'border-brand/40 bg-card shadow-subtle' : 'border-border/80 bg-card/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm sm:text-base font-semibold text-foreground focus:outline-none cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-brand' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 mt-1 pt-3">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

