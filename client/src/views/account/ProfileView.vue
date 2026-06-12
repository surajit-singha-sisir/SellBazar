<template>
  <div class="profile-page">

    <!-- ── Not logged in ──────────────────────────────────────────────────── -->
    <div v-if="!authStore.isLoggedIn" class="nli-wrap">
      <div class="nli-icon"><i class="fa-sharp-duotone fa-solid fa-user-lock"></i></div>
      <h2>Sign in to view your profile</h2>
      <p>Manage your personal info, addresses and phone numbers all in one place.</p>
      <RouterLink to="/login" class="btn-primary">
        <i class="fa-sharp fa-solid fa-right-to-bracket"></i> Sign In
      </RouterLink>
    </div>

    <!-- ── Logged in ──────────────────────────────────────────────────────── -->
    <template v-else>

      <!-- Hero strip -->
      <div class="profile-hero">
        <div class="hero-bg"></div>
        <div class="hero-inner">
          <div class="avatar-wrap">
            <div class="avatar">{{ authStore.initials }}</div>
            <span class="avatar-verified"><i class="fa-sharp fa-solid fa-circle-check"></i></span>
          </div>
          <div class="hero-info">
            <h1>{{ user.name }}</h1>
            <p>
              <i class="fa-sharp fa-regular fa-phone"></i> {{ primaryPhone }}
              <span v-if="user.division">&nbsp;·&nbsp;<i class="fa-sharp fa-regular fa-location-dot"></i> {{ user.division }}</span>
            </p>
          </div>
          <div class="hero-badge">
            <span class="verified-chip"><i class="fa-sharp fa-solid fa-shield-check"></i> Verified Account</span>
          </div>
        </div>
      </div>

      <!-- Tab nav -->
      <div class="tab-nav">
        <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
          <i :class="tab.icon"></i>
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Panels -->
      <div class="tab-panels">
        <Transition name="tab-slide" mode="out-in">

          <!-- ══ Personal Info ══════════════════════════════════════════════ -->
          <div v-if="activeTab === 'personal'" key="personal" class="panel">
            <div class="panel-header">
              <h2><i class="fa-sharp-duotone fa-solid fa-id-card"></i> Personal Information</h2>
              <p>Update your name, email, gender and date of birth</p>
            </div>

            <div class="form-grid">
              <div class="field full">
                <label>Full Name <span class="req">*</span></label>
                <div class="iw">
                  <i class="fa-sharp fa-regular fa-user"></i>
                  <input v-model="form.name" class="input-field" placeholder="Your full name" />
                </div>
              </div>
              <div class="field">
                <label>Email Address</label>
                <div class="iw">
                  <i class="fa-sharp fa-regular fa-envelope"></i>
                  <input v-model="form.email" type="email" class="input-field" placeholder="you@example.com" />
                </div>
              </div>
              <div class="field">
                <label>Gender</label>
                <div class="iw">
                  <i class="fa-sharp fa-regular fa-venus-mars"></i>
                  <select v-model="form.gender" class="input-field">
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div class="field">
                <label>Date of Birth</label>
                <div class="iw">
                  <i class="fa-sharp fa-regular fa-calendar"></i>
                  <input v-model="form.dateOfBirth" type="date" class="input-field" />
                </div>
              </div>
              <div class="field">
                <label>Division</label>
                <div class="iw">
                  <i class="fa-sharp fa-regular fa-location-dot"></i>
                  <select v-model="form.division" class="input-field">
                    <option value="">Select division</option>
                    <option v-for="d in divisions" :key="d">{{ d }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="panel-footer">
              <button class="btn-primary" @click="savePersonal" :disabled="saving.personal">
                <i :class="saving.personal ? 'fa-sharp fa-solid fa-spinner fa-spin' : 'fa-sharp fa-solid fa-floppy-disk'"></i>
                {{ saving.personal ? 'Saving…' : 'Save Changes' }}
              </button>
              <Transition name="toast">
                <span v-if="saved.personal" class="save-toast">
                  <i class="fa-sharp fa-solid fa-circle-check"></i> Changes saved!
                </span>
              </Transition>
            </div>
          </div>

          <!-- ══ Phone Numbers ══════════════════════════════════════════════ -->
          <div v-else-if="activeTab === 'phones'" key="phones" class="panel">
            <div class="panel-header">
              <h2><i class="fa-sharp-duotone fa-solid fa-mobile-screen"></i> Phone Numbers</h2>
              <p>Add up to 3 phone numbers. One must be marked as Primary.</p>
            </div>

            <div class="entries-list">
              <TransitionGroup name="list-item">
                <div v-for="(ph, idx) in phones" :key="ph.id" class="entry-card" :class="{ 'is-primary': ph.isPrimary }">
                  <div class="entry-top">
                    <select v-model="ph.label" class="label-select">
                      <option>Primary</option>
                      <option>Secondary</option>
                      <option>Work</option>
                      <option>Home</option>
                      <option>Other</option>
                    </select>
                    <span v-if="ph.isPrimary" class="primary-chip">
                      <i class="fa-sharp fa-solid fa-star"></i> Primary
                    </span>
                  </div>
                  <div class="phone-row">
                    <span class="bd-prefix">+880</span>
                    <input
                      v-model="ph.number"
                      class="input-field phone-input"
                      placeholder="01XXXXXXXXX"
                      maxlength="11"
                      @input="ph.number = (ph.number as string).replace(/\D/g,'')"
                    />
                  </div>
                  <div class="entry-actions">
                    <button v-if="!ph.isPrimary" class="act-btn star" @click="setPrimaryPhone(idx)" title="Set as primary">
                      <i class="fa-sharp fa-regular fa-star"></i> Set Primary
                    </button>
                    <button v-if="phones.length > 1" class="act-btn del" @click="removePhone(idx)" title="Remove">
                      <i class="fa-sharp fa-regular fa-trash-can"></i> Remove
                    </button>
                  </div>
                </div>
              </TransitionGroup>

              <button v-if="phones.length < 3" class="add-entry-btn" @click="addPhone">
                <i class="fa-sharp fa-regular fa-plus"></i>
                Add phone number
                <span class="add-hint">({{ 3 - phones.length }} more allowed)</span>
              </button>
            </div>

            <div class="panel-footer">
              <button class="btn-primary" @click="savePhones" :disabled="saving.phones">
                <i :class="saving.phones ? 'fa-sharp fa-solid fa-spinner fa-spin' : 'fa-sharp fa-solid fa-floppy-disk'"></i>
                {{ saving.phones ? 'Saving…' : 'Save Phone Numbers' }}
              </button>
              <Transition name="toast">
                <span v-if="saved.phones" class="save-toast">
                  <i class="fa-sharp fa-solid fa-circle-check"></i> Saved!
                </span>
              </Transition>
            </div>
          </div>

          <!-- ══ Delivery Addresses ══════════════════════════════════════════ -->
          <div v-else-if="activeTab === 'addresses'" key="addresses" class="panel">
            <div class="panel-header">
              <h2><i class="fa-sharp-duotone fa-solid fa-map-location-dot"></i> Delivery Addresses</h2>
              <p>Save up to 2 delivery addresses for faster checkout.</p>
            </div>

            <div class="entries-list">
              <TransitionGroup name="list-item">
                <div v-for="(addr, idx) in addresses" :key="addr.id" class="entry-card addr-card" :class="{ 'is-primary': addr.isDefault }">

                  <div class="entry-top">
                    <div class="type-pills">
                      <button v-for="type in ['Home','Work','Other']" :key="type"
                        class="type-pill" :class="{ active: addr.label === type }"
                        @click="addr.label = type as any">
                        <i :class="addrTypeIcon(type)"></i> {{ type }}
                      </button>
                    </div>
                    <div class="entry-head-actions">
                      <span v-if="addr.isDefault" class="primary-chip">
                        <i class="fa-sharp fa-solid fa-location-check"></i> Default
                      </span>
                      <button v-if="!addr.isDefault" class="act-btn star" @click="setDefaultAddr(idx)">
                        <i class="fa-sharp fa-regular fa-location-crosshairs"></i> Set Default
                      </button>
                      <button v-if="addresses.length > 1" class="act-btn del" @click="removeAddr(idx)">
                        <i class="fa-sharp fa-regular fa-trash-can"></i> Remove
                      </button>
                    </div>
                  </div>

                  <div class="form-grid addr-form-grid">
                    <div class="field">
                      <label>Recipient Name <span class="req">*</span></label>
                      <div class="iw">
                        <i class="fa-sharp fa-regular fa-user"></i>
                        <input v-model="addr.recipientName" class="input-field" placeholder="Full name" />
                      </div>
                    </div>
                    <div class="field">
                      <label>Phone <span class="req">*</span></label>
                      <div class="iw">
                        <i class="fa-sharp fa-regular fa-phone"></i>
                        <input v-model="addr.phone" class="input-field" placeholder="01XXXXXXXXX" maxlength="11" />
                      </div>
                    </div>
                    <div class="field">
                      <label>Division <span class="req">*</span></label>
                      <div class="iw">
                        <i class="fa-sharp fa-regular fa-map"></i>
                        <select v-model="addr.division" class="input-field" @change="addr.district = ''; addr.upazila = ''">
                          <option value="">Select division</option>
                          <option v-for="d in divisions" :key="d">{{ d }}</option>
                        </select>
                      </div>
                    </div>
                    <div class="field">
                      <label>District <span class="req">*</span></label>
                      <div class="iw">
                        <i class="fa-sharp fa-regular fa-city"></i>
                        <select v-model="addr.district" class="input-field" :disabled="!addr.division">
                          <option value="">Select district</option>
                          <option v-for="d in getDistricts(addr.division)" :key="d">{{ d }}</option>
                        </select>
                      </div>
                    </div>
                    <div class="field">
                      <label>Upazila / Thana</label>
                      <div class="iw">
                        <i class="fa-sharp fa-regular fa-location-dot"></i>
                        <input v-model="addr.upazila" class="input-field" placeholder="e.g. Gulshan, Mirpur" />
                      </div>
                    </div>
                    <div class="field">
                      <label>Postal Code</label>
                      <div class="iw">
                        <i class="fa-sharp fa-regular fa-mailbox"></i>
                        <input v-model="addr.postalCode" class="input-field" placeholder="1216" maxlength="4"
                          @input="addr.postalCode = (addr.postalCode as string).replace(/\D/g,'')" />
                      </div>
                    </div>
                    <div class="field full">
                      <label>Full Address <span class="req">*</span></label>
                      <div class="iw">
                        <i class="fa-sharp fa-regular fa-house"></i>
                        <input v-model="addr.addressLine" class="input-field" placeholder="House no, Road, Block, Area" />
                      </div>
                    </div>
                  </div>
                </div>
              </TransitionGroup>

              <button v-if="addresses.length < 2" class="add-entry-btn" @click="addAddress">
                <i class="fa-sharp fa-regular fa-plus"></i>
                Add delivery address
                <span class="add-hint">({{ 2 - addresses.length }} remaining)</span>
              </button>
              <div v-else class="limit-note">
                <i class="fa-sharp fa-regular fa-circle-info"></i>
                Maximum 2 addresses reached. Remove one to add another.
              </div>
            </div>

            <div class="panel-footer">
              <button class="btn-primary" @click="saveAddresses" :disabled="saving.addresses">
                <i :class="saving.addresses ? 'fa-sharp fa-solid fa-spinner fa-spin' : 'fa-sharp fa-solid fa-floppy-disk'"></i>
                {{ saving.addresses ? 'Saving…' : 'Save Addresses' }}
              </button>
              <Transition name="toast">
                <span v-if="saved.addresses" class="save-toast">
                  <i class="fa-sharp fa-solid fa-circle-check"></i> Saved!
                </span>
              </Transition>
            </div>
          </div>

          <!-- ══ My Reviews ════════════════════════════════════════════════ -->
          <div v-else-if="activeTab === 'reviews'" key="reviews" class="panel">
            <div class="panel-header">
              <h2><i class="fa-sharp-duotone fa-solid fa-star"></i> My Reviews</h2>
              <p>Write reviews for purchased products. They'll appear on the product page.</p>
            </div>
            <div class="panel-body">

              <!-- Loading -->
              <div v-if="reviewsLoading" class="reviews-loading">
                <i class="fa-sharp fa-solid fa-spinner fa-spin text-2xl text-orange-500 block mb-2"></i>
                Loading reviews…
              </div>

              <template v-else>
                <!-- ── Pending reviews (products eligible to review) ── -->
                <div v-if="pendingReviewProducts.length > 0" class="pending-section">
                  <h3 class="pending-title">
                    <i class="fa-sharp fa-regular fa-pen-to-square text-orange-500"></i>
                    Awaiting Your Review
                    <span class="pending-badge">{{ pendingReviewProducts.length }}</span>
                  </h3>
                  <div class="pending-list">
                    <div v-for="item in pendingReviewProducts" :key="item.productSlug" class="pending-card">
                      <div class="pending-card-info">
                        <RouterLink :to="`/products/${item.productSlug}`" class="pending-product-name">
                          <i class="fa-sharp fa-regular fa-box text-orange-400"></i>
                          {{ item.productName }}
                        </RouterLink>
                        <span class="pending-order-note">
                          <i class="fa-sharp fa-solid fa-circle-check text-green-500 text-xs"></i>
                          Delivered · Order {{ item.orderId }}
                        </span>
                      </div>
                      <button class="btn-primary text-sm px-4 py-2" @click="openReviewForm(item)">
                        <i class="fa-sharp fa-regular fa-star"></i> Write Review
                      </button>
                    </div>
                  </div>
                </div>

                <!-- ── Review form modal ── -->
                <Transition name="review-form">
                  <div v-if="activeReviewForm" class="review-form-card">
                    <div class="review-form-header">
                      <div>
                        <p class="review-form-label">Reviewing</p>
                        <h4 class="review-form-product">{{ activeReviewForm.productName }}</h4>
                      </div>
                      <button class="review-form-close" @click="closeReviewForm">
                        <i class="fa-sharp fa-solid fa-xmark"></i>
                      </button>
                    </div>

                    <!-- Star picker -->
                    <div class="rf-field">
                      <label>Your Rating <span class="req">*</span></label>
                      <div class="star-picker">
                        <button v-for="n in 5" :key="n"
                          @click="newReview.rating = n"
                          @mouseover="hoverRating = n"
                          @mouseleave="hoverRating = 0"
                          class="star-btn">
                          <i :class="n <= (hoverRating || newReview.rating)
                            ? 'fa-sharp fa-solid fa-star text-amber-400'
                            : 'fa-sharp fa-regular fa-star text-[var(--color-border)]'"></i>
                        </button>
                        <span class="rating-label">{{ ratingLabel(newReview.rating) }}</span>
                      </div>
                    </div>

                    <!-- Title -->
                    <div class="rf-field">
                      <label>Review Title</label>
                      <input v-model="newReview.title" class="input-field" placeholder="Summarise your experience…" maxlength="100" />
                    </div>

                    <!-- Body -->
                    <div class="rf-field">
                      <label>Your Review <span class="req">*</span></label>
                      <textarea v-model="newReview.body" class="input-field resize-none" rows="4"
                        placeholder="Share details about quality, delivery, packaging…" maxlength="1000"></textarea>
                      <div class="char-count">{{ newReview.body.length }}/1000</div>
                    </div>

                    <!-- Image upload -->
                    <div class="rf-field">
                      <label>
                        Photos
                        <span class="label-hint">(up to 5)</span>
                      </label>
                      <div class="image-upload-row">
                        <div v-for="(img, i) in newReview.images" :key="i" class="review-img-thumb group">
                          <img :src="img" class="w-full h-full object-cover" />
                          <button @click="removeReviewImage(i)"
                            class="review-img-remove opacity-0 group-hover:opacity-100">
                            <i class="fa-sharp fa-solid fa-xmark text-xs"></i>
                          </button>
                        </div>
                        <label v-if="newReview.images.length < 5"
                          class="review-img-add"
                          :class="{ 'opacity-50 cursor-not-allowed': uploadingImage }">
                          <i v-if="uploadingImage" class="fa-sharp fa-solid fa-spinner fa-spin text-orange-500"></i>
                          <template v-else>
                            <i class="fa-sharp fa-regular fa-camera text-lg text-[var(--color-text-muted)]"></i>
                            <span class="text-[9px] text-[var(--color-text-muted)] mt-0.5">{{ uploadingImage ? 'Uploading…' : 'Add Photo' }}</span>
                          </template>
                          <input type="file" accept="image/*" class="hidden" :disabled="uploadingImage" @change="onReviewImagePick" />
                        </label>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="rf-actions">
                      <button
                        @click="submitReview"
                        :disabled="submittingReview || !newReview.rating || !newReview.body.trim()"
                        class="btn-primary px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <i :class="submittingReview ? 'fa-sharp fa-solid fa-spinner fa-spin' : 'fa-sharp fa-regular fa-paper-plane-top'"></i>
                        {{ submittingReview ? 'Submitting…' : 'Submit Review' }}
                      </button>
                      <button @click="closeReviewForm" class="btn-ghost text-sm">Cancel</button>
                      <span v-if="reviewFormError" class="review-form-error">
                        <i class="fa-sharp fa-regular fa-circle-exclamation"></i> {{ reviewFormError }}
                      </span>
                    </div>
                  </div>
                </Transition>

                <!-- ── Submitted reviews ── -->
                <div v-if="userReviews.length === 0 && pendingReviewProducts.length === 0" class="reviews-empty">
                  <i class="fa-sharp fa-regular fa-star text-4xl opacity-20 block mb-3"></i>
                  <p class="font-medium text-[var(--color-text-muted)]">No reviews yet</p>
                  <p class="text-sm text-[var(--color-text-muted)]">Purchase and receive products to write reviews.</p>
                </div>

                <div v-if="userReviews.length > 0">
                  <h3 class="submitted-title">
                    <i class="fa-sharp fa-solid fa-star text-amber-400"></i>
                    Your Reviews
                    <span class="pending-badge">{{ userReviews.length }}</span>
                  </h3>
                  <div class="user-reviews-list">
                    <div v-for="review in userReviews" :key="review.id" class="user-review-card">
                      <div class="user-review-top">
                        <RouterLink :to="`/products/${review.productSlug}`" class="user-review-product">
                          <i class="fa-sharp fa-regular fa-box text-orange-400"></i>
                          {{ review.productName || review.productSlug }}
                        </RouterLink>
                        <div class="review-stars-sm">
                          <i v-for="n in 5" :key="n"
                            :class="n <= review.rating ? 'fa-sharp fa-solid fa-star' : 'fa-sharp fa-regular fa-star'"
                            class="text-xs text-amber-400"></i>
                        </div>
                        <span class="user-review-date">{{ formatReviewDate(review.createdAt) }}</span>
                      </div>
                      <p v-if="review.title" class="user-review-title">{{ review.title }}</p>
                      <p class="user-review-body">{{ review.body }}</p>
                      <div v-if="review.images?.length" class="user-review-images">
                        <img v-for="(img, i) in review.images" :key="i" :src="img"
                          class="w-14 h-14 object-cover rounded-lg border border-[var(--color-border)] cursor-pointer hover:opacity-80 transition"
                          @click="openReviewLightbox(review.images!, i)" />
                      </div>
                      <div class="user-review-meta">
                        <span class="review-status" :class="review.status">
                          <i :class="review.status === 'approved' ? 'fa-sharp fa-solid fa-circle-check' : 'fa-sharp fa-regular fa-clock'"></i>
                          {{ review.status }}
                        </span>
                        <span v-if="review.helpful > 0" class="text-xs text-[var(--color-text-muted)]">
                          <i class="fa-sharp fa-regular fa-thumbs-up"></i> {{ review.helpful }} found helpful
                        </span>
                        <RouterLink :to="`/products/${review.productSlug}#reviews`" class="view-on-product">
                          <i class="fa-sharp fa-regular fa-arrow-up-right-from-square"></i> View on product
                        </RouterLink>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- ══ Security ════════════════════════════════════════════════════ -->
          <div v-else-if="activeTab === 'security'" key="security" class="panel">
            <div class="panel-header">
              <h2><i class="fa-sharp-duotone fa-solid fa-shield-keyhole"></i> Account Security</h2>
              <p>Manage your password and session</p>
            </div>

            <div class="security-items">
              <div class="security-row">
                <div class="sec-info">
                  <span class="sec-icon"><i class="fa-sharp-duotone fa-solid fa-key"></i></span>
                  <div>
                    <strong>Password</strong>
                    <p>Last changed: Never</p>
                  </div>
                </div>
                <button class="btn-secondary sec-action" disabled>Change Password</button>
              </div>
              <div class="security-row">
                <div class="sec-info">
                  <span class="sec-icon text-green-500"><i class="fa-sharp-duotone fa-solid fa-mobile-screen-button"></i></span>
                  <div>
                    <strong>Phone Verification</strong>
                    <p>Your account is verified via phone</p>
                  </div>
                </div>
                <span class="verified-chip"><i class="fa-sharp fa-solid fa-circle-check"></i> Verified</span>
              </div>
            </div>

            <div class="danger-zone">
              <div class="dz-header">
                <i class="fa-sharp fa-regular fa-triangle-exclamation"></i>
                <h3>Danger Zone</h3>
              </div>
              <p>Signing out will end your current session. Your cart and wishlist data will be preserved.</p>
              <button class="btn-danger" @click="handleLogout">
                <i class="fa-sharp fa-regular fa-arrow-right-from-bracket"></i> Sign Out
              </button>
            </div>
          </div>

        </Transition>
      </div>
    </template>
  </div>

  <!-- ── Review image lightbox ── -->
  <Teleport to="body">
    <Transition name="lb">
      <div v-if="reviewLightbox.open"
        class="fixed inset-0 z-[210] flex items-center justify-center bg-black/92 backdrop-blur-sm"
        @click.self="reviewLightbox.open = false">
        <button @click="reviewLightbox.open = false"
          class="absolute top-4 right-4 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition z-10">
          <i class="fa-sharp fa-solid fa-xmark text-lg"></i>
        </button>
        <img v-if="reviewLightbox.images[reviewLightbox.index]"
          :src="reviewLightbox.images[reviewLightbox.index]"
          class="max-h-[85vh] max-w-[90vw] object-contain rounded-xl" />
        <button v-if="reviewLightbox.index > 0" @click="reviewLightbox.index--"
          class="absolute left-3 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition z-10">
          <i class="fa-sharp fa-solid fa-chevron-left"></i>
        </button>
        <button v-if="reviewLightbox.index < reviewLightbox.images.length - 1" @click="reviewLightbox.index++"
          class="absolute right-3 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition z-10">
          <i class="fa-sharp fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Address, PhoneEntry, User, Review } from '@/types'

const authStore = useAuthStore()

// ── Tabs ──────────────────────────────────────────────────────────────────────
const tabs = [
  { id: 'personal',  label: 'Personal Info',  icon: 'fa-sharp-duotone fa-solid fa-id-card'          },
  { id: 'phones',    label: 'Phone Numbers',  icon: 'fa-sharp-duotone fa-solid fa-mobile-screen'     },
  { id: 'addresses', label: 'Addresses',      icon: 'fa-sharp-duotone fa-solid fa-map-location-dot'  },
  { id: 'security',  label: 'Security',       icon: 'fa-sharp-duotone fa-solid fa-shield-keyhole'    },
]
const activeTab = ref('personal')

const user = computed(() => authStore.user!)

const primaryPhone = computed(() => {
  const ph = user.value?.phones?.find(p => p.isPrimary)
  return ph ? `+880 ${ph.number}` : user.value?.phone ?? '—'
})

// ── Personal form ─────────────────────────────────────────────────────────────
const form = reactive({
  name:        user.value?.name        ?? '',
  email:       user.value?.email       ?? '',
  gender:      (user.value?.gender     ?? '') as User['gender'],
  dateOfBirth: user.value?.dateOfBirth ?? '',
  division:    user.value?.division    ?? '',
})

// ── Phone numbers ─────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9) }

function initPhones(): PhoneEntry[] {
  if (user.value?.phones?.length) return user.value.phones.map(p => ({ ...p }))
  return [{ id: uid(), number: user.value?.phone ?? '', label: 'Primary', isPrimary: true }]
}
const phones = ref<PhoneEntry[]>(initPhones())

function addPhone() {
  if (phones.value.length >= 3) return
  phones.value.push({ id: uid(), number: '', label: 'Secondary', isPrimary: false })
}
function removePhone(idx: number) {
  const wasPrimary = phones.value[idx].isPrimary
  phones.value.splice(idx, 1)
  if (wasPrimary && phones.value.length) phones.value[0].isPrimary = true
}
function setPrimaryPhone(idx: number) {
  phones.value.forEach((p, i) => { p.isPrimary = i === idx })
}

// ── Addresses ─────────────────────────────────────────────────────────────────
function initAddresses(): Address[] {
  if (user.value?.addresses?.length) return user.value.addresses.map(a => ({ ...a }))
  return [{
    id: uid(), label: 'Home', recipientName: user.value?.name ?? '',
    phone: user.value?.phone ?? '', division: user.value?.division ?? '',
    district: '', upazila: '', addressLine: '', postalCode: '', isDefault: true,
  }]
}
const addresses = ref<Address[]>(initAddresses())

function addAddress() {
  if (addresses.value.length >= 2) return
  addresses.value.push({
    id: uid(), label: 'Home', recipientName: '', phone: '',
    division: '', district: '', upazila: '', addressLine: '', postalCode: '', isDefault: false,
  })
}
function removeAddr(idx: number) {
  const wasDef = addresses.value[idx].isDefault
  addresses.value.splice(idx, 1)
  if (wasDef && addresses.value.length) addresses.value[0].isDefault = true
}
function setDefaultAddr(idx: number) {
  addresses.value.forEach((a, i) => { a.isDefault = i === idx })
}
function addrTypeIcon(type: string) {
  return type === 'Home' ? 'fa-sharp fa-regular fa-house'
       : type === 'Work' ? 'fa-sharp fa-regular fa-building'
       : 'fa-sharp fa-regular fa-location-dot'
}

// ── Geo data ──────────────────────────────────────────────────────────────────
const divisions = ['Dhaka','Chittagong','Rajshahi','Khulna','Barisal','Sylhet','Rangpur','Mymensingh']

const districtMap: Record<string, string[]> = {
  Dhaka:      ['Dhaka','Gazipur','Narayanganj','Narsingdi','Manikganj','Munshiganj','Faridpur','Gopalganj','Madaripur','Shariatpur','Rajbari','Kishoreganj','Tangail'],
  Chittagong: ['Chittagong',"Cox's Bazar",'Comilla','Feni','Brahmanbaria','Rangamati','Noakhali','Chandpur','Lakshmipur','Bandarban','Khagrachhari'],
  Rajshahi:   ['Rajshahi','Bogra','Pabna','Natore','Sirajganj','Joypurhat','Naogaon','Chapainawabganj'],
  Khulna:     ['Khulna','Bagerhat','Satkhira','Jessore','Narail','Magura','Jhenaidah','Kushtia','Chuadanga','Meherpur'],
  Barisal:    ['Barisal','Bhola','Patuakhali','Pirojpur','Barguna','Jhalokathi'],
  Sylhet:     ['Sylhet','Moulvibazar','Habiganj','Sunamganj'],
  Rangpur:    ['Rangpur','Dinajpur','Gaibandha','Kurigram','Lalmonirhat','Nilphamari','Panchagarh','Thakurgaon'],
  Mymensingh: ['Mymensingh','Jamalpur','Netrokona','Sherpur'],
}
function getDistricts(div: string) { return districtMap[div] ?? [] }

// ── Save ──────────────────────────────────────────────────────────────────────
const saving = reactive({ personal: false, phones: false, addresses: false })
const saved  = reactive({ personal: false, phones: false, addresses: false })

function flash(k: keyof typeof saved) {
  saved[k] = true; setTimeout(() => { saved[k] = false }, 2500)
}

async function savePersonal() {
  saving.personal = true
  await new Promise(r => setTimeout(r, 600))
  authStore.login({ ...user.value, ...form })
  saving.personal = false; flash('personal')
}
async function savePhones() {
  saving.phones = true
  await new Promise(r => setTimeout(r, 600))
  if (!phones.value.some(p => p.isPrimary) && phones.value.length) phones.value[0].isPrimary = true
  authStore.login({ ...user.value, phones: phones.value.map(p => ({ ...p })) })
  saving.phones = false; flash('phones')
}
async function saveAddresses() {
  saving.addresses = true
  await new Promise(r => setTimeout(r, 600))
  authStore.login({ ...user.value, addresses: addresses.value.map(a => ({ ...a })) })
  saving.addresses = false; flash('addresses')
}
async function handleLogout() { await authStore.logout() }

// ──────────────────────────────────────────────────────────────────────────────
// MY REVIEWS
// ──────────────────────────────────────────────────────────────────────────────

interface PendingReviewItem {
  productSlug: string
  productName: string
  orderId: string
}

const userReviews            = ref<Review[]>([])
const pendingReviewProducts  = ref<PendingReviewItem[]>([])
const reviewsLoading         = ref(false)

// Active inline form
const activeReviewForm       = ref<PendingReviewItem | null>(null)
const newReview              = reactive({ rating: 0, title: '', body: '', images: [] as string[] })
const hoverRating            = ref(0)
const submittingReview       = ref(false)
const uploadingImage         = ref(false)
const reviewFormError        = ref('')

// Lightbox
const reviewLightbox = reactive({ open: false, images: [] as string[], index: 0 })
function openReviewLightbox(imgs: string[], i: number) {
  reviewLightbox.images = imgs; reviewLightbox.index = i; reviewLightbox.open = true
}

const ratingLabels = ['', 'Terrible', 'Poor', 'OK', 'Good', 'Excellent']
function ratingLabel(n: number) { return ratingLabels[n] ?? '' }

function formatReviewDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' })
}

