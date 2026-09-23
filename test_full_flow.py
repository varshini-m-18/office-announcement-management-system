import urllib.request
import urllib.error
import json
import sys

base_url = "http://127.0.0.1:8000"

def post(path, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{base_url}{path}", data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode()), resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return json.loads(body) if body else {}, e.code

def get(path, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{base_url}{path}", headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode()), resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return json.loads(body) if body else {}, e.code

def delete(path, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{base_url}{path}", headers=headers, method="DELETE")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode()), resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return json.loads(body) if body else {}, e.code

def put(path, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{base_url}{path}", data=json.dumps(data).encode("utf-8"), headers=headers, method="PUT")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode()), resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return json.loads(body) if body else {}, e.code

def chk(test_name, condition, detail=""):
    if condition:
        print(f"  PASS: {test_name}")
    else:
        print(f"  FAIL: {test_name} {detail}")

print("=" * 60)
print("FULL DEMO FLOW VERIFICATION")
print("=" * 60)

# 1. Login all accounts
print("\n[1] Authentication Tests")
admin_res, status = post("/api/auth/login", {"email": "admin@demo.com", "password": "Admin@123"})
chk("Admin login returns 200", status == 200)
chk("Admin role is 'admin'", admin_res.get("user", {}).get("role") == "admin")
admin_token = admin_res.get("access_token")

it_res, status = post("/api/auth/login", {"email": "it.employee@demo.com", "password": "Employee@123"})
chk("IT Employee login returns 200", status == 200)
chk("IT Employee dept is IT", it_res.get("user", {}).get("department") == "IT")
it_token = it_res.get("access_token")

hr_res, status = post("/api/auth/login", {"email": "hr.employee@demo.com", "password": "Employee@123"})
chk("HR Employee login returns 200", status == 200)
chk("HR Employee dept is HR", hr_res.get("user", {}).get("department") == "HR")
hr_token = hr_res.get("access_token")

wrong_res, status = post("/api/auth/login", {"email": "admin@demo.com", "password": "WrongPassword"})
chk("Wrong password returns 401", status == 401)

# 2. RBAC: Employees cannot do admin operations
print("\n[2] RBAC (Security) Tests")
emp_create_res, status = post("/api/announcements", {
    "title": "Test", "content": "Test", "priority": "normal",
    "audience_type": "everyone", "audience_value": "everyone"
}, token=it_token)
chk("Employee cannot create announcement (403)", status == 403)

# 3. Admin creates IT announcement  
print("\n[3] Admin Create & Publish Tests (Demo Flow)")
create_res, status = post("/api/announcements", {
    "title": "Server Maintenance Tonight",
    "content": "IT servers will undergo maintenance from 10 PM to 11 PM.",
    "priority": "urgent",
    "audience_type": "department",
    "audience_value": "IT",
    "is_draft": False
}, token=admin_token)
chk("Admin creates IT announcement (201)", status == 201)
new_id = create_res.get("id")
chk("Announcement status is 'active'", create_res.get("status") == "active")
chk("Announcement priority is 'urgent'", create_res.get("priority") == "urgent")
chk("Announcement audience is IT dept", create_res.get("audience_value") == "IT")
print(f"  INFO: Created announcement ID={new_id}")

# 4. Audience filtering verification
print("\n[4] Audience Filtering Tests")
it_list, status = get("/api/announcements", token=it_token)
chk("IT Employee endpoint returns 200", status == 200)
it_titles = [a.get("title") for a in it_list]
chk("Server Maintenance visible to IT employee", "Server Maintenance Tonight" in it_titles)

hr_list, status = get("/api/announcements", token=hr_token)
hr_titles = [a.get("title") for a in hr_list]
chk("Server Maintenance NOT visible to HR employee", "Server Maintenance Tonight" not in hr_titles)

# 5. Admin dashboard stats
print("\n[5] Admin Dashboard Stats")
stats, status = get("/api/admin/dashboard/stats", token=admin_token)
chk("Stats endpoint returns 200", status == 200)
chk("Stats has all fields", all(k in stats for k in ["total", "active", "scheduled", "draft", "inactive", "expired"]))
print(f"  INFO: {stats}")

# 6. Admin can view all announcements
print("\n[6] Admin Announcement Listing")
admin_list, status = get("/api/announcements", token=admin_token)
chk("Admin sees all announcements (200)", status == 200)
chk("Admin sees more than employee (draft, inactive)", len(admin_list) >= len(it_list))

# 7. Edit announcement
print("\n[7] Edit Announcement")
edit_res, status = put(f"/api/announcements/{new_id}", {
    "title": "Server Maintenance Tonight (Updated)",
    "content": "IT servers will undergo maintenance from 10 PM to 11 PM. Extended to midnight."
}, token=admin_token)
chk("Admin can edit announcement (200)", status == 200)
chk("Title updated", edit_res.get("title", "").endswith("(Updated)"))

# Verify IT employee still sees it
it_list2, _ = get("/api/announcements", token=it_token)
it_titles2 = [a.get("title") for a in it_list2]
chk("IT employee still sees updated announcement", "Server Maintenance Tonight (Updated)" in it_titles2)

# 8. Deactivate announcement
print("\n[8] Deactivate Announcement (Demo Step 8)")
deact_res, status = post(f"/api/announcements/{new_id}/deactivate", {}, token=admin_token)
chk("Admin can deactivate announcement (200)", status == 200)
chk("Status is now 'inactive'", deact_res.get("status") == "inactive")

# 9. After deactivation, IT employee should NOT see it
print("\n[9] Post-Deactivation Visibility")
it_list3, _ = get("/api/announcements", token=it_token)
it_titles3 = [a.get("title") for a in it_list3]
chk("IT employee cannot see deactivated announcement", "Server Maintenance Tonight (Updated)" not in it_titles3)

# 10. Re-publish and verify visible again
print("\n[10] Re-publish Announcement")
pub_res, status = post(f"/api/announcements/{new_id}/publish", {}, token=admin_token)
chk("Admin can re-publish announcement (200)", status == 200)
chk("Status is now 'active' again", pub_res.get("status") == "active")

it_list4, _ = get("/api/announcements", token=it_token)
it_titles4 = [a.get("title") for a in it_list4]
chk("IT employee can see re-published announcement", "Server Maintenance Tonight (Updated)" in it_titles4)

# 11. Save as draft test
print("\n[11] Draft Announcement Test")
draft_res, status = post("/api/announcements", {
    "title": "Draft Test Announcement",
    "content": "This is a draft",
    "priority": "normal",
    "audience_type": "everyone",
    "audience_value": "everyone",
    "is_draft": True
}, token=admin_token)
chk("Admin can save draft (201)", status == 201)
chk("Draft status is 'draft'", draft_res.get("status") == "draft")
draft_id = draft_res.get("id")

# Employees should NOT see drafts
it_list5, _ = get("/api/announcements", token=it_token)
it_titles5 = [a.get("title") for a in it_list5]
chk("IT employee cannot see drafts", "Draft Test Announcement" not in it_titles5)

# 12. Delete cleanup
print("\n[12] Delete Announcements (Cleanup)")
del_res, status = delete(f"/api/announcements/{new_id}", token=admin_token)
chk("Admin can delete announcement (200)", status == 200)
del_res2, status = delete(f"/api/announcements/{draft_id}", token=admin_token)
chk("Admin can delete draft (200)", status == 200)

# 13. Employee cannot delete
emp_del_res, status = delete(f"/api/announcements/1", token=it_token)
chk("Employee cannot delete announcement (403)", status == 403)

print("\n" + "=" * 60)
print("DEMO FLOW COMPLETE")
print("=" * 60)
