<template>
  <div class="ib-wrap">
    <!-- Header -->
    <div class="ib-header">
      <div>
        <h1 class="page-title">Icon Browser</h1>
        <p class="page-subtitle">FontAwesome 6 Pro — search, filter & copy class names</p>
      </div>
      <div class="ib-header-right">
        <span class="ib-count">{{ filteredIcons.length }} icons</span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="ib-toolbar">
      <!-- Search -->
      <div class="ib-search-wrap">
        <i class="fa-sharp fa-solid fa-magnifying-glass ib-search-icon"></i>
        <input
          v-model="query"
          class="ib-search"
          placeholder="Search icons… (e.g. arrow, house, cart)"
          @input="page = 1"
        />
        <button v-if="query" class="ib-search-clear" @click="query = ''; page = 1">
          <i class="fa-sharp fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Style filter -->
      <div class="ib-style-tabs">
        <button
          v-for="s in styles"
          :key="s.key"
          class="ib-style-tab"
          :class="{ active: activeStyle === s.key }"
          @click="activeStyle = s.key; page = 1"
          :title="s.label"
        >
          <i :class="s.preview"></i>
          <span>{{ s.label }}</span>
        </button>
      </div>

      <!-- Size slider -->
      <div class="ib-size-row">
        <i class="fa-sharp fa-solid fa-text-size" style="opacity:.5;font-size:11px"></i>
        <input type="range" min="16" max="64" step="4" v-model.number="iconSize" class="ib-slider" />
        <span class="ib-size-label">{{ iconSize }}px</span>
      </div>
    </div>

    <!-- Grid -->
    <div v-if="filteredIcons.length" class="ib-grid" :style="`--icon-sz: ${iconSize}px`">
      <button
        v-for="icon in pagedIcons"
        :key="icon.name + activeStyle"
        class="ib-tile"
        :class="{ copied: lastCopied === buildClass(icon.name) }"
        @click="copyClass(icon.name)"
        :title="buildClass(icon.name)"
      >
        <i :class="buildClass(icon.name)" class="ib-tile-icon"></i>
        <span class="ib-tile-name">{{ icon.name }}</span>
        <span class="ib-copy-badge"><i class="fa-sharp fa-solid fa-copy"></i> Copied!</span>
      </button>
    </div>
    <div v-else class="ib-empty">
      <i class="fa-sharp fa-regular fa-face-thinking" style="font-size:40px;opacity:.25;margin-bottom:10px"></i>
      <div>No icons match <strong>"{{ query }}"</strong></div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="ib-pagination">
      <button class="ib-page-btn" :disabled="page <= 1" @click="page--">
        <i class="fa-sharp fa-solid fa-chevron-left"></i>
      </button>
      <button
        v-for="p in pageNumbers"
        :key="p"
        class="ib-page-btn"
        :class="{ active: p === page, ellipsis: p === '…' }"
        :disabled="p === '…'"
        @click="typeof p === 'number' && (page = p)"
      >{{ p }}</button>
      <button class="ib-page-btn" :disabled="page >= totalPages" @click="page++">
        <i class="fa-sharp fa-solid fa-chevron-right"></i>
      </button>
    </div>

    <!-- Detail panel (bottom) -->
    <Teleport to="body">
      <Transition name="ib-toast">
        <div v-if="toastMsg" class="ib-toast">
          <i class="fa-sharp fa-solid fa-circle-check"></i>
          {{ toastMsg }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// ── Style definitions ────────────────────────────────────────────────────────
const styles = [
  { key: 'sharp-solid',            label: 'Sharp Solid',          prefix: 'fa-sharp fa-solid'                        },
  { key: 'sharp-regular',          label: 'Sharp Regular',        prefix: 'fa-sharp fa-regular'                      },
  { key: 'sharp-light',            label: 'Sharp Light',          prefix: 'fa-sharp fa-light'                        },
  { key: 'sharp-thin',             label: 'Sharp Thin',           prefix: 'fa-sharp fa-thin'                         },
  { key: 'solid',                  label: 'Solid',                prefix: 'fa-solid'                                 },
  { key: 'regular',                label: 'Regular',              prefix: 'fa-regular'                               },
  { key: 'light',                  label: 'Light',                prefix: 'fa-light'                                 },
  { key: 'thin',                   label: 'Thin',                 prefix: 'fa-thin'                                  },
  { key: 'duotone',                label: 'Duotone',              prefix: 'fa-duotone fa-solid'                      },
  { key: 'duotone-light',          label: 'Duotone Light',        prefix: 'fa-duotone fa-light'                      },
  { key: 'duotone-regular',        label: 'Duotone Regular',      prefix: 'fa-duotone fa-regular'                    },
  { key: 'duotone-thin',           label: 'Duotone Thin',         prefix: 'fa-duotone fa-thin'                       },
  { key: 'sharp-duotone-solid',    label: 'Sharp Duotone Solid',  prefix: 'fa-sharp-duotone fa-solid'                },
  { key: 'sharp-duotone-regular',  label: 'Sharp Duotone Regular',prefix: 'fa-sharp-duotone fa-regular'              },
  { key: 'sharp-duotone-light',    label: 'Sharp Duotone Light',  prefix: 'fa-sharp-duotone fa-light'                },
  { key: 'sharp-duotone-thin',     label: 'Sharp Duotone Thin',   prefix: 'fa-sharp-duotone fa-thin'                 },
]

// Add preview class using the style's own prefix
styles.forEach(s => (s as any).preview = `${s.prefix} fa-star`)

const activeStyle = ref('sharp-solid')
const currentPrefix = computed(() => styles.find(s => s.key === activeStyle.value)?.prefix ?? 'fa-sharp fa-solid')

function buildClass(name: string) {
  return `${currentPrefix.value} fa-${name}`
}

// ── Icon list ─────────────────────────────────────────────────────────────────
// FA6 Pro icon names (comprehensive subset of ~1500+ icons)
const ALL_ICONS = [
  // Interface & Actions
  'xmark','check','plus','minus','magnifying-glass','gear','gears','sliders','filter','sort',
  'arrow-left','arrow-right','arrow-up','arrow-down','arrows-rotate','arrow-up-right-from-square',
  'chevron-left','chevron-right','chevron-up','chevron-down','chevrons-left','chevrons-right',
  'angle-left','angle-right','angle-up','angle-down','angles-left','angles-right',
  'caret-left','caret-right','caret-up','caret-down',
  'bars','grid','grid-2','grid-round','list','list-ul','list-ol','table',
  'eye','eye-slash','lock','lock-open','key','key-skeleton',
  'pen','pen-to-square','pencil','eraser','scissors','copy','paste','clone',
  'trash','trash-can','trash-arrow-up','archive','box-archive',
  'share','share-nodes','share-from-square','download','upload','cloud-arrow-up','cloud-arrow-down',
  'link','link-slash','paperclip','at','hashtag',
  'bell','bell-slash','bell-on','bell-ring',
  'bookmark','bookmark-slash','flag','flag-swallowtail',
  'heart','heart-crack','heart-pulse','star','star-half','star-half-stroke',
  'thumbs-up','thumbs-down','hand','hand-wave','hand-point-right','hands-clapping',
  'rotate','rotate-left','rotate-right','undo','redo',
  'maximize','minimize','expand','compress','up-right-and-down-left-from-center',
  'ellipsis','ellipsis-vertical','ellipsis-stroke','circle-ellipsis',
  'circle-check','circle-xmark','circle-plus','circle-minus','circle-info','circle-question',
  'circle-exclamation','circle-notch','circle-dot','circle-dashed',
  'square','square-check','square-xmark','square-plus','square-minus',
  'triangle-exclamation','octagon-exclamation','diamond-exclamation',
  'info','question','exclamation',
  'spinner','spinner-third','loader','circle-quarter','circle-half-stroke',
  'power-off','ban','circle','dot-circle',
  // Navigation & Layout
  'house','house-blank','house-chimney','house-user','house-crack','house-circle-check',
  'map','map-location','map-location-dot','map-pin','location-dot','location-pin','location-crosshairs',
  'compass','compass-drafting','route','road','signs-post','sign-post',
  'globe','globe-americas','globe-europe','globe-asia','earth-americas',
  'sitemap','network-wired','diagram-project','diagram-nested',
  'window-maximize','window-minimize','window-restore','browsers',
  'sidebar','sidebar-flip','panel-ews','panel-top',
  // Commerce & Shopping
  'store','store-slash','shop','shop-slash','bag-shopping','bag-plus','bag-minus','bag-check',
  'cart-shopping','cart-plus','cart-arrow-down','cart-flatbed','cart-circle-check',
  'basket-shopping','basket-arrow-up','basket-arrow-down',
  'tag','tags','ticket','receipt','invoice','file-invoice','file-invoice-dollar',
  'credit-card','money-bill','money-bill-wave','money-bills','money-check','money-check-dollar',
  'coin','coins','dollar-sign','euro-sign','sterling-sign','bangladeshi-taka-sign',
  'wallet','piggy-bank','vault','safe','cash-register',
  'truck','truck-fast','truck-arrow-right','truck-clock','truck-droplet',
  'box','box-open','boxes-stacked','boxes-packing','package','gift','gifts',
  'qrcode','barcode','scanner','scanner-gun','scanner-keyboard','scanner-touchscreen',
  'percent','percentage','badge-percent','badge-dollar','sale',
  // People & Social
  'user','user-plus','user-minus','user-check','user-xmark','user-pen','user-gear',
  'user-tie','user-crown','user-nurse','user-doctor','user-graduate','user-astronaut',
  'users','users-gear','user-group','people-group','person','person-dress',
  'child','child-reaching','children','baby','person-pregnant','family',
  'face-smile','face-grin','face-laugh','face-sad-cry','face-meh','face-angry',
  'face-thinking','face-surprised','face-flushed','face-grimace','face-kiss',
  'id-card','id-badge','address-card','address-book','contact-card',
  // Communication
  'envelope','envelope-open','envelope-dot','envelope-circle-check','mailbox',
  'phone','phone-volume','phone-arrow-down-left','phone-arrow-up-right','phone-slash',
  'mobile','mobile-screen','mobile-button','tablet','tablet-screen-button',
  'comment','comments','comment-dots','comment-check','message','messages',
  'video','video-slash','camera-web','microphone','microphone-slash',
  'paper-plane','paper-plane-top','send','rss','broadcast-tower',
  'chat-bubble','megaphone','bullhorn','speaker','volume','volume-high',
  // Technology
  'laptop','laptop-code','laptop-mobile','laptop-file','computer','desktop','display',
  'server','database','hard-drive','memory','microchip','cpu','gpu-card',
  'wifi','signal','signal-bars','bluetooth','usb','plug','plug-circle-check',
  'keyboard','mouse','headphones','headphones-simple','airpods',
  'camera','camera-retro','image','images','photo-film',
  'print','scanner','fax','typewriter',
  'code','code-branch','code-commit','code-compare','code-fork','code-merge','code-pull-request',
  'terminal','command','hashtag','bug','bug-slash','spider','robot',
  'cloud','cloud-check','cloud-plus','cloud-minus','cloud-bolt','cloud-sun','cloud-rain',
  'satellite','satellite-dish','tower-broadcast','tower-cell','router','modem',
  'lock','lock-keyhole','lock-open','shield','shield-check','shield-halved','shield-plus',
  // Files & Documents
  'file','file-plus','file-minus','file-check','file-xmark','file-pen','file-magnifying-glass',
  'file-text','file-code','file-image','file-video','file-audio','file-pdf','file-word',
  'file-excel','file-powerpoint','file-csv','file-zip','file-arrow-down','file-arrow-up',
  'folder','folder-open','folder-plus','folder-minus','folder-check','folder-tree',
  'clipboard','clipboard-check','clipboard-list','clipboard-question','notepad',
  'newspaper','book','book-open','books','bookmark','scroll','file-lines',
  'pen-nib','pen-clip','feather','feather-pointed','typewriter','typewriter-alt',
  // Charts & Analytics
  'chart-bar','chart-bar-horizontal','chart-line','chart-area','chart-pie','chart-donut',
  'chart-scatter','chart-mixed','chart-candlestick','chart-gantt','chart-waterfall',
  'trending-up','trending-down','arrow-trend-up','arrow-trend-down',
  'chart-simple','chart-simple-horizontal','chart-column','chart-network',
  'square-poll-vertical','square-poll-horizontal',
  // Health & Medical
  'heart-pulse','stethoscope','syringe','pills','capsules','prescription-bottle',
  'hospital','hospital-user','clinic-medical','ambulance','wheelchair',
  'tooth','lungs','brain','bone','eye','ear','hand-dots',
  'bandage','kit-medical','briefcase-medical','notes-medical',
  'face-mask','virus','bacteria','biohazard','radiation',
  // Nature & Weather
  'sun','moon','star','cloud','wind','snowflake','fire','fire-flame-curved',
  'bolt','bolt-lightning','rainbow','umbrella','tornado','hurricane',
  'tree','trees','seedling','leaf','flower','flower-tulip','rose',
  'mountain','mountains','island-tropical','beach-umbrella',
  'cat','dog','fish','bird','crow','dove','duck','elephant','horse','hippo',
  'spider','bug','worm','mosquito','locust','ant',
  'paw','claw-marks','feather',
  // Food & Drink
  'utensils','spoon','fork','knife','plate-utensils','bowl-food','bowl-hot','bowl-rice',
  'burger','pizza-slice','hot-dog','taco','burrito','sandwich','salad','bacon',
  'egg','carrot','apple-whole','lemon','banana','pepper-hot','garlic','onion',
  'wheat-awn','corn','mushroom','jar','bottle-water','bottle-droplet',
  'mug-hot','mug-saucer','coffee','wine-glass','martini-glass','beer-mug',
  'cookie','cookie-bite','cake-candles','candy-bar','ice-cream','candy-cane',
  // Sports & Fitness
  'dumbbell','weight-hanging','weight-scale','person-running','person-walking',
  'person-biking','person-swimming','person-skiing','person-skating','person-hiking',
  'football','basketball','baseball','soccer-ball','volleyball','tennis-ball',
  'baseball-bat-ball','futbol','golf-ball-tee','hockey-puck','bowling-ball','billiard',
  'medal','trophy','award','ranking-star','ribbon',
  'bicycle','stopwatch','whistle','ticket-simple',
  // Travel & Places
  'plane','plane-departure','plane-arrival','plane-circle-check','plane-slash',
  'train','train-subway','bus','taxi','car','car-side','car-rear','car-burst',
  'ship','sailboat','ferry','helicopter','rocket',
  'hotel','building','buildings','city','landmark','monument','tower-observation',
  'passport','suitcase','suitcase-rolling','luggage-cart','map-marked',
  // Home & Living
  'couch','bed','bath','shower','sink','toilet','door-open','door-closed',
  'lamp','lamp-desk','lamp-floor','lightbulb','lightbulb-on','lightbulb-slash',
  'sofa','chair','table-picnic','kitchen-set','refrigerator','washer','dryer',
  'fan','air-conditioner','fire-extinguisher','smoke-detector','cctv','house-lock',
  'broom','mop','vacuum','trash-can','recycle','leaf-maple',
  // Business & Office
  'briefcase','briefcase-blank','bag-briefcase','building-columns',
  'handshake','handshake-slash','handshake-angle','hands-holding','deal',
  'presentation-screen','projector','whiteboard','chalkboard','chalkboard-user',
  'calendar','calendar-days','calendar-check','calendar-plus','calendar-xmark',
  'clock','clock-rotate-left','clock-desk','alarm-clock','hourglass','hourglass-half',
  'calculator','abacus','ruler','ruler-combined','ruler-horizontal','ruler-vertical',
  'staple','stapler','paperclip','rubber-band','thumbtack','push-pin',
  'inbox','inbox-full','inbox-in','inbox-out','mailbox-flag-up',
  // Symbols & Misc
  'copyright','registered','trademark','circle-r','circle-c','circle-t',
  'infinity','percent','amp','ampersand','equals','not-equal','greater-than','less-than',
  'asterisk','plus-minus','divide','xmarks-lines','sigma','pi',
  'palette','paintbrush','paintbrush-fine','brush','spray-can','fill','fill-drip',
  'wand-magic','wand-magic-sparkles','sparkle','sparkles','stars','galaxy',
  'atom','atom-simple','dna','flask','flask-vial','vial','vials','microscope',
  'magnet','battery-full','battery-half','battery-empty','battery-bolt',
  'music','music-note','music-note-slash','headphones','microphone','radio','drum',
  'gamepad','gamepad-modern','joystick','chess','chess-pawn','chess-king','chess-queen',
  'dice','dice-d20','dice-six','playing-card','clubs','diamonds','spades','hearts',
  'watch','watch-smart','ring','gem','crown','hat-cowboy','glasses','sunglasses',
].map(name => ({ name }))

// ── State ────────────────────────────────────────────────────────────────────
const query       = ref('')
const page        = ref(1)
const iconSize    = ref(28)
const lastCopied  = ref('')
const toastMsg    = ref('')
let toastTimer    = 0

const PER_PAGE = 120

const filteredIcons = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return ALL_ICONS
  return ALL_ICONS.filter(i => i.name.includes(q))
})

