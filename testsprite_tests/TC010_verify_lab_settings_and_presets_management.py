import requests
import uuid

BASE_URL = "http://localhost:5002"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": "Bearer test-token"  # Mock token for testing
}


def test_verify_lab_settings_and_presets_management():
    session = requests.Session()
    session.headers.update(HEADERS)

    lab_preset_id = None
    try:
        # 1. Get current user lab settings
        resp = session.get(f"{BASE_URL}/api/user-lab-settings", timeout=TIMEOUT)
        assert resp.status_code == 200, f"Get lab settings failed: {resp.text}"
        original_lab_settings = resp.json()

        # 2. Update lab settings - create a proper lab setting
        update_payload = {
            "panelId": "hematology",
            "labId": "hemoglobin", 
            "trendingCount": 5,
            "isVisible": True
        }
        resp = session.post(f"{BASE_URL}/api/user-lab-settings", json=update_payload, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Update lab settings failed: {resp.text}"

        # 3. Reset lab settings - delete the specific setting we created
        delete_params = {"panelId": "hematology", "labId": "hemoglobin"}
        resp = session.delete(f"{BASE_URL}/api/user-lab-settings", params=delete_params, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Reset lab settings failed: {resp.text}"

        # 4. Get lab presets
        resp = session.get(f"{BASE_URL}/api/lab-presets", timeout=TIMEOUT)
        assert resp.status_code == 200, f"Get lab presets failed: {resp.text}"
        presets = resp.json()
        assert isinstance(presets, list), "Lab presets response not a list"

        # 5. Create a new lab preset
        new_preset_data = {
            "name": f"TestPreset_{uuid.uuid4().hex[:8]}",
            "config": {"visibility": "all", "trending": True},  # Assuming possible config structure
        }
        # The PRD doesn't specify schema for lab preset creation; minimal valid example:
        # We'll send name only, assume server accepts extra fields or minimal name only.
        resp = session.post(f"{BASE_URL}/api/lab-presets", json={"name": new_preset_data["name"]}, timeout=TIMEOUT)
        assert resp.status_code == 201 or resp.status_code == 200, f"Create lab preset failed: {resp.text}"
        created_preset = resp.json()
        lab_preset_id = created_preset.get("id")
        assert lab_preset_id is not None, "Created lab preset missing id"

        # 6. Update the created lab preset
        update_preset_payload = {"name": new_preset_data["name"] + "_Updated"}
        resp = session.put(f"{BASE_URL}/api/lab-presets/{lab_preset_id}", json=update_preset_payload, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Update lab preset failed: {resp.text}"
        updated_preset = resp.json()
        assert updated_preset.get("name") == update_preset_payload["name"], "Lab preset name not updated"

        # 7. Delete the created lab preset
        resp = session.delete(f"{BASE_URL}/api/lab-presets/{lab_preset_id}", timeout=TIMEOUT)
        assert resp.status_code == 200 or resp.status_code == 204, f"Delete lab preset failed: {resp.text}"
        lab_preset_id = None

    finally:
        # Cleanup in case preset was created but not deleted
        if lab_preset_id is not None:
            try:
                session.delete(f"{BASE_URL}/api/lab-presets/{lab_preset_id}", timeout=TIMEOUT)
            except Exception:
                pass


test_verify_lab_settings_and_presets_management()
