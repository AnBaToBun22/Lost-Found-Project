// --- 1. DỮ LIỆU & BIẾN TOÀN CỤC ---
let mockData = [
    { id: 1, type: 'lost', name: 'Ví da nam màu đen', location: 'Nhà xe khu A', date: '2 giờ trước', image: 'https://via.placeholder.com/300x180/333/fff?text=Wallet' },
    { id: 2, type: 'found', name: 'Chìa khóa xe Honda', location: 'Căn tin B', date: '5 giờ trước', image: 'https://via.placeholder.com/300x180/ddd/333?text=Keys' },
];

// Biến lưu người dùng đang đăng nhập
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let allPostsData = []; // Biến lưu toàn bộ bài viết từ DB để xem chi tiết

function initAuth() {
    const userArea = document.getElementById('userArea');
    if (currentUser) {
        // Đã đăng nhập -> Hiện Avatar + Mũi tên (Giống Facebook)
            userArea.innerHTML = `
            <div class="user-dropdown-container">
                <div class="user-trigger" onclick="toggleDropdown(event)">
                    <div class="user-avatar-circle">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <i class="fa-solid fa-chevron-down caret-icon"></i>
                </div>
                <div id="userDropdownMenu" class="dropdown-menu-box">
                    <div class="menu-header" style="padding: 10px 15px;"><strong>${currentUser.username}</strong></div>
                    <hr style="margin: 0; border: 0; border-top: 1px solid #eee;">
                    
                    <button class="menu-item" onclick="openUpdateProfileModal()" style="width: 100%; text-align: left; background: none; border: none; padding: 12px 15px; cursor: pointer; display: flex; gap: 10px; align-items: center; font-family: inherit; font-size: 14px; color: #333; transition: background 0.2s;">
                        <i class="fa-solid fa-user-pen" style="color: #4A90E2; width: 16px; text-align: center;"></i> Cập nhật thông tin
                    </button>
                    
                    <button class="menu-item logout-red" onclick="handleLogout()" style="width: 100%; text-align: left; background: none; border: none; padding: 12px 15px; cursor: pointer; display: flex; gap: 10px; align-items: center; font-family: inherit; font-size: 14px; color: #e74c3c; transition: background 0.2s;">
                        <i class="fa-solid fa-right-from-bracket" style="width: 16px; text-align: center;"></i> Đăng xuất
                    </button>
                </div>
            </div>
        `;
    } else {
        // Chưa đăng nhập -> Hiện nút Login cũ của bạn
        userArea.innerHTML = `
            <button class="btn-login" onclick="openAuthModal()">
                <i class="fa-regular fa-user"></i> Đăng nhập
            </button>
        `;
    }
}

// Mở Modal Auth
function openAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
    switchAuth('login'); // Mặc định mở tab Login
}

// Chuyển đổi giữa Login / Register / Forgot với Animation
function switchAuth(mode) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotForm = document.getElementById('forgotForm');
    const allForms = [loginForm, registerForm, forgotForm];

    // Thêm animation fade-out cho các form đang hiển thị
    allForms.forEach(form => {
        if (form.style.display !== 'none') {
            form.classList.add('fade-out');
            form.classList.remove('fade-in');
        }
    });

    // Chuyển đổi form sau khi animation hoàn thành
    setTimeout(() => {
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        forgotForm.style.display = 'none';
        
        let activeForm;
        if(mode === 'login') activeForm = loginForm;
        if(mode === 'register') activeForm = registerForm;
        if(mode === 'forgot') activeForm = forgotForm;
        
        if (activeForm) {
            activeForm.style.display = 'block';
            activeForm.classList.add('fade-in');
            activeForm.classList.remove('fade-out');
        }
    }, 300);
}

// Xử lý ĐĂNG KÝ với Animation
function handleRegister() {
    const user = document.getElementById('regUser').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPass').value;
    const phone = document.getElementById('regPhone').value;
    const region = document.getElementById('regRegion').value;
    const regButton = document.querySelector('#registerForm .btn-submit');

    if (!user || !email || !pass) {
        showErrorMessage('registerForm', "Vui lòng nhập đầy đủ thông tin!");
        return;
    }
    if (!email.includes('@')) {
        showErrorMessage('registerForm', "Email không hợp lệ!");
        return;
    }

    if (pass.length < 6) {
        showErrorMessage('registerForm', "Mật khẩu phải có ít nhất 6 ký tự!");
        return;
    }

    // Thêm loading animation
    regButton.classList.add('loading');

    // GỌI API THAY VÌ LƯU LOCALSTORAGE
    fetch('http://127.0.0.1:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            username: user,
            email: email,
            password: pass,
            phone: phone,
            region: region })
    })
    .then(response => response.json())
    .then(data => {
        regButton.classList.remove('loading');
        
        if (data.message === "Đăng ký thành công!") {
            showSuccessMessage('registerForm', "✓ Đăng ký thành công! Hãy đăng nhập.");
            setTimeout(() => switchAuth('login'), 1500);
        } else {
            showErrorMessage('registerForm', data.message);
        }
    })
    .catch(error => {
        regButton.classList.remove('loading');
        showErrorMessage('registerForm', "Lỗi kết nối!! Tài khoản bị trùng tên hoặc email đã tồn tại.");
        console.error('Error:', error);
    });
}

// Xử lý ĐĂNG NHẬP
async function handleLogin() {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    const loginForm = document.getElementById('loginForm');
    const loginButton = loginForm.querySelector('.btn-submit');

    if (!user || !pass) {
        showErrorMessage('loginForm', "Vui lòng nhập đầy đủ thông tin!");
        return;
    }

    // Bật loading
    loginButton.classList.add('loading');
    loginButton.disabled = true;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user; 
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            if (currentUser.role === "admin") {
                window.location.href = "/admin.html";
                return;
            }

            showSuccessMessage('loginForm', "✓ " + data.message);
            
            setTimeout(() => {
                closeModal('authModal');
                initAuth();
            }, 1000);
        } else {
            showErrorMessage('loginForm', "✗ " + data.message);
        }
    } catch (error) {
        showErrorMessage('loginForm', "Không thể kết nối đến máy chủ!");
        console.error("Lỗi:", error);
    } finally {
        loginButton.classList.remove('loading');
        loginButton.disabled = false;
    }
}

// Xử lý ĐĂNG XUẤT
function handleLogout() {
    if(confirm("Bạn có chắc muốn đăng xuất?")) {
        localStorage.removeItem('currentUser');
        currentUser = null;
        initAuth();
        window.location.reload();
    }
}

// Xử lý QUÊN MẬT KHẨU (Fake)
function handleForgot() {
    const email = document.getElementById('forgotEmail').value;
    if(email) {
        alert(`Mã OTP đã được gửi về ${email}. (Demo: Mật khẩu của bạn là '123')`);
        switchAuth('login');
    } else {
        alert("Vui lòng nhập email!");
    }
}

// --- 3. CÁC CHỨC NĂNG CHÍNH (ĐĂNG TIN, HIỂN THỊ) ---

// ── Xem trước ảnh trước khi upload ───────────────────────────────
function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('imagePreview');
        preview.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// ── Hiện/ẩn ô secret + mở modal đăng tin ─────────────────────────
let currentPostType = 'lost';
function checkLoginBeforeAction(type) {
    if (!currentUser) {
        alert("Bạn cần Đăng nhập để thực hiện chức năng này!");
        openAuthModal();
        return;
    }
    currentPostType = type;
    const modal  = document.getElementById('postModal');
    const title  = document.getElementById('modalTitle');
    const secret = document.getElementById('secretGroup');

    title.innerText = type === 'lost' ? '🔴 Đăng tin MẤT ĐỒ' : '🟢 Đăng tin NHẶT ĐƯỢC';
    title.style.color = type === 'lost' ? 'var(--lost)' : 'var(--found)';

    // Chỉ hiện ô bí mật khi đăng "Found"
    secret.style.display = type === 'found' ? 'block' : 'none';

    const dropoff = document.getElementById('dropoffGroup');
    dropoff.style.display = type === 'found' ? 'block' : 'none';
    // Set mặc định ngày hôm nay
    document.getElementById('itemDate').value = new Date().toISOString().split('T')[0];

    modal.style.display = 'flex';
    setTimeout(() => {
        if (!map) {
            initMap(); // Khởi tạo lần đầu
        } else {
            map.invalidateSize(); // Các lần sau chỉ cần refresh lại kích thước
        }
    }, 300);
}
let mainMap;
let mainMarkersLayer;

// 1. Hàm bật/tắt bản đồ khi bấm nút
function toggleMainMap() {
    const container = document.getElementById('mainMapContainer');
    if (container.style.display === 'none') {
        container.style.display = 'block';
        if (!mainMap) {
            initMainMap(); // Lần đầu mở thì khởi tạo
        } else {
            drawPinsOnMap(allPostsData); // Các lần sau thì vẽ lại ghim
        }
        // Ép bản đồ load lại kích thước để không bị lỗi xám mờ
        setTimeout(() => mainMap.invalidateSize(), 300);
    } else {
        container.style.display = 'none';
    }
}

