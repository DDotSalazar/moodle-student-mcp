# Setting up a Moodle Web Service token

To use moodle-student-mcp you need a personal Moodle Web Service token. Most schools expose this through the "Moodle Mobile web service" by default, which is what the official Moodle mobile app uses.

## Step 1: Generate your token

1. Log into your Moodle.
2. Click your avatar (top right) and go to **Preferences**.
3. Under **User account**, click **Security keys**.
4. Find the row for **Moodle mobile web service** (or whichever service your school exposes).
5. Copy the token shown.

If there is no token row, the mobile service is not enabled for your account. Ask the school's Moodle admin to follow the admin instructions below.

## Step 2: Use the token

Set `MOODLE_TOKEN` in your MCP host config to the value you copied. See the [Quickstart in the README](../README.md#quickstart-claude-desktop).

## Admin instructions (if the default service is not enabled)

A Moodle administrator can either enable the default mobile service or create a custom service that grants only the functions this MCP server needs. The custom service approach gives the tightest permissions.

The server uses these ten Web Service functions:

- `core_webservice_get_site_info`
- `core_enrol_get_users_courses`
- `core_course_get_contents`
- `mod_assign_get_assignments`
- `mod_assign_get_submission_status`
- `gradereport_user_get_grade_items`
- `core_calendar_get_calendar_upcoming_view`
- `core_calendar_get_action_events_by_timesort`
- `mod_quiz_get_quizzes_by_courses`
- `mod_quiz_get_user_attempts`

Steps:

1. Enable Web Services: Site administration > Advanced features > Enable web services.
2. Enable the REST protocol: Site administration > Server > Web services > Manage protocols.
3. Create an external service: Site administration > Server > Web services > External services > Add. Check "Authorised users only" if you want to control who can use it.
4. Add the ten functions above to the service.
5. Authorise users (or roles) to access the service.
6. Have authorised students generate a token from their **Preferences > Security keys** page.

## Verifying your token

Run a quick check from the command line:

```
curl -s "https://YOUR_MOODLE/webservice/rest/server.php" \
  -d "wstoken=YOUR_TOKEN" \
  -d "wsfunction=core_webservice_get_site_info" \
  -d "moodlewsrestformat=json" | head -c 200
```

If you see your name and `userid` in the response, the token works. If you see `"errorcode":"invalidtoken"`, regenerate it.
