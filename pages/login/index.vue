<template>
  <div>
    <el-form>
      <el-form-item>
        <el-input />
        <img :src="captchaUrl" alt="" @click="update">
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  layout: 'login',
  data () {
    return {
      captchaUrl: '/api/captcha'
    }
  },
  methods: {
    update () {
      this.captchaUrl = '/api/captcha?time=' + Math.random()
    }
  }
}
</script>

<style>

</style>
