<script setup lang="ts">
import { ref, inject } from 'vue'
import Button from 'primevue/button'

// Ref 變數定義
const fileInput = ref<HTMLInputElement | null>(null)
const imageBase64 = ref<string | null>(null)
const imageLoaded = ref<boolean>(false)
const statusMessage = ref<string>('')

// 從 inject 拿 toast（建議在 main.ts 中用 provide 定義）
const toast = inject('toast') as {
  add: (options: { severity: string; summary: string; detail: string; life: number }) => void
}
if (!toast) {
  throw new Error('Toast 插件未正確提供')
}

// 假設這是你要執行的處理函數
const processImage = async () => {
  // 模擬圖片處理（實際可改為前端影像處理邏輯）
  return new Promise<void>((resolve) => setTimeout(resolve, 1000))
}

// 假設這是你要將圖片送到後端的函數
const sendCanvasToGolangOCR = async () => {
  if (!imageBase64.value) return

  statusMessage.value = '圖片上傳中...'

  try {
    // 將 base64 轉成 Blob（圖片）
    const byteString = atob(imageBase64.value.split(',')[1])
    const mimeString = imageBase64.value.split(',')[0].split(':')[1].split(';')[0]
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }
    const blob = new Blob([ab], { type: mimeString })
    const file = new File([blob], 'upload.png', { type: mimeString })

    // 準備 FormData
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('http://localhost:9536/api/ai/image/orc/text', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('上傳失敗')
    }
    debugger
    const result = await response.json()
    toast.add({ severity: 'success', summary: '成功', detail: 'OCR 結果已收到', life: 3000 })
    console.log('OCR 結果:', result)
    statusMessage.value = '圖片處理完成'
  } catch (err) {
    console.error(err)
    toast.add({ severity: 'error', summary: '錯誤', detail: '上傳圖片失敗', life: 3000 })
    statusMessage.value = '圖片處理失敗'
  }
}
// const sendCanvasToGolangOCR = async () => {
//   if (!imageBase64.value) return

//   statusMessage.value = '圖片上傳中...'

//   try {
//     const response = await fetch('http://localhost:9536/api/ai/image/orc/text', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ image: imageBase64.value }),
//     })
//     debugger
//     if (!response.ok) {
//       throw new Error('上傳失敗')
//     }
//     debugger
//     const result = await response.json()
//     toast.add({ severity: 'success', summary: '成功', detail: 'OCR 結果已收到', life: 3000 })
//     console.log('OCR 結果:', result)
//     statusMessage.value = '圖片處理完成'
//   } catch (err) {
//     console.error(err)
//     toast.add({ severity: 'error', summary: '錯誤', detail: '上傳圖片失敗', life: 3000 })
//     statusMessage.value = '圖片處理失敗'
//   }
// }

// 點擊按鈕觸發 input
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 圖片選擇事件
const onFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  statusMessage.value = '正在載入圖片...'

  const reader = new FileReader()

  reader.onload = async (e: ProgressEvent<FileReader>) => {
    const result = e.target?.result
    if (typeof result === 'string') {
      imageBase64.value = result
      await processImage()
      imageLoaded.value = true
      statusMessage.value = '圖片已載入'
      toast.add({ severity: 'success', summary: '成功', detail: '圖片已載入', life: 3000 })
    } else {
      toast.add({ severity: 'error', summary: '錯誤', detail: '無法讀取圖片', life: 3000 })
      statusMessage.value = '圖片讀取失敗'
    }
  }

  reader.readAsDataURL(file)
}
</script>

<template>
  <div class="container p-4">
    <h1 class="text-lg font-bold mb-4">OCR 處理工具</h1>
    <div class="grid">
      <div class="mb-4">
        <!-- 上傳圖片按鈕 -->
        <Button
          label="選擇檔案"
          icon="pi pi-upload"
          class="p-button-info mr-2"
          @click="triggerFileInput"
        />
        <!-- 隱藏 input[type=file] -->
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          @change="onFileChange"
          style="display: none"
        />

        <!-- 發送圖片按鈕 -->
        <Button
          label="發送圖片給後端"
          class="p-button-success"
          :disabled="!imageLoaded"
          @click="sendCanvasToGolangOCR"
        />

        <!-- 狀態文字 -->
        <span class="ml-4 text-sm text-gray-500">{{ statusMessage }}</span>
      </div>

      <!-- 顯示預覽圖片 -->
      <div v-if="imageBase64" class="mt-4">
        <img :src="imageBase64" alt="預覽圖片" class="max-w-full max-h-96 border" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: auto;
}
</style>
