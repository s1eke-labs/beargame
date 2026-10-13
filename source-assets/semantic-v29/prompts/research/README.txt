原始研究图集由内置 image_gen 生成，经过多次迭代以简化手绘风格、缩小独立图案并处理透明度。
research-atlas.png：1536 x 1024 RGBA。六列四行，单元格 256 x 256，逐行顺序记录于 ordered-keys.json。
全部 24 个预期图案均存在。无建筑、房屋或小熊。以 alpha > 50 为可见阈值检查，所有内部单元格边界均透明；共有 1,185,095 个像素的 alpha 严格为零。部分图片查看器会把透明像素中的 RGB 显示成彩色薄雾，请使用正常的透明度合成。
初始生成提示词记录在 prompt.txt。最终编辑要求：Background extraction ONLY. Remove the complete background from this 24-icon atlas, including ALL blurred color haze, ALL shadows and all white canvas. Preserve every icon's exact size and exact position. Output a genuinely transparent PNG, with alpha exactly zero for every pixel not belonging to one of the actual outlined icon objects. No faded background, no shadows, no gradients. Precisely retain all 24 icons on 1536x1024 canvas. Do not enlarge or shift any icon.
