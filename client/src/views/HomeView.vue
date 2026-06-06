<template>
  <!-- ── Loading skeleton ──────────────────────────── -->
  <div v-if="productStore.isLoading && !productStore.products.length"
       class="min-h-screen bg-[var(--color-bg)] animate-pulse">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div class="flex gap-4">
        <div class="w-64 shrink-0 space-y-2">
          <div v-for="n in 8" :key="n" class="h-11 rounded-xl bg-[var(--color-surface-2)]"></div>
        </div>
        <div class="flex-1 h-80 rounded-2xl bg-[var(--color-surface-2)]"></div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div v-for="n in 8" :key="n" class="h-64 rounded-2xl bg-[var(--color-surface-2)]"></div>
      </div>
    </div>
  </div>

  <!-- ── Main content ─────────────────────────────────────────────────── -->
  <div v-else class="bg-mesh min-h-screen">

    <!-- ── Hero Section ──────────────────────────────────────────────── -->
    <section class="hero-section">
      <div class="hero-bg-grid"></div>
      <div class="hero-blob hero-blob--orange"></div>
      <div class="hero-blob hero-blob--violet"></div>

      <div class="hero-content max-w-7xl mx-auto">

        <!-- Badge -->
        <div class="hero-top-row">
          <span class="hero-badge">
            <span class="pulse-dot"></span>
            বাংলাদেশের সেরা মার্কেটপ্লেস · 2027
          </span>
        </div>

        <!-- ── Two-column hero layout ─────────────────────────────── -->
        <div class="hero-two-col">

          <!-- LEFT: Dynamic Category List -->
          <aside class="hero-cat-panel">
            <div class="hero-cat-header">
              <i class="fa-sharp fa-solid fa-grid-2 text-[var(--color-brand)]"></i>
              <span>All Categories</span>
            </div>

            <ul class="hero-cat-list" @mouseleave="closeFlyout">
              <li
                v-for="(cat, idx) in displayCategories"
                :key="cat.id"
                class="hero-cat-item"
                :class="{ 'hero-cat-item--active': activeCat === cat.id }"
                :ref="el => setCatRef(el as HTMLElement | null, cat.id)"
                @mouseenter="openFlyout(cat)"
                @click.stop="handleCatClick(cat)"
              >
                <div class="hero-cat-row">
                  <span class="hero-cat-icon-wrap" :style="`background:${cat.color}18`">
                    <i :class="'fa-sharp fa-solid fa-' + cat.icon" :style="`color:${cat.color}`"></i>
                  </span>
                  <span class="hero-cat-name">{{ cat.name }}</span>
                  <span class="hero-cat-count">{{ (cat.productCount ?? cat.count ?? 0).toLocaleString() }}+</span>
                  <i v-if="cat.subcategories?.length"
                    class="fa-sharp fa-solid fa-chevron-right hero-cat-chevron"></i>
                </div>
              </li>
            </ul>

            <RouterLink to="/products" class="hero-cat-all-link">
              <i class="fa-sharp fa-solid fa-layer-group text-xs"></i>
              See All Categories
              <i class="fa-sharp fa-solid fa-arrow-right text-xs"></i>
            </RouterLink>
          </aside>

          <!-- RIGHT: Swiper Carousel -->
          <div class="hero-carousel-col">
            <div class="swiper hero-swiper" ref="swiperEl">
              <div class="swiper-wrapper">
                <div
                  v-for="slide in heroSlides" :key="slide.id"
                  class="swiper-slide hero-slide"
                  :style="`background: ${slide.bg}`"
                >
                  <div class="hero-slide-content">
                    <span class="hero-slide-tag">{{ slide.tag }}</span>
                    <h2 class="hero-slide-title">{{ slide.title }}</h2>
                    <p class="hero-slide-sub">{{ slide.subtitle }}</p>
                    <RouterLink :to="slide.link" class="hero-slide-btn">
                      <i class="fa-sharp fa-solid fa-bolt"></i>
                      {{ slide.cta }}
                    </RouterLink>
                  </div>
                  <div class="hero-slide-img-wrap">
                    <img :src="slide.image" :alt="slide.title" class="hero-slide-img" />
                  </div>
                </div>
              </div>
              <div class="swiper-pagination hero-swiper-pagination"></div>
              <div class="swiper-button-prev hero-swiper-prev"></div>
              <div class="swiper-button-next hero-swiper-next"></div>
            </div>

            <div class="hero-trust-row">
              <div class="hero-trust-item">
                <i class="fa-sharp fa-solid fa-truck-fast text-blue-500"></i>
                <span>Free Delivery above ৳599</span>
              </div>
              <div class="hero-trust-divider"></div>
              <div class="hero-trust-item">
                <i class="fa-sharp fa-solid fa-shield-halved text-green-500"></i>
                <span>Secure Payments</span>
              </div>
              <div class="hero-trust-divider"></div>
              <div class="hero-trust-item">
                <i class="fa-sharp fa-solid fa-rotate-left text-orange-500"></i>
                <span>Easy 7-day Returns</span>
              </div>
              <div class="hero-trust-divider"></div>
              <div class="hero-trust-item">
                <i class="fa-sharp fa-solid fa-headset text-purple-500"></i>
                <span>24/7 Support</span>
              </div>
            </div>
          </div>

        </div><!-- end .hero-two-col -->
      </div>
    </section>

    <!-- ── Teleported subcategory flyout — escapes all overflow clipping ── -->
    <Teleport to="body">
      <Transition name="subpanel">
        <div
          v-if="flyoutCat && flyoutCat.subcategories?.length"
          class="hero-subcat-panel"
          :style="flyoutStyle"
          @mouseenter="keepFlyout"
          @mouseleave="closeFlyout"
          @click.stop
        >
          <div class="hero-subcat-header">
            <span class="hero-subcat-icon" :style="`background:${flyoutCat.color}18`">
              <i :class="'fa-sharp fa-solid fa-' + flyoutCat.icon" :style="`color:${flyoutCat.color}`"></i>
            </span>
            <span class="font-semibold text-sm">{{ flyoutCat.name }}</span>
            <RouterLink
              :to="`/products?cat=${encodeURIComponent(flyoutCat.name)}`"
              class="ml-auto text-xs text-orange-500 font-semibold hover:underline"
              @click="closeFlyout"
            >All →</RouterLink>
          </div>
          <div class="hero-subcat-grid">
            <RouterLink
              v-for="sub in flyoutCat.subcategories.slice(0, 10)" :key="sub.slug"
              :to="`/products?cat=${encodeURIComponent(flyoutCat.name)}&sub=${sub.slug}`"
              class="hero-subcat-link"
              @click="closeFlyout"
            >
              <i :class="'fa-sharp fa-solid fa-' + sub.icon" :style="`color:${flyoutCat.color};opacity:0.8`"></i>
              <span>{{ sub.name }}</span>
            </RouterLink>
          </div>
        </div>
      </Transition>
    </Teleport>

