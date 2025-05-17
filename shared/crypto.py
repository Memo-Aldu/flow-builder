"""
Cryptographic utilities for encrypting and decrypting sensitive data.
"""

import os
import base64
from typing import Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


def get_encryption_key() -> bytes:
    """
    Get the encryption key from environment or generate a secure one.

    In production, this should be a secure, persistent key stored in a secure location.
    For development, we use a fixed key for simplicity.
    """
    key_env = os.getenv("SECRET_ENCRYPTION_KEY")
    if key_env:
        return base64.b64decode(key_env)

    salt = os.getenv("SECRET_ENCRYPTION_SALT", "flow-builder-salt").encode()
    password = os.getenv(
        "SECRET_ENCRYPTION_PASSWORD", "development-password-only"
    ).encode()

    # Derive a key using PBKDF2
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,  # 32 bytes = 256 bits for AES-256
        salt=salt,
        iterations=100000,
    )
    return kdf.derive(password)


def encrypt(value: str) -> Tuple[bytes, bytes]:
    """
    Encrypt a string value using AES-GCM.

    Returns:
        Tuple containing (nonce, ciphertext)
    """
    key = get_encryption_key()
    aesgcm = AESGCM(key)

    # Generate a random 96-bit nonce (12 bytes)
    nonce = os.urandom(12)

    # Encrypt the data
    data = value.encode("utf-8")
    ciphertext = aesgcm.encrypt(nonce, data, None)

    return nonce, ciphertext


def decrypt(nonce: bytes, ciphertext: bytes) -> str:
    """
    Decrypt ciphertext using AES-GCM.

    Args:
        nonce: The nonce used during encryption
        ciphertext: The encrypted data

    Returns:
        The decrypted string value
    """
    key = get_encryption_key()
    aesgcm = AESGCM(key)

    # Decrypt the data
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode("utf-8")
