# moodle-student-mcp

A Model Context Protocol server that lets an LLM read a student's Moodle data: courses, assignments, grades, calendar, and quizzes. Read-only.

[![CI](https://github.com/DDotSalazar/moodle-student-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/DDotSalazar/moodle-student-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)

## What it does

This MCP server exposes nine read-only tools that call the Moodle Web Service REST API on behalf of a student. Plug it into Claude Desktop or any other MCP host and ask things like "what's due this week?", "what did I get on my last quiz?", or "what's the grade breakdown for my data structures course?".

## Quickstart (Claude Desktop)

Add this to your Claude Desktop `claude_desktop_config.json`:

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

Restart Claude Desktop. The nine tools below should now appear in the tool picker.

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

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `MOODLE_URL` | yes | Base URL of the Moodle instance, e.g. `https://moodle.your-school.edu`. Trailing slash is fine. |
| `MOODLE_TOKEN` | yes | Personal Web Service token. See setup guide below. |
| `MOODLE_DEBUG` | no | Set to `1` to log Web Service calls to stderr. |

## Setting up a Moodle Web Service token

See [docs/moodle-setup.md](docs/moodle-setup.md) for step-by-step instructions, including the list of Web Service functions an admin needs to enable if your school does not already expose them via the Moodle Mobile service.

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

See [CONTRIBUTING.md](CONTRIBUTING.md) for the dev workflow and how to add a new tool.

## License

MIT. See [LICENSE](LICENSE).
