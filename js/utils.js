const networkErrorMessage = "Не вдалося з'єднатися з сервером. Перевірте підключення до інтернету.";
const timeoutErrorMessage = "Час очікування відповіді вичерпано. Спробуйте ще раз.";

export function extractErrorMessage(error, fallback = "Сталася помилка під час запиту. Спробуйте пізніше.") {
  if (error.code === "ERR_CANCELED" || error.name === "CanceledError") {
    return "";
  }

  const serverMessage = error.response?.data?.message;
  if (typeof serverMessage === "string" && serverMessage.length > 0) {
    return serverMessage;
  }

  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return timeoutErrorMessage;
    }
    return networkErrorMessage;
  }

  const { status } = error.response;

  if (status === 404) {
    return "Ресурс не знайдено.";
  }

  if (status >= 500) {
    return fallback;
  }

  if (error.message) {
    return error.message;
  }

  return fallback;
}
