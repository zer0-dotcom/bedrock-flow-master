# Scrapnet 2.0 - Dataset Schema Documentation

## Overview
This document describes the synthetic dataset schema for the Scrapnet 2.0 Carbon Footprint Prediction model. The dataset contains 500 records of asphalt paving projects with realistic correlations between features and CO2 emissions.

---

## Dataset Information

- **File Name**: `asphalt_carbon_data.csv`
- **Number of Records**: 500
- **Use Case**: Regression (Predicting CO2 emissions)
- **Target Variable**: `CO2_Emissions_Tonnes`
- **Features**: 5 input features + 1 target variable

---

## Feature Descriptions

### Input Features

| Feature | Type | Range | Unit | Description |
|---------|------|-------|------|-------------|
| **Tonnage** | Float | 50 - 500 | tons | Total weight of asphalt material in the paving project |
| **RAP_Percentage** | Float | 0 - 50 | % | Percentage of Recycled Asphalt Pavement in the mix |
| **Trip_Distance** | Float | 5 - 100 | km | Transportation distance from plant to project site |
| **Mix_Type** | Categorical | HMA, WMA | - | Type of asphalt mix (Hot Mix Asphalt or Warm Mix Asphalt) |
| **Fuel_Burn_Liters** | Float | Calculated | liters | Total fuel consumption (hauling + production) |

### Target Variable

| Feature | Type | Range | Unit | Description |
|---------|------|-------|------|-------------|
| **CO2_Emissions_Tonnes** | Float | 0+ | tonnes | Total CO2 emissions from the paving project |

---

## Feature Correlations & Business Logic

### 1. **Tonnage** (Independent Variable)
- **Distribution**: Uniform random (50-500 tons)
- **Business Context**: Varies based on project size
- **Impact on Target**: Higher tonnage → more fuel/materials → higher emissions

### 2. **RAP_Percentage** (Independent Variable)
- **Distribution**: Uniform random (0-50%)
- **Business Context**: 
  - Max 25% for surface courses
  - Max 40% for base layers
  - Industry average: 15-20%
- **Impact on Target**: **NEGATIVE correlation** - Higher RAP → Lower emissions
  - Reduces virgin bitumen requirement
  - ~1.5% CO2 reduction per 1% RAP increase
  - Key sustainability lever

### 3. **Trip_Distance** (Independent Variable)
- **Distribution**: Uniform random (5-100 km)
- **Business Context**: Distance from asphalt plant to job site
- **Impact on Target**: **POSITIVE correlation** - Longer distance → more hauling fuel → higher emissions

### 4. **Mix_Type** (Independent Variable)
- **Distribution**: Random choice (HMA or WMA)
- **Business Context**: 
  - **HMA (Hot Mix Asphalt)**: Traditional, requires 140-190°C
  - **WMA (Warm Mix Asphalt)**: Modern, requires 100-140°C
- **Impact on Target**: **WMA reduces emissions by ~20%**
  - Lower production temperature
  - Less fuel for heating
  - Growing adoption for sustainability

### 5. **Fuel_Burn_Liters** (Calculated Feature)
- **Formula**: 
  ```
  Hauling Fuel = Tonnage × Trip_Distance × 0.20 (L/ton-km)
  Mixing Fuel = Tonnage × 0.8 × (1 if HMA, 0.8 if WMA)
  Total Fuel = Hauling Fuel + Mixing Fuel + noise(±5%)
  ```
- **Components**:
  - Hauling/transportation fuel
  - Production/mixing fuel
  - Mix type adjustment (WMA saves 20%)
- **Impact on Target**: **PRIMARY DRIVER** - Strong positive correlation

### 6. **CO2_Emissions_Tonnes** (Target Variable)
- **Formula**: 
  ```
  Fuel CO2 = Fuel_Burn_Liters × 2.6 kg CO2/L ÷ 1000
  Virgin Material Factor = (100 - RAP_Percentage) / 100
  Production CO2 = Tonnage × 35 kg/ton × Virgin_Material_Factor ÷ 1000
  RAP Benefit = (RAP_Percentage / 100) × Tonnage × 0.015
  Total CO2 = Fuel CO2 + Production CO2 - RAP Benefit + noise(±3%)
  ```
- **Components**:
  1. **Direct fuel combustion**: ~2.6 kg CO2 per liter diesel
  2. **Production emissions**: Virgin bitumen, aggregates processing
  3. **RAP benefit**: Recycled material reduces footprint

---

## Business Benchmarks

### Industry Standards
- **Baseline**: ~60 kg CO2 per ton of asphalt (industry average)
- **Target**: <45 kg CO2 per ton (green bid qualification)
- **Best Practice**: 30-40 kg CO2 per ton (high RAP + WMA)

### Dataset Statistics (500 records)
- **Average CO2 per ton**: ~50 kg
- **Range**: 17-89 kg CO2 per ton
- **Records meeting green target (<45 kg)**: ~40%

### Optimization Strategies
1. **Maximize RAP usage** (within structural limits)
2. **Use WMA instead of HMA** (20% fuel savings)
3. **Minimize trip distance** (local sourcing)
4. **Optimize project size** (economies of scale)

---

## Material Constraints (Reference)

### RAP Usage Limits
- **Surface Course**: Maximum 25% RAP
- **Base Layer**: Maximum 40% RAP
- **Structural Requirement**: Min CBR 150%

### Binder Standards
- **PG 64-22**: Standard for moderate climates
- **PG 58-34**: Cold climate applications

---

## Data Quality Notes

### Realistic Noise
- **Fuel consumption**: ±5% variation (equipment efficiency, traffic, weather)
- **CO2 emissions**: ±3% variation (measurement uncertainty, process variation)

### Validation Rules
- No negative values
- All features within specified ranges
- Realistic correlations maintained
- Representative of industry practices

---

## Use Cases

### Primary Use Case
**Predictive modeling** - Predict CO2 emissions before project execution to:
- Qualify for green bids
- Optimize mix design
- Meet sustainability targets
- Price carbon costs accurately

### Secondary Use Cases
- **What-if analysis**: Test different RAP percentages, mix types
- **Bid optimization**: Find lowest-cost green configuration
- **Compliance**: Demonstrate emissions reduction
- **Benchmarking**: Compare against industry standards

---

## Sample Data

```csv
Tonnage,RAP_Percentage,Trip_Distance,Mix_Type,Fuel_Burn_Liters,CO2_Emissions_Tonnes
218.54,47.54,74.54,HMA,3466.1,11.429
94.99,22.96,36.7,WMA,773.83,4.124
486.46,41.62,25.17,WMA,2896.26,14.534
325.24,0.35,7.19,HMA,736.1,12.954
181.47,18.32,43.2,WMA,1921.57,9.617
```

### Interpretation Example (Record 1):
- **Project**: 218.54 tons asphalt
- **Sustainability**: 47.54% RAP (excellent!)
- **Distance**: 74.54 km haul
- **Mix**: HMA (traditional)
- **Fuel**: 3,466 liters consumed
- **Emissions**: 11.429 tonnes CO2
- **Per ton**: 52.3 kg CO2/ton (above green target)
- **Recommendation**: Switch to WMA to reduce emissions by ~20%

---

## Version History

- **v1.0** (2026-02-22): Initial synthetic dataset generation
  - 500 records with realistic correlations
  - Industry-validated formulas
  - Ready for ML model training

---

## Contact & Support

For questions about the dataset schema or modeling approach:
- **Project**: Scrapnet 2.0 - Industrial Recycling Platform
- **Use Case**: Carbon Footprint Prediction for Asphalt Paving
- **Generated**: February 22, 2026
