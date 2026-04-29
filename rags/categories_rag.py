# finance_rag.py

import re
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

CONFIDENCE_THRESHOLD = 0.70

# -----------------------------
# Finance Subject Knowledge Base
# -----------------------------
FINANCE_SUBJECT_KB = [
    {
        "intent": "FOOD",
        "examples": [
            "caterers", "caters", "food", "restaurants", "hospitality", "fastfood", 
            "foodcourt", "cafe", "restaurant", "snacks", "snack", "dining",
            "dining at restaurant", "food and beverages", "eating out",
            "zomato", "swiggy", "mcdonalds", "dominos", "kfc", "starbucks", "subway",
            "pizzahut", "barbequenation", "haldiram"
        ]
    },
    {
        "intent": "ENTERTAINMENT",
        "examples": [
            "movies", "movie", "cinema", "cinemas", "theatre", "theatres", "entertainment", 
            "entertainment_hub", "fun", "games", "gaming", "gaming_zone", "funzone", 
            "fun_zone", "pvr", "inox", "cinemax", "multiplex", "bookmyshow",
            "movie tickets", "watching a movie", "entertainment and fun",
            "netflix", "primevideo", "hotstar", "disneyplus", "sonyliv", "zee5", "spotify"
        ]
    },
    {
        "intent": "TRANSPORT",
        "examples": [
            "transport", "transportation", "travel", "travelling", "ride", "rideshare", 
            "cab", "taxi", "metro", "bus", "train", "flight", "airline", "petrol", 
            "fuel", "uber", "ola", "airport", "indigo", "vistara", "airindia", "airport", 
            "petroleum", "petrolium", "petrolbunk", "bike",
            "booking a cab", "flight tickets", "refueling car at petrol pump", "train tickets",
            "booking a ride",
            "makemytrip", "goibibo", "yatra", "irctc", "redbus", "rapido", "nmmc", "bestbus",
            "hpcl", "bpcl", "indianoil", "nayara", "bharatpetroleum"
        ]
    },
    {
        "intent": "BILL_PAYMENT",
        "examples": [
            "billpayment", "billpay", "utilitybill", "utilitybillpayment", "electricitybill", 
            "electricitybillpayment", "electricity", "waterbill", "waterbillpayment", 
            "gasbill", "gasbillpayment", "phonebill", "phonebillpayment", "mobilebill", 
            "mobilebillpayment", "internetbill", "internetbillpayment", "dthbill", 
            "dthbillpayment", "mobilebill", "mobilebillpayment",
            "electricity bill payment", "utility bill payment", "paying the water bill",
            "recharging mobile", "broadband bill",
            "pzelectricity", "paytmelectricity", "bdelectricity", "billdesk", "payu",
            "ccavenue", "razorpay", "payzapp", "mobikwik", "freecharge", "jio", "airtel",
            "vi", "bsnl", "bescom", "mahavitaran", "adaniapp", "tata sky"
        ]
    },
    {
        "intent": "MUTUAL_FUND_SIP",
        "examples": [
            "nifty50indexfund", "midcapfund", "directplan", "growthplan", "hybridfund", 
            "nifty50", "sensex", "midcap", "smallcap",
            "mutual fund sip installment", "investing in index fund", "sip deduction",
            "zerodha", "upstox", "groww", "angelone", "icicidirect", "hdfcsec",
            "jio blackrock", "blackrock", "sbi mutual fund", "nippon india", "axis mutual",
            "quant mutual", "parag parikh"
        ]
    }
]
# -----------------------------
# Normalization
# -----------------------------
def normalize_subject(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    # Keep alphanumeric and spaces, but remove everything else
    text = re.sub(r'[^a-z0-9\s]', '', text)
    return ' '.join(text.split())

# -----------------------------
# Model & Index
# -----------------------------
_model = SentenceTransformer("all-MiniLM-L6-v2", local_files_only=True)

_docs, _meta = [], []
for item in FINANCE_SUBJECT_KB:
    for ex in item["examples"]:
        _docs.append(ex)
        _meta.append(item["intent"])

_embeddings = _model.encode(_docs, convert_to_numpy=True)
faiss.normalize_L2(_embeddings)

_index = faiss.IndexFlatIP(_embeddings.shape[1])
_index.add(_embeddings)

def categories_rag_decision(subject: str) -> str:
    subject = normalize_subject(subject)

    query_emb = _model.encode([subject], convert_to_numpy=True)
    faiss.normalize_L2(query_emb)

    scores, idxs = _index.search(query_emb, 1)

    score = float(scores[0][0])
    idx = int(idxs[0][0])

    if score >= CONFIDENCE_THRESHOLD:
        return _meta[idx]
    elif score < CONFIDENCE_THRESHOLD:
        tokens = [subject] + subject.split()
        tokens = list(set([t for t in tokens if len(t) > 2]))
        if not tokens:
            return "OTHER"
        token_embs = _model.encode(tokens, convert_to_numpy=True)
        faiss.normalize_L2(token_embs)

        scores, idxs = _index.search(token_embs, 1)

        best_match_idx = np.argmax(scores)
        max_score = float(scores[best_match_idx][0])
        best_kb_idx = int(idxs[best_match_idx][0])
        #print(f"Debug: best_token='{tokens[best_match_idx]}', max_score={max_score:.4f}, threshold={CONFIDENCE_THRESHOLD}")        
        if max_score < CONFIDENCE_THRESHOLD:
            return "OTHER"
    
    return _meta[best_kb_idx]


def rebuild_index():
    global _index, _docs, _meta

    _docs, _meta = [], []
    for item in FINANCE_SUBJECT_KB:
        for ex in item["examples"]:
            _docs.append(ex)
            _meta.append(item["intent"])

    embeddings = _model.encode(_docs, convert_to_numpy=True)
    faiss.normalize_L2(embeddings)

    _index = faiss.IndexFlatIP(embeddings.shape[1])
    _index.add(embeddings)

    print(f"✅ Finance index rebuilt with {len(_docs)} vectors")

#rebuild_index()

if __name__ == "__main__":
    #rebuild_index()
    print(f"Result: {categories_rag_decision('Mr. SURAJ SANJAY KATE')}")