#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
scripts/hand-photo.py — đưa một ảnh chụp bàn tay thật vào bàn phím của TypingEase (hands.js).

Cách chụp ảnh đầu vào:
  - Đặt hai bàn tay lên một tờ giấy / mặt bàn TRẮNG TRƠN, tư thế gõ 10 ngón (ngón cong nhẹ, đầu
    ngón cách nhau chừng một phím), hai tay cách nhau độ một bàn tay. KHÔNG có bàn phím trong ảnh.
  - Điện thoại giữ thẳng phía trên, chụp vuông góc xuống, cổ tay ở mép dưới ảnh, ngón chỉ lên.
  - Ánh sáng đều, tránh bóng đổ đậm xuống nền (bóng nhạt thì script chịu được).

Bước 1 — tách nền, cắt hai tay, thu nhỏ, kẻ lưới để đo:
    python scripts/hand-photo.py cut anh-tay.jpg [--width 460] [--out assets/hands]
  → assets/hands/left.webp, right.webp (nền trong suốt) và assets/hands/left-grid.png, right-grid.png
    (cùng ảnh, có lưới 20px đánh số) để đọc toạ độ đầu ngón.

Bước 2 — ghi toạ độ đầu ngón (đơn vị: pixel trong ảnh ĐÃ THU NHỎ, đọc từ ảnh lưới) vào một JSON:
    { "left":  { "LP": [x, y], "LR": [x, y], "LM": [x, y], "LI": [x, y], "LT": [x, y] },
      "right": { "RI": [x, y], "RM": [x, y], "RR": [x, y], "RP": [x, y], "RT": [x, y] } }
  rồi:
    python scripts/hand-photo.py anchors tips.json [--out assets/hands] [--hands hands.js]
  → ghi lại khối `>>> HAND_PHOTOS … <<< HAND_PHOTOS` trong hands.js (kích thước ảnh đọc từ file PNG).

