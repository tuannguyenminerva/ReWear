import cv2
import numpy as np
from ultralytics import YOLO
from sklearn.cluster import KMeans

# 1. Define a helper function to name the color
def get_color_name(rgb_tuple):
    # A basic dictionary of RGB values for standard colors
    colors = {
        "Red": (255, 0, 0), "Green": (0, 255, 0), "Blue": (0, 0, 255),
        "Black": (0, 0, 0), "White": (255, 255, 255), "Yellow": (255, 255, 0),
        "Purple": (128, 0, 128), "Orange": (255, 165, 0), "Gray": (128, 128, 128)
    }
    
    min_distance = float('inf')
    closest_color_name = "Unknown"
    
    # Find the closest color using basic Euclidean distance
    for color_name, color_val in colors.items():
        distance = sum((a - b) ** 2 for a, b in zip(rgb_tuple, color_val))
        if distance < min_distance:
            min_distance = distance
            closest_color_name = color_name
            
    return closest_color_name

# 2. Define the K-Means dominant color function
def get_dominant_color(image, k=3):
    # Reshape the image to be a list of pixels
    pixels = image.reshape((-1, 3))
    
    # Run K-Means clustering
    kmeans = KMeans(n_clusters=k, n_init=10)
    kmeans.fit(pixels)
    
    # Count the labels to find the most frequent cluster (dominant color)
    counts = np.bincount(kmeans.labels_)
    dominant_cluster = kmeans.cluster_centers_[np.argmax(counts)]
    
    return [int(x) for x in dominant_cluster]

# 3. Load YOLO and process the image
def main():
    # Load the official YOLOv8 Nano model (it will download automatically)
    # Note: For strict clothing detection, you'd swap this with a clothing-specific weights file.
    model = YOLO("yolov8n.pt") 
    
    image_path = "your_image.jpg" # <--- Replace with your image file path
    image = cv2.imread(image_path)
    
    if image is None:
        print("Error: Could not load image.")
        return

    # Run YOLO inference
    results = model(image)
    
    for result in results:
        boxes = result.boxes
        for box in boxes:
            # Get bounding box coordinates
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            class_id = int(box.cls[0])
            label_name = model.names[class_id]
            
            # Crop the bounding box from the image
            cropped_item = image[y1:y2, x1:x2]
            
            # OpenCV uses BGR, but we want RGB for accurate color naming
            cropped_rgb = cv2.cvtColor(cropped_item, cv2.COLOR_BGR2RGB)
            
            # Extract color
            dominant_rgb = get_dominant_color(cropped_rgb)
            color_name = get_color_name(dominant_rgb)
            
            # Draw the bounding box and label on the original image
            final_label = f"{color_name} {label_name}"
            
            cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(image, final_label, (x1, y1 - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

    # Show the final result
    cv2.imshow("Detection Result", image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()