"""
Query controller — AI-first NLP query engine.
Flow: question → AI generates SQL → validate → execute → return results.
Fallback: pattern-matching if AI unavailable.
"""

from fastapi import HTTPException, UploadFile
import io, os, re, sys, time, logging
from collections import defaultdict
from pathlib import Path

# Inject NlpDataSearchEngine venv so langchain_openai is available
_VENV = str(Path(__file__).resolve().parents[3] / "NlpDataSearchEngine" / "venv" / "Lib" / "site-packages")
if _VENV not in sys.path:
    sys.path.insert(0, _VENV)

from app.db import check_table_exists, fetch_worker_scheme_statistics, get_pg_connection
from app.models.message import MessageResponse

logger = logging.getLogger(__name__)
chat_query_history = []

# ---------------------------------------------------------------------------
# Basic endpoints
# ---------------------------------------------------------------------------
def get_index() -> MessageResponse:
    return MessageResponse(message="Hello World")

def get_about() -> MessageResponse:
    return MessageResponse(message="This is the about page")

def check_worker_scheme_statistics_controller():
    if not check_table_exists("worker_scheme_statistics"):
        raise HTTPException(status_code=404, detail="Table not found")
    return {"table": "worker_scheme_statistics", "exists": True}

def get_coverage_data_controller(limit: int = 1000):
    if not check_table_exists("worker_scheme_statistics"):
        raise HTTPException(status_code=404, detail="Table not found")
    return {"success": True, "data": fetch_worker_scheme_statistics(limit), "count": limit}

# ---------------------------------------------------------------------------
# Normalization
# ---------------------------------------------------------------------------
def _normalize(r: dict) -> dict:
    return {
        "Country": r.get("country"), "Country Code": r.get("country_code"),
        "PIN code": r.get("pin_code"), "State": r.get("state"),
        "State Code": r.get("state_code"), "District": r.get("district"),
        "Latitude": r.get("latitude"), "Longitude": r.get("longitude"),
        "Total Worker":   r.get("total_worker")         or 0,
        "Male Worker":    r.get("male_worker")          or 0,
        "Female Worker":  r.get("female_worker")        or 0,
        "Age 18-25":      r.get("age_between_18_to_25") or 0,
        "Age 25-40":      r.get("age_between_25_to_40") or 0,
        "Age 40-60":      r.get("age_between_40_to_60") or 0,
        "scheme_onorc":       r.get("scheme_onorc")       or 0,
        "scheme_pm_svanidhi": r.get("scheme_pm_svanidhi") or 0,
        "scheme_pahal":       r.get("scheme_pahal")       or 0,
        "scheme_pmjay":       r.get("scheme_pmjay")       or 0,
        "scheme_mgnrega":     r.get("scheme_mgnrega")     or 0,
        "scheme_ujjawala":    r.get("scheme_ujjawala")    or 0,
        "scheme_pmkisan":     r.get("scheme_pmkisan")     or 0,
        "scheme_pmay_g":      r.get("scheme_pmay_g")      or 0,
        "scheme_pmay_u":      r.get("scheme_pmay_u")      or 0,
        "scheme_pmfby":       r.get("scheme_pmfby")       or 0,
        "scheme_pmjjby":      r.get("scheme_pmjjby")      or 0,
        "scheme_pmsby":       r.get("scheme_pmsby")       or 0,
        "scheme_pmmvy":       r.get("scheme_pmmvy")       or 0,
    }

SCHEME_MAP = {
    "mgnrega": "scheme_mgnrega", "pmjay": "scheme_pmjay",
    "pmkisan": "scheme_pmkisan", "svanidhi": "scheme_pm_svanidhi",
    "pm svanidhi": "scheme_pm_svanidhi", "pmmvy": "scheme_pmmvy",
    "ujjawala": "scheme_ujjawala", "ujjwala": "scheme_ujjawala",
    "pmfby": "scheme_pmfby", "pmsby": "scheme_pmsby", "pmjjby": "scheme_pmjjby",
    "onorc": "scheme_onorc", "pahal": "scheme_pahal",
    "pmay": "scheme_pmay_g", "pmay-g": "scheme_pmay_g", "pmay-u": "scheme_pmay_u",
}

