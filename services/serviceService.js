import ApiService from './api'

/**
 * Service API 服务
 */
export default class ServiceService extends ApiService {
  /**
   * 获取所有启用的服务
   */
  async getAllServices() {
    return await this.get('/v1/services')
  }

  /**
   * 获取核心服务
   */
  async getFeaturedServices() {
    return await this.get('/v1/services/featured')
  }

  /**
   * 根据ID获取服务
   */
  async getServiceById(id) {
    return await this.get(`/v1/services/${id}`)
  }

  /**
   * 创建服务
   */
  async createService(data) {
    return await this.post('/v1/services', data)
  }

  /**
   * 更新服务
   */
  async updateService(id, data) {
    return await this.put(`/v1/services/${id}`, data)
  }

  /**
   * 删除服务
   */
  async deleteService(id) {
    return await this.delete(`/v1/services/${id}`)
  }
}
