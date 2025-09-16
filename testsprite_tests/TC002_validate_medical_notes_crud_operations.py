import requests
import uuid

BASE_URL = "http://localhost:5002"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}


def test_validate_medical_notes_crud_operations():
    # Helper function to create a note payload with some fields
    def create_note_payload():
        return {
            "title": "Test Medical Note " + str(uuid.uuid4()),
            "content": "Initial note content for testing.",
            "tags": ["test", "medical", "note"]
        }

    # Create a new medical note
    note = None
    note_id = None
    try:
        note_payload = create_note_payload()
        response = requests.post(
            f"{BASE_URL}/api/notes", json=note_payload, headers=HEADERS, timeout=TIMEOUT
        )
        assert response.status_code == 200, f"Create note failed: {response.text}"
        note = response.json()
        assert "id" in note, "Response missing note ID"
        note_id = note["id"]

        # Retrieve the created note
        resp_get = requests.get(
            f"{BASE_URL}/api/notes/{note_id}", headers=HEADERS, timeout=TIMEOUT
        )
        assert resp_get.status_code == 200, f"Get note failed: {resp_get.text}"
        retrieved_note = resp_get.json()
        assert retrieved_note["id"] == note_id, "Retrieved note ID mismatch"
        assert retrieved_note["title"] == note_payload["title"], "Note title mismatch"
        assert "content" in retrieved_note, "Note content missing"
        assert isinstance(retrieved_note["content"], str), "Note content is not a string"
        assert "tags" in retrieved_note and isinstance(retrieved_note["tags"], list), "Tags missing or not list"

        # Update the note content and title
        updated_content = retrieved_note["content"] + "\nAdded follow-up details."
        update_payload = {
            "title": retrieved_note["title"] + " - Updated",
            "content": updated_content,
            "tags": retrieved_note.get("tags", []) + ["updated"]
        }
        resp_update = requests.put(
            f"{BASE_URL}/api/notes/{note_id}", json=update_payload, headers=HEADERS, timeout=TIMEOUT
        )
        assert resp_update.status_code == 200, f"Update note failed: {resp_update.text}"

        # Retrieve again to verify updates
        resp_get_updated = requests.get(
            f"{BASE_URL}/api/notes/{note_id}", headers=HEADERS, timeout=TIMEOUT
        )
        assert resp_get_updated.status_code == 200, f"Get updated note failed: {resp_get_updated.text}"
        updated_note = resp_get_updated.json()
        assert updated_note["title"] == update_payload["title"], "Updated note title mismatch"
        assert updated_note["content"] == updated_content, "Updated note content mismatch"
        assert "updated" in updated_note.get("tags", []), "Updated tags missing"

        # Get user notes to verify note is listed
        resp_search = requests.get(
            f"{BASE_URL}/api/notes",
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp_search.status_code == 200, f"Search notes failed: {resp_search.text}"
        notes_list = resp_search.json()
        assert isinstance(notes_list, list), "Notes search result is not a list"
        assert any(n.get("id") == note_id for n in notes_list), "Created note not found in notes list"

    finally:
        # Cleanup: delete created note if exists
        if note_id:
            resp_del = requests.delete(
                f"{BASE_URL}/api/notes/{note_id}", headers=HEADERS, timeout=TIMEOUT
            )
            assert resp_del.status_code == 200, f"Delete note failed: {resp_del.text}"


test_validate_medical_notes_crud_operations()
