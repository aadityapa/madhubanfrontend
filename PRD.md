# Product Requirements Document — Madhuban 360

**Version:** 1.2 (standalone initialization)  
**Status:** Draft

This document is written for a **new codebase** that does **not** assume access to any previous repository. It exists only to give **enough product context** to start: what the product is, who uses it, and on which platforms.

---

## How to use this document

- Use it when you bootstrap a **new folder or repo** and need shared context for people or tools.
- **Visual design** and **screen flows** are driven by your **design assets** (screenshots, references)—not by this PRD; flows may differ from any legacy app.
- **Legacy API integration code** is **optional reference material**. If useful, paste copies from the old project into the **repo root** or a **temporary folder** (e.g. `reference/api/`). You may or may not keep that code; the new app still talks to the **same backend APIs** when you wire them in.
- Deeper engineering notes (stack, monorepo, phases) are optional: [Implementation plan](./IMPLEMENTATION-PLAN.md).

---

## 1. Product summary

**Madhuban 360** is a property and facility operations platform. Organizations configure users, properties, and work; field teams execute tasks; supervisors check and validate work; managers approve and oversee outcomes. **Admin** work that does not belong on a phone stays in a **web** app; **field** roles use a **mobile** app.

Greenfield target: **one React web app (admin)** and **one React Native + Expo app** for all field roles, reusing the **existing REST backend** without requiring a backend rewrite for core flows.

---

## 2. Goals

- Split **admin (web)** and **field (mobile)** clearly.
- Support **five roles** with correct platform and permissions (see below).
- Implement a **new UI** with **semantic styling** (e.g. `primary`, `secondary`, `surface`)—no ad hoc hex in feature code once tokens are in place.
- Integrate with the **same APIs** the legacy frontends already used, when you implement each area.

---

## 3. Non-goals (for this PRD)

- Prescribing navigation, screen order, or step-by-step flows (the **new design** owns that).
- Listing file paths or folder structure from an old repo.
- Backend redesign unless separately agreed.

---

## 4. Roles and responsibilities

| Role | Platform | Maker / checker / approver | Summary |
|------|----------|----------------------------|---------|
| **Admin** | Web (React) | — | Configuration and oversight: users, properties, org-level tasks, dashboards, reports, and admin modules (e.g. facility, HRMS, sales/lease, legal, accounts, store) as you ship them. |
| **Staff** | Mobile (Expo) | Maker | Field execution: assigned work, tasks, profile, reports, notifications. |
| **Security Guard** | Mobile (Expo) | Maker (Staff-class) | Same **product slice** as Staff unless you later split UX or permissions; confirm the backend **role** value when integrating auth. |
| **Supervisor** | Mobile (Expo) | Checker | Verify and validate work, visibility into staff/attendance as the product requires. |
| **Manager** | Mobile (Expo) | Approver | Approvals and oversight over supervisors and the task pipeline. |

**Boundaries:** Admin is **web-only** for real configuration. Field roles share **one mobile codebase** with routing by role. Staff and Security Guard may share one stack until you need a separate experience.

---

## 5. Assumptions

- **Backend:** Existing REST API remains the contract; wire env and clients in the new app when you build each feature.
- **Design:** Screens and flows come from **design assets** and your review.
- **Optional reference code:** Pasted legacy API helpers are only a shortcut; they are not part of this PRD.

---

## 6. Product domains (roadmap hint)

Users, properties, tasks, dashboard, reports; facility, HRMS, sales/lease, legal, accounts, store—as needed per release.

---

## 7. Success criteria (high level)

- Correct **platform** and **role** after sign-in (web admin vs mobile field; no admin-only capabilities exposed on mobile inappropriately).
- **Semantic design tokens** used for styling once implementation starts.
- Features align with **backend behavior** as you connect each integration.

---
