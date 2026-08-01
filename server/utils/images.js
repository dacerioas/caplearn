async function buscarEnUnsplash(query) {
  if (!process.env.UNSPLASH_ACCESS_KEY) return null;

  try {
    const url =
      "https://api.unsplash.com/search/photos?per_page=1&orientation=squarish&query=" +
      encodeURIComponent(query) +
      "&client_id=" +
      process.env.UNSPLASH_ACCESS_KEY;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const foto = data.results && data.results[0];
    return foto ? foto.urls.small : null;
  } catch {
    return null;
  }
}

async function buscarEnWikipedia(query) {
  let resultados = [];
  try {
    const urlBusqueda =
      "https://es.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=5&srsearch=" +
      encodeURIComponent(query);
    const respuestaBusqueda = await fetch(urlBusqueda);
    const datosBusqueda = await respuestaBusqueda.json();
    resultados = (datosBusqueda.query && datosBusqueda.query.search) || [];
  } catch {
    return null;
  }

  for (const resultado of resultados) {
    try {
      const urlResumen = "https://es.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(resultado.title);
      const respuestaResumen = await fetch(urlResumen);
      const datosResumen = await respuestaResumen.json();
      if (datosResumen.thumbnail && datosResumen.thumbnail.source) {
        return datosResumen.thumbnail.source;
      }
    } catch {
      // este resultado no sirvió, probamos el siguiente
    }
  }

  return null;
}

// Busca primero en Unsplash (fotografía más vistosa); si no hay resultado
// (o no hay API key configurada), cae a buscar en Wikipedia como respaldo.
async function buscarImagenTema(query) {
  const deUnsplash = await buscarEnUnsplash(query);
  if (deUnsplash) return deUnsplash;
  return buscarEnWikipedia(query);
}

module.exports = { buscarImagenTema };