function openReviewForm(item: PendingReviewItem) {
  activeReviewForm.value = item
  Object.assign(newReview, { rating: 0, title: '', body: '', images: [] })
  hoverRating.value = 0
  reviewFormError.value = ''
}

function closeReviewForm() {
  activeReviewForm.value = null
  reviewFormError.value = ''
}

// ── Image upload via ImgBB proxy ──────────────────────────────────────────────
async function onReviewImagePick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || newReview.images.length >= 5) return
  if (!file.type.startsWith('image/')) { reviewFormError.value = 'Only image files are supported'; return }
  if (file.size > 25 * 1024 * 1024) { reviewFormError.value = 'Image must be smaller than 25 MB'; return }
  uploadingImage.value = true
  reviewFormError.value = ''
  try {
    // Compress via canvas (max 1600px, webp 0.82)
    const blob = await new Promise<Blob>((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        let w = img.naturalWidth, h = img.naturalHeight
        const MAX = 1600
        if (w > MAX || h > MAX) {
          if (w >= h) { h = Math.round(h / w * MAX); w = MAX }
          else        { w = Math.round(w / h * MAX); h = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Compression failed')), 'image/webp', 0.82)
      }
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image')) }
      img.src = url
    })
    // Convert to base64 and upload via server proxy
    const base64 = await new Promise<string>((res, rej) => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        res(dataUrl.split(',')[1]) // strip data:image/webp;base64, prefix
      }
      reader.onerror = () => rej(new Error('Failed to read file'))
      reader.readAsDataURL(blob)
    })
    const baseName = file.name.replace(/\.[^.]+$/, '')
    const res = await fetch('/api/upload/imgbb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64, name: baseName }),
    })
    const data = await res.json()
    if (!res.ok || !data.url) throw new Error(data?.error ?? 'Upload failed')
    newReview.images.push(data.url as string)
  } catch (err: any) {
    reviewFormError.value = err.message ?? 'Image upload failed'
  } finally {
    uploadingImage.value = false
    ;(e.target as HTMLInputElement).value = ''
  }
}