// 2. Hàm khởi tạo bản đồ lớn
function initMainMap() {
    mainMap = L.map('mainMap').setView([16.0544, 108.2022], 13); // Tọa độ mặc định (Đà Nẵng)
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(mainMap);
    
    mainMarkersLayer = L.layerGroup().addTo(mainMap); // Lớp chứa các cây ghim
    
    // Nếu trang đã tải xong dữ liệu bài viết thì vẽ ghim luôn
    if (typeof allPostsData !== 'undefined' && allPostsData.length > 0) {
        drawPinsOnMap(allPostsData);
    }

let searchMarker; // Biến lưu cây cờ tìm kiếm tạm thời

    L.Control.geocoder({
        defaultMarkGeocode: false,
        placeholder: "🔍 Nhập Tên đường, Thành phố (VD: An Cư 7, Đà Nẵng)...",
        errorMessage: "Không tìm ra (Thử bỏ số nhà, chỉ ghi Tên đường + Tỉnh/TP nhé)."
    }).on('markgeocode', function(e) {
        const latlng = e.geocode.center;

        // 1. Bay đến vị trí tìm được và phóng to lên mức 17
        mainMap.setView(latlng, 17); 

        // 2. Nếu trước đó có tìm chỗ khác rồi thì rút cây cờ cũ ra
        if (searchMarker) {
            mainMap.removeLayer(searchMarker);
        }

        // 3. Cắm cây cờ mới vào đúng vị trí vừa tìm
        searchMarker = L.marker(latlng).addTo(mainMap);

        // 4. Hiện luôn một cái bảng nhỏ báo tên đường nó tìm được
        searchMarker.bindPopup(`<b>📍 Kết quả tìm kiếm:</b><br>${e.geocode.name}`).openPopup();

    }).addTo(mainMap);
}

// 3. Hàm cắm ghim tất cả bài viết lên bản đồ
function drawPinsOnMap(posts) {
    if (!mainMap || !mainMarkersLayer) return;
    
    mainMarkersLayer.clearLayers(); // Xóa sạch ghim cũ trên bản đồ
    
    posts.forEach(post => {
        // Chỉ vẽ những bài nào CÓ LƯU TỌA ĐỘ
        if (post.latitude && post.longitude) {
            const lat = parseFloat(post.latitude);
            const lng = parseFloat(post.longitude);
            
            // Tạo cây ghim
            const marker = L.marker([lat, lng]);
            
            // Thiết kế nội dung cái bảng nhỏ hiện ra khi bấm vào cây ghim
            const popupContent = `
                <div style="text-align: center; min-width: 150px;">
                    <div style="font-size: 12px; font-weight: bold; color: ${post.type === 'lost' ? '#e74c3c' : '#1DD1A1'}; margin-bottom: 5px;">
                        ${post.type === 'lost' ? '🔴 Đang tìm' : '🟢 Đã nhặt'}
                    </div>
                    <strong style="font-size: 14px; color: #333;">${post.item_name}</strong>
                    <div style="font-size: 12px; color: #777; margin: 5px 0;">📍 ${post.location}</div>
                    <button onclick="showPostDetail(${post.id})" style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;">
                        Xem chi tiết
                    </button>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            mainMarkersLayer.addLayer(marker);
        }
    });
}

// ── Gửi bài đăng lên server ───────────────────────────────────────
async function handlePost(e) {
    e.preventDefault();
    const btn = document.querySelector('#postForm .btn-submit');
    btn.innerText = '⏳ Đang đăng và phân tích...'; 
    btn.disabled = true;

    // Đọc ảnh dạng base64
    let image_base64 = null;
    const imgFile = document.getElementById('itemImage').files[0];
    if (imgFile) {
        image_base64 = await new Promise(resolve => {
            const r = new FileReader();
            r.onload = e => resolve(e.target.result);
            r.readAsDataURL(imgFile);
        });
    }

    const payload = {
        user_id      : currentUser.id,
        username     : currentUser.username,
        type         : currentPostType,
        item_name    : document.getElementById('itemName').value,
        category     : document.getElementById('itemCategory').value,
        location     : document.getElementById('itemLocation').value,
        latitude     : document.getElementById('latitude')?.value || '',
        longitude    : document.getElementById('longitude')?.value || '',
        lost_date    : document.getElementById('itemDate').value,
        description  : document.getElementById('itemDescription').value,
        secret_detail: document.getElementById('itemSecret')?.value || '',
        dropoff_point: document.getElementById('itemDropoff')?.value || '',
        image_base64 : image_base64
    };

    try {
        const res  = await fetch('/api/posts', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify(payload)
        });
        const data = await res.json(); // Nhận data từ Python trả về

        if (res.ok) {
            closeModal('postModal'); 
            document.getElementById('postForm').reset();
            document.getElementById('imagePreview').style.display = 'none';
            
            // Tải lại danh sách từ DB (Lúc này DB đã được Python cập nhật trạng thái nếu có match)
            loadPosts(); 

            // =========================================================
            // KIỂM TRA KẾT QUẢ AI MATCHING TỪ BACKEND TRẢ VỀ
            // =========================================================
            if (data.matches && data.matches.length > 0) {
                const bestMatch = data.matches[0];
                
                // Gán thêm thông tin bài đăng của chính user (lấy từ dữ liệu trả về hoặc payload)
                const myPost = {
                    item_name: payload.item_name,
                    category: payload.category,
                    location: payload.location
                };

                // Bật Modal BINGO báo hỉ 
                showAutoMatchSuccess(myPost, bestMatch);
            } else {
                // Nếu AI không tìm ra ai trùng khớp
                alert("✅ Đăng tin thành công! AI đang theo dõi, hệ thống sẽ thông báo ngay khi có người đăng bài trùng khớp.");
            }

        } else {
            alert("❌ Lỗi: " + data.message);
        }
    } catch (err) {
        alert("Không kết nối được server!");
        console.error(err);
    } finally {
        btn.innerText = '📮 Đăng tin';
        btn.disabled = false;
    }
}
// Hàm hiển thị Popup Kết quả AI (Đã nâng cấp thông báo thông minh)
function showAiMatchModal(matches, postType) {
    const modal = document.getElementById('aiMatchModal');
    const listContainer = document.getElementById('aiMatchList');
    const textElement = document.getElementById('aiMatchText');

    // --- XỬ LÝ CÂU CHỮ TÙY THEO LOẠI TIN ---
    if (postType === 'lost') {
        // Nếu người dùng vừa đăng tin Báo Mất
        textElement.innerHTML = `Hệ thống tìm thấy <strong>${matches.length}</strong> món đồ người khác nhặt được có khả năng là của bạn.`;
    } else {
        // Nếu người dùng vừa đăng tin Nhặt Được
        textElement.innerHTML = `Tuyệt vời! Hệ thống tìm thấy <strong>${matches.length}</strong> người đang tìm kiếm món đồ giống hệt thế này.`;
    }
    
    let html = '';
    matches.forEach(m => {
        html += `
            <div style="border-bottom: 1px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px;">
                <h4 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 16px;">${m.item_name}</h4>
                <div style="font-size: 14px; color: #555;">
                    <span style="display:inline-block; background:#ffeaa7; padding:2px 8px; border-radius:10px; font-weight:bold; color:#d35400; font-size:12px;">Độ khớp: ${m.score.toFixed(0)}%</span>
                    <span style="margin-left:10px;"><i class="fa-solid fa-location-dot"></i> Cách: ${m.distance_km} km</span>
                </div>
                <div style="font-size: 14px; color: #555; margin-top: 5px;">
                    <i class="fa-solid fa-user"></i> Người đăng: <strong style="color: #3498db;">${m.contact_user}</strong>
                </div>
            </div>
        `;
    });
    
    // Bơm HTML vào khung và cho hiển thị lên
    listContainer.innerHTML = html;
    modal.style.display = 'flex';
}

// ── Load bài đăng từ DB thay vì mockData ─────────────────────────
async function loadPosts(type = '', category = '', location = '', status = 'active') {
    const grid = document.getElementById('itemsGrid');
    grid.innerHTML = '<p style="text-align:center;color:#999;">Đang tải...</p>';

    const url = `/api/posts?type=${type}&category=${category}&location=${location}&status=${status}`;

    try {
        const res   = await fetch(url);
        const posts = await res.json();
        
        allPostsData = posts; // LƯU VÀO MẢNG ĐỂ DÙNG CHUNG CHO BẢN ĐỒ VÀ CHI TIẾT

        if (posts.length === 0) {
            grid.innerHTML = '<p style="text-align:center;color:#999;">Chưa có bài đăng nào.</p>';
            return;
        }
        renderItems(posts);
    } catch (err) {
        grid.innerHTML = '<p style="text-align:center;color:red;">Lỗi tải dữ liệu!</p>';
    }
}

// ── Lưu dữ liệu bài đăng vào map để dùng cho edit ───────────────
let postsMap = {};

// ── Hiển thị danh sách bài đăng (dùng dữ liệu từ DB) ─────────────
function renderItems(data) {
    const grid = document.getElementById('itemsGrid');
    grid.innerHTML = '';
    postsMap = {}; // reset map

    data.forEach(item => {
        postsMap[item.id] = item; // lưu vào map để openEditModal dùng

        const badgeClass = item.type === 'lost' ? 'tag-lost' : 'tag-found';
        const badgeText  = item.type === 'lost' ? '🔴 Đang tìm' : '🟢 Đã nhặt';
        // Badge ghép đôi
        const matchBadge = (item.status === 'matching' && item.matched_with)
            ? `<div style="background:#f3e5f5;border:1.5px solid #9b59b6;border-radius:8px;padding:6px 10px;margin-top:8px;font-size:12px;color:#6c3483;display:flex;align-items:center;gap:6px;">
                <i class="fa-solid fa-link"></i>
                <span>Đang ghép với: <b id="matchedTitle_${item.id}">Đang tải...</b></span>
            </div>`
            : '';
        const imgSrc     = item.image_url || 'https://via.placeholder.com/300x180/ddd/999?text=No+Image';
        const timeAgo    = formatTime(item.created_at);
        const isOwner    = currentUser && currentUser.id === item.user_id;

        // Thêm event.stopPropagation() để không bị dội sự kiện bấm vào Card
        const isMatching   = item.status === 'matching';
        const isResolved   = item.status === 'resolved';
        const ownerButtons = isOwner ? (isResolved ? `
            <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;" onclick="event.stopPropagation()">
                <button onclick="event.stopPropagation();unresolvePost(${item.id})"
                    style="padding:6px 12px;background:#f39c12;color:white;border:none;border-radius:12px;cursor:pointer;font-size:12px;">
                    🔄 Chưa giải quyết
                </button>
                <button onclick="event.stopPropagation();deletePost(${item.id})"
                    style="padding:6px 12px;background:#FF6B6B;color:white;border:none;border-radius:12px;cursor:pointer;font-size:12px;">
                    🗑️ Xóa
                </button>
            </div>` : isMatching ? `
            <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;" onclick="event.stopPropagation()">
                <button onclick="event.stopPropagation();resolvePost(${item.id})"
                    style="padding:6px 12px;background:#1DD1A1;color:white;border:none;border-radius:12px;cursor:pointer;font-size:12px;">
                    ✅ Đã giải quyết
                </button>
                <button onclick="event.stopPropagation();unmatchPost(${item.id})"
                    style="padding:6px 12px;background:#f39c12;color:white;border:none;border-radius:12px;cursor:pointer;font-size:12px;">
                    ↩️ Huỷ ghép
                </button>
                <button onclick="event.stopPropagation();deletePost(${item.id})"
                    style="padding:6px 12px;background:#FF6B6B;color:white;border:none;border-radius:12px;cursor:pointer;font-size:12px;">
                    🗑️ Xóa
                </button>
            </div>` : `
            <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;" onclick="event.stopPropagation()">
                <button onclick="event.stopPropagation();manualMatchPost(${item.id})"
                    style="padding:6px 12px;background:#9b59b6;color:white;border:none;border-radius:12px;cursor:pointer;font-size:12px;">
                    🔗 Ghép đôi
                </button>
                <button onclick="event.stopPropagation();resolvePost(${item.id})"
                    style="padding:6px 12px;background:#1DD1A1;color:white;border:none;border-radius:12px;cursor:pointer;font-size:12px;">
                    ✅ Đã giải quyết
                </button>
                <button onclick="event.stopPropagation();openEditModal(${item.id})"
                    style="padding:6px 12px;background:#4A90E2;color:white;border:none;border-radius:12px;cursor:pointer;font-size:12px;">
                    ✏️ Sửa
                </button>
                <button onclick="event.stopPropagation();deletePost(${item.id})"
                    style="padding:6px 12px;background:#FF6B6B;color:white;border:none;border-radius:12px;cursor:pointer;font-size:12px;">
                    🗑️ Xóa
                </button>
            </div>`) : '';
        const dropoffHtml = item.dropoff_point 
            ? `<div class="card-info" style="color:#27ae60; font-weight:bold;">
                <i class="fa-solid fa-building-shield"></i> Gửi tại: ${item.dropoff_point}
            </div>` 
            : '';
        // Đã thêm sự kiện onclick="showPostDetail" vào từng thẻ bài viết
        grid.innerHTML += `
            <div class="card" data-id="${item.id}" onclick="showPostDetail(${item.id})" style="cursor: pointer;">
                <span class="card-tag ${badgeClass}">${badgeText}</span>
                <div class="card-img">
                    <img src="${imgSrc}" alt="${item.item_name}">
                </div>
                <div class="card-body">
                    <h3 class="card-title">${item.item_name}</h3>
                    <div class="card-info"><i class="fa-solid fa-tag"></i> ${item.category || 'Không rõ'}</div>
                    <div class="card-info"><i class="fa-solid fa-location-dot"></i> ${item.location}</div>
                    <div class="card-info"><i class="fa-regular fa-calendar"></i> ${item.lost_date}</div>
                    <div class="card-info"><i class="fa-regular fa-clock"></i> ${timeAgo}</div>
                    ${item.description ? `<p style="font-size:13px;color:#888;margin-top:8px;">${item.description}</p>` : ''}
                    ${matchBadge}
                    ${ownerButtons}
                </div>
            </div>`;
    });
    // Điền tên bài đang ghép
    data.forEach(item => {
        if (item.status === 'matching' && item.matched_with) {
            const el = document.getElementById(`matchedTitle_${item.id}`);
            if (!el) return;

            const matched = allPostsData.find(p => p.id === item.matched_with);
            if (matched) {
                el.textContent = `"${matched.item_name}" — ${matched.username}`;
            } else {
                // Fetch riêng nếu bài kia không có trong tab hiện tại
                fetch(`/api/posts/${item.matched_with}/info`)
                    .then(r => r.json())
                    .then(info => {
                        el.textContent = `"${info.item_name}" — ${info.username}`;
                    })
                    .catch(() => {
                        el.textContent = `#${item.matched_with}`;
                    });
            }
        }
    });
    if (typeof drawPinsOnMap === 'function') { drawPinsOnMap(data); }
}

