import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from app.repositories.planner_repo import planner_repo
from app.repositories.document_repo import document_repo
from app.repositories.settings_repo import settings_repo

class NotificationRepository:
    def __init__(self):
        self._notifications: Dict[str, Dict[str, Any]] = {}

    def _now(self) -> datetime:
        return datetime.now(timezone.utc)

    def _to_utc_dt(self, val: Any) -> datetime:
        if isinstance(val, str):
            dt = datetime.fromisoformat(val)
        elif isinstance(val, datetime):
            dt = val
        elif isinstance(val, date):
            dt = datetime(val.year, val.month, val.day, tzinfo=timezone.utc)
        else:
            return self._now()
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    def sync_notifications(self, user_id: str):
        settings = settings_repo.get_settings(user_id)
        now = self._now()
        today = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

        # 1. Upcoming exams
        if settings.get("notify_upcoming_deadlines", True):
            lead_days = settings.get("exam_alert_lead_days", 7)
            assessments = planner_repo.get_assessments(user_id)
            for a in assessments:
                a_date = self._to_utc_dt(a["assessment_date"])
                if today <= a_date <= today + timedelta(days=lead_days):
                    days_left = max(0, (a_date.date() - today.date()).days)
                    dedupe_key = f"exam_{a['id']}_{a_date.strftime('%Y-%m-%d')}"
                    self._create_if_not_exists(
                        user_id=user_id,
                        dedupe_key=dedupe_key,
                        notif_type="exam_alert",
                        title=f"Upcoming Exam: {a['title']}",
                        message=f"Scheduled in {days_left} days ({a_date.strftime('%b %d')}).",
                        link_url="/calendar",
                    )

        # 2. Upcoming tasks
        if settings.get("notify_upcoming_deadlines", True):
            tasks = planner_repo.get_tasks(user_id)
            for t in tasks:
                if t.get("status") != "completed" and t.get("due_date"):
                    due_date = self._to_utc_dt(t["due_date"])
                    if today <= due_date <= today + timedelta(days=2):
                        dedupe_key = f"task_{t['id']}_{due_date.strftime('%Y-%m-%d')}"
                        self._create_if_not_exists(
                            user_id=user_id,
                            dedupe_key=dedupe_key,
                            notif_type="task_deadline",
                            title=f"Task Due Soon: {t['title']}",
                            message=f"Due on {due_date.strftime('%b %d')}. Priority: {t.get('priority', 'medium').capitalize()}.",
                            link_url="/tasks",
                        )

        # 3. Documents indexed
        if settings.get("notify_document_indexing", True):
            docs = document_repo.get_documents(user_id)
            for d in docs:
                if d.get("status") == "indexed":
                    dedupe_key = f"doc_{d['id']}_indexed"
                    self._create_if_not_exists(
                        user_id=user_id,
                        dedupe_key=dedupe_key,
                        notif_type="document_indexed",
                        title=f"Document Indexed: {d.get('title') or d.get('original_filename', 'Document')}",
                        message=f"Indexed successfully into {d.get('chunk_count', 0)} chunks for AI assistant.",
                        link_url="/documents",
                    )

    def _create_if_not_exists(
        self,
        user_id: str,
        dedupe_key: str,
        notif_type: str,
        title: str,
        message: str,
        link_url: Optional[str] = None,
    ):
        for n in self._notifications.values():
            if n["user_id"] == user_id and n["dedupe_key"] == dedupe_key:
                return
        notif_id = str(uuid.uuid4())
        self._notifications[notif_id] = {
            "id": notif_id,
            "user_id": user_id,
            "type": notif_type,
            "title": title,
            "message": message,
            "link_url": link_url,
            "is_read": False,
            "dedupe_key": dedupe_key,
            "created_at": self._now(),
        }

    def get_notifications(self, user_id: str) -> List[Dict[str, Any]]:
        self.sync_notifications(user_id)
        user_notifs = [n for n in self._notifications.values() if n["user_id"] == user_id]
        return sorted(user_notifs, key=lambda x: x["created_at"], reverse=True)

    def mark_read(self, user_id: str, notification_id: str) -> Optional[Dict[str, Any]]:
        notif = self._notifications.get(notification_id)
        if not notif or notif["user_id"] != user_id:
            return None
        notif["is_read"] = True
        return notif

    def mark_all_read(self, user_id: str) -> int:
        count = 0
        for n in self._notifications.values():
            if n["user_id"] == user_id and not n["is_read"]:
                n["is_read"] = True
                count += 1
        return count

notification_repo = NotificationRepository()
