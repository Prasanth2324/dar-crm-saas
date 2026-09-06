# DAR CRM SaaS – Customer 360 MVP

A zero-dependency Node.js starter CRM you can run locally and demo immediately.

## Run

1. Install Node.js 18 or newer.
2. Open this folder in Terminal / Command Prompt.
3. Run:

   node server.js

4. Open Chrome:

   http://localhost:3000

No npm install is required.

## Included

- Responsive dashboard
- Customer 360 profile and activity timeline
- Leads list
- Sales pipeline / Kanban view
- Tasks and follow-ups
- Unified inbox demo
- Global customer search
- New lead creation
- Multi-tenant-ready data model (`tenantId`)
- REST-style API endpoints
- Generic webhook endpoint for website/app/ERP integrations
- Mobile navigation

## API endpoints

GET /api/dashboard
GET /api/customers
GET /api/customers/:id
POST /api/customers
GET /api/leads
POST /api/leads
GET /api/tasks
POST /api/tasks
GET /api/messages
POST /api/activities
POST /api/webhooks/customer-event

## Example external event

POST http://localhost:3000/api/webhooks/customer-event
Content-Type: application/json

{
  "name": "Priya",
  "mobile": "9876543210",
  "source": "Website",
  "type": "Abandoned Checkout",
  "text": "Customer abandoned checkout for Antique Haram",
  "interest": "Antique Haram",
  "budget": "₹3L"
}

The CRM matches customers by mobile/email and adds the event to the existing Customer 360 timeline.

## Production upgrade path

This MVP stores data in `data/db.json` to make the demo easy. For production, move to:

- PostgreSQL
- NestJS or structured Express backend
- Redis queues
- JWT / SSO authentication
- Role-based permissions
- AWS S3-compatible storage
- WhatsApp Cloud API
- Meta Webhooks
- Exotel/Callyzer integrations
- JBS/ERP API sync
- Website event SDK
- Background job workers
- Audit logs
- Tenant-level billing and subscription management

## Suggested next modules

1. Login, users, roles, branch permissions
2. Real WhatsApp shared inbox
3. Exotel incoming/outgoing calls and recordings
4. Meta Instagram/Facebook lead + DM integration
5. Website visitor/product/wishlist/cart events
6. JBS/ERP customers, invoices, schemes and orders
7. Service/repair tickets
8. Campaign attribution and ROAS
9. Automation builder
10. AI summaries and lead scoring

## Put it online (easy path)

### Render
1. Create a new Git repository and upload this folder.
2. In Render choose **New > Blueprint** and connect the repository.
3. Render reads `render.yaml` and starts the app with `node server.js`.
4. Open the public URL Render gives you.

### Railway / similar Node hosts
- Create a new Node service from this folder/repository.
- Start command: `node server.js`
- The app automatically uses the host-provided `PORT` environment variable.

### Important MVP note
This demo stores data in `data/db.json`. On many cloud platforms the local filesystem can be temporary, so production should move CRM data to PostgreSQL before real customer usage.
