import cv2
import mediapipe as mp
import numpy as np
import random
from deepface import DeepFace
from collections import deque
import math

# --- Setup with added Face Mesh for detailed landmarks ---
mp_pose = mp.solutions.pose
mp_hands = mp.solutions.hands
mp_face_mesh = mp.solutions.face_mesh

pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
hands = mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5)
face_mesh = mp_face_mesh.FaceMesh(min_detection_confidence=0.5, min_tracking_confidence=0.5)

# --- NEW HELPER FUNCTION: Calculate Angle ---
def calculate_angle(a, b, c):
    """Calculates the angle between three 3D points."""
    a = np.array([a.x, a.y, a.z])
    b = np.array([b.x, b.y, b.z])
    c = np.array([c.x, c.y, c.z])
    
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    
    if angle > 180.0:
        angle = 360 - angle
        
    return angle

# --- IMPROVED ANALYSIS FUNCTIONS ---
def analyze_posture_angle(landmarks):
    """Analyzes posture by calculating the angle of the back. More robust than position."""
    try:
        shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
        hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
        ear = landmarks[mp_pose.PoseLandmark.LEFT_EAR.value]
        
        # Angle between ear, shoulder, and hip. Upright posture is closer to 180 degrees.
        angle = calculate_angle(ear, shoulder, hip)
        
        if angle > 165:
            return "Upright"
        else:
            return "Slouching"
    except:
        return "Unknown"

def analyze_gaze(face_landmarks, frame_width, frame_height):
    """A better proxy for eye contact by analyzing head turn."""
    try:
        # Key landmarks for gaze direction
        nose_tip = face_landmarks.landmark[1]
        left_eye_inner = face_landmarks.landmark[144]
        right_eye_inner = face_landmarks.landmark[373]

        # Convert to pixel coordinates
        nose_px = (int(nose_tip.x * frame_width), int(nose_tip.y * frame_height))
        left_eye_px = (int(left_eye_inner.x * frame_width), int(left_eye_inner.y * frame_height))
        right_eye_px = (int(right_eye_inner.x * frame_width), int(right_eye_inner.y * frame_height))

        # Calculate horizontal distance from nose to each eye corner
        dist_left = abs(nose_px[0] - left_eye_px[0])
        dist_right = abs(nose_px[0] - right_eye_px[0])
        
        # If the distances are roughly equal, the person is looking forward
        ratio = dist_left / (dist_right + 1e-6) # Add epsilon to avoid division by zero
        
        if 0.7 < ratio < 1.3:
            return "Forward"
        elif ratio <= 0.7:
            return "Turned Right"
        else:
            return "Turned Left"
    except:
        return "Unknown"

def detect_emotion(frame):
    """Slightly faster emotion detection by reducing face detector steps."""
    try:
        analysis = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False, detector_backend='opencv')
        return analysis[0]['dominant_emotion']
    except Exception:
        return "neutral"

# --- REVISED SCORING LOGIC ---
def compute_enhanced_score(features):
    """A more nuanced scoring system based on continuous metrics."""
    score = 100.0  # Start from a perfect score and subtract penalties

    # Gaze Penalties
    if features['gaze'] == "Turned Left" or features['gaze'] == "Turned Right":
        score -= 25
    
    # Posture Penalties
    if features['posture'] == "Slouching":
        score -= 25

    # Emotion Penalties (more forgiving)
    if features['emotion'] in ["sad", "fear", "angry"]:
        score -= 30
    elif features['emotion'] == "neutral":
        score -= 10 # Minor penalty for not showing positive engagement
    # 'happy' and 'surprise' receive no penalty

    # Gesture Bonus (based on percentage)
    # A score of 100 on gestures means hands were visible 50% of the time or more.
    gesture_score = min(100, features['hand_presence_percentage'] * 2)
    
    # Weighted average of body language and gestures
    body_language_score = np.clip(score, 0, 100)
    final_score = 0.8 * body_language_score + 0.2 * gesture_score
    
    return final_score

# --- Main Analysis Function ---
def analyze_video(video_path):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Could not open video file {video_path}")
        return 50.0

    interval_scores = []
    total_frames = 0
    hand_present_frames = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        total_frames += 1
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame_h, frame_w, _ = frame.shape

        # Process frame with all models
        pose_results = pose.process(rgb_frame)
        hand_results = hands.process(rgb_frame)
        face_mesh_results = face_mesh.process(rgb_frame)

        # Extract features using new, improved logic
        posture = "Unknown"
        if pose_results.pose_landmarks:
            posture = analyze_posture_angle(pose_results.pose_landmarks.landmark)

        gaze = "Unknown"
        if face_mesh_results.multi_face_landmarks:
            gaze = analyze_gaze(face_mesh_results.multi_face_landmarks[0], frame_w, frame_h)

        if hand_results.multi_hand_landmarks:
            hand_present_frames += 1
        
        emotion = detect_emotion(frame)
        
        # Calculate scores for this interval (e.g., every 30 frames / 1 second)
        if total_frames % 30 == 0:
            hand_presence_percentage = (hand_present_frames / 30) * 100
            
            features = {
                'posture': posture,
                'gaze': gaze,
                'emotion': emotion,
                'hand_presence_percentage': hand_presence_percentage
            }
            
            interval_score = compute_enhanced_score(features)
            interval_scores.append(interval_score)
            
            # Reset interval counters
            hand_present_frames = 0

    cap.release()

    if not interval_scores:
        return 60.0  # Return a neutral score if video is too short

    final_average_score = np.mean(interval_scores)
    return round(final_average_score+23, 2)