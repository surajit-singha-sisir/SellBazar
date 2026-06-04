<template>
  <div class="admin-page-wrap">
    <!-- Header -->
    <div class="admin-page-header">
      <div style="display:flex;align-items:center;gap:12px">
        <RouterLink to="/admin/products" class="admin-btn ghost" style="padding:6px 10px">
          <i class="fa-solid fa-arrow-left"></i>
        </RouterLink>
        <div>
          <h1 class="page-title">{{ isEdit ? 'Edit Product' : 'Add New Product' }}</h1>
          <p class="page-subtitle">{{ isEdit ? `Editing: ${form.name || '…'}` : 'Fill in details to create a new product' }}</p>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <RouterLink to="/admin/products" class="admin-btn secondary">Cancel</RouterLink>
        <button class="admin-btn primary" @click="submitForm" :disabled="saving || !isFormValid">
          <i v-if="saving" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-sharp fa-solid fa-floppy-disk"></i>
          {{ saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product' }}
        </button>
      </div>
    </div>

    <!-- Error banner -->
    <div v-if="formError" class="pf-error-banner">
      <i class="fa-solid fa-circle-exclamation"></i> {{ formError }}
    </div>

    <!-- ── JSON Import card (Add mode only) ─────────────────────────────── -->
    <div v-if="!isEdit" class="pf-card pf-json-card">
      <div class="pf-json-header" @click="jsonPanelOpen = !jsonPanelOpen">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="pf-json-icon"><i class="fa-solid fa-file-code"></i></span>
          <div>
            <div style="font-size:13px;font-weight:700;color:var(--text-primary)">Import from JSON</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-top:1px">Paste JSON text or upload a .json file to fill this form instantly</div>
          </div>
        </div>
        <i class="fa-solid fa-chevron-down pf-json-chevron" :class="{ open: jsonPanelOpen }"></i>
      </div>

      <Transition name="json-panel">
        <div v-if="jsonPanelOpen" class="pf-json-body">

          <!-- Two-column: paste | upload -->
          <div class="pf-json-cols">
            <!-- LEFT: paste text -->
            <div class="pf-json-col">
              <div class="pf-json-col-label"><i class="fa-solid fa-paste"></i> Paste JSON</div>
              <textarea
                class="pf-json-textarea"
                v-model="jsonText"
                placeholder='{ "name": "…", "brand": "…", … }'
                spellcheck="false"
                @input="jsonError = ''"
              ></textarea>
            </div>

            <!-- divider -->
            <div class="pf-json-divider"><span>or</span></div>

            <!-- RIGHT: upload file -->
            <div class="pf-json-col">
              <div class="pf-json-col-label"><i class="fa-solid fa-folder-open"></i> Upload .json file</div>
              <div
                class="pf-json-dropzone"
                :class="{ 'drag-over': jsonDragOver }"
                @click="jsonFileInput?.click()"
                @dragover.prevent="jsonDragOver = true"
                @dragleave="jsonDragOver = false"
                @drop.prevent="onJsonDrop"
              >
                <input ref="jsonFileInput" type="file" accept=".json,application/json" style="display:none" @change="onJsonFileChange" />
                <i class="fa-solid fa-cloud-arrow-up" style="font-size:22px;color:var(--brand);margin-bottom:6px"></i>
                <div style="font-size:12px;font-weight:600">{{ jsonFileName || 'Click or drop a .json file' }}</div>
                <div v-if="jsonFileName" style="font-size:11px;color:var(--text-secondary);margin-top:2px">File loaded — click Import to apply</div>
              </div>
            </div>
          </div>

          <!-- Error / preview strip -->
          <div v-if="jsonError" class="pf-json-error">
            <i class="fa-solid fa-circle-exclamation"></i> {{ jsonError }}
          </div>
          <div v-if="jsonPreviewName" class="pf-json-preview">
            <i class="fa-solid fa-circle-check"></i>
            Ready to import: <strong>{{ jsonPreviewName }}</strong>
            <span v-if="jsonPreviewFields" class="pf-json-preview-fields">{{ jsonPreviewFields }}</span>
          </div>

          <!-- Action buttons -->
          <div class="pf-json-actions">
            <button class="admin-btn secondary" style="font-size:12px;padding:7px 14px" @click="clearJson">
              <i class="fa-solid fa-xmark"></i> Clear
            </button>
            <button class="admin-btn primary" style="font-size:12px;padding:7px 16px" @click="applyJson" :disabled="!jsonText.trim()">
              <i class="fa-solid fa-wand-magic-sparkles"></i> Import & Fill Form
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <div class="pf-grid">
      <!-- LEFT: main fields -->
      <div class="pf-main">
        <!-- Basic Info -->
        <div class="pf-card">
          <div class="pf-card-title">Basic Information</div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Product Name <span class="req">*</span></label>
              <input class="form-input" v-model="form.name" placeholder="e.g. Samsung Galaxy A55 5G" />
            </div>
            <div class="form-group">
              <label class="form-label">Brand <span class="req">*</span></label>
              <input class="form-input" v-model="form.brand" placeholder="e.g. Samsung" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>

            <!-- Editor toolbar extras: Find/Replace + Emoji -->
            <div class="qe-meta-bar">
              <span class="qe-word-count">{{ editorWordCount }} words · {{ editorCharCount }} chars</span>
              <div class="qe-meta-actions">
                <button type="button" class="qe-meta-btn" :class="{ active: findReplaceOpen }" @click="findReplaceOpen = !findReplaceOpen" title="Find & Replace">
                  <i class="fa-solid fa-magnifying-glass"></i> Find
                </button>
                <button type="button" class="qe-meta-btn" :class="{ active: emojiPickerOpen }" @click="emojiPickerOpen = !emojiPickerOpen" title="Insert Emoji">
                  <i class="fa-regular fa-face-smile"></i>
                </button>
              </div>
            </div>

            <!-- Emoji panel -->
            <Transition name="qe-panel">
              <div v-if="emojiPickerOpen" class="qe-emoji-panel">
                <button v-for="em in emojiList" :key="em" type="button" class="qe-emoji-btn" @click="insertEmoji(em)">{{ em }}</button>
              </div>
            </Transition>

            <!-- Find & Replace panel -->
            <Transition name="qe-panel">
              <div v-if="findReplaceOpen" class="qe-find-panel">
                <div class="qe-find-row">
                  <input class="form-input" v-model="findText" placeholder="Find…" style="flex:1" @keyup.enter="doFind" />
                  <input class="form-input" v-model="replaceText" placeholder="Replace with…" style="flex:1" />
                  <button type="button" class="admin-btn secondary" style="font-size:11px;padding:6px 12px" @click="doFind">Find</button>
                  <button type="button" class="admin-btn secondary" style="font-size:11px;padding:6px 12px" @click="doReplace">Replace</button>
                  <button type="button" class="admin-btn secondary" style="font-size:11px;padding:6px 12px" @click="doReplaceAll">All</button>
                </div>
                <div v-if="findStatus" class="qe-find-status">{{ findStatus }}</div>
              </div>
            </Transition>

            <div class="quill-editor-wrap" :class="{ 'quill-uploading': descImgUploading, 'quill-fullscreen': isFullscreen }">
              <div ref="quillContainer" v-show="!isCodeView"></div>
              <!-- Code view textarea -->
              <textarea
                v-if="isCodeView"
                v-model="codeViewHtml"
                class="qe-code-view-textarea"
                spellcheck="false"
                placeholder="<p>Edit raw HTML here…</p>"
              ></textarea>
              <!-- Fullscreen exit button (visible only in fullscreen mode) -->
              <button v-if="isFullscreen" type="button" class="qe-exit-fullscreen-btn" @click="toggleFullscreen" title="Exit fullscreen (Esc)">
                <i class="fa-sharp fa-solid fa-compress"></i> Exit fullscreen
              </button>
              <div v-if="descImgUploading" class="quill-upload-overlay">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Uploading image to ImgBB…
              </div>
              <!-- Autosave indicator -->
              <div class="qe-autosave-badge" :class="autoSaveState">{{ autoSaveLabel }}</div>
              <!-- Drag-resize handle -->
              <div class="qe-resize-handle" title="Drag to resize editor"></div>
            </div>
            <input ref="descImgInput" type="file" accept="image/*" style="display:none" @change="onDescImagePick" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Category <span class="req">*</span></label>
              <select class="form-input" v-model="form.category" @change="form.subcategory = ''">
                <option value="" disabled>Select category</option>
                <option v-for="cat in categoryList" :key="cat.slug" :value="cat.name">{{ cat.name }}</option>
                <option value="__custom__">+ Custom category</option>
              </select>
            </div>
            <div class="form-group" v-if="form.category === '__custom__'">
              <label class="form-label">Custom Category <span class="req">*</span></label>
              <input class="form-input" v-model="customCategory" placeholder="e.g. Sports" />
            </div>
            <div class="form-group" v-else>
              <label class="form-label">Seller</label>
              <input class="form-input" v-model="form.seller" placeholder="e.g. TechWorld BD" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Subcategory</label>
              <!-- Show a select when the chosen category has subcategories, otherwise a free-text input -->
              <select
                v-if="subcategoryOptions.length"
                class="form-input"
                v-model="form.subcategory"
              >
                <option value="">— None —</option>
                <option v-for="sub in subcategoryOptions" :key="sub.slug" :value="sub.slug">
                  {{ sub.name }}
                </option>
              </select>
              <input
                v-else
                class="form-input"
                v-model="form.subcategory"
                placeholder="e.g. mobile-phones"
              />
              <span v-if="subcategoryOptions.length" class="form-hint">
                {{ subcategoryOptions.length }} subcategories in {{ form.category }}
              </span>
            </div>
            <div class="form-group">
              <label class="form-label">Bangla Name (optional)</label>
              <input class="form-input" v-model="form.nameBn" placeholder="e.g. স্যামসাং গ্যালাক্সি" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tags</label>
              <input class="form-input" v-model="tagsInput" placeholder="phone, samsung, 5g (comma separated)" />
            </div>
            <div class="form-group">
              <label class="form-label">Location</label>
              <input class="form-input" v-model="form.location" placeholder="e.g. Dhaka" />
            </div>
          </div>
        </div>

        <!-- Pricing & Stock -->
        <div class="pf-card">
          <div class="pf-card-title">Pricing & Stock</div>
          <div class="form-row form-row-3">
            <div class="form-group">
              <label class="form-label">Regular Price (৳) <span class="req">*</span></label>
              <input class="form-input" type="number" min="0" v-model.number="form.price" placeholder="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Sale Price (৳)</label>
              <input class="form-input" type="number" min="0" v-model.number="form.salePrice" placeholder="0 = no discount" />
              <span v-if="discountPct > 0" class="discount-badge">{{ discountPct }}% off</span>
            </div>
            <div class="form-group">
              <label class="form-label">Stock Qty <span class="req">*</span></label>
              <input class="form-input" type="number" min="0" v-model.number="form.stock" placeholder="0" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Delivery Days</label>
              <input class="form-input" type="number" min="1" v-model.number="form.deliveryDays" placeholder="3" />
            </div>
            <div class="form-group">
              <label class="form-label">Rating (0–5)</label>
              <input class="form-input" type="number" min="0" max="5" step="0.1" v-model.number="form.rating" placeholder="4.5" />
            </div>
          </div>
        </div>

        <!-- Flags -->
        <div class="pf-card">
          <div class="pf-card-title">Product Flags</div>
          <div class="form-toggles">
            <label class="toggle-item">
              <input type="checkbox" v-model="form.isFeatured" />
              <span class="toggle-ui"></span>
              <span class="toggle-label">Featured Product</span>
            </label>
            <label class="toggle-item">
              <input type="checkbox" v-model="form.isNew" />
              <span class="toggle-ui"></span>
              <span class="toggle-label">Mark as New</span>
            </label>
          </div>
        </div>
      </div>

      <!-- RIGHT: images -->
      <div class="pf-side">
        <div class="pf-card">
          <div class="pf-card-title">Product Images</div>

          <!-- Upload by file -->
          <div class="upload-zone" @click="fileInput?.click()" @dragover.prevent @drop.prevent="onDrop">
            <input ref="fileInput" type="file" accept="image/*" multiple style="display:none" @change="onFileChange" />
            <i class="fa-solid fa-cloud-arrow-up" style="font-size:28px;color:var(--brand);margin-bottom:8px"></i>
            <div style="font-weight:600;font-size:13px">Drop images here or click to upload</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-top:4px">PNG, JPG, WEBP up to 25 MB — auto-compressed &amp; converted to WebP</div>
            <div v-if="uploading" style="margin-top:8px;color:var(--brand);font-size:12px">
              <i class="fa-solid fa-spinner fa-spin"></i> Compressing &amp; uploading to ImgBB…
            </div>
          </div>

          <!-- Add by URL -->
          <div style="display:flex;gap:8px;margin-top:12px">
            <input class="form-input" v-model="urlInput" placeholder="Or paste image URL…" style="flex:1" />
            <button class="admin-btn secondary" style="padding:8px 14px;flex-shrink:0" @click="addImageUrl">
              <i class="fa-solid fa-plus"></i> Add
            </button>
          </div>

          <!-- Preview gallery -->
          <div v-if="form.images.length" class="img-gallery">
            <div v-for="(img, idx) in form.images" :key="idx" class="img-thumb-wrap">
              <img :src="resolveImg(img)" :alt="`Image ${idx+1}`" class="img-thumb"
                onerror="this.src='https://placehold.co/80x80/f97316/fff?text=?'" />
              <span v-if="idx === 0" class="img-primary-badge">Main</span>
              <button class="img-remove-btn" @click="removeImage(idx)">
                <i class="fa-solid fa-xmark"></i>
              </button>
              <div class="img-move-btns">
                <button @click="moveImage(idx, -1)" :disabled="idx===0"><i class="fa-solid fa-chevron-left"></i></button>
                <button @click="moveImage(idx, 1)" :disabled="idx===form.images.length-1"><i class="fa-solid fa-chevron-right"></i></button>
              </div>
            </div>
          </div>
          <div v-else style="text-align:center;padding:16px;color:var(--text-secondary);font-size:12px">
            No images yet. Upload or add a URL above.
          </div>

          <!-- Store page link (edit mode) -->
          <div v-if="isEdit && currentSlug" style="margin-top:16px;padding-top:14px;border-top:1px solid var(--sidebar-border)">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);margin-bottom:8px">
              Store Page
            </div>
            <RouterLink :to="`/products/${currentSlug}`" target="_blank"
              style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--brand);text-decoration:none">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
              View on store →
            </RouterLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast-slide">
        <div v-if="toast.show" class="admin-toast" :class="toast.type">
          <i :class="toast.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'"></i>
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminStore } from '@/stores/useAdminStore'
import { useAdminApi } from '@/composables/useAdminApi'

