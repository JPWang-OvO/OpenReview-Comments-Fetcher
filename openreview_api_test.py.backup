import openreview.api
import getpass

print("OpenReview API 测试脚本")
print("=" * 40)

forum_id = 'jCPak79Kev'

print("正在查询论文: AnalogGenie - A Generative Engine for Automatic Discovery of Analog Circuit Topologies")
print("论文链接: https://openreview.net/forum?id=jCPak79Kev")
print(f"正在查询 forum ID: {forum_id}")

try:
    # 首先尝试无认证访问
    print("\n=== 尝试无认证访问 ===")
    client = openreview.api.OpenReviewClient(baseurl='https://api2.openreview.net')
    
    # 获取主论文
    main_note = client.get_note(forum_id)
    print("✓ 成功获取主论文!")
    
    print(f"\n=== 主论文信息 ===")
    print(f"ID: {main_note.id}")
    print(f"标题: {main_note.content['title']['value']}")
    print(f"作者: {', '.join(main_note.content['authors']['value'])}")
    
    if 'abstract' in main_note.content:
        abstract = main_note.content['abstract']['value']
        print(f"摘要: {abstract[:300]}...")
    
    # 获取所有相关notes (评论、评审等)
    print(f"\n=== 获取相关notes ===")
    notes = client.get_notes(forum=forum_id)
    print(f"找到 {len(notes)} 条相关notes")
    
    # 分类显示不同类型的notes
    reviews = []
    comments = []
    main_paper = None
    
    for note in notes:
        if 'title' in note.content:
            main_paper = note
        elif 'summary' in note.content and 'rating' in note.content:
            reviews.append(note)
        elif 'comment' in note.content:
            comments.append(note)
    
    # 显示评审详情
    if reviews:
        print(f"\n=== 评审详情 ({len(reviews)} 条评审) ===")
        for i, review in enumerate(reviews):
            print(f"\n🔍 评审 {i+1}")
            print(f"评审者: {review.signatures[0] if review.signatures else 'Unknown'}")
            
            # 显示评分
            if 'rating' in review.content:
                rating = review.content['rating']['value']
                print(f"⭐ 评分: {rating}")
            
            if 'confidence' in review.content:
                confidence = review.content['confidence']['value']
                print(f"🎯 置信度: {confidence}")
            
            # 显示摘要
            if 'summary' in review.content:
                summary = review.content['summary']['value']
                print(f"\n📝 摘要:")
                print(f"{summary}")
            
            # 显示优点
            if 'strengths' in review.content:
                strengths = review.content['strengths']['value']
                print(f"\n✅ 优点:")
                print(f"{strengths}")
            
            # 显示缺点
            if 'weaknesses' in review.content:
                weaknesses = review.content['weaknesses']['value']
                print(f"\n❌ 缺点:")
                print(f"{weaknesses}")
            
            # 显示问题
            if 'questions' in review.content:
                questions = review.content['questions']['value']
                print(f"\n❓ 问题:")
                print(f"{questions}")
            
            # 显示其他评审字段
            other_fields = ['soundness', 'presentation', 'contribution']
            for field in other_fields:
                if field in review.content:
                    value = review.content[field]['value']
                    print(f"\n📊 {field.title()}: {value}")
            
            print("=" * 80)
    
    # 显示评论
    if comments:
        print(f"\n=== 评论和回复 ({len(comments)} 条) ===")
        for i, comment in enumerate(comments):
            print(f"\n💬 评论 {i+1}")
            print(f"作者: {comment.signatures[0] if comment.signatures else 'Unknown'}")
            
            if 'comment' in comment.content:
                comment_text = comment.content['comment']['value']
                print(f"内容: {comment_text}")
            
            print("-" * 60)

except Exception as e:
    print(f"无认证访问失败: {e}")
    print("\n=== 尝试认证访问 ===")
    
    try:
        # 获取用户凭据
        username = input("请输入您的 OpenReview 用户名: ")
        password = getpass.getpass("请输入您的 OpenReview 密码: ")
        
        # 创建认证客户端
        client = openreview.api.OpenReviewClient(
            baseurl='https://api2.openreview.net',
            username=username,
            password=password
        )
        
        # 重复上面的查询逻辑
        main_note = client.get_note(forum_id)
        print("✓ 认证访问成功!")
        
        print(f"\n=== 主论文信息 ===")
        print(f"ID: {main_note.id}")
        print(f"标题: {main_note.content['title']['value']}")
        print(f"作者: {', '.join(main_note.content['authors']['value'])}")
        
        notes = client.get_notes(forum=forum_id)
        print(f"\n找到 {len(notes)} 条相关notes")
        
        for i, note in enumerate(notes):
            print(f"\n--- Note {i+1} ---")
            print(f"ID: {note.id}")
            print(f"签名: {note.signatures}")
            
            if 'title' in note.content:
                print(f"类型: 主论文")
            elif 'comment' in note.content:
                print(f"类型: 评论")
                comment = note.content['comment']['value']
                print(f"评论: {comment[:200]}...")
            elif 'review' in note.content:
                print(f"类型: 评审")
                review = note.content['review']['value']
                print(f"评审: {review[:200]}...")
            
    except Exception as auth_error:
        print(f"认证访问也失败: {auth_error}")
        print("请检查您的凭据和网络连接。")