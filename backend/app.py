from flask import Flask, request, jsonify
from flask_cors import CORS
import csv
import os
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app)  # 启用跨域支持

# 确保数据目录存在
DATA_DIR = '../data'
CSV_FILE = os.path.join(DATA_DIR, 'data.csv')

# 创建数据目录和 CSV 文件（如果不存在）
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# 如果 CSV 文件不存在，创建带表头的空文件
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, 'w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(['name', 'address', 'latitude', 'longitude', 'radius', 'circleCenterLng', 'circleCenterLat', 'timestamp'])

@app.route('/api/submit', methods=['POST'])
def submit_data():
    """接收前端提交的数据并保存到 CSV 文件"""
    try:
        data = request.get_json()
        name = data.get('name', '')
        address = data.get('address', '')
        latitude = data.get('latitude', '')
        longitude = data.get('longitude', '')
        radius = data.get('radius', 3)  # 默认3km
        
        # 验证数据
        if not name:
            return jsonify({'error': '姓名不能为空'}), 400
        
        # 添加新数据到 CSV 文件
        new_row = [name, address, latitude, longitude, radius, '', '', datetime.now().strftime('%Y-%m-%d %H:%M:%S')]
        
        with open(CSV_FILE, 'a', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(new_row)
        
        return jsonify({
            'message': '数据保存成功',
            'data': {
                'name': name,
                'address': address,
                'latitude': latitude,
                'longitude': longitude,
                'radius': radius,
                'timestamp': new_row[5]
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'保存数据失败: {str(e)}'}), 500

@app.route('/api/data', methods=['GET'])
def get_data():
    """获取 CSV 文件中的所有数据"""
    try:
        data = []
        with open(CSV_FILE, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # 确保所有字段都存在，为旧数据添加默认值
                processed_row = {
                    'name': row.get('name', ''),
                    'address': row.get('address', ''),
                    'latitude': row.get('latitude', ''),
                    'longitude': row.get('longitude', ''),
                    'radius': row.get('radius', 3),
                    'circleCenterLng': row.get('circleCenterLng', ''),
                    'circleCenterLat': row.get('circleCenterLat', ''),
                    'timestamp': row.get('timestamp', '')
                }
                data.append(processed_row)
        
        return jsonify({
            'data': data,
            'count': len(data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'获取数据失败: {str(e)}'}), 500

@app.route('/api/geocode', methods=['GET'])
def geocode_address():
    """地址地理编码接口"""
    try:
        address = request.args.get('address', '')
        if not address:
            return jsonify({'error': '地址不能为空'}), 400
        
        # 使用 OpenStreetMap Nominatim API
        url = f"https://nominatim.openstreetmap.org/search"
        params = {
            'q': address,
            'format': 'json',
            'limit': 1
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        if data:
            location = data[0]
            return jsonify({
                'latitude': float(location['lat']),
                'longitude': float(location['lon']),
                'display_name': location['display_name']
            }), 200
        else:
            return jsonify({'error': '未找到该地址'}), 404
            
    except Exception as e:
        return jsonify({'error': f'地理编码失败: {str(e)}'}), 500

@app.route('/api/save', methods=['POST'])
def save_data():
    """保存数据到 CSV 文件"""
    try:
        data = request.get_json()
        locations = data.get('data', [])
        
        # 重写整个 CSV 文件
        with open(CSV_FILE, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            # 写入表头
            writer.writerow(['name', 'address', 'latitude', 'longitude', 'radius', 'circleCenterLng', 'circleCenterLat', 'timestamp'])
            
            # 写入数据
            for location in locations:
                row = [
                    location.get('name', ''),
                    location.get('address', ''),
                    location.get('latitude', ''),
                    location.get('longitude', ''),
                    location.get('radius', 3),
                    location.get('circleCenterLng', ''),
                    location.get('circleCenterLat', ''),
                    location.get('timestamp', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
                ]
                writer.writerow(row)
        
        return jsonify({
            'message': '数据保存成功',
            'count': len(locations)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'保存数据失败: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({'status': 'ok', 'message': 'Flask 后端运行正常'}), 200

if __name__ == '__main__':
    print("🚀 Flask 后端服务启动中...")
    print(f"📁 数据文件路径: {CSV_FILE}")
    print("🌐 服务地址: http://localhost:5000")
    print("📋 API 接口:")
    print("   - POST /api/submit - 提交数据")
    print("   - GET  /api/data   - 获取数据")
    print("   - POST /api/save   - 保存数据")
    print("   - GET  /api/health - 健康检查")
    print("-" * 50)
    
    app.run(debug=True, host='0.0.0.0', port=5000) 