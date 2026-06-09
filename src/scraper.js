const Round = require('../models/Round');

async function startScraping(page) {
  console.log('Starting scraper...');

  await page.exposeFunction('onNewRound', async (roundId, crashPoint) => {
    const now = new Date();
    const value = parseFloat(crashPoint.replace('×', '').replace('x', '').trim());

    if (isNaN(value)) {
      console.log('Invalid crash point, skipping:', crashPoint);
      return;
    }

    // UTC+1 offset for hourOfDay and dayOfWeek
    const localTime = new Date(now.getTime() + 60 * 60 * 1000);

    const round = new Round({
      roundId: roundId,
      crashPoint: value,
      timestamp: now, // always store raw UTC
      hourOfDay: localTime.getUTCHours(), // UTC+1 hour
      dayOfWeek: localTime.getUTCDay()    // UTC+1 day
    });

    try {
      await round.save();
      console.log(`Saved: Round ${roundId} | ${value}x @ ${now.toISOString()}`);
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate, skip silently
      } else {
        console.error('Failed to save round:', err.message);
      }
    }
  });

  await page.evaluate(() => {
    const SELECTOR = 'div.flex.items-center.justify-center.gap-1.px-2.h-full.cursor-pointer';
    let lastRoundId = null;

    const getLatestRound = () => {
      const items = document.querySelectorAll(SELECTOR);
      if (!items || items.length === 0) return null;

      const first = items[items.length - 1];
      const roundIdEl = first.querySelector('span.text-tertiary');
      const crashEl = first.querySelector('span.font-extrabold');

      if (!roundIdEl || !crashEl) return null;

      return {
        roundId: roundIdEl.textContent.trim(),
        crashPoint: crashEl.textContent.trim()
      };
    };

    const observer = new MutationObserver(() => {
      const latest = getLatestRound();
      if (!latest) return;

      if (latest.roundId !== lastRoundId) {
        lastRoundId = latest.roundId;
        window.onNewRound(latest.roundId, latest.crashPoint);
      }
    });

    // Observe document.body — catches all DOM changes including new rounds
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Set lastRoundId to current newest so we don't re-save on start
    const current = getLatestRound();
    if (current) lastRoundId = current.roundId;

    console.log('MutationObserver active on body');
  });

  console.log('Scraper running. Waiting for rounds...');
}

module.exports = startScraping;