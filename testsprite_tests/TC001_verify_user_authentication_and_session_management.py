import requests

BASE_URL = "http://localhost:5002"
TIMEOUT = 30

def test_verify_user_authentication_and_session_management():
    session = requests.Session()
    try:
        # 1. Attempt to get current user info before login (expecting no user or error)
        response_user_before = session.get(f"{BASE_URL}/api/auth/user", timeout=TIMEOUT)
        # Without authentication the dev no-auth server might allow or deny.
        # We allow either 200 with empty user or 401/403 unauthorized.
        assert response_user_before.status_code in (200, 401, 403), f"Unexpected status before login: {response_user_before.status_code}"

        # 2. Login: POST /api/auth/login
        # No-auth dev server likely does not require credentials per instructions,
        # send empty JSON or minimal body 
        login_payload = {}
        response_login = session.post(f"{BASE_URL}/api/auth/login", json=login_payload, timeout=TIMEOUT)
        assert response_login.status_code == 200, f"Login failed with status: {response_login.status_code}"

        # 3. After login, get current user info: GET /api/auth/user
        response_user_after = session.get(f"{BASE_URL}/api/auth/user", timeout=TIMEOUT)
        assert response_user_after.status_code == 200, f"Get user failed after login with status: {response_user_after.status_code}"
        user_data = response_user_after.json()
        assert isinstance(user_data, dict), "User info response is not JSON object"
        # Optionally check for expected user fields if present
        # e.g. assert "id" in user_data or "email" in user_data

        # 4. Logout: POST /api/auth/logout
        response_logout = session.post(f"{BASE_URL}/api/auth/logout", timeout=TIMEOUT)
        assert response_logout.status_code == 200, f"Logout failed with status: {response_logout.status_code}"

        # 5. After logout, get current user info again (expect no user or unauthorized)
        response_user_after_logout = session.get(f"{BASE_URL}/api/auth/user", timeout=TIMEOUT)
        assert response_user_after_logout.status_code in (200, 401, 403), f"Unexpected status after logout: {response_user_after_logout.status_code}"

    finally:
        session.close()

test_verify_user_authentication_and_session_management()