# read_gmail.py

import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from transaction_extractor import extract_transaction_details
from investment_rag import investment_rag_decision
from finance_rag import finance_rag_decision
from producer import send_transaction



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


def read_account(account_key, max_results=10):
    acc = ACCOUNTS[account_key]
    creds = authenticate(acc["token"])
    service = build("gmail", "v1", credentials=creds)

    results = service.users().messages().list(
        userId="me",
        q=acc["query"],
        maxResults=max_results
    ).execute()
    if account_key == 'investment':
        txn_data_investment = []
    elif account_key == 'finance':
        txn_data_finance = []
    txn_data = []
    for msg in results.get("messages", []):
        msg_data = service.users().messages().get(
            userId="me",
            id=msg["id"],
            format="metadata",
            metadataHeaders=["From", "Subject", "Date"]
        ).execute()

        headers = {h["name"]: h["value"] for h in msg_data["payload"]["headers"]}
        subject = headers.get("Subject", "")

        intent = acc["rag"](subject)
        snippet = msg_data.get("snippet", "")
        transaction_details = extract_transaction_details(snippet,intent)
        if intent != 'UNKNOWN':
            data = {"Account": account_key.upper(),
                "From": headers.get("From"),
                "Subject": subject,
                "Intent": intent,
                "Date": headers.get("Date"),
                "Amount": transaction_details['amount'],
                "Recipent": transaction_details['counterparty']
        }

            #print("Sending to Kafka:", data)

        # ✅ SEND EACH MESSAGE
            send_transaction(data)

            txn_data.append(data)

    return txn_data
if __name__ == "__main__":
    txn_data_investment = read_account("investment", max_results=10)
    txn_data_finance = read_account("finance", max_results=10)
    #txn_data = txn_data_investment.extend(txn_data_finance)
    #print(txn_data)
    #print("Sending to Kafka:", txn_data)
    #send_transaction(txn_data)
