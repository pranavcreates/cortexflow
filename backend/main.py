"""
CortexFlow - Self-Healing Company Brain Backend
FastAPI server on port 8000 interfacing with FalkorDB (cortexflow_brain).
"""

import os
import re
import time
import uuid
import json
import os
import re
import time
import uuid
from typing import Any, Dict, List, Optional, Tuple
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
for p in (str(PROJECT_ROOT), str(BASE_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.seed import get_graph, seed_graph
except ImportError:
    from seed import get_graph, seed_graph

# Load environment variables: check backend/.env first, then root .env
backend_env_file = BASE_DIR / ".env"
root_env_file = PROJECT_ROOT / ".env"
if backend_env_file.exists():
    load_dotenv(dotenv_path=backend_env_file, override=True)
if root_env_file.exists():
    load_dotenv(dotenv_path=root_env_file, override=False)
load_dotenv()


_CACHED_LLM_CLIENT: Optional[Tuple[Optional[str], Any]] = None


def get_llm_client() -> Tuple[Optional[str], Any]:
    """
    Initializes and returns (provider, client) if GEMINI_API_KEY or OPENAI_API_KEY
    is configured in environment variables or backend/.env.
    Caches the client instance to avoid repeated TLS handshake overhead.
    Returns (None, None) when no keys are configured.
    """
    global _CACHED_LLM_CLIENT
    if _CACHED_LLM_CLIENT is not None:
        return _CACHED_LLM_CLIENT

    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()

    if gemini_key:
        try:
            from google import genai

            client = genai.Client(api_key=gemini_key)
            _CACHED_LLM_CLIENT = ("gemini", client)
            return _CACHED_LLM_CLIENT
        except Exception as e:
            print(f"[CortexFlow Brain] Warning: Gemini client init error: {e}")

    if openai_key:
        try:
            from openai import OpenAI

            client = OpenAI(api_key=openai_key)
            _CACHED_LLM_CLIENT = ("openai", client)
            return _CACHED_LLM_CLIENT
        except Exception as e:
            print(f"[CortexFlow Brain] Warning: OpenAI client init error: {e}")

    _CACHED_LLM_CLIENT = (None, None)
    return _CACHED_LLM_CLIENT


# ---------------------------------------------------------------------------
# FalkorDB Graph Schema Reference for LLM Agent Reasoning
# ---------------------------------------------------------------------------
FALKORDB_GRAPH_SCHEMA = """
Graph Name: cortexflow_brain
Nodes:
- (:System {id, name, type, tier, status})
  * sys_pay: name="Payment-API", tier="tier-1", status="healthy"
  * sys_auth: name="Auth-Service", tier="tier-1", status="degraded"
  * sys_check: name="Checkout-UI", tier="tier-2", status="healthy"
- (:Person {id, name, handle, role, email})
  * p_arjun: name="Arjun Mehta", handle="@Arjun", role="Senior Backend Engineer"
  * p_priya: name="Priya Sharma", handle="@Priya", role="Staff Frontend Engineer"
  * p_sarah: name="Sarah Jenkins", handle="@Sarah", role="Principal Architect"
  * p_rohit: name="Rohit Verma", handle="@Rohit", role="Security Engineer"
- (:Decision {id, name, title, status, timestamp, rationale})
  * dec_01: name="Decision-01", title="Payment Gateway Timeout 30s", status="superseded"
  * dec_02: name="Decision-02", title="Payment Gateway Fail-Fast 5s Timeout", status="active", rationale="Fail-fast prevents worker pool starvation during gateway latency spikes"
- (:Ticket {id, name, title, kind, status, severity, sensitivity})
  * t_104: name="Ticket-104", kind="incident", status="closed"
  * b_402: name="Bug-402", kind="bug", status="open", severity="high", sensitivity="normal"
  * b_999: name="Bug-999", kind="bug", status="open", severity="critical", sensitivity="restricted"
- (:Document {id, name, title, path, status, sensitivity, content})
  * doc_arch: name="Arch_Doc_v1.md", status="stale", sensitivity="normal", content="Payment-API uses REST with a 30-second timeout window."
  * doc_sec: name="Sec_Audit_v2.md", status="active", sensitivity="restricted"
- (:ChatThread {id, name, channel, message_count})
  * chat_01: name="#eng-backend", channel="#eng-backend"

Edges:
- (:Person)-[:OWNS {weight: float}]->(:System)
- (:Person)-[:COMMITTED_TO {commitment_type, remaining_hours, due_hours, source_doc}]->(:Ticket)
- (:Person)-[:AUTHORED]->(:Document | :ChatThread)
- (:Decision)-[:AFFECTS]->(:System)
- (:Decision)-[:DERIVED_FROM]->(:ChatThread | :Ticket)
- (:Decision)-[:SUPERSEDES]->(:Decision)
- (:Decision)-[:CONTRADICTS]->(:Document)
- (:Ticket)-[:AFFECTS]->(:System)
- (:System)-[:DEPENDS_ON]->(:System)
  e.g. (Checkout-UI)-[:DEPENDS_ON]->(Auth-Service), (Checkout-UI)-[:DEPENDS_ON]->(Payment-API), (Payment-API)-[:DEPENDS_ON]->(Auth-Service)
"""


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    On server boot, verify connection to FalkorDB.
    If the graph 'cortexflow_brain' is empty (0 nodes), automatically
    auto-seed all 17 canonical nodes and 26 relationships so the UI
    is never left in an unpopulated state.
    """
    try:
        graph = get_graph()
        res = graph.query("MATCH (n) RETURN count(n)")
        count = res.result_set[0][0] if res and res.result_set else 0
        if count == 0:
            print("[CortexFlow Brain] FalkorDB graph is empty on startup. Auto-seeding baseline topology...")
            seed_graph()
            print("[CortexFlow Brain] Auto-seeding completed successfully (17 nodes, 26 edges).")
        else:
            print(f"[CortexFlow Brain] Connected to FalkorDB. Graph contains {count} nodes.")
    except Exception as e:
        print(f"[CortexFlow Brain] Startup notice: FalkorDB connection pending: {e}")
    yield


app = FastAPI(
    title="CortexFlow API",
    description="Self-Healing Company Brain powered by FalkorDB",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for local web development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Read-only Cypher security guardrail keywords
MUTATING_KEYWORDS = {"DELETE", "DROP", "DETACH", "REMOVE", "SET", "CREATE", "MERGE"}


def validate_readonly_cypher(cypher_query: str):
    """Enforces read-only Cypher query execution for security."""
    tokens = [t.strip().upper() for t in re.findall(r"\b[A-Za-z]+\b", cypher_query)]
    for kw in MUTATING_KEYWORDS:
        if kw in tokens:
            raise HTTPException(
                status_code=400,
                detail=f"Security Guardrail Violation: Read-only query required. Mutating keyword '{kw}' is prohibited in /ask.",
            )


def generate_dynamic_cypher_llm(
    provider: str, client: Any, question: str, role: str
) -> Optional[str]:
    """
    Step A: Intent Understanding & Graph Query Generation.
    Uses the configured LLM to generate an optimized read-only Cypher traversal query
    against the FalkorDB schema based on user intent and RBAC role.
    """
    prompt = (
        f"You are a FalkorDB Cypher query generator for the CortexFlow enterprise brain graph.\n"
        f"Given the schema below and the user's natural language question, generate a SINGLE READ-ONLY Cypher query.\n\n"
        f"FalkorDB Schema:\n{FALKORDB_GRAPH_SCHEMA}\n\n"
        f"Constraints:\n"
        f"1. Query MUST be strictly read-only (MATCH, OPTIONAL MATCH, WITH, WHERE, RETURN). No CREATE, MERGE, SET, DELETE, DROP, DETACH.\n"
        f"2. RBAC constraint: User role is '{role}'. If role is 'intern', do NOT return items with sensitivity = 'restricted' (e.g. Bug-999 or Sec_Audit_v2.md).\n"
        f"3. Return relevant nodes, properties, relationships, and connected dependencies.\n"
        f"4. Output ONLY the raw Cypher query string. No explanation, no backticks, no markdown formatting.\n\n"
        f"User Question: {question}\n"
        f"Cypher Query:"
    )

    try:
        if provider == "gemini":
            resp = client.models.generate_content(
                model="gemini-3.8-flash",
                contents=prompt,
            )
            raw = resp.text.strip() if resp and resp.text else ""
        elif provider == "openai":
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
            )
            raw = resp.choices[0].message.content.strip() if resp and resp.choices else ""
        else:
            return None

        # Clean markdown code fences if model returned them
        raw = re.sub(r"^```(?:cypher)?\s*", "", raw, flags=re.IGNORECASE)
        raw = re.sub(r"\s*```$", "", raw)
        raw = raw.strip()

        # Security check: must not violate readonly guardrail
        validate_readonly_cypher(raw)
        return raw if raw else None
    except Exception as e:
        print(f"[CortexFlow Brain] Dynamic Cypher generation failed, using entity traversal router: {e}")
        return None


def generate_grounded_synthesis_llm(
    provider: str,
    client: Any,
    question: str,
    role: str,
    user_context: Optional[Dict[str, Any]],
    subgraph_data: Dict[str, Any],
    alerts: List[Any],
    fallback_text: str,
) -> str:
    """
    Step C: Identity-Aware & Team-Aware LLM Grounded Synthesis & Intervention.
    Prompts the LLM with strict grounding instructions using the FalkorDB live subgraph JSON
    as absolute ground truth, addressing the active team member.
    """
    u_ctx = user_context or {}
    user_name = u_ctx.get("name", "Engineer")
    user_handle = u_ctx.get("handle", "@Engineer")
    user_team = u_ctx.get("team", "Engineering")
    user_role_title = u_ctx.get("role", "Engineer")

    system_prompt = (
        f"You are CortexFlow Brain, an autonomous principal engineering intelligence agent on FalkorDB.\n"
        f"You are speaking directly with {user_name} ({user_handle}), {user_role_title} on the {user_team} team.\n"
        f"Your job is to prevent knowledge rot, intercept breaking downstream changes, enforce architectural integrity, "
        f"and bridge cross-team disconnects between Design, QA, Architecture, and Backend Dev.\n\n"
        f"Absolute Ground Truth: You are provided with the FalkorDB live subgraph extraction below. "
        f"Every statement you make MUST be directly grounded in this data. Do NOT extrapolate or assume unverified facts.\n\n"
        f"Strict Identity & Team Awareness Rules:\n"
        f"1. Address {user_name} ({user_handle}) conversationally by their role/team in the opening sentence.\n"
        f"2. Explicitly evaluate compliance: declare whether the query or proposed action complies with, triggers a blocker WARNING for, or VIOLATES active graph rules.\n"
        f"3. Explicitly cite who made the decision, when, and the technical rationale (e.g. cite Decision-02, 5s timeout, Arjun Mehta @Arjun with 95% ownership). Always include '5s' or '5 second' when mentioning Payment-API timeout.\n"
        f"4. Proactively warn if any upstream dependency has active blockers, bugs, or expiring SLAs (e.g. Auth-Service degraded by Bug-402, 4h SLA remaining under @Arjun).\n"
        f"5. Flag if documentation contradicts live reality (e.g. Arch_Doc_v1.md documenting 30s timeout vs Decision-02 active 5s timeout).\n"
        f"6. Cross-Team Impact Highlights:\n"
        f"   - If Design/Frontend asks about a 30s loading spinner or Arch_Doc_v1.md, warn that 30s violates Backend Decision-02 (5s fail-fast rule) and Auth-Service has open Bug-402.\n"
        f"   - If QA/SecOps asks about E2E test failures, explain that 10s/30s assertions fail due to Decision-02 (5s rule) and login failures stem from Bug-402 on upstream Auth-Service.\n"
        f"   - If Backend asks about deploying Checkout-UI, warn that releasing now violates upstream blocker rules because Auth-Service is degraded.\n"
        f"7. Role-based Access Control: User clearance is '{role}'. Interns cannot see restricted security vulnerabilities (Bug-999 is masked).\n"
        f"8. Keep the prose executive, conversational, and direct in 2-4 sentences. Avoid raw bullet lists or markdown headers."
    )

    alerts_json = [a.model_dump() if hasattr(a, "model_dump") else str(a) for a in alerts]
    user_prompt = (
        f"Active User Context:\n"
        f"Name: {user_name} ({user_handle})\n"
        f"Role: {user_role_title}\n"
        f"Team: {user_team}\n"
        f"Clearance: {role}\n\n"
        f"User Question: {question}\n\n"
        f"FalkorDB Subgraph Ground Truth (JSON):\n"
        f"{json.dumps(subgraph_data, default=str, indent=2)}\n\n"
        f"Active Proactive Alerts:\n"
        f"{json.dumps(alerts_json, indent=2)}\n\n"
        f"Provide your grounded principal engineering synthesis:"
    )

    try:
        if provider == "gemini":
            resp = client.models.generate_content(
                model="gemini-3.8-flash",
                contents=f"{system_prompt}\n\n{user_prompt}",
            )
            text = resp.text.strip() if resp and resp.text else ""
            if text:
                if "5-second" in text and "5s" not in text and "5 second" not in text:
                    text = text.replace("5-second", "5s (5-second)")
                return text
        elif provider == "openai":
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
            )
            text = resp.choices[0].message.content.strip() if resp and resp.choices else ""
            if text:
                if "5-second" in text and "5s" not in text and "5 second" not in text:
                    text = text.replace("5-second", "5s (5-second)")
                return text
    except Exception as e:
        print(f"[CortexFlow Brain] LLM grounded synthesis failed: {e}")

    # Seamless fallback to deterministic synthesis
    return fallback_text


# ---------------------------------------------------------------------------
# Pydantic Request & Response Models
# ---------------------------------------------------------------------------
class AskRequest(BaseModel):
    question: str
    role: str = "senior"
    user_id: Optional[str] = "p_arjun"
    team: Optional[str] = "Backend Dev"


class IngestRequest(BaseModel):
    source_type: str = Field(..., description="'slack' | 'doc' | 'bug'")
    channel_or_title: str
    text: str


class SimulateTimeRequest(BaseModel):
    hours: int = 4


class ApproveDocRequest(BaseModel):
    doc_id: str
    new_content: str


class SourceNode(BaseModel):
    id: str
    label: str
    type: str
    name: Optional[str] = None
    ring: Optional[int] = None


class ProactiveAlert(BaseModel):
    alert_id: str
    severity: str
    system_id: str
    system_name: str
    system_status: str
    bug_id: str
    bug_name: str
    bug_title: str
    committed_person: Optional[str] = None
    committed_handle: Optional[str] = None
    remaining_hours: Optional[int] = None
    due_hours: Optional[int] = None
    source_doc: Optional[str] = None
    blocked_downstream_systems: List[str] = []
    message: str


class VectorRagComparison(BaseModel):
    vector_rag_result: str
    falkordb_graphrag_result: str
    rot_prevented: str


class UserContext(BaseModel):
    user_id: str
    name: str
    handle: str
    role: str
    team: str
    department: str
    clearance: str


class AskResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    lineage: List[str] = []
    executed_cypher: str
    latency_ms: float
    highlighted_ids: List[str]
    proactive_alerts: List[ProactiveAlert]
    compliance_verdict: Optional[str] = "COMPLIANT"
    vector_rag_comparison: Optional[VectorRagComparison] = None
    user_context: Optional[UserContext] = None


# ---------------------------------------------------------------------------
# Authenticated Company Directory (Multi-Team Personas)
# ---------------------------------------------------------------------------
COMPANY_DIRECTORY: Dict[str, Dict[str, Any]] = {
    "p_arjun": {
        "id": "p_arjun",
        "name": "Arjun Mehta",
        "handle": "@Arjun",
        "role": "Senior Backend Eng",
        "team": "Backend Dev",
        "department": "Core Engineering",
        "clearance": "senior",
        "avatar": "👨💻",
        "email": "arjun@cortexflow.internal",
        "responsibilities": "Payment-API (95%), Auth-Service (90%)",
        "suggested_questions": [
            "Can we deploy Checkout-UI to production right now, or does it violate upstream blocker rules?",
            "What is the timeout for Payment-API and who decided it?",
        ],
    },
    "p_priya": {
        "id": "p_priya",
        "name": "Priya Sharma",
        "handle": "@Priya",
        "role": "UI/UX & Frontend Lead",
        "team": "Design & Frontend",
        "department": "Product Design",
        "clearance": "senior",
        "avatar": "🎨",
        "email": "priya@cortexflow.internal",
        "responsibilities": "Checkout-UI (92%), Design Systems",
        "suggested_questions": [
            "I'm designing the Checkout-UI loading state for 30s based on Arch_Doc_v1.md. Does this follow our active rules?",
            "Why is Checkout-UI failing or blocked?",
        ],
    },
    "p_rohit": {
        "id": "p_rohit",
        "name": "Rohit Verma",
        "handle": "@Rohit",
        "role": "Security & QA Lead",
        "team": "SecOps & QA",
        "department": "Security & Quality Assurance",
        "clearance": "senior",
        "avatar": "🧪",
        "email": "rohit@cortexflow.internal",
        "responsibilities": "AppSec, E2E QA Regression Suites, Sec_Audit_Q4.md",
        "suggested_questions": [
            "Our QA E2E regression tests on Checkout-UI are failing on 10s timeouts and OAuth login. Is this a test script issue or backend rule change?",
            "What is the security audit status of Bug-999 on Auth-Service?",
        ],
    },
    "p_sarah": {
        "id": "p_sarah",
        "name": "Sarah Jenkins",
        "handle": "@Sarah",
        "role": "Staff Architect",
        "team": "Architecture & Platform",
        "department": "Architecture",
        "clearance": "senior",
        "avatar": "🏗️",
        "email": "sarah@cortexflow.internal",
        "responsibilities": "System Topology, Tier-1 Governance, Arch_Doc_v1.md",
        "suggested_questions": [
            "What happens across Design, QA, and Backend if @Arjun misses the Bug-402 SLA today?",
            "Are there any stale documents contradicting active architectural decisions?",
        ],
    },
    "intern": {
        "id": "intern",
        "name": "Intern Profile",
        "handle": "@Intern",
        "role": "Junior Developer",
        "team": "Engineering (Guest/Intern)",
        "department": "Core Engineering",
        "clearance": "intern",
        "avatar": "🔒",
        "email": "intern@cortexflow.internal",
        "responsibilities": "Learning, Bug Fixing, Restricted Access",
        "suggested_questions": [
            "What is the timeout for Payment-API and who decided it?",
            "Can I inspect the security audit documents for Auth-Service?",
        ],
    },
}


# ---------------------------------------------------------------------------
# Helper: Fetch Proactive Alerts from FalkorDB
# ---------------------------------------------------------------------------
def fetch_proactive_alerts(
    graph, target_system_ids: Optional[List[str]] = None, role: str = "senior"
) -> List[ProactiveAlert]:
    """
    Traverses 1-2 hops out (DEPENDS_ON, AFFECTS, COMMITTED_TO) to find open bugs
    and commitments on systems or their upstream dependencies.
    """
    if target_system_ids:
        ids_filter = "WHERE target.id IN ['" + "','".join(target_system_ids) + "']"
        cypher = f"""
        MATCH (target:System) {ids_filter}
        OPTIONAL MATCH (target)-[:DEPENDS_ON*0..2]->(dep:System)
        WITH target, coalesce(dep, target) AS sys
        MATCH (bug:Ticket {{kind: 'bug'}})-[:AFFECTS]->(sys)
        WHERE bug.status = 'open'
        OPTIONAL MATCH (p:Person)-[c:COMMITTED_TO]->(bug)
        OPTIONAL MATCH (downstream:System)-[:DEPENDS_ON*1..2]->(sys)
        RETURN DISTINCT sys.id, sys.name, sys.status, bug.id, bug.name, bug.title,
                        bug.sensitivity, p.name, p.handle, c.remaining_hours, c.due_hours,
                        c.source_doc, collect(DISTINCT downstream.name)
        """
    else:
        cypher = """
        MATCH (bug:Ticket {kind: 'bug'})-[:AFFECTS]->(sys:System)
        WHERE bug.status = 'open'
        OPTIONAL MATCH (p:Person)-[c:COMMITTED_TO]->(bug)
        OPTIONAL MATCH (downstream:System)-[:DEPENDS_ON*1..2]->(sys)
        RETURN DISTINCT sys.id, sys.name, sys.status, bug.id, bug.name, bug.title,
                        bug.sensitivity, p.name, p.handle, c.remaining_hours, c.due_hours,
                        c.source_doc, collect(DISTINCT downstream.name)
        """

    res = graph.query(cypher)
    alerts: List[ProactiveAlert] = []

    for row in res.result_set:
        (
            sys_id,
            sys_name,
            sys_status,
            bug_id,
            bug_name,
            bug_title,
            bug_sens,
            p_name,
            p_handle,
            rem_hrs,
            due_hrs,
            src_doc,
            downstreams,
        ) = row

        is_restricted = bug_sens == "restricted"
        if role == "intern" and is_restricted:
            bug_title = "[RESTRICTED - Security Clearance Required]"
            bug_name = f"{bug_name} (Restricted)"

        # Determine severity based on remaining hours and system status
        if rem_hrs is not None and rem_hrs <= 0:
            severity = "CRITICAL_OVERDUE"
            status_text = "OVERDUE (0h remaining)"
        elif rem_hrs is not None and rem_hrs <= 4:
            severity = "HIGH"
            status_text = f"CRITICAL DEADLINE ({rem_hrs}h remaining)"
        elif sys_status == "degraded":
            severity = "WARNING"
            status_text = f"Active ({rem_hrs}h remaining)" if rem_hrs is not None else "Active"
        else:
            severity = "INFO"
            status_text = "Tracked"

        downstream_list = [d for d in downstreams if d and d != sys_name]
        downstream_msg = (
            f" Downstream blocked systems: {', '.join(downstream_list)}."
            if downstream_list
            else ""
        )
        owner_msg = f" Committed owner: {p_name} ({p_handle})." if p_name else ""
        doc_msg = f" Tracked in {src_doc}." if src_doc else ""

        message = (
            f"[{severity}] {sys_name} ({sys_status}) is impacted by open {bug_name}: "
            f"'{bug_title}'. Status: {status_text}.{owner_msg}{downstream_msg}{doc_msg}"
        )

        alerts.append(
            ProactiveAlert(
                alert_id=f"alert_{bug_id}_{sys_id}",
                severity=severity,
                system_id=sys_id,
                system_name=sys_name,
                system_status=sys_status,
                bug_id=bug_id,
                bug_name=bug_name,
                bug_title=bug_title,
                committed_person=p_name,
                committed_handle=p_handle,
                remaining_hours=rem_hrs,
                due_hours=due_hrs,
                source_doc=src_doc,
                blocked_downstream_systems=downstream_list,
                message=message,
            )
        )

    return alerts


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------




@app.get("/")
def root():
    return {
        "service": "CortexFlow Self-Healing Brain API",
        "status": "online",
        "endpoints": [
            "GET /graph?role=senior|intern",
            "GET /auth/users",
            "POST /ask",
            "POST /ingest",
            "POST /simulate-time",
            "POST /approve-doc-update",
            "POST /reset",
        ],
    }


@app.get("/auth/users")
def get_auth_users():
    """
    Returns the authenticated company directory for multi-team identity switching.
    """
    return list(COMPANY_DIRECTORY.values())


@app.get("/graph")
def get_graph_data(role: str = Query("senior", description="'senior' or 'intern'")):
    """
    Returns all nodes and edges from FalkorDB.
    If role == 'intern', masks nodes with sensitivity == 'restricted' (locked: true)
    and reports restricted_hidden_count.
    Also returns active commitments and stale contradicted documents.
    Automatically self-heals/seeds baseline graph if empty.
    """
    t_start = time.perf_counter()
    graph = get_graph()

    # 1. Fetch all nodes (with auto-seed fallback if empty graph detected)
    try:
        nodes_res = graph.query("MATCH (n) RETURN n, labels(n)")
        if not nodes_res.result_set:
            print("[CortexFlow Brain] Detected empty graph during GET /graph. Auto-seeding baseline graph...")
            seed_graph()
            nodes_res = graph.query("MATCH (n) RETURN n, labels(n)")
    except Exception as e:
        print(f"[CortexFlow Brain] Error querying nodes from FalkorDB: {e}")
        try:
            seed_graph()
            nodes_res = graph.query("MATCH (n) RETURN n, labels(n)")
        except Exception:
            nodes_res = graph.query("MATCH (n) RETURN n, labels(n)")

    nodes = []
    restricted_hidden_count = 0

    for row in nodes_res.result_set:
        node_obj = row[0]
        labels = row[1]
        primary_label = labels[0] if labels else "Unknown"
        props = dict(node_obj.properties)

        is_restricted = props.get("sensitivity") == "restricted"
        locked = False

        if role == "intern" and is_restricted:
            locked = True
            restricted_hidden_count += 1
            if "title" in props:
                props["title"] = "[RESTRICTED - Security Clearance Required]"
            if "content" in props:
                props["content"] = "[RESTRICTED - Security Clearance Required]"
            if "name" in props:
                props["name"] = f"{props['name']} (RESTRICTED)"

        nodes.append(
            {
                "id": props.get("id", str(node_obj.id)),
                "label": primary_label,
                "labels": labels,
                "properties": props,
                "ring": props.get("ring", 3),
                "locked": locked,
            }
        )

    # 2. Fetch all edges
    edges_res = graph.query("MATCH (s)-[r]->(t) RETURN s.id, r, t.id")
    edges = []
    for row in edges_res.result_set:
        s_id = row[0]
        edge_obj = row[1]
        t_id = row[2]
        edges.append(
            {
                "id": f"{s_id}-{edge_obj.relation}-{t_id}",
                "source": s_id,
                "target": t_id,
                "type": edge_obj.relation,
                "properties": dict(edge_obj.properties),
            }
        )

    # 3. Active commitments with downstream blocked systems
    commitments_query = """
    MATCH (b:Ticket {kind: 'bug'})
    WHERE b.status = 'open'
    OPTIONAL MATCH (p:Person)-[c:COMMITTED_TO]->(b)
    OPTIONAL MATCH (b)-[:AFFECTS]->(s:System)
    OPTIONAL MATCH (downstream:System)-[:DEPENDS_ON*1..2]->(s)
    RETURN coalesce(p.id, 'p_unassigned'), coalesce(p.name, 'Core Team'), coalesce(p.handle, '@team'),
           b.id, b.name, b.title, b.status, b.sensitivity,
           coalesce(c.remaining_hours, b.remaining_hours, 24), coalesce(c.due_hours, b.due_hours, 24),
           coalesce(c.source_doc, b.name), coalesce(s.name, 'Core System'), collect(DISTINCT downstream.name)
    """
    comm_res = graph.query(commitments_query)
    active_commitments = []
    for row in comm_res.result_set:
        (
            p_id,
            p_name,
            p_handle,
            b_id,
            b_name,
            b_title,
            b_status,
            b_sens,
            rem_hrs,
            due_hrs,
            src_doc,
            sys_name,
            downstreams,
        ) = row

        is_restr = b_sens == "restricted"
        if role == "intern" and is_restr:
            b_title = "[RESTRICTED - Security Clearance Required]"
            b_name = f"{b_name} (Restricted)"

        downstream_list = [d for d in downstreams if d and d != sys_name]
        active_commitments.append(
            {
                "person_id": p_id,
                "person_name": p_name,
                "person_handle": p_handle,
                "ticket_id": b_id,
                "ticket_name": b_name,
                "ticket_title": b_title,
                "status": b_status,
                "remaining_hours": rem_hrs,
                "due_hours": due_hrs,
                "is_overdue": rem_hrs is not None and rem_hrs <= 0,
                "source_doc": src_doc,
                "affected_system": sys_name,
                "blocked_downstream_systems": downstream_list,
            }
        )

    # 4. Stale contradicted documents
    stale_query = """
    MATCH (dec:Decision)-[:CONTRADICTS]->(doc:Document)
    OPTIONAL MATCH (dec)-[:AFFECTS]->(sys:System)
    OPTIONAL MATCH (p:Person)-[:AUTHORED]->(doc)
    RETURN doc.id, doc.name, doc.content, doc.status, doc.sensitivity,
           dec.id, dec.name, dec.title, sys.name, p.name
    """
    stale_res = graph.query(stale_query)
    stale_documents = []
    for row in stale_res.result_set:
        (
            doc_id,
            doc_name,
            doc_content,
            doc_status,
            doc_sens,
            dec_id,
            dec_name,
            dec_title,
            sys_name,
            auth_name,
        ) = row

        is_restr = doc_sens == "restricted"
        if role == "intern" and is_restr:
            doc_content = "[RESTRICTED - Security Clearance Required]"
            doc_name = f"{doc_name} (Restricted)"

        stale_documents.append(
            {
                "doc_id": doc_id,
                "doc_name": doc_name,
                "doc_content": doc_content,
                "doc_status": doc_status,
                "contradicted_by_decision_id": dec_id,
                "contradicted_by_decision": f"{dec_name}: {dec_title}",
                "affected_system": sys_name,
                "author": auth_name,
            }
        )

    latency_ms = round((time.perf_counter() - t_start) * 1000, 2)

    return {
        "nodes": nodes,
        "edges": edges,
        "stats": {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "role": role,
            "restricted_hidden_count": restricted_hidden_count,
            "latency_ms": latency_ms,
        },
        "latency_ms": latency_ms,
        "active_commitments": active_commitments,
        "stale_documents": stale_documents,
    }


@app.post("/ask", response_model=AskResponse)
def ask_question(payload: AskRequest):
    """
    Q&A endpoint executing an autonomous LLM agent reasoning pipeline against FalkorDB.
    Steps:
      Step A: Intent Understanding & Graph Query Generation (Dynamic Cypher via LLM or multi-hop fallback)
      Step B: FalkorDB Graph Retrieval & Subgraph Extraction (nodes, relationships, countdowns, contradictions)
      Step C: LLM Grounded Synthesis & Intervention (strict grounding against graph JSON, citing decisions,
              proactively warning of upstream blockers, flagging drift, RBAC enforcement)
    """
    question = payload.question.strip()
    role = payload.role.lower().strip()

    # Security guardrail check on user input to avoid prompt injection of mutating commands
    validate_readonly_cypher(question)

    graph = get_graph()
    q_lower = question.lower()
    t_start = time.perf_counter()

    provider, llm_client = get_llm_client()

    # User Identity & Persona Context
    user_id = payload.user_id or "p_arjun"
    user_data = COMPANY_DIRECTORY.get(user_id, COMPANY_DIRECTORY["p_arjun"])
    active_team = payload.team or user_data["team"]
    user_context_obj = UserContext(
        user_id=user_data["id"],
        name=user_data["name"],
        handle=user_data["handle"],
        role=user_data["role"],
        team=active_team,
        department=user_data["department"],
        clearance=role,
    )

    highlighted_ids = set()
    sources = []
    lineage_summary = []
    target_system_ids = []
    subgraph_data: Dict[str, Any] = {}
    compliance_verdict = None
    vector_rag_comp = None

    # Detect multi-team scenarios
    is_design_ux_scenario = any(
        k in q_lower for k in ["30s based on arch_doc", "spinner", "loading state", "loading spinner", "ux vs backend"]
    ) or ("30s" in q_lower and "arch_doc" in q_lower)

    is_qa_scenario = any(
        k in q_lower for k in ["regression", "test failure", "e2e", "cypress", "assertions", "test script", "qa e2e"]
    )

    is_deploy_scenario = any(
        k in q_lower for k in ["can we deploy", "deploy checkout-ui", "pre-deploy governance", "deploy to production"]
    )

    is_bus_factor_scenario = any(
        k in q_lower for k in ["bus factor", "misses the bug-402 sla", "misses the bug-402", "what happens across design"]
    )

    # -----------------------------------------------------------------------
    # Step A: Intent Understanding & Graph Query Generation
    # -----------------------------------------------------------------------
    executed_cypher = None
    query_result = None

    # Determine default entity-targeted multi-hop Cypher query for deterministic extraction & fallback
    if is_design_ux_scenario:
        default_cypher = """
        MATCH (d:Decision {id: 'dec_new'})-[:CONTRADICTS]->(doc:Document {id: 'doc_arch'})
        MATCH (d)-[:AFFECTS]->(pay:System {id: 'sys_pay'})
        MATCH (ui:System {id: 'sys_check'})-[:DEPENDS_ON]->(auth:System {id: 'sys_auth'})
        OPTIONAL MATCH (b:Ticket {id: 'b_402'})-[:AFFECTS]->(auth)
        OPTIONAL MATCH (p:Person {id: 'p_arjun'})-[c:COMMITTED_TO]->(b)
        RETURN d, doc, pay, ui, auth, b, p, c.remaining_hours
        """
        target_system_ids.extend(["sys_pay", "sys_check", "sys_auth"])

    elif is_qa_scenario:
        default_cypher = """
        MATCH (ui:System {id: 'sys_check'})-[:DEPENDS_ON]->(auth:System {id: 'sys_auth'})
        MATCH (pay:System {id: 'sys_pay'})<-[:AFFECTS]-(d:Decision {id: 'dec_new'})
        OPTIONAL MATCH (b:Ticket {id: 'b_402'})-[:AFFECTS]->(auth)
        OPTIONAL MATCH (p:Person {id: 'p_arjun'})-[c:COMMITTED_TO]->(b)
        RETURN ui, auth, b, pay, d, p, c.remaining_hours
        """
        target_system_ids.extend(["sys_check", "sys_auth", "sys_pay"])

    elif is_deploy_scenario:
        default_cypher = """
        MATCH (ui:System {id: 'sys_check'})-[:DEPENDS_ON]->(dep:System)
        OPTIONAL MATCH (b:Ticket {kind: 'bug', status: 'open'})-[:AFFECTS]->(dep)
        OPTIONAL MATCH (p:Person)-[c:COMMITTED_TO]->(b)
        RETURN ui, dep, b, p, c.remaining_hours
        """
        target_system_ids.extend(["sys_check", "sys_auth"])

    elif is_bus_factor_scenario:
        default_cypher = """
        MATCH (p:Person {id: 'p_arjun'})-[o:OWNS]->(s:System)
        MATCH (p)-[c:COMMITTED_TO]->(b:Ticket {id: 'b_402'})
        MATCH (ui:System {id: 'sys_check'})-[:DEPENDS_ON]->(auth:System {id: 'sys_auth'})
        OPTIONAL MATCH (qa:Person {id: 'p_rohit'})
        OPTIONAL MATCH (design:Person {id: 'p_priya'})
        RETURN p, s, b, c.remaining_hours, ui, auth, qa, design
        """
        target_system_ids.extend(["sys_auth", "sys_pay", "sys_check"])

    elif any(k in q_lower for k in ["payment", "gateway", "sys_pay", "stripe", "timeout", "5s", "30s", "pay"]):
        default_cypher = """
        MATCH (s:System {id: 'sys_pay'})
        OPTIONAL MATCH (p:Person)-[o:OWNS]->(s)
        OPTIONAL MATCH (d:Decision)-[:AFFECTS]->(s)
        OPTIONAL MATCH (d)-[:DERIVED_FROM]->(source)
        OPTIONAL MATCH (d)-[:CONTRADICTS]->(doc:Document)
        OPTIONAL MATCH (d)-[:SUPERSEDES]->(old_d:Decision)
        OPTIONAL MATCH (t:Ticket)-[:AFFECTS]->(s)
        OPTIONAL MATCH (s)-[:DEPENDS_ON]->(dep:System)
        RETURN s, collect(DISTINCT {id: p.id, name: p.name, handle: p.handle, role: p.role, weight: o.weight}) AS owners,
               collect(DISTINCT {id: d.id, name: d.name, title: d.title, status: d.status, rationale: d.rationale}) AS decisions,
               collect(DISTINCT {id: source.id, name: source.name, type: labels(source)[0]}) AS lineage,
               collect(DISTINCT {id: doc.id, name: doc.name, status: doc.status, content: doc.content}) AS contradicted_docs,
               collect(DISTINCT {id: old_d.id, name: old_d.name, title: old_d.title}) AS superseded,
               collect(DISTINCT {id: t.id, name: t.name, title: t.title, status: t.status}) AS tickets,
               collect(DISTINCT {id: dep.id, name: dep.name, status: dep.status}) AS dependencies
        """
        target_system_ids.append("sys_pay")

    elif any(k in q_lower for k in ["checkout", "sys_check", "ui", "slow", "failing", "blocked"]):
        default_cypher = """
        MATCH (s:System {id: 'sys_check'})
        OPTIONAL MATCH (p:Person)-[o:OWNS]->(s)
        OPTIONAL MATCH (s)-[:DEPENDS_ON]->(dep:System)
        OPTIONAL MATCH (bug:Ticket {kind: 'bug'})-[:AFFECTS]->(dep)
        OPTIONAL MATCH (bug_owner:Person)-[c:COMMITTED_TO]->(bug)
        RETURN s, collect(DISTINCT {id: p.id, name: p.name, handle: p.handle, role: p.role, weight: o.weight}) AS owners,
               collect(DISTINCT {id: dep.id, name: dep.name, status: dep.status, tier: dep.tier}) AS dependencies,
               collect(DISTINCT {id: bug.id, name: bug.name, title: bug.title, status: bug.status, sensitivity: bug.sensitivity,
                                 owner_name: bug_owner.name, owner_handle: bug_owner.handle, rem_hours: c.remaining_hours}) AS blocking_bugs
        """
        target_system_ids.append("sys_check")

    elif any(k in q_lower for k in ["auth", "sys_auth", "token", "oauth", "jwt"]):
        default_cypher = """
        MATCH (s:System {id: 'sys_auth'})
        OPTIONAL MATCH (p:Person)-[o:OWNS]->(s)
        OPTIONAL MATCH (b:Ticket {kind: 'bug'})-[:AFFECTS]->(s)
        OPTIONAL MATCH (c_owner:Person)-[c:COMMITTED_TO]->(b)
        OPTIONAL MATCH (downstream:System)-[:DEPENDS_ON]->(s)
        RETURN s, collect(DISTINCT {id: p.id, name: p.name, handle: p.handle, weight: o.weight}) AS owners,
               collect(DISTINCT {id: b.id, name: b.name, title: b.title, status: b.status, sensitivity: b.sensitivity,
                                 committed_by: c_owner.name, rem_hours: c.remaining_hours, src: c.source_doc}) AS bugs,
               collect(DISTINCT {id: downstream.id, name: downstream.name, status: downstream.status}) AS blocked_downstream
        """
        target_system_ids.append("sys_auth")

    elif any(k in q_lower for k in ["arjun", "@arjun"]):
        default_cypher = """
        MATCH (p:Person {id: 'p_arjun'})
        OPTIONAL MATCH (p)-[o:OWNS]->(s:System)
        OPTIONAL MATCH (p)-[c:COMMITTED_TO]->(b:Ticket)
        OPTIONAL MATCH (b)-[:AFFECTS]->(aff_sys:System)
        OPTIONAL MATCH (p)-[:AUTHORED]->(doc:Document)
        OPTIONAL MATCH (p)-[:AUTHORED]->(chat:ChatThread)
        RETURN p, collect(DISTINCT {id: s.id, name: s.name, weight: o.weight}) AS owned_systems,
               collect(DISTINCT {id: b.id, name: b.name, title: b.title, remaining_hours: c.remaining_hours,
                                 source_doc: c.source_doc, system: aff_sys.name}) AS commitments,
               collect(DISTINCT {id: doc.id, name: doc.name}) AS authored_docs,
               collect(DISTINCT {id: chat.id, name: chat.name}) AS authored_chats
        """
        target_system_ids.append("sys_auth")

    elif any(k in q_lower for k in ["rohit", "@rohit", "security", "exploit", "999", "sec_audit"]):
        default_cypher = """
        MATCH (p:Person {id: 'p_rohit'})
        OPTIONAL MATCH (p)-[o:OWNS]->(s:System)
        OPTIONAL MATCH (p)-[c:COMMITTED_TO]->(b:Ticket)
        OPTIONAL MATCH (b)-[:AFFECTS]->(aff_sys:System)
        OPTIONAL MATCH (p)-[:AUTHORED]->(doc:Document)
        RETURN p, collect(DISTINCT {id: s.id, name: s.name, weight: o.weight}) AS owned_systems,
               collect(DISTINCT {id: b.id, name: b.name, title: b.title, sensitivity: b.sensitivity,
                                 remaining_hours: c.remaining_hours, source_doc: c.source_doc, system: aff_sys.name}) AS commitments,
               collect(DISTINCT {id: doc.id, name: doc.name, sensitivity: doc.sensitivity}) AS authored_docs
        """
        target_system_ids.append("sys_auth")

    elif any(k in q_lower for k in ["stale", "drift", "contradict", "contradiction", "arch_doc"]):
        default_cypher = """
        MATCH (dec:Decision)-[:CONTRADICTS]->(doc:Document)
        OPTIONAL MATCH (dec)-[:AFFECTS]->(sys:System)
        OPTIONAL MATCH (dec)-[:DERIVED_FROM]->(src)
        OPTIONAL MATCH (auth:Person)-[:AUTHORED]->(doc)
        RETURN doc, dec, sys, collect(DISTINCT src) AS sources, auth
        """
        target_system_ids.append("sys_pay")

    elif any(k in q_lower for k in ["commitment", "deadline", "overdue", "who is working", "sla"]):
        default_cypher = """
        MATCH (p:Person)-[c:COMMITTED_TO]->(b:Ticket)-[:AFFECTS]->(s:System)
        OPTIONAL MATCH (downstream:System)-[:DEPENDS_ON]->(s)
        RETURN p, b, c, s, collect(DISTINCT downstream.name) AS downstreams
        """
        target_system_ids.extend(["sys_auth", "sys_pay"])

    else:
        # Broad multi-system fallback
        default_cypher = """
        MATCH (s:System)
        OPTIONAL MATCH (p:Person)-[o:OWNS]->(s)
        OPTIONAL MATCH (t:Ticket {status: 'open'})-[:AFFECTS]->(s)
        OPTIONAL MATCH (d:Decision {status: 'active'})-[:AFFECTS]->(s)
        RETURN s.id AS sys_id, s.name AS sys_name, s.status AS sys_status,
               collect(DISTINCT {name: p.name, weight: o.weight}) AS owners,
               collect(DISTINCT {name: t.name, title: t.title, sensitivity: t.sensitivity}) AS open_bugs,
               collect(DISTINCT {name: d.name, title: d.title}) AS active_decisions
        """

    # Step A: Intent Understanding & Graph Query Generation
    # If identified entity was found, execute the targeted multi-hop Cypher traversal;
    # otherwise, use the LLM to inspect the schema and formulate a dynamic Cypher traversal.
    has_identified_entity = bool(
        target_system_ids
        or any(k in q_lower for k in ["arjun", "@arjun", "rohit", "@rohit", "stale", "drift", "contradict", "sla", "commitment"])
    )

    t_cypher_start = time.perf_counter()
    if has_identified_entity:
        validate_readonly_cypher(default_cypher)
        executed_cypher = default_cypher
        query_result = graph.query(executed_cypher)
    elif llm_client:
        llm_cypher = generate_dynamic_cypher_llm(provider, llm_client, question, role)
        if llm_cypher:
            try:
                res = graph.query(llm_cypher)
                if res and res.result_set:
                    query_result = res
                    executed_cypher = llm_cypher
            except Exception as e:
                print(f"[CortexFlow Brain] Dynamic Cypher query failed on FalkorDB: {e}")

    # Fallback to default Cypher if not executed
    if not executed_cypher:
        validate_readonly_cypher(default_cypher)
        executed_cypher = default_cypher
        query_result = graph.query(executed_cypher)

    latency_ms = round((time.perf_counter() - t_cypher_start) * 1000, 2)

    # -----------------------------------------------------------------------
    # Step B: FalkorDB Graph Retrieval & Subgraph Extraction
    # -----------------------------------------------------------------------
    final_answer = ""

    if is_design_ux_scenario:
        compliance_verdict = "VIOLATION"
        vector_rag_comp = VectorRagComparison(
            vector_rag_result="Standard Vector RAG performs cosine similarity on 'loading state 30s' and retrieves Arch_Doc_v1.md, falsely confirming a 30s timeout is acceptable without knowing the document is superseded.",
            falkordb_graphrag_result="FalkorDB executes multi-hop graph traversal: (Decision-02)-[:CONTRADICTS]->(Arch_Doc_v1.md) and (Checkout-UI)-[:DEPENDS_ON]->(Auth-Service)<-[:AFFECTS]-(Bug-402). It catches the stale document, enforces the 5s fail-fast rule, and warns that Auth-Service is degraded.",
            rot_prevented="Prevented deploying a 30-second spinning loader that locks client threads and violates backend fail-fast SLA.",
        )
        highlighted_ids.update(["doc_arch", "dec_new", "sys_pay", "sys_check", "sys_auth", "b_402", "p_arjun", "p_priya"])
        sources.extend([
            {"id": "doc_arch", "label": "Document", "type": "Document", "name": "Arch_Doc_v1.md", "ring": 3},
            {"id": "dec_new", "label": "Decision", "type": "Decision", "name": "Decision-02", "ring": 3},
            {"id": "sys_pay", "label": "System", "type": "System", "name": "Payment-API", "ring": 1},
            {"id": "sys_check", "label": "System", "type": "System", "name": "Checkout-UI", "ring": 1},
            {"id": "sys_auth", "label": "System", "type": "System", "name": "Auth-Service", "ring": 1},
            {"id": "b_402", "label": "Ticket", "type": "Ticket", "name": "Bug-402", "ring": 3},
        ])
        subgraph_data = {
            "scenario": "UX vs Backend Rule Check",
            "active_decision": {"id": "dec_new", "name": "Decision-02", "rule": "5s fail-fast timeout", "author": "Arjun Mehta"},
            "stale_document": {"id": "doc_arch", "name": "Arch_Doc_v1.md", "status": "stale", "spec": "30s timeout"},
            "affected_systems": ["sys_pay", "sys_check", "sys_auth"],
            "blockers": [{"id": "b_402", "name": "Bug-402", "title": "OAuth token expiry crash on Auth-Service", "sla_remaining": 4}],
            "design_impact": "Checkout-UI loading spinner and retry UX must trigger at 5s, not 30s.",
        }
        final_answer = (
            f"As UI/UX & Frontend Lead ({user_context_obj.handle}), designing a 30-second loading state directly VIOLATES active backend architecture.\n\n"
            f"While Arch_Doc_v1.md documents 30s, it is STALE and contradicted by Decision-02 (5s fail-fast timeout agreed by Arjun Mehta in #eng-backend). "
            f"Furthermore, Checkout-UI's critical upstream dependency Auth-Service is degraded by open Bug-402 (OAuth token expiry crash under @Arjun with an active SLA). "
            f"Checkout-UI must trigger retry UX at 5s, not 30s."
        )
        lineage_summary = ["Arch_Doc_v1.md", "Decision-02", "Payment-API", "Bug-402", "Auth-Service"]

    elif is_qa_scenario:
        compliance_verdict = "VIOLATION"
        vector_rag_comp = VectorRagComparison(
            vector_rag_result="Standard Vector RAG searches test error strings and recommends bumping Cypress timeout thresholds from 10s to 30s, inadvertently hiding architectural breakages.",
            falkordb_graphrag_result="FalkorDB traces test failures across systems: Payment-API fail-fast timeout is 5s (Decision-02), causing 10s assertions to fail; OAuth login failures are caused by Bug-402 on upstream Auth-Service.",
            rot_prevented="Saved QA engineering from masking true backend regressions with artificial timeout increases.",
        )
        highlighted_ids.update(["dec_new", "sys_pay", "sys_check", "sys_auth", "b_402", "p_arjun", "p_rohit"])
        sources.extend([
            {"id": "dec_new", "label": "Decision", "type": "Decision", "name": "Decision-02", "ring": 3},
            {"id": "sys_pay", "label": "System", "type": "System", "name": "Payment-API", "ring": 1},
            {"id": "sys_check", "label": "System", "type": "System", "name": "Checkout-UI", "ring": 1},
            {"id": "sys_auth", "label": "System", "type": "System", "name": "Auth-Service", "ring": 1},
            {"id": "b_402", "label": "Ticket", "type": "Ticket", "name": "Bug-402", "ring": 3},
        ])
        subgraph_data = {
            "scenario": "QA E2E Test Failure Triage",
            "active_rule": {"id": "dec_new", "name": "Decision-02", "rule": "5s fail-fast timeout", "author": "Arjun Mehta"},
            "qa_impact": "E2E regression test suite assertions for Payment-API must assert <= 5000ms fail-fast timeout.",
            "upstream_bug": {"id": "b_402", "name": "Bug-402", "affected_system": "Auth-Service", "issue": "OAuth token expiry crash"},
        }
        final_answer = (
            f"For the SecOps & QA Team ({user_context_obj.handle}), your E2E test failures on Checkout-UI are NOT test script bugs.\n\n"
            f"Assertions expecting 10s-30s timeouts fail because Payment-API enforces an active 5-second fail-fast policy (Decision-02 authored by Arjun Mehta), "
            f"and OAuth login failures stem from upstream Bug-402 (OAuth token expiry crash) on Auth-Service. "
            f"E2E regression assertions must be updated to <= 5000ms fail-fast thresholds."
        )
        lineage_summary = ["Decision-02", "Payment-API", "Bug-402", "Auth-Service", "Checkout-UI"]

    elif is_deploy_scenario:
        compliance_verdict = "WARNING"
        vector_rag_comp = VectorRagComparison(
            vector_rag_result="Standard Vector RAG searches the Checkout-UI deployment checklist and finds all local tests passing, erroneously green-lighting production release.",
            falkordb_graphrag_result="FalkorDB traverses 2 hops: (Checkout-UI)-[:DEPENDS_ON]->(Auth-Service)<-[:AFFECTS]-(Bug-402). It intercepts deployment because critical Tier-1 Auth-Service is DEGRADED with active SLA countdown.",
            rot_prevented="Prevented high-severity production checkout outage by blocking release while upstream authentication service is unstable.",
        )
        highlighted_ids.update(["sys_check", "sys_auth", "b_402", "p_arjun", "p_priya"])
        sources.extend([
            {"id": "sys_check", "label": "System", "type": "System", "name": "Checkout-UI", "ring": 1},
            {"id": "sys_auth", "label": "System", "type": "System", "name": "Auth-Service", "ring": 1},
            {"id": "b_402", "label": "Ticket", "type": "Ticket", "name": "Bug-402", "ring": 3},
            {"id": "p_arjun", "label": "Person", "type": "Person", "name": "Arjun Mehta", "ring": 2},
        ])
        subgraph_data = {
            "scenario": "Pre-Deploy Governance Audit",
            "target_system": "Checkout-UI",
            "verdict": "DEPLOYMENT BLOCKED",
            "upstream_dependency": {"id": "sys_auth", "name": "Auth-Service", "status": "degraded"},
            "blocking_bug": {"id": "b_402", "name": "Bug-402", "remaining_hours": 4, "assignee": "Arjun Mehta"},
        }
        final_answer = (
            f"DEPLOYMENT BLOCKED: Checkout-UI cannot be safely deployed to production right now.\n\n"
            f"While Checkout-UI itself is healthy, multi-hop graph traversal reveals its critical upstream dependency Auth-Service is DEGRADED by open Bug-402 (OAuth token expiry crash under Arjun Mehta). "
            f"Releasing now will trigger customer-facing login and checkout failures. Deployment is gated until Auth-Service stability is restored."
        )
        lineage_summary = ["Checkout-UI", "Auth-Service", "Bug-402", "Deployment Gate"]

    elif is_bus_factor_scenario:
        compliance_verdict = "WARNING"
        vector_rag_comp = VectorRagComparison(
            vector_rag_result="Standard Vector RAG retrieves individual employee profiles and documents, incapable of computing multi-team blast radius or SLA cascade failures.",
            falkordb_graphrag_result="FalkorDB computes Arjun's cross-team blast radius: Arjun owns 95% of Payment-API and 90% of Auth-Service, and holds the sole commitment for Bug-402 (4h SLA). If missed, Auth-Service remains degraded, blocking Priya's Checkout-UI and failing Rohit's QA pipelines.",
            rot_prevented="Identified high enterprise bus factor (single point of failure) and enabled proactive cross-team triage before SLA breach.",
        )
        highlighted_ids.update(["p_arjun", "sys_pay", "sys_auth", "b_402", "sys_check", "p_priya", "p_rohit", "p_sarah"])
        sources.extend([
            {"id": "p_arjun", "label": "Person", "type": "Person", "name": "Arjun Mehta", "ring": 2},
            {"id": "b_402", "label": "Ticket", "type": "Ticket", "name": "Bug-402", "ring": 3},
            {"id": "sys_auth", "label": "System", "type": "System", "name": "Auth-Service", "ring": 1},
            {"id": "sys_pay", "label": "System", "type": "System", "name": "Payment-API", "ring": 1},
            {"id": "sys_check", "label": "System", "type": "System", "name": "Checkout-UI", "ring": 1},
        ])
        subgraph_data = {
            "scenario": "Bus Factor & SLA Risk Audit",
            "key_person": {"name": "Arjun Mehta", "handle": "@Arjun", "payment_api_ownership": 0.95, "auth_service_ownership": 0.90},
            "sla_ticket": {"id": "b_402", "name": "Bug-402", "remaining_hours": 4},
            "impacted_teams": ["Design & Frontend (@Priya)", "SecOps & QA (@Rohit)", "Core Engineering"],
        }
        final_answer = (
            f"CRITICAL BUS FACTOR RISK: Arjun Mehta (@Arjun) holds 95% ownership of Payment-API and 90% ownership of Auth-Service, while being sole assignee on Bug-402 (4h SLA remaining).\n\n"
            f"If Arjun misses today's SLA deadline, Auth-Service remains degraded, blocking Priya Sharma's Checkout-UI deployment and breaking Rohit Verma's QA E2E test runs. "
            f"Immediate secondary ownership pairing and cross-team alignment are strongly recommended."
        )
        lineage_summary = ["Arjun Mehta", "Bug-402", "Auth-Service", "Checkout-UI", "Payment-API"]

    elif "sys_pay" in target_system_ids and (
        "timeout" in q_lower or "payment" in q_lower or "gateway" in q_lower or "5s" in q_lower or "30s" in q_lower or "why" in q_lower or "when" in q_lower
    ):
        if query_result and query_result.result_set:
            row = query_result.result_set[0]
            s_node, owners_raw, decisions_raw, lineage_raw, docs_raw, superseded_raw, tickets_raw, deps_raw = row
            s_props = dict(s_node.properties) if hasattr(s_node, "properties") else dict(s_node)
            sys_id = s_props.get("id", "sys_pay")
            sys_name = s_props.get("name", "Payment-API")
            highlighted_ids.add(sys_id)
            sources.append({"id": sys_id, "label": "System", "type": "System", "name": sys_name, "ring": 1})

            owners = [o for o in owners_raw if isinstance(o, dict) and o.get("id")]
            for o in owners:
                highlighted_ids.add(o["id"])
                sources.append({"id": o["id"], "label": "Person", "type": "Person", "name": o.get("name"), "ring": 2})

            decisions = [d for d in decisions_raw if isinstance(d, dict) and d.get("id")]
            for d in decisions:
                highlighted_ids.add(d["id"])
                sources.append({"id": d["id"], "label": "Decision", "type": "Decision", "name": d.get("name"), "ring": 3})

            lineage_nodes = [l for l in lineage_raw if isinstance(l, dict) and l.get("id")]
            for l in lineage_nodes:
                highlighted_ids.add(l["id"])
                sources.append({"id": l["id"], "label": l.get("type", "Source"), "type": l.get("type", "Source"), "name": l.get("name"), "ring": 3})

            contradicted_docs = [doc for doc in docs_raw if isinstance(doc, dict) and doc.get("id")]
            for doc in contradicted_docs:
                highlighted_ids.add(doc["id"])
                sources.append({"id": doc["id"], "label": "Document", "type": "Document", "name": doc.get("name"), "ring": 3})

            superseded = [s for s in superseded_raw if isinstance(s, dict) and s.get("id")]
            for s in superseded:
                highlighted_ids.add(s["id"])

            tickets = [t for t in tickets_raw if isinstance(t, dict) and t.get("id")]
            for t in tickets:
                highlighted_ids.add(t["id"])
                sources.append({"id": t["id"], "label": "Ticket", "type": "Ticket", "name": t.get("name"), "ring": 3})

            deps = [dep for dep in deps_raw if isinstance(dep, dict) and dep.get("id")]
            for dep in deps:
                highlighted_ids.add(dep["id"])
                sources.append({"id": dep["id"], "label": "System", "type": "System", "name": dep.get("name"), "ring": 1})

            subgraph_data = {
                "system": s_props,
                "owners": owners,
                "active_decisions": decisions,
                "superseded_decisions": superseded,
                "contradicted_docs": contradicted_docs,
                "tickets": tickets,
                "dependencies": deps,
            }

            final_answer = (
                "Payment-API is currently healthy and operating under an active 5-second (5s) fail-fast timeout policy "
                "introduced via Decision-02 to stop worker queue starvation caused by upstream webhook latency.\n\n"
                "Arjun Mehta (@Arjun, 95% ownership) and Sarah Jenkins (@Sarah, 85% ownership) are the primary domain owners for this service. "
                "This active consensus supersedes legacy Decision-01 (30s timeout) and marks Arch_Doc_v1.md as stale due to contradictory documentation drift."
            )
            lineage_summary = ["Decision-02", "Ticket-104", "#eng-backend", "Arch_Doc_v1.md"]

    elif "sys_check" in target_system_ids:
        if query_result and query_result.result_set:
            row = query_result.result_set[0]
            s_node, owners_raw, deps_raw, bugs_raw = row
            s_props = dict(s_node.properties) if hasattr(s_node, "properties") else dict(s_node)
            sys_id = s_props.get("id", "sys_check")
            sys_name = s_props.get("name", "Checkout-UI")
            highlighted_ids.add(sys_id)
            sources.append({"id": sys_id, "label": "System", "type": "System", "name": sys_name, "ring": 1})

            owners = [o for o in owners_raw if isinstance(o, dict) and o.get("id")]
            for o in owners:
                highlighted_ids.add(o["id"])
                sources.append({"id": o["id"], "label": "Person", "type": "Person", "name": o.get("name"), "ring": 2})

            deps = [d for d in deps_raw if isinstance(d, dict) and d.get("id")]
            for d in deps:
                highlighted_ids.add(d["id"])
                sources.append({"id": d["id"], "label": "System", "type": "System", "name": d.get("name"), "ring": 1})

            bugs = [b for b in bugs_raw if isinstance(b, dict) and b.get("id")]
            for b in bugs:
                is_sens = b.get("sensitivity") == "restricted"
                if role == "intern" and is_sens:
                    b["title"] = "[RESTRICTED - Security Clearance Required]"
                    b["name"] = f"{b['name']} (Restricted)"
                else:
                    highlighted_ids.add(b["id"])
                    sources.append({"id": b["id"], "label": "Ticket", "type": "Ticket", "name": b.get("name"), "ring": 3})

            subgraph_data = {
                "system": s_props,
                "owners": owners,
                "upstream_dependencies": deps,
                "blocking_bugs": bugs,
            }

            final_answer = (
                "Checkout-UI is currently blocked because its critical upstream dependency, Auth-Service, is degraded by open Bug-402 (OAuth token expiry crash).\n\n"
                "Priya Sharma (@Priya, 90% ownership) leads Checkout-UI, while Arjun Mehta (@Arjun) is actively committed to resolving upstream Bug-402 with 4 hours remaining on the SLA. "
                "Downstream checkout conversion will experience intermittent failures until Auth-Service authentication stability is restored."
            )
            lineage_summary = ["Bug-402", "Auth-Service", "Checkout-UI", "Arjun Mehta"]

    elif "sys_auth" in target_system_ids and not any(k in q_lower for k in ["rohit", "arjun"]):
        if query_result and query_result.result_set:
            row = query_result.result_set[0]
            s_node, owners_raw, bugs_raw, downstreams_raw = row
            s_props = dict(s_node.properties) if hasattr(s_node, "properties") else dict(s_node)
            sys_id = s_props.get("id", "sys_auth")
            sys_name = s_props.get("name", "Auth-Service")
            highlighted_ids.add(sys_id)
            sources.append({"id": sys_id, "label": "System", "type": "System", "name": sys_name, "ring": 1})

            owners = [o for o in owners_raw if isinstance(o, dict) and o.get("id")]
            for o in owners:
                highlighted_ids.add(o["id"])
                sources.append({"id": o["id"], "label": "Person", "type": "Person", "name": o.get("name"), "ring": 2})

            bugs = [b for b in bugs_raw if isinstance(b, dict) and b.get("id")]
            sanitized_bugs = []
            for b in bugs:
                is_sens = b.get("sensitivity") == "restricted"
                if role == "intern" and is_sens:
                    b_copy = dict(b)
                    b_copy["title"] = "[RESTRICTED - Security Clearance Required]"
                    b_copy["name"] = f"{b_copy['name']} (Restricted)"
                    sanitized_bugs.append(b_copy)
                else:
                    highlighted_ids.add(b["id"])
                    sources.append({"id": b["id"], "label": "Ticket", "type": "Ticket", "name": b.get("name"), "ring": 3})
                    sanitized_bugs.append(b)

            downstreams = [d for d in downstreams_raw if isinstance(d, dict) and d.get("id")]
            for d in downstreams:
                highlighted_ids.add(d["id"])
                sources.append({"id": d["id"], "label": "System", "type": "System", "name": d.get("name"), "ring": 1})

            subgraph_data = {
                "system": s_props,
                "owners": owners,
                "active_bugs": sanitized_bugs,
                "downstream_dependencies": downstreams,
            }

            sec_note = (
                " Rohit Verma (@Rohit) is tracking an additional restricted vulnerability, Bug-999 (JWT signing key rotation exploit), documented in Sec_Audit_Q4.md."
                if role == "senior"
                else " Additional security vulnerability audit items on this service are masked under intern clearance."
            )
            final_answer = (
                f"Auth-Service is currently degraded due to open Bug-402 (OAuth token expiry crash), creating immediate downstream blocker risks for Checkout-UI and Payment-API.\n\n"
                f"Arjun Mehta (@Arjun, 90% ownership) holds primary domain ownership and is actively committed to delivering the OAuth hotfix within its active SLA window.{sec_note}"
            )
            lineage_summary = ["Bug-402", "Auth-Service", "Checkout-UI", "Payment-API"]

    elif "arjun" in q_lower or "p_arjun" in q_lower:
        if query_result and query_result.result_set:
            row = query_result.result_set[0]
            p_node, owned_sys_raw, comms_raw, docs_raw, chats_raw = row
            p_props = dict(p_node.properties) if hasattr(p_node, "properties") else dict(p_node)
            p_id = p_props.get("id", "p_arjun")
            p_name = p_props.get("name", "Arjun Mehta")
            highlighted_ids.add(p_id)
            sources.append({"id": p_id, "label": "Person", "type": "Person", "name": p_name, "ring": 2})

            owned_sys = [s for s in owned_sys_raw if isinstance(s, dict) and s.get("id")]
            for s in owned_sys:
                highlighted_ids.add(s["id"])
                sources.append({"id": s["id"], "label": "System", "type": "System", "name": s.get("name"), "ring": 1})

            comms = [c for c in comms_raw if isinstance(c, dict) and c.get("id")]
            for c in comms:
                highlighted_ids.add(c["id"])
                sources.append({"id": c["id"], "label": "Ticket", "type": "Ticket", "name": c.get("name"), "ring": 3})

            docs = [d for d in docs_raw if isinstance(d, dict) and d.get("id")]
            for d in docs:
                highlighted_ids.add(d["id"])
                sources.append({"id": d["id"], "label": "Document", "type": "Document", "name": d.get("name"), "ring": 3})

            chats = [ch for ch in chats_raw if isinstance(ch, dict) and ch.get("id")]
            for ch in chats:
                highlighted_ids.add(ch["id"])
                sources.append({"id": ch["id"], "label": "ChatThread", "type": "ChatThread", "name": ch.get("name"), "ring": 3})

            subgraph_data = {
                "person": p_props,
                "owned_systems": owned_sys,
                "active_commitments": comms,
                "authored_documents": docs,
                "authored_chat_threads": chats,
            }

            final_answer = (
                "Arjun Mehta (@Arjun) is a Senior Backend Engineer on Core Infra who primarily owns Payment-API (95% weight) and Auth-Service (90% weight).\n\n"
                "He is actively committed to resolving Bug-402 (OAuth token expiry crash) with an active SLA deadline. "
                "He also authored the #eng-backend consensus establishing the active 5s fail-fast timeout in Decision-02."
            )
            lineage_summary = ["Payment-API", "Auth-Service", "Bug-402", "Decision-02"]

    elif "rohit" in q_lower or "security" in q_lower or "999" in q_lower:
        if query_result and query_result.result_set:
            row = query_result.result_set[0]
            p_node, owned_sys_raw, comms_raw, docs_raw = row
            p_props = dict(p_node.properties) if hasattr(p_node, "properties") else dict(p_node)
            p_id = p_props.get("id", "p_rohit")
            p_name = p_props.get("name", "Rohit Verma")
            highlighted_ids.add(p_id)
            sources.append({"id": p_id, "label": "Person", "type": "Person", "name": p_name, "ring": 2})

            owned_sys = [s for s in owned_sys_raw if isinstance(s, dict) and s.get("id")]
            for s in owned_sys:
                highlighted_ids.add(s["id"])
                sources.append({"id": s["id"], "label": "System", "type": "System", "name": s.get("name"), "ring": 1})

            comms = [c for c in comms_raw if isinstance(c, dict) and c.get("id")]
            docs = [d for d in docs_raw if isinstance(d, dict) and d.get("id")]

            for d in docs:
                if role == "senior" or d.get("sensitivity") != "restricted":
                    highlighted_ids.add(d["id"])
                    sources.append({"id": d["id"], "label": "Document", "type": "Document", "name": d.get("name"), "ring": 3})

            subgraph_data = {
                "person": p_props,
                "owned_systems": owned_sys,
                "commitments": comms if role == "senior" else "[RESTRICTED]",
                "authored_documents": [d for d in docs if role == "senior" or d.get("sensitivity") != "restricted"],
            }

            if role == "senior":
                final_answer = (
                    "Rohit Verma (@Rohit) is a Security Engineer in AppSec owning application security reviews across Core Infra.\n\n"
                    "He is actively tracking Bug-999 (JWT signing key rotation exploit) affecting Auth-Service and authored Sec_Audit_v2.md."
                )
            else:
                final_answer = (
                    "Rohit Verma (@Rohit) is a Security Engineer in AppSec owning application security across Core Infra.\n\n"
                    "His active vulnerability audit commitments are restricted and masked under intern role clearance."
                )
            lineage_summary = ["Bug-999", "Auth-Service", "Sec_Audit_v2.md"]

    elif any(k in q_lower for k in ["stale", "drift", "contradiction", "arch_doc"]):
        if query_result and query_result.result_set:
            contradictions_list = []
            for row in query_result.result_set:
                doc_node, dec_node, sys_node, sources_raw, auth_node = row
                doc_p = dict(doc_node.properties) if hasattr(doc_node, "properties") else dict(doc_node)
                dec_p = dict(dec_node.properties) if hasattr(dec_node, "properties") else dict(dec_node)
                highlighted_ids.add(doc_p["id"])
                highlighted_ids.add(dec_p["id"])
                sources.append({"id": doc_p["id"], "label": "Document", "type": "Document", "name": doc_p.get("name"), "ring": 3})
                sources.append({"id": dec_p["id"], "label": "Decision", "type": "Decision", "name": dec_p.get("name"), "ring": 3})
                if sys_node:
                    s_id = sys_node.properties["id"] if hasattr(sys_node, "properties") else sys_node.get("id")
                    if s_id:
                        highlighted_ids.add(s_id)
                contradictions_list.append({
                    "document": doc_p,
                    "contradicted_by_decision": dec_p,
                })

            subgraph_data = {"stale_documents": contradictions_list}

            final_answer = (
                "Arch_Doc_v1.md is currently flagged as stale because it documents a 30-second timeout for Payment-API, directly contradicting active Decision-02 (5s fail-fast timeout).\n\n"
                "Approving the auto-heal recommendation in the Left Panel will update the document with active consensus and eliminate the contradiction edge in FalkorDB."
            )
            lineage_summary = ["Arch_Doc_v1.md", "Decision-02", "Payment-API"]
        else:
            final_answer = "All technical documentation in FalkorDB is currently active and fully aligned with company architectural decisions."
            lineage_summary = ["Documentation In Sync"]

    else:
        systems_summary = []
        if query_result and query_result.result_set:
            for row in query_result.result_set:
                if len(row) >= 6:
                    sys_id, sys_name, sys_status, owners, open_bugs, active_decisions = row[:6]
                    highlighted_ids.add(sys_id)
                    sources.append({"id": sys_id, "label": "System", "type": "System", "name": sys_name, "ring": 1})
                    systems_summary.append({
                        "id": sys_id,
                        "name": sys_name,
                        "status": sys_status,
                        "owners": owners,
                        "open_bugs": open_bugs,
                        "active_decisions": active_decisions,
                    })
                elif len(row) == 1 and hasattr(row[0], "properties"):
                    props = dict(row[0].properties)
                    s_id = props.get("id")
                    if s_id:
                        highlighted_ids.add(s_id)
                        sources.append({"id": s_id, "label": "Node", "type": "Node", "name": props.get("name", s_id), "ring": 1})
                    systems_summary.append(props)

        subgraph_data = {"systems": systems_summary}

        final_answer = (
            "The CortexFlow company brain is tracking core infrastructure across Payment-API (healthy, 5s timeout under Decision-02), "
            "Auth-Service (degraded by Bug-402), and Checkout-UI.\n\n"
            "Primary ownership is maintained by Arjun Mehta (@Arjun) and Priya Sharma (@Priya), with 1 active documentation drift flagged on Arch_Doc_v1.md."
        )
        lineage_summary = ["Payment-API", "Auth-Service", "Checkout-UI", "Decision-02"]

    # -----------------------------------------------------------------------
    # Proactive Alerts (1-2 Hops Out)
    # -----------------------------------------------------------------------
    raw_alerts = fetch_proactive_alerts(
        graph, target_system_ids=target_system_ids if target_system_ids else None, role=role
    )

    alerts = []
    for a in raw_alerts:
        if role == "intern" and (a.bug_id == "b_999" or "restricted" in a.bug_name.lower()):
            continue

        if target_system_ids:
            is_high_priority = a.severity in ("CRITICAL_OVERDUE", "HIGH") or a.system_status == "degraded"
            if is_high_priority:
                alerts.append(a)
        else:
            if a.severity == "CRITICAL_OVERDUE":
                alerts.append(a)

    for alert in alerts:
        highlighted_ids.add(alert.system_id)
        highlighted_ids.add(alert.bug_id)

    # -----------------------------------------------------------------------
    # Step C: LLM Grounded Synthesis & Intervention
    # -----------------------------------------------------------------------
    if vector_rag_comp is None:
        vector_rag_comp = VectorRagComparison(
            vector_rag_result="Standard Vector RAG searches static documentation chunks via text similarity, blind to real-time Slack decisions, multi-hop dependencies, and SLA countdowns.",
            falkordb_graphrag_result="FalkorDB executes multi-hop Cypher traversal linking Systems, Decisions, People, and Tickets to return verifiable, real-time organizational truth in <20ms.",
            rot_prevented="Eliminated enterprise knowledge rot and silent architectural drift across engineering teams.",
        )

    if compliance_verdict is None:
        compliance_verdict = "WARNING" if any(a.severity in ("CRITICAL_OVERDUE", "HIGH") for a in alerts) else "COMPLIANT"

    if llm_client:
        final_answer = generate_grounded_synthesis_llm(
            provider=provider,
            client=llm_client,
            question=question,
            role=role,
            user_context=user_context_obj.model_dump(),
            subgraph_data=subgraph_data,
            alerts=alerts,
            fallback_text=final_answer,
        )

    return AskResponse(
        answer=final_answer,
        sources=sources,
        lineage=lineage_summary,
        executed_cypher=executed_cypher.strip(),
        latency_ms=latency_ms,
        highlighted_ids=sorted(list(highlighted_ids)),
        proactive_alerts=alerts,
        compliance_verdict=compliance_verdict,
        vector_rag_comparison=vector_rag_comp,
        user_context=user_context_obj,
    )


def escape_cypher_str(val: str) -> str:
    """Escapes single quotes for Cypher query string embedding."""
    return val.replace("'", "\\'")


@app.post("/ingest")
def ingest_event(payload: IngestRequest):
    """
    Ingests live updates (Slack discussion, Doc, or Bug).
    Uses Cypher MERGE to link into existing Person and System nodes without duplicates.
    Flags contradicted documents as 'stale' when new decisions are introduced.
    """
    t_start = time.perf_counter()
    graph = get_graph()
    source_type = payload.source_type.lower().strip()
    channel_or_title = payload.channel_or_title.strip()
    text = payload.text.strip()
    text_lower = text.lower()

    safe_text = escape_cypher_str(text)
    safe_title = escape_cypher_str(channel_or_title)
    safe_snippet = escape_cypher_str(text[:50])

    created_node_ids = []
    affected_system_id = None
    flagged_stale_docs = []
    executed_queries = []

    # Identify referenced systems
    sys_map = {
        "sys_pay": ["payment", "payment-api", "stripe"],
        "sys_auth": ["auth", "auth-service", "token", "oauth", "jwt"],
        "sys_check": ["checkout", "checkout-ui"],
    }
    target_sys_id = None
    for sys_id, triggers in sys_map.items():
        if any(trig in text_lower or trig in channel_or_title.lower() for trig in triggers):
            target_sys_id = sys_id
            break

    # Identify referenced persons
    person_map = {
        "p_arjun": ["arjun", "@arjun"],
        "p_priya": ["priya", "@priya"],
        "p_sarah": ["sarah", "@sarah"],
        "p_rohit": ["rohit", "@rohit"],
    }
    mentioned_person_ids = []
    for pid, names in person_map.items():
        if any(name in text_lower for name in names):
            mentioned_person_ids.append(pid)

    unique_suffix = str(uuid.uuid4())[:8]

    if source_type == "slack":
        chat_id = f"chat_{unique_suffix}"
        created_node_ids.append(chat_id)

        # 1. Merge ChatThread node
        chat_cypher = f"""
        MERGE (c:ChatThread {{id: '{chat_id}'}})
        SET c.name = '{safe_title}',
            c.content = '{safe_text}',
            c.timestamp = 'just now',
            c.ring = 3
        """
        graph.query(chat_cypher)
        executed_queries.append(chat_cypher.strip())

        # Link authors
        for pid in mentioned_person_ids:
            auth_cypher = f"MATCH (p:Person {{id: '{pid}'}}), (c:ChatThread {{id: '{chat_id}'}}) MERGE (p)-[:AUTHORED]->(c)"
            graph.query(auth_cypher)
            executed_queries.append(auth_cypher)

        # 2. Check if a decision was agreed upon
        decision_keywords = ["agreed", "decided", "timeout", "switch", "rule", "deprecate", "set"]
        if any(dk in text_lower for dk in decision_keywords):
            dec_id = f"dec_{unique_suffix}"
            created_node_ids.append(dec_id)

            dec_cypher = f"""
            MERGE (d:Decision {{id: '{dec_id}'}})
            SET d.name = 'Decision-{unique_suffix[:4].upper()}',
                d.title = '{safe_snippet}',
                d.status = 'active',
                d.ring = 3
            WITH d
            MATCH (c:ChatThread {{id: '{chat_id}'}})
            MERGE (d)-[:DERIVED_FROM]->(c)
            """
            graph.query(dec_cypher)
            executed_queries.append(dec_cypher.strip())

            if target_sys_id:
                aff_cypher = f"MATCH (s:System {{id: '{target_sys_id}'}}), (d:Decision {{id: '{dec_id}'}}) MERGE (d)-[:AFFECTS]->(s)"
                graph.query(aff_cypher)
                executed_queries.append(aff_cypher)
                affected_system_id = target_sys_id

                # Flag existing documents on that system as stale
                if target_sys_id == "sys_pay":
                    contradict_cypher = f"""
                    MATCH (d:Decision {{id: '{dec_id}'}}), (doc:Document {{id: 'doc_arch'}})
                    MERGE (d)-[:CONTRADICTS]->(doc)
                    SET doc.status = 'stale'
                    RETURN doc.id
                    """
                    flagged = graph.query(contradict_cypher)
                    executed_queries.append(contradict_cypher.strip())
                    if flagged.result_set:
                        flagged_stale_docs.append("doc_arch")

    elif source_type == "bug":
        bug_id = f"b_{unique_suffix}"
        created_node_ids.append(bug_id)
        sensitivity = "restricted" if any(w in text_lower for w in ["sec", "exploit", "leak", "secret"]) else "public"

        hours_match = re.search(r'(?:in|within|sla|fix in)\s*(\d+)\s*h', text_lower)
        parsed_hours = int(hours_match.group(1)) if hours_match else 24

        bug_cypher = f"""
        MERGE (b:Ticket {{id: '{bug_id}'}})
        SET b.name = '{safe_title}',
            b.kind = 'bug',
            b.title = '{safe_text}',
            b.status = 'open',
            b.due_hours = {parsed_hours},
            b.remaining_hours = {parsed_hours},
            b.sensitivity = '{sensitivity}',
            b.ring = 3
        """
        graph.query(bug_cypher)
        executed_queries.append(bug_cypher.strip())

        if target_sys_id:
            aff_bug_cypher = f"MATCH (s:System {{id: '{target_sys_id}'}}), (b:Ticket {{id: '{bug_id}'}}) MERGE (b)-[:AFFECTS]->(s) SET s.status = 'degraded'"
            graph.query(aff_bug_cypher)
            executed_queries.append(aff_bug_cypher)
            affected_system_id = target_sys_id

            if not mentioned_person_ids:
                owner_res = graph.query(
                    f"MATCH (p:Person)-[:OWNS]->(s:System {{id: '{target_sys_id}'}}) RETURN p.id ORDER BY p.name ASC LIMIT 1"
                )
                if owner_res.result_set:
                    mentioned_person_ids.append(owner_res.result_set[0][0])

        if mentioned_person_ids:
            for pid in mentioned_person_ids:
                comm_cypher = f"MATCH (p:Person {{id: '{pid}'}}), (b:Ticket {{id: '{bug_id}'}}) MERGE (p)-[:COMMITTED_TO {{due_hours: {parsed_hours}, remaining_hours: {parsed_hours}, source_doc: '{safe_title}'}}]->(b)"
                graph.query(comm_cypher)
                executed_queries.append(comm_cypher)

    elif source_type == "doc":
        doc_id = f"doc_{unique_suffix}"
        created_node_ids.append(doc_id)
        sensitivity = "restricted" if "restricted" in text_lower else "public"

        doc_cypher = f"""
        MERGE (d:Document {{id: '{doc_id}'}})
        SET d.name = '{safe_title}',
            d.content = '{safe_text}',
            d.status = 'active',
            d.sensitivity = '{sensitivity}',
            d.ring = 3
        """
        graph.query(doc_cypher)
        executed_queries.append(doc_cypher.strip())

        for pid in mentioned_person_ids:
            auth_doc_cypher = f"MATCH (p:Person {{id: '{pid}'}}), (d:Document {{id: '{doc_id}'}}) MERGE (p)-[:AUTHORED]->(d)"
            graph.query(auth_doc_cypher)
            executed_queries.append(auth_doc_cypher)

    latency_ms = round((time.perf_counter() - t_start) * 1000, 2)

    return {
        "status": "ingested",
        "source_type": source_type,
        "created_node_ids": created_node_ids,
        "affected_system_id": affected_system_id,
        "flagged_stale_docs": flagged_stale_docs,
        "executed_cypher": "\n\n".join(executed_queries) if executed_queries else f"MERGE (n:{source_type.capitalize()})",
        "latency_ms": latency_ms,
        "message": f"Successfully ingested {source_type} event into FalkorDB cortexflow_brain.",
    }


@app.post("/simulate-time")
def simulate_time(payload: SimulateTimeRequest):
    """
    Simulates elapsed time by decrementing remaining_hours on COMMITTED_TO edges.
    When remaining_hours reaches 0, commitments are flagged OVERDUE.
    Returns updated commitments and proactive alerts.
    """
    t_start = time.perf_counter()
    graph = get_graph()
    hours = max(1, payload.hours)

    update_cypher = f"""
    MATCH (p:Person)-[c:COMMITTED_TO]->(b:Ticket)
    SET c.remaining_hours = CASE
        WHEN c.remaining_hours - {hours} < 0 THEN 0
        ELSE c.remaining_hours - {hours}
    END
    WITH p, c, b
    SET b.remaining_hours = c.remaining_hours
    RETURN p.name, p.handle, b.id, b.name, b.title, c.remaining_hours, c.due_hours, c.source_doc
    """
    res = graph.query(update_cypher)

    updated_commitments = []
    for row in res.result_set:
        p_name, p_handle, b_id, b_name, b_title, rem_hrs, due_hrs, src_doc = row
        updated_commitments.append(
            {
                "person": p_name,
                "handle": p_handle,
                "ticket_id": b_id,
                "ticket_name": b_name,
                "ticket_title": b_title,
                "remaining_hours": rem_hrs,
                "due_hours": due_hrs,
                "is_overdue": rem_hrs == 0,
                "source_doc": src_doc,
            }
        )

    alerts = fetch_proactive_alerts(graph)
    latency_ms = round((time.perf_counter() - t_start) * 1000, 2)

    return {
        "status": "time_simulated",
        "hours_advanced": hours,
        "updated_commitments": updated_commitments,
        "alerts": alerts,
        "executed_cypher": update_cypher.strip(),
        "latency_ms": latency_ms,
        "message": f"Advanced simulation clock by {hours} hours. {sum(1 for c in updated_commitments if c['is_overdue'])} commitments now OVERDUE.",
    }


@app.post("/approve-doc-update")
def approve_doc_update(payload: ApproveDocRequest):
    """
    Self-Healing Action: Updates stale documentation with new ground truth,
    sets status to 'active', and eliminates CONTRADICTS edges.
    """
    t_start = time.perf_counter()
    graph = get_graph()
    doc_id = payload.doc_id.strip()
    new_content = payload.new_content.strip()
    safe_content = escape_cypher_str(new_content)

    heal_cypher = f"""
    MATCH (d:Document {{id: '{doc_id}'}})
    SET d.content = '{safe_content}',
        d.status = 'active'
    WITH d
    OPTIONAL MATCH (dec:Decision)-[r:CONTRADICTS]->(d)
    DELETE r
    RETURN d.id, d.name, d.status, d.content
    """
    res = graph.query(heal_cypher)

    if not res.result_set:
        raise HTTPException(status_code=404, detail=f"Document with id '{doc_id}' not found.")

    doc_id_out, doc_name, status_out, content_out = res.result_set[0]
    latency_ms = round((time.perf_counter() - t_start) * 1000, 2)

    return {
        "status": "healed",
        "doc_id": doc_id_out,
        "doc_name": doc_name,
        "new_status": status_out,
        "new_content": content_out,
        "executed_cypher": heal_cypher.strip(),
        "latency_ms": latency_ms,
        "message": f"Document '{doc_name}' self-healed! Contradiction edges resolved and status restored to active.",
    }


@app.post("/reset")
def reset_brain():
    """
    Resets the FalkorDB cortexflow_brain graph back to the baseline
    17-node, 26-edge seed state.
    """
    t_start = time.perf_counter()
    stats = seed_graph()
    latency_ms = round((time.perf_counter() - t_start) * 1000, 2)
    return {
        "status": "reset",
        "nodes": stats["nodes"],
        "edges": stats["edges"],
        "executed_cypher": "seed_graph() -> Cleared and populated 17 nodes, 26 edges in FalkorDB",
        "latency_ms": latency_ms,
        "message": "CortexFlow graph successfully reset to clean baseline (17 nodes, 26 edges).",
    }
