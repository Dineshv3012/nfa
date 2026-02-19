# ε-NFA to NFA Converter

Master the ε-closure algorithm with AI-powered tools. This application converts Nondeterministic Finite Automata with Epsilon transitions (ε-NFA) into standard Nondeterministic Finite Automata (NFA) step-by-step.

## Key Features

- **Smart Sketching**: Draw your automaton and let AI convert it to formal logic (supports high-DPI and touch).
- **Global Voice Control**: Control the system in your native language (English, Hindi, Tamil, Telugu, and more).
- **Step-by-Step Logic**: See the epsilon-closure and transition mappings in real-time.

## Run Locally

**Prerequisites:** Node.js

### 1. Installation

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the root directory:

```bash
OPENAI_API_KEY=your_key_here
```

### 3. Start Development

```bash
npm run dev
```

## Deployment

This project is optimized for **Vercel**. Backend features (Image Analysis & Voice) are implemented as Vercel Serverless Functions in the `api/` directory.

**Note:** Ensure your `OPENAI_API_KEY` is set in the Vercel Project Settings for AI features to work.
