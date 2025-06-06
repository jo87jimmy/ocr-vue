<script setup lang="ts">
import { ref, inject } from 'vue'
import type { Ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

// 資料型別定義
interface Item {
  id: number
  text: string
}
interface MasterItem {
  id: number
  compyname: string | null
  ticketPeriod: string | null
  ticketNo: string | null
  amount: number | null
  date: string | null
}

// 主資料來源
const masterItems: Ref<MasterItem[]> = ref([])
// 使用 reactive ref 作為唯一資料來源
const items: Ref<Item[]> = ref([])
const dialogVisible = ref(false)
const detectDialogVisible = ref(false) // 用於顯示檢測結果的 Dialog
const currentItem: Ref<Partial<Item>> = ref({ id: undefined, text: '' })
const isEditing = ref(false)

function editItem(item: Item) {
  currentItem.value = { ...item }
  isEditing.value = true
  dialogVisible.value = true
}

function saveItem() {
  if (!currentItem.value.text?.trim()) return

  if (isEditing.value && currentItem.value.id != null) {
    const index = items.value.findIndex((i) => i.id === currentItem.value.id)
    if (index !== -1) {
      items.value[index] = { ...(currentItem.value as Item) }
    }
  } else {
    const newId = Math.max(0, ...items.value.map((i) => i.id)) + 1
    items.value.push({ id: newId, text: currentItem.value.text! })
  }
  dialogVisible.value = false
}

function deleteItem(item: Item) {
  items.value = items.value.filter((i) => i.id !== item.id)
}

function insertData() {
  // 將 items 的資料寫入到 masterItems
  if (items.value.length === 0) {
    toast.add({ severity: 'warn', summary: '警告', detail: '沒有資料可寫入', life: 3000 })
    return
  }
  masterItems.value.push({
    id: Math.max(0, ...masterItems.value.map((i) => i.id)) + 1,
    compyname: items.value[0]?.text || null,
    ticketPeriod: items.value[2]?.text || null,
    ticketNo: items.value[3]?.text || null,
    amount: extractNumbers(items.value[6]?.text || ''),
    date: items.value[4]?.text || null,
  })
  items.value = [] // 清空 items
  dialogVisible.value = false // 關閉編輯對話框
  detectDialogVisible.value = false // 關閉檢測結果對話框
}
function extractNumbers(text: string): number | null {
  // 將非數字字元與逗號移除，例如 "總計：3，390" → "3390"
  const match = text.replace(/[^\d]/g, '')
  return match ? parseInt(match, 10) : null
}

// ✅ 若你有類似 result.text 的新資料要加入
function addResult(result: string) {
  const newId = Math.max(0, ...items.value.map((i) => i.id)) + 1
  items.value.push({ id: newId, text: result })
}

// Ref 變數定義
const fileInput = ref<HTMLInputElement | null>(null)
const imageBase64 = ref<string | null>(null)
const imageBase64response = ref<string | null>(null)
const imageLoaded = ref<boolean>(false)
const statusMessage = ref<string>('')
const showResponse = ref<string | null>(null)

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
    const result = await response.json()
    imageBase64response.value = `data:${file.type};base64,${result.image_base64}` // 假設後端回傳的圖片 base64
    toast.add({ severity: 'success', summary: '成功', detail: 'OCR 結果已收到', life: 3000 })
    showResponse.value = JSON.stringify(result.filtered_texts, null, 2) // 格式化顯示結果
    result.filtered_texts.forEach((text: any) => {
      addResult(text)
    })
    console.log('OCR 結果:', result.filtered_texts)
    statusMessage.value = '圖片處理完成'
    detectDialogVisible.value = true // 顯示檢測結果對話框
  } catch (err) {
    console.error(err)
    toast.add({ severity: 'error', summary: '錯誤', detail: '上傳圖片失敗', life: 3000 })
    statusMessage.value = '圖片處理失敗'
  }
}

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
      imageBase64response.value = null // 清除之前的定位圖片
      showResponse.value = null // 清除之前的回應
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
    <h1 class="text-lg font-bold mb-4">OCR 發票文字辨識檢測</h1>

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

      <div class="flex mt-4 space-x-4">
        <!-- 顯示預覽圖片 -->
        <div class="w-1/2">
          <!-- 如果有定位圖片，優先顯示 -->
          <div v-if="imageBase64response" >
            <img :src="imageBase64response" alt="定位圖片" class="border" />
            <!-- <img :src="imageBase64response" alt="定位圖片" class="max-w-full max-h-96 border" /> -->
          </div>
          <!-- 沒有定位圖片才顯示原始圖片 -->
          <div v-else-if="imageBase64" >
            <img :src="imageBase64" alt="預覽圖片" class="border" />
          </div>
        </div>
        <!-- 顯示後端回傳 -->
        <div class="w-1/2 whitespace-pre-wrap break-words border p-2">
          {{ showResponse }}
        </div>
      </div>
    </div>
    <Dialog v-model:visible="detectDialogVisible" header="檢測結果" :modal="true" :style="{ width: '800px' }">
      <div class="p-4">
        <!-- 資料表格 -->
        <DataTable
          :value="items"
          selectionMode="single"
          @rowSelect="editItem"
          dataKey="id"
          size="small"
        >
          <Column field="id" header="ID" />
          <Column field="text" header="內容" />
          <Column header="操作">
            <template #body="slotProps">
              <Button icon="pi pi-pencil" class="mr-2" @click="editItem(slotProps.data)" />
              <Button icon="pi pi-trash" severity="danger" @click="deleteItem(slotProps.data)" />
            </template>
          </Column>
        </DataTable>

        <!-- 編輯 Dialog -->
        <Dialog
          v-model:visible="dialogVisible"
          header="項目內容"
          :modal="true"
          :style="{ width: '400px' }"
        >
          <div class="flex flex-col gap-3">
            <label for="text">內容：</label>
            <InputText id="text" v-model="currentItem.text" class="w-full" />
          </div>
          <template #footer>
            <Button label="取消" icon="pi pi-times" text @click="dialogVisible = false" />
            <Button label="儲存" icon="pi pi-check" @click="saveItem" />
          </template>
        </Dialog>
      </div>
      <template #footer>
        <Button label="取消" icon="pi pi-times" text @click="detectDialogVisible = false;" />
        <Button label="寫入" icon="pi pi-check" @click="insertData" />
      </template>
    </Dialog>
    <DataTable :value="masterItems"  dataKey="id" size="small">
      <Column field="id" header="ID" />
      <Column field="compyname" header="公司名" />
      <Column field="ticketPeriod" header="票據期間" />
      <Column field="ticketNo" header="票據號碼" />
      <Column field="amount" header="金額" />
      <Column field="date" header="日期" />
      
    </DataTable>

    <Toast />
  </div>
</template>

<style scoped>
.container {
  /* max-width: 800px; */
  margin: auto;
}
</style>
