# GitHub 打包发布与 Chrome Web Store 手动上架

仓库负责自动完成扩展校验、ZIP 打包和 GitHub Release 发布；Chrome Web Store 保持手动上传，不需要在 GitHub 保存商店凭证。

## 自动化范围

- 打包脚本：`scripts/package_extension.sh`
- 产物校验：`scripts/validate_package.sh`
- GitHub Actions：`.github/workflows/github-release.yml`
- 发布产物：扩展 ZIP 与对应的 SHA-256 校验文件

工作流名称为 `Package & GitHub Release`，支持以下触发方式：

- 手动触发且不填写 `release_tag`：校验并打包，在本次 Actions 运行的 Artifacts 中保留 30 天
- 手动触发并填写已有 `release_tag`：从该 Tag 打包并创建或修复对应 GitHub Release
- 推送 `v*` Tag：校验、打包并创建 GitHub Release，永久附加 ZIP 和 SHA-256 文件

该流程不会调用 Chrome Web Store API，也不需要任何 Chrome Web Store Secret。

## 发布前检查

1. 更新 `manifest.json` 中的版本号。
2. 同步 `CHANGELOG.md`、README 和商店文案。
3. 本地执行完整校验：

   ```bash
   ./scripts/validate_package.sh
   ```

4. 检查生成的 `dist/smart-toc-scroll-<version>.zip`。

当前发布基线为 `2.13`。

## 手动打包并下载 Artifact

1. 打开 GitHub 仓库的 `Actions`。
2. 选择 `Package & GitHub Release`。
3. 点击 `Run workflow`。
4. 工作流通过后，从该次运行的 `Artifacts` 下载 ZIP 和 SHA-256 文件。

默认不填写 `release_tag` 时，手动触发只生成 Artifact，不会创建 GitHub Release。如果 Tag 自动发布曾失败，可以填写现有 Tag（例如 `v2.13`）安全重试；工作流会 checkout 该 Tag，确保附件内容与 Tag 对应源码一致。

## 创建 GitHub Release

Tag 必须严格等于 `v` 加上 `manifest.json` 的版本号。例如 Manifest 版本为 `2.13` 时：

```bash
git tag v2.13
git push origin v2.13
```

工作流会拒绝 `v2.14` 与 Manifest `2.13` 这类版本不一致的发布。校验通过后，它会：

1. 检查 JavaScript、Shell 和 Manifest。
2. 创建扩展 ZIP。
3. 检查 ZIP 完整性、必要文件、版本号和意外元数据。
4. 生成 SHA-256 校验文件。
5. 创建 GitHub Release，并自动生成 Release Notes。
6. 将 ZIP 和 SHA-256 文件附加到 Release。

如果同一个 Tag 的工作流被重新运行，现有 Release 的附件会被覆盖，避免重复 Release。Release Job 显式使用当前 GitHub 仓库上下文，不依赖 checkout 目录推断仓库名。

## 本地打包

只生成 ZIP：

```bash
./scripts/package_extension.sh
```

生成 ZIP 并执行完整校验：

```bash
./scripts/validate_package.sh
```

产物位于 `dist/`。

## 手动上传 Chrome Web Store

1. 从 GitHub Release 或 Actions Artifact 下载 ZIP。
2. 可选：使用同名 `.sha256` 文件核对下载完整性。
3. 登录 Chrome Developer Dashboard。
4. 选择扩展条目并上传 ZIP。
5. 更新版本说明、隐私和商店素材后提交审核。

商店文案与素材位于：

- `CHROME_STORE_LISTING.md`
- `output/chrome-store-icons/chrome-store-icon-128.png`
- `output/chrome-store/`

## 权限与安全边界

- 校验和打包 Job 仅使用 `contents: read`。
- 只有 Tag 对应的 GitHub Release Job 使用 `contents: write`。
- 仓库不保存 Chrome Web Store service account、publisher ID 或 extension ID。
- 工作流不安装项目依赖，不执行来自扩展页面的远程代码。
