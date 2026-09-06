# DAR CRM SaaS – Tomorrow Ready Package

This package upgrades the live MVP with:
- Full Lead Source Master (50 sources)
- Real Integrations Center with environment-variable setup guides
- Customer 360, Leads, Pipeline, Tasks, Calls, Campaigns, Reports
- Lead stage updates
- Task completion
- Manual call logging
- Backup export
- Secure webhook secret support
- Optional CRM password login using Render environment variable
- Mobile responsive UI

## Deploy over your current Render service

1. Replace the files in your local GitHub repo `E:\GitHub\dar-crm-saas` with this package.
2. GitHub Desktop → commit → Push origin.
3. Render auto-deploys.

## IMPORTANT – Render Environment

In Render → your web service → Environment, add:

`CRM_PASSWORD` = choose a strong password for staff login  
`CRM_WEBHOOK_SECRET` = choose a separate long random secret for website/app webhooks

After saving, redeploy.

## External integrations

The Integrations screen is fully prepared, but WhatsApp, Meta, Exotel, Callyzer, JBS, Tidio, SMTP, SMS, Unicommerce and Google services cannot become truly connected until you add their real credentials/API access in Render Environment.

## Website / App webhook

POST to:

`https://YOUR-SERVICE.onrender.com/api/webhooks/customer-event`

Header:
`X-CRM-Secret: <CRM_WEBHOOK_SECRET>`

Example body:

```json
{
  "name":"Customer Name",
  "mobile":"9876543210",
  "email":"customer@example.com",
  "source":"Abandoned Checkout",
  "type":"Checkout Abandoned",
  "text":"Customer abandoned checkout",
  "interest":"Antique Haram",
  "value":300000,
  "createLead":true
}
```

## Critical production note

This package still uses `data/db.json`. Render free services do **not** provide persistent disk storage. Use this tomorrow for demo/pilot only. Before entering important real customer data, migrate to PostgreSQL. Use Reports → Backup frequently during the pilot.
