export interface TextChunk {
  id: string;
  text: string;
  sourceFilename?: string;
}

export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50,
  sourceFilename?: string,
): TextChunk[] {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error("Chunk size must be a positive whole number of words.");
  }

  if (!Number.isInteger(overlap) || overlap < 0 || overlap >= chunkSize) {
    throw new Error(
      "Overlap must be a whole number from zero up to (but not including) chunk size; it must be smaller than chunk size.",
    );
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    return [];
  }

  const words = trimmedText.split(/\s+/);
  const chunks: TextChunk[] = [];

  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const chunk = words.slice(start, end).join(" ");

    chunks.push({
      id: `${sourceFilename ?? "document"}-chunk-${chunks.length + 1}`,
      text: chunk,
      ...(sourceFilename ? { sourceFilename } : {}),
    });

    if (end === words.length) {
      break;
    }

    start = end - overlap;
  }

  return chunks;
}
