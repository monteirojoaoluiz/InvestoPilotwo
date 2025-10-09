# Questionnaire → Profile Scoring Spec (for implementation)

This markdown is a complete, code-friendly spec of the 14-question investor questionnaire and the mapping to output features.

---

## 0) Output Features (what your agent must produce)

```json
{
  "risk_tolerance": 0, // number 0..100
  "risk_capacity": 0, // number 0..100
  "investment_horizon": 0, // number 0..100
  "investor_experience": 0, // number 0..100
  "regions_selected": [], // array of region codes (see Q4)
  "industry_exclusions": [] // array of industry codes (see Q14)
}
```

**Clamp all numeric outputs to [0, 100].**

---

## 1) Questions

### Q1 — Financial Journey

**qid:** `Q1_journey`
**type:** single
**options:**

| aid | label                                         | Effects                           |
| --- | --------------------------------------------- | --------------------------------- |
| `A` | I’m early in my career and building wealth    | `Horizon = 70`; **Capacity = 40** |
| `B` | I’m mid-career and focused on growing assets  | `Horizon = 80`; **Capacity = 70** |
| `C` | I’m within 10 years of retirement             | `Horizon = 0`; **Capacity = 50**  |
| `D` | I’m retired and prioritising income stability | `Horizon = 20`; **Capacity = 20** |

---

### Q2 — Feeling About Market Ups/Downs

**qid:** `Q2_drawdowns`
**type:** single

| aid | label                               | Effects on Risk Tolerance |
| --- | ----------------------------------- | ------------------------- |
| `A` | I’d rather avoid big drops…         | `−30`                     |
| `B` | I’m okay with some swings…          | `0`                       |
| `C` | I’m comfortable with larger swings… | `+30`                     |

---

### Q3 — When Will You Use This Money?

**qid:** `Q3_horizon_need`
**type:** single

| aid | label          | Effects                          |
| --- | -------------- | -------------------------------- |
| `A` | Within 5 years | `Horizon = -50`; `Tolerance −30` |
| `B` | In ~5–15 years | `Horizon = -20`; `Tolerance 0`   |
| `C` | In >15 years   | `Horizon = +20`; `Tolerance +30` |

---

### Q4 — Regional Preference (Multi-select)

**qid:** `Q4_regions`
**type:** multi-select (0–5; default → all)
**options (return these codes):**

| code           | label                                                             |
| -------------- | ----------------------------------------------------------------- |
| `NL`           | Netherlands (NL)                                                  |
| `EU_EX_NL`     | Europe ex-NL                                                      |
| `US`           | United States                                                     |
| `DEV_EX_US_EU` | Developed ex-US & ex-Europe (Canada, Japan, AU/NZ, SG/HK, Israel) |
| `EM`           | Emerging Markets (China, India, LatAm, EMEA, SE Asia EM)          |

**Effect:** sets `regions_selected` to the selected codes.

---

### Q5 — Industry Exclusions (Multi-select “keep included” UI)

**qid:** `Q5_industries`
**type:** multi-select (checkboxes where **checked = allowed**; unchecked = exclude)
**prompt:**

> _Is it okay for your portfolio to include the following?_
> _Uncheck any you want to exclude. Leaving all checked means no exclusions. Exclusions may reduce diversification and affect returns._

**All possible industry codes:**

| code            | label                                                   |
| --------------- | ------------------------------------------------------- |
| `TOBACCO`       | Tobacco                                                 |
| `FOSSIL_FUELS`  | Fossil fuels                                            |
| `DEFENSE`       | Defense industry                                        |
| `GAMBLING`      | Gambling                                                |
| `ADULT`         | Adult entertainment                                     |
| `NO_ESG_SCREEN` | Funds without a sustainability focus (no ESG screening) |

**Effect:** compute `industry_exclusions = ALL_CODES − selected_codes`.

---

### Q6 — Income Stability Next 5 Years

**qid:** `Q6_income_stability`
**type:** single

| aid | label                                     | Effect on Risk Capacity |
| --- | ----------------------------------------- | ----------------------- |
| `A` | Very stable (e.g., tenure)                | `+40`                   |
| `B` | Somewhat stable                           | `+20`                   |
| `C` | Potentially unstable (commission/startup) | `−10`                   |

---

### Q7 — Emergency Fund

**qid:** `Q7_emergency_fund`
**type:** single

| aid | label                | Effect on Risk Capacity                 |
| --- | -------------------- | --------------------------------------- |
| `A` | Yes, 3–6+ months     | `+20`                                   |
| `B` | Partial (1–3 months) | `+10`                                   |
| `C` | No emergency fund    | **set capacity to `0` (hard override)** |

> If `C`, capacity is 0 **after clamping** and overrides all other capacity adjustments.

---

### Q8 — Debt Situation

**qid:** `Q8_debt`
**type:** single

| aid | label              | Effect on Risk Capacity |
| --- | ------------------ | ----------------------- |
| `A` | Low or no debt     | `+20`                   |
| `B` | Manageable debt    | `+10`                   |
| `C` | High-interest debt | `−20`                   |

---

### Q9 — Investment Experience

**qid:** `Q9_investing_experience`
**type:** single

| aid | label                      | Effects                             |
| --- | -------------------------- | ----------------------------------- |
| `A` | No experience              | `Experience = 20`; `Tolerance −10`  |
| `B` | Beginner (a few years)     | `Experience = 40`; `Tolerance 0`    |
| `C` | Intermediate (diversified) | `Experience = 70`; `Tolerance +10`  |
| `D` | Advanced (active mgmt)     | `Experience = 100`; `Tolerance +20` |