function removeReviewImage(i: number) { newReview.images.splice(i, 1) }

// ── Submit review ─────────────────────────────────────────────────────────────
async function submitReview() {
  if (!activeReviewForm.value || !authStore.user) return
  reviewFormError.value = ''
  submittingReview.value = true
  try {
    const res = await fetch(`/api/reviews/${activeReviewForm.value.productSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: authStore.user.email ?? '',
        userName:  authStore.user.name  ?? 'Customer',
        userId:    authStore.user.id,
        rating:    newReview.rating,
        title:     newReview.title,
        body:      newReview.body,
        images:    newReview.images,
      }),
    })
    const data = await res.json()
    if (!res.ok) { reviewFormError.value = data.error ?? 'Failed to submit'; return }
    // Add to submitted list and remove from pending
    userReviews.value.unshift({ ...data, productName: activeReviewForm.value.productName })
    pendingReviewProducts.value = pendingReviewProducts.value.filter(
      p => p.productSlug !== activeReviewForm.value!.productSlug
    )
    closeReviewForm()
  } catch (err: any) {
    reviewFormError.value = err.message ?? 'Network error'
  } finally {
    submittingReview.value = false
  }
}

// ── Load reviews + eligible products ─────────────────────────────────────────
async function loadUserReviews() {
  const email = authStore.user?.email
  if (!email) return
  reviewsLoading.value = true
  try {
    // 1. Already submitted reviews
    const reviewsRes = await fetch(`/api/user/reviews?email=${encodeURIComponent(email)}`, { cache: 'no-store' })
    if (reviewsRes.ok) {
      const data = await reviewsRes.json()
      userReviews.value = data.data ?? []
    }

    // 2. Delivered orders → filter products not yet reviewed
    const ordersRes = await fetch(`/api/orders/by-email?email=${encodeURIComponent(email)}`, { cache: 'no-store' })
    if (ordersRes.ok) {
      const ordersData = await ordersRes.json()
      const deliveredOrders: any[] = (ordersData.data ?? []).filter((o: any) => o.status === 'delivered')
      const reviewedSlugs = new Set(userReviews.value.map(r => r.productSlug))

      // Build unique pending items: one entry per product slug across all delivered orders
      const seen = new Set<string>()
      const pending: PendingReviewItem[] = []
      for (const order of deliveredOrders) {
        for (const item of (order.items ?? [])) {
          const slug = item.productSlug ?? item.slug ?? item.productId
          if (!slug || seen.has(slug) || reviewedSlugs.has(slug)) continue
          seen.add(slug)
          pending.push({
            productSlug: slug,
            productName: item.name ?? item.productName ?? slug,
            orderId: order.id,
          })
        }
      }
      pendingReviewProducts.value = pending
    }
  } catch (e) {
    console.error('[ProfileView] loadUserReviews failed:', e)
  } finally {
    reviewsLoading.value = false
  }
}

// Lazy-load reviews when the tab is activated
watch(activeTab, (tab) => {
  if (tab === 'reviews' && userReviews.value.length === 0 && pendingReviewProducts.value.length === 0) {
    loadUserReviews()
  }
})
</script>

<style scoped lang="scss">
/* ── Page shell ───────────────────────────────────────────────────────────── */
.profile-page {
  max-width: 780px;
  margin: 0 auto;
  padding: 28px 16px 64px;
}

/* ── Not logged in ────────────────────────────────────────────────────────── */
.nli-wrap {
  display: flex; flex-direction: column; align-items: center;
  gap: 16px; padding: 80px 24px; text-align: center;

  .nli-icon {
    width: 72px; height: 72px; border-radius: 20px;
    background: rgba(249,115,22,.12);
    display: flex; align-items: center; justify-content: center;
    font-size: 30px; color: var(--color-brand);
  }
  h2 { font-size: 1.4rem; font-weight: 700; }
  p  { color: var(--color-text-muted); max-width: 340px; }
}

/* ── Hero ────────────────────────────────────────────────────────────────── */
.profile-hero {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 24px;
  border: 1px solid var(--color-border);
}
.hero-bg {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(249,115,22,.18) 0%, rgba(217,70,239,.10) 60%, transparent 100%);
  background-color: var(--color-surface);
}
.hero-inner {
  position: relative;
  display: flex; align-items: center; gap: 20px;
  padding: 28px 28px;
  flex-wrap: wrap;
}
.avatar-wrap { position: relative; flex-shrink: 0; }
.avatar {
  width: 72px; height: 72px; border-radius: 20px;
  background: linear-gradient(135deg, #f97316, #c026d3);
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; font-weight: 800; color: white;
  box-shadow: 0 8px 24px rgba(249,115,22,.35);
}
.avatar-verified {
  position: absolute; bottom: -4px; right: -4px;
  width: 22px; height: 22px; border-radius: 50%;
  background: #22c55e; color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; border: 2px solid var(--color-bg);
}
.hero-info { flex: 1; min-width: 0;
  h1 { font-size: 1.35rem; font-weight: 800; margin: 0 0 6px; font-family: 'Plus Jakarta Sans', sans-serif; }
  p  { font-size: .875rem; color: var(--color-text-muted); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
}
.hero-badge { margin-left: auto; }
.verified-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 99px;
  background: rgba(34,197,94,.12); color: #22c55e;
  font-size: .75rem; font-weight: 600; border: 1px solid rgba(34,197,94,.25);
  white-space: nowrap;
}

/* ── Tab nav ──────────────────────────────────────────────────────────────── */
.tab-nav {
  display: flex; gap: 4px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 5px;
  margin-bottom: 20px;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
.tab-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 16px; border-radius: 10px;
  font-size: .835rem; font-weight: 500;
  color: var(--color-text-muted);
  background: transparent; border: none; cursor: pointer;
  transition: all .18s; white-space: nowrap;

  i { font-size: 14px; }

  &:hover { background: var(--color-surface-2); color: var(--color-text); }
  &.active {
    background: var(--color-brand);
    color: white;
    box-shadow: 0 4px 12px rgba(249,115,22,.35);
  }
}

/* ── Panels ──────────────────────────────────────────────────────────────── */
.tab-panels { min-height: 420px; }

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  overflow: hidden;
}
.panel-header {
  padding: 22px 24px 18px;
  border-bottom: 1px solid var(--color-border);
  h2 {
    font-size: 1.05rem; font-weight: 700;
    display: flex; align-items: center; gap: 9px; margin: 0 0 4px;
    i { color: var(--color-brand); font-size: 17px; }
  }
  p { font-size: .82rem; color: var(--color-text-muted); margin: 0; }
}
.panel-footer {
  padding: 20px 24px;
  border-top: 1px solid var(--color-border);
  display: flex; align-items: center; gap: 14px;
  background: var(--color-surface);
}
.save-toast {
  display: inline-flex; align-items: center; gap: 6px;
  color: #22c55e; font-size: .85rem; font-weight: 600;
  i { font-size: 14px; }
}

/* ── Form grid ────────────────────────────────────────────────────────────── */
.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 18px;
  padding: 24px;
}
.field { display: flex; flex-direction: column; gap: 7px;
  label { font-size: .78rem; font-weight: 600; color: var(--color-text-muted); letter-spacing: .02em; }
  &.full { grid-column: 1 / -1; }
}
.req { color: var(--color-brand); margin-left: 2px; }

/* Input with icon */
.iw {
  position: relative;
  > i {
    position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
    font-size: 13px; color: var(--color-text-muted); pointer-events: none; z-index: 1;
  }
  .input-field { padding-left: 36px; }
}

/* ── Entries list (phones / addresses) ───────────────────────────────────── */
.entries-list {
  padding: 20px 24px;
  display: flex; flex-direction: column; gap: 14px;
}
.entry-card {
  border: 1.5px solid var(--color-border);
  border-radius: 14px;
  overflow: hidden;
  transition: border-color .2s;
  &.is-primary { border-color: rgba(249,115,22,.45); }
}
.entry-top {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px 0;
  gap: 10px; flex-wrap: wrap;
}

/* Label select */
.label-select {
  padding: 5px 10px; border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  color: var(--color-text); font-size: .8rem; font-weight: 500;
  cursor: pointer;
  &:focus { outline: none; border-color: var(--color-brand); }
}

.primary-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 99px;
  background: rgba(249,115,22,.12); color: var(--color-brand);
  font-size: .72rem; font-weight: 700;
  border: 1px solid rgba(249,115,22,.25);
  white-space: nowrap;
}

/* Phone row */
.phone-row {
  display: flex; align-items: center;
  padding: 10px 16px 0;
}
.bd-prefix {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border); border-right: none;
  border-radius: 12px 0 0 12px;
  padding: 0 12px; height: 44px;
  display: flex; align-items: center;
  font-size: .82rem; font-weight: 600; color: var(--color-text-muted);
  white-space: nowrap; flex-shrink: 0;
}
.phone-input {
  border-radius: 0 12px 12px 0 !important;
  border-left: none !important;
  padding-left: 12px !important;
}

/* Entry actions */
.entry-actions {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px 14px;
}
.act-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 8px;
  font-size: .78rem; font-weight: 500; cursor: pointer;
  border: 1px solid transparent; transition: all .15s;
  &.star {
    background: rgba(249,115,22,.08);
    border-color: rgba(249,115,22,.2);
    color: var(--color-brand);
    &:hover { background: rgba(249,115,22,.15); }
  }
  &.del {
    background: rgba(239,68,68,.07);
    border-color: rgba(239,68,68,.2);
    color: #ef4444;
    &:hover { background: rgba(239,68,68,.14); }
  }
}

/* Add entry button */
.add-entry-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 13px 18px; border-radius: 14px;
  border: 1.5px dashed var(--color-border);
  background: transparent; color: var(--color-text-muted);
  font-size: .85rem; font-weight: 500; cursor: pointer;
  width: 100%; transition: all .18s;
  &:hover { border-color: var(--color-brand); color: var(--color-brand); background: rgba(249,115,22,.04); }
  i { font-size: 14px; }
  .add-hint { font-size: .75rem; opacity: .6; margin-left: auto; }
}
.limit-note {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px; border-radius: 10px;
  background: rgba(249,115,22,.07); color: var(--color-text-muted);
  font-size: .82rem; border: 1px solid rgba(249,115,22,.15);
}

/* Address-card extras */
.addr-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 16px !important;
  .field.full { grid-column: 1 / -1; }
}
.type-pills {
  display: flex; gap: 6px; flex-wrap: wrap;
}
.type-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 99px;
  font-size: .78rem; font-weight: 500;
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  color: var(--color-text-muted);
  cursor: pointer; transition: all .15s;
  &.active {
    background: rgba(249,115,22,.12); border-color: rgba(249,115,22,.35);
    color: var(--color-brand);
  }
}
.entry-head-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.addr-form-grid { padding: 16px 0 0; border-top: 1px solid var(--color-border); margin: 12px 0 0; }

/* ── Security ────────────────────────────────────────────────────────────── */
.security-items { padding: 8px 0; }
.security-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px; gap: 16px; flex-wrap: wrap;
  border-bottom: 1px solid var(--color-border);
  &:last-child { border-bottom: none; }
}
.sec-info {
  display: flex; align-items: center; gap: 14px;
  .sec-icon {
    width: 42px; height: 42px; border-radius: 11px;
    background: rgba(249,115,22,.1);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; color: var(--color-brand); flex-shrink: 0;
    &.text-green-500 { background: rgba(34,197,94,.1); color: #22c55e; }
  }
  strong { font-size: .9rem; font-weight: 600; display: block; }
  p { font-size: .78rem; color: var(--color-text-muted); margin: 2px 0 0; }
}
.sec-action { font-size: .82rem !important; padding: 7px 14px !important; opacity: .5; }

.danger-zone {
  margin: 0 24px 24px;
  padding: 18px 20px;
  border-radius: 12px;
  border: 1.5px solid rgba(239,68,68,.25);
  background: rgba(239,68,68,.04);
  .dz-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
    i { color: #ef4444; } h3 { font-size: .9rem; font-weight: 700; color: #ef4444; margin: 0; }
  }
  p { font-size: .82rem; color: var(--color-text-muted); margin: 0 0 14px; }
}
.btn-danger {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 20px; border-radius: 10px;
  background: rgba(239,68,68,.1); color: #ef4444;
  border: 1.5px solid rgba(239,68,68,.25);
  font-size: .85rem; font-weight: 600; cursor: pointer;
  transition: all .15s;
  &:hover { background: #ef4444; color: white; }
}

/* ── Transitions ─────────────────────────────────────────────────────────── */
.tab-slide-enter-active, .tab-slide-leave-active { transition: opacity .18s ease, transform .18s ease; }
.tab-slide-enter-from { opacity: 0; transform: translateY(8px); }
.tab-slide-leave-to   { opacity: 0; transform: translateY(-8px); }

.toast-enter-active, .toast-leave-active { transition: opacity .25s ease, transform .25s ease; }
.toast-enter-from { opacity: 0; transform: translateX(8px); }
.toast-leave-to   { opacity: 0; transform: translateX(8px); }

.list-item-enter-active { transition: all .25s ease; }
.list-item-leave-active { transition: all .2s ease; }
.list-item-enter-from   { opacity: 0; transform: translateY(-10px); }
.list-item-leave-to     { opacity: 0; transform: translateY(10px); }

.review-form-enter-active, .review-form-leave-active {
  transition: opacity .2s ease, transform .2s ease;
}
.review-form-enter-from { opacity: 0; transform: translateY(-10px); }
.review-form-leave-to   { opacity: 0; transform: translateY(-10px); }

.lb-enter-active, .lb-leave-active { transition: opacity .2s ease; }
.lb-enter-from, .lb-leave-to { opacity: 0; }

/* ── My Reviews panel ────────────────────────────────────────────────────── */
.panel-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 24px; }

.reviews-loading, .reviews-empty {
  text-align: center; padding: 40px 20px;
  color: var(--color-text-muted);
}

/* Pending section */
.pending-section { display: flex; flex-direction: column; gap: 10px; }

.pending-title, .submitted-title {
  display: flex; align-items: center; gap: 8px;
  font-size: .82rem; font-weight: 700;
  color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .04em;
  margin: 0 0 8px;
}
.pending-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 20px; padding: 0 6px;
  border-radius: 99px;
  background: var(--color-brand); color: white;
  font-size: .68rem; font-weight: 700;
}

.pending-list { display: flex; flex-direction: column; gap: 8px; }

.pending-card {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  padding: 14px 16px;
  border: 1.5px dashed rgba(249,115,22,.35);
  border-radius: 12px;
  background: rgba(249,115,22,.03);
  flex-wrap: wrap;
  transition: border-color .2s, background .2s;
  &:hover { border-color: rgba(249,115,22,.6); background: rgba(249,115,22,.06); }
}
.pending-card-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.pending-product-name {
  font-weight: 600; font-size: .88rem;
  color: var(--color-text); text-decoration: none;
  display: flex; align-items: center; gap: 6px;
  &:hover { color: var(--color-brand); }
}
.pending-order-note {
  font-size: .74rem; color: var(--color-text-muted);
  display: flex; align-items: center; gap: 5px;
}

/* Review form card (inline) */
.review-form-card {
  border: 1.5px solid rgba(249,115,22,.3);
  border-radius: 16px;
  background: var(--color-surface-2);
  overflow: hidden;
}
.review-form-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 16px 20px 14px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}
.review-form-label { font-size: .72rem; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .04em; margin: 0 0 3px; }
.review-form-product { font-size: .95rem; font-weight: 700; margin: 0; }
.review-form-close {
  width: 28px; height: 28px; border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; cursor: pointer; flex-shrink: 0;
  color: var(--color-text-muted);
  transition: all .15s;
  &:hover { background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.3); color: #ef4444; }
}

.rf-field {
  padding: 14px 20px 0;
  display: flex; flex-direction: column; gap: 7px;
  label {
    font-size: .75rem; font-weight: 600;
    color: var(--color-text-muted); letter-spacing: .02em;
  }
  .label-hint { font-size: .72rem; font-weight: 400; opacity: .7; }
}
.rf-actions {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 16px 20px 18px;
}

.char-count { text-align: right; font-size: .7rem; color: var(--color-text-muted); }

.star-picker {
  display: flex; align-items: center; gap: 4px;
}
.star-btn {
  font-size: 24px; background: none; border: none; cursor: pointer;
  padding: 0; line-height: 1;
  transition: transform .1s;
  &:hover { transform: scale(1.15); }
}
.rating-label {
  font-size: .78rem; color: var(--color-text-muted);
  margin-left: 6px; min-width: 60px;
}

/* Image upload row */
.image-upload-row {
  display: flex; flex-wrap: wrap; gap: 8px;
  padding-bottom: 6px;
}
.review-img-thumb {
  position: relative; width: 72px; height: 72px;
  border-radius: 10px; overflow: hidden;
  border: 1px solid var(--color-border);
}
.review-img-remove {
  position: absolute; inset: 0;
  background: rgba(0,0,0,.55);
  display: flex; align-items: center; justify-content: center;
  color: white; border: none; cursor: pointer;
  transition: opacity .15s;
}
.review-img-add {
  width: 72px; height: 72px; border-radius: 10px;
  border: 2px dashed var(--color-border);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer;
  transition: border-color .15s, background .15s;
  &:hover { border-color: var(--color-brand); background: rgba(249,115,22,.05); }
}

.review-form-error {
  font-size: .8rem; color: #ef4444;
  display: flex; align-items: center; gap: 5px;
}

/* Submitted reviews */
.user-reviews-list { display: flex; flex-direction: column; gap: 12px; }

.user-review-card {
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 16px;
  background: var(--color-surface-2);
  transition: border-color .2s;
  &:hover { border-color: rgba(249,115,22,.3); }
}
.user-review-top {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px;
}
.user-review-product {
  font-weight: 600; font-size: .85rem;
  color: var(--color-text); display: flex; align-items: center; gap: 6px;
  text-decoration: none;
  &:hover { color: var(--color-brand); }
}
.user-review-date {
  font-size: .75rem; color: var(--color-text-muted);
  margin-left: auto;
}
.review-stars-sm { display: flex; gap: 2px; }
.user-review-title { font-weight: 600; font-size: .87rem; margin: 0 0 4px; }
.user-review-body {
  font-size: .83rem; color: var(--color-text-muted);
  line-height: 1.6; white-space: pre-line; margin: 0 0 10px;
}
.user-review-images { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.user-review-meta {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.view-on-product {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: .74rem; font-weight: 500;
  color: var(--color-brand); text-decoration: none;
  margin-left: auto;
  &:hover { text-decoration: underline; }
}
.review-status {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: .72rem; font-weight: 600; padding: 3px 9px; border-radius: 99px;
  &.approved {
    background: rgba(34,197,94,.1); color: #22c55e;
    border: 1px solid rgba(34,197,94,.2);
  }
  &.pending {
    background: rgba(249,115,22,.1); color: var(--color-brand);
    border: 1px solid rgba(249,115,22,.2);
  }
  &.rejected {
    background: rgba(239,68,68,.1); color: #ef4444;
    border: 1px solid rgba(239,68,68,.2);
  }
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 560px) {
  .profile-page { padding: 16px 12px 48px; }
  .hero-inner   { padding: 20px 16px; gap: 14px; }
  .avatar       { width: 56px; height: 56px; font-size: 20px; }
  .hero-badge   { width: 100%; }
  .form-grid    { grid-template-columns: 1fr; padding: 16px; }
  .field.full   { grid-column: 1; }
  .tab-btn span { display: none; }
  .tab-btn      { padding: 9px 13px; }
  .entries-list { padding: 14px 12px; }
  .entry-top    { padding: 10px 12px 0; }
  .phone-row    { padding: 8px 12px 0; }
  .entry-actions { padding: 8px 12px 12px; }
  .addr-form-grid { grid-template-columns: 1fr !important; padding: 12px !important; }
  .security-row { padding: 14px 16px; }
  .danger-zone  { margin: 0 16px 16px; }
  .panel-footer { padding: 14px 16px; }
  .panel-header { padding: 16px 16px 12px; }
  .panel-body   { padding: 16px 12px; }
  .rf-field     { padding: 12px 14px 0; }
  .rf-actions   { padding: 14px 14px 16px; }
  .review-form-header { padding: 14px 14px 12px; }
  .pending-card { padding: 12px; }
}
</style>
