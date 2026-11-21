# Cloudinary Video Setup Sinhala Guide

මෙම guide එකෙන් `romantic-birthday-spa` project එකේ වීඩියෝ 7ම Cloudinary CDN එකට upload කර, එකම config file එකකට URLs දාලා, GitHub සහ Vercel වෙත lightweight version එක deploy කරන ආකාරය පියවරෙන් පියවර කියලා දෙයි.

## 1. පටන් ගන්න කලින් දැනගන්න වැදගත් දෙයක්

Cloudinary upload සඳහා original video files 7ම project repository එකෙන් පිට personal backup folder එකක තබාගන්න. Updated project එක `assets/video/` තුළ MP4 files තබන්නේ නැහැ; ඒවා Git එකට commit නොවී Cloudinary වෙත පමණක් upload කළ යුතුයි.

Cloudinary Free plan එක free forever, credit card එකක් අවශ්‍ය නැහැ, සහ video transformations/CDN delivery support කරනවා. නමුත් Free plan එකේ එක් video file එකකට උපරිම size එක **100 MB**. [Cloudinary plan comparison](https://cloudinary.com/pricing/compare-plans)

මෙම project එකේ තිබුණු source files අතරින් පහත files දෙක 100 MB ට වැඩියි:

- `3.mp4.mp4` — සுமார் 166 MB
- `our-video.mp4.mp4` — සுமார் 301 MB

ඒ නිසා Free plan එක භාවිතා කරනවා නම් ඒ files දෙක upload කරන්න කලින් video editor/compressor එකකින් 100 MB ට අඩු කරන්න. Resolution එක 1080p හෝ 720p, H.264 MP4, සහ “web optimized” export එකක් සාමාන්‍යයෙන් හොඳ ප්‍රතිඵලයක් දෙයි. Original videos project folder එකෙන් පිටත backup කරගන්න.

> Cloudinary Media Library/Upload Widget එක large uploads chunk කරලා upload කළත්, account plan එකේ උපරිම file-size limit එක ඉක්මවන්න බැහැ. [Cloudinary large upload documentation](https://cloudinary.com/documentation/upload_images#chunked_asset_upload)

## 2. Free Cloudinary account එක සාදන්න

1. [Cloudinary free signup page](https://console.cloudinary.com/users/register_free) එක open කරන්න.
2. **Sign up with Email**, **Google**, හෝ **GitHub** එකක් තෝරන්න.
3. Email verification එක ඉල්ලුවොත් verify කරන්න.
4. Cloudinary Console එකට login වුණාම ඔබගේ default Product Environment එක තෝරන්න.
5. Sidebar එකෙන් **Assets** හෝ **Media Library** open කරන්න.

Cloudinary Media Library එකෙන් assets upload, search, manage සහ delivery URL copy කරන්න පුළුවන්. [Cloudinary Media Library documentation](https://cloudinary.com/documentation/media_library_for_developers)

## 3. වීඩියෝ 7 upload කරන්න

පහසුවෙන් හඳුනාගන්න පුළුවන් folder එකක් හදන්න. උදාහරණයක් ලෙස `romantic-birthday-videos`.

1. Media Library එකේ **Folders** view එක open කරන්න.
2. `romantic-birthday-videos` folder එක create කර ඒ folder එක open කරන්න.
3. ඉහළ දකුණු පැත්තේ **Upload** button එක click කරන්න.
4. **My Files** → **Browse** තෝරන්න, නැත්නම් files drag-and-drop කරන්න.
5. පහත files 7 upload කරන්න:

   - `1.mp4.mp4`
   - `2.mp4.mp4`
   - `3.mp4.mp4` — Free plan එකට 100 MB ට අඩු කළ copy එක
   - `4.mp4.mp4`
   - `5.mp4.mp4`
   - `6.mp4.mp4`
   - `our-video.mp4.mp4` — Free plan එකට 100 MB ට අඩු කළ copy එක

Cloudinary official guide එක අනුව Media Library එකට drag-and-drop හෝ Upload Widget දෙකෙන්ම files කිහිපයක් එකවර upload කරන්න පුළුවන්. [Uploading and storing assets](https://cloudinary.com/documentation/dam_upload_store_assets#upload_options)

## 4. එක් එක් video එකේ URL copy කරන්න

Upload එක complete වුණාට පසු එක් එක් video card එක සඳහා:

1. Video card එකේ **three-dots menu** එක click කරන්න.
2. **Copy URL** → **Original** තෝරන්න.
3. Copy වුණු URL එක `https://res.cloudinary.com/.../video/upload/...mp4` වගේ පේනවාද බලන්න.
4. URL එක temporary note එකක filename එකත් එක්ක save කරගන්න.

**Embed iframe code එක copy කරන්න එපා.** මේ project එකට අවශ්‍ය direct Original delivery URL එක පමණයි. Cloudinary එකේ Copy URL action එක video player customization නැති direct delivery URL එක දෙයි. [Copying a Cloudinary delivery URL](https://cloudinary.com/documentation/media_library_for_developers#common_viewing_actions)

## 5. URLs එකම config file එකට දාන්න

Project එකේ පහත file එක open කරන්න:

`assets/js/media-config.js`

`rawVideos` section එකේ `cloudinaryUrl` values පමණක් වෙනස් කරන්න. Filename mapping එක මෙන්න:

| Local source video | Config key | Paste කරන placeholder |
|---|---|---|
| `1.mp4.mp4` | `firstMeeting` | `PASTE_CLOUDINARY_VIDEO_URL_1_HERE` |
| `2.mp4.mp4` | `secondMeeting` | `PASTE_CLOUDINARY_VIDEO_URL_2_HERE` |
| `3.mp4.mp4` | `beachDay` | `PASTE_CLOUDINARY_VIDEO_URL_3_HERE` |
| `4.mp4.mp4` | `favoriteMoment` | `PASTE_CLOUDINARY_VIDEO_URL_4_HERE` |
| `5.mp4.mp4` | `fourthMeeting` | `PASTE_CLOUDINARY_VIDEO_URL_5_HERE` |
| `6.mp4.mp4` | `heartStealer` | `PASTE_CLOUDINARY_VIDEO_URL_6_HERE` |
| `our-video.mp4.mp4` | `livingMemories` | `PASTE_CLOUDINARY_VIDEO_URL_7_HERE` |

උදාහරණයක්:

```js
firstMeeting: {
  label: 'The Day We Met for the First Time',
  page: 3,
  cloudinaryUrl: 'https://res.cloudinary.com/YOUR_CLOUD/video/upload/v1234567890/romantic-birthday-videos/1.mp4',
  customPosterUrl: ''
}
```

වැදගත් නීති:

- URL එක quotes දෙක අතරම තබන්න.
- Comma එක අයින් කරන්න එපා.
- Cloudinary **API Key** හෝ **API Secret** මෙතැනට දාන්න එපා. මේ frontend එකට direct delivery URLs පමණක් අවශ්‍යයි.
- `f_auto,q_auto` manually URL එකට add කරන්න එපා. `optimizeCloudinaryVideoUrl()` helper එක ඒක ස්වයංක්‍රීයව add කරනවා.
- Poster එකත් code එකෙන් `so_0,f_auto,q_auto` transformation එක සහ `.jpg` extension එක භාවිතා කරලා හදනවා.
- වෙනම custom poster image එකක් අවශ්‍ය නම් එහි HTTPS URL එක `customPosterUrl` field එකට දාන්න.

Cloudinary delivery URL එකේ transformations `/video/upload/` පසු කොටසට යෙදෙන අතර `f_auto` සහ `q_auto` browser එකට ගැලපෙන format/quality delivery සඳහා භාවිතා වෙනවා. [Video transformation URL structure](https://cloudinary.com/documentation/video_manipulation_and_delivery#transformation_url_syntax), [Cloudinary video optimization](https://cloudinary.com/documentation/video_optimization)

## 6. Local test එක කරන්න

1. Project root එකේ dependencies install කරලා නැත්නම්:

   ```bash
   npm install
   ```

2. `.env.example` එක බලලා ignored `.env.local` file එකේ දැනට තිබුණු `VAULT_PUZZLE_ANSWER` සහ `SESSION_SECRET` values තබන්න.
3. Local server එක start කරන්න:

   ```bash
   npm run dev
   ```

4. Browser එකෙන් `http://127.0.0.1:3000` open කරන්න.
5. Love Vault unlock කරන්න.
6. පහත දේ පරීක්ෂා කරන්න:

   - Unlock කළ පසු background song එක පටන් ගන්නවාද; browser එක block කළොත් floating **Our Song** control එක tap කළාම play වෙනවාද.
   - Timeline එකට ගිය විට පළමු visible video poster එක පේනවාද.
   - Center play button, seek bar, time, mute සහ fullscreen controls වැඩ කරනවාද.
   - Video එක play කළ විට background song එක fade/pause වෙනවාද.
   - Video pause/end කළ විට background song එක කලින් play වෙමින් තිබුණා නම් නැවත fade-in වෙනවාද.
   - DevTools Network panel එකේ `assets/video/*.mp4` requests නැතිව `res.cloudinary.com` requests පමණක් එනවාද.

## 7. පළමු Cloudinary request එක warm කරන්න

Cloudinary transformation URL එක පළමු වතාවට open කළ විට derived optimized file එක on demand generate කර CDN cache කරනවා. ඒ නිසා production launch එකට කලින් video 7ම එක් වතාවක් play කර poster එකත් video එකත් load වෙනවාද බලන්න. ඊළඟ requests CDN cache එකෙන් වේගයෙන් ලැබෙනවා. [Cloudinary derived video behavior](https://cloudinary.com/documentation/video_manipulation_and_delivery#transformation_url_syntax)

## 8. GitHub වෙත commit සහ push කරන්න

Project root එකේ පහත commands එකින් එක run කරන්න:

```bash
git status
git add .
git status
git commit -m "Move birthday videos to Cloudinary CDN"
git push origin main
```

දෙවැනි `git status` එකෙන් commit වෙන්න යන files පරීක්ෂා කරන්න. `.env.local` පෙන්වන්න හෝ commit කරන්න එපා.

මේ update එකෙන්:

- local MP4 files 7ම current repository version එකෙන් ඉවත් වෙනවා;
- `.gitattributes` එකේ MP4 Git LFS tracking rule එක ඉවත් වෙනවා;
- `.gitignore` එක future `assets/video/*.mp4` files Git එකට වැරදීමෙන් add වීම වළක්වනවා.

මෙය current branch/deploy එකෙන් large files ඉවත් කරනවා, නමුත් පැරණි Git/LFS history ස්වයංක්‍රීයව rewrite කරන්නේ නැහැ. Beginner workflow එක සඳහා history rewrite කිරීම අවශ්‍ය නැහැ; `git lfs migrate` හෝ force-push commands නොකරන්න.

## 9. Vercel deploy එක බලන්න

GitHub repository එක Vercel project එකට connect කරලා තියෙනවා නම් සෑම push එකක්ම සාමාන්‍යයෙන් deployment එකක් trigger කරනවා. `main` production branch එක නම් successful build එක production domain එකට යයි. [Vercel Git deployments](https://vercel.com/docs/git)

1. Vercel Dashboard → project → **Deployments** open කරන්න.
2. අලුත් commit එකේ deployment එක **Ready** වෙනකම් ඉන්න.
3. Production URL එක open කර login, music, videos සහ mobile layout පරීක්ෂා කරන්න.
4. Vercel environment variables `VAULT_PUZZLE_ANSWER` සහ `SESSION_SECRET` තවම Production/Preview/Development සඳහා set වී තිබෙනවාද බලන්න.
5. Git LFS setting එක දැන් video delivery සඳහා අවශ්‍ය නැහැ; videos Cloudinary CDN එකෙන් සෘජුව load වෙනවා.

## 10. සාමාන්‍ය ගැටලු

### Video එකට “Cloudinary video ready to connect” පේනවා

අදාළ `cloudinaryUrl` field එකේ placeholder එක තවම තිබෙනවා. නිවැරදි `https://res.cloudinary.com/.../video/upload/...` URL එක paste කර save කරන්න.

### Upload එක 100 MB limit එකෙන් fail වෙනවා

Free plan එකේ file එක 100 MB ට අඩු කරලා නැවත upload කරන්න, නැත්නම් larger-file limit සහිත plan එකක් භාවිතා කරන්න.

### පළමු play එක ටිකක් ප්‍රමාදයි

Cloudinary පළමු optimized derivative එක generate කරමින් සිටිය හැක. Video එක එක් වතාවක් සම්පූර්ණයෙන් load කර production cache warm කරන්න.

### Music auto-start වෙන්නේ නැහැ

Unlock action එකෙන් app එක immediate playback attempt කරනවා. Browser policy එක navigation පසු autoplay block කළොත් header එකේ glowing **Our Song** control එක එක් වතාවක් tap කරන්න. එතැන් සිට video audio hand-off එක සාමාන්‍ය ලෙස ක්‍රියා කරයි.
