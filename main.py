import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import math

app = FastAPI()

# Allow the React frontend to communicate with this Python server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Load your actual FYP Data saved from Google Colab!
print("Loading Olist Dataset...")
df = pd.read_csv('olist_decision_matrix_saved.csv')

@app.get("/api/customers")
def get_customers():
    # 2. Mix High-Risk VIPs and Standard customers so the filters work on the frontend
    vips = df[df['priority_matrix'] == 'High-Risk & High-Value VIP'].copy()
    vips = vips.sort_values(by='churn_probability', ascending=False).head(250)
    
    standard = df[df['priority_matrix'] == 'High-Risk & Standard-Value'].copy()
    standard = standard.sort_values(by='churn_probability', ascending=False).head(250)
    
    combined = pd.concat([vips, standard])
    
    results = []
    # 3. Format the data perfectly for the React Dashboard
    for _, row in combined.iterrows():
        # Fix the decimal issue by strictly converting to an integer
        wait_days = int(row['delivery_days']) if not pd.isna(row['delivery_days']) else 0

        # Recreate the business logic for the Next Best Action (NBA)
        if pd.isna(row['review_score']) or row['review_score'] <= 2:
            root_cause = "review_score <= 2"
            cause_desc = "Customer left a poor review on their last purchase."
            nba_tactic = "Acknowledge poor review, offer refund or replacement."
            nba_cost = 100.00
        elif row['delivery_days'] > 14:
            root_cause = "delivery_days > 14"
            cause_desc = f"Extreme shipping delay ({wait_days} days)."
            nba_tactic = "Apologize & offer Free Priority Shipping."
            nba_cost = 35.00
        else:
            fav_cat = row['favorite_category']
            root_cause = f"favorite_category_{fav_cat}"
            cause_desc = "Low recent engagement in their favorite category."
            nba_tactic = f"15% win-back discount on {fav_cat}."
            nba_cost = row['monetary_value'] * 0.15

        review_msg = row['review_comment_message']
        if pd.isna(review_msg) or str(review_msg).strip() == "" or str(review_msg) == "No review provided":
            review_pt = "Nenhuma avaliação fornecida."
            review_en = "No review provided."
        else:
            review_pt = str(review_msg)
            # Add realistic translation mocks based on sentiment
            if "excelente" in review_pt.lower() or "bom" in review_pt.lower():
                review_en = "[Translated]: Excellent product, but shipping was too slow. I want my money back."
            elif "não" in review_pt.lower() or "ruim" in review_pt.lower():
                review_en = "[Translated]: Very bad experience. Customer service did not help me."
            else:
                review_en = f"[Translated]: The item arrived, but I was not satisfied with the overall experience."

        # Construct the automated email draft (Removed decimals for days)
        ai_email = f"Hi there,\n\nWe noticed it's been a little while since your last visit, and we truly miss having you around! We also saw that your previous order took {wait_days} days to arrive. We sincerely apologize for the wait and want to make your next experience absolutely perfect.\n\nAs a token of our appreciation for your loyalty, we've unlocked a special perk just for you: {nba_tactic}\n\nWe'd love to welcome you back.\n\nWarmly,\nThe Olist Team"

        results.append({
            "id": str(row['customer_unique_id'])[:12] + "...",
            "name": "Olist Customer", # Anonymized for dashboard
            "segment": row['priority_matrix'],
            "spent": float(row['monetary_value']),
            "wait_time": wait_days,
            "churn_risk": round(float(row['churn_probability']) * 100, 1),
            "root_cause": root_cause,
            "cause_desc": cause_desc,
            "nba_tactic": nba_tactic,
            "nba_cost": float(nba_cost),
            "last_review_pt": review_pt,
            "last_review_en": review_en,
            "ai_email": ai_email
        })
        
    return results