# ---------------------------------------------------------------------------
# AI SQL Generation
# ---------------------------------------------------------------------------
_SCHEMA = """Table: public.worker_scheme_statistics
Columns: country, country_code, pin_code, state, state_code, district,
  latitude, longitude, total_worker, male_worker, female_worker,
  age_between_18_to_25, age_between_25_to_40, age_between_40_to_60,
  scheme_onorc, scheme_pm_svanidhi, scheme_pahal, scheme_pmjay, scheme_mgnrega,
  scheme_ujjawala, scheme_pmkisan, scheme_pmay_g, scheme_pmay_u,
  scheme_pmfby, scheme_pmjjby, scheme_pmsby, scheme_pmmvy"""

_SYSTEM_PROMPT = """You are an expert PostgreSQL analyst for India Ministry of Labour worker statistics.

SCHEMA:
{schema}

RULES:
1. Output ONLY ```sql ... ``` block — nothing outside it.
2. Table: public.worker_scheme_statistics (always).
3. Use EXACT column names from SCHEMA — no invented columns.
4. PostgreSQL: double-quote identifiers, LIMIT not TOP, ILIKE for string filters.
5. GROUP BY state/district for "state wise"/"district wise" queries.
6. Use scheme_* columns for scheme enrollment (e.g. scheme_mgnrega).
7. LIMIT 200 unless aggregate query or user says "all".
8. Only SELECT — no INSERT/UPDATE/DELETE/DROP.
9. Meaningful column aliases (AS "State", AS "Total Workers Enrolled in MGNREGA").

VALIDATE before output:
- All columns exist in SCHEMA ✓
- Table name correct ✓
- No dangerous keywords ✓
- GROUP BY present for aggregations ✓"""

_llm = None

def _get_llm():
    global _llm
    if _llm is None:
        from langchain_openai import AzureChatOpenAI
        _llm = AzureChatOpenAI(
            azure_deployment=os.getenv("EYQ_DEPLOYMENT_NAME", "gpt-4o"),
            azure_endpoint=os.getenv("EYQ_API_BASE", ""),
            api_key=os.getenv("EYQ_API_KEY", ""),
            api_version=os.getenv("EYQ_API_VERSION", "2023-05-15"),
            temperature=0, max_tokens=1000,
        )
    return _llm

def _ai_generate_sql(question: str) -> str:
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser
    prompt = ChatPromptTemplate.from_messages([
        ("system", _SYSTEM_PROMPT),
        ("human", "Generate validated PostgreSQL query for: {question}"),
    ])
    return (prompt | _get_llm() | StrOutputParser()).invoke({"question": question, "schema": _SCHEMA})

def _extract_sql(resp: str) -> str | None:
    m = re.search(r"```sql\s*(.*?)\s*```", resp, re.DOTALL | re.IGNORECASE)
    if m: return m.group(1).strip()
    m = re.search(r"```\s*(.*?)\s*```", resp, re.DOTALL)
    if m:
        s = m.group(1).strip()
        if s.upper().startswith(("SELECT", "WITH")): return s
    for line in resp.splitlines():
        line = line.strip()
        if line.upper().startswith(("SELECT", "WITH")) and len(line) > 10: return line
    return None

def _validate_sql(sql: str) -> tuple[bool, str]:
    u = sql.upper().strip()
    if not u.startswith(("SELECT", "WITH")):
        return False, "Only SELECT/WITH allowed"
    for kw in ("DROP","DELETE","UPDATE","INSERT","ALTER","CREATE","TRUNCATE"):
        if re.search(rf"\b{kw}\b", u):
            return False, f"Dangerous keyword: {kw}"
    if "WORKER_SCHEME_STATISTICS" not in u:
        return False, "Must reference worker_scheme_statistics"
    return True, ""

def _execute_sql(sql: str) -> list:
    from psycopg2.extras import RealDictCursor
    with get_pg_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql)
            return [dict(r) for r in cur.fetchall()]

