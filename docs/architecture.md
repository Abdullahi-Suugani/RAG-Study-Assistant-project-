# RAG Study Assistant: Architecture

## Architecture Style

A modular, terminal-based Node.js application written in TypeScript.

## Main Components

1. Document loader: Reads plain-text study notes.
2. Text chunker: Splits documents into smaller overlapping sections.
3. Embedding service: Uses Gemini to convert text into numerical vectors.
4. Vector store: Uses LanceDB for persistent vector storage and similarity search.
5. Retrieval service: Finds the most relevant note chunks for a question.
6. Answer service: Sends the question and retrieved context to Gemini.
7. Terminal interface: Accepts questions and displays answers.

## Data Flow

### Indexing

Text file → Loader → Chunker → Gemini embeddings → LanceDB

### Question Answering

Question → Gemini embedding → LanceDB search → Retrieved chunks → Gemini generation → Answer

## Important Design Decisions

- Use TypeScript and Node.js for the application logic.
- Use one Gemini API key for supported embedding and generation requests.
- Use the same embedding model for indexing and querying.
- Keep secrets in environment variables.
- Build and test each component separately.
- Start with text files and a terminal interface.
