from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import random
import requests
import os
from dotenv import load_dotenv

# --- WAKE UP THE HIDDEN .ENV FILE ---
load_dotenv()

# --- INITIALIZE APP ---
app = FastAPI(title="Hypertrophy & Diet AI Engine v2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False, 
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LOAD DATASETS ---
try:
    wdf = pd.read_csv('weightlifting_721_workouts.csv')
    exercises = wdf[['Workout Name', 'Exercise Name']].drop_duplicates().copy()
    exercises.rename(columns={'Workout Name': 'Target_Muscle_Group'}, inplace=True)
    
    def categorize_muscle(name):
        name = str(name).lower()
        if 'chest' in name or 'push' in name: return 'Chest/Push'
        elif 'back' in name or 'pull' in name: return 'Back/Pull'
        elif 'leg' in name or 'squat' in name: return 'Legs'
        elif 'shoulder' in name: return 'Shoulders'
        elif 'arm' in name or 'bicep' in name or 'tricep' in name: return 'Arms'
        else: return 'Other'
        
    exercises['Target_Muscle_Group'] = exercises['Target_Muscle_Group'].apply(categorize_muscle)
    clean_exercises = exercises[exercises['Target_Muscle_Group'] != 'Other'].copy()
    clean_exercises['Difficulty_Level'] = clean_exercises['Exercise Name'].apply(lambda n: 3 if any(w in str(n).lower() for w in ['weighted', 'snatch', 'clean']) else (2 if any(w in str(n).lower() for w in ['barbell', 'pull up', 'squat']) else 1))

    ndf = pd.read_csv('nutrients_csvfile.csv')
    for col in ['Calories', 'Protein', 'Fat', 'Carbs']:
        ndf[col] = pd.to_numeric(ndf[col].astype(str).str.replace(r'[^\d.]', '', regex=True), errors='coerce')
        
    clean_nutrition = ndf.dropna(subset=['Calories', 'Protein']).copy()
    
    # Bulletproof Math: Convert any blank/NaN fat or carbs to 0
    clean_nutrition['Fat'] = clean_nutrition['Fat'].fillna(0)
    clean_nutrition['Carbs'] = clean_nutrition['Carbs'].fillna(0)
    
    def calculate_quantity_and_macros(row, target_meal_cals):
        base_cals = float(row['Calories'])
        if base_cals <= 0: return row['Food'], 0, 0, 0, 0, "1 base unit"

        multiplier = max(0.5, min(2.5, target_meal_cals / base_cals))
        food_lower = row['Food'].lower()
        if any(x in food_lower for x in ['egg', 'banana', 'apple', 'protein shake']):
            quantity_text = f"{max(1, round(multiplier))} base unit(s)"
        elif any(x in food_lower for x in ['rice', 'chicken', 'beef', 'fish', 'oats', 'pasta']):
            quantity_text = f"{round(100 * multiplier)} grams"
        elif any(x in food_lower for x in ['milk', 'juice']):
            quantity_text = f"{round(200 * multiplier)} ml"
        else:
            quantity_text = f"{round(multiplier, 1)} serving(s)"
            
        return (
            row['Food'], 
            round(base_cals * multiplier), 
            round(float(row['Protein']) * multiplier),
            round(float(row['Fat']) * multiplier),
            round(float(row['Carbs']) * multiplier),
            quantity_text
        )

    clean_nutrition['Meal_Type'] = clean_nutrition['Food'].apply(lambda n: 'Breakfast' if any(w in str(n).lower() for w in ['cereal', 'egg', 'pancake', 'toast', 'milk', 'oats']) else ('Main Meal' if any(w in str(n).lower() for w in ['beef', 'chicken', 'pork', 'fish', 'pizza', 'rice', 'pasta', 'meal']) else 'Snack / Side'))

except Exception as e:
    print(f"ERROR LOADING DATASETS: {e}")

# --- API MODELS ---
class WorkoutProfile(BaseModel):
    level: int          
    goal: str           

class DietProfile(BaseModel):
    weight_kg: float
    height_cm: float
    age: int
    is_male: bool
    workout_focus: str  
    goal: str           

class ChatMessage(BaseModel):
    message: str

# --- AI ENGINES ---
class AdvancedWorkoutCSP:
    def __init__(self, exercise_library, user_level, user_goal):
        self.variables = [f"Day_{i+1}" for i in range(7)]
        self.domain = list(exercise_library['Target_Muscle_Group'].unique()) + ['Rest']
        self.exercise_library = exercise_library
        self.user_level = user_level
        self.user_goal = user_goal

    def is_consistent(self, variable, value, assignment):
        if value == 'Rest': return list(assignment.values()).count('Rest') < 2
        var_index = self.variables.index(variable)
        if var_index > 0 and assignment.get(self.variables[var_index - 1]) == value: return False
        return True

    def backtrack(self, assignment):
        if len(assignment) == len(self.variables): return assignment
        unassigned = [v for v in self.variables if v not in assignment][0]
        random.shuffle(self.domain)
        for value in self.domain:
            if self.is_consistent(unassigned, value, assignment):
                assignment[unassigned] = value
                res = self.backtrack(assignment)
                if res: return res
                del assignment[unassigned]
        return None

    def generate_routine(self):
        schedule = self.backtrack({})
        if not schedule: return {"error": "Constraints too tight"}
        routine = {}
        reps = "4 sets x 3-5 reps" if self.user_goal == 'Strength' else "3 sets x 8-12 reps"
        for day, muscle in schedule.items():
            if muscle == 'Rest':
                routine[day] = {'Focus': 'Rest', 'Exercises': [], 'Reps': ''}
            else:
                safe_pool = self.exercise_library[(self.exercise_library['Target_Muscle_Group'] == muscle) & (self.exercise_library['Difficulty_Level'] <= self.user_level)]
                exercises = safe_pool['Exercise Name'].sample(min(4, len(safe_pool))).tolist() if not safe_pool.empty else [f"Basic {muscle} Move"]
                routine[day] = {'Focus': muscle, 'Exercises': exercises, 'Reps': reps}
        return routine

class QuantifiedDietGenerator:
    def __init__(self, food_db):
        self.b = food_db[food_db['Meal_Type'] == 'Breakfast']
        self.m = food_db[food_db['Meal_Type'] == 'Main Meal']
        self.s = food_db[food_db['Meal_Type'] == 'Snack / Side']

    def generate(self, targets):
        t_cals = targets['Calories']
        targets_per_meal = { 'Breakfast': t_cals*0.25, 'Main Meal 1': t_cals*0.30, 'Main Meal 2': t_cals*0.25, 'Snack': t_cals*0.20 }
        
        if self.b.empty or self.m.empty or self.s.empty: return [], {"Calories":0}
        b_food = self.b.sample(1).iloc[0]
        m_foods = self.m.sample(2)
        s_food = self.s.sample(1).iloc[0]
        
        final_menu = []
        b_scaled = calculate_quantity_and_macros(b_food, targets_per_meal['Breakfast'])
        final_menu.append({"Food": b_scaled[0], "Meal_Type": "Breakfast", "Calories": b_scaled[1], "Protein": b_scaled[2], "Fat": b_scaled[3], "Carbs": b_scaled[4], "Quantity": b_scaled[5]})
        
        m1_scaled = calculate_quantity_and_macros(m_foods.iloc[0], targets_per_meal['Main Meal 1'])
        final_menu.append({"Food": m1_scaled[0], "Meal_Type": "Main Meal", "Calories": m1_scaled[1], "Protein": m1_scaled[2], "Fat": m1_scaled[3], "Carbs": m1_scaled[4], "Quantity": m1_scaled[5]})
        
        m2_scaled = calculate_quantity_and_macros(m_foods.iloc[1], targets_per_meal['Main Meal 2'])
        final_menu.append({"Food": m2_scaled[0], "Meal_Type": "Main Meal", "Calories": m2_scaled[1], "Protein": m2_scaled[2], "Fat": m2_scaled[3], "Carbs": m2_scaled[4], "Quantity": m2_scaled[5]})
        
        s_scaled = calculate_quantity_and_macros(s_food, targets_per_meal['Snack'])
        final_menu.append({"Food": s_scaled[0], "Meal_Type": "Snack", "Calories": s_scaled[1], "Protein": s_scaled[2], "Fat": s_scaled[3], "Carbs": s_scaled[4], "Quantity": s_scaled[5]})
        
        actual_totals = { 'Calories': sum(item['Calories'] for item in final_menu), 'Protein': sum(item['Protein'] for item in final_menu) }
        return final_menu, actual_totals

# --- API ENDPOINTS ---
@app.post("/generate-workout")
def generate_workout(user: WorkoutProfile):
    csp = AdvancedWorkoutCSP(clean_exercises, user.level, user.goal)
    return csp.generate_routine()

@app.post("/generate-diet")
def generate_diet(user: DietProfile):
    bmr = (88.362 + 13.397*user.weight_kg + 4.799*user.height_cm - 5.677*user.age) if user.is_male else (447.593 + 9.247*user.weight_kg + 3.098*user.height_cm - 4.330*user.age)
    if user.workout_focus == 'Rest': tdee = bmr * 1.2
    elif user.workout_focus in ['Legs', 'Back/Pull']: tdee = bmr * 1.55
    else: tdee = bmr * 1.375
    
    t_cals = tdee + 300 if user.goal == 'Hypertrophy' else tdee
    targets = { 'Calories': t_cals, 'Protein': (t_cals * 0.3) / 4, 'Carbs': (t_cals * 0.45) / 4, 'Fat': (t_cals * 0.25) / 9 }
    
    diet_ai = QuantifiedDietGenerator(clean_nutrition)
    menu, totals = diet_ai.generate(targets)
    return {"targets": {k: round(v) for k, v in targets.items()}, "actual_totals": {k: round(v) for k, v in totals.items()}, "menu": menu}

# --- LIVE LLM INTEGRATION (RAW REST BYPASS) ---
@app.post("/ask-coach")
def ask_coach(chat: ChatMessage):
    # Securely grab the API key from your .env file
    API_KEY = os.getenv("GEMINI_API_KEY")
    
    # Direct Google endpoint pointing to the active 2.5-flash model
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={API_KEY}"
    
    system_prompt = "You are the 'Neural.FIT Elite AI Health Coach'. You give short, precise, and highly scientific fitness, health, and nutrition advice. Keep your responses under 3 or 4 short sentences. Do not use asterisks or markdown. User asks: "
    
    payload = {
        "contents": [{
            "parts": [{"text": system_prompt + chat.message}]
        }]
    }
    
    try:
        # Fire raw web request
        response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'})
        
        # Check for errors
        if response.status_code != 200:
            return {"response": f"Google Server Error: {response.text}"}
            
        data = response.json()
        
        # Extract the AI's actual text answer
        answer = data['candidates'][0]['content']['parts'][0]['text']
        return {"response": answer.replace('*', '').strip()}
        
    except Exception as e:
        print(f"Direct API Error: {str(e)}")
        return {"response": f"Connection Error: {str(e)}"}
#backend run:- python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000