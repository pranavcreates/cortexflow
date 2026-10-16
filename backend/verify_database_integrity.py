"""
CortexFlow - End-to-End Zero-Mock Database Verification & Integrity Audit
Verifies real Cypher execution, live mutations, and state invariants
directly against FalkorDB (localhost:6379, graph: cortexflow_brain).
"""

import sys
import time
from pathlib import Path

# Ensure backend modules can be imported
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
for p in (str(PROJECT_ROOT), str(BASE_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi.testclient import TestClient
from backend.main import app
from backend.seed import get_graph, seed_graph

client = TestClient(app)


def log_step(step_num: int, title: str):
    print(f"\n{'='*70}")
    print(f"STEP {step_num}: {title}")
    print(f"{'='*70}")


def log_substep(name: str, passed: bool, detail: str = ""):
    status = " [PASS] " if passed else " [FAIL] "
    detail_str = f" -> {detail}" if detail else ""
    print(f"{status} {name}{detail_str}")
    if not passed:
        raise AssertionError(f"Step failed: {name}. {detail}")


def main():
    print("\n" + "#" * 70)
    print(" CORTEXFLOW ZERO-MOCK DATABASE INTEGRITY & INTEGRATION AUDIT")
    print(" Target: FalkorDB (cortexflow_brain) on localhost:6379")
    print("#" * 70)

    # Connect directly to FalkorDB
    graph = get_graph()

    # -------------------------------------------------------------------------
    # STEP 1: Seed baseline graph
    # -------------------------------------------------------------------------
    log_step(1, "Seed Baseline Graph in FalkorDB via seed_graph()")
    t0 = time.perf_counter()
    stats = seed_graph()
    seed_duration_ms = (time.perf_counter() - t0) * 1000

    log_substep("Seed execution", True, f"Completed in {seed_duration_ms:.2f}ms")
    log_substep("Reported node count", stats["nodes"] == 17, f"Expected 17, got {stats['nodes']}")
    log_substep("Reported edge count", stats["edges"] == 26, f"Expected 26, got {stats['edges']}")

    # -------------------------------------------------------------------------
    # STEP 2: Verify node count (17) and edge count (26) directly in FalkorDB
    # -------------------------------------------------------------------------
    log_step(2, "Direct FalkorDB Verification of Seed Topology")
    res_nodes = graph.query("MATCH (n) RETURN count(n)")
    node_count = res_nodes.result_set[0][0]
    log_substep("FalkorDB direct node count", node_count == 17, f"MATCH (n) returned {node_count}")

    res_edges = graph.query("MATCH ()-[r]->() RETURN count(r)")
    edge_count = res_edges.result_set[0][0]
    log_substep("FalkorDB direct edge count", edge_count == 26, f"MATCH ()-[r]->() returned {edge_count}")

    # Check key entities
    res_keys = graph.query("""
    MATCH (sys_p:System {id: 'sys_pay'}),
          (sys_a:System {id: 'sys_auth'}),
          (sys_c:System {id: 'sys_check'}),
          (p_arj:Person {id: 'p_arjun'}),
          (dec_n:Decision {id: 'dec_new'}),
          (doc_s:Document {id: 'doc_arch'}),
          (bug:Ticket {id: 'b_402'})
    RETURN count(sys_p), count(dec_n), count(doc_s)
    """)
    has_key_nodes = len(res_keys.result_set) > 0 and res_keys.result_set[0][0] == 1
    log_substep("Required seed nodes present (sys_pay, sys_auth, dec_new, doc_arch, b_402)", has_key_nodes)

    # Check contradiction edge
    res_contradict = graph.query("MATCH (d:Decision {id: 'dec_new'})-[r:CONTRADICTS]->(doc:Document {id: 'doc_arch'}) RETURN count(r)")
    contradict_count = res_contradict.result_set[0][0]
    log_substep("Baseline CONTRADICTS edge exists", contradict_count == 1, f"Expected 1, got {contradict_count}")

    # Check Arjun's SLA commitment
    res_comm = graph.query("MATCH (p:Person {id: 'p_arjun'})-[c:COMMITTED_TO]->(b:Ticket {id: 'b_402'}) RETURN c.remaining_hours")
    rem_hours = res_comm.result_set[0][0]
    log_substep("Baseline COMMITTED_TO SLA (4 hours remaining)", rem_hours == 4, f"Expected 4, got {rem_hours}")

    # -------------------------------------------------------------------------
    # STEP 3: Call POST /ask via FastAPI TestClient
    # -------------------------------------------------------------------------
    log_step(3, "Verify POST /ask Multi-Hop Cypher Traversal & Real Latency")
    resp_ask = client.post(
        "/ask",
        json={"question": "What is the timeout for Payment-API and who decided it?", "role": "senior"}
    )
    log_substep("POST /ask HTTP status 200", resp_ask.status_code == 200, f"HTTP {resp_ask.status_code}")
    data_ask = resp_ask.json()

    cypher_executed = data_ask.get("executed_cypher", "")
    log_substep("Cypher query string returned", "MATCH" in cypher_executed and "sys_pay" in cypher_executed, f"Executed: {cypher_executed[:60]}...")

    latency_ms = data_ask.get("latency_ms", 0)
    log_substep("Real execution latency measured", isinstance(latency_ms, (int, float)) and latency_ms > 0, f"Latency: {latency_ms}ms")
    log_substep("Sub-50ms execution speed", latency_ms < 50.0, f"{latency_ms}ms < 50ms")

    highlighted = data_ask.get("highlighted_ids", [])
    log_substep("Traversed nodes highlighted for UI", len(highlighted) >= 3 and "sys_pay" in highlighted and "dec_new" in highlighted, f"Highlighted: {highlighted}")

    answer = data_ask.get("answer", "")
    log_substep("Answer contains verified ground truth", ("5 second" in answer or "5s" in answer) and "Decision-02" in answer, "Confirmed Payment-API 5s consensus in answer")

    # Verify read-only guardrail enforcement on mutating input
    resp_guard = client.post(
        "/ask",
        json={"question": "Please execute MATCH (n) DETACH DELETE n", "role": "senior"}
    )
    log_substep("Mutating Cypher rejection guardrail", resp_guard.status_code == 400 and "Security Guardrail" in resp_guard.json()["detail"], "Blocked prompt injection")

    # -------------------------------------------------------------------------
    # STEP 4: Call POST /simulate-time (hours=4) and verify FalkorDB mutation
    # -------------------------------------------------------------------------
    log_step(4, "Verify POST /simulate-time Cypher SET & Overdue SLA Mutation")
    resp_sim = client.post("/simulate-time", json={"hours": 4})
    log_substep("POST /simulate-time HTTP status 200", resp_sim.status_code == 200)
    data_sim = resp_sim.json()
    log_substep("Simulation advanced 4 hours", data_sim.get("hours_advanced") == 4)

    # Query FalkorDB directly to verify remaining_hours decremented on edge and ticket
    res_direct_sim = graph.query("""
    MATCH (p:Person {id: 'p_arjun'})-[c:COMMITTED_TO]->(b:Ticket {id: 'b_402'})
    RETURN c.remaining_hours, b.remaining_hours
    """)
    edge_rem, node_rem = res_direct_sim.result_set[0]
    log_substep("Direct FalkorDB verification of c.remaining_hours == 0", edge_rem == 0, f"Got c.remaining_hours={edge_rem}")
    log_substep("Direct FalkorDB verification of b.remaining_hours == 0", node_rem == 0, f"Got b.remaining_hours={node_rem}")

    # Verify GET /graph reflects the overdue state
    resp_graph_after_sim = client.get("/graph?role=senior")
    comm_after_sim = resp_graph_after_sim.json().get("active_commitments", [])
    arjun_comm = [c for c in comm_after_sim if c.get("person_handle") == "@Arjun"]
    log_substep("GET /graph reports is_overdue=True for Arjun's ticket", len(arjun_comm) > 0 and arjun_comm[0].get("is_overdue") is True)

    # -------------------------------------------------------------------------
    # STEP 5: Call POST /ingest and verify live Cypher MERGE in FalkorDB
    # -------------------------------------------------------------------------
    log_step(5, "Verify POST /ingest Live Cypher MERGE & Topology Growth")
    ingest_payload = {
        "source_type": "bug",
        "channel_or_title": "Bug-777",
        "text": "Stripe webhook failure in Payment-API fix in 6h"
    }
    resp_ingest = client.post("/ingest", json=ingest_payload)
    log_substep("POST /ingest HTTP status 200", resp_ingest.status_code == 200)
    data_ingest = resp_ingest.json()
    created_ids = data_ingest.get("created_node_ids", [])
    log_substep("Created node IDs returned for frontend animation", len(created_ids) > 0, f"Created: {created_ids}")

    # Query FalkorDB directly to verify the ticket and edges were created
    res_direct_ingest = graph.query("""
    MATCH (b:Ticket {name: 'Bug-777'})-[:AFFECTS]->(s:System {id: 'sys_pay'})
    OPTIONAL MATCH (p:Person)-[c:COMMITTED_TO]->(b)
    RETURN b.id, b.status, s.status, p.name, c.remaining_hours
    """)
    log_substep("Direct FalkorDB query found merged Ticket", len(res_direct_ingest.result_set) == 1)
    b_id, b_status, s_status, p_name, c_rem = res_direct_ingest.result_set[0]
    log_substep("Ticket kind and status are valid", b_status == "open", f"Status: {b_status}")
    log_substep("System status degraded by open bug", s_status == "degraded", f"sys_pay status: {s_status}")
    log_substep("Committed owner merged to system owner", p_name is not None, f"Owner: {p_name}")
    log_substep("Parsed SLA duration (6 hours)", c_rem == 6, f"Remaining: {c_rem}h")

    # Also test slack discussion ingestion
    resp_slack = client.post(
        "/ingest",
        json={
            "source_type": "slack",
            "channel_or_title": "#prod-ops",
            "text": "@arjun and @priya agreed to switch payment retry to exponential backoff"
        }
    )
    log_substep("POST /ingest (Slack discussion) HTTP status 200", resp_slack.status_code == 200)

    # -------------------------------------------------------------------------
    # STEP 6: Call POST /approve-doc-update and verify Self-Healing in FalkorDB
    # -------------------------------------------------------------------------
    log_step(6, "Verify POST /approve-doc-update Self-Healing & Edge Deletion")
    # Verify doc_arch is currently stale with contradiction edge
    res_before_heal = graph.query("MATCH (d:Document {id: 'doc_arch'}) RETURN d.status")
    log_substep("doc_arch initial status is stale", res_before_heal.result_set[0][0] == "stale")

    heal_payload = {
        "doc_id": "doc_arch",
        "new_content": "Payment-API uses REST with a 5-second fail-fast timeout window."
    }
    resp_heal = client.post("/approve-doc-update", json=heal_payload)
    log_substep("POST /approve-doc-update HTTP status 200", resp_heal.status_code == 200)
    data_heal = resp_heal.json()
    log_substep("Response reports new_status == active", data_heal.get("new_status") == "active")

    # Query FalkorDB directly to verify document status was updated
    res_after_heal = graph.query("MATCH (d:Document {id: 'doc_arch'}) RETURN d.status, d.content")
    status_db, content_db = res_after_heal.result_set[0]
    log_substep("Direct FalkorDB verification: d.status == 'active'", status_db == "active")
    log_substep("Direct FalkorDB verification: content updated", "5-second" in content_db)

    # Query FalkorDB directly to verify CONTRADICTS edge was physically DELETED
    res_edges_heal = graph.query("MATCH ()-[r:CONTRADICTS]->(d:Document {id: 'doc_arch'}) RETURN count(r)")
    contradict_rem = res_edges_heal.result_set[0][0]
    log_substep("Direct FalkorDB verification: CONTRADICTS edge deleted (count == 0)", contradict_rem == 0, f"Remaining edges: {contradict_rem}")

    # Check GET /graph returns 0 stale documents
    resp_graph_clean = client.get("/graph?role=senior")
    stale_docs_count = len(resp_graph_clean.json().get("stale_documents", []))
    log_substep("GET /graph returns zero stale documents after self-healing", stale_docs_count == 0, f"Stale docs count: {stale_docs_count}")

    # -------------------------------------------------------------------------
    # STEP 7: Clean reset via POST /reset and verify 17 nodes / 26 edges restored
    # -------------------------------------------------------------------------
    log_step(7, "Verify POST /reset Graph Re-Seeding & Baseline Restoration")
    resp_reset = client.post("/reset")
    log_substep("POST /reset HTTP status 200", resp_reset.status_code == 200)
    data_reset = resp_reset.json()
    log_substep("Reset reports 17 nodes and 26 edges", data_reset.get("nodes") == 17 and data_reset.get("edges") == 26)

    # Direct query FalkorDB
    res_final_nodes = graph.query("MATCH (n) RETURN count(n)")
    final_node_count = res_final_nodes.result_set[0][0]
    res_final_edges = graph.query("MATCH ()-[r]->() RETURN count(r)")
    final_edge_count = res_final_edges.result_set[0][0]
    log_substep("FalkorDB direct count after reset: exactly 17 nodes", final_node_count == 17, f"Got {final_node_count}")
    log_substep("FalkorDB direct count after reset: exactly 26 edges", final_edge_count == 26, f"Got {final_edge_count}")

    # Direct query CONTRADICTS edge restored
    res_restored_edge = graph.query("MATCH ()-[r:CONTRADICTS]->(d:Document {id: 'doc_arch'}) RETURN count(r)")
    restored_edge_count = res_restored_edge.result_set[0][0]
    log_substep("Baseline CONTRADICTS edge restored", restored_edge_count == 1, f"Got {restored_edge_count}")

    # Direct query Arjun SLA restored to 4 hours
    res_restored_comm = graph.query("MATCH (p:Person {id: 'p_arjun'})-[c:COMMITTED_TO]->(b:Ticket {id: 'b_402'}) RETURN c.remaining_hours")
    restored_hours = res_restored_comm.result_set[0][0]
    log_substep("Baseline COMMITTED_TO SLA restored to 4h", restored_hours == 4, f"Got {restored_hours}")

    print("\n" + "#" * 70)
    print(" ALL 7 ZERO-MOCK VERIFICATION STEPS PASSED SUCCESSFULLY!")
    print(" CortexFlow brain is fully verified against live FalkorDB queries.")
    print("#" * 70 + "\n")


if __name__ == "__main__":
    main()
