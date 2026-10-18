"""
CortexFlow - Seed Script for FalkorDB (cortexflow_brain)
Clears existing graph and populates a 17-node, 26-edge company dataset across 3 rings.
"""

import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
for p in (str(PROJECT_ROOT), str(BASE_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from falkordb import FalkorDB

FALKOR_HOST = os.getenv("FALKOR_HOST", "localhost")
FALKOR_PORT = int(os.getenv("FALKOR_PORT", 6379))
GRAPH_NAME = os.getenv("GRAPH_NAME", "cortexflow_brain")


def get_db():
    return FalkorDB(host=FALKOR_HOST, port=FALKOR_PORT)


def get_graph():
    db = get_db()
    return db.select_graph(GRAPH_NAME)


def seed_graph():
    db = get_db()
    graph = db.select_graph(GRAPH_NAME)

    print(f"[*] Resetting FalkorDB graph '{GRAPH_NAME}' on {FALKOR_HOST}:{FALKOR_PORT}...")
    try:
        graph.delete()
        print("  - Deleted existing graph.")
    except Exception as e:
        # If graph does not exist yet or delete is not supported on key
        try:
            graph.query("MATCH (n) DETACH DELETE n")
            print("  - Cleared existing nodes via DETACH DELETE.")
        except Exception as inner_e:
            print(f"  - Clean start (no prior graph found): {e} / {inner_e}")

    # Re-select clean graph
    graph = db.select_graph(GRAPH_NAME)

    print("[*] Creating 17 nodes...")

    # 1. Ring 1: Systems (3 nodes)
    systems_query = """
    CREATE (sys_auth:System {
        id: 'sys_auth',
        name: 'Auth-Service',
        status: 'degraded',
        tier: 'Tier-1',
        ring: 1
    }),
    (sys_pay:System {
        id: 'sys_pay',
        name: 'Payment-API',
        status: 'healthy',
        tier: 'Tier-1',
        ring: 1
    }),
    (sys_check:System {
        id: 'sys_check',
        name: 'Checkout-UI',
        status: 'healthy',
        tier: 'Tier-2',
        ring: 1
    })
    """
    graph.query(systems_query)

    # 2. Ring 2: Persons (4 nodes)
    persons_query = """
    CREATE (p_arjun:Person {
        id: 'p_arjun',
        name: 'Arjun Mehta',
        handle: '@Arjun',
        role: 'Senior Backend Eng',
        team: 'Backend Dev',
        department: 'Core Engineering',
        clearance: 'senior',
        email: 'arjun@cortexflow.internal',
        ring: 2
    }),
    (p_priya:Person {
        id: 'p_priya',
        name: 'Priya Sharma',
        handle: '@Priya',
        role: 'UI/UX & Frontend Lead',
        team: 'Design & Frontend',
        department: 'Product Design',
        clearance: 'senior',
        email: 'priya@cortexflow.internal',
        ring: 2
    }),
    (p_sarah:Person {
        id: 'p_sarah',
        name: 'Sarah Jenkins',
        handle: '@Sarah',
        role: 'Staff Architect',
        team: 'Architecture & Platform',
        department: 'Architecture',
        clearance: 'senior',
        email: 'sarah@cortexflow.internal',
        ring: 2
    }),
    (p_rohit:Person {
        id: 'p_rohit',
        name: 'Rohit Verma',
        handle: '@Rohit',
        role: 'Security & QA Lead',
        team: 'SecOps & QA',
        department: 'Security & Quality Assurance',
        clearance: 'senior',
        email: 'rohit@cortexflow.internal',
        ring: 2
    })
    """
    graph.query(persons_query)

    # 3. Ring 3: Documents, Tickets, ChatThreads, Decisions (10 nodes)
    ring3_query = """
    CREATE (doc_arch:Document {
        id: 'doc_arch',
        name: 'Arch_Doc_v1.md',
        content: 'Payment-API uses REST with a 30-second timeout window.',
        status: 'stale',
        sensitivity: 'public',
        design_impact: 'Misleading 30s guidance causes UX teams to implement prolonged loading spinners.',
        qa_impact: 'Causes QA E2E test suites to use obsolete 30s assertions.',
        dev_impact: 'Causes confusion with production 5s fail-fast worker thread configuration.',
        ring: 3
    }),
    (doc_sprint:Document {
        id: 'doc_sprint',
        name: 'Sprint_Sync_Doc.md',
        content: 'Arjun committed to patching Auth-Service Token Expiry crash (#Bug-402) within 24 hours so Checkout-UI is not blocked.',
        status: 'active',
        sensitivity: 'public',
        ring: 3
    }),
    (doc_sec:Document {
        id: 'doc_sec',
        name: 'Sec_Audit_Q4.md',
        content: 'Restricted internal audit: JWT signing key rotation vulnerability tracked in Bug-999.',
        status: 'active',
        sensitivity: 'restricted',
        ring: 3
    }),
    (t_104:Ticket {
        id: 't_104',
        name: 'Ticket-104',
        kind: 'task',
        title: 'Lower Payment-API timeout to 5s to stop queue pileup',
        status: 'resolved',
        due_hours: 0,
        remaining_hours: 0,
        sensitivity: 'public',
        ring: 3
    }),
    (b_402:Ticket {
        id: 'b_402',
        name: 'Bug-402',
        kind: 'bug',
        title: 'OAuth Token Expiry Crash under concurrent load',
        status: 'open',
        due_hours: 24,
        remaining_hours: 4,
        sensitivity: 'public',
        ring: 3
    }),
    (b_999:Ticket {
        id: 'b_999',
        name: 'Bug-999',
        kind: 'bug',
        title: 'Restricted: Legacy JWT Key Rotation Exploit',
        status: 'open',
        due_hours: 12,
        remaining_hours: 6,
        sensitivity: 'restricted',
        ring: 3
    }),
    (chat_pay:ChatThread {
        id: 'chat_pay',
        name: '#eng-backend',
        content: 'Arjun & Sarah agreed to drop Payment-API timeout from 30s to 5s after Stripe webhook latency spike.',
        timestamp: '2 days ago',
        ring: 3
    }),
    (chat_auth:ChatThread {
        id: 'chat_auth',
        name: '#incident-auth',
        content: 'Arjun confirmed Bug-402 breaks session refresh for Checkout-UI; promised hotfix within 24h.',
        timestamp: '5 hours ago',
        ring: 3
    }),
    (dec_old:Decision {
        id: 'dec_old',
        name: 'Decision-01',
        title: '30s Payment REST Timeout',
        status: 'superseded',
        ring: 3
    }),
    (dec_new:Decision {
        id: 'dec_new',
        name: 'Decision-02',
        title: '5s Fail-Fast Payment Timeout',
        status: 'active',
        rationale: 'Fail-fast prevents worker pool starvation during gateway latency spikes',
        design_impact: 'Checkout-UI loading spinner and retry UX must trigger at 5s, not 30s.',
        qa_impact: 'E2E regression test suite assertions for Payment-API must assert <= 5000ms fail-fast timeout.',
        dev_impact: 'Enforce 5s fail-fast timeout on Payment-API worker threads.',
        ring: 3
    })
    """
    graph.query(ring3_query)

    print("[*] Creating 26 edges...")

    # Edge creation queries
    edges_query = """
    MATCH (sys_auth:System {id: 'sys_auth'}),
          (sys_pay:System {id: 'sys_pay'}),
          (sys_check:System {id: 'sys_check'}),
          (p_arjun:Person {id: 'p_arjun'}),
          (p_priya:Person {id: 'p_priya'}),
          (p_sarah:Person {id: 'p_sarah'}),
          (p_rohit:Person {id: 'p_rohit'}),
          (doc_arch:Document {id: 'doc_arch'}),
          (doc_sprint:Document {id: 'doc_sprint'}),
          (doc_sec:Document {id: 'doc_sec'}),
          (t_104:Ticket {id: 't_104'}),
          (b_402:Ticket {id: 'b_402'}),
          (b_999:Ticket {id: 'b_999'}),
          (chat_pay:ChatThread {id: 'chat_pay'}),
          (chat_auth:ChatThread {id: 'chat_auth'}),
          (dec_old:Decision {id: 'dec_old'}),
          (dec_new:Decision {id: 'dec_new'})
    CREATE
        // 1-3. System Dependencies (3 edges)
        (sys_check)-[:DEPENDS_ON]->(sys_auth),
        (sys_check)-[:DEPENDS_ON]->(sys_pay),
        (sys_pay)-[:DEPENDS_ON]->(sys_auth),

        // 4-8. Person Ownership (5 edges)
        (p_arjun)-[:OWNS {weight: 95}]->(sys_pay),
        (p_arjun)-[:OWNS {weight: 90}]->(sys_auth),
        (p_priya)-[:OWNS {weight: 92}]->(sys_check),
        (p_sarah)-[:OWNS {weight: 85}]->(sys_pay),
        (p_rohit)-[:OWNS {weight: 88}]->(sys_auth),

        // 9-14. Authorship (6 edges)
        (p_sarah)-[:AUTHORED]->(doc_arch),
        (p_arjun)-[:AUTHORED]->(doc_sprint),
        (p_rohit)-[:AUTHORED]->(doc_sec),
        (p_arjun)-[:AUTHORED]->(chat_pay),
        (p_sarah)-[:AUTHORED]->(chat_pay),
        (p_arjun)-[:AUTHORED]->(chat_auth),

        // 15-16. Commitments (2 edges)
        (p_arjun)-[:COMMITTED_TO {due_hours: 24, remaining_hours: 4, source_doc: 'Sprint_Sync_Doc.md'}]->(b_402),
        (p_rohit)-[:COMMITTED_TO {due_hours: 12, remaining_hours: 6, source_doc: 'Sec_Audit_Q4.md'}]->(b_999),

        // 17-21. Impacts / Affects (5 edges)
        (t_104)-[:AFFECTS]->(sys_pay),
        (b_402)-[:AFFECTS]->(sys_auth),
        (b_999)-[:AFFECTS]->(sys_auth),
        (dec_old)-[:AFFECTS]->(sys_pay),
        (dec_new)-[:AFFECTS]->(sys_pay),

        // 22-24. Decision Lineage / Derivation (3 edges)
        (dec_old)-[:DERIVED_FROM]->(doc_arch),
        (dec_new)-[:DERIVED_FROM]->(chat_pay),
        (dec_new)-[:DERIVED_FROM]->(t_104),

        // 25. Decision Supersession (1 edge)
        (dec_new)-[:SUPERSEDES]->(dec_old),

        // 26. Document Contradiction / Drift (1 edge)
        (dec_new)-[:CONTRADICTS]->(doc_arch)
    """
    graph.query(edges_query)

    # Verification query
    node_count_res = graph.query("MATCH (n) RETURN count(n) AS node_count")
    edge_count_res = graph.query("MATCH ()-[r]->() RETURN count(r) AS edge_count")

    node_count = node_count_res.result_set[0][0]
    edge_count = edge_count_res.result_set[0][0]

    print(f"[OK] Seeding completed successfully!")
    print(f"    - Nodes in graph: {node_count} (Expected: 17)")
    print(f"    - Edges in graph: {edge_count} (Expected: 26)")

    return {"nodes": node_count, "edges": edge_count}


if __name__ == "__main__":
    seed_graph()
