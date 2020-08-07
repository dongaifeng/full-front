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

      <p>计算hash进度</p>
     <el-progress
      :stroke-width="20"
      :text-inside="true"
      :percentage="hashProgress"
      />
    </div>
  </div>
</template>

<script>
const CHUNK_SIZE = 0.5 * 1024 * 1024
export default {
 
  data() {
    return {
      form: null,
      file: null,
      num: 0,
      hashProgress: 0,
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
     // 判断图片格式
    //  const ret = await this.isImg(this.file)
    //  console.log(ret)

    //  if( !ret ) {
    //    this.$alert('不是图片格式')
    //    return
    //  }

    // web Worker

    const chunks = this.createChunk(this.file)
    console.log('chunks------->', chunks)

    const hash = await this.hashWorker(chunks);

     
    return false
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
    },

    async hashWorker(chunks) {
      return new Promise((resolve, reject) => {

        const worker = new Worker('/hashWorker.js')
        worker.postMessage({
          chunks
        })

        worker.onmessage = (e) => {
          const { progress, hash } = e.data

          console.log( progress, hash , '<---------worker.onmessage')

          this.hashProgress = Number(progress.toFixed(2))

          if(hash) {
            resolve(hash)
          }

          // worker.terminate()
        }

    })

    },

    // 把文件 切片 放到数组里
    createChunk(file, size = CHUNK_SIZE) {
      const chunks = []
      let cur = 0

      while(cur < file.size) {
        chunks.push({
          index: cur,
          file: file.slice(cur, cur + size)
        })

        
        cur += size
      }

      return chunks
    },
    // 判断是不是图片格式
    async isImg(file) {
      return await this.isgif(file) || await this.ispng(file) || await this.isjpg(file)
    },
    async isgif(file) {
      // '47 49 46 38 37 61'  "47 49 46 38 39 61"
      //  G  I  F  8  9(7) a
      let str = file.slice(0, 6)
      const res = await this.blobToString(str)
      const isgif = (res === '47 49 46 38 37 61') || (res === '47 49 46 38 39 61')
      return isgif
    },
    async ispng(file) {
      // '89 50 4E 47 0D 0A 1A 0A"
      //  G  I  F  8  9(7) a
      let str = file.slice(0, 8)
      const res = await this.blobToString(str)
      const ispng = (res === '89 50 4E 47 0D 0A 1A 0A') 
      return ispng
    },
    async isjpg(file) {
      // 头FF D8   尾FF D9
      //  G  I  F  8  9(7) a
      let str1 = file.slice(0, 2)
      let str2 = file.slice(-2, file.size)
      const res1 = await this.blobToString(str1)
      const res2 = await this.blobToString(str2)
      const isjpg = (res1 === 'FF D8') || (res2 === 'FF D9')
      return isjpg
    },
    blobToString(blob) {
      return new Promise((rsolve, reject) => {
        const render = new FileReader()
        render.readAsBinaryString(blob)
        render.onload = function(e){
          const ret = e.target.result.split('')
                       .map(v => v.charCodeAt())
                       .map(v => v.toString(16))
                       .join( ' ')
          console.log("--->",ret)
          
          rsolve(ret)    
        }
      })
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
