from datetime import datetime
from typing import Optional, Tuple


def calculate_priority_score(
    due_date: Optional[datetime],
    importance: int,  # 1 to 5
    difficulty: int,  # 1 to 5
    reference_time: datetime,
) -> Tuple[float, str]:
    """
    Computes an explainable multi-factor deterministic priority score.
    Higher score indicates higher priority for earliest scheduling.
    """
    # 1. Urgency Component (0 - 150)
    reasons = []
    if due_date:
        diff_hours = (due_date - reference_time).total_seconds() / 3600.0
        if diff_hours < 0:
            urgency = 150.0
            reasons.append(f"Overdue by {abs(diff_hours):.1f} hours")
        elif diff_hours <= 24:
            urgency = 120.0
            reasons.append(f"Urgent: due in {diff_hours:.1f} hours")
        elif diff_hours <= 72:
            urgency = 90.0
            reasons.append(f"Upcoming deadline in {diff_hours / 24.0:.1f} days")
        else:
            urgency = max(10.0, min(80.0, 1000.0 / (diff_hours + 1.0)))
            reasons.append(f"Due in {diff_hours / 24.0:.1f} days")
    else:
        urgency = 20.0
        reasons.append("No fixed deadline set")

    # 2. Importance Component (0 - 100)
    importance_clamped = max(1, min(5, importance))
    importance_score = (importance_clamped / 5.0) * 100.0
    if importance_clamped >= 4:
        reasons.append(f"High importance ({importance_clamped}/5)")

    # 3. Difficulty Component (0 - 100)
    difficulty_clamped = max(1, min(5, difficulty))
    difficulty_score = (difficulty_clamped / 5.0) * 100.0
    if difficulty_clamped >= 4:
        reasons.append(f"Challenging topic ({difficulty_clamped}/5)")

    # Weighted sum: 50% urgency, 30% importance, 20% difficulty
    total_score = (0.50 * urgency) + (0.30 * importance_score) + (0.20 * difficulty_score)

    reasoning = "; ".join(reasons)
    return round(total_score, 2), reasoning