def _natural_response(rows: list) -> str:
    if not rows: return "No results found."
    if len(rows) == 1 and len(rows[0]) == 1:
        k, v = next(iter(rows[0].items()))
        return f"{k.replace('_',' ').title()}: {v}"
    if len(rows) == 1:
        return "Result — " + ", ".join(f"{k.replace('_',' ')}: {v}" for k,v in rows[0].items())
    return f"Query executed successfully. Found {len(rows)} record(s)."

# ---------------------------------------------------------------------------
# Pattern-matching fallback helpers
# ---------------------------------------------------------------------------
# City → State alias map (common city names not stored as states in DB)
# ---------------------------------------------------------------------------
CITY_TO_STATE = {
    "mumbai":      "Maharashtra",
    "pune":        "Maharashtra",
    "nagpur":      "Maharashtra",
    "nashik":      "Maharashtra",
    "aurangabad":  "Maharashtra",
    "chennai":     "Tamil Nadu",
    "coimbatore":  "Tamil Nadu",
    "madurai":     "Tamil Nadu",
    "bengaluru":   "Karnataka",
    "bangalore":   "Karnataka",
    "mysuru":      "Karnataka",
    "mysore":      "Karnataka",
    "hubli":       "Karnataka",
    "hyderabad":   "Telangana",
    "warangal":    "Telangana",
    "kolkata":     "West Bengal",
    "howrah":      "West Bengal",
    "ahmedabad":   "Gujarat",
    "surat":       "Gujarat",
    "vadodara":    "Gujarat",
    "rajkot":      "Gujarat",
    "jaipur":      "Rajasthan",
    "jodhpur":     "Rajasthan",
    "udaipur":     "Rajasthan",
    "kota":        "Rajasthan",
    "lucknow":     "Uttar Pradesh",
    "kanpur":      "Uttar Pradesh",
    "agra":        "Uttar Pradesh",
    "varanasi":    "Uttar Pradesh",
    "allahabad":   "Uttar Pradesh",
    "prayagraj":   "Uttar Pradesh",
    "meerut":      "Uttar Pradesh",
    "noida":       "Uttar Pradesh",
    "ghaziabad":   "Uttar Pradesh",
    "patna":       "Bihar",
    "gaya":        "Bihar",
    "bhopal":      "Madhya Pradesh",
    "indore":      "Madhya Pradesh",
    "jabalpur":    "Madhya Pradesh",
    "gwalior":     "Madhya Pradesh",
    "raipur":      "Chhattisgarh",
    "bhubaneswar": "Odisha",
    "cuttack":     "Odisha",
    "guwahati":    "Assam",
    "chandigarh":  "Punjab",
    "ludhiana":    "Punjab",
    "amritsar":    "Punjab",
    "dehradun":    "Uttarakhand",
    "shimla":      "Himachal Pradesh",
    "srinagar":    "Jammu & Kashmir",
    "jammu":       "Jammu & Kashmir",
    "ranchi":      "Jharkhand",
    "jamshedpur":  "Jharkhand",
    "thiruvananthapuram": "Kerala",
    "trivandrum":  "Kerala",
    "kochi":       "Kerala",
    "kozhikode":   "Kerala",
    "visakhapatnam": "Andhra Pradesh",
    "vijayawada":  "Andhra Pradesh",
    "guntur":      "Andhra Pradesh",
    "new delhi":   "Delhi",
    "delhi":       "Delhi",
}

def _extract_entities(q, rows):
    e = {"pincode": None, "state": None, "district": None}

    # PIN code
    m = re.search(r"\b(\d{5,6})\b", q)
    if m:
        e["pincode"] = m.group(1)
        return e

    # City alias → state (check before DB lookup so "mumbai" → Maharashtra)
    for city, state in sorted(CITY_TO_STATE.items(), key=lambda x: len(x[0]), reverse=True):
        if city in q:
            e["state"] = state
            return e

    # Exact match against DB state/district values (longest first)
    states    = sorted({r["State"]    for r in rows if r["State"]},    key=len, reverse=True)
    districts = sorted({r["District"] for r in rows if r["District"]}, key=len, reverse=True)

    for s in states:
        if s.lower() in q:
            e["state"] = s
            break
    for d in districts:
        if d.lower() in q:
            e["district"] = d
            break
    return e

