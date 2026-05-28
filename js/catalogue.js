import { apiClient } from "./apiClient.js";
import { showErrorNotification } from "./notifications.js";
import { extractErrorMessage } from "./utils.js";

const itemsPerPage = 12;
const showMoreButtonDefaultLabel = "Показати ще";
const showMoreButtonLoadingLabel = "Завантаження...";

const catalogueList = document.getElementById("catalogue-list");
const catalogueListShell = document.querySelector(".catalogue-list-shell");
const catalogueLoader = document.getElementById("catalogue-loader");
const categoryFilter = document.getElementById("filter");
const showMoreButton = document.querySelector(".catalogue-item-show-more-button");

let activeCategory = categoryFilter?.value ?? "all";
let lastLoadedPage = 0;

function formatPriceUah(priceDigits) {
  if (!priceDigits) {
    return "-";
  }
  const numericValue = Number.parseInt(String(priceDigits).replace(/\s/g, ""), 10);
  if (Number.isNaN(numericValue)) {
    return `${priceDigits} грн`;
  }
  return `${numericValue.toLocaleString("uk-UA")} грн`;
}

function buildCatalogueListItemShellMarkup() {
  const markup = `
    <li class="catalogue-list-item">
      <img class="catalogue-item-image" alt="">
      <h3 class="catalogue-item-title"></h3>
      <p class="catalogue-item-text"></p>
      <p class="catalogue-item-price"></p>
      <button type="button" class="secondary-button catalogue-more-button">Детальніше</button>
    </li>`;
  return markup;
}

function fillCatalogueListItem(listItem, product) {
  const image = listItem.querySelector(".catalogue-item-image");
  image.src = product.img;
  image.alt = product.title;
  listItem.querySelector(".catalogue-item-title").textContent = product.title;
  listItem.querySelector(".catalogue-item-text").textContent = product.desc;
  listItem.querySelector(".catalogue-item-price").textContent = formatPriceUah(product.price);
  listItem.dataset.productId = String(product.id ?? "");
}

function setShowMoreButtonLoading(isLoading) {
  if (!showMoreButton) {
    return;
  }

  showMoreButton.disabled = isLoading;
  showMoreButton.classList.toggle("is-loading", isLoading);
  showMoreButton.textContent = isLoading ? showMoreButtonLoadingLabel : showMoreButtonDefaultLabel;
}

function setCatalogueInitialLoading(isLoading) {
  if (catalogueLoader) {
    catalogueLoader.hidden = !isLoading;
  }
  if (catalogueListShell) {
    catalogueListShell.setAttribute("aria-busy", isLoading ? "true" : "false");
  }
}

function updateShowMoreVisibility(meta) {
  if (!showMoreButton || !catalogueList || !meta) {
    return;
  }

  const currentPage = Number(meta.page);
  const totalPagesAvailable = Number(meta.totalPages);
  const catalogueItemsTotal = Number(meta.total);
  const itemsRendered = catalogueList.children.length;

  const paginationValid = currentPage && totalPagesAvailable && totalPagesAvailable >= 1;
  const viewedLastPage = paginationValid && currentPage >= totalPagesAvailable;
  const allItemsRendered = catalogueItemsTotal && catalogueItemsTotal > 0 && itemsRendered >= catalogueItemsTotal;

  showMoreButton.hidden = !!viewedLastPage || !!allItemsRendered;
}

function renderCatalogueChunk(products, shouldReplaceList) {
  if (!catalogueList) {
    return;
  }
  if (shouldReplaceList) {
    catalogueList.replaceChildren();
  }

  const startIndex = catalogueList.children.length;
  const chunkMarkup = products.map(() => buildCatalogueListItemShellMarkup()).join("");
  catalogueList.insertAdjacentHTML("beforeend", chunkMarkup);

  const listItems = catalogueList.querySelectorAll(":scope > .catalogue-list-item");
  for (let i = 0; i < products.length; i += 1) {
    fillCatalogueListItem(listItems[startIndex + i], products[i]);
  }
}

function normalizeFireplacePage(responseBody, requestedPage) {
  const products = responseBody?.data ?? [];
  const apiMeta = responseBody?.meta ?? {};

  return {
    products,
    meta: {
      page: requestedPage,
      totalPages: Number(apiMeta.pages) >= 1 ? Number(apiMeta.pages) : 1,
      total: Number.isFinite(Number(apiMeta.items)) ? Number(apiMeta.items) : products.length,
    },
  };
}

async function fetchCataloguePage(page, options) {
  const { appendItems = false, showButtonLoader = false } = options;
  const isInitialChunk = !appendItems;

  if (showButtonLoader) {
    setShowMoreButtonLoading(true);
  }

  if (isInitialChunk && catalogueList) {
    setCatalogueInitialLoading(true);
    catalogueList.replaceChildren();
  }

  try {
    const requestParams = {
      page,
      "per-page": itemsPerPage,
    };
    if (activeCategory !== "all") {
      requestParams.category = activeCategory;
    }

    const response = await apiClient.get("/fireplace", {
      params: requestParams,
    });

    const { products, meta } = normalizeFireplacePage(response.data, page);

    renderCatalogueChunk(products, !appendItems);
    lastLoadedPage = page;
    updateShowMoreVisibility(meta);
  } catch (error) {
    showErrorNotification(extractErrorMessage(error));
  } finally {
    if (showButtonLoader) {
      setShowMoreButtonLoading(false);
    }
    if (isInitialChunk) {
      setCatalogueInitialLoading(false);
    }
  }
}

async function resetAndLoadFirstCataloguePage() {
  lastLoadedPage = 0;
  if (showMoreButton) {
    showMoreButton.hidden = true;
  }
  await fetchCataloguePage(1, { appendItems: false, showButtonLoader: false });
}

function handleFilterChange() {
  activeCategory = categoryFilter?.value;
  resetAndLoadFirstCataloguePage();
}

function handleShowMoreClick() {
  const nextPage = lastLoadedPage + 1;
  fetchCataloguePage(nextPage, { appendItems: true, showButtonLoader: true });
}

function initCatalogueFromApi() {
  if (!catalogueList || !categoryFilter || !showMoreButton) {
    return;
  }

  categoryFilter.addEventListener("change", handleFilterChange);
  showMoreButton.addEventListener("click", handleShowMoreClick);

  resetAndLoadFirstCataloguePage();
}

initCatalogueFromApi();
