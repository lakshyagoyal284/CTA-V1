import re
from typing import List, Dict, Any
from urllib.parse import urlparse

# Standard Indian Phone Number Regex with optional spaces or dashes
PHONE_REGEX = re.compile(
    r'(?<!\d)(?:(?:\+?91[\s\-]?)?(?:0)?([6-9](?:[\s\-]?\d){9}))(?!\d)'
)

# Standard Email Regex
EMAIL_REGEX = re.compile(
    r'\b([a-zA-Z0-9_.+\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z]{2,10}(?:\.[a-zA-Z]{2,4})?)\b',
    re.IGNORECASE
)

# Standard Indian UPI Virtual Payment Address (VPA)
# Handle must not be a web domain TLD (.com, .in, .net, etc.)
UPI_REGEX = re.compile(
    r'\b([a-zA-Z0-9._\-]{2,50}@[a-zA-Z0-9]{2,30})\b',
    re.IGNORECASE
)

# Known Web TLDs to prevent confusing email domains with UPI
WEB_TLDS = {
    "com", "in", "org", "net", "edu", "gov", "io", "co", "xyz", "info", "biz",
    "me", "top", "live", "online", "cc", "vip", "app", "tech", "site"
}

# URLs / Phishing links
URL_REGEX = re.compile(
    r'(https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{2,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*))',
    re.IGNORECASE
)

# Bare phishing domains (e.g. sbi-kyc-verify-portal.in)
DOMAIN_REGEX = re.compile(
    r'(?<!@)\b([a-zA-Z0-9\-]+(?:-portal|-update|-support|-verify|-pay|-bill|-kyc|-discom|-netbanking)\.(?:in|com|net|org|xyz|top|live|online|cc|vip))\b',
    re.IGNORECASE
)

# IFSC Code: 4 alphabets + 0 + 6 alphanumeric
IFSC_REGEX = re.compile(
    r'\b([A-Z]{4}0[A-Z0-9]{6})\b'
)

# Bank Account Numbers: 9 to 18 digits with contextual keywords
ACCOUNT_REGEX = re.compile(
    r'(?:a/c|acct|account(?:\s*no|\s*number)?|beneficiary|acc\b)[\s\:\-\#]*([0-9]{9,18})\b',
    re.IGNORECASE
)

# Telegram handle or link: must not be preceded by alphanumeric (to avoid email/UPI collision)
TELEGRAM_REGEX = re.compile(
    r'(?<![a-zA-Z0-9._%+-])(?:t\.me/|@)([a-zA-Z0-9_]{4,32})\b',
    re.IGNORECASE
)

# Crypto addresses (ETH, BTC, TRON)
CRYPTO_REGEX = re.compile(
    r'\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59}|T[A-Za-z1-9]{33})\b'
)

# Modus Operandi keywords for classification
MO_RULES = {
    "TASK_JOB_SCAM": [
        "telegram", "task", "youtube like", "hotel review", "rating commission", 
        "prepaid task", "merchant task", "daily income", "part-time job", "recharge task", "booster"
    ],
    "PHISHING_KYC_SPOOF": [
        "electricity bill", "power cut", "disconnection", "bill payment", "kyc update", 
        "sim block", "pan card update", "bank link", "apk download", "teamviewer", "anydesk", "quicksupport", "netbanking"
    ],
    "DIGITAL_EXTORTION_ARREST": [
        "digital arrest", "cbi", "narcotics", "customs", "parcel intercepted", 
        "drugs found", "skype call", "video interrogation", "fake warrant", "supreme court order", "fake police"
    ],
    "LOAN_APP_EXTORTION": [
        "instant loan", "loan app", "morphed photo", "blackmail", "contact list", 
        "harassment", "7 days loan", "extortion call", "gallery access", "recovery"
    ],
    "INVESTMENT_TRADING_FRAUD": [
        "forex", "crypto trading", "guaranteed return", "ipo allotment", "vip group", 
        "whatsapp investment", "institutional account", "profit withdrawal fee", "500 percent", "algorithmic"
    ]
}

def normalize_phone(phone_str: str) -> str:
    """Normalize Indian phone numbers to canonical +91-XXXXX-XXXXX format."""
    digits = re.sub(r'\D', '', phone_str)
    if digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    elif digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]
    
    if len(digits) == 10:
        return f"+91-{digits[:5]}-{digits[5:]}"
    elif len(digits) > 10:
        d10 = digits[-10:]
        return f"+91-{d10[:5]}-{d10[5:]}"
    return phone_str

def normalize_upi(upi_str: str) -> str:
    return upi_str.strip().lower()

def normalize_email(email_str: str) -> str:
    return email_str.strip().lower()

def normalize_url(url_str: str) -> str:
    if not url_str.startswith(("http://", "https://")):
        url_str = "https://" + url_str
    try:
        parsed = urlparse(url_str)
        host = (parsed.hostname or "").lower()
        path = parsed.path.rstrip("/")
        return f"{host}{path}" if path else host
    except Exception:
        return url_str.lower()

