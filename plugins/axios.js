import Vue from 'vue'
import axios from 'axios'
import { MessageBox } from 'element-ui';

// nuxt 插件机制 可以导出一个函数，这个函数第一个参数是context，它上边包含app，store，route等很多东西
// 第二个参数 是 inject 调用这个函数 可以将 方法同时注入到 context，Vue，vuex
export default ({ app, redirect }, inject) => {

  const service = axios.create({
    timeout: 50000,
    baseURL: '/api'
  })

  service.interceptors.request.use(
    config => {
      const token = localStorage.getItem('token');
      console.log(token)
      if (token) {
        config.headers.common['Authorization'] = 'Bearer ' + token  // jwt规定 token前加上 'Bearer '
      }

      return config
    }
  )


  service.interceptors.response.use(
    response => {
      if (response.data.code === -666) {
        MessageBox.confirm('登录已经过期', '过期', {
          confirmButtonText: '登录',
          showCancelButton: false,
          type: 'warning'
        }).then(() => {
          localStorage.removeItem('token')
          redirect({ path: 'login' })
        })
      }
      return response.data
    }
  )

  
  Vue.prototype.$http = service

}

// export const http = service