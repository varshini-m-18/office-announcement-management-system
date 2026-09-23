import urllib.request
import json
import sys

def test_api():
    base_url = "http://127.0.0.1:8000"

    def post(path, data, token=None):
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        req = urllib.request.Request(f"{base_url}{path}", data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())

    def get(path, token=None):
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        req = urllib.request.Request(f"{base_url}{path}", headers=headers, method="GET")
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())

    # 1. Admin login
    admin_auth = post("/api/auth/login", {"email": "admin@demo.com", "password": "Admin@123"})
    print("SUCCESS: Admin logged in:", admin_auth["user"]["name"])
    admin_token = admin_auth["access_token"]

    # 2. IT Employee login
    it_auth = post("/api/auth/login", {"email": "it.employee@demo.com", "password": "Employee@123"})
    print("SUCCESS: IT Employee logged in:", it_auth["user"]["name"])
    it_token = it_auth["access_token"]

    # 3. HR Employee login
    hr_auth = post("/api/auth/login", {"email": "hr.employee@demo.com", "password": "Employee@123"})
    print("SUCCESS: HR Employee logged in:", hr_auth["user"]["name"])
    hr_token = hr_auth["access_token"]

    # 4. Check audience filtering
    it_announcements = get("/api/announcements", it_token)
    hr_announcements = get("/api/announcements", hr_token)

    print(f"\nIT Employee sees {len(it_announcements)} active announcements:")
    for a in it_announcements:
        print(f"  - [{a['audience_type']} / {a['audience_value']}] {a['title']} ({a['priority']})")

    print(f"\nHR Employee sees {len(hr_announcements)} active announcements:")
    for a in hr_announcements:
        print(f"  - [{a['audience_type']} / {a['audience_value']}] {a['title']} ({a['priority']})")

    # 5. Admin Stats
    stats = get("/api/admin/dashboard/stats", admin_token)
    print("\nAdmin Dashboard Stats:", stats)

if __name__ == "__main__":
    test_api()
