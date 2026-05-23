<template>
  <div class="news-page">
    <div class="workspace-layout">
      <!-- ========== 左侧栏 ========== -->
      <aside class="workspace-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">资讯来源</span>
          <el-button
            type="text"
            size="mini"
            icon="el-icon-refresh"
            :loading="refreshing"
            @click="doRefreshAll"
          >刷新全部</el-button>
        </div>

        <div v-loading="loadingSources" class="source-list">
          <div v-if="currentSources.length" class="source-group">
            <div v-for="src in currentSources" :key="src.sourceKey" class="source-item">
              <div class="source-item-info">
                <span class="source-item-name">{{ currentCategory === 'zh' ? src.nameZh : src.nameEn }}</span>
                <span class="source-status" :class="statusClass(src.lastFetchStatus)">
                  {{ statusText(src.lastFetchStatus) }}
                </span>
              </div>
              <el-switch
                :value="src.enabled"
                size="mini"
                @change="toggleSource(src)"
              />
            </div>
          </div>
        </div>
      </aside>

      <!-- ========== 主内容区 ========== -->
      <main class="workspace-main">
        <!-- 工具栏 -->
        <div class="news-toolbar">
          <div class="toolbar-left">
            <i class="el-icon-news toolbar-icon"></i>
            <span class="toolbar-title">资讯</span>
          </div>
          <div class="toolbar-right">
            <el-date-picker
              v-model="selectedDate"
              type="date"
              placeholder="选择日期"
              size="small"
              value-format="yyyy-MM-dd"
              :clearable="false"
              style="width:148px"
              @change="loadNews"
            />
            <el-button
              size="small"
              icon="el-icon-refresh"
              :loading="refreshing"
              @click="doRefreshAll"
            >立即刷新</el-button>
          </div>
        </div>

        <!-- 资讯卡片网格 -->
        <div v-loading="loadingNews" class="news-grid">
          <template v-if="visibleFeeds.length">
            <div v-for="feed in visibleFeeds" :key="feed.source.sourceKey" class="news-card">
              <div class="news-card-header">
                <span class="news-card-date">{{ formatDate(selectedDate) }}</span>
                <span class="news-card-title">{{ currentCategory === 'zh' ? feed.source.nameZh : feed.source.nameEn }} {{ sourceEmoji(feed.source.sourceKey) }}</span>
              </div>
              <div class="news-card-body">
                <div v-if="feed.items.length === 0" class="news-empty">
                  <span>暂无数据，点击「刷新全部」获取</span>
                </div>
                <ol v-else class="news-list">
                  <li v-for="item in feed.items" :key="item.id" class="news-item">
                    <a
                      v-if="item.url"
                      :href="item.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="news-link"
                    >{{ item.title }}</a>
                    <span v-else class="news-text">{{ item.title }}</span>
                  </li>
                </ol>
              </div>
              <div class="news-card-footer">
                <span class="source-status" :class="statusClass(feed.source.lastFetchStatus)">
                  {{ feed.source.lastFetchStatus === 'SUCCESS' && feed.source.lastFetchedAt
                    ? '更新于 ' + formatTime(feed.source.lastFetchedAt)
                    : statusText(feed.source.lastFetchStatus) }}
                </span>
              </div>
            </div>
          </template>

          <div v-else-if="!loadingNews" class="main-empty">
            <i class="el-icon-news main-empty-icon"></i>
            <p class="main-empty-title">暂无资讯</p>
            <p class="main-empty-hint">点击「立即刷新」获取当天资讯，或启用左侧资讯来源</p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
const SOURCE_EMOJI = {
  weibo_hot: '🔥',
  baidu_hot: '🔍',
  zhihu_hot: '💡',
  ai_news: '🤖',
  hacker_news: '💻',
  google_news: '🌐',
  bing_news: '🔎',
  tech_news: '⚡',
}

