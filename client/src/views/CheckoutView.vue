<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="font-display font-bold text-2xl mb-8 flex items-center gap-2">
      <i class="fa-sharp fa-solid fa-lock text-orange-500"></i>
      Secure Checkout
    </h1>

    <div v-if="cartStore.items.length === 0" class="text-center py-16">
      <p class="text-xl font-semibold">Your cart is empty</p>
      <RouterLink to="/products" class="btn-primary mt-4 inline-flex">Go Shopping</RouterLink>
    </div>

    <div v-else class="grid lg:grid-cols-3 gap-8">
      <!-- Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Delivery info -->
        <div class="card p-5">
          <h2 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <i class="fa-sharp fa-regular fa-location-dot text-orange-500"></i>
            Delivery Address
          </h2>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Full Name *</label>
              <input v-model="form.name" class="input-field" placeholder="Your full name" />
            </div>
            <div>
              <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Phone *</label>
              <input v-model="form.phone" class="input-field" placeholder="+880 1XXX-XXXXXX" />
            </div>
            <div>
              <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Division *</label>
              <select v-model="form.division" class="input-field">
                <option value="">Select Division</option>
                <option v-for="d in divisions" :key="d">{{ d }}</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">District *</label>
              <input v-model="form.district" class="input-field" placeholder="Your district" />
            </div>
            <div class="sm:col-span-2">
              <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Full Address *</label>
              <textarea v-model="form.address" class="input-field resize-none" rows="2" placeholder="House, road, area..."></textarea>
            </div>
          </div>
        </div>

        <!-- Payment method -->
        <div class="card p-5">
          <h2 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <i class="fa-sharp fa-regular fa-credit-card text-orange-500"></i>
            Payment Method
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <label
              v-for="pm in paymentMethods" :key="pm.id"
              class="flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition"
              :class="form.payment === pm.id ? 'border-orange-500 bg-orange-500/5' : 'border-[var(--color-border)] hover:border-orange-300'"
            >
              <input type="radio" v-model="form.payment" :value="pm.id" class="hidden" />
              <span class="text-2xl">{{ pm.icon }}</span>
              <span class="text-xs font-medium">{{ pm.name }}</span>
            </label>
          </div>
          <!-- bKash number if selected -->
          <div v-if="form.payment === 'bkash' || form.payment === 'nagad'" class="mt-4">
            <label class="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">{{ form.payment === 'bkash' ? 'bKash' : 'Nagad' }} Number *</label>
            <input v-model="form.mobileNum" class="input-field" placeholder="+880 1XXX-XXXXXX" />
          </div>
        </div>
      </div>

      <!-- Order summary -->
      <div class="space-y-4">
        <div class="card p-5 sticky top-24 space-y-4">
          <h2 class="font-display font-bold text-lg">Order Summary</h2>
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
            <div class="flex justify-between"><span class="text-[var(--color-text-muted)]">Subtotal</span><span>৳{{ cartStore.saleTotal.toLocaleString() }}</span></div>
            <div class="flex justify-between text-green-600"><span>Delivery</span><span class="font-medium">FREE</span></div>
            <div v-if="cartStore.savings > 0" class="flex justify-between text-green-600"><span>Savings</span><span>-৳{{ cartStore.savings.toLocaleString() }}</span></div>
          </div>
          <div class="divider"></div>
          <div class="flex justify-between font-bold text-xl">
            <span>Total</span>
            <span class="gradient-text">৳{{ cartStore.saleTotal.toLocaleString() }}</span>
          </div>
          <button @click="placeOrder" :disabled="placing" class="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-60">
            <i class="fa-sharp fa-solid fa-check"></i>
            {{ placing ? 'Placing...' : 'Place Order' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Success modal -->
    <Transition name="fade">
      <div v-if="success" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="card p-8 max-w-sm w-full text-center space-y-4 animate-slide-in-up">
          <div class="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <i class="fa-sharp fa-solid fa-circle-check text-4xl text-green-500"></i>
          </div>
          <h2 class="font-display font-extrabold text-2xl">Order Placed!</h2>
          <p class="text-[var(--color-text-muted)]">Your order <strong>{{ orderId }}</strong> has been confirmed. You'll receive delivery in <strong>2-3 days</strong>.</p>
          <RouterLink to="/account/orders" @click="success = false" class="btn-primary w-full justify-center">Track My Order</RouterLink>
          <RouterLink to="/" @click="success = false" class="btn-ghost w-full justify-center">Continue Shopping</RouterLink>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCartStore } from '@/stores/useCartStore'

const cartStore = useCartStore()
const placing = ref(false)
const success = ref(false)
const orderId = ref('')

const form = ref({ name: '', phone: '', division: '', district: '', address: '', payment: 'bkash', mobileNum: '' })
const divisions = ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh']
const paymentMethods = [
  { id: 'bkash',  name: 'bKash',   icon: '📱' },
  { id: 'nagad',  name: 'Nagad',   icon: '💳' },
  { id: 'rocket', name: 'Rocket',  icon: '🚀' },
  { id: 'card',   name: 'Card',    icon: '💵' },
  { id: 'cod',    name: 'Cash on Delivery', icon: '💰' },
]

async function placeOrder() {
  if (!form.value.name || !form.value.phone || !form.value.division) {
    alert('Please fill in all required fields')
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
@keyframes slideInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
</style>
