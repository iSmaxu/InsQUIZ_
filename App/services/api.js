const REMOTE_URL = 'https://mocki.io/v1/0b3f2f02-5b40-46c9-a95a-41f1e2c5c0a1';

export async function loadQuestionsFromApi() {
  try {
    const res = await fetch(REMOTE_URL);
    if (!res.ok) throw new Error('Network response not ok');
    const json = await res.json();
    return json;
  } catch (e) {
    console.log('Failed to load remote questions:', e.message);
    return null;
  }
}
