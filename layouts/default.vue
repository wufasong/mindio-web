<template>
  <div class="app-layout">
    <!-- 顶部导航栏 -->
    <el-header class="app-header">
      <div class="header-content">
        <div class="logo">
          <i class="el-icon-notebook-2"></i>
          <span>Notecast</span>
        </div>
        <el-menu
          mode="horizontal"
          :default-active="activeMenu"
          class="header-menu"
          @select="handleMenuSelect"
        >
          <!-- 登录后主界面：工作台入口 -->
          <el-menu-item index="/notes">
            <i class="el-icon-document"></i>
            <span>{{ $t('menu.myNotes') }}</span>
          </el-menu-item>
          <el-menu-item index="/tags">
            <i class="el-icon-collection-tag"></i>
            <span>{{ $t('menu.tags') }}</span>
          </el-menu-item>
          <el-menu-item index="/public">
            <i class="el-icon-view"></i>
            <span>{{ $t('menu.publicNotes') }}</span>
          </el-menu-item>
          <!-- 登录前主界面：网站首页入口 -->
          <el-menu-item index="/">
            <i class="el-icon-s-home"></i>
            <span>{{ $t('menu.homepage') }}</span>
          </el-menu-item>
        </el-menu>
        <div class="header-user">
          <button class="lang-toggle-btn" @click="toggleLang" :title="$t('lang.toggle')">
            {{ $t('lang.toggle') }}
          </button>
          <el-dropdown @command="handleUserCommand">
            <span class="user-info" @click="handleAvatarClick">
              <i class="el-icon-user"></i>
              {{ userName }}
              <i class="el-icon-arrow-down"></i>
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="profile">
                <i class="el-icon-user"></i> {{ $t('user.profile') }}
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <i class="el-icon-switch-button"></i> {{ $t('user.logout') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <!-- 主内容区域 -->
    <el-main class="app-main">
      <nuxt />
    </el-main>

    <!-- 底部 -->
    <el-footer class="app-footer">
      <div class="footer-content">
        © 2024 Notecast - Powered by Nuxt.js & Spring Boot
      </div>
    </el-footer>
  </div>
</template>

<script>
export default {
  name: 'DefaultLayout',
  computed: {
    userName() {
      return this.$auth.user?.username || 'User'
    },
    activeMenu() {
      return this.$route.path
    }
  },
  methods: {
    toggleLang() {
      const next = this.$i18n.locale === 'zh-CN' ? 'en' : 'zh-CN'
      this.$i18n.setLocale(next)
    },
    handleAvatarClick() {
      this.$router.push('/notes')
    },
    handleMenuSelect(index) {
      this.$router.push(index)
    },
    handleUserCommand(command) {
      if (command === 'logout') {
        this.$confirm(this.$t('confirm.logout'), this.$t('confirm.logoutTitle'), {
          confirmButtonText: this.$t('confirm.confirmBtn'),
          cancelButtonText: this.$t('confirm.cancelBtn'),
          type: 'warning'
        }).then(() => {
          this.$auth.logout()
          this.$message.success(this.$t('messages.loggedOut'))
        }).catch(() => {})
      } else if (command === 'profile') {
        this.$message.info(this.$t('messages.profileWip'))
      }
    }
  }
}
</script>

<style scoped lang="scss">
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: var(--header-bg);
  box-shadow: 0 2px 8px var(--shadow-color);
  padding: 0;
  height: 60px;
  line-height: 60px;

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 0 20px;
  }

  .logo {
    font-size: 20px;
    font-weight: bold;
    color: #409eff;
    display: flex;
    align-items: center;
    gap: 8px;

    i {
      font-size: 24px;
    }
  }

  .header-menu {
    flex: 1;
    margin: 0 40px;
    border-bottom: none;
  }

  .header-user {
    display: flex;
    align-items: center;
    gap: 12px;

    .user-info {
      cursor: pointer;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 6px;

      &:hover {
        color: #409eff;
      }
    }
  }

  .lang-toggle-btn {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    border: 1px solid var(--border-color);
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s;

    &:hover {
      background: rgba(64, 158, 255, 0.08);
      color: #409eff;
    }
  }
}

.app-main {
  flex: 1;
  background: var(--bg-secondary);
  padding: 20px;
}

.app-footer {
  background: var(--header-bg);
  border-top: 1px solid var(--border-color);
  text-align: center;
  color: var(--text-muted);
  height: 60px;
  line-height: 60px;

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
  }
}

@media screen and (max-width: 768px) {
  .app-header {
    .header-content {
      padding: 0 10px;
    }

    .logo span {
      display: none;
    }

    .header-menu {
      margin: 0 20px;
    }
  }

  .app-main {
    padding: 10px;
  }
}
</style>