---

### Q10 — Investing Knowledge

**qid:** `Q10_investing_knowledge`
**type:** single

| aid | label                          | Effect on Investor Experience |
| --- | ------------------------------ | ----------------------------- |
| `A` | Beginner (learning basics)     | `+0`                          |
| `B` | Intermediate (diversification) | `+10`                         |
| `C` | Advanced (technical, etc.)     | `+20`                         |

---

### Q11 — Investor Profile

**qid:** `Q11_investor_profile`
**type:** single

| aid | label            | Effects                        |
| --- | ---------------- | ------------------------------ |
| `A` | Dividend-focused | `Tolerance +0`; `Horizon −10`  |
| `B` | Balanced         | `Tolerance +10`; `Horizon +0`  |
| `C` | Growth-focused   | `Tolerance +20`; `Horizon +10` |

---

### Q12 — 20% Loss Reaction

**qid:** `Q11_loss_reaction`
**type:** single

| aid | label           | Effect on Risk Tolerance |
| --- | --------------- | ------------------------ |
| `A` | Sell everything | `−40`                    |
| `B` | Sell some       | `−20`                    |
| `C` | Hold and wait   | `+10`                    |
| `D` | Buy more        | `+30`                    |

---

### Q13 — Annual Household Income

**qid:** `Q12_income`
**type:** single

| aid | label         | Effect on Risk Capacity |
| --- | ------------- | ----------------------- |
| `A` | Under $50,000 | `−20`                   |
| `B` | $50k–$100k    | `0`                     |
| `C` | $100k–$250k   | `+10`                   |
| `D` | $250k+        | `+20`                   |

---

### Q14 — Approximate Net Worth (ex-primary residence)

**qid:** `Q13_net_worth`
**type:** single

| aid | label            | Effect on Risk Capacity |
| --- | ---------------- | ----------------------- |
| `A` | Under $100,000   | `−20`                   |
| `B` | $100k–$500k      | `0`                     |
| `C` | $500k–$1,000,000 | `+10`                   |
| `D` | $1,000,000+      | `+20`                   |

---

## 6) Worked Example

**Responses (example):**

```json
{
  "Q1_journey": "B",
  "Q2_drawdowns": "B",
  "Q3_horizon_need": "C",
  "Q4_regions": ["US", "EM"],
  "Q5_industries": ["TOBACCO", "DEFENSE", "GAMBLING", "ADULT"], // allowed (checked)
  "Q6_income_stability": "B",
  "Q7_emergency_fund": "A",
  "Q8_debt": "B",
  "Q9_investing_experience": "C",
  "Q10_investing_knowledge": "B",
  "Q11_investor_profile": "C",
  "Q11_loss_reaction": "C",
  "Q12_income": "C",
  "Q13_net_worth": "B"
}
```

**Step-by-step computation:**

### Risk Tolerance

- **Start:** base = 0
- Q2_drawdowns (B): +0
- Q3_horizon_need (C): +30
- Q9_investing_experience (C): +10
- Q11_investor_profile (C, growth-focused): +20
- Q11_loss_reaction (C, hold and wait): +10
- **Total:** 0 + 0 + 30 + 10 + 20 + 10 = **70**

### Risk Capacity

- **Base:** Q1_journey (B, mid-career) = 70
- Q6_income_stability (B): +20
- Q7_emergency_fund (A): +20
- Q8_debt (B): +10
- Q12_income (C, $100k-$250k): +10
- Q13_net_worth (B, $100k-$500k): +0
- **Total:** 70 + 20 + 20 + 10 + 10 + 0 = 130 → clamped to 100
- **Final check:** Q7_emergency_fund ≠ C, so no hard override to 0
- **Result:** **100**

### Investment Horizon

- **Base:** Q1_journey (B, mid-career) = 80
- Q3_horizon_need (C, >15 years): +20
- Q11_investor_profile (C, growth-focused): +10
- **Total:** 80 + 20 + 10 = 110 → clamped to 100
- **Result:** **100**

### Investor Experience

- Q9_investing_experience (C, intermediate): base = 70
- Q10_investing_knowledge (B, intermediate): +10
- **Total:** 70 + 10 = **80**

### Regions Selected

- Q4_regions: `["US","EM"]`

### Industry Exclusions

- Q5_industries (checked/allowed): `["TOBACCO","DEFENSE","GAMBLING","ADULT"]`
- All possible codes: `["TOBACCO","FOSSIL_FUELS","DEFENSE","GAMBLING","ADULT","NO_ESG_SCREEN"]`
- Exclusions = ALL − allowed: `["FOSSIL_FUELS","NO_ESG_SCREEN"]`

**Output:**

```json
{
  "risk_tolerance": 70,
  "risk_capacity": 100,
  "investment_horizon": 100,
  "investor_experience": 80,
  "regions_selected": ["US", "EM"],
  "industry_exclusions": ["FOSSIL_FUELS", "NO_ESG_SCREEN"]
}
```

---

## 7) Implementation Checklist

- [ ] Apply bases first, then add modifiers, then clamp all values to [0, 100].
- [ ] If Q4_regions is empty → don't allow the user to proceed to the next question..
- [ ] Q5_industries input is the "allowed" list (checked items); convert to `industry_exclusions` via set difference: ALL_CODES − allowed_codes.
- [ ] Industry exclusions include handling of `NO_ESG_SCREEN` (if unchecked, excludes non-ESG funds).
- [ ] If Q5_industries is empty → don't allow the user to proceed to the next question.

---
