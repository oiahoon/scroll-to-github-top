# Chrome Web Store 发布

这个仓库现在已经带上了可复用的自动发布链路，目标是把“打包、上传、提交发布”都放进 GitHub Actions。

## 适用范围

- 已经在 Chrome Web Store 创建过条目的扩展，后续版本发布可以自动化
- 第一次上架通常仍需要先在 Chrome Developer Dashboard 完成商店信息、截图、分类和合规字段

## 当前自动化方案

- 打包脚本：`scripts/package_extension.sh`
- 发布脚本：`scripts/cws_publish.sh`
- GitHub Actions：`.github/workflows/chrome-store-release.yml`

工作流支持两种触发方式：

- 手动触发 `Chrome Store Release`
- 推送 tag：`v*` 或 `V*`

## 一次性准备

### 1. 在 Chrome Developer Dashboard 创建 service account

参考官方文档，为 Chrome Web Store API 创建一个 service account，并把它加入开发者后台可发布该扩展的账号范围。

你需要拿到：

- `publisher_id`
- `extension_id`
- service account JSON key

### 2. 在 GitHub 仓库里配置 secrets

在仓库 `Settings -> Secrets and variables -> Actions` 中添加：

- `CWS_EXTENSION_ID`
- `CWS_PUBLISHER_ID`
- `CWS_SERVICE_ACCOUNT_JSON`

其中 `CWS_SERVICE_ACCOUNT_JSON` 直接保存完整 JSON 内容即可，不需要额外 base64。

## 发布方式

### 手动一键发布

1. 打开 GitHub 仓库的 `Actions`
2. 选择 `Chrome Store Release`
3. 点击 `Run workflow`
4. 选择发布类型：
   - `DEFAULT_PUBLISH`
   - `STAGED_PUBLISH`
5. 如果是 `STAGED_PUBLISH`，可选填写 `deploy_percentage`
6. 如只想先生成 ZIP 产物，打开 `upload_only`

### Tag 自动发布

推送 `v2.3.1` 或 `V2.3.1` 这类 tag 后，工作流会自动：

1. 打包扩展
2. 上传 ZIP 作为 artifact
3. 调用 Chrome Web Store API 上传版本
4. 提交发布

## 本地打包

本地也可以直接运行：

```bash
./scripts/package_extension.sh
```

输出文件会放在 `dist/`。

## 本地发布

如果本机已经准备好环境变量，也可以直接发布：

```bash
export CWS_EXTENSION_ID="your_extension_id"
export CWS_PUBLISHER_ID="your_publisher_id"
export CWS_SERVICE_ACCOUNT_JSON="$(cat service-account.json)"
./scripts/cws_publish.sh
```

## 注意事项

- 第一次上架通常不能完全依赖自动化，商店资料仍需先在 Dashboard 配齐
- `skip_review` 只有在 Chrome Web Store 允许跳过审核时才会生效
- 如果你希望审核通过后先暂不自动上线，可以用 `STAGED_PUBLISH`
- 如果以后要做大用户量灰度，可以再补 `setPublishedDeployPercentage` 链路
- 如果你在 Chrome Web Store 里启用了 verified uploads，后续需要把当前 ZIP 上传流程升级成已签名 CRX 上传流程
- 当前工作流默认会先上传 artifact，便于回查每次实际发布的 ZIP