export default {
  name: 'NewsPage',
  layout: 'workspace',
  middleware: 'auth',
  data() {
    const today = new Date()
    const pad = n => String(n).padStart(2, '0')
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
    return {
      selectedDate: todayStr,
      sources: [],
      feeds: [],
      loadingSources: false,
      loadingNews: false,
      refreshing: false,
    }
  },
  computed: {
    currentCategory() {
      return this.$i18n.locale === 'zh-CN' ? 'zh' : 'en'
    },
    currentSources() {
      return this.sources.filter(s => s.category === this.currentCategory)
    },
    visibleFeeds() {
      const enabledKeys = new Set(this.sources.filter(s => s.enabled).map(s => s.sourceKey))
      return this.feeds.filter(f =>
        enabledKeys.has(f.source.sourceKey) && f.source.category === this.currentCategory
      )
    },
  },
  async created() {
    await Promise.all([this.loadSources(), this.loadNews()])
  },
  methods: {
    async loadSources() {
      this.loadingSources = true
      try {
        this.sources = await this.$newsService.getSources()
      } catch {
        this.$message.error('加载资讯来源失败')
      } finally {
        this.loadingSources = false
      }
    },

    async loadNews() {
      this.loadingNews = true
      try {
        const data = await this.$newsService.getNews(this.selectedDate)
        this.feeds = data
        // sync source status from feeds
        if (this.sources.length && data.length) {
          const statusMap = {}
          data.forEach(f => { statusMap[f.source.sourceKey] = f.source })
          this.sources = this.sources.map(s => statusMap[s.sourceKey] ? { ...s, ...statusMap[s.sourceKey] } : s)
        }
      } catch {
        this.$message.error('加载资讯失败')
      } finally {
        this.loadingNews = false
      }
    },

    async toggleSource(src) {
      try {
        const updated = await this.$newsService.toggleSource(src.sourceKey)
        const idx = this.sources.findIndex(s => s.sourceKey === src.sourceKey)
        if (idx >= 0) this.$set(this.sources, idx, updated)
      } catch {
        this.$message.error('切换失败')
      }
    },

    async doRefreshAll() {
      this.refreshing = true
      try {
        await this.$newsService.refreshAll()
        this.$message.success('已开始刷新，稍后自动更新...')
        setTimeout(() => {
          this.loadSources()
          this.loadNews()
        }, 5000)
      } catch {
        this.$message.error('刷新失败')
      } finally {
        this.refreshing = false
      }
    },

    sourceEmoji(key) {
      return SOURCE_EMOJI[key] || ''
    },

    statusClass(status) {
      if (!status) return 'status-none'
      if (status === 'SUCCESS') return 'status-success'
      if (status === 'FAILED') return 'status-failed'
      if (status === 'FETCHING') return 'status-fetching'
      return 'status-none'
    },

    statusText(status) {
      if (!status) return '未获取'
      if (status === 'SUCCESS') return '正常'
      if (status === 'FAILED') return '失败'
      if (status === 'FETCHING') return '获取中...'
      return status
    },

    formatDate(dateStr) {
      if (!dateStr) return ''
      const [y, m, d] = dateStr.split('-')
      return `${y}/${m}/${d}`
    },

    formatTime(isoStr) {
      if (!isoStr) return ''
      const d = new Date(isoStr)
      const pad = n => String(n).padStart(2, '0')
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`
    },
  },
}
</script>

<style scoped lang="scss">
.news-page {
  height: 100%;
  overflow: hidden;
}

.workspace-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  height: calc(100vh - 100px);
  gap: 12px;
}

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
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.sidebar-title { font-size: 13px; font-weight: 600; color: var(--text-color); }

.source-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }

.source-group { display: flex; flex-direction: column; gap: 2px; }
.source-group-label {
  font-size: 11px; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.05em;
  padding: 4px 6px 4px;
}

.source-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 8px; border-radius: 8px; transition: background 0.15s;
  &:hover { background: var(--bg-secondary); }
}
.source-item-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; margin-right: 8px; }
.source-item-name { font-size: 13px; color: var(--text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.source-status {
  font-size: 10px;
  &.status-success { color: #67c23a; }
  &.status-failed { color: #f56c6c; }
  &.status-fetching { color: #e6a23c; }
  &.status-none { color: var(--text-muted); }
}

.workspace-main {
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 16px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.news-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);
}
.toolbar-left { display: flex; align-items: center; gap: 8px; }
.toolbar-icon { font-size: 18px; color: #667eea; }
.toolbar-title { font-size: 16px; font-weight: 600; color: var(--text-color); }
.toolbar-right { display: flex; align-items: center; gap: 8px; }

.news-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
  align-content: flex-start;
}

.news-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
}

.news-card-header {
  padding: 10px 14px 8px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: baseline;
  gap: 8px;
  background: var(--card-bg-color);
}
.news-card-date { font-size: 11px; color: var(--text-muted); flex-shrink: 0; }
.news-card-title { font-size: 13px; font-weight: 600; color: var(--text-color); }

.news-card-body { padding: 10px 14px; flex: 1; }

.news-empty {
  text-align: center; padding: 20px 0; color: var(--text-muted); font-size: 12px;
}

.news-list {
  margin: 0; padding: 0; list-style: none;
  counter-reset: news-counter;
}
.news-item {
  counter-increment: news-counter;
  display: flex; align-items: flex-start; gap: 6px;
  padding: 4px 0; font-size: 13px; line-height: 1.5;
  border-bottom: 1px solid var(--border-color);
  &:last-child { border-bottom: none; }
  &::before {
    content: counter(news-counter);
    flex-shrink: 0;
    min-width: 18px;
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 600;
    padding-top: 1px;
  }
}

.news-link {
  color: var(--text-color);
  text-decoration: none;
  line-height: 1.5;
  &:hover { color: #667eea; text-decoration: underline; }
}
.news-text { color: var(--text-color); line-height: 1.5; }

.news-card-footer {
  padding: 6px 14px;
  border-top: 1px solid var(--border-color);
  background: var(--card-bg-color);
}

.main-empty {
  grid-column: 1 / -1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 0; color: var(--text-muted); gap: 8px;
}
.main-empty-icon { font-size: 56px; color: #c0c4cc; }
.main-empty-title { font-size: 15px; font-weight: 500; color: var(--text-secondary); margin: 0; }
.main-empty-hint { font-size: 13px; color: var(--text-muted); margin: 0; }
</style>
