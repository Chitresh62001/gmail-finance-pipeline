# transaction_extractor.py

import re
from typing import Optional, Dict


def clean_merchant(name):
    name = name.lower()

    # remove domain parts
    name = re.sub(r"www\.", "", name)
    name = re.sub(r"\.com.*", "", name)

    return name.upper()

def extract_transaction_details(text: str,intent : str) -> Dict[str, Optional[str]]:
    """
    Unified extractor for:
    - UPI debit
    - Credit card spend
    """

    if not text:
        return {"amount": None, "counterparty": None, "mode": None}
    
    original_text = text
    original_text = re.sub(r"[,\n]+", " ", original_text)
    original_text = re.sub(r"\s+", " ", original_text)
    text = text.lower()

    # -------------------------
    # Amount (common)
    # -------------------------
    amount = None
    if intent == 'BANK_CREDIT':
        m = re.search(r"inr\s+([\d,]+(?:\.\d{1,2})?)", text)
        if m:
            intent = "SALARY_CREDIT"
        else:
            m = re.search(r"rs.?\s*([\d,]+(?:\.\d{1,2})?)", text)
    elif intent != 'INVESTMENT_DEBIT':
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
            r"to\s+[A-Za-z0-9.\-_]+@[a-zA-Z]+\s+([A-Za-z0-9.\-_ ]+?)\s+on\s+\d{1,2}",
            original_text,re.IGNORECASE
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
        else:
            upi_match = re.search(
            r"vpa\s+([a-zA-Z0-9.\-_]+@[a-zA-Z]+)\s+([A-Za-z ]+?)\s+on\s+\d{2}-\d{2}-\d{2}",
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
                }

    # -------------------------
    # Credit card merchant
    # Pattern: towards <MERCHANT> on <date>
    # -------------------------
    if intent == 'CC_SPEND':
        original_text = re.sub(r"[,\n]+", " ", original_text)
        original_text = re.sub(r"\s+", " ", original_text)
        cc_match = re.search(
                    r"towards\s+(.+?)\s+on\s+\d{1,2}\s+[A-Za-z]+(?:,\s*\d{4})?(?:\s+at\s+\d{2}:\d{2}:\d{2})?",
                    original_text
                    )

        if cc_match:
            merchant = cc_match.group(1)
            merchant = re.sub(r"\s+", " ", merchant).strip()
            merchant = clean_merchant(merchant)
            return {
                "amount": amount,
                "counterparty": merchant,
                "mode": "CREDIT_CARD",
                "intent" : intent
            }

    if intent == 'INVESTMENT_DEBIT':
        clean_text = re.sub(r"\s+", " ", original_text)

        # Try to find fund name near NAV or amount
        # Pattern: <Fund Name> ... RS <Amount>
        fund_name = None
        
        # Try finding fund name before amount
        m = re.search(r"([A-Za-z0-9][A-Za-z0-9 \-&]+(?:Fund|Plan|Growth|Equity|Nifty|Sensex)[A-Za-z0-9 \-&]*?)\s+(?:Rs|Inr|Amount)", original_text, re.IGNORECASE)
        if m:
            fund_name = m.group(1).strip()
        
        # Fallback to the NAV pattern
        if not fund_name:
            numbers = re.findall(r"\d+\.\d+", clean_text)
            if numbers:
                amount = float(numbers[0])
                fund_match = re.search(
                    r"(?:NAV|Fund|Scheme)\s+([A-Za-z0-9 \-]+?)\s+" + re.escape(str(numbers[0])),
                    clean_text, re.IGNORECASE
                )
                if fund_match:
                    fund_name = fund_match.group(1).strip()

        # If still None, look for anything that looks like a Fund name in the whole text
        if not fund_name:
            m = re.search(r"([A-Za-z0-9 \-&]+(?:Index Fund|Direct Plan|Growth Plan|Nifty 50|Sensex|Midcap|Smallcap)[A-Za-z0-9 \-&]*)", original_text, re.IGNORECASE)
            if m:
                fund_name = m.group(1).strip()

        return {
            "amount": amount,
            "counterparty": fund_name if fund_name else "UPSTOX INVESTMENT",
            "mode": "INVESTMENT",
            "intent" : intent
        }

    if intent == 'FUNDS_ADDED':
        # Pattern: Rs. <Amount> ... added successfully
        m = re.search(r"rs.?\s*([\d,]+(?:\.\d{1,2})?)", text)
        if m:
            amount = float(m.group(1).replace(",", ""))
        return {
            "amount": amount,
            "counterparty": "UPSTOX WALLET",
            "mode": "TRANSFER",
            "intent": intent
        }

    if intent == 'BANK_CREDIT':
        original_text = re.sub(r"[,\n]+", " ", original_text)
        original_text = re.sub(r"\s+", " ", original_text)
        bank_match = re.search(
            r"by\s+([a-zA-Z]+)\s+[a-zA-Z0-9.\-_]+@[a-zA-Z]+\s+([A-Za-z ]+?)\s+on\s+\d{2}-\d{2}-\d{2}",
            original_text
        )

        if bank_match:
            counterparty = bank_match.group(2)
            mode = bank_match.group(1)
            counterparty = re.sub(r"\s+"," ",counterparty).strip()
            data = {
                "amount":amount,
                "counterparty":counterparty,
                "mode":mode,
                "intent" : intent
            }
            return {
                "amount":amount,
                "counterparty":counterparty,
                "mode":mode,
                "intent" : intent
            }

    if intent == 'SALARY_CREDIT':
        # extract salary amount
        original_text = re.sub(r"[,\n]+", " ", original_text)
        original_text = re.sub(r"\s+", " ", original_text)
        salary_match = re.search(r"rs.\s+inr\s([\d,]+(?:\.\d{1,2})?).*?on\s+\d{2}-\d{2}-\d{2}.*?from\s+([A-Za-z ]+)", original_text,re.IGNORECASE)
        print(salary_match)
        if salary_match:
            salary_amount = float(salary_match.group(1).replace(",", ""))
            counterparty = salary_match.group(2).strip()
            return {
                "amount": salary_amount,
                "counterparty": counterparty,
                "mode": "CREDIT",
                "intent" : intent
            }

    if intent == 'CC_CREDIT':
        # extract refund amount
        original_text = re.sub(r"[,\n]+", " ", original_text)
        original_text = re.sub(r"\s+", " ", original_text)
        refund_match = re.search(r"rs\.?\s([\d,]+\.\d{1,2}).*?Merchant:\s([A-Za-z ]+)\s+date", original_text,re.IGNORECASE)
        if refund_match:
            refund_amount = float(refund_match.group(1).replace(",", ""))
            return {
                "amount": refund_amount,
                "counterparty": refund_match.group(2),
                "mode": "CREDIT",
                "intent" : intent
            }
    # -------------------------
    # Fallback (unknown format)
    # -------------------------
    return {
        "amount": amount,
        "counterparty": None,
        "mode": None,
        "intent" : intent
    }


if __name__ == '__main__':
    text = """
    Your salary of Rs. INR 12345
    has been added in your account
    ending with XX5678 on 26-04-26
    from CDAC-CDAC
    """
    text2 = """
    Dear Customer, Rs.5123 has
    been debited from 
    account 1235 to VPA
    q001766243@ybl RTYFHGVB UI 
    NM on 02-05-24
    """
    extract_transaction_details(text=text2 ,intent= 'UPI_DEBIT')