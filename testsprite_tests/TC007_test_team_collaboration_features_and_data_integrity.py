import requests

BASE_URL = "http://localhost:5002"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_team_collaboration_features_and_data_integrity():
    team_id = None
    todo_id = None
    event_id = None

    # Create a team to test with
    team_payload = {
        "name": "Test Team Collaboration",
        "description": "Testing team collaboration features and data integrity"
    }

    try:
        # Create team
        create_team_resp = requests.post(f"{BASE_URL}/api/teams/create", json=team_payload, headers=HEADERS, timeout=TIMEOUT)
        assert create_team_resp.status_code == 200, f"Team creation failed: {create_team_resp.text}"
        team_data = create_team_resp.json()
        team_id = team_data.get("id")
        assert team_id, "No team ID returned on creation"

        # Retrieve user's teams - verify new team is listed
        get_teams_resp = requests.get(f"{BASE_URL}/api/teams", headers=HEADERS, timeout=TIMEOUT)
        assert get_teams_resp.status_code == 200, f"Failed to get teams: {get_teams_resp.text}"
        teams = get_teams_resp.json()
        assert any(t.get("id") == team_id for t in teams), "Created team not found in user teams"

        # Join team by group code - use the created team's group code
        # First, get group code from the created team (assuming it's in team_data)
        group_code = team_data.get("groupCode")
        if group_code:
            join_payload = {"groupCode": group_code}
            join_resp = requests.post(f"{BASE_URL}/api/teams/join", json=join_payload, headers=HEADERS, timeout=TIMEOUT)
            assert join_resp.status_code == 200, f"Failed to join team by group code: {join_resp.text}"
            join_data = join_resp.json()
            assert join_data.get("teamId") == team_id or join_data.get("id") == team_id, "Joined team ID mismatch"
        else:
            # If no groupCode in response, skip join test as no info available
            pass

        # Test team todos: create and retrieve
        # Create todo
        todo_payload = {
            "title": "Test Todo Item",
            "description": "Todo for testing team collaboration",
            "dueDate": "2025-12-31"
        }
        create_todo_resp = requests.post(f"{BASE_URL}/api/teams/{team_id}/todos", json=todo_payload, headers=HEADERS, timeout=TIMEOUT)
        assert create_todo_resp.status_code == 200, f"Creating team todo failed: {create_todo_resp.text}"
        todo_data = create_todo_resp.json()
        todo_id = todo_data.get("id")
        assert todo_id, "No todo ID returned on creation"

        # Get todos and check created todo exists
        get_todos_resp = requests.get(f"{BASE_URL}/api/teams/{team_id}/todos", headers=HEADERS, timeout=TIMEOUT)
        assert get_todos_resp.status_code == 200, f"Getting team todos failed: {get_todos_resp.text}"
        todos = get_todos_resp.json()
        assert any(t.get("id") == todo_id for t in todos), "Created todo not found in team todos"

        # Test calendar events: create and retrieve
        event_payload = {
            "title": "Test Calendar Event",
            "description": "Event for team collaboration testing",
            "start": "2025-12-01T10:00:00Z",
            "end": "2025-12-01T11:00:00Z",
            "location": "Conference Room A"
        }
        create_event_resp = requests.post(f"{BASE_URL}/api/teams/{team_id}/calendar", json=event_payload, headers=HEADERS, timeout=TIMEOUT)
        assert create_event_resp.status_code == 200, f"Creating calendar event failed: {create_event_resp.text}"
        event_data = create_event_resp.json()
        event_id = event_data.get("id")
        assert event_id, "No event ID returned on creation"

        # Get calendar events and check created event exists
        get_events_resp = requests.get(f"{BASE_URL}/api/teams/{team_id}/calendar", headers=HEADERS, timeout=TIMEOUT)
        assert get_events_resp.status_code == 200, f"Getting team calendar events failed: {get_events_resp.text}"
        events = get_events_resp.json()
        assert any(e.get("id") == event_id for e in events), "Created event not found in team calendar"

    finally:
        # Clean up: delete created todo (if deletion endpoint existed, but not specified - skip)
        # Clean up: delete created calendar event (no delete endpoint provided, skip)
        # Delete created team if possible (no delete endpoint documented - skip)
        pass

test_team_collaboration_features_and_data_integrity()