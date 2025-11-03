# Getting Started with Webhoxy

This guide will help you get up and running with Webhoxy in minutes.

## 📦 Installation

### 1. Install Dependencies

```bash
cd api-node
npm install
```

### 2. Configure Environment

```bash
cp env.example .env
```

Edit `.env` if needed (defaults work fine for local development).

### 3. Start the Server

```bash
npm run dev
```

Server will start at `http://localhost:8080` 🚀

## 🎯 Quick Tutorial

### Step 1: Create Your First Webhook

```bash
curl -X POST http://localhost:8080/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Webhook",
    "description": "Testing webhoxy",
    "target_url": "https://webhook.site/unique-id"
  }'
```

**Response:**
```json
{
  "id": 1,
  "proxy_url": "http://localhost:8080/hook/1"
}
```

💡 **Tip**: Get a test URL from [webhook.site](https://webhook.site) to see your webhooks in action!

### Step 2: Send a Test Webhook

```bash
curl -X POST http://localhost:8080/hook/1 \
  -H "Content-Type: application/json" \
  -d '{
    "event": "user_signup",
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "id": 12345
    },
    "timestamp": "2024-10-31T10:00:00Z"
  }'
```

✅ Your webhook is now forwarded to the target URL!

### Step 3: Check Available Fields (Smart Mapping)

After sending a webhook, Webhoxy automatically analyzes the payload:

```bash
curl http://localhost:8080/api/fields/1
```

**Response:**
```json
{
  "fields": [
    { "path": "event", "type": "string", "sample": "user_signup" },
    { "path": "user.name", "type": "string", "sample": "John Doe" },
    { "path": "user.email", "type": "string", "sample": "john@example.com" },
    { "path": "user.id", "type": "number", "sample": 12345 },
    { "path": "timestamp", "type": "string", "sample": "2024-10-31T10:00:00Z" }
  ]
}
```

🎉 Now you can see exactly what fields are available to map!

### Step 4: Create Field Mappings

Pick fields from the list above and map them to your target format:

```bash
# Map user.name to author
curl -X POST http://localhost:8080/api/mappings \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_id": 1,
    "source_field": "user.name",
    "target_field": "author"
  }'

# Map user.email to contact_email
curl -X POST http://localhost:8080/api/mappings \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_id": 1,
    "source_field": "user.email",
    "target_field": "contact_email"
  }'

# Add a fixed value
curl -X POST http://localhost:8080/api/mappings \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_id": 1,
    "source_field": "",
    "target_field": "source",
    "fixed_value": "webhoxy-app"
  }'
```

### Step 5: Test the Transformation

Send the same webhook again:

```bash
curl -X POST http://localhost:8080/hook/1 \
  -H "Content-Type: application/json" \
  -d '{
    "event": "user_signup",
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "id": 12345
    }
  }'
```

Now the forwarded payload will be:

```json
{
  "author": "John Doe",
  "contact_email": "john@example.com",
  "source": "webhoxy-app"
}
```

### Step 6: View Delivery Logs

```bash
curl http://localhost:8080/api/logs/1
```

See all webhook deliveries with request/response details!

## 🌐 Using the Web UI

The web frontend is in the `/web` directory:

```bash
cd ../web
npm install
npm run dev
```

Open `http://localhost:3000` and enjoy the visual interface! 🎨

### Web UI Features:
- ✅ Create and manage webhooks
- ✅ **Smart field mapping** - Click on available fields instead of typing
- ✅ View delivery logs with pretty formatting
- ✅ Real-time field detection from webhook payloads

## 📚 Next Steps

### Common Use Cases

#### 1. GitHub → Slack
Transform GitHub webhook events to Slack message format.

#### 2. Stripe → Discord
Convert Stripe payment webhooks to Discord embeds.

#### 3. Custom API → Multiple Destinations
Create multiple webhooks with different mappings for the same source.

### Advanced Features

#### Fixed Values
Add static fields to all transformed payloads:

```json
{
  "webhook_id": 1,
  "source_field": "",
  "target_field": "environment",
  "fixed_value": "production"
}
```

#### Nested Mappings
Map nested fields to create complex structures:

```json
{
  "source_field": "user.profile.address.city",
  "target_field": "location.city"
}
```

#### Array Access
Access array items using index notation:

```json
{
  "source_field": "commits.0.message",
  "target_field": "latest_commit"
}
```

## 🐳 Docker

### Quick Start

```bash
docker-compose up -d
```

### Manual Docker

```bash
# Build
docker build -t webhoxy-api .

# Run
docker run -p 8080:8080 -v $(pwd)/data:/app/data webhoxy-api
```

## 🔧 Troubleshooting

### Port Already in Use

Change the port in `.env`:
```
PORT=8081
```

### Database Locked

Stop the server and delete `data/webhoxy.db`, then restart.

### CORS Issues

Update CORS origins in `.env`:
```
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### Can't See Available Fields

Make sure you've sent at least one webhook to see available fields. The system needs an example payload to analyze.

## 📖 Documentation

- **[README.md](./README.md)** - Full documentation
- **[API Reference](./API_REFERENCE.md)** - Detailed API docs
- **GitHub Issues** - Report bugs or request features

## 💡 Tips

1. **Test First**: Always send a test webhook before creating mappings
2. **Use webhook.site**: Great for testing target URLs
3. **Check Logs**: View delivery logs to debug issues
4. **Auto Fields**: Let the system detect fields instead of typing them manually

## 🆘 Need Help?

- Check the logs: `npm run dev` shows detailed logs
- View webhook deliveries: `GET /api/logs/:webhook_id`
- Test your target URL: Make sure it accepts POST requests
- Validate JSON: Ensure webhook payloads are valid JSON

## 🎉 You're Ready!

You now know how to:
- ✅ Create webhooks
- ✅ Send test webhooks
- ✅ Auto-detect available fields
- ✅ Create smart field mappings
- ✅ View delivery logs
- ✅ Transform webhook payloads

Happy proxying! 🚀

---

**Need more help?** Check out the full [README.md](./README.md) or open an issue on GitHub.

