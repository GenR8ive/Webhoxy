# Field Mapping Examples

## Overview

This document shows how Webhoxy handles different field types when mapping webhooks.

## Automatic Stringification

Arrays and objects are automatically converted to JSON strings when mapped. This prevents issues with complex data structures and makes them safe to forward to any target system.

### Example Webhook Payload

```json
{
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "profile": {
      "age": 30,
      "location": "NYC"
    }
  },
  "tags": ["javascript", "typescript", "nodejs"],
  "permissions": {
    "read": true,
    "write": false,
    "admin": false
  }
}
```

## Field Extraction

When you click "Get Available Fields", you'll see:

| Field | Type | Sample |
|-------|------|--------|
| `user` | `object (→ JSON string)` | `{name, email, profile}` |
| `user.name` | `string` | `"John Doe"` |
| `user.email` | `string` | `"john@example.com"` |
| `user.profile` | `object (→ JSON string)` | `{age, location}` |
| `user.profile.age` | `number` | `30` |
| `user.profile.location` | `string` | `"NYC"` |
| `tags` | `array (→ JSON string)` | `["javascript","typescript","nodejs"]` |
| `permissions` | `object (→ JSON string)` | `{read, write, admin}` |
| `permissions.read` | `boolean` | `true` |
| `permissions.write` | `boolean` | `false` |
| `permissions.admin` | `boolean` | `false` |

## Mapping Scenarios

### 1. Simple Field Mapping

**Source:** `user.name`  
**Target:** `author`

```json
{
  "author": "John Doe"
}
```

### 2. Object Stringification

**Source:** `user`  
**Target:** `userData`

```json
{
  "userData": "{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"profile\":{\"age\":30,\"location\":\"NYC\"}}"
}
```

### 3. Array Stringification

**Source:** `tags`  
**Target:** `techStack`

```json
{
  "techStack": "[\"javascript\",\"typescript\",\"nodejs\"]"
}
```

### 4. Combined Fields

**Source:** `[user.name] [user.email]`  
**Target:** `contact`  
**Separator:** ` ` (space)

```json
{
  "contact": "John Doe john@example.com"
}
```

### 5. Combined Fields with Custom Separator

**Source:** `[user.name], [user.email]`  
**Target:** `contact`  
**Separator:** `, ` (comma + space)

```json
{
  "contact": "John Doe, john@example.com"
}
```

### 6. Fixed Value Mapping

**Source:** *(fixed value)*  
**Value:** `"production"`  
**Target:** `environment`

```json
{
  "environment": "production"
}
```

### 7. Complex Combined Mapping with Object

**Source:** `[user.name] [permissions]`  
**Target:** `userInfo`  
**Separator:** ` - ` (dash)

```json
{
  "userInfo": "John Doe - {\"read\":true,\"write\":false,\"admin\":false}"
}
```

## Why Stringify Arrays & Objects?

### ✅ Benefits

1. **Consistency**: Always produces a valid string value
2. **Compatibility**: Works with any target system expecting text
3. **No Data Loss**: Preserves complete structure
4. **Easy Parsing**: Target system can `JSON.parse()` if needed
5. **Safe Transport**: Avoids issues with nested data

### 🎯 Use Cases

- **Slack/Discord**: Send complex data in message fields
- **Email**: Include structured data in email body
- **Logs**: Store full context as string
- **APIs**: Forward complex structures as text fields
- **Databases**: Store JSON in text columns

### 📋 Example: Slack Integration

Original webhook:
```json
{
  "user": { "name": "John", "role": "Developer" },
  "changes": ["file1.js", "file2.ts"]
}
```

Mapping:
- `[user.name]` → `username`
- `[changes]` → `files`

Result sent to Slack:
```json
{
  "username": "John",
  "files": "[\"file1.js\",\"file2.ts\"]"
}
```

Slack message:
```
👤 John
📁 Files changed: ["file1.js","file2.ts"]
```

## Null Value Handling

Null values remain as `null` and are not stringified:

```json
{
  "optional_field": null
}
```

Maps to:
```json
{
  "target_field": null
}
```

## Missing Field Handling

If a source field doesn't exist:
- Single field mapping → `null`
- Combined field mapping → Skips missing fields

Example with missing field:
```json
{
  "user": {
    "firstName": "John"
    // lastName is missing
  }
}
```

Mapping `[user.firstName] [user.lastName]` → `fullName` produces:
```json
{
  "fullName": "John"
}
```

(Missing `lastName` is silently skipped)

## Best Practices

### ✅ DO

- Use nested fields (`user.name`) for primitive values
- Map arrays/objects as strings when target expects text
- Use combined fields to create formatted strings
- Test with sample webhook first

### ❌ DON'T

- Try to access non-existent nested properties
- Assume objects will be preserved as objects
- Forget that arrays become strings

## Quick Reference

| Source Type | Target Type | Example |
|-------------|-------------|---------|
| `string` | `string` | `"hello"` → `"hello"` |
| `number` | `number` | `42` → `42` |
| `boolean` | `boolean` | `true` → `true` |
| `null` | `null` | `null` → `null` |
| `array` | `string` | `[1,2,3]` → `"[1,2,3]"` |
| `object` | `string` | `{a:1}` → `"{\"a\":1}"` |
| `combined` | `string` | `[a][b]` → `"value1value2"` |
| `fixed` | `any` | Set value → Set value |

---

Happy mapping! 🎉






