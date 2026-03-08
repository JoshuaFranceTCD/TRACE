import cv2
import os

def generate_fingerprint_heatmap(gray_img, colormap=cv2.COLORMAP_INFERNO):
    """
    Visualization converting fingerprint grayscale images into infrared thermal map style.
Higher brightness (stronger contact/pressure) is displayed as “hotter” colors.
    """
    # Normalized to 0–255 for easy application of false color mapping.
    normalized = cv2.normalize(gray_img, None, 0, 255, cv2.NORM_MINMAX)
    normalized = normalized.astype("uint8")
    heatmap = cv2.applyColorMap(normalized, colormap)
    return heatmap


def run_trace_analysis():
    # 1. Load the Target Image (Crime Scene Fingerprint)
    # We use grayscale because ORB focuses on texture and structure, not color.
    crime_scene = cv2.imread("CrimeScene_Fingerprints.BMP", cv2.IMREAD_GRAYSCALE)
    
    if crime_scene is None:
        print("Error: CrimeScene_Fingerprints.BMP not found!")
        return

    # 2. Initialize the ORB (Oriented FAST and Rotated BRIEF) detector
    # This is the 'feature finder' mentioned in your document.
    orb = cv2.ORB_create()
    
    # Detect keypoints (kp) and compute descriptors (des) for the crime scene
    kp1, des1 = orb.detectAndCompute(crime_scene, None)

    best_score = 0
    best_match_name = None
    best_match_image = None
    best_kp = None
    best_matches = None

    # 3. Loop through the Suspects Database
    suspect_dir = "Suspect_Fingerprints"
    print("--- TRACE Fingerprint Analysis Engine ---")
    print(f"Scanning directory: {suspect_dir}...")
    
    if not os.path.exists(suspect_dir):
        print(f"Error: Directory '{suspect_dir}' does not exist.")
        return

    for file in os.listdir(suspect_dir):
        if file.lower().endswith(".bmp"):
            path = os.path.join(suspect_dir, file)
            suspect_img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
            
            # Extract features from the suspect's fingerprint
            kp2, des2 = orb.detectAndCompute(suspect_img, None)
            
            if des2 is None:
                continue

            # 4. Use Brute Force Matcher (BFMatcher)
            # NORM_HAMMING is the standard distance metric for ORB descriptors.
            bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
            matches = bf.match(des1, des2)
            
            # The 'score' is the number of successfully matched feature points.
            score = len(matches)
            print(f"Comparing {file:15} | Match Score: {score}")

            # Update the record if this suspect has a higher score
            if score > best_score:
                best_score = score
                best_match_name = file
                best_match_image = suspect_img
                best_kp = kp2
                best_matches = matches

    # 5. Output Final Results
    print("-" * 40)
    if best_match_name:
        print(f"ANALYSIS COMPLETE")
        print(f"Highest Probability Match: {best_match_name}")
        print(f"Final Score: {best_score} matches found.")
        
        # Visualize the result (match lines)
        result_display = cv2.drawMatches(crime_scene, kp1, best_match_image, best_kp, best_matches[:30], None, flags=2)
        cv2.imshow("TRACE: Best Alignment Found", result_display)

        # Fingerprint Infrared Heat Map: Crime Scene + Prime Suspect
        heat_crime = generate_fingerprint_heatmap(crime_scene)
        heat_suspect = generate_fingerprint_heatmap(best_match_image)
        cv2.imshow("Crime Scene – Infrared-style Heat Map", heat_crime)
        cv2.imshow(f"Best Match ({best_match_name}) – Infrared-style Heat Map", heat_suspect)

        cv2.imwrite("crime_scene_heatmap.png", heat_crime)
        cv2.imwrite("best_match_heatmap.png", heat_suspect)
        print("Heat maps saved: crime_scene_heatmap.png, best_match_heatmap.png")

        print("\nPress any key on an image window to exit.")
        cv2.waitKey(0)
        cv2.destroyAllWindows()
    else:
        print("No matches found in the database.")

if __name__ == "__main__":
    run_trace_analysis()
