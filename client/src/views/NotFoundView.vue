<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12 bg-mesh">
    <div class="text-center space-y-6 max-w-md">
      <div class="relative">
        <div class="text-[120px] leading-none font-display font-extrabold gradient-text opacity-20 select-none">404</div>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-6xl">ðŸ”</div>
        </div>
      </div>
      <div>
        <h1 class="font-display font-extrabold text-3xl">Page Not Found</h1>
        <p class="text-[var(--color-text-muted)] mt-2 text-lg">Oops! We couldn't find what you were looking for.</p>
      </div>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <RouterLink to="/" class="btn-primary">
          <i class="fa-sharp fa-regular fa-house"></i> Go Home
        </RouterLink>
        <RouterLink to="/products" class="btn-secondary">
          <i class="fa-sharp fa-regular fa-magnifying-glass"></i> Browse Products
        </RouterLink>
      </div>
    </div>
  </div>
</template>
