# Constituency Human Resources & Analytics System (CHRAS)

### پاکستان حلقہ ہیومن ریسورس و تجزیاتی نظام

An enterprise-grade, full-stack human resources, candidate verification, seat allocation, and regional analytics platform built with a patriotic Pakistani theme (**Deep Forest Green `#01411C`**, crisp white backgrounds, emerald badges, and gold accents).

---

## 🏛️ System Modules & Architecture

### 1. Database & Regional Quota Layer (`src/lib/db.ts`)

- Structured relational data model tracking:
  - **12+ Regional Districts** across Punjab, Sindh, KPK, Balochistan, and ICT (Lahore, Rawalpindi, Faisalabad, Karachi Central, Peshawar, Quetta, Islamabad, etc.).
  - **Constituency mapping** (e.g., NA-117 through NA-264).
  - **District Quotas vs. Active Appointments** with real-time percentage execution meters.

### 2. Candidate & Member Registration Module (`src/components/CandidateRegistrationView.tsx`)

- Multi-step registration capturing:
  - **Biometrics & Identity**: Full Name, Father's Name, 13-digit Pakistani CNIC with real-time auto-masking (`XXXXX-XXXXXXX-X`), Date of Birth, Gender, Mobile Number.
  - **Domicile & Geography**: District, Constituency Seat, Tehsil, Union Council (UC), and Residential Address.
  - **Educational Credentials**:
    - **Matriculation (SSC)**: Board (e.g. BISE Lahore, Federal Board), Passing Year, Grade, Document Proof Record.
    - **Intermediate (HSSC / FSc)**: Board, Group (Pre-Engineering, Pre-Medical, ICS, I.Com, Arts), Grade, Document Proof Record.
    - **Higher Qualifications**: Bachelors, Masters, LLB, MBBS.
  - **Photograph Upload**: Server-side sharp compression stored as WebP binary data in MySQL and served through an authenticated Next.js API route.
  - **Political Alignment**: PTI, PML-N, PPP, JUI-F, MQM-P, JI, ANP, TLP, Independent.

### 3. Political System & Seat Allocation Logic (`src/components/SeatAllocationView.tsx`)

- **Role Categories**:
  - `MNA` (National Assembly)
  - `MPA` (Provincial Assembly)
  - `District Chairperson`
  - `Union Council Chairman`
  - `Councilor` (Municipal / Ward)
  - `Civil Administration Officer` (AC Liaison, Monitoring)
  - `Committee Head` (Infrastructure, Health, Education)
  - `Public Sector Staff` (Vocational Trainees, Field Staff)
- **Anti-Duplication Enforcement**:
  - Automatically verifies whether a candidate already holds an active role before issuing a new appointment.
  - Generates official Dispatch Reference Numbers (e.g., `EST-LHR/2026/091`).
  - Confetti celebration upon successful job allocation.
  - Interactive **Official Gazette Notification** modal with printable layout and copyable dispatch text.

### 4. HR Communications & Internal Memorandums (`src/components/InternalChatView.tsx`)

- Formal, structured official communication channel between MNA Secretariats, Deputy Commissioners, Councilors, and Committee Heads.
- Directives tagged with official priority levels:
  - 🔴 **Urgent Directive**
  - 🟡 **Official Notice**
  - 🟢 **Routine Memorandum**
  - 🔵 **Administrative Inquiry**

### 5. HR Analytics & Election-Ready Reports (`src/components/DashboardView.tsx` & `src/components/ReportsView.tsx`)

- **Dynamic Regional Scope**: Select any district or the National Master Roster to re-calculate all statistics on the fly.
- **Campaign & Rally Statement Highlight**:
  > _"We have delivered verified public sector positions & constituency leadership roles to X citizens in District Y!"_
- **Certified Audit Report Generator**:
  - Publication-ready official dossier.
  - Tabulated appointee list with CNICs, designations, and departments.
  - One-click **"Copy Press Release"** for WhatsApp groups, press media, and campaign announcements.
  - Clean browser **Print / PDF Export** stylesheet.

---

## 🖼️ Image Storage

Candidate photographs are compressed server-side with `sharp` (max 800×800, WebP quality 82), stored directly in the Aiven MySQL `candidate_images` table as binary data, and served through `GET /api/candidates/[id]/photo` with session-based access control. No Cloudinary or other third-party image service is used.

Uploads are sent to `POST /api/candidates/[id]/photo` as multipart form data using the `photo` field. Accepted inputs are JPEG, PNG, and WebP up to 8 MB. A `DATABASE_URL` is the only credential required.

---

## 🚀 Running the Project

```bash
# Start the development server
npm run dev

# Open in your browser
http://localhost:3000
```
