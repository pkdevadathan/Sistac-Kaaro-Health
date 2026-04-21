# Kaaro Health — Digital Infrastructure Project

> **SISTAC Consulting Program, Purdue University**
> Client: Kaaro Health, Uganda | Spring 2026

---

## Overview

Kaaro Health operates 79+ nurse-led clinics across rural Uganda, delivering affordable healthcare through telemedicine, laboratory services, and medical logistics. This project was undertaken to help Kaaro Health transition from fragmented, offline-only workflows — WhatsApp ordering, paper logs, spreadsheets — toward a scalable, cloud-connected digital infrastructure.

Our work covers two primary deliverables:

1. **Cloud Migration Guide** — a comprehensive document outlining how Kaaro Health can migrate to AWS, covering architecture, phased roadmap, data strategy, security, cost, and change management.
2. **Inventory Analytics Dashboard** — an interactive web dashboard built on 7 months of real order data across all 79 clinics, demonstrating what centralized supply chain visibility looks like in practice.

---

## Live Dashboard

**[View the Dashboard →](https://sistac-kaaro-health.github.io/Sistac-Kaaro-Health/dashboard/)**

The dashboard runs entirely in the browser — no login, no installation required. It covers:

- Monthly order volume trends across the clinic network
- Item-level demand analysis across 19 medicine and supply categories
- Regional breakdown across Kamwenge, Ibanda, and Mbarara
- Top clinics by order volume

---

## Repository Structure

```
Sistac-Kaaro-Health/
├── README.md
├── dashboard/
│   └── index.html              # Standalone interactive dashboard (self-contained)
├── data/
│   └── kaaro_monthly_orders.xlsx   # 7-month order dataset (Sep 2025 – Mar 2026)
├── docs/
│   └── Kaaro_Cloud_Migration_Guide_v1.docx
└── assets/
    └── screenshots/            # Dashboard and architecture screenshots
```

---

## Cloud Migration Guide

The migration guide (`docs/`) covers the full journey from Kaaro's current offline-only state to a production-ready AWS cloud infrastructure. Key sections include:

- Current state assessment and migration readiness scoring
- Architecture principles grounded in Kaaro's constraints (offline-first, low-resource, mobile-first)
- AWS service recommendations with rationale and comparison against GCP and Azure
- Three-phase migration roadmap (Foundation → Integration → ERP)
- Data migration strategy including quality rules and quarantine patterns
- Security and Uganda data compliance considerations
- Cost estimates (~$42–75/month for all 79 clinics)
- Risk register and change management plan
- Immediate next steps with owners and timelines

---

## About the Data

The dataset covers **7 months of order records** (September 2025 – March 2026) across **79 clinics** in **3 regions** of Uganda, comprising **3,063 order line items** across **19 medicine and supply categories**. Data was provided directly by Kaaro Health and is used here for analytical and demonstration purposes.

---

## Team

This project was completed as part of the **SISTAC Consulting Program** at Purdue University's Daniels School of Business.

| Name | Program |
|---|---|
| Neha | Master of Engineering Management (MEM) |
| Sid | Master of Engineering Management (MEM) |
| Greeshma | Master of Engineering Management (MEM) |
| Shrey | Master of Engineering Management (MEM) |
| Deva | Master of Engineering Management (MEM) |

**Faculty / Program:** SISTAC Consulting Program, Purdue University
**Client Liaison:** Brendah, Kaaro Health

---

## How to Run the Dashboard Locally

No build step needed. Just clone the repo and open the file:

```bash
git clone https://github.com/Sistac-Kaaro-Health/Sistac-Kaaro-Health.git
cd Sistac-Kaaro-Health
open dashboard/index.html
```

Or simply double-click `dashboard/index.html` in your file explorer.

---

## How to Enable GitHub Pages

1. Go to **Settings → Pages** in this repository
2. Under **Source**, select **Deploy from a branch**
3. Set branch to `main`, folder to `/dashboard`
4. Save — the dashboard will be live at `https://sistac-kaaro-health.github.io/Sistac-Kaaro-Health/` within a few minutes

---

*Built with real data. Designed for real decisions.*