// Biến toàn cục cho bản đồ chi tiết
let detailMap;
let detailMarker;

// --- HÀM HIỂN THỊ CHI TIẾT BÀI ĐĂNG (CÓ TÍCH HỢP BẢN ĐỒ) ---
function showPostDetail(postId) {
    // Set currentDetailPostId để các hàm comment/contact/share dùng
    currentDetailPostId = postId;

    // 1. Tìm bài viết có ID tương ứng
    const post = allPostsData.find(p => p.id === postId);
    if (!post) return;

    // 2. Bơm dữ liệu chữ vào Modal
    document.getElementById('detailTitle').innerText = post.item_name;
    document.getElementById('detailCategory').innerText = post.category || 'Không rõ';
    document.getElementById('detailLocation').innerText = post.location;
    document.getElementById('detailDate').innerText = post.lost_date || 'Không rõ';
    document.getElementById('detailUser').innerText = post.username;
    document.getElementById('detailDescription').innerText = post.description || 'Không có mô tả chi tiết.';

    // 3. Xử lý Trạng thái
    const statusSpan = document.getElementById('detailStatus');
    statusSpan.innerText = post.type === 'lost' ? '🔴 Đang tìm' : '🟢 Đã nhặt được';
    statusSpan.className = post.type === 'lost' ? 'card-tag tag-lost' : 'card-tag tag-found';

    // 4. Xử lý Ảnh
    const imgEl = document.getElementById('detailImage');
    if (post.image_url) {
        imgEl.src = post.image_url;
        imgEl.style.display = 'inline-block';
    } else {
        imgEl.style.display = 'none';
    }
    // 5.5 XỬ LÝ HIỂN THỊ ĐIỂM GIAO NHẬN (DROP-OFF POINT) CỰC KỲ BẢO MẬT
    const dropoffBox = document.getElementById('detailDropoffBox');
    
    // ĐIỀU KIỆN 1: Đây phải là bài "Nhặt được đồ"
    const isFoundPost = post.type === 'found';
    
    // ĐIỀU KIỆN 2: Người xem đã đăng nhập và KHÔNG PHẢI là người nhặt (người đăng bài)
    const isNotAuthor = currentUser && currentUser.id !== post.user_id;

    // ĐIỀU KIỆN 3: Người xem chính là NGƯỜI ĐƯỢC MATCHING
    let isMatchedUser = false;
    
    // Nếu bài này đã được AI ghép đôi
    if (currentUser && (post.status === 'matching')) {
        // Tìm xem trong hệ thống, người xem có bài "Mất đồ" nào cũng đã "matching" và khớp danh mục không
        const myLostPost = allPostsData.find(p => 
            p.user_id === currentUser.id && 
            p.type === 'lost' && 
            p.status === 'matching' &&
            p.matched_with === post.id
        );
        
        // Nếu tìm thấy, xác nhận đây chính là chủ nhân thực sự!
        if (myLostPost) {
            isMatchedUser = true;
        }
    }

    // CHỐT KẾT QUẢ: Chỉ bung thông tin khi thỏa mãn TOÀN BỘ điều kiện
    if (post.dropoff_point && isFoundPost && isNotAuthor && isMatchedUser) {
        dropoffBox.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <i class="fa-solid fa-building-shield" style="color:#2ecc71; font-size: 24px; margin-top: 2px;"></i> 
                <div>
                    <strong style="color: #2c3e50; font-size: 15px;">Món đồ này đã được gửi lại tại:</strong> 
                    <span style="color:#d35400; font-weight: bold; font-size: 16px;">${post.dropoff_point}</span>
                    <div style="color:#777; font-size: 13px; margin-top: 6px; line-height: 1.5;">
                        * AI đã xác nhận bạn là chủ nhân. Vui lòng mang theo thẻ sinh viên/CCCD đến địa điểm trên để đối chiếu và nhận lại đồ.
                    </div>
                </div>
            </div>
        `;
        dropoffBox.style.display = 'block';
    } else {
        // Giấu nhẹm đi đối với tất cả những người khác
        dropoffBox.style.display = 'none';
    }
    // 5. Mở Modal lên
    document.getElementById('postDetailModal').style.display = 'flex';
    // 5.1 Ẩn khung bình luận cũ đi (để người dùng tự bấm mở nếu muốn)
    const commentSection = document.getElementById('commentSection');
    if (commentSection) commentSection.style.display = 'none';
    
    // 5.2 Reset lại chữ trên nút đếm bình luận
    const label = document.getElementById('commentCountLabel');
    if (label) label.textContent = 'Bình luận (0)';
    
    // 5.3 Xóa sạch danh sách bình luận cũ hiển thị trên màn hình
    const list = document.getElementById('commentList');
    if (list) list.innerHTML = '';

    // 5.4 Chủ động gọi API tải luôn bình luận của đúng bài này để đắp số lượng thật lên nút
    loadComments(postId);
    // 6. XỬ LÝ BẢN ĐỒ CHI TIẾT
    setTimeout(() => {
        const lat = parseFloat(post.latitude);
        const lng = parseFloat(post.longitude);
        const mapContainer = document.getElementById('detailMapContainer');

        // Kiểm tra xem bài đăng này lúc đăng người ta có lưu tọa độ không
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            mapContainer.style.display = 'block'; // Hiện khung bản đồ

            if (!detailMap) {
                // Khởi tạo bản đồ lần đầu tiên
                detailMap = L.map('detailMap').setView([lat, lng], 16);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap'
                }).addTo(detailMap);
                
                // Cắm cờ
                detailMarker = L.marker([lat, lng]).addTo(detailMap);
            } else {
                // Các lần bấm sau chỉ cần dời cây cờ và đổi góc nhìn
                detailMap.setView([lat, lng], 16);
                detailMarker.setLatLng([lat, lng]);
            }
            
            // Fix lỗi bản đồ bị xám mờ khi nằm trong Modal ẩn
            detailMap.invalidateSize(); 
        } else {
            // Nếu bài viết cũ không có tọa độ -> Ẩn bản đồ đi cho đỡ trống
            mapContainer.style.display = 'none';
        }
    }, 300); // Đợi 300ms cho Modal mở hẳn ra rồi mới load map
}

// ── Mở modal sửa ─────────────────────────────────────────────────
function openEditModal(postId) {
    const item = postsMap[postId];
    if (!item) { alert('Không tìm thấy bài đăng!'); return; }

    document.getElementById('editPostId').value      = postId;
    document.getElementById('editItemName').value    = item.item_name;
    document.getElementById('editCategory').value    = item.category || '';
    document.getElementById('editLocation').value    = item.location;
    document.getElementById('editDate').value        = item.lost_date;
    document.getElementById('editDescription').value = item.description || '';
    document.getElementById('editDropoff').value     = item.dropoff_point || '';
    const dropoffGroup = document.getElementById('editDropoffGroup');
    if (dropoffGroup) dropoffGroup.style.display = item.type === 'found' ? 'block' : 'none';
    document.getElementById('editModal').style.display = 'flex';
}

// ── Gửi yêu cầu sửa lên server ───────────────────────────────────
async function submitEdit() {
    const postId = document.getElementById('editPostId').value;
    const payload = {
        user_id    : currentUser.id,
        item_name  : document.getElementById('editItemName').value,
        category   : document.getElementById('editCategory').value,
        location   : document.getElementById('editLocation').value,
        lost_date  : document.getElementById('editDate').value,
        description: document.getElementById('editDescription').value,
        dropoff_point: document.getElementById('editDropoff').value
    };

    const res = await fetch(`/api/posts/${postId}`, {
        method : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(payload)
    });

    if (res.ok) {
        closeModal('editModal');
        loadPosts();
        alert('✅ Đã cập nhật bài đăng!');
    } else {
        alert('❌ Cập nhật thất bại!');
    }
}

// ── Xóa bài đăng ─────────────────────────────────────────────────
async function deletePost(postId) {
    if (!confirm('Bạn có chắc muốn XÓA bài đăng này không?')) return;

    const res = await fetch(`/api/posts/${postId}?user_id=${currentUser.id}`, {
        method: 'DELETE'
    });

    if (res.ok) {
        loadPosts();
        alert('🗑️ Đã xóa bài đăng!');
    } else {
        alert('❌ Xóa thất bại!');
    }
}

// ── Lọc theo tab ─────────────────────────────────────────────────
let currentTabType   = '';
let currentTabStatus = 'active';

function filterType(type) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    if (type === 'resolved') {
        currentTabType   = '';
        currentTabStatus = 'resolved';
    }
    else if (type === 'matching') {
            currentTabType   = '';
            currentTabStatus = 'matching';
    }
    else {
        currentTabType   = type === 'all' ? '' : type;
        currentTabStatus = 'active';
    }
    loadPosts(currentTabType, '', '', currentTabStatus);
}

// ── Tìm kiếm ─────────────────────────────────────────────────────
function filterItems() {
    const keyword = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const allItems = Object.values(postsMap);

    if (!keyword || allItems.length === 0) {
        loadPosts();
        return;
    }

    const filtered = allItems.filter(item =>
        (item.item_name  || '').toLowerCase().includes(keyword) ||
        (item.location   || '').toLowerCase().includes(keyword) ||
        (item.category   || '').toLowerCase().includes(keyword)
    );

    if (filtered.length === 0) {
        document.getElementById('itemsGrid').innerHTML =
            '<p style="text-align:center;color:#999;">Không tìm thấy kết quả nào.</p>';
    } else {
        renderItems(filtered);
    }
}

// ── Đánh dấu đã giải quyết ───────────────────────────────────────
async function resolvePost(postId) {
    if (!confirm("Đánh dấu bài này là ĐÃ GIẢI QUYẾT?")) return;
    await fetch(`/api/posts/${postId}/resolve`, { method: 'PUT' });
    loadPosts(currentTabType, '', '', currentTabStatus);
}

async function unresolvePost(postId) {
    if (!confirm("Đặt lại bài này thành CHƯA GIẢI QUYẾT?")) return;
    await fetch(`/api/posts/${postId}/unresolve?user_id=${currentUser.id}`, { method: 'PUT' });
    loadPosts(currentTabType, '', '', currentTabStatus);
}

// Ghép đôi thủ công dùng AI suggest
async function manualMatchPost(postId) {
    const myPost = postsMap[postId];
    if (!myPost) return;

    const oppositeType = myPost.type === 'lost' ? 'found' : 'lost';
    const params = new URLSearchParams({
        opposite_type: oppositeType,
        category     : myPost.category  || '',
        location     : myPost.location  || '',
        date         : myPost.lost_date || '',
        item_name    : myPost.item_name || ''
    });

    try {
        const res  = await fetch(`/api/suggest?${params}`);
        const list = await res.json();

        if (!list || list.length === 0) {
            alert('🔍 AI không tìm thấy bài đăng nào tương đồng.');
            return;
        }

        const best     = list[0];
        const scoreBar = Math.min(100, (best.score || 1) * 20);

        const confirmed = confirm(
            `🤖 AI tìm thấy bài phù hợp nhất:\n\n` +
            `📦 ${best.item_name}\n` +
            `📍 ${best.location}\n` +
            `📅 ${best.lost_date}\n` +
            `👤 ${best.username}\n` +
            `🎯 Độ tương đồng: ${scoreBar}%\n\n` +
            `Xác nhận ghép đôi?`
        );
        if (!confirmed) return;

        const matchRes = await fetch(`/api/posts/${postId}/match`, {
            method : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({ target_post_id: best.id, user_id: currentUser.id })
        });

        if (matchRes.ok) {
            alert('✅ Ghép đôi thành công! Cả 2 bài đã chuyển sang tab ⏳ Đang ghép.');
            loadPosts(currentTabType, '', '', currentTabStatus);
        } else {
            const d = await matchRes.json();
            alert('❌ ' + (d.message || 'Ghép đôi thất bại!'));
        }
    } catch(e) {
        alert('Lỗi kết nối!');
    }
}

// Huỷ ghép đôi
async function unmatchPost(postId) {
    if (!confirm("Huỷ ghép và đưa bài về trạng thái ban đầu?")) return;
    const res = await fetch(`/api/posts/${postId}/unmatch?user_id=${currentUser.id}`, { method: 'PUT' });
    if (res.ok) {
        loadPosts(currentTabType, '', '', currentTabStatus);
    } else {
        alert('❌ Huỷ ghép thất bại!');
    }
}

// ── Helper: format thời gian ──────────────────────────────────────
function formatTime(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60)    return 'Vừa xong';
    if (diff < 3600)  return `${Math.floor(diff/60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff/3600)} giờ trước`;
    return `${Math.floor(diff/86400)} ngày trước`;
}

// Hàm hiển thị thông báo lỗi với animation
function showErrorMessage(formId, message) {
    const form = document.getElementById(formId);
    let errorDiv = form.querySelector('.error-message');
    
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        form.appendChild(errorDiv);
    }
    
    errorDiv.textContent = '✗ ' + message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 4000);
}

// Hàm hiển thị thông báo thành công với animation
function showSuccessMessage(formId, message) {
    const form = document.getElementById(formId);
    let successDiv = form.querySelector('.success-message');
    
    if (!successDiv) {
        successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        form.appendChild(successDiv);
    }
    
    successDiv.textContent = message;
    successDiv.style.display = 'block';
}

// Kiểm tra độ mạnh mật khẩu
function checkPasswordStrength(password) {
    const registerForm = document.getElementById('registerForm');
    let strengthBar = registerForm.querySelector('.password-strength-bar');
    
    if (!strengthBar) {
        const strengthDiv = document.createElement('div');
        strengthDiv.className = 'password-strength';
        const bar = document.createElement('div');
        bar.className = 'password-strength-bar';
        strengthDiv.appendChild(bar);
        
        const passInput = document.getElementById('regPass');
        passInput.parentElement.appendChild(strengthDiv);
        strengthBar = bar;
    }

    strengthBar.className = 'password-strength-bar';
    
    if (password.length < 6) {
        strengthBar.style.width = '33%';
        strengthBar.style.background = '#FF6B6B';
    } else if (password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        strengthBar.classList.add('medium');
    } else {
        strengthBar.classList.add('strong');
    }
}
document.getElementById('locationFilter').addEventListener('keyup', filterItems);
document.getElementById('startDate').addEventListener('change', filterItems);
document.getElementById('endDate').addEventListener('change', filterItems);

// --- HÀM LỌC SẢN PHẨM TRỰC TIẾP (FRONTEND) ---
function filterItems() {
    // 1. Lấy giá trị người dùng nhập vào
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const categoryDropdown = document.getElementById('filterCategory');
    const categoryText = categoryDropdown.value !== 'all' ? categoryDropdown.options[categoryDropdown.selectedIndex].text.toLowerCase() : '';
    const locationText = document.getElementById('locationFilter').value.toLowerCase();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // 2. Lấy tất cả các thẻ bài viết đang có trên trang
    const cards = document.querySelectorAll('#itemsGrid .card');

    cards.forEach(card => {
        // Lấy dữ liệu nằm trong từng thẻ bài viết
        const title = card.querySelector('.card-title').innerText.toLowerCase();
        const infos = card.querySelectorAll('.card-info');
        
        const itemCategory = infos[0] ? infos[0].innerText.toLowerCase() : ''; // Thường là thẻ info đầu tiên
        const itemLocation = infos[1] ? infos[1].innerText.toLowerCase() : ''; // Thường là thẻ info thứ hai
        const itemDate = infos[2] ? infos[2].innerText : ''; // Thường là thẻ info thứ ba (Ngày)

        let isMatch = true;

        // Kiểm tra Tên
        if (searchText && !title.includes(searchText)) isMatch = false;

        // Kiểm tra Danh mục
        if (categoryText && !itemCategory.includes(categoryText)) isMatch = false;

        // Kiểm tra Khu vực
        if (locationText && !itemLocation.includes(locationText)) isMatch = false;

        // Kiểm tra Ngày (Nếu người dùng có chọn ngày)
        if (startDate && itemDate < startDate) isMatch = false;
        if (endDate && itemDate > endDate) isMatch = false;

        // Ẩn/Hiện thẻ dựa trên kết quả
        card.style.display = isMatch ? 'flex' : 'none';
    });
}

// --- HÀM XÓA BỘ LỌC ---
function clearFilters() {
    // Reset toàn bộ input về rỗng
    document.getElementById('searchInput').value = '';
    document.getElementById('filterCategory').value = 'all';
    document.getElementById('locationFilter').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    
    // Chạy lại hàm lọc để hiển thị tất cả các thẻ
    filterItems();
}
let map;
let marker;

// Khởi tạo bản đồ Đăng tin (Có nút Tìm kiếm vị trí BẤT KỲ ĐÂU)
function initMap() {
    // Tọa độ lúc vừa mở Modal (Mặc định Đà Nẵng, nhưng lát tìm nó sẽ bay đi chỗ khác)
    const defaultCoords = [16.0544, 108.2022]; 

    map = L.map('map').setView(defaultCoords, 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    marker = L.marker(defaultCoords, {draggable: true}).addTo(map);

    // Kéo thả cây cờ
    marker.on('dragend', function (e) {
        updateLocationFields(marker.getLatLng()); 
    });

    // Click vào bản đồ
    map.on('click', function(e) {
        marker.setLatLng(e.latlng);
        updateLocationFields(e.latlng);
    });

    // --- XỬ LÝ KHI BẤM NÚT "TÌM VỊ TRÍ" ---
    const btnSearch = document.getElementById('btnSearchMap');
    const locationInput = document.getElementById('itemLocation');
    
    btnSearch.addEventListener('click', function() {
        const address = locationInput.value;
        if (!address) {
            alert("Vui lòng nhập địa chỉ để tìm kiếm!");
            return;
        }

        // Đổi chữ nút thành Đang tìm...
        const originalText = btnSearch.innerHTML;
        btnSearch.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        // Gọi API tìm địa chỉ BẤT KỲ ĐÂU ở Việt Nam
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=vn`)
            .then(res => res.json())
            .then(data => {
                btnSearch.innerHTML = originalText; // Trả lại nút cũ

                if (data && data.length > 0) {
                    // Lấy tọa độ tìm được
                    const lat = data[0].lat;
                    const lng = data[0].lon;
                    const latlng = [lat, lng];

                    // Vút! Bản đồ bay đến vị trí mới và cắm cờ
                    map.setView(latlng, 16);
                    marker.setLatLng(latlng);

                    // Lưu tọa độ ngầm để gửi cho Server
                    updateLocationFields({lat: lat, lng: lng});
                } else {
                    // Cảnh báo nếu gõ chi tiết quá nó tìm không ra
                    alert("Không tìm thấy! Vui lòng thử gõ ngắn gọn lại (VD: Tên đường + Tỉnh/Thành phố).");
                }
            })
            .catch(err => {
                btnSearch.innerHTML = originalText;
                console.error("Lỗi:", err);
            });
    });
}

