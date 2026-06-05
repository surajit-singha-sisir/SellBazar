<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="font-display font-bold text-2xl mb-8 flex items-center gap-2">
      <i class="fa-sharp fa-solid fa-lock text-orange-500"></i>
      Secure Checkout
    </h1>

    <!-- Empty cart -->
    <div v-if="cartStore.items.length === 0" class="text-center py-16">
      <i class="fa-sharp fa-regular fa-cart-shopping text-6xl text-[var(--color-text-muted)] mb-4 block"></i>
      <p class="text-xl font-semibold">Your cart is empty</p>
      <RouterLink to="/products" class="btn-primary mt-4 inline-flex">
        <i class="fa-sharp fa-solid fa-arrow-left"></i> Go Shopping
      </RouterLink>
    </div>

    <div v-else class="grid lg:grid-cols-3 gap-8">
      <!-- ── Left column ────────────────────────────────────────────────── -->
      <div class="lg:col-span-2 space-y-6">

        <!-- ── Guest account section (only when not logged in) ────────── -->
        <Transition name="section-fade">
          <div v-if="!authStore.isLoggedIn" class="card p-5 border-l-4 border-orange-500">
            <h2 class="font-semibold text-base mb-1 flex items-center gap-2">
              <i class="fa-sharp-duotone fa-solid fa-user-plus text-orange-500"></i>
              Create a Password to Track Your Order
            </h2>
            <p class="text-xs text-[var(--color-text-muted)] mb-4">
              Set a password to create an account automatically — so you can track this order and future ones.
              <span class="text-orange-500 font-medium">Already have an account?
                <RouterLink to="/login" class="underline">Sign in</RouterLink>
              </span>
            </p>
            <div class="grid sm:grid-cols-2 gap-4">
              <!-- Email -->
              <div>
                <label class="field-label"><i class="fa-sharp fa-regular fa-at mr-1"></i> Email *</label>
                <input v-model="form.email" @blur="touchAndCheck('email')" type="email" class="input-field"
                  :class="fieldClass('email')" placeholder="you@example.com" />
                <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
              </div>
              <!-- Password -->
              <div>
                <label class="field-label"><i class="fa-sharp fa-regular fa-lock mr-1"></i> Password *</label>
                <div class="relative">
                  <input v-model="form.password" @blur="touch('password')" :type="showPw ? 'text' : 'password'"
                    class="input-field pr-10" :class="fieldClass('password')" placeholder="Min. 8 characters" />
                  <button type="button" @click="showPw = !showPw"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition">
                    <i :class="showPw ? 'fa-sharp fa-regular fa-eye-slash' : 'fa-sharp fa-regular fa-eye'" class="text-sm"></i>
                  </button>
                </div>
                <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
                <div v-if="form.password" class="mt-1.5 flex gap-1">
                  <div v-for="i in 4" :key="i" class="h-1 flex-1 rounded-full transition-all duration-300"
                    :class="i <= pwStrength ? pwStrengthColor : 'bg-[var(--color-border)]'"></div>
                </div>
                <p v-if="form.password" class="text-[10px] mt-0.5" :class="pwStrengthTextColor">{{ pwStrengthLabel }}</p>
              </div>
            </div>
          </div>
        </Transition>

        <!-- ── Delivery Address ──────────────────────────────────────────── -->
        <div class="card p-5">
          <h2 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <i class="fa-sharp fa-regular fa-location-dot text-orange-500"></i>
            Delivery Address
          </h2>

          <!-- ── LOGGED IN + HAS SAVED ADDRESS → read-only card ───────── -->
          <template v-if="authStore.isLoggedIn && activeAddress">
            <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 space-y-2.5">
              <!-- Label badges -->
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500">
                  <i class="fa-sharp fa-solid fa-circle-check text-[9px]"></i>
                  {{ activeAddress.label ?? 'Saved Address' }}
                </span>
                <span v-if="activeAddress.isDefault"
                  class="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--color-text-muted)] px-2 py-0.5 rounded-full border border-[var(--color-border)]">
                  <i class="fa-sharp fa-solid fa-star text-yellow-400 text-[9px]"></i> Default
                </span>
              </div>

              <!-- Address details -->
              <div class="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                <div class="flex items-center gap-2">
                  <i class="fa-sharp fa-regular fa-user text-[var(--color-text-muted)] w-4 shrink-0"></i>
                  <span class="font-medium">{{ activeAddress.recipientName }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="fa-sharp fa-regular fa-mobile-screen-button text-[var(--color-text-muted)] w-4 shrink-0"></i>
                  <span>{{ activeAddress.phone }}</span>
                </div>
                <div class="flex items-center gap-2 sm:col-span-2">
                  <i class="fa-sharp fa-regular fa-location-dot text-[var(--color-text-muted)] w-4 shrink-0"></i>
                  <span class="text-[var(--color-text-muted)]">
                    {{ [activeAddress.addressLine, activeAddress.upazila, activeAddress.district, activeAddress.division].filter(Boolean).join(', ') }}<template v-if="activeAddress.postalCode"> – {{ activeAddress.postalCode }}</template>
                  </span>
                </div>
              </div>

              <!-- Address switcher (only if multiple saved) -->
              <div v-if="savedAddresses.length > 1" class="pt-1">
                <p class="text-[10px] text-[var(--color-text-muted)] mb-1.5 font-medium uppercase tracking-wider">
                  <i class="fa-sharp fa-regular fa-layer-group mr-1"></i>Switch address
                </p>
                <div class="flex flex-wrap gap-2">
                  <button v-for="addr in savedAddresses" :key="addr.id"
                    @click="selectedAddressId = addr.id"
                    class="text-xs px-3 py-1.5 rounded-lg border transition"
                    :class="selectedAddressId === addr.id
                      ? 'border-orange-500 bg-orange-500/8 text-orange-600 font-medium'
                      : 'border-[var(--color-border)] hover:border-orange-300 text-[var(--color-text-muted)]'">
                    <i class="fa-sharp fa-solid fa-location-dot mr-1 text-[10px]"></i>
                    {{ addr.label }} — {{ addr.district }}
                  </button>
                </div>
              </div>

              <!-- Profile link -->
              <div class="pt-1 border-t border-[var(--color-border)]">
                <RouterLink to="/account/profile"
                  class="inline-flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-600 transition font-medium">
                  <i class="fa-sharp fa-regular fa-pen-to-square text-[11px]"></i>
                  Update delivery address in your profile
                  <i class="fa-sharp fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                </RouterLink>
              </div>
            </div>
          </template>

          <!-- ── LOGGED IN + NO SAVED ADDRESS → partial form ───────────── -->
          <template v-else-if="authStore.isLoggedIn && !activeAddress">
            <div class="flex items-start gap-2 mb-4 text-xs text-amber-600 bg-amber-500/8 border border-amber-400/25 rounded-xl px-3 py-2.5">
              <i class="fa-sharp fa-solid fa-triangle-exclamation mt-0.5 shrink-0"></i>
              <span>
                No delivery address found on your account. Please fill in the missing fields below, or
                <RouterLink to="/account/profile" class="underline font-medium hover:text-amber-700">add one in your profile</RouterLink>.
              </span>
            </div>
            <div class="grid sm:grid-cols-2 gap-4">
              <!-- Full Name: editable only if not prefilled -->
              <div v-if="!prefillName">
                <label class="field-label"><i class="fa-sharp fa-regular fa-user mr-1"></i> Full Name *</label>
                <input v-model="form.name" @blur="touch('name')" class="input-field" :class="fieldClass('name')" placeholder="Your full name" />
                <p v-if="errors.name" class="field-error">{{ errors.name }}</p>
              </div>
              <div v-else class="flex flex-col justify-end">
                <label class="field-label"><i class="fa-sharp fa-regular fa-user mr-1"></i> Full Name</label>
                <div class="input-field bg-[var(--color-surface-2)] text-[var(--color-text-muted)] cursor-default select-none">{{ form.name }}</div>
              </div>

              <!-- Phone: editable only if not prefilled -->
              <div v-if="!prefillPhone">
                <label class="field-label"><i class="fa-sharp fa-regular fa-mobile-screen-button mr-1"></i> Phone *</label>
                <input v-model="form.phone" @blur="touch('phone')" class="input-field" :class="fieldClass('phone')" placeholder="01XXXXXXXXX" />
                <p v-if="errors.phone" class="field-error">{{ errors.phone }}</p>
              </div>
              <div v-else class="flex flex-col justify-end">
                <label class="field-label"><i class="fa-sharp fa-regular fa-mobile-screen-button mr-1"></i> Phone</label>
                <div class="input-field bg-[var(--color-surface-2)] text-[var(--color-text-muted)] cursor-default select-none">{{ form.phone }}</div>
              </div>

              <div>
                <label class="field-label"><i class="fa-sharp fa-regular fa-map mr-1"></i> Division *</label>
                <select v-model="form.division" @change="form.district = ''; touch('division')" class="input-field" :class="fieldClass('division')">
                  <option value="">Select Division</option>
                  <option v-for="d in Object.keys(bdDistricts)" :key="d" :value="d">{{ d }}</option>
                </select>
                <p v-if="errors.division" class="field-error">{{ errors.division }}</p>
              </div>
              <div>
                <label class="field-label"><i class="fa-sharp fa-regular fa-location-crosshairs mr-1"></i> District *</label>
                <select v-model="form.district" @change="touch('district')" class="input-field" :class="fieldClass('district')" :disabled="!form.division">
                  <option value="">{{ form.division ? 'Select District' : 'Select Division first' }}</option>
                  <option v-for="d in districtOptions" :key="d" :value="d">{{ d }}</option>
                </select>
                <p v-if="errors.district" class="field-error">{{ errors.district }}</p>
              </div>
              <div>
                <label class="field-label"><i class="fa-sharp fa-regular fa-building mr-1"></i> Upazila / Thana</label>
                <input v-model="form.upazila" class="input-field" placeholder="Upazila or Thana" />
              </div>
              <div>
                <label class="field-label"><i class="fa-sharp fa-regular fa-envelope mr-1"></i> Postal Code</label>
                <input v-model="form.postal" @blur="touch('postal')" class="input-field" :class="fieldClass('postal')" placeholder="e.g. 1200" maxlength="4" />
                <p v-if="errors.postal" class="field-error">{{ errors.postal }}</p>
              </div>
              <div class="sm:col-span-2">
                <label class="field-label"><i class="fa-sharp fa-regular fa-house mr-1"></i> Full Address *</label>
                <textarea v-model="form.address" @blur="touch('address')" class="input-field resize-none" :class="fieldClass('address')" rows="2"
                  placeholder="House no., road, area, landmark..."></textarea>
                <p v-if="errors.address" class="field-error">{{ errors.address }}</p>
              </div>
            </div>
          </template>

          <!-- ── GUEST → full form ─────────────────────────────────────── -->
          <template v-else>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="field-label"><i class="fa-sharp fa-regular fa-user mr-1"></i> Full Name *</label>
                <input v-model="form.name" @blur="touch('name')" class="input-field" :class="fieldClass('name')" placeholder="Your full name" />
                <p v-if="errors.name" class="field-error">{{ errors.name }}</p>
              </div>
              <div>
                <label class="field-label"><i class="fa-sharp fa-regular fa-mobile-screen-button mr-1"></i> Phone *</label>
                <input v-model="form.phone" @blur="touchAndCheck('phone')" class="input-field" :class="fieldClass('phone')" placeholder="01XXXXXXXXX" />
                <p v-if="errors.phone" class="field-error">{{ errors.phone }}</p>
              </div>
              <div>
                <label class="field-label"><i class="fa-sharp fa-regular fa-map mr-1"></i> Division *</label>
                <select v-model="form.division" @change="form.district = ''; touch('division')" class="input-field" :class="fieldClass('division')">
                  <option value="">Select Division</option>
                  <option v-for="d in Object.keys(bdDistricts)" :key="d" :value="d">{{ d }}</option>
                </select>
                <p v-if="errors.division" class="field-error">{{ errors.division }}</p>
              </div>
              <div>
                <label class="field-label"><i class="fa-sharp fa-regular fa-location-crosshairs mr-1"></i> District *</label>
                <select v-model="form.district" @change="touch('district')" class="input-field" :class="fieldClass('district')" :disabled="!form.division">
                  <option value="">{{ form.division ? 'Select District' : 'Select Division first' }}</option>
                  <option v-for="d in districtOptions" :key="d" :value="d">{{ d }}</option>
                </select>
                <p v-if="errors.district" class="field-error">{{ errors.district }}</p>
              </div>
              <div>
                <label class="field-label"><i class="fa-sharp fa-regular fa-building mr-1"></i> Upazila / Thana</label>
                <input v-model="form.upazila" class="input-field" placeholder="Upazila or Thana" />
              </div>
              <div>
                <label class="field-label"><i class="fa-sharp fa-regular fa-envelope mr-1"></i> Postal Code</label>
                <input v-model="form.postal" @blur="touch('postal')" class="input-field" :class="fieldClass('postal')" placeholder="e.g. 1200" maxlength="4" />
                <p v-if="errors.postal" class="field-error">{{ errors.postal }}</p>
              </div>
              <div class="sm:col-span-2">
                <label class="field-label"><i class="fa-sharp fa-regular fa-house mr-1"></i> Full Address *</label>
                <textarea v-model="form.address" @blur="touch('address')" class="input-field resize-none" :class="fieldClass('address')" rows="2"
                  placeholder="House no., road, area, landmark..."></textarea>
                <p v-if="errors.address" class="field-error">{{ errors.address }}</p>
              </div>
            </div>
          </template>
        </div>

        <!-- ── Payment Method ──────────────────────────────────────────── -->
        <div class="card p-5">
          <h2 class="font-semibold text-lg mb-4 flex items-center gap-2">
            <i class="fa-sharp fa-regular fa-credit-card text-orange-500"></i>
            Payment Method
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <label v-for="pm in paymentMethods" :key="pm.id"
              class="flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition"
              :class="form.payment === pm.id ? 'border-orange-500 bg-orange-500/5' : 'border-[var(--color-border)] hover:border-orange-300'">
              <input type="radio" v-model="form.payment" :value="pm.id" class="hidden" />
              <i :class="pm.icon + ' text-2xl'" :style="`color:${pm.color}`"></i>
              <span class="text-xs font-medium text-center">{{ pm.name }}</span>
            </label>
          </div>
          <div v-if="['bkash','nagad','rocket'].includes(form.payment)" class="mt-4">
            <label class="field-label">
              <i class="fa-sharp fa-regular fa-mobile-screen-button mr-1"></i>
              {{ { bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket' }[form.payment] }} Number *
            </label>
            <input v-model="form.mobileNum" @blur="touch('mobileNum')" class="input-field" :class="fieldClass('mobileNum')" placeholder="01XXXXXXXXX" />
            <p v-if="errors.mobileNum" class="field-error">{{ errors.mobileNum }}</p>
          </div>
        </div>
      </div>

      <!-- ── Order Summary ─────────────────────────────────────────────── -->
      <div class="space-y-4">
        <div class="card p-5 sticky top-24 space-y-4">
          <h2 class="font-display font-bold text-lg">
            <i class="fa-sharp fa-regular fa-receipt text-orange-400 mr-2"></i>Order Summary
          </h2>

          <!-- Items list with delete -->
          <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
            <TransitionGroup name="item-fade">
              <div v-for="item in cartStore.items" :key="item.id"
                class="flex gap-3 items-center group rounded-xl p-1.5 hover:bg-[var(--color-surface-2)] transition">
                <img :src="item.images[0]" class="w-11 h-11 rounded-lg object-cover bg-[var(--color-surface-2)] shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium line-clamp-1">{{ item.name }}</p>
                  <p class="text-xs text-[var(--color-text-muted)]">x {{ item.quantity }}</p>
                </div>
                <span class="text-xs font-bold shrink-0">{{ ((item.salePrice ?? item.price) * item.quantity).toLocaleString() }}</span>
                <button @click="cartStore.remove(item.id)"
                  class="w-6 h-6 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-red-500/10 hover:text-red-500 transition opacity-0 group-hover:opacity-100 shrink-0"
                  title="Remove item">
                  <i class="fa-sharp fa-solid fa-xmark text-[11px]"></i>
                </button>
              </div>
            </TransitionGroup>
          </div>

          <div class="divider"></div>

          <!-- Coupon input -->
          <div>
            <p class="text-xs font-medium text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5">
              <i class="fa-sharp fa-regular fa-ticket text-orange-500"></i> Coupon Code
            </p>
            <div v-if="!couponApplied" class="flex gap-2">
              <input v-model="couponInput" @keyup.enter="applyCoupon" type="text"
                class="input-field flex-1 text-sm uppercase tracking-wider" :class="couponError ? 'input-error' : ''"
                placeholder="Enter code" maxlength="20" />
              <button @click="applyCoupon" :disabled="!couponInput.trim()"
                class="btn-secondary px-3 text-sm shrink-0 disabled:opacity-50">Apply</button>
            </div>
            <p v-if="couponError" class="field-error mt-1">{{ couponError }}</p>
            <div v-if="couponApplied"
              class="flex items-center justify-between bg-green-500/8 border border-green-500/25 rounded-xl px-3 py-2">
              <div class="flex items-center gap-2 text-green-600 text-sm">
                <i class="fa-sharp fa-solid fa-circle-check text-xs"></i>
                <span class="font-semibold uppercase tracking-wide">{{ couponCode }}</span>
                <span class="text-xs font-normal">- {{ couponLabel }}</span>
              </div>
              <button @click="removeCoupon" class="text-xs text-[var(--color-text-muted)] hover:text-red-500 transition ml-2">
                <i class="fa-sharp fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Totals -->
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-[var(--color-text-muted)]">Subtotal</span>
              <span>{{ cartStore.saleTotal.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-green-600">
              <span><i class="fa-sharp fa-solid fa-truck text-xs mr-1"></i>Delivery</span>
              <span class="font-medium">FREE</span>
            </div>
            <div v-if="cartStore.savings > 0" class="flex justify-between text-green-600">
              <span><i class="fa-sharp fa-solid fa-tag text-xs mr-1"></i>Savings</span>
              <span>-{{ cartStore.savings.toLocaleString() }}</span>
            </div>
            <Transition name="coupon-slide">
              <div v-if="couponApplied && couponDiscount > 0" class="flex justify-between text-orange-600 font-medium">
                <span><i class="fa-sharp fa-solid fa-ticket text-xs mr-1"></i>Coupon</span>
                <span>-{{ couponDiscount.toLocaleString() }}</span>
              </div>
            </Transition>
          </div>

          <div class="divider"></div>

          <div class="flex justify-between font-bold text-xl">
            <span>Total</span>
            <span class="gradient-text">{{ finalTotal.toLocaleString() }}</span>
          </div>

          <Transition name="coupon-slide">
            <div v-if="submitError"
              class="flex items-start gap-2 text-xs text-red-600 bg-red-500/8 border border-red-400/25 rounded-xl px-3 py-2.5">
              <i class="fa-sharp fa-solid fa-circle-exclamation mt-0.5 shrink-0"></i>
              <span>{{ submitError }}</span>
            </div>
          </Transition>

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
          <p class="text-[var(--color-text-muted)] text-sm">
            Your order <strong class="text-[var(--color-text)]">{{ orderId }}</strong> has been confirmed.<br/>
            Estimated delivery in <strong>2-3 business days</strong>.
          </p>
          <div v-if="autoRegistered" class="bg-green-500/8 border border-green-500/20 rounded-xl px-4 py-3 text-xs text-green-600 text-left">
            <i class="fa-sharp fa-solid fa-user-check mr-2"></i>
            <strong>Account created!</strong> You can now log in with your email and password to track all orders.
          </div>
          <RouterLink to="/account/orders" @click="success = false" class="btn-primary w-full justify-center">
            <i class="fa-sharp fa-solid fa-magnifying-glass"></i> Track My Order
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
import { ref, computed, watch } from 'vue'
import { useCartStore } from '@/stores/useCartStore'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Address } from '@/types'

const cartStore  = useCartStore()
const authStore  = useAuthStore()
const placing    = ref(false)
const success    = ref(false)
const orderId    = ref('')
const showPw     = ref(false)
const autoRegistered = ref(false)
const submitError    = ref('')

const serverErrors = ref<Record<string, string>>({})

// ── Saved addresses ───────────────────────────────────────────────────────────
const savedAddresses = computed<Address[]>(() => authStore.user?.addresses ?? [])

const selectedAddressId = ref<string>(
  savedAddresses.value.find(a => a.isDefault)?.id ?? savedAddresses.value[0]?.id ?? ''
)

const activeAddress = computed<Address | null>(() =>
  savedAddresses.value.find(a => a.id === selectedAddressId.value) ?? savedAddresses.value[0] ?? null
)

const prefillName  = computed(() => !!(authStore.user?.name?.trim()))
const prefillPhone = computed(() => {
  const phones = authStore.user?.phones
  if (phones && phones.length > 0) return true
  return !!(authStore.user?.phone?.trim())
})

// ── Coupon ────────────────────────────────────────────────────────────────────
const COUPONS: Record<string, { type: 'percent' | 'flat'; value: number; label: string }> = {
  'SAVE10':    { type: 'percent', value: 10,  label: '10% off' },
  'SAVE20':    { type: 'percent', value: 20,  label: '20% off' },
  'FLAT100':   { type: 'flat',    value: 100, label: '৳100 off' },
  'FLAT500':   { type: 'flat',    value: 500, label: '৳500 off' },
  'WELCOME50': { type: 'percent', value: 50,  label: '50% off (welcome gift)' },
  'EID2025':   { type: 'percent', value: 15,  label: '15% Eid special' },
}

const couponInput    = ref('')
const couponCode     = ref('')
const couponLabel    = ref('')
const couponError    = ref('')
const couponApplied  = ref(false)
const couponDiscount = computed(() => {
  if (!couponApplied.value || !couponCode.value) return 0
  const c = COUPONS[couponCode.value]
  if (!c) return 0
  if (c.type === 'flat') return Math.min(c.value, cartStore.saleTotal)
  return Math.round(cartStore.saleTotal * c.value / 100)
})
const finalTotal = computed(() => Math.max(0, cartStore.saleTotal - couponDiscount.value))

function applyCoupon() {
  couponError.value = ''
  const code = couponInput.value.trim().toUpperCase()
  if (!code) return
  const found = COUPONS[code]
  if (!found) { couponError.value = 'Invalid coupon code. Please check and try again.'; return }
  couponCode.value = code; couponLabel.value = found.label; couponApplied.value = true; couponInput.value = ''
}
function removeCoupon() {
  couponCode.value = ''; couponLabel.value = ''; couponApplied.value = false
  couponError.value = ''; couponInput.value = ''
}

// ── Form state ────────────────────────────────────────────────────────────────
const form = ref({
  email: '', password: '',
  name: '', phone: '', division: '', district: '',
  upazila: '', postal: '', address: '',
  payment: 'bkash', mobileNum: '',
})

if (authStore.isLoggedIn && authStore.user) {
  const u = authStore.user
  form.value.name     = u.name  ?? ''
  form.value.email    = u.email ?? ''
  form.value.phone    = u.phones?.find((p: any) => p.isPrimary)?.number ?? u.phone ?? ''
  form.value.division = u.division ?? ''
}

watch(activeAddress, (addr) => {
  if (!addr) return
  form.value.name     = addr.recipientName || form.value.name
  form.value.phone    = addr.phone         || form.value.phone
  form.value.division = addr.division
  form.value.district = addr.district
  form.value.upazila  = addr.upazila
  form.value.postal   = addr.postalCode
  form.value.address  = addr.addressLine
}, { immediate: true })

// ── Touched fields ────────────────────────────────────────────────────────────
const touched = ref<Record<string, boolean>>({})
function touch(field: string) {
  touched.value[field] = true
  if (serverErrors.value[field]) delete serverErrors.value[field]
}

// ── Regex patterns ────────────────────────────────────────────────────────────
const bdPhone  = /^(?:\+?880|0)?1[3-9]\d{8}$/
const postalRe = /^\d{4}$/
const emailRe  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const nameRe   = /^[A-Za-z\u0980-\u09FF\s'-]{2,60}$/
const strongPw = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

// ── Computed errors ───────────────────────────────────────────────────────────
const errors = computed(() => {
  const e: Record<string, string> = { ...serverErrors.value }

  if (!authStore.isLoggedIn) {
    if (touched.value.email) {
      if (!form.value.email) e.email = 'Email is required'
      else if (!emailRe.test(form.value.email)) e.email = 'Enter a valid email address'
    }
    if (touched.value.password) {
      if (!form.value.password) e.password = 'Password is required'
      else if (!strongPw.test(form.value.password)) e.password = 'Min. 8 chars with at least 1 letter & 1 number'
    }
  }

  if (authStore.isLoggedIn && activeAddress.value) return e

  if (touched.value.name) {
    if (!form.value.name) e.name = 'Full name is required'
    else if (!nameRe.test(form.value.name)) e.name = 'Name must be 2–60 letters (no special characters)'
  }
  if (touched.value.phone) {
    if (!form.value.phone) e.phone = 'Phone number is required'
    else if (!bdPhone.test(form.value.phone)) e.phone = 'Enter a valid BD number (e.g. 01712345678)'
  }
  if (touched.value.division && !form.value.division) e.division = 'Please select a division'
  if (touched.value.district && !form.value.district) e.district = 'Please select a district'
  if (touched.value.postal && form.value.postal && !postalRe.test(form.value.postal))
    e.postal = 'Postal code must be 4 digits'
  if (touched.value.address && !form.value.address) e.address = 'Full address is required'

  if (touched.value.mobileNum && ['bkash','nagad','rocket'].includes(form.value.payment)) {
    if (!form.value.mobileNum) e.mobileNum = 'Payment number is required'
    else if (!bdPhone.test(form.value.mobileNum)) e.mobileNum = 'Enter a valid BD number'
  }
  return e
})

function fieldClass(field: string) {
  if (!touched.value[field]) return ''
  return errors.value[field] ? 'input-error' : 'input-ok'
}

// ── Password strength ─────────────────────────────────────────────────────────
const pwStrength = computed(() => {
  const p = form.value.password
  if (!p) return 0
  let s = 0
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p)) s++
  if (/\d/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return s
})
const pwStrengthColor     = computed(() => ['','bg-red-400','bg-orange-400','bg-yellow-400','bg-green-500'][pwStrength.value])
const pwStrengthTextColor = computed(() => ['','text-red-500','text-orange-500','text-yellow-500','text-green-500'][pwStrength.value])
const pwStrengthLabel     = computed(() => ['','Too weak','Weak','Fair','Strong'][pwStrength.value])

// ── BD Districts ──────────────────────────────────────────────────────────────
const bdDistricts: Record<string, string[]> = {
  'Dhaka':      ['Dhaka','Gazipur','Narayanganj','Narsingdi','Manikganj','Munshiganj','Rajbari','Madaripur','Shariatpur','Faridpur','Gopalganj','Kishoreganj','Tangail'],
  'Chittagong': ["Chattogram","Cox's Bazar",'Feni','Comilla','Brahmanbaria','Chandpur','Lakshmipur','Noakhali','Khagrachhari','Rangamati','Bandarban'],
  'Rajshahi':   ['Rajshahi','Natore','Bogra','Naogaon','Chapainawabganj','Sirajganj','Pabna','Joypurhat'],
  'Khulna':     ['Khulna','Jessore','Satkhira','Bagerhat','Narail','Meherpur','Chuadanga','Magura','Kushtia','Jhenaidah'],
  'Barisal':    ['Barishal','Pirojpur','Patuakhali','Bhola','Borguna','Jhalokati'],
  'Sylhet':     ['Sylhet','Moulvibazar','Habiganj','Sunamganj'],
  'Rangpur':    ['Rangpur','Dinajpur','Kurigram','Gaibandha','Lalmonirhat','Nilphamari','Thakurgaon','Panchagarh'],
  'Mymensingh': ['Mymensingh','Jamalpur','Sherpur','Netrokona'],
}
const districtOptions = computed(() => form.value.division ? bdDistricts[form.value.division] ?? [] : [])

// ── Payment methods ───────────────────────────────────────────────────────────
const paymentMethods = [
  { id: 'bkash',  name: 'bKash',            icon: 'fa-sharp fa-solid fa-mobile-screen-button', color: '#e2136e' },
  { id: 'nagad',  name: 'Nagad',            icon: 'fa-sharp fa-solid fa-wallet',               color: '#f7931e' },
  { id: 'rocket', name: 'Rocket',           icon: 'fa-sharp fa-solid fa-rocket',               color: '#8b3fcd' },
  { id: 'card',   name: 'Debit / Credit',   icon: 'fa-sharp fa-regular fa-credit-card',        color: '#1a1f71' },
  { id: 'upay',   name: 'Upay',             icon: 'fa-sharp fa-solid fa-building-columns',     color: '#005baa' },
  { id: 'cod',    name: 'Cash on Delivery', icon: 'fa-sharp fa-solid fa-money-bill-wave',      color: '#22c55e' },
]

const API = '/api'

// ── Real-time duplicate check ─────────────────────────────────────────────────
async function checkDuplicate(field: 'email' | 'phone') {
  if (authStore.isLoggedIn) return
  const value = field === 'email' ? form.value.email : form.value.phone
  if (errors.value[field]) return
  if (!value) return
  try {
    const res = await fetch(`${API}/auth/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    if (res.status === 409) {
      const data = await res.json()
      serverErrors.value[field] = data.error + ' — ' +
        (field === 'email' ? 'please sign in instead.' : 'use a different number or sign in.')
      touched.value[field] = true
    }
  } catch { /* network error — validate at submit */ }
}

function touchAndCheck(field: 'email' | 'phone') { touch(field); checkDuplicate(field) }

function validateAll(): boolean {
  if (authStore.isLoggedIn && activeAddress.value) {
    if (['bkash','nagad','rocket'].includes(form.value.payment)) {
      touched.value.mobileNum = true
    }
    return Object.keys(errors.value).length === 0
  }
  const fields = ['name','phone','division','district','address']
  if (!authStore.isLoggedIn) fields.push('email','password')
  if (form.value.postal) fields.push('postal')
  if (['bkash','nagad','rocket'].includes(form.value.payment)) fields.push('mobileNum')
  fields.forEach(f => { touched.value[f] = true })
  return Object.keys(errors.value).length === 0
}

// ── Place order ───────────────────────────────────────────────────────────────
async function placeOrder() {
  if (!validateAll()) return
  placing.value = true
  submitError.value = ''
  try {
    // Auto-register guest user
    if (!authStore.isLoggedIn) {
      const regRes = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     form.value.name,
          email:    form.value.email,
          phone:    form.value.phone,
          division: form.value.division,
          password: form.value.password,
        }),
      })
      const regData = await regRes.json()
      if (regRes.status === 409) {
        if (regData.field) {
          serverErrors.value[regData.field] = regData.error + ' — please sign in instead.'
          touched.value[regData.field] = true
        }
        placing.value = false
        return
      }
      if (!regRes.ok) {
        submitError.value = regData.error ?? 'Registration failed. Please try again.'
        placing.value = false
        return
      }
      // FIX: pass BOTH user and token — authStore.login(user, token) requires two arguments
      await authStore.login(regData.user, regData.token)
      autoRegistered.value = true
    }

    // Build full address string — prefer the active saved address
    let fullAddress: string
    if (activeAddress.value) {
      const a = activeAddress.value
      fullAddress = [a.addressLine, a.upazila, a.district, a.division, a.postalCode ? `- ${a.postalCode}` : ''].filter(Boolean).join(', ')
    } else {
      fullAddress = [form.value.address, form.value.upazila, form.value.district, form.value.division, form.value.postal ? `- ${form.value.postal}` : ''].filter(Boolean).join(', ')
    }

    const recipientName  = activeAddress.value?.recipientName  || form.value.name
    const recipientPhone = activeAddress.value?.phone          || form.value.phone

    const payload = {
      customer: {
        name:    recipientName,
        email:   authStore.user?.email ?? form.value.email,
        phone:   recipientPhone,
        address: fullAddress,
      },
      items: cartStore.items.map(i => ({
        productId: String(i.id),
        name:      i.name,
        quantity:  i.quantity,
        price:     i.salePrice ?? i.price,
        image:     i.images?.[0] ?? '',
      })),
      subtotal:      cartStore.saleTotal,
      shipping:      0,
      discount:      couponDiscount.value,
      couponCode:    couponCode.value || null,
      total:         finalTotal.value,
      paymentMethod: form.value.payment,
      notes:         '',
    }

    const orderHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
    if (authStore.token) orderHeaders['Authorization'] = `Bearer ${authStore.token}`

    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: orderHeaders,
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      submitError.value = errData.error ?? `Server error ${res.status} — please try again.`
      placing.value = false
      return
    }
    const order = await res.json()
    orderId.value = order.id
    const saved: string[] = JSON.parse(localStorage.getItem('sb-order-ids') ?? '[]')
    saved.unshift(order.id)
    localStorage.setItem('sb-order-ids', JSON.stringify(saved))
    cartStore.clear()
    success.value = true
  } catch (err: any) {
    const msg: string = err?.message ?? ''
    if (/fetch|failed to fetch/i.test(msg) || !msg) {
      submitError.value = 'Could not reach the server. Please check your connection and try again.'
    } else {
      submitError.value = msg
    }
  } finally {
    placing.value = false
  }
}
</script>

<style scoped>
.field-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--color-text-muted);
  margin-bottom: 0.25rem;
}
.field-error {
  font-size: 0.68rem;
  color: #ef4444;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 4px;
}
.field-error::before { content: '⚠'; font-size: 10px; }

:deep(.input-error) {
  border-color: #ef4444 !important;
  background-color: rgba(239,68,68,0.04) !important;
}
:deep(.input-ok) {
  border-color: #22c55e !important;
}

.section-fade-enter-active { transition: all 0.35s ease; }
.section-fade-leave-active { transition: all 0.25s ease; }
.section-fade-enter-from, .section-fade-leave-to { opacity: 0; transform: translateY(-8px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.animate-slide-in-up { animation: slideInUp 0.4s ease; }
@keyframes slideInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.item-fade-enter-active { transition: all 0.25s ease; }
.item-fade-leave-active { transition: all 0.2s ease; }
.item-fade-enter-from   { opacity: 0; transform: translateX(-8px); }
.item-fade-leave-to     { opacity: 0; transform: translateX(8px); height: 0; margin: 0; padding: 0; }

.coupon-slide-enter-active { transition: all 0.3s ease; }
.coupon-slide-leave-active { transition: all 0.2s ease; }
.coupon-slide-enter-from, .coupon-slide-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
