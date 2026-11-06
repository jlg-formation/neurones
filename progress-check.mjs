import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const metric = (label) => page.getByLabel(label, { exact: true });
try {
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("checkbox", { name: "Dernier lot", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Dessins prédéfinis", exact: true })
    .selectOption("Cercles");
  const batch = page.getByRole("slider", { name: "Batch size", exact: true });
  const step = page.getByRole("button", { name: /Un pas/ });
  const rate = page.getByRole("spinbutton", {
    name: "Learning rate",
    exact: true,
  });
  await rate.fill("0.25");
  await expect(rate).toHaveValue("0.25");
  const a = await rate.boundingBox(),
    b = await step.boundingBox(),
    c = await metric("MISES À JOUR").boundingBox();
  expect(a.y + a.height).toBeLessThan(b.y);
  expect(b.y + b.height).toBeLessThan(c.y);
  await batch.fill("20");
  await step.click();
  await expect(metric("MISES À JOUR")).toHaveText("1");
  await expect(metric("ÉCHANTILLONS TRAITÉS")).toHaveText("20");
  await expect(metric("ÉPOQUES TERMINÉES")).toHaveText("0");
  await batch.fill("10");
  await expect(page.locator(".batch-ring")).toHaveCount(20);
  await step.click();
  await expect(metric("PASSAGE COURANT")).toHaveText("30 / 48");
  await batch.focus();
  await batch.press("End");
  await step.click();
  await expect(metric("ÉCHANTILLONS TRAITÉS")).toHaveText("48");
  await expect(metric("ÉPOQUES TERMINÉES")).toHaveText("1");
  await expect(metric("MISES À JOUR")).toHaveText("3");
  await expect(page.locator(".batch-ring")).toHaveCount(18);
  for (const label of [
    "MISES À JOUR",
    "ÉPOQUES TERMINÉES",
    "ÉCHANTILLONS TRAITÉS",
    "PASSAGE COURANT",
    "BIEN CLASSÉS",
    "ERREUR MOYENNE",
  ]) {
    const value = metric(label);
    await value.hover();
    const tooltip = page.getByRole("tooltip").filter({ visible: true });
    await expect(tooltip).toBeVisible();
    expect((await tooltip.innerText()).length).toBeGreaterThan(40);
    const r = await tooltip.boundingBox();
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.x + r.width).toBeLessThanOrEqual(1366);
    await page.mouse.move(1, 1);
    await value.focus();
    await expect(tooltip).toBeVisible();
    await value.evaluate((el) => el.blur());
  }
  await page.screenshot({ path: "preview-training-counters.png" });
  for (const [width, height] of [
    [1024, 600],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await expect(rate).toBeInViewport();
    await expect(metric("ERREUR MOYENNE")).toBeInViewport();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
  }
  console.log(
    "Compteurs, changement de batch, learning rate, ordre et infobulles : OK.",
  );
} finally {
  await browser.close();
}
