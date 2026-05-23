<template>
  <el-dialog
    :visible.sync="visible"
    title="创建新笔记"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="create-note-dialog">
      <p class="dialog-subtitle">选择一种方式开始您的笔记</p>
      
      <div class="option-cards">
        <!-- 空白笔记 -->
        <div class="option-card" @click="handleSelect('blank')">
          <div class="option-icon">
            <i class="el-icon-document"></i>
          </div>
          <div class="option-content">
            <h3 class="option-title">空白笔记</h3>
            <p class="option-desc">从零开始创建一篇新的笔记</p>
          </div>
        </div>

        <!-- 导入飞书文档 -->
        <div class="option-card" @click="handleSelect('feishu')">
          <div class="option-icon">
            <i class="el-icon-cloudy"></i>
          </div>
          <div class="option-content">
            <h3 class="option-title">导入飞书文档</h3>
            <p class="option-desc">从您的飞书云空间选择文档进行导入</p>
          </div>
        </div>

        <!-- 导入Markdown文件 -->
        <div class="option-card" @click="handleSelect('markdown')">
          <div class="option-icon">
            <i class="el-icon-document-add"></i>
          </div>
          <div class="option-content">
            <h3 class="option-title">导入Markdown文件</h3>
            <p class="option-desc">上传本地Markdown文件并转换为笔记</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept=".md,.markdown"
      style="display: none"
      @change="handleFileSelect"
    />
  </el-dialog>
</template>

<script>
export default {
  name: 'CreateNoteDialog',
  props: {
    value: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      visible: this.value
    }
  },
  watch: {
    value(newVal) {
      this.visible = newVal
    },
    visible(newVal) {
      this.$emit('input', newVal)
    }
  },
  methods: {
    handleSelect(type) {
      if (type === 'blank') {
        this.$emit('select-blank')
        this.handleClose()
      } else if (type === 'feishu') {
        this.$emit('select-feishu')
        this.handleClose()
      } else if (type === 'markdown') {
        // 触发文件选择
        this.$refs.fileInput.click()
      }
    },
    async handleFileSelect(event) {
      const file = event.target.files[0]
      if (!file) return

      // 验证文件类型
      if (!file.name.match(/\.(md|markdown)$/i)) {
        this.$message.error('请选择 Markdown 文件（.md 或 .markdown）')
        return
      }

      try {
        // 读取文件内容
        const content = await this.readFileAsText(file)
        const title = file.name.replace(/\.(md|markdown)$/i, '') || '导入的笔记'

        // 触发导入事件
        this.$emit('select-markdown', { title, content, file })
        this.handleClose()
      } catch (error) {
        this.$message.error('读取文件失败：' + error.message)
      } finally {
        // 清空文件输入，以便下次可以选择同一个文件
        event.target.value = ''
      }
    },
    readFileAsText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = (e) => reject(new Error('文件读取失败'))
        reader.readAsText(file, 'UTF-8')
      })
    },
    handleClose() {
      this.visible = false
      this.$emit('input', false)
    }
  }
}
</script>

<style scoped lang="scss">
.create-note-dialog {
  padding: 8px 0;
}

.dialog-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 20px;
  text-align: center;
}

.option-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--card-bg-color);

  &:hover {
    border-color: #667eea;
    background: var(--bg-secondary);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
  }

  &:active {
    transform: scale(0.98);
  }
}

.option-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--icon-bg);
  border-radius: 8px;
  color: #667eea;

  i {
    font-size: 24px;
  }
}

.option-content {
  flex: 1;
  min-width: 0;
}

.option-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 4px 0;
}

.option-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.5;
}

// 深色模式适配
.theme-dark {
  .option-card {
    &:hover {
      background: var(--bg-tertiary);
    }
  }
}

// 响应式
@media screen and (max-width: 768px) {
  .option-card {
    padding: 12px;
    gap: 12px;
  }

  .option-icon {
    width: 40px;
    height: 40px;

    i {
      font-size: 20px;
    }
  }

  .option-title {
    font-size: 15px;
  }

  .option-desc {
    font-size: 12px;
  }
}
</style>

