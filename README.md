# SafeTour — Smart Tourist Safety Monitoring System

SafeTour is a full-stack safety platform designed to help tourists stay safe while traveling and give authorities the tools to respond quickly during emergencies. It combines real-time location tracking, SOS alerts, incident reporting, and nearby emergency services into a single connected system.

🔗 **Live Demo:** [tourist-emergency-response-system.vercel.app](https://tourist-emergency-response-system.vercel.app)

---

## ✨ Features

- **Role-based dashboards** — separate, tailored experiences for Tourists, Responders, and Admins
- **SOS Alerts** — one-tap emergency alert system with live status tracking
- **Incident Reporting** — tourists can report incidents with details, tracked end-to-end by responders
- **Nearby Emergency Services** — real-time Google Maps integration to locate nearby hospitals and police stations
- **Live Location Tracking (Mini Map)** — visualize tourist locations for faster emergency response
- **Response Team Management** — admins can manage responder teams and assign cases
- **Notifications** — real-time alerts and updates across the platform
- **Feedback & Ratings** — post-resolution feedback collection
- **AI Chatbot** — in-app assistant for tourist queries and safety guidance
- **Secure Authentication & Role Management** — powered by Supabase Auth with row-level security

---

## 🛠️ Tech Stack

**Frontend**
- React + TypeScript
- TanStack Start (SSR framework) + TanStack Router
- Tailwind CSS + shadcn/ui (Radix UI primitives)
- Vite

**Backend**
- Supabase (PostgreSQL, Auth, Row-Level Security, Edge Functions)
- Lovable Cloud (managed Supabase backend)

**Integrations**
- Google Maps JavaScript API + Places API — live map & nearby emergency services

**Deployment**
- Vercel (frontend hosting)
- Supabase Edge Functions (secure server-side operations)

---

## 📸 Dashboards

| Role | Capabilities |
|------|--------------|
| **Tourist** | SOS alerts, report incidents, view nearby help, chat with AI assistant, manage profile |
| **Responder** | View & manage assigned cases, track incident status, respond to SOS alerts |
| **Admin** | Manage all accounts, view analytics/reports, oversee tourists, response teams & notifications |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (or Lovable Cloud project)
- A Google Cloud project with **Maps JavaScript API** and **Places API (New)** enabled

### 1. Clone the repository
```bash
git clone https://github.com/<larasamynathan>/<tourist-emergency-response-system.>.git
cd <tourist-emergency-response-system.>
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root directory:

```env
# Supabase
SUPABASE_URL="your-supabase-project-url"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"   # server-side only, keep secret
VITE_SUPABASE_URL="your-supabase-project-url"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-public-key"

# Google Maps
VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY="your-browser-key"
GOOGLE_MAPS_API_KEY="your-server-side-key"           # used for Places API calls
```

### 4. Run locally
```bash
npm run dev
```

### 5. Build for production
```bash
npm run build
```

---

## 🌐 Deployment

This project is deployed on **Vercel**. To deploy your own instance:

1. Push this repository to GitHub
2. Import the repo into [Vercel](https://vercel.com)
3. Add all environment variables listed above under **Project Settings → Environment Variables**
4. Deploy 🚀

> **Note:** Admin operations (like account deletion) run through a Supabase Edge Function to keep the service role key secure and never exposed to the frontend.

---

## 📁 Project Structure

```
src/
├── components/         # Reusable UI components & role-based dashboards
├── integrations/       # Supabase client setup (browser & server)
├── lib/                # Server functions, utilities, hooks
├── routes/             # File-based routing (TanStack Router)
│   ├── _authenticated/ # Protected app routes (dashboards, admin, etc.)
│   └── api/             # Server API routes
supabase/
├── migrations/         # Database schema & RLS policies
```

---

## 👩‍💻 Author

Built by **Lara** — Computer Science Engineering student, passionate about full-stack development and real-world impact projects.

Github link:https://github.com/larasamynathan

Linkedin Link:https://www.linkedin.com/in/lara-samynathan-cse/

---

## 📄 License

This project is open source and available for educational and portfolio purposes.
