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

function actualizarVista() {
  const duenioInput = document.getElementById("duenio");
  const mascotaInput = document.getElementById("mascota");
  const diagnosticoInput = document.getElementById("diagnostico");
  const tratamientoInput = document.getElementById("tratamiento");

  const docDuenio = document.getElementById("doc-duenio");
  const docMascota = document.getElementById("doc-mascota");
  const docDiagnostico = document.getElementById("doc-diagnostico");
  const docTratamiento = document.getElementById("doc-tratamiento");

  if (duenioInput && docDuenio) {
    docDuenio.innerText = textoOPlaceholder(duenioInput.value);
  }

  if (mascotaInput && docMascota) {
    docMascota.innerText = textoOPlaceholder(mascotaInput.value);
  }

  if (diagnosticoInput && docDiagnostico) {
    docDiagnostico.innerText = textoOPlaceholder(diagnosticoInput.value);
  }

  if (tratamientoInput && docTratamiento) {
    docTratamiento.innerText = textoOPlaceholder(tratamientoInput.value);
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

async function compartir() {
  try {
    const canvas = await capturarDocumento();

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
        alert(
          "Tu dispositivo o navegador no permite compartir el archivo directamente. Se descargará la imagen."
        );
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
  const btnImagen = document.getElementById("btnImagen");

  if (btnPdf) {
    btnPdf.addEventListener("click", generarPDF);
  }

  if (btnImagen) {
    btnImagen.addEventListener("click", descargarImagen);
  }

  actualizarVista();
});