import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from transaction_extractor import extract_transaction_details
from investment_rag import investment_rag_decision
from finance_rag import finance_rag_decision
from producer import send_transaction
from bs4 import BeautifulSoup
from datetime import datetime
import time
import base64
import re



SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

ACCOUNTS = {
    "investment": {
        "token": "token_investment.json",
        "rag": investment_rag_decision,
        "query": "from:upstox OR trading OR order"
    },
    "finance": {
        "token": "token_finance.json",
        "rag": finance_rag_decision,
        "query": "upi OR credit card OR debit OR credited"
    }
}
def parse_gmail_date(date_str):
    # remove (IST) or any timezone in brackets
    date_str = re.sub(r"\s*\(.*?\)", "", date_str)
    return date_str.strip()

def authenticate(token_file):
    creds = None
    if os.path.exists(token_file):
        creds = Credentials.from_authorized_user_file(token_file, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "credentials.json", SCOPES
            )
            creds = flow.run_local_server(port=0)

        with open(token_file, "w") as f:
            f.write(creds.to_json())

    return creds


def get_email_body(msg_data):
    payload = msg_data.get("payload", {})

    def extract_parts(parts):
        for part in parts:
            mime = part.get("mimeType")

            # 🔥 Prefer HTML
            if mime == "text/html":
                data = part["body"].get("data")
                if data:
                    return base64.urlsafe_b64decode(data).decode("utf-8")

            # fallback plain text
            if mime == "text/plain":
                data = part["body"].get("data")
                if data:
                    return base64.urlsafe_b64decode(data).decode("utf-8")

            # recursive (important)
            if part.get("parts"):
                result = extract_parts(part["parts"])
                if result:
                    return result

        return None

    return extract_parts(payload.get("parts", [])) or ""

def html_to_text(html):
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text(separator=" ")

def read_account(account_key, max_results=10):
    acc = ACCOUNTS[account_key]
    creds = authenticate(acc["token"])
    service = build("gmail", "v1", credentials=creds)
    # Start of current month
    start_of_month = datetime.now().replace(day=1).strftime("%Y/%m/%d")

    # Current timestamp (now)
    now_ts = int(time.time())

    query = f"{acc['query']} after:{start_of_month} before:{now_ts}"
    results = service.users().messages().list(
        userId="me",
        q=query,
        maxResults=max_results
    ).execute()
    txn_data = []
    for msg in results.get("messages", []):
        msg_data = service.users().messages().get(
            userId="me",
            id=msg["id"],
            format="full"
        ).execute()
#metadataHeaders=["From", "Subject", "Date"]
        headers = {h["name"]: h["value"] for h in msg_data["payload"]["headers"]}
        subject = headers.get("Subject", "")

        intent = acc["rag"](subject)
        body = get_email_body(msg_data=msg_data)
        clean_text = html_to_text(body)
        text = subject + ' ' + clean_text
        if intent != 'UNKNOWN':
            transaction_details = extract_transaction_details(text,intent)
            data = {"Account": account_key.upper(),
                "From": headers.get("From"),
                "Subject": subject,
                "Intent": intent,
                "Date": parse_gmail_date(headers.get("Date")),
                "Amount": transaction_details['amount'],
                "Recipent": transaction_details['counterparty']
        }

            print("Sending to Kafka:", data)

        # ✅ SEND EACH MESSAGE
            send_transaction(data)

            #txn_data.append(data)

    return txn_data
if __name__ == "__main__":
    #txn_data_investment = read_account("investment", max_results=50)
    txn_data_finance = read_account("finance", max_results=50)
    #txn_data = txn_data_investment.extend(txn_data_finance)
    #print(txn_data)
    #print("Sending to Kafka:", txn_data)
    #send_transaction(txn_data)