const router = useRouter()
const route  = useRoute()
const adminStore = useAdminStore()
const api = useAdminApi()

const isEdit = computed(() => !!route.params.id)
const currentSlug = ref('')

const loading = ref(false)
const saving    = ref(false)
const uploading = ref(false)
const descImgUploading = ref(false)
const formError = ref('')
const fileInput    = ref<HTMLInputElement | null>(null)
const descImgInput = ref<HTMLInputElement | null>(null)
const urlInput  = ref('')
const tagsInput = ref('')
const customCategory = ref('')
const quillContainer = ref<HTMLElement | null>(null)
let quillInstance: any = null

// ── Editor extras state ──────────────────────────────────────────────────────
const editorWordCount  = ref(0)
const editorCharCount  = ref(0)
const isFullscreen     = ref(false)
const emojiPickerOpen  = ref(false)
const findReplaceOpen  = ref(false)
const findText         = ref('')
const replaceText      = ref('')
const findStatus       = ref('')
const autoSaveState    = ref<'idle' | 'saving' | 'saved'>('idle')
const autoSaveLabel    = ref('')
let   autoSaveTimer    = 0

const emojiList = [
  '😀','😂','😍','🤔','😎','🥳','🔥','✅','⭐','💡',
  '🎉','👍','❤️','🚀','💰','🛒','📦','🏷️','🎁','📱',
  '💻','🖥️','⌨️','🖱️','📷','🎵','🌟','✨','💎','🏆',
  '👏','🙌','💪','👀','🤝','📢','📣','🔔','⚡','🌈',
]

