plan.md
1) Product Summary

Build a diagram-first project planning tool where users decompose an application into connected “cards” (nodes). Each card stores a title, description, and requirements checklist. Users can visually build a tree/graph from a root concept down to small functional units. The diagram becomes both a design artifact and a build backlog.

Example: a “LightConsole” project broken into Main → PC → Magic Panel → 8x8 grid → cells → cues/groups/palettes, etc.
2) MVP Scope (Definition of Done)

Diagram / Cards

    Create a project with a root card.
    Add child cards from any card (creates an edge).
    Drag cards to reposition on canvas; positions persist.
    Click a card to open an editor (side panel or modal):
        Edit title
        Edit description
        Manage requirements (add/edit/toggle done/delete)

Persistence

    SQLite storage for projects, nodes, edges, requirements.
    Load a project reliably from DB.
    Export project to JSON.
    Import project from JSON (validation + ID remap).

UI

    Tailwind + shadcn/ui components (Dialog/Drawer/Sheet, Button, Input, Textarea, Tabs as needed).
    Minimal toolbar: add node, zoom controls, export/import.

Quality

    Basic empty states and error handling.
    Reasonable keyboard shortcuts (optional MVP): Esc close panel, Del delete selected node.
    Tests for server-side DB functions (at least happy-path CRUD + import validation).

3) Non-Goals (MVP)

    Real-time collaboration
    Multi-user permissions
    Complex relationship types (dependencies, references)
    Full rich-text editor
    Auto-layout (optional later; freeform drag is fine)

4) Tech Stack Decisions (Target)

    Next.js (App Router recommended)
    SQLite
        Use one of:
            better-sqlite3 (fast, simple; Node runtime)
            sqlite + sqlite3 (async)
            Prisma (heavier but great DX)
    TailwindCSS
    shadcn/ui
    Diagram rendering
        Recommended: React Flow (nodes/edges, pan/zoom, drag, selection, minimap)

5) Architecture Overview
5.1 Runtime + Rendering

    Diagram page is a client component (React Flow is client-side).
    Data loading happens server-side via route handlers or server actions.
    Client fetches initial project graph and saves changes via API (recommended) or server actions.

5.2 Data Ownership

    Server owns canonical state in SQLite.
    Client holds temporary UI state (selected node, panel open, draft edits).
    Save operations are explicit (button) or debounced autosave (later).

6) Data Model (SQLite)
Tables

projects

    id (uuid/text)
    title
    description
    created_at
    updated_at

nodes

    id
    project_id (FK)
    title
    description
    x (real)
    y (real)
    created_at
    updated_at

edges

    id
    project_id (FK)
    source_node_id (FK)
    target_node_id (FK)
    type (text, default "parent")
    created_at

requirements

    id
    node_id (FK)
    text
    done (integer/bool)
    sort_order (integer)
    created_at
    updated_at

Indexes / constraints

    nodes(project_id)
    edges(project_id)
    requirements(node_id)
    Optional: unique (project_id, source_node_id, target_node_id, type) to prevent duplicates.

7) API Design (Next.js Route Handlers)

Routes (suggested):

    GET /api/projects list
    POST /api/projects create (creates root node too)
    GET /api/projects/:id fetch project graph (project + nodes + edges + requirements)
    PATCH /api/nodes/:id update node title/description/position
    POST /api/nodes create node (optionally with parent edge)
    DELETE /api/nodes/:id delete node (and cascade requirements + edges)
    POST /api/edges create edge
    DELETE /api/edges/:id delete edge
    POST /api/import import JSON into DB
    GET /api/projects/:id/export export JSON

(If you prefer fewer endpoints: one PATCH /api/projects/:id/graph can batch-save nodes/edges/requirements.)
8) UI Plan (Next.js + shadcn)
Pages

    / Projects list
    /projects/[id] Diagram editor

Diagram editor layout

    Top bar (shadcn Toolbar-like composition)
        Project title
        Buttons: Add Card, Export, Import
    Canvas (React Flow)
    Right side panel (shadcn Sheet)
        Card editor:
            Title (Input)
            Description (Textarea)
            Requirements list (Checkbox + inline edit)
            Actions: Add requirement, Delete card

Node (Card) component (React Flow custom node)

    Shows title
    Optional small badges (requirements count / done count)
    Handles: top/bottom or left/right depending on layout preference

9) Implementation Phases
Phase 1 — Scaffold + DB

    Initialize Next.js project with Tailwind and shadcn/ui.
    Add SQLite integration and DB migration strategy (choose: drizzle/prisma/manual SQL).
    Implement DB access layer:
        createProjectWithRootNode
        getProjectGraph(projectId)
        updateNode
        createNodeWithEdge(parentId?)
        deleteNodeCascade

Phase 2 — Diagram Rendering

    Build /projects/[id] page.
    Load graph from server and pass to client component.
    Render nodes/edges in React Flow.
    Enable pan/zoom, selection, drag.
    Persist node position on drag stop.

Phase 3 — Card Detail Editing

    Click node → open Sheet.
    Edit title/description → save to API.
    Requirements CRUD:
        Add requirement
        Toggle done
        Edit text
        Delete requirement
    Reflect updates in node badge counts.

Phase 4 — Graph Editing

    “Add child card” action:
        From selected node: create node + edge
        Auto-place child near parent
    Delete node (confirmation dialog) and cascade edges/requirements.
    Optional: create edge by dragging connection handle (React Flow supports this).

Phase 5 — Import/Export

    Export current project as JSON (download).
    Import JSON into new project (or overwrite existing—prefer “new project” for safety).
    Validate schema and handle ID remapping.

Phase 6 — Polish

    Empty states, loading skeletons, toasts.
    Basic keyboard shortcuts.
    Minimal tests for DB layer + import validation.

10) Risks / Notes

    React Flow requires client components; keep server/client boundary clean.
    SQLite in Next.js:
        Ensure Node runtime for API routes that use native modules (e.g., better-sqlite3).
        Consider deployment target (Vercel serverless + SQLite is tricky). If you plan Vercel, you may want Turso/libSQL or Postgres later.
    Import validation and migrations: plan for versioning JSON format early (schemaVersion).

11) Next Decisions (to unblock coding)

    App Router vs Pages Router
    SQLite tooling: Prisma vs Drizzle vs manual
    Diagram: React Flow vs custom canvas
    Deployment target (local/self-host vs Vercel)
