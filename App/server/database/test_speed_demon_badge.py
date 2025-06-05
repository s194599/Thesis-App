import os
import json
import sys
from datetime import datetime, timedelta

# Add the parent directory to the path to allow importing from other files
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from routes.badge_routes import check_and_award_badges, load_json_file, save_json_file

def test_speed_demon_badge():
    """Test if the 'speed_demon' badge is properly awarded"""
    print("Testing 'Speed Demon' badge awarding...")
    
    # Load student data
    students_path = os.path.join(os.path.dirname(__file__), 'students.json')
    students = load_json_file(students_path, {"students": []})
    
    # Load student results to check if we need to create test data
    results_path = os.path.join(os.path.dirname(__file__), 'student_results.json')
    student_results = load_json_file(results_path, {"quiz_history": []})
    
    # Find if there's any existing record with timestamps that qualify for the badge
    candidates = []
    for result in student_results.get("quiz_history", []):
        student_id = result.get("student_id")
        quiz_id = result.get("quiz_id")
        quiz_title = result.get("quiz_title", "Unknown Quiz")
        score = result.get("score", 0)
        total_questions = result.get("total_questions", 1)
        
        # Skip if no student_id or invalid score
        if not student_id or total_questions == 0:
            continue
            
        score_percent = (score / total_questions) * 100
        
        # Check for timestamps
        start_timestamp = result.get("start_timestamp")
        end_timestamp = result.get("timestamp")
        
        if start_timestamp and end_timestamp:
            try:
                # Parse timestamps and ensure they're both naive or both timezone-aware
                # Strip any timezone info to make both naive
                if isinstance(start_timestamp, str):
                    start_time = datetime.fromisoformat(start_timestamp.replace('Z', '').split('+')[0])
                else:
                    start_time = start_timestamp
                    
                if isinstance(end_timestamp, str):
                    end_time = datetime.fromisoformat(end_timestamp.replace('Z', '').split('+')[0])
                else:
                    end_time = end_timestamp
                
                # Calculate time difference in seconds
                time_diff = (end_time - start_time).total_seconds()
                
                # Debug info
                print(f"Quiz: {quiz_title}, Time: {time_diff:.2f}s, Score: {score_percent:.0f}%")
                
                # Check if this qualifies for the badge
                if time_diff <= 30 and score_percent >= 80:
                    # Find student name
                    student_name = "Unknown"
                    for student in students.get("students", []):
                        if student.get("student_id") == student_id:
                            student_name = student.get("name")
                            break
                            
                    candidates.append({
                        "student_id": student_id,
                        "student_name": student_name,
                        "quiz_id": quiz_id,
                        "quiz_title": quiz_title,
                        "completion_time": time_diff,
                        "score_percent": score_percent
                    })
            except (ValueError, TypeError) as e:
                print(f"Error parsing timestamps for result: {e}")
                continue
    
    if candidates:
        print(f"Found {len(candidates)} candidates for the 'Speed Demon' badge:")
        for candidate in candidates:
            print(f"  {candidate['student_name']} (ID: {candidate['student_id']}) - "
                  f"completed '{candidate['quiz_title']}' in {candidate['completion_time']:.2f} seconds "
                  f"with a score of {candidate['score_percent']:.0f}%")
    else:
        print("No students found qualifying for the 'Speed Demon' badge.")
    
    # If no candidates, create a test case
    if not candidates:
        print("\nCreating a test case by updating a student record...")
        
        # Find a record to update
        history = student_results.get("quiz_history", [])
        if history:
            # Update a record to have a quick completion time
            index_to_update = 0  # Update the first record
            
            # Get current time
            now = datetime.now()
            end_time = now
            # Set start time 20 seconds before end time
            start_time = end_time - timedelta(seconds=20)
            
            # Update the record
            history[index_to_update]["timestamp"] = end_time.isoformat()
            history[index_to_update]["start_timestamp"] = start_time.isoformat()
            
            # Ensure the score is high enough (at least 80%)
            total_questions = history[index_to_update].get("total_questions", 5)
            if total_questions > 0:
                min_score = int(total_questions * 0.8 + 0.5)  # 80% of total, rounded up
                history[index_to_update]["score"] = min_score
            
            student_id = history[index_to_update].get("student_id")
            quiz_title = history[index_to_update].get("quiz_title", "Unknown Quiz")
            
            # Find student name
            student_name = "Unknown"
            for student in students.get("students", []):
                if student.get("student_id") == student_id:
                    student_name = student.get("name")
                    break
            
            # Print the updated record for debugging
            print(f"Updated record details:")
            print(f"  Student: {student_name} (ID: {student_id})")
            print(f"  Quiz: {quiz_title}")
            print(f"  Score: {history[index_to_update]['score']}/{total_questions}")
            print(f"  Start time: {start_time.isoformat()}")
            print(f"  End time: {end_time.isoformat()}")
            print(f"  Duration: 20 seconds")
            
            # Save the updated results
            save_json_file(results_path, student_results)
            
            # Add to candidates
            score = history[index_to_update].get("score", 0)
            total_questions = history[index_to_update].get("total_questions", 1)
            score_percent = (score / total_questions) * 100 if total_questions > 0 else 0
            
            candidates.append({
                "student_id": student_id,
                "student_name": student_name,
                "quiz_id": history[index_to_update].get("quiz_id"),
                "quiz_title": quiz_title,
                "completion_time": 20,
                "score_percent": score_percent
            })
    
    # Remove any existing Speed Demon badges to test fresh
    badges_path = os.path.join(os.path.dirname(__file__), 'student_badges.json')
    student_badges = load_json_file(badges_path, {"student_badges": []})
    
    # Filter out any existing Speed Demon badges
    student_badges["student_badges"] = [
        badge for badge in student_badges.get("student_badges", [])
        if badge.get("badge_id") != "speed_demon"
    ]
    
    # Save the updated badges
    save_json_file(badges_path, student_badges)
    print("Removed any existing 'Speed Demon' badges for testing.")
    
    # Check badges for each candidate
    for candidate in candidates:
        print(f"\nChecking badges for {candidate['student_name']}...")
        print(f"  Student ID: {candidate['student_id']}")
        print(f"  Quiz: {candidate['quiz_title']}")
        print(f"  Completion time: {candidate['completion_time']:.2f} seconds")
        print(f"  Score: {candidate['score_percent']:.0f}%")
        
        # Load badge definitions to verify criteria
        badges_path = os.path.join(os.path.dirname(__file__), 'badges.json')
        badges = load_json_file(badges_path, {"badges": []})
        speed_demon_badge = None
        for badge in badges.get("badges", []):
            if badge.get("badge_id") == "speed_demon":
                speed_demon_badge = badge
                break
        
        if speed_demon_badge:
            print(f"  Badge criteria:")
            print(f"    - Max seconds: {speed_demon_badge.get('criteria', {}).get('max_seconds', 'N/A')}")
            print(f"    - Min score percent: {speed_demon_badge.get('criteria', {}).get('min_score_percent', 'N/A')}%")
        
        newly_earned_badges = check_and_award_badges(
            candidate["student_id"], 
            candidate["student_name"]
        )
        
        if newly_earned_badges:
            print(f"Awarded {len(newly_earned_badges)} new badges:")
            for badge in newly_earned_badges:
                print(f"  - {badge['badge_name']}: {badge['badge_description']}")
                
                # Check if it's our target badge
                if badge['badge_id'] == 'speed_demon':
                    print(f"    SUCCESS: 'Speed Demon' badge awarded!")
                    if 'context' in badge:
                        print(f"    Quiz: {badge['context'].get('quiz_title')} "
                              f"(Completed in: {badge['context'].get('completion_time', 0):.2f} seconds, "
                              f"Score: {badge['context'].get('score_percent', 0):.0f}%)")
        else:
            print("No new badges earned.")

if __name__ == "__main__":
    test_speed_demon_badge() 