LeaveFlow – Employee Leave Management System

LeaveFlow is a web-based Employee Leave Management System designed to simplify the process of applying, managing, approving, and tracking employee leaves.

The system provides separate functionalities for **Employees, Managers, and Administrators**, with authentication, leave balance management, leave history, holiday management, and email notifications.

## Features

### Employee

- Employee registration and login
- Secure authentication using JWT
- Apply for leave
- Select leave type, start date, end date, and reason
- Automatic calculation of leave days
- Leave balance validation
- Prevention of overlapping leave requests
- View leave history
- View leave balance
- View leave calendar
- Cancel leave requests
- Employee profile management

### Manager

- Manager login
- View employees
- View pending leave requests
- Approve leave requests
- Reject leave requests
- Manage employee-related leave information
- View leave calendars and requests
- Receive email notifications for new leave requests

### Admin

- Admin authentication
- View and manage employees and managers
- Activate or deactivate user accounts
- View employee leave history
- View employee leave balances
- Update employee leave balances
- Manage holidays
- View leave information by month or year
- Manage the overall leave management system

## Leave Management Workflow


Employee
   |
   v
Login / Register
   |
   v
Apply for Leave
   |
   v
Validate Leave Dates & Balance
   |
   v
Leave Request Created
   |
   v
Manager Receives Notification
   |
   +------------------+
   |                  |
   v                  v
Approve             Reject
   |                  |
   v                  v
Update Balance      Update Status


## Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript
* Fetch API
* Local Storage

### Backend

* Python
* FastAPI
* Pydantic
* SQLAlchemy
* Uvicorn

### Database

* PostgreSQL

### Authentication & Security

* JWT authentication
* bcrypt password hashing
* Role-based access control
* Environment variables for sensitive configuration

### Email

* Brevo Transactional Email API
* Python `urllib`
* JSON-based API requests

### Deployment

* GitHub – Source code management
* Netlify – Frontend deployment
* Render – Backend and PostgreSQL deployment

## Project Structure


LeaveFlow/
│
├── backend/
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── requirements.txt
│   │
│   ├── routers/
│   │   ├── auth.py
│   │   ├── leave.py
│   │   ├── manager.py
│   │   ├── admin.py
│   │   ├── holiday.py
│   │   └── holidays.py
│   │
│   └── utils/
│       ├── dependencies.py
│       ├── email.py
│       └── security.py
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   │
│   ├── employee/
│   │   ├── dashboard.html
│   │   ├── apply-leave.html
│   │   ├── leave-history.html
│   │   ├── calendar.html
│   │   └── profile.html
│   │
│   ├── manager/
│   │   ├── dashboard.html
│   │   ├── leave-requests.html
│   │   ├── employees.html
│   │   └── calendar.html
│   │
│   ├── admin/
│   │   ├── dashboard.html
│   │   ├── employees.html
│   │   ├── holidays.html
│   │   └── leave-balances.html
│   │
│   ├── css/
│   └── js/
│
└── README.md


## Database Design

LeaveFlow uses PostgreSQL with SQLAlchemy ORM.

### Main Tables

#### Users

Stores employee, manager, and administrator information.

* id
* name
* email
* password
* role
* is_active
* created_at

#### Leave Requests

Stores employee leave applications.

* id
* user_id
* leave_type
* start_date
* end_date
* days
* reason
* status
* created_at

#### Leave Balances

Stores leave entitlement and usage.

* id
* user_id
* leave_type
* total_days
* used_days
* remaining_days
* year

#### Holidays

Stores company holidays.

* id
* name
* date
* created_at

## API Modules

The FastAPI backend is organized into separate routers:

* `/auth` – Authentication and user registration/login
* `/leave` – Leave application, history, dashboard and leave-related operations
* `/manager` – Manager leave approval and management
* `/admin` – Administrative operations
* `/holiday` – Holiday-related operations
* `/holidays` – Holiday management

The API also provides a `/` endpoint for checking whether the backend is running and a `/me` endpoint for retrieving the authenticated user's profile.

## Authentication

LeaveFlow uses JWT-based authentication.

When a user logs in:

1. The credentials are validated.
2. The password is verified against the bcrypt hash.
3. A JWT access token is generated.
4. The frontend stores the token.
5. The token is sent in the `Authorization` header for protected API requests.

Example:


Authorization: Bearer <access_token>


## Password Security

Passwords are not stored as plain text.

LeaveFlow uses **bcrypt** through Passlib for:

* Password hashing during registration
* Password verification during login

## Email Notifications

LeaveFlow integrates with **Brevo Transactional Email API**.

When an employee submits a leave request, the backend can send an email notification to an active manager.

The email contains:

* Employee details
* Leave type
* Start date
* End date
* Number of days
* Reason
* Leave status

Sensitive values such as the Brevo API key and sender email are loaded from environment variables.

## Environment Variables

The backend requires environment variables for configuration.

Example:


DATABASE_URL=your_database_url
SECRET_KEY=your_secret_key
BREVO_API_KEY=your_brevo_api_key
SENDER_EMAIL=your_verified_sender_email


Do not commit real API keys, passwords, or database credentials to GitHub.

## Running the Project Locally

### Backend

Navigate to the backend folder:

```bash
cd backend
```

Create and activate a virtual environment:

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

Set the required environment variables and make sure PostgreSQL is configured.

Run the FastAPI application:

```bash
uvicorn main:app --reload
```

The API can then be accessed through:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

### Frontend

The frontend is a static HTML, CSS and JavaScript application.

Open the frontend entry page:

```text
frontend/index.html
```

Make sure the JavaScript API URL points to the running backend.

## Deployment

The project can be deployed using:

```text
GitHub
   |
   +---- Frontend --> Netlify
   |
   +---- Backend --> Render
                  |
                  +---- PostgreSQL
                  |
                  +---- Brevo Email API
```

## Validation and Business Rules

LeaveFlow includes validation for:

* Invalid leave date ranges
* Insufficient leave balance
* Duplicate email registration
* Overlapping pending or approved leave requests
* Invalid user status operations
* Invalid leave balance values
* Duplicate holidays
* Unauthorized role-based operations

## Future Improvements

Possible future enhancements include:

* Refresh token authentication
* Advanced reporting and analytics
* Automated yearly leave allocation
* File/document attachment for leave requests
* Push notifications
* Docker containerization
* Automated testing
* CI/CD pipeline

## Project Presentation

The project presentation is available in the repository:

`LeaveFlow [Autosaved].pptx`

