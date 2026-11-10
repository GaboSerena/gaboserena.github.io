// POST /.netlify/functions/flow-crear  { item, email, nombre, abono?, fecha?, detalle? }
// Crea el pago en Flow y devuelve la URL a la que se redirige al cliente.
import { flowPost, CATALOGO, ALIAS, ABONO_PCT } from "../lib/flow.mjs";

export default async (req) => {
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });
  try {
    const { item, email, nombre = "", abono = false, fecha = "", detalle = "" } = await req.json();
    const clave = ALIAS[item] || item;
    const producto = CATALOGO[clave];
    if (!producto) return Response.json({ error: "Cobertura no válida" }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || ""))
      return Response.json({ error: "Correo no válido" }, { status: 400 });

    const sitio = process.env.URL; // URL pública del sitio, la pone Netlify
    const orden = `SV-${Date.now()}`;
    const monto = abono ? Math.round((producto.monto * ABONO_PCT) / 100) : producto.monto;
    const fechaTxt = /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : "";
    const asunto = abono
      ? `Serena Visuales · Abono ${ABONO_PCT}% ${producto.nombre}${fechaTxt ? " · " + fechaTxt : ""}`
      : `Serena Visuales · ${producto.nombre}`;
    const pago = await flowPost("payment/create", {
      commerceOrder: orden,
      subject: asunto,
      currency: "CLP",
      amount: monto,
      email,
      urlConfirmation: `${sitio}/.netlify/functions/flow-confirmar`,
      urlReturn: `${sitio}/.netlify/functions/flow-retorno`,
      optional: JSON.stringify({
        nombre: String(nombre).slice(0, 80),
        item: clave,
        tipo: abono ? `abono ${ABONO_PCT}%` : "total",
        fecha: fechaTxt,
        detalle: String(detalle).slice(0, 300),
      }),
    });
    return Response.json({ url: `${pago.url}?token=${pago.token}` });
  } catch (e) {
    console.error(e);
    if (/userEmail/i.test(e.message))
      return Response.json({ error: "Flow no aceptó ese correo. Revisen que esté bien escrito." }, { status: 400 });
    return Response.json({ error: "No se pudo iniciar el pago. Intenta de nuevo." }, { status: 500 });
  }
};
