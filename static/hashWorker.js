importScripts('spark-md5.min.js');

// 监听 message事件
self.onmessage = e => {


  const { chunks } = e.data;

  // 创建读取  ArrayBuffer 的 spark
  const spark = new self.SparkMD5.ArrayBuffer();

  let progress = 0;
  let ind = 0;

  loadNext(ind)


  function loadNext(index) {
    // 创建 把blob 读取成 ArrayBuffer的 render
  
    const render = new FileReader();
    render.readAsArrayBuffer(chunks[index].file);

    // 读取完成后，把读取到的 ArrayBuffer 加入到 spark；
    // 然后再递归 调取 第二个 文件片
    render.onload = e => {
      spark.append(e.target.result)
      ind++;
      
  // 判断有没有读取完  没有就返回 progress 进度比例
    if (ind === chunks.length) {
        self.postMessage({
          progress: 100,
          hash: spark.end()
        })
    } else {

      self.postMessage({
        progress: (ind / chunks.length) * 100,
      })

      loadNext(ind)
    }

    }
  }
}


