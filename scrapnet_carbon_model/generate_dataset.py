"""
Scrapnet 2.0 - Synthetic Dataset Generator for Carbon Footprint Prediction
Generates realistic asphalt paving project data with proper correlations
"""

import pandas as pd
import numpy as np

# Set random seed for reproducibility
np.random.seed(42)

# Constants
NUM_RECORDS = 500
FUEL_CO2_FACTOR = 2.6  # kg CO2 per liter of diesel
BASE_FUEL_CONSUMPTION = 0.20  # liters per ton-km (industry average)
WMA_FUEL_REDUCTION = 0.20  # 20% less fuel for WMA vs HMA
RAP_EMISSION_REDUCTION = 0.015  # 1.5% CO2 reduction per 1% RAP increase
BASE_PRODUCTION_EMISSIONS = 35  # kg CO2 per ton for production/mixing

def generate_synthetic_data(num_records=NUM_RECORDS):
    """
    Generate synthetic asphalt paving project data with realistic correlations
    """
    data = []
    
    for _ in range(num_records):
        # Generate base features
        tonnage = np.random.uniform(50, 500)
        rap_percentage = np.random.uniform(0, 50)
        trip_distance = np.random.uniform(5, 100)
        mix_type = np.random.choice(['HMA', 'WMA'])
        
        # Calculate fuel burn based on tonnage, distance, and mix type
        # Fuel is needed for: hauling materials + mixing/production
        # Hauling component: based on tonnage and distance
        hauling_fuel = tonnage * trip_distance * BASE_FUEL_CONSUMPTION
        
        # Mixing/production fuel: based on tonnage and mix type
        if mix_type == 'WMA':
            # WMA requires less heating, thus less fuel
            mixing_fuel = tonnage * 0.8 * (1 - WMA_FUEL_REDUCTION)
        else:
            # HMA requires more heating
            mixing_fuel = tonnage * 0.8
        
        total_fuel = hauling_fuel + mixing_fuel
        
        # Add some realistic noise (±5%)
        fuel_noise = np.random.uniform(-0.05, 0.05)
        fuel_burn_liters = total_fuel * (1 + fuel_noise)
        
        # Calculate CO2 emissions
        # Component 1: Direct fuel combustion
        fuel_co2 = fuel_burn_liters * FUEL_CO2_FACTOR / 1000  # Convert to tonnes
        
        # Component 2: Production emissions (virgin bitumen, aggregates)
        # Higher RAP percentage = lower virgin material = lower emissions
        virgin_material_factor = (100 - rap_percentage) / 100
        production_co2 = (tonnage * BASE_PRODUCTION_EMISSIONS * virgin_material_factor) / 1000  # Convert to tonnes
        
        # Component 3: RAP benefit (recycled material reduces overall footprint)
        rap_benefit = (rap_percentage / 100) * tonnage * RAP_EMISSION_REDUCTION
        
        # Total CO2 emissions
        total_co2 = fuel_co2 + production_co2 - rap_benefit
        
        # Add some realistic noise (±3%)
        co2_noise = np.random.uniform(-0.03, 0.03)
        co2_emissions_tonnes = total_co2 * (1 + co2_noise)
        
        # Ensure no negative values
        co2_emissions_tonnes = max(co2_emissions_tonnes, 0.1)
        
        data.append({
            'Tonnage': round(tonnage, 2),
            'RAP_Percentage': round(rap_percentage, 2),
            'Trip_Distance': round(trip_distance, 2),
            'Mix_Type': mix_type,
            'Fuel_Burn_Liters': round(fuel_burn_liters, 2),
            'CO2_Emissions_Tonnes': round(co2_emissions_tonnes, 3)
        })
    
    return pd.DataFrame(data)

def main():
    print("Generating synthetic asphalt paving dataset...")
    print(f"Number of records: {NUM_RECORDS}")
    print()
    
    # Generate dataset
    df = generate_synthetic_data()
    
    # Display statistics
    print("Dataset Statistics:")
    print("="*80)
    print(df.describe())
    print()
    
    print("Mix Type Distribution:")
    print(df['Mix_Type'].value_counts())
    print()
    
    # Calculate CO2 per ton for analysis
    df['CO2_per_Ton'] = (df['CO2_Emissions_Tonnes'] * 1000) / df['Tonnage']
    print(f"Average CO2 per ton: {df['CO2_per_Ton'].mean():.2f} kg")
    print(f"Min CO2 per ton: {df['CO2_per_Ton'].min():.2f} kg")
    print(f"Max CO2 per ton: {df['CO2_per_Ton'].max():.2f} kg")
    print(f"Target threshold: <45 kg CO2 per ton")
    print(f"Records meeting target: {(df['CO2_per_Ton'] < 45).sum()} ({(df['CO2_per_Ton'] < 45).sum()/len(df)*100:.1f}%)")
    print()
    
    # Remove helper column before saving
    df = df.drop('CO2_per_Ton', axis=1)
    
    # Save to CSV
    output_path = 'asphalt_carbon_data.csv'
    df.to_csv(output_path, index=False)
    print(f"Dataset saved to: {output_path}")
    print()
    
    # Display sample records
    print("Sample records:")
    print(df.head(10))

if __name__ == "__main__":
    main()
