import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Quiz from "./Quiz.jsx";
import PastTests from "../dashboard/PastTests.jsx";
import api from "../../utils/api";
import { askPuter } from "../../utils/puterChat";
vi.mock("../../utils/puterChat", () => ({ askPuter: vi.fn() }));

vi.mock("../../utils/api", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("../../context/CourseContext.jsx", () => ({ CourseData: () => ({ fetchCourse, course: { title: "Data structures" } }) }));
vi.mock("../../context/UserContext.jsx", () => ({ UserData: () => ({ user: { _id: "learner" } }) }));
vi.mock("react-router-dom", () => ({ useParams: () => ({ id: "course" }), useNavigate: () => navigate }));
vi.mock("react-hot-toast", () => ({ default: { error: vi.fn() } }));
const { fetchCourse, navigate } = vi.hoisted(() => ({ fetchCourse: vi.fn(), navigate: vi.fn() }));
const questions = [1, 2].map(n => ({ question: `Question ${n}: FIFO?`, options: ["Stack", "Queue", "Tree", "Graph"] }));
let attempt;
const snapshot = () => ({ data: { attempt: structuredClone(attempt) } });
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  attempt = { _id: "attempt", courseId: "course", topic: "Data structures", difficulty: "medium", questions, answers: [], score: 0, status: "in_progress" };
  api.get.mockImplementation(async () => snapshot());
  api.post.mockImplementation(async (url, body) => {
    if (url.endsWith("/answers")) {
      attempt.answers.push({ ...body, isCorrect: body.selectedAnswer === "Queue", correctAnswer: "Queue", explanation: "A queue follows FIFO." });
      attempt.score = attempt.answers.filter(a => a.isCorrect).length;
      if (attempt.answers.length === questions.length) attempt.status = "completed";
    }
    return snapshot();
  });
});
afterEach(cleanup);
async function start() {
  const user = userEvent.setup(); render(<Quiz />);
  await user.click(await screen.findByRole("button", { name: "Begin Now" }));
  await screen.findByRole("heading", { name: questions[0].question });
  return user;
}