// Hàm cập nhật tọa độ 
function updateLocationFields(coords) {
    document.getElementById('latitude').value = coords.lat;
    document.getElementById('longitude').value = coords.lng;
}


let isNewsLoaded = false; 
// Hàm này được gọi tự động khi Google đăng nhập thành công
// (Tên hàm phải trùng với data-callback bên HTML)
function handleGoogleLogin(response) {
    // 1. Giải mã token để lấy thông tin
    const responsePayload = decodeJwtResponse(response.credential);

    console.log("--- Google Login Success ---");
    console.log("Tên: " + responsePayload.name);
    console.log("Email: " + responsePayload.email);

    // 2. Gửi thông tin về Python Flask (Backend)
    // Lưu ý: Đảm bảo bạn đang dùng đúng tên hàm sendToBackend ở bên dưới code của bạn
    sendSocialDataToServer('google', responsePayload.email, responsePayload.name);
}

// Giữ nguyên hàm giải mã này
function decodeJwtResponse(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}


/* =========================================
   PHẦN 2: XỬ LÝ FACEBOOK
   ========================================= */

// Khởi tạo SDK Facebook
window.fbAsyncInit = function() {
    FB.init({
        appId      : '1321988713316028', // ID App của bạn
        cookie     : true,
        xfbml      : true,
        version    : 'v18.0'
    });
};
// Hàm này được gọi khi bấm nút Facebook (f)
function loginFacebook() {
    FB.login(function(response) {
        if (response.status === 'connected') {
            FB.api('/me', {fields: 'name, email'}, function(userData) {
                console.log('FB User: ' + userData.name);
                
                // Gửi dữ liệu cho hàm xử lý chung
                sendSocialDataToServer('facebook', userData.email, userData.name);
            });
        }
    }, {scope: 'public_profile,email'});
}


