from datetime import datetime, time, timedelta, timezone
from app.services.planner.priority import calculate_priority_score
from app.services.planner.scheduler import generate_study_plan


def test_priority_score_urgency_ordering():
    now = datetime(2026, 10, 20, 10, 0, tzinfo=timezone.utc)
    due_today = now + timedelta(hours=4)
    due_in_3_days = now + timedelta(days=3)
    overdue = now - timedelta(hours=2)

    score_overdue, _ = calculate_priority_score(overdue, importance=3, difficulty=3, reference_time=now)
    score_today, _ = calculate_priority_score(due_today, importance=3, difficulty=3, reference_time=now)
    score_later, _ = calculate_priority_score(due_in_3_days, importance=3, difficulty=3, reference_time=now)

    assert score_overdue > score_today > score_later


def test_priority_score_importance_difficulty():
    now = datetime(2026, 10, 20, 10, 0, tzinfo=timezone.utc)
    due = now + timedelta(days=2)

    score_high_imp, _ = calculate_priority_score(due, importance=5, difficulty=2, reference_time=now)
    score_low_imp, _ = calculate_priority_score(due, importance=1, difficulty=2, reference_time=now)

    assert score_high_imp > score_low_imp


def test_scheduler_fits_within_availability():
    now = datetime(2026, 10, 20, 8, 0, tzinfo=timezone.utc)  # Tuesday morning
    availability = [
        {"day_of_week": now.weekday(), "start_time": time(9, 0), "end_time": time(12, 0), "is_active": True}
    ]
    tasks = [
        {
            "id": "t1",
            "title": "Task 1",
            "due_date": now + timedelta(days=1),
            "priority": "high",
            "estimated_duration_minutes": 45,
            "status": "todo",
        },
        {
            "id": "t2",
            "title": "Task 2",
            "due_date": now + timedelta(days=1),
            "priority": "medium",
            "estimated_duration_minutes": 45,
            "status": "todo",
        },
    ]

    plan = generate_study_plan(
        availability_rules=availability,
        tasks=tasks,
        topics=[],
        existing_sessions=[],
        horizon_days=1,
        session_duration_minutes=45,
        break_duration_minutes=15,
        reference_time=now,
    )

    assert len(plan.planned_sessions) == 2
    assert plan.planned_sessions[0].title == "Task 1"
    assert plan.planned_sessions[1].title == "Task 2"
    assert plan.planned_sessions[0].start_time >= now


def test_scheduler_handles_impossible_schedule_and_reports_unscheduled():
    now = datetime(2026, 10, 20, 8, 0, tzinfo=timezone.utc)
    # Only 1 slot available (9:00 - 9:45)
    availability = [
        {"day_of_week": now.weekday(), "start_time": time(9, 0), "end_time": time(9, 45), "is_active": True}
    ]
    # But 3 tasks are queued
    tasks = [
        {"id": f"t{i}", "title": f"Task {i}", "due_date": None, "priority": "medium", "status": "todo"}
        for i in range(1, 4)
    ]

    plan = generate_study_plan(
        availability_rules=availability,
        tasks=tasks,
        topics=[],
        existing_sessions=[],
        horizon_days=1,
        session_duration_minutes=45,
        break_duration_minutes=15,
        reference_time=now,
    )

    assert len(plan.planned_sessions) == 1
    assert len(plan.unscheduled_items) == 2
    assert "Exceeded declared availability capacity" in plan.unscheduled_items[0].reason


def test_scheduler_preserves_completed_sessions():
    now = datetime(2026, 10, 20, 8, 0, tzinfo=timezone.utc)
    completed_session = {
        "id": "comp-1",
        "title": "Finished Math",
        "start_time": datetime(2026, 10, 20, 9, 0, tzinfo=timezone.utc),
        "end_time": datetime(2026, 10, 20, 9, 45, tzinfo=timezone.utc),
        "duration_minutes": 45,
        "status": "completed",
    }
    availability = [
        {"day_of_week": now.weekday(), "start_time": time(9, 0), "end_time": time(11, 0), "is_active": True}
    ]
    tasks = [
        {"id": "t1", "title": "New Task", "due_date": None, "priority": "high", "status": "todo"}
    ]

    plan = generate_study_plan(
        availability_rules=availability,
        tasks=tasks,
        topics=[],
        existing_sessions=[completed_session],
        horizon_days=1,
        session_duration_minutes=45,
        break_duration_minutes=15,
        reference_time=now,
    )

    # First slot was occupied by completed session, so new task is placed in subsequent slot (10:00 - 10:45)
    assert len(plan.planned_sessions) == 1
    assert plan.planned_sessions[0].start_time == datetime(2026, 10, 20, 10, 0, tzinfo=timezone.utc)