def extract_entities_from_text(text: str) -> List[Dict[str, Any]]:
    """
    Extract digital identifiers from complaint text with confidence scoring,
    context extraction, and normalisation.
    """
    if not text:
        return []

    entities = []
    seen = set()

    def add_entity(entity_type: str, raw: str, normalized: str, confidence: float, reason: str, match_obj=None):
        key = (entity_type, normalized)
        if key in seen:
            return
        seen.add(key)

        snippet = ""
        if match_obj:
            start = max(0, match_obj.start() - 30)
            end = min(len(text), match_obj.end() + 30)
            snippet = f"...{text[start:end].strip()}..."

        entities.append({
            "entity_type": entity_type,
            "raw_value": raw,
            "normalized_value": normalized,
            "confidence": round(confidence, 2),
            "flagged_reason": reason,
            "context_snippet": snippet
        })

    # Order of extraction is important to avoid overlapping regex captures:
    
    # 1. URLs
    for m in URL_REGEX.finditer(text):
        raw = m.group(1)
        norm = normalize_url(raw)
        add_entity("URL", raw, norm, 0.96, "Suspicious web endpoint or phishing gateway cited in complaint", m)

    # 1b. Bare phishing domains
    for m in DOMAIN_REGEX.finditer(text):
        raw = m.group(1)
        norm = normalize_url(raw)
        add_entity("URL", raw, norm, 0.94, "Suspicious spoofed portal domain identifier", m)

    # 2. Emails
    for m in EMAIL_REGEX.finditer(text):
        raw = m.group(1)
        norm = normalize_email(raw)
        add_entity("EMAIL", raw, norm, 0.95, "Suspect email address observed in communication header or notice", m)

    # 3. UPI VPAs (Filter out emails and web domain false positives)
    known_emails = {e["normalized_value"] for e in entities if e["entity_type"] == "EMAIL"}
    for m in UPI_REGEX.finditer(text):
        raw = m.group(1)
        norm = normalize_upi(raw)
        handle = norm.split("@")[-1]
        
        # Check if handle is a known web TLD (e.g., user@domain.com)
        has_web_tld = any(handle.endswith(f".{tld}") or handle == tld for tld in WEB_TLDS)
        if not has_web_tld and norm not in known_emails:
            add_entity("UPI", raw, norm, 0.98, "High-confidence virtual payment address detected in payment narrative", m)

    # 4. Phone Numbers
    for m in PHONE_REGEX.finditer(text):
        raw = m.group(1)
        norm = normalize_phone(raw)
        add_entity("PHONE", raw, norm, 0.95, "Indian mobile subscriber number associated with suspect communication/call", m)

    # 5. IFSC Codes
    for m in IFSC_REGEX.finditer(text):
        raw = m.group(1)
        norm = raw.upper().strip()
        add_entity("IFSC", raw, norm, 0.99, "Bank branch routing identifier linked to receiving account", m)

    # 6. Bank Accounts
    for m in ACCOUNT_REGEX.finditer(text):
        raw = m.group(1)
        norm = raw.strip()
        add_entity("BANK_ACCOUNT", raw, norm, 0.93, "Beneficiary account number designated for illicit fund transfer", m)

    # 7. Telegram Handles (Filter out handles that are part of emails or UPIs)
    captured_handles = set()
    for e in entities:
        if "@" in e["normalized_value"]:
            user_part = e["normalized_value"].split("@")[0].lower()
            domain_part = e["normalized_value"].split("@")[1].lower()
            captured_handles.add(user_part)
            captured_handles.add(domain_part)

    for m in TELEGRAM_REGEX.finditer(text):
        raw = m.group(1)
        norm = f"@{raw.lstrip('@')}".lower()
        pure_name = raw.lstrip('@').lower()
        if pure_name not in captured_handles:
            add_entity("TELEGRAM", raw, norm, 0.92, "Encrypted messaging channel handle used for victim onboarding", m)

    # 8. Crypto Wallets
    for m in CRYPTO_REGEX.finditer(text):
        raw = m.group(1)
        norm = raw.strip()
        add_entity("CRYPTO_WALLET", raw, norm, 0.97, "Blockchain wallet address designated for illicit asset movement", m)

    return entities

def classify_modus_operandi(text: str) -> Dict[str, Any]:
    """
    Classify the modus operandi of the cybercrime based on pattern matching
    and linguistic cues in the complaint narrative.
    """
    lower_text = text.lower()
    scores = {}
    matched_keywords = {}

    for mo, keywords in MO_RULES.items():
        count = 0
        hits = []
        for kw in keywords:
            if kw in lower_text:
                count += 1
                hits.append(kw)
        if count > 0:
            scores[mo] = count
            matched_keywords[mo] = hits

    if not scores:
        return {
            "primary_mo": "OTHER_FINANCIAL_FRAUD",
            "confidence": 0.50,
            "matched_keywords": [],
            "all_scores": {}
        }

    best_mo = max(scores, key=scores.get)
    confidence = min(0.98, round(0.65 + (scores[best_mo] * 0.1), 2))

    return {
        "primary_mo": best_mo,
        "confidence": confidence,
        "matched_keywords": matched_keywords.get(best_mo, []),
        "all_scores": scores
    }
