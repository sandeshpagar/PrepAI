from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from app.schemas.planner import PlanPreviewResponse, StudySessionBase, UnscheduledItem
from app.services.planner.priority import calculate_priority_score


def generate_study_plan(
    availability_rules: List[Dict[str, Any]],
    tasks: List[Dict[str, Any]],
    topics: List[Dict[str, Any]],
    existing_sessions: List[Dict[str, Any]],
    horizon_days: int = 7,
    session_duration_minutes: int = 45,
    break_duration_minutes: int = 15,
    reference_time: Optional[datetime] = None,
) -> PlanPreviewResponse:
    """
    Deterministic greedy study scheduler with deadline & availability constraints.
    Preserves completed sessions and reports unscheduled items with explicit reasons.
    """
    if reference_time is None:
        reference_time = datetime.now(timezone.utc)

    # 1. Build discrete candidate time slots from availability rules
    # Map rule by day of week (0=Monday ... 6=Sunday)
    rules_by_day = {r["day_of_week"]: r for r in availability_rules if r.get("is_active", True)}
    
    # Default fallback: Mon-Fri 09:00 - 17:00 if user has no rules declared
    default_start_hour = 9
    default_end_hour = 17

    available_slots: List[tuple[datetime, datetime]] = []
    current_date = reference_time.date()

    slot_step = timedelta(minutes=session_duration_minutes + break_duration_minutes)
    session_delta = timedelta(minutes=session_duration_minutes)

    for day_offset in range(horizon_days):
        day_date = current_date + timedelta(days=day_offset)
        dow = day_date.weekday()

        rule = rules_by_day.get(dow)
        if rule:
            start_dt = datetime.combine(day_date, rule["start_time"], tzinfo=timezone.utc)
            end_dt = datetime.combine(day_date, rule["end_time"], tzinfo=timezone.utc)
        elif not rules_by_day and dow < 5:  # default weekdays
            start_dt = datetime(day_date.year, day_date.month, day_date.day, default_start_hour, 0, tzinfo=timezone.utc)
            end_dt = datetime(day_date.year, day_date.month, day_date.day, default_end_hour, 0, tzinfo=timezone.utc)
        else:
            continue

        # Generate slots within this day's availability window
        slot_start = start_dt
        while slot_start + session_delta <= end_dt:
            slot_end = slot_start + session_delta
            # Only consider future slots
            if slot_start >= reference_time:
                # Check for overlap with existing completed/in_progress sessions
                overlap = False
                for s in existing_sessions:
                    if s.get("status") in ("completed", "in_progress"):
                        s_start = s["start_time"]
                        s_end = s["end_time"]
                        if not (slot_end <= s_start or slot_start >= s_end):
                            overlap = True
                            break
                if not overlap:
                    available_slots.append((slot_start, slot_end))
            slot_start += slot_step

    # 2. Collect candidate incomplete work units
    candidate_items: List[Dict[str, Any]] = []

    # Tasks (category 'assignment', 'revision', etc.)
    for task in tasks:
        if task.get("status") != "completed":
            score, reasoning = calculate_priority_score(
                due_date=task.get("due_date"),
                importance=4 if task.get("priority") in ("urgent", "high") else 3,
                difficulty=3,
                reference_time=reference_time,
            )
            candidate_items.append({
                "type": "task",
                "id": task["id"],
                "title": task["title"],
                "subject_id": task.get("subject_id"),
                "topic_id": task.get("topic_id"),
                "task_id": task["id"],
                "due_date": task.get("due_date"),
                "priority_score": score,
                "reasoning": reasoning,
                "duration_minutes": task.get("estimated_duration_minutes", session_duration_minutes),
                "session_type": "practice" if task.get("category") == "practice" else "study",
            })

    # Syllabus topics
    for topic in topics:
        if topic.get("status") != "completed":
            score, reasoning = calculate_priority_score(
                due_date=None,
                importance=topic.get("importance", 3),
                difficulty=topic.get("difficulty", 3),
                reference_time=reference_time,
            )
            candidate_items.append({
                "type": "topic",
                "id": topic["id"],
                "title": f"Study: {topic['title']}",
                "subject_id": topic.get("subject_id"),
                "topic_id": topic["id"],
                "task_id": None,
                "due_date": None,
                "priority_score": score,
                "reasoning": reasoning,
                "duration_minutes": topic.get("estimated_minutes", session_duration_minutes),
                "session_type": "study",
            })

    # Sort descending by priority score
    candidate_items.sort(key=lambda x: x["priority_score"], reverse=True)

    # 3. Greedily schedule work units into slots
    planned_sessions: List[StudySessionBase] = []
    unscheduled_items: List[UnscheduledItem] = []
    used_slot_indices = set()

    for item in candidate_items:
        allocated = False
        item_due = item.get("due_date")

        for idx, (slot_start, slot_end) in enumerate(available_slots):
            if idx in used_slot_indices:
                continue

            # Check deadline constraint: slot must end before due date
            if item_due and slot_end > item_due:
                continue  # Slot is past deadline, skip to find an earlier slot or mark unscheduled

            # Assign work unit to this slot
            planned_sessions.append(
                StudySessionBase(
                    title=item["title"],
                    subject_id=item.get("subject_id"),
                    topic_id=item.get("topic_id"),
                    task_id=item.get("task_id"),
                    start_time=slot_start,
                    end_time=slot_end,
                    duration_minutes=session_duration_minutes,
                    status="planned",
                    session_type=item["session_type"],
                    priority_score=item["priority_score"],
                    reasoning=item["reasoning"],
                )
            )
            used_slot_indices.add(idx)
            allocated = True
            break

        if not allocated:
            reason = "Insufficient available time slots before deadline" if item_due else "Exceeded declared availability capacity for planning horizon"
            unscheduled_items.append(
                UnscheduledItem(
                    id=item["id"],
                    title=item["title"],
                    reason=reason,
                    estimated_minutes=item["duration_minutes"],
                )
            )

    # Sort planned sessions chronologically
    planned_sessions.sort(key=lambda x: x.start_time)

    total_planned = len(planned_sessions) * session_duration_minutes
    total_avail = len(available_slots) * session_duration_minutes

    summary = [
        f"Scheduled {len(planned_sessions)} study sessions across {horizon_days} days.",
        f"Allocated {total_planned} of {total_avail} available focus minutes.",
    ]
    if unscheduled_items:
        summary.append(f"{len(unscheduled_items)} items could not be scheduled within available windows.")

    return PlanPreviewResponse(
        planned_sessions=planned_sessions,
        unscheduled_items=unscheduled_items,
        total_planned_minutes=total_planned,
        total_available_minutes=total_avail,
        reasoning_summary=summary,
    )
