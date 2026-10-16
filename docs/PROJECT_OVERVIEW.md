# CortexFlow — Executive Project Overview

## Overview
**CortexFlow** is an autonomous, self-healing "Company Brain" built for the **Graph Hacks: Context for AI Agents** hackathon (targeting **Track 03: Company Brain**, with qualifications for **Track 01: Connected Data** and **Track 02: Agent Memory**).

The primary goal is to eliminate **Organizational Knowledge Rot**. In engineering organizations, official architecture documentation frequently degrades because critical technical decisions, workarounds, and SLA agreements occur inside Slack chats, incident threads, and issue trackers. Standard Vector RAG fails to resolve this because vector embeddings cannot evaluate temporal superseding, causal lineage, or dependency blast radiuses. CortexFlow models company knowledge as an active, interconnected property graph in FalkorDB, proactively alerting engineers to blockers, decaying SLAs, and contradicted documentation in real time.

---

## Technical Architecture & Core Stack
- **Graph Engine**: FalkorDB running in Docker (`localhost:6379`), managed visually via the FalkorDB Browser (`localhost:3000`).
- **Backend**: FastAPI (`localhost:8000`), handling sub-5ms multi-hop Cypher queries, regex entity extraction, Cypher MERGE ingestion, and a read-only Cypher query security guardrail.
- **Frontend**: React + Vite (`localhost:5173`) styled with Tailwind CSS, Lucide icons, and an interactive concentric SVG graph visualizer.

### Aesthetic & Design Tokens
- **Linear/Datadog-inspired dark workspace**: Obsidian/Carbon background (`#0B0E16` / `#090A0F`), Slate panels (`#141927` / `#111318`), and subtle borders (`border-white/5` / `#1F2430`).
- **Semantic Intelligence Palette**:
  - **Synapse Cyan / Indigo** (`#06B6D4` / `#6366F1`): Active multi-hop graph traversal path and core System nodes.
  - **Sky Blue** (`#0EA5E9`): Person nodes and ownership confidence percentages.
  - **Trust Emerald** (`#10B981`): Active decisions, healthy system states, and validated documentation.
  - **Drift Amber** (`#F59E0B`): Stale contradicted documents and active SLAs under 6 hours remaining.
  - **Blocker Crimson** (`#F43F5E`): Degraded systems, active bugs, overdue SLAs, and downstream blocker warnings.
  - **Vault Violet** (`#8B5CF6`) & **Muted Slate** (`#94A3B8`): Restricted/locked security nodes under RBAC.

---

## Graph Schema Topology (`cortexflow_brain`)

### Concentric 3-Ring Node Hierarchy
1. **Ring 1 (Core Systems — Inner Center)**:
   - `sys_auth` (Auth-Service, status: degraded, tier: Tier-1)
   - `sys_pay` (Payment-API, status: healthy, tier: Tier-1)
   - `sys_check` (Checkout-UI, status: healthy, tier: Tier-2)
2. **Ring 2 (People & Ownership — Middle Ring)**:
   - `p_arjun` (Arjun Mehta, `@Arjun`, Senior Backend Eng)
   - `p_priya` (Priya Sharma, `@Priya`, Frontend Lead)
   - `p_sarah` (Sarah Jenkins, `@Sarah`, Staff Architect)
   - `p_rohit` (Rohit Verma, `@Rohit`, Security Engineer)
3. **Ring 3 (Institutional Context & Truth — Outer Ring)**:
   - **Documents**: `doc_arch` (Arch_Doc_v1.md, stale), `doc_sprint` (Sprint_Sync_Doc.md, active), `doc_sec` (Sec_Audit_Q4.md, restricted).
   - **Tickets & Bugs**: `t_104` (Ticket-104, 5s timeout, resolved), `b_402` (Bug-402, OAuth crash, open, 4h SLA), `b_999` (Bug-999, JWT exploit, open, 6h SLA, restricted).
   - **Chat Threads**: `chat_pay` (`#eng-backend` consensus), `chat_auth` (`#incident-auth` hotfix promise).
   - **Decisions**: `dec_old` (Decision-01, 30s timeout, superseded), `dec_new` (Decision-02, 5s fail-fast timeout, active).

### Relationship Semantics
- `[:DEPENDS_ON]`: Models architectural blast radiuses (Checkout-UI → Auth-Service, Checkout-UI → Payment-API, Payment-API → Auth-Service).
- `[:OWNS {weight}]`: Assigns system domain expertise scores (e.g., Arjun 95% on Payment-API & 90% on Auth-Service).
- `[:AUTHORED]`: Tracks source provenance from engineers to documents and decisions.
- `[:COMMITTED_TO {remaining_hours}]`: Tracks temporal accountability and SLA deadlines between engineers and bug tickets.
- `[:AFFECTS]`: Binds bugs, tasks, and architectural decisions to system nodes.
- `[:DERIVED_FROM]`: Traces decision lineage back to Slack threads, tickets, and docs.
- `[:SUPERSEDES]`: Links modern decisions over deprecated architectural decisions.
- `[:CONTRADICTS]`: Flags documentation drift, turning valid docs into stale status until auto-healed.

---

## What Has Been Completed & Verified
- **Local Infrastructure**: FalkorDB container running in Docker on ports 6379 and 3000.
- **Deterministic Seeding (`seed.py`)**: Automatically initializes and validates the 17-node, 26-edge company topology in FalkorDB without third-party dependencies.
- **FastAPI Engine (`main.py`)**:
  - `GET /graph?role=senior|intern`: Real-time FalkorDB graph serialization with Role-Based Access Control (masks restricted titles/descriptions and locks nodes for intern roles).
  - `POST /ask`: Multi-hop Cypher queries with sub-5ms execution times, latency measurement, read-only safety guardrails, and upstream blocker interception.
  - `POST /ingest`: Cypher MERGE endpoint incorporating real-time events without duplicating nodes.
  - `POST /simulate-time`: Decrements `remaining_hours` on `COMMITTED_TO` edges to trigger real-time OVERDUE alerts.
  - `POST /approve-doc-update`: Prunes `[:CONTRADICTS]` edges in FalkorDB and restores document status to active.
  - `POST /reset`: Re-seeds the canonical graph state cleanly.
- **Integration Verification**: Automated test suite passing against live FalkorDB endpoints.
- **Frontend UI Overhaul (`App.jsx`, `LeftPanel.jsx`, `RightGraph.jsx`, `CenterChat.jsx`)**:
  - 3-panel command dashboard built with semantic colors, generous padding, and solid circular graph nodes.
  - Active Commitments card matching Figma wireframe layout (Avatar, `@Arjun`, Bug-402 pill, and 4h left aligned on the top row).
  - Concentric 3-ring SVG canvas visualizer with dimming and Cyan spotlight traversal pathing.
  - Conversational AI responses with clean executive prose, inline clickable lineage pills, and consolidated blocker alerts.
