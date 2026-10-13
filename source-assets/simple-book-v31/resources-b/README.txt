使用内置 image_gen 工具生成，以 reference-bears-atlas.webp 为风格基准。最终 PNG 保留生成的透明通道，不做改动。

semantic-resources-b.png：1536x1024，6 列 x 4 行，全部 24 个主体身份和逐行位置保持不变。修正去除了意外出现的斑马角与反光。图片查看器可能显示透明通道下面的 RGB 数据；图标外彩色 RGB 的 alpha 为零或近零，因此实际不可见。不要将图片合并到背景上。裁剪／打包须正确处理透明通道。

semantic-resources-extra.png：1254x1254，2 列 x 2 行。逐行顺序为 tanker、megalith、karma、burnedParagon。当前运行时额外资源图集为 1536x256，请用现有打包器将这四个源单元格重新打包到前四个运行时槽位。

resources-atlas.png：1254x1254，4 列 x 4 行，严格保留旧图集逐行语义顺序。第 3 行第 2 列包含正确的参考白熊。

集成时使用 source-crops.json。它替代 asset-manifest.json 中最初固定单元格裁剪框：当前裁剪基于全图连通分量，包含分离元素，并额外增加 4px 抗锯齿留白。源网格边界不再截断这些矩形。source-crops-audit.json 记录方法和全部分量边界。由于轮廓现在更大、更简单，已有运行时裁剪需要更新。全部准确提示词（包括 B 图集修正提示词）均与输出素材一同存放。

当次生成未修改仓库文件，未执行部署。
