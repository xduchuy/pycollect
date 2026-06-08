import streamlit as st
import instaloader
import re
import requests
import yt_dlp
import os

# Cấu hình giao diện trang web
st.set_page_config(
    page_title="PyCollect - Trình tải đa phương tiện",
    page_icon="favicon.png",
    layout="centered"
)

# Thêm mã CSS tùy chỉnh để tái tạo giao diện PyCollect cao cấp
st.markdown("""
<style>
/* Nạp font Outfit từ Google */
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');

/* Áp dụng font và màu nền tối đặc trưng của PyCollect */
html, body, [class*="css"], .stApp, .stMarkdown, p, span, label, input, button {
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif !important;
}

.stApp {
    background-color: #0d0d0d !important;
    color: #ffffff !important;
}

/* Hiệu ứng Glow Blob phát sáng phía sau (giống PyQt6 GlowBlob) */
.stApp::before {
    content: "" !important;
    position: fixed !important;
    top: 40px !important;
    left: -100px !important;
    width: 320px !important;
    height: 320px !important;
    background: radial-gradient(circle, rgba(232, 83, 10, 0.22) 0%, rgba(180, 60, 10, 0.08) 50%, rgba(0, 0, 0, 0) 100%) !important;
    pointer-events: none !important;
    z-index: 0 !important;
    animation: glowAnimation 10s infinite alternate ease-in-out !important;
}

@keyframes glowAnimation {
    0% { transform: scale(0.9); opacity: 0.6; }
    100% { transform: scale(1.15); opacity: 0.95; }
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
    max-width: 420px !important;
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
    margin-bottom: 28px !important;
    text-align: left !important;
}
.m-title {
    color: #ffffff !important;
    font-size: 36px !important;
    font-weight: 800 !important;
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
    font-size: 14px !important;
}
.m-subtitle {
    color: #e8530a !important;
    font-size: 10px !important;
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
    color: #888888 !important;
    border: 1px solid #333333 !important;
    border-radius: 11px !important;
    font-size: 16px !important;
    width: 44px !important;
    height: 44px !important;
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

/* Định dạng ô nhập liệu (QLineEdit) */
div[data-testid="stTextInput"] input {
    border-radius: 14px !important;
    border: 1px solid #2a2a2a !important;
    background-color: #1a1a1a !important;
    color: #ffffff !important;
    padding: 12px 16px !important;
    height: 54px !important;
    font-size: 13px !important;
    transition: all 0.3s ease !important;
}
div[data-testid="stTextInput"] input:focus {
    border-color: #e8530a !important;
    box-shadow: 0 0 10px rgba(232, 83, 10, 0.25) !important;
}

/* Tùy chỉnh thanh trượt Swipe Slider (giống SwipeSlider trong PyQt6) */
div[data-testid="stSlider"] {
    background: #1a1a1a !important;
    border: 1px solid #2a2a2a !important;
    border-radius: 14px !important;
    padding: 8px 16px !important;
    height: 54px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    position: relative !important;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4) !important;
    margin-bottom: 8px !important;
}

/* Ẩn các nhãn số mặc định của Streamlit slider */
div[data-testid="stSlider"] > label,
div[data-testid="stSlider"] [data-testid="stWidgetLabel"],
div[data-testid="stSlider"] div[data-baseweb="slider"] + div {
    display: none !important;
}

/* Container rãnh trượt */
div[data-testid="stSlider"] div[data-baseweb="slider"] {
    height: 32px !important;
    background-color: transparent !important;
    border: none !important;
    width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
}

/* Rãnh trượt tối bên dưới */
div[data-testid="stSlider"] div[data-baseweb="slider"] > div:first-child {
    height: 100% !important;
    background-color: #222222 !important;
    border-radius: 16px !important;
    border: none !important;
}

/* Dải màu sáng khi kéo */
div[data-testid="stSlider"] div[data-baseweb="slider"] > div:first-child > div:first-child {
    background-color: rgba(232, 83, 10, 0.25) !important;
    border-radius: 16px 0 0 16px !important;
}

/* Con chạy trượt (Handle) */
div[data-testid="stSlider"] div[role="slider"] {
    width: 26px !important;
    height: 26px !important;
    background-color: #2e2e2e !important;
    border: 2px solid #2a2a2a !important;
    border-radius: 50% !important;
    top: 3px !important;
    box-shadow: 0 0 6px rgba(232, 83, 10, 0.45) !important;
    transition: background-color 0.2s, box-shadow 0.2s !important;
    cursor: grab !important;
}
div[data-testid="stSlider"] div[role="slider"]:active {
    background-color: #e8530a !important;
    box-shadow: 0 0 12px rgba(232, 83, 10, 0.8) !important;
    cursor: grabbing !important;
}

/* Chữ SWIPE TO ANALYZE đè bên trong rãnh trượt */
div[data-testid="stSlider"]::after {
    content: "SWIPE TO ANALYZE" !important;
    position: absolute !important;
    font-size: 8px !important;
    font-weight: 700 !important;
    color: #555555 !important;
    letter-spacing: 2px !important;
    pointer-events: none !important;
    z-index: 1 !important;
    font-family: 'JetBrains Mono', monospace !important;
}

.m-swipe-lbl {
    color: #555555 !important;
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
    height: 58px !important;
}
.m-card.flex-col {
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    height: 70px !important;
    gap: 4px !important;
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
.m-card-sub {
    color: #888888 !important;
    font-size: 10px !important;
    letter-spacing: 1px !important;
    font-weight: 600 !important;
}
.m-card-val {
    color: #ffffff !important;
    font-size: 18px !important;
    font-weight: 700 !important;
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
</style>
""", unsafe_allow_html=True)

