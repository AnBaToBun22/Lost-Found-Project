# ===================================================================== 
# NEWS.PY
# Hệ thống 3: Gọi API Tin tức từ NewsAPI.org
# =====================================================================

import requests # dùng để gửi yêu cầu đến API NewsAPI


def get_news(): 
    """
    Hàm này sẽ:
    1.  Gọi API tin tức
    2.  Lấy danh sách bài báo
    3.  Trả về 10 bài đầu tiên dạng JSON
    """

    # API key NewsAPI (sinh viên tự đăng ký miễn phí)
    # LƯU Ý QUAN TRỌNG: Bạn nhớ thay YOUR_NEWS_API_KEY bằng key thật của bạn nhé!
    API_KEY = "YOUR_NEWS_API_KEY"

    # Gọi tin tức US (có thể đổi thành 'vi' nếu muốn)
    url = f"https://newsapi.org/v2/top-headlines?country=us&apiKey=613d6f501d644335897b8f4d4964a8d4"

    response = requests.get(url) 
    
    # Đã tách dòng data = ... ra khỏi dòng response
    data = response.json()

    articles = []

    # Lấy 10 bài đầu
    for a in data["articles"][:10]:
        # Đã chỉnh lại thụt lề và tách các phần tử trong biến dictionary
        articles.append({ 
            "title": a["title"],
            "description": a["description"], 
            "url": a["url"]
        })

    return articles