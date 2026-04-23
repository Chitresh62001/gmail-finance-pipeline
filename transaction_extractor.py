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
                "mode": "UPI",
                "intent" : intent
            }
        '''else:
            upi_match = re.search(
            r"to\s+(?:VPA\s+)?([a-zA-Z0-9.\-_]+@[a-zA-Z]+)\s+([A-Z ]+?)\s+on\s+\d{2}-\d{2}-\d{2}",
            original_text,
            re.IGNORECASE
            )
            if upi_match:
                name = upi_match.group(2)
                name = re.sub(r"\s+", " ", name).strip()
                return {
                    "amount": amount,
                    "counterparty": name,
                    "mode": "UPI",
                    "intent" : "CC_CREDIT"
                }'''

    # -------------------------
    # Credit card merchant
    # Pattern: towards <MERCHANT> on <date>
    # -------------------------
    if intent == 'CC_SPEND':
        cc_match = re.search(
                    r"towards\s+(.+?)\s+on\s+\d{1,2}\s+[A-Za-z]+(?:,\s*\d{4})?(?:\s+at\s+\d{2}:\d{2}:\d{2})?",
                    original_text
                )

        if cc_match:
            merchant = cc_match.group(1)
            merchant = re.sub(r"\s+", " ", merchant).strip()
            return {
                "amount": amount,
                "counterparty": merchant,
                "mode": "CREDIT_CARD",
                "intent" : intent
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
                "intent" : intent
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
                "mode":mode,
                "intent" : intent
            }

    if intent == 'SALARY_CREDIT':
        # extract salary amount
        salary_match = re.search(r"rs.\s+inr\s([\d,]+(?:\.\d{1,2})?)", text)
        if salary_match:
            salary_amount = float(salary_match.group(1).replace(",", ""))
            return {
                "amount": salary_amount,
                "counterparty": "SALARY",
                "mode": "CREDIT",
                "intent" : intent
            }


    if intent == 'CC_CREDIT':
        original_text = re.sub(r"\s+", " ", original_text)

        upi_match = re.search(
            r"to\s+(?:VPA\s+)?([a-zA-Z0-9.\-_]+@[a-zA-Z]+)\s+([A-Z ]+?)\s+on\s+\d{2}-\d{2}-\d{2}",
            original_text,
            re.IGNORECASE
        )

        if upi_match:
            name = upi_match.group(2)
            name = re.sub(r"\s+", " ", name).strip()
            data = {
                "amount": amount,
                "counterparty": name,
                "mode": "UPI"
            }
            print("Data : ",data)
            return {
                "amount": amount,
                "counterparty": name,
                "mode": "UPI"
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
    text = """Rs.20000 has been debited from account 3333
    to VPA pzcreditcard.44444444@hdfcbank
    PZCREDITCARD on 23-04-26
    """
    extract_transaction_details(text=text ,intent= 'UPI_DEBIT')