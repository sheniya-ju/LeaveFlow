
import os
import json
import urllib.request
import urllib.error


SENDER_EMAIL = os.getenv("SENDER_EMAIL")
BREVO_API_KEY = os.getenv("BREVO_API_KEY")


def send_email(
    recipient_email: str,
    subject: str,
    body: str
):
    url = "https://api.brevo.com/v3/smtp/email"

    payload = {
        "sender": {
            "name": "LeaveFlow",
            "email": SENDER_EMAIL
        },
        "to": [
            {
                "email": recipient_email
            }
        ],
        "subject": subject,
        "textContent": body
    }

    data = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(
        url,
        data=data,
        headers={
            "api-key": BREVO_API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=30
        ) as response:

            print(
                "Brevo email sent:",
                response.status
            )

    except urllib.error.HTTPError as e:
        error = e.read().decode(
            "utf-8",
            errors="replace"
        )

        print(
            "Brevo email failed:",
            e.code,
            error
        )

        raise

    except Exception as e:
        print(
            "Email notification failed:",
            str(e)
        )

        raise