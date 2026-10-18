# Quiz AI and tutor configuration

The tutor first tries the server AI API, then calls the browser's Puter SDK with `gemini-2.5-flash`. Quiz generation now has the same browser fallback. Both features import `frontend/src/utils/puterChat.js`, so they share the installed SDK singleton, model and response normalization.

1. An authenticated quiz start resolves the real course and prompt on the server.
2. Server-owned Puter or existing Groq/Gemini credentials are still preferred.
3. If server generation fails, the response contains `QUIZ_BROWSER_GENERATION_REQUIRED` and the course-bound generation prompt. The quiz calls the same Puter helper as the tutor, restricted to an existing signed-in SDK session.
4. Generated JSON is posted to the authenticated quiz endpoint. The server validates question count, size, four unique options, answer membership and explanations before creating the attempt. Course title, user, initial score and status come from the server.
5. Checking answers, answer locking, final score, MongoDB history, ownership checks and resume continue through existing server endpoints.

No Gemini/Groq key or server Puter token is required for the browser fallback when the tutor's Puter session already works on the same origin. No browser token is sent to the backend. The quiz adds no sign-in/reconnect controls and does not initiate SDK chat without an existing session. Puter itself still controls session validity, permissions and usage limits: browser SDK access cannot be guaranteed for a fresh browser with no session. A universally popup-free service requires an owner-configured server provider.

Browser-generated questions are practice material. Their answer keys necessarily pass through the generating browser and can be inspected or modified there. `generationSource: browser-puter` records this provenance. Such results must not be treated as trusted exams, certificates or leaderboard evidence. API responses still hide unchecked answers and clients cannot submit scores or overwrite checked answers. Server-generated quizzes retain their existing server-only answer keys.

Deploy both the Render backend and Vercel frontend from this change. Old backend versions do not implement the browser-generation handshake; a frontend-only deploy cannot fix the missing-key error. No new environment variables or database migration are required (the provenance field is optional/defaulted for existing attempts).
