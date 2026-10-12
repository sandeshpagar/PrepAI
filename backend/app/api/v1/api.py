from fastapi import APIRouter
from app.api.routes import (
    health,
    auth,
    subjects,
    tasks,
    assessments,
    availability,
    sessions,
    planner,
    calendar,
    dashboard,
    documents,
    chat,
    analytics,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(subjects.router)
api_router.include_router(tasks.router)
api_router.include_router(assessments.router)
api_router.include_router(availability.router)
api_router.include_router(sessions.router)
api_router.include_router(planner.router)
api_router.include_router(calendar.router)
api_router.include_router(dashboard.router)
api_router.include_router(documents.router)
api_router.include_router(chat.router)
api_router.include_router(analytics.router)

