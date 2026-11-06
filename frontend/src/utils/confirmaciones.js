
export function confirmar({
  titulo = "¿Estás seguro?",
  mensaje = "¿Querés continuar con esta operación?",
  textoConfirmar = "Confirmar",
  tipo = "normal"
}) {
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent("adminpro-confirmacion", {
        detail: {
          titulo,
          mensaje,
          textoConfirmar,
          tipo,
          resolver: resolve
        }
      })
    );
  });
}
