import openreview.api
import getpass
from collections import defaultdict

def build_conversation_tree(notes):
    """Build conversation tree structure"""
    # Organize notes by forum and replyto
    tree = defaultdict(list)
    root_notes = []
    
    for note in notes:
        if note.replyto is None:
            # Root node (main paper or top-level review)
            root_notes.append(note)
        else:
            # Reply node
            tree[note.replyto].append(note)
    
    return {'roots': root_notes, 'replies': dict(tree)}

def get_note_type(note):
    """Identify note type"""
    if not note.content:
        return "Unknown"
    
    content_keys = set(note.content.keys())
    
    # Main paper
    if 'title' in content_keys and 'authors' in content_keys and 'abstract' in content_keys:
        return "Paper"
    
    # Decision
    elif 'decision' in content_keys:
        return "Decision"
    
    # Meta review
    elif 'metareview' in content_keys:
        return "Meta Review"
    
    # Official review
    elif 'review' in content_keys or 'rating' in content_keys:
        return "Official Review"
    
    # Author response
    elif 'title' in content_keys and 'comment' in content_keys:
        title = note.content.get('title', {}).get('value', '').lower()
        if 'author' in title or 'response' in title:
            return "Author Response"
        return "Comment"
    
    # Comment
    elif 'comment' in content_keys:
        return "Comment"
    
    return "Other"

def print_conversation_tree(tree, file_handle, level=0):
    """Recursively print conversation tree"""
    indent = "  " * level
    
    # Group root nodes by type
    paper_notes = []
    review_notes = []
    other_notes = []
    
    for root in tree['roots']:
        note_type = get_note_type(root)
        if note_type == "Paper":
            paper_notes.append(root)
        elif note_type == "Official Review":
            review_notes.append(root)
        else:
            other_notes.append(root)
    
    # Place the main paper first
    all_sorted_roots = paper_notes
    
    # Merge all non-main paper root nodes and sort by time (new to old)
    non_paper_notes = other_notes + review_notes
    non_paper_notes.sort(key=lambda x: x.cdate, reverse=True)
    all_sorted_roots.extend(non_paper_notes)
    
    for root in all_sorted_roots:
        note_type = get_note_type(root)
        
        # Get signature info
        signatures = root.signatures[0] if root.signatures else "Unknown"
        
        # Get title or content summary
        title = ""
        if root.content:
            if 'title' in root.content:
                title = root.content['title'].get('value', '')[:100]
            elif 'comment' in root.content:
                title = root.content['comment'].get('value', '')[:100]
            elif 'review' in root.content:
                title = root.content['review'].get('value', '')[:100]
        
        file_handle.write(f"{indent}[{note_type}] {signatures}\n")
        file_handle.write(f"{indent}ID: {root.id}\n")
        if title:
            file_handle.write(f"{indent}内容: {title}...\n")
        file_handle.write(f"{indent}创建时间: {root.cdate}\n")
        file_handle.write("\n")
        
        # Recursively handle replies
        if root.id in tree['replies']:
            print_replies(tree['replies'][root.id], tree['replies'], file_handle, level + 1)

def print_replies(replies, all_replies, file_handle, level):
    """Print replies using different sorting strategies by level"""
    indent = "  " * level
    
    if level == 1:
        # First-level replies (direct replies to the main paper): sort by type and time
        review_replies = []
        other_replies = []
        
        for reply in replies:
            note_type = get_note_type(reply)
            if note_type == "Official Review":
                review_replies.append(reply)
            else:
                other_replies.append(reply)
        
        # Sort reviews from newest to oldest
        review_replies.sort(key=lambda x: x.cdate, reverse=True)
        
        # Other types (decision, meta review, comment) sorted from newest to oldest
        other_replies.sort(key=lambda x: x.cdate, reverse=True)
        
        # Show decisions and meta reviews first (newest to oldest), then all other replies (newest to oldest)
        decision_and_meta = [r for r in other_replies if get_note_type(r) in ["Decision", "Meta Review"]]
        other_all = [r for r in other_replies if get_note_type(r) not in ["Decision", "Meta Review"]] + review_replies
        
        # All other replies sorted from newest to oldest
        other_all.sort(key=lambda x: x.cdate, reverse=True)
        
        sorted_replies = decision_and_meta + other_all
    else:
        # Other levels: sort from earlier to later (natural conversation flow)
        sorted_replies = sorted(replies, key=lambda x: x.cdate)
    
    for reply in sorted_replies:
        note_type = get_note_type(reply)
        signatures = reply.signatures[0] if reply.signatures else "Unknown"
        
        # Get title or content summary
        title = ""
        if reply.content:
            if 'title' in reply.content:
                title = reply.content['title'].get('value', '')[:100]
            elif 'comment' in reply.content:
                title = reply.content['comment'].get('value', '')[:100]
        
        file_handle.write(f"{indent}↳ [{note_type}] {signatures}\n")
        file_handle.write(f"{indent}  ID: {reply.id}\n")
        if title:
            file_handle.write(f"{indent}  内容: {title}...\n")
        file_handle.write(f"{indent}  创建时间: {reply.cdate}\n")
        file_handle.write("\n")
        
        # Recursively handle child replies
        if reply.id in all_replies:
            print_replies(all_replies[reply.id], all_replies, file_handle, level + 1)

