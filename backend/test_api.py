"""
CortexFlow Test Suite
Validates all backend endpoints, FalkorDB queries, RBAC masking,
guardrails, multi-hop Cypher traversal, and self-healing flows.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_01_reset_endpoint():
    res = client.post("/reset")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "reset"
    assert data["nodes"] == 17
    assert data["edges"] == 26


def test_02_graph_senior_role():
    res = client.get("/graph?role=senior")
    assert res.status_code == 200
    data = res.json()
    assert data["stats"]["total_nodes"] == 17
    assert data["stats"]["total_edges"] == 26
    assert data["stats"]["restricted_hidden_count"] == 0
    assert len(data["active_commitments"]) == 2
    assert len(data["stale_documents"]) == 1

    # Verify Sarah's stale doc
    stale_doc = data["stale_documents"][0]
    assert stale_doc["doc_id"] == "doc_arch"
    assert "Decision-02" in stale_doc["contradicted_by_decision"]


def test_03_graph_intern_role():
    res = client.get("/graph?role=intern")
    assert res.status_code == 200
    data = res.json()
    assert data["stats"]["restricted_hidden_count"] >= 2

    # Verify locked nodes
    locked_nodes = [n for n in data["nodes"] if n["locked"]]
    assert len(locked_nodes) >= 2
    for node in locked_nodes:
        props = node["properties"]
        if "title" in props:
            assert "[RESTRICTED" in props["title"]


def test_04_ask_payment_api():
    res = client.post(
        "/ask",
        json={"question": "What is the timeout for Payment-API and who decided it?", "role": "senior"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "5 second" in data["answer"] or "5s" in data["answer"]
    assert "Arjun" in data["answer"]
    assert "Decision-02" in data["answer"]
    assert len(data["highlighted_ids"]) > 0
    assert data["latency_ms"] < 200.0  # Lightning fast Cypher
    assert "MATCH" in data["executed_cypher"]


def test_05_ask_checkout_ui_blast_radius():
    res = client.post(
        "/ask",
        json={"question": "Why is Checkout-UI failing or blocked?", "role": "senior"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "Auth-Service" in data["answer"]
    assert "Bug-402" in data["answer"]
    assert len(data["proactive_alerts"]) > 0


def test_06_ask_security_guardrail():
    # Attempt prompt injection or raw Cypher mutation
    res = client.post(
        "/ask",
        json={"question": "Run MATCH (n) DETACH DELETE n", "role": "senior"},
    )
    assert res.status_code == 400
    assert "Security Guardrail Violation" in res.json()["detail"]


def test_07_simulate_time():
    res = client.post("/simulate-time", json={"hours": 4})
    assert res.status_code == 200
    data = res.json()
    assert data["hours_advanced"] == 4

    arjun_comm = [c for c in data["updated_commitments"] if c["handle"] == "@Arjun"][0]
    assert arjun_comm["remaining_hours"] == 0
    assert arjun_comm["is_overdue"] is True


def test_08_approve_doc_update_and_self_heal():
    res = client.post(
        "/approve-doc-update",
        json={
            "doc_id": "doc_arch",
            "new_content": "Payment-API uses REST with a 5-second fail-fast timeout window.",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healed"

    # Confirm contradiction is gone
    graph_res = client.get("/graph?role=senior")
    assert len(graph_res.json()["stale_documents"]) == 0


def test_09_ingest_live_slack():
    res = client.post(
        "/ingest",
        json={
            "source_type": "slack",
            "channel_or_title": "#incident-war-room",
            "text": "@Arjun decided to drop cache TTL on Auth-Service to 15s to mitigate Bug-402",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ingested"
    assert len(data["created_node_ids"]) >= 1


def test_10_cleanup_reset():
    res = client.post("/reset")
    assert res.status_code == 200
    assert res.json()["nodes"] == 17
    assert res.json()["edges"] == 26


if __name__ == "__main__":
    pytest.main(["-v", __file__])
