import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Check, ArrowRight, Mic, FileText, Shield, Sparkles, Clock, Headphones, Workflow } from "lucide-react";
import { useAuth } from "@/hooks/useAuth0";
import { useTranslation } from 'react-i18next';

// --- Brand ---
const Logo = ({ className = "h-8 w-auto" }) => {
  const [imgOk, setImgOk] = React.useState(true);
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {imgOk ? (
        <img
          src="/brand/arinote_full_256px.png"
          alt="Arinote"
          className="h-8 w-8 rounded-xl object-contain"
          onError={() => setImgOk(false)}
        />
      ) : (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--brand-from)] to-[var(--brand-to)]" />
      )}
      <span className="font-semibold tracking-tight text-xl">Arinote</span>
    </div>
  );
};

const container = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function LandingNew() {
  const { loginWithRedirect, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      window.location.href = "/";
    } else {
      loginWithRedirect();
    }
  };

  const handleSignIn = () => {
    if (isAuthenticated) {
      window.location.href = "/";
    } else {
      loginWithRedirect();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--brand-50)] via-white to-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/50 border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Logo />

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="hover:text-[color:var(--brand-700)] transition">{t('landing.hero.features')}</a>
            <a href="#how" className="hover:text-[color:var(--brand-700)] transition">{t('landing.hero.howItWorks')}</a>
            <a href="#pricing" className="hover:text-[color:var(--brand-700)] transition">{t('landing.hero.pricing')}</a>
            <a href="#faq" className="hover:text-[color:var(--brand-700)] transition">{t('landing.hero.faq')}</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden md:inline-flex" onClick={handleSignIn}>
              {isAuthenticated ? t('nav.dashboard') : t('auth.signIn')}
            </Button>
            <Button className="bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] text-white shadow-sm hover:opacity-95" onClick={handleGetStarted}>
              {isAuthenticated ? 'Go to App' : t('landing.hero.cta.getStarted')}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 [mask-image:radial-gradient(60%_60%_at_50%_20%,#000_40%,transparent_100%)]">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[560px] w-[1200px] bg-[color:var(--brand-100)]/40 blur-3xl rounded-full" />
          <div className="absolute top-16 left-1/3 h-72 w-72 bg-[color:var(--brand-200)]/40 blur-3xl rounded-full" />
        </div>
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 md:pt-24 md:pb-16">
          <motion.div variants={container} initial="hidden" animate="show" className="grid md:grid-cols-2 gap-10 items-center">
            <div className="text-center md:text-left">
              <Badge className="mb-4 bg-[color:var(--brand-100)] text-[color:var(--brand-700)] border-[color:var(--brand-200)]">Built for medical professionals</Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                {t('landing.hero.title')}
              </h1>
              <p className="mt-4 text-slate-600 text-lg md:text-xl">
                {t('landing.hero.subtitle')}
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
                <Button size="lg" className="h-12 px-6 bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] hover:opacity-95" onClick={handleGetStarted}>
                  {t('landing.hero.cta.tryFree')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-6">
                  {t('landing.hero.cta.watchDemo')}
                </Button>
              </div>

              <div className="mt-6 flex items-center justify-center md:justify-start gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2"><Shield className="h-4 w-4" /> HIPAA compliant</div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Save 5+ min/note</div>
              </div>
            </div>

            {/* Mockup */}
            <motion.div className="relative">
              <div className="absolute -inset-6 -z-10 bg-gradient-to-tr from-[color:var(--brand-100)]/40 to-[color:var(--brand-200)]/40 rounded-[2rem] blur-2xl" />
              <Card className="rounded-2xl shadow-xl border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-[color:var(--brand-700)]" />
                    Live Medical Dictation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    <p className="mb-2">
                      <span className="font-medium text-slate-900">You:</span> 
                      "65-year-old male presents with chest pain, radiating to left arm, associated with diaphoresis and nausea..."
                    </p>
                    <p className="mb-2">
                      <span className="font-medium text-[color:var(--brand-700)]">Arinote:</span> 
                      <em>Generating structured SOAP note with cardiac assessment templates.</em>
                    </p>
                    <div className="mt-3 grid md:grid-cols-2 gap-3">
                      <Card className="border-slate-200">
                        <CardHeader className="py-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4 text-[color:var(--brand-700)]"/>
                            {t('medical.soap')} {t('notes.title')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-slate-600 space-y-1">
                          <p><span className="font-medium">S:</span> 65M c/o chest pain x 2h, 8/10, crushing, radiates L arm...</p>
                          <p><span className="font-medium">O:</span> VS: BP 165/95, HR 88, O2 95%. Diaphoretic, no JVD...</p>
                          <p><span className="font-medium">A:</span> Acute chest pain, r/o MI, unstable angina...</p>
                          <p><span className="font-medium">P:</span> EKG, troponins, CXR. Aspirin 325mg, monitor...</p>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-200">
                        <CardHeader className="py-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Workflow className="h-4 w-4 text-[color:var(--brand-700)]"/>
                            Smart Templates
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-slate-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">.chest-pain</Badge> 
                            <span>Cardiac workup template</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">.admit-orders</Badge> 
                            <span>Standard admission orders</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">.discharge</Badge> 
                            <span>Discharge summary template</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Social proof */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:py-16">
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-80">
          {[
            "Mayo Clinic",
            "Johns Hopkins",
            "Cleveland Clinic", 
            "Mass General",
            "UCSF Medical"
          ].map((n) => (
            <span key={n} className="text-slate-500 text-sm md:text-base">{n}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-10 md:py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Less documentation. More patient care.</h2>
          <p className="mt-3 text-slate-600">Purpose-built for healthcare professionals. Fast, accurate, and seamlessly integrated.</p>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Mic className="h-5 w-5" />, 
              title: "AI-Powered Dictation", 
              desc: "Advanced speech recognition trained on medical terminology with 99%+ accuracy."
            },
            {
              icon: <Sparkles className="h-5 w-5" />, 
              title: "Smart Templates", 
              desc: "Intelligent templates that adapt to your specialty and documentation style."
            },
            {
              icon: <FileText className="h-5 w-5" />, 
              title: "Structured Notes", 
              desc: "Perfect SOAP notes, H&Ps, and discharge summaries every time."
            },
            {
              icon: <Shield className="h-5 w-5" />, 
              title: "HIPAA Compliant", 
              desc: "Enterprise-grade security with end-to-end encryption and audit trails."
            },
            {
              icon: <Clock className="h-5 w-5" />, 
              title: "Time Saving", 
              desc: "Reduce documentation time by 60% while improving note quality."
            },
            {
              icon: <Headphones className="h-5 w-5" />, 
              title: "24/7 Support", 
              desc: "Dedicated support team that understands healthcare workflows."
            },
          ].map((f) => (
            <Card key={f.title} className="rounded-2xl border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[color:var(--brand-100)] to-[color:var(--brand-200)] flex items-center justify-center text-[color:var(--brand-700)]">
                  {f.icon}
                </div>
                <CardTitle className="mt-3 text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600 text-sm">{f.desc}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-10 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">Integrates with your workflow</h3>
            <p className="mt-3 text-slate-600">
              Open Arinote, press record, and speak naturally. Use smart phrases to expand sections, 
              then export directly to your EHR or copy-paste formatted notes.
            </p>

            <ul className="mt-6 space-y-3 text-slate-700">
              {[
                "Hold Alt key to start instant dictation",
                "Use medical templates like .chest-pain or .neuro-exam",
                "Export to Epic, Cerner, or any EHR system",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[color:var(--brand-700)]" /> {t}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex gap-2">
              <Input placeholder="Your email" className="h-11" />
              <Button className="h-11 bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] hover:opacity-95">
                Get Early Access
              </Button>
            </div>
          </div>

          <Card className="rounded-2xl border-slate-200 shadow-xl">
            <CardHeader>
              <CardTitle>3-step workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="grid sm:grid-cols-3 gap-3 text-sm">
                {[
                  { step: "1", label: "Dictate", desc: "Speak naturally while examining—AI transcribes medical terminology perfectly." },
                  { step: "2", label: "Structure", desc: "Smart templates organize content into proper medical note format." },
                  { step: "3", label: "Export", desc: "One-click export to your EHR with perfect formatting." },
                ].map((s) => (
                  <li key={s.step} className="p-4 rounded-xl border bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-[color:var(--brand-700)] text-white text-xs flex items-center justify-center">
                        {s.step}
                      </span>
                      <span className="font-medium">{s.label}</span>
                    </div>
                    <p className="mt-2 text-slate-600">{s.desc}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 py-10 md:py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-bold tracking-tight">Simple, healthcare-focused pricing</h3>
          <p className="mt-3 text-slate-600">Start free. Scale as your practice grows.</p>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Student/Resident", 
              price: "$0", 
              blurb: "For medical students and residents.", 
              features: ["Basic dictation", "Standard templates", "Email support"], 
              cta: "Start free"
            },
            { 
              name: "Physician", 
              price: "$29/mo", 
              blurb: "For practicing physicians.", 
              features: ["Advanced AI dictation", "Custom templates", "EHR integration", "Priority support"], 
              cta: "Start 14-day trial", 
              highlight: true 
            },
            { 
              name: "Practice/Hospital", 
              price: "Custom", 
              blurb: "For healthcare organizations.", 
              features: ["Team management", "Custom workflows", "Analytics dashboard", "Dedicated support"], 
              cta: "Contact sales" 
            },
          ].map((tier) => (
            <Card key={tier.name} className={`rounded-2xl border-slate-200 ${tier.highlight ? "ring-2 ring-[color:var(--brand-600)] scale-105" : ""}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{tier.name}</span>
                  {tier.highlight && (
                    <Badge className="bg-[color:var(--brand-100)] text-[color:var(--brand-700)] border-[color:var(--brand-200)]">Most Popular</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{tier.price}</div>
                <p className="text-slate-600 mt-1">{tier.blurb}</p>
                <ul className="mt-6 space-y-2 text-sm">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[color:var(--brand-700)]" /> {f}
                    </li>
                  ))}
                </ul>
                <Button 
                  className="mt-6 w-full bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] hover:opacity-95"
                  onClick={tier.cta === "Start free" || tier.cta === "Start 14-day trial" ? handleGetStarted : undefined}
                >
                  {tier.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              quote: "Arinote has revolutionized my documentation workflow. I save hours every day and my notes are more comprehensive than ever.",
              author: "Dr. Sarah Chen, Emergency Medicine"
            },
            {
              quote: "The medical AI is incredibly accurate. It understands complex terminology that other dictation tools miss completely.",
              author: "Dr. Michael Rodriguez, Cardiology"
            },
            {
              quote: "Finally, a dictation tool built specifically for healthcare. The templates are spot-on for our specialty.",
              author: "Dr. Emily Watson, Internal Medicine"
            },
          ].map((t) => (
            <Card key={t.quote} className="rounded-2xl border-slate-200">
              <CardContent className="pt-6 text-slate-700">
                <p className="text-lg">"{t.quote}"</p>
                <p className="mt-4 text-sm text-slate-500">{t.author}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-4xl px-4 py-10 md:py-20">
        <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-center">Frequently asked questions</h3>
        <Accordion type="single" collapsible className="mt-6">
          {[
            {
              q: "Is Arinote HIPAA compliant?",
              a: "Yes, Arinote is fully HIPAA compliant with end-to-end encryption, secure data handling, and comprehensive audit trails. We follow all healthcare data protection standards."
            },
            {
              q: "Does it integrate with my EHR system?",
              a: "Arinote works with all major EHR systems including Epic, Cerner, AllScripts, and more. You can copy-paste formatted notes or use our direct integration features where available."
            },
            {
              q: "How accurate is the medical dictation?",
              a: "Our AI is specifically trained on medical terminology and achieves 99%+ accuracy on medical speech. It understands complex medical terms, drug names, and clinical language."
            },
            {
              q: "Can I customize templates for my specialty?",
              a: "Absolutely. Arinote includes specialty-specific templates and allows you to create custom templates tailored to your practice and documentation needs."
            },
          ].map((i, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`}>
              <AccordionTrigger className="text-left">{i.q}</AccordionTrigger>
              <AccordionContent>{i.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Call to action */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] text-white p-10 md:p-12">
          <div className="absolute inset-0 opacity-20 [mask-image:radial-gradient(70%_70%_at_30%_30%,#000,transparent)]">
            <div className="absolute -top-16 -right-16 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
          </div>
          <div className="relative grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h4 className="text-2xl md:text-3xl font-semibold">Document less. Care more.</h4>
              <p className="mt-2 text-white/90">
                Join thousands of healthcare professionals using Arinote to improve documentation efficiency and patient care quality.
              </p>
            </div>
            <div className="flex gap-3 md:justify-end">
              <Button variant="secondary" className="h-11 px-6">Schedule demo</Button>
              <Button 
                className="h-11 px-6 bg-white text-slate-900 hover:bg-slate-100" 
                onClick={handleGetStarted}
              >
                Start free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-10 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <Logo className="h-7" />
            <p className="mt-3 text-slate-600">Transforming medical documentation with AI-powered precision.</p>
          </div>
          <div>
            <div className="font-medium mb-3">Product</div>
            <ul className="space-y-2 text-slate-600">
              <li><a className="hover:text-[color:var(--brand-700)]" href="#features">Features</a></li>
              <li><a className="hover:text-[color:var(--brand-700)]" href="#pricing">Pricing</a></li>
              <li><a className="hover:text-[color:var(--brand-700)]" href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-3">Company</div>
            <ul className="space-y-2 text-slate-600">
              <li><a className="hover:text-[color:var(--brand-700)]" href="#">About</a></li>
              <li><a className="hover:text-[color:var(--brand-700)]" href="#">Security</a></li>
              <li><a className="hover:text-[color:var(--brand-700)]" href="#">Privacy</a></li>
              <li><a className="hover:text-[color:var(--brand-700)]" href="#">Contact</a></li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-3">Stay updated</div>
            <p className="text-slate-600 mb-3">Get product updates and healthcare insights.</p>
            <div className="flex gap-2">
              <Input placeholder="Email address" className="text-xs" />
              <Button className="bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] hover:opacity-95">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        <div className="border-t py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Arinote. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
