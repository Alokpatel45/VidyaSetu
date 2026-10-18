import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Header from "../../components/header/Header";
import Courses from "./Courses";
import Dashboard from "../dashboard/Dashboard";
import Lecture from "../../lecture/Lecture";
import api from "../../utils/api";

const { data, account } = vi.hoisted(() => ({ data: {}, account: {} }));
vi.mock("../../context/CourseContext", () => ({ CourseData: () => data }));
vi.mock("../../context/UserContext", () => ({ UserData: () => account }));
vi.mock("../../utils/api", () => ({
  default: { get: vi.fn(), delete: vi.fn() },
}));
vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));
const course = {
  _id: "oop",
  title: "Objects & classes",
  category: "Programming Language",
  price: 299,
  duration: 3,
  createdBy: "Alok",
  description: "Learn OOP",
};
function app(path = "/courses", header = false) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      {header && <Header isAuth={account.isAuth} />}
      <Routes>
        <Route path="/courses" element={<Courses />} />
        <Route path="/:id/dashboard" element={<Dashboard />} />
        <Route path="/lectures/:id" element={<Lecture user={account.user} />} />
        <Route path="/course/study/:id" element={<h1>Course workspace</h1>} />
        <Route path="/login" element={<h1>Login page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  document.documentElement.dataset.theme = "light";
  Object.assign(account, {
    isAuth: true,
    user: { _id: "learner", role: "user", subscription: ["oop"] },
  });
  Object.assign(data, {
    courses: [
      course,
      {
        ...course,
        _id: "web",
        title: "React foundations",
        category: "Web Devwlopment",
      },
    ],
    myCourse: [course],
    fetchCourses: vi.fn(),
  });
  api.get.mockResolvedValue({ data: { tests: [], hasMore: false } });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
test("signed-in navigation opens, closes with Escape, and opens Past tests directly", async () => {
  const user = userEvent.setup();
  app("/courses", true);
  const toggle = screen.getByRole("button", { name: "Open navigation" });
  await user.click(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  await user.keyboard("{Escape}");
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  await user.click(toggle);
  await user.click(screen.getByRole("link", { name: "Past tests" }));
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  await screen.findByText("Your completed quizzes will appear here.");
  expect(api.get).toHaveBeenCalledWith("/gemini/quiz/attempts?page=1");
  await user.click(screen.getAllByRole("link", { name: "My learning" })[1]);
  expect(screen.getByRole("heading", { name: course.title })).toBeTruthy();
});
test("theme toggles persist and remain usable when storage is blocked", async () => {
  const user = userEvent.setup();
  app("/courses", true);
  await user.click(
    screen.getByRole("button", { name: "Switch to dark theme" }),
  );
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(localStorage.getItem("vidyasetu-theme")).toBe("dark");
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Blocked");
  });
  await user.click(
    screen.getByRole("button", { name: "Switch to light theme" }),
  );
  expect(document.documentElement.dataset.theme).toBe("light");
});
test("search and real categories combine, including the legacy category spelling; reset recovers results", async () => {
  const user = userEvent.setup();
  app();
  await user.click(screen.getByRole("button", { name: "Web Development" }));
  expect(screen.queryByRole("heading", { name: course.title })).toBeNull();
  expect(
    screen.getByRole("heading", { name: "React foundations" }),
  ).toBeTruthy();
  await user.type(
    screen.getByRole("searchbox", { name: "Search courses" }),
    "no match",
  );
  expect(
    screen.getByRole("heading", { name: "No courses found" }),
  ).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Clear all filters" }));
  expect(screen.getAllByRole("article")).toHaveLength(2);
  await user.click(screen.getByRole("link", { name: "Continue learning" }));
  expect(
    screen.getByRole("heading", { name: "Course workspace" }),
  ).toBeTruthy();
});
test("learner and guest course actions retain their correct destinations and admin deletion confirms", async () => {
  const user = userEvent.setup();
  app();
  await user.click(screen.getByRole("button", { name: "Study" }));
  expect(
    screen.getByRole("heading", { name: "Course workspace" }),
  ).toBeTruthy();
  cleanup();
  account.isAuth = false;
  account.user = null;
  app();
  expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  await user.click(screen.getAllByRole("button", { name: "Get started" })[0]);
  expect(screen.getByRole("heading", { name: "Login page" })).toBeTruthy();
  cleanup();
  account.isAuth = true;
  account.user = { role: "admin" };
  app();
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);
  expect(confirm).toHaveBeenCalled();
  expect(api.delete).not.toHaveBeenCalled();
});
test("classroom playlist works with keyboard and lecture navigation", async () => {
  const user = userEvent.setup();
  api.get.mockImplementation(async (url) => ({
    data:
      url === "/api/lectures/oop"
        ? {
            lectures: [
              { _id: "one", title: "Introduction" },
              { _id: "two", title: "Classes" },
            ],
          }
        : {
            lecture: {
              _id: url.endsWith("one") ? "one" : "two",
              title: url.endsWith("one") ? "Introduction" : "Classes",
              video: "/video.mp4",
            },
          },
  }));
  app("/lectures/oop");
  await screen.findByRole("heading", { name: "Introduction" });
  const second = screen.getByRole("button", {
    name: "2 Classes Video Lecture",
  });
  second.focus();
  await user.keyboard("{Enter}");
  await screen.findByRole("heading", { name: "Classes" });
  expect(second.getAttribute("aria-current")).toBe("true");
  await user.click(screen.getByRole("button", { name: "Prev" }));
  await waitFor(() =>
    expect(screen.getByRole("heading", { name: "Introduction" })).toBeTruthy(),
  );
});
