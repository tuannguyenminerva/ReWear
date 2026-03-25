# PR: Connect Camera Module to Real-Time Object Detection (add-vision-model)

## Overview

This PR replaces the placeholder/simulated clothing detection in the Camera page with a real computer vision pipeline. Previously, the app was randomly picking items from the wardrobe to "pretend" it detected them. Now it runs an actual YOLO-based object detection model on live webcam frames and uploaded photos, identifies clothing items, detects their dominant colour, and returns structured results that plug directly into the existing UI.

---

## Files Changed

| File | Type | What changed |
|---|---|---|
| `rewear_app/detector.py` | **New file** | The entire CV/ML detection module |
| `rewear_app/app.py` | Modified | Added `/api/detect` endpoint + CORS headers + port fix |
| `pages/CameraView.tsx` | Modified | Replaced simulation with real API calls + UI improvements |
| `requirements.txt` | Modified | Added CV dependencies |

---

## New File: `rewear_app/detector.py`

This is the core of the PR — a self-contained Python module that handles everything related to clothing detection.

### Model loading (`load_model`)

```python
def load_model() -> YOLO:
```

Loads the detection model once and caches it in memory so it doesn't reload on every request (which would be very slow). It tries two models in order:

1. **DeepFashion2 YOLOv8s-seg** — downloaded automatically from HuggingFace (`Bingsu/adetailer`). This is a model specifically trained on fashion/clothing images, so it knows what a shirt, skirt, trousers, etc. look like.
2. **YOLOv8n (COCO fallback)** — if the fashion model can't be downloaded (e.g. no internet), it falls back to the standard general-purpose YOLO model. This one doesn't recognise clothing categories directly, so the code uses a smart fallback (see below).

### Colour detection (`get_dominant_color`)

```python
def get_dominant_color(image_crop: np.ndarray) -> str:
```

Takes the cropped region of a detected item and figures out its dominant colour using **K-Means clustering**:
1. Reshapes the image pixels into a flat list of RGB values
2. Runs K-Means with 3 clusters to group similar colours together
3. Picks the largest cluster (most pixels) as the dominant colour
4. Finds the closest named colour from a predefined dictionary (Red, Blue, Black, White, Gray, etc.) using Euclidean distance in RGB space

This is why detections come back as "Blue Top" or "Black Bottom" rather than just "Top".

### COCO fallback logic (`_coco_detections`)

```python
def _coco_detections(image_rgb, results, today) -> list:
```

The standard COCO model doesn't have classes like "shirt" or "trousers" — it only detects "person", "backpack", "handbag", "tie", etc. So when falling back to COCO, the code does something smarter:

- If a **"person"** is detected: split their bounding box into a **top 55% region** (shirt/jacket area) and a **bottom 45% region** (trousers/skirt area), run colour detection on each half, and return them as separate "Top" and "Bottom" items.
- If a **"backpack"**, **"handbag"**, **"tie"**, etc. is detected: return it directly as an "Accessory".

This means even with the fallback model, you get useful per-region detections rather than nothing.

### Main detection function (`detect_clothing`)

```python
def detect_clothing(image_rgb: np.ndarray, conf_threshold: float = 0.25) -> list:
```

The function the Flask endpoint calls. It:
1. Calls `load_model()` to get the cached model
2. Runs the model on the image with confidence filtering (only detections above 25% confidence are kept)
3. Routes to either the fashion model path or COCO fallback path depending on which model loaded
4. For each detected item: extracts the bounding box, crops that region, runs colour detection, and encodes the crop as a **base64 JPEG** so the frontend can display it as a thumbnail
5. Returns a list of dicts that exactly match the frontend's `ClothingItem` interface shape

Each returned item contains:
```json
{
  "id": "det-a3f9c1b2",
  "name": "Blue Top",
  "category": "Top",
  "color": "Blue",
  "confidence": 0.612,
  "bbox": [120, 45, 380, 290],
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "wearCount": 0,
  "lastWorn": "2026-03-14",
  "addedDate": "2026-03-14"
}
```

The `image` field is the actual cropped photo of the detected item, shown in the right panel of the Camera view.

---

## Modified: `rewear_app/app.py`

### New endpoint: `POST /api/detect`

```python
@app.route("/api/detect", methods=["POST", "OPTIONS"])
def detect():
```

Accepts a JSON body with a base64-encoded image:
```json
{ "image": "data:image/jpeg;base64,/9j/4AAQ..." }
```

Steps:
1. Strips the `data:image/jpeg;base64,` prefix if present (browsers include this automatically)
2. Decodes the base64 string into raw bytes
3. Uses OpenCV (`cv2.imdecode`) to turn the bytes into a numpy array
4. Converts from BGR (OpenCV default) to RGB (what the model expects)
5. Calls `detect_clothing()` and returns the results as JSON
6. Returns a proper error message (not a crash) if anything goes wrong

### CORS headers

```python
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    ...
```

The React frontend runs on `localhost:5173` (Vite dev server) while Flask runs on `localhost:5001`. Browsers block cross-origin requests by default — CORS headers tell the browser it's safe to communicate between the two ports. Without this, every fetch call from the frontend would be silently blocked.

The `OPTIONS` method handling on the endpoint is for **CORS preflight** — browsers automatically send an `OPTIONS` request before any POST to check permissions. The endpoint returns 204 (no content) immediately so the browser proceeds with the real request.

### Port changed from 5000 → 5001

```python
app.run(debug=True, port=5001)
```

On macOS Monterey and later, port 5000 is reserved by the AirPlay Receiver system service, which causes a "403 Access Denied" error when trying to run Flask on that port. Moved to 5001 to avoid the conflict.

---

