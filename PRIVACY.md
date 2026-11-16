# Privacy Policy — Zero-Telemetry Kids (ZTK) & Dean's Kids Commons

* **Last Updated:** November 2026
* **Scope:** Applies to `https://kids.deaninno.com`, all associated Progressive Web App (PWA) clients, and the public open-source repository `endean-eng/zero-telemetry-kids`.
* **Target Audience:** Preschoolers (Ages 3–5), Parents, and Educators.

---

## 1. Executive Summary: The Zero-Telemetry Guarantee

**Zero-Telemetry Kids (ZTK)** is built on a strict engineering principle: **children's educational software should never monetize attention, track user behavior, or collect personal data.**

* **Zero Analytics & Tracking:** We do not use Google Analytics, Mixpanel, Meta Pixels, Firebase, Sentry performance monitors, or any third-party behavioral trackers.
* **Zero Ad-Tech & SDKs:** The application contains zero advertisements, zero promotional pop-ups, zero external affiliate links, and zero monetization frameworks.
* **100% Air-Gapped Client Execution:** Once loaded or installed as an offline Progressive Web App (PWA) to a tablet's Home Screen, the application runs entirely within the device's local memory and `CacheStorage`. Gameplay functions 100% without an active internet connection (Airplane Mode ready).

---

## 2. What Data We Do NOT Collect

By design, our code architecture has **no technical mechanism** to collect, store, or transmit any of the following:
* Personally Identifiable Information (PII) (names, ages, email addresses, phone numbers, or facial/voice biometrics).
* Device identifiers, IP addresses, advertising IDs, or geolocation data.
* Gameplay telemetry, session lengths, win/loss metrics, or behavioral interaction logs.

---

## 3. Local Storage & Client-State Retention

To provide a seamless, kid-friendly experience across sessions, the application stores minimal state **strictly inside your device's private local storage (`localStorage`)**:
* **Game Favorites & Customization:** Tapping the heart icon on any game card saves your preferred game pins locally on that specific device.
* **High Scores / Counting Progress:** Non-competitive tally counters (such as successful hops or harvested items) reside in temporary RAM or local device storage.
* **Service Worker Cache:** Static code assets (HTML, vanilla JavaScript modules, inline SVG vector primitives) are cached locally by your browser's Service Worker to enable instant offline loading.

**No local storage data ever leaves your device.** It is never synced to a remote server, cloud database, or third party.

---

## 4. Infrastructure & Hosting Delivery

When visiting `kids.deaninno.com` or fetching updates while connected to Wi-Fi:
* **GreenGeeks / GitHub Pages CDN:** Static files are served via standard HTTPS web infrastructure. Standard web server logs (such as IP addresses and request timestamps maintained by hosting providers for DDoS protection and system security) are managed under standard server-level hosting terms and are never accessed, aggregated, or utilized by us for tracking or profiling.

---

## 5. Voluntary Parent Feedback Form

If a parent or educator chooses to use the voluntary feedback / game-suggestion form located on the parent portal (`kids.deaninno.com/feedback/`):
* Submissions are processed via a secure Google Apps Script backend solely for the purpose of reviewing community game feature requests.
* Providing an email address is strictly optional and is used exclusively if you explicitly request a direct reply regarding your suggestion. It is never sold, shared, rented, or added to marketing mailing lists.

---

## 6. Children's Online Privacy Protection Act (COPPA) & Compliance

Because ZTK collects **zero personal information from children**, does not operate external network beacons, and features no user accounts or social sharing mechanics, the application is inherently compliant with COPPA, FERPA, and international children's privacy standards.

---

## 7. Contact & Open-Source Verification

Because `zero-telemetry-kids` is a 100% open-source project (`endean-eng/zero-telemetry-kids`), you do not have to take our word for it—every line of source code, network request, and storage handler can be audited directly on GitHub[cite: 1, 2, 3].

If you have security questions or feedback regarding this privacy statement, you may open an issue on our GitHub repository or contact us via `deaninnovativedesign.com`.