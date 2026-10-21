# Maison Chenille — site v1

纯静态单页，没有构建步骤。

文件
- index.html            首页（六个区块）
- mentions-legales.html 法律页
- style.css             样式；颜色和字体都在顶部的 :root 里
- assets/               logo 与图标

上线前要改的地方（在 index.html 里搜 TODO）
1. 三处社媒链接 href="#" 换成你的账号地址（页眉一组、页脚一组）
2. ~~表单 action~~ 已接 Formspree（表单「Maison Chenille — Lancement」，id mljgqjze；提交后跳到 merci.html / en/thanks.html）
3. mentions-legales.html 里填姓名、地址，托管商二选一
4. 有了照片之后换掉 hero / kit / about 三处的占位图

本地预览：双击 index.html 就行。
部署：推到 GitHub → Cloudflare Pages 连接仓库 → 框架选 None → Custom domain 加 maisonchenille.fr。
