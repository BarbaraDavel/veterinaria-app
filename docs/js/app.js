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

function esperarRender(ms = 120) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capturarDocumento(elemento = null) {
  const objetivo = elemento || document.getElementById("documento");

  if (!objetivo) {
    throw new Error("No se encontró el elemento #documento");
  }

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  await esperarRender(80);

  return await html2canvas(objetivo, {
    scale: 3,
    useCORS: true,
    backgroundColor: "#ffffff"
  });
}

async function capturarDocumentoEnModoClaro() {
  const documento = document.getElementById("documento");

  if (!documento) {
    throw new Error("No se encontró el elemento #documento");
  }

  documento.classList.add("export-claro");

  try {
    const canvas = await capturarDocumento(documento);
    return canvas;
  } finally {
    documento.classList.remove("export-claro");
    await esperarRender(60);
  }
}


async function generarPDF() {
  const { jsPDF } = window.jspdf;

  const canvas = await capturarDocumentoEnModoClaro();
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");

  const pdfWidth = 210;
  const pdfHeight = 297;

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let y = 0;

  // Si es más alto que una página → cortar (opcional futuro)
  if (imgHeight > pdfHeight) {
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
  } else {
    // CENTRADO vertical (esto lo hace ver profesional)
    y = (pdfHeight - imgHeight) / 2;
    pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
  }

  pdf.save(obtenerNombreBaseArchivo() + ".pdf");
}

async function descargarImagen() {
  try {
    const canvas = await capturarDocumentoEnModoClaro();
    const link = document.createElement("a");
    link.download = `${obtenerNombreBaseArchivo()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (error) {
    console.error("Error al descargar imagen:", error);
    alert("Hubo un problema al generar la imagen.");
  }
}

function limpiarFormulario() {
  const confirmar = confirm("¿Querés limpiar todos los campos?");
  if (!confirmar) return;

  document.getElementById("fecha").value = "";
  document.getElementById("duenio").value = "";
  document.getElementById("mascota").value = "";
  document.getElementById("diagnostico").value = "";

  actualizarVista();
}

function aplicarTema(tema) {
  const toggle = document.getElementById("themeToggle");
  const label = document.querySelector(".theme-label");

  if (tema === "dark") {
    document.body.classList.add("dark");
    if (toggle) toggle.checked = true;
    if (label) label.textContent = "☀️";
  } else {
    document.body.classList.remove("dark");
    if (toggle) toggle.checked = false;
    if (label) label.textContent = "🌙";
  }
}

function inicializarTema() {
  const temaGuardado = localStorage.getItem("tema") || "light";
  aplicarTema(temaGuardado);

  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  toggle.addEventListener("change", () => {
    const nuevoTema = toggle.checked ? "dark" : "light";
    localStorage.setItem("tema", nuevoTema);
    aplicarTema(nuevoTema);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("input, textarea").forEach((el) => {
    el.addEventListener("input", actualizarVista);
    el.addEventListener("change", actualizarVista);
  });

  const btnPdf = document.getElementById("btnPdf");
  const btnImagen = document.getElementById("btnImagen");
  const btnLimpiar = document.getElementById("btnLimpiar");

  if (btnPdf) {
    btnPdf.addEventListener("click", generarPDF);
  }

  if (btnImagen) {
    btnImagen.addEventListener("click", descargarImagen);
  }

  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", limpiarFormulario);
  }

  inicializarTema();
  actualizarVista();
});