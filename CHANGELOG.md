# Changelog

All notable changes to this project are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-05-01

### Added
- Eleven write tools: `submit_assignment`, `start_quiz_attempt`, `save_quiz_answers`, `submit_quiz_attempt`, `start_forum_discussion`, `post_forum_reply`, `send_message`, `mark_messages_read`, `submit_choice_response`, `submit_course_feedback`, `create_calendar_event`.
- `MoodleClient.uploadFiles` method for the multipart `/webservice/upload.php` endpoint.
- Quiz HTML question parser and per-question-type answer encoder supporting multichoice (single + multi), truefalse, shortanswer, essay, numerical, match, and ddwtos.
- Friendly mappings for new Moodle error codes: `notopenforsubmissions`, `submissionsclosed`, `nopermissiontoaddpost`, `cannotsendmessage`, `attemptalreadyclosed`, `quizalreadystarted`, `feedback_completed`, `cannotsavetempfile`, `passwordrequired`.
- Responsible-use section in README.

### Changed
- Bumped `engines.node` to `>=20`.

### Notes
- Password-protected quizzes are not supported in v0.2; `start_quiz_attempt` surfaces Moodle's `passwordrequired` error.

## [0.1.0] - 2026-05-01

### Added
- First release.
- Nine read-only MCP tools for student-side Moodle access:
  - `list_courses`
  - `get_course_contents`
  - `list_assignments`
  - `get_assignment`
  - `get_grades`
  - `list_upcoming_events`
  - `list_upcoming_deadlines`
  - `list_quizzes`
  - `get_quiz_attempts`
- TypeScript codebase with vitest test suite and msw HTTP mocking.
- GitHub Actions CI for Node 18, 20, and 22.
- Quickstart for Claude Desktop and a Moodle Web Service setup guide.

[Unreleased]: https://github.com/DDotSalazar/moodle-student-mcp/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/DDotSalazar/moodle-student-mcp/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/DDotSalazar/moodle-student-mcp/releases/tag/v0.1.0
