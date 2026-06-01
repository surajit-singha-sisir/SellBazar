<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="font-display font-bold text-2xl mb-8 flex items-center gap-2">
      <i class="fa-sharp fa-solid fa-lock text-orange-500"></i>
      Secure Checkout
    </h1>

    <div v-if="cartStore.items.length === 0" class="text-center py-16">
      <i class="fa-sharp fa-regular fa-cart-shopping text-6xl text-[var(--color-text-muted)] mb-4 block"></i>
      <p class="text-xl font-semibold">Your cart is empty</p>
      <RouterLink to="/products" class="btn-primary mt-4 inline-flex">
        <i class="fa-sharp fa-solid fa-arrow-left"></i> Go Shopping
      </RouterLink>
    </div>

    <div v-else class="grid lg:grid-cols-3 gap-8">
      <!-- ── Checkout Form ───────────────────────────────────────────── -->
      <div class="lg:col-span-2 space-y-6">

        <!-- Delivery Address -->
        <div class="card p-5">
          <h2 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <i class="fa-sharp fa-regular fa-location-dot text-orange-500"></i>
            Delivery Address
          </h2>
          <div class="grid sm:grid-cols-2 gap-4">
            <!-- Full Name -->
            <div>
              <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">
                <i class="fa-sharp fa-regular fa-user mr-1"></i> Full Name *
              </label>
              <input v-model="form.name" class="input-field" placeholder="Your full name" />
            </div>
            <!-- Phone -->
            <div>
              <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">
                <i class="fa-sharp fa-regular fa-mobile-screen-button mr-1"></i> Phone *
              </label>
              <input v-model="form.phone" class="input-field" placeholder="+880 1XXX-XXXXXX" />
            </div>
            <!-- Division -->
            <div>
              <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">
                <i class="fa-sharp fa-regular fa-map mr-1"></i> Division *
              </label>
              <select v-model="form.division" @change="form.district = ''" class="input-field">
                <option value="">Select Division</option>
                <option v-for="d in Object.keys(bdDistricts)" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <!-- District (dynamic dropdown) -->
            <div>
              <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">
                <i class="fa-sharp fa-regular fa-location-crosshairs mr-1"></i> District *
              </label>
              <select v-model="form.district" class="input-field" :disabled="!form.division">
                <option value="">{{ form.division ? 'Select District' : 'Select Division first' }}</option>
                <option v-for="d in districtOptions" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <!-- Upazila -->
            <div>
              <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">
                <i class="fa-sharp fa-regular fa-building mr-1"></i> Upazila / Thana
              </label>
              <input v-model="form.upazila" class="input-field" placeholder="Upazila or Thana" />
            </div>
            <!-- Postal Code -->
            <div>
              <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">
                <i class="fa-sharp fa-regular fa-envelope mr-1"></i> Postal Code
              </label>
              <input v-model="form.postal" class="input-field" placeholder="e.g. 1200" />
            </div>
            <!-- Full Address -->
            <div class="sm:col-span-2">
              <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">
                <i class="fa-sharp fa-regular fa-house mr-1"></i> Full Address *
              </label>
              <textarea v-model="form.address" class="input-field resize-none" rows="2"
                placeholder="House no., road, area, landmark..."></textarea>
            </div>
          </div>
        </div>

        <!-- Payment Method -->
        <div class="card p-5">
          <h2 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <i class="fa-sharp fa-regular fa-credit-card text-orange-500"></i>
            Payment Method
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <label
              v-for="pm in paymentMethods" :key="pm.id"
              class="flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition"
              :class="form.payment === pm.id
                ? 'border-orange-500 bg-orange-500/5'
                : 'border-[var(--color-border)] hover:border-orange-300'"
            >
              <input type="radio" v-model="form.payment" :value="pm.id" class="hidden" />
              <i :class="pm.icon + ' text-2xl'" :style="`color:${pm.color}`"></i>
              <span class="text-xs font-medium text-center">{{ pm.name }}</span>
            </label>
          </div>
          <!-- Mobile number if MFS selected -->
          <div v-if="['bkash','nagad','rocket'].includes(form.payment)" class="mt-4">
            <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">
              <i class="fa-sharp fa-regular fa-mobile-screen-button mr-1"></i>
              {{ { bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket' }[form.payment] }} Number *
            </label>
            <input v-model="form.mobileNum" class="input-field" placeholder="+880 1XXX-XXXXXX" />
          </div>
        </div>

      </div>

      <!-- ── Order Summary ───────────────────────────────────────────── -->
      <div class="space-y-4">
        <div class="card p-5 sticky top-24 space-y-4">
          <h2 class="font-display font-bold text-lg">
            <i class="fa-sharp fa-regular fa-receipt text-orange-400 mr-2"></i>Order Summary
          </h2>
          <div class="space-y-3 max-h-48 overflow-y-auto pr-1">
            <div v-for="item in cartStore.items" :key="item.id" class="flex gap-3 items-center">
              <img :src="item.images[0]" class="w-12 h-12 rounded-lg object-cover bg-[var(--color-surface-2)] shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium line-clamp-1">{{ item.name }}</p>
                <p class="text-xs text-[var(--color-text-muted)]">× {{ item.quantity }}</p>
              </div>
              <span class="text-xs font-bold">৳{{ ((item.salePrice ?? item.price) * item.quantity).toLocaleString() }}</span>
            </div>
          </div>
          <div class="divider"></div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-[var(--color-text-muted)]">Subtotal</span>
              <span>৳{{ cartStore.saleTotal.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-green-600">
              <span><i class="fa-sharp fa-solid fa-truck text-xs mr-1"></i>Delivery</span>
              <span class="font-medium">FREE</span>
            </div>
            <div v-if="cartStore.savings > 0" class="flex justify-between text-green-600">
              <span><i class="fa-sharp fa-solid fa-tag text-xs mr-1"></i>Savings</span>
              <span>-৳{{ cartStore.savings.toLocaleString() }}</span>
            </div>
          </div>
          <div class="divider"></div>
          <div class="flex justify-between font-bold text-xl">
            <span>Total</span>
            <span class="gradient-text">৳{{ cartStore.saleTotal.toLocaleString() }}</span>
          </div>
          <button @click="placeOrder" :disabled="placing"
            class="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-60">
            <i class="fa-sharp fa-solid fa-circle-check"></i>
            {{ placing ? 'Placing Order...' : 'Place Order' }}
          </button>
          <p class="text-center text-xs text-[var(--color-text-muted)]">
            <i class="fa-sharp fa-solid fa-shield-halved text-green-500 mr-1"></i>
            100% Secure & Encrypted
          </p>
        </div>
      </div>
    </div>

    <!-- ── Success Modal ───────────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="success" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="card p-8 max-w-sm w-full text-center space-y-4 animate-slide-in-up">
          <div class="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <i class="fa-sharp fa-solid fa-circle-check text-4xl text-green-500"></i>
          </div>
          <h2 class="font-display font-extrabold text-2xl">Order Placed!</h2>
          <p class="text-[var(--color-text-muted)]">
            Your order <strong>{{ orderId }}</strong> has been confirmed.<br/>
            Estimated delivery in <strong>2-3 business days</strong>.
          </p>
          <RouterLink to="/account/orders" @click="success = false" class="btn-primary w-full justify-center">
            <i class="fa-sharp fa-solid fa-box"></i> Track My Order
          </RouterLink>
          <RouterLink to="/" @click="success = false" class="btn-ghost w-full justify-center">
            <i class="fa-sharp fa-solid fa-house"></i> Continue Shopping
          </RouterLink>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCartStore } from '@/stores/useCartStore'

const cartStore = useCartStore()
const placing = ref(false)
const success  = ref(false)
const orderId  = ref('')

const form = ref({
  name: '', phone: '', division: '', district: '',
  upazila: '', postal: '', address: '',
  payment: 'bkash', mobileNum: '',
})

// ── Bangladesh districts by division ────────────────────────────────────────
const bdDistricts: Record<string, string[]> = {
  'Dhaka': [
    'Dhaka', 'Gazipur', 'Narayanganj', 'Narsingdi', 'Manikganj',
    'Munshiganj', 'Rajbari', 'Madaripur', 'Shariatpur', 'Faridpur',
    'Gopalganj', 'Kishoreganj', 'Tangail',
  ],
  'Chittagong': [
    'Chattogram', 'Cox\'s Bazar', 'Feni', 'Comilla', 'Brahmanbaria',
    'Chandpur', 'Lakshmipur', 'Noakhali', 'Khagrachhari', 'Rangamati',
    'Bandarban',
  ],
  'Rajshahi': [
    'Rajshahi', 'Natore', 'Bogra', 'Naogaon', 'Chapainawabganj',
    'Sirajganj', 'Pabna', 'Joypurhat',
  ],
  'Khulna': [
    'Khulna', 'Jessore', 'Satkhira', 'Bagerhat', 'Narail',
    'Meherpur', 'Chuadanga', 'Magura', 'Kushtia', 'Jhenaidah',
  ],
  'Barisal': [
    'Barishal', 'Pirojpur', 'Patuakhali', 'Bhola', 'Borguna', 'Jhalokati',
  ],
  'Sylhet': [
    'Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj',
  ],
  'Rangpur': [
    'Rangpur', 'Dinajpur', 'Kurigram', 'Gaibandha', 'Lalmonirhat',
    'Nilphamari', 'Thakurgaon', 'Panchagarh',
  ],
  'Mymensingh': [
    'Mymensingh', 'Jamalpur', 'Sherpur', 'Netrokona',
  ],
}

const districtOptions = computed(() =>
  form.value.division ? bdDistricts[form.value.division] ?? [] : []
)

// ── Payment Methods with FontAwesome icons ───────────────────────────────────
const paymentMethods = [
  { id: 'bkash',  name: 'bKash',            icon: 'fa-sharp fa-solid fa-mobile-screen-button', color: '#e2136e' },
  { id: 'nagad',  name: 'Nagad',            icon: 'fa-sharp fa-solid fa-wallet',               color: '#f7931e' },
  { id: 'rocket', name: 'Rocket',           icon: 'fa-sharp fa-solid fa-rocket',               color: '#8b3fcd' },
  { id: 'card',   name: 'Debit / Credit',   icon: 'fa-sharp fa-regular fa-credit-card',        color: '#1a1f71' },
  { id: 'upay',   name: 'Upay',             icon: 'fa-sharp fa-solid fa-building-columns',     color: '#005baa' },
  { id: 'cod',    name: 'Cash on Delivery', icon: 'fa-sharp fa-solid fa-money-bill-wave',      color: '#22c55e' },
]

async function placeOrder() {
  if (!form.value.name || !form.value.phone || !form.value.division || !form.value.district) {
    alert('Please fill in all required fields (Name, Phone, Division, District)')
    return
  }
  placing.value = true
  await new Promise(r => setTimeout(r, 1500))
  orderId.value = `SB-${Date.now().toString().slice(-6)}`
  cartStore.clear()
  placing.value = false
  success.value = true
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.animate-slide-in-up { animation: slideInUp 0.4s ease; }
@keyframes slideInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
