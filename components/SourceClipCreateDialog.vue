<template>
  <el-dialog
    title="新增素材"
    :visible.sync="visible"
    width="680px"
    :close-on-click-modal="false"
    @close="reset"
  >
    <el-tabs v-model="activeTab">
      <!-- Tab 1: URL 导入 -->
      <el-tab-pane label="URL 导入" name="url">
        <div class="tab-content">
          <el-form label-width="70px" size="small">
            <el-form-item label="网址">
              <el-input
                v-model="urlInput"
                placeholder="粘贴网页或公众号文章 URL"
                clearable
                @keyup.enter.native="fetchUrl"
              >
                <el-button
                  slot="append"
                  :loading="fetching"
                  @click="fetchUrl"
                >预览</el-button>
              </el-input>
            </el-form-item>
          </el-form>

          <div v-if="draft" class="draft-preview">
            <el-alert
              v-if="!draft.fetchSuccess"
              :title="draft.fetchFailReason || '内容无法自动提取，请手动粘贴'"
              type="warning"
              show-icon
              :closable="false"
              style="margin-bottom:12px"
            />
            <el-form label-width="70px" size="small">
              <el-form-item label="标题">
                <el-input v-model="form.title" />
              </el-form-item>
              <el-form-item label="作者">
                <el-input v-model="form.sourceAuthor" />
              </el-form-item>
              <el-form-item label="正文">
                <div v-if="form.contentFormat === 'html' && !editingContent" class="content-preview">
                  <div class="content-preview-body" v-html="form.content" />
                  <div class="content-preview-footer">
                    <el-button type="text" size="mini" @click="editingContent = true">编辑原始内容</el-button>
                  </div>
                </div>
                <template v-else>
                  <el-input
                    v-model="form.content"
                    type="textarea"
                    :rows="8"
                    placeholder="在此粘贴或编辑正文内容"
                  />
                  <el-button v-if="form.contentFormat === 'html'" type="text" size="mini" style="margin-top:4px" @click="editingContent = false">返回预览</el-button>
                </template>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </el-tab-pane>

      <!-- Tab 2: 手动录入 / AI 对话 -->
      <el-tab-pane label="手动录入 / AI 对话" name="manual">
        <div class="tab-content">
          <el-form label-width="80px" size="small">
            <el-form-item label="来源类型">
              <el-select v-model="form.sourceType" style="width:100%">
                <el-option label="AI 对话" value="AI_CHAT" />
                <el-option label="网页" value="WEBPAGE" />
                <el-option label="公众号文章" value="WECHAT_ARTICLE" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="form.sourceType === 'AI_CHAT'" label="AI 模型">
              <el-input v-model="form.aiModel" placeholder="如 claude-sonnet-4-6、gpt-4o" />
            </el-form-item>
            <el-form-item label="标题">
              <el-input v-model="form.title" placeholder="素材标题" />
            </el-form-item>
            <el-form-item label="原始内容">
              <el-input
                v-model="manualRaw"
                type="textarea"
                :rows="9"
                :placeholder="form.sourceType === 'AI_CHAT'
                  ? 'Human: ...\nAssistant: ...\n（粘贴对话记录，支持 Claude / GPT 格式）'
                  : '粘贴正文内容'"
                @paste.native="handlePaste"
              />
              <el-tag v-if="detectedFormat" size="mini" type="info" style="margin-top:6px">
                已识别：{{ formatLabel }}
              </el-tag>
            </el-form-item>
            <el-form-item v-if="form.sourceType === 'AI_CHAT'">
              <el-button size="small" :loading="formatting" @click="formatChat">格式化预览</el-button>
            </el-form-item>
            <el-form-item v-if="form.content && form.sourceType === 'AI_CHAT'" label="预览">
              <div class="chat-preview" v-html="form.content" />
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>

    <span slot="footer">
      <el-button size="small" @click="visible = false">取消</el-button>
      <el-button type="primary" size="small" :loading="saving" @click="save">保存</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'SourceClipCreateDialog',
  data() {
    return {
      visible: false,
      activeTab: 'url',
      urlInput: '',
      fetching: false,
      formatting: false,
      saving: false,
      draft: null,
      manualRaw: '',
      editingContent: false,
      detectedFormat: null,
      form: {
        sourceType: 'AI_CHAT',
        sourceUrl: '',
        sourceTitle: '',
        sourceAuthor: '',
        aiModel: '',
        title: '',
        content: '',
        contentFormat: 'html',
        tagIds: [],
      },
    }
  },
  computed: {
    formatLabel() {
      const map = {
        html: 'HTML（剪切板富文本）',
        dialog: '多轮对话',
        markdown: 'Markdown 单条回复',
        text: '纯文本',
      }
      return map[this.detectedFormat] || this.detectedFormat
    },
  },
  methods: {
    handlePaste(event) {
      const html = event.clipboardData && event.clipboardData.getData('text/html')
      if (html && html.trim().length > 200) {
        event.preventDefault()
        this.manualRaw = event.clipboardData.getData('text/plain') || ''
        this.form.content = html
        this.form.contentFormat = 'html'
        this.detectedFormat = 'html'
      }
      // else: 正常粘贴，用户后续点"格式化预览"走后端识别
    },
    open() {
      this.visible = true
    },
    reset() {
      this.activeTab = 'url'
      this.urlInput = ''
      this.draft = null
      this.manualRaw = ''
      this.editingContent = false
      this.detectedFormat = null
      this.form = {
        sourceType: 'AI_CHAT',
        sourceUrl: '',
        sourceTitle: '',
        sourceAuthor: '',
        aiModel: '',
        title: '',
        content: '',
        contentFormat: 'html',
        tagIds: [],
      }
    },
    async fetchUrl() {
      if (!this.urlInput.trim()) return
      this.fetching = true
      this.draft = null
      try {
        const draft = await this.$clipService.importFromUrl(this.urlInput.trim())
        this.draft = draft
        this.form.sourceType = draft.sourceType
        this.form.sourceUrl = draft.sourceUrl || this.urlInput.trim()
        this.form.sourceTitle = draft.sourceTitle || ''
        this.form.sourceAuthor = draft.sourceAuthor || ''
        this.form.title = draft.suggestedTitle || draft.sourceTitle || ''
        this.form.content = draft.content || ''
        this.form.contentFormat = draft.contentFormat || 'html'
      } catch (e) {
        this.$message.error('抓取失败，请手动粘贴内容')
        this.draft = { fetchSuccess: false, fetchFailReason: e?.response?.data?.message || '网络错误' }
      } finally {
        this.fetching = false
      }
    },
    async formatChat() {
      if (!this.manualRaw.trim()) return
      this.formatting = true
      try {
        const draft = await this.$clipService.importAiChat(
          this.manualRaw.trim(),
          this.form.aiModel || undefined
        )
        this.form.content = draft.content
        this.form.contentFormat = draft.contentFormat
        this.detectedFormat = draft.inputFormat || null
        if (!this.form.title && draft.suggestedTitle) {
          this.form.title = draft.suggestedTitle
        }
      } catch (e) {
        this.$message.error('格式化失败')
      } finally {
        this.formatting = false
      }
    },
    async save() {
      // URL Tab：未预览过则先自动抓取
      if (this.activeTab === 'url' && !this.draft) {
        if (!this.urlInput.trim()) {
          this.$message.warning('请输入网址')
          return
        }
        await this.fetchUrl()
        // 抓取失败时 fetchUrl 内已有错误提示，title 仍为空则后续校验会拦截
      }
      // 对于手动录入且非 AI_CHAT，直接用 manualRaw 作为 content
      if (this.activeTab === 'manual' && this.form.sourceType !== 'AI_CHAT' && this.manualRaw.trim()) {
        this.form.content = this.manualRaw.trim()
        this.form.contentFormat = 'text'
      }
      if (!this.form.title.trim()) {
        this.$message.warning('请填写标题')
        return
      }
      if (!this.form.content.trim()) {
        this.$message.warning('请填写或粘贴内容')
        return
      }
      this.saving = true
      try {
        const clip = await this.$clipService.createClip(this.form)
        this.$message.success('素材已保存')
        this.visible = false
        this.$emit('created', clip)
      } catch (e) {
        this.$message.error('保存失败')
      } finally {
        this.saving = false
      }
    },
  },
}
</script>

<style scoped>
.tab-content { padding: 4px 0 8px; }
.draft-preview { margin-top: 4px; }
.content-preview {
  border: 1px solid var(--border-color, #e4e7ed);
  border-radius: 4px;
  overflow: hidden;
}
.content-preview-body {
  padding: 10px 12px;
  max-height: 280px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
}
.content-preview-body img { max-width: 100%; height: auto; }
.content-preview-footer {
  padding: 4px 8px;
  border-top: 1px solid var(--border-color, #e4e7ed);
  background: #fafafa;
}
.chat-preview {
  border: 1px solid var(--border-color, #e4e7ed);
  border-radius: 4px;
  padding: 10px 12px;
  max-height: 200px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.6;
}
</style>
