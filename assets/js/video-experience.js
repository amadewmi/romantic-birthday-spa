(function createRomanticVideoExperience(globalScope) {
  'use strict';

  const mediaApi = globalScope.RomanticMedia;
  if (!mediaApi) throw new Error('media-config.js must load before video-experience.js.');

  const EXCLUSIVE_AUDIO_KEY = 'livingMemories';
  const HLS_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/hls.js@1.7.4/dist/hls.min.js';
  const HLS_READY_TIMEOUT_MS = 7000;
  let hlsLibraryPromise = null;

  const ICONS = Object.freeze({
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>',
    volume: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zm-2.5-8.76v2.07a7 7 0 0 1 0 13.38v2.07a9 9 0 0 0 0-17.52z"/></svg>',
    muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3zm13.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z"/></svg>',
    fullscreen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zm-3-12v2h3v3h2V5h-5z"/></svg>'
  });

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
  }

  function loadHlsLibrary() {
    if (globalScope.Hls) return Promise.resolve(globalScope.Hls);
    if (hlsLibraryPromise) return hlsLibraryPromise;

    hlsLibraryPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-romantic-hls]');
      const script = existing || document.createElement('script');
      const timeout = globalScope.setTimeout(() => {
        script.remove();
        reject(new Error('hls.js load timed out'));
      }, HLS_READY_TIMEOUT_MS);
      const finish = () => {
        globalScope.clearTimeout(timeout);
        if (globalScope.Hls) resolve(globalScope.Hls);
        else reject(new Error('hls.js loaded without its Hls API'));
      };
      const fail = () => {
        globalScope.clearTimeout(timeout);
        script.remove();
        reject(new Error('hls.js could not be loaded'));
      };

      script.addEventListener('load', finish, { once: true });
      script.addEventListener('error', fail, { once: true });
      if (!existing) {
        script.src = HLS_SCRIPT_URL;
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.dataset.romanticHls = 'true';
        document.head.appendChild(script);
      }
    }).catch(error => {
      hlsLibraryPromise = null;
      throw error;
    });

    return hlsLibraryPromise;
  }

  function createPlayerMarkup({ key, label, page, compact = false }) {
    const media = mediaApi.getMedia(key);
    const safeLabel = escapeHtml(label || media?.label || 'Romantic memory video');
    const posterData = media?.posterUrl ? ` data-video-poster="${escapeHtml(media.posterUrl)}"` : '';
    const stateClass = media?.configured ? '' : ' is-unconfigured';
    const compactClass = compact ? ' is-compact' : '';
    const orientationClass = media?.orientation ? ` is-${media.orientation}` : '';
    const aspectRatio = Number.isFinite(media?.aspectRatio) ? media.aspectRatio : (16 / 9);
    const aspectStyle = ` style="--video-aspect: ${media?.width || 16} / ${media?.height || 9}; --video-ratio: ${aspectRatio.toFixed(6)}"`;
    const usesExclusiveAudio = key === EXCLUSIVE_AUDIO_KEY;
    const mutedAttribute = usesExclusiveAudio ? '' : ' muted';
    const muteButtonAttributes = usesExclusiveAudio
      ? ` aria-label="Mute ${safeLabel}"`
      : ` aria-label="${safeLabel} plays muted while Our Song continues" aria-disabled="true" disabled`;
    const muteIcon = usesExclusiveAudio ? ICONS.volume : ICONS.muted;

    return `
      <div class="luxury-video-player${stateClass}${compactClass}${orientationClass}" data-luxury-video data-media-key="${escapeHtml(key)}" data-media-page="${Number(page || media?.page || 0)}" data-video-orientation="${media?.orientation || 'landscape'}" aria-label="${safeLabel}"${aspectStyle}>
        <video playsinline preload="none" aria-label="${safeLabel}"${posterData}${mutedAttribute}></video>
        <div class="video-poster-shade" aria-hidden="true"></div>
        <button class="video-center-play" type="button" data-video-action="toggle" aria-label="Play ${safeLabel}"${media?.configured ? '' : ' disabled'}>
          <span class="video-center-play-icon">${ICONS.play}</span>
          <span class="video-center-play-label">Play memory</span>
        </button>
        <div class="video-buffering" role="status" aria-label="Video is buffering" hidden><span></span></div>
        <div class="video-config-notice"${media?.configured ? ' hidden' : ''}>
          <strong>Cloudinary video ready to connect</strong>
          <span>Add this URL in <code>assets/js/media-config.js</code>.</span>
        </div>
        <div class="video-control-bar"${media?.configured ? '' : ' hidden'}>
          <button type="button" class="video-control-button" data-video-action="toggle" aria-label="Play ${safeLabel}">${ICONS.play}</button>
          <span class="video-time" data-video-time>0:00 / 0:00</span>
          <label class="video-seek-label">
            <span class="sr-only">Seek ${safeLabel}</span>
            <input class="video-seek" data-video-seek type="range" min="0" max="1000" value="0" step="1" aria-label="Seek ${safeLabel}">
          </label>
          <button type="button" class="video-control-button" data-video-action="mute"${muteButtonAttributes}>${muteIcon}</button>
          <button type="button" class="video-control-button" data-video-action="fullscreen" aria-label="View ${safeLabel} fullscreen">${ICONS.fullscreen}</button>
        </div>
      </div>`;
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const wholeSeconds = Math.floor(seconds);
    return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, '0')}`;
  }

  class VideoExperience {
    constructor(options = {}) {
      this.getActivePage = options.getActivePage || (() => 0);
      this.onPlaybackStart = options.onPlaybackStart || (() => {});
      this.onPlaybackStop = options.onPlaybackStop || (() => {});
      this.playerStates = new WeakMap();
      this.players = new Set();
      this.playingState = null;
      this.autoplayCandidates = new Set();
      this.visibilityObserver = new IntersectionObserver(
        entries => this.handleVisibility(entries),
        { rootMargin: '120px 0px', threshold: [0, 0.12, 0.45, 0.75] }
      );
      this.refresh();
    }

    refresh() {
      this.players.forEach(player => {
        if (!player.isConnected) this.players.delete(player);
      });
      document.querySelectorAll('[data-luxury-video]').forEach(player => {
        if (!this.playerStates.has(player)) this.initializePlayer(player);
      });
      this.visibilityObserver.takeRecords();
    }

    initializePlayer(player) {
      const key = player.dataset.mediaKey;
      const media = mediaApi.getMedia(key);
      const video = player.querySelector('video');
      if (!media || !video) return;

      const state = {
        player,
        key,
        media,
        video,
        usesExclusiveAudio: key === EXCLUSIVE_AUDIO_KEY,
        page: Number(player.dataset.mediaPage || media.page || 0),
        sourceAttached: false,
        sourcePromise: null,
        sourceMode: 'none',
        sourceGeneration: 0,
        hls: null,
        hlsReadyTimer: null,
        hlsRecoveryAttempts: 0,
        switchingSource: false,
        requestedPlayback: false,
        playbackStarted: false,
        autoplayCompleted: false,
        visibilityRatio: 0,
        resumeTime: 0,
        releaseTimer: null,
        centerButton: player.querySelector('.video-center-play'),
        centerIcon: player.querySelector('.video-center-play-icon'),
        centerLabel: player.querySelector('.video-center-play-label'),
        buffering: player.querySelector('.video-buffering'),
        controlToggle: player.querySelector('.video-control-button[data-video-action="toggle"]'),
        muteButton: player.querySelector('[data-video-action="mute"]'),
        seek: player.querySelector('[data-video-seek]'),
        time: player.querySelector('[data-video-time]')
      };

      this.playerStates.set(player, state);
      this.players.add(player);
      video.defaultMuted = !state.usesExclusiveAudio;
      video.muted = !state.usesExclusiveAudio;
      if (!media.configured) return;

      player.querySelectorAll('[data-video-action="toggle"]').forEach(button => {
        button.addEventListener('click', () => this.togglePlayback(state));
      });
      state.muteButton?.addEventListener('click', () => {
        if (!state.usesExclusiveAudio) return;
        video.muted = !video.muted;
        this.updateMuteButton(state);
      });
      player.querySelector('[data-video-action="fullscreen"]')?.addEventListener('click', () => {
        if (document.fullscreenElement) document.exitFullscreen?.();
        else player.requestFullscreen?.();
      });
      state.seek?.addEventListener('input', event => {
        if (!Number.isFinite(video.duration) || video.duration <= 0) return;
        video.currentTime = (Number(event.target.value) / 1000) * video.duration;
        state.resumeTime = video.currentTime;
        this.updateTime(state);
      });

      video.addEventListener('play', () => this.handlePlay(state));
      video.addEventListener('playing', () => this.setBuffering(state, false));
      video.addEventListener('pause', () => this.handlePause(state));
      video.addEventListener('ended', () => this.handleEnded(state));
      video.addEventListener('timeupdate', () => {
        state.resumeTime = video.currentTime;
        this.updateTime(state);
      });
      video.addEventListener('loadedmetadata', () => {
        this.syncPlayerGeometry(state);
        this.restoreResumeTime(state);
        this.updateTime(state);
      });
      video.addEventListener('durationchange', () => this.updateTime(state));
      video.addEventListener('volumechange', () => this.updateMuteButton(state));
      video.addEventListener('waiting', () => this.setBuffering(state, true));
      video.addEventListener('stalled', () => this.setBuffering(state, true));
      video.addEventListener('canplay', () => this.setBuffering(state, false));
      video.addEventListener('error', () => this.handleVideoError(state));

      this.updateTime(state);
      this.updateMuteButton(state);
      this.visibilityObserver.observe(player);
    }

    clearReleaseTimer(state) {
      if (!state.releaseTimer) return;
      globalScope.clearTimeout(state.releaseTimer);
      state.releaseTimer = null;
    }

    restoreResumeTime(state) {
      if (!Number.isFinite(state.resumeTime) || state.resumeTime <= 0 || !Number.isFinite(state.video.duration)) return;
      try { state.video.currentTime = Math.min(state.resumeTime, Math.max(0, state.video.duration - 0.2)); } catch (_) {}
    }

    syncPlayerGeometry(state) {
      const width = Number(state?.video.videoWidth);
      const height = Number(state?.video.videoHeight);
      if (!width || !height) return;

      const aspectRatio = width / height;
      const orientation = height > width * 1.05 ? 'portrait' : 'landscape';
      state.player.style.setProperty('--video-aspect', `${width} / ${height}`);
      state.player.style.setProperty('--video-ratio', aspectRatio.toFixed(6));
      state.player.dataset.videoOrientation = orientation;
      state.player.classList.toggle('is-portrait', orientation === 'portrait');
      state.player.classList.toggle('is-landscape', orientation === 'landscape');
    }

    ensurePoster(state) {
      if (state?.media.posterUrl && !state.video.hasAttribute('poster')) {
        state.video.poster = state.media.posterUrl;
      }
    }

    async attachSource(state, priority = 'visible') {
      if (!state?.media.configured) return false;
      this.clearReleaseTimer(state);
      this.ensurePoster(state);
      state.video.dataset.loadPriority = priority;
      if (state.sourceAttached) return state.sourcePromise || true;

      state.sourceAttached = true;
      state.sourceGeneration += 1;
      const generation = state.sourceGeneration;
      state.player.classList.remove('has-video-error');
      const notice = state.player.querySelector('.video-config-notice');
      if (notice) notice.hidden = true;

      state.sourcePromise = state.media.hlsUrl
        ? this.attachAdaptiveSource(state, generation)
        : this.attachProgressiveSource(state, generation);
      return state.sourcePromise;
    }

    attachProgressiveSource(state, generation) {
      if (generation !== state.sourceGeneration) return Promise.resolve(false);
      state.sourceMode = 'mp4';
      state.video.preload = 'auto';
      state.video.src = state.media.fallbackVideoUrl || state.media.videoUrl;
      state.video.load();
      return Promise.resolve(true);
    }

    async attachAdaptiveSource(state, generation) {
      let HlsClass = null;
      try {
        HlsClass = await loadHlsLibrary();
      } catch (error) {
        console.warn('Adaptive video library notice:', error);
      }
      if (generation !== state.sourceGeneration || !state.sourceAttached) return false;

      if (HlsClass?.isSupported()) {
        return new Promise(resolve => {
          let settled = false;
          const finish = result => {
            if (settled) return;
            settled = true;
            globalScope.clearTimeout(state.hlsReadyTimer);
            state.hlsReadyTimer = null;
            resolve(result);
          };
          const fallback = () => {
            if (generation !== state.sourceGeneration) return finish(false);
            this.switchToFallback(state, generation).then(finish);
          };
          const hls = new HlsClass({
            enableWorker: true,
            autoStartLoad: false,
            capLevelToPlayerSize: true,
            startLevel: 1,
            maxBufferLength: 18,
            maxMaxBufferLength: 36,
            backBufferLength: 18,
            abrEwmaDefaultEstimate: 500000,
            abrBandWidthFactor: 0.8,
            abrBandWidthUpFactor: 0.6,
            maxStarvationDelay: 2,
            maxLoadingDelay: 2,
            manifestLoadingMaxRetry: 1,
            levelLoadingMaxRetry: 2,
            fragLoadingMaxRetry: 3
          });
          state.hls = hls;
          state.sourceMode = 'hls-js';
          state.hlsReadyTimer = globalScope.setTimeout(fallback, HLS_READY_TIMEOUT_MS);
          hls.on(HlsClass.Events.MEDIA_ATTACHED, () => hls.loadSource(state.media.hlsUrl));
          hls.on(HlsClass.Events.MANIFEST_PARSED, () => {
            hls.autoLevelCapping = globalScope.matchMedia('(max-width: 600px)').matches ? 2 : -1;
            this.restoreResumeTime(state);
            if (state.requestedPlayback) hls.startLoad(state.resumeTime || -1);
            finish(true);
          });
          hls.on(HlsClass.Events.ERROR, (_event, data) => {
            if (!data?.fatal) return;
            if (data.type === HlsClass.ErrorTypes.MEDIA_ERROR && state.hlsRecoveryAttempts < 1) {
              state.hlsRecoveryAttempts += 1;
              hls.recoverMediaError();
              return;
            }
            fallback();
          });
          hls.attachMedia(state.video);
        });
      }

      if (state.video.canPlayType('application/vnd.apple.mpegurl')) {
        state.sourceMode = 'hls-native';
        state.video.preload = 'auto';
        state.video.src = state.media.hlsUrl;
        state.video.load();
        return new Promise(resolve => {
          let settled = false;
          const finish = result => {
            if (settled) return;
            settled = true;
            globalScope.clearTimeout(timer);
            state.video.removeEventListener('loadedmetadata', ready);
            state.video.removeEventListener('error', failed);
            resolve(result);
          };
          const ready = () => {
            this.restoreResumeTime(state);
            finish(true);
          };
          const failed = () => this.switchToFallback(state, generation).then(finish);
          const timer = globalScope.setTimeout(failed, HLS_READY_TIMEOUT_MS);
          state.video.addEventListener('loadedmetadata', ready, { once: true });
          state.video.addEventListener('error', failed, { once: true });
        });
      }

      return this.switchToFallback(state, generation);
    }

    switchToFallback(state, generation = state.sourceGeneration) {
      if (generation !== state.sourceGeneration || !state.sourceAttached) return Promise.resolve(false);
      const shouldPlay = state.requestedPlayback || state.playbackStarted || !state.video.paused;
      if (Number.isFinite(state.video.currentTime) && state.video.currentTime > 0) state.resumeTime = state.video.currentTime;
      state.switchingSource = true;
      globalScope.clearTimeout(state.hlsReadyTimer);
      state.hlsReadyTimer = null;
      state.hls?.destroy();
      state.hls = null;
      state.sourceMode = 'mp4-fallback';
      state.video.preload = 'auto';
      state.video.src = state.media.fallbackVideoUrl || state.media.videoUrl;
      state.video.load();

      return new Promise(resolve => {
        let settled = false;
        const finish = result => {
          if (settled) return;
          settled = true;
          globalScope.clearTimeout(timer);
          state.switchingSource = false;
          resolve(result);
        };
        const ready = () => {
          this.restoreResumeTime(state);
          if (shouldPlay) state.video.play().catch(() => {});
          finish(true);
        };
        const timer = globalScope.setTimeout(() => finish(true), 5000);
        state.video.addEventListener('loadedmetadata', ready, { once: true });
      });
    }

    releaseSource(state) {
      if (!state?.sourceAttached) return;
      this.clearReleaseTimer(state);
      state.requestedPlayback = false;
      if (Number.isFinite(state.video.currentTime) && state.video.currentTime > 0 && !state.video.ended) {
        state.resumeTime = state.video.currentTime;
      }
      const wasPlaybackStarted = state.playbackStarted;
      if (!state.video.paused) state.video.pause();
      if (wasPlaybackStarted && state.playbackStarted) this.handlePause(state);
      state.sourceGeneration += 1;
      globalScope.clearTimeout(state.hlsReadyTimer);
      state.hlsReadyTimer = null;
      state.hls?.destroy();
      state.hls = null;
      state.video.removeAttribute('src');
      state.video.preload = 'none';
      state.video.load();
      state.sourceAttached = false;
      state.sourcePromise = null;
      state.sourceMode = 'none';
      state.switchingSource = false;
      this.setBuffering(state, false);
    }

    scheduleRelease(state, delay = 1200) {
      this.clearReleaseTimer(state);
      state.releaseTimer = globalScope.setTimeout(() => {
        state.releaseTimer = null;
        if (state.visibilityRatio < 0.12 || state.page !== Number(this.getActivePage()) || state.video.paused) {
          this.releaseSource(state);
        }
      }, delay);
    }

    async togglePlayback(state) {
      if (!state.media.configured) return;
      if (!state.video.paused && !state.video.ended) {
        state.requestedPlayback = false;
        state.video.pause();
        this.scheduleRelease(state, 12000);
        return;
      }

      state.autoplayCompleted = false;
      state.requestedPlayback = true;
      this.pauseAll({ except: state.player, release: true });
      this.releaseInactiveSources(state);
      this.setBuffering(state, true);
      try {
        await this.attachSource(state, 'play');
        state.hls?.startLoad(state.resumeTime || -1);
        await state.video.play();
      } catch (error) {
        this.setBuffering(state, false);
        console.warn('Video playback notice:', error);
      }
    }

    handlePlay(state) {
      this.clearReleaseTimer(state);
      state.requestedPlayback = true;
      state.hls?.startLoad(state.resumeTime || -1);
      if (!state.usesExclusiveAudio) state.video.muted = true;
      state.playbackStarted = true;
      this.playingState = state;
      state.player.classList.add('is-playing');
      state.centerIcon.innerHTML = ICONS.pause;
      state.centerLabel.textContent = 'Pause memory';
      state.controlToggle.innerHTML = ICONS.pause;
      state.controlToggle.setAttribute('aria-label', `Pause ${state.media.label}`);
      this.onPlaybackStart(state.video, state.media);
    }

    handlePause(state) {
      if (state.video.ended) return;
      state.requestedPlayback = false;
      state.hls?.stopLoad();
      state.player.classList.remove('is-playing');
      state.centerIcon.innerHTML = ICONS.play;
      state.centerLabel.textContent = 'Play memory';
      state.controlToggle.innerHTML = ICONS.play;
      state.controlToggle.setAttribute('aria-label', `Play ${state.media.label}`);
      if (!state.playbackStarted) return;
      state.playbackStarted = false;
      if (this.playingState === state) this.playingState = null;
      this.onPlaybackStop(state.video, state.media, 'pause');
    }

    handleEnded(state) {
      state.requestedPlayback = false;
      state.player.classList.remove('is-playing');
      state.centerIcon.innerHTML = ICONS.play;
      state.centerLabel.textContent = 'Play memory';
      state.controlToggle.innerHTML = ICONS.play;
      state.controlToggle.setAttribute('aria-label', `Play ${state.media.label}`);
      state.playbackStarted = false;
      state.autoplayCompleted = true;
      state.resumeTime = 0;
      state.video.currentTime = 0;
      this.updateTime(state);
      if (this.playingState === state) this.playingState = null;
      this.onPlaybackStop(state.video, state.media, 'ended');
      this.scheduleRelease(state, 800);
    }

    handleVideoError(state) {
      if (state.switchingSource || !state.sourceAttached || state.sourceMode.startsWith('hls')) return;
      this.setBuffering(state, false);
      state.player.classList.add('has-video-error');
      const notice = state.player.querySelector('.video-config-notice');
      if (notice) {
        notice.hidden = false;
        notice.innerHTML = '<strong>This memory could not load</strong><span>Please check its Cloudinary delivery access.</span>';
      }
    }

    updateTime(state) {
      const duration = Number.isFinite(state.video.duration) ? state.video.duration : 0;
      const progress = duration > 0 ? Math.min(100, Math.max(0, (state.video.currentTime / duration) * 100)) : 0;
      if (state.seek) state.seek.value = String(Math.round(progress * 10));
      state.player.style.setProperty('--video-progress', `${progress}%`);
      if (state.time) state.time.textContent = `${formatTime(state.video.currentTime)} / ${formatTime(duration)}`;
    }

    updateMuteButton(state) {
      if (!state.muteButton) return;
      if (!state.usesExclusiveAudio) {
        state.video.muted = true;
        state.muteButton.innerHTML = ICONS.muted;
        state.muteButton.setAttribute('aria-label', `${state.media.label} plays muted while Our Song continues`);
        state.muteButton.setAttribute('aria-disabled', 'true');
        state.muteButton.disabled = true;
        return;
      }
      const muted = state.video.muted || state.video.volume === 0;
      state.muteButton.innerHTML = muted ? ICONS.muted : ICONS.volume;
      state.muteButton.setAttribute('aria-label', `${muted ? 'Unmute' : 'Mute'} ${state.media.label}`);
    }

    setBuffering(state, buffering) {
      if (!state.buffering) return;
      state.buffering.hidden = !buffering;
      state.player.classList.toggle('is-buffering', buffering);
    }

    handleVisibility(entries) {
      entries.forEach(entry => {
        const state = this.playerStates.get(entry.target);
        if (!state || !state.media.configured) return;
        state.visibilityRatio = entry.intersectionRatio;
        const isActivePage = state.page === Number(this.getActivePage());
        if (entry.isIntersecting && isActivePage) this.ensurePoster(state);
        if (entry.isIntersecting && entry.intersectionRatio >= 0.45 && isActivePage) {
          this.clearReleaseTimer(state);
          this.autoplayCandidates.add(state);
        } else {
          this.autoplayCandidates.delete(state);
          if (!entry.isIntersecting) state.autoplayCompleted = false;
          if (state.sourceAttached) this.scheduleRelease(state, entry.isIntersecting ? 1800 : 400);
        }
      });
      this.playMostVisibleCandidate();
    }

    releaseInactiveSources(activeState) {
      this.players.forEach(player => {
        const state = this.playerStates.get(player);
        if (!state || state === activeState || !state.sourceAttached) return;
        this.releaseSource(state);
      });
    }

    playMostVisibleCandidate() {
      const activePage = Number(this.getActivePage());
      const candidate = [...this.autoplayCandidates]
        .filter(state => state.player.isConnected && state.page === activePage && !state.autoplayCompleted)
        .sort((a, b) => b.visibilityRatio - a.visibilityRatio)[0];

      if (!candidate) {
        if (this.playingState && this.playingState.visibilityRatio < 0.12) {
          this.releaseSource(this.playingState);
        }
        return;
      }

      // Keep the current memory stable only while it is about as visible as
      // the candidate. A tall portrait clip can remain partly onscreen while
      // the next (landscape) memory is fully visible; it must not prevent the
      // newly focused card from starting automatically.
      if (this.playingState && this.playingState !== candidate &&
          this.playingState.page === activePage &&
          !this.playingState.video.paused &&
          this.playingState.visibilityRatio >= 0.2 &&
          this.playingState.visibilityRatio + 0.12 >= candidate.visibilityRatio) {
        return;
      }
      const pendingState = [...this.players]
        .map(player => this.playerStates.get(player))
        .find(state => state?.requestedPlayback && state.sourceAttached);
      if (pendingState && pendingState !== candidate &&
          pendingState.page === activePage && pendingState.visibilityRatio >= 0.2 &&
          pendingState.visibilityRatio + 0.12 >= candidate.visibilityRatio) {
        return;
      }
      this.releaseInactiveSources(candidate);
      if (candidate.video.paused && !candidate.video.ended) this.startAutoplay(candidate);
    }

    async startAutoplay(state) {
      if (state.requestedPlayback) return;
      state.requestedPlayback = true;
      if (!state.usesExclusiveAudio) state.video.muted = true;
      this.setBuffering(state, true);
      try {
        await this.attachSource(state, 'autoplay');
        if (state.visibilityRatio < 0.45 || state.page !== Number(this.getActivePage())) return;
        state.hls?.startLoad(state.resumeTime || -1);
        await state.video.play();
      } catch {
        state.requestedPlayback = false;
        state.hls?.stopLoad();
        this.setBuffering(state, false);
        if (state.usesExclusiveAudio) state.centerLabel.textContent = 'Tap to play with sound';
      }
    }

    activatePage(page) {
      this.refresh();
      const numericPage = Number(page);
      this.autoplayCandidates.clear();
      this.players.forEach(player => {
        const state = this.playerStates.get(player);
        if (!state) return;
        state.autoplayCompleted = false;
        if (state.page !== numericPage) {
          state.visibilityRatio = 0;
          this.releaseSource(state);
        }
      });

      requestAnimationFrame(() => {
        const measured = [...this.players]
          .map(player => this.playerStates.get(player))
          .filter(state => state?.page === numericPage && state.player.isConnected)
          .map(state => ({ state, rect: state.player.getBoundingClientRect() }))
          .sort((a, b) => a.rect.top - b.rect.top);

        measured.forEach(({ state, rect }) => {
          if (rect.bottom >= -240 && rect.top <= globalScope.innerHeight + 360) this.ensurePoster(state);
          const visibleHeight = Math.max(0, Math.min(rect.bottom, globalScope.innerHeight) - Math.max(rect.top, 0));
          state.visibilityRatio = rect.height > 0 ? visibleHeight / rect.height : 0;
          if (state.visibilityRatio >= 0.45) this.autoplayCandidates.add(state);
        });
        this.playMostVisibleCandidate();
      });
    }

    pauseAll({ except = null, release = false } = {}) {
      this.players.forEach(player => {
        if (player === except) return;
        const state = this.playerStates.get(player);
        if (!state) return;
        if (!state.video.paused) state.video.pause();
        if (release) this.releaseSource(state);
      });
    }

    isVideoPlaying() {
      return Boolean(this.playingState && !this.playingState.video.paused && !this.playingState.video.ended);
    }

    isExclusiveVideoPlaying() {
      return Boolean(
        this.playingState?.usesExclusiveAudio &&
        !this.playingState.video.paused &&
        !this.playingState.video.ended
      );
    }
  }

  globalScope.RomanticVideoExperience = Object.freeze({
    createPlayerMarkup,
    VideoExperience
  });
})(globalThis);
