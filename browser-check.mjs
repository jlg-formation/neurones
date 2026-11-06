import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({
  headless: true,
  channel: process.env.BROWSER_CHANNEL || "msedge",
});
const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } });
page.setDefaultTimeout(7000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto("http://127.0.0.1:5173");
  await expect(
    page.getByRole("heading", { name: "Le laboratoire des neurones" }),
  ).toBeVisible();
  await expect(page.getByText("40 échantillons")).toBeVisible();
  await page.getByRole("button", { name: /Un pas/ }).click();
  await expect(page.locator(".stats>div").first().locator("strong")).toHaveText(
    "1",
  );
  await page.getByRole("button", { name: /Lecture/ }).click();
  await expect(page.getByRole("button", { name: /Pause/ })).toBeVisible();
  await page.waitForTimeout(250);
  await page.getByRole("button", { name: /Pause/ }).click();
  await page.getByRole("button", { name: "MLP", exact: true }).click();
  await expect(page.locator(".counter strong")).toHaveText("1");
  await page.getByRole("button", { name: "Ajouter un neurone caché" }).click();
  await page.getByRole("button", { name: "Ajouter un neurone caché" }).click();
  await expect(page.locator(".counter strong")).toHaveText("3");
  await expect(page.locator(".network-svg .hidden-node")).toHaveCount(3);
  await expect(page.locator(".network-svg .connection")).toHaveCount(9);
  await expect(page.locator(".stats>div").first().locator("strong")).toHaveText(
    "0",
  );
  await expect(page.getByText("40 échantillons")).toBeVisible();
  await page
    .getByRole("button", { name: "Inspecter le neurone caché h2" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Activation de h2" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Revenir à la sortie du réseau" })
    .click();
  await page
    .getByRole("combobox", { name: "Dessins prédéfinis", exact: true })
    .selectOption("Cercles");
  await expect(page.getByText("48 échantillons")).toBeVisible();
  await page.locator("#speed").focus();
  await page.locator("#speed").press("End");
  await page.getByRole("button", { name: /Lecture/ }).click();
  await expect
    .poll(
      async () =>
        Number(
          (
            await page
              .locator(".stats>div")
              .first()
              .locator("strong")
              .innerText()
          ).replace(/\D/g, ""),
        ),
      { timeout: 45000 },
    )
    .toBeGreaterThanOrEqual(8500);
  await page.getByRole("button", { name: /Pause/ }).click();
  expect(
    Number(
      (
        await page.getByLabel("BIEN CLASSÉS", { exact: true }).innerText()
      ).replace(/\D/g, ""),
    ),
  ).toBeGreaterThanOrEqual(95);
  await page.screenshot({ path: "preview-mlp.png", fullPage: true });
  await page
    .getByRole("button", { name: "Point blanc · 1", exact: true })
    .click();
  await page
    .locator(".tool-buttons")
    .getByRole("button", { name: /Ajouter/ })
    .click();
  const plot = page.locator("svg.plot"),
    r = await plot.boundingBox();
  const x = r.x + r.width / 2,
    y = r.y + r.height / 2;
  await page.mouse.click(x, y);
  await expect(page.getByText("49 échantillons")).toBeVisible();
  await page
    .locator(".tool-buttons")
    .getByRole("button", { name: /Inspecter/ })
    .click();
  await page.mouse.click(x, y);
  await page.getByText("Ouvrir les détails", { exact: true }).click();
  await expect(page.getByText("Échantillon sélectionné")).toBeVisible();
  await expect(page.getByText("Cible :").locator("b")).toHaveText("1");
  await page
    .locator(".tool-buttons")
    .getByRole("button", { name: /Supprimer/ })
    .click();
  await page.mouse.click(x, y);
  await expect(page.getByText("48 échantillons")).toBeVisible();
  await page
    .locator(".tool-buttons")
    .getByRole("button", { name: /Ajouter/ })
    .click();
  await page.mouse.click(x, y);
  await page.reload();
  await expect(page.getByText("49 échantillons")).toBeVisible();
  await expect(
    page.getByText("Points restaurés", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".network-svg .hidden-node")).toHaveCount(0);
  await page
    .getByRole("button", { name: "4 Le défi XOR", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Charger l’exemple", exact: true })
    .click();
  await expect(page.getByText("4 échantillons")).toBeVisible();
  await page
    .getByRole("button", { name: "Voir une solution du XOR", exact: false })
    .click();
  await expect(page.getByLabel("BIEN CLASSÉS", { exact: true })).toHaveText(
    "100 %",
  );
  await expect(
    page.getByText("Poids préparés pour résoudre le XOR", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Charger l’exemple", exact: false })
    .click();
  await expect(
    page.getByText("Poids préparés pour résoudre le XOR", { exact: false }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "preview-mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  console.log(
    "Vérifications navigateur réussies : entraînement, architecture, cartes cachées, édition, calculs, persistance, XOR et mobile.",
  );
} finally {
  await browser.close();
}
