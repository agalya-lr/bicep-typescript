import cv2
import mediapipe as mp
import numpy as np
import psutil

import time
from leaderboard import update_leaderboard

mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

def crop_face(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # detectMultiScale parameters tuned for webcam
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))

    if len(faces) == 0:
        return None
    
    x, y, w, h = max(faces, key=lambda box: box[2] * box[3])

    pad = int(0.25 * h)
    y1 = max(0, y - pad)
    y2 = min(frame.shape[0], y + h + pad)
    x1 = max(0, x - pad)
    x2 = min(frame.shape[1], x + w + pad)

    return frame[y1:y2, x1:x2]


# Angle calculation

# Converting lists to numpy arrays every frame is unnecessary.
# You can calculate angle using pure Python math -> faster.
def calculate_angle(a, b, c):
    dx1, dy1 = c[0] - b[0], c[1] - b[1]
    dx2, dy2 = a[0] - b[0], a[1] - b[1]
    angle = abs(np.degrees(np.arctan2(dy1, dx1) - np.arctan2(dy2, dx2)))
    if angle > 180:
        angle = 360 - angle
    return angle

# Smooth angle values
def smooth(value, prev, alpha=0.2):
    return alpha * value + (1 - alpha) * prev

# Rep counting logic
def update_counter(angle, stage, counter, passed_mid):

    if angle > 150:
        stage = "down"
        passed_mid = False

    if 75 < angle < 110 and stage == "down":
        passed_mid = True

    if angle < 60 and stage == "down" and passed_mid:
        counter += 1
        stage = "up"
        passed_mid = False

    return counter, stage, passed_mid

def run_bicep_counter():
    cap = cv2.VideoCapture(0)

    game_ = 60          # 1 minute
    start_time = time.time()  

    left_stage = "down"
    right_stage = "down"

    left_count = 0
    right_count = 0

    left_mid = False
    right_mid = False

    left_prev = 160
    right_prev = 160

    last_face_crop = None   

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.flip(frame, 1)
            h, w = frame.shape[:2]

            # Processing large frames consumes CPU. so resizing.
            frame_small = cv2.resize(frame, (640, 480))
            results = pose.process(cv2.cvtColor(frame_small, cv2.COLOR_BGR2RGB))

            if results.pose_landmarks:

                face_img = crop_face(frame)
                if face_img is not None and face_img.size != 0:
                    last_face_crop = face_img

                # mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
                lm = results.pose_landmarks.landmark

                # left arm
                ls = [lm[11].x * w, lm[11].y * h]
                le = [lm[13].x * w, lm[13].y * h]
                lw = [lm[15].x * w, lm[15].y * h]

                # right arm
                rs = [lm[12].x * w, lm[12].y * h]
                re = [lm[14].x * w, lm[14].y * h]
                rw = [lm[16].x * w, lm[16].y * h]

                left_angle_raw = calculate_angle(ls, le, lw)
                right_angle_raw = calculate_angle(rs, re, rw)

                left_angle = smooth(left_angle_raw, left_prev)
                right_angle = smooth(right_angle_raw, right_prev)

                #used for smoothing
                left_prev = left_angle  
                right_prev = right_angle

                
                left_count, left_stage, left_mid = update_counter(left_angle, left_stage, left_count, left_mid)
                right_count, right_stage, right_mid = update_counter(right_angle, right_stage, right_count, right_mid)

                

            cpu_percent = psutil.cpu_percent()
            ram_percent = psutil.virtual_memory().percent

            cv2.putText(frame, f"LEFT: {left_count}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 3)
            cv2.putText(frame, f"RIGHT: {right_count}", (20, 90), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 3)
            text = f"CPU: {cpu_percent:.1f}%   RAM: {ram_percent:.1f} %"
            cv2.putText(frame, text, (20, h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
            elapsed = int(time.time() - start_time)
            remaining = game_ - elapsed
            timer_text = f"TIME LEFT: {remaining}s"
            text_size = cv2.getTextSize(timer_text, cv2.FONT_HERSHEY_SIMPLEX, 1, 3)[0]
            cv2.putText(frame, timer_text, (w - text_size[0] - 20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 3)
    
            cv2.imshow("Bicep Counter", frame)
            # timer 1min
            if remaining <= 0:
                print("\nTime's up! (60 seconds completed)")

                if last_face_crop is not None and last_face_crop.size != 0:
                    final_frame = last_face_crop
                else:
                    final_frame = frame.copy()
                    
                final_score = left_count + right_count
                top6 = update_leaderboard(final_score, final_frame)

                print("\nSession Completed")
                print("Your Score:", final_score)
                print("Leaderboard:")
                for i, row in enumerate(top6, 1):
                    print(f"{i}. {row['player_id']} - {row['score']}")
                break
            
            # Exit manually with Q (for testing)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    run_bicep_counter()