const totalPages = computed(() => Math.ceil(filteredIcons.value.length / PER_PAGE))

const pagedIcons = computed(() => {
  const start = (page.value - 1) * PER_PAGE
  return filteredIcons.value.slice(start, start + PER_PAGE)
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur   = page.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | string)[] = [1]
  if (cur > 3) pages.push('…')
  for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p)
  if (cur < total - 2) pages.push('…')
  pages.push(total)
  return pages
})

// ── Copy ──────────────────────────────────────────────────────────────────────
async function copyClass(name: string) {
  const cls = buildClass(name)
  try {
    await navigator.clipboard.writeText(cls)
  } catch {
    const el = document.createElement('textarea')
    el.value = cls; document.body.appendChild(el); el.select()
    document.execCommand('copy'); document.body.removeChild(el)
  }
  lastCopied.value = cls
  toastMsg.value = `Copied: ${cls}`
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toastMsg.value = ''
    lastCopied.value = ''
  }, 2000)
}
</script>

<style scoped>
.ib-wrap {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Header ── */
.ib-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.ib-header-right { display: flex; align-items: center; gap: 10px; }
.ib-count {
  font-size: 12px; font-weight: 600; color: var(--text-secondary);
  background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
  padding: 4px 10px; border-radius: 20px;
}

/* ── Toolbar ── */
.ib-toolbar {
  background: var(--sidebar-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ib-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.ib-search-icon {
  position: absolute; left: 12px;
  font-size: 13px; color: var(--text-secondary); pointer-events: none;
}
.ib-search {
  width: 100%; padding: 9px 36px 9px 36px;
  background: var(--admin-bg); border: 1px solid var(--sidebar-border);
  border-radius: 9px; color: var(--text-primary); font-size: 13px;
  outline: none; transition: border-color 0.15s, box-shadow 0.15s;
}
.ib-search:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
}
.ib-search-clear {
  position: absolute; right: 10px;
  background: none; border: none; cursor: pointer;
  color: var(--text-secondary); font-size: 12px; padding: 4px;
  border-radius: 4px;
  transition: color 0.15s;
}
.ib-search-clear:hover { color: var(--text-primary); }

/* ── Style tabs ── */
.ib-style-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ib-style-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 8px;
  border: 1px solid var(--sidebar-border);
  background: var(--admin-bg); color: var(--text-secondary);
  font-size: 12px; font-weight: 500; cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.ib-style-tab i { font-size: 13px; }
.ib-style-tab:hover { border-color: var(--brand); color: var(--text-primary); }
.ib-style-tab.active {
  background: var(--brand); border-color: var(--brand);
  color: #fff; font-weight: 600;
}

/* ── Size row ── */
.ib-size-row {
  display: flex; align-items: center; gap: 10px;
}
.ib-slider {
  flex: 1; max-width: 200px;
  accent-color: var(--brand);
  cursor: pointer;
}
.ib-size-label {
  font-size: 11px; font-weight: 600;
  color: var(--text-secondary);
  min-width: 32px;
}

/* ── Icon grid ── */
.ib-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(var(--icon-sz) * 3.6), 1fr));
  gap: 6px;
}
.ib-tile {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; padding: 14px 6px 10px;
  background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
  border-radius: 10px; cursor: pointer; position: relative; overflow: hidden;
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
  min-height: calc(var(--icon-sz) * 2.8);
}
.ib-tile:hover {
  border-color: var(--brand);
  background: var(--brand-dim, rgba(249,115,22,0.06));
  transform: translateY(-1px);
}
.ib-tile.copied {
  border-color: #22c55e;
  background: rgba(34,197,94,0.08);
}
.ib-tile-icon {
  font-size: var(--icon-sz);
  color: var(--text-primary);
  line-height: 1;
  transition: color 0.15s;
}
.ib-tile:hover .ib-tile-icon { color: var(--brand); }
.ib-tile.copied .ib-tile-icon { color: #22c55e; }

.ib-tile-name {
  font-size: 10px; color: var(--text-secondary);
  text-align: center; word-break: break-all; line-height: 1.3;
  max-width: 100%;
}
.ib-copy-badge {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(34,197,94,0.92);
  color: #fff; font-size: 12px; font-weight: 700;
  border-radius: 10px; gap: 5px;
  opacity: 0; transition: opacity 0.15s;
  pointer-events: none;
}
.ib-tile.copied .ib-copy-badge { opacity: 1; }

/* ── Empty ── */
.ib-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 60px 20px;
  color: var(--text-secondary); font-size: 14px;
  background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
  border-radius: 14px; gap: 6px;
}

