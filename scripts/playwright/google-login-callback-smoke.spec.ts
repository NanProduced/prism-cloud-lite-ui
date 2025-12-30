import { test, expect } from "@playwright/test";

function bffSuccess<T>(data: T) {
  return {
    success: true,
    data,
    error: null,
    traceId: "pw-trace-" + Date.now(),
  };
}

test("google implicit callback recovers continueUrl from hash state", async ({ page }) => {
  const baseUrl = process.env.PW_BASE_URL || "http://localhost:5173";

  const fakeContinueUrl =
    "http://localhost:8081/auth/oauth2/authorize?response_type=code&client_id=prism-gateway-client&redirect_uri=http%3A%2F%2Flocalhost%3A8082%2Flogin%2Foauth2%2Fcode%2Fprism-gateway&scope=openid%2Cemail&state=pw";

  await page.route("**/auth/login/google", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(bffSuccess({ redirectUrl: "/dashboard" })),
    });
  });

  let userMeCallCount = 0;
  await page.route("**/api/v1/user/me", async (route) => {
    userMeCallCount += 1;
    if (userMeCallCount === 1) {
      // First checkAuth (PublicLayout) should behave as unauthenticated so LoginPage can run the callback logic.
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          data: null,
          error: { code: "AUTH-401", message: "unauthorized", displayMessage: "unauthorized", retryable: true },
          traceId: "pw-trace-" + Date.now(),
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        bffSuccess({
          publicId: "pw-user",
          email: "pw-user@prism.local",
          displayName: "Playwright User",
        })
      ),
    });
  });

  const googleLoginRequest = page.waitForRequest((req) => {
    return req.method() === "POST" && req.url().includes("/auth/login/google");
  });

  await page.goto(
    `${baseUrl}/login#id_token=pw.fake.jwt&state=${encodeURIComponent(fakeContinueUrl)}`,
    { waitUntil: "domcontentloaded" }
  );

  const req = await googleLoginRequest;
  const body = req.postDataJSON() as { idToken?: string; continueUrl?: string };

  expect(body.idToken).toBeTruthy();
  expect(body.continueUrl).toBe(fakeContinueUrl);

  await page.waitForURL("**/dashboard/**", { timeout: 15_000 });
});
