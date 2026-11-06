import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
try {
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("checkbox", { name: "Dernier lot", exact: true })
    .click();
  const slider = page.getByRole("slider", { name: "Batch size", exact: true });
  const value = page.locator("#batch-value");
  async function set(n) {
    await slider.fill(String(n));
  }
  await expect(slider).toHaveAttribute("max", "40");
  await expect(value).toHaveText("all (40)");
  for (const n of [1, 7, 19, 32, 39]) {
    await page
      .getByRole("button", { name: /Réinitialiser l’entraînement/ })
      .click();
    await set(n);
    await expect(value).toHaveText(String(n));

    await page.getByRole("button", { name: /Un pas/ }).click();
    await expect(page.locator(".batch-ring")).toHaveCount(n);
    await expect(page.locator(".last-batch")).toHaveText(
      `Dernier lot : ${n} / 40 points`,
    );
  }
  await slider.focus();
  await slider.press("End");
  await expect(value).toHaveText("all (40)");
  await page.getByRole("button", { name: /Un pas/ }).click();
  await expect(page.locator(".batch-ring")).toHaveCount(1);
  await page.getByRole("button", { name: /Un pas/ }).click();
  await expect(page.locator(".batch-ring")).toHaveCount(40);
  await page
    .getByRole("combobox", { name: "Dessins prédéfinis", exact: true })
    .selectOption("Cercles");
  await expect(slider).toHaveAttribute("max", "48");
  await expect(value).toHaveText("all (48)");
  await set(32);
  await page.getByRole("button", { name: /Un pas/ }).click();
  await expect(page.locator(".batch-ring")).toHaveCount(32);
  await page.getByRole("button", { name: /Un pas/ }).click();
  await expect(page.locator(".batch-ring")).toHaveCount(16);
  await page.getByRole("button", { name: /Lecture/ }).click();
  await expect(page.getByRole("button", { name: /Pause/ })).toBeVisible();
  await set(7);
  await expect(page.getByRole("button", { name: /Lecture/ })).toBeVisible();
  await page.getByRole("button", { name: /Un pas/ }).click();
  for (const [width, height] of [
    [1366, 768],
    [1024, 600],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await expect(slider).toBeInViewport();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
    const r = await slider.boundingBox(),
      o = await value.boundingBox();
    expect(r.width).toBeGreaterThan(15);
    expect(o.y + o.height).toBeLessThanOrEqual(r.y);
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.screenshot({ path: "preview-batch-slider.png" });
  for (const count of [1, 0]) {
    await page.evaluate(
      (count) =>
        localStorage.setItem(
          "neurones.points.v1",
          JSON.stringify({
            version: 1,
            points: count ? [{ id: "single", x: 0, y: 0, target: 0 }] : [],
          }),
        ),
      count,
    );
    await page.reload();
    await page
      .getByRole("checkbox", { name: "Dernier lot", exact: true })
      .click();
    await expect(slider).toBeDisabled();
    await expect(value).toHaveText(`all (${count})`);
    if (count) {
      await page.getByRole("button", { name: /Un pas/ }).click();
      await expect(page.locator(".batch-ring")).toHaveCount(1);
    } else
      await expect(page.getByRole("button", { name: /Un pas/ })).toBeDisabled();
  }
  console.log(
    "Slider, tailles intermédiaires, dernier lot, lecture, adaptations et absence de défilement : OK.",
  );
} finally {
  await browser.close();
}
