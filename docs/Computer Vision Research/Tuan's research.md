# Computer vision research
Tuan Nguyen

# Key constraints in considerations for users: 
- Logging clothes must be fast - around 10 seconds
- Manual correction is a normal and expected part of the flow
- No third-party APIs that require user registration
- System should improve gradually with repeated usage
- Web-first experience, then optimize for mobile phones
- AI suggestions must be fast and predictable

Important design considerations:
- Low latency
- User control
- Ability to rename clothing

## Comparison of Computer Vision Approaches

| Approach | Main Job in the App | What It Does | Strengths | Limitations | Fit |
|--------|---------------------|----------------------------------|-----------|-------------|----------------|
| Image classification | Guess clothing type | Looks at the whole photo and guesses general clothing types (e.g., shirt, pants) | Very fast; simple models; easy to deploy | Cannot find individual items; no idea where items are; cannot track specific pieces | Low – only useful for rough hints |
| Object detection | Find clothing items | Finds where each piece of clothing is in the photo and separates them | Handles multiple items; enables cropping; mature tooling | Boxes are rough; labels are generic; not item-specific | High – good first step for MVP |
| Instance segmentation | Trace exact clothing shapes | Draws precise outlines around each clothing item | Accurate shapes; handles overlapping clothes well | Slower; heavier models; more complex | Medium – useful later, not required for MVP |
| Embedding-based matching | Recognize repeated items | Compares how clothes look to decide if it’s the same item as before | Tracks items over time; improves with use; flexible | Needs tuning; can confuse similar items | High – core to usage tracking |
| On-device ML | Run AI on the phone | Processes images directly on the user’s device | Fast; private; works offline | Limited compute; small models only | Medium–High – preferred when feasible |
| Local server ML | Run AI on a server | Sends images to a server for processing | Supports stronger models; stable performance | Needs internet; higher latency | Medium – acceptable fallback or hybrid |

## Model options

Latency values are approximate. Assumptions:
- mobile: modern mid-to-high range smartphone (CPU / mobile GPU)
- server: single consumer GPU or optimized CPU
Actual performance will vary depending on optimization and image resolution.

---

### Object Detection Models

| Model | Primary Use | Strengths for Clothing | Limitations | Hardware | Expected Latency | Expected Accuracy | Documentation |
|-----|------------|-----------------------|-------------|----------|------------------|-------------------|---------------|
| YOLOv5n | Garment detection | Very fast; small model; good for multiple items | Coarse boxes; generic labels | Mobile / Server | ~20–40 ms (mobile) | Moderate | https://github.com/ultralytics/yolov5 |
| YOLOv8n | Garment detection | Better accuracy than v5n; modern architecture | Slightly heavier than v5n | Mobile / Server | ~25–50 ms (mobile) | Moderate–Good | https://docs.ultralytics.com/models/yolov8/ |
| EfficientDet-Lite0 | Garment detection | Designed for mobile; stable inference | Lower recall for small items | Mobile | ~30–60 ms (mobile) | Moderate | https://ai.google.dev/edge/litert/libraries/modify/object_detection |

---

### Image Classification Models

| Model | Primary Use | Strengths for Clothing | Limitations | Hardware | Expected Latency | Expected Accuracy | Documentation |
|-----|------------|-----------------------|-------------|----------|------------------|-------------------|---------------|
| MobileNetV2 | Clothing category hints | Very lightweight; fast | No localization; weak for identity | Mobile | ~10–20 ms | Low–Moderate | https://arxiv.org/abs/1801.04381 |
| EfficientNet-Lite0 | Clothing category hints | Better accuracy than MobileNet | Still image-level only | Mobile | ~15–30 ms | Moderate | https://blog.tensorflow.org/2020/03/higher-accuracy-on-vision-models-with-efficientnet-lite.html |

---

### Embedding / Feature Matching Models

| Model | Primary Use | Strengths for Clothing | Limitations | Hardware | Expected Latency | Expected Accuracy | Documentation |
|-----|------------|-----------------------|-------------|----------|------------------|-------------------|---------------|
| CLIP (ViT-B/32) | Item similarity | Strong general embeddings; flexible | Heavy for mobile; generic fashion knowledge | Server | ~80–150 ms | Good (generic) | https://github.com/openai/CLIP |
| OpenCLIP (small variants) | Item similarity | Open-source; configurable size | Needs tuning for fashion | Mobile / Server | ~40–80 ms | Moderate–Good | https://github.com/mlfoundations/open_clip |
| ResNet50 (fine-tuned) | Item similarity | Good visual consistency; smaller than CLIP | Needs training data | Mobile / Server | ~25–50 ms | Good (domain-tuned) | https://pytorch.org/vision/stable/models.html |

---

### Instance Segmentation Models

| Model | Primary Use | Strengths for Clothing | Limitations | Hardware | Expected Latency | Expected Accuracy | Documentation |
|-----|------------|-----------------------|-------------|----------|------------------|-------------------|---------------|
| SAM (ViT-H) | Precise masks | Excellent segmentation quality | Very heavy; server-only | Server (GPU) | 300+ ms | High | https://github.com/facebookresearch/segment-anything |
| MobileSAM | Lightweight segmentation | Much faster than SAM; usable on device | Lower mask precision | High-end mobile / Server | ~60–120 ms | Moderate–Good | https://github.com/ChaoningZhang/MobileSAM |