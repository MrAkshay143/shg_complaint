# Product Requirements Document (PRD) — SHG Complaint Management System

## 1. Project Overview
### 1.1 Objectives
- Centralize complaint lifecycle management (intake → triage → resolution → reporting).
- Standardize UI patterns across pages for consistency and usability.
- Provide role-based access and auditability of actions.
- Enable robust reporting and data exports for operations and oversight.

### 1.2 Scope
- Frontend: React + TypeScript + Vite with MUI and Tailwind; pages for Dashboard, Complaints, Masters, Reports, Users, Auth.
- Backend: Node.js + Express + SQLite; REST API for authentication, master data, complaints, reports.
- Infrastructure: Local dev with SQLite; deployable to common PaaS; light/dark theme support.

### 1.3 Target Audience & Personas
- Admin: Manages users, masters, global settings; views organization-wide reports.
- Support Agent: Triages complaints, updates statuses, logs calls; exports data.
- Field Officer: Views assigned complaints, updates progress; logs interactions.
- Manager: Reviews KPIs/trends on dashboard and reports; ensures SLA compliance.
- Auditor: Reviews audit timeline entries for compliance and investigations.

### 1.4 Key Features
- Complaints CRUD with filters, sorting, pagination, exports.
- Masters management (Zones, Branches, Lines, Farmers, Equipment) with tabbed UX.
- Dashboard KPIs and charts reflecting complaint trends and distribution.
- Reports with advanced filters and CSV/PDF exports.
- User management (create, edit, change password), RBAC guard.
- Theme switching with design tokens for high contrast in dark mode.
- Audit timeline of entity changes.

## 2. Detailed Page Specifications
For each page below: purpose, UX requirements, user flows, required components, responsiveness.

### 2.1 Login (Auth)
- Purpose: Authenticate user via credentials and establish JWT session.
- UI/UX: Username, password fields; login button; error feedback; link to change password dialog where applicable.
- User Flows: Enter credentials → submit → on success redirect to Dashboard; on error show message.
- Components: `Login.tsx`, MUI `TextField`, `Button`, `Alert`; API `POST /api/auth/login`.
- Responsiveness: Single-column layout, center content; mobile-first with adequate tap targets.

### 2.2 Layout (Global Shell)
- Purpose: Provide consistent header and content container across pages.
- UI/UX: `AppHeader` with app title, navigation buttons, theme toggle, optional profile; `AppShell` wraps children; standardized header styling.
- User Flows: Header buttons navigate to Complaints, Masters, Users, Reports.
- Components: `AppShell.tsx`, `AppHeader.tsx` using MUI `AppBar`, `Toolbar`, `Box`, `Typography`.
- Responsiveness: Header buttons align right, stack or collapse gracefully on small screens.

### 2.3 Dashboard
- Purpose: Present KPIs and charts overview.
- UI/UX: KPI stat cards with icons; charts (trend, status distribution); standardized header; dark theme visibility.
- User Flows: View KPIs → drill via filters; navigate using header.
- Components: `Dashboard.tsx`, `ModernDashboard.tsx`, `ChartSuite.tsx` (KPIStat, chart components).
- Responsiveness: Grid-based cards responsive to breakpoints (e.g., 4→2→1 columns).

### 2.4 Complaints (List & Actions)
- Purpose: Manage complaints list and actions.
- UI/UX: Table with columns (ID, Status, Date, Description, Actions); filter bar; standardized header with right-aligned action button.
- User Flows: Filter/search → view detail → edit/update status → log call → export.
- Components: `Complaints.tsx`, MUI `Table`, `Select`, `TextField`, action icons (View, Edit, Phone, Refresh), `ExportActions.tsx`.
- Responsiveness: Table scrollable on mobile; filters wrap; actions accessible via icons.

### 2.5 Complaint Form & Detail
- Purpose: Create and update complaint records.
- UI/UX: Dialog or page form with validation; status updates; attachment area (future-ready).
- User Flows: Click New Complaint → fill fields → submit; open existing complaint → edit → save.
- Components: MUI form controls; API `POST /api/complaints`, `PUT /api/complaints/:id`, `GET /api/complaints/:id`.
- Responsiveness: Single-column on mobile; multi-column on desktop.

### 2.6 Masters (Tabbed Management)
- Purpose: CRUD for Zones, Branches, Lines, Farmers, Equipment via tabs.
- UI/UX: Tabs across top; table per tab; Add/Edit/Delete with dialogs; stats cards showing counts.
- User Flows: Select tab → view list → add/edit/delete entries → stats auto-update.
- Components: `Masters.tsx`, MUI `Tabs`, `Table`, `Dialog`; routes under `/api/masters/*`.
- Responsiveness: Tabs become scrollable; tables responsive with horizontal scroll.

