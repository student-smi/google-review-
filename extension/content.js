/**
 * ReviewQR - Google Maps In-Page Review Sync & AI Reply Engine
 */
(function () {
  console.log('[ReviewQR] Google Maps Review Sync Extension Loaded');

  const API_BASE = 'https://reviewqr.panchalsmit.workers.dev';

  // Inject a floating ReviewQR button on Google Maps
  function injectFloatingWidget() {
    if (document.getElementById('reviewqr-floating-widget')) return;

    const widget = document.createElement('div');
    widget.id = 'reviewqr-floating-widget';
    widget.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999999;
      background: #4F46E5;
      color: white;
      padding: 12px 18px;
      border-radius: 9999px;
      box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4), 0 8px 10px -6px rgba(79, 70, 229, 0.2);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
    `;
    widget.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>Sync Reviews to ReviewQR</span>
    `;

    widget.onmouseenter = () => {
      widget.style.transform = 'scale(1.05)';
      widget.style.background = '#4338CA';
    };
    widget.onmouseleave = () => {
      widget.style.transform = 'scale(1)';
      widget.style.background = '#4F46E5';
    };

    widget.onclick = handleSyncReviews;

    document.body.appendChild(widget);
  }

  // Extract all visible reviews from Google Maps DOM
  function extractReviews() {
    const reviews = [];

    // 1. Google Maps Review Containers
    const gmapsContainers = document.querySelectorAll('div.jftiEf, div[data-review-id]');
    gmapsContainers.forEach((el) => {
      // Author Name
      const nameEl = el.querySelector('div.d4r55, button[data-href*="contrib"]');
      const authorName = nameEl ? nameEl.innerText.trim() : '';

      // Rating
      const starEl = el.querySelector('span.kvMYJc, span[role="img"]');
      const ratingText = starEl ? starEl.getAttribute('aria-label') || '' : '';
      const match = ratingText.match(/(\d+)/);
      const rating = match ? parseInt(match[1], 10) : 5;

      // Comment
      const textEl = el.querySelector('span.wiI7m, span.review-full-text');
      const reviewText = textEl ? textEl.innerText.trim() : '';

      // Date
      const dateEl = el.querySelector('span.rsqaWe');
      const dateText = dateEl ? dateEl.innerText.trim() : '';

      // Owner response
      const replyEl = el.querySelector('div.CDe7pd');
      const replyText = replyEl ? replyEl.innerText.trim() : '';

      if (authorName && (reviewText || rating)) {
        reviews.push({
          authorName,
          rating,
          reviewText: reviewText || '(Rated without comment)',
          dateText,
          replyText: replyText || undefined
        });
      }
    });

    // 2. Google Search Knowledge Graph Review Containers
    const searchContainers = document.querySelectorAll('div.gws-localreviews__google-review');
    searchContainers.forEach((el) => {
      const nameEl = el.querySelector('div.TSUbDb, .P5Bobd');
      const authorName = nameEl ? nameEl.innerText.trim() : '';

      const starEl = el.querySelector('span[aria-label*="star"], span[role="img"]');
      const ratingText = starEl ? starEl.getAttribute('aria-label') || '' : '';
      const match = ratingText.match(/(\d+)/);
      const rating = match ? parseInt(match[1], 10) : 5;

      const textEl = el.querySelector('span.review-full-text, span[data-expandable-section]');
      const reviewText = textEl ? textEl.innerText.trim() : '';

      if (authorName && (reviewText || rating)) {
        reviews.push({
          authorName,
          rating,
          reviewText: reviewText || '(Rated without comment)'
        });
      }
    });

    return reviews;
  }

  // Handle Sync action
  async function handleSyncReviews() {
    const widget = document.getElementById('reviewqr-floating-widget');
    const label = widget?.querySelector('span');

    const reviews = extractReviews();

    if (reviews.length === 0) {
      alert('No reviews found on screen! Please scroll down the Google Maps Reviews tab to load reviews, then click Sync again.');
      return;
    }

    if (label) label.innerText = `Syncing ${reviews.length} reviews...`;

    try {
      // Find business ID from local storage or ask user
      let targetBizId = localStorage.getItem('reviewqr_active_biz_id');
      if (!targetBizId) {
        // Fetch available businesses from ReviewQR
        const bizRes = await fetch(`${API_BASE}/api/businesses`, {
          headers: { 'X-Owner-Id': 'owner-default' }
        });
        const bizData = await bizRes.json();
        if (bizData?.businesses && bizData.businesses.length > 0) {
          targetBizId = bizData.businesses[0].id;
        }
      }

      const res = await fetch(`${API_BASE}/api/gmb/import-browser-reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Owner-Id': 'owner-default'
        },
        body: JSON.stringify({
          businessId: targetBizId,
          reviews: reviews
        })
      });

      const data = await res.json();

      if (data.success) {
        if (label) label.innerText = `✓ Synced ${reviews.length} reviews!`;
        showToast(`✨ Successfully synced ${reviews.length} Google Reviews to ReviewQR Dashboard!`);
        setTimeout(() => {
          if (label) label.innerText = 'Sync Reviews to ReviewQR';
        }, 4000);
      } else {
        alert('Sync error: ' + (data.error || 'Failed to sync'));
        if (label) label.innerText = 'Sync Reviews to ReviewQR';
      }
    } catch (err) {
      alert('Connection error. Please check your ReviewQR URL.');
      if (label) label.innerText = 'Sync Reviews to ReviewQR';
    }
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #10B981;
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      font-weight: 700;
      box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
      z-index: 10000000;
    `;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // Auto-inject widget after 1.5 seconds
  setTimeout(injectFloatingWidget, 1500);

  // Re-check periodically as user scrolls
  setInterval(injectFloatingWidget, 3000);
})();
