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
    m = re.search(r"rs\.?\s*([\d,]+(?:\.\d{1,2})?)", text)
    if m:
        amount = float(m.group(1).replace(",", ""))

    # -------------------------
    # UPI counterparty
    # Pattern: to <upi_id> <NAME> on <date>
    # -------------------------
    if intent == 'UPI_DEBIT':
        upi_match = re.search(
            r"to\s+[a-z0-9.\-_]+@[a-z]+\s+([A-Z ]+?)\s+on\s+\d{1,2}",
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
            r"towards\s+([A-Z0-9 &._-]+?)\s+on\s+\d{1,2}",
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
        bank_match = re.search(
        r"towards\s+([A-Z0-9 &._/-]+?)\s+with\s+UMRN",
        original_text
    )

        if bank_match:
            name = bank_match.group(1)

            # cleanup (remove trailing codes)
            name = name.split("/")[0].strip()
            return {
                "amount": amount,
                "counterparty": name,
                "mode": "BANK"
            }
        

    if intent == 'BANK_CREDIT':
        bank_match = re.search(r"by\s+([a-zA-Z]+)\s+[a-zA-Z0-9.\-_]+@[a-zA-Z]+\s+([A-Z ]+?)\s+on\s+\d{2}-\d{2}-\d{2}",
                               original_text)
        print(bank_match)
        if bank_match:
            counterparty = bank_match.group(2)
            print('THIS IS FIRST COUNTERPARTY ',counterparty)
            mode = bank_match.group(1)
            print('THIS IS MODE',mode)
            counterparty = re.sub(r"\s+"," ",counterparty).strip()
            print('THIS IS LAST COUNTERPARTY ',counterparty)
            
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
    text = """ DEAR CUSTOMER, RS. 25.00 is succesfully credited to your account 
    **37777 by VPA abc.xyz-2@okicici CHITRESH VIKAS CHOPKAR on 13-04-26
    """
    extract_transaction_details(text=text ,intent= 'BANK_CREDIT')