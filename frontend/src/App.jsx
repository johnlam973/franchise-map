import React, { useState, useEffect } from 'react';
import './App.css';
import MapComponent from './MapComponent';

function App() {
  // 状态管理
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    radius: 3
  });
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 地址地理编码
  const geocodeAddress = async (address) => {
    if (!address.trim()) return null;
    
    setGeocoding(true);
    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
      const result = await response.json();
      
      if (response.ok) {
        return result;
      } else {
        setMessage(`❌ 地址解析失败: ${result.error}`);
        return null;
      }
    } catch (error) {
      setMessage(`❌ 地址解析错误: ${error.message}`);
      return null;
    } finally {
      setGeocoding(false);
    }
  };

  // 提交表单数据到后端
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setMessage('请填写加盟店名字');
      return;
    }

    if (!formData.address.trim() && (!formData.latitude || !formData.longitude)) {
      setMessage('请填写地址或经纬度坐标');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      let submitData = { ...formData };

      // 如果输入了地址，进行地理编码
      if (formData.address.trim()) {
        const geocodeResult = await geocodeAddress(formData.address);
        if (!geocodeResult) {
          setLoading(false);
          return;
        }
        submitData.latitude = geocodeResult.latitude;
        submitData.longitude = geocodeResult.longitude;
      } else {
        // 使用用户输入的经纬度
        submitData.latitude = parseFloat(formData.latitude);
        submitData.longitude = parseFloat(formData.longitude);
      }

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('✅ 数据提交成功！');
        // 清空表单
        setFormData({ name: '', address: '', latitude: '', longitude: '', radius: 3 });
        // 刷新数据列表
        fetchData();
      } else {
        setMessage(`❌ 提交失败: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ 网络错误: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 从后端获取数据
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data');
      const result = await response.json();

      if (response.ok) {
        console.log('Fetched data:', result.data);
        setDataList(result.data);
      } else {
        setMessage(`❌ 获取数据失败: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ 网络错误: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 处理位置更新
  const handleLocationUpdate = (updatedLocations) => {
    setDataList(updatedLocations);
    setMessage('📍 位置已更新');
    
    // 自动保存数据
    autoSaveData(updatedLocations);
  };

  // 自动保存数据
  const autoSaveData = async (locations) => {
    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: locations })
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ 数据自动保存成功');
        setMessage(prev => prev + ' (已自动保存)');
      } else {
        console.error('❌ 自动保存失败:', result.error);
        setMessage('❌ 自动保存失败，请手动保存');
      }
    } catch (error) {
      console.error('❌ 自动保存网络错误:', error.message);
      setMessage('❌ 自动保存失败，请手动保存');
    }
  };

  // 删除加盟店
  const handleDeleteLocation = (index) => {
    const updatedList = dataList.filter((_, i) => i !== index);
    setDataList(updatedList);
    setMessage('🗑️ 加盟店已删除');
    
    // 自动保存数据
    autoSaveData(updatedList);
  };

  // 保存数据到CSV
  const handleSaveData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: dataList })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('✅ 数据保存成功！');
      } else {
        setMessage(`❌ 保存失败: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ 网络错误: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏪 加盟地图管理系统</h1>
      </header>

      <main className="App-main">
        {/* 数据提交表单 */}
        <section className="form-section">
          <h2>📝 添加新加盟商</h2>
          <form onSubmit={handleSubmit} className="data-form">
            <div className="form-group">
              <label htmlFor="name">店名:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="请输入加盟商姓名"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">地址 (可选):</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="例如: Jalan Ampang, Kuala Lumpur"
              />
            </div>

            <div className="coordinates-group">
              <div className="form-group">
                <label htmlFor="latitude">纬度:</label>
                <input
                  type="number"
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  step="any"
                  placeholder="例如: 3.1390"
                />
              </div>

              <div className="form-group">
                <label htmlFor="longitude">经度:</label>
                <input
                  type="number"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  step="any"
                  placeholder="例如: 101.6869"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="radius">服务半径 (公里):</label>
              <input
                type="number"
                id="radius"
                name="radius"
                value={formData.radius}
                onChange={handleInputChange}
                min="1"
                max="50"
                step="0.5"
                placeholder="3"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || geocoding}
              className="submit-btn"
            >
              {loading ? '提交中...' : geocoding ? '解析地址中...' : '添加加盟商'}
            </button>
          </form>

          {message && (
            <div className={`message ${message.includes('成功') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </section>

        {/* 地图显示 */}
        <section className="map-section">
          <h2>🗺️ 加盟商地图</h2>
          <MapComponent 
            locations={dataList} 
            onLocationUpdate={handleLocationUpdate}
          />
        </section>

        {/* 数据展示区域 */}
        <section className="data-section">
          <div className="data-header">
            <h2>📊 加盟商列表</h2>
            <div className="header-controls">
              <div className="legend-info">
                <div className="legend-item">
                  <div className="legend-marker"></div>
                  <span>地图标记</span>
                </div>
                <div className="legend-item">
                  <div className="legend-circle"></div>
                  <span>服务半径</span>
                </div>
              </div>
              <button 
                onClick={fetchData} 
                disabled={loading}
                className="refresh-btn"
              >
                {loading ? '加载中...' : '🔄 刷新数据'}
              </button>
              <button 
                onClick={handleSaveData} 
                disabled={loading}
                className="save-btn"
              >
                {loading ? '保存中...' : '💾 保存数据'}
              </button>
            </div>
          </div>

          {dataList.length === 0 ? (
            <div className="empty-state">
              <p>暂无加盟商数据，请先添加一些加盟商信息</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>店名</th>
                    <th>地址</th>
                    <th>辐射半径</th>
                    <th>坐标</th>
                    <th>添加时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {dataList.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="location-indicator">
                          <div className="location-marker" style={{ backgroundColor: '#FF6B6B' }}></div>
                          {index + 1}
                        </div>
                      </td>
                      <td>{item.name}</td>
                      <td>{item.address || '直接输入坐标'}</td>
                      <td>
                        <div className="radius-display">
                          <div className="radius-circle" style={{ backgroundColor: 'rgba(255, 107, 107, 0.2)', borderColor: '#FF6B6B' }}></div>
                          {item.radius}km
                        </div>
                      </td>
                      <td>
                        {item.latitude && item.longitude ? 
                          `${parseFloat(item.latitude).toFixed(4)}, ${parseFloat(item.longitude).toFixed(4)}` : 
                          '未解析'
                        }
                      </td>
                      <td>{item.timestamp}</td>
                      <td>
                        <button 
                          onClick={() => handleDeleteLocation(index)}
                          className="delete-btn"
                          title="删除加盟店"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="data-summary">
                共 {dataList.length} 个加盟商
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="App-footer">
        <p>© 2024 加盟地图项目 - 本地开发版本</p>
      </footer>
    </div>
  );
}

export default App; 