def _filter_rows(rows, e):
    if e["pincode"]:  return [r for r in rows if str(r["PIN code"]) == e["pincode"]]
    if e["district"]: return [r for r in rows if r["District"] == e["district"]]
    if e["state"]:    return [r for r in rows if r["State"] == e["state"]]
    return rows

def _sum(data, col): return int(sum(r.get(col) or 0 for r in data))
def _pct(a, b): return round((a/b)*100, 2) if b else 0.0
def _scope(e): return e.get("district") or e.get("state") or e.get("pincode") or "dataset"

def _where(entities: dict) -> str:
    """Build a proper WHERE clause from extracted entities."""
    if entities["pincode"]:
        return f"WHERE pin_code = '{entities['pincode']}'"
    if entities["district"]:
        return f"WHERE district ILIKE '%{entities['district']}%'"
    if entities["state"]:
        return f"WHERE state ILIKE '%{entities['state']}%'"
    return ""

def _detect_dimensions(q):
    return {
        "group_by_state":    any(x in q for x in ["state wise","state-wise","statewise","by state","per state","each state"]),
        "group_by_district": any(x in q for x in ["district wise","district-wise","districtwise","by district","per district","each district"]),
        "female": any(x in q for x in ["female","women","woman"]),
        "male":   any(x in q for x in ["male","men","man"]),
        "age_18_25": any(x in q for x in ["18-25","18 to 25","18–25"]),
        "age_25_40": any(x in q for x in ["25-40","25 to 40","25–40"]),
        "age_40_60": any(x in q for x in ["40-60","40 to 60","40–60"]),
        "scheme": next((k for k in sorted(SCHEME_MAP, key=len, reverse=True) if k in q), None),
    }

def _is_grouped(dims):
    return (dims["group_by_state"] or dims["group_by_district"]) and any([
        dims["female"], dims["male"], dims["age_18_25"], dims["age_25_40"], dims["age_40_60"], dims["scheme"]
    ])

def _detect_intent(q):
    intents = {
        "total_workers":    ["how many workers","total number of workers","total workers","worker count"],
        "gender":           ["male and female","compare male","gender","male vs female"],
        "female_pct":       ["percentage of women","percentage women","women percent","female percent",
                             "what percentage","percentage of workers are women","% women","% female"],
        "age_dist":         ["age distribution","age group","age groups","age breakdown","age wise"],
        # age-specific — long phrases score higher than "how many workers"
        "age_40_60":        ["workers aged 40-60","aged 40-60","age between 40","40-60","40 to 60","40–60",
                             "workers aged 40 to 60","age 40 to 60"],
        "age_18_25":        ["workers aged 18-25","aged 18-25","age between 18","18-25","18 to 25","18–25",
                             "workers aged 18 to 25","age 18 to 25"],
        "age_25_40":        ["workers aged 25-40","aged 25-40","age between 25","25-40","25 to 40","25–40",
                             "workers aged 25 to 40","age 25 to 40"],
        "top_states":       ["top states","highest states","state wise","state-wise","by state","per state","each state"],
        "top_districts":    ["top districts","highest districts","district wise","district-wise","by district","per district","each district"],
        "top_female_dist":  ["highest number of female","most female workers","highest female workers",
                             "districts have the highest number of female","district with most female"],
        "top_female_state": ["highest number of female workers state","most female workers state","state with most female"],
        "highest_district": ["which district","highest district","most workers district"],
        "highest_state":    ["which state","highest state","most workers state"],
        "pin_stats":        ["pin code","pincode","pin statistics","statistics for pin"],
        "scheme":           list(SCHEME_MAP.keys()) + ["scheme","enrolled","enrollment","beneficiary"],
        "all_schemes":      ["all schemes","scheme wise","scheme-wise","compare schemes","scheme enrollment"],
        "list_states":      ["how many states","count of states","total states","list of states","unique states"],
        "list_districts":   ["how many districts","count of districts","total districts","list of districts","unique districts"],
        "sample":           ["show data","show records","sample data","list workers","show workers"],
    }
    scores = defaultdict(int)
    for intent, kws in intents.items():
        for kw in kws:
            if kw in q:
                scores[intent] += len(kw.split()) * 2  # weight by phrase length

    # Boost age intents when an age range is explicitly mentioned alongside "workers"
    if re.search(r"\b(18[-–]25|18 to 25)\b", q): scores["age_18_25"] += 10
    if re.search(r"\b(25[-–]40|25 to 40)\b", q): scores["age_25_40"] += 10
    if re.search(r"\b(40[-–]60|40 to 60)\b", q): scores["age_40_60"] += 10

    return max(scores, key=lambda k: scores[k]) if scores else "sample"

