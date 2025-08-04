# <img src="https://github.com/user-attachments/assets/933c8b45-a190-4df6-913e-b7c64ad9938b" width="35" alt="AliasVault"> AliasVault
AliasVault是一款隐私优先的密码和电子邮件别名管理器。为你使用的每个网站创建唯一的身份、强密码和随机电子邮件别名。完全端到端加密，内置邮件服务器，且无任何第三方依赖。

[<img src="https://img.shields.io/github/v/release/lanedirt/AliasVault?include_prereleases&logo=github&label=Release">](https://github.com/lanedirt/AliasVault/releases)
[![.NET E2E Tests (with Sharding)](https://github.com/lanedirt/AliasVault/actions/workflows/dotnet-e2e-tests.yml/badge.svg)](https://github.com/lanedirt/AliasVault/actions/workflows/dotnet-e2e-tests.yml)
[<img src="https://img.shields.io/sonar/quality_gate/lanedirt_AliasVault?server=https%3A%2F%2Fsonarcloud.io&label=Sonarcloud&logo=sonarcloud">](https://sonarcloud.io/summary/new_code?id=lanedirt_AliasVault)
[<img src="https://badges.crowdin.net/aliasvault/localized.svg">](https://crowdin.com/project/aliasvault)
[<img alt="Discord" src="https://img.shields.io/discord/1309300619026235422?logo=discord&logoColor=%237289da&label=Discord&color=%237289da">](https://discord.gg/DsaXMTEtpF)

[English](README.md) | 简体中文

<a href="https://app.aliasvault.net">试用云端版本 🔥</a> | <a href="https://aliasvault.net?utm_source=gh-readme">官方网站 </a> | <a href="https://docs.aliasvault.net?utm_source=gh-readme">文档 </a> | <a href="#自托管">自托管说明</a>

⭐ 请在 GitHub 上给我们点星支持，这对我们来说很重要！

## 关于 AliasVault
基于15年的经验打造，AliasVault 是独立、开源、可自行托管且由社区驱动的软件。它是对一个追踪一切的互联网的回应：旨在帮助你重获数字隐私的掌控权，确保你在线安全。

– Leendert de Borst ([@lanedirt](https://github.com/lanedirt)), AliasVault的创始人

## 截图

<table>
    <tr>
        <th align="center">响应式网页应用</th>
        <th align="center">浏览器扩展</th>
    </tr>
    <tr>
        <td align="center">
            <img src="https://github.com/user-attachments/assets/fa5bf64a-704d-4f09-b4e0-0310ab662204" alt="响应式网页应用" />
        </td>
        <td align="center">
            <img src="https://github.com/user-attachments/assets/b5218609-217b-4c8d-8d5d-8c71e19bf057"alt="浏览器扩展" />
		</td>
    </tr>
    <tr>
        <th align="center">原生 iOS 和 Android 应用</th>
        <th align="center">& 更多功能</th>
    </tr>
    <tr>
		<td align="center">
            <img src="https://github.com/user-attachments/assets/5d09ad78-d145-48a1-b8da-c5a1dc708886" alt="原生 iOS 和 Android 应用" />
		</td>
		<td align="center">
           <img src="https://github.com/user-attachments/assets/34fe650d-f08d-4c92-92e0-4e750b7a662a" alt="更多功能" />
        </td>
	</tr>
</table>

## 云端托管
使用 AliasVault 官方云端版本访问 [app.aliasvault.net](https://app.aliasvault.net)。这个获得完全支持的平台始终保持与我们最新版本同步。

AliasVault 可用在：
- [网页端 (通用)](https://app.aliasvault.net)
- [Chrome](https://chromewebstore.google.com/detail/aliasvault/bmoggiinmnodjphdjnmpcnlleamkfedj)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/aliasvault/)
- [Edge](https://microsoftedge.microsoft.com/addons/detail/aliasvault/kabaanafahnjkfkplbnllebdmppdemfo)
- [Safari](https://apps.apple.com/app/id6743163173)

<p>
  <a href="https://apps.apple.com/app/id6745490915" style="display: inline-block; margin-right: 20px;"><img src="https://github.com/user-attachments/assets/bad09b85-2635-4e3e-b154-9f348b88f6d6" style="height: 40px;margin-right:10px;"  alt="Download on the App Store"></a>
  <a href="https://play.google.com/store/apps/details?id=net.aliasvault.app" style="display: inline-block;"><img src="https://github.com/user-attachments/assets/b28979c9-f4b8-4090-8735-e384a7fdaa47" style="height: 40px;" alt="Get it on Google Play"></a>
      <a href="https://f-droid.org/packages/net.aliasvault.app" style="display: inline-block;"><img src="https://github.com/user-attachments/assets/0fb25df1-0ea2-46a6-bfee-a9d70f22a02a" style="height: 40px;" alt="Get it on F-Droid"></a>
</p>

[<img width="700" alt="Screenshot of AliasVault" src="docs/assets/img/screenshot.png">](https://app.aliasvault.net)

## 自托管
为了完全掌控自己的数据，你可以在自己的服务器上自行托管和安装 AliasVault。

### 使用安装脚本安装

此方法使用预构建的 Docker 镜像，对硬件最低要求：

- 具有 root 访问权限的 64 位 Linux 虚拟机（Ubuntu/AlmaLinux）或树莓派
- 最低配置：1 个 vCPU，1GB RAM，16GB 磁盘空间
- Docker ≥ 20.10 且 Docker Compose ≥ 2.0

```bash
# 从最新稳定版下载安装脚本
curl -L -o install.sh https://github.com/lanedirt/AliasVault/releases/latest/download/install.sh

# 使安装脚本可执行并运行它。这将创建 .env 文件，拉取 Docker 镜像，并启动 AliasVault 容器。
chmod +x install.sh
./install.sh install
```

安装脚本将输出可访问的 URL。默认为：
- 客户端: https://localhost
- 管理门户 portal: https://localhost/admin

> 注意：如果想更改默认的 AliasVault 端口，可以在 .env 文件中修改。

## 技术文档
有关安装过程、手动设置说明和其他主题的更多信息，请参阅官方文档网站：
- [技术文档 (docs.aliasvault.net) 📚](https://docs.aliasvault.net)

## 安全架构
<a href="https://docs.aliasvault.net/architecture"><img alt="AliasVault Security Architecture Diagram" src="docs/assets/diagrams/security-architecture/aliasvault-security-architecture-thumb.jpg" width="343"></a>

AliasVault 极其重视安全，并实施了多种措施来保护你的数据：

- 所有敏感用户数据均使用行业标准加密算法进行端到端加密。这包括完整的保险库内容和所有收到的电子邮件。
- 你的主密码永远不会离开你的设备。
- 零知识架构确保服务器永远无法访问你的未加密数据。

有关我们的加密实现和安全架构的详细信息，请参阅以下文档：
- [SECURITY.md](SECURITY.md)
- [安全架构图](https://docs.aliasvault.net/architecture)

## 功能与发展路线图

AliasVault 正在积极开发中，重点关注可用性、安全性和跨平台支持。
主要目标是确保日常任务的健壮可用性，包括在所有平台上提供全面的自动填充功能。

🛠️ 增量版本每 2-3 周发布一次，强调真实环境测试和用户反馈。
在此阶段，AliasVault 可以安全地用于生产环境，因为它保持严格的数据完整性和自动迁移保证。

正在开发的核心功能：

- [x] 核心密码和别名管理
- [x] 完整的端到端加密
- [x] 用于别名的内置邮件服务器
- [x] 简便的自托管安装程序
- [x] 浏览器扩展（含自动填充功能）（Chrome, Firefox, Edge, Safari, Brave）
- [x] 内置 TOTP 验证器
- [x] 从传统密码管理器导入密码
- [x] iOS 原生应用
- [x] Android 原生应用
- [x] 在浏览器扩展中编辑
- [x] 所有客户端应用的多语言支持
- [ ] 数据模型和可用性改进（更灵活的别名和凭据类型、文件夹支持、批量选择等）
- [ ] 支持 FIDO2/WebAuthn 硬件密钥和通行密钥 (passkeys)
- [ ] 添加家庭/团队共享支持（组织功能

👉 [在此处查看完整的 AliasVault 发展线路图](https://github.com/lanedirt/AliasVault/issues/731)

### 有反馈或想法？
欢迎提交 Issue 或加入我们的 [Discord](https://discord.gg/DsaXMTEtpF)! 热烈欢迎各种形式的贡献——无论是功能开发、测试还是推广。如果你有兴趣贡献，请在 Discord 上联系我们。

### 支持我们
你的捐赠有助于我们投入更多时间和资源来改进 AliasVault，让互联网对每个人来说都更安全！


<a href="https://www.buymeacoffee.com/lanedirt" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 50px !important;" ></a>
