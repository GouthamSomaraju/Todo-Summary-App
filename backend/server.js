import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { CohereClient } from 'cohere-ai';
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '../todo-summary-assistant-77d5e-firebase-adminsdk-fbsvc-02129e846e.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
});

const db = admin.firestore();

const cohere = new CohereClient({
  token: 'khEyHLCWjbjmbHmqJOsHZcuSXRDYKaL32DVZH9yO',
});

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const TODOS_COLLECTION = 'todos';

// GET /todos - fetch all todos
app.get('/todos', async (req, res) => {
  try {
    const snapshot = await db.collection(TODOS_COLLECTION).get();
    const todos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(todos);
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// POST /todos - add a new todo
app.post('/todos', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const docRef = await db.collection(TODOS_COLLECTION).add({ text });
    const newTodo = { id: docRef.id, text };
    res.status(201).json(newTodo);
  } catch (error) {
    console.error('Failed to add todo:', error);
    res.status(500).json({ error: 'Failed to add todo' });
  }
});

// DELETE /todos/:id - delete a todo
app.delete('/todos/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await db.collection(TODOS_COLLECTION).doc(id).delete();
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// POST /summarize - summarize todos and send to Slack
app.post('/summarize', async (req, res) => {
  try {
    const snapshot = await db.collection(TODOS_COLLECTION).get();

    if (snapshot.empty) {
      return res.status(200).json({ success: true, message: 'No todos found.' });
    }

    const todos = snapshot.docs.map(doc => doc.data());
    const todoText = todos.map((t, i) => `${i + 1}. ${t.text}`).join('\n');

    // Call Cohere LLM to summarize
    const response = await cohere.chat({
      message: `Summarize this list of to-do items meaningfully:\n\n${todoText}`,
    });

    const summary = response.text;

    // Post summary message to Slack webhook
    await axios.post('https://hooks.slack.com/services/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', {
      text: `*📝 To-Do Summary from Backend:*\n${summary}`
    });

    res.status(200).json({ success: true, message: summary });
  } catch (error) {
    console.error('Error in /summarize:', error.message || error);
    res.status(500).json({ success: false, message: 'Failed to summarize or send Slack message.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});
