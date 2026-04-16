# transaction_extractor.py

import re
from typing import Optional, Dict


def extract_transaction_details(text: str,intent : str) -> Dict[str, Optional[str]]:
    """
    Unified extractor for:
    - UPI debit
    - Credit card spend
    """

    if not text:
        return {"amount": None, "counterparty": None, "mode": None}

    original_text = text
    text = text.lower()

    # -------------------------
    # Amount (common)
    # -------------------------
    amount = None
    if intent != 'INVESTMENT_DEBIT':
        m = re.search(r"rs.?\s*([\d,]+(?:\.\d{1,2})?)", text)
    else:
        m = None

    if m:
        amount = float(m.group(1).replace(",", ""))

    # -------------------------
    # UPI counterparty
    # Pattern: to <upi_id> <NAME> on <date>
    # -------------------------
    if intent == 'UPI_DEBIT':
        upi_match = re.search(
            r"to\s+[a-z0-9.\-_]+@[a-z]+\s+([A-Za-z ]+?)\s+on\s+\d{1,2}",
            original_text
        )

        if upi_match:
            name = upi_match.group(1)
            name = re.sub(r"\s+", " ", name).strip()
            return {
                "amount": amount,
                "counterparty": name,
                "mode": "UPI"
            }

    # -------------------------
    # Credit card merchant
    # Pattern: towards <MERCHANT> on <date>
    # -------------------------
    if intent == 'CC_SPEND':
        cc_match = re.search(
            r"towards\s+([A-Za-z0-9 &._-]+?)\s+on\s+\d{1,2}",
            original_text
        )

        if cc_match:
            merchant = cc_match.group(1)
            merchant = re.sub(r"\s+", " ", merchant).strip()
            return {
                "amount": amount,
                "counterparty": merchant,
                "mode": "CREDIT_CARD"
            }
        
    if intent == 'INVESTMENT_DEBIT':
        clean_text = re.sub(r"\s+", " ", original_text)
        
        # extract numbers (amount, units, nav)
        numbers = re.findall(r"\d+\.\d+", clean_text)
        
        if len(numbers) >= 3:
            amount = float(numbers[0])

            # fund name = text before amount
            fund_match = re.search(
                r"NAV\s+([A-Za-z0-9 \-]+?)\s+" + re.escape(numbers[0]),
                clean_text
            )

            fund_name = fund_match.group(1).strip() if fund_match else None

            return {
                "amount": amount,
                "counterparty": fund_name,
                "mode": "INVESTMENT",
            }
        
    if intent == 'BANK_CREDIT':
        bank_match = re.search(
            r"by\s+([a-zA-Z]+)\s+[a-zA-Z0-9.\-_]+@[a-zA-Z]+\s+([A-Z ]+?)\s+on\s+\d{2}-\d{2}-\d{2}",
            original_text
        )
        if bank_match:
            counterparty = bank_match.group(2)
            mode = bank_match.group(1)
            counterparty = re.sub(r"\s+"," ",counterparty).strip()
            return {
                "amount":amount,
                "counterparty":counterparty,
                "mode":mode
            }

    # -------------------------
    # Fallback (unknown format)
    # -------------------------
    return {
        "amount": amount,
        "counterparty": None,
        "mode": None
    }


if __name__ == '__main__':
    text = """ Fund name SIP amount Units credited NAV Nippon India Growth Mid Cap Fund - Direct Plan - Growth Mid Cap 799.96 0.174 4603.6735 NEXT STEPS: Order Placed:  Order placed by you on our platform Order Processed by the Exchange:  This will take up to one working day Mutual Funds Units Credited:  This takes up to T+3 (Trade + 3 working days) Important next step: For the next SIP amount to be deducted automatically from your bank account, complete the mandate process (if you haven?t already) by following these steps: How to automate Mutual Fund SIPs?  Thank you for choosing us for your investment needs! Happy Investing, Team Upstox Follow us on: Available on: Copyright © 2025 Upstox, All rights reserved. Sunshine Tower, 30th Floor, Senapati Bapat Marg, Dadar West, Mumbai 400013, Maharashtra, India.  The information in this email is only for consumption by the client and such material should not be redistributed. About Us  |   Help Center  |  Disclosures and Disclaimer  | Don't like these emails?  Unsubscribe
    """
    extract_transaction_details(text=text ,intent= 'INVESTMENT_DEBIT')