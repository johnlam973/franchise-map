# 🏪 加盟地图管理系统

一个基于 **React + Flask** 的全栈项目，用于管理加盟商信息。支持本地数据存储，无需数据库，适合小型企业或个人使用。

## 🎯 项目简介

这是一个轻量级的加盟商信息管理系统，可以帮助你：
- 📝 添加新的加盟商信息（姓名、邮箱、地址等）
- 🗺️ 地图可视化显示加盟商位置
- 📍 地址自动解析为经纬度坐标
- ⭕ 自定义服务半径圆圈显示
- 📊 查看所有加盟商数据列表
- 💾 本地 CSV 文件存储，数据安全可控
- 🌐 现代化的 Web 界面，响应式设计
- 🔄 实时数据同步和刷新

## 🏗️ 技术架构

- **前端**：React 18 + Create React App + MapLibre GL JS
- **后端**：Flask + Flask-CORS + Requests
- **地图服务**：MapTiler (Aquarelle 样式) + OpenStreetMap Nominatim
- **数据存储**：CSV 文件（无需数据库）
- **开发环境**：本地开发，支持热重载

## 📁 项目结构

```
加盟_map/
├── backend/                 # 🐍 Flask 后端
│   ├── app.py              # 主应用文件（API 接口）
│   └── requirements.txt    # Python 依赖包
├── frontend/               # ⚛️ React 前端
│   ├── public/
│   │   └── index.html      # HTML 模板
│   ├── src/
│   │   ├── App.jsx         # 主组件
│   │   ├── App.css         # 样式文件
│   │   ├── index.js        # 入口文件
│   │   └── index.css       # 全局样式
│   └── package.json        # Node.js 依赖
├── data/                   # 📊 数据存储
│   └── data.csv           # CSV 数据文件
├── README.md              # 📖 项目说明
├── .gitignore             # 🚫 Git 忽略文件
├── start_backend.bat      # 🚀 后端启动脚本
└── start_frontend.bat     # 🚀 前端启动脚本
```

## ✨ 功能特性

- ✅ **现代化界面**：React 前端，响应式设计，美观易用
- ✅ **数据管理**：添加、查看加盟商信息
- ✅ **本地存储**：CSV 文件存储，无需数据库
- ✅ **实时同步**：前后端数据实时同步
- ✅ **跨域支持**：Flask-CORS 解决跨域问题
- ✅ **开发友好**：热重载，快速开发调试
- ✅ **错误处理**：完善的错误提示和状态反馈

## 🚀 快速开始

### 方法一：使用批处理文件（推荐）

1. **启动后端服务**：双击 `start_backend.bat`
2. **启动前端服务**：双击 `start_frontend.bat`

### 方法二：手动启动

#### 1. 安装后端依赖
```bash
cd backend
pip install -r requirements.txt
```

#### 2. 安装前端依赖
```bash
cd frontend
npm install
```

#### 3. 运行项目

**启动后端服务 (端口 5000):**
```bash
cd backend
python app.py
```

**启动前端服务 (端口 3000):**
```bash
cd frontend
npm start
```

### 4. 访问应用

- 🌐 **前端界面**：http://localhost:3000
- 🔧 **后端 API**：http://localhost:5000

## 📋 API 接口

| 方法 | 路径 | 描述 | 请求体 |
|------|------|------|--------|
| `POST` | `/api/submit` | 提交加盟商数据 | `{"name": "姓名", "address": "地址", "latitude": 纬度, "longitude": 经度, "radius": 3}` |
| `GET` | `/api/data` | 获取所有加盟商数据 | - |
| `GET` | `/api/geocode` | 地址地理编码 | `?address=地址` |
| `GET` | `/api/health` | 健康检查 | - |

## 🛠️ 开发说明

### 技术栈
- **前端**：React 18 + Create React App
- **后端**：Flask + Flask-CORS
- **数据存储**：CSV 文件（`data/data.csv`）
- **开发工具**：支持热重载，快速开发

### 项目特点
- 🎯 **轻量级**：无需数据库，CSV 文件存储
- 🔒 **本地化**：数据存储在本地，安全可控
- 🌐 **现代化**：React 前端，响应式设计
- ⚡ **快速开发**：前后端分离，独立开发调试
- 📍 **灵活定位**：支持地址解析或直接输入经纬度
- 🖥️ **全屏体验**：地图支持全屏显示

### 扩展建议
- 📊 添加数据统计图表
- 🔍 增加搜索和筛选功能
- 📱 优化移动端体验
- 🎨 自定义主题和样式
- 📤 支持数据导出功能
- 🗺️ 添加路线规划功能
- 📍 支持批量导入地址
- ⭕ 圆圈重叠检测和优化

---

## 📞 联系方式

如有问题或建议，欢迎交流！

---

**🎉 项目已成功运行！现在你可以访问 http://localhost:3000 开始使用加盟地图管理系统了！** 