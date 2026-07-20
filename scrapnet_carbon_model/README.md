# Scrapnet 2.0 - Carbon Footprint Prediction Model

## 🎯 Project Overview

This project implements a predictive modeling system for estimating CO2 emissions in asphalt paving projects. It's part of **Scrapnet 2.0**, an industrial recycling platform for the asphalt industry.

### Business Problem
- Asphalt paving projects need to predict carbon footprint to qualify for **green bids**
- Industry baseline: ~60 kg CO2 per ton
- Green bid target: **<45 kg CO2 per ton**
- Key variables: RAP usage, mix type (HMA vs WMA), transportation distance

### Solution
Machine learning model trained on synthetic data to predict `CO2_Emissions_Tonnes` based on:
- Project tonnage
- RAP (Recycled Asphalt Pavement) percentage
- Transportation distance
- Mix type (Hot vs Warm Mix Asphalt)
- Fuel consumption

---

## 📁 Project Structure

```
scrapnet_carbon_model/
│
├── asphalt_carbon_data.csv          # Synthetic dataset (500 records)
├── generate_dataset.py               # Dataset generation script
├── setup_abacus_project.py          # Abacus.AI project setup & training
├── model_deployment_info.txt        # Deployment details (generated after setup)
│
├── DATASET_SCHEMA.md                # Detailed schema documentation
└── README.md                        # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Abacus.AI account with API access
- Required packages: `abacusai`, `pandas`, `numpy`

### Step 1: Generate Synthetic Dataset
```bash
python generate_dataset.py
```

This creates `asphalt_carbon_data.csv` with 500 synthetic records.

### Step 2: Set Up Abacus.AI Project
```bash
python setup_abacus_project.py
```

This script will:
1. ✅ Create a new project in Abacus.AI
2. ✅ Upload the dataset
3. ✅ Configure feature mappings
4. ✅ Train the regression model
5. ✅ Deploy the model
6. ✅ Save deployment information

**Note**: Model training may take 15-30 minutes depending on Abacus.AI's automated ML process.

### Step 3: Review Deployment Info
After successful setup, check `model_deployment_info.txt` for:
- Project ID
- Dataset ID
- Model ID
- Deployment ID
- API usage examples

---

## 📊 Dataset Details

### Features (5 input variables)
| Feature | Type | Range | Description |
|---------|------|-------|-------------|
| **Tonnage** | Float | 50-500 tons | Project size |
| **RAP_Percentage** | Float | 0-50% | Recycled content |
| **Trip_Distance** | Float | 5-100 km | Haul distance |
| **Mix_Type** | Categorical | HMA/WMA | Mix technology |
| **Fuel_Burn_Liters** | Float | Calculated | Total fuel used |

### Target Variable
- **CO2_Emissions_Tonnes**: Total carbon emissions (tonnes)

### Key Correlations
- ⬆️ **Higher RAP** → ⬇️ Lower emissions (saves virgin materials)
- ⬆️ **WMA vs HMA** → ⬇️ 20% less fuel consumption
- ⬆️ **Longer distance** → ⬆️ Higher emissions
- ⬆️ **More fuel** → ⬆️ Higher emissions (primary driver)

See [DATASET_SCHEMA.md](DATASET_SCHEMA.md) for complete documentation.

---

## 🔮 Making Predictions

Once deployed, use the Abacus.AI API to make real-time predictions:

```python
import abacusai

# Initialize client
client = abacusai.ApiClient()

# Make prediction
prediction = client.predict(
    deployment_id="YOUR_DEPLOYMENT_ID",
    query_data={
        "Tonnage": 250.0,
        "RAP_Percentage": 30.0,
        "Trip_Distance": 50.0,
        "Mix_Type": "WMA",
        "Fuel_Burn_Liters": 2000.0
    }
)

print(f"Predicted CO2: {prediction['CO2_Emissions_Tonnes']} tonnes")
print(f"CO2 per ton: {prediction['CO2_Emissions_Tonnes'] * 1000 / 250.0:.2f} kg")
```

---

## 📈 Business Impact

### Optimization Strategies
1. **Maximize RAP usage** (within structural limits: 25% surface, 40% base)
2. **Prefer WMA over HMA** (20% fuel savings)
3. **Minimize transportation distance** (local sourcing)
4. **Optimize batch sizes** (economies of scale)

### ROI Indicators
- **Green bid qualification**: Projects <45 kg CO2/ton
- **Cost savings**: Reduced virgin material usage
- **Compliance**: Meet sustainability regulations
- **Reputation**: Environmental leadership

---

## 🛠️ Technical Details

### Modeling Approach
- **Algorithm**: Automated ML (Abacus.AI selects best algorithm)
- **Type**: Regression
- **Training Data**: 500 synthetic records
- **Validation**: Built-in cross-validation
- **Deployment**: Real-time API endpoint

### Data Generation Formula

**Fuel Consumption:**
```
Hauling = Tonnage × Distance × 0.20 L/ton-km
Mixing = Tonnage × 0.8 × (1.0 for HMA, 0.8 for WMA)
Total Fuel = Hauling + Mixing ± 5% noise
```

**CO2 Emissions:**
```
Fuel CO2 = Fuel × 2.6 kg/L
Virgin Factor = (100 - RAP%) / 100
Production CO2 = Tonnage × 35 kg/ton × Virgin Factor
RAP Benefit = (RAP% / 100) × Tonnage × 0.015
Total CO2 = (Fuel CO2 + Production CO2 - RAP Benefit) ± 3% noise
```

---

## 📚 Documentation

- **[DATASET_SCHEMA.md](DATASET_SCHEMA.md)**: Complete dataset documentation
- **model_deployment_info.txt**: Deployment details (generated after setup)

---

## 🔄 Next Steps

1. **Test the Model**: Run predictions with various scenarios
2. **Integrate API**: Connect to Scrapnet 2.0 platform
3. **Collect Real Data**: Replace synthetic data with actual projects
4. **Monitor Performance**: Track prediction accuracy
5. **Retrain Periodically**: Update model with new data

---

## ⚠️ Important Notes

### Material Constraints
- **Max RAP**: 25% (surface), 40% (base)
- **Min CBR**: 150%
- **Binder**: PG 64-22 or PG 58-34

### Data Limitations
- Current dataset is **synthetic** for bootstrap training
- Replace with real-world data for production use
- Model accuracy improves with actual project data

---

## 📞 Support

For issues or questions:
1. Check `model_deployment_info.txt` for deployment details
2. Review [DATASET_SCHEMA.md](DATASET_SCHEMA.md) for data questions
3. Consult Abacus.AI documentation for API details

---

## 📝 Version

- **Version**: 1.0
- **Date**: February 22, 2026
- **Status**: Bootstrap dataset and initial model deployment
- **Next Release**: Integration with real project data

---

## 🌍 Environmental Impact

This model supports the asphalt industry's transition to sustainable practices:
- ♻️ Promotes RAP usage (reduces landfill waste)
- 🌡️ Encourages WMA adoption (lower energy use)
- 📉 Quantifies carbon reduction (transparency)
- 🏆 Enables green competitive advantage

**Target**: Help asphalt contractors reduce industry CO2 emissions by 25% through data-driven optimization.

---

*Built with Abacus.AI - Predictive Modeling Platform*
