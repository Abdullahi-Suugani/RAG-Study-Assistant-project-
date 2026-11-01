import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import { searchDocuments, type SearchResult } from "../retrieval/searchDocuments.js";
import { buildQuestionPrompt, STUDY_ASSISTANT_SYSTEM_PROMPT } from "./prompts.js";

export const NO_DOCUMENT_ANSWER = "I could not find this information in your indexed documents.";

interface GenerationClient {
  models: {
    generateContent: (parameters: {
      model: string;
      contents: string;
      config?: { systemInstruction?: string };
    }) => Promise<{ text?: string }>;
  };
}

export interface AnswerResult {
  answer: string;
  sources: string[];
}

function createGenerationClient(): GenerationClient {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Add it to your .env file before asking questions.");
  }
  return new GoogleGenAI({ apiKey });
}

function formatContext(results: SearchResult[]): string {
  return results
    .map((result, index) => `[${index + 1}] Source: ${result.source}\n${result.text}`)
    .join("\n\n");
}

export async function generateAnswer(
  question: string,
  dependencies: {
    search?: (question: string) => Promise<SearchResult[]>;
    client?: GenerationClient;
    model?: string;
  } = {},
): Promise<AnswerResult> {
  if (!question.trim()) {
    throw new Error("Please enter a question before asking the study assistant.");
  }

  let results: SearchResult[];
  try {
    results = await (dependencies.search ?? searchDocuments)(question);
  } catch (error) {
    throw new Error("Could not retrieve document context for the question.", { cause: error });
  }

  const sources = [...new Set(results.map((result) => result.source))];
  if (results.length === 0) {
    return { answer: NO_DOCUMENT_ANSWER, sources: [] };
  }

  const client = dependencies.client ?? createGenerationClient();
  const model = dependencies.model ?? process.env.GEMINI_GENERATION_MODEL ?? "gemini-2.5-flash";

  try {
    const response = await client.models.generateContent({
      model,
      contents: buildQuestionPrompt(question, formatContext(results)),
      config: { systemInstruction: STUDY_ASSISTANT_SYSTEM_PROMPT },
    });
    const answer = response.text?.trim();
    if (!answer) {
      throw new Error("Gemini returned an empty answer.");
    }
    return { answer, sources };
  } catch (error) {
    throw new Error("Gemini could not generate an answer. Check your API key and connection.", { cause: error });
  }
}
