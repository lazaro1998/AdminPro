
export function notificar(mensaje, tipo = "exito") {
  window.dispatchEvent(
    new CustomEvent("adminpro-notificacion", {
      detail: {
        mensaje,
        tipo
      }
    })
  );
}
