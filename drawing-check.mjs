import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
try {
  await page.goto("http://127.0.0.1:5173");
  const points = [
    { id: "a", x: 0.37, y: -1.29, target: 0 },
    { id: "b", x: -2.13, y: 0.83, target: 1 },
    { id: "c", x: 1.24, y: 2.17, target: 0 },
  ];
  await page.evaluate(
    (points) =>
      localStorage.setItem(
        "neurones.points.v1",
        JSON.stringify({ version: 1, points }),
      ),
    points,
  );
  await page.reload();
  async function preserved() {
    await expect(
      page.getByText("3 échantillons", { exact: false }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("neurones.points.v1")).points,
      ),
    ).toEqual(points);
  }
  for (const name of [
    "2 Les limites",
    "3 Une couche cachée",
    "4 Le défi XOR",
    "1 Un seul neurone",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await preserved();
  }
  await page.getByRole("button", { name: "MLP", exact: true }).click();
  await preserved();
  await page.getByRole("button", { name: "Ajouter un neurone caché" }).click();
  await preserved();
  await page.getByRole("button", { name: "Retirer un neurone caché" }).click();
  await preserved();
  await page
    .getByRole("button", { name: "4 Le défi XOR", exact: true })
    .click();
  await page.getByRole("button", { name: /Voir une solution/ }).click();
  await preserved();
  await page
    .getByRole("button", { name: /Réinitialiser l’entraînement/ })
    .click();
  await preserved();
  await page.reload();
  await preserved();
  await page
    .getByRole("button", { name: "4 Le défi XOR", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Charger l’exemple", exact: true })
    .click();
  await expect(
    page.getByText("4 échantillons", { exact: false }),
  ).toBeVisible();
  const selector = page.getByRole("combobox", {
    name: "Dessins prédéfinis",
    exact: true,
  });
  await expect(
    page
      .locator(".plot-toolbar")
      .getByRole("combobox", { name: "Dessins prédéfinis" }),
  ).toBeVisible();
  for (const [name, count] of [
    ["Cercles", 48],
    ["Deux groupes", 40],
    ["XOR", 4],
  ]) {
    await selector.selectOption(name);
    await expect(
      page
        .locator(".plot-panel")
        .getByText(`${count} échantillons`, { exact: false }),
    ).toBeVisible();
    await expect(page.locator(".network-svg .hidden-node")).toHaveCount(2);
    await expect(selector).toHaveValue("");
    const before = await page.evaluate(() =>
      localStorage.getItem("neurones.points.v1"),
    );
    await selector.selectOption("");
    expect(
      await page.evaluate(() => localStorage.getItem("neurones.points.v1")),
    ).toBe(before);
  }
  await selector.selectOption("empty");
  await expect(selector).toHaveValue("");
  await page.reload();
  await expect(selector).toHaveValue("");
  console.log(
    "Dessin personnalisé conservé dans le parcours, les architectures, la solution, les réinitialisations et après rechargement.",
  );
} finally {
  await browser.close();
}
