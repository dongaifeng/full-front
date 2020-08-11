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
        <input type="file" @change="handleFileChange">
      </div>
      <div>
        <el-button @click="uploadFile">
          上传
        </el-button>
      </div>

      <p>计算hash进度</p>
      <el-progress
        :stroke-width="20"
        :text-inside="true"
        :percentage="hashProgress"
      />
      <el-progress
        :stroke-width="20"
        :text-inside="true"
        :percentage="hashProgress1"
      />

 <p>方块进度条</p>
    <div class="cube-container" :style="{width: cubeWidth + 'px' }">
      <div class="cube" v-for="i in chunks" :key="i.name">
        <div
          :class="{
            'uploading': i.progress < 100 && i.progress > 0,
            'success': i.progress == 100,
            'error': i.progress < 0
          }"
          :style="{height: i.progress + '%'}"
        >
          <i v-if="i.progress < 100 && i.progress > 0" class="el-icon-loading"> </i>
          <div v-else>{{i.index}}</div>
        </div>

      </div>

    </div>
    <!-- <pre>{{ chunks|json }}</pre> -->
    </div>

  
  </div>
</template>

<script>
import sparkND5 from 'spark-md5'
const CHUNK_SIZE = 0.5 * 1024 * 1024
export default {
  data () {
    return {
      form: null,
      file: null,
      num: 0,
      chunks: [],
      hashProgress: 0,
      hashProgress1: 0,
    }
  },
  computed: {
    cubeWidth() {
      // 长度的平方根 ，再向上取整 乘以 每块的宽度
      return Math.ceil(Math.sqrt(this.chunks.length)) * 30
    },
    uploadProgress() {
      if( !this.file || this.chunks.length) {
        return 0
      }
      const loaded = this.chunks.map(i => i.chunk.size * i.progress)
                                .reduce((acc, cur) => acc*cur, 0)
      return (loaded * 100 / this.file.size).toFixed(2)
    }
  },
  async mounted () {
    const res = this.$http.get('/user/info')
    console.log(res)
    this.listenEvent()
  },
  methods: {
    listenEvent () {
      const drag = this.$refs.drag

      // 监听drag事件  实现 拖拽上传
      drag.addEventListener('dragover', (e) => {
        drag.style.borderColor = 'red'
        e.preventDefault()
      })

      drag.addEventListener('dragleave', (e) => {
        drag.style.borderColor = '#ccc'
        e.preventDefault()
      })

      drag.addEventListener('drop', (e) => {
        drag.style.borderColor = '#ccc'
        console.log(e)
        const filelist = e.dataTransfer.files
        this.file = filelist[0]
        e.preventDefault()
      })
    },

    handleFileChange (e) {
      const [file] = e.target.files
      if (!file) { return }
      this.file = file
    },

    async uploadFile () {
      // 判断图片格式
    //  const ret = await this.isImg(this.file)
    //  console.log(ret)

      //  if( !ret ) {
      //    this.$alert('不是图片格式')
      //    return
      //  }

      // web Worker
      const chunks = this.createChunk(this.file)
      const hash = await this.hashWorker(chunks)
      // console.log('chunks------->', chunks)
      // console.log('hash--------->', hash)


      // 请求后端 检查文件是否上传过  上传了多少
      const { data:{ uploaded, uploadList } } = await this.$http.post('/checkFile',{hash, ext: this.file.name.split('.').pop()})
      console.log(uploaded, uploadList)
      if( uploaded) { return this.$message('已经上传了') }


      // 使用时间切片方式
      // const hash1 = await this.hashIdle(chunks)
      // console.log('hash1--------->', hash1)


      // 抽样hash  布隆过滤器 损失一定精度换取效率
      // const hash3 = await this.hashSimple()
      //  console.log('hash3--------->', hash3)


      // 切片上传
      this.chunks = chunks.map((chunk, index) => {
        const name = hash + '-' + index
        return {
          hash, name, index, chunk: chunk.file,
           progress: uploadList.indexOf(name) == -1 ? 0 : 100
        }
      })

    // 切片方式提交
    this.uploadChunks(uploadList)
    // this.mergeFile(hash)
      

    // 原来的方式提交
    //  this.submitFormData()
    },

    async mergeFile(hash) {
      this.$http.post('/mergeFile', {
        ext: this.file.name.split('.').pop(),  // 传到后端 后缀名
        size: CHUNK_SIZE,
        hash
      })
    },

    uploadChunks(uploadList) {
      const requests = this.chunks
        .filter(chunk => uploadList.indexOf(chunk.name) == -1)
        .map((chunk, index) => {
          const form = new FormData()
          form.append('chunk', chunk.chunk)
          form.append('name', chunk.name)
          form.append('hash', chunk.hash)
          form.append('index', chunk.index)

          return {form, index: chunk.index}
        })

      // requests.map((form, index) => {
      //   return this.$http.post('/uploadChunks', form, {
      //     onUploadProgress: (progress) => {
      //       this.chunks[index].progress = Number(((progress.loaded / progress.total) * 100).toFixed(2))
      //     }
      //   })  
      // })

      // 一下子发很多请求 会卡掉浏览器
      // 异步并发控制
      this.sendRequest(requests)

      // Promise.all(requests).then(res => {
      //   console.log(res)
      // })
    },

    async sendRequest(req, limit = 3) {
      return new Promise(resolve => {
        const len = req.length
        let count = 0

        const start = async () => {
         
          const task = req.shift()

          if(task) {
            const {form , index} = task
            await this.$http.post('/uploadChunks', form, {
              onUploadProgress: (progress) => {
                this.chunks[index].progress = Number(((progress.loaded / progress.total) * 100).toFixed(2))
              }
            })

            
            if(count == len-1) {
              resolve()
            } else {
              count++
              start()
            }

          }
        }

        // 这里的循环 会一下子执行 三个start  三个start 任务同时 开始工作 谁要执行完 就是requests 里面拿一个任务 接着执行，
        //一直到requests 全部执行完 也就是count == requests.length
        while(limit > 0) {
          setTimeout(() => {
            start()
          }, 3000)
          limit-=1
        }

      })
    },

    // async submitFormData() {
    //   const form = new FormData()
    //   form.append('name', 'file')
    //   form.append('file', this.file)

    //   console.log('form----->', form)
    //   const res = await this.$http.post('/uploadFile', form, {
    //     onUploadProgress: (progress) => { // 实现进度条
    //       console.log(progress)
    //       this.num = Number(((progress.loaded / progress.total) * 100).toFixed(2))
    //     }
    //   })
    //   console.log(res, '<====res')
    // },

    hashSimple() {
      // 抽样hash：意思是不会把整个文件都算hash。只会随机从文件中抽取一部分 来算出hash值。
      // 我们把文件按每个区块2M切割成一块一块的
      // 我们只要头部的2M 和 尾部的2M
      // 中间的区块 我们只要每个区块的头两个字节 中间两个字节 尾部两个字节
      // 这样算出文件的hash值。
      return new Promise(resolve => {
        const spark = new sparkND5.ArrayBuffer()
        const render = new FileReader()

        const file = this.file
        const size = file.size
        const offset = 2 * 1024 * 1024

        // 第一个2M区块, 最后一个2M区块 数据全要
        let chunks = [ file.slice(0, offset) ]
        let cur = offset

        while(cur < size) {
          if(cur + offset >= size) {
            // 最后一个区块
            chunks.push( file.slice(cur, cur + offset) )
          } else {
            // 中间的区块  区 前2个字节 中间2个字节 后2个字节
            const mid = cur + (offset / 2)
            const end = cur + offset

            chunks.push( file.slice(cur, cur + 2) )
            chunks.push( file.slice(mid, mid + 2) )
            chunks.push( file.slice(end-2, end) )
          }
          cur += offset
        }


        render.readAsArrayBuffer(new Blob(chunks) )
        render.onload = (e) => {
          spark.append(e.target.result)
          this.hashProgress = 100
          resolve(spark.end())
        }



      })
    },

    hashIdle (chunks) {
      return new Promise((resolve, reject) => {
        const spark = new sparkND5.ArrayBuffer()
        // const chunks = this.chunks
        let count = 0

        // 用 FileReader 的 readAsArrayBuffer 方法 把文件读取成ArrayBuffer 并且 存到spark中
        const appendToSpark = (file) => {
          return new Promise((resolve) => {
            const render = new FileReader()
            render.readAsArrayBuffer(file)
            render.onload = (e) => {
              spark.append(e.target.result)
              resolve(e.target.result)
            }
          })
        }

        // 空余时间回调
        const cb = async (deadline) => {
          // 当又空闲时间 并且 有任务
          while (count < chunks.length && deadline.timeRemaining() > 1) {
            // 从 chunks 中 拿出一个 加到 spark里 然后 再下一个
            await appendToSpark(chunks[count].file)

            count++

            if (count < chunks.length) {
              this.hashProgress1 = Number(((count / chunks.length) * 100).toFixed(2))
            } else {
              this.hashProgress1 = 100
              resolve(spark.end())
            }
          }

          // 如果没有空余时间 就放到下一帧 执行
          window.requestIdleCallback(cb)
        }

        // 启动 空余时间
        window.requestIdleCallback(cb)
      })
    },

    async hashWorker (chunks) {
      return new Promise((resolve, reject) => {
        const worker = new Worker('/hashWorker.js')
        worker.postMessage({
          chunks
        })

        worker.onmessage = (e) => {
          const { progress, hash } = e.data
          console.log(progress, hash, '<---------worker.onmessage')
          this.hashProgress = Number(progress.toFixed(2))
          if (hash) {
            resolve(hash)
          }

          // worker.terminate()
        }
      })
    },

    // 把文件 切片 放到数组里
    createChunk (file, size = CHUNK_SIZE) {
      const chunks = []
      let cur = 0

      while (cur < file.size) {
        chunks.push({
          index: cur,
          file: file.slice(cur, cur + size)
        })

        cur += size
      }

      return chunks
    },

    // 判断是不是图片格式
    async isImg (file) {
      return await this.isgif(file) || await this.ispng(file) || await this.isjpg(file)
    },
    async isgif (file) {
      // '47 49 46 38 37 61'  "47 49 46 38 39 61"
      //  G  I  F  8  9(7) a
      const str = file.slice(0, 6)
      const res = await this.blobToString(str)
      const isgif = (res === '47 49 46 38 37 61') || (res === '47 49 46 38 39 61')
      return isgif
    },
    async ispng (file) {
      // '89 50 4E 47 0D 0A 1A 0A"
      //  G  I  F  8  9(7) a
      const str = file.slice(0, 8)
      const res = await this.blobToString(str)
      const ispng = (res === '89 50 4E 47 0D 0A 1A 0A')
      return ispng
    },
    async isjpg (file) {
      // 头FF D8   尾FF D9
      //  G  I  F  8  9(7) a
      const str1 = file.slice(0, 2)
      const str2 = file.slice(-2, file.size)
      const res1 = await this.blobToString(str1)
      const res2 = await this.blobToString(str2)
      const isjpg = (res1 === 'FF D8') || (res2 === 'FF D9')
      return isjpg
    },
    blobToString (blob) {
      return new Promise((rsolve, reject) => {
        const render = new FileReader()
        render.readAsBinaryString(blob)
        render.onload = function (e) {
          const ret = e.target.result.split('')
            .map(v => v.charCodeAt())
            .map(v => v.toString(16))
            .join(' ')
          console.log('--->', ret)

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
  .cube-container
    .cube
      width 28px
      height 28px
      line-height 12px
      
      border 1px solid #000
      background #ccc
      float left
      >.success 
        background green
      >.error
        background  red
      >.uploading
        background blue
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
