# 💼 ADW Finance & Tax - TaxShield Pro

<div align="center">
  <img src="public/assets/branding/ADW%20LOGO.png" alt="Agency Dev Works Logo" width="150"/>
  <br/>
  <strong>Comprehensive Financial Management for Agency Dev Works</strong>
</div>

---

## 🎯 Overview

**TaxShield Pro** is a full-stack financial management application built for Agency Dev Works. It integrates with Mercury Bank to provide real-time financial tracking, expense management, tax preparation tools, and AI-powered strategic insights.

---

## ✨ Features

### 📊 **Strategist HQ (Dashboard)**
- **Real-time account balances** - Checking, Savings, and Credit Card from Mercury
- **Monthly revenue & expense tracking**
- **AI-powered strategic summary** - Analyzes finances and suggests money-saving opportunities
- **Quick stats** - Active clients, pending invoices, pending tasks

### 💰 **Expenditures**
- **Mercury Bank integration** - Automatically syncs all transactions
- **Categorization** - Office, Software, Marketing, Travel, Contractors, etc.
- **Receipt uploads** - Attach receipts to any transaction
- **Filtering** - View by month or all-time
- **"Made By" tracking** - See who made each expense (Ali, Mustafa, Sajjad, Mario, etc.)

### 📄 **Service Agreements**
- **Contract management** - Track all client agreements
- **Status tracking** - Active, Completed, Terminated
- **PDF attachments** - Upload actual agreement documents
- **Value tracking** - Monitor contract values and expiration dates

### 🧾 **Invoices**
- **Invoice generation** - Create and track invoices
- **Status management** - Pending, Paid, Overdue
- **Client tracking** - Link invoices to clients

### 🗄️ **Asset Vault**
- **Document storage** - Store important business documents
- **Image gallery** - Upload and view images (logos, receipts, etc.)
- **PDF viewer** - View PDF documents directly in-app
- **Categories** - Branding, Legal, Financial, Receipts

### 🏛️ **Tax Center**
- **Schedule C mapping** - Expenses automatically mapped to IRS Schedule C lines
- **Tax summary** - Quarterly estimated taxes, deductions, net income
- **Category breakdown** - See deductible expenses by category

### 🤖 **AI Chat Assistant**
- **Gemini AI integration** - Ask questions about your finances
- **Strategic advice** - Get suggestions for cost savings and revenue opportunities
- **Context-aware** - AI has access to your financial data for personalized responses

---

## 🔗 Integrations

### Mercury Bank
- **Automatic sync** - Pulls all transactions, balances, and credit card data
- **Proxy server** - Uses a Render.com proxy for IP whitelisting
- **Real-time balances** - Checking, Savings, Credit Card with available credit

### Supabase / Prisma
- **Database persistence** - All data stored in PostgreSQL
- **API endpoints** - Vercel serverless functions for CRUD operations

### Google Gemini AI
- **Strategic summaries** - Monthly AI analysis of finances
- **Chat assistant** - Natural language interface for financial questions

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS |
| **Build Tool** | Vite |
| **Database** | PostgreSQL (Supabase) via Prisma ORM |
| **API** | Vercel Serverless Functions |
| **Bank Integration** | Mercury API via Render.com Proxy |
| **AI** | Google Gemini API |
| **Hosting** | Vercel (Frontend), Render (Proxy) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Mercury API Key (with IP whitelist)
- Supabase account (for database)
- Gemini API Key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/augustdrip/ADW-Finance-Tax-app.git

# Install dependencies
cd "ADW Finance:Tax shi"
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run database migrations
npx prisma db push

# Start development server
npm run dev
```

### Environment Variables

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://..."

# Mercury Bank API
MERCURY_API_KEY="your_mercury_api_key"

# Google Gemini AI
GEMINI_API_KEY="your_gemini_api_key"
```

---

## 📁 Project Structure

```
ADW Finance:Tax shi/
├── api/                    # Vercel serverless API endpoints
│   ├── transactions.ts
│   ├── agreements.ts
│   ├── invoices.ts
│   ├── assets.ts
│   └── lib/prisma.ts
├── mercury-proxy/          # Render.com proxy for Mercury API
│   ├── index.js
│   └── package.json
├── prisma/
│   └── schema.prisma       # Database schema
├── public/
│   └── assets/branding/    # Logo and brand assets
├── services/
│   ├── mercuryService.ts   # Mercury Bank integration
│   ├── geminiService.ts    # AI chat and summaries
│   ├── databaseService.ts  # Prisma API client
│   └── supabaseService.ts  # Legacy Supabase client
├── App.tsx                 # Main application component
├── types.ts                # TypeScript interfaces
└── vite.config.ts          # Vite configuration
```

---

## 🔐 Security

- **API keys** stored in environment variables (never committed)
- **Mercury proxy** uses static IP for whitelist security
- **CORS** configured for specific origins only
- **Vercel** handles HTTPS and security headers

---

## 📱 Screenshots

The application features a dark, modern UI with:
- Purple/indigo accent colors
- Card-based dashboard layout
- Responsive design for all screen sizes
- Smooth animations and transitions

---

## 👥 Team

**Agency Dev Works**
- Ali
- Mustafa
- Sajjad
- Mario

---

## 📄 License

Private - Agency Dev Works © 2024

---

<div align="center">
  <strong>Built with 💜 by Agency Dev Works</strong>
</div>
