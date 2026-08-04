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
    toast('Added to cart!');
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
        '<p>Your cart is empty.</p><a class="btn-primary" href="/shop">Browse Products</a></div>';
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
        : '<p class="co-empty">Your cart is empty. <a href="/shop">Browse products</a>.</p>';

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

      var payment = (document.querySelector('input[name="payment"]:checked') || {}).value || 'Not selected';
      var customer = val('coFirst') + ' ' + val('coLast');
      var addr = val('coAddr') + (val('coAddr2') ? ', ' + val('coAddr2') : '') +
        ', ' + val('coCity') + ', ' + val('coState') + ' ' + val('coZip');

      var itemLines = cart.map(function (it) {
        return '  - ' + it.name + ' x' + it.qty +
          ' @ $' + it.price.toFixed(2) + ' = $' + (it.price * it.qty).toFixed(2);
      }).join('\n');

      var orderBody =
        'NEW ORDER  ' + orderNum + '\n' +
        '====================================\n\n' +
        'CUSTOMER\n' +
        '  Name:  ' + customer + '\n' +
        '  Email: ' + email + '\n' +
        '  Phone: ' + val('coPhone') + '\n\n' +
        'SHIPPING ADDRESS\n  ' + addr + '\n\n' +
        'ITEMS\n' + itemLines + '\n\n' +
        'TOTALS\n' +
        '  Subtotal:        $' + t.sub.toFixed(2) + '\n' +
        (crypto ? '  Crypto Discount: -$' + t.discount.toFixed(2) + ' (10%)\n' : '') +
        '  Shipping:        ' + (t.ship === 0 ? 'FREE' : '$' + SHIP_FLAT.toFixed(2)) + '\n' +
        '  ORDER TOTAL:     $' + t.total.toFixed(2) + '\n\n' +
        'PAYMENT METHOD\n  ' + payment +
          (crypto ? '\n  Wallet shown to customer: ' +
            ((document.querySelector('input[name="payment"]:checked') || {}).getAttribute &&
             document.querySelector('input[name="payment"]:checked').getAttribute('data-wallet') === 'btc'
              ? 'bc1q95huj62jcxq4pvsa09herj0ssh4aeanc3v8jn2'
              : '0x3819109CAdeE74becf86F5Ddff8e8A57681ACd04') : '') +
          '\n\n' +
        (val('coNotes') ? 'ORDER NOTES\n  ' + val('coNotes') + '\n\n' : '') +
        '====================================\n' +
        'Order placed via mellowfellowcarts.com checkout';

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
      w3Body.append('subject', 'NEW ORDER ' + orderNum + ' — $' + t.total.toFixed(2) + ' (' + payment + ')');
      w3Body.append('from_name', 'Mellow Fellow Orders');
      w3Body.append('email', 'info@mellowfellowcarts.com');
      w3Body.append('replyto', email);
      w3Body.append('botcheck', '');
      w3Body.append('message', orderBody);

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
          window.location.href = '/order-confirmed';
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
          window.location.href = '/order-confirmed';
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
    } else {
      numEl.textContent = 'N/A';
      var d2 = document.getElementById('tyDetails');
      if (d2) d2.innerHTML = '<p class="co-empty">No recent order found in this session.</p>';
    }
  }

  /* ====== FORMS (web3forms) ====== */
  function bindForms() {
    var W3 = '1f43d851-ec13-4aca-8d41-1e4f8fd9ed9b';
    function send(payload, btn, label) {
      if (btn) { btn.disabled = true; btn.textContent = 'Sending\u2026'; }
      /* FormData avoids the CORS preflight that JSON+Content-Type triggers \u2014
         see the matching fix + explanation on the checkout submit handler. */
      var fd = new FormData();
      for (var k in payload) { if (payload.hasOwnProperty(k)) fd.append(k, payload[k]); }
      fd.append('botcheck', '');
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: fd
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (btn) { btn.disabled = false; btn.textContent = label; }
        toast(d.success ? 'Message sent! We will reply within 1-2 hours.'
                        : 'Send failed. Email info@mellowfellowcarts.com');
      }).catch(function () {
        /* Web3Forms intermittently omits CORS headers on its actual response
           even when the submission succeeded server-side — see the matching
           note on the checkout handler. Assume success here too rather than
           telling a real sender their message failed. */
        if (btn) { btn.disabled = false; btn.textContent = label; }
        toast('Message sent! We will reply within 1-2 hours.');
      });
    }
    var cb = document.getElementById('contactSubmit');
    if (cb) cb.addEventListener('click', function () {
      var v = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; };
      var name = v('contactName'), email = v('contactEmail'), msg = v('contactMsg');
      if (!name || !email || !msg) { toast('Please fill in all required fields.'); return; }
      send({
        access_key: W3, subject: 'Mellow Fellow Contact: ' + (v('contactSubject') || 'Inquiry'),
        from_name: 'Mellow Fellow Website', email: 'info@mellowfellowcarts.com', reply_to: email,
        message: 'Name: ' + name + '\nEmail: ' + email + '\nPhone: ' + v('contactPhone') +
          '\nSubject: ' + v('contactSubject') + '\n\n' + msg
      }, cb, 'Send Message \u2192');
    });
    var wb = document.getElementById('wholesaleSubmit');
    if (wb) wb.addEventListener('click', function () {
      var v = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; };
      var biz = v('wBiz'), email = v('wEmail');
      if (!biz || !email) { toast('Please fill in business name and email.'); return; }
      send({
        access_key: W3, subject: 'NEW Wholesale Application \u2014 ' + biz,
        from_name: 'Mellow Fellow Wholesale', email: 'info@mellowfellowcarts.com', reply_to: email,
        message: 'Business: ' + biz + '\nContact: ' + v('wContact') + '\nEmail: ' + email +
          '\nPhone: ' + v('wPhone') + '\n\nNotes:\n' + v('wNotes')
      }, wb, 'Submit Application \u2192');
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

  /* ====== SEARCH OVERLAY ====== */
  function search() {
    var overlay = document.getElementById('searchOverlay');
    var input = document.getElementById('searchInput');
    var results = document.getElementById('searchResults');
    var openBtn = document.getElementById('searchToggle');
    var closeBtn = document.getElementById('searchClose');
    var drawerBtn = document.getElementById('mDrawerSearch');
    if (!overlay || !input || !results) return;

    var idx = window.MF_SEARCH || [];

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
    function esc(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }
    function render(q) {
      q = q.trim().toLowerCase();
      if (q.length < 2) {
        results.innerHTML = '<p class="search-hint">Start typing to search ' +
          idx.length + ' products by name, category or strain.</p>';
        return;
      }
      var terms = q.split(/\s+/);
      var matches = idx.filter(function (p) {
        for (var i = 0; i < terms.length; i++) {
          if (p.h.indexOf(terms[i]) === -1) return false;
        }
        return true;
      });
      /* rank: name-start matches first */
      matches.sort(function (a, b) {
        var an = a.n.toLowerCase().indexOf(q) === 0 ? 0 : 1;
        var bn = b.n.toLowerCase().indexOf(q) === 0 ? 0 : 1;
        return an - bn;
      });
      if (!matches.length) {
        results.innerHTML = '<p class="search-empty">No products match &ldquo;' +
          esc(q) + '&rdquo;.<br>Try a category like &ldquo;edibles&rdquo; or &ldquo;flower&rdquo;.</p>';
        return;
      }
      var shown = matches.slice(0, 8);
      var html = '<p class="search-cat-head">' + matches.length +
        ' product' + (matches.length !== 1 ? 's' : '') + ' found</p>';
      shown.forEach(function (p) {
        html += '<a class="search-result" href="' + p.u + '">' +
          '<img src="' + esc(p.img) + '" alt="" loading="lazy">' +
          '<span class="search-result-info">' +
            '<span class="search-result-name">' + esc(p.s) + '</span>' +
            '<span class="search-result-meta">' + esc(p.c) +
              (p.sub ? ' &middot; ' + esc(p.sub) : '') +
              (p.st ? ' &middot; ' + esc(p.st) : '') + '</span>' +
          '</span>' +
          '<span class="search-result-price">$' + p.p.toFixed(2) + '</span>' +
        '</a>';
      });
      if (matches.length > shown.length) {
        html += '<a class="search-link-row" href="/shop">' +
          'View all ' + matches.length + ' results in the shop &rarr;</a>';
      }
      results.innerHTML = html;
    }

    if (openBtn) openBtn.addEventListener('click', openSearch);
    if (closeBtn) closeBtn.addEventListener('click', closeSearch);
    if (drawerBtn) drawerBtn.addEventListener('click', function () {
      /* close the mobile drawer first if it's open */
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
      if (e.key === 'Enter') {
        var first = results.querySelector('.search-result');
        if (first) window.location.href = first.getAttribute('href');
      }
    });
  }

  /* ====== INIT ====== */
  function init() {
    ageGate();
    drawer();
    shopSidebar();
    search();
    updateBadge();
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
