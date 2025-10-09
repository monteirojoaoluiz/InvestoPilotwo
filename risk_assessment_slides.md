---
theme: default
class: text-left
highlighter: shiki
lineNumbers: false
info: |
  ## InvestoPilot Risk Assessment Methodology
  A comprehensive 14-question framework for investor profiling
transition: slide-left
title: Risk Assessment Methodology
mdc: true
---

---

layout: cover
class: brand-cover text-white
background: https://source.unsplash.com/collection/94734566/1920x1080

---

# InvestoPilot Risk Assessment

### Translating investor conversations into confident portfolio decisions

<div class="tagline mt-6 max-w-2xl">
  Our structured dialogue captures life stage, financial resilience, and market experience to craft compliant investment journeys.
</div>

<div class="grid grid-cols-12 gap-4 mt-12 text-sm uppercase tracking-[0.25em]">
  <div class="pill col-span-3">Deterministic</div>
  <div class="pill col-span-3">Audit-ready</div>
  <div class="pill col-span-3">Human + Data</div>
  <div class="pill col-span-3">14 ➜ 6 Dimensions</div>
</div>

---

## class: bg-slate-50/60

# Executive Snapshot

<div class="grid grid-cols-12 gap-6 mt-8">
  <div class="stat-card col-span-4">
    <div class="stat-label">Inputs</div>
    <div class="stat-value">14</div>
    <div class="stat-caption">questions across life stage, financial health, and experience</div>
  </div>
  <div class="stat-card col-span-4">
    <div class="stat-label">Dimensions</div>
    <div class="stat-value">6</div>
    <div class="stat-caption">risk tolerance, capacity, horizon, experience, regions, exclusions</div>
  </div>
  <div class="stat-card col-span-4">
    <div class="stat-label">Time-to-Insight</div>
    <div class="stat-value">~5 min</div>
    <div class="stat-caption">questionnaire completion to profile preview with guardrails applied</div>
  </div>
</div>

<div class="insight-banner mt-10">
  <span class="badge">Outcome</span>
  Advisors receive a transparent, documented profile that guides portfolio construction and ongoing suitability checks.
</div>

---

## class: brand-light

# Blueprint: From Responses to Profile

<div class="grid grid-cols-12 gap-8 mt-6 items-center">
  <div class="col-span-5 space-y-4">
    <p class="lead">
      A deterministic pipeline transforms qualitative narratives and quantitative inputs into a compliant investor blueprint.
    </p>
    <ul class="checklist text-sm">
      <li>Base values seeded by journey-defining questions</li>
      <li>Supportive modifiers calibrate the nuance</li>
      <li>Clamping creates a predictable 0-100 scale</li>
      <li>Overrides enforce fiduciary guardrails</li>
    </ul>
  </div>
  <div class="col-span-7">
```mermaid
%%{init: {'theme':'base', 'themeVariables': {'fontSize':'11px', 'primaryColor':'#0f766e'}}}%%
flowchart LR
    A([14 Questions]) --> B{Base Values}
    B --> C[Apply Modifiers]
    C --> D[Clamp 0-100]
    D --> E{Override Checks}
    E --> F([Investor Profile])
    style A fill:#0f766e,color:#ffffff
    style F fill:#22c55e,color:#0f172a
```
  </div>
</div>

::: info
Risk capacity drops to **0** if the investor lacks an emergency fund, ensuring suitability before sophistication.
:::

---

# What We Measure

<div class="grid grid-cols-12 gap-6 mt-6">
  <div class="dimension-card col-span-6">
    <div class="dimension-title">Quantitative Scores (0-100)</div>
    <ul class="dimension-list">
      <li><span>Risk Tolerance</span> Emotional comfort with volatility</li>
      <li><span>Risk Capacity</span> Financial ability to absorb risk</li>
      <li><span>Investment Horizon</span> Time until capital is needed</li>
      <li><span>Investor Experience</span> Knowledge & decision confidence</li>
    </ul>
  </div>
  <div class="dimension-card col-span-6">
    <div class="dimension-title">Qualitative Preferences</div>
    <ul class="dimension-list">
      <li><span>Regions Selected</span> Required geographic exposure mix</li>
      <li><span>Industry Exclusions</span> Ethical and ESG guardrails</li>
      <li><span>Compliance Notes</span> Overrides triggered by safety checks</li>
    </ul>
  </div>
