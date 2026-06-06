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
