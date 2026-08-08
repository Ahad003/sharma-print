# Sharma Print Portal v2

A production-oriented starter for an original Sharma Print service portal.

## Included
- Login/register-ready database layer
- Session-based authentication
- User dashboard
- Hindi / English / Hinglish language selector
- Service cards with logos/icons
- Wallet and transaction ledger
- Recharge flow placeholder
- Admin-ready service configuration
- AI customer support through BLACKBOX
- Controlled backend functions for account/transaction lookup
- Service-provider adapters for PAN, Voter, Aadhaar and DigiLocker
- No secret API keys in frontend

## Run
Node.js 18+ recommended.

1. `npm install`
2. Copy `.env.example` to `.env`
3. Add your own BLACKBOX key if you want AI support
4. `npm start`
5. Open `http://localhost:3000`

## Real integrations
The service adapters intentionally return a "not configured" response until you supply an authorised provider's documentation and credentials. Do not put government/private API keys in frontend code.

## Demo login
Username: demo
Password: demo123

Change this before production.

## UPI recharge
Configured UPI ID: `ahadkhan36639-3@okaxis`
Preset amounts: ₹20, ₹50, ₹100, ₹300, ₹500, ₹700.
The uploaded QR is included as `public/assets/upi-qr.png`.

Important: QR/UPI ID alone cannot automatically verify a payment. The portal records a payment proof as **Pending**. Wallet credit must be performed only after genuine verification through a payment/UPI provider or bank-supported mechanism.
