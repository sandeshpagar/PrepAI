from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.v1.api import api_router
from app.api.routes.health import health_check

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="PrepAI — AI-Powered Study Planner & Academic RAG Assistant Backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Set up CORS
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Root health check
app.add_api_route("/health", health_check, methods=["GET"], tags=["Health"])

# Include versioned API router
app.include_router(api_router, prefix=settings.API_V1_STR)


import logging
from fastapi.exceptions import RequestValidationError
from fastapi.exception_handlers import http_exception_handler, request_validation_exception_handler

logger = logging.getLogger(__name__)

@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return await http_exception_handler(request, exc)


@app.exception_handler(RequestValidationError)
async def custom_validation_exception_handler(request: Request, exc: RequestValidationError):
    return await request_validation_exception_handler(request, exc)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server exception: %s", exc)
    detail = str(exc) if settings.ENVIRONMENT != "production" else "An internal server error occurred"
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": detail},
    )

