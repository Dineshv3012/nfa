# ε-NFA to NFA Converter

Master the ε-closure algorithm with AI-powered tools. This application converts Nondeterministic Finite Automata with Epsilon transitions (ε-NFA) into standard Nondeterministic Finite Automata (NFA) step-by-step.

## Run Locally

**Prerequisites:** Node.js

### 1. Backend Service (AI Integration)

Start the backend server first. This handles image analysis and voice processing.

```bash
cd server
npm install
npm start
```

### 2. Frontend Application (React)

Open a new terminal and start the frontend.

```bash
# In the project root
npm install
npm run dev
```

### 3. Usage

The application will open at `http://localhost:3000`.

**Note:** Ensure your `OPENAI_API_KEY` is set in the `server/.env` file. (Note: The project was updated from Gemini to OpenAI GPT-4o for better performance).
