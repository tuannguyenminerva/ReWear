# #designthinking Documentation

Internal Team Document · April 2026  
Team: Sofiia Bilyk · Shichang Zhang · Akbota Kengeskhan · Tuan Nguyen · Batyrkhan Kanash

---

## 1. Project Overview

ReWear is a web application that helps users track their outfit wear patterns and resurfaces wardrobe items they may have forgotten. The core loop: a user photographs or scans an outfit, a YOLO-based computer vision model identifies clothing items and logs them, and the app periodically reminds users of items not worn in 30+ days.

| Layer | Technology |
|---|---|
| Frontend | React + Vite (TypeScript) |
| Backend | Flask (Python) |
| Database | SQLite → planned PostgreSQL |
| CV Model | YOLO (ultralytics) fine-tuned on DeepFashion; color detection via OpenCV |
| Auth | Flask sessions |

---

## 2. Design Thinking Framework

The team structured development around three interview rounds, ensuring user feedback drove each sprint rather than arriving only at the end.

| Stage | When | What happened |
|---|---|---|
| **Empathise** | Feb 14–21 | Concept-only interviews before any prototype — understood habits and feature appetite |
| **Define** | Feb 21 | Full team meeting converted findings into a feature-vote table that set MVP 1 scope |
| **Ideate** | Feb 21 – Mar 1 | Two early designs were refined and merged into one unified flow, incorporating Interview I feedback |
| **Prototype** | Feb–Apr | MVP 1 (PR #12): frontend + backend + database + camera. MVP 2 (PR #19): visual and functional revisions based on Interview II feedback. MVP 3 (PR #26): final version |
| **Test** | Feb, Mar, Apr | Three interview rounds: concept only → working local build → near-final deployed build |

### GitHub PR Workflow

The team operated on a **4-2-1 weekly cycle**:
- **4 days** — developers work on assigned tasks and submit pull requests
- **2 days** — team reviews PRs and leaves comments
- **1 day** — developers review comments before the weekly meeting

---

## 3. Interview Round I — Concept & Figma Demo Validation

**When:** February 20–24, 2026 (questions created Feb 17; results presented Feb 21)  
**Where:** Mixed, in-person and remote  
**Who conducted:** Sofiia Bilyk and Akbota Kengeskhan  
**Participants:** Mixed Minerva students and non-Minerva users

---

### 3.1 Questions and Verbatim Answers

Here is a link to the form responses — [ReWear Survey I (Responses)](https://docs.google.com/spreadsheets/d/1iwNE02sUKX3W4CMMg8UWKpaIDYpqKY_aqxpRcel5tTI/edit?usp=sharing).


### 3.2 Feature Vote Decisions — February 21 Team Meeting

Interview I findings were presented and converted into the following decisions:

| Feature | Decision | User evidence |
|---|---|---|
| Edit/correction flow for AI scan | ✅ Add | Users confused by inability to fix wrong detections (R2, R5) |
| Registration & login page | ✅ Add | Expected baseline by all respondents |
| Live scanning + upload from gallery | ✅ Add | Split 4/5/2 across methods — both needed; speed is what matters |
| Add looks retroactively with custom date | ✅ Add | 8/11 Yes |
| Color accent improvements to UI | ✅ Add | Multiple users: "add colour," B&W "too flat" |
| Wardrobe editing (add, archive, delete) | ✅ Add | Users expected active wardrobe management |
| Customizable tags | ✅ Add | 8/11 Yes + 3 Maybe |
| Photo-only upload (no scan fallback) | ❌ Remove | Users prefer scanning; upload kept only as fallback |
| Chatbot assistant | ❌ Remove | API access prohibited + low demand (1/11 mentioned it) |
| Gamification / streaks | ❌ Remove | 1/11 mentioned; others showed no interest |
| Postponing reminders (seasonal) | ⏳ Decide later | Raised in feedback; out of MVP scope |
| Cost-per-wear tracking | ⏳ Decide later | Only 2/11 prioritised it |
| Swap/sell functionality | ⏳ Decide later | 5/11 wanted it — considered post-MVP |
| Social sharing | ⏳ Decide later | 5/11 wanted it — considered post-MVP |

---

### 3.3 Conclusions from Interview I

The concept was validated with high confidence. 10/11 users had discovered forgotten wardrobe items, 0/11 currently tracked their clothing, and the average adoption intent was 7.5/10. Speed of entry was the single most important product principle. Gamification was explicitly de-prioritised. Two respondents independently flagged the seasonal limitation of the "forgotten items" reminder.

### 3.4 Assumption Corrected by Interview I

The team assumed users would have a strong preference between real-time scanning and photo upload as competing features. Interview I showed a 4/5/2 split with no dominant preference. Users care about speed and accuracy, not the mechanism. This corrected the design: the two methods were merged into one combined fast-entry flow rather than treated as separate UI paths.

---

## 4. Interview Round II — Working MVP Testing

**When:** March 31, 2026 (questions created March 11; form completed March 18; results discussed April 4)  
**Where:** Mixed,  in-person and remote  
**Who conducted:** Shichang Zhang and Tuan  
**Participants:** 3 respondents

---

### 4.1 Questions and Verbatim Answers

Here is a link to the form responses — [ReWear Survey II (Responses)](https://docs.google.com/spreadsheets/d/1o_5xnvZ62BjPtlMot2S-pauQr5BzJFvyAF_jGQjTrgA/edit?usp=sharing).


### 4.2 How Interview II Improved the Design

- **MVP 2 visual redesign** — Made the layout a bit smaller so there is a wider overview on the single screen view, compacted panels.
- **Postpone feature for seasonal reminders** — Raised by two separate interviewees; the team added a "Postpone until" mechanism so reminders for seasonally-irrelevant items can be dismissed.
- **Upload photo option in the wardrobe** — Added an option to upload a photo of the item in the wardrobe instead of indicating a link, as it's often inconvenient.

### 4.3 Conclusions from Interview II

The working prototype exposed friction that concept-stage Interview I could not. Visual credibility is a genuine concern. The forgotten-items feature has a real-world seasonal limitation. Camera detection at ~70% accuracy means users cannot trust it enough to skip review, undermining the core time-saving promise. But as a team we decided that it's good enough, as the item recognition model development goes beyond topics of CS162.

### 4.4 Assumption Corrected by Interview II

The team assumed users would be tolerant of partial camera accuracy and treat manual entry as a minor inconvenience. Interview II showed this was wrong — needing to manually type name and color felt like a feature failure. The design response: manual entry must be a first-class, deliberately-designed path, not a fallback state.

---

## 5. Interview Round III — Near-Final Build

**When:** April 19, 2026 (questions discussed April 11; form created April 15)  
**Where:** Mixed,  in-person and remote  
**Who conducted:** Sofiia Bilyk and Batyrkhan Kanash  
**Participants:** 4 respondents

---

### 5.1 Questions and Verbatim Answers

Here is a link to the form responses — [ReWear Survey III (Responses)](https://docs.google.com/spreadsheets/d/1GmrzLoIwA73lEmuVVdOTQm_GhO9W_zdVSsgSj5EiLMc/edit?usp=sharing).


### 5.2 Conclusions from Interview III

The visual redesign worked. Both respondents praised the design. The value proposition now communicates clearly (both summarised it accurately in one sentence). The 3–5 second logging time was confirmed as the expected experience. Two concrete actions were identified: the capture button is not discoverable alongside gallery upload, and there is a duplicate close button and duplicate search element. The instruction page should become a one-time onboarding modal shown only at registration.

### 5.3 Assumption Corrected by Interview III

Interview III confirmed that design of the app is appropriate: "I love it. Looks very clean" is a direct reversal of the earlier criticism. This closed the design feedback loop successfully. The weekly activity graph, however, was independently flagged as unnecessary by both respondents.

---

## 6. Cross-Round Analysis: How Interviews Shaped the Product

| Change made | User evidence | Round |
|---|---|---|
| Dropped gamification entirely | Only 1/11 mentioned incentive points | Interview I |
| Merged scan + upload into one flow | Split 4/5/2 — speed matters, not the method | Interview I |
| Added manual tag correction as first-class feature | Users confused by inability to fix wrong AI detections | Interview I |
| Color accents added to UI | Multiple users asked for colour; B&W felt flat | Interview I |
| Added onboarding cues (photo type, where to click) | R2: "What button to press? What kind of picture?" | Interview I |
| Added retroactive outfit logging | 8/11 said Yes | Interview I |
| MVP 1 built and shipped | Feature scope set by Interview I votes | Post Interview I → PR #12 |
| Full visual redesign for MVP 2 | Frontend "vibecoded"; font "looks so claude" | Interview II → PR #19 |
| Seasonal snooze discussion opened for reminders | Two separate interviewees flagged weather context | Interview II |
| Manual entry redesigned as first-class path | Camera failure experienced as feature failure | Interview II |
| Bug fix: capture button discoverability | R1: "I couldn't see capture straight away" | Interview III |
| Bug fix: double close button + duplicate search | R2: "There is a double button to close details" | Interview III |

---

## 7. Reflection on the Design Thinking Process

Conducting Interview I before any prototype validated the concept without wasting engineering time. The observation-first approach in Interview II surfaced real usability failures that direct questions alone would not have caught. The three-round structure created a genuine feedback loop: Interview I shaped MVP 1 (PR #12), Interview II triggered the MVP 2 redesign (PR #19), and Interview III confirmed the redesign worked. The most important decisions came from user evidence, not team assumption.
