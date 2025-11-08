# Phase 3: Collaboration & Workflow - Task Breakdown

**Timeline**: Q2-Q3 2025 (12 weeks)
**Goal**: Enable team collaboration with approval workflows and version control

---

## Overview

Phase 3 transforms Content Multiplier from a single-user tool into a collaborative team platform. This phase focuses on:
- Multi-user authentication and authorization
- Real-time collaborative editing
- Customizable approval workflows
- Content version control and history
- Task management and content calendar

---

## Task Groups

### 1. Authentication & Authorization (2 weeks)

#### 1.1 User Authentication

**Task**: Design and implement user authentication system
- **Deliverables**:
  - User registration with email verification
  - Login with email/password
  - JWT token generation and validation
  - Refresh token mechanism
  - Password reset flow
  - Session management
  - Multi-device support
- **Dependencies**: None
- **Estimate**: 4 days
- **Files**: `apps/api/src/services/auth/authentication.ts`, `apps/api/src/routes/auth.ts`

**Task**: Implement OAuth/SSO integration
- **Deliverables**:
  - Google OAuth 2.0
  - Microsoft Azure AD OAuth
  - GitHub OAuth (optional)
  - SAML 2.0 for enterprise SSO
  - Account linking (OAuth + password)
- **Dependencies**: Authentication system complete
- **Estimate**: 3 days
- **Files**: `apps/api/src/services/auth/oauth.ts`

#### 1.2 Role-Based Access Control (RBAC)

**Task**: Build RBAC system with permissions matrix
- **Deliverables**:
  - Role definitions: Admin, Content Lead (CL), Writer (WR), Marketing Ops (MOps), Viewer
  - Permission matrix (create, read, update, delete, approve, publish)
  - Resource-level permissions (own content vs. team content)
  - Permission checking middleware
  - Permission inheritance
- **Dependencies**: Authentication complete
- **Estimate**: 3 days
- **Files**: `apps/api/src/services/auth/rbac.ts`, `apps/api/src/middleware/permissions.ts`

**Task**: Create team workspace management
- **Deliverables**:
  - Workspace creation and settings
  - Team invitation system (email invites)
  - Invitation acceptance flow
  - Role assignment to team members
  - Team member list with roles
  - Remove team members
  - Transfer ownership
- **Dependencies**: RBAC complete
- **Estimate**: 3 days
- **Files**: `apps/api/src/services/teams/workspace.ts`, `apps/api/src/routes/teams.ts`

**Task**: Implement user profile management
- **Deliverables**:
  - Profile CRUD (name, bio, avatar, timezone)
  - Avatar upload and storage
  - Profile visibility settings
  - Notification preferences
  - Email preferences
  - Language preferences
- **Dependencies**: Authentication complete
- **Estimate**: 2 days
- **Files**: `apps/api/src/services/users/profile.ts`, `apps/api/src/routes/users.ts`

**Total Authentication & Authorization**: 15 days (~3 weeks)

---

### 2. Real-Time Collaboration (2 weeks)

#### 2.1 Collaborative Editing

**Task**: Build real-time collaborative editing with WebSocket
- **Deliverables**:
  - WebSocket server setup (Socket.io or ws)
  - Operational Transformation (OT) or CRDT for conflict-free editing
  - Real-time text synchronization
  - Cursor position tracking
  - Selection highlighting
  - Collaborative editing for content pack fields
  - Connection state management (online/offline)
- **Dependencies**: Authentication complete
- **Estimate**: 5 days
- **Files**: `apps/api/src/services/collaboration/realtime.ts`, `apps/api/src/websocket.ts`

