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

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

function actualizarVista() {
  const duenio = textoOPlaceholder(document.getElementById("duenio")?.value || "");
  const mascota = textoOPlaceholder(document.getElementById("mascota")?.value || "");
  const diagnostico = textoOPlaceholder(document.getElementById("diagnostico")?.value || "");
  const tratamiento = textoOPlaceholder(document.getElementById("tratamiento")?.value || "");

  setText("doc-duenio", duenio);
  setText("doc-mascota", mascota);
  setText("doc-diagnostico", diagnostico);
  setText("doc-tratamiento", tratamiento);

  setText("export-duenio", duenio);
  setText("export-mascota", mascota);
  setText("export-diagnostico", diagnostico);
  setText("export-tratamiento", tratamiento);
}

async function capturarDocumentoExport() {
  const elemento = document.getElementById("documentoExport");

  if (!elemento) {
    throw new Error("No se encontró el elemento #documentoExport");
  }

  return await html2canvas(elemento, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    width: 794,
    windowWidth: 794
  });
}

async function generarPDF() {
  try {
    if (!window.jspdf) {
      alert("No se cargó la librería jsPDF.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const canvas = await capturarDocumentoExport();
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;

    const margin = 8;
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;

    let imgWidth = usableWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > usableHeight) {
      imgHeight = usableHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    const x = (pageWidth - imgWidth) / 2;
    const y = 8;

    pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
    pdf.save(`${obtenerNombreBaseArchivo()}.pdf`);
  } catch (error) {
    console.error("Error al generar PDF:", error);
    alert("Hubo un problema al generar el PDF.");
  }
}

async function descargarImagen() {
  try {
    const canvas = await capturarDocumentoExport();
    const link = document.createElement("a");
    link.download = `${obtenerNombreBaseArchivo()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (error) {
    console.error("Error al descargar imagen:", error);
    alert("Hubo un problema al generar la imagen.");
  }
}

async function compartir() {
  try {
    const canvas = await capturarDocumentoExport();

    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert("No se pudo generar la imagen para compartir.");
        return;
      }

      const archivo = new File(
        [blob],
        `${obtenerNombreBaseArchivo()}.png`,
        { type: "image/png" }
      );

      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        await navigator.share({
          title: "Documento veterinario",
          text: "Te envío el documento veterinario.",
          files: [archivo]
        });
      } else {
        alert("Tu dispositivo o navegador no permite compartir el archivo directamente. Se descargará la imagen.");
        const link = document.createElement("a");
        link.download = archivo.name;
        link.href = URL.createObjectURL(blob);
        link.click();
      }
    }, "image/png");
  } catch (error) {
    console.error("Error al compartir:", error);
    alert("Hubo un problema al compartir el documento.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("input, textarea").forEach((el) => {
    el.addEventListener("input", actualizarVista);
  });

  const btnPdf = document.getElementById("btnPdf");
  const btnCompartir = document.getElementById("btnCompartir");
  const btnImagen = document.getElementById("btnImagen");

  if (btnPdf) btnPdf.addEventListener("click", generarPDF);
  if (btnCompartir) btnCompartir.addEventListener("click", compartir);
  if (btnImagen) btnImagen.addEventListener("click", descargarImagen);

  actualizarVista();
});