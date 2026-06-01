<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
    <h1 class="font-display font-bold text-2xl mb-6 flex items-center gap-2">
      <i class="fa-sharp fa-regular fa-box text-orange-500"></i>
      My Orders
    </h1>

    <div class="space-y-4">
      <div v-for="order in orders" :key="order.id"
        class="card p-5 hover:shadow-md transition">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="font-bold text-sm">{{ order.id }}</span>
              <span :class="statusClass(order.status)" class="badge text-[10px] uppercase tracking-wide">{{ order.status }}</span>
            </div>
            <p class="text-xs text-[var(--color-text-muted)]">{{ formatDate(order.createdAt) }}</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-orange-500">৳{{ order.total.toLocaleString() }}</p>
            <p class="text-xs text-[var(--color-text-muted)] mt-0.5 capitalize">
              <i class="fa-sharp fa-regular fa-credit-card mr-1"></i>{{ order.paymentMethod }}
            </p>
          </div>
        </div>
        <div class="divider my-3"></div>
        <div class="space-y-1.5">
          <div v-for="item in order.items" :key="item.name" class="flex items-center justify-between text-sm">
            <span class="text-[var(--color-text-2)]">{{ item.name }} × {{ item.quantity }}</span>
            <span class="font-medium">৳{{ (item.price * item.quantity).toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <div v-if="orders.length === 0" class="text-center py-16">
        <div class="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
          <i class="fa-sharp fa-regular fa-box text-3xl text-orange-500"></i>
        </div>
        <h2 class="font-display font-bold text-xl">No orders yet</h2>
        <p class="text-[var(--color-text-muted)] text-sm mt-2">When you place an order, it will appear here</p>
        <RouterLink to="/products" class="btn-primary mt-4 inline-flex">Start Shopping</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const orders = [
  { id: 'SB-240001', items: [{ name: 'Samsung Galaxy A55', quantity: 1, price: 39999 }], total: 39999, status: 'delivered', paymentMethod: 'bkash', createdAt: '2027-01-15T10:00:00Z' },
  { id: 'SB-240002', items: [{ name: 'Jamdani Muslin Saree', quantity: 2, price: 7200 }], total: 14400, status: 'shipped', paymentMethod: 'cod', createdAt: '2027-01-20T14:00:00Z' },
  { id: 'SB-240003', items: [{ name: 'PRAN Mango Juice 1L', quantity: 6, price: 99 }], total: 594, status: 'processing', paymentMethod: 'nagad', createdAt: '2027-01-25T09:00:00Z' },
]

const statusMap: Record<string, string> = {
  delivered:  'badge-green',
  shipped:    'badge-brand',
  processing: 'badge-purple',
  pending:    'badge-red',
  cancelled:  'badge-red',
}

function statusClass(s: string) { return statusMap[s] ?? 'badge-brand' }
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-BD', { year:'numeric', month:'long', day:'numeric' })
}
</script>
