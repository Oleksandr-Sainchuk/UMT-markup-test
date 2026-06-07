import { apiClient } from "./apiClient.js";
import { showErrorNotification, showSuccessNotification } from "./notifications.js";
import { extractErrorMessage } from "./utils.js";

const catalogueList = document.getElementById("catalogue-list");
const detailModal = document.getElementById("detail-modal");
const closeButtons = document.querySelectorAll("#close-modal-button");
const detailModalContent = document.getElementById("detail-modal-content");
const orderModal = document.getElementById("order-modal");
const orderButtons = document.querySelectorAll("#order-button");
const orderModalForm = document.getElementById("order-modal-form");
const orderSubmitButton = orderModalForm?.querySelector(".order-modal-cta");

const orderSubmitDefaultLabel = "Замовити";
const orderSubmitLoadingLabel = "Завантаження...";

let selectedProductId = null;
let isOrderSubmitting = false;

function syncModalOpenState() {
  const anyModalOpen = detailModal.classList.contains("is-open") || orderModal.classList.contains("is-open");

  document.body.classList.toggle("modal-open", anyModalOpen);
  document.documentElement.classList.toggle("modal-open", anyModalOpen);
}

function isOverlayScrollLockActive() {
  const html = document.documentElement;
  return html.classList.contains("modal-open") || html.classList.contains("menu-open");
}

function trapScrollBehindOverlays(event) {
  if (!isOverlayScrollLockActive()) {
    return;
  }
  if (event.target.closest(".modal-container") || event.target.closest("[data-menu]")) {
    return;
  }
  event.preventDefault();
}

document.addEventListener("touchmove", trapScrollBehindOverlays, { passive: false });
document.addEventListener("wheel", trapScrollBehindOverlays, { passive: false });

function openDetailModal() {
  detailModal.classList.add("is-open");
  syncModalOpenState();
}

function openOrderModal(productId = null) {
  selectedProductId = productId;
  orderModal.classList.add("is-open");
  syncModalOpenState();
}

function closeOrderModal() {
  orderModal.classList.remove("is-open");
  syncModalOpenState();
  selectedProductId = null;
  orderModalForm.reset();
}

function closeDetailModal() {
  detailModal.classList.remove("is-open");
  syncModalOpenState();
}

function setOrderSubmitLoading(isLoading) {
  if (!orderSubmitButton) {
    return;
  }

  orderSubmitButton.disabled = isLoading;
  orderSubmitButton.classList.toggle("is-loading", isLoading);
  orderSubmitButton.textContent = isLoading ? orderSubmitLoadingLabel : orderSubmitDefaultLabel;
}

function buildDetailModalMarkup() {
  const markup = `
    <img class="detail-modal-image" alt="">
    <div class="detail-modal-texts-block">
      <h3 class="detail-modal-title"></h3>
      <p class="detail-modal-price"></p>
      <p class="detail-modal-text"></p>
      <button type="button" id="detail-modal-cta" class="primary-button detail-modal-button">Придбати</button>
    </div>`;
  return markup;
}

function openDetailModalFromCatalogueItem(parentItem) {
  const title = parentItem.querySelector(".catalogue-item-title").textContent;
  const price = parentItem.querySelector(".catalogue-item-price").textContent;
  const descriptionFromCard = parentItem.querySelector(".catalogue-item-text").textContent;
  const imgElement = parentItem.querySelector(".catalogue-item-image");
  const src = imgElement.getAttribute("src");
  const rawSrcset = imgElement.getAttribute("srcset");
  const productId = parentItem.dataset.productId ?? "";

  detailModalContent.replaceChildren();
  detailModalContent.insertAdjacentHTML("beforeend", buildDetailModalMarkup());
  detailModalContent.dataset.productId = productId;

  const detailImage = detailModalContent.querySelector(".detail-modal-image");
  detailImage.src = src;
  if (rawSrcset) {
    detailImage.setAttribute("srcset", rawSrcset);
  }
  detailImage.alt = title;

  detailModalContent.querySelector(".detail-modal-title").textContent = title;
  detailModalContent.querySelector(".detail-modal-price").textContent = price;
  detailModalContent.querySelector(".detail-modal-text").textContent = descriptionFromCard;

  openDetailModal();
}

catalogueList?.addEventListener("click", (event) => {
  const detailsTrigger = event.target.closest(".catalogue-more-button");
  if (!detailsTrigger) {
    return;
  }

  const parentItem = detailsTrigger.closest(".catalogue-list-item");
  openDetailModalFromCatalogueItem(parentItem);
});

closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeDetailModal();
    closeOrderModal();
  });
});

detailModal.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) {
    closeDetailModal();
  }
});

orderModal.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) {
    closeOrderModal();
  }
});

detailModalContent.addEventListener("click", (e) => {
  if (e.target.id === "detail-modal-cta" || e.target.closest("#detail-modal-cta")) {
    const productIdRaw = detailModalContent.dataset.productId;
    const productId = productIdRaw ? Number(productIdRaw) : null;

    closeDetailModal();
    openOrderModal(productId ?? null);
  }
});

orderButtons.forEach((button) =>
  button.addEventListener("click", () => {
    openOrderModal(null);
  })
);

orderModalForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (isOrderSubmitting || orderModalForm.dataset.submitting === "true") {
    return;
  }

  isOrderSubmitting = true;
  orderModalForm.dataset.submitting = "true";

  const formData = new FormData(e.currentTarget);
  const payload = Object.fromEntries(formData.entries());

  setOrderSubmitLoading(true);

  try {
    await apiClient.post("/order", {
      name: payload.name,
      phone: payload.phone,
      address: payload.address,
      comment: payload.comment ?? "",
      productId: selectedProductId,
    });

    showSuccessNotification(`Дякуємо, ${payload.name}! Ми зателефонуємо вам за номером ${payload.phone}.`);
    closeOrderModal();
  } catch (error) {
    const message = extractErrorMessage(error, "Не вдалося оформити замовлення. Спробуйте пізніше.");
    if (message) {
      showErrorNotification(message);
    }
  } finally {
    isOrderSubmitting = false;
    delete orderModalForm.dataset.submitting;
    setOrderSubmitLoading(false);
  }
});
