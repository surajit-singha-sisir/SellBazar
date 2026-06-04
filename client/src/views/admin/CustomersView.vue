<template>
  <div class="admin-page-wrap">

    <!-- ── Page header ──────────────────────────────────────────────────── -->
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Customers</h1>
        <p class="page-subtitle">{{ filtered.length }} customers found</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="admin-btn secondary" @click="load">
          <i class="fa-sharp fa-solid fa-arrows-rotate" :class="{'fa-spin': adminStore.loading.customers}"></i> Refresh
        </button>
        <div class="export-wrap" v-click-outside="() => exportOpen = false">
          <button class="admin-btn secondary" @click="exportOpen = !exportOpen">
            <i class="fa-sharp fa-solid fa-file-export"></i> Export
            <i class="fa-solid fa-chevron-down" style="font-size:10px"></i>
          </button>
          <div v-if="exportOpen" class="export-dropdown">
            <button @click="doExport('excel')"><i class="fa-solid fa-file-excel" style="color:#22c55e"></i> Excel</button>
            <button @click="doExport('pdf')"><i class="fa-solid fa-file-pdf" style="color:#ef4444"></i> PDF</button>
            <button @click="doExport('csv')"><i class="fa-solid fa-file-csv" style="color:#3b82f6"></i> CSV</button>
            <button @click="doExport('json')"><i class="fa-solid fa-file-code" style="color:#a855f7"></i> JSON</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Summary cards ────────────────────────────────────────────────── -->
    <div class="admin-grid-4" style="margin-bottom:20px">
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(59,130,246,0.12);color:#3b82f6">
          <i class="fa-sharp-duotone fa-solid fa-users"></i>
        </div>
        <div>
          <div class="stat-label">Total Customers</div>
          <div class="stat-value">{{ customers.length }}</div>
        </div>
        <div class="stat-delta positive"><i class="fa-solid fa-user-plus"></i> Unique buyers</div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(34,197,94,0.12);color:#22c55e">
          <i class="fa-sharp-duotone fa-solid fa-repeat"></i>
        </div>
        <div>
          <div class="stat-label">Repeat Buyers</div>
          <div class="stat-value">{{ repeatCount }}</div>
        </div>
        <div class="stat-delta positive"><i class="fa-solid fa-arrow-trend-up"></i> 2+ orders</div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(168,85,247,0.12);color:#a855f7">
          <i class="fa-sharp-duotone fa-solid fa-coin"></i>
        </div>
        <div>
          <div class="stat-label">Avg. Lifetime Value</div>
          <div class="stat-value">৳{{ fmtNum(avgLtv) }}</div>
        </div>
        <div class="stat-delta neutral"><i class="fa-solid fa-minus"></i> Per customer</div>
      </div>
      <div class="admin-stat-card">
        <div class="stat-icon" style="background:rgba(249,115,22,0.12);color:#f97316">
          <i class="fa-sharp-duotone fa-solid fa-crown"></i>
        </div>
        <div>
          <div class="stat-label">Top Spender</div>
          <div class="stat-value" style="font-size:15px">{{ topSpender?.name ?? '—' }}</div>
        </div>
        <div class="stat-delta positive" v-if="topSpender">
          <i class="fa-solid fa-star"></i> ৳{{ fmtNum(topSpender.totalSpent) }}
        </div>
      </div>
    </div>

    <!-- ── Filters ───────────────────────────────────────────────────────── -->
    <div class="admin-filters">
      <div class="search-wrap">
        <i class="fa-sharp fa-solid fa-magnifying-glass search-icon"></i>
        <input class="filter-input" v-model="search" placeholder="Search name, email, phone, address…" />
      </div>
      <select class="filter-select" v-model="sortBy">
        <option value="totalSpent">Sort: Highest Spent</option>
        <option value="orderCount">Sort: Most Orders</option>
        <option value="lastOrder">Sort: Most Recent</option>
        <option value="name">Sort: Name A–Z</option>
      </select>
      <select class="filter-select" v-model="loyaltyFilter">
        <option value="">All Customers</option>
        <option value="loyal">Loyal (2+ orders)</option>
        <option value="new">New (1 order)</option>
      </select>
    </div>

    <!-- ── Table ─────────────────────────────────────────────────────────── -->
    <div class="admin-table-wrap">
      <div v-if="adminStore.loading.customers" style="padding:40px;text-align:center;color:var(--text-secondary)">
        <i class="fa-solid fa-spinner-third fa-spin fa-2x"></i><br><br>Loading customers…
      </div>

      <table v-else class="admin-table customers-table">
        <thead>
          <tr>
            <th style="width:36px">#</th>
            <th class="sortable" @click="sortBy='name'">Customer</th>
            <th>Phone No.</th>
            <th>Addresses</th>
            <th class="sortable" @click="sortBy='orderCount'" style="text-align:center">Total Orders</th>
            <th class="sortable" @click="sortBy='totalSpent'">Total Spent</th>
            <th class="sortable" @click="sortBy='lastOrder'">Last Order</th>
            <th>Account Age</th>
            <th style="text-align:center">All Orders</th>
            <th style="text-align:center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(c, i) in paginated" :key="c.id">

            <!-- # -->
            <td class="col-index">{{ (page - 1) * perPage + i + 1 }}</td>

            <!-- Customer: avatar + name + email -->
            <td>
              <div class="cust-identity">
                <div class="customer-avatar" :style="{ background: avatarBg(c.id), color: avatarFg(c.id) }">
                  {{ initials(c.name) }}
                </div>
                <div>
                  <div class="cust-name">{{ c.name }}</div>
                  <div class="cust-email">{{ c.email || '—' }}</div>
                  <span class="status-badge" :class="c.orderCount > 1 ? 'delivered' : 'pending'" style="margin-top:3px">
                    {{ c.orderCount > 1 ? 'Loyal' : 'New' }}
                  </span>
                </div>
              </div>
            </td>

            <!-- Phone numbers (may be one or array) -->
            <td>
              <div class="phone-list">
                <template v-if="phoneList(c).length">
                  <a v-for="ph in phoneList(c)" :key="ph" :href="'tel:' + ph" class="phone-chip">
                    <i class="fa-sharp fa-solid fa-phone"></i> {{ ph }}
                  </a>
                </template>
                <span v-else class="col-muted">—</span>
              </div>
            </td>

            <!-- Addresses: text + Google Maps link -->
            <td>
              <div class="address-list">
                <template v-if="addressList(c).length">
                  <div v-for="addr in addressList(c)" :key="addr" class="address-row">
                    <span class="address-text">
                      <i class="fa-sharp fa-solid fa-location-dot" style="color:var(--brand);font-size:10px;margin-right:3px"></i>
                      {{ addr }}
                    </span>
                    <a
                      :href="googleMapsUrl(addr)"
                      target="_blank"
                      rel="noopener"
                      class="map-link"
                      title="Open in Google Maps"
                    >
                      <i class="fa-sharp fa-solid fa-share-from-square"></i>
                    </a>
                  </div>
                </template>
                <span v-else class="col-muted">—</span>
              </div>
            </td>

            <!-- Total Orders -->
            <td style="text-align:center">
              <span class="orders-badge">{{ c.orderCount }}</span>
            </td>

            <!-- Total Spent -->
            <td>
              <div class="spent-value">৳{{ c.totalSpent.toLocaleString() }}</div>
              <div class="col-muted" style="font-size:10px;margin-top:1px">
                avg ৳{{ Math.round(c.totalSpent / Math.max(c.orderCount, 1)).toLocaleString() }}
              </div>
            </td>

            <!-- Last Order -->
            <td>
              <div style="font-size:12px;font-weight:500">{{ fmtDate(c.lastOrder) }}</div>
              <div class="col-muted" style="font-size:10px;margin-top:1px">{{ timeAgo(c.lastOrder) }}</div>
            </td>

            <!-- Account Age: created date + human duration -->
            <td>
              <div style="font-size:11px;color:var(--text-secondary)">
                <i class="fa-sharp fa-regular fa-calendar" style="margin-right:3px"></i>
                {{ fmtDate(c.firstOrder) }}
              </div>
              <div class="age-pill">{{ accountAge(c.firstOrder) }}</div>
            </td>

            <!-- All Orders button -->
            <td style="text-align:center">
              <button class="admin-btn secondary" style="padding:5px 12px;font-size:11px" @click="openOrders(c)">
                <i class="fa-sharp fa-solid fa-receipt"></i>
                {{ c.orderCount }}
              </button>
            </td>

            <!-- Actions: Edit + Delete -->
            <td>
              <div class="action-btns">
                <button class="action-btn edit" title="Edit customer" @click="openEdit(c)">
                  <i class="fa-sharp fa-solid fa-pen-to-square"></i>
                </button>
                <button class="action-btn delete" title="Delete customer & all data" @click="confirmDelete(c)">
                  <i class="fa-sharp fa-solid fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!paginated.length">
            <td colspan="10" style="text-align:center;padding:40px;color:var(--text-secondary)">
              No customers found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Pagination ────────────────────────────────────────────────────── -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;flex-wrap:wrap;gap:8px">
      <span style="font-size:12px;color:var(--text-secondary)">
        Showing {{ Math.min((page-1)*perPage+1, filtered.length) }}–{{ Math.min(page*perPage, filtered.length) }}
        of {{ filtered.length }}
      </span>
      <div style="display:flex;gap:6px">
        <button class="admin-btn secondary" style="padding:6px 12px" :disabled="page===1" @click="page--">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <span style="padding:6px 14px;font-size:13px;font-weight:700;color:var(--brand)">
          {{ page }} / {{ totalPages }}
        </span>
        <button class="admin-btn secondary" style="padding:6px 12px" :disabled="page>=totalPages" @click="page++">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════════════════
       ORDERS POPUP MODAL
  ══════════════════════════════════════════════════════════════════════ -->
  <Teleport to="body">
    <Transition name="cmodal">
      <div v-if="ordersModal.open" class="cmodal-overlay" @click.self="ordersModal.open = false">
        <div class="cmodal-box">
          <!-- Header -->
          <div class="cmodal-header">
            <div>
              <div class="cmodal-title">
                <i class="fa-sharp fa-solid fa-receipt" style="color:var(--brand)"></i>
                Orders — {{ ordersModal.customer?.name }}
              </div>
              <div class="cmodal-sub">{{ ordersModal.orders.length }} order(s) found</div>
            </div>
            <button class="admin-btn ghost" style="padding:6px 10px" @click="ordersModal.open = false">
              <i class="fa-sharp fa-solid fa-xmark fa-lg"></i>
            </button>
          </div>

          <!-- Loading -->
          <div v-if="ordersModal.loading" style="padding:40px;text-align:center;color:var(--text-secondary)">
            <i class="fa-solid fa-spinner-third fa-spin fa-2x"></i><br><br>Loading orders…
          </div>

          <!-- Empty -->
          <div v-else-if="!ordersModal.orders.length" class="admin-empty">
            <i class="fa-sharp fa-solid fa-box-open"></i>
            No orders found for this customer.
          </div>

          <!-- Order list -->
          <div v-else class="cmodal-body">
            <div v-for="ord in ordersModal.orders" :key="ord.id" class="order-card">
              <!-- Order header -->
              <div class="order-card-head">
                <div>
                  <span class="order-id">#{{ ord.id.slice(-8).toUpperCase() }}</span>
                  <span class="status-badge" :class="ord.status" style="margin-left:8px">{{ ord.status }}</span>
                </div>
                <div style="display:flex;align-items:center;gap:12px">
                  <span style="font-size:12px;color:var(--text-secondary)">
                    {{ fmtDate(ord.createdAt) }}
                  </span>
                  <span class="order-total">৳{{ ord.total.toLocaleString() }}</span>
                </div>
              </div>

              <!-- Items -->
              <div class="order-items">
                <div v-for="item in ord.items" :key="item.name + item.quantity" class="order-item">
                  <img
                    v-if="item.image"
                    :src="item.image"
                    :alt="item.name"
                    class="order-item-img"
                    onerror="this.style.display='none'"
                  />
                  <div class="order-item-img-placeholder" v-else>
                    <i class="fa-sharp fa-solid fa-box" style="font-size:12px;opacity:0.4"></i>
                  </div>
                  <div class="order-item-info">
                    <div class="order-item-name">{{ item.name }}</div>
                    <div class="order-item-meta">
                      ৳{{ item.price.toLocaleString() }} × {{ item.quantity }}
                    </div>
                  </div>
                  <div class="order-item-subtotal">
                    ৳{{ (item.price * item.quantity).toLocaleString() }}
                  </div>
                </div>
              </div>

              <!-- Totals row -->
              <div class="order-totals">
                <span class="col-muted">Subtotal ৳{{ ord.subtotal?.toLocaleString() ?? '—' }}</span>
                <span class="col-muted" v-if="ord.shipping">+ Shipping ৳{{ ord.shipping }}</span>
                <span class="col-muted">· Payment: <strong style="color:var(--text-primary)">{{ ord.paymentMethod }}</strong></span>
                <span class="col-muted">· Status: <strong style="color:var(--text-primary)">{{ ord.paymentStatus }}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ══════════════════════════════════════════════════════════════════════
       EDIT CUSTOMER MODAL
  ══════════════════════════════════════════════════════════════════════ -->
  <Teleport to="body">
    <Transition name="cmodal">
      <div v-if="editModal.open" class="cmodal-overlay" @click.self="editModal.open = false">
        <div class="cmodal-box" style="max-width:480px">
          <div class="cmodal-header">
            <div class="cmodal-title">
              <i class="fa-sharp fa-solid fa-pen-to-square" style="color:var(--brand)"></i>
              Edit Customer
            </div>
            <button class="admin-btn ghost" style="padding:6px 10px" @click="editModal.open = false">
              <i class="fa-sharp fa-solid fa-xmark fa-lg"></i>
            </button>
          </div>

          <div class="cmodal-body" style="padding:20px">
            <div class="edit-field">
              <label>Full Name</label>
              <input class="admin-input" v-model="editForm.name" placeholder="Full name" />
            </div>
            <div class="edit-field">
              <label>Email</label>
              <input class="admin-input" v-model="editForm.email" type="email" placeholder="Email address" />
            </div>
            <div class="edit-field">
              <label>Phone</label>
              <input class="admin-input" v-model="editForm.phone" placeholder="+880…" />
            </div>
            <div class="edit-field">
              <label>Address</label>
              <textarea class="admin-input" v-model="editForm.address" rows="3" placeholder="Full address" style="resize:vertical"></textarea>
            </div>

            <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
              <button class="admin-btn secondary" @click="editModal.open = false">Cancel</button>
              <button class="admin-btn primary" :disabled="editModal.saving" @click="saveEdit">
                <i class="fa-sharp fa-solid fa-floppy-disk"></i>
                {{ editModal.saving ? 'Saving…' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ══════════════════════════════════════════════════════════════════════
       DELETE CONFIRMATION MODAL
  ══════════════════════════════════════════════════════════════════════ -->
  <Teleport to="body">
    <Transition name="cmodal">
      <div v-if="deleteModal.open" class="cmodal-overlay" @click.self="deleteModal.open = false">
        <div class="cmodal-box" style="max-width:420px">
          <div class="cmodal-header">
            <div class="cmodal-title" style="color:#ef4444">
              <i class="fa-sharp fa-solid fa-triangle-exclamation"></i>
              Delete Customer
            </div>
            <button class="admin-btn ghost" style="padding:6px 10px" @click="deleteModal.open = false">
              <i class="fa-sharp fa-solid fa-xmark fa-lg"></i>
            </button>
          </div>
          <div class="cmodal-body" style="padding:20px">
            <p style="font-size:13px;color:var(--text-primary);margin-bottom:8px">
              Are you sure you want to delete <strong>{{ deleteModal.customer?.name }}</strong>?
            </p>
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:20px">
              This will permanently remove the customer and all their associated order data.
              This action <strong style="color:#ef4444">cannot be undone</strong>.
            </p>
            <div style="display:flex;gap:10px;justify-content:flex-end">
              <button class="admin-btn secondary" @click="deleteModal.open = false">Cancel</button>
              <button class="admin-btn danger" :disabled="deleteModal.deleting" @click="doDelete">
                <i class="fa-sharp fa-solid fa-trash"></i>
                {{ deleteModal.deleting ? 'Deleting…' : 'Yes, Delete' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
