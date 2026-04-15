from fastapi import APIRouter, UploadFile, File

from app.controllers.home_controller import (
    get_about,
    get_index,
    check_worker_scheme_statistics_controller,
    get_coverage_data_controller,
    upload_coverage_controller,
    execute_query_controller,
    get_query_history_controller,
)
from app.models.message import MessageResponse

router = APIRouter()


@router.get("/", response_model=MessageResponse)
async def index():
    return get_index()


@router.get("/about", response_model=MessageResponse)
async def about():
    return get_about()


@router.get("/db/check-worker-scheme-statistics")
async def check_worker_scheme_statistics():
    return check_worker_scheme_statistics_controller()


@router.get("/api/coverage-data")
async def get_coverage_data(limit: int = 100000):
    return get_coverage_data_controller(limit)


@router.post("/api/upload-coverage")
async def upload_coverage(file: UploadFile = File(...)):
    return upload_coverage_controller(file)


@router.post("/api/query")
async def api_query(payload: dict):
    return execute_query_controller(payload)


@router.get("/api/query-history")
async def api_query_history():
    return get_query_history_controller()


