export async function translateNotesBatch(notes: string[]): Promise<Map<string, string>> {
  const uniqueNotes = Array.from(new Set(notes.filter(Boolean)));
  const translations = new Map<string, string>();
  
  // Regex to check if text only contains English, Arabic, numbers, and basic punctuation
  const isOnlyArabicOrEnglish = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s.,!?()\'"\-\:]+$/;

  const toTranslate = uniqueNotes.filter(note => !isOnlyArabicOrEnglish.test(note));

  for (const note of toTranslate) {
    try {
      const res = await fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=" + encodeURIComponent(note));
      const data = await res.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        translations.set(note, data[0][0][0]);
      } else {
        translations.set(note, note);
      }
    } catch (error) {
      console.error("Translation error for: ", note, error);
      translations.set(note, note);
    }
  }

  return translations;
}