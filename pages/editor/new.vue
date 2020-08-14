<template>
  <div>
    <!-- 编辑器的原理 -->
    <div contenteditable="true"></div>
    <div>

      <el-button type="primary" @click="submit">提交</el-button>
      <el-row>
        <el-col :span="12">
          <textarea ref="text" class="md-editor" :value="content" @input="update" cols="30" rows="10"></textarea>
        </el-col>
        <el-col :span="12">
          <div class="md-body" v-html="compileContent"></div>

        </el-col>
      </el-row>
    </div>

  </div>
</template>

<script>
import marked from 'marked'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import 'highlight.js/styles/monokai-sublime.css'
// hljs.registerLanguage('javascript', javascript);
export default {
  data() {
    return {
      content: `# 哈哈哈
      * 爱锋
      * 扫v地方
      * 的饭局上的
      \`\`\` javascript
          highlight(code) {
            return hljs.highlightAuto(code).value
          }
      \`\`\`
      `
     
    }
  },

  computed: {
    compileContent() {
      return marked(this.content, {})
    }
  },
  mounted() {
    document.execCommand('Enter', () => {
      alert()
    })
    marked.setOptions({
      rendered: new marked.Renderer(),
      highlight(code) {
        return hljs.highlightAuto(code).value
      }
    })
    this.timer = null  // 不会加入vue 响应式

    this.bindEvent()
  },
  methods: {
    bindEvent() {
      // 监听粘贴 事件
      this.$refs.text.addEventListener('paste', async e => {
        console.log(e)
        const files = e.clipboardData.files
      })
      // 监听 拖拽文件进来 松开鼠标事件
      this.$refs.text.addEventListener('drop', async e => {
        console.log(e)
        const files = e.dataTransfer.files
        e.preventDefault()
      })
    },
    update(e) {
      clearTimeout(this.timer)
      // 延时 类似于 lodash/debounce
      this.timer = setTimeout(() => {
        this.content = e.target.value
      }, 1000)
    },
    async submit(e) {
      let res = await this.$http.post('/article/create', {content: this.content, compileContent: this.compileContent})
    }
  }
}
</script>

<style scoped lang="stylus">
  .md-editor
    width 100%
    height 100%
    outline none 
  .write-btn
    position fixed
    z-index 100
    right 30px
    top 20px
</style>>
