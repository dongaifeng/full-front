<template>
  <div class="login-container">
    <el-form class="login-form" label-width="100px" :model="form" :rules="rules" ref="loginForm">
      <el-form-item prop="email" label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱"></el-input>
      </el-form-item>

        <el-form-item prop="captcha" label="验证码" class="captcha-container">
          <div class="captcha">
            <img :src="code.captcha" @click="resetCaptcha" />
          </div>

          <el-input v-model="form.captcha" placeholder="请输入验证码"></el-input>
        </el-form-item>

        <el-form-item prop="emailcode" label="邮箱验证码" class="captcha-container">
          <div class="captcha">
            <el-button type="primary" @click="sendEmailCode" :disabled="send.timer > 0">{{sendText}}</el-button>
          </div>

          <el-input v-model="form.emailcode" placeholder="请输入验证码"></el-input>
        </el-form-item>

      <el-form-item prop="passwd" label="密码">
        <el-input type="password" v-model="form.passwd" placeholder="请输入密码"></el-input>
      </el-form-item>


      <el-form-item label=" ">
        <!-- <button @clikc.prevent></button> -->
        <el-button type="primary" @click.native.prevent="handleLogin">登录</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import md5 from 'md5'
export default {
  layout: 'login',
  data() {
    return {
      code: {
        captcha: '/api/captcha'
      },
      send: {
        timer: 0
      },
      timer: null,
      form: {
        email: '316783812@qq.com',
        passwd: 'a316783812',
        captcha: '',
        emailcode: ''
      },
      rules: {
        email: [
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入正确的邮箱格式' }
        ],
        captcha: [{ required: true, message: '请输入验证码' }],
        emailcode: [{ required: true, message: '请输入邮箱验证码' }],

        passwd: [
          {
            required: true,
            pattern: /^[\w_-]{6,12}$/g,
            message: '请输入6~12位密码'
          }
        ],
   
      }
    }
  },
  computed: {
    sendText(){
      return this.send.timer <= 0 ? '发送' : this.send.timer
    }
  },
  methods: {
    sendEmailCode() {
      // 点击时候从10开始倒计时 当timer = 0 清除定时器 
      this.send.timer = 10
      this.timer = setInterval(() => {
        this.send.timer -= 1
        if(this.send.timer === 0) {
          clearInterval(this.timer)
          this.timer = null
        }
      }, 1000)

      this.$http.get('/sendcode?email=' + this.form.email)
    },
    resetCaptcha() {
      this.code.captcha = '/api/captcha?time=' + Math.random()
    },
    handleLogin() {
      this.$refs.loginForm.validate(async valid => {
        if(valid) {
          let obj = {
            email: this.form.email,
            passwd: md5(this.form.passwd),
            captcha: this.form.captcha,
            emailcode: this.form.emailcode
          }
          const res = await this.$http.post('/user/login', obj)
          if(res.code === 0) {
            this.$message.success('登录成功')
            localStorage.setItem('token', res.data.token)
            setTimeout(() => {
              this.$router.push('/uc')
            }, 1000)
          } else {
            this.$message.error(res.message)
          }
        } else {
          console.log(valid)
        }
      })
    }
  }
}
</script>

<style>
</style>
