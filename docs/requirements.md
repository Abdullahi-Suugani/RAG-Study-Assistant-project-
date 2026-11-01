# RAG Study Assistant: Requirements

## 1. Project Overview

**Project name:** RAG Study Assistant

**Purpose:** Build a terminal-based application that answers questions using information from study notes.

**Target users:** Students who want to search and understand their study materials.

## 2. Problem Statement

Students may have large amounts of study material and need a way to find relevant information and get answers based on their own notes.

## 3. Minimum Viable Product (MVP)

The first version must be able to:

1. Load study notes from a text file.
2. Split notes into smaller chunks.
3. Generate embeddings for the chunks.
4. Store and search embeddings using LanceDB.
5. Accept a question through the terminal.
6. Retrieve the most relevant chunks.
7. Send the retrieved context and question to Gemini.
8. Display the generated answer in the terminal.
9. Handle missing files, invalid input, and API errors.

## 4. Technology Stack

- Language: TypeScript
- Runtime: Node.js
- AI provider: Google Gemini API
- Vector database: LanceDB
- Configuration: dotenv
- Development environment: VS Code
- Interface: Terminal

## 5. Security Requirements

- Store API keys in environment variables.
- Never commit the .env file to Git.
- Never print API keys in logs.
- Handle API errors without exposing secrets.

## 6. Success Criteria

The MVP is successful when:

- The application can load a study-notes file.
- The notes can be indexed and searched.
- A question retrieves relevant information from the notes.
- Gemini generates an answer using the retrieved context.
- The application reports errors clearly when something fails.

## 7. Out of Scope for Version 1

- User accounts and authentication
- Web interface
- PDF uploads
- Cloud deployment
- Multiple users
- Production-scale infrastructure

These features can be considered after the basic RAG workflow works.
