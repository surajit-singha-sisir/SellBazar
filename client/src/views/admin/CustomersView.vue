<template>
  <div class="admin-page-wrap">

    <!-- ── Page header ──────────────────────────────────────────────────── -->
    <div class="admin-page-header">
      <div>
        <h1 class="page-title">Customers</h1>
        <p class="page-subtitle">{{ filtered.length }} customers found</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="admin-btn primary" @click="addModal.open = true">
          <i class="fa-sharp fa-solid fa-user-plus"></i> Add Customer
        </button>
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

            <!-- Total Orders — click opens orders modal -->
            <td style="text-align:center">
              <button class="orders-badge orders-badge-btn" :title="`View all orders for ${c.name}`" @click="openOrders(c)">
                <i class="fa-sharp fa-solid fa-receipt" style="font-size:10px"></i>
                {{ c.orderCount }}
              </button>
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
            <td colspan="9" style="text-align:center;padding:40px;color:var(--text-secondary)">
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
       ADD NEW CUSTOMER MODAL
  ══════════════════════════════════════════════════════════════════════ -->
  <Teleport to="body">
    <Transition name="cmodal">
      <div v-if="addModal.open" class="cmodal-overlay" @click.self="closeAddModal">
        <div class="cmodal-box" style="max-width:480px">
          <div class="cmodal-header">
            <div class="cmodal-title">
              <i class="fa-sharp fa-solid fa-user-plus" style="color:var(--brand)"></i>
              Add New Customer
            </div>
            <button class="admin-btn ghost" style="padding:6px 10px" @click="closeAddModal">
              <i class="fa-sharp fa-solid fa-xmark fa-lg"></i>
            </button>
          </div>

          <div class="cmodal-body" style="padding:20px">
            <div class="edit-field">
              <label>Full Name <span style="color:#ef4444">*</span></label>
              <input class="admin-input" v-model="addForm.name" placeholder="e.g. Rahim Uddin" />
              <span v-if="addErrors.name" class="field-error">{{ addErrors.name }}</span>
            </div>
            <div class="edit-field">
              <label>Email</label>
              <input class="admin-input" v-model="addForm.email" type="email" placeholder="email@example.com" />
              <span v-if="addErrors.email" class="field-error">{{ addErrors.email }}</span>
            </div>
            <div class="edit-field">
              <label>Phone <span style="color:#ef4444">*</span></label>
              <input class="admin-input" v-model="addForm.phone" placeholder="+8801XXXXXXXXX" />
              <span v-if="addErrors.phone" class="field-error">{{ addErrors.phone }}</span>
            </div>
            <div class="edit-field">
              <label>Address</label>
              <textarea class="admin-input" v-model="addForm.address" rows="3" placeholder="Full address" style="resize:vertical"></textarea>
            </div>

            <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
              <button class="admin-btn secondary" @click="closeAddModal">Cancel</button>
              <button class="admin-btn primary" :disabled="addModal.saving" @click="saveNewCustomer">
                <i class="fa-sharp fa-solid fa-user-plus"></i>
                {{ addModal.saving ? 'Adding…' : 'Add Customer' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

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
            <div style="display:flex;align-items:center;gap:8px">
              <!-- All Invoice button: only show when orders exist -->
              <button
                v-if="ordersModal.orders.length"
                class="admin-btn primary"
                style="padding:7px 14px;font-size:12px"
                @click="openInvoice"
              >
                <i class="fa-sharp fa-solid fa-file-invoice"></i> All Invoice
              </button>
              <button class="admin-btn ghost" style="padding:6px 10px" @click="ordersModal.open = false">
                <i class="fa-sharp fa-solid fa-xmark fa-lg"></i>
              </button>
            </div>
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
       ALL INVOICE MODAL
  ══════════════════════════════════════════════════════════════════════ -->
  <Teleport to="body">
    <Transition name="cmodal">
      <div v-if="invoiceModal.open" class="cmodal-overlay" @click.self="invoiceModal.open = false">
        <div class="cmodal-box invoice-modal-box">

          <!-- Toolbar -->
          <div class="cmodal-header invoice-toolbar">
            <div>
              <div class="cmodal-title">
                <i class="fa-sharp fa-solid fa-file-invoice" style="color:var(--brand)"></i>
                All Orders Invoice — {{ ordersModal.customer?.name }}
              </div>
              <div class="cmodal-sub">{{ ordersModal.orders.length }} order(s) · Grand Total: ৳{{ invoiceGrandTotal.toLocaleString() }}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <button class="admin-btn primary" style="padding:7px 16px;font-size:12px" @click="printInvoice">
                <i class="fa-sharp fa-solid fa-print"></i> Print
              </button>
              <button class="admin-btn ghost" style="padding:6px 10px" @click="invoiceModal.open = false">
                <i class="fa-sharp fa-solid fa-xmark fa-lg"></i>
              </button>
            </div>
          </div>

          <!-- Invoice document -->
          <div class="cmodal-body invoice-body" id="invoice-print-area">
            <div class="inv-doc">

              <!-- Header -->
              <div class="inv-head">
                <div>
                  <div class="inv-brand-name">SellBazar</div>
                  <div class="inv-brand-sub">sellbazar.com · support@sellbazar.com</div>
                </div>
                <div class="inv-meta">
                  <div class="inv-meta-title">INVOICE</div>
                  <div class="inv-meta-row">
                    <span>Date:</span>
                    <strong>{{ fmtDateFull(new Date().toISOString()) }}</strong>
                  </div>
                  <div class="inv-meta-row">
                    <span>Orders:</span>
                    <strong>{{ ordersModal.orders.length }}</strong>
                  </div>
                </div>
              </div>

              <!-- Bill To + Summary -->
              <div class="inv-bill-section">
                <div>
                  <div class="inv-section-label">BILL TO</div>
                  <div class="inv-customer-name">{{ ordersModal.customer?.name }}</div>
                  <div class="inv-customer-detail" v-if="ordersModal.customer?.email">
                    <i class="fa-sharp fa-solid fa-envelope" style="color:#f97316;font-size:10px"></i>
                    {{ ordersModal.customer.email }}
                  </div>
                  <div class="inv-customer-detail" v-if="ordersModal.customer?.phone">
                    <i class="fa-sharp fa-solid fa-phone" style="color:#f97316;font-size:10px"></i>
                    {{ ordersModal.customer.phone }}
                  </div>
                  <div class="inv-customer-detail" v-if="ordersModal.customer?.address">
                    <i class="fa-sharp fa-solid fa-location-dot" style="color:#f97316;font-size:10px"></i>
                    {{ ordersModal.customer.address }}
                  </div>
                </div>
                <div class="inv-summary-box">
                  <div class="inv-section-label">SUMMARY</div>
                  <div class="inv-summary-row">
                    <span>Total Orders</span>
                    <strong>{{ ordersModal.orders.length }}</strong>
                  </div>
                  <div class="inv-summary-row">
                    <span>Total Items</span>
                    <strong>{{ invoiceTotalQty }}</strong>
                  </div>
                  <div class="inv-summary-row">
                    <span>Subtotal</span>
                    <strong>৳{{ ordersModal.orders.reduce((s,o) => s + (o.subtotal ?? o.total), 0).toLocaleString() }}</strong>
                  </div>
                  <div class="inv-summary-row">
                    <span>Shipping</span>
                    <strong>৳{{ ordersModal.orders.reduce((s,o) => s + (Number(o.shipping) || 0), 0).toLocaleString() }}</strong>
                  </div>
                  <div class="inv-summary-row inv-summary-total">
                    <span>Grand Total</span>
                    <strong>৳{{ invoiceGrandTotal.toLocaleString() }}</strong>
                  </div>
                </div>
              </div>

              <!-- Per-order blocks -->
              <div v-for="(ord, oi) in ordersModal.orders" :key="ord.id" class="inv-order-block">

                <!-- Order header bar -->
                <div class="inv-order-head">
                  <div style="display:flex;align-items:center;gap:10px">
                    <span class="inv-order-num">#{{ ord.id.slice(-8).toUpperCase() }}</span>
                    <span :class="['inv-status-dot', ord.status]">{{ ord.status }}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
                    <span class="inv-date">{{ fmtDateFull(ord.createdAt) }}</span>
                    <span style="font-size:11px;color:#555">Payment: <strong>{{ ord.paymentMethod }}</strong></span>
                    <span style="font-size:11px;color:#555">Paid: <strong>{{ ord.paymentStatus }}</strong></span>
                    <span style="font-size:13px;font-weight:800;color:#f97316">৳{{ ord.total.toLocaleString() }}</span>
                  </div>
                </div>

                <!-- Items table -->
                <table class="inv-items-table">
                  <thead>
                    <tr>
                      <th style="width:28px">#</th>
                      <th style="width:44px"></th>
                      <th>Product</th>
                      <th style="text-align:right">Unit Price</th>
                      <th style="text-align:center">Qty</th>
                      <th style="text-align:right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, ii) in ord.items" :key="item.name + ii">
                      <td class="inv-item-num">{{ ii + 1 }}</td>
                      <td>
                        <img v-if="item.image" :src="item.image" :alt="item.name" class="inv-item-thumb" onerror="this.style.display='none'" />
                        <div v-else style="width:32px;height:32px;border-radius:6px;background:#f0f0f0;display:flex;align-items:center;justify-content:center">
                          <i class="fa-sharp fa-solid fa-box" style="font-size:11px;color:#bbb"></i>
                        </div>
                      </td>
                      <td class="inv-item-name">{{ item.name }}</td>
                      <td style="text-align:right">৳{{ item.price.toLocaleString() }}</td>
                      <td style="text-align:center">{{ item.quantity }}</td>
                      <td style="text-align:right;font-weight:700">৳{{ (item.price * item.quantity).toLocaleString() }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="inv-subtotal-row">
                      <td colspan="4"></td>
                      <td style="text-align:right;font-weight:600;color:#555">Subtotal</td>
                      <td style="text-align:right;font-weight:700">৳{{ (ord.subtotal ?? ord.total).toLocaleString() }}</td>
                    </tr>
                    <tr v-if="ord.shipping" class="inv-subtotal-row">
                      <td colspan="4"></td>
                      <td style="text-align:right;font-weight:600;color:#555">Shipping</td>
                      <td style="text-align:right">৳{{ Number(ord.shipping).toLocaleString() }}</td>
                    </tr>
                    <tr class="inv-total-row">
                      <td colspan="4"></td>
                      <td style="text-align:right;font-weight:800;color:#f97316">Order Total</td>
                      <td style="text-align:right;font-weight:900;color:#f97316">৳{{ ord.total.toLocaleString() }}</td>
                    </tr>
                  </tfoot>
                </table>

              </div><!-- /per-order block -->

              <!-- Grand total footer -->
              <div class="inv-grand-footer">
                <div class="inv-grand-left">
                  <div style="font-weight:700;font-size:13px;color:#fff;margin-bottom:4px">Thank you for shopping with us!</div>
                  <div class="inv-grand-note">This is a computer-generated invoice. No signature required.</div>
                </div>
                <div class="inv-grand-total">
                  <div class="inv-grand-label">GRAND TOTAL</div>
                  <div class="inv-grand-value">৳{{ invoiceGrandTotal.toLocaleString() }}</div>
                </div>
              </div>

            </div><!-- /inv-doc -->
          </div><!-- /invoice-body -->

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

<script setup lang="ts">
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { useAdminStore } from '@/stores/useAdminStore'
import { useExport } from '@/composables/useExport'
import type { ApiCustomer, ApiOrder } from '@/composables/useAdminApi'

const adminStore = useAdminStore()
const exporter   = useExport()

// ── Filter / sort state ──────────────────────────────────────────────────────
const search        = ref('')
const sortBy        = ref<string>('totalSpent')
const loyaltyFilter = ref('')
const page          = ref(1)
const perPage       = 15
const exportOpen    = ref(false)

watch([search, sortBy, loyaltyFilter], () => { page.value = 1 })

// ── Avatar helpers ───────────────────────────────────────────────────────────
const COLORS = ['#f97316','#3b82f6','#a855f7','#22c55e','#ef4444','#06b6d4','#ec4899','#f59e0b']
function hashIdx(s: string) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % COLORS.length
  return Math.abs(h) % COLORS.length
}
function avatarBg(id: string) { return COLORS[hashIdx(id)] + '22' }
function avatarFg(id: string) { return COLORS[hashIdx(id)] }
function initials(name: string) {
  return (name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── Data helpers ─────────────────────────────────────────────────────────────
const customers = computed(() => adminStore.customers)

const repeatCount = computed(() => customers.value.filter(c => c.orderCount > 1).length)
const avgLtv = computed(() => {
  if (!customers.value.length) return 0
  return Math.round(customers.value.reduce((s, c) => s + c.totalSpent, 0) / customers.value.length)
})
const topSpender = computed(() =>
  customers.value.reduce((a, b) => b.totalSpent > (a?.totalSpent ?? -1) ? b : a, customers.value[0] ?? null)
)

// Phone: could be a comma/semicolon separated string or single value
function phoneList(c: ApiCustomer): string[] {
  if (!c.phone) return []
  return c.phone.split(/[,;\/\s]+/).map(p => p.trim()).filter(Boolean)
}

// Address: same pattern
function addressList(c: ApiCustomer): string[] {
  if (!c.address) return []
  // Try to split on common separators (pipe or double semicolon) but keep commas as part of address text
  const raw = c.address.split(/\s*\|\s*/).map(a => a.trim()).filter(Boolean)
  return raw.length > 1 ? raw : [c.address.trim()]
}

function googleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ', Bangladesh')}`
}

// ── Date / time helpers ──────────────────────────────────────────────────────
function fmtDate(d: string) {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

function timeAgo(d: string): string {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1)  return 'Today'
  if (days < 7)  return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function accountAge(d: string): string {
  if (!d) return '—'
  const from = new Date(d)
  if (isNaN(from.getTime())) return '—'
  const now = new Date()
  let y = now.getFullYear() - from.getFullYear()
  let mo = now.getMonth() - from.getMonth()
  let dy = now.getDate() - from.getDate()
  if (dy < 0) { mo--; dy += new Date(now.getFullYear(), now.getMonth(), 0).getDate() }
  if (mo < 0) { y--; mo += 12 }
  const parts: string[] = []
  if (y > 0)  parts.push(`${y}y`)
  if (mo > 0) parts.push(`${mo}mo`)
  if (dy > 0) parts.push(`${dy}d`)
  return parts.join(' ') || 'Today'
}

function fmtNum(n: number) { return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toLocaleString() }

// ── Filtered + sorted + paginated ────────────────────────────────────────────
const filtered = computed(() => {
  let list = [...customers.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    )
  }
  if (loyaltyFilter.value === 'loyal') list = list.filter(c => c.orderCount > 1)
  if (loyaltyFilter.value === 'new')   list = list.filter(c => c.orderCount === 1)
  list.sort((a: any, b: any) => {
    if (sortBy.value === 'name')      return (a.name || '').localeCompare(b.name || '')
    if (sortBy.value === 'lastOrder') return (b.lastOrder || '').localeCompare(a.lastOrder || '')
    return (b[sortBy.value] ?? 0) - (a[sortBy.value] ?? 0)
  })
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paginated  = computed(() => filtered.value.slice((page.value - 1) * perPage, page.value * perPage))

// ── Add Customer modal ───────────────────────────────────────────────────────
const addModal = reactive({ open: false, saving: false })
const addForm  = reactive({ name: '', email: '', phone: '', address: '' })
const addErrors = reactive({ name: '', email: '', phone: '' })

function closeAddModal() {
  addModal.open = false
  addForm.name = ''; addForm.email = ''; addForm.phone = ''; addForm.address = ''
  addErrors.name = ''; addErrors.email = ''; addErrors.phone = ''
}

async function saveNewCustomer() {
  // Validation
  addErrors.name  = addForm.name.trim()  ? '' : 'Name is required.'
  addErrors.phone = addForm.phone.trim() ? '' : 'Phone is required.'
  addErrors.email = (!addForm.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email))
    ? '' : 'Enter a valid email.'
  if (addErrors.name || addErrors.phone || addErrors.email) return

  addModal.saving = true
  try {
    const now = new Date().toISOString()
    const newCustomer = {
      id:           'cust_' + Date.now().toString(36),
      name:         addForm.name.trim(),
      email:        addForm.email.trim(),
      phone:        addForm.phone.trim(),
      address:      addForm.address.trim(),
      orderCount:   0,
      totalSpent:   0,
      lastOrder:    now,
      firstOrder:   now,
      paymentMethod: '',
    }
    adminStore.customers.unshift(newCustomer)
    closeAddModal()
  } finally {
    addModal.saving = false
  }
}

// ── Orders modal ─────────────────────────────────────────────────────────────
const ordersModal = reactive({
  open: false,
  loading: false,
  customer: null as ApiCustomer | null,
  orders: [] as ApiOrder[],
})

async function openOrders(c: ApiCustomer) {
  ordersModal.customer = c
  ordersModal.orders   = []
  ordersModal.open     = true
  ordersModal.loading  = true
  try {
    // Match orders from the store by customer email/phone/name
    const allOrders: ApiOrder[] = adminStore.orders
    ordersModal.orders = allOrders.filter(o =>
      (c.email && o.customer?.email === c.email) ||
      (c.phone && o.customer?.phone === c.phone) ||
      (c.name  && o.customer?.name  === c.name)
    )
    // If store is empty, try loading
    if (!allOrders.length) {
      await adminStore.loadOrders()
      ordersModal.orders = adminStore.orders.filter(o =>
        (c.email && o.customer?.email === c.email) ||
        (c.phone && o.customer?.phone === c.phone) ||
        (c.name  && o.customer?.name  === c.name)
      )
    }
  } finally {
    ordersModal.loading = false
  }
}

// ── Edit modal ───────────────────────────────────────────────────────────────
const editModal = reactive({
  open: false,
  saving: false,
  customer: null as ApiCustomer | null,
})
const editForm = reactive({ name: '', email: '', phone: '', address: '' })

function openEdit(c: ApiCustomer) {
  editModal.customer = c
  editForm.name    = c.name    ?? ''
  editForm.email   = c.email   ?? ''
  editForm.phone   = c.phone   ?? ''
  editForm.address = c.address ?? ''
  editModal.open   = true
}

async function saveEdit() {
  if (!editModal.customer) return
  editModal.saving = true
  try {
    // Patch every matching order's customer object in the store
    adminStore.orders.forEach(o => {
      if (
        (editModal.customer!.email && o.customer?.email === editModal.customer!.email) ||
        (editModal.customer!.phone && o.customer?.phone === editModal.customer!.phone)
      ) {
        o.customer = {
          ...o.customer,
          name:    editForm.name,
          email:   editForm.email,
          phone:   editForm.phone,
          address: editForm.address,
        }
      }
    })
    // Patch the customer entry in adminStore.customers
    const idx = adminStore.customers.findIndex(c => c.id === editModal.customer!.id)
    if (idx !== -1) {
      adminStore.customers[idx] = {
        ...adminStore.customers[idx],
        name:    editForm.name,
        email:   editForm.email,
        phone:   editForm.phone,
        address: editForm.address,
      }
    }
    editModal.open = false
  } finally {
    editModal.saving = false
  }
}

// ── Delete modal ─────────────────────────────────────────────────────────────
const deleteModal = reactive({
  open: false,
  deleting: false,
  customer: null as ApiCustomer | null,
})

function confirmDelete(c: ApiCustomer) {
  deleteModal.customer = c
  deleteModal.open     = true
}

async function doDelete() {
  if (!deleteModal.customer) return
  deleteModal.deleting = true
  try {
    const c = deleteModal.customer
    // Remove all matching orders via the store (which calls the API)
    const matchingOrders = adminStore.orders.filter(o =>
      (c.email && o.customer?.email === c.email) ||
      (c.phone && o.customer?.phone === c.phone)
    )
    for (const o of matchingOrders) {
      await adminStore.deleteOrder(o.id)
    }
    // Remove from customers list
    adminStore.removeCustomer(c.id)
    deleteModal.open = false
  } finally {
    deleteModal.deleting = false
  }
}

// ── Export ───────────────────────────────────────────────────────────────────
function doExport(fmt: 'excel' | 'pdf' | 'csv' | 'json') {
  exportOpen.value = false
  const data = filtered.value.map(c => ({
    Name: c.name, Email: c.email, Phone: c.phone, Address: c.address,
    Orders: c.orderCount, TotalSpent: c.totalSpent,
    AvgOrder: Math.round(c.totalSpent / Math.max(c.orderCount, 1)),
    LastOrder: fmtDate(c.lastOrder), FirstOrder: fmtDate(c.firstOrder),
    AccountAge: accountAge(c.firstOrder),
    Payment: c.paymentMethod, Loyalty: c.orderCount > 1 ? 'Loyal' : 'New',
  }))
  const filename = `customers_${new Date().toISOString().slice(0, 10)}`
  if (fmt === 'excel') exporter.exportExcel(data, filename, 'Customers')
  else if (fmt === 'csv')  exporter.exportCSV(data, filename)
  else if (fmt === 'json') exporter.exportJSON(data, filename)
  else exporter.exportPDF(
    ['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Account Age', 'Status'],
    filtered.value.map(c => [
      c.name, c.email || '—', c.phone || '—', c.orderCount,
      `৳${c.totalSpent}`, accountAge(c.firstOrder), c.orderCount > 1 ? 'Loyal' : 'New',
    ]),
    filename, 'SellBazar — Customers Export'
  )
}

// ── Invoice modal ─────────────────────────────────────────────────────────
const invoiceModal = reactive({ open: false })

const invoiceGrandTotal = computed(() =>
  ordersModal.orders.reduce((s, o) => s + o.total, 0)
)
const invoiceTotalQty = computed(() =>
  ordersModal.orders.reduce((s, o) => s + o.items.reduce((q, i) => q + i.quantity, 0), 0)
)

function openInvoice() { invoiceModal.open = true }

function fmtDateFull(d: string) {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

function printInvoice() {
  const el = document.getElementById('invoice-print-area')
  if (!el) return

  // Collect all <style> and <link rel="stylesheet"> from the current page
  const styleNodes = [...document.querySelectorAll('style, link[rel="stylesheet"]')]
  const styleHTML  = styleNodes.map(n => n.outerHTML).join('\n')

  const win = window.open('', '_blank')
  if (!win) return

  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice — ${ordersModal.customer?.name ?? ''}</title>
  ${styleHTML}
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #fff; }
    /* force light-mode colours so the white invoice doc renders correctly */
    :root {
      --sidebar-bg: #ffffff;
      --sidebar-border: #e5e7eb;
      --surface: #f9fafb;
      --surface-hover: #f3f4f6;
      --text-primary: #111827;
      --text-secondary: #6b7280;
      --brand: #f97316;
      --brand-dim: rgba(249,115,22,0.12);
      --admin-bg: #f3f4f6;
    }
    /* strip modal chrome — only show the invoice doc */
    .cmodal-overlay, .cmodal-box, .cmodal-header,
    .invoice-toolbar, .cmodal-body { all: unset; display: block; }
    .invoice-body { background: #f3f4f6; padding: 0; }
  </style>
</head>
<body>
  ${el.innerHTML}
</body>
</html>`)

  win.document.close()

  // Wait for resources then print
  win.onload = () => {
    win.focus()
    win.print()
    win.close()
  }
  // Fallback in case onload already fired
  setTimeout(() => {
    try { win.focus(); win.print(); win.close() } catch {}
  }, 800)
}

