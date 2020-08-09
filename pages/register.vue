<template>
  <div class="login-container">
    <el-form ref="registerForm" class="login-form" label-width="100px" :model="form" :rules="rules">
      <el-form-item prop="email" label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>

      <el-form-item prop="captcha" label="验证码" class="captcha-container">
        <div class="captcha">
          <img :src="code.captcha" @click="resetCaptcha">
        </div>

        <el-input v-model="form.captcha" placeholder="请输入验证码" />
      </el-form-item>

      <el-form-item prop="nickname" label="昵称">
        <el-input v-model="form.nickname" placeholder="请输入昵称" />
      </el-form-item>

      <el-form-item prop="passwd" label="密码">
        <el-input v-model="form.passwd" type="password" placeholder="请输入密码" />
      </el-form-item>

      <el-form-item prop="repasswd" label="确认密码">
        <el-input v-model="form.repasswd" type="password" placeholder="请再次输入密码" />
      </el-form-item>

      <el-form-item label=" ">
        <!-- <button @clikc.prevent></button> -->
        <el-button type="primary" @click.native.prevent="handleRegister">
          注册
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import md5 from 'md5'
export default {
  layout: 'login',
  data () {
    return {
      code: {
        captcha: '/api/captcha'
      },
      send: {
        timer: 0
      },
      form: {
        email: '864857106@qq.com',
        passwd: 'a316783812',
        repasswd: 'a316783812',
        nickname: '董爱疯',
        captcha: ''
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
        repasswd: [
          { required: true, message: '请输入密码' },
          {
            validator: (rule, value, callback) => {
              if (value !== this.form.passwd) {
                callback(new Error('两次密码不一样'))
              } else {
                callback()
              }
            }
          }
        ]
      }
    }
  },
  methods: {
    resetCaptcha () {
      this.code.captcha = '/api/captcha?time=' + Math.random()
    },
    handleRegister () {
      this.$refs.registerForm.validate(async (valid) => {
        if (valid) {
          const obj = {
            email: this.form.email,
            nickname: this.form.nickname,
            passwd: md5(this.form.passwd),
            captcha: this.form.captcha
          }
          const res = await this.$http.post('/user/register', obj)
          if (res.code === 0) {
            this.$alert('ok', '成功', {
              confirmButtonText: '去登陆',
              callback: () => {
                this.$router.push('/login')
              }
            })
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