/* =========================================
   PHẦN 3: GỬI VỀ BACKEND (PYTHON FLASK)
   ========================================= */

function sendSocialDataToServer(provider, email, name) {
    // Gọi API của Python Flask
    fetch('/api/social-login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            provider: provider,
            email: email,
            name: name
        })
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            // 1. QUAN TRỌNG NHẤT: Lưu người dùng vào hệ thống
            currentUser = data.user; 
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // 2. Thông báo và Đóng Modal
            // alert("Đăng nhập bằng " + provider + " thành công!");
            closeModal('authModal');
            
            // 3. Cập nhật giao diện (Biến nút Đăng nhập thành Xin chào...)
            if (typeof updateUserArea === "function") {
                updateUserArea(); 
            } else {
                window.location.reload(); // Nếu không có hàm updateUserArea thì load lại trang
            }
        } else {
            alert("Lỗi: " + data.message);
        }
    })
    .catch(error => {
        console.error('Lỗi khi gửi lên server:', error);
        alert("Không thể kết nối với máy chủ!");
    });
}

// --- HÀM TẢI TIN TỨC (GIAO DIỆN MỚI CÓ ẢNH) ---
function loadNews() {
    // Biến flag để tránh tải lại nhiều lần (nếu bạn có logic đó)
    if (window.isNewsLoaded) return; 

    const container = document.getElementById("news-section");
    if (!container) return; // Nếu không tìm thấy container thì thoát

    // Gọi API lấy tin tức từ Backend Python
    fetch("/api/news")
        .then(res => {
            if (!res.ok) throw new Error("Không thể kết nối API tin tức");
            return res.json();
        })
        .then(data => {
            // Nếu API trả về mảng rỗng
            if (!data || data.length === 0) {
                container.innerHTML = `
                    <div style='text-align:center; grid-column:1/-1; color:#7f8c8d; padding:40px;'>
                        <i class="fa-regular fa-face-frown" style="font-size:40px; margin-bottom:10px;">
                        </i><br>Hiện tại không có tin tức mới nào.
                    </div>`;
                return;
            }

            let html = "";
            
            // Lặp qua từng bài tin và tạo HTML
            data.forEach(n => {
                // 1. Tự động xác định hình ảnh và nguồn dựa trên tiêu đề
                const newsInfo = getNewsMetaData(n.title, n.url);
                
                // 2. Tạo thời gian đăng tải giả lập (để đẹp giao diện)
                const timeAgo = Math.floor(Math.random() * 5) + 1; // 1-5 giờ trước

                    html += `
                        <div class="news-card">
                            <div class="news-card-img">
                                <img src="${newsInfo.imageUrl}" alt="${n.title}" loading="lazy">
                                
                            </div>
                            
                            <div class="news-card-body">
                                <a href="${n.url}" target="_blank" class="news-card-title">
                                    ${n.title}
                                </a>
                                <p class="news-card-description">
                                    ${n.description}
                                </p>
                                <a href="${n.url}" target="_blank" class="btn-read-more">
                                    Đọc chi tiết <i class="fa-solid fa-arrow-right"></i>
                                </a>
                            </div>
                        </div>
                    `;
                });

            // Bơm HTML vào container
            container.innerHTML = html;
            window.isNewsLoaded = true; // Đánh dấu đã tải xong
        })
        .catch(error => {
            // Hiển thị thông báo lỗi nếu fetch thất bại
            container.innerHTML = `
                <div style='color: #e74c3c; text-align: center; grid-column: 1 / -1; padding: 40px;'>
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:40px; margin-bottom:10px;"></i>
                    <br>Đã xảy ra lỗi khi tải dữ liệu tin tức! Vui lòng thử lại sau.
                </div>`;
            console.error('Lỗi Fetch Tin tức:', error);
        });
}

