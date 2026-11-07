import { test, expect, type BrowserContext } from "@playwright/test";

async function externalServices(context: BrowserContext) {
  await context.route("https://api.dictionaryapi.dev/**", async (route) => {
    const word = decodeURIComponent(new URL(route.request().url()).pathname.split("/").at(-1)!);
    if (word === "missingword") return route.fulfill({ status: 404, json: {} });
    return route.fulfill({
      json: [
        {
          word,
          phonetic: "/həˈləʊ/",
          phonetics: [],
          meanings: [
            {
              partOfSpeech: "noun",
              definitions: [{ definition: "A greeting.", example: "Say hello." }],
              synonyms: ["greeting"],
            },
          ],
          sourceUrls: ["https://en.wiktionary.org/wiki/hello"],
        },
      ],
    });
  });
  await context.route("https://api.github.com/users/**", (route) =>
    route.fulfill({
      json: {
        id: 583231,
        login: "octocat",
        name: "The Octocat",
        avatar_url: "https://avatars.githubusercontent.com/u/583231?v=4",
        created_at: "2011-01-25T18:44:36Z",
        public_repos: 0,
        followers: 0,
        following: 0,
        bio: null,
        location: null,
        company: null,
        blog: "",
        twitter_username: null,
      },
    }),
  );
  await context.route("https://avatars.githubusercontent.com/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" />',
    }),
  );
}

test.beforeEach(async ({ context }) => externalServices(context));

