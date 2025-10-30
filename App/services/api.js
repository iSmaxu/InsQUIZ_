// services/api.js
export async function fetchRemoteQuestions() {
  const url = 'https://gist.githubusercontent.com/iSmaxu/068371d31aa27ce61bb2d5aa28097d59/raw/155421e62a2b698a2b72122630d3fe5c9912fd12/gistfile1.txt';

  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

    const data = await response.json();

    // Validar estructura básica
    if (!data || typeof data !== 'object' || !data.lectura) {
      throw new Error('Formato JSON no válido o incompleto');
    }

    console.log('✅ Banco de preguntas cargado correctamente');
    return data;
  } catch (error) {
    console.warn('⚠️ Error al obtener banco remoto:', error.message);
    return null;
  }
}