/**
 * Hàm Helper: Tự động gán ảnh minh họa và tên nguồn dựa trên tiêu đề tin
 * (Dùng ảnh thực tế từ Unsplash để đảm bảo đẹp và hợp lệ)
 */
function getNewsMetaData(title, url) {
    const lowerTitle = title.toLowerCase();
    
    // Bộ sưu tập ảnh chất lượng cao (Source: Unsplash)
    const images = {
        tech: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&q=80',
        space: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&q=80',
        news: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&q=80',
        world: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=500&q=80',
        ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&q=80'
    };

    let data = {
        imageUrl: images.news, // Mặc định là ảnh tin tức chung
        source: 'Tin tức'
    };

    // Tự động chọn ảnh theo từ khóa trong tiêu đề
    if (lowerTitle.includes('nasa') || lowerTitle.includes('space') || lowerTitle.includes('vũ trụ')) {
        data.imageUrl = images.space;
    } else if (lowerTitle.includes('apple') || lowerTitle.includes('ai') || lowerTitle.includes('công nghệ') || lowerTitle.includes('google')) {
        data.imageUrl = images.ai;
    } else if (lowerTitle.includes('chiến tranh') || lowerTitle.includes('quân sự') || lowerTitle.includes('israel')) {
        data.imageUrl = images.world;
    } else if (lowerTitle.includes('amazon') || lowerTitle.includes('giảm giá')) {
        data.imageUrl = images.tech;
    }

    // Xác định tên nguồn
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('pcmag')) data.source = 'PCMag';
    else if (lowerUrl.includes('foxnews')) data.source = 'Fox News';
    else if (lowerUrl.includes('reuters')) data.source = 'Reuters';
    else if (lowerUrl.includes('vnexpress')) data.source = 'VnExpress';
    else data.source = 'Tổng hợp';

    return data;
}
// Tự động tải tin tức khi trang web load xong
document.addEventListener("DOMContentLoaded", function() {
    loadNews();
});

// Thêm hiệu ứng cuộn mượt cho toàn trang web
document.documentElement.style.scrollBehavior = "smooth";

// Tự động tải tin tức khi vừa vào trang
document.addEventListener("DOMContentLoaded", function() {
    loadNews();
});

// Fake AI Scan
function fakeAIScan() {
    document.getElementById('aiMessage').style.display = 'block';
    document.getElementById('itemName').value = "Ví da nam";
}


// ══ DETAIL MODAL FUNCTIONS ══════════════════════════════════════
let currentDetailPostId = null;

function openDetailModal(postId) {
    currentDetailPostId = postId;
    showPostDetail(postId);
}

async function contactAuthor() {
    const box = document.getElementById('detailContactBox');
    if (box && box.style.display !== 'none') { box.style.display = 'none'; return; }
    if (!currentUser) { alert('Bạn cần đăng nhập để xem thông tin liên hệ!'); return; }
    const post = allPostsData.find(p => p.id === currentDetailPostId);
    if (!post) return;
    try {
        const res  = await fetch(`/api/users/contact/${post.user_id}`);
        const data = await res.json();
        const phoneEl = document.getElementById('contactPhone');
        const emailEl = document.getElementById('contactEmail');
        if (phoneEl) phoneEl.querySelector('span').textContent = data.phone || 'Chưa cập nhật';
        if (emailEl) emailEl.querySelector('span').textContent = data.email || 'Chưa cập nhật';
        if (box) box.style.display = 'block';
    } catch(e) { alert('Không lấy được thông tin liên hệ!'); }
}

function sharePost() {
    const post = allPostsData.find(p => p.id === currentDetailPostId);
    if (!post) return;
    const text = `[Lost&Found] ${post.type === 'lost' ? 'Mất đồ' : 'Nhặt được'}: ${post.item_name} tại ${post.location}`;
    if (navigator.share) {
        navigator.share({ title: text, text: text, url: window.location.href });
    } else {
        navigator.clipboard.writeText(`${text}\n${window.location.href}`)
            .then(() => alert('✅ Đã copy link vào clipboard!'))
            .catch(() => alert('Link: ' + window.location.href));
    }
}

function toggleComments() {
    const section = document.getElementById('commentSection');
    if (!section) return;
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
    if (section.style.display === 'block') {
        loadComments(currentDetailPostId);
    }
}

async function loadComments(postId) {
    try {
        const res      = await fetch(`/api/posts/${postId}/comments`);
        const comments = await res.json();
        const label    = document.getElementById('commentCountLabel');
        if (label) label.textContent = `Bình luận (${comments.length})`;
        renderComments(comments);
    } catch(e) {
        const list = document.getElementById('commentList');
        if (list) list.innerHTML = '<p style="color:#aaa;font-size:13px;text-align:center;">Chưa có bình luận nào.</p>';
    }
}

