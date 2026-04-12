from flask import Flask, request, jsonify, render_template, session
from flask_cors import CORS
from news import get_news
from thefuzz import fuzz
import base64, os, uuid
import mysql.connector
import math
import re
 
UPLOAD_FOLDER = 'static/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
 
app = Flask(__name__)
app.secret_key = "lost_found_secret_key_123"
 
@app.route('/')
def home():
    return render_template('index.html')
 
CORS(app)
 
def get_db_connection():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='123456',
        database='lost_found_db'
    )
 
@app.route('/admin')
def admin():
    return render_template('admin.html')
 
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    phone = data.get('phone')
    region = data.get('region')
    if not username or not password:
        return jsonify({'message': 'Vui lòng cung cấp tên đăng nhập và mật khẩu'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE username = %s', (username,))
    existing_user = cursor.fetchone()
    if existing_user:
        return jsonify({'message': 'Username đã tồn tại'}), 400
    sql = "INSERT INTO users (username, email, password, phone, region) VALUES (%s, %s, %s, %s, %s)"
    cursor.execute(sql, (username, email, password, phone, region))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Đăng ký thành công!'}), 201
 
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
 
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
 
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()
 
    cursor.close()
    conn.close()
 
    if user and user['password'] == password:
        return jsonify({
            "message": "Đăng nhập thành công!",
            "user": {"username": user['username'], "id": user['id'], "email":user["email"],
                     "role": user['role']
    }
        }), 200
    else:
        return jsonify({"message": "Sai tên đăng nhập hoặc mật khẩu!"}), 401
 
@app.route("/api/news") 
def api_news():
        return jsonify(get_news())
 
@app.route('/admin.html')
def admin_page():
    return render_template("admin.html")
 
@app.route('/api/users')
def get_all_users():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 💡 Lệnh SQL mới: Lấy tất cả người dùng NGOẠI TRỪ tài khoản tên 'admin'
    cursor.execute("SELECT * FROM users WHERE username != 'admin' ORDER BY id DESC")
    
    users = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return jsonify(users)
# ── API ADMIN: THÊM NGƯỜI DÙNG MỚI ─────────────────────────
@app.route('/api/users', methods=['POST'])
def admin_add_user():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password', '123456')
    role = data.get('role', 'user')
    phone = data.get('phone', '')
    region = data.get('region', '')

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, email, password, phone, region, role) VALUES (%s, %s, %s, %s, %s, %s)", 
            (username, email, password, phone, region, role)
        )
        conn.commit()
        return jsonify({'message': 'Đã thêm người dùng!'}), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ── API ADMIN: SỬA THÔNG TIN NGƯỜI DÙNG ─────────────────────────
@app.route('/api/users/<int:user_id>', methods=['PUT'])
def admin_edit_user(user_id):
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    role = data.get('role')
    phone = data.get('phone', '')
    region = data.get('region', '')
    password = data.get('password')

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Nếu Admin có gõ pass mới -> Update cả pass
        if password and len(password.strip()) > 0:
            cursor.execute(
                "UPDATE users SET username=%s, email=%s, role=%s, phone=%s, region=%s, password=%s WHERE id=%s", 
                (username, email, role, phone, region, password, user_id)
            )
        else:
            # Bỏ trống pass -> Chỉ update các thứ khác, giữ nguyên pass cũ
            cursor.execute(
                "UPDATE users SET username=%s, email=%s, role=%s, phone=%s, region=%s WHERE id=%s", 
                (username, email, role, phone, region, user_id)
            )
        conn.commit()
        return jsonify({'message': 'Đã cập nhật!'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
@app.route('/api/users/<int:id>', methods=['DELETE'])
def delete_user(id):
 
    conn = get_db_connection()
    cursor = conn.cursor()
 
    cursor.execute("DELETE FROM users WHERE id=%s",(id,))
    conn.commit()
 
    cursor.close()
    conn.close()
 
    return jsonify({"message":"Đã xóa user"})
# ── API: NGƯỜI DÙNG CẬP NHẬT THÔNG TIN CÁ NHÂN ─────────────────────
@app.route('/api/users/profile', methods=['PUT'])
def update_user_profile():
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'message': 'Thiếu user_id'}), 400

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    phone = data.get('phone')
    region = data.get('region')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Nếu người dùng có nhập mật khẩu mới thì cập nhật cả mật khẩu
        if password and len(password.strip()) > 0:
            cursor.execute("""
                UPDATE users 
                SET username=%s, email=%s, password=%s, phone=%s, region=%s 
                WHERE id=%s
            """, (username, email, password, phone, region, user_id))
        else:
            # Nếu để trống mật khẩu thì giữ nguyên mật khẩu cũ
            cursor.execute("""
                UPDATE users 
                SET username=%s, email=%s, phone=%s, region=%s 
                WHERE id=%s
            """, (username, email, phone, region, user_id))
        
        conn.commit()

        # Lấy lại thông tin mới để cập nhật cho trình duyệt
        cursor.execute("SELECT id, username, email, role FROM users WHERE id=%s", (user_id,))
        updated_user = cursor.fetchone()

        return jsonify({
            'message': 'Cập nhật thông tin thành công!',
            'user': updated_user
        }), 200
    except Exception as e:
        return jsonify({'message': 'Lỗi cập nhật: Có thể tên đăng nhập đã tồn tại.'}), 500
    finally:
        cursor.close()
        conn.close()

