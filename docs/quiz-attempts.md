# Saved quiz attempts

Signed-in VidyaSetu learners start a quiz, select an option and click Check. The backend saves the answer, reveals its correct answer and explanation, and locks it. Checking the final question completes the attempt automatically. Student Dashboard → Past Tests contains saved scores and question reviews.

## No learner Puter login

The quiz frontend calls only the VidyaSetu backend. It does not import Puter, open a Puter sign-in/permission popup, ask learners for credentials, or forward `X-Puter-Token`. Normal VidyaSetu authentication remains required for ownership and history.

Generation provider selection:

1. When the backend has `PUTER_AUTH_TOKEN`, generate through Puter's native `/drivers/call` route using the server-owned account. This needs no Gemini/Groq provider key. The native request matches `puter.ai.chat()` from the installed SDK: interface `puter-chat-completion`, driver `ai-chat`, method `complete`, model `gemini-2.5-flash`.
2. Otherwise preserve the original server AI configuration: `GROQ_API_KEY`, then `GEMINI_API`. This is the pattern used by the existing "no 3rd party login" AI tutor implementation.
3. If no server credential is configured, return HTTP 503 with `QUIZ_AI_NOT_CONFIGURED`. Do not try an interactive browser fallback or claim the learner's Puter session expired.

To use Puter with no learner popup, the owner must configure `PUTER_AUTH_TOKEN` in the backend host's secret environment settings. Obtain it in the owner's Puter dashboard; never commit it or place it in a frontend/VITE variable. AI usage consumes the configured server account's credits/limits. No hosting secret has been created, read, or changed by this PR. Without a configured server credential there is no authenticated AI generation path.

The prior implementation incorrectly forwarded browser app sessions to Puter's separate OpenAI-compatible gateway and mapped both 401 and 403 to "session expired". This change uses native driver responses and distinguishes authentication, permission, quota, and availability failures, including failures embedded in HTTP 200 envelopes. Owner authentication/permission failures return service errors, never learner reconnect instructions. There are no automatic paid retries or provider changes after an attempted Puter generation fails.

## Storage and security

The server builds the prompt from the stored course title, validates AI JSON, and saves the answer key in MongoDB. It rejects malformed questions, duplicate options, unmatched answers, missing explanations, and incorrect question counts. Unchecked answer keys are excluded from responses. Grading and scoring run on the server. Attempts are scoped to their authenticated owner, and atomic version guards prevent concurrent answer overwrites. Same-answer retries are idempotent.

Puter tokens remain on the backend and are not saved in attempts, returned to the client, or logged. Raw provider/Axios errors are never exposed because they can contain credentials.

## API

All routes are under `/gemini` and require the existing VidyaSetu authentication.

| Method | Path | Input / result |
| --- | --- | --- |
| POST | `/quiz` | `{courseId, numQuestions, difficulty}` → `{attempt}`; no learner Puter token |
| GET | `/quiz/attempts?page=1` | Current user's completed tests, 20 per page; `{tests, hasMore}` |
| GET | `/quiz/attempts/:attemptId` | Public questions and already checked answers |
| POST | `/quiz/attempts/:attemptId/answers` | `{questionIndex, selectedAnswer}` → saved `{attempt}` |

Deploy backend before or with frontend. No database migration or new npm dependency is required. The existing MongoDB connection stores `quizattempts`. Old browser-only results cannot be recovered.

A per-user, per-course localStorage pointer resumes the latest attempt in the same browser. Checked answers are recovered from the server; selected-but-unchecked options are not saved. Completed tests are available in any signed-in browser.

## Validation

- 26 backend tests: native Puter request/response contracts, HTTP 200 error envelopes, server credential selection, no learner-token dependency, no credential leakage, validated persistence, scoring, ownership, locking, retries, concurrent writes, and paginated history.
- 9 frontend component tests: start without Puter credentials, unavailable-service recovery without reconnect prompts, Check gating/locking, resume, lost/failed save responses, automatic results, and history review.
- Frontend production build and changed-file ESLint.

Automated tests mock external AI and MongoDB boundaries. Authenticated live Puter generation and live persistence still need a runtime smoke test; no configured owner credential is available in the task workspace. Browser/mobile visual verification remains pending.

References: [Puter server authentication](https://docs.puter.com/getting-started/), [Puter Node guide](https://developer.puter.com/tutorials/puter-js-node-js/). Native wire contracts were checked against the installed `@heyputer/puter.js` chat and network modules.
