import requests

BASE_URL = "http://localhost:5002"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}


def test_verify_lab_settings_and_user_lab_presets_management():
    # 1. Retrieve lab presets (GET /api/lab-presets)
    resp_get_presets = requests.get(f"{BASE_URL}/api/lab-presets", timeout=TIMEOUT)
    assert resp_get_presets.status_code == 200
    presets_list = resp_get_presets.json()
    assert isinstance(presets_list, list)

    # 2. Create a new lab preset (POST /api/lab-presets)
    new_preset_payload = {
        "name": "Test Lab Preset",
        "labs": [
            {"name": "Hemoglobin", "range": "13-17 g/dL"},
            {"name": "WBC", "range": "4.0-11.0 10^3/uL"}
        ]
    }
    try:
        resp_create_preset = requests.post(
            f"{BASE_URL}/api/lab-presets",
            json=new_preset_payload,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp_create_preset.status_code == 200
        created_preset = resp_create_preset.json()
        assert "id" in created_preset
        preset_id = created_preset["id"]

        # 3. Retrieve user-specific lab settings (GET /api/user-lab-settings)
        resp_get_user_settings = requests.get(f"{BASE_URL}/api/user-lab-settings", timeout=TIMEOUT)
        assert resp_get_user_settings.status_code == 200
        user_lab_settings = resp_get_user_settings.json()
        assert isinstance(user_lab_settings, dict)

        # 4. Save user lab settings (POST /api/user-lab-settings)
        save_payload = {
            "presetId": preset_id,
            "customSettings": {
                "includeUnits": True,
                "thresholdAlerts": {"Hemoglobin": "low", "WBC": "high"}
            }
        }
        resp_save_user_settings = requests.post(
            f"{BASE_URL}/api/user-lab-settings",
            json=save_payload,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp_save_user_settings.status_code == 200
        save_response = resp_save_user_settings.json()
        assert isinstance(save_response, dict)

    finally:
        # Cleanup: delete the new lab preset if created
        if 'preset_id' in locals():
            requests.delete(f"{BASE_URL}/api/lab-presets/{preset_id}", timeout=TIMEOUT)


test_verify_lab_settings_and_user_lab_presets_management()
