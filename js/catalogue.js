import { apiClient } from "./apiClient.js";
import { showErrorNotification } from "./notifications.js";

const showMoreButtonDefaultLabel = "Показати ще";
const loadingLabel = "Завантаження...";

const catalogueList = document.getElementById("catalogue-list");
const catalogueListShell = document.querySelector(".catalogue-list-shell");
const catalogueLoader = document.getElementById("catalogue-loader");
const categoryFilter = document.getElementById("filter");
const showMoreButton = document.querySelector(".catalogue-item-show-more-button");

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
}

function setCatalogueInitialLoading(isLoading) {
  if (catalogueLoader) {
    catalogueLoader.hidden = !isLoading;
  }
  if (catalogueListShell) {
    catalogueListShell.setAttribute("aria-busy", isLoading ? "true" : "false");
  }
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

function extractErrorMessage(error) {
  const serverMessage = error.response?.data?.error;
  if (typeof serverMessage === "string") {
    return serverMessage;
  }
  if (error.message) {
    return error.message;
  }
  return "Сталася помилка під час запиту. Спробуйте пізніше.";
}

function normalizeJsonServerProductPage(responseBody, requestedPage) {
  if (Array.isArray(responseBody)) {
    return {
      products: responseBody,
      meta: {
        page: requestedPage,
        totalPages: 1,
        total: responseBody.length,
      },
    };
  }

  const products = responseBody?.data ?? [];
  const parsedTotalProducts = Number(responseBody?.items);
  const parsedTotalPages = Number(responseBody?.pages);

  const meta = {
    page: requestedPage,
    totalPages: Number.isFinite(parsedTotalPages) && parsedTotalPages >= 1 ? parsedTotalPages : 1,
    total: Number.isFinite(parsedTotalProducts) ? parsedTotalProducts : products.length,
  };

  return { products, meta };
}

async function fetchCataloguePage(page, options) {
  const { appendItems = false, showButtonLoader = false } = options;
  const isInitialChunk = !appendItems;

  if (showButtonLoader) {
    // setShowMoreButtonLoading(true);
  }

  if (isInitialChunk && catalogueList) {
    setCatalogueInitialLoading(true);
    catalogueList.replaceChildren();
  }

  try {
    // const requestParams = {
    //   _page: page,
    //   _per_page: itemsPerRequest,
    // };
    // if (activeCategory !== "all") {
    //   requestParams.category = activeCategory;
    // }

    const response = await apiClient.get("/products");

    const { products, meta } = normalizeJsonServerProductPage(response.data, 1);

    renderCatalogueChunk(products, !appendItems);
    // lastLoadedPage = page;
    // updateShowMoreVisibility(meta);
  } catch (error) {
    showErrorNotification(extractErrorMessage(error));
  } finally {
    if (showButtonLoader) {
      //   setShowMoreButtonLoading(false);
    }
    if (isInitialChunk) {
      setCatalogueInitialLoading(false);
    }
  }
}

async function resetAndLoadFirstCataloguePage() {
  if (showMoreButton) {
    showMoreButton.hidden = true;
  }
  const result = await fetchCataloguePage(1, { appendItems: false, showButtonLoader: false });
}

function initCatalogueFromApi() {
  if (!catalogueList || !categoryFilter || !showMoreButton) {
    return;
  }

  //   categoryFilter.addEventListener("change", handleFilterChange);
  //   showMoreButton.addEventListener("click", handleShowMoreClick);

  resetAndLoadFirstCataloguePage();
}

initCatalogueFromApi();