function buildCommentHTML(c, isReply = false) {
    const avatarSize = isReply ? '24px' : '30px';
    const fontSize   = isReply ? '12px' : '13px';
    const marginLeft = isReply ? 'margin-left:39px;' : '';

    const repliesHTML = (c.replies && c.replies.length > 0)
        ? c.replies.map(r => buildCommentHTML(r, true)).join('')
        : '';

    // Kiểm tra xem người đang đăng nhập có phải là chủ của bình luận này không
    const isMyComment = currentUser && currentUser.id === c.user_id;

    return `
        <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:8px;${marginLeft}">
            <div style="width:${avatarSize};height:${avatarSize};border-radius:50%;background:linear-gradient(135deg,#4A90E2,#6366f1);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;flex-shrink:0;">
                <i class="fa-solid fa-user"></i>
            </div>
            <div style="flex:1;">
                <div style="background:#f1f5f9;border-radius:12px;padding:8px 12px;display:inline-block;max-width:100%;">
                    <span style="font-size:12px;font-weight:700;color:#1a1a2e;display:block;margin-bottom:2px;">${c.username}</span>
                    <p id="comment_text_${c.id}" style="font-size:${fontSize};color:#444;margin:0;">${c.content}</p>
                </div>
                <div style="display:flex;gap:12px;margin-top:3px;padding-left:4px;">
                    <span style="font-size:10.5px;color:#94a3b8;">${formatTime(c.created_at)}</span>
                    ${currentUser ? `<button onclick="showReplyInput(${c.id}, '${c.username}')"
                        style="font-size:11px;font-weight:700;color:#64748b;background:none;border:none;cursor:pointer;padding:0;">
                        Trả lời
                    </button>` : ''}
                    
                    ${isMyComment ? `
                    <button onclick="editComment(${c.id})"
                        style="font-size:11px;font-weight:700;color:#4A90E2;background:none;border:none;cursor:pointer;padding:0;">
                        Sửa
                    </button>
                    <button onclick="deleteComment(${c.id})"
                        style="font-size:11px;font-weight:700;color:#e74c3c;background:none;border:none;cursor:pointer;padding:0;">
                        Xóa
                    </button>
                    ` : ''}
                </div>
                <div id="replyInput_${c.id}" style="display:none;margin-top:6px;margin-left:4px;">
                    <div style="display:flex;gap:7px;align-items:center;">
                        <div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#4A90E2,#6366f1);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;flex-shrink:0;">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <div style="flex:1;display:flex;align-items:center;background:#f1f5f9;border-radius:20px;padding:5px 8px 5px 12px;gap:6px;">
                            <input type="text" id="replyInputText_${c.id}"
                                placeholder="Trả lời ${c.username}..."
                                style="flex:1;border:none;background:transparent;outline:none;font-size:12px;color:#333;"
                                onkeydown="if(event.key==='Enter') submitReply(${c.id})">
                            <button onclick="submitReply(${c.id})"
                                style="background:#4A90E2;color:white;border:none;border-radius:50%;width:26px;height:26px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;">
                                <i class="fa-solid fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
                ${repliesHTML}
            </div>
        </div>`;
}
// --- Hàm Sửa bình luận ---
async function editComment(commentId) {
    const pElem = document.getElementById(`comment_text_${commentId}`);
    const currentText = pElem.innerText;
    
    // Mở hộp thoại nhập liệu mặc định của trình duyệt để sửa cho nhanh & gọn
    const newText = prompt("Chỉnh sửa bình luận của bạn:", currentText);
    
    if (newText !== null && newText.trim() !== "" && newText !== currentText) {
        try {
            const res = await fetch(`/api/comments/${commentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.id, content: newText.trim() })
            });
            if (res.ok) {
                loadComments(currentDetailPostId); // Tải lại danh sách bình luận ngay lập tức
            } else {
                alert("Lỗi khi sửa bình luận!");
            }
        } catch(e) { console.error(e); alert('Không kết nối được server!'); }
    }
}

// --- Hàm Xóa bình luận ---
async function deleteComment(commentId) {
    if (!confirm("Bạn có chắc chắn muốn xóa bình luận này không?")) return;
    
    try {
        const res = await fetch(`/api/comments/${commentId}?user_id=${currentUser.id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            loadComments(currentDetailPostId); // Tải lại danh sách bình luận ngay lập tức
        } else {
            alert("Lỗi khi xóa bình luận!");
        }
    } catch(e) { console.error(e); alert('Không kết nối được server!'); }
}
function showReplyInput(commentId, username) {
    // Ẩn tất cả reply input khác
    document.querySelectorAll('[id^="replyInput_"]').forEach(el => {
        el.style.display = 'none';
    });
    const box = document.getElementById(`replyInput_${commentId}`);
    if (box) {
        box.style.display = 'block';
        const input = document.getElementById(`replyInputText_${commentId}`);
        if (input) input.focus();
    }
}

async function submitReply(parentCommentId) {
    if (!currentUser) { alert('Bạn cần đăng nhập để trả lời!'); return; }
    const input = document.getElementById(`replyInputText_${parentCommentId}`);
    const text  = (input ? input.value : '').trim();
    if (!text) return;
    try {
        const res = await fetch(`/api/posts/${currentDetailPostId}/comments`, {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({
                user_id  : currentUser.id,
                username : currentUser.username,
                content  : text,
                parent_id: parentCommentId
            })
        });
        if (res.ok) {
            if (input) input.value = '';
            loadComments(currentDetailPostId);
        }
    } catch(e) { alert('Lỗi gửi trả lời!'); }
}

function renderComments(comments) {
    const list = document.getElementById('commentList');
    if (!list) return;
    if (!comments || comments.length === 0) {
        list.innerHTML = '<p style="color:#aaa;font-size:13px;text-align:center;padding:12px 0;">Chưa có bình luận nào. Hãy là người đầu tiên!</p>';
        return;
    }
    list.innerHTML = comments.map(c => buildCommentHTML(c)).join('');
}

async function submitComment() {
    if (!currentUser) { alert('Bạn cần đăng nhập để bình luận!'); return; }
    const input = document.getElementById('commentInput');
    const text  = (input ? input.value : '').trim();
    if (!text) return;
    try {
        const res = await fetch(`/api/posts/${currentDetailPostId}/comments`, {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({ user_id: currentUser.id, username: currentUser.username, content: text })
        });
        if (res.ok) { if (input) input.value = ''; loadComments(currentDetailPostId); }
        else { const d = await res.json(); alert(d.message || 'Lỗi gửi bình luận!'); }
    } catch(e) { alert('Lỗi gửi bình luận!'); }
}

async function fetchAiSuggestions(myPost, postType) {
    const oppositeType = postType === 'lost' ? 'found' : 'lost';
    const params = new URLSearchParams({
        opposite_type: oppositeType,
        category     : myPost.category  || '',
        location     : myPost.location  || '',
        date         : myPost.lost_date || '',
        item_name    : myPost.item_name || ''
    });
    try {
        const res  = await fetch(`/api/suggest?${params}`);
        const list = await res.json();
        if (!list || list.length === 0) {
            alert('✅ Đăng tin thành công! Chưa tìm thấy đồ tương đồng.');
            return;
        }
        const matches = list.map(item => ({
            item_name   : item.item_name,
            score       : Math.min(100, (item.score || 1) * 20),
            distance_km : '—',
            contact_user: item.username || 'Ẩn danh'
        }));
        showAiMatchModal(matches, postType);
    } catch(err) { alert('✅ Đăng tin thành công!'); }
}

// Utility
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// ===== Typing Animation cho Hero Text =====
const texts = [
  "Bạn đang tìm kiếm gì hôm nay?",
  "Mất ví? Mất điện thoại?",
  "Lost&Found giúp bạn tìm lại!"
];

let textIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typingSpeed = 80;
const deletingSpeed = 40;
const delayBetweenTexts = 1500;

const typingElement = document.getElementById("typing-text");

function typeEffect() {
  const currentText = texts[textIndex];

  if (!isDeleting) {
    typingElement.textContent = currentText.substring(0, charIndex + 1);
    charIndex++;

    if (charIndex === currentText.length) {
      setTimeout(() => isDeleting = true, delayBetweenTexts);
    }
  } else {
    typingElement.textContent = currentText.substring(0, charIndex - 1);
    charIndex--;

    if (charIndex === 0) {
      isDeleting = false;
      textIndex = (textIndex + 1) % texts.length;
    }
  }

  setTimeout(typeEffect, isDeleting ? deletingSpeed : typingSpeed);
}

// Chỉ chạy typeEffect nếu element tồn tại
if (document.getElementById("typing-text")) {
    typeEffect();
}

// --- KHỞI CHẠY ---
initAuth();
updateUserArea();
loadPosts();

// Lấy user từ localStorage
const user = JSON.parse(localStorage.getItem("currentUser"));

// Nếu user tồn tại và role là admin
if (user && user.role === "admin") {
    const adminBtn = document.getElementById("adminButton");
    if (adminBtn) {
        adminBtn.innerHTML =
        `<button onclick="goAdmin()" class="btn-admin">
            Admin Dashboard
        </button>`;
    }
}
function updateUserArea() {
    const socialUser = localStorage.getItem('user');
    const localUser = localStorage.getItem('currentUser');
    
    let dataToUse = null;
    if (socialUser) {
        dataToUse = JSON.parse(socialUser);
        localStorage.setItem('currentUser', socialUser);
    } else if (localUser) {
        dataToUse = JSON.parse(localUser);
    }

    const userArea = document.getElementById('userArea');
    if (!userArea) return;

    if (dataToUse) {
        // Giao diện Avatar + Mũi tên chuẩn
        userArea.innerHTML = `
            <div class="user-dropdown-container">
                <div class="user-trigger" onclick="toggleDropdown(event)">
                    <div class="user-avatar-circle">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <i class="fa-solid fa-chevron-down caret-icon"></i>
                </div>
                <div id="userDropdownMenu" class="dropdown-menu-box">
                    <div class="menu-header" style="padding: 10px 15px;">
                        <strong>${dataToUse.username}</strong>
                    </div>
                    <hr style="margin: 0; border: 0; border-top: 1px solid #eee;">
                    
                    <button class="menu-item" onclick="openUpdateProfileModal()" style="width: 100%; text-align: left; background: none; border: none; padding: 12px 15px; cursor: pointer; display: flex; gap: 10px; align-items: center; font-family: inherit; font-size: 14px; color: #333; transition: background 0.2s;">
                        <i class="fa-solid fa-user-pen" style="color: #4A90E2; width: 16px; text-align: center;"></i> Cập nhật thông tin
                    </button>

                    <button class="menu-item logout-red" onclick="handleLogout()" style="width: 100%; text-align: left; background: none; border: none; padding: 12px 15px; cursor: pointer; display: flex; gap: 10px; align-items: center; font-family: inherit; font-size: 14px; color: #e74c3c; transition: background 0.2s;">
                        <i class="fa-solid fa-right-from-bracket" style="width: 16px; text-align: center;"></i> Đăng xuất
                    </button>
                </div>
            </div>
        `;
    } else {
        // Giao diện khi chưa đăng nhập
        userArea.innerHTML = `
            <button class="btn-login" onclick="openAuthModal()">
                <i class="fa-regular fa-user"></i> Đăng nhập
            </button>
        `;
    }
}

function toggleDropdown(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById("userDropdownMenu");
    if (menu) menu.classList.toggle("active");
}

window.addEventListener('click', function() {
    const menu = document.getElementById("userDropdownMenu");
    if (menu) menu.classList.remove("active");
});

const oldLogout = handleLogout;
handleLogout = function() {
    if(confirm("Bạn có chắc muốn đăng xuất?")) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('user');
        currentUser = null;
        window.location.reload();
    }
};

// updateUserArea() đã được gọi khi khởi chạy
// Hàm chuyển sang trang admin
function goAdmin(){
    window.location.href = "/admin";
}
// Hàm tải danh sách bài đăng từ API admin
async function loadAdminPosts() {
    const res = await fetch("/api/admin/posts");
    const posts = await res.json();
    const table = document.getElementById("postTable");

    if(!table) return; // Fix lỗi nếu không phải trang admin

    table.innerHTML = "";

    posts.forEach(p => {
        const typeText = p.type === 'lost' ? '<span style="color:red">Mất đồ</span>' : '<span style="color:green">Nhặt được</span>';
        const statusText = p.status === 'active' ? 'Đang hiện' : 'Đã xong';

        table.innerHTML += `
            <tr>
                <td>${p.id}</td>
                <td>${p.username}</td>
                <td>${typeText}</td>
                <td>${p.item_name}</td>
                <td><b>${statusText}</b></td>
                <td>${p.created_at.split(' ')[0]}</td>
                <td>
                    <button class="btn-delete" onclick="adminDeletePost(${p.id})">
                        Xóa tin
                    </button>
                </td>
            </tr>
        `;
    });
}

// Hàm Admin xóa bài viết
async function adminDeletePost(id) {
    if (!confirm("Xóa bài đăng này?")) return;

    const res = await fetch(`/api/admin/posts/${id}`, {
        method: "DELETE"
    });

    const data = await res.json();
    alert(data.message);
    loadAdminPosts();
}
// =========================================================
// DASHBOARD WIDGETS (BIỂU ĐỒ & HOẠT ĐỘNG GẦN ĐÂY)
// =========================================================
async function renderDashboardWidgets() {
    try {
        // Gọi API lấy toàn bộ bài đăng từ Database
        const res = await fetch("/api/admin/posts");
        const posts = await res.json();

        // 1. XỬ LÝ BIỂU ĐỒ (Đếm số bài Lost và Found)
        let lostCount = 0;
        let foundCount = 0;
        posts.forEach(p => {
            if (p.type === 'lost') lostCount++;
            else foundCount++;
        });

        // Vẽ biểu đồ nếu tìm thấy thẻ canvas có id="typeChart"
        const ctx = document.getElementById('typeChart');
        if (ctx) {
            new Chart(ctx, {
                type: 'doughnut', // Biểu đồ hình bánh Donut
                data: {
                    labels: ['Mất đồ', 'Nhặt được'],
                    datasets: [{
                        data: [lostCount, foundCount],
                        backgroundColor: ['#FF6B6B', '#1DD1A1'], // Đỏ cho Mất, Xanh cho Nhặt
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        // 2. XỬ LÝ BẢNG HOẠT ĐỘNG GẦN ĐÂY (Lấy 5 bài mới nhất)
        const recentList = document.getElementById('recentActivityList');
        if (recentList) {
            recentList.innerHTML = '';
            
            // Lấy 5 phần tử đầu tiên (Vì API đã sắp xếp mới nhất lên đầu)
            const top5 = posts.slice(0, 5); 
            
            top5.forEach(p => {
                // Đổi màu tag tùy theo loại bài đăng
                const typeHtml = p.type === 'lost' 
                    ? '<span style="background:#ffeaa7; color:#d35400; padding:3px 8px; border-radius:12px; font-size:12px;">Mất đồ</span>' 
                    : '<span style="background:#e0f7fa; color:#009688; padding:3px 8px; border-radius:12px; font-size:12px;">Nhặt được</span>';
                
                // Cắt lấy phần ngày tháng năm, bỏ qua giờ phút giây cho gọn
                const dateOnly = p.created_at ? p.created_at.split(' ')[0] : 'Không rõ';

                recentList.innerHTML += `
                    <tr style="border-bottom: 1px solid #f5f5f5;">
                        <td style="padding: 12px 10px; font-weight: bold; color: #4A90E2;">${p.username}</td>
                        <td style="padding: 12px 10px;">${p.item_name}</td>
                        <td style="padding: 12px 10px;">${typeHtml}</td>
                        <td style="padding: 12px 10px; color: #888; font-size: 13px;">${dateOnly}</td>
                    </tr>
                `;
            });
        }

    } catch (error) {
        console.error("Lỗi khi tải Widgets:", error);
    }
}

// Chạy hàm vẽ biểu đồ khi trang web tải xong
document.addEventListener("DOMContentLoaded", function() {
    renderDashboardWidgets();
});
// =====================================================================
// CHỨC NĂNG AI AUTO-MATCHING (TỰ ĐỘNG GHÉP ĐÔI > 90%)
// =====================================================================

function checkAndAutoMatch(newPost, allPostsArr) {
    let matchFound = false;
    let matchedPost = null;

    for (let i = 0; i < allPostsArr.length; i++) {
        let oldPost = allPostsArr[i];
        
        // Bỏ qua nếu cùng loại (mất - mất, nhặt - nhặt) hoặc đã giải quyết rồi
        if (oldPost.type === newPost.type || oldPost.status === 'resolved') continue;

        // --- BỘ ĐẾM ĐIỂM AI (MÔ PHỎNG) ---
        let matchScore = 0;
        
        // 1. Cùng danh mục (Ví, Laptop...) -> +40 điểm
        if (oldPost.category && newPost.category && oldPost.category === newPost.category) {
            matchScore += 40;
        }
        
        // 2. Cùng khu vực (Chứa từ khóa của nhau) -> +30 điểm
        // Fix: Xử lý an toàn đề phòng location bị null/undefined
        let oldLoc = (oldPost.location || "").toLowerCase();
        let newLoc = (newPost.location || "").toLowerCase();
        
        if (oldLoc && newLoc && (oldLoc.includes(newLoc) || newLoc.includes(oldLoc))) {
            matchScore += 30;
        }
            
        // 3. Trùng ngày tháng -> +25 điểm
        // Fix: Đổi 'date' thành 'lost_date' cho khớp với payload và DB
        if (oldPost.lost_date === newPost.lost_date) {
            matchScore += 25;
        }

        // Nếu đạt chuẩn >= 90%
        if (matchScore >= 90) {
            matchFound = true;
            matchedPost = oldPost;
            
            // CẬP NHẬT TRẠNG THÁI 2 BÀI THÀNH "ĐÃ GIẢI QUYẾT"
            allPostsArr[i].status = 'resolved';
            newPost.status = 'resolved';
            
            // Gắn ID của nhau để admin dễ quản lý
            allPostsArr[i].matchedWith = newPost.id;
            newPost.matchedWith = oldPost.id;
            
            break; // Tìm thấy 1 người là chốt đơn luôn
        }
    }

    if (matchFound) {
        // Bật Modal thông báo cho user
        showAutoMatchSuccess(newPost, matchedPost);
        return true;
    }
    
    return false;
}
// Hàm hiển thị giao diện BINGO khi ghép đôi thành công
function showAutoMatchSuccess(post1, post2) {
    const modal = document.getElementById('aiMatchModal');
    const textObj = document.getElementById('aiMatchText');
    const listObj = document.getElementById('aiMatchList');

    if (!modal || !textObj || !listObj) return;

    textObj.innerHTML = `<span style="color: #27ae60; font-size: 18px; display:block; margin-bottom:10px;">🎉 <b>BINGO! ĐỘ TRÙNG KHỚP > 90%</b></span>
                         Hệ thống AI đã tự động ghép đôi bài đăng của bạn với một bài có sẵn trên hệ thống. 
                         Trạng thái của cả 2 bài đã được đổi thành <b>⏳ Đang ghép</b>!`;
    
    listObj.innerHTML = `
        <div style="padding: 12px; border: 1px solid #2ecc71; border-radius: 8px; background: #e9f7ef; margin-bottom: 10px; color:#1c1e21;">
            <strong>Bài của bạn:</strong> ${post1.item_name || post1.name} <br>
            <span style="font-size:12px; color:#555;"><i class="fa-solid fa-tag"></i> ${post1.category} | <i class="fa-solid fa-location-dot"></i> ${post1.location}</span>
        </div>
        <div style="text-align: center; color: #e74c3c; font-size: 20px; margin: 10px 0;"><i class="fa-solid fa-link"></i></div>
        <div style="padding: 12px; border: 1px solid #3498db; border-radius: 8px; background: #ebf5fb; color:#1c1e21;">
            <strong>Bài đối tác:</strong> ${post2.item_name || post2.name} <br>
            <span style="font-size:12px; color:#555;"><i class="fa-solid fa-tag"></i> ${post2.category} | <i class="fa-solid fa-location-dot"></i> ${post2.location}</span>
        </div>
        <p style="margin-top:15px; font-size:13px; color:#e67e22; text-align:center;">Vui lòng kiểm tra mục thông báo hoặc thông tin liên hệ để trao đổi!</p>
    `;

    modal.style.display = 'flex';
}
// ==========================================
// HỆ THỐNG THÔNG BÁO (NOTIFICATIONS)
// ==========================================

// Hàm tải thông báo từ server
async function loadNotifications() {
    if (!currentUser) return; // Không có user đăng nhập thì không tải
    
    try {
        const res = await fetch(`/api/notifications?user_id=${currentUser.id}`);
        const notifs = await res.json();
        
        const notifList = document.getElementById('notifList'); // Thay bằng ID thẻ div chứa danh sách thông báo của bạn
        const notifBadge = document.getElementById('notifBadge'); // Thay bằng ID cái chấm đỏ của bạn
        
        if (!notifList) return;
        
        // Đếm số thông báo chưa đọc
        const unreadCount = notifs.filter(n => !n.is_read).length;
        
        // Hiển thị chấm đỏ nếu có thông báo mới
        if (notifBadge) {
            if (unreadCount > 0) {
                notifBadge.style.display = 'block';
                notifBadge.innerText = unreadCount;
            } else {
                notifBadge.style.display = 'none';
            }
        }
        
        // Hiển thị danh sách thông báo
        if (notifs.length === 0) {
            notifList.innerHTML = '<div style="padding:15px; text-align:center; color:#888;">Không có thông báo nào</div>';
            return;
        }
        
        let html = '';
        notifs.forEach(n => {
            // Hiệu ứng nền hơi xanh nếu chưa đọc
            const bgClass = n.is_read ? '' : 'background-color: #f0f8ff;'; 
            
            html += `
                <div onclick="showPostDetail(${n.post_id})" style="padding:12px 15px;border-bottom:1px solid #eee;cursor:pointer;display:flex;gap:10px;align-items:flex-start;${bgClass}">
                    <div style="width:35px;height:35px;border-radius:50%;background:#fff3e0;color:#f39c12;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fa-solid fa-link"></i>
                    </div>
                    <div>
                        <p style="margin:0;font-size:14px;color:#333;">${n.message}</p>
                        <span style="font-size:12px;color:#3498db;">${formatTime(n.created_at)}</span>
                    </div>
                </div>
            `;
        });
        
        notifList.innerHTML = html;
        
    } catch (error) {
        console.error("Lỗi tải thông báo:", error);
    }
}

// Hàm mở hộp thoại thông báo và tắt chấm đỏ
function toggleNotifDropdown() {
    const box = document.getElementById('notifDropdownBox'); // ID hộp thoại xổ xuống của bạn
    if (box) {
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
        
        // Nếu vừa mở ra, gọi API đánh dấu là đã đọc
        if (box.style.display === 'block' && currentUser) {
            fetch('/api/notifications/read', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUser.id })
            }).then(() => {
                const badge = document.getElementById('notifBadge');
                if (badge) badge.style.display = 'none'; // Ẩn ngay chấm đỏ
            });
        }
    }
}

// Tự động tải thông báo sau khi trang web load xong 2 giây (đợi dữ liệu user ổn định)
setTimeout(loadNotifications, 2000);

// Nâng cao: Tự động refresh thông báo mỗi 30 giây (Real-time nhè nhẹ)
setInterval(loadNotifications, 30000);
// Hàm render Biểu đồ và Hoạt động gần đây cho Dashboard

loadAdminPosts();

// Trong hàm render bài viết, thêm nút này vào HTML của post:
// <button onclick="reportPost(${post.id})">Báo cáo</button>

function reportPost(postId) {
    if (!currentUser) {
        alert("Bạn cần đăng nhập để thực hiện tính năng này!");
        return;
    }

    const reason = prompt("Lý do báo cáo (Spam, Ảnh 18+,...):");
    if (!reason) return;

    fetch('/api/report_post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            post_id: postId,
            user_id: currentUser.id,
            reason: reason
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        // Nếu báo cáo xong bị ban luôn thì logout
        if (data.should_logout) {
            logout();
        }
    })
    .catch(err => console.error("Lỗi báo cáo:", err));
}