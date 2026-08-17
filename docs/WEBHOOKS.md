# Webhook Integration Guide (Module 30)

AttendX supports pushing real-time events to external institutional systems via Webhooks.

## 1. Webhook Signatures (Security)
To ensure the payload genuinely originated from AttendX and wasn't tampered with, every webhook request includes an `x-attendx-signature` header.

The signature is an HMAC-SHA256 hash of the timestamp and the JSON body, signed using the institution's Webhook Secret.

### Example Verification (Node.js)
```javascript
const crypto = require('crypto');

function verifyWebhook(req, secret) {
  const signatureHeader = req.headers['x-attendx-signature']; // e.g., "t=17000000,v1=abc123def..."
  const timestamp = req.headers['x-attendx-timestamp'];
  const payloadString = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payloadString}`)
    .digest('hex');

  const providedSignature = signatureHeader.split('v1=')[1];

  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature));
}
```

## 2. Replay Protection
The `x-attendx-timestamp` header prevents replay attacks. The receiving server should reject any payload where the timestamp is older than 5 minutes.

## 3. Delivery Retries
If the receiving endpoint fails to return a 2xx status code, AttendX will retry the delivery using an exponential backoff strategy for up to 3 days before marking the delivery as permanently failed (`DEAD_LETTER`).
