# CortexFlow: Self-Healing Company Brain — Project Goals & Architecture Reference

## 1. Core Product Mission
**CortexFlow** is a "Self-Healing Company Brain" built directly on **FalkorDB** (a low-latency graph database powered by Redis graph engine technology). Its primary purpose is to permanently eliminate **Organizational Knowledge Rot**.

In modern high-velocity engineering organizations, critical context is fractured across:
- Ephemeral Slack chats (#eng-backend, incident war rooms)
- Issue trackers (Jira / Linear bug reports and SLA commitments)
- Architecture decision records (ADRs) and markdown documentation

When an engineer leaves, makes an architectural change in a Slack thread, or misses a bug SLA, documentation quickly rots, downstream teams are blindsided by broken dependencies, and newcomer onboarding stalls.

**CortexFlow solves this by:**
1. Ingesting live events (Slack consensus, tickets, decisions, docs) into a live FalkorDB graph using atomic Cypher `MERGE` queries.
2. Tracing multi-hop decision lineage and ownership weights (`OWNS.weight`).
3. Proactively computing blast-radius warnings for upstream blockers (e.g. `Checkout-UI` depending on degraded `Auth-Service`).
4. Automatically flagging outdated documents as `stale` via `[:CONTRADICTS]` edges when new decisions supersede them.
5. Providing an interactive, self-healing workflow to prune contradiction edges and update documentation ground truth in real time.

---

## 2. Hard Architectural Rules & Non-Negotiables
> **CRITICAL MANDATE: Zero Mock / Fake Data**
> - Under no circumstances is the frontend allowed to render hardcoded mock data for graph topologies, commitments, or chat answers.
> - Every UI action (viewing the concentric graph, submitting a query, ingesting a Slack chat, fast-forwarding time, approving doc updates, resetting the database) **must execute a real Cypher query on the live FalkorDB database** via FastAPI.
> - The UI must always display the **exact executed Cypher query** and the **real database execution latency** in milliseconds returned by FalkorDB.

---

## 3. Graph Schema & Concentric Topology (cortexflow_brain)

The graph is organized into 3 concentric rings for optimal cognitive hierarchy:

### Ring 1: Core Systems (The Foundation)
- Node Label: `System`
- Examples: `sys_auth` (Auth-Service, Tier-1), `sys_pay` (Payment-API, Tier-1), `sys_check` (Checkout-UI, Tier-2)
- Attributes: `id`, `name`, `status` (`healthy` | `degraded`), `tier`, `ring: 1`

### Ring 2: People & Ownership (Who Knows What)
- Node Label: `Person`
- Examples: `p_arjun` (Arjun Mehta, @Arjun), `p_priya` (Priya Sharma, @Priya), `p_sarah` (Sarah Jenkins, @Sarah), `p_rohit` (Rohit Verma, @Rohit)
- Attributes: `id`, `name`, `handle`, `role`, `team`, `ring: 2`
- Edges:
  - `(p:Person)-[:OWNS {weight: int}]->(s:System)` (e.g. Arjun owns Payment-API with 95% weight)

### Ring 3: Decisions, Artifacts & Ephemeral Context
- Node Labels:
  - `Decision`: e.g. `dec_new` (Decision-02, active 5s timeout), `dec_old` (Decision-01, superseded 30s timeout)
  - `Ticket`: e.g. `b_402` (OAuth crash, public), `b_999` (Key rotation exploit, restricted), `t_104` (Timeout reduction)
  - `Document`: e.g. `doc_arch` (Arch_Doc_v1.md, stale), `doc_sprint` (Sprint_Sync_Doc.md)
  - `ChatThread`: e.g. `chat_pay` (#eng-backend), `chat_auth` (#incident-auth)
- Edges:
  - `[:DEPENDS_ON]` between systems (e.g. `Checkout-UI` -> `Auth-Service`)
  - `[:AFFECTS]` from Tickets and Decisions to Systems
  - `[:COMMITTED_TO {remaining_hours, due_hours, source_doc}]` from Person to Ticket
  - `[:DERIVED_FROM]` from Decision to ChatThread / Ticket / Document
  - `[:SUPERSEDES]` from new Decision to old Decision
  - `[:CONTRADICTS]` from Decision to Document (triggers `status = 'stale'`)
  - `[:AUTHORED]` from Person to Document / ChatThread

---

## 4. API Endpoints Specification

All endpoints run on `http://localhost:8000` interfacing with FalkorDB:

| Method | Endpoint | Description | Cypher Operation |
|---|---|---|---|
| `GET` | `/graph?role=senior\|intern` | Retrieves full graph topology, active commitments, and stale docs. Applies RBAC masking for intern role. | `MATCH (n) ...`, `MATCH (s)-[r]->(t) ...`, `MATCH (p)-[c:COMMITTED_TO]->(b)...`, `MATCH (dec)-[:CONTRADICTS]->(doc)...` |
| `POST` | `/ask` | Q&A endpoint executing multi-hop read-only Cypher queries. Returns answer, sources, executed Cypher, real latency, and proactive alerts. | `MATCH (s:System {id: ...}) OPTIONAL MATCH ...` with `validate_readonly_cypher` guardrail. |
| `POST` | `/ingest` | Live ingestion of Slack discussions, bug tickets, or docs. Connects new nodes without duplication. | `MERGE (c:ChatThread {id: ...}) ... MERGE (d:Decision) ... MERGE (d)-[:CONTRADICTS]->(doc)` |
| `POST` | `/simulate-time` | Fast-forwards the clock by specified hours, decrementing remaining hours on `COMMITTED_TO` edges. Flags overdue commitments when `remaining_hours <= 0`. | `MATCH (p)-[c:COMMITTED_TO]->(b) SET c.remaining_hours = ...` |
| `POST` | `/approve-doc-update` | Self-healing action: synchronizes stale doc with active ground truth, sets status to `active`, and deletes `[:CONTRADICTS]` edges. | `MATCH (d:Document {id: ...}) SET d.status = 'active' WITH d MATCH (dec)-[r:CONTRADICTS]->(d) DELETE r` |
| `POST` | `/reset` | Re-seeds FalkorDB to the baseline 17-node, 26-edge canonical dataset. | `seed_graph()` |

---

## 5. Security & RBAC Guardrails
- **Read-Only Cypher Guardrail (`/ask`):** Prohibits `DELETE`, `DROP`, `DETACH`, `REMOVE`, `SET`, `CREATE`, `MERGE` keywords in questions or generated Q&A queries.
- **Role-Based Access Control (RBAC):**
  - **Senior:** Full visibility into all systems, decisions, and security vulnerability tickets (e.g. `Bug-999`).
  - **Intern:** Any node or ticket flagged with `sensitivity == 'restricted'` is masked with `[RESTRICTED - Security Clearance Required]`, locked in the visual graph, and excluded from public proactive alerts.
