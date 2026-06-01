<template>
  <footer class="bg-[var(--color-surface)] border-t border-[var(--color-border)] mt-16">
    <!-- Main footer grid -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">

      <!-- Brand -->
      <div class="col-span-2 lg:col-span-1">
        <RouterLink to="/" class="flex items-center gap-2.5 mb-4">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-fuchsia-600 flex items-center justify-center">
            <i class="fa-sharp fa-solid fa-store text-white text-sm"></i>
          </div>
          <div class="font-display font-extrabold text-xl">
            <span class="gradient-text">Sell</span><span class="text-[var(--color-text)]">Bazar</span>
          </div>
        </RouterLink>
        <p class="text-xs text-[var(--color-text-muted)] leading-relaxed mb-4">
          Bangladesh's next-gen marketplace. Shop smarter, live better. &#127463;&#127465;
        </p>
        <div class="flex items-center gap-2 flex-wrap">
          <a href="#" class="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center hover:bg-orange-500 hover:text-white transition text-[var(--color-text-2)]">
            <i class="fa-brands fa-facebook-f text-xs"></i>
          </a>
          <a href="#" class="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center hover:bg-orange-500 hover:text-white transition text-[var(--color-text-2)]">
            <i class="fa-brands fa-instagram text-xs"></i>
          </a>
          <a href="#" class="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center hover:bg-orange-500 hover:text-white transition text-[var(--color-text-2)]">
            <i class="fa-brands fa-youtube text-xs"></i>
          </a>
          <a href="#" class="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center hover:bg-orange-500 hover:text-white transition text-[var(--color-text-2)]">
            <i class="fa-brands fa-tiktok text-xs"></i>
          </a>
          <a href="#" class="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center hover:bg-orange-500 hover:text-white transition text-[var(--color-text-2)]">
            <i class="fa-brands fa-x-twitter text-xs"></i>
          </a>
        </div>
      </div>

      <!-- Shop -->
      <div>
        <h4 class="font-semibold text-sm mb-4">Shop</h4>
        <ul class="space-y-2.5">
          <li v-for="l in shopLinks" :key="l.label">
            <RouterLink :to="l.to" class="text-xs text-[var(--color-text-muted)] hover:text-orange-500 transition flex items-center gap-1.5">
              <i class="fa-sharp fa-regular fa-chevron-right text-[9px]"></i>{{ l.label }}
            </RouterLink>
          </li>
        </ul>
      </div>

      <!-- Help -->
      <div>
        <h4 class="font-semibold text-sm mb-4">Help</h4>
        <ul class="space-y-2.5">
          <li v-for="l in helpLinks" :key="l.label">
            <a :href="l.href" class="text-xs text-[var(--color-text-muted)] hover:text-orange-500 transition flex items-center gap-1.5">
              <i class="fa-sharp fa-regular fa-chevron-right text-[9px]"></i>{{ l.label }}
            </a>
          </li>
        </ul>
      </div>

      <!-- Company -->
      <div>
        <h4 class="font-semibold text-sm mb-4">Company</h4>
        <ul class="space-y-2.5">
          <li v-for="l in companyLinks" :key="l.label">
            <a :href="l.href" class="text-xs text-[var(--color-text-muted)] hover:text-orange-500 transition flex items-center gap-1.5">
              <i class="fa-sharp fa-regular fa-chevron-right text-[9px]"></i>{{ l.label }}
            </a>
          </li>
        </ul>
      </div>

      <!-- App download -->
      <div>
        <h4 class="font-semibold text-sm mb-4">Get the App</h4>
        <div class="space-y-2.5">
          <a href="#" class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[var(--color-border)] hover:border-orange-500/50 transition group">
            <i class="fa-brands fa-apple text-xl text-[var(--color-text-muted)] group-hover:text-orange-500 transition"></i>
            <div>
              <p class="text-[9px] text-[var(--color-text-muted)]">Download on</p>
              <p class="text-xs font-semibold">App Store</p>
            </div>
          </a>
          <a href="#" class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[var(--color-border)] hover:border-orange-500/50 transition group">
            <i class="fa-brands fa-google-play text-xl text-[var(--color-text-muted)] group-hover:text-orange-500 transition"></i>
            <div>
              <p class="text-[9px] text-[var(--color-text-muted)]">Get it on</p>
              <p class="text-xs font-semibold">Google Play</p>
            </div>
          </a>
        </div>
        <!-- Trust badges -->
        <div class="mt-4 space-y-2">
          <div class="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <i class="fa-sharp fa-solid fa-shield-halved text-green-500"></i>
            <span>100% Secure Checkout</span>
          </div>
          <div class="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <i class="fa-sharp fa-solid fa-truck-fast text-blue-500"></i>
            <span>Fast Nationwide Delivery</span>
          </div>
          <div class="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <i class="fa-sharp fa-solid fa-rotate-left text-orange-500"></i>
            <span>7-Day Easy Returns</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment methods -->
    <div class="border-t border-[var(--color-border)] py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
          <i class="fa-sharp fa-solid fa-lock text-green-500"></i> Secure payments accepted:
        </p>
        <div class="flex items-center gap-2 flex-wrap justify-center">
          <span v-for="pm in paymentMethods" :key="pm.name" class="payment-badge" :style="{ color: pm.color }">
            <i :class="pm.icon + ' text-sm'"></i>
            <span class="font-semibold">{{ pm.name }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Copyright -->
    <div class="border-t border-[var(--color-border)] py-4 bg-[var(--color-surface-2)]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--color-text-muted)]">
        <p>
          &copy; {{ new Date().getFullYear() }} SellBazar.com &mdash; Made with
          <i class="fa-sharp fa-solid fa-heart text-red-500"></i> in Bangladesh &#127463;&#127465;
        </p>
        <div class="flex items-center gap-4">
          <a href="#" class="hover:text-orange-500 transition">Privacy Policy</a>
          <a href="#" class="hover:text-orange-500 transition">Terms</a>
          <a href="#" class="hover:text-orange-500 transition">Sitemap</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const shopLinks = [
  { label: 'New Arrivals',  to: '/products?sort=new'      },
  { label: 'Best Sellers',  to: '/products?sort=popular'  },
  { label: 'Flash Deals',   to: '/deals'                  },
  { label: 'Electronics',   to: '/products?cat=Electronics' },
  { label: 'Fashion',       to: '/products?cat=Fashion'   },
  { label: 'Grocery',       to: '/products?cat=Grocery'   },
  { label: 'Books',         to: '/products?cat=Books'     },
]
const helpLinks = [
  { label: 'Track Order',       href: '#' },
  { label: 'Return & Exchange', href: '#' },
  { label: 'Shipping Info',     href: '#' },
  { label: 'Payment Guide',     href: '#' },
  { label: 'FAQs',              href: '#' },
  { label: 'Contact Us',        href: '#' },
]
const companyLinks = [
  { label: 'About SellBazar',    href: '#' },
  { label: 'Sell on SellBazar',  href: '#' },
  { label: 'Careers',            href: '#' },
  { label: 'Press',              href: '#' },
  { label: 'Investor Relations', href: '#' },
]
const paymentMethods = [
  { name: 'bKash',           icon: 'fa-sharp fa-solid fa-mobile-screen-button', color: '#e2136e' },
  { name: 'Nagad',           icon: 'fa-sharp fa-solid fa-wallet',               color: '#f7931e' },
  { name: 'Rocket',          icon: 'fa-sharp fa-solid fa-rocket',               color: '#8b3fcd' },
  { name: 'VISA',            icon: 'fa-brands fa-cc-visa',                      color: '#1a1f71' },
  { name: 'Mastercard',      icon: 'fa-brands fa-cc-mastercard',                color: '#eb001b' },
  { name: 'Cash on Delivery',icon: 'fa-sharp fa-solid fa-money-bill-wave',      color: '#22c55e' },
  { name: 'Upay',            icon: 'fa-sharp fa-solid fa-building-columns',     color: '#005baa' },
]
</script>