## Modified: `pages/CameraView.tsx`

### New state variables

```typescript
const canvasRef = useRef<HTMLCanvasElement>(null);
const [apiError, setApiError] = useState<string | null>(null);
const [noDetectionMsg, setNoDetectionMsg] = useState(false);
```

- `canvasRef` — points to a hidden `<canvas>` element used to capture frames from the live video stream
- `apiError` — stores an error message if the Flask server is unreachable or returns an error; shown as a red banner over the camera feed
- `noDetectionMsg` — a temporary flag shown when the model runs but finds nothing ("No clothing detected — try moving closer or adjusting lighting"), auto-dismisses after 3 seconds

### `captureVideoFrame()`

```typescript
const captureVideoFrame = (): string | null => {
```

Captures the current frame from the live webcam as a base64 JPEG:
1. Gets the current video dimensions
2. Sets the hidden canvas to match those dimensions
3. Applies a horizontal mirror transform (to match the `scale-x-[-1]` CSS applied to the video element, so the captured image is not flipped)
4. Draws the video frame onto the canvas
5. Returns `canvas.toDataURL("image/jpeg", 0.8)` — a base64 string ready to send to the API

### `runDetection(imageB64)`

```typescript
const runDetection = async (imageB64: string) => {
```

Replaces the old simulation. POSTs the base64 image to `/api/detect` and:
- Sets `isDetecting = true` while waiting (triggers the scanning overlay animation)
- On success with detections: updates `detectedItems` state with the real results
- On success with zero detections: shows the "No clothing detected" toast for 3 seconds
- On HTTP error: shows the error code in the red banner
- On network error (server not running): shows "Can't reach Flask server — make sure it's running on port 5001"
- Always sets `isDetecting = false` when done (clears the scanning animation)

### Replaced simulation with real detection interval

**Before:**
```typescript
// Randomly pick 2–4 items from wardrobe every 4 seconds
const shuffled = [...wardrobe].sort(() => 0.5 - Math.random());
setDetectedItems(shuffled.slice(0, count));
```

**After:**
```typescript
// First scan 1.5s after camera starts
const firstScan = setTimeout(() => {
  const frameB64 = captureVideoFrame();
  if (frameB64) runDetection(frameB64);
}, 1500);

// Then every 5 seconds
const detectionInterval = setInterval(() => {
  const frameB64 = captureVideoFrame();
  if (frameB64) runDetection(frameB64);
}, 5000);
```

Key differences from the old simulation:
- The first scan fires 1.5 seconds after the camera starts (not after the first 5-second wait)
- The interval pauses automatically when an uploaded image is showing (no point scanning the webcam if the user uploaded a photo)
- Both the timeout and interval are properly cleaned up when the component unmounts

### File upload now calls the real API

**Before:**
```typescript
// Simulated: pick random wardrobe items after 1.5s fake delay
setTimeout(() => {
  const shuffled = [...wardrobe].sort(() => 0.5 - Math.random());
  setDetectedItems(shuffled.slice(0, count));
}, 1500);
```

**After:**
```typescript
// Real: read the file as base64 and send to detection API
const reader = new FileReader();
reader.onload = () => {
  const b64 = reader.result as string;
  runDetection(b64);
};
reader.readAsDataURL(file);
```

The `FileReader` API converts the local file to a base64 data-URL without uploading it to any server first. The base64 string is then sent directly to the local Flask API.

### Added "Scan Now" button

A manual trigger button is shown in the hover overlay at the bottom of the camera feed. Useful when you want to force a scan without waiting for the 5-second interval. While a scan is running, the button shows a spinning icon and "Scanning…" label and is disabled to prevent duplicate requests.

### Fixed bounding box label positions

**Before:** Used `Math.random()` to position the labels, which caused them to jump to random new positions on every React re-render.

**After:** Uses a deterministic formula based on the item's index:
```typescript
const top  = 15 + (idx * 18) % 55;
const left = 10 + (idx * 22) % 50;
```

Labels now stay in stable positions.

### Hidden canvas element

```tsx
<canvas ref={canvasRef} className="hidden" />
```

Added to the JSX at the bottom of the component. This is the off-screen canvas used by `captureVideoFrame()`. It's invisible to the user — just a technical requirement for reading pixel data from the video stream.

---

## Modified: `requirements.txt`

Added the four Python packages needed by `detector.py`:

```
ultralytics      # YOLO model loading and inference
opencv-python    # Image decoding (cv2.imdecode) and colour space conversion
numpy            # Array operations on image data
scikit-learn     # KMeans clustering for colour detection
```

**Note on versions:** `ultralytics` (and `opencv-python 4.13+`) require `numpy >= 2.0`, but other Anaconda packages (`pyarrow`, older `pandas`) were compiled against `numpy 1.x`. To resolve the binary incompatibility:
- Pin `numpy < 2` → install `opencv-python==4.8.1.78` (last version supporting numpy 1.x)
- Upgrade `scikit-learn` and `pandas` to versions that support numpy 1.26

Install everything with: `pip install -r requirements.txt`

---

## How to Run

Two terminal windows, both must be running at the same time:

**Terminal 1 — Backend:**
```bash
cd rewear_app
python app.py
# Should print: Running on http://127.0.0.1:5001
```

**Terminal 2 — Frontend:**
```bash
npm install   # first time only
npm run dev
# Open http://localhost:5173
```

Navigate to the **Camera** page. The app will:
1. Start the webcam
2. Automatically scan for clothing after ~1.5 seconds
3. Re-scan every 5 seconds
4. Show detected items with their crop image, name, and category in the right panel

Hover over the camera to reveal the **Scan Now** and **Upload Photo** buttons.
