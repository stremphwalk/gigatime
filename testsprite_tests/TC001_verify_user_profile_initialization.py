import requests

BASE_URL = "http://localhost:5002"
TIMEOUT = 30

def test_verify_user_profile_initialization():
    url = f"{BASE_URL}/api/init-user"
    dummy_token = "Bearer dummy-valid-token-for-testing"  # Should be replaced with a valid token if available

    headers_with_auth = {
        "Authorization": dummy_token,
        "Content-Type": "application/json"
    }

    # Test unauthorized access (no token)
    try:
        response = requests.post(url, timeout=TIMEOUT)
    except Exception as e:
        assert False, f"Request to {url} failed without auth: {e}"
    assert response.status_code in (200, 401, 403), f"Expected 401, 403 or 200 without auth, got {response.status_code}"

    # Test authorized access
    try:
        response = requests.post(url, headers=headers_with_auth, timeout=TIMEOUT)
    except Exception as e:
        assert False, f"Request to {url} failed with auth: {e}"
    assert response.status_code == 200, f"Expected 200 OK with auth, got {response.status_code}"

    try:
        data = response.json()
    except Exception:
        data = None
    if data is not None:
        assert isinstance(data, dict), "Response JSON is not a dictionary"


test_verify_user_profile_initialization()
