#!/usr/bin/env python3
"""
Scrapnet 2.0 - Ensemble Regression Model for CO2 Emissions Prediction
Uses XGBoost, Extra Trees, and Random Forest with model comparison
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import ExtraTreesRegressor, RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import warnings
warnings.filterwarnings('ignore')

# Try to import XGBoost
try:
    from xgboost import XGBRegressor
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    print("XGBoost not available, using Gradient Boosting instead")

def load_and_preprocess_data(filepath='asphalt_carbon_data.csv'):
    """Load and preprocess the asphalt carbon dataset"""
    print("="*70)
    print("LOADING AND PREPROCESSING DATA")
    print("="*70)
    
    df = pd.read_csv(filepath)
    print(f"Loaded {len(df)} records from {filepath}")
    print(f"\nFeatures: {list(df.columns)}")
    print(f"\nData shape: {df.shape}")
    
    # Encode Mix_Type
    le = LabelEncoder()
    df['Mix_Type_Encoded'] = le.fit_transform(df['Mix_Type'])
    print(f"\nMix_Type encoding: {dict(zip(le.classes_, le.transform(le.classes_)))}")
    
    # Features and target
    feature_cols = ['Tonnage', 'RAP_Percentage', 'Trip_Distance', 'Mix_Type_Encoded', 'Fuel_Burn_Liters']
    X = df[feature_cols]
    y = df['CO2_Emissions_Tonnes']
    
    print(f"\nTarget statistics:")
    print(f"  Mean CO2: {y.mean():.3f} tonnes")
    print(f"  Std CO2:  {y.std():.3f} tonnes")
    print(f"  Min CO2:  {y.min():.3f} tonnes")
    print(f"  Max CO2:  {y.max():.3f} tonnes")
    
    return X, y, le, feature_cols

def train_and_evaluate_models(X, y):
    """Train multiple ensemble models and compare performance"""
    print("\n" + "="*70)
    print("TRAINING ENSEMBLE MODELS")
    print("="*70)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"\nTraining set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    
    # Define models
    models = {
        'Extra Trees': ExtraTreesRegressor(
            n_estimators=200,
            max_depth=15,
            min_samples_split=2,
            min_samples_leaf=1,
            random_state=42,
            n_jobs=-1
        ),
        'Random Forest': RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            min_samples_split=2,
            random_state=42,
            n_jobs=-1
        ),
        'Gradient Boosting': GradientBoostingRegressor(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.1,
            random_state=42
        )
    }
    
    if HAS_XGBOOST:
        models['XGBoost'] = XGBRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            random_state=42,
            n_jobs=-1
        )
    
    results = {}
    best_model = None
    best_r2 = -np.inf
    
    for name, model in models.items():
        print(f"\n--- Training {name} ---")
        
        # Train
        model.fit(X_train, y_train)
        
        # Predict
        y_train_pred = model.predict(X_train)
        y_test_pred = model.predict(X_test)
        
        # Metrics
        train_mae = mean_absolute_error(y_train, y_train_pred)
        train_rmse = np.sqrt(mean_squared_error(y_train, y_train_pred))
        train_r2 = r2_score(y_train, y_train_pred)
        
        test_mae = mean_absolute_error(y_test, y_test_pred)
        test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
        test_r2 = r2_score(y_test, y_test_pred)
        
        # Cross-validation
        cv_scores = cross_val_score(model, X, y, cv=5, scoring='r2')
        
        results[name] = {
            'model': model,
            'train_mae': train_mae,
            'train_rmse': train_rmse,
            'train_r2': train_r2,
            'test_mae': test_mae,
            'test_rmse': test_rmse,
            'test_r2': test_r2,
            'cv_r2_mean': cv_scores.mean(),
            'cv_r2_std': cv_scores.std()
        }
        
        print(f"  Training:   MAE={train_mae:.4f}, RMSE={train_rmse:.4f}, R²={train_r2:.4f}")
        print(f"  Test:       MAE={test_mae:.4f}, RMSE={test_rmse:.4f}, R²={test_r2:.4f}")
        print(f"  CV R² (5-fold): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        
        if test_r2 > best_r2:
            best_r2 = test_r2
            best_model = name
    
    return results, best_model, X_test, y_test

def analyze_feature_importance(results, feature_cols, best_model_name):
    """Analyze feature importance from the best model"""
    print("\n" + "="*70)
    print(f"FEATURE IMPORTANCE ({best_model_name})")
    print("="*70)
    
    model = results[best_model_name]['model']
    importances = model.feature_importances_
    
    importance_df = pd.DataFrame({
        'Feature': feature_cols,
        'Importance': importances
    }).sort_values('Importance', ascending=False)
    
    print("\nFeature Importance Ranking:")
    for idx, row in importance_df.iterrows():
        bar = '█' * int(row['Importance'] * 50)
        print(f"  {row['Feature']:20s}: {row['Importance']:.4f} {bar}")
    
    return importance_df

def business_validation(model, X_test, y_test, feature_cols):
    """Validate model against business rules"""
    print("\n" + "="*70)
    print("BUSINESS VALIDATION")
    print("="*70)
    
    y_pred = model.predict(X_test)
    
    # Calculate CO2 per ton
    tonnage_idx = feature_cols.index('Tonnage')
    tonnages = X_test.iloc[:, tonnage_idx].values
    co2_per_ton_actual = (y_test.values * 1000) / tonnages
    co2_per_ton_pred = (y_pred * 1000) / tonnages
    
    print("\nCO2 per ton analysis:")
    print(f"  Actual mean:    {co2_per_ton_actual.mean():.2f} kg/ton")
    print(f"  Predicted mean: {co2_per_ton_pred.mean():.2f} kg/ton")
    
    # Green target check
    green_actual = (co2_per_ton_actual < 45).sum()
    green_pred = (co2_per_ton_pred < 45).sum()
    
    print(f"\nGreen target (<45 kg/ton) projects:")
    print(f"  Actual:    {green_actual} ({green_actual/len(y_test)*100:.1f}%)")
    print(f"  Predicted: {green_pred} ({green_pred/len(y_pred)*100:.1f}%)")
    
    # Prediction accuracy bands
    errors = np.abs(y_test.values - y_pred)
    pct_errors = errors / y_test.values * 100
    
    print(f"\nPrediction accuracy:")
    print(f"  Within 1%:  {(pct_errors < 1).sum()} samples ({(pct_errors < 1).mean()*100:.1f}%)")
    print(f"  Within 5%:  {(pct_errors < 5).sum()} samples ({(pct_errors < 5).mean()*100:.1f}%)")
    print(f"  Within 10%: {(pct_errors < 10).sum()} samples ({(pct_errors < 10).mean()*100:.1f}%)")

def save_model(model, le, feature_cols, model_name):
    """Save the trained model"""
    print("\n" + "="*70)
    print("SAVING MODEL")
    print("="*70)
    
    model_artifacts = {
        'model': model,
        'label_encoder': le,
        'feature_cols': feature_cols,
        'model_name': model_name
    }
    
    joblib.dump(model_artifacts, 'carbon_prediction_model.joblib')
    print(f"✓ Model saved to: carbon_prediction_model.joblib")
    
    return model_artifacts

def demonstrate_predictions(model_artifacts):
    """Demonstrate model predictions with sample scenarios"""
    print("\n" + "="*70)
    print("SAMPLE PREDICTIONS")
    print("="*70)
    
    model = model_artifacts['model']
    le = model_artifacts['label_encoder']
    
    scenarios = [
        {"name": "High RAP + WMA (Green)", "Tonnage": 300, "RAP_Percentage": 40, 
         "Trip_Distance": 30, "Mix_Type": "WMA", "Fuel_Burn_Liters": 2000},
        {"name": "Low RAP + HMA (Standard)", "Tonnage": 300, "RAP_Percentage": 10, 
         "Trip_Distance": 60, "Mix_Type": "HMA", "Fuel_Burn_Liters": 4500},
        {"name": "Medium project", "Tonnage": 200, "RAP_Percentage": 25, 
         "Trip_Distance": 45, "Mix_Type": "WMA", "Fuel_Burn_Liters": 2500},
        {"name": "Large project, long haul", "Tonnage": 450, "RAP_Percentage": 20, 
         "Trip_Distance": 80, "Mix_Type": "HMA", "Fuel_Burn_Liters": 8000},
    ]
    
    print("\nScenario Predictions:")
    print("-" * 90)
    print(f"{'Scenario':<25} {'Tonnage':>8} {'RAP%':>6} {'Dist':>6} {'Mix':>5} {'CO2 (t)':>10} {'kg/ton':>8} {'Green?':>7}")
    print("-" * 90)
    
    for s in scenarios:
        mix_encoded = le.transform([s['Mix_Type']])[0]
        X_pred = np.array([[s['Tonnage'], s['RAP_Percentage'], s['Trip_Distance'], 
                           mix_encoded, s['Fuel_Burn_Liters']]])
        
        co2_pred = model.predict(X_pred)[0]
        co2_per_ton = (co2_pred * 1000) / s['Tonnage']
        is_green = "✓ YES" if co2_per_ton < 45 else "✗ NO"
        
        print(f"{s['name']:<25} {s['Tonnage']:>8.0f} {s['RAP_Percentage']:>6.0f} "
              f"{s['Trip_Distance']:>6.0f} {s['Mix_Type']:>5} {co2_pred:>10.3f} "
              f"{co2_per_ton:>8.2f} {is_green:>7}")
    
    print("-" * 90)

def main():
    print("\n" + "="*70)
    print("  SCRAPNET 2.0 - CO2 EMISSIONS PREDICTION MODEL")
    print("  Ensemble Regression Analysis")
    print("="*70)
    
    # Load data
    X, y, le, feature_cols = load_and_preprocess_data()
    
    # Train models
    results, best_model_name, X_test, y_test = train_and_evaluate_models(X, y)
    
    # Print comparison summary
    print("\n" + "="*70)
    print("MODEL COMPARISON SUMMARY")
    print("="*70)
    print(f"\n{'Model':<20} {'Test MAE':>10} {'Test RMSE':>10} {'Test R²':>10} {'CV R²':>12}")
    print("-" * 65)
    for name, r in results.items():
        cv_str = f"{r['cv_r2_mean']:.4f}±{r['cv_r2_std']:.4f}"
        print(f"{name:<20} {r['test_mae']:>10.4f} {r['test_rmse']:>10.4f} "
              f"{r['test_r2']:>10.4f} {cv_str:>12}")
    print("-" * 65)
    print(f"\n★ Best Model: {best_model_name} (Test R² = {results[best_model_name]['test_r2']:.4f})")
    
    # Feature importance
    importance_df = analyze_feature_importance(results, feature_cols, best_model_name)
    
    # Business validation
    best_model = results[best_model_name]['model']
    business_validation(best_model, X_test, y_test, feature_cols)
    
    # Save model
    model_artifacts = save_model(best_model, le, feature_cols, best_model_name)
    
    # Demonstrate predictions
    demonstrate_predictions(model_artifacts)
    
    print("\n" + "="*70)
    print("  TRAINING COMPLETE")
    print("="*70)
    print(f"\nModel: {best_model_name}")
    print(f"Test R²: {results[best_model_name]['test_r2']:.4f}")
    print(f"Test RMSE: {results[best_model_name]['test_rmse']:.4f} tonnes")
    print(f"\nModel saved to: carbon_prediction_model.joblib")
    print("="*70)

if __name__ == "__main__":
    main()
