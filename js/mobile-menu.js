const menuBtnRef = document.querySelector("[data-menu-button]");
const mobileMenuRef = document.querySelector("[data-menu]");
const mobileMenuLinkRef = document.querySelectorAll(".menu-navigation-link");

function syncMenuOpenOnDocument() {
  const isOpen = document.body.classList.contains("menu-open");
  document.documentElement.classList.toggle("menu-open", isOpen);
}

menuBtnRef.addEventListener("click", () => {
  window.scrollTo(0, 0);

  const expanded = menuBtnRef.getAttribute("aria-expanded" === "true") || false;
  menuBtnRef.setAttribute("aria-expanded", !expanded);

  document.body.classList.toggle("menu-open");
  syncMenuOpenOnDocument();
  menuBtnRef.classList.toggle("is-open");

  mobileMenuRef.classList.toggle("is-open");
});

mobileMenuLinkRef.forEach((ref) => {
  ref.addEventListener("click", () => {
    menuBtnRef.setAttribute("aria-expanded", "false");

    document.body.classList.remove("menu-open");
    syncMenuOpenOnDocument();
    menuBtnRef.classList.remove("is-open");

    mobileMenuRef.classList.remove("is-open");
  });
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 1440) {
    menuBtnRef.setAttribute("aria-expanded", "false");

    document.body.classList.remove("menu-open");
    syncMenuOpenOnDocument();
    menuBtnRef.classList.remove("is-open");

    mobileMenuRef.classList.remove("is-open");
  }
});