</div>

<div class="note mt-6">
  Numeric outputs are clamped to the 0-100 range, preserving comparability and easing portfolio mapping.
</div>

---

## class: bg-slate-50/50

# Scoring Pipeline

<div class="timeline mt-6">
  <div class="timeline-step">
    <span class="step-index">1</span>
    <div>
      <div class="step-title">Set Base Values</div>
      <div class="step-copy">Key life-stage and experience questions seed each dimension.</div>
    </div>
  </div>
  <div class="timeline-step">
    <span class="step-index">2</span>
    <div>
      <div class="step-title">Apply Modifiers</div>
      <div class="step-copy">Supporting responses adjust scores -10 to +40 where relevant.</div>
    </div>
  </div>
  <div class="timeline-step">
    <span class="step-index">3</span>
    <div>
      <div class="step-title">Clamp 0-100</div>
      <div class="step-copy">Strong responses never exceed bounds, maintaining parity across profiles.</div>
    </div>
  </div>
  <div class="timeline-step">
    <span class="step-index">4</span>
    <div>
      <div class="step-title">Enforce Overrides</div>
      <div class="step-copy">Critical red flags (e.g., no emergency fund) instantly cap exposure.</div>
    </div>
  </div>
</div>

<div class="callout-alert mt-8">
  <div class="callout-title">Safety-first override</div>
  <div class="callout-body">No emergency fund -> Capacity forcibly set to 0 until cash reserves are established.</div>
</div>

---

# Question Categories

<div class="grid grid-cols-12 gap-6 mt-8 text-sm leading-relaxed">
  <div class="category-card col-span-4">
    <div class="category-icon">🎯</div>
    <div class="category-title">Life Stage (3)</div>
    <p class="category-copy">Journey, timeline, investor profile. Sets the baseline horizon and capacity expectations.</p>
  </div>
  <div class="category-card col-span-4">
    <div class="category-icon">💼</div>
    <div class="category-title">Financial Health (5)</div>
    <p class="category-copy">Income stability, emergency fund, debt, income, net worth. Determines risk capacity headroom.</p>
  </div>
  <div class="category-card col-span-4">
    <div class="category-icon">📚</div>
    <div class="category-title">Experience & Preferences (6)</div>
    <p class="category-copy">Market comfort, investing experience, loss reaction, regions, exclusions. Shapes tolerance and experience.</p>
  </div>
</div>

---

## class: brand-light

# Dimension Deep Dive

<div class="grid grid-cols-12 gap-6 mt-6 text-sm">
  <div class="metric-card col-span-6 md:col-span-6 lg:col-span-3">
    <div class="metric-title">Risk Tolerance</div>
    <div class="metric-chip">Additive · Clamp</div>
    <ul class="metric-list">
      <li>Base 0, purely additive</li>
      <li>Q2 comfort: -30 -> +30</li>
      <li>Q3 timeline: -30 -> +30</li>
      <li>Q9 experience: -10 -> +20</li>
      <li>Q11 profile: 0 -> +20</li>
      <li>Q12 loss reaction: -40 -> +30</li>
    </ul>
  </div>
  <div class="metric-card col-span-6 md:col-span-6 lg:col-span-3">
    <div class="metric-title">Risk Capacity</div>
    <div class="metric-chip">Base + Guardrail</div>
    <ul class="metric-list">
      <li>Q1 journey sets 20 -> 70</li>
      <li>Q6 stability: -10 -> +40</li>
      <li>Q7 emergency fund: +10/+20 or hard 0</li>
      <li>Q8 debt: -20 -> +20</li>
      <li>Q13 income: -20 -> +20</li>
      <li>Q14 net worth: -20 -> +20</li>
    </ul>
  </div>
  <div class="metric-card col-span-6 md:col-span-6 lg:col-span-3">
    <div class="metric-title">Investment Horizon</div>
    <div class="metric-chip">Stage + Need</div>
    <ul class="metric-list">
      <li>Q1 journey: 0 / 20 / 70 / 80</li>
      <li>Q3 liquidity need: -50 / -20 / +20</li>
      <li>Q11 profile: -10 / 0 / +10</li>
      <li>Sum clamps to 0-100</li>
    </ul>
  </div>
  <div class="metric-card col-span-6 md:col-span-6 lg:col-span-3">
    <div class="metric-title">Investor Experience</div>
    <div class="metric-chip">Base + Modifier</div>
    <ul class="metric-list">
      <li>Q9 base: 20 / 40 / 70 / 100</li>
      <li>Q10 knowledge adds +0 / +10 / +20</li>
      <li>Clamp keeps confidence grounded</li>
    </ul>
  </div>
