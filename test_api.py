import urllib.request
import json
import urllib.parse

apiKey = 'f15b7ad9efab6381'
codes = ['B009', 'B010', 'B011', 'B001', 'B002', 'B003', 'B008', 'B004', 'B005', 'B006']

# Method 1: comma separated
url1 = f"https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key={apiKey}&budget={','.join(codes)}&format=json&count=1&keyword=" + urllib.parse.quote('東京')
try:
    res1 = urllib.request.urlopen(url1).read()
    data1 = json.loads(res1)
    print("Method 1 (comma) items found:", data1['results']['results_available'])
except Exception as e:
    print("Method 1 failed:", e)

# Method 2: repeated params
url2 = f"https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key={apiKey}" + "".join([f"&budget={c}" for c in codes]) + "&format=json&count=1&keyword=" + urllib.parse.quote('東京')
try:
    res2 = urllib.request.urlopen(url2).read()
    data2 = json.loads(res2)
    print("Method 2 (repeat) items found:", data2['results']['results_available'])
except Exception as e:
    print("Method 2 failed:", e)
