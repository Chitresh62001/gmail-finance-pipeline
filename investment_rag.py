# investment_rag.py

import re
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

CONFIDENCE_THRESHOLD = 0.95

# -----------------------------
# Investment Subject Knowledge Base
# -----------------------------
INVESTMENT_SUBJECT_KB = [
    {
        "intent": "FUNDS_ADDED",
        "examples": [
            "fundsaddedsuccessfully"

        ]
    },
    {
        "intent": "ORDER_EXECUTED",
        "examples": [
            "mutualfundordercompleted"
        ]
    },
    {
        "intent": "FUNDS_WITHDRAWN",
        "examples": [
            "withdrawalsuccessful"
        ]
    },
    {
        "intent": "INVESTMENT_DEBIT",
        "examples": [
            "amountdebitedfrombankaccounttowardsindianclearingcorp",
            "mutualfundunitscreditedsuccessfully",
            "debitfrombankaccountforsip",
            "nachdebitforinvestment",
            "ecsdebitformutualfund",
            "autodebitforsip",
            "bankaccountdebitedtowardsinvestment",
            "amountdebitedtowardsclearingcorporation"
    ]
    }
]

# -----------------------------
# Normalization
# -----------------------------
def normalize_subject(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-zA-Z]', '', text)   # mask → card
    return text.strip()

# -----------------------------
# Model & Index
# -----------------------------
_model = SentenceTransformer("all-MiniLM-L6-v2")

_docs, _meta = [], []
for item in INVESTMENT_SUBJECT_KB:
    for ex in item["examples"]:
        _docs.append(ex)
        _meta.append(item["intent"])

_embeddings = _model.encode(_docs, convert_to_numpy=True)
faiss.normalize_L2(_embeddings)

_index = faiss.IndexFlatIP(_embeddings.shape[1])
_index.add(_embeddings)

# -----------------------------
# Public API
# -----------------------------
def investment_rag_decision(subject: str) -> str:
    subject = normalize_subject(subject)

    query_emb = _model.encode([subject], convert_to_numpy=True)
    faiss.normalize_L2(query_emb)

    scores, idxs = _index.search(query_emb, 1)

    score = float(scores[0][0])
    idx = int(idxs[0][0])

    if score < CONFIDENCE_THRESHOLD:
        return "UNKNOWN"

    return _meta[idx]


def rebuild_index():
    global _index, _docs, _meta

    _docs, _meta = [], []
    for item in INVESTMENT_SUBJECT_KB:
        for ex in item["examples"]:
            _docs.append(ex)
            _meta.append(item["intent"])

    embeddings = _model.encode(_docs, convert_to_numpy=True)
    faiss.normalize_L2(embeddings)

    _index = faiss.IndexFlatIP(embeddings.shape[1])
    _index.add(embeddings)

    print(f"✅ Investment index rebuilt with {len(_docs)} vectors")


#rebuild_index()