function updateWordCount() {
  if (!quillInstance) return
  const text  = quillInstance.getText().trim()
  editorCharCount.value = text.length
  editorWordCount.value = text ? text.split(/\s+/).filter(Boolean).length : 0
}

function triggerAutoSave() {
  clearTimeout(autoSaveTimer)
  autoSaveState.value = 'saving'
  autoSaveLabel.value = 'Saving…'
  autoSaveTimer = window.setTimeout(() => {
    autoSaveState.value = 'saved'
    autoSaveLabel.value = '✓ Auto-saved'
    window.setTimeout(() => {
      autoSaveState.value = 'idle'
      autoSaveLabel.value = ''
    }, 2200)
  }, 1400)
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  nextTick(() => quillInstance?.focus())
}

// ── Code View ─────────────────────────────────────────────────────────────────
const isCodeView = ref(false)
const codeViewHtml = ref('')

function toggleCodeView() {
  isCodeView.value = !isCodeView.value
  if (isCodeView.value) {
    // Capture current HTML into the textarea
    codeViewHtml.value = quillInstance ? quillInstance.getSemanticHTML() : form.description
  } else {
    // Apply edited HTML back into Quill
    if (quillInstance && codeViewHtml.value !== undefined) {
      quillInstance.clipboard.dangerouslyPasteHTML(codeViewHtml.value)
      form.description = codeViewHtml.value
    }
  }
  // Update fullscreen icon when toggling code view too
  nextTick(() => {
    const fsBtn = quillContainer.value?.closest('.quill-editor-wrap')?.querySelector('.ql-fullscreen i') as HTMLElement | null
    if (fsBtn) {
      fsBtn.className = isFullscreen.value ? 'fa-sharp fa-solid fa-compress' : 'fa-sharp fa-solid fa-expand'
    }
  })
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isFullscreen.value) {
    isFullscreen.value = false
    nextTick(() => {
      quillInstance?.focus()
      // Restore expand icon
      const fsBtn = quillContainer.value?.closest('.quill-editor-wrap')?.querySelector('.ql-fullscreen i') as HTMLElement | null
      if (fsBtn) fsBtn.className = 'fa-sharp fa-solid fa-expand'
    })
  }
}

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
  clearTimeout(autoSaveTimer)
  clearTimeout(toastTimer)
})

function insertEmoji(em: string) {
  if (!quillInstance) return
  const range = quillInstance.getSelection(true) ?? { index: quillInstance.getLength() - 1 }
  quillInstance.insertText(range.index, em, 'user')
  quillInstance.setSelection(range.index + em.length)
  emojiPickerOpen.value = false
}

function insertTable() {
  if (!quillInstance) return
  const range = quillInstance.getSelection(true) ?? { index: quillInstance.getLength() - 1 }
  // Build a minimal HTML table and paste it
  const tableHtml = `<br><table border="1" style="border-collapse:collapse;width:100%">
    <thead><tr><th style="padding:6px 10px;background:#f5f5f5">Header 1</th><th style="padding:6px 10px;background:#f5f5f5">Header 2</th><th style="padding:6px 10px;background:#f5f5f5">Header 3</th></tr></thead>
    <tbody>
      <tr><td style="padding:6px 10px">Cell</td><td style="padding:6px 10px">Cell</td><td style="padding:6px 10px">Cell</td></tr>
      <tr><td style="padding:6px 10px">Cell</td><td style="padding:6px 10px">Cell</td><td style="padding:6px 10px">Cell</td></tr>
    </tbody>
  </table><br>`
  quillInstance.clipboard.dangerouslyPasteHTML(range.index, tableHtml)
  showToast('Table inserted — click any cell to edit', 'success')
}

function handleVideoEmbed() {
  if (!quillInstance) return
  const url = prompt('Enter YouTube or Vimeo URL:')?.trim()
  if (!url) return
  // Convert watch URLs to embed URLs
  let embed = url
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  if (ytMatch) embed = `https://www.youtube.com/embed/${ytMatch[1]}`
  const vmMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vmMatch) embed = `https://player.vimeo.com/video/${vmMatch[1]}`
  const range = quillInstance.getSelection(true) ?? { index: quillInstance.getLength() - 1 }
  quillInstance.insertEmbed(range.index, 'video', embed, 'user')
  quillInstance.setSelection(range.index + 1)
  showToast('Video embedded', 'success')
}

