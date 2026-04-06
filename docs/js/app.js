function textoOPlaceholder(valor) {
  return valor.trim() === "" ? "—" : valor;
}

function obtenerFechaArchivo() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function limpiarNombreArchivo(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function obtenerNombreBaseArchivo() {
  const mascota = document.getElementById("mascota")?.value || "mascota";
  const nombreLimpio = limpiarNombreArchivo(mascota) || "mascota";
  return `documento-veterinario-${nombreLimpio}-${obtenerFechaArchivo()}`;
}

function formatearFecha(valor) {
  if (!valor) return "____ / ____ / ____";
  const [anio, mes, dia] = valor.split("-");
  if (!anio || !mes || !dia) return "____ / ____ / ____";
  return `${dia}/${mes}/${anio}`;
}

function actualizarVista() {
  const duenioInput = document.getElementById("duenio");
  const mascotaInput = document.getElementById("mascota");
  const descripcionInput = document.getElementById("diagnostico");
  const fechaInput = document.getElementById("fecha");

  const docDuenio = document.getElementById("doc-duenio");
  const docMascota = document.getElementById("doc-mascota");
  const docDescripcion = document.getElementById("doc-diagnostico");
  const docFecha = document.getElementById("doc-fecha");

  if (duenioInput && docDuenio) {
    docDuenio.innerText = textoOPlaceholder(duenioInput.value);
  }

  if (mascotaInput && docMascota) {
    docMascota.innerText = textoOPlaceholder(mascotaInput.value);
  }

  if (descripcionInput && docDescripcion) {
    docDescripcion.innerText = textoOPlaceholder(descripcionInput.value);
  }

  if (fechaInput && docFecha) {
    docFecha.innerText = formatearFecha(fechaInput.value);
  }
}

async function capturarDocumento() {
  const elemento = document.getElementById("documento");

  if (!elemento) {
    throw new Error("No se encontró el elemento #documento");
  }

  return await html2canvas(elemento, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff"
  });
}

async function generarPDF() {
  try {
    if (!window.jspdf) {
      alert("No se cargó la librería jsPDF.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const canvas = await capturarDocumento();
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = 210;
    const pageHeight = 297;

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let finalWidth = imgWidth;
    let finalHeight = imgHeight;
    let posX = 0;
    let posY = 0;

    if (imgHeight > pageHeight) {
      finalHeight = pageHeight;
      finalWidth = (canvas.width * finalHeight) / canvas.height;
      posX = (pageWidth - finalWidth) / 2;
    } else {
      posY = (pageHeight - finalHeight) / 2;
    }

    pdf.addImage(imgData, "PNG", posX, posY, finalWidth, finalHeight);
    pdf.save(`${obtenerNombreBaseArchivo()}.pdf`);
  } catch (error) {
    console.error("Error al generar PDF:", error);
    alert("Hubo un problema al generar el PDF.");
  }
}

async function descargarImagen() {
  try {
    const canvas = await capturarDocumento();
    const link = document.createElement("a");
    link.download = `${obtenerNombreBaseArchivo()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (error) {
    console.error("Error al descargar imagen:", error);
    alert("Hubo un problema al generar la imagen.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("input, textarea").forEach((el) => {
    el.addEventListener("input", actualizarVista);
    el.addEventListener("change", actualizarVista);
  });

  const btnPdf = document.getElementById("btnPdf");
  const btnImagen = document.getElementById("btnImagen");
  const btnLimpiar = document.getElementById("btnLimpiar");

  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", limpiarFormulario);
  }

  if (btnPdf) {
    btnPdf.addEventListener("click", generarPDF);
  }

  if (btnImagen) {
    btnImagen.addEventListener("click", descargarImagen);
  }

  actualizarVista();
});

function limpiarFormulario() {
  const confirmar = confirm("¿Querés limpiar todos los campos?");
  if (!confirmar) return;

  document.getElementById("fecha").value = "";
  document.getElementById("duenio").value = "";
  document.getElementById("mascota").value = "";
  document.getElementById("diagnostico").value = "";

  actualizarVista();
}