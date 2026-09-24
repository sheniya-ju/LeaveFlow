import os
import smtplib
from email.message import EmailMessage


SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587



SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")


def send_email(
    recipient_email: str,
    subject: str,
    body: str
):

    message = EmailMessage()

    message["From"] = SENDER_EMAIL
    message["To"] = recipient_email
    message["Subject"] = subject

    message.set_content(body)


    with smtplib.SMTP(
        SMTP_SERVER,
        SMTP_PORT
    ) as server:

        server.starttls()

        server.login(
            SENDER_EMAIL,
            SENDER_PASSWORD
        )

        server.send_message(message)