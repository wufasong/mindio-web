export const state = () => ({
  headers: true,
  footers: true,
  cartnumber: 0,
  logoUrl: '/image/logo.png',
  titleCon: '',
  unreadNum: 0,
  service_num: 0
})

export const mutations = {
  isHeader (state, data) {
    state.headers = data;
  },
  isFooter (state, data) {
    state.footers = data;
  },
  cartNum (state, data) {
    state.cartnumber = data;
  },
  serviceNum (state, data) {
    state.service_num = data;
  },
  logo (state, data) {
    state.logoUrl = data;
  },
  titles (state, data) {
    state.titleCon = data;
  },
  unreadKefu (state, data) {
    state.unreadNum = data;
  }
}

export const actions = {
  // nuxtServerInit can be used to initialize store with server-side data
  // Currently not needed for this application
}
