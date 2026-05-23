<template>
  <el-dialog
    title="发布到 LinkedIn"
    :visible.sync="visible"
    width="560px"
    :close-on-click-modal="false"
    @close="onClose"
  >
    <el-form label-position="top">
      <el-form-item label="封面图片">
        <div class="li-cover-wrap">
          <div class="li-cover-upload" @click="triggerFileInput">
            <img v-if="coverImageUrl" :src="coverImageUrl" class="li-cover-preview" />
            <div v-else class="li-cover-placeholder">
              <i class="el-icon-picture-outline" />
              <span>点击上传封面图</span>
            </div>
            <div v-if="coverImageUrl" class="li-cover-replace">点击更换</div>
          </div>
          <a
            v-if="coverImageUrl"
            class="li-cover-download"
            title="下载图片"
            @click.stop="downloadCover"
          >
            <i class="el-icon-download" /> 下载
          </a>
        </div>
        <div class="hint">发布时在 LinkedIn 中手动添加此图片</div>
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          style="display:none"
          @change="onFileSelected"
        />
      </el-form-item>

      <el-form-item label="正文">
        <el-input
          v-model="content"
          type="textarea"
          :rows="10"
          :maxlength="3000"
          show-word-limit
          placeholder="笔记正文（可编辑）"
        />
      </el-form-item>
      <el-form-item label="标签">
        <el-input
          v-model="hashtags"
          placeholder="如：#AI #SaaS #Dev"
          :disabled="hashtagsLoading"
        >
          <template v-if="hashtagsLoading" slot="suffix">
            <i class="el-icon-loading" />
          </template>
        </el-input>
        <div class="hint">AI 自动生成，可手动编辑</div>
      </el-form-item>
    </el-form>

    <span slot="footer">
      <el-button @click="onClose">取消</el-button>
      <el-button type="primary" @click="onConfirm">复制并打开 LinkedIn</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'LinkedinShareDialog',

  props: {
    noteId: { type: Number, default: null }
  },

  data() {
    return {
      visible: false,
      coverImageUrl: '',
      coverImageFile: null,
      content: '',
      hashtags: '',
      hashtagsLoading: false
    }
  },

  methods: {
    open(noteTitle, noteBlocks) {
      this.coverImageUrl = this._extractCoverImage(noteBlocks)
      this.coverImageFile = null
      this.content = this._blocksToText(noteTitle, noteBlocks)
      this.hashtags = ''
      this.visible = true
      this._loadHashtags()
    },

    onClose() {
      this.visible = false
    },

    triggerFileInput() {
      this.$refs.fileInput.click()
    },

    onFileSelected(e) {
      const file = e.target.files[0]
      if (!file) return
      if (!file.type.startsWith('image/')) {
        this.$message.error('请选择图片文件')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        this.$message.error('图片不能超过 10MB')
        return
      }
      this.coverImageFile = file
      const reader = new FileReader()
      reader.onload = ev => { this.coverImageUrl = ev.target.result }
      reader.readAsDataURL(file)
      e.target.value = ''
    },

    async onConfirm() {
      const tags = this.hashtags.trim()
      const full = tags ? `${this.content.trim()}\n\n${tags}` : this.content.trim()
      try {
        await navigator.clipboard.writeText(full)
      } catch (e) {
        this.$message.warning('剪贴板写入失败，请手动复制')
      }
      window.open('https://www.linkedin.com/feed/', '_blank')
      this.$message.success('已复制到剪贴板，请在 LinkedIn 中粘贴发布')
      this.visible = false
    },

    async _loadHashtags() {
      if (!this.noteId) return
      this.hashtagsLoading = true
      try {
        const res = await this.$aiService.generateLinkedinHashtags(this.noteId)
        const tags = (res.hashtags || []).map(t => `#${t}`).join(' ')
        this.hashtags = tags
      } catch (e) {
        this.hashtags = '#AI #Tech'
      } finally {
        this.hashtagsLoading = false
      }
    },

    async downloadCover() {
      try {
        const res = await fetch(this.coverImageUrl)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'linkedin-cover'
        a.click()
        URL.revokeObjectURL(url)
      } catch (e) {
        this.$message.error('下载失败，请右键图片另存为')
      }
    },

    _extractCoverImage(blocks) {
      if (!Array.isArray(blocks)) return ''
      for (const block of blocks) {
        if (block.type === 'image') {
          return (block.data && block.data.file && block.data.file.url) || ''
        }
      }
      return ''
    },

    _htmlToText(html) {
      const el = document.createElement('div')
      el.innerHTML = (html || '').replace(/<br\s*\/?>/gi, '\n')
      return el.textContent || ''
    },

    _blocksToText(title, blocks) {
      const lines = []
      if (title && title.trim()) lines.push(title.trim())
      if (Array.isArray(blocks)) {
        for (const block of blocks) {
          const d = block.data || {}
          switch (block.type) {
            case 'paragraph':
            case 'header': {
              const text = this._htmlToText(d.text).trim()
              if (text) lines.push(text)
              break
            }
            case 'quote': {
              const text = this._htmlToText(d.text).trim()
              if (text) lines.push(`"${text}"`)
              break
            }
            case 'list': {
              const items = Array.isArray(d.items) ? d.items : []
              for (const item of items) {
                const raw = typeof item === 'object' ? (item.content || '') : String(item)
                const text = this._htmlToText(raw).trim()
                if (text) lines.push(`• ${text}`)
              }
              break
            }
          }
        }
      }
      const joined = lines.join('\n\n')
      return joined.length > 2800 ? joined.substring(0, 2800) + '…' : joined
    }
  }
}
</script>

<style scoped>
.hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
.li-cover-wrap {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.li-cover-upload {
  position: relative;
  width: 160px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  background: #fafafa;
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
}
.li-cover-upload:hover {
  border-color: #409eff;
}
.li-cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.li-cover-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 12px;
  gap: 6px;
}
.li-cover-placeholder i {
  font-size: 24px;
}
.li-cover-replace {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 12px;
  text-align: center;
  padding: 3px 0;
  opacity: 0;
  transition: opacity 0.2s;
}
.li-cover-upload:hover .li-cover-replace {
  opacity: 1;
}
.li-cover-download {
  font-size: 12px;
  color: #606266;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}
.li-cover-download:hover {
  color: #409eff;
}
</style>