Chỉ cần Pillow (pip install pillow). Không đụng tới thứ gì khác trong repo.
"""
import argparse, io, json, os, re, sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')   # console Windows mặc định cp1252, in tiếng Việt là ném lỗi

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:  # pragma: no cover
    sys.exit('Cần Pillow: pip install pillow')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CODES = {'left': ['LP', 'LR', 'LM', 'LI', 'LT'], 'right': ['RI', 'RM', 'RR', 'RP', 'RT']}


# --- bước 1: tách nền + cắt -------------------------------------------------------------------
def near_white_mask(image, threshold=225, spread=28):
    """Ảnh 'L' 255 ở pixel gần trắng (sáng và ít màu), 0 ở chỗ còn lại."""
    rgb = image.convert('RGB')
    width, height = rgb.size
    mask = Image.new('L', (width, height), 0)
    src = rgb.load()
    dst = mask.load()
    for y in range(height):
        for x in range(width):
            r, g, b = src[x, y]
            lo, hi = min(r, g, b), max(r, g, b)
            if lo >= threshold and hi - lo <= spread:
                dst[x, y] = 255
    return mask


def background_alpha(image):
    """Alpha: nền = vùng gần-trắng NỐI với viền ảnh (flood fill từ bốn góc + giữa các cạnh), nên
    điểm sáng trên móng hay khớp ngón (không nối với viền) vẫn được giữ."""
    mask = near_white_mask(image)
    width, height = mask.size
    seeds = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1),
             (width // 2, 0), (0, height // 2), (width - 1, height // 2)]
    px = mask.load()
    for seed in seeds:
        if px[seed] == 255:
            ImageDraw.floodfill(mask, seed, 128)
    alpha = mask.point(lambda v: 0 if v == 128 else 255)
    # co 1px rồi làm mềm mép để không còn quầng trắng quanh ngón
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    return alpha


def split_columns(alpha):
    """Tách hai tay tại khe trong suốt rộng nhất nằm ở 1/3 giữa ảnh."""
    width, height = alpha.size
    px = alpha.load()
    filled = [any(px[x, y] > 40 for y in range(0, height, 2)) for x in range(width)]
    best, run, start = None, 0, None
    for x in range(width):
        if not filled[x]:
            if start is None:
                start = x
            run += 1
        else:
            if start is not None and width // 3 <= start + run // 2 <= 2 * width // 3 and (best is None or run > best[1]):
                best = (start + run // 2, run)
            start, run = None, 0
    if best is None:
        return width // 2
    return best[0]


def crop_alpha(image):
    bbox = image.getchannel('A').getbbox()
    return image.crop(bbox) if bbox else image


def draw_grid(image, step=20):
    grid = image.copy().convert('RGBA')
    overlay = Image.new('RGBA', grid.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)
    width, height = grid.size
    for x in range(0, width, step):
        strong = x % 100 == 0
        draw.line([(x, 0), (x, height)], fill=(0, 120, 255, 200 if strong else 80), width=1)
        if strong:
            draw.text((x + 2, 2), str(x), fill=(0, 60, 200, 255))
    for y in range(0, height, step):
        strong = y % 100 == 0
        draw.line([(0, y), (width, y)], fill=(0, 120, 255, 200 if strong else 80), width=1)
        if strong:
            draw.text((2, y + 2), str(y), fill=(0, 60, 200, 255))
    background = Image.new('RGBA', grid.size, (235, 235, 235, 255))
    return Image.alpha_composite(Image.alpha_composite(background, grid), overlay)


def cut(args):
    image = Image.open(args.photo).convert('RGBA')
    alpha = background_alpha(image)
    image.putalpha(alpha)
    image = crop_alpha(image)
    x = split_columns(image.getchannel('A'))
    halves = {'left': crop_alpha(image.crop((0, 0, x, image.height))),
              'right': crop_alpha(image.crop((x, 0, image.width, image.height)))}
    os.makedirs(args.out, exist_ok=True)
    for side, half in halves.items():
        if half.width > args.width:
            ratio = args.width / half.width
            half = half.resize((args.width, round(half.height * ratio)), Image.LANCZOS)
        # WebP: có kênh trong suốt, nhỏ hơn PNG nhiều lần với ảnh chụp. Ảnh lưới để đo thì giữ PNG.
        half.save(os.path.join(args.out, f'{side}.webp'), quality=92, method=6)
        draw_grid(half).save(os.path.join(args.out, f'{side}-grid.png'))
        print(f'{side}: {half.width}x{half.height} → {args.out}/{side}.webp (+ {side}-grid.png để đo)')
    print('Bước 2: đọc toạ độ đầu ngón trên ảnh lưới, ghi JSON rồi chạy `anchors`.')


# --- bước 2: ghi khối HAND_PHOTOS ----------------------------------------------------------------
def anchors(args):
    tips = json.load(io.open(args.tips, encoding='utf-8'))
    lines = ['  const PHOTOS = {']
    for side in ('left', 'right'):
        image_path = os.path.join(args.out, f'{side}.webp')
        width, height = Image.open(image_path).size
        missing = [code for code in CODES[side] if code not in tips.get(side, {})]
        if missing:
            sys.exit(f'{side}: thiếu đầu ngón {", ".join(missing)} trong {args.tips}')
        src = '/' + os.path.relpath(image_path, ROOT).replace(os.sep, '/')
        entries = ', '.join(f'{code}: [{tips[side][code][0]}, {tips[side][code][1]}]' for code in CODES[side])
        comma = ',' if side == 'left' else ''
        lines.append(f"    {side}: {{ src: '{src}', width: {width}, height: {height},")
        lines.append(f'      tips: {{ {entries} }} }}{comma}')
    lines.append('  };')
    block = '\n'.join(lines)
    path = args.hands
    raw = io.open(path, encoding='utf-8', newline='').read()
    crlf = '\r\n' in raw
    text = raw.replace('\r\n', '\n')
    pattern = re.compile(r'(// >>> HAND_PHOTOS[^\n]*\n)(.*?)(\n  // <<< HAND_PHOTOS)', re.S)
    if not pattern.search(text):
        sys.exit(f'Không thấy khối HAND_PHOTOS trong {path}')
    text = pattern.sub(lambda m: m.group(1) + block + m.group(3), text)
    if crlf:
        text = text.replace('\n', '\r\n')
    io.open(path, 'w', encoding='utf-8', newline='').write(text)
    print(f'Đã ghi khối HAND_PHOTOS vào {path}:\n{block}')


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='command', required=True)
    p_cut = sub.add_parser('cut', help='tách nền, cắt hai tay, kẻ lưới')
    p_cut.add_argument('photo')
    p_cut.add_argument('--width', type=int, default=460, help='bề ngang tối đa mỗi tay sau thu nhỏ (px)')
    p_cut.add_argument('--out', default=os.path.join(ROOT, 'assets', 'hands'))
    p_cut.set_defaults(func=cut)
    p_anchors = sub.add_parser('anchors', help='ghi toạ độ đầu ngón vào hands.js')
    p_anchors.add_argument('tips')
    p_anchors.add_argument('--out', default=os.path.join(ROOT, 'assets', 'hands'))
    p_anchors.add_argument('--hands', default=os.path.join(ROOT, 'hands.js'))
    p_anchors.set_defaults(func=anchors)
    args = parser.parse_args()
    args.func(args)


if __name__ == '__main__':
    main()