# ---------------------------------------------------------------------------
# Main query controller
# ---------------------------------------------------------------------------
def execute_query_controller(payload: dict):
    question_raw = str(payload.get("question", "")).strip()
    include_explanation = bool(payload.get("include_explanation", False))
    if not question_raw:
        raise HTTPException(status_code=400, detail="Question is required")

    start    = time.time()
    ai_error = None

    # Normalize question once — used by both AI and fallback paths
    q = question_raw.lower().replace("–", "-").replace("—", "-").replace("\u2013", "-").replace("\u2014", "-")

    # ── AI PATH ──────────────────────────────────────────────────────────────
    try:
        llm_resp  = _ai_generate_sql(q)  # pass normalized question
        sql_query = _extract_sql(llm_resp)
        if not sql_query:
            raise ValueError("AI returned no SQL block")
        ok, err = _validate_sql(sql_query)
        if not ok:
            raise ValueError(f"Validation: {err}")
        results  = _execute_sql(sql_query)
        response = _natural_response(results)
        execution_time = round(time.time() - start, 4)
        chat_query_history.insert(0, {"question": question_raw, "response": response,
            "sql_query": sql_query, "execution_time": execution_time,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")})
        chat_query_history[:] = chat_query_history[:50]
        return {"success": True, "natural_language_response": response,
                "sql_query": sql_query, "results": results,
                "execution_time": execution_time, "include_explanation": include_explanation}
    except Exception as exc:
        ai_error = str(exc)
        logger.warning(f"AI path failed: {ai_error} — using fallback")

    # ── FALLBACK: pattern matching ────────────────────────────────────────────
    # q already normalized above
    rows     = [_normalize(r) for r in fetch_worker_scheme_statistics(5000)]
    entities = _extract_entities(q, rows)
    data     = _filter_rows(rows, entities)
    scope    = _scope(entities)
    dims     = _detect_dimensions(q)
    intent   = _detect_intent(q)
    total    = _sum(data, "Total Worker")
    male     = _sum(data, "Male Worker")
    female   = _sum(data, "Female Worker")
    results  = []; response = ""; sql = ""
    T  = "public.worker_scheme_statistics"
    W  = _where(entities)
    WS = f" {W}" if W else ""  # space-prefixed for appending

    if _is_grouped(dims):
        gk  = "State" if dims["group_by_state"] else "District"
        agg = defaultdict(lambda: defaultdict(int))
        for r in data:
            g = r.get(gk) or "Unknown"
            agg[g]["female"] += r.get("Female Worker") or 0
            agg[g]["male"]   += r.get("Male Worker")   or 0
            agg[g]["total"]  += r.get("Total Worker")  or 0
            agg[g]["a1825"]  += r.get("Age 18-25")     or 0
            agg[g]["a2540"]  += r.get("Age 25-40")     or 0
            agg[g]["a4060"]  += r.get("Age 40-60")     or 0
            if dims["scheme"]: agg[g]["scheme"] += r.get(SCHEME_MAP[dims["scheme"]]) or 0
        sql_cols = [f'"{gk.lower()}" AS "{gk}"']
        for g in sorted(agg.keys()):
            row = {gk: g}
            if dims["female"]:
                row["Total Female Workers"] = agg[g]["female"]
                if 'SUM("female_worker") AS "Total Female Workers"' not in sql_cols:
                    sql_cols.append('SUM("female_worker") AS "Total Female Workers"')
            if dims["male"]:
                row["Total Male Workers"] = agg[g]["male"]
                if 'SUM("male_worker") AS "Total Male Workers"' not in sql_cols:
                    sql_cols.append('SUM("male_worker") AS "Total Male Workers"')
            if dims["age_18_25"]:
                row["Workers Aged 18-25"] = agg[g]["a1825"]
                if 'SUM("age_between_18_to_25") AS "Workers Aged 18-25"' not in sql_cols:
                    sql_cols.append('SUM("age_between_18_to_25") AS "Workers Aged 18-25"')
            if dims["age_25_40"]:
                row["Workers Aged 25-40"] = agg[g]["a2540"]
                if 'SUM("age_between_25_to_40") AS "Workers Aged 25-40"' not in sql_cols:
                    sql_cols.append('SUM("age_between_25_to_40") AS "Workers Aged 25-40"')
            if dims["age_40_60"]:
                row["Workers Aged 40-60"] = agg[g]["a4060"]
                if 'SUM("age_between_40_to_60") AS "Workers Aged 40-60"' not in sql_cols:
                    sql_cols.append('SUM("age_between_40_to_60") AS "Workers Aged 40-60"')
            if dims["scheme"]:
                lbl = f'Enrolled in {dims["scheme"].upper()}'
                row[lbl] = agg[g]["scheme"]
                sc = f'SUM("{SCHEME_MAP[dims["scheme"]]}") AS "{lbl}"'
                if sc not in sql_cols: sql_cols.append(sc)
            if not any([dims["female"],dims["male"],dims["age_18_25"],dims["age_25_40"],dims["age_40_60"],dims["scheme"]]):
                row["Total Workers"] = agg[g]["total"]
            results.append(row)
        nk = [k for k in (results[0] if results else {}) if k != gk]
        if nk: results.sort(key=lambda x: x.get(nk[0],0), reverse=True)
        sql = f'SELECT {", ".join(sql_cols)} FROM {T}{WS} GROUP BY "{gk.lower()}" ORDER BY 2 DESC LIMIT 100;'
        response = "Query executed successfully"

    elif intent == "total_workers":
        results = [{"total_workers": total}]
        response = f"Total number of workers in {scope} is {total:,}"
        sql = f"SELECT SUM(total_worker) AS total_workers FROM {T}{WS}"
    elif intent == "gender":
        results = [{"male_workers": male, "female_workers": female, "female_percent": _pct(female,total)}]
        response = f"In {scope} — Male: {male:,}, Female: {female:,} ({_pct(female,total)}%)"
        sql = f"SELECT SUM(male_worker) AS male_workers, SUM(female_worker) AS female_workers FROM {T}{WS}"
    elif intent == "female_pct":
        fp = _pct(female, total)
        results = [{"female_percent": fp, "female_workers": female, "total_workers": total}]
        response = f"Female workers in {scope} are {fp}% ({female:,} of {total:,})."
        sql = f"SELECT ROUND(SUM(female_worker)*100.0/NULLIF(SUM(total_worker),0),2) AS female_percent FROM {T}{WS}"
    elif intent in ("age_dist","age_18_25","age_25_40","age_40_60"):
        a1=_sum(data,"Age 18-25"); a2=_sum(data,"Age 25-40"); a3=_sum(data,"Age 40-60")
        if intent=="age_18_25":
            results=[{"age_18_25": a1}]
            response=f"Workers aged 18-25 in {scope}: {a1:,}"
            sql=f"SELECT SUM(age_between_18_to_25) AS age_18_25 FROM {T}{WS}"
        elif intent=="age_25_40":
            results=[{"age_25_40": a2}]
            response=f"Workers aged 25-40 in {scope}: {a2:,}"
            sql=f"SELECT SUM(age_between_25_to_40) AS age_25_40 FROM {T}{WS}"
        elif intent=="age_40_60":
            results=[{"age_40_60": a3}]
            response=f"Workers aged 40-60 in {scope}: {a3:,}"
            sql=f"SELECT SUM(age_between_40_to_60) AS age_40_60 FROM {T}{WS}"
        else:
            results=[{"age_18_25":a1,"age_25_40":a2,"age_40_60":a3}]
            response=f"Age distribution in {scope} — 18-25: {a1:,}, 25-40: {a2:,}, 40-60: {a3:,}"
            sql=f"SELECT SUM(age_between_18_to_25) AS age_18_25, SUM(age_between_25_to_40) AS age_25_40, SUM(age_between_40_to_60) AS age_40_60 FROM {T}{WS}"
    elif intent == "top_female_dist":
        dm = defaultdict(int)
        for r in data:
            if r["District"]: dm[r["District"]] += r["Female Worker"] or 0
        n = int(re.search(r"\btop\s+(\d+)\b",q).group(1)) if re.search(r"\btop\s+(\d+)\b",q) else 10
        results = [{"District":d,"female_workers":w} for d,w in sorted(dm.items(),key=lambda x:x[1],reverse=True)[:n]]
        response = f"Districts with highest female workers in {scope}."
        sql = f"SELECT district, SUM(female_worker) AS female_workers FROM {T}{WS} GROUP BY district ORDER BY female_workers DESC LIMIT {n}"
    elif intent == "top_female_state":
        sm = defaultdict(int)
        for r in data:
            if r["State"]: sm[r["State"]] += r["Female Worker"] or 0
        n = int(re.search(r"\btop\s+(\d+)\b",q).group(1)) if re.search(r"\btop\s+(\d+)\b",q) else 10
        results = [{"State":s,"female_workers":w} for s,w in sorted(sm.items(),key=lambda x:x[1],reverse=True)[:n]]
        response = "States with highest female workers."
        sql = f"SELECT state, SUM(female_worker) AS female_workers FROM {T}{WS} GROUP BY state ORDER BY female_workers DESC LIMIT {n}"
    elif intent == "top_states":
        sm = defaultdict(int)
        for r in data:
            if r["State"]: sm[r["State"]] += r["Total Worker"] or 0
        n = int(re.search(r"\btop\s+(\d+)\b",q).group(1)) if re.search(r"\btop\s+(\d+)\b",q) else 10
        results = [{"State":s,"total_workers":w} for s,w in sorted(sm.items(),key=lambda x:x[1],reverse=True)[:n]]
        response = f"Top {n} states by worker count."
        sql = f"SELECT state, SUM(total_worker) AS total_workers FROM {T}{WS} GROUP BY state ORDER BY total_workers DESC LIMIT {n}"
    elif intent == "top_districts":
        dm = defaultdict(int)
        for r in data:
            if r["District"]: dm[r["District"]] += r["Total Worker"] or 0
        n = int(re.search(r"\btop\s+(\d+)\b",q).group(1)) if re.search(r"\btop\s+(\d+)\b",q) else 10
        results = [{"District":d,"total_workers":w} for d,w in sorted(dm.items(),key=lambda x:x[1],reverse=True)[:n]]
        response = f"Top {n} districts by worker count in {scope}."
        sql = f"SELECT district, SUM(total_worker) AS total_workers FROM {T}{WS} GROUP BY district ORDER BY total_workers DESC LIMIT {n}"
    elif intent == "highest_district":
        dm = defaultdict(int)
        for r in data:
            if r["District"]: dm[r["District"]] += r["Total Worker"] or 0
        if dm:
            top = max(dm.items(), key=lambda x:x[1])
            results = [{"district":top[0],"total_workers":top[1]}]; response = f"Highest workers district in {scope}: {top[0]} ({top[1]:,})"
        else: results=[]; response="No district data."
        sql = f"SELECT district, SUM(total_worker) AS total_workers FROM {T}{WS} GROUP BY district ORDER BY total_workers DESC LIMIT 1"
    elif intent == "highest_state":
        sm = defaultdict(int)
        for r in data:
            if r["State"]: sm[r["State"]] += r["Total Worker"] or 0
        if sm:
            top = max(sm.items(), key=lambda x:x[1])
            results = [{"state":top[0],"total_workers":top[1]}]; response = f"State with highest workers: {top[0]} ({top[1]:,})"
        else: results=[]; response="No state data."
        sql = f"SELECT state, SUM(total_worker) AS total_workers FROM {T}{WS} GROUP BY state ORDER BY total_workers DESC LIMIT 1"
    elif intent == "pin_stats":
        pin = entities["pincode"]
        results = [{"pin_code":pin,"total_workers":total,"male_workers":male,"female_workers":female,
                    "age_18_25":_sum(data,"Age 18-25"),"age_25_40":_sum(data,"Age 25-40"),"age_40_60":_sum(data,"Age 40-60")}]
        response = f"Worker statistics for PIN code {pin}."
        sql = f"SELECT * FROM {T} WHERE pin_code = '{pin}'"
    elif intent == "all_schemes":
        seen=set(); sr=[]
        for k,col in SCHEME_MAP.items():
            if col not in seen: sr.append({"scheme":k.upper(),"enrolled":_sum(data,col)}); seen.add(col)
        results = sorted(sr, key=lambda x:x["enrolled"], reverse=True)
        response = f"Scheme-wise enrollment in {scope}."
        cols = ", ".join(f"SUM({col}) AS {col}" for col in dict.fromkeys(SCHEME_MAP.values()))
        sql = f"SELECT {cols} FROM {T}{WS}"
    elif intent == "scheme":
        matched = next((k for k in sorted(SCHEME_MAP,key=len,reverse=True) if k in q), None)
        if matched:
            col=SCHEME_MAP[matched]; val=_sum(data,col)
            results=[{"scheme":matched.upper(),"enrolled":val}]
            response=f"{val:,} workers enrolled in {matched.upper()} in {scope}."
            sql=f"SELECT SUM({col}) AS enrolled FROM {T}{WS}"
        else:
            seen=set(); sr=[]
            for k,col in SCHEME_MAP.items():
                if col not in seen: sr.append({"scheme":k.upper(),"enrolled":_sum(data,col)}); seen.add(col)
            results=sorted(sr,key=lambda x:x["enrolled"],reverse=True)
            response=f"Scheme enrollment in {scope}."
            sql=f"SELECT SUM(scheme_mgnrega) AS mgnrega, SUM(scheme_pmjay) AS pmjay FROM {T}{WS}"
    elif intent == "list_states":
        states=sorted({r["State"] for r in rows if r["State"]})
        results=[{"state_count":len(states),"states":states}]
        response=f"Total unique states: {len(states)}."
        sql=f"SELECT DISTINCT state FROM {T} ORDER BY state"
    elif intent == "list_districts":
        districts=sorted({r["District"] for r in data if r["District"]})
        results=[{"district_count":len(districts),"districts":districts}]
        response=f"Total unique districts in {scope}: {len(districts)}."
        sql=f"SELECT DISTINCT district FROM {T}{WS} ORDER BY district"
    else:
        results=data[:20]
        response=f"Showing sample worker data for {scope}."
        sql=f"SELECT * FROM {T}{WS} LIMIT 20"

    execution_time = round(time.time() - start, 4)
    chat_query_history.insert(0, {"question": question_raw, "response": response,
        "sql_query": sql, "execution_time": execution_time,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")})
    chat_query_history[:] = chat_query_history[:50]
    return {"success": True, "natural_language_response": response, "sql_query": sql,
            "results": results, "execution_time": execution_time,
            "include_explanation": include_explanation,
            **({"fallback_reason": ai_error} if ai_error else {})}


def get_query_history_controller():
    return {"success": True, "history": chat_query_history}


def upload_coverage_controller(file: UploadFile):
    import openpyxl
    content = file.file.read()
    wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
    ws = wb.active
    rows = list(ws.values)
    if not rows: return {"success": False, "data": [], "message": "Empty file"}
    headers = [str(h).strip() if h is not None else "" for h in rows[0]]
    data = [{headers[i]: rows[r][i] for i in range(len(headers))} for r in range(1, len(rows))]
    return {"success": True, "data": data}
