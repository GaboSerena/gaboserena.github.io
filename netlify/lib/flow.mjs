import crypto from "node:crypto";

// Variables de entorno (se configuran en Netlify, nunca en el código):
//   FLOW_API_KEY, FLOW_SECRET_KEY
//   FLOW_ENV = "sandbox" (pruebas) o "production"
export const FLOW_BASE =
  process.env.FLOW_ENV === "production"
    ? "https://www.flow.cl/api"
    : "https://sandbox.flow.cl/api";

// Catálogo de cobros. Los montos se definen AQUÍ, en el servidor,
// para que nadie pueda cambiarlos desde el navegador.
export const CATALOGO = {
  "preboda":       { nombre: "Pre-boda (2 horas)",                monto: 120000 },
  "matrimonio-ii": { nombre: "Matrimonio II (media jornada)",     monto: 400000 },
  "matrimonio-i":  { nombre: "Matrimonio I (todo el día)",        monto: 600000 },
};

function firmar(params) {
  const cadena = Object.keys(params)
    .sort()
    .map((k) => k + params[k])
    .join("");
  return crypto
    .createHmac("sha256", process.env.FLOW_SECRET_KEY)
    .update(cadena)
    .digest("hex");
}

export async function flowPost(ruta, datos) {
  const params = { apiKey: process.env.FLOW_API_KEY, ...datos };
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
  const params = { apiKey: process.env.FLOW_API_KEY, ...datos };
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
