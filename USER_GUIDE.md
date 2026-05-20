# Real Estate Agency CRM — User Guide

> Version 1.0 | Last Updated: May 2026

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Permission Roles Overview](#2-permission-roles-overview)
3. [Dashboard](#3-dashboard)
4. [CRM — Client Management](#4-crm--client-management)
5. [Listings](#5-listings)
6. [Pipeline — Deal Kanban](#6-pipeline--deal-kanban)
7. [Appointments](#7-appointments)
8. [Tasks](#8-tasks)
9. [Transactions & Offers](#9-transactions--offers)
10. [Finance](#10-finance)
11. [Documents](#11-documents)
12. [Marketing](#12-marketing)
13. [Reports & Analytics](#13-reports--analytics)
14. [Services](#14-services)
15. [Settings & Administration](#15-settings--administration)
16. [Upgrade & Subscription](#16-upgrade--subscription)
17. [Role-Based Feature Matrix](#17-role-based-feature-matrix)

---

## 1. Getting Started

### 1.1 Registering an Account

1. Navigate to `/signup` (or click **Request Access** on the login page).
2. Fill in:
   - **Full Name** — your display name across the platform
   - **Email Address** — used for login and notifications
   - **Organization / Firm** — the brokerage name. If the organization already exists, you must be **invited** by an admin instead of registering directly.
   - **Password** — minimum 8 characters
3. Click **Create Account**. You will receive a verification email.
4. On first registration of an organization, you are automatically assigned **Firm Admin** role.

> ⚠️ If the organization already exists in the system, you cannot self-register — ask your Firm Admin to send you an invite via **Settings → Team Management**.

### 1.2 Logging In

1. Navigate to `/login`.
2. Enter your **Email** and **Password**, then click **Sign In**.
3. On success you are redirected to the Dashboard.
4. Sessions expire after **24 hours** — you will be redirected to the login page automatically.

### 1.3 Forgot Password

1. On the login page, click **Forgot?** next to the Password field.
2. Enter your registered email address and click **Send Reset Link**.
3. Check your inbox (and spam folder) for a reset email.
4. Click the link in the email — it is valid for **1 hour**.
5. Set a new password (minimum 8 characters) and click **Update Password**.
6. You are automatically redirected to the login page.

### 1.4 Language & Theme

- **Language**: Select from English / 中文（简体）/ 中文（繁體）/ Español using the globe icon in the top bar of the login/signup pages, or via **Settings → Appearance → Language**.
- **Theme**: Choose a color theme under **Settings → Appearance** (Luxury / Modern / Youth / Chinese / Cyberpunk).

---

## 2. Permission Roles Overview

The platform has a hierarchical role system. Each role has access to a specific subset of features.

| Role | Description |
|------|-------------|
| **SUPERADMIN** | Platform-level administrator. Full access to all organizations. |
| **ADMIN** | System admin within an organization. Manages all users and settings. |
| **FIRMADMIN** | Firm/Brokerage administrator. Full access to firm data, team management, billing. |
| **MANAGER** | Branch manager. Views all agents' data within their branch; can manage pipeline stages. |
| **AGENT** | Standard real estate agent. Manages own clients, listings, pipeline, tasks, and finance. |
| **MARKETING** | Marketing staff. Access to Marketing module and reports; limited CRM view. |
| **OFFICE_SUPPORT** | Administrative support. Access to Documents, Appointments, and limited CRM. |
| **ATTORNEY** | Legal partner. Read-only access to Transactions and Documents. |
| **LENDER** | Mortgage partner. Read-only access to client finance details and transactions. |
| **TITLECO** | Title company partner. Read-only access to Transactions and Documents. |
| **GUEST** | Temporary read-only access. No editing capabilities. |

---

## 3. Dashboard

**Who can access:** All roles

The Dashboard provides a real-time overview of your business performance.

### Key Metrics Cards
- **Active Listings** — total properties you currently have listed
- **New Leads** — clients acquired this month
- **Pending Offers** — open offers awaiting response
- **YTD Commission Estimate** — year-to-date projected earnings

### Charts
- **Performance Timeline** — monthly revenue/commission trend (bar chart)
- **Conversion Funnel** — lead → active → in-contract → closed pipeline visualization
- **Deals Closed** — monthly deal count over the year

### Action Items
Quick-access list of urgent tasks, upcoming appointments, and pending offers pulled from across the platform.

### Tips
- Click **Download Report** to export the current dashboard summary as a PDF.
- Click **+ New Lead** to quickly add a new CRM client.
- Managers and Admins see **aggregated org-wide data** instead of individual data.

---

## 4. CRM — Client Management

**Who can access:** SUPERADMIN, ADMIN, FIRMADMIN, MANAGER, AGENT, OFFICE_SUPPORT

### 4.1 Client List

The CRM table lists all your clients with:
- **Name, Email, Phone, Budget**
- **Stage**: Lead → Active → In-Contract → Closed
- **Type**: Buyer / Seller / Renter / Investor

**Filtering & Search:**
- Use the search bar to filter by name, email, or phone.
- Filter by Stage and Type using the dropdowns.

**Actions:**
- Click a client row to open the **Client Profile**.
- Click **+ New Client** to add a new contact.

### 4.2 Client Profile (`/crm/[id]`)

The client detail page has two panels:

**Left — Contact Details:**
- Name, Email, Phone, Budget
- Click **Edit Profile** to update any field.
- Changes are saved immediately to the database.

**Right — Activity Timeline:**
- Full chronological history of all interactions (calls, emails, meetings, notes, offers, etc.)
- Toggle **Live** to auto-refresh the timeline every 30 seconds.
- Click **Log Activity** to record a new interaction.

**Log Activity Form:**
- **Activity Type**: Call / Email / Meeting / Note / Offer / Contract / Other
- **Subject**: Short summary
- **Details**: Full notes

### 4.3 Stages

| Stage | Meaning |
|-------|---------|
| Lead | Initial contact, not yet qualified |
| Active | Qualified buyer/seller, actively working |
| In-Contract | Offer accepted, under contract |
| Closed | Deal completed |

---

## 5. Listings

**Who can access:** All authenticated roles (edit: AGENT and above)

### 5.1 Listing Cards

Each property listing shows:
- Property photo, address, price, bedrooms/bathrooms/area
- Status: Active / Pending / Sold / Off-Market
- Type: Sale / Rent

### 5.2 Adding a Listing

Click **+ New Listing** and fill in:
- **Address** (required)
- **Price** (required)
- **Type**: For Sale / For Rent
- **Bedrooms, Bathrooms, Area**
- **Description** and **Features** (comma-separated)
- **Images** (upload via drag-and-drop or file picker)

### 5.3 Public Listings Page

The `/public-listings` page is accessible **without login** and shows all Active listings. Share the URL with clients directly.

---

## 6. Pipeline — Deal Kanban

**Who can access:** AGENT, MANAGER, FIRMADMIN, ADMIN

### 6.1 Kanban Board

Deals are organized in columns by stage:
- **New Lead → Contacted → Qualified → Proposal → Negotiation → Closed Won → Closed Lost**

**Drag and drop** a deal card to move it to a different stage.

### 6.2 Deal Cards

Each card shows:
- Client name, property address
- Deal value ($)
- Expected close date
- Assigned agent

### 6.3 Managing Deals

- **Add Deal**: Click **+ Add Deal** in any column.
- **Edit Deal**: Click the deal card to open the edit panel.
- **Delete Deal**: Open the deal card and click the delete icon.

---

## 7. Appointments

**Who can access:** AGENT, MANAGER, FIRMADMIN, ADMIN, OFFICE_SUPPORT

### 7.1 Calendar View

The Appointments page shows a monthly calendar. Click any date to see the day's appointments or add a new one.

### 7.2 Scheduling an Appointment

Click **+ New Appointment** or click a date on the calendar:
- **Title** (required)
- **Date & Time** (required)
- **Client** — select from your CRM contacts
- **Type**: Showing / Open House / Consultation / Follow-up / Other
- **Notes**: Optional additional details

### 7.3 Google Calendar Sync

Click **Sync with Google** in the header bar of the Appointments page to sync all appointments to your connected Google Calendar.

> Note: Google OAuth integration is required in Settings for this feature to work.

---

## 8. Tasks

**Who can access:** All authenticated roles

### 8.1 Task List

Tasks are organized by status: **To-Do / In Progress / Done**.

Each task shows:
- Title, priority (High / Medium / Low)
- Due date
- Linked client (optional)

### 8.2 Creating a Task

Click **+ New Task**:
- **Title** (required)
- **Priority**: High / Medium / Low
- **Due Date**
- **Link to Client** — connect to a CRM contact for context
- **Notes**: Detailed description

### 8.3 Completing Tasks

- Click the checkbox on a task card to mark it Done.
- Use the filter tabs to view All / To-Do / In Progress / Done.

---

## 9. Transactions & Offers

**Who can access:** AGENT, MANAGER, FIRMADMIN, ADMIN, ATTORNEY (read), TITLECO (read)

### 9.1 Transaction List

All transactions (accepted offers advancing to close) appear here with:
- Property address, buyer/seller names
- Offer amount, status
- Expected close date

### 9.2 Offer Pipeline

Each transaction tracks:
- **Offer Submitted → Accepted → Under Contract → Inspection → Appraisal → Clear to Close → Closed**

Click a transaction to view full details, add notes, and upload related documents.

### 9.3 Adding a Transaction

Click **+ New Transaction**:
- Link to an existing Listing
- Link buyer/seller CRM clients
- Enter offer amount, terms, dates

---

## 10. Finance

**Who can access:** AGENT (own data), MANAGER (branch), FIRMADMIN/ADMIN (all)

### 10.1 Revenue Overview

- **Estimated Revenue** — current year projected income based on pipeline
- **YTD Earnings** — confirmed commission from closed deals
- **Top % Badge** — performance ranking within the firm (if enabled by admin)

### 10.2 Revenue Projection Chart

A month-by-month projection of expected income based on active deals in the pipeline.

### 10.3 Requesting a Payout

Agents on the platform can request commission payouts directly:
1. Click **Request Payout**.
2. Enter the amount and select the associated transaction.
3. Submit — the request goes to the Firm Admin for approval.

### 10.4 Commission Splits

Firm Admins can configure commission split rules under **Settings → Finance Settings**.

---

## 11. Documents

**Who can access:** All authenticated roles (upload: AGENT and above)

### 11.1 Document Library

All documents are organized in folders:
- **Contracts** — purchase agreements, listing agreements
- **Disclosures** — property disclosure forms
- **Reports** — inspection reports, appraisals
- **Marketing** — brochures, flyers
- **Other** — miscellaneous files

### 11.2 Uploading Documents

Click **Upload Document** or drag a file into the upload zone:
- Supported formats: PDF, DOCX, XLSX, JPG, PNG (max 50 MB)
- Tag the document with a category and optionally link to a client or transaction.

### 11.3 Previewing & Downloading

- Click a document to open the **Preview Panel** (PDF and image files render inline).
- Click **Download** to save the original file.

### 11.4 Access Control

- Documents linked to a specific client/transaction are only visible to the assigned agent and managers.
- Firm Admins can view all documents.

---

## 12. Marketing

**Who can access:** AGENT, MARKETING, MANAGER, FIRMADMIN, ADMIN

### 12.1 AI Content Generator

Generate marketing copy with AI assistance:
1. Select **Content Type**: Listing Description / Social Media Post / Email Campaign / Blog Post
2. Set **Tone of Voice**: Professional / Casual / Enthusiastic
3. Enter property details or paste existing info.
4. Click **Generate** — AI produces a draft in seconds.

### 12.2 Managing Content

- **Copy Text**: Copy the generated content to clipboard.
- **Copy Share Link**: Generate a shareable public link to the listing.
- **Save Draft**: Store the content for later editing.

### 12.3 Campaign Tracker

Track ongoing marketing campaigns with status updates and performance notes.

---

## 13. Reports & Analytics

**Who can access:** MANAGER, FIRMADMIN, ADMIN (full); AGENT (own reports only)

### 13.1 Performance Overview

Top KPIs displayed:
- Deals closed this month / quarter / year
- Revenue generated
- Conversion rate (leads → closed)
- Average days to close

### 13.2 Leaderboard

A ranked list of all agents by:
- Number of deals closed
- Total revenue generated
- Leads converted

Managers can view leaderboard for their branch; Firm Admins see firm-wide rankings.

### 13.3 Export

- Click **Export CSV** to download raw data for any report.
- Click **Export PDF** to generate a formatted report for sharing.

---

## 14. Services

**Who can access:** All authenticated roles

The Services page is a directory of partner services and integrations:

- **Mortgage Partners** — connected lenders for client referrals
- **Title Companies** — partner title/escrow companies
- **Inspectors** — certified home inspectors
- **Insurance** — home insurance partners
- **Legal** — attorney referrals

Click any service card to view contact details and request a referral.

---

## 15. Settings & Administration

**Who can access:** All roles (admin features restricted to FIRMADMIN/ADMIN)

### 15.1 Profile Settings

- **Display Name, Email, Phone**
- **Profile Photo** — upload a headshot
- **Bio / About**

### 15.2 Appearance

- **Theme**: Luxury / Modern / Youth / Chinese / Cyberpunk
- **Language**: English / 中文（简体）/ 中文（繁體）/ Español
- **Color Accent**: Primary color override (Pro plan and above)

### 15.3 Notifications

- Toggle email notifications for: New leads, Appointment reminders, Offer updates, Task due dates, Team messages

### 15.4 Team Management *(FIRMADMIN / ADMIN only)*

- **View all team members** — see roles, status, last login
- **Invite a new member** — enter email and assign role; an invitation email is sent automatically
- **Change roles** — promote/demote a member's role
- **Deactivate / Remove** — disable or remove a member's account

### 15.5 Organization Settings *(FIRMADMIN / ADMIN only)*

- **Organization Name, Logo**
- **Office Address, Phone**
- **License Number**
- **Commission Split Rules**

### 15.6 Integrations *(FIRMADMIN / ADMIN only)*

- **Google Calendar** — sync appointments
- **MLS Feed** — import property listings from MLS
- **Email Provider** — configure SMTP for system emails
- **Payment Gateway** — configure payout processing

### 15.7 Security

- **Change Password**
- **Active Sessions** — view and revoke sessions on other devices
- **Two-Factor Authentication** (coming soon)

---

## 16. Upgrade & Subscription

**Who can access:** FIRMADMIN, ADMIN

### 16.1 Subscription Tiers

| Tier | Features |
|------|----------|
| **Core** (Free) | Up to 3 agents, basic CRM, listings, appointments |
| **Pro** | Up to 15 agents, full CRM, pipeline, finance, documents, marketing AI |
| **Elite** | Unlimited agents, all features, priority support, custom branding, MLS integration |

### 16.2 Upgrading

1. Go to **Settings → Upgrade** or click the **Upgrade Plan** link in the sidebar.
2. Select your desired tier.
3. Enter billing details and confirm.
4. Upgrade is applied immediately.

### 16.3 Billing

- **Monthly or Annual** billing options (annual saves 20%).
- Invoices are available for download in the Upgrade/Billing section.

---

## 17. Role-Based Feature Matrix

| Feature | SUPERADMIN | ADMIN | FIRMADMIN | MANAGER | AGENT | MARKETING | OFFICE_SUPPORT | ATTORNEY | LENDER | TITLECO | GUEST |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CRM — View | ✅ | ✅ | ✅ | ✅ | ✅ | 👁 | 👁 | ❌ | ❌ | ❌ | 👁 |
| CRM — Edit | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Listings — View | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Listings — Edit | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Pipeline | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Appointments | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Transactions — View | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | 👁 | 👁 | 👁 | ❌ |
| Transactions — Edit | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Finance — View | ✅ | ✅ | ✅ | ✅ | Own | ❌ | ❌ | ❌ | 👁 | ❌ | ❌ |
| Documents — View | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👁 | ❌ | 👁 | ❌ |
| Documents — Upload | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Marketing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Reports | ✅ | ✅ | ✅ | ✅ | Own | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Services | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Settings — Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Settings — Team Mgmt | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Settings — Org Config | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Upgrade / Billing | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legend:** ✅ Full access | 👁 Read-only | Own = own data only | ❌ No access

---

## Appendix A: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus global search bar |
| `Esc` | Close any open modal |
| `Ctrl/⌘ + K` | Open command palette (coming soon) |

## Appendix B: Support

- **In-app**: Click the **?** help icon in the top navigation bar
- **Email**: support@realestatecrm.io
- **Documentation**: Available at `/docs` (coming soon)

---

*This guide covers all platform features available as of May 2026. Features marked "coming soon" are planned for future releases.*
