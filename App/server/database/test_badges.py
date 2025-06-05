import os
import json
import sys

# Add the parent directory to the path to allow importing from other files
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from routes.badge_routes import check_and_award_badges, load_json_file

def test_never_give_up_badge():
    """Test if the 'never_give_up' badge is properly awarded"""
    print("Testing 'Giv aldrig op' badge awarding...")
    
    # Load student data
    students_path = os.path.join(os.path.dirname(__file__), 'students.json')
    students = load_json_file(students_path, {"students": []})
    
    # Load student results to find candidates for the badge
    results_path = os.path.join(os.path.dirname(__file__), 'student_results.json')
    student_results = load_json_file(results_path, {"quiz_history": []})
    
    # Find students with 10+ attempts on any quiz
    candidates = []
    for result in student_results.get("quiz_history", []):
        student_id = result.get("student_id")
        quiz_id = result.get("quiz_id")
        attempts = result.get("attempts", 1)
        quiz_title = result.get("quiz_title", "Unknown Quiz")
        
        if attempts >= 10:
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
                "attempts": attempts
            })
    
    if candidates:
        print(f"Found {len(candidates)} candidates for the 'Giv aldrig op' badge:")
        for candidate in candidates:
            print(f"  {candidate['student_name']} (ID: {candidate['student_id']}) - " 
                  f"{candidate['attempts']} attempts on '{candidate['quiz_title']}'")
    else:
        print("No students found with 10+ attempts on any quiz.")
    
    # If no candidates naturally exist, let's modify a record to test the badge
    if not candidates:
        print("\nCreating a test case by updating a student record...")
        
        # Find the first record to update
        history = student_results.get("quiz_history", [])
        if history:
            # Update the first record to have 10 attempts
            history[0]["attempts"] = 10
            print(f"Updated {history[0].get('student_name')} (ID: {history[0].get('student_id')}) " 
                  f"to have 10 attempts on quiz '{history[0].get('quiz_title')}'")
            
            # Save the updated results
            with open(results_path, 'w') as f:
                json.dump(student_results, f, indent=2)
                
            # Add this student to candidates
            candidates.append({
                "student_id": history[0].get("student_id"),
                "student_name": history[0].get("student_name"),
                "quiz_id": history[0].get("quiz_id"),
                "quiz_title": history[0].get("quiz_title"),
                "attempts": 10
            })
    
    # Check badges for each candidate
    for candidate in candidates:
        print(f"\nChecking badges for {candidate['student_name']}...")
        newly_earned_badges = check_and_award_badges(
            candidate["student_id"], 
            candidate["student_name"]
        )
        
        if newly_earned_badges:
            print(f"Awarded {len(newly_earned_badges)} new badges:")
            for badge in newly_earned_badges:
                print(f"  - {badge['badge_name']}: {badge['badge_description']}")
                
                # Check if it's our target badge
                if badge['badge_id'] == 'never_give_up':
                    print(f"    SUCCESS: 'Giv aldrig op' badge awarded!")
                    if 'context' in badge:
                        print(f"    Quiz: {badge['context'].get('quiz_title')} "
                              f"(Attempts: {badge['context'].get('attempts')})")
        else:
            print("No new badges earned.")

if __name__ == "__main__":
    test_never_give_up_badge() 