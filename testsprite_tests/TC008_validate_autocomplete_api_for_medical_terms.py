import requests
import uuid

BASE_URL = "http://localhost:5002"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}


def test_validate_autocomplete_api_for_medical_terms():
    created_items = []

    def create_autocomplete_item(category, term):
        payload = {
            "category": category,
            "term": term
        }
        resp = requests.post(f"{BASE_URL}/api/autocomplete-items", json=payload, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Create failed for {category} with status {resp.status_code}"
        data = resp.json()
        assert "id" in data, f"No id returned for created {category} item"
        return data

    def get_autocomplete_items(category):
        params = {"category": category}
        resp = requests.get(f"{BASE_URL}/api/autocomplete-items", params=params, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Get failed for {category} with status {resp.status_code}"
        items = resp.json()
        assert isinstance(items, list), f"Expected list for {category} get, got {type(items)}"
        return items

    def update_autocomplete_item(item_id, updated_term):
        resp = requests.put(f"{BASE_URL}/api/autocomplete-items/{item_id}", json={"term": updated_term}, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Update failed for item {item_id} with status {resp.status_code}"

    def delete_autocomplete_item(item_id):
        resp = requests.delete(f"{BASE_URL}/api/autocomplete-items/{item_id}", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Delete failed for item {item_id} with status {resp.status_code}"

    categories = ["medications", "labs", "imaging", "clinical-terms"]

    try:
        # Create an item in each category and verify
        for cat in categories:
            term = f"test-{cat}-{uuid.uuid4().hex[:6]}"
            created = create_autocomplete_item(cat, term)
            created["category"] = cat
            created_items.append(created)
            # Verify item appears in get results
            items = get_autocomplete_items(cat)
            assert any(i.get("id") == created["id"] and i.get("term") == term for i in items), f"Created item not found in get for category {cat}"

        # Update the created items
        for item in created_items:
            updated_term = item["term"] + "-updated"
            update_autocomplete_item(item["id"], updated_term)
            # Verify update
            items = get_autocomplete_items(item.get("category", ""))
            assert any(i.get("id") == item["id"] and i.get("term") == updated_term for i in items), f"Updated item not found for id {item['id']}"

    finally:
        # Cleanup all created items
        for item in created_items:
            try:
                delete_autocomplete_item(item["id"])
            except Exception:
                pass


test_validate_autocomplete_api_for_medical_terms()
