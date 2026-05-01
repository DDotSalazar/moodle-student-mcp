#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { loadConfig } from './config.js';
import { ConfigError, MoodleApiError } from './errors.js';
import { MoodleClient } from './moodle/client.js';
import { getSiteInfo } from './moodle/site.js';
import { allTools } from './tools/index.js';
import type { ToolContext } from './tools/types.js';

async function main(): Promise<void> {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(`moodle-student-mcp: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }

  const client = new MoodleClient(config.url, config.token, config.debug);

  let userId: number;
  try {
    const info = await getSiteInfo(client);
    userId = info.userid;
    if (config.debug) {
      console.error(
        `moodle-student-mcp: connected to "${info.sitename}" as ${info.fullname} (uid=${userId})`,
      );
    }
  } catch (err) {
    if (err instanceof MoodleApiError) {
      console.error(`moodle-student-mcp: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }

  const ctx: ToolContext = { client, userId };

  const server = new McpServer({
    name: 'moodle-student-mcp',
    version: '0.1.0',
  });

  for (const tool of allTools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args: Record<string, unknown>): Promise<CallToolResult> => {
        try {
          return await tool.handler(args as never, ctx) as CallToolResult;
        } catch (err) {
          console.error(
            `moodle-student-mcp: unhandled error in tool ${tool.name}:`,
            err,
          );
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Internal error in moodle-student-mcp; check server logs.',
              },
            ],
            isError: true,
          };
        }
      },
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('moodle-student-mcp: fatal error:', err);
  process.exit(1);
});
