from datetime import datetime, timezone
import uuid
from typing import Any, Dict, List, Optional


class PlannerRepository:
    """
    User-scoped repository for Study Planner entities.
    Enforces strict user isolation: User A cannot read or modify User B's data.
    """

    def __init__(self):
        self.subjects: Dict[str, Dict[str, Any]] = {}
        self.topics: Dict[str, Dict[str, Any]] = {}
        self.tasks: Dict[str, Dict[str, Any]] = {}
        self.assessments: Dict[str, Dict[str, Any]] = {}
        self.availability: Dict[str, Dict[str, Any]] = {}
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def _now(self) -> datetime:
        return datetime.now(timezone.utc)

    # -------------------------------------------------------------------------
    # Subjects
    # -------------------------------------------------------------------------
    def get_subjects(self, user_id: str) -> List[Dict[str, Any]]:
        user_subjects = [s for s in self.subjects.values() if s["user_id"] == user_id]
        for s in user_subjects:
            s["topics"] = [t for t in self.topics.values() if t["subject_id"] == s["id"] and t["user_id"] == user_id]
        return user_subjects

    def get_subject(self, user_id: str, subject_id: str) -> Optional[Dict[str, Any]]:
        subj = self.subjects.get(subject_id)
        if subj and subj["user_id"] == user_id:
            subj_copy = dict(subj)
            subj_copy["topics"] = [t for t in self.topics.values() if t["subject_id"] == subject_id and t["user_id"] == user_id]
            return subj_copy
        return None

    def create_subject(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        item_id = str(uuid.uuid4())
        record = {
            "id": item_id,
            "user_id": user_id,
            "created_at": self._now(),
            "updated_at": self._now(),
            **data,
        }
        self.subjects[item_id] = record
        res = dict(record)
        res["topics"] = []
        return res

    def update_subject(self, user_id: str, subject_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        record = self.subjects.get(subject_id)
        if not record or record["user_id"] != user_id:
            return None
        clean_data = {k: v for k, v in data.items() if v is not None}
        record.update(clean_data)
        record["updated_at"] = self._now()
        res = dict(record)
        res["topics"] = [t for t in self.topics.values() if t["subject_id"] == subject_id and t["user_id"] == user_id]
        return res

    def delete_subject(self, user_id: str, subject_id: str) -> bool:
        record = self.subjects.get(subject_id)
        if not record or record["user_id"] != user_id:
            return False
        del self.subjects[subject_id]
        # Cascade delete topics
        topic_ids_to_del = [tid for tid, t in self.topics.items() if t["subject_id"] == subject_id]
        for tid in topic_ids_to_del:
            del self.topics[tid]
        return True

    # -------------------------------------------------------------------------
    # Syllabus Topics
    # -------------------------------------------------------------------------
    def create_topic(self, user_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        subj = self.subjects.get(data["subject_id"])
        if not subj or subj["user_id"] != user_id:
            return None
        item_id = str(uuid.uuid4())
        record = {
            "id": item_id,
            "user_id": user_id,
            "created_at": self._now(),
            "updated_at": self._now(),
            **data,
        }
        self.topics[item_id] = record
        return record

    def update_topic(self, user_id: str, topic_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        record = self.topics.get(topic_id)
        if not record or record["user_id"] != user_id:
            return None
        clean_data = {k: v for k, v in data.items() if v is not None}
        record.update(clean_data)
        record["updated_at"] = self._now()
        return record

    def delete_topic(self, user_id: str, topic_id: str) -> bool:
        record = self.topics.get(topic_id)
        if not record or record["user_id"] != user_id:
            return False
        del self.topics[topic_id]
        return True

    # -------------------------------------------------------------------------
    # Tasks
    # -------------------------------------------------------------------------
    def get_tasks(self, user_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        tasks = [t for t in self.tasks.values() if t["user_id"] == user_id]
        if status:
            tasks = [t for t in tasks if t["status"] == status]
        return sorted(tasks, key=lambda x: (x["due_date"] is None, x["due_date"]))

    def get_task(self, user_id: str, task_id: str) -> Optional[Dict[str, Any]]:
        task = self.tasks.get(task_id)
        if task and task["user_id"] == user_id:
            return task
        return None

    def create_task(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        item_id = str(uuid.uuid4())
        record = {
            "id": item_id,
            "user_id": user_id,
            "created_at": self._now(),
            "updated_at": self._now(),
            **data,
        }
        self.tasks[item_id] = record
        return record

    def update_task(self, user_id: str, task_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        record = self.tasks.get(task_id)
        if not record or record["user_id"] != user_id:
            return None
        clean_data = {k: v for k, v in data.items() if v is not None}
        record.update(clean_data)
        record["updated_at"] = self._now()
        return record

    def delete_task(self, user_id: str, task_id: str) -> bool:
        record = self.tasks.get(task_id)
        if not record or record["user_id"] != user_id:
            return False
        del self.tasks[task_id]
        return True

    # -------------------------------------------------------------------------
    # Assessments
    # -------------------------------------------------------------------------
    def get_assessments(self, user_id: str) -> List[Dict[str, Any]]:
        items = [a for a in self.assessments.values() if a["user_id"] == user_id]
        return sorted(items, key=lambda x: x["assessment_date"])

    def create_assessment(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        item_id = str(uuid.uuid4())
        record = {
            "id": item_id,
            "user_id": user_id,
            "created_at": self._now(),
            "updated_at": self._now(),
            **data,
        }
        self.assessments[item_id] = record
        return record

    def delete_assessment(self, user_id: str, assessment_id: str) -> bool:
        record = self.assessments.get(assessment_id)
        if not record or record["user_id"] != user_id:
            return False
        del self.assessments[assessment_id]
        return True

    # -------------------------------------------------------------------------
    # Availability Rules
    # -------------------------------------------------------------------------
    def get_availability(self, user_id: str) -> List[Dict[str, Any]]:
        rules = [r for r in self.availability.values() if r["user_id"] == user_id and r["is_active"]]
        return sorted(rules, key=lambda x: x["day_of_week"])

    def set_availability(self, user_id: str, rules_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        # Remove existing active rules for this user
        existing_ids = [k for k, v in self.availability.items() if v["user_id"] == user_id]
        for k in existing_ids:
            del self.availability[k]

        created = []
        for r in rules_data:
            item_id = str(uuid.uuid4())
            record = {
                "id": item_id,
                "user_id": user_id,
                "created_at": self._now(),
                "updated_at": self._now(),
                **r,
            }
            self.availability[item_id] = record
            created.append(record)
        return created

    # -------------------------------------------------------------------------
    # Study Sessions
    # -------------------------------------------------------------------------
    def get_sessions(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Dict[str, Any]]:
        sessions = [s for s in self.sessions.values() if s["user_id"] == user_id]
        if start_date:
            sessions = [s for s in sessions if s["end_time"] >= start_date]
        if end_date:
            sessions = [s for s in sessions if s["start_time"] <= end_date]
        return sorted(sessions, key=lambda x: x["start_time"])

    def create_session(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        item_id = str(uuid.uuid4())
        record = {
            "id": item_id,
            "user_id": user_id,
            "created_at": self._now(),
            "updated_at": self._now(),
            **data,
        }
        self.sessions[item_id] = record
        return record

    def update_session(self, user_id: str, session_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        record = self.sessions.get(session_id)
        if not record or record["user_id"] != user_id:
            return None
        clean_data = {k: v for k, v in data.items() if v is not None}
        record.update(clean_data)
        record["updated_at"] = self._now()
        return record

    def delete_session(self, user_id: str, session_id: str) -> bool:
        record = self.sessions.get(session_id)
        if not record or record["user_id"] != user_id:
            return False
        del self.sessions[session_id]
        return True

    def clear_planned_sessions(self, user_id: str, from_time: datetime) -> int:
        """Removes future 'planned' sessions for replanning, leaving completed/in_progress untouched."""
        to_del = [
            sid for sid, s in self.sessions.items()
            if s["user_id"] == user_id and s["status"] == "planned" and s["start_time"] >= from_time
        ]
        for sid in to_del:
            del self.sessions[sid]
        return len(to_del)


planner_repo = PlannerRepository()