</div>

---

# Guardrails & Overrides

<div class="grid grid-cols-12 gap-8 mt-8 items-start">
  <div class="col-span-7 space-y-4 text-sm leading-relaxed">
    <p class="lead-sm">We place investor safety above ambition.</p>
    <ul class="checklist text-sm">
      <li>Emergency fund absent -> capacity reset to zero.</li>
      <li>Debt distress signals pull capacity down before it caps tolerance.</li>
      <li>High tolerance cannot overpower capacity or compliance guardrails.</li>
    </ul>
    <p class="muted">Overrides are documented alongside the profile to support audit trails and advisor recommendations.</p>
  </div>
  <div class="col-span-5">
    <div class="override-card">
      <div class="override-title">Override Flow</div>
      <ol class="override-list">
        <li>Scan safety-critical responses.</li>
        <li>Trigger caps for mismatched fundamentals.</li>
        <li>Surface advisory actions (e.g., build emergency fund).</li>
      </ol>
    </div>
  </div>
</div>

---

## class: bg-slate-50/60

# Preferences & ESG Alignment

<div class="grid grid-cols-12 gap-6 mt-8">
  <div class="preference-card col-span-6">
    <div class="preference-title">Regions Selected (Q4)</div>
    <p class="preference-copy">Multi-select list ensures 1-5 regions. Codes map directly to InvestoPilot allocation universes.</p>
    <ul class="preference-list">
      <li>NL - Netherlands</li>
      <li>EU_EX_NL - Europe ex-NL</li>
      <li>US - United States</li>
      <li>DEV_EX_US_EU - Other Developed</li>
      <li>EM - Emerging Markets</li>
    </ul>
  </div>
  <div class="preference-card col-span-6">
    <div class="preference-title">Industry Exclusions (Q5)</div>
    <p class="preference-copy">"Keep included" interface toggles exposures. Unchecked choices create exclusion tags.</p>
    <ul class="preference-list">
      <li>Tobacco</li>
      <li>Fossil fuels</li>
      <li>Defense industry</li>
      <li>Gambling</li>
      <li>Adult entertainment</li>
      <li>Funds without ESG</li>
    </ul>
    <div class="note mt-4">`NO_ESG_SCREEN` unchecked excludes non-ESG funds from the recommendation engine.</div>
  </div>
</div>

---

# Worked Example

<div class="grid grid-cols-12 gap-6 text-sm mt-6">
  <div class="worked-card col-span-6">
    <div class="worked-title">Scenario: Mid-Career Growth Investor</div>
    <ul class="worked-list">
      <li>Q1 Mid-career - Q2 Comfortable with swings</li>
      <li>Q3 Funds needed in 15+ years</li>
      <li>Q4 Regions: US, EM</li>
      <li>Q5 Exclusions: Fossil fuels, Non-ESG</li>
      <li>Q6 Stable income - Q7 Emergency fund ready</li>
      <li>Q8 Manageable debt load</li>
      <li>Q9 Intermediate experience - Q10 Intermediate knowledge</li>
      <li>Q11 Growth focused - Q12 Hold through 20% drawdown</li>
      <li>Q13 $100k-$250k income - Q14 $100k-$500k net worth</li>
    </ul>
  </div>
  <div class="worked-card col-span-6">
    <div class="worked-title">Computed Profile</div>
    <ul class="worked-list">
      <li><strong>Risk Tolerance · 70</strong> -> 0 + (0 + 30 + 10 + 20 + 10)</li>
      <li><strong>Risk Capacity · 100</strong> -> 70 + 20 + 20 + 10 + 10 + 0 -> 130 -> clamp</li>
      <li><strong>Investment Horizon · 100</strong> -> 80 + 20 + 10 -> 110 -> clamp</li>
      <li><strong>Investor Experience · 80</strong> -> 70 + 10</li>
      <li><strong>Preferences</strong> -> Regions US + EM - Exclusions Fossil fuels & Non-ESG</li>
    </ul>
  </div>