// ── Load ─────────────────────────────────────────────────────────────────────
async function load() { await adminStore.loadCustomers() }
onMounted(load)

// ── Click-outside directive ──────────────────────────────────────────────────
const vClickOutside = {
  mounted(el: any, binding: any) {
    el._clickHandler = (e: Event) => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('click', el._clickHandler)
  },
  unmounted(el: any) { document.removeEventListener('click', el._clickHandler) }
}
</script>

<style scoped>
/* ── Export dropdown ────────────────────────────────────────────────────── */
.export-wrap { position: relative; }
.export-dropdown {
  position: absolute; top: calc(100% + 6px); right: 0; z-index: 200;
  background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
  border-radius: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  min-width: 150px; overflow: hidden;
}
.export-dropdown button {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 10px 14px; background: none; border: none;
  color: var(--text-primary); font-size: 13px; cursor: pointer;
  text-align: left; transition: background 0.15s;
}
.export-dropdown button:hover { background: var(--surface-hover); }

/* ── Column helpers ─────────────────────────────────────────────────────── */
.col-index { color: var(--text-secondary); font-size: 12px; }
.col-muted { color: var(--text-secondary); font-size: 11px; }

/* ── Customer identity cell ─────────────────────────────────────────────── */
.cust-identity { display: flex; align-items: flex-start; gap: 10px; }
.customer-avatar {
  width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800;
}
.cust-name  { font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; }
.cust-email { font-size: 11px; color: var(--text-secondary); margin-top: 1px; }

