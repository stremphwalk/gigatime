import requests
import uuid

BASE_URL = "http://localhost:5002"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}


def validate_smart_phrases_crud_and_import_by_shareable_id():
    created_id = None
    imported_id = None
    try:
        # Step 1: Create a smart phrase with dynamic placeholders
        create_payload = {
            "name": f"Test Smart Phrase {uuid.uuid4()}",
            "content": "Patient is experiencing {symptom} since {duration}.",
            "dynamicPlaceholders": ["symptom", "duration"]
        }
        create_resp = requests.post(f"{BASE_URL}/api/smart-phrases", json=create_payload, headers=HEADERS, timeout=TIMEOUT)
        assert create_resp.status_code == 200, f"Failed to create smart phrase: {create_resp.text}"
        create_data = create_resp.json()
        assert "id" in create_data, "Created smart phrase response missing 'id'"
        created_id = create_data["id"]

        # Step 2: Retrieve smart phrases and verify the created phrase is listed
        get_resp = requests.get(f"{BASE_URL}/api/smart-phrases", headers=HEADERS, timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Failed to get smart phrases list: {get_resp.text}"
        phrases = get_resp.json()
        assert any(sp.get("id") == created_id for sp in phrases), "Created smart phrase not found in list"

        # Step 3: Update the created smart phrase
        update_payload = {
            "name": create_payload["name"] + " Updated",
            "content": "Updated content with {symptom} and {duration} tracking.",
            "dynamicPlaceholders": ["symptom", "duration"]
        }
        update_resp = requests.put(f"{BASE_URL}/api/smart-phrases/{created_id}", json=update_payload, headers=HEADERS, timeout=TIMEOUT)
        assert update_resp.status_code == 200, f"Failed to update smart phrase: {update_resp.text}"

        # Step 4: Import a smart phrase by shareable ID
        # For this test, first create another smart phrase to get its shareable ID or simulate one
        # Since shareableId is not detailed, we assume created_id is usable as shareableId for import test
        import_resp = requests.post(f"{BASE_URL}/api/smart-phrases/import/{created_id}", headers=HEADERS, timeout=TIMEOUT)
        assert import_resp.status_code == 200, f"Failed to import smart phrase by shareable ID: {import_resp.text}"
        imported_data = import_resp.json()
        assert "id" in imported_data, "Imported smart phrase response missing 'id'"
        imported_id = imported_data["id"]
        assert imported_id != created_id, "Imported smart phrase id should differ from original"

        # Step 5: Delete the created smart phrase
        delete_resp = requests.delete(f"{BASE_URL}/api/smart-phrases/{created_id}", headers=HEADERS, timeout=TIMEOUT)
        assert delete_resp.status_code == 200, f"Failed to delete created smart phrase: {delete_resp.text}"

        # Step 6: Delete the imported smart phrase
        if imported_id:
            delete_imported_resp = requests.delete(f"{BASE_URL}/api/smart-phrases/{imported_id}", headers=HEADERS, timeout=TIMEOUT)
            assert delete_imported_resp.status_code == 200, f"Failed to delete imported smart phrase: {delete_imported_resp.text}"

        # Step 7: Verify deletion by attempting to get deleted smart phrases by id returns error or not found
        get_deleted_resp = requests.get(f"{BASE_URL}/api/smart-phrases", headers=HEADERS, timeout=TIMEOUT)
        assert get_deleted_resp.status_code == 200, "Failed to get smart phrases list after deletion"
        phrases_after_delete = get_deleted_resp.json()
        assert all(sp.get("id") != created_id for sp in phrases_after_delete), "Deleted smart phrase still found in list"
        if imported_id:
            assert all(sp.get("id") != imported_id for sp in phrases_after_delete), "Deleted imported smart phrase still found in list"

    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"
    finally:
        # Cleanup to ensure no test data remains in case of failure mid-test
        if created_id:
            requests.delete(f"{BASE_URL}/api/smart-phrases/{created_id}", headers=HEADERS, timeout=TIMEOUT)
        if imported_id:
            requests.delete(f"{BASE_URL}/api/smart-phrases/{imported_id}", headers=HEADERS, timeout=TIMEOUT)


validate_smart_phrases_crud_and_import_by_shareable_id()