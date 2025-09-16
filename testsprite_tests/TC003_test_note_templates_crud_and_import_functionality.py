import requests
import uuid

BASE_URL = "http://localhost:5002"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30


def test_note_templates_crud_and_import_functionality():
    created_template_id = None
    # Step 1: Create a new note template
    create_payload = {
        "title": f"Test Template {uuid.uuid4()}",
        "category": "General",
        "content": {"text": "Initial template content for testing."},
        "description": "Template created for automated test TC003"
    }
    try:
        create_resp = requests.post(
            f"{BASE_URL}/api/note-templates",
            json=create_payload,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert create_resp.status_code == 200, f"Failed to create template: {create_resp.text}"
        created_template = create_resp.json()
        # Validate created template has an ID
        created_template_id = created_template.get("id")
        assert isinstance(created_template_id, str) and created_template_id, "Created template missing or invalid 'id'"

        # Step 2: Update the created note template
        update_payload = {
            "title": create_payload["title"] + " - Updated",
            "category": "General",
            "content": {"text": "Updated template content."},
            "description": "Template updated as part of test TC003"
        }
        update_resp = requests.put(
            f"{BASE_URL}/api/note-templates/{created_template_id}",
            json=update_payload,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert update_resp.status_code == 200, f"Failed to update template: {update_resp.text}"
        updated_template = update_resp.json()
        assert updated_template.get("title") == update_payload["title"], "Title not updated correctly"
        assert updated_template.get("category") == update_payload["category"], "Category not updated correctly"
        # Assuming content is an object with 'text' field
        assert isinstance(updated_template.get("content"), dict) and updated_template["content"].get("text") == update_payload["content"]["text"], "Content not updated correctly"

        # Step 3: Get list of note templates with optional category filtering
        get_resp = requests.get(
            f"{BASE_URL}/api/note-templates",
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert get_resp.status_code == 200, f"Failed to get templates: {get_resp.text}"
        templates_list = get_resp.json()
        # Check the updated template is in the list
        found = any(t.get("id") == created_template_id for t in templates_list)
        assert found, "Updated template not found in templates list"

        # Step 4: Import template by shareable ID
        # Use the created template's id as shareableId to import it (assuming shareableId equals id)
        import_payload = {"shareableId": created_template_id}
        import_resp = requests.post(
            f"{BASE_URL}/api/note-templates/import",
            json=import_payload,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert import_resp.status_code == 200, f"Failed to import template: {import_resp.text}"
        imported_template = import_resp.json()
        # Validate imported template content has 'id' and 'title'
        assert isinstance(imported_template.get("id"), str) and imported_template.get("id"), "Imported template missing or invalid id"
        assert imported_template.get("title") == update_payload["title"] or imported_template.get("title") == create_payload["title"], "Imported template title mismatch"

    finally:
        # Step 5: Clean up: delete the created template
        if created_template_id:
            delete_resp = requests.delete(
                f"{BASE_URL}/api/note-templates/{created_template_id}",
                headers=HEADERS,
                timeout=TIMEOUT,
            )
            # Accept either 200 or 204 as successful deletion response codes
            assert delete_resp.status_code in (200, 204), f"Failed to delete template: {delete_resp.text}"


test_note_templates_crud_and_import_functionality()