test("Check requires a selection, locks checked options, and reveals feedback before Next", async () => {
  const user = await start();
  expect(screen.getByRole("button", { name: "Check", exact: true }).disabled).toBe(true);
  expect(screen.queryByText("A queue follows FIFO.")).toBeNull();
  await user.click(screen.getByRole("button", { name: "A Stack" }));
  await user.click(screen.getByRole("button", { name: "Check", exact: true }));
  await screen.findByText("Answer saved and locked.");
  expect(screen.getByRole("button", { name: "B Queue" }).disabled).toBe(true);
  expect(screen.getByText("Incorrect")).toBeTruthy();
  expect(screen.getByText("A queue follows FIFO.")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "B Queue" }));
  expect(api.post.mock.calls.filter(([url]) => url.endsWith("/answers"))).toHaveLength(1);
  await user.click(screen.getByRole("button", { name: "Next Question" }));
  expect(screen.getByRole("button", { name: "Check", exact: true }).disabled).toBe(true);
});
test("last checked answer automatically shows the saved score and every question", async () => {
  const user = await start();
  await user.click(screen.getByRole("button", { name: "A Stack" }));
  await user.click(screen.getByRole("button", { name: "Check", exact: true }));
  await user.click(await screen.findByRole("button", { name: "Next Question" }));
  await user.click(screen.getByRole("button", { name: "B Queue" }));
  await user.click(screen.getByRole("button", { name: "Check", exact: true }));
  await screen.findByRole("heading", { name: "Quiz completed" });
  expect(screen.getByText("1", { selector: ".score-num" })).toBeTruthy();
  expect(screen.getAllByText("A queue follows FIFO.")).toHaveLength(2);
  await user.click(screen.getByRole("button", { name: "Past Tests", exact: true }));
  expect(navigate).toHaveBeenCalledWith("/learner/dashboard#past-tests");
});
test("reload resumes the next unchecked question from the saved server attempt", async () => {
  localStorage.setItem("quiz-attempt:learner:course", "attempt");
  attempt.answers.push({ questionIndex: 0, selectedAnswer: "Stack", correctAnswer: "Queue", isCorrect: false });
  render(<Quiz />);
  await screen.findByRole("heading", { name: questions[1].question });
  expect(api.get).toHaveBeenCalledWith("/gemini/quiz/attempts/attempt");
  expect(api.post).not.toHaveBeenCalled();
});
test("failed save preserves selected answer and allows retry without revealing feedback", async () => {
  const user = await start();
  api.post.mockRejectedValueOnce(new Error("Network failed"));
  await user.click(screen.getByRole("button", { name: "B Queue" }));
  await user.click(screen.getByRole("button", { name: "Check", exact: true }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Check", exact: true }).disabled).toBe(false));
  expect(screen.queryByText("Answer saved and locked.")).toBeNull();
  expect(screen.getByRole("button", { name: "B Queue" }).getAttribute("aria-pressed")).toBe("true");
  await user.click(screen.getByRole("button", { name: "Check", exact: true }));
  await screen.findByText("Answer saved and locked.");
});
test("lost save response reconciles checked state rather than allowing a new answer", async () => {
  const user = await start();
  api.post.mockImplementationOnce(async (url, body) => {
    attempt.answers.push({ ...body, isCorrect: true, correctAnswer: "Queue", explanation: "A queue follows FIFO." });
    attempt.score = 1;
    throw new Error("Response lost");
  });
  await user.click(screen.getByRole("button", { name: "B Queue" }));
  await user.click(screen.getByRole("button", { name: "Check", exact: true }));
  await screen.findByText("Answer saved and locked.");
  expect(screen.getByRole("button", { name: "A Stack" }).disabled).toBe(true);
});
test("history loads completed tests and opens saved question review", async () => {
  attempt.status = "completed";
  attempt.answers = questions.map((q, questionIndex) => ({ questionIndex, selectedAnswer: "Queue", correctAnswer: "Queue", isCorrect: true, explanation: "A queue follows FIFO." }));
  api.get.mockImplementation(async url => url.includes("?page=") ? { data: { tests: [{ _id: "attempt", topic: "Data structures", score: 2, totalQuestions: 2, difficulty: "medium", completedAt: "2026-10-18T21:00:00Z" }], hasMore: false } } : snapshot());
  const user = userEvent.setup(); render(<PastTests />);
  await user.click(await screen.findByRole("button", { name: "Review test" }));
  await screen.findByRole("button", { name: "Close review" });
  expect(screen.getAllByText("A queue follows FIFO.")).toHaveLength(2);
  await user.click(screen.getByRole("button", { name: "Close review" }));
  expect(screen.queryByText("Questions and answers")).toBeNull();
});
test("history shows an empty state and recovers from network errors", async () => {
  api.get.mockRejectedValueOnce(new Error("Network failed"));
  api.get.mockResolvedValueOnce({ data: { tests: [], hasMore: false } });
  const user = userEvent.setup(); render(<PastTests />);
  await user.click(await screen.findByRole("button", { name: "Retry" }));
  await screen.findByText("Your completed quizzes will appear here.");
});

test("quiz starts through the server without learner Puter credentials or a third-party login step", async () => {
  await start();
  expect(api.post).toHaveBeenCalledWith("/gemini/quiz", {
    courseId: "course", numQuestions: 10, difficulty: "medium",
  });
  expect(api.post.mock.calls[0]).toHaveLength(2);
  expect(screen.queryByText(/sign in to Puter/i)).toBeNull();
});
test("server configuration errors leave the start button available without a reconnect flow", async () => {
  api.post.mockRejectedValueOnce({ response: { data: { code: "QUIZ_AI_NOT_CONFIGURED", message: "Quiz temporarily unavailable" } } });
  const user = userEvent.setup(); render(<Quiz />);
  await user.click(await screen.findByRole("button", { name: "Begin Now" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Begin Now" }).disabled).toBe(false));
  expect(api.post).toHaveBeenCalledTimes(1);
});


test("quiz reuses tutor Puter generation when the server has no AI configuration, then saves before displaying", async () => {
  const user = userEvent.setup();
  const generatedQuiz = JSON.stringify([{ question: "From tutor" }]);
  askPuter.mockResolvedValueOnce(generatedQuiz);
  api.post.mockRejectedValueOnce({ response: { status: 503, data: { code: "QUIZ_BROWSER_GENERATION_REQUIRED", prompt: "Generate course questions" } } });
  render(<Quiz />);
  await user.click(await screen.findByRole("button", { name: "Begin Now" }));
  await screen.findByRole("heading", { name: questions[0].question });
  expect(askPuter).toHaveBeenCalledWith([{ role: "user", content: "Generate course questions" }], { existingSessionOnly: true });
  expect(api.post.mock.calls[1]).toEqual(["/gemini/quiz", { courseId: "course", numQuestions: 10, difficulty: "medium", generatedQuiz }]);
  expect(localStorage.getItem("quiz-attempt:learner:course")).toBe("attempt");
});
test("failed Puter generation leaves the quiz restartable and creates no local-only attempt", async () => {
  askPuter.mockRejectedValueOnce(new Error("Not connected"));
  api.post.mockRejectedValueOnce({ response: { status: 503, data: { code: "QUIZ_BROWSER_GENERATION_REQUIRED", prompt: "Generate questions" } } });
  const user = userEvent.setup(); render(<Quiz />);
  await user.click(await screen.findByRole("button", { name: "Begin Now" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Begin Now" }).disabled).toBe(false));
  expect(api.post).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem("quiz-attempt:learner:course")).toBeNull();
});
test("unauthorized requests do not invoke browser AI", async () => {
  api.post.mockRejectedValueOnce({ response: { status: 401, data: { message: "Unauthorized" } } });
  const user = userEvent.setup(); render(<Quiz />);
  await user.click(await screen.findByRole("button", { name: "Begin Now" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Begin Now" }).disabled).toBe(false));
  expect(askPuter).not.toHaveBeenCalled();
});