def calculate_distance(lat1, lon1, lat2, lon2):
    if not all([lat1, lon1, lat2, lon2]):
        return 9999 # Trả về số rất lớn nếu 1 trong 2 bài thiếu tọa độ
    try:
        R = 6371 # Bán kính Trái Đất (km)
        dlat = math.radians(float(lat2) - float(lat1))
        dlon = math.radians(float(lon2) - float(lon1))
        a = math.sin(dlat/2) * math.sin(dlat/2) + math.cos(math.radians(float(lat1))) \
            * math.cos(math.radians(float(lat2))) * math.sin(dlon/2) * math.sin(dlon/2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c # Trả về số Kilomet
    except ValueError:
        return 9999
 
# --- 2. THUẬT TOÁN TÌM BÀI TRÙNG KHỚP (MATCHING ALGORITHM) ---
def find_matches_for_post(post_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
 
    # 1. Lấy bài viết vừa đăng
    cursor.execute("SELECT * FROM posts WHERE id = %s", (post_id,))
    new_post = cursor.fetchone()
    if not new_post: return []
 
    # 2. Xác định mục tiêu: Mất thì tìm Nhặt, Nhặt thì tìm Mất
    target_type = 'found' if new_post['type'] == 'lost' else 'lost'
 
    # 3. Lấy tất cả bài tiềm năng trong Database
    cursor.execute("SELECT * FROM posts WHERE type = %s AND status = 'active'", (target_type,))
    candidates = cursor.fetchall()
 
    matches = []
    for cand in candidates:
        score = 0 # Điểm khởi điểm là 0 (Thang điểm 100)
 
        # TIÊU CHÍ 1: Khớp Danh mục (Tối đa +40 điểm)
        if new_post['category'] == cand['category']:
            score += 40
 
        # TIÊU CHÍ 2: Logic Thời gian (Tối đa +20 điểm)
        try:
            if new_post['type'] == 'lost' and cand['lost_date'] >= new_post['lost_date']:
                score += 20 # Bị mất trước, nhặt được sau -> Hợp lý
            elif new_post['type'] == 'found' and new_post['lost_date'] >= cand['lost_date']:
                score += 20 # Nhặt được sau ngày mất -> Hợp lý
        except Exception: pass
 
        # TIÊU CHÍ 3: Khoảng cách địa lý (Tối đa +20 điểm)
        dist = calculate_distance(new_post['latitude'], new_post['longitude'], cand['latitude'], cand['longitude'])
        if dist <= 3:      score += 20 # Cách nhau dưới 3km -> Tuyệt vời
        elif dist <= 10:   score += 10 # Cách nhau dưới 10km -> Tạm ổn
 
        # TIÊU CHÍ 4: Khớp Từ khóa (Tối đa +20 điểm)
        def get_words(text):
            if not text: return set()
            # Cắt các từ dài hơn 2 ký tự (bỏ qua a, an, the, là, có...)
            return set(re.findall(r'\b\w{3,}\b', str(text).lower()))
 
# TIÊU CHÍ 4: Khớp Từ khóa thông minh bằng AI (Fuzzy Matching - Tối đa +20 điểm)
        # Nối tên và mô tả lại thành một đoạn văn dài để phân tích
        new_text = str(new_post['item_name']) + " " + str(new_post['description'])
        cand_text = str(cand['item_name']) + " " + str(cand['description'])
        
        # Hàm token_set_ratio cực kỳ thông minh: 
        # Bỏ qua hoa thường, bỏ qua thứ tự từ, chịu được lỗi chính tả nhẹ.
        # Trả về điểm từ 0 đến 100 (100 là giống hệt nhau về mặt ý nghĩa)
        similarity_percent = fuzz.token_set_ratio(new_text.lower(), cand_text.lower())
        
        # Quy đổi phần trăm (0-100) ra thang điểm 20 của hệ thống
        # Ví dụ: Giống 90% -> (90 / 100) * 20 = 18 điểm
        score += (similarity_percent / 100) * 20
        # KẾT LUẬN: Nếu trên 60 điểm thì đưa vào danh sách "Có thể là đồ của bạn"
        if score >= 60:
            matches.append({
                'post_id': cand['id'],
                'item_name': cand['item_name'],
                'category': cand['category'],
                'location': cand['location'],
                'score': score,
                'contact_user': cand['username'],
                'distance_km': round(dist, 1) if dist != 9999 else "Không rõ"
            })
 
    cursor.close()
    conn.close()
 
    # Sắp xếp lại: Đứa nào điểm cao nhất đứng đầu
    return sorted(matches, key=lambda x: x['score'], reverse=True)

def verify_user(user_id):
    if not user_id:
        return False
    try:
        conn   = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        result = cursor.fetchone()
        cursor.close(); conn.close()
        return result is not None
    except Exception:
        return False


# ── SỬA ĐỔI: Tích hợp lưu Map (latitude, longitude) và AUTO-MATCHING ───────────────────
@app.route('/api/posts', methods=['POST'])
def create_post():
    data = request.get_json()
    user_id = data.get('user_id')

    # 1. Mở kết nối trước để kiểm tra user
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # --- BƯỚC CHẶN QUAN TRỌNG NHẤT ---
        # Kiểm tra xem tài khoản này có bị ban hoặc báo cáo >= 3 không
        cursor.execute("SELECT is_banned, reports_count FROM users WHERE id = %s", (user_id,))
        user_status = cursor.fetchone()

        if user_status:
            if user_status['is_banned'] == 1 or user_status['reports_count'] >= 3:
                return jsonify({
                    'message': 'Tài khoản của bạn đã bị khóa do bị báo cáo vi phạm quá nhiều lần!'
                }), 403
        # --------------------------------

        # Kiểm tra xác thực (verify_user cũ của bạn)
        if not user_id:
            return jsonify({'message': 'Bạn cần đăng nhập để đăng tin!'}), 401

        # Nhận ảnh base64 và lưu thành file
        image_url = None
        if data.get('image_base64'):
            img_data = data['image_base64'].split(',')[1]  
            filename = f"{uuid.uuid4().hex}.jpg"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            with open(filepath, 'wb') as f:
                f.write(base64.b64decode(img_data))
            image_url = f"/static/uploads/{filename}"

        new_id = None
        best_match = None
        
        # Thêm bài đăng
        # Thêm bài đăng (Sửa câu lệnh SQL và các tham số)
        sql = """
            INSERT INTO posts (user_id, username, type, item_name, category,
                               location, latitude, longitude, lost_date, description, image_url, secret_detail, dropoff_point)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (
            data['user_id'], data['username'], data['type'],
            data['item_name'], data['category'], data['location'],
            data.get('latitude', ''), data.get('longitude', ''),  
            data['lost_date'], data['description'],
            image_url, data.get('secret_detail', ''), 
            data.get('dropoff_point', '') # <--- Thêm tham số này
        ))
        conn.commit()
        new_id = cursor.lastrowid
        
        # Logic Auto-matching
        matched_items = find_matches_for_post(new_id)
        if matched_items and matched_items[0]['score'] >= 90:
            best_match = matched_items[0]
            cursor.execute(
                "UPDATE posts SET status='matching' WHERE id IN (%s, %s)", 
                (new_id, best_match['post_id'])
            )
            conn.commit()
            # Thông báo cho chủ bài bị ghép tự động
            cursor.execute("SELECT user_id, item_name FROM posts WHERE id = %s", (best_match['post_id'],))
            matched_info = cursor.fetchone()
            if matched_info:
                cursor.execute(
                    "INSERT INTO notifications (user_id, message, post_id) VALUES (%s, %s, %s)",
                    (
                        matched_info['user_id'],
                        f"AI đã tự động ghép bài đăng <b>'{matched_info['item_name']}'</b> của bạn. Hãy vào tab ⏳ Đang ghép để kiểm tra và xác nhận.",
                        best_match['post_id']
                    )
                )
                conn.commit()
    except Exception as e:
        print("Lỗi:", str(e))
        conn.rollback()
        return jsonify({'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()

    return jsonify({
        'message': 'Đăng tin thành công!', 
        'id': new_id,
        'matches': [best_match] if best_match else []
    }), 201
# ── Lấy danh sách bài đăng (có lọc) ──────────────────────────────
@app.route('/api/posts', methods=['GET'])
def get_posts():
    type_filter   = request.args.get('type', '')       # lost | found | ''
    category      = request.args.get('category', '')
    location      = request.args.get('location', '')
 
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
 
    # Thêm việc trả về latitude và longitude để hiển thị chi tiết (nếu cần)
    sql = """SELECT id, user_id, username, type, item_name, category,
                    location, latitude, longitude, lost_date, description, image_url,
                    status, created_at, dropoff_point, matched_with
             FROM posts WHERE status = %s"""
    status_filter = request.args.get('status', 'active')
    if status_filter not in ('active', 'resolved', 'matching'):
        status_filter = 'active'
    params = [status_filter]
    if type_filter:
        sql += " AND type = %s";      params.append(type_filter)
    if category:
        sql += " AND category = %s";  params.append(category)
    if location:
        sql += " AND location LIKE %s"; params.append(f"%{location}%")
    sql += " ORDER BY created_at DESC"
 
    cursor.execute(sql, params)
    posts = cursor.fetchall()
    
    # Chuyển date sang string cho JSON
    for p in posts:
        if p['lost_date']:
            p['lost_date'] = str(p['lost_date'])
        if p['created_at']:
            p['created_at'] = str(p['created_at'])
    
    cursor.close(); conn.close()
    return jsonify(posts)
 
 
# ── Đánh dấu "Đã giải quyết" ─────────────────────────────────────
@app.route('/api/posts/<int:post_id>/resolve', methods=['PUT'])
def resolve_post(post_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE posts SET status='resolved' WHERE id=%s", (post_id,))
    conn.commit()
    cursor.close(); conn.close()
    return jsonify({'message': 'Đã cập nhật trạng thái!'})
 
 
# ── Lấy secret_detail (chỉ dùng khi xác minh chủ sở hữu) ─────────
@app.route('/api/posts/<int:post_id>/secret', methods=['GET'])
def get_secret(post_id):
    # Chỉ người đăng nhập mới gọi được
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'message': 'Không có quyền'}), 403
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT secret_detail FROM posts WHERE id=%s", (post_id,))
    row = cursor.fetchone()
    cursor.close(); conn.close()
    return jsonify(row)
 
@app.route('/api/social-login', methods=['POST'])
def social_login():
    data = request.json
    provider = data.get('provider')  # 'google' hoặc 'facebook'
    email = data.get('email')
    fullname = data.get('name')
    
    if not email:
        return jsonify({"success": False, "message": "Không lấy được email"}), 400
 
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
 
    # 1. Kiểm tra xem email đã tồn tại trong bảng users chưa
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
 
    if user:
        # Trường hợp đã có tài khoản: Đăng nhập luôn
        session['user_id'] = user['id']
        session['username'] = user['username']
        res_user = user
        msg = "Đăng nhập thành công"
    else:
        # Trường hợp chưa có: Tự động đăng ký
        # Tạo username bằng phần đầu của email (ví dụ: hieu.phan)
        new_username = email.split('@')[0]
        
        # Kiểm tra xem username này có bị trùng không (nếu trùng thêm đuôi ngẫu nhiên)
        cursor.execute("SELECT id FROM users WHERE username = %s", (new_username,))
        if cursor.fetchone():
            new_username = f"{new_username}_{uuid.uuid4().hex[:4]}"
 
        sql = "INSERT INTO users (username, email, password, phone, region, role) VALUES (%s, %s, %s, %s, %s, %s)"
        # Password để trống hoặc gán mặc định vì xác thực qua Google rồi
        cursor.execute(sql, (new_username, email, 'social_auth_no_password', '0000000000', 'Chưa cập nhật', 'user'))
        conn.commit()
        
        # Lấy lại thông tin user vừa tạo
        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM users WHERE id = %s", (new_id,))
        res_user = cursor.fetchone()
        
        session['user_id'] = res_user['id']
        session['username'] = res_user['username']
        msg = "Tạo tài khoản và đăng nhập thành công"
 
    cursor.close()
    conn.close()
 
    return jsonify({
        "success": True, 
        "message": msg,
        "user": {
            "username": res_user['username'],
            "id": res_user['id'],
            "email": res_user['email'],
            "role": res_user['role']
        }
    }), 200
 
# ── Sửa bài đăng ─────────────────────────────────────────────────
@app.route('/api/posts/<int:post_id>', methods=['PUT'])
def update_post(post_id):
    data = request.get_json()
    if not verify_user(data.get('user_id')):
        return jsonify({'message': 'Bạn cần đăng nhập!'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # --- CẬP NHẬT CÂU LỆNH SQL VÀ TRUYỀN THÊM BIẾN ---
    sql = """UPDATE posts SET item_name=%s, category=%s, location=%s,
                              lost_date=%s, description=%s, dropoff_point=%s
             WHERE id=%s AND user_id=%s"""
             
    cursor.execute(sql, (
        data['item_name'], 
        data['category'], 
        data['location'],
        data['lost_date'], 
        data['description'], 
        data.get('dropoff_point', ''), # Lấy giá trị mới, nếu không có thì để rỗng
        post_id, 
        data['user_id']
    ))
    
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Cập nhật thành công!'})

# ── Xóa bài đăng ─────────────────────────────────────────────────
@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    user_id = request.args.get('user_id')
    conn = get_db_connection()
    cursor = conn.cursor()
    # Chỉ cho xóa nếu đúng chủ bài hoặc admin
    cursor.execute("DELETE FROM posts WHERE id=%s AND user_id=%s", (post_id, user_id))
    conn.commit()
    cursor.close(); conn.close()
    return jsonify({'message': 'Đã xóa bài đăng!'})
 
 
# ── Lấy thông tin liên hệ người đăng ────────────────────────────
@app.route('/api/users/contact/<int:user_id>', methods=['GET'])
def get_user_contact(user_id):
    conn   = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT phone, email FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    cursor.close(); conn.close()
    if not user:
        return jsonify({'message': 'Không tìm thấy'}), 404
    return jsonify(user)
 
 
# ── Comments ─────────────────────────────────────────────────────
@app.route('/api/posts/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    conn   = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """SELECT id, user_id, username, content, parent_id, created_at
               FROM comments WHERE post_id = %s ORDER BY created_at ASC""",
            (post_id,)
        )
        rows = cursor.fetchall()
        for r in rows:
            if r.get('created_at'):
                r['created_at'] = str(r['created_at'])
            r['replies'] = []

        # Build nested structure
        comments_map = {r['id']: r for r in rows}
        top_level = []
        for r in rows:
            if r.get('parent_id') and r['parent_id'] in comments_map:
                comments_map[r['parent_id']]['replies'].append(r)
            else:
                top_level.append(r)
        return jsonify(top_level)
    except Exception:
        return jsonify([])
    finally:
        cursor.close(); conn.close()
 
 
@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
def add_comment(post_id):
    data = request.get_json()
    if not verify_user(data.get('user_id')):
        return jsonify({'message': 'Bạn cần đăng nhập để bình luận!'}), 401
    
    conn   = get_db_connection()
    cursor = conn.cursor(dictionary=True) # Đổi thành dictionary để lấy tên bài viết dễ hơn
    try:
        parent_id = data.get('parent_id') or None
        
        # 1. Lưu bình luận vào Database
        cursor.execute(
            """INSERT INTO comments (post_id, user_id, username, content, parent_id)
               VALUES (%s, %s, %s, %s, %s)""",
            (post_id, data['user_id'], data['username'], data['content'], parent_id)
        )
        
        # 2. TẠO THÔNG BÁO CHO CHỦ BÀI ĐĂNG
        # Lấy thông tin chủ bài đăng
        cursor.execute("SELECT user_id, item_name FROM posts WHERE id = %s", (post_id,))
        post = cursor.fetchone()
        
        # Chỉ gửi thông báo nếu người comment KHÔNG PHẢI là chủ bài đăng
        if post and post['user_id'] != data['user_id']:
            # Cắt ngắn nội dung comment nếu dài quá (hiển thị cho đẹp)
            short_content = data['content'][:30] + "..." if len(data['content']) > 30 else data['content']
            
            # Tạo lời thông báo y hệt thiết kế của bạn
            msg = f"<b>{data['username']}</b> vừa bình luận vào bài đăng '{post['item_name']}' của bạn: '{short_content}'"
            
            cursor.execute(
                "INSERT INTO notifications (user_id, message, post_id) VALUES (%s, %s, %s)",
                (post['user_id'], msg, post_id)
            )

        conn.commit()
        return jsonify({'message': 'Đã thêm bình luận!'}), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
# ── Sửa bình luận ────────────────────────────────────────────────
@app.route('/api/comments/<int:comment_id>', methods=['PUT'])
def update_comment(comment_id):
    data = request.get_json()
    user_id = data.get('user_id')
    new_content = data.get('content')

    if not user_id or not new_content:
        return jsonify({'message': 'Thiếu thông tin'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    # Câu lệnh WHERE kèm theo user_id để đảm bảo chỉ chủ bình luận mới sửa được
    cursor.execute(
        "UPDATE comments SET content = %s WHERE id = %s AND user_id = %s",
        (new_content, comment_id, user_id)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Đã sửa bình luận'})

# ── Xóa bình luận ────────────────────────────────────────────────
@app.route('/api/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'message': 'Thiếu user_id'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    # Kèm user_id để tránh người khác dùng API xóa trộm
    cursor.execute(
        "DELETE FROM comments WHERE id = %s AND user_id = %s",
        (comment_id, user_id)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Đã xóa bình luận'})
@app.route('/api/posts/<int:post_id>/unresolve', methods=['PUT'])
def unresolve_post(post_id):
    user_id = request.args.get('user_id')
    conn    = get_db_connection()
    cursor  = conn.cursor()
    cursor.execute(
        "UPDATE posts SET status='active' WHERE id=%s AND user_id=%s",
        (post_id, user_id)
    )
    conn.commit()
    cursor.close(); conn.close()
    return jsonify({'message': 'Đã đặt lại trạng thái!'})
 
 
# ── AI Suggest ───────────────────────────────────────────────────
@app.route('/api/suggest', methods=['GET'])
def suggest_posts():
    from datetime import datetime
    opposite_type = request.args.get('opposite_type', '')
    category      = request.args.get('category', '').strip()
    location      = request.args.get('location', '').strip().lower()
    date_str      = request.args.get('date', '').strip()
    item_name     = request.args.get('item_name', '').strip().lower()
 
    if not opposite_type:
        return jsonify([])
 
    try:
        conn   = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """SELECT id, user_id, username, type, item_name, category,
                      location, lost_date, description, image_url, created_at
               FROM posts WHERE type = %s AND status = 'active'
               ORDER BY created_at DESC LIMIT 100""",
            (opposite_type,)
        )
        posts = cursor.fetchall()
        cursor.close(); conn.close()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
 
    ref_date = None
    if date_str:
        try:
            ref_date = datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            pass
 
    scored = []
    for p in posts:
        score = 0
        if category and p.get('category') == category:
            score += 3
        if location and p.get('location'):
            loc_words = [w for w in location.split() if len(w) > 2]
            score += sum(2 for w in loc_words if w in p['location'].lower())
        if ref_date and p.get('lost_date'):
            try:
                diff = abs((ref_date - datetime.strptime(str(p['lost_date']), '%Y-%m-%d')).days)
                if diff <= 7:    score += 2
                elif diff <= 14: score += 1
            except Exception:
                pass
        if item_name and p.get('item_name'):
            name_words = [w for w in item_name.split() if len(w) > 1]
            score += sum(1 for w in name_words if w in p['item_name'].lower())
        if score > 0:
            p['score'] = score
            if p.get('lost_date'):  p['lost_date']  = str(p['lost_date'])
            if p.get('created_at'): p['created_at'] = str(p['created_at'])
            scored.append(p)
 
    scored.sort(key=lambda x: x['score'], reverse=True)
    return jsonify(scored[:5])
 
# 1. API lấy bài đăng

@app.route('/api/admin/posts')
def admin_get_all_posts():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, username, type, item_name, created_at FROM posts ORDER BY created_at DESC")
        posts = cursor.fetchall()
        for p in posts:
            p['created_at'] = str(p['created_at'])
        cursor.close()
        conn.close()
        return jsonify(posts)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API Thống kê cho Admin Dashboard
@app.route('/api/admin/stats', methods=['GET'])
def admin_get_stats():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 1. Đếm TẤT CẢ bài đăng (cho ô Đồ thất lạc - không phân biệt mất hay nhặt)
    cursor.execute("SELECT COUNT(*) as total FROM posts")
    total_posts = cursor.fetchone()['total']
    
    # 2. Đếm các bài ĐÃ GIẢI QUYẾT (cho ô Đã tìm thấy)
    cursor.execute("SELECT COUNT(*) as total FROM posts WHERE status = 'resolved'")
    resolved_posts = cursor.fetchone()['total']

    # (Tùy chọn: Nếu bạn cần API này trả về luôn số User để đắp lên thì để dòng dưới, không thì bỏ qua)
    cursor.execute("SELECT COUNT(*) as total FROM users WHERE username != 'admin'")
    total_users = cursor.fetchone()['total']
    
    cursor.close()
    conn.close()
    
    return jsonify({
        "total_posts": total_posts,
        "resolved_posts": resolved_posts,
        "total_users": total_users # Dữ liệu user vẫn giữ nguyên 
    })
@app.route('/api/admin/posts/<int:post_id>', methods=['DELETE'])
def admin_delete_post(post_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM posts WHERE id = %s", (post_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Xóa thành công'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500
# API Lấy danh sách thông báo của User
@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify([])
        
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    # Lấy 10 thông báo mới nhất
    cursor.execute("SELECT * FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 10", (user_id,))
    notifs = cursor.fetchall()
    
    # Ép kiểu thời gian
    for n in notifs:
        n['created_at'] = str(n['created_at'])
        
    cursor.close()
    conn.close()
    return jsonify(notifs)

# API Đánh dấu đã đọc (Tắt chấm đỏ)
@app.route('/api/notifications/read', methods=['PUT'])
def mark_notifications_read():
    data = request.json
    user_id = data.get('user_id')
    if user_id:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE notifications SET is_read = TRUE WHERE user_id = %s", (user_id,))
        conn.commit()
        cursor.close()
        conn.close()
    return jsonify({'message': 'OK'})

@app.route('/api/report_post', methods=['POST'])
def report_post():
    data = request.json
    post_id = data.get('post_id')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Tìm chủ bài viết
        cursor.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
        post_owner = cursor.fetchone()
        
        if post_owner:
            owner_id = post_owner['user_id']
            
            # 2. Tăng số lần báo cáo lên 1
            cursor.execute("UPDATE users SET reports_count = reports_count + 1 WHERE id = %s", (owner_id,))
            
            # 3. KIỂM TRA LẠI: Nếu từ 3 trở lên thì khóa (is_banned = 1)
            cursor.execute("UPDATE users SET is_banned = 1 WHERE id = %s AND reports_count >= 3", (owner_id,))
            
            conn.commit()
            return jsonify({'message': 'Báo cáo thành công!'}), 200
            
        return jsonify({'message': 'Không tìm thấy bài viết'}), 404
    except Exception as e:
        conn.rollback()
        return jsonify({'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
# ── Ghép đôi thủ công ────────────────────────────────────────────
@app.route('/api/posts/<int:post_id>/match', methods=['PUT'])
def match_posts(post_id):
    data      = request.get_json()
    target_id = data.get('target_post_id')
    user_id   = data.get('user_id')

    if not target_id:
        return jsonify({'message': 'Thiếu target_post_id'}), 400

    conn   = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT user_id, type FROM posts WHERE id = %s", (post_id,))
    my_post = cursor.fetchone()
    if not my_post or str(my_post['user_id']) != str(user_id):
        cursor.close(); conn.close()
        return jsonify({'message': 'Không có quyền ghép bài này!'}), 403

    cursor.execute("SELECT type FROM posts WHERE id = %s AND status = 'active'", (target_id,))
    target_post = cursor.fetchone()
    if not target_post:
        cursor.close(); conn.close()
        return jsonify({'message': 'Bài đích không tồn tại!'}), 404
    if target_post['type'] == my_post['type']:
        cursor.close(); conn.close()
        return jsonify({'message': 'Chỉ ghép bài Mất với bài Nhặt!'}), 400

    cursor.execute(
        "UPDATE posts SET status='matching', matched_with=%s WHERE id=%s",
        (target_id, post_id)
    )
    cursor.execute(
        "UPDATE posts SET status='matching', matched_with=%s WHERE id=%s",
        (post_id, target_id)
    )
    conn.commit()
    # Lấy thông tin 2 bài để tạo thông báo
    cursor.execute("SELECT user_id, item_name FROM posts WHERE id = %s", (post_id,))
    my_post_info = cursor.fetchone()

    cursor.execute("SELECT user_id, item_name FROM posts WHERE id = %s", (target_id,))
    target_post_info = cursor.fetchone()

    # Gửi thông báo cho chủ bài đích (người bị ghép vào)
    if target_post_info:
        cursor.execute(
            "INSERT INTO notifications (user_id, message, post_id) VALUES (%s, %s, %s)",
            (
                target_post_info['user_id'],
                f"Bài đăng <b>'{target_post_info['item_name']}'</b> của bạn đang được ghép với một bài đăng khác. Hãy qua mục ⏳ Đang ghép để kiểm tra thông tin và xác nhận.",
                target_id
            )
        )

    # Gửi thông báo cho chủ bài gốc (người bấm ghép)
    if my_post_info:
        cursor.execute(
            "INSERT INTO notifications (user_id, message, post_id) VALUES (%s, %s, %s)",
            (
                my_post_info['user_id'],
                f"Bài đăng <b>'{my_post_info['item_name']}'</b> của bạn đang được ghép với một bài đăng khác. Hãy qua mục ⏳ Đang ghép để kiểm tra thông tin và xác nhận.",
                post_id
            )
        )

    conn.commit()
    cursor.close(); conn.close()
    return jsonify({'message': 'Ghép đôi thành công!'})


# ── Huỷ ghép đôi ─────────────────────────────────────────────────
@app.route('/api/posts/<int:post_id>/unmatch', methods=['PUT'])
def unmatch_post(post_id):
    user_id = request.args.get('user_id')
    conn    = get_db_connection()
    cursor  = conn.cursor(dictionary=True)

    # Lấy ID bài đang ghép với bài này
    cursor.execute("SELECT matched_with FROM posts WHERE id=%s", (post_id,))
    row = cursor.fetchone()
    matched_id = row['matched_with'] if row else None

    # Đưa cả 2 về active và xóa matched_with
    cursor.execute(
        "UPDATE posts SET status='active', matched_with=NULL WHERE id=%s AND user_id=%s",
        (post_id, user_id)
    )
    if matched_id:
        cursor.execute(
            "UPDATE posts SET status='active', matched_with=NULL WHERE id=%s",
            (matched_id,)
        )

    conn.commit()
    cursor.close(); conn.close()
    return jsonify({'message': 'Đã huỷ ghép!'})
@app.route('/api/posts/<int:post_id>/info', methods=['GET'])
def get_post_info(post_id):
    conn   = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT id, item_name, username, type, location FROM posts WHERE id = %s",
        (post_id,)
    )
    post = cursor.fetchone()
    cursor.close(); conn.close()
    if not post:
        return jsonify({'message': 'Không tìm thấy'}), 404
    return jsonify(post)
if __name__ == '__main__':
    app.run(debug=True, port=5000)