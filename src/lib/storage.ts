/**
 * Storage utilities for reading and writing JSON data
 * Implements atomic writes to prevent data corruption
 *
 * Date handling: Automatically converts Date objects to/from ISO strings
 * when reading/writing JSON files.
 */

import { dirname } from "@std/path";

/**
 * ISO 8601 date string pattern for detection during JSON parsing
 * Matches: 2025-01-15T10:30:00.000Z or 2025-01-15T10:30:00Z
 */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

/**
 * JSON reviver that converts ISO date strings back to Date objects
 */
function dateReviver(_key: string, value: unknown): unknown {
  if (typeof value === "string" && ISO_DATE_PATTERN.test(value)) {
    return new Date(value);
  }
  return value;
}

/**
 * JSON replacer that converts Date objects to ISO strings
 */
function dateReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
}

/**
 * Read and parse a JSON file
 * Returns null if file doesn't exist
 * Throws on parse errors
 * Automatically converts ISO date strings to Date objects
 */
export async function readJson<T>(path: string): Promise<T | null> {
  try {
    const content = await Deno.readTextFile(path);
    return JSON.parse(content, dateReviver) as T;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return null;
    }
    throw new Error(
      `Failed to read ${path}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Write JSON data to a file atomically
 * Writes to a temp file first, then renames to prevent corruption
 * Automatically converts Date objects to ISO strings
 */
export async function writeJson(path: string, data: unknown): Promise<void> {
  // Ensure parent directory exists
  const dir = dirname(path);
  await ensureDir(dir);

  // Write to temp file first (use UUID for uniqueness)
  const tmpPath = `${path}.tmp.${crypto.randomUUID()}`;
  const content = JSON.stringify(data, dateReplacer, 2);

  try {
    await Deno.writeTextFile(tmpPath, content);
    await Deno.rename(tmpPath, path);
  } catch (error) {
    // Clean up temp file on error
    try {
      await Deno.remove(tmpPath);
    } catch {
      // Ignore cleanup errors
    }
    throw new Error(
      `Failed to write ${path}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Append content to a file, creating it if it doesn't exist
 * Used for dev log (append-only markdown)
 */
export async function appendToFile(
  path: string,
  content: string,
): Promise<void> {
  // Ensure parent directory exists
  const dir = dirname(path);
  await ensureDir(dir);

  try {
    const file = await Deno.open(path, {
      create: true,
      append: true,
    });
    try {
      const encoder = new TextEncoder();
      await file.write(encoder.encode(content));
    } finally {
      file.close();
    }
  } catch (error) {
    throw new Error(
      `Failed to append to ${path}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Ensure a directory exists, creating it and parents if needed
 */
export async function ensureDir(path: string): Promise<void> {
  try {
    await Deno.mkdir(path, { recursive: true });
  } catch (error) {
    // Ignore if directory already exists
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw new Error(
        `Failed to create directory ${path}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

/**
 * Check if a directory exists
 */
export async function dirExists(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isDirectory;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

/**
 * List files in a directory
 * Returns empty array if directory doesn't exist
 */
export async function listFiles(dirPath: string): Promise<string[]> {
  try {
    const files: string[] = [];
    for await (const entry of Deno.readDir(dirPath)) {
      if (entry.isFile) {
        files.push(entry.name);
      }
    }
    return files.sort();
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return [];
    }
    throw error;
  }
}

/**
 * List directories in a directory
 * Returns empty array if directory doesn't exist
 */
export async function listDirs(dirPath: string): Promise<string[]> {
  try {
    const dirs: string[] = [];
    for await (const entry of Deno.readDir(dirPath)) {
      if (entry.isDirectory) {
        dirs.push(entry.name);
      }
    }
    return dirs.sort();
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return [];
    }
    throw error;
  }
}

/**
 * Read a JSON file and update it atomically
 * Creates file with initial value if it doesn't exist
 */
export async function updateJson<T>(
  path: string,
  updater: (current: T | null) => T,
): Promise<T> {
  const current = await readJson<T>(path);
  const updated = updater(current);
  await writeJson(path, updated);
  return updated;
}