### 2.7 Reports
- Purpose: Generate and export reports.
- UI/UX: Filter sections (date range, status, user); results table/chart; export buttons.
- User Flows: Set filters → Generate → view results → Export CSV/PDF.
- Components: `Reports.tsx`, filter controls, `ExportActions.tsx`; API under `/api/reports/*`.
- Responsiveness: Filters stack; table scrolls; charts adapt to container.

### 2.8 Users (User Management)
- Purpose: Administer user accounts and roles.
- UI/UX: Table with Name, Role, Email, Status; Create User; Edit; Change Password dialog.
- User Flows: Create user → assign role; edit user; change password; delete user.
- Components: `UserManagement.tsx`, `ChangePasswordDialog.tsx`; API `/api/users/*`.
- Responsiveness: Forms and tables optimized for mobile view.

### 2.9 Audit Timeline
- Purpose: Display history of changes for entities.
- UI/UX: Timeline list with timestamp, user, action, diff summary.
- User Flows: Open page → filter by entity type/id → review entries.
- Components: `AuditTimeline.tsx`, `audit-timeline.css`; API `/api/audit/*`.
- Responsiveness: Timeline items stack; readable on small screens.

### 2.10 UI/UX Standards (Global)
- Typography and spacing via design tokens.
- Color tokens ensure contrast in dark mode.
- Buttons align right in headers; consistent iconography (MUI icons).
- Tables use hover states and clear borders; text truncation rules for long content.

## 3. Database Design
### 3.1 Schema Overview (SQLite)
- Tables: `users`, `complaints`, `zones`, `branches`, `lines`, `farmers`, `equipment`, `call_logs`, `audit_logs`, `call_statuses`, `ticket_statuses`.

### 3.2 Tables & Fields
- users: `id INTEGER PK`, `username TEXT UNIQUE NOT NULL`, `email TEXT UNIQUE`, `password_hash TEXT NOT NULL`, `role TEXT CHECK(role IN ('admin','user')) NOT NULL`, `is_active INTEGER DEFAULT 1`, `created_at DATETIME NOT NULL`, `updated_at DATETIME`.
- complaints: `id INTEGER PK`, `description TEXT NOT NULL`, `status TEXT CHECK(status IN ('open','in_progress','closed')) NOT NULL`, `priority TEXT CHECK(priority IN ('low','medium','high'))`, `user_id INTEGER NOT NULL`, `farmer_id INTEGER`, `created_at DATETIME NOT NULL`, `updated_at DATETIME`, `ticket_status_id INTEGER`, `FOREIGN KEY(user_id) REFERENCES users(id)`, `FOREIGN KEY(farmer_id) REFERENCES farmers(id)`, `FOREIGN KEY(ticket_status_id) REFERENCES ticket_statuses(id)`.
- zones: `id INTEGER PK`, `code TEXT UNIQUE NOT NULL`, `name TEXT NOT NULL`, `description TEXT`, `created_at DATETIME`.
- branches: `id INTEGER PK`, `code TEXT UNIQUE NOT NULL`, `name TEXT NOT NULL`, `zone_id INTEGER NOT NULL`, `FOREIGN KEY(zone_id) REFERENCES zones(id)`.
- lines: `id INTEGER PK`, `code TEXT UNIQUE NOT NULL`, `name TEXT NOT NULL`, `branch_id INTEGER NOT NULL`, `FOREIGN KEY(branch_id) REFERENCES branches(id)`.
- farmers: `id INTEGER PK`, `name TEXT NOT NULL`, `contact TEXT`, `line_id INTEGER`, `FOREIGN KEY(line_id) REFERENCES lines(id)`.
- equipment: `id INTEGER PK`, `type TEXT NOT NULL`, `serial_number TEXT UNIQUE`, `farmer_id INTEGER`, `FOREIGN KEY(farmer_id) REFERENCES farmers(id)`.
- call_logs: `id INTEGER PK`, `complaint_id INTEGER NOT NULL`, `user_id INTEGER NOT NULL`, `status_id INTEGER`, `timestamp DATETIME NOT NULL`, `notes TEXT`, `FOREIGN KEY(complaint_id) REFERENCES complaints(id)`, `FOREIGN KEY(user_id) REFERENCES users(id)`, `FOREIGN KEY(status_id) REFERENCES call_statuses(id)`.
- audit_logs: `id INTEGER PK`, `entity_type TEXT NOT NULL`, `entity_id INTEGER NOT NULL`, `action TEXT CHECK(action IN ('create','update','delete')) NOT NULL`, `user_id INTEGER`, `timestamp DATETIME NOT NULL`, `changes TEXT`, `FOREIGN KEY(user_id) REFERENCES users(id)`.
- call_statuses: `id INTEGER PK`, `status_name TEXT UNIQUE NOT NULL`.
- ticket_statuses: `id INTEGER PK`, `status_name TEXT UNIQUE NOT NULL`.

