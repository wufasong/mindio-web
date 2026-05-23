<template>
  <div class="blank-layout">
    <nuxt />
  </div>
</template>

<script>
export default {
  name: 'BlankLayout'
}
</script>

<style scoped lang="scss">
.blank-layout {
  min-height: 100vh;
  background: var(--bg-color);
}
</style>
