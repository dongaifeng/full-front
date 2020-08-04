import Vue from 'vue'
import axios from 'axios'


const service = axios.create({
  timeout: 5000,
  baseURL: '/api'
})

service.interceptors.response.use(
   response => {
    return response.data
  }
)





Vue.prototype.$http = service
export const http = service