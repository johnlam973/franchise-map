@echo off
echo 🚀 启动 Flask 后端服务...
echo.
cd backend
echo 📦 安装依赖...
pip install -r requirements.txt
echo.
echo 🌐 启动服务...
python app.py
pause 