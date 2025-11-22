# Architecture

Webhoxy consists of two main components: the API service and the Web interface.

## Overview

```mermaid
graph TD
    User[User] --> Web[Web Interface (SolidJS)]
    User --> API[API Service (Fastify)]
    Web --> API
    API --> DB[(SQLite)]
    Source[Webhook Source] --> API
```

## Components

### API Service
- **Technology**: Node.js, Fastify, TypeScript
- **Responsibility**:
  - Receives webhooks
  - Stores webhook data
  - Manages templates and transformations
  - Serves REST API for the Web Interface

### Web Interface
- **Technology**: SolidJS, Vite, TypeScript
- **Responsibility**:
  - Dashboard for viewing webhooks
  - Template editor
  - Real-time updates via polling or WebSocket (planned)

## Data Flow

1.  **Webhook Ingestion**:
    - External service sends POST request to API.
    - API validates and stores the payload.
    - API processes any transformations.

2.  **User Interaction**:
    - User opens Web Interface.
    - Web Interface fetches data from API.
    - User creates/edits templates.
