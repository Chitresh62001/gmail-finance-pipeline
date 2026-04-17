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
    elif intent == 'BANK_CREDIT':
        m = re.search(r"inr\s([\d,]+(?:\.\d{1,2})?)", text)
        ## OVERRIDE INTENT WITH SALARY_CREDIT
        print("Match",m)
        print("Intent : ",intent)
        intent = 'SALARY_CREDIT'
        print("Intent : ",intent)
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

    if intent == 'SALARY_CREDIT':
        # extract salary amount
        salary_match = re.search(r"rs.\s+inr\s([\d,]+(?:\.\d{1,2})?)", text)
        if salary_match:
            salary_amount = float(salary_match.group(1).replace(",", ""))
            data = {
                "amount": salary_amount,
                "counterparty": "SALARY",
                "mode": "CREDIT",
            }

            print("Data : ",data)
            return {
                "amount": salary_amount,
                "counterparty": "SALARY",
                "mode": "CREDIT",
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
    text = """DEAR CUSTOMER, GREETINGS FROM HDFC BANK ! YOUR SALARY OF RS. INR 60000.00 has been credited to your account ENDING X3777 on 27-MAR-2026 from CDAC-CDAC"
    """
    extract_transaction_details(text=text ,intent= 'BANK_CREDIT')