const catalogueList = document.getElementById("catalogue-list");
const detailModal = document.getElementById("detail-modal");
const closeButtons = document.querySelectorAll("#close-modal-button");
const detailModalContent = document.getElementById("detail-modal-content");
const orderModal = document.getElementById("order-modal");
const orderButtons = document.querySelectorAll("#order-button");
const orderModalForm = document.getElementById("order-modal-form");

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

function openOrderModal() {
  orderModal.classList.add("is-open");
  syncModalOpenState();
}

function closeOrderModal() {
  orderModal.classList.remove("is-open");
  syncModalOpenState();
  orderModalForm.reset();
}

function closeDetailModal() {
  detailModal.classList.remove("is-open");
  syncModalOpenState();
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

  detailModalContent.replaceChildren();
  detailModalContent.insertAdjacentHTML("beforeend", buildDetailModalMarkup());

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
    closeDetailModal();
    openOrderModal();
  }
});

orderButtons.forEach((button) =>
  button.addEventListener("click", () => {
    openOrderModal();
  })
);

orderModalForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const formData = new FormData(e.currentTarget);

  const data = Object.fromEntries(formData.entries());

  console.log("name", data.name);

  alert(`Дякуємо, ${data.name}! Ми зателефонуємо вам за номером ${data.phone}.`);

  e.currentTarget.reset();
  closeOrderModal();
});
