# # 🏡 EstateHub – Proof of Concept Real Estate Platform

### **Software Programming – Group Project (PoC Submission)**

EstateHub is a proof-of-concept web application demonstrating a modern property-listing and membership-based real-estate platform.
This submission includes the frontend codebase, Supabase database migrations, and configuration files required to run the system.

The goal of this project is to validate the core system architecture, authentication flow, booking & membership logic, and the ability to scale in future development sprints.

---

# ## 🚀 Features Implemented (PoC)

### **🔐 Authentication**

* User sign-up and login via Supabase Auth
* Profiles stored using RLS-protected tables
* Automatic login after sign-up (for PoC testing convenience)

### **🏠 Property Listings**

* View all properties
* View exclusive (membership-only) listings
* Property detail page
* Gallery images, features, metadata

### **⭐ Favorites**

* Users can save/view favorite properties
* Connected to the authenticated user
* Fully protected with RLS

### **📅 Booking Requests**

* Submit a booking request for a property
* Saved in the database under the user's account
* Booking state managed via Supabase

### **💎 Membership System**

* Choose a membership tier (Monthly, Yearly, etc.)
* Membership saved in DB with tier, start_date, end_date
* Membership unlocks **exclusive properties**
* Payment gateway integration will be added in future (Stripe)

### **🗄 Database**

* Fully built schema with migrations
* RLS for all tables
* Profiles linked to `auth.users`
* Bookings, payments, memberships, favorites, properties

---

# ## 📂 Project Structure

```
project/
│
├── public/               # Static assets
├── src/                  # React frontend (components, pages, hooks, lib)
├── supabase/             # SQL migration files + config.toml
│
├── .env                  # Environment variables (public Supabase creds only)
├── package.json          # Dependencies + scripts
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind CSS
├── tsconfig.json         # TypeScript configs
└── README.md             # This file
```

---

# ## 🔧 Installation & Setup

### ### **🛠️ Prerequisites**

Before running the project, make sure you have the following installed on your system:

Node.js (version 18 or higher)

Download from:
https://nodejs.org/

Node.js includes npm, which is required to install and manage project dependencies.

Verify that Node and npm are installed:

node -v
npm -v


If both commands output version numbers, you're ready to continue.

### ### **1️⃣ Install Dependencies**

Make sure Node.js (v18+) is installed.

Run:

```bash
npm install
```

---

### ### **2️⃣ Configure Environment Variables**

Create a `.env` file (this project already includes one with only **public** safe values).

Required variables:

```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

These values are **public** Supabase credentials and safe to use in frontend code.

---

### ### **3️⃣ Run the Development Server**

```bash
npm run dev
```

The development server will start automatically.  
Open the URL shown in your terminal (e.g., http://localhost:xxxx).


---

# ## 🗄 Database Setup (Supabase)

This project includes a `/supabase` folder containing:

* SQL migration files
* Supabase configuration (`config.toml`)

To apply the migrations to a new Supabase project:

1. Open Supabase Dashboard → SQL Editor
2. Copy each `.sql` file in order
3. Execute them to create tables + RLS policies

Alternatively, Supabase CLI can be used (not required for PoC).

---

# ## ⚙️ Tech Stack

### **Frontend**

* React + TypeScript
* Vite
* TailwindCSS + ShadCN UI components

### **Backend / Database**

* **Supabase** (PostgreSQL, Auth, RLS)
* Supabase JS Client

### **Deployment**

* Local development only (PoC stage)

---

# ## 📌 Future Work

Planned for next sprint:

* Admin dashboard for reviewing bookings & listings
* Owner/agent portal for uploading properties
* Full payment integration (Stripe)
* Viewing scheduling system
* Email verification + improved auth
* Improved UI/UX + responsiveness

---

# ## 👥 Team Members

**Group 2 – Advanced Manufacturing Use-Case**

* Muhammad Qasim 
* Amir Radwani
* Faisal
* Assad

---

# ## 📝 Notes for Marker

This submission is intentionally lightweight and focuses on **demonstrating technical viability**, per project requirements:

* No `node_modules` included
* All environment keys are public and safe
* RLS ensures security at database level
* PoC functionality validated against project scope

---

# ## 📄 License

Academic submission – not licensed for commercial use.

