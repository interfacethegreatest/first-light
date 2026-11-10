/* Opt-in, same-origin diagnostic only. This script is never loaded by the app itself. */
(function installProbe(win) {
  'use strict';
  if (win.__firstLightProbe) return;
  const doc = win.document;
  const expectedCounts = { torus: 55296, panel: 13860 };
  const contexts = new WeakSet();
  const restore = [];
  const cumulative = { torus: 0, panel: 0 };
  const lastDraw = { torus: null, panel: null };
  const motion = win.matchMedia ? win.matchMedia('(prefers-reduced-motion: reduce)') : null;
  let active = null;
  let currentTimestamp = null;
  let capability = null;
  let contextCount = 0;
  let patchFailures = 0;
  let disposed = false;

  function patch(object, key, make) {
    const original = object[key];
    if (typeof original !== 'function') return;
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    const wrapped = make(original);
    try {
      object[key] = wrapped;
      if (object[key] !== wrapped) throw new Error('Read-only method');
      restore.push(function () {
        if (object[key] !== wrapped) return;
        if (descriptor) Object.defineProperty(object, key, descriptor);
        else delete object[key];
      });
    } catch (_) { patchFailures += 1; }
  }

  function pause(reason) {
    if (active && !active.reasons.includes(reason)) active.reasons.push(reason);
  }

  function readCapability(gl) {
    if (capability) return;
    function parameter(key) {
      try { return gl.getParameter(key); } catch (_) { return null; }
    }
    let debug = null;
    try { debug = gl.getExtension('WEBGL_debug_renderer_info'); } catch (_) { /* Optional. */ }
    capability = {
      version: parameter(gl.VERSION),
      shadingLanguageVersion: parameter(gl.SHADING_LANGUAGE_VERSION),
      vendor: parameter(gl.VENDOR),
      renderer: parameter(gl.RENDERER),
      unmaskedVendor: debug ? parameter(debug.UNMASKED_VENDOR_WEBGL) : null,
      unmaskedRenderer: debug ? parameter(debug.UNMASKED_RENDERER_WEBGL) : null,
      maxTextureSize: parameter(gl.MAX_TEXTURE_SIZE),
      gpuTimeMs: null,
      gpuTimeNote: 'GPU execution time is not measured; these are submitted host draws, not GPU completion or display refresh.',
    };
  }

  function record(gl, canvas, framebuffer, mode, count, instances) {
    if (disposed || framebuffer !== null || mode !== 4 || instances === 0 || currentTimestamp === null) return;
    const card = canvas.closest('[data-glass-object-kind]');
    const kind = card && card.getAttribute('data-glass-object-kind');
    if (!Object.hasOwn(expectedCounts, kind) || count !== expectedCounts[kind]
      || !canvas.closest('[data-testid="glass-object-canvas"]')) return;
    readCapability(gl);
    if (lastDraw[kind] !== currentTimestamp) {
      cumulative[kind] += 1;
      lastDraw[kind] = currentTimestamp;
    }
    if (!active || active.kind !== kind || currentTimestamp < active.started) return;
    if (doc.visibilityState === 'hidden') pause('document-hidden');
    if (!motion || motion.matches) pause('reduced-motion-or-preference-unavailable');
    if (card.getAttribute('data-glass-object-spin') !== 'true') pause('object-motion-paused');
    active.draws.add(currentTimestamp);
  }

  function observeContext(gl, canvas) {
    if (!gl || contexts.has(gl) || typeof gl.bindFramebuffer !== 'function') return;
    contexts.add(gl);
    contextCount += 1;
    let framebuffer = null;
    try { framebuffer = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING || gl.FRAMEBUFFER_BINDING); } catch (_) { /* Starts at default. */ }
    patch(gl, 'bindFramebuffer', original => function (target, buffer) {
      const result = original.apply(this, arguments);
      // READ_FRAMEBUFFER is intentionally excluded on WebGL 2.
      if (target === 0x8d40 || target === 0x8ca9) framebuffer = buffer;
      return result;
    });
    ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced'].forEach(name => {
      patch(gl, name, original => function () {
        const result = original.apply(this, arguments);
        const count = arguments[name.includes('Arrays') ? 2 : 1];
        const instances = name.includes('Instanced') ? arguments[name.includes('Arrays') ? 3 : 4] : 1;
        record(gl, canvas, framebuffer, arguments[0], count, instances);
        return result;
      });
    });
    const lost = () => {
      const card = canvas.closest('[data-glass-object-kind]');
      if (active && card && card.getAttribute('data-glass-object-kind') === active.kind) pause('webgl-context-lost');
    };
    canvas.addEventListener('webglcontextlost', lost);
    restore.push(() => canvas.removeEventListener('webglcontextlost', lost));
  }

  patch(win, 'requestAnimationFrame', original => function (callback) {
    return original.call(this, function (timestamp) {
      const previous = currentTimestamp;
      currentTimestamp = timestamp;
      if (active && timestamp >= active.started) active.rafs.add(timestamp);
      try { return callback(timestamp); } finally { currentTimestamp = previous; }
    });
  });
  patch(win.HTMLCanvasElement.prototype, 'getContext', original => function (type) {
    const context = original.apply(this, arguments);
    if (/^(webgl2?|experimental-webgl)$/.test(type)) observeContext(context, this);
    return context;
  });

  const visibility = () => { if (doc.visibilityState === 'hidden') pause('document-hidden'); };
  const preference = () => { if (!motion || motion.matches) pause('reduced-motion-or-preference-unavailable'); };
  const focus = event => {
    const card = event.target.closest && event.target.closest('[data-glass-object-kind]');
    if (active && card && card.getAttribute('data-glass-object-kind') === active.kind) pause('native-controls-focused');
  };
  doc.addEventListener('visibilitychange', visibility);
  doc.addEventListener('focusin', focus);
  if (motion && motion.addEventListener) motion.addEventListener('change', preference);
  else if (motion && motion.addListener) motion.addListener(preference);

  function percentile(sorted, fraction) {
    if (!sorted.length) return null;
    const index = (sorted.length - 1) * fraction;
    const low = Math.floor(index), high = Math.ceil(index);
    return sorted[low] + (sorted[high] - sorted[low]) * (index - low);
  }

  function timing(values) {
    const timestamps = Array.from(values).sort((a, b) => a - b);
    const intervals = timestamps.slice(1).map((value, index) => value - timestamps[index]).sort((a, b) => a - b);
    return {
      samples: timestamps.length,
      intervalSamples: intervals.length,
      medianIntervalMs: percentile(intervals, 0.5),
      p95IntervalMs: percentile(intervals, 0.95),
    };
  }

  function snapshot() {
    return { version: 1, disposed, contextCount, patchFailures, draws: { ...cumulative }, capability };
  }

  function finish(reason) {
    if (!active) return null;
    if (reason) pause(reason);
    visibility();
    preference();
    const card = doc.querySelector('#glass-objects [data-glass-object-kind="' + active.kind + '"]');
    if (!card || card.getAttribute('data-glass-object-spin') !== 'true') pause('object-motion-paused');
    const capture = active;
    active = null;
    const elapsedMs = Math.max(0, win.performance.now() - capture.started);
    const submitted = timing(capture.draws);
    const observedRafCallbacks = timing(capture.rafs);
    return {
      kind: capture.kind,
      status: capture.reasons.length ? 'paused-or-interrupted'
        : patchFailures ? 'instrumentation-incomplete'
          : submitted.samples < 2 ? 'insufficient-submitted-frames' : 'measured',
      reasons: capture.reasons,
      elapsedMs,
      submittedFrames: submitted.samples,
      submittedFramesPerSecond: elapsedMs > 0 ? submitted.samples * 1000 / elapsedMs : null,
      submittedFrameIntervals: submitted,
      observedRafCallbacks,
      note: 'Only unique rAF timestamps containing a matching host-mesh draw to the main framebuffer are submitted frames. rAF callbacks alone do not count. Interval statistics need at least two submitted frames. No pass/fail or GPU-time claim.',
    };
  }

  function dispose() {
    if (disposed) return;
    finish('probe-disposed');
    disposed = true;
    doc.removeEventListener('visibilitychange', visibility);
    doc.removeEventListener('focusin', focus);
    if (motion && motion.removeEventListener) motion.removeEventListener('change', preference);
    else if (motion && motion.removeListener) motion.removeListener(preference);
    win.removeEventListener('pagehide', dispose);
    restore.reverse().forEach(undo => undo());
  }
  win.addEventListener('pagehide', dispose);
  win.__firstLightProbe = Object.freeze({
    snapshot, finish, dispose,
    start(kind) {
      if (disposed) throw new Error('Probe disposed.');
      if (!Object.hasOwn(expectedCounts, kind)) throw new Error('Unknown glass object.');
      if (active) throw new Error('A measurement is already running.');
      active = { kind, started: win.performance.now(), draws: new Set(), rafs: new Set(), reasons: [] };
      visibility();
      preference();
      const card = doc.querySelector('#glass-objects [data-glass-object-kind="' + kind + '"]');
      if (!card || card.getAttribute('data-glass-object-spin') !== 'true') pause('object-motion-paused');
    },
  });
})(window);
