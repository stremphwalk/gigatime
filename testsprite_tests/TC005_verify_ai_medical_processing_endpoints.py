import requests

BASE_URL = "http://localhost:5002"
TIMEOUT_SECONDS = 30


def test_verify_ai_medical_processing_endpoints():
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token"
    }

    endpoints = [
        "/api/ai/medications",
        "/api/ai/labs",
        "/api/ai/pmh"
    ]

    test_text = "Patient reports taking aspirin 81 mg daily and recently had a CBC lab test with abnormal results. Past history includes hypertension and diabetes mellitus type 2."

    for endpoint in endpoints:
        url = f"{BASE_URL}{endpoint}"
        response = requests.post(url, json={"dictation": test_text}, headers=headers, timeout=TIMEOUT_SECONDS)
        try:
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            assert False, f"Request to {endpoint} failed with exception: {e}"
        try:
            json_response = response.json()
        except ValueError:
            assert False, f"Response from {endpoint} is not valid JSON."

        assert isinstance(json_response, dict), f"Response from {endpoint} is not a JSON object."
        assert len(json_response) > 0, f"Response from {endpoint} is empty."


test_verify_ai_medical_processing_endpoints()
