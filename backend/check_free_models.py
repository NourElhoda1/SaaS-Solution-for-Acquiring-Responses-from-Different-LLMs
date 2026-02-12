import requests
import json

def get_free_models():
    print("🔍 Recherche des modèles gratuits sur OpenRouter...")
    try:
        response = requests.get("https://openrouter.ai/api/v1/models")
        
        if response.status_code != 200:
            print(f"❌ Erreur API: {response.status_code}")
            return

        all_models = response.json()["data"]
        free_models = []

        for model in all_models:
            # On vérifie si le prix est littéralement zéro
            price_in = float(model.get("pricing", {}).get("prompt", 0))
            price_out = float(model.get("pricing", {}).get("completion", 0))
            
            # On cherche ceux qui sont gratuits OU qui ont le tag :free
            if (price_in == 0 and price_out == 0) or ":free" in model["id"]:
                free_models.append(model["id"])

        print(f"\n✅ Trouvé {len(free_models)} modèles gratuits !\n")
        print("Voici les IDs à copier dans votre models.py :")
        print("-" * 50)
        
        # On affiche les plus populaires en premier
        favorites = ["google", "meta-llama", "mistral", "deepseek", "qwen"]
        
        for fav in favorites:
            for model_id in free_models:
                if fav in model_id:
                    print(f'"{model_id}"')
        
        print("-" * 50)

    except Exception as e:
        print(f"❌ Erreur: {str(e)}")

if __name__ == "__main__":
    get_free_models()