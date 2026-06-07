import Swiper from "swiper";
import { A11y, Navigation } from "swiper/modules";

import "swiper/css";

import { apiClient } from "./apiClient.js";
import { showErrorNotification } from "./notifications.js";
import { extractErrorMessage } from "./utils.js";

const feedbackSliderStage = document.querySelector("#feedback-slider-stage");
const feedbackSliderTrack = document.getElementById("feedback-slider-list");
const feedbackLoader = document.getElementById("feedback-loader");
const feedbackSliderViewport = document.querySelector(".feedback-slider-viewport");

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function buildStarMarkup(starPosition, ratingValue) {
  const modifierClass = starPosition <= ratingValue ? "feedback-star-icon__filled" : "feedback-star-icon__empty";
  const markup = `<li class="star-item"><svg class="feedback-star-icon ${modifierClass}"><use href="./icons/sprite.svg#star"></use></svg></li>`;
  return markup;
}

function buildStarsRow(ratingValue) {
  const starsMarkup = Array.from({ length: 5 }, (_, index) => buildStarMarkup(index + 1, ratingValue)).join("");
  const markup = `<ul class="starts-list">${starsMarkup}</ul>`;
  return markup;
}

function buildFeedbackCardMarkup(rating) {
  const markup = `
    ${buildStarsRow(rating)}
    <p class="text feedback-text"></p>
    <p class="feedback-person-name"></p>`;
  return markup;
}

function buildFeedbackSlideShellMarkup() {
  const markup = `
    <li class="swiper-slide feedback-slider-slide">
      <div class="feedback-slide-row"></div>
    </li>`;
  return markup;
}

function buildFeedbackCard(feedback) {
  const card = document.createElement("div");
  card.className = "feedbacks-item";
  card.setAttribute("data-feedback-id", String(feedback.id ?? ""));
  const markup = buildFeedbackCardMarkup(feedback.rating);
  card.insertAdjacentHTML("beforeend", markup);
  card.querySelector(".feedback-text").textContent = feedback.text ?? "";
  card.querySelector(".feedback-person-name").textContent = `${feedback.author ?? ""}, ${feedback.location ?? ""}`;
  return card;
}

function setFeedbackLoading(isLoading) {
  if (feedbackLoader) {
    feedbackLoader.hidden = !isLoading;
  }
  if (feedbackSliderViewport) {
    feedbackSliderViewport.setAttribute("aria-busy", isLoading ? "true" : "false");
  }
}

async function bootFeedbackSlider() {
  if (!feedbackSliderStage || !feedbackSliderTrack) {
    setFeedbackLoading(false);
    return;
  }

  try {
    const response = await apiClient.get("/feedback");
    const body = response.data;
    const feedbackItems = Array.isArray(body) ? body : (body?.data ?? []);

    feedbackSliderTrack.replaceChildren();

    if (feedbackItems.length === 0) {
      return;
    }

    for (const item of feedbackItems) {
      const slideMarkup = buildFeedbackSlideShellMarkup();
      feedbackSliderTrack.insertAdjacentHTML("beforeend", slideMarkup);
      const row = feedbackSliderTrack.lastElementChild.querySelector(".feedback-slide-row");
      row.append(buildFeedbackCard(item));
    }

    const enableLoop = feedbackItems.length >= 4;

    new Swiper(feedbackSliderStage, {
      modules: [Navigation, A11y],
      slidesPerView: 1,
      spaceBetween: 24,
      slidesPerGroup: 1,
      loop: enableLoop,
      speed: prefersReducedMotion() ? 0 : 480,
      navigation: {
        prevEl: "[data-feedback-prev]",
        nextEl: "[data-feedback-next]",
      },
      a11y: {
        prevSlideMessage: "Попередній відгук",
        nextSlideMessage: "Наступний відгук",
      },
      breakpoints: {
        768: {
          slidesPerView: 2,
          spaceBetween: 24,
        },
      },
    });
  } catch (error) {
    showErrorNotification(extractErrorMessage(error, "Не вдалося завантажити відгуки."));
  } finally {
    setFeedbackLoading(false);
  }
}

bootFeedbackSlider();
