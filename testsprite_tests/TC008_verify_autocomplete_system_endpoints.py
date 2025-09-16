import requests
import uuid

BASE_URL = "http://localhost:5002"
TIMEOUT = 30

# Mock token for testing
AUTH_TOKEN = "test-token"
HEADERS = {
    "Content-Type": "application/json",
}
if AUTH_TOKEN:
    HEADERS["Authorization"] = f"Bearer {AUTH_TOKEN}"


def test_verify_autocomplete_system_endpoints():
    created_id = None
    try:
        # Step 1: Create autocomplete entry
        create_payload = {
            "text": f"test-autocomplete-text-{uuid.uuid4()}",
            "category": "medication",
            "dosage": "10mg",
            "frequency": "once daily"
        }
        create_resp = requests.post(
            f"{BASE_URL}/api/autocomplete-items",
            json=create_payload,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert create_resp.status_code == 201 or create_resp.status_code == 200, f"Creation failed: {create_resp.status_code} {create_resp.text}"
        create_data = create_resp.json()
        created_id = create_data.get("id")
        assert created_id, "Created autocomplete item ID missing"

        # Verify the returned created item's category matches expected
        created_category = create_data.get("category")
        assert created_category == create_payload["category"], f"Created category mismatch: expected {create_payload['category']}, got {created_category}"

        # Step 2: Retrieve autocomplete items with category filter
        # Add a small delay to ensure the item is persisted
        import time
        time.sleep(0.5)
        
        params = {"category": "medication"}
        get_resp_cat = requests.get(
            f"{BASE_URL}/api/autocomplete-items",
            headers=HEADERS,
            params=params,
            timeout=TIMEOUT,
        )
        assert get_resp_cat.status_code == 200, f"Get with category filter failed: {get_resp_cat.status_code} {get_resp_cat.text}"
        items_cat = get_resp_cat.json()
        assert isinstance(items_cat, list), "Get response for category filter is not a list"
        # Ensure that created item with matching category is present
        found = False
        for item in items_cat:
            if item.get("id") == created_id and item.get("category") == create_payload["category"]:
                found = True
                break
        assert found, "Created item missing in filtered category results"

        # Step 3: Update the created autocomplete item
        update_payload = {
            "text": create_payload["text"] + "-updated",
            "category": "medication-updated",
            "dosage": "20mg",
            "frequency": "twice daily"
        }
        update_resp = requests.put(
            f"{BASE_URL}/api/autocomplete-items/{created_id}",
            json=update_payload,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert update_resp.status_code == 200, f"Update failed: {update_resp.status_code} {update_resp.text}"

        # Step 4: Verify update by retrieving filtered by updated category
        params_updated_cat = {"category": "medication-updated"}
        get_resp_updated_cat = requests.get(
            f"{BASE_URL}/api/autocomplete-items",
            headers=HEADERS,
            params=params_updated_cat,
            timeout=TIMEOUT,
        )
        assert get_resp_updated_cat.status_code == 200, f"Get after update failed: {get_resp_updated_cat.status_code} {get_resp_updated_cat.text}"
        items_updated_cat = get_resp_updated_cat.json()
        assert isinstance(items_updated_cat, list), "Get response after update is not a list"
        assert any(item.get("id") == created_id and item.get("text") == update_payload["text"] for item in items_updated_cat), "Updated item missing or incorrect after update"

    finally:
        # Clean up: Delete the created autocomplete entry if exists
        if created_id:
            del_resp = requests.delete(
                f"{BASE_URL}/api/autocomplete-items/{created_id}",
                headers=HEADERS,
                timeout=TIMEOUT,
            )
            assert del_resp.status_code == 200 or del_resp.status_code == 204, f"Delete failed: {del_resp.status_code} {del_resp.text}"


test_verify_autocomplete_system_endpoints()
