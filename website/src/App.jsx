import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowsOutLineVertical,
  BookOpenText,
  Browser,
  CaretDown,
  Check,
  Code,
  Command,
  GithubLogo,
  List,
  LockKey,
  Moon,
  MouseSimple,
  Palette,
  Question,
  ShieldCheck,
  Sparkle,
  Sun,
  X,
} from "@phosphor-icons/react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

const STORE_URL =
  "https://chromewebstore.google.com/detail/smart-toc-scroll/hkpdpioemdlpimimpjghlcdocmjmpkjc";
const REPO_URL = "https://github.com/oiahoon/scroll-to-github-top";
const RELEASE_URL = `${REPO_URL}/releases/latest`;
const ISSUE_URL = `${REPO_URL}/issues/new/choose`;

const navItems = [
  ["/", "首页"],
  ["/features", "功能"],
  ["/modes", "阅读模式"],
  ["/guide", "使用指南"],
  ["/privacy", "隐私"],
  ["/support", "支持"],
];

const featureGroups = [
  {
    icon: BookOpenText,
    eyebrow: "READING POSITION",
    title: "始终知道自己读到哪里",
    description:
      "自动识别正文标题、构建层级目录，并随滚动高亮当前章节。长文、文档和仓库说明都能快速跳转。",
  },
  {
    icon: ArrowsOutLineVertical,
    eyebrow: "BARCODE",
    title: "把进度压缩到页面边缘",
    description:
      "透明 rail 用短横线表达文章结构。只有靠近时才展开标题线索，默认状态几乎不占阅读空间。",
  },
  {
    icon: Palette,
    eyebrow: "ADAPTIVE SURFACE",
    title: "跟随页面，而不是覆盖页面",
    description:
      "根据页面与 rail 附近背景自动选择对比度，在明暗内容上都保持克制、清晰和可读。",
  },
  {
    icon: Command,
    eyebrow: "KEYBOARD",
    title: "鼠标和键盘都顺手",
    description:
      "支持 Esc、方向键、Home、End 与明确焦点态；减少动态效果偏好也会被尊重。",
  },
  {
    icon: Sparkle,
    eyebrow: "DYNAMIC PAGES",
    title: "适应 GitHub 与 SPA 页面",
    description:
      "页面内导航或内容更新后自动重建目录，不需要每次切页都手动刷新。",
  },
  {
    icon: ShieldCheck,
    eyebrow: "LOCAL FIRST",
    title: "正文分析留在本机",
    description:
      "扩展在浏览器内识别页面结构，不上传正文内容；设置通过 Chrome 的扩展存储 API 保存。",
  },
];

function ExternalLink({ href, className = "", children, label }) {
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
    >
      {children}
    </a>
  );
}

function ScrollManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    const pageMeta = {
      "/": ["Smart TOC & Scroll — 不打扰的长页面阅读导航", "为长文章、文档和 GitHub 页面提供自适应目录、Barcode 阅读进度、标题预览与快速回顶。"],
      "/features": ["功能 — Smart TOC & Scroll", "了解 Smart TOC & Scroll 的目录识别、Barcode、主题自适应、键盘导航与本地处理能力。"],
      "/modes": ["阅读模式 — Smart TOC & Scroll", "探索标准目录面板，以及 Wheel、Spotlight、GPT 三种 Barcode 标题预览。"],
      "/guide": ["使用指南 — Smart TOC & Scroll", "安装并设置 Smart TOC & Scroll，快速开始长页面阅读导航。"],
      "/privacy": ["隐私 — Smart TOC & Scroll", "了解 Smart TOC & Scroll 的本地页面分析、扩展权限与设置存储方式。"],
      "/support": ["支持 — Smart TOC & Scroll", "查看常见问题、版本下载，并向 Smart TOC & Scroll 提交建议或问题。"],
    };
    const [title, description] = pageMeta[pathname] || ["页面未找到 — Smart TOC & Scroll", "返回 Smart TOC & Scroll 官网继续浏览。"];
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function SiteHeader({ theme, onThemeChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="Smart TOC & Scroll 首页">
          <img src={`${import.meta.env.BASE_URL}brand/icon128.png`} alt="" />
          <span>
            Smart TOC <i>&</i> Scroll
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="主导航">
          {navItems.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <button
            className="icon-button"
            type="button"
            onClick={onThemeChange}
            aria-label={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"}
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <ExternalLink className="button button-small desktop-install" href={STORE_URL}>
            添加到 Chrome
          </ExternalLink>
          <button
            className="icon-button mobile-menu-button"
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? "关闭导航" : "打开导航"}
          >
            {menuOpen ? <X size={22} /> : <List size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-navigation" className="mobile-nav" aria-label="移动端导航">
          {navItems.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              {label}
              <ArrowRight size={18} />
            </NavLink>
          ))}
          <ExternalLink className="button" href={STORE_URL}>
            添加到 Chrome <ArrowRight size={17} />
          </ExternalLink>
        </nav>
      )}
    </header>
  );
}

