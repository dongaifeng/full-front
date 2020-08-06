<template>
  <div class="container">
    <div>
      <h1 class="title" draggable="true">
        用户中心
      </h1>
     <el-progress
      :stroke-width="20"
      :text-inside="true"
      :percentage="num"
      />
     <div id="drag" ref="drag">
       <input @change="handleFileChange" type="file">
     </div>
     <div>
       <el-button @click="uploadFile">上传</el-button>
     </div>
    </div>
  </div>
</template>

<script>
export default {
 
  data() {
    return {
      form: null,
      file: null,
      num: 0
    }
  },
   async mounted() {
    const res = this.$http.get('/user/info')
    console.log(res)
    this.listenEvent()
  },
  methods: {
    listenEvent() {
      const drag = this.$refs.drag

// 监听drag事件  实现 拖拽上传 
      drag.addEventListener('dragover', e => {
        drag.style.borderColor = 'red'
        e.preventDefault()
      })

      drag.addEventListener('dragleave', e => {
        drag.style.borderColor = '#ccc'
        e.preventDefault()
      })

      drag.addEventListener('drop', e => {
        drag.style.borderColor = '#ccc'
        console.log(e)
        const filelist = e.dataTransfer.files
        this.file = filelist[0]
        e.preventDefault()
      })
    }, 

    handleFileChange(e) {
      const [file] = e.target.files
      if(!file) return
      this.file = file
    },

   async uploadFile() {
      const form = new FormData()
      form.append('name', 'file')
      form.append('file', this.file)

      console.log('form----->', form)
      const res = await this.$http.post('/uploadFile', form, {
        onUploadProgress: progress => {  // 实现进度条
          console.log(progress)
          this.num =Number( ((progress.loaded / progress.total) *100).toFixed(2))
        }
      })

      console.log(res, '<====res')
    }
  }
}
</script>
<style lang="stylus">
  #drag
    height 200px
    width 200px
    border 2px dashed #cccccc
    text-align center
   
</style>

<style>
.container {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family:
    'Quicksand',
    'Source Sans Pro',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
