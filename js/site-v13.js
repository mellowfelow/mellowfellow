/* ============================================================
   Mellow Fellow — runtime JS for the static multi-page site.
   Handles: age gate, mobile drawer nav, cart (localStorage),
   add-to-cart buttons, quantity steppers, forms.
   ============================================================ */
(function () {
  'use strict';

  /* ====== AGE GATE ====== */
  function ageGate() {
    var ok = false;
    try { ok = sessionStorage.getItem('mf_age_ok') === '1'; } catch (e) {}
    if (ok) return;
    var g = document.createElement('div');
    g.id = 'ageGate';
    g.innerHTML =
      '<div class="age-box">' +
        '<div class="age-emoji">\uD83C\uDF3F</div>' +
        '<p class="age-eyebrow">Age Restricted Content</p>' +
        '<h2 class="age-title">Are You 21 or Older?</h2>' +
        '<p class="age-text">Our products are intended for adults aged 21 and over. By entering this site you confirm you are of legal age in your state.</p>' +
        '<button class="age-yes" type="button">Yes, I Am 21 or Older &mdash; Enter Site</button>' +
        '<button class="age-no" type="button">No, I Am Under 21</button>' +
      '</div>';
    document.body.appendChild(g);
    document.body.style.overflow = 'hidden';
    g.querySelector('.age-yes').addEventListener('click', function () {
      try { sessionStorage.setItem('mf_age_ok', '1'); } catch (e) {}
      g.style.opacity = '0';
      setTimeout(function () { g.remove(); document.body.style.overflow = ''; }, 350);
    });
    g.querySelector('.age-no').addEventListener('click', function () {
      g.querySelector('.age-box').innerHTML =
        '<div class="age-emoji">\uD83D\uDEAB</div>' +
        '<h2 class="age-title">Access Restricted</h2>' +
        '<p class="age-text">Our products are only available to adults aged 21 and over.</p>';
    });
  }

  /* ====== MOBILE DRAWER ====== */
  function drawer() {
    var toggle = document.getElementById('menuToggle');
    var dr = document.getElementById('mobileDrawer');
    var overlay = document.getElementById('mDrawerOverlay');
    var closeBtn = document.getElementById('mDrawerClose');
    if (!toggle || !dr || !overlay) return;

    function open() {
      closeCartDrawer();
      dr.hidden = false; overlay.hidden = false;
      /* force reflow so the transition runs */
      void dr.offsetWidth;
      dr.classList.add('open'); overlay.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      dr.classList.remove('open'); overlay.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      setTimeout(function () {
        if (!dr.classList.contains('open')) { dr.hidden = true; overlay.hidden = true; }
      }, 320);
    }
    toggle.addEventListener('click', function () {
      dr.classList.contains('open') ? close() : open();
    });
    overlay.addEventListener('click', close);
    if (closeBtn) closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && dr.classList.contains('open')) close();
    });

    /* accordion inside drawer */
    var heads = dr.querySelectorAll('.m-acc-head');
    for (var i = 0; i < heads.length; i++) {
      heads[i].addEventListener('click', function () {
        var open = this.getAttribute('aria-expanded') === 'true';
        for (var j = 0; j < heads.length; j++) {
          heads[j].setAttribute('aria-expanded', 'false');
          heads[j].nextElementSibling.classList.remove('open');
        }
        if (!open) {
          this.setAttribute('aria-expanded', 'true');
          this.nextElementSibling.classList.add('open');
        }
      });
    }
  }

  /* ====== CART (localStorage) ====== */
  function getCart() {
    try { return JSON.parse(localStorage.getItem('mf_cart') || '[]') || []; }
    catch (e) { return []; }
  }
  function setCart(c) {
    try { localStorage.setItem('mf_cart', JSON.stringify(c)); } catch (e) {}
  }
  function cartCount() {
    return getCart().reduce(function (a, i) { return a + i.qty; }, 0);
  }
  function updateBadge() {
    var b = document.getElementById('cartBadge');
    if (b) b.textContent = cartCount();
  }
  function toast(msg) {
    var t = document.getElementById('siteToast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function addToCart(id, qty) {
    qty = qty || 1;
    var prod = (window.MF_PRODUCTS || {})[id];
    var c = getCart();
    var found = null;
    for (var i = 0; i < c.length; i++) { if (c[i].id === id) { found = c[i]; break; } }
    if (found) { found.qty += qty; }
    else {
      c.push({
        id: id,
        name: prod ? prod.name : ('Product ' + id),
        price: prod ? prod.price : 0,
        qty: qty
      });
    }
    setCart(c); updateBadge();
    openCartDrawer();
  }

  /* ====== CART DRAWER (mini-cart flyout) ====== */
  function buildCartDrawer() {
    if (document.getElementById('cartDrawer')) return;
    var ov = document.createElement('div');
    ov.className = 'cd-overlay'; ov.id = 'cdOverlay'; ov.hidden = true;
    var dr = document.createElement('aside');
    dr.className = 'cart-drawer'; dr.id = 'cartDrawer'; dr.hidden = true;
    dr.setAttribute('aria-label', 'Shopping cart');
    dr.innerHTML =
      '<div class="cd-top">' +
        '<span class="cd-title">Your Cart <span class="cd-count" id="cdCount">0</span></span>' +
        '<button class="cd-close" id="cdClose" type="button" aria-label="Close cart">&times;</button>' +
      '</div>' +
      '<div class="cd-items" id="cdItems"></div>' +
      '<div class="cd-footer" id="cdFooter" hidden>' +
        '<p class="cd-note" id="cdNote"></p>' +
        '<div class="cd-subtotal-row"><span>Subtotal</span><strong id="cdSubtotal">$0.00</strong></div>' +
        '<a class="btn-primary cd-checkout" href="/checkout/" id="cdCheckoutBtn">Checkout &rarr;</a>' +
        '<a class="btn-outline cd-viewcart" href="/cart/">View Full Cart</a>' +
      '</div>';
    document.body.appendChild(ov);
    document.body.appendChild(dr);

    function close() {
      dr.classList.remove('open'); ov.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(function () {
        if (!dr.classList.contains('open')) { dr.hidden = true; ov.hidden = true; }
      }, 320);
    }
    ov.addEventListener('click', close);
    dr.querySelector('#cdClose').addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && dr.classList.contains('open')) close();
    });
    /* qty +/- and remove, delegated within the drawer */
    dr.addEventListener('click', function (e) {
      var ch = e.target.closest('[data-cdqty]');
      var rm = e.target.closest('[data-cdremove]');
      if (ch) {
        var c = getCart();
        var i = parseInt(ch.getAttribute('data-cdqty'), 10);
        if (c[i]) {
          c[i].qty = Math.max(1, c[i].qty + parseInt(ch.getAttribute('data-d'), 10));
          setCart(c); updateBadge(); renderCartDrawer(); renderCartPage();
        }
      }
      if (rm) {
        var c2 = getCart();
        c2.splice(parseInt(rm.getAttribute('data-cdremove'), 10), 1);
        setCart(c2); updateBadge(); renderCartDrawer(); renderCartPage();
      }
    });
    dr._close = close;
  }
  function closeCartDrawer() {
    var dr = document.getElementById('cartDrawer');
    if (dr && dr._close) dr._close();
  }
  function openCartDrawer() {
    buildCartDrawer();
    renderCartDrawer();
    var dr = document.getElementById('cartDrawer');
    var ov = document.getElementById('cdOverlay');
    if (!dr || !ov) return;
    /* the mobile nav drawer and the cart drawer both slide from the right —
       never show both at once */
    var mdr = document.getElementById('mobileDrawer');
    var mov = document.getElementById('mDrawerOverlay');
    if (mdr && mdr.classList.contains('open')) {
      mdr.classList.remove('open'); if (mov) mov.classList.remove('open');
    }
    dr.hidden = false; ov.hidden = false;
    void dr.offsetWidth;
    dr.classList.add('open'); ov.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function renderCartDrawer() {
    var itemsEl = document.getElementById('cdItems');
    if (!itemsEl) return;
    var c = getCart();
    var countEl = document.getElementById('cdCount');
    var subEl = document.getElementById('cdSubtotal');
    var noteEl = document.getElementById('cdNote');
    var footer = document.getElementById('cdFooter');
    if (countEl) countEl.textContent = cartCount();
    if (!c.length) {
      itemsEl.innerHTML = '<div class="cd-empty"><p class="cd-empty-icon">🛒</p>' +
        '<p>Your cart is empty.</p><a class="btn-outline" href="/shop/">Browse Products</a></div>';
      if (footer) footer.hidden = true;
      return;
    }
    if (footer) footer.hidden = false;
    var html = '', sub = 0;
    c.forEach(function (it, idx) {
      sub += it.price * it.qty;
      html += '<div class="cd-item">' +
        '<div class="cd-item-info"><p class="cd-item-name">' + it.name + '</p>' +
        '<div class="qty-control">' +
          '<button class="qty-btn" type="button" data-cdqty="' + idx + '" data-d="-1">&minus;</button>' +
          '<span class="qty-num">' + it.qty + '</span>' +
          '<button class="qty-btn" type="button" data-cdqty="' + idx + '" data-d="1">+</button>' +
          '<button class="btn-remove" type="button" data-cdremove="' + idx + '">Remove</button>' +
        '</div></div>' +
        '<span class="cd-item-price">$' + (it.price * it.qty).toFixed(2) + '</span>' +
        '</div>';
    });
    itemsEl.innerHTML = html;
    if (subEl) subEl.textContent = '$' + sub.toFixed(2);
    if (noteEl) {
      noteEl.innerHTML = sub < MIN_ORDER
        ? '⚠ Minimum order is $' + MIN_ORDER + '. Add <strong>$' + (MIN_ORDER - sub).toFixed(2) + '</strong> more.'
        : '✓ Minimum met. ' + (sub >= FREE_SHIP_OVER ? 'Free shipping applied!' : 'Add $' + (FREE_SHIP_OVER - sub).toFixed(2) + ' more for FREE shipping.');
      noteEl.className = 'cd-note ' + (sub < MIN_ORDER ? 'warn' : 'ok');
    }
  }
  function bindCartTrigger() {
    var link = document.querySelector('a[aria-label="Shopping cart"]');
    if (!link) return;
    link.addEventListener('click', function (e) {
      e.preventDefault();
      openCartDrawer();
    });
  }

  /* ====== ADD-TO-CART + QTY BUTTONS ====== */
  function bindShop() {
    /* quantity stepper (product detail page) */
    var qty = 1;
    var qtyEl = document.getElementById('pdQty');
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-qty]');
      if (t && qtyEl) {
        qty = Math.max(1, qty + parseInt(t.getAttribute('data-qty'), 10));
        qtyEl.textContent = qty;
      }
    });
    /* quantity stepper (product CARDS) */
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-cardqty]');
      if (!t) return;
      e.preventDefault();
      var pid = t.getAttribute('data-pid');
      var numEl = document.getElementById('cardqty-' + pid);
      if (!numEl) return;
      var cur = parseInt(numEl.textContent, 10) || 1;
      cur = Math.max(1, Math.min(99, cur + parseInt(t.getAttribute('data-cardqty'), 10)));
      numEl.textContent = cur;
    });
    /* add-to-cart */
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-add]');
      if (!t) return;
      e.preventDefault();
      var id = parseInt(t.getAttribute('data-add'), 10);
      var n = 1;
      if (t.getAttribute('data-qtyaware')) {
        n = qty;                                 /* product detail page */
      } else if (t.getAttribute('data-cardadd')) {
        var numEl = document.getElementById('cardqty-' + id);  /* product card */
        n = numEl ? (parseInt(numEl.textContent, 10) || 1) : 1;
        if (numEl) numEl.textContent = '1';      /* reset card stepper after add */
      }
      addToCart(id, n);
    });
  }

  /* ====== CART PAGE RENDER ====== */
  function renderCartPage() {
    var itemsEl = document.getElementById('cartItems');
    if (!itemsEl) return;
    var c = getCart();
    var subEl = document.getElementById('cartSubtotal');
    var shipEl = document.getElementById('cartShipping');
    var totEl = document.getElementById('cartTotal');
    var noteEl = document.getElementById('cartMinNote');

    if (!c.length) {
      itemsEl.innerHTML = '<div class="cart-empty"><p class="cart-empty-icon">\uD83D\uDED2</p>' +
        '<p>Your cart is empty.</p><a class="btn-primary" href="/shop/">Browse Products</a></div>';
      if (subEl) subEl.textContent = '$0.00';
      if (shipEl) shipEl.textContent = '$0.00';
      if (totEl) totEl.textContent = '$0.00';
      if (noteEl) noteEl.textContent = '';
      return;
    }
    var html = '', sub = 0;
    c.forEach(function (it, idx) {
      sub += it.price * it.qty;
      html += '<div class="cart-item">' +
        '<div class="cart-item-info"><p class="cart-item-name">' + it.name + '</p>' +
        '<div class="qty-control">' +
          '<button class="qty-btn" data-cart="' + idx + '" data-d="-1">&minus;</button>' +
          '<span class="qty-num">' + it.qty + '</span>' +
          '<button class="qty-btn" data-cart="' + idx + '" data-d="1">+</button>' +
          '<button class="btn-remove" data-remove="' + idx + '">Remove</button>' +
        '</div></div>' +
        '<span class="cart-item-price">$' + (it.price * it.qty).toFixed(2) + '</span>' +
        '</div>';
    });
    itemsEl.innerHTML = html;
    var ship = sub >= 200 ? 0 : 20;
    if (subEl) subEl.textContent = '$' + sub.toFixed(2);
    if (shipEl) shipEl.textContent = ship === 0 ? 'FREE' : '$20.00';
    if (totEl) totEl.textContent = '$' + (sub + ship).toFixed(2);
    if (noteEl) {
      noteEl.innerHTML = sub < 100
        ? '\u26A0 Minimum order is $100. Add <strong>$' + (100 - sub).toFixed(2) + '</strong> more.'
        : '\u2713 Minimum met. ' + (sub >= 200 ? 'Free shipping applied!' : 'Add $' + (200 - sub).toFixed(2) + ' more for FREE shipping.');
      noteEl.className = 'minimum-notice ' + (sub < 100 ? 'warn' : 'ok');
    }
    /* WhatsApp checkout link with order details */
    var waBtn = document.getElementById('waCheckoutBtn');
    if (waBtn) {
      var lines = c.map(function (it) {
        return it.name + ' x' + it.qty + ' = $' + (it.price * it.qty).toFixed(2);
      });
      var msg = 'Hi! I would like to order:\n' + lines.join('\n') +
        '\nSubtotal: $' + sub.toFixed(2);
      waBtn.href = 'https://wa.me/12162505746?text=' + encodeURIComponent(msg);
    }

    document.addEventListener('click', function (e) {
      var ch = e.target.closest('[data-cart]');
      var rm = e.target.closest('[data-remove]');
      if (ch) {
        var c2 = getCart();
        var i = parseInt(ch.getAttribute('data-cart'), 10);
        if (c2[i]) {
          c2[i].qty = Math.max(1, c2[i].qty + parseInt(ch.getAttribute('data-d'), 10));
          setCart(c2); updateBadge(); renderCartPage();
        }
      }
      if (rm) {
        var c3 = getCart();
        c3.splice(parseInt(rm.getAttribute('data-remove'), 10), 1);
        setCart(c3); updateBadge(); renderCartPage();
      }
    });
  }

  /* ====== CHECKOUT SUMMARY ====== */
  /* ====== CHECKOUT PAGE (form + summary + order submission) ====== */
  var W3KEY = '1f43d851-ec13-4aca-8d41-1e4f8fd9ed9b';
  var SHIP_FLAT = 20, FREE_SHIP_OVER = 200, MIN_ORDER = 100, CRYPTO_PCT = 0.10;
  /* Telegram ops-alert webhook (n8n payment-router workflow). Best-effort only —
     never blocks or fails the customer-facing order flow if n8n is unreachable. */
  var N8N_ORDER_WEBHOOK = 'https://my-n8n-server-d8fz.onrender.com/webhook/order-intake';

  function calcTotals(cart, isCrypto) {
    var sub = 0;
    cart.forEach(function (it) { sub += it.price * it.qty; });
    var discount = isCrypto ? sub * CRYPTO_PCT : 0;
    var afterDisc = sub - discount;
    var ship = afterDisc >= FREE_SHIP_OVER ? 0 : (cart.length ? SHIP_FLAT : 0);
    return { sub: sub, discount: discount, ship: ship, total: afterDisc + ship };
  }

  function isCryptoSelected() {
    var r = document.querySelector('input[name="payment"]:checked');
    return !!(r && r.getAttribute('data-crypto'));
  }

  function renderCheckout() {
    var form = document.getElementById('checkoutForm');
    var itemsEl = document.getElementById('coItems');
    if (!form || !itemsEl) return;

    var cart = getCart();

    function paint() {
      var crypto = isCryptoSelected();
      var t = calcTotals(cart, crypto);
      var ih = '';
      cart.forEach(function (it) {
        ih += '<div class="co-item">' +
          '<span class="co-item-name">' + it.name +
            ' <span class="co-item-qty">&times;' + it.qty + '</span></span>' +
          '<span class="co-item-price">$' + (it.price * it.qty).toFixed(2) + '</span>' +
        '</div>';
      });
      itemsEl.innerHTML = cart.length ? ih
        : '<p class="co-empty">Your cart is empty. <a href="/shop/">Browse products</a>.</p>';

      var setT = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
      setT('coSubtotal', '$' + t.sub.toFixed(2));
      setT('coDiscount', '-$' + t.discount.toFixed(2));
      setT('coShipping', t.ship === 0 ? (cart.length ? 'FREE' : '$0.00') : '$' + SHIP_FLAT.toFixed(2));
      setT('coTotal', '$' + t.total.toFixed(2));
      var dr = document.getElementById('coDiscountRow');
      if (dr) dr.style.display = crypto ? '' : 'none';
    }

    /* show/hide crypto wallet panels based on selected method */
    function updateWallets() {
      var sel = document.querySelector('input[name="payment"]:checked');
      var w = sel ? sel.getAttribute('data-wallet') : null;
      var btc = document.getElementById('walletBtc');
      var usdt = document.getElementById('walletUsdt');
      if (btc) btc.hidden = (w !== 'btc');
      if (usdt) usdt.hidden = (w !== 'usdt');
    }

    paint();
    updateWallets();
    /* repaint when payment method changes (crypto toggles discount + wallet) */
    var radios = form.querySelectorAll('input[name="payment"]');
    for (var i = 0; i < radios.length; i++) {
      radios[i].addEventListener('change', function () {
        paint();
        updateWallets();
      });
    }

    /* copy-address buttons */
    var copyBtns = form.querySelectorAll('[data-copy]');
    for (var c = 0; c < copyBtns.length; c++) {
      copyBtns[c].addEventListener('click', function () {
        var btn = this;
        var src = document.getElementById(btn.getAttribute('data-copy'));
        if (!src) return;
        var addr = src.textContent.trim();
        var done = function () {
          var orig = btn.textContent;
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(function () {
            btn.textContent = orig;
            btn.classList.remove('copied');
          }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(addr).then(done, function () {
            /* fallback */
            var r = document.createRange(); r.selectNode(src);
            var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
            try { document.execCommand('copy'); done(); } catch (e) {}
            s.removeAllRanges();
          });
        } else {
          var r2 = document.createRange(); r2.selectNode(src);
          var s2 = window.getSelection(); s2.removeAllRanges(); s2.addRange(r2);
          try { document.execCommand('copy'); done(); } catch (e) {}
          s2.removeAllRanges();
        }
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errEl = document.getElementById('coError');
      var submitBtn = document.getElementById('coSubmit');

      function fail(msg) {
        if (errEl) { errEl.textContent = msg; errEl.hidden = false; }
        if (errEl) errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (errEl) errEl.hidden = true;

      if (!cart.length) { fail('Your cart is empty.'); return; }

      var val = function (id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
      };
      var required = ['coFirst', 'coLast', 'coEmail', 'coPhone', 'coAddr',
                      'coCity', 'coState', 'coZip'];
      for (var r = 0; r < required.length; r++) {
        if (!val(required[r])) {
          fail('Please fill in all required fields marked with *.');
          var miss = document.getElementById(required[r]);
          if (miss) miss.focus();
          return;
        }
      }
      var email = val('coEmail');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        fail('Please enter a valid email address.');
        return;
      }
      var crypto = isCryptoSelected();
      var t = calcTotals(cart, crypto);
      if (t.sub < MIN_ORDER) {
        fail('Minimum order is $' + MIN_ORDER + '. Your subtotal is $' +
          t.sub.toFixed(2) + '. Please add more items.');
        return;
      }

      /* ----- generate order number ----- */
      var now = new Date();
      var ymd = now.getFullYear().toString().slice(2) +
        ('0' + (now.getMonth() + 1)).slice(-2) +
        ('0' + now.getDate()).slice(-2);
      var rand = Math.floor(1000 + Math.random() * 9000);
      var orderNum = 'MF-' + ymd + '-' + rand;

      var paymentEl = document.querySelector('input[name="payment"]:checked');
      var payment = (paymentEl || {}).value || 'Not selected';
      var customer = val('coFirst') + ' ' + val('coLast');
      var addr = val('coAddr') + (val('coAddr2') ? ', ' + val('coAddr2') : '') +
        ', ' + val('coCity') + ', ' + val('coState') + ' ' + val('coZip');

      var itemLines = cart.map(function (it) {
        return it.qty + ' × ' + it.name + '  —  $' + (it.price * it.qty).toFixed(2) +
          '  ($' + it.price.toFixed(2) + ' each)';
      }).join('\n');
      var walletShown = crypto
        ? ((paymentEl && paymentEl.getAttribute('data-wallet') === 'btc')
            ? 'BTC · bc1q95huj62jcxq4pvsa09herj0ssh4aeanc3v8jn2'
            : 'USDT (ERC-20) · 0x3819109CAdeE74becf86F5Ddff8e8A57681ACd04')
        : '';

      /* notify ops via Telegram (n8n payment-router) — fire-and-forget, never
         blocks or fails order placement if n8n is unreachable */
      try {
        fetch(N8N_ORDER_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: 'mellowfellowcarts.com',
            orderNumber: orderNum,
            amount: '$' + t.total.toFixed(2),
            recipientName: customer,
            phoneNumber: val('coPhone') || 'N/A',
            deliveryAddress: addr,
            paymentMethod: payment
          })
        }).catch(function () {});
      } catch (e) {}

      /* save details for the thank-you page */
      try {
        sessionStorage.setItem('mf_last_order', JSON.stringify({
          orderNum: orderNum, total: t.total.toFixed(2),
          payment: payment, email: email,
          itemCount: cart.reduce(function (a, i) { return a + i.qty; }, 0)
        }));
      } catch (e) {}

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Placing Order…'; }

      /* Never let this hang forever (e.g. a silently-blocked request from an
         ad-blocker extension) — bound it so the customer always gets feedback
         instead of being stuck on a disabled button indefinitely. */
      var w3Controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var w3TimedOut = false;
      var w3Timeout = setTimeout(function () {
        w3TimedOut = true;
        if (w3Controller) w3Controller.abort();
      }, 15000);

      /* FormData (not JSON) is a CORS "simple request" — the browser never
         sends a preflight OPTIONS for it, so a flaky/missing CORS response
         from Web3Forms on the preflight (confirmed live: "No
         'Access-Control-Allow-Origin' header on the preflight response")
         can't block it. This is Web3Forms' own documented method. */
      var w3Body = new FormData();
      w3Body.append('access_key', W3KEY);
      w3Body.append('subject', 'New order ' + orderNum + ' — $' + t.total.toFixed(2) + ' (' + payment + ')');
      w3Body.append('from_name', 'Mellow Fellow Orders');
      w3Body.append('email', 'info@mellowfellowcarts.com');
      w3Body.append('replyto', email);
      w3Body.append('botcheck', '');
      /* discrete fields → Web3Forms renders a clean labelled table instead of one text blob */
      w3Body.append('Order Number', orderNum);
      w3Body.append('Order Total', '$' + t.total.toFixed(2));
      w3Body.append('Payment Method', payment);
      if (crypto) w3Body.append('Crypto Discount', '-$' + t.discount.toFixed(2) + ' (10%)');
      w3Body.append('Subtotal', '$' + t.sub.toFixed(2));
      w3Body.append('Shipping', t.ship === 0 ? 'FREE' : '$' + SHIP_FLAT.toFixed(2));
      w3Body.append('Items', itemLines);
      w3Body.append('Customer Name', customer);
      w3Body.append('Customer Email', email);
      w3Body.append('Customer Phone', val('coPhone') || '—');
      w3Body.append('Shipping Address', addr);
      if (val('coNotes')) w3Body.append('Order Notes', val('coNotes'));
      if (walletShown) w3Body.append('Wallet Address Shown', walletShown);
      w3Body.append('Source', 'mellowfellowcarts.com checkout');

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        signal: w3Controller ? w3Controller.signal : undefined,
        body: w3Body
      }).then(function (res) { return res.json(); }).then(function (data) {
        clearTimeout(w3Timeout);
        if (data && data.success) {
          /* clear cart, go to thank-you page */
          try { localStorage.removeItem('mf_cart'); } catch (e) {}
          window.location.href = '/order-confirmed/';
        } else {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Place Order →'; }
          fail('Sorry, we could not place your order automatically. Please message us on ' +
            'WhatsApp to complete it, or try again.');
        }
      }).catch(function (err) {
        clearTimeout(w3Timeout);
        /* Web3Forms intermittently omits the CORS header on its actual
           response (confirmed live: request lands, server returns 200, but
           the browser still blocks reading it — net::ERR_FAILED with a 200
           underneath). That surfaces here as a generic TypeError, NOT an
           AbortError — so a genuine 15s timeout (no response at all) still
           fails loudly, but this specific "blocked from reading a response
           that almost certainly succeeded" case no longer stops a real
           customer at the door. The n8n Telegram alert (independent of
           Web3Forms) is the reliable backup confirmation for ops either way. */
        if (!w3TimedOut && err && err.name !== 'AbortError') {
          try { localStorage.removeItem('mf_cart'); } catch (e) {}
          window.location.href = '/order-confirmed/';
          return;
        }
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Place Order →'; }
        fail('This is taking longer than expected. Please try again, or message us on ' +
          'WhatsApp to complete your order — your order number is ' + orderNum + '.');
      });
    });
  }

  /* ====== THANK YOU PAGE ====== */
  function renderThankYou() {
    var numEl = document.getElementById('tyOrderNum');
    if (!numEl) return;
    var data = null;
    try { data = JSON.parse(sessionStorage.getItem('mf_last_order') || 'null'); } catch (e) {}
    if (data && data.orderNum) {
      numEl.textContent = data.orderNum;
      var d = document.getElementById('tyDetails');
      if (d) {
        d.innerHTML =
          '<div class="ty-row"><span>Order Total</span><strong>$' + data.total + '</strong></div>' +
          '<div class="ty-row"><span>Items</span><strong>' + data.itemCount + '</strong></div>' +
          '<div class="ty-row"><span>Payment Method</span><strong>' + data.payment + '</strong></div>' +
          '<div class="ty-row"><span>Confirmation Sent To</span><strong>' + data.email + '</strong></div>';
      }
      var cardBox = document.getElementById('tyCardPay');
      if (cardBox) cardBox.hidden = true;
    } else {
      numEl.textContent = 'N/A';
      var d2 = document.getElementById('tyDetails');
      if (d2) d2.innerHTML = '<p class="co-empty">No recent order found in this session.</p>';
    }
  }

  /* ====== FORMS (web3forms) ====== */
  function bindForms() {
    var W3 = '1f43d851-ec13-4aca-8d41-1e4f8fd9ed9b';
    function send(payload, btn, label, thankYou) {
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      /* FormData avoids the CORS preflight that JSON+Content-Type triggers —
         see the matching fix + explanation on the checkout submit handler. */
      var fd = new FormData();
      for (var k in payload) { if (payload.hasOwnProperty(k)) fd.append(k, payload[k]); }
      fd.append('botcheck', '');
      function ok() { window.location.href = thankYou; }
      function fail() {
        if (btn) { btn.disabled = false; btn.textContent = label; }
        toast('Could not send automatically. Please email info' + '@' + 'mellowfellowcarts.com or message us on WhatsApp.');
      }
      if (!W3 || W3.indexOf('YOUR-') === 0) { ok(); return; }
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: fd
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d && d.success) ok(); else fail();
      }).catch(function () {
        /* Web3Forms intermittently omits CORS headers on its actual response even
           when the submission succeeded server-side — see the checkout note.
           Assume success rather than telling a real sender their message failed. */
        ok();
      });
    }
    function bindForm(cfg) {
      var btn = document.getElementById(cfg.btn);
      if (!btn) return;
      var form = btn.closest('form');
      var v = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; };
      function submit() {
        for (var i = 0; i < cfg.required.length; i++) {
          if (!v(cfg.required[i])) {
            toast(cfg.requiredMsg);
            var el = document.getElementById(cfg.required[i]);
            if (el) el.focus();
            return;
          }
        }
        send(cfg.payload(v), btn, cfg.label, cfg.thankYou);
      }
      btn.addEventListener('click', function (e) { e.preventDefault(); submit(); });
      if (form) form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
    }
    bindForm({
      btn: 'contactSubmit', label: 'Send Message →',
      required: ['contactName', 'contactEmail', 'contactMsg'],
      requiredMsg: 'Please fill in your name, email and message.',
      thankYou: '/thank-you-contact/',
      payload: function (v) {
        return {
          access_key: W3,
          subject: 'New contact message — ' + (v('contactSubject') || 'General enquiry'),
          from_name: 'Mellow Fellow Website',
          email: 'info@mellowfellowcarts.com',
          replyto: v('contactEmail'),
          'Name': v('contactName'),
          'Email': v('contactEmail'),
          'Phone': v('contactPhone') || '—',
          'Topic': v('contactSubject') || 'General enquiry',
          'Message': v('contactMsg'),
          'Source': 'mellowfellowcarts.com contact form'
        };
      }
    });
    bindForm({
      btn: 'wholesaleSubmit', label: 'Submit Application →',
      required: ['wBiz', 'wEmail'],
      requiredMsg: 'Please fill in your business name and email.',
      thankYou: '/thank-you-wholesale/',
      payload: function (v) {
        return {
          access_key: W3,
          subject: 'New wholesale application — ' + v('wBiz'),
          from_name: 'Mellow Fellow Wholesale',
          email: 'info@mellowfellowcarts.com',
          replyto: v('wEmail'),
          'Business Name': v('wBiz'),
          'Contact Name': v('wContact') || '—',
          'Email': v('wEmail'),
          'Phone': v('wPhone') || '—',
          'Notes': v('wNotes') || '—',
          'Source': 'mellowfellowcarts.com wholesale form'
        };
      }
    });
  }

  /* ====== SHOP FILTER + SORT (client-side, progressive) ====== */
  function shopFilters() {
    var toolbar = document.getElementById('shopToolbar') || document.querySelector('.shop-toolbar');
    var grid = document.querySelector('main [class*="prod-grid"]');
    if (!toolbar || !grid) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll(':scope > .product-card'));
    if (cards.length < 2) return;

    var STR = ['sativa', 'indica', 'hybrid'];
    var strainCounts = { sativa: 0, indica: 0, hybrid: 0 };
    cards.forEach(function (card, i) {
      card.setAttribute('data-ord', i);
      var priceEl = card.querySelector('.product-price');
      var price = priceEl ? parseFloat(priceEl.getAttribute('content') || priceEl.textContent.replace(/[^0-9.]/g, '')) : 0;
      card.setAttribute('data-price', isNaN(price) ? 0 : price);
      var nameEl = card.querySelector('.product-name');
      card.setAttribute('data-name', nameEl ? nameEl.textContent.trim().toLowerCase() : '');
      var sEl = card.querySelector('.prod-strain');
      var strain = '';
      if (sEl) {
        for (var k = 0; k < STR.length; k++) {
          if (sEl.className.indexOf('prod-type-' + STR[k]) !== -1) { strain = STR[k]; break; }
        }
      }
      card.setAttribute('data-strain', strain);
      if (strain) strainCounts[strain]++;
    });

    var haveStrain = (strainCounts.sativa + strainCounts.indica + strainCounts.hybrid) >= 3;
    var countEl = toolbar.querySelector('.results-count');
    var totalTxt = countEl ? countEl.textContent : (cards.length + ' products');
    var totalN = cards.length;

    var controls = document.createElement('div');
    controls.className = 'shop-controls';
    var strainHtml = '';
    if (haveStrain) {
      strainHtml = '<div class="shop-strain-filter" role="group" aria-label="Filter by strain type">' +
        '<button type="button" class="strain-pill is-on" data-strain="">All types</button>';
      STR.forEach(function (s) {
        if (strainCounts[s] > 0) {
          strainHtml += '<button type="button" class="strain-pill" data-strain="' + s + '">' +
            s.charAt(0).toUpperCase() + s.slice(1) + ' <span>(' + strainCounts[s] + ')</span></button>';
        }
      });
      strainHtml += '</div>';
    }
    controls.innerHTML = strainHtml +
      '<label class="shop-sort"><span>Sort</span>' +
        '<select id="shopSortSel">' +
          '<option value="featured">Featured</option>' +
          '<option value="price-asc">Price: low to high</option>' +
          '<option value="price-desc">Price: high to low</option>' +
          '<option value="name">Name: A to Z</option>' +
        '</select>' +
      '</label>';
    toolbar.appendChild(controls);

    var state = { strain: '', sort: 'featured' };

    function apply() {
      var visible = 0;
      cards.forEach(function (card) {
        var ok = !state.strain || card.getAttribute('data-strain') === state.strain;
        card.hidden = !ok;
        if (ok) visible++;
      });
      var ordered = cards.slice().sort(function (a, b) {
        if (state.sort === 'price-asc') return a.getAttribute('data-price') - b.getAttribute('data-price');
        if (state.sort === 'price-desc') return b.getAttribute('data-price') - a.getAttribute('data-price');
        if (state.sort === 'name') return a.getAttribute('data-name') < b.getAttribute('data-name') ? -1 : 1;
        return a.getAttribute('data-ord') - b.getAttribute('data-ord');
      });
      ordered.forEach(function (card) { grid.appendChild(card); });
      if (countEl) {
        countEl.textContent = (visible === totalN)
          ? totalTxt
          : 'Showing ' + visible + ' of ' + totalN + ' products';
      }
      if (!visible) {
        if (!document.getElementById('shopNoMatch')) {
          var p = document.createElement('p');
          p.id = 'shopNoMatch';
          p.className = 'shop-no-match';
          p.textContent = 'No products match this filter.';
          grid.parentNode.insertBefore(p, grid.nextSibling);
        }
        document.getElementById('shopNoMatch').hidden = false;
      } else {
        var nm = document.getElementById('shopNoMatch');
        if (nm) nm.hidden = true;
      }
    }

    var sel = controls.querySelector('#shopSortSel');
    sel.addEventListener('change', function () { state.sort = sel.value; apply(); });
    var pills = controls.querySelectorAll('.strain-pill');
    Array.prototype.forEach.call(pills, function (pill) {
      pill.addEventListener('click', function () {
        state.strain = pill.getAttribute('data-strain');
        Array.prototype.forEach.call(pills, function (p) { p.classList.toggle('is-on', p === pill); });
        apply();
      });
    });
  }

  /* ====== SHOP SIDEBAR (collapsible on mobile) ====== */
  function shopSidebar() {
    var toggle = document.getElementById('shopFilterToggle');
    var sb = document.getElementById('shopSidebar');
    if (!toggle || !sb) return;
    toggle.addEventListener('click', function () {
      var open = sb.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    /* if the user lands deep in a category, keep it collapsed by
       default (products visible first) — no auto-open. */
  }

  /* ====== SEARCH (shared query engine + overlay + /search/ page) ====== */
  function mfEsc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  /* returns { q, terms, products:[...], posts:[...] } for a raw query string */
  function mfQuery(raw) {
    var q = String(raw || '').trim().toLowerCase();
    var terms = q.length ? q.split(/\s+/) : [];
    var prods = window.MF_SEARCH || [];
    var posts = window.MF_BLOG || [];
    function hit(hay) {
      for (var i = 0; i < terms.length; i++) {
        if (hay.indexOf(terms[i]) === -1) return false;
      }
      return true;
    }
    var pMatches = terms.length ? prods.filter(function (p) { return hit(p.h); }) : [];
    var bMatches = terms.length ? posts.filter(function (b) { return hit(b.h); }) : [];
    /* rank: whole-query appears at start of the name first */
    pMatches.sort(function (a, b) {
      return (a.n.toLowerCase().indexOf(q) === 0 ? 0 : 1) -
             (b.n.toLowerCase().indexOf(q) === 0 ? 0 : 1);
    });
    return { q: q, terms: terms, products: pMatches, posts: bMatches };
  }
  function mfProductRow(p) {
    return '<a class="search-result" href="' + p.u + '/">' +
      '<img src="' + mfEsc(p.img) + '" alt="" loading="lazy" width="56" height="56">' +
      '<span class="search-result-info">' +
        '<span class="search-result-name">' + mfEsc(p.s) + '</span>' +
        '<span class="search-result-meta">' + mfEsc(p.c) +
          (p.sub ? ' &middot; ' + mfEsc(p.sub) : '') +
          (p.st ? ' &middot; ' + mfEsc(p.st) : '') + '</span>' +
      '</span>' +
      '<span class="search-result-price">$' + p.p.toFixed(2) + '</span>' +
    '</a>';
  }
  function mfPostRow(b) {
    return '<a class="search-result search-result-post" href="' + b.u + '">' +
      (b.img ? '<img src="' + mfEsc(b.img) + '" alt="" loading="lazy" width="56" height="56">' : '<span class="search-result-doticon" aria-hidden="true">&#9776;</span>') +
      '<span class="search-result-info">' +
        '<span class="search-result-name">' + mfEsc(b.t) + '</span>' +
        '<span class="search-result-meta">Guide</span>' +
      '</span>' +
    '</a>';
  }
  function searchHref(q) { return '/search/?q=' + encodeURIComponent(q); }

  function search() {
    var overlay = document.getElementById('searchOverlay');
    var input = document.getElementById('searchInput');
    var results = document.getElementById('searchResults');
    var openBtn = document.getElementById('searchToggle');
    var closeBtn = document.getElementById('searchClose');
    var drawerBtn = document.getElementById('mDrawerSearch');
    var nfBtn = document.getElementById('nfSearchBtn');
    if (!overlay || !input || !results) return;

    function openSearch() {
      overlay.hidden = false;
      void overlay.offsetWidth;
      overlay.classList.add('open');
      if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      setTimeout(function () { input.focus(); }, 120);
    }
    function closeSearch() {
      overlay.classList.remove('open');
      if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      setTimeout(function () { overlay.hidden = true; }, 240);
    }
    function render(raw) {
      var r = mfQuery(raw);
      if (r.q.length < 2) {
        results.innerHTML = '<p class="search-hint">Start typing to search ' +
          (window.MF_SEARCH || []).length + ' products and ' +
          (window.MF_BLOG || []).length + ' guides by name, category, strain or topic.</p>';
        return;
      }
      if (!r.products.length && !r.posts.length) {
        results.innerHTML = '<p class="search-empty">Nothing matches &ldquo;' + mfEsc(r.q) +
          '&rdquo;.<br>Try a category like &ldquo;edibles&rdquo; or a strain like &ldquo;blue dream&rdquo;.</p>';
        return;
      }
      var html = '';
      if (r.products.length) {
        html += '<p class="search-cat-head">' + r.products.length + ' product' +
          (r.products.length !== 1 ? 's' : '') + '</p>';
        r.products.slice(0, 6).forEach(function (p) { html += mfProductRow(p); });
      }
      if (r.posts.length) {
        html += '<p class="search-cat-head">' + r.posts.length + ' guide' +
          (r.posts.length !== 1 ? 's' : '') + '</p>';
        r.posts.slice(0, 3).forEach(function (b) { html += mfPostRow(b); });
      }
      html += '<a class="search-link-row" href="' + searchHref(r.q) + '">' +
        'See all results for &ldquo;' + mfEsc(r.q) + '&rdquo; &rarr;</a>';
      results.innerHTML = html;
    }
    function goToPage() {
      var v = input.value.trim();
      if (v.length >= 2) window.location.href = searchHref(v);
    }

    if (openBtn) openBtn.addEventListener('click', openSearch);
    if (nfBtn) nfBtn.addEventListener('click', openSearch);
    if (closeBtn) closeBtn.addEventListener('click', closeSearch);
    if (drawerBtn) drawerBtn.addEventListener('click', function () {
      var dr = document.getElementById('mobileDrawer');
      var ov = document.getElementById('mDrawerOverlay');
      if (dr) dr.classList.remove('open');
      if (ov) ov.classList.remove('open');
      setTimeout(function () {
        if (dr) dr.hidden = true;
        if (ov) ov.hidden = true;
        openSearch();
      }, 260);
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeSearch();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeSearch();
    });
    var t;
    input.addEventListener('input', function () {
      clearTimeout(t);
      var v = input.value;
      t = setTimeout(function () { render(v); }, 120);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); goToPage(); }
    });
  }

  /* ====== /search/ PAGE ====== */
  function renderSearchPage() {
    var wrap = document.getElementById('searchPageResults');
    var input = document.getElementById('searchPageInput');
    var form = document.getElementById('searchPageForm');
    if (!wrap || !input || !form) return;

    function paint(raw) {
      var r = mfQuery(raw);
      if (r.q.length < 2) {
        wrap.innerHTML = '<p class="search-hint">Type a product name, strain, blend, cannabinoid or topic and press Search.</p>';
        document.title = 'Search — Mellow Fellow';
        return;
      }
      document.title = 'Search: ' + r.q + ' — Mellow Fellow';
      var total = r.products.length + r.posts.length;
      if (!total) {
        wrap.innerHTML = '<p class="search-empty">Nothing matches &ldquo;' + mfEsc(r.q) +
          '&rdquo;.<br>Check the spelling, or browse <a href="/shop/">all products</a> or the <a href="/blog/">blog</a>.</p>';
        return;
      }
      var html = '<p class="search-summary">' + total + ' result' + (total !== 1 ? 's' : '') +
        ' for &ldquo;' + mfEsc(r.q) + '&rdquo;</p>';
      if (r.products.length) {
        html += '<h2 class="search-group-head">Products <span>(' + r.products.length + ')</span></h2>' +
          '<div class="search-page-list">';
        r.products.forEach(function (p) { html += mfProductRow(p); });
        html += '</div>';
      }
      if (r.posts.length) {
        html += '<h2 class="search-group-head">Guides &amp; articles <span>(' + r.posts.length + ')</span></h2>' +
          '<div class="search-page-list">';
        r.posts.forEach(function (b) { html += mfPostRow(b); });
        html += '</div>';
      }
      wrap.innerHTML = html;
    }

    function currentQ() {
      var m = /[?&]q=([^&]*)/.exec(window.location.search);
      return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
    }

    var q0 = currentQ();
    input.value = q0;
    paint(q0);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      var url = v ? searchHref(v) : '/search/';
      try { window.history.replaceState(null, '', url); } catch (err) {}
      paint(v);
      input.blur();
    });
  }

  /* ====== INIT ====== */
  function init() {
    ageGate();
    drawer();
    shopSidebar();
    shopFilters();
    search();
    renderSearchPage();
    updateBadge();
    buildCartDrawer();
    bindCartTrigger();
    bindShop();
    renderCartPage();
    renderCheckout();
    renderThankYou();
    bindForms();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