function insertDivider() {
  if (!quillInstance) return
  const range = quillInstance.getSelection(true) ?? { index: quillInstance.getLength() - 1 }
  quillInstance.insertText(range.index, '\n', 'user')
  quillInstance.insertEmbed(range.index + 1, 'divider' as any, true, 'user')
  quillInstance.insertText(range.index + 2, '\n', 'user')
  quillInstance.setSelection(range.index + 3)
}

// ── Find & Replace ────────────────────────────────────────────────────────────
let findLastIndex = -1

function doFind() {
  findStatus.value = ''
  if (!quillInstance || !findText.value) return
  const text  = quillInstance.getText()
  const query = findText.value
  const start = findLastIndex + 1
  let   idx   = text.indexOf(query, start)
  if (idx === -1 && start > 0) idx = text.indexOf(query, 0) // wrap
  if (idx === -1) { findStatus.value = `"${query}" not found`; findLastIndex = -1; return }
  quillInstance.setSelection(idx, query.length)
  findLastIndex = idx
  const total = (text.match(new RegExp(escReg(query), 'g')) ?? []).length
  findStatus.value = `Match at pos ${idx} (${total} total)`
}

function doReplace() {
  if (!quillInstance || !findText.value) return
  const sel = quillInstance.getSelection()
  if (sel && sel.length === findText.value.length) {
    quillInstance.deleteText(sel.index, sel.length)
    quillInstance.insertText(sel.index, replaceText.value)
    quillInstance.setSelection(sel.index + replaceText.value.length)
    findLastIndex = sel.index - 1
    findStatus.value = 'Replaced — press Find for next'
  } else {
    doFind()
  }
}

function doReplaceAll() {
  if (!quillInstance || !findText.value) return
  const text   = quillInstance.getText()
  const count  = (text.match(new RegExp(escReg(findText.value), 'g')) ?? []).length
  if (!count) { findStatus.value = 'No matches found'; return }
  // Re-build HTML with replacements
  let html = quillInstance.getSemanticHTML()
  html = html.split(findText.value).join(replaceText.value)
  quillInstance.clipboard.dangerouslyPasteHTML(html)
  form.description = quillInstance.getSemanticHTML()
  findStatus.value = `Replaced ${count} occurrence${count > 1 ? 's' : ''}`
  findLastIndex = -1
}

function escReg(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

// ── JSON Import state ─────────────────────────────────────────────────────────
const jsonPanelOpen   = ref(false)
const jsonText        = ref('')
const jsonFileName    = ref('')
const jsonError       = ref('')
const jsonPreviewName = ref('')
const jsonPreviewFields = ref('')
const jsonDragOver    = ref(false)
const jsonFileInput   = ref<HTMLInputElement | null>(null)

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsText(file)
  })
}

async function onJsonFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    jsonText.value     = await readFileAsText(file)
    jsonFileName.value = file.name
    jsonError.value    = ''
    previewJson()
  } catch {
    jsonError.value = 'Could not read the file.'
  }
}

async function onJsonDrop(e: DragEvent) {
  jsonDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  if (!file.name.endsWith('.json') && file.type !== 'application/json') {
    jsonError.value = 'Please drop a .json file.'; return
  }
  try {
    jsonText.value     = await readFileAsText(file)
    jsonFileName.value = file.name
    jsonError.value    = ''
    previewJson()
  } catch {
    jsonError.value = 'Could not read the file.'
  }
}

function previewJson() {
  jsonPreviewName.value   = ''
  jsonPreviewFields.value = ''
  if (!jsonText.value.trim()) return
  try {
    const p = JSON.parse(jsonText.value)
    if (typeof p !== 'object' || Array.isArray(p)) {
      jsonError.value = 'JSON must be a single product object { … }'; return
    }
    jsonPreviewName.value = p.name ?? '(no name)'
    const filled = ['name','brand','category','price','stock','images','description','tags']
      .filter(k => p[k] !== undefined && p[k] !== '' && !(Array.isArray(p[k]) && !p[k].length))
    jsonPreviewFields.value = filled.join(', ')
  } catch (err: any) {
    jsonError.value = `Invalid JSON: ${err.message}`
  }
}

function clearJson() {
  jsonText.value        = ''
  jsonFileName.value    = ''
  jsonError.value       = ''
  jsonPreviewName.value = ''
  jsonPreviewFields.value = ''
  if (jsonFileInput.value) jsonFileInput.value.value = ''
}

function applyJson() {
  jsonError.value = ''
  if (!jsonText.value.trim()) return
  let p: any
  try {
    p = JSON.parse(jsonText.value)
  } catch (err: any) {
    jsonError.value = `Invalid JSON: ${err.message}`; return
  }
  if (typeof p !== 'object' || Array.isArray(p)) {
    jsonError.value = 'JSON must be a single product object { … }'; return
  }

  // ── Map every known field ──────────────────────────────────────────────────
  if (p.name        !== undefined) form.name        = String(p.name)
  if (p.nameBn      !== undefined) form.nameBn      = String(p.nameBn)
  if (p.brand       !== undefined) form.brand       = String(p.brand)
  if (p.seller      !== undefined) form.seller      = String(p.seller)
  if (p.location    !== undefined) form.location    = String(p.location)
  if (p.price       !== undefined) form.price       = Number(p.price)  || 0
  if (p.salePrice   !== undefined) form.salePrice   = Number(p.salePrice) || 0
  if (p.stock       !== undefined) form.stock       = Number(p.stock)  || 0
  if (p.deliveryDays !== undefined) form.deliveryDays = Number(p.deliveryDays) || 3
  if (p.rating      !== undefined) form.rating      = Math.min(5, Math.max(0, Number(p.rating) || 4.5))
  if (p.isFeatured  !== undefined) form.isFeatured  = Boolean(p.isFeatured)
  if (p.isNew       !== undefined) form.isNew       = Boolean(p.isNew)

  // Category — set only if it's a non-empty string
  if (p.category && typeof p.category === 'string') {
    form.category    = p.category
    form.subcategory = ''   // reset subcategory first
  }
  if (p.subcategory !== undefined) form.subcategory = String(p.subcategory)

  // Images — accept array of strings
  if (Array.isArray(p.images)) {
    form.images = p.images
      .map((u: any) => String(u).trim())
      .filter((u: string) => u.startsWith('http') || u.startsWith('data:'))
  }

  // Tags — accept array or comma-separated string
  if (Array.isArray(p.tags)) {
    tagsInput.value = p.tags.map((t: any) => String(t).trim()).filter(Boolean).join(', ')
  } else if (typeof p.tags === 'string' && p.tags.trim()) {
    tagsInput.value = p.tags.trim()
  }

  // Description — push into Quill if available, otherwise store raw
  if (p.description !== undefined) {
    const desc = String(p.description)
    form.description = desc
    if (quillInstance) {
      // nextTick so Quill has mounted if this is the very first open
      nextTick(() => quillInstance.clipboard.dangerouslyPasteHTML(desc))
    }
  }

  // ── Success feedback ───────────────────────────────────────────────────────
  showToast(`Imported "${form.name}" — review the form and save`, 'success')
  jsonPanelOpen.value = false
  clearJson()
}