**Task**: Create presence indicators
- **Deliverables**:
  - Active user list (who's viewing the document)
  - User avatars and names
  - Cursor/selection indicators with user colors
  - "Currently editing" badges
  - Idle detection (5 minutes)
  - Disconnect handling
- **Dependencies**: WebSocket setup complete
- **Estimate**: 2 days
- **Files**: `apps/api/src/services/collaboration/presence.ts`, `apps/web/app/components/Presence.tsx`

#### 2.2 Comments & Feedback

**Task**: Implement comment and feedback system
- **Deliverables**:
  - Inline comments on specific content sections
  - Comment threading (replies)
  - Comment CRUD operations
  - Rich text in comments (bold, italic, links)
  - Comment status (open, resolved)
  - Comment anchoring to specific text
  - Comment count indicators
- **Dependencies**: None
- **Estimate**: 4 days
- **Files**: `apps/api/src/services/collaboration/comments.ts`, `apps/api/src/routes/comments.ts`

**Task**: Build @mentions with notifications
- **Deliverables**:
  - @mention autocomplete in comments
  - User search by name
  - Mention notification trigger
  - Mention highlighting in comments
  - "You were mentioned" notifications
  - Email notification for mentions
- **Dependencies**: Comment system, notification system
- **Estimate**: 2 days
- **Files**: `apps/api/src/services/collaboration/mentions.ts`

**Total Real-Time Collaboration**: 13 days (~2.5 weeks)

---

### 3. Notifications & Activity (1.5 weeks)

#### 3.1 Notification System

**Task**: Create multi-channel notification system
- **Deliverables**:
  - In-app notifications with bell icon
  - Email notifications
  - Slack notifications (webhook integration)
  - Microsoft Teams notifications (webhook)
  - Notification types (mention, approval, comment, publish, etc.)
  - Notification preferences per user
  - Notification grouping (digest mode)
  - Mark as read/unread
  - Notification history
- **Dependencies**: Authentication complete
- **Estimate**: 5 days
- **Files**: `apps/api/src/services/notifications/manager.ts`, `apps/api/src/routes/notifications.ts`

#### 3.2 Activity Feed & Audit Logs

**Task**: Implement activity feed
- **Deliverables**:
  - Real-time activity stream
  - Filter by user, action, content pack, date
  - Activity types (created, edited, commented, approved, published)
  - Aggregated activities (collapsed similar events)
  - Pagination with infinite scroll
  - "Show more" for activity details
- **Dependencies**: Telemetry events table exists
- **Estimate**: 3 days
- **Files**: `apps/api/src/services/activity/feed.ts`, `apps/web/app/activity/page.tsx`

**Task**: Build comprehensive audit log system
- **Deliverables**:
  - Detailed event logging (who, what, when, where)
  - IP address and user agent tracking
  - Before/after state capture for edits
  - Immutable audit trail
  - Admin-only access to full audit logs
  - Audit log search and filtering
  - Audit log export (CSV, JSON)
  - Compliance reporting
- **Dependencies**: Telemetry system exists
- **Estimate**: 3 days
- **Files**: `apps/api/src/services/audit/logger.ts`, `apps/web/app/admin/audit/page.tsx`

**Total Notifications & Activity**: 11 days (~2 weeks)

---

### 4. Approval Workflows (2.5 weeks)

#### 4.1 Workflow Engine

**Task**: Design customizable approval workflow engine
- **Deliverables**:
  - Workflow schema (steps, conditions, actions)
  - Workflow templates (simple, multi-stage, conditional)
  - Workflow state machine
  - Workflow execution engine
  - Workflow persistence
  - Default workflows by content type
- **Dependencies**: RBAC complete
- **Estimate**: 4 days
- **Files**: `apps/api/src/services/workflows/engine.ts`

**Task**: Implement approval chain builder UI
- **Deliverables**:
  - Visual workflow builder (drag-and-drop nodes)
  - Approval step configuration
  - Sequential approval (step 1 → step 2 → step 3)
  - Parallel approval (multiple approvers at once, all must approve)
  - Conditional routing (if content type = X, route to Y)
  - Role-based assignment (CL, WR, MOps)
  - User-specific assignment
  - Auto-approval rules
- **Dependencies**: Workflow engine complete
- **Estimate**: 5 days
- **Files**: `apps/web/app/settings/workflows/builder/page.tsx`, `apps/api/src/routes/workflows.ts`

#### 4.2 Approval Execution

**Task**: Create approval request and response UI
- **Deliverables**:
  - Approval request modal with content preview
  - Approve/Reject buttons
  - Feedback form (required for rejection)
  - Request changes option
  - Approval history view
  - Pending approvals dashboard
  - My approvals filter
- **Dependencies**: Workflow engine complete
- **Estimate**: 3 days
- **Files**: `apps/web/app/packs/[id]/approvals/page.tsx`

**Task**: Build approval status tracking
- **Deliverables**:
  - Status badges (pending, approved, rejected, changes requested)
  - Approval progress indicator (2/3 approvals)
  - Timeline visualization (who approved when)
  - Current approver highlighting
  - Approval metadata (approver, timestamp, feedback)
  - Status change notifications
- **Dependencies**: Approval request complete
- **Estimate**: 2 days
- **Files**: `apps/api/src/services/workflows/tracker.ts`

#### 4.3 Advanced Workflow Features

**Task**: Implement conditional approval rules
- **Deliverables**:
  - Content type-based routing
  - Field value conditions (if word count > 2000, require CL approval)
  - Tag-based routing (if tagged "legal", require legal review)
  - Author-based rules (new writers require 2 approvals)
  - Risk scoring (high-risk content requires more approvals)
- **Dependencies**: Workflow engine complete
- **Estimate**: 2 days
- **Files**: `apps/api/src/services/workflows/conditions.ts`

**Task**: Create approval SLA tracking
- **Deliverables**:
  - SLA configuration per workflow step
  - Deadline calculation (business hours vs. calendar hours)
  - Overdue detection and flagging
  - SLA compliance reporting
  - Average approval time metrics
  - Bottleneck identification
- **Dependencies**: Approval tracking complete
- **Estimate**: 2 days
- **Files**: `apps/api/src/services/workflows/sla.ts`

**Task**: Build escalation rules
- **Deliverables**:
  - Auto-escalation when SLA breached
  - Escalation chain (approver → manager → admin)
  - Reminder notifications before escalation
  - Escalation notification to next level
  - Escalation history tracking
  - Manual escalation option
- **Dependencies**: SLA tracking complete
- **Estimate**: 2 days
- **Files**: `apps/api/src/services/workflows/escalation.ts`

**Task**: Implement approval delegation
- **Deliverables**:
  - Delegate approval to another user
  - Temporary delegation (date range)
  - Permanent delegation
  - Out-of-office mode (auto-delegate)
  - Delegation notification to delegate
  - Delegation history tracking
- **Dependencies**: Approval system complete
- **Estimate**: 2 days
- **Files**: `apps/api/src/services/workflows/delegation.ts`

**Total Approval Workflows**: 22 days (~4.5 weeks)

---

### 5. Version Control & History (2 weeks)

#### 5.1 Version Management

**Task**: Create content version history system
- **Deliverables**:
  - Automatic version snapshots on save
  - Version metadata (author, timestamp, change summary)
  - Version numbering (v1.0, v1.1, v2.0)
  - Major vs. minor version designation
  - Version list view
  - Version details view
- **Dependencies**: None
- **Estimate**: 3 days
- **Files**: `apps/api/src/services/versions/manager.ts`, `apps/api/src/routes/versions.ts`

**Task**: Implement snapshot system
- **Deliverables**:
  - Full content snapshot storage (JSON)
  - Incremental snapshots (delta storage for efficiency)
  - Snapshot compression
  - Snapshot pruning (keep last 50, delete older)
  - Manual snapshot creation
  - Snapshot tagging (milestone, before publish, etc.)
- **Dependencies**: Version history complete
- **Estimate**: 2 days
- **Files**: `apps/api/src/services/versions/snapshots.ts`

**Task**: Build rollback functionality
- **Deliverables**:
  - Restore to previous version
  - Rollback preview (before applying)
  - Rollback confirmation modal
  - Rollback creates new version (not destructive)
  - Rollback notification to team
  - Rollback audit log entry
- **Dependencies**: Version history complete
- **Estimate**: 2 days
- **Files**: `apps/api/src/services/versions/rollback.ts`

#### 5.2 Advanced Version Control

**Task**: Create branch/merge workflow
- **Deliverables**:
  - Branch creation from current version
  - Branch naming and description
  - Work on branch independently
  - Branch comparison with main
  - Merge branch to main
  - Conflict detection and resolution UI
  - Branch deletion
- **Dependencies**: Version system complete
- **Estimate**: 4 days
- **Files**: `apps/api/src/services/versions/branches.ts`

**Task**: Implement version comparison tool
- **Deliverables**:
  - Side-by-side diff view
  - Inline diff view
  - Color-coded changes (red for deleted, green for added)
  - Field-level comparison
  - Word-level diff highlighting
  - Compare any two versions
  - Export diff as HTML or PDF
- **Dependencies**: Version history complete
- **Estimate**: 3 days
- **Files**: `apps/web/app/packs/[id]/versions/compare/page.tsx`, `apps/api/src/services/versions/diff.ts`

**Task**: Build change request tracking
- **Deliverables**:
  - Request changes workflow
  - Change request form (what needs to change, why)
  - Assign change request to user
  - Change request status (open, in progress, completed)
  - Link change request to version
  - Change request resolution tracking
- **Dependencies**: Workflow system complete
- **Estimate**: 2 days
- **Files**: `apps/api/src/services/versions/change-requests.ts`

#### 5.3 Auto-Save & Conflict Resolution

**Task**: Create draft auto-save system
- **Deliverables**:
  - Auto-save every 30 seconds
  - Configurable auto-save interval
  - Auto-save indicator ("Saving...", "All changes saved")
  - Draft recovery on browser crash
  - Discard draft option
  - Draft timestamp display
- **Dependencies**: None
- **Estimate**: 2 days
- **Files**: `apps/web/app/hooks/useAutoSave.ts`, `apps/api/src/services/drafts/auto-save.ts`

**Task**: Implement conflict resolution for concurrent edits
- **Deliverables**:
  - Detect conflicting edits (two users editing same field)
  - Conflict notification
  - Conflict resolution UI (choose version, merge manually)
  - Three-way merge view (base, yours, theirs)
  - Automatic merge for non-conflicting changes
  - Conflict resolution history
- **Dependencies**: Real-time collaboration complete
- **Estimate**: 3 days
- **Files**: `apps/api/src/services/collaboration/conflict-resolution.ts`

**Total Version Control**: 21 days (~4 weeks)

---

### 6. Task Management (2 weeks)

#### 6.1 Content Calendar

**Task**: Build content calendar integration
- **Deliverables**:
  - Calendar view (month, week, day views)
  - Drag-and-drop content packs to dates
  - Color-coded by status (draft, approved, published)
  - Filter by author, campaign, status, platform
  - Multi-select for bulk operations
  - Export calendar to ICS
  - Google Calendar sync (two-way)
  - Recurring content scheduling
- **Dependencies**: Content packs exist
- **Estimate**: 5 days
- **Files**: `apps/web/app/calendar/page.tsx`, `apps/api/src/services/calendar/manager.ts`

#### 6.2 Task System

**Task**: Create task assignment system
- **Deliverables**:
  - Task creation (title, description, assignee, due date)
  - Task types (write, review, approve, publish, edit)
  - Assign to user or role
  - Task status (todo, in progress, done)
  - Task priority (low, medium, high, urgent)
  - Link tasks to content packs
  - Task checklist items
  - Task attachments
- **Dependencies**: RBAC complete
- **Estimate**: 4 days
- **Files**: `apps/api/src/services/tasks/manager.ts`, `apps/api/src/routes/tasks.ts`

**Task**: Implement due date reminders
- **Deliverables**:
  - Reminder configuration (1 day before, 3 hours before, etc.)
  - Automatic reminder notifications
  - Email reminders
  - In-app reminder notifications
  - Overdue task highlighting
  - Reminder snooze option
  - Escalation for overdue tasks
- **Dependencies**: Task system, notification system
- **Estimate**: 2 days
- **Files**: `apps/api/src/services/tasks/reminders.ts`

#### 6.3 Bulk Operations & Search

**Task**: Build bulk operations
- **Deliverables**:
  - Multi-select content packs
  - Bulk approve
  - Bulk schedule/publish
  - Bulk tag assignment
  - Bulk status change
  - Bulk delete
  - Bulk assign to campaign
  - Bulk export
  - Operation confirmation modal
  - Batch job progress indicator
- **Dependencies**: None
- **Estimate**: 3 days
- **Files**: `apps/api/src/services/bulk/operations.ts`, `apps/web/app/components/BulkActions.tsx`

**Task**: Create custom metadata and tagging system
- **Deliverables**:
  - Tag creation and management
  - Tag categorization (topic, audience, priority, etc.)
  - Multi-tag support
  - Tag autocomplete
  - Tag-based filtering
  - Custom field definitions
  - Custom field types (text, number, date, dropdown, multi-select)
  - Custom field values per content pack
- **Dependencies**: None
- **Estimate**: 3 days
- **Files**: `apps/api/src/services/metadata/tags.ts`, `apps/api/src/services/metadata/custom-fields.ts`

**Task**: Implement advanced search and filtering
- **Deliverables**:
  - Full-text search across all content
  - Filter by status, author, date range, tags, campaign
  - Saved searches
  - Search history
  - Advanced query syntax (AND, OR, NOT)
  - Sort by relevance, date, title, author
  - Search within search results
  - Export search results
- **Dependencies**: None
- **Estimate**: 4 days
- **Files**: `apps/api/src/services/search/engine.ts`, `apps/web/app/search/page.tsx`

#### 6.4 Workflow Visualization

**Task**: Build kanban board view
- **Deliverables**:
  - Kanban columns by status (draft, review, approved, scheduled, published)
  - Drag-and-drop between columns
  - Card view with key metadata
  - Filter by author, campaign, date
  - Swimlanes (group by campaign or author)
  - Column limits (WIP limits)
  - Collapsed/expanded view
- **Dependencies**: None
- **Estimate**: 4 days
- **Files**: `apps/web/app/kanban/page.tsx`

**Task**: Create task dependencies and blocking
- **Deliverables**:
  - Define task dependencies (A blocks B)
  - Visual dependency graph
  - Circular dependency detection
  - Auto-notification when blocker resolved
  - Critical path calculation
  - Dependency timeline view
- **Dependencies**: Task system complete
- **Estimate**: 2 days
- **Files**: `apps/api/src/services/tasks/dependencies.ts`

**Total Task Management**: 27 days (~5.5 weeks)

---

### 7. User Interface & Experience (1.5 weeks)

#### 7.1 Collaboration UI Components

**Task**: Build team dashboard
- **Deliverables**:
  - Team activity overview
  - Active team members list
  - Pending approvals widget
  - Upcoming deadlines widget
  - Recent comments widget
  - Publishing calendar widget
  - Quick stats (content by status)
- **Dependencies**: All collaboration features complete
- **Estimate**: 3 days
- **Files**: `apps/web/app/dashboard/page.tsx`

**Task**: Create approval dashboard
- **Deliverables**:
  - Pending approvals list
  - Approve/reject quick actions
  - Approval history timeline
  - Filter by content type, author, date
  - Sort by urgency, due date
  - Bulk approve option
- **Dependencies**: Approval system complete
- **Estimate**: 2 days
- **Files**: `apps/web/app/approvals/page.tsx`

**Task**: Build version history UI
- **Deliverables**:
  - Version timeline view
  - Version comparison interface
  - Rollback confirmation modal
  - Branch management UI
  - Conflict resolution interface
- **Dependencies**: Version control complete
- **Estimate**: 3 days
- **Files**: `apps/web/app/packs/[id]/versions/page.tsx`

**Task**: Create task management UI
- **Deliverables**:
  - Task list with filters
  - Task creation modal
  - Task detail view
  - Task status update
  - Task assignment interface
  - My tasks view
- **Dependencies**: Task system complete
- **Estimate**: 2 days
- **Files**: `apps/web/app/tasks/page.tsx`

**Total UI/UX**: 10 days (~2 weeks)

---

### 8. Testing & Quality Assurance (1.5 weeks)

#### 8.1 Integration Tests

**Task**: Write authentication and authorization tests
- **Deliverables**:
  - User registration and login
  - JWT token validation
  - OAuth flows (mocked)
  - Permission checks
  - Team workspace operations
- **Dependencies**: Auth system complete
- **Estimate**: 2 days
- **Files**: `apps/api/src/__tests__/auth.test.ts`

**Task**: Write collaboration feature tests
- **Deliverables**:
  - Real-time editing (WebSocket mocked)
  - Comment CRUD operations
  - Mentions and notifications
  - Presence tracking
- **Dependencies**: Collaboration features complete
- **Estimate**: 2 days
- **Files**: `apps/api/src/__tests__/collaboration.test.ts`

**Task**: Write approval workflow tests
- **Deliverables**:
  - Workflow execution
  - Sequential and parallel approvals
  - Conditional routing
  - SLA tracking
  - Escalation logic
  - Delegation
- **Dependencies**: Workflow system complete
- **Estimate**: 3 days
- **Files**: `apps/api/src/__tests__/workflows.test.ts`

**Task**: Write version control tests
- **Deliverables**:
  - Version creation and retrieval
  - Rollback operations
  - Branch and merge
  - Diff generation
  - Conflict detection
- **Dependencies**: Version control complete
- **Estimate**: 2 days
- **Files**: `apps/api/src/__tests__/versions.test.ts`

#### 8.2 End-to-End Tests

**Task**: Create E2E tests for collaboration workflows
- **Deliverables**:
  - User registration → team invite → collaboration
  - Create content → request approval → approve → publish
  - Comment on content → mention user → resolve
  - Edit content → create version → rollback
  - Multi-user concurrent editing
- **Dependencies**: All features complete
- **Estimate**: 3 days
- **Files**: `apps/web/__tests__/e2e/collaboration.spec.ts`

**Total Testing**: 12 days (~2.5 weeks)

---

### 9. Documentation & Training (1 week)

#### 9.1 User Documentation

**Task**: Write team setup and workflow documentation
- **Deliverables**:
  - Getting started with teams
  - Inviting team members
  - Setting up approval workflows
  - Best practices for collaboration
  - Troubleshooting common issues
- **Dependencies**: All features complete
- **Estimate**: 2 days
- **Files**: `docs/collaboration/team-setup.md`

**Task**: Create admin guide for permission management
- **Deliverables**:
  - Understanding roles and permissions
  - Creating custom workflows
  - Managing team members
  - Audit log access
  - Security best practices
- **Dependencies**: All features complete
- **Estimate**: 2 days
- **Files**: `docs/collaboration/admin-guide.md`

#### 9.2 Video Tutorials

**Task**: Create video tutorials for collaboration
- **Deliverables**:
  - "Setting Up Your Team Workspace" (7 min)
  - "Creating Approval Workflows" (10 min)
  - "Collaborating on Content in Real-Time" (8 min)
  - "Using Version Control and History" (6 min)
- **Dependencies**: All features complete
- **Estimate**: 1 day
- **Platform**: Loom or similar

**Task**: Create interactive onboarding flow
- **Deliverables**:
  - Product tour for new users
  - Role-specific onboarding (admin, writer, approver)
  - Interactive tutorials
  - Tooltips and contextual help
  - Onboarding checklist
- **Dependencies**: All features complete
- **Estimate**: 2 days
- **Files**: `apps/web/app/components/Onboarding.tsx`

**Total Documentation**: 7 days

---

## Task Dependencies Diagram

```
[Authentication] → [RBAC] → [Team Workspace] → [User Profiles]
                      ↓
                [Permissions Middleware]
                      ↓
          [Real-Time Collaboration] → [Presence] → [Comments] → [@Mentions]
                      ↓
              [Notifications] → [Activity Feed] → [Audit Logs]
                      ↓
          [Workflow Engine] → [Approval Chain Builder] → [Approval UI]
                      ↓
    [Conditional Rules, SLA, Escalation, Delegation]
                      ↓
          [Version History] → [Snapshots] → [Rollback] → [Branch/Merge]
                      ↓
              [Diff Tool, Conflict Resolution]
                      ↓
          [Task System] → [Calendar] → [Reminders] → [Kanban Board]
                      ↓
          [Bulk Operations, Search, Tags]
                      ↓
                  [UI Components]
                      ↓
              [Testing & Documentation]
```

---

## Timeline Summary

| Week | Focus | Tasks |
|------|-------|-------|
| 1-2 | Authentication & Authorization | User auth, OAuth, RBAC, teams, profiles |
| 3-4 | Real-Time Collaboration | WebSocket, presence, comments, mentions |
| 5 | Notifications & Activity | Multi-channel notifications, activity feed, audit logs |
| 6-8 | Approval Workflows | Workflow engine, builder UI, SLA, escalation, delegation |
| 9-10 | Version Control | Version history, snapshots, rollback, branch/merge, diff |
| 11-12 | Task Management | Calendar, tasks, reminders, kanban, bulk ops, search |
| 13 | User Interface | Dashboards, approval UI, version UI, task UI |
| 14 | Testing | Integration + E2E tests |
| 15 | Documentation | User guides, admin docs, videos, onboarding |

---

## Resource Allocation

### Engineering Team (6 FTE)

**Backend Engineers (3):**
- Engineer 1: Authentication, RBAC, teams (Weeks 1-2), then workflows (Weeks 6-8)
- Engineer 2: Real-time collaboration, WebSocket, presence (Weeks 3-4), then version control (Weeks 9-10)
- Engineer 3: Notifications, activity feed (Week 5), then task management (Weeks 11-12)

**Frontend Engineers (2):**
- Engineer 1: Auth UI, team management UI, approval UI (Weeks 1-8)
- Engineer 2: Collaboration UI, version control UI, task UI (Weeks 3-12)

**Full-Stack Engineer (1):**
- Calendar integration (Weeks 1-3)
- Kanban board (Weeks 4-5)
- Bulk operations (Weeks 6-7)
- Search and filtering (Weeks 8-9)
- Testing support (Weeks 10-13)
- Documentation (Weeks 14-15)

---

## Database Schema Changes

### New Tables

**users**
```sql
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,  -- nullable for OAuth-only users
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

**oauth_accounts**
```sql
CREATE TABLE oauth_accounts (
  account_id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
  provider TEXT NOT NULL,  -- google, microsoft, github
  provider_account_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);
```

**teams**
```sql
CREATE TABLE teams (
  team_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT REFERENCES users(user_id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**team_members**
```sql
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  team_id TEXT REFERENCES teams(team_id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
  role TEXT NOT NULL,  -- admin, content_lead, writer, marketing_ops, viewer
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
```

**team_invitations**
```sql
CREATE TABLE team_invitations (
  invitation_id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(team_id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  invited_by TEXT REFERENCES users(user_id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_email ON team_invitations(email);
CREATE INDEX idx_invitations_token ON team_invitations(token);
```

**comments**
```sql
CREATE TABLE comments (
  comment_id TEXT PRIMARY KEY,
  pack_id TEXT REFERENCES content_packs(pack_id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES comments(comment_id),  -- for threading
  author_id TEXT REFERENCES users(user_id),
  content TEXT NOT NULL,
  anchor_field TEXT,  -- which field the comment is on
  anchor_position JSONB,  -- text selection range
  status TEXT DEFAULT 'open',  -- open, resolved
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_pack ON comments(pack_id);
CREATE INDEX idx_comments_author ON comments(author_id);
```

**mentions**
```sql
CREATE TABLE mentions (
  mention_id TEXT PRIMARY KEY,
  comment_id TEXT REFERENCES comments(comment_id) ON DELETE CASCADE,
  mentioned_user_id TEXT REFERENCES users(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, mentioned_user_id)
);

CREATE INDEX idx_mentions_user ON mentions(mentioned_user_id);
```

**notifications**
```sql
CREATE TABLE notifications (
  notification_id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- mention, approval, comment, publish, etc.
  title TEXT NOT NULL,
  message TEXT,
  link_url TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
```

**workflows**
```sql
CREATE TABLE workflows (
  workflow_id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(team_id),
  name TEXT NOT NULL,
  description TEXT,
  definition JSONB NOT NULL,  -- workflow steps, conditions, actions
  is_active BOOLEAN DEFAULT true,
  created_by TEXT REFERENCES users(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**approval_requests**
```sql
CREATE TABLE approval_requests (
  request_id TEXT PRIMARY KEY,
  pack_id TEXT REFERENCES content_packs(pack_id) ON DELETE CASCADE,
  workflow_id TEXT REFERENCES workflows(workflow_id),
  current_step INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',  -- pending, approved, rejected, changes_requested
  requested_by TEXT REFERENCES users(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approval_requests_pack ON approval_requests(pack_id);
CREATE INDEX idx_approval_requests_status ON approval_requests(status);
```

**approval_steps**
```sql
CREATE TABLE approval_steps (
  step_id TEXT PRIMARY KEY,
  request_id TEXT REFERENCES approval_requests(request_id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  approver_id TEXT REFERENCES users(user_id),
  status TEXT DEFAULT 'pending',  -- pending, approved, rejected, skipped
  feedback TEXT,
  responded_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approval_steps_request ON approval_steps(request_id);
CREATE INDEX idx_approval_steps_approver ON approval_steps(approver_id);
```

**content_versions**
```sql
CREATE TABLE content_versions (
  version_id TEXT PRIMARY KEY,
  pack_id TEXT REFERENCES content_packs(pack_id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,  -- v1.0, v1.1, v2.0
  snapshot JSONB NOT NULL,  -- full content snapshot
  change_summary TEXT,
  created_by TEXT REFERENCES users(user_id),
  is_major BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_versions_pack ON content_versions(pack_id);
```

**tasks**
```sql
CREATE TABLE tasks (
  task_id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(team_id),
  pack_id TEXT REFERENCES content_packs(pack_id),
  title TEXT NOT NULL,
  description TEXT,
  assignee_id TEXT REFERENCES users(user_id),
  status TEXT DEFAULT 'todo',  -- todo, in_progress, done
  priority TEXT DEFAULT 'medium',  -- low, medium, high, urgent
  due_at TIMESTAMPTZ,
  created_by TEXT REFERENCES users(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_pack ON tasks(pack_id);
CREATE INDEX idx_tasks_status ON tasks(status);
```

**tags**
```sql
CREATE TABLE tags (
  tag_id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(team_id),
  name TEXT NOT NULL,
  category TEXT,  -- topic, audience, priority, etc.
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, name)
);

CREATE TABLE content_tags (
  id SERIAL PRIMARY KEY,
  pack_id TEXT REFERENCES content_packs(pack_id) ON DELETE CASCADE,
  tag_id TEXT REFERENCES tags(tag_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pack_id, tag_id)
);
```

### Migration File
- **File**: `infra/migrations/005_phase3_schema.sql`

---

## Environment Variables Required

```bash
# Authentication
JWT_SECRET=  # 32+ character random string
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_REDIRECT_URI=http://localhost:3000/auth/microsoft/callback

# SAML (Enterprise SSO)
SAML_ENTRY_POINT=
SAML_ISSUER=
SAML_CERT=

# Email (for invitations, notifications)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=noreply@contentmultiplier.com

# WebSocket
WEBSOCKET_PORT=3002
WEBSOCKET_CORS_ORIGIN=http://localhost:3000

# Slack Integration
SLACK_WEBHOOK_URL=  # For notifications

# Microsoft Teams Integration
TEAMS_WEBHOOK_URL=  # For notifications

# Session
SESSION_SECRET=  # 32+ character random string
SESSION_EXPIRY=86400  # 24 hours in seconds

# Notifications
NOTIFICATION_BATCH_INTERVAL=300000  # 5 minutes in ms (for digest mode)
```

---

## Success Criteria

### Technical Metrics
- [ ] Support 50+ concurrent users in real-time editing
- [ ] WebSocket connection uptime > 99%
- [ ] Approval workflow execution time < 2 seconds
- [ ] Version diff generation < 1 second
- [ ] Zero data loss during concurrent edits
- [ ] Notification delivery < 5 seconds

### User Metrics
- [ ] Time to approve content < 2 minutes (60% reduction from Phase 2)
- [ ] Approval cycle time < 4 hours (from request to final approval)
- [ ] Team collaboration adoption rate > 80%
- [ ] User satisfaction with collaboration features > 8.5/10
- [ ] <3 support tickets per week related to permissions

### Business Metrics
- [ ] Support 10+ concurrent users per workspace
- [ ] 100% audit trail coverage for compliance
- [ ] 5+ team workspaces active
- [ ] Average 15 approvals per day per workspace
- [ ] Version rollback usage < 5% (indicating fewer mistakes)

---

## Risk Mitigation

### High-Risk Items

1. **Real-Time Sync Complexity**
   - **Risk**: Operational Transformation/CRDT complexity leads to sync issues
   - **Mitigation**: Use established library (Yjs, Automerge), extensive testing, fallback to last-save

2. **WebSocket Scaling**
   - **Risk**: WebSocket connections don't scale well
   - **Mitigation**: Use Redis for pub/sub, horizontal scaling with sticky sessions, connection pooling

3. **Permission Complexity**
   - **Risk**: Complex RBAC leads to security holes or usability issues
   - **Mitigation**: Permission testing framework, security audit, clear documentation, default deny

4. **Approval Bottlenecks**
   - **Risk**: Approval workflows slow down content velocity
   - **Mitigation**: SLA tracking, escalation, delegation, parallel approvals, auto-approval rules

5. **Data Conflicts**
   - **Risk**: Concurrent edits lead to data loss
   - **Mitigation**: Conflict detection, resolution UI, version snapshots, auto-save

---

## Integration Points

### With Phase 1 (Publishing)
- Approval workflows gate publishing
- Team members can schedule on behalf of others
- Publishing notifications sent to team
- Audit log tracks who published what

### With Phase 2 (Advanced Content)
- Templates shared across team workspace
- Style guides enforced team-wide
- Asset library accessible to all team members
- Campaigns managed collaboratively

### With Phase 4 (Analytics)
- Track approval velocity by user
- Team performance metrics
- Collaboration engagement analytics
- Workflow bottleneck identification

---

## Testing Strategy

### Unit Tests (Weeks 1-13, ongoing)
- Permission checking logic
- Workflow state transitions
- Version diff algorithms
- Conflict detection
- Notification triggering

### Integration Tests (Week 14)
- Authentication flow (register, login, OAuth)
- Team invitation and acceptance
- Approval workflow execution
- Real-time collaboration (mocked WebSocket)
- Version creation and rollback

### E2E Tests (Week 14)
- Multi-user collaboration scenario
- Complete approval workflow
- Conflict resolution flow
- Task assignment and completion

### Load Tests (Week 14)
- 100 concurrent WebSocket connections
- 50 simultaneous approval requests
- Version diff with 10MB content
- Notification delivery to 1000 users

---

## Security Considerations

### Authentication & Authorization
- Password hashing with bcrypt (10+ rounds)
- JWT with short expiry (24 hours)
- Refresh tokens with rotation
- OAuth state parameter for CSRF protection
- SAML signature validation

### Data Protection
- Row-level security for multi-tenant data
- Encrypted API tokens at rest
- HTTPS only for all connections
- Secure WebSocket (WSS)
- Rate limiting on auth endpoints

### Audit & Compliance
- Immutable audit logs
- GDPR right to be forgotten (user deletion)
- Data export for compliance
- Session timeout enforcement
- IP address logging

---

## Next Steps After Phase 3

1. **Analytics on Collaboration**: Track team productivity, approval velocity
2. **Advanced Workflows**: Conditional approvals based on AI content quality score
3. **External Integrations**: Jira, Asana, Trello for task sync
4. **Mobile App**: Real-time collaboration on mobile
5. **AI Suggestions**: AI recommends reviewers based on content type

---

**Document Version**: 1.0
**Last Updated**: 2025-11-07
**Status**: Ready for implementation
