from ultralytics import YOLO
from typing import List, Dict
import numpy as np

"""
Short version:
- This model detects items on an outfit image using the YOLO model. 
- The model ignores any clothes that it cannot confidently recognizes. 
- The current threshold is 40% (0.4).
- If you want to change the confidence level, go to line 17 and change the 
parameter.
"""


def detect_garments(
    image: np.ndarray,  # Converts the image into numbers and read the pixels
    model: YOLO,
    # Model confidence level
    conf_threshold: float = 0.4,  # CHANGE HERE
) -> List[Dict]:
    """
    Runs object detection on a single outfit image and returns structured
    garment detections.

    This function performs three steps:
    1. Runs the YOLO model on a single image.
    2. Iterates over all detected objects in that image.
    3. Converts raw model outputs (tensors) into clean Python dictionaries
       that the application can store or display.

    Args:
        image:
            A single image represented as a NumPy array in HxWxC format
            (height, width, color channels). This is typically loaded using
            OpenCV or PIL and converted to RGB.

        model:
            A pre-loaded YOLO model instance (e.g., YOLOv8) that has been
            trained or fine-tuned to recognize clothing-related classes.

        conf_threshold:
            Minimum confidence score required for a detection to be included.
            Detections below this threshold are ignored to reduce noise.

    Returns:
        A list of dictionaries, where each dictionary represents one detected
        garment item in the image. Each dictionary contains:
            - class_id: Integer ID of the predicted class.
            - class_name: Human-readable label (e.g., "shirt", "pants").
            - confidence: Model confidence score (0.0–1.0).
            - bbox: Bounding box coordinates [x1, y1, x2, y2] in pixels.

        If no garments are detected, the function returns an empty list.

    Example:
        >>> detections = detect_garments(image, model)
        >>> detections[0]["class_name"]
        'shirt'
    """

    detections: List[Dict] = []

    # Run inference. YOLO always returns a list of results,
    # even if we pass in only one image.
    results = model(image)

    # Each result corresponds to one image in the input batch.
    for result in results:

        # result.boxes contains all detected objects in this image.
        for box in result.boxes:
            # Extract the predicted class index (e.g., 0 = shirt).
            class_id = int(box.cls[0])

            # Extract the model's confidence score for this detection.
            confidence = float(box.conf[0])

            # Skip low-confidence detections.
            if confidence < conf_threshold:
                continue

            # Extract bounding box coordinates in pixel space.
            # Format: (x1, y1) = top-left, (x2, y2) = bottom-right.
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            detections.append(
                {
                    # ID of the predicted class
                    "class_id": class_id,
                    "class_name": model.names[class_id],
                    # confidence level (more than 40%)
                    "confidence": round(confidence, 3),
                    "bbox": [x1, y1, x2, y2],  # bounding box
                }
            )

    return detections
