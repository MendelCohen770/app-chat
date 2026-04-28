# תכנון פרויקט — דרך לפרודקשן

> מסמך זה מרכז את כל המשימות הנדרשות כדי להביא את אפליקציית הצ'אט למצב **production-ready**.
> סדר העבודה מחולק ל-4 שלבים: **P0 (קריטי)** → **P1 (איכות)** → **P2 (פיצ'רים)** → **P3 (Nice-to-have)**.
>
> סימון משימות:
> - `[ ]` משימה פתוחה
> - `[x]` משימה הושלמה
> - `[~]` בעבודה / חלקית

---

## תוכן עניינים

1. [שלב P0 — אבטחה ויציבות (חובה)](#שלב-p0--אבטחה-ויציבות-חובה)
2. [שלב P1 — איכות, בדיקות ותשתית](#שלב-p1--איכות-בדיקות-ותשתית)
3. [שלב P2 — פיצ'רי מוצר חיוניים](#שלב-p2--פיצרי-מוצר-חיוניים)
4. [שלב P3 — שדרוגים מתקדמים](#שלב-p3--שדרוגים-מתקדמים)
5. [תזמון מוצע](#תזמון-מוצע)

---

# שלב P0 — אבטחה ויציבות (חובה)

> **מטרה:** סגירת חורי אבטחה קריטיים והכנה מינימלית לדיפלוי. ללא שלב זה — **אסור לעלות לפרודקשן**.

## P0.1 — תיקוני אבטחה דחופים בשרת

- [x] **תיקון באג Cookies `secure`**
  - [x] לעדכן ב-`server/src/controllers/user.controller.ts` ב-`login` / `verifyOTP` / `googleLogin`
  - [x] להחליף `secure: process.env.NODE_ENV !== 'production'` → `secure: process.env.NODE_ENV === 'production'`
  - [x] לוודא `sameSite: 'none'` רק עם `secure: true`, אחרת `'lax'`
  - [x] לבדוק ש-`httpOnly: true` בכל ה-cookies
- [x] **הסרת חשיפת OTP**
  - [x] להסיר את ה-OTP מתוך ה-response של `/otpService` ב-`user.controller.ts`
  - [x] לוודא שה-OTP נשלח **רק במייל** דרך `nodemailer`
  - [x] להוסיף הודעת מערכת ניטרלית למשתמש ("קוד נשלח אם המייל קיים")
- [x] **הסרת הדפסת DB URI**
  - [x] להסיר את `console.log` של `process.env.DB_CONNECTION` ב-`server/src/db/DBconnect.ts`
  - [x] להחליף בלוג נייטרלי: `"Connected to MongoDB"`
- [x] **בדיקת חובת משתני סביבה**
  - [x] בקובץ `index.ts` או `config.ts` לבדוק ש-`JWT_SECRET`, `DB_CONNECTION`, `CLIENT_ORIGIN`, `GOOGLE_CLIENT_ID` קיימים
  - [x] אם לא — לזרוק שגיאה ולעצור את התהליך
  - [x] לדרוש שאורך `JWT_SECRET >= 32` תווים
  - [x] commit: `git commit -m "feat(server): validate required env vars at startup"`

## P0.2 — Helmet, Rate Limiting, CORS

- [x] **Helmet**
  - [x] להתקין `helmet`
  - [x] להפעיל `app.use(helmet())` ב-`index.ts`
  - [x] להגדיר `contentSecurityPolicy` מותאם
  - [x] commit: `git commit -m "feat(server): add helmet with custom CSP policy"`
- [x] **Rate Limiting**
  - [x] להתקין `express-rate-limit`
  - [x] limiter כללי: 100 בקשות לדקה לכל IP
  - [x] limiter קשוח על `/login`, `/signUp`, `/otpService`: 5 לדקה
  - [x] limiter על `/sendMessage`, `/sendVoice`, `/sendMedia`: 30 לדקה
  - [x] commit: `git commit -m "feat(server): add endpoint-specific rate limiting"`
- [x] **חיזוק CORS**
  - [x] להגדיר `origin` כ-whitelist (לא רק מ-env)
  - [x] לוודא `credentials: true` נשמר רק ל-domains מוגדרים
  - [x] commit: `git commit -m "feat(server): enforce CORS whitelist with scoped credentials"`

## P0.3 — ולידציה מרכזית

- [x] **התקנת Zod**
  - [x] להתקין `zod` בשרת
  - [x] ליצור תיקיה `server/src/schemas/` עם סכמות ולידציה
  - [x] ליצור `validate.middleware.ts` שמקבל schema ומאמת `req.body`
  - [x] commit: `git commit -m "feat(server): add zod schemas and body validation middleware"`
- [x] **סכמות ולידציה**
  - [x] `auth.schema.ts` — login, signup, googleLogin, verifyOTP
  - [x] `user.schema.ts` — updateUser, changePassword, searchUser
  - [x] `message.schema.ts` — sendMessage, sendVoice, sendMedia
- [x] **חיבור ל-routes** — להחיל את ה-middleware בכל route רלוונטי
  - [x] commit: `git commit -m "feat(server): add zod validation schemas and apply validation middleware to routes"`

## P0.4 — אבטחת העלאות קבצים

- [x] **Multer config מאובטח**
  - [x] `fileFilter` שמאשר רק MIME types מורשים (image/jpeg, image/png, image/webp, audio/webm, audio/mpeg, video/mp4)
  - [x] תקרת גודל: תמונות 5MB, קול 10MB, וידאו 50MB
  - [x] שמות קבצים — UUID במקום שם מקורי
  - [x] תיקיות נפרדות לפי סוג
  - [x] commit: `git commit -m "feat(server): harden multer policy with strict MIME, UUID filenames, and typed upload folders"`
- [x] **הגנה על `/uploads`**
  - [x] לבדוק path traversal
  - [x] לשקול הגשת קבצים דרך controller עם בדיקת auth + בעלות
  - [x] לקבוע `Content-Disposition` נכון לקבצי וידאו/קול
  - [x] commit: `git commit -m "feat(server): protect uploads route with auth ownership checks and safe media headers"`

## P0.5 — Error Handling גלובלי

- [x] **Error Middleware**
  - [x] ליצור `server/src/middlewares/errorHandler.ts`
  - [x] לתפוס שגיאות אחידות (Zod, Mongoose, Auth, Generic)
  - [x] להחזיר JSON עם `{ message, code }` בלי stack trace בפרודקשן
  - [x] commit: `git commit -m "refactor(server): unify global error responses to message/code format"`
- [x] **404 Handler**
  - [x] להוסיף `app.use((req, res) => res.status(404).json({ message: 'Not Found' }))`
- [x] **AsyncHandler wrapper**
  - [x] עוטף async controllers ומעביר שגיאות ל-error middleware
  - [x] commit: `git commit -m "refactor(server): finalize 404 fallback and async error forwarding"`

## P0.6 — Protected Routes ב-Client

- [x] **ProtectedRoute Component**
  - [x] ליצור `client/src/components/ProtectedRoute.tsx`
  - [x] בדיקה של user ב-context + redirect ל-`/`
  - [x] commit: `git commit -m "feat(client): add ProtectedRoute guard based on user context"`
- [x] **עטיפת routes**
  - [x] לעטוף `/home` ו-`/profile` ב-`ProtectedRoute`
  - [x] commit: `git commit -m "feat(client): guard home and profile routes with ProtectedRoute"`
- [x] **ErrorBoundary**
  - [x] ליצור `client/src/components/ErrorBoundary.tsx`
  - [x] לעטוף את כל האפליקציה ב-`main.tsx`
  - [x] UI fallback מעוצב + כפתור Reload
  - [x] commit: `git commit -m "feat(client): add global ErrorBoundary with reload fallback UI"`

## P0.7 — איחוד משתני סביבה

- [x] **Client**
  - [x] לאחד הכל ל-`VITE_API_BASE_URL` (להסיר `VITE_SERVER_URL`)
  - [x] לעדכן את `vite-env.d.ts` עם הגדרות `ImportMeta.env`
  - [x] ליצור `client/.env.example`
  - [x] commit: `git commit -m "chore(client): unify env config under VITE_API_BASE_URL"`
- [ ] **Server**
  - [x] ליצור `server/.env.example` עם כל המשתנים הנדרשים
  - [x] לתעד כל משתנה (תיאור + ערך לדוגמה)
  - [x] commit: `git commit -m "chore(server): add documented .env.example for production-ready config"`

## P0.8 — קבצי תשתית בסיסיים

- [x] **`.gitignore`**
  - [x] לוודא ש-`uploads/` לא נכנס ל-Git (חוץ מ-`.gitkeep`)
  - [x] לוודא ש-`.env` ו-`*.env.local` ב-gitignore
- [x] **README ראשי**
  - [x] תיאור הפרויקט, סטאק, הוראות הרצה
  - [x] רשימת ENV variables
  - [x] איך להריץ dev/build/prod
- [x] **Healthcheck**
  - [x] להוסיף endpoint `/health` שמחזיר 200 + סטטוס DB
  - [x] להוסיף `/ready` שמחזיר 200 כשהשרת מוכן
  - [x] commit: `git commit -m "chore(repo): add root docs/gitignore and finalize health readiness endpoints"`

---

# שלב P1 — איכות, בדיקות ותשתית

> **מטרה:** הפיכת הקוד ליציב, ניתן לתחזוקה ומדיד. הכנת תשתית לדיפלוי אמיתי.

## P1.1 — Build & Run לפרודקשן

- [x] **Server Build Script**
  - [x] להוסיף `"build": "tsc"` ב-`server/package.json`
  - [x] להוסיף `"start": "node dist/index.js"`
  - [x] לוודא `outDir: "dist"` ב-`tsconfig.json`
  - [x] לוודא שתיקיית `uploads/` נשמרת בנתיב יחסי תקין
  - [x] commit: `git commit -m "chore(server): align production build scripts and fix stable uploads path"`
- [x] **Graceful Shutdown**
  - [x] טיפול ב-`SIGTERM` ו-`SIGINT`
  - [x] סגירה מסודרת של HTTP server, Mongo, Socket.IO
  - [x] commit: `git commit -m "chore(server): implement graceful shutdown for signals and services"`
- [x] **Server-side Logging**
  - [x] התקנת `pino` + `pino-pretty` ל-dev
  - [x] החלפת כל `console.log` ב-logger
  - [x] רמות: info, warn, error, debug
  - [x] correlation ID per request
  - [x] commit: `git commit -m "chore(server): standardize structured logging with correlation ids"`

## P1.2 — Docker & Deploy

- [x] **Dockerfile — Server**
  - [x] Multi-stage build (TypeScript → JS)
  - [x] Image מבוסס `node:20-alpine`
  - [x] חשיפת PORT, COPY uploads volume
  - [x] non-root user
  - [x] commit: `git commit -m "chore(server): add production multi-stage Dockerfile with non-root runtime"`
- [x] **Dockerfile — Client**
  - [x] Multi-stage build (Vite → static) + Nginx
  - [x] `nginx.conf` מותאם ל-SPA + reverse proxy ל-API
  - [x] commit: `git commit -m "chore(client): add production Dockerfile with nginx SPA and API proxy config"`
- [x] **docker-compose.yml**
  - [x] services: `mongo`, `redis`, `server`, `client`
  - [x] volumes ל-Mongo data ול-uploads
  - [x] networks פנימיים
  - [x] `.env` נטען אוטומטית
  - [x] commit: `git commit -m "chore(devops): add docker-compose stack with internal networks and persistent volumes"`
- [x] **`.dockerignore`** לכל service
  - [x] commit: `git commit -m "chore(devops): add dockerignore files for server and client builds"`

## P1.3 — CI/CD

- [x] **GitHub Actions — `.github/workflows/`**
  - [x] `lint.yml` — eslint + tsc על PR
  - [x] `test.yml` — הרצת בדיקות
  - [x] `build.yml` — בניית Docker images על main
  - [ ] (אופציונלי) `deploy.yml` ל-VPS / Render / Railway
  - [x] commit: `git commit -m "chore(ci): add GitHub Actions for lint, tests, and Docker builds"`
- [ ] **Branch Protection**
  - [ ] חובה לעבור CI לפני merge (`Lint and Typecheck`, `Test`)
  - [ ] חובה PR review (לפחות 1 Approval)
  - [ ] הגדרה ב-GitHub: `Settings -> Branches -> Add branch protection rule` עבור `main`

## P1.4 — Linting & Formatting

- [x] **Prettier**
  - [x] התקנה והגדרת `.prettierrc` משותף לכל הפרויקט
  - [x] script `format` בכל package
  - [x] commit: `git commit -m "chore(format): add shared Prettier config and format scripts for client and server"`
- [x] **ESLint לשרת**
  - [x] `.eslintrc.cjs` לשרת עם TypeScript ESLint
  - [x] חוקים: no-unused-vars, no-explicit-any, consistent-imports
  - [x] commit: `git commit -m "chore(server): add TypeScript ESLint config and lint script with core rules"`
- [x] **Husky + lint-staged**
  - [x] pre-commit: lint + format על staged files
  - [x] pre-push: tsc check
  - [x] commit: `git commit -m "chore(git-hooks): add husky and lint-staged with pre-commit and pre-push checks"`
- [ ] **Commitlint** (אופציונלי)
  - [ ] convention: `feat:`, `fix:`, `chore:` וכו'

## P1.5 — בדיקות

- [ ] **Server — Vitest + Supertest**
  - [x] התקנה והגדרה
  - [x] בדיקות יחידה: helpers, validators, middleware
  - [x] בדיקות אינטגרציה: auth flow, send message, get messages
  - [x] DB בדיקות מבודדות (`mongodb-memory-server`)
  - [ ] יעד כיסוי: 60%+
  - [x] commit: `git commit -m "test(server): setup Vitest + Supertest with unit, integration, and isolated DB tests"`
- [x] **Client — Vitest + React Testing Library**
  - [x] בדיקות לקומפוננטות מרכזיות (Login, MessageInput, MessageList)
  - [x] בדיקות hooks (UseUser, useChat, usePresence)
  - [ ] commit: `git commit -m "test(client): add Vitest + RTL coverage for key components and core hooks"`
- [ ] **E2E — Playwright**
  - [x] תרחישי flow: signup → login → send message → logout
  - [x] הרצה ב-CI
  - [ ] commit: `git commit -m "test(e2e): add Playwright auth-message flow and CI execution"`

## P1.6 — Database

- [x] **אינדקסים ב-Mongoose**
  - [x] `user.email` — unique index
  - [x] `user.username` — index
  - [x] `message` — compound index `{ sender, receiver, createdAt }`
  - [x] `otp.email` + TTL index (פג תוקף אוטומטי)
  - [ ] commit: `git commit -m "feat(server): add message and otp indexes for faster queries and OTP TTL cleanup"`
- [x] **Conversation Model**
  - [x] סכמת `conversation.schema.ts` — `participants[]`, `lastMessage`, `updatedAt`
  - [x] עדכון אוטומטי בכל הודעה חדשה
  - [x] שאילתות מחירוניות לפי `conversationId`
  - [ ] commit: `git commit -m "feat(server): add conversations model and message retrieval by conversationId"`
- [x] **Pagination**
  - [x] `getMessages` — limit + cursor (createdAt)
  - [x] `getAllUsers` — limit + page
  - [x] השלמה בצד client (infinite scroll)
  - [ ] commit: `git commit -m "feat(client): add contacts infinite scroll and complete pagination flow"`
- [x] **Soft Delete**
  - [x] שדה `deletedAt` במשתמשים והודעות
  - [x] שאילתות מסננות אוטומטית
  - [ ] commit: `git commit -m "feat(server): implement soft delete with automatic query filtering"`

## P1.7 — Logging, Monitoring & Observability

- [x] **Sentry**
  - [x] חשבון + DSN
  - [x] התקנה ב-server (`@sentry/node`)
  - [x] התקנה ב-client (`@sentry/react`)
  - [x] Source maps ב-production build
  - [ ] commit: `git commit -m "chore(observability): add sentry setup for server and client with production sourcemaps"`
- [x] **HTTP Access Logs**
  - [x] לבחור סטנדרט אחד: `pino-http` (מומלץ, עקבי עם `pino` שכבר קיים)
  - [x] להוסיף middleware מוקדם ב-`server/src/index.ts` עם `genReqId` (אם חסר) ו-`customProps` (route, userId כשקיים)
  - [x] לבצע redaction לשדות רגישים (cookies, authorization, tokens, passwords)
  - [x] להגדיר דילוג על `GET /health` ו-`GET /ready` כדי להפחית רעש בלוגים
  - [x] לוודא פורמט JSON בפרודקשן + `pino-pretty` רק ב-dev
  - [x] commit: `git commit -m "chore(observability): add pino-http access logs with redaction and health-check noise filtering"`
- [x] **Health Dashboard** (אופציונלי)
  - [x] לבחור ספק ניטור: BetterStack או UptimeRobot
  - [x] להגדיר בדיקת `GET /health` כל 30-60 שניות מ-2 אזורים לפחות
  - [x] להגדיר Alert channels (Email + Slack/Telegram) עם escalation אחרי 2-3 כשלונות רצופים
  - [x] להגדיר heartbeat job (אופציונלי) שמתריע גם במצב "שקט" כשאין תעבורה
  - [x] לתעד runbook קצר: מה עושים כשיש alert (DB down / process down / latency חריגה)
  - [x] commit: `git commit -m "chore(observability): document uptime dashboard setup, alerts, and incident runbook"`

## P1.8 — איחוד והקשחת ה-Frontend

- [x] **API Client אחיד**
  - [x] להחליף את כל ה-`fetch` ב-`axios` instance מרכזי
  - [x] interceptors: auth error → redirect, network error → toast
  - [x] commit: `git commit -m "refactor(client): unify HTTP via axios client and global interceptors"`
- [x] **Loading & Error States אחידים**
  - [x] Skeleton loaders ל-MessageList, UserList
  - [x] Error states מעוצבים
- [x] **Form Validation אחיד**
  - [x] React Hook Form + Zod resolver
  - [x] שימוש בכל הטפסים (Login, Signup, Profile, ChangePassword)
  - [x] commit: `git commit -m "refactor(forms): unify validation with react-hook-form and zod across auth and profile flows"`
- [x] **TypeScript types חזקים**
  - [x] שיתוף types בין client ל-server (תיקיית `shared/` או package)
  - [x] להגדיר `User`, `Message`, `Conversation` כ-types יחידים
  - [x] commit: `git commit -m "refactor(types): share User/Message/Conversation contracts across client and server"`

## P1.9 — תיעוד

- [ ] **README ראשי מורחב**
  - [ ] ארכיטקטורה (תרשים)
  - [ ] איך להריץ עם Docker
  - [ ] טבלת ENV variables
- [ ] **API Documentation**
  - [ ] Swagger / OpenAPI
  - [ ] route `/api/docs`
- [ ] **CONTRIBUTING.md** (אם open source)
- [ ] **LICENSE**

---

# שלב P2 — פיצ'רי מוצר חיוניים

> **מטרה:** השלמת חוויית צ'אט מודרנית לרמת מוצר אמיתי.

## P2.1 — Typing Indicators

- [ ] **Server**
  - [ ] socket events: `typing:start`, `typing:stop`
  - [ ] broadcast לחדר השיחה הרלוונטי בלבד
- [ ] **Client**
  - [ ] שליחת event ב-`MessageInput` עם debounce 1.5 שניות
  - [ ] תצוגת `"X is typing..."` ב-`MessageHeader`

## P2.2 — Read Receipts

- [ ] **Schema**
  - [ ] שדה `readBy: ObjectId[]` או `readAt: Date`
- [ ] **Server**
  - [ ] endpoint `PATCH /message/markRead`
  - [ ] socket event `message:read`
- [ ] **Client**
  - [ ] ✓ נמסר / ✓✓ נקרא ב-`MessageItem`
  - [ ] סימון אוטומטי כשהודעה במסך (IntersectionObserver)

## P2.3 — Edit & Delete Messages

- [ ] **Schema**
  - [ ] `editedAt`, `isDeleted`, `originalContent`
- [ ] **Server**
  - [ ] `PATCH /message/:id` — בדיקת בעלות + חלון זמן (15 דקות)
  - [ ] `DELETE /message/:id` — soft delete
  - [ ] socket events: `message:edited`, `message:deleted`
- [ ] **Client**
  - [ ] תפריט hover: ערוך / מחק
  - [ ] תצוגת "(נערך)" ליד הודעה
  - [ ] הודעה שנמחקה: "ההודעה נמחקה"

## P2.4 — Reactions

- [ ] **Schema**
  - [ ] `reactions: { userId, emoji }[]`
- [ ] **Server**
  - [ ] `POST /message/:id/react` + `DELETE /message/:id/react`
  - [ ] socket event `message:reacted`
- [ ] **Client**
  - [ ] כפתור הוספת תגובה (emoji picker מצומצם)
  - [ ] תצוגת תגובות מקובצות עם count

## P2.5 — Reply / Quote

- [ ] **Schema**
  - [ ] `replyTo: ObjectId` (ref to message)
- [ ] **Client**
  - [ ] כפתור Reply ב-hover
  - [ ] תצוגת הודעה מצוטטת מעל ההודעה
  - [ ] לחיצה על ציטוט → גלילה להודעה המקורית

## P2.6 — צ'אטים קבוצתיים

- [ ] **Conversation Schema**
  - [ ] `type: 'dm' | 'group'`
  - [ ] `participants[]`, `admins[]`, `name`, `avatar`
- [ ] **Server**
  - [ ] CRUD לקבוצות: יצירה, הוספה/הסרת חברים, עדכון פרטים
  - [ ] שינוי `message.schema` להשתמש ב-`conversationId` במקום sender/receiver
- [ ] **Client**
  - [ ] UI יצירת קבוצה
  - [ ] רשימת חברים, ניהול חברים (אדמין בלבד)
  - [ ] הצגה בעמודת השיחות

## P2.7 — חיפוש גלובלי

- [ ] **Server**
  - [ ] index טקסטואלי ב-Mongo על `message.content`
  - [ ] `GET /message/search?q=...`
- [ ] **Client**
  - [ ] שדה חיפוש גלובלי ב-`UserPanel`
  - [ ] תצוגת תוצאות עם הקשר + לחיצה לקפיצה לשיחה

## P2.8 — Push Notifications

- [ ] **Web Push (VAPID)**
  - [ ] התקנת `web-push` בשרת + יצירת VAPID keys
  - [ ] שמירת subscriptions לכל user
  - [ ] שליחת notification בהודעה חדשה כשהמשתמש לא מחובר
- [ ] **Service Worker בצד client**
  - [ ] רישום SW
  - [ ] בקשת permission
  - [ ] טיפול בקליק → פתיחת השיחה

## P2.9 — Online Status מורחב

- [ ] **Last Seen**
  - [ ] שמירת `lastSeenAt` ב-user
  - [ ] עדכון בכל disconnect
  - [ ] תצוגה: "נראה לאחרונה לפני 5 דקות"
- [ ] **Privacy Settings**
  - [ ] אופציה להסתרת last seen / online status

## P2.10 — Block & Report

- [ ] **Schema**
  - [ ] `user.blockedUsers: ObjectId[]`
- [ ] **Server**
  - [ ] `POST /user/block/:id` + `DELETE /user/block/:id`
  - [ ] סינון אוטומטי בהודעות
- [ ] **Client**
  - [ ] כפתור block ב-`ContactInfo`
  - [ ] רשימת חסומים ב-Settings

## P2.11 — Settings Page

- [ ] **דף Settings ייעודי** (`/settings`)
  - [ ] Notifications (push, sounds)
  - [ ] Privacy (last seen, read receipts)
  - [ ] Theme (Dark / Light / System)
  - [ ] Language switcher
  - [ ] Blocked users
  - [ ] Account (change password, delete account)

## P2.12 — Dark / Light Mode Toggle

- [ ] **ThemeProvider**
  - [ ] context + localStorage persistence
  - [ ] system preference detection
- [ ] **התאמת כל הקומפוננטות** ל-dark/light (Tailwind `dark:` prefix)
- [ ] **MUI ThemeProvider** מסונכרן

---

# שלב P3 — שדרוגים מתקדמים

> **מטרה:** העלאת המוצר לרמה תחרותית עם פיצ'רים מתקדמים.

## P3.1 — שיחות אמיתיות (Audio/Video)

- [ ] **WebRTC Signaling**
  - [ ] socket events: `call:offer`, `call:answer`, `call:ice`, `call:end`
  - [ ] STUN/TURN server (Twilio או coturn)
- [ ] **Client**
  - [ ] `CallModal` אמיתי עם `RTCPeerConnection`
  - [ ] תמיכה במצלמה (וידאו) + מיקרופון
  - [ ] mute / camera off / speaker
  - [ ] שיחות נכנסות עם רינגטון

## P3.2 — Performance

- [ ] **Virtualization**
  - [ ] `react-virtuoso` או `react-window` ל-`MessageList`
  - [ ] גלילה הפוכה (newest at bottom)
- [ ] **Image Optimization**
  - [ ] `sharp` בשרת ליצירת thumbnails
  - [ ] WebP conversion
  - [ ] lazy loading + blur placeholder
- [ ] **Code Splitting**
  - [ ] React.lazy + Suspense לדפים
  - [ ] Vendor chunks ב-vite

## P3.3 — PWA & Offline

- [ ] **Manifest**
  - [ ] `manifest.json` עם icons, theme color, display
- [ ] **Service Worker**
  - [ ] `vite-plugin-pwa` או workbox
  - [ ] caching של static assets
  - [ ] תור הודעות יוצא במצב offline
- [ ] **Install Prompt**

## P3.4 — Real-time Scaling

- [ ] **Redis Adapter ל-Socket.IO**
  - [ ] לאפשר scaling אופקי של השרת
  - [ ] להפעיל את `redisClient.ts` הקיים
- [ ] **Sticky Sessions** ב-load balancer

## P3.5 — Accessibility (a11y)

- [ ] **בדיקת ניגודיות** WCAG AA
- [ ] **Focus trap** במודאלים
- [ ] **ARIA labels** מלאים
- [ ] **Keyboard navigation** מלאה (Tab, Esc, Enter)
- [ ] **Screen reader testing** (VoiceOver / NVDA)

## P3.6 — Internationalization מורחב

- [ ] **שפות נוספות** (ערבית, רוסית, ספרדית)
- [ ] **RTL מלא** — בדיקה מקיפה
- [ ] **Date/Time formatting** לפי locale (`date-fns` / `Intl`)
- [ ] **Number formatting**

## P3.7 — Admin Dashboard

- [ ] **Admin UI** ייעודי (`/admin`)
  - [ ] רשימת משתמשים + חסימה / מחיקה
  - [ ] סטטיסטיקות (users, messages, online)
  - [ ] ניהול תוכן / דיווחים
- [ ] **Audit Log**
  - [ ] רישום פעולות אדמין

## P3.8 — Analytics

- [ ] **Privacy-friendly analytics** (Plausible / PostHog)
  - [ ] events: signup, login, message_sent, call_started
  - [ ] funnels + retention

## P3.9 — Security++

- [ ] **2FA / TOTP**
  - [ ] `speakeasy` + QR code
  - [ ] backup codes
- [ ] **Refresh Tokens**
  - [ ] access token קצר (15 דקות) + refresh token (7 ימים)
  - [ ] rotation
- [ ] **Email Verification**
  - [ ] חובה לאמת מייל לפני שימוש מלא
- [ ] **Password Strength Meter**

## P3.10 — End-to-End Encryption (E2EE)

- [ ] **Signal Protocol** או דומה
  - [ ] מפתחות פרטיים בצד client
  - [ ] הצפנת payloads לפני שליחה
  - [ ] שרת לא יכול לקרוא הודעות

---

# תזמון מוצע

| שלב | משך מוערך | תיאור |
|------|------------|--------|
| **P0** | 1-2 שבועות | חובה לפני כל deploy. עוצרת את כל הפעילות עד לסיום. |
| **P1** | 2-3 שבועות | מקבילית — חלק מהמשימות (Docker, CI) אפשר להעביר למפתח DevOps. |
| **P2** | 4-6 שבועות | פיצ'רים — אפשר לפצל לאיטרציות (sprint של 2 שבועות). |
| **P3** | לפי צורך | להוסיף לפי דרישות עסקיות וצמיחת המוצר. |

---

## Definition of Done — לכל משימה

משימה נחשבת מושלמת רק כאשר:

1. הקוד נכתב ועובר build נקי (TS + ESLint)
2. נכתבו בדיקות יחידה / אינטגרציה רלוונטיות (החל מ-P1)
3. ה-PR עבר code review ועבר CI ירוק
4. בוצע smoke test ידני בסביבת dev
5. עודכן תיעוד (README / CHANGELOG / API docs) במידת הצורך

---

## הערות

- מומלץ לעבוד עם **GitHub Issues / Projects** ולהמיר כל משימה כאן ל-issue נפרד.
- בכל merge ל-`main` לבצע `version bump` + tag (`v0.1.0`, `v0.2.0`...).
- לפני העלייה הראשונה לפרודקשן — **penetration test** בסיסי (npm audit, OWASP ZAP).
