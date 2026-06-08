import streamlit as st
import instaloader
import re
import requests
import yt_dlp
import os
import shutil

# Thiết lập tài nguyên PWA cho iOS (Apple Web Clip)
def setup_pwa():
    try:
        streamlit_dir = os.path.dirname(st.__file__)
        static_dir = os.path.join(streamlit_dir, 'static')
        
        # 1. Sao chép favicon vào thư mục tĩnh của Streamlit
        src_favicon = "favicon.png"
        if os.path.exists(src_favicon):
            shutil.copy(src_favicon, os.path.join(static_dir, "favicon.png"))
            shutil.copy(src_favicon, os.path.join(static_dir, "apple-touch-icon.png"))
            shutil.copy(src_favicon, os.path.join(static_dir, "apple-touch-icon-precomposed.png"))
            
        # 2. Tiêm thẻ meta và link vào index.html gốc của Streamlit
        index_path = os.path.join(static_dir, 'index.html')
        if os.path.exists(index_path):
            with open(index_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            pwa_tags = (
                '<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n'
                '  <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon-precomposed.png">\n'
                '  <meta name="apple-mobile-web-app-capable" content="yes">\n'
                '  <meta name="apple-mobile-web-app-title" content="PyCollect">\n'
                '  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">'
            )
            
            if "apple-touch-icon" not in content:
                content = content.replace("</head>", f"  {pwa_tags}\n</head>")
                with open(index_path, 'w', encoding='utf-8') as f:
                    f.write(content)
    except Exception:
        pass

setup_pwa()

# Cấu hình giao diện trang web
st.set_page_config(
    page_title="PyCollect - Trình tải đa phương tiện",
    page_icon="favicon.png",
    layout="centered"
)

# Thêm mã CSS tùy chỉnh để tái tạo giao diện PyCollect cao cấp
st.markdown("""
<style>
/* Nạp font Outfit và Press Start 2P từ Google */
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;700&family=Press+Start+2P&display=swap');

/* Áp dụng font và màu nền tối đặc trưng của PyCollect */
html, body, [class*="css"], .stApp, .stMarkdown, p, span, label, input, button {
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif !important;
}

.stApp {
    background-color: #0d0d0d !important;
    color: #ffffff !important;
}



@keyframes glowAnimation {
    0% { transform: scale(0.9) translate(0px, 0px); opacity: 0.7; }
    100% { transform: scale(1.1) translate(10px, 10px); opacity: 0.95; }
}


/* Ẩn hoàn toàn header mặc định, chân trang và thanh trang trí của Streamlit */
header[data-testid="stHeader"], [data-testid="stHeader"], [data-testid="stDecoration"] {
    display: none !important;
}
footer {
    display: none !important;
}

/* Giới hạn kích thước container tối đa phù hợp Mobile */
.block-container {
    max-width: 360px !important;
    padding-top: 1.5rem !important;
    padding-bottom: 2rem !important;
    margin: 0 auto !important;
}

/* Thanh điều hướng Navbar PyCollect */
.m-navbar {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 12px !important;
    height: 52px !important;
    margin-bottom: 20px !important;
    z-index: 10 !important;
}
.m-nav-item {
    font-size: 17px !important;
    color: #888888 !important;
    width: 40px !important;
    height: 40px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
}
.m-nav-item.active {
    background: #ffffff !important;
    color: #000000 !important;
    border-radius: 10px !important;
    font-size: 16px !important;
}

/* Khối tiêu đề chính PyCollect */
.m-title-container {
    margin-top: 18px !important;
    margin-bottom: 28px !important;
    text-align: left !important;
    position: relative !important;
    z-index: 1 !important;
}

/* Hiệu ứng ửng cam phát sáng định vị chính xác theo tiêu đề (luôn hiện trên mobile) */
.m-title-container::before {
    content: "" !important;
    position: absolute !important;
    top: -170px !important;
    left: -70px !important;
    width: 280px !important;
    height: 280px !important;
    background: radial-gradient(circle, rgba(232, 83, 10, 0.28) 0%, rgba(180, 60, 10, 0.08) 50%, rgba(0, 0, 0, 0) 100%) !important;
    pointer-events: none !important;
    z-index: -1 !important;
    filter: blur(10px) !important;
    animation: glowAnimation 12s infinite alternate ease-in-out !important;
}
.m-title {
    font-family: 'Press Start 2P', monospace !important;
    color: #ffffff !important;
    font-size: 24px !important;
    font-weight: 400 !important;
    letter-spacing: -1px !important;
    margin: 0 !important;
    padding: 0 !important;
    line-height: 1.1 !important;
}
.m-subtitle-row {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    margin-top: 4px !important;
}
.m-spark {
    color: #e8530a !important;
    font-size: 8px !important;
}
.m-subtitle {
    color: #e8530a !important;
    font-size: 8px !important;
    font-weight: 700 !important;
    letter-spacing: 2px !important;
    font-family: 'JetBrains Mono', monospace !important;
}

/* Căn chỉnh cột cho nút dán link */
div[data-testid="column"]:nth-child(2) {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

/* Nút dán clipboard (paste button) */
.paste-btn {
    background: #2a2a2a !important;
    color: #ffffff !important;
    border: 1px solid #2a2a2a !important;
    border-radius: 14px !important;
    font-size: 22px !important;
    width: 58px !important;
    height: 68px !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    margin-top: 0px !important;
    transition: all 0.2s ease !important;
}
.paste-btn:hover {
    background: #3a3a3a !important;
    color: #ffffff !important;
    border-color: #444444 !important;
}

/* Buộc ô nhập link và nút dán nằm cùng một hàng ngang trên mobile */
div[data-testid="stHorizontalBlock"]:has(div[data-testid="stTextInput"]):has(.paste-btn) {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    gap: 8px !important;
    width: 100% !important;
}

div[data-testid="stHorizontalBlock"]:has(div[data-testid="stTextInput"]):has(.paste-btn) > div[data-testid="column"] {
    min-width: 0 !important;
}

div[data-testid="stHorizontalBlock"]:has(div[data-testid="stTextInput"]):has(.paste-btn) > div[data-testid="column"]:first-child {
    flex: 1 1 auto !important;
    width: auto !important;
}

div[data-testid="stHorizontalBlock"]:has(div[data-testid="stTextInput"]):has(.paste-btn) > div[data-testid="column"]:last-child {
    flex: 0 0 auto !important;
    width: auto !important;
}

/* Định dạng ô nhập liệu (QLineEdit) */
div[data-testid="stTextInput"] [data-baseweb="input"] {
    border-radius: 14px !important;
    border: 1px solid #2a2a2a !important;
    background-color: #1a1a1a !important;
    height: 68px !important;
    transition: all 0.3s ease !important;
}
div[data-testid="stTextInput"] [data-baseweb="input"]:focus-within {
    border-color: #e8530a !important;
    box-shadow: 0 0 10px rgba(232, 83, 10, 0.25) !important;
}
div[data-testid="stTextInput"] input {
    background-color: transparent !important;
    color: #ffffff !important;
    font-size: 18px !important;
    height: 100% !important;
    border: none !important;
    padding: 0 16px !important;
    outline: none !important;
    box-shadow: none !important;
}

/* Tùy chỉnh công tắc Neumorphic Toggle (theo Tkinter Neumorphic) */
div.stCheckbox, div[data-testid="stCheckbox"] {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    margin: 20px auto !important;
    width: 100% !important;
}

div[data-testid="stCheckbox"] > label {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    margin: 0 auto !important;
    padding: 0 !important;
    width: auto !important;
}

/* Ẩn input checkbox mặc định */
div[data-testid="stCheckbox"] input[type="checkbox"] {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    border: 0 !important;
}

/* Loại bỏ style mặc định của container checkbox trong Streamlit */
div[data-testid="stCheckbox"] [data-baseweb="checkbox"] {
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 auto !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    width: auto !important;
}

/* Ẩn label text mặc định của BaseWeb checkbox nếu có */
div[data-testid="stCheckbox"] [data-baseweb="checkbox"] > div:last-child {
    display: none !important;
}

/* Rãnh trượt (Track) */
div[data-testid="stCheckbox"] [data-baseweb="checkbox"] > div:first-child,
div[data-testid="stCheckbox"] [role="switch"],
div[data-testid="stCheckbox"] [role="checkbox"] {
    width: 220px !important;
    height: 110px !important;
    background: #212121 !important;
    border: 1px solid #1a1a1a !important;
    border-radius: 55px !important;
    box-shadow: inset 3px 3px 6px #101010, inset -3px -3px 6px #282828,
                1px 1px 3px #2d2d2d, -1px -1px 3px #151515 !important;
    position: relative !important;
    margin: 0 !important;
    transition: all 0.3s ease !important;
}

/* Điểm phát sáng xanh lá (Indicator Dot) ở bên trái */
div[data-testid="stCheckbox"] [data-baseweb="checkbox"] > div:first-child::before,
div[data-testid="stCheckbox"] [role="switch"]::before,
div[data-testid="stCheckbox"] [role="checkbox"]::before {
    content: "" !important;
    position: absolute !important;
    left: 30px !important;
    top: 55px !important;
    transform: translate(-50%, -50%) !important;
    width: 10px !important;
    height: 10px !important;
    border-radius: 50% !important;
    background-color: #4ade80 !important;
    box-shadow: 0 0 8px #3aad64, 0 0 16px #2a6644, 0 0 24px #1a3d26 !important;
    opacity: 0 !important;
    transition: opacity 0.3s ease !important;
    z-index: 1 !important;
    animation: pulseGreenGlow 1.5s infinite alternate ease-in-out !important;
}

@keyframes pulseGreenGlow {
    0% {
        box-shadow: 0 0 6px #3aad64, 0 0 12px #2a6644, 0 0 18px #1a3d26 !important;
        transform: translate(-50%, -50%) scale(0.9) !important;
    }
    100% {
        box-shadow: 0 0 12px #4ade80, 0 0 24px #3aad64, 0 0 36px #2a6644 !important;
        transform: translate(-50%, -50%) scale(1.1) !important;
    }
}

/* Khi được bật (checked) */
div[data-testid="stCheckbox"]:has(input:checked) [data-baseweb="checkbox"] > div:first-child::before,
div[data-testid="stCheckbox"]:has(input:checked) [role="switch"]::before,
div[data-testid="stCheckbox"]:has(input:checked) [role="checkbox"]::before {
    opacity: 1 !important;
}

/* Con chạy (Handle) */
div[data-testid="stCheckbox"] [data-baseweb="checkbox"] > div:first-child > div,
div[data-testid="stCheckbox"] [role="switch"] > div,
div[data-testid="stCheckbox"] [role="checkbox"] > div {
    width: 100px !important;
    height: 94px !important;
    border-radius: 47px !important;
    background-color: #2a2a2a !important;
    box-shadow: 4px 4px 8px #101010, -2px -2px 6px #3c3c3c !important;
    border: none !important;
    position: absolute !important;
    top: 8px !important;
    left: 12px !important;
    transform: translateX(0px) !important;
    transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.3s, box-shadow 0.3s !important;
}

/* Rãnh dọc trên con chạy */
div[data-testid="stCheckbox"] [data-baseweb="checkbox"] > div:first-child > div::after,
div[data-testid="stCheckbox"] [role="switch"] > div::after,
div[data-testid="stCheckbox"] [role="checkbox"] > div::after {
    content: "" !important;
    position: absolute !important;
    right: 20px !important;
    top: 28px !important;
    width: 2px !important;
    height: 38px !important;
    background-color: #1a1a1a !important;
    border-right: 1px solid #383838 !important;
}

/* Di chuyển con chạy sang phải khi bật */
div[data-testid="stCheckbox"]:has(input:checked) [data-baseweb="checkbox"] > div:first-child > div,
div[data-testid="stCheckbox"]:has(input:checked) [role="switch"] > div,
div[data-testid="stCheckbox"]:has(input:checked) [role="checkbox"] > div {
    transform: translateX(96px) !important;
}

.m-swipe-lbl {
    color: #52525b !important;
    font-size: 10px !important;
    letter-spacing: 2.5px !important;
    font-family: 'JetBrains Mono', monospace !important;
}

/* Thiết kế thẻ Card InfoCard */
.m-card {
    background: #1a1a1a !important;
    border: 1px solid #2a2a2a !important;
    border-radius: 12px !important;
    padding: 14px 16px !important;
    margin-bottom: 12px !important;
    box-sizing: border-box !important;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2) !important;
}
.m-card.flex-row {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
}
.m-card.flex-row.pkg-card {
    height: 80px !important;
}
.m-card.flex-row.size-card {
    height: 52px !important;
}
.m-card-left {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
}
.m-card-dot {
    color: #e8530a !important;
    font-size: 8px !important;
}
.m-card-title {
    color: #ffffff !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    letter-spacing: 0.5px !important;
}
.m-card-right {
    color: #888888 !important;
    font-size: 12px !important;
    font-family: 'JetBrains Mono', monospace !important;
}

/* Hộp thông báo của Streamlit */
div[data-testid="stAlert"] {
    border-radius: 12px !important;
    border: 1px solid #222222 !important;
    background-color: #1a1a1a !important;
    color: #ffffff !important;
    padding: 12px 18px !important;
}

/* Thẻ Card kết xuất tải xuống */
.media-card {
    background: #111111 !important;
    border: 1px solid #222222 !important;
    border-radius: 16px !important;
    padding: 16px !important;
    margin: 16px 0 !important;
    box-shadow: 0 10px 25px rgba(0,0,0,0.4) !important;
}

/* Nút tải xuống lớn */
div[data-testid="stDownloadButton"] button {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 100% !important;
    background: #e8530a !important;
    color: #ffffff !important;
    border: none !important;
    padding: 12px 24px !important;
    border-radius: 10px !important;
    font-weight: 700 !important;
    font-size: 0.95rem !important;
    box-shadow: 0 4px 10px rgba(232, 83, 10, 0.3) !important;
    transition: all 0.3s ease !important;
}
div[data-testid="stDownloadButton"] button:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 18px rgba(232, 83, 10, 0.5) !important;
    background: #f8631a !important;
}
div[data-testid="stDownloadButton"] button:active {
    transform: translateY(1px) !important;
}

/* Định dạng bo góc ảnh/video */
div[data-testid="stVideo"] video, div[data-testid="element-container"] img {
    border-radius: 12px !important;
}

/* Nút chọn định dạng YouTube radio */
div[data-testid="stRadio"] {
    background: #161616 !important;
    border: 1px solid #222222 !important;
    border-radius: 12px !important;
    padding: 12px !important;
    margin-bottom: 20px !important;
}
div[data-testid="stRadio"] label {
    font-weight: 600 !important;
    color: #888888 !important;
}

/* Đường phân cách */
hr {
    border: 0 !important;
    height: 1px !important;
    background: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0)) !important;
    margin: 20px 0 !important;
}

/* ── THÀNH PHẦN DOCK NEUMORPHIC CHO NAVIGATION ── */
.m-dock-container {
    display: flex !important;
    justify-content: center !important;
    width: 100% !important;
    margin-top: -12px !important;
    margin-bottom: 20px !important;
    position: relative !important;
}

.m-dock {
    display: flex !important;
    justify-content: space-around !important;
    align-items: center !important;
    width: 100% !important;
    height: 52px !important;
    background: #1a1a1a !important;
    border-radius: 26px !important;
    padding: 0 8px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35) !important;
    border: 1px solid #2a2a2a !important;
}

.m-dock-item {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    position: relative !important;
    cursor: pointer !important;
    width: 38px !important;
    height: 100% !important;
}

.m-dock-btn {
    width: 30px !important;
    height: 30px !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
    background: transparent !important;
}

.m-dock-icon {
    font-size: 14px !important;
    color: #888888 !important;
    transition: all 0.3s ease !important;
}

/* Hiệu ứng di chuột cho các tab không hoạt động */
.m-dock-item:not(.active):hover .m-dock-icon {
    color: #ffffff !important;
    transform: scale(1.1) !important;
}

/* Các thuộc tính CSS cho Tab đang hoạt động (Active) */
.m-dock-item.active .m-dock-btn {
    background: #e8530a !important;
    width: 36px !important;
    height: 36px !important;
    box-shadow: 0 0 10px rgba(232, 83, 10, 0.5) !important;
}

.m-dock-item.active .m-dock-icon {
    color: #ffffff !important;
    font-size: 16px !important;
}



/* Dấu chấm chỉ báo phía dưới tab active */
.m-active-dot {
    width: 4px !important;
    height: 4px !important;
    border-radius: 50% !important;
    background-color: #e8530a !important;
    position: absolute !important;
    bottom: 2px !important;
    opacity: 0 !important;
    transition: all 0.3s ease !important;
}

.m-dock-item.active .m-active-dot {
    opacity: 1 !important;
}

/* Windows XP style alert popup */
.xp-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background-color: rgba(0, 0, 0, 0.4) !important;
    z-index: 99999 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}
.xp-window {
    width: 320px !important;
    background-color: #ece9d8 !important;
    border: 3px solid #0054e3 !important;
    border-radius: 7px 7px 0 0 !important;
    box-shadow: 4px 4px 10px rgba(0,0,0,0.5) !important;
    font-family: "Tahoma", "Segoe UI", sans-serif !important;
    font-size: 11px !important;
    color: #000000 !important;
}
.xp-titlebar {
    background: linear-gradient(to right, #0058e6 0%, #3a93ff 100%) !important;
    height: 25px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 0 5px 0 8px !important;
    color: #ffffff !important;
    font-weight: bold !important;
    text-shadow: 1px 1px 1px #002c7a !important;
}
.xp-title {
    font-size: 11px !important;
}
.xp-close {
    width: 16px !important;
    height: 16px !important;
    background: linear-gradient(135deg, #ff7d63 0%, #e61d00 100%) !important;
    border: 1px solid #7d0000 !important;
    border-radius: 3px !important;
    color: #ffffff !important;
    font-size: 9px !important;
    font-weight: bold !important;
    line-height: 14px !important;
    text-align: center !important;
    cursor: pointer !important;
    box-shadow: inset 1px 1px 1px rgba(255,255,255,0.4) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}
.xp-close:hover {
    background: linear-gradient(135deg, #ff9b85 0%, #ff3b1f 100%) !important;
}
.xp-body {
    padding: 15px !important;
    display: flex !important;
    align-items: flex-start !important;
    gap: 15px !important;
    background-color: #ece9d8 !important;
}
.xp-icon {
    width: 32px !important;
    height: 32px !important;
    flex-shrink: 0 !important;
    background: url('https://upload.wikimedia.org/wikipedia/commons/e/e4/Windows_Error_Icon.svg') no-repeat center !important;
    background-size: contain !important;
}
.xp-text {
    line-height: 1.4 !important;
    font-size: 12px !important;
    font-family: "Tahoma", sans-serif !important;
    color: #000000 !important;
    word-break: break-word !important;
    text-align: left !important;
}
.xp-actions {
    display: flex !important;
    justify-content: center !important;
    padding-bottom: 12px !important;
    background-color: #ece9d8 !important;
}
.xp-btn {
    min-width: 75px !important;
    height: 22px !important;
    background-color: #f1efe2 !important;
    border: 1px solid #0054e3 !important;
    border-radius: 3px !important;
    color: #000000 !important;
    font-size: 11px !important;
    font-family: "Tahoma", sans-serif !important;
    cursor: pointer !important;
    box-shadow: inset 0 -4px 4px #e5e2d3, 1px 1px 1px rgba(0,0,0,0.2) !important;
    outline: none !important;
}
.xp-btn:hover {
    background-color: #ffffff !important;
    box-shadow: inset 0 -4px 4px #e5e2d3, 1px 1px 1px rgba(0,0,0,0.2), 0 0 2px #ffc000 !important;
}
.xp-btn:active {
    box-shadow: inset 0 2px 2px rgba(0,0,0,0.1) !important;
}
</style>
<script>
    (function() {
        var doc = window.document;
        var parentDoc = doc;
        try {
            if (window.parent && window.parent.document) {
                parentDoc = window.parent.document;
            }
        } catch(e) {}
        
        // 1. Apple Touch Icon (Favicon chất lượng cao)
        if (!parentDoc.querySelector('link[rel="apple-touch-icon"]')) {
            var appleIcon = parentDoc.createElement('link');
            appleIcon.rel = 'apple-touch-icon';
            var favicon = parentDoc.querySelector('link[rel="shortcut icon"]') || parentDoc.querySelector('link[rel="icon"]');
            appleIcon.href = favicon ? favicon.href : window.location.origin + '/favicon.png';
            parentDoc.head.appendChild(appleIcon);
        }
        
        // 2. Tên App khi hiển thị trên màn hình chính
        if (!parentDoc.querySelector('meta[name="apple-mobile-web-app-title"]')) {
            var appTitle = parentDoc.createElement('meta');
            appTitle.name = 'apple-mobile-web-app-title';
            appTitle.content = 'PyCollect';
            parentDoc.head.appendChild(appTitle);
        }
        
        // 3. Cho phép chạy như một ứng dụng độc lập (không hiện thanh địa chỉ Safari)
        if (!parentDoc.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
            var appCapable = parentDoc.createElement('meta');
            appCapable.name = 'apple-mobile-web-app-capable';
            appCapable.content = 'yes';
            parentDoc.head.appendChild(appCapable);
        }
        
        // 4. Thanh trạng thái trong suốt/tối sang trọng
        if (!parentDoc.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
            var barStyle = parentDoc.createElement('meta');
            barStyle.name = 'apple-mobile-web-app-status-bar-style';
            barStyle.content = 'black-translucent';
            parentDoc.head.appendChild(barStyle);
        }
    })();
</script>
""", unsafe_allow_html=True)

# ── Hàm kiểm tra định dạng Link ──
def check_link_validity(link_str):
    if not link_str:
        return True
    if "instagram.com" in link_str:
        match = re.search(r"/(?:p|reels|reel|share/p)/([A-Za-z0-9_-]+)", link_str)
        return match is not None
    if any(domain in link_str for domain in ["youtube.com", "youtu.be", "tiktok.com", "facebook.com", "fb.watch"]):
        return True
    return False

# ── Hàm vẽ InfoCard (PyCollect Style) ──
def render_info_card(label, value, right_label=""):
    if right_label:
        # Dạng thẻ Download Package
        st.markdown(f"""
        <div class="m-card flex-row pkg-card">
            <div class="m-card-left">
                <span class="m-card-dot">●</span>
                <span class="m-card-title">{label.upper()}</span>
            </div>
            <div class="m-card-right">{right_label}</div>
        </div>
        """, unsafe_allow_html=True)
    else:
        # Dạng thẻ Size
        st.markdown(f"""
        <div class="m-card flex-row size-card">
            <div class="m-card-left">
                <span class="m-card-dot">●</span>
                <span class="m-card-title">{label.upper()}</span>
            </div>
            <div class="m-card-right">{value}</div>
        </div>
        """, unsafe_allow_html=True)

# ── Hàm hiển thị kết quả phương tiện ──
def display_media_results(cache):
    if cache['type'] == 'instagram_album':
        st.write("### Album Instagram")
        for index, item in enumerate(cache['items']):
            st.markdown('<div class="media-card">', unsafe_allow_html=True)
            st.markdown(f'<h4 style="margin: 0 0 12px 0; color: #e8530a; font-weight:600;">Mục số {index + 1}</h4>', unsafe_allow_html=True)
            if not item['is_video']:
                if item['bytes']:
                    st.image(item['bytes'])
                    st.download_button(
                        label=f"📥 Tải Ảnh số {index + 1}",
                        data=item['bytes'],
                        file_name=item['filename'],
                        mime="image/jpeg",
                        key=f"dl_cached_img_{index}"
                    )
                else:
                    st.warning("⚠️ Không thể tải ảnh trực tiếp.")
                    st.image(item['url'])
            else:
                st.video(item['url'])
                if item['bytes']:
                    st.download_button(
                        label=f"📥 Tải Video số {index + 1}",
                        data=item['bytes'],
                        file_name=item['filename'],
                        mime="video/mp4",
                        key=f"dl_cached_vid_{index}"
                    )
            st.markdown('</div>', unsafe_allow_html=True)
            
    elif cache['type'] == 'instagram_single':
        st.markdown('<div class="media-card">', unsafe_allow_html=True)
        if cache['is_video']:
            st.video(cache['url'])
            if cache['bytes']:
                st.download_button(
                    label="📥 Tải Reels/Video này",
                    data=cache['bytes'],
                    file_name=cache['filename'],
                    mime="video/mp4"
                )
        else:
            if cache['bytes']:
                st.image(cache['bytes'])
                st.download_button(
                    label="📥 Tải Ảnh về máy",
                    data=cache['bytes'],
                    file_name=cache['filename'],
                    mime="image/jpeg"
                )
            else:
                st.warning("⚠️ Không thể xem trước ảnh trực tiếp.")
                st.image(cache['url'])
        st.markdown('</div>', unsafe_allow_html=True)
        
    elif cache['type'] == 'ytdlp':
        st.markdown('<div class="media-card">', unsafe_allow_html=True)
        st.markdown(f'<h4 style="margin: 0 0 12px 0; color: #ffffff; font-weight:600;">{cache["title"]}</h4>', unsafe_allow_html=True)
        if cache['download_type'] == 'audio':
            st.audio(cache['bytes'], format="audio/m4a")
            st.write("")
            st.download_button(
                label="📥 Tải file âm thanh (M4A)",
                data=cache['bytes'],
                file_name=f"{cache['title']}.m4a",
                mime="audio/m4a"
            )
        else:
            st.video(cache['bytes'])
            st.write("")
            st.download_button(
                label="📥 Tải file video (MP4)",
                data=cache['bytes'],
                file_name=f"{cache['title']}.mp4",
                mime="video/mp4"
            )
        st.markdown('</div>', unsafe_allow_html=True)

# ── Vẽ thanh Navbar trên cùng (Neumorphic Dock 5 nút) ──
active_tab = st.query_params.get("tab", "download")

st.markdown(f"""
<div class="m-dock-container">
    <div class="m-dock">
        <a href="/?tab=download" target="_self" class="m-dock-item {"active" if active_tab == "download" else ""}">
            <div class="m-dock-btn">
                <span class="m-dock-icon">📥</span>
            </div>
            <div class="m-active-dot"></div>
        </a>
        <a href="/?tab=history" target="_self" class="m-dock-item {"active" if active_tab == "history" else ""}">
            <div class="m-dock-btn">
                <span class="m-dock-icon">🕐</span>
            </div>
            <div class="m-active-dot"></div>
        </a>
        <a href="/?tab=gallery" target="_self" class="m-dock-item {"active" if active_tab == "gallery" else ""}">
            <div class="m-dock-btn">
                <span class="m-dock-icon">🖼️</span>
            </div>
            <div class="m-active-dot"></div>
        </a>
        <a href="/?tab=settings" target="_self" class="m-dock-item {"active" if active_tab == "settings" else ""}">
            <div class="m-dock-btn">
                <span class="m-dock-icon">⚙️</span>
            </div>
            <div class="m-active-dot"></div>
        </a>
        <a href="/?tab=help" target="_self" class="m-dock-item {"active" if active_tab == "help" else ""}">
            <div class="m-dock-btn">
                <span class="m-dock-icon">ℹ️</span>
            </div>
            <div class="m-active-dot"></div>
        </a>
    </div>
</div>
""", unsafe_allow_html=True)

# ── Vẽ Khối Tiêu đề chính ──
st.markdown("""
<div class="m-title-container">
    <h1 class="m-title">PyCollect</h1>
    <div class="m-subtitle-row">
        <span class="m-subtitle">DOWNLOAD THE THINGS YOU LIKE</span>
    </div>
</div>
""", unsafe_allow_html=True)

# ── Khởi tạo session state lưu trữ dữ liệu ──
if 'start_download' not in st.session_state:
    st.session_state.start_download = False
if 'prev_url' not in st.session_state:
    st.session_state.prev_url = ""
if 'media_cache' not in st.session_state:
    st.session_state.media_cache = None
if 'xp_error_msg' not in st.session_state:
    st.session_state.xp_error_msg = None

# ── HÀNH TRÌNH CHUYỂN TAB (Early Exit) ──
active_tab = st.query_params.get("tab", "download")
if active_tab != "download":
    if active_tab == "history":
        st.subheader("Lịch sử phân tích")
        if 'history' not in st.session_state or not st.session_state.history:
            st.info("Chưa có lịch sử phân tích. Hãy tải video đầu tiên!")
        else:
            for idx, item in enumerate(reversed(st.session_state.history)):
                st.markdown(f"""
                <div class="m-card flex-col" style="height: auto; padding: 14px; margin-bottom: 12px;">
                    <div class="m-card-left" style="margin-bottom: 6px;">
                        <span class="m-card-dot">●</span>
                        <span class="m-card-title" style="word-break: break-all;">{item['title']}</span>
                    </div>
                    <div class="m-card-sub" style="font-family: monospace; font-size: 10px; word-break: break-all; color: #888888;">
                        {item['url']}
                    </div>
                </div>
                """, unsafe_allow_html=True)
                if st.button("Phân tích lại", key=f"re_analyze_{idx}"):
                    st.session_state.url_value = item['url']
                    st.session_state.prev_url = "" # Force reload
                    st.query_params["tab"] = "download"
                    st.rerun()
                st.write("")
                
    elif active_tab == "gallery":
        st.subheader("Bộ sưu tập tạm thời")
        if st.session_state.media_cache is None:
            st.info("Chưa có phương tiện trong bộ sưu tập. Hãy phân tích đường dẫn trước!")
        else:
            display_media_results(st.session_state.media_cache)
            
    elif active_tab == "settings":
        st.subheader("Cài đặt")
        format_choice = st.radio(
            "Định dạng mặc định cho YouTube:", 
            ("Video (MP4)", "Âm thanh (M4A)"),
            horizontal=True,
            index=0 if st.session_state.get("yt_format", "video") == "video" else 1
        )
        st.session_state.yt_format = "audio" if format_choice == "Âm thanh (M4A)" else "video"
        
        st.write("---")
        if st.button("Xóa bộ nhớ đệm (Clear Cache)"):
            st.session_state.media_cache = None
            st.session_state.start_download = False
            st.session_state.toggle_version = st.session_state.get("toggle_version", 0) + 1
            st.session_state.history = []
            st.success("Đã xóa sạch bộ nhớ tạm thời!")
            st.rerun()
            
    elif active_tab == "help":
        st.subheader("Hướng dẫn sử dụng")
        st.markdown("""
        <div class="m-card flex-col" style="height: auto; padding: 16px; margin-bottom: 12px;">
            <span class="m-card-title">📱 TẢI TỪ INSTAGRAM</span>
            <p style="font-size: 11px; color: #888888; margin: 4px 0 0 0;">
                1. Mở bài viết hoặc Reels trên Instagram.<br>
                2. Bấm nút Chia sẻ (Share) -> Sao chép liên kết (Copy Link).<br>
                3. Dán vào ô nhập liệu và gạt công tắc <b>ANALYZE LINK</b>.
            </p>
        </div>
        <div class="m-card flex-col" style="height: auto; padding: 16px; margin-bottom: 12px;">
            <span class="m-card-title">🎥 TẢI TỪ YOUTUBE / TIKTOK / FB</span>
            <p style="font-size: 11px; color: #888888; margin: 4px 0 0 0;">
                1. Sao chép link video/Shorts của YouTube, video TikTok hoặc Facebook.<br>
                2. Dán link và gạt công tắc để phân tích.<br>
                3. Chọn định dạng Audio/Video mong muốn trong phần cài đặt.
            </p>
        </div>
        """, unsafe_allow_html=True)
        
    st.stop()

# ── Thanh Nhập URL & Nút Clipboard ──
col_input, col_paste = st.columns([5, 1], gap="small")
with col_input:
    url = st.text_input(
        label="URL Input",
        value=st.session_state.get("url_value", ""),
        placeholder="Paste Instagram, Facebook, or TikTok link…",
        label_visibility="collapsed"
    )
with col_paste:
    st.markdown("""
    <button type="button" onclick="pasteClipboard()" class="paste-btn">⎘</button>
    <script>
    function pasteClipboard() {
        var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        if (!navigator.clipboard || !navigator.clipboard.readText) {
            if (isIOS) {
                alert("Trên iPhone (Safari), Apple chặn quyền tự động dán từ nút này do bảo mật. Bạn vui lòng chạm/đè giữ vào ô nhập liệu rồi chọn 'Dán' (Paste) để nhập link nhé!");
            } else {
                alert("Trình duyệt không hỗ trợ dán tự động qua HTTP thường. Vui lòng nhấn Ctrl+V (hoặc Cmd+V) để dán.");
            }
            return;
        }
        navigator.clipboard.readText().then(text => {
            if (!text) {
                alert("Bộ nhớ tạm (clipboard) của bạn đang trống!");
                return;
            }
            let inputs = document.querySelectorAll('div[data-testid="stTextInput"] input');
            if (inputs.length === 0 && window.parent) {
                try {
                    inputs = window.parent.document.querySelectorAll('div[data-testid="stTextInput"] input');
                } catch(e) {}
            }
            if (inputs.length === 0) {
                alert("Không tìm thấy ô nhập liên kết trên màn hình.");
                return;
            }
            inputs.forEach(input => {
                try {
                    let obj = input;
                    let desc = null;
                    while (obj) {
                        desc = Object.getOwnPropertyDescriptor(obj, "value");
                        if (desc) break;
                        obj = Object.getPrototypeOf(obj);
                    }
                    if (desc && desc.set) {
                        desc.set.call(input, text);
                    } else {
                        input.value = text;
                    }
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.focus();
                    input.blur();
                } catch(innerErr) {
                    input.value = text;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.focus();
                    input.blur();
                }
            });
        }).catch(err => {
            if (isIOS) {
                alert("Trên iPhone (Safari), Apple chặn quyền tự động dán từ nút này khi chạy qua khung Streamlit. Bạn vui lòng chạm/đè giữ vào ô nhập liệu rồi chọn 'Dán' (Paste) để nhập link nhé!");
            } else {
                alert("Không thể đọc clipboard. Hãy chắc chắn bạn đã sao chép link và cho phép trang web truy cập clipboard (nút ổ khóa cạnh URL trình duyệt -> cho phép Clipboard).");
            }
            console.log('Clipboard access denied or not supported', err);
        });
    }
    </script>
    """, unsafe_allow_html=True)

# Kiểm tra định dạng link và áp dụng giao diện cảnh báo đỏ nếu sai định dạng
if url and not check_link_validity(url):
    st.markdown("""
    <style>
    /* Viền đỏ cho ô nhập liệu */
    div[data-testid="stTextInput"] [data-baseweb="input"] {
        border-color: #ef4444 !important;
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.25) !important;
    }
    /* Viền đỏ cho toggle */
    div[data-testid="stCheckbox"] [data-baseweb="checkbox"] > div:first-child,
    div[data-testid="stCheckbox"] [role="switch"],
    div[data-testid="stCheckbox"] [role="checkbox"] {
        border-color: #ef4444 !important;
        box-shadow: inset 3px 3px 6px #101010, inset -3px -3px 6px #282828,
                    0 0 10px rgba(239, 68, 68, 0.4) !important;
    }
    /* Chấm đỏ phát sáng nhấp nháy */
    div[data-testid="stCheckbox"] [data-baseweb="checkbox"] > div:first-child::before,
    div[data-testid="stCheckbox"] [role="switch"]::before,
    div[data-testid="stCheckbox"] [role="checkbox"]::before {
        background-color: #ef4444 !important;
        box-shadow: 0 0 8px #dc2626, 0 0 16px #991b1b, 0 0 24px #7f1d1d !important;
        animation: pulseRedGlow 1.5s infinite alternate ease-in-out !important;
    }
    @keyframes pulseRedGlow {
        0% {
            box-shadow: 0 0 6px #dc2626, 0 0 12px #991b1b, 0 0 18px #7f1d1d !important;
            transform: translate(-50%, -50%) scale(0.9) !important;
        }
        100% {
            box-shadow: 0 0 12px #ef4444, 0 0 24px #dc2626, 0 0 36px #991b1b !important;
            transform: translate(-50%, -50%) scale(1.1) !important;
        }
    }
    </style>
    """, unsafe_allow_html=True)

# Nếu URL thay đổi, reset lại toàn bộ trạng thái phân tích
if url != st.session_state.prev_url:
    st.session_state.start_download = False
    st.session_state.media_cache = None
    st.session_state.prev_url = url
    st.session_state.toggle_version = st.session_state.get("toggle_version", 0) + 1

# Lựa chọn định dạng âm thanh/video cho YouTube (nếu phát hiện link YouTube)
if url and any(domain in url for domain in ["youtube.com", "youtu.be"]):
    format_choice = st.radio(
        "Chọn định dạng tải xuống cho YouTube:", 
        ("Video (MP4)", "Âm thanh (M4A)"),
        horizontal=True
    )
    st.session_state.yt_format = "audio" if format_choice == "Âm thanh (M4A)" else "video"

# ── Công tắc Neumorphic Toggle ──
if "toggle_version" not in st.session_state:
    st.session_state.toggle_version = 0

toggle_key = f"toggle_{st.session_state.toggle_version}"

toggle_val = st.toggle(
    label="Analyze Link",
    value=st.session_state.get("start_download", False),
    key=toggle_key,
    label_visibility="collapsed"
)



if toggle_val != st.session_state.get("start_download", False):
    st.session_state.start_download = toggle_val
    if not toggle_val:
        st.session_state.media_cache = None
    st.rerun()

# ── Khởi tạo các ô InfoCard trống ──
size_placeholder = st.empty()
dl_placeholder = st.empty()

# Thiết lập các giá trị mặc định cho thẻ
size_val = "0.0 MB"
dl_val = "0 files  (0.0 MB)"

if st.session_state.start_download:
    if st.session_state.media_cache is None:
        size_val = "Analyzing…"
        dl_val = "Analyzing…"
    else:
        # Đọc thông tin từ cache
        cache = st.session_state.media_cache
        if cache['type'] == 'instagram_album':
            total_bytes = sum(len(item['bytes']) for item in cache['items'] if item['bytes'])
            file_count = len(cache['items'])
        elif cache['type'] == 'instagram_single':
            total_bytes = len(cache['bytes']) if cache['bytes'] else 0
            file_count = 1
        else: # ytdlp
            total_bytes = len(cache['bytes']) if cache['bytes'] else 0
            file_count = 1
            
        size_mb = total_bytes / (1024 * 1024)
        size_val = f"{size_mb:.1f} MB"
        dl_val = f"{file_count} file{'s' if file_count > 1 else ''}  ({size_val})"

# Vẽ các thẻ InfoCard
with size_placeholder:
    render_info_card("Size", size_val)
with dl_placeholder:
    render_info_card("Download Package", "", right_label=dl_val)

# ─────────────────────────────────────────────
#  Hàm xử lý tải phụ trợ (Instaloader & YT-DLP)
# ─────────────────────────────────────────────
def get_file_bytes(file_url):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.get(file_url, headers=headers, stream=True)
        if response.status_code == 200:
            return response.content
    except Exception:
        return None
    return None

def download_with_ytdlp(video_url, download_type="video"):
    if download_type == "audio":
        ydl_opts = {
            'format': 'm4a/bestaudio/best',
            'outtmpl': 'downloads/%(title)s.%(ext)s',
            'quiet': True,
        }
    else:
        ydl_opts = {
            'format': 'best[[ext=mp4]]/best',
            'outtmpl': 'downloads/%(title)s.%(ext)s',
            'quiet': True,
        }
        
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            filename = ydl.prepare_filename(info)
            
            if download_type == "audio" and not filename.endswith('.m4a'):
                base, _ = os.path.splitext(filename)
                if os.path.exists(filename):
                    os.rename(filename, base + '.m4a')
                    filename = base + '.m4a'
                    
            if os.path.exists(filename):
                with open(filename, 'rb') as f:
                    file_data = f.read()
                os.remove(filename)
                return file_data, info.get('title', 'video')
    except Exception as e:
        st.error(f"Lỗi hệ thống khi trích xuất video: {e}")
        return None, None
    return None, None

# ─────────────────────────────────────────────
#  Tiến trình trích xuất phương tiện thực tế
# ─────────────────────────────────────────────
if st.session_state.start_download and st.session_state.media_cache is None:
    if not url:
        st.session_state.xp_error_msg = "Bạn chưa nhập đường dẫn liên kết! Vui lòng dán link trước khi bắt đầu."
        st.session_state.start_download = False
        st.session_state.toggle_version = st.session_state.get("toggle_version", 0) + 1
        st.rerun()
    elif not check_link_validity(url):
        st.session_state.xp_error_msg = "Đường dẫn không đúng định dạng hoặc không được hỗ trợ! Vui lòng kiểm tra lại."
        st.session_state.start_download = False
        st.session_state.toggle_version = st.session_state.get("toggle_version", 0) + 1
        st.rerun()
        
    # Hiển thị trạng thái phân tích trong thẻ
    with size_placeholder:
        render_info_card("Size", "Analyzing…")
    with dl_placeholder:
        render_info_card("Download Package", "", right_label="Analyzing…")
        
    with st.spinner("⏳ Analyzing link..."):
        # 1. Instagram
        if "instagram.com" in url:
            match = re.search(r"/(?:p|reels|reel|share/p)/([A-Za-z0-9_-]+)", url)
            if match:
                shortcode = match.group(1)
                try:
                    L = instaloader.Instaloader(download_videos=True, download_comments=False, save_metadata=False, compress_json=False)
                    post = instaloader.Post.from_shortcode(L.context, shortcode)
                    
                    if post.mediacount > 1:
                        items = []
                        for index, node in enumerate(post.get_sidecar_nodes()):
                            if not node.is_video:
                                img_bytes = get_file_bytes(node.display_url)
                                items.append({
                                    'is_video': False,
                                    'bytes': img_bytes,
                                    'url': node.display_url,
                                    'filename': f"insta_{shortcode}_{index + 1}.jpg"
                                })
                            else:
                                vid_bytes = get_file_bytes(node.video_url)
                                items.append({
                                    'is_video': True,
                                    'bytes': vid_bytes,
                                    'url': node.video_url,
                                    'filename': f"insta_{shortcode}_{index + 1}.mp4"
                                })
                        st.session_state.media_cache = {
                            'type': 'instagram_album',
                            'items': items,
                            'shortcode': shortcode
                        }
                    else:
                        if post.is_video:
                            vid_bytes = get_file_bytes(post.video_url)
                            st.session_state.media_cache = {
                                'type': 'instagram_single',
                                'is_video': True,
                                'bytes': vid_bytes,
                                'url': post.video_url,
                                'filename': f"insta_{shortcode}.mp4",
                                'shortcode': shortcode
                            }
                        else:
                            img_bytes = get_file_bytes(post.url)
                            st.session_state.media_cache = {
                                'type': 'instagram_single',
                                'is_video': False,
                                'bytes': img_bytes,
                                'url': post.url,
                                'filename': f"insta_{shortcode}.jpg",
                                'shortcode': shortcode
                            }
                    # Thêm vào lịch sử
                    if 'history' not in st.session_state:
                        st.session_state.history = []
                    if not any(h['url'] == url for h in st.session_state.history):
                        st.session_state.history.append({
                            'url': url,
                            'title': f"Instagram {shortcode}"
                        })
                except Exception as e:
                    st.error(f"Lỗi phân tích Instagram: {e}")
                    st.session_state.start_download = False
            else:
                st.error("Link Instagram sai định dạng!")
                st.session_state.start_download = False
                
        # 2. YouTube, TikTok, Facebook
        elif any(domain in url for domain in ["youtube.com", "youtu.be", "tiktok.com", "facebook.com", "fb.watch"]):
            download_type = st.session_state.get('yt_format', 'video')
            file_bytes, title = download_with_ytdlp(url, download_type)
            if file_bytes:
                st.session_state.media_cache = {
                    'type': 'ytdlp',
                    'bytes': file_bytes,
                    'title': title,
                    'download_type': download_type
                }
                # Thêm vào lịch sử
                if 'history' not in st.session_state:
                    st.session_state.history = []
                if not any(h['url'] == url for h in st.session_state.history):
                    st.session_state.history.append({
                        'url': url,
                        'title': title
                    })
            else:
                st.error("Không thể trích xuất link tải. Hãy chắc chắn video ở chế độ công khai hoặc thử lại sau.")
                st.session_state.start_download = False
        else:
            st.error("⚠️ Hệ thống hiện tại chưa hỗ trợ nền tảng này!")
            st.session_state.start_download = False
            
    st.rerun()

# ─────────────────────────────────────────────
#  Hiển thị kết quả tải và các nút Tải xuống
# ─────────────────────────────────────────────
if st.session_state.media_cache is not None:
    display_media_results(st.session_state.media_cache)

# ── Hiển thị thông báo lỗi kiểu Windows XP ──
if 'xp_error_msg' in st.session_state and st.session_state.xp_error_msg:
    error_msg = st.session_state.xp_error_msg
    st.session_state.xp_error_msg = None
    
    st.markdown(f"""
    <div id="xp-alert" class="xp-overlay">
        <div class="xp-window">
            <div class="xp-titlebar">
                <span class="xp-title">Error</span>
                <div onclick="document.getElementById('xp-alert').style.display='none'" class="xp-close">✕</div>
            </div>
            <div class="xp-body">
                <div class="xp-icon"></div>
                <div class="xp-text">{error_msg}</div>
            </div>
            <div class="xp-actions">
                <button type="button" onclick="document.getElementById('xp-alert').style.display='none'" class="xp-btn">OK</button>
            </div>
        </div>
    </div>
    <audio autoplay src="https://www.myinstants.com/media/sounds/windows-xp-error.mp3"></audio>
    """, unsafe_allow_html=True)

