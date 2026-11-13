from fastapi import APIRouter, File, Form, Header, UploadFile
from fastapi.responses import FileResponse

from pdf_tools_api.api.deps import get_job_service
from pdf_tools_api.schemas.jobs import JobCreateResponse, JobDetailResponse, job_to_response
from pdf_tools_api.storage.paths import validate_job_id

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("", response_model=JobCreateResponse, status_code=201)
async def create_job(
    converter_id: str = Form(...),
    files: list[UploadFile] = File(...),
    settings: str | None = Form(default=None),
) -> JobCreateResponse:
    service = get_job_service()
    parsed_settings = service.parse_settings_json(settings)
    record, token = await service.create_job_async(converter_id, files, parsed_settings)
    response = job_to_response(record, include_token=token)
    assert isinstance(response, JobCreateResponse)
    return response


@router.get("/{job_id}", response_model=JobDetailResponse)
def get_job(
    job_id: str,
    access_token: str | None = Header(default=None, alias="X-Job-Access-Token"),
) -> JobDetailResponse:
    job_id = validate_job_id(job_id)
    record = get_job_service().get_job_for_client(job_id, access_token or "")
    response = job_to_response(record)
    assert isinstance(response, JobDetailResponse)
    return response


@router.get("/{job_id}/download")
def download_job_output(
    job_id: str,
    access_token: str | None = Header(default=None, alias="X-Job-Access-Token"),
) -> FileResponse:
    job_id = validate_job_id(job_id)
    path, download_name = get_job_service().resolve_download(job_id, access_token or "")
    return FileResponse(
        path,
        filename=download_name,
        media_type="application/octet-stream",
    )
