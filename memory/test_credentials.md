# Test Credentials for Bookup your Hookup

## Primary Test User (use for all flows)
- Email: test_1779827434@bookup.com
- Password: testpass123
- user_id: user_dcaf998b53e5
- Status: Auto-approved, Free Member

## Secondary Test User (create on-the-fly when needed)
- POST /api/auth/register with any new email + testpass123
- All new registrations are AUTO-APPROVED with free status

## Admin Account
- Email: admin@bookup.com
- Password: (create via register endpoint, then update role manually in MongoDB if admin features are tested)
- Admin emails list in server.py:require_admin() = ["admin@bookup.com"]

## Notes
- All registrations AUTO-APPROVED
- Messaging is unlimited and FREE
- Cookies set as session_token on login (HttpOnly). Use `withCredentials: true` from frontend.
- For curl tests use `Authorization: Bearer <token>` from the login response.

## Pre-seeded test data (created during smoke test)
- Chatroom: "NA Couples" (room_id: room_474eca7a1e13)
- Forum: "Intro" (forum_id: forum_3502d020cb20, category: introductions)
- Personal Ad: "Couple Seeking" (prs_985dda3a1bb8)
- Hot Wife Post: hw_d72535c6e8e2
