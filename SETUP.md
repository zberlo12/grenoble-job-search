# Setup Guide — Job Search System

This system runs automated job search scans, tracks applications, and drafts tailored CVs and cover letters. All user-specific configuration lives in Notion — no skill files need editing to adapt it for a new user.

---

## Prerequisites

- [Claude Code CLI](https://claude.ai/code) installed
- A Notion account (free tier works)
- A Gmail account with job alert emails arriving

---

## Step 1 — Clone the repository

```bash
git clone https://github.com/zberlo12/grenoble-job-search.git
cd grenoble-job-search
```

---

## Step 2 — Set up your Notion workspace

### 2a. Create a root page
In Notion, create a new page titled **"Job Search"**. Note its page ID (from the URL: `notion.so/.../<PAGE_ID>`).

### 2b. Create the three databases

Create three databases as children of your Job Search page:

**Job Applications** — properties:
| Property | Type |
|---|---|
| Job Title | Title |
| Company | Text |
| Source | Select (Indeed / LinkedIn / Direct / Referral / Other) |
| Location | Text |
| Salary | Text |
| Priority | Select (A / B / C) |
| CV Approach | Select (Standard / FP&A Focus / Cost Control Focus / Transformation Focus) |
| Status | Select (To Assess / Needs Info / Potentially Apply / To Apply / Docs Ready / Applied / Interview / Offer / Rejected / Dismissed / On Hold) |
| Date Added | Date |
| Date Applied | Date |
| Date Response | Date |
| Job URL | URL |
| Gmail Thread URL | URL |
| Red Flags | Multi-select (Low salary / French only / No hybrid / Far location / Fixed-term / Junior scope) |
| Missing Info | Multi-select (Salary / Hybrid policy / Scope / Full JD / Company name) |
| Notes | Text |
| English | Checkbox |

**Target Companies** — properties: Company (Title), Tier (Select: A/B/C/D), Sector (Text), Location (Text), Careers URL (URL), Last Checked (Date), Notes (Text)

**Open To-Dos** — properties: Task (Title), Category (Select), Priority (Select), Due Date (Date), Done (Checkbox), Notes (Text)

### 2c. Create the User Profile & Config page

Create a new page under Job Search titled **"⚙️ User Profile & Config"**.

Copy the structure from the existing profile (see `https://www.notion.so/3452fc3ca02a811ab75af9805f50ef8b` as a reference) and fill in your own details for all 10 sections:

1. **Identity** — your name, email, base city, country
2. **Role & Compensation** — target role, salary floor (apply/reject), contract preference, language preference
3. **Background Keywords** — your functional expertise, systems, accounting standards, key employers
4. **Location Zones** — Green/Yellow/Orange/Red zone cities and departments relative to your base
5. **Job Title Alerts** — the search titles you want monitored (customize for your function)
6. **Gmail Alert Sources** — the job board email addresses you receive alerts from
7. **Notion IDs** — fill in the IDs from the databases you just created (see Step 2d)
8. **CV Approach Options** — map your CV templates to script flags
9. **Application Lifecycle Rules** — auto-expiry threshold, dedup window, priority criteria
10. **Target Company Tiers** — your Tier A/B employer wishlist

### 2d. Fill in Notion IDs in your profile

After creating the databases, get their IDs from Notion URLs and populate Section 7 of your User Profile & Config page.

### 2e. Create the Daily Scans archive page

Create a page titled **"📬 Daily Scans"** under your Job Search page. Note its ID and add it to Section 7 of your profile.

### 2f. Create the Candidate Profile page

Create a page titled **"Candidate Profile"** under your Job Search page. This stores your CV content, talking points, CL writing rules, and CV templates. Add its ID to Section 7 of your profile.

---

## Step 3 — Connect Notion to Claude

### 3a. Get a Notion API token
Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) → New integration → copy the Internal Integration Secret.

### 3b. Configure .mcp.json
```bash
cp .mcp.json.template .mcp.json
```

Edit `.mcp.json` and fill in:
- `NOTION_API_TOKEN` — your Notion integration token
- `notion_config_page_id` — the page ID of your "⚙️ User Profile & Config" page
- The three database IDs in the `databases` section

### 3c. Share your Notion pages with the integration
In Notion, open each database and page → Share → Invite your integration by name.

---

## Step 4 — Connect Gmail to Claude

Via [claude.ai](https://claude.ai) → Settings → Connections → connect your Gmail account.
This enables the `mcp__claude_ai_Gmail__*` tools used by the daily scan.

---

## Step 5 — Set up Gmail job alerts

In LinkedIn, Indeed, APEC, Cadremploi (and any other job boards):
- Set up email job alerts for each title in Section 5 of your User Profile & Config
- Use your base location (from Section 1) as the search location
- Set frequency to **Daily**

### Create a Gmail filter
Create a Gmail filter to label all incoming job alert emails as **"jobs"**:
- From: the email addresses in Section 6 of your profile
- Apply label: `jobs`

This ensures the daily scan can find all alerts with a single label search.

---

## Step 6 — Schedule the daily scan

Run the schedule skill to set up the automated morning scan:

```
/schedule
```

Follow the prompts to configure it to run daily (recommended: 00:01 UTC / 08:00 Paris time).

---

## Step 7 — Verify the setup

1. Run `/job-dashboard` — should load without errors (empty pipeline is fine)
2. Run `/job-search` and paste a test job listing — should analyse and write to Notion
3. Run `/job-search-daily-scan 04/17/26` (use yesterday's date) — should scan Gmail and write results

If any step fails with "User Profile page unreachable", check `notion_config_page_id` in `.mcp.json`.

---

## Transferring to a new user

To adapt this system for someone else:
1. They follow Steps 1–7 above with their own Notion workspace and Gmail
2. The only file they edit is `.mcp.json` (Notion token + profile page ID)
3. No skill files need to change — all user-specific values live in their Notion profile

The original user's data remains in their Notion workspace, untouched.