/* ── Phone chips ────────────────────────────────────────────────────────── */
.phone-list  { display: flex; flex-direction: column; gap: 4px; }
.phone-chip  {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 500; color: var(--text-primary);
  text-decoration: none; white-space: nowrap;
  transition: color 0.15s;
  i { font-size: 10px; color: var(--brand); }
}
.phone-chip:hover { color: var(--brand); }

/* ── Address rows ───────────────────────────────────────────────────────── */
.address-list  { display: flex; flex-direction: column; gap: 5px; }
.address-row   { display: flex; align-items: flex-start; gap: 5px; }
.address-text  {
  font-size: 11px; color: var(--text-secondary); line-height: 1.4;
  max-width: 180px; word-break: break-word;
}
.map-link {
  flex-shrink: 0; display: inline-flex; align-items: center;
  font-size: 12px; color: var(--brand); opacity: 0.7;
  text-decoration: none; margin-top: 1px; transition: opacity 0.15s;
}
.map-link:hover { opacity: 1; }

/* ── Orders count badge ─────────────────────────────────────────────────── */
.orders-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 28px; height: 24px; padding: 0 8px;
  background: var(--brand-dim); color: var(--brand);
  border-radius: 20px; font-size: 12px; font-weight: 700;
}

/* ── Spent ──────────────────────────────────────────────────────────────── */
.spent-value { font-size: 13px; font-weight: 700; color: var(--brand); }