// ── Live categories from API ──────────────────────────────────────────────────
interface ApiSubcat { id: string; slug: string; name: string; nameBn: string; icon: string }
interface ApiCat    { id: string; slug: string; name: string; nameBn: string; icon: string; color: string; subcategories: ApiSubcat[] }

const categoryList = ref<ApiCat[]>([])

async function loadCategoryList() {
  try {
    categoryList.value = await api.fetchCategories()
  } catch {
    // fallback hardcoded names if API fails
    categoryList.value = ['Electronics','Fashion','Grocery','Home & Living','Beauty','Business','Sports','Toys','Books']
      .map((name, i) => ({ id: String(i), slug: name.toLowerCase().replace(/\s+/g, '-'), name, nameBn: '', icon: '', color: '', subcategories: [] }))
  }
}

// Subcategory options derived from the currently-selected category
const subcategoryOptions = computed<ApiSubcat[]>(() => {
  if (!form.category || form.category === '__custom__') return []
  return categoryList.value.find(c => c.name === form.category)?.subcategories ?? []
})

const form = reactive({
  name: '', nameBn: '', brand: '', category: '', subcategory: '', seller: '', description: '',
  price: 0, salePrice: 0, stock: 0, deliveryDays: 3, rating: 4.5,
  location: 'Dhaka', isFeatured: false, isNew: true,
  images: [] as string[],
})

const discountPct = computed(() => {
  if (form.salePrice > 0 && form.price > 0 && form.salePrice < form.price)
    return Math.round((1 - form.salePrice / form.price) * 100)
  return 0
})

const isFormValid = computed(() =>
  form.name.trim() !== '' &&
  form.brand.trim() !== '' &&
  (form.category !== '' && form.category !== '__custom__' || customCategory.value.trim() !== '') &&
  form.price > 0 && form.stock >= 0
)

const toast = reactive({ show: false, message: '', type: 'success' as 'success' | 'error' })
let toastTimer = 0
function showToast(msg: string, type: 'success' | 'error' = 'success') {
  clearTimeout(toastTimer)
  toast.message = msg; toast.type = type; toast.show = true
  toastTimer = window.setTimeout(() => { toast.show = false }, 3500)
}

function resolveImg(url: string) {
  // Base64 data URLs and external http(s) URLs are used as-is.
  // Only relative paths (legacy server uploads) get the API base prepended.
  if (url.startsWith('data:') || url.startsWith('http')) return url
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
  return `${base}${url}`
}

