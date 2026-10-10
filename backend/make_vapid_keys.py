"""Generate the VAPID key pair used to sign Web Push messages.

    python make_vapid_keys.py

Add the printed values to the backend's environment (Render → Environment). Generate them ONCE
and keep them: changing the keys invalidates every existing push subscription.
"""
import base64

from cryptography.hazmat.primitives import serialization
from py_vapid import Vapid

b64 = lambda b: base64.urlsafe_b64encode(b).rstrip(b"=").decode()

v = Vapid()
v.generate_keys()
raw_private = v.private_key.private_numbers().private_value.to_bytes(32, "big")
public = v.public_key.public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)

print("VAPID_PUBLIC_KEY=" + b64(public))
print("VAPID_PRIVATE_KEY=" + b64(raw_private))
print("VAPID_SUBJECT=mailto:you@example.com   # a contact address push services can reach")
