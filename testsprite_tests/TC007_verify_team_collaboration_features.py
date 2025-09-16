import requests
import uuid

BASE_URL = "http://localhost:5002"
TIMEOUT = 30
AUTH_TOKEN = "test-token"  # Mock token for testing


def get_headers():
    headers = {
        "Content-Type": "application/json",
    }
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    return headers


def test_verify_team_collaboration_features():
    assert AUTH_TOKEN, "AUTH_TOKEN must be set to run this test"

    # We'll create a team, join it by code, create todo and calendar event, then clean up.
    team_id = None
    joined_team_id = None
    todo_id = None
    calendar_event_id = None

    try:
        # 1. Create a new team
        team_name = f"Test Team {uuid.uuid4()}"
        team_desc = "Test team description"
        resp = requests.post(
            f"{BASE_URL}/api/teams",
            headers=get_headers(),
            json={"name": team_name, "description": team_desc},
            timeout=TIMEOUT,
        )
        assert resp.status_code == 201, f"Failed to create team: {resp.text}"
        team_data = resp.json()
        team_id = team_data.get("id")
        group_code = team_data.get("groupCode") or team_data.get("code")
        assert team_id, "Team ID missing in create response"
        assert group_code and isinstance(group_code, str), "Group code missing or invalid"

        # 2. Join the team by code
        join_resp = requests.post(
            f"{BASE_URL}/api/teams/join",
            headers=get_headers(),
            json={"groupCode": group_code},
            timeout=TIMEOUT,
        )
        assert join_resp.status_code == 200, f"Failed to join team: {join_resp.text}"
        join_data = join_resp.json()
        joined_team_id = join_data.get("id") or team_id
        assert joined_team_id == team_id, "Joined team ID does not match created team ID"

        # 3. Create a team todo
        todo_payload = {
            "title": "Test Todo",
            "description": "This is a test todo item for team collaboration"
        }
        todo_resp = requests.post(
            f"{BASE_URL}/api/teams/{team_id}/todos",
            headers=get_headers(),
            json=todo_payload,
            timeout=TIMEOUT,
        )
        assert todo_resp.status_code == 201, f"Failed to create team todo: {todo_resp.text}"
        todo_data = todo_resp.json()
        todo_id = todo_data.get("id")
        assert todo_id, "Todo ID missing in create response"
        assert todo_data.get("title") == todo_payload["title"], "Todo title mismatch"
        assert todo_data.get("description") == todo_payload["description"], "Todo description mismatch"

        # 4. Retrieve team todos and verify new todo is listed
        get_todos_resp = requests.get(
            f"{BASE_URL}/api/teams/{team_id}/todos",
            headers=get_headers(),
            timeout=TIMEOUT,
        )
        assert get_todos_resp.status_code == 200, f"Failed to get team todos: {get_todos_resp.text}"
        todos_list = get_todos_resp.json()
        assert any(t.get("id") == todo_id for t in todos_list), "Created todo not found in todo list"

        # 5. Create a calendar event
        calendar_payload = {
            "title": "Test Event",
            "description": "Team collaboration test calendar event",
            "startTime": "2025-12-01T10:00:00Z",
            "endTime": "2025-12-01T11:00:00Z"
        }
        calendar_resp = requests.post(
            f"{BASE_URL}/api/teams/{team_id}/calendar",
            headers=get_headers(),
            json=calendar_payload,
            timeout=TIMEOUT,
        )
        assert calendar_resp.status_code == 201, f"Failed to create calendar event: {calendar_resp.text}"
        calendar_data = calendar_resp.json()
        calendar_event_id = calendar_data.get("id")
        assert calendar_event_id, "Calendar event ID missing in create response"
        assert calendar_data.get("title") == calendar_payload["title"], "Calendar event title mismatch"
        assert calendar_data.get("description") == calendar_payload["description"], "Calendar event description mismatch"

        # 6. Retrieve calendar events and verify new event is listed
        get_calendar_resp = requests.get(
            f"{BASE_URL}/api/teams/{team_id}/calendar",
            headers=get_headers(),
            timeout=TIMEOUT,
        )
        assert get_calendar_resp.status_code == 200, f"Failed to get calendar events: {get_calendar_resp.text}"
        events_list = get_calendar_resp.json()
        assert any(e.get("id") == calendar_event_id for e in events_list), "Created calendar event not found in event list"

    finally:
        # Cleanup: Delete created todo, calendar event, and team if possible
        if todo_id:
            try:
                # Assuming DELETE endpoint /api/teams/{teamId}/todos/{todoId} exists
                requests.delete(
                    f"{BASE_URL}/api/teams/{team_id}/todos/{todo_id}",
                    headers=get_headers(),
                    timeout=TIMEOUT,
                )
            except Exception:
                pass
        if calendar_event_id:
            try:
                # Assuming DELETE endpoint /api/teams/{teamId}/calendar/{eventId} exists
                requests.delete(
                    f"{BASE_URL}/api/teams/{team_id}/calendar/{calendar_event_id}",
                    headers=get_headers(),
                    timeout=TIMEOUT,
                )
            except Exception:
                pass
        if team_id:
            try:
                # Assuming DELETE endpoint /api/teams/{teamId} exists
                requests.delete(
                    f"{BASE_URL}/api/teams/{team_id}",
                    headers=get_headers(),
                    timeout=TIMEOUT,
                )
            except Exception:
                pass


test_verify_team_collaboration_features()
