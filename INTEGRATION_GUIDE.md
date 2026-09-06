# DAR CRM Live Integration Guide

Live URL example: `https://dar-crm-saas.onrender.com`

## 1. Exotel
Render variables:
- `EXOTEL_SID`
- `EXOTEL_API_KEY`
- `EXOTEL_API_TOKEN`
- optional `EXOTEL_API_HOST` (Singapore default is `api.exotel.com`)

The CRM automatically calls Exotel Bulk Call Details when `/api/calls` is loaded, and there is also a **Sync Exotel** button in Calls.

Optional Exotel callback URL:
`https://YOUR-CRM/api/webhooks/exotel`

Missed / busy / failed calls automatically create a follow-up lead/task and are attached to Customer 360 by mobile number.

## 2. Website / Node.js / App / Any Custom System
Set a long random Render variable:
`CRM_WEBHOOK_SECRET`

POST to:
`https://YOUR-CRM/api/webhooks/website`

Header:
`X-CRM-Secret: YOUR_SECRET`

Example add-to-cart event:
```json
{
  "mobile": "9876543210",
  "email": "customer@example.com",
  "name": "Customer Name",
  "type": "add_to_cart",
  "source": "Website Add to Cart",
  "text": "Added 22KT Antique Haram SKU 214472",
  "interest": "Antique Haram",
  "value": 250000,
  "createLead": true
}
```

Useful `type` values include `product_view`, `wishlist`, `add_to_cart`, `checkout`, `abandoned_checkout`, `form_submit`, `enquiry`, `purchase`, `app_registration`.

## 3. WATI
Webhook URL:
`https://YOUR-CRM/api/webhooks/wati`

Configure WATI Webhooks for received messages and other required events. Incoming messages are added to Unified Inbox + Customer 360 and can create leads.

## 4. Tidio
Webhook URL:
`https://YOUR-CRM/api/webhooks/tidio`

In Tidio: Settings → Developer → Webhooks → add endpoint and select contact/chat/ticket events. Tidio contact and conversation events are normalized into Customer 360.

## 5. Meta / Facebook / Instagram / WhatsApp Cloud API
Webhook callback:
`https://YOUR-CRM/api/webhooks/meta`

Render variables:
- `META_APP_ID`
- `META_APP_SECRET`
- `META_PAGE_TOKEN`
- `META_VERIFY_TOKEN`
- `WHATSAPP_VERIFY_TOKEN` (if using WhatsApp Cloud verification)

Set the same verify token in Meta and Render. WhatsApp Cloud inbound messages and Meta message events are stored in Unified Inbox. Meta Lead Ads leadgen events are fetched using `META_PAGE_TOKEN` when available.

## 6. Callyzer / ERP / Unicommerce / Other Bot
Use the universal secure endpoint:
`https://YOUR-CRM/api/webhooks/generic`

Send `X-CRM-Secret` and a JSON body. Minimum useful fields:
```json
{
  "provider": "Callyzer",
  "mobile": "9876543210",
  "name": "Customer",
  "type": "call_completed",
  "text": "Call completed",
  "source": "Callyzer",
  "createLead": false
}
```

## Important production note
This build still stores CRM data in `data/db.json`. Render's normal service filesystem is not a production database and can be replaced during deploy/restart. Use this build for pilot/testing and migrate to PostgreSQL before storing full production customer history.
