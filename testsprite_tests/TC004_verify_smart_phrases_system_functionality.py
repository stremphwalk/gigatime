import requests

BASE_URL = "http://localhost:5002"
TIMEOUT = 30

# Assume an environment variable or fixed token for auth; replace with actual token retrieval if needed
AUTH_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.token"  # Placeholder token

HEADERS = {
    "Authorization": AUTH_TOKEN,
    "Content-Type": "application/json",
    "Accept": "application/json",
}

def verify_smart_phrases_system_functionality():
    # 1. Create a new smart phrase
    create_payload = {
        "trigger": "hx",
        "content": "History of present illness",
        "elements": [
            {"type": "text", "value": "History of present illness "},
            {"type": "variable", "name": "detail", "options": ["mild", "moderate", "severe"]}
        ]
    }
    created_id = None
    try:
        create_resp = requests.post(
            f"{BASE_URL}/api/smart-phrases",
            headers=HEADERS,
            json=create_payload,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201 or create_resp.status_code == 200, f"Failed to create smart phrase: {create_resp.text}"
        created_data = create_resp.json()
        assert "id" in created_data, "Response missing smart phrase id"
        created_id = created_data["id"]

        # 2. Retrieve list of smart phrases and check created phrase presence
        get_resp = requests.get(
            f"{BASE_URL}/api/smart-phrases",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert get_resp.status_code == 200, f"Failed to get smart phrases: {get_resp.text}"
        phrases = get_resp.json()
        assert any(sp.get("id") == created_id for sp in phrases), "Created smart phrase not found in list"

        # 3. Update the created smart phrase
        update_payload = {
            "trigger": "hx-updated",
            "content": "Updated history of present illness",
            "elements": [
                {"type": "text", "value": "Updated history of present illness "}
            ]
        }
        update_resp = requests.put(
            f"{BASE_URL}/api/smart-phrases/{created_id}",
            headers=HEADERS,
            json=update_payload,
            timeout=TIMEOUT
        )
        assert update_resp.status_code == 200, f"Failed to update smart phrase: {update_resp.text}"

        # 4. Retrieve the updated smart phrase by getting list and filtering
        get_updated_resp = requests.get(
            f"{BASE_URL}/api/smart-phrases",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert get_updated_resp.status_code == 200, f"Failed to get smart phrases post update: {get_updated_resp.text}"
        updated_phrases = get_updated_resp.json()
        updated_phrase = next((sp for sp in updated_phrases if sp.get("id") == created_id), None)
        assert updated_phrase is not None, "Updated smart phrase not found"
        assert updated_phrase.get("trigger") == "hx-updated", "Trigger not updated correctly"
        assert updated_phrase.get("content") == "Updated history of present illness", "Content not updated correctly"

        # 5. Import smart phrase by shareable ID (simulate by using created_id)
        import_resp = requests.post(
            f"{BASE_URL}/api/smart-phrases/import/{created_id}",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        if import_resp.status_code == 200:
            imported_data = import_resp.json()
            assert "id" in imported_data, "Imported phrase response missing id"
            # The imported phrase id could be same or different (depending on system), check at least content matches trigger for sanity
            assert "trigger" in imported_data or "content" in imported_data, "Imported phrase missing expected fields"
        else:
            # The server may reject import of non-public or invalid shareable ID
            assert import_resp.status_code == 404 or import_resp.status_code == 400, f"Unexpected status code on import: {import_resp.status_code}"
            error_resp = import_resp.json()
            assert "error" in error_resp and error_resp["error"] == "Smart phrase not found or not public", f"Unexpected error message: {error_resp}"

        # 6. Delete the created smart phrase
        delete_resp = requests.delete(
            f"{BASE_URL}/api/smart-phrases/{created_id}",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert delete_resp.status_code == 200 or delete_resp.status_code == 204, f"Failed to delete smart phrase: {delete_resp.text}"

        # 7. Confirm deletion by attempting to get the phrase in list
        get_final_resp = requests.get(
            f"{BASE_URL}/api/smart-phrases",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert get_final_resp.status_code == 200, f"Failed to get smart phrases after deletion: {get_final_resp.text}"
        final_phrases = get_final_resp.json()
        assert not any(sp.get("id") == created_id for sp in final_phrases), "Deleted smart phrase still present in list"

    except requests.RequestException as e:
        assert False, f"HTTP request failed: {str(e)}"
    except AssertionError:
        raise
    except Exception as e:
        assert False, f"Unexpected error: {str(e)}"

verify_smart_phrases_system_functionality()
