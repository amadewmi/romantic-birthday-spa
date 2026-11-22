/**
 * Cloudinary video configuration for the complete birthday journey.
 *
 * Paste each Cloudinary video delivery URL into the matching cloudinaryUrl
 * field below. The helpers in this file automatically add mobile-friendly
 * Cloudinary delivery transformations and create a first-frame JPG poster.
 * A custom poster URL can be supplied when a hand-picked thumbnail is better.
 */
(function configureRomanticMedia(globalScope) {
  'use strict';

  const VIDEO_TRANSFORM = 'f_auto,q_auto';
  const HLS_TRANSFORM = 'sp_auto:maxres_720p';
  const POSTER_TRANSFORM = 'so_0/c_limit,w_960,h_960/q_auto:eco/f_auto';
  const CLOUDINARY_VIDEO_MARKER = '/video/upload/';

  const rawVideos = Object.freeze({
    firstMeeting: {
      label: 'The Day We Met for the First Time',
      page: 3,
      width: 1080,
      height: 1825,
      cloudinaryUrl: 'https://res.cloudinary.com/cposxg1i/video/upload/v1795292425/1.Mp4.mp4',
      customPosterUrl: ''
    },
    secondMeeting: {
      label: 'Our Second Day Together',
      page: 3,
      width: 1920,
      height: 1080,
      cloudinaryUrl: 'https://res.cloudinary.com/cposxg1i/video/upload/v1795292542/2.Mp4.mp4',
      customPosterUrl: ''
    },
    beachDay: {
      label: 'Beach Day — Our Third Meeting',
      page: 3,
      width: 1080,
      height: 1918,
      cloudinaryUrl: 'https://res.cloudinary.com/cposxg1i/video/upload/v1795292534/3.Mp4.mp4',
      customPosterUrl: ''
    },
    fourthMeeting: {
      label: 'Our Fourth Day Together',
      page: 3,
      width: 720,
      height: 1279,
      cloudinaryUrl: 'https://res.cloudinary.com/cposxg1i/video/upload/v1795292273/5.Mp4.mp4',
      startTime: 2,
      customPosterUrl: 'https://res.cloudinary.com/cposxg1i/video/upload/so_2/c_limit,w_960,h_960/q_auto:eco/f_auto/v1795292273/5.Mp4.jpg'
    },
    heartStealer: {
      label: 'You Stole My Heart Again',
      page: 4,
      width: 848,
      height: 478,
      cloudinaryUrl: 'https://res.cloudinary.com/cposxg1i/video/upload/v1795292257/6.Mp4.mp4',
      customPosterUrl: ''
    },
    favoriteMoment: {
      label: 'My Favorite Beautiful Moment With You',
      page: 8,
      width: 1080,
      height: 1920,
      cloudinaryUrl: 'https://res.cloudinary.com/cposxg1i/video/upload/v1795292369/4.Mp4.mp4',
      customPosterUrl: ''
    },
    livingMemories: {
      label: 'Our Living Memories',
      page: 9,
      width: 1280,
      height: 723,
      cloudinaryUrl: 'https://res.cloudinary.com/cposxg1i/video/upload/v1795292896/Our-Video.Mp4.mp4',
      customPosterUrl: ''
    }
  });

  const videoOrder = Object.freeze([
    'firstMeeting',
    'secondMeeting',
    'beachDay',
    'fourthMeeting',
    'heartStealer',
    'favoriteMoment',
    'livingMemories'
  ]);

  function isPlaceholder(value) {
    return typeof value !== 'string' || !value.trim() || value.includes('PASTE_CLOUDINARY_');
  }

  function parseCloudinaryVideoUrl(value) {
    if (isPlaceholder(value)) return null;

    try {
      const parsed = new URL(value.trim());
      const isCloudinaryHost = parsed.protocol === 'https:' &&
        (parsed.hostname === 'res.cloudinary.com' || parsed.hostname.endsWith('.res.cloudinary.com'));
      if (!isCloudinaryHost || !parsed.pathname.includes(CLOUDINARY_VIDEO_MARKER)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function injectCloudinaryTransform(value, transform) {
    const parsed = parseCloudinaryVideoUrl(value);
    if (!parsed) return '';

    const markerIndex = parsed.pathname.indexOf(CLOUDINARY_VIDEO_MARKER);
    const prefixEnd = markerIndex + CLOUDINARY_VIDEO_MARKER.length;
    const prefix = parsed.pathname.slice(0, prefixEnd);
    const remainder = parsed.pathname.slice(prefixEnd);
    if (!remainder.startsWith(`${transform}/`)) {
      parsed.pathname = `${prefix}${transform}/${remainder}`;
    }
    return parsed.toString();
  }

  function replaceDeliveryExtension(value, extension) {
    if (!value) return '';
    const parsed = new URL(value);
    parsed.pathname = /\.[^./]+$/.test(parsed.pathname)
      ? parsed.pathname.replace(/\.[^./]+$/, `.${extension}`)
      : `${parsed.pathname}.${extension}`;
    return parsed.toString();
  }

  function optimizeCloudinaryVideoUrl(value) {
    // Preserve the original upload geometry exactly. Some phone videos carry
    // rotation metadata that Cloudinary's resize/crop transforms can flatten.
    return injectCloudinaryTransform(value, VIDEO_TRANSFORM);
  }

  function deriveCloudinaryHlsUrl(value) {
    return replaceDeliveryExtension(injectCloudinaryTransform(value, HLS_TRANSFORM), 'm3u8');
  }

  function deriveCloudinaryPosterUrl(value) {
    const transformed = injectCloudinaryTransform(value, POSTER_TRANSFORM);
    if (!transformed) return '';

    const parsed = new URL(transformed);
    parsed.pathname = /\.[^./]+$/.test(parsed.pathname)
      ? parsed.pathname.replace(/\.[^./]+$/, '.jpg')
      : `${parsed.pathname}.jpg`;
    return parsed.toString();
  }

  function normalizePosterOverride(value) {
    if (isPlaceholder(value)) return '';
    try {
      const parsed = new URL(value.trim());
      return parsed.protocol === 'https:' ? parsed.toString() : '';
    } catch {
      return '';
    }
  }

  function getMedia(key) {
    const entry = rawVideos[key];
    if (!entry) return null;

    const width = Number(entry.width) || 16;
    const height = Number(entry.height) || 9;
    const videoUrl = optimizeCloudinaryVideoUrl(entry.cloudinaryUrl);
    const customPosterUrl = normalizePosterOverride(entry.customPosterUrl);
    const hlsUrl = key === 'livingMemories'
      ? deriveCloudinaryHlsUrl(entry.cloudinaryUrl)
      : '';
    return Object.freeze({
      key,
      label: entry.label,
      page: entry.page,
      width,
      height,
      startTime: Math.max(0, Number(entry.startTime) || 0),
      aspectRatio: width / height,
      orientation: height > width ? 'portrait' : 'landscape',
      configured: Boolean(videoUrl),
      videoUrl,
      fallbackVideoUrl: videoUrl,
      hlsUrl,
      posterUrl: customPosterUrl || deriveCloudinaryPosterUrl(entry.cloudinaryUrl)
    });
  }

  const mediaLibrary = Object.freeze(
    Object.fromEntries(videoOrder.map(key => [key, getMedia(key)]))
  );

  globalScope.RomanticMedia = Object.freeze({
    rawVideos,
    videoOrder,
    mediaLibrary,
    getMedia,
    optimizeCloudinaryVideoUrl,
    deriveCloudinaryHlsUrl,
    deriveCloudinaryPosterUrl
  });
})(globalThis);
