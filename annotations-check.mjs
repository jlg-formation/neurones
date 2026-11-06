import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
try {
  await page.goto("http://127.0.0.1:5173");
  await page
    .getByRole("combobox", { name: "Dessins prédéfinis", exact: true })
    .selectOption("XOR");
  const errors = page.getByRole("checkbox", {
      name: "Erreurs de classification",
      exact: true,
    }),
    batch = page.getByRole("checkbox", { name: "Dernier lot", exact: true });
  const orange = page.locator('svg.plot circle[stroke="#e8a36b"]'),
    blue = page.locator(".batch-ring");
  const boundary = page.getByRole("checkbox", {
    name: "Frontière à 0,5",
    exact: true,
  });
  const gradient = page.getByRole("checkbox", {
    name: "Gradient 0 vers 1",
    exact: true,
  });
  await expect(boundary).toBeChecked();
  await expect(gradient).toBeChecked();
  await expect(page.locator(".decision-boundary")).toHaveCount(1);
  await expect(page.locator(".field-canvas")).toBeVisible();
  await expect(page.locator(".legend-targets button")).toHaveCount(0);
  const targetBounds = await page.locator(".legend-targets").boundingBox();
  const plotBounds = await page.locator("svg.plot").boundingBox();
  expect(targetBounds.y + targetBounds.height).toBeLessThanOrEqual(
    plotBounds.y + (plotBounds.height * 35) / 520 - 4,
  );
  await expect(page.locator(".legend input[type=checkbox]")).toHaveCount(4);
  await boundary.click();
  await expect(page.locator(".decision-boundary")).toHaveCount(0);
  await expect(page.locator(".field-canvas")).toBeVisible();
  await gradient.click();
  await expect(page.locator(".field-canvas")).toBeHidden();
  await expect(page.locator('svg.plot circle[r="4.8"]')).toHaveCount(4);
  await expect(errors).not.toBeChecked();
  await expect(batch).not.toBeChecked();
  await expect(orange).toHaveCount(0);
  await expect(blue).toHaveCount(0);
  await page.getByRole("button", { name: /Un pas/ }).click();
  await expect(blue).toHaveCount(0);
  await errors.click();
  await expect.poll(() => orange.count()).toBeGreaterThan(0);
  await expect(blue).toHaveCount(0);
  await batch.click();
  await expect(blue).toHaveCount(4);
  await expect.poll(() => orange.count()).toBeGreaterThan(0);
  await errors.click();
  await expect(orange).toHaveCount(0);
  await expect(blue).toHaveCount(4);
  await page.getByRole("button", { name: /Lecture/ }).click();
  await page.getByRole("button", { name: /Pause/ }).click();
  await expect(batch).toBeChecked();
  await page
    .getByRole("button", { name: /Réinitialiser l’entraînement/ })
    .click();
  await expect(batch).toBeChecked();
  await expect(errors).not.toBeChecked();
  await expect(blue).toHaveCount(0);
  await page.getByRole("button", { name: /Un pas/ }).click();
  await expect(blue).toHaveCount(4);
  await page.getByRole("button", { name: /Charger l’exemple/ }).click();
  await expect(batch).toBeChecked();
  await expect(errors).not.toBeChecked();
  await errors.focus();
  await errors.press("Space");
  await expect(errors).toBeChecked();
  await batch.focus();
  await batch.press("Space");
  await expect(batch).not.toBeChecked();
  await page.getByRole("button", { name: "MLP", exact: true }).click();
  await expect(errors).toBeChecked();
  await expect(batch).not.toBeChecked();
  await expect(boundary).not.toBeChecked();
  await expect(gradient).not.toBeChecked();
  await page
    .getByRole("button", { name: "Inspecter le neurone caché h1", exact: true })
    .click();
  await expect(page.locator(".decision-boundary")).toHaveCount(0);
  await expect(page.locator(".field-canvas")).toBeHidden();
  await boundary.focus();
  await boundary.press("Space");
  await gradient.focus();
  await gradient.press("Space");
  await expect(page.locator(".decision-boundary")).toHaveCount(1);
  await expect(page.locator(".field-canvas")).toBeVisible();
  const groups = await page.locator(".legend>div").evaluateAll((elements) =>
    elements.map((e) => {
      const r = e.getBoundingClientRect();
      return { y: r.y, height: r.height };
    }),
  );
  expect(groups).toHaveLength(2);
  for (const group of groups) {
    expect(group.y).toBe(groups[0].y);
    expect(group.height).toBe(groups[0].height);
  }
  await page.screenshot({ path: "preview-legend-toggles.png" });
  console.log(
    "Annotations masquées par défaut, options indépendantes, clavier et conservation des choix : OK.",
  );
} finally {
  await browser.close();
}
