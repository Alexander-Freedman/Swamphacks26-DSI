# Paper-card input for the Mental Models Tool

Only matters if the Mental Models direction is picked with the paper-drawing input. Nothing is picked.

**Bottom line:** build the on-screen canvas first (~1h, ~100% reliable), then the paper path. Paper is ~10-13h total, not the 4h in feasibility.md, so it's the first cut if time is short.

# Paper input: marker cards, one drawn arrow, webcam read

Research notes for the "predict on paper" input. Read-only context: docs/feasibility.md (section B), docs/ideas.md (#2). Checked Oct 16, 2026. Anything marked *(our estimate)* is engineering judgment, not from a source.

## TL;DR / what we should do

1. **Analyze on a Python backend, not in the browser.** Use `opencv-contrib-python-headless` (one OpenCV wheel per venv) with `cv2.aruco.ArucoDetector`. The browser only streams video and sends a JPEG when the student taps "Read my card". Optionally it runs `js-aruco2` live so the UI can say "card locked" before the snap.
2. **Design the card so the vision problem is easy.** That matters more than any algorithm.
   - Print the 4 corner markers in black, from `DICT_4X4_50` or `ARUCO_MIP_36h12`.
   - Print **everything else in a light dropout colour** (light cyan/blue).
   - Print a **fixed start dot**, the object the arrow comes from.
   - Give the student a **thick black marker**.
   - Then "find the stroke" is just "dark pixels that aren't blue" inside a known box. "Direction" is start-dot → farthest stroke point, so we never need to detect the arrowhead.
3. **Always show a confirm screen** ("I read: 35° up-right, here's your arrow redrawn on the card, tap to fix"), with drag-to-fix. That one screen turns a 90% reader into a 100% demo.
4. **Fallback ladder:** paper+markers+CV → paper + Gemini JSON → draw on the phone/laptop canvas. The canvas is the only option that's 100% reliable, so build it first as the floor (about 1 h).

---

## 1. Implementation path: browser vs Python

### Python backend (recommended for the analysis)

- **Package:** `opencv-contrib-python-headless`. The latest on PyPI is 5.0.0.93 (Jul 2, 2026), with 4.14.0.94 also published Jul 28. **Pin 4.14.0.94** unless we've tested 5.0. The 5.x header listing no longer shows `aruco_detector.hpp` where it used to, so the 5.0 aruco layout may have moved; verify `cv2.aruco.ArucoDetector` exists after install ([PyPI](https://pypi.org/project/opencv-contrib-python/), [5.x dir listing](https://docs.opencv.org/5.x/dir_ce54f0d335b65079d3aced25a66762dc.html)). Feasibility.md says 5.0.0.93 has it; one `python -c "import cv2; cv2.aruco.ArucoDetector"` settles it.
- **Never install two OpenCV wheels in one env.** They share the `cv2` namespace and conflict, e.g. `opencv-python` pulled in by another dep plus contrib ([PyPI](https://pypi.org/project/opencv-contrib-python/), [forum](https://forum.opencv.org/t/aruco-module-gone-cant-access-it-or-its-functions/12588)).
- **API (4.7+).** Old tutorials (PyImageSearch, 2017 answers.opencv) use `Dictionary_get` / `DetectorParameters_create` / `cv2.aruco.detectMarkers`, and those **fail on 4.7+** ([forum](https://forum.opencv.org/t/from-class-arucodetector-detectmarkers-function-doesnt-work-properly/14809), [discuss.python.org](https://discuss.python.org/t/aruco-markers-not-working-attributeerror/25163)). Correct form:
  ```python
  d = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
  p = cv2.aruco.DetectorParameters()
  p.cornerRefinementMethod = cv2.aruco.CORNER_REFINE_SUBPIX
  det = cv2.aruco.ArucoDetector(d, p)
  corners, ids, rejected = det.detectMarkers(gray)
  ```
  You must call `detectMarkers` on an instance, not the class ([forum](https://forum.opencv.org/t/from-class-arucodetector-detectmarkers-function-doesnt-work-properly/14809)). The class also has `refineDetectedMarkers` and `detectMarkersMultiDict` ([Java docs 4.x](https://docs.opencv.org/4.x/javadoc/org/opencv/objdetect/ArucoDetector.html)).
- **Why Python:**
  - We can `cv2.imwrite` every intermediate (raw, rectified, mask, skeleton) for debugging at 3 AM.
  - Thinning (`cv2.ximgproc.thinning`) is in contrib.
  - `skimage.morphology.skeletonize` is there too.
  - Same code runs on saved test frames for the 50-frame protocol.
  - Latency: one 1280×720 frame through detect + warp + threshold + skeleton is tens of ms on a laptop CPU *(our estimate)*. The network round trip dominates.

### Browser options (for live "card locked" feedback, or if we must be backend-free)

| Option | Status | Gotchas |
|---|---|---|
| **`js-aruco2`** 2.0.0 (npm, pure JS) | Works. `new AR.Detector({dictionaryName:'ARUCO_MIP_36h12'})`, `detector.detect(imageData)` → `[{id, corners}]`; also `detectStreamInit/detectStream` for video. Supports ARUCO, ARUCO_MIP_36h12, plus AprilTag/ARTag/ChiliTags dictionaries in its `dictionaries/` folder ([GitHub](https://github.com/damianofalcioni/js-aruco2), [README](https://cdn.jsdelivr.net/npm/js-aruco2@2.0.0/README.md)) | Small project (86 stars, 4 open issues). Corner order isn't documented, so log it once. A tighter `maxHammingDistance` drops valid markers at low resolution. Custom dictionaries must be registered before the detector is built. **Pick this for the browser.** |
| **OpenCV.js** (`@techstark/opencv-js` 5.0.0-release.1, ~13 MB) | Has imgproc (`warpPerspective`, `adaptiveThreshold`, `findContours`), but **ArUco is not usable in practice**. The JS build exposes only whitelisted symbols, and people building 4.7 with contrib got `cv.aruco` undefined, or a build missing `Dictionary` / `DetectorParameters` ([OpenCV forum](https://forum.opencv.org/t/using-aruco-from-opencv-js/13277)). Only `QRCodeDetectorAruco` types ship in techstark (feasibility.md). | 13 MB download on expo Wi-Fi. Wait for `cv.onRuntimeInitialized`. Free every `cv.Mat` with `.delete()` or the tab leaks memory over a long demo. Fine to pair with js-aruco2 for the warp/threshold if we go all-browser. |
| **AprilTag WASM** (`conix-center/apriltag-js-standalone`) | Real AprilRobotics C library compiled with emscripten. Ships `apriltag_wasm.js/.wasm` plus a demo, tag36h11 only. **Not on npm, so you build or copy the files yourself** ([GitHub](https://github.com/conix-center/apriltag-js-standalone)). | Bigger integration cost. Only worth it if js-aruco2 fails the 50-frame test. |
| **`jsfeat`** 0.0.8 | Old (unmaintained). Has Canny, Homography2D + RANSAC, but **no adaptive threshold or warp_perspective** that I could find ([npm](https://npmjs.com/package/jsfeat)) | Skip. A 4-point homography is ~40 lines of JS, or use `homography.js` ([GitHub](https://github.com/eric-canas/homography.js)). |

### Camera gotchas (both paths)

- **HTTPS is mandatory off localhost.** `navigator.mediaDevices` is `undefined` in insecure contexts. The only exceptions are `https:`, `file:` and `localhost`, so `http://192.168.x.x:5173` on a phone gets no camera ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/navigator/mediaDevices.getUserMedia), [report](https://blog.devgenius.io/how-i-finally-got-my-microphone-working-on-a-non-secure-local-website-without-https-1208d7d684b3)).
  - Fixes: deploy to an HTTPS host, or use a cloudflared/ngrok HTTPS tunnel. One old comment says ngrok didn't work in Chrome ([webrtchacks](https://webrtchacks.com/chrome-secure-origin-https/)). Unverified, so **test the tunnel on the actual phone at hour 1**.
  - Laptop demo on `localhost` needs nothing.
- **iOS Safari:**
  - Without `playsinline` (plus `autoplay muted`) on the `<video>`, iOS shows only the first frame ([WebKit 260345](https://bugs.webkit.org/show_bug.cgi?id=260345), [valleyofcode](https://thevalleyofcode.com/lesson/media-webrtc/webrtc-ios-black-box/)).
  - A second `getUserMedia` call can black out the first stream, so use `track.applyConstraints` to change resolution instead ([WebKit 179363](https://bugs.webkit.org/show_bug.cgi?id=179363)).
  - Ask for `facingMode: {ideal: 'environment'}`, `width: {ideal: 1920}`.
- **Focus:** `focusMode` / manual focus constraints work on Chrome Android only, not desktop Chrome or iOS Safari ([Dynamsoft](https://www.dynamsoft.com/codepool/camera-focus-control-on-web.html), vendor page). `getCapabilities()` is Baseline 2024 ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/getCapabilities)).
  - So we can't force focus. Instead, **pick the sharpest of the last ~10 frames**: variance of Laplacian on the rectified card, plus all 4 markers found. Don't trust one snap.
  - Laptop webcams are usually fixed-focus at arm's length. Hold the card 30–50 cm away, not 10 cm.
- **Hand occlusion:** markers vanish when the student's hand is over a corner. Keep the last good homography for ~0.5 s. With ≥3 markers, solve the homography from all visible marker corners (12+ points) with `cv2.findHomography(..., cv2.RANSAC)`, not just 4 outer corners *(our estimate)*.

## 2. Markers: dictionary, size, glare, low light

- **Dictionary:** we need 4 IDs (maybe ×N cards to also encode *which scenario*: card k uses IDs 4k..4k+3, which gives free scenario recognition).
  - Small dictionaries are more robust, and fewer bits means bigger cells at the same print size.
  - `DICT_4X4_50` gives the biggest cells per cm. `ARUCO_MIP_36h12` is what the ArUco authors label "recommended" for size vs robustness, and it's in OpenCV as `DICT_ARUCO_MIP_36h12` and in js-aruco2 as the default ([ROS aruco docs](https://docs.ros.org/en/api/aruco/html/dictionary_8h_source.html), [OpenCV dict header](https://docs.opencv.org/4.x/d1/d21/aruco__dictionary_8hpp.html)).
  - **Pick ARUCO_MIP_36h12 if we use js-aruco2 in the browser**, since it's the same dictionary on both sides. `DICT_4X4_50` is fine for Python-only.
- **Avoid low-Hamming families like AprilTag 16h5:** 44% precision in one evaluation, ~77% recall in another. tag36h11 / 36h12-class families hit ~100% recall at 99.99% precision in TopoTag's benchmark ([ChromaTag arXiv 1708.02982](https://arxiv.org/pdf/1708.02982), [TopoTag arXiv 1908.01450](https://arxiv.org/pdf/1908.01450), [OpenMV](https://docs.openmv.io/_sources/openmvcam/tutorial/image/decoding/qr-apriltag.rst.txt)). False positives also matter because a busy expo background (posters, laptops) is in frame. **Require exactly our 4 IDs, in plausible geometry** (convex quad, sane aspect ratio) before accepting.
- **Size:** classical ArUco degrades with small markers, blur and dim light. In one study, 6 cm markers at 1 m went from a 0.72 detection rate at 15 lux to 0.06 at ≤5 lux ([iMarkers arXiv 2501.15505](https://arxiv.org/pdf/2501.15505), [DeepArUco](https://investigacion.ujaen.es/documentos/64be332b3bbfc602eae597db)). We're at 30–50 cm, not 1 m, so on a letter-size card:
  - **use 3.5–4 cm markers** (each module ≈ 6 mm at 36h12) *(our estimate)*;
  - **keep a white quiet zone of at least one module around each marker**. Missing quiet zone and tape over the marker are classic "some markers ignored" causes ([MathWorks](https://www.mathworks.com/help/vision/ref/generatearucomarker.html), [OpenCV forum](https://forum.opencv.org/t/some-markers-are-ignored-while-others-are-read/11775)).
- **Glare:**
  - **Do not laminate or use glossy stock.** A specular blob over a marker wipes out bits.
  - Print on matte paper. If we want reusable cards, use matte sheet protectors or just reprint. Card stock is cheap.
  - Tilt the card 10–20° so overhead lights don't reflect straight into the lens.
  - I found no study isolating lamination. This is standard practice *(our estimate)*.
- **Low light / exposure:** turn on `adaptiveThreshWinSizeMin/Max/Step` sweeping (the default does), and CORNER_REFINE_SUBPIX for a stable homography. If the expo table is dim, a $0 fix is the phone flashlight of a second phone, or a USB desk lamp from the hardware desk. Put it in the demo kit.
- **Detection-rate bar:** feasibility.md already says to run the js-aruco2 webcam demo in the real room and log 50 frames, and drop freehand if <90%.

## 3. Stroke extraction after rectification

**Design first (removes most of the CV risk):**
- **Dropout ink.** Print the scenario art (ramp, ball, axes, labels) in light cyan/blue, and have students draw with a black marker. Forms-processing systems use dropout colour for exactly this. After rectification, `stroke = (V < ~100) & (S < ~80)` in HSV, i.e. dark and unsaturated, and the blue art disappears.
  - If the art must be black, use **template subtraction**: warp the frame to the template's pixel grid, normalise both, `absdiff`, dilate the template mask by a few px, and ignore it *(our estimate)*.
- **Drawing zone.** Only look inside a printed dashed box. Everything else (fingers, marker cap, shadows at the edge) is ignored.
- **Fixed start point.** The printed object, e.g. "the ball", is where the arrow starts, so direction is start → far end. **No arrowhead detection needed**, which is the hardest part to get robust. Tell students "draw the arrow starting from the ball"; the arrowhead is decorative.

**Pipeline (Python, on the rectified card, e.g. 1100×850 px ≈ 4 px/mm):**
1. `warpPerspective` with a homography built from marker corners (16 points, RANSAC).
2. **Illumination flattening:** `bg = cv2.morphologyEx(gray, MORPH_CLOSE, 25×25 ellipse)` (or medianBlur 31), then `norm = gray / bg * 255`. That divides out shadows and lamp gradients. Then `cv2.adaptiveThreshold(norm, 255, ADAPTIVE_THRESH_GAUSSIAN_C, THRESH_BINARY_INV, blockSize=31, C=10)`. Adaptive thresholding is the standard answer to uneven document lighting ([overview](https://medium.com/@amit25173/opencv-adaptive-threshold-fae667b91984)). The background-divide step is our addition *(our estimate)*. AND it with the dropout-colour mask.
3. **Clean-up:** `MORPH_OPEN` 3×3 removes speckle. Keep the largest connected component(s) by area above a minimum (e.g. 300 px). Hand shadows are soft, so they mostly don't pass the threshold after the background divide.
4. **Thin:** use `cv2.ximgproc.thinning(mask, thinningType=THINNING_GUOHALL)`. Guo-Hall gives fewer spurious branches than Zhang-Suen. Zhang-Suen (also `skimage.morphology.skeletonize`) is noise-sensitive and spurs need hand-written pruning ([skimage source](https://gitverse.ru/valemobil/scikit-image/content/main/skimage/morphology/_skeletonize_various_cy.pyx), [Scilab thin docs](https://siptoolbox.sourceforge.net/doc/sip-0.7.0-reference/thin.html), [ComfyUI node](https://comfy.icu/node/cv2_ximgproc_thinning)). Prune branches shorter than ~15 px from endpoints. Thick-marker arrowheads skeletonise into a "Y", and pruning removes the barbs.
5. **Direction and endpoint:**
   - **Start-dot design:** the endpoint is the skeleton pixel farthest (geodesic, or plain Euclidean) from the printed start point. The direction is `atan2` of endpoint − start, or better, the PCA of skeleton points in the last 40% of the path (`cv2.PCACompute2`), signed toward the endpoint. Report angle and length.
   - **Free-placed arrow (no start dot):**
     - Use PCA of all stroke pixels for the axis.
     - For the sign, the arrowhead end has more ink mass and more width across the axis. Compare stroke-pixel counts in the first vs last 20% along the principal axis; the heavier end is the head *(our estimate)*.
     - Alternative: the tip is the shaft endpoint closest to the short barb paths ([US10157311 "Detecting arrows within images"](https://patents.google.com/patent/US10157311)).
     - Or use convexity defects: an arrowhead's hull has two deep defects at the barbs ([KC et al., arrowhead detection](https://lhncbc.nlm.nih.gov/LHC-publications/pubs/Arrowheaddetectioninbiomedicalimages.html)), and a triangle test of the hull area ratio (patent [US7324691](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/7324691)).
     - All of this is more fragile. **Prefer the start dot.**
   - **Curves (predicted path):** order the skeleton pixels into a polyline by walking from the endpoint nearest the start, then `cv2.approxPolyDP` or resample to N=32 points. Compare to the simulated path with mean distance / Fréchet in card mm.
   - **Hough (`HoughLinesP`)** is fine for a straight shaft, but it returns several segments per thick stroke. PCA on skeleton points is simpler and more stable.
6. **Expected accuracy** *(our estimate, no published number for this exact setup)*:
   - Homography from 16 subpixel corners: ≲1–2 mm card error.
   - Direction of a ≥4 cm stroke with the start-dot design: within about ±3–5°.
   - Endpoint: ±2–3 mm.
   - A physics misconception check needs only coarse bins (8 directions = 45° wide), so the margin is huge.
   - The real failure modes are not precision. They are: no detection (glare/blur), stray marks (student wrote their name in the box), and multiple strokes. The confirm screen covers all three.

## 4. Alternatives and fallbacks

| Path | Latency | Accuracy | Reliability at expo | Notes |
|---|---|---|---|---|
| Paper + markers + classical CV (above) | ~0.1 s local, + upload ~0.3 s *(est.)* | ±3–5° | Medium-high with design rules, but lighting-dependent | Most impressive ("draw on real paper") |
| Paper + **Gemini vision JSON** | ~2–5 s (feasibility.md) | Coarse. Boxes/points come back as `box_2d [ymin,xmin,ymax,xmax]` and `[y,x]` points normalised 0–1000 ([Gemini image understanding](https://ai.google.dev/gemini-api/docs/image-understanding), [bbox eval](https://simedw.com/2025/07/10/gemini-bounding-boxes/)) | Handles messy drawings, no markers needed; network-dependent | Send the **already rectified** card (if markers found), or the raw photo if not. Use `response_mime_type="application/json"` + `response_json_schema` with an `enum` of 8 directions + `{start:[y,x], end:[y,x], kind: straight\|curve}`. Set `thinking_level: low` and `media_resolution` low/medium (280/560 image tokens vs 1120 default) for speed ([Gemini 3 guide](https://ai.google.dev/gemini-api/docs/generate-content/gemini-3), [Vertex](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/start/get-started-with-gemini-3)). Ask for the 8-way bin, not degrees: that's what it's good at. Package `google-genai` 2.31.0 (feasibility.md). |
| **Draw on phone/tablet/laptop canvas** | ~0 ms | Exact | ~100% | Pointer Events on a `<canvas>` showing the card image. Optional `perfect-freehand` (1.2.x) for nice ink with pen pressure ([README](https://cdn.jsdelivr.net/npm/perfect-freehand@1.2.3/README.md)). Set `touch-action: none` on the canvas or the page scrolls. Loses the "real paper" wow, but it's the demo-day floor. |
| Hybrid | — | — | — | Paper CV first. If <4 markers or no stroke is found, auto-send to Gemini. In all cases show the confirm screen with a draggable arrow, which doubles as canvas input. |

Judge-facing angle: classical CV + confirm is explainable ("homography, dropout ink, skeleton"). Gemini is a fallback for messy curves, not the main path. That also keeps latency under a second for the common case.

## 5. 50-frame test protocol

**Setup:**
- Print 3 cards: matte, markers 4 cm, 36h12 IDs 0–3 / 4–7 / 8–11.
- Draw 10 known arrows across them with the real thick marker: angles 0, 45, 90, 135, 180, 225, 270, 315 + 2 curves.
- Mark the true endpoint with a ruler, so ground truth is angle ±1° and endpoint in mm.
- Use a script that grabs frames from the webcam (or the phone page's upload) and saves `frame_###.jpg` + the condition label. Run the pipeline offline on the folder so failures can be re-run.

**50 frames, 10 per condition:**

| # | Condition |
|---|---|
| A | Good light, card flat, 40 cm, head-on |
| B | Tilted 30–40° (perspective), 30–60 cm distance |
| C | Glare: overhead light reflecting (tilt to catch it), plus one frame with phone flash |
| D | Dim (one light off / lights dimmed ~ under 50 lux, check with a phone lux app) + hand shadow across the card |
| E | Clutter and motion: busy background, card hand-held with slight motion, a finger partially over one marker, one card with stray scribble/name in the zone |

Do it **in the hacking room at hour 1–2 and again at a table that matches the judging area** (feasibility.md risk #4).

**Log per frame:** markers found (0–4), homography accepted (y/n), stroke found (y/n), angle error (°), endpoint error (mm), 8-way bin correct (y/n), time (ms).

**Pass criteria (go/no-go for paper input):**
- Card lock (homography accepted) ≥ 90% overall, and ≥ 8/10 in each of C and D. This matches feasibility.md's 90% bar.
- 8-way direction bin correct ≥ 95% of locked frames; median angle error ≤ 5°; p90 ≤ 10°.
- Endpoint error median ≤ 4 mm.
- Zero false locks: never accept a homography from background junk.
- End-to-end snap → result ≤ 1 s on the laptop (backend path).
- Best-of-10-frames mode: the "Read my card" button must succeed on the first press in ≥ 19/20 tries in condition A/B.

**Fail actions:**
- Lock < 90%: bigger markers, check the quiet zone, add a lamp, try AprilTag WASM.
- Bin < 95%: switch to the start-dot card if not already, tighten the drawing zone.
- Still failing: move down the fallback ladder.

## 6. Hour estimates and fallback ladder

*(our estimates, one person, assumes laptop + FastAPI already exist)*

| Component | Hours | Risk |
|---|---|---|
| Card design: SVG/PDF template with 4 markers, dropout-colour art, start dot, drawing box, scenario ID encoding; print 5 test copies | 1.5 | Low |
| Camera page: getUserMedia, `playsinline`, HTTPS tunnel/deploy, best-of-N sharpness frame picker, upload JPEG | 1.5 | Med (iOS/HTTPS) |
| Optional live lock overlay with js-aruco2 in the browser | 1 | Low |
| Python: ArucoDetector + id/geometry check + RANSAC homography + warp | 1.5 | Low |
| Python: illumination flatten + threshold + dropout mask + components + thinning + prune | 2 | Med |
| Direction/endpoint (start-dot PCA) + curve polyline resample | 1.5 | Low-Med |
| Confirm screen (redraw arrow on card image, drag to fix) — **also serves as the canvas fallback** | 1.5 | Low |
| 50-frame capture script + offline eval + tuning, done twice (room + judging table) | 2 | — |
| Gemini JSON fallback endpoint | 1 | Low |
| **Total** | **~13 h** (≈10 h without the browser overlay and Gemini) | |

Feasibility.md budgeted 4 h for "sketch capture (markers)". That's realistic only for markers + homography + a crude threshold. The full robust version above is ~10 h, so treat the input as the item to cut if time is short.

**Fallback ladder (top = best demo, bottom = guaranteed):**
1. Paper card + markers + classical CV + confirm screen. Live "card locked" overlay, <1 s.
2. Same, but with "hold still, reading…" best-of-N frame capture and a desk lamp in the demo kit.
3. Paper card + markers for rectification only, with the rectified image sent to Gemini JSON for the arrow (2–5 s), plus the confirm screen.
4. Photo upload (no live video, uses the phone's native camera app with autofocus) → same pipeline. This fixes iOS/focus issues.
5. Draw the arrow on the on-screen card (canvas/Pointer Events). Keep paper cards on the table as the "real classroom version" prop.

Build order to stay safe: 5 → 1 (core) → 4 → 3. The canvas exists from hour ~3, so the demo never depends on the camera.

---

## Gaps / not verified

- Whether `cv2.aruco.ArucoDetector` is unchanged in opencv-contrib 5.0.0.93. Pin 4.14.0.94 or check on install.
- Whether the cloudflared/ngrok HTTPS URL gets camera access on the phone. One old comment says no for ngrok/Chrome; test early.
- No published accuracy figure for hand-drawn arrow direction on rectified cards. The accuracy numbers above are estimates; the 50-frame test is what decides.
- No source isolates glossy/laminated vs matte for ArUco. The matte advice is practice, not a measured result.
