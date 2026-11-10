// Flow llama aquí (servidor a servidor) cuando el pago cambia de estado.
// Queda registrado en los logs de la función en Netlify.
import { flowGet, leerToken } from "../lib/flow.mjs";

export default async (req) => {
  try {
    const token = await leerToken(req);
    const estado = await flowGet("payment/getStatus", { token });
    const txt = { 1: "PENDIENTE", 2: "PAGADO", 3: "RECHAZADO", 4: "ANULADO" }[estado.status];
    console.log(`[Flow] Orden ${estado.commerceOrder} · ${txt} · $${estado.amount} · ${estado.payer} · ${estado.optional ? JSON.stringify(estado.optional) : ""}`);
    return new Response("OK");
  } catch (e) {
    console.error(e);
    return new Response("Error", { status: 500 });
  }
};
