<template>
  <div class="local-docs-page">
    <div class="workspace-layout">
      <!-- ========== 左侧栏 ========== -->
      <aside class="workspace-sidebar">
        <div class="sidebar-header">
          <el-button
            type="primary"
            size="small"
            icon="el-icon-folder-add"
            style="width:100%"
            @click="openAddDialog"
          >添加目录</el-button>
        </div>

        <div v-loading="loadingDirs" class="dir-list">
          <div
            v-for="dir in directories"
            :key="dir.id"
            class="dir-item"
            :class="{ active: selectedDir && selectedDir.id === dir.id }"
            @click="selectDir(dir)"
          >
            <div class="dir-item-main">
              <i class="el-icon-folder dir-icon" :class="{ scanning: dir.scanStatus === 'SCANNING' }"></i>
              <div class="dir-item-info">
                <div class="dir-item-name">{{ dirDisplayName(dir) }}</div>
                <div class="dir-item-meta">
                  <span v-if="dir.scanStatus === 'SCANNING'" class="scan-status scanning">
                    <i class="el-icon-loading"></i> 扫描中…
                  </span>
                  <span v-else-if="dir.scanStatus === 'ERROR'" class="scan-status error">
                    <i class="el-icon-warning-outline"></i> 扫描出错
                  </span>
                  <span v-else class="doc-count">{{ dir.documentCount }} 个文件</span>
                </div>
              </div>
            </div>
            <el-dropdown trigger="click" @command="cmd => handleDirCommand(cmd, dir)" @click.native.stop>
              <span class="dir-more-btn" @click.stop><i class="el-icon-more"></i></span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="rescan" icon="el-icon-refresh">重新扫描</el-dropdown-item>
                <el-dropdown-item command="delete" icon="el-icon-delete" class="danger-item">删除目录</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>

          <div v-if="!loadingDirs && directories.length === 0" class="sidebar-empty">
            <i class="el-icon-folder-opened"></i>
            <p>暂无目录</p>
            <p class="sidebar-empty-hint">点击上方按钮添加本地目录</p>
          </div>
        </div>
      </aside>

      <!-- ========== 主内容区 ========== -->
      <main class="workspace-main">
        <!-- 未选中目录 -->
        <div v-if="!selectedDir" class="main-empty">
          <i class="el-icon-files main-empty-icon"></i>
          <p class="main-empty-title">选择一个目录查看本地文档</p>
          <p class="main-empty-hint">在左侧添加本地目录，系统将扫描并记录目录中的文档</p>
        </div>

        <!-- 已选中目录 -->
        <template v-else>
          <!-- 目录信息行 -->
          <div class="dir-info-bar">
            <div class="dir-info-path">
              <i class="el-icon-folder-opened"></i>
              <span class="dir-info-path-text" :title="selectedDir.dirPath">{{ selectedDir.dirPath }}</span>
            </div>
            <div class="dir-info-meta">
              <span v-if="selectedDir.lastScanAt">
                上次扫描：{{ formatDate(selectedDir.lastScanAt) }}
              </span>
              <span v-else class="text-muted">未扫描</span>
              <span class="dir-info-count">共 {{ selectedDir.documentCount }} 个文件</span>
            </div>
          </div>

          <!-- 错误提示 -->
          <el-alert
            v-if="selectedDir.scanStatus === 'ERROR' && selectedDir.lastScanError"
            :title="'扫描错误：' + selectedDir.lastScanError"
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom:12px"
          />

          <!-- 工具栏 -->
          <div class="docs-toolbar">
            <el-input
              v-model="keyword"
              placeholder="搜索文件名…"
              prefix-icon="el-icon-search"
              size="small"
              clearable
              style="width:260px"
              @input="onSearch"
            />
            <el-select
              v-model="filterType"
              size="small"
              placeholder="文件类型"
              clearable
              style="width:120px;margin-left:12px"
              @change="onSearch"
            >
              <el-option label="全部" value="" />
              <el-option label="PDF" value="pdf" />
              <el-option label="Word" value="docx" />
              <el-option label="Word 97" value="doc" />
              <el-option label="Excel" value="xlsx" />
              <el-option label="Excel 97" value="xls" />
              <el-option label="PPT" value="pptx" />
              <el-option label="PPT 97" value="ppt" />
            </el-select>
          </div>

          <!-- 文档列表 -->
          <div v-loading="loadingDocs" class="docs-table-wrapper">
            <el-table
              :data="documents"
              size="small"
              style="width:100%"
              :empty-text="selectedDir.scanStatus === 'SCANNING' ? '扫描中，请稍候…' : '该目录下暂无匹配的文档'"
            >
              <el-table-column width="40">
                <template slot-scope="{ row }">
                  <i :class="fileIcon(row.fileType)" class="file-type-icon" :style="{ color: fileColor(row.fileType) }"></i>
                </template>
              </el-table-column>
              <el-table-column label="文件名" prop="fileName" min-width="200" show-overflow-tooltip />
              <el-table-column label="位置" prop="relativePath" min-width="160" show-overflow-tooltip>
                <template slot-scope="{ row }">
                  <span class="rel-path">{{ relativeDir(row.relativePath) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="类型" prop="fileType" width="80">
                <template slot-scope="{ row }">
                  <el-tag size="mini" :type="typeTagType(row.fileType)">{{ row.fileType.toUpperCase() }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="大小" width="90">
                <template slot-scope="{ row }">{{ formatSize(row.fileSize) }}</template>
              </el-table-column>
              <el-table-column label="修改时间" width="130">
                <template slot-scope="{ row }">{{ formatDate(row.fileLastModified) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right">
                <template slot-scope="{ row }">
                  <el-button type="text" size="mini" icon="el-icon-view" @click="openDocument(row)">打开</el-button>
                  <el-button type="text" size="mini" icon="el-icon-document-copy" @click="copyPath(row)">复制路径</el-button>
                </template>
              </el-table-column>
            </el-table>

            <el-pagination
              v-if="total > pageSize"
              layout="prev, pager, next"
              :total="total"
              :page-size="pageSize"
              :current-page.sync="currentPage"
              style="text-align:center;margin-top:16px"
              @current-change="loadDocuments"
            />
          </div>
        </template>
      </main>
    </div>

    <!-- 添加目录 Dialog -->
    <el-dialog
      title="添加本地目录"
      :visible.sync="addDialogVisible"
      width="560px"
      @close="resetForm"
    >
      <el-form ref="addForm" :model="addForm" :rules="addRules" label-width="80px">
        <!-- 路径输入行 -->
        <el-form-item label="目录路径" prop="dirPath">
          <div class="path-input-row">
            <el-input
              v-model="addForm.dirPath"
              placeholder="例：C:\Users\...\Documents"
              clearable
              style="flex:1"
              @change="closeBrowser"
            />
            <el-button
              icon="el-icon-folder-opened"
              style="margin-left:8px;flex-shrink:0"
              @click="toggleBrowser"
            >浏览</el-button>
          </div>
        </el-form-item>

        <!-- 目录浏览器 -->
        <div v-if="browserVisible" class="dir-browser">
          <!-- 面包屑导航 -->
          <div class="browser-breadcrumb">
            <span
              class="crumb crumb-root"
              @click="navigateTo('')"
            ><i class="el-icon-s-home"></i></span>
            <template v-for="(crumb, i) in breadcrumbs">
              <span :key="'sep-' + i" class="crumb-sep">/</span>
              <span
                :key="'crumb-' + i"
                class="crumb"
                :class="{ 'crumb-last': i === breadcrumbs.length - 1 }"
                @click="navigateTo(crumb.path)"
              >{{ crumb.name }}</span>
            </template>
          </div>

          <!-- 目录列表 -->
          <div v-loading="browserLoading" class="browser-list">
            <div
              v-for="entry in browserEntries"
              :key="entry.path"
              class="browser-entry"
              @click="navigateTo(entry.path)"
            >
              <i class="el-icon-folder browser-entry-icon"></i>
              <span class="browser-entry-name">{{ entry.name }}</span>
              <i class="el-icon-arrow-right browser-entry-arrow"></i>
            </div>
            <div v-if="!browserLoading && browserEntries.length === 0" class="browser-empty">
              该目录下没有子目录
            </div>
          </div>

          <!-- 选择当前目录按钮 -->
          <div v-if="browserCurrentPath" class="browser-footer">
            <el-button type="primary" size="small" icon="el-icon-check" @click="selectBrowserPath">
              选择「{{ browserCurrentName }}」
            </el-button>
          </div>
        </div>

        <el-form-item label="显示名称">
          <el-input
            v-model="addForm.displayName"
            placeholder="可选，留空则使用目录名"
            clearable
          />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="adding" @click="submitAdd">添加并扫描</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'LocalDocsPage',
  layout: 'workspace',
  middleware: 'auth',
  data() {
    return {
      directories: [],
      loadingDirs: false,
      selectedDir: null,

      documents: [],
      total: 0,
      currentPage: 1,
      pageSize: 20,
      loadingDocs: false,
      keyword: '',
      filterType: '',
      searchTimer: null,

      addDialogVisible: false,
      adding: false,
      addForm: { dirPath: '', displayName: '' },
      addRules: {
        dirPath: [{ required: true, message: '请输入目录路径', trigger: 'blur' }],
      },

      browserVisible: false,
      browserLoading: false,
      browserCurrentPath: '',
      browserEntries: [],
    }
  },
  computed: {
    breadcrumbs() {
      if (!this.browserCurrentPath) return []
      const isWindows = this.browserCurrentPath.includes('\\')
      const parts = this.browserCurrentPath.replace(/\\/g, '/').split('/').filter(Boolean)
      const crumbs = []
      for (let i = 0; i < parts.length; i++) {
        const seg = parts.slice(0, i + 1).join(isWindows ? '\\' : '/')
        const fullPath = isWindows ? seg : '/' + seg
        crumbs.push({ name: parts[i], path: fullPath })
      }
      return crumbs
    },
    browserCurrentName() {
      if (!this.browserCurrentPath) return ''
      const parts = this.browserCurrentPath.replace(/\\/g, '/').split('/')
      return parts.filter(Boolean).pop() || this.browserCurrentPath
    },
  },
  async created() {
    await this.loadDirectories()
  },
  methods: {
    async loadDirectories() {
      this.loadingDirs = true
      try {
        this.directories = await this.$localDocService.getDirectories()
      } catch {
        this.$message.error('加载目录列表失败')
      } finally {
        this.loadingDirs = false
      }
    },

    selectDir(dir) {
      this.selectedDir = dir
      this.keyword = ''
      this.filterType = ''
      this.currentPage = 1
      this.documents = []
      this.total = 0
      this.loadDocuments()
    },

    async loadDocuments() {
      if (!this.selectedDir) return
      this.loadingDocs = true
      try {
        const res = await this.$localDocService.getDocuments(this.selectedDir.id, {
          keyword: this.keyword || undefined,
          fileType: this.filterType || undefined,
          page: this.currentPage - 1,
          size: this.pageSize,
        })
        this.documents = res.content || []
        this.total = res.totalElements || 0
      } catch {
        this.$message.error('加载文档列表失败')
      } finally {
        this.loadingDocs = false
      }
    },

    onSearch() {
      clearTimeout(this.searchTimer)
      this.currentPage = 1
      this.searchTimer = setTimeout(() => this.loadDocuments(), 300)
    },

    openAddDialog() {
      this.addDialogVisible = true
    },

    resetForm() {
      this.addForm = { dirPath: '', displayName: '' }
      this.$refs.addForm && this.$refs.addForm.resetFields()
      this.browserVisible = false
      this.browserCurrentPath = ''
      this.browserEntries = []
    },

    async toggleBrowser() {
      if (this.browserVisible) {
        this.browserVisible = false
        return
      }
      this.browserVisible = true
      const startPath = this.addForm.dirPath.trim() || ''
      await this.navigateTo(startPath)
    },

    closeBrowser() {
      this.browserVisible = false
    },

    async navigateTo(path) {
      this.browserLoading = true
      try {
        const res = await this.$localDocService.listDirectory(path)
        this.browserCurrentPath = res.currentPath || ''
        this.browserEntries = res.entries || []
      } catch (e) {
        this.$message.error(e?.response?.data?.message || '无法读取目录')
      } finally {
        this.browserLoading = false
      }
    },

    selectBrowserPath() {
      this.addForm.dirPath = this.browserCurrentPath
      this.browserVisible = false
      this.$refs.addForm && this.$refs.addForm.clearValidate('dirPath')
    },

    async submitAdd() {
      try {
        await this.$refs.addForm.validate()
      } catch {
        return
      }
      this.adding = true
      try {
        const newDir = await this.$localDocService.addDirectory({
          dirPath: this.addForm.dirPath.trim(),
          displayName: this.addForm.displayName.trim() || undefined,
        })
        this.directories.unshift(newDir)
        this.addDialogVisible = false
        this.selectDir(newDir)
        if (newDir.scanStatus === 'ERROR') {
          this.$message.warning('目录已添加，但扫描遇到问题：' + newDir.lastScanError)
        } else {
          this.$message.success(`扫描完成，共发现 ${newDir.documentCount} 个文件`)
        }
      } catch (e) {
        this.$message.error(e?.response?.data?.message || '添加失败')
      } finally {
        this.adding = false
      }
    },

    async handleDirCommand(cmd, dir) {
      if (cmd === 'rescan') {
        await this.doRescan(dir)
      } else if (cmd === 'delete') {
        await this.doDelete(dir)
      }
    },

    async doRescan(dir) {
      const idx = this.directories.findIndex(d => d.id === dir.id)
      if (idx >= 0) this.$set(this.directories[idx], 'scanStatus', 'SCANNING')
      try {
        const updated = await this.$localDocService.rescan(dir.id)
        if (idx >= 0) this.$set(this.directories, idx, updated)
        if (this.selectedDir && this.selectedDir.id === dir.id) {
          this.selectedDir = updated
          this.loadDocuments()
        }
        if (updated.scanStatus === 'ERROR') {
          this.$message.warning('扫描遇到问题：' + updated.lastScanError)
        } else {
          this.$message.success(`扫描完成，共 ${updated.documentCount} 个文件`)
        }
      } catch (e) {
        this.$message.error(e?.response?.data?.message || '扫描失败')
        if (idx >= 0) this.$set(this.directories[idx], 'scanStatus', 'ERROR')
      }
    },

    async doDelete(dir) {
      try {
        await this.$confirm(
          `确认删除目录「${this.dirDisplayName(dir)}」？\n目录中的文档快照记录将一并删除，不影响本地文件。`,
          '确认删除',
          { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
        )
      } catch {
        return
      }
      try {
        await this.$localDocService.deleteDirectory(dir.id)
        this.directories = this.directories.filter(d => d.id !== dir.id)
        if (this.selectedDir && this.selectedDir.id === dir.id) {
          this.selectedDir = null
          this.documents = []
          this.total = 0
        }
        this.$message.success('已删除')
      } catch (e) {
        this.$message.error(e?.response?.data?.message || '删除失败')
      }
    },

    async copyPath(doc) {
      try {
        await navigator.clipboard.writeText(doc.absolutePath)
        this.$message.success('路径已复制到剪贴板')
      } catch {
        this.$message.error('复制失败，请手动复制：' + doc.absolutePath)
      }
    },

    openDocument(doc) {
      const uri = this.buildOpenUri(doc)
      if (!uri) {
        this.$message.warning('该文件类型暂不支持直接打开，请复制路径后手动打开')
        return
      }
      window.location.href = uri
    },

    buildOpenUri(doc) {
      const officeUri = this.buildOfficeOpenUri(doc)
      if (officeUri) return officeUri

      const apiOrigin = new URL(this.$axios.defaults.baseURL).origin
      const token = (this.$auth.strategy.token.get() || '').replace(/^Bearer\s+/i, '')
      const fileUrl = `${apiOrigin}/v1/local-docs/files/${doc.id}?token=${encodeURIComponent(token)}`
      return fileUrl
    },

    buildOfficeOpenUri(doc) {
      const officeProtocol = {
        doc: 'ms-word',
        docx: 'ms-word',
        xls: 'ms-excel',
        xlsx: 'ms-excel',
        ppt: 'ms-powerpoint',
        pptx: 'ms-powerpoint',
      }
      const proto = officeProtocol[(doc.fileType || '').toLowerCase()]
      if (!proto || !doc.absolutePath) return null
      return `${proto}:ofe|u|${this.localPathToFileUri(doc.absolutePath)}`
    },

    localPathToFileUri(path) {
      const normalized = String(path).trim().replace(/\\/g, '/')
      const encodeSegments = value => value.split('/').filter(Boolean).map(encodeURIComponent).join('/')

      if (normalized.startsWith('//')) {
        return `file://${encodeSegments(normalized.slice(2))}`
      }

      if (/^[a-zA-Z]:\//.test(normalized)) {
        const drive = normalized.slice(0, 2)
        const rest = normalized.slice(3)
        return `file:///${drive}/${encodeSegments(rest)}`
      }

      if (normalized.startsWith('/')) {
        return `file:///${encodeSegments(normalized)}`
      }

      return `file:///${encodeSegments(normalized)}`
    },

    dirDisplayName(dir) {
      if (dir.displayName) return dir.displayName
      const parts = dir.dirPath.replace(/\\/g, '/').split('/')
      return parts[parts.length - 1] || dir.dirPath
    },

    relativeDir(relativePath) {
      if (!relativePath) return ''
      const parts = relativePath.replace(/\\/g, '/').split('/')
      return parts.length > 1 ? parts.slice(0, -1).join('/') : ''
    },

    fileIcon(type) {
      const map = {
        pdf: 'el-icon-document',
        docx: 'el-icon-document',
        doc: 'el-icon-document',
        xlsx: 'el-icon-s-grid',
        xls: 'el-icon-s-grid',
        pptx: 'el-icon-picture-outline',
        ppt: 'el-icon-picture-outline',
      }
      return map[type] || 'el-icon-document'
    },

    fileColor(type) {
      const map = {
        pdf: '#e74c3c',
        docx: '#2980b9', doc: '#2980b9',
        xlsx: '#27ae60', xls: '#27ae60',
        pptx: '#e67e22', ppt: '#e67e22',
      }
      return map[type] || '#909399'
    },

    typeTagType(type) {
      const map = {
        pdf: 'danger',
        docx: 'primary', doc: 'primary',
        xlsx: 'success', xls: 'success',
        pptx: 'warning', ppt: 'warning',
      }
      return map[type] || 'info'
    },

    formatSize(bytes) {
      if (!bytes) return '-'
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    },

    formatDate(dateStr) {
      if (!dateStr) return ''
      return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    },
  },
}
</script>

<style scoped lang="scss">
.local-docs-page {
  height: 100%;
  overflow: hidden;
}

.workspace-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  height: calc(100vh - 100px);
  gap: 12px;
}

// 左侧栏
.workspace-sidebar {
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-header {
  flex-shrink: 0;
}

.dir-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dir-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--bg-secondary);
    .dir-more-btn { opacity: 1; }
  }

  &.active {
    background: rgba(102, 126, 234, 0.1);
    .dir-item-name { color: #667eea; font-weight: 500; }
    .dir-icon { color: #667eea; }
  }
}

.dir-item-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.dir-icon {
  font-size: 18px;
  color: var(--text-muted);
  flex-shrink: 0;
  &.scanning { color: #909399; animation: spin 1s linear infinite; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.dir-item-info {
  min-width: 0;
  flex: 1;
}

.dir-item-name {
  font-size: 13px;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dir-item-meta {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.scan-status {
  display: flex;
  align-items: center;
  gap: 3px;
  &.scanning { color: #909399; }
  &.error { color: #f56c6c; }
}

.doc-count { color: var(--text-muted); }

.dir-more-btn {
  opacity: 0;
  transition: opacity 0.15s;
  color: var(--text-muted);
  padding: 2px 4px;
  cursor: pointer;
  border-radius: 4px;
  &:hover { background: var(--border-color); color: var(--text-color); }
}

.sidebar-empty {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
  i { font-size: 36px; margin-bottom: 8px; display: block; }
  p { margin: 0; font-size: 13px; }
  &-hint { font-size: 12px; margin-top: 4px !important; }
}

// 主内容区
.workspace-main {
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 16px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.main-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  gap: 8px;
}

.main-empty-icon {
  font-size: 56px;
  color: #c0c4cc;
}

.main-empty-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0;
}

.main-empty-hint {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

// 目录信息行
.dir-info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.dir-info-path {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 0;
  i { flex-shrink: 0; color: #909399; }
}

.dir-info-path-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
}

.dir-info-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.dir-info-count {
  font-weight: 500;
  color: var(--text-secondary);
}

// 工具栏
.docs-toolbar {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

// 表格
.docs-table-wrapper {
  flex: 1;
  overflow-y: auto;
}

.file-type-icon {
  font-size: 16px;
}

.rel-path {
  font-size: 12px;
  color: var(--text-muted);
}

.text-muted {
  color: var(--text-muted);
}

// path input row
.path-input-row {
  display: flex;
  align-items: center;
}

// dir browser
.dir-browser {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.browser-breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
}

.crumb {
  cursor: pointer;
  color: #667eea;
  padding: 1px 3px;
  border-radius: 3px;
  &:hover { background: rgba(102,126,234,0.1); }
  &-last { color: var(--text-color); cursor: default; font-weight: 500; &:hover { background: none; } }
  &-root { font-size: 14px; }
  &-sep { color: var(--text-muted); user-select: none; }
}

.browser-list {
  max-height: 220px;
  overflow-y: auto;
  padding: 4px 0;
}

.browser-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-color);
  transition: background 0.12s;

  &:hover { background: var(--bg-secondary); }
}

.browser-entry-icon { color: #909399; font-size: 15px; flex-shrink: 0; }
.browser-entry-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.browser-entry-arrow { color: #c0c4cc; font-size: 12px; flex-shrink: 0; }

.browser-empty {
  text-align: center;
  padding: 20px;
  font-size: 12px;
  color: var(--text-muted);
}

.browser-footer {
  padding: 8px 12px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

// form hint
.form-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
  line-height: 1.5;
}

// dropdown danger
:deep(.danger-item) {
  color: #f56c6c !important;
}

@media screen and (max-width: 768px) {
  .workspace-layout {
    grid-template-columns: 1fr;
    height: auto;
  }
  .workspace-sidebar {
    height: auto;
    max-height: 240px;
  }
}
</style>
