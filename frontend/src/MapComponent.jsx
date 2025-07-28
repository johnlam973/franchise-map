import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapComponent.css';

const MapComponent = ({ locations, onLocationUpdate }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const circles = useRef([]);
  const circleCenterMarkers = useRef([]);
  const [draggingCircle, setDraggingCircle] = useState(null);

  // MapTiler 配置
  const MAPTILER_KEY = 'p2qTnZlQN4AacQOfwNmd';
  const MAP_STYLE = `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`;

  useEffect(() => {
    if (map.current) return; // 防止重复初始化

    // 设置全局函数
    window.deleteLocation = deleteLocation;
    window.moveCircleCenter = (index) => {
      setDraggingCircle(index);
      // 创建可拖拽的圆圈中心标记
      createDraggableCircleCenter(index);
    };
    window.resetCircleCenter = (index) => {
      // 重置圆圈中心到加盟店位置
      const location = locations[index];
      const storeLng = parseFloat(location.longitude);
      const storeLat = parseFloat(location.latitude);
      
      // 更新圆圈中心位置
      updateLocationCircleCenter(index, storeLng, storeLat);
      
      // 更新圆圈显示
      updateCircleCenter(index, [storeLng, storeLat]);
      
      // 清除圆圈中心标记
      clearCircleCenterMarkers();
      
      console.log(`圆圈中心已重置到加盟店位置: [${storeLng}, ${storeLat}]`);
    };

    // 初始化地图
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [107.9758, 4.2105], // 马来西亚中心坐标
      zoom: 5
    });

    // 添加地图控件
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');
    
    // 添加比例尺控件
    map.current.addControl(new maplibregl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-left');

    // 地图加载完成后添加标记
    map.current.on('load', () => {
      updateMarkers();
      
      console.log('地图加载完成');
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

    // 更新标记和圆圈
  const updateMarkers = () => {
    console.log('updateMarkers called', { 
      mapExists: !!map.current, 
      styleLoaded: map.current?.isStyleLoaded(),
      locationsCount: locations.length,
      locations: locations 
    });
    
    if (!map.current || !map.current.isStyleLoaded()) {
      console.log('Map not ready, skipping marker update');
      return;
    }

    // 清除现有标记和圆圈
    markers.current.forEach(marker => marker.remove());
    circles.current.forEach(circle => {
      if (map.current.getSource(circle.id)) {
        map.current.removeLayer(circle.id);
        map.current.removeSource(circle.id);
      }
    });
    clearCircleCenterMarkers();

    markers.current = [];
    circles.current = [];

    // 添加新标记和圆圈
    locations.forEach((location, index) => {
      console.log('Processing location:', location);
      
      if (location.latitude && location.longitude) {
        const lngLat = [parseFloat(location.longitude), parseFloat(location.latitude)];
        console.log('Adding marker at:', lngLat);
        
        // 创建标记
        const marker = new maplibregl.Marker({
          draggable: false,
          color: '#FF6B6B'
        })
        .setLngLat(lngLat)
        .setPopup(
          new maplibregl.Popup({ 
            offset: 25,
            className: 'custom-popup'
          })
          .setHTML(`
            <div class="marker-popup">
              <div class="popup-header">
                <h3 class="store-name">🏪 ${location.name}</h3>
              </div>
              <div class="popup-content">
                <div class="info-row">
                  <span class="label">📍 地址:</span>
                  <span class="value">${location.address || '直接输入坐标'}</span>
                </div>
                <div class="info-row">
                  <span class="label">📡 服务半径:</span>
                  <span class="value">${location.radius} km</span>
                </div>
                <div class="info-row">
                  <span class="label">🌐 坐标:</span>
                  <span class="value">${parseFloat(location.latitude).toFixed(4)}, ${parseFloat(location.longitude).toFixed(4)}</span>
                </div>
                ${(() => {
                  const isInCircle = isStoreInCircle(location);
                  const storeLat = parseFloat(location.latitude);
                  const storeLng = parseFloat(location.longitude);
                  const circleLat = parseFloat(location.circleCenterLat || location.latitude);
                  const circleLng = parseFloat(location.circleCenterLng || location.longitude);
                  const distance = calculateDistance(storeLat, storeLng, circleLat, circleLng);
                  
                  if (location.circleCenterLng && location.circleCenterLat) {
                    return `
                      <div class="circle-info">
                        <div class="info-row">
                          <span class="label">🎯 圆圈中心:</span>
                          <span class="value">${circleLat.toFixed(4)}, ${circleLng.toFixed(4)}</span>
                        </div>
                        <div class="info-row">
                          <span class="label">📏 偏离距离:</span>
                          <span class="value ${distance > parseFloat(location.radius) ? 'warning' : ''}">${distance.toFixed(2)} km</span>
                        </div>
                        ${!isInCircle ? `
                          <div class="warning-message">
                            ⚠️ 加盟店不在自己的辐射圈内！
                          </div>
                        ` : ''}
                      </div>
                    `;
                  }
                  return '';
                })()}
                <div class="popup-actions">
                  <button class="action-btn move-circle-btn" onclick="window.moveCircleCenter(${index})">
                    🎯 移动辐射圈中心
                  </button>
                  ${location.circleCenterLng && location.circleCenterLat ? `
                    <button class="action-btn reset-circle-btn" onclick="window.resetCircleCenter(${index})">
                      🔄 重置圆圈中心
                    </button>
                  ` : ''}
                  <button class="action-btn debug-btn" onclick="window.debugCircle(${index})">
                    🔍 调试圆圈
                  </button>
                </div>
              </div>
            </div>
          `)
        )
        .addTo(map.current);

        markers.current.push(marker);
        console.log('Marker added successfully');

        // 创建圆圈 - 使用实际距离
        const circleId = `circle-${index}`;
        const radiusInKm = parseFloat(location.radius);
        
        // 使用保存的圆圈中心位置，如果没有则使用原始位置
        const circleCenterLng = location.circleCenterLng || parseFloat(location.longitude);
        const circleCenterLat = location.circleCenterLat || parseFloat(location.latitude);
        const circleCenterLngLat = [circleCenterLng, circleCenterLat];
        
        console.log(`创建圆圈 - 索引: ${index}, 原始位置: [${location.longitude}, ${location.latitude}]`);
        console.log(`圆圈中心位置: [${circleCenterLng}, ${circleCenterLat}]`);
        console.log(`圆圈半径: ${radiusInKm}km`);
        
        // 获取当前缩放级别
        const currentZoom = map.current.getZoom();
        console.log(`当前缩放级别: ${currentZoom}`);

        try {
          // 添加圆圈数据源
          map.current.addSource(circleId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: circleCenterLngLat
              },
              properties: {}
            }
          });

          // 检查加盟店是否在圆圈内
          const isInCircle = isStoreInCircle(location);
          
          // 添加圆圈图层 - 使用实际地理距离
          map.current.addLayer({
            id: circleId,
            type: 'circle',
            source: circleId,
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, radiusInKm * 0.1,    // 缩放级别0时，1km = 0.1像素（远距离视图，圆圈很小）
                5, radiusInKm * 1,      // 缩放级别5时，1km = 1像素
                10, radiusInKm * 10,    // 缩放级别10时，1km = 10像素
                15, radiusInKm * 50,    // 缩放级别15时，1km = 50像素
                20, radiusInKm * 100    // 缩放级别20时，1km = 100像素（近距离视图，圆圈很大）
              ],
              'circle-color': isInCircle ? '#FF6B6B' : '#FFA500',
              'circle-opacity': 0.2,
              'circle-stroke-color': isInCircle ? '#FF6B6B' : '#FFA500',
              'circle-stroke-width': isInCircle ? 2 : 3
            }
          });

          circles.current.push({ id: circleId, locationIndex: index });
          console.log('Circle added successfully with radius:', radiusInKm, 'km');
        } catch (error) {
          console.error('Error adding circle:', error);
        }
      } else {
        console.log('Location missing coordinates:', location);
      }
    });
  };

  // 当位置数据更新时重新渲染标记
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      updateMarkers();
    }
  }, [locations, map.current]);

  // 监听地图样式加载完成
  useEffect(() => {
    if (map.current) {
      const handleStyleLoad = () => {
        updateMarkers();
      };
      
      map.current.on('style.load', handleStyleLoad);
      
      return () => {
        if (map.current) {
          map.current.off('style.load', handleStyleLoad);
        }
      };
    }
  }, [map.current]);

  // 确保全局函数始终是最新的
  useEffect(() => {
    window.deleteLocation = deleteLocation;
    window.moveCircleCenter = (index) => {
      setDraggingCircle(index);
      createDraggableCircleCenter(index);
    };
    window.resetCircleCenter = (index) => {
      // 重置圆圈中心到加盟店位置
      const location = locations[index];
      const storeLng = parseFloat(location.longitude);
      const storeLat = parseFloat(location.latitude);
      
      // 更新圆圈中心位置
      updateLocationCircleCenter(index, storeLng, storeLat);
      
      // 更新圆圈显示
      updateCircleCenter(index, [storeLng, storeLat]);
      
      // 清除圆圈中心标记
      clearCircleCenterMarkers();
      
      console.log(`圆圈中心已重置到加盟店位置: [${storeLng}, ${storeLat}]`);
    };
    window.debugCircle = (index) => {
      const location = locations[index];
      const currentZoom = map.current.getZoom();
      const radiusInKm = parseFloat(location.radius);
      
      console.log('=== 圆圈调试信息 ===');
      console.log(`加盟店: ${location.name}`);
      console.log(`当前缩放级别: ${currentZoom}`);
      console.log(`圆圈半径: ${radiusInKm}km`);
      console.log(`加盟店位置: [${location.longitude}, ${location.latitude}]`);
      console.log(`圆圈中心: [${location.circleCenterLng || location.longitude}, ${location.circleCenterLat || location.latitude}]`);
      
      // 计算圆圈中心与加盟店的距离
      const storeLat = parseFloat(location.latitude);
      const storeLng = parseFloat(location.longitude);
      const circleLat = parseFloat(location.circleCenterLat || location.latitude);
      const circleLng = parseFloat(location.circleCenterLng || location.longitude);
      const distance = calculateDistance(storeLat, storeLng, circleLat, circleLng);
      
      console.log(`圆圈中心与加盟店距离: ${distance.toFixed(2)}km`);
      console.log(`加盟店是否在圆圈内: ${distance <= radiusInKm ? '是' : '否'}`);
      
      // 计算当前缩放级别下的像素半径
      const pixelRadius = calculatePixelRadius(radiusInKm, currentZoom);
      console.log(`当前缩放级别下的像素半径: ${pixelRadius.toFixed(2)}像素`);
      console.log('==================');
    };
  }, [locations]);

  // 删除加盟店
  const deleteLocation = (index) => {
    if (onLocationUpdate) {
      const newLocations = locations.filter((_, i) => i !== index);
      onLocationUpdate(newLocations);
    }
  };

  // 创建可拖拽的圆圈中心标记
  const createDraggableCircleCenter = (index) => {
    if (!map.current || !locations[index]) return;
    
    // 清除之前的圆圈中心标记
    clearCircleCenterMarkers();
    
    const location = locations[index];
    // 使用保存的圆圈中心位置，如果没有则使用原始位置
    const circleCenterLng = location.circleCenterLng || parseFloat(location.longitude);
    const circleCenterLat = location.circleCenterLat || parseFloat(location.latitude);
    const lngLat = [circleCenterLng, circleCenterLat];
    
    // 创建可拖拽的圆圈中心标记
    const circleCenterMarker = new maplibregl.Marker({
      draggable: true,
      color: '#4CAF50',
      element: createCircleCenterElement()
    })
    .setLngLat(lngLat)
    .addTo(map.current);

    // 监听拖拽事件
    circleCenterMarker.on('drag', () => {
      const newLngLat = circleCenterMarker.getLngLat();
      updateCircleCenter(index, [newLngLat.lng, newLngLat.lat]);
    });

    circleCenterMarker.on('dragend', () => {
      const newLngLat = circleCenterMarker.getLngLat();
      console.log(`圆圈 ${index} 中心已移动到:`, newLngLat);
      // 更新数据中的圆圈中心位置
      updateLocationCircleCenter(index, newLngLat.lng, newLngLat.lat);
    });

    // 存储标记引用
    circleCenterMarkers.current.push(circleCenterMarker);
  };

  // 清除圆圈中心标记
  const clearCircleCenterMarkers = () => {
    circleCenterMarkers.current.forEach(marker => marker.remove());
    circleCenterMarkers.current = [];
  };

  // 计算两点之间的距离（公里）
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 根据缩放级别和地理距离计算像素半径
  const calculatePixelRadius = (radiusInKm, zoom) => {
    // 基于墨卡托投影的近似计算
    // 在赤道处，1度经度约等于111.32km
    // 在不同纬度下，1度经度的距离会变化
    const equatorCircumference = 40075; // 地球赤道周长（公里）
    const pixelsPerDegree = Math.pow(2, zoom) * 256 / 360; // 256是瓦片大小
    
    // 近似计算：1km在不同缩放级别下的像素数
    const kmInPixels = pixelsPerDegree / (equatorCircumference / 360);
    
    return radiusInKm * kmInPixels;
  };

  // 检查加盟店是否在自己的辐射圈内
  const isStoreInCircle = (location) => {
    const storeLat = parseFloat(location.latitude);
    const storeLng = parseFloat(location.longitude);
    const circleLat = parseFloat(location.circleCenterLat || location.latitude);
    const circleLng = parseFloat(location.circleCenterLng || location.longitude);
    const radius = parseFloat(location.radius);
    
    const distance = calculateDistance(storeLat, storeLng, circleLat, circleLng);
    return distance <= radius;
  };

  // 更新数据中的圆圈中心位置
  const updateLocationCircleCenter = (index, lng, lat) => {
    if (onLocationUpdate) {
      const newLocations = [...locations];
      newLocations[index] = {
        ...newLocations[index],
        circleCenterLng: lng,
        circleCenterLat: lat
      };
      
      // 检查是否在辐射圈内
      const isInCircle = isStoreInCircle(newLocations[index]);
      const storeLat = parseFloat(newLocations[index].latitude);
      const storeLng = parseFloat(newLocations[index].longitude);
      const distance = calculateDistance(storeLat, storeLng, lat, lng);
      
      console.log(`更新圆圈中心位置 - 索引: ${index}, 经度: ${lng}, 纬度: ${lat}`);
      console.log(`距离加盟店: ${distance.toFixed(2)}km, 在辐射圈内: ${isInCircle}`);
      console.log('更新后的数据:', newLocations[index]);
      
      onLocationUpdate(newLocations);
    }
  };

  // 创建圆圈中心标记元素
  const createCircleCenterElement = () => {
    const el = document.createElement('div');
    el.className = 'circle-center-marker';
    el.innerHTML = '🎯';
    el.style.fontSize = '20px';
    el.style.cursor = 'grab';
    el.title = '拖拽移动辐射圈中心';
    return el;
  };

  // 更新圆圈中心位置
  const updateCircleCenter = (index, newLngLat) => {
    if (!map.current || !map.current.getSource(`circle-${index}`)) return;
    
    const source = map.current.getSource(`circle-${index}`);
    source.setData({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: newLngLat
      },
      properties: {}
    });
  };

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
    </div>
  );
};

export default MapComponent; 