print("OpenReview API 测试脚本")
print("=" * 40)

forum_id = 'jCPak79Kev'

print("正在查询论文: AnalogGenie - A Generative Engine for Automatic Discovery of Analog Circuit Topologies")
print("论文链接: https://openreview.net/forum?id=jCPak79Kev")
print(f"正在查询 forum ID: {forum_id}")

try:
    # First try unauthenticated access
    print("\n=== 尝试无认证访问 ===")
    client = openreview.api.OpenReviewClient(baseurl='https://api2.openreview.net')
    
    # Fetch main paper
    main_note = client.get_note(forum_id)
    print("✓ 成功获取主论文!")
    
    print(f"\n=== 主论文信息 ===")
    print(f"ID: {main_note.id}")
    print(f"标题: {main_note.content['title']['value']}")
    print(f"作者: {', '.join(main_note.content['authors']['value'])}")
    
    if 'abstract' in main_note.content:
        abstract = main_note.content['abstract']['value']
        print(f"摘要: {abstract[:300]}...")
    
    # Get all related notes (comments, reviews, etc.)
    print(f"\n=== 获取相关notes ===")
    notes = client.get_notes(forum=forum_id)
    print(f"找到 {len(notes)} 条相关notes")
    
    # Categorize and display different types of notes
    reviews = []
    comments = []
    main_paper = None
    
    # Analyze the full structure of notes
    print(f"\n=== 分析Notes结构 ===")
    
    # Write complete note information to a file
    with open('openreview_notes_structure.txt', 'w', encoding='utf-8') as f:
        for i, note in enumerate(notes):
            f.write(f"=== Note {i+1} ===\n")
            f.write(f"ID: {note.id}\n")
            f.write(f"Forum: {note.forum}\n")
            f.write(f"ReplyTo: {note.replyto}\n")
            f.write(f"Signatures: {note.signatures}\n")
            f.write(f"Readers: {note.readers}\n")
            f.write(f"Writers: {note.writers}\n")
            f.write(f"Invitations: {note.invitations}\n")
            f.write(f"CDate: {note.cdate}\n")
            f.write(f"MDate: {note.mdate}\n")
            f.write(f"Content Keys: {list(note.content.keys()) if note.content else 'None'}\n")
            f.write(f"Content: {note.content}\n")
            f.write("\n" + "="*50 + "\n\n")
            
            print(f"已分析note ID: {note.id}")
    
    print(f"所有notes结构已保存到 openreview_notes_structure.txt 文件")
    
    # Build conversation tree
    print(f"\n=== 构建对话树 ===")
    conversation_tree = build_conversation_tree(notes)
    
    # Save conversation tree
    with open('openreview_conversation_tree.txt', 'w', encoding='utf-8') as f:
        f.write("OpenReview 对话树结构\n")
        f.write("=" * 50 + "\n\n")
        print_conversation_tree(conversation_tree, f)
    
    print(f"对话树已保存到 openreview_conversation_tree.txt 文件")


except Exception as e:
    print(f"无认证访问失败: {e}")
    print("\n=== 尝试认证访问 ===")
    
    try:
        # Get user credentials
        username = input("请输入您的 OpenReview 用户名: ")
        password = getpass.getpass("请输入您的 OpenReview 密码: ")
        
        # Create authenticated client
        client = openreview.api.OpenReviewClient(
            baseurl='https://api2.openreview.net',
            username=username,
            password=password
        )
        
        # Repeat the above query logic
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
