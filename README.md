# 🌹 Romantic Birthday Surprise SPA for Shaalu (My Love)

An interactive, responsive single-page web application (SPA) crafted with endless love as an unforgettable birthday surprise. Built with modern HTML5, CSS3, and ES6 JavaScript, with authenticated Vercel hosting and Cloudinary CDN video delivery.

---

## ✨ Complete Journey & Features

1. **Private Login (The Love Vault):**
   - The passphrase is checked by a Vercel Function and is not stored in browser code.
   - Vercel Routing Middleware protects the main page and its media with a signed, HttpOnly session cookie.
   - A session expires after seven days.

2. **Welcome & Love Ticker (Page 2: A Birthday Dedication):**
   - Romantic greeting dedicated to **Shaalu (My Love)**.
   - Live love counter ticker tracking exact **Years, Days, Hours, Minutes, and Seconds** together since **August 10, 2026**.
   - Ed Sheeran's **"Perfect"** (`assets/audio/aud1.mp3`) begins playing with a smooth fade-in, starting right before the first romantic chorus (*"Baby, I'm dancing in the dark..."* at 52s).

3. **Chapters of Us (Page 3: Interactive Timeline):**
   - Vertical golden spine timeline celebrating special relationship milestones.
   - Photo cards with date badges, zoom effects, and customizable stories.

4. **The Memory Vault (Page 4: Polaroid Gallery):**
   - Realistic Polaroid cards with category filters (*All Memories, Adventures, Cozy Dates, Silly & Sweet*).
   - Interactive Lightbox modal popup on click.

5. **The Sealed Love Letter (Page 5: 3D Interactive Envelope):**
   - 3D envelope with a glowing golden wax seal.
   - Clicking unseals the flap and reveals MANIKA's heartfelt Sinhala love letter via a smooth typewriter animation (fully supporting Sinhala Unicode diacritics and emojis).

6. **The Grand Celebration & Birthday Cake (Page 6: Celebrate):**
   - 3-tier birthday cake with glowing, flickering candle flames.
   - Blow detection via Microphone (Web Audio API) or tap/click.
   - Extinguishing candles triggers smoke puffs, fanfare, and fireworks confetti.
   - **Smart Audio Fade**: Automatically fades out "Perfect" (saving the exact pause position) and smoothly fades in the **Birthday Song** (`assets/audio/aud2.mp3`).
   - Romantic Love Coupon book modal with stamp animations and print/save options.

7. **The Love Quiz (Page 7: How Well Do You Know Us?):**
   - Interactive 5-question romantic memory quiz customized for Shaalu.
   - Immediate feedback, sound chimes, score tracking, and confetti.
   - Completion trophy and badge for 100% Soulmate Score.
   - **Audio Resume**: Leaving Page 6 smoothly fades out the Birthday song and resumes "Perfect" from the exact paused second with a smooth fade-in!

8. **Cloudinary Video Journey (Timeline, Gallery, Pages 8 and 9):**
   - Seven CDN-hosted videos share one centralized configuration in `assets/js/media-config.js`.
   - Cloudinary `f_auto,q_auto` delivery URLs and `so_0,f_auto,q_auto` JPG posters are generated automatically.
   - A custom gold/burgundy player supplies poster previews, play/pause, seeking, time, mute, fullscreen, and buffering feedback.
   - **Smart staged loading:** only the active viewport video is loaded first; the next journey video and next video page are prefetched sequentially after useful buffering.
   - **Automatic audio hand-off:** background music fades and pauses while a video plays, then resumes smoothly after pause or completion when the listener had music enabled.
   - Romantic Sinhala dedication and loving promise signed by **MANIKA 💌**.

9. **Grand Finale (Page 9: Love You Forever):**
   - Displays **"LOVE YOU FOREVER"** in large, glowing animated typography with golden-rose shimmer and radiant aura.
   - Giant 3D Beating Heart pulsating to a realistic heartbeat rhythm with concentric aura rings.
   - Ambient floating glowing hearts ascending up the screen.
   - Interactive heart burst shower on tap/click.
   - Eternal Sinhala pledge and journey replay controls.

10. **Smooth Navigation & Scroll-to-Top Engine:**
    - Clicking "Next" or navigating between any page immediately and seamlessly loads the target page from the very top (`scrollTop = 0`).
    - Fully responsive across all devices (Mobile, Tablet, Desktop).

---

## 📁 Project & Assets Directory Structure

```text
romantic-birthday-spa/
│
├── index.html            # Complete Single-Page Application (HTML + CSS + JS)
├── login.html            # Public login screen; protected content loads after login
├── middleware.js         # Protects the app and its media on Vercel
├── api/auth/login.js     # Server-side passphrase check and session cookie
├── lib/session.js        # Signed session and passphrase verification
├── dev-server.js         # Local preview server for testing the login
├── package.json          # Local preview command and Vercel Functions dependency
├── package-lock.json     # Locked dependency versions
├── README.md             # Project documentation
├── vercel.json           # Vercel deployment config
├── CLOUDINARY_SETUP_GUIDE.md # Beginner-friendly Sinhala setup manual
│
└── assets/
    ├── README.txt        # Media files guide
    ├── audio/
    │   ├── aud1.mp3      # Ed Sheeran - Perfect (background song)
    │   ├── aud2.mp3      # Birthday Celebration Song (Page 6)
    │   ├── perfect.mp3   # Compatibility alias for aud1
    │   └── birthday.mp3  # Compatibility alias for aud2
    ├── js/
    │   ├── media-config.js       # All seven Cloudinary URLs and poster helpers
    │   └── video-experience.js   # Luxury player and staged loading queue
    └── images/           # Photos for timeline & polaroids
```

---

## 🚀 How to View Locally
- The protected site must be served through Vercel; opening `index.html` directly with `file://` does not run the server-side login.
- Run `npm install`, create an ignored `.env.local` file containing `VAULT_PUZZLE_ANSWER` and `SESSION_SECRET`, then run `npm run dev`.
- Open `http://127.0.0.1:3000`. The local preview uses the same login handler and session checks.

## 🔐 Private Login Setup for Vercel

Before deploying, add these environment variables to the Vercel project (Settings → Environment Variables):

- `VAULT_PUZZLE_ANSWER`: the normalized answer to the on-screen memory puzzle. The current puzzle combines the favorite color and beach-day date, with no spaces or punctuation.
- `SESSION_SECRET`: a separate random secret with at least 32 bytes. Generate one locally with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`.

Add both variables to Production, Preview, and Development if those environments will be used, then redeploy. Keep the values out of GitHub and never put them in `index.html`. For local Vercel development, use an ignored `.env.local` file; `.env.example` contains names only. The hints point toward the memories without stating their answers, but this remains a playful puzzle entrance rather than strong protection from someone who deliberately inspects the site.

## 🎥 Cloudinary Video Setup

Local MP4 files and the Git LFS rule have been removed. Upload the seven source videos to Cloudinary, then paste their original secure delivery URLs into `assets/js/media-config.js`. Do not add `f_auto`, `q_auto`, or poster transformations manually; the helper functions add them consistently. Full beginner steps and the filename-to-config mapping are in `CLOUDINARY_SETUP_GUIDE.md`.

Keep `cleanUrls` disabled: the login middleware intentionally exposes `/login.html`, and Vercel's clean URL redirect would change that path.
