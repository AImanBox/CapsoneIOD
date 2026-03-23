import requests

# Check what's in the 'input' and 'data' directories
directories = ['input', 'data']

for dirname in directories:
    api_url = f'https://api.github.com/repos/JMViJi/Binary-Classification-of-Machine-Failures/contents/{dirname}'
    try:
        response = requests.get(api_url, timeout=10)
        if response.status_code == 200:
            files = response.json()
            print(f'\nContents of /{dirname}:')
            for item in files:
                if isinstance(item, dict):
                    file_type = '[DIR]' if item['type'] == 'dir' else '[FILE]'
                    name = item.get('name', 'unknown')
                    print(f'  {file_type} {name}')
                    
                    # Check if this is test.csv
                    if name == 'test.csv' and item.get('type') == 'file':
                        print(f"    -> Found test.csv! Download URL: {item.get('download_url')}")
    except Exception as e:
        print(f'Error checking {dirname}: {e}')
