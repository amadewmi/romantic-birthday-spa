(function createRomanticVideoExperience(globalScope) {
  'use strict';

  const mediaApi = globalScope.RomanticMedia;
  if (!mediaApi) throw new Error('media-config.js must load before video-experience.js.');

  const EXCLUSIVE_AUDIO_KEY = 'livingMemories';

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

  function createPlayerMarkup({ key, label, page, compact = false }) {
    const media = mediaApi.getMedia(key);
    const safeLabel = escapeHtml(label || media?.label || 'Romantic memory video');
    const poster = media?.posterUrl ? ` poster="${escapeHtml(media.posterUrl)}"` : '';
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
        <video playsinline preload="none" aria-label="${safeLabel}"${poster}${mutedAttribute}></video>
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
    const minutes = Math.floor(wholeSeconds / 60);
    return `${minutes}:${String(wholeSeconds % 60).padStart(2, '0')}`;
  }

  function hasUsefulBuffer(video) {
    if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) return true;
    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.buffered.length === 0) return false;
    const current = video.currentTime || 0;
    for (let index = 0; index < video.buffered.length; index += 1) {
      if (video.buffered.start(index) <= current && video.buffered.end(index) >= current) {
        const bufferedAhead = video.buffered.end(index) - current;
        return bufferedAhead >= Math.min(12, Math.max(5, video.duration * 0.18));
      }
    }
    return false;
  }

  class VideoExperience {
    constructor(options = {}) {
      this.getActivePage = options.getActivePage || (() => 0);
      this.onPlaybackStart = options.onPlaybackStart || (() => {});
      this.onPlaybackStop = options.onPlaybackStop || (() => {});
      this.playerStates = new WeakMap();
      this.players = new Set();
      this.backgroundQueue = [];
      this.backgroundQueuedKeys = new Set();
      this.backgroundLoading = false;
      this.loadedKeys = new Set();
      this.playingState = null;
      this.autoplayCandidates = new Set();
      this.visibilityObserver = new IntersectionObserver(
        entries => this.handleVisibility(entries),
        { rootMargin: '320px 0px', threshold: [0, 0.12, 0.5] }
      );
      this.autoplayObserver = new IntersectionObserver(
        entries => this.handleAutoplayVisibility(entries),
        { rootMargin: '0px', threshold: [0, 0.45, 0.75] }
      );
      this.refresh();
    }

    refresh() {
      this.players.forEach(player => {
        if (!player.isConnected) this.players.delete(player);
      });

      document.querySelectorAll('[data-luxury-video]').forEach(player => {
        if (this.playerStates.has(player)) return;
        this.initializePlayer(player);
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
        predictivePlanned: false,
        playbackStarted: false,
        suppressStop: false,
        autoplayCompleted: false,
        visibilityRatio: 0,
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

      if (media.posterUrl) video.poster = media.posterUrl;
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
        const fullscreenTarget = player;
        if (document.fullscreenElement) document.exitFullscreen?.();
        else fullscreenTarget.requestFullscreen?.();
      });
      state.seek?.addEventListener('input', event => {
        if (!Number.isFinite(video.duration) || video.duration <= 0) return;
        video.currentTime = (Number(event.target.value) / 1000) * video.duration;
        this.updateTime(state);
      });

      video.addEventListener('play', () => this.handlePlay(state));
      video.addEventListener('playing', () => this.setBuffering(state, false));
      video.addEventListener('pause', () => this.handlePause(state));
      video.addEventListener('ended', () => this.handleEnded(state));
      video.addEventListener('timeupdate', () => this.updateTime(state));
      video.addEventListener('durationchange', () => this.updateTime(state));
      video.addEventListener('volumechange', () => this.updateMuteButton(state));
      video.addEventListener('waiting', () => this.setBuffering(state, true));
      video.addEventListener('stalled', () => this.setBuffering(state, true));
      video.addEventListener('canplay', () => this.setBuffering(state, false));
      video.addEventListener('progress', () => this.handleActiveBuffer(state));
      video.addEventListener('canplaythrough', () => this.handleActiveBuffer(state));
      video.addEventListener('error', () => {
        this.setBuffering(state, false);
        player.classList.add('has-video-error');
        const notice = player.querySelector('.video-config-notice');
        if (notice) {
          notice.hidden = false;
          notice.innerHTML = '<strong>This memory could not load</strong><span>Please check its Cloudinary URL and delivery access.</span>';
        }
      });

      this.updateTime(state);
      this.updateMuteButton(state);
      this.visibilityObserver.observe(player);
      this.autoplayObserver.observe(player);
    }

    attachSource(state, priority = 'active') {
      if (!state?.media.configured || state.sourceAttached) return;
      state.sourceAttached = true;
      state.video.preload = 'auto';
      state.video.src = state.media.videoUrl;
      state.video.dataset.loadPriority = priority;
      state.video.load();
      this.loadedKeys.add(state.key);
    }

    async togglePlayback(state) {
      if (!state.media.configured) return;
      this.attachSource(state, 'active');
      if (state.video.paused || state.video.ended) {
        state.autoplayCompleted = false;
        this.pauseAll({ except: state.player, resumeAudio: false });
        this.setBuffering(state, state.video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA);
        try {
          await state.video.play();
        } catch (error) {
          this.setBuffering(state, false);
          console.warn('Video playback notice:', error);
        }
      } else {
        state.video.pause();
      }
    }

    handlePlay(state) {
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
      state.player.classList.remove('is-playing');
      state.centerIcon.innerHTML = ICONS.play;
      state.centerLabel.textContent = 'Play memory';
      state.controlToggle.innerHTML = ICONS.play;
      state.controlToggle.setAttribute('aria-label', `Play ${state.media.label}`);

      if (!state.playbackStarted) return;
      state.playbackStarted = false;
      if (this.playingState === state) this.playingState = null;
      if (state.suppressStop) {
        state.suppressStop = false;
        return;
      }
      this.onPlaybackStop(state.video, state.media, 'pause');
    }

    handleEnded(state) {
      state.player.classList.remove('is-playing');
      state.centerIcon.innerHTML = ICONS.play;
      state.centerLabel.textContent = 'Play memory';
      state.controlToggle.innerHTML = ICONS.play;
      state.controlToggle.setAttribute('aria-label', `Play ${state.media.label}`);
      state.playbackStarted = false;
      state.autoplayCompleted = true;
      this.autoplayCandidates.delete(state);
      state.video.currentTime = 0;
      this.updateTime(state);
      if (this.playingState === state) this.playingState = null;
      this.onPlaybackStop(state.video, state.media, 'ended');
    }

    updateTime(state) {
      const { video, seek, time } = state;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const progress = duration > 0 ? Math.min(100, Math.max(0, (video.currentTime / duration) * 100)) : 0;
      if (seek) seek.value = String(Math.round(progress * 10));
      state.player.style.setProperty('--video-progress', `${progress}%`);
      if (time) time.textContent = `${formatTime(video.currentTime)} / ${formatTime(duration)}`;
    }

    handleActiveBuffer(state) {
      if (state.page === Number(this.getActivePage()) && hasUsefulBuffer(state.video)) {
        this.planPredictiveLoads(state);
      }
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
        const isOnActivePage = state.page === Number(this.getActivePage());
        if (entry.isIntersecting && isOnActivePage) {
          this.attachSource(state, 'active');
          this.waitForUsefulBuffer(state).then(() => this.planPredictiveLoads(state));
        }
      });
    }

    handleAutoplayVisibility(entries) {
      entries.forEach(entry => {
        const state = this.playerStates.get(entry.target);
        if (!state || !state.media.configured) return;
        state.visibilityRatio = entry.intersectionRatio;
        const isActivePage = state.page === Number(this.getActivePage());
        if (entry.isIntersecting && entry.intersectionRatio >= 0.45 && isActivePage) {
          this.autoplayCandidates.add(state);
        } else {
          this.autoplayCandidates.delete(state);
          state.autoplayCompleted = false;
        }
      });
      this.playMostVisibleCandidate();
    }

    playMostVisibleCandidate() {
      const activePage = Number(this.getActivePage());
      const candidate = [...this.autoplayCandidates]
        .filter(state => state.player.isConnected && state.page === activePage && !state.autoplayCompleted)
        .sort((a, b) => b.visibilityRatio - a.visibilityRatio)[0];

      this.players.forEach(player => {
        const state = this.playerStates.get(player);
        if (!state || state === candidate || state.video.paused) return;
        state.video.pause();
      });

      if (candidate && candidate.video.paused && !candidate.video.ended) {
        this.startAutoplay(candidate);
      }
    }

    async startAutoplay(state) {
      this.attachSource(state, 'active');
      if (!state.usesExclusiveAudio) state.video.muted = true;
      this.setBuffering(state, state.video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA);
      try {
        await state.video.play();
      } catch {
        this.setBuffering(state, false);
      }
    }

    handleActiveBuffer(state) {
      if (state.page !== Number(this.getActivePage()) || !hasUsefulBuffer(state.video)) return;
      this.planPredictiveLoads(state);
    }

    waitForUsefulBuffer(state, timeoutMs = 15000) {
      if (hasUsefulBuffer(state.video)) return Promise.resolve();
      return new Promise(resolve => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          state.video.removeEventListener('progress', check);
          state.video.removeEventListener('canplaythrough', finish);
          state.video.removeEventListener('error', finish);
          resolve();
        };
        const check = () => {
          if (hasUsefulBuffer(state.video)) finish();
        };
        const timer = setTimeout(finish, timeoutMs);
        state.video.addEventListener('progress', check);
        state.video.addEventListener('canplaythrough', finish, { once: true });
        state.video.addEventListener('error', finish, { once: true });
      });
    }

    planPredictiveLoads(state) {
      if (state.predictivePlanned) return;
      state.predictivePlanned = true;
      const currentIndex = mediaApi.videoOrder.indexOf(state.key);
      const nextSequentialKey = currentIndex >= 0 ? mediaApi.videoOrder[currentIndex + 1] : null;
      const nextPagePrimary = mediaApi.videoOrder.find(key => mediaApi.getMedia(key)?.page > state.page);
      if (nextSequentialKey) this.enqueueBackground(nextSequentialKey);
      if (nextPagePrimary && nextPagePrimary !== nextSequentialKey) this.enqueueBackground(nextPagePrimary);
    }

    enqueueBackground(key) {
      const media = mediaApi.getMedia(key);
      if (!media?.configured || this.loadedKeys.has(key) || this.backgroundQueuedKeys.has(key)) return;
      this.backgroundQueuedKeys.add(key);
      this.backgroundQueue.push(key);
      this.processBackgroundQueue();
    }

    async processBackgroundQueue() {
      if (this.backgroundLoading) return;
      const key = this.backgroundQueue.shift();
      if (!key) return;

      this.backgroundLoading = true;
      this.backgroundQueuedKeys.delete(key);
      const state = [...this.players]
        .map(player => this.playerStates.get(player))
        .find(candidate => candidate?.key === key && candidate.player.isConnected);

      if (state) {
        this.attachSource(state, 'predictive');
        await this.waitForUsefulBuffer(state, 12000);
      }
      this.backgroundLoading = false;
      const schedule = globalScope.requestIdleCallback || (callback => setTimeout(callback, 180));
      schedule(() => this.processBackgroundQueue());
    }

    activatePage(page) {
      this.refresh();
      const numericPage = Number(page);
      requestAnimationFrame(() => {
        const candidates = [...this.players]
          .map(player => this.playerStates.get(player))
          .filter(state => state?.page === numericPage && state.player.isConnected)
          .sort((a, b) => a.player.getBoundingClientRect().top - b.player.getBoundingClientRect().top);
        candidates.forEach(state => { state.autoplayCompleted = false; });
        const visible = candidates.find(state => {
          const rect = state.player.getBoundingClientRect();
          return rect.bottom >= 0 && rect.top <= globalScope.innerHeight + 220;
        });
        if (visible) {
          this.attachSource(visible, 'active');
          this.waitForUsefulBuffer(visible).then(() => this.planPredictiveLoads(visible));
        }

        this.autoplayCandidates.clear();
        candidates.forEach(state => {
          const rect = state.player.getBoundingClientRect();
          const visibleHeight = Math.max(0, Math.min(rect.bottom, globalScope.innerHeight) - Math.max(rect.top, 0));
          const ratio = rect.height > 0 ? visibleHeight / rect.height : 0;
          state.visibilityRatio = ratio;
          if (ratio >= 0.45) this.autoplayCandidates.add(state);
        });
        this.playMostVisibleCandidate();
      });
    }

    pauseAll({ except = null, resumeAudio = true } = {}) {
      this.players.forEach(player => {
        if (player === except) return;
        const state = this.playerStates.get(player);
        if (!state || state.video.paused) return;
        state.suppressStop = !resumeAudio;
        state.video.pause();
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
