import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const requiredDirectories = [
  '.agents/skills', 'design/prototypes', 'docs', 'apps/web/src',
  'apps/desktop/src', 'apps/desktop/src-tauri',
  'services/backend/src/main/java', 'services/backend/src/main/resources',
  'services/backend/src/test/java', 'database/schema',
  'database/migrations', 'scripts',
];
for (const path of requiredDirectories) {
  const target = resolve(root, path);
  if (!existsSync(target) || !statSync(target).isDirectory()) {
    errors.push(`缺少目录：${path}`);
  }
}

const expectedPackages = new Map([
  ['.', 'diwork-app'],
  ['apps/web', '@diwork/web'],
  ['apps/desktop', '@diwork/desktop'],
  ...['ui', 'features', 'api-client', 'types', 'platform'].map(name => [
    `packages/${name}`, `@diwork/${name}`,
  ]),
]);
for (const [directory, name] of expectedPackages) {
  try {
    const manifest = JSON.parse(readFileSync(resolve(root, directory, 'package.json'), 'utf8'));
    if (manifest.name !== name || manifest.private !== true) {
      errors.push(`${directory}/package.json 的名称或 private 标记错误`);
    }
    if (directory.startsWith('packages/') && !existsSync(resolve(root, directory, 'src'))) {
      errors.push(`缺少源码目录：${directory}/src`);
    }
  } catch (error) {
    errors.push(`${directory}/package.json 无法读取：${error.message}`);
  }
}

const requiredFiles = [
  'README.md', 'AGENTS.md', '.gitignore', '.editorconfig', '.gitattributes',
  'docs/product.md', 'docs/technical.md', 'docs/mvp.md',
];
for (const path of requiredFiles) {
  if (!existsSync(resolve(root, path))) errors.push(`缺少文件：${path}`);
}
try {
  const workspace = readFileSync(resolve(root, 'pnpm-workspace.yaml'), 'utf8');
  for (const glob of ['apps/*', 'packages/*']) {
    if (!workspace.includes(`'${glob}'`)) errors.push(`工作区缺少：${glob}`);
  }
} catch (error) {
  errors.push(`无法读取工作区配置：${error.message}`);
}

// 仅检查本仓库 Markdown 中的相对文件链接；不请求网络或验证标题锚点。
const excluded = new Set([
  '.git', 'node_modules', '.runtime', 'dist', 'build', 'target', 'coverage',
  '.pnpm-store', '.venv', '.idea', '.vscode', 'logs', 'backups', 'data',
]);
let documents = 0;
function checkDocuments(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      if (!excluded.has(entry.name)) checkDocuments(path);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    documents++;
    const markdown = readFileSync(path, 'utf8').replace(/```[\s\S]*?```/g, '');
    for (const match of markdown.matchAll(/\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
      const link = match[1];
      if (/^(?:[a-z][a-z\d+.-]*:|#|\/\/)/i.test(link)) continue;
      try {
        const target = resolve(dirname(path), decodeURIComponent(link.split(/[?#]/)[0]));
        const inside = relative(root, target);
        if (inside === '..' || inside.startsWith(`..${sep}`)) {
          errors.push(`${relative(root, path)} 链接越出仓库：${link}`);
        } else if (!existsSync(target)) {
          errors.push(`${relative(root, path)} 链接失效：${link}`);
        }
      } catch (error) {
        errors.push(`${relative(root, path)} 链接格式错误：${link} (${error.message})`);
      }
    }
  }
}
checkDocuments(root);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`结构检查通过：${requiredDirectories.length} 个预留目录、${expectedPackages.size} 个工作区描述、${documents} 份 Markdown 文档。`);
  console.log('此结果仅验证仓库骨架，不代表应用构建或业务测试通过。');
}
