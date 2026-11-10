// POST /.netlify/functions/flow-crear  { item, email, nombre }
// Crea el pago en Flow y devuelve la URL a la que se redirige al cliente.
import { flowPost, CATALOGO } from "../lib/flow.mjs";

export default async (req) => {
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });
  try {
    const { item, email, nombre = "" } = await req.json();
    const producto = CATALOGO[item];
    if (!producto) return Response.json({ error: "Cobertura no válida" }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || ""))
      return Response.json({ error: "Correo no válido" }, { status: 400 });

    const sitio = process.env.URL; // URL pública del sitio, la pone Netlify
    const orden = `SV-${Date.now()}`;
    const pago = await flowPost("payment/create", {
      commerceOrder: orden,
      subject: `Serena Visuales · ${producto.nombre}`,
      currency: "CLP",
      amount: producto.monto,
      email,
      urlConfirmation: `${sitio}/.netlify/functions/flow-confirmar`,
      urlReturn: `${sitio}/.netlify/functions/flow-retorno`,
      optional: JSON.stringify({ nombre: String(nombre).slice(0, 80), item }),
    });
    return Response.json({ url: `${pago.url}?token=${pago.token}` });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "No se pudo iniciar el pago. Intenta de nuevo." }, { status: 500 });
  }
};
