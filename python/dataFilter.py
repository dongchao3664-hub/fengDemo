import json
import uuid
from pyproj import Transformer

# ========= 坐标转换器 =========
# CGCS2000 / 3°带 / 中央经线120°
transformer = Transformer.from_crs(
    "EPSG:4547",
    "EPSG:4326",
    always_xy=True
)

# ========= 图层 → type =========
LAYER_TYPE = {
    "H4-掩埋": 1,
    "H4-裸露": 2
}

segments = {}
current_segment = None

# ========= 解析 TXT =========
with open("D:\\codeproject\\fangruan\\fengchang\\文件\\数据\\H4-部分海缆_顶点信息.txt", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue

        # 示例：识别图层 + 句柄
        if "H4-" in line and "(" in line and ")" in line:
            layer = "H4-掩埋" if "掩埋" in line else "H4-裸露"
            handle = line[line.find("(")+1:line.find(")")]
            seg_id = handle if handle else str(uuid.uuid4())

            current_segment = {
                "id": seg_id,
                "name": f"{layer}-{seg_id}",
                "type": LAYER_TYPE[layer],
                "layer": layer,
                "points": []
            }
            segments[seg_id] = current_segment
            continue

        # 示例：解析坐标（需与你 TXT 实际格式对齐）
        try:
            x, y, z = map(float, line.split(","))
            lon, lat = transformer.transform(x, y)

            current_segment["points"].append({
                "lon": round(lon, 8),
                "lat": round(lat, 8),
                "alt": z,
                "raw": {
                    "x": x,
                    "y": y,
                    "z": z
                }
            })
        except Exception:
            pass

# ========= 输出 JSON =========
result = {
    "crs": {
        "source": "CGCS2000",
        "sourceEpsg": 4547,
        "target": "WGS84",
        "targetEpsg": 4326
    },
    "segments": list(segments.values())
}

with open("H4_cable.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("转换完成：H4_cable.json")
