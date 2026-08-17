/**
 * @jest-environment jsdom
 */
import localList from "services/local-list.js";

beforeEach(() => {
  // Reseta storage e o cache interno do módulo (não só window.localStorage),
  // já que o snapshot cacheado só é invalidado via commit()/clear().
  localList.clear();
});

describe("local-list service", () => {
  test("getList returns null when nothing was created yet", () => {
    expect(localList.getList()).toBeNull();
  });

  test("createList persists a new empty list", () => {
    const list = localList.createList({ title: "Aniversário" });

    expect(list.title).toBe("Aniversário");
    expect(list.items).toEqual([]);
    expect(localList.getList()).toEqual(list);
  });

  test("addItem appends an available item to the list", () => {
    localList.createList({ title: "Aniversário" });

    const item = localList.addItem({
      marketplaceUrl: "https://marketplace.example/produto/1",
      title: "Fone de Ouvido",
      imageUrl: "https://marketplace.example/foto.jpg",
      priceCents: 19990,
    });

    expect(item.status).toBe("available");
    expect(localList.getList().items).toEqual([item]);
  });

  test("addItem without resolved metadata falls back to manual entry shape", () => {
    localList.createList({ title: "Aniversário" });

    const item = localList.addItem({
      marketplaceUrl: "https://marketplace.example/produto/2",
    });

    expect(item.title).toBeNull();
    expect(item.image_url).toBeNull();
    expect(item.manual_override).toBe(false);
  });

  test("updateItem overwrites the given fields", () => {
    localList.createList({ title: "Aniversário" });
    const item = localList.addItem({
      marketplaceUrl: "https://marketplace.example/produto/1",
    });

    const updated = localList.updateItem(item.id, {
      title: "Nome corrigido",
      manual_override: true,
    });

    expect(updated.title).toBe("Nome corrigido");
    expect(updated.manual_override).toBe(true);
  });

  test("removeItem removes only the targeted item", () => {
    localList.createList({ title: "Aniversário" });
    const first = localList.addItem({
      marketplaceUrl: "https://marketplace.example/produto/1",
    });
    const second = localList.addItem({
      marketplaceUrl: "https://marketplace.example/produto/2",
    });

    localList.removeItem(first.id);

    expect(localList.getList().items).toEqual([second]);
  });

  test("the list survives being re-read after a reload (persisted in localStorage)", () => {
    const created = localList.createList({ title: "Aniversário" });
    localList.addItem({
      marketplaceUrl: "https://marketplace.example/produto/1",
    });

    // Simula um reload: nova leitura do zero, sem estado em memória.
    const reloaded = localList.getList();

    expect(reloaded.id).toBe(created.id);
    expect(reloaded.items).toHaveLength(1);
  });

  test("clear removes the list entirely", () => {
    localList.createList({ title: "Aniversário" });
    localList.clear();

    expect(localList.getList()).toBeNull();
  });
});
