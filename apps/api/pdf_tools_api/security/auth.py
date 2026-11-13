import hashlib
import hmac
import secrets


def generate_access_token() -> str:
    return secrets.token_urlsafe(32)


def hash_access_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def verify_access_token(token: str, token_hash: str) -> bool:
    expected = hash_access_token(token)
    return hmac.compare_digest(expected, token_hash)
