========================================================================
🌹 ROMANTIC BIRTHDAY SURPRISE - ASSETS FOLDER GUIDE
========================================================================

ඔබගේ සින්දු සහ පින්තූර local assets ලෙස තබා ඇත. වීඩියෝ Cloudinary CDN එකෙන් ලබා ගනී:

1. 🎵 AUDIO FOLDER (assets/audio/):
   - assets/audio/aud1.mp3
     -> Ed Sheeran ගේ "Perfect" ගීතය.
        (Welcome පිටුවේ සිට ස්මූත් fade in එකකින් First Romantic Chorus එක ළඟින් [52s] පටන් ගනී).
   - assets/audio/aud2.mp3
     -> Birthday Cake එක තියෙන Celebrate page එකට අවශ්‍ය Birthday song එක.
        (Celebrate පිටුවට යද්දී Perfect ගීතය fade out වී නැවතී, Birthday song එක ස්මූත් fade in එකකින් පටන් ගනී. Celebrate පිටුවෙන් Next ක්ලික් කළ විට Birthday song fade out වී නැවතී Perfect ගීතය නැවතුන තැනින් නැවත play වේ).

2. 🎥 CLOUDINARY VIDEO CONFIG (assets/js/media-config.js):
   - වීඩියෝ 7ම Cloudinary වෙත upload කර, Original secure delivery URL එක
     අදාළ cloudinaryUrl field එකට paste කරන්න.
   - optimized video URL සහ poster thumbnail URL code එකෙන් ස්වයංක්‍රීයව සාදයි.
   - Local MP4 files Git repository එකට නැවත add නොකරන්න.
   - සම්පූර්ණ උපදෙස්: project root එකේ CLOUDINARY_SETUP_GUIDE.md

3. 📸 IMAGES FOLDER (assets/images/):
   - ඔබ දෙදෙනාගේ ඡායාරූප මෙහි save කරගත හැක.
========================================================================
