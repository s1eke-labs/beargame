# 源码恢复与部署基线

2026-10-11 从既有 Site 的官方源码仓库恢复完整源码，恢复位置与 GitHub 工作区分开核对。没有向原 Site 推送源码或重新部署。

- Site：https://beargame.pro736129.chatgpt.site
- 官方保存版本：v56
- 源码提交：`10519cd6fabef5d9993195b74507eaf1f46c4821`
- 发行 revision：`1c54d1eaaa65`
- 恢复构建的 `release-manifest.json` 与该源码提交中的 v56 产物清单逐项一致。

恢复保留完整游戏引擎、界面、原始美术、发布脚本和测试夹具。GitHub 使用现有清洁历史上的新提交，没有导入 Site 的旧提交历史。保留本仓库新增的提交规范和可移植测试导入；排除生成的 dist、托管配置、临时缓存与自动生成的检查报告。

## 发布范围

沿用 v56 的原始正向白名单：仅开放森林家园篇，含 11 种资源、11 种建筑、7 项研究、12 项工坊升级、3 种制作、5 种职业及顺序建造队列。其余聚落、工业、星际、时间篇保持未获准发布状态。详细边界见 [CHAPTER_RELEASES.md](CHAPTER_RELEASES.md)。

产物为 59 个文件：入口、7 个森林运行时模块/样式、50 张独立美术与发布清单。独立审计核对路径、定义闭包、美术 SHA-256、依赖、未开放内容和文件库存。完整源文件及混合图集留在仓库，不进入 dist。

## GitHub Actions

`.github/workflows/deploy-edgeone.yml` 在 master 推送时执行；手动触发也仅接受 master。运行 `npm run verify:release` 后才允许上传 dist。使用与 v56 验证环境一致的 Node 24.19.0、Python 3、固定 Pillow 12.3.0 进行可重复美术检查，EdgeOne CLI 固定 1.6.41。

需要仓库 secret `EDGEONE_API_TOKEN`。项目名来自 `github.event.repository.name`。只读仓库权限、串行部署、不取消正在进行的部署；发布前跳过已被新 master 提交取代的构建。不会输出 token。已有 EdgeOne 项目须支持直接上传。

目标开发测试域名：https://beargame.demo.001208.xyz。域名绑定与 DNS 由用户配置；工作流成功与自定义域名生效应分别确认。

## 外部依据

- [EdgeOne CLI](https://pages.edgeone.ai/document/edgeone-cli)
- [checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1)
- [setup-node v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0)
- [Pillow 12.3.0](https://pypi.org/project/pillow/12.3.0/)

Node 22.23.3 可通过 927 项测试与产物审计，但历史全流程回放的首阶段精确存档比对不一致，因此持续集成保持原验证环境 Node 24.19.0，不放宽断言或重写历史夹具。

## 恢复验收

Node 24.19.0 完整 `npm run verify:release` 通过：927 项测试，15 段历史回放，共 51,106 次合法操作，全部精确存档匹配。独立森林审计通过 59 个白名单文件、59 条本地引用、49 个目录定义及 50 个固定图像哈希；产物有效内容合计 2,662,302 字节（不含发布清单）。未新增浏览器或实机渲染验收。
