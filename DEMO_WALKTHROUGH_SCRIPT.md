# CortexFlow — 2-Minute Demo Video Recording Script

> **Video Duration**: ~2 minutes (120 seconds)  
> **Target Audience**: Hackathon Judges (Graph Hacks: Track 03: Company Brain, Track 01, Track 02)  
> **Prerequisites Running**: FalkorDB (`localhost:6379`), FastAPI (`localhost:8000`), Frontend (`localhost:5173`), FalkorDB Browser (`localhost:3000`).

---

## Visual Setup Checklist
- [ ] Browser window open to `http://localhost:5173`.
- [ ] Browser window zoomed to 100% or 110% for crisp text visibility.
- [ ] Terminal running FastAPI showing live Cypher logs.
- [ ] Reset graph state to fresh baseline using the `Reset Graph` button or `POST /reset`.

---

## Second-by-Second Walkthrough

### Act 1: The Problem — Organizational Knowledge Rot (0:00 – 0:25)
* **Screen**: Wide shot of CortexFlow 3-panel command dashboard.
* **Voiceover**:
  > *"Every engineering team suffers from Organizational Knowledge Rot. Architecture documents rot in wikis, while critical architectural decisions and incident workarounds happen in Slack and issue trackers. Vector RAG cannot solve this because vector embeddings cannot evaluate temporal superseding, causal blast radiuses, or contradictory drift. Meet CortexFlow—an autonomous, self-healing Company Brain built directly on FalkorDB."*
* **Visual Action**:
  - Point mouse cursor briefly across the 3 rings in the SVG canvas: Ring 1 (Core Systems), Ring 2 (Engineers), and Ring 3 (Decisions, Docs, Bugs).

---

### Act 2: Scenario 1 — Decision Lineage & Sub-3ms Cypher (0:25 – 0:50)
* **Screen**: Center Chat panel & Right Graph canvas.
* **Visual Action**:
  - Click the first pre-configured scenario chip: **`Payment-API Timeout Lineage`**.
  - Watch the conversational answer appear in sub-5ms with cyan spotlight pathing in the graph.
  - Expand the **"Inspect FalkorDB Cypher"** accordion.
* **Voiceover**:
  > *"Watch what happens when an engineer asks: 'Why did we change Payment-API timeout from 30s to 5s?' In under 3 milliseconds, FalkorDB executes a real multi-hop Cypher traversal. It answers in concise executive language: Decision-02 updated Payment-API 2 days ago to a 5-second fail-fast timeout, superseding Decision-01 and marking Arch_Doc_v1 stale. We can click directly on the verified lineage pills or open the Cypher drawer to inspect the exact query that ran on FalkorDB."*

---

### Act 3: Scenario 2 — Upstream Blocker Interception & Blast Radius (0:50 – 1:15)
* **Screen**: Scenario chip 2 -> Blocker warning banner & Left panel.
* **Visual Action**:
  - Click the second scenario chip: **`Checkout-UI Blockers & SLAs`**.
  - Point to the consolidated alert banner highlighting Auth-Service and Bug-402.
  - Click on the alert banner to highlight the dependency path in the graph.
* **Voiceover**:
  > *"Next, the Checkout team asks: 'What is blocking Checkout-UI?' Vector search finds nothing because the bug only mentions Auth-Service. But CortexFlow traverses the dependency graph: Checkout-UI depends on Auth-Service, which is degraded by Bug-402 with 4 hours remaining on Arjun's SLA. CortexFlow proactively intercepts upstream blockers before they cause production outages."*

---

### Act 4: Temporal Simulation & SLA Decay (1:15 – 1:35)
* **Screen**: Top navigation bar -> Left Panel Active Commitments.
* **Visual Action**:
  - In the top navbar, click the **`+4h Fast-Forward`** button.
  - Show the Active Commitments card instantly transitioning from amber (`4h left`) to crimson pulsing **`OVERDUE`**.
* **Voiceover**:
  > *"Knowledge isn't static—time decays commitments. When we fast-forward simulation time by 4 hours, CortexFlow executes a live Cypher mutation decrementing remaining hours directly in FalkorDB. Arjun's commitment instantly flips to Crimson OVERDUE, alerting the entire team."*

---

### Act 5: Anti-Rot Engine — 1-Click Auto-Healing (1:35 – 1:50)
* **Screen**: Left panel "Stale Documentation Drift" card.
* **Visual Action**:
  - Point to the stale `Arch_Doc_v1.md` card showing the contradiction reason.
  - Click the button **`Approve & Auto-Heal Doc`**.
  - Show the card vanishing and the document node in the graph turning from Drift Amber to Trust Emerald.
* **Voiceover**:
  > *"Notice this documentation drift card: Arch_Doc_v1 still claims the timeout is 30 seconds, contradicting our live consensus. With one click on 'Approve & Auto-Heal Doc', FastAPI runs Cypher to update the doc and delete the contradiction edge in FalkorDB. The graph visualizer immediately heals."*

---

### Act 6: Role-Based Access Control & Closing (1:50 – 2:05)
* **Screen**: Top Navbar Role Switcher -> Intern mode.
* **Visual Action**:
  - Switch the role toggle from **Senior** to **Intern**.
  - Show Bug-999 and Sec_Audit_Q4 getting masked with `[RESTRICTED]` and locked in muted slate.
* **Voiceover**:
  > *"Finally, CortexFlow enforces true Role-Based Access Control at the graph level. Switching to Intern role instantly masks sensitive security exploits and restricted audit docs. Zero mocked data, sub-5ms Cypher, self-healing memory. CortexFlow is the company brain engineering teams have been waiting for. Thank you!"*

---

## Key Talking Points Summary
1. **Zero Mock Guarantee**: 100% of nodes, edges, Cypher queries, mutations, and latencies execute live on FalkorDB.
2. **Deterministic Speed**: Graph queries execute in 0.8ms to 3ms.
3. **Graph Hacks Fit**: Perfectly exemplifies Track 03 (Company Brain), Track 01 (Connected Data), and Track 02 (Agent Memory).
