import ApiService from './api'

/**
 * Contact API 服务
 */
export default class ContactService extends ApiService {
  /**
   * 提交联系表单
   * @param {Object} formData - 表单数据
   * @param {string} formData.name - 姓名
   * @param {string} formData.email - 邮箱
   * @param {string} formData.organization - 组织名称（可选）
   * @param {string} formData.projectSummary - 项目摘要
   * @param {File} file - 文件（可选）
   */
  async submitContactForm(formData, file = null) {
    const data = new FormData()
    data.append('name', formData.name)
    data.append('email', formData.email)
    if (formData.organization) {
      data.append('organization', formData.organization)
    }
    data.append('projectSummary', formData.projectSummary)
    if (file) {
      data.append('file', file)
    }

    const response = await this.$axios.post('/v1/contact/submit', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  /**
   * 管理端：分页获取 Collaboration Requests 列表
   * @param {Object} params - 查询参数 { page, size, status, keyword }
   */
  async getAdminSubmissions(params = {}) {
    const { page = 0, size = 10, status, keyword } = params
    const query = new URLSearchParams()
    query.append('page', page)
    query.append('size', size)
    if (status) query.append('status', status)
    if (keyword) query.append('keyword', keyword)

    return await this.get(`/v1/admin/contact-submissions?${query.toString()}`)
  }

  /**
   * 管理端：获取单条提交详情（含备注）
   * @param {number} id
   */
  async getAdminSubmissionDetail(id) {
    return await this.get(`/v1/admin/contact-submissions/${id}`)
  }

  /**
   * 管理端：为提交记录添加内部备注
   * @param {number} id
   * @param {string} content
   */
  async addAdminSubmissionNote(id, content) {
    // 后端以纯文本 body 接收
    return await this.post(`/v1/admin/contact-submissions/${id}/notes`, content, {
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8'
      }
    })
  }

  /**
   * 管理端：更新提交状态
   * @param {number} id
   * @param {string} status
   */
  async updateAdminSubmissionStatus(id, status) {
    const query = new URLSearchParams()
    query.append('status', status)
    return await this.$axios.patch(`/v1/admin/contact-submissions/${id}/status?${query.toString()}`)
      .then(res => res.data)
  }
}





