import ApiService from './api'

/**
 * 上传服务 - 本地上传 / 网络链接上传 / 扫码会话上传
 */
class UploadService extends ApiService {
  /**
   * 本地文件上传（自动区分图片/文件）
   */
  async uploadLocal(file, model = 'note', pid = 0) {
    if (!file) throw new Error('请选择文件')

    const isImage = file.type && file.type.startsWith('image/')
    const endpoint = isImage ? '/v1/upload/image' : '/v1/upload/file'

    const formData = new FormData()
    formData.append('file', file)
    formData.append('model', model)
    formData.append('pid', String(pid))

    const response = await this.$axios.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  /**
   * 网络链接上传（服务端拉取）
   */
  async uploadRemote(url, model = 'note', pid = 0) {
    return await this.post('/v1/upload/remote', { url, model, pid })
  }

  /**
   * 创建扫码上传会话
   */
  async createSession(model = 'note', pid = 0, accept = '') {
    const params = { model, pid }
    if (accept) params.accept = accept
    const response = await this.$axios.post('/v1/upload/sessions', null, { params })
    return response.data
  }

  /**
   * 查询扫码上传会话状态
   */
  async getSession(sessionId, token) {
    const response = await this.$axios.get(`/v1/upload/sessions/${sessionId}`, {
      params: { token }
    })
    return response.data
  }

  /**
   * 手机端：上传文件到会话
   */
  async uploadToSession(sessionId, token, file, model = 'note', pid = 0) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('token', token)
    formData.append('model', model)
    formData.append('pid', String(pid))

    const response = await this.$axios.post(`/v1/upload/sessions/${sessionId}/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }
}

export default UploadService


