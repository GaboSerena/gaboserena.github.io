import crypto from "node:crypto";

// Variables de entorno (se configuran en Netlify, nunca en el código):
//   FLOW_API_KEY, FLOW_SECRET_KEY
//   FLOW_ENV = "sandbox" (pruebas) o "production"
const env = (k) => (process.env[k] || "").trim();

export const FLOW_BASE =
  env("FLOW_ENV").toLowerCase() === "production"
    ? "https://www.flow.cl/api"
    : "https://sandbox.flow.cl/api";

// Catálogo de cobros. Los montos se definen AQUÍ, en el servidor,
// para que nadie pueda cambiarlos desde el navegador.
export const CATALOGO = {
  "preboda":       { nombre: "Pre-boda (2 horas)",            monto: 120000 },
  "matrimonio-ii": { nombre: "Matrimonio II (media jornada)", monto: 400000 },
  "matrimonio-i":  { nombre: "Matrimonio I (todo el día)",    monto: 600000 },
};
// Nombres que usa la agenda del sitio (index.html)
export const ALIAS = { basica: "preboda", esencial: "matrimonio-ii", experiencia: "matrimonio-i" };
// Porcentaje que se paga como abono al reservar desde la agenda
export const ABONO_PCT = 50;

function firmar(params) {
  const cadena = Object.keys(params)
    .sort()
    .map((k) => k + params[k])
    .join("");
  return crypto
    .createHmac("sha256", env("FLOW_SECRET_KEY"))
    .update(cadena)
    .digest("hex");
}

export async function flowPost(ruta, datos) {
  const params = { apiKey: env("FLOW_API_KEY"), ...datos };
  params.s = firmar(params);
  const r = await fetch(`${FLOW_BASE}/${ruta}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const json = await r.json();
  if (!r.ok) throw new Error(`Flow ${r.status}: ${json.message || JSON.stringify(json)}`);
  return json;
}

export async function flowGet(ruta, datos) {
  const params = { apiKey: env("FLOW_API_KEY"), ...datos };
  params.s = firmar(params);
  const r = await fetch(`${FLOW_BASE}/${ruta}?${new URLSearchParams(params)}`);
  const json = await r.json();
  if (!r.ok) throw new Error(`Flow ${r.status}: ${json.message || JSON.stringify(json)}`);
  return json;
}

export async function leerToken(req) {
  const texto = await req.text();
  return new URLSearchParams(texto).get("token");
}
