// test-cohere.js
import { CohereClient } from "cohere-ai";
import dotenv from "dotenv";

dotenv.config();

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

async function test() {
  const response = await cohere.chat({
    model: "command-r-plus",
    message: "Summarize: 1. Buy milk\n2. Walk the dog",
  });

  console.log(response.text);
}

test().catch(console.error);
