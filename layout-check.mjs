import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage();
page.setDefaultTimeout(5000);
async function fit(label) {
  const result = await page.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  console.log(label, result);
  expect(result.scrollWidth, label + " largeur").toBeLessThanOrEqual(
    result.width,
  );
  expect(result.scrollHeight, label + " hauteur").toBeLessThanOrEqual(
    result.height,
  );
}
try {
  await page.goto("http://127.0.0.1:5173");
  for (const [width, height] of [
    [1920, 920],
    [1366, 768],
    [1280, 720],
    [1024, 600],
  ]) {
    await page.setViewportSize({ width, height });
    await fit(`${width}×${height}`);
    const columns = await page
      .locator(".left-column,.training-column,.center-column,.right-column")
      .evaluateAll((elements) =>
        elements.map((element) => {
          const r = element.getBoundingClientRect();
          return { left: r.left, right: r.right, name: element.className };
        }),
      );
    expect(columns).toHaveLength(4);
    expect(columns.map((column) => column.name)).toEqual([
      "left-column",
      "right-column",
      "center-column",
      "training-column",
    ]);
    for (let i = 1; i < columns.length; i++)
      expect(columns[i].left).toBeGreaterThanOrEqual(columns[i - 1].right);
    const speed = await page.locator("#speed").boundingBox();
    const batch = await page.locator("#batch-size").boundingBox();
    expect(batch.y).toBeGreaterThan(speed.y + speed.height);
    expect(Math.abs(batch.x - speed.x)).toBeLessThan(1);
    await expect(page.getByRole("button", { name: /Un pas/ })).toBeInViewport();
    await expect(
      page.getByRole("button", { name: /Lecture/ }),
    ).toBeInViewport();
    const plot = await page.locator("svg.plot").boundingBox();
    expect(plot.width).toBeGreaterThan(170);
    expect(Math.abs(plot.width - plot.height)).toBeLessThan(1);
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  await page
    .getByRole("button", { name: "3 Une couche cachée", exact: true })
    .click();
  for (let i = 1; i < 8; i++)
    await page
      .getByRole("button", { name: "Ajouter un neurone caché" })
      .click();
  await fit("8 neurones");
  await page.setViewportSize({ width: 1024, height: 600 });
  await fit("8 neurones petit écran");
  await page.setViewportSize({ width: 1366, height: 768 });
  await expect(
    page.getByRole("button", { name: "Inspecter le neurone caché h8" }),
  ).toBeInViewport();
  await page
    .getByRole("button", { name: "Inspecter le neurone caché h8" })
    .click();
  await fit("activation h8");
  await expect(
    page.getByRole("button", { name: "Revenir à la sortie du réseau" }),
  ).toBeInViewport();
  await page.getByText("Ouvrir les détails", { exact: true }).click();
  await fit("calculs ouverts");
  await page.getByText("Ouvrir les détails", { exact: true }).click();
  await page
    .getByRole("button", { name: "4 Le défi XOR", exact: true })
    .click();
  await page.getByRole("button", { name: /Voir une solution/ }).click();
  await fit("solution XOR");
  await page.setViewportSize({ width: 1024, height: 600 });
  await fit("solution XOR petit écran");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.screenshot({ path: "preview-compact.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await fit("mobile plan");
  await expect(page.getByRole("button", { name: /Un pas/ })).toBeInViewport();
  await page.getByRole("button", { name: "Données et architecture" }).click();
  await fit("mobile données");
  await expect(
    page.getByRole("button", { name: "Ajouter un neurone caché" }),
  ).toBeInViewport();
  await page.getByRole("button", { name: "Réseau et calculs" }).click();
  await fit("mobile réseau");
  await page.getByRole("button", { name: "Plan et entraînement" }).click();
  await page.screenshot({ path: "preview-compact-mobile.png" });
  console.log("Disposition compacte vérifiée.");
} finally {
  await browser.close();
}
