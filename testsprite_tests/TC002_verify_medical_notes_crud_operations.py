import requests
import uuid

BASE_URL = "http://localhost:5002"
TIMEOUT = 30

# Simulated helper function for obtaining an auth token (adjust as needed)
def get_auth_token():
    # For testing purposes, assume an environment variable or a fixed token is used
    # Replace this with actual auth flow if available
    return "Bearer testauthtoken1234567890abcdef"

def test_verify_medical_notes_crud_operations():
    headers = {
        "Authorization": get_auth_token(),
        "Content-Type": "application/json"
    }

    note_id = None
    try:
        # 1. Create a new medical note
        create_payload = {
            "title": "Test Note " + str(uuid.uuid4()),
            "patientName": "John Doe",
            "content": {
                "subjective": "Patient complains of headache.",
                "objective": "Blood pressure normal.",
                "assessment": "Tension headache.",
                "plan": "Rest and hydration."
            }
        }
        create_response = requests.post(
            f"{BASE_URL}/api/notes",
            json=create_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert create_response.status_code == 201 or create_response.status_code == 200, f"Create note failed: {create_response.text}"
        create_data = create_response.json()
        assert "id" in create_data, "Created note response missing 'id'"
        note_id = create_data["id"]

        # 2. Retrieve the created note by ID
        get_response = requests.get(
            f"{BASE_URL}/api/notes/{note_id}",
            headers=headers,
            timeout=TIMEOUT
        )
        assert get_response.status_code == 200, f"Get note failed: {get_response.text}"
        get_data = get_response.json()
        assert get_data.get("title") == create_payload["title"]
        assert get_data.get("patientName") == create_payload["patientName"]
        assert isinstance(get_data.get("content"), dict) and get_data["content"], "Content missing or invalid"

        # 3. Update the note
        update_payload = {
            "title": create_payload["title"] + " Updated",
            "patientName": "John Doe Updated",
            "content": {
                "subjective": "Patient complains of mild headache.",
                "objective": "Blood pressure slightly elevated.",
                "assessment": "Mild tension headache.",
                "plan": "Continue rest and hydration, monitor."
            }
        }
        update_response = requests.put(
            f"{BASE_URL}/api/notes/{note_id}",
            json=update_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert update_response.status_code == 200, f"Update note failed: {update_response.text}"

        # 4. Retrieve again to verify update
        get_updated_response = requests.get(
            f"{BASE_URL}/api/notes/{note_id}",
            headers=headers,
            timeout=TIMEOUT
        )
        assert get_updated_response.status_code == 200, f"Get updated note failed: {get_updated_response.text}"
        updated_data = get_updated_response.json()
        assert updated_data.get("title") == update_payload["title"]
        assert updated_data.get("patientName") == update_payload["patientName"]
        assert updated_data.get("content").get("subjective") == update_payload["content"]["subjective"]

        # 5. List all notes - confirm the note is present
        list_response = requests.get(
            f"{BASE_URL}/api/notes",
            headers=headers,
            timeout=TIMEOUT
        )
        assert list_response.status_code == 200, f"List notes failed: {list_response.text}"
        notes_list = list_response.json()
        assert any(note.get("id") == note_id for note in notes_list), "Created note not found in notes list"

    finally:
        if note_id:
            delete_response = requests.delete(
                f"{BASE_URL}/api/notes/{note_id}",
                headers=headers,
                timeout=TIMEOUT
            )
            # Accept 200 or 204 as successful deletion
            assert delete_response.status_code in (200, 204), f"Delete note failed: {delete_response.text}"

test_verify_medical_notes_crud_operations()