

\## 💻 3. Web App Specification — `docs/WEB\_APP\_SPEC.md`

```markdown

\# Webhoxy Web App Specification



Frontend implementation built with \*\*SolidJS\*\*, \*\*TypeScript\*\*, and \*\*TailwindCSS\*\*.  

This web UI enables users to configure webhooks, mappings, and inspect delivery logs.



---



\## 🎯 Objectives



\- Manage webhook source \& target configurations

\- Create and edit JSON mapping rules

\- Visualize payload transformations (side-by-side)

\- View and resend previous webhook deliveries

\- Handle optional signature and auth key configurations



---



\## 🧩 Tech Stack



| Category | Tool |

|-----------|------|

| Framework | SolidJS |

| Language | TypeScript |

| Styling | Tailwind CSS |

| Build Tool | Vite |

| HTTP Client | Axios |

| State Management | Solid Signals/Stores |

| API Integration | REST (to Rust backend) |



---



\## 📁 Directory Structure



frontend/

├── src/

│ ├── components/

│ │ ├── WebhookForm.tsx

│ │ ├── MappingEditor.tsx

│ │ ├── LogViewer.tsx

│ ├── pages/

│ │ ├── Home.tsx

│ │ ├── Logs.tsx

│ │ ├── Settings.tsx

│ ├── lib/

│ │ ├── api.ts

│ │ ├── types.ts

│ └── App.tsx

└── package.json



yaml

Copy code



---



\## ⚙️ Environment Variables



```env

VITE\_API\_URL=http://localhost:8080/api

🧱 Core Features

1\. Webhook Management

Add/Edit/Delete webhook definitions.



Display generated proxy URL.



2\. JSON Mapper UI

Left side: Incoming JSON structure.



Right side: Target JSON structure.



Allow:



Direct mapping



Concatenation of multiple fields



Static fixed values



3\. Log Viewer

View delivery history with status and timestamps.



“Resend” button to trigger re-delivery of payloads.



4\. Authentication \& Keys

Optional source and destination auth keys.



Stored securely in SQLite via API.



🐳 Dockerfile (Frontend)

dockerfile

Copy code

FROM node:20-alpine

WORKDIR /app

COPY package\*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5173

CMD \["npm", "run", "preview"]

🧩 Running with Docker Compose

bash

Copy code

docker-compose up --build

Frontend will be available at http://localhost:5173,

Backend API at http://localhost:8080.

