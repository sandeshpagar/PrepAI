from datetime import datetime, timezone
from typing import Any, Dict

class SettingsRepository:
    def __init__(self):
        self._settings: Dict[str, Dict[str, Any]] = {}

    def get_settings(self, user_id: str) -> Dict[str, Any]:
        if user_id not in self._settings:
            self._settings[user_id] = {
                "user_id": user_id,
                "target_study_hours": 4.0,
                "preferred_session_duration": 45,
                "exam_alert_lead_days": 7,
                "notify_upcoming_deadlines": True,
                "notify_session_reminders": True,
                "notify_document_indexing": True,
                "display_name": None,
                "university": None,
                "major": None,
                "updated_at": datetime.now(timezone.utc),
            }
        return self._settings[user_id]

    def update_settings(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        current = self.get_settings(user_id)
        clean_updates = {k: v for k, v in updates.items() if v is not None}
        current.update(clean_updates)
        current["updated_at"] = datetime.now(timezone.utc)
        return current

settings_repo = SettingsRepository()