test("tip presets, custom Enter, invalid people, and reset", async ({ page }) => {
  await page.goto("/tip");
  await page.getByLabel("Bill", { exact: true }).fill("100");
  await page.getByLabel("Number of people").fill("4");
  await page.getByRole("button", { name: "15%", exact: true }).click();
  await expect(page.getByLabel("Tip per person", { exact: true })).toHaveText("$3.75");
  await expect(page.getByLabel("Total per person", { exact: true })).toHaveText("$28.75");
  await page.getByRole("button", { name: "Custom", exact: true }).click();
  await page.getByLabel("Custom tip percentage").fill("12.5");
  await page.getByLabel("Custom tip percentage").press("Enter");
  await expect(page.getByLabel("Tip per person", { exact: true })).toHaveText("$3.13");
  await expect(page.getByRole("button", { name: "Custom", exact: true })).toBeFocused();
  await page.getByLabel("Number of people").fill("0");
  await expect(page.getByLabel("Number of people")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Total per person", { exact: true })).toHaveText("Unavailable");
  await page.getByRole("button", { name: "RESET", exact: true }).click();
  await expect(page.getByLabel("Bill", { exact: true })).toHaveValue("0");
  await expect(page.getByLabel("Number of people")).toHaveValue("1");
  await expect(page.getByLabel("Tip per person", { exact: true })).toHaveText("$0.00");
});

test("dictionary lookup and GitHub zero counts work without relying on live APIs", async ({
  page,
}) => {
  await page.goto("/dictionary");
  await expect(page.getByRole("heading", { name: "hello", exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pronunciation unavailable for hello" }),
  ).toBeDisabled();
  await page.getByLabel("Word to look up").fill("missingword");
  await page.getByLabel("Word to look up").press("Enter");
  await expect(page.getByText(/No definition found/)).toBeVisible();
  await page.goto("/devfinder");
  await expect(page.getByRole("heading", { name: "The Octocat" })).toBeVisible();
  for (const term of ["Repos", "Followers", "Following"]) {
    await expect(page.getByText(term, { exact: true }).locator("..").locator("dd")).toHaveText("0");
  }
});

test("mobile navigation restores focus and pages fit a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/dictionary");
  const trigger = page.getByRole("button", { name: "Open dictionary navigation" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(trigger).toBeFocused();
  for (const path of ["/", "/dictionary/word-list", "/devfinder/saved-profiles", "/todo", "/tip"]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  const response = await page.goto("/not-a-tool");
  expect(response?.status()).toBe(404);
});

test.describe("PostgreSQL browser workflows", () => {
  test.skip(
    !process.env.BROWSER_DATABASE_URL,
    "Set BROWSER_DATABASE_URL to a migrated disposable test database.",
  );

  test("dictionary save, rename, refresh, and delete", async ({ page }) => {
    await page.goto("/dictionary");
    await page.getByRole("button", { name: "Save hello", exact: true }).click();
    await expect(page.getByRole("button", { name: "Remove hello from saved words" })).toBeVisible();
    await page.getByRole("link", { name: "Word List", exact: true }).click();
    await page.getByRole("button", { name: "Rename hello", exact: true }).click();
    await page.getByRole("textbox", { name: "Rename hello", exact: true }).fill("greeting");
    await page.getByRole("textbox", { name: "Rename hello", exact: true }).press("Enter");
    await expect(page.getByRole("button", { name: "Delete greeting" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Rename greeting", exact: true })).toBeFocused();
    await page.reload();
    await page.getByRole("button", { name: "Delete greeting" }).click();
    await expect(page.getByText(/No words saved yet/)).toBeVisible();
  });

  test("DevFinder save, direct saved URL, profile link, and delete", async ({ page }) => {
    await page.goto("/devfinder");
    await page.getByRole("button", { name: "Save octocat", exact: true }).click();
    await page.goto("/devfinder/saved-profiles");
    await expect(page.getByRole("link", { name: "View octocat's profile" })).toHaveAttribute(
      "href",
      "/devfinder?profile=octocat",
    );
    await page.getByRole("button", { name: "Delete octocat from saved profiles" }).click();
    await expect(page.getByText(/No profiles available/)).toBeVisible();
  });

  test("todos persist and stay private to their browser", async ({ page, browser }) => {
    await page.goto("/todo");
    await page.getByLabel("New task").fill("Check the migration");
    await page.getByLabel("New task").press("Enter");
    await expect(page.getByText("1 item left", { exact: true })).toBeVisible();
    await expect(page.getByLabel("New task")).toBeFocused();
    await page.reload();
    await page.getByRole("checkbox", { name: "Complete Check the migration" }).click();
    await expect(page.getByText("0 items left", { exact: true })).toBeVisible();
    const other = await browser.newContext();
    try {
      const otherPage = await other.newPage();
      await otherPage.goto("http://127.0.0.1:3101/todo");
      await expect(otherPage.getByText(/Your list is clear/)).toBeVisible();
      await expect(otherPage.getByText("Check the migration", { exact: true })).toHaveCount(0);
    } finally {
      await other.close();
    }
    await page.getByRole("button", { name: "Delete Check the migration" }).click();
    await expect(page.getByLabel("New task")).toBeFocused();
  });

  test("simultaneous first visits share one cookie identity", async ({ context, page }) => {
    let issued = 0;
    let started = 0;
    let release!: () => void;
    let entered!: () => void;
    const firstRequest = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await context.route("**/api/words", async (route) => {
      if (route.request().method() === "GET") {
        started++;
        if (started === 1) {
          entered();
          await gate;
        }
      }
      const response = await route.fetch();
      if (response.headers()["set-cookie"]) issued++;
      await route.fulfill({ response });
    });
    const second = await context.newPage();
    await page.goto("/dictionary");
    await firstRequest;
    try {
      await second.goto("/dictionary/word-list");
      await expect(second.getByText("Loading saved words…", { exact: true })).toBeVisible();
      await expect
        .poll(() =>
          second.evaluate(
            async () =>
              (await navigator.locks.query()).pending?.filter(
                (lock) => lock.name === "tools-session-bootstrap",
              ).length ?? 0,
          ),
        )
        .toBeGreaterThan(0);
      expect(started).toBe(1);
    } finally {
      release();
    }
    await expect(page.getByRole("button", { name: "Save hello", exact: true })).toBeEnabled();
    await expect(second.getByText(/No words saved yet/)).toBeVisible();
    expect(issued).toBe(1);
    await page.getByRole("button", { name: "Save hello", exact: true }).click();
    await expect(page.getByRole("button", { name: "Remove hello from saved words" })).toBeVisible();
    await second.reload();
    await second.getByRole("button", { name: "Delete hello" }).click();
  });
});
