# Swingers Sensation - PRD

## Original Problem Statement
A 100% FREE couples swinger website. Open registration, free messaging, chatrooms, forums, member search by name/city/state/area-code, personals, hot wife area, "Pretty Pussy of the Week" contest, anti-catfishing verification (ID+Selfie or custom admin gesture), media uploads, and a Stripe-powered "Support Us" donation page with founder mission statement.

## Admin Team
- Admin David D.
- Admin Beth D.

## Core Requirements
- 100% FREE — no premium tiers, no paywalls
- Open registration (auto-approved)
- Unlimited free messaging
- Verification system (ID+Selfie or admin-assigned task)
- Community guidelines emphasising respect and consent
- Stripe donations only (no payment for features)

## What's Been Implemented

### Phase 1 — Foundations
- Landing page with FREE emphasis
- Registration with profile preferences (gender, age, race, orientation, looking-for)
- JWT auth + Emergent Google OAuth
- Member directory with filters, Profile pages
- Unlimited messaging (free)
- Referral program
- Admin panel
- Community guidelines

### Phase 2 — Trust & Safety
- ID + Selfie verification
- Custom admin-task verification (e.g. "write 32 on paper")
- Admin notifications for verification requests
- Verified badge on profiles
- Likes/Favorites system

### Phase 3 — Media + Donations
- Photo & Video upload (Emergent Object Storage)
- "Support Us" Stripe donation page + founder mission statement
- Profile photo uploads

### Phase 4 — Community (May 2026)
- **Chatrooms** with 3-second polling chat, create/join rooms, messages
- **Forums** with 6 categories, create topics, threaded posts, post counts
- **Personals** with 6 categories (couple seeking, male/female seeking, group, hotwife, travel), respond/message CTA
- **Hot Wife Section** — dedicated feed with text posts + optional photo attachment, like/unlike, owner delete
- **Pretty Pussy of the Week Contest** — weekly entries from user media library, one entry & one vote per ISO week, last-week winner spotlight with crown
- Top Nav now exposes Chatrooms, Forums, Personals, Messages, Hot Wife, Contest
- Session persistence fixed: `/auth/login` now sets `session_token` HttpOnly cookie; App.js also rehydrates Authorization header from localStorage on boot

### Phase 5 — Member Search (June 2026)
- Profile Setup now collects **city, state, area code** (kept legacy free-text `location` for back-compat)
- `GET /api/members` supports **q** (full-text across name/city/state/location/area_code), **city**, **state** (2-letter), **area_code**, **gender**, **orientation**, **age_range** with regex+case-insensitive matching
- Members page rebuilt with debounced (300ms) search bar, collapsible advanced filter panel, active-filter chips, live result count, and richer cards (city, state, area code on each card)

## Backend Endpoints (new this phase)
- `GET/POST /api/chatrooms`, `POST /api/chatrooms/{id}/join`, `GET/POST /api/chatrooms/{id}/messages`
- `GET/POST /api/forums`, `GET /api/forums/{id}`, `POST /api/forums/{id}/posts`
- `GET/POST/DELETE /api/personals[/{id}]` (?category= filter)
- `GET/POST /api/contest/entries`, `POST /api/contest/entries/{id}/vote`, `GET /api/contest/winner`, `GET /api/contest/my-vote`
- `GET/POST/DELETE /api/hotwife/posts[/{id}]`, `POST /api/hotwife/posts/{id}/like`

## Data Models (Mongo collections)
- users, user_sessions, messages, media, verifications, notifications, donations, referrals, likes
- chatrooms, chatroom_messages
- forums, forum_posts
- personals
- contest_entries (week key = ISO `YYYY-Www`)
- hotwife_posts

### Phase 6 — Forgot Password (June 2026)
- `POST /api/auth/security-question` to set/update question + answer (answer bcrypt-hashed, normalised lowercase)
- `POST /api/auth/forgot-password/lookup` returns the question for a given email (returns null for unknown emails — no email enumeration)
- `POST /api/auth/forgot-password/reset` verifies answer (case-insensitive) and updates password; rate-limited to 5 failed attempts/hour
- Login page "Forgot Password?" link now wired to a new `/forgot-password` flow (email → security question → answer + new password → done)
- Profile Setup page now has a Security Question section with 7 preset questions + custom option

### Phase 7 — Engagement (June 2026)
- Dashboard now shows a **"Members near you"** widget — auto-shows up to 6 members matching your area code (falls back to state, then global)
- Dashboard now shows a **Security Question reminder banner** for users who haven't set one yet (drives forgot-password coverage, cuts support load)
- `/api/auth/me` now returns the `security_question` field (without the answer hash) so the frontend can detect setup state

### Phase 8 — Rebrand & Cleanup (June 2026)
- Renamed product from "Bookup your Hookup" → **"Swingers Sensation"** across all pages, nav, footers, and HTML title
- Removed all "North Alabama / Southern Tennessee" geographic references — now national/general
- Admin team reduced to **David D. and Beth D.** (Heather H. and Wendell S. removed)
- Removed residency proof upload endpoint + admin pending-users filter dependency
- New steamy hero banner with layered gradient overlays + red/gold haze on landing page
- Members page now shows a live "X new members this week (in your area)" social-proof banner via new `GET /api/members/stats/new-this-week`

## Backlog

### P0
- [ ] Real-time chat upgrade (WebSocket) — currently polling
- [ ] Profile photo enforcement before contest entry

### P1
- [ ] Email notifications (new message, verification approved, contest winner)
- [ ] Admin: pin/mod tools for forums + flagged personals
- [ ] Block/report users

### P2
- [ ] Refactor monolithic `server.py` (>1400 lines) into per-feature routers under `/app/backend/routes/`
- [ ] Mobile nav hamburger
- [ ] Advanced search filters (age range, location radius)

## Testing
- iteration_2.json: 100% backend, 100% frontend after fixing session cookie + nav links
- Pytest suite at `/app/backend/tests/test_new_features.py`
- Test creds in `/app/memory/test_credentials.md`