</div>

<div class="insight-banner mt-6">
  <span class="badge">Advisor Cue</span>
  Confirm emergency fund status annually; revisit exclusions during suitability reviews.
</div>

---

# Design Principles & Use Cases

<div class="grid grid-cols-12 gap-6 mt-8 text-sm">
  <div class="principle-card col-span-6">
    <div class="principle-title">What Makes It Robust</div>
    <ul class="principle-list">
      <li>Multi-dimensional view separates emotion from capacity.</li>
      <li>Context-aware life-stage baselines anchor expectations.</li>
      <li>Safety-first overrides document fiduciary care.</li>
      <li>Transparent mappings make audits effortless.</li>
      <li>Bounded scales simplify comparative analytics.</li>
    </ul>
  </div>
  <div class="principle-card col-span-6">
    <div class="principle-title">Real-World Applications</div>
    <ul class="principle-list">
      <li>Portfolio allocation calibrated to risk posture.</li>
      <li>Product curation mapped to profile tags.</li>
      <li>Risk monitoring flags misaligned positions early.</li>
      <li>Compliance teams evidence suitability rationale.</li>
      <li>Personalized education tailored to experience gaps.</li>
    </ul>
  </div>
</div>

---

layout: center
class: text-center

---

# Implementation Complete ✓

## From questionnaire to documented investor profile

<div class="mt-8 text-base text-gray-300">
  14 questions -> 6 dimensions -> Personalized investment strategy
</div>

<div class="mt-12 text-xs text-gray-400 tracking-wide uppercase">
  Built with data-driven methodology for InvestoPilot
</div>

<style>
:root {
  --brand-emerald: #0f766e;
  --brand-emerald-light: #d1fae5;
  --brand-emerald-dark: #134e4a;
  --brand-slate: #0f172a;
  --brand-muted: #64748b;
}

