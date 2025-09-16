import requests

BASE_URL = "http://localhost:5002"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_verify_ai_processing_for_medications_labs_and_pmh():
    dictation_medications = (
        "Patient currently taking 10 mg lisinopril daily and 500 mg metformin twice daily."
    )
    dictation_labs = "Recent labs show hemoglobin of 13.5, white blood cell count 7000, and creatinine 1.2."
    dictation_pmh = (
        "Past medical history significant for hypertension, type 2 diabetes mellitus, and asthma."
    )

    # Endpoint paths
    medications_path = "/api/ai/medications"
    labs_path = "/api/ai/labs"
    pmh_path = "/api/ai/pmh"

    try:
        # POST to /api/ai/medications
        resp_med = requests.post(
            BASE_URL + medications_path,
            json={"dictation": dictation_medications},
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp_med.status_code == 200, f"Medications API returned {resp_med.status_code}"
        resp_med_json = resp_med.json()
        # Validate response structure is a JSON object
        assert isinstance(resp_med_json, dict), "Medications response is not a JSON object"

        # POST to /api/ai/labs
        resp_labs = requests.post(
            BASE_URL + labs_path,
            json={"dictation": dictation_labs},
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp_labs.status_code == 200, f"Labs API returned {resp_labs.status_code}"
        resp_labs_json = resp_labs.json()
        assert isinstance(resp_labs_json, dict), "Labs response is not a JSON object"

        # POST to /api/ai/pmh
        resp_pmh = requests.post(
            BASE_URL + pmh_path,
            json={"dictation": dictation_pmh},
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp_pmh.status_code == 200, f"PMH API returned {resp_pmh.status_code}"
        resp_pmh_json = resp_pmh.json()
        assert isinstance(resp_pmh_json, dict), "PMH response is not a JSON object"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"


test_verify_ai_processing_for_medications_labs_and_pmh()