/* ── Account age pill ───────────────────────────────────────────────────── */
.age-pill {
  display: inline-block; margin-top: 3px;
  padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600;
  background: rgba(59,130,246,0.1); color: #3b82f6;
}

/* ── Action buttons ─────────────────────────────────────────────────────── */
.action-btns { display: flex; gap: 6px; justify-content: center; }
.action-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--sidebar-border);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 13px; transition: all 0.15s;
  background: var(--surface);
}
.action-btn.edit   { color: #3b82f6; }
.action-btn.edit:hover   { background: rgba(59,130,246,0.12); border-color: #3b82f6; }
.action-btn.delete { color: #ef4444; }
.action-btn.delete:hover { background: rgba(239,68,68,0.12); border-color: #ef4444; }
.action-btn:active { transform: scale(0.92); }

/* ── Table min-width for horizontal scroll ──────────────────────────────── */
.customers-table { min-width: 1100px; }

/* ══════════════════════════════════════════════════════════════════════════
   MODAL SHARED STYLES
══════════════════════════════════════════════════════════════════════════ */
.cmodal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}
.cmodal-box {
  background: var(--sidebar-bg); border: 1px solid var(--sidebar-border);
  border-radius: 16px; width: 100%; max-width: 760px;
  max-height: 86vh; display: flex; flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5);
}
.cmodal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 18px 20px 14px; border-bottom: 1px solid var(--sidebar-border); flex-shrink: 0;
}
.cmodal-title { font-size: 15px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
.cmodal-sub   { font-size: 12px; color: var(--text-secondary); margin-top: 3px; }
.cmodal-body  { overflow-y: auto; padding: 16px; flex: 1; display: flex; flex-direction: column; gap: 12px; }

/* ── Order card inside modal ────────────────────────────────────────────── */
.order-card {
  background: var(--surface); border: 1px solid var(--sidebar-border);
  border-radius: 12px; overflow: hidden;
}
.order-card-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border-bottom: 1px solid var(--sidebar-border);
  flex-wrap: wrap; gap: 8px;
}
.order-id    { font-size: 12px; font-weight: 700; color: var(--text-primary); font-family: monospace; }
.order-total { font-size: 14px; font-weight: 800; color: var(--brand); }
.order-items { display: flex; flex-direction: column; gap: 0; }
.order-item  {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  border-bottom: 1px solid var(--sidebar-border);
  &:last-child { border-bottom: none; }
}
.order-item-img {
  width: 40px; height: 40px; border-radius: 8px; object-fit: cover; flex-shrink: 0;
}
.order-item-img-placeholder {
  width: 40px; height: 40px; border-radius: 8px; flex-shrink: 0;
  background: var(--surface-hover); display: flex; align-items: center; justify-content: center;
}
.order-item-info { flex: 1; min-width: 0; }
.order-item-name { font-size: 12px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.order-item-meta { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
.order-item-subtotal { font-size: 12px; font-weight: 700; color: var(--text-primary); white-space: nowrap; flex-shrink: 0; }
.order-totals {
  display: flex; flex-wrap: wrap; gap: 8px 14px;
  padding: 8px 14px; font-size: 11px; border-top: 1px solid var(--sidebar-border);
  background: var(--surface-hover);
}

/* ── Field error ────────────────────────────────────────────────────────── */
.field-error {
  font-size: 11px; color: #ef4444; margin-top: -2px;
}

/* ── Edit form ──────────────────────────────────────────────────────────── */
.edit-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.edit-field label { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
.edit-field textarea.admin-input { font-family: inherit; }

/* ── Modal transition ───────────────────────────────────────────────────── */
.cmodal-enter-active, .cmodal-leave-active { transition: opacity 0.2s, transform 0.2s; }
.cmodal-enter-from, .cmodal-leave-to { opacity: 0; }
.cmodal-enter-from .cmodal-box, .cmodal-leave-to .cmodal-box { transform: translateY(12px) scale(0.98); }

/* ── Orders badge as clickable button ──────────────────────────────────── */
.orders-badge-btn {
  border: none; cursor: pointer; gap: 5px;
  transition: transform 0.15s, box-shadow 0.15s;
}
.orders-badge-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 2px 10px rgba(249,115,22,0.3);
}
.orders-badge-btn:active { transform: scale(0.96); }

/* ══════════════════════════════════════════════════════════════════════════
   INVOICE MODAL
══════════════════════════════════════════════════════════════════════════ */
.invoice-modal-box { max-width: 860px; }
.invoice-toolbar   { background: var(--surface-hover); border-radius: 16px 16px 0 0; }
.invoice-body      { background: var(--admin-bg); padding: 24px; }

/* The white invoice document inside the modal */
.inv-doc {
  background: #ffffff;
  color: #111111;
  border-radius: 10px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.18);
  overflow: hidden;
  font-family: 'Inter', system-ui, sans-serif;
}

/* ── Invoice head ───────────────────────────────────────────────────────── */
.inv-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 28px 28px 20px;
  background: linear-gradient(135deg, #f97316 0%, #d946ef 100%);
  color: #ffffff;
  flex-wrap: wrap; gap: 12px;
}
.inv-brand-name { font-size: 22px; font-weight: 900; letter-spacing: -0.03em; }
.inv-brand-sub  { font-size: 11px; opacity: 0.8; margin-top: 2px; }
.inv-meta       { text-align: right; }
.inv-meta-title { font-size: 14px; font-weight: 800; letter-spacing: 0.1em; opacity: 0.9; }
.inv-meta-row   { font-size: 11px; opacity: 0.85; margin-top: 4px; display: flex; gap: 6px; justify-content: flex-end; }

/* ── Bill to / summary ──────────────────────────────────────────────────── */
.inv-bill-section {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 20px 28px; border-bottom: 2px solid #f0f0f0;
  flex-wrap: wrap; gap: 16px;
}
.inv-section-label   { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: #888; margin-bottom: 6px; }
.inv-customer-name   { font-size: 16px; font-weight: 700; color: #111; }
.inv-customer-detail { font-size: 12px; color: #555; margin-top: 4px; display: flex; align-items: center; gap: 6px; }
.inv-summary-box     { min-width: 200px; }
.inv-summary-row     {
  display: flex; justify-content: space-between; gap: 24px;
  font-size: 12px; padding: 5px 0; border-bottom: 1px solid #f0f0f0; color: #444;
  strong { color: #111; font-weight: 700; }
  &:last-child { border-bottom: none; }
}
.inv-summary-total { font-size: 14px !important; font-weight: 700; color: #f97316 !important; border-top: 2px solid #f97316 !important; margin-top: 4px; padding-top: 8px !important; }

/* ── Per-order block ────────────────────────────────────────────────────── */
.inv-order-block   { border-bottom: 2px solid #f0f0f0; }
.inv-order-head    {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 28px; background: #fafafa;
  flex-wrap: wrap; gap: 8px;
}
.inv-order-num     { font-size: 12px; font-weight: 700; color: #111; font-family: monospace; }
.inv-date          { font-size: 11px; color: #777; }

.inv-status-dot {
  padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase;
  &.pending    { background: #fef9c3; color: #a16207; }
  &.processing { background: #dbeafe; color: #1e40af; }
  &.shipped    { background: #ede9fe; color: #6d28d9; }
  &.delivered  { background: #dcfce7; color: #166534; }
  &.cancelled  { background: #fee2e2; color: #991b1b; }
}

/* ── Items table ────────────────────────────────────────────────────────── */
.inv-items-table {
  width: 100%; border-collapse: collapse; font-size: 12px;

  th {
    padding: 8px 14px; text-align: left; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.07em; color: #888;
    background: #f8f8f8; border-bottom: 1px solid #eee;
  }
  td {
    padding: 10px 14px; border-bottom: 1px solid #f0f0f0; color: #333; vertical-align: middle;
  }
  tbody tr:hover td { background: #fffbf7; }
  tfoot td { padding: 8px 14px; font-size: 12px; color: #444; background: #fafafa; border-top: 1px solid #eee; }
}
.inv-item-num   { color: #aaa; font-size: 11px; width: 24px; }
.inv-item-name  { font-weight: 500; color: #222; }
.inv-item-thumb { width: 32px; height: 32px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
.inv-subtotal-row td { color: #666; }
.inv-total-row   td  { color: #111; font-size: 13px; border-top: 2px solid #eee; }

/* ── Grand total footer ─────────────────────────────────────────────────── */
.inv-grand-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 28px; background: #111;
  flex-wrap: wrap; gap: 12px;
}
.inv-grand-left  { color: rgba(255,255,255,0.7); font-size: 12px; }
.inv-grand-note  { color: rgba(255,255,255,0.6); }
.inv-grand-total { text-align: right; }
.inv-grand-label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; color: rgba(255,255,255,0.5); }
.inv-grand-value { font-size: 26px; font-weight: 900; color: #f97316; letter-spacing: -0.03em; margin-top: 2px; }

/* ── Print styles ───────────────────────────────────────────────────────── */
@media print {
  /* Hide everything on the page */
  body * { visibility: hidden !important; }

  /* Show only the invoice document itself */
  #invoice-print-area,
  #invoice-print-area * { visibility: visible !important; }

  /* Position the invoice to fill the page from top-left */
  #invoice-print-area {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
  }

  /* Clean up the doc card for paper */
  .inv-doc { box-shadow: none !important; border-radius: 0 !important; }

  /* Hide the toolbar (Print button, close button) */
  .invoice-toolbar { display: none !important; }

  /* Avoid page breaks inside a single order block */
  .inv-order-block { page-break-inside: avoid; break-inside: avoid; }
}
</style>
