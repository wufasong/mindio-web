import ApiService from './api'

class NewsService extends ApiService {
  getNews(date = null) {
    return this.get('/v1/news', { params: date ? { date } : {} })
  }

  getSources() {
    return this.get('/v1/news/sources')
  }

  toggleSource(key) {
    return this.put(`/v1/news/sources/${key}`)
  }

  refreshAll() {
    return this.post('/v1/news/refresh')
  }

  refreshOne(key) {
    return this.post(`/v1/news/refresh/${key}`)
  }
}

export default NewsService
