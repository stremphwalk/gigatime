import requests
import datetime
import time

BASE_URL = "http://localhost:5002"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": "Bearer test-token"  # Mock token for testing
}

def test_verify_run_list_management_workflows():
    # Step 1: Retrieve today's run list (should exist or create one)
    day_str = datetime.date.today().isoformat()
    params = {"day": day_str, "carryForward": True}
    r = requests.get(f"{BASE_URL}/api/run-list/today", params=params, headers=HEADERS, timeout=TIMEOUT)
    assert r.status_code == 200, "Failed to get today's run list"
    response_data = r.json()
    # The response format is { runList: {...}, patients: [...] }
    if isinstance(response_data, dict) and "runList" in response_data:
        run_list = response_data["runList"]
    elif isinstance(response_data, dict) and "id" in response_data:
        run_list = response_data
    elif isinstance(response_data, list) and len(response_data) > 0:
        run_list = response_data[0]
    else:
        # Fail here as we need run list
        assert False, "No run list available for today or run list missing required id"

    run_list_id = run_list.get("id") or run_list.get("runListId")
    assert run_list_id is not None, "Run list ID is missing"

    # Store patient IDs for cleanup
    added_patient_ids = []

    try:
        # Step 2: Add a patient to the run list
        add_payload = {"alias": "John Doe"}
        r = requests.post(f"{BASE_URL}/api/run-list/{run_list_id}/patients", headers=HEADERS, json=add_payload, timeout=TIMEOUT)
        assert r.status_code in (200, 201), "Failed to add patient to run list"
        patient = r.json()
        patient_id = patient.get("id") or patient.get("patientId") or patient.get("runListPatientId")
        assert patient_id is not None, "Added patient ID missing"
        added_patient_ids.append(patient_id)

        # Step 3: Reorder patients in the run list (assuming the run list has at least this one patient)
        r = requests.get(f"{BASE_URL}/api/run-list/today", params=params, headers=HEADERS, timeout=TIMEOUT)
        assert r.status_code == 200, "Failed to get today's run list for reordering"
        current_response = r.json()
        patients = []
        if isinstance(current_response, dict) and "patients" in current_response:
            patients = current_response["patients"]
        elif isinstance(current_response, dict) and "runList" in current_response:
            patients = current_response.get("patients", [])
        elif isinstance(current_response, dict):
            patients = current_response.get("patients", [])
        elif isinstance(current_response, list) and len(current_response) > 0:
            patients = current_response[0].get("patients", [])
        patient_ids_order = [p.get("id") or p.get("patientId") or p.get("runListPatientId") for p in patients]
        reordered = list(reversed(patient_ids_order))
        reorder_payload = {"order": reordered}
        r = requests.put(f"{BASE_URL}/api/run-list/{run_list_id}/patients/reorder", headers=HEADERS, json=reorder_payload, timeout=TIMEOUT)
        assert r.status_code == 200, "Failed to reorder patients"

        # Step 4: Update patient info in the run list
        update_payload = {"alias": "Johnathan Doe"}
        r = requests.put(f"{BASE_URL}/api/run-list/patients/{patient_id}", headers=HEADERS, json=update_payload, timeout=TIMEOUT)
        assert r.status_code == 200, "Failed to update patient info"

        # Step 5: Update notes for this patient in run list
        note_update_payload = {"note": "Initial assessment completed."}
        r = requests.put(f"{BASE_URL}/api/run-list/notes/{patient_id}", headers=HEADERS, json=note_update_payload, timeout=TIMEOUT)
        assert r.status_code == 200, "Failed to update run list note"

        # Step 6: Generate AI note for this patient
        ai_payload = {
            "listPatientId": patient_id,
            "transcript": "Patient is recovering well with no new symptoms.",
            "mode": "progress"
        }
        r = requests.post(f"{BASE_URL}/api/run-list/ai/generate", headers=HEADERS, json=ai_payload, timeout=TIMEOUT)
        assert r.status_code == 200, "Failed to generate AI note"
        ai_response = r.json()
        assert "note" in ai_response, "AI note generation response invalid"

        # Step 7: Archive patient from run list
        r = requests.delete(f"{BASE_URL}/api/run-list/patients/{patient_id}", headers=HEADERS, timeout=TIMEOUT)
        assert r.status_code == 200, "Failed to archive patient"
        added_patient_ids.remove(patient_id)

    finally:
        # Cleanup: remove any added patients that were not archived
        for pid in added_patient_ids:
            try:
                requests.delete(f"{BASE_URL}/api/run-list/patients/{pid}", headers=HEADERS, timeout=TIMEOUT)
            except Exception:
                pass

test_verify_run_list_management_workflows()