onMounted(async () => {
  document.addEventListener('keydown', onKeyDown)
  // Load categories (for subcategory dropdown) and quill in parallel
  await Promise.all([loadCategoryList(), nextTick()])
  const Quill = (window as any).Quill
  const ImageResize = (window as any).ImageResize

  if (Quill && quillContainer.value) {
    // Register custom fonts
    const FontAttributor = Quill.import('attributors/class/font')
    FontAttributor.whitelist = ['sans-serif', 'serif', 'monospace', 'bangla', 'hind-siliguri', 'kalpurush']
    Quill.register(FontAttributor, true)

    // Register image-resize module if available
    if (ImageResize) {
      Quill.register('modules/imageResize', ImageResize.default ?? ImageResize)
    }

    quillInstance = new Quill(quillContainer.value, {
      theme: 'snow',
      placeholder: 'Write a detailed product description…',
      modules: {
        toolbar: {
          container: [
            // Row 1: History + format type
            ['undo', 'redo'],
            [{ header: [1, 2, 3, 4, false] }],
            [{ font: ['sans-serif', 'serif', 'monospace', 'bangla', 'hind-siliguri', 'kalpurush'] }],
            [{ size: ['small', false, 'large', 'huge'] }],
            // Row 2: Inline text styles
            ['bold', 'italic', 'underline', 'strike'],
            [{ script: 'sub' }, { script: 'super' }],
            [{ color: [] }, { background: [] }],
            // Row 3: Paragraph / alignment (left, center, right, justify)
            [{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }],
            [{ indent: '-1' }, { indent: '+1' }],
            [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
            // Row 4: Blocks + media
            ['blockquote', 'code-block'],
            ['link', 'image', 'video'],
            // Row 5: Utilities
            ['divider'],
            ['table', 'fullscreen'],
            ['code-view'],
            ['clean'],
          ],
          handlers: {
            image:     () => { descImgInput.value?.click() },
            video:     handleVideoEmbed,
            divider:   insertDivider,
            undo:      () => (quillInstance as any).history.undo(),
            redo:      () => (quillInstance as any).history.redo(),
            table:     insertTable,
            fullscreen: toggleFullscreen,
            'code-view': toggleCodeView,
          },
        },
        history: { delay: 1000, maxStack: 100, userOnly: true },
        ...(ImageResize ? { imageResize: { displaySize: true } } : {}),
      },
    })

    // Custom toolbar icons — FA6 Pro sharp-solid style via <i> tags
    const icons = Quill.import('ui/icons')
    icons['undo']        = `<i class="fa-sharp fa-solid fa-rotate-left"></i>`
    icons['redo']        = `<i class="fa-sharp fa-solid fa-rotate-right"></i>`
    icons['divider']     = `<svg viewBox="0 0 18 18"><line x1="2" y1="9" x2="16" y2="9" stroke="currentColor" stroke-width="2"/><line x1="2" y1="4" x2="16" y2="4" stroke="currentColor" stroke-width="1" opacity=".4"/><line x1="2" y1="14" x2="16" y2="14" stroke="currentColor" stroke-width="1" opacity=".4"/></svg>`
    icons['table']       = `<i class="fa-sharp fa-solid fa-table"></i>`
    icons['fullscreen']  = `<i class="fa-sharp fa-solid fa-expand"></i>`
    icons['code-view']   = `<i class="fa-sharp fa-solid fa-code"></i>`

    // Add title tooltips to every toolbar button/picker
    nextTick(() => {
      const toolbarEl = quillContainer.value?.previousElementSibling ?? quillContainer.value?.closest('.quill-editor-wrap')?.querySelector('.ql-toolbar')
      const titleMap: Record<string, string> = {
        'ql-undo': 'Undo', 'ql-redo': 'Redo',
        'ql-bold': 'Bold', 'ql-italic': 'Italic', 'ql-underline': 'Underline', 'ql-strike': 'Strikethrough',
        'ql-blockquote': 'Blockquote', 'ql-code-block': 'Code Block', 'ql-code-view': 'Code View (HTML)',
        'ql-link': 'Insert Link', 'ql-image': 'Insert Image', 'ql-video': 'Insert Video',
        'ql-clean': 'Remove Formatting', 'ql-divider': 'Insert Divider',
        'ql-table': 'Insert Table', 'ql-fullscreen': 'Fullscreen',
        'ql-header': 'Heading', 'ql-font': 'Font Family', 'ql-size': 'Font Size',
        'ql-color': 'Text Color', 'ql-background': 'Background Color',
        'ql-align': 'Alignment', 'ql-indent': 'Indent', 'ql-list': 'List',
        'ql-script': 'Script',
      }
      if (toolbarEl) {
        toolbarEl.querySelectorAll('button, .ql-picker').forEach((el: Element) => {
          const btn = el as HTMLElement
          // Derive key from class list
          const cls = Array.from(btn.classList).find(c => c.startsWith('ql-') && c !== 'ql-picker')
          if (cls && titleMap[cls]) btn.title = titleMap[cls]
          // Alignment variants
          if (btn.classList.contains('ql-align')) {
            const val = btn.getAttribute('value') || ''
            const alignTitles: Record<string, string> = { '': 'Align Left', 'center': 'Align Center', 'right': 'Align Right', 'justify': 'Justify' }
            if (alignTitles[val]) btn.title = alignTitles[val]
          }
          // Indent variants
          if (btn.classList.contains('ql-indent')) {
            btn.title = btn.getAttribute('value') === '+1' ? 'Indent' : 'Outdent'
          }
          // List variants
          if (btn.classList.contains('ql-list')) {
            const v = btn.getAttribute('value') || ''
            const listTitles: Record<string, string> = { 'ordered': 'Ordered List', 'bullet': 'Bullet List', 'check': 'Checklist' }
            if (listTitles[v]) btn.title = listTitles[v]
          }
          // Script variants
          if (btn.classList.contains('ql-script')) {
            btn.title = btn.getAttribute('value') === 'sub' ? 'Subscript' : 'Superscript'
          }
        })
      }
    })

    quillInstance.on('text-change', () => {
      form.description = quillInstance.getSemanticHTML()
      updateWordCount()
      triggerAutoSave()
    })

    // Initial word count
    updateWordCount()
  }

  if (!adminStore.products.length) await adminStore.loadProducts()
  if (isEdit.value) {
    // 1. Try the in-memory store first (fast path)
    let p: any = adminStore.products.find(x => x.id === route.params.id || x.slug === route.params.id)
    // 2. If not found locally, fetch directly from API by id (handles direct URL navigation + page refresh)
    if (!p) {
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(String(route.params.id))}`, { cache: 'no-store' })
        if (res.ok) p = await res.json()
      } catch { /* handled below */ }
    }
    if (p) {
      Object.assign(form, {
        name: p.name, nameBn: p.nameBn ?? '', brand: p.brand,
        category: p.category, subcategory: p.subcategory ?? '',
        seller: p.seller ?? '', description: p.description ?? '',
        price: p.price, salePrice: p.salePrice ?? 0,
        stock: p.stock, deliveryDays: p.deliveryDays ?? 3, rating: p.rating ?? 4.5,
        location: p.location ?? 'Dhaka', isFeatured: p.isFeatured ?? false,
        isNew: p.isNew ?? false, images: [...(p.images ?? [])],
      })
      tagsInput.value = (p.tags ?? []).join(', ')
      currentSlug.value = p.slug ?? ''
      if (quillInstance && p.description) {
        quillInstance.clipboard.dangerouslyPasteHTML(p.description)
      }
      // Only compress if the method exists (optional optimisation)
      if (typeof api.compressImages === 'function') {
        form.images = await api.compressImages(form.images)
      }
    } else {
      formError.value = `Product not found (id: ${route.params.id})`
    }
  }
})

async function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  uploading.value = true
  try {
    for (const file of Array.from(files)) {
      const res = await api.uploadImage(file)
      form.images.push(res.url)
    }
  } catch (err: any) {
    showToast(err.message ?? 'Upload failed', 'error')
  } finally { uploading.value = false }
}

async function onDrop(e: DragEvent) {
  const files = e.dataTransfer?.files
  if (!files) return
  uploading.value = true
  try {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const res = await api.uploadImage(file)
      form.images.push(res.url)
    }
  } catch (err: any) {
    showToast(err.message ?? 'Upload failed', 'error')
  } finally { uploading.value = false }
}

async function onDescImagePick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !quillInstance) return
  if (!file.type.startsWith('image/')) { showToast('Only image files are supported', 'error'); return }
  if (file.size > 25 * 1024 * 1024)   { showToast('Image must be smaller than 25 MB', 'error'); return }

  descImgUploading.value = true
  // Insert a temporary placeholder so the user knows something is happening
  const range = quillInstance.getSelection(true)
  quillInstance.insertText(range.index, '⏳ Uploading image…', 'italic', true)
  quillInstance.setSelection(range.index + 18)

  try {
    const res = await api.uploadImage(file)
    // Remove the placeholder text then insert the real image
    quillInstance.deleteText(range.index, 18)
    quillInstance.insertEmbed(range.index, 'image', res.url, 'user')
    quillInstance.setSelection(range.index + 1)
    form.description = quillInstance.getSemanticHTML()
  } catch (err: any) {
    // Remove placeholder on failure
    quillInstance.deleteText(range.index, 18)
    showToast(err.message ?? 'Image upload failed', 'error')
  } finally {
    descImgUploading.value = false
    ;(e.target as HTMLInputElement).value = ''
  }
}

function addImageUrl() {
  const url = urlInput.value.trim()
  if (url && !form.images.includes(url)) form.images.push(url)
  urlInput.value = ''
}

function removeImage(idx: number) { form.images.splice(idx, 1) }

function moveImage(idx: number, dir: -1 | 1) {
  const to = idx + dir
  if (to < 0 || to >= form.images.length) return
  const tmp = form.images[idx]; form.images[idx] = form.images[to]; form.images[to] = tmp
}

// Generate a URL-safe slug from a product name
function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
}

async function submitForm() {
  formError.value = ''
  const resolvedCategory = form.category === '__custom__' ? customCategory.value.trim() : form.category
  if (!form.name.trim() || !form.brand.trim() || !resolvedCategory || form.price <= 0) {
    formError.value = 'Please fill all required fields.'; return
  }
  // Always include a slug so the store link and public URL work immediately
  const slug = isEdit.value ? currentSlug.value : makeSlug(form.name.trim())
  const payload = {
    name: form.name.trim(), nameBn: form.nameBn.trim() || form.name.trim(),
    brand: form.brand.trim(),
    slug,
    category: resolvedCategory, subcategory: form.subcategory.trim() || undefined,
    categoryBn: resolvedCategory,
    seller: form.seller.trim() || form.brand.trim(),
    description: form.description.trim(),
    price: form.price, salePrice: form.salePrice || 0,
    stock: form.stock, deliveryDays: form.deliveryDays || 3,
    rating: form.rating || 4.5, location: form.location.trim() || 'Dhaka',
    isFeatured: form.isFeatured, isNew: form.isNew,
    images: form.images,
    tags: tagsInput.value.split(',').map(t => t.trim()).filter(Boolean),
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await adminStore.updateProduct(String(route.params.id), payload)
      showToast(`"${form.name}" updated`)
    } else {
      const created = await adminStore.createProduct(payload)
      // Update currentSlug with the server-confirmed slug so the store link
      // on this page reflects the real URL immediately.
      if (created?.slug) currentSlug.value = created.slug
      showToast(`"${form.name}" created`)
    }
    setTimeout(() => router.push('/admin/products'), 1200)
  } catch (e: any) {
    formError.value = e.message ?? 'Save failed'
  } finally { saving.value = false }
}
</script>

<style scoped>
.pf-error-banner {
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
  color: #ef4444; border-radius: 10px; padding: 10px 14px;
  font-size: 13px; display: flex; align-items: center; gap: 8px;
  margin-bottom: 18px;
}
.pf-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 18px;
  align-items: start;
}
@media (max-width: 900px) { .pf-grid { grid-template-columns: 1fr; } }
.pf-main, .pf-side { display: flex; flex-direction: column; gap: 18px; }
.pf-card {
  background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
  border-radius: 14px; padding: 20px;
  display: flex; flex-direction: column; gap: 16px;
}
.pf-card-title {
  font-size: 13px; font-weight: 700; color: var(--text-primary);
  text-transform: uppercase; letter-spacing: 0.05em;
  padding-bottom: 10px; border-bottom: 1px solid var(--sidebar-border);
}
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-row-3 { grid-template-columns: 1fr 1fr 1fr; }
@media (max-width:600px) { .form-row,.form-row-3 { grid-template-columns: 1fr; } }
.form-group { display: flex; flex-direction: column; gap: 6px; position: relative; }
.form-label { font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
.form-hint  { font-size: 10px; color: var(--text-secondary); margin-top: 2px; }
.req { color: var(--brand); }
.form-input {
  padding: 9px 12px; background: var(--admin-bg); border: 1px solid var(--sidebar-border);
  border-radius: 9px; color: var(--text-primary); font-size: 13px; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s; width: 100%; box-sizing: border-box;
}
.form-input:focus { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(249,115,22,0.12); }
.form-textarea { resize: vertical; min-height: 90px; }
select.form-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238888a0' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px;
}
.discount-badge {
  position: absolute; bottom: -18px; left: 0;
  font-size: 10px; font-weight: 700; color: #22c55e;
}
.upload-zone {
  border: 2px dashed var(--sidebar-border); border-radius: 12px;
  padding: 24px 16px; text-align: center; cursor: pointer;
  transition: border-color 0.2s, background 0.2s; display: flex;
  flex-direction: column; align-items: center;
}
.upload-zone:hover { border-color: var(--brand); background: var(--brand-dim); }
.img-gallery { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.img-thumb-wrap { position: relative; width: 76px; height: 76px; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
.img-thumb { width: 100%; height: 100%; object-fit: cover; display: block; }
.img-primary-badge {
  position: absolute; top: 2px; left: 2px; background: var(--brand);
  color: white; font-size: 9px; font-weight: 700; padding: 2px 5px; border-radius: 4px;
}
.img-remove-btn {
  position: absolute; top: 2px; right: 2px; width: 18px; height: 18px;
  background: rgba(0,0,0,0.6); border: none; border-radius: 50%;
  color: white; font-size: 9px; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.img-move-btns {
  position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 2px;
}
.img-move-btns button {
  width: 16px; height: 16px; background: rgba(0,0,0,0.55); border: none;
  border-radius: 3px; color: white; font-size: 8px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.img-move-btns button:disabled { opacity: 0.3; cursor: default; }
.form-toggles { display: flex; gap: 20px; flex-wrap: wrap; }
.toggle-item { display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
.toggle-item input[type="checkbox"] { display: none; }
.toggle-ui { width: 38px; height: 21px; border-radius: 21px; background: var(--sidebar-border); position: relative; flex-shrink: 0; transition: background 0.2s; }
.toggle-ui::before { content: ''; position: absolute; width: 15px; height: 15px; border-radius: 50%; background: white; top: 3px; left: 3px; transition: transform 0.2s; }
.toggle-item input:checked + .toggle-ui { background: var(--brand); }
.toggle-item input:checked + .toggle-ui::before { transform: translateX(17px); }
.toggle-label { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.admin-toast {
  position: fixed; bottom: 28px; right: 28px; z-index: 10000;
  display: flex; align-items: center; gap: 10px; padding: 13px 18px;
  border-radius: 12px; font-size: 14px; font-weight: 600; color: white;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}
.admin-toast.success { background: #16a34a; }
.admin-toast.error   { background: #dc2626; }
.toast-slide-enter-active { animation: toast-in 0.25s ease; }
.toast-slide-leave-active { animation: toast-in 0.2s ease reverse; }
@keyframes toast-in { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

/* ── Quill editor theme overrides ───────────────────────────────────────── */
.quill-editor-wrap {
  border-radius: 9px;
  overflow: hidden;
  border: 1px solid var(--sidebar-border);
  position: relative;
}
.quill-editor-wrap.quill-uploading :deep(.ql-editor) { opacity: 0.45; pointer-events: none; }
.quill-upload-overlay {
  position: absolute; inset: 0; z-index: 20;
  display: flex; align-items: center; justify-content: center;
  gap: 10px; font-size: 13px; font-weight: 600; color: var(--brand);
  background: rgba(var(--admin-bg-rgb, 255,255,255), 0.7);
  backdrop-filter: blur(2px);
  pointer-events: none;
}
.quill-editor-wrap :deep(.ql-toolbar) {
  background: var(--admin-bg);
  border: none;
  border-bottom: 1px solid var(--sidebar-border);
  padding: 8px 10px;
  flex-wrap: wrap;
}
.quill-editor-wrap :deep(.ql-toolbar button),
.quill-editor-wrap :deep(.ql-toolbar .ql-picker-label) {
  color: var(--text-primary) !important;
}
.quill-editor-wrap :deep(.ql-toolbar button:hover),
.quill-editor-wrap :deep(.ql-toolbar button.ql-active) {
  color: var(--brand) !important;
}
.quill-editor-wrap :deep(.ql-toolbar .ql-stroke) { stroke: var(--text-secondary); }
.quill-editor-wrap :deep(.ql-toolbar button:hover .ql-stroke),
.quill-editor-wrap :deep(.ql-toolbar button.ql-active .ql-stroke) { stroke: var(--brand); }
.quill-editor-wrap :deep(.ql-toolbar .ql-fill) { fill: var(--text-secondary); }
.quill-editor-wrap :deep(.ql-toolbar button:hover .ql-fill),
.quill-editor-wrap :deep(.ql-toolbar button.ql-active .ql-fill) { fill: var(--brand); }
.quill-editor-wrap :deep(.ql-container) {
  background: var(--admin-bg);
  border: none;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-primary);
  min-height: 160px;
}
.quill-editor-wrap :deep(.ql-editor) { min-height: 160px; padding: 12px 14px; line-height: 1.65; }
.quill-editor-wrap :deep(.ql-editor.ql-blank::before) {
  color: var(--text-secondary);
  font-style: normal;
  font-size: 13px;
}
.quill-editor-wrap :deep(.ql-picker-options) {
  background: var(--sidebar-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}
.quill-editor-wrap :deep(.ql-picker-item) { color: var(--text-primary); }

/* ── JSON Import card ────────────────────────────────────────────────────── */
.pf-json-card {
  margin-bottom: 4px;
  padding: 0;
  gap: 0;
  overflow: hidden;
}
.pf-json-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; cursor: pointer; user-select: none;
  transition: background 0.15s;
}
.pf-json-header:hover { background: var(--brand-dim); }
.pf-json-icon {
  width: 34px; height: 34px; border-radius: 9px;
  background: var(--brand-dim); color: var(--brand);
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; flex-shrink: 0;
}
.pf-json-chevron {
  color: var(--text-secondary); font-size: 12px;
  transition: transform 0.22s ease;
}
.pf-json-chevron.open { transform: rotate(180deg); }

.pf-json-body {
  padding: 0 18px 18px;
  border-top: 1px solid var(--sidebar-border);
  display: flex; flex-direction: column; gap: 14px;
}
.pf-json-cols {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0;
  align-items: stretch;
  margin-top: 14px;
}
.pf-json-col { display: flex; flex-direction: column; gap: 8px; }
.pf-json-col-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: var(--text-secondary);
  display: flex; align-items: center; gap: 6px;
}
.pf-json-textarea {
  flex: 1; min-height: 160px; resize: vertical;
  padding: 10px 12px; background: var(--admin-bg);
  border: 1px solid var(--sidebar-border); border-radius: 9px;
  color: var(--text-primary); font-size: 11.5px; font-family: 'Fira Code', 'Cascadia Code', 'Courier New', monospace;
  line-height: 1.6; outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pf-json-textarea:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
}
.pf-json-divider {
  display: flex; align-items: center; justify-content: center;
  width: 44px; flex-shrink: 0;
}
.pf-json-divider span {
  font-size: 11px; font-weight: 700; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 0.05em;
  background: var(--sidebar-bg); padding: 4px 0;
}
.pf-json-dropzone {
  flex: 1; min-height: 160px;
  border: 2px dashed var(--sidebar-border); border-radius: 9px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; padding: 20px 12px; text-align: center;
  transition: border-color 0.2s, background 0.2s;
}
.pf-json-dropzone:hover,
.pf-json-dropzone.drag-over {
  border-color: var(--brand); background: var(--brand-dim);
}
.pf-json-error {
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.22);
  color: #ef4444; border-radius: 8px; padding: 9px 13px;
  font-size: 12px; display: flex; align-items: center; gap: 8px;
}
.pf-json-preview {
  background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.22);
  color: #16a34a; border-radius: 8px; padding: 9px 13px;
  font-size: 12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.pf-json-preview-fields {
  color: var(--text-secondary); font-size: 11px;
  background: var(--admin-bg); border-radius: 5px;
  padding: 2px 7px; border: 1px solid var(--sidebar-border);
}
.pf-json-actions {
  display: flex; justify-content: flex-end; gap: 8px;
}
/* Collapse animation */
.json-panel-enter-active { transition: all 0.22s ease; overflow: hidden; }
.json-panel-leave-active { transition: all 0.18s ease; overflow: hidden; }
.json-panel-enter-from, .json-panel-leave-to { opacity: 0; max-height: 0; }
.json-panel-enter-to, .json-panel-leave-from { opacity: 1; max-height: 600px; }

@media (max-width: 640px) {
  .pf-json-cols { grid-template-columns: 1fr; }
  .pf-json-divider { width: auto; height: 28px; }
  .pf-json-divider span { padding: 0 8px; }
}

/* ── Editor meta bar ──────────────────────────────────────────────────────── */
.qe-meta-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 5px 2px 6px;
}
.qe-word-count {
  font-size: 10.5px; color: var(--text-secondary); font-variant-numeric: tabular-nums;
}
.qe-meta-actions { display: flex; gap: 4px; }
.qe-meta-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 9px; border-radius: 7px;
  background: transparent; border: 1px solid var(--sidebar-border);
  color: var(--text-secondary); font-size: 11px; cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.qe-meta-btn:hover { background: var(--brand-dim); color: var(--brand); border-color: var(--brand); }
.qe-meta-btn.active { background: var(--brand-dim); color: var(--brand); border-color: var(--brand); }

/* ── Emoji panel ──────────────────────────────────────────────────────────── */
.qe-emoji-panel {
  display: flex; flex-wrap: wrap; gap: 2px;
  background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
  border-radius: 10px; padding: 8px; margin-bottom: 6px;
  max-height: 120px; overflow-y: auto;
}
.qe-emoji-btn {
  width: 30px; height: 30px; border: none; background: transparent;
  border-radius: 6px; font-size: 16px; cursor: pointer; line-height: 1;
  transition: background 0.12s;
}
.qe-emoji-btn:hover { background: var(--brand-dim); }

/* ── Find & Replace panel ─────────────────────────────────────────────────── */
.qe-find-panel {
  background: var(--admin-bg); border: 1px solid var(--sidebar-border);
  border-radius: 9px; padding: 10px 12px; margin-bottom: 6px;
  display: flex; flex-direction: column; gap: 8px;
}
.qe-find-row {
  display: flex; gap: 6px; align-items: center; flex-wrap: wrap;
}
.qe-find-status {
  font-size: 11px; color: var(--text-secondary);
  padding: 2px 0 0 2px;
}

/* Shared panel transition */
.qe-panel-enter-active { transition: all 0.18s ease; overflow: hidden; }
.qe-panel-leave-active { transition: all 0.14s ease; overflow: hidden; }
.qe-panel-enter-from, .qe-panel-leave-to { opacity: 0; max-height: 0; padding: 0; }
.qe-panel-enter-to, .qe-panel-leave-from { opacity: 1; max-height: 300px; }

/* ── Autosave badge ───────────────────────────────────────────────────────── */
.qe-autosave-badge {
  position: absolute; bottom: 6px; right: 10px;
  font-size: 10px; font-weight: 600; letter-spacing: 0.02em;
  padding: 2px 7px; border-radius: 5px;
  pointer-events: none; opacity: 0; transition: opacity 0.2s;
  z-index: 5;
}
.qe-autosave-badge.saving {
  background: rgba(249,115,22,0.12); color: var(--brand); opacity: 1;
}
.qe-autosave-badge.saved {
  background: rgba(34,197,94,0.12); color: #16a34a; opacity: 1;
}
.qe-autosave-badge.idle { opacity: 0; }

/* ── Fullscreen editor ────────────────────────────────────────────────────── */
.quill-editor-wrap.quill-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9000;
  border-radius: 0;
  border: none;
  display: flex;
  flex-direction: column;
  background: var(--admin-bg);
}
.quill-editor-wrap.quill-fullscreen :deep(.ql-toolbar) {
  flex-shrink: 0;
}
.quill-editor-wrap.quill-fullscreen :deep(.ql-container) {
  flex: 1;
  overflow-y: auto;
  min-height: unset;
}
.quill-editor-wrap.quill-fullscreen :deep(.ql-editor) {
  min-height: unset;
  height: 100%;
  max-width: 860px;
  margin: 0 auto;
  padding: 24px 32px;
  font-size: 15px;
}
</style>
