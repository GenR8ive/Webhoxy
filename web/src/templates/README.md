# Service Templates

This folder contains JSON template files for different webhook services. Each template includes an example payload structure that will be used to automatically generate target fields in the mapping editor.

## Template Structure

Each JSON file should follow this structure:

```json
{
  "name": "Service Name",
  "description": "Brief description of the service",
  "icon": "🔔",
  "examplePayload": {
    // Your example JSON payload here
  }
}
```

## Available Templates

### Slack (slack.json)
Add your Slack incoming webhook example payload to the `examplePayload` field.

### Discord (discord.json)
Add your Discord webhook example payload to the `examplePayload` field.

### Microsoft Teams (teams.json)
Add your Teams incoming webhook example payload to the `examplePayload` field.

### Telegram (telegram.json)
Add your Telegram Bot API example payload to the `examplePayload` field.

## How to Add Example JSON

1. Open the relevant template file (e.g., `slack.json`)
2. Replace the empty `examplePayload` object with your actual JSON example
3. The mapping editor will automatically parse the JSON and extract all fields

## Example

```json
{
  "name": "Slack",
  "description": "Slack incoming webhook payload example",
  "icon": "💬",
  "examplePayload": {
    "text": "Hello World",
    "username": "MyBot",
    "icon_emoji": ":ghost:",
    "attachments": [
      {
        "color": "#36a64f",
        "title": "Example",
        "text": "This is an attachment"
      }
    ]
  }
}
```

This will automatically extract fields like:
- `text`
- `username`
- `icon_emoji`
- `attachments[0].color`
- `attachments[0].title`
- `attachments[0].text`