### 3.3 Relationships
- zones 1–N branches; branches 1–N lines; lines 1–N farmers; farmers 1–N equipment.
- users 1–N complaints, 1–N call_logs, 1–N audit_logs.
- complaints 1–N call_logs; complaints N–1 users; complaints N–1 farmers.

### 3.4 Indexes & Optimization
- Index `complaints(status, created_at)` for filtering.
- Index FKs: `branches(zone_id)`, `lines(branch_id)`, `farmers(line_id)`, `equipment(farmer_id)`, `call_logs(complaint_id)`, `audit_logs(entity_type, entity_id)`.
- Unique indexes on codes and serial numbers.

### 3.5 Data Validation Rules
- Enforce NOT NULL on required fields (e.g., usernames, status).
- CHECK constraints for enumerations (roles, statuses, priorities).
- Email format validated server-side; password complexity rules.
- Referential integrity via FOREIGN KEY constraints.

## 4. Technical Requirements
### 4.1 System Architecture
- Frontend SPA (React/TS/Vite) served over CDN.
- Backend REST API (Express) with SQLite; modular routes under `/api`.
- Theme context for light/dark; design tokens CSS for colors.

### 4.2 API Specifications (Representative)
- Auth: `POST /api/auth/login`, `POST /api/auth/logout`.
- Users: `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id`, `POST /api/users/:id/password`.
- Complaints: `GET /api/complaints`, `GET /api/complaints/:id`, `POST /api/complaints`, `PUT /api/complaints/:id`, `DELETE /api/complaints/:id`, `GET /api/complaints/export`.
- Masters: `GET/POST/PUT/DELETE /api/masters/zones|branches|lines|farmers|equipment`.
- Call Logs: `GET /api/call-logs`, `POST /api/call-logs`.
- Reports: `POST /api/reports/complaints`, `POST /api/reports/calls`, `GET /api/reports/export`.
- Dashboard: `GET /api/dashboard/kpis`.

Response format: JSON with `data`, `meta`, `error` fields; pagination via `page`, `pageSize`, `total`.

### 4.3 Performance Requirements
- Initial load ≤ 2.5s on broadband; subsequent navigations ≤ 1s.
- API response times ≤ 300ms for typical queries; ≤ 800ms for exports.
- Table virtualization considered for large datasets.

### 4.4 Security Considerations
- JWT auth with expiration; refresh strategy if implemented.
- Password hashing (bcrypt); no plaintext storage.
- Input validation and sanitization; centralized error handling.
- CORS configured appropriately; HTTPS everywhere in production.
- Role-based route guards (RBAC) on server and client.

### 4.5 Error Handling
- Consistent JSON error format `{ code, message, details }`.
- UI `ErrorBoundary` displays friendly messages; retry options for network errors.
- Logging: server logs tagged by level; audit logs for data changes.

## 5. Non-functional Requirements
- Accessibility: WCAG 2.1 AA compliance; keyboard navigation; visible focus states; sufficient contrast in dark mode.
- Browser/Device Compatibility: Latest Chrome, Edge, Firefox; Safari recent; responsive design for ≥360px width.
- Localization: English initially; architecture ready for i18n (string externalization).
- Performance Benchmarks: Lighthouse performance ≥ 85; Time to Interactive ≤ 3s.

## 6. Testing Requirements
- Test Cases: Component render/interaction; form validation; API success/error paths; RBAC access control.
- Acceptance Criteria: Each feature meets functional specs, passes UX checks, and dark/light theme visibility.
- Performance Scenarios: Load 10k complaints pagination; filter stress tests; export throughput.

## 7. Project Timeline
- Milestone 1: Core scaffolding & auth (Week 1).
- Milestone 2: Complaints & Masters pages (Weeks 2–3).
- Milestone 3: Reports & Dashboard (Week 4).
- Milestone 4: User Management & Audit Timeline (Week 5).
- QA: Rolling QA per milestone; final regression Week 6.
- Deployment: Staging after each milestone; production after final QA.

This PRD is the single source of truth for stakeholders and reflects the current implemented features and planned quality standards.