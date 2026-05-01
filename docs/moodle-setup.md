# Setting up a Moodle Web Service token

To use moodle-student-mcp you need a personal Moodle Web Service token. Most schools expose this through the "Moodle mobile web service" (the same service the official Moodle mobile app uses), but how you get the token depends on your school's setup.

Try the methods below in order. Most students get a token from method 1 or 2.

## Method 1: From the Preferences menu

This is the standard path and works on most Moodle installations.

1. Log into your Moodle.
2. Click your avatar (top right) and go to **Preferences**.
3. Under **User account**, click **Security keys**.
4. Find the row for **Moodle mobile web service** (or whichever service your school exposes).
5. Copy the token shown.

If you don't see a "Security keys" link in the User account section, try method 2.

## Method 2: Direct URL

The token page exists at a fixed URL even if the menu hides it. After logging into Moodle in your browser, paste this into the address bar:

```
https://YOUR_MOODLE/user/managetoken.php
```

(Replace `YOUR_MOODLE` with your school's Moodle hostname.)

Three things can happen:

- **A token table appears.** Copy the token. Done.
- **The page loads but is empty** ("No security keys found" or similar). The mobile service exists site-wide but your account is not authorized for it. Skip to method 4.
- **You get a permission denied or 404 error.** Web Services or token generation are disabled for students entirely. Skip to method 4.

## Method 3: Password to token exchange (no-SSO Moodles only)

If your Moodle uses local username and password authentication (not SSO like SAML, Shibboleth, OAuth, or SWITCH edu-ID), you can ask Moodle to issue a token in exchange for your password. This is what the official mobile app does on first login.

In a terminal:

```
curl -s "https://YOUR_MOODLE/login/token.php?service=moodle_mobile_app" \
  --data-urlencode "username=YOUR_USERNAME" \
  --data-urlencode "password=YOUR_PASSWORD"
```

Or in PowerShell, with a secure prompt that keeps the password out of shell history:

```powershell
$user = Read-Host "Moodle username"
$pw = Read-Host "Moodle password" -AsSecureString
$plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pw))
curl.exe -s "https://YOUR_MOODLE/login/token.php?service=moodle_mobile_app" `
  --data-urlencode "username=$user" --data-urlencode "password=$plain"
```

Success looks like `{"token":"abc123...","privatetoken":"..."}`. Use the `token` value.

If you get `{"error":"..."}`:

- `Web services must be enabled in Advanced features` means web services are off site-wide. Method 4.
- `Invalid login` means your password didn't match (or your account uses SSO and has no local password).
- `User does not have any external function attributed` means the mobile service is enabled but not for your account. Method 4.

If your school uses SSO, this method will not work. Use method 4.

## Method 4: Ask your Moodle admin

If methods 1 to 3 didn't work, your school has token generation locked down for students. One email usually fixes it. Find your IT support address (your university's IT portal or service desk) and send something like:

```
Subject: Activate Moodle Web Service token for my account

Hi,

I'd like to use a personal Moodle Web Service token for an MCP integration
that lets me query my own coursework data through an LLM (read-only,
personal use). The token page at
https://YOUR_MOODLE/user/managetoken.php is empty for my account, so
the mobile service is not currently authorized for me.

Could you authorize my Moodle account for the "Moodle mobile web service",
or alternatively issue me a token for an external service that includes
these read-only functions:

  core_webservice_get_site_info
  core_enrol_get_users_courses
  core_course_get_contents
  mod_assign_get_assignments
  mod_assign_get_submission_status
  gradereport_user_get_grade_items
  core_calendar_get_calendar_upcoming_view
  core_calendar_get_action_events_by_timesort
  mod_quiz_get_quizzes_by_courses
  mod_quiz_get_user_attempts

These are the same functions the official Moodle mobile app uses, so no
new permissions are involved. The integration only reads; it never writes
back to Moodle.

My account: <your.username>
Project source: https://github.com/DDotSalazar/moodle-student-mcp

Thanks!
```

Most admins approve this since the functions match what the official mobile app already needs. If they push back, point them at the "Admin instructions" section below.

## Verifying your token

Once you have a token, confirm it works with one HTTP call:

```
curl -s "https://YOUR_MOODLE/webservice/rest/server.php" \
  -d "wstoken=YOUR_TOKEN" \
  -d "wsfunction=core_webservice_get_site_info" \
  -d "moodlewsrestformat=json" | head -c 200
```

If you see your name and `userid` in the response, the token works. If you see `"errorcode":"invalidtoken"`, regenerate it. If you see `"errorcode":"accessexception"` or `"nopermissions"`, the token exists but lacks permission for that function (admin help needed).

## Admin instructions

A Moodle administrator can either enable the default mobile service for the affected accounts or create a custom external service that grants only the functions this MCP server needs. The custom service approach gives the tightest permissions.

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

Steps to set up a custom service:

1. Enable Web Services: Site administration > Advanced features > Enable web services.
2. Enable the REST protocol: Site administration > Server > Web services > Manage protocols.
3. Create an external service: Site administration > Server > Web services > External services > Add. Check "Authorised users only" if you want to control who can use it.
4. Add the ten functions above to the service.
5. Authorise users (or roles) to access the service.
6. Have authorised users generate a token from their Preferences > Security keys page (or via `https://YOUR_MOODLE/user/managetoken.php`).