/* ── Pagination ── */
.ib-pagination {
  display: flex; align-items: center; justify-content: center; gap: 4px; flex-wrap: wrap;
}
.ib-page-btn {
  min-width: 34px; height: 34px; padding: 0 10px;
  border: 1px solid var(--sidebar-border);
  background: var(--sidebar-bg); border-radius: 8px;
  color: var(--text-secondary); font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.ib-page-btn:hover:not(:disabled) {
  border-color: var(--brand); color: var(--brand);
}
.ib-page-btn.active {
  background: var(--brand); border-color: var(--brand);
  color: #fff; font-weight: 700;
}
.ib-page-btn:disabled { opacity: 0.35; cursor: default; }
.ib-page-btn.ellipsis { cursor: default; border-color: transparent; background: transparent; }

/* ── Toast ── */
.ib-toast {
  position: fixed; bottom: 28px; right: 28px; z-index: 10000;
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px; border-radius: 12px;
  background: #16a34a; color: #fff;
  font-size: 13px; font-weight: 600;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  max-width: calc(100vw - 56px);
  word-break: break-all;
}
.ib-toast-enter-active { animation: ib-toast-in 0.22s ease; }
.ib-toast-leave-active { animation: ib-toast-in 0.18s ease reverse; }
@keyframes ib-toast-in {
  from { transform: translateY(12px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
</style>
