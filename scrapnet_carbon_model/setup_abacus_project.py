#!/usr/bin/env python3
"""
Scrapnet 2.0 - Abacus.AI Project Setup Script
Sets up an AI Agent with Python Model for CO2 emissions prediction
"""

import abacusai
import time
import os
from datetime import datetime

# Configuration
PROJECT_NAME = "Scrapnet 2.0 - Carbon Footprint Prediction"
CSV_FILE_PATH = "asphalt_carbon_data.csv"
TARGET_COLUMN = "CO2_Emissions_Tonnes"

def print_section(title):
    """Print a formatted section header"""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def main():
    # Initialize client
    print("Initializing Abacus.AI client...")
    client = abacusai.ApiClient()
    print("✓ Client initialized")
    
    # Generate unique table name
    TABLE_NAME = f"asphalt_carbon_data_{int(time.time())}"
    
    print_section("Scrapnet 2.0 - Abacus.AI Project Setup")
    print(f"Project Name: {PROJECT_NAME}")
    print(f"Dataset: {CSV_FILE_PATH}")
    print(f"Table Name: {TABLE_NAME}")
    
    # Step 1: Create Project
    print_section("Step 1: Creating AI Agent Project")
    try:
        project = client.create_project(
            name=PROJECT_NAME,
            use_case="AI_AGENT"
        )
        project_id = project.project_id
        print(f"✓ Project created successfully!")
        print(f"  Project ID: {project_id}")
    except Exception as e:
        print(f"✗ Error creating project: {e}")
        return
    
    # Step 2: Upload Dataset
    print_section("Step 2: Uploading Dataset")
    try:
        # Check file exists
        if not os.path.exists(CSV_FILE_PATH):
            print(f"✗ Error: File '{CSV_FILE_PATH}' not found!")
            return
        
        # Create upload
        print(f"  Creating dataset upload...")
        upload = client.create_dataset_from_upload(
            table_name=TABLE_NAME,
            file_format="CSV"
        )
        upload_id = upload.upload_id
        dataset_id = upload.dataset_id
        print(f"✓ Upload created")
        print(f"  Upload ID: {upload_id}")
        print(f"  Dataset ID: {dataset_id}")
        
        # Read and upload file
        print("  Reading and uploading file...")
        with open(CSV_FILE_PATH, 'rb') as f:
            file_data = f.read()
        
        client.upload_part(
            upload_id=upload_id,
            part_number=1,
            part_data=file_data
        )
        print("  ✓ File uploaded")
        
        # Mark complete
        client.mark_upload_complete(upload_id=upload_id)
        print("  ✓ Upload marked complete")
        
    except Exception as e:
        print(f"✗ Error uploading dataset: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 3: Save deployment info
    print_section("Step 3: Saving Project Information")
    
    deployment_info = f"""
================================================================================
SCRAPNET 2.0 - PROJECT SETUP INFORMATION
================================================================================
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

PROJECT DETAILS
--------------------------------------------------------------------------------
Project Name:     {PROJECT_NAME}
Project ID:       {project_id}
Use Case:         AI_AGENT

DATASET DETAILS
--------------------------------------------------------------------------------
Dataset ID:       {dataset_id}
Table Name:       {TABLE_NAME}
Local File:       {CSV_FILE_PATH}
Records:          500
Features:         5 input features
Target:           {TARGET_COLUMN}

Feature Descriptions:
  - Tonnage: Amount of asphalt material (50-500 tons)
  - RAP_Percentage: Recycled Asphalt Pavement percentage (0-50%)
  - Trip_Distance: Transportation distance (5-100 km)
  - Mix_Type: Asphalt mix type (HMA or WMA)
  - Fuel_Burn_Liters: Total fuel consumption (calculated)

NEXT STEPS
--------------------------------------------------------------------------------
The dataset has been uploaded to Abacus.AI. To complete the model training:

1. Visit the Abacus.AI platform: https://apps.abacus.ai

2. Navigate to your project: {PROJECT_NAME}
   Project ID: {project_id}

3. Create a Feature Group:
   - Go to Feature Groups section
   - Create new feature group from dataset: {TABLE_NAME}
   - SQL: SELECT * FROM {TABLE_NAME}

4. Create a Python Model for regression:
   - Use the provided model code in python_model_code.txt
   - Set training input to the feature group created in step 3
   - Target variable: {TARGET_COLUMN}

5. Deploy the model:
   - Once training completes, create a deployment
   - Name: "Scrapnet Carbon Prediction API"
   - Save the deployment ID and token for API access

BUSINESS IMPACT
--------------------------------------------------------------------------------
Target Threshold:  < 45 kg CO2 per ton (green bid advantage)
Industry Baseline: ~60 kg CO2 per ton

Use this model to:
  ✓ Predict carbon footprint of paving projects
  ✓ Optimize RAP usage and mix type selection
  ✓ Qualify for green bid advantages
  ✓ Meet sustainability targets

================================================================================
"""
    
    try:
        with open('model_deployment_info.txt', 'w') as f:
            f.write(deployment_info)
        print("✓ Project information saved to: model_deployment_info.txt")
    except Exception as e:
        print(f"✗ Error saving info: {e}")
    
    print_section("Setup Complete!")
    print("✓ Dataset uploaded successfully!")
    print(f"\nProject ID:  {project_id}")
    print(f"Dataset ID:  {dataset_id}")
    print(f"Table Name:  {TABLE_NAME}")
    print(f"\nSee 'model_deployment_info.txt' for next steps.")

if __name__ == "__main__":
    main()
