import sys
try:
    import pandas as pd
    df = pd.read_excel(sys.argv[1])
    print(df.to_markdown())
except ImportError:
    import urllib.request
    print("pandas not installed. Doing nothing to avoid modifying environment.")
except Exception as e:
    import traceback
    traceback.print_exc()
