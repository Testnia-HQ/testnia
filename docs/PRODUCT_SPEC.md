# Testnia — Product Specification

**TESTNIA · Personalized Learning & Exam-Prep Platform — Product Specification Document — MVP Build**

- **Version:** 1.0 (Consolidated)
- **Prepared for:** The Testnia Engineering Team
- **Consolidated from:** Original concept brief (19/02/2026) and subsequent product iterations through 19/03/2026

---

## Table of Contents

1. [Document Control](#1-document-control)
2. [Executive Summary](#2-executive-summary)
3. [Product Vision & Goals](#3-product-vision--goals)
4. [Target Users & Markets](#4-target-users--markets)
5. [MVP Scope Definition](#5-mvp-scope-definition)
6. [Information Architecture / Sitemap](#6-information-architecture--sitemap)
7. [Core Features — Detailed Requirements](#7-core-features--detailed-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Data Model Overview (Key Entities)](#9-data-model-overview-key-entities)
10. [Technical Architecture Overview](#10-technical-architecture-overview)
11. [Release Roadmap](#11-release-roadmap)
12. [Open Questions & Assumptions for Engineering](#12-open-questions--assumptions-for-engineering)
13. [Appendix: Original Decision Log (Source Notes)](#13-appendix-original-decision-log-source-notes)

---

## 1. Document Control

| Field | Detail |
|---|---|
| Product name | Testnia |
| Document purpose | Single source of truth for the Testnia MVP build. Consolidates the original concept brief and all subsequent scope changes (19 Feb 2026 – 19 Mar 2026) into one coherent specification for the engineering team. |
| Audience | Engineering (frontend, backend, AI/ML), QA, design, and product stakeholders |
| Companion document | "Testnia — MVP Build Prompt Pack" (sequenced Claude/Claude Code build prompts derived from this spec) |
| Status | Ready for engineering scoping and sprint planning |

**How this document was built:** The product went through a series of scope changes as decisions were made in real time (dated notes, 19 Feb – 19 Mar 2026). This document resolves those into ONE current, non-contradictory spec — e.g. the exam list narrowed from a broad West/East African + international list down to WAEC, JAMB, KCSE, NECO and IELTS, and this document reflects that final decision throughout. [Section 13](#13-appendix-original-decision-log-source-notes) preserves the raw decision history for traceability.

---

## 2. Executive Summary

Testnia is an AI-powered, mobile-first learning platform that helps students and exam candidates across Africa prepare for major local and international examinations. It combines a structured practice-question engine with explanatory feedback, AI-graded essay assessment, personalized AI learning goals, live and recorded tutorials, and a freemium-to-premium subscription model priced in local currency.

The MVP focuses on **five examinations — WAEC, JAMB, NECO, KCSE, and IELTS** — across **eight core subjects**, with a generous free-trial question bank designed to demonstrate value before conversion to a paid plan. The platform is built for two language markets (Anglophone and Francophone West/East Africa) and nine initial countries.

### MVP Success Criteria

- A student can sign up, select a country/exam/subject, and sit a scored practice test **within 5 minutes** of first landing on the site.
- Every question — right or wrong — returns a clear, exam-board-aligned explanation immediately after submission.
- A student can submit an essay-type answer and receive an AI-generated assessment aligned to the relevant exam board's marking standard.
- A user can subscribe and pay in their local currency via a locally relevant payment method (card, Verve, or Mobile Money) for less than the cost of a physical past-questions booklet.
- The admin team can manage users, content, and payments from a web-based admin panel, with data exports available for offline review.

---

## 3. Product Vision & Goals

**Vision:** Make world-class, personalized exam preparation affordable and accessible to every student in Africa, starting with the exams that determine access to university and international opportunity.

### Product Goals

- Deliver measurably better exam outcomes through AI-personalized practice, not just static past questions.
- Remove cost as a barrier via sub-$1 local-currency pricing and a substantial free tier.
- Build trust through transparent, detailed, per-question feedback rather than a pass/fail score.
- Localize fully for Anglophone and Francophone learners rather than bolting on translation later.
- Ship an MVP that is instrumented for feedback from day one, so the roadmap is driven by real user data.

---

## 4. Target Users & Markets

### 4.1 Primary User Personas

| Persona | Description | Primary Need |
|---|---|---|
| Secondary school candidate | Preparing for WAEC, NECO, or JAMB in Nigeria, Ghana, Sierra Leone, or Liberia | Structured, subject-by-subject practice with clear feedback and an affordable plan |
| Kenyan secondary candidate | Preparing for KCSE | East African syllabus-aligned practice questions |
| International-exam candidate | Preparing for IELTS for study/work abroad | Skill-based practice plus essay/writing assessment |
| Parent/sponsor | Pays for and monitors a child's or ward's subscription and progress | Visibility into progress, low-friction local payment |
| Tutor/content partner (future) | Runs live or group tutorial sessions on the platform | Scheduling, group management, session tools |

### 4.2 Launch Countries & Languages

Nine initial countries across two language experiences. The user selects their country at sign-up, which sets default language, currency, and (where applicable) exam relevance.

| Country | Interface Language | Notes |
|---|---|---|
| Nigeria | English | WAEC, NECO, JAMB |
| Ghana | English | WAEC |
| Sierra Leone | English | WAEC |
| Liberia | English | WAEC |
| Kenya | English | KCSE |
| South Africa | English | IELTS / general international prep |
| Togo | French | IELTS / general international prep |
| Benin Republic | French | IELTS / general international prep |
| Ivory Coast | French | IELTS / general international prep |

> **Scope decision:** The original brief also listed JAMB/NABTEB variants and international tests (SAT, GMAT, GRE, MCAT). Per the 19 Feb scope revision, the MVP exam catalogue is limited to **WAEC, JAMB, NECO, KCSE and IELTS**. Country and language coverage remains as originally specified. **Only exams actually available should be listed on the home page** (see [§7.11](#711-home-page--how-it-works)).

---

## 5. MVP Scope Definition

### 5.1 In Scope for MVP

- **5 exams:** WAEC, JAMB, NECO, KCSE, IELTS
- **8 subjects per exam** (English, Mathematics, Physics, Chemistry, Biology, Economics, Commerce, Government/Literature as applicable) — West & East African syllabus aligned
- **30 real practice questions per subject at Free Trial tier**, per exam
- Full paid question banks beyond the 30-question free trial
- Detailed explanatory feedback per question
- AI-graded essay/written-response assessment aligned to exam-board standards
- AI-powered personalized learning goals set at sign-up and adjusted over time
- Progress tracking: milestones, streaks, subject mastery, score trends
- "Hero" leaderboard/feature for users scoring 90%+ by exam category
- Freemium → Premium subscription tiers, priced in local currency (from ~US$1 equivalent)
- Payment integration: Mastercard, Visa, Verve (Nigeria), Mobile Money (Ghana/Kenya), local card rails
- Live tutorial sessions, group sessions, and recorded sessions (scheduling + playback; not full video infrastructure in MVP — see [§5.2](#52-explicitly-out-of-scope-for-mvp-future-phases))
- English/French localization by country selection
- Home page with "How It Works" guide reflecting only live exams
- Live chat bot for basic support, routed to designated support inboxes
- Privacy Policy, Terms of Service, Cookie Policy pages (full-read, responsive, scroll-to-top on open)
- Social media links/footer integration and a feedback-to-social-post interface
- Supabase-backed accounts, auth, and progress data
- Admin panel: user, content, exam, payment, and reporting management, with offline-exportable data
- Weekly automated data export (sign-ups, activity, key engagement indices) to designated recipients
- On-platform ad placement inventory (non-intrusive, free-tier only)

### 5.2 Explicitly Out of Scope for MVP (future phases)

- SAT, GMAT, GRE, MCAT, and NABTEB — retained on the product roadmap, not built in MVP
- Native live-video conferencing infrastructure — MVP integrates a third-party video/webinar provider rather than building proprietary video
- Native mobile apps (MVP is a responsive web app; app-store apps are Phase 2)
- Tutor marketplace / self-serve tutor onboarding (MVP live sessions are Testnia-run)
- Advanced ad-network self-serve buying tools (MVP ships ad placements/inventory, not a full ad exchange)

---

## 6. Information Architecture / Sitemap

1. **Home / Landing** (hero, exam selector, How It Works, Hero Feature, pricing teaser, testimonials, footer)
2. **How It Works** (detailed how-to-use guide)
3. **Sign Up / Log In** (country → language/currency, exam(s), goal-setting)
4. **Onboarding / Goal Setup** (AI learning goal generation)
5. **Dashboard** (progress, milestones, recommended next practice, streaks)
6. **Exam Hub** (per exam: subjects, free trial vs full bank indicator)
7. **Subject Practice** (question player, timer, submit, per-question feedback)
8. **Essay/Written Response Practice** (submission, AI assessment, rubric breakdown)
9. **Tutorials** (Live sessions calendar, Group sessions, Recorded library)
10. **Hero Feature / Leaderboard** (90%+ achievers by exam category)
11. **Pricing & Subscription** (plan comparison, local currency toggle, checkout)
12. **Account Settings** (profile, country/language, subscription, payment methods)
13. **Support** (Live chat bot, contact/feedback links to social channels)
14. **Legal** (Privacy Policy, Terms of Service, Cookie Policy)
15. **Admin Panel** (separate authenticated area — see [§7.15](#715-admin-panel))

---

## 7. Core Features — Detailed Requirements

### 7.1 Exam & Subject Coverage

Five exams at MVP launch: **WAEC, JAMB, NECO, KCSE, IELTS**. Eight subjects per exam: **English, Mathematics, Physics, Chemistry, Biology, Economics, Commerce, and Government or Literature** (whichever is syllabus-appropriate for the exam board). Content must be **real, exam-board-aligned questions** — not placeholder/dummy content — sourced or authored to reflect current West African (WAEC/NECO/JAMB) and East African (KCSE) syllabi, and the IELTS test format for IELTS.

| Requirement | Detail |
|---|---|
| Content sourcing | Real past/practice questions per subject, mapped to the correct syllabus and exam board; no generic/dummy question sets |
| Free Trial depth | 30 questions per subject, per exam, available without payment |
| Paid depth | Full question bank beyond the 30-question trial, gated behind subscription |
| Home page listing | Only exams that are actually live/available are shown on the home page and exam selector |
| Content structure | Each question stores: exam, subject, topic/syllabus tag, difficulty, correct answer, and a full explanation |

### 7.2 Practice Testing Engine & Explanatory Feedback

Every practice session, whether from the free trial or the full bank, must return detailed explanatory feedback per question immediately after submission — not just a correct/incorrect flag. The explanation should teach the underlying concept so the learner can apply it in later practice and in the real exam.

- Question player supports multiple-choice and essay/free-response question types
- Per-question explanation covers: why the correct answer is correct, why common wrong options are wrong, and the underlying concept/topic
- End-of-session summary: score, time taken, topic-level breakdown of strengths/weaknesses
- Session results feed directly into the user's progress tracking and AI goal recalibration

### 7.3 Essay / Written-Response AI Assessment

Students can submit essay-type or long-form answers for AI assessment, graded against the marking standard of the relevant exam board (e.g. WAEC/NECO English composition rubric, IELTS Writing band descriptors).

- Rubric-based scoring aligned per exam board, not a single generic rubric
- Feedback includes: overall band/score estimate, strengths, specific areas to improve, and (where applicable) line-level comments
- Essay history stored against the user's profile to show improvement over time

### 7.4 Sign-Up, Onboarding & AI-Powered Learning Goals

The sign-up profile is the foundation for an AI-generated, personalized learning goal per user — this is a **core differentiator, not an afterthought**.

**Sign-up profile captures**
- Full name, email/phone, password (or social sign-in)
- Country (drives language/currency defaults) and preferred interface language
- Target exam(s) and target subjects
- Exam date / target timeframe (if known)
- Self-reported current level or a short diagnostic mini-test
- Study time availability (hours/week)

**AI goal generation**
- On completing sign-up (or the optional diagnostic), the AI generates a personalized goal: target subjects to prioritize, a suggested weekly study plan, and milestone checkpoints toward the target exam date
- Goals recalibrate automatically as practice results come in (e.g. subject mastery improves, weak topics resurface)
- Goal and plan are visible on the Dashboard at all times

### 7.5 Progress Tracking, Milestones & Dashboards

- Dashboard shows: overall progress toward the AI goal, subject-by-subject mastery, streaks, and recent activity
- Milestones are system-generated from the AI goal (e.g. "Complete 3 Physics practice sets", "Reach 70% average in Mathematics") and marked complete automatically
- Historical score trend per subject, so a learner can see improvement over time
- Progress data persists to the Supabase backend against the user's account (see [Section 10](#10-technical-architecture-overview))

### 7.6 Hero Feature (Top Performers)

A visible feature highlighting users who have scored **90% or above**, grouped by exam category, to drive motivation and social proof.

- Opt-in visibility (users choose whether their name/handle appears publicly)
- Filterable by exam category (WAEC, JAMB, NECO, KCSE, IELTS)
- Updates automatically as new qualifying scores are recorded

### 7.7 Subscription Tiers & Pricing

| Tier | Access | Price positioning |
|---|---|---|
| Freemium | 30 questions/subject/exam, limited dashboard, no live/recorded tutorials | Free |
| Premium | Full question banks, essay AI assessment, live + group + recorded tutorials, full AI goal tracking, ad-free | As low as ~US$1 or local-currency market equivalent |

- Multi-currency pricing: local-currency equivalents for Nigeria (NGN), Ghana (GHS), Kenya (KES), plus USD default for other launch markets, based on the user's selected country
- Pricing displayed and charged in the user's local currency at checkout
- Plan comparison table on the Pricing page; upgrade prompts contextually placed where free-tier limits are hit

### 7.8 Payment Integration

| Market | Supported methods |
|---|---|
| Nigeria | Mastercard, Visa, Verve |
| Ghana | Mastercard, Visa, Mobile Money (MoMo) |
| Kenya | Mastercard, Visa, Mobile Money (M-Pesa/MoMo equivalent), plus other locally relevant card rails |
| Other launch countries | Mastercard, Visa (default), extended per local payment-partner coverage |

> Recommend integrating via a **regional payment aggregator** (e.g. Paystack/Flutterwave-class provider) that natively supports card, Verve, and Mobile Money rails across these markets, rather than integrating each rail individually. Confirm provider selection with engineering during technical design.

### 7.9 Tutorials: Live, Group, and Recorded Sessions

- **Live sessions:** scheduled, single-tutor sessions with calendar/booking and reminders
- **Group sessions:** scheduled sessions supporting multiple enrolled students
- **Recorded sessions:** on-demand library, filterable by exam/subject
- All tutorial types gated to **Premium** subscribers in MVP

### 7.10 Localization (English / French)

- Country selector at sign-up sets default interface language: **English** for Nigeria, Ghana, Sierra Leone, Liberia, Kenya, South Africa; **French** for Togo, Benin Republic, Ivory Coast
- All UI strings, notifications, and support chat available in both languages
- Users can override the default language independent of country if desired

### 7.11 Home Page & How It Works

- Home page lists only currently available/live exams (WAEC, JAMB, NECO, KCSE, IELTS)
- "How It Works" section includes a step: **"Select Exam"** — updated to reflect the current supported exam list, not the original broader concept list
- Detailed how-to-use guide accessible directly from the landing page
- Hero Feature (top performers) surfaced on the home page for social proof

### 7.12 Live Chat Support Bot

An on-platform chat bot handles basic support: how to use Testnia, and functionality-flaw reports. It should attempt to resolve common questions itself, and route unresolved feedback to the correct inbox.

| Feedback type | Routed to |
|---|---|
| Product/user feedback | hello@testnia.com |
| Legacy/product ops inbox | products@copyhouseinternational.com |
| Internal team inbox | testnia26@gmail.com |

### 7.13 Legal Pages

- Privacy Policy, Terms of Service, and Cookie Policy — each a full, responsive page (not a modal snippet)
- Clicking any privacy/legal/cookie icon or link opens the page scrolled to the **TOP**, not the bottom
- Contact email on all legal pages updated to **hello@testnia.com** (replacing products@copyhouseinternational.com as the public-facing contact)

### 7.14 Social Media Integration & Feedback Loop

Footer/contact area links to Testnia's official channels:

- **X (Twitter):** x.com/i/status/2026411809562128758
- **Facebook:** web.facebook.com/profile.php?id=61587294470066
- **LinkedIn:** linkedin.com/showcase/testnia
- **Instagram:** instagram.com/testn_ia

A dedicated **"Leave Feedback"** interface lets users click through directly to Testnia's X, Instagram, Facebook, or LinkedIn pages to post feedback or comments publicly.

### 7.15 Admin Panel

A separately authenticated, role-based admin area giving the Testnia team full operational control online, plus offline-usable data exports.

- **User management:** view/search/edit user accounts, subscription status, activity history
- **Content management:** add/edit questions, explanations, essay rubrics, subjects, and exams
- **Payments & subscriptions:** view transactions, refunds, plan changes, by country/currency
- **Tutorials management:** schedule live/group sessions, upload recorded sessions
- **Hero Feature management:** review/moderate opt-in top performers
- **Reporting:** on-demand and scheduled exports (see [§7.16](#716-reporting--weekly-data-export))
- **Role-based access control** for the internal team
- Full read access to the user database for authorized admin roles, with **audit logging** of admin actions

### 7.16 Reporting & Weekly Data Export

An automated weekly export of sign-ups and user activity, packaged as a datasheet (e.g. CSV/spreadsheet), including key functionality and engagement indices per user (e.g. sessions completed, average score, subscription status, last active date).

- Scheduled weekly send to **products@copyhouseinternational.com** and **testnia26@gmail.com**
- Exportable on-demand from the admin panel as well as via the scheduled job
- Data handling must comply with the platform's own Privacy Policy

### 7.17 Advertising & Complementary Revenue Streams

- Defined ad placement inventory on **free-tier pages** (e.g. dashboard sidebar, between-question-set interstitials) — **Premium is ad-free**
- Architecture should support plugging in an ad network/exchange without a redesign
- Framework left open for future complementary revenue: sponsored tutorial content, institutional/school licensing, affiliate placements

---

## 8. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | Question player and dashboard should load in under 2s on average West/East African mobile network conditions; practice sessions must work well on low bandwidth connections |
| Availability | Target 99.5%+ uptime for the MVP; graceful degradation of AI features (e.g. essay grading) should not block core practice-test functionality |
| Security | Encrypted credentials, secure payment handling (PCI-compliant via payment partner, not custom card storage), role-based admin access, audit logs on admin actions |
| Data privacy | Compliant handling of personal data per each launch country's applicable regulations; policies reflected in Privacy Policy |
| Scalability | Backend (Supabase) and content model designed to add exams/subjects/countries without schema rework |
| Device support | Fully responsive web app: mobile-first, then tablet/desktop |
| Accessibility | Legible typography, sufficient contrast, and screen-reader-friendly markup on core flows (sign-up, practice, dashboard) |
| Extensibility / upgrades | Architecture and admin tooling must support rolling out upgrades from user feedback without downtime, in line with the product's fully AI-integrated, continuously-improving intent |

---

## 9. Data Model Overview (Key Entities)

High-level entities to inform schema design on Supabase. Exact field-level schema to be finalized in technical design.

| Entity | Key attributes |
|---|---|
| User | id, name, email/phone, country, language, password/auth provider, created_at, subscription_status |
| Profile / Goal | user_id, target_exam(s), target_subjects, target_date, study_hours_per_week, AI generated goal, milestones |
| Exam | id, name (WAEC/JAMB/NECO/KCSE/IELTS), region/syllabus |
| Subject | id, exam_id, name, syllabus_tags |
| Question | id, subject_id, type (MCQ/essay), difficulty, topic_tag, options, correct_answer, explanation, tier (free/paid) |
| Practice Session | id, user_id, exam_id, subject_id, questions_attempted, score, time_taken, created_at |
| Essay Submission | id, user_id, exam_id, prompt, submitted_text, AI_score, rubric_breakdown, feedback |
| Subscription / Payment | id, user_id, plan, currency, amount, payment_method, provider_reference, status, renewed_at |
| Tutorial Session | id, type (live/group/recorded), exam_id, subject_id, schedule/recording_url, enrolled_users |
| Hero Feature Entry | id, user_id, exam_id, score, opt_in_visible, created_at |
| Admin User | id, name, role, permissions, last_login |
| Support Ticket / Chat Log | id, user_id, message, routed_to, status |

---

## 10. Technical Architecture Overview

- **Frontend:** responsive web application (framework per engineering standard), English/French i18n layer, country-driven locale/currency config
- **Backend/Data:** Supabase for authentication, database (Postgres), and progress/activity tracking
- **AI layer:** LLM-backed services for (a) per-question explanatory feedback generation/authoring support, (b) essay/written-response assessment against exam-board rubrics, (c) personalized goal generation and recalibration
- **Payments:** regional payment aggregator supporting card (Mastercard/Visa/Verve) and Mobile Money rails across launch countries, with multi-currency pricing
- **Support:** live chat bot (rules-based + AI-assisted) with routing logic to designated support inboxes
- **Admin:** separate authenticated admin web app, backed by the same Supabase instance with role-based access control
- **Reporting:** scheduled job (e.g. cron/edge function) generating and emailing the weekly datasheet export
- **Analytics/feedback instrumentation:** event tracking on core flows to support the "100% functional, upgrade as feedback flows in" operating model

---

## 11. Release Roadmap

| Phase | Scope |
|---|---|
| MVP (Phase 1) | Everything defined in [Section 5.1](#51-in-scope-for-mvp): 5 exams, 8 subjects, free trial + premium tiers, AI goals, essay assessment, tutorials, admin panel, payments, localization |
| Phase 2 | Native mobile apps; expand exam catalogue toward NABTEB and international tests (SAT, GMAT, GRE, MCAT); tutor marketplace; expanded ad network integration |
| Phase 3 | Additional countries/languages; institutional/school licensing; deeper AI adaptive learning engine (item-response-theory-driven difficulty adjustment) |

---

## 12. Open Questions & Assumptions for Engineering

1. Confirm the specific payment aggregator/provider to be used per country (assumption: a single regional aggregator covering card + Verve + MoMo across Nigeria, Ghana, and Kenya).
2. Confirm the video/webinar provider for live and group tutorial sessions (assumption: third-party integration, not custom-built video infrastructure, for MVP).
3. Confirm final subject-by-exam mapping where a subject doesn't cleanly apply (e.g. Government vs. Literature-in-English availability per exam board).
4. Confirm data residency/compliance requirements per launch country for the weekly data export and general user data storage.
5. Confirm which LLM/AI provider(s) power explanation generation, essay grading, and goal generation, and associated cost/rate-limit planning.
6. Confirm ad network partner(s) for the free-tier ad inventory.

---

## 13. Appendix: Original Decision Log (Source Notes)

Preserved for traceability. This is the raw chronological record of scope decisions that this specification consolidates. Where a later note supersedes an earlier one, this specification (Sections 1–12) reflects the final, current state.

| Date / Ref | Decision |
|---|---|
| 19/02/2026 — A | Original broad concept brief (all West African exams + KCSE, SAT, GMAT, GRE, MCAT, IELTS) narrowed to: **WAEC, JAMB, KCSE, NECO, IELTS**. Real questions required for 8 subjects per exam (English, Maths, Physics, Chemistry, Biology, Economics, Commerce, Government, Literature), West & East African syllabus aligned — replacing placeholder/dummy content. |
| 19/02/2026 — B | 30 questions per subject at Free Trial phase. |
| 19/02/2026 — C | Extend the WAEC content upgrade to all other exams. Only list available exams on the home page. |
| 19/02/2026 — D | Connect Supabase backend for user accounts and progress tracking. |
| 19/02/2026 — E | Enable essay/written-answer submission with AI assessment aligned to each exam board's standards. |
| 19/02/2026 — F | Update the "Select Exams" step under "How It Works" to reflect the actual supported exam list. |
| 23/02/2026 | Hero Feature: highlight users scoring 90%+ across respective exam categories. |
| 25/02/2026 — A | Rework pricing to as low as ~US$1 (or local market equivalent) with multi-currency payment for pilot West/East African countries, based on user location. |
| 25/02/2026 — B | Add Mastercard, Visa, Verve (Nigeria), Mobile Money (Ghana & Kenya), and other locally relevant card options. |
| 25/02/2026 — C | Create full, responsive Privacy Policy, Terms of Service, and Cookie Policy pages. Replace contact email products@copyhouseinternational.com with hello@testnia.com. |
| 19/03/2026 | Add official social media links (X, Facebook, LinkedIn, Instagram). Build a live chat bot for basic support, routing feedback to hello@testnia.com, products@copyhouseinternational.com, and testnia26@gmail.com. Legal-page links must open scrolled to the top, not the bottom. Weekly automated export of sign-ups/activity data (with key functionality indices per user) to products@copyhouseinternational.com and testnia26@gmail.com. Direct "leave feedback" interface linking to Testnia's X, Instagram, Facebook, and LinkedIn pages. |
