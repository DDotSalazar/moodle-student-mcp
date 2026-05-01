import type { z } from 'zod';
import type { MoodleClient } from '../moodle/client.js';

export type ZodRawShape = z.core.$ZodShape;

export interface ToolContext {
  client: MoodleClient;
  userId: number;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface ToolDefinition<S extends ZodRawShape = ZodRawShape> {
  name: string;
  description: string;
  inputSchema: S;
  handler: (args: z.output<z.ZodObject<S>>, ctx: ToolContext) => Promise<ToolResult>;
}
