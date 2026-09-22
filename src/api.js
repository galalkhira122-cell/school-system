const URL =
  "https://script.google.com/macros/s/AKfycby7kAmVPBxaQ-N5HNnaMoj6zi6Hl4NyN2erKo_LdNs9yPvKIUXeLGFWZjwmpw2rNup9/exec";

/**
 * Send an action to Google Apps Script. Keep the existing POST payload unchanged.
 * A non-JSON response (such as an HTML 404 page) is reported clearly rather
 * than leaking an "Unexpected token '<'" parsing error.
 */
// Retry only these read-only monitor requests. Never retry writes automatically.
const MONITOR_READ_ACTIONS = new Set(["getAscAlerts", "getMonitorData"]);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function callAPI(action, data = {}) {
  if (MONITOR_READ_ACTIONS.has(action)) {
    let lastError;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await requestAPI(action, data);
      } catch (error) {
        lastError = error;
        // Retry only network errors and transient HTTP/redirect failures.
        if (attempt === 1 || !error.retryable) break;
        console.warn(`[API RETRY] ${action}: retrying after transient failure`);
        await delay(1200);
      }
    }
    throw lastError;
  }
  return requestAPI(action, data);
}

async function requestAPI(action, data = {}) {
  const startedAt = Date.now();
  let response;
  try {
    response = await fetch(URL, {
      method: "POST",
      body: JSON.stringify({ action, data }),
    });
  } catch (error) {
    const failure = new Error(
      `تعذر الاتصال بالخادم أثناء ${action}: ${error?.message || String(error)}`
    );
    failure.retryable = true;
    throw failure;
  }

  const contentType = response.headers.get("content-type") || "";
  const elapsedMs = Date.now() - startedAt;
  if (elapsedMs > 3000) console.warn(`[API SLOW] ${action}: ${elapsedMs}ms (HTTP ${response.status})`);
  let body;
  try {
    body = await response.text();
  } catch (error) {
    throw new Error(
      `تعذر قراءة استجابة الخادم أثناء ${action} (HTTP ${response.status}): ${error?.message || String(error)}`
    );
  }

  if (!response.ok) {
    const html = /^\s*</.test(body) || /text\/html/i.test(contentType);
    const failure = new Error(
      `فشل طلب ${action}: HTTP ${response.status}${html ? " — أعاد الخادم صفحة HTML بدل JSON؛ تحقق من نشر Apps Script وإعادة التوجيه وصلاحيات الوصول." : " — تحقق من حالة الخادم."}`
    );
    failure.retryable = [404, 408, 429, 500, 502, 503, 504].includes(response.status);
    throw failure;
  }

  if (!body.trim()) {
    throw new Error(`استجابة فارغة من الخادم أثناء ${action} (HTTP ${response.status}).`);
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    const html = /^\s*</.test(body) || /text\/html/i.test(contentType);
    throw new Error(
      html
        ? `استجابة غير صالحة لطلب ${action}: أعاد الخادم HTML بدل JSON (HTTP ${response.status}). تحقق من رابط النشر وإعادة التوجيه وصلاحيات الوصول.`
        : `استجابة JSON غير صالحة لطلب ${action} (HTTP ${response.status}): ${error?.message || String(error)}`
    );
  }
}