function PageIntro({ eyebrow, title, description, children }) {
  return (
    <section className="page-intro section-shell">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="page-description">{description}</p>
      {children}
    </section>
  );
}

function ProductFrame({ src, alt, label, priority = false }) {
  return (
    <figure className="product-frame">
      <div className="frame-bar">
        <span className="frame-dot" />
        <span className="frame-dot" />
        <span className="frame-dot" />
        <span className="frame-label">{label}</span>
      </div>
      <img src={`${import.meta.env.BASE_URL}${src}`} alt={alt} loading={priority ? "eager" : "lazy"} />
    </figure>
  );
}

function ModePreview() {
  const modes = [
    {
      id: "barcode",
      label: "Barcode",
      title: "安静时只是进度，靠近时才给出方向",
      description:
        "透明 rail 贴近阅读边缘，短横线代表章节。当前段落与附近标题在 hover 时自然显形。",
      image: "product/02-right-rail-hover-preview.png",
      alt: "深色长文章右侧的 Barcode 阅读进度 rail 与标题预览",
    },
    {
      id: "standard",
      label: "标准目录",
      title: "结构复杂时，展开一张完整地图",
      description:
        "完整目录面板保留层级、当前章节和快速回顶，适合文档、教程和技术内容。",
      image: "product/01-standard-toc-panel.png",
      alt: "浅色长文章右侧展开的标准目录面板",
    },
    {
      id: "adaptive",
      label: "自适应",
      title: "同一套导航，自然融入明暗页面",
      description:
        "局部背景采样只调整必要的对比度，不给 rail 强加一块笨重的固定底板。",
      image: "product/04-light-page-adaptive-rail.png",
      alt: "浅色长文章右侧的自适应 Barcode rail",
    },
  ];
  const [activeId, setActiveId] = useState("barcode");
  const active = modes.find((mode) => mode.id === activeId);

  return (
    <section className="mode-preview section-shell" aria-labelledby="mode-preview-title">
      <div className="section-heading split-heading">
        <div>
          <p className="eyebrow">TWO NAVIGATION STYLES</p>
          <h2 id="mode-preview-title">按内容密度选择阅读方式</h2>
        </div>
        <Link className="text-link" to="/modes">
          查看全部模式 <ArrowRight size={17} />
        </Link>
      </div>
      <div className="mode-grid">
        <div className="mode-copy">
          <div className="segmented-control" role="tablist" aria-label="阅读导航预览">
            {modes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={mode.id === activeId}
                onClick={() => setActiveId(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <div className="mode-copy-content" aria-live="polite">
            <h3>{active.title}</h3>
            <p>{active.description}</p>
          </div>
        </div>
        <ProductFrame src={active.image} alt={active.alt} label={`${active.label} · Smart TOC`} />
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <>
      <main>
        <section className="hero section-shell">
          <div className="hero-copy">
            <div className="version-chip">
              <span>v2.13</span>
              为长文而生的阅读导航
            </div>
            <h1>
              给长页面一条
              <span>不打扰的阅读路径。</span>
            </h1>
            <p className="hero-description">
              Smart TOC & Scroll 自动生成目录、标记阅读位置，并用轻量 Barcode rail
              帮你在文章、文档和 GitHub 长页面中快速找到方向。
            </p>
            <div className="button-row">
              <ExternalLink className="button button-primary" href={STORE_URL}>
                <Browser size={20} weight="bold" /> 添加到 Chrome
              </ExternalLink>
              <Link className="button button-secondary" to="/modes">
                探索阅读模式 <ArrowRight size={18} />
              </Link>
            </div>
            <p className="hero-note">
              <Check size={16} weight="bold" /> 免费使用 · 正文内容不上传 · Manifest V3
            </p>
          </div>

          <div className="hero-visual">
            <ProductFrame
              src="product/02-right-rail-hover-preview.png"
              alt="Smart TOC & Scroll 在深色长文章右侧显示 Barcode 阅读进度和当前标题"
              label="Barcode · Wheel · Adaptive surface"
              priority
            />
            <div className="hero-caption">
              <span className="live-dot" />
              当前章节在页面边缘保持可见
            </div>
          </div>
        </section>

        <section className="proof-strip" aria-label="产品能力概览">
          <div className="section-shell proof-grid">
            <div><strong>2</strong><span>种导航形态</span></div>
            <div><strong>3</strong><span>种 Barcode 预览</span></div>
            <div><strong>0</strong><span>正文云端上传</span></div>
            <div><strong>MV3</strong><span>Chrome 扩展架构</span></div>
          </div>
        </section>

        <section className="feature-overview section-shell">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">BUILT AROUND READING</p>
              <h2>少一点滚动迷失，多一点位置感</h2>
            </div>
            <p>
              只在需要时出现，尽量避开网页已有目录和回顶控件，让导航成为阅读的一部分。
            </p>
          </div>
          <div className="feature-card-grid feature-card-grid-three">
            {featureGroups.slice(0, 3).map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </section>

        <ModePreview />

        <section className="local-callout section-shell">
          <div className="local-icon"><LockKey size={30} weight="duotone" /></div>
          <div>
            <p className="eyebrow">LOCAL-FIRST BY DESIGN</p>
            <h2>读什么，留在你的浏览器里。</h2>
            <p>
              标题识别和阅读位置计算在当前页面内完成。扩展不需要账户，也不会把页面正文发送到远端服务。
            </p>
          </div>
          <Link className="button button-secondary" to="/privacy">
            查看隐私说明 <ArrowRight size={18} />
          </Link>
        </section>

        <InstallBanner />
      </main>
    </>
  );
}

function FeatureCard({ icon: Icon, eyebrow, title, description }) {
  return (
    <article className="feature-card">
      <div className="feature-icon"><Icon size={24} weight="duotone" /></div>
      <p className="card-eyebrow">{eyebrow}</p>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

function FeaturesPage() {
  return (
    <main>
      <PageIntro
        eyebrow="FEATURES"
        title="导航更聪明，界面更安静。"
        description="从标题识别、当前位置追踪到 SPA 页面更新，所有能力都围绕一个目标：不打断内容，也不让你在长页面里迷路。"
      />
      <section className="section-shell feature-card-grid">
        {featureGroups.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </section>
      <section className="section-shell detail-split">
        <ProductFrame
          src="product/05-options-reading-navigation.png"
          alt="Smart TOC & Scroll 阅读导航设置页"
          label="Options · Reading navigation"
        />
        <div className="detail-copy">
          <p className="eyebrow">YOUR READING, YOUR RULES</p>
          <h2>把选择留给你，把复杂度留在设置页。</h2>
          <ul className="check-list">
            <li><Check size={18} weight="bold" /> 标准目录与 Barcode 两种导航类型</li>
            <li><Check size={18} weight="bold" /> Wheel、Spotlight、GPT 三种标题预览</li>
            <li><Check size={18} weight="bold" /> 显示阈值、左右位置与禁用域名</li>
            <li><Check size={18} weight="bold" /> 自动避开已有目录，也可强制显示</li>
            <li><Check size={18} weight="bold" /> 明暗系统配色与明确保存状态</li>
          </ul>
          <Link className="text-link" to="/guide">
            阅读设置指南 <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      <InstallBanner />
    </main>
  );
}

const barcodeModes = [
  {
    id: "wheel",
    number: "01",
    title: "Wheel / 滚轮",
    description: "标题 track 在固定观察窗内滚动，鼠标沿 rail 移动时像机械表日期窗一样切换焦点。",
  },
  {
    id: "spotlight",
    number: "02",
    title: "Spotlight / 聚光灯",
    description: "标题列保持稳定，只用亮度与轻微缩放移动焦点；附近 1–2 项自然渐隐。",
  },
  {
    id: "gpt",
    number: "03",
    title: "GPT / 完整面板",
    description: "hover 后展开可滚动标题面板，支持单一 Tab 停靠点与方向键、Home、End 导航。",
  },
];

function ModesPage() {
  const [selected, setSelected] = useState("wheel");
  const active = barcodeModes.find((mode) => mode.id === selected);

  return (
    <main>
      <PageIntro
        eyebrow="READING MODES"
        title="内容不同，导航也应该不同。"
        description="需要全貌时展开标准目录；想保持沉浸时选择 Barcode。两种形态共享相同的标题识别、当前位置和快速跳转能力。"
      />

      <section className="section-shell mode-feature mode-feature-dark">
        <div className="mode-feature-copy">
          <span className="mode-index">01</span>
          <p className="eyebrow">STANDARD TOC PANEL</p>
          <h2>一眼看清整篇结构。</h2>
          <p>
            适合文档、教程和章节密集的内容。面板保留标题层级、当前章节高亮与 Top 操作，点击标题即可平滑跳转。
          </p>
          <ul className="plain-list">
            <li>自动层级缩进</li><li>当前章节跟随</li><li>悬停、点击或长按展开</li>
          </ul>
        </div>
        <ProductFrame
          src="product/01-standard-toc-panel.png"
          alt="标准目录面板显示文章章节层级和当前章节"
          label="Standard TOC panel"
        />
      </section>

      <section className="section-shell mode-feature">
        <div className="mode-feature-copy">
          <span className="mode-index">02</span>
          <p className="eyebrow">BARCODE</p>
          <h2>把文章结构收进一条边缘 rail。</h2>
          <p>
            idle 状态仅保留透明 rail 和章节短横线；靠近或聚焦后，wave 与标题预览才出现。
          </p>
          <div className="mode-selector" role="listbox" aria-label="Barcode 标题预览模式">
            {barcodeModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                role="option"
                className={selected === mode.id ? "is-selected" : ""}
                onClick={() => setSelected(mode.id)}
                aria-selected={selected === mode.id}
              >
                <span>{mode.number}</span>{mode.title}
              </button>
            ))}
          </div>
          <div className="selected-mode-copy" aria-live="polite">
            <strong>{active.title}</strong>
            <p>{active.description}</p>
          </div>
        </div>
        <ProductFrame
          src="product/02-right-rail-hover-preview.png"
          alt="Barcode 模式在深色长文章右侧显示阅读进度和标题预览"
          label={`Barcode · ${active.title.split(" /")[0]}`}
        />
      </section>

      <section className="section-shell mode-feature mode-feature-reverse">
        <div className="mode-feature-copy">
          <span className="mode-index">03</span>
          <p className="eyebrow">LEFT, RIGHT, LIGHT, DARK</p>
          <h2>放在顺手的一侧，融入当前页面。</h2>
          <p>
            rail 可以放在左侧或右侧。局部 surface 采样让短横线、回顶按钮和标题预览在不同背景上保持可读。
          </p>
        </div>
        <ProductFrame
          src="product/03-left-rail-hover-preview.png"
          alt="Barcode rail 在长文章左侧显示并向内容外展开标题"
          label="Barcode · Left rail"
        />
      </section>
      <InstallBanner />
    </main>
  );
}

const guideSteps = [
  {
    number: "01",
    title: "从 Chrome Web Store 安装",
    description: "点击“添加到 Chrome”并确认安装。扩展会在包含足够标题和滚动距离的长页面上自动工作。",
  },
  {
    number: "02",
    title: "选择导航类型",
    description: "在扩展管理页打开“扩展程序选项”，选择标准目录面板或 Barcode，并设置标题预览模式。",
  },
  {
    number: "03",
    title: "按自己的阅读习惯微调",
    description: "设置出现阈值、左右位置、禁用域名，以及是否避开页面已有的目录或回顶控件。",
  },
  {
    number: "04",
    title: "开始阅读与跳转",
    description: "hover 或聚焦导航，点击标题跳转；使用 Top 按钮返回页面顶部。设置会自动保存到 Chrome 扩展存储。",
  },
];

function GuidePage() {
  return (
    <main>
      <PageIntro
        eyebrow="GET STARTED"
        title="四步，把长页面变成可导航的阅读空间。"
        description="默认设置已经适合大多数长文。需要时再调整位置、阈值和预览方式，不必为每个网站重复配置。"
      >
        <div className="button-row intro-actions">
          <ExternalLink className="button button-primary" href={STORE_URL}>
            <Browser size={20} weight="bold" /> 安装扩展
          </ExternalLink>
          <ExternalLink className="button button-secondary" href={RELEASE_URL}>
            <GithubLogo size={20} /> 手动下载
          </ExternalLink>
        </div>
      </PageIntro>

      <section className="section-shell guide-layout">
        <ol className="steps-list">
          {guideSteps.map((step) => (
            <li key={step.number}>
              <span>{step.number}</span>
              <div><h2>{step.title}</h2><p>{step.description}</p></div>
            </li>
          ))}
        </ol>
        <aside className="shortcut-card">
          <p className="eyebrow">KEYBOARD QUICK GUIDE</p>
          <h2>不离开键盘，也能移动。</h2>
          <dl>
            <div><dt><kbd>Esc</kbd></dt><dd>收起固定展开的面板</dd></div>
            <div><dt><kbd>↑</kbd><kbd>↓</kbd></dt><dd>在标题间移动</dd></div>
            <div><dt><kbd>Home</kbd><kbd>End</kbd></dt><dd>跳到首项或末项</dd></div>
            <div><dt><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>P</kbd></dt><dd>切换性能统计面板</dd></div>
          </dl>
        </aside>
      </section>

      <section className="section-shell guide-note">
        <Question size={24} weight="duotone" />
        <div><h2>没有出现导航？</h2><p>确认页面有至少 3 个标题并已滚动 1 屏；也可以在 Options 中降低阈值或开启“始终显示”。</p></div>
        <Link className="text-link" to="/support">查看排查方法 <ArrowRight size={17} /></Link>
      </section>
    </main>
  );
}

function PrivacyPage() {
  return (
    <main>
      <PageIntro
        eyebrow="PRIVACY"
        title="页面内容用于导航，不用于收集。"
        description="Smart TOC & Scroll 的标题识别、当前位置追踪与主题适配都在浏览器页面内完成。下面清楚说明扩展使用的权限和存储。"
      />
      <section className="section-shell privacy-summary">
        <div><ShieldCheck size={34} weight="duotone" /><h2>不会上传页面正文</h2><p>扩展不包含远端内容分析服务，也不需要创建账户。</p></div>
        <div><LockKey size={34} weight="duotone" /><h2>不会出售用户数据</h2><p>产品没有广告追踪、用户画像或数据交易逻辑。</p></div>
        <div><Browser size={34} weight="duotone" /><h2>设置由 Chrome 保存</h2><p>偏好通过扩展 storage API 保存；如果浏览器启用同步，设置可能随 Chrome 账户同步。</p></div>
      </section>

      <section className="section-shell policy-layout">
        <article>
          <p className="eyebrow">PERMISSIONS</p>
          <h2>为什么需要这些权限</h2>
          <div className="policy-row"><code>activeTab</code><div><h3>当前标签页</h3><p>用于在你正在阅读的页面中提供导航体验。</p></div></div>
          <div className="policy-row"><code>storage</code><div><h3>扩展设置</h3><p>保存导航类型、显示阈值、位置和禁用域名等偏好。</p></div></div>
          <div className="policy-row"><code>&lt;all_urls&gt;</code><div><h3>在长页面上工作</h3><p>扩展需要读取不同网站的页面标题结构，才能生成目录与当前位置。</p></div></div>
        </article>
        <article>
          <p className="eyebrow">DATA FLOW</p>
          <h2>扩展会处理什么</h2>
          <ul className="check-list">
            <li><Check size={18} weight="bold" /> 页面标题文字与层级</li>
            <li><Check size={18} weight="bold" /> 当前滚动位置与可见章节</li>
            <li><Check size={18} weight="bold" /> 页面背景颜色与布局位置</li>
            <li><Check size={18} weight="bold" /> 你在 Options 中保存的偏好</li>
          </ul>
          <p className="policy-footnote">
            这些信息用于当前页面的导航与显示，不会由扩展发送到开发者服务器。
          </p>
        </article>
      </section>

      <section className="section-shell policy-contact">
        <div><p className="eyebrow">QUESTIONS</p><h2>对权限或隐私仍有疑问？</h2><p>可以在 GitHub 提交问题并查看公开代码。</p></div>
        <ExternalLink className="button button-secondary" href={ISSUE_URL}>联系与反馈 <ArrowRight size={18} /></ExternalLink>
      </section>
    </main>
  );
}

const faqs = [
  ["为什么短页面没有出现导航？", "默认需要页面达到最少标题数与滚动距离。可以在 Options 中调整“最少标题”和“滚动屏数”，或开启强制显示。"],
  ["为什么某些网站会自动跳过？", "扩展会检测页面已有的目录或回顶控件，避免重复干扰。可在兼容策略中关闭自动避让。"],
  ["Barcode 的三个预览有什么区别？", "Wheel 强调沿 rail 滚动的焦点；Spotlight 展示当前可见标题并渐隐邻项；GPT 展开完整、可滚动且支持键盘的标题面板。"],
  ["动态页面切换后还会更新吗？", "会。扩展监听常见 SPA 生命周期、DOM 变化以及 GitHub 的页面导航事件，在内容结构变化后重建目录。"],
  ["扩展会上传我阅读的内容吗？", "不会。页面结构识别在本地浏览器完成，正文不会发送到开发者服务器。"],
];

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span>{question}</span><CaretDown size={20} className={open ? "is-open" : ""} />
      </button>
      {open && <p>{answer}</p>}
    </div>
  );
}

function SupportPage() {
  return (
    <main>
      <PageIntro
        eyebrow="SUPPORT"
        title="快速找到答案，或者直接找到我们。"
        description="先检查显示阈值、已有控件避让与站点禁用设置。仍有问题时，请带上页面地址、复现步骤和使用的导航模式提交 Issue。"
      >
        <div className="button-row intro-actions">
          <ExternalLink className="button button-primary" href={ISSUE_URL}><GithubLogo size={20} weight="bold" /> 提交 Issue</ExternalLink>
          <ExternalLink className="button button-secondary" href={REPO_URL}><Code size={20} /> 查看源代码</ExternalLink>
        </div>
      </PageIntro>
      <section className="section-shell support-grid">
        <article><MouseSimple size={28} weight="duotone" /><h2>功能请求</h2><p>描述你在哪类页面遇到什么阅读问题，以及期望的交互方式。</p><ExternalLink className="text-link" href={`${REPO_URL}/issues/new?template=feature_request.md`}>提出建议 <ArrowRight size={17} /></ExternalLink></article>
        <article><Code size={28} weight="duotone" /><h2>问题报告</h2><p>附上 Chrome 版本、扩展模式、页面地址和最短复现步骤。</p><ExternalLink className="text-link" href={ISSUE_URL}>报告问题 <ArrowRight size={17} /></ExternalLink></article>
        <article><GithubLogo size={28} weight="duotone" /><h2>版本与下载</h2><p>从 GitHub Releases 获取最新 ZIP、校验文件和完整变更记录。</p><ExternalLink className="text-link" href={RELEASE_URL}>查看 Releases <ArrowRight size={17} /></ExternalLink></article>
      </section>
      <section className="section-shell faq-section">
        <div className="section-heading"><p className="eyebrow">FAQ</p><h2>常见问题</h2></div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => <FaqItem key={question} question={question} answer={answer} />)}
        </div>
      </section>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="not-found section-shell">
      <p className="eyebrow">404 · OFF THE OUTLINE</p>
      <h1>这一节不在目录里。</h1>
      <p>返回首页，继续探索 Smart TOC & Scroll。</p>
      <Link className="button button-primary" to="/">回到首页 <ArrowRight size={18} /></Link>
    </main>
  );
}

function InstallBanner() {
  return (
    <section className="install-banner section-shell">
      <div>
        <p className="eyebrow">READY FOR THE NEXT LONG READ?</p>
        <h2>让下一篇长文，自带方向感。</h2>
        <p>安装 Smart TOC & Scroll，目录、进度与快速回顶会在需要时出现。</p>
      </div>
      <ExternalLink className="button button-light" href={STORE_URL}>
        添加到 Chrome <ArrowRight size={18} />
      </ExternalLink>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="section-shell footer-grid">
        <div className="footer-brand">
          <Link className="brand" to="/"><img src={`${import.meta.env.BASE_URL}brand/icon128.png`} alt="" /><span>Smart TOC <i>&</i> Scroll</span></Link>
          <p>Adaptive reading navigation for long articles, docs, and GitHub pages.</p>
        </div>
        <div><strong>产品</strong><Link to="/features">功能</Link><Link to="/modes">阅读模式</Link><Link to="/guide">使用指南</Link></div>
        <div><strong>信任</strong><Link to="/privacy">隐私</Link><Link to="/support">支持</Link><ExternalLink href={REPO_URL}>GitHub</ExternalLink></div>
        <div><strong>获取</strong><ExternalLink href={STORE_URL}>Chrome Web Store</ExternalLink><ExternalLink href={RELEASE_URL}>GitHub Releases</ExternalLink><ExternalLink href={`${REPO_URL}/blob/master/CHANGELOG.md`}>更新日志</ExternalLink></div>
      </div>
      <div className="section-shell footer-bottom"><span>© 2026 Smart TOC & Scroll</span><span>Open source under MIT License</span></div>
    </footer>
  );
}

function AppShell() {
  const [theme, setTheme] = useState(() => localStorage.getItem("smart-toc-site-theme") || "light");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("smart-toc-site-theme", theme);
  }, [theme]);

  const routes = useMemo(() => (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/modes" element={<ModesPage />} />
      <Route path="/guide" element={<GuidePage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  ), []);

  return (
    <div className="app-shell">
      <ScrollManager />
      <SiteHeader theme={theme} onThemeChange={() => setTheme(theme === "dark" ? "light" : "dark")} />
      {routes}
      <SiteFooter />
    </div>
  );
}

export function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";
  return <BrowserRouter basename={basename}><AppShell /></BrowserRouter>;
}
