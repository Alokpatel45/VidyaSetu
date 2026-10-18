# Saved quiz attempts

Signed-in learners start a quiz from a course. They select an option and click Check to save it, see the correct answer and its AI-generated explanation, and lock the answer. Checking the final question automatically completes the attempt. The result contains the score and a question-by-question review. Student Dashboard → Past Tests lists completed attempts and opens their saved reviews.

The server uses Puter to generate and validate questions from the course title and stores the answer key in MongoDB. Unchecked answers and explanations are excluded from API responses. Scores are derived on the server. Every read and answer update is scoped to the authenticated user. A version condition on the atomic update prevents concurrent writes from overwriting a checked answer. Retrying the same answer returns the saved result without changing the score.

## API

All endpoints use the existing authentication middleware, under `/gemini`.

| Method | Path | Input / result |
| --- | --- | --- |
| POST | `/quiz` | `{courseId, numQuestions, difficulty}` plus `X-Puter-Token` → `{attempt}` |
| GET | `/quiz/attempts?page=1` | Completed tests for the current user, 20 per page; `{tests, hasMore}` |
| GET | `/quiz/attempts/:attemptId` | Current user's attempt; public questions plus checked answers |
| POST | `/quiz/attempts/:attemptId/answers` | `{questionIndex, selectedAnswer}` → saved `{attempt}` |

`POST /quiz` requires VidyaSetu authentication, a Puter session in `X-Puter-Token`, and `courseId` rather than a caller-supplied topic. The frontend in this change uses the new contract. Invalid AI JSON, duplicate options, a missing explanation, incorrect question count, or an answer absent from the options is rejected before creating an attempt.

## Persistence and rollout

Deploy the backend before or with the frontend. The existing MongoDB connection stores a new `quizattempts` collection; no new service, secret, or data migration is required. Existing quiz results cannot be recovered because the old implementation calculated them only in the browser. Quiz generation no longer uses `GEMINI_API` or `GROQ_API_KEY`.

Checked answers are persisted immediately. A per-user, per-course localStorage pointer allows the same browser to reload the current attempt from the server. Only checked selections are recovered; an option selected without Check is not saved. Completed tests can be accessed from any signed-in browser using Past Tests. There is no cross-device in-progress-attempt picker in this change.

## Puter generation

Begin Now / Try Again obtains a session through the installed Puter browser SDK. Existing SDK sessions are reused; otherwise sign-in is invoked directly from the click so mobile popup rules are respected. The UI explains that Puter sign-in and account limits apply. Cancelled/blocked sign-in leaves the start button available; an expired session prompts a fresh sign-in on the next explicit start.

Only the generation request sends `X-Puter-Token` to the VidyaSetu backend. The backend calls Puter's OpenAI-compatible chat gateway using that request's token and `google/gemini-2.5-flash`. This is a Puter-hosted model call and does not require a Google API key. Model output is validated and saved on the server, so unchecked answer keys never pass through browser generation. Check, resume and history use the existing VidyaSetu authentication without needing Puter again.

Puter tokens are not written to the attempt, application storage, URLs, or logs. Upstream errors are normalized to prevent request-header leakage. Invalid sessions return `PUTER_AUTH_REQUIRED`, usage/credit limits return `PUTER_LIMIT_REACHED`, and unavailable/empty responses return `PUTER_UNAVAILABLE`. No automatic paid retries or provider-key fallback is added. No additional npm dependency is needed.

References: [Puter sign-in](https://docs.puter.com/Auth/signIn/), [sign-in result](https://docs.puter.com/Objects/signinresult/), [Puter gateway](https://developer.puter.com/tutorials/use-openai-sdk-with-puter/).

## Validation

- `npm test --prefix server`: 21 tests covering keyless Puter generation, per-user credentials, provider failures, scoring, validation, hidden answer keys, ownership, replay protection, concurrency guards, automatic completion, and paginated history. Controller tests use model stubs; they do not establish live MongoDB connectivity.
- `npm test --prefix frontend`: 14 jsdom tests covering Puter sign-in/reconnect, cancellation, token forwarding, Check gating and locking, failed/lost response recovery, resume, automatic results, and history review/error states.
- Frontend production build and ESLint for all changed JavaScript/JSX frontend files.
- CI runs these checks on pull requests to main and pushes to main.

Live Puter generation/sign-in, live MongoDB persistence, and real-browser rendering still require a configured runtime smoke test. The local browser run was unavailable because Chromium could not be downloaded in the task environment.
