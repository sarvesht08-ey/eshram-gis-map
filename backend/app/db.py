import os

import psycopg2
from psycopg2.extras import RealDictCursor


def get_pg_connection():
    return psycopg2.connect(
        host=os.getenv("PG_HOST", "localhost"),
        port=int(os.getenv("PG_PORT", 5432)),
        dbname=os.getenv("PG_DATABASE", "nlp_db"),
        user=os.getenv("PG_USER", "postgres"),
        password=os.getenv("PG_PASSWORD", "root"),
    )


def check_table_exists(table_name: str, schema: str = "public") -> bool:
    sql = """
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = %s
        AND table_name = %s
    )
    """

    with get_pg_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, (schema, table_name))
            row = cur.fetchone()
            return bool(row["exists"]) if row else False


def _normalize_stat_row(raw_row: dict) -> dict:
    # Maintain the same field names as the original excel.worker.js mapping
    out = {}

    # State & location
    out['State'] = raw_row.get('STATE') or raw_row.get('state') or raw_row.get('State')
    out['District'] = raw_row.get('DISTRICT') or raw_row.get('district') or raw_row.get('District')
    out['Location Name'] = raw_row.get('Location Name') or raw_row.get('Location') or out['District']

    # Pincode
    out['PIN code'] = (
        raw_row.get('PIN code')
        or raw_row.get('PIN_CODE')
        or raw_row.get('pin_code')
        or raw_row.get('pincode')
        or raw_row.get('PIN Code')
    )

    # Coverage status
    out['Coverage Status'] = (
        raw_row.get('COVERAGE_PERCENT')
        or raw_row.get('coverage_percent')
        or raw_row.get('Coverage Status')
        or raw_row.get('Coverage (%)')
    )

    # Coordinates
    out['Latitude'] = raw_row.get('LATITUDE') or raw_row.get('latitude') or raw_row.get('Latitude')
    out['Longitude'] = raw_row.get('LONGITUDE') or raw_row.get('longitude') or raw_row.get('Longitude')

    # Network / tech
    out['TSP'] = raw_row.get('TSP') or raw_row.get('tsp')
    out['Technology'] = raw_row.get('TECHNOLOGY') or raw_row.get('technology') or raw_row.get('Technology')

    # Worker counts
    out['Total Worker'] = (
        raw_row.get('TOTAL_WORKER')
        or raw_row.get('total_worker')
        or raw_row.get('Total Worker')
    )
    out['Male Worker'] = (
        raw_row.get('MALE_WORKER')
        or raw_row.get('male_worker')
        or raw_row.get('Male Worker')
    )
    out['Female Worker'] = (
        raw_row.get('FEMALE_WORKER')
        or raw_row.get('female_worker')
        or raw_row.get('Female Worker')
    )

    # Age ranges
    out['Age 18-25'] = (
        raw_row.get('AGE_BETWEEN_18_TO_25')
        or raw_row.get('age_between_18_to_25')
        or raw_row.get('Age 18-25')
    )
    out['Age 25-40'] = (
        raw_row.get('AGE_BETWEEN_25_TO_40')
        or raw_row.get('age_between_25_to_40')
        or raw_row.get('Age 25-40')
    )
    out['Age 40-60'] = (
        raw_row.get('AGE_BETWEEN_40_TO_60')
        or raw_row.get('age_between_40_to_60')
        or raw_row.get('Age 40-60')
    )

    # Keep raw values too for completeness
    for key, value in raw_row.items():
        if key not in out:
            out[key] = value

    return out


def fetch_worker_scheme_statistics(limit: int = 10000):
    sql = """
    SELECT *
    FROM public.worker_scheme_statistics
    LIMIT %s
    """

    with get_pg_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, (limit,))
            rows = cur.fetchall()
            return [_normalize_stat_row(r) for r in rows]

