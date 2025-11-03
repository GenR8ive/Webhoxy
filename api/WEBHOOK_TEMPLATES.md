# Webhook Templates

This document provides information about the webhook URL templates available in webhoxy for popular services.

## Supported Platforms

### 1. Slack

**Webhook URL Format:**
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**How to Get:**
1. Go to your Slack workspace settings
2. Navigate to "Apps" → "Incoming Webhooks"
3. Click "Add New Webhook to Workspace"
4. Select the channel and authorize
5. Copy the webhook URL

**Documentation:** https://api.slack.com/messaging/webhooks

---

### 2. Discord

**Webhook URL Format:**
```
https://discord.com/api/webhooks/{webhook.id}/{webhook.token}
```

**How to Get:**
1. Open Discord and go to Server Settings
2. Navigate to "Integrations" → "Webhooks"
3. Click "New Webhook" or "Create Webhook"
4. Configure the webhook (name, channel, avatar)
5. Click "Copy Webhook URL"

**Documentation:** https://discord.com/developers/docs/resources/webhook

---

### 3. Microsoft Teams

**Webhook URL Format:**
```
https://[tenant].webhook.office.com/webhookb2/[guid]@[guid]/IncomingWebhook/[guid]/[guid]
```

**How to Get:**
1. Open Microsoft Teams and go to the channel
2. Click on "..." (More options) → "Workflows"
3. Search for "Post to a channel when a webhook request is received"
4. Configure the workflow
5. Copy the webhook URL

**Documentation:** https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook

---

### 4. Telegram

**Webhook URL Format:**
```
https://api.telegram.org/bot{token}/sendMessage?chat_id={chat_id}
```

**How to Get:**
1. Create a bot using [@BotFather](https://t.me/botfather) on Telegram
   - Send `/newbot` command
   - Follow the instructions to get your bot token
2. Get your chat ID:
   - Add the bot to your channel/group or start a conversation
   - Use [@userinfobot](https://t.me/userinfobot) or check the bot's updates
3. Construct the URL: `https://api.telegram.org/bot{YOUR_BOT_TOKEN}/sendMessage?chat_id={YOUR_CHAT_ID}`

**Documentation:** https://core.telegram.org/bots/api

---

## Using Templates in webhoxy

The Visual Field Mapping interface provides a split-screen layout for easy field connections:

### Visual Interface
```
LEFT SIDE                      RIGHT SIDE
(Source Fields)                (Target Fields)
-------------------------------------------
Your webhook data     →        Service format
```

### Steps to Map Fields

1. **Navigate to Mappings** page for your webhook

2. **Apply a Template** - Click a service button (Slack, Discord, Teams, or Telegram)
   - Target fields appear on the RIGHT side

3. **Load Source Fields** - Click "Get Source Fields"
   - Your webhook data appears on the LEFT side

4. **Connect Fields** - Simple click-to-connect:
   - Click a source field (left)
   - Click a target field (right)
   - Connection created! ✓

5. **Add Fixed Values** (optional):
   - Click "+ Add fixed value" on any target field
   - Enter static text (e.g., "My Bot", ":rocket:")

6. **Save Mappings** - Click "Save" button
   - All connections are saved

### Visual Feedback
- **Green** = Source fields (left)
- **Blue** = Target fields (right) 
- **Connected fields** show their connection with color indicators
- **Selected field** highlights in blue

This visual approach makes field mapping intuitive and fast!

### Example Workflow

**Scenario:** Forward GitHub webhook events to Slack

1. **Create Webhook**
   - Create webhook with your Slack webhook URL as target

2. **Apply Slack Template**
   - Click "💬 Slack" button
   - Right side shows: `text`, `username`, `icon_emoji`, `channel`

3. **Load Source Fields**  
   - Send a test webhook from GitHub
   - Click "Get Source Fields"
   - Left side shows: `repository.name`, `commits.0.message`, `sender.login`, etc.

4. **Connect Fields** (Click-to-connect):
   - Click `commits.0.message` (left) → Click `text` (right) ✓
   - Click `sender.login` (left) → Click `username` (right) ✓
   - Click `icon_emoji` (right) → Add fixed value: `:octocat:` ✓

5. **Save**
   - Click "Save 3 Mappings"
   - Done! 🎉

Now all incoming GitHub webhooks are automatically transformed into Slack messages!

## Payload Format

Each service expects specific JSON payload formats. webhoxy allows you to transform incoming webhook payloads to match the target service's expected format using the mapping feature.

### Example Slack Payload:
```json
{
  "text": "Hello from webhoxy!",
  "username": "webhoxy-bot",
  "icon_emoji": ":ghost:"
}
```

### Example Discord Payload:
```json
{
  "content": "Hello from webhoxy!",
  "username": "webhoxy-bot",
  "avatar_url": "https://example.com/avatar.png"
}
```

### Example Teams Payload:
```json
{
  "text": "Hello from webhoxy!",
  "title": "Notification"
}
```

### Example Telegram Payload:
The URL includes `chat_id` as a query parameter. The payload should be:
```json
{
  "text": "Hello from webhoxy!",
  "parse_mode": "Markdown"
}
```

## Tips

- Use the mapping feature to transform your source webhook payload to match the target service format
- Test your webhooks using tools like curl or Postman before setting them up in production
- Keep your webhook URLs secure - treat them like passwords
- Some services have rate limits, so consider implementing retry logic if needed

## Custom Webhooks

If your target service isn't listed above, you can still use webhoxy! Simply:
1. Skip the quick templates
2. Enter your custom webhook URL directly in the Target URL field
3. Configure any necessary payload mappings

---

For more information, see the [main README](../README.md) and [MAPPING_EXAMPLES](./MAPPING_EXAMPLES.md).

