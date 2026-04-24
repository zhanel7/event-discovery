/**
 * Нагрузочный сценарий k6: регистрация → логин → создание конференции → поиск.
 * Запуск с HTML-отчётом: k6 run --out json=k6/report.json load-test.js && k6-html-reporter
 * или просто: k6 run load-test.js
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export const options = {
  vus: 5,
  duration: "1m",
  summaryTrendStats: ["avg", "min", "med", "max", "p(95)", "p(99)"],
};

const BASE = __ENV.BASE_URL || "http://localhost:8000";

export default function () {
  const email = `load_${__VU}_${Date.now()}_${__ITER}@example.com`;
  const password = "Load12345";

  let res = http.post(
    `${BASE}/auth/register`,
    JSON.stringify({ email, password, role: "user" }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(res, { "register 201": (r) => r.status === 201 });

  res = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(res, { "login 200": (r) => r.status === 200 });
  const body = res.json();
  const token = body.access_token;

  res = http.post(
    `${BASE}/conferences`,
    JSON.stringify({
      title: `Load conference ${email}`,
      description: "k6 load test",
      start_date: "2026-06-01T00:00:00Z",
      end_date: "2026-06-05T00:00:00Z",
      location: "Online",
      cfp_deadline: "2026-05-01T00:00:00Z",
      category: "k6",
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  check(res, { "create conference 201": (r) => r.status === 201 });

  res = http.get(`${BASE}/conferences?search=Load&limit=10`);
  check(res, { "search 200": (r) => r.status === 200 });

  sleep(0.3);
}

export function handleSummary(data) {
  return {
    "k6/report.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || "";
  const summary = [];
  
  if (data.metrics) {
    summary.push(`${indent}Test Results Summary:`);
    for (const metric in data.metrics) {
      const m = data.metrics[metric];
      if (m.values && m.values.length > 0) {
        summary.push(`${indent}  ${metric}: ${m.values.toString()}`);
      }
    }
  }
  
  return summary.join("\n");
}
