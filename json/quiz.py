#!/usr/bin/env python3
"""
题库 JSON 管理工具 - 交互式命令行
支持 merge / split / help / exit，注意内存释放
"""
import json
import os
import re
import shlex
from datetime import datetime
from pathlib import Path

# ------------------- 工具函数 -------------------
def natural_sort_key(name: str):
    return [int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', name)]

def get_json_files(directory: str):
    p = Path(directory)
    if not p.is_dir():
        raise NotADirectoryError(f"目录不存在: {directory}")
    files = sorted(p.glob('*.json'), key=lambda f: natural_sort_key(f.name))
    return files

def load_json(path: Path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    # 清空数据引用以释放内存（对超大文件有帮助）
    data.clear()

def update_meta(meta: dict, total: int):
    new_meta = {**meta}
    new_meta['total_questions'] = total
    new_meta['export_time'] = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    return new_meta

# ------------------- 合并功能 -------------------
def merge_files(file_paths: list[Path], output_path: Path, auto_yes=False):
    if not file_paths:
        print("没有找到 JSON 文件，合并中止。")
        return

    print("\n将按以下顺序合并文件：")
    total_q = 0
    # 仅加载元数据用于显示，避免全部加载占用内存
    file_info = []
    for fp in file_paths:
        data = load_json(fp)
        qcount = len(data.get('questions', []))
        total_q += qcount
        file_info.append((fp.name, qcount, data.get('meta', {})))
        # 释放 data，只保留 meta
        if fp != file_paths[0]:  # 第一个 meta 需要保留，但可以浅拷贝
            pass
        # 强制删除 data 释放内存
        del data

    for i, (name, qcount, _) in enumerate(file_info, 1):
        print(f"  {i:2d}. {name}  ({qcount} 题)")
    print(f"总计：{total_q} 题")

    if not auto_yes:
        ans = input("\n是否继续？(y/n) ").strip().lower()
        if ans != 'y':
            print("已取消合并。")
            return

    # 真正执行合并
    first_meta = file_info[0][2]  # 第一个文件的 meta
    all_questions = []
    for fp in file_paths:
        data = load_json(fp)
        all_questions.extend(data.pop('questions', []))
        del data  # 释放

    merged = {
        "meta": update_meta(first_meta, len(all_questions)),
        "questions": all_questions
    }
    save_json(merged, output_path)
    print(f"✅ 合并完成 -> {output_path} （共 {len(all_questions)} 题）")
    # 显式释放 merged
    del merged, all_questions

# ------------------- 拆分功能 -------------------
def split_uniform(data: dict, parts: int, out_dir: Path, base_name: str):
    questions = data['questions']
    total = len(questions)
    chunk_size = total // parts
    remainder = total % parts
    chunks = []
    start = 0
    for i in range(parts):
        end = start + chunk_size + (1 if i < remainder else 0)
        chunks.append(questions[start:end])
        start = end
    return _write_chunks(chunks, base_name, out_dir, data['meta'])

def split_by_count(data: dict, count_per_file: int, out_dir: Path, base_name: str):
    questions = data['questions']
    chunks = [questions[i:i+count_per_file] for i in range(0, len(questions), count_per_file)]
    return _write_chunks(chunks, base_name, out_dir, data['meta'])

def split_by_ids(data: dict, break_ids: list[int], out_dir: Path, base_name: str):
    questions = data['questions']
    break_ids = sorted(break_ids)
    chunks = []
    remaining = questions[:]
    for bid in break_ids:
        chunk = [q for q in remaining if q['id'] <= bid]
        chunks.append(chunk)
        remaining = [q for q in remaining if q['id'] > bid]
    if remaining:
        chunks.append(remaining)
    return _write_chunks(chunks, base_name, out_dir, data['meta'])

def _write_chunks(chunks: list, base_name: str, out_dir: Path, meta: dict):
    out_dir.mkdir(parents=True, exist_ok=True)
    files = []
    for i, chunk in enumerate(chunks, 1):
        if not chunk:
            continue
        start_id = chunk[0]['id']
        end_id = chunk[-1]['id']
        chunk_meta = update_meta({**meta, 'quiz_name': f"{base_name}-p{i}"}, len(chunk))
        out_name = f"{base_name}_part{i}_{start_id}-{end_id}.json"
        out_path = out_dir / out_name
        save_json({"meta": chunk_meta, "questions": chunk}, out_path)
        files.append(out_path)
    print(f"✅ 拆分完成，共生成 {len(files)} 个文件 -> {out_dir}")
    # 清空 chunks 内存
    chunks.clear()
    return files

def interactive_split(file_path: Path):
    """交互式拆分一个选定的文件"""
    data = load_json(file_path)
    total = len(data['questions'])
    meta = data['meta']
    quiz_name = meta.get('quiz_name', file_path.stem)
    print(f"\n已选择：{file_path.name}  ({total} 题)")
    print("请选择拆分方式：")
    print("  1. 均匀拆分成 N 份")
    print("  2. 按每份固定题数拆分")
    print("  3. 按指定 ID 断点拆分")
    choice = input("输入序号 (1/2/3): ").strip()
    out_dir = Path(input("输出目录 (默认 split_output): ").strip() or "split_output")

    try:
        if choice == '1':
            n = int(input("拆分成几份？ "))
            split_uniform(data, n, out_dir, quiz_name)
        elif choice == '2':
            cnt = int(input("每份多少题？ "))
            split_by_count(data, cnt, out_dir, quiz_name)
        elif choice == '3':
            ids_str = input("输入断点 ID，用逗号分隔 (例如 20,50): ")
            ids = [int(x.strip()) for x in ids_str.split(',') if x.strip()]
            split_by_ids(data, ids, out_dir, quiz_name)
        else:
            print("无效选择。")
    finally:
        # 无论是否成功，都释放 data 内存
        del data

# ------------------- 命令处理 -------------------
def do_merge(args: list[str]):
    """merge <directory> [-o output] [-y]"""
    directory = '.'
    output = 'merged.json'
    auto_yes = False

    i = 0
    while i < len(args):
        if args[i] == '-o' and i+1 < len(args):
            output = args[i+1]
            i += 2
        elif args[i] == '-y':
            auto_yes = True
            i += 1
        elif not args[i].startswith('-'):
            directory = args[i]
            i += 1
        else:
            print(f"未知参数: {args[i]}")
            return

    try:
        files = get_json_files(directory)
    except NotADirectoryError as e:
        print(e)
        return

    merge_files(files, Path(output), auto_yes)

def do_split(args: list[str]):
    """split <file_or_dir> [-n number] [-d out_dir]"""
    path = None
    n = None
    out_dir = 'split_output'

    i = 0
    while i < len(args):
        if args[i] == '-n' and i+1 < len(args):
            n = int(args[i+1])
            i += 2
        elif args[i] == '-d' and i+1 < len(args):
            out_dir = args[i+1]
            i += 2
        elif not args[i].startswith('-'):
            path = args[i]
            i += 1
        else:
            print(f"未知参数: {args[i]}")
            return

    if not path:
        print("请输入要拆分的文件或目录路径。")
        return

    if os.path.isfile(path):
        file_path = Path(path)
        if n:
            # 快速模式：按每份 n 题拆分
            data = load_json(file_path)
            meta = data['meta']
            quiz_name = meta.get('quiz_name', file_path.stem)
            split_by_count(data, n, Path(out_dir), quiz_name)
            del data
        else:
            interactive_split(file_path)
    elif os.path.isdir(path):
        files = get_json_files(path)
        if not files:
            print("目录下没有 JSON 文件。")
            return
        print("\n可用题库文件：")
        for i, fp in enumerate(files, 1):
            data = load_json(fp)
            qcount = len(data.get('questions', []))
            print(f"  {i:2d}. {fp.name}  ({qcount} 题)")
            del data  # 立即释放

        choice = input("请选择文件序号 (或输入 0 退出): ").strip()
        if choice == '0':
            return
        try:
            idx = int(choice) - 1
            selected = files[idx]
        except (ValueError, IndexError):
            print("选择无效。")
            return
        interactive_split(selected)
    else:
        print("路径不存在，请检查。")

def show_help():
    print("""
题库 JSON 管理工具 - 命令说明
================================
merge <目录> [-o 输出文件] [-y]  合并目录下所有 JSON 文件
    -y : 跳过确认直接合并
    例: merge ./chapters -o full.json -y

split <文件或目录> [-n 每份题数] [-d 输出目录]
    交互式拆分或快速拆分（指定 -n）
    例: split ICAO-第一章.json -n 20 -d out

exit   退出程序
help   显示本帮助
""")

# ------------------- 主循环 -------------------
def main():
    print("题库管理工具已启动（输入 help 查看命令，exit 退出）")
    while True:
        try:
            raw = input("quiz> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n退出。")
            break

        if not raw:
            continue

        # 解析命令行
        try:
            parts = shlex.split(raw)
        except ValueError as e:
            print(f"输入错误: {e}")
            continue

        if not parts:
            continue

        cmd = parts[0].lower()
        args = parts[1:]

        if cmd == 'exit':
            print("再见！")
            break
        elif cmd == 'help':
            show_help()
        elif cmd == 'merge':
            do_merge(args)
        elif cmd == 'split':
            do_split(args)
        else:
            print("未知命令，输入 help 查看可用命令。")

if __name__ == '__main__':
    main()