# ── Hàm vẽ InfoCard (PyCollect Style) ──
def render_info_card(label, value, right_label=""):
    if right_label:
        # Dạng thẻ Download Package
        st.markdown(f"""
        <div class="m-card flex-row">
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
        <div class="m-card flex-col">
            <span class="m-card-sub">{label.upper()}</span>
            <span class="m-card-val">{value}</span>
        </div>
        """, unsafe_allow_html=True)

# ── Vẽ thanh Navbar trên cùng ──
st.markdown("""
<div class="m-navbar">
    <span class="m-nav-item">🔍</span>
    <span class="m-nav-item">🕐</span>
    <span class="m-nav-item active">📸</span>
    <span class="m-nav-item">▶</span>
    <span class="m-nav-item">☑</span>
</div>
""", unsafe_allow_html=True)

# ── Vẽ Khối Tiêu đề chính ──
st.markdown("""
<div class="m-title-container">
    <h1 class="m-title">PyCollect</h1>
    <div class="m-subtitle-row">
        <span class="m-spark">✦</span>
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

# ── Thanh Nhập URL & Nút Clipboard ──
col_input, col_paste = st.columns([5, 1], gap="small")
with col_input:
    url = st.text_input(
        label="URL Input",
        placeholder="Paste Instagram, Facebook, or TikTok link…",
        label_visibility="collapsed"
    )
with col_paste:
    st.markdown("""
    <button onclick="pasteClipboard()" class="paste-btn">⎘</button>
    <script>
    function pasteClipboard() {
        navigator.clipboard.readText().then(text => {
            const inputs = window.parent.document.querySelectorAll('div[data-testid="stTextInput"] input');
            inputs.forEach(input => {
                input.value = text;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
        }).catch(err => {
            console.log('Clipboard access denied or not supported', err);
        });
    }
    </script>
    """, unsafe_allow_html=True)

# Nếu URL thay đổi, reset lại toàn bộ trạng thái phân tích
if url != st.session_state.prev_url:
    st.session_state.start_download = False
    st.session_state.media_cache = None
    st.session_state.prev_url = url

# Lựa chọn định dạng âm thanh/video cho YouTube (nếu phát hiện link YouTube)
if url and any(domain in url for domain in ["youtube.com", "youtu.be"]):
    format_choice = st.radio(
        "Chọn định dạng tải xuống cho YouTube:", 
        ("Video (MP4)", "Âm thanh (M4A)"),
        horizontal=True
    )
    st.session_state.yt_format = "audio" if format_choice == "Âm thanh (M4A)" else "video"

# ── Thanh trượt Swipe Slider ──
if "interactive_slider" not in st.session_state:
    st.session_state.interactive_slider = 0

if st.session_state.get("slider_reset", False):
    st.session_state.interactive_slider = 0
    st.session_state.slider_reset = False

slider_val = st.slider(
    label="Swipe to Analyze",
    min_value=0,
    max_value=100,
    key="interactive_slider",
    label_visibility="collapsed"
)

st.markdown("""
<div style="text-align: center; margin-top: 6px; margin-bottom: 24px;">
    <span class="m-swipe-lbl">SWIPE TO ANALYZE</span>
</div>
""", unsafe_allow_html=True)

# Kích hoạt phân tích khi kéo thanh trượt đến 95%+
if slider_val >= 95:
    st.session_state.start_download = True
    st.session_state.slider_reset = True
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
if url and st.session_state.start_download and st.session_state.media_cache is None:
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
    cache = st.session_state.media_cache
    st.success("🎉 Đã phân tích xong phương tiện!")
    
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

st.write("")
st.write("---")
st.caption("PyCollect Web Recreation: Tích hợp Instaloader & YT-DLP chạy trên nền Streamlit.")
