# moodle-student-mcp

A Model Context Protocol server that lets an LLM read and act on a student's Moodle data: courses, assignments, grades, calendar, and quizzes.

[![CI](https://github.com/DDotSalazar/moodle-student-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/DDotSalazar/moodle-student-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)

## What it does

This MCP server exposes twenty tools that call the Moodle Web Service REST API on behalf of a student: nine read-only tools to query data and eleven write tools to submit assignments, take quizzes, post forums, send messages, and more. Plug it into Claude Desktop, Claude Code, Cursor, VS Code, or any other MCP host, and ask things like "what's due this week?", "what did I get on my last quiz?", "submit my assignment", or "start my quiz".

## Installation

You will need a Moodle Web Service token before installing. See the [token setup guide](docs/moodle-setup.md) for how to generate one.

Below are config snippets for the most common MCP hosts. The server itself is the same in all of them: it runs as `npx -y moodle-student-mcp` and reads `MOODLE_URL` and `MOODLE_TOKEN` from the environment.

### Claude Desktop

Edit `claude_desktop_config.json` (Settings, Developer, Edit Config):

```json
{
  "mcpServers": {
    "moodle-student": {
      "command": "npx",
      "args": ["-y", "moodle-student-mcp"],
      "env": {
        "MOODLE_URL": "https://moodle.your-school.edu",
        "MOODLE_TOKEN": "your-token-here"
      }
    }
  }
}
```

Restart Claude Desktop. The twenty tools should appear in the tool picker.

### Claude Code (CLI)

```
claude mcp add -s user moodle-student \
  -e MOODLE_URL=https://moodle.your-school.edu \
  -e MOODLE_TOKEN=your-token-here \
  -- npx -y moodle-student-mcp
```

`-s user` makes it available across all your projects. Drop the flag if you only want it in the current project.

### Cursor

Edit `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` in your project. Same shape as Claude Desktop:

```json
{
  "mcpServers": {
    "moodle-student": {
      "command": "npx",
      "args": ["-y", "moodle-student-mcp"],
      "env": {
        "MOODLE_URL": "https://moodle.your-school.edu",
        "MOODLE_TOKEN": "your-token-here"
      }
    }
  }
}
```

### VS Code (GitHub Copilot Chat)

VS Code 1.99+ supports MCP servers natively in Copilot Chat. Add a `.vscode/mcp.json` file to your workspace (or configure it in user settings):

```json
{
  "servers": {
    "moodle-student": {
      "command": "npx",
      "args": ["-y", "moodle-student-mcp"],
      "env": {
        "MOODLE_URL": "https://moodle.your-school.edu",
        "MOODLE_TOKEN": "your-token-here"
      }
    }
  }
}
```

Note that VS Code uses `"servers"` while Claude Desktop and Cursor use `"mcpServers"`.

### Other MCP clients

Any MCP-compatible client should work. The server starts via `npx -y moodle-student-mcp` and speaks the Model Context Protocol over stdio. Pass `MOODLE_URL` and `MOODLE_TOKEN` as environment variables.

## Tools

| Name | What it does |
| --- | --- |
| `list_courses` | List the courses you are enrolled in. |
| `get_course_contents` | Get the structure of a course (sections, modules, files, links). |
| `list_assignments` | List assignments across courses with due dates. |
| `get_assignment` | Full details for one assignment plus your submission, grade, and feedback. |
| `get_grades` | Grade report for one course or all enrolled courses. |
| `list_upcoming_events` | All upcoming calendar events for the next N days. |
| `list_upcoming_deadlines` | Upcoming action items (the dashboard Timeline view). |
| `list_quizzes` | Quizzes available across your courses. |
| `get_quiz_attempts` | Your attempts for a specific quiz. |
| `submit_assignment` | Save draft submission text and/or files; optionally finalise for grading. |
| `start_quiz_attempt` | Start or resume a quiz attempt; returns normalised questions across all pages. |
| `save_quiz_answers` | Save answers to one or more questions in an in-progress attempt. |
| `submit_quiz_attempt` | Finalise an in-progress quiz attempt for grading. |
| `start_forum_discussion` | Start a new discussion thread in a forum. |
| `post_forum_reply` | Reply to an existing forum post. |
| `send_message` | Send a direct message to another Moodle user. |
| `mark_messages_read` | Mark one or more messages as read. |
| `submit_choice_response` | Submit a response to an in-course poll. |
| `submit_course_feedback` | Submit responses to a feedback form. |
| `create_calendar_event` | Create a personal calendar event. |

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `MOODLE_URL` | yes | Base URL of the Moodle instance, e.g. `https://moodle.your-school.edu`. Trailing slash is fine. |
| `MOODLE_TOKEN` | yes | Personal Web Service token. See setup guide below. |
| `MOODLE_DEBUG` | no | Set to `1` to log Web Service calls to stderr. |

## Setting up a Moodle Web Service token

See [docs/moodle-setup.md](docs/moodle-setup.md) for step-by-step instructions, including the list of Web Service functions an admin needs to enable if your school does not already expose them via the Moodle Mobile service.

## Responsible use

This tool exposes Moodle's own Web Service API to an LLM acting on your behalf. Using it to take quizzes, submit assignments, post in forums, or send messages is your responsibility, including any compliance with your institution's academic-integrity rules. Many institutions treat AI-generated coursework as misconduct; some allow it with attribution; some have no policy yet. Read your school's policy before pointing this at a real account. The maintainer disclaims liability for any consequences of use.

## Troubleshooting

| Error | What to do |
| --- | --- |
| `MOODLE_URL is required` | Set the `MOODLE_URL` env var in your MCP host config. |
| `MOODLE_TOKEN is required` | Set the `MOODLE_TOKEN` env var. |
| `Your Moodle token is invalid or expired.` | Generate a new token from your Moodle profile and update `MOODLE_TOKEN`. |
| `Your token does not have permission for this action.` | Ask the Moodle admin to grant the Web Service functions listed in the setup guide. |
| `Could not reach Moodle at ...` | Network issue. Verify the URL and your internet connection. |

To see the raw Web Service requests, set `MOODLE_DEBUG=1` and watch the MCP host's stderr.

## Development

```
git clone https://github.com/DDotSalazar/moodle-student-mcp.git
cd moodle-student-mcp
npm install
npm run dev
```

Other scripts: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

## License

MIT. See [LICENSE](LICENSE).
