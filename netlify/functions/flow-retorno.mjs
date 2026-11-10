// Flow envía aquí al cliente después de pagar (POST con token).
// Revisamos el estado real y lo redirigimos a la página de resultado.
import { flowGet, leerToken } from "../lib/flow.mjs";

export default async (req) => {
  let resultado = "error";
  try {
    const token = await leerToken(req);
    const estado = await flowGet("payment/getStatus", { token });
    resultado = { 1: "pendiente", 2: "ok", 3: "rechazado", 4: "anulado" }[estado.status] || "error";
  } catch (e) {
    console.error(e);
  }
  return new Response(null, { status: 303, headers: { Location: `/pago.html?r=${resultado}` } });
};
