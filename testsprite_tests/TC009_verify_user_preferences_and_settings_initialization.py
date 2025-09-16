import requests

BASE_URL = "http://localhost:5002"
TIMEOUT = 30

def get_auth_token():
    # For testing purpose, this function should be modified to obtain a valid bearer token.
    # Placeholder token for illustration, replace with valid token retrieval logic.
    return "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.testtoken"

def test_verify_user_preferences_and_settings_initialization():
    url = f"{BASE_URL}/api/user-preferences"
    headers = {
        "Authorization": get_auth_token(),
        "Accept": "application/json",
    }
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to /api/user-preferences failed: {e}"

    assert response.status_code == 200, f"Expected HTTP 200 OK but got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate expected keys in the response - user preferences should have userId and data
    assert "userId" in data, "Missing expected key in response: userId"
    assert "data" in data, "Missing expected key in response: data"
    
    # Check that userId is a string
    user_id = data.get("userId")
    assert isinstance(user_id, str) and len(user_id) > 0, "userId should be a non-empty string"
    
    # Check that data is a dict (can be empty for new users)
    preferences_data = data.get("data")
    assert isinstance(preferences_data, dict), "preferences data should be an object"

test_verify_user_preferences_and_settings_initialization()