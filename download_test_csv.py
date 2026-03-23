import requests
import os

# First, let's explore the repository structure
api_url = 'https://api.github.com/repos/JMViJi/Binary-Classification-of-Machine-Failures/contents/'

try:
    print("Scanning repository...")
    response = requests.get(api_url, timeout=10)
    if response.status_code == 200:
        files = response.json()
        print("\nRepository contents:")
        for item in files:
            if isinstance(item, dict):
                file_type = '[DIR]' if item['type'] == 'dir' else '[FILE]'
                print(f"{file_type} {item['name']}")
                
        # Look for test.csv or common directories
        test_csv_url = None
        for item in files:
            if isinstance(item, dict) and item['name'] == 'test.csv':
                test_csv_url = item['download_url']
                break
            elif isinstance(item, dict) and item['type'] == 'dir' and item['name'] in ['data', 'datasets', 'csv']:
                # Check subdirectory
                sub_url = f'https://api.github.com/repos/JMViJi/Binary-Classification-of-Machine-Failures/contents/{item["name"]}'
                sub_response = requests.get(sub_url, timeout=10)
                if sub_response.status_code == 200:
                    sub_files = sub_response.json()
                    for sub_item in sub_files:
                        if isinstance(sub_item, dict) and sub_item['name'] == 'test.csv':
                            test_csv_url = sub_item['download_url']
                            break
        
        if test_csv_url:
            print(f"\nFound test.csv! Downloading from: {test_csv_url}")
            response = requests.get(test_csv_url, timeout=30)
            with open('docs/test.csv', 'wb') as f:
                f.write(response.content)
            stat = os.stat('docs/test.csv')
            print(f"✅ Downloaded successfully")
            print(f"   File: test.csv")
            print(f"   Size: {stat.st_size:,} bytes")
        else:
            print("\n❌ test.csv not found in repository")
    else:
        print(f"API Error: {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
