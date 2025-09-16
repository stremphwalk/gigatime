import requests
import uuid

BASE_URL = "http://localhost:5002"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json",
}

# Assume bearer token might be needed; modify or add authentication as required
# Example: HEADERS["Authorization"] = "Bearer YOUR_ACCESS_TOKEN"

def verify_note_templates_management():
    template_id = None
    try:
        # 1. Create a new note template
        create_payload = {
            "name": f"Test Template {uuid.uuid4()}",
            "type": "custom",
            "sections": [
                {"title": "History", "content": "Patient history goes here."},
                {"title": "Examination", "content": "Physical exam details."}
            ]
        }
        create_resp = requests.post(f"{BASE_URL}/api/note-templates", json=create_payload, headers=HEADERS, timeout=TIMEOUT)
        assert create_resp.status_code == 200 or create_resp.status_code == 201, f"Template creation failed: {create_resp.text}"
        template = create_resp.json()
        assert "id" in template, "Response missing template ID after creation"
        template_id = template["id"]

        # 2. Retrieve list of note templates and check newly created template presence
        list_resp = requests.get(f"{BASE_URL}/api/note-templates", headers=HEADERS, timeout=TIMEOUT)
        assert list_resp.status_code == 200, f"Failed to list note templates: {list_resp.text}"
        templates = list_resp.json()
        assert any(t.get("id") == template_id for t in templates), "Created template not in listing"

        # 3. Update the created template's name and sections
        updated_payload = {
            "name": f"Updated Test Template {uuid.uuid4()}",
            "type": "custom",
            "sections": [
                {"title": "Updated History", "content": "Updated patient history."},
                {"title": "Updated Examination", "content": "Updated physical exam details."},
                {"title": "New Section", "content": "Additional notes."}
            ]
        }
        update_resp = requests.put(f"{BASE_URL}/api/note-templates/{template_id}", json=updated_payload, headers=HEADERS, timeout=TIMEOUT)
        assert update_resp.status_code == 200, f"Failed to update template: {update_resp.text}"
        updated_template = update_resp.json()
        assert updated_template.get("name") == updated_payload["name"], "Template name was not updated"
        assert isinstance(updated_template.get("sections"), list) and len(updated_template["sections"]) == 3, "Template sections were not updated properly"

    finally:
        # 4. Delete the created template to clean up
        if template_id:
            delete_resp = requests.delete(f"{BASE_URL}/api/note-templates/{template_id}", headers=HEADERS, timeout=TIMEOUT)
            assert delete_resp.status_code == 200 or delete_resp.status_code == 204, f"Failed to delete template: {delete_resp.text}"

verify_note_templates_management()
