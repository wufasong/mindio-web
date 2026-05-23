<template>
  <div class="collab-requests-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Collaboration Requests</h2>
        <p class="page-subtitle">
          查看从 Contact 页面提交的合作请求，并添加仅内部可见的回访备注。
        </p>
      </div>
      <div class="page-actions">
        <el-select
          v-model="filters.status"
          size="small"
          placeholder="全部状态"
          clearable
          class="filter-select"
          @change="handleFilterChange"
        >
          <el-option label="全部状态" :value="null" />
          <el-option label="待处理" value="pending" />
          <el-option label="已查看" value="reviewed" />
          <el-option label="已回复" value="replied" />
          <el-option label="已关闭" value="closed" />
        </el-select>
        <el-input
          v-model="filters.keyword"
          size="small"
          placeholder="搜索姓名 / 邮箱 / 组织"
          clearable
          class="filter-input"
          @keyup.enter.native="handleFilterChange"
          @clear="handleFilterChange"
        >
          <i slot="prefix" class="el-icon-search" />
        </el-input>
      </div>
    </div>

    <div class="content-layout">
      <div class="list-panel">
        <el-table
          v-loading="loading"
          :data="items"
          height="100%"
          border
          highlight-current-row
          @row-click="handleRowClick"
          :row-class-name="getRowClassName"
        >
          <el-table-column prop="createdAt" label="提交时间" width="170">
            <template slot-scope="scope">
              {{ formatDateTime(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="name" label="姓名" width="140" />
          <el-table-column prop="email" label="邮箱" width="200" show-overflow-tooltip />
          <el-table-column prop="organization" label="组织" width="180" show-overflow-tooltip />
          <el-table-column prop="projectSummary" label="项目摘要" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="110">
            <template slot-scope="scope">
              <el-tag :type="getStatusTagType(scope.row.status)" size="small">
                {{ getStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="total > pageSize" class="table-pagination">
          <el-pagination
            layout="prev, pager, next"
            :current-page="page + 1"
            :page-size="pageSize"
            :total="total"
            @current-change="handlePageChange"
          />
        </div>
      </div>

      <div class="detail-panel" v-if="selectedItem && detail">
        <div class="detail-header">
          <div class="detail-title">
            <h3>{{ selectedItem.name }}</h3>
            <div class="detail-meta">
              <span>{{ selectedItem.email }}</span>
              <span v-if="selectedItem.organization"> · {{ selectedItem.organization }}</span>
            </div>
          </div>
          <div class="detail-actions">
            <el-select
              v-model="detail.status"
              size="small"
              style="width: 160px;"
              @change="handleStatusChange"
            >
              <el-option label="待处理" value="pending" />
              <el-option label="已查看" value="reviewed" />
              <el-option label="已回复" value="replied" />
              <el-option label="已关闭" value="closed" />
            </el-select>
          </div>
        </div>

        <el-tabs v-model="activeTab" class="detail-tabs">
          <el-tab-pane label="请求详情" name="detail">
            <div class="detail-section">
              <h4>项目摘要</h4>
              <p class="project-summary">
                {{ detail.projectSummary }}
              </p>
            </div>
            <div class="detail-section">
              <h4>基础信息</h4>
              <ul class="info-list">
                <li>
                  <span class="label">提交时间</span>
                  <span class="value">{{ formatDateTime(detail.createdAt) }}</span>
                </li>
                <li>
                  <span class="label">最近更新</span>
                  <span class="value">{{ formatDateTime(detail.updatedAt) }}</span>
                </li>
                <li>
                  <span class="label">当前状态</span>
                  <span class="value">
                    <el-tag :type="getStatusTagType(detail.status)" size="mini">
                      {{ getStatusLabel(detail.status) }}
                    </el-tag>
                  </span>
                </li>
                <li v-if="detail.attachmentUrl">
                  <span class="label">附件</span>
                  <span class="value">
                    <a
                      :href="detail.attachmentUrl"
                      target="_blank"
                      rel="noopener"
                      class="attachment-link"
                    >
                      {{ detail.attachmentName || '查看附件' }}
                    </a>
                  </span>
                </li>
              </ul>
            </div>
          </el-tab-pane>
          <el-tab-pane label="内部备注" name="notes">
            <div class="notes-wrapper">
              <p class="notes-tip">
                这些备注仅对登录的管理员可见，不会对外展示。
              </p>
              <div class="notes-list" v-if="detail.notes && detail.notes.length">
                <div
                  v-for="note in detail.notes"
                  :key="note.id"
                  class="note-item"
                >
                  <div class="note-meta">
                    <span class="author">{{ note.createdByUsername || 'Admin' }}</span>
                    <span class="time">{{ formatDateTime(note.createdAt) }}</span>
                  </div>
                  <div class="note-content">
                    {{ note.content }}
                  </div>
                </div>
              </div>
              <div v-else class="notes-empty">
                暂无内部备注。
              </div>

              <div class="note-editor">
                <el-input
                  v-model="newNoteContent"
                  type="textarea"
                  :rows="3"
                  placeholder="添加一条新的内部备注，用于记录回访情况、下一步计划等..."
                />
                <div class="note-editor-actions">
                  <span class="hint">备注仅内部可见</span>
                  <el-button
                    type="primary"
                    size="small"
                    :loading="submittingNote"
                    :disabled="!newNoteContent.trim()"
                    @click="handleAddNote"
                  >
                    添加备注
                  </el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div v-else class="detail-empty">
        <p>请选择左侧列表中的一条合作请求查看详情。</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WorkspaceCollaborationRequestsPage',
  layout: 'workspace',
  middleware: 'auth',
  data() {
    return {
      loading: false,
      items: [],
      total: 0,
      page: 0,
      pageSize: 10,
      filters: {
        status: null,
        keyword: ''
      },
      selectedItem: null,
      detail: null,
      activeTab: 'detail',
      newNoteContent: '',
      submittingNote: false
    }
  },
  async mounted() {
    await this.fetchList()
  },
  methods: {
    async fetchList() {
      this.loading = true
      try {
        const result = await this.$contactService.getAdminSubmissions({
          page: this.page,
          size: this.pageSize,
          status: this.filters.status,
          keyword: this.filters.keyword
        })
        // Spring Data Page 默认结构：content, totalElements, number, size
        this.items = result.content || []
        this.total = result.totalElements || 0
        this.page = result.number || 0

        if (!this.selectedItem && this.items.length > 0) {
          this.handleRowClick(this.items[0])
        }
      } catch (error) {
        console.error('加载 Collaboration Requests 失败', error)
        const msg = error.response?.data?.message || error.message || '加载失败，请稍后重试'
        this.$message.error(msg)
      } finally {
        this.loading = false
      }
    },
    handleFilterChange() {
      this.page = 0
      this.fetchList()
    },
    handlePageChange(page) {
      this.page = page - 1
      this.fetchList()
    },
    async handleRowClick(row) {
      this.selectedItem = row
      await this.fetchDetail(row.id)
    },
    async fetchDetail(id) {
      try {
        const detail = await this.$contactService.getAdminSubmissionDetail(id)
        this.detail = detail
      } catch (error) {
        console.error('加载详情失败', error)
        const msg = error.response?.data?.message || error.message || '加载详情失败'
        this.$message.error(msg)
      }
    },
    async handleStatusChange(value) {
      if (!this.detail || !this.detail.id) return
      try {
        const updated = await this.$contactService.updateAdminSubmissionStatus(this.detail.id, value)
        this.detail = updated
        // 同步更新列表里的状态
        const idx = this.items.findIndex(item => item.id === updated.id)
        if (idx !== -1) {
          this.$set(this.items, idx, {
            ...this.items[idx],
            status: updated.status,
            updatedAt: updated.updatedAt
          })
        }
        this.$message.success('状态已更新')
      } catch (error) {
        console.error('更新状态失败', error)
        const msg = error.response?.data?.message || error.message || '更新状态失败'
        this.$message.error(msg)
      }
    },
    async handleAddNote() {
      if (!this.detail || !this.detail.id || !this.newNoteContent.trim()) return
      this.submittingNote = true
      try {
        const note = await this.$contactService.addAdminSubmissionNote(
          this.detail.id,
          this.newNoteContent.trim()
        )
        if (!this.detail.notes) {
          this.$set(this.detail, 'notes', [])
        }
        this.detail.notes.unshift(note)
        this.newNoteContent = ''
        this.$message.success('备注已添加')
      } catch (error) {
        console.error('添加备注失败', error)
        const msg = error.response?.data?.message || error.message || '添加备注失败'
        this.$message.error(msg)
      } finally {
        this.submittingNote = false
      }
    },
    formatDateTime(value) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return value
      return date.toLocaleString()
    },
    getStatusLabel(status) {
      switch (status) {
        case 'pending':
          return '待处理'
        case 'reviewed':
          return '已查看'
        case 'replied':
          return '已回复'
        case 'closed':
          return '已关闭'
        default:
          return status || '未知'
      }
    },
    getStatusTagType(status) {
      switch (status) {
        case 'pending':
          return 'warning'
        case 'reviewed':
          return 'info'
        case 'replied':
          return 'success'
        case 'closed':
          return 'default'
        default:
          return 'info'
      }
    },
    getRowClassName({ row }) {
      if (!row) return ''
      if (row.status === 'pending') {
        return 'row-pending'
      }
      if (row.status === 'replied') {
        return 'row-replied'
      }
      return ''
    }
  },
  head() {
    return {
      title: 'Workspace - Collaboration Requests'
    }
  }
}
</script>

<style scoped lang="scss">
.collab-requests-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px 8px;
  border-bottom: 1px solid var(--border-color);
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
}

.page-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.page-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-select {
  width: 140px;
}

.filter-input {
  width: 220px;
}

.content-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}

.list-panel {
  flex: 1;
  min-width: 0;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.detail-panel {
  width: 420px;
  max-width: 480px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
}

.detail-empty {
  width: 420px;
  max-width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 14px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.detail-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.detail-meta {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}

.detail-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.detail-tabs ::v-deep .el-tabs__content {
  flex: 1;
  overflow: auto;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section h4 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.project-summary {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-color);
  white-space: pre-wrap;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.info-list li {
  display: flex;
  margin-bottom: 6px;
}

.info-list .label {
  width: 80px;
  color: var(--text-muted);
}

.info-list .value {
  flex: 1;
}

.attachment-link {
  color: #3b82f6;
  text-decoration: none;
}

.attachment-link:hover {
  text-decoration: underline;
}

.notes-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.notes-tip {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0 0 8px;
}

.notes-list {
  flex: 1;
  overflow: auto;
  padding-right: 4px;
}

.note-item {
  border-radius: 6px;
  border: 1px solid var(--border-color);
  padding: 8px 10px;
  margin-bottom: 8px;
  background: var(--card-bg-color);
}

.note-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.note-content {
  font-size: 13px;
  color: var(--text-color);
  white-space: pre-wrap;
}

.notes-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--text-muted);
}

.note-editor {
  border-top: 1px solid var(--border-color);
  padding-top: 8px;
  margin-top: 8px;
}

.note-editor-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}

.note-editor-actions .hint {
  font-size: 12px;
  color: var(--text-muted);
}

.table-pagination {
  padding: 8px 16px;
  text-align: right;
  border-top: 1px solid var(--border-color);
}

/* 行高亮 */
.row-pending {
  background-color: rgba(250, 204, 21, 0.06);
}

.row-replied {
  background-color: rgba(34, 197, 94, 0.04);
}

@media screen and (max-width: 1024px) {
  .detail-panel,
  .detail-empty {
    display: none;
  }
}
</style>

