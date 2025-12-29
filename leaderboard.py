import csv
import os
from datetime import datetime
import cv2

# Get the directory where this file is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

leader_board_file = os.path.join(BASE_DIR, "leaderboard.csv")
image_folder = os.path.join(BASE_DIR, "player_images")

os.makedirs(image_folder, exist_ok=True)

# Load CSV records
def load_leaderboard():
    if not os.path.exists(leader_board_file):
        with open(leader_board_file, "w", newline='') as f:
            writer = csv.writer(f)
            writer.writerow(["player_id", "score", "image_path", "time"])

    data = []
    with open(leader_board_file, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            row["score"] = int(row["score"])
            data.append(row)
    return data

# Save updated leaderboard to CSV
def save_leaderboard(rows):
    with open(leader_board_file, "w", newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["player_id", "score", "image_path", "time"])
        for r in rows:
            writer.writerow([r["player_id"], r["score"], r["image_path"], r["time"]])

# Clean up player_images folder - remove images not in CSV
def cleanup_player_images():
    """
    Remove images from player_images folder that are not referenced in the CSV.
    This helps save storage space by keeping only images of players in the leaderboard.
    """
    try:
        # Get all image paths from CSV
        leaderboard = load_leaderboard()
        referenced_images = set()
        
        for row in leaderboard:
            image_path = row.get("image_path", "")
            if image_path:
                # Extract filename from path (handle both forward and backslash)
                filename = os.path.basename(image_path.replace("\\", "/"))
                referenced_images.add(filename)
        
        # Scan player_images folder and delete unreferenced images
        if os.path.exists(image_folder):
            deleted_count = 0
            for filename in os.listdir(image_folder):
                file_path = os.path.join(image_folder, filename)
                # Only process image files
                if os.path.isfile(file_path) and filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                    if filename not in referenced_images:
                        try:
                            os.remove(file_path)
                            deleted_count += 1
                        except Exception as e:
                            print(f"Error deleting {file_path}: {e}")
            
            if deleted_count > 0:
                print(f"Cleaned up {deleted_count} unreferenced image(s) from player_images folder")
    except Exception as e:
        print(f"Error during image cleanup: {e}")

# Save final image
def save_player_image(frame):
    player_id = f"player_{int(datetime.now().timestamp())}"
    image_path = os.path.join(image_folder, f"{player_id}.png")
    cv2.imwrite(image_path, frame)
    return player_id, image_path

# Update leaderboard top 10
def update_leaderboard(score, frame):
    leaderboard = load_leaderboard()

    player_id, image_path = save_player_image(frame)

    entry = {
        "player_id": player_id,
        "score": score,
        "image_path": image_path,
        "time": datetime.now().strftime("%Y-%m-%d %H:%M")
    }

    leaderboard.append(entry)

    # Sort by score descending
    leaderboard = sorted(leaderboard, key=lambda x: x["score"], reverse=True)

    # Limit to top 6 scores
    leaderboard = leaderboard[:6]
    save_leaderboard(leaderboard)
    
    # Clean up images not in CSV to save storage space
    cleanup_player_images()

    # Remove images that are no longer part of the top 6
    keep_files = {os.path.basename(r["image_path"]) for r in leaderboard}
    for filename in os.listdir(image_folder):
        if filename not in keep_files:
            file_path = os.path.join(image_folder, filename)
            if os.path.isfile(file_path):
                try:
                    os.remove(file_path)
                except OSError:
                    pass

    return leaderboard
