export default class AiService {
  constructor(axios) {
    this.axios = axios
  }

  translateNote(noteId, mode = 'FAITHFUL', targetLanguage = 'en') {
    return this.axios.$post(`/v1/ai/translate/note/${noteId}`, {
      mode,
      targetLanguage
    })
  }

  generateLinkedinHashtags(noteId) {
    return this.axios.$post(`/v1/ai/linkedin/hashtags/${noteId}`)
  }
}
