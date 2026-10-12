from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List
from app.repositories.planner_repo import planner_repo
from app.repositories.document_repo import document_repo

class AnalyticsService:
    def _to_utc_dt(self, val: Any) -> datetime:
        if isinstance(val, str):
            dt = datetime.fromisoformat(val)
        elif isinstance(val, datetime):
            dt = val
        else:
            return datetime.now(timezone.utc)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    def calculate_streak(self, user_id: str) -> Dict[str, int]:
        sessions = planner_repo.get_sessions(user_id)
        completed_sessions = [s for s in sessions if s.get("status") == "completed"]
        if not completed_sessions:
            return {"current_streak_days": 0, "longest_streak_days": 0}

        active_dates = {
            self._to_utc_dt(s["start_time"]).date()
            for s in completed_sessions if s.get("start_time")
        }

        today = datetime.now(timezone.utc).date()
        yesterday = today - timedelta(days=1)

        current_streak = 0
        check_date = today if today in active_dates else (yesterday if yesterday in active_dates else None)

        if check_date:
            while check_date in active_dates:
                current_streak += 1
                check_date -= timedelta(days=1)

        sorted_dates = sorted(active_dates)
        longest_streak = 0
        temp_streak = 0
        prev_date = None

        for d in sorted_dates:
            if prev_date is None or d == prev_date + timedelta(days=1):
                temp_streak += 1
            else:
                temp_streak = 1
            longest_streak = max(longest_streak, temp_streak)
            prev_date = d

        return {
            "current_streak_days": current_streak,
            "longest_streak_days": max(longest_streak, current_streak),
        }

    def get_recent_activity(self, user_id: str, limit: int = 8) -> List[Dict[str, Any]]:
        activities: List[Dict[str, Any]] = []

        # 1. Sessions completed or planned
        for s in planner_repo.get_sessions(user_id):
            if s.get("status") == "completed":
                ts = self._to_utc_dt(s.get("updated_at") or s.get("created_at") or s.get("start_time"))
                activities.append({
                    "id": f"act_session_{s['id']}",
                    "event_type": "session_completed",
                    "title": f"Completed study session: {s.get('title', 'Study block')}",
                    "description": f"Studied for {s.get('duration_minutes', 0)} mins",
                    "timestamp": ts,
                    "link_url": "/planner",
                })

        # 2. Tasks completed
        for t in planner_repo.get_tasks(user_id):
            if t.get("status") == "completed":
                ts = self._to_utc_dt(t.get("updated_at") or t.get("created_at"))
                activities.append({
                    "id": f"act_task_{t['id']}",
                    "event_type": "task_completed",
                    "title": f"Completed task: {t.get('title', 'Task')}",
                    "description": f"Priority: {t.get('priority', 'medium').capitalize()}",
                    "timestamp": ts,
                    "link_url": "/tasks",
                })

        # 3. Documents indexed
        for d in document_repo.get_documents(user_id):
            if d.get("status") == "indexed":
                ts = self._to_utc_dt(d.get("updated_at") or d.get("created_at"))
                activities.append({
                    "id": f"act_doc_{d['id']}",
                    "event_type": "document_indexed",
                    "title": f"Indexed document: {d.get('title') or d.get('original_filename', 'Document')}",
                    "description": f"{d.get('chunk_count', 0)} chunks ready for RAG assistant",
                    "timestamp": ts,
                    "link_url": "/documents",
                })

        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        return activities[:limit]

    def calculate_overview(self, user_id: str, timeframe: str = "week") -> Dict[str, Any]:
        num_days = 30 if timeframe == "month" else 7
        now = datetime.now(timezone.utc)
        today = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
        start_date = today - timedelta(days=num_days - 1)
        end_date = today + timedelta(days=1)

        sessions = planner_repo.get_sessions(user_id)
        period_sessions = [
            s for s in sessions if start_date <= self._to_utc_dt(s["start_time"]) < end_date
        ]

        daily_trend = []
        for i in range(num_days):
            day_cursor = start_date + timedelta(days=i)
            next_cursor = day_cursor + timedelta(days=1)
            day_sessions = [
                s for s in period_sessions
                if day_cursor <= self._to_utc_dt(s["start_time"]) < next_cursor
            ]
            planned_mins = sum(s.get("duration_minutes", 0) for s in day_sessions if s.get("status") == "planned")
            completed_mins = sum(s.get("duration_minutes", 0) for s in day_sessions if s.get("status") == "completed")

            daily_trend.append({
                "date": day_cursor.strftime("%Y-%m-%d"),
                "day_name": day_cursor.strftime("%a"),
                "planned_minutes": planned_mins,
                "completed_minutes": completed_mins,
            })

        total_planned = sum(d["planned_minutes"] for d in daily_trend)
        total_completed = sum(d["completed_minutes"] for d in daily_trend)
        total_tracked = total_planned + total_completed
        completion_pct = int((total_completed / total_tracked) * 100) if total_tracked > 0 else 0

        # Subject Metrics
        subjects_data = planner_repo.get_subjects(user_id)
        subject_metrics = []
        for s in subjects_data:
            top_list = s.get("topics", [])
            total_top = len(top_list)
            done_top = len([t for t in top_list if t.get("status") == "completed"])
            pct = int((done_top / total_top) * 100) if total_top > 0 else 0

            subj_sessions = [sess for sess in period_sessions if sess.get("subject_id") == s["id"]]
            c_mins = sum(sess.get("duration_minutes", 0) for sess in subj_sessions if sess.get("status") == "completed")
            p_mins = sum(sess.get("duration_minutes", 0) for sess in subj_sessions if sess.get("status") == "planned")

            subject_metrics.append({
                "id": s["id"],
                "title": s["title"],
                "code": s.get("code"),
                "color": s.get("color", "#43E58B"),
                "completed_minutes": c_mins,
                "planned_minutes": p_mins,
                "total_modules": total_top,
                "completed_modules": done_top,
                "percentage": pct,
            })

        # Task Metrics
        tasks = planner_repo.get_tasks(user_id)
        completed_tasks = len([t for t in tasks if t.get("status") == "completed"])
        in_progress_tasks = len([t for t in tasks if t.get("status") == "in_progress"])
        overdue_tasks = len([
            t for t in tasks
            if t.get("status") != "completed" and t.get("due_date") and self._to_utc_dt(t["due_date"]) < today
        ])
        task_completion_pct = int((completed_tasks / len(tasks)) * 100) if tasks else 0

        # Session Metrics
        session_metrics = {
            "total": len(period_sessions),
            "completed": len([s for s in period_sessions if s.get("status") == "completed"]),
            "planned": len([s for s in period_sessions if s.get("status") == "planned"]),
            "total_duration_minutes": sum(s.get("duration_minutes", 0) for s in period_sessions),
        }

        # Consistency
        streaks = self.calculate_streak(user_id)
        active_days = len({
            d["date"] for d in daily_trend if d["completed_minutes"] > 0
        })

        return {
            "timeframe": timeframe,
            "total_planned_minutes": total_planned,
            "total_completed_minutes": total_completed,
            "completion_rate_pct": completion_pct,
            "daily_trend": daily_trend,
            "subjects": subject_metrics,
            "tasks": {
                "total": len(tasks),
                "completed": completed_tasks,
                "in_progress": in_progress_tasks,
                "overdue": overdue_tasks,
                "completion_rate_pct": task_completion_pct,
            },
            "sessions": session_metrics,
            "consistency": {
                "current_streak_days": streaks["current_streak_days"],
                "longest_streak_days": streaks["longest_streak_days"],
                "active_days_count": active_days,
            },
            "recent_activity": self.get_recent_activity(user_id),
        }

analytics_service = AnalyticsService()
