"""
Simple test script to debug the setup process
"""

import abacusai
import time

client = abacusai.ApiClient()

TABLE_NAME = f"asphalt_carbon_test_{int(time.time())}"

print("="*80)
print("Step 1: Creating Project")
print("="*80)

try:
    project = client.create_project(
        name="Test Carbon Prediction",
        use_case="AI_AGENT"
    )
    print(f"✓ Project created: {project.project_id}")
except Exception as e:
    print(f"✗ Error: {e}")
    exit(1)

print("\n" + "="*80)
print("Step 2: Uploading Dataset")
print("="*80)

try:
    print(f"  Table name: {TABLE_NAME}")
    upload = client.create_dataset_from_upload(
        table_name=TABLE_NAME,
        file_format="CSV"
    )
    print(f"✓ Upload created")
    print(f"  Upload ID: {upload.upload_id}")
    print(f"  Dataset ID: {upload.dataset_id}")
    
    # Upload file
    print("  Reading file...")
    with open("asphalt_carbon_data.csv", 'rb') as f:
        data = f.read()
    print(f"  File size: {len(data)} bytes")
    
    print("  Uploading...")
    client.upload_part(
        upload_id=upload.upload_id,
        part_number=1,
        part_data=data
    )
    print("  ✓ Upload complete")
    
    print("  Marking upload complete...")
    client.mark_upload_complete(upload_id=upload.upload_id)
    print("  ✓ Marked complete")
    
    print(f"\nDataset ID: {upload.dataset_id}")
    print("Success!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
