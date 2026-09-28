"use client"

import * as React from "react"
import Link from "next/link"
import { 
  ArrowRight, ArrowLeft, Users, Shield, Globe2, Zap,
  CheckCircle, Mic, FileText, Layers, Lock, Mail, Phone,
  CheckSquare, MessageSquare, ArrowUpRight
} from "lucide-react"
import { useLanguage } from "@/lib/i18n/context"
import { siteStats } from "@/config/site-stats"

export default function Home() {
  const { dict, locale, toggleLocale } = useLanguage()
  const isArabic = locale === "ar"
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight

  return (
    <div className="flex flex-col">

      {/* ─── 1. HERO SECTION ─── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-background section-pattern py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Hero Main Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-start animate-fade-in">
              
              {/* Trust Badge + Mobile Language Switcher */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border border-primary/25 bg-primary/8 text-primary shadow-xs">
                  <Zap className="w-3.5 h-3.5 fill-primary text-primary shrink-0" />
                  <span>{dict.home.badge}</span>
                </div>

                {/* Mobile Quick Language Toggle */}
                <button
                  onClick={toggleLocale}
                  className="sm:hidden min-h-[36px] inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border border-border bg-card text-foreground/80 hover:bg-muted transition-all"
                  aria-label={dict.common.switchLanguage}
                >
                  <Globe2 className="w-3.5 h-3.5 text-primary" />
                  <span>{dict.home.quickSwitch}</span>
                </button>
              </div>

              {/* Main Headline */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-foreground">
                  <span className="block text-foreground">{dict.home.titlePart1}</span>
                  <span className="block text-primary">{dict.home.titlePart2}</span>
                </h1>
                <p className="text-base sm:text-lg text-foreground/75 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal pt-1">
                  {dict.home.subtitle}
                </p>
              </div>

              {/* Action Buttons (Only 2 buttons with min 44px touch target) */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
                <Link 
                  href="/register" 
                  className="btn-primary min-h-[48px] px-8 text-base shadow-sm"
                >
                  <span>{dict.home.ctaJoin}</span>
                  <ArrowIcon className="w-4 h-4 shrink-0" />
                </Link>
                <Link 
                  href="/projects" 
                  className="btn-secondary min-h-[48px] px-7 text-base hover:border-primary/40"
                >
                  <span>{dict.home.ctaBrowse}</span>
                </Link>
              </div>

              {/* Verified Trust Pillars */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 pt-3 text-xs sm:text-sm font-semibold text-foreground/70">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success shrink-0" />
                  <span>{dict.home.trustPillars.qc}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary shrink-0" />
                  <span>{dict.home.trustPillars.security}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-primary shrink-0" />
                  <span>{dict.home.trustPillars.languages}</span>
                </div>
              </div>
            </div>

            {/* Hero Side Highlight Card */}
            <div className="lg:col-span-5 hidden lg:block animate-slide-up">
              <div className="glass p-7 rounded-3xl border border-border shadow-md space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-border/70">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                      Operations & Quality
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                    Production Active
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-muted/60 border border-border/60">
                    <p className="text-xs font-semibold text-foreground/60 mb-1">
                      {dict.home.stats.experts}
                    </p>
                    <p className="text-3xl font-black text-foreground">
                      {siteStats.expertsCount}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-background border border-border">
                      <p className="text-xs text-foreground/60 mb-0.5">Languages</p>
                      <p className="text-xl font-black text-primary">{siteStats.languagesCount}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-background border border-border">
                      <p className="text-xs text-foreground/60 mb-0.5">Delivered</p>
                      <p className="text-xl font-black text-foreground">{siteStats.projectsDelivered}</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-success/8 border border-success/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-success">Audio Standard</p>
                      <p className="text-xs text-foreground/70">{siteStats.audioFormats}</p>
                    </div>
                    <CheckSquare className="w-5 h-5 text-success" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ─── 2. NUMBERS & IMPACT STATS ─── */}
      <section className="py-12 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            <div className="p-5 rounded-2xl bg-background border border-border card-hover text-center sm:text-start">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto sm:mx-0 mb-3">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-1">
                {siteStats.expertsCount}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-foreground/70 leading-snug">
                {dict.home.stats.experts}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-background border border-border card-hover text-center sm:text-start">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto sm:mx-0 mb-3">
                <Globe2 className="w-5 h-5" />
              </div>
              <p className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-1">
                {siteStats.languagesCount}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-foreground/70 leading-snug">
                {dict.home.stats.languages}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-background border border-border card-hover text-center sm:text-start">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto sm:mx-0 mb-3">
                <CheckCircle className="w-5 h-5" />
              </div>
              <p className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-1">
                {siteStats.projectsDelivered}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-foreground/70 leading-snug">
                {dict.home.stats.projects}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-background border border-border card-hover text-center sm:text-start">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto sm:mx-0 mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <p className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-1">
                {siteStats.qcStagesCount} Stages
              </p>
              <p className="text-xs sm:text-sm font-semibold text-foreground/70 leading-snug">
                {dict.home.stats.qcStages}
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* ─── 3. CORE SERVICES ─── */}
      <section className="py-16 sm:py-20 bg-background" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
              {dict.home.services.sectionTitle}
            </h2>
            <p className="text-sm sm:text-base text-foreground/70">
              {dict.home.services.sectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Service 1: Audio Collection */}
            <div className="glass p-6 sm:p-7 rounded-2xl border border-border card-hover space-y-3 text-start">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                {dict.home.services.audioTitle}
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {dict.home.services.audioDesc}
              </p>
            </div>

            {/* Service 2: Transcription */}
            <div className="glass p-6 sm:p-7 rounded-2xl border border-border card-hover space-y-3 text-start">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                {dict.home.services.transcriptionTitle}
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {dict.home.services.transcriptionDesc}
              </p>
            </div>

            {/* Service 3: Annotation */}
            <div className="glass p-6 sm:p-7 rounded-2xl border border-border card-hover space-y-3 text-start">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                {dict.home.services.annotationTitle}
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {dict.home.services.annotationDesc}
              </p>
            </div>

            {/* Service 4: Custom Datasets */}
            <div className="glass p-6 sm:p-7 rounded-2xl border border-border card-hover space-y-3 text-start">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                {dict.home.services.customDataTitle}
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {dict.home.services.customDataDesc}
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* ─── 4. HOW IT WORKS / START IN 3 STEPS ─── */}
      <section className="py-16 sm:py-20 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
              {dict.home.steps.sectionTitle}
            </h2>
            <p className="text-sm sm:text-base text-foreground/70">
              {dict.home.steps.sectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-background border border-border card-hover space-y-3 relative text-start">
              <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-black text-sm flex items-center justify-center mb-2">
                1
              </span>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                {dict.home.steps.step1Title}
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {dict.home.steps.step1Desc}
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-background border border-border card-hover space-y-3 relative text-start">
              <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-black text-sm flex items-center justify-center mb-2">
                2
              </span>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                {dict.home.steps.step2Title}
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {dict.home.steps.step2Desc}
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-background border border-border card-hover space-y-3 relative text-start">
              <span className="w-8 h-8 rounded-full bg-success text-success-foreground font-black text-sm flex items-center justify-center mb-2">
                3
              </span>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                {dict.home.steps.step3Title}
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {dict.home.steps.step3Desc}
              </p>
            </div>

          </div>

          <div className="text-center pt-8">
            <Link 
              href="/register" 
              className="btn-primary min-h-[48px] px-8 text-base shadow-sm"
            >
              <span>{dict.home.ctaJoin}</span>
              <ArrowIcon className="w-4 h-4 shrink-0" />
            </Link>
          </div>
        </div>
      </section>


      {/* ─── 5. QUALITY & SECURITY ─── */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
              {dict.home.quality.sectionTitle}
            </h2>
            <p className="text-sm sm:text-base text-foreground/70">
              {dict.home.quality.sectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: 5-Stage QC */}
            <div className="glass p-6 rounded-2xl border border-border card-hover space-y-3 text-start">
              <div className="w-10 h-10 rounded-xl bg-success/12 text-success flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {dict.home.quality.qcTitle}
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {dict.home.quality.qcDesc}
              </p>
            </div>

            {/* Card 2: NDAs & Confidentiality */}
            <div className="glass p-6 rounded-2xl border border-border card-hover space-y-3 text-start">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {dict.home.quality.securityTitle}
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {dict.home.quality.securityDesc}
              </p>
            </div>

            {/* Card 3: Restricted Access */}
            <div className="glass p-6 rounded-2xl border border-border card-hover space-y-3 text-start">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {dict.home.quality.infrastructureTitle}
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                {dict.home.quality.infrastructureDesc}
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* ─── 6. CONTACT & PARTNERSHIP CTA ─── */}
      <section className="py-16 sm:py-20 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass p-8 sm:p-12 rounded-3xl border border-border shadow-md">
            
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-7 space-y-4 text-center lg:text-start">
                <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
                  {dict.home.contact.sectionTitle}
                </h2>
                <p className="text-sm sm:text-base text-foreground/70 leading-relaxed max-w-xl">
                  {dict.home.contact.sectionSubtitle}
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link 
                    href="/register" 
                    className="btn-primary min-h-[48px] px-6 text-sm sm:text-base font-bold"
                  >
                    <span>{dict.home.contact.joinAsContributor}</span>
                    <ArrowIcon className="w-4 h-4 shrink-0" />
                  </Link>
                  <a 
                    href="mailto:info@shehab-tech.com"
                    className="btn-secondary min-h-[48px] px-6 text-sm sm:text-base font-bold"
                  >
                    <Mail className="w-4 h-4 shrink-0" />
                    <span>{dict.home.contact.requestCustomData}</span>
                  </a>
                </div>
              </div>

              {/* Direct Leadership Card */}
              <div className="lg:col-span-5 p-6 rounded-2xl bg-background border border-border space-y-4 text-start">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {dict.home.contact.directHeading}
                  </h3>
                  <p className="text-xs text-foreground/60">
                    {dict.home.contact.founderRole}
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <a 
                    href="mailto:info@shehab-tech.com"
                    className="min-h-[44px] flex items-center gap-3 text-sm text-foreground/80 hover:text-primary transition-all p-2 rounded-xl hover:bg-muted"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-foreground/50">{dict.home.contact.emailLabel}</p>
                      <p className="font-semibold truncate">info@shehab-tech.com</p>
                    </div>
                  </a>

                  <a 
                    href="https://wa.me/201026744042"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] flex items-center gap-3 text-sm text-foreground/80 hover:text-success transition-all p-2 rounded-xl hover:bg-muted"
                  >
                    <div className="w-8 h-8 rounded-lg bg-success/12 text-success flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-foreground/50">{dict.home.contact.phoneLabel}</p>
                      <p className="font-semibold truncate" dir="ltr">+20 1026 744 042</p>
                    </div>
                  </a>

                  <div className="min-h-[44px] flex items-center gap-3 text-sm text-foreground/80 p-2 rounded-xl bg-muted/40">
                    <div className="w-8 h-8 rounded-lg bg-muted text-primary flex items-center justify-center shrink-0 border border-border">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-foreground/50">{dict.home.contact.wechatLabel}</p>
                      <p className="font-mono font-semibold truncate">AS01026744042</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

    </div>
  )
}
