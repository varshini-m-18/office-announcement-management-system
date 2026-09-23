# Office Announcement Management System

## BIZ HACK’26 — PS20

A centralized **Office Announcement Management System** that allows authorized administrators to create, manage, publish, and target announcements to employees based on their department or role.

Employees can view active announcements relevant to them, while administrators can control the complete announcement lifecycle.

---

## Problem Statement

Organizations often share important announcements through multiple channels, making it difficult to manage, target, and track internal communication effectively.

The objective of this project is to build a centralized platform where:

* Authorized users can create announcements with title, content, audience, and publication details.
* Announcements can be targeted to specific departments or roles.
* Employees can view active announcements relevant to them.
* Administrators can edit, publish, deactivate, or remove announcements.
* The system distinguishes between active, inactive, draft, scheduled, and expired announcements.
* Recent announcements can be easily identified.

---

## Solution

The system provides a role-based announcement platform with two main user types:

### Admin

Administrators can:

* Create announcements
* Edit announcements
* Select the target audience
* Publish announcements
* Deactivate announcements
* Delete announcements
* View announcement statuses
* Monitor announcement statistics

### Employee

Employees can:

* Log in securely
* View active announcements
* View announcements targeted to their department or role
* Identify recent announcements
* Automatically receive only announcements relevant to them

---

## Key Features

* 🔐 JWT-based authentication
* 👥 Role-based access control
* 📢 Announcement creation and management
* 🎯 Audience targeting
* 📅 Publication scheduling
* 🟢 Active/inactive status management
* 🔎 Announcement filtering and search
* 📊 Admin dashboard statistics
* 👨‍💼 Separate Admin and Employee dashboards
* 🗄️ Persistent database storage
* 🔄 REST API integration
* 📱 Responsive user interface

---

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Axios

### Backend

* Python
* FastAPI
* Uvicorn
* SQLAlchemy
* JWT Authentication
* bcrypt

### Database

* SQLite

SQLite is used to store users, roles, announcements, audience information, and announcement status data.

---

## System Architecture

```text
                    ┌─────────────────────┐
                    │      React UI       │
                    │  TypeScript + Vite  │
                    └──────────┬──────────┘
                               │
                         REST API / JWT
                               │
                    ┌──────────▼──────────┐
                    │     FastAPI API     │
                    │ Authentication +    │
                    │ Business Logic      │
                    └──────────┬──────────┘
                               │
                         SQLAlchemy
                               │
                    ┌──────────▼──────────┐
                    │       SQLite        │
                    │ Users + Announcements│
                    └─────────────────────┘
```

---

## User Roles

| Role     | Capabilities                                               |
| -------- | ---------------------------------------------------------- |
| Admin    | Create, edit, publish, deactivate and delete announcements |
| Employee | View active announcements relevant to their audience       |

---

## Announcement Lifecycle

```text
Create
  ↓
Draft
  ↓
Publish
  ↓
Active
  ↓
Deactivate
  ↓
Inactive
```

Scheduled announcements can also become active based on their publication time.

---

## Audience Management

Announcements can be targeted to specific audiences.

For example:

```text
Announcement
     │
     ├── Everyone
     ├── IT Department
     ├── HR Department
     └── Specific Role
```

Employees only receive announcements that are both:

1. Currently active
2. Relevant to their department or role

---

## Demo Flow

The main demonstration flow is:

1. Login as Admin.
2. Create an announcement.
3. Select an audience such as IT.
4. Publish the announcement.
5. Login as an IT employee.
6. Verify that the announcement is visible.
7. Login as an HR employee.
8. Verify that the IT announcement is not visible.
9. Return to Admin.
10. Deactivate the announcement.
11. Verify that it is removed from the employee's active feed.

---

## Project Structure

```text
FULLSTACK/
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── test_api.py
├── test_full_flow.py
├── .gitignore
└── README.md
```

---

## Screenshots

### Login Page

![Login Page](screenshots/login.png)

### Admin Dashboard

![Admin Dashboard](screenshots/admin-dashboard.png)

### Create Announcement

![Create Announcement](screenshots/create-announcement.png)

### Employee Dashboard

![Employee Dashboard](screenshots/employee-dashboard.png)

### Announcement Details

![Announcement Details](screenshots/announcement-details.png)

> Add the corresponding screenshots to the `screenshots/` folder using the filenames shown above.

---

## How to Run

### Backend

Open a terminal in the project directory:

```bash
cd backend
```

Create and activate a virtual environment if required:

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload
```

Backend will run at:

```text
http://127.0.0.1:8000
```

---

### Frontend

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the URL shown by Vite, usually:

```text
http://localhost:5173
```

---

## API

The backend provides REST APIs for:

* Authentication
* User authorization
* Announcement listing
* Announcement creation
* Announcement updates
* Announcement publishing
* Announcement deactivation
* Announcement deletion
* Admin dashboard statistics

Authentication is handled using JWT Bearer tokens.

---

## Security

The application implements:

* JWT authentication
* Password hashing using bcrypt
* Role-based authorization
* Protected admin endpoints
* Token-based API access
* Audience-based announcement filtering

Sensitive configuration such as secret keys should be provided through environment variables and should not be committed to the repository.

---

## Testing

The project includes API and full-flow test files:

```text
test_api.py
test_full_flow.py
```

These tests can be used to verify authentication, announcement operations, authorization, and audience filtering.

---

## Hackathon

**Event:** BIZ HACK’26
**Problem Statement:** PS20 — Office Announcement Management System

Built as a Full Stack & Software Development Hackathon project.
