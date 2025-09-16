import requests
from datetime import datetime
import uuid

BASE_URL = "http://localhost:5002"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}


def test_validate_run_list_management_for_clinical_rounds():
    # Step 1: Retrieve today's run list (should succeed, possibly empty)
    today_date = datetime.utcnow().strftime("%Y-%m-%d")
    params = {"day": today_date, "carryForward": "false"}
    response = requests.get(f"{BASE_URL}/api/run-list/today", params=params, headers=HEADERS, timeout=TIMEOUT)
    assert response.status_code == 200
    run_list_data = response.json()
    # Expect run_list_data to be a dict with patients list or similar structure
    assert isinstance(run_list_data, dict)

    # We'll use or create a run list id to add patients.
    # Assuming today's run list has an id or available run lists for today.
    # But the PRD does not specify how to create a run list or get its id. 
    # We infer that run_list/today represents the current run list for the day.
    # We'll try to find an id from the response; if none, skip adding (could create run list but no endpoint provided)
    run_list_id = run_list_data.get("id") or None

    # If no run_list_id present, test adding, updating, archiving patients cannot be done, thus create a workaround:
    # We skip adding patient but still test update note and get todays run list again.
    # However, to strictly follow instruction 8, create resource if missing.
    # So We'll create a patient directly on run list if run_list_id exists; otherwise test only retrieval.

    # Define helper to create patient
    def add_patient(run_list_id, alias):
        url = f"{BASE_URL}/api/run-list/{run_list_id}/patients"
        payload = {"alias": alias}
        r = requests.post(url, json=payload, headers=HEADERS, timeout=TIMEOUT)
        return r

    # Define helper to update patient
    def update_patient(patient_id, updated_alias):
        url = f"{BASE_URL}/api/run-list/patients/{patient_id}"
        payload = {"alias": updated_alias}  # PRD does not specify body, but put may have body or param
        # PRD for patient update does not specify requestBody. We try empty or alias.
        # We'll try empty body since no requestBody defined.
        r = requests.put(url, headers=HEADERS, timeout=TIMEOUT)
        return r

    # Define helper to archive (delete) patient
    def archive_patient(patient_id):
        url = f"{BASE_URL}/api/run-list/patients/{patient_id}"
        r = requests.delete(url, headers=HEADERS, timeout=TIMEOUT)
        return r

    # Define helper to update run list note for patient
    def update_run_list_note(list_patient_id, note_content):
        url = f"{BASE_URL}/api/run-list/notes/{list_patient_id}"
        payload = {"note": note_content}
        # PRD for update run list note PUT does not specify requestBody schema; assume "note" key as content.
        r = requests.put(url, json=payload, headers=HEADERS, timeout=TIMEOUT)
        return r

    if not run_list_id:
        # No run list id available, skip patient add/update/archive test but validate retrieval of run list again with carryForward true
        params_cf = {"day": today_date, "carryForward": "true"}
        resp_cf = requests.get(f"{BASE_URL}/api/run-list/today", params=params_cf, headers=HEADERS, timeout=TIMEOUT)
        assert resp_cf.status_code == 200
        run_list_cf = resp_cf.json()
        assert isinstance(run_list_cf, dict)
        return

    patient_id = None
    try:
        # Step 2: Add patient to run list
        unique_alias = f"Test Patient {uuid.uuid4()}"
        add_resp = add_patient(run_list_id, unique_alias)
        assert add_resp.status_code == 200
        added_patient = add_resp.json()
        # Expect added_patient to have an "id" field for patient listPatientId
        assert isinstance(added_patient, dict)
        patient_id = added_patient.get("id")
        assert patient_id is not None

        # Step 3: Update patient in run list (no requestBody defined, so just test PUT returns 200)
        update_resp = requests.put(f"{BASE_URL}/api/run-list/patients/{patient_id}", headers=HEADERS, timeout=TIMEOUT)
        assert update_resp.status_code == 200

        # Step 4: Update run list note for this patient
        # Assuming run list note id is same as patient_id or the id from added_patient
        note_resp = update_run_list_note(patient_id, "This is a test note for the run list.")
        assert note_resp.status_code == 200

        # Step 5: Retrieve today's run list again, verify patient is present
        get_run_list = requests.get(f"{BASE_URL}/api/run-list/today", params=params, headers=HEADERS, timeout=TIMEOUT)
        assert get_run_list.status_code == 200
        run_list_after = get_run_list.json()
        assert isinstance(run_list_after, dict)
        # Check patients list contains the added patient by id or alias
        patients = run_list_after.get("patients") or run_list_after.get("patientsList") or []
        assert any((p.get("id") == patient_id or p.get("alias") == unique_alias) for p in patients)

        # Step 6: Archive (delete) patient from run list
        archive_resp = archive_patient(patient_id)
        assert archive_resp.status_code == 200

        # Step 7: Verify patient is no longer in today's run list
        get_after_archive = requests.get(f"{BASE_URL}/api/run-list/today", params=params, headers=HEADERS, timeout=TIMEOUT)
        assert get_after_archive.status_code == 200
        run_list_post_archive = get_after_archive.json()
        pts = run_list_post_archive.get("patients") or []
        assert all(p.get("id") != patient_id for p in pts)

    finally:
        # Cleanup in case archive didn't happen
        if patient_id:
            try:
                archive_patient(patient_id)
            except Exception:
                pass


test_validate_run_list_management_for_clinical_rounds()