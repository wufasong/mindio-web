# MindIO

> Your personal AI-powered workbench — capture, think, and publish.

MindIO is a self-hostable personal workspace that combines note-taking, AI analysis, and multi-platform publishing into one system. Write notes, attach images and media, let AI summarize and extract insights, then publish directly to your personal site or social media.

---

## Features

- **Notes & Knowledge Base** — rich text and Markdown editing, tags, search, and review
- **Media Support** — attach images, audio, and video to your notes
- **AI Analysis** *(backend)* — automatic summarization and insight extraction from notes and media
- **Personal Website** — built-in public-facing site to showcase your published content
- **Social Publishing** *(backend)* — push content to LinkedIn, Reddit, WeChat, and more
- **Self-hostable** — run it on your own server, full control over your data

---

## Tech Stack

- [Nuxt.js](https://nuxtjs.org/) 2.x (Vue.js)
- Element UI
- Axios

---

## One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.com/deploy/SfA56e?referralCode=GbJJAR)
[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/new?template=https://github.com/wufasong/mindio-web)

---

## Self-Hosting (Docker)

The easiest way to run MindIO on your own server.

### Requirements

- Docker & Docker Compose
- A server or VPS (1GB RAM minimum)

### 1. Clone the repo

```bash
git clone https://github.com/wufasong/mindio-web.git
cd mindio-web
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your passwords and site URL.

### 3. Start

```bash
docker compose up -d
```

MindIO will be available at `http://localhost` (or your configured port).

---

## Development

### Install dependencies

```bash
npm install
```

### Configure environment

```env
API_BASE_URL=http://localhost:8080/api
```

### Run development server

```bash
npm run dev
```

---

## Backend

The backend server (Java / Spring Boot) is free to use via the pre-built JAR (see Self-Hosting above).

The full source code is available for purchase — useful if you want to customize or self-compile.

**What you get:**
- Full backend source code (ZIP)
- Runnable JAR file
- Setup and deployment guide
- A unique upgrade key for future version discounts

**[Buy Backend Source — $49](https://payhip.com/b/lsvQW)**

Upgrade pricing: $19–$29 for future versions (using your unique key).

---

## License

The frontend (this repository) is licensed under the [Apache License 2.0](LICENSE).

The backend JAR is free to use for self-hosting. The backend source code is proprietary and sold separately.