.brand-cover {
  background-position: center;
  background-size: cover;
}
.brand-cover::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.85), rgba(15, 23, 42, 0.75));
}
.brand-cover .slidev-layout {
  position: relative;
  z-index: 1;
}
.tagline {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #e0f2f1;
}
.pill {
  background: rgba(255, 255, 255, 0.18);
  padding: 0.75rem 1.25rem;
  text-align: center;
  border-radius: 999px;
  letter-spacing: 0.25em;
}
.stat-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 1.5rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 18px 35px -25px rgba(15, 23, 42, 0.55);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.stat-label {
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.3em;
  color: var(--brand-muted);
}
.stat-value {
  font-size: 2.8rem;
  font-weight: 700;
  color: var(--brand-slate);
}
.stat-caption {
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--brand-muted);
}
.insight-banner {
  background: linear-gradient(120deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.08));
  border-left: 4px solid var(--brand-emerald);
  padding: 1rem 1.5rem;
  border-radius: 14px;
  font-size: 0.95rem;
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.75rem;
  border-radius: 999px;
  background: var(--brand-emerald);
  color: #ffffff;
  text-transform: uppercase;
  font-size: 0.65rem;
  letter-spacing: 0.2em;
}
.brand-light {
  background: linear-gradient(180deg, rgba(209, 250, 229, 0.25), #ffffff);
}
.lead {
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--brand-slate);
}
.lead-sm {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--brand-slate);
}
.checklist {
  list-style: none;
  padding-left: 0;
  margin: 0;
}
.checklist li {
  position: relative;
  padding-left: 1.75rem;
  margin-bottom: 0.85rem;
  color: var(--brand-muted);
}
.checklist li::before {
  content: "✔";
  position: absolute;
  left: 0;
  top: 0;
  color: var(--brand-emerald);
  font-weight: 700;
}
.dimension-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.75rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 20px 45px -32px rgba(15, 23, 42, 0.6);
}
.dimension-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--brand-slate);
  margin-bottom: 1rem;
}
.dimension-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.95rem;
  display: grid;
  gap: 0.8rem;
}
.dimension-list li span {
  display: inline-block;
  font-weight: 600;
  color: var(--brand-slate);
  margin-right: 0.35rem;
}
.note {
  font-size: 0.85rem;
  color: var(--brand-muted);
}
.timeline {
  display: grid;
  gap: 1.5rem;
}
.timeline-step {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
  padding: 1.2rem;
  border-radius: 16px;
  background: rgba(15, 118, 110, 0.08);
  border: 1px solid rgba(15, 118, 110, 0.15);
}
.step-index {
  background: var(--brand-emerald);
  color: #ffffff;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.step-title {
  font-weight: 600;
  color: var(--brand-slate);
  margin-bottom: 0.25rem;
}
.step-copy {
  color: var(--brand-muted);
  line-height: 1.4;
}
.callout-alert {
  background: rgba(248, 113, 113, 0.12);
  border-left: 4px solid rgba(248, 113, 113, 0.9);
  padding: 1.25rem 1.5rem;
  border-radius: 14px;
}
.callout-title {
  font-weight: 700;
  color: #b91c1c;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.75rem;
}
.callout-body {
  margin-top: 0.35rem;
  color: var(--brand-slate);
  font-size: 0.95rem;
}
.category-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(226, 232, 240, 0.55));
  border-radius: 18px;
  padding: 1.75rem;
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 25px 55px -40px rgba(15, 23, 42, 0.65);
}
.category-icon {
  font-size: 1.6rem;
}
.category-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-top: 0.6rem;
  color: var(--brand-slate);
}
.category-copy {
  margin-top: 0.75rem;
  color: var(--brand-muted);
  line-height: 1.5;
}
.metric-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 18px 40px -30px rgba(15, 23, 42, 0.6);
}
.metric-title {
  font-weight: 700;
  color: var(--brand-slate);
}
.metric-chip {
  display: inline-flex;
  align-items: center;
  background: rgba(15, 118, 110, 0.12);
  color: var(--brand-emerald);
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin: 0.65rem 0;
}
.metric-list {
  list-style: none;
  padding: 0;
  margin: 0;
  color: var(--brand-muted);
  display: grid;
  gap: 0.4rem;
}
.muted {
  color: var(--brand-muted);
  font-size: 0.85rem;
}
.override-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 1.75rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 22px 48px -36px rgba(15, 23, 42, 0.6);
}
.override-title {
  font-weight: 700;
  color: var(--brand-slate);
  margin-bottom: 0.75rem;
}
.override-list {
  margin: 0;
  padding-left: 1.25rem;
  display: grid;
  gap: 0.6rem;
  color: var(--brand-muted);
}
.preference-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.75rem;
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 20px 45px -32px rgba(15, 23, 42, 0.6);
}
.preference-title {
  font-weight: 700;
  color: var(--brand-slate);
  font-size: 1.05rem;
}
.preference-copy {
  margin-top: 0.65rem;
  color: var(--brand-muted);
  font-size: 0.95rem;
}
.preference-list {
  margin-top: 1rem;
  list-style: none;
  padding: 0;
  display: grid;
  gap: 0.45rem;
  font-family: 'Fira Code', monospace;
  font-size: 0.9rem;
  color: var(--brand-slate);
}
.worked-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 1.75rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 18px 38px -30px rgba(15, 23, 42, 0.6);
}
.worked-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--brand-slate);
  margin-bottom: 0.75rem;
}
.worked-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.45rem;
  color: var(--brand-muted);
}
.principle-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 1.75rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 18px 40px -32px rgba(15, 23, 42, 0.6);
}
.principle-title {
  font-weight: 700;
  color: var(--brand-slate);
  font-size: 1.05rem;
}
.principle-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.5rem;
  color: var(--brand-muted);
}
.text-gray-300 {
  color: rgba(209, 213, 219, 0.9) !important;
}
.text-gray-400 {
  color: rgba(148, 163, 184, 0.85) !important;
}
@media (max-width: 960px) {
  .pill {
    grid-column: span 6 / span 6;
  }
  .stat-card,
  .dimension-card,
  .category-card,
  .metric-card,
  .preference-card,
  .worked-card,
  .principle-card {
    grid-column: span 12 / span 12 !important;
  }
}